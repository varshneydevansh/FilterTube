import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideLiveChatContract',
  'jsonFirstHideLiveChatDecisionReport',
  'jsonFirstLiveChatRendererInventoryPolicy',
  'jsonFirstLiveChatJsonDomParityReport',
  'jsonFirstLiveChatDomOnlyPolicy',
  'jsonFirstLiveChatNoWorkBudget',
  'jsonFirstLiveChatCacheInvalidationReport',
  'jsonFirstLiveChatRoutePolicy',
  'jsonFirstLiveChatSettingsParityReport',
  'jsonFirstLiveChatFixtureProvenance',
  'jsonFirstLiveChatMetricArtifact'
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
    hideLiveChat: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-live-chat-boundary-fixture'));
}

function compactVideo(title = 'Block me live chat neighbor', videoId = 'LIVECHAT001') {
  return {
    compactVideoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function liveChatPanel(title = 'Live chat') {
  return {
    engagementPanelSectionListRenderer: {
      targetId: 'engagement-panel-live-chat',
      header: {
        engagementPanelTitleHeaderRenderer: {
          title: { simpleText: title }
        }
      },
      content: {
        liveChatRenderer: {
          continuations: [
            { reloadContinuationData: { continuation: 'LIVECHAT' } }
          ]
        }
      }
    }
  };
}

function watchNextPayload(results = [liveChatPanel()]) {
  return {
    engagementPanels: [liveChatPanel('Live chat top-level panel')],
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
    domLiveChatCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideLiveChat) {',
      '\n\n    if (settings.hideAllComments) {'
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

test('JSON-first hideLiveChat boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, live-chat/);
  assert.match(doc, /hideLiveChat boundary source files: 6/);
  assert.match(doc, /runtime hideLiveChat fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6773 | 305166 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('hideLiveChat source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback live-chat CSS rules block', blocks.domLiveChatCssRules, 8, 195],
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

  assert.equal(countLiteral(blocks.filterLogic, 'hideLiveChat'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideLiveChat'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideLiveChat'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-live-chat-frame#chat'), 1);
  assert.equal(countLiteral(blocks.domFallback, '#chat-container'), 1);
  assert.equal(countLiteral(blocks.background, 'hideLiveChat'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hideLiveChat'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'hideLiveChat'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'engagementPanelSectionListRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'liveChatRenderer'), 0);

  assert.match(doc, /filter_logic total hideLiveChat tokens: 0/);
  assert.match(doc, /seed total hideLiveChat tokens: 0/);
  assert.match(doc, /DOM fallback total hideLiveChat tokens: 2/);
  assert.match(doc, /DOM fallback total ytd-live-chat-frame#chat tokens: 1/);
  assert.match(doc, /DOM fallback total #chat-container tokens: 1/);
  assert.match(doc, /background total hideLiveChat tokens: 12/);
  assert.match(doc, /settings_shared total hideLiveChat tokens: 23/);
  assert.match(doc, /bridge_settings total hideLiveChat tokens: 1/);
  assert.match(doc, /filter_logic total engagementPanelSectionListRenderer tokens: 0/);
  assert.match(doc, /filter_logic total liveChatRenderer tokens: 0/);
});

test('hideLiveChat does not remove JSON live chat engagement panels in filter_logic', () => {
  const payload = watchNextPayload();

  assert.deepEqual(run(payload, { hideLiveChat: true }), plain(payload));
});

test('ordinary keyword rules can remove neighboring watch rows while live chat JSON remains', () => {
  const payload = watchNextPayload([
    compactVideo('Block me live chat neighbor', 'LIVECHAT001'),
    liveChatPanel('Live chat nested panel')
  ]);
  const result = run(payload, {
    hideLiveChat: true,
    filterKeywords: [{ pattern: 'block me', flags: 'i' }]
  });

  const results = result.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  assert.equal(results.length, 1);
  assert.ok(results[0].engagementPanelSectionListRenderer);
  assert.equal(result.engagementPanels.length, 1);
  assert.equal(result.engagementPanels[0].engagementPanelSectionListRenderer.targetId, 'engagement-panel-live-chat');
});

test('watch next hideLiveChat alone bypasses JSON engine work through the no-active-JSON gate', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: watchNextPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ hideLiveChat: true }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned live-chat hiding refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hideLiveChat/);
  assert.doesNotMatch(blocks.filterLogic, /engagementPanelSectionListRenderer/);
  assert.doesNotMatch(blocks.filterLogic, /liveChatRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideLiveChat/);
  assert.match(blocks.domLiveChatCssRules, /ytd-live-chat-frame#chat/);
  assert.match(blocks.domLiveChatCssRules, /#chat-container/);
  assert.match(blocks.domActiveBooleanKeys, /'hideLiveChat'/);
  assert.match(blocks.bgStorageReadKeys, /'hideLiveChat'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideLiveChat = boolFromV4\('hideLiveChat', items\.hideLiveChat \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideLiveChat'/);
  assert.match(blocks.sharedSettingsKeys, /'hideLiveChat'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideLiveChat: !!hideLiveChat/);
  assert.match(blocks.bridgeRefreshKeys, /'hideLiveChat'/);
  assert.match(doc, /Background storage-change invalidation does not include `hideLiveChat` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideLiveChat`/);
  assert.match(doc, /Live chat JSON engagement panels pass through unchanged when only `hideLiveChat` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only `hideLiveChat` enabled/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
