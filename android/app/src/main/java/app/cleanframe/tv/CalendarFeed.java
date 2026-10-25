package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The next event from an iCal link typed in the phone companion (Google, Apple and Outlook all offer a private
 * "secret address in iCal format"), for the line under the clock. Only that address is fetched, every 15 minutes
 * while the line is on; the events stay on the TV. Repeating events are expanded for the common rules
 * (daily, weekly on given days, monthly, yearly, with INTERVAL, COUNT and UNTIL); exceptions are not.
 */
final class CalendarFeed {
    private static final ExecutorService NET = Executors.newSingleThreadExecutor();
    private static final long EVERY = 15 * 60000L, AHEAD = 3 * 86400000L;
    private static final Pattern DT = Pattern.compile("(\\d{4})(\\d{2})(\\d{2})(?:T(\\d{2})(\\d{2})(\\d{2})?(Z)?)?");
    private static final String[] DAYS = { "SU", "MO", "TU", "WE", "TH", "FR", "SA" };

    private static CalendarFeed instance;
    private final SharedPreferences prefs;
    private volatile boolean busy;

    static synchronized CalendarFeed get(Context c) {
        if (instance == null) instance = new CalendarFeed(c.getApplicationContext());
        return instance;
    }

    private CalendarFeed(Context c) { prefs = c.getSharedPreferences("calendar", Context.MODE_PRIVATE); }

    /** {title, start (ms), allDay} of the next event within three days, or {} when there is none or no address. */
    String next(String address) {
        String url = clean(address);
        if (url.isEmpty()) return "{}";
        if (!url.equals(prefs.getString("url", "")) || System.currentTimeMillis() - prefs.getLong("at", 0) > EVERY) refresh(url);
        if (!url.equals(prefs.getString("url", ""))) return "{}";
        return prefs.getString("next", "{}");
    }

    /** Up to three events within three days, soonest first (the widgets row), or []. */
    String upcoming(String address) {
        if (next(address).equals("{}")) return "[]";
        return prefs.getString("events", "[]");
    }

    static String clean(String address) {
        String u = address == null ? "" : address.trim();
        if (u.regionMatches(true, 0, "webcal://", 0, 9)) u = "https://" + u.substring(9);
        return u.matches("(?i)https?://\\S{4,1000}") ? u : "";
    }

    private void refresh(final String url) {
        if (busy) return;
        busy = true;
        prefs.edit().putLong("at", System.currentTimeMillis()).apply(); // a failure waits for the next round too
        NET.execute(() -> {
            try {
                JSONArray soon = parse(fetch(url), System.currentTimeMillis());
                prefs.edit().putString("url", url).putString("next", soon.length() == 0 ? "{}" : soon.getJSONObject(0).toString()).putString("events", soon.toString()).apply();
            } catch (Exception ignored) {
            } finally { busy = false; }
        });
    }

