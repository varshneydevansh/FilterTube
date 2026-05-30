import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideEndscreenCardsContract',
  'jsonFirstHideEndscreenCardsDecisionReport',
  'jsonFirstEndscreenCardsRendererInventoryPolicy',
  'jsonFirstEndscreenCardsJsonDomParityReport',
  'jsonFirstEndscreenCardsDomOnlyPolicy',
  'jsonFirstEndscreenCardsWhitelistModeReport',
  'jsonFirstEndscreenCardsPlayerOverlayPolicy',
  'jsonFirstEndscreenCardsNoWorkBudget',
  'jsonFirstEndscreenCardsCacheInvalidationReport',
  'jsonFirstEndscreenCardsRoutePolicy',
  'jsonFirstEndscreenCardsSettingsParityReport',
  'jsonFirstEndscreenCardsFixtureProvenance',
  'jsonFirstEndscreenCardsMetricArtifact'
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
    hideEndscreenCards: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-endscreen-cards-boundary-fixture'));
}

function videoRenderer(title = 'Calm end screen suggestion', videoId = 'abcdefghijk') {
  return {
    videoId,
    title: { simpleText: title },
    shortBylineText: {
      runs: [{
        text: 'Calm Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@calmchannel'
          }
        }
      }]
    }
  };
}

function endScreenVideo(title = 'Calm end screen suggestion', videoId = 'abcdefghijk') {
  return { endScreenVideoRenderer: videoRenderer(title, videoId) };
}

function compactAutoplay(title = 'Calm autoplay suggestion', videoId = 'abcdefghij2') {
  return { compactAutoplayRenderer: videoRenderer(title, videoId) };
}

