# Performance

What Shore costs a slow TV, what each feature and add-on adds, and how to measure it. Numbers come from `npm run bench` (`scripts/bench.mjs`): local Chromium on the "potato" profile, a **6× CPU slowdown at 1280 × 720**, with the public fonts and a mocked app list. That makes a repeatable comparison between versions and features. It is **not** a measurement of a Samsung or Android TV. The TV's GPU, image decoder, memory and browser engine are different; confirm on the device before claiming a TV result (see [TV status](tv-status.md)).

## What is measured

| Metric | Meaning |
| --- | --- |
| Main thread per key | All main-thread work (script, style, layout, paint) for one Left/Right (Dock) or Up/Down (List) press, including the frames of its slide. Idle work in the same time is subtracted. |
| Key p95 | 95th percentile from keydown to the next painted frame. What the remote feels like. |
| Idle per 10 s | Main-thread work while Home just sits there: clock, timers, animations. What a TV pays all evening. |
| Running animations | CSS animations running on Home. Each one is compositor work on every frame, on top of the idle number. |
| Startup | JS/CSS bytes parsed at start, main-thread work and time until Home is ready. |

Each feature is measured on its own, on top of the default look (Photo, Dock, Glass, Soft; Performance Full).

## Before and after (0.6.1 → this change)

The baseline is the original commit (`c44b863`): 2 runs per feature, median. The new code is 1 run per feature, so differences of a few milliseconds are noise.

| Look | Main thread per key (ms) | Key p95 (ms) | Idle per 10 s (ms) |
| --- | --- | --- | --- |
| Default look (Photo, Dock, Glass, Soft) | 141.2 → **70.9** | 66.4 → **41.3** | 6 → 8.5 |
| Default look with **Performance › Potato** | 132.1 → **28.2** | 63.8 → **35.4** | 21.4 → 7.3 |
| Dark background | 129.3 → 64.0 | 59.5 → 40.2 | 5 → 6.4 |
| List layout | 89.9 → 78.2 | 64.9 → 50.3 | 19.1 → 9.4 |
| Shelf layout | 188.8 → 161.5 | 67.2 → 41.9 | 6.9 → 33.1 |
| Type focus | 142.7 → 68.1 | 67.3 → 40.7 | 8.8 → 10.3 |
| Icons-only apps | 73.3 → 68.0 | 49.3 → 40.7 | 27.4 → 6.4 |
| Drift | 159.3 → 102.9 | 83.5 → 54.5 | 60.6 → 83.1 |
| Night mode | 118.7 → 60.4 | 64.0 → 39.1 | 20.1 → 10.0 |
| Clock with seconds | 128.8 → 78.2 | 54.8 → 57.3 | 138.6 → 173.6 |

(Before, the "Potato" row is the same look, because that version had no Performance setting.)

| Startup, default look | Before | After |
| --- | --- | --- |
| JavaScript fetched and parsed | 433 KB | **362 KB** |
| CSS | 104 KB | **82 KB** |
| Main-thread work until Home is ready | 1709 ms | 1420 ms |
| of which script / style | 368 / 265 ms | 257 / 184 ms |
| Ready | 1797 ms | 1537 ms |

### Where the time went

The profile showed one Dock key costing about 105 ms at 6×, and most of it was forced layout rather than Shore's own logic:

- **Dock edges.** For 220 ms after every key, `trackDockEdges()` called `getBoundingClientRect()` on every tile on every animation frame. This forced a full style and layout each frame. Tiles sit on a fixed pitch, so the check is now arithmetic: each tile's icon box is measured once per tile content, a tile hides when the slide ends, and it shows as the slide starts.
- **Focus status.** `renderFocusStatus()` queried and measured the focused element (`getClientRects`, `getComputedStyle`) on every render, though it only shows text after a failed save. It now returns before touching the DOM when there is nothing to say.
- **Home controls.** The lens and the focus label measured their button on every render. The boxes are now cached by the controls' markup and classes, and cleared when the stage is resized.
- Smaller fixes: the stage class is written only when it changes, and drift re-phases only when an image was replaced.

Potato then removes the slide itself: one paint per key instead of about 11 animated frames.

## Performance tiers and Auto

`perf` is `auto` (default), `full` (shown as **High end**), `balanced` or `potato`. None of them changes the look or any setting; they change what moves.

| Tier | Keeps | Removes |
| --- | --- | --- |
| High end | Everything that is switched on | Nothing |
| Balanced | Focus slides and crossfades, edge fades | Everything that animates while Home just sits there: drift, weather effects, video and GIF wallpapers, the screensaver's pan and zoom, the beat pulse |
| Potato | A static, instant interface | Also every transition and CSS animation (`.perf-potato *`), the Dock and List edge fades (`mask-image`) and `will-change` layer hints. A focus move is one paint instead of about 11 animated frames |

### How Auto decides

