// Development only. Measures what Shore costs a slow TV, and what each feature adds on top.
// Local Chromium with CPU throttling: a reproducible comparison, not a TV measurement (docs/performance.md).
//
//   node scripts/bench.mjs                      every feature on the "potato" profile (6x CPU slowdown)
//   node scripts/bench.mjs --profile tv         4x slowdown instead
//   node scripts/bench.mjs --only base,drift    some features
//   node scripts/bench.mjs --root ../old-shore  measure another checkout (before/after)
//   node scripts/bench.mjs --runs 3 --out .local/qa/bench/after.json
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = fileURLToPath(new URL('../', import.meta.url));
const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : fallback; };
const root = resolve(arg('root', here)) + '/';
const PROFILES = { potato: { cpu: 6, viewport: { width: 1280, height: 720 } }, brick: { cpu: 20, viewport: { width: 1280, height: 720 } }, tv: { cpu: 4, viewport: { width: 1920, height: 1080 } } };
const profileName = arg('profile', 'potato'), profile = PROFILES[profileName];
const runs = +arg('runs', 2), only = arg('only', '') ? arg('only').split(',') : null;
const out = resolve(arg('out', here + '.local/qa/bench/' + profileName + '.json'));
const IDLE_MS = +arg('idle', 10000), KEY_GAP = 260;

const DOCK = ['stremio', 'netflix', 'disneyplus', 'youtube', 'appletv', 'primevideo', 'abciview', 'sbs', 'applemusic'];
const BASE = { bg: 'photo', layout: 'dock', apps: 'both', controls: 'both', focus: 'glass', material: 'soft', motion: 'still', perf: 'full' };
// Fake data for features that normally need the Android shell or a server. Nothing leaves the machine.
const HA_FAKE = { areas: [{ name: 'Living room', ids: ['light.lamp', 'switch.tv', 'sensor.t', 'sensor.h'] }, { name: 'Kitchen', ids: ['light.k1', 'light.k2', 'fan.k'] }],
  states: { 'light.lamp': { s: 'on', n: 'Lamp', d: 'light' }, 'switch.tv': { s: 'off', n: 'TV plug', d: 'switch' }, 'sensor.t': { s: '21.5', n: 'Temperature', d: 'sensor', u: '°C', c: 'temperature' }, 'sensor.h': { s: '48', n: 'Humidity', d: 'sensor', u: '%', c: 'humidity' },
    'light.k1': { s: 'off', n: 'Kitchen', d: 'light' }, 'light.k2': { s: 'on', n: 'Strip', d: 'light' }, 'fan.k': { s: 'off', n: 'Fan', d: 'fan' } } };
const NEWS = [{ title: 'A calm headline for the benchmark', source: 'Bench' }, { title: 'Another headline that rotates', source: 'Bench' }];
const DAYS = [{ date: '2026-10-25', icon: 'sun', hi: 21, lo: 12 }, { date: '2026-10-26', icon: 'rain', hi: 17, lo: 10 }, { date: '2026-10-27', icon: 'cloud', hi: 18, lo: 11 }];

