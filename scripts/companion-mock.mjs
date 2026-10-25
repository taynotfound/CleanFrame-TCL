// The real phone companion page (android/.../assets-android/companion) with a made-up TV behind it.
// Used by companion-shots.mjs (screenshots) and check-site.mjs (UI checks). No TV is contacted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'android/app/src/main/assets-android/companion');
const ASSETS = path.join(ROOT, 'app/assets');
const ORIGIN = 'http://shore-tv.local:8080';
const KEY = 'demo-pairing-key-0123456789abcdef';

export const WALLS = ['bridge', 'cove', 'alpine', 'amber', 'forest', 'goldcoast'];
export const wall = (id, kind) => path.join(ASSETS, 'wallpapers', id + (kind ? '-' + kind : '') + '.jpg');
const ONOFF = [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }];
const opts = (...labels) => labels.map((l) => ({ value: l.toLowerCase().replace(/\W+/g, '-'), label: l }));

export const info = (extra) => Object.assign({
  count: 5, max: 30, photos: ['harbour.jpg', 'dunes.jpg', 'lake.jpg', 'city.jpg', 'ridge.jpg'],
  place: 'Berlin', feed: '', calendar: '', install: '', ha: { enabled: false }, adblock: { enabled: false },
}, extra || {});

export const addons = () => info({
  ha: { enabled: true, configured: true, url: 'http://homeassistant.local:8123', status: 'ok' },
  adblock: { enabled: true, configured: true, url: 'http://pi.hole', user: '', kind: 'pihole', status: 'ok' },
});

export const settings = {
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

const FILES = { '/': 'index.html', '/index.html': 'index.html', '/app.css': 'app.css', '/app.js': 'app.js', '/icon-192.png': 'icon-192.png', '/manifest.webmanifest': 'manifest.webmanifest' };

export function launch() {
  return chromium.launch(process.env.CLEANFRAME_CHROMIUM ? { executablePath: process.env.CLEANFRAME_CHROMIUM } : {});
}

/** Opens the companion paired to the made-up TV. `calls` collects every API request as "POST set?axis=…". */
export async function openCompanion(browser, { width = 390, height = 844, scale = 2, state = info() } = {}) {
  const calls = [];
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, colorScheme: 'dark', serviceWorkers: 'block' });
  await context.addInitScript((k) => { try { localStorage.setItem('shore.companion.key', k); } catch (e) { /* none */ } }, KEY);
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await context.route(ORIGIN + '/**', (route) => {
    const request = route.request(), u = new URL(request.url());
    if (u.pathname.startsWith('/api/')) {
      const p = u.pathname.slice(5);
      calls.push(request.method() + ' ' + p + u.search);
      if (p === 'settings') return route.fulfill(json(settings));
      if (p === 'wallpaper') return route.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall('bridge')) });
      if (p.startsWith('thumb/')) {
        const id = decodeURIComponent(p.slice(6));
        return WALLS.includes(id) ? route.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall(id, 'thumb')) }) : route.fulfill({ status: 404, body: '' });
      }
      if (p.startsWith('photo/')) return route.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(wall(WALLS[(state.photos.indexOf(p.slice(6)) + 1) % WALLS.length], 'thumb')) });
      return route.fulfill(json(state));
    }
    if (FILES[u.pathname]) return route.fulfill({ path: path.join(PAGE, FILES[u.pathname]) });
    if (/\.woff2$/.test(u.pathname)) return route.fulfill({ path: path.join(ASSETS, path.basename(u.pathname)) });
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(ORIGIN + '/');
  await page.waitForSelector('#paired:not([hidden])');
  return { context, page, calls, errors };
}
