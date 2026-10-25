# Validation

## Offline app changes

```sh
npm ci
npm run check
npx playwright install chromium
CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser
npm run check:public
```

`check` validates JavaScript syntax and bundled resources. It does not contact a TV. `check:browser` uses a fresh Playwright Chromium profile and its own loopback preview. It checks Dock and List navigation, single focus, Home controls, grouped Settings, explicit OK application, applied checkmarks, pending-load cancellation, retries, persistence, all fifteen wallpaper bundles, available fonts, 720p scaling, migrations, the Home editor, honest browser-only launch errors and the Home Assistant add-on with made-up data (hidden until switched on, panel focus and Back order, light and thermostat controls, no token in saved state). Reports and screenshots are in ignored `.local/qa/`. A failed assertion exits with a nonzero status.

`CLEANFRAME_PUBLIC_FONTS=1` makes the preview exclude any local proprietary font overlay, so the result is reproducible on a clean clone. `check:public` runs the bounded source and history checks. The GitHub Actions workflow runs this public path.

If the default browser/cache location is unavailable, use a writable local path for both commands:

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/playwright" npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/playwright" npm run check:browser
```

For manual review, use `npm run dev` and open `/home/`. Use the arrow keys, Enter and Escape. Check the changed flow in Dock, List and Shelf, on Photo, Light and Dark backgrounds. Check a single app and all nine apps when changing app layout. In Settings, browse without applying, apply with OK, return with both Back routes, and cancel a pending resource load. Browser preferences are separate from TV preferences.

## On a TV

Browser checks establish source behaviour, not TV behaviour. Check on a real TV when you change remote handling, performance or anything native, and say in the pull request which TV and Android version you used.

1. Move in every direction through each layout and Settings; check focus, response and readable labels from the sofa.
2. Open a few apps, press Home to return, and check the selected app.
3. Check HDMI inputs, Google TV Home, TV settings and the screensaver; verify the actual visible destinations.
4. Check saved appearance, app order and wallpaper after relaunch.
5. Check the Home button service after a restart (on TCL sets this needs the auto start permission).

Devices that have been checked are listed on the wiki's [Verified devices](https://github.com/taynotfound/shore/wiki/Verified-devices) page; a [TV report](https://github.com/taynotfound/shore/issues/new?template=3-tv-report.yml) adds yours.

## Performance

`npm run bench` measures startup, idle and per-key cost with every feature and add-on, on a 6× CPU slowdown at 720p ("potato") or `--profile tv` (4×, 1080p). `--only base,drift` picks features, `--root <checkout>` measures another checkout for a before/after comparison and `--runs 3` takes the median of more runs. Reports go to ignored `.local/qa/bench/`. Method, budgets and the current results are in [performance](performance.md). Browser CPU throttling is a development comparison, not a TV measurement. If the pinned Playwright browser is missing, `CLEANFRAME_CHROMIUM=/path/to/chrome` points the browser tools at an installed Chromium.
