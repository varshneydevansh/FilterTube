import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideMoreFromYouTubeContract',
  'jsonFirstHideMoreFromYouTubeDecisionReport',
  'jsonFirstMoreFromYouTubeRendererInventoryPolicy',
  'jsonFirstMoreFromYouTubeJsonDomParityReport',
  'jsonFirstMoreFromYouTubeDomOnlyPolicy',
  'jsonFirstMoreFromYouTubeNoWorkBudget',
  'jsonFirstMoreFromYouTubeCacheInvalidationReport',
  'jsonFirstMoreFromYouTubeRoutePolicy',
  'jsonFirstMoreFromYouTubeSettingsParityReport',
  'jsonFirstMoreFromYouTubeFixtureProvenance',
  'jsonFirstMoreFromYouTubeMetricArtifact'
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
    hideMoreFromYouTube: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-more-from-youtube-boundary-fixture'));
}

function compactVideo(title = 'Keep me near More from YouTube', videoId = 'MOREYT001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function moreFromYouTubeSection(title = 'More from YouTube') {
  return {
    guideSectionRenderer: {
      formattedTitle: { simpleText: title },
      items: [
        {
          guideEntryRenderer: {
            formattedTitle: { simpleText: 'YouTube Music' },
            navigationEndpoint: {
              commandMetadata: {
                webCommandMetadata: { url: '/music' }
              }
            }
          }
        }
      ]
    }
  };
}

function moreFromYouTubePayload(items = [moreFromYouTubeSection(), compactVideo()]) {
  return {
    contents: {
      guideResponseRenderer: {
        items
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
    domMoreFromYouTubeCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideMoreFromYouTube) {',
      '\n\n    if (settings.hideSubscriptions) {'
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
    sharedMoreFromYouTubeCompile: sliceBetween(
      settingsShared,
      '            hideMoreFromYouTube: !!hideMoreFromYouTube,',
      '            hideSubscriptions: !!hideSubscriptions,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideMoreFromYouTube boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, more-from-youtube filtering patch/);
  assert.match(doc, /hideMoreFromYouTube boundary source files: 6/);
  assert.match(doc, /runtime hideMoreFromYouTube fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6313 | 284710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 651 | 26462 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideMoreFromYouTube source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback more-from-youtube CSS rules block', blocks.domMoreFromYouTubeCssRules, 7, 205],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared more-from-youtube compile block', blocks.sharedMoreFromYouTubeCompile, 1, 56],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideMoreFromYouTube'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideMoreFromYouTube'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideMoreFromYouTube'), 2);
  assert.equal(countLiteral(blocks.background, 'hideMoreFromYouTube'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideMoreFromYouTube'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideMoreFromYouTube'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'guideSectionRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'guideEntryRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'compactLinkRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-guide-section-renderer'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'nth-last-child(2)'), 1);

  assert.match(doc, /filter_logic total hideMoreFromYouTube tokens: 0/);
  assert.match(doc, /seed total hideMoreFromYouTube tokens: 0/);
  assert.match(doc, /DOM fallback total hideMoreFromYouTube tokens: 2/);
  assert.match(doc, /background total hideMoreFromYouTube tokens: 12/);
  assert.match(doc, /settings_shared total hideMoreFromYouTube tokens: 23/);
  assert.match(doc, /bridge_settings total hideMoreFromYouTube token: 1/);
  assert.match(doc, /filter_logic total guideSectionRenderer tokens: 1/);
  assert.match(doc, /filter_logic total guideEntryRenderer tokens: 0/);
  assert.match(doc, /filter_logic total compactLinkRenderer tokens: 0/);
  assert.match(doc, /DOM fallback total ytd-guide-section-renderer tokens: 2/);
  assert.match(doc, /DOM fallback total nth-last-child\(2\) tokens: 1/);
});

test('hideMoreFromYouTube does not remove JSON guide sections or neighboring rows in filter_logic', () => {
  const payload = moreFromYouTubePayload();

  assert.deepEqual(run(payload, { hideMoreFromYouTube: true }), plain(payload));
});

test('ordinary keyword rules can remove neighboring watch rows while More from YouTube JSON remains', () => {
  const payload = moreFromYouTubePayload([
    moreFromYouTubeSection(),
    compactVideo('Block me near More from YouTube', 'MOREYTBLOCK'),
    compactVideo('Keep me near More from YouTube', 'MOREYTKEEP')
  ]);
  const result = run(payload, {
    hideMoreFromYouTube: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const items = result.contents.guideResponseRenderer.items;
  assert.equal(items.length, 2);
  assert.equal(items[0].guideSectionRenderer.formattedTitle.simpleText, 'More from YouTube');
  assert.equal(items[1].compactVideoRenderer.videoId, 'MOREYTKEEP');
});

test('guide hideMoreFromYouTube alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: moreFromYouTubePayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideMoreFromYouTube: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned more-from-youtube hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideMoreFromYouTube/);
  assert.match(blocks.filterLogic, /guideSectionRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /guideEntryRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /compactLinkRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideMoreFromYouTube/);
  assert.match(blocks.domMoreFromYouTubeCssRules, /#sections > ytd-guide-section-renderer:nth-last-child\(2\)/);
  assert.match(blocks.domActiveBooleanKeys, /'hideMoreFromYouTube'/);
  assert.match(blocks.bgStorageReadKeys, /'hideMoreFromYouTube'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideMoreFromYouTube = boolFromV4\('hideMoreFromYouTube', items\.hideMoreFromYouTube \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideMoreFromYouTube'/);
  assert.match(blocks.sharedSettingsKeys, /'hideMoreFromYouTube'/);
  assert.match(blocks.sharedMoreFromYouTubeCompile, /hideMoreFromYouTube: !!hideMoreFromYouTube/);
  assert.match(blocks.bridgeRefreshKeys, /'hideMoreFromYouTube'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideMoreFromYouTube` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideMoreFromYouTube`/);
  assert.match(doc, /More from YouTube guide JSON sections pass through unchanged when only\s+`hideMoreFromYouTube` is enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a neighboring supported row while\s+More from\s+YouTube guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/guide` now bypasses `processData` with only\s+`hideMoreFromYouTube` enabled/);
  assert.match(doc, /DOM fallback owns `#sections > ytd-guide-section-renderer:nth-last-child\(2\)`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
