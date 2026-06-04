import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideSearchShelvesContract',
  'jsonFirstHideSearchShelvesDecisionReport',
  'jsonFirstSearchShelvesRendererInventoryPolicy',
  'jsonFirstSearchShelvesJsonDomParityReport',
  'jsonFirstSearchShelvesDomOnlyPolicy',
  'jsonFirstSearchShelvesNoWorkBudget',
  'jsonFirstSearchShelvesCacheInvalidationReport',
  'jsonFirstSearchShelvesRoutePolicy',
  'jsonFirstSearchShelvesSettingsParityReport',
  'jsonFirstSearchShelvesFixtureProvenance',
  'jsonFirstSearchShelvesMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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
    hideSearchShelves: false,
    videoChannelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function run(payload, overrides = {}, options = {}) {
  const { engine } = loadFilterTubeEngine(options);
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-search-shelves-boundary-fixture'));
}

function searchVideo(title = 'Keep search row', videoId = 'SEARCHKEEP') {
  return {
    videoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function searchShelf(title = 'People also watched', child = searchVideo('Calm child', 'SEARCHCHILD1')) {
  return {
    shelfRenderer: {
      header: {
        shelfHeaderRenderer: {
          title: { simpleText: title }
        }
      },
      content: {
        verticalListRenderer: {
          items: [child]
        }
      }
    }
  };
}

function richSearchShelf(title = 'Related searches', child = searchVideo('Calm rich child', 'SEARCHRICH1')) {
  return {
    richShelfRenderer: {
      title: { runs: [{ text: title }] },
      contents: [child]
    }
  };
}

function searchPayload(items = [searchShelf(), richSearchShelf(), searchVideo()]) {
  return {
    contents: {
      twoColumnSearchResultsRenderer: {
        primaryContents: {
          sectionListRenderer: {
            contents: items
          }
        }
      }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const settingsShared = read('js/settings_shared.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');
  const bgGetStart = background.indexOf('function getCompiledSettings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    settingsShared,
    bridgeSettings,
    filterShelfRenderer: sliceBetween(
      filterLogic,
      '        shelfRenderer: {',
      '        lockupViewModel: {'
    ),
    filterRichShelfRenderer: sliceBetween(
      filterLogic,
      '        richShelfRenderer: {',
      '\n\n        // ------------------------------------------------------------------\n        // Channel experience'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n    function hasNetworkJsonWork'
    ),
    seedSearchSkip: sliceBetween(
      seed,
      '        const searchActionCollections = data.onResponseReceivedCommands || data.onResponseReceivedActions || data.onResponseReceivedEndpoints;',
      '\n\n        if (isChannelPath)'
    ),
    domSearchShelvesCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideSearchShelves) {',
      "\n\n    style.textContent = rules.join"
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    bgStorageReadKeys: sliceBetween(
      background,
      '        browserAPI.storage.local.get([',
      '        ], (items) => {',
      bgGetStart
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    sharedSearchShelvesCompile: sliceBetween(
      settingsShared,
      '            hideSearchShelves: !!hideSearchShelves,',
      '\n            contentFilters'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideSearchShelves boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior changed for no-work gating/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, search-shelves filtering patch/);
  assert.match(doc, /hideSearchShelves boundary source files: 6/);
  assert.match(doc, /runtime hideSearchShelves fixtures: 7/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6711 | 301840 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideSearchShelves source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic shelfRenderer rule block', blocks.filterShelfRenderer, 3, 103],
    ['filter_logic richShelfRenderer rule block', blocks.filterRichShelfRenderer, 3, 93],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 464],
    ['seed search skip block', blocks.seedSearchSkip, 48, 2431],
    ['DOM fallback search-shelves CSS rules block', blocks.domSearchShelvesCssRules, 8, 314],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared search-shelves compile block', blocks.sharedSearchShelvesCompile, 1, 51],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideSearchShelves'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideSearchShelves'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideSearchShelves'), 2);
  assert.equal(countLiteral(blocks.background, 'hideSearchShelves'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideSearchShelves'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideSearchShelves'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'shelfRenderer'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'richShelfRenderer'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'gridShelfViewModel'), 0);
  assert.equal(countLiteral(blocks.seed, 'shelfRenderer'), 1);
  assert.equal(countLiteral(blocks.seed, 'richShelfRenderer'), 1);
  assert.equal(countLiteral(blocks.seed, 'gridShelfViewModel'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-shelf-renderer'), 13);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-horizontal-card-list-renderer'), 2);
  assert.equal(countLiteral(blocks.domSearchShelvesCssRules, 'ytd-shelf-renderer'), 1);
  assert.equal(countLiteral(blocks.domSearchShelvesCssRules, 'ytd-horizontal-card-list-renderer'), 1);
  assert.equal(countLiteral(blocks.domSearchShelvesCssRules, '#primary > .ytd-two-column-search-results-renderer'), 2);

  assert.match(doc, /filter_logic total hideSearchShelves tokens: 0/);
  assert.match(doc, /seed total hideSearchShelves tokens: 0/);
  assert.match(doc, /DOM fallback total hideSearchShelves tokens: 2/);
  assert.match(doc, /background total hideSearchShelves tokens: 12/);
  assert.match(doc, /settings_shared total hideSearchShelves tokens: 23/);
  assert.match(doc, /bridge_settings total hideSearchShelves token: 1/);
  assert.match(doc, /filter_logic total shelfRenderer tokens: 2/);
  assert.match(doc, /filter_logic total richShelfRenderer tokens: 2/);
  assert.match(doc, /filter_logic total gridShelfViewModel tokens: 0/);
  assert.match(doc, /seed total shelfRenderer token: 1/);
  assert.match(doc, /seed total richShelfRenderer token: 1/);
  assert.match(doc, /seed total gridShelfViewModel token: 1/);
  assert.match(doc, /DOM fallback total ytd-shelf-renderer tokens: 13/);
  assert.match(doc, /DOM fallback total ytd-horizontal-card-list-renderer tokens: 2/);
  assert.match(doc, /DOM fallback search-shelves CSS block ytd-shelf-renderer tokens: 1/);
  assert.match(doc, /DOM fallback search-shelves CSS block ytd-horizontal-card-list-renderer tokens: 1/);
  assert.match(doc, /DOM fallback search-shelves CSS block #primary > \.ytd-two-column-search-results-renderer tokens: 2/);
});

test('hideSearchShelves does not remove JSON search shelves or neighboring rows in filter_logic', () => {
  const payload = searchPayload();

  assert.deepEqual(run(payload, { hideSearchShelves: true }), plain(payload));
});

test('ordinary keyword rules can remove matching shelf containers while hideSearchShelves is enabled', () => {
  const payload = searchPayload([
    searchShelf('Block shelf', searchVideo('Neutral child inside blocked shelf', 'SEARCHCHILD2')),
    richSearchShelf('Keep rich shelf'),
    searchVideo('Keep search row', 'SEARCHKEEP2')
  ]);
  const result = run(payload, {
    hideSearchShelves: true,
    filterKeywords: [{ pattern: 'block shelf', flags: 'i' }]
  });

  const contents = result.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
  assert.equal(contents.length, 2);
  assert.equal(contents[0].richShelfRenderer.title.runs[0].text, 'Keep rich shelf');
  assert.equal(contents[1].videoRenderer.videoId, 'SEARCHKEEP2');
});

test('search hideSearchShelves alone bypasses JSON body work without a hideSearchShelves decision', async () => {
  const payload = searchPayload();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/results',
    payload
  });
  runtime.window.filterTube.updateSettings(settings({ hideSearchShelves: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?query=filtertube');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('search fetch enters processData when ordinary JSON rules are active with hideSearchShelves', async () => {
  const payload = searchPayload();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/results',
    payload
  });
  runtime.window.filterTube.updateSettings(settings({
    hideSearchShelves: true,
    filterKeywords: [{ pattern: 'block shelf', flags: 'i' }]
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?query=filtertube');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
});

test('source proof pins DOM-owned search-shelves hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideSearchShelves/);
  assert.match(blocks.filterShelfRenderer, /shelfRenderer/);
  assert.match(blocks.filterRichShelfRenderer, /richShelfRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /gridShelfViewModel/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideSearchShelves/);
  assert.match(blocks.seedSearchSkip, /item\?\.gridShelfViewModel/);
  assert.match(blocks.seedSearchSkip, /item\?\.shelfRenderer/);
  assert.match(blocks.domSearchShelvesCssRules, /#primary > \.ytd-two-column-search-results-renderer ytd-shelf-renderer/);
  assert.match(blocks.domSearchShelvesCssRules, /#primary > \.ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer/);
  assert.match(blocks.domActiveBooleanKeys, /'hideSearchShelves'/);
  assert.match(blocks.bgStorageReadKeys, /'hideSearchShelves'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideSearchShelves = boolFromV4\('hideSearchShelves', items\.hideSearchShelves \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideSearchShelves'/);
  assert.match(blocks.sharedSettingsKeys, /'hideSearchShelves'/);
  assert.match(blocks.sharedSearchShelvesCompile, /hideSearchShelves: !!hideSearchShelves/);
  assert.match(blocks.bridgeRefreshKeys, /'hideSearchShelves'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideSearchShelves` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideSearchShelves`/);
  assert.match(doc, /Search shelf JSON sections pass through unchanged when only\s+`hideSearchShelves` is enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a matching `shelfRenderer`/);
  assert.match(doc, /`\/youtubei\/v1\/search` bypasses JSON body work and does not call `processData` with\s+only `hideSearchShelves` enabled/);
  assert.match(doc, /`\/youtubei\/v1\/search` enters `processData` when an ordinary keyword rule\s+is active with `hideSearchShelves` enabled/);
  assert.match(doc, /DOM fallback owns\s+`#primary > \.ytd-two-column-search-results-renderer ytd-shelf-renderer`/);
  assert.match(doc, /`#primary > \.ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
