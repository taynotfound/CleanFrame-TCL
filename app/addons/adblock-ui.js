/* Pi-hole and AdGuard add-on: Shore's side (addons/AGENTS.md). Fetched only when the add-on is switched on, after
   addons/adblock.js, and run inside main.js's scope: the functions assigned here replace main.js's stubs. */
  /* ---------- Pi-hole and AdGuard add-on: a line under the clock and a pause (addons/adblock.js) ---------- */
  adShown = function () { return !!(AD && S.c.aad === 'on' && AD.running() && AD.model().configured); };
  adStatus = function () {
    var m = AD.model();
    if (S.c.aad !== 'on') return 'Off';
    if (!m.configured || m.status === 'setup') return 'Set up on your phone';
    if (m.status === 'error') return m.error === 'auth' ? 'The server refused the password' : m.error === 'network' ? 'Couldn’t reach the server' : 'The server didn’t answer as expected';
    if (m.status !== 'ok') return 'Connecting…';
    return adLine();
  };
  /* "12.4% blocked today" or "Blocking paused · 4 min" (English; the caption translates it). */
  adLine = function () {
    var m = adShown() ? AD.model() : null, left;
    if (!m || m.status !== 'ok') return '';
    if (!m.blocking) { left = m.until ? Math.max(1, Math.ceil((m.until - Date.now()) / 60000)) : 0; return left ? 'Blocking paused · ' + left + ' min' : 'Blocking off'; }
    return m.percent >= 0 ? m.percent + '% blocked today' : '';
  };
  adSections = function () {
    var m = AD.model(), ok = m.configured && m.status === 'ok';
    var out = [{ id: 'adstatus', title: '', items: [{ action: 'ad.refresh', label: 'Connection', description: adStatus(), pair: true }],
      reason: m.configured && m.url ? (m.kind === 'adguard' ? 'AdGuard Home' : 'Pi-hole') + ' · ' + m.url.replace(/^https?:\/\//, '') : '' }];
    if (!m.configured) return out.concat([{ id: 'adsetup', title: '', items: [], reason: 'Type the server’s address and password in the phone companion, on the Add-ons tab. They stay on the TV.' }]);
    out.push({ id: 'adpause', title: 'Blocking', items: [{ action: 'ad.pause.0', label: 'On', tick: true, applied: m.blocking, disabled: !ok }]
      .concat([5, 30, 60].map(function (n) { return { action: 'ad.pause.' + n, label: 'Pause ' + n + ' min', tick: true, applied: !m.blocking && m.until > Date.now() && Math.abs(m.until - Date.now() - n * 60000) < 60000 * Math.max(1, n / 2), disabled: !ok }; })),
      reason: m.blocking ? 'Pausing lets a blocked site or app work for a while; blocking comes back on its own.' : '' });
    out.push({ id: 'adforget', title: '', items: [{ action: 'ad.forget', label: 'Disconnect', description: 'Forget the server and its password' }] });
    return out;
  };
  if (AD) AD.onChange(function () { var t = top(); if (t.id === 'home' || t.id === 'settings' || isSettingsDetail(t)) render(); });
