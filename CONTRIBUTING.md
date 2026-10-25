# Contributing to Shore

Shore is a launcher for Android TV and Google TV, forked from [CleanFrame](https://github.com/nthnclrk/CleanFrame) (made for Samsung The Frame). Contributions should keep the remote experience simple and say what has actually been tested. Forks and adaptations are welcome.

Using Shore rather than changing it? The [wiki](https://github.com/taynotfound/shore/wiki) is the place, and [Discord](https://discord.gg/z6C4Mj9VPK) is the fastest way to ask.

## Start in the browser

Most interface work needs no TV. The interface in `app/` runs in a desktop browser:

```sh
npm ci
npm run dev:public      # http://localhost:4795/home/, public fonts only
npm run check
npx playwright install chromium
CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser
npm run check:public
```

Read [`docs/README.md`](docs/README.md) to find the right notes: [`docs/android-tv.md`](docs/android-tv.md) for the Android shell, [`docs/development.md`](docs/development.md) and [`docs/interaction-behaviour.md`](docs/interaction-behaviour.md) for the interface.

Keep runtime JavaScript ES5-compatible. Use existing focus, panel and preference logic. A new CSS/DOM API needs target-device evidence before it becomes a compatibility claim. Keep new dependencies in development tooling unless the runtime need is clear. Keep live blur and pixel analysis off the TV animation path.

The Android shell is in `android/` (JDK 17, Android SDK platform 35): `gradle -p android assembleRelease`. See [Build from source](https://github.com/taynotfound/shore/wiki/Build-from-source).

## Propose a change

For a bug, describe the trigger, expected result and actual result. Include the TV model and Android version, or the browser and viewport, and attach the problem report from the phone companion (*TV settings › Problem report*). For a new feature, explain the task it helps someone complete from the sofa. Open an issue before changing the app model or adding a new service dependency.

A pull request should explain the resulting behaviour, the checks run and any untested device result. Include a screenshot for visual changes. Check Dock, List and Shelf, single focus, panel Back behaviour and saved-preference recovery when relevant. The TV remote remains the final check for remote feel; browser throttling is only a comparison. New interface text needs an entry in each file in `app/i18n/`.

## Device work and privacy

Use your own TV and your own accounts. Each TV owner decides whether and when to permit interruptions or settings changes. Native Home/startup experiments on Samsung TVs are separate from UI work; see [`docs/for-agents.md`](docs/for-agents.md).

Keep passwords, tokens, API keys, signing keys, serial numbers, addresses and original device settings out of issues, screenshots and PRs. Never share an APK built with your own API keys. Report security issues through GitHub's private vulnerability reporting if enabled, or an established private channel with the maintainer; do not attach credentials to a public issue.

## Assets and licences

Shore's original code is MIT. Contributions to that code use the same licence. Keep upstream asset licences and source records intact. Add only assets you have permission to redistribute, and explain any required attribution or separate terms. Personal paid fonts stay under `.local/`; the public app must work without them. Review `THIRD_PARTY_NOTICES.md` before adding or replacing a logo, photograph or font.
