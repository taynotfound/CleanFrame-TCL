# Shore add-ons

An add-on is an optional feature that stays out of sight until the owner switches it on in **Settings › Add-ons**. While it's off it adds no Home control, no caption line, no network traffic and no work at startup. Home Assistant (`homeassistant.js`) is the first add-on and the reference for new ones.

This file is for agents and for people. Read the repository's `AGENTS.md`, `docs/development.md` and `docs/interaction-behaviour.md` first. The rules there still apply: ES5 on the TV, remote focus, preference migrations, cached rendering, and no secrets in the repository.

## What an add-on is

| Piece | Where | Required |
| --- | --- | --- |
| An on/off axis, `off` by default | `main.js`: `LOOK_VALUES`, `MORE_LOOK`, `TOGGLES`, `LOOK_NAMES`, `lookOf()` | yes |
| An entry in `ADDONS` | `main.js`, section "Add-ons" | yes |
| Its runtime | `app/addons/<name>.js`, one global (`window.CleanFrame<Name>`), loaded before `main.js` in `index.html` | usually |
| Its settings page | `main.js`: `DETAIL_NAMES`, `PARENT[page] = 'addons'`, a `detailSections()` branch, `detailOk()` actions and OK hints | usually |
| What it adds to Home | a `UTIL` control, a caption line or a panel (`V`, `FRAMES`, `FILLS`) | optional |
| Native work | Android shell: a class beside `News.java`, `DeviceBridge` methods, a `device-android.js` wrapper | when it needs the network, secrets or Android APIs |
| Translations, checks and docs | `app/i18n/*.js`, `scripts/check-browser.mjs`, `docs/` | yes |

An `ADDONS` entry looks like this:

```js
{ id: 'ha', axis: 'aha', name: 'Home Assistant', line: 'Lights, switches and cameras', page: 'ha',
  available: function () { return !!(HA && HA.available()); },  // false hides the add-on on this TV
  summary: function () { return haStatus(); } }                    // its row on Settings › Add-ons
```

Settings › Add-ons appears in the overview only when at least one add-on is `available()`. The Tizen widget and the browser preview have no Home Assistant bridge, so there they show no Add-ons row at all.

## Rules

1. **Off by default, and invisible while off.** The axis default is `'off'` in `MORE_LOOK`. Gate everything the add-on shows on both the axis and `available()`. `clean()` migrates older preferences to off without extra code.
2. **Start after Home has painted.** `syncAddons()` runs from `render()` and does nothing until `addonsReady`, which `startupReady()` sets. Start and stop the add-on there, and nowhere else. `render()` calls it, so a switch from the phone companion works too. When it stops, pop its views.
3. **No secrets in preferences.** `S.c` is published to the phone companion, written into backups and exposed by `ShoreQA.state()`. Keep tokens, addresses and accounts native. Home Assistant keeps them in `HomeAssistant.java` SharedPreferences, entered through the companion, and the page never sees the token. Exclude such SharedPreferences from Android backups (`res/xml/backup_rules.xml`, `data_extraction_rules.xml`).
4. **Network on Android goes native.** The page is an https origin (`appassets.androidplatform.net`), so it can't reach `http://` or `ws://` servers, and LAN servers don't send CORS headers. Fetch in Java on a background thread, cache the result, and push changes with `evaluateJavascript("window.CleanFrame<Name>Changed&&…")`. Wrap every bridge call in `device-android.js` with try/catch and validation, and expose `null` when the bridge method is missing.
5. **Keep `render()` cheap.** Cache what the add-on shows. `homeassistant.js` caches its model and rebuilds it only when native data changes. Use `setHTML()`/`setContent()`/`keyed()`. Don't call into Android while rendering, except to read an already-cached value. Defer re-renders from data callbacks with `setTimeout(…, 0)`, never from inside `render()`.
6. **Remote focus.** Every view has exactly one rendered `.is-focus`. Back closes one layer at a time. Up/Down/Left/Right never trap focus. OK acts, focus alone never does. A sheet view is `V.<id> = { sheet: true, key, norm, point }` with `FRAMES.<id>` built once and `FILLS.<id>` updating its slots.
7. **TV performance.** Animate only transforms and opacity. No live blur, `backdrop-filter` or pixel sampling. Stop polling while another app is in front (`MainActivity.onPause`) and when `document.hidden`.
8. **Strings.** English inline, through `esc()`/`T()`. Names from external systems go through `escRaw()`. Add every new string to all six `app/i18n/<lang>.js` files, with a rule for strings that contain numbers. When an English word already means something else in the dictionaries ("Open", "Clear"), use a distinct key such as `'Open (door)'` and fall back to the plain word, as `TT()` in `homeassistant.js` does.
9. **Testable without the device.** Give the runtime a mock source and a `ShoreQA.<name>(fake)` hook, as `ShoreQA.homeAssistant(fake)` does. `scripts/check-browser.mjs` must not contact any server. An unexpected request fails the run.

