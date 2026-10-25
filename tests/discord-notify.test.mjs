// Run with `npm test`. Pure functions only: no network, no webhook.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildEmbed, clip, digestEmbed, isLastToFinish, latestRuns, payload } from '../scripts/discord-notify.mjs';

const repository = { full_name: 'taynotfound/shore', html_url: 'https://github.com/taynotfound/shore', stargazers_count: 12, forks_count: 3 };
const sender = { login: 'tay', html_url: 'https://github.com/tay', avatar_url: 'https://x/a.png' };

test('clip truncates and trims', () => {
  assert.equal(clip('  hello  ', 20), 'hello');
  assert.equal(clip('abcdefghij', 5), 'abcd…');
  assert.equal(clip(null, 5), '');
});

test('push lists commits and escapes markdown and mentions', () => {
  const e = buildEmbed('push', { ref: 'refs/heads/main', repository, sender, compare: 'https://c', commits: [{ id: 'abcdef123', url: 'https://u', message: 'Fix *bold* @everyone [x](y)\n\nbody' }] });
  assert.match(e.title, /Pushed 1 commit to main/);
  assert.ok(e.description.includes('\\*bold\\*') && e.description.includes('\\@everyone') && e.description.includes('\\[x\\]'));
  assert.ok(!e.description.includes('body'));
  assert.deepEqual(payload([e]).allowed_mentions, { parse: [] });
});

test('push without commits, and tags and deletions', () => {
  assert.equal(buildEmbed('push', { ref: 'refs/heads/x', repository, sender, commits: [] }), null);
  assert.match(buildEmbed('push', { ref: 'refs/tags/v1', repository, sender, commits: [] }).title, /Tag pushed: v1/);
  assert.match(buildEmbed('push', { ref: 'refs/heads/old', repository, sender, deleted: true }).title, /Branch deleted/);
});

test('pull requests: opened, merged, closed, drafts', () => {
  const pr = { number: 7, title: 'Add thing', html_url: 'https://p', user: sender, head: { ref: 'a' }, base: { ref: 'main' }, changed_files: 2, additions: 5, deletions: 1, body: 'why', draft: false };
  assert.match(buildEmbed('pull_request_target', { action: 'opened', pull_request: pr, repository }).title, /PR opened: #7/);
  assert.match(buildEmbed('pull_request_target', { action: 'closed', pull_request: { ...pr, merged: true }, repository }).title, /PR merged/);
  assert.match(buildEmbed('pull_request_target', { action: 'closed', pull_request: { ...pr, merged: false }, repository }).title, /PR closed/);
  assert.equal(buildEmbed('pull_request_target', { action: 'opened', pull_request: { ...pr, draft: true }, repository }), null);
  assert.equal(buildEmbed('pull_request_target', { action: 'synchronize', pull_request: pr, repository }), null);
});

test('issues, comments, reviews', () => {
  const issue = { number: 3, title: 'Broken', html_url: 'https://i', user: sender, body: 'it broke', labels: [{ name: 'bug' }], state_reason: 'completed' };
  assert.match(buildEmbed('issues', { action: 'opened', issue, repository }).title, /Issue opened: #3/);
  assert.equal(buildEmbed('issues', { action: 'labeled', issue, repository }), null);
  const comment = { html_url: 'https://c', body: 'thanks', user: { ...sender, type: 'User' } };
  assert.match(buildEmbed('issue_comment', { action: 'created', issue, comment, repository }).title, /Comment on issue #3/);
  assert.equal(buildEmbed('issue_comment', { action: 'created', issue, comment: { ...comment, user: { ...sender, type: 'Bot' } }, repository }), null);
  const review = { state: 'APPROVED', html_url: 'https://r', body: '', user: sender };
  assert.match(buildEmbed('pull_request_review', { action: 'submitted', review, pull_request: { number: 1, title: 't' }, repository }).title, /Approved/);
});

test('stars, forks, releases', () => {
  assert.match(buildEmbed('watch', { action: 'started', sender, repository }).description, /12/);
  assert.match(buildEmbed('fork', { sender, repository, forkee: { html_url: 'https://f' } }).description, /3/);
  assert.match(buildEmbed('release', { action: 'published', repository, release: { name: 'Shore 0.8.1', html_url: 'https://r', body: 'notes', author: sender } }).title, /Shore 0\.8\.1 released/);
  assert.equal(buildEmbed('release', { action: 'created', repository, release: {} }), null);
  assert.match(buildEmbed('workflow_dispatch', { repository, sender }).title, /Test message/);
  assert.equal(buildEmbed('deployment', {}), null);
});

const run = (id, name, over) => ({ id, name, run_number: 1, run_attempt: 1, event: 'push', status: 'completed', conclusion: 'success', html_url: 'https://r/' + id, created_at: '2026-01-01T00:00:00Z', run_started_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:01:00Z', ...over });

test('digest keeps the latest run per workflow and ignores ours and manual runs', () => {
  const runs = latestRuns([run(1, 'Check'), run(2, 'Check', { run_number: 2 }), run(3, 'Discord'), run(4, 'Release', { event: 'workflow_dispatch' }), run(5, 'CodeQL')]);
  assert.deepEqual(runs.map((r) => r.id), [2, 5]);
});

test('exactly one workflow is the last to finish', () => {
  const runs = [run(1, 'A', { updated_at: '2026-01-01T00:01:00Z' }), run(2, 'B', { updated_at: '2026-01-01T00:02:00Z' }), run(3, 'C', { updated_at: '2026-01-01T00:02:00Z' })];
  assert.deepEqual(runs.map((r) => isLastToFinish(runs, r)), [false, false, true]);
});

test('digest reports failures with their jobs', () => {
  const runs = [run(1, 'Check', { conclusion: 'failure' }), run(2, 'CodeQL')];
  const e = digestEmbed(runs, { 1: ['Lint', 'Interface (browser)'] }, { repository, head_sha: 'abcdef1234', head_branch: 'main', head_commit: { message: 'Do it\n\nlong' }, pull_requests: [] });
  assert.match(e.title, /CI failed: Do it/);
  assert.ok(e.description.includes('❌') && e.description.includes('Lint') && e.description.includes('✅'));
  const ok = digestEmbed([run(2, 'CodeQL')], {}, { repository, head_sha: 'abcdef1234', head_branch: 'main', head_commit: { message: 'x' }, pull_requests: [{ number: 9 }] });
  assert.match(ok.title, /CI passed/);
  assert.match(ok.footer.text, /PR #9/);
});
