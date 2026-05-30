import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideVideoSidebarContract',
  'jsonFirstHideVideoSidebarDecisionReport',
  'jsonFirstWatchSidebarRendererInventoryPolicy',
  'jsonFirstWatchSidebarJsonDomParityReport',
  'jsonFirstWatchSidebarDomOnlyPolicy',
  'jsonFirstWatchSidebarNoWorkBudget',
  'jsonFirstWatchSidebarCacheInvalidationReport',
  'jsonFirstWatchSidebarRoutePolicy',
  'jsonFirstWatchSidebarSettingsParityReport',
  'jsonFirstWatchSidebarFixtureProvenance',
  'jsonFirstWatchSidebarMetricArtifact'
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
    hideVideoSidebar: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-video-sidebar-boundary-fixture'));
}

function compactVideo(title = 'Calm sidebar video', videoId = 'SIDEBAR001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function watchCard(title = 'Watch card sidebar') {
  return {
    watchCardCompactVideoRenderer: {
      title: { simpleText: title },
      subtitle: { simpleText: 'Neutral Channel' },
      navigationEndpoint: {
        watchEndpoint: { videoId: 'SIDEBAR002' }
      }
    }
  };
}

function secondaryContainer(title = 'Secondary sidebar video') {
  return {
    secondarySearchContainerRenderer: {
      contents: [compactVideo(title, 'SIDEBAR003')]
    }
  };
}

function watchNextPayload(results = [compactVideo(), watchCard(), secondaryContainer()]) {
  return {
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
    domSidebarCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideVideoSidebar) {',
      '\n\n    if (settings.hideRecommended) {'
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
      '            hideVideoInfo: !!hideVideoInfo,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideVideoSidebar boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, watch-sidebar/);
  assert.match(doc, /hideVideoSidebar boundary source files: 6/);
  assert.match(doc, /runtime hideVideoSidebar fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6313 | 284710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 651 | 26462 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideVideoSidebar source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback video-sidebar CSS rules block', blocks.domSidebarCssRules, 7, 172],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared build compiled settings block', blocks.sharedBuildCompiledSettings, 57, 2056],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideVideoSidebar'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideVideoSidebar'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideVideoSidebar'), 2);
  assert.equal(countLiteral(blocks.domFallback, '#secondary.ytd-watch-flexy'), 1);
  assert.equal(countLiteral(blocks.background, 'hideVideoSidebar'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideVideoSidebar'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideVideoSidebar'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'compactVideoRenderer'), 9);
  assert.equal(countLiteral(blocks.filterLogic, 'watchCardCompactVideoRenderer'), 4);
  assert.equal(countLiteral(blocks.filterLogic, 'endScreenVideoRenderer'), 4);

  assert.match(doc, /filter_logic total hideVideoSidebar tokens: 0/);
  assert.match(doc, /seed total hideVideoSidebar tokens: 0/);
  assert.match(doc, /DOM fallback total hideVideoSidebar tokens: 2/);
  assert.match(doc, /DOM fallback total #secondary\.ytd-watch-flexy tokens: 1/);
  assert.match(doc, /background total hideVideoSidebar tokens: 12/);
  assert.match(doc, /settings_shared total hideVideoSidebar tokens: 23/);
  assert.match(doc, /bridge_settings total hideVideoSidebar tokens: 1/);
  assert.match(doc, /filter_logic total compactVideoRenderer tokens: 9/);
  assert.match(doc, /filter_logic total watchCardCompactVideoRenderer tokens: 4/);
  assert.match(doc, /filter_logic total endScreenVideoRenderer tokens: 4/);
});

test('hideVideoSidebar does not remove JSON watch sidebar renderer families in filter_logic', () => {
  const payload = watchNextPayload();

  assert.deepEqual(run(payload, { hideVideoSidebar: true }), plain(payload));
});

test('watch sidebar JSON filtering currently belongs to keyword rules, not hideVideoSidebar', () => {
  const payload = watchNextPayload([
    compactVideo('Block me sidebar video', 'SIDEBAR001'),
    compactVideo('Keep me', 'SIDEBAR004')
  ]);
  const result = run(payload, {
    hideVideoSidebar: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const results = result.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  assert.equal(results.length, 1);
  assert.equal(results[0].compactVideoRenderer.videoId, 'SIDEBAR004');
});

test('watch next hideVideoSidebar alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: watchNextPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideVideoSidebar: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned video-sidebar hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideVideoSidebar/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideVideoSidebar/);
  assert.match(blocks.domSidebarCssRules, /#secondary\.ytd-watch-flexy/);
  assert.match(blocks.domActiveBooleanKeys, /'hideVideoSidebar'/);
  assert.match(blocks.bgStorageReadKeys, /'hideVideoSidebar'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideVideoSidebar = boolFromV4\('hideVideoSidebar', items\.hideVideoSidebar \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideVideoSidebar'/);
  assert.match(blocks.sharedSettingsKeys, /'hideVideoSidebar'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideVideoSidebar: !!hideVideoSidebar/);
  assert.match(blocks.bridgeRefreshKeys, /'hideVideoSidebar'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideVideoSidebar` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideVideoSidebar`/);
  assert.match(doc, /Watch sidebar JSON renderer objects pass through unchanged when only `hideVideoSidebar` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only `hideVideoSidebar` enabled/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
