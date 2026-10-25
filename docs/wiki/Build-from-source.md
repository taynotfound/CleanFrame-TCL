# Build from source

You need JDK 17 and the Android SDK (platform 35), or Android Studio.

```sh
git clone https://github.com/taynotfound/shore.git
cd shore
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
gradle -p android assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Without signing secrets, the APK is signed with your computer's debug key. Keep using the same key so updates install in place and keep your settings. A self-built APK and a release APK are signed differently, so switching between them means uninstalling first.

## API keys

Optional keys go in `android/local.properties` (ignored by git), or in environment variables when building. They are compiled into your APK, so don't share an APK that contains them.

| Key | Needed for |
| --- | --- |
| `unsplash.accessKey` | [Unsplash wallpapers](Wallpapers#keys) |
| `pexels.apiKey` | Pexels video loops |
| `klipy.apiKey` | Klipy GIFs |
| `tmdb.token` (`TMDB_TOKEN`) | [Top Shelf](Top-Shelf): Netflix, Disney+, Prime Video, Joyn, waipu.tv, Apple TV |
| `youtube.apiKey` (`YOUTUBE_API_KEY`) | Top Shelf: YouTube |
| `twitch.clientId`, `twitch.clientSecret` (`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) | Top Shelf: Twitch |

## GitHub Actions

[`android.yml`](https://github.com/taynotfound/shore/blob/main/.github/workflows/android.yml) builds a keyless APK from `main` and publishes it as a release when it is started by hand (*Run workflow*, or `gh workflow run android.yml`). It needs the signing key as repository secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) so every release can update the last one. `SHORE_PUBLIC_BUILD=1` makes sure no key from `local.properties` or the environment gets in.

Release notes come from commit messages: see "Release notes" in [docs/development.md](https://github.com/taynotfound/shore/blob/main/docs/development.md).

## Work on the interface in a browser

The interface also runs in a desktop browser for design work:

```sh
npm ci
npm run dev:public
```

Then open [localhost:4795/home/](http://localhost:4795/home/). Run `npm run check` and `npm run check:browser` after changing `app/`, and read [CONTRIBUTING.md](https://github.com/taynotfound/shore/blob/main/CONTRIBUTING.md) before opening a pull request.

`node scripts/companion-shots.mjs` renders the phone companion with invented data into `site/shots/companion*.jpg`.

## Repository layout

| Path | What it is |
| --- | --- |
| `app/` | The Shore interface (HTML, CSS, JavaScript) |
| `app/device-android.js` | Android adapter: apps, inputs, wallpapers, remote buttons |
| `app/addons/` | Add-ons, fetched only when switched on |
| `app/i18n.js`, `app/i18n/` | Translations |
| `android/` | Java shell: WebView, app and input bridge, Home button service, wallpaper and Top Shelf downloaders, the phone companion server and page |
| `site/` | The [website](https://taynotfound.github.io/shore/) and the installable phone companion page |
| `debloat/` | Optional, reversible debloat list and script |
| `docs/` | Developer notes; [`docs/README.md`](https://github.com/taynotfound/shore/blob/main/docs/README.md) says which to read |
| `docs/wiki/` | The source of this wiki |
| `scripts/` | Checks, preview server, packaging, brand kit |

## Brand

The half sun over three lines in ivory `#e3e6dc`, on a deep blue-grey gradient (`#20303a` to `#0f161a`) with a warm accent `#f2c58b`, set in Manrope. The same mark is the TV icon, the launcher banner, the website and the phone companion. [`docs/brand/`](https://github.com/taynotfound/shore/tree/main/docs/brand) holds the animated banner (SVG, GIF, MP4), the logo and mark, and ready-made ads (1200×628 and 1080×1080, as PNG and MP4). `python3 scripts/brand/make_brand.py` rebuilds them from the screenshots in `site/shots/` (needs Node with Playwright, ffmpeg and Pillow).

## Editing this wiki

The pages live in [`docs/wiki/`](https://github.com/taynotfound/shore/tree/main/docs/wiki) and are copied to the GitHub wiki by the *Wiki* workflow when they change on `main`. Edit the files there, not in the wiki's web editor.
