import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_INITIAL_LOCKUP_SHORTS_JSON_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-initial-lockup-shorts-json.json';
const rawPath = 'YT_MAIN.json';

const futureAuthorityTokens = [
  'mainWatchInitialJsonClassificationContract',
  'mainWatchInitialLockupDecisionReport',
  'mainWatchInitialShortsParityReport',
  'mainWatchInitialPlayerFragmentGate',
  'mainWatchInitialJsonFirstOptimizationGate',
  'ytMainJsonBrowseSearchAuthority',
  'mainWatchInitialMetricArtifact'
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
        const fragmentText = text.slice(start, index + 1);
        fragments.push({
          start,
          end: index + 1,
          line: text.slice(0, start).split('\n').length,
          text: fragmentText,
          bytes: Buffer.byteLength(fragmentText),
          sha256: crypto.createHash('sha256').update(fragmentText).digest('hex')
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
  return { fixture, output: plain(output), messages: plain(harness.messages) };
}

function lockupItems(response) {
  return response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results[0]
    .itemSectionRenderer.contents;
}

function lockupIds(response) {
  return lockupItems(response)
    .filter((item) => item.lockupViewModel)
    .map((item) => item.lockupViewModel.contentId);
}

function continuationCount(response) {
  return lockupItems(response).filter((item) => item.continuationItemRenderer).length;
}

function shortsItems(response) {
  return response.engagementPanels[0].engagementPanelSectionListRenderer.content
    .structuredDescriptionContentRenderer.items[0].reelShelfRenderer.items;
}

function shortsVideoIds(response) {
  return shortsItems(response)
    .map((item) => item.shortsLockupViewModel?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId)
    .filter(Boolean);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('YT_MAIN initial watch JSON audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not Main browse\/search completion proof/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.fragmentIndex, 0);
  assert.equal(fixture.provenance.fragmentStartLine, 1);
  assert.equal(fixture.provenance.fragmentBytes, 4826868);
  assert.equal(fixture.provenance.fragmentSha256, '9598bbddb384791ba7553cc98e54f0154fd76a7346a78e5b360eca0f69768fed');
  assert.equal(fixture.provenance.rendererType, 'watchInitialLockupAndShortsJson');
  assert.equal(fixture.provenance.route, 'watch');
  assert.equal(fixture.captureFixtureTraceability.releaseInputAllowed, false);
  assert.equal(lineCount(fixtureText), 296);
  assert.equal(Buffer.byteLength(fixtureText), 12468);
  assert.equal(sha256(fixturePath), '274f7b1f766aa43f7194fe0f8c601ac1316f713c43b1aff9a1a1e73b6128d1bb');
});

test('raw YT_MAIN capture is mixed text with initial watch JSON and later player JSON fragments', () => {
  const raw = read(rawPath);

  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.equal(lineCount(raw), 50481);
  assert.equal(Buffer.byteLength(raw), 4951099);
  assert.equal(sha256(rawPath), '64c7861ff6baa76816082479f5bdda591faef3e72e2510e6da80866cba1c3357');

  const fragments = topLevelJsonFragments(raw);
  assert.equal(fragments.length, 2);
  assert.deepEqual(fragments.map(({ line, bytes, sha256: hash }) => ({ line, bytes, hash })), [
    {
      line: 1,
      bytes: 4826868,
      hash: '9598bbddb384791ba7553cc98e54f0154fd76a7346a78e5b360eca0f69768fed'
    },
    {
      line: 47533,
      bytes: 124193,
      hash: 'a54a51cc0624c21ea56f442b11166200be7c0345ab4d027ddad3d860855d7c73'
    }
  ]);
  assert.match(raw.slice(fragments[0].end, fragments[1].start), /player\?prettyprint=false/);

  const initial = JSON.parse(fragments[0].text);
  assert.equal(countKey(initial, 'lockupViewModel'), 20);
  assert.equal(countKey(initial, 'shortsLockupViewModel'), 30);
  assert.equal(countKey(initial, 'reelShelfRenderer'), 1);
  assert.equal(countKey(initial, 'continuationItemRenderer'), 4);
  assert.equal(countKey(initial, 'videoRenderer'), 0);
  assert.equal(countKey(initial, 'richItemRenderer'), 0);
  assert.equal(countKey(initial, 'gridVideoRenderer'), 0);
  assert.equal(countKey(initial, 'channelRenderer'), 0);
});

test('reduced fixture pins one watch lockup sibling set and one Shorts remix shelf', () => {
  const fixture = loadFixture();
  const text = JSON.stringify(fixture.response);

  assert.deepEqual(lockupIds(fixture.response), [
    '8Li0Tyeqlc4',
    '6IQUsbxUyYw',
    'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg'
  ]);
  assert.equal(continuationCount(fixture.response), 1);
  assert.deepEqual(shortsVideoIds(fixture.response), ['_NsY2tXTveU', 'lJ4Ty2Xos08']);
  assert.match(text, /lockupViewModel/);
  assert.match(text, /shortsLockupViewModel/);
  assert.match(text, /twoColumnWatchNextResults/);
  assert.match(text, /Shorts remixing this video/);
});

test('no-rule processing preserves watch lockups, Shorts shelf, continuation, and map side effects', () => {
  const { output, messages } = runFixture();

  assert.deepEqual(lockupIds(output), [
    '8Li0Tyeqlc4',
    '6IQUsbxUyYw',
    'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg'
  ]);
  assert.equal(continuationCount(output), 1);
  assert.deepEqual(shortsVideoIds(output), ['_NsY2tXTveU', 'lJ4Ty2Xos08']);

  const channelMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  assert.deepEqual(channelMapMessages.map((message) => message.payload[0]), [
    { id: 'UCVZ2A50--jZieMK_qyMd1Yw', handle: '@TronLegacyScore' },
    { id: 'UCgqMjKxRWAKUvgYqgomighw', handle: '@kbs_cheongju_official' }
  ]);

  const videoMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(videoMapMessages[0].payload, [
    { videoId: '8Li0Tyeqlc4', channelId: 'UCVZ2A50--jZieMK_qyMd1Yw' },
    { videoId: '6IQUsbxUyYw', channelId: 'UCgqMjKxRWAKUvgYqgomighw' }
  ]);
});

test('blocklist keyword and channel rules remove only matching watch lockups', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'Tron', flags: 'i' }] });
  assert.deepEqual(lockupIds(keywordRun.output), ['6IQUsbxUyYw', 'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);
  assert.deepEqual(shortsVideoIds(keywordRun.output), ['_NsY2tXTveU', 'lJ4Ty2Xos08']);
  assert.equal(continuationCount(keywordRun.output), 1);

  const channelRun = runFixture({ filterChannels: [{ id: 'UCgqMjKxRWAKUvgYqgomighw' }] });
  assert.deepEqual(lockupIds(channelRun.output), ['8Li0Tyeqlc4', 'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg']);
  assert.deepEqual(shortsVideoIds(channelRun.output), ['_NsY2tXTveU', 'lJ4Ty2Xos08']);
  assert.equal(continuationCount(channelRun.output), 1);
});

