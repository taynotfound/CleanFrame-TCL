# Developer documentation

Using Shore? The [wiki](https://github.com/taynotfound/shore/wiki) has a page for every feature. These files are for people changing the code. The sources of the wiki pages are in [`wiki/`](wiki/).

Shore is a fork of CleanFrame, which was made for Samsung's The Frame. The interface in `app/` is shared, so some notes below describe the original Samsung (Tizen) build. They are marked.

## Shore (Android TV and Google TV)

| File | What it covers |
| --- | --- |
| [android-tv.md](android-tv.md) | How the Android shell works, what the bridge offers and what was verified on the TCL 55C6KS. Start here. |
| [performance.md](performance.md) | What each feature and add-on costs on a slow TV, and how to measure it (`npm run bench`). |
| [development.md](development.md) | The browser preview, runtime map, preference storage, add-ons, release notes. The Tizen signing sections are marked. |
| [interaction-behaviour.md](interaction-behaviour.md) | Focus and navigation rules for Home and Settings (written for CleanFrame 0.6.1; Android differences are in android-tv.md). |
| [testing.md](testing.md) | `npm run check`, the browser checks and the TV checklist. |
| [assets.md](assets.md), [asset-sources.md](asset-sources.md) | How wallpapers and glass materials are generated, and the photographers' credits. |
| [brand/](brand/) | The mark, the animated banner and ads. `python3 scripts/brand/make_brand.py` rebuilds them. |
| [images/tcl/](images/tcl/) | Photographs of the interface on the TCL 55C6KS, used by the wiki and the website. |
| [wiki/](wiki/) | The sources of the GitHub wiki. |

Also at the root: [CONTRIBUTING.md](../CONTRIBUTING.md), [AGENTS.md](../AGENTS.md) (instructions for coding agents) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## CleanFrame for Samsung The Frame (Tizen)

Kept because the packaging and device scripts still exist. They describe the maintainer's own TV; they are not an installer for anyone else.

| File | What it covers |
| --- | --- |
| [upstream-README.md](upstream-README.md) | The original CleanFrame README. |
| [for-agents.md](for-agents.md) | Working with a coding agent: browser changes, your own Tizen install, native Home. |
| [agent-tv-setup-guide.md](agent-tv-setup-guide.md) | Stage-by-stage Samsung setup. |
| [tv-status.md](tv-status.md) | Verification status of the maintainer's Samsung TV. |
| [public-release.md](public-release.md) | The pre-release review of the public CleanFrame source (20 October 2026). |
| [images/cleanframe-dock.jpg](images/cleanframe-dock.jpg) | The picture used in the original README. |