// id, label, look patch on top of BASE, optional in-page setup (string), Home navigation keys.
const FEATURES = [
  { id: 'base', name: 'Default look (Photo, Dock, Glass, Soft)' },
  { id: 'potato', name: 'Performance: Potato', look: { perf: 'potato' } },
  { id: 'balanced', name: 'Performance: Balanced', look: { perf: 'balanced' } },
  { id: 'auto', name: 'Performance: Auto (what it picks after 24 keys)', look: { perf: 'auto' } },
  { id: 'dark', name: 'Dark background (no photo)', look: { bg: 'dark' } },
  { id: 'list', name: 'List layout', look: { layout: 'list' }, list: true },
  { id: 'shelf', name: 'Shelf layout', look: { lstyle: 'shelf' } },
  { id: 'type', name: 'Type focus (no glass)', look: { focus: 'type' } },
  { id: 'frost', name: 'Frost material', look: { material: 'frost' } },
  { id: 'tint', name: 'Clear tint material', look: { material: 'tint' } },
  { id: 'icons', name: 'Icons-only apps', look: { apps: 'icons' } },
  { id: 'drift', name: 'Background motion: Drift', look: { motion: 'drift' } },
  { id: 'night', name: 'Night mode (always)', look: { night: 'always' } },
  { id: 'seconds', name: 'Clock with seconds', look: { csec: 'on' } },
  { id: 'date', name: 'Date under the clock', look: { cdate: 'on' } },
  { id: 'tintwarm', name: 'Accent tint', look: { tint: 'warm' } },
  { id: 'idle', name: 'Hide controls when idle', look: { idle: '1' } },
  { id: 'wfx', name: 'Weather effects (rain)', look: { wfx: 'on', cweather: 'on' }, setup: 'ShoreQA.weatherFx("rain")' },
  { id: 'storm', name: 'Weather effects (storm)', look: { wfx: 'on', cweather: 'on' }, setup: 'ShoreQA.weatherFx("storm")' },
  { id: 'snow', name: 'Weather effects (snow)', look: { wfx: 'on', cweather: 'on' }, setup: 'ShoreQA.weatherFx("snow")' },
  { id: 'news', name: 'Headlines', look: { cnews: 'on' }, setup: 'ShoreQA.news(' + JSON.stringify(NEWS) + ')' },
  { id: 'widgets', name: 'Widgets row', look: { cwidget: 'on', cweather: 'on' }, setup: 'ShoreQA.days = ' + JSON.stringify(DAYS) + '; ShoreQA.look({})' },
  { id: 'ha', name: 'Home Assistant add-on', look: { aha: 'on' }, setup: 'ShoreQA.homeAssistant(' + JSON.stringify(HA_FAKE) + ')' },
  { id: 'adblock', name: 'Pi-hole and AdGuard add-on', look: { aad: 'on' }, setup: 'ShoreQA.adBlock({ total: 1000, blocked: 124 })' },
  { id: 'inputs', name: 'Three HDMI inputs on Home', setup: 'ShoreQA.inputs([{ id: "hdmi1", name: "PlayStation 5", state: 0 }, { id: "hdmi2", name: "Apple TV", state: 0 }, { id: "hdmi3", name: "Soundbar", state: 0 }])' },
  { id: 'saver', name: 'Screensaver showing', look: { saver: '5' }, setup: 'ShoreQA.saver(true)', idleOnly: true },
  { id: 'saverstill', name: 'Screensaver, still photos', look: { saver: '5', svmotion: 'still' }, setup: 'ShoreQA.saver(true)', idleOnly: true }
];

function harness({ seed }) {
  if (!sessionStorage.getItem('__bench_seeded')) { localStorage.clear(); localStorage.setItem('cleanframe.home.v1', JSON.stringify(seed)); sessionStorage.setItem('__bench_seeded', '1'); }
  window.ShoreQA = { minuteMs: 60000 };
  const primary = [['IkWsFHtOY9.Stremio', 'Stremio'], ['org.tizen.netflix-app', 'Netflix'], ['MCmYXNxgcu.DisneyPlus', 'Disney+'], ['9Ur5IzDKqV.TizenYouTube', 'YouTube'], ['com.samsung.tv.aria-video', 'Apple TV'],
    ['org.tizen.primevideo', 'Prime Video'], ['mWK87Xghap.ABCiview', 'ABC iview'], ['OyE7OuxlUi.SBSOnDemand', 'SBS On Demand'], ['org.tizen.apple.apple-music', 'Apple Music']];
  const catalogue = primary.map(([id, name]) => ({ id, name, show: true, iconPath: '' }));
  for (let i = 0; i < 14; i++) catalogue.push({ id: 'Qa12345678.Stream' + i, name: 'Streaming app ' + (i + 1), show: true, iconPath: '' });
  window.tizen = { application: { getAppsInfo(ok) { setTimeout(() => ok(catalogue), 0); }, launch(id, ok) { setTimeout(ok, 0); } } };
  // Input to the next painted frame, for every key: keydown (capture, before Shore), then the frame after the handler's work.
  window.__lat = [];
  window.addEventListener('keydown', () => {
    const t0 = performance.now();
    requestAnimationFrame(() => { const ch = new MessageChannel(); ch.port1.onmessage = () => window.__lat.push(performance.now() - t0); ch.port2.postMessage(0); });
  }, true);
}

