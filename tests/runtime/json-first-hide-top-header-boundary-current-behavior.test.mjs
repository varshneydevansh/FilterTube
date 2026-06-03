import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideTopHeaderContract',
  'jsonFirstHideTopHeaderDecisionReport',
  'jsonFirstTopHeaderRendererInventoryPolicy',
  'jsonFirstTopHeaderJsonDomParityReport',
  'jsonFirstTopHeaderDomOnlyPolicy',
  'jsonFirstTopHeaderNoWorkBudget',
  'jsonFirstTopHeaderCacheInvalidationReport',
  'jsonFirstTopHeaderRoutePolicy',
  'jsonFirstTopHeaderSettingsParityReport',
  'jsonFirstTopHeaderFixtureProvenance',
  'jsonFirstTopHeaderMetricArtifact'
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
    hideTopHeader: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-top-header-boundary-fixture'));
}

function compactVideo(title = 'Keep me under header', videoId = 'TOPHDR001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function topHeaderPayload(results = [compactVideo()]) {
  return {
    topbar: {
      desktopTopbarRenderer: {
        logo: {
          topbarLogoRenderer: {
            iconImage: { iconType: 'YOUTUBE_LOGO' }
          }
        },
        searchbox: {
          fusionSearchboxRenderer: {
            placeholderText: { runs: [{ text: 'Search' }] }
          }
        }
      }
    },
    contents: {
      twoColumnWatchNextResults: {
        secondaryResults: {
          secondaryResults: {
            results
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
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domTopHeaderCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideTopHeader) {',
      '\n\n    if (settings.hideNotificationBell) {'
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
    sharedTopHeaderCompile: sliceBetween(
      settingsShared,
      '            disableAutoplay: !!disableAutoplay,',
      '            hideNotificationBell: !!hideNotificationBell,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideTopHeader boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization\s+patch, top-header filtering patch/);
  assert.match(doc, /hideTopHeader boundary source files: 6/);
  assert.match(doc, /runtime hideTopHeader fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6641 | 298986 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideTopHeader source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback top-header CSS rules block', blocks.domTopHeaderCssRules, 7, 162],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared top-header compile block', blocks.sharedTopHeaderCompile, 3, 146],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideTopHeader'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideTopHeader'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideTopHeader'), 2);
  assert.equal(countLiteral(blocks.background, 'hideTopHeader'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideTopHeader'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideTopHeader'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'desktopTopbarRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'topbarRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, '#masthead-container'), 2);

  assert.match(doc, /filter_logic total hideTopHeader tokens: 0/);
  assert.match(doc, /seed total hideTopHeader tokens: 0/);
  assert.match(doc, /DOM fallback total hideTopHeader tokens: 2/);
  assert.match(doc, /background total hideTopHeader tokens: 12/);
  assert.match(doc, /settings_shared total hideTopHeader tokens: 23/);
  assert.match(doc, /bridge_settings total hideTopHeader token: 1/);
  assert.match(doc, /filter_logic total desktopTopbarRenderer tokens: 0/);
  assert.match(doc, /filter_logic total topbarRenderer tokens: 0/);
  assert.match(doc, /DOM fallback total #masthead-container tokens: 2/);
});

test('hideTopHeader does not remove JSON topbar or watch rows in filter_logic', () => {
  const payload = topHeaderPayload();

  assert.deepEqual(run(payload, { hideTopHeader: true }), plain(payload));
});

test('ordinary keyword rules can remove neighboring watch rows while topbar JSON remains', () => {
  const payload = topHeaderPayload([
    compactVideo('Block me under header', 'TOPHDRBLOCK'),
    compactVideo('Keep me under header', 'TOPHDRKEEP')
  ]);
  const result = run(payload, {
    hideTopHeader: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const results = result.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  assert.equal(results.length, 1);
  assert.equal(results[0].compactVideoRenderer.videoId, 'TOPHDRKEEP');
  assert.ok(result.topbar.desktopTopbarRenderer);
});

test('watch next hideTopHeader alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: topHeaderPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideTopHeader: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned top-header hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideTopHeader/);
  assert.doesNotMatch(blocks.filterLogic, /desktopTopbarRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /topbarRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideTopHeader/);
  assert.match(blocks.domTopHeaderCssRules, /#masthead-container/);
  assert.match(blocks.domActiveBooleanKeys, /'hideTopHeader'/);
  assert.match(blocks.bgStorageReadKeys, /'hideTopHeader'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideTopHeader = boolFromV4\('hideTopHeader', items\.hideTopHeader \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideTopHeader'/);
  assert.match(blocks.sharedSettingsKeys, /'hideTopHeader'/);
  assert.match(blocks.sharedTopHeaderCompile, /hideTopHeader: !!hideTopHeader/);
  assert.match(blocks.bridgeRefreshKeys, /'hideTopHeader'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideTopHeader` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideTopHeader`/);
  assert.match(doc, /Topbar JSON objects pass through unchanged when only `hideTopHeader` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only `hideTopHeader` enabled/);
  assert.match(doc, /DOM fallback owns `#masthead-container`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