function endScreenPayload(rows = [endScreenVideo(), compactAutoplay()]) {
  return { elements: rows };
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
    filterSharedVideoRendererRules: sliceBetween(
      filterLogic,
      '        // Shared video card renderers (used across multiple surfaces)',
      '        videoWithContextRenderer: {'
    ),
    filterCategoryRendererAllowlist: sliceBetween(
      filterLogic,
      "            const isVideoRenderer = [",
      '            if (!isVideoRenderer) return false;',
      filterLogic.indexOf('function matchesCategoryFilter')
    ),
    filterNestedKnownKeys: sliceBetween(
      filterLogic,
      "                const knownKeys = [",
      '                ];',
      filterLogic.indexOf('function unwrapKnownContainer')
    ),
    filterContentRendererAllowlist: sliceBetween(
      filterLogic,
      "            const isVideoRenderer = [",
      '            if (!isVideoRenderer) return false;',
      filterLogic.indexOf('function matchesContentFilter')
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domEndscreenCardsCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideEndscreenCards) {',
      '\n\n    if (settings.disableAutoplay) {',
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
      '            disableAutoplay: !!disableAutoplay,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideEndscreenCards boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, end-screen card/);
  assert.match(doc, /hideEndscreenCards boundary source files: 6/);
  assert.match(doc, /runtime hideEndscreenCards fixtures: 7/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6320 | 285103 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 651 | 26462 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideEndscreenCards source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.equal(lineCount(blocks.filterSharedVideoRendererRules), 8);
  assert.equal(Buffer.byteLength(blocks.filterSharedVideoRendererRules), 415);
  assert.equal(lineCount(blocks.filterCategoryRendererAllowlist), 8);
  assert.equal(Buffer.byteLength(blocks.filterCategoryRendererAllowlist), 618);
  assert.equal(lineCount(blocks.filterNestedKnownKeys), 10);
  assert.equal(Buffer.byteLength(blocks.filterNestedKnownKeys), 427);
  assert.equal(lineCount(blocks.filterContentRendererAllowlist), 8);
  assert.equal(Buffer.byteLength(blocks.filterContentRendererAllowlist), 618);
  assert.equal(lineCount(blocks.seedActiveJsonRules), 13);
  assert.equal(Buffer.byteLength(blocks.seedActiveJsonRules), 463);
  assert.equal(lineCount(blocks.domEndscreenCardsCssRules), 7);
  assert.equal(Buffer.byteLength(blocks.domEndscreenCardsCssRules), 177);
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
  assert.equal(lineCount(blocks.sharedBuildCompiledSettings), 65);
  assert.equal(Buffer.byteLength(blocks.sharedBuildCompiledSettings), 2492);
  assert.equal(lineCount(blocks.bridgeRefreshKeys), 44);
  assert.equal(Buffer.byteLength(blocks.bridgeRefreshKeys), 1263);

  assert.equal(countLiteral(blocks.filterLogic, 'hideEndscreenCards'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideEndscreenCards'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideEndscreenCards'), 2);
  assert.equal(countLiteral(blocks.background, 'hideEndscreenCards'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideEndscreenCards'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideEndscreenCards'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'endScreenVideoRenderer'), 4);
  assert.equal(countLiteral(blocks.filterLogic, 'compactAutoplayRenderer'), 0);
  assert.equal(countLiteral(blocks.domEndscreenCardsCssRules, '#movie_player .ytp-ce-element'), 1);

  assert.match(doc, /filter_logic shared video renderer rules block lines: 8/);
  assert.match(doc, /filter_logic shared video renderer rules block bytes: 415/);
  assert.match(doc, /filter_logic category renderer allowlist block lines: 8/);
  assert.match(doc, /filter_logic category renderer allowlist block bytes: 618/);
  assert.match(doc, /filter_logic nested known keys block lines: 10/);
  assert.match(doc, /filter_logic nested known keys block bytes: 427/);
  assert.match(doc, /filter_logic content renderer allowlist block lines: 8/);
  assert.match(doc, /filter_logic content renderer allowlist block bytes: 618/);
  assert.match(doc, /DOM fallback endscreen-cards CSS rules block lines: 7/);
  assert.match(doc, /DOM fallback endscreen-cards CSS rules block bytes: 177/);
  assert.match(doc, /settings_shared build compiled settings block lines: 65/);
  assert.match(doc, /settings_shared build compiled settings block bytes: 2492/);
  assert.match(doc, /filter_logic total hideEndscreenCards tokens: 0/);
  assert.match(doc, /seed total hideEndscreenCards tokens: 0/);
  assert.match(doc, /DOM fallback total hideEndscreenCards tokens: 2/);
  assert.match(doc, /background total hideEndscreenCards tokens: 12/);
  assert.match(doc, /settings_shared total hideEndscreenCards tokens: 23/);
  assert.match(doc, /bridge_settings total hideEndscreenCards token: 1/);
  assert.match(doc, /filter_logic total endScreenVideoRenderer tokens: 4/);
  assert.match(doc, /filter_logic total compactAutoplayRenderer tokens: 0/);
});

test('hideEndscreenCards does not remove JSON end-screen renderer rows in filter_logic', () => {
  const payload = endScreenPayload();

  assert.deepEqual(run(payload, { hideEndscreenCards: true }), plain(payload));
});

test('ordinary keyword rules remove supported endScreenVideoRenderer while compactAutoplayRenderer remains outside end-card coverage', () => {
  const payload = endScreenPayload([
    endScreenVideo('Block me end screen suggestion'),
    compactAutoplay('Block me autoplay suggestion'),
    endScreenVideo('Calm end screen suggestion', 'abcdefghij3')
  ]);

  assert.deepEqual(run(payload, {
    hideEndscreenCards: true,
    filterKeywords: [keyword('Block me')]
  }), {
    elements: [
      compactAutoplay('Block me autoplay suggestion'),
      endScreenVideo('Calm end screen suggestion', 'abcdefghij3')
    ]
  });
});

test('whitelist mode removes supported endScreenVideoRenderer while compactAutoplayRenderer still passes through', () => {
  const payload = endScreenPayload();

  assert.deepEqual(run(payload, {
    hideEndscreenCards: true,
    listMode: 'whitelist',
    whitelistKeywords: [],
    whitelistChannels: []
  }), {
    elements: [
      compactAutoplay()
    ]
  });
});

test('watch next hideEndscreenCards alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const payload = endScreenPayload();
  const runtime = await loadSeedRuntime({
    pathname: '/watch',
    payload
  });
  runtime.window.filterTube.updateSettings(settings({ hideEndscreenCards: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  assert.deepEqual(await response.json(), plain(payload));
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins player end-card CSS hide split refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtimeSource = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideEndscreenCards/);
  assert.doesNotMatch(blocks.seed, /hideEndscreenCards/);
  assert.match(blocks.filterSharedVideoRendererRules, /endScreenVideoRenderer: BASE_VIDEO_RULES/);
  assert.doesNotMatch(blocks.filterSharedVideoRendererRules, /compactAutoplayRenderer/);
  assert.match(blocks.filterCategoryRendererAllowlist, /endScreenVideoRenderer/);
  assert.doesNotMatch(blocks.filterCategoryRendererAllowlist, /compactAutoplayRenderer/);
  assert.match(blocks.filterNestedKnownKeys, /endScreenVideoRenderer/);
  assert.doesNotMatch(blocks.filterNestedKnownKeys, /compactAutoplayRenderer/);
  assert.match(blocks.filterContentRendererAllowlist, /endScreenVideoRenderer/);
  assert.doesNotMatch(blocks.filterContentRendererAllowlist, /compactAutoplayRenderer/);
  assert.match(blocks.seedActiveJsonRules, /settings\.hideAllComments === true/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideEndscreenCards/);
  assert.match(blocks.domEndscreenCardsCssRules, /settings\.hideEndscreenCards/);
  assert.doesNotMatch(blocks.domEndscreenCardsCssRules, /listMode !== 'whitelist'/);
  assert.match(blocks.domEndscreenCardsCssRules, /#movie_player \.ytp-ce-element/);
  assert.match(blocks.domActiveBooleanKeys, /'hideEndscreenCards'/);
  assert.match(blocks.bgStorageReadKeys, /'hideEndscreenCards'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideEndscreenCards = boolFromV4\('hideEndscreenCards', items\.hideEndscreenCards \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideEndscreenCards'/);
  assert.match(blocks.sharedSettingsKeys, /'hideEndscreenCards'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideEndscreenCards: !!hideEndscreenCards/);
  assert.match(blocks.bridgeRefreshKeys, /'hideEndscreenCards'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideEndscreenCards` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideEndscreenCards`/);
  assert.match(doc, /Watch end-screen JSON rows pass through unchanged when only\s+`hideEndscreenCards` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only\s+`hideEndscreenCards` enabled/);
  assert.match(doc, /DOM fallback owns the visible player end-card hide with `#movie_player \.ytp-ce-element`/);
  assert.match(doc, /`compactAutoplayRenderer` is not covered by those direct allowlists today/);
  assert.match(doc, /The DOM end-screen card CSS block is not gated by `listMode !== 'whitelist'`/);

  for (const symbol of authoritySymbols) {
    assert.doesNotMatch(runtimeSource, new RegExp(`\\b${symbol}\\b`), `${symbol} should not exist in product runtime source`);
    assert.match(doc, new RegExp(symbol), `${symbol} should be documented as missing`);
  }
});
