import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const rawPath = 'strange_ytInitialData.json';
const fixturePath = 'tests/runtime/fixtures/captures/main-search-refinement-card-renderer.json';
const universalFixturePath = 'tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24.md';

const futureAuthorityTokens = [
  'mainSearchRefinementCardContract',
  'mainSearchRefinementCardFixtureAdmissionReport',
  'mainSearchRefinementCardDecisionReport',
  'mainSearchRefinementCardWhitelistPolicy',
  'mainSearchRefinementCardSiblingLeakReport',
  'mainSearchRefinementCardSeedNoWorkBudget',
  'mainSearchRefinementCardEscapedYtInitialDataAdmissionReport',
  'mainSearchRefinementCardJsonFirstOptimizationBudget'
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

function loadFixture(file = fixturePath) {
  return JSON.parse(read(file));
}

function refinementInput() {
  return {
    contents: [{
      searchRefinementCardRenderer: plain(loadFixture().renderer)
    }]
  };
}

function horizontalRefinementInput() {
  return {
    contents: [{
      horizontalCardListRenderer: {
        cards: [{
          searchRefinementCardRenderer: plain(loadFixture().renderer)
        }]
      }
    }]
  };
}

function siblingInput() {
  return {
    contents: [
      { universalWatchCardRenderer: plain(loadFixture(universalFixturePath).renderer) },
      { searchRefinementCardRenderer: plain(loadFixture().renderer) }
    ]
  };
}

function runEngine(input, overrides = {}) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    settings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { input, output: plain(output), messages: plain(harness.messages) };
}

function searchFetchPayload() {
  return {
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          itemSectionRenderer: {
            contents: [{
              horizontalCardListRenderer: {
                cards: [{
                  searchRefinementCardRenderer: plain(loadFixture().renderer)
                }]
              }
            }]
          }
        }]
      }
    }]
  };
}

async function runSearchFetch(overrides = {}) {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchFetchPayload()
  });
  runtime.window.filterTube.updateSettings(settings(overrides));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  const body = await response.json();
  return { runtime, body };
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

test('Main search refinement card audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md'
  ].map(read);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not first-class Main search JSON filter authority/);
  assert.match(doc, /search refinement card is now a no-work boundary for empty and disabled\s+search fetches/);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('main-search-refinement-card-current-behavior.test.mjs'));
    assert.ok(ledger.includes('main-search-refinement-card-renderer.json'));
    assert.match(ledger, /searchRefinementCardRenderer|search refinement/);
  }

  assert.equal(lineCount(raw), 141);
  assert.equal(Buffer.byteLength(raw), 244201);
  assert.equal(sha256(rawPath), '01e6010a3f46041c3bcb3b6b399e871b5aa2fc28a0f234eca237226162b476b7');
  assert.equal(lineCount(fixtureText), 85);
  assert.equal(Buffer.byteLength(fixtureText), 2467);
  assert.equal(sha256(fixturePath), '4ea0a59ef1d9e905b2c53b8f030d1116e07bafe76093edd6e167130facc291d9');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'searchRefinementCardRenderer');
  assert.equal(fixture.provenance.route, 'search');
});

test('raw strange ytInitialData search refinement evidence is escaped container evidence', () => {
  const raw = read(rawPath);
  const fixture = loadFixture();

  assert.throws(() => JSON.parse(raw));
  assert.match(raw.slice(0, 80), /var ytInitialData = '\\x7b\\x22responseContext/);
  assert.equal(countToken(raw, 'searchRefinementCardRenderer'), 21);
  assert.equal(countToken(raw, 'universalWatchCardRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardRichHeaderRenderer'), 2);
  assert.equal(countToken(raw, 'watchCardHeroVideoRenderer'), 2);
  assert.equal(countToken(raw, 'compactChannelRenderer'), 2);

  assert.equal(fixture.renderer.query.runs[0].text, 'Solaris Es');
  assert.equal(fixture.renderer.searchEndpoint.watchPlaylistEndpoint.playlistId, 'OLAK5uy_nTVbEFZIQVr5xnvka7ZwGGylVWlZjwPnk');
  assert.equal(fixture.renderer.bylineText.runs[0].text, 'Nyusha');
  assert.equal(fixture.renderer.bylineText.runs[0].navigationEndpoint.browseEndpoint.browseId, 'UCm9VWKAFz0aXpuEHPHMae7w');
});

test('searchRefinementCardRenderer passes through no-rule and matching blocklist rules today', () => {
  const input = refinementInput();
  const noRule = runEngine(input);
  const keywordRun = runEngine(input, {
    filterKeywords: [keyword('Solaris'), keyword('Nyusha')]
  });
  const channelRun = runEngine(input, {
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '/channel/UCm9VWKAFz0aXpuEHPHMae7w'
    }]
  });

  assert.deepEqual(noRule.output, plain(input));
  assert.deepEqual(keywordRun.output, plain(input));
  assert.deepEqual(channelRun.output, plain(input));
  assert.deepEqual(noRule.messages, []);
  assert.deepEqual(keywordRun.messages, []);
  assert.deepEqual(channelRun.messages, []);
});

