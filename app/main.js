/* Shore Home. Static materials, local preferences and public Tizen app controls. */
(function () {
  'use strict';

  /* ---------- Bundled data ---------- */
  var ANDROID = !!(window.FrameDevice && FrameDevice.platform === 'android');
  /* Opened by the TV as its system screensaver (ShoreDream): only the screensaver shows. */
  var DREAM = /(^|#)screensaver$/.test(location.hash), SAVER_API = window.FrameDevice && FrameDevice.saver || null;
  var TV = ANDROID ? { brand: 'Google TV', home: 'Google TV Home', homeLine: 'Open the Google TV Home screen', art: 'Screensaver' }
    : { brand: 'Samsung', home: 'Samsung Home', homeLine: 'Open Samsung’s Home screen', art: 'Art Mode' };
  var ASSETS = 'assets/', ICONS = ASSETS + 'icons/', WP = ASSETS + 'wallpapers/';
  var CAP = 9, SCRIM_Y = 560;
  var DOCK_MODES = { both: { tw: 288, th: 200, pitch: 296 }, text: { tw: 288, th: 104, pitch: 296 }, icons: { tw: 176, th: 144, pitch: 184 }, shelf: { tw: 288, th: 250, pitch: 296 } };
  var GRID_ROW = 240, GRID_COL = 344, COLS = 5;
  var ED_ROW = 80, ED_SEP = 56, ED_VIEW = 752, STRIP_PITCH = 188;
  var PH_TOP = 220, PH_PITCH = 128, PH_FULL = 5, PH_HEIGHT = 944, PH_COMPACT_TOP = 144, PH_COMPACT_PITCH = 88, PH_COMPACT_VISIBLE = 9;
  var WALL_VISIBLE = 6, WALL_ROW = 92, WALL_DELAY = 200;
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back', 10009: 'back', 461: 'back' };
  var FULL = 'Home holds nine apps. Remove one first.', LAST = 'Home needs one app';

  var PRIMARY_APPS = [
    { id: 'stremio', name: 'Stremio', mark: true, appId: 'IkWsFHtOY9.Stremio' },
    { id: 'netflix', name: 'Netflix', mark: true, appId: 'org.tizen.netflix-app' },
    { id: 'disneyplus', name: 'Disney+', mark: true, appId: 'MCmYXNxgcu.DisneyPlus' },
    { id: 'youtube', name: 'YouTube', mark: true, appId: '9Ur5IzDKqV.TizenYouTube' },
    { id: 'appletv', name: 'Apple TV', mark: true, appId: 'com.samsung.tv.aria-video' },
    { id: 'primevideo', name: 'Prime Video', mark: true, appId: 'org.tizen.primevideo' },
    { id: 'abciview', name: 'ABC iview', mark: true, appId: 'mWK87Xghap.ABCiview' },
    { id: 'sbs', name: 'SBS On Demand', mark: true, appId: 'OyE7OuxlUi.SBSOnDemand' },
    { id: 'applemusic', name: 'Apple Music', mark: true, appId: 'org.tizen.apple.apple-music' }
  ];
  /* Bundled marks for apps outside the default Home list. */
  var EXTRA_MARKS = ['hbomax', 'spotify', 'tubi', 'joyn', 'waipu', 'twitch', 'ard', 'zdf', 'arte'];
  var PRIMARY = PRIMARY_APPS.map(function (a) { return a.id; }), APPS = PRIMARY_APPS.slice(), ALPHA = [];
  var WALLS = (window.CleanFrameWallpapers || [{ id: 'misty', name: 'Misty coast', tone: 'light', ut: { tr: 'mist', br: 'mist' }, frostVeil: .20 }])
    .concat(window.CleanFrameOnlineWallpapers || []);
  /* Online photo sources (Android shell only). Photos arrive pre-rendered, like the bundled gallery. */
  var ONLINE = window.FrameDevice && FrameDevice.online, ONLINE_INFO = ONLINE ? ONLINE.info() : { source: 'off', unsplash: false };
  var SOURCES = [{ id: 'builtin', name: 'Shore wallpapers' }, { id: 'phone', name: 'My photos', key: 'phone' }, { id: 'nasa', name: 'NASA Astronomy Picture' }, { id: 'nasalib', name: 'NASA Image Library' }, { id: 'bing', name: 'Bing Picture of the Day' },
    { id: 'wikimedia', name: 'Wikimedia Picture of the Day' }, { id: 'picsum', name: 'Random photos (Picsum)' },
    { id: 'unsplash-nature', name: 'Unsplash · Nature and landscapes', unsplash: true }, { id: 'unsplash-city', name: 'Unsplash · Cities and architecture', unsplash: true },
    { id: 'unsplash-space', name: 'Unsplash · Night sky and space', unsplash: true },
    { id: 'loops', name: 'Bundled loops', page: 'animated' }, { id: 'pexels-ocean', name: 'Pexels · Ocean waves', key: 'pexels', page: 'animated' },
    { id: 'pexels-rain', name: 'Pexels · Rain on glass', key: 'pexels', page: 'animated' }, { id: 'pexels-clouds', name: 'Pexels · Clouds', key: 'pexels', page: 'animated' },
    { id: 'pexels-city', name: 'Pexels · City at night', key: 'pexels', page: 'animated' }, { id: 'klipy-lofi', name: 'Klipy · Lofi', key: 'klipy', page: 'animated' },
    { id: 'klipy-rain', name: 'Klipy · Cozy rain', key: 'klipy', page: 'animated' }, { id: 'klipy-space', name: 'Klipy · Space', key: 'klipy', page: 'animated' }];
  SOURCES.forEach(function (o) { if (o.unsplash) { o.key = 'unsplash'; o.page = 'unsplash'; } else if (!o.page) o.page = 'online'; });
  var ONLINE_STATUS = { loading: 'Downloading wallpapers…', error: 'Couldn’t reach this source. Shore tries again later.', empty: 'No suitable landscape photos right now.', ready: 'New wallpapers arrive every few hours.', off: '' };

  var ADAPTIVE_INK = window.CleanFrameAdaptiveInk || {};
  WALLS.forEach(function (w) { w.ut = w.ut || { tr: 'light', br: 'light' }; w.frostVeil = w.frostVeil || .12; });
  var MODES = [
    { id: 'fixed', name: 'Fixed', min: 0 }, { id: 'open', name: 'Each time Home opens', min: 0 },
    { id: '5', name: 'Every 5 minutes', min: 5 }, { id: '15', name: 'Every 15 minutes', min: 15 }, { id: '30', name: 'Every 30 minutes', min: 30 },
    { id: '60', name: 'Every hour', min: 60 }, { id: 'day', name: 'Once a day', min: 1440 }
  ];
  var KEY = 'cleanframe.home.v1', storageOk = true, catalog = { loading: false, loaded: false, error: null, request: 0, revision: 0 };
  var QA = window.ShoreQA = { minuteMs: window.ShoreQA && window.ShoreQA.minuteMs || 60000 };
  var FONTS = {
    manrope: { name: 'Manrope', family: 'Manrope', display: 600, ui: 500, clock: 500 },
    montreal: { name: 'Neue Montreal', family: 'Study Montreal', display: 300, ui: 400, clock: 300 },
    mori: { name: 'Mori', family: 'Study Mori', display: 200, ui: 400, clock: 200 },
    pangram: { name: 'Pangram Sans', family: 'Study Pangram', display: 300, ui: 400, clock: 300 },
    geist: { name: 'Geist', family: 'Study Geist', display: 300, ui: 400, clock: 300 },
    newsreader: { name: 'Newsreader', family: 'Study Newsreader', display: 400, ui: 400, clock: 400 },
    inter: { name: 'Inter', family: 'Study Inter', display: 300, ui: 400, clock: 300 },
    outfit: { name: 'Outfit', family: 'Study Outfit', display: 300, ui: 400, clock: 300 },
    spacegrotesk: { name: 'Space Grotesk', family: 'Study Space Grotesk', display: 300, ui: 400, clock: 300 },
    sora: { name: 'Sora', family: 'Study Sora', display: 300, ui: 400, clock: 300 },
    playfair: { name: 'Playfair Display', family: 'Study Playfair', display: 400, ui: 400, clock: 400 }
  };
  var PRIVATE_FONTS = window.CleanFramePrivateFontIDs || [], fontMetrics = {}, unavailableFonts = {}, widthCache = {}, fontsReady = false;
  /* News sources for the headline under the clock. Outlets are offered by the TV's language, with a couple for everyone;
     "phone" is the RSS or Atom feed typed in the phone companion. Every feed was checked to answer plain RSS requests. */
  var NEWS_OUTLETS = [
    { id: 'bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', lang: 'en *' },
    { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', lang: 'en' },
    { id: 'npr', name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', lang: 'en' },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en' },
    { id: 'tagesschau', name: 'tagesschau', url: 'https://www.tagesschau.de/index~rss2.xml', lang: 'de' },
    { id: 'spiegel', name: 'DER SPIEGEL', url: 'https://www.spiegel.de/schlagzeilen/index.rss', lang: 'de' },
    { id: 'zeit', name: 'ZEIT ONLINE', url: 'https://newsfeed.zeit.de/index', lang: 'de' },
    { id: 'dw', name: 'DW', url: 'https://rss.dw.com/rdf/rss-de-all', lang: 'de' },
    { id: 'lemonde', name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', lang: 'fr' },
    { id: 'franceinfo', name: 'franceinfo', url: 'https://www.francetvinfo.fr/titres.rss', lang: 'fr' },
    { id: 'france24', name: 'France 24', url: 'https://www.france24.com/fr/rss', lang: 'fr' },
    { id: 'elpais', name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', lang: 'es' },
    { id: 'elmundo', name: 'El Mundo', url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', lang: 'es' },
    { id: 'bbcmundo', name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', lang: 'es' },
    { id: 'nos', name: 'NOS', url: 'https://feeds.nos.nl/nosnieuwsalgemeen', lang: 'nl' },
    { id: 'nunl', name: 'NU.nl', url: 'https://www.nu.nl/rss/Algemeen', lang: 'nl' },
    { id: 'tvn24', name: 'TVN24', url: 'https://tvn24.pl/najnowsze.xml', lang: 'pl' },
    { id: 'rmf24', name: 'RMF24', url: 'https://www.rmf24.pl/feed', lang: 'pl' },
    { id: 'pravda', name: 'Українська правда', url: 'https://www.pravda.com.ua/rss/', lang: 'uk' },
    { id: 'bbcua', name: 'BBC Україна', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml', lang: 'uk' }];
  var LOOK_VALUES = { bg: ['dark', 'light', 'photo'], layout: ['list', 'dock'], apps: ['icons', 'both', 'text'], font: Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0; }), controls: ['icons', 'both', 'text'], inputs: ['front', 'row'], lstyle: ['glass', 'shelf'], motion: ['still', 'drift'], tweight: ['auto', 'light', 'regular', 'bold'], tsize: ['small', 'default', 'large'],
    cformat: ['12', '24'], cdate: ['off', 'on'], cweather: ['off', 'on'], wunit: ['c', 'f'], cplaying: ['off', 'on'], cart: ['off', 'on'], clook: ['off', 'on'], saver: ['off', '5', '10', '15'], csize: ['small', 'medium', 'large', 'huge'], cweight: ['auto', 'thin', 'light', 'regular', 'bold'],
    night: ['off', 'scheduled', 'always'], nhours: ['20-7', '21-7', '22-6', '23-7'], ndim: ['soft', 'medium', 'strong'], idle: ['off', '1', '5'], focus: ['type', 'glass'], material: ['soft', 'frost', 'tint'],
    svsrc: ['like', 'every', 'builtin'], svlay: ['mix', 'single', 'mosaic'], svtime: ['15', '30', '60'], svmotion: ['still', 'drift'], iask: ['off', 'on'], ncalm: ['off', 'on'], wfx: ['off', 'on'], cnews: ['off', 'on'], svphoto: ['off', 'on'], svclock: ['off', 'on'], svdate: ['off', 'on'], svmusic: ['off', 'on'], wicon: ['off', 'on'], cwave: ['off', 'on'],
    cpos: ['left', 'center'], csec: ['off', 'on'], tint: ['none', 'warm', 'cool', 'rose', 'green'], dglass: ['clear', 'default', 'solid'], isize: ['small', 'default', 'large'], npdim: ['none', 'soft', 'strong'], svpos: ['move', 'fixed'], istyle: ['shore', 'original', 'mono'], cwatch: ['off', 'on'], plyric: ['off', 'on'], pword: ['off', 'on'], pbeat: ['off', 'on'], crecent: ['off', 'on'], ccal: ['off', 'on'], pqueue: ['off', 'on'], ptrans: ['off', 'on'], aha: ['off', 'on'],
    nsrc: ['google', 'phone'].concat(NEWS_OUTLETS.map(function (o) { return o.id; })) };
  /* Newer axes with their defaults: stored, migrated and validated like the others. */
  var MORE_LOOK = { svphoto: 'off', ncalm: 'off', wfx: 'off', cnews: 'off', iask: 'on', svsrc: 'like', svlay: 'mix', svtime: '30', svmotion: 'drift', svclock: 'on', svdate: 'on', svmusic: 'on', wicon: 'on', cwave: 'on', cpos: 'left', csec: 'off', tint: 'none', dglass: 'default', isize: 'default', npdim: 'none', svpos: 'move', nsrc: 'google', istyle: 'shore', cwatch: 'on', plyric: 'on', pword: 'on', pbeat: 'off', crecent: 'on', ccal: 'off', pqueue: 'on', ptrans: 'off', aha: 'off' };
  /* On/off settings that OK flips. */
  var TOGGLES = ['svphoto', 'ncalm', 'wfx', 'cnews', 'iask', 'cdate', 'cweather', 'cplaying', 'cart', 'clook', 'svclock', 'svdate', 'svmusic', 'wicon', 'cwave', 'csec', 'cwatch', 'plyric', 'pword', 'pbeat', 'crecent', 'ccal', 'pqueue', 'ptrans', 'aha'];
  var LOOK_NAMES = { bg: 'Background', layout: 'Layout', apps: 'Apps', font: 'Font', controls: 'Home controls', inputs: 'Inputs', motion: 'Motion', tweight: 'Text weight', tsize: 'App name size', cformat: 'Format', cdate: 'Date', cweather: 'Weather', wunit: 'Temperature', cplaying: 'Now playing', cart: 'Album art', clook: 'Artist pictures', saver: 'Screensaver', csize: 'Clock size', cweight: 'Clock weight',
    night: 'Night mode', nhours: 'Night hours', ndim: 'Night dimming', idle: 'Hide controls when idle', focus: 'Focus', material: 'Material',
    svphoto: 'Photo title', ncalm: 'Calmer photos at night', wfx: 'Weather effects', cnews: 'Headlines', iask: 'Ask to switch', svsrc: 'Screensaver photos', svlay: 'Arrangement', svtime: 'Each slide', svmotion: 'Photo motion', svclock: 'Clock', svdate: 'Date and weather', svmusic: 'Music', wicon: 'Weather icon', cwave: 'Level meter',
    cpos: 'Clock position', csec: 'Seconds', tint: 'Accent', dglass: 'App row glass', isize: 'Icon size', npdim: 'Album art dimming', svpos: 'Clock on the screensaver', nsrc: 'Source', istyle: 'Icon style', cwatch: 'Continue watching', plyric: 'Lyrics', pword: 'Word by word', pbeat: 'Beat pulse', crecent: 'Recently used', ccal: 'Calendar', pqueue: 'Up next', ptrans: 'Translate lyrics', aha: 'Home Assistant' };
  var VALUE_NAMES = { dark: 'Dark', light: 'Light', photo: 'Photo', list: 'List', dock: 'Dock', type: 'Type', glass: 'Glass', soft: 'Soft', frost: 'Frost', tint: 'Clear tint', icons: 'Icons', both: 'Icons and text', text: 'Text', front: 'First in Home', row: 'Own row', still: 'Still', drift: 'Drift', auto: 'Auto', thin: 'Thin', regular: 'Regular', bold: 'Bold', small: 'Small', 'default': 'Default', large: 'Large',
    medium: 'Medium', huge: 'Huge', '12': '12-hour', '24': '24-hour', on: 'Show', scheduled: 'Timed', always: 'Always', soft: 'Soft', strong: 'Strong',
    '20-7': '20–07', '21-7': '21–07', '22-6': '22–06', '23-7': '23–07', '1': 'After 1 min', '5': 'After 5 min', '10': 'After 10 min', '15': 'After 15 min', c: '°C', f: '°F',
    like: 'Like Home', every: 'Everything', builtin: 'Built-in', mix: 'Mixed', single: 'One photo', mosaic: 'Mosaics',
    left: 'Left', center: 'Centred', none: 'None', warm: 'Warm', cool: 'Cool', rose: 'Rose', green: 'Green', clear: 'Clear', solid: 'Solid', move: 'Moving', fixed: 'Fixed', shore: 'Shore', original: 'Original', mono: 'Monochrome' };
  VALUE_NAMES.off = 'Off'; VALUE_NAMES.light = VALUE_NAMES.light || 'Light';
  var UTIL = { music: ['Music', 'music'], art: [TV.art, 'art'], apps: ['All apps', 'apps'], arrange: ['Arrange', 'arrange'], settings: ['Settings', 'settings'], ha: ['Smart home', 'house'] };
  var MSG = {
    leave: { title: 'Leave Home?', line: 'Open ' + TV.home + '?', note: '', actions: [['stay', 'Stay'], ['samsung', TV.home]] },
    welcome: { title: 'Welcome to Shore', line: 'Set up the Home button, what’s playing, wallpapers and your phone.', note: '', actions: [['setup', 'Set up'], ['stay', 'Later']] },
    restored: { title: 'Settings restored', line: 'Photos on the TV haven’t changed; they aren’t part of a backup.', note: '', actions: [['stay', 'OK']] },
    clearphotos: { title: 'Remove all my photos?', line: 'They are deleted from the TV. Your phone keeps its own copies.', note: '', actions: [['stay', 'Keep them'], ['clearphotos', 'Remove']] },
    haforget: { title: 'Disconnect Home Assistant?', line: 'Shore forgets the server and its token. Connect again from your phone.', note: '', actions: [['stay', 'Keep it'], ['haforget', 'Disconnect']] }
  };
  var SVG = {
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    input: '<path d="M4.5 6.5h15a1.5 1.5 0 0 1 1.5 1.5v4l-3 4.5H6L3 12V8a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M7.5 10.5h9"/>',
    art: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.8" r="1.5"/><path d="m4.5 17.5 4.5-4.5 3 3 2.5-2.5 5 5"/>',
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    arrange: '<path d="M4 8.5h14M15 5.5l3 3-3 3M20 15.5H6M9 12.5l-3 3 3 3"/>',
    settings: '<path d="m9 3-.6 2.4-2 1.2L4 6l-2 3.5L3.8 11v2L2 14.5 4 18l2.4-.6 2 1.2L9 21h6l.6-2.4 2-1.2 2.4.6 2-3.5-1.8-1.5v-2L22 9.5 20 6l-2.4.6-2-1.2L15 3Z"/><circle cx="12" cy="12" r="3.2"/>',
    home: '<path d="M4 11 12 4.5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>',
    house: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10.2 15.6a2.6 2.6 0 1 1 3.6 0c-.5.5-.8 1-.8 1.6h-2c0-.6-.3-1.1-.8-1.6Z"/>',
    camera: '<rect x="3" y="6.5" width="13" height="11" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/>',
    /* Weather: same line style as the controls. */
    'w-sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    'w-moon': '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
    'w-partly': '<path d="M8.5 3.5v1.2M3.6 8.4h1.2M5 5l.9.9M13 5l-.9.9"/><path d="M5.6 11.4a3.6 3.6 0 0 1 6.5-2.9"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.6A3.8 3.8 0 0 0 8 19.5Z"/>',
    'w-partly-night': '<path d="M10.8 6.6A4.4 4.4 0 0 1 5.4 9.8a4.4 4.4 0 0 0 5.4-3.2Z"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.6A3.8 3.8 0 0 0 8 19.5Z"/>',
    'w-cloud': '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8-.6A4.3 4.3 0 0 0 7 18.5Z"/>',
    'w-fog': '<path d="M7 13.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 13.5Z"/><path d="M4 17h16M6.5 20.5h11"/>',
    'w-drizzle': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="M8.5 18v.5M12 18v.5M15.5 18v.5M10.3 21v.5M13.8 21v.5"/>',
    'w-rain': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="m9 17.5-1 3M13 17.5l-1 3M17 17.5l-1 3"/>',
    'w-snow': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="M8.5 18.5h.01M12 20.5h.01M15.5 18.5h.01M10.2 21.8h.01M13.8 21.8h.01" stroke-width="2.4"/>',
    'w-storm': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="m12.8 15.5-2.3 3.5h3l-2.2 3.5"/>',
    undo: '<path d="M9 6 5 10l4 4"/><path d="M5 10h9.5a4.5 4.5 0 0 1 0 9H11"/>',
    check: '<path d="m5.5 12.5 4 4 9-9"/>',
    play: '<path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z"/>',
    pause: '<rect x="6.5" y="5" width="3.8" height="14" rx="1"/><rect x="13.7" y="5" width="3.8" height="14" rx="1"/>',
    prev: '<path d="M18.5 6.2v11.6a.7.7 0 0 1-1.1.6L9.5 12.6a.7.7 0 0 1 0-1.2l7.9-5.8a.7.7 0 0 1 1.1.6Z"/><rect x="5.5" y="5.5" width="2.6" height="13" rx=".9"/>',
    next: '<path d="M5.5 6.2v11.6a.7.7 0 0 0 1.1.6l7.9-5.8a.7.7 0 0 0 0-1.2L6.6 5.6a.7.7 0 0 0-1.1.6Z"/><rect x="15.9" y="5.5" width="2.6" height="13" rx=".9"/>',
    lyrics: '<path d="M4.5 6h11M4.5 10.5h11M4.5 15h6"/><path d="M15.5 19v-6.5l4-1"/><circle cx="14" cy="19" r="1.6"/>',
    open: '<path d="M14 4.5h5.5V10"/><path d="m19.5 4.5-8 8"/><path d="M17 13.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    left: '<path d="m14.5 5-7 7 7 7"/>',
    right: '<path d="m9.5 5 7 7-7 7"/>',
    up: '<path d="m5 15.5 7-7 7 7"/>',
    down: '<path d="m5 8.5 7 7 7-7"/>',
    updown: '<path d="m7.5 9.5 4.5-4.5 4.5 4.5M7.5 14.5l4.5 4.5 4.5-4.5"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.3v.1"/>'
  };

  /* ---------- State ---------- */
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var S = {
    variant: 'B', geom: 'broad', c: null, stack: null,
    sel: null, selIdx: 0, lastUtil: 0, appsFocus: null, settingsFocus: 'background', appearanceFocus: 'bg', detailFocus: {},
    undo: [], removedAt: {}, note: null, err: null,
    writes: 0, failed: 0, log: [], logN: 0, lastLaunch: null, press: null,
    wallShown: null, wallPending: null, wallError: null,
    shown: null, pending: null, lookError: null, bundleKey: null, previewBundle: null, reflow: false, fontSwitch: false,
    phone: { enabled: false, url: '', qr: '', count: 0, place: '' }, update: null, playing: { access: false, playing: false, key: '' }, saver: false,
    remote: { service: false, keys: [], learning: false, missed: false, timer: 0 }
  };
  var scroll = { first: 0, off: 0, photo: 0, photoArrange: 0 };
  function pick(v, list, fallback) {
    v = String(v || '').toLowerCase();
    for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === v) return list[i];
    return fallback;
  }
  function lookOf(c) { return { bg: c.bg, wall: c.wall, layout: c.layout, apps: c.apps, font: c.font, controls: c.controls, inputs: c.inputs, lstyle: c.lstyle, motion: c.motion, tweight: c.tweight, tsize: c.tsize, cformat: c.cformat, cdate: c.cdate, cweather: c.cweather, wunit: c.wunit, cplaying: c.cplaying, cart: c.cart, clook: c.clook, saver: c.saver, csize: c.csize, cweight: c.cweight,
      night: c.night, nhours: c.nhours, ndim: c.ndim, idle: c.idle, focus: c.focus, material: c.material, svsrc: c.svsrc, svlay: c.svlay, svtime: c.svtime,
      svmotion: c.svmotion, iask: c.iask, ncalm: c.ncalm, wfx: c.wfx, cnews: c.cnews, svphoto: c.svphoto, svclock: c.svclock, svdate: c.svdate, svmusic: c.svmusic, wicon: c.wicon, cwave: c.cwave,
      cpos: c.cpos, csec: c.csec, tint: c.tint, dglass: c.dglass, isize: c.isize, npdim: c.npdim, svpos: c.svpos, nsrc: c.nsrc, istyle: c.istyle, ipack: c.ipack, cwatch: c.cwatch, plyric: c.plyric, pword: c.pword, pbeat: c.pbeat, crecent: c.crecent, ccal: c.ccal, pqueue: c.pqueue, ptrans: c.ptrans, aha: c.aha }; }
  function materialApplies(c) { c = c || S.c; return c.bg === 'photo' && (c.layout === 'dock' || c.focus === 'glass'); }

  /* ---------- Helpers ---------- */
  function app(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }
  function wall(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return WALLS[i]; return null; }
  function wallIndex(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return i; return 0; }
  function frostClass(w) { var i = [.12, .20, .30, .36, .44].indexOf(w.frostVeil); return i > 0 ? ' fv-' + (i + 1) : ''; }
  function wallClasses(w) { return frostClass(w) + (w.listColumn ? ' lc-' + w.listColumn : '') + (w.dockQuiet ? ' db-quiet' : '') + (w.clockMist ? ' tl-mist' : ''); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function without(list, id) { return list.filter(function (x) { return x !== id; }); }
  function same(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  /* Every visible string passes through esc() or T(), so the interface follows the TV language (app/i18n.js). */
  var T = window.CleanFrameI18n ? CleanFrameI18n.T : function (s) { return s; };
  function escRaw(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function esc(s) { return String(T(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function onHome(id) { return S.c.home.indexOf(id) >= 0; }
  /* Home as browsed: saved apps, then inputs with a powered-on device. Inputs are never saved. */
  var LIVE = [], INPUTS = [];
  function isShelf() { return S.c.layout === 'dock' && S.c.lstyle === 'shelf'; }
  function inputRow() { return S.c.inputs === 'row' && S.c.layout === 'dock' && LIVE.length > 0; }
  function visibleHome() { return (!LIVE.length || inputRow() ? S.c.home : LIVE.concat(S.c.home)).concat(recentApps()); }
  /* Recently used: up to three apps opened lately that aren't on Home, after the Home apps in the Dock. */
  function recentApps() {
    if (S.c.crecent !== 'on' || S.c.layout !== 'dock' || isShelf() || !S.c.used) return [];
    return S.c.used.filter(function (id) { var a = app(id); return a && !a.input && S.c.home.indexOf(id) < 0; }).slice(0, 3);
  }
  function top() { return S.stack[S.stack.length - 1]; }
  function push(e) { S.stack.push(e); return e; }
  function pop() { if (S.stack.length > 1) S.stack.pop(); if (S.stack.length === 1) S.unlocked = false; } // back at Home, a locked Settings asks again
  function px(n) { return n.toFixed(2) + 'px'; }
  function icon(name, cls, underlay) {
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">'
      + (underlay ? '<g class="ut-underlay" transform="translate(0 .5)">' + SVG[name] + '</g><g class="ut-ink">' + SVG[name] + '</g>' : SVG[name]) + '</svg>';
  }
  function badge(on) {
    return on
      ? '<svg class="badge is-on" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path class="badge-tick" d="m7.6 12.4 3 3 5.8-6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg class="badge is-off" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  function log(text) { S.log.unshift('#' + (++S.logN) + ' ' + text); if (S.log.length > 10) S.log.pop(); }

  var maskSupport = 'webkitMaskImage' in document.documentElement.style || 'maskImage' in document.documentElement.style, markProbes = {};
  function probeMark(id) {
    if (markProbes[id]) return;
    var im = new Image(); markProbes[id] = 'loading';
    im.onload = function () { markProbes[id] = 'ok'; };
    im.onerror = function () {
      markProbes[id] = 'bad';
      Array.prototype.forEach.call(document.querySelectorAll('[data-mark="' + id + '"]'), function (el) { el.className += ' is-bad'; });
    };
    im.src = ICONS + id + '.svg';
  }
  /* Optical placement is identical for the CSS mask and the image fallback. */
  function markHtml(id, w, h, size) {
    var m = window.FrameIconMetrics && window.FrameIconMetrics[id], st;
    if (m) {
      var weight = clamp(Math.pow(0.45 / m.fill, 0.3), 0.84, 1.25);
      var k = Math.min(w / m.w, h / m.h, size * weight / Math.sqrt(m.w * m.h)), s = m.n * k;
      st = 'width:' + px(s) + ';height:' + px(s) + ';left:' + px(w / 2 - (m.x + m.w / 2) * k) + ';top:' + px(h / 2 - (m.y + m.h / 2) * k);
    } else st = 'width:' + w + 'px;height:' + h + 'px;left:0;top:0;object-fit:contain';
    probeMark(id);
    return '<span class="mark' + (markProbes[id] === 'bad' ? ' is-bad' : '') + '" data-mark="' + id + '" style="width:' + w + 'px;height:' + h + 'px">'
      + (maskSupport ? '<span class="mk" style="' + st + ';-webkit-mask-image:url(' + ICONS + id + '.svg);mask-image:url(' + ICONS + id + '.svg)"></span>' : '<img alt="" src="' + ICONS + id + '.svg" style="' + st + '">') + '</span>';
  }
  /* ---------- App icons: Shore's own marks, the apps' own icons, a single-colour version, or an icon pack ---------- */
  var ICON_PACKS = ANDROID && FrameDevice.icons ? FrameDevice.icons : null, packApps = {}, packList = null;
  function packCovers(a) { return !!(S.c.ipack && a.appId && !a.input && packApps[S.c.ipack] && packApps[S.c.ipack][a.appId]); }
  function loadPack() {
    if (!ICON_PACKS || !S.c.ipack || packApps[S.c.ipack]) return;
    var set = {};
    ICON_PACKS.apps(S.c.ipack).forEach(function (pkg) { set[pkg] = true; });
    packApps[S.c.ipack] = set;
  }
  function iconPacks() { if (!packList) packList = ICON_PACKS ? ICON_PACKS.list() : []; return packList; }
  function packName(id) { var p = iconPacks().filter(function (x) { return x.id === id; })[0]; return p ? p.name : 'None'; }
  function iconKey() { return S.c.istyle + '|' + S.c.ipack + '|' + (packApps[S.c.ipack] ? 1 : 0) + '|' + JSON.stringify(S.c.iconFor || {}); }
  /* Shore's own logos, for the per-app icon choice. */
  function shoreMarks() { return Object.keys(window.FrameIconMetrics || {}).filter(function (id) { return /^[a-z0-9-]{1,40}$/.test(id); }).sort(); }
  function markName(id) {
    var named = APPS.filter(function (a) { return (a.brand || a.id) === id && a.mark; })[0];
    var fixed = { hdmi: 'HDMI', ard: 'ARD', zdf: 'ZDF', arte: 'ARTE', sbs: 'SBS', hbomax: 'HBO Max', waipu: 'waipu.tv', primevideo: 'Prime Video', art: 'Art Mode', apps: 'Apps', home: 'Home', settings: 'Settings' };
    return fixed[id] || (named ? named.name : id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '));
  }
  /* A square glyph the size of Shore's own marks, centred in the w x h box. */
  function maskIcon(src, w, h, size) {
    var side = Math.min(w, h, Math.round(size * 1.1));
    return '<span class="mark mono-icon" style="width:' + w + 'px;height:' + h + 'px"><span class="mk" style="left:' + Math.round((w - side) / 2) + 'px;top:' + Math.round((h - side) / 2) + 'px;width:' + side + 'px;height:' + side + 'px;-webkit-mask-image:url(' + src + ');mask-image:url(' + src + ')"></span></span>';
  }
  function appMark(a, w, h, size) {
    var pkg = a.appId && PKG_RE.test(a.appId) && !a.input ? a.appId : '', mono = S.c.istyle === 'mono' && maskSupport, own = S.c.iconFor && S.c.iconFor[a.id];
    if (own && own.indexOf('mark:') === 0 && shoreMarks().indexOf(own.slice(5)) >= 0 && (maskSupport || S.c.bg !== 'light')) return markHtml(own.slice(5), w, h, size);
    if (own === 'own' && pkg && ANDROID) return nativeMark(a, a.icon || '/appicon/' + pkg + '.png', w, h, size, true);
    if (own === 'mono' && pkg && ANDROID && maskSupport) return maskIcon('/appicon/mono/_/' + pkg + '.png', w, h, size);
    if (pkg && ANDROID) {
      if (packCovers(a)) return mono ? maskIcon('/appicon/mono/' + S.c.ipack + '/' + pkg + '.png', w, h, size) : nativeMark(a, '/appicon/pack/' + S.c.ipack + '/' + pkg + '.png', w, h, size, true);
      if (S.c.istyle === 'original') return nativeMark(a, a.icon || '/appicon/' + pkg + '.png', w, h, size, true);
      if (mono && !a.mark) return maskIcon('/appicon/mono/_/' + pkg + '.png', w, h, size);
    }
    return nativeMark(a, a.icon, w, h, size, false);
  }
  function nativeMark(a, icon, w, h, size, own) {
    if (a.mark && !own && (maskSupport || S.c.bg !== 'light')) return markHtml(a.brand || a.id, w, h, size);
    var words = a.name.split(/\s+/), letters = words[0].charAt(0) + (words.length > 1 ? words[1].charAt(0) : '');
    return '<span class="mark monogram' + (icon ? ' native-icon' : '') + '" style="width:' + w + 'px;height:' + h + 'px;font-size:' + Math.round(size * .65) + 'px"><span>' + esc(letters.toUpperCase()) + '</span>'
      + (icon ? '<img alt="" data-native-icon="true" src="' + esc(icon) + '">' : '') + '</span>';
  }
  function smallMark(a) { return appMark(a, 56, 44, 36); }
  var measureCanvas = document.createElement('canvas'), measureContext = measureCanvas.getContext('2d'), measureSpan = document.createElement('span');
  measureSpan.setAttribute('aria-hidden', 'true');
  measureSpan.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;white-space:pre;font-synthesis:none;';
  document.body.appendChild(measureSpan);
  function homeFont() { return S.shown && S.shown.font || 'manrope'; }
  function fontRole(id, role, size) {
    var f = FONTS[id], serif = id === 'newsreader';
    return { family: f.family,
      weight: role === 'display' ? f.display : role === 'clock' ? f.clock : serif ? 400 : f.ui,
      opsz: serif ? role === 'display' ? 72 : role === 'clock' ? 48 : role === 'ui' && (!size || size === 28) ? 28 : 36 : 0 };
  }
  function measureFace(id, faces) {
    var result = { roles: {}, digits: [], digitCell: 0 }, roles = { display: [88, 76, 56], clock: [48], primary: [30, 32, 34, 36, 40], ui: [28, 30, 48] };
    var face = id === 'newsreader' ? faces[0][0] : null, original = face ? face.variationSettings : '', r, widths, min, max;
    Object.keys(roles).forEach(function (role) {
      result.roles[role] = {};
      // Canvas has no optical-size property. Set this face's default only while measuring;
      // CSS specifies each rendered role explicitly, and the descriptor is restored below.
      roles[role].forEach(function (size) {
        r = fontRole(id, role, size);
        if (face) face.variationSettings = r.opsz ? '"opsz" ' + r.opsz : original;
        measureContext.font = r.weight + ' ' + size + 'px "' + r.family + '"';
        var m = measureContext.measureText('H'), d = measureContext.measureText('gjpqy');
        result.roles[role][size] = { cap: m.actualBoundingBoxAscent || size * .72, ascent: m.fontBoundingBoxAscent || size * 1.066, descent: m.fontBoundingBoxDescent || size * .3, lower: d.actualBoundingBoxDescent || size * .255 };
      });
    });
    if (face) face.variationSettings = original;
    r = fontRole(id, 'clock');
    measureSpan.style.font = r.weight + ' 48px/64px "' + r.family + '"';
    measureSpan.style.letterSpacing = '0'; measureSpan.style.fontVariantNumeric = 'tabular-nums';
    measureSpan.style.fontVariationSettings = r.opsz ? '"opsz" ' + r.opsz : 'normal';
    widths = '0123456789'.split('').map(function (n) { measureSpan.textContent = n; return measureSpan.getBoundingClientRect().width; });
    min = Math.min.apply(Math, widths); max = Math.max.apply(Math, widths);
    result.digits = widths; result.digitCell = max - min > .02 ? max : 0;
    return result;
  }
  function fontChoices() {
    LOOK_VALUES.font = Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0 && !unavailableFonts[id]; });
  }
  function retryFontFaces(id) {
    // A rejected CSS FontFace cannot load again. Recreate only that failed family's
    // rules; the displayed family's faces and the rest of the stylesheet stay intact.
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules, i, rule, family, css;
      try { rules = sheet.cssRules; } catch (e) { return; }
      if (!rules) return;
      for (i = 0; i < rules.length; i++) {
        rule = rules[i];
        if (rule.type !== 5) continue;
        family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
        if (family !== FONTS[id].family) continue;
        css = rule.cssText; sheet.deleteRule(i); sheet.insertRule(css, i);
      }
    });
  }
  /* Measuring a face forces a dozen layouts, about 100ms on the TV at start. The result only changes with the
     face file or the WebView, so it is kept per face and browser; bump FACE_REV when a bundled face changes. */
  var FACE_REV = 1;
  function faceKey(id) { return 'shore.face.' + FACE_REV + '.' + id + '|' + navigator.userAgent; }
  function savedFace(id) {
    try { var m = JSON.parse(localStorage.getItem(faceKey(id))); return m && m.roles && m.digits && m.digits.length === 10 ? m : null; } catch (e) { return null; }
  }
  function saveFace(id, m) { try { localStorage.setItem(faceKey(id), JSON.stringify(m)); } catch (e) { } return m; }
  function loadFont(id, done) {
    var f = FONTS[id], weights = [f.display], timer, ended = false;
    if (fontMetrics[id]) { done(true); return; }
    if (!document.fonts || !document.fonts.load) { if (id === 'manrope') { fontMetrics.manrope = measureFace('manrope', []); fontsReady = true; done(true); } else done(false, 'unsupported'); return; }
    if (unavailableFonts[id]) retryFontFaces(id);
    if (id !== 'newsreader' && weights.indexOf(f.ui) < 0) weights.push(f.ui);
    function finish(ok, reason, faces) {
      if (ended) return;
      ended = true; clearTimeout(timer);
      if (ok) {
        fontMetrics[id] = savedFace(id) || saveFace(id, measureFace(id, faces)); delete unavailableFonts[id];
        if (id === 'manrope') fontsReady = true;
      } else if (reason !== 'timeout') unavailableFonts[id] = true;
      fontChoices(); done(ok, reason);
    }
    timer = setTimeout(function () { finish(false, 'timeout'); }, 3000);
    Promise.all(weights.map(function (weight) { return document.fonts.load(weight + ' 88px "' + f.family + '"'); })).then(function (faces) {
      finish(faces.every(function (list) { return list.length > 0 && list.every(function (face) { return face.status === 'loaded'; }); }), 'load', faces);
    }, function () { finish(false, 'load'); });
  }
  var baselineRecovery = false;
  function ensureFont(id, done) {
    loadFont('manrope', function (ok, reason) {
      if (!ok && id === 'manrope') {
        // The local fallback keeps Home usable if the baseline face is slow or missing.
        fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true;
        done(true, reason);
        if (!baselineRecovery && document.fonts && document.fonts.ready) {
          baselineRecovery = true;
          document.fonts.ready.then(function () {
            delete fontMetrics.manrope; delete unavailableFonts.manrope;
            loadFont('manrope', function (loaded) {
              if (!loaded) { fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true; }
              render();
            });
          });
        }
        return;
      }
      if (!ok || id === 'manrope') done(ok, reason); else loadFont(id, done);
    });
  }
  function fontShift(role, size) {
    var id = homeFont(), base = fontMetrics.manrope, metrics = fontMetrics[id], a, b;
    if (id === 'manrope' || !base || !metrics) return 0;
    a = base.roles[role][size]; b = metrics.roles[role][size];
    return (a.ascent - a.descent - a.cap - b.ascent + b.descent + b.cap) / 2;
  }
  function textWidth(text, size, weight, spacing, role) {
    var id = homeFont(), r = fontRole(id, role || 'ui', size), key, width;
    if (id !== 'manrope') { weight = r.weight; spacing = role === 'display' ? -size * .01 : 0; }
    key = [id, role || 'ui', text, size, weight, spacing].join('|');
    if (widthCache.hasOwnProperty(key)) return widthCache[key];
    if (r.opsz) {
      measureSpan.style.font = weight + ' ' + size + 'px "' + r.family + '"';
      measureSpan.style.fontVariationSettings = '"opsz" ' + r.opsz;
      measureSpan.style.fontVariantNumeric = 'normal'; measureSpan.style.letterSpacing = '0'; measureSpan.textContent = text;
      width = measureSpan.getBoundingClientRect().width;
    } else {
      measureContext.font = (weight || 500) + ' ' + size + 'px "' + r.family + '", Arial, sans-serif';
      width = measureContext.measureText(text).width;
    }
    width += Math.max(0, text.length - 1) * (spacing || 0);
    // Do not retain fallback measurements made before the baseline font is ready.
    if (fontMetrics[id]) widthCache[key] = width;
    return width;
  }
  function dockLabelSize(id) { return S.c.apps === 'text' ? (textWidth(app(id).name, 40, 600, -.8, 'primary') > 264 ? 34 : 40) : textWidth(app(id).name, 36, 500, -.8, 'primary') > 280 ? 32 : 36; }
  function reducedDockLabel(id) { return S.c.apps !== 'icons' && dockLabelSize(id) === (S.c.apps === 'text' ? 34 : 32); }
  function actionWidth(text) { return clamp(Math.ceil(textWidth(text, 30, 500, -.3) + 40), 288, 400); }
  function photoLabel(id, compact) {
    var text = app(id).name, size = compact ? 56 : 88, limit = compact ? 640 : 992, width = textWidth(text, size, 600, -1.8, 'display');
    if (!compact && width > limit) { size = 76; width = textWidth(text, size, 600, -1.8, 'display'); }
    // Newsreader's ninth compact Type row otherwise enters the lower fade by .63px.
    return { size: size, top: (compact ? 10.66 : size === 76 ? 10.36 : 9.68) + fontShift('display', size) - (compact && homeFont() === 'newsreader' ? .7 : 0), width: Math.min(limit, width), ellipsis: width > limit };
  }
  function listPlateWidth(id, compact) {
    if (S.c.apps === 'icons') return compact ? 120 : 144;
    var text = S.c.apps === 'text';
    return clamp(Math.ceil(photoLabel(id, compact).width + (text ? 84 : compact ? 156 : 184)), text ? 280 : 360, text ? compact ? 724 : 1076 : compact ? 796 : 1176);
  }

  /* Keyed children: elements persist by key so transforms animate instead of re-creating.
     Children are absolutely positioned, so DOM order never needs to change. */
  function keyed(parent, items, update) {
    var map = parent._k || (parent._k = {}), seen = {}, i, it, el, isNew, k;
    for (i = 0; i < items.length; i++) {
      it = items[i]; el = map[it.key]; isNew = !el;
      if (isNew) { el = document.createElement('div'); map[it.key] = el; }
      update(el, it, i);
      if (isNew) parent.appendChild(el);
      seen[it.key] = 1;
    }
    for (k in map) if (map.hasOwnProperty(k) && !seen[k]) { if (map[k].parentNode === parent) parent.removeChild(map[k]); delete map[k]; }
  }
  function setContent(el, sig, html) {
    sig += '|' + catalog.revision + '|' + iconKey();
    if (el._sig === sig) return;
    el._sig = sig; el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll('[data-native-icon]'), function (img) {
      function ready() { img.parentNode.classList.add('has-native-icon'); }
      function failed() { img.style.display = 'none'; img.parentNode.classList.remove('has-native-icon'); }
      img.onload = ready; img.onerror = failed;
      if (img.complete) { if (img.naturalWidth) ready(); else failed(); }
    });
  }
  function setHTML(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function attrs(el, z, i, action) { el.setAttribute('data-z', z); el.setAttribute('data-i', String(i)); el.setAttribute('data-action', action); }

  /* ---------- Saved preferences ---------- */
  function safeId(id) { return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(id) && ['constructor', 'prototype', '__proto__'].indexOf(id) < 0; }
  function safeIcon(path) { return typeof path === 'string' && path.length < 2048 && /^(?:\/[^\/]|file:\/\/\/|wgt-package:\/\/\/)/.test(path) ? path : ''; }
  function load() {
    var keys = [KEY, 'cleanframe.shore.v1'], raw, saved, i;
    for (i = 0; i < keys.length; i++) {
      try {
        raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        saved = JSON.parse(raw);
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
      } catch (e) { storageOk = false; }
    }
    return null;
  }
  /* Favourite and hidden wallpapers: ids only, unique, capped. */
  var PKG_RE = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/;
  /* Per-app icon choices: app id -> 'own', 'mono' or 'mark:<Shore mark>'; apps not listed follow the icon style. */
  var ICON_CHOICE = /^(own|mono|mark:[a-z0-9-]{1,40})$/;
  function iconMap(v) {
    var out = {}, n = 0;
    if (v && typeof v === 'object') Object.keys(v).forEach(function (id) { if (n < 300 && safeId(id) && ICON_CHOICE.test(String(v[id]))) { out[id] = String(v[id]); n++; } });
    return out;
  }
  /* Parental lock: a hashed 4-digit PIN, whether Settings ask for it, and the apps that do. */
  function lockOf(v) {
    v = v && typeof v === 'object' ? v : {};
    var pin = /^[0-9a-f]{8}$/.test(String(v.pin || '')) ? String(v.pin) : '';
    return { pin: pin, settings: !!pin && v.settings === true, apps: pin ? idList(v.apps) : [] };
  }
  function idList(v) { var out = []; (Array.isArray(v) ? v : []).forEach(function (id) { if (safeId(id) && out.indexOf(id) < 0 && out.length < 300) out.push(id); }); return out; }
  function clean(saved) {
    var s = saved && typeof saved === 'object' ? saved : {}, modern = s.look && typeof s.look === 'object' ? s.look : s;
    var legacyList = s.theme === 'list', h = [], recent = [], records = Array.isArray(s.appRecords) ? s.appRecords : [];
    records.slice(0, 256).forEach(function (a) {
      if (!a || !safeId(a.id) || !safeId(a.appId) || typeof a.name !== 'string' || !a.name.trim() || app(a.id)) return;
      APPS.push({ id: a.id, appId: a.appId, name: a.name.slice(0, 160), brand: EXTRA_MARKS.indexOf(a.brand) >= 0 ? a.brand : '', mark: EXTRA_MARKS.indexOf(a.brand) >= 0, icon: safeIcon(a.icon) });
    });
    (Array.isArray(s.home) ? s.home : Array.isArray(s.dock) ? s.dock : []).forEach(function (id) {
      if (!safeId(id) || h.indexOf(id) >= 0 || h.length >= CAP) return;
      if (!app(id) && id.indexOf('.') > 0) APPS.push({ id: id, appId: id, name: id.split('.').pop(), mark: false });
      if (app(id)) h.push(id);
    });
    if (!h.length) h = PRIMARY.slice();
    (Array.isArray(s.recent) ? s.recent : []).forEach(function (id) { if (safeId(id) && app(id) && h.indexOf(id) < 0 && recent.indexOf(id) < 0 && recent.length < 5) recent.push(id); });
    var out = {
      bg: pick(modern.bg, LOOK_VALUES.bg, legacyList ? 'dark' : 'photo'), layout: pick(modern.layout, LOOK_VALUES.layout, legacyList ? 'list' : 'dock'),
      apps: pick(modern.apps, LOOK_VALUES.apps, legacyList ? 'text' : 'both'), controls: pick(modern.controls, LOOK_VALUES.controls, 'both'), inputs: pick(modern.inputs, LOOK_VALUES.inputs, 'front'), lstyle: pick(modern.lstyle, LOOK_VALUES.lstyle, 'glass'), motion: pick(modern.motion, LOOK_VALUES.motion, 'still'),
      tweight: pick(modern.tweight, LOOK_VALUES.tweight, 'auto'), tsize: pick(modern.tsize, LOOK_VALUES.tsize, 'default'),
      cformat: pick(modern.cformat, LOOK_VALUES.cformat, '12'), cdate: pick(modern.cdate, LOOK_VALUES.cdate, 'off'),
      cweather: pick(modern.cweather, LOOK_VALUES.cweather, 'off'), wunit: pick(modern.wunit, LOOK_VALUES.wunit, window.CleanFrameWeather ? CleanFrameWeather.defaultUnit() : 'c'), cplaying: pick(modern.cplaying, LOOK_VALUES.cplaying, 'on'),
      cart: pick(modern.cart, LOOK_VALUES.cart, 'on'), clook: pick(modern.clook, LOOK_VALUES.clook, 'on'), saver: pick(modern.saver, LOOK_VALUES.saver, ANDROID ? '10' : 'off'),
      csize: pick(modern.csize, LOOK_VALUES.csize, 'small'), cweight: pick(modern.cweight, LOOK_VALUES.cweight, 'auto'),
      night: pick(modern.night, LOOK_VALUES.night, 'off'), nhours: pick(modern.nhours, LOOK_VALUES.nhours, '22-6'),
      ndim: pick(modern.ndim, LOOK_VALUES.ndim, 'medium'), idle: pick(modern.idle, LOOK_VALUES.idle, 'off'),
      focus: pick(modern.focus, LOOK_VALUES.focus, legacyList ? 'type' : 'glass'), material: pick(modern.material, LOOK_VALUES.material, 'soft'),
      font: pick(modern.font, LOOK_VALUES.font, 'manrope'), wall: wall(modern.wall || s.wallpaper) ? modern.wall || s.wallpaper : WALLS[0].id,
      home: h, recent: recent, lastApp: h.indexOf(s.lastApp) >= 0 ? s.lastApp : h[0],
      mode: pick(s.mode, MODES.map(function (m) { return m.id; }), 'fixed'),
      source: sourceCsv(ONLINE ? ONLINE_INFO.source : 'builtin'),
      fav: idList(s.fav), hide: idList(s.hide), hidein: idList(s.hidein), iconFor: iconMap(s.iconFor), used: idList(s.used).slice(0, 8), lock: lockOf(s.lock),
      ipack: PKG_RE.test(String(modern.ipack || '')) ? String(modern.ipack) : ''
    };
    Object.keys(MORE_LOOK).forEach(function (k) { out[k] = pick(modern[k], LOOK_VALUES[k], MORE_LOOK[k]); });
    return out;
  }
  function serialise(c) {
    var out = {}, id;
    Object.keys(c).forEach(function (key) { out[key] = c[key]; });
    out.version = 2; out.look = lookOf(c); out.dock = c.home.slice(); out.wallpaper = c.wall;
    out.theme = c.layout === 'list' ? 'list' : 'shore';
    out.appRecords = [];
    c.home.concat(c.recent).forEach(function (key) {
      var a = app(key);
      if (a && PRIMARY.indexOf(key) < 0 && !out.appRecords.some(function (r) { return r.id === key; })) out.appRecords.push({ id: a.id, appId: a.appId, name: a.name, brand: a.brand || '', icon: a.icon || '' });
    });
    return out;
  }
  /* ---------- TV inputs ---------- */
  /* A device was just switched on while Home is showing: offer to switch to it (Layout › Inputs › Ask to switch). */
  var inputsSeen = false, askTimer = 0;
  function askInput(id) {
    var a = app(id), t = top();
    if (!a || S.c.iask !== 'on' || document.hidden || (t.id !== 'home' && !S.saver)) return;
    stopSaver();
    push({ id: 'message', content: { title: a.name + ' is on', line: 'Switch to it now?', note: '', actions: [['input:' + id, 'Switch'], ['stay', 'Stay']] }, f: { b: 0 } });
    render();
    clearTimeout(askTimer);
    askTimer = setTimeout(function () { var m = top(); if (m.id === 'message' && m.content && m.content.actions[0][0] === 'input:' + id) { pop(); render(); } }, 20000);
  }
  function refreshInputs() {
    if (!FrameDevice.inputs) return;
    FrameDevice.inputs(function (err, list) {
      var live = [];
      if (err) list = [];
      INPUTS = [];
      list.forEach(function (input) {
        var id = 'input.' + input.id.replace(/[^A-Za-z0-9._-]/g, '_'), a;
        if (!safeId(id)) return;
        a = app(id);
        if (!a) { a = { id: id }; APPS.push(a); }
        a.appId = input.id; a.name = input.name.slice(0, 160); a.brand = 'hdmi'; a.mark = true; a.input = true;
        INPUTS.push({ id: id, state: input.state });
        // Hidden inputs (a soundbar, say) never get a tile and never ask to be switched to.
        if (input.state === 0 && S.c.hidein.indexOf(id) < 0) live.push(id);
      });
      if (same(live, LIVE)) { inputsSeen = true; return; }
      var fresh = inputsSeen ? live.filter(function (id) { return LIVE.indexOf(id) < 0; }) : [];
      inputsSeen = true;
      LIVE = live; render();
      if (fresh.length) askInput(fresh[0]);
    });
  }
  function initialise() {
    var saved = load(), initial; S.c = clean(saved);
    S.firstRun = !saved && ANDROID; // a fresh install greets the owner with the setup checklist
    initial = next(S.c.home.slice(), S.c.recent.slice());
    S.stack = [{ id: 'home', f: { zone: 'apps', u: 0 } }];
    S.sel = S.c.lastApp; S.selIdx = S.c.home.indexOf(S.sel);
    // Each time Home opens: the next photo in rotation (chosen sources, favourites, never hidden ones).
    if (saved && initial.mode === 'open') { var pool = rotationPool(), at = pool.indexOf(wall(initial.wall)); initial.wall = pool[(at + 1) % pool.length].id; }
    // Keep the old schema keys alongside the builder values for in-place updates.
    try { localStorage.setItem(KEY, JSON.stringify(serialise(initial))); S.c = initial; storageOk = true; } catch (e) { storageOk = false; }
  }
  function clearSession() { S.undo = []; S.removedAt = {}; S.note = null; S.err = null; }
  function begin() { S.note = null; }
  function next(home, recent) { var c = lookOf(S.c); c.home = home; c.recent = recent; c.lastApp = S.c.lastApp; c.mode = S.c.mode; c.source = S.c.source; c.fav = S.c.fav.slice(); c.hide = S.c.hide.slice(); c.hidein = S.c.hidein.slice(); c.iconFor = iconMap(S.c.iconFor); c.used = S.c.used.slice(); c.lock = lockOf(S.c.lock); return c; }
  function snap() { return { home: S.c.home.slice(), recent: S.c.recent.slice() }; }
  function pushRecent(list, id) { return [id].concat(without(list, id)).slice(0, 5); }
  function write(c, label) {
    try { localStorage.setItem(KEY, JSON.stringify(serialise(c))); }
    catch (e) { storageOk = false; S.failed++; S.err = label; log('Not saved: ' + label); return false; }
    if (c.wall !== S.c.wall || c.mode !== S.c.mode) resetRotation();
    storageOk = true; S.c = c; S.writes++; S.err = null; log('Saved: ' + label);
    return true;
  }
  function errText(lifted) {
    return 'Couldn’t save. Nothing changed.';
  }
  function statusHtml(def, lifted) {
    if (S.err) return '<span class="warn error-chip">' + esc(errText(lifted)) + '</span>';
    return esc(S.note || def);
  }

  function ensureSel() {
    var h = visibleHome(), i;
    if (!h.length) { S.sel = null; return -1; }
    i = h.indexOf(S.sel);
    if (i < 0) { i = clamp(S.selIdx, 0, h.length - 1); S.sel = h[i]; }
    S.selIdx = i;
    return i;
  }
  function setSel(id) { S.sel = id; S.selIdx = visibleHome().indexOf(id); }

  /* Membership and order operations shared by B and C. A works on slots (below). */
  function homeRemove(id) {
    var a = app(id), i = S.c.home.indexOf(id), before = snap(), h;
    if (i < 0) return false;
    if (S.c.home.length <= 1) { S.note = LAST; return false; }
    h = S.c.home.slice(); h.splice(i, 1);
    if (!write(next(h, pushRecent(S.c.recent, id)), 'Remove ' + a.name + ' from Home')) return false;
    S.removedAt[id] = i;
    S.undo.push({ label: 'Remove ' + a.name, snap: before });
    return true;
  }
  function homeAdd(id) {
    var a = app(id), before = snap(), h = S.c.home.slice(), at;
    if (h.length >= CAP) { S.note = FULL; return false; }
    at = S.removedAt.hasOwnProperty(id) ? Math.min(S.removedAt[id], h.length) : h.length;
    h.splice(at, 0, id);
    if (!write(next(h, without(S.c.recent, id)), 'Add ' + a.name + ' to Home')) return false;
    S.undo.push({ label: 'Add ' + a.name, snap: before });
    return true;
  }
  function homeMove(order, id, before) {
    var a = app(id);
    if (!write(next(order, S.c.recent.slice()), 'Move ' + a.name)) return false;
    S.undo.push({ label: 'Move ' + a.name, snap: before });
    return true;
  }
  function undoLast(arr) {
    var u = S.undo[S.undo.length - 1];
    if (!u) { S.note = 'Nothing to undo'; return false; }
    if (!write(next(u.snap.home.slice(), u.snap.recent.slice()), 'Undo ' + u.label)) return false;
    S.undo.pop();
    S.note = 'Undone: ' + u.label + '.';
    return true;
  }
  function undoLabel() { var u = S.undo[S.undo.length - 1]; return u ? u.label : ''; }
  function undoCaption() { var label = undoLabel(); return label ? 'Undo ' + label.charAt(0).toLowerCase() + label.slice(1) : 'Nothing to undo'; }
  function editStatus(hint, move) {
    if (S.err) return statusHtml('', !!move);
    if (S.note === FULL || S.note === LAST) return '<span class="warn">' + esc(S.note) + '</span>';
    if (hint === FULL || hint === LAST) return '<span class="warn">' + esc(hint) + '</span>';
    return esc(move || hint || S.note || '');
  }

  var busy = false, busyTimer = 0;
  function release() { busy = false; clearTimeout(busyTimer); S.press = null; }
  function message(title, line, note) {
    push({ id: 'message', msg: 'error', content: { title: title, line: line, note: note || '', actions: [['back', 'Back']] }, f: { b: 0 } });
  }
  function perform(title, run) {
    if (busy) return;
    busy = true; busyTimer = setTimeout(release, 10000);
    run(function (err) {
      release();
      if (err) message(title, err.message || 'The TV could not open this screen.', err.detail || '');
      render(); syncRotation();
    });
  }
  function launch(id) {
    var a = app(id), c;
    if (!a || busy) return;
    if (appLocked(id)) { askPin(a.name, function () { S.unlockedApp = id; launch(id); }); return; }
    S.unlockedApp = '';
    c = next(S.c.home.slice(), S.c.recent.slice());
    if (S.c.home.indexOf(id) >= 0) c.lastApp = id;
    if (!a.input) c.used = [id].concat(without(c.used, id)).slice(0, 8);
    write(c, 'Last app');
    S.press = id; S.lastLaunch = a.name;
    perform(a.name, function (done) { FrameDevice.launchApp(a.appId, done); });
  }
  /* Top Shelf: deep link into the tile's app where it supports one, otherwise launch it. */
  function openRec(id, it) {
    var a = app(id);
    if (!a || !it || busy) return;
    if (appLocked(id)) { askPin(a.name, function () { S.unlockedApp = id; openRec(id, it); }); return; }
    S.unlockedApp = '';
    S.press = id; S.lastLaunch = a.name;
    perform(a.name, function (done) { SHELF.open(a.appId, it.url, done); });
  }
  function openWatch(it) {
    var owner = it && lockOwner(it.pkg);
    if (!it || busy) return;
    if (owner) { askPin(app(owner).name, function () { S.unlockedApp = owner; openWatch(it); }); return; }
    S.unlockedApp = '';
    S.lastLaunch = it.title;
    perform(it.title, function (done) { WATCH.open(it.watch, done); });
  }
  function refreshCatalog() {
    var request, oldFocus;
    if (catalog.loading) return;
    request = ++catalog.request; catalog.loading = true; catalog.error = null;
    FrameDevice.apps(function (err, entries) {
      if (request !== catalog.request) return;
      catalog.loading = false;
      if (err) { catalog.error = err.message || 'Could not read installed apps.'; if (!catalog.loaded) ALPHA = []; render(); return; }
      oldFocus = top().id === 'apps' ? ALPHA[top().f.i] : null;
      ALPHA = [];
      entries.forEach(function (entry) {
        var id = PRIMARY.indexOf(entry.brand) >= 0 ? entry.brand : entry.appId, a;
        if (!safeId(id) || !safeId(entry.appId) || ALPHA.indexOf(id) >= 0) return;
        a = app(id);
        if (!a) { a = { id: id }; APPS.push(a); }
        a.appId = entry.appId; a.brand = entry.brand || ''; a.mark = !!entry.brand;
        a.icon = safeIcon(entry.icon);
        a.name = PRIMARY.indexOf(id) >= 0 ? PRIMARY_APPS[PRIMARY.indexOf(id)].name : String(entry.name).slice(0, 160);
        ALPHA.push(id);
      });
      ALPHA.sort(function (a, b) { return app(a).name.toLowerCase().localeCompare(app(b).name.toLowerCase()); });
      catalog.loaded = true; catalog.error = null; catalog.revision++;
      if (top().id === 'apps' && oldFocus && ALPHA.indexOf(oldFocus) >= 0) top().f.i = ALPHA.indexOf(oldFocus);
      norm(); render();
    });
  }

  /* ---------- Navigation targets ---------- */
  function utils() { return ['art', 'apps', 'settings'].concat(haShown() ? ['ha'] : []).concat(musicAvailable() ? ['music'] : []); } // music last, so the other buttons keep their places
  /* ---------- Music controls: a Home button while something plays (and for 10 minutes after a pause) ---------- */
  var musicPaused = null;
  function musicAvailable() { return !!(NOWPLAYING && NOWPLAYING.control && S.playing && S.playing.access && (S.playing.playing || (musicPaused && Date.now() < musicPaused.until))); }
  function openMusic(b) {
    var p = S.playing.playing ? S.playing : musicPaused || {}, paused = !S.playing.playing;
    if (!S.playing.playing && !musicPaused) return;
    if (NOWPLAYING.detail) { openPlayer(p.pkg); return; }
    push({ id: 'message', content: { title: p.title || 'Music', line: (p.artist || '') + (p.artist && p.app ? ' — ' : '') + (p.app || ''), note: '',
      actions: [['np.prev', 'Previous'], ['np.toggle', paused ? 'Play' : 'Pause'], ['np.next', 'Next']] }, f: { b: b === undefined ? 1 : b } });
    render();
  }
  function musicAction(a, b) {
    var p = S.playing.playing ? S.playing : musicPaused || {}, action = a.slice(3);
    if (!NOWPLAYING.control(p.pkg, action)) { S.note = 'Couldn’t control the music.'; render(); return; }
    if (action === 'toggle' && S.playing.playing) { musicPaused = { title: p.title, artist: p.artist, app: p.app, pkg: p.pkg, until: Date.now() + 600000 }; S.playing.playing = false; }
    else if (action === 'toggle') { S.playing.playing = true; S.playing.title = p.title; S.playing.artist = p.artist; S.playing.app = p.app; S.playing.pkg = p.pkg; }
    openMusic(b);
    setTimeout(pollPlaying, 900); // the session reports the new state (or the next title) shortly after
  }
  /* ---------- Music view: cover, progress, controls and synced lyrics ----------
     Detail comes from the media session (NowPlayingService.detail) once a second; between polls the position
     runs on locally. Lyrics come from LRCLIB through Lyrics.java and follow the position line by line. */
  var PB = ['prev', 'toggle', 'next', 'lyrics', 'app'], SEEK_STEP = 10000;
  var P = { d: null, at: 0, pkg: '', ly: null, tr: null, lyKey: '', poll: 0, tick: 0, seekTo: -1, seekUntil: 0 };
  function openPlayer(pkg) {
    P.pkg = pkg || ''; P.d = null; P.ly = null; P.tr = null; P.lyKey = ''; P.seekTo = -1;
    push({ id: 'player', f: { zone: 'buttons', b: 1 } });
    playerPoll(); render();
  }
  function playerOpen() { return top().id === 'player'; }
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
    var B = NOWPLAYING && NOWPLAYING.beat, want = !!B && playerOpen() && S.c.pbeat === 'on' && !document.hidden, v, el = slotEls;
    clearTimeout(beatTimer); beatTimer = 0;
    if (!want) { if (beatOn) { B.stop(); beatOn = false; } beatV = 0; if (el.back) { el.back.style.transform = ''; el.art.style.transform = ''; } return; }
    if (!beatOn) beatOn = B.start();
    if (!beatOn) return; // no permission: the Settings switch asks for it
    v = Math.max(0, B.level());
    beatV = v > beatV ? v : beatV * .7; // hits at once, falls back quickly
    if (el.back) { el.back.style.transform = 'scale(' + (1.08 + beatV * .04).toFixed(4) + ')'; el.art.style.transform = 'scale(' + (1 + beatV * .02).toFixed(4) + ')'; }
    beatTimer = setTimeout(beatLoop, 33);
  }
  window.CleanFrameBeatAllowed = function () { render(); };

  /* A light timer while the view is open: the bar, the clock digits and the lyric line, nothing else. */
  function playerTick() {
    clearTimeout(P.tick); P.tick = 0;
    if (!playerOpen()) { beatLoop(); return; }
    if (!document.hidden) FILLS.player(top(), slotEls, true);
    P.tick = setTimeout(playerTick, 250);
  }

  /* prev/next run along the apps; out goes to the controls, inn comes back (or to a per-app action). */
  function axes() {
    var v = S.c.layout === 'list';
    return { prev: v ? 'up' : 'left', next: v ? 'down' : 'right', out: v ? 'right' : 'up', inn: v ? 'left' : 'down' };
  }
  function utilAction(u) {
    if (u === 'music') openMusic();
    else if (u === 'art') { if (ANDROID) startSaver(); else perform(TV.art, FrameDevice.art); }
    else if (u === 'apps') openApps();
    else if (u === 'ha') openHa();
    else guarded(openSettings);
  }
  function addAppsRoute() { guarded(function () { openEditor('home'); }); }
  /* ---------- Quick actions: a long OK on a Home app tile ---------- */
  var LONG_OK = 600, longOk = { code: 0, timer: 0 };
  function quickTarget() {
    var t = top();
    if (t.id !== 'home') return '';
    if (t.f.zone === 'input' && inputRow()) return LIVE[t.f.n] || '';
    return t.f.zone === 'apps' && S.sel && (S.c.home.indexOf(S.sel) >= 0 || LIVE.indexOf(S.sel) >= 0) ? S.sel : '';
  }
  function holdAction() {
    var id = quickTarget(), item = haHeld();
    return id ? function () { openQuick(id); } : item ? function () { openHaControl(item); } : null;
  }
  function openQuick(id) {
    var a = app(id);
    if (!a || top().id !== 'home') return;
    if (settingsLocked()) { askPin('Settings', function () { S.unlocked = true; openQuick(id); }); return; }
    if (a.input) { push({ id: 'message', content: { title: a.name, line: 'Quick actions', note: '', actions: [['quick.open:' + id, 'Switch'], ['quick.hidein:' + id, 'Hide from Home']] }, f: { b: 0 } }); render(); return; }
    push({ id: 'message', content: { title: a.name, line: 'Quick actions', note: '',
      actions: [['quick.open:' + id, 'Open'], ['quick.move:' + id, 'Move'], ['quick.icon:' + id, 'Icon'], ['quick.remove:' + id, 'Remove']].concat(FrameDevice.appInfo ? [['quick.info:' + id, 'App info']] : []) }, f: { b: 0 } });
    render();
  }
  function quickAction(a) {
    var kind = a.slice(6, a.indexOf(':')), id = a.slice(a.indexOf(':') + 1), t;
    if (!app(id)) return;
    if (kind === 'open') { launch(id); return; }
    if (kind === 'hidein') { toggleInput(id); return; }
    if (kind === 'info') { perform('App info', function (done) { FrameDevice.appInfo(app(id).appId, done); }); return; }
    if (kind === 'icon') { openAppIcon(id, true); return; }
    // Move and Remove use Apps on Home, which already has undo, so nothing here is final.
    S.sel = id; if (settingsLocked()) { guarded(function () { openEditor('home'); }); return; } openEditor('home'); t = top(); t.f.zone = 'home'; t.f.i = Math.max(0, S.c.home.indexOf(id));
    if (kind === 'move') { t.f.part = 'name'; t.lifted = { id: id, from: t.f.i, order: S.c.home.slice(), snap: snap() }; }
    else { t.f.part = 'remove'; editorRemove(t, id); }
  }
  function openSettings() { push({ id: 'settings', f: { id: S.settingsFocus } }); }
  function openAppearance(group) {
    var axis = { background: 'bg', layout: 'layout', typography: 'tweight', fonts: 'font', focus: 'focus', clock: 'cformat', display: 'night', screensaver: 'saver', weather: 'wunit', news: 'nsrc', saverlook: 'svlay', musicview: 'plyric', music: 'npdim', icons: 'istyle', inputs: 'inputs' }[group];
    var action = S.detailFocus[group] || (axis ? 'choice.' + axis + '.' + S.c[axis] : group === 'rotation' ? 'rotation.' + S.c.mode : PARENT[group] === 'online' || group === 'online' ? 'online.' + sourceList()[0] : group === 'updates' ? updateSections()[0].items[0].action : group === 'health' ? (healthItems()[0] || {}).action : 'samsung.home');
    push({ id: 'appearance', group: group, f: { action: action } });
  }
  /* Per-app icon: from Quick actions on Home, or Settings › App icons › Per app. */
  function openAppIcon(id, fromHome) {
    var cur = S.c.iconFor[id];
    openAppearance('appicon');
    top().app = id; top().fromHome = !!fromHome; top().f.action = 'iconset.' + (cur || 'auto');
    render();
  }
  function setAppIcon(id, value) {
    var c = next(S.c.home.slice(), S.c.recent.slice());
    if (value === 'auto') delete c.iconFor[id]; else if (ICON_CHOICE.test(value)) c.iconFor[id] = value; else return;
    if (write(c, 'App icon')) render();
  }
  function iconChoiceName(id) {
    var cur = S.c.iconFor[id];
    return !cur ? 'Automatic' : cur === 'own' ? 'App’s own icon' : cur === 'mono' ? 'One colour' : markName(cur.slice(5));
  }
  /* The mark the icon style would draw, for the Automatic row. */
  function autoMark(a, w, h, size) {
    var saved = S.c.iconFor[a.id], html;
    delete S.c.iconFor[a.id]; html = appMark(a, w, h, size);
    if (saved) S.c.iconFor[a.id] = saved;
    return html;
  }
  /* ---------- Parental lock ---------- */
  function pinHash(pin) { var h = 0x811c9dc5, s = 'shore:' + pin, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0; } /* FNV-1a, exact in 32 bits */ return ('0000000' + h.toString(16)).slice(-8); }
  function settingsLocked() { return !!S.c.lock.pin && S.c.lock.settings && !S.unlocked; }
  function appLocked(id) { return !!S.c.lock.pin && S.c.lock.apps.indexOf(id) >= 0 && S.unlockedApp !== id; }
  /* The Home app a Continue watching card belongs to, when that app is locked. */
  function lockOwner(pkg) { var hit = ''; S.c.lock.apps.forEach(function (id) { var a = app(id); if (a && a.appId === pkg && appLocked(id)) hit = id; }); return hit; }
  function guarded(fn) { if (settingsLocked()) askPin('Settings', function () { S.unlocked = true; fn(); }); else fn(); }
  /* PIN entry: up and down change the digit, left and right move, number keys type. Four digits check at once. */
  function askPin(what, then) { push({ id: 'pin', step: 'check', what: what, then: then, digits: [], cur: 0, err: '', f: {} }); render(); }
  function choosePin() { push({ id: 'pin', step: 'new', what: '', then: null, digits: [], cur: 0, err: '', f: {} }); render(); }
  function pinEntered(t) {
    var pin = t.digits.join(''), c, then;
    if (t.step === 'check') {
      if (pinHash(pin) !== S.c.lock.pin) { t.digits = []; t.cur = 0; t.err = 'Wrong PIN'; t.shake = (t.shake || 0) + 1; return; }
      then = t.then; pop(); if (then) then(); return;
    }
    if (t.step === 'new') { t.first = pin; t.step = 'again'; t.digits = []; t.cur = 0; t.err = ''; return; }
    if (pin !== t.first) { t.step = 'new'; t.digits = []; t.cur = 0; t.err = 'The PINs didn’t match. Choose one again.'; return; }
    c = next(S.c.home.slice(), S.c.recent.slice()); c.lock.pin = pinHash(pin);
    pop(); S.unlocked = true;
    if (write(c, 'PIN')) S.note = 'PIN saved';
  }
  function lockToggle(what) {
    var c = next(S.c.home.slice(), S.c.recent.slice()), i;
    if (!c.lock.pin) return;
    if (what === 'settings') c.lock.settings = !c.lock.settings;
    else { i = c.lock.apps.indexOf(what); if (i >= 0) c.lock.apps.splice(i, 1); else c.lock.apps.push(what); }
    if (write(c, 'Parental lock')) render();
  }
  function lockOff() { var c = next(S.c.home.slice(), S.c.recent.slice()); c.lock = lockOf(null); if (write(c, 'Parental lock')) render(); }
  function openMessage(key) { push({ id: 'message', msg: key, f: { b: 0 } }); }
  function openApps() {
    var e = { id: 'apps', mode: 'browse', top: 0, f: { zone: 'grid', i: Math.max(0, ALPHA.indexOf(S.appsFocus)), h: 0 } };
    push(e); refreshCatalog(); return e;
  }
  function openEditor(origin) {
    var i = ensureSel();
    clearSession();
    refreshCatalog();
    push({ id: 'editor', origin: origin, lifted: null, top: 0, otherReturn: { id: otherList()[0] || null, index: 0, top: 0 }, f: { zone: S.c.home.length ? 'home' : 'other', i: Math.max(0, i), part: 'name', h: 1, j: 0 } });
  }
  function openWallpaper() {
    var i = wallIndex(S.c.wall);
    S.err = null; S.wallError = null;
    push({ id: 'wallpaper', i: i, top: clamp(i - 2, 0, Math.max(0, WALLS.length - WALL_VISIBLE)), f: { zone: 'photo' },
      previewTimer: 0, previewDue: null, applyPending: null, failedId: null, failedApply: false, retryBundle: null });
  }
  function isSettingsDetail(t) { return t.id === 'appearance' || t.id === 'wallpaper'; }

  var V = {};

  /* ---------- Home (browse) ---------- */
  V.home = {
    key: function (t, k) {
      var f = t.f, h = visibleHome(), U = utils(), x = axes(), i = ensureSel();
      if (S.c.layout === 'list') { listHomeKey(t, k, i, U); return; }
      if (f.zone === 'input') {
        if (!inputRow()) f.zone = 'apps';
        else {
          f.n = clamp(f.n || 0, 0, LIVE.length - 1);
          if (k === 'left' && f.n > 0) f.n--;
          else if (k === 'right' && f.n < LIVE.length - 1) f.n++;
          else if (k === 'down' || k === 'back') f.zone = 'apps';
          else if (k === 'up') { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
          else if (k === 'ok') launch(LIVE[f.n]);
          return;
        }
      }
      if (f.zone === 'util') {
        f.u = clamp(f.u, 0, U.length - 1);
        if (k === x.prev && f.u > 0) f.u--;
        else if (k === x.next && f.u < U.length - 1) f.u++;
        else if (k === x.inn && inputRow()) { f.zone = 'input'; f.n = clamp(f.n || 0, 0, LIVE.length - 1); }
        else if (k === x.inn || k === 'back') f.zone = 'apps';
        else if (k === 'ok') { S.lastUtil = f.u; utilAction(U[f.u]); return; }
        S.lastUtil = f.u;
        return;
      }
      if (f.zone === 'recs') {
        var R = recsFor(S.sel);
        if (!R) f.zone = 'apps';
        else {
          f.r = clamp(f.r || 0, 0, R.items.length - 1);
          if (k === 'left' && f.r > 0) f.r--;
          else if (k === 'right' && f.r < R.items.length - 1) f.r++;
          else if (k === 'up' || k === 'back') f.zone = 'apps';
          else if (k === 'ok') { if (R.items[f.r].watch) openWatch(R.items[f.r]); else openRec(S.sel, R.items[f.r]); }
          return;
        }
      }
      f.zone = 'apps';
      if (k === x.out && inputRow()) { f.zone = 'input'; f.n = clamp(f.n || 0, 0, LIVE.length - 1); }
      else if (k === x.inn && recsFor(S.sel)) { f.zone = 'recs'; f.r = 0; }
      else if (k === x.out) { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
      else if (k === 'back') openMessage('leave');
      else if (!h.length) { if (k === 'ok') addAppsRoute(); }
      else if (k === x.prev && i > 0) setSel(h[i - 1]);
      else if (k === x.next && i < h.length - 1) setSel(h[i + 1]);
      else if (k === 'ok') launch(S.sel);
    },
    point: function (t, z, i) {
      if (z === 'util') { t.f.zone = 'util'; t.f.u = i; S.lastUtil = i; }
      else if (z === 'input') { t.f.zone = 'input'; t.f.n = i; }
      else if (z === 'app') { t.f.zone = 'apps'; setSel(visibleHome()[i]); }
      else if (z === 'empty') t.f.zone = 'apps';
      else return;
      this.key(t, 'ok');
    }
  };
  function listHomeKey(t, k, i, U) {
    var f = t.f, h = visibleHome();
    if (f.zone === 'util') {
      f.u = clamp(f.u, 0, U.length - 1);
      if (k === 'up' && f.u > 0) f.u--;
      else if (k === 'down' && f.u < U.length - 1) f.u++;
      else if (k === 'left' || k === 'back') f.zone = 'apps';
      else if (k === 'ok') { S.lastUtil = f.u; utilAction(U[f.u]); return; }
      S.lastUtil = f.u;
      return;
    }
    f.zone = 'apps';
    if (k === 'up' && i > 0) setSel(h[i - 1]);
    else if (k === 'right') { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
    else if (k === 'down' && i < h.length - 1) setSel(h[i + 1]);
    else if (k === 'back') openMessage('leave');
    else if (k === 'ok') { if (h.length) launch(S.sel); else addAppsRoute(); }
  }

  /* ---------- Wallpaper child: focus previews, activation applies ---------- */
  function cancelWallpaperTimer(t) {
    clearTimeout(t.previewTimer); t.previewTimer = 0; t.previewDue = null;
  }
  function failWallpaper(t, id, apply, bundle) {
    t.applyPending = null; t.failedId = id; t.failedApply = apply; t.retryBundle = bundle || null;
    restoreLook();
    if (!bundle) S.wallError = id;
  }
  function applyWallpaper(t, prepared) {
    var w = WALLS[t.i], c, bundle = prepared || S.previewBundle;
    if (!prepared && (S.wallPending || t.previewDue || S.wallShown !== w.id || S.wallError)) {
      t.applyPending = w.id;
      if (t.previewDue || S.wallPending !== w.id) { cancelWallpaperTimer(t); loadWallpaperPreview(t); }
      return;
    }
    t.applyPending = null;
    if (w.id === S.c.wall) { S.err = null; t.failedId = null; t.failedApply = false; t.retryBundle = null; return; }
    if (!bundle || bundle.key !== bundleKey({ wall: w.id, material: S.c.material })) { t.applyPending = w.id; loadWallpaperPreview(t); return; }
    c = next(S.c.home.slice(), S.c.recent.slice()); c.wall = w.id;
    if (!write(c, 'Wallpaper ' + w.name)) { failWallpaper(t, w.id, true, bundle); return; }
    installBundle(bundle, c); committedBundle = bundle; S.previewBundle = null;
    t.failedId = null; t.failedApply = false; t.retryBundle = null;
  }
  function loadWallpaperPreview(t) {
    var id = WALLS[t.i].id;
    cancelWallpaperTimer(t);
    showWall(id, function (ok) {
      if (top() !== t || WALLS[t.i].id !== id) return;
      if (!ok) failWallpaper(t, id, t.applyPending === id, null);
      else if (t.applyPending === id) applyWallpaper(t);
      render(); syncRotation();
    });
  }
  function previewWallpaper(t, index, apply, immediate) {
    var id, target;
    cancelWallpaperTimer(t); cancelLook();
    t.i = index; t.f.zone = 'photo'; id = WALLS[index].id;
    t.applyPending = apply ? id : null; t.failedId = null; t.failedApply = false; t.retryBundle = null;
    S.err = null; S.wallError = null;
    if (id === S.c.wall && committedBundle) {
      installBundle(committedBundle, S.c, true); S.previewBundle = null;
      if (apply) applyWallpaper(t);
      return;
    }
    if (S.wallShown === id && S.previewBundle && S.previewBundle.key === bundleKey({ wall: id, material: S.c.material })) {
      if (apply) applyWallpaper(t);
      return;
    }
    if (apply || immediate) { loadWallpaperPreview(t); return; }
    target = lookOf(S.c); target.wall = id;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false, deferred: true };
    t.previewDue = id;
    t.previewTimer = setTimeout(function () { if (top() === t && WALLS[t.i].id === id) loadWallpaperPreview(t); }, WALL_DELAY);
  }
  /* Favourite or hide one wallpaper. Online favourites are kept by the native side, so a refresh never deletes them. */
  function markWallpaper(w, kind) {
    var c = next(S.c.home.slice(), S.c.recent.slice()), list = kind === 'fav' ? c.fav : c.hide, other = kind === 'fav' ? c.hide : c.fav, i = list.indexOf(w.id), on = i < 0;
    if (on) { list.push(w.id); if (other.indexOf(w.id) >= 0) other.splice(other.indexOf(w.id), 1); } else list.splice(i, 1);
    if (!write(c, kind === 'fav' ? 'Favourite' : 'Hide')) return;
    S.c = c;
    if (w.online && ONLINE && ONLINE.keep) ONLINE.keep(w.id, S.c.fav.indexOf(w.id) >= 0);
    S.note = on ? (kind === 'fav' ? w.name + ' is a favourite.' : w.name + ' is hidden.') : null;
    syncRotation();
  }
  function retryWallpaper(t) {
    var apply = t.failedApply, bundle = t.retryBundle;
    t.f.zone = 'photo';
    if (bundle && apply) applyWallpaper(t, bundle);
    else previewWallpaper(t, t.i, apply, true);
  }
  function closeWallpaper(t) {
    cancelWallpaperTimer(t); t.applyPending = null; S.err = null; pop(); restoreLook();
    if (top().id === 'appearance' && top().group === 'background') detailFocus(top(), { action: 'background.wallpaper' }, 0);
  }
  V.wallpaper = {
    norm: function (t) {
      t.i = clamp(t.i, 0, WALLS.length - 1);
      if (t.f.zone === 'retry' && !t.failedId) t.f.zone = 'photo';
      if (t.i < t.top) t.top = t.i;
      if (t.i >= t.top + WALL_VISIBLE) t.top = t.i - WALL_VISIBLE + 1;
      t.top = clamp(t.top, 0, Math.max(0, WALLS.length - WALL_VISIBLE));
    },
    key: function (t, k) {
      if (k === 'back') { closeWallpaper(t); return; }
      if (t.f.zone === 'back') {
        if (k === 'ok') closeWallpaper(t);
        else if (k === 'down' || k === 'right') t.f.zone = 'photo';
        return;
      }
      if (t.f.zone === 'retry') {
        if (k === 'ok') retryWallpaper(t);
        else if (k === 'up' || k === 'left') t.f.zone = 'photo';
        return;
      }
      // Favourite and Hide sit under the preview; up and down keep stepping through photos so several can be marked quickly.
      if (t.f.zone === 'fav' || t.f.zone === 'hide') {
        if (k === 'ok') markWallpaper(WALLS[t.i], t.f.zone);
        else if (k === 'left') t.f.zone = t.f.zone === 'hide' ? 'fav' : 'photo';
        else if (k === 'right' && t.f.zone === 'fav') t.f.zone = 'hide';
        else if ((k === 'up' && t.i > 0) || (k === 'down' && t.i < WALLS.length - 1)) { var zone = t.f.zone; previewWallpaper(t, t.i + (k === 'up' ? -1 : 1), false); t.f.zone = zone; }
        return;
      }
      if (k === 'left' || k === 'up' && t.i === 0) { t.f.zone = 'back'; t.applyPending = null; }
      else if (k === 'up' && t.i > 0) previewWallpaper(t, t.i - 1, false);
      else if (k === 'down' && t.i < WALLS.length - 1) previewWallpaper(t, t.i + 1, false);
      else if ((k === 'right' || k === 'down') && t.failedId) t.f.zone = 'retry';
      else if (k === 'right') t.f.zone = 'fav';
      else if (k === 'ok') { if (t.retryBundle) applyWallpaper(t, t.retryBundle); else applyWallpaper(t); }
    },
    point: function (t, z, i) {
      if (z === 'wall-back') closeWallpaper(t);
      else if (z === 'wall-retry') retryWallpaper(t);
      else if (z === 'wall-fav' || z === 'wall-hide') { t.f.zone = z.slice(5); markWallpaper(WALLS[t.i], t.f.zone); }
      else if (z === 'wall-choice' && i >= 0 && i < WALLS.length) {
        if (i === t.i) { t.f.zone = 'photo'; this.key(t, 'ok'); }
        else previewWallpaper(t, i, true);
      }
    }
  };

  /* ---------- Installed apps ---------- */
  function appsItems() { return catalog.error ? [] : ALPHA; }
  function appsHead() { return catalog.error ? [['retry', 'Try again', '', '']] : [['editor', 'Apps on Home', '', 'home']]; }
  V.apps = {
    sheet: true,
    norm: function (t) {
      var n = appsItems().length;
      t.f.i = clamp(t.f.i, 0, Math.max(0, n - 1));
      if (!n) t.f.zone = 'head';
    },
    key: function (t, k) {
      var f = t.f, items = appsItems(), n = items.length, col = f.i % COLS, row = Math.floor(f.i / COLS);
      if (k === 'back') { pop(); return; }
      if (f.zone === 'head') {
        if (k === 'down' && n) f.zone = 'grid';
        else if (k === 'ok') { if (catalog.error) refreshCatalog(); else guarded(function () { openEditor('apps'); }); }
        return;
      }
      if (k === 'left' && col > 0) f.i--;
      else if (k === 'right' && col < COLS - 1 && f.i < n - 1) f.i++;
      else if (k === 'down' && row < Math.ceil(n / COLS) - 1) f.i = Math.min(f.i + COLS, n - 1);
      else if (k === 'up') { if (row > 0) f.i -= COLS; else f.zone = 'head'; }
      else if (k === 'ok' && n) launch(items[f.i]);
      S.appsFocus = items[f.i] || null;
    },
    point: function (t, z, i) { if (z === 'grid') { t.f.zone = 'grid'; t.f.i = i; } else if (z === 'head') t.f.zone = 'head'; else return; this.key(t, 'ok'); }
  };

  /* ---------- B: two-zone Home editor ---------- */
  function otherGroups() {
    var rec = S.c.recent.filter(function (id) { return !onHome(id) && app(id); });
    return { recent: rec, rest: ALPHA.filter(function (id) { return !onHome(id) && rec.indexOf(id) < 0; }) };
  }
  function otherList() { var o = otherGroups(); return o.recent.concat(o.rest); }
  function editorCut() { return 5; }
  function editorHomeY(i) { return i * ED_ROW + (i >= editorCut() ? 24 : 0); }
  function editorOtherY(j) {
    var o = otherGroups();
    return j * ED_ROW + (o.recent.length ? ED_SEP : 0) + (o.recent.length && j >= o.recent.length ? ED_SEP : 0);
  }
  function rememberOther(t) {
    var list = otherList();
    t.otherReturn = { id: list[t.f.j] || null, index: t.f.j, top: t.top };
  }
  function returnOther(t) {
    var list = otherList(), memory = t.otherReturn, i = memory ? list.indexOf(memory.id) : -1;
    t.f.zone = 'other';
    t.f.j = i >= 0 ? i : clamp(memory ? memory.index : 0, 0, Math.max(0, list.length - 1));
    if (memory) t.top = memory.top;
  }
  function nearestHome(t, count) {
    var target = editorOtherY(t.f.j) - t.top + 36, best = 0, distance = Infinity, i, d;
    for (i = 0; i < count; i++) {
      d = Math.abs(editorHomeY(i) + 36 - target);
      if (d < distance) { best = i; distance = d; }
    }
    return best;
  }
  V.editor = {
    sheet: true,
    norm: function (t) {
      var f = t.f, nh = (t.lifted ? t.lifted.order : S.c.home).length, no = otherList().length;
      f.i = clamp(f.i, 0, Math.max(0, nh - 1));
      f.j = clamp(f.j, 0, Math.max(0, no - 1));
      if (f.zone === 'home' && !nh) f.zone = no ? 'other' : 'head';
      if (f.zone === 'other' && !no) f.zone = nh ? 'home' : 'head';
    },
    key: function (t, k) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherList(), nh = H.length, no = O.length, d, tmp;
      if (t.lifted) {
        d = k === 'up' ? -1 : k === 'down' ? 1 : 0;
        if (d && f.i + d >= 0 && f.i + d < nh) { tmp = H[f.i + d]; H[f.i + d] = H[f.i]; H[f.i] = tmp; f.i += d; S.err = null; }
        else if (k === 'ok') editorPlace(t);
        else if (k === 'back') { f.i = t.lifted.from; t.lifted = null; S.err = null; }
        return;
      }
      if (k === 'back') { closeEditor(t); return; }
      if (f.zone === 'head') {
        if (k === 'left' && f.h > 0) f.h--;
        else if (k === 'right' && f.h < 1) f.h++;
        else if (k === 'down') { if (no) returnOther(t); else if (nh) f.zone = 'home'; }
        else if (k === 'ok') { begin(); if (f.h === 0) undoLast(null); else closeEditor(t); }
      } else if (f.zone === 'home') {
        if (k === 'up') { if (f.i > 0) f.i--; else f.zone = 'head'; }
        else if (k === 'down') { if (f.i < nh - 1) f.i++; }
        else if (k === 'right') { if (f.part === 'name') f.part = 'remove'; else if (no) returnOther(t); }
        else if (k === 'left') { if (f.part === 'remove') f.part = 'name'; }
        else if (k === 'ok') {
          begin();
          if (f.part === 'name') t.lifted = { id: H[f.i], from: f.i, order: H.slice(), snap: snap() };
          else editorRemove(t, H[f.i]);
        }
      } else {
        if (k === 'up') { if (f.j > 0) { f.j--; rememberOther(t); } else f.zone = 'head'; }
        else if (k === 'down') { if (f.j < no - 1) { f.j++; rememberOther(t); } }
        else if (k === 'left') { if (nh) { rememberOther(t); f.i = nearestHome(t, nh); f.zone = 'home'; f.part = 'name'; } }
        else if (k === 'ok') { begin(); editorAdd(t, O[f.j]); }
      }
    },
    point: function (t, z, i) {
      if (t.lifted) { if (z === 'name' && i === t.f.i) this.key(t, 'ok'); return; }
      if (z === 'name' || z === 'remove') { t.f.zone = 'home'; t.f.i = i; t.f.part = z; }
      else if (z === 'other') { t.f.zone = 'other'; t.f.j = i; rememberOther(t); }
      else if (z === 'head') { t.f.zone = 'head'; t.f.h = i; }
      else return;
      this.key(t, 'ok');
    }
  };
  /* Focus follows the app between zones, so a repeated OK toggles the same app. */
  function editorRemove(t, id) {
    if (!homeRemove(id)) return;
    t.f.zone = 'other'; t.f.j = otherList().indexOf(id);
    S.note = app(id).name + ' is in Recently removed. OK puts it back.';
  }
  function editorAdd(t, id) {
    rememberOther(t);
    if (!homeAdd(id)) return;
    var remaining = otherList(), at = clamp(t.otherReturn.index, 0, Math.max(0, remaining.length - 1));
    t.otherReturn.id = remaining[at] || null; t.otherReturn.index = at;
    t.f.zone = 'home'; t.f.i = S.c.home.indexOf(id); t.f.part = 'remove';
    S.note = app(id).name + ' is on Home, position ' + (t.f.i + 1) + '.';
  }
  function editorPlace(t) {
    var L = t.lifted;
    begin();
    if (same(L.order, S.c.home)) { t.lifted = null; return; }
    if (!homeMove(L.order.slice(), L.id, L.snap)) return;
    t.lifted = null;
    S.note = app(L.id).name + ' moved to position ' + (t.f.i + 1) + '.';
  }
  function closeEditor() { clearSession(); pop(); }

  /* ---------- Settings, Layout and messages ---------- */
  var PARENT = { ha: 'addons', musicview: 'music', health: 'samsung', updates: 'samsung', saverlook: 'screensaver', rotation: 'background', online: 'background', unsplash: 'online', animated: 'online', fonts: 'typography', icons: 'layout', iconpack: 'icons', iconapps: 'icons', appicon: 'iconapps', lock: 'samsung', lockapps: 'lock', remote: 'samsung', remotepick: 'remote', remoteapp: 'remotepick' };
  function groupName(group, t) { return group === 'remotepick' ? buttonName(t.key) : group === 'appicon' && t && app(t.app) ? app(t.app).name : DETAIL_NAMES[group]; }
  function parentName(t) { return t.group === 'appicon' && t.fromHome ? 'Home' : PARENT[t.group] ? groupName(PARENT[t.group], t) : 'Settings'; }
  /* ---------- Wallpaper sources: any mix of Shore's own, My photos and online sources ----------
     S.c.source is a comma list in SOURCES order. Only photos from these sources rotate. */
  function sourceCsv(value) {
    var have = String(value || '').split(','), out = SOURCES.filter(function (o) { return have.indexOf(o.id) >= 0; }).map(function (o) { return o.id; });
    return out.length ? out.join(',') : 'builtin'; // "off" and old empty choices mean Shore's own wallpapers
  }
  function sourceList() { return S.c.source.split(','); }
  function sourceOn(id) { return sourceList().indexOf(id) >= 0; }
  function sourceName(id) { var o = SOURCES.filter(function (x) { return x.id === id; })[0]; return o ? o.name : id; }
  function sourceShort() { var l = sourceList().map(function (id) { return T(sourceName(id)); }); return l.length > 1 ? l[0] + ' +' + (l.length - 1) : l[0]; }
  /* A wallpaper rotates when its source is chosen. Online and phone photos carry their source; older entries count as online. */
  function isFav(w) { return S.c.fav.indexOf(w.id) >= 0; }
  function isHidden(w) { return S.c.hide.indexOf(w.id) >= 0; }
  /* Hidden photos never rotate; favourites always do, whatever their source. */
  function inRotation(w) { return isHidden(w) ? false : isFav(w) || (w.online ? !w.source || sourceOn(w.source) : sourceOn('builtin')); }
  function mode() { for (var i = 0; i < MODES.length; i++) if (MODES[i].id === S.c.mode) return MODES[i]; return MODES[0]; }
  /* Settings overview: two columns of headed groups. Up and down stay in a column; left and right cross to the nearest row. */
  function settingsColumns() {
    var n = S.c.home.length;
    function off(v) { return v === 'on' ? '' : 'Off'; }
    var music = (S.c.cplaying === 'on' ? ['Now playing'] : []).concat(S.c.cart === 'on' ? ['Album art'] : []);
    return [[
      { head: 'Look', rows: [
        { id: 'background', label: 'Wallpaper', value: S.c.bg === 'photo' ? wall(S.c.wall).name : VALUE_NAMES[S.c.bg] },
        { id: 'layout', label: 'Home screen', value: isShelf() ? 'Shelf' : VALUE_NAMES[S.c.layout] },
        { id: 'editor', label: 'Apps on Home', value: n + (n === 1 ? ' app' : ' apps') },
        { id: 'focus', label: 'Style', value: VALUE_NAMES[S.c.focus] + (materialApplies() ? ', ' + VALUE_NAMES[S.c.material] : '') },
        { id: 'typography', label: 'Text', value: FONTS[S.c.font].name }] },
      { head: 'When you’re away', rows: [
        { id: 'display', label: 'Night', value: S.c.night === 'off' ? 'Off' : S.c.night === 'always' ? 'Always dimmed' : 'Dimmed ' + VALUE_NAMES[S.c.nhours] },
        { id: 'screensaver', label: 'Screensaver', value: S.c.saver === 'off' ? 'Off' : VALUE_NAMES[S.c.saver] }] }
    ], [
      { head: 'Clock and info', rows: [
        { id: 'clock', label: 'Clock', value: VALUE_NAMES[S.c.cformat] + ', ' + VALUE_NAMES[S.c.csize] },
        { id: 'weather', label: 'Weather', value: off(S.c.cweather) || T('On') + ', ' + VALUE_NAMES[S.c.wunit] }]
        .concat(NOWPLAYING ? [{ id: 'music', label: 'Music', value: music.length ? music.map(T).join(', ') : 'Off' }] : [])
        .concat(NEWS || newsForced ? [{ id: 'news', label: 'News', value: off(S.c.cnews) || newsSourceName(S.c.nsrc) }] : []) },
      { head: 'Shore', rows: [{ id: 'inputs', label: 'Inputs', value: inputSummary() }].concat(PHONE ? [{ id: 'phone', label: 'Phone', value: !S.phone.enabled ? 'Off' : S.phone.count ? (S.phone.count === 1 ? '1 photo' : S.phone.count + ' photos') : 'On' }] : [])
        .concat(addonsAvailable().length ? [{ id: 'addons', label: 'Add-ons', value: addonsSummary() }] : [])
        .concat([{ id: 'samsung', label: TV.brand, value: updateReady() ? 'Shore update available' : 'Home and TV settings' }]) }
    ]];
  }
  function inputSummary() {
    var hidden = INPUTS.filter(function (i) { return S.c.hidein.indexOf(i.id) >= 0; }).length;
    return hidden ? (hidden === 1 ? '1 hidden' : hidden + ' hidden') : VALUE_NAMES[S.c.inputs];
  }
  /* Rows of one column with their visual line (headers count as a line), for crossing between columns. */
  function settingsColumn(groups) {
    var out = [], line = 0;
    groups.forEach(function (g) { line++; g.rows.forEach(function (r) { out.push({ id: r.id, line: line++ }); }); line += .4; });
    return out;
  }
  function settingsRows() { var out = []; settingsColumns().forEach(function (c) { c.forEach(function (g) { out = out.concat(g.rows); }); }); return out; }
  function settingsIds() { return settingsRows().map(function (r) { return r.id; }); }
  V.settings = {
    sheet: true,
    norm: function (t) { var ids = settingsIds(); if (ids.indexOf(t.f.id) < 0) t.f.id = ids[0]; },
    key: function (t, k) {
      var cols = settingsColumns().map(settingsColumn), c = 0, i = 0, other, best;
      cols.forEach(function (col, ci) { col.forEach(function (r, ri) { if (r.id === t.f.id) { c = ci; i = ri; } }); });
      if (k === 'up' && i > 0) i--;
      else if (k === 'down' && i < cols[c].length - 1) i++;
      else if ((k === 'left' && c > 0) || (k === 'right' && c < cols.length - 1)) {
        other = cols[c + (k === 'left' ? -1 : 1)]; best = 0;
        other.forEach(function (r, ri) { if (Math.abs(r.line - cols[c][i].line) < Math.abs(other[best].line - cols[c][i].line)) best = ri; });
        c += k === 'left' ? -1 : 1; i = best;
      }
      else if (k === 'back') { pop(); return; }
      t.f.id = cols[c][i].id; S.settingsFocus = t.f.id;
      if (k === 'ok') settingsOk(t.f.id);
    },
    point: function (t, z, i, id) { if (z === 'row' && id) { t.f.id = id; this.key(t, 'ok'); } }
  };
  function settingsOk(id) {
    if (id === 'editor') openEditor('settings');
    else if (id === 'phone') openPhone();
    else openAppearance(id);
  }
  var DETAIL_NAMES = { addons: 'Add-ons', ha: 'Home Assistant', musicview: 'Music view', health: 'Setup and health', updates: 'Shore updates', fonts: 'Font', clock: 'Clock', display: 'Night', online: 'Wallpaper sources', unsplash: 'Unsplash themes', animated: 'Animated wallpapers', background: 'Wallpaper', layout: 'Home screen', typography: 'Text', icons: 'App icons', iconpack: 'Icon pack', iconapps: 'Per-app icons', appicon: 'Icon', lock: 'Parental lock', lockapps: 'Locked apps', inputs: 'Inputs', focus: 'Style', rotation: 'Rotation', samsung: TV.brand, remote: 'Remote buttons', remoteapp: 'Choose an app', phone: 'Phone', weather: 'Weather', music: 'Music', news: 'News', screensaver: 'Screensaver', saverlook: 'Arrangement and clock' };
  function choice(axis, value, disabled) {
    if (axis === 'source') return { action: 'online.' + value, axis: axis, value: value, disabled: !!disabled, label: sourceName(value), tick: true, applied: sourceOn(value) };
    return { action: axis === 'mode' ? 'rotation.' + value : 'choice.' + axis + '.' + value, axis: axis, value: value, disabled: !!disabled,
      label: axis === 'nsrc' ? newsSourceName(value) : axis === 'cdate' ? 'Date' : axis === 'cweather' ? 'Weather' : axis === 'cplaying' ? 'Now playing' : axis === 'cart' ? 'Album art' : axis === 'clook' ? 'Find artist pictures online' : axis === 'saver' && value !== 'off' ? value + ' min' : axis === 'svtime' ? value + ' s' : axis === 'csec' ? shortSeconds() : axis === 'iask' ? askLabel() : /^(svclock|svdate|svmusic|wicon|cwave|ncalm|svphoto|wfx|cnews|cwatch|plyric|pword|pbeat|crecent|ccal|pqueue|ptrans)$/.test(axis) ? LOOK_NAMES[axis] : axis === 'font' ? FONTS[value].name : axis === 'mode' ? MODES.filter(function (m) { return m.id === value; })[0].name : value === 'both' ? 'Both' : value === 'light' && /weight$/.test(axis) ? weightLight() : VALUE_NAMES[value] };
  }
  /* "Seconds" in the Format row, abbreviated where the word is long. */
  /* "Ask" (to switch inputs), short enough to share the Inputs row in every language. */
  function askLabel() { var w = T('Ask (inputs)'); return w === 'Ask (inputs)' ? 'Ask' : w; }
  function shortSeconds() { var w = T('Seconds (short)'); return w === 'Seconds (short)' ? 'Seconds' : w; }
  /* "Light" as a font weight differs from the Light background in some languages. */
  function weightLight() { var w = T('Light weight'); return w === 'Light weight' ? 'Light' : w;
  }
  /* ---------- Remote buttons (Android: HomeButtonService applies them, even inside other apps) ---------- */
  var REMOTE = ANDROID && FrameDevice.remote ? FrameDevice.remote : null;
  /* Android key names for the TCL RC833 remote; unknown keys show their Android name. */
  var BUTTON_NAMES = { KEYCODE_TV: 'TV button', KEYCODE_PROG_RED: 'Red button', KEYCODE_PROG_GREEN: 'Green button',
    KEYCODE_PROG_YELLOW: 'Yellow button', KEYCODE_PROG_BLUE: 'Blue button', KEYCODE_GUIDE: 'Guide button',
    KEYCODE_TV_INPUT: 'Input button', KEYCODE_SETTINGS: 'Settings button', KEYCODE_MENU: 'Menu button', KEYCODE_BOOKMARK: 'Bookmark button' };
  function buttonName(key) {
    var name = key && key.name || '';
    if (BUTTON_NAMES[name]) return BUTTON_NAMES[name];
    name = /^KEYCODE_/.test(name) ? name.slice(8).toLowerCase().replace(/_/g, ' ') + ' button' : 'Button ' + (key ? key.code : '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  function remoteTarget(action) {
    var kind = action.slice(0, action.indexOf(':')), id = action.slice(action.indexOf(':') + 1), found = null;
    APPS.forEach(function (a) { if (!found && a.appId && (kind === 'input' ? a.input && a.appId === id : !a.input && REMOTE.appTarget(a.id) === id)) found = a; });
    return found;
  }
  function actionName(action) {
    var a;
    if (action === 'home') return 'Shore Home';
    if (action === 'none') return 'Does nothing';
    if (action === 'screensaver') return TV.art;
    a = remoteTarget(action);
    return a ? a.name : /^input:/.test(action) ? 'TV input' : action.slice(4);
  }
  function remoteAction(key) {
    var found = 'default';
    S.remote.keys.forEach(function (k) { if (k.code === key.code) found = k.action; });
    return found;
  }
  function refreshRemote() {
    var info = REMOTE.info(), r = S.remote;
    if (r.learning && !info.learning) { r.learning = false; r.missed = true; clearTimeout(r.timer); }
    r.service = info.service; r.blocked = !!info.blocked; r.keys = info.keys;
  }
  function remotePage(t) { return t.id === 'appearance' && PARENT[t.group] && (t.group === 'remote' || PARENT[t.group] === 'remote' || PARENT[t.group] === 'remotepick'); }
  function openRemote() { refreshRemote(); S.remote.missed = false; openAppearance('remote'); }
  function startLearn() {
    var r = S.remote;
    r.missed = false;
    r.learning = REMOTE.learn(true);
    clearTimeout(r.timer);
    if (r.learning) r.timer = setTimeout(function () { refreshRemote(); render(); }, 20500);
    else refreshRemote();
  }
  function stopLearn() { var r = S.remote; clearTimeout(r.timer); r.learning = false; REMOTE.learn(false); }
  function remoteLearned(key) {
    var t = top(), r = S.remote;
    clearTimeout(r.timer); r.learning = false; r.missed = false;
    if (t.id !== 'appearance' || t.group !== 'remote') return;
    refreshRemote(); openRemotePick({ code: key.code, name: String(key.name || '') });
    render();
  }
  function openRemotePick(key) {
    var current = remoteAction(key), t;
    push({ id: 'appearance', group: 'remotepick', key: key, f: { action: 'remote.apps' } });
    t = top();
    detailRows(t).forEach(function (items) { items.forEach(function (item) { if (item.remote === current) t.f.action = item.action; }); });
  }
  function assignRemote(t, value) {
    REMOTE.set(t.key.code, t.key.name, value);
    refreshRemote();
    while (top().id === 'appearance' && top().group !== 'remote') pop();
  }
  function remoteSections(t) {
    var r = S.remote, items, current, choices, inputs, apps, n = 0;
    function choose(value, label) { return { action: 'remote.pick.' + (n++), remote: value, label: label, tick: true, applied: current === value }; }
    if (t.group === 'remote') {
      items = r.keys.map(function (k, i) { return { action: 'remote.key.' + i, label: buttonName(k), description: actionName(k.action), pair: true }; });
      items.push({ action: 'remote.learn', label: r.learning ? 'Press a button on the remote…' : 'Assign a button…', disabled: !r.service });
      if (!r.service) items.push({ action: 'remote.service', label: 'Accessibility settings' });
      return [{ id: 'remote', title: '', items: items,
        reason: r.blocked ? 'The TV stopped “Shore Home button” after a restart. Allow Shore to auto start in TV Guard, then switch the service off and on again.'
          : !r.service ? 'Turn on “Shore Home button” in Settings › System › Accessibility to assign buttons.'
          : r.learning ? 'Waiting for a button. Any other key cancels.'
          : r.missed ? 'No button arrived. The TV handles that button before Shore sees it, so it can’t be reassigned.'
          : r.keys.length ? 'Assigned buttons work everywhere, even inside apps.' : 'Assign the app buttons or the TV button to something else.' }];
    }
    current = remoteAction(t.key);
    if (t.group === 'remoteapp') {
      apps = S.c.home.filter(function (id) { var a = app(id); return a && !a.input && REMOTE.appTarget(id); });
      items = apps.slice(0, 8).map(function (id) { return choose('app:' + REMOTE.appTarget(id), app(id).name); });
      return [{ id: 'apps', title: '', items: items.length ? items : [{ action: 'remote.none', label: 'No apps on Home', disabled: true }],
        reason: apps.length > 8 ? 'Showing your first 8 Home apps.' : 'These are the apps on your Home screen.' }];
    }
    choices = [choose('default', 'Default'), choose('home', 'Shore Home'), choose('none', 'Do nothing'), choose('screensaver', TV.art)];
    inputs = LIVE.slice(0, 3).map(function (id) { return choose('input:' + app(id).appId, app(id).name); });
    return [{ id: 'action', title: 'Action', items: choices }]
      .concat(inputs.length ? [{ id: 'inputs', title: 'Inputs', horizontal: true, items: inputs }] : [])
      .concat([{ id: 'app', title: 'App', items: [{ action: 'remote.apps', label: /^app:/.test(current) ? actionName(current) : 'An app', more: true }],
        reason: current === 'default' ? 'Default keeps what the TV normally does.' : '' }]);
  }
  /* ---------- Under the clock: weather (Open-Meteo) and what is playing (Android media sessions) ---------- */
  /* ---------- Headlines: one at a time under the clock and on the screensaver ---------- */
  var NEWS = window.FrameDevice && FrameDevice.news ? FrameDevice.news : null, NEWS_EVERY = 20000, NEWS_MAX_AGE = 36 * 3600000;
  var newsItems = [], newsIdx = 0, newsTimer = 0, newsForced = null;
  function newsOn() { return S.c.cnews === 'on' && (!!NEWS || !!newsForced); }
  function newsOutlet(id) { return NEWS_OUTLETS.filter(function (o) { return o.id === id; })[0] || null; }
  function phoneFeed() { return window.FrameDevice && FrameDevice.phone ? FrameDevice.phone.info().feed || '' : ''; }
  /* The feed to fetch; empty means Google News top stories for the TV's language and country. */
  function newsFeed() { var o = newsOutlet(S.c.nsrc); return o ? o.url : S.c.nsrc === 'phone' ? phoneFeed() : ''; }
  /* Outlets for the TV's language first, then the international ones; the chosen outlet always stays listed. */
  function newsOutlets() {
    var lang = (window.CleanFrameI18n && CleanFrameI18n.lang) || 'en';
    return NEWS_OUTLETS.filter(function (o) { return o.lang.split(' ').indexOf(lang) >= 0 || o.id === S.c.nsrc; })
      .concat(NEWS_OUTLETS.filter(function (o) { return o.lang.split(' ').indexOf(lang) < 0 && o.lang.indexOf('*') >= 0 && o.id !== S.c.nsrc; }));
  }
  function newsSourceName(id) { var o = newsOutlet(id); return o ? o.name : id === 'phone' ? 'Your own feed' : 'Google News'; }
  function loadNews() {
    var r = newsForced ? { items: newsForced } : NEWS ? NEWS.info() : { items: [] }, now = Date.now(), outlet = newsOutlet(S.c.nsrc);
    // A source change shows nothing old: the cache belongs to the previous feed until the new one arrives.
    if (!newsForced && (r.feed || '') !== newsFeed()) r = { items: [] };
    newsItems = r.items.filter(function (i) { return !i.time || now - i.time < NEWS_MAX_AGE; }).map(function (i) {
      // Outlet feeds name the channel ("tagesschau.de - die erste Adresse…"); show the outlet's own short name.
      return outlet ? { title: i.title, source: outlet.name, time: i.time } : { title: i.title, source: String(i.source || '').split(/ [-|–:] /)[0], time: i.time };
    });
  }
  function headline() { return newsOn() && newsItems.length ? newsItems[newsIdx % newsItems.length] : null; }
  function headlineHtml(cls) {
    var h = headline();
    return h ? '<span class="' + cls + '">' + (h.source ? '<span class="news-src">' + escRaw(h.source) + '</span>' : '') + escRaw(h.title) + '</span>' : '';
  }
  function renderNews() {
    setHTML(capNews, headlineHtml('cap-news'));
    if (S.saver) setHTML(svNews, S.c.svdate === 'on' ? headlineHtml('sv-headline') : '');
  }
  /* Every 20 s the next headline, while Home or the screensaver is on screen; the TV fetches at most every 30 minutes. */
  function newsTick(advance) {
    clearTimeout(newsTimer); newsTimer = 0;
    if (!newsOn()) { newsItems = []; renderNews(); return; }
    if (NEWS && !newsForced) NEWS.refresh(newsFeed(), false);
    var before = newsItems.length;
    loadNews();
    if (advance && !document.hidden && (top().id === 'home' || S.saver)) newsIdx++;
    if (!before && newsItems.length) newsIdx = 0;
    renderNews();
    newsTimer = setTimeout(function () { newsTick(true); }, newsItems.length ? NEWS_EVERY * (QA.slideScale || 1) : 8000);
  }
  var WEATHER = window.CleanFrameWeather || null, NOWPLAYING = ANDROID && FrameDevice.nowPlaying ? FrameDevice.nowPlaying : null;
  function pollPlaying() {
    var info, key;
    if (!NOWPLAYING || document.hidden || S.c.cplaying !== 'on' && S.c.cart !== 'on' && !S.saver) return;
    info = NOWPLAYING.info(S.c.clook === 'on'); key = info.access + '|' + (info.playing ? info.title + '|' + info.artist + '|' + info.art + '|' + info.wide : '');
    if (key === S.playing.key) return;
    // Paused anywhere: keep the music button for a while so it can be resumed.
    if (S.playing.playing && !info.playing && S.playing.pkg) musicPaused = { title: S.playing.title, artist: S.playing.artist, app: S.playing.app, pkg: S.playing.pkg, until: Date.now() + 600000 };
    if (info.playing) musicPaused = null;
    info.key = key; S.playing = info;
    if (S.saver) renderSaver();
    if (top().id === 'home' || isSettingsDetail(top())) render();
  }
  /* A small looping level meter: decoration only, it does not follow the sound. */
  var WAVE = '<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  function wave() { return S.c.cwave === 'on' ? WAVE : ''; }
  /* Album art as the background: a soft backdrop pre-rendered natively, shown above the photo while music plays. */
  function npArt() { var p = S.playing; return !!(NOWPLAYING && S.c.cart === 'on' && S.c.bg === 'photo' && p.playing && (p.back || p.wide)) && !DREAM; }
  var npEl = document.createElement('div'), npImgs = [document.createElement('img'), document.createElement('img')], npFront = 0, npSrc = '';
  npEl.className = 'np-bg'; npEl.setAttribute('aria-hidden', 'true');
  npImgs.forEach(function (img) { img.className = 'np-img'; img.alt = ''; npEl.appendChild(img); });
  function crossfade(imgs, front, src, cls) {
    var back = imgs[1 - front];
    if (!src) { imgs[0].className = imgs[1].className = cls; return front; }
    if (imgs[front].getAttribute('src') === src && imgs[front].className.indexOf('is-on') >= 0) return front;
    back.onload = function () { if (back.getAttribute('src') !== src) return; back.className = cls + ' is-on'; imgs[front].className = cls; };
    back.onerror = function () { back.className = cls; };
    if (back.getAttribute('src') === src && back.complete && back.naturalWidth) back.onload(); else back.src = src;
    return 1 - front;
  }
  function syncNpArt() {
    var src = npArt() ? S.c.clook === 'on' && S.playing.wide || S.playing.back : '';
    if (src === npSrc) return;
    npSrc = src; npFront = crossfade(npImgs, npFront, src, 'np-img');
  }
  function weatherIcon() { var name = WEATHER && S.c.cweather === 'on' && S.c.wicon === 'on' && WEATHER.icon ? WEATHER.icon() : ''; return name && SVG['w-' + name] ? icon('w-' + name, 'wx') : ''; }
  function clockExtras() {
    var html = '', p = S.playing, w = S.c.cweather === 'on' && WEATHER ? WEATHER.text(S.c.wunit) : '', date = S.c.cdate === 'on' ? T(dateText()) : '', inside = haInside();
    if (date || w || inside) html += '<span class="cap-date">' + escRaw(date) + (date && w ? ' · ' : '') + weatherIcon() + escRaw(w) + ((date || w) && inside ? ' · ' : '') + esc(inside) + '</span>';
    if (NOWPLAYING && S.c.cplaying === 'on' && p.playing) html += '<span class="cap-date cap-playing">' + wave() + escRaw(p.title + (p.artist ? ' · ' + p.artist : '') + (p.app ? ' — ' + p.app : '')) + '</span>';
    if (sleepLeft() > 0) html += '<span class="cap-date cap-sleep">' + icon('w-moon', 'wx') + esc(sleepText()) + '</span>';
    if (calendarLine()) html += '<span class="cap-date cap-cal">' + icon('calendar', 'wx') + escRaw(calendarLine()) + '</span>';
    return html;
  }
  /* ---------- Calendar: the next event from an iCal address set on the phone (CalendarFeed.java) ---------- */
  var CALENDAR = ANDROID && FrameDevice.calendar ? FrameDevice.calendar : null;
  function calendarLine() {
    if (!CALENDAR || S.c.ccal !== 'on') return '';
    var e = CALENDAR.next(), d, now = new Date(), day, h, m;
    if (!e || !e.title || !(e.start > 0)) return '';
    d = new Date(e.start);
    day = d.toDateString() === now.toDateString() ? 'Today' : new Date(now.getTime() + 86400000).toDateString() === d.toDateString() ? 'Tomorrow' : '';
    if (!day) day = localeText('wd.' + d.getDay(), function () { try { return d.toLocaleDateString(undefined, { weekday: 'long' }); } catch (x) { return ''; } });
    else day = T(day);
    if (e.allDay) return day + ' · ' + e.title;
    h = S.c.cformat === '24' ? d.getHours() : d.getHours() % 12 || 12; m = d.getMinutes();
    return (e.start <= now.getTime() ? T('Now') : day + ' ' + (S.c.cformat === '24' && h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + (S.c.cformat === '24' ? '' : ' ' + meridiemOf(d))) + ' · ' + e.title;
  }
  /* ---------- Sleep timer (Android): the Home-button service puts the TV into standby ---------- */
  var SLEEP = ANDROID && FrameDevice.sleep ? FrameDevice.sleep : null, sleepPick = 0;
  function sleepLeft() { return SLEEP ? SLEEP.left() : -1; }
  function sleepText() { var m = Math.max(1, Math.ceil(sleepLeft() / 60000)); return m >= 60 ? T('Sleep in ' + (m / 60 | 0) + ' hr ' + (m % 60) + ' min') : T('Sleep in ' + m + ' min'); }
  function setSleep(minutes) {
    if (!SLEEP) return;
    if (!SLEEP.set(minutes)) { render(); return; }
    sleepPick = minutes; render(); renderCaption(top(), homeState(top()));
  }
  function sleepSection() {
    var left = sleepLeft(), off = left < 0, running = left > 0;
    if (!running) sleepPick = 0;
    return { id: 'sleep', title: 'Sleep timer', horizontal: true, items: [0, 30, 60, 90, 120].map(function (m) {
      return { action: 'sleep.' + m, label: m ? m + ' min' : 'Off', tick: true, applied: !off && sleepPick === m, disabled: off };
    }), reason: off ? 'Turn on the Shore Home button in Accessibility to use the sleep timer.' : running ? sleepText() + '.' : 'Switches the TV off, even while another app is open.' };
  }
  /* ---------- Screensaver: Shore's own, instead of the TV's ---------- */
  /* After the chosen idle time Shore fades to a slow slideshow of the wallpapers with a large clock, or the album
     art while music plays. The clock block moves every few minutes. While it is enabled and Shore is in front,
     Shore keeps the TV's own screensaver away; after four hours it lets the TV take over (and sleep as usual). */
  var SAVER_MOVE_EVERY = 4, SAVER_AWAKE_MS = 4 * 3600000;
  /* Slides alternate between one photo and small mosaics; every photo slowly pans and zooms. */
  var SAVER_LAYOUTS = { mix: ['full', 'trio', 'full', 'pair'], single: ['full'], mosaic: ['trio', 'pair'] }, SAVER_TILES = { full: 1, pair: 2, trio: 3 };
  /* Below this many photos, "Like Home" tops the slideshow up with Shore's own wallpapers. */
  var SAVER_MIN_PHOTOS = 6;
  function saverSlideMs() { return +S.c.svtime * 1000 * (QA.slideScale || 1); }
  var saverTimer = 0, saverPhotoTimer = 0, saverSrc = '', saverShown = '', saverFront = 0, saverStep = 0, saverPos = 0, saverOrder = [], saverAt = 0, saverSince = 0, awakeOn = null, saverMotion = 0;
  var saverEl = document.createElement('div');
  saverEl.className = 'saver'; saverEl.setAttribute('aria-hidden', 'true');
  saverEl.innerHTML = '<div class="sv-slide"></div><div class="sv-slide"></div>'
    + '<div class="sv-shade"></div><div class="sv-night"></div><div class="sv-info"><div class="sv-clock"></div><div class="sv-date"></div><div class="sv-news"></div><div class="sv-np"></div><div class="sv-photo"></div></div>';
  var svSlides = saverEl.querySelectorAll('.sv-slide'), svInfo = saverEl.querySelector('.sv-info'), svNews = saverEl.querySelector('.sv-news');
  function saverDelay() { return S.c.saver === 'off' ? 0 : +S.c.saver * QA.minuteMs; }
  function saverReset() {
    clearTimeout(saverTimer); saverTimer = 0;
    if (S.saver || DREAM || document.hidden || !saverDelay()) { syncAwake(); return; }
    saverTimer = setTimeout(function () {
      saverTimer = 0;
      if (!saverDelay()) return;
      if (S.pending || S.remote && S.remote.learning || musicShowing()) { saverReset(); return; } // busy, or the music view is playing: try again after another full wait
      startSaver();
    }, saverDelay());
    syncAwake();
  }
  /* FLAG_KEEP_SCREEN_ON while Shore's screensaver is enabled and Shore is in front, for at most four hours of screensaver. */
  /* The music view with a song playing is something to watch, like a video: no screensaver over it. */
  function musicShowing() { return playerOpen() && !!P.d && !!P.d.found && !!P.d.playing; }
  function syncAwake() {
    var on = !!SAVER_API && !DREAM && !document.hidden && (S.c.saver !== 'off' || musicShowing()) && !(S.saver && Date.now() - saverSince > SAVER_AWAKE_MS);
    if (on === awakeOn || !SAVER_API) return;
    awakeOn = on; SAVER_API.keepAwake(on);
  }
  /* Like Home: the rotation pool, topped up when small. Everything: the current online source (or My photos) and Shore's own. */
  function saverPool() {
    var shown = WALLS.filter(function (w) { return !isHidden(w); }), builtIn = shown.filter(function (w) { return !w.online; }), pool;
    if (!shown.length) shown = builtIn = WALLS.slice(); // everything hidden: show something rather than nothing
    if (S.c.svsrc === 'builtin') return builtIn.length ? builtIn : shown;
    if (S.c.svsrc === 'every') return shown;
    pool = rotationPool().filter(function (w) { return !isHidden(w); });
    return pool.length >= SAVER_MIN_PHOTOS ? pool : pool.concat(builtIn.filter(function (w) { return pool.indexOf(w) < 0; }));
  }
  /* The rotation pool in a shuffled order that starts with the wallpaper on Home. */
  function saverQueue() {
    var pool = saverPool().filter(function (w) { return w.src; }).map(function (w) { return w.src; }), i, j, t, first;
    for (i = pool.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    first = wall(S.c.wall);
    if (first && first.src && pool.indexOf(first.src) > 0) { pool.splice(pool.indexOf(first.src), 1); pool.unshift(first.src); }
    return pool;
  }
  function saverTake(n) {
    var out = [];
    while (out.length < n) {
      if (saverAt >= saverOrder.length) { saverOrder = saverQueue(); saverAt = 0; if (!saverOrder.length) break; }
      if (out.indexOf(saverOrder[saverAt]) < 0) out.push(saverOrder[saverAt]);
      saverAt++;
      if (out.length >= saverOrder.length) break; // fewer photos than tiles
    }
    return out;
  }
  function nextSaverPhoto() {
    var layouts = SAVER_LAYOUTS[S.c.svlay] || SAVER_LAYOUTS.mix, layout = layouts[saverStep % layouts.length], photos, slide = svSlides[1 - saverFront], left, html = '';
    clearTimeout(saverPhotoTimer);
    if (!S.saver) return;
    saverPhotoTimer = setTimeout(nextSaverPhoto, saverSlideMs());
    photos = saverTake(SAVER_TILES[layout]);
    if (!photos.length) return;
    if (photos.length < SAVER_TILES[layout]) layout = photos.length === 2 ? 'pair' : 'full';
    photos.forEach(function (src, i) { html += '<div class="sv-tile t' + i + '"><img class="sv-img ' + (S.c.svmotion === 'drift' ? 'm' + (saverMotion++ % 4) + '" style="animation-duration:' + (saverSlideMs() / 1000 + 4) + 's' : 'still') + '" alt="" src="' + escRaw(src) + '"></div>'; });
    left = photos.length;
    slide.className = 'sv-slide l-' + layout;
    slide.innerHTML = html;
    saverSrc = photos[0];
    Array.prototype.forEach.call(slide.querySelectorAll('img'), function (img) {
      function one() { img.onload = img.onerror = null; if (--left === 0) show(); }
      img.onload = one; img.onerror = one;
      if (img.complete) one();
    });
    function show() {
      if (!S.saver || slide !== svSlides[1 - saverFront]) return;
      slide.className = 'sv-slide l-' + layout + ' is-on'; svSlides[saverFront].className = svSlides[saverFront].className.replace(' is-on', ' is-out');
      saverFront = 1 - saverFront; saverStep++; saverShown = photos[0]; renderSaver();
      if (saverStep % SAVER_MOVE_EVERY === 0 && S.c.svpos === 'move') moveSaverInfo();
    }
  }
  /* Fade out, jump to the next corner, fade in: keeps the clock from sitting on the same pixels for hours. */
  function moveSaverInfo() {
    svInfo.className = 'sv-info pos-' + saverPos + ' is-moving';
    setTimeout(function () { saverPos = (saverPos + 1) % 4; svInfo.className = 'sv-info pos-' + saverPos; }, 900);
  }
  /* What is playing shows as a card with its cover; the photos keep running behind it. */
  function renderSaver() {
    var p = S.playing, music = !!(NOWPLAYING && S.c.cplaying === 'on' && S.c.svmusic === 'on' && p.playing), w = S.c.cweather === 'on' && WEATHER ? WEATHER.text(S.c.wunit) : '', np = '';
    if (!S.saver) return;
    setHTML(svInfo.querySelector('.sv-clock'), S.c.svclock === 'on' ? clockHtml(true) : '');
    setHTML(svInfo.querySelector('.sv-date'), S.c.svdate === 'on' ? escRaw(T(dateText())) + (w ? ' · ' + weatherIcon() + escRaw(w) : '') : '');
    if (music) np = (p.art ? '<img class="sv-cover" alt="" src="' + escRaw(p.art) + '">' : '')
      + '<span class="sv-np-text"><span class="sv-title">' + wave() + escRaw(p.title) + '</span>'
      + (p.artist || p.app ? '<span class="sv-artist">' + escRaw(p.artist + (p.artist && p.app ? ' — ' : '') + p.app) + '</span>' : '') + '</span>';
    setHTML(svInfo.querySelector('.sv-np'), np);
    setHTML(svNews, S.c.svdate === 'on' ? headlineHtml('sv-headline') : '');
    // The main photo's title and credit (Photo title in Motion and clock).
    var shownWall = S.c.svphoto === 'on' ? WALLS.filter(function (w) { return w.src === saverShown; })[0] : null;
    setHTML(svInfo.querySelector('.sv-photo'), shownWall ? escRaw(T(shownWall.name)) + (shownWall.credit ? '<span class="sv-credit">' + escRaw(shownWall.credit) + '</span>' : '') : '');
    svInfo.querySelector('.sv-np').className = 'sv-np' + (np ? ' is-on' : '') + (p.art ? ' has-cover' : '');
    saverEl.className = 'saver is-on' + (DREAM ? ' is-dream' : '');
    syncAwake();
  }
  function startSaver() {
    if (S.saver) return;
    if (!saverEl.parentNode) stage.appendChild(saverEl);
    clearTimeout(saverTimer); saverTimer = 0;
    S.saver = true; saverSince = Date.now(); saverStep = 0; saverSrc = ''; saverShown = ''; saverOrder = []; saverAt = 0;
    svInfo.className = 'sv-info pos-' + saverPos;
    pollPlaying(); renderSaver(); nextSaverPhoto();
    render(); syncRotation();
  }
  function stopSaver() {
    if (!S.saver || DREAM) return;
    S.saver = false; clearTimeout(saverPhotoTimer); saverPhotoTimer = 0;
    saverEl.className = 'saver';
    Array.prototype.forEach.call(svSlides, function (sl) { sl.className = 'sv-slide'; sl.innerHTML = ''; }); // frees the decoded photos
    render(); syncRotation(); saverReset();
  }
  /* ---------- My photos: sent from a phone over the local network (Android shell) ---------- */
  var PHONE = ANDROID && FrameDevice.phone && ONLINE_INFO.phone ? FrameDevice.phone : null;
  var phoneWall = '';
  function openPhone() { S.phone = PHONE.info(); openAppearance('phone'); }
  /* ---------- Add-ons: optional features that stay out of sight until switched on (addons/AGENTS.md) ----------
     Each add-on is one on/off axis, off by default, with a row on Settings › Add-ons, its own settings page
     and, while on, whatever it adds to Home. available() hides an add-on this TV can't run; nothing of it
     loads, polls or shows until it is on, and it starts only after Home has painted. */
  var HA = window.CleanFrameHA || null, addonsReady = false, addonsSynced = false, haTimer = 0;
  var ADDONS = [
    { id: 'ha', axis: 'aha', name: 'Home Assistant', line: 'Lights, switches and cameras', page: 'ha',
      available: function () { return !!(HA && HA.available()); }, summary: function () { return haStatus(); } }];
  function addonsAvailable() { return ADDONS.filter(function (a) { return a.available(); }); }
  function addonOn(a) { return S.c[a.axis] === 'on' && a.available(); }
  function addonsSummary() { var on = addonsAvailable().filter(addonOn); return on.length ? on.map(function (a) { return a.name; }).join(', ') : 'Off'; }
  function addonSections() {
    var all = addonsAvailable(), on = all.filter(addonOn);
    return [{ id: 'addons', title: '', items: all.map(function (a) { return { action: 'choice.' + a.axis + '.on', axis: a.axis, value: 'on', label: a.name, description: a.line, tick: true, applied: S.c[a.axis] === 'on' }; }),
      reason: 'Add-ons stay out of sight until you switch them on.' }]
      .concat(on.length ? [{ id: 'addonpages', title: 'Settings', items: on.map(function (a) { return { action: 'open.' + a.page, label: a.name, description: a.summary(), pair: true }; }) }] : []);
  }
  /* Starts and stops each add-on with its switch; render() calls it, so a choice from the phone counts too. */
  function syncAddons() {
    if (!addonsReady || !HA || !HA.available()) return;
    var want = S.c.aha === 'on' && !DREAM, first = !addonsSynced;
    addonsSynced = true;
    if (want === HA.running() && !(first && !want && !DREAM)) return;
    if (want) HA.start();
    else { HA.stop(first); while (top().id === 'ha' || top().id === 'hacam' || top().id === 'hactl') pop(); }
  }

  /* ---------- Home Assistant add-on: a Smart home control on Home opens rooms and cameras (addons/homeassistant.js) ---------- */
  function haShown() { return !!(HA && S.c.aha === 'on' && HA.running() && HA.model().configured); }
  function haStatus() {
    var m = HA.model();
    if (S.c.aha !== 'on') return 'Off';
    if (!m.configured || m.status === 'setup') return 'Set up on your phone';
    if (m.status === 'error') return m.error === 'auth' ? 'Home Assistant refused the token' : m.error === 'network' ? 'Couldn’t reach Home Assistant' : 'Home Assistant didn’t answer as expected';
    if (m.status !== 'ok') return 'Connecting…';
    return m.rooms.length === 1 ? '1 room' : m.rooms.length + ' rooms';
  }
  /* "Inside 21° · 48%" under the clock, in the weather's unit. */
  function haInside() {
    var m = haShown() ? HA.model() : null, ind = m && m.indoor, t, parts = [];
    if (!ind) return '';
    if (ind.temp !== null) { t = ind.temp; if (ind.tunit !== S.c.wunit) t = ind.tunit === 'f' ? (t - 32) * 5 / 9 : t * 9 / 5 + 32; parts.push(Math.round(t) + '°'); }
    if (ind.humidity !== null) parts.push(Math.round(ind.humidity) + '%');
    return 'Inside ' + parts.join(' · ');
  }
  function openHaSettings() { if (PHONE) S.phone = PHONE.info(); HA.refresh(); S.detailFocus.ha = 'ha.refresh'; openAppearance('ha'); } // always on Connection, never back on Disconnect
  function haSections() {
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
    if (m.configured) out.push({ id: 'haforget', title: '', items: [{ action: 'ha.forget', label: 'Disconnect Home Assistant' }] });
    return out;
  }
  /* OK on a room shows or hides it; every room shown is stored as "all", so new rooms appear by themselves. */
  function haArea(i) {
    var m = HA.model(), name = m.areas[i], list = m.selected.length ? m.selected.slice() : m.areas.slice(), at;
    if (name === undefined) return;
    at = list.indexOf(name);
    if (at >= 0) { if (list.length === 1) return; list.splice(at, 1); } else list.push(name);
    HA.setAreas(list.length === m.areas.length ? [] : list);
  }
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
  function openHa() { HA.refresh(); S.note = null; push({ id: 'ha', top: 0, ctop: 0, f: { zone: 'rooms', l: 0, i: 0, c: 0 } }); }
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
  function haHeld() {
    var t = top(), item;
    if (t.id !== 'ha') return null;
    item = haItem(t, haLayout());
    return item && item.control ? item : null;
  }
  function haFind(id) {
    var found = null;
    if (HA && HA.running()) HA.model().rooms.forEach(function (r) { r.items.forEach(function (it) { if (it.id === id) found = it; }); });
    return found;
  }
  function openHaControl(item) {
    if (!item || !item.control || top().id !== 'ha') return;
    var t = { id: 'hactl', item: item.id, mode: item.control.kind, f: { zone: '', s: 0, m: 0 } }, c = item.control;
    S.note = null;
    t.f.s = Math.max(0, hcCurrent(c));
    t.f.m = Math.max(0, c.kind === 'climate' ? c.modes.indexOf(c.mode) : 0);
    push(t); norm(); render();
  }
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
  /* ---------- Updates: the native side checks the public releases and opens Android's installer ---------- */
  var UPDATE = ANDROID && FrameDevice.update ? FrameDevice.update : null;
  function updateReady() { return S.update && (S.update.status === 'available' || S.update.status === 'ready'); }
  function updateLine() {
    var u = S.update;
    if (!u) return '';
    if (u.status === 'checking') return 'Checking…';
    if (u.status === 'downloading') return 'Downloading ' + u.progress + '%';
    if (u.status === 'installing') return 'Opening the installer…';
    if (updateReady()) return 'Update available: ' + u.latest;
    if (u.status === 'error') return 'Couldn’t check for updates';
    return 'Version ' + u.current;
  }
  function updateSections() {
    var u = S.update, main;
    if (u.status === 'downloading') main = { action: 'update.wait', label: 'Downloading Shore ' + u.latest, description: u.progress + '%' };
    else if (u.status === 'installing') main = { action: 'update.wait', label: 'Opening the installer…', description: 'Android asks you to confirm' };
    else if (updateReady() && u.personal) main = { action: 'update.check', label: 'Shore ' + u.latest + ' is out', description: 'Rebuild Shore to update' };
    else if (updateReady()) main = { action: 'update.install', label: 'Install Shore ' + u.latest, description: u.title || (u.size ? (u.size / 1048576).toFixed(1) + ' MB' : '') };
    else main = { action: 'update.check', label: u.status === 'checking' ? 'Checking…' : 'Check for updates', description: u.status === 'current' ? 'Shore ' + u.current + ' is the latest version' : 'You have Shore ' + u.current };
    return [{ id: 'update', title: '', items: [main, { action: 'update.auto', label: 'Check automatically', description: 'Every few hours, when Shore opens', tick: true, applied: u.auto }],
      reason: u.status === 'error' ? u.error
        : u.personal ? (updateReady() ? 'You built this copy of Shore yourself, so it doesn’t replace itself with the public APK. Pull the latest source, then build and install the new APK.' : 'You built this copy of Shore yourself. Shore tells you when a new version is out; then rebuild it from the latest source.')
        : updateReady() && !u.canInstall ? 'First, Shore asks for permission to install apps. Allow it, then come back and press OK again.'
        : 'Updates come from Shore’s public releases. Android asks you to confirm, and your settings and photos stay.' }];
  }
  /* Settings › Phone: the Shore Companion web app, paired by QR code, and the photos it sent. */
  function phoneSections(flat) {
    var p = S.phone, n = p.count;
    var sections = [{ id: 'companion', title: '', items: [{ action: 'phone.toggle', label: 'Phone companion', description: 'Send photos and change settings from your phone', tick: true, applied: p.enabled }],
      reason: p.enabled ? '' : 'The companion runs on your home Wi-Fi only and needs this code to pair.' }];
    if (p.enabled) sections.push({ id: 'phonecode', title: '', items: [], qr: (PHONE && PHONE.qr ? PHONE.qr() : p.qr) || ' ', url: p.url,
      qrNote: p.url ? 'Point your phone’s camera at the code, then tap Install app to keep Shore Companion on your phone. Without internet, open this address instead:' : 'Connect the TV to your Wi-Fi to use the companion.' });
    sections.push({ id: 'phoneuse', title: 'Wallpaper', items: [choice('source', 'phone', flat || !n)]
      .concat(n ? [{ action: 'phone.clear', label: 'Remove all my photos', description: n === 1 ? '1 photo' : n + ' photos' }] : [])
      .concat(p.enabled ? [{ action: 'phone.forget', label: 'Forget paired phones' }] : []),
      reason: flat ? 'Choose Photo in Background to use online wallpapers.' : !n ? 'Send a photo from your phone first.' : sourceOn('phone') && S.onlineStatus ? ONLINE_STATUS[S.onlineStatus] || '' : '' });
    return sections;
  }
  /* ---------- Setup and health: each step with its live status; OK opens the place that fixes it ---------- */
  function healthItems() {
    var items = [], r = S.remote, failed;
    if (REMOTE) items.push({ action: 'health.remote', label: 'Home button opens Shore', tick: true, applied: r.service && !r.blocked,
      description: !r.service ? 'Turn on Shore in Accessibility' : r.blocked ? 'Blocked after a restart: turn it off and on' : 'Working' });
    if (NOWPLAYING) items.push({ action: 'nowplaying.access', label: 'Show what’s playing', tick: true, applied: !!S.playing.access,
      description: S.playing.access ? 'Working' : 'Allow Shore in Notification access' });
    if (ONLINE) {
      failed = String(ONLINE_INFO.failed || '').split(',').filter(function (id) { return id && sourceOn(id); });
      items.push({ action: 'background.online', label: 'Wallpaper sources', tick: true, applied: !failed.length,
        description: failed.length ? T('Couldn’t reach') + ' ' + failed.map(function (id) { return T(sourceName(id)); }).join(', ') : sourceNote() });
    }
    if (PHONE) items.push({ action: 'health.phone', label: 'Phone companion', tick: true, applied: S.phone.enabled,
      description: S.phone.enabled ? (S.phone.url ? 'On · ' + S.phone.url.replace(/^https?:\/\//, '') : 'On') : 'Send photos and change settings from your phone' });
    if (UPDATE) items.push({ action: 'open.updates', label: 'Shore updates', tick: true, applied: !updateReady() && S.update.status !== 'error', description: updateLine() });
    return items;
  }
  function healthTodo() { return healthItems().filter(function (i) { return !i.applied; }).length; }
  function healthLine() { var n = healthTodo(); return !n ? 'Everything is set up' : n === 1 ? '1 thing to check' : n + ' things to check'; }
  function healthSections() {
    return [{ id: 'health', title: '', items: healthItems() }]; // ticks and the OK hint say what to do; a note would not fit
  }
  function openHealth() {
    if (REMOTE) refreshRemote();
    if (NOWPLAYING) S.playing.access = NOWPLAYING.info(false).access;
    if (ONLINE) ONLINE_INFO = ONLINE.info();
    if (PHONE) S.phone = PHONE.info();
    if (UPDATE) S.update = UPDATE.info();
    openAppearance('health');
  }
  /* ---------- Phone companion: every setting from the phone ----------
     Shore publishes what each setting can be and what it is now; the companion sends a choice back and
     Shore applies it exactly as if it was chosen with the remote. */
  var COMPANION_GROUPS = [
    ['Wallpaper', ['bg', 'wall', 'source', 'mode', 'motion', 'ncalm']],
    ['Home screen', ['layout', 'apps', 'controls', 'cwatch', 'crecent']],
    ['App icons', ['istyle', 'isize']],
    ['Style', ['focus', 'material', 'tint', 'dglass']],
    ['Text', ['font', 'tweight', 'tsize']],
    ['Inputs', ['inputs', 'iask']],
    ['Clock', ['cformat', 'csec', 'cdate', 'csize', 'cweight', 'cpos', 'ccal']],
    ['Weather', ['cweather', 'wunit', 'wicon', 'wfx']],
    ['Music', ['cplaying', 'cwave', 'cart', 'npdim', 'clook', 'plyric', 'pword', 'pbeat', 'pqueue', 'ptrans']],
    ['News', ['cnews', 'nsrc']],
    ['Add-ons', ['aha']],
    ['Night', ['night', 'nhours', 'ndim', 'idle']],
    ['Screensaver', ['saver', 'svsrc', 'svtime', 'svlay', 'svmotion', 'svclock', 'svpos', 'svdate', 'svmusic', 'svphoto']]];
  var companionTimer = 0, companionLast = '';
  function companionAxis(axis) {
    var out;
    if (axis === 'wall') return { id: 'wall', name: T('Wallpaper'), kind: 'wall', value: S.c.wall,
      options: WALLS.map(function (w) { return { value: w.id, label: T(w.name), mine: /^file:/.test(w.src || '') }; }) };
    if (axis === 'mode') return { id: 'mode', name: T('Rotation'), kind: 'list', value: S.c.mode, options: MODES.map(function (m) { return { value: m.id, label: T(m.name) }; }) };
    if (axis === 'source') return ONLINE ? { id: 'source', name: T('Wallpaper sources'), kind: 'multi', value: sourceList(),
      options: SOURCES.filter(function (o) { return !o.key || ONLINE_INFO[o.key]; }).filter(function (o) { return o.id !== 'phone' || PHONE; }).map(function (o) { return { value: o.id, label: T(o.name) }; }) } : null;
    if (axis === 'layout') return { id: 'layout', name: T('Layout'), kind: 'choice', value: isShelf() ? 'shelf' : S.c.layout,
      options: [{ value: 'list', label: T('List') }, { value: 'dock', label: T('Dock') }, { value: 'shelf', label: T('Shelf') }] };
    if ((axis === 'cart' || axis === 'npdim' || axis === 'clook' || axis === 'cplaying' || axis === 'cwave' || axis === 'svmusic' || axis === 'plyric' || axis === 'pword') && !NOWPLAYING) return null;
    if (axis === 'pbeat' && !(NOWPLAYING && NOWPLAYING.beat)) return null;
    if ((axis === 'cnews' || axis === 'nsrc') && !NEWS) return null;
    if (axis === 'cwatch' && !WATCH) return null;
    if (axis === 'aha' && !(HA && HA.available())) return null;
    if (axis === 'nsrc') return { id: 'nsrc', name: T('News source'), kind: 'list', value: S.c.nsrc,
      options: ['google'].concat(newsOutlets().map(function (o) { return o.id; })).concat(['phone']).map(function (v) { return { value: v, label: T(newsSourceName(v)) }; }) };
    if (!LOOK_VALUES[axis]) return null;
    if (TOGGLES.indexOf(axis) >= 0) return { id: axis, name: T(LOOK_NAMES[axis]), kind: 'toggle', value: S.c[axis] };
    out = { id: axis, name: T(LOOK_NAMES[axis] || axis), kind: 'choice', value: S.c[axis], options: LOOK_VALUES[axis].map(function (v) { return { value: v, label: T(choice(axis, v).label) }; }) };
    return out;
  }
  function companionModel() {
    var home = S.c.home.map(function (id) { var a = app(id); return a ? { id: id, name: a.name } : null; }).filter(Boolean);
    var others = APPS.filter(function (a) { return !a.input && a.appId && S.c.home.indexOf(a.id) < 0; }).slice(0, 80).map(function (a) { return { id: a.id, name: a.name }; });
    return { version: 1, lang: (window.CleanFrameI18n && CleanFrameI18n.lang) || 'en', saver: !!S.saver, cap: CAP,
      groups: COMPANION_GROUPS.map(function (g) { return { name: T(g[0]), items: g[1].map(companionAxis).filter(Boolean) }; }).filter(function (g) { return g.items.length; }),
      home: home, others: others, backup: backupOf(),
      labels: { start: T('Start the screensaver now'), apps: T('Apps on Home'), more: T('Other installed apps'), full: T(FULL) } };
  }
  /* Backup for the companion: every saved preference, in the same format Shore stores. No timestamp, so an unchanged
     model is not republished; the phone dates the file. Photos stay on the TV and are not part of it. */
  function backupOf() { return { shore: 'backup', format: 1, settings: serialise(S.c) }; }
  /* Restore from the companion. The backup goes through clean(), exactly like saved preferences at startup,
     so a damaged or edited file can only fall back to defaults. Shore then reloads with it. */
  window.CleanFrameCompanionRestore = function (json) {
    var o, c;
    try { o = JSON.parse(String(json)); } catch (e) { return; }
    if (!o || o.shore !== 'backup' || !o.settings || typeof o.settings !== 'object' || Array.isArray(o.settings)) return;
    c = clean(o.settings);
    c.source = sourceCsv(o.settings.source);
    if (ONLINE) ONLINE.select(c.source, false);
    try { localStorage.setItem(KEY, JSON.stringify(serialise(c))); sessionStorage.setItem('shore.restored', '1'); } catch (e) { return; }
    location.reload();
  };
  function publishCompanion(now) {
    if (!PHONE || !PHONE.publish) return;
    clearTimeout(companionTimer);
    if (!now) { companionTimer = setTimeout(function () { publishCompanion(true); }, 400); return; }
    var text;
    try { text = JSON.stringify(companionModel()); } catch (e) { return; }
    if (text === companionLast) return;
    companionLast = text; PHONE.publish(text);
  }
  window.CleanFrameCompanionSet = function (axis, value) {
    var patch = {}, i, order;
    axis = String(axis); value = String(value);
    try {
      if (axis === 'mode') { if (MODES.some(function (m) { return m.id === value; })) applyRotation(value); }
      else if (axis === 'source') { if (SOURCES.some(function (o) { return o.id === value; })) applySource(value); }
      else if (axis === 'layout') { if (/^(list|dock|shelf)$/.test(value)) setLook({ layout: value === 'list' ? 'list' : 'dock', lstyle: value === 'shelf' ? 'shelf' : 'glass' }, { row: 'layout' }); }
      else if (axis === 'action') { if (value === 'saver') startSaver(); }
      else if (axis === 'home.add') { if (app(value)) homeAdd(value); }
      else if (axis === 'home.remove') { if (app(value)) homeRemove(value); }
      else if (axis === 'home.up' || axis === 'home.down') {
        i = S.c.home.indexOf(value); order = S.c.home.slice();
        if (i >= 0 && (axis === 'home.up' ? i > 0 : i < order.length - 1)) {
          order.splice(i, 1); order.splice(axis === 'home.up' ? i - 1 : i + 1, 0, value);
          homeMove(order, value, snap());
        }
      }
      else if (axis === 'wall') { if (wall(value)) setLook({ wall: value }, { row: 'bg' }); }
      else if (LOOK_VALUES[axis] && LOOK_VALUES[axis].indexOf(value) >= 0) { patch[axis] = value; setLook(patch, { row: axis }); }
    } catch (e) { log('Companion: ' + e.message); }
    S.note = ''; render(); publishCompanion(true);
  };
  function detailSections(t) {
    var flat = S.c.bg !== 'photo', inactive = !materialApplies();
    function options(axis, values, disabled) { return values.map(function (value) { return choice(axis, value, disabled); }); }
    /* Wallpaper: Light and Dark need nothing else, so the photo settings only appear with Photo. */
    if (t.group === 'background') return [
      { id: 'bg', title: 'Background type', horizontal: true, items: options('bg', ['photo', 'light', 'dark']), reason: flat ? 'Choose Photo for wallpapers, sources and motion.' : '' }]
      .concat(flat ? [] : [
        { id: 'wall', title: 'Photo', items: [{ action: 'background.wallpaper', label: wall(S.c.wall).name, thumbnail: true }]
          .concat(ONLINE ? [{ action: 'background.online', label: 'Sources', description: sourceShort(), pair: true }] : [])
          .concat([{ action: 'background.rotation', label: 'Rotation', description: T(mode().name), pair: true }]) },
        { id: 'motion', title: 'Background motion', horizontal: true, items: options('motion', ['still', 'drift']) },
        { id: 'ncalm', title: '', items: options('ncalm', ['on'], S.c.night === 'off'), reason: S.c.night === 'off' ? 'Needs Night mode.' : '' }]);
    if (t.group === 'layout') return [
      { id: 'layout', title: 'Layout', horizontal: true, items: [
        { action: 'choice.layout.list', axis: 'layout', value: 'list', label: 'List', applied: S.c.layout === 'list' },
        { action: 'choice.layout.dock', axis: 'layout', value: 'dock', label: 'Dock', applied: S.c.layout === 'dock' && S.c.lstyle !== 'shelf' },
        { action: 'choice.layout.shelf', axis: 'layout', value: 'shelf', label: 'Shelf', applied: isShelf() }] },
      { id: 'apps', title: 'App display', horizontal: true, items: options('apps', ['text', 'icons', 'both']) },
      { id: 'controls', title: 'Home controls', horizontal: true, items: options('controls', ['text', 'icons', 'both']) },
      { id: 'iconlink', title: '', items: (WATCH ? [watchChoice()] : []).concat([recentChoice(), { action: 'open.icons', label: 'App icons', description: iconSummary(), pair: true }]) }
    ];
    /* App icons: style, size and an installed icon pack. */
    if (t.group === 'icons') return [
      { id: 'istyle', title: 'Icon style', horizontal: true, items: options('istyle', ['shore', 'original', 'mono'], S.c.apps === 'text'),
        reason: S.c.apps === 'text' ? 'Choose Icons or Both in App display to show icons.' : S.c.istyle === 'shore' ? 'Shore’s own single-colour logos where it has one, the app’s icon otherwise.' : S.c.istyle === 'mono' ? 'Every icon in one colour.' : '' },
      { id: 'isize', title: 'Icon size', horizontal: true, items: options('isize', ['small', 'default', 'large'], S.c.layout !== 'dock' || S.c.apps === 'text') }]
      .concat(ICON_PACKS ? [{ id: 'ipack', title: 'Icon pack', items: [{ action: 'open.iconpack', label: packName(S.c.ipack), description: iconPacks().length ? '' : 'None installed', pair: true }] }] : [])
      .concat([{ id: 'iconapps', title: '', items: [{ action: 'open.iconapps', label: 'Per app', description: Object.keys(S.c.iconFor).length ? Object.keys(S.c.iconFor).length + (Object.keys(S.c.iconFor).length === 1 ? ' app chosen' : ' apps chosen') : 'Automatic', pair: true }] }]);
    if (t.group === 'iconapps') return [{ id: 'iconapps', title: '', items: S.c.home.filter(function (id) { return app(id) && !app(id).input; }).map(function (id) {
      return { action: 'iconapp.' + id, label: app(id).name, description: iconChoiceName(id), glyph: appMark(app(id), 56, 40, 34), pair: true };
    }), reason: 'Long OK on an app on Home opens this too.' }];
    if (t.group === 'appicon') {
      var ia = app(t.app), ipkg = ia && ia.appId && PKG_RE.test(ia.appId) && ANDROID ? ia.appId : '', icur = ia ? S.c.iconFor[ia.id] || 'auto' : 'auto';
      if (!ia) return [];
      return [{ id: 'iconbase', title: '', items: [{ action: 'iconset.auto', label: 'Automatic', description: 'Follows the icon style', tick: true, applied: icur === 'auto', glyph: autoMark(ia, 56, 40, 34) }]
        .concat(ipkg ? [{ action: 'iconset.own', label: 'App’s own icon', tick: true, applied: icur === 'own', glyph: nativeMark(ia, ia.icon || '/appicon/' + ipkg + '.png', 56, 40, 34, true) }] : [])
        .concat(ipkg && maskSupport ? [{ action: 'iconset.mono', label: 'One colour', tick: true, applied: icur === 'mono', glyph: maskIcon('/appicon/mono/_/' + ipkg + '.png', 56, 40, 34) }] : []) },
        { id: 'iconmarks', title: 'Shore icons', items: shoreMarks().map(function (m) {
          return { action: 'iconset.mark:' + m, label: markName(m), tick: true, applied: icur === 'mark:' + m, glyph: markHtml(m, 56, 40, 34) };
        }) }];
    }
    if (t.group === 'iconpack') return [{ id: 'packs', title: '', items: [{ action: 'pack.', label: 'None', tick: true, applied: !S.c.ipack }]
      .concat(iconPacks().map(function (p) { return { action: 'pack.' + p.id, label: p.name, tick: true, applied: S.c.ipack === p.id }; })),
      reason: iconPacks().length ? 'Apps the pack doesn’t draw keep the icon style you chose.' : 'Install an icon pack, for example one made for Projectivy Launcher, and it appears here.' }];
    /* Inputs: where they go, whether Shore asks to switch, and which ones show at all. */
    if (t.group === 'inputs') return [
      { id: 'inputs', title: 'Place inputs', horizontal: true, items: options('inputs', ['front', 'row'], S.c.layout === 'list').concat(ANDROID ? options('iask', ['on']) : []),
        reason: S.c.layout === 'list' ? 'Own row needs the Dock layout.' : '' },
      { id: 'inlist', title: 'Show on Home', items: INPUTS.map(function (i) {
        return { action: 'input.toggle.' + i.id, label: app(i.id).name, tick: true, applied: S.c.hidein.indexOf(i.id) < 0 };
      }), reason: INPUTS.length ? 'Only devices that are switched on appear on Home.' : 'No HDMI inputs found.' }];
    if (t.group === 'fonts') return [{ id: 'font', title: '', items: options('font', LOOK_VALUES.font) }];
    if (t.group === 'typography') return [
      { id: 'fontpick', title: 'Font', items: [{ action: 'typography.fonts', label: FONTS[S.c.font].name }] },
      { id: 'tweight', title: 'Text weight', horizontal: true, items: options('tweight', ['auto', 'light', 'regular', 'bold']) },
      { id: 'tsize', title: 'App name size', horizontal: true, items: options('tsize', ['small', 'default', 'large']) }];
    if (t.group === 'clock') return [
      { id: 'cformat', title: 'Format', horizontal: true, items: options('cformat', ['12', '24']).concat(options('cdate', ['on'])).concat(options('csec', ['on'])) },
      { id: 'csize', title: 'Clock size', horizontal: true, items: options('csize', ['small', 'medium', 'large', 'huge']) },
      { id: 'cweight', title: 'Clock weight', horizontal: true, items: options('cweight', ['auto', 'thin', 'light', 'bold']) },
      { id: 'cpos', title: 'Clock position', horizontal: true, items: options('cpos', ['left', 'center'], S.c.layout === 'list'), reason: S.c.layout === 'list' ? 'Centred needs the Dock layout.' : '' }]
      .concat(CALENDAR ? [{ id: 'ccal', title: '', items: [choice('ccal', 'on')], reason: S.phone.calendar ? 'Your next event from the calendar address set on your phone.' : 'Add your calendar’s iCal address in the phone companion.' }] : []);
    if (t.group === 'weather') return [
      { id: 'cweather', title: '', items: [{ action: 'choice.cweather.on', axis: 'cweather', value: 'on', label: 'Show the weather', tick: true, applied: S.c.cweather === 'on' }],
        reason: PHONE ? 'Weather by Open-Meteo. Set your place in the phone companion.' : 'Weather by Open-Meteo.' },
      { id: 'wunit', title: 'Temperature', horizontal: true, items: options('wunit', ['c', 'f'], S.c.cweather !== 'on') },
      { id: 'wdetails', title: 'Details', horizontal: true, items: options('wicon', ['on'], S.c.cweather !== 'on').concat(options('wfx', ['on'], S.c.cweather !== 'on' || flat)),
        reason: S.c.cweather === 'on' && S.c.wfx === 'on' ? flat ? 'Weather effects need a Photo background.' : 'Rain, snow, fog and storms over the photo, when it’s happening outside.' : '' }];
    if (t.group === 'music') return [
      { id: 'cplaying', title: 'Under the clock', horizontal: true, items: options('cplaying', ['on']).concat(options('cwave', ['on'], S.c.cplaying !== 'on')) }]
      .concat(S.c.cplaying === 'on' && !S.playing.access ? [{ id: 'nowplaying', title: '', items: [{ action: 'nowplaying.access', label: 'Notification access' }] }] : [])
      .concat([
        { id: 'cart', title: 'While music plays', items: [{ action: 'choice.cart.on', axis: 'cart', value: 'on', label: 'Album art as background', tick: true, applied: S.c.cart === 'on', disabled: flat }]
          .concat(options('clook', ['on'], flat || S.c.cart !== 'on')),
          reason: flat ? 'Album art needs a Photo background.' : S.c.clook === 'on' ? 'Sends only the artist, title and album.' : 'Uses only the cover the music app provides.' },
        { id: 'npdim', title: 'Album art dimming', horizontal: true, items: options('npdim', ['none', 'soft', 'strong'], flat || S.c.cart !== 'on') },
        { id: 'pviewlink', title: '', items: [{ action: 'open.musicview', label: 'Music view', description: [S.c.plyric === 'on' ? 'Lyrics' : '', S.c.pbeat === 'on' ? 'Beat pulse' : ''].filter(Boolean).map(T).join(', ') || 'Off', pair: true }] }]);
    /* Music view: what the full-screen player shows. */
    if (t.group === 'musicview') return [
      { id: 'plyric', title: '', items: options('plyric', ['on']).concat(options('pword', ['on'], S.c.plyric !== 'on')).concat(NOWPLAYING && NOWPLAYING.translate ? options('ptrans', ['on'], S.c.plyric !== 'on') : [])
          .concat(NOWPLAYING && NOWPLAYING.beat ? options('pbeat', ['on']) : []).concat(options('pqueue', ['on'])),
        reason: S.c.pbeat === 'on' ? 'The pulse follows the TV’s sound, never the microphone. Android still calls this permission recording audio.' : S.c.ptrans === 'on' && S.c.plyric === 'on' ? 'Synced lyrics are sent to Google Translate, line by line, into the TV’s language.' : 'Lyrics come from LRCLIB. Only the artist, title, album and length are sent.' }];
    if (t.group === 'news') return [
      { id: 'cnews', title: '', items: [{ action: 'choice.cnews.on', axis: 'cnews', value: 'on', label: 'Headlines under the clock', tick: true, applied: S.c.cnews === 'on' }] },
      { id: 'nsrc', title: 'Source', items: options('nsrc', ['google'].concat(newsOutlets().map(function (o) { return o.id; })), S.c.cnews !== 'on')
        .concat(PHONE ? options('nsrc', ['phone'], S.c.cnews !== 'on') : []),
        reason: S.c.nsrc === 'phone' && !phoneFeed() ? 'Add a feed in the phone companion. Until then, Google News.' : '' }];
    if (t.group === 'display') return [
      { id: 'night', title: 'Night mode', horizontal: true, items: options('night', ['off', 'scheduled', 'always']) },
      { id: 'nhours', title: 'Night hours', horizontal: true, items: options('nhours', ['21-7', '22-6', '23-7'], S.c.night !== 'scheduled') },
      { id: 'ndim', title: 'Night dimming', horizontal: true, items: options('ndim', ['soft', 'medium', 'strong'], S.c.night === 'off') },
      { id: 'idle', title: 'Hide controls when idle', horizontal: true, items: options('idle', ['off', '1', '5']),
        reason: S.c.idle !== 'off' ? 'The clock and picture stay. Any button brings the controls back.' : '' }].concat(SLEEP ? [sleepSection()] : []);
    if (t.group === 'screensaver') return [
      { id: 'saver', title: 'Start after', horizontal: true, items: options('saver', ['off', '5', '10', '15']) },
      { id: 'svsrc', title: 'Photos', horizontal: true, items: options('svsrc', ['like', 'every', 'builtin']) },
      { id: 'svtime', title: 'Each slide', horizontal: true, items: options('svtime', ['15', '30', '60']) },
      { id: 'saverstart', title: '', items: [{ action: 'open.saverlook', label: 'Arrangement and clock', more: true }, { action: 'saver.start', label: 'Start the screensaver now' }] }];
    if (t.group === 'saverlook') return [
      { id: 'svlay', title: 'Arrangement', horizontal: true, items: options('svlay', ['mix', 'single', 'mosaic']) },
      { id: 'svmotion', title: 'Photo motion', horizontal: true, items: options('svmotion', ['drift', 'still']) },
      { id: 'svpos', title: 'Clock on the screensaver', horizontal: true, items: options('svclock', ['on']).map(function (c) { c.label = 'Show'; return c; }).concat(options('svpos', ['move', 'fixed'], S.c.svclock !== 'on')) },
      { id: 'svshow', title: 'Also show', items: options('svdate', ['on']).concat(NOWPLAYING ? options('svmusic', ['on']) : []).concat(options('svphoto', ['on'])) }];
    if (t.group === 'focus') return [
      { id: 'focus', title: 'Focus style', horizontal: true, items: options('focus', ['type', 'glass']) },
      { id: 'material', title: 'Material', horizontal: true, items: options('material', ['soft', 'frost', 'tint'], inactive),
        reason: inactive ? flat ? 'Materials are available with a Photo background.' : 'Choose Glass focus or the Dock layout to use materials.' : '' },
      { id: 'tint', title: 'Accent', horizontal: true, items: options('tint', ['none', 'warm', 'cool', 'rose', 'green'], flat) },
      { id: 'dglass', title: 'App row glass', horizontal: true, items: options('dglass', ['clear', 'default', 'solid'], flat || S.c.layout !== 'dock') }
    ];
    if (t.group === 'phone') return phoneSections(flat);
    if (t.group === 'addons') return addonSections();
    if (t.group === 'ha') return haSections();
    if (t.group === 'updates') return updateSections();
    if (t.group === 'health') return healthSections();
    if (t.group === 'online' || t.group === 'unsplash' || t.group === 'animated') {
      var items = SOURCES.filter(function (o) { return o.page === t.group; }).map(function (o) { var c = choice('source', o.id, flat || o.key && !ONLINE_INFO[o.key]); if (o.unsplash) c.label = T(c.label).replace(/^Unsplash · /, ''); return c; });
      var missing = SOURCES.filter(function (o) { return o.page === t.group && o.key && !ONLINE_INFO[o.key]; }).map(function (o) { return o.key; });
      if (t.group === 'online') items = items.filter(function (item) { return item.value !== 'phone' || PHONE; }).concat([
        { action: 'open.unsplash', label: pageCount('unsplash', 'Unsplash themes'), more: true, disabled: flat },
        { action: 'open.animated', label: pageCount('animated', 'Animated wallpapers'), more: true, disabled: flat }]);
      return [{ id: 'source', title: '', compact: t.group === 'online', items: items,
        reason: flat ? 'Choose Photo in Background to use online wallpapers.' : sourceNote() || (missing.length ? keyNote(missing) : '') }];
    }
    if (t.group === 'rotation') return [{ id: 'mode', title: '', items: options('mode', MODES.map(function (m) { return m.id; }), flat),
      reason: flat ? 'Choose Photo in Background to use rotation.' : '' }];
    if (PARENT[t.group] && remotePage(t)) return remoteSections(t);
    if (t.group === 'lock') return lockSections();
    if (t.group === 'lockapps') return [{ id: 'lockapps', title: '', items: S.c.home.concat(S.c.lock.apps.filter(function (id) { return S.c.home.indexOf(id) < 0; })).filter(function (id) { return app(id) && !app(id).input; }).map(function (id) {
      return { action: 'lock.app.' + id, label: app(id).name, tick: true, applied: S.c.lock.apps.indexOf(id) >= 0, glyph: appMark(app(id), 56, 40, 34) };
    }), reason: 'Locked apps ask for the PIN before they open, from Home, All apps and Continue watching.' }];
    return [{ id: 'samsung', title: '', items: [
      { action: 'samsung.home', label: TV.home, description: TV.homeLine },
      { action: 'samsung.settings', label: 'TV settings', description: 'Picture, sound and network settings' }
      , { action: 'open.lock', label: 'Parental lock', description: S.c.lock.pin ? lockLine() : 'Off' }
    ].concat(ANDROID ? [{ action: 'open.health', label: 'Setup and health', description: healthLine() }] : []).concat(UPDATE ? [{ action: 'open.updates', label: 'Shore updates', description: updateLine() }] : []).concat(REMOTE ? [{ action: 'samsung.remote', label: 'Remote buttons', description: S.remote.keys.length ? S.remote.keys.length + (S.remote.keys.length === 1 ? ' button assigned' : ' buttons assigned') : 'Reassign the app and TV buttons' }] : []) }];
  }
  function lockLine() { var n = S.c.lock.apps.length, parts = []; if (S.c.lock.settings) parts.push(T('Settings')); if (n) parts.push(n === 1 ? T('1 app') : T(n + ' apps')); return parts.length ? parts.join(', ') : 'PIN set, nothing locked'; }
  function lockSections() {
    var pin = !!S.c.lock.pin, n = S.c.lock.apps.length;
    return [{ id: 'lockpin', title: '', items: pin ? [{ action: 'lock.pin', label: 'Change PIN' }, { action: 'lock.off', label: 'Turn off the lock', description: 'Forgets the PIN and unlocks everything' }]
        : [{ action: 'lock.pin', label: 'Choose a PIN', description: 'Four digits' }] },
      { id: 'lockwhat', title: 'Ask for the PIN', items: [{ action: 'lock.settings', label: 'Settings', description: 'Also Apps on Home and Quick actions', tick: true, applied: S.c.lock.settings, disabled: !pin },
        { action: 'open.lockapps', label: 'Apps', description: n ? (n === 1 ? '1 app locked' : n + ' apps locked') : 'None', pair: true, disabled: !pin }],
        reason: pin ? 'Forgot the PIN? Clearing Shore’s storage in the TV’s Android settings removes it, along with Shore’s other settings.' : 'Choose a PIN first.' }];
  }
  function detailRows(t) {
    var rows = [[{ action: 'settings.back', label: parentName(t) }]];
    detailSections(t).forEach(function (section) {
      var enabled = section.items.filter(function (item) { return !item.disabled; });
      if (section.horizontal && enabled.length) rows.push(enabled);
      else enabled.forEach(function (item) { rows.push([item]); });
    });
    if (S.lookError) rows.push([{ action: 'settings.retry', label: 'Try again' }]);
    return rows;
  }
  function detailLocation(t) {
    var rows = detailRows(t), row = 0, column = 0;
    rows.forEach(function (items, r) { items.forEach(function (item, c) { if (item.action === t.f.action) { row = r; column = c; } }); });
    return { rows: rows, row: row, column: column, item: rows[row][column] };
  }
  function detailFocus(t, item, column) {
    t.f.action = item.action;
    if (item.action !== 'settings.back') S.detailFocus[t.group] = item.action;
    if (column !== undefined) t.f.column = column;
    if (item.axis) S.appearanceFocus = item.axis;
  }
  function applyRotation(value) {
    var c;
    if (S.c.bg !== 'photo') return;
    S.err = null; S.lookError = null;
    if (value === S.c.mode) return;
    c = next(S.c.home.slice(), S.c.recent.slice()); c.mode = value;
    if (!write(c, 'Wallpaper rotation')) S.lookError = { type: 'save', patch: { mode: value }, row: 'mode', transient: false };
  }
  function pageCount(page, label) { var n = SOURCES.filter(function (o) { return o.page === page && sourceOn(o.id); }).length; return n ? T(label) + ' · ' + n : label; }
  /* What rotates now, and what could not be reached. */
  function sourceNote() {
    var failed = String(ONLINE_INFO.failed || '').split(',').filter(function (id) { return id && sourceOn(id); }).map(function (id) { return T(sourceName(id)); });
    if (S.onlineStatus === 'loading') return ONLINE_STATUS.loading;
    if (failed.length) return T('Couldn’t reach') + ' ' + failed.join(', ') + '. ' + T('Shore tries again later.');
    return T('Rotating') + ' ' + rotationPool().length + ' ' + T('photos') + '.';
  }
  function keyNote(keys) {
    var names = keys.filter(function (k, i) { return keys.indexOf(k) === i; }).map(function (k) { return { unsplash: 'Unsplash', pexels: 'Pexels', klipy: 'Klipy' }[k]; });
    return names.join(' and ') + (names.length > 1 ? ' need API keys' : ' needs an API key') + ' when the app is built. See the README.';
  }
  /* OK on a source adds it to the rotation or takes it out; at least one source stays. */
  function applySource(value) {
    var c, list = sourceList(), i = list.indexOf(value);
    if (S.c.bg !== 'photo') return;
    S.err = null; S.lookError = null;
    if (i >= 0) { if (list.length === 1) { S.note = 'Keep at least one source.'; return; } list.splice(i, 1); }
    else list.push(value);
    c = next(S.c.home.slice(), S.c.recent.slice()); c.source = sourceCsv(list.join(','));
    if (!write(c, 'Wallpaper sources')) return;
    S.note = '';
    if (ONLINE) { S.onlineStatus = c.source.split(',').some(function (id) { return id !== 'builtin'; }) ? 'loading' : ''; ONLINE.select(c.source, false); }
    keepWallInRotation(); syncRotation();
  }
  /* When the shown wallpaper leaves the rotation, the first photo that rotates takes its place. */
  function keepWallInRotation() {
    var w = wall(S.c.wall), pool = rotationPool();
    if (w && inRotation(w) || !pool.length) return;
    if (S.pending) { setTimeout(keepWallInRotation, 600); return; } // a wallpaper is still loading; try once it settled
    setLook({ wall: pool[0].id }, { row: 'bg' });
  }
  /* New online photos replace the previous set in the gallery; the first new photo is shown after a source change. */
  function onlineChanged(entries, status) {
    var i, ids = [];
    S.onlineStatus = status === 'off' ? '' : status;
    if (entries) {
      for (i = WALLS.length - 1; i >= 0; i--) if (WALLS[i].online) WALLS.splice(i, 1);
      entries.forEach(function (w) { if (w && safeId(w.id) && !wall(w.id)) { WALLS.push(w); ids.push(w.id); } });
      if (!wall(S.c.wall)) setLook({ wall: (rotationPool()[0] || WALLS[0]).id }, { row: 'bg' });
      else keepWallInRotation();
    }
    if (ONLINE) ONLINE_INFO.failed = ONLINE.info().failed || '';
    render(); syncRotation();
  }
  /* The photos that rotate: those from the chosen sources. While online photos are still downloading, Shore's own fill in. */
  function rotationPool() {
    var pool = WALLS.filter(inRotation), builtin = WALLS.filter(function (w) { return !w.online; }), dark;
    // Calmer photos at night: only dark photos while night mode is on, when there are any.
    if (calmNight()) { dark = pool.filter(function (w) { return w.tone === 'dark'; }); if (dark.length) pool = dark; }
    return pool.length ? pool : builtin.filter(function (w) { return !isHidden(w); }).length ? builtin.filter(function (w) { return !isHidden(w); }) : builtin;
  }
  function iconSummary() { return T(VALUE_NAMES[S.c.istyle]) + (S.c.ipack ? ' · ' + packName(S.c.ipack) : ''); }
  function applyPack(id) {
    var c = next(S.c.home.slice(), S.c.recent.slice());
    if (id && !PKG_RE.test(id)) return;
    c.ipack = id;
    if (write(c, 'Icon pack')) render();
  }
  function toggleInput(id) {
    var c = next(S.c.home.slice(), S.c.recent.slice()), i = c.hidein.indexOf(id);
    if (i >= 0) c.hidein.splice(i, 1); else c.hidein.push(id);
    if (write(c, 'Inputs')) refreshInputs();
  }
  function detailBack() { cancelLook(); S.err = null; pop(); }
  function detailOk(t, item) {
    var patch = {}, error = S.lookError;
    if (item.action === 'settings.back') { detailBack(); return; }
    if (item.disabled || S.pending) return;
    if (item.action === 'samsung.remote') { openRemote(); return; }
    if (item.action === 'remote.learn') { startLearn(); return; }
    if (item.action === 'remote.service') { perform('Accessibility settings', REMOTE.openSettings); return; }
    if (item.action.indexOf('remote.key.') === 0) { openRemotePick(S.remote.keys[+item.action.slice(11)]); return; }
    if (item.action === 'remote.apps') { push({ id: 'appearance', group: 'remoteapp', key: t.key, f: { action: '' } }); return; }
    if (item.remote) { assignRemote(t, item.remote); return; }
    if (item.action === 'settings.retry') {
      if (error && error.patch[error.row] !== undefined) detailFocus(t, choice(error.row, error.patch[error.row]), 0);
      if (error && error.row === 'mode') applyRotation(error.patch.mode);
      else if (error) setLook(error.patch, { row: error.row });
    } else if (item.axis === 'mode') applyRotation(item.value);
    else if (item.axis === 'source') applySource(item.value);
    else if (item.axis === 'layout') setLook({ layout: item.value === 'list' ? 'list' : 'dock', lstyle: item.value === 'shelf' ? 'shelf' : 'glass' }, { row: 'layout' });
    else if (item.axis === 'cwatch' && !watchAllowed && S.c.layout !== 'list') { if (S.c.cwatch !== 'on') setLook({ cwatch: 'on' }, { row: 'cwatch' }); WATCH.allow(); }
    else if (TOGGLES.indexOf(item.axis) >= 0) {
      patch[item.axis] = S.c[item.axis] === 'on' ? 'off' : 'on'; setLook(patch, { row: item.axis });
      if (item.axis === 'pbeat' && patch.pbeat === 'on') { if (NOWPLAYING.beat.start()) NOWPLAYING.beat.stop(); else NOWPLAYING.beat.allow(); } // only the music view listens
    }
    else if (item.axis) { patch[item.axis] = item.value; setLook(patch, { row: item.axis }); }
    else if (item.action === 'background.wallpaper') openWallpaper();
    else if (item.action === 'background.rotation') openAppearance('rotation');
    else if (item.action === 'background.online') openAppearance('online');
    else if (item.action === 'typography.fonts') openAppearance('fonts');
    else if (item.action === 'open.icons') openAppearance('icons');
    else if (item.action === 'open.iconapps') openAppearance('iconapps');
    else if (/^sleep\.\d+$/.test(item.action)) setSleep(+item.action.slice(6));
    else if (item.action === 'open.lock') { if (S.c.lock.pin && !S.unlocked) askPin('Settings', function () { S.unlocked = true; openAppearance('lock'); }); else openAppearance('lock'); }
    else if (item.action === 'open.lockapps') openAppearance('lockapps');
    else if (item.action === 'lock.pin') choosePin();
    else if (item.action === 'lock.off') lockOff();
    else if (item.action === 'lock.settings') lockToggle('settings');
    else if (item.action.indexOf('lock.app.') === 0) lockToggle(item.action.slice(9));
    else if (item.action.indexOf('iconapp.') === 0) openAppIcon(item.action.slice(8), false);
    else if (item.action.indexOf('iconset.') === 0) setAppIcon(t.app, item.action.slice(8));
    else if (item.action === 'open.iconpack') { packList = null; openAppearance('iconpack'); }
    else if (item.action.indexOf('pack.') === 0) applyPack(item.action.slice(5));
    else if (item.action.indexOf('input.toggle.') === 0) toggleInput(item.action.slice(13));
    else if (item.action === 'open.unsplash') openAppearance('unsplash');
    else if (item.action === 'open.animated') openAppearance('animated');
    else if (item.action === 'open.saverlook') openAppearance('saverlook');
    else if (item.action === 'open.musicview') openAppearance('musicview');
    else if (item.action === 'open.health') openHealth();
    else if (item.action === 'open.ha') openHaSettings();
    else if (item.action === 'ha.refresh') HA.refresh();
    else if (item.action.indexOf('ha.area.') === 0) haArea(+item.action.slice(8));
    else if (item.action === 'ha.forget') openMessage('haforget');
    else if (item.action === 'health.remote') perform('Accessibility settings', REMOTE.openSettings);
    else if (item.action === 'health.phone') openPhone();
    else if (item.action === 'open.updates') { S.update = UPDATE.info(); openAppearance('updates'); }
    else if (item.action === 'update.check') UPDATE.check();
    else if (item.action === 'update.install') UPDATE.install();
    else if (item.action === 'update.auto') { UPDATE.auto(!S.update.auto); S.update = UPDATE.info(); }
    else if (item.action === 'saver.start') startSaver();
    else if (item.action === 'phone.toggle') { PHONE.enable(!S.phone.enabled); S.phone = PHONE.info(); }
    else if (item.action === 'phone.forget') { PHONE.forget(); S.phone = PHONE.info(); S.note = 'Paired phones forgotten. Scan the new code.'; }
    else if (item.action === 'phone.clear') openMessage('clearphotos'); // never delete photos on a single press
    else if (item.action === 'nowplaying.access') perform('Notification access', NOWPLAYING.openSettings);
    else if (item.action === 'samsung.home') perform(TV.home, FrameDevice.home);
    else if (item.action === 'samsung.settings') perform('TV settings', FrameDevice.settings);
  }
  V.appearance = {
    norm: function (t) {
      var rows = detailRows(t), exists = false, applied = null;
      var axis = { background: 'bg', layout: 'layout', typography: 'tweight', focus: 'focus', rotation: 'mode', online: 'source', unsplash: 'source', animated: 'source', fonts: 'font', clock: 'cformat', display: 'night', screensaver: 'saver', weather: 'wunit', news: 'nsrc', saverlook: 'svlay', musicview: 'plyric', music: 'npdim', icons: 'istyle', inputs: 'inputs' }[t.group];
      rows.forEach(function (items) { items.forEach(function (item) {
        if (item.action === t.f.action) exists = true;
        if (axis ? item.axis === axis && item.value === S.c[axis] : item.applied) applied = item;
      }); });
      // Updates: the top row changes action (check, install, wait), so focus stays on it rather than on the toggle.
      if (!exists) detailFocus(t, t.group === 'updates' || t.group === 'health' ? (rows[1] || rows[0])[0] : applied || (rows[1] || rows[0])[0], 0);
      if (t.f.column === undefined) t.f.column = detailLocation(t).column;
    },
    key: function (t, k) {
      var at = detailLocation(t), row = at.row, column = at.column;
      if (t.group === 'remote' && S.remote.learning) { stopLearn(); return; }
      if (k === 'back') { detailBack(); return; }
      if (k === 'ok') { detailOk(t, at.item); return; }
      if (k === 'up' || k === 'down') {
        row = clamp(row + (k === 'up' ? -1 : 1), 0, at.rows.length - 1);
        column = Math.min(t.f.column || 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column]);
      } else if (k === 'left' || k === 'right') {
        column = clamp(column + (k === 'left' ? -1 : 1), 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column], column);
      }
    },
    point: function (t, z, i, action) {
      if (z !== 'detail') return;
      detailRows(t).some(function (items) { return items.some(function (item, column) {
        if (item.action !== action) return false;
        detailFocus(t, item, column); detailOk(t, item); return true;
      }); });
    }
  };
  function messageContent(t) { return t.content || MSG[t.msg]; }
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

  V.pin = {
    sheet: true,
    key: function (t, k) {
      var d = /^d[0-9]$/.test(k) ? +k.slice(1) : -1;
      if (k === 'back') { if (t.cur > 0) { t.cur--; t.digits.length = t.cur; } else pop(); return; }
      t.err = '';
      if (d >= 0) { t.digits[t.cur] = d; t.cur++; t.digits.length = t.cur; }
      else if (k === 'up') t.digits[t.cur] = t.digits[t.cur] === undefined ? 0 : (t.digits[t.cur] + 1) % 10;
      else if (k === 'down') t.digits[t.cur] = t.digits[t.cur] === undefined ? 9 : (t.digits[t.cur] + 9) % 10;
      else if (k === 'right' || k === 'ok') { if (t.digits[t.cur] === undefined) t.digits[t.cur] = 0; t.cur++; t.digits.length = t.cur; }
      else if (k === 'left' && t.cur > 0) { t.cur--; t.digits.length = t.cur + 1; }
      if (t.cur >= 4) pinEntered(t);
    },
    point: function (t, z, i) { if (z === 'pin') { t.cur = Math.min(i, t.digits.length); } }
  };
  V.message = {
    sheet: true,
    key: function (t, k) {
      var A = messageContent(t).actions, a;
      if (k === 'left') t.f.b = Math.max(0, t.f.b - 1);
      else if (k === 'right') t.f.b = Math.min(A.length - 1, t.f.b + 1);
      else if (k === 'back') pop();
      else if (k === 'ok') { a = A[t.f.b][0]; pop(); if (a.indexOf('np.') === 0) musicAction(a, t.f.b); else if (a.indexOf('quick.') === 0) quickAction(a); else if (a.indexOf('input:') === 0) { clearTimeout(askTimer); launch(a.slice(6)); } else if (a === 'setup') openHealth(); else if (a === 'samsung') perform(TV.home, FrameDevice.home); else if (a === 'clearphotos' && PHONE) { PHONE.clear(); S.phone.count = 0; render(); } else if (a === 'haforget' && HA) HA.forget(); }
    },
    point: function (t, z, i) { if (z === 'act') { t.f.b = i; this.key(t, 'ok'); } }
  };

  /* ---------- Dispatch ---------- */
  function norm() { var t = top(), v = V[t.id]; if (v.norm) v.norm(t); }
  function press(k) {
    norm();
    var t = top();
    V[t.id].key(t, k);
    norm();
    render();
    syncRotation();
  }

  /* ---------- Rendering ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), homeEl = $('home'), caption = $('caption'), utilsEl = $('utils');
  // The headline keeps its own element so it fades in only when it changes, not on every clock tick.
  var capMain = document.createElement('div'), capNews = document.createElement('div');
  capMain.className = 'cap-main'; capNews.className = 'cap-news-line'; caption.appendChild(capMain); caption.appendChild(capNews);
  var utilFocusLabel = $('utilFocusLabel'), utilFocusKey = '', appFocusName = $('appFocusName');
  var dock = $('dock'), shelf = $('shelf'), track = $('track'), plate = $('plate'), matScrim = $('matScrim'), dockEmpty = $('dockEmpty');
  var cueL = $('cueL'), cueR = $('cueR'), dockAction = $('dockAction');
  var focusStatus = $('focusStatus'), sceneEl = $('scene'), appearanceEl = $('appearance'), appearanceRows = $('appearanceRows'), appearanceDesc = $('appearanceDesc');
  var appearanceBack = $('appearanceBack'), appearanceTitle = $('appearanceTitle'), appearanceStatus = $('appearanceStatus');
  var phScene = $('phScene'), phPlate = $('phPlate'), phField = $('phField'), phList = $('phList'), phRows = $('phRows'), phAction = $('phAction'), phEmpty = $('phEmpty');
  var phPlates = [phPlate, $('phPlateAlt')], phFields = [phField, $('phFieldAlt')], photoPlateIndex = 0, photoPlateKey = null;
  var utPlates = [$('utLens'), $('utLensAlt')], utFields = [$('utField'), $('utFieldAlt')], utPlateIndex = 0, utPlateKey = null;
  var photoMode = null, photoTransitionToken = 0;
  var sheetEl = $('sheet'), sheetView = $('sheetView');
  var IMG = { photo: $('photo'), mat: $('matImg'), bg: $('sheetBg'), field: $('phFieldImg'), fieldAlt: $('phFieldImgAlt'), utility: $('utFieldImg'), utilityAlt: $('utFieldImgAlt') };
  var sheetKey = '', slotEls = {}, dockEdgeFrame = 0, dockEdgeUntil = 0, dockAnchorCenter = 960;
  var appliedPalette = null, appliedPhoto = null, appliedFont = null, appliedFontMetrics = null;

  /* Curated locked palettes keep the existing rendering path exactly. */
  function applyAdaptiveInk(palette) {
    var active = S.c.bg === 'photo' && palette && !palette.locked && palette.light && palette.tl && palette.tr && palette.br;
    if (appliedPalette === palette && appliedPhoto === (S.c.bg === 'photo')) return !!active;
    appliedPalette = palette; appliedPhoto = S.c.bg === 'photo';
    ['tl', 'tr', 'br'].forEach(function (zone) {
      var r = active ? palette[zone] : null;
      var values = r ? { ink: r.ink, 'clock-ink': r.clockInk || r.ink, 'rest-ink': r.restInk, 'peer-ink': r.peerInk, rest: r.restAlpha, peer: r.peerAlpha, under: r.halo, shadow: r.shadow } : {};
      ['ink', 'clock-ink', 'rest-ink', 'peer-ink', 'rest', 'peer', 'under', 'shadow'].forEach(function (key) {
        var name = '--' + zone + '-' + key, value = values[key];
        if (value !== undefined && value !== null) stage.style.setProperty(name, String(value));
        else stage.style.removeProperty(name);
      });
    });
    if (active && palette.light) stage.style.setProperty('--home-app-ink', palette.light);
    else stage.style.removeProperty('--home-app-ink');
    return !!active;
  }
  function inkRungClasses(palette, active) {
    if (!active) return '';
    return ['tl', 'tr', 'br'].map(function (zone) {
      var rung = palette[zone].rung;
      return ['light', 'mist', 'mist-high', 'dark', 'dark-halo'].indexOf(rung) >= 0 ? ' ink-' + zone + '-' + rung : '';
    }).join('');
  }
  /* Drift: every photo-registered layer runs one animation with a phase taken from the wall clock,
     so the photo and its pre-rendered glass stay aligned whenever a layer is (re)created. */
  var DRIFT_MS = 90000, driftPausedAt = 0, driftOffset = 0;
  /* Animations run only on Home: Settings and other panels freeze them to keep the TV responsive.
     Drift uses a virtual clock that stops while paused, so layers created meanwhile stay in phase. */
  /* Night mode: dims the photo, video and glass together (one brightness filter) and softens the text. */
  /* Rain, snow, fog or a storm drawn over the photo when the current weather calls for it. CSS-only, transform and opacity. */
  var fxForced = '';
  function weatherFx() {
    if (S.c.bg !== 'photo') return '';
    var kind = fxForced || (S.c.wfx === 'on' && S.c.cweather === 'on' && WEATHER && WEATHER.icon ? WEATHER.icon() : '');
    return /^(drizzle|rain|storm|snow|fog)$/.test(kind) ? ' wx-' + kind : '';
  }
  /* Lightning: the flash layer is added only for its 1.2 s, every 9 to 21 seconds while a storm shows on Home. */
  var newsWasOn = null;
  var flashTimer = 0, flashEl = document.querySelector('.wx-f');
  function syncStorm() {
    var on = stage.className.indexOf(' wx-storm') >= 0;
    if (!on) { clearTimeout(flashTimer); flashTimer = 0; if (flashEl) flashEl.className = 'wx-f'; return; }
    if (flashTimer || !flashEl) return;
    flashTimer = setTimeout(function () {
      flashTimer = 0;
      if (stage.className.indexOf(' wx-storm') < 0) return;
      if (!animationsPaused()) { flashEl.className = 'wx-f is-on'; setTimeout(function () { flashEl.className = 'wx-f'; }, 1300); }
      syncStorm();
    }, 9000 + Math.random() * 12000);
  }
  function calmNight() { return S.c.ncalm === 'on' && S.c.bg === 'photo' && nightActive(); }
  function nightActive() {
    if (S.c.night === 'always') return true;
    if (S.c.night !== 'scheduled') return false;
    var p = S.c.nhours.split('-'), from = +p[0], to = +p[1], h = new Date().getHours();
    return from > to ? h >= from || h < to : h >= from && h < to;
  }
  var idleTimer = 0;
  function idleReset() {
    clearTimeout(idleTimer);
    if (S.idleHidden) { S.idleHidden = false; render(); }
    idleTimer = S.c.idle === 'off' ? 0 : setTimeout(function () { idleTimer = 0; if (S.c.idle !== 'off' && top().id === 'home' && !document.hidden) { S.idleHidden = true; render(); } }, +S.c.idle * QA.minuteMs);
  }
  function animationsPaused() { return document.hidden || top().id !== 'home' || S.saver; }
  function driftNow() { return (driftPausedAt || Date.now()) - driftOffset; }
  function syncPause() {
    var paused = animationsPaused();
    if (paused && !driftPausedAt) driftPausedAt = Date.now();
    else if (!paused && driftPausedAt) { driftOffset += Date.now() - driftPausedAt; driftPausedAt = 0; }
    return paused;
  }
  /* Animated wallpapers: a muted loop above the still poster; the pre-rendered glass uses the poster. */
  var VIDEO = document.createElement('video');
  VIDEO.className = 'photo-video'; VIDEO.muted = true; VIDEO.loop = true; VIDEO.setAttribute('playsinline', ''); VIDEO.setAttribute('aria-hidden', 'true');
  VIDEO._src = '';
  VIDEO.addEventListener('playing', function () { VIDEO.className = 'photo-video is-playing'; });
  /* Animated GIFs from the phone play in an image above the poster, only while Home is in front. */
  var GIF = document.createElement('img');
  GIF.className = 'photo-video'; GIF.alt = ''; GIF.setAttribute('aria-hidden', 'true'); GIF._src = '';
  GIF.addEventListener('load', function () { if (GIF._src) GIF.className = 'photo-video is-playing'; });
  function animated(w) { return !!(w && (w.video || w.gif)); }
  function syncGif(shown) {
    var src = S.c.bg === 'photo' && shown && shown.gif && !animationsPaused() ? shown.gif : '';
    if (!GIF.parentNode && IMG.photo.parentNode) IMG.photo.parentNode.insertBefore(GIF, IMG.photo.nextSibling);
    if (GIF._src === src) return;
    GIF._src = src; GIF.className = 'photo-video';
    if (src) GIF.src = src; else GIF.removeAttribute('src');
  }
  function syncVideo(shown) {
    syncGif(shown);
    if (PHONE && shown && shown.id !== phoneWall) { phoneWall = shown.id; PHONE.wallpaper(shown.id); }
    var src = S.c.bg === 'photo' && shown && shown.video ? shown.video : '';
    if (!VIDEO.parentNode && IMG.photo.parentNode) IMG.photo.parentNode.insertBefore(VIDEO, IMG.photo.nextSibling);
    if (VIDEO._src !== src) {
      VIDEO._src = src; VIDEO.className = 'photo-video';
      if (src) VIDEO.src = src; else { VIDEO.removeAttribute('src'); VIDEO.load(); }
    }
    if (src && !animationsPaused() && VIDEO.paused) { var played = VIDEO.play(); if (played && played.catch) played.catch(function () { }); }
    if ((!src || animationsPaused()) && !VIDEO.paused) VIDEO.pause();
  }
  function syncDrift() {
    var on = S.c.motion === 'drift' && S.c.bg === 'photo' && !animated(wall(S.c.wall));
    Array.prototype.forEach.call(stage.querySelectorAll('.photo,.mat-img,.ph-field-img'), function (el) {
      if (!on) { if (el._drift) { el._drift = false; el.style.animationDelay = ''; } return; }
      if (!el._drift) { el._drift = true; el.style.animationDelay = (-(driftNow() % (2 * DRIFT_MS))) + 'ms'; }
    });
  }
  function render() {
    loadPack();
    var t = top(), sheet = !!V[t.id].sheet, shown = wall(S.shown ? S.shown.wall : S.c.wall), np = npArt(), palette = np ? null : ADAPTIVE_INK[shown.id];
    var adaptive = applyAdaptiveInk(palette), tr = np ? 'light' : adaptive && palette.tr ? palette.tr.pol : shown.ut.tr, br = np ? 'light' : adaptive && palette.br ? palette.br.pol : shown.ut.br;
    stage.className = 'stage bg-' + S.c.bg + ' l-' + S.c.layout + ' v-' + S.variant + ' m-' + (materialApplies() ? S.c.material : 'none') + ' f-' + S.c.focus + ' a-' + S.c.apps + ' u-' + S.c.controls + ' g-' + S.geom + ' tone-' + (np ? 'dark' : shown.tone) + ' tr-' + tr + ' br-' + br + wallClasses(shown) + inkRungClasses(palette, adaptive) + ' at-' + t.id + ' font-' + homeFont() + (homeFont() !== 'manrope' ? ' font-custom' : '') + (S.fontSwitch ? ' is-font-switch' : '') + (adaptive ? ' has-adaptive-ink adaptive-tl-' + palette.tl.pol : '') + (!adaptive && !np && shown.clockInk ? ' has-clock-ink' : '') + (!adaptive && !np && shown.dockClockInk ? ' has-dock-clock-ink' : '') + (np ? ' has-np-art' : '') + (S.saver ? ' is-saver' : '') + (S.intro ? ' is-' + S.intro : '') + (registeredMaterial(shown.id) ? ' registered-material' : '') + (sheet ? ' is-sheet' : '') + (S.reflow ? ' is-reflow' : '') + ' mo-' + (S.c.bg === 'photo' && !animated(shown) ? S.c.motion : 'still') + (syncPause() ? ' anim-paused' : '') + (nightActive() ? ' is-night nd-' + S.c.ndim : '') + (S.idleHidden && top().id === 'home' ? ' is-idle' : '') + weatherFx()
      + ' ls-' + (isShelf() ? 'shelf' : 'glass') + ' cs-' + S.c.csize + ' cw-' + S.c.cweight + ' tw-' + S.c.tweight + ' ts-' + S.c.tsize
      + ' cp-' + S.c.cpos + ' tint-' + S.c.tint + ' dg-' + S.c.dglass + ' is-' + S.c.isize + ' npd-' + S.c.npdim;
    syncStorm();
    if (newsWasOn !== (newsOn() ? S.c.nsrc : '')) { newsWasOn = newsOn() ? S.c.nsrc : ''; newsIdx = 0; newsTick(false); }
    if (!adaptive && !np && shown.clockInk) stage.style.setProperty('--clock-ink', shown.clockInk);
    else stage.style.removeProperty('--clock-ink');
    if (!adaptive && !np && shown.dockClockInk) stage.style.setProperty('--dock-clock-ink', shown.dockClockInk);
    else stage.style.removeProperty('--dock-clock-ink');
    applyHomeFont();
    if (!sheet) renderHome(t);
    renderTopShelf(t, sheet);
    renderSheet(t, sheet);
    renderAppearance(t);
    renderFocusStatus(t);
    syncDrift();
    syncVideo(shown);
    syncNpArt();
    if (!S.saver && !saverTimer !== !saverDelay() && !document.hidden) saverReset(); // the delay was switched on or off
    publishCompanion();
    syncAddons();
  }

  function applyHomeFont() {
    var id = homeFont(), f = FONTS[id], primary = fontRole(id, 'primary'), ui = fontRole(id, 'ui'), metrics = fontMetrics[id];
    if (appliedFont === id && appliedFontMetrics === metrics) return;
    appliedFont = id; appliedFontMetrics = metrics;
    var values = { 'display-family': '"' + f.family + '"', 'ui-family': '"' + ui.family + '"', 'primary-family': '"' + primary.family + '"', 'display-weight': f.display, 'ui-weight': ui.weight, 'primary-weight': primary.weight, 'clock-weight': f.clock,
      'clock-shift': px(fontShift('clock', 48)), 'utility-shift': px(fontShift('ui', 28)), 'action-shift': px(fontShift('ui', 30)), 'heading-shift': px(fontShift('ui', 48)), 'full-name-shift': px(fontShift('primary', 30)), 'clock-digit': px(metrics ? metrics.digitCell : 0) };
    Object.keys(values).forEach(function (key) { homeEl.style.setProperty('--font-' + key, String(values[key])); });
  }

  function homeState(t) {
    var h = visibleHome(), hs = { mode: 'browse', zone: null, i: Math.max(0, ensureSel()), u: -1, lifted: false, from: -1, arr: null, items: h.map(function (id) { return { key: id, kind: S.c.home.indexOf(id) < 0 && LIVE.indexOf(id) < 0 ? 'recent' : 'app', id: id }; }) };
    if (isSettingsDetail(t)) hs.zone = 'preview';
    else if (t.id === 'home') { hs.zone = t.f.zone; hs.u = t.f.u; hs.n = t.f.n || 0; }
    return hs;
  }

  function renderHome(t) {
    var hs = homeState(t);
    renderCaption(t, hs);
    renderUtils(hs);
    renderInputRow(hs);
    if (S.c.layout === 'list') renderList(hs);
    else { photoMode = null; renderDock(hs); }
    renderAppFocusName(hs);
  }

  function clockText() {
    var d = new Date(), h = S.c.cformat === '24' ? d.getHours() : d.getHours() % 12 || 12, m = d.getMinutes();
    var sec = d.getSeconds();
    return (S.c.cformat === '24' && h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + (S.c.csec === 'on' ? ':' + (sec < 10 ? '0' : '') + sec : '');
  }
  function dateText() {
    var d = new Date();
    return localeText('date.' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(), function () {
      try { return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return d.toDateString(); }
    });
  }
  /* Locale formatting loads ICU data on first use (about 200ms on the TV), so its results are kept: per
     language for AM/PM, per day for the date line. */
  var localeCache = null;
  function localeText(key, make) {
    var lang = navigator.language || '', value;
    if (!localeCache) { try { localeCache = JSON.parse(localStorage.getItem('shore.locale')) || {}; } catch (e) { localeCache = {}; } }
    if (localeCache.lang !== lang) localeCache = { lang: lang };
    if (typeof localeCache[key] === 'string') return localeCache[key];
    value = make();
    if (/^date\./.test(key)) Object.keys(localeCache).forEach(function (k) { if (/^date\./.test(k)) delete localeCache[k]; });
    localeCache[key] = value;
    try { localStorage.setItem('shore.locale', JSON.stringify(localeCache)); } catch (e) { }
    return value;
  }
  /* AM or PM in the TV's language for the 12-hour clock ("PM", "م", "nachm."), '' for 24 hours. */
  function meridiem() { return S.c.cformat === '24' ? '' : meridiemOf(new Date()); }
  function meridiemOf(date) {
    var pm = date.getHours() >= 12;
    return localeText(pm ? 'pm' : 'am', function () {
      var d = new Date(2026, 0, 1, pm ? 15 : 3), word = '';
      try { word = d.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).replace(/[\d\s\u200e\u200f\u202f\u00a0:]+/g, ' ').trim(); } catch (e) { }
      return word && word.length <= 8 ? word : pm ? 'PM' : 'AM';
    });
  }
  function clockHtml(plain) {
    var text = clockText(), metrics = !plain && fontMetrics[homeFont()], ampm = meridiem();
    ampm = ampm ? '<span class="ampm">' + escRaw(ampm) + '</span>' : '';
    if (!metrics || !metrics.digitCell) return escRaw(text) + ampm;
    return text.replace(/[0-9]/g, function (digit) { return '<span class="clock-digit">' + digit + '</span>'; }) + ampm;
  }
  function renderCaption(t, hs) {
    var html = '<span class="clock">' + clockHtml() + '</span>' + clockExtras();
    if (S.c.apps !== 'icons' && hs.items[hs.i] && (S.c.layout === 'list' ? photoLabel(hs.items[hs.i].id, false).size < 88 || photoLabel(hs.items[hs.i].id, false).ellipsis : hs.zone === 'apps' && reducedDockLabel(hs.items[hs.i].id))) html += '<span class="cap-line full-name">' + esc(app(hs.items[hs.i].id).name) + '</span>';
    setHTML(capMain, html);
  }

  function utilBtn(z, i, action, inner, extra, name) {
    return '<button type="button" tabindex="-1" class="u' + (extra || '') + '" data-z="' + z + '" data-i="' + i + '" data-action="' + action + '" aria-label="' + esc(name) + '"><span class="u-content">' + inner + '</span></button>';
  }
  function renderUtils(hs) {
    var html = '', style = hs.mode === 'arrange' && S.c.controls !== 'text' ? 'both' : S.c.controls;
    var iconsOnly = style === 'icons', U = utils(), focused = null;
    utilsEl.className = 'utils quiet-utils is-' + style + (hs.zone === 'util' || hs.zone === 'ctl' ? ' is-awake' : '');
    U.forEach(function (u, i) { html += utilBtn('util', i, 'util.' + u, icon(UTIL[u][1], '', true) + '<span class="u-label">' + esc(UTIL[u][0]) + '</span>', '', T(UTIL[u][0])); });
    setHTML(utilsEl, html);
    Array.prototype.forEach.call(utilsEl.querySelectorAll('.u'), function (b) {
      var z = b.getAttribute('data-z'), focus = hs.zone === z && hs.u === Number(b.getAttribute('data-i'));
      b.className = b.className.replace(/\s+is-focus/g, '') + (focus ? ' is-focus' : '');
      if (focus) focused = b;
    });
    renderUtilFocusLabel(iconsOnly ? focused : null);
    renderUtilityLens(focused, iconsOnly);
  }
  var inputRowEl = document.createElement('div');
  inputRowEl.id = 'inputRow';
  utilsEl.parentNode.insertBefore(inputRowEl, utilsEl.nextSibling);
  /* Own-row inputs: quiet controls above the dock, focused with Up from the apps. */
  function renderInputRow(hs) {
    var html = '', on = inputRow() && hs.mode === 'browse', style = S.c.controls;
    inputRowEl.className = 'utils quiet-utils input-row is-' + style + (on && hs.zone === 'input' ? ' is-awake' : '') + (on ? '' : ' is-off');
    if (on) LIVE.forEach(function (id, i) {
      html += utilBtn('input', i, 'home.input.' + id, icon('input', '', true) + '<span class="u-label">' + esc(app(id).name) + '</span>', hs.zone === 'input' && hs.n === i ? ' is-focus' : '', app(id).name);
    });
    setHTML(inputRowEl, html);
    if (on && hs.zone === 'input') renderUtilityLens(inputRowEl.querySelector('.u.is-focus'), style === 'icons');
  }
  function renderUtilFocusLabel(button) {
    var text, key, r, sr, scale, width, x;
    if (!button) { utilFocusLabel.className = 'util-focus-label'; utilFocusKey = ''; return; }
    text = S.err ? 'Not saved. OK tries again.' : button.getAttribute('aria-label');
    key = button.getAttribute('data-action') + '|' + text + '|' + homeFont();
    if (key !== utilFocusKey) {
      utilFocusLabel.className = 'util-focus-label'; utilFocusLabel.textContent = T(text);
      utilFocusLabel.offsetWidth;
      utilFocusKey = key;
    }
    r = button.getBoundingClientRect(); sr = sceneEl.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    width = Math.ceil(textWidth(text, 28, 500, -.2) + 8); x = (r.left + r.width / 2 - sr.left) / scale - width / 2;
    if (S.c.layout === 'list') x = 1730 - width;
    utilFocusLabel.style.width = width + 'px'; utilFocusLabel.style.left = clamp(x, 112, 1808 - width) + 'px';
    utilFocusLabel.style.top = ((S.c.layout === 'list' ? (r.top + r.height / 2 - sr.top) / scale - 19 : 140) + fontShift('ui', 28)) + 'px';
    utilFocusLabel.className = 'util-focus-label is-on';
  }
  function renderUtilityLens(button, iconsOnly) {
    var r, label, sr, scale, x, y, width, key, el;
    if (!button || S.c.focus !== 'glass') {
      utPlates.forEach(function (plateEl) { plateEl.className = 'ph-plate ut-lens is-outgoing'; });
      utPlateKey = null;
      return;
    }
    r = button.getBoundingClientRect(); sr = sceneEl.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    y = (r.top - sr.top) / scale + 2;
    if (S.c.layout === 'list') {
      label = iconsOnly ? utilFocusLabel : button.querySelector('.u-label');
      x = (label.getBoundingClientRect().left - sr.left) / scale - 24;
      width = 1800 - x;
    } else {
      // Dock icons keep a fixed lens; the separate caption cannot overlap its neighbours.
      x = (r.left - sr.left) / scale; width = r.width / scale;
    }
    key = button.getAttribute('data-action') + '|' + x + '|' + y + '|' + width;
    if (key !== utPlateKey) {
      utPlates[utPlateIndex].className = 'ph-plate ut-lens is-outgoing';
      utPlateIndex = 1 - utPlateIndex; el = utPlates[utPlateIndex];
      el.className = 'ph-plate ut-lens is-preparing';
      el.style.width = width + 'px'; el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      fieldTransform(utFields[utPlateIndex], x, y, width, 60);
      el.offsetWidth;
      utPlateKey = key;
    }
    fieldTransform(utFields[utPlateIndex], x, y, width, 60);
    utPlates[utPlateIndex].className = 'ph-plate ut-lens is-current on-focus';
  }
  function renderAppFocusName(hs) {
    var it = hs.items[hs.i], width, x, y, placement;
    if (S.c.apps !== 'icons' || hs.mode !== 'browse' || hs.zone !== 'apps' || !it) { appFocusName.className = 'app-focus-name'; return; }
    appFocusName.textContent = app(it.id).name;
    width = Math.min(S.c.layout === 'list' ? 1056 : 1640, Math.ceil(textWidth(app(it.id).name, S.c.layout === 'list' ? 40 : 36, 500, -.6, 'primary') + 8));
    appFocusName.style.width = width + 'px';
    if (S.c.layout === 'list') {
      x = 280; placement = phFields[photoPlateIndex]._placement;
      y = placement.y + placement.height / 2 - 24;
    } else {
      x = clamp(dockAnchorCenter - width / 2, 140, 1780 - width); y = 932;
    }
    appFocusName.style.left = x + 'px'; appFocusName.style.top = (y + fontShift('primary', S.c.layout === 'list' ? 40 : 36)) + 'px';
    appFocusName.className = 'app-focus-name is-on';
  }

  function dockGeom(n) {
    // As many tiles as fit in the broad shelf stay centred: five wide tiles, nine icons.
    var m = DOCK_MODES[isShelf() ? 'shelf' : S.c.apps], fit = Math.floor(1704 / m.pitch), vis = Math.max(1, Math.min(fit, n)), shelfW = vis * m.pitch - 8, w = shelfW + 32;
    var broad = S.geom === 'broad' && n > fit;
    if (n < 0) { w = 912; shelfW = 880; }
    else if (broad) { w = 1728; shelfW = 1696; }
    return { x: Math.round((1920 - w) / 2), y: shelfLifted() ? SHELF_ROW_Y : 908 - m.th - 32, h: m.th + 32, w: w, shelf: shelfW, vis: vis, broad: broad, empty: n < 0, tw: m.tw, th: m.th, pitch: m.pitch };
  }
  /* Five centred: the window moves one tile when focus passes an edge. Broad: keep a
     148px glimpse of the neighbour, as the current dock does. */
  function dockOffset(n, i, g) {
    var off, left, first, glimpse = g.tw / 2;
    if (g.broad) {
      off = scroll.off * g.pitch; left = i * g.pitch;
      if (left - off < (i > 0 ? glimpse : 0)) off = left - (i > 0 ? glimpse : 0);
      if (left + g.tw - off > g.shelf - (i < n - 1 ? glimpse : 0)) off = left + g.tw - g.shelf + (i < n - 1 ? glimpse : 0);
      off = clamp(off, 0, Math.max(0, n * g.pitch - 8 - g.shelf));
      if (!S.reflow) { scroll.off = off / g.pitch; scroll.first = Math.round(scroll.off); }
      return off;
    }
    first = clamp(scroll.first, 0, Math.max(0, n - g.vis));
    if (i < first) first = i;
    if (i > first + g.vis - 1) first = i - g.vis + 1;
    if (!S.reflow) { scroll.first = first; scroll.off = first; }
    return first * g.pitch;
  }
  /* Shelf: Android TV banner cards (tvOS-style); apps without a banner and inputs get a frosted card with their mark. */
  function shelfTileHtml(a) {
    var pkg = !a.input && FrameDevice.packageOf ? FrameDevice.packageOf(a.appId) : null;
    return '<span class="card' + (pkg ? '' : ' no-art') + '">' + (pkg ? '<img class="card-art" alt="" src="/appbanner/' + esc(pkg) + '.png" onerror="this.parentNode.className=\'card no-art\'">' : '')
      + '<span class="card-mark">' + appMark(a, 120, 72, 58) + '</span></span>'
      + '<span class="label"><span class="label-ink">' + esc(a.name) + '</span></span>';
  }
  function dockTileHtml(it, full) {
    var a, body;
    if (it.kind !== 'add' && isShelf() && app(it.id)) return shelfTileHtml(app(it.id));
    if (it.kind === 'add') return '<span class="add">' + icon('plus') + '</span><span class="label">' + (full ? 'Home is full' : 'Add app') + '</span>';
    a = app(it.id);
    body = S.c.apps === 'text' ? '' : appMark(a, S.c.apps === 'icons' ? 136 : 120, S.c.apps === 'icons' ? 88 : 72, S.c.apps === 'icons' ? 72 : 58);
    return body + (S.c.apps === 'icons' ? '' : '<span class="label" style="font-size:' + dockLabelSize(a.id) + 'px;top:' + ((S.c.apps === 'text' ? 28 : 128) + fontShift('primary', dockLabelSize(a.id))) + 'px"><span class="label-ink">' + esc(a.name) + '</span></span>') + '<span class="nudge nudge-l">' + icon('left') + '</span><span class="nudge nudge-r">' + icon('right') + '</span>';
  }
  /* A wide label can reach the shelf before its icon. Check the rendered icon box,
     including during the track's 180ms transition, so both disappear together. */
  function syncDockEdges() {
    var broad = S.c.layout === 'dock' && S.geom === 'broad', clip = shelf.getBoundingClientRect(), changes = [];
    Array.prototype.forEach.call(track.querySelectorAll('.tile'), function (tile) {
      var content = tile.querySelector(isShelf() ? '.card' : S.c.apps === 'text' ? '.label-ink' : '.mark'), r = content ? content.getBoundingClientRect() : null;
      var outside = broad && r && (r.right <= clip.left || r.left >= clip.right);
      var cls = tile.className.replace(/\s+is-outside-icon/g, '') + (outside ? ' is-outside-icon' : '');
      if (tile.className !== cls) changes.push({ tile: tile, cls: cls });
    });
    changes.forEach(function (change) { change.tile.className = change.cls; });
  }
  function trackDockEdges() {
    dockEdgeFrame = 0;
    if (S.c.layout !== 'dock' || S.geom !== 'broad') return;
    syncDockEdges();
    if (Date.now() < dockEdgeUntil) dockEdgeFrame = window.requestAnimationFrame(trackDockEdges);
  }

  /* ---------- Continue watching (Dock and Shelf, Android shell) ----------
     Rows apps publish to Android's Watch Next list, read by WatchNext.java. Dock shows them as one row under
     the apps; Shelf puts each app's own items first in its Top Shelf row. */
  var WATCH = ANDROID && FrameDevice.watchNext ? FrameDevice.watchNext : null, watchItems = [], watchAllowed = false;
  function minutesLeft(m) { return m >= 60 ? T((m / 60 | 0) + ' hr ' + (m % 60) + ' min left') : T(m + ' min left'); }
  function loadWatch() {
    var w = WATCH ? WATCH.list() : {}, pkgRe = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/;
    watchAllowed = !!w.allowed;
    watchItems = (w.items && w.items.filter ? w.items : []).filter(function (it) {
      return it && /^\d{1,18}$/.test(it.id) && pkgRe.test(it.pkg) && typeof it.title === 'string' && /^(\/watchnext\/img\/\d{1,18}\.jpg)?$/.test(it.card || '');
    }).map(function (it) {
      var left = +it.left | 0, sub = [String(it.sub || ''), left > 0 ? minutesLeft(left) : ''].filter(Boolean).join(' · ');
      return { watch: it.id, pkg: it.pkg, title: it.title, sub: sub, card: it.card || '', hero: '', progress: Math.max(0, Math.min(1, +it.progress || 0)) };
    });
  }
  /* The toggle says what is missing on its own row; this page has no room for a note. */
  function watchChoice() {
    var c = choice('cwatch', 'on', S.c.layout === 'list');
    c.description = S.c.layout === 'list' ? 'Dock or Shelf' : S.c.cwatch === 'on' && !watchAllowed ? 'OK to allow' : '';
    return c;
  }
  function recentChoice() { var c = choice('crecent', 'on', S.c.layout !== 'dock' || isShelf()); c.description = c.disabled ? 'Dock only' : 'Apps you opened lately, after Home’s'; return c; }
  function watchShown() { return !!WATCH && S.c.cwatch === 'on' && S.c.layout === 'dock' && watchItems.length > 0; }
  function watchRow() { return watchShown() && !isShelf(); }
  if (WATCH) { loadWatch(); WATCH.onChange(function () { loadWatch(); recsKey = ''; render(); }); }

  /* ---------- Top Shelf (Shelf layout, Android shell) ----------
     The focused app's first recommendation (or its blurred TV banner) becomes the backdrop, and Down
     opens a row of its recommendations. Images arrive pre-rendered from TopShelf.java; nothing blurs here. */
  var SHELF = ANDROID && FrameDevice.topShelf ? FrameDevice.topShelf : null, shelfIndex = {}, shelfAsked = '';
  var SHELF_ROW_Y = 400, REC_LEFT = 140, REC_PITCH = 376, REC_VIEW = 1920 - 2 * REC_LEFT;
  var heroEl = document.createElement('div'), heroImgs = [document.createElement('img'), document.createElement('img')], heroFront = 0, heroSrc = '', heroTimer = 0;
  var heroText = document.createElement('div'), recsEl = document.createElement('div'), recsTrack = document.createElement('div'), recsTitle = document.createElement('div'), recsHead = document.createElement('div'), recsKey = '';
  heroEl.className = 'hero'; heroEl.setAttribute('aria-hidden', 'true');
  heroImgs.forEach(function (img) { img.className = 'hero-img'; img.alt = ''; heroEl.appendChild(img); });
  heroEl.appendChild(document.createElement('div')).className = 'hero-shade';
  IMG.photo.parentNode.insertBefore(heroEl, IMG.photo.parentNode.querySelector('.scrim')); // above photo and video, below the scrim
  IMG.photo.parentNode.insertBefore(npEl, heroEl); // album art: above the photo, below a Top Shelf hero
  heroText.className = 'hero-text'; heroText.setAttribute('aria-live', 'polite');
  recsEl.className = 'recs'; recsTrack.className = 'recs-track'; recsTitle.className = 'recs-title';
  recsHead.className = 'recs-head';
  recsEl.appendChild(recsHead); recsEl.appendChild(recsTrack); recsEl.appendChild(recsTitle);
  homeEl.insertBefore(heroText, dock); homeEl.insertBefore(recsEl, dock);

  function cleanShelfIndex(index) {
    var out = {}, img = /^\/topshelf\/img\/[0-9a-f]+-(card|hero)\.jpg$/;
    Object.keys(index || {}).forEach(function (pkg) {
      var e = index[pkg], items = e && e.items && e.items.filter ? e.items.filter(function (it) {
        return it && typeof it.title === 'string' && img.test(it.card) && img.test(it.hero) && typeof (it.url || '') === 'string';
      }) : [];
      if (items.length) out[pkg] = { service: String(e.service || ''), items: items };
    });
    return out;
  }
  function shelfPkg(id) { var a = app(id); return a && !a.input && FrameDevice.packageOf ? FrameDevice.packageOf(a.appId) : null; }
  /* Shelf: the focused app's Continue watching, then what is trending on it. Dock: one Continue watching row for every app. */
  function recsFor(id) {
    var pkg, e, items;
    if (watchRow()) return { pkg: '', service: '', row: true, items: watchItems };
    pkg = SHELF && isShelf() ? shelfPkg(id) : null; e = pkg ? shelfIndex[pkg] : null;
    items = pkg && watchShown() ? watchItems.filter(function (it) { return it.pkg === pkg; }) : [];
    if (e) items = items.concat(e.items);
    return items.length ? { pkg: pkg, service: e ? e.service : '', items: items } : null;
  }
  /* Stable layout: the row moves up once any Home app has recommendations, not per focused app. */
  function shelfLifted() { return watchRow() || !!SHELF && isShelf() && visibleHome().some(function (id) { return !!recsFor(id); }); }
  function requestShelf() {
    var pkgs = [];
    if (!SHELF || !isShelf()) return;
    visibleHome().forEach(function (id) { var p = shelfPkg(id); if (p && pkgs.indexOf(p) < 0) pkgs.push(p); });
    if (pkgs.join() === shelfAsked) return;
    shelfAsked = pkgs.join(); SHELF.request(pkgs);
  }
  /* Two images crossfade; the next one only shows once loaded, and fast scrolling settles first. */
  function showHero(src) {
    if (src === heroSrc) return;
    heroSrc = src; clearTimeout(heroTimer);
    heroEl.className = 'hero' + (src ? ' is-on' : '');
    if (!src) { heroImgs[0].className = heroImgs[1].className = 'hero-img'; return; }
    heroTimer = setTimeout(function () {
      var back = heroImgs[1 - heroFront], want = src;
      function swap() {
        if (heroSrc !== want) return;
        back.className = 'hero-img is-on'; heroImgs[heroFront].className = 'hero-img'; heroFront = 1 - heroFront;
      }
      back.onload = swap;
      back.onerror = function () { if (heroSrc === want) heroImgs[heroFront].className = 'hero-img'; };
      if (back.getAttribute('src') === want && back.complete) swap(); else back.src = want;
    }, 160);
  }
  function renderTopShelf(t, sheet) {
    var row = watchRow(), on = (row || !!SHELF && isShelf()) && !sheet && t.id === 'home' && !S.idleHidden, f = t.f || {};
    var zone = on && (f.zone === 'apps' || f.zone === 'recs') ? f.zone : null, R = zone || row && on ? recsFor(S.sel) : null;
    var r = R ? clamp(f.r || 0, 0, R.items.length - 1) : 0, item = R ? R.items[zone === 'recs' ? r : 0] : null, pkg = zone ? shelfPkg(S.sel) : null;
    var off = R ? clamp((r - 2) * REC_PITCH, 0, Math.max(0, R.items.length * REC_PITCH - 24 - REC_VIEW)) : 0, key;
    if (on && !row) requestShelf();
    if (row) { item = null; pkg = null; } // the Dock keeps its wallpaper; the row is the only change
    showHero(item ? item.hero || '/topshelf/banner/' + pkg + '.jpg' : pkg ? '/topshelf/banner/' + pkg + '.jpg' : '');
    setHTML(heroText, item ? '<span class="hero-title">' + esc(item.title) + '</span><span class="hero-service">' + esc(item.watch ? 'Continue watching' : 'Trending on ' + R.service) + '</span>' : '');
    heroText.className = 'hero-text' + (item ? ' is-on' : '');
    key = R ? R.pkg + '|' + R.items.map(function (it) { return it.card + ':' + (it.progress || 0); }).join() : '';
    if (key !== recsKey) {
      recsKey = key;
      setHTML(recsTrack, R ? R.items.map(function (it, i) {
        return '<span class="rec" style="transform:translate3d(' + (i * REC_PITCH) + 'px,0,0)">'
          + (it.card ? '<img alt="" src="' + esc(it.card) + '" onerror="this.style.visibility=\'hidden\'">' : '<span class="rec-name">' + escRaw(it.title) + '</span>')
          + (it.progress > 0 ? '<span class="rec-bar"><span style="width:' + Math.round(it.progress * 100) + '%"></span></span>' : '') + '</span>';
      }).join('') : '');
    }
    Array.prototype.forEach.call(recsTrack.childNodes, function (el, i) { el.className = 'rec' + (zone === 'recs' && i === r ? ' is-focus' : ''); });
    recsTrack.style.transform = 'translate3d(' + (-off) + 'px,0,0)';
    setHTML(recsTitle, zone === 'recs' && R ? '<span class="recs-name">' + esc(R.items[r].title) + '</span>' + (R.items[r].sub ? '<span class="recs-sub">' + esc(R.items[r].sub) + '</span>' : '') : '');
    recsTitle.style.transform = 'translate3d(' + (r * REC_PITCH - off) + 'px,0,0)';
    setHTML(recsHead, row ? esc('Continue watching') : '');
    recsEl.className = 'recs' + (R && on ? ' is-on' : '') + (zone === 'recs' ? ' is-active' : '') + (row ? ' has-head' : '');
  }
  if (SHELF) {
    shelfIndex = cleanShelfIndex(SHELF.index());
    SHELF.onChange(function (index) {
      shelfIndex = cleanShelfIndex(index); recsKey = ''; // new files may replace images that failed to load
      if (heroImgs[0].className === heroImgs[1].className) heroSrc = '';
      render();
    });
  }

  function renderDock(hs) {
    var items = hs.items, n = items.length, empty = hs.mode !== 'arrange' && !n, g = dockGeom(empty ? -1 : n);
    var anchor = clamp(hs.i, 0, Math.max(0, n - 1)), off = empty ? 0 : dockOffset(n, anchor, g);
    var full = hs.arr ? live(hs.arr.slots).length >= CAP : false, ns = hs.arr ? hs.arr.slots.length : n;
    var tileFocus = hs.zone === 'apps' || hs.zone === 'tiles', tileSel = hs.zone === 'act' || hs.zone === 'ctl' || hs.zone === 'preview' || hs.zone === 'recs' && !watchRow();
    var focusItem = items[anchor], s, ax, label, width;

    dock.className = 'dock' + (empty ? ' is-empty' : '');
    inputRowEl.style.left = (g.x + 2) + 'px'; inputRowEl.style.top = (g.y - 84) + 'px';
    dock.style.left = g.x + 'px'; dock.style.top = g.y + 'px'; dock.style.width = g.w + 'px'; dock.style.height = g.h + 'px';
    dock.style.setProperty('--tile-w', g.tw + 'px'); dock.style.setProperty('--tile-h', g.th + 'px'); dock.style.setProperty('--dock-h', g.h + 'px');
    dock.style.setProperty('--nudge-top', ((g.th - 48) / 2) + 'px');
    dockAnchorCenter = g.x + 16 + anchor * g.pitch - off + g.tw / 2;
    IMG.mat.style.left = (-g.x) + 'px'; IMG.mat.style.top = (-g.y) + 'px';
    IMG.mat.style.transformOrigin = '960px ' + (g.y + g.h / 2) + 'px';
    matScrim.style.left = (-g.x) + 'px'; matScrim.style.top = (SCRIM_Y - g.y) + 'px';
    matScrim.style.transformOrigin = '960px ' + (g.y + g.h / 2 - SCRIM_Y) + 'px';
    shelf.style.width = g.shelf + 'px';
    shelf.className = 'shelf' + (g.broad && off > 0 ? ' fade-l' : '') + (g.broad && off + g.shelf < n * g.pitch - 8 ? ' fade-r' : '');

    keyed(track, empty ? [] : items, function (el, it, i) {
      var a = it.id ? app(it.id) : null, left = i * g.pitch, focus = tileFocus && i === anchor, sel = tileSel && i === anchor;
      var lifted = hs.lifted && i === anchor, partial = g.broad && (left - off < -1 || left + g.tw - off > g.shelf + 1);
      setContent(el, it.kind + '|' + (it.id || '') + '|' + (it.id ? dockLabelSize(it.id) : full) + '|' + S.c.bg + '|' + S.c.apps + '|' + S.c.lstyle + '|' + homeFont(), '<span class="tile-content">' + dockTileHtml(it, full) + '</span>');
      el.className = 'tile k-' + it.kind + (focus ? ' is-focus' : '') + (sel ? ' is-sel' : '') + (lifted ? ' is-lifted' : '') + (partial ? ' is-partial' : '')
        + (a && !a.mark ? ' is-text' : '') + (it.kind === 'add' && full ? ' is-full' : '') + (it.kind !== 'add' && S.press === it.id ? ' is-press' : '') + (it.kind === 'recent' && (!items[i - 1] || items[i - 1].kind !== 'recent') ? ' is-recent-first' : '')
        + (lifted && i === 0 ? ' no-l' : '') + (lifted && i >= ns - 1 ? ' no-r' : '');
      el.style.transform = 'translate3d(' + left + 'px,0,0)';
      el.setAttribute('role', 'button');
      if (a) el.setAttribute('aria-label', a.name);
      if (hs.mode === 'arrange') attrs(el, 'tile', i, 'arrange.' + (it.kind === 'add' ? 'add' : (it.kind === 'ph' ? 'placeholder.' : 'tile.') + it.id));
      else attrs(el, 'app', i, 'home.app.' + it.id);
    });
    track.style.transform = 'translate3d(' + (-off) + 'px,0,0)';
    syncDockEdges();
    if (g.broad) {
      dockEdgeUntil = Date.now() + 220;
      if (!dockEdgeFrame) dockEdgeFrame = window.requestAnimationFrame(trackDockEdges);
    }
    plate.className = 'plate' + (!n || empty || hs.zone === null ? '' : hs.lifted ? ' on-lift' : tileFocus ? ' on-focus' : tileSel ? ' on-sel' : '');
    plate.style.transform = 'translate3d(' + (anchor * g.pitch) + 'px,0,0)';

    cueL.style.left = (g.x - 72) + 'px'; cueR.style.left = (g.x + g.w + 24) + 'px';
    cueL.style.top = cueR.style.top = (g.y + g.h / 2 - 24) + 'px';
    cueL.className = 'cue' + (!g.broad && !empty && scroll.first > 0 ? ' is-on' : '');
    cueR.className = 'cue' + (!g.broad && !empty && scroll.first + g.vis < n ? ' is-on' : '');

    ax = g.x + 16 + anchor * g.pitch - off;
    if (hs.mode === 'arrange' && !hs.lifted && (hs.zone === 'tiles' || hs.zone === 'act') && focusItem && focusItem.kind !== 'add') {
      s = hs.arr.slots[anchor];
      label = (s.removed ? 'Restore ' : 'Remove ') + app(s.id).name; width = actionWidth(label);
      ax = clamp(ax + (g.tw - width) / 2, 112, 1808 - width);
      setHTML(dockAction, '<span>' + esc(label) + '</span>');
      dockAction.className = 'dock-action is-on' + (hs.zone === 'act' ? ' is-focus' : '');
      dockAction.style.width = width + 'px';
      dockAction.style.transform = 'translate3d(' + ax + 'px,0,0)';
      attrs(dockAction, 'act', anchor, 'arrange.' + (s.removed ? 'restore.' : 'remove.') + s.id);
    } else {
      dockAction.className = 'dock-action';
      dockAction.removeAttribute('data-z'); dockAction.removeAttribute('data-action');
    }
    setHTML(dockEmpty, empty ? '<p>No apps on Home</p><button type="button" tabindex="-1" class="btn' + (hs.zone === 'empty' ? ' is-focus' : '') + '" data-z="empty" data-i="0" data-action="home.add-apps">' + icon('plus') + '<span>Add apps</span></button>' : '');
  }

  function photoModeTransition(compact) {
    if (photoMode !== null && photoMode !== compact) {
      var ghost = phScene.cloneNode(true), token = ++photoTransitionToken;
      ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(ghost.querySelectorAll('[id],[data-action],[data-z]'), function (el) {
        el.removeAttribute('id'); el.removeAttribute('data-action'); el.removeAttribute('data-z');
      });
      ghost.className = 'ph-scene ph-ghost';
      phScene.parentNode.appendChild(ghost);
      phScene.className = 'ph-scene ph-incoming';
      setTimeout(function () {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        if (token === photoTransitionToken) phScene.className = 'ph-scene';
      }, 180);
    }
    photoMode = compact;
  }
  /* Each plate keeps a stationary, stage-registered field while its opacity changes.
     Reuse the hidden group for the next label; never animate plate width or position. */
  function renderPhotoPlate(id, width, height, y, state) {
    var key = id + '|' + width + '|' + height + '|' + y, plateEl, fieldEl;
    if (key !== photoPlateKey) {
      phPlates[photoPlateIndex].className = phPlates[photoPlateIndex].className.replace(' is-current', '') + ' is-outgoing';
      photoPlateIndex = 1 - photoPlateIndex;
      plateEl = phPlates[photoPlateIndex]; fieldEl = phFields[photoPlateIndex];
      plateEl.className = 'ph-plate is-preparing';
      plateEl.style.width = width + 'px'; plateEl.style.height = height + 'px';
      plateEl.style.transform = 'translate3d(0,' + y + 'px,0)';
      fieldTransform(fieldEl, 112, y, width, height);
      plateEl.offsetWidth; // Establish zero opacity before the incoming crossfade.
      photoPlateKey = key;
    }
    fieldTransform(phFields[photoPlateIndex], 112, y, width, height);
    phPlates[photoPlateIndex].className = 'ph-plate is-current' + (state ? ' ' + state : '');
  }
  function fieldTransform(el, x, y, width, height) {
    el._placement = { x: x, y: y, width: width, height: height };
    el.style.transformOrigin = (x + width / 2) + 'px ' + (y + height / 2) + 'px';
    el.style.transform = 'translate3d(' + (-x) + 'px,' + (-y) + 'px,0)' + (S.c.bg === 'photo' && S.c.material === 'tint' && !REDUCED_MOTION ? ' scale(1.04)' : '');
  }
  function renderList(hs) {
    var items = hs.items, n = items.length, compact = hs.mode === 'arrange', pitch = compact ? PH_COMPACT_PITCH : PH_PITCH;
    var anchor = clamp(hs.i, 0, Math.max(0, n - 1)), first, off, width, slot, y, s, label, aw, plateState;
    var rowFocus = hs.zone === 'apps' || hs.zone === 'tiles', remembered = hs.zone === 'act' || hs.zone === 'ctl' || hs.zone === 'preview';
    photoModeTransition(compact);
    if (compact) {
      first = clamp(scroll.photoArrange, anchor - 7, anchor - 1);
      first = clamp(first, 0, Math.max(0, n - PH_COMPACT_VISIBLE));
      scroll.photoArrange = first;
    } else {
      first = clamp(scroll.photo, anchor - 3, anchor - 1);
      first = clamp(first, 0, Math.max(0, n - PH_FULL));
      scroll.photo = first;
    }
    off = first * pitch; slot = anchor - first;
    width = items[anchor] ? listPlateWidth(items[anchor].id, compact) : 360;
    phList.className = 'ph-list' + (compact ? ' is-compact' : '');
    phList.style.height = PH_HEIGHT + 'px';
    phRows.style.top = (compact ? 72 : 148) + 'px';
    keyed(phRows, items, function (row, it, i) {
      var typography = photoLabel(it.id, compact), focus = rowFocus && i === anchor, lifted = hs.lifted && i === anchor, markImage, body = '';
      if (S.c.apps !== 'text') body += appMark(app(it.id), S.c.apps === 'icons' ? compact ? 64 : 88 : compact ? 60 : 84, S.c.apps === 'icons' ? compact ? 64 : 88 : compact ? 44 : 64, S.c.apps === 'icons' ? compact ? 52 : 72 : compact ? 42 : 54);
      if (S.c.apps !== 'icons') body += '<span class="ph-name" style="font-size:' + typography.size + 'px;top:' + typography.top + 'px">' + esc(app(it.id).name) + '</span>';
      setContent(row, it.id + '|' + typography.size + '|' + S.c.bg + '|' + S.c.apps + '|' + homeFont(), '<span class="ph-group">' + body + '</span><span class="ph-move ph-move-up">' + icon('up') + '</span><span class="ph-move ph-move-down">' + icon('down') + '</span>');
      markImage = row.querySelector('.mark img');
      if (markImage) {
        markImage.onerror = function () { this.style.visibility = 'hidden'; };
        if (markImage.complete && !markImage.naturalWidth) markImage.style.visibility = 'hidden';
      }
      row.className = 'ph-row k-' + it.kind + (focus ? ' is-focus' : '') + (remembered && i === anchor ? ' is-sel' : '') + (lifted ? ' is-lifted' : '')
        + (lifted && i === 0 ? ' no-up' : '') + (lifted && i === n - 1 ? ' no-down' : '')
        + (it.kind === 'app' && S.press === it.id ? ' is-press' : '');
      row.style.width = (compact ? listPlateWidth(it.id, compact) : 1200) + 'px'; row.style.height = pitch + 'px';
      row.style.transform = 'translate3d(0,' + (i * pitch) + 'px,0)';
      row.setAttribute('role', 'button'); row.setAttribute('aria-label', app(it.id).name);
      attrs(row, compact ? 'tile' : 'app', i, compact ? 'arrange.' + (it.kind === 'ph' ? 'placeholder.' : 'tile.') + it.id : 'home.app.' + it.id);
    });
    phRows.style.transform = 'translate3d(0,' + (-off) + 'px,0)';
    y = (compact ? PH_COMPACT_TOP + 2 : PH_TOP + 1) + slot * pitch;
    plateState = !n || hs.zone === null ? '' : hs.lifted ? 'on-lift' : S.c.focus === 'glass' && rowFocus ? 'on-focus' : S.c.focus === 'glass' && remembered ? 'on-sel' : '';
    renderPhotoPlate(items[anchor] ? items[anchor].id : '', width, compact ? 88 : 134, y, plateState);
    if (compact && !hs.lifted && (hs.zone === 'tiles' || hs.zone === 'act') && items[anchor]) {
      s = hs.arr.slots[anchor]; label = (s.removed ? 'Restore ' : 'Remove ') + app(s.id).name; aw = actionWidth(label);
      setHTML(phAction, '<span>' + esc(label) + '</span>');
      phAction.className = 'ph-action is-on' + (hs.zone === 'act' ? ' is-focus' : '');
      phAction.style.width = aw + 'px';
      phAction.style.transform = 'translate3d(' + (112 + width + 24) + 'px,' + (PH_COMPACT_TOP + slot * pitch + 12) + 'px,0)';
      attrs(phAction, 'act', anchor, 'arrange.' + (s.removed ? 'restore.' : 'remove.') + s.id);
    } else { phAction.className = 'ph-action'; phAction.removeAttribute('data-z'); phAction.removeAttribute('data-action'); }
    phEmpty.className = 'ph-empty' + (!compact && !n ? ' is-on' : '');
    setHTML(phEmpty, !compact && !n ? '<p>No apps on Home</p><button type="button" tabindex="-1" class="btn' + (hs.zone === 'empty' ? ' is-focus' : '') + '" data-z="empty" data-i="0" data-action="home.add-apps">' + icon('plus') + '<span>Add apps</span></button>' : '');
  }

  /* Sheets: a frame is built once per view/mode; fill() updates its slots. Persistent
     scrollers let transforms animate. */
  function renderSheet(t, sheet) {
    var v = V[t.id], key;
    sheetEl.hidden = !(sheet || isSettingsDetail(t));
    sheetView.hidden = !sheet;
    if (sheet) sheetView.setAttribute('aria-modal', 'true');
    else sheetView.removeAttribute('aria-modal');
    sceneEl.setAttribute('aria-hidden', sheet || isSettingsDetail(t) ? 'true' : 'false');
    if (!sheet) { sheetView.innerHTML = ''; sheetKey = ''; return; }
    key = t.id + '|' + (t.mode || '') + '|' + (t.msg || '') + '|' + S.variant + '|' + S.c.bg;
    if (key !== sheetKey) {
      sheetView.innerHTML = FRAMES[t.id](t); sheetView.className = 'view view-' + t.id;
      sheetKey = key; slotEls = {};
      Array.prototype.forEach.call(sheetView.querySelectorAll('[data-slot]'), function (el) { slotEls[el.getAttribute('data-slot')] = el; });
    }
    FILLS[t.id](t, slotEls);
  }
  function renderAppearance(t) {
    appearanceEl.hidden = !isSettingsDetail(t);
    if (appearanceEl.hidden) { appearanceEl.removeAttribute('aria-modal'); return; }
    appearanceEl.setAttribute('aria-modal', 'true');
    if (t.id === 'wallpaper') { renderWallpaper(t); return; }
    V.appearance.norm(t);
    appearanceEl.className = 'appearance detail-' + t.group;
    appearanceRows.className = 'appearance-rows';
    appearanceTitle.textContent = T(groupName(t.group, t));
    var at = detailLocation(t), selected = at.item, error = S.lookError, status = '', hint;
    function command(item, inner, cls) {
      var applied = item.applied !== undefined ? item.applied : item.axis && S.c[item.axis] === item.value, ticked = item.axis || item.tick;
      var loading = !!(item.axis && S.pending && S.pending.target[item.axis] === item.value && S.pending.row === item.axis);
      return '<button type="button" tabindex="-1" class="setting-choice' + (cls ? ' ' + cls : '') + (t.f.action === item.action ? ' is-focus' : '') + (item.disabled ? ' is-disabled' : '') + (applied ? ' is-applied' : '') + (loading ? ' is-loading' : '') + '"'
        + (ticked ? ' role="radio" aria-checked="' + !!applied + '"' : '') + ' aria-label="' + esc(item.axis && item.value === 'both' ? 'Icons and text' : item.label) + '" aria-disabled="' + !!item.disabled + '" aria-busy="' + loading + '"'
        + ' data-z="detail" data-i="0" data-id="' + item.action + '" data-action="' + item.action + '">' + inner
        + (ticked ? '<span class="setting-tick" aria-hidden="true">' + (applied ? icon('check') : '') + '</span>' : '') + '</button>';
    }
    setHTML(appearanceBack, command({ action: 'settings.back', label: parentName(t) }, icon('left') + '<span>' + esc(parentName(t)) + '</span>', 'setting-back'));
    setHTML(appearanceRows, detailSections(t).map(function (section) {
      return '<section class="setting-section' + (section.horizontal ? ' is-horizontal' + (section.items.length >= 4 ? ' is-many' : '') + (section.items.length >= 5 ? ' is-five' : '') + (section.compact ? ' is-compact' : '') : '') + ' section-' + section.id + '">'
        + (section.title ? '<h3 class="setting-label" id="setting-' + section.id + '">' + esc(section.title) + '</h3>' : '')
        + (section.qr ? '<div class="setting-qr">' + (section.qr.length > 1 ? '<img src="' + section.qr + '" alt="">' : '') + '<div class="setting-qr-copy"><h3>' + esc('Scan with your phone') + '</h3><p>' + esc(section.qrNote) + '</p>'
          + (section.url ? '<p class="setting-url">' + escRaw(section.url.replace(/^http:\/\//, '')) + '</p>' : '') + '</div></div>' : '')
        + '<div class="setting-options"' + (section.items[0] && section.items[0].axis ? ' role="radiogroup" aria-label="' + esc(section.title || LOOK_NAMES[section.id] || DETAIL_NAMES[t.group]) + '"' : '') + '>'
        + section.items.map(function (item) {
          var swatch = item.axis === 'bg' && !section.horizontal, body = '';
          if (swatch || item.thumbnail) body += item.value === 'light' || item.value === 'dark'
            ? '<span class="setting-swatch swatch-' + item.value + '" aria-hidden="true"></span>'
            : '<img class="setting-swatch" src="' + WP + S.c.wall + '-thumb.jpg" alt="">';
          if (item.glyph) body += '<span class="setting-glyph" aria-hidden="true">' + item.glyph + '</span>';
          body += '<span class="setting-copy"><span class="setting-name">' + esc(item.label) + '</span>'
            + (item.description ? '<span class="setting-description">' + esc(item.description) + '</span>' : '') + '</span>';
          if (!item.axis && !item.tick) body += icon('right', 'setting-forward');
          return command(item, body, item.pair ? 'is-pair' : item.description ? 'has-description' : '');
        }).join('') + '</div>'
        + (section.reason ? '<p class="setting-reason">' + esc(section.reason) + '</p>' : '') + '</section>';
    }).join(''));
    if (S.pending) status = '<p>' + esc('Loading ' + (S.pending.row === 'font' ? FONTS[S.pending.target.font].name : 'your choice') + '…') + '</p><p>' + esc('Back cancels this change.') + '</p>';
    else if (error) {
      status = '<p class="setting-error">' + (error.type === 'save' ? 'Couldn’t save this change.' : error.type === 'font' ? 'Couldn’t load ' + esc(FONTS[error.font].name) + '.' : 'Couldn’t load this appearance.') + ' Your current choice is kept.</p>'
        + command({ action: 'settings.retry', label: 'Try again' }, '<span>Try again</span>', 'setting-retry');
    }
    setHTML(appearanceStatus, status);
    hint = selected.disabled ? '' : remoteHint(selected) || (selected.action === 'settings.back' ? 'Return to ' + (parentName(t)) : selected.action === 'settings.retry' ? 'Retry this change' : selected.axis === 'source' ? (selected.applied ? 'Remove from rotation' : 'Add to rotation') : selected.axis ? 'Apply selected setting' : selected.action === 'background.wallpaper' ? 'Choose a wallpaper' : selected.action === 'background.rotation' ? 'Choose a rotation interval' : selected.action === 'background.online' ? 'Choose a wallpaper source' : selected.action === 'phone.toggle' ? (S.phone.enabled ? 'Turn off' : 'Turn on') : selected.action === 'phone.forget' ? 'Phones scan a new code' : selected.action === 'phone.clear' ? 'Remove all my photos' : selected.action === 'nowplaying.access' ? 'Open Notification access' : /^open\./.test(selected.action) ? 'Open selected group' : selected.more ? 'Show these sources' : selected.action === 'typography.fonts' ? 'Choose a font' : selected.action === 'saver.start' ? 'Start the screensaver now' : selected.action === 'health.remote' ? 'Open Accessibility settings' : selected.action === 'health.phone' ? 'Open Phone settings' : selected.action === 'update.install' ? 'Download and install' : selected.action === 'update.check' ? 'Check now' : selected.action === 'update.auto' ? (S.update.auto ? 'Turn off' : 'Turn on') : selected.action === 'update.wait' ? 'Please wait' : selected.action.indexOf('iconapp.') === 0 ? 'Choose an icon' : selected.action.indexOf('iconset.') === 0 ? 'Use this icon' : selected.action === 'ha.refresh' ? 'Check again' : selected.action.indexOf('ha.area.') === 0 ? (selected.applied ? 'Hide this room' : 'Show this room') : selected.action === 'ha.forget' ? 'Forget the server and its token' : 'Open on the TV');
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '');
    fitRows();
  }
  /* A page taller than the room above the OK hint (long translations, an extra access row) scrolls
     to keep the focused row and its section title in view instead of running under the hint. */
  function fitRows() {
    var rows = appearanceRows, room = 952 - rows.offsetTop, f, sec, y = 0, el, top, bottom;
    if (rows.scrollHeight <= room + 2) { if (rows.className.indexOf('is-clipped') >= 0) { rows.className = rows.className.replace(/ ?is-clipped| ?is-more/g, ''); rows.style.maxHeight = ''; rows.scrollTop = 0; } return; }
    rows.style.maxHeight = room + 'px';
    if (rows.className.indexOf('is-clipped') < 0) rows.className += ' is-clipped';
    f = rows.querySelector('.is-focus');
    if (f) {
      for (el = f; el && el !== rows; el = el.offsetParent) y += el.offsetTop;
      sec = f.parentNode && f.parentNode.parentNode && /setting-section/.test(f.parentNode.parentNode.className) ? f.parentNode.parentNode : null;
      top = sec && sec.offsetParent === rows ? Math.min(y, sec.offsetTop) : y; bottom = y + f.offsetHeight;
      if (top < rows.scrollTop) rows.scrollTop = top;
      else if (bottom > rows.scrollTop + room - 8) rows.scrollTop = bottom - room + 24;
    }
    rows.className = rows.className.replace(/ ?is-clipped| ?is-more/g, '') + ' is-clipped' + (rows.scrollTop + room < rows.scrollHeight - 4 ? ' is-more' : '');
  }
  function remoteHint(item) {
    var a = item.action;
    return a === 'samsung.remote' ? 'Assign remote buttons' : a === 'remote.learn' ? (S.remote.learning ? 'Cancel' : 'Then press the button to assign')
      : a.indexOf('remote.key.') === 0 ? 'Change what this button does' : a === 'remote.apps' ? 'Choose an app' : a === 'remote.service' ? 'Open accessibility settings'
      : item.remote ? 'Use this for the button' : '';
  }
  function renderWallpaper(t) {
    V.wallpaper.norm(t);
    appearanceEl.className = 'appearance detail-wallpaper';
    appearanceTitle.textContent = T('Wallpaper');
    appearanceRows.className = 'appearance-rows wallpaper-picker';
    setHTML(appearanceBack, '<button type="button" tabindex="-1" class="setting-choice setting-back' + (t.f.zone === 'back' ? ' is-focus' : '') + '" data-z="wall-back" data-action="wallpaper.back">' + icon('left') + '<span>Background</span></button>');
    setHTML(appearanceRows, '<div class="wallpaper-edge wallpaper-before" aria-hidden="true">' + icon('up') + '</div><div class="wallpaper-list" role="radiogroup" aria-label="Wallpaper"><div class="wallpaper-rows"></div></div><div class="wallpaper-edge wallpaper-after" aria-hidden="true">' + icon('down') + '</div>');
    var rows = appearanceRows.querySelector('.wallpaper-rows'), shown = wall(S.wallShown) || wall(S.c.wall), candidate = WALLS[t.i], status, note, hint;
    keyed(rows, WALLS.map(function (w) { return { key: w.id, wall: w }; }), function (row, item, i) {
      var visible = i >= t.top && i < t.top + WALL_VISIBLE, w = item.wall, image;
      setContent(row, w.id + '|' + visible + '|' + inRotation(w) + '|' + isFav(w) + '|' + isHidden(w), '<span class="wallpaper-thumb">' + (visible ? '<img src="' + WP + w.id + '-thumb.jpg" alt="">' : '') + '</span><span class="setting-copy"><span class="setting-name">' + esc(w.name) + '</span>' + (isHidden(w) ? '<span class="setting-credit not-rotating">' + esc(T('Hidden')) + '</span>' : !inRotation(w) ? '<span class="setting-credit not-rotating">' + esc(T('Not in rotation')) + '</span>' : isFav(w) ? '<span class="setting-credit is-fav">' + esc(T('Favourite')) + (w.credit ? ' · ' + esc(w.credit) : '') + '</span>' : w.credit ? '<span class="setting-credit">' + esc(w.credit) + '</span>' : '') + '</span><span class="setting-tick" aria-hidden="true"></span>');
      row.className = 'setting-choice wallpaper-choice' + (t.f.zone === 'photo' && t.i === i ? ' is-focus' : '') + (w.id === S.c.wall ? ' is-applied' : '');
      row.style.transform = 'translate3d(0,' + (i * WALL_ROW) + 'px,0)'; row.style.visibility = visible ? 'visible' : 'hidden';
      row.setAttribute('role', 'radio'); row.setAttribute('tabindex', '-1'); row.setAttribute('aria-label', w.name);
      row.setAttribute('aria-checked', String(w.id === S.c.wall)); row.setAttribute('aria-posinset', String(i + 1)); row.setAttribute('aria-setsize', String(WALLS.length));
      row.setAttribute('aria-busy', String(t.previewDue === w.id || S.wallPending === w.id));
      attrs(row, 'wall-choice', i, 'wallpaper.choose.' + w.id);
      setHTML(row.querySelector('.setting-tick'), w.id === S.c.wall ? icon('check') : '');
      image = row.querySelector('img');
      if (image && !image._wallBound) {
        image._wallBound = true;
        image.onerror = function () { this.parentNode.className = 'wallpaper-thumb is-missing'; };
        if (image.complete && !image.naturalWidth) image.onerror();
      }
    });
    rows.style.transform = 'translate3d(0,' + (-t.top * WALL_ROW) + 'px,0)';
    appearanceRows.querySelector('.wallpaper-before').className = 'wallpaper-edge wallpaper-before' + (t.top > 0 ? ' is-on' : '');
    appearanceRows.querySelector('.wallpaper-after').className = 'wallpaper-edge wallpaper-after' + (t.top + WALL_VISIBLE < WALLS.length ? ' is-on' : '');
    note = t.previewDue ? 'Preparing ' + candidate.name + '…' : S.wallPending ? (t.applyPending ? 'Applying ' : 'Loading ') + candidate.name + '…' : shown.id === S.c.wall ? 'Applied' : 'Preview';
    if (t.failedId) note = S.err ? 'Couldn’t save ' + wall(t.failedId).name + '.' : 'Couldn’t load ' + wall(t.failedId).name + '.';
    status = '<p class="wallpaper-preview-name"><span>' + esc(shown.name) + '</span><span class="wallpaper-count">' + (wallIndex(shown.id) + 1) + ' of ' + WALLS.length + '</span></p><p class="wallpaper-preview-state' + (t.failedId ? ' setting-error' : '') + '">' + esc(note) + '</p>';
    if (!t.failedId) status += '<div class="wallpaper-marks"><button type="button" tabindex="-1" class="setting-choice setting-retry wallpaper-mark' + (t.f.zone === 'fav' ? ' is-focus' : '') + (isFav(candidate) ? ' is-on' : '') + '" data-z="wall-fav" data-action="wallpaper.fav">' + icon(isFav(candidate) ? 'check' : 'plus') + '<span>' + esc('Favourite') + '</span></button>'
      + '<button type="button" tabindex="-1" class="setting-choice setting-retry wallpaper-mark' + (t.f.zone === 'hide' ? ' is-focus' : '') + (isHidden(candidate) ? ' is-on' : '') + '" data-z="wall-hide" data-action="wallpaper.hide">' + (isHidden(candidate) ? icon('check') : '') + '<span>' + esc('Hide') + '</span></button></div>';
    if (t.failedId) status += '<button type="button" tabindex="-1" class="setting-choice setting-retry' + (t.f.zone === 'retry' ? ' is-focus' : '') + '" data-z="wall-retry" data-action="wallpaper.retry">Try again</button>';
    setHTML(appearanceStatus, status);
    hint = t.f.zone === 'back' ? 'Return to Background' : t.f.zone === 'retry' ? 'Retry this photo'
      : t.f.zone === 'fav' ? (isFav(candidate) ? 'Remove from favourites' : 'Always keep this photo in rotation')
      : t.f.zone === 'hide' ? (isHidden(candidate) ? 'Show this photo again' : 'Never show this photo') : 'Apply selected photo';
    if (t.f.zone === 'photo' && candidate.id === S.c.wall && !S.pending && !t.failedId) hint = '';
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '');
  }
  /* Keep the retry or membership state on the focused control. The stage-level line
     shares its position without changing the control's identity or key behaviour. */
  function renderFocusStatus(t) {
    if (isSettingsDetail(t)) { focusStatus.className = 'focus-status'; return; }
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, active = root.querySelectorAll('.is-focus[data-action]'), target = null, text = S.err ? 'Not saved. OK tries again.' : '', i, r, sr, scale, x, y, w, action, solid, photoRow = false, photoFree = false;
    Array.prototype.forEach.call(stage.querySelectorAll('.has-local-status'), function (el) { el.className = el.className.replace(/\s+has-local-status/g, ''); });
    for (i = 0; i < active.length; i++) if (renderedAction(active[i])) { target = active[i]; break; }
    if (!text && t.id === 'arrange' && (t.f.zone === 'act' || t.f.zone === 'tiles')) {
      var slot = t.slots[t.f.i];
      if (slot && !slot.removed && t.f.zone === 'act' && S.c.home.length === 1) text = LAST;
    }
    if (!text && S.note === LAST && t.id === 'arrange') text = LAST;
    if (!target || !text) { focusStatus.className = 'focus-status'; return; }
    if (target.parentNode === utilsEl && utilsEl.className.indexOf('is-icons') >= 0) { renderUtilFocusLabel(target); focusStatus.className = 'focus-status'; return; }
    // Photo action pills stay on one line; the header already carries this status.
    if (S.c.layout === 'list' && t.id === 'arrange' && !t.lifted && (t.f.zone === 'act' || t.f.zone === 'tiles')) { focusStatus.className = 'focus-status'; return; }
    photoRow = S.c.layout === 'list' && target.className.indexOf('ph-row') >= 0;
    if (photoRow && phAction.className.indexOf('is-on') >= 0) target = phAction;
    else if (photoRow) photoFree = true;
    target.className += ' has-local-status';
    action = target.getAttribute('data-action');
    r = target.getBoundingClientRect(); sr = stage.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    x = (r.left - sr.left) / scale; y = (r.top - sr.top) / scale; w = r.width / scale;
    if (photoFree) { x = 112 + parseFloat(phPlates[photoPlateIndex].style.width) + 24; y += (r.height / scale - 28) / 2; w = 400; }
    else if (action.indexOf('home.app.') === 0 || action.indexOf('arrange.tile.') === 0 || action.indexOf('arrange.placeholder.') === 0) y += 171;
    else if (action.indexOf('apps.order.') === 0) y += 86;
    else if (action.indexOf('apps.toggle.') === 0 || action.indexOf('apps.add.') === 0) y += 164;
    else if (action.indexOf('layout.') === 0) y += 54;
    else y += action.indexOf('arrange.remove.') === 0 || action.indexOf('arrange.restore.') === 0 ? 43 : 40;
    solid = /(?:^|\s)(?:u|btn|er-rm|dock-action|set-row|ph-action)(?:\s|$)/.test(target.className) && target.parentNode !== utilsEl && target.parentNode.className.indexOf('s-head') < 0;
    if (target === phAction && target.className.indexOf('is-focus') < 0) solid = false;
    focusStatus.className = 'focus-status is-on' + (solid ? ' dark-ink' : '') + (photoFree ? ' photo-status' : '');
    focusStatus.textContent = T(text);
    focusStatus.style.left = clamp(x + 8, 112, 1808 - Math.min(w - 16, 800)) + 'px';
    focusStatus.style.top = clamp(y, 72, 988) + 'px';
    focusStatus.style.width = Math.min(w - 16, 800) + 'px';
  }
  function headButtons(list, fi, prefix) {
    return list.map(function (b, i) {
      return '<button type="button" tabindex="-1" class="btn' + (i === fi ? ' is-focus' : '') + (b[2] ? ' ' + b[2] : '') + '" data-z="head" data-i="' + i + '" data-action="' + prefix + '.' + b[0] + '" aria-label="' + esc(b[0] === 'undo' ? undoCaption() : b[1]) + '">' + (b[3] ? icon(b[3]) : '') + '<span>' + esc(b[1]) + '</span></button>';
    }).join('');
  }
  var FRAMES = {
    player: function () {
      return '<div class="pl-bg" aria-hidden="true"><img class="pl-back" data-slot="back" alt=""></div><div class="pl-shade" aria-hidden="true"></div>'
        + '<div class="pl-art" data-slot="art"></div>'
        + '<div class="pl-info"><p class="pl-app" data-slot="app"></p><h2 class="pl-title" data-slot="title"></h2><p class="pl-artist" data-slot="artist"></p>'
        + '<div class="pl-bar" data-slot="bar" data-z="pbar" data-i="0"><div class="pl-track"><div class="pl-fill" data-slot="fill"></div><div class="pl-knob" data-slot="knob"></div></div>'
        + '<div class="pl-times"><span data-slot="pos"></span><span data-slot="dur"></span></div></div>'
        + '<div class="pl-buttons" data-slot="buttons"></div><div class="pl-next" data-slot="queue"></div></div>'
        + '<div class="pl-words" data-slot="lyrics"><div class="pl-lines" data-slot="lines"></div></div>'
        + '<p class="pl-credit" data-slot="credit"></p><p class="pl-hint" data-slot="hint"></p>';
    },
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
    },
    apps: function () {
      return '<h2 class="s-title" data-slot="title"></h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<div class="grid-view" data-slot="view"><div class="grid-in" data-slot="grid"></div></div>'
        + '<div class="row-cue grid-before" data-slot="before" aria-hidden="true">' + icon('up') + '</div><div class="row-cue grid-after" data-slot="after" aria-hidden="true">' + icon('down') + '</div>';
    },
    editor: function () {
      return '<h2 class="s-title">' + esc('Apps on Home') + '</h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<p class="s-label z-home" data-slot="lh"></p><p class="s-label z-other">' + esc('Not on Home') + '</p>'
        + '<div class="ed-home" data-slot="home"></div><div class="ed-order-break" data-slot="break">' + esc('Then scroll') + '</div><div class="ed-other-view" data-slot="ov"><div class="ed-other" data-slot="other"></div></div><div class="ed-origin" data-slot="origin"></div>'
        + '<div class="row-cue editor-before" data-slot="otherBefore" aria-hidden="true">' + icon('up') + '</div><div class="row-cue editor-after" data-slot="otherAfter" aria-hidden="true">' + icon('down') + '</div>';
    },
    settings: function () { return '<h2 class="s-title">' + esc('Settings') + '</h2><div class="settings-overview" data-slot="list"></div><p class="settings-overview-hint"><span class="remote-key">OK</span><span>' + esc('Open selected group') + '</span></p>'; },
    pin: function () {
      return '<h2 class="msg-title" data-slot="title"></h2><p class="msg-line" data-slot="line"></p><div class="pin-boxes" data-slot="boxes"></div><p class="pin-err" data-slot="err"></p>'
        + '<p class="pin-hint"><span class="remote-key">▲▼</span><span>' + esc('Change the digit') + '</span><span class="remote-key">OK</span><span>' + esc('Next') + '</span><span class="remote-key">0–9</span><span>' + esc('Type') + '</span></p>';
    },
    message: function (t) {
      var m = messageContent(t);
      return '<h2 class="msg-title">' + esc(m.title) + '</h2><p class="msg-line">' + esc(m.line) + '</p><p class="msg-note">' + esc(m.note) + '</p><div class="msg-acts" data-slot="acts"></div>';
    }
  };
  function gridTileHtml(id) {
    var a = app(id), state = onHome(id) ? badge(true) + '<span>On Home</span>' : '';
    return '<span class="panel-content">' + appMark(a, 120, 72, 58) + '<span class="label">' + esc(a.name) + '</span></span><span class="state">' + state + '</span>';
  }
  var FILLS = {
    player: function (t, el, tick) {
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
      setHTML(el.queue, S.c.pqueue === 'on' && d.found && d.next && d.next.length && !wide ? '<p class="pl-next-h">' + esc('Up next') + '</p>' + d.next.map(function (x) {
        return '<p class="pl-next-i"><span>' + escRaw(x.title) + '</span>' + (x.artist ? ' · ' + escRaw(x.artist) : '') + '</p>';
      }).join('') : '');
      el.lyrics.className = 'pl-words' + (wide ? ' is-on' : '') + (synced ? ' is-synced' : '') + (S.c.pword === 'on' ? '' : ' no-words');
      setHTML(el.credit, showLyrics ? esc(tr ? 'Lyrics from LRCLIB, translated by Google' : 'Lyrics from LRCLIB') : ly && ly.state === 'instrumental' ? esc('Instrumental') : ly && ly.state === 'none' ? esc('No lyrics for this song') : '');
      sheetView.className = 'view view-player' + (wide ? ' has-lyrics' : '');
    },
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
      setHTML(el.badge, t.state === 'live' ? '<span class="ha-dot"></span>' + esc('Live') : '');
      setHTML(el.title, escRaw(c.name));
      setHTML(el.state, t.state === 'live' ? '' : esc(t.state === 'error' ? haCamError(t.msg) : 'Connecting…'));
      setHTML(el.close, '<button type="button" tabindex="-1" class="btn is-focus" data-z="hacam-close" data-i="0" data-action="hacam.close">' + icon('left') + '<span>' + esc('Smart home') + '</span></button>');
    },
    apps: function (t, el) {
      var f = t.f, items = appsItems(), n = items.length, rows = Math.ceil(n / COLS), vis = 3, row = Math.floor(f.i / COLS);
      setHTML(el.title, esc('All apps'));
      setHTML(el.sub, esc(catalog.loading ? 'Loading installed apps…' : catalog.error || (!n ? 'No installed apps found.' : '')));
      setHTML(el.head, headButtons(appsHead(), f.zone === 'head' ? 0 : -1, 'apps'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      if (f.zone === 'grid') { if (row < t.top) t.top = row; if (row > t.top + vis - 1) t.top = row - vis + 1; }
      t.top = clamp(t.top, 0, Math.max(0, rows - vis));
      keyed(el.grid, items.map(function (id) { return { key: id, id: id }; }), function (tile, it, i) {
        var focus = f.zone === 'grid' && i === f.i;
        setContent(tile, [it.id, app(it.id).name, onHome(it.id)].join('|'), gridTileHtml(it.id));
        tile.className = 'gt' + (focus ? ' is-focus' : '');
        tile.style.transform = 'translate3d(' + ((i % COLS) * GRID_COL) + 'px,' + (Math.floor(i / COLS) * GRID_ROW) + 'px,0)';
        tile.setAttribute('role', 'button'); tile.setAttribute('aria-label', app(it.id).name);
        attrs(tile, 'grid', i, 'apps.open.' + it.id);
      });
      el.grid.style.transform = 'translate3d(0,' + (-t.top * GRID_ROW) + 'px,0)';
      el.view.className = 'grid-view' + (t.top > 0 ? ' more-before' : '') + (rows - t.top > vis ? ' more-after' : '');
      el.before.className = 'row-cue grid-before' + (t.top > 0 ? ' is-on' : '');
      el.after.className = 'row-cue grid-after' + (rows - t.top > vis ? ' is-on' : '');
    },
    editor: function (t, el) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherGroups(), list = O.recent.concat(O.rest), full = S.c.home.length >= CAP;
      var entries = [], ys = [], y = 0, yf, minTop, maxTop = 0, rowEnd, before = false, afterRows = false;
      var hint = catalog.error ? catalog.error : catalog.loading ? 'Loading installed apps…' : f.zone === 'head' && f.h === 0 ? undoCaption() : f.zone === 'home' && f.part === 'remove' ? (H.length <= 1 ? LAST : app(H[f.i]).name + ' stays installed.') : '';
      setHTML(el.sub, editStatus(hint, t.lifted ? 'Moving ' + app(t.lifted.id).name + '. OK places it, Back puts it back.' : ''));
      setHTML(el.head, headButtons([['undo', 'Undo', S.undo.length ? '' : 'is-idle', 'undo'], ['done', 'Done', '', 'check']], f.zone === 'head' ? f.h : -1, 'editor'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      setHTML(el.lh, esc('On Home') + ' <span class="s-count">' + S.c.home.length + ' ' + esc('of') + ' ' + CAP + '</span>');
      el['break'].className = 'ed-order-break' + (H.length > editorCut() ? ' is-on' : '');
      el['break'].style.top = (264 + editorCut() * ED_ROW) + 'px';

      keyed(el.home, H.map(function (id) { return { key: id, id: id }; }), function (row, it, i) {
        var a = app(it.id), here = f.zone === 'home' && i === f.i, lifted = !!t.lifted && i === f.i;
        setContent(row, it.id, '<div class="er-name" role="button"><span class="panel-content"><span class="er-num"></span>' + smallMark(a) + '<span class="er-text">' + esc(a.name) + '</span><span class="er-move">' + icon('updown') + '</span></span></div><div class="er-rm" role="button"><span></span></div>');
        row.className = 'er' + (here ? ' is-active' : '') + (lifted ? ' is-lifted' : '');
        row.style.transform = 'translate3d(' + (lifted ? 16 : 0) + 'px,' + editorHomeY(i) + 'px,0)';
        row.querySelector('.er-num').textContent = String(i + 1);
        row.firstChild.className = 'er-name' + (here && (f.part === 'name' || lifted) ? ' is-focus' : '');
        row.lastChild.className = 'er-rm' + (here && f.part === 'remove' && !lifted ? ' is-focus' : '') + (H.length <= 1 ? ' is-limit' : '');
        row.lastChild.firstChild.textContent = T(H.length <= 1 ? LAST : 'Remove from Home');
        attrs(row.firstChild, 'name', i, 'editor.move.' + it.id);
        attrs(row.lastChild, 'remove', i, 'editor.remove.' + it.id);
      });
      el.origin.className = 'ed-origin' + (t.lifted && t.lifted.from !== f.i ? ' is-on' : '');
      if (t.lifted) el.origin.style.transform = 'translate3d(0,' + (264 + editorHomeY(t.lifted.from) + 16) + 'px,0)';

      if (O.recent.length) { entries.push({ key: 'sep-recent', sep: 'Recently removed', y: y }); y += ED_SEP; }
      O.recent.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (O.recent.length && O.rest.length) { entries.push({ key: 'sep-rest', sep: 'Other installed apps', y: y }); y += ED_SEP; }
      O.rest.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (f.zone === 'other' && ys.length) {
        yf = ys[f.j] - (O.recent.length && (f.j === 0 || f.j === O.recent.length) ? ED_SEP : 0);
        if (yf < t.top) t.top = yf;
        if (ys[f.j] + 72 > t.top + ED_VIEW) {
          minTop = ys[f.j] + 72 - ED_VIEW;
          entries.some(function (it) { if (it.y < minTop) return false; t.top = it.y; return true; });
        }
      }
      entries.some(function (it) { if (it.y < Math.max(0, y - ED_VIEW)) return false; maxTop = it.y; return true; });
      t.top = clamp(t.top, 0, maxTop);
      keyed(el.other, entries, function (row, it) {
        var j, focus, a;
        row.style.transform = 'translate3d(0,' + it.y + 'px,0)';
        rowEnd = it.y + (it.sep ? ED_SEP : 72);
        row.style.visibility = it.y >= t.top && rowEnd <= t.top + ED_VIEW ? 'visible' : 'hidden';
        before = before || it.y < t.top; afterRows = afterRows || rowEnd > t.top + ED_VIEW;
        if (it.sep) { setContent(row, 'sep|' + it.sep, esc(it.sep)); row.className = 'eo-sep'; return; }
        j = list.indexOf(it.id); focus = f.zone === 'other' && j === f.j; a = app(it.id);
        setContent(row, it.id, '<span class="panel-content">' + smallMark(a) + '<span class="eo-text">' + esc(a.name) + '</span><span class="eo-verb"></span></span>');
        row.querySelector('.eo-verb').innerHTML = focus ? '<span class="verb' + (full ? ' is-off' : '') + '">' + esc(full ? 'Home is full' : 'Add to Home') + '</span>' : '';
        row.className = 'eo' + (focus ? ' is-focus' : '');
        row.setAttribute('role', 'button');
        attrs(row, 'other', j, 'editor.add.' + it.id);
      });
      el.other.style.transform = 'translate3d(0,' + (-t.top) + 'px,0)';
      el.ov.className = 'ed-other-view';
      el.otherBefore.className = 'row-cue editor-before' + (before ? ' is-on' : '');
      el.otherAfter.className = 'row-cue editor-after' + (afterRows ? ' is-on' : '');
    },
    settings: function (t, el) {
      var html = '';
      settingsColumns().forEach(function (col) {
        html += '<div class="settings-col">';
        col.forEach(function (g) {
          html += '<h3 class="settings-head">' + esc(g.head) + '</h3>';
          g.rows.forEach(function (r) {
        html += '<button type="button" tabindex="-1" class="settings-group' + (r.id === t.f.id ? ' is-focus' : '') + '" data-z="row" data-i="0" data-id="' + r.id + '" data-action="settings.' + (r.id === 'editor' ? 'editor' : 'group.' + r.id) + '"><span class="settings-group-copy"><span class="settings-group-name">' + esc(r.label) + '</span><span class="settings-group-value">' + esc(r.value) + '</span></span>' + icon('right') + '</button>';
          });
        });
        html += '</div>';
      });
      setHTML(el.list, html);
    },
    pin: function (t, el) {
      var html = '', i;
      setHTML(el.title, t.step === 'check' ? esc('Enter the PIN') : t.step === 'new' ? esc('Choose a PIN') : esc('Enter it again'));
      setHTML(el.line, t.step === 'check' ? esc(t.what === 'Settings' ? 'Settings are locked.' : t.what + ' is locked.') : esc('Four digits. Keep it somewhere safe.'));
      for (i = 0; i < 4; i++) html += '<span class="pin-box' + (i === t.cur ? ' is-focus' : '') + (i < t.cur ? ' is-done' : '') + '" data-z="pin" data-i="' + i + '">' + (i < t.cur ? '•' : i === t.cur && t.digits[i] !== undefined ? t.digits[i] : '') + '</span>';
      setHTML(el.boxes, html);
      el.boxes.className = 'pin-boxes' + (t.shake ? ' is-shake' + (t.shake % 2) : '');
      setHTML(el.err, esc(t.err || ''));
    },
    message: function (t, el) {
      setHTML(el.acts, messageContent(t).actions.map(function (a, i) {
        return '<button type="button" tabindex="-1" class="btn' + (i === t.f.b ? ' is-focus' : '') + '" data-z="act" data-i="' + i + '" data-action="message.' + esc(a[0]) + '"><span>' + esc(a[1]) + '</span></button>';
      }).join(''));
    }
  };

  /* ---------- Atomic appearance bundles ---------- */
  var wallToken = 0, committedBundle = null, reflowToken = 0, fontSwitchToken = 0;
  function registeredMaterial(id) { return S.c.bg === 'photo' && S.c.material === 'soft' && !!wall(id); }
  function matSrc(id, material) { return 'assets/materials/' + id + (material === 'soft' ? '-study-soft.jpg' : material === 'tint' ? '-field-clear.jpg' : '-field-frost.jpg'); }
  function fieldSrc(id, material) { return 'assets/materials/' + id + (material === 'soft' ? '-field-blur.jpg' : material === 'tint' ? '-field-clear.jpg' : '-field-frost.jpg'); }
  function makeImg(cls, src) { var im = document.createElement('img'); im.className = cls; im.alt = ''; im._src = src; im.src = src; return im; }
  function whenReady(im, done) {
    var fin = false, timer = setTimeout(function () { finish(false); }, 8000);
    function finish(ok) { if (fin) return; fin = true; clearTimeout(timer); done(ok); }
    function ready() { if (im.decode) im.decode().then(function () { finish(true); }, function () { finish(false); }); else finish(true); }
    if (im.complete) { if (im.naturalWidth) ready(); else finish(false); }
    else { im.onload = ready; im.onerror = function () { finish(false); }; }
  }
  function swapImg(k, im) { var old = IMG[k]; if (old === im) return; im.style.cssText = old.style.cssText; if (old.id) im.id = old.id; old.parentNode.replaceChild(im, old); IMG[k] = im; }
  function bundleKey(look) { return look.wall + '|' + look.material; }
  function loadBundle(look, token, done) {
    var imgs = { photo: makeImg('photo', WP + look.wall + '.jpg'), bg: makeImg('sheet-bg', WP + look.wall + '-panel.jpg') }, keys, left, allOk = true;
    imgs.mat = makeImg('mat-img', matSrc(look.wall, look.material));
    imgs.field = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.fieldAlt = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.utility = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.utilityAlt = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    keys = Object.keys(imgs); left = keys.length;
    keys.forEach(function (k) { whenReady(imgs[k], function (ok) {
      allOk = allOk && ok;
      if (--left || token !== wallToken) return;
      done(allOk ? { key: bundleKey(look), imgs: imgs } : null);
    }); });
  }
  function installBundle(bundle, look, previewOnly) {
    if (bundle) {
      Object.keys(bundle.imgs).forEach(function (k) { if (!previewOnly || k !== 'bg') swapImg(k, bundle.imgs[k]); });
      S.bundleKey = bundle.key;
    }
    S.shown = { bg: look.bg, wall: look.wall, material: look.material, font: look.font };
    phFields.concat(utFields).forEach(function (el) { var p = el._placement; if (p) fieldTransform(el, p.x, p.y, p.width, p.height); });
    S.wallShown = look.wall; S.wallPending = null; S.wallError = null;
  }
  function cleanPatch(patch) {
    var out = {}, k;
    if (!patch || typeof patch !== 'object') throw new Error('look needs an appearance patch');
    for (k in patch) if (patch.hasOwnProperty(k)) {
      if (k === 'wall') { if (!wall(patch[k])) throw new Error('Unknown wallpaper: ' + patch[k]); }
      else if (k === 'font') { if (!FONTS[patch[k]] || patch[k] !== 'manrope' && PRIVATE_FONTS.indexOf(patch[k]) < 0) throw new Error('Unavailable font: ' + patch[k]); }
      else if (!LOOK_VALUES[k] || LOOK_VALUES[k].indexOf(patch[k]) < 0) throw new Error('Invalid appearance value: ' + k);
      out[k] = patch[k];
    }
    return out;
  }
  function cancelLook() { wallToken++; S.pending = null; S.wallPending = null; S.lookError = null; }
  function setLook(patch, options) {
    var opts = options || {}, changes = cleanPatch(patch), target = lookOf(S.c), k, token, needs, needsFont, changed, loadedBundle = null, imageDone, fontDone, failed = false;
    for (k in changes) if (changes.hasOwnProperty(k)) target[k] = changes[k];
    changed = Object.keys(target).some(function (key) { return target[key] !== S.c[key]; });
    cancelLook(); S.err = null; token = wallToken;
    function finish(bundle) {
      var c = next(S.c.home.slice(), S.c.recent.slice()), fontChanged = target.font !== S.c.font, reflow = target.apps !== S.c.apps || target.controls !== S.c.controls || fontChanged, frame, fontFrame;
      Object.keys(target).forEach(function (key) { c[key] = target[key]; });
      S.pending = null; S.wallPending = null;
      if (!opts.transient && changed && !write(c, 'Appearance')) { S.lookError = { type: 'save', patch: changes, row: opts.row || S.appearanceFocus, transient: false }; render(); syncRotation(); return; }
      if (opts.transient) S.c = c;
      if (reflow) { S.reflow = true; frame = ++reflowToken; }
      if (fontChanged) { S.fontSwitch = true; fontFrame = ++fontSwitchToken; }
      installBundle(bundle, target);
      if (bundle) committedBundle = bundle;
      S.lookError = null; S.previewBundle = null;
      render(); syncRotation();
      if (reflow) window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
        if (frame !== reflowToken) return;
        S.reflow = false; stage.className = stage.className.replace(/\s+is-reflow/g, '');
      }); });
      if (fontChanged) setTimeout(function () {
        if (fontFrame !== fontSwitchToken) return;
        S.fontSwitch = false; stage.className = stage.className.replace(/\s+is-font-switch/g, '');
      }, REDUCED_MOTION ? 130 : 170);
    }
    function fail(type, reason) {
      if (token !== wallToken || failed) return;
      failed = true; S.pending = null; S.wallPending = null;
      if (type === 'load') S.wallError = target.wall;
      S.lookError = { type: type, reason: reason || null, patch: changes, row: opts.row || (type === 'font' ? 'font' : S.appearanceFocus), transient: !!opts.transient, wall: target.wall, font: target.font };
      if (type === 'font') log((opts.startup ? 'font fallback: ' : 'Font kept: ') + (opts.startup ? target.font : FONTS[S.c.font].name) + (opts.startup ? '' : ' (' + reason + ')'));
      if (type === 'font' && opts.startup && target.font !== 'manrope') { setLook({ font: 'manrope' }, { transient: true }); return; }
      render(); syncRotation();
    }
    function complete() {
      if (!imageDone || !fontDone || failed || token !== wallToken) return;
      window.requestAnimationFrame(function () { if (!failed && token === wallToken) finish(loadedBundle); });
    }
    needs = target.bg === 'photo' && S.bundleKey !== bundleKey(target) && (!S.shown || S.shown.bg !== 'photo' || target.wall !== S.c.wall || materialApplies(target));
    needsFont = !fontMetrics[target.font]; imageDone = !needs; fontDone = !needsFont;
    if (!needs && !needsFont) { finish(null); return; }
    S.pending = { patch: changes, target: target, row: opts.row || (needsFont ? 'font' : S.appearanceFocus), transient: !!opts.transient, preview: false };
    if (needs) {
      S.wallPending = target.wall;
      loadBundle(target, token, function (bundle) {
        if (!bundle) { fail('load'); return; }
        loadedBundle = bundle; imageDone = true; complete();
      });
    }
    if (needsFont) ensureFont(target.font, function (ok, reason) {
      if (!ok) { fail('font', reason); return; }
      fontDone = true; complete();
    });
    render();
  }
  function showWall(id, done) {
    var target = lookOf(S.c), token;
    target.bg = 'photo'; target.wall = id;
    cancelLook(); token = wallToken; S.wallError = null;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false }; S.wallPending = id;
    loadBundle(target, token, function (bundle) {
      S.pending = null; S.wallPending = null;
      if (!bundle) { S.wallError = id; done(false); return; }
      S.previewBundle = bundle; installBundle(bundle, target, true); done(true);
    });
    render();
  }
  function restoreLook() {
    cancelLook(); S.previewBundle = null;
    if (S.c.bg === 'photo' && committedBundle && committedBundle.key === bundleKey(S.c)) installBundle(committedBundle, S.c);
    else if (S.c.bg !== 'photo' || S.bundleKey === bundleKey(S.c)) installBundle(null, S.c);
    else setLook({}, { transient: true });
  }

  /* ---------- Lifecycle and remote input ---------- */
  var clockTimer = 0, rotationTimer = 0, activeSince = 0, activeMs = 0, rotationKey = '';
  function rotationActive() { return !document.hidden && !S.saver && top().id === 'home' && S.c.bg === 'photo' && !S.pending && mode().min > 0; }
  function pauseRotation() {
    if (activeSince) { activeMs += Date.now() - activeSince; activeSince = 0; }
    clearTimeout(rotationTimer); rotationTimer = 0;
  }
  function resetRotation() { pauseRotation(); activeMs = 0; rotationKey = ''; }
  function syncRotation() {
    var key = S.c.wall + '|' + S.c.mode;
    pauseRotation();
    if (key !== rotationKey) { activeMs = 0; rotationKey = key; }
    if (!rotationActive()) return;
    activeSince = Date.now();
    rotationTimer = setTimeout(function () {
      pauseRotation(); activeMs = 0;
      var pool = rotationPool(), at = pool.indexOf(wall(S.c.wall));
      if (rotationActive()) setLook({ wall: pool[(at + 1) % pool.length].id }, { row: 'bg' });
    }, Math.max(10, mode().min * QA.minuteMs - activeMs));
  }
  /* ---------- Native start screen (Android) ---------- */
  /* Home has painted once the look is installed and the photo decoded: the native backdrop can fade. The
     wallpaper is saved for the next start as a small JPEG, only when it changes. */
  var STARTUP = ANDROID && FrameDevice.startup && !DREAM ? FrameDevice.startup : null, BACKDROP_KEY = 'shore.backdrop';
  /* Start: Home stays hidden ('pre') under the native backdrop, then the clock, buttons and tiles rise in
     while the backdrop fades ('intro'). Off in the screensaver and when the TV asks for less motion. */
  function reducedMotion() { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function startupReady() {
    var since = Date.now();
    (function wait() {
      var photo = S.c.bg !== 'photo' || !!(IMG.photo.complete && IMG.photo.naturalWidth);
      if (!(QA.ready() && photo) && Date.now() - since < 8000) { setTimeout(wait, 60); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (STARTUP) STARTUP.ready();
        addonsReady = true; // add-ons start only now, so they never delay the first paint
        S.intro = reducedMotion() || DREAM ? '' : 'intro'; render();
        setTimeout(function () { S.intro = ''; render(); }, 1300);
        if (STARTUP) setTimeout(saveBackdrop, 3000);
      }); });
    })();
  }
  /* Where Home's pieces sit on the 1920x1080 stage, for the skeleton drawn into the backdrop. */
  function stageRects(selector) {
    var base = stage.getBoundingClientRect(), k = base.width / 1920 || 1;
    return Array.prototype.map.call(document.querySelectorAll(selector), function (el) {
      var r = el.getBoundingClientRect();
      return { x: (r.left - base.left) / k, y: (r.top - base.top) / k, w: r.width / k, h: r.height / k };
    }).filter(function (r) { return r.w > 4 && r.h > 4 && r.x < 1920 && r.y < 1080 && r.x + r.w > 0 && r.y + r.h > 0; });
  }
  function skeleton(ctx, rects, radius, fill) {
    ctx.fillStyle = fill;
    rects.forEach(function (r) {
      var x = r.x / 2, y = r.y / 2, w = r.w / 2, h = r.h / 2, q = Math.min(radius / 2, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath(); ctx.fill();
    });
  }
  function saveBackdrop() {
    if (!STARTUP || S.saver || document.hidden || top().id !== 'home' || S.pending || !S.shown || S.intro) return;
    var key = [S.shown.bg, S.shown.wall, S.c.layout, S.c.lstyle, S.c.apps, S.c.controls, S.c.home.length, S.c.cpos, S.c.csize, utils().length].join('|'), saved = '', canvas, ctx, im = IMG.photo, w, h, k;
    try { saved = localStorage.getItem(BACKDROP_KEY) || ''; } catch (e) { }
    if (key === saved) return;
    try {
      canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540; ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(stage).backgroundColor || '#000'; ctx.fillRect(0, 0, 960, 540);
      if (S.shown.bg === 'photo' && im.complete && im.naturalWidth) {
        k = Math.max(960 / im.naturalWidth, 540 / im.naturalHeight); w = 960 / k; h = 540 / k;
        ctx.drawImage(im, (im.naturalWidth - w) / 2, (im.naturalHeight - h) / 2, w, h, 0, 0, 960, 540);
      }
      // Skeleton: soft shapes where the dock, its tiles, the clock and the buttons appear.
      skeleton(ctx, stageRects('#dock:not(.is-empty)'), 28, 'rgba(18,18,20,.34)');
      skeleton(ctx, stageRects('#track .tile .mark, #track .tile .label-ink, #home .ph-row, #caption .clock, #utils .u'), 14, 'rgba(255,255,255,.26)');
      STARTUP.backdrop(canvas.toDataURL('image/jpeg', 0.82));
      localStorage.setItem(BACKDROP_KEY, key);
    } catch (e) { }
  }
  function updateClock() {
    clearTimeout(clockTimer);
    if (document.hidden) return;
    if (S.night !== nightActive()) {
      S.night = nightActive(); render();
      // Night begins with a bright photo on: move to a dark one in rotation.
      if (calmNight() && wall(S.c.wall).tone !== 'dark' && !S.pending) { var dark = rotationPool().filter(function (w) { return w.tone === 'dark'; }); if (dark.length) setLook({ wall: dark[0].id }, { row: 'bg' }); }
    }
    if (S.c.idle !== 'off' && !idleTimer && !S.idleHidden) idleReset();
    if (WEATHER && S.c.cweather === 'on') WEATHER.refresh(false);
    if (top().id === 'home' || isSettingsDetail(top())) renderCaption(top(), homeState(top()));
    if (S.saver) renderSaver(); else if (!saverTimer) saverReset(); else syncAwake();
    if (STARTUP) saveBackdrop();
    syncAwake();
    clockTimer = setTimeout(updateClock, S.c.csec === 'on' ? 1000 - (Date.now() % 1000) + 20 : 60000 - (Date.now() % 60000) + 30);
  }
  function focusStage() { try { stage.focus({ preventScroll: true }); } catch (e) { stage.focus(); } }
  function after() { norm(); render(); syncRotation(); }
  function goScene(name) {
    if (top().id === 'wallpaper') cancelWallpaperTimer(top());
    if (HA) HA.camera.hangup();
    S.stack = [S.stack[0]]; S.stack[0].f.zone = 'apps'; clearSession(); restoreLook();
    if (name === 'apps') openApps();
    else if (name === 'settings') openSettings();
    else if (name === 'appearance') { openSettings(); top().f.id = 'background'; S.settingsFocus = 'background'; openAppearance('background'); }
    else if (name === 'editor') { openSettings(); openEditor('settings'); }
    after();
  }
  function fit() {
    // Android TV WebView grows innerWidth to the 1920px stage; clientWidth is the visible viewport.
    var w = document.documentElement.clientWidth || window.innerWidth, h = document.documentElement.clientHeight || window.innerHeight;
    var scale = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.left = ((w - 1920 * scale) / 2) + 'px';
    stage.style.top = ((h - 1080 * scale) / 2) + 'px';
  }
  function renderedAction(el) {
    return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }
  function focusedAction() {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('.is-focus[data-action]'), i;
    for (i = 0; i < els.length; i++) if (renderedAction(els[i])) return els[i].getAttribute('data-action');
    return null;
  }
  function activate(action) {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('[data-action]'), i;
    if (action === 'appearance.bg' && top().id === 'appearance' && top().group === 'background') action = 'background.wallpaper';
    if (action === 'settings.appearance' && top().id === 'settings') action = 'settings.group.background';
    for (i = 0; i < els.length; i++) if (renderedAction(els[i]) && els[i].getAttribute('data-action') === action) { pointAt(els[i]); return true; }
    return false;
  }
  function pointAt(el) {
    var t = top(), v = V[t.id];
    norm();
    if (v.point) v.point(t, el.getAttribute('data-z'), +el.getAttribute('data-i'), el.getAttribute('data-id'));
    norm();
    render();
    syncRotation();
  }

  utilsEl.addEventListener('mouseover', function (ev) {
    var b = ev.target, t = top(), z, i;
    if (utilsEl.className.indexOf('quiet-utils') < 0 || t.lifted) return;
    while (b && b !== utilsEl && !(b.getAttribute && b.getAttribute('data-z'))) b = b.parentNode;
    if (!b || b === utilsEl || (ev.relatedTarget && b.contains(ev.relatedTarget))) return;
    z = b.getAttribute('data-z'); i = Number(b.getAttribute('data-i'));
    if ((t.id !== 'home' || z !== 'util') && (t.id !== 'arrange' || z !== 'ctl')) return;
    if (t.f.zone === z && t.f.u === i) return;
    t.f.zone = z; t.f.u = i;
    if (z === 'util') S.lastUtil = i;
    render();
  });
  stage.addEventListener('click', function (ev) {
    var el = ev.target;
    while (el && el !== stage && !(el.getAttribute && el.getAttribute('data-z'))) el = el.parentNode;
    focusStage();
    if (S.saver) { stopSaver(); return; }
    saverReset();
    if (!el || el === stage) return;
    pointAt(el);
  });
  var heldKeys = {};
  document.addEventListener('keydown', function (ev) {
    var code = ev.keyCode, k = KEYS[code] || (top().id === 'pin' && (code >= 48 && code <= 57 || code >= 96 && code <= 105) ? 'd' + (code >= 96 ? code - 96 : code - 48) : '');
    if (code === 9) { ev.preventDefault(); return; }
    if (!k || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    ev.preventDefault();
    if (S.saver) { if (!ev.repeat) stopSaver(); return; } // the first press only wakes Shore
    saverReset();
    if (S.idleHidden) { idleReset(); return; } // the first press only brings the controls back
    idleReset();
    if (k === 'ok' || k === 'back') { if (ev.repeat || heldKeys[code]) return; heldKeys[code] = true; }
    // On a Home app tile or an adjustable Smart home chip, OK acts on release: held for LONG_OK it opens the tile's quick actions or the chip's controls instead.
    var held = k === 'ok' && holdAction();
    if (held) { clearTimeout(longOk.timer); longOk = { code: code, timer: setTimeout(function () { longOk.timer = 0; held(); }, LONG_OK) }; return; }
    press(k);
  });
  document.addEventListener('keyup', function (ev) {
    delete heldKeys[ev.keyCode];
    if (longOk.timer && ev.keyCode === longOk.code) { clearTimeout(longOk.timer); longOk.timer = 0; press('ok'); }
  });
  window.addEventListener('blur', function () { heldKeys = {}; });
  window.addEventListener('focus', function () { release(); focusStage(); after(); updateClock(); });
  document.addEventListener('visibilitychange', function () {
    heldKeys = {};
    if (document.hidden) { pauseRotation(); clearTimeout(clockTimer); VIDEO.pause(); if (S.saver && !DREAM) stopSaver(); clearTimeout(saverTimer); saverTimer = 0; syncAwake(); if (HA) { HA.camera.hangup(); if (top().id === 'hacam') pop(); } }
    else { shelfAsked = ''; release(); after(); updateClock(); focusStage(); saverReset(); pollPlaying(); }
  });
  window.addEventListener('resize', fit);

  /* Readable browser checks use the real state and actions, without fake outcomes. */
  var NAV = { left: 'left', right: 'right', up: 'up', down: 'down', ok: 'ok', enter: 'ok', back: 'back', escape: 'back' };
  QA.state = function () {
    var out = serialise(S.c), t = top(), item = t.id === 'appearance' ? detailLocation(t).item : null;
    out.committed = S.c; out.shown = S.shown; out.pending = S.pending; out.view = t.id; out.selected = S.sel;
    out.focusAction = focusedAction(); out.writes = S.writes; out.failedWrites = S.failed; out.error = S.err;
    out.catalog = { loading: catalog.loading, loaded: catalog.loaded, error: catalog.error, ids: ALPHA.slice() };
    out.fonts = { available: LOOK_VALUES.font.slice(), loaded: Object.keys(fontMetrics).filter(function (id) { return !fontMetrics[id].fallback; }), baselineFallback: !!(fontMetrics.manrope && fontMetrics.manrope.fallback), error: S.lookError && S.lookError.type === 'font' ? S.lookError : null };
    out.rotation = { activeMs: activeMs + (activeSince ? Date.now() - activeSince : 0), active: !!activeSince };
    out.draft = t.lifted ? { id: t.lifted.id, order: t.lifted.order.slice() } : null;
    out.settingsGroup = t.id === 'wallpaper' ? 'wallpaper' : t.id === 'appearance' ? t.group : null;
    out.focusedChoice = item && item.axis ? { axis: item.axis, value: item.value, action: item.action, disabled: item.disabled } : null;
    out.candidate = out.focusedChoice ? { axis: item.axis, value: item.value, action: item.action, pending: !!S.pending, pendingTarget: S.pending ? S.pending.target : null } : null;
    out.wallpaperPicker = t.id === 'wallpaper' ? { candidate: WALLS[t.i].id, applied: S.c.wall, shown: S.wallShown, pending: t.previewDue || S.wallPending,
      queuedApplying: !!t.applyPending, applyPending: t.applyPending, failed: t.failedId, zone: t.f.zone, top: t.top, visible: WALL_VISIBLE, backdrop: IMG.bg.src } : null;
    out.undo = S.undo.map(function (u) { return u.label; }); out.storageOk = storageOk;
    return JSON.parse(JSON.stringify(out));
  };
  QA.where = function () {
    var action = focusedAction(), active = stage.querySelectorAll('.is-focus[data-action]'), count = 0, name = '';
    Array.prototype.forEach.call(active, function (el) { if (renderedAction(el)) { count++; if (el.getAttribute('data-action') === action) name = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim(); } });
    return { view: top().id, settingsGroup: top().id === 'wallpaper' ? 'wallpaper' : top().id === 'appearance' ? top().group : null, focus: name, focusAction: action, focusCount: count, wallpaper: S.wallShown, zone: top().f.zone || null };
  };
  QA.ready = function () { return fontsReady && !S.pending && !!S.shown && S.shown.bg === S.c.bg && S.shown.wall === S.c.wall && S.shown.font === S.c.font; };
  QA.nav = function () { var keys = arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments); keys.forEach(function (key) { if (!NAV[key]) throw new Error('Unknown key'); press(NAV[key]); }); return QA.state(); };
  QA.look = function (patch) { setLook(patch, {}); return QA.state(); };
  QA.scene = function (name) { if (['home', 'apps', 'settings', 'appearance', 'editor'].indexOf(name) < 0) throw new Error('Unknown view'); goScene(name); return QA.state(); };
  QA.activate = function (action) { return activate(action) ? QA.state() : null; };
  QA.news = function (items) { newsForced = items || null; newsIdx = 0; newsTick(false); return capNews.textContent; };
  /* Made-up Home Assistant areas and states, so the add-on can be checked without a server; null restores the real source. */
  QA.homeAssistant = function (fake) { if (HA) HA.qa(fake || null); render(); return !!(HA && HA.available()); };
  QA.weatherFx = function (kind) { fxForced = kind || ''; render(); return stage.className.indexOf(' wx-') >= 0; };
  QA.saver = function (on) { if (on === true) startSaver(); else if (on === false) stopSaver(); else if (on === 'next' && S.saver) nextSaverPhoto(); return { on: S.saver, scheduled: !!saverTimer, awake: awakeOn, photo: saverSrc }; };
  QA.actions = function () { var view = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl; return Array.prototype.filter.call(view.querySelectorAll('[data-action]'), renderedAction).map(function (el) { return el.getAttribute('data-action'); }); };

  /* ---------- Start ---------- */
  cueL.innerHTML = icon('left'); cueR.innerHTML = icon('right');
  initialise();
  if (FrameDevice.onInputs) { FrameDevice.onInputs(refreshInputs); refreshInputs(); }
  if (WEATHER) WEATHER.onChange(function () { if (S.c.cweather === 'on' && (top().id === 'home' || isSettingsDetail(top()))) renderCaption(top(), homeState(top())); if (S.c.wfx === 'on') render(); });
  if (NOWPLAYING) { pollPlaying(); setInterval(pollPlaying, 5000); }
  if (UPDATE) { S.update = UPDATE.info(); UPDATE.onChange(function () { S.update = UPDATE.info(); if (isSettingsDetail(top()) || top().id === 'settings') render(); }); }
  if (PHONE) { S.phone = PHONE.info(); PHONE.onChange(function (count) { S.phone.count = count; if (WEATHER && S.c.cweather === 'on') WEATHER.refresh(false); if (isSettingsDetail(top()) || top().id === 'settings') render(); }); }
  if (REMOTE) {
    REMOTE.onLearned(remoteLearned);
    REMOTE.onChange(function () { refreshRemote(); if (top().id === 'appearance') render(); });
    refreshRemote();
  }
  if (ONLINE) { ONLINE.onChange(onlineChanged); ONLINE.select(S.c.source, false); }
  S.intro = STARTUP && !reducedMotion() ? 'pre' : '';
  setLook({}, { transient: true, startup: true });
  norm(); render(); fit(); focusStage(); updateClock(); syncRotation();
  if (S.firstRun) { openMessage('welcome'); render(); }
  try { if (sessionStorage.getItem('shore.restored')) { sessionStorage.removeItem('shore.restored'); openMessage('restored'); render(); } } catch (e) { }
  window.CleanFrameSaver = function () { if (!musicShowing()) startSaver(); };
  /* The remote's Home button: back to Home from Settings, All apps or the music view, unsaved previews dropped. */
  window.CleanFrameHomePressed = function () { if (!S.saver && top().id !== 'home') goScene('home'); };
  if (DREAM || SAVER_API && SAVER_API.requested()) startSaver();
  startupReady();
})();
