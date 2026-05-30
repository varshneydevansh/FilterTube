import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixturePath = 'tests/runtime/fixtures/captures/main-search-compact-channel-renderer.json';
const universalFixturePath = 'tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json';
const auditDocPath = 'docs/audit/FILTERTUBE_MAIN_SEARCH_COMPACT_CHANNEL_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function loadCapture(file = fixturePath) {
  return JSON.parse(read(file));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
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

function inputFromCapture() {
  const capture = loadCapture();
  return {
    contents: [{
      compactChannelRenderer: capture.renderer
    }]
  };
}

function runEngine(settings) {
  const { engine, messages } = loadFilterTubeEngine();
  const input = inputFromCapture();
  const output = engine.processData(input, baseSettings(settings), fixturePath);
  return { input, output, messages };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function countToken(source, token) {
  return source.split(token).length - 1;
}

test('main search compact channel audit doc records fixture and current verdicts', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    '`compactChannelRenderer` has no direct `FILTER_RULES` entry today',
    'passes through matching keyword and channel rules',
    'passes through whitelist non-match mode',
    'still queues one channel-map side effect'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit doc phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('main-search-compact-channel-current-behavior.test.mjs'));
  assert.ok(traceability.includes('main-search-compact-channel-renderer.json'));
  assert.ok(convergence.includes('Main search compact channel'));
  assert.ok(ledger.includes('Main search compact channel addendum'));
});

test('raw strange ytInitialData names compactChannelRenderer but remains escaped container evidence', () => {
  const raw = read('strange_ytInitialData.json');
  const capture = loadCapture();

  assert.throws(() => JSON.parse(raw));
  assert.match(raw.slice(0, 80), /var ytInitialData = '\\x7b\\x22responseContext/);
  assert.equal(countToken(raw, 'compactChannelRenderer'), 2);
  assert.equal(countToken(raw, 'searchRefinementCardRenderer'), 21);
  assert.equal(countToken(raw, 'universalWatchCardRenderer'), 2);

  assert.equal(capture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(capture.provenance.rendererType, 'compactChannelRenderer');
  assert.equal(capture.provenance.rawContainer, 'var ytInitialData string literal with escaped JSON; not direct JSON');
  assert.equal(capture.renderer.channelId, 'UCm9VWKAFz0aXpuEHPHMae7w');
  assert.equal(capture.renderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl, '/@NYUSHAmusic');
});

test('compactChannelRenderer passes through no-rule mode while queuing channel-map side effect', () => {
  const { input, output, messages } = runEngine({});

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(plain(messages), [{
    type: 'FilterTube_UpdateChannelMap',
    payload: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }],
    source: 'filter_logic'
  }]);
});

test('compactChannelRenderer passes through matching keyword and channel rules today', () => {
  const keywordRun = runEngine({
    filterKeywords: [keyword('NYUSHA MUSIC')]
  });
  const channelRun = runEngine({
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });

  assert.deepEqual(plain(keywordRun.output), plain(keywordRun.input));
  assert.deepEqual(plain(channelRun.output), plain(channelRun.input));
});

test('compactChannelRenderer passes through whitelist allow and whitelist non-match modes today', () => {
  const allowRun = runEngine({
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });
  const noMatchRun = runEngine({
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }]
  });

  assert.deepEqual(plain(allowRun.output), plain(allowRun.input));
  assert.deepEqual(plain(noMatchRun.output), plain(noMatchRun.input));
});

test('matching channel rule removes supported universal watch-card sibling but leaves compact channel row', () => {
  const compact = loadCapture();
  const universal = loadCapture(universalFixturePath);
  const input = {
    contents: [
      { universalWatchCardRenderer: universal.renderer },
      { compactChannelRenderer: compact.renderer }
    ]
  };
  const { engine } = loadFilterTubeEngine();
  const output = engine.processData(plain(input), baseSettings({
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  }), fixturePath);

  assert.deepEqual(plain(output), {
    contents: [
      { compactChannelRenderer: compact.renderer }
    ]
  });
});

test('compactChannelRenderer direct rule and future authority contracts are absent today', () => {
  const logic = read('js/filter_logic.js');
  const directRulesBlock = logic.slice(
    logic.indexOf('const FILTER_RULES = {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );
  const runtime = [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js'
  ].map(read).join('\n');

  assert.doesNotMatch(directRulesBlock, /\n\s*compactChannelRenderer\s*:/);

  for (const symbol of [
    'mainSearchCompactChannelContract',
    'mainSearchCompactChannelDecisionReport',
    'mainSearchCompactChannelWhitelistPolicy',
    'mainSearchCompactChannelSideEffectReport',
    'mainSearchCompactChannelSiblingLeakReport'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(symbol));
  }
});
