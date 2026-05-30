import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const rawPath = 'logs.json';
const mixFixturePath = 'tests/runtime/fixtures/captures/main-home-rich-lockup-mix-renderer.json';
const videoFixturePath = 'tests/runtime/fixtures/captures/main-home-rich-video-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_MAIN_HOME_RICH_GRID_MIX_VIDEO_CURRENT_BEHAVIOR_2026-05-24.md';

const futureAuthorityTokens = [
  'mainHomeRichGridContract',
  'mainHomeRichGridFixtureAdmissionReport',
  'mainHomeMixLockupDecisionReport',
  'mainHomeVideoRendererDecisionReport',
  'mainHomeMixDisplayOnlyIdentityPolicy',
  'mainHomeRichGridWhitelistPolicy',
  'mainHomeRichGridMapSideEffectReport',
  'mainHomeRichGridSeedNoWorkBudget',
  'mainHomeRichGridJsonFirstOptimizationBudget'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function lineCount(text) {
  const newlines = text.match(/\r?\n/g);
  return newlines ? newlines.length : 0;
}

function countToken(source, token) {
  return source.split(token).length - 1;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
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

function loadFixture(file) {
  return JSON.parse(read(file));
}

function mixRenderer() {
  return plain(loadFixture(mixFixturePath).renderer);
}

function videoRenderer() {
  return plain(loadFixture(videoFixturePath).renderer);
}

function runEngine(items, overrides = {}) {
  const harness = loadFilterTubeEngine();
  const input = {
    contents: items.map((renderer) => ({ richItemRenderer: plain(renderer) }))
  };
  const output = harness.engine.processData(
    plain(input),
    settings(overrides),
    'main-home-rich-grid-mix-video-current-behavior'
  );
  harness.flushTimers();
  return { input, output: plain(output), messages: plain(harness.messages) };
}

function homeFetchPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [
          { richItemRenderer: mixRenderer() },
          { richItemRenderer: videoRenderer() }
        ]
      }
    }]
  };
}

async function runHomeFetch(overrides = {}) {
  const runtime = loadSeedRuntime({
    pathname: '/',
    payload: homeFetchPayload()
  });
  runtime.window.filterTube.updateSettings(settings(overrides));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  const body = await response.json();
  return { runtime, body };
}

function expectedVideoMessages() {
  return [
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{
        id: 'UCt4t-jeY85JegMlZ-E5UWtA',
        handle: '@aajtak'
      }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateVideoChannelMap',
      payload: [{
        videoId: 'bggFTyMzd9E',
        channelId: 'UCt4t-jeY85JegMlZ-E5UWtA'
      }],
      source: 'filter_logic'
    }
  ];
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

test('Main home rich-grid Mix/video audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const mixText = read(mixFixturePath);
  const videoText = read(videoFixturePath);
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /display-only Mix metadata is not creator channel identity/);
  assert.match(doc, /home rich-grid browse fetch is not a zero-work path today/);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('main-home-rich-grid-mix-video-current-behavior.test.mjs'));
    assert.ok(ledger.includes('main-home-rich-lockup-mix-renderer.json'));
    assert.ok(ledger.includes('main-home-rich-video-renderer.json'));
  }

  assert.equal(lineCount(raw), 29148);
  assert.equal(Buffer.byteLength(raw), 3589250);
  assert.equal(sha256(rawPath), '87cacdf3e0229f951bade1aad18b83074de7c147dfb3095c0f5f705343ca29cc');
  assert.equal(lineCount(mixText), 74);
  assert.equal(Buffer.byteLength(mixText), 2151);
  assert.equal(sha256(mixFixturePath), 'e059b980e6c95c4ccc09baa89a05011946546b28e32b97a61f3f66299b6e43a3');
  assert.equal(lineCount(videoText), 92);
  assert.equal(Buffer.byteLength(videoText), 2864);
  assert.equal(sha256(videoFixturePath), '001acab2767f33c8fbee4fb8d84ec1fca90dfcc6700e109983e854f24badba16');
});

test('logs.json raw home evidence and reduced fixture fields are pinned', () => {
  const raw = read(rawPath);
  const mix = loadFixture(mixFixturePath);
  const video = loadFixture(videoFixturePath);

  assert.equal(countToken(raw, 'richItemRenderer'), 54);
  assert.equal(countToken(raw, 'lockupViewModel'), 33);
  assert.equal(countToken(raw, 'videoRenderer'), 3);
  assert.equal(countToken(raw, 'richGridRenderer'), 2);
  assert.equal(countToken(raw, 'RD41ZY18JqI2A'), 7);
  assert.equal(countToken(raw, 'UCt4t-jeY85JegMlZ-E5UWtA'), 4);

  assert.equal(mix.provenance.source, rawPath);
  assert.equal(mix.provenance.route, 'home');
  assert.equal(mix.renderer.content.lockupViewModel.contentId, 'RD41ZY18JqI2A');
  assert.equal(mix.renderer.content.lockupViewModel.contentType, 'LOCKUP_CONTENT_TYPE_PLAYLIST');
  assert.doesNotMatch(JSON.stringify(mix.renderer), /browseEndpoint|canonicalBaseUrl|channelId|externalChannelId/);

  assert.equal(video.provenance.source, rawPath);
  assert.equal(video.provenance.route, 'home');
  assert.equal(video.renderer.content.videoRenderer.videoId, 'bggFTyMzd9E');
  assert.equal(video.renderer.content.videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId, 'UCt4t-jeY85JegMlZ-E5UWtA');
  assert.equal(video.renderer.content.videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl, '/@aajtak');
});

