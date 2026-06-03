import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideVideoButtonsBarContract',
  'jsonFirstHideVideoButtonsBarDecisionReport',
  'jsonFirstVideoButtonsBarRendererInventoryPolicy',
  'jsonFirstVideoButtonsBarJsonDomParityReport',
  'jsonFirstVideoButtonsBarDomOnlyPolicy',
  'jsonFirstVideoButtonsBarWhitelistModeReport',
  'jsonFirstVideoButtonsBarChildControlInteractionReport',
  'jsonFirstVideoButtonsBarNoWorkBudget',
  'jsonFirstVideoButtonsBarCacheInvalidationReport',
  'jsonFirstVideoButtonsBarRoutePolicy',
  'jsonFirstVideoButtonsBarSettingsParityReport',
  'jsonFirstVideoButtonsBarFixtureProvenance',
  'jsonFirstVideoButtonsBarMetricArtifact'
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
    hideVideoInfo: false,
    hideVideoButtonsBar: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-video-buttons-bar-boundary-fixture'));
}

function videoPrimary(title = 'Calm watch title') {
  return {
    videoPrimaryInfoRenderer: {
      title: { runs: [{ text: title }] }
    }
  };
}

function videoSecondary(channel = 'Neutral Channel', channelId = 'UC1234567890123456789012') {
  return {
    videoSecondaryInfoRenderer: {
      owner: {
        videoOwnerRenderer: {
          title: { runs: [{ text: channel }] },
          navigationEndpoint: {
            browseEndpoint: {
              browseId: channelId,
              canonicalBaseUrl: '/@neutral'
            }
          }
        }
      }
    }
  };
}

