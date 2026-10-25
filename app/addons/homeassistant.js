/* Home Assistant add-on (Settings › Add-ons). How add-ons fit into Shore: addons/AGENTS.md.
   Off by default: nothing here runs until main.js calls start(). Data comes from FrameDevice.homeAssistant
   (HomeAssistant.java in the Android shell), which keeps the server address and token; this file turns
   Home Assistant areas and states into the rooms, cameras and indoor reading Shore shows, and plays
   camera live views over WebRTC with the native side relaying the signalling. ES5 only. */
(function () {
  'use strict';
  var T = window.CleanFrameI18n ? CleanFrameI18n.T : function (s) { return s; };
  /* "Open (door)": a key apart from the verb "Open", shown as "Open" where no translation has it. */
  function TT(key) { var w = T(key); return w === key ? key.replace(/ \(.*\)$/, '') : w; }
  var NATIVE = window.FrameDevice && FrameDevice.homeAssistant || null, src = NATIVE, running = false, listeners = [];
  var latest = null, built = null, overrides = {}, pending = {};
  var DOMAIN_ORDER = ['light', 'switch', 'fan', 'climate', 'media_player', 'lock', 'cover', 'vacuum', 'humidifier', 'alarm_control_panel', 'binary_sensor', 'sensor', 'event'];
  var TOGGLE = ['light', 'switch', 'fan', 'lock'], LIT = ['light', 'switch', 'fan'];
  /* Attributes the native side adds for the light and thermostat controls (HomeAssistant.java). */
  var EXTRA = ['b', 'cm', 'hs', 'k', 'kmin', 'kmax', 'mode', 'tt', 'tlo', 'thi', 'tmin', 'tmax', 'ts', 'hm', 'act'];
  var COLOR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'];

  /* ---------- States into rooms (ported from TvLauncher's HomeSection.kt) ---------- */
  function domainOf(id) { return id.slice(0, id.indexOf('.')); }
  function cap(s) { s = String(s).replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  function num(v) { return String(Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10); }
  function numeric(s) { return /^-?\d+(\.\d+)?$/.test(String(s)); }
  function when(s) { var t = Date.parse(s); return isNaN(t) ? 0 : t; }
  /* English, like every Shore string; main.js translates it. */
  function ago(t) {
    var m = Math.max(0, Math.floor((Date.now() - t) / 60000));
    return m < 1 ? 'Just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' hr ago' : m < 2880 ? 'Yesterday' : Math.floor(m / 1440) + ' days ago';
  }
  var WORDS = { cool: 'Cooling', heat: 'Heating', heat_cool: 'Auto', auto: 'Auto', dry: 'Drying', fan_only: 'Fan', playing: 'Playing', paused: 'Paused', idle: 'Idle', standby: 'Standby',
    open: 'Open (door)', closed: 'Closed', opening: 'Opening', closing: 'Closing', locked: 'Locked', unlocked: 'Unlocked', jammed: 'Jammed', cleaning: 'Cleaning', docked: 'Docked', returning: 'Returning',
    on: 'On (light)', off: 'Off (light)', home: 'Home', away: 'Away', disarmed: 'Disarmed', armed_home: 'Armed home', armed_away: 'Armed away', armed_night: 'Armed night', triggered: 'Triggered' };
  function word(s) { return TT(WORDS[s] || cap(s)); }
  /* The second line of a chip, already in the TV's language. */
  function stateText(e) {
    var s = e.s, d = e.d, c = e.c || '', on = s === 'on', t, n;
    if (s === 'unavailable' || s === 'unknown') return T('Unavailable');
    if (d === 'climate') return typeof e.t === 'number' ? word(s) + ' · ' + num(e.t) + '°' : word(s);
    if (d === 'light' && on && typeof e.b === 'number') return e.b + '%';
    if (d === 'binary_sensor') return TT(/^(motion|occupancy|presence|moving|sound|vibration)$/.test(c) ? (on ? 'Detected' : 'Clear (motion)') : /^(door|window|opening|garage_door)$/.test(c) ? (on ? 'Open (door)' : 'Closed')
      : c === 'connectivity' ? (on ? 'Connected' : 'Offline') : c === 'battery' ? (on ? 'Low' : 'Normal') : (on ? 'On (light)' : 'Off (light)'));
    if (d === 'event' || d === 'sensor' && c === 'timestamp') { t = when(s); return t ? T(ago(t)) : '—'; }
    if (d === 'sensor') {
      if (!numeric(s)) return cap(s);
      n = parseFloat(s);
      return c === 'temperature' ? num(n) + '°' : e.u === '%' ? num(n) + '%' : e.u ? num(n) + ' ' + e.u : num(n);
    }
    return word(s);
  }
  function isActive(e) {
    var s = e.s;
    switch (e.d) {
      case 'light': case 'switch': case 'fan': case 'binary_sensor': return s === 'on';
      case 'media_player': return s === 'playing' || s === 'on';
      case 'climate': return s !== 'off' && s !== 'unavailable';
      case 'lock': return s === 'locked';
      case 'cover': return s === 'open';
      case 'vacuum': return s === 'cleaning';
    }
    return false;
  }
  /* "Living Room Lamp" in the Living Room is "Lamp". */
  function displayName(e, room) {
    var name = String(e.n || e.id), low = room.toLowerCase();
    while (name.length > room.length && name.toLowerCase().indexOf(low) === 0) name = name.slice(room.length).replace(/^[\s:·-]+/, '');
    if (name.toLowerCase() === low) name = e.d === 'climate' ? T('Thermostat') : e.d === 'media_player' ? T('Speaker') : TT(cap(e.d) + ' (device)');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  function climateSensor(e) { return e.d === 'sensor' && (e.c === 'temperature' || e.c === 'humidity'); }
  function entry(id, s) {
    var o = overrides[id] || {}, e = { id: id, d: domainOf(id), s: o.s || String(s.s), n: s.n, u: s.u, c: s.c, t: s.t };
    EXTRA.forEach(function (k) { e[k] = o.hasOwnProperty(k) ? o[k] : s[k]; });
    return e;
  }
  function list(v) { return v instanceof Array ? v.filter(function (x) { return typeof x === 'string'; }) : []; }
  function finite(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
  /* What a long OK on a chip can adjust: brightness and colour on a light, target and mode on a thermostat. */
  function controlOf(e) {
    var cm = list(e.cm), dim, color, temp, modes;
    if (e.s === 'unavailable' || e.s === 'unknown' && e.d !== 'climate') return null;
    if (e.d === 'light') {
      color = cm.some(function (m) { return COLOR_MODES.indexOf(m) >= 0; }); temp = cm.indexOf('color_temp') >= 0;
      dim = color || temp || cm.some(function (m) { return m !== 'onoff'; });
      if (!dim) return null;
      return { kind: 'light', on: e.s === 'on', b: finite(e.b), color: color, temp: temp, hs: e.hs instanceof Array && e.hs.length === 2 ? [+e.hs[0] || 0, +e.hs[1] || 0] : null,
        k: finite(e.k), kmin: finite(e.kmin) || 2000, kmax: finite(e.kmax) || 6500, mode: typeof e.mode === 'string' ? e.mode : '' };
    }
    if (e.d === 'climate') {
      modes = list(e.hm);
      if (!modes.length && finite(e.tt) === null) return null;
      var max = finite(e.tmax), f = max !== null && max > 45;
      return { kind: 'climate', mode: e.s, modes: modes, target: finite(e.tt), lo: finite(e.tlo), hi: finite(e.thi), now: finite(e.t), action: typeof e.act === 'string' ? e.act : '',
        min: finite(e.tmin) !== null ? e.tmin : f ? 45 : 7, max: max !== null ? max : f ? 95 : 35, step: finite(e.ts) || (f ? 1 : 0.5) };
    }
    return null;
  }
  function info() {
    if (!latest) latest = src ? src.info() : { configured: false, enabled: false, status: 'off', error: '', at: 0, areas: [], selected: [], states: {} };
    return latest;
  }
  /* {status, error, configured, at, areas: [names], selected, rooms: [{name, on, items: [{id, name, room, state, active, toggle, off, lit, control}]}],
     cameras: [{id, name, room, activity}], indoor: {temp, tunit, humidity}, unavailable: [full names]} */
  function model() {
    if (built) return built;
    var i = info(), chosen = i.selected, rooms = [], cameras = [], indoor = null, gone = [];
    i.areas.forEach(function (a) {
      if (chosen.length && chosen.indexOf(a.name) < 0) return;
      var ents = a.ids.filter(function (id) { return typeof id === 'string' && id.indexOf('.') > 0 && i.states[id]; }).map(function (id) { return entry(id, i.states[id]); });
      var activity = 0, temp, hum, items;
      ents.forEach(function (e) { if (e.d === 'event') activity = Math.max(activity, when(e.s)); });
      ents.forEach(function (e) { var n = displayName(e, a.name); if (e.d === 'camera') cameras.push({ id: e.id, name: n === TT('Camera (device)') ? a.name : n, room: a.name, activity: activity, off: e.s === 'unavailable' }); });
      ents.forEach(function (e) { if (e.s === 'unavailable' && !climateSensor(e) && e.d !== 'event') gone.push(String(e.n || e.id)); });
      // The first room with a reading supplies both, so temperature and humidity come from the same place.
      if (!indoor) {
        ents.forEach(function (e) { if (climateSensor(e) && numeric(e.s)) { if (e.c === 'temperature' && !temp) temp = e; if (e.c === 'humidity' && !hum) hum = e; } });
        if (temp || hum) indoor = { temp: temp ? parseFloat(temp.s) : null, tunit: temp && /F/.test(temp.u || '') ? 'f' : 'c', humidity: hum ? parseFloat(hum.s) : null, room: a.name };
      }
      items = ents.filter(function (e) { return e.d !== 'camera' && !climateSensor(e); }).sort(function (x, y) {
        var p = DOMAIN_ORDER.indexOf(x.d), q = DOMAIN_ORDER.indexOf(y.d);
        p = p < 0 ? 99 : p; q = q < 0 ? 99 : q;
        return p - q || String(x.n).toLowerCase().localeCompare(String(y.n).toLowerCase());
      }).map(function (e) {
        return { id: e.id, name: displayName(e, a.name), room: a.name, state: stateText(e), active: isActive(e), toggle: TOGGLE.indexOf(e.d) >= 0 && e.s !== 'unavailable', off: e.s === 'unavailable', lit: LIT.indexOf(e.d) >= 0 && e.s === 'on', control: controlOf(e) };
      });
      if (items.length) rooms.push({ name: a.name, on: items.filter(function (x) { return x.lit; }).length, items: items });
    });
    built = { status: i.status, error: i.error, configured: i.configured, url: i.url, at: i.at, areas: i.areas.map(function (a) { return a.name; }), selected: chosen.slice(), rooms: rooms, cameras: cameras, indoor: indoor, unavailable: gone };
    return built;
  }
  /* Drops changes still waiting to be sent. */
  function flushless() { Object.keys(pending).forEach(function (k) { clearTimeout(pending[k].timer); }); pending = {}; }
  function changed() {
    var before = latest && latest.at;
    latest = null; built = null;
    if (info().at !== before) Object.keys(overrides).forEach(function (id) { if (!(overrides[id].until > Date.now())) delete overrides[id]; }); // fresh states replace the guesses made on OK
    listeners.forEach(function (fn) { try { fn(); } catch (e) { } });
  }
  if (NATIVE) NATIVE.onChange(changed);

  /* ---------- Cameras: WebRTC like Home Assistant's own player (ported from TvLauncher's camera.html) ----------
     The camera's session lasts as long as the signalling socket. Ring and similar doorbells light their ring
     for every session, so stills are rationed: one short session when a card is focused and its still is over
     a minute old, and every 10 seconds while the live view is open. */
  var STILL_AGE = 60000, STILL_KEY = 'shore.ha.stills', MAX_STILLS = 8;
  var stills = null, cam = null, camVideo = null;
  function loadStills() {
    if (stills) return stills;
    try { stills = JSON.parse(localStorage.getItem(STILL_KEY)) || {}; } catch (e) { stills = {}; }
    if (typeof stills !== 'object' || stills instanceof Array) stills = {};
    return stills;
  }
  function keepStill(id, dataUrl) {
    var all = loadStills(), ids;
    all[id] = { src: dataUrl, at: Date.now() };
    ids = Object.keys(all).sort(function (a, b) { return all[b].at - all[a].at; });
    ids.slice(MAX_STILLS).forEach(function (k) { delete all[k]; });
    try { localStorage.setItem(STILL_KEY, JSON.stringify(all)); } catch (e) { }
    listeners.forEach(function (fn) { try { fn(); } catch (e) { } });
  }
  function still(id) { var s = loadStills()[id]; return s && /^data:image\/jpeg;base64,/.test(s.src) ? s : null; }
  function grab(video) {
    var w = video.videoWidth, h = video.videoHeight, c;
    if (!w || !h) return '';
    c = document.createElement('canvas'); c.width = 640; c.height = Math.round(640 * h / w);
    try { c.getContext('2d').drawImage(video, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.8); } catch (e) { return ''; }
  }
  function hangup() {
    var c = cam;
    if (!c) return;
    cam = null;
    clearTimeout(c.timer); clearTimeout(c.firstTimer); clearInterval(c.every);
    if (c.session && src) src.camera.hangup(c.session);
    try { if (c.pc) c.pc.close(); } catch (e) { }
    if (c.video) { c.video.onplaying = null; try { c.video.pause(); } catch (e) { } c.video.srcObject = null; }
    if (c.mode === 'snapshot' && camVideo && camVideo.parentNode) camVideo.parentNode.removeChild(camVideo);
  }
  function camState(c, state, message) { if (cam === c && c.onState) c.onState(state, message || ''); }
  function negotiate(c, config) {
    var pc, stream;
    if (!window.RTCPeerConnection) { camState(c, 'error', 'webrtc'); return; }
    try { pc = c.pc = new RTCPeerConnection(config.configuration || {}); } catch (e) { camState(c, 'error', 'webrtc'); return; }
    if (config.dataChannel) try { pc.createDataChannel(config.dataChannel); } catch (e) { }
    pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.addTransceiver('video', { direction: 'recvonly' });
    stream = new MediaStream();
    pc.ontrack = function (ev) {
      stream.addTrack(ev.track);
      c.video.srcObject = stream;
      var p = c.video.play(); if (p && p.catch) p.catch(function () { });
    };
    pc.onconnectionstatechange = function () { if (pc.connectionState === 'failed') camState(c, 'error', 'stream'); };
    pc.createOffer().then(function (offer) { return pc.setLocalDescription(offer); }).then(function () {
      // Non-trickle: the offer carries the gathered candidates, so none need relaying from here.
      return new Promise(function (done) {
        if (pc.iceGatheringState === 'complete') { done(); return; }
        var t = setTimeout(done, 3000);
        pc.onicegatheringstatechange = function () { if (pc.iceGatheringState === 'complete') { clearTimeout(t); done(); } };
      });
    }).then(function () { if (cam === c) src.camera.offer(c.session, pc.localDescription.sdp); })
      .catch(function () { camState(c, 'error', 'webrtc'); });
  }
  function camEvent(ev) {
    var c = cam;
    if (!c || ev.session !== c.session) return;
    if (ev.type === 'config') negotiate(c, ev.config || {});
    else if (ev.type === 'answer' && c.pc) c.pc.setRemoteDescription({ type: 'answer', sdp: String(ev.answer || '') }).catch(function () { camState(c, 'error', 'stream'); });
    else if (ev.type === 'candidate' && c.pc && ev.candidate) c.pc.addIceCandidate(ev.candidate).catch(function () { });
    else if (ev.type === 'error' || ev.type === 'closed') { camState(c, 'error', ev.message || ev.type); if (c.mode === 'snapshot') hangup(); }
  }
  if (NATIVE) NATIVE.camera.onEvent(camEvent);
  /* mode live: plays in the given video; mode snapshot: a hidden video, one still, then hang up. onState(live|error, message). */
  function play(id, mode, video, onState) {
    var c, s;
    hangup();
    if (!running || !src || !/^camera\./.test(id)) { if (onState) onState('error', 'unavailable'); return false; }
    if (mode === 'snapshot') {
      if (!camVideo) { camVideo = document.createElement('video'); camVideo.muted = true; camVideo.setAttribute('playsinline', ''); camVideo.setAttribute('aria-hidden', 'true'); camVideo.className = 'ha-snap-video'; }
      document.body.appendChild(camVideo); video = camVideo;
    }
    video.muted = true; video.setAttribute('playsinline', '');
    c = cam = { id: id, mode: mode, video: video, onState: onState, session: 0, pc: null, timer: 0, firstTimer: 0, every: 0 };
    video.onplaying = function () {
      video.onplaying = null; clearTimeout(c.timer);
      camState(c, 'live');
      // The first frames are often still adjusting exposure.
      c.firstTimer = setTimeout(function () {
        var shot = cam === c ? grab(video) : '';
        if (shot) keepStill(id, shot);
        if (c.mode === 'snapshot') hangup();
        else c.every = setInterval(function () { var s2 = cam === c ? grab(video) : ''; if (s2) keepStill(id, s2); }, 10000);
      }, 2000);
    };
    s = src.camera.start(id);
    if (!s) { cam = null; if (onState) onState('error', 'unavailable'); return false; }
    c.session = s;
    c.timer = setTimeout(function () { camState(c, 'error', 'timeout'); if (c.mode === 'snapshot') hangup(); }, mode === 'snapshot' ? 20000 : 15000);
    return true;
  }

  /* ---------- Browser checks: the same model and actions with made-up Home Assistant data ---------- */
  function mock(fake) {
    var data = JSON.parse(JSON.stringify(fake)), calls = window.__haCalls = [];
    function later() { setTimeout(function () { data.at = Date.now(); changed(); }, 0); }
    return {
      info: function () { return { configured: data.configured !== false, enabled: running, url: data.url || 'http://homeassistant.local:8123', status: running ? (data.status || 'ok') : 'off', error: data.error || '', at: data.at || 1, areas: data.areas || [], selected: data.selected || [], states: data.states || {} }; },
      enable: function (on) { calls.push(['enable', on]); later(); },
      areas: function (names) { calls.push(['areas', names]); data.selected = names.slice(); later(); },
      refresh: function () { calls.push(['refresh']); },
      toggle: function (id) {
        var s = data.states[id];
        calls.push(['toggle', id]);
        if (s) s.s = domainOf(id) === 'lock' ? (s.s === 'locked' ? 'unlocked' : 'locked') : s.s === 'on' ? 'off' : 'on';
        later();
      },
      call: function (id, service, d) {
        var s = data.states[id];
        calls.push(['call', id, service, d]);
        if (!s) return;
        if (service === 'turn_on') { s.s = 'on'; if (d.brightness_pct) s.b = d.brightness_pct; if (d.hs_color) { s.hs = d.hs_color; s.mode = 'hs'; } if (d.color_temp_kelvin) { s.k = d.color_temp_kelvin; s.mode = 'color_temp'; } }
        if (service === 'set_temperature') s.tt = d.temperature;
        if (service === 'set_hvac_mode') s.s = d.hvac_mode;
        later();
      },
      forget: function () { calls.push(['forget']); data.configured = false; later(); },
      camera: { start: function (id) { calls.push(['camera', id]); return 0; }, offer: function () { }, hangup: function () { } }
    };
  }

  window.CleanFrameHA = {
    available: function () { return !!src; },
    running: function () { return running; },
    /* Called by main.js when the add-on is switched on (also at start, after Home has painted) and off. */
    start: function () { if (!src || running) return; running = true; src.enable(true); changed(); },
    /* force: tell the native side even when nothing runs here, so its saved switch matches Shore's after a restore. */
    stop: function (force) { if (!src || !running && !force) return; hangup(); running = false; src.enable(false); overrides = {}; flushless(); changed(); },
    refresh: function () { if (running && src) src.refresh(); },
    model: model,
    /* "5 min ago" (English, for main.js to translate). */
    ago: ago,
    /* Flips the chip at once; Home Assistant's answer replaces the guess within a second. */
    toggle: function (id) {
      var i = info(), s = i.states[id], d = domainOf(id);
      if (!running || !s || TOGGLE.indexOf(d) < 0 || s.s === 'unavailable') return false;
      (overrides[id] || (overrides[id] = {})).s = d === 'lock' ? (entry(id, s).s === 'locked' ? 'unlocked' : 'locked') : entry(id, s).s === 'on' ? 'off' : 'on';
      built = null; src.toggle(id);
      return true;
    },
    /* Brightness, colour, target or mode: shown at once, sent once the remote rests (a held Right sends one change).
       service: turn_on (light) with {brightness_pct | hs_color | color_temp_kelvin}, set_temperature, set_hvac_mode;
       guess: the state fields to show meanwhile ({s, b, hs, k, mode, tt}). */
    set: function (id, service, data, guess) {
      var i = info(), s = i.states[id], key = id + '|' + service, p, o;
      if (!running || !s || !src || !src.call || !controlOf(entry(id, s))) return false;
      o = overrides[id] || (overrides[id] = {});
      Object.keys(guess || {}).forEach(function (k) { o[k] = guess[k]; });
      o.until = Infinity; built = null;
      p = pending[key] || (pending[key] = { data: {} });
      // A colour replaces a white and the other way round; brightness stays alongside.
      if (data.hs_color || data.color_temp_kelvin) { delete p.data.hs_color; delete p.data.color_temp_kelvin; }
      Object.keys(data).forEach(function (k) { p.data[k] = data[k]; });
      clearTimeout(p.timer);
      p.timer = setTimeout(function () {
        delete pending[key];
        if (overrides[id]) overrides[id].until = Date.now() + 2500;
        if (running && src && src.call) src.call(id, service, p.data);
      }, 350);
      return true;
    },
    setAreas: function (names) { if (src) { src.areas(names); built = null; } },
    forget: function () { if (src) src.forget(); },
    onChange: function (fn) { listeners.push(fn); },
    camera: {
      still: still,
      live: function (id, video, onState) { return play(id, 'live', video, onState); },
      /* A fresh still for a focused card, at most once a minute per camera and never during a live view. */
      snapshot: function (id) { var s = still(id); if (cam || s && Date.now() - s.at < STILL_AGE) return false; return play(id, 'snapshot', null, null); },
      hangup: hangup,
      active: function () { return cam ? cam.id : ''; }
    },
    /* Browser checks only: replaces the Android data source with made-up areas and states. */
    qa: function (fake) { hangup(); running = false; src = fake ? mock(fake) : NATIVE; latest = null; built = null; overrides = {}; flushless(); changed(); }
  };
}());
