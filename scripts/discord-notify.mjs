#!/usr/bin/env node
// Posts GitHub activity to a Discord webhook as tidy embeds, run by .github/workflows/discord.yml.
//
//   push, pull requests, issues, comments, reviews, stars, forks, releases: one message each.
//   workflow_run: ONE digest per commit with the result of every CI workflow, sent by whichever workflow
//   finishes last. Scheduled and manual workflows only report when they fail.
//
// The webhook URL comes from the DISCORD_WEBHOOK_URL secret (never from the repository). Event text is
// untrusted: it is truncated, mentions are disabled and it is only ever sent as embed text.
// DISCORD_DRY_RUN=1 prints the payload instead of sending it.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const COLORS = { blue: 0x5865f2, green: 0x2ea043, red: 0xf85149, purple: 0xa371f7, yellow: 0xd29922, grey: 0x8b949e, gold: 0xf2c58b };
const WORKFLOWS_IN_DIGEST = new Set(['push', 'pull_request', 'pull_request_target']);
const SELF = 'Discord';
const RELEASE_WORKFLOW = 'Android TV APK';

export const clip = (text, max) => {
  const s = String(text == null ? '' : text).replace(/\r/g, '').trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
};
const line = (text, max) => clip(String(text == null ? '' : text).split('\n')[0], max);
// Discord markdown: keep user text from turning into links, mentions or formatting breakouts.
const plain = (text) => String(text == null ? '' : text).replace(/([\\`*_~|>[\]()@#:])/g, '\\$1');
const short = (sha) => String(sha || '').slice(0, 7);
const seconds = (ms) => (ms >= 60000 ? Math.floor(ms / 60000) + 'm ' + Math.round((ms % 60000) / 1000) + 's' : Math.round(ms / 1000) + 's');

function embed(base, extra) {
  return Object.assign({ timestamp: new Date().toISOString() }, base, extra || {});
}
function author(u) {
  return u && u.login ? { name: u.login, url: u.html_url, icon_url: u.avatar_url } : undefined;
}

/** Release notes are GitHub markdown with an HTML banner. Discord renders the markdown, so drop the HTML and cut at a line, not mid-link. */
export function releaseNotes(body, max) {
  const text = String(body == null ? '' : body).replace(/\r/g, '')
    .replace(/<div\b[\s\S]*?<\/div>/gi, '') // the banner and its link row
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max), at = cut.lastIndexOf('\n');
  return (at > max / 2 ? cut.slice(0, at) : cut.replace(/\s+\S*$/, '')).trimEnd() + '\n…';
}

function releaseEmbed(r, repo) {
  return embed({
    title: `🚀 ${clip(plain(r.name || r.tag_name), 200)} released`, url: r.html_url, color: COLORS.green, author: author(r.author),
    description: releaseNotes(r.body, 1800), footer: { text: repo },
  });
}

/** Pure: GitHub event -> Discord embed (or null to stay quiet). */
export function buildEmbed(name, e) {
  const repo = e.repository && e.repository.full_name;
  switch (name) {
    case 'push': {
      const ref = String(e.ref || '');
      const branch = ref.replace(/^refs\/(heads|tags)\//, '');
      const tag = ref.startsWith('refs/tags/');
      if (e.deleted) return embed({ title: `🗑️ ${tag ? 'Tag' : 'Branch'} deleted: ${branch}`, color: COLORS.grey, author: author(e.sender) });
      const commits = e.commits || [];
      if (tag) return embed({ title: `🏷️ Tag pushed: ${branch}`, url: `${e.repository.html_url}/releases/tag/${branch}`, color: COLORS.gold, author: author(e.sender) });
      if (!commits.length) return null;
      const lines = commits.slice(0, 6).map((c) => `[\`${short(c.id)}\`](${c.url}) ${plain(line(c.message, 80))}`);
      if (commits.length > 6) lines.push(`…and ${commits.length - 6} more`);
      return embed({
        title: `${e.forced ? '⚠️ Force-pushed' : '📦 Pushed'} ${commits.length} commit${commits.length === 1 ? '' : 's'} to ${branch}`,
        url: e.compare, description: lines.join('\n'), color: e.forced ? COLORS.yellow : COLORS.blue, author: author(e.sender),
        footer: { text: repo },
      });
    }
    case 'pull_request':
    case 'pull_request_target': {
      const pr = e.pull_request, a = e.action;
      const merged = a === 'closed' && pr.merged;
      const label = { opened: '🔀 PR opened', reopened: '🔀 PR reopened', ready_for_review: '🔀 PR ready for review', closed: merged ? '✅ PR merged' : '🚫 PR closed' }[a];
      if (!label || (a === 'opened' && pr.draft)) return null;
      const color = merged ? COLORS.purple : a === 'closed' ? COLORS.red : COLORS.green;
      return embed({
        title: `${label}: #${pr.number} ${clip(plain(pr.title), 200)}`, url: pr.html_url, color, author: author(pr.user),
        description: a === 'opened' ? plain(clip(pr.body || '', 400)) : undefined,
        fields: [
          { name: 'Branch', value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``, inline: true },
          { name: 'Changes', value: `${pr.changed_files || 0} files, +${pr.additions || 0} −${pr.deletions || 0}`, inline: true },
        ],
        footer: { text: repo },
      });
    }
    case 'pull_request_review': {
      if (e.action !== 'submitted') return null;
      const r = e.review, state = String(r.state).toLowerCase();
      const label = { approved: '👍 Approved', changes_requested: '✋ Changes requested', commented: '💬 Reviewed' }[state];
      if (!label || (state === 'commented' && !r.body)) return null;
      return embed({
        title: `${label}: #${e.pull_request.number} ${clip(plain(e.pull_request.title), 200)}`, url: r.html_url,
        description: plain(clip(r.body || '', 500)), color: state === 'approved' ? COLORS.green : state === 'changes_requested' ? COLORS.red : COLORS.grey,
        author: author(r.user), footer: { text: repo },
      });
    }
    case 'issues': {
      const i = e.issue, a = e.action;
      const label = { opened: '🐛 Issue opened', closed: i && i.state_reason === 'not_planned' ? '🚫 Issue closed (not planned)' : '✅ Issue closed', reopened: '🔁 Issue reopened' }[a];
      if (!label) return null;
      return embed({
        title: `${label}: #${i.number} ${clip(plain(i.title), 200)}`, url: i.html_url, author: author(i.user),
        description: a === 'opened' ? plain(clip(i.body || '', 500)) : undefined,
        color: a === 'closed' ? COLORS.purple : COLORS.yellow,
        fields: (i.labels || []).length ? [{ name: 'Labels', value: i.labels.map((l) => l.name).join(', ').slice(0, 200) }] : undefined,
        footer: { text: repo },
      });
    }
    case 'issue_comment': {
      if (e.action !== 'created' || (e.comment.user && e.comment.user.type === 'Bot')) return null;
      const kind = e.issue.pull_request ? 'PR' : 'issue';
      return embed({
        title: `💬 Comment on ${kind} #${e.issue.number}: ${clip(plain(e.issue.title), 180)}`, url: e.comment.html_url,
        description: plain(clip(e.comment.body, 500)), color: COLORS.grey, author: author(e.comment.user), footer: { text: repo },
      });
    }
    case 'watch': {
      if (e.action !== 'started') return null;
      return embed({ title: `⭐ ${e.sender.login} starred ${repo}`, url: e.repository.html_url + '/stargazers', description: `**${e.repository.stargazers_count}** stars now`, color: COLORS.gold, author: author(e.sender) });
    }
    case 'fork':
      return embed({ title: `🍴 ${e.sender.login} forked ${repo}`, url: e.forkee.html_url, description: `**${e.repository.forks_count}** forks now`, color: COLORS.blue, author: author(e.sender) });
    case 'release':
      return e.action === 'published' ? releaseEmbed(e.release, repo) : null;
    case 'workflow_dispatch':
      return embed({ title: '🔔 Test message', description: 'The Discord notifier is connected.', color: COLORS.gold, author: author(e.sender), footer: { text: repo } });
    default:
      return null;
  }
}

