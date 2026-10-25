/* Android TV / Google TV adapter (e.g. TCL Google TV sets).
   Active only inside the CleanFrame Android shell, which exposes window.CleanFrameAndroid.
   On Tizen and in the browser preview this file does nothing, so device.js stays in charge. */
(function () {
  'use strict';
  var bridge = window.CleanFrameAndroid;
  if (!bridge) return;

  /* CleanFrame brand id -> Android TV package. Brands keep CleanFrame's bundled logos. */
  var PACKAGES = {
    stremio: 'com.stremio.one', netflix: 'com.netflix.ninja',
    disneyplus: 'com.disney.disneyplus', youtube: 'io.gh.reisxd.tizentube.cobalt',
    appletv: 'com.apple.atve.androidtv.appletv', primevideo: 'com.amazon.amazonvideo.livingroom',
    applemusic: 'com.apple.android.music', spotify: 'com.spotify.tv.android',
    hbomax: 'com.wbd.stream', tubi: 'com.tubitv',
    joyn: 'de.prosiebensat1digital.seventv', waipu: 'de.exaring.waipu', twitch: 'tv.twitch.android.app',
    ard: 'de.swr.avp.ard.tv', zdf: 'com.zdf.android.mediathek', arte: 'tv.arte.plus7'
  };
  /* Tried when the brand's preferred package is missing (TizenTube -> official YouTube). */
  var FALLBACK = { youtube: 'com.google.android.youtube.tv' };
  /* Saved preferences and the default Home list still carry Tizen IDs. */
  var TIZEN = {
    'IkWsFHtOY9.Stremio': 'stremio', 'org.tizen.netflix-app': 'netflix',
    'MCmYXNxgcu.DisneyPlus': 'disneyplus', '9Ur5IzDKqV.TizenYouTube': 'youtube',
    'com.samsung.tv.aria-video': 'appletv', 'org.tizen.primevideo': 'primevideo',
    'org.tizen.apple.apple-music': 'applemusic', 'rJeHak5zRg.Spotify': 'spotify',
    '5b8c3eb16b.BeamCTVDev': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'
  };
  var ORDER = ['stremio', 'netflix', 'disneyplus', 'youtube', 'appletv', 'primevideo', 'applemusic'];
  var EXTRA = ['spotify', 'hbomax', 'tubi', 'joyn', 'waipu', 'twitch', 'ard', 'zdf', 'arte'];
  var BRAND = {};
  Object.keys(PACKAGES).forEach(function (b) { BRAND[PACKAGES[b]] = b; });

  function later(fn) { setTimeout(fn, 0); }
  function ask(name, arg) {
    try { return arg === undefined ? bridge[name]() : bridge[name](arg); } catch (e) { return false; }
  }
  function reply(ok, done, message) {
    later(function () {
      if (ok) done(null);
      else done({ message: message || 'The TV could not open this screen.', detail: 'Try again, or press the remote’s Home button.' });
    });
  }
  function launchApp(id, done) {
    if (/^[A-Za-z0-9._]+\/[A-Za-z0-9._$\/-]+$/.test(id)) { reply(ask('openInput', id), done, 'This input could not be opened.'); return; }
    var pkg = TIZEN[id] ? PACKAGES[TIZEN[id]] : id;
    if (!pkg || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg)) { reply(false, done, 'This app isn’t available on this TV.'); return; }
    var brand = BRAND[pkg], ok = ask('launch', pkg);
    if (!ok && FALLBACK[brand]) ok = ask('launch', FALLBACK[brand]);
    reply(ok, done, 'This app isn’t installed on this TV.');
  }
  /* Android's App info page for the app behind a Home entry. */
  function appInfo(id, done) {
    var pkg = TIZEN[id] ? PACKAGES[TIZEN[id]] : PACKAGES[id] || id, brand = BRAND[pkg];
    if (FALLBACK[brand] && !isInstalled(pkg)) pkg = FALLBACK[brand];
    if (!pkg || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg)) { reply(false, done, 'App info isn’t available for this app.'); return; }
    reply(ask('appInfo', pkg), done, 'App info could not open.');
  }
  function launch(brand, done) {
    if (!PACKAGES[brand]) { reply(false, done, 'This app has no launch target.'); return; }
    launchApp(PACKAGES[brand], done);
  }
  function apps(done) {
    later(function () {
      var list, result = [];
      try { list = JSON.parse(bridge.apps()); } catch (e) { done({ message: 'Could not read installed apps.' }); return; }
      list.forEach(function (a) {
        var brand = BRAND[a.appId] || '', rank = ORDER.indexOf(brand);
        result.push({ appId: a.appId, name: a.name, brand: brand,
          icon: '/appicon/' + a.appId + '.png',
          rank: rank >= 0 ? rank : (EXTRA.indexOf(brand) >= 0 ? 20 : 30) });
      });
      result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
      done(null, result);
    });
  }
  /* Physical inputs (HDMI, AV). state: 0 device on, 1 standby, 2 nothing plugged in. */
  function inputs(done) {
    later(function () {
      var list;
      try { list = JSON.parse(bridge.inputs()); } catch (e) { done({ message: 'Could not read TV inputs.' }); return; }
      done(null, list.filter(function (i) { return i && typeof i.id === 'string' && typeof i.name === 'string'; }));
    });
  }
  var inputListeners = [], onlineListeners = [];
  window.CleanFrameOnlineChanged = function (entries, status) { onlineListeners.forEach(function (fn) { try { fn(entries, status); } catch (e) { } }); };
  /* Online photo sources, fetched and pre-rendered by the Android shell. */
  var online = {
    info: function () { try { return JSON.parse(bridge.onlineInfo()); } catch (e) { return { source: 'off', unsplash: false }; } },
    select: function (source, force) { try { bridge.onlineSource(source, !!force); } catch (e) { } },
    keep: function (id, on) { try { bridge.onlineKeep(String(id), !!on); } catch (e) { } },
    onChange: function (fn) { onlineListeners.push(fn); }
  };
  window.CleanFrameInputsChanged = function () { inputListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  /* Remote button assignments, applied natively by HomeButtonService (accessibility, enabled by the user). */
  var remoteListeners = [], learnListeners = [], installed = null, installedAt = 0;
  window.CleanFrameRemoteChanged = function () { remoteListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  window.CleanFrameRemoteLearned = function (key) {
    if (!key || typeof key.code !== 'number') return;
    learnListeners.forEach(function (fn) { try { fn(key); } catch (e) { } });
  };
  function isInstalled(pkg) {
    if (!installed || Date.now() - installedAt > 30000) {
      installed = {}; installedAt = Date.now();
      try { JSON.parse(bridge.apps()).forEach(function (a) { installed[a.appId] = true; }); } catch (e) { }
    }
    return !!installed[pkg];
  }
  var remote = {
    info: function () {
      var info;
      try { info = JSON.parse(bridge.remoteInfo()); } catch (e) { info = {}; }
      return { service: !!info.service, blocked: !!info.blocked, learning: !!info.learning, keys: (info.keys || []).filter(function (k) { return k && typeof k.code === 'number' && typeof k.action === 'string'; }) };
    },
    learn: function (on) { try { return !!bridge.remoteLearn(!!on); } catch (e) { return false; } },
    set: function (code, name, action) { try { bridge.remoteSet(code, String(name), String(action)); return true; } catch (e) { return false; } },
    /* The package a Home entry launches, so a button opens the same app as its tile. */
    appTarget: function (id) {
      var pkg = TIZEN[id] ? PACKAGES[TIZEN[id]] : PACKAGES[id] || id, brand = BRAND[pkg];
      if (!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg)) return null;
      if (FALLBACK[brand] && !isInstalled(pkg)) pkg = FALLBACK[brand];
      return pkg;
    },
    openSettings: function (done) { reply(ask('accessibilitySettings'), done, 'Accessibility settings could not open.'); },
    onChange: function (fn) { remoteListeners.push(fn); },
    onLearned: function (fn) { learnListeners.push(fn); }
  };
  /* Top Shelf (Shelf layout): recommendations fetched and pre-rendered natively, keyed by package. */
  var shelfListeners = [];
  function hasApp(pkg) { try { return JSON.parse(bridge.apps()).some(function (a) { return a.appId === pkg; }); } catch (e) { return false; } }
  window.CleanFrameTopShelfChanged = function (index) { shelfListeners.forEach(function (fn) { try { fn(index || {}); } catch (e) { } }); };
  var topShelf = {
    index: function () { try { return JSON.parse(bridge.topShelfIndex()) || {}; } catch (e) { return {}; } },
    request: function (pkgs) { try { bridge.topShelf(JSON.stringify(pkgs || [])); } catch (e) { } },
    onChange: function (fn) { shelfListeners.push(fn); },
    /* Deep link into the tile's own app when it handles the link, otherwise just launch the app. */
    open: function (id, url, done) {
      var pkg = TIZEN[id] ? PACKAGES[TIZEN[id]] : PACKAGES[id] || id;
      if (FALLBACK[BRAND[pkg]] && !hasApp(pkg)) pkg = FALLBACK[BRAND[pkg]];
      var ok = false;
      if (url && /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg)) { try { ok = !!bridge.openLink(String(url), pkg); } catch (e) { } }
      if (ok) reply(true, done); else launchApp(id, done);
    }
  };
  /* Continue watching: rows apps publish to Android's Watch Next list (WatchNext.java). */
  var watchListeners = [];
  window.CleanFrameWatchNextChanged = function () { watchListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  var watchNext = bridge.watchNext ? {
    /* {allowed, items:[{id, pkg, title, sub, progress, left, card}]} */
    list: function () { try { return JSON.parse(bridge.watchNext()) || {}; } catch (e) { return {}; } },
    open: function (id, done) { var ok = false; try { ok = !!bridge.watchNextOpen(String(id)); } catch (e) { } reply(ok, done); },
    allow: function () { try { bridge.watchNextAllow(); } catch (e) { } },
    onChange: function (fn) { watchListeners.push(fn); }
  } : null;
  /* Photos sent from a phone on the same network (PhoneUpload), and what is playing (NowPlayingService). */
  var phoneListeners = [];
  window.CleanFramePhoneChanged = function (count) { phoneListeners.forEach(function (fn) { try { fn(count); } catch (e) { } }); };
  var phone = {
    /* {enabled, url, count, place, feed}: url is empty while off or offline. */
    info: function () {
      var r;
      try { r = JSON.parse(bridge.phoneInfo()); } catch (e) { r = {}; }
      return { enabled: !!r.enabled, url: typeof r.url === 'string' ? r.url : '',
        count: +r.count || 0, place: typeof r.place === 'string' ? r.place : '', feed: typeof r.feed === 'string' ? r.feed : '', calendar: typeof r.calendar === 'string' ? r.calendar : '' };
    },
    /* Pairing QR code as a PNG data URL, '' while off or offline. Made on demand: it is slow to encode. */
    qr: function () { var q = ''; try { q = String(bridge.phoneQr() || ''); } catch (e) { } return /^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(q) ? q : ''; },
    enable: function (on) { try { bridge.phoneEnable(!!on); } catch (e) { } },
    /* Settings model for the companion's settings screens; the companion sends choices back through CleanFrameCompanionSet. */
    publish: function (json) { try { bridge.companionState(String(json)); } catch (e) { } },
    forget: function () { try { bridge.phoneForget(); } catch (e) { } },
    wallpaper: function (id) { try { bridge.phoneWallpaper(String(id)); } catch (e) { } },
    clear: function () { try { bridge.phoneClear(); } catch (e) { } },
    onChange: function (fn) { phoneListeners.push(fn); }
  };
  /* Headlines for the clock and the screensaver (News.java): Google News for the TV's language, a chosen outlet or the companion's feed. */
  var news = bridge.newsInfo ? {
    info: function () {
      var r;
      try { r = JSON.parse(bridge.newsInfo()); } catch (e) { r = {}; }
      var items = (r.items instanceof Array ? r.items : []).filter(function (i) { return i && typeof i.t === 'string' && i.t; }).map(function (i) { return { title: i.t, source: String(i.s || ''), time: +i.d || 0 }; });
      return { at: +r.at || 0, feed: String(r.feed || ''), items: items, error: !!r.error };
    },
    refresh: function (feed, force) { try { bridge.newsRefresh(String(feed || ''), !!force); } catch (e) { } }
  } : null;
  /* Installed icon packs (IconPacks.java) and the apps each one draws. */
  var icons = bridge.iconPacks ? {
    list: function () { try { return JSON.parse(bridge.iconPacks()).filter(function (p) { return p && typeof p.id === 'string' && typeof p.name === 'string'; }); } catch (e) { return []; } },
    apps: function (pack) { try { return JSON.parse(bridge.iconPackApps(String(pack))).filter(function (p) { return typeof p === 'string'; }); } catch (e) { return []; } }
  } : null;
  var nowPlaying = {
    /* lookup: allow a sharper cover and a wide artist picture from the internet (artist, title and album are sent). */
    info: function (lookup) {
      var r;
      try { r = JSON.parse(bridge.nowPlayingWith ? bridge.nowPlayingWith(!!lookup) : bridge.nowPlaying()); } catch (e) { r = {}; }
      var img = /^\/nowplaying\/[0-9a-f]+(-b)?\.jpg$/, wide = /^\/nowplaying\/a\/[0-9a-f]+\.jpg$/;
      return { access: !!r.access, playing: !!r.playing && typeof r.title === 'string', title: String(r.title || ''), artist: String(r.artist || ''), app: String(r.app || ''), pkg: /^[A-Za-z][A-Za-z0-9_.]{0,160}$/.test(r.pkg || '') ? r.pkg : '',
        art: img.test(r.art || '') ? r.art : '', back: img.test(r.back || '') ? r.back : '', wide: wide.test(r.wide || '') ? r.wide : '' };
    },
    openSettings: function (done) { reply(ask('nowPlayingSettings'), done, 'Notification access could not open.'); },
    /* toggle, next or prev; pkg finds the session again once it is paused. */
    /* The music view: playing or paused, with album, pos/dur (ms), speed and whether it can seek. */
    detail: bridge.nowPlayingDetail ? function (pkg, lookup) {
      var r, img = /^\/nowplaying\/[0-9a-f]+(-b)?\.jpg$/;
      try { r = JSON.parse(bridge.nowPlayingDetail(String(pkg || ''), !!lookup)) || {}; } catch (e) { r = {}; }
      if (!r.found || typeof r.title !== 'string') return { access: r.access !== false, found: false };
      return { access: true, found: true, playing: !!r.playing, title: r.title, artist: String(r.artist || ''), album: String(r.album || ''), app: String(r.app || ''),
        pkg: /^[A-Za-z][A-Za-z0-9_.]{0,160}$/.test(r.pkg || '') ? r.pkg : '', pos: Math.max(0, +r.pos || 0), dur: Math.max(0, +r.dur || 0), speed: +r.speed || 0, seek: !!r.seek,
        art: img.test(r.art || '') ? r.art : '', back: img.test(r.back || '') ? r.back : '',
        next: (r.next && r.next.filter ? r.next : []).filter(function (x) { return x && typeof x.title === 'string' && x.title; }).slice(0, 3).map(function (x) { return { title: x.title, artist: String(x.artist || '') }; }) };
    } : null,
    /* Beat pulse: start() is false without permission; level() is -1 while off, else 0..1. */
    beat: bridge.beatStart ? {
      start: function () { try { return !!bridge.beatStart(); } catch (e) { return false; } },
      stop: function () { try { bridge.beatStop(); } catch (e) { } },
      reset: function () { try { bridge.beatReset(); } catch (e) { } },
      level: function () { try { return +bridge.beat(); } catch (e) { return -1; } },
      allow: function () { try { bridge.beatAllow(); } catch (e) { } }
    } : null,
    seek: function (pkg, ms) { try { return !!bridge.nowPlayingSeek(String(pkg || ''), Math.max(0, ms | 0)); } catch (e) { return false; } },
    lyrics: function (artist, title, album, seconds) {
      var r;
      try { r = JSON.parse(bridge.lyrics(String(artist || ''), String(title || ''), String(album || ''), seconds | 0)) || {}; } catch (e) { r = {}; }
      return { state: /^(pending|ok|none|instrumental)$/.test(r.state) ? r.state : 'none', plain: String(r.plain || ''),
        synced: (r.synced && r.synced.filter ? r.synced : []).filter(function (l) { return l && typeof l[0] === 'number' && typeof l[1] === 'string'; }).map(function (l) {
          var w = l[2] && l[2].filter ? l[2].filter(function (x) { return x && typeof x[0] === 'number' && typeof x[1] === 'string'; }) : null;
          return w && w.length ? [l[0], l[1], w] : [l[0], l[1]];
        }) };
    },
    /* The lyric lines in lang, same count and order: state pending|ok|same|none. */
    translate: bridge.lyricsTranslate ? function (lines, lang) {
      var r;
      try { r = JSON.parse(bridge.lyricsTranslate(lines.join('\n'), String(lang || ''))) || {}; } catch (e) { r = {}; }
      if (r.state === 'ok' && r.lines && r.lines.length === lines.length) return { state: 'ok', lines: r.lines.map(function (l) { return String(l || ''); }) };
      return { state: /^(pending|same)$/.test(r.state) ? r.state : 'none', lines: [] };
    } : null,
    control: bridge.nowPlayingControl ? function (pkg, action) { try { return !!bridge.nowPlayingControl(String(pkg || ''), String(action)); } catch (e) { return false; } } : null
  };
  /* In-app updates: the native side checks the public releases, verifies the APK and opens Android's installer. */
  var updateListeners = [];
  window.CleanFrameUpdateChanged = function () { updateListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  var update = bridge.updateInfo ? {
    /* {status, error, progress, current, latest, title, size, auto, personal, canInstall} */
    info: function () {
      var r;
      try { r = JSON.parse(bridge.updateInfo()); } catch (e) { r = {}; }
      var states = ['idle', 'checking', 'current', 'available', 'downloading', 'ready', 'installing', 'error'];
      return { status: states.indexOf(r.status) >= 0 ? r.status : 'idle', error: String(r.error || ''), progress: Math.max(0, Math.min(100, +r.progress || 0)),
        current: String(r.current || ''), latest: String(r.latest || ''), title: String(r.title || ''), size: +r.size || 0,
        auto: r.auto !== false, personal: !!r.personal, canInstall: r.canInstall !== false };
    },
    check: function () { try { bridge.updateCheck(); } catch (e) { } },
    install: function () { try { bridge.updateInstall(); } catch (e) { } },
    auto: function (on) { try { bridge.updateAuto(!!on); } catch (e) { } },
    onChange: function (fn) { updateListeners.push(fn); }
  } : null;
  /* Home Assistant add-on (HomeAssistant.java): states read natively, the token never reaches the page. */
  var haListeners = [], haCamListeners = [];
  window.CleanFrameHAChanged = function () { haListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  window.CleanFrameHACamera = function (event) { if (event && typeof event.session === 'number') haCamListeners.forEach(function (fn) { try { fn(event); } catch (e) { } }); };
  var homeAssistant = bridge.haInfo ? {
    /* {configured, enabled, url, status: off|setup|loading|ok|error, error, at, areas:[{name, ids}], selected, states:{id: {s, n, u, c, t}}} */
    info: function () {
      var r;
      try { r = JSON.parse(bridge.haInfo()) || {}; } catch (e) { r = {}; }
      return { configured: !!r.configured, enabled: !!r.enabled, url: typeof r.url === 'string' ? r.url : '', status: /^(off|setup|loading|ok|error)$/.test(r.status) ? r.status : 'off',
        error: String(r.error || ''), at: +r.at || 0, areas: (r.areas instanceof Array ? r.areas : []).filter(function (a) { return a && typeof a.name === 'string' && a.ids instanceof Array; }),
        selected: (r.selected instanceof Array ? r.selected : []).filter(function (n) { return typeof n === 'string'; }), states: r.states && typeof r.states === 'object' ? r.states : {} };
    },
    enable: function (on) { try { bridge.haEnable(!!on); } catch (e) { } },
    areas: function (names) { try { bridge.haAreas(JSON.stringify(names || [])); } catch (e) { } },
    refresh: function () { try { bridge.haRefresh(); } catch (e) { } },
    toggle: function (id) { try { bridge.haToggle(String(id)); } catch (e) { } },
    call: bridge.haCall ? function (id, service, data) { try { bridge.haCall(String(id), String(service), JSON.stringify(data || {})); } catch (e) { } } : null,
    forget: function () { try { bridge.haForget(); } catch (e) { } },
    camera: {
      start: function (id) { try { return +bridge.haCameraStart(String(id)) || 0; } catch (e) { return 0; } },
      offer: function (session, sdp) { try { bridge.haCameraOffer(session | 0, String(sdp)); } catch (e) { } },
      hangup: function (session) { try { bridge.haCameraHangup(session | 0); } catch (e) { } },
      onEvent: function (fn) { haCamListeners.push(fn); }
    },
    onChange: function (fn) { haListeners.push(fn); }
  } : null;
  /* Shore's own screensaver: keeps the TV's screensaver away while enabled, and starts from a remote button. */
  var saver = {
    keepAwake: function (on) { try { bridge.keepAwake(!!on); } catch (e) { } },
    requested: function () { try { return !!bridge.saverRequested(); } catch (e) { return false; } },
    openSettings: function (done) { reply(ask('screensaverSettings'), done, 'Screensaver settings could not open.'); }
  };
  /* Next calendar event from the iCal address set on the phone: {title, start, allDay} or null. */
  var calendar = { next: function () { try { var e = JSON.parse(bridge.calendarNext()); return e && e.title ? e : null; } catch (x) { return null; } } };
  /* Sleep timer, kept by the Home-button service so it runs while other apps are open. */
  var sleep = {
    set: function (minutes) { try { return !!bridge.sleepIn(minutes | 0); } catch (e) { return false; } },
    /* Milliseconds until standby, 0 when off, -1 when the Home-button service is off. */
    left: function () { try { return +bridge.sleepLeft(); } catch (e) { return -1; } }
  };
  /* Native start screen: the page saves the wallpaper it shows and says when Home has painted. */
  var startup = {
    backdrop: function (dataUrl) { try { bridge.backdrop(String(dataUrl || '')); } catch (e) { } },
    ready: function () { try { bridge.pageReady(); } catch (e) { } }
  };
  window.FrameDevice = {
    platform: 'android', startup: startup, sleep: sleep, calendar: calendar, phone: phone, news: news, homeAssistant: homeAssistant, icons: icons, nowPlaying: nowPlaying, saver: saver, update: update,
    launch: launch, launchApp: launchApp, apps: apps, appInfo: appInfo,
    inputs: inputs, onInputs: function (fn) { inputListeners.push(fn); }, online: online, remote: remote, topShelf: topShelf, watchNext: watchNext,
    /* Android package behind a Home entry (for its TV banner); null for inputs and unknown IDs. */
    packageOf: function (id) { var brand = TIZEN[id] || BRAND[id] || (PACKAGES[id] ? id : ''), pkg = brand === 'youtube' ? FALLBACK.youtube : TIZEN[id] ? PACKAGES[TIZEN[id]] : PACKAGES[id] || id; // YouTube tile shows YouTube's banner
      return /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg) ? pkg : null; },
    /* No Art Mode on Android TV: Shore shows its own screensaver (main.js). */
    art: function (done) { reply(ask('screensaverSettings'), done, 'The screensaver could not start.'); },
    home: function (done) { reply(ask('systemHome'), done, 'The TV’s own Home screen could not open.'); },
    settings: function (done) { reply(ask('settings'), done, 'TV settings could not open.'); }
  };
}());