    private static String fetch(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setConnectTimeout(10000); c.setReadTimeout(20000);
            c.setRequestProperty("User-Agent", OnlineWallpapers.UA);
            if (c.getResponseCode() != 200) throw new IllegalStateException("HTTP " + c.getResponseCode());
            try (InputStream in = c.getInputStream()) { return new String(OnlineWallpapers.readAll(in, 8 << 20), StandardCharsets.UTF_8); }
        } finally { c.disconnect(); }
    }

    /** The three soonest events that haven't ended, starting within three days. */
    static JSONArray parse(String ics, long now) throws Exception {
        String text = ics.replace("\r\n", "\n").replace("\n ", "").replace("\n\t", "");
        List<JSONObject> found = new ArrayList<>();
        for (String block : text.split("BEGIN:VEVENT")) {
            int end = block.indexOf("END:VEVENT");
            if (end < 0) continue;
            String ev = block.substring(0, end), summary = "", start = null, stop = null, rule = null;
            boolean cancelled = false;
            for (String line : ev.split("\n")) {
                int colon = line.indexOf(':');
                if (colon < 0) continue;
                String name = line.substring(0, colon), value = line.substring(colon + 1).trim();
                String key = name.split(";")[0].toUpperCase(Locale.ROOT);
                if (key.equals("SUMMARY")) summary = value.replace("\\,", ",").replace("\\;", ";").replace("\\n", " ").replace("\\\\", "\\");
                else if (key.equals("DTSTART")) start = name + ":" + value;
                else if (key.equals("DTEND")) stop = name + ":" + value;
                else if (key.equals("RRULE")) rule = value;
                else if (key.equals("STATUS") && value.equalsIgnoreCase("CANCELLED")) cancelled = true;
            }
            if (cancelled || start == null || summary.isEmpty()) continue;
            boolean allDay = !start.contains("T") || start.toUpperCase(Locale.ROOT).contains("VALUE=DATE:");
            long s = time(start), e = stop != null ? time(stop) : s + (allDay ? 86400000L : 3600000L), length = Math.max(0, e - s);
            if (s < 0) continue;
            for (long at : occurrences(s, rule, now - length, now + AHEAD)) {
                if (at + length > now && at < now + AHEAD) found.add(new JSONObject().put("title", summary.length() > 120 ? summary.substring(0, 120) : summary).put("start", at).put("allDay", allDay));
            }
        }
        Collections.sort(found, (a, b) -> Long.compare(a.optLong("start"), b.optLong("start")));
        JSONArray out = new JSONArray();
        for (int i = 0; i < found.size() && i < 3; i++) out.put(found.get(i));
        return out;
    }

    /** "DTSTART;TZID=Europe/Berlin:20261025T180000", "DTSTART:20261025T160000Z" or a date: milliseconds, -1 if unreadable. */
    static long time(String prop) {
        int colon = prop.lastIndexOf(':');
        Matcher m = DT.matcher(prop.substring(colon + 1));
        if (!m.find()) return -1;
        TimeZone zone = TimeZone.getDefault();
        Matcher tz = Pattern.compile("TZID=([^;:]+)").matcher(prop.substring(0, colon));
        if (m.group(7) != null) zone = TimeZone.getTimeZone("UTC");
        else if (tz.find()) zone = TimeZone.getTimeZone(tz.group(1).replace("\"", ""));
        Calendar c = Calendar.getInstance(zone);
        c.clear();
        c.set(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)) - 1, Integer.parseInt(m.group(3)),
                m.group(4) == null ? 0 : Integer.parseInt(m.group(4)), m.group(5) == null ? 0 : Integer.parseInt(m.group(5)), m.group(6) == null ? 0 : Integer.parseInt(m.group(6)));
        return c.getTimeInMillis();
    }

    /** Start times of an event (and its repeats) that can fall between from and to. */
    static List<Long> occurrences(long first, String rule, long from, long to) {
        List<Long> out = new ArrayList<>();
        if (rule == null) { out.add(first); return out; }
        String freq = part(rule, "FREQ"), byDay = part(rule, "BYDAY"), until = part(rule, "UNTIL");
        int interval = Math.max(1, num(part(rule, "INTERVAL"), 1)), count = num(part(rule, "COUNT"), Integer.MAX_VALUE);
        long last = until.isEmpty() ? Long.MAX_VALUE : time("UNTIL:" + until) + (until.contains("T") ? 0 : 86400000L);
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(first);
        int n = 0;
        for (int step = 0; step < 5000 && n < count; step++) {
            long base = c.getTimeInMillis();
            if (base > to || base > last) break;
            if (freq.equals("WEEKLY") && !byDay.isEmpty()) {
                // Each listed weekday in this week, in order.
                Calendar w = (Calendar) c.clone();
                w.add(Calendar.DAY_OF_MONTH, -((w.get(Calendar.DAY_OF_WEEK) - w.getFirstDayOfWeek() + 7) % 7));
                for (int d = 0; d < 7 && n < count; d++) {
                    long at = w.getTimeInMillis();
                    if (at >= first && at <= last && byDay.contains(DAYS[w.get(Calendar.DAY_OF_WEEK) - 1])) { n++; if (at >= from && at <= to) out.add(at); }
                    w.add(Calendar.DAY_OF_MONTH, 1);
                }
                c.add(Calendar.WEEK_OF_YEAR, interval);
                continue;
            }
            n++;
            if (base >= from) out.add(base);
            if (freq.equals("DAILY")) c.add(Calendar.DAY_OF_MONTH, interval);
            else if (freq.equals("WEEKLY")) c.add(Calendar.WEEK_OF_YEAR, interval);
            else if (freq.equals("MONTHLY")) c.add(Calendar.MONTH, interval);
            else if (freq.equals("YEARLY")) c.add(Calendar.YEAR, interval);
            else break;
        }
        return out;
    }

    private static String part(String rule, String key) {
        for (String p : rule.split(";")) if (p.toUpperCase(Locale.ROOT).startsWith(key + "=")) return p.substring(key.length() + 1).toUpperCase(Locale.ROOT);
        return "";
    }

    private static int num(String s, int fallback) { try { return s.isEmpty() ? fallback : Integer.parseInt(s); } catch (NumberFormatException e) { return fallback; } }
}
