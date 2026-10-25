/* Home Assistant add-on: Shore's side (addons/AGENTS.md). Fetched only when the add-on is switched on, after
   addons/homeassistant.js, and run inside main.js's scope: the functions assigned here replace main.js's stubs.
   Everything else stays local to this file. Not a standalone script. */
  /* ---------- Home Assistant add-on: a Smart home control on Home opens rooms and cameras (addons/homeassistant.js) ---------- */
  haShown = function () { return !!(HA && S.c.aha === 'on' && HA.running() && HA.model().configured); };
  haStatus = function () {
    var m = HA.model();
    if (S.c.aha !== 'on') return 'Off';
    if (!m.configured || m.status === 'setup') return 'Set up on your phone';
    if (m.status === 'error') return m.error === 'auth' ? 'Home Assistant refused the token' : m.error === 'network' ? 'Couldn’t reach Home Assistant' : 'Home Assistant didn’t answer as expected';
    if (m.status !== 'ok') return 'Connecting…';
    return m.rooms.length === 1 ? '1 room' : m.rooms.length + ' rooms';
  };
  /* "Inside 21° · 48%" under the clock, in the weather's unit. */
  haInside = function () {
    var m = haShown() ? HA.model() : null, ind = m && m.indoor, t, parts = [];
    if (!ind) return '';
    if (ind.temp !== null) { t = ind.temp; if (ind.tunit !== S.c.wunit) t = ind.tunit === 'f' ? (t - 32) * 5 / 9 : t * 9 / 5 + 32; parts.push(Math.round(t) + '°'); }
    if (ind.humidity !== null) parts.push(Math.round(ind.humidity) + '%');
    return 'Inside ' + parts.join(' · ');
  };
  openHaSettings = function () { if (PHONE) S.phone = PHONE.info(); HA.refresh(); S.detailFocus.ha = 'ha.refresh'; openAppearance('ha'); }; // always on Connection, never back on Disconnect
  haSections = function () {
    var m = HA.model(), out = [{ id: 'hastatus', title: '', items: [{ action: 'ha.refresh', label: 'Connection', description: haStatus(), pair: true }],
      reason: m.configured && m.url ? m.url.replace(/^https?:\/\//, '') : '' }];
    if (!m.configured) out.push(PHONE && S.phone.enabled
      ? { id: 'haphone', title: '', items: [], qr: (PHONE.qr ? PHONE.qr() : S.phone.qr) || ' ', url: S.phone.url,
        qrNote: S.phone.url ? 'In Shore Companion, open Home Assistant and enter your server’s address and a long-lived access token.' : 'Connect the TV to your Wi-Fi to use the companion.' }
      : { id: 'haphone', title: '', items: PHONE ? [{ action: 'health.phone', label: 'Phone companion', description: 'Turn it on to connect Home Assistant', pair: true }] : [],
        reason: 'Home Assistant is set up from the phone companion, so the token never needs typing on the TV.' });
    if (m.configured && m.areas.length) out.push({ id: 'harooms', title: 'Rooms', items: m.areas.map(function (name, i) {
      return { action: 'ha.area.' + i, label: name, tick: true, applied: !m.selected.length || m.selected.indexOf(name) >= 0 };
    }), reason: 'Rooms are Home Assistant’s areas. Devices hidden there stay hidden here.' });
    if (m.configured && HA.canDoorbell()) {
      var bell = HA.doorbell(), bellName = bellLabel(HA.doorbells(), bell.entity), camName = bellLabel(HA.cameraList(), bell.camera);
      out.push({ id: 'hadoorbell', title: 'Doorbell', items: [{ action: 'open.hadoor', label: 'Doorbell', description: bell.entity ? bellName : 'Off', pair: true },
        { action: 'open.hadoorcam', label: 'Camera to show', description: bell.camera ? camName : 'None', pair: true, disabled: !bell.entity }],
        reason: bell.entity ? 'When it rings, Shore shows the camera. Over another app, a short note appears instead.' : 'Pick what rings, and Shore shows your door camera when someone’s there.' });
    }
    if (m.configured) out.push({ id: 'haforget', title: '', items: [{ action: 'ha.forget', label: 'Disconnect Home Assistant' }] });
    return out;
  };
  function bellLabel(list, id) { var hit = list.filter(function (x) { return x.id === id; })[0]; return hit ? hit.name : id; }
  doorSections = function (t) {
    var bell = HA.doorbell(), list = t.group === 'hadoor' ? HA.doorbells() : HA.cameraList(), cur = t.group === 'hadoor' ? bell.entity : bell.camera;
    return [{ id: t.group, title: '', items: [{ action: t.group + '.none', label: t.group === 'hadoor' ? 'Off' : 'None', tick: true, applied: !cur }]
      .concat(list.slice(0, 40).map(function (x, i) { return { action: t.group + '.' + i, label: x.name, description: x.id, tick: true, applied: cur === x.id }; })),
      reason: t.group === 'hadoor' ? (list.length ? 'Doorbells from Ring, Nest, Reolink and others appear as events in Home Assistant.' : 'Nothing that rings was found in the rooms you show.') : '' }];
  };
  setDoor = function (t, i) {
    var bell = HA.doorbell(), list = t.group === 'hadoor' ? HA.doorbells() : HA.cameraList(), pick = i < 0 ? '' : list[i] ? list[i].id : null;
    if (pick === null) return;
    if (t.group === 'hadoor') HA.setDoorbell(pick, pick ? bell.camera : '');
    else HA.setDoorbell(bell.entity, pick);
    render();
  };
  /* A ring while Shore is in front: the door camera (live), over whatever is on screen, or a note without one. */
  function doorbellRang(e) {
    var t, camName;
    if (!HA || !HA.running()) return;
    if (S.saver) stopSaver();
    while (top().id === 'hacam' || top().doorbell) pop();
    if (e.camera) { camName = bellLabel(HA.cameraList(), e.camera); openHaCam({ id: e.camera, name: camName }); top().doorbell = true; }
    else push({ id: 'message', doorbell: true, content: { title: 'Someone’s at the door', line: e.name || '', note: '', actions: [['stay', 'OK']] }, f: { b: 0 } });
    t = top();
    setTimeout(function () { if (top() === t) { if (t.id === 'hacam') closeHaCam(); else pop(); render(); } }, 120000); // closes itself after two minutes
    render();
  }
  if (HA && HA.onDoorbell) HA.onDoorbell(doorbellRang);
  /* OK on a room shows or hides it; every room shown is stored as "all", so new rooms appear by themselves. */
  haArea = function (i) {
    var m = HA.model(), name = m.areas[i], list = m.selected.length ? m.selected.slice() : m.areas.slice(), at;
    if (name === undefined) return;
    at = list.indexOf(name);
    if (at >= 0) { if (list.length === 1) return; list.splice(at, 1); } else list.push(name);
    HA.setAreas(list.length === m.areas.length ? [] : list);
  };
  /* The panel: rooms in rows of chips on the left, cameras in a column on the right. Positions are fixed on the
     1920 x 1080 stage, so chips and cards slide with transforms only. Rooms with a line or less of devices share a
     row, side by side on the chip grid, while they fit; a bigger room takes whole rows. Each chip keeps its column
     (slot), so Up and Down go to the nearest chip above or below. */
  var HA_HEAD = 64, HA_LINE = 128, HA_GAP = 28, HA_PITCH = 284, HA_VIEW = 720, HA_CAM = 376, HA_CAM_VIEW = 720;
  function haLayout() {
    var m = HA.model(), per = m.cameras.length ? 4 : 6, lines = [], heads = [], y = 0, open = null;
    function close() { if (open) { y += HA_HEAD + HA_LINE + HA_GAP; open = null; } }
    m.rooms.forEach(function (room) {
      var n = room.items.length, i, j, line;
      if (n <= per) {
        if (open && open.used + n > per) close();
        if (!open) { open = { used: 0, line: { first: true, y: y + HA_HEAD, items: [], slots: [], rooms: [] } }; lines.push(open.line); }
        heads.push({ key: 'room:' + room.name, room: room, y: y, slot: open.used, width: n, lines: 1 });
        for (j = 0; j < n; j++) { open.line.items.push(room.items[j]); open.line.slots.push(open.used + j); open.line.rooms.push(heads.length - 1); }
        open.used += n;
        return;
      }
      close();
      heads.push({ key: 'room:' + room.name, room: room, y: y, slot: 0, width: per, lines: Math.ceil(n / per) }); y += HA_HEAD;
      for (i = 0; i < n; i += per) {
        line = { first: i === 0, y: y, items: room.items.slice(i, i + per), slots: [], rooms: [] };
        for (j = 0; j < line.items.length; j++) { line.slots.push(j); line.rooms.push(heads.length - 1); }
        lines.push(line); y += HA_LINE;
      }
      y += HA_GAP;
    });
    close();
    return { m: m, lines: lines, heads: heads, height: Math.max(0, y - HA_GAP) };
  }
  /* The chip in a line nearest to a column. */
  function haNearest(line, slot) {
    var best = 0;
    line.slots.forEach(function (s, i) { if (Math.abs(s - slot) < Math.abs(line.slots[best] - slot)) best = i; });
    return best;
  }
  openHa = function () { HA.refresh(); S.note = null; push({ id: 'ha', top: 0, ctop: 0, f: { zone: 'rooms', l: 0, i: 0, c: 0 } }); };
  function haItem(t, L) { var line = L.lines[t.f.l]; return t.f.zone === 'rooms' && line ? line.items[t.f.i] || null : null; }
  function haToggle(item) {
    if (!item) return;
    if (!item.toggle && item.control) { openHaControl(item); return; }
    if (!item.toggle) { S.note = item.off ? 'Unavailable' : 'Shore switches lights, switches, fans and locks.'; return; }
    S.note = null; HA.toggle(item.id);
  }
  function openHaCam(cam) { if (!cam) return; HA.camera.hangup(); push({ id: 'hacam', cam: cam, state: 'connecting', msg: '', f: { b: 0 } }); }
  function closeHaCam() { HA.camera.hangup(); pop(); }
  V.ha = {
    sheet: true,
    norm: function (t) {
      var L = haLayout(), f = t.f, cams = L.m.cameras.length;
      if (f.zone === 'rooms' && !L.lines.length) f.zone = cams ? 'cams' : 'head';
      if (f.zone === 'cams' && !cams) f.zone = L.lines.length ? 'rooms' : 'head';
      f.l = clamp(f.l, 0, Math.max(0, L.lines.length - 1));
      f.i = clamp(f.i, 0, L.lines.length ? L.lines[f.l].items.length - 1 : 0);
      f.c = clamp(f.c, 0, Math.max(0, cams - 1));
    },
    key: function (t, k) {
      var L = haLayout(), f = t.f, cams = L.m.cameras, line = L.lines[f.l], best;
      if (k === 'back') { pop(); return; }
      if (k !== 'ok') S.note = null;
      if (f.zone === 'head') {
        if (k === 'down') f.zone = L.lines.length ? 'rooms' : cams.length ? 'cams' : 'head';
        else if (k === 'ok') openHaSettings();
        return;
      }
      if (f.zone === 'cams') {
        if (k === 'up') { if (f.c > 0) f.c--; else f.zone = 'head'; }
        else if (k === 'down' && f.c < cams.length - 1) f.c++;
        else if (k === 'left' && L.lines.length) {
          // Back to the line level with the card, at its last chip.
          best = 0; L.lines.forEach(function (ln, i) { if (Math.abs(ln.y - t.top - (f.c * HA_CAM - t.ctop)) < Math.abs(L.lines[best].y - t.top - (f.c * HA_CAM - t.ctop))) best = i; });
          f.zone = 'rooms'; f.l = best; f.i = L.lines[best].items.length - 1;
        } else if (k === 'ok') { openHaCam(cams[f.c]); return; }
        if (f.zone === 'cams' && cams[f.c]) HA.camera.snapshot(cams[f.c].id);
        return;
      }
      if (k === 'left' && f.i > 0) f.i--;
      else if (k === 'right') { if (f.i < line.items.length - 1) f.i++; else if (cams.length) { f.zone = 'cams'; HA.camera.snapshot(cams[f.c].id); } }
      else if (k === 'up') { if (f.l > 0) { f.l--; f.i = haNearest(L.lines[f.l], line.slots[f.i]); } else f.zone = 'head'; }
      else if (k === 'down' && f.l < L.lines.length - 1) { f.l++; f.i = haNearest(L.lines[f.l], line.slots[f.i]); }
      else if (k === 'ok') haToggle(line.items[f.i]);
    },
    point: function (t, z, i, id) {
      var L = haLayout();
      if (z === 'head') { t.f.zone = 'head'; this.key(t, 'ok'); }
      else if (z === 'hacam') { t.f.zone = 'cams'; t.f.c = i; this.key(t, 'ok'); }
      else if (z === 'hachip') L.lines.forEach(function (ln, l) { ln.items.forEach(function (item, n) { if (item.id === id) { t.f.zone = 'rooms'; t.f.l = l; t.f.i = n; haToggle(item); } }); });
    }
  };
  V.hacam = {
    sheet: true,
    key: function (t, k) { if (k === 'back' || k === 'ok') closeHaCam(); },
    point: function (t, z) { if (z === 'hacam-close') closeHaCam(); }
  };
  /* ---------- Smart home controls: a long OK on a light, or OK on a thermostat ----------
     A sheet of rows: a light's power, brightness and colour; a thermostat's target and mode. Left and Right
     adjust brightness and the target at once (sent when the remote rests); colours and modes apply on OK. */
  var HC_WHITES = [['Warm white', 2700, '#ffbf7a'], ['Soft white', 3500, '#ffd6a8'], ['Daylight', 5000, '#fff0dc'], ['Cool white', 6500, '#e4ecff']];
  var HC_HUES = [['Red', 0], ['Orange', 28], ['Yellow', 50], ['Green', 125], ['Teal', 175], ['Blue', 225], ['Purple', 275], ['Pink', 325]];
  var HC_MODES = { off: 'Off', heat: 'Heat', cool: 'Cool', heat_cool: 'Heat and cool', auto: 'Auto', dry: 'Dry', fan_only: 'Fan only' };
  function TT(key) { var w = T(key); return w === key ? key.replace(/ \(.*\)$/, '') : w; }
  haHeld = function () {
    var t = top(), item;
    if (t.id !== 'ha') return null;
    item = haItem(t, haLayout());
    return item && item.control ? item : null;
  };
  function haFind(id) {
    var found = null;
    if (HA && HA.running()) HA.model().rooms.forEach(function (r) { r.items.forEach(function (it) { if (it.id === id) found = it; }); });
    return found;
  }
  openHaControl = function (item) {
    if (!item || !item.control || top().id !== 'ha') return;
    var t = { id: 'hactl', item: item.id, mode: item.control.kind, f: { zone: '', s: 0, m: 0 } }, c = item.control;
    S.note = null;
    t.f.s = Math.max(0, hcCurrent(c));
    t.f.m = Math.max(0, c.kind === 'climate' ? c.modes.indexOf(c.mode) : 0);
    push(t); norm(); render();
  };
  /* Swatches a light offers: whites within its range, then colours. [label, css, {hs_color|color_temp_kelvin}, guess] */
  function hcSwatches(c) {
    var out = [];
    if (c.temp) HC_WHITES.forEach(function (w) {
      var k = clamp(w[1], c.kmin, c.kmax);
      if (!out.some(function (o) { return o[2].color_temp_kelvin === k; })) out.push([w[0], w[2], { color_temp_kelvin: k }, { mode: 'color_temp', k: k }]);
    });
    if (c.color) HC_HUES.forEach(function (h) { out.push([h[0], 'hsl(' + h[1] + ',92%,60%)', { hs_color: [h[1], 90] }, { mode: 'hs', hs: [h[1], 90] }]); });
    return out;
  }
  /* The swatch nearest to the light's colour now, or -1. */
  function hcCurrent(c) {
    var list = c.kind === 'light' ? hcSwatches(c) : [], best = -1, gap = Infinity;
    list.forEach(function (w, i) {
      var d = w[2].color_temp_kelvin ? (c.mode === 'color_temp' && c.k ? Math.abs(c.k - w[2].color_temp_kelvin) / 40 : Infinity)
        : c.hs && c.hs[1] > 25 && c.mode !== 'color_temp' ? Math.min(Math.abs(c.hs[0] - w[2].hs_color[0]), 360 - Math.abs(c.hs[0] - w[2].hs_color[0])) : Infinity;
      if (d < gap) { gap = d; best = i; }
    });
    return best;
  }
  function hcRows(c) {
    if (c.kind === 'light') return ['power', 'bright'].concat(c.color || c.temp ? ['color'] : []);
    return (c.target !== null || c.lo !== null && c.hi !== null ? ['target'] : []).concat(c.modes.length ? ['modes'] : []);
  }
  function hcStep(item, dir) {
    var c = item.control, v;
    if (c.kind === 'light') {
      v = c.on && c.b !== null ? c.b : 0;
      v = dir > 0 ? Math.min(100, Math.floor(v / 10) * 10 + 10) : Math.max(1, Math.ceil(v / 10) * 10 - 10);
      HA.set(item.id, 'turn_on', { brightness_pct: v }, { s: 'on', b: v });
      return;
    }
    if (c.target === null) { S.note = 'Set the range in Home Assistant'; return; }
    v = clamp(Math.round((c.target + dir * c.step) / c.step) * c.step, c.min, c.max);
    v = Math.round(v * 10) / 10;
    if (v !== c.target) HA.set(item.id, 'set_temperature', { temperature: v }, { tt: v });
  }
  var HC_ACTIONS = { heating: 'Heating', cooling: 'Cooling', drying: 'Drying', fan: 'Fan', preheating: 'Preheating', defrosting: 'Defrosting' };
  function cap(s) { s = String(s).replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  function haDegrees(v) { return v === null ? '–' : String(Math.abs(v) >= 100 || v % 1 === 0 ? Math.round(v) : v.toFixed(1)) + '°'; }
  V.hactl = {
    sheet: true,
    norm: function (t) {
      var item = haFind(t.item), rows;
      if (!item || !item.control || item.control.kind !== t.mode) { t.gone = true; return; }
      rows = hcRows(item.control);
      if (rows.indexOf(t.f.zone) < 0) t.f.zone = rows[0] || '';
      t.f.s = clamp(t.f.s, 0, Math.max(0, hcSwatches(item.control).length - 1));
      t.f.m = clamp(t.f.m, 0, Math.max(0, item.control.modes ? item.control.modes.length - 1 : 0));
    },
    key: function (t, k) {
      var item = haFind(t.item), c = item && item.control, f = t.f, rows, r, sw;
      if (k === 'back' || !c || t.gone) { pop(); return; }
      rows = hcRows(c); r = rows.indexOf(f.zone);
      if (k !== 'ok') S.note = null;
      if (k === 'up') { if (r > 0) f.zone = rows[r - 1]; return; }
      if (k === 'down') { if (r < rows.length - 1) f.zone = rows[r + 1]; return; }
      if (f.zone === 'bright' || f.zone === 'target') { if (k === 'left' || k === 'right') hcStep(item, k === 'right' ? 1 : -1); return; }
      if (f.zone === 'power') { if (k === 'ok') HA.toggle(item.id); return; }
      if (f.zone === 'color') {
        sw = hcSwatches(c);
        if (k === 'left' && f.s > 0) f.s--;
        else if (k === 'right' && f.s < sw.length - 1) f.s++;
        else if (k === 'ok' && sw[f.s]) { sw[f.s][3].s = 'on'; HA.set(item.id, 'turn_on', sw[f.s][2], sw[f.s][3]); }
        return;
      }
      if (f.zone === 'modes') {
        if (k === 'left' && f.m > 0) f.m--;
        else if (k === 'right' && f.m < c.modes.length - 1) f.m++;
        else if (k === 'ok' && c.modes[f.m]) HA.set(item.id, 'set_hvac_mode', { hvac_mode: c.modes[f.m] }, { s: c.modes[f.m] });
      }
    },
    point: function (t, z, i) {
      if (z === 'hcpower') { t.f.zone = 'power'; this.key(t, 'ok'); }
      else if (z === 'hcbright') t.f.zone = 'bright';
      else if (z === 'hctemp') t.f.zone = 'target';
      else if (z === 'hcstep') { t.f.zone = top().mode === 'light' ? 'bright' : 'target'; this.key(t, i ? 'right' : 'left'); }
      else if (z === 'hcsw') { t.f.zone = 'color'; t.f.s = i; this.key(t, 'ok'); }
      else if (z === 'hcmode') { t.f.zone = 'modes'; t.f.m = i; this.key(t, 'ok'); }
    }
  };
  /* " · Kitchen Strip unavailable" after the lights line: up to two names, then a count. */
  function haGone(m) {
    var g = m.unavailable || [];
    if (!g.length) return '';
    return ' · ' + (g.length > 2 ? esc(g.length + ' unavailable') : escRaw(g.join(', ')) + ' ' + esc('unavailable'));
  }
  function haCamError(msg) {
    return msg === 'auth' ? 'Home Assistant refused the token' : msg === 'unsupported' ? 'This camera doesn’t offer live video here'
      : msg === 'webrtc' ? 'This TV can’t play this camera' : msg === 'timeout' ? 'No live video' : msg === 'unavailable' ? 'The camera is unavailable' : 'The camera stopped';
  }
  if (HA) HA.onChange(function () {
    // New states arrive while Home, the panel or Settings may show them. Later, never inside render().
    clearTimeout(haTimer);
    haTimer = setTimeout(function () {
      var t = top(), it; haTimer = 0;
      if (t.id === 'hactl') { it = haFind(t.item); if (!it || !it.control || it.control.kind !== t.mode) { pop(); t = top(); } } // gone or unavailable: back to the panel
      if (t.id === 'home' || t.id === 'ha' || t.id === 'hacam' || t.id === 'hactl' || t.id === 'settings' || isSettingsDetail(t)) { norm(); render(); } }, 0);
  });

  /* Its sheets: built once per view, filled on every render (main.js, "Sheets"). */
  extend(FRAMES, {
    ha: function () {
      return '<h2 class="s-title">' + esc('Smart home') + '</h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<div class="ha-rooms" data-slot="view"><div class="ha-rooms-in" data-slot="rooms"><div class="ha-frame" data-slot="frame" aria-hidden="true"></div></div></div>'
        + '<div class="ha-cams" data-slot="camview"><div class="ha-cams-in" data-slot="cams"></div></div><div class="ha-empty" data-slot="empty"></div>'
        + '<div class="row-cue ha-before" data-slot="before" aria-hidden="true">' + icon('up') + '</div><div class="row-cue ha-after" data-slot="after" aria-hidden="true">' + icon('down') + '</div>'
        + '<p class="settings-overview-hint ha-hint" data-slot="hint"></p>';
    },
    hactl: function (t) {
      var light = t.mode === 'light';
      return '<h2 class="s-title" data-slot="title"></h2><p class="s-sub" data-slot="sub"></p>'
        + (light
          ? '<div class="hc-row hc-power" data-slot="power"></div>'
            + '<div class="hc-row hc-bright" data-slot="brow"><p class="hc-label"><span>' + esc('Brightness') + '</span><span class="hc-value" data-slot="bval"></span></p>'
            + '<div class="hc-slider" data-slot="bar"><button type="button" tabindex="-1" class="hc-nudge" data-z="hcstep" data-i="0" aria-label="' + esc('Dimmer') + '">' + icon('left') + '</button>'
            + '<div class="hc-track"><div class="hc-fill" data-slot="fill"></div><div class="hc-knob" data-slot="knob"></div></div>'
            + '<button type="button" tabindex="-1" class="hc-nudge" data-z="hcstep" data-i="1" aria-label="' + esc('Brighter') + '">' + icon('right') + '</button></div></div>'
            + '<div class="hc-row hc-colors" data-slot="crow"><p class="hc-label"><span>' + esc('Colour') + '</span><span class="hc-value" data-slot="cval"></span></p><div class="hc-swatches" data-slot="swatches"></div></div>'
          : '<div class="hc-row hc-target" data-slot="trow"><p class="hc-label"><span>' + esc('Target temperature') + '</span></p>'
            + '<div class="hc-dial"><button type="button" tabindex="-1" class="hc-nudge hc-round" data-z="hcstep" data-i="0" aria-label="' + esc('Cooler') + '">' + icon('minus') + '</button>'
            + '<span class="hc-temp" data-slot="temp"></span><button type="button" tabindex="-1" class="hc-nudge hc-round" data-z="hcstep" data-i="1" aria-label="' + esc('Warmer') + '">' + icon('plus') + '</button></div>'
            + '<p class="hc-now" data-slot="now"></p></div>'
            + '<div class="hc-row hc-modes" data-slot="mrow"><p class="hc-label"><span>' + esc('Mode') + '</span></p><div class="hc-pills" data-slot="modes"></div></div>')
        + '<p class="settings-overview-hint hc-hint" data-slot="hint"></p>';
    },
    hacam: function () {
      return '<div class="ha-live"><img class="ha-live-still" data-slot="still" alt=""><video class="ha-live-video" data-slot="video" muted playsinline autoplay></video></div><div class="ha-live-shade" aria-hidden="true"></div>'
        + '<p class="ha-live-badge" data-slot="badge"></p><h2 class="ha-live-title" data-slot="title"></h2><p class="ha-live-state" data-slot="state"></p>'
        + '<div class="ha-live-close" data-slot="close"></div>';
    }
  });
  extend(FILLS, {
    ha: function (t, el) {
      var L = haLayout(), m = L.m, f = t.f, item = haItem(t, L), cams = m.cameras, line = L.lines[f.l], y, lit = 0, entries = [], wide = !cams.length, hint;
      // Scrolling stops at the start of a row (a room name or a line of chips), so no row is left half out of view and hidden.
      function rowStart(at) { var best = 0; L.heads.concat(L.lines).forEach(function (r) { if (r.y >= at && (!best || r.y < best)) best = r.y; }); return at <= 0 ? 0 : best || at; }
      m.rooms.forEach(function (r) { lit += r.on; });
      setHTML(el.sub, S.note ? esc(S.note) : m.status === 'ok' ? esc(lit === 1 ? '1 light on' : lit ? lit + ' lights on' : 'All lights off') + haGone(m) : esc(haStatus()));
      setHTML(el.head, headButtons([['settings', 'Settings', '', 'settings']], f.zone === 'head' ? 0 : -1, 'ha'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      // The focused line stays in view, with its room's name when it is the room's first line.
      if (f.zone === 'rooms' && line) {
        y = line.first ? line.y - HA_HEAD : line.y;
        if (y < t.top) t.top = y;
        if (line.y + HA_LINE > t.top + HA_VIEW) t.top = rowStart(line.y + HA_LINE - HA_VIEW);
      }
      t.top = clamp(t.top, 0, rowStart(L.height - HA_VIEW));
      L.heads.forEach(function (h) { entries.push({ key: h.key, head: h.room, y: h.y, x: h.slot * HA_PITCH, w: h.width * HA_PITCH - 16 }); });
      L.lines.forEach(function (ln, l) { ln.items.forEach(function (it, i) { entries.push({ key: it.id, item: it, l: l, i: i, x: ln.slots[i] * HA_PITCH, y: ln.y }); }); });
      keyed(el.rooms, entries, function (node, e) {
        var focus, shown = e.y >= t.top && e.y + (e.head ? HA_HEAD : HA_LINE - 16) <= t.top + HA_VIEW; // whole rows only: the cues say there is more
        node.style.visibility = shown ? 'visible' : 'hidden';
        if (e.head) {
          setContent(node, 'head|' + e.head.name + '|' + e.head.on, '<span class="ha-room">' + escRaw(e.head.name) + '</span>' + (e.head.on ? '<span class="ha-lit">' + esc(e.head.on + ' on') + '</span>' : ''));
          node.className = 'ha-head'; node.style.width = e.w + 'px'; node.style.transform = 'translate3d(' + e.x + 'px,' + e.y + 'px,0)';
          return;
        }
        focus = f.zone === 'rooms' && f.l === e.l && f.i === e.i;
        setContent(node, e.item.name + '|' + e.item.state, '<span class="panel-content"><span class="ha-name">' + escRaw(e.item.name) + '</span><span class="ha-state">' + escRaw(e.item.state) + '</span></span>');
        node.className = 'ha-chip' + (focus ? ' is-focus' : '') + (e.item.active ? ' is-active' : '') + (e.item.off ? ' is-off' : '') + (e.item.toggle ? ' can-toggle' : '');
        node.style.transform = 'translate3d(' + e.x + 'px,' + e.y + 'px,0)';
        node.setAttribute('role', 'button'); node.setAttribute('aria-label', e.item.name + ', ' + e.item.state); node.setAttribute('data-id', e.item.id);
        attrs(node, 'hachip', e.i, 'ha.toggle.' + e.item.id);
      });
      el.rooms.style.transform = 'translate3d(0,' + (-t.top) + 'px,0)';
      // A thin outline around the focused chip's room, so rooms sharing a row stay apart.
      var room = f.zone === 'rooms' && line ? L.heads[line.rooms[f.i]] : null;
      if (room) {
        el.frame.style.width = (room.width * HA_PITCH + 4) + 'px';
        el.frame.style.height = (HA_HEAD + room.lines * HA_LINE + 4) + 'px';
        el.frame.style.transform = 'translate3d(' + (room.slot * HA_PITCH - 10) + 'px,' + (room.y - 6) + 'px,0)';
      }
      el.frame.className = 'ha-frame' + (room ? ' is-on' : '');
      el.view.className = 'ha-rooms' + (wide ? ' is-wide' : '');
      if (f.zone === 'cams') { if (f.c * HA_CAM < t.ctop) t.ctop = f.c * HA_CAM; if ((f.c + 1) * HA_CAM > t.ctop + HA_CAM_VIEW) t.ctop = (f.c + 1) * HA_CAM - HA_CAM_VIEW; }
      t.ctop = clamp(t.ctop, 0, Math.max(0, cams.length * HA_CAM - HA_CAM_VIEW));
      keyed(el.cams, cams.map(function (c) { return { key: c.id, cam: c }; }), function (node, e, i) {
        var c = e.cam, still = HA.camera.still(c.id), focus = f.zone === 'cams' && f.c === i, sub = c.off ? 'Unavailable' : c.activity ? 'Activity ' + HA.ago(c.activity) : c.room;
        setContent(node, c.id + '|' + c.name + '|' + sub + '|' + (still ? still.at : 0), '<span class="panel-content"><span class="ha-still">' + (still ? '<img alt="" src="' + still.src + '">' : icon('camera')) + '</span>'
          + '<span class="ha-cam-name">' + escRaw(c.name) + '</span><span class="ha-cam-sub">' + esc(sub) + '</span></span>');
        node.className = 'ha-cam' + (focus ? ' is-focus' : '') + (c.off ? ' is-off' : '');
        node.style.transform = 'translate3d(0,' + (i * HA_CAM) + 'px,0)';
        node.style.visibility = (i + 1) * HA_CAM > t.ctop && i * HA_CAM < t.ctop + HA_CAM_VIEW ? 'visible' : 'hidden';
        node.setAttribute('role', 'button'); node.setAttribute('aria-label', c.name);
        attrs(node, 'hacam', i, 'ha.camera.' + c.id);
      });
      el.cams.style.transform = 'translate3d(0,' + (-t.ctop) + 'px,0)';
      el.camview.className = 'ha-cams' + (cams.length ? ' is-on' : '');
      setHTML(el.empty, L.lines.length || cams.length ? '' : '<p>' + esc(!m.configured ? 'Connect Home Assistant from your phone: Settings › Add-ons › Home Assistant.' : m.status === 'ok' ? 'No devices in the rooms you chose. In Home Assistant, give your devices an area.' : haStatus()) + '</p>');
      el.before.className = 'row-cue ha-before' + (t.top > 0 ? ' is-on' : '');
      el.after.className = 'row-cue ha-after' + (L.height > t.top + HA_VIEW ? ' is-on' : '');
      hint = f.zone === 'head' ? 'Open Home Assistant settings' : f.zone === 'cams' ? 'Watch live' : !item ? '' : !item.toggle ? (item.control ? 'Temperature and mode' : '') : /^lock\./.test(item.id) ? (item.active ? 'Unlock' : 'Lock') : item.active ? 'Switch off' : 'Switch on';
      setHTML(el.hint, (hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '')
        + (item && item.toggle && item.control ? '<span class="remote-key hc-hold">' + esc('Hold OK') + '</span><span>' + esc(item.control.color || item.control.temp ? 'Brightness and colour' : 'Brightness') + '</span>' : ''));
    },
    hactl: function (t, el) {
      var item = haFind(t.item), c = item && item.control, f = t.f, hint = '', sw, cur, b, on;
      if (!c || c.kind !== t.mode) return;
      setHTML(el.title, escRaw(item.name));
      setHTML(el.sub, S.note ? esc(S.note) : escRaw(item.room) + ' · ' + esc(item.state));
      if (c.kind === 'light') {
        on = c.on; b = on ? (c.b === null ? 100 : c.b) : 0;
        setHTML(el.power, '<p class="hc-label"><span>' + esc('Power') + '</span></p><button type="button" tabindex="-1" class="hc-switch' + (on ? ' is-on' : '') + (f.zone === 'power' ? ' is-focus' : '')
          + '" data-z="hcpower" data-i="0" data-action="hactl.power" aria-label="' + esc(on ? 'Switch off' : 'Switch on') + '"><span class="hc-switch-knob"></span><span class="hc-switch-word">' + esc(TT(on ? 'On (light)' : 'Off (light)')) + '</span></button>');
        el.power.className = 'hc-row hc-power' + (f.zone === 'power' ? ' is-on' : '');
        setHTML(el.bval, on ? b + '%' : esc(TT('Off (light)')));
        el.fill.style.transform = 'scaleX(' + (b / 100).toFixed(3) + ')';
        el.knob.style.transform = 'translate3d(' + Math.round(b / 100 * 1180) + 'px,0,0)';
        el.bar.className = 'hc-slider' + (f.zone === 'bright' ? ' is-focus' : '') + (on ? '' : ' is-dark');
        attrs(el.bar, 'hcbright', 0, 'hactl.brightness'); el.bar.setAttribute('aria-label', T('Brightness') + ', ' + b + '%');
        el.brow.className = 'hc-row hc-bright' + (f.zone === 'bright' ? ' is-on' : '');
        sw = hcSwatches(c); cur = on ? hcCurrent(c) : -1;
        el.crow.style.display = sw.length ? '' : 'none';
        el.crow.className = 'hc-row hc-colors' + (f.zone === 'color' ? ' is-on' : '');
        setHTML(el.cval, sw[f.s] && f.zone === 'color' ? esc(sw[f.s][0]) : cur >= 0 ? esc(sw[cur][0]) : '');
        setHTML(el.swatches, sw.map(function (w, i) {
          return '<button type="button" tabindex="-1" class="hc-sw' + (i === cur ? ' is-current' : '') + (f.zone === 'color' && f.s === i ? ' is-focus' : '') + '" data-z="hcsw" data-i="' + i + '" data-action="hactl.color.' + i + '" aria-label="' + esc(w[0]) + '">'
            + '<span class="hc-dot" style="background:' + w[1] + '"></span>' + (i === cur ? icon('check', 'hc-tick') : '') + '</button>';
        }).join(''));
        hint = f.zone === 'power' ? (on ? 'Switch off' : 'Switch on') : f.zone === 'bright' ? 'Left and right change the brightness' : 'Set this colour';
        setHTML(el.hint, f.zone === 'bright' ? '<span>' + esc(hint) + '</span>' : '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>');
        return;
      }
      setHTML(el.temp, c.target !== null ? esc(haDegrees(c.target)) : c.lo !== null && c.hi !== null ? esc(haDegrees(c.lo) + ' – ' + haDegrees(c.hi)) : '–');
      el.temp.className = 'hc-temp' + (f.zone === 'target' ? ' is-focus' : '') + (c.target === null ? ' is-range' : '');
      attrs(el.temp, 'hctemp', 0, 'hactl.target'); el.temp.setAttribute('aria-label', T('Target temperature') + ', ' + (c.target === null ? '' : haDegrees(c.target)));
      el.trow.style.display = hcRows(c).indexOf('target') >= 0 ? '' : 'none';
      el.trow.className = 'hc-row hc-target' + (f.zone === 'target' ? ' is-on' : '');
      setHTML(el.now, c.now !== null ? esc('Now ' + haDegrees(c.now)) + (c.action && c.action !== 'off' && c.action !== 'idle' ? ' · ' + esc(TT(HC_ACTIONS[c.action] || cap(c.action))) : '') : '');
      el.mrow.style.display = c.modes.length ? '' : 'none';
      el.mrow.className = 'hc-row hc-modes' + (f.zone === 'modes' ? ' is-on' : '');
      setHTML(el.modes, c.modes.map(function (m, i) {
        return '<button type="button" tabindex="-1" class="hc-pill' + (m === c.mode ? ' is-current' : '') + (f.zone === 'modes' && f.m === i ? ' is-focus' : '') + '" data-z="hcmode" data-i="' + i + '" data-action="hactl.mode.' + escRaw(m) + '">'
          + (m === c.mode ? icon('check') : '') + '<span>' + esc(HC_MODES[m] || cap(m)) + '</span></button>';
      }).join(''));
      hint = f.zone === 'target' ? (c.target === null ? 'Set the range in Home Assistant' : 'Left and right change the temperature') : '';
      setHTML(el.hint, f.zone === 'modes' ? '<span class="remote-key">OK</span><span>' + esc('Use this mode') + '</span>' : hint ? '<span>' + esc(hint) + '</span>' : '');
    },
    hacam: function (t, el) {
      var c = t.cam, still = HA.camera.still(c.id);
      if (!t.started) {
        t.started = true;
        HA.camera.live(c.id, el.video, function (state, msg) { t.state = state; t.msg = msg; if (top() === t) render(); });
      }
      if (still && el.still.getAttribute('src') !== still.src) el.still.src = still.src;
      el.still.className = 'ha-live-still' + (still ? ' is-on' : '');
      el.video.className = 'ha-live-video' + (t.state === 'live' ? ' is-on' : '');
      setHTML(el.badge, t.doorbell ? '<span class="ha-dot"></span>' + esc('Doorbell') : t.state === 'live' ? '<span class="ha-dot"></span>' + esc('Live') : '');
      setHTML(el.title, escRaw(c.name));
      setHTML(el.state, t.state === 'live' ? '' : esc(t.state === 'error' ? haCamError(t.msg) : 'Connecting…'));
      setHTML(el.close, '<button type="button" tabindex="-1" class="btn is-focus" data-z="hacam-close" data-i="0" data-action="hacam.close">' + icon('left') + '<span>' + esc(t.doorbell ? 'Close' : 'Smart home') + '</span></button>');
    }
  });
