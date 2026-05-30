import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ROUTE_IDENTITY_DECISION_INDEX_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('route identity decision index is audit-only and defines decision classes', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an\s+implementation patch/);
  assert.match(source, /source-confidence priority order, not a guarantee/);

  for (const decisionClass of [
    '`direct-json-decision`',
    '`harvest-then-join`',
    '`dom-target-extraction`',
    '`resolver-recovery`',
    '`post-action-fanout`',
    '`unsupported-route-gap`'
  ]) {
    assert.ok(source.includes(decisionClass), `missing decision class ${decisionClass}`);
  }
});

test('route identity decision index covers every high-risk route family', () => {
  const source = doc();

  for (const route of [
    'Main home/search video cards',
    'Main watch current video',
    'Shorts',
    'Watch rail / end screen / compact autoplay',
    'Watch playlist / Mix',
    'YouTube Kids',
    'YouTube Music',
    'Collaborator / showDialog / showSheet',
    'Posts / comments / community'
  ]) {
    assert.ok(source.includes(route), `missing route row ${route}`);
  }
});

test('route identity decision index pins video id as join key and resolver boundary', () => {
  const source = doc();

  assert.match(source, /A `videoId` is only a join key/);
  assert.match(source, /watch:VIDEO_ID/);
  assert.match(source, /shorts:VIDEO_ID/);
  assert.match(source, /Kids is not globally zero-network/);
  assert.match(source, /post-block Shorts and playlist fanout/);
  assert.match(source, /visible siblings/);
});

test('route identity decision index is backed by seed and filter-logic source tokens', () => {
  const source = doc();
  const seed = read('js/seed.js');
  const filter = read('js/filter_logic.js');

  for (const token of [
    'shouldSkipEngineProcessing(data, dataName)',
    'FilterTubeEngine.harvestOnly(data',
    'processWithEngine(data, dataName)'
  ]) {
    assert.ok(seed.includes(token), `missing seed token ${token}`);
  }

  for (const token of [
    'kidsVideoOwnerExtension?.externalChannelId',
    "'compactPlaylistRenderer'",
    'showDialogCommand',
    '_registerVideoChannelMapping(videoId, ownerId)'
  ]) {
    assert.ok(filter.includes(token), `missing filter token ${token}`);
  }

  assert.match(source, /`compactPlaylistRenderer` is traversal\s+context rather than a direct `FILTER_RULES` authority/);
  assert.match(source, /direct collaborator parsing currently\s+centers on `showDialogCommand`/);
});

test('route identity decision index is backed by bridge DOM resolver and fanout source tokens', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');

  for (const token of [
    'command?.showSheetCommand?.panelLoadingStrategy',
    'enrichVisibleShortsWithChannelInfo(blockedChannelId',
    'enrichVisiblePlaylistRowsWithChannelInfo(blockedChannelId',
    'fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })',
    'fetchWatchIdentityFromBackground(videoId)',
    'input = `watch:${clickSnapshot.videoId}`',
    "useShortsResolver ? 'shorts' : 'watch'"
  ]) {
    assert.ok(bridge.includes(token), `missing bridge token ${token}`);
  }

  assert.match(source, /post-block Shorts and playlist fanout\s+can inspect visible siblings/);
  assert.match(source, /no-identifier watch\/Shorts\/playlist\s+actions route through `watch:VIDEO_ID` or `shorts:VIDEO_ID`/);
});

test('route identity decision index is backed by DOM fallback and background resolver source tokens', () => {
  const source = doc();
  const fallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');

  for (const token of [
    'settings?.videoChannelMap?.[videoId]',
    'getCurrentWatchOwnerMeta',
    'mappedIdAuthoritative: true'
  ]) {
    assert.ok(fallback.includes(token), `missing DOM fallback token ${token}`);
  }

  for (const token of [
    'performShortsIdentityFetch(videoId',
    'performKidsWatchIdentityFetch(videoId',
    'performWatchIdentityFetch(videoId',
    "storageGet(['videoChannelMap'])"
  ]) {
    assert.ok(background.includes(token), `missing background token ${token}`);
  }

  assert.match(source, /current watch owner DOM is treated\s+as stale-prone/);
  assert.match(source, /background resolvers check stored maps\/caches before credentialed HTML fetch/);
});

test('route identity decision authority does not exist in runtime source yet', () => {
  const source = doc();
  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const token of [
    'routeIdentityDecision',
    'routeIdentityDecisionIndex',
    'routeIdentityDecisionAuthority',
    'routeIdentitySourceEffectReport'
  ]) {
    assert.ok(source.includes(token), `doc missing future token ${token}`);
    assert.doesNotMatch(runtime, new RegExp(token), `runtime unexpectedly defines ${token}`);
  }
});
