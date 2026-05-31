import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideAllShortsContract',
  'jsonFirstHideAllShortsDecisionReport',
  'jsonFirstHideAllShortsRendererDiscoveryPolicy',
  'jsonFirstHideAllShortsJsonDomParityReport',
  'jsonFirstHideAllShortsV2LeakReport',
  'jsonFirstHideAllShortsDisguisedShortPolicy',
  'jsonFirstHideAllShortsNoWorkBudget',
  'jsonFirstHideAllShortsMarkerRestoreProof',
  'jsonFirstHideAllShortsFixtureProvenance',
  'jsonFirstHideAllShortsMetricArtifact'
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-all-shorts-boundary-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function shortsLockup(videoId = 'SHORTS00001') {
  return {
    shortsLockupViewModel: {
      entityId: `shorts-${videoId}`,
      accessibilityText: 'Neutral short',
      onTap: {
        innertubeCommand: {
          reelWatchEndpoint: { videoId }
        }
      }
    }
  };
}

function shortsLockupV2(videoId = 'SHORTS00002') {
  return {
    shortsLockupViewModelV2: {
      entityId: `shorts-v2-${videoId}`,
      accessibilityText: 'Neutral V2 short',
      onTap: {
        innertubeCommand: {
          reelWatchEndpoint: { videoId }
        }
      }
    }
  };
}

function nestedV2(videoId = 'SHORTS00003') {
  return {
    richItemRenderer: {
      content: {
        shortsLockupViewModelV2: shortsLockupV2(videoId).shortsLockupViewModelV2
      }
    }
  };
}

function reelItem(videoId = 'SHORTS00004') {
  return {
    reelItemRenderer: {
      videoId,
      headline: { simpleText: 'Neutral reel' }
    }
  };
}

function videoWithShortsUrl(videoId = 'VIDEO000001') {
  return {
    videoRenderer: {
      videoId,
      title: { simpleText: 'Normal card with Shorts link evidence' },
      navigationEndpoint: {
        commandMetadata: { webCommandMetadata: { url: '/shorts/SHORTS00005' } },
        watchEndpoint: { videoId }
      },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    filterRulesShorts: sliceBetween(
      filterLogic,
      '        // Shorts surfaces',
      '        // ------------------------------------------------------------------\n        // Comment threads'
    ),
    filterRendererDiscovery: sliceBetween(
      filterLogic,
      '            const rendererTypes = Object.keys(obj).filter',
      '            // Recursively process all properties'
    ),
    filterUnwrapPreferredNested: sliceBetween(
      filterLogic,
      '                    const preferredNestedRenderers = [',
      '                    for (const nestedRendererType of preferredNestedRenderers)'
    ),
    filterBuildCandidateShort: sliceBetween(
      filterLogic,
      '            const isShort = (',
      '            const isComment ='
    ),
    filterVideoMapShorts: sliceBetween(
      filterLogic,
      '            // Shorts: if no channel identity present, try videoChannelMap',
      '            // Handle collaboration videos'
    ),
    filterHideAllShortsDecision: sliceBetween(
      filterLogic,
      '            // Shorts filtering',
      "\n\n            try {\n                const path = document.location?.pathname || '';"
    ),
    filterWhitelistShortsException: sliceBetween(
      filterLogic,
      '                const isShortsLikeRenderer = (',
      '\n\n                if (!hasChannelRules && !hasKeywordRules)'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllShorts',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    domHiddenMarker: sliceBetween(
      domFallback,
      "        || element.getAttribute('data-filtertube-hidden-by-hide-all-shorts')",
      '    const liveVideoId = extractVideoIdFromCard'
    ),
    domRestoreHiddenSelector: sliceBetween(
      domFallback,
      "            '[data-filtertube-hidden-by-hide-all-shorts]'",
      '        const hidden = document.querySelectorAll(hiddenSelector);'
    ),
    domDisguisedShortDetection: sliceBetween(
      domFallback,
      '            const shortThumbnailAnchor = element.querySelector',
      "            if (isShortVideoRenderer) {\n                element.setAttribute('data-filtertube-short', 'true');"
    ),
    domGlobalShortVideoDecision: sliceBetween(
      domFallback,
      "            if (isShortVideoRenderer) {\n                const hideByGlobalShorts = Boolean(effectiveSettings.hideAllShorts);",
      '\n\n            try {\n                if (hideByDuration && shouldHide)'
    ),
    domShortsSection: sliceBetween(
      domFallback,
      '    // 3. Shorts Filtering',
      '\n\n    // 4. Comments Filtering'
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgInstallDefault: sliceBetween(
      background,
      '            hideAllShorts: false,',
      '            showQuickBlockButton: true,'
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    )
  };
}

test('JSON-first hideAllShorts boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, Shorts behavior patch/);
  assert.match(doc, /hideAllShorts boundary source files: 4/);
  assert.match(doc, /runtime hideAllShorts fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6320 | 285103 | \`${sha256('js/background.js')}\` |`));
});

