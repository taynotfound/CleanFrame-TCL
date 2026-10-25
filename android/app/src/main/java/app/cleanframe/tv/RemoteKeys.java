package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.KeyEvent;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;
import java.util.TreeMap;

/**
 * Remote button assignments, applied by HomeButtonService.
 * Stored as keyCode -> {action, name}. Actions: home | none | screensaver | sleep | app:<package> | input:<tv input id>.
 * A button without an entry keeps its default behaviour.
 */
final class RemoteKeys {
    private static final String PREFS = "remote_keys";
    private static final long LEARN_MS = 20000;

    /** Receives a learned key; set by MainActivity while it is alive. Called on the main thread. */
    interface Listener { void learned(int keyCode, String name, int scanCode); void changed(); }

    static volatile Listener listener;
    private static volatile long learnUntil;

    private RemoteKeys() { }

    static void learn(boolean on) { learnUntil = on ? SystemClock.uptimeMillis() + LEARN_MS : 0; }

    static boolean learning() { return SystemClock.uptimeMillis() < learnUntil; }

    static void notifyChanged() { Listener l = listener; if (l != null) l.changed(); }

    /** Keys a learn step never captures, so the settings page stays usable while it waits. */
    static boolean navigation(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP: case KeyEvent.KEYCODE_DPAD_DOWN: case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_DPAD_RIGHT: case KeyEvent.KEYCODE_DPAD_CENTER: case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER: case KeyEvent.KEYCODE_BACK: case KeyEvent.KEYCODE_ESCAPE:
            case KeyEvent.KEYCODE_HOME: case KeyEvent.KEYCODE_VOLUME_UP: case KeyEvent.KEYCODE_VOLUME_DOWN:
            case KeyEvent.KEYCODE_VOLUME_MUTE: case KeyEvent.KEYCODE_POWER: case KeyEvent.KEYCODE_UNKNOWN:
                return true;
            default:
                return false;
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** The saved action for a key, or null when it keeps its default behaviour. */
    static String action(Context context, int keyCode) {
        try {
            String raw = prefs(context).getString(String.valueOf(keyCode), null);
            return raw == null ? null : new JSONObject(raw).optString("action", null);
        } catch (Exception e) { return null; }
    }

    static boolean valid(String action) {
        if (action == null) return false;
        if (action.equals("home") || action.equals("none") || action.equals("screensaver") || action.equals("sleep")) return true;
        if (action.startsWith("app:")) return action.substring(4).matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+");
        return action.startsWith("input:") && action.length() > 6 && action.length() < 300;
    }

    /** Saves an action; "default" (or anything invalid) removes the assignment. */
    static void put(Context context, int keyCode, String name, String action) {
        SharedPreferences.Editor edit = prefs(context).edit();
        if (!valid(action)) edit.remove(String.valueOf(keyCode));
        else {
            try {
                edit.putString(String.valueOf(keyCode), new JSONObject().put("action", action)
                        .put("name", name == null ? KeyEvent.keyCodeToString(keyCode) : name).toString());
            } catch (Exception e) { return; }
        }
        edit.apply();
    }

    /** JSON array of {code, name, action}, sorted by key code. */
    static JSONArray list(Context context) {
        JSONArray out = new JSONArray();
        Map<Integer, JSONObject> sorted = new TreeMap<>();
        for (Map.Entry<String, ?> e : prefs(context).getAll().entrySet()) {
            try {
                JSONObject entry = new JSONObject(String.valueOf(e.getValue()));
                int code = Integer.parseInt(e.getKey());
                sorted.put(code, new JSONObject().put("code", code).put("name", entry.optString("name", KeyEvent.keyCodeToString(code)))
                        .put("action", entry.optString("action", "none")));
            } catch (Exception ignored) { }
        }
        for (JSONObject entry : sorted.values()) out.put(entry);
        return out;
    }
}
