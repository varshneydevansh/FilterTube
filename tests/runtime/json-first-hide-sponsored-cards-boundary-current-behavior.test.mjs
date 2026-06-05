import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideSponsoredCardsContract',
  'jsonFirstHideSponsoredCardsDecisionReport',
  'jsonFirstSponsoredRendererInventoryPolicy',
  'jsonFirstSponsoredJsonDomParityReport',
  'jsonFirstSponsoredDomOnlyPolicy',
  'jsonFirstSponsoredAdSurfaceReport',
  'jsonFirstSponsoredNoWorkBudget',
  'jsonFirstSponsoredCssTargetReport',
  'jsonFirstSponsoredSettingsParityReport',
  'jsonFirstSponsoredFixtureProvenance',
  'jsonFirstSponsoredMetricArtifact'
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
    hideSponsoredCards: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-sponsored-cards-boundary-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function adSlotRenderer(overrides = {}) {
  return {
    adSlotRenderer: {
      slotId: 'ad-slot-1',
      renderer: {
        promotedSparklesWebRenderer: {
          title: { simpleText: 'Sponsored Product' }
        }
      },
      ...overrides
    }
  };
}

function promotedSparklesWebRenderer() {
  return {
    promotedSparklesWebRenderer: {
      title: { simpleText: 'Sponsored Product' },
      description: { simpleText: 'Promoted placement' }
    }
  };
}

function searchPyvRenderer() {
  return {
    searchPyvRenderer: {
      title: { simpleText: 'Sponsored Search Placement' }
    }
  };
}

function videoRenderer() {
  return {
    videoRenderer: {
      videoId: 'NORMAL00001',
      title: { simpleText: 'Normal Video' },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const settingsShared = read('js/settings_shared.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    settingsShared,
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domSponsoredCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideSponsoredCards) {',
      '\n\n    if (settings.hideWatchPlaylistPanel) {'
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
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
      '            hideVideoSidebar: !!hideVideoSidebar,'
    )
  };
}

test('JSON-first hideSponsoredCards boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, sponsored-card/);
  assert.match(doc, /hideSponsoredCards boundary source files: 5/);
  assert.match(doc, /runtime hideSponsoredCards fixtures: 5/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6803 | 306710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
});

test('hideSponsoredCards source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback sponsored CSS rules block', blocks.domSponsoredCssRules, 15, 567],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared build compiled settings block', blocks.sharedBuildCompiledSettings, 54, 1916]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideSponsoredCards'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'adSlotRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'promotedSparkles'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'searchPyvRenderer'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideSponsoredCards'), 0);
  assert.equal(countLiteral(blocks.seed, 'adSlotRenderer'), 0);
  assert.equal(countLiteral(blocks.seed, 'promotedSparkles'), 0);
  assert.equal(countLiteral(blocks.seed, 'searchPyvRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideSponsoredCards'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-ad-slot-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-promoted'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-search-pyv-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-display-ad-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-companion-slot-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'engagement-panel-ads'), 1);
  assert.equal(countLiteral(blocks.background, 'hideSponsoredCards'), 13);
  assert.equal(countLiteral(blocks.settingsShared, 'hideSponsoredCards'), 23);

  assert.match(doc, /filter_logic total hideSponsoredCards tokens: 0/);
  assert.match(doc, /filter_logic total sponsored-ad-renderer tokens: 0/);
  assert.match(doc, /seed total hideSponsoredCards tokens: 0/);
  assert.match(doc, /seed total sponsored-ad-renderer tokens: 0/);
  assert.match(doc, /DOM fallback total hideSponsoredCards tokens: 2/);
  assert.match(doc, /DOM fallback total ytd-ad-slot-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-promoted selector tokens: 2/);
  assert.match(doc, /DOM fallback total ytd-search-pyv-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-display-ad-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-companion-slot-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total engagement-panel-ads tokens: 1/);
  assert.match(doc, /background total hideSponsoredCards tokens: 13/);
  assert.match(doc, /settings_shared total hideSponsoredCards tokens: 23/);
});

test('hideSponsoredCards does not remove JSON ad renderer families', () => {
  const config = { hideSponsoredCards: true };
  const adSlot = contents(adSlotRenderer());
  const promoted = contents(promotedSparklesWebRenderer());
  const searchAd = contents(searchPyvRenderer());

  assert.deepEqual(run(adSlot, config), plain(adSlot));
  assert.deepEqual(run(promoted, config), plain(promoted));
  assert.deepEqual(run(searchAd, config), plain(searchAd));
});

test('hideSponsoredCards leaves nested ad slot content and ordinary video rows visible in JSON', () => {
  const config = { hideSponsoredCards: true };
  const nestedAd = contents(adSlotRenderer({
    renderer: {
      promotedSparklesWebRenderer: {
        title: { simpleText: 'Sponsored Nested Product' },
        callToActionButton: { buttonRenderer: { text: { simpleText: 'Shop now' } } }
      }
    }
  }));
  const ordinaryVideo = contents(videoRenderer());

  assert.deepEqual(run(nestedAd, config), plain(nestedAd));
  assert.deepEqual(run(ordinaryVideo, config), plain(ordinaryVideo));
});

test('source proof pins DOM-only sponsored hiding and settings parity gap', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideSponsoredCards/);
  assert.doesNotMatch(blocks.filterLogic, /adSlotRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /promotedSparkles/);
  assert.doesNotMatch(blocks.filterLogic, /searchPyvRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideSponsoredCards/);
  assert.match(blocks.domSponsoredCssRules, /ytd-ad-slot-renderer/);
  assert.match(blocks.domSponsoredCssRules, /ytd-promoted-sparkles-web-renderer/);
  assert.match(blocks.domSponsoredCssRules, /ytd-promoted-sparkles-text-search-renderer/);
  assert.match(blocks.domSponsoredCssRules, /ytd-search-pyv-renderer/);
  assert.match(blocks.domSponsoredCssRules, /ytd-display-ad-renderer/);
  assert.match(blocks.domSponsoredCssRules, /ytd-companion-slot-renderer/);
  assert.match(blocks.domSponsoredCssRules, /engagement-panel-ads/);
  assert.match(blocks.domActiveBooleanKeys, /'hideSponsoredCards'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideSponsoredCards = boolFromV4\('hideSponsoredCards', items\.hideSponsoredCards \|\| false\)/);
  assert.match(blocks.bgRefreshKeys, /'hideSponsoredCards'/);
  assert.match(blocks.sharedSettingsKeys, /'hideSponsoredCards'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideSponsoredCards: !!hideSponsoredCards/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideSponsoredCards`/);
  assert.match(doc, /Ad-like JSON renderer objects pass through unchanged under the setting/);
  assert.match(doc, /DOM CSS hides ad slot, promoted sparkles, search PYV, display ad, companion ad, and engagement-panel ad selectors/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
