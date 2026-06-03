import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideSubscriptionsContract',
  'jsonFirstHideSubscriptionsDecisionReport',
  'jsonFirstSubscriptionsRendererInventoryPolicy',
  'jsonFirstSubscriptionsJsonDomParityReport',
  'jsonFirstSubscriptionsDomOnlyPolicy',
  'jsonFirstSubscriptionsNoWorkBudget',
  'jsonFirstSubscriptionsCacheInvalidationReport',
  'jsonFirstSubscriptionsRoutePolicy',
  'jsonFirstSubscriptionsSettingsParityReport',
  'jsonFirstSubscriptionsFixtureProvenance',
  'jsonFirstSubscriptionsMetricArtifact'
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
    hideSubscriptions: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-subscriptions-boundary-fixture'));
}

function compactVideo(title = 'Keep me near Subscriptions', videoId = 'SUBS001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function subscriptionsSection(title = 'Subscriptions') {
  return {
    guideSectionRenderer: {
      formattedTitle: { simpleText: title },
      items: [
        {
          guideEntryRenderer: {
            formattedTitle: { simpleText: 'Creator Channel' },
            navigationEndpoint: {
              commandMetadata: {
                webCommandMetadata: { url: '/@creator' }
              }
            }
          }
        }
      ]
    }
  };
}

function subscriptionsPayload(items = [subscriptionsSection(), compactVideo()]) {
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
    domSubscriptionsCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideSubscriptions) {',
      '\n\n    if (settings.hideSearchShelves) {'
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
    sharedSubscriptionsCompile: sliceBetween(
      settingsShared,
      '            hideSubscriptions: !!hideSubscriptions,',
      '            showQuickBlockButton: showQuickBlockButton !== false,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideSubscriptions boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, subscriptions filtering patch/);
  assert.match(doc, /hideSubscriptions boundary source files: 6/);
  assert.match(doc, /runtime hideSubscriptions fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6343 | 286370 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 845 | 34241 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideSubscriptions source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback subscriptions CSS rules block', blocks.domSubscriptionsCssRules, 9, 437],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared subscriptions compile block', blocks.sharedSubscriptionsCompile, 1, 52],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideSubscriptions'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideSubscriptions'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideSubscriptions'), 2);
  assert.equal(countLiteral(blocks.background, 'hideSubscriptions'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideSubscriptions'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideSubscriptions'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'guideSectionRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'guideEntryRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'compactLinkRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-guide-section-renderer'), 2);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, '/feed/subscriptions'), 1);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, 'page-subtype="subscriptions"'), 1);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, 'ytd-guide-collapsible-section-entry-renderer'), 1);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, ':has('), 3);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, '/feed/history'), 1);
  assert.equal(countLiteral(blocks.domSubscriptionsCssRules, 'a[href^="/@"]'), 1);

  assert.match(doc, /filter_logic total hideSubscriptions tokens: 0/);
  assert.match(doc, /seed total hideSubscriptions tokens: 0/);
  assert.match(doc, /DOM fallback total hideSubscriptions tokens: 2/);
  assert.match(doc, /background total hideSubscriptions tokens: 12/);
  assert.match(doc, /settings_shared total hideSubscriptions tokens: 23/);
  assert.match(doc, /bridge_settings total hideSubscriptions token: 1/);
  assert.match(doc, /filter_logic total guideSectionRenderer tokens: 1/);
  assert.match(doc, /filter_logic total guideEntryRenderer tokens: 0/);
  assert.match(doc, /filter_logic total compactLinkRenderer tokens: 0/);
  assert.match(doc, /DOM fallback total ytd-guide-section-renderer tokens: 2/);
  assert.match(doc, /DOM fallback subscriptions CSS block \/feed\/subscriptions tokens: 1/);
  assert.match(doc, /DOM fallback subscriptions CSS block page-subtype="subscriptions" tokens: 1/);
  assert.match(doc, /DOM fallback subscriptions CSS block ytd-guide-collapsible-section-entry-renderer tokens: 1/);
  assert.match(doc, /DOM fallback subscriptions CSS block :has\( tokens: 3/);
  assert.match(doc, /DOM fallback subscriptions CSS block \/feed\/history tokens: 1/);
  assert.match(doc, /DOM fallback subscriptions CSS block a\[href\^="\/@"\] tokens: 1/);
});

test('hideSubscriptions does not remove JSON guide sections or neighboring rows in filter_logic', () => {
  const payload = subscriptionsPayload();

  assert.deepEqual(run(payload, { hideSubscriptions: true }), plain(payload));
});

test('ordinary keyword rules can remove neighboring watch rows while Subscriptions JSON remains', () => {
  const payload = subscriptionsPayload([
    subscriptionsSection(),
    compactVideo('Block me near Subscriptions', 'SUBSBLOCK'),
    compactVideo('Keep me near Subscriptions', 'SUBSKEEP')
  ]);
  const result = run(payload, {
    hideSubscriptions: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const items = result.contents.guideResponseRenderer.items;
  assert.equal(items.length, 2);
  assert.equal(items[0].guideSectionRenderer.formattedTitle.simpleText, 'Subscriptions');
  assert.equal(items[1].compactVideoRenderer.videoId, 'SUBSKEEP');
});

test('guide hideSubscriptions alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: subscriptionsPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideSubscriptions: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned subscriptions hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideSubscriptions/);
  assert.match(blocks.filterLogic, /guideSectionRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /guideEntryRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /compactLinkRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideSubscriptions/);
  assert.match(blocks.domSubscriptionsCssRules, /\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]/);
  assert.match(blocks.domSubscriptionsCssRules, /#sections > ytd-guide-section-renderer:has\(ytd-guide-collapsible-section-entry-renderer\):has\(a\[href\^="\/@"\]\):not\(:has\(a\[href="\/feed\/history"\]\)\)/);
  assert.match(blocks.domSubscriptionsCssRules, /ytd-browse\[page-subtype="subscriptions"\]/);
  assert.match(blocks.domActiveBooleanKeys, /'hideSubscriptions'/);
  assert.match(blocks.bgStorageReadKeys, /'hideSubscriptions'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideSubscriptions = boolFromV4\('hideSubscriptions', items\.hideSubscriptions \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideSubscriptions'/);
  assert.match(blocks.sharedSettingsKeys, /'hideSubscriptions'/);
  assert.match(blocks.sharedSubscriptionsCompile, /hideSubscriptions: !!hideSubscriptions/);
  assert.match(blocks.bridgeRefreshKeys, /'hideSubscriptions'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideSubscriptions` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideSubscriptions`/);
  assert.match(doc, /Subscriptions guide JSON sections pass through unchanged when only\s+`hideSubscriptions` is enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a neighboring supported row while\s+Subscriptions guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/guide` now bypasses `processData` with only\s+`hideSubscriptions` enabled/);
  assert.match(doc, /DOM fallback owns `\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]`/);
  assert.match(doc, /`ytd-browse\[page-subtype="subscriptions"\]`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
