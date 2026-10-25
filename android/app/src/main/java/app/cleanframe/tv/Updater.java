package app.cleanframe.tv;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Self-contained updates from the public GitHub releases.
 * Checks the latest release, downloads its APK into the app's cache, checks that it is Shore,
 * newer and signed with the same key as the installed copy, then hands it to Android's
 * package installer, which asks the owner to confirm. Nothing installs silently.
 * Only public builds install updates; a self-built copy is told about new versions and rebuilt by its owner.
 */
final class Updater {
    interface Listener { void changed(); }

    static final String LATEST = "https://api.github.com/repos/taynotfound/shore/releases/latest";
    private static final String HOST = "https://github.com/taynotfound/shore/releases/download/";
    private static final long CHECK_EVERY = 6 * 60 * 60 * 1000L;
    private static final Pattern TAG = Pattern.compile("^v0\\.8\\.(\\d+)$");
    static final String ACTION_INSTALLED = "app.cleanframe.tv.UPDATE_STATUS";

    private static Updater instance;
    private final Context context;
    private final SharedPreferences prefs;
    private Listener listener;
    private volatile Thread worker;

    // State shown in Settings.
    private String status = "idle"; // idle checking current available downloading ready installing error
    private String error = "";
    private int progress;

    static synchronized Updater get(Context context) {
        if (instance == null) instance = new Updater(context.getApplicationContext());
        return instance;
    }

    private Updater(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences("updates", Context.MODE_PRIVATE);
        if (latestCode() > BuildConfig.VERSION_CODE) status = apk().exists() ? "ready" : "available";
        else if (prefs.getLong("checked", 0) > 0) status = "current";
    }

    void setListener(Listener l) { listener = l; }

    boolean auto() { return prefs.getBoolean("auto", true); }

    void setAuto(boolean on) { prefs.edit().putBoolean("auto", on).apply(); changed(); }

    /** Called when Shore comes to the front: checks at most every few hours, and only when automatic checks are on. */
    void checkIfStale() {
        if (auto() && System.currentTimeMillis() - prefs.getLong("checked", 0) > CHECK_EVERY) check();
    }

