# Home button

## Make the Home button open Shore

Google TV always sends Home to its own launcher and ignores the "default home app" setting. Shore includes a small accessibility service that catches the Home key instead, the same approach launchers like Projectivy use. Turn it on yourself:

**Settings › System › Accessibility › Shore Home button › On**

- Press Home to open Shore.
- Hold Home for about a second to open the original Google TV Home. *Settings › Google TV › Google TV Home* in Shore does the same.
- If Google TV Home appears by itself, for example after leaving an app, Shore takes over. It won't do that if you opened Google TV Home on purpose.

The service only sees remote keys and which app is in front. It never reads screen content. Turn the switch off to undo.

## TCL TVs: allow auto start

> [!IMPORTANT]
> After a restart, TCL's boot manager refuses to start accessibility services of apps without its *auto start* permission. The switch then still shows *Enable* on, but the service shows *Off* and no button works. Shore's *Remote buttons* page says so when this happens. Allow Shore to auto start in TCL's **TV Guard** (permission manager), then switch *Shore Home button* off and on once.

## Setup and health

When something stops working (the Home button service after an update, notification access, a wallpaper source) or an update is waiting, a small dot appears on *Settings*. *Settings › Google TV › Setup and health* says what.

## Other things that need this service

The [remote buttons](Remote-buttons), the [sleep timer](Screensaver-night-and-sleep#sleep-timer), the [parental lock](Parental-lock-and-screen-time) and screen time limits all use the Shore Home button service.
