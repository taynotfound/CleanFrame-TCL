package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Google TV always resolves Home to its own launcher and ignores the default-home setting.
 * This service (enabled by the user in Settings > Accessibility) sends Home to CleanFrame:
 * a short press opens CleanFrame, a long press opens the original Google TV Home.
 * It also applies the remote button assignments in RemoteKeys and captures a button for the learn step.
 */
public class HomeButtonService extends AccessibilityService {
    static final String GOOGLE_HOME = "com.google.android.apps.tv.launcherx";
    private static final long LONG_PRESS_MS = 800;
    /** Overlays that can sit on top of Google TV Home without the user leaving it. */
    private static final String[] OVERLAYS = { "com.android.systemui", "com.tcl.dashboard", "com.tcl.globalkeyoverlay",
            "com.google.android.inputmethod.latin", "com.tcl.inputmethod.international" };

    /** Set by DeviceBridge.systemHome() so a deliberate trip to Google TV Home is not undone. */
    static volatile long allowSystemHomeUntil;
    /** True while Android has this service bound, i.e. it is enabled and receiving keys. */
    static volatile boolean connected;
    private static HomeButtonService instance;
    /** Sleep timer: System.currentTimeMillis() when the TV goes to standby, 0 when off. */
    private static volatile long sleepAt;
    private final Runnable sleepNow = () -> { sleepAt = 0; performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN); };
    private static final String TAG = "CleanFrameKeys";

    private final Handler handler = new Handler(Looper.getMainLooper());
    /** Screen time: counts the app in front every half minute and sends a child back to Shore when its time is up. */
    private final Runnable screenTick = new Runnable() {
        @Override public void run() {
            if (ScreenTime.tick(HomeButtonService.this)) timesUp(ScreenTime.current());
            handler.postDelayed(this, 30000);
        }
    };
    private boolean inSystemHome, longFired;
    /** Key code whose press was captured by the learn step; its key-up is swallowed too. */
    private int learnedCode = -1;
    private final Runnable longPress = new Runnable() {
        @Override public void run() { longFired = true; openSystemHome(); }
    };


    @Override
    protected void onServiceConnected() {
        connected = true; instance = this; RemoteKeys.notifyChanged();
        handler.removeCallbacks(screenTick); handler.postDelayed(screenTick, 30000);
        // Just after boot: open Shore now instead of waiting for Google TV Home to draw and then replacing it.
        if (SystemClock.uptimeMillis() < 180000) openCleanFrame(false);
    }

    @Override
    public boolean onUnbind(Intent intent) {
        connected = false; instance = null; sleepAt = 0; handler.removeCallbacks(sleepNow); handler.removeCallbacks(screenTick); RemoteKeys.notifyChanged();
        return super.onUnbind(intent);
    }

    /**
     * Sleep timer. The accessibility lock action puts an Android TV into standby, the same as the remote's power
     * button; the timer lives here so it keeps running while another app is in front. Minutes 0 cancels.
     */
    static boolean sleepIn(int minutes) {
        HomeButtonService s = instance;
        if (s == null) return false;
        s.handler.removeCallbacks(s.sleepNow);
        if (minutes <= 0) { sleepAt = 0; return true; }
        sleepAt = System.currentTimeMillis() + minutes * 60000L;
        s.handler.postDelayed(s.sleepNow, minutes * 60000L);
        return true;
    }

    private static final int[] SLEEP_STEPS = { 30, 60, 90, 120 };

    /**
     * The sleep-timer remote button: each press moves to the next step above the time left (30, 60, 90, 120
     * minutes), and after 120 switches the timer off. A short note says what was set, over whatever is on screen.
     */
    private void sleepStep() {
        long left = sleepLeft();
        int minutes = 0;
        if (left <= 0) minutes = SLEEP_STEPS[0];
        else for (int step : SLEEP_STEPS) if (step > (left + 120000) / 60000) { minutes = step; break; } // a step just set counts as that step
        sleepIn(minutes);
        android.widget.Toast.makeText(this, sleepNote(minutes), android.widget.Toast.LENGTH_SHORT).show();
    }

    /** The note in the TV's language (the six Shore speaks), English otherwise. */
    static String sleepNote(int minutes) {
        String lang = java.util.Locale.getDefault().getLanguage();
        if (minutes <= 0) {
            switch (lang) {
                case "de": return "Sleep-Timer aus"; case "fr": return "Minuterie de veille désactivée"; case "es": return "Temporizador apagado";
                case "nl": return "Slaaptimer uit"; case "pl": return "Wyłącznik czasowy wyłączony"; case "uk": return "Таймер вимкнення вимкнено";
                default: return "Sleep timer off";
            }
        }
        switch (lang) {
            case "de": return "Aus in " + minutes + " Min."; case "fr": return "Veille dans " + minutes + " min"; case "es": return "Se apaga en " + minutes + " min";
            case "nl": return "Uit over " + minutes + " min"; case "pl": return "Wyłączenie za " + minutes + " min"; case "uk": return "Вимкнення через " + minutes + " хв";
            default: return "Sleep in " + minutes + " min";
        }
    }

    /** Milliseconds until standby, 0 when no timer runs, -1 when the service is off. */
    static long sleepLeft() { return instance == null ? -1 : sleepAt == 0 ? 0 : Math.max(1, sleepAt - System.currentTimeMillis()); }

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        boolean down = event.getAction() == KeyEvent.ACTION_DOWN, up = event.getAction() == KeyEvent.ACTION_UP;
        if (RemoteKeys.learning()) Log.i(TAG, (down ? "down " : up ? "up " : "other ") + code + " " + KeyEvent.keyCodeToString(code)
                + " scan=" + event.getScanCode() + " repeat=" + event.getRepeatCount() + " device=" + event.getDeviceId() + " source=0x" + Integer.toHexString(event.getSource()));
        if (code != KeyEvent.KEYCODE_HOME) return remoteKey(event, code, down, up);
        if (down && event.getRepeatCount() == 0) {
            longFired = false;
            handler.postDelayed(longPress, LONG_PRESS_MS);
        } else if (event.getAction() == KeyEvent.ACTION_UP) {
            handler.removeCallbacks(longPress);
            if (!longFired) openCleanFrame(true);
        }
        return true;
    }

    /** Learn step and saved assignments for every key except Home. Navigation keys always pass through. */
    private boolean remoteKey(KeyEvent event, int code, boolean down, boolean up) {
        if (code == learnedCode) { if (up) learnedCode = -1; return true; }
        if (RemoteKeys.navigation(code)) return false;
        if (RemoteKeys.learning()) {
            if (down && event.getRepeatCount() == 0) {
                RemoteKeys.learn(false);
                learnedCode = code;
                RemoteKeys.Listener l = RemoteKeys.listener;
                if (l != null) l.learned(code, KeyEvent.keyCodeToString(code), event.getScanCode());
            }
            return true;
        }
        String action = RemoteKeys.action(this, code);
        if (action == null) return false;
        if (up && !event.isCanceled()) perform(action);
        return true;
    }

    private void perform(String action) {
        DeviceBridge bridge = new DeviceBridge(this);
        boolean ok = true;
        if (action.equals("home")) openCleanFrame(true);
        else if (action.equals("screensaver")) ok = bridge.screensaver();
        else if (action.equals("sleep")) sleepStep();
        else if (action.startsWith("app:")) ok = bridge.launch(action.substring(4));
        else if (action.startsWith("input:")) ok = bridge.openInput(action.substring(6));
        if (!ok) Log.w(TAG, "Could not perform " + action);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();
        if (pkg.equals(GOOGLE_HOME)) {
            ScreenTime.front(this, pkg); // stops counting the app that was in front
            if (inSystemHome || SystemClock.uptimeMillis() < allowSystemHomeUntil) { inSystemHome = true; return; }
            openCleanFrame(false); // e.g. leaving an app or waking from standby lands on Google TV Home
            return;
        }
        for (String overlay : OVERLAYS) if (pkg.equals(overlay)) return;
        inSystemHome = false;
        if (ScreenTime.front(this, pkg) && !pkg.equals(getPackageName())) timesUp(pkg);
    }

    /** Back to Shore, which says the app's time is up for today; the PIN there can give more. */
    private void timesUp(String pkg) {
        if (pkg == null || pkg.isEmpty() || pkg.equals(getPackageName())) return;
        ScreenTime.timesUp(pkg);
        openCleanFrame(true);
    }

    @Override
    public void onInterrupt() { handler.removeCallbacks(longPress); }

    /** homeKey: the Home button itself, which also leaves Settings or All apps for Home. */
    private void openCleanFrame(boolean homeKey) {
        inSystemHome = false;
        startActivity(new Intent(this, MainActivity.class).putExtra(MainActivity.EXTRA_HOME_KEY, homeKey)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
    }

    private void openSystemHome() {
        allowSystemHomeUntil = SystemClock.uptimeMillis() + 5000;
        if (!new DeviceBridge(this).systemHome()) openCleanFrame(false);
    }
}
