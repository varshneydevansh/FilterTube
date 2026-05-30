import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'YTM.json';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'ytmCompactPlaylistCreatorAuthorityContract',
  'ytmCompactPlaylistDecisionReport',
  'compactPlaylistRendererFilterRulePromotion',
  'compactPlaylistWhitelistFailClosedPolicy',
  'compactPlaylistCreatorIdentityConfidenceReport',
  'compactPlaylistJsonFirstAuthorityGate',
  'compactPlaylistSideEffectBudget',
  'compactPlaylistFixturePromotionReport'
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function inputFromFixture() {
  const fixture = loadFixture();
  return {
    fixture,
    input: {
      contents: [{
        compactPlaylistRenderer: plain(fixture.renderer)
      }]
    }
  };
}

function runFixture(overrides = {}) {
  const { fixture, input } = inputFromFixture();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { fixture, input, output: plain(output), messages: plain(harness.messages) };
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

test('YTM compact playlist creator authority doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /canonical creator-looking fields are present/);
  assert.match(doc, /not first-class JSON filter authority/);

  assert.equal(lineCount(raw), 17334);
  assert.equal(Buffer.byteLength(raw), 1312137);
  assert.equal(sha256(rawPath), '9eacd68076c85f2c0eb218ddafbd543d631dfc26ac6f761f4611bc7eb0991e8d');
  assert.equal(lineCount(fixtureText), 373);
  assert.equal(Buffer.byteLength(fixtureText), 10772);
  assert.equal(sha256(fixturePath), 'b50964a3a3a59db00f1f5235dbe6026b56326a19129177bc9d88c3dc06ed4630');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'compactPlaylistRenderer');
  assert.equal(
    fixture.provenance.extractedPath,
    'onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.8.compactPlaylistRenderer'
  );
});

test('YTM compact playlist fixture carries playlist id creator id handle and display labels', () => {
  const renderer = loadFixture().renderer;
  const serialized = JSON.stringify(renderer);

  assert.equal(renderer.playlistId, 'PLQu4efLw66leHfsIx1g8jCwfeJAMpOtNj');
  assert.equal(renderer.title.runs.map((run) => run.text).join(''), 'Mix danc pop');
  assert.equal(
    renderer.shortBylineText.runs.map((run) => run.text).join(''),
    'Fabrizzio Andres Olguin Olguin · Playlist'
  );
  assert.equal(
    renderer.longBylineText.runs.map((run) => run.text).join(''),
    'Fabrizzio Andres Olguin Olguin · Playlist'
  );
  assert.match(serialized, /UCvjXCedQa9pCEMzeLKMc20A/);
  assert.match(serialized, /\/@fabrizzioandresolguinolgui5752/);
  assert.match(serialized, /\/playlist\?list=PLQu4efLw66leHfsIx1g8jCwfeJAMpOtNj/);
  assert.match(serialized, /playlistVideoThumbnailRenderer/);
  assert.match(serialized, /menuServiceItemRenderer/);
});

test('compactPlaylistRenderer remains traversal context rather than a direct FILTER_RULES authority', () => {
  const filterLogic = read('js/filter_logic.js');
  const rendererIndex = read('docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md');
  const gapRegister = read('docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md');

  assert.match(filterLogic, /'compactPlaylistRenderer'/);
  assert.doesNotMatch(filterLogic, /\n\s*compactPlaylistRenderer\s*:/);
  assert.match(rendererIndex, /`compactPlaylistRenderer` \| `unsupported\/direct-gap`/);
  assert.match(gapRegister, /`compactPlaylistRenderer` appears in renderer allowlists/);
});

test('no-rule and disabled YTM compact playlist processing preserves rows but still harvests channel map', () => {
  for (const settings of [baseSettings(), baseSettings({ enabled: false })]) {
    const run = runFixture(settings);

    assert.deepEqual(run.output, run.input);
    assert.deepEqual(run.messages, [{
      type: 'FilterTube_UpdateChannelMap',
      payload: [{
        id: 'UCvjXCedQa9pCEMzeLKMc20A',
        handle: '@fabrizzioandresolguinolgui5752'
      }],
      source: 'filter_logic'
    }]);
  }
});

test('blocklist title and creator rules do not remove YTM compact playlist rows today', () => {
  const keywordRun = runFixture({
    filterKeywords: [keyword('Mix danc pop')]
  });
  const channelRun = runFixture({
    filterChannels: [{
      id: 'UCvjXCedQa9pCEMzeLKMc20A',
      handle: '@fabrizzioandresolguinolgui5752'
    }]
  });

  assert.deepEqual(keywordRun.output, keywordRun.input);
  assert.deepEqual(channelRun.output, channelRun.input);
  assert.equal(keywordRun.messages.length, 1);
  assert.equal(channelRun.messages.length, 1);
});

test('whitelist matching and nonmatching modes both preserve unsupported YTM compact playlist rows today', () => {
  const whitelistMissRun = runFixture({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('unrelated allowed keyword')],
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@unrelated'
    }]
  });
  const whitelistMatchRun = runFixture({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Mix danc pop')],
    whitelistChannels: [{
      id: 'UCvjXCedQa9pCEMzeLKMc20A',
      handle: '@fabrizzioandresolguinolgui5752'
    }]
  });

  assert.deepEqual(whitelistMissRun.output, whitelistMissRun.input);
  assert.deepEqual(whitelistMatchRun.output, whitelistMatchRun.input);
  assert.equal(whitelistMissRun.messages.length, 1);
  assert.equal(whitelistMatchRun.messages.length, 1);
});

test('hidePlaylistCards is DOM-owned and does not remove JSON compactPlaylistRenderer today', () => {
  const run = runFixture({
    hidePlaylistCards: true,
    filterKeywords: [],
    filterChannels: []
  });
  const doc = read('docs/audit/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');

  assert.deepEqual(run.output, run.input);
  assert.match(doc, /`hidePlaylistCards` does not remove a JSON `compactPlaylistRenderer`/);
  assert.match(doc, /DOM CSS hides classic playlist renderers/);
});

test('YTM compact playlist creator authority boundary is linked from ledgers without promotion', () => {
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs'));
    assert.ok(ledger.includes('ytm-compact-playlist-renderer.json'));
    assert.match(ledger, /canonical creator-looking fields are present|not first-class JSON filter authority/);
    assert.match(ledger, /whitelist nonmatch|whitelist fail-open|unsupported\/direct-gap/);
  }
});

test('future YTM compact playlist authority tokens are absent from runtime source today', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
