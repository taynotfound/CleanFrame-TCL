# Shore

Shore is a launcher for Android TV and Google TV. `app/` is the interface (HTML, CSS and ES5-compatible JavaScript, shown full screen in a WebView); `android/` is the Java shell. Start with `docs/README.md`, then `docs/development.md`, `docs/interaction-behaviour.md` and `docs/android-tv.md`.

Use simple HTML, CSS and ES5-compatible JavaScript for the TV. Node tooling can use modern JavaScript. Preserve remote focus/navigation, preference migrations and cached rendering. Read `docs/assets.md` before changing images, glass geometry or icon sizing; keep live blur and pixel analysis off the TV animation path. New interface text needs an entry in each file in `app/i18n/`.

Run `npm run check` for app changes. For interaction changes, run the browser preview and `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser`; public contributors must not need proprietary fonts. Run `npm run check:public` before a public release. Follow `CONTRIBUTING.md` and retain third-party notices. The wiki sources are in `docs/wiki/`; update them when behaviour changes, and the verified-devices list when a device is confirmed.

Browser/repository tasks do not authorise device access. Run `adb` against a TV only when the task says to; announce any installation, app launch or restart, and confirm visible results with the owner. Do not change a TV's Home or screensaver settings without explicit authority and a recorded original value.

Keep API keys, signing keys, passwords, device identifiers, addresses and generated packages out of Git: `android/local.properties`, `.local/` and `dist/` are ignored. Never commit paid font binaries. Release APKs are built without API keys (`SHORE_PUBLIC_BUILD=1`). Public-code licensing does not replace the terms in `THIRD_PARTY_NOTICES.md`.

Preserve shared or uncommitted work. Use reversible deletion; never reset, force-push or rewrite history without explicit authority. Publication/visibility changes and releases need a separate instruction.