function startPreview() {
  const server = spawn('python3', [join(root, 'scripts/preview.py'), '--port', '0', '--public-fonts'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((ok, fail) => {
    let text = '';
    const timer = setTimeout(() => fail(Error('Preview startup timed out')), 10000);
    server.on('exit', code => fail(Error('Preview exited ' + code)));
    server.stdout.on('data', chunk => { text += chunk; const m = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (m) { clearTimeout(timer); ok({ server, base: m[0] }); } });
  });
}
const pct = (list, p) => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const round = n => Math.round(n * 10) / 10;

async function measure(browser, base, feature) {
  const context = await browser.newContext({ viewport: profile.viewport });
  try { return await measureIn(context, base, feature); } finally { await context.close().catch(() => {}); }
}
async function measureIn(context, base, feature) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const seed = { dock: DOCK, wallpaper: 'misty', mode: 'fixed', lastApp: 'netflix', look: { ...BASE, ...(feature.look || {}) } };
  await page.addInitScript(harness, { seed });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
  const types = {}, sizes = {};
  cdp.on('Network.responseReceived', e => { types[e.requestId] = e.type; });
  cdp.on('Network.loadingFinished', e => { sizes[e.requestId] = e.encodedDataLength; });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const t0 = Date.now();
  await page.goto(base + '/home/', { waitUntil: 'commit', timeout: 25000 });
  await page.waitForFunction(() => window.ShoreQA && ShoreQA.ready && ShoreQA.ready(), null, { timeout: 60000, polling: 50 });
  const readyMs = Date.now() - t0;
  const atReady = await metrics();
  const bytes = { script: 0, css: 0, image: 0, font: 0, other: 0 };
  for (const id in sizes) { const t = types[id]; const k = t === 'Script' ? 'script' : t === 'Stylesheet' ? 'css' : t === 'Image' ? 'image' : t === 'Font' ? 'font' : 'other'; bytes[k] += sizes[id]; }
  if (feature.setup) {
    const ok = await page.evaluate(async src => { try { await eval(src); return true; } catch (e) { return String(e); } }, feature.setup);
    if (ok !== true) errors.push('setup: ' + ok);
    await page.waitForFunction(() => ShoreQA.ready(), null, { timeout: 30000 });
  }
  await page.waitForTimeout(2500); // the intro, add-on start, late images
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage');
  const settled = await metrics();
  const page0 = await page.evaluate(() => ({ nodes: document.getElementsByTagName('*').length,
    animations: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1,
    images: [...new Set([...document.images].filter(i => i.currentSrc).map(i => i.currentSrc))].length,
    // What the setup produced, so a feature that silently failed to switch on shows up in the report.
    shows: [document.getElementById('stage').className.match(/\b(wx-\w+|is-saver|is-night|perf-\w+|mo-drift)\b/g) || [], document.querySelectorAll('#utils .u').length + ' controls', (document.getElementById('caption').textContent || '').slice(0, 80)].join(' | ') }));
  // Idle on Home: the clock, timers, animations.
  const i0 = await metrics(); await page.waitForTimeout(IDLE_MS); const i1 = await metrics();
  const result = { id: feature.id, name: feature.name, readyMs,
    startup: { taskMs: round(atReady.TaskDuration * 1000), scriptMs: round(atReady.ScriptDuration * 1000), styleMs: round(atReady.RecalcStyleDuration * 1000), layoutMs: round(atReady.LayoutDuration * 1000), bytes },
    memory: { heapMB: round(settled.JSHeapUsedSize / 1048576), nodes: page0.nodes, decodedImages: page0.images },
    idle: { taskMsPer10s: round((i1.TaskDuration - i0.TaskDuration) * 1000 * 10000 / IDLE_MS), runningAnimations: page0.animations },
    shows: page0.shows, errors };
  if (!feature.idleOnly) {
    const keys = feature.list ? ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowUp'] : ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft'];
    await page.evaluate(() => { window.__lat = []; });
    const k0 = await metrics();
    for (let r = 0; r < 4; r++) for (const key of keys) { await page.keyboard.press(key); await page.waitForTimeout(KEY_GAP); }
    const k1 = await metrics();
    const lat = await page.evaluate(() => window.__lat);
    const n = keys.length * 4, idleShare = (i1.TaskDuration - i0.TaskDuration) / IDLE_MS * KEY_GAP; // idle work that happened anyway
    result.keys = { count: n, mainThreadMsPerKey: round(((k1.TaskDuration - k0.TaskDuration) / n - idleShare) * 1000),
      styleMsPerKey: round((k1.RecalcStyleDuration - k0.RecalcStyleDuration) * 1000 / n), layoutMsPerKey: round((k1.LayoutDuration - k0.LayoutDuration) * 1000 / n),
      layoutsPerKey: round((k1.LayoutCount - k0.LayoutCount) / n), latencyP50Ms: round(pct(lat, .5)), latencyP95Ms: round(pct(lat, .95)) };
    result.autoTier = await page.evaluate(() => ShoreQA.tierSamples ? ShoreQA.tierSamples([]) : null);
    const where = await page.evaluate(() => ShoreQA.where());
    if (where.focusCount !== 1) errors.push('focus count ' + where.focusCount);
  }
  return result;
}
// Median of each number across runs.
function combine(list) {
  const pick = path => list.map(r => path.split('.').reduce((o, k) => o && o[k], r)).filter(v => typeof v === 'number');
  const out = JSON.parse(JSON.stringify(list[0]));
  (function walk(o, prefix) { for (const k in o) { const p = prefix ? prefix + '.' + k : k; if (typeof o[k] === 'number') o[k] = round(pct(pick(p), .5)); else if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) walk(o[k], p); } })(out, '');
  out.errors = [...new Set(list.flatMap(r => r.errors))];
  return out;
}
function appBytes() {
  let js = 0, css = 0;
  (function walk(dir) { for (const f of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, f.name); if (f.isDirectory()) walk(p); else if (/\.js$/.test(f.name) && !/i18n\//.test(p) && !/assets\//.test(p)) js += statSync(p).size; else if (/\.css$/.test(f.name)) css += statSync(p).size; } })(join(root, 'app'));
  return { js, css };
}

const { server, base } = await startPreview();
const browser = await chromium.launch(process.env.CLEANFRAME_CHROMIUM ? { headless: true, executablePath: process.env.CLEANFRAME_CHROMIUM } : { headless: true });
const report = { profile: profileName, cpuSlowdown: profile.cpu, viewport: profile.viewport, root, runs, sourceBytes: appBytes(), startedAt: new Date().toISOString(), features: [] };
try {
  for (const f of FEATURES.filter(f => !only || only.includes(f.id))) {
    const list = [];
    for (let i = 0; i < runs; i++) {
      // One retry: a stalled local page load is not a measurement.
      try { list.push(await measure(browser, base, f)); }
      catch (e) { try { list.push(await measure(browser, base, f)); } catch (e2) { console.log(f.id + ' run ' + (i + 1) + ' failed: ' + e2.message.split('\n')[0]); } }
    }
    if (!list.length) { report.features.push({ id: f.id, name: f.name, errors: ['no successful run'] }); continue; }
    const r = combine(list);
    report.features.push(r);
    console.log([r.id.padEnd(10), 'ready', r.readyMs + 'ms', 'startup', r.startup.taskMs + 'ms', 'js', Math.round(r.startup.bytes.script / 1024) + 'KB',
      'idle', r.idle.taskMsPer10s + 'ms/10s', 'anim', r.idle.runningAnimations, r.keys ? 'key ' + r.keys.mainThreadMsPerKey + 'ms p95 ' + r.keys.latencyP95Ms + 'ms' : '', r.autoTier && r.id === 'auto' ? 'auto→' + r.autoTier.tier + ' (' + r.autoTier.ms + 'ms)' : '', r.errors.length ? 'ERR ' + r.errors.join('; ') : ''].join(' '));
  }
} finally {
  await browser.close(); server.kill(); await once(server, 'exit');
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log('Report: ' + out);