test('Main home Mix lockup filters by title keyword but not display-only creator channel', () => {
  const noRule = runEngine([mixRenderer()]);
  const keywordRun = runEngine([mixRenderer()], {
    filterKeywords: [keyword('Shakira')]
  });
  const channelRun = runEngine([mixRenderer()], {
    filterChannels: [{
      id: 'UC0C-w0YjGpqDXGB8IHb662A',
      handle: '@edsheeran'
    }]
  });

  assert.deepEqual(noRule.output, noRule.input);
  assert.deepEqual(noRule.messages, []);
  assert.deepEqual(keywordRun.output, { contents: [] });
  assert.deepEqual(keywordRun.messages, []);
  assert.deepEqual(channelRun.output, channelRun.input);
  assert.deepEqual(channelRun.messages, []);
});

test('Main home Mix lockup whitelist is keyword-based, not creator-channel based', () => {
  const allowKeyword = runEngine([mixRenderer()], {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Shakira')]
  });
  const allowAajTakChannel = runEngine([mixRenderer()], {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  });
  const noMatch = runEngine([mixRenderer()], {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }]
  });

  assert.deepEqual(allowKeyword.output, allowKeyword.input);
  assert.deepEqual(allowAajTakChannel.output, { contents: [] });
  assert.deepEqual(noMatch.output, { contents: [] });
});

test('Main home video row filters by title and canonical channel with map side effects', () => {
  const noRule = runEngine([videoRenderer()]);
  const keywordRun = runEngine([videoRenderer()], {
    filterKeywords: [keyword('Holi 2026')]
  });
  const channelRun = runEngine([videoRenderer()], {
    filterChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  });

  assert.deepEqual(noRule.output, noRule.input);
  assert.deepEqual(noRule.messages, expectedVideoMessages());
  assert.deepEqual(keywordRun.output, { contents: [] });
  assert.deepEqual(keywordRun.messages, expectedVideoMessages());
  assert.deepEqual(channelRun.output, { contents: [] });
  assert.deepEqual(channelRun.messages, expectedVideoMessages());
});

test('Main home rich-grid sibling behavior separates video authority from Mix display metadata', () => {
  const inputRenderers = [videoRenderer(), mixRenderer()];
  const blockChannel = runEngine(inputRenderers, {
    filterChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  });
  const whitelistChannel = runEngine(inputRenderers, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  });
  const whitelistKeyword = runEngine(inputRenderers, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Shakira')]
  });

  assert.deepEqual(blockChannel.output, {
    contents: [{ richItemRenderer: mixRenderer() }]
  });
  assert.deepEqual(whitelistChannel.output, {
    contents: [{ richItemRenderer: videoRenderer() }]
  });
  assert.deepEqual(whitelistKeyword.output, {
    contents: [{ richItemRenderer: mixRenderer() }]
  });
});

test('seed home browse fetch bypasses no-work/disabled and processes active list modes', async () => {
  const emptyBlocklist = await runHomeFetch();
  const activeBlocklist = await runHomeFetch({
    filterKeywords: [keyword('Holi 2026')]
  });
  const whitelist = await runHomeFetch({
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UCt4t-jeY85JegMlZ-E5UWtA',
      handle: '@aajtak'
    }]
  });
  const disabled = await runHomeFetch({ enabled: false });

  assert.match(JSON.stringify(emptyBlocklist.body), /RD41ZY18JqI2A/);
  assert.equal(emptyBlocklist.runtime.calls.responseJson.length, 1);
  assert.equal(emptyBlocklist.runtime.calls.jsonStringify.length, 0);
  assert.equal(emptyBlocklist.runtime.calls.harvestOnly.length, 0);
  assert.equal(emptyBlocklist.runtime.calls.processData.length, 0);

  assert.equal(activeBlocklist.runtime.calls.harvestOnly.length, 0);
  assert.equal(activeBlocklist.runtime.calls.processData.length, 1);
  assert.equal(activeBlocklist.runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');

  assert.equal(whitelist.runtime.calls.harvestOnly.length, 0);
  assert.equal(whitelist.runtime.calls.processData.length, 1);
  assert.equal(whitelist.runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');

  assert.equal(disabled.runtime.calls.responseJson.length, 1);
  assert.equal(disabled.runtime.calls.jsonStringify.length, 0);
  assert.equal(disabled.runtime.calls.harvestOnly.length, 0);
  assert.equal(disabled.runtime.calls.processData.length, 0);
});

test('Main home rich-grid future authority contracts are absent from runtime source today', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const runtime = productRuntimeSource();

  assert.match(filterLogic, /\n\s*richItemRenderer:\s*\{/);
  assert.match(filterLogic, /\n\s*lockupViewModel:\s*\{/);
  assert.match(filterLogic, /\n\s*videoRenderer:\s*BASE_VIDEO_RULES/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
