// Phone screenshots of the real Shore Companion page, with invented data and no TV.
// Usage: node scripts/companion-shots.mjs   (writes site/shots/companion-*.jpg)
// The page and its fonts are served from the repository; /api/* is answered here.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'android/app/src/main/assets-android/companion');
const ASSETS = path.join(ROOT, 'app/assets');
const OUT = path.join(ROOT, 'site/shots');
const ORIGIN = 'http://shore-tv.local:8080';
const KEY = 'demo-pairing-key-0123456789abcdef';

const WALLS = ['bridge', 'cove', 'alpine', 'amber', 'forest', 'goldcoast'];
const wall = (id, kind) => path.join(ASSETS, 'wallpapers', id + (kind ? '-' + kind : '') + '.jpg');
const ONOFF = [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }];
const opts = (...labels) => labels.map((l) => ({ value: l.toLowerCase().replace(/\W+/g, '-'), label: l }));

const info = (extra) => Object.assign({
  count: 5, max: 30, photos: ['harbour.jpg', 'dunes.jpg', 'lake.jpg', 'city.jpg', 'ridge.jpg'],
  place: 'Berlin', feed: '', calendar: '', install: '', ha: { enabled: false }, adblock: { enabled: false },
}, extra || {});

const settings = {
  offline: false, cap: 9,
  labels: { start: 'Start the screensaver now', apps: 'Apps on Home', more: 'Other installed apps', inputs: 'Inputs' },
  groups: [
    { name: 'Look', items: [
      { id: 'wall', name: 'Wallpaper', kind: 'wall', value: 'bridge', options: WALLS.map((w) => ({ value: w, label: w[0].toUpperCase() + w.slice(1) })) },
      { id: 'layout', name: 'Layout', kind: 'choice', value: 'dock', options: opts('Dock', 'List', 'Shelf') },
      { id: 'drift', name: 'Drift', kind: 'toggle', value: 'on', options: ONOFF },
      { id: 'accent', name: 'Accent', kind: 'choice', value: 'warm', options: opts('Ivory', 'Warm', 'Sky', 'Mint') },
    ] },
    { name: 'When you’re away', items: [
      { id: 'night', name: 'Night mode', kind: 'choice', value: 'timer', options: opts('Off', 'Timer', 'Always') },
      { id: 'saver', name: 'Screensaver', kind: 'choice', value: '10', options: opts('Off', '5 min', '10 min', '15 min') },
    ] },
    { name: 'Clock and info', items: [{ id: 'weather', name: 'Weather', kind: 'toggle', value: 'on', options: ONOFF }] },
    { name: 'Shore', items: [{ id: 'perf', name: 'Performance', kind: 'choice', value: 'auto', options: opts('Auto', 'High end', 'Balanced', 'Potato') }] },
  ],
  home: ['Netflix', 'YouTube', 'Disney+', 'Apple TV', 'Spotify', 'Prime Video'].map((name, i) => ({ id: 'app.' + i, name })),
  others: ['Plex', 'Twitch', 'Kodi', 'VLC', 'Stremio', 'ARD Mediathek', 'ZDF', 'Waipu.tv'].map((name, i) => ({ id: 'more.' + i, name })),
  inputs: [{ id: 'hdmi1', name: 'PlayStation 5', cec: 'PlayStation 5' }, { id: 'hdmi2', name: 'Living room Mac', cec: 'HDMI 2' }],
};

function answer(url) {
  const p = new URL(url).pathname.replace(/^\/api\//, '');
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  if (p === 'settings') return json(settings);
  if (p === 'info') return json(state.info);
  if (p === 'wallpaper') return { status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall('bridge')) };
  if (p.startsWith('thumb/')) {
    const id = decodeURIComponent(p.slice(6));
    return WALLS.includes(id) ? { status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall(id, 'thumb')) } : { status: 404, body: '' };
  }
  if (p.startsWith('photo/')) {
    const i = state.info.photos.indexOf(p.slice(6));
    return { status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall(WALLS[(i + 1) % WALLS.length], 'thumb')) };
  }
  return json(state.info);
}
const state = { info: info() };

const SHOTS = [
  { name: 'companion', tab: 'photos', note: 'Photos' },
  { name: 'companion-settings', tab: 'tv', note: 'TV settings' },
  { name: 'companion-apps', tab: 'apps', note: 'Apps and inputs' },
  { name: 'companion-addons', tab: 'addons', note: 'Add-ons', addons: true },
  { name: 'crop', tab: 'photos', note: 'Crop', crop: true },
];

const browser = await chromium.launch(process.env.CLEANFRAME_CHROMIUM ? { executablePath: process.env.CLEANFRAME_CHROMIUM } : {});
const files = { '/': 'index.html', '/index.html': 'index.html', '/app.css': 'app.css', '/app.js': 'app.js', '/icon-192.png': 'icon-192.png', '/manifest.webmanifest': 'manifest.webmanifest' };
for (const shot of SHOTS) {
  state.info = info(shot.addons ? {
    ha: { enabled: true, configured: true, url: 'http://homeassistant.local:8123', status: 'ok' },
    adblock: { enabled: true, configured: true, url: 'http://pi.hole', user: '', kind: 'pihole', status: 'ok' },
  } : {});
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', serviceWorkers: 'block' });
  await context.addInitScript((k) => { try { localStorage.setItem('shore.companion.key', k); } catch (e) { /* none */ } }, KEY);
  await context.route(ORIGIN + '/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.startsWith('/api/')) return route.fulfill(answer(route.request().url()));
    if (files[u.pathname]) return route.fulfill({ path: path.join(PAGE, files[u.pathname]) });
    if (/\.woff2$/.test(u.pathname)) return route.fulfill({ path: path.join(ASSETS, path.basename(u.pathname)) });
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage();
  await page.goto(ORIGIN + '/');
  await page.waitForSelector('#paired:not([hidden])');
  if (shot.tab !== 'photos') await page.click('.tabs [data-tab="' + shot.tab + '"]');
  if (shot.tab === 'tv') await page.waitForSelector('#tvGroups .group');
  if (shot.type) await page.fill('#typeText', shot.type);
  if (shot.crop) {
    await page.setInputFiles('#files', wall('bridge'));
    await page.waitForSelector('#crop:not([hidden])');
    await page.waitForFunction(() => document.getElementById('cropImg').naturalWidth > 0);
    await page.fill('#cropZoom', '1.35');
    await page.dispatchEvent('#cropZoom', 'input');
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, shot.name + '.jpg'), type: 'jpeg', quality: 84 });
  console.log('wrote', shot.name + '.jpg', '·', shot.note);
  await context.close();
}
await browser.close();
