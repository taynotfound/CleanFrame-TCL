# Development

## Browser preview

Start with Node.js 22+ and Python 3.10+, then `npm ci`. These are the supported development baselines; lower versions have not been checked. Install Chromium once with `npx playwright install chromium` for the optional browser tools. Linux hosts may also need Playwright's documented system dependencies (`npx playwright install --with-deps chromium`).

`npm run dev` starts http://localhost:4795/home/, bound to this computer only. `/home/` serves `app/`, the same source used in the signed widget. Arrow keys, Enter and Escape mirror remote navigation. Device controls report that they require the TV; no success is simulated.

`npm run dev:public` serves the same interface using only the bundled public fonts, even when paid Pangram files exist locally. For a contributor's fresh clone, use the README and `docs/for-agents.md`; the signing/device setup below describes the reference machine and needs adaptation for another owner.

All UI assets, public fonts and the fifteen wallpapers are bundled. This private build also includes the three locally installed Pangram families through an ignored build overlay; their binaries are not in the public source tree. Glass materials and blurred panel backgrounds are rendered ahead of time; see app/assets/wallpapers/README.md.

## Runtime map and compatibility

- `app/index.html` loads the device adapter, gallery/font/palette catalogues, `assets/icons/metrics.js` and `main.js`, with `style.css`.
- `main.js` owns the List and Dock layouts, panel stack, focus, preferences and wallpaper timers. `device.js` owns installed-app discovery and Tizen calls. Keep device details in that adapter.
- The logical stage is 1920 x 1080, scaled uniformly to the viewport. Check at 1920 x 1080 and 1280 x 720. Glass geometry and cached materials must stay aligned.
- Preferences use localStorage key `cleanframe.home.v1`, with a fallback read from `cleanframe.shore.v1`. Legacy fields are `dock`, `wallpaper`, `mode`, `lastApp` and `theme`. The 0.6 migration preserves app order, wallpaper, rotation and selection. Legacy `list` becomes Dark / List / Type; `shore` and `grid` become Photo / Dock / Glass. Appearance axes are stored separately. A saved dynamic app keeps its real app ID and name; discovery refreshes the installed catalogue. Keep migration checks when changing this format.
- Add-ons (`app/addons/`, guide in `app/addons/AGENTS.md`) are optional features behind Settings › Add-ons: one on/off axis each, off by default, started only after Home has painted. Home Assistant is the first: `app/addons/homeassistant.js` builds rooms, cameras and the indoor reading from data that `HomeAssistant.java` reads natively on Android. Without that bridge (Tizen, browser preview) the add-on and the Add-ons row are absent. `ShoreQA.homeAssistant(fake)` swaps in made-up areas and states for browser checks.
- `window.ShoreQA.state()` and `.where()` expose state and focus for browser tests. `minuteMs` can shorten rotation intervals in an isolated browser test.

The tested target is the Tizen 9.0 TV in [TV status](tv-status.md). The manifest's `required_version="6.5"` is a package declaration, not proof that Tizen 6.5 has been tested. The exact TV Chromium/WebKit engine version has not been recorded. Keep runtime JavaScript ES5-compatible and verify any new DOM/CSS API on the target before claiming support. `node --check` checks syntax for Node; it does not enforce ES5 or TV API availability.

Keep material rendering in the development tools. See [asset generation](assets.md) and [testing](testing.md).

## Local TV tools and signing

This Mac's setup lives under `.local/` and is excluded from Git:

- `tizen-sdk/`: official Tizen SDK command-line tools, embedded Java and SDB.
- `certificates/private/`: Samsung-issued author/distributor certificates, private keys, protected PKCS12 files and their generated password.
- `certificates/ca/`: CA certificates from Samsung's Certificate Extension.
- `device.json`: TV host address.