test('horizontalCardListRenderer preserves real search refinement children with matching rules', () => {
  const input = horizontalRefinementInput();
  const run = runEngine(input, {
    filterKeywords: [keyword('Solaris')],
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '/channel/UCm9VWKAFz0aXpuEHPHMae7w'
    }]
  });

  assert.deepEqual(run.output, plain(input));
  assert.deepEqual(run.messages, []);
});

test('searchRefinementCardRenderer passes through whitelist allow and whitelist nonmatch modes today', () => {
  const input = refinementInput();
  const allowRun = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '/channel/UCm9VWKAFz0aXpuEHPHMae7w'
    }]
  });
  const noMatchRun = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }],
    whitelistKeywords: [keyword('unrelated')]
  });

  assert.deepEqual(allowRun.output, plain(input));
  assert.deepEqual(noMatchRun.output, plain(input));
});

test('matching rules remove supported search watch-card sibling while preserving refinement card', () => {
  const input = siblingInput();
  const blocklistRun = runEngine(input, {
    filterChannels: [{
      id: 'UCm9VWKAFz0aXpuEHPHMae7w',
      handle: '@NYUSHAmusic'
    }]
  });
  const whitelistRun = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }]
  });

  assert.deepEqual(blocklistRun.output, {
    contents: [
      { searchRefinementCardRenderer: loadFixture().renderer }
    ]
  });
  assert.deepEqual(whitelistRun.output, {
    contents: [
      { searchRefinementCardRenderer: loadFixture().renderer }
    ]
  });
});

test('seed search fetch no-work policy bypasses empty and disabled search while treating active list modes as work', async () => {
  const emptyBlocklist = await runSearchFetch();
  const activeBlocklist = await runSearchFetch({
    filterKeywords: [keyword('Solaris')]
  });
  const whitelist = await runSearchFetch({
    listMode: 'whitelist',
    whitelistChannels: [{
      id: 'UC0000000000000000000000',
      handle: '@elsewhere'
    }]
  });
  const disabled = await runSearchFetch({ enabled: false });

  assert.match(JSON.stringify(emptyBlocklist.body), /Solaris Es/);
  assert.equal(emptyBlocklist.runtime.calls.responseJson.length, 1);
  assert.equal(emptyBlocklist.runtime.calls.jsonStringify.length, 0);
  assert.equal(emptyBlocklist.runtime.calls.harvestOnly.length, 0);
  assert.equal(emptyBlocklist.runtime.calls.processData.length, 0);

  assert.equal(activeBlocklist.runtime.calls.harvestOnly.length, 0);
  assert.equal(activeBlocklist.runtime.calls.processData.length, 1);
  assert.equal(activeBlocklist.runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');

  assert.equal(whitelist.runtime.calls.harvestOnly.length, 0);
  assert.equal(whitelist.runtime.calls.processData.length, 1);
  assert.equal(whitelist.runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');

  assert.equal(disabled.runtime.calls.responseJson.length, 1);
  assert.equal(disabled.runtime.calls.jsonStringify.length, 0);
  assert.equal(disabled.runtime.calls.harvestOnly.length, 0);
  assert.equal(disabled.runtime.calls.processData.length, 0);
});

test('search refinement direct rule and future authority contracts are absent today', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const directRulesBlock = filterLogic.slice(
    filterLogic.indexOf('const FILTER_RULES = {'),
    filterLogic.indexOf('relatedChipCloudRenderer: {')
  );
  const jsonSectionIndex = read('docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md');
  const runtime = productRuntimeSource();

  assert.doesNotMatch(directRulesBlock, /\n\s*searchRefinementCardRenderer\s*:/);
  assert.match(jsonSectionIndex, /`searchRefinementCardRenderer` \| `unsupported\/direct-gap`/);
  assert.match(jsonSectionIndex, /FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
