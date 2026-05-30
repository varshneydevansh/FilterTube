import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('identity waterfall review convergence is audit-only and preserves the priority-order boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /the waterfall is the intended\s+priority order for source confidence/);
  assert.match(doc, /not a single\s+JSON-authoritative decision system/);
  assert.match(doc, /This document is a convergence record, not an implementation gate opening/);
});

test('identity waterfall review convergence records all six review slices', () => {
  const doc = read(docPath);

  for (const slice of [
    'Seed and JSON engine',
    'Renderer extraction',
    'DOM fallback and hide authority',
    'Menu/action identity',
    'Background resolver',
    'Feature dependency scope'
  ]) {
    assert.ok(doc.includes(slice), `missing review slice ${slice}`);
  }

  for (const term of [
    '`canonical`',
    '`harvest-only`',
    '`joinedByVideoId`',
    '`displayOnly`',
    '`fallback`',
    '`unknown`',
    'hide/allow',
    'map write',
    'DOM rerun',
    'network fetch'
  ]) {
    assert.ok(doc.includes(term), `missing source/effect term ${term}`);
  }
});

test('identity waterfall review convergence records actual per-surface decision flow', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Actual Decision Flow By Surface',
    'route/surface + settings mode',
    'Is there an explicit renderer/player field for this exact target?',
    'yes, and the runtime rule consumes it',
    'direct JSON effect may be allowed by future source/effect proof',
    'yes, but the runtime only harvests it today',
    'map write / cache / later DOM join, not direct hide proof',
    'no, but a video id is present',
    'joinedByVideoId through player JSON, learned map, or resolver',
    'no stable id, only visible text or page context',
    'displayOnly until a future DOM confidence authority proves more',
    'unresolved clicked/action target',
    'fallback resolver only with a reason-coded budget'
  ]) {
    assert.ok(doc.includes(phrase), `missing decision-flow phrase ${phrase}`);
  }

  for (const surface of [
    'Main home/search video renderers',
    'Main watch current video',
    'Shorts/reels',
    'Watch rail/end screen',
    'Playlist/Mix/radio',
    'YouTube Kids',
    'YouTube Music',
    'Collaborator/avatar-stack',
    'Posts/comments'
  ]) {
    assert.ok(doc.includes(surface), `missing surface case ${surface}`);
  }

  for (const effect of [
    'hide',
    'allow',
    'harvest',
    'persist',
    'stamp',
    'fetch',
    'rerun DOM fallback',
    'pause playback',
    'only label a UI row'
  ]) {
    assert.ok(doc.includes(effect), `missing future effect ${effect}`);
  }
});

test('identity waterfall review convergence is backed by current seed and filter runtime source', () => {
  const seed = read('js/seed.js');
  const filter = read('js/filter_logic.js');

  assert.match(seed, /\/youtubei\/v1\/search/);
  assert.match(seed, /\/youtubei\/v1\/browse/);
  assert.match(seed, /\/youtubei\/v1\/next/);
  assert.match(seed, /\/youtubei\/v1\/player/);
  assert.match(seed, /harvestOnly/);
  assert.match(seed, /processWithEngine/);

  assert.match(filter, /videoOwnerChannelId/);
  assert.match(filter, /kidsVideoOwnerExtension/);
  assert.match(filter, /shortsLockupViewModel/);
  assert.match(filter, /reelItemRenderer/);
  assert.match(filter, /radioRenderer/);
  assert.match(filter, /commentRenderer/);
});

test('identity waterfall review convergence is backed by DOM action and resolver source', () => {
  const fallback = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  assert.match(fallback, /nameOnlyNames/);
  assert.match(fallback, /stableNames/);
  assert.match(fallback, /getCurrentPageChannelMeta/);
  assert.match(fallback, /data-filtertube-whitelist-pending/);

  assert.match(bridge, /data-filtertube-video-id/);
  assert.match(bridge, /useShortsResolver \? 'shorts' : 'watch'/);
  assert.match(bridge, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id/);

  assert.match(background, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(background, /performKidsWatchIdentityFetch\(videoId\)/);
  assert.match(background, /performWatchIdentityFetch\(videoId\)/);
  assert.match(background, /fetchChannelDetails/);
  assert.match(background, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.match(background, /async function fetchChannelInfo\(channelIdOrHandle\)/);
});

test('identity waterfall review convergence links to current corrected reference wording', () => {
  const channelDoc = read('docs/CHANNEL_BLOCKING_SYSTEM.md');
  const jsonGap = read('docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md');
  const surfaceDoc = read('docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md');

  assert.match(channelDoc, /JSON-first identity strategy/);
  assert.match(channelDoc, /not a guarantee\s+that identity exists before DOM render/);
  assert.match(channelDoc, /Harvested learned maps/);
  assert.match(channelDoc, /Network fetch.*last-resort resolver/);
  assert.match(channelDoc, /identityWorkBudget/);

  assert.match(jsonGap, /documented JSON field/);
  assert.match(jsonGap, /is the field consumed by the current runtime path/);
  assert.match(surfaceDoc, /video id is a join key, not channel identity/);
  assert.match(surfaceDoc, /display\s+name is a UI clue, not canonical identity/);
});

test('identity waterfall review convergence has no runtime authority implementation yet', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of [
    'identityWaterfallReviewAuthority',
    'identitySourceEffectDecision',
    'identityWorkBudget',
    'sourceConfidenceDecision',
    'jsonRuntimeCoverageAuthority',
    'domIdentityConfidenceAuthority',
    'identityFetchReasonBudget',
    'postActionIdentityFanoutBudget'
  ]) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(`\\b${token}\\b`));
  }
});
