# Android TV / Google TV (TCL and others)

The Android app is called **Shore**. Its package ID stays `app.cleanframe.tv` so existing installs update in place.

CleanFrame was built for Tizen, but the UI is plain HTML/CSS/ES5 and every TV call lives in
`window.FrameDevice`. The Android port keeps `app/` unchanged and adds:

- `app/device-android.js`: replaces `FrameDevice` only when the Android shell is present.
  On Tizen and in the browser preview it does nothing.
- `android/`: a small Java app that shows `app/` full screen in a WebView and exposes
  `window.CleanFrameAndroid` (launch apps, list installed apps, TV settings, original Home,
  screensaver). App icons are served at `/appicon/<package>.png`.

| CleanFrame | Tizen | Android TV |
| --- | --- | --- |
| App launch | `tizen.application.launch` | Leanback launch intent per package |
| Installed apps | `getAppsInfo` | `LEANBACK_LAUNCHER` / `LAUNCHER` query |
| Art Mode | Samsung Art app | System screensaver (Ambient mode) |
| Samsung Home | `com.samsung.tv.csfs` | The TV's original launcher |
| TV settings | Samsung settings app | `Settings.ACTION_SETTINGS` |
| Back | key 10009 | Back button forwarded as Escape (27) |

Reference target: TCL 55" Mini LED, Google TV, software `V8-0008T01-LF1V548.002110`.
Not yet verified on hardware.

## Build

GitHub: push to your fork, open **Actions → Android TV APK**, download the artifact.

Locally (JDK 17 + Android SDK, or open `android/` in Android Studio):

```sh
gradle -p android assembleRelease
```

Without signing secrets the APK is signed with that machine's debug key. A runner's debug key
changes between runs, so an update from a different key needs an uninstall first, which clears
saved preferences. Add the four `KEYSTORE_*` / `KEY_*` secrets for in-place updates.

## Install on the TV

1. Settings → System → About → click **Android TV OS build** 7× to enable developer options.
2. Settings → System → Developer options → enable **USB debugging** / **Network debugging**.
3. `adb connect <TV-IP>:5555`, accept the prompt on the TV, then `adb install -r CleanFrame-*.apk`.

CleanFrame then appears in the Apps row and can be opened like any app.

## Making it the Home button (optional, riskier)

Google TV has no "default Home app" setting. The Home button opens the Google TV launcher
unless that launcher is disabled. CleanFrame declares a `HOME` intent filter, so once the stock
launcher is disabled Android hands Home to CleanFrame.

```sh
# Before: note what is enabled, so you can restore it
adb shell pm list packages -d > disabled-before.txt
adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.HOME

# Disable the Google TV launcher for the main user (reversible, not an uninstall)
adb shell pm disable-user --user 0 com.google.android.apps.tv.launcherx

# Restore
adb shell pm enable com.google.android.apps.tv.launcherx
```

Expect side effects: the Google TV recommendations, profile switcher and some TCL shortcuts
live in that launcher. Firmware updates can re-enable it. Keep adb access working before you
try this; a factory reset also restores it. A gentler alternative is a key-remapping app
(e.g. Button Mapper) that opens CleanFrame on Home.

## Verified on hardware (TCL 55C6KS, Google TV / Android TV 12)

- The 4K panel renders apps at 1920x1080 with density 320, so the WebView viewport is 960x540 CSS px while
  `innerWidth` reports 1920. `fit()` scales from `documentElement.clientWidth/Height`.
- HDMI inputs: `TvInputManager` passthrough inputs with live `getInputState()` (0 on, 1 standby, 2 unplugged)
  and `TvInputCallback`. Opening one uses `TvContract.buildChannelUriForPassthroughInput()`; TCL's `com.tcl.tv` handles it.
- Home: `cmd role add-role-holder android.app.role.HOME` and `cmd package set-home-activity` are accepted but
  ignored (launcherx has system priority 2). `HomeButtonService` (accessibility, user-enabled) catches the Home key instead.
