package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.util.Base64;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Shore Companion: a small web app on the local network that a phone opens from a QR code.
 * It runs only while the user has it switched on in Settings › Phone, and every API call needs the
 * pairing key from the QR code (kept by the phone, rotated by "Forget paired phones").
 * The page itself (HTML, CSS, icons, manifest) ships in the APK under assets/companion/.
 * Uploaded JPEG, PNG, WebP, GIF and MP4 files land in files/phone/ and become the "My photos" source.
 */
final class Companion {
    interface Listener { void changed(int count); }
    interface Commands {
        /** Applies a setting chosen on the phone; MainActivity hands it to the page. */
        void set(String axis, String value);
        /** A settings backup from the phone, already checked to be a Shore backup. */
        void restore(String json);
    }

    static final int MAX_FILES = 30, MAX_BYTES = 60 * 1024 * 1024;
    private static final int[] PORTS = { 8642, 8643, 8644, 8645 };
    private static final String NAME = "phone-\\d+\\.(jpg|png|webp|gif|mp4)";
    /**
     * Installable launcher on the project website (HTTPS, so phones can install it; the TV's own page is http and can't be).
     * It keeps the TV address and key from the link's fragment, which browsers never send to the web server.
     * Forks change this to their own GitHub Pages address.
     */
    static final String PAIR_URL = "https://taynotfound.github.io/shore/app/";

    private final Context context;
    private final File dir, onlineDir;
    private final SharedPreferences prefs;
    private final ExecutorService pool = Executors.newFixedThreadPool(3);
    private volatile ServerSocket server;
    private volatile String url = "", wallpaper = "";
    private volatile Listener listener;
    private volatile Commands commands;
    /** The settings model Shore's page last published, or empty while Shore is not running. */
    private volatile String state = "";

    Companion(Context context) {
        this.context = context.getApplicationContext();
        dir = new File(this.context.getFilesDir(), "phone");
        onlineDir = new File(this.context.getFilesDir(), "online");
        dir.mkdirs();
        prefs = this.context.getSharedPreferences("phone-upload", Context.MODE_PRIVATE);
    }

    void setListener(Listener l) { listener = l; }
    void setCommands(Commands c) { commands = c; if (c == null) state = ""; }
    void setState(String json) { state = json == null || json.length() > 512 * 1024 ? "" : json; }

    boolean enabled() { return prefs.getBoolean("enabled", false); }

    /** Uploaded files, oldest first. */
    File[] files() {
        File[] list = dir.listFiles((d, name) -> name.matches(NAME));
        if (list == null) return new File[0];
        Arrays.sort(list, (a, b) -> a.getName().compareTo(b.getName()));
        return list;
    }

    int count() { return files().length; }

    /** Place name typed on the phone for the weather line; empty when none was set. */
    String place() { return prefs.getString("place", ""); }
    /** RSS or Atom feed typed on the phone for the headlines; empty means Google News for the TV's language. */
    String feed() { return prefs.getString("feed", ""); }
    String calendar() { return prefs.getString("calendar", ""); }

    /** Starts the server when switched on; called when Shore opens. */
    synchronized void resume() { if (enabled() && (server == null || server.isClosed())) try { open(); } catch (IOException ignored) { } }

    synchronized void setEnabled(boolean on) {
        prefs.edit().putBoolean("enabled", on).apply();
        if (on) resume(); else stop();
    }

    synchronized void stop() {
        ServerSocket s = server;
        server = null; url = "";
        if (s != null) try { s.close(); } catch (IOException ignored) { }
    }

    /** New pairing key: phones paired before have to scan again. */
    void forget() { prefs.edit().putString("key", newKey()).apply(); }

    /** Thumbnail of the wallpaper on the TV, used as the companion's background. */
    void setWallpaper(String path) { if (path != null && path.matches("[A-Za-z0-9_-]+")) wallpaper = path; }

