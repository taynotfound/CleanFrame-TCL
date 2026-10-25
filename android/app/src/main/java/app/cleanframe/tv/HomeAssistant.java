package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Home Assistant add-on (Settings › Add-ons). Off until the owner turns it on; nothing here runs before that.
 * The server address and long-lived access token are typed in the phone companion and stay in this
 * class's SharedPreferences: the page never sees the token. While the add-on is on and Shore is in front,
 * areas and states are read over REST every 30 seconds and handed to the page trimmed to what it shows.
 * Camera live views use Home Assistant's WebRTC signalling over its WebSocket, relayed here because the
 * page (an https origin) may not open a plain ws:// connection itself.
 */
final class HomeAssistant {
    interface Listener {
        /** New states, a new status or a new setting: the page reads info() again. */
        void changed();
        /** A camera signalling event for the page: {session, type, ...}. */
        void camera(String json);
    }

    private static final long EVERY = 30_000L;
    /** Bookkeeping domains that aren't devices you'd glance at on a TV. */
    private static final Set<String> EXCLUDED = new HashSet<>(Arrays.asList(
            "automation", "script", "scene", "zone", "person", "update", "input_boolean", "input_number", "input_select", "input_text",
            "input_datetime", "input_button", "persistent_notification", "sun", "tag", "device_tracker", "schedule", "counter", "conversation",
            "stt", "tts", "wake_word", "assist_satellite", "number", "select", "button", "text", "image", "todo", "calendar", "weather"));
    private static final Set<String> TOGGLE = new HashSet<>(Arrays.asList("light", "switch", "fan", "lock"));
    /** No REST endpoint lists areas, so the template renderer does. Entities hidden in Home Assistant stay hidden on the TV. */
    private static final String AREAS = "{{ [areas() | map(\"area_name\") | list, areas() | map(\"area_entities\") | map(\"reject\", \"is_hidden_entity\") | map(\"list\") | list] | tojson }}";
    static final String URL_RE = "(?i)https?://[A-Za-z0-9.\\-\\[\\]:]{1,253}(:\\d{1,5})?(/[^\\s?#]*)?", TOKEN_RE = "[A-Za-z0-9._\\-]{20,1200}";

