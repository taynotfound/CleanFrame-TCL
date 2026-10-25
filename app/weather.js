/* Weather for the clock, from Open-Meteo (free, no key). Off until the user turns it on in Settings › Clock.
   The place is the one typed on the phone upload page, otherwise the city of the TV's time zone
   (Europe/Berlin -> Berlin). Results are cached for 30 minutes; nothing else leaves the TV.
   The temperature is kept in °C and shown in the unit chosen in Settings › Clock. */
(function (root) {
  'use strict';
  var KEY = 'cleanframe.weather.v2', MAX_AGE = 30 * 60000, RETRY = 10 * 60000;
  var state = { temp: null, code: -1, day: 1, days: null, at: 0, place: '', tried: 0, busy: false }, listeners = [];
  /* WMO weather codes, grouped. */
  function label(code) {
    if (code === 0) return 'Clear';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return '';
  }
  /* Icon name for the same groups; clear and partly cloudy have night versions. */
  function iconName(code, day) {
    if (code === 0) return day ? 'sun' : 'moon';
    if (code <= 2) return day ? 'partly' : 'partly-night';
    if (code === 3) return 'cloud';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return '';
  }
  /* Default unit before the user picks one: °F only for US-style English. */
  function fahrenheit() {
    var nav = root.navigator || {}, tag = String((nav.languages && nav.languages[0]) || nav.language || '');
    return /^en-(US|LR|MM)$/i.test(tag);
  }
  function zoneCity() {
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
    var city = zone.split('/').pop();
    return /^[A-Za-z_-]+$/.test(city) && zone.indexOf('/') > 0 && !/^(UTC|GMT|Etc)/.test(zone) ? city.replace(/_/g, ' ') : '';
  }
  function place() {
    var device = root.FrameDevice, typed = device && device.phone ? device.phone.info().place : '';
    return typed || zoneCity();
  }
  function get(url, done) {
    var x;
    try { x = new XMLHttpRequest(); } catch (e) { done(null); return; }
    x.open('GET', url, true);
    x.timeout = 15000;
    x.onload = function () { var data = null; try { if (x.status === 200) data = JSON.parse(x.responseText); } catch (e) { } done(data); };
    x.onerror = x.ontimeout = function () { done(null); };
    try { x.send(); } catch (e) { done(null); }
  }
  /* Spellings to try: as typed, then without what follows a comma ("Dammam, Saudi Arabia" -> "Dammam") and
     without a trailing country word ("Dammam KSA"), then the time zone's city. */
  function names(typed) {
    var out = [], add = function (n) { n = String(n || '').replace(/\s+/g, ' ').trim(); if (n && out.indexOf(n) < 0) out.push(n); };
    add(typed); add(typed.split(',')[0]); add(typed.split(',')[0].replace(/\s+\S+$/, '')); add(zoneCity());
    return out;
  }
  /* The first place found; names in other scripts (الدمام) are looked up in their own language. */
  function geocode(list, done) {
    if (!list.length) { done(null); return; }
    var n = list[0], own = String((root.navigator && root.navigator.language) || 'en').split('-')[0];
    var lang = /[\u0600-\u06ff]/.test(n) ? 'ar' : /[\u0400-\u04ff]/.test(n) ? (own === 'uk' ? 'uk' : 'ru') : /[^\u0000-\u024f]/.test(n) ? own : '';
    lang = lang ? '&language=' + encodeURIComponent(lang) : '';
    get('https://geocoding-api.open-meteo.com/v1/search?count=1&format=json' + lang + '&name=' + encodeURIComponent(n), function (geo) {
      var hit = geo && geo.results && geo.results[0];
      if (hit && typeof hit.latitude === 'number') done(hit); else geocode(list.slice(1), done);
    });
  }
  function load() {
    try { var saved = JSON.parse(root.localStorage.getItem(KEY)); if (saved && typeof saved.temp === 'number') { state.temp = saved.temp; state.code = +saved.code; state.at = +saved.at || 0; state.place = String(saved.place || ''); state.day = saved.day === 0 ? 0 : 1; state.days = Array.isArray(saved.days) ? saved.days : null; } } catch (e) { }
  }
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify({ temp: state.temp, code: state.code, day: state.day, days: state.days, at: state.at, place: state.place })); } catch (e) { } }
  function changed() { listeners.forEach(function (fn) { try { fn(); } catch (e) { } }); }
  function refresh(force) {
    var name = place(), now = Date.now();
    if (!name) return;
    if (name !== state.place) { state.temp = null; state.at = 0; state.tried = 0; state.place = name; }
    if (state.busy || !force && (now - state.at < MAX_AGE && state.days || now - state.tried < RETRY)) return; // older caches have no forecast yet
    state.busy = true; state.tried = now;
    geocode(names(name), function (hit) {
      if (!hit) { state.busy = false; return; }
      get('https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto&latitude=' + hit.latitude + '&longitude=' + hit.longitude, function (data) {
        state.busy = false;
        var c = data && data.current, d = data && data.daily, i;
        if (!c || typeof c.temperature_2m !== 'number') return;
        state.temp = c.temperature_2m; state.code = +c.weather_code; state.day = c.is_day === 0 ? 0 : 1;
        state.days = [];
        for (i = 0; d && d.time && i < d.time.length && i < 3; i++) if (typeof d.temperature_2m_max[i] === 'number') state.days.push({ date: String(d.time[i]), code: +d.weather_code[i], hi: d.temperature_2m_max[i], lo: d.temperature_2m_min[i] });
        state.at = Date.now();
        save(); changed();
      });
    });
  }
  load();
  root.CleanFrameWeather = {
    /* Current line such as "12 °C Cloudy" (unit 'c' or 'f'), or '' when unknown or older than three hours. */
    text: function (unit) {
      if (state.temp === null || Date.now() - state.at > 3 * 3600000) return '';
      var T = root.CleanFrameI18n ? root.CleanFrameI18n.T : function (s) { return s; }, word = label(state.code);
      var value = unit === 'f' ? state.temp * 9 / 5 + 32 : state.temp;
      return Math.round(value) + (unit === 'f' ? ' °F' : ' °C') + (word ? ' ' + T(word) : '');
    },
    /* Icon for the current sky (sun, moon, partly, partly-night, cloud, fog, drizzle, rain, snow, storm), or ''. */
    icon: function () { return state.temp === null || Date.now() - state.at > 3 * 3600000 ? '' : iconName(state.code, state.day); },
    /* Today and the next two days: [{date 'YYYY-MM-DD', icon, label, hi, lo}] in the unit ('c' or 'f'), or [] when unknown or old. */
    days: function (unit) {
      if (!state.days || Date.now() - state.at > 6 * 3600000) return [];
      function u(v) { return Math.round(unit === 'f' ? v * 9 / 5 + 32 : v); }
      return state.days.map(function (d) { return { date: d.date, icon: iconName(d.code, 1), label: label(d.code), hi: u(d.hi), lo: u(d.lo) }; });
    },
    defaultUnit: function () { return fahrenheit() ? 'f' : 'c'; },
    refresh: refresh,
    onChange: function (fn) { listeners.push(fn); }
  };
})(this);
