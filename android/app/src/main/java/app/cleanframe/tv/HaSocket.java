package app.cleanframe.tv;

import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

import javax.net.ssl.SSLSocketFactory;

/**
 * A minimal WebSocket client (RFC 6455) for Home Assistant's /api/websocket.
 * Text frames only, which is all Home Assistant sends; pings are answered and the read loop
 * runs on its own thread. Shore needs it for camera signalling, so it stays small rather than
 * pulling in a networking library.
 */
final class HaSocket {
    interface Listener {
        void message(String text);
        /** Called once, when the connection fails or closes for any reason. */
        void closed(String reason);
    }

    private static final int MAX_MESSAGE = 4 * 1024 * 1024;
    private final SecureRandom random = new SecureRandom();
    private final Listener listener;
    private volatile Socket socket;
    private volatile boolean closed;
    private OutputStream out;

    private HaSocket(Listener listener) { this.listener = listener; }

    /** Connects in the background to base + "/api/websocket" (http becomes ws, https becomes wss). */
    static HaSocket open(String base, Listener listener) {
        HaSocket s = new HaSocket(listener);
        new Thread(() -> s.run(base), "shore-ha-socket").start();
        return s;
    }

    synchronized void send(String text) {
        if (closed || out == null) return;
        try {
            byte[] data = text.getBytes(StandardCharsets.UTF_8), mask = new byte[4];
            random.nextBytes(mask);
            ByteArrayOutputStream frame = new ByteArrayOutputStream(data.length + 14);
            frame.write(0x81); // FIN, text
            if (data.length < 126) frame.write(0x80 | data.length);
            else if (data.length < 65536) { frame.write(0x80 | 126); frame.write(data.length >> 8); frame.write(data.length & 255); }
            else { frame.write(0x80 | 127); for (int i = 7; i >= 0; i--) frame.write((int) ((long) data.length >> (8 * i)) & 255); }
            frame.write(mask);
            for (int i = 0; i < data.length; i++) frame.write(data[i] ^ mask[i & 3]);
            out.write(frame.toByteArray());
            out.flush();
        } catch (IOException e) { finish("send"); }
    }

    void close() { finish(""); }

    private void run(String base) {
        try {
            URL url = new URL(base);
            boolean tls = "https".equals(url.getProtocol());
            int port = url.getPort() > 0 ? url.getPort() : tls ? 443 : 80;
            Socket s = tls ? SSLSocketFactory.getDefault().createSocket() : new Socket();
            socket = s;
            if (closed) { s.close(); return; }
            s.connect(new InetSocketAddress(url.getHost(), port), 5000);
            s.setSoTimeout(0);
            byte[] raw = new byte[16];
            random.nextBytes(raw);
            String key = Base64.encodeToString(raw, Base64.NO_WRAP), path = url.getPath().replaceAll("/+$", "") + "/api/websocket";
            synchronized (this) {
                out = s.getOutputStream();
                out.write(("GET " + path + " HTTP/1.1\r\nHost: " + url.getHost() + (url.getPort() > 0 ? ":" + port : "")
                        + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: " + key
                        + "\r\nSec-WebSocket-Version: 13\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
                out.flush();
            }
            InputStream in = s.getInputStream();
            String head = readHead(in);
            if (head == null || !head.startsWith("HTTP/1.1 101") || !head.toLowerCase(java.util.Locale.ROOT).contains(accept(key).toLowerCase(java.util.Locale.ROOT))) { finish("handshake"); return; }
            ByteArrayOutputStream message = new ByteArrayOutputStream();
            while (!closed) {
                int b0 = in.read(), b1 = in.read();
                if (b0 < 0 || b1 < 0) break;
                int op = b0 & 15;
                long len = b1 & 127;
                if (len == 126) len = (read(in) << 8) | read(in);
                else if (len == 127) { len = 0; for (int i = 0; i < 8; i++) len = (len << 8) | read(in); }
                byte[] mask = (b1 & 128) != 0 ? new byte[] { (byte) read(in), (byte) read(in), (byte) read(in), (byte) read(in) } : null;
                if (len > MAX_MESSAGE || message.size() + len > MAX_MESSAGE) break;
                byte[] payload = new byte[(int) len];
                for (int got = 0, n; got < payload.length; got += n) if ((n = in.read(payload, got, payload.length - got)) < 0) throw new IOException("cut short");
                if (mask != null) for (int i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
                if (op == 8) break;
                if (op == 9) { pong(payload); continue; }
                if (op == 10) continue;
                if (op == 1 || op == 0) {
                    message.write(payload);
                    if ((b0 & 128) != 0) { listener.message(message.toString("UTF-8")); message.reset(); }
                }
            }
            finish("closed");
        } catch (Exception e) { finish("network"); }
    }

    private synchronized void pong(byte[] payload) throws IOException {
        if (out == null || payload.length > 125) return;
        byte[] mask = new byte[4];
        random.nextBytes(mask);
        out.write(0x8A); out.write(0x80 | payload.length); out.write(mask);
        for (int i = 0; i < payload.length; i++) out.write(payload[i] ^ mask[i & 3]);
        out.flush();
    }

    private void finish(String reason) {
        boolean first;
        synchronized (this) { first = !closed; closed = true; }
        Socket s = socket;
        if (s != null) try { s.close(); } catch (IOException ignored) { }
        if (first && !reason.isEmpty()) listener.closed(reason);
    }

    private static int read(InputStream in) throws IOException {
        int b = in.read();
        if (b < 0) throw new IOException("cut short");
        return b;
    }

    private static String accept(String key) throws Exception {
        byte[] sha = MessageDigest.getInstance("SHA-1").digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.ISO_8859_1));
        return Base64.encodeToString(sha, Base64.NO_WRAP);
    }

    private static String readHead(InputStream in) throws IOException {
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        int a = 0, b = 0, c = 0, d;
        while ((d = in.read()) >= 0) {
            head.write(d);
            if (a == '\r' && b == '\n' && c == '\r' && d == '\n') return head.toString("ISO-8859-1");
            a = b; b = c; c = d;
            if (head.size() > 16384) return null;
        }
        return null;
    }
}
