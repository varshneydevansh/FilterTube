import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json';
const rawPath = 'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json';

const futureAuthorityTokens = [
  'mainUpnextWatchpageLockupContinuationContract',
  'mainUpnextWatchpageLockupDecisionReport',
  'mainUpnextWatchpageTargetIdPolicy',
  'mainUpnextWatchpageMixIdentityPolicy',
  'mainUpnextWatchpageMapSideEffectReport',
  'mainUpnextWatchpageSiblingPreservationFixture',
  'mainUpnextWatchpageMetricArtifact',
  'mainUpnextWatchpageJsonFirstGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function topLevelJsonFragments(text) {
  const fragments = [];
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        fragments.push({
          start,
          end: index + 1,
          line: text.slice(0, start).split('\n').length,
          text: text.slice(start, index + 1),
          bytes: Buffer.byteLength(text.slice(start, index + 1))
        });
        start = -1;
      }
    }
  }

  return fragments;
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => walk(entry, visit));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    visit(key, child);
    walk(child, visit);
  }
}

function countKey(value, targetKey) {
  let count = 0;
  walk(value, (key) => {
    if (key === targetKey) count += 1;
  });
  return count;
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function runFixture(overrides = {}) {
  const fixture = loadFixture();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(fixture.response),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { fixture, output, messages: harness.messages };
}

function continuationItems(response) {
  return response.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
}

function contentIds(response) {
  return Array.from(continuationItems(response).map((item) => item.lockupViewModel?.contentId));
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('watchpage lockup continuation audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for watch-surface authority/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.fragmentStartLine, 139);
  assert.equal(fixture.provenance.fragmentBytes, 840530);
  assert.equal(fixture.provenance.targetId, 'watch-next-feed');
  assert.equal(fixture.provenance.rendererType, 'watchNextFeedLockupViewModel');
  assert.equal(lineCount(fixtureText), 151);
  assert.equal(Buffer.byteLength(fixtureText), 5455);
  assert.equal(sha256(fixturePath), 'e3a412472da1fee0f6f9ed95599798d4c2a48f117308d0aaf0437737fea69404');
});

test('raw watchpage capture is prose plus one parsed watch-next-feed continuation fragment', () => {
  const raw = read(rawPath);
  const fixture = loadFixture();

  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.equal(lineCount(raw), 19918);
  assert.equal(Buffer.byteLength(raw), 852491);
  assert.equal(sha256(rawPath), '3732b657182676a97adfa527d19c6f32408ba90509dc8221504a3658db13b6d2');

  const fragments = topLevelJsonFragments(raw);
  assert.equal(fragments.length, 2);
  assert.equal(fragments[1].line, 139);
  assert.equal(fragments[1].bytes, 840530);

  const parsed = JSON.parse(fragments[1].text);
  const action = parsed.onResponseReceivedEndpoints[0].appendContinuationItemsAction;
  assert.equal(action.targetId, 'watch-next-feed');
  assert.equal(action.continuationItems.length, 22);
  assert.equal(countKey(parsed, 'lockupViewModel'), 20);
  assert.equal(countKey(parsed, 'reelShelfRenderer'), 1);
  assert.equal(countKey(parsed, 'continuationItemRenderer'), 1);
  assert.equal(countKey(parsed, 'compactAutoplayRenderer'), 0);
  assert.equal(countKey(parsed, 'endScreenVideoRenderer'), 0);
  assert.equal(countKey(parsed, 'playlistPanelVideoRenderer'), 0);
  assert.equal(countLiteral(raw, 'watch-next-feed'), 6);

  assert.equal(action.continuationItems[0].lockupViewModel.contentId, 'rI2gQ7K4F8g');
  assert.equal(action.continuationItems[0].lockupViewModel.metadata.lockupMetadataViewModel.title.content, continuationItems(fixture.response)[0].lockupViewModel.metadata.lockupMetadataViewModel.title.content);
  assert.equal(action.continuationItems[0].lockupViewModel.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId, 'UC9D_41XZiozyLLeRKVQIBmQ');
  assert.equal(action.continuationItems[1].lockupViewModel.contentId, 'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg');
  assert.equal(action.continuationItems[1].lockupViewModel.metadata.lockupMetadataViewModel.title.content, 'Mix – K-pop');
});

test('no-rule processing preserves late watch lockup siblings and queues map side effects', () => {
  const { output, messages } = runFixture();

  assert.deepEqual(contentIds(output), ['rI2gQ7K4F8g', 'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);

  const channelMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  assert.equal(channelMapMessages.length, 1);
  assert.deepEqual(plain(channelMapMessages[0].payload), [
    { id: 'UC9D_41XZiozyLLeRKVQIBmQ', handle: '@AvtoradioMoscow' }
  ]);

  const videoMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(plain(videoMapMessages[0].payload), [
    { videoId: 'rI2gQ7K4F8g', channelId: 'UC9D_41XZiozyLLeRKVQIBmQ' }
  ]);
});

test('blocklist keyword and channel rules remove the matching watch lockup while preserving Mix sibling', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'Авторадио', flags: 'i' }] });
  assert.deepEqual(contentIds(keywordRun.output), ['RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UC9D_41XZiozyLLeRKVQIBmQ' }] });
  assert.deepEqual(contentIds(channelRun.output), ['RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);
});

test('Mix metadata is keyword-searchable but not creator-channel identity today', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'BLACKPINK', flags: 'i' }] });
  assert.deepEqual(contentIds(keywordRun.output), ['rI2gQ7K4F8g']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UCBLACKPINKDisplayOnly000001' }] });
  assert.deepEqual(contentIds(channelRun.output), ['rI2gQ7K4F8g', 'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);
});

test('whitelist channel allow preserves matching watch lockup and removes unresolved Mix sibling', () => {
  const { output } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC9D_41XZiozyLLeRKVQIBmQ' }]
  });

  assert.deepEqual(contentIds(output), ['rI2gQ7K4F8g']);
});

test('watchpage lockup continuation future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `doc should name missing future token ${token}`);
    assert.equal(runtime.includes(token), false, `${token} should remain absent from product runtime source`);
  }
});
