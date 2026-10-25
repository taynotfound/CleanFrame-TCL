# Tested TVs

Shore is an ordinary Android TV app, so most Google TV and Android TV sets should work. These are confirmed by the maintainer or by people running it:

| TV | System | Chip, memory | Notes |
| --- | --- | --- | --- |
| TCL 55C6KS | Android TV 12 (Google TV) | MediaTek, 4K Mini LED | Reference TV: everything is built and checked here |
| TCL 65C7K | Google TV | | Reported working |
| CHiQ L32QM8G | Android 14 | | Reported working |
| Hisense A6N series ("SmartTV 4K", lushan-NF) | Android TV 12 (API 31) | MediaTek MT9676, 4× Cortex-A55 at 1.53 GHz (32-bit), Mali-G52, 2 GB RAM | Works with only ~360 MB free; the interface draws at 1080p and is scaled to 4K. Home Assistant add-on tested here. WebView Chrome 155 |

## Add yours

Running it on another TV? A [TV report](https://github.com/taynotfound/shore/issues/new?template=3-tv-report.yml) adds it to this list. On a slow set, see [Performance](Performance). Attach the [problem report](Phone-companion#backup-and-problem-report) if something misbehaves.

## What is known about the reference TV

- The 4K panel renders apps at 1920×1080 with density 320, so the WebView viewport is 960×540 CSS px while `innerWidth` reports 1920.
- On TCL, the boot manager needs the [auto start permission](Home-button#tcl-tvs-allow-auto-start) for the Home button service.
- The remote buttons page is [not yet tested](Remote-buttons#limits) on the TCL RC833 remote itself.
