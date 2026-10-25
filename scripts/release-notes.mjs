#!/usr/bin/env node
// Writes the GitHub release text for a keyless Shore APK.
// Usage: node scripts/release-notes.mjs <version> [apk] > notes.md
//
// The notes are written for people installing Shore, not for developers. Commit messages supply the copy:
//   Release-title: Mix your wallpaper sources        (optional headline for the release)
//   Release: Tick as many sources as you like…       (one user-facing line each; any number)
//   Release-image: docs/images/tcl/online.jpg        (optional screenshot; defaults to Home)
// A commit that changes the app but has no Release: lines contributes its subject instead.
// scripts/release-copy.json can supply the same copy for a commit after the fact, keyed by its short hash,
// so wording can be fixed without rewriting history.
// Commits that only touch the website, docs or tooling stay in the folded changelog.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

const [version = 'dev', apk] = process.argv.slice(2);
const repo = process.env.GITHUB_REPOSITORY || 'taynotfound/shore';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const head = git('rev-parse', 'HEAD');

// Previous release: the newest v0.8.* tag before this commit.
let previous = '';
try { previous = git('describe', '--tags', '--abbrev=0', '--match', 'v0.8.*', 'HEAD^'); } catch { /* first release */ }
const range = previous ? [`${previous}..HEAD`] : ['-n', '15', 'HEAD'];

const copy = existsSync(new URL('release-copy.json', import.meta.url)) ? JSON.parse(readFileSync(new URL('release-copy.json', import.meta.url), 'utf8')) : {};
const SEP = '\u001e', END = '\u001f';
const commits = git('log', ...range, `--pretty=format:%H${SEP}%s${SEP}%b${SEP}%P${END}`)
  .split(END).map((c) => c.trim()).filter(Boolean).map((c) => {
    const [sha, subject, body = '', parents = ''] = c.split(SEP);
    const lines = body.split('\n');
    const pick = (key) => lines.filter((l) => l.startsWith(key + ':')).map((l) => l.slice(key.length + 1).trim()).filter(Boolean);
    const files = git('show', '--name-only', '--pretty=format:', sha).split('\n').filter(Boolean);
    const extra = copy[sha.slice(0, 7)] || {};
    return { sha, merge: parents.trim().split(' ').length > 1, subject: subject.trim(), title: extra.title || pick('Release-title')[0], notes: extra.notes || pick('Release'), image: extra.image || pick('Release-image')[0], files };
  });

const onTv = (f) => f.startsWith('app/') || (f.startsWith('android/') && !f.includes('/companion/'));
const onPhone = (f) => f.includes('/companion/');
const appChange = (c) => !c.merge && (c.notes.length > 0 || c.files.some((f) => onTv(f) || onPhone(f))); // merges only repeat their branch's commits
const app = commits.filter(appChange);

const raw = (path) => `https://raw.githubusercontent.com/${repo}/${head}/${path}`;
const asset = `shore-${version}.apk`;
const download = `https://github.com/${repo}/releases/download/v${version}/${asset}`;
const out = [];

// Branded header. Artwork is pinned to this commit, so old releases keep what they shipped with.
out.push('<div align="center">', '',
  `<img src="${raw('docs/brand/banner.gif')}" width="100%" alt="Shore: a calm home screen for Google TV">`, '',
  `[Website](https://taynotfound.github.io/shore/) · [Guide](https://github.com/${repo}#readme) · [Phone companion](https://github.com/${repo}#phone-companion) · [All releases](https://github.com/${repo}/releases)`, '',
  '</div>', '');

if (app.length) {
  const title = app.map((c) => c.title).find(Boolean) || (app.length === 1 ? app[0].subject : `What’s new in Shore ${version}`);
  const items = app.flatMap((c) => c.notes.length ? c.notes : [c.subject]);
  out.push(`## ${title}`, '');
  items.forEach((n) => out.push(`- ${n}`));
  const image = app.map((c) => c.image).find(Boolean) || 'docs/images/tcl/home.jpg';
  out.push('', `<img src="${raw(image)}" width="100%" alt="Shore on a TCL TV">`, '');
} else {
  const parts = [...new Set(commits.flatMap((c) => c.files.map((f) =>
    f.startsWith('site/') ? 'the website' : f.startsWith('docs/') || f.endsWith('.md') ? 'the guides' : 'how releases are built')))];
  out.push('## Behind the scenes', '',
    `Nothing changes on your TV in this build. It only updates ${list(parts)}, so you can skip it: the next app update includes everything.`, '');
}

function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

let size = '';
if (apk && existsSync(apk)) size = ` · ${(statSync(apk).size / 1048576).toFixed(1)} MB`;
out.push('### Get it', '',
  `**[⬇ Download ${asset}](${download})**${size}`, '',
  '- **Already using Shore?** Install it over your current version. Settings, photos and your Home layout stay.',
  `- **New to Shore?** Follow the [install guide](https://github.com/${repo}#install): sideload the APK with Downloader or \`adb install\`, then make Shore your Home screen.`, '');

out.push('<details>', '<summary><b>Free build, no accounts, no keys</b></summary>', '',
  'Release APKs contain no API keys. Almost everything works straight away:', '',
  '| Works right away | Needs a build from source with your own keys |',
  '| --- | --- |',
  '| Weather, Now Playing with album art, screensaver, phone companion, your own photos | Unsplash themes |',
  '| NASA, Bing, Wikimedia and Picsum wallpapers, Shore’s own wallpapers and animated loops | Pexels and Klipy animated wallpapers |',
  '|  | Top Shelf recommendations |', '');
if (apk && existsSync(apk)) out.push(`SHA-256 of \`${asset}\`: \`${createHash('sha256').update(readFileSync(apk)).digest('hex')}\``, '');
out.push('</details>', '');

const n = commits.length;
out.push('<details>', `<summary><b>Changelog</b> (${n} commit${n === 1 ? '' : 's'}${previous ? ' since ' + previous : ''})</summary>`, '');
commits.forEach((c) => out.push(`- ${c.subject} ([\`${c.sha.slice(0, 7)}\`](https://github.com/${repo}/commit/${c.sha}))`));
if (previous) out.push('', `[Compare ${previous}…v${version}](https://github.com/${repo}/compare/${previous}...v${version})`);
out.push('', '</details>');

process.stdout.write(out.join('\n') + '\n');
