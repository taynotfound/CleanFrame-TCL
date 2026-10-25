# Verified devices

Shore is an ordinary Android TV app, so most Google TV and Android TV sets should work. This page lists the devices it has actually been run on.

| Status | Meaning |
| --- | --- |
| **Reference** | The maintainer's own TV. Everything is built and checked here, on every release. |
| **Reported** | Someone runs Shore on it and sent a [TV report](https://github.com/taynotfound/shore/issues/new?template=3-tv-report.yml). |

## Devices

| Device | System | Hardware | Status | Notes |
| --- | --- | --- | --- | --- |
| TCL 55C6KS | Android TV 12 (Google TV) | MediaTek, 4K Mini LED | Reference | Needs the [auto start permission](Home-button#tcl-tvs-allow-auto-start) for the Home button service |
| TCL 65C7K | Google TV | | Reported | Working |
| CHiQ L32QM8G | Android 14 | | Reported | Working |
| Hisense A6N series ("SmartTV 4K", lushan-NF) | Android TV 12 (API 31) | MediaTek MT9676, 4× Cortex-A55 at 1.53 GHz (32-bit), Mali-G52, 2 GB RAM | Reported | Works with only ~360 MB free; the interface draws at 1080p and is scaled to 4K. Home Assistant add-on tested here. WebView Chrome 155 |

## What is checked on the reference TV

- Home button service, including the TCL auto start fix after a restart.
- HDMI inputs with live state, HDMI-CEC names and switching.
- Remote buttons: learning a button and assigning it.
- Language from the system locale.
- Online wallpapers, rendered natively once.
- Now playing through notification access, and the music view.
- The phone companion, uploads and the keyboard.
- The Pi-hole and AdGuard and Home Assistant add-ons.
- Not yet tested on the TCL RC833 remote itself.
- Hardware-protected HDMI video is black in `adb screencap`; that is expected.

The 4K panel renders apps at 1920×1080 with density 320, so the WebView viewport is 960×540 CSS px while `innerWidth` reports 1920. Technical notes are in [`docs/android-tv.md`](https://github.com/taynotfound/shore/blob/main/docs/android-tv.md).

## Add yours

Running Shore on another device? Send a [TV report](https://github.com/taynotfound/shore/issues/new?template=3-tv-report.yml) with the model, the Android or Google TV version, and what worked. It adds a row to this list. Attach the [problem report](Phone-companion#backup-and-problem-report) if something misbehaves, and see [Troubleshooting](Troubleshooting). On a slow set, choose [Performance](Performance) *Balanced* or *Potato*.