/** Pure: the runs to report for a commit. Latest run of each workflow, ours excluded. */
export function latestRuns(runs) {
  const byName = new Map();
  for (const r of runs) {
    if (r.name === SELF || !WORKFLOWS_IN_DIGEST.has(r.event)) continue;
    const old = byName.get(r.name);
    if (!old || r.run_number > old.run_number || (r.run_number === old.run_number && r.run_attempt > old.run_attempt)) byName.set(r.name, r);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Pure: true when `current` is the last of `runs` to finish, so exactly one workflow posts the digest. */
export function isLastToFinish(runs, current) {
  const key = (r) => [Date.parse(r.updated_at) || 0, r.id];
  const last = runs.reduce((a, b) => { const ka = key(a), kb = key(b); return kb[0] > ka[0] || (kb[0] === ka[0] && kb[1] > ka[1]) ? b : a; });
  return last.id === current.id;
}

export function digestEmbed(runs, failedJobs, head) {
  const bad = runs.filter((r) => r.conclusion !== 'success' && r.conclusion !== 'skipped' && r.conclusion !== 'neutral');
  const rows = runs.map((r) => {
    const ok = !bad.includes(r);
    const took = Date.parse(r.updated_at) - Date.parse(r.run_started_at || r.created_at);
    const jobs = (failedJobs[r.id] || []).slice(0, 4).map((j) => `\n\u2003↳ ${plain(clip(j, 60))}`).join('');
    return `${ok ? '✅' : r.conclusion === 'cancelled' ? '⚪' : '❌'} [${r.name}](${r.html_url}) · ${seconds(took)}${ok ? '' : ' · ' + (r.conclusion || 'unknown')}${jobs}`;
  });
  const pr = (head.pull_requests || [])[0];
  return embed({
    title: `${bad.length ? '❌ CI failed' : '✅ CI passed'}: ${plain(clip(line(head.head_commit && head.head_commit.message, 70) || short(head.head_sha), 70))}`,
    url: pr ? `${head.repository.html_url}/pull/${pr.number}` : `${head.repository.html_url}/commit/${head.head_sha}`,
    description: rows.join('\n'), color: bad.length ? COLORS.red : COLORS.green,
    footer: { text: `${head.repository.full_name} · ${short(head.head_sha)} · ${head.head_branch}${pr ? ' · PR #' + pr.number : ''}` },
  });
}

export function payload(embeds) {
  return { username: 'Shore', allowed_mentions: { parse: [] }, embeds: embeds.filter(Boolean) };
}

async function send(url, body) {
  if (process.env.DISCORD_DRY_RUN === '1') { console.log(JSON.stringify(body, null, 2)); return; }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url + '?wait=false', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) return;
    if (res.status === 429) { const wait = Number((await res.json().catch(() => ({}))).retry_after) || 2; await new Promise((r) => setTimeout(r, Math.min(wait, 10) * 1000)); continue; }
    throw new Error('Discord answered ' + res.status + ': ' + (await res.text()).slice(0, 200));
  }
  throw new Error('Discord kept rate-limiting the request');
}

