/* Music view (addons/AGENTS.md): cover, progress, controls and synced lyrics, with word-by-word lighting and the
   beat pulse. Built in, but fetched only the first time the view opens, and run inside main.js's scope.
   Detail comes from the media session (NowPlayingService.detail) once a second; between polls the position runs
   on locally. Lyrics come from LRCLIB through Lyrics.java and follow the position line by line. */
  var PB = ['prev', 'toggle', 'next', 'lyrics', 'app'], SEEK_STEP = 10000;
  openPlayer = function (pkg) {
    P.pkg = pkg || ''; P.d = null; P.ly = null; P.tr = null; P.lyKey = ''; P.seekTo = -1;
    push({ id: 'player', f: { zone: 'buttons', b: 1 } });
    playerPoll(); render();
  };
  function playerPoll() {
    var d, key;
    clearTimeout(P.poll); P.poll = 0;
    if (!playerOpen() || !NOWPLAYING || !NOWPLAYING.detail) return;
    if (!document.hidden) {
      d = NOWPLAYING.detail(P.pkg, S.c.clook === 'on');
      if (d.found) {
        if (P.seekTo >= 0 && Date.now() < P.seekUntil && Math.abs(d.pos - P.seekTo) > 3000) d.pos = playerPos(); // the app hasn't reported the jump yet
        else P.seekTo = -1;
        P.d = d; P.at = Date.now(); P.pkg = d.pkg || P.pkg;
        key = d.artist + '\n' + d.title;
        if (key !== P.lyKey) { P.lyKey = key; P.ly = null; P.tr = null; if (NOWPLAYING.beat) NOWPLAYING.beat.reset(); } // a new song: new lyrics, and the pulse learns its drums again
        if (S.c.plyric === 'on' && (!P.ly || P.ly.state === 'pending')) P.ly = NOWPLAYING.lyrics(d.artist, d.title, d.album, Math.round(d.dur / 1000));
        if (S.c.ptrans === 'on' && NOWPLAYING.translate && P.ly && P.ly.state === 'ok' && P.ly.synced.length && (!P.tr || P.tr.state === 'pending'))
          P.tr = NOWPLAYING.translate(P.ly.synced.map(function (l) { return l[1]; }), lyricLang());
      } else if (!P.d) P.d = { found: false };
      syncAwake(); render();
    }
    P.poll = setTimeout(playerPoll, 1000);
  }
  /* Translations go to the TV's own language, even one Shore has no texts for. */
  function lyricLang() { return String(navigator.language || 'en').split('-')[0].toLowerCase(); }
  /* Position now, from the last poll and the playback speed. */
  function playerPos() {
    var d = P.d;
    if (!d || !d.found) return 0;
    if (P.seekTo >= 0 && Date.now() < P.seekUntil) return P.seekTo;
    return Math.min(d.dur || Infinity, d.pos + (Date.now() - P.at) * d.speed);
  }
  function playerTime(ms) { var s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60), h = Math.floor(m / 60); s %= 60; return (h ? h + ':' + (m % 60 < 10 ? '0' : '') + (m % 60) : m) + ':' + (s < 10 ? '0' : '') + s; }
  function playerSeek(delta) {
    var d = P.d, to;
    if (!d || !d.found || !d.seek) return;
    to = Math.max(0, Math.min(d.dur ? d.dur - 1000 : Infinity, playerPos() + delta));
    if (!NOWPLAYING.seek(d.pkg, to)) { S.note = 'Couldn’t control the music.'; return; }
    P.seekTo = to; P.seekUntil = Date.now() + 2500; P.d.pos = to; P.at = Date.now();
  }
  function playerButton(id) {
    var d = P.d || {};
    if (id === 'lyrics') {
      var c = next(S.c.home.slice(), S.c.recent.slice()); c.plyric = S.c.plyric === 'on' ? 'off' : 'on';
      write(c, 'Lyrics'); if (c.plyric === 'on') { P.lyKey = ''; playerPoll(); }
      return;
    }
    if (id === 'app') { if (d.pkg && FrameDevice.launchApp) perform(d.app || 'Music', function (done) { FrameDevice.launchApp(d.pkg, done); }); return; }
    if (!NOWPLAYING.control(d.pkg || P.pkg, id)) { S.note = 'Couldn’t control the music.'; return; }
    if (id === 'toggle' && d.found) { d.pos = playerPos(); P.at = Date.now(); d.speed = d.playing ? 0 : 1; d.playing = !d.playing; }
    clearTimeout(P.poll); P.poll = setTimeout(playerPoll, 600);
  }
  /* The lyric line playing now: the last synced line that has started. */
  function lyricIndex(lines, pos) {
    var lo = 0, hi = lines.length - 1, at = -1, mid;
    while (lo <= hi) { mid = (lo + hi) >> 1; if (lines[mid][0] <= pos + 250) { at = mid; lo = mid + 1; } else hi = mid - 1; }
    return at;
  }
  /* Apple Music-like motion: every line moves on its own, the ones below a little later, so the text
     ripples up; the line playing now grows to full size. Transforms and opacity only, no blur on the TV. */
  function moveLyrics(box, at) {
    var nodes = box.childNodes, tops = box._tops, y, i, d;
    if (!tops) { tops = box._tops = []; for (i = 0; i < nodes.length; i++) tops.push(nodes[i].offsetTop); }
    y = at > 0 ? tops[at] : 0;
    for (i = 0; i < nodes.length; i++) {
      d = i - at;
      nodes[i].className = 'pl-line' + (i === at ? ' is-now' : i < at ? ' is-past' : '');
      nodes[i].style.transitionDelay = d > 0 ? Math.min(d, 7) * 55 + 'ms' : '0ms';
      nodes[i].style.transform = 'translate3d(0,' + (-y) + 'px,0)' + (i === at ? '' : ' scale(.94)');
    }
    box._at = at; box._lit = -1;
  }
  /* Most LRCLIB lyrics time lines, not words: then the words light up in turn, spread by their length over the time the line is sung. */
  function lightWords(box, lines, at, pos) {
    var line = at >= 0 ? box.childNodes[at] : null, words, t0, span, total = 0, done = 0, f, lit = 0, i;
    if (!line || !lines[at][1]) return;
    words = line.getElementsByClassName('w');
    for (i = 0; i < words.length; i++) total += words[i].textContent.length + 1;
    if (lines[at][2]) { // timed words: exact
      for (i = 0; i < words.length && lines[at][2][i]; i++) if (lines[at][2][i][0] <= pos + 120) lit = i + 1;
      return litWords(box, words, lit);
    }
    t0 = lines[at][0];
    span = Math.min((at + 1 < lines.length ? lines[at + 1][0] : t0 + 6000) - t0 - 150, Math.max(900, total * 70));
    f = span > 0 ? (pos + 250 - t0) / span : 1;
    for (i = 0; i < words.length; i++) { if (done / total <= f) lit = i + 1; done += words[i].textContent.length + 1; }
    litWords(box, words, lit);
  }
  function litWords(box, words, lit) {
    if (lit === box._lit) return;
    for (var i = 0; i < words.length; i++) { var c = i < lit ? 'w is-lit' : 'w'; if (words[i].className !== c) words[i].className = c; }
    box._lit = lit;
  }
  /* Beat pulse: the bass level (Beat.java) pushes the backdrop and the cover out a little on every kick.
     ~30 reads a second while the music view is open; stopped as soon as it closes. */
  var beatTimer = 0, beatOn = false, beatV = 0;
  function beatLoop() {
    var B = NOWPLAYING && NOWPLAYING.beat, want = !!B && playerOpen() && S.c.pbeat === 'on' && !document.hidden && !calm(), v, el = slotEls;
    clearTimeout(beatTimer); beatTimer = 0;
    if (!want) { if (beatOn) { B.stop(); beatOn = false; } beatV = 0; if (el.back) { el.back.style.transform = ''; el.art.style.transform = ''; } return; }
    if (!beatOn) beatOn = B.start();
    if (!beatOn) return; // no permission: the Settings switch asks for it
    v = Math.max(0, B.level());
    beatV = v > beatV ? v : beatV * .7; // hits at once, falls back quickly
    if (el.back) { el.back.style.transform = 'scale(' + (1.08 + beatV * .04).toFixed(4) + ')'; el.art.style.transform = 'scale(' + (1 + beatV * .02).toFixed(4) + ')'; }
    beatTimer = setTimeout(beatLoop, 33);
  }

  /* A light timer while the view is open: the bar, the clock digits and the lyric line, nothing else. */
  function playerTick() {
    clearTimeout(P.tick); P.tick = 0;
    if (!playerOpen()) { beatLoop(); return; }
    if (!document.hidden) FILLS.player(top(), slotEls, true);
    P.tick = setTimeout(playerTick, 250);
  }

  V.player = {
    sheet: true,
    key: function (t, k) {
      var f = t.f, d = P.d || {}, seekable = !!(d.found && d.seek);
      if (k === 'back') { pop(); return; }
      if (f.zone === 'bar') {
        if (!seekable || k === 'down') f.zone = 'buttons';
        else if (k === 'left') playerSeek(-SEEK_STEP);
        else if (k === 'right') playerSeek(SEEK_STEP);
        else if (k === 'ok') playerButton('toggle');
        return;
      }
      f.b = clamp(f.b, 0, PB.length - 1);
      if (k === 'left' && f.b > 0) f.b--;
      else if (k === 'right' && f.b < PB.length - 1) f.b++;
      else if (k === 'up' && seekable) f.zone = 'bar';
      else if (k === 'ok') playerButton(PB[f.b]);
    },
    point: function (t, z, i) {
      if (z === 'pbtn') { t.f.zone = 'buttons'; t.f.b = i; this.key(t, 'ok'); }
      else if (z === 'pbar') t.f.zone = 'bar';
    }
  };

  /* Its sheet: built once, filled on every render and four times a second by playerTick(). */
  FRAMES.player = function () {
      return '<div class="pl-bg" aria-hidden="true"><img class="pl-back" data-slot="back" alt=""></div><div class="pl-shade" aria-hidden="true"></div>'
        + '<div class="pl-art" data-slot="art"></div>'
        + '<div class="pl-info"><p class="pl-source" data-slot="app"></p><h2 class="pl-title" data-slot="title"></h2><p class="pl-artist" data-slot="artist"></p>'
        + '<div class="pl-bar" data-slot="bar" data-z="pbar" data-i="0"><div class="pl-track"><div class="pl-fill" data-slot="fill"></div><div class="pl-knob" data-slot="knob"></div></div>'
        + '<div class="pl-times"><span data-slot="pos"></span><span data-slot="dur"></span></div></div>'
        + '<div class="pl-buttons" data-slot="buttons"></div><div class="pl-upnext" data-slot="queue"></div></div>'
        + '<div class="pl-words" data-slot="lyrics"><div class="pl-lines" data-slot="lines"></div></div>'
        + '<p class="pl-credit" data-slot="credit"></p><p class="pl-hint" data-slot="hint"></p>';
    };
  FILLS.player = function (t, el, tick) {
      var d = P.d || {}, f = t.f, pos = playerPos(), dur = d.dur || 0, ly = S.c.plyric === 'on' ? P.ly : null, synced = ly && ly.state === 'ok' && ly.synced.length ? ly.synced : null;
      var tr = synced && S.c.ptrans === 'on' && P.tr && P.tr.state === 'ok' ? P.tr.lines : null;
      var showLyrics = !!(ly && ly.state === 'ok'), frac = dur ? Math.max(0, Math.min(1, pos / dur)) : 0, at, html;
      el.fill.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
      el.knob.style.transform = 'translate3d(' + Math.round(frac * 640) + 'px,0,0)';
      setHTML(el.pos, d.found && dur ? playerTime(pos) : '');
      setHTML(el.dur, d.found && dur ? '−' + playerTime(Math.max(0, dur - pos)) : '');
      if (synced) {
        at = lyricIndex(synced, pos);
        if (at !== el.lines._at) moveLyrics(el.lines, at);
        if (S.c.pword === 'on') lightWords(el.lines, synced, at, pos);
        el.lines.style.transform = '';
      } else if (showLyrics && dur) el.lines.style.transform = 'translate3d(0,' + (-Math.round(frac * Math.max(0, el.lines.scrollHeight - 600))) + 'px,0)';
      if (tick) return;
      if (!P.tick) playerTick();
      if (!beatTimer) beatLoop();
      if (el.back.getAttribute('src') !== (d.back || '')) { if (d.back) el.back.src = d.back; else el.back.removeAttribute('src'); }
      el.back.parentNode.className = 'pl-bg' + (d.back ? ' is-on' : '');
      setHTML(el.art, d.art ? '<img alt="" src="' + escRaw(d.art) + '">' : '<span class="pl-art-empty">' + icon('music') + '</span>');
      setHTML(el.app, d.found ? esc(d.playing ? 'Playing on ' + d.app : 'Paused · ' + d.app) : '');
      setHTML(el.title, d.found ? escRaw(d.title) : esc(d.access === false ? 'Allow Shore in Notification access' : P.d ? 'Nothing is playing' : ''));
      setHTML(el.artist, d.found ? escRaw([d.artist, d.album].filter(Boolean).join(' · ')) : '');
      el.bar.className = 'pl-bar' + (f.zone === 'bar' ? ' is-focus' : '') + (d.found && d.seek ? ' can-seek' : '') + (dur ? '' : ' is-live');
      setHTML(el.buttons, PB.map(function (id, i) {
        var name = id === 'toggle' ? (d.playing ? 'pause' : 'play') : id === 'app' ? 'open' : id, label = id === 'toggle' ? (d.playing ? 'Pause' : 'Play') : id === 'prev' ? 'Previous' : id === 'next' ? 'Next' : id === 'lyrics' ? 'Lyrics' : 'Open ' + (d.app || 'app');
        return '<button type="button" tabindex="-1" class="pl-btn pl-' + id + (f.zone === 'buttons' && f.b === i ? ' is-focus' : '') + (id === 'lyrics' && S.c.plyric === 'on' ? ' is-on' : '') + '" data-z="pbtn" data-i="' + i + '" aria-label="' + esc(label) + '">'
          + icon(name, id === 'lyrics' || id === 'app' ? '' : 'ico-fill') + '</button>';
      }).join(''));
      var b = PB[clamp(f.b, 0, PB.length - 1)];
      setHTML(el.hint, f.zone === 'bar' ? esc('Left and right jump 10 seconds') : esc(b === 'toggle' ? (d.playing ? 'Pause' : 'Play') : b === 'prev' ? 'Previous' : b === 'next' ? 'Next' : b === 'lyrics' ? (S.c.plyric === 'on' ? 'Hide lyrics' : 'Show lyrics') : 'Open ' + (d.app || 'app')));
      html = !ly ? '' : ly.state === 'ok' ? (synced ? synced.map(function (l, i) {
          return '<p class="pl-line">' + (l[1] ? (l[2] ? l[2].map(function (w) { return w[1]; }) : l[1].split(/\s+/)).map(function (w) { return '<span class="w">' + escRaw(w) + '</span>'; }).join(' ') : '<span class="pl-dots"><i></i><i></i><i></i></span>') + (tr && tr[i] && l[1] && tr[i] !== l[1] ? '<span class="pl-tr">' + escRaw(tr[i]) + '</span>' : '') + '</p>';
        }).join('')
        : '<div class="pl-plain">' + escRaw(ly.plain).replace(/\n/g, '<br>') + '</div>')
        : '<p class="pl-state">' + esc(ly.state === 'pending' ? 'Looking for lyrics…' : ly.state === 'instrumental' ? 'Instrumental' : 'No lyrics for this song') + '</p>';
      if (el.lines._key !== P.lyKey + '|' + (ly && ly.state) + '|' + !!tr) { el.lines._key = P.lyKey + '|' + (ly && ly.state) + '|' + !!tr; el.lines.innerHTML = html; el.lines._at = null; el.lines._tops = null; el.lines.className = 'pl-lines is-jump'; FILLS.player(t, el, true); void el.lines.offsetHeight; el.lines.className = 'pl-lines'; } // a new song jumps, it doesn't scroll
      var wide = !!(ly && (ly.state === 'ok' || ly.state === 'pending'));
      setHTML(el.queue, S.c.pqueue === 'on' && d.found && d.next && d.next.length && !wide ? '<p class="pl-upnext-h">' + esc('Up next') + '</p>' + d.next.map(function (x) {
        return '<p class="pl-upnext-i"><span>' + escRaw(x.title) + '</span>' + (x.artist ? ' · ' + escRaw(x.artist) : '') + '</p>';
      }).join('') : '');
      el.lyrics.className = 'pl-words' + (wide ? ' is-on' : '') + (synced ? ' is-synced' : '') + (S.c.pword === 'on' ? '' : ' no-words');
      setHTML(el.credit, showLyrics ? esc(tr ? 'Lyrics from LRCLIB, translated by Google' : 'Lyrics from LRCLIB') : ly && ly.state === 'instrumental' ? esc('Instrumental') : ly && ly.state === 'none' ? esc('No lyrics for this song') : '');
      sheetView.className = 'view view-player' + (wide ? ' has-lyrics' : '');
    };
