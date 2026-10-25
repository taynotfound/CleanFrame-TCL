#!/bin/sh
# Disable (or restore) the packages in packages.txt on a TCL Google TV over adb.
#   TV=<tv-ip>:5555 ./debloat.sh disable   # turn the listed apps off for user 0
#   TV=<tv-ip>:5555 ./debloat.sh restore   # turn them back on
#   TV=<tv-ip>:5555 ./debloat.sh status    # show which listed apps are disabled
# Nothing is uninstalled; a factory reset also restores everything.
set -eu
cd "$(dirname "$0")"
: "${TV:?Set TV=<tv-ip>:5555 (enable USB/network debugging on the TV first)}"
ADB="${ADB:-adb}"
$ADB connect "$TV" >/dev/null
PKGS=$(sed 's/#.*//' packages.txt | tr -s ' \t' '\n' | grep -v '^$')
case "${1:-status}" in
  disable) for p in $PKGS; do printf '%-36s ' "$p"; $ADB -s "$TV" shell pm disable-user --user 0 "$p" 2>&1 | tail -1; done ;;
  restore) for p in $PKGS; do printf '%-36s ' "$p"; $ADB -s "$TV" shell pm enable "$p" 2>&1 | tail -1; done ;;
  status)  disabled=$($ADB -s "$TV" shell pm list packages -d | sed 's/package://' | tr '\r\n' '  ')
           for p in $PKGS; do case " $disabled " in *" $p "*) s=disabled;; *) s=enabled;; esac; printf '%-36s %s\n' "$p" "$s"; done ;;
  *) echo "usage: TV=<ip>:5555 $0 disable|restore|status" >&2; exit 2 ;;
esac