test('hideAllShorts source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic Shorts rules block', blocks.filterRulesShorts, 15, 653],
    ['filter_logic renderer discovery block', blocks.filterRendererDiscovery, 10, 464],
    ['filter_logic unwrap preferred nested block', blocks.filterUnwrapPreferredNested, 21, 932],
    ['filter_logic build candidate Shorts block', blocks.filterBuildCandidateShort, 5, 219],
    ['filter_logic videoChannelMap Shorts block', blocks.filterVideoMapShorts, 12, 556],
    ['filter_logic hideAllShorts decision block', blocks.filterHideAllShortsDecision, 5, 326],
    ['filter_logic whitelist Shorts exception block', blocks.filterWhitelistShortsException, 5, 251],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 27, 874],
    ['DOM fallback hidden marker block', blocks.domHiddenMarker, 4, 125],
    ['DOM fallback restore selector block', blocks.domRestoreHiddenSelector, 2, 80],
    ['DOM fallback disguised Shorts detection block', blocks.domDisguisedShortDetection, 12, 788],
    ['DOM fallback global short video decision block', blocks.domGlobalShortVideoDecision, 18, 885],
    ['DOM fallback Shorts section block', blocks.domShortsSection, 275, 13317],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background install default block', blocks.bgInstallDefault, 1, 34],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideAllShorts'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'shortsLockupViewModelV2'), 7);
  assert.equal(countLiteral(blocks.seed, 'hideAllShorts'), 5);
  assert.equal(countLiteral(blocks.domFallback, 'hideAllShorts'), 8);
  assert.equal(countLiteral(blocks.domFallback, 'hideShorts'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-hidden-by-hide-all-shorts'), 15);
  assert.equal(countLiteral(blocks.background, 'hideAllShorts'), 8);
  assert.equal(countLiteral(blocks.background, 'hideShorts'), 6);

  assert.match(doc, /filter_logic total hideAllShorts tokens: 2/);
  assert.match(doc, /filter_logic total shortsLockupViewModelV2 tokens: 7/);
  assert.match(doc, /seed total hideAllShorts tokens: 5/);
  assert.match(doc, /DOM fallback total hideAllShorts tokens: 8/);
  assert.match(doc, /DOM fallback total hideShorts tokens: 1/);
  assert.match(doc, /DOM fallback total hidden-by-hide-all-shorts marker tokens: 15/);
  assert.match(doc, /background total hideAllShorts tokens: 8/);
  assert.match(doc, /background total hideShorts tokens: 6/);
});

test('hideAllShorts removes direct JSON Shorts and reel renderer families that are discovered', () => {
  const config = { hideAllShorts: true };

  assert.deepEqual(run(contents(shortsLockup('SHORTS00001')), config), { contents: [] });
  assert.deepEqual(run(contents(reelItem('SHORTS00004')), config), { contents: [] });
});

test('direct shortsLockupViewModelV2 currently leaks through recursive renderer discovery', () => {
  const config = { hideAllShorts: true };
  const directV2 = contents(shortsLockupV2('SHORTS00002'));

  assert.deepEqual(run(directV2, config), plain(directV2));
});

test('nested shortsLockupViewModelV2 under richItemRenderer is removed through unwrap path', () => {
  const config = { hideAllShorts: true };

  assert.deepEqual(run(contents(nestedV2('SHORTS00003')), config), { contents: [] });
});

test('ordinary JSON videoRenderer with Shorts URL evidence is not hidden by hideAllShorts', () => {
  const config = { hideAllShorts: true };
  const ordinaryVideo = contents(videoWithShortsUrl('VIDEO000001'));

  assert.deepEqual(run(ordinaryVideo, config), plain(ordinaryVideo));
});

test('source proof pins active work settings aliases DOM markers and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.seedActiveJsonRules, /settings\.hideAllShorts === true/);
  assert.match(blocks.filterRendererDiscovery, /key\.endsWith\('Renderer'\) \|\| key\.endsWith\('ViewModel'\)/);
  assert.match(blocks.filterRulesShorts, /shortsLockupViewModelV2/);
  assert.match(blocks.filterUnwrapPreferredNested, /shortsLockupViewModelV2/);
  assert.match(blocks.bgBooleanPassThrough, /hideAllShorts = boolFromV4\('hideShorts', items\.hideAllShorts \|\| false\)/);
  assert.match(blocks.bgRefreshKeys, /'hideAllShorts'/);
  assert.match(blocks.domActiveBooleanKeys, /'hideAllShorts'/);
  assert.match(blocks.domActiveBooleanKeys, /'hideShorts'/);
  assert.match(blocks.domShortsSection, /data-filtertube-hidden-by-hide-all-shorts/);
  assert.match(blocks.domShortsSection, /yieldToMain\(\)/);
  assert.match(doc, /direct `shortsLockupViewModelV2` currently remains/);
  assert.match(doc, /ordinary `videoRenderer` rows with `\/shorts\/` URL evidence remain visible/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
