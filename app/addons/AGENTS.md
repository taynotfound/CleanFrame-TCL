# Shore add-ons

An add-on is an optional feature that stays out of sight until the owner switches it on in **Settings › Add-ons**. While it's off it adds no Home control, no caption line, no network traffic and no work at startup, and its code is **not even fetched**: a TV that never uses an add-on never parses it. Home Assistant (`homeassistant.js` + `homeassistant-ui.js`) is the reference add-on; Pi-hole and AdGuard is the small example. Every add-on states what it costs a slow TV, measured in [docs/performance.md](../../docs/performance.md).

This file is for agents and for people. Read the repository's `AGENTS.md`, `docs/development.md`, `docs/interaction-behaviour.md` and `docs/performance.md` first. The rules there still apply: ES5 on the TV, remote focus, preference migrations, cached rendering, and no secrets in the repository.

## How an add-on loads

`ADDONS` in `main.js` (section "Add-ons") is the catalogue. It is plain data, so Settings › Add-ons can list every add-on without loading any of them:

```js
{ id: 'ha', axis: 'aha', name: 'Home Assistant', line: 'Lights, switches and cameras', page: 'ha', cost: 'some',
  bridge: 'homeAssistant',                          // FrameDevice.<bridge>: this TV could run it (no bridge: every TV can)
  scripts: ['addons/homeassistant.js'],             // plain scripts with one global (optional)
  js: ['addons/homeassistant-ui.js'],               // Shore's side, run inside main.js's scope
  css: 'addons/homeassistant.css',                  // its styles (optional)
  bind: function () { HA = window.CleanFrameHA || null; },
  runtime: function () { return HA; },              // once loaded, runtime().available() decides
  summary: function () { return haStatus(); },      // its row under Settings on the Add-ons page
  sync: function (want) { /* start or stop, pop its views */ } }
```

When the axis is switched on (from the remote, the phone or a restored backup), `syncAddons()` calls `loadAddon()`: the styles and runtime scripts load as ordinary `<link>`/`<script>` tags, the `js` files are fetched as text and run by `runAddon()` inside `main.js`'s closure. That lets Shore's side of an add-on use every helper (`S`, `T`, `esc`, `render`, `push`, `V`, `FRAMES`, `FILLS` …) and **replace the stubs** that `main.js` keeps for it:

```js
// main.js, "Stubs": what the rest of Shore sees while the add-on isn't loaded
function haInside() { return ''; }
// addons/homeassistant-ui.js: the real one
haInside = function () { var m = haShown() ? HA.model() : null; … };
```

Functions the rest of Shore never calls stay ordinary `function` declarations in the add-on file and are private to it. Only files listed in `ADDONS` are ever run this way, never a URL; `scripts/check.py` checks that each one exists, passes `node --check`, is listed, and is not loaded by `index.html`.

An entry with `catalog: false` and no axis is a built-in part of Shore that is fetched the first time it is used, not on a switch: the Music view (`player.js`) loads when it first opens. Once loaded, an add-on stays loaded until Shore restarts; switching it off stops its work and removes everything it shows.

## Rules

1. **Off by default, and invisible while off.** The axis default is `'off'` in `MORE_LOOK`. Gate everything the add-on shows on both the axis and `available()`. `clean()` migrates older preferences to off without extra code.
2. **Load and start after Home has painted.** `syncAddons()` runs from `render()` and does nothing until `addonsReady`, which `startupReady()` sets. It loads the add-on, then calls its `sync(want)`; start and stop it there, and nowhere else. `render()` calls it, so a switch from the phone companion works too. When it stops, pop its views.
3. **No secrets in preferences.** `S.c` is published to the phone companion, written into backups and exposed by `ShoreQA.state()`. Keep tokens, addresses and accounts native. Home Assistant keeps them in `HomeAssistant.java` SharedPreferences, entered through the companion, and the page never sees the token. Exclude such SharedPreferences from Android backups (`res/xml/backup_rules.xml`, `data_extraction_rules.xml`).
4. **Network on Android goes native.** The page is an https origin (`appassets.androidplatform.net`), so it can't reach `http://` or `ws://` servers, and LAN servers don't send CORS headers. Fetch in Java on a background thread, cache the result, and push changes with `evaluateJavascript("window.CleanFrame<Name>Changed&&…")`. Wrap every bridge call in `device-android.js` with try/catch and validation, and expose `null` when the bridge method is missing.
5. **Keep `render()` cheap.** Cache what the add-on shows. `homeassistant.js` caches its model and rebuilds it only when native data changes. Use `setHTML()`/`setContent()`/`keyed()`. Don't call into Android while rendering, except to read an already-cached value. Defer re-renders from data callbacks with `setTimeout(…, 0)`, never from inside `render()`.
6. **Remote focus.** Every view has exactly one rendered `.is-focus`. Back closes one layer at a time. Up/Down/Left/Right never trap focus. OK acts, focus alone never does. A sheet view is `V.<id> = { sheet: true, key, norm, point }` with `FRAMES.<id>` built once and `FILLS.<id>` updating its slots.
7. **TV performance.** Animate only transforms and opacity. No live blur, `backdrop-filter` or pixel sampling. Stop polling while another app is in front (`MainActivity.onPause`) and when `document.hidden`.
8. **Strings.** English inline, through `esc()`/`T()`. Names from external systems go through `escRaw()`. Add every new string to all six `app/i18n/<lang>.js` files, with a rule for strings that contain numbers. When an English word already means something else in the dictionaries ("Open", "Clear"), use a distinct key such as `'Open (door)'` and fall back to the plain word, as `TT()` in `homeassistant.js` does.
9. **Testable without the device.** Give the runtime a mock source and a `ShoreQA.<name>(fake)` hook, as `ShoreQA.homeAssistant(fake)` does. Wrap it in `qaAddon(id, fake, run)`: it loads the add-on first and returns a promise while it does. Checks that look for the add-on's output right after switching it on must wait for it to arrive.
10. **Say what it costs.** Run `node scripts/bench.mjs --only base,<id>` with and without it, add the numbers to `docs/performance.md`, and set `cost` to `light`, `some` or `heavy` from them. Anything that runs every frame (a CSS animation, a timer under a second) is at least `some`; a full-screen animated layer is `heavy`. Respect Performance › Potato (`potato()` in `main.js`): drop animations and per-frame work there. `scripts/check-browser.mjs` must not contact any server. An unexpected request fails the run.

