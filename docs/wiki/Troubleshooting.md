# Troubleshooting

Start with *Settings › Google TV › Setup and health*: it lists each setup step with a tick when it works. A small dot on *Settings* means something needs attention.

## The Home button does nothing, or opens Google TV

- Check *Settings › System › Accessibility › Shore Home button* is on. See [Home button](Home-button).
- **TCL, after a restart:** the switch shows on but the service shows *Off*. Allow Shore to auto start in TV Guard, then switch the service off and on once. See [TCL TVs: allow auto start](Home-button#tcl-tvs-allow-auto-start).
- Holding Home for about a second opens Google TV Home on purpose. If Google TV Home appears by itself, Shore takes over, unless you opened it on purpose.

## A remote button does nothing

*No button arrived* on the [Remote buttons](Remote-buttons#limits) page means the TV firmware handled the key before Shore could. Navigation, OK, Back, Home, volume and power are never captured.

## An HDMI device has no tile

- The device must be **plugged in and switched on**; standby or unplugged devices are hidden.
- CEC must be on in the TV settings (TCL calls it *T-Link*). Without it the tile shows the port name, such as *HDMI 1*.
- Check *Settings › Home screen › Inputs* that the input is not hidden. See [HDMI inputs](HDMI-inputs).

## Notification access is missing

*Now playing* and the music view need notification access. Some Google TV builds don't show the Notification access page. Allow it once from a computer on the same network, using ADB:

```bash
adb shell cmd notification allow_listener app.cleanframe.tv/app.cleanframe.tv.NowPlayingService
```

To undo, run the same command with `disallow_listener`.

## No lyrics

Shore only shows lyrics whose title, artist and length match the version playing, so a different edit or a cover shows none rather than the wrong words. See [Music view](Music-view).

## Weather or headlines are missing

Weather is off until you turn it on (*Settings › Weather*). Headlines are an [add-on](Add-ons) and off until switched on (*Settings › Add-ons*). The weather place comes from the TV's time zone, or from the [phone companion](Phone-companion).

## A wallpaper source shows nothing

The Sources page says how many photos are in rotation, or which source couldn't be reached. Unsplash, Pexels and Klipy need your own keys, which release APKs don't carry: see [Wallpapers](Wallpapers#keys).

## The phone can't reach the TV

- The companion only runs while *Settings › Phone › Phone companion* is on, and phone and TV must be on the same Wi-Fi.
- If the TV's IP address changed, scan the QR code again. A DHCP reservation in your router avoids that.
- If you used *Forget paired phones*, every phone has to scan again.
- Shore must be open on the TV (in front or behind another app) for settings changes to apply.

## An update will not install

- Android asks you to confirm, and the first time to allow Shore to install apps.
- A self-built APK and a release APK are signed differently: switching between them means uninstalling first. See [Updates](Updates#release-apk-or-your-own-build).
- A copy you built yourself only tells you a new version is out; rebuild it from the latest source.

## It feels slow

Open *Settings › Performance*. *Auto* measures your TV; *Balanced* or *Potato* stops animation or removes transitions without changing the look. See [Performance](Performance).

## Report a problem

In the [phone companion](Phone-companion#backup-and-problem-report), open *TV settings › Problem report › Download report* and attach the file to a [bug report](https://github.com/taynotfound/shore/issues/new?template=1-bug.yml). It holds no settings, addresses or passwords. Questions are welcome on [Discord](https://discord.gg/z6C4Mj9VPK).
