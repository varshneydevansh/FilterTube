import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_FLOW_DIAGRAM_REGISTER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function runtimeSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');
}

test('identity flow diagram register is audit-only and defines route flow diagrams', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /implementation patch/);
  assert.match(doc, /Flow 1: Endpoint Body To Learned Maps/);
  assert.match(doc, /Flow 2: Watch Current Video/);
  assert.match(doc, /Flow 3: Shorts/);
  assert.match(doc, /Flow 4: Watch Playlist And Mix/);
  assert.match(doc, /Flow 5: Collaborator Dialogs And Sheets/);
  assert.match(doc, /Flow 6: Kids And YouTube Music/);
  assert.match(doc, /Flow 7: Post-Action Fanout/);
});

test('identity flow diagram register pins the waterfall as joins and effects, not source-only order', () => {
  const doc = read(docPath);

  for (const token of [
    'source-confidence',
    'join keys',
    'side effects',
    'fallback owner',
    'videoChannelMap[videoId]',
    'watch:VIDEO_ID',
    'shorts:VIDEO_ID',
    'visible-sibling fanout',
    'resolver reason and credential policy'
  ]) {
    assert.ok(doc.includes(token), `missing flow token ${token}`);
  }
});

test('identity flow diagram register is backed by current seed and filter logic source tokens', () => {
  const source = runtimeSource();

  for (const token of [
    'function processWithEngine(data, dataName)',
    'FilterTubeEngine.harvestOnly(data',
    'type: \'FilterTube_UpdateVideoChannelMap\'',
    'harvestOnly: function (data, settings)',
    'playlistPanelVideoRenderer: BASE_VIDEO_RULES',
    'compactPlaylistRenderer',
    'kidsVideoOwnerExtension',
    'showDialogCommand'
  ]) {
    assert.ok(source.includes(token), `missing source token ${token}`);
  }
});

test('identity flow diagram register is backed by current bridge resolver and fanout source tokens', () => {
  const source = runtimeSource();

  for (const token of [
    'FilterTube_UpdateVideoChannelMap',
    'fetchChannelFromShortsUrl(videoId',
    'async function fetchWatchIdentityFromBackground',
    'action: \'fetchWatchIdentity\'',
    'action: \'fetchShortsIdentity\'',
    'input = `watch:${clickSnapshot.videoId}`',
    'command?.showSheetCommand',
    '.shortsLockupViewModelHost, .reel-item-endpoint'
  ]) {
    assert.ok(source.includes(token), `missing bridge token ${token}`);
  }
});

test('identity flow diagram register is backed by current DOM fallback and background resolver source tokens', () => {
  const source = runtimeSource();

  for (const token of [
    'function getCurrentWatchOwnerMeta(settings)',
    'performKidsWatchIdentityFetch(videoId)',
    'action === \'fetchShortsIdentity\'',
    'action === \'fetchWatchIdentity\'',
    'rawValue.startsWith(\'watch:\')',
    'rawValue.startsWith(\'shorts:\')'
  ]) {
    assert.ok(source.includes(token), `missing resolver token ${token}`);
  }
});

test('identity flow diagram register blocks behavior changes until a full flow report exists', () => {
  const doc = read(docPath);

  for (const token of [
    'route and renderer/DOM target family',
    'profile type, viewing space, and list mode',
    'active rule family and empty/disabled state',
    'source tier before the decision',
    'exact target versus visible-sibling fanout',
    'allowed effects and forbidden effects',
    'positive fixture and negative sibling fixture',
    'restore, teardown, and no-work proof'
  ]) {
    assert.ok(doc.includes(token), `missing checklist token ${token}`);
  }
});

test('identity flow authority does not exist in runtime source yet', () => {
  const source = runtimeSource();

  for (const token of [
    'identityFlowDiagramAuthority',
    'identityFlowDecision',
    'identityFlowEffectReport'
  ]) {
    assert.doesNotMatch(source, new RegExp(token));
  }
});