- Remote buttons: `HomeButtonService` also applies `RemoteKeys` assignments (SharedPreferences `remote_keys`, keyCode → action). The learn step captures the next non-navigation key and logs every key to logcat tag `CleanFrameKeys` (`adb logcat -s CleanFrameKeys`). Key layout files are unreadable and `dumpsys input` shows no key codes on this build, so learning is the only way to find a button's code.
- Language (de, fr, es, nl, pl, uk): the WebView reports the system locale as `navigator.language`; `app/i18n.js` translates through `esc()`/`T()` in `main.js`. English is the source text, so new UI strings need a dictionary entry per language.
- Online wallpapers are downloaded and pre-rendered natively (`OnlineWallpapers.java`), then served at the same
  `assets/wallpapers` and `assets/materials` paths as bundled photos, so the runtime still never blurs.
- HDMI-CEC names: CEC devices are child `TvInputInfo`s (`getParentId()` = the HDMI port). `DeviceBridge.inputs()` hides the children and labels the port with the child's label unless the user renamed the input; `port` keeps the port name.
- Now playing: `NowPlayingService` is an empty `NotificationListenerService`; it only exists so `MediaSessionManager.getActiveSessions()` is allowed. The page polls `nowPlaying()` every 10 s while visible. Without notification access the call throws `SecurityException` and `access` is false.
- Phone companion: `Companion` is a tiny HTTP server (port 8642, falling back to 8643–8645) that runs only while *Settings › Phone › Phone companion* is on. The page (HTML/CSS/JS, manifest, service worker, icons) ships in `assets-android/companion/`; every `/api/` call needs the pairing key from the QR link (`#k=…`, kept in the phone's `localStorage`, sent as `X-Shore-Key`, compared in constant time). *Forget paired phones* rotates it. Uploads are type-checked by magic bytes (JPEG, PNG, WebP, GIF, MP4), capped at 60 MB and 30 files, and land in `files/phone/`. The `phone` source in `OnlineWallpapers` renders them like any online photo; GIFs keep a `.gif` that `main.js` plays in an `<img>` above the still bundle.
- Weather: `app/weather.js` calls Open-Meteo's geocoding and forecast APIs from the WebView (CORS allowed), only when *Weather* is on, caches the reading (in °C) in `localStorage` for 30 minutes and converts to °F on display.
- Home Assistant add-on (*Settings › Add-ons*, off by default): `HomeAssistant.java` keeps the server address and long-lived token in its own SharedPreferences (excluded from Android backups by `res/xml/backup_rules.xml` and `data_extraction_rules.xml`). They are entered on the phone companion's Home Assistant card (`POST /api/ha` with a JSON body; the TV checks them against the server before saving and never sends the token back). While the add-on is on and Shore is in front, it reads areas via `/api/template` and states via `/api/states` every 30 s, trims them to the chosen rooms (adding light brightness/colour and thermostat target/mode attributes) and hands them to `app/addons/homeassistant.js` (`haInfo()`, `CleanFrameHAChanged`). `haCall()` sends only `light.turn_on` (brightness, hs colour, colour temperature), `climate.set_temperature` and `climate.set_hvac_mode`, with each field range-checked natively. Camera live views are WebRTC in the page; `HaSocket.java` relays the `camera/webrtc/*` signalling over Home Assistant's WebSocket because the https page may not open `ws://`. `res/xml/network_security_config.xml` allows cleartext http app-wide, since home servers usually answer on `http://…:8123` and Android can't scope cleartext to the LAN; everything Shore fetches itself still uses https. See `app/addons/AGENTS.md`.
- WebView persists `localStorage` asynchronously: when editing it over DevTools, wait a few seconds before
  force-stopping the app. `location.reload()` is blocked by `shouldOverrideUrlLoading`; restart the activity instead.

## Known gaps

- Hardware-protected HDMI video is black in `adb screencap`; that is expected.
- The default Home list still contains Tizen-only apps; unavailable ones report "isn't installed". Edit Home in Settings.
