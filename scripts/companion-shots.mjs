// Phone screenshots of the real Shore Companion page, with invented data and no TV.
// Usage: node scripts/companion-shots.mjs   (writes site/shots/companion-*.jpg)
import path from 'node:path';
import { ROOT, addons, info, launch, openCompanion, wall } from './companion-mock.mjs';

const OUT = path.join(ROOT, 'site/shots');
const SHOTS = [
  { name: 'companion', tab: 'photos', note: 'Photos' },
  { name: 'companion-settings', tab: 'tv', note: 'TV settings' },
  { name: 'companion-apps', tab: 'apps', note: 'Apps and inputs' },
  { name: 'companion-addons', tab: 'addons', note: 'Add-ons', addons: true },
  { name: 'crop', tab: 'photos', note: 'Crop', crop: true },
];

const browser = await launch();
for (const shot of SHOTS) {
  const { context, page } = await openCompanion(browser, { state: shot.addons ? addons() : info() });
  if (shot.tab !== 'photos') await page.click('.tabs [data-tab="' + shot.tab + '"]');
  if (shot.tab === 'tv') await page.waitForSelector('#tvGroups .group');
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