1. **Ceiling from the hardware.** `navigator.deviceMemory <= 1` (GB) caps Auto at Potato; `<= 2`, or `navigator.hardwareConcurrency <= 2`, caps it at Balanced. A TV that reports neither has no cap. Memory is a cap rather than a vote: decoded photos and glass materials take about 8 MB each whatever the CPU speed.
2. **Measurement on this TV.** Each remote key press (at most one every 300 ms) records the slowest frame between the key and 250 ms later, which covers the slide. The median of every 12 presses picks the tier: under 34 ms (two frames at 60 Hz) High end, under 60 ms Balanced, otherwise Potato. It never goes above the ceiling.
3. **Hysteresis.** Going down happens at once. Going up is one tier at a time and needs a median below 75 % of that tier's limit, so a TV near a boundary doesn't flip back and forth.
4. **Kept.** The decision and its median are saved in `shore.tier.1` (keyed by the browser's user agent, so a WebView update measures again), so the next start begins on the right tier. A first start uses the ceiling.

Settings › Performance says what Auto chose and why ("Auto chose Balanced: this TV shows a key press in 45 ms."), and the overview row reads "Auto, Balanced".

What Auto picked in the benchmark, after 24 Dock key presses:

| Profile | Median worst frame | Auto picked |
| --- | --- | --- |
| tv (4× CPU, 1080p) | 19 ms | High end |
| potato (6× CPU, 720p) | 18 ms | High end |
| brick (20× CPU, 720p) | 63 ms | Potato |

CPU throttling slows the main thread but not the compositor or GPU, and after this change's layout fixes a 6× machine still draws each frame in time. That is why the frame measurement, not the CPU estimate, makes the decision. A real TV with a weak GPU will show it in its frame times.

## What each feature and add-on costs

Measured on top of the default look (Full) with the new code, 1 run each. Negative numbers are within noise. Bytes are what the add-on fetches when it is switched on; nothing is fetched while it is off.

| Feature | Key (ms) | Idle per 10 s (ms) | Animations | Extra DOM nodes | Download when on | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Performance › Potato | **−42.7** | −1.2 | 0 | 0 | — | The setting to pick on a slow TV |
| Dark or Light background | −6.9 | −2.1 | 0 | 0 | — | Also no 1920 px photo and materials to decode (about 24 MB of decoded images fewer) |
| List layout | +7.3 | +0.9 | 0 | −9 | — | |
| Shelf layout | **+90.6** | +24.6 | 0 | −36 | — | The heaviest layout: banner cards repaint as the row moves |
| Type focus instead of Glass | −2.8 | +1.8 | 0 | 0 | — | |
| Icons-only apps | −2.9 | −2.1 | 0 | −18 | — | |
| Drift | +32.0 | **+74.6** | 4 | 0 | — | Four full-screen layers animate all the time; off on Potato |
| Night mode | −10.5 | +1.5 | 0 | 0 | — | A brightness filter on the photo layers; a GPU cost this benchmark doesn't see |
| Clock with seconds | +7.3 | **+165.1** | 0 | 0 | — | Re-renders the caption every second: the largest idle cost of any setting |
| Weather effects add-on (rain) | +16.5 | **+88.8** | 1 | 1 | 7.8 KB | Heavy: a full-screen animated layer. Off on Potato |
| Weather effects add-on (storm) | +10.7 | **+109.6** | 1 | 1 | 7.8 KB | Heavy: also the lightning flash |
| Headlines add-on | +4.4 | −4.3 | 0 | 2 | 2.4 KB | Light: a new headline every 20 s; the TV fetches at most every 30 min (Android) |
| Widgets add-on | +4.4 | +0.4 | 0 | 23 | 3.6 KB | Light: more caption to lay out |
| Home Assistant add-on | +12.4 | −1.6 | 0 | 15 | 68 KB | Some cost: the largest download, plus a fourth Home control. Camera views are heavy while open |
| Pi-hole and AdGuard add-on | +5.8 | −3.1 | 0 | 5 | 6.1 KB | Light |
| Screensaver showing | — | **+78.7** | 1 | 14 | — | Pan and zoom on every slide; still on Potato |
| Music view (on demand) | not measured | not measured | — | — | 20.6 KB | Android only. Fetched the first time it opens; lyrics tick 4×/s, beat pulse 30×/s while open |

**Not measured** (they need the Android shell or a server): the Music view, album art backdrop, Continue watching and Top Shelf, calendar, animated and online wallpapers, icon packs. Their periodic work is known from the code: the now-playing poll runs every 5 s while music shows, the music view at 1 s plus a 250 ms tick, the beat pulse at 33 ms, Top Shelf hero images crossfade on focus.

### Rules of thumb for a slow TV

1. Leave **Auto**, or choose **Potato** yourself. Potato halves Dock key cost again and removes every idle animation; Balanced removes the idle animations and keeps the slides.
2. Leave **Seconds**, **Drift**, **Weather effects** and the **Shelf layout** off. These are the four biggest costs.
3. The **Dark** or **Light** background saves the most memory.
4. Add-ons that only add a line under the clock (Headlines, Pi-hole, Widgets) are cheap. Home Assistant is the largest download; its cost while idle is small.

## Budgets for new work

- A key press: no forced layout (`getBoundingClientRect`, `offsetWidth`, `getComputedStyle`) inside `render()` unless the input changed. Cache by key, as `stageBox()` and `contentBox()` do.
- Idle on Home: no timer under one second except the seconds clock; no new always-on CSS animation without an add-on or a setting, and none on Potato.
- An add-on: nothing loaded while off; its `cost` in `ADDONS` comes from `npm run bench --only base,<id>` and this table.

## Measuring

```sh
npm run bench                                  # every feature, potato profile, 2 runs each
node scripts/bench.mjs --only base,drift       # some features
node scripts/bench.mjs --profile tv            # 4× slowdown at 1080p
node scripts/bench.mjs --root ../shore-old     # another checkout, for before/after
```

Reports are written to `.local/qa/bench/<profile>.json`. Each feature row also records what it showed (`shows`), so a feature that silently failed to switch on can be spotted. Close other heavy work while benchmarking: the numbers are relative and CPU contention skews them. `scripts/check-performance.mjs` remains the bounded regression screen with pass/fail budgets.
