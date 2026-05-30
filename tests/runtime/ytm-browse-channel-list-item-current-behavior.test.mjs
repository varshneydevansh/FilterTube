import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'ytm_browse?prettyPrint=false.json';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_YTM_BROWSE_CHANNEL_LIST_ITEM_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const futureAuthorityTokens = [
  'ytmBrowseChannelListItemContract',
  'ytmBrowseChannelListItemDecisionReport',
  'ytmBrowseChannelListItemWhitelistPolicy',
  'ytmBrowseChannelListItemSideEffectBudget',
  'ytmBrowseChannelListItemSiblingPreservationFixture',
  'ytmBrowseChannelListItemRoutePolicy',
  'ytmBrowseChannelListItemMetricArtifact',
  'ytmBrowseChannelListItemJsonFirstGate'
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

function runFixture(settings = {}) {
  const fixture = loadFixture();
  const input = plain(fixture.response);
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { fixture, input, output, messages: harness.messages };
}

function channelRows(response) {
  return response.contents.singleColumnBrowseResultsRenderer.tabs[0]
    .tabRenderer.content.sectionListRenderer.contents[0]
    .shelfRenderer.content.verticalListRenderer.items
    .map((item) => item.channelListItemRenderer);
}

function channelIds(response) {
  return channelRows(response).map((row) => row.channelId);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js'
  ].map(read).join('\n');
}

test('YTM browse channel-list audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'direct JSON object');
  assert.equal(fixture.provenance.route, 'browse FEchannels');
  assert.equal(fixture.provenance.clientName, 'MWEB');
  assert.equal(fixture.provenance.rendererType, 'channelListItemRenderer');
  assert.equal(fixture.provenance.rendererCount, 983);
  assert.deepEqual(fixture.provenance.selectedRendererIndexes, [0, 1]);
  assert.deepEqual(fixture.provenance.selectedRendererStartLines, [95, 146]);
  assert.equal(lineCount(fixtureText), 160);
  assert.equal(Buffer.byteLength(fixtureText), 7767);
  assert.equal(sha256(fixturePath), '80671c2e814098a75a37406635ccfc839e9ddb43069885a73e05bdd6259ce19e');
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.ok(runtimeResults.includes('tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM browse FEchannels `channelListItemRenderer` fixture/);
});

test('raw YTM browse capture is direct JSON with one large channel-list shelf', () => {
  const raw = read(rawPath);
  const parsed = JSON.parse(raw);

  assert.equal(lineCount(raw), 52334);
  assert.equal(Buffer.byteLength(raw), 3005515);
  assert.equal(sha256(rawPath), '4444c7dcb6b6a884846a19169bed286f1019cd7275a6d1292392b1c1de95bdf8');
  assert.equal(countLiteral(raw, 'channelListItemRenderer'), 984);
  assert.equal(countKey(parsed, 'channelListItemRenderer'), 983);
  assert.equal(countKey(parsed, 'browseEndpoint'), 984);
  assert.equal(countKey(parsed, 'sectionListRenderer'), 1);
  assert.equal(countKey(parsed, 'shelfRenderer'), 1);
  assert.equal(countKey(parsed, 'verticalListRenderer'), 1);
  const trackingParams = parsed.responseContext.serviceTrackingParams
    .flatMap((service) => service.params || []);
  assert.ok(trackingParams.some((param) => param.key === 'browse_id' && param.value === 'FEchannels'));
});

test('reduced YTM browse fixture preserves two adjacent channel identities', () => {
  const fixture = loadFixture();
  const rows = channelRows(fixture.response);

  assert.deepEqual(channelIds(fixture.response), [
    'UCBvMrvqRUpaHHvQt7M0cIuQ',
    'UCjkyfFH-MWZhasolgds05EA'
  ]);
  assert.equal(rows[0].title.runs[0].text, 'Kshatriya Dharma');
  assert.equal(rows[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl, '/@KshatriyaDharma');
  assert.equal(rows[1].title.runs[0].text, '*NSYNC');
  assert.equal(rows[1].navigationEndpoint.browseEndpoint.canonicalBaseUrl, '/@OfficialNSYNC');
});

test('no-rule processing preserves YTM browse channel-list rows but queues map side effects', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(plain(channelIds(output)), [
    'UCBvMrvqRUpaHHvQt7M0cIuQ',
    'UCjkyfFH-MWZhasolgds05EA'
  ]);
  assert.deepEqual(plain(messages), [
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id: 'UCBvMrvqRUpaHHvQt7M0cIuQ', handle: '@KshatriyaDharma' }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id: 'UCjkyfFH-MWZhasolgds05EA', handle: '@OfficialNSYNC' }],
      source: 'filter_logic'
    }
  ]);
});

test('matching keyword and channel blocklist rules currently preserve channelListItemRenderer rows', () => {
  const keywordRun = runFixture({
    filterKeywords: [{ pattern: 'Kshatriya', flags: 'i' }]
  });
  const channelRun = runFixture({
    filterChannels: [{ id: 'UCBvMrvqRUpaHHvQt7M0cIuQ', handle: '@KshatriyaDharma' }]
  });

  assert.deepEqual(plain(channelIds(keywordRun.output)), [
    'UCBvMrvqRUpaHHvQt7M0cIuQ',
    'UCjkyfFH-MWZhasolgds05EA'
  ]);
  assert.deepEqual(plain(channelRun.output), plain(channelRun.input));
});

test('whitelist matching and nonmatching modes currently preserve YTM browse channel-list rows', () => {
  const allowRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCBvMrvqRUpaHHvQt7M0cIuQ', handle: '@KshatriyaDharma' }]
  });
  const noMatchRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC0000000000000000000000', handle: '@elsewhere' }]
  });

  assert.deepEqual(plain(allowRun.output), plain(allowRun.input));
  assert.deepEqual(plain(noMatchRun.output), plain(noMatchRun.input));
});

test('channelListItemRenderer direct rule is absent while map harvest remains possible', () => {
  const logic = read('js/filter_logic.js');
  const directRules = logic.slice(
    logic.indexOf('const FILTER_RULES = {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );

  assert.doesNotMatch(directRules, /\n\s*channelListItemRenderer\s*:/);
  assert.match(logic, /FilterTube_UpdateChannelMap/);
});

test('YTM browse channel-list future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