    synchronized String info() {
        try {
            JSONObject o = new JSONObject();
            o.put("status", status).put("error", error).put("progress", progress)
                    .put("current", BuildConfig.VERSION_NAME).put("code", BuildConfig.VERSION_CODE)
                    .put("latest", prefs.getString("name", "")).put("title", prefs.getString("title", ""))
                    .put("size", prefs.getLong("size", 0)).put("checked", prefs.getLong("checked", 0))
                    .put("auto", auto()).put("personal", !BuildConfig.PUBLIC_BUILD)
                    .put("canInstall", Build.VERSION.SDK_INT < 26 || context.getPackageManager().canRequestPackageInstalls());
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    void check() {
        run(() -> {
            set("checking", "", 0);
            try {
                JSONObject release = new JSONObject(read(LATEST));
                Matcher m = TAG.matcher(release.optString("tag_name"));
                if (!m.matches()) throw new Exception("No Shore release found.");
                int code = Integer.parseInt(m.group(1));
                String tag = release.optString("tag_name"), url = "";
                long size = 0;
                JSONArray assets = release.optJSONArray("assets");
                for (int i = 0; assets != null && i < assets.length(); i++) {
                    JSONObject a = assets.getJSONObject(i);
                    String u = a.optString("browser_download_url");
                    if (u.startsWith(HOST + tag + "/") && u.endsWith(".apk")) { url = u; size = a.optLong("size"); break; }
                }
                if (url.isEmpty()) throw new Exception("The latest release has no APK yet.");
                if (code != latestCode()) deleteApk();
                prefs.edit().putInt("code", code).putString("name", "0.8." + code).putString("url", url).putLong("size", size)
                        .putString("title", headline(release.optString("body"))).putLong("checked", System.currentTimeMillis()).apply();
                set(code > BuildConfig.VERSION_CODE ? (apk().exists() ? "ready" : "available") : "current", "", 0);
            } catch (Exception e) {
                prefs.edit().putLong("checked", System.currentTimeMillis()).apply(); // don't retry on every resume
                set("error", "Couldn’t check for updates. Check the TV’s internet connection.", 0);
            }
        });
    }

    /** Downloads (if needed), verifies and opens the installer. */
    void install() {
        // A copy built with the owner's own keys is never replaced by the keyless public APK: they rebuild instead.
        if (!BuildConfig.PUBLIC_BUILD) return;
        if (latestCode() <= BuildConfig.VERSION_CODE) { check(); return; }
        if (Build.VERSION.SDK_INT >= 26 && !context.getPackageManager().canRequestPackageInstalls()) {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + context.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { context.startActivity(i); } catch (Exception e) {
                set("error", "Allow Shore to install apps in the TV’s settings: Apps › Special app access › Install unknown apps.", 0);
            }
            return;
        }
        run(() -> {
            try {
                File file = apk();
                if (!file.exists()) download(file);
                verify(file);
                set("installing", "", 100);
                session(file);
            } catch (Exception e) {
                deleteApk();
                set("error", e.getMessage() != null && e.getMessage().startsWith("!") ? e.getMessage().substring(1) : "The download didn’t finish. Try again.", 0);
            }
        });
    }

    private void download(File file) throws Exception {
        set("downloading", "", 0);
        File part = new File(file.getPath() + ".part");
        file.getParentFile().mkdirs();
        HttpURLConnection c = open(prefs.getString("url", ""));
        long total = c.getContentLengthLong() > 0 ? c.getContentLengthLong() : prefs.getLong("size", 0), done = 0;
        try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part)) {
            byte[] buf = new byte[64 * 1024];
            int n, last = -1;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                done += n;
                int pct = total > 0 ? (int) (done * 100 / total) : 0;
                if (pct != last && pct % 5 == 0) { last = pct; set("downloading", "", pct); }
            }
        } finally { c.disconnect(); }
        if (total > 0 && done != total) { part.delete(); throw new Exception(); }
        if (!part.renameTo(file)) throw new Exception();
    }

    /** Same package, newer version, same signing key as the installed copy. */
    @SuppressWarnings("deprecation")
    private void verify(File file) throws Exception {
        PackageManager pm = context.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo apk = pm.getPackageArchiveInfo(file.getPath(), flags);
        PackageInfo self = pm.getPackageInfo(context.getPackageName(), flags);
        if (apk == null || !context.getPackageName().equals(apk.packageName)) throw new Exception("!The download isn’t a Shore update.");
        long code = Build.VERSION.SDK_INT >= 28 ? apk.getLongVersionCode() : apk.versionCode;
        if (code <= BuildConfig.VERSION_CODE) throw new Exception("!This version is already installed.");
        if (!Arrays.equals(signers(apk), signers(self)))
            throw new Exception("!This update is signed with a different key than your copy of Shore, so Android can’t install it over it.");
    }

    @SuppressWarnings("deprecation")
    private static byte[] signers(PackageInfo p) {
        Signature[] s = Build.VERSION.SDK_INT >= 28 && p.signingInfo != null ? p.signingInfo.getApkContentsSigners() : p.signatures;
        return s != null && s.length > 0 ? s[0].toByteArray() : new byte[0];
    }

    private void session(File file) throws Exception {
        PackageInstaller installer = context.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(context.getPackageName());
        params.setSize(file.length());
        int id = installer.createSession(params);
        try (PackageInstaller.Session s = installer.openSession(id)) {
            try (InputStream in = new FileInputStream(file); OutputStream out = s.openWrite("shore.apk", 0, file.length())) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            }
            Intent done = new Intent(context, Status.class).setAction(ACTION_INSTALLED);
            int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            s.commit(PendingIntent.getBroadcast(context, id, done, f).getIntentSender());
        }
    }

    /** Receives the installer's answer: asks the owner to confirm, or reports a failure. */
    public static final class Status extends BroadcastReceiver {
        @Override public void onReceive(Context context, Intent intent) {
            Updater u = get(context);
            int code = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (code == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                if (confirm != null) { confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); context.startActivity(confirm); }
            } else if (code == PackageInstaller.STATUS_SUCCESS) {
                u.deleteApk();
            } else if (code == PackageInstaller.STATUS_FAILURE_ABORTED) {
                u.set("ready", "", 0);
            } else {
                u.set("error", "Android didn’t install the update. Try again, or install it from the releases page.", 0);
            }
        }
    }

    // ---------- What's new: the installed version's release notes, shown on Home once after an update ----------

    private volatile boolean fetchingNotes;

    /** {pending, version, title, items} for the installed version; fetched from its release once, and again an hour later if that failed. */
    synchronized String notes() {
        String v = BuildConfig.VERSION_NAME, seen = prefs.getString("seen", "");
        // Before this existed there was no record, so a copy that has checked for updates counts as updated; a new install doesn't.
        if (seen.isEmpty() && prefs.getLong("checked", 0) == 0) { prefs.edit().putString("seen", v).apply(); seen = v; }
        if (!prefs.getString("notesFor", "").equals(v)) { fetchNotes(v); return "{}"; }
        try { return new JSONObject(prefs.getString("notes", "{}")).put("pending", !seen.equals(v)).toString(); } catch (Exception e) { return "{}"; }
    }

    void notesSeen() { prefs.edit().putString("seen", BuildConfig.VERSION_NAME).apply(); }

    private void fetchNotes(final String v) {
        long now = System.currentTimeMillis();
        if (fetchingNotes || !TAG.matcher("v" + v).matches() || now - prefs.getLong("notesTried", 0) < 3600000L) return;
        fetchingNotes = true;
        prefs.edit().putLong("notesTried", now).apply();
        new Thread(() -> {
            try {
                JSONObject release = new JSONObject(read("https://api.github.com/repos/taynotfound/shore/releases/tags/v" + v));
                prefs.edit().putString("notesFor", v).putString("notes", parseNotes(v, release.optString("body")).toString()).apply();
                changed();
            } catch (Exception ignored) {
            } finally { fetchingNotes = false; }
        }, "shore-notes").start();
    }

    /** The release's "## " headline and the "- " lines under it, without Markdown or HTML. */
    static JSONObject parseNotes(String version, String body) throws Exception {
        String title = "";
        JSONArray items = new JSONArray();
        boolean in = false;
        for (String raw : body.split("\n")) {
            String line = raw.trim();
            if (line.startsWith("## ")) { if (in) break; title = plain(line.substring(3)); in = true; }
            else if (in && line.startsWith("#")) break;
            else if (in && line.startsWith("- ") && items.length() < 40) items.put(plain(line.substring(2)));
        }
        return new JSONObject().put("version", version).put("title", title).put("items", items);
    }

    private static String plain(String s) {
        s = s.replaceAll("!\\[[^\\]]*\\]\\([^)]*\\)", "").replaceAll("\\[([^\\]]*)\\]\\([^)]*\\)", "$1").replaceAll("<[^>]+>", "").replace("**", "").replace("`", "").trim();
        return s.length() > 300 ? s.substring(0, 300) : s;
    }

    private static String headline(String body) {
        for (String line : body.split("\n")) if (line.startsWith("## ")) return line.substring(3).trim();
        return "";
    }

    private int latestCode() { return prefs.getInt("code", 0); }

    private File apk() { return new File(new File(context.getCacheDir(), "update"), "shore-" + latestCode() + ".apk"); }

    private void deleteApk() {
        File dir = new File(context.getCacheDir(), "update");
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) f.delete();
    }

    private void run(Runnable job) {
        synchronized (this) {
            if (worker != null && worker.isAlive()) return; // one check or download at a time
            worker = new Thread(job, "shore-update");
            worker.start();
        }
    }

    private void set(String s, String e, int p) {
        synchronized (this) { status = s; error = e; progress = p; }
        changed();
    }

    private void changed() { Listener l = listener; if (l != null) l.changed(); }

    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestProperty("User-Agent", "Shore/" + BuildConfig.VERSION_NAME + " (+https://github.com/taynotfound/shore)");
        c.setRequestProperty("Accept", url.startsWith("https://api.github.com/") ? "application/vnd.github+json" : "application/octet-stream");
        c.setInstanceFollowRedirects(true);
        if (c.getResponseCode() / 100 != 2) { c.disconnect(); throw new Exception("HTTP " + c.getResponseCode()); }
        return c;
    }

    private static String read(String url) throws Exception {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream()) {
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16 * 1024];
            int n;
            while ((n = in.read(buf)) > 0 && out.size() < 2 * 1024 * 1024) out.write(buf, 0, n);
            return out.toString("UTF-8");
        } finally { c.disconnect(); }
    }
}