    /** {enabled, url, count, place, feed}; url is empty while off or without a network. */
    String info() {
        try {
            ServerSocket s = server;
            String address = s == null || s.isClosed() ? null : address();
            url = address == null ? "" : "http://" + address + ":" + s.getLocalPort(); // follows a new IP address
            return new JSONObject().put("enabled", enabled()).put("url", url)
                    .put("count", count()).put("place", place()).put("feed", feed()).put("calendar", calendar()).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** The pairing QR code as a PNG data URL, '' while off or offline. Only the Phone settings page asks. */
    String qrCode() {
        try {
            info(); // refreshes url
            return url.isEmpty() ? "" : qr(PAIR_URL + "#tv=" + java.net.URLEncoder.encode(url, "UTF-8") + "&k=" + key());
        } catch (Exception e) { return ""; }
    }

    /** Removes every uploaded file. */
    void clear() { for (File f : files()) f.delete(); notifyChanged(); }

    private String key() {
        String k = prefs.getString("key", null);
        if (k == null) { k = newKey(); prefs.edit().putString("key", k).apply(); }
        return k;
    }

    private static String newKey() {
        byte[] raw = new byte[18];
        new SecureRandom().nextBytes(raw);
        return Base64.encodeToString(raw, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
    }

    private void open() throws IOException {
        String address = address();
        if (address == null) return;
        ServerSocket s = null;
        for (int port : PORTS) { // the first port keeps the phone's saved page working
            try { s = new ServerSocket(port, 8); break; } catch (IOException ignored) { }
        }
        if (s == null) throw new IOException("No free port");
        url = "http://" + address + ":" + s.getLocalPort();
        server = s;
        final ServerSocket accepting = s;
        new Thread(() -> {
            while (!accepting.isClosed()) {
                try { final Socket socket = accepting.accept(); pool.execute(() -> serve(socket)); }
                catch (IOException e) { break; }
            }
        }, "ShoreCompanion").start();
    }

    /** First site-local IPv4 address (Wi-Fi or Ethernet). */
    private static String address() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses()))
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) return a.getHostAddress();
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static String qrText = "", qrImage = "";

    /** The QR code as a PNG data URL. Encoding and compressing take about half a second on the TV at start,
     *  and info() is asked often (the weather reads the place from it), so the last one is kept. */
    private static synchronized String qr(String text) throws Exception {
        if (text.equals(qrText)) return qrImage;
        qrImage = encodeQr(text); qrText = text;
        return qrImage;
    }

