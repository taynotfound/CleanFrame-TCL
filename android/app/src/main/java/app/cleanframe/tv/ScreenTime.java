package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.PowerManager;
import android.os.SystemClock;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.Locale;

/**
 * Screen time for the parental lock: a daily limit in minutes per app package, set in Shore's settings. The Home
 * button service reports which app is in front; minutes count only while the screen is on, and start again at
 * midnight. Extra time granted with the PIN is added to that day's limit only.
 */
final class ScreenTime {
    private static SharedPreferences prefs;
    private static String front = "";
    private static long since;

    private ScreenTime() { }

    private static synchronized SharedPreferences prefs(Context c) {
        if (prefs == null) prefs = c.getApplicationContext().getSharedPreferences("screentime", Context.MODE_PRIVATE);
        return prefs;
    }

    private static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date()); }

    private static JSONObject read(Context c, String key) {
        try { return new JSONObject(prefs(c).getString(key, "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    /** A new day starts with nothing used and no extra time. */
    private static synchronized void rollover(Context c) {
        SharedPreferences p = prefs(c);
        if (!today().equals(p.getString("day", ""))) p.edit().putString("day", today()).putString("used", "{}").putString("extra", "{}").apply();
    }

    /** From the page: {package: minutes}; anything else is dropped. */
    static synchronized void setLimits(Context c, String json) {
        JSONObject in, out = new JSONObject();
        try { in = new JSONObject(json == null || json.length() > 20000 ? "{}" : json); } catch (Exception e) { in = new JSONObject(); }
        for (Iterator<String> it = in.keys(); it.hasNext(); ) {
            String pkg = it.next();
            int m = in.optInt(pkg, 0);
            if (pkg.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+") && m > 0 && m <= 24 * 60) try { out.put(pkg, m); } catch (Exception ignored) { }
        }
        prefs(c).edit().putString("limits", out.toString()).apply();
    }

    /** {package: {limit, used}} in minutes, for the settings page. */
    static synchronized String info(Context c) {
        rollover(c);
        count(c);
        JSONObject limits = read(c, "limits"), out = new JSONObject();
        try {
            for (Iterator<String> it = limits.keys(); it.hasNext(); ) {
                String pkg = it.next();
                out.put(pkg, new JSONObject().put("limit", limit(c, pkg)).put("used", used(c, pkg) / 60000));
            }
        } catch (Exception ignored) { }
        return out.toString();
    }

    /** Minutes allowed today, with any extra time; 0 means no limit. */
    private static int limit(Context c, String pkg) {
        int base = read(c, "limits").optInt(pkg, 0);
        return base <= 0 ? 0 : base + read(c, "extra").optInt(pkg, 0);
    }

    private static long used(Context c, String pkg) { return read(c, "used").optLong(pkg, 0); }

    /** True when this app has a limit and today's is used up. */
    static synchronized boolean over(Context c, String pkg) {
        rollover(c);
        int l = limit(c, pkg);
        return l > 0 && used(c, pkg) >= l * 60000L;
    }

    /** Extra minutes for today, after the PIN. */
    static synchronized void extend(Context c, String pkg, int minutes) {
        rollover(c);
        if (pkg == null || minutes <= 0 || minutes > 240) return;
        JSONObject extra = read(c, "extra");
        try { extra.put(pkg, extra.optInt(pkg, 0) + minutes); } catch (Exception ignored) { }
        prefs(c).edit().putString("extra", extra.toString()).apply();
    }

    /** The app in front changed (the Home button service). Returns true when it is over its limit. */
    static synchronized boolean front(Context c, String pkg) {
        count(c);
        front = pkg == null ? "" : pkg;
        since = SystemClock.elapsedRealtime();
        return over(c, front);
    }

    /** Called every half minute: adds the time since the last call to the app in front. True when it just ran out. */
    static synchronized boolean tick(Context c) {
        count(c);
        return !front.isEmpty() && over(c, front);
    }

    static synchronized String current() { return front; }

    /** The app whose time just ran out, once, for the page to explain why Shore came up. */
    private static volatile String timesUp = "";
    static void timesUp(String pkg) { timesUp = pkg == null ? "" : pkg; }
    static String takeTimesUp() { String p = timesUp; timesUp = ""; return p; }

    /** Adds the time since the last count to the app in front, if it has a limit and the screen is on. */
    private static void count(Context c) {
        long now = SystemClock.elapsedRealtime(), spent = now - since;
        since = now;
        if (front.isEmpty() || spent <= 0 || spent > 10 * 60000L || read(c, "limits").optInt(front, 0) <= 0) return; // a gap over 10 minutes was standby
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        if (pm != null && !pm.isInteractive()) return;
        rollover(c);
        JSONObject used = read(c, "used");
        try { used.put(front, used.optLong(front, 0) + spent); } catch (Exception ignored) { }
        prefs(c).edit().putString("used", used.toString()).apply();
    }
}
