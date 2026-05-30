import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_PLAYER_FRAGMENT_METADATA_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json';
const rawPath = 'YT_MAIN.json';

const futureAuthorityTokens = [
  'mainWatchPlayerFragmentMetadataContract',
  'mainWatchPlayerFragmentMetadataOnlyPolicy',
  'mainWatchPlayerFragmentMutationBudget',
  'mainWatchPlayerFragmentEndscreenElementDecisionReport',
  'mainWatchPlayerFragmentMapSideEffectReport',
  'mainWatchPlayerFragmentJsonFirstOptimizationGate'
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
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
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

function cardCount(response) {
  return response.cards.cardCollectionRenderer.cards.length;
}

function endscreenVideoIds(response) {
  return response.endscreen.endscreenRenderer.elements
    .map((entry) => entry.endscreenElementRenderer.endpoint.watchEndpoint.videoId);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('YT_MAIN player fragment audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /metadata-only current behavior/);
  assert.match(doc, /not recommendation-filtering authority/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.fragmentIndex, 1);
  assert.equal(fixture.provenance.fragmentStartLine, 47533);
  assert.equal(fixture.provenance.fragmentBytes, 124193);
  assert.equal(fixture.provenance.fragmentSha256, 'a54a51cc0624c21ea56f442b11166200be7c0345ab4d027ddad3d860855d7c73');
  assert.equal(fixture.provenance.rendererType, 'watchPlayerMetadataFragment');
  assert.equal(fixture.provenance.route, 'watch');
  assert.equal(fixture.captureFixtureTraceability.releaseInputAllowed, false);
  assert.equal(lineCount(fixtureText), 159);
  assert.equal(Buffer.byteLength(fixtureText), 5301);
  assert.equal(sha256(fixturePath), 'dd254e7ee4c8b4764ac4511009f75e423055a18dd90466f9081b41ccf40be63d');
});

test('raw YT_MAIN fragment 1 is player metadata JSON without direct recommendation renderers', () => {
  const raw = read(rawPath);

  assert.throws(() => JSON.parse(raw), SyntaxError);

  const fragments = topLevelJsonFragments(raw);
  assert.equal(fragments.length, 2);
  assert.equal(fragments[1].line, 47533);
  assert.equal(fragments[1].bytes, 124193);
  assert.equal(fragments[1].sha256, 'a54a51cc0624c21ea56f442b11166200be7c0345ab4d027ddad3d860855d7c73');

  const player = JSON.parse(fragments[1].text);
  assert.deepEqual(Object.keys(player), [
    'responseContext',
    'playabilityStatus',
    'streamingData',
    'playbackTracking',
    'captions',
    'videoDetails',
    'playerConfig',
    'storyboards',
    'microformat',
    'cards',
    'trackingParams',
    'endscreen',
    'adPlacements',
    'adBreakHeartbeatParams',
    'frameworkUpdates'
  ]);
  assert.equal(player.videoDetails.videoId, 'WMweEpGlu_U');
  assert.equal(player.videoDetails.channelId, 'UC3IZKseVpdzPSBaWxBxundA');
  assert.equal(player.microformat.playerMicroformatRenderer.externalChannelId, 'UC3IZKseVpdzPSBaWxBxundA');
  assert.equal(countKey(player, 'videoDetails'), 1);
  assert.equal(countKey(player, 'playerMicroformatRenderer'), 1);
  assert.equal(countKey(player, 'cardRenderer'), 1);
  assert.equal(countKey(player, 'endscreenElementRenderer'), 4);
  assert.equal(countKey(player, 'videoRenderer'), 0);
  assert.equal(countKey(player, 'lockupViewModel'), 0);
  assert.equal(countKey(player, 'shortsLockupViewModel'), 0);
  assert.equal(countKey(player, 'playlistPanelVideoRenderer'), 0);
  assert.equal(countKey(player, 'compactAutoplayRenderer'), 0);
  assert.equal(countKey(player, 'autoplayVideo'), 0);
});

test('reduced player fragment pins metadata, correction card, and endscreen element siblings', () => {
  const fixture = loadFixture();

  assert.equal(fixture.response.playabilityStatus.status, 'OK');
  assert.equal(fixture.response.videoDetails.videoId, 'WMweEpGlu_U');
  assert.equal(fixture.response.videoDetails.channelId, 'UC3IZKseVpdzPSBaWxBxundA');
  assert.equal(fixture.response.microformat.playerMicroformatRenderer.ownerProfileUrl, 'http://www.youtube.com/@HYBELABELS');
  assert.equal(fixture.response.microformat.playerMicroformatRenderer.category, 'Music');
  assert.equal(cardCount(fixture.response), 1);
  assert.deepEqual(endscreenVideoIds(fixture.response), ['CuklIb9d3fI', 'R6e4tBWxIxE']);
});

test('no-rule processing preserves player response and queues owner plus meta side effects', () => {
  const { fixture, output, messages } = runFixture();

  assert.deepEqual(output, fixture.response);
  assert.deepEqual(messages, [
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id: 'UC3IZKseVpdzPSBaWxBxundA', handle: '@HYBELABELS' }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateVideoChannelMap',
      payload: [{ videoId: 'WMweEpGlu_U', channelId: 'UC3IZKseVpdzPSBaWxBxundA' }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateVideoMetaMap',
      payload: [{
        videoId: 'WMweEpGlu_U',
        lengthSeconds: '183',
        publishDate: '2021-05-20T20:46:13-07:00',
        uploadDate: '2021-05-20T20:46:13-07:00',
        category: 'Music'
      }],
      source: 'filter_logic'
    }
  ]);
});

test('disabled mode still harvests player metadata before returning the original response', () => {
  const { fixture, output, messages } = runFixture({ enabled: false });

  assert.deepEqual(output, fixture.response);
  assert.deepEqual(messages.map((message) => message.type), [
    'FilterTube_UpdateChannelMap',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap'
  ]);
});

test('blocklist and whitelist rules do not remove player metadata or endscreenElementRenderer rows today', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'Butter', flags: 'i' }] });
  assert.deepEqual(keywordRun.output, keywordRun.fixture.response);
  assert.deepEqual(endscreenVideoIds(keywordRun.output), ['CuklIb9d3fI', 'R6e4tBWxIxE']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UC3IZKseVpdzPSBaWxBxundA' }] });
  assert.deepEqual(channelRun.output, channelRun.fixture.response);
  assert.deepEqual(endscreenVideoIds(channelRun.output), ['CuklIb9d3fI', 'R6e4tBWxIxE']);

  const whitelistRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCdoesnotmatch000000000000' }]
  });
  assert.deepEqual(whitelistRun.output, whitelistRun.fixture.response);
  assert.deepEqual(endscreenVideoIds(whitelistRun.output), ['CuklIb9d3fI', 'R6e4tBWxIxE']);
});

test('seed player endpoint bypasses processData with empty blocklist and no active JSON work', async () => {
  const fixture = loadFixture();
  const runtime = loadSeedRuntime({
    pathname: '/watch',
    payload: fixture.response
  });
  runtime.window.filterTube.updateSettings(baseSettings());

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  const body = await response.json();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.deepEqual(body, fixture.response);
});

test('YT_MAIN player fragment future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
