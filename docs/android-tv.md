# Android TV and Google TV: how Shore works

Using Shore? See the [wiki](https://github.com/taynotfound/shore/wiki). This page is for people changing the code.

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

Reference TV: TCL 55C6KS, Google TV (Android TV 12). Other sets are listed on the wiki's [Tested TVs](https://github.com/taynotfound/shore/wiki/Tested-TVs).

## Build, install and Home

These are user steps and live on the wiki: [Build from source](https://github.com/taynotfound/shore/wiki/Build-from-source), [Installation](https://github.com/taynotfound/shore/wiki/Installation) and [Home button](https://github.com/taynotfound/shore/wiki/Home-button). In short, `gradle -p android assembleRelease` builds the APK, and `HomeButtonService` (an accessibility service the user turns on) catches the Home key. Disabling the Google TV launcher, an older approach, is no longer needed.

## Verified on hardware (TCL 55C6KS, Google TV / Android TV 12)

- The 4K panel renders apps at 1920x1080 with density 320, so the WebView viewport is 960x540 CSS px while
  `innerWidth` reports 1920. `fit()` scales from `documentElement.clientWidth/Height`.
- HDMI inputs: `TvInputManager` passthrough inputs with live `getInputState()` (0 on, 1 standby, 2 unplugged)
  and `TvInputCallback`. Opening one uses `TvContract.buildChannelUriForPassthroughInput()`; TCL's `com.tcl.tv` handles it.
- Home: `cmd role add-role-holder android.app.role.HOME` and `cmd package set-home-activity` are accepted but
  ignored (launcherx has system priority 2). `HomeButtonService` (accessibility, user-enabled) catches the Home key instead.
- Remote buttons: `HomeButtonService` also applies `RemoteKeys` assignments (SharedPreferences `remote_keys`, keyCode → action). The learn step captures the next non-navigation key and logs every key to logcat tag `CleanFrameKeys` (`adb logcat -s CleanFrameKeys`). Key layout files are unreadable and `dumpsys input` shows no key codes on this build, so learning is the only way to find a button's code.
- Language (de, fr, es, nl, pl, uk, it, tr): the WebView reports the system locale as `navigator.language`; `app/i18n.js` translates through `esc()`/`T()` in `main.js`. English is the source text, so new UI strings need a dictionary entry per language.
- Online wallpapers are downloaded and pre-rendered natively (`OnlineWallpapers.java`), then served at the same
  `assets/wallpapers` and `assets/materials` paths as bundled photos, so the runtime still never blurs.
- HDMI-CEC names: CEC devices are child `TvInputInfo`s (`getParentId()` = the HDMI port). `DeviceBridge.inputs()` hides the children and labels the port with the child's label unless the user renamed the input; `port` keeps the port name.
- Now playing: `NowPlayingService` is an empty `NotificationListenerService`; it only exists so `MediaSessionManager.getActiveSessions()` is allowed. The page polls `nowPlaying()` every 10 s while visible. Without notification access the call throws `SecurityException` and `access` is false.
- Phone companion: `Companion` is a tiny HTTP server (port 8642, falling back to 8643–8645) that runs only while *Settings › Phone › Phone companion* is on. The page (HTML/CSS/JS, manifest, service worker, icons) ships in `assets-android/companion/`; every `/api/` call needs the pairing key from the QR link (`#k=…`, kept in the phone's `localStorage`, sent as `X-Shore-Key`, compared in constant time). *Forget paired phones* rotates it. Uploads are type-checked by magic bytes (JPEG, PNG, WebP, GIF, MP4), capped at 60 MB and 30 files, and land in `files/phone/`. The `phone` source in `OnlineWallpapers` renders them like any online photo; GIFs keep a `.gif` that `main.js` plays in an `<img>` above the still bundle.
- Weather: `app/weather.js` calls Open-Meteo's geocoding and forecast APIs from the WebView (CORS allowed), only when *Weather* is on, caches the reading (in °C) in `localStorage` for 30 minutes and converts to °F on display.
- Pi-hole and AdGuard add-on (*Settings › Add-ons*, off by default): `AdBlock.java` keeps the address, user and password in its own SharedPreferences (`adblock.xml`, excluded from Android backups). The companion's `POST /api/adblock` tries the server as Pi-hole 6 (`/api/auth` session, `/api/stats/summary`, `/api/dns/blocking`), Pi-hole 5 (`/admin/api.php?summaryRaw&auth=`) and AdGuard Home (basic auth, `/control/stats`, `/control/status`, `/control/protection`) and keeps the first that accepts it. While on and in front it reads today's counts every minute; the page sees only counts and the blocking state (`adInfo()`, `CleanFrameAdChanged`), and `adPause(minutes)` pauses for at most an hour.
- Home Assistant add-on (*Settings › Add-ons*, off by default): `HomeAssistant.java` keeps the server address and long-lived token in its own SharedPreferences (excluded from Android backups by `res/xml/backup_rules.xml` and `data_extraction_rules.xml`). They are entered on the phone companion's Home Assistant card (`POST /api/ha` with a JSON body; the TV checks them against the server before saving and never sends the token back). While the add-on is on and Shore is in front, it reads areas via `/api/template` and states via `/api/states` every 30 s, trims them to the chosen rooms (adding light brightness/colour and thermostat target/mode attributes) and hands them to `app/addons/homeassistant.js` (`haInfo()`, `CleanFrameHAChanged`). `haCall()` sends only `light.turn_on` (brightness, hs colour, colour temperature), `climate.set_temperature` and `climate.set_hvac_mode`, with each field range-checked natively. Camera live views are WebRTC in the page; `HaSocket.java` relays the `camera/webrtc/*` signalling over Home Assistant's WebSocket because the https page may not open `ws://`. The doorbell keeps a second WebSocket open while the add-on is on, even behind other apps, with a `subscribe_trigger` on the chosen entity only; a ring goes to the page (`CleanFrameDoorbell`) when Shore is in front and to a Toast otherwise, at most once per 20 seconds, and the socket reconnects after 30 seconds when it drops. `res/xml/network_security_config.xml` allows cleartext http app-wide, since home servers usually answer on `http://…:8123` and Android can't scope cleartext to the LAN; everything Shore fetches itself still uses https. See `app/addons/AGENTS.md`.
- WebView persists `localStorage` asynchronously: when editing it over DevTools, wait a few seconds before
  force-stopping the app. `location.reload()` is blocked by `shouldOverrideUrlLoading`; restart the activity instead.

## Known gaps

- Hardware-protected HDMI video is black in `adb screencap`; that is expected.
- The default Home list still contains Tizen-only apps; unavailable ones report "isn't installed". Edit Home in Settings.