function watchMetadataPayload(rows = [videoPrimary(), videoSecondary()]) {
  return { contents: rows };
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
  const domStyleStart = domFallback.indexOf('    const rules = [];');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    settingsShared,
    bridgeSettings,
    filterWatchPrimaryRules: sliceBetween(
      filterLogic,
      '        // Watch page (primary metadata)',
      '        // Watch page related modules & secondary surfaces'
    ),
    filterWhitelistScaffolding: sliceBetween(
      filterLogic,
      '                // Watch page scaffolding:',
      '                const whitelistChannels ='
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domButtonsBarCssRules: sliceBetween(
      domFallback,
      "    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoButtonsBar)) {",
      '\n\n    if (hideInfoMaster || settings.hideAskButton) {',
      domStyleStart
    ),
    domVideoInfoModeDeclarations: sliceBetween(
      domFallback,
      "    const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';",
      '\n\n    if (hideInfoMaster || settings.hideAskButton) {',
      domStyleStart
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
    sharedBuildCompiledSettings: sliceBetween(
      settingsShared,
      '    function buildCompiledSettings({',
      '            hideAskButton: !!hideAskButton,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideVideoButtonsBar boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, video-buttons-bar/);
  assert.match(doc, /hideVideoButtonsBar boundary source files: 6/);
  assert.match(doc, /runtime hideVideoButtonsBar fixtures: 7/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6641 | 298986 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideVideoButtonsBar source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.equal(lineCount(blocks.filterWatchPrimaryRules), 10);
  assert.equal(Buffer.byteLength(blocks.filterWatchPrimaryRules), 431);
  assert.equal(lineCount(blocks.filterWhitelistScaffolding), 6);
  assert.equal(Buffer.byteLength(blocks.filterWhitelistScaffolding), 449);
  assert.equal(lineCount(blocks.seedActiveJsonRules), 13);
  assert.equal(Buffer.byteLength(blocks.seedActiveJsonRules), 463);
  assert.equal(lineCount(blocks.domButtonsBarCssRules), 8);
  assert.equal(Buffer.byteLength(blocks.domButtonsBarCssRules), 263);
  assert.equal(lineCount(blocks.domVideoInfoModeDeclarations), 11);
  assert.equal(Buffer.byteLength(blocks.domVideoInfoModeDeclarations), 445);
  assert.equal(lineCount(blocks.domActiveBooleanKeys), 28);
  assert.equal(Buffer.byteLength(blocks.domActiveBooleanKeys), 905);
  assert.equal(lineCount(blocks.bgStorageReadKeys), 44);
  assert.equal(Buffer.byteLength(blocks.bgStorageReadKeys), 1408);
  assert.equal(lineCount(blocks.bgBooleanPassThrough), 35);
  assert.equal(Buffer.byteLength(blocks.bgBooleanPassThrough), 3596);
  assert.equal(lineCount(blocks.bgRefreshKeys), 16);
  assert.equal(Buffer.byteLength(blocks.bgRefreshKeys), 461);
  assert.equal(lineCount(blocks.sharedSettingsKeys), 38);
  assert.equal(Buffer.byteLength(blocks.sharedSettingsKeys), 1031);
  assert.equal(lineCount(blocks.sharedBuildCompiledSettings), 59);
  assert.equal(Buffer.byteLength(blocks.sharedBuildCompiledSettings), 2156);
  assert.equal(lineCount(blocks.bridgeRefreshKeys), 44);
  assert.equal(Buffer.byteLength(blocks.bridgeRefreshKeys), 1263);

  assert.equal(countLiteral(blocks.filterLogic, 'hideVideoButtonsBar'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideVideoButtonsBar'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideVideoButtonsBar'), 2);
  assert.equal(countLiteral(blocks.background, 'hideVideoButtonsBar'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideVideoButtonsBar'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideVideoButtonsBar'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'videoPrimaryInfoRenderer'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'videoSecondaryInfoRenderer'), 2);
  assert.equal(countLiteral(blocks.domButtonsBarCssRules, 'hideInfoMaster'), 1);
  assert.equal(countLiteral(blocks.domButtonsBarCssRules, '#actions.ytd-watch-metadata'), 1);
  assert.equal(countLiteral(blocks.domButtonsBarCssRules, '#info > #menu-container'), 1);

  assert.match(doc, /filter_logic watch primary metadata rules block lines: 10/);
  assert.match(doc, /filter_logic watch primary metadata rules block bytes: 431/);
  assert.match(doc, /filter_logic whitelist watch scaffolding block lines: 6/);
  assert.match(doc, /filter_logic whitelist watch scaffolding block bytes: 449/);
  assert.match(doc, /DOM fallback video-buttons-bar CSS rules block lines: 8/);
  assert.match(doc, /DOM fallback video-buttons-bar CSS rules block bytes: 263/);
  assert.match(doc, /DOM fallback video-info mode declaration block lines: 11/);
  assert.match(doc, /DOM fallback video-info mode declaration block bytes: 445/);
  assert.match(doc, /settings_shared build compiled settings block lines: 59/);
  assert.match(doc, /settings_shared build compiled settings block bytes: 2156/);
  assert.match(doc, /filter_logic total hideVideoButtonsBar tokens: 0/);
  assert.match(doc, /seed total hideVideoButtonsBar tokens: 0/);
  assert.match(doc, /DOM fallback total hideVideoButtonsBar tokens: 2/);
  assert.match(doc, /background total hideVideoButtonsBar tokens: 12/);
  assert.match(doc, /settings_shared total hideVideoButtonsBar tokens: 23/);
  assert.match(doc, /bridge_settings total hideVideoButtonsBar token: 1/);
  assert.match(doc, /filter_logic total videoPrimaryInfoRenderer tokens: 2/);
  assert.match(doc, /filter_logic total videoSecondaryInfoRenderer tokens: 2/);
  assert.match(doc, /DOM fallback video-buttons-bar CSS block hideInfoMaster tokens: 1/);
});

test('hideVideoButtonsBar does not remove JSON watch metadata rows in filter_logic', () => {
  const payload = watchMetadataPayload();

  assert.deepEqual(run(payload, { hideVideoButtonsBar: true }), plain(payload));
});

test('ordinary keyword rules can remove a watch metadata row while hideVideoButtonsBar remains DOM-only', () => {
  const payload = watchMetadataPayload([
    videoPrimary('Block me buttons title'),
    videoPrimary('Calm watch title'),
    videoSecondary()
  ]);

  assert.deepEqual(run(payload, {
    hideVideoButtonsBar: true,
    filterKeywords: [{ pattern: 'Block me', flags: 'i' }]
  }), {
    contents: [
      videoPrimary('Calm watch title'),
      videoSecondary()
    ]
  });
});

test('whitelist mode preserves JSON video-info scaffolding even when hideVideoButtonsBar is enabled', () => {
  const payload = watchMetadataPayload();

  assert.deepEqual(run(payload, {
    hideVideoButtonsBar: true,
    listMode: 'whitelist',
    whitelistKeywords: [],
    whitelistChannels: []
  }), plain(payload));
});

test('watch next hideVideoButtonsBar alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const payload = watchMetadataPayload();
  const runtime = await loadSeedRuntime({
    pathname: '/watch',
    payload
  });
  runtime.window.filterTube.updateSettings(settings({ hideVideoButtonsBar: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  assert.deepEqual(await response.json(), plain(payload));
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned video-buttons-bar hiding whitelist behavior refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtimeSource = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideVideoButtonsBar/);
  assert.doesNotMatch(blocks.seed, /hideVideoButtonsBar/);
  assert.match(blocks.filterWatchPrimaryRules, /videoPrimaryInfoRenderer/);
  assert.match(blocks.filterWatchPrimaryRules, /videoSecondaryInfoRenderer/);
  assert.match(blocks.filterWhitelistScaffolding, /videoPrimaryInfoRenderer/);
  assert.match(blocks.filterWhitelistScaffolding, /videoSecondaryInfoRenderer/);
  assert.match(blocks.seedActiveJsonRules, /settings\.hideAllComments === true/);
  assert.match(blocks.seedActiveJsonRules, /settings\.hideAllShorts === true/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideVideoButtonsBar/);
  assert.match(blocks.domVideoInfoModeDeclarations, /const hideInfoMaster = \(listMode !== 'whitelist'\) && !!settings\.hideVideoInfo/);
  assert.match(blocks.domButtonsBarCssRules, /listMode !== 'whitelist'/);
  assert.match(blocks.domButtonsBarCssRules, /hideInfoMaster \|\| settings\.hideVideoButtonsBar/);
  assert.match(blocks.domButtonsBarCssRules, /#actions\.ytd-watch-metadata/);
  assert.match(blocks.domButtonsBarCssRules, /#info > #menu-container/);
  assert.match(blocks.domActiveBooleanKeys, /'hideVideoButtonsBar'/);
  assert.match(blocks.bgStorageReadKeys, /'hideVideoButtonsBar'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideVideoButtonsBar = boolFromV4\('hideVideoButtonsBar', items\.hideVideoButtonsBar \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideVideoButtonsBar'/);
  assert.match(blocks.sharedSettingsKeys, /'hideVideoButtonsBar'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideVideoButtonsBar: !!hideVideoButtonsBar/);
  assert.match(blocks.bridgeRefreshKeys, /'hideVideoButtonsBar'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideVideoButtonsBar` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideVideoButtonsBar`/);
  assert.match(doc, /Watch video-buttons-bar JSON rows pass through unchanged when only `hideVideoButtonsBar` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only `hideVideoButtonsBar` enabled/);
  assert.match(doc, /DOM fallback hides the same buttons bar selectors when `hideInfoMaster` is true or when `settings\.hideVideoButtonsBar` is true/);
  assert.match(doc, /Whitelist mode preserves `videoPrimaryInfoRenderer` and\s+`videoSecondaryInfoRenderer` rows with an empty whitelist/);

  for (const symbol of authoritySymbols) {
    assert.doesNotMatch(runtimeSource, new RegExp(`\\b${symbol}\\b`), `${symbol} should not exist in product runtime source`);
    assert.match(doc, new RegExp(symbol), `${symbol} should be documented as missing`);
  }
});
