# Third-party notices

The root MIT licence covers CleanFrame's original code and documentation. Third-party material retains the terms below. Keep these notices and the adjacent licence texts when sharing source or a build.

## Fonts

| Material | Terms and source record |
| --- | --- |
| Manrope (`manrope.woff2`, plus the Google Fonts v20 Cyrillic and Latin Extended subsets `manrope-cyrillic.woff2` and `manrope-latin-ext.woff2`) | SIL Open Font License 1.1; `app/assets/manrope-OFL.txt` |
| Geist, Newsreader, Inter, Outfit, Space Grotesk, Sora and Playfair Display | SIL Open Font License 1.1; licences beside the files in `app/assets/fonts/`, with exact sources and hashes in `app/assets/fonts/SOURCES.json` |
| Optional PP Neue Montreal, PP Mori and PP Pangram Sans | Proprietary. Binaries stay in ignored `.local/` storage and are excluded from Git and public exports. The optional local overlay requires the user's own permission to use and embed those files. |

The public app uses Manrope, Geist, Newsreader, Inter, Outfit, Space Grotesk, Sora and Playfair Display. A personal build containing proprietary fonts must stay private. See [Pangram's licensing information](https://pangrampangram.com/pages/eula).

## Icons and trademarks

| Material | Provenance and terms |
| --- | --- |
| Simple Icons service marks | CC0; exact revisions and adaptations in `app/assets/icons/SOURCES.json` and `ADDITIONAL-SOURCES.json`. The CC0 text is retained beside the icons. |
| Disney+, ABC and SBS marks | [Custom Brand Icons](https://github.com/elax46/custom-brand-icons), MIT. The retained licence is `app/assets/icons/CUSTOM-BRAND-ICONS-LICENSE.txt`. ABC and SBS sources were replaced during the public-source review. Exact revisions, source files and extraction/recolour notes are in `SOURCES.json`. |
| Art, apps, settings and home outlines | Original CleanFrame drawings, covered by the project's MIT licence. |

Brand marks identify services. Their owners retain trademark rights; this project claims no endorsement or affiliation. The older Australian TV icon archive's GPL text is retained for historical provenance only; no current icon uses that archive.

## Photographs and derived materials

The fifteen photo pages were individually checked on 20 October 2026. Each displayed its credited author and free use under the [Unsplash License](https://unsplash.com/license). The [asset source register](docs/asset-sources.md) links every page. Runtime paths are in `app/assets/wallpapers/SOURCES.json`.

Photographers retain their rights. Wallpapers, thumbnails, panel backgrounds and material fields derive from the credited photographs and retain their terms. The Unsplash licence permits copying, modification and distribution subject to its restrictions, including on selling unmodified images and building a competing image service.

## Development dependencies and exports

Development dependencies retain the licences in their npm packages. They are not copied into the TV JavaScript runtime.

Release APKs are built without private fonts or API keys. Preserve the included font and icon licence texts, and run `npm run check:public` before publishing a repository or download.

## Shore additions

| Material | Terms |
| --- | --- |
| Joyn, arte and waipu.tv wordmarks | Public-domain logo files from Wikimedia Commons, recoloured white; sources in `app/assets/icons/SOURCES.json`. Trademarks remain with their owners. |
| Twitch, ZDF and Das Erste (ARD) marks | Simple Icons, CC0. |
| Bundled animated loops (`android/app/src/main/assets-android/loops/`) | Generated procedurally with ffmpeg for this project; MIT with the code. |
| Online wallpapers (NASA, Bing, Wikimedia, Picsum, Unsplash, Pexels, Klipy) | Downloaded on the TV at runtime, never redistributed; each provider's terms apply and credits appear in the gallery. |
| AndroidX WebKit (`androidx.webkit:webkit`) | Apache License 2.0; compiled into the Android APK. |
| ZXing core (`com.google.zxing:core`), QR codes for the phone companion | Apache License 2.0; compiled into the Android APK. https://github.com/zxing/zxing |
| Weather (Open-Meteo) | Fetched on the TV at runtime when Weather is on; data CC BY 4.0, credited in Settings › Clock. |
| Artist pictures and covers (TheAudioDB, iTunes Search API) | Fetched on the TV at runtime when *Sharper pictures* is on, cached privately for 30 days and never redistributed; each provider's terms apply. |
| Brand files (`docs/brand/`, `scripts/brand/`) | Made for this project; MIT with the code. They embed Manrope (SIL OFL) and screenshots of Shore with an invented track and cover. |
| Photos sent from the phone companion (My photos) | The user's own files, stored privately on the TV; never redistributed. |
| Shore icon, banner and website (`site/`) | Made for this project; MIT with the code. The companion page uses Manrope (SIL OFL, `app/assets/manrope-OFL.txt`). |
