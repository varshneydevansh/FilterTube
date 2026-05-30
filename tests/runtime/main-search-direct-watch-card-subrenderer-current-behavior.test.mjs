import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixturePath = 'tests/runtime/fixtures/captures/main-search-direct-watch-card-rich-hero-subrenderers.json';
const auditDocPath = 'docs/audit/FILTERTUBE_MAIN_SEARCH_DIRECT_WATCH_CARD_SUBRENDERER_CURRENT_BEHAVIOR_2026-05-23.md';

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

function directInput() {
  return { contents: loadCapture().directItems };
}

function wrapperInput() {
  return { contents: [loadCapture().wrapperControl] };
}

function runEngine(input, settings) {
  const { engine, messages } = loadFilterTubeEngine();
  const output = engine.processData(input, baseSettings(settings), fixturePath);
  return { input, output, messages };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function countToken(source, token) {
  return source.split(token).length - 1;
}

test('main search direct watch-card subrenderer audit doc records fixture and current verdicts', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    'real nested watch-card child renderer objects as direct top-level renderer keys',
    'not a raw-direct renderer observation',
    'Direct rich-header and hero subrenderers pass through matching blocklist rules today',
    'Wrapper filtering works for the same child values',
    'Direct `watchCardRHPanelVideoRenderer` remains unextracted'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit doc phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('main-search-direct-watch-card-subrenderer-current-behavior.test.mjs'));
  assert.ok(traceability.includes('main-search-direct-watch-card-rich-hero-subrenderers.json'));
  assert.ok(convergence.includes('Main search direct watch-card subrenderer'));
  assert.ok(ledger.includes('Main search direct watch-card subrenderer addendum'));
});

test('raw strange ytInitialData has rich-header and hero child renderers but no direct RHS panel proof', () => {
  const raw = read('strange_ytInitialData.json');
  const capture = loadCapture();

  assert.throws(() => JSON.parse(raw));
  assert.equal(countToken(raw, 'universalWatchCardRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardRichHeaderRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardHeroVideoRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardRHPanelVideoRenderer'), 0);

  assert.equal(capture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(capture.provenance.rendererType, 'directWatchCardRichHeaderHeroSubrenderers');
  assert.equal(capture.provenance.directRootObservedInSource, false);
  assert.match(capture.provenance.directAdmissionPurpose, /direct top-level renderer keys/);
  assert.match(JSON.stringify(capture.directItems), /UCm9VWKAFz0aXpuEHPHMae7w/);
  assert.match(JSON.stringify(capture.directItems), /XuHro6TjXww/);
});

test('direct watch-card rich-header and hero subrenderers pass through with no active rules', () => {
  const input = directInput();
  const { output, messages } = runEngine(input, {});

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(messages, []);
});

test('direct watch-card rich-header and hero subrenderers pass through matching blocklist rules', () => {
  const input = directInput();
  const keywordRun = runEngine(input, {
    filterKeywords: [keyword('Nyusha'), keyword('YouTube Mix')]
  });
  const channelRun = runEngine(input, {
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });

  assert.deepEqual(plain(keywordRun.output), plain(input));
  assert.deepEqual(plain(channelRun.output), plain(input));
});

test('direct watch-card rich-header and hero subrenderers pass through whitelist nonmatch mode', () => {
  const input = directInput();
  const { output } = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }],
    whitelistKeywords: [keyword('unrelated')]
  });

  assert.deepEqual(plain(output), plain(input));
});

test('universal wrapper filters the same real child values while direct presentation does not', () => {
  const wrapper = wrapperInput();
  const blocklistRun = runEngine(wrapper, {
    filterKeywords: [keyword('Nyusha')],
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });
  const whitelistRun = runEngine(wrapper, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }]
  });

  assert.deepEqual(plain(blocklistRun.output), { contents: [] });
  assert.deepEqual(plain(whitelistRun.output), { contents: [] });
});

test('direct watch-card subrenderer source gap and hero video path boundary are pinned', () => {
  const logic = read('js/filter_logic.js');
  const rulesBlock = logic.slice(
    logic.indexOf('const FILTER_RULES = {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );
  const universalBlock = logic.slice(
    logic.indexOf('universalWatchCardRenderer: {'),
    logic.indexOf('relatedChipCloudRenderer: {')
  );
  const capture = loadCapture();

  assert.match(rulesBlock, /watchCardCompactVideoRenderer:\s*BASE_VIDEO_RULES/);
  assert.match(rulesBlock, /universalWatchCardRenderer:\s*\{/);
  for (const renderer of [
    'watchCardRichHeaderRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer'
  ]) {
    assert.doesNotMatch(rulesBlock, new RegExp(`\\n\\s*${renderer}\\s*:`));
  }

  assert.equal(
    capture.directItems[1].watchCardHeroVideoRenderer.navigationEndpoint.watchEndpoint.videoId,
    'XuHro6TjXww'
  );
  assert.match(universalBlock, /callToAction\.watchCardHeroVideoRenderer\.watchEndpoint\.videoId/);
  assert.doesNotMatch(universalBlock, /callToAction\.watchCardHeroVideoRenderer\.navigationEndpoint\.watchEndpoint\.videoId/);
});

test('direct watch-card subrenderer authority tokens are not implemented in product runtime', () => {
  const productSource = [
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js',
    'js/content_bridge.js'
  ].map(read).join('\n');

  for (const token of [
    'mainSearchDirectWatchCardSubrendererContract',
    'directWatchCardSubrendererDecisionReport',
    'directWatchCardSubrendererWhitelistPolicy',
    'watchCardHeroNavigationEndpointPolicy',
    'watchCardRhsPanelCaptureAuthority',
    'watchCardJsonFirstOptimizationBudget'
  ]) {
    assert.doesNotMatch(productSource, new RegExp(token));
  }
});
