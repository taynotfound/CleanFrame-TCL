package app.cleanframe.tv;

import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.webkit.WebView;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Problem report for the phone companion (TV settings › Problem report): Shore's own crashes, Android's record of
 * recent exits (an app that stopped responding included) and errors from the page. It stays on the TV until the
 * owner downloads it; nothing is sent anywhere. It holds no settings, addresses, passwords or device identifiers.
 */
final class Diagnostics {
    private static final int KEEP = 10, PAGE_KEEP = 60;
    private static long pageMinute;
    private static int pageCount;

    private Diagnostics() { }

    private static File dir(Context c) { File d = new File(c.getFilesDir(), "diagnostics"); d.mkdirs(); return d; }

    private static String now() { return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ROOT).format(new Date()); }

    /** Records uncaught exceptions on any thread, then lets Android handle them as before. */
    static void install(Context context) {
        final Context app = context.getApplicationContext();
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try {
                StringWriter trace = new StringWriter();
                error.printStackTrace(new PrintWriter(trace));
                note(app, "Crash on thread " + thread.getName(), trace.toString());
            } catch (Throwable ignored) { }
            if (previous != null) previous.uncaughtException(thread, error);
        });
    }

    /** One event (a crash, the page's renderer stopping) as its own file; only the newest few are kept. */
    static synchronized void note(Context c, String title, String text) {
        try {
            File d = dir(c);
            try (FileOutputStream out = new FileOutputStream(new File(d, "event-" + System.currentTimeMillis() + ".txt"))) {
                out.write((now() + " · Shore " + BuildConfig.VERSION_NAME + " · " + title + "\n" + clip(text, 32 * 1024) + "\n").getBytes(StandardCharsets.UTF_8));
            }
            File[] old = d.listFiles((f, n) -> n.startsWith("event-"));
            if (old != null && old.length > KEEP) {
                Arrays.sort(old, (a, b) -> a.getName().compareTo(b.getName()));
                for (int i = 0; i < old.length - KEEP; i++) old[i].delete();
            }
        } catch (Exception ignored) { }
    }

    /** An error from the page (window.onerror); at most 20 a minute, the newest 60 kept. */
    static synchronized void pageError(Context c, String text) {
        long minute = System.currentTimeMillis() / 60000;
        if (minute != pageMinute) { pageMinute = minute; pageCount = 0; }
        if (++pageCount > 20 || text == null) return;
        try {
            File f = new File(dir(c), "page.txt");
            String all = f.exists() ? new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8) : "";
            all += now() + " " + clip(text.replace('\n', ' '), 600) + "\n";
            String[] lines = all.split("\n");
            if (lines.length > PAGE_KEEP) all = String.join("\n", Arrays.copyOfRange(lines, lines.length - PAGE_KEEP, lines.length)) + "\n";
            Files.write(f.toPath(), all.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) { }
    }

    static synchronized void clear(Context c) {
        File[] all = dir(c).listFiles();
        if (all != null) for (File f : all) f.delete();
        if (Build.VERSION.SDK_INT >= 30) c.getSharedPreferences("diagnostics", Context.MODE_PRIVATE).edit().putLong("exitsAfter", System.currentTimeMillis()).apply();
    }

    /** The plain-text report. */
    static synchronized String report(Context c) {
        StringBuilder b = new StringBuilder();
        b.append("Shore problem report\nCreated ").append(now()).append("\n\n");
        b.append("Shore ").append(BuildConfig.VERSION_NAME).append(" (").append(BuildConfig.VERSION_CODE).append(BuildConfig.PUBLIC_BUILD ? ", release build" : ", self-built").append(")\n");
        b.append("Android ").append(Build.VERSION.RELEASE).append(" (API ").append(Build.VERSION.SDK_INT).append("), ").append(Build.MANUFACTURER).append(' ').append(Build.MODEL).append(" (").append(Build.DEVICE).append(")\n");
        try {
            PackageInfo w = WebView.getCurrentWebViewPackage();
            if (w != null) b.append("WebView ").append(w.packageName).append(' ').append(w.versionName).append('\n');
        } catch (Exception ignored) { }
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            ActivityManager.MemoryInfo m = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(m);
            b.append("Memory ").append(m.availMem >> 20).append(" MB free of ").append(m.totalMem >> 20).append(" MB").append(m.lowMemory ? ", low" : "").append('\n');
        }
        b.append("Language ").append(Locale.getDefault().toLanguageTag()).append("\n\n");

        b.append("== Shore's own record (newest first) ==\n");
        File[] events = dir(c).listFiles((f, n) -> n.startsWith("event-"));
        if (events == null || events.length == 0) b.append("Nothing recorded.\n");
        else {
            Arrays.sort(events, (x, y) -> y.getName().compareTo(x.getName()));
            for (File f : events) { try { b.append(new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8)).append('\n'); } catch (Exception ignored) { } }
        }

        b.append("\n== Recent exits recorded by Android ==\n");
        if (Build.VERSION.SDK_INT >= 30 && am != null) exits(c, am, b);
        else b.append("Android ").append(Build.VERSION.RELEASE).append(" doesn't keep this record (it needs Android 11).\n");

        b.append("\n== Page errors (oldest first) ==\n");
        File page = new File(dir(c), "page.txt");
        try { b.append(page.exists() ? new String(Files.readAllBytes(page.toPath()), StandardCharsets.UTF_8) : "Nothing recorded.\n"); } catch (Exception e) { b.append("Unreadable.\n"); }
        return b.toString();
    }

    @android.annotation.TargetApi(30)
    private static void exits(Context c, ActivityManager am, StringBuilder b) {
        long after = c.getSharedPreferences("diagnostics", Context.MODE_PRIVATE).getLong("exitsAfter", 0);
        List<ApplicationExitInfo> list = am.getHistoricalProcessExitReasons(c.getPackageName(), 0, 10);
        int shown = 0;
        for (ApplicationExitInfo e : list) {
            if (e.getTimestamp() < after) continue;
            int r = e.getReason();
            if (r == ApplicationExitInfo.REASON_USER_REQUESTED || r == ApplicationExitInfo.REASON_PACKAGE_UPDATED || r == ApplicationExitInfo.REASON_OTHER) continue;
            shown++;
            b.append(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ROOT).format(new Date(e.getTimestamp()))).append(" · ").append(reason(r))
                    .append(" · ").append(e.getProcessName()).append(e.getDescription() != null ? " · " + e.getDescription() : "").append('\n');
            if (r == ApplicationExitInfo.REASON_ANR) {
                try (InputStream in = e.getTraceInputStream()) {
                    if (in != null) b.append(head(in, 48 * 1024)).append('\n');
                } catch (Exception ignored) { }
            }
        }
        if (shown == 0) b.append("Nothing unusual.\n");
    }

    private static String reason(int r) {
        switch (r) {
            case ApplicationExitInfo.REASON_ANR: return "Stopped responding (ANR)";
            case ApplicationExitInfo.REASON_CRASH: return "Crash";
            case ApplicationExitInfo.REASON_CRASH_NATIVE: return "Native crash";
            case ApplicationExitInfo.REASON_LOW_MEMORY: return "Closed for low memory";
            case ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE: return "Closed for using too much";
            case ApplicationExitInfo.REASON_INITIALIZATION_FAILURE: return "Failed to start";
            case ApplicationExitInfo.REASON_SIGNALED: return "Stopped by the system";
            case ApplicationExitInfo.REASON_EXIT_SELF: return "Exited";
            case ApplicationExitInfo.REASON_PERMISSION_CHANGE: return "Permission changed";
            case ApplicationExitInfo.REASON_DEPENDENCY_DIED: return "Dependency stopped";
            default: return "Reason " + r;
        }
    }

    /** The start of a long trace; the rest is left unread. */
    private static String head(InputStream in, int max) throws java.io.IOException {
        byte[] buf = new byte[max];
        int got = 0;
        for (int n; got < max && (n = in.read(buf, got, max - got)) > 0; ) got += n;
        return new String(buf, 0, got, StandardCharsets.UTF_8) + (in.read() >= 0 ? "\n…" : "");
    }

    private static String clip(String s, int max) { return s.length() > max ? s.substring(0, max) + "\n…" : s; }
}
