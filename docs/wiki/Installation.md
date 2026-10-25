# Installation

You need a computer on the same Wi-Fi with [Android platform tools](https://developer.android.com/tools/releases/platform-tools) (`adb`), once. Shore installs next to Google TV and removes nothing.

1. **Turn on developer options.** On the TV, open *Settings › System › About* and press OK on **Android TV OS build** seven times, until "You are now a developer" appears. Use the main profile; kids profiles hide this.
2. **Turn on USB debugging** in *Settings › System › Developer options*.
3. **Connect.** Replace `<tv-ip>` with the address from *Settings › Network*, then press OK on "Allow debugging?" and tick *Always allow*:

   ```sh
   adb connect <tv-ip>:5555
   ```
4. **Install** the APK from the [latest release](https://github.com/taynotfound/shore/releases/latest), or [build it yourself](Build-from-source):

   ```sh
   adb install -r Shore.apk
   ```
5. **Point Home at Shore.** Turn on *Settings › System › Accessibility › Shore Home button*. On TCL sets, also [allow auto start](Home-button#tcl-tvs-allow-auto-start).

Open Shore once. The first time it offers a short setup, and *Settings › Google TV › Setup and health* lists each step with a tick when it works. After this you never need the computer again: Shore [updates itself](Updates).

## Android 14 builds with "Wireless debugging"

Open *Wireless debugging › Pair device with pairing code*, then run `adb pair <ip>:<pair-port> <code>` and `adb connect <ip>:<port>`. The pairing port is different from the connect port.

## Undoing it

Turn off *Shore Home button* in Accessibility and Home goes back to Google TV. To remove Shore, uninstall it like any app (or `adb uninstall app.cleanframe.tv`). Its package ID stays `app.cleanframe.tv` so installs from earlier versions update in place.

## Optional: switch off TCL's extras

[`debloat/packages.txt`](https://github.com/taynotfound/shore/blob/main/debloat/packages.txt) lists TCL and Google extras that are safe to switch off, such as Samba TV tracking, promo overlays, the store demo and Alexa, each with a comment. Edit the list, then:

```sh
TV=<tv-ip>:5555 debloat/debloat.sh disable   # switch them off (nothing is uninstalled)
TV=<tv-ip>:5555 debloat/debloat.sh status
TV=<tv-ip>:5555 debloat/debloat.sh restore   # switch them back on
```

Live TV, inputs, settings, the remote, casting, updates and Google TV itself are never on the list. A firmware update or factory reset may switch apps back on.

Next: [Home button](Home-button) · [Troubleshooting](Troubleshooting)
