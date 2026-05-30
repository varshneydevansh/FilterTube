import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixturePath = 'tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json';
const auditDocPath = 'docs/audit/FILTERTUBE_MAIN_SEARCH_UNIVERSAL_WATCH_CARD_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function loadCapture() {
  return JSON.parse(read(fixturePath));
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
      universalWatchCardRenderer: capture.renderer
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

test('main search universal watch-card audit doc records fixture and current verdicts', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    '`strange_ytInitialData.json` is not direct JSON',
    '`universalWatchCardRenderer` wrapper filtering works today',
    'Direct `watchCardHeroVideoRenderer` remains a separate direct-renderer gap',
    'Direct `watchCardRichHeaderRenderer` remains a separate direct-renderer gap',
    'No product runtime symbol exists yet for'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit doc phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('main-search-universal-watch-card-current-behavior.test.mjs'));
  assert.ok(traceability.includes('main-search-universal-watch-card-renderer.json'));
  assert.ok(convergence.includes('Main search universal watch-card'));
  assert.ok(ledger.includes('Main search universal watch-card addendum'));
});

test('raw strange ytInitialData is escaped container evidence, not direct JSON', () => {
  const raw = read('strange_ytInitialData.json');
  const capture = loadCapture();

  assert.throws(() => JSON.parse(raw));
  assert.match(raw.slice(0, 80), /var ytInitialData = '\\x7b\\x22responseContext/);
  assert.equal(countToken(raw, 'universalWatchCardRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardRichHeaderRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardHeroVideoRenderer'), 2);
  assert.equal(countToken(raw, 'searchRefinementCardRenderer'), 21);
  assert.equal(countToken(raw, 'compactChannelRenderer'), 2);

  assert.equal(capture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(capture.provenance.rendererType, 'universalWatchCardRenderer');
  assert.equal(capture.provenance.rawContainer, 'var ytInitialData string literal with escaped JSON; not direct JSON');
  assert.match(JSON.stringify(capture.renderer), /UCm9VWKAFz0aXpuEHPHMae7w/);
  assert.match(JSON.stringify(capture.renderer), /@NYUSHAmusic/);
  assert.match(JSON.stringify(capture.renderer), /XuHro6TjXww/);
});

test('universalWatchCardRenderer passes through with no active rules and no map side effects', () => {
  const { input, output, messages } = runEngine({});

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(messages, []);
});

test('universalWatchCardRenderer blocks by captured header title or channel identity', () => {
  const keywordRun = runEngine({
    filterKeywords: [keyword('Nyusha')]
  });
  const channelRun = runEngine({
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });

  assert.deepEqual(plain(keywordRun.output), { contents: [] });
  assert.deepEqual(plain(channelRun.output), { contents: [] });
});

test('universalWatchCardRenderer whitelist keeps matching identity and removes nonmatching identity', () => {
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
  assert.deepEqual(plain(noMatchRun.output), { contents: [] });
});

test('real watch-card hero video id sits under navigationEndpoint, while direct child renderers remain gaps', () => {
  const capture = loadCapture();
  const logic = read('js/filter_logic.js');
  const rulesBlock = logic.slice(
    logic.indexOf('universalWatchCardRenderer: {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );
  const directRulesBlock = logic.slice(
    logic.indexOf('const FILTER_RULES = {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );

  assert.equal(
    capture.renderer.callToAction.watchCardHeroVideoRenderer.navigationEndpoint.watchEndpoint.videoId,
    'XuHro6TjXww'
  );
  assert.match(rulesBlock, /callToAction\.watchCardHeroVideoRenderer\.watchEndpoint\.videoId/);
  assert.doesNotMatch(rulesBlock, /callToAction\.watchCardHeroVideoRenderer\.navigationEndpoint\.watchEndpoint\.videoId/);

  for (const renderer of [
    'watchCardHeroVideoRenderer',
    'watchCardRichHeaderRenderer',
    'watchCardRHPanelVideoRenderer'
  ]) {
    assert.doesNotMatch(directRulesBlock, new RegExp(`\\n\\s*${renderer}\\s*:`));
  }
});
