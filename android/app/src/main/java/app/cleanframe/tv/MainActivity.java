package app.cleanframe.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.media.tv.TvInputManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/** Full-screen WebView that runs the unchanged CleanFrame UI from the APK's assets. */
public class MainActivity extends Activity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String EXTRA_SAVER = "app.cleanframe.tv.SAVER", EXTRA_HOME_KEY = "app.cleanframe.tv.HOME_KEY";
    private static volatile boolean saverRequest;
    private boolean loaded, resumed, homeRequest;
    private android.widget.ImageView curtain;

    static boolean takeSaverRequest() { boolean r = saverRequest; saverRequest = false; return r; }
    private WebView web;
    private TvInputManager tvInputs;
    private OnlineWallpapers online;
    private TopShelf topShelf;
    private Companion phone;
    private RemoteKeys.Listener remoteListener;

    /** Tells the page when an HDMI device is plugged in, powered on or switched off. */
    private final TvInputManager.TvInputCallback inputCallback = new TvInputManager.TvInputCallback() {
        @Override public void onInputStateChanged(String inputId, int state) { inputsChanged(); }
        @Override public void onInputAdded(String inputId) { inputsChanged(); }
        @Override public void onInputRemoved(String inputId) { inputsChanged(); }
        @Override public void onInputUpdated(String inputId) { inputsChanged(); }
    };

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        deleteSharedPreferences("atvremote"); // key of the removed remote-service pairing (0.8.4x)
        if (getIntent() != null && getIntent().getBooleanExtra(EXTRA_SAVER, false)) saverRequest = true;
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        // The last wallpaper over the WebView until the page paints (see Backdrop).
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.addView(web);
        android.graphics.Bitmap still = Backdrop.load(this);
        if (still != null) {
            curtain = new android.widget.ImageView(this);
            curtain.setScaleType(android.widget.ImageView.ScaleType.CENTER_CROP);
            curtain.setImageBitmap(still);
            curtain.setFocusable(false);
            root.addView(curtain);
            new Handler(Looper.getMainLooper()).postDelayed(this::hideCurtain, 30000); // never longer than this
        }
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // preferences live in localStorage
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false); // muted animated wallpapers autoplay
        s.setSupportZoom(false);

        // A fixed https origin keeps localStorage stable across updates.
        online = new OnlineWallpapers(this);
        online.setListener((entries, status) -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameOnlineChanged&&window.CleanFrameOnlineChanged(" + (entries == null ? "null" : entries)
                    + "," + org.json.JSONObject.quote(status) + ")", null);
        }));
        topShelf = new TopShelf(this);
        topShelf.setListener(index -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameTopShelfChanged&&window.CleanFrameTopShelfChanged(" + index + ")", null);
        }));
        WatchNext.get(this).setListener(this::watchNextChanged);
        Updater.get(this).setListener(() -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameUpdateChanged&&window.CleanFrameUpdateChanged()", null);
        }));
        phone = new Companion(this);
        online.setPhone(phone);
        phone.setCommands(new Companion.Commands() {
            @Override public void set(String axis, String value) {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameCompanionSet&&window.CleanFrameCompanionSet(" + org.json.JSONObject.quote(axis) + "," + org.json.JSONObject.quote(value) + ")", null); });
            }
            @Override public void restore(String json) {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameCompanionRestore&&window.CleanFrameCompanionRestore(" + org.json.JSONObject.quote(json) + ")", null); });
            }
        });
        phone.setListener(count -> {
            online.phoneChanged();
            runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFramePhoneChanged&&window.CleanFramePhoneChanged(" + count + ")", null); });
        });
        // Home Assistant add-on: new states and camera signalling go to the page (see HomeAssistant).
        HomeAssistant.get(this).setListener(new HomeAssistant.Listener() {
            @Override public void changed() {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameHAChanged&&window.CleanFrameHAChanged()", null); });
            }
            @Override public void camera(String json) {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameHACamera&&window.CleanFrameHACamera(" + json + ")", null); });
            }
        });
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/assets/", online.handler()) // online photos, then bundled files
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/appicon/", new AppIconHandler(this))
                .addPathHandler("/appbanner/", new AppIconHandler(this, true))
                .addPathHandler("/topshelf/", topShelf.handler())
                .addPathHandler("/watchnext/", WatchNext.get(this).handler())
                .addPathHandler("/nowplaying/", NowPlayingService.handler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // Home screen never navigates away.
            }

            @Override
            public void onPageFinished(WebView view, String url) { loaded = true; }
        });

        RemoteKeys.listener = remoteListener = new RemoteKeys.Listener() {
            @Override public void learned(int keyCode, String name, int scanCode) {
                String json = "{\"code\":" + keyCode + ",\"name\":" + org.json.JSONObject.quote(name) + ",\"scan\":" + scanCode + "}";
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameRemoteLearned&&window.CleanFrameRemoteLearned(" + json + ")", null); });
            }
            @Override public void changed() { runOnUiThread(MainActivity.this::remoteChanged); }
        };
        web.addJavascriptInterface(new DeviceBridge(this, online, topShelf, phone), "CleanFrameAndroid");
        web.loadUrl(ORIGIN + "/assets/index.html");
        tvInputs = (TvInputManager) getSystemService(TV_INPUT_SERVICE);
        if (tvInputs != null) tvInputs.registerCallback(inputCallback, new Handler(Looper.getMainLooper()));
        web.requestFocus();
    }

    /**
     * The remote's Back button is consumed by Android before the page sees it.
     * Forward it as Escape (keyCode 27), which CleanFrame already treats as Back.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) sendKey("keydown");
            else if (event.getAction() == KeyEvent.ACTION_UP) sendKey("keyup");
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void inputsChanged() {
        if (web != null) web.evaluateJavascript("window.CleanFrameInputsChanged&&window.CleanFrameInputsChanged()", null);
    }

    private void remoteChanged() {
        if (web != null) web.evaluateJavascript("window.CleanFrameRemoteChanged&&window.CleanFrameRemoteChanged()", null);
    }

    private void sendKey(String type) {
        if (web == null) return;
        web.evaluateJavascript("(function(){var e=new KeyboardEvent('" + type + "',{key:'Escape',code:'Escape',bubbles:true,cancelable:true});"
                + "try{Object.defineProperty(e,'keyCode',{get:function(){return 27;}});Object.defineProperty(e,'which',{get:function(){return 27;}});}catch(x){}"
                + "document.dispatchEvent(e);})();", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (web != null) web.requestFocus(); // Home pressed while CleanFrame is the Home app
        if (intent != null && intent.getBooleanExtra(EXTRA_SAVER, false)) {
            if (web != null && loaded) web.evaluateJavascript("window.CleanFrameSaver&&window.CleanFrameSaver()", null);
            else saverRequest = true;
        } else if (intent != null && (intent.hasCategory(Intent.CATEGORY_HOME) || intent.getBooleanExtra(EXTRA_HOME_KEY, false))) {
            // The Home button always lands on Home, not on the Settings or All apps page left open before an app.
            homeRequest = true;
            if (resumed) goHome();
        }
    }

    /** Fades the start screen out once the page shows Home. */
    void hideCurtain() {
        final android.widget.ImageView c = curtain;
        if (c == null) return;
        curtain = null;
        c.animate().alpha(0f).setDuration(220).withEndAction(() -> {
            if (c.getParent() instanceof android.view.ViewGroup) ((android.view.ViewGroup) c.getParent()).removeView(c);
            c.setImageDrawable(null);
        }).start();
    }

    private void goHome() {
        if (!homeRequest || web == null || !loaded) return;
        homeRequest = false;
        web.evaluateJavascript("window.CleanFrameHomePressed&&window.CleanFrameHomePressed()", null);
    }

    private void watchNextChanged() {
        if (web != null) web.evaluateJavascript("window.CleanFrameWatchNextChanged&&window.CleanFrameWatchNextChanged()", null);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == 7) watchNextChanged();
        if (code == 8 && web != null) web.evaluateJavascript("window.CleanFrameBeatAllowed&&window.CleanFrameBeatAllowed()", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        if (web != null) {
            web.onResume(); web.resumeTimers(); web.requestFocus(); inputsChanged(); remoteChanged(); watchNextChanged();
            // Some TVs hand back a black surface after an app closes until the next key press: ask for fresh frames.
            web.postInvalidateDelayed(120); web.postInvalidateDelayed(600);
        }
        goHome();
        if (online != null) online.refreshIfStale();
        if (phone != null) phone.resume();
        HomeAssistant.get(this).setActive(true);
        Updater.get(this).checkIfStale();
    }

    @Override
    protected void onPause() {
        resumed = false;
        RemoteKeys.learn(false); // never capture a button while another app is in front
        Beat.stop();
        HomeAssistant.get(this).setActive(false); // no polling and no camera stream behind another app
        if (web != null) web.onPause(); // stops wallpaper rotation work while an app is open
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (tvInputs != null) tvInputs.unregisterCallback(inputCallback);
        if (online != null) online.setListener(null);
        if (topShelf != null) topShelf.setListener(null);
        Updater.get(this).setListener(null);
        HomeAssistant.get(this).setListener(null);
        if (phone != null) { phone.setListener(null); phone.setCommands(null); phone.stop(); }
        if (RemoteKeys.listener == remoteListener) { RemoteKeys.listener = null; RemoteKeys.learn(false); }
        if (web != null) { web.removeJavascriptInterface("CleanFrameAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }
}