async function api(path) {
  const res = await fetch('https://api.github.com' + path, { headers: { authorization: 'Bearer ' + process.env.GITHUB_TOKEN, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' } });
  if (!res.ok) throw new Error('GitHub API ' + path + ' answered ' + res.status);
  return res.json();
}

async function workflowRun(e) {
  const run = e.workflow_run, repo = e.repository.full_name;
  if (run.name === SELF) return null;
  if (run.name === RELEASE_WORKFLOW && run.conclusion === 'success') {
    // A release made by a workflow with GITHUB_TOKEN never fires the `release` event, so announce it from the run.
    const r = await api(`/repos/${repo}/releases/latest`);
    return r && r.target_commitish && Date.parse(r.published_at) >= Date.parse(run.run_started_at) - 60000 ? releaseEmbed(r, repo) : null;
  }
  if (!WORKFLOWS_IN_DIGEST.has(run.event)) {
    // Scheduled and manual runs (weekly scans, releases) only speak up when they fail.
    if (run.conclusion === 'success' || run.conclusion === 'cancelled' || run.conclusion === 'skipped') return null;
    return embed({ title: `❌ ${run.name} failed`, url: run.html_url, color: COLORS.red, description: `${run.event} run on \`${run.head_branch}\``, footer: { text: repo } });
  }
  const all = await api(`/repos/${repo}/actions/runs?head_sha=${run.head_sha}&per_page=100`);
  const runs = latestRuns(all.workflow_runs);
  if (runs.some((r) => r.status !== 'completed')) return null; // something is still running: its end will report
  if (!isLastToFinish(runs, runs.find((r) => r.name === run.name) || run)) return null;
  const failedJobs = {};
  for (const r of runs.filter((r) => r.conclusion === 'failure')) {
    const jobs = await api(`/repos/${repo}/actions/runs/${r.id}/jobs?per_page=50`);
    failedJobs[r.id] = jobs.jobs.filter((j) => j.conclusion === 'failure').map((j) => j.name);
  }
  return digestEmbed(runs, failedJobs, Object.assign({ repository: e.repository }, run));
}

async function main() {
  const url = (process.env.DISCORD_WEBHOOK_URL || '').trim();
  if (!url) { console.log('::notice::DISCORD_WEBHOOK_URL is not set (Settings › Secrets and variables › Actions). Nothing sent.'); return; }
  if (!/^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(url)) throw new Error('DISCORD_WEBHOOK_URL is not a Discord webhook address');
  const name = process.env.GITHUB_EVENT_NAME, event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const message = name === 'workflow_run' ? await workflowRun(event) : buildEmbed(name, event);
  if (!message) { console.log('Nothing to report for ' + name + (event.action ? ' / ' + event.action : '')); return; }
  await send(url, payload([message]));
  console.log('Sent: ' + message.title);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error('::error::' + error.message); process.exit(1); });
}