    private static String encodeQr(String text) throws Exception {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 2);
        BitMatrix m = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 0, 0, hints);
        int scale = 8, w = m.getWidth() * scale, h = m.getHeight() * scale;
        int[] px = new int[w * h];
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) px[y * w + x] = m.get(x / scale, y / scale) ? Color.BLACK : Color.WHITE;
        Bitmap b = Bitmap.createBitmap(px, w, h, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        b.recycle();
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    // ---------- HTTP ----------

    private static final Map<String, String> STATIC = new java.util.HashMap<>();
    static {
        STATIC.put("/", "index.html"); STATIC.put("/index.html", "index.html"); STATIC.put("/app.css", "app.css"); STATIC.put("/app.js", "app.js");
        STATIC.put("/manifest.webmanifest", "manifest.webmanifest"); STATIC.put("/sw.js", "sw.js");
        STATIC.put("/icon-192.png", "icon-192.png"); STATIC.put("/icon-512.png", "icon-512.png"); STATIC.put("/manrope.woff2", "../assets/manrope.woff2");
        STATIC.put("/manrope-cyrillic.woff2", "../assets/manrope-cyrillic.woff2"); STATIC.put("/manrope-latin-ext.woff2", "../assets/manrope-latin-ext.woff2");
    }

    private void serve(Socket socket) {
        try (Socket s = socket) {
            s.setSoTimeout(30000);
            InputStream in = s.getInputStream();
            OutputStream out = s.getOutputStream();
            String head = readHead(in);
            if (head == null) return;
            String[] lines = head.split("\r\n");
            String[] request = lines[0].split(" ");
            if (request.length < 2) { send(out, 400, "text/plain", "Bad request"); return; }
            String method = request[0], target = request[1], path = target, query = "";
            if (target.indexOf('?') >= 0) { path = target.substring(0, target.indexOf('?')); query = target.substring(target.indexOf('?') + 1); }
            long length = -1;
            String given = "";
            for (String line : lines) {
                int colon = line.indexOf(':');
                if (colon < 0) continue;
                String k = line.substring(0, colon).trim().toLowerCase(Locale.ROOT), v = line.substring(colon + 1).trim();
                if (k.equals("content-length")) try { length = Long.parseLong(v); } catch (NumberFormatException ignored) { }
                if (k.equals("x-shore-key")) given = v;
            }
            if (method.equals("GET") && STATIC.containsKey(path)) { asset(out, STATIC.get(path)); return; }
            if (!path.startsWith("/api/")) { send(out, 404, "text/plain", "Not found"); return; }
            if (given.isEmpty()) given = param(query, "k");
            if (!same(given, key())) { send(out, 401, "application/json", "{\"error\":\"pair\"}"); return; }
            String api = path.substring(5);
            if (method.equals("GET") && api.equals("info")) { send(out, 200, "application/json", apiInfo()); return; }
            if (method.equals("GET") && api.equals("wallpaper")) { wallpaper(out); return; }
            if (method.equals("GET") && api.equals("settings")) { send(out, 200, "application/json", state.isEmpty() ? "{\"offline\":true}" : state); return; }
            if (method.equals("GET") && api.startsWith("thumb/") && api.substring(6).matches("[A-Za-z0-9_-]{1,80}")) { thumb(out, api.substring(6)); return; }
            if (method.equals("POST") && api.equals("set")) {
                String axis = param(query, "axis"), value = param(query, "value");
                Commands c = commands;
                if (!axis.matches("[a-z][a-z.]{0,15}") || !value.matches("[A-Za-z0-9._:-]{1,120}")) { send(out, 400, "application/json", "{\"error\":\"bad\"}"); return; }
                if (c == null || state.isEmpty()) { send(out, 503, "application/json", "{\"offline\":true}"); return; }
                c.set(axis, value);
                send(out, 200, "application/json", "{\"ok\":true}");
                return;
            }
            if (method.equals("GET") && api.equals("backup")) {
                JSONObject b = state.isEmpty() ? null : new JSONObject(state).optJSONObject("backup");
                if (b == null) { send(out, 503, "application/json", "{\"offline\":true}"); return; }
                send(out, 200, "application/json", b.toString());
                return;
            }
            if (method.equals("POST") && api.equals("restore")) {
                if (length <= 0 || length > 512 * 1024) { send(out, 413, "application/json", "{\"error\":\"size\"}"); return; }
                byte[] body = new byte[(int) length];
                for (int got = 0, n; got < body.length; got += n) if ((n = in.read(body, got, body.length - got)) < 0) throw new IOException("Body cut short");
                String text = new String(body, StandardCharsets.UTF_8);
                JSONObject b;
                try { b = new JSONObject(text); } catch (Exception e) { b = null; }
                if (b == null || !"backup".equals(b.optString("shore")) || b.optJSONObject("settings") == null) { send(out, 400, "application/json", "{\"error\":\"backup\"}"); return; }
                Commands c = commands;
                if (c == null || state.isEmpty()) { send(out, 503, "application/json", "{\"offline\":true}"); return; }
                c.restore(b.toString());
                send(out, 200, "application/json", "{\"ok\":true}");
                return;
            }
            if (method.equals("GET") && api.startsWith("photo/") && api.substring(6).matches(NAME)) { file(out, new File(dir, api.substring(6))); return; }
            if (method.equals("POST") && api.equals("upload")) { upload(in, out, length); return; }
            if (method.equals("POST") && api.equals("clear")) { clear(); send(out, 200, "application/json", apiInfo()); return; }
            if (method.equals("POST") && api.startsWith("delete/") && api.substring(7).matches(NAME)) {
                new File(dir, api.substring(7)).delete(); notifyChanged(); send(out, 200, "application/json", apiInfo()); return;
            }
            if (method.equals("POST") && api.equals("feed")) {
                String feed = param(query, "url").trim();
                if (!feed.isEmpty() && !feed.matches("(?i)https?://\\S{4,500}")) { send(out, 400, "application/json", "{\"error\":\"feed\"}"); return; }
                prefs.edit().putString("feed", feed).apply();
                notifyChanged();
                send(out, 200, "application/json", apiInfo());
                return;
            }
            if (method.equals("POST") && api.equals("calendar")) {
                String cal = param(query, "url").trim();
                if (!cal.isEmpty() && CalendarFeed.clean(cal).isEmpty()) { send(out, 400, "application/json", "{\"error\":\"calendar\"}"); return; }
                prefs.edit().putString("calendar", cal).apply();
                notifyChanged();
                send(out, 200, "application/json", apiInfo());
                return;
            }
            if (method.equals("POST") && api.equals("place")) {
                String place = param(query, "name").trim();
                if (place.length() > 80) place = place.substring(0, 80);
                prefs.edit().putString("place", place).apply();
                notifyChanged();
                send(out, 200, "application/json", apiInfo());
                return;
            }
            // Home Assistant add-on: the address and token come in the body (never the URL) and are never sent back.
            if (method.equals("POST") && api.equals("ha")) {
                if (length <= 0 || length > 8192) { send(out, 413, "application/json", "{\"error\":\"size\"}"); return; }
                byte[] body = new byte[(int) length];
                for (int got = 0, n; got < body.length; got += n) if ((n = in.read(body, got, body.length - got)) < 0) throw new IOException("Body cut short");
                JSONObject b;
                try { b = new JSONObject(new String(body, StandardCharsets.UTF_8)); } catch (Exception e) { b = new JSONObject(); }
                String failed = HomeAssistant.get(context).save(b.optString("url"), b.optString("token"));
                if (!failed.isEmpty()) { send(out, 400, "application/json", new JSONObject().put("error", failed).toString()); return; }
                send(out, 200, "application/json", apiInfo());
                return;
            }
            if (method.equals("POST") && api.equals("ha/clear")) { HomeAssistant.get(context).forget(); send(out, 200, "application/json", apiInfo()); return; }
            send(out, 404, "text/plain", "Not found");
        } catch (Exception ignored) { }
    }

    private static boolean same(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static String param(String query, String name) throws IOException {
        for (String pair : query.split("&")) if (pair.startsWith(name + "=")) return URLDecoder.decode(pair.substring(name.length() + 1), "UTF-8");
        return "";
    }

    private String apiInfo() throws Exception {
        JSONArray photos = new JSONArray();
        File[] all = files();
        for (int i = all.length - 1; i >= 0; i--) photos.put(all[i].getName());
        return new JSONObject().put("name", "Shore").put("install", PAIR_URL).put("count", all.length).put("max", MAX_FILES).put("place", place()).put("feed", feed()).put("calendar", calendar()).put("photos", photos)
                .put("ha", HomeAssistant.get(context).summary()).toString();
    }

    private void asset(OutputStream out, String name) throws IOException {
        String type = name.endsWith(".html") ? "text/html; charset=utf-8" : name.endsWith(".css") ? "text/css; charset=utf-8" : name.endsWith(".js") ? "text/javascript; charset=utf-8"
                : name.endsWith(".webmanifest") ? "application/manifest+json" : name.endsWith(".woff2") ? "font/woff2" : "image/png";
        String path = name.startsWith("../") ? name.substring(3) : "companion/" + name;
        try (InputStream in = context.getAssets().open(path)) { send(out, 200, type, OnlineWallpapers.readAll(in, 4 * 1024 * 1024)); }
    }

    private void wallpaper(OutputStream out) throws IOException { thumb(out, wallpaper.isEmpty() ? "misty" : wallpaper); }

    /** A wallpaper's small preview: online and My photos thumbnails first, then the bundled ones. */
    private void thumb(OutputStream out, String id) throws IOException {
        File online = new File(onlineDir, "wallpapers/" + id + "-thumb.jpg");
        if (online.exists()) { file(out, online); return; }
        try (InputStream in = context.getAssets().open("assets/wallpapers/" + id + "-thumb.jpg")) { send(out, 200, "image/jpeg", OnlineWallpapers.readAll(in, 4 * 1024 * 1024)); }
        catch (IOException e) { send(out, 404, "text/plain", "No wallpaper"); }
    }

    private void file(OutputStream out, File f) throws IOException {
        if (!f.exists()) { send(out, 404, "text/plain", "Not found"); return; }
        String n = f.getName();
        String type = n.endsWith(".png") ? "image/png" : n.endsWith(".webp") ? "image/webp" : n.endsWith(".gif") ? "image/gif" : n.endsWith(".mp4") ? "video/mp4" : "image/jpeg";
        out.write(("HTTP/1.1 200 OK\r\nContent-Type: " + type + "\r\nContent-Length: " + f.length()
                + "\r\nCache-Control: private, max-age=86400\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        try (InputStream in = new FileInputStream(f)) { byte[] buf = new byte[65536]; for (int n2; (n2 = in.read(buf)) > 0; ) out.write(buf, 0, n2); }
        out.flush();
    }

    private void upload(InputStream in, OutputStream out, long length) throws Exception {
        if (length <= 0 || length > MAX_BYTES) { send(out, 413, "text/plain", "Files up to 60 MB, please."); return; }
        File tmp = new File(dir, "upload-" + System.nanoTime() + ".part");
        byte[] magic = new byte[12];
        int got = 0;
        try (FileOutputStream f = new FileOutputStream(tmp)) {
            byte[] buf = new byte[65536];
            long left = length;
            while (left > 0) {
                int n = in.read(buf, 0, (int) Math.min(buf.length, left));
                if (n < 0) throw new IOException("Upload cut short");
                if (got < magic.length) { int k = Math.min(n, magic.length - got); System.arraycopy(buf, 0, magic, got, k); got += k; }
                f.write(buf, 0, n);
                left -= n;
            }
        } catch (IOException e) { tmp.delete(); throw e; }
        String ext = type(magic);
        if (ext == null) { tmp.delete(); send(out, 415, "text/plain", "Only photos (JPEG, PNG, WebP), GIFs and MP4 videos."); return; }
        File target;
        synchronized (this) { // unique, ordered names even for parallel uploads
            long t = System.currentTimeMillis();
            while ((target = new File(dir, "phone-" + t + "." + ext)).exists()) t++;
            if (!tmp.renameTo(target)) { tmp.delete(); send(out, 500, "text/plain", "Could not save"); return; }
        }
        File[] all = files();
        for (int i = 0; i < all.length - MAX_FILES; i++) all[i].delete(); // keep the newest 30
        notifyChanged();
        send(out, 200, "application/json", apiInfo());
    }

    private static String type(byte[] m) {
        if ((m[0] & 255) == 0xFF && (m[1] & 255) == 0xD8) return "jpg";
        if ((m[0] & 255) == 0x89 && m[1] == 'P' && m[2] == 'N' && m[3] == 'G') return "png";
        if (m[0] == 'G' && m[1] == 'I' && m[2] == 'F') return "gif";
        if (m[0] == 'R' && m[1] == 'I' && m[2] == 'F' && m[3] == 'F' && m[8] == 'W' && m[9] == 'E' && m[10] == 'B' && m[11] == 'P') return "webp";
        if (m[4] == 'f' && m[5] == 't' && m[6] == 'y' && m[7] == 'p') return "mp4";
        return null;
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

    private static void send(OutputStream out, int code, String type, String body) throws IOException { send(out, code, type, body.getBytes(StandardCharsets.UTF_8)); }

    private static void send(OutputStream out, int code, String type, byte[] data) throws IOException {
        String status = code == 200 ? "OK" : code == 400 ? "Bad Request" : code == 503 ? "Unavailable" : code == 401 ? "Unauthorized" : code == 404 ? "Not Found" : code == 413 ? "Too Large" : code == 415 ? "Unsupported" : "Error";
        out.write(("HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + data.length
                + "\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.write(data);
        out.flush();
    }

    private void notifyChanged() { Listener l = listener; if (l != null) l.changed(count()); }
}