## Checklist for a new add-on

1. Axis: add `a<name>: ['off', 'on']` to `LOOK_VALUES`, `'off'` to `MORE_LOOK`, the axis to `TOGGLES`, a label to `LOOK_NAMES` and the field to `lookOf()`.
2. Add an `ADDONS` entry with its files, `bridge`, `cost` and `sync()`.
3. Runtime and Shore's side in `app/addons/` (ES5; `npm run check` syntax-checks every file there). Never a `<script>` tag in `index.html`. Keep a stub in `main.js` for every function the rest of Shore calls, and assign the real one in the add-on file.
4. Settings page: add `DETAIL_NAMES[page]`, `PARENT[page] = 'addons'`, a `detailSections()` branch and the `detailOk()` actions, plus OK hints in `renderAppearance()`. The Add-ons page links to `open.<page>` while the add-on is on.
5. Home surface, if any: add it to `utils()` (before `music`) with `UTIL`/`SVG` entries and `utilAction()`. Add any caption text in `clockExtras()`. Panels go in `V`/`FRAMES`/`FILLS`. If it changes the Home skeleton, make sure `saveBackdrop()`'s key notices.
6. Phone: add the axis to `COMPANION_GROUPS`, and return `null` from `companionAxis()` when unavailable. Typed values (addresses, tokens) belong in a card on the companion's **Add-ons** tab (shown only while an add-on is on; `showHa()` in `assets-android/companion/app.js` shows the pattern) and a `Companion.java` route that reads the request body and never echoes secrets.
7. Native (Android): add the class, the `DeviceBridge` methods (guarded by `activity != null`), wiring in `MainActivity` (listener, `onResume`/`onPause`, `onDestroy`) and the `device-android.js` wrapper.
8. Add translations for every new string in all six languages, TV and companion.
9. Checks in `scripts/check-browser.mjs` covering: hidden when unavailable, off after migration, on/off persists, the Home surface appears and disappears, single focus, Back order, and no secrets in state or backups.
10. Docs: `docs/interaction-behaviour.md`, `docs/development.md`, `docs/testing.md` and `docs/android-tv.md` when native. Add `Release:` lines to the commit message.

Run `npm run check`, `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser`, `npm run bench` for its cost and `npm run check:public`. Repository work never authorises device access. Installing on a TV or testing against a real server is a separate, explicit task (see the repository `AGENTS.md`).

## Home Assistant, the reference add-on

| Part | File |
| --- | --- |
| REST polling (areas through `/api/template`, `/api/states`), toggles, light/thermostat service calls (`call()`, an allowlist of services and fields), settings, WebRTC signalling relay | `android/app/src/main/java/app/cleanframe/tv/HomeAssistant.java` |
| Minimal WebSocket client for the signalling | `android/.../HaSocket.java` |
| Bridge methods `ha*`, events `CleanFrameHAChanged` / `CleanFrameHACamera` | `DeviceBridge.java`, `MainActivity.java`, `app/device-android.js` |
| Address and token entry (`POST /api/ha`, `/api/ha/clear`) | `Companion.java`, `assets-android/companion/` |
| Rooms, chip states, indoor reading, camera player, test mock | `app/addons/homeassistant.js` |
| The Smart home control, panel, light/thermostat controls (`V.hactl`, long OK), live view, caption, its Settings pages | `app/addons/homeassistant-ui.js`, `app/addons/homeassistant.css` |
| Settings › Add-ons, the catalogue entry, the stubs | `app/main.js` (section "Add-ons") |
| Cleartext http for LAN servers; token excluded from backups | `res/xml/network_security_config.xml`, `backup_rules.xml`, `data_extraction_rules.xml` |
| Browser checks | `scripts/check-browser.mjs`, "Home Assistant add-on…" |

Pi-hole and AdGuard (`adblock.js`, `adblock-ui.js`, `AdBlock.java`) is the small example: one caption line, a settings page with a pause, a companion card and `ShoreQA.adBlock(fake)`.

## The other add-ons

| Add-on | Files | Axis | Native |
| --- | --- | --- | --- |
| Weather effects | `weatherfx.js`, `weatherfx.css` | `wfx` (also on Settings › Weather) | none |
| Headlines | `news.js` | `cnews` (also Settings › News) | `News.java` |
| Widgets | `widgets.js`, `widgets.css` | `cwidget` (also Settings › Clock) | none |
| Music view (on demand, not in the catalogue) | `player.js`, `player.css` | none: loads when the view first opens | `NowPlayingService.java`, `Lyrics.java`, `Beat.java` |

The room model and the camera handshake are ported from the TvLauncher prototype (`HomeSection.kt`, `HomeAssistant.kt`, `camera.html`). Entities hidden in Home Assistant stay hidden in Shore. Cameras open a live session only on request: once when a card is focused and its still is over a minute old, and while the live view is open, because doorbells such as Ring light up for every session.
