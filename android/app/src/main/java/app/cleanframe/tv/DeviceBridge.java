package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.provider.Settings;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityManager;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Implements what device.js does with Tizen APIs, using public Android intents. */
final class DeviceBridge {
    private final Context context;
    private final Activity activity; // null for the remote-button service and the screensaver
    private final PackageManager pm;
    private final OnlineWallpapers online;
    private final TopShelf topShelf;
    private final Companion phone;

    DeviceBridge(Context context) { this(context, null, null, null); }

    DeviceBridge(Context context, OnlineWallpapers online, TopShelf topShelf, Companion phone) {
        this.context = context.getApplicationContext();
        this.activity = context instanceof Activity ? (Activity) context : null;
        this.pm = this.context.getPackageManager();
        this.online = online;
        this.topShelf = topShelf;
        this.phone = phone;
    }

    /** Cached headlines: {at, feed, items:[{t, s, d}], error}. */
    @JavascriptInterface
    public String newsInfo() { return News.get(context).info(); }

    /** Fetches headlines in the background if the cache is stale; feed is the companion's RSS URL or empty for Google News. */
    @JavascriptInterface
    public void newsRefresh(String feed, boolean force) { News.get(context).refresh(feed, force); }

    /** Home Assistant add-on: {configured, enabled, url, status, error, at, areas, selected, states}. Never the token. Only the activity uses it. */
    @JavascriptInterface
    public String haInfo() { return activity == null ? "{}" : HomeAssistant.get(context).info(); }

    /** The add-on switch in Settings › Add-ons. */
    @JavascriptInterface
    public void haEnable(boolean on) { if (activity != null) HomeAssistant.get(context).setEnabled(on); }

    /** Rooms to show, as a JSON array of area names; empty shows every room. */
    @JavascriptInterface
    public void haAreas(String json) { if (activity != null) HomeAssistant.get(context).setAreas(json); }

    @JavascriptInterface
    public void haRefresh() { if (activity != null) HomeAssistant.get(context).refresh(); }

    @JavascriptInterface
    public void haToggle(String entity) { if (activity != null) HomeAssistant.get(context).toggle(entity); }

    /** Brightness, colour, thermostat target or mode; HomeAssistant.call checks the service and every field. */
    @JavascriptInterface
    public void haCall(String entity, String service, String json) { if (activity != null) HomeAssistant.get(context).call(entity, service, json); }

    /** Forgets the server and its token. */
    @JavascriptInterface
    public void haForget() { if (activity != null) HomeAssistant.get(context).forget(); }

    /** Camera signalling session (0 when it can't start); events arrive through window.CleanFrameHACamera. */
    @JavascriptInterface
    public int haCameraStart(String entity) { return activity == null ? 0 : HomeAssistant.get(context).cameraStart(entity); }

    @JavascriptInterface
    public void haCameraOffer(int session, String sdp) { if (activity != null) HomeAssistant.get(context).cameraOffer(session, sdp); }

    @JavascriptInterface
    public void haCameraHangup(int session) { if (activity != null) HomeAssistant.get(context).hangup(session); }

    /** Keeps (or releases) a favourite online photo across refreshes. */
    @JavascriptInterface
    public void onlineKeep(String id, boolean on) { if (online != null && id != null && id.matches("[A-Za-z0-9._-]{1,160}")) online.keep(id, on); }

    /** In-app updates from the public releases (Updater). Only the activity offers them. */
    @JavascriptInterface
    public String updateInfo() { return activity == null ? "{}" : Updater.get(context).info(); }

    @JavascriptInterface
    public void updateCheck() { if (activity != null) Updater.get(context).check(); }

    @JavascriptInterface
    public void updateInstall() { if (activity != null) Updater.get(context).install(); }

    @JavascriptInterface
    public void updateAuto(boolean on) { if (activity != null) Updater.get(context).setAuto(on); }

    /** {access, playing, title, artist, app, pkg} from the active media sessions (needs notification access). */
    @JavascriptInterface
    public String nowPlaying() { return NowPlayingService.info(context); }

    /** Same, and with lookup true also a sharper cover (iTunes) and a wide artist picture (TheAudioDB) when found. */
    @JavascriptInterface
    public String nowPlayingWith(boolean lookup) { return NowPlayingService.info(context, lookup); }

    /** Media keys for what is playing: toggle, next or prev. */
    @JavascriptInterface
    public boolean nowPlayingControl(String pkg, String action) { return action != null && action.matches("toggle|next|prev") && NowPlayingService.control(context, pkg, action); }

