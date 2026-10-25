// UI checks for the website, the installable companion launcher and the phone companion page:
// no console errors or broken local files, no sideways scrolling on a phone, images with alt text,
// accessibility (axe, WCAG A/AA) and the companion's tabs and controls. No TV and no internet needed.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { ROOT, addons, launch, openCompanion } from './companion-mock.mjs';

// Assemble the site the way .github/workflows/pages.yml does.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shore-site-'));
fs.cpSync(path.join(ROOT, 'site'), dir, { recursive: true });
fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'docs/images/tcl'))) if (f.endsWith('.jpg')) fs.copyFileSync(path.join(ROOT, 'docs/images/tcl', f), path.join(dir, 'images', f));
for (const f of ['manrope.woff2', 'manrope-cyrillic.woff2', 'manrope-latin-ext.woff2']) fs.copyFileSync(path.join(ROOT, 'app/assets', f), path.join(dir, f));
for (const f of ['bridge.jpg', 'bridge-panel.jpg']) fs.copyFileSync(path.join(ROOT, 'app/assets/wallpapers', f), path.join(dir, f));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith(path.sep) || (fs.existsSync(p) && fs.statSync(p).isDirectory())) p = path.join(p, 'index.html');
  if (!p.startsWith(dir) || !fs.existsSync(p)) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', TYPES[path.extname(p)] || 'application/octet-stream');
  res.end(fs.readFileSync(p));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;

const failures = [];
let passed = 0;
const check = (name, ok, detail) => { if (ok) { passed++; } else { failures.push(name + (detail ? ': ' + detail : '')); console.error('FAIL', name, detail || ''); } };

async function axe(page, name) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  check(name + ': no serious accessibility violations', bad.length === 0, bad.map((v) => v.id + ' (' + v.nodes.length + ' nodes: ' + v.nodes[0].target.join(' ') + ')').join('; '));
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const browser = await launch();

// Website and the installable companion launcher.
for (const [url, label] of [['/', 'Website'], ['/app/', 'Companion launcher']]) {
  for (const [width, height] of [[360, 740], [768, 1024], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: 'light' });
    const page = await context.newPage();
    const errors = [], missing = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.status() + ' ' + r.url().slice(base.length)); });
    await page.goto(base + url, { waitUntil: 'load' });
    await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
    await page.waitForLoadState('networkidle');
    const tag = label + ' at ' + width + 'px';
    check(tag + ': no script errors', errors.length === 0, errors.join(' | '));
    check(tag + ': every local file loads', missing.length === 0, missing.join(', '));
    check(tag + ': no sideways scrolling', (await overflow(page)) <= 1, String(await overflow(page)));
    const noAlt = await page.evaluate(() => [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.getAttribute('src')));
    check(tag + ': every image has alt text', noAlt.length === 0, noAlt.join(', '));
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
    check(tag + ': no broken images', broken.length === 0, broken.join(', '));
    if (width === 1440) {
      check(tag + ': has a title, description and one h1', await page.evaluate(() => !!document.title && !!document.querySelector('meta[name=description]') && document.querySelectorAll('h1').length === 1));
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
      check(tag + ': in-page links point at something', links.length === 0, links.join(', '));
      const unsafe = await page.evaluate(() => [...document.querySelectorAll('a[target=_blank]')].filter((a) => !/noopener/.test(a.rel)).length);
      check(tag + ': external links use noopener', unsafe === 0, String(unsafe));
    }
    if (width !== 768) await axe(page, tag);
    await context.close();
  }
}

// The phone companion, paired to a made-up TV.
for (const [width, height] of [[360, 740], [412, 915]]) {
  const { context, page, calls, errors } = await openCompanion(browser, { width, height, scale: 1, state: addons() });
  const tag = 'Companion at ' + width + 'px';
  check(tag + ': shows the connected status', /Connected/.test(await page.textContent('#status')));
  check(tag + ': no sideways scrolling', (await overflow(page)) <= 1);
  await axe(page, tag + ' Photos');
  const tabs = [['tv', '#tab-tv'], ['apps', '#tab-apps'], ['keys', '#tab-keys'], ['addons', '#tab-addons'], ['photos', '#tab-photos']];
  for (const [name, panel] of tabs) {
    await page.click('.tabs [data-tab="' + name + '"]');
    await page.waitForTimeout(350);
    check(tag + ': ' + name + ' tab opens', await page.isVisible(panel));
    check(tag + ': ' + name + ' tab fits the screen', (await overflow(page)) <= 1, String(await overflow(page)));
    if (name !== 'photos') await axe(page, tag + ' ' + name);
  }
  await page.click('.tabs [data-tab="tv"]');
  await page.waitForSelector('#tvGroups .group');
  check(tag + ': TV settings list the groups', (await page.locator('#tvGroups details.group').count()) === 4);
  await page.click('#tvGroups .switch');
  await page.waitForTimeout(300);
  check(tag + ': a switch sends one setting', calls.some((c) => /^POST set\?axis=drift&value=off/.test(c)), calls.slice(-3).join(' | '));
  await page.click('#tvGroups .chip:text("List")');
  await page.waitForTimeout(300);
  check(tag + ': a choice sends its value', calls.some((c) => /^POST set\?axis=layout&value=list/.test(c)));
  await page.click('.tabs [data-tab="apps"]');
  await page.waitForSelector('#homeList li');
  check(tag + ': Apps lists Home and other apps', (await page.locator('#homeList li').count()) === 6 && (await page.locator('#otherList li').count()) === 8);
  await page.click('#homeList li:nth-child(2) button[aria-label^="up"]');
  await page.waitForTimeout(300);
  check(tag + ': moving an app up is sent', calls.some((c) => /^POST set\?axis=home\.up&value=app\.1/.test(c)), calls.slice(-3).join(' | '));
  await page.click('.tabs [data-tab="keys"]');
  await page.fill('#typeText', 'harbour');
  await page.waitForTimeout(500);
  check(tag + ': typing is sent to the TV', calls.some((c) => c === 'POST type'));
  check(tag + ': no script errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();
server.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(passed + ' checks passed; ' + failures.length + ' failure(s).');
if (failures.length) { console.error('\n' + failures.join('\n')); process.exit(1); }