## Checklist for a new add-on

1. Axis: add `a<name>: ['off', 'on']` to `LOOK_VALUES`, `'off'` to `MORE_LOOK`, the axis to `TOGGLES`, a label to `LOOK_NAMES` and the field to `lookOf()`.
2. Add an `ADDONS` entry. Extend `syncAddons()` to start and stop it.
3. Runtime: `app/addons/<name>.js` (ES5, `node --check` it in `package.json`'s `check` script), plus a `<script>` tag before `main.js`.
4. Settings page: add `DETAIL_NAMES[page]`, `PARENT[page] = 'addons'`, a `detailSections()` branch and the `detailOk()` actions, plus OK hints in `renderAppearance()`. The Add-ons page links to `open.<page>` while the add-on is on.
5. Home surface, if any: add it to `utils()` (before `music`) with `UTIL`/`SVG` entries and `utilAction()`. Add any caption text in `clockExtras()`. Panels go in `V`/`FRAMES`/`FILLS`. If it changes the Home skeleton, make sure `saveBackdrop()`'s key notices.
6. Phone: add the axis to `COMPANION_GROUPS`, and return `null` from `companionAxis()` when unavailable. Typed values (addresses, tokens) belong in a card on the companion's **Add-ons** tab (shown only while an add-on is on; `showHa()` in `assets-android/companion/app.js` shows the pattern) and a `Companion.java` route that reads the request body and never echoes secrets.
7. Native (Android): add the class, the `DeviceBridge` methods (guarded by `activity != null`), wiring in `MainActivity` (listener, `onResume`/`onPause`, `onDestroy`) and the `device-android.js` wrapper.
8. Add translations for every new string in all six languages, TV and companion.
9. Checks in `scripts/check-browser.mjs` covering: hidden when unavailable, off after migration, on/off persists, the Home surface appears and disappears, single focus, Back order, and no secrets in state or backups.
10. Docs: `docs/interaction-behaviour.md`, `docs/development.md`, `docs/testing.md` and `docs/android-tv.md` when native. Add `Release:` lines to the commit message.

Run `npm run check`, `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser` and `npm run check:public`. Repository work never authorises device access. Installing on a TV or testing against a real server is a separate, explicit task (see the repository `AGENTS.md`).

## Home Assistant, the reference add-on

| Part | File |
| --- | --- |
| REST polling (areas through `/api/template`, `/api/states`), toggles, light/thermostat service calls (`call()`, an allowlist of services and fields), settings, WebRTC signalling relay | `android/app/src/main/java/app/cleanframe/tv/HomeAssistant.java` |
| Minimal WebSocket client for the signalling | `android/.../HaSocket.java` |
| Bridge methods `ha*`, events `CleanFrameHAChanged` / `CleanFrameHACamera` | `DeviceBridge.java`, `MainActivity.java`, `app/device-android.js` |
| Address and token entry (`POST /api/ha`, `/api/ha/clear`) | `Companion.java`, `assets-android/companion/` |
| Rooms, chip states, indoor reading, camera player, test mock | `app/addons/homeassistant.js` |
| Settings › Add-ons, the Smart home control, panel, light/thermostat controls (`V.hactl`, long OK), live view, caption | `app/main.js` (sections "Add-ons" and "Home Assistant add-on"), `app/style.css` |
| Cleartext http for LAN servers; token excluded from backups | `res/xml/network_security_config.xml`, `backup_rules.xml`, `data_extraction_rules.xml` |
| Browser checks | `scripts/check-browser.mjs`, "Home Assistant add-on…" |

The room model and the camera handshake are ported from the TvLauncher prototype (`HomeSection.kt`, `HomeAssistant.kt`, `camera.html`). Entities hidden in Home Assistant stay hidden in Shore. Cameras open a live session only on request: once when a card is focused and its still is over a minute old, and while the live view is open, because doorbells such as Ring light up for every session.
