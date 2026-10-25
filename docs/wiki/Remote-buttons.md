# Remote buttons

*Settings › Google TV › Remote buttons* (needs the [accessibility service](Home-button)). Choose **Assign a button…**, press a button on the remote, then pick what it does:

- *Default*: what the TV normally does. This removes the assignment.
- *Shore Home*, *Do nothing*, *Screensaver* or *Sleep timer*.
- A connected HDMI input, or an app from your Home screen.

Assignments work everywhere, including inside other apps.

## Limits

- Shore only sees buttons that reach Android's accessibility key filter. If the TV firmware handles a button first, the page says *No button arrived*.
- Navigation, OK, Back, Home, volume and power are never captured.
- Two buttons that send the same Android key code share one assignment.
- Not yet tested on the TCL RC833 remote itself.

## Sleep timer on a button

Give the *Sleep timer* action to a button: each press moves to the next step (30, 60, 90 or 120 minutes). See [Screensaver, night and sleep](Screensaver-night-and-sleep#sleep-timer).
