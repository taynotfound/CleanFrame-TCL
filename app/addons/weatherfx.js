/* Weather effects add-on (addons/AGENTS.md): rain, snow, fog or a storm drawn over the photo when the current
   weather calls for it. Fetched only when switched on, with weatherfx.css, and run inside main.js's scope: the
   functions assigned here replace main.js's stubs. CSS-only drawing, transform and opacity; the cost is the
   full-screen animated layer, which a slow TV pays on every frame (docs/performance.md). Off on Potato. */
  weatherFx = function () {
    if (S.c.bg !== 'photo' || potato()) return '';
    var kind = fxForced || (S.c.wfx === 'on' && S.c.cweather === 'on' && WEATHER && WEATHER.icon ? WEATHER.icon() : '');
    return /^(drizzle|rain|storm|snow|fog)$/.test(kind) ? ' wx-' + kind : '';
  };
  /* Lightning: the flash layer is added only for its 1.2 s, every 9 to 21 seconds while a storm shows on Home. */
  var flashTimer = 0, flashEl = document.querySelector('.wx-f');
  syncStorm = function () {
    var on = stage.className.indexOf(' wx-storm') >= 0;
    if (!on) { clearTimeout(flashTimer); flashTimer = 0; if (flashEl) flashEl.className = 'wx-f'; return; }
    if (flashTimer || !flashEl) return;
    flashTimer = setTimeout(function () {
      flashTimer = 0;
      if (stage.className.indexOf(' wx-storm') < 0) return;
      if (!animationsPaused()) { flashEl.className = 'wx-f is-on'; setTimeout(function () { flashEl.className = 'wx-f'; }, 1300); }
      syncStorm();
    }, 9000 + Math.random() * 12000);
  };
