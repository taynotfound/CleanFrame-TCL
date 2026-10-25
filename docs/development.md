# Development

Shore's Android shell is described in [android-tv.md](android-tv.md). This page covers the interface in `app/`, which you can develop and check in a desktop browser.

## Browser preview

Start with Node.js 22+ and Python 3.10+, then `npm ci`. These are the supported development baselines; lower versions have not been checked. Install Chromium once with `npx playwright install chromium` for the optional browser tools. Linux hosts may also need Playwright's documented system dependencies (`npx playwright install --with-deps chromium`).

`npm run dev` starts http://localhost:4795/home/, bound to this computer only. `/home/` serves `app/`, the same source the Android app shows in its WebView. Arrow keys, Enter and Escape mirror the remote. Device controls report that they require the TV; no success is simulated.

`npm run dev:public` serves the same interface using only the bundled open-licence fonts, even when optional paid fonts exist locally. Use it for anything you share.

All UI assets, fonts and the fifteen wallpapers are bundled. Glass materials and blurred panel backgrounds are rendered ahead of time; see `app/assets/wallpapers/README.md`.

## Runtime map and compatibility

- `app/index.html` loads the device adapters, gallery/font/palette catalogues, `assets/icons/metrics.js` and `main.js`, with `style.css`.
- `main.js` owns the Dock, List and Shelf layouts, panel stack, focus, preferences and wallpaper timers. `device.js` is the browser-preview adapter and `device-android.js` replaces it inside the Android shell, which owns installed-app discovery and every other TV call. Keep device details in the adapters.
- The logical stage is 1920 x 1080, scaled uniformly to the viewport. Check at 1920 x 1080 and 1280 x 720. Glass geometry and cached materials must stay aligned.
- Preferences use localStorage key `cleanframe.home.v1`, with a fallback read from `cleanframe.shore.v1`. Legacy fields are `dock`, `wallpaper`, `mode`, `lastApp` and `theme`; the migration preserves app order, wallpaper, rotation and selection, and saved app IDs from older versions are mapped to Android packages. Appearance axes are stored separately. Keep migration checks when changing this format.
- Add-ons (`app/addons/`, guide in `app/addons/AGENTS.md`) are optional features behind Settings › Add-ons: one on/off axis each, off by default. Their code and styles are not fetched until they are switched on, and then only after Home has painted; `index.html` never loads them. Home Assistant, Pi-hole and AdGuard, Weather effects, Headlines and Widgets are add-ons; the Music view is fetched the first time it opens. Home Assistant builds rooms, cameras and the indoor reading from data that `HomeAssistant.java` reads natively; without the Android bridge it is left off the Add-ons page. `ShoreQA.homeAssistant(fake)` loads it and swaps in made-up areas and states for browser checks.
- Settings › Performance (Auto, High end, Balanced, Potato) is described in [performance](performance.md), with what every feature and add-on costs and how to measure it (`npm run bench`).
- `window.ShoreQA.state()` and `.where()` expose state and focus for browser tests. `minuteMs` can shorten rotation intervals in an isolated browser test.

Keep runtime JavaScript ES5-compatible and verify any new DOM/CSS API on a real TV before claiming support. `node --check` checks syntax for Node; it does not enforce ES5 or TV API availability.

Keep material rendering in the development tools. See [asset generation](assets.md) and [testing](testing.md).

## Release notes

Releases are started by hand (`gh workflow run android.yml`); each publishes a keyless APK whose notes come from `scripts/release-notes.mjs` and cover every commit since the previous release. Write them for people installing Shore: add `Release-title:`, `Release:` (one line per user-visible change) and optionally `Release-image:` lines to the commit message. To fix the wording of a commit that is already pushed, add it to `scripts/release-copy.json` under its short hash instead of rewriting history. Commits without app changes only appear in the folded changelog.

## Website and wiki

`site/` is published to GitHub Pages by `.github/workflows/pages.yml`. `docs/wiki/` is copied to the GitHub wiki by `.github/workflows/wiki.yml`. `node scripts/companion-shots.mjs` renders new phone screenshots into `site/shots/`.
