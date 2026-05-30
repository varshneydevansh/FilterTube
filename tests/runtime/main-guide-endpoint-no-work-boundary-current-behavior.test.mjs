import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const rawPath = 'guide?prettyPrint=false.json';
const fixturePath = 'tests/runtime/fixtures/captures/main-guide-entry-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_MAIN_GUIDE_ENDPOINT_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'mainGuideEndpointNoWorkContract',
  'mainGuideEndpointDecisionReport',
  'mainGuideEntryRendererFilterRulePromotion',
  'mainGuideDisabledNoParseBudget',
  'mainGuideEmptyBlocklistNoWorkBudget',
  'mainGuideWhitelistNoWorkPolicy',
  'mainGuideChannelMapSideEffectBudget',
  'mainGuideJsonFirstAuthorityGate'
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
    hideSubscriptions: false,
    hideMoreFromYouTube: false,
    hideExploreTrending: false,
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

function guideEntryInput() {
  const fixture = loadFixture();
  return {
    fixture,
    input: {
      items: [{
        guideEntryRenderer: plain(fixture.renderer)
      }]
    }
  };
}

function runEngine(overrides = {}) {
  const { fixture, input } = guideEntryInput();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    settings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { fixture, input, output: plain(output), messages: plain(harness.messages) };
}

async function runGuideFetch(overrides = {}, payload = guideFetchPayload()) {
  const runtime = loadSeedRuntime({
    pathname: '/',
    payload
  });
  runtime.window.filterTube.updateSettings(settings(overrides));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');
  const body = await response.json();
  return { runtime, body };
}

function guideFetchPayload() {
  return {
    items: [{
      guideSubscriptionsSectionRenderer: {
        items: [{
          guideEntryRenderer: {
            formattedTitle: { simpleText: 'DrGameria' },
            navigationEndpoint: {
              commandMetadata: {
                webCommandMetadata: {
                  url: '/@DrJango1',
                  apiUrl: '/youtubei/v1/browse'
                }
              },
              browseEndpoint: {
                browseId: 'UC4REwc30LXHzKSkpqSwhR-Q',
                canonicalBaseUrl: '/@DrJango1'
              }
            }
          }
        }]
      }
    }]
  };
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

test('Main guide endpoint no-work boundary doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /guide\s+endpoint has a no-work path for empty and disabled Main settings/);
  assert.match(doc, /not first-class guide JSON filter authority/);

  assert.equal(lineCount(raw), 5508);
  assert.equal(Buffer.byteLength(raw), 231459);
  assert.equal(sha256(rawPath), 'ab931c49096c2307063d315cfa06f7827df51d0017cd3db5ffdbb9422412a022');
  assert.equal(lineCount(fixtureText), 49);
  assert.equal(Buffer.byteLength(fixtureText), 1337);
  assert.equal(sha256(fixturePath), 'd27f1181c569da3f9424841f961b1cdf8ea46681ac61c0c01c5795206a9e201f');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'guideEntryRenderer');
  assert.equal(fixture.provenance.route, 'guide');
});

test('Main guide entry fixture carries channel identity but no direct guideEntryRenderer rule exists', () => {
  const renderer = loadFixture().renderer;
  const filterLogic = read('js/filter_logic.js');
  const serialized = JSON.stringify(renderer);

  assert.equal(renderer.formattedTitle.simpleText, 'DrGameria');
  assert.equal(renderer.navigationEndpoint.browseEndpoint.browseId, 'UC4REwc30LXHzKSkpqSwhR-Q');
  assert.equal(renderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl, '/@DrJango1');
  assert.equal(renderer.entryData.guideEntryData.guideEntryId, 'UC4REwc30LXHzKSkpqSwhR-Q');
  assert.match(serialized, /New content available/);
  assert.doesNotMatch(filterLogic, /\n\s*guideEntryRenderer\s*:/);
});

test('direct engine guideEntryRenderer no-rule and disabled processing preserves row but harvests channel map', () => {
  for (const overrides of [{}, { enabled: false }]) {
    const run = runEngine(overrides);

    assert.deepEqual(run.output, run.input);
    assert.deepEqual(run.messages, [{
      type: 'FilterTube_UpdateChannelMap',
      payload: [{
        id: 'UC4REwc30LXHzKSkpqSwhR-Q',
        handle: '@DrJango1'
      }],
      source: 'filter_logic'
    }]);
  }
});

test('blocklist whitelist and DOM-owned guide controls preserve guideEntryRenderer today', () => {
  const blockRun = runEngine({
    filterKeywords: [keyword('DrGameria')],
    filterChannels: [{
      id: 'UC4REwc30LXHzKSkpqSwhR-Q',
      handle: '@DrJango1'
    }]
  });
  const whitelistRun = runEngine({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('unrelated allowed keyword')],
    whitelistChannels: [{ id: 'UC0000000000000000000000' }]
  });
  const subscriptionsRun = runEngine({ hideSubscriptions: true });

  assert.deepEqual(blockRun.output, blockRun.input);
  assert.deepEqual(whitelistRun.output, whitelistRun.input);
  assert.deepEqual(subscriptionsRun.output, subscriptionsRun.input);
  assert.equal(blockRun.messages.length, 1);
  assert.equal(whitelistRun.messages.length, 1);
  assert.equal(subscriptionsRun.messages.length, 1);
});

test('guide fetch with empty blocklist bypasses JSON parse and engine work', async () => {
  const { runtime, body } = await runGuideFetch();

  assert.match(JSON.stringify(body), /DrGameria/);
  assert.equal(runtime.calls.fetch.length, 1);
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('guide fetch with filtering disabled bypasses JSON parse and engine work', async () => {
  const { runtime, body } = await runGuideFetch({ enabled: false });

  assert.match(JSON.stringify(body), /DrGameria/);
  assert.equal(runtime.calls.fetch.length, 1);
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('guide fetch whitelist still calls processData because allow-list mode is active JSON work', async () => {
  const { runtime } = await runGuideFetch({ listMode: 'whitelist' });

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/guide');
  assert.equal(runtime.calls.jsonStringify.length, 1);
});

test('guide-DOM-only controls bypass JSON parse and engine work', async () => {
  for (const overrides of [{ hideSubscriptions: true }, { hideMoreFromYouTube: true }, { hideExploreTrending: true }]) {
    const { runtime } = await runGuideFetch(overrides);

    assert.equal(runtime.calls.harvestOnly.length, 0);
    assert.equal(runtime.calls.processData.length, 0);
    assert.equal(runtime.calls.responseJson.length, 1);
    assert.equal(runtime.calls.jsonStringify.length, 0);
  }
});

test('Main guide endpoint no-work boundary is linked from ledgers without closing guide no-work', () => {
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('main-guide-endpoint-no-work-boundary-current-behavior.test.mjs'));
    assert.ok(ledger.includes('main-guide-entry-renderer.json'));
    assert.match(ledger, /guide endpoint is not a zero-work path today|full guide no-work proof remains incomplete/);
    assert.match(ledger, /guideEntryRenderer|guide no-work|disabled\/empty endpoint work proof/);
  }
});

test('future Main guide endpoint no-work authority tokens are absent from runtime source today', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
