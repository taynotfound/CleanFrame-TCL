/* Widgets add-on (addons/AGENTS.md): small cards under the clock, from what Clock, Weather and Add-ons already
   show: the forecast, upcoming events and Home Assistant. Fetched only when Widgets is switched on, with
   widgets.css, and run inside main.js's scope: the functions assigned here replace main.js's stubs. */
  function widgetsOn() { return S.c.cwidget === 'on' && !isShelf(); }
  function widgetDays() { return !widgetsOn() || S.c.cweather !== 'on' ? [] : QA.days || (WEATHER && WEATHER.days ? WEATHER.days(S.c.wunit) : []); }
  widgetEvents = function () { return !widgetsOn() || S.c.ccal !== 'on' ? [] : QA.events || (CALENDAR && CALENDAR.upcoming ? CALENDAR.upcoming() : []); };
  /* Inside reading, lights on and open doors and windows, from the rooms shown in Smart home. */
  widgetHome = function () {
    var m = widgetsOn() && haShown() ? HA.model() : null, out = [], lit = 0, inside;
    if (!m) return out;
    inside = haInside(); if (inside) out.push(['w-thermo', inside]);
    m.rooms.forEach(function (r) { lit += r.on; });
    if (lit) out.push(['w-bulb', lit === 1 ? '1 light on' : lit + ' lights on']);
    (m.open || []).slice(0, 2).forEach(function (n) { out.push(['w-door', n]); });
    return out.slice(0, 3);
  };
  function widgetDay(date, i) {
    var d = new Date(date + 'T12:00:00');
    if (i === 0) return T('Today');
    return localeText('wds.' + d.getDay(), function () { try { return d.toLocaleDateString(undefined, { weekday: 'short' }); } catch (x) { return ''; } });
  }
  widgetsHtml = function () {
    var days = widgetDays(), evs = widgetEvents(), home = widgetHome(), html = '';
    if (days.length) html += '<span class="wg wg-forecast">' + days.map(function (d, i) {
      return '<span class="wg-day"><span class="wg-dname">' + escRaw(widgetDay(d.date, i)) + '</span>' + (SVG['w-' + d.icon] ? icon('w-' + d.icon, 'wx') : '') + '<span class="wg-temp">' + d.hi + '°<i>' + d.lo + '°</i></span></span>';
    }).join('') + '</span>';
    if (evs.length) html += '<span class="wg wg-cal">' + evs.slice(0, 3).map(function (e) { return '<span class="wg-row"><b>' + escRaw(eventWhen(e)) + '</b><span class="wg-t">' + escRaw(e.title) + '</span></span>'; }).join('') + '</span>';
    if (home.length) html += '<span class="wg wg-home">' + home.map(function (r) { return '<span class="wg-row">' + (SVG[r[0]] ? icon(r[0], 'wx') : '') + '<span class="wg-t">' + esc(r[1]) + '</span></span>'; }).join('') + '</span>';
    return html ? '<span class="cap-widgets">' + html + '</span>' : '';
  };
