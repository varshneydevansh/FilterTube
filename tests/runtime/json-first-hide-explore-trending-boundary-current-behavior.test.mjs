import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideExploreTrendingContract',
  'jsonFirstHideExploreTrendingDecisionReport',
  'jsonFirstExploreTrendingRendererInventoryPolicy',
  'jsonFirstExploreTrendingJsonDomParityReport',
  'jsonFirstExploreTrendingDomOnlyPolicy',
  'jsonFirstExploreTrendingNoWorkBudget',
  'jsonFirstExploreTrendingCacheInvalidationReport',
  'jsonFirstExploreTrendingRoutePolicy',
  'jsonFirstExploreTrendingSettingsParityReport',
  'jsonFirstExploreTrendingFixtureProvenance',
  'jsonFirstExploreTrendingMetricArtifact'
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
    hideExploreTrending: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-explore-trending-boundary-fixture'));
}

function compactVideo(title = 'Keep me near Explore', videoId = 'EXPLORE001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function guideEntry(title, url, browseId) {
  return {
    guideEntryRenderer: {
      formattedTitle: { simpleText: title },
      navigationEndpoint: {
        browseEndpoint: {
          browseId,
          canonicalBaseUrl: url
        },
        commandMetadata: {
          webCommandMetadata: { url }
        }
      }
    }
  };
}

function exploreTrendingPayload(items = [
  guideEntry('Explore', '/feed/explore', 'FEexplore'),
  guideEntry('Trending', '/feed/trending', 'FEtrending'),
  compactVideo()
]) {
  return {
    contents: {
      twoColumnBrowseResultsRenderer: {
        tabs: [{
          tabRenderer: {
            title: 'Explore',
            content: {
              sectionListRenderer: {
                contents: items
              }
            }
          }
        }]
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
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domExploreTrendingCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideExploreTrending) {',
      '\n\n    if (settings.hideMoreFromYouTube) {'
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
    sharedExploreTrendingCompile: sliceBetween(
      settingsShared,
      '            hideExploreTrending: !!hideExploreTrending,',
      '            hideMoreFromYouTube: !!hideMoreFromYouTube,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideExploreTrending boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, explore-trending filtering patch/);
  assert.match(doc, /hideExploreTrending boundary source files: 6/);
  assert.match(doc, /runtime hideExploreTrending fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6641 | 298986 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideExploreTrending source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback explore-trending CSS rules block', blocks.domExploreTrendingCssRules, 9, 297],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared explore-trending compile block', blocks.sharedExploreTrendingCompile, 1, 56],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideExploreTrending'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideExploreTrending'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideExploreTrending'), 2);
  assert.equal(countLiteral(blocks.background, 'hideExploreTrending'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideExploreTrending'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideExploreTrending'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'guideEntryRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'compactLinkRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, '/feed/explore'), 1);
  assert.equal(countLiteral(blocks.domFallback, '/feed/trending'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-browse[page-subtype="trending"]'), 1);

  assert.match(doc, /filter_logic total hideExploreTrending tokens: 0/);
  assert.match(doc, /seed total hideExploreTrending tokens: 0/);
  assert.match(doc, /DOM fallback total hideExploreTrending tokens: 2/);
  assert.match(doc, /background total hideExploreTrending tokens: 12/);
  assert.match(doc, /settings_shared total hideExploreTrending tokens: 23/);
  assert.match(doc, /bridge_settings total hideExploreTrending token: 1/);
  assert.match(doc, /filter_logic total guideEntryRenderer tokens: 0/);
  assert.match(doc, /filter_logic total compactLinkRenderer tokens: 0/);
  assert.match(doc, /DOM fallback total \/feed\/explore tokens: 1/);
  assert.match(doc, /DOM fallback total \/feed\/trending tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-browse\[page-subtype="trending"\] tokens: 1/);
});

test('hideExploreTrending does not remove JSON guide entries or neighboring rows in filter_logic', () => {
  const payload = exploreTrendingPayload();

  assert.deepEqual(run(payload, { hideExploreTrending: true }), plain(payload));
});

test('ordinary keyword rules can remove neighboring watch rows while guide JSON remains', () => {
  const payload = exploreTrendingPayload([
    guideEntry('Explore', '/feed/explore', 'FEexplore'),
    guideEntry('Trending', '/feed/trending', 'FEtrending'),
    compactVideo('Block me near Explore', 'EXPLOREBLOCK'),
    compactVideo('Keep me near Explore', 'EXPLOREKEEP')
  ]);
  const result = run(payload, {
    hideExploreTrending: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const contents = result.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
  assert.equal(contents.length, 3);
  assert.equal(contents[0].guideEntryRenderer.formattedTitle.simpleText, 'Explore');
  assert.equal(contents[1].guideEntryRenderer.formattedTitle.simpleText, 'Trending');
  assert.equal(contents[2].compactVideoRenderer.videoId, 'EXPLOREKEEP');
});

test('browse hideExploreTrending alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/feed/explore',
    payload: exploreTrendingPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideExploreTrending: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned explore-trending hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideExploreTrending/);
  assert.doesNotMatch(blocks.filterLogic, /guideEntryRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /compactLinkRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideExploreTrending/);
  assert.match(blocks.domExploreTrendingCssRules, /\/feed\/explore/);
  assert.match(blocks.domExploreTrendingCssRules, /\/feed\/trending/);
  assert.match(blocks.domExploreTrendingCssRules, /ytd-browse\[page-subtype="trending"\]/);
  assert.match(blocks.domActiveBooleanKeys, /'hideExploreTrending'/);
  assert.match(blocks.bgStorageReadKeys, /'hideExploreTrending'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideExploreTrending = boolFromV4\('hideExploreTrending', items\.hideExploreTrending \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideExploreTrending'/);
  assert.match(blocks.sharedSettingsKeys, /'hideExploreTrending'/);
  assert.match(blocks.sharedExploreTrendingCompile, /hideExploreTrending: !!hideExploreTrending/);
  assert.match(blocks.bridgeRefreshKeys, /'hideExploreTrending'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideExploreTrending` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideExploreTrending`/);
  assert.match(doc, /Explore and Trending guide JSON entries pass through unchanged when only\s+`hideExploreTrending` is enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a neighboring supported row while\s+Explore\/Trending guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/browse` now bypasses `processData` with only\s+`hideExploreTrending` enabled/);
  assert.match(doc, /DOM fallback owns `\/feed\/explore`, `\/feed\/trending`, and\s+`ytd-browse\[page-subtype="trending"\]`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