`npm run package` builds the widget from `app/`, configures the workspace-local SDK and signing profile, then signs it with the official SDK. It writes `dist/CleanFrame-unsigned.wgt` and `dist/CleanFrame.wgt`. `scripts/font_assets.py` adds only the six approved local Pangram files when complete pairs are available, plus their generated CSS/catalogue. It never copies private fonts into `app/`. Public checkouts use Manrope, Geist and Newsreader.

`npm run export:public` is a separate offline, unsigned export. It always disables the proprietary overlay, includes the project/third-party notices and writes `dist/CleanFrame-public-unsigned.wgt`. It reads no signing credentials and contacts no TV. Use it for public build preparation; `npm run package` on this machine remains a personal build that can contain paid fonts. Asset release checks are listed in `docs/public-release.md`.

The SDK requires a terminal when it prompts for certificate passwords and whether to save them. The packaging script supplies the generated certificate password from the ignored private file and declines the optional password-saving prompts. It redacts that password from output. Login credentials are not required for routine packaging.

The initial custom XML-signature implementation was rejected by the TV. Use the official SDK packager for future builds; the installed test was signed with Tizen CLI 2.5.25.

## Another checkout or Mac

Install the official [Samsung TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html) into `.local/tizen-sdk`, or copy this Mac's local tools when appropriate. To retain in-place app updates, securely transfer the existing author certificate and its password. Keep those credentials local.

For new certificates, use Samsung's [certificate setup](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html). The distributor certificate must include the target TV's DUID. A generic emulator certificate does not establish compatibility with this consumer TV.

Create `.local/device.json` with:

```json
{"host": "YOUR_TV_IP_ADDRESS"}
```

For developer access, connect the TV and Mac to the same network, enable Developer Mode in Apps → App Settings → 12345 and enter the Mac's local address. Fully restart the TV if the developer port remains closed.

## Install and launch

`npm run tv:install` uploads the signed widget with a unique build filename and calls Samsung's `vd_appinstall` command. It checks for `install completed` and confirms the app appears in the installed-app list. `sdb install` on this TV only uploaded the widget and did not install it.

`npm run tv:launch` opens the installed test. It does not change startup defaults. All device scripts use the app identity in `app/config.xml`; changing that identity would create a different application.

## Sources

- [Samsung developer connection steps](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html)
- [Samsung app-launch sample](https://github.com/SamsungDForum/LaunchApp)
- [Samsung remote input guide](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html)

## Native Home and recovery

Native Home/startup was configured separately from the app installer. Physical Home from Netflix is confirmed. The one-shot helper runs as the SDK user. See scripts/native-home/README.md and docs/tv-status.md for the tested firmware and pending visual checks.

Query with `python3 scripts/native-home/run.py query`. Restore the saved pre-integration Home/startup values with `python3 scripts/native-home/run.py restore`. The private baseline is `.local/native-home/original.json`; preserve it and do not replace it with the applied state. The legacy `.local/native-home/run.py` command is also retained. Restore before uninstalling CleanFrame or changing its stable app identity.

To rebuild the one-shot helper with this Mac's private verified SDK:

```sh
DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 DOTNET_CLI_HOME="$PWD/.local/native-home/cli" .local/native-home/dotnet-sdk/dotnet build scripts/native-home/Control.csproj -c Release --nologo -p:BaseIntermediateOutputPath="$PWD/.local/native-home/obj/" -o .local/native-home/out
```

The helper's output is not packaged inside the web app. Keep the original values, compiler, runtime output and all device diagnostics ignored.

## Release notes

Releases are started by hand (`gh workflow run android.yml`); each publishes a keyless APK whose notes come from `scripts/release-notes.mjs` and cover every commit since the previous release. Write them for people installing Shore: add `Release-title:`, `Release:` (one line per user-visible change) and optionally `Release-image:` lines to the commit message. To fix the wording of a commit that is already pushed, add it to `scripts/release-copy.json` under its short hash instead of rewriting history. Commits without app changes only appear in the folded changelog.
