/* Pi-hole and AdGuard Home add-on (Settings › Add-ons). How add-ons fit into Shore: addons/AGENTS.md.
   Off by default: nothing here runs until main.js calls start(). Data comes from FrameDevice.adBlock
   (AdBlock.java in the Android shell), which keeps the server address and password; the page only sees
   today's counts and whether blocking is on, and can pause it for a few minutes. ES5 only. */
(function () {
  'use strict';
  var NATIVE = window.FrameDevice && FrameDevice.adBlock || null, src = NATIVE, running = false, listeners = [], latest = null, wired = false;
  function changed() { latest = null; listeners.forEach(function (fn) { try { fn(); } catch (e) { } }); }
  function wire() { if (!wired && src && src.onChange) { wired = true; src.onChange(function () { setTimeout(changed, 0); }); } }
  /* {status, error, configured, kind, url, total, blocked, percent, blocking, until}; cached until the native side says it changed. */
  function model() {
    if (!latest) {
      var i = src ? src.info() : { status: 'off', total: -1, blocked: -1, blocking: true };
      latest = { status: i.status, error: i.error || '', configured: !!i.configured, kind: i.kind || '', url: i.url || '', total: i.total, blocked: i.blocked,
        percent: i.total > 0 && i.blocked >= 0 ? Math.round(i.blocked * 1000 / i.total) / 10 : -1, blocking: i.blocking !== false, until: i.until || 0 };
    }
    return latest;
  }
  /* Browser checks: a made-up server that records what Shore asks of it. */
  function mock(fake) {
    var state = { configured: true, enabled: false, kind: fake.kind || 'pihole', url: 'http://pi.hole', status: 'ok', error: '', at: 1, total: fake.total, blocked: fake.blocked, blocking: true, until: 0 }, calls = [];
    window.__adCalls = calls;
    return {
      info: function () { var s = {}; Object.keys(state).forEach(function (k) { s[k] = state[k]; }); s.status = state.enabled ? state.status : 'off'; return s; },
      enable: function (on) { calls.push(['enable', on]); state.enabled = on; },
      refresh: function () { calls.push(['refresh']); },
      pause: function (m) { calls.push(['pause', m]); state.blocking = m === 0; state.until = m ? Date.now() + m * 60000 : 0; setTimeout(changed, 0); },
      forget: function () { calls.push(['forget']); state.configured = false; },
      onChange: function () { }
    };
  }
  window.CleanFrameAdBlock = {
    available: function () { return !!src; },
    running: function () { return running; },
    start: function () { if (!src || running) return; wire(); running = true; src.enable(true); changed(); },
    stop: function (force) { if (!src || !running && !force) return; running = false; src.enable(false); changed(); },
    refresh: function () { if (running && src) src.refresh(); },
    model: model,
    /* Pauses blocking for minutes, or turns it back on with 0. Shown at once; the server's answer follows. */
    pause: function (minutes) {
      if (!running || !src) return;
      var m = model();
      m.blocking = !minutes; m.until = minutes ? Date.now() + minutes * 60000 : 0;
      src.pause(minutes);
    },
    forget: function () { if (src) src.forget(); },
    onChange: function (fn) { listeners.push(fn); },
    qa: function (fake) { running = false; src = fake ? mock(fake) : NATIVE; wired = false; changed(); }
  };
}());