    /** Opens the screen where the user allows CleanFrame to read what is playing. */
    /** The music view's session, playing or paused: adds album, pos, dur, speed and seek. */
    @JavascriptInterface
    public String nowPlayingDetail(String pkg, boolean lookup) { return NowPlayingService.detail(context, pkg, lookup); }

    @JavascriptInterface
    public boolean nowPlayingSeek(String pkg, double ms) { return NowPlayingService.seek(context, pkg, (long) ms); }

    /** Beat pulse: start returns false without permission; level is -1 while off, else 0..1. */
    @JavascriptInterface
    public boolean beatStart() { return Beat.start(context); }

    @JavascriptInterface
    public void beatStop() { Beat.stop(); }

    /** A new song: the beat pulse learns its drums again. */
    @JavascriptInterface
    public void beatReset() { Beat.reset(); }

    @JavascriptInterface
    public double beat() { return Beat.level(); }

    @JavascriptInterface
    public void beatAllow() {
        if (activity != null) activity.runOnUiThread(() -> activity.requestPermissions(new String[] { Beat.PERMISSION }, 8));
    }

    /** {state: pending|ok|none|instrumental, synced:[[ms, line]], plain} from LRCLIB. */
    @JavascriptInterface
    public String lyrics(String artist, String title, String album, int seconds) { return Lyrics.get(artist, title, album, seconds); }
    @JavascriptInterface
    public String lyricsTranslate(String text, String lang) { return Lyrics.translate(text, lang); }

