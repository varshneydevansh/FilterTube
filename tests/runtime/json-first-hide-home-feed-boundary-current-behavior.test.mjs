import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideHomeFeedContract',
  'jsonFirstHideHomeFeedDecisionReport',
  'jsonFirstHomeFeedRoutePolicy',
  'jsonFirstHomeFeedJsonDomParityReport',
  'jsonFirstHomeFeedDomOnlyPolicy',
  'jsonFirstHomeFeedNoWorkBudget',
  'jsonFirstHomeFeedMarkerRestoreProof',
  'jsonFirstHomeFeedMobileParityReport',
  'jsonFirstHomeFeedFixtureProvenance',
  'jsonFirstHomeFeedMetricArtifact'
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
    hideHomeFeed: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-home-feed-boundary-fixture'));
}

function homeContinuationPayload(title = 'Calm home card') {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'HOMEFEED001',
                title: { runs: [{ text: title }] },
                shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function richGridPayload(...items) {
  return {
    contents: {
      twoColumnBrowseResultsRenderer: {
        tabs: [{
          tabRenderer: {
            content: {
              richGridRenderer: {
                contents: items
              }
            }
          }
        }]
      }
    }
  };
}

function richItemRenderer(title = 'Calm home card') {
  return {
    richItemRenderer: {
      content: {
        videoRenderer: {
          videoId: 'HOMEFEED001',
          title: { runs: [{ text: title }] },
          shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
        }
      }
    }
  };
}

function richSectionRenderer() {
  return {
    richSectionRenderer: {
      content: {
        richShelfRenderer: {
          title: { runs: [{ text: 'Home section' }] },
          contents: [richItemRenderer('Section home card')]
        }
      }
    }
  };
}

function lockupViewModel() {
  return {
    lockupViewModel: {
      contentId: 'LOCKUPHOME1',
      metadata: {
        lockupMetadataViewModel: {
          title: { content: 'Home lockup card' }
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
      '\n    function hasNetworkJsonWork'
    ),
    seedHomeBrowseSkip: sliceBetween(
      seed,
      "        const isBrowseFetch = typeof dataName === 'string' && dataName.startsWith('fetch:/youtubei/v1/browse');",
      '\n    }\n\n    function processWithEngine'
    ),
    domHomeFeedCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideHomeFeed) {',
      '\n\n    if (settings.hideSponsoredCards) {'
    ),
    domHomeFeedFallback: sliceBetween(
      domFallback,
      'function handleHomeFeedFallback(settings) {',
      '\n\nfunction handleCommentsFallback'
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

test('JSON-first hideHomeFeed boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior changed for no-work gating/);
  assert.match(doc, /not an implementation patch, optimization patch, home-feed/);
  assert.match(doc, /hideHomeFeed boundary source files: 5/);
  assert.match(doc, /runtime hideHomeFeed fixtures: 5/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6803 | 306710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
});

test('hideHomeFeed source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 464],
    ['seed desktop home browse skip block', blocks.seedHomeBrowseSkip, 37, 1618],
    ['DOM fallback home-feed CSS rules block', blocks.domHomeFeedCssRules, 12, 622],
    ['DOM fallback home-feed marker block', blocks.domHomeFeedFallback, 23, 1286],
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

  assert.equal(countLiteral(blocks.filterLogic, 'hideHomeFeed'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideHomeFeed'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideHomeFeed'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-hidden-by-hide-home-feed'), 4);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-browse[page-subtype="home"]'), 4);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-route-home'), 9);
  assert.equal(countLiteral(blocks.domFallback, 'ytm-rich-grid-renderer'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'ytm-rich-section-renderer'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'ytm-item-section-renderer'), 7);
  assert.equal(countLiteral(blocks.domFallback, 'ytm-section-list-renderer'), 3);
  assert.equal(countLiteral(blocks.background, 'hideHomeFeed'), 13);
  assert.equal(countLiteral(blocks.settingsShared, 'hideHomeFeed'), 23);

  assert.match(doc, /filter_logic total hideHomeFeed tokens: 0/);
  assert.match(doc, /seed total hideHomeFeed tokens: 0/);
  assert.match(doc, /DOM fallback total hideHomeFeed tokens: 3/);
  assert.match(doc, /DOM fallback total data-filtertube-hidden-by-hide-home-feed tokens: 4/);
  assert.match(doc, /DOM fallback total ytd-browse home selector tokens: 4/);
  assert.match(doc, /DOM fallback total data-filtertube-route-home tokens: 9/);
  assert.match(doc, /DOM fallback total ytm-rich-grid-renderer tokens: 2/);
  assert.match(doc, /DOM fallback total ytm-rich-section-renderer tokens: 2/);
  assert.match(doc, /DOM fallback total ytm-item-section-renderer tokens: 7/);
  assert.match(doc, /DOM fallback total ytm-section-list-renderer tokens: 3/);
  assert.match(doc, /background total hideHomeFeed tokens: 13/);
  assert.match(doc, /settings_shared total hideHomeFeed tokens: 23/);
});

test('hideHomeFeed does not remove JSON home renderer families in filter_logic', () => {
  const config = { hideHomeFeed: true };
  const richItem = richGridPayload(richItemRenderer());
  const sectionAndLockup = richGridPayload(richSectionRenderer(), lockupViewModel());

  assert.deepEqual(run(richItem, config), plain(richItem));
  assert.deepEqual(run(sectionAndLockup, config), plain(sectionAndLockup));
});

test('desktop home browse hideHomeFeed alone bypasses JSON body work while an active JSON rule still processes', async () => {
  const hideOnly = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  hideOnly.window.filterTube.updateSettings(settings({ hideHomeFeed: true }));

  await hideOnly.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(hideOnly.calls.responseJson.length, 0);
  assert.equal(hideOnly.calls.jsonStringify.length, 0);
  assert.equal(hideOnly.calls.processData.length, 0);
  assert.equal(hideOnly.calls.harvestOnly.length, 0);

  const activeRule = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload('Keyword match home card')
  });
  activeRule.window.filterTube.updateSettings(settings({
    hideHomeFeed: true,
    filterKeywords: [{ pattern: 'keyword match', exact: false }]
  }));

  await activeRule.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(activeRule.calls.harvestOnly.length, 0);
  assert.equal(activeRule.calls.processData.length, 1);
  assert.equal(activeRule.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
});

test('mobile home browse hideHomeFeed bypasses JSON body work and leaves home rows unchanged', async () => {
  const payload = homeContinuationPayload();
  const runtime = loadSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/',
    payload,
    processData(data, activeSettings, dataName) {
      return loadFilterTubeEngine().engine.processData(data, activeSettings, dataName);
    }
  });
  runtime.window.filterTube.updateSettings(settings({ hideHomeFeed: true }));

  const response = await runtime.window.fetch('https://m.youtube.com/youtubei/v1/browse?prettyPrint=false');
  const body = await response.json();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.deepEqual(body, payload);
});

test('source proof pins DOM-owned home-feed hiding and route parity gap', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideHomeFeed/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideHomeFeed/);
  assert.match(blocks.seedHomeBrowseSkip, /const isBrowseFetch = typeof dataName === 'string'/);
  assert.match(blocks.seedHomeBrowseSkip, /const isOnHomeFeed = path === '\/' && !isMobileInterface/);
  assert.match(blocks.seedHomeBrowseSkip, /hasRichGridContent/);
  assert.match(blocks.domHomeFeedCssRules, /ytd-browse\[page-subtype="home"\]/);
  assert.match(blocks.domHomeFeedCssRules, /data-filtertube-route-home/);
  assert.match(blocks.domHomeFeedFallback, /data-filtertube-hidden-by-hide-home-feed/);
  assert.match(blocks.domHomeFeedFallback, /settings\.hideHomeFeed && isHomeRoute/);
  assert.match(blocks.domActiveBooleanKeys, /'hideHomeFeed'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideHomeFeed = boolFromV4\('hideHomeFeed', items\.hideHomeFeed \|\| false\)/);
  assert.match(blocks.bgRefreshKeys, /'hideHomeFeed'/);
  assert.match(blocks.sharedSettingsKeys, /'hideHomeFeed'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideHomeFeed: !!hideHomeFeed/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideHomeFeed`/);
  assert.match(doc, /Desktop `\/youtubei\/v1\/browse` home continuations with rich-grid content bypass JSON body work when no active JSON work exists/);
  assert.match(doc, /Home-feed JSON renderer objects pass through unchanged when only `hideHomeFeed` is enabled/);
  assert.match(doc, /DOM fallback writes and clears `data-filtertube-hidden-by-hide-home-feed`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