    private static HomeAssistant instance;
    private final SharedPreferences prefs;
    private final ScheduledExecutorService worker = Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "shore-ha"));
    private volatile Listener listener;
    private volatile boolean active, busy;
    private volatile String status = "off", error = "";
    private volatile long at;
    private volatile JSONArray areas = new JSONArray();
    private volatile JSONObject states = new JSONObject();
    private ScheduledFuture<?> poll;
    private HaSocket camera;
    private int session;
    private String cameraEntity = "";

    static synchronized HomeAssistant get(Context context) {
        if (instance == null) instance = new HomeAssistant(context.getApplicationContext());
        return instance;
    }

    private HomeAssistant(Context context) { prefs = context.getSharedPreferences("homeassistant", Context.MODE_PRIVATE); }

    void setListener(Listener l) { listener = l; }

    boolean enabled() { return prefs.getBoolean("enabled", false); }
    boolean configured() { return !url().isEmpty() && !token().isEmpty(); }
    String url() { return prefs.getString("url", ""); }
    private String token() { return prefs.getString("token", ""); }

    /**
     * What the page shows: {configured, enabled, url, status, error, at, areas:[{name, ids}], selected, states:{id: {s, n, u, c, t, ...}}}.
     * Lights add b, cm, hs, k, kmin, kmax, mode; thermostats add tt, tlo, thi, tmin, tmax, ts, hm, act.
     */
    String info() {
        try {
            return new JSONObject().put("configured", configured()).put("enabled", enabled()).put("url", url())
                    .put("status", !enabled() ? "off" : !configured() ? "setup" : status).put("error", error).put("at", at)
                    .put("areas", areas).put("selected", selected()).put("states", states).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** For the phone companion: never the token. */
    JSONObject summary() throws Exception {
        return new JSONObject().put("enabled", enabled()).put("configured", configured()).put("url", url()).put("status", !configured() ? "setup" : status).put("error", error);
    }

    /** The add-on switch on the TV. Turning it off stops polling and forgets the cached states, but keeps the server. */
    void setEnabled(boolean on) {
        if (on == enabled()) { schedule(); return; }
        prefs.edit().putBoolean("enabled", on).apply();
        if (!on) { areas = new JSONArray(); states = new JSONObject(); status = "off"; error = ""; at = 0; hangup(0); }
        schedule();
        notifyChanged();
    }

    /** Shore in front (true) or another app (false). */
    void setActive(boolean on) {
        active = on;
        if (!on) hangup(0);
        schedule();
    }

    /** Rooms the owner picked on the TV; an empty list means every room. */
    void setAreas(String json) {
        JSONArray clean = new JSONArray();
        try {
            JSONArray list = new JSONArray(json == null ? "[]" : json);
            for (int i = 0; i < list.length() && i < 200; i++) { String n = list.optString(i, ""); if (!n.isEmpty() && n.length() <= 200) clean.put(n); }
        } catch (Exception ignored) { }
        prefs.edit().putString("areas", clean.toString()).apply();
        refresh();
    }

    private JSONArray selected() {
        try { return new JSONArray(prefs.getString("areas", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    /** Reads again now, unless a read is already running. */
    void refresh() { if (enabled() && configured()) worker.execute(this::poll); }

    /**
     * From the phone companion: checks the address and token against the server, then keeps them.
     * An empty token keeps the saved one, but only for the same address, so a saved token is never
     * sent to a different server. Returns "" when saved, else auth, network, server, url or token.
     */
    String save(String url, String token) {
        url = url == null ? "" : url.trim().replaceAll("/+$", "");
        token = token == null ? "" : token.trim();
        if (!url.matches(URL_RE)) return "url";
        if (token.isEmpty() && url.equalsIgnoreCase(url())) token = token();
        if (!token.matches(TOKEN_RE)) return "token";
        try { readAreas(url, token); }
        catch (HaError e) { return e.code; }
        prefs.edit().putString("url", url).putString("token", token).apply();
        status = "loading"; error = "";
        refresh();
        notifyChanged();
        return "";
    }

    /** Forgets the server and token (companion or TV). The add-on switch stays as it is. */
    void forget() {
        prefs.edit().remove("url").remove("token").remove("areas").apply();
        areas = new JSONArray(); states = new JSONObject(); status = "setup"; error = ""; at = 0;
        hangup(0);
        notifyChanged();
    }

    /** Toggles a light, switch or fan; locks or unlocks a lock. Then reads the new state. */
    void toggle(String entity) {
        if (entity == null || !entity.matches("[a-z_]{1,40}\\.[A-Za-z0-9_]{1,200}")) return;
        String domain = entity.substring(0, entity.indexOf('.'));
        if (!TOGGLE.contains(domain) || !enabled() || !configured()) return;
        JSONObject now = states.optJSONObject(entity);
        if (now == null || "unavailable".equals(now.optString("s"))) return;
        String service = !domain.equals("lock") ? "toggle" : "locked".equals(now.optString("s")) ? "unlock" : "lock";
        final String base = url(), key = token();
        worker.execute(() -> {
            try { request(base, key, "/api/services/" + domain + "/" + service, new JSONObject().put("entity_id", entity).toString()); }
            catch (Exception ignored) { }
            worker.schedule(this::poll, 400, TimeUnit.MILLISECONDS);
        });
    }

    /**
     * Light brightness and colour, thermostat target and mode. Only these services, and only these fields
     * with values in range, reach Home Assistant: light.turn_on {brightness_pct, hs_color, color_temp_kelvin},
     * climate.set_temperature {temperature} and climate.set_hvac_mode {hvac_mode}.
     */
    void call(String entity, String service, String json) {
        if (entity == null || service == null || !entity.matches("(light|climate)\\.[A-Za-z0-9_]{1,200}") || !enabled() || !configured()) return;
        String domain = entity.substring(0, entity.indexOf('.'));
        JSONObject now = states.optJSONObject(entity);
        if (now == null || "unavailable".equals(now.optString("s"))) return;
        JSONObject in, out = new JSONObject();
        try {
            in = new JSONObject(json == null || json.length() > 2000 ? "{}" : json);
            out.put("entity_id", entity);
            if (domain.equals("light") && service.equals("turn_on")) {
                if (in.has("brightness_pct")) out.put("brightness_pct", Math.max(1, Math.min(100, in.getInt("brightness_pct"))));
                JSONArray hs = in.optJSONArray("hs_color");
                if (hs != null && hs.length() == 2) out.put("hs_color", new JSONArray().put(Math.max(0, Math.min(360, hs.getDouble(0)))).put(Math.max(0, Math.min(100, hs.getDouble(1)))));
                else if (in.has("color_temp_kelvin")) out.put("color_temp_kelvin", Math.max(1000, Math.min(12000, in.getInt("color_temp_kelvin"))));
            } else if (domain.equals("climate") && service.equals("set_temperature")) {
                double t = in.getDouble("temperature");
                if (Double.isNaN(t) || t < -50 || t > 150) return;
                out.put("temperature", t);
            } else if (domain.equals("climate") && service.equals("set_hvac_mode")) {
                String mode = in.optString("hvac_mode");
                JSONArray offered = now.optJSONArray("hm");
                boolean ok = false;
                for (int i = 0; offered != null && i < offered.length(); i++) ok |= mode.equals(offered.optString(i));
                if (!ok) return;
                out.put("hvac_mode", mode);
            } else return;
        } catch (Exception e) { return; }
        final String base = url(), key = token(), body = out.toString();
        worker.execute(() -> {
            try { request(base, key, "/api/services/" + domain + "/" + service, body); }
            catch (Exception ignored) { }
            worker.schedule(this::poll, 600, TimeUnit.MILLISECONDS);
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
        String base = url(), key = token();
        try {
            if (at == 0) { status = "loading"; notifyChanged(); }
            JSONArray found = readAreas(base, key);
            JSONArray picked = selected();
            Set<String> wanted = new HashSet<>(), chosen = new HashSet<>();
            for (int i = 0; i < picked.length(); i++) chosen.add(picked.optString(i));
            for (int i = 0; i < found.length(); i++) {
                JSONObject area = found.getJSONObject(i);
                if (!chosen.isEmpty() && !chosen.contains(area.getString("name"))) continue;
                JSONArray ids = area.getJSONArray("ids");
                for (int j = 0; j < ids.length(); j++) wanted.add(ids.getString(j));
            }
            JSONArray all = new JSONArray(request(base, key, "/api/states", null));
            JSONObject out = new JSONObject();
            for (int i = 0; i < all.length(); i++) {
                JSONObject s = all.optJSONObject(i);
                String id = s == null ? "" : s.optString("entity_id");
                if (!wanted.contains(id) || EXCLUDED.contains(id.substring(0, Math.max(0, id.indexOf('.'))))) continue;
                JSONObject a = s.optJSONObject("attributes");
                if (a == null) a = new JSONObject();
                JSONObject e = new JSONObject().put("s", clip(s.optString("state"), 120)).put("n", clip(a.optString("friendly_name", id), 120));
                if (!a.optString("unit_of_measurement").isEmpty()) e.put("u", clip(a.optString("unit_of_measurement"), 16));
                if (!a.optString("device_class").isEmpty()) e.put("c", clip(a.optString("device_class"), 40));
                if (a.has("current_temperature") && !a.isNull("current_temperature")) e.put("t", a.optDouble("current_temperature"));
                if (id.startsWith("light.")) lightAttributes(a, e);
                else if (id.startsWith("climate.")) climateAttributes(a, e);
                out.put(id, e);
            }
            areas = found; states = out; at = System.currentTimeMillis(); status = "ok"; error = "";
        } catch (HaError e) {
            status = "error"; error = e.code;
        } catch (Exception e) {
            status = "error"; error = "server";
        } finally { busy = false; }
        notifyChanged();
    }

    /** Light controls: brightness (0-100), colour modes, hue/saturation and colour temperature with its range. */
    private static void lightAttributes(JSONObject a, JSONObject e) throws Exception {
        JSONArray modes = a.optJSONArray("supported_color_modes"), cm = new JSONArray();
        for (int i = 0; modes != null && i < modes.length() && i < 12; i++) cm.put(clip(modes.optString(i), 20));
        e.put("cm", cm);
        if (!a.isNull("brightness") && a.has("brightness")) e.put("b", Math.round(a.optDouble("brightness") * 100 / 255));
        JSONArray hs = a.optJSONArray("hs_color");
        if (hs != null && hs.length() == 2) e.put("hs", new JSONArray().put(hs.optDouble(0)).put(hs.optDouble(1)));
        if (!a.isNull("color_temp_kelvin") && a.has("color_temp_kelvin")) e.put("k", a.optInt("color_temp_kelvin"));
        if (a.has("min_color_temp_kelvin")) e.put("kmin", a.optInt("min_color_temp_kelvin"));
        if (a.has("max_color_temp_kelvin")) e.put("kmax", a.optInt("max_color_temp_kelvin"));
        if (!a.optString("color_mode").isEmpty()) e.put("mode", clip(a.optString("color_mode"), 20));
    }

    /** Thermostat controls: target (or low/high range), its limits and step, and the modes it offers. */
    private static void climateAttributes(JSONObject a, JSONObject e) throws Exception {
        if (a.has("temperature") && !a.isNull("temperature")) e.put("tt", a.optDouble("temperature"));
        if (a.has("target_temp_low") && !a.isNull("target_temp_low")) e.put("tlo", a.optDouble("target_temp_low"));
        if (a.has("target_temp_high") && !a.isNull("target_temp_high")) e.put("thi", a.optDouble("target_temp_high"));
        if (a.has("min_temp")) e.put("tmin", a.optDouble("min_temp"));
        if (a.has("max_temp")) e.put("tmax", a.optDouble("max_temp"));
        if (a.has("target_temp_step")) e.put("ts", a.optDouble("target_temp_step"));
        JSONArray modes = a.optJSONArray("hvac_modes"), hm = new JSONArray();
        for (int i = 0; modes != null && i < modes.length() && i < 12; i++) hm.put(clip(modes.optString(i), 20));
        e.put("hm", hm);
        if (!a.optString("hvac_action").isEmpty()) e.put("act", clip(a.optString("hvac_action"), 20));
    }

    private static String clip(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }

    /** [{name, ids}] for every area. */
    private static JSONArray readAreas(String base, String token) throws HaError {
        try {
            JSONArray outer = new JSONArray(request(base, token, "/api/template", new JSONObject().put("template", AREAS).toString()));
            JSONArray names = outer.getJSONArray(0), lists = outer.getJSONArray(1), result = new JSONArray();
            for (int i = 0; i < names.length() && i < 200; i++) result.put(new JSONObject().put("name", clip(names.getString(i), 200)).put("ids", lists.getJSONArray(i)));
            return result;
        } catch (HaError e) { throw e; }
        catch (Exception e) { throw new HaError("server"); }
    }

    private static final class HaError extends Exception {
        final String code;
        HaError(String code) { super(code); this.code = code; }
    }

    /** GET (body null) or POST JSON with the token; the reply as text. */
    private static String request(String base, String token, String path, String body) throws HaError {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(base + path).openConnection();
            c.setConnectTimeout(5000);
            c.setReadTimeout(8000);
            c.setInstanceFollowRedirects(false); // the token never follows a redirect elsewhere
            c.setRequestProperty("Authorization", "Bearer " + token);
            if (body != null) {
                c.setDoOutput(true);
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
            }
            int code = c.getResponseCode();
            if (code == 401 || code == 403) throw new HaError("auth");
            if (code / 100 != 2) throw new HaError("server");
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[32 * 1024];
                for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); if (out.size() > 16 * 1024 * 1024) throw new HaError("server"); }
                return out.toString("UTF-8");
            }
        } catch (HaError e) { throw e; }
        catch (IOException e) { throw new HaError("network"); }
        finally { if (c != null) c.disconnect(); }
    }

    // ---------- Cameras: WebRTC signalling for the page ----------

    /**
     * Opens a signalling session for one camera and returns its number (0 when it can't).
     * The page first gets {type: config} with the camera's WebRTC client configuration, creates its
     * offer, and sends it with cameraOffer; answers and candidates follow as events.
     */
    synchronized int cameraStart(String entity) {
        hangup(0);
        if (entity == null || !entity.matches("camera\\.[A-Za-z0-9_]{1,200}") || !enabled() || !configured() || !active) return 0;
        final int id = ++session;
        final String key = token();
        cameraEntity = entity;
        camera = HaSocket.open(url(), new HaSocket.Listener() {
            @Override public void message(String text) { cameraMessage(id, entity, key, text); }
            @Override public void closed(String reason) { cameraEvent(id, "closed", reason); }
        });
        return id;
    }

    synchronized void cameraOffer(int id, String sdp) {
        if (id != session || camera == null || sdp == null || sdp.length() > 64 * 1024) return;
        try { camera.send(new JSONObject().put("id", 2).put("type", "camera/webrtc/offer").put("entity_id", cameraEntity).put("offer", sdp).toString()); }
        catch (Exception ignored) { }
    }

    /** Ends a session (0 ends whichever is open): closing the socket ends the camera's live stream. */
    synchronized void hangup(int id) {
        if (camera == null || (id != 0 && id != session)) return;
        camera.close();
        camera = null;
    }

    private void cameraMessage(int id, String entity, String key, String text) {
        try {
            JSONObject m = new JSONObject(text);
            String type = m.optString("type");
            HaSocket s;
            synchronized (this) { if (id != session) return; s = camera; }
            if (s == null) return;
            if (type.equals("auth_required")) s.send(new JSONObject().put("type", "auth").put("access_token", key).toString());
            else if (type.equals("auth_ok")) s.send(new JSONObject().put("id", 1).put("type", "camera/webrtc/get_client_config").put("entity_id", entity).toString());
            else if (type.equals("auth_invalid")) { cameraEvent(id, "error", "auth"); hangup(id); }
            else if (type.equals("result") && m.optInt("id") == 1) {
                if (m.optBoolean("success")) push(new JSONObject().put("session", id).put("type", "config").put("config", m.optJSONObject("result") == null ? new JSONObject() : m.optJSONObject("result")));
                else { cameraEvent(id, "error", "unsupported"); hangup(id); }
            } else if (type.equals("result") && m.optInt("id") == 2 && !m.optBoolean("success")) {
                JSONObject err = m.optJSONObject("error");
                cameraEvent(id, "error", err == null ? "camera" : clip(err.optString("message", "camera"), 200));
            } else if (type.equals("event") && m.optInt("id") == 2) {
                JSONObject e = m.optJSONObject("event");
                if (e != null) push(e.put("session", id));
            }
        } catch (Exception ignored) { }
    }

    private void cameraEvent(int id, String type, String message) {
        try { push(new JSONObject().put("session", id).put("type", type).put("message", message)); } catch (Exception ignored) { }
    }

    private void push(JSONObject event) { Listener l = listener; if (l != null) l.camera(event.toString()); }

    private void notifyChanged() { Listener l = listener; if (l != null) l.changed(); }
}
