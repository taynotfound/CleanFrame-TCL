# Developer documentation

Using Shore? The [wiki](https://github.com/taynotfound/shore/wiki) has a page for every feature, and a list of [verified devices](https://github.com/taynotfound/shore/wiki/Verified-devices). These files are for people changing the code. The sources of the wiki pages are in [`wiki/`](wiki/).

| File | What it covers |
| --- | --- |
| [android-tv.md](android-tv.md) | How the Android shell works, what the bridge offers and what was verified on the TCL 55C6KS. Start here. |
| [development.md](development.md) | The browser preview, runtime map, preference storage, add-ons, release notes. |
| [interaction-behaviour.md](interaction-behaviour.md) | Focus and navigation rules for Home, Settings, search, the editor and add-ons. |
| [testing.md](testing.md) | `npm run check`, the browser checks and the TV checklist. |
| [performance.md](performance.md) | What each feature and add-on costs on a slow TV, and how to measure it (`npm run bench`). |
| [assets.md](assets.md), [asset-sources.md](asset-sources.md) | How wallpapers and glass materials are generated, and the photographers' credits. |
| [brand/](brand/) | The mark, the animated banner and ads. `python3 scripts/brand/make_brand.py` rebuilds them. |
| [images/tcl/](images/tcl/) | Photographs of the interface on the TCL 55C6KS, used by the wiki and the website. |
| [wiki/](wiki/) | The sources of the GitHub wiki. |

Also at the root: [CONTRIBUTING.md](../CONTRIBUTING.md), [AGENTS.md](../AGENTS.md) (instructions for coding agents) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
