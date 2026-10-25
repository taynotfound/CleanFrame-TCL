package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Pi-hole and AdGuard Home add-on (Settings › Add-ons). Off until the owner turns it on; nothing here runs before that.
 * The server address and password are typed in the phone companion and stay in this class's SharedPreferences: the
 * page only ever sees today's counts and whether blocking is on. While the add-on is on and Shore is in front, the
 * counts are read every minute.
 *
 * Pi-hole 6 signs in with the web password (POST /api/auth) and keeps the session; Pi-hole 5 takes the API token
 * as auth=; AdGuard Home takes the user name and password as HTTP basic auth. Which one answers is found when the
 * phone saves the server.
 */
final class AdBlock {
    interface Listener { void changed(); }

    private static final long EVERY = 60_000L;
    private static AdBlock instance;
    private final SharedPreferences prefs;
    private final ScheduledExecutorService worker = Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "shore-adblock"));
    private volatile Listener listener;
    private volatile boolean active, busy;
    private volatile String status = "off", error = "", sid = "";
    private volatile long total = -1, blocked = -1, at, until;
    private volatile boolean blocking = true;
    private ScheduledFuture<?> poll;

    static synchronized AdBlock get(Context context) {
        if (instance == null) instance = new AdBlock(context.getApplicationContext());
        return instance;
    }

    private AdBlock(Context context) { prefs = context.getSharedPreferences("adblock", Context.MODE_PRIVATE); }

    void setListener(Listener l) { listener = l; }

    boolean enabled() { return prefs.getBoolean("enabled", false); }
    boolean configured() { return !url().isEmpty() && !kind().isEmpty(); }
    private String url() { return prefs.getString("url", ""); }
    /** pihole6, pihole5 or adguard. */
    private String kind() { return prefs.getString("kind", ""); }
    private String user() { return prefs.getString("user", ""); }
    private String secret() { return prefs.getString("secret", ""); }

    /** {configured, enabled, kind, url, status, error, at, total, blocked, blocking, until}: counts for today, never the password. */
    String info() {
        try {
            return new JSONObject().put("configured", configured()).put("enabled", enabled()).put("kind", kind().startsWith("pihole") ? "pihole" : kind())
                    .put("url", url()).put("status", !enabled() ? "off" : !configured() ? "setup" : status).put("error", error).put("at", at)
                    .put("total", total).put("blocked", blocked).put("blocking", blocking).put("until", until).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** For the phone companion: never the password. */
    JSONObject summary() throws Exception {
        return new JSONObject().put("enabled", enabled()).put("configured", configured()).put("kind", kind().startsWith("pihole") ? "pihole" : kind())
                .put("url", url()).put("user", user()).put("status", !configured() ? "setup" : status).put("error", error);
    }

    void setEnabled(boolean on) {
        if (on == enabled()) { schedule(); return; }
        prefs.edit().putBoolean("enabled", on).apply();
        if (!on) { status = "off"; error = ""; total = blocked = -1; at = 0; }
        schedule();
        notifyChanged();
    }

    void setActive(boolean on) { active = on; schedule(); }

    void refresh() { if (enabled() && configured()) worker.execute(this::poll); }

    /**
     * From the phone: tries the server as Pi-hole 6, Pi-hole 5 and AdGuard Home, keeps the first that accepts the
     * password. An empty password keeps the saved one for the same address. Returns "" when saved, else url, auth,
     * network or server.
     */
    String save(String address, String userName, String password) {
        String base = address == null ? "" : address.trim().replaceAll("/+$", "");
        if (!base.matches(HomeAssistant.URL_RE)) return "url";
        String user = userName == null ? "" : userName.trim(), pass = password == null ? "" : password;
        if (user.length() > 100 || pass.length() > 500) return "auth";
        if (pass.isEmpty() && base.equalsIgnoreCase(url())) pass = secret();
        String found = "", failure = "network";
        for (String k : new String[] { "pihole6", "pihole5", "adguard" }) {
            try { sid = ""; stats(base, k, user, pass); found = k; break; }
            catch (Failure f) { if (f.code.equals("auth")) failure = "auth"; else if (!failure.equals("auth") && f.code.equals("server")) failure = "server"; }
        }
        if (found.isEmpty()) return failure;
        prefs.edit().putString("url", base).putString("kind", found).putString("user", user).putString("secret", pass).apply();
        status = "loading"; error = "";
        refresh();
        notifyChanged();
        return "";
    }

    void forget() {
        prefs.edit().remove("url").remove("kind").remove("user").remove("secret").apply();
        sid = ""; status = "setup"; error = ""; total = blocked = -1; at = 0;
        notifyChanged();
    }

    /** Pauses blocking for minutes (1 to 60), or turns it back on with 0. */
    void pause(int minutes) {
        if (!enabled() || !configured()) return;
        final int m = Math.max(0, Math.min(60, minutes));
        final String base = url(), k = kind(), user = user(), pass = secret();
        worker.execute(() -> {
            try {
                if (k.equals("pihole6")) call6(base, pass, "POST", "/api/dns/blocking", new JSONObject().put("blocking", m == 0).put("timer", m == 0 ? JSONObject.NULL : m * 60).toString());
                else if (k.equals("pihole5")) http(base + "/admin/api.php?" + (m == 0 ? "enable" : "disable=" + (m * 60)) + "&auth=" + enc(pass), "GET", null, null, null);
                else http(base + "/control/protection", "POST", basic(user, pass), "application/json",
                        new JSONObject().put("enabled", m == 0).put("duration", m == 0 ? 0 : m * 60000L).toString());
            } catch (Exception ignored) { }
            poll();
        });
    }

    // ---------- Polling ----------

    private synchronized void schedule() {
        boolean want = active && enabled() && configured();
        if (want && poll == null) poll = worker.scheduleWithFixedDelay(this::poll, 0, EVERY, TimeUnit.MILLISECONDS);
        else if (!want && poll != null) { poll.cancel(false); poll = null; }
    }

    private void poll() {
        if (busy || !enabled() || !configured()) return;
        busy = true;
        try {
            if (at == 0) { status = "loading"; notifyChanged(); }
            stats(url(), kind(), user(), secret());
            at = System.currentTimeMillis(); status = "ok"; error = "";
        } catch (Failure f) { status = "error"; error = f.code; }
        catch (Exception e) { status = "error"; error = "server"; }
        finally { busy = false; }
        notifyChanged();
    }

    /** Reads today's totals and the blocking state into the fields. */
    private void stats(String base, String k, String user, String pass) throws Failure {
        try {
            if (k.equals("pihole6")) {
                JSONObject q = new JSONObject(call6(base, pass, "GET", "/api/stats/summary", null)).getJSONObject("queries");
                JSONObject b = new JSONObject(call6(base, pass, "GET", "/api/dns/blocking", null));
                total = q.getLong("total"); blocked = q.getLong("blocked");
                blocking = !"disabled".equals(b.optString("blocking"));
                until = !blocking && b.optDouble("timer", 0) > 0 ? System.currentTimeMillis() + (long) (b.optDouble("timer") * 1000) : 0;
            } else if (k.equals("pihole5")) {
                JSONObject s = new JSONObject(http(base + "/admin/api.php?summaryRaw&auth=" + enc(pass), "GET", null, null, null));
                if (!s.has("dns_queries_today")) throw new Failure(s.length() == 0 || pass.isEmpty() ? "auth" : "server"); // a wrong token answers []
                total = s.getLong("dns_queries_today"); blocked = s.getLong("ads_blocked_today");
                blocking = !"disabled".equals(s.optString("status")); until = 0;
            } else {
                String auth = basic(user, pass);
                JSONObject s = new JSONObject(http(base + "/control/stats", "GET", auth, null, null));
                JSONObject p = new JSONObject(http(base + "/control/status", "GET", auth, null, null));
                if (!s.has("num_dns_queries")) throw new Failure("server");
                total = s.getLong("num_dns_queries"); blocked = s.optLong("num_blocked_filtering") + s.optLong("num_replaced_safebrowsing") + s.optLong("num_replaced_parental");
                blocking = p.optBoolean("protection_enabled", true);
                long left = p.optLong("protection_disabled_duration", 0);
                until = !blocking && left > 0 ? System.currentTimeMillis() + left : 0;
            }
        } catch (Failure f) { throw f; }
        catch (Exception e) { throw new Failure("server"); }
    }

    /** Pi-hole 6: signs in once, keeps the session id, and signs in again when it runs out. */
    private String call6(String base, String pass, String method, String path, String body) throws Failure {
        for (int attempt = 0; attempt < 2; attempt++) {
            if (sid.isEmpty()) {
                try {
                    JSONObject r = new JSONObject(http(base + "/api/auth", "POST", null, "application/json", new JSONObject().put("password", pass).toString()));
                    JSONObject s = r.optJSONObject("session");
                    if (s == null || !s.optBoolean("valid")) throw new Failure("auth");
                    sid = s.optString("sid", ""); // empty when the Pi-hole has no password
                    if (sid.isEmpty()) sid = "-";
                } catch (Failure f) { throw f; }
                catch (Exception e) { throw new Failure("server"); }
            }
            try { return http(base + path, method, null, body == null ? null : "application/json", body, sid.equals("-") ? null : sid); }
            catch (Failure f) { if (f.code.equals("auth") && attempt == 0) { sid = ""; continue; } throw f; }
        }
        throw new Failure("auth");
    }

    private String http(String url, String method, String basic, String type, String body) throws Failure { return http(url, method, basic, type, body, null); }

    private static String http(String url, String method, String basic, String type, String body, String session) throws Failure {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(5000);
            c.setReadTimeout(8000);
            c.setInstanceFollowRedirects(false); // the password never follows a redirect elsewhere
            c.setRequestMethod(method);
            if (basic != null) c.setRequestProperty("Authorization", basic);
            if (session != null) c.setRequestProperty("X-FTL-SID", session);
            if (body != null) {
                c.setDoOutput(true);
                c.setRequestProperty("Content-Type", type == null ? "application/json" : type);
                try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
            }
            int code = c.getResponseCode();
            if (code == 401 || code == 403) throw new Failure("auth");
            if (code / 100 != 2) throw new Failure("server");
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[16 * 1024];
                for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); if (out.size() > 2 * 1024 * 1024) throw new Failure("server"); }
                String text = out.toString("UTF-8").trim();
                return text.startsWith("[") ? "{}" : text; // Pi-hole 5 answers [] to a wrong token
            }
        } catch (Failure f) { throw f; }
        catch (IOException e) { throw new Failure("network"); }
        catch (Exception e) { throw new Failure("server"); }
        finally { if (c != null) c.disconnect(); }
    }

    private static String basic(String user, String pass) {
        return "Basic " + Base64.encodeToString((user + ":" + pass).getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
    }

    private static String enc(String s) { try { return URLEncoder.encode(s, "UTF-8"); } catch (Exception e) { return ""; } }

    private static final class Failure extends Exception {
        final String code;
        Failure(String code) { super(code); this.code = code; }
    }

    private void notifyChanged() { Listener l = listener; if (l != null) l.changed(); }
}