    @JavascriptInterface
    public boolean nowPlayingSettings() {
        return start(new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")) || settings();
    }

    /** Shore Companion: {enabled, url, qr, count, place}. */
    @JavascriptInterface
    public String phoneInfo() { return phone == null ? "{}" : phone.info(); }

    @JavascriptInterface
    public String phoneQr() { return phone == null ? "" : phone.qrCode(); }

    /** Switches the companion server on or off (remembered across restarts). */
    @JavascriptInterface
    public void phoneEnable(boolean on) { if (phone != null) phone.setEnabled(on); }

    /** The settings model for the companion's settings screens (JSON, built by the page). */
    @JavascriptInterface
    public void companionState(String json) { if (phone != null) phone.setState(json); }

    /** New pairing key; phones have to scan the code again. */
    @JavascriptInterface
    public void phoneForget() { if (phone != null) phone.forget(); }

    /** Wallpaper id shown on the TV, used as the companion's background. */
    @JavascriptInterface
    public void phoneWallpaper(String id) { if (phone != null) phone.setWallpaper(id); }

    @JavascriptInterface
    public void phoneClear() { if (phone != null) phone.clear(); }

    /** Top Shelf recommendations already on disk: {pkg: {service, items:[{title, sub, card, hero, url}]}}. */
    @JavascriptInterface
    public String topShelfIndex() { return topShelf == null ? "{}" : topShelf.index(); }

    /** Refreshes recommendations for these Home packages (JSON array) in the background. */
    @JavascriptInterface
    public void topShelf(String packagesJson) { if (topShelf != null && packagesJson != null) topShelf.request(packagesJson); }

    /** Opens an https:// or app deep link inside one package; false lets the page launch the app instead. */
    @JavascriptInterface
    public boolean openLink(String url, String pkg) {
        if (url == null || pkg == null || pkg.equals(context.getPackageName())) return false;
        if (url.startsWith("http://") || !url.startsWith("https://") && !url.matches("[a-z][a-z0-9+.-]*://[^\\s]+")) return false;
        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)).setPackage(pkg);
        return start(intent); // false when the app has no matching link handler
    }

    /** {source, unsplash}: the chosen online photo source and whether Unsplash has a build-time key. */
    @JavascriptInterface
    public String onlineInfo() {
        try {
            return new JSONObject().put("source", online == null ? "off" : online.source()).put("unsplash", OnlineWallpapers.unsplashAvailable())
                    .put("pexels", OnlineWallpapers.pexelsAvailable()).put("klipy", OnlineWallpapers.klipyAvailable()).put("phone", phone != null).put("failed", online == null ? "" : online.failed()).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** Chooses an online photo source ("off" clears the cache). force refreshes even when recent. */
    @JavascriptInterface
    public void onlineSource(String source, boolean force) {
        if (online != null && source != null) online.select(source, force);
    }

    @JavascriptInterface
    public boolean launch(String pkg) {
        if (pkg == null || pkg.equals(context.getPackageName())) return false;
        Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (intent == null) intent = pm.getLaunchIntentForPackage(pkg);
        return intent != null && start(intent);
    }

    /** Opens Android's App info page for an installed package (quick actions on a Home tile). */
    @JavascriptInterface
    public boolean appInfo(String pkg) {
        if (pkg == null || !pkg.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+")) return false;
        return start(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:" + pkg)));
    }

    /** Installed icon packs: JSON array of {id, name}. */
    /** Next event from the iCal address set on the phone: {title, start, allDay} or {}. */
    @JavascriptInterface
    public String calendarNext() { return phone == null ? "{}" : CalendarFeed.get(context).next(phone.calendar()); }

    /** Sleep timer through the Home-button service: minutes until standby, 0 to cancel. False when the service is off. */
    @JavascriptInterface
    public boolean sleepIn(int minutes) { return minutes >= 0 && minutes <= 600 && HomeButtonService.sleepIn(minutes); }

    @JavascriptInterface
    public double sleepLeft() { return HomeButtonService.sleepLeft(); }

    /** Saves the Home wallpaper the native start screen shows next time (a JPEG data URL from the page). */
    @JavascriptInterface
    public void backdrop(String dataUrl) { if (activity != null) { if (dataUrl == null || dataUrl.isEmpty()) Backdrop.clear(context); else Backdrop.save(context, dataUrl); } }

    /** The page has painted Home: the native start screen can go. */
    @JavascriptInterface
    public void pageReady() { if (activity instanceof MainActivity) activity.runOnUiThread(((MainActivity) activity)::hideCurtain); }

    /** Continue watching: {allowed, items}. */
    @JavascriptInterface
    public String watchNext() { return WatchNext.get(context).list(); }

    @JavascriptInterface
    public boolean watchNextOpen(String id) { return id != null && id.matches("[0-9]{1,18}") && WatchNext.get(context).open(id); }

    /** Shows Android's permission dialog for reading Continue watching. */
    @JavascriptInterface
    public void watchNextAllow() {
        if (activity != null) activity.runOnUiThread(() -> activity.requestPermissions(new String[] { WatchNext.PERMISSION }, 7));
    }

    @JavascriptInterface
    public String iconPacks() { return IconPacks.list(context); }

    /** JSON array of the packages an icon pack draws. */
    @JavascriptInterface
    public String iconPackApps(String pack) { return IconPacks.apps(context, pack); }

    /** JSON array of {appId, name} for every app the TV can launch. */
    @JavascriptInterface
    public String apps() {
        JSONArray out = new JSONArray();
        Set<String> seen = new HashSet<>();
        seen.add(context.getPackageName());
        collect(Intent.CATEGORY_LEANBACK_LAUNCHER, out, seen);
        collect(Intent.CATEGORY_LAUNCHER, out, seen); // phone-style apps some TVs still show
        return out.toString();
    }

    private void collect(String category, JSONArray out, Set<String> seen) {
        Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
        List<ResolveInfo> found = pm.queryIntentActivities(query, 0);
        for (ResolveInfo info : found) {
            String pkg = info.activityInfo.packageName;
            if (!seen.add(pkg)) continue;
            try {
                CharSequence label = info.loadLabel(pm);
                out.put(new JSONObject().put("appId", pkg).put("name", label == null ? pkg : label.toString()));
            } catch (Exception ignored) { }
        }
    }

    /** JSON array of {id, name, type, state} for HDMI and other physical inputs. state: 0 connected, 1 standby, 2 disconnected. */
    @JavascriptInterface
    public String inputs() {
        JSONArray out = new JSONArray();
        TvInputManager tv = (TvInputManager) context.getSystemService(Context.TV_INPUT_SERVICE);
        if (tv == null) return out.toString();
        List<TvInputInfo> all = tv.getTvInputList();
        // HDMI-CEC devices appear as child inputs of their port; their label is the device's own name ("PlayStation 5").
        java.util.Map<String, String> cec = new java.util.HashMap<>();
        for (TvInputInfo info : all) {
            if (info.getParentId() == null) continue;
            CharSequence label = info.loadLabel(context);
            if (label != null && label.length() > 0 && !cec.containsKey(info.getParentId())) cec.put(info.getParentId(), label.toString());
        }
        for (TvInputInfo info : all) {
            if (!info.isPassthroughInput() || info.isHidden(context) || info.getParentId() != null) continue;
            try {
                CharSequence custom = info.loadCustomLabel(context), label = info.loadLabel(context);
                String device = cec.get(info.getId());
                String name = custom != null && custom.length() > 0 ? custom.toString() : device != null ? device : label != null ? label.toString() : info.getId();
                out.put(new JSONObject().put("id", info.getId()).put("name", name)
                        .put("type", info.getType()).put("state", tv.getInputState(info.getId()))
                        .put("port", label != null ? label.toString() : ""));
            } catch (Exception ignored) { }
        }
        return out.toString();
    }

    /** Switches the TV to a physical input through the system TV app. */
    @JavascriptInterface
    public boolean openInput(String id) {
        if (id == null || id.isEmpty()) return false;
        return start(new Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(id)));
    }

    /** {service, learning, keys:[{code, name, action}]}: whether the button service is on, a learn step is waiting, and the saved assignments. */
    @JavascriptInterface
    public String remoteInfo() {
        try {
            boolean on = remoteServiceOn();
            return new JSONObject().put("service", on).put("blocked", !on && remoteServiceListed()).put("learning", RemoteKeys.learning()).put("keys", RemoteKeys.list(context)).toString();
        } catch (Exception e) { return "{}"; }
    }

    private boolean remoteServiceOn() {
        if (HomeButtonService.connected) return true;
        AccessibilityManager am = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        for (AccessibilityServiceInfo info : am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)) {
            if (info.getResolveInfo() != null && info.getResolveInfo().serviceInfo != null
                    && context.getPackageName().equals(info.getResolveInfo().serviceInfo.packageName)) return true;
        }
        return false;
    }

    /**
     * Switched on in Settings but not running. On TCL TVs the boot manager refuses to bind the
     * service after a restart unless Shore may auto start, and the toggle then stays on.
     */
    private boolean remoteServiceListed() {
        String list = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return list != null && list.contains(context.getPackageName() + "/");
    }

    /** Starts (or cancels) the learn step: the next non-navigation button is reported to the page instead of acting. */
    @JavascriptInterface
    public boolean remoteLearn(boolean on) {
        RemoteKeys.learn(on && remoteServiceOn());
        return RemoteKeys.learning();
    }

    /** Saves what a button does; "default" restores the TV's own behaviour. */
    @JavascriptInterface
    public void remoteSet(int keyCode, String name, String action) {
        if (keyCode <= 0 || RemoteKeys.navigation(keyCode)) return;
        RemoteKeys.put(context, keyCode, name, action);
    }

    @JavascriptInterface
    public boolean accessibilitySettings() {
        return start(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) || settings();
    }

    @JavascriptInterface
    public boolean settings() {
        return start(new Intent(Settings.ACTION_SETTINGS));
    }

    /** Opens the TV's original launcher (Google TV / TCL Home), never CleanFrame itself. */
    @JavascriptInterface
    public boolean systemHome() {
        HomeButtonService.allowSystemHomeUntil = android.os.SystemClock.uptimeMillis() + 5000;
        Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        for (ResolveInfo info : pm.queryIntentActivities(home, 0)) {
            ActivityInfo a = info.activityInfo;
            if (a.packageName.equals(context.getPackageName())) continue;
            if (a.packageName.equals("com.android.settings")) continue; // fallback "home" on some builds
            Intent intent = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                    .setComponent(new ComponentName(a.packageName, a.name));
            if (start(intent)) return true;
        }
        return false;
    }

    /** Remote-button action: bring Shore to the front with its own screensaver running. */
    public boolean screensaver() {
        return start(new Intent(context, MainActivity.class).putExtra(MainActivity.EXTRA_SAVER, true)
                .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
    }

    /** True once if Shore was opened to show its screensaver (remote button), so the page can start it. */
    @JavascriptInterface
    public boolean saverRequested() { return MainActivity.takeSaverRequest(); }

    /** Keeps the TV's own screensaver away while Shore's screensaver is enabled and Shore is in front. */
    @JavascriptInterface
    public void keepAwake(final boolean on) {
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (on) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }

    /** The TV's screensaver settings, where Shore can be picked as the screensaver where the TV allows it. */
    @JavascriptInterface
    public boolean screensaverSettings() { return start(new Intent(Settings.ACTION_DREAM_SETTINGS)); }

    private boolean start(Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }
}