test('playlist Mix row has searchable metadata but no creator-channel identity today', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'BLACKPINK', flags: 'i' }] });
  assert.deepEqual(lockupIds(keywordRun.output), ['8Li0Tyeqlc4', '6IQUsbxUyYw']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UCBLACKPINKDisplayOnly000001' }] });
  assert.deepEqual(lockupIds(channelRun.output), [
    '8Li0Tyeqlc4',
    '6IQUsbxUyYw',
    'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg'
  ]);
});

test('hideAllShorts removes Shorts lockups from the same initial JSON while preserving watch lockups', () => {
  const { output } = runFixture({ hideAllShorts: true });

  assert.deepEqual(lockupIds(output), [
    '8Li0Tyeqlc4',
    '6IQUsbxUyYw',
    'RDGMEM0s70dY0AfCwh3LqQ-Bv1xg'
  ]);
  assert.deepEqual(shortsVideoIds(output), []);
  assert.equal(continuationCount(output), 1);
});

test('whitelist channel and keyword modes preserve matching lockups and remove unsupported siblings', () => {
  const channelRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCVZ2A50--jZieMK_qyMd1Yw' }]
  });
  assert.deepEqual(lockupIds(channelRun.output), ['8Li0Tyeqlc4']);
  assert.deepEqual(shortsVideoIds(channelRun.output), []);
  assert.equal(continuationCount(channelRun.output), 1);

  const keywordRun = runFixture({
    listMode: 'whitelist',
    whitelistKeywords: [{ pattern: 'BTS Stage', flags: 'i' }]
  });
  assert.deepEqual(lockupIds(keywordRun.output), ['6IQUsbxUyYw']);
  assert.deepEqual(shortsVideoIds(keywordRun.output), []);
  assert.equal(continuationCount(keywordRun.output), 1);
});

test('YT_MAIN initial watch JSON future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
