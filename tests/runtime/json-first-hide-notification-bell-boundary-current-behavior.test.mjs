import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideNotificationBellContract',
  'jsonFirstHideNotificationBellDecisionReport',
  'jsonFirstNotificationBellRendererInventoryPolicy',
  'jsonFirstNotificationBellJsonDomParityReport',
  'jsonFirstNotificationBellDomOnlyPolicy',
  'jsonFirstNotificationBellNoWorkBudget',
  'jsonFirstNotificationBellCacheInvalidationReport',
  'jsonFirstNotificationBellRoutePolicy',
  'jsonFirstNotificationBellSettingsParityReport',
  'jsonFirstNotificationBellFixtureProvenance',
  'jsonFirstNotificationBellMetricArtifact'
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
    hideNotificationBell: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-notification-bell-boundary-fixture'));
}

function compactVideo(title = 'Keep me under notifications', videoId = 'NOTIFY001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function notificationRow(title = 'Notify me') {
  return {
    notificationRenderer: {
      title: { runs: [{ text: title }] },
      shortMessage: { simpleText: 'Neutral notification' },
      sentTimeText: { simpleText: '1 hour ago' },
      navigationEndpoint: {
        browseEndpoint: {
          browseId: 'UCNOTIFY001',
          canonicalBaseUrl: '/@notify-channel'
        }
      }
    }
  };
}

function notificationPayload(results = [notificationRow(), compactVideo()]) {
  return {
    topbar: {
      desktopTopbarRenderer: {
        notificationTopbarButtonRenderer: {
          icon: { iconType: 'NOTIFICATIONS' }
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
    filterLogicNotificationRule: sliceBetween(
      filterLogic,
      '        notificationRenderer: {',
      '        commentVideoThumbnailHeaderRenderer: {'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domNotificationBellCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideNotificationBell) {',
      '\n\n    if (settings.hideExploreTrending) {'
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
    sharedNotificationCompile: sliceBetween(
      settingsShared,
      '            hideTopHeader: !!hideTopHeader,',
      '            hideExploreTrending: !!hideExploreTrending,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first hideNotificationBell boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, notification-bell filtering patch/);
  assert.match(doc, /hideNotificationBell boundary source files: 6/);
  assert.match(doc, /runtime hideNotificationBell fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6343 | 286370 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 845 | 34241 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideNotificationBell source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic notificationRenderer rule block', blocks.filterLogicNotificationRule, 17, 899],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback notification-bell CSS rules block', blocks.domNotificationBellCssRules, 8, 248],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared notification-bell compile block', blocks.sharedNotificationCompile, 2, 102],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideNotificationBell'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideNotificationBell'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideNotificationBell'), 2);
  assert.equal(countLiteral(blocks.background, 'hideNotificationBell'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideNotificationBell'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideNotificationBell'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'notificationRenderer'), 1);
  assert.equal(countLiteral(blocks.seed, 'notificationRenderer'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-notification-topbar-button-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-notification-topbar-button-shape-renderer'), 1);

  assert.match(doc, /filter_logic total hideNotificationBell tokens: 0/);
  assert.match(doc, /seed total hideNotificationBell tokens: 0/);
  assert.match(doc, /DOM fallback total hideNotificationBell tokens: 2/);
  assert.match(doc, /background total hideNotificationBell tokens: 12/);
  assert.match(doc, /settings_shared total hideNotificationBell tokens: 23/);
  assert.match(doc, /bridge_settings total hideNotificationBell token: 1/);
  assert.match(doc, /filter_logic total notificationRenderer tokens: 1/);
  assert.match(doc, /seed total notificationRenderer tokens: 0/);
  assert.match(doc, /DOM fallback total ytd-notification-topbar-button-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-notification-topbar-button-shape-renderer tokens: 1/);
});

test('hideNotificationBell does not remove JSON notification button or notification rows in filter_logic', () => {
  const payload = notificationPayload();

  assert.deepEqual(run(payload, { hideNotificationBell: true }), plain(payload));
});

test('ordinary keyword rules can remove notificationRenderer rows while topbar notification JSON remains', () => {
  const payload = notificationPayload([
    notificationRow('Block me notification'),
    compactVideo('Keep me under notifications', 'NOTIFYKEEP')
  ]);
  const result = run(payload, {
    hideNotificationBell: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const results = result.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  assert.equal(results.length, 1);
  assert.equal(results[0].compactVideoRenderer.videoId, 'NOTIFYKEEP');
  assert.ok(result.topbar.desktopTopbarRenderer.notificationTopbarButtonRenderer);
});

test('watch next hideNotificationBell alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: notificationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideNotificationBell: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned notification-bell hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideNotificationBell/);
  assert.match(blocks.filterLogicNotificationRule, /notificationRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /notificationTopbarButtonRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideNotificationBell/);
  assert.match(blocks.domNotificationBellCssRules, /ytd-notification-topbar-button-renderer/);
  assert.match(blocks.domNotificationBellCssRules, /ytd-notification-topbar-button-shape-renderer/);
  assert.match(blocks.domActiveBooleanKeys, /'hideNotificationBell'/);
  assert.match(blocks.bgStorageReadKeys, /'hideNotificationBell'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideNotificationBell = boolFromV4\('hideNotificationBell', items\.hideNotificationBell \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideNotificationBell'/);
  assert.match(blocks.sharedSettingsKeys, /'hideNotificationBell'/);
  assert.match(blocks.sharedNotificationCompile, /hideNotificationBell: !!hideNotificationBell/);
  assert.match(blocks.bridgeRefreshKeys, /'hideNotificationBell'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideNotificationBell` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideNotificationBell`/);
  assert.match(doc, /Topbar notification button JSON and ordinary neighboring rows pass through\s+unchanged when only `hideNotificationBell` is enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a matching `notificationRenderer` row\s+while topbar notification button JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only\s+`hideNotificationBell` enabled/);
  assert.match(doc, /DOM fallback owns `ytd-notification-topbar-button-renderer` and\s+`ytd-notification-topbar-button-shape-renderer`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
