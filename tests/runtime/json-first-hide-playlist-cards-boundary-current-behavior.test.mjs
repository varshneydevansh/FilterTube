import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHidePlaylistCardsContract',
  'jsonFirstHidePlaylistCardsDecisionReport',
  'jsonFirstPlaylistCardsRendererInventoryPolicy',
  'jsonFirstPlaylistCardsJsonDomParityReport',
  'jsonFirstPlaylistCardsDomOnlyPolicy',
  'jsonFirstPlaylistCardsNoWorkBudget',
  'jsonFirstPlaylistCardsMixExclusionPolicy',
  'jsonFirstPlaylistCardsMarkerRestoreProof',
  'jsonFirstPlaylistCardsSettingsParityReport',
  'jsonFirstPlaylistCardsFixtureProvenance',
  'jsonFirstPlaylistCardsMetricArtifact'
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
    hidePlaylistCards: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-playlist-cards-boundary-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function playlistRenderer() {
  return {
    playlistRenderer: {
      playlistId: 'PL123456789012345',
      title: { simpleText: 'Calm Playlist' },
      videoCount: '12'
    }
  };
}

function compactPlaylistRenderer() {
  return {
    compactPlaylistRenderer: {
      playlistId: 'PLABCDEFGHIJKLMN',
      title: { simpleText: 'Compact Playlist' }
    }
  };
}

function playlistLockupViewModel() {
  return {
    lockupViewModel: {
      contentId: 'PLLOCKUPHOME1',
      metadata: {
        lockupMetadataViewModel: {
          title: { content: 'Playlist Lockup' },
          metadata: { content: '24 videos' }
        }
      },
      rendererContext: {
        commandContext: {
          onTap: {
            innertubeCommand: {
              commandMetadata: {
                webCommandMetadata: {
                  url: '/playlist?list=PLLOCKUPHOME1'
                }
              }
            }
          }
        }
      }
    }
  };
}

function radioRenderer() {
  return {
    radioRenderer: {
      playlistId: 'RDPLAYLIST01',
      title: { simpleText: 'Radio Mix' },
      navigationEndpoint: {
        commandMetadata: {
          webCommandMetadata: {
            url: '/watch?v=RADIO000001&list=RDPLAYLIST01&start_radio=1'
          }
        }
      }
    }
  };
}

function homeContinuationPayload(title = 'Calm playlist home card') {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'PLAYLIST001',
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
    domPlaylistCardsCssRules: sliceBetween(
      domFallback,
      '    if (settings.hidePlaylistCards) {',
      '\n\n    if (settings.hideMixPlaylists) {'
    ),
    domPlaylistCardsDirect: sliceBetween(
      domFallback,
      '        if (effectiveSettings.hidePlaylistCards) {',
      '\n\n        if (effectiveSettings.hideMixPlaylists) {'
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

test('JSON-first hidePlaylistCards boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, playlist-card/);
  assert.match(doc, /hidePlaylistCards boundary source files: 5/);
  assert.match(doc, /runtime hidePlaylistCards fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6343 | 286370 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
});

test('hidePlaylistCards source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback playlist-card CSS rules block', blocks.domPlaylistCardsCssRules, 16, 998],
    ['DOM fallback playlist-card direct block', blocks.domPlaylistCardsDirect, 26, 1457],
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

  assert.equal(countLiteral(blocks.filterLogic, 'hidePlaylistCards'), 0);
  assert.equal(countLiteral(blocks.seed, 'hidePlaylistCards'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hidePlaylistCards'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-playlist-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-grid-playlist-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'ytd-compact-playlist-renderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'yt-lockup-view-model'), 19);
  assert.equal(countLiteral(blocks.domFallback, 'yt-collection-thumbnail-view-model'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'yt-collections-stack'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'start_radio=1'), 10);
  assert.equal(countLiteral(blocks.background, 'hidePlaylistCards'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'hidePlaylistCards'), 23);

  assert.match(doc, /filter_logic total hidePlaylistCards tokens: 0/);
  assert.match(doc, /seed total hidePlaylistCards tokens: 0/);
  assert.match(doc, /DOM fallback total hidePlaylistCards tokens: 3/);
  assert.match(doc, /DOM fallback total ytd-playlist-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-grid-playlist-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total ytd-compact-playlist-renderer tokens: 1/);
  assert.match(doc, /DOM fallback total yt-lockup-view-model tokens: 19/);
  assert.match(doc, /DOM fallback total yt-collection-thumbnail-view-model tokens: 2/);
  assert.match(doc, /DOM fallback total yt-collections-stack tokens: 2/);
  assert.match(doc, /DOM fallback total start_radio=1 tokens: 10/);
  assert.match(doc, /background total hidePlaylistCards tokens: 12/);
  assert.match(doc, /settings_shared total hidePlaylistCards tokens: 23/);
});

test('hidePlaylistCards does not remove JSON playlist and Mix renderer families in filter_logic', () => {
  const config = { hidePlaylistCards: true };
  const classicPlaylist = contents(playlistRenderer());
  const compactPlaylist = contents(compactPlaylistRenderer());
  const lockupPlaylist = contents(playlistLockupViewModel());
  const radio = contents(radioRenderer());

  assert.deepEqual(run(classicPlaylist, config), plain(classicPlaylist));
  assert.deepEqual(run(compactPlaylist, config), plain(compactPlaylist));
  assert.deepEqual(run(lockupPlaylist, config), plain(lockupPlaylist));
  assert.deepEqual(run(radio, config), plain(radio));
});

test('desktop home browse hidePlaylistCards alone bypasses JSON body work while an active JSON rule still processes', async () => {
  const hideOnly = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  hideOnly.window.filterTube.updateSettings(settings({ hidePlaylistCards: true }));

  await hideOnly.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(hideOnly.calls.processData.length, 0);
  assert.equal(hideOnly.calls.harvestOnly.length, 0);

  const activeRule = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload('Playlist keyword match')
  });
  activeRule.window.filterTube.updateSettings(settings({
    hidePlaylistCards: true,
    filterKeywords: [{ pattern: 'playlist keyword', exact: false }]
  }));

  await activeRule.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(activeRule.calls.harvestOnly.length, 0);
  assert.equal(activeRule.calls.processData.length, 1);
  assert.equal(activeRule.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
});

test('source proof pins DOM-owned playlist-card hiding refresh omission and Mix exclusion', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.doesNotMatch(blocks.filterLogic, /hidePlaylistCards/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hidePlaylistCards/);
  assert.match(blocks.domPlaylistCardsCssRules, /ytd-playlist-renderer/);
  assert.match(blocks.domPlaylistCardsCssRules, /ytd-grid-playlist-renderer/);
  assert.match(blocks.domPlaylistCardsCssRules, /ytd-compact-playlist-renderer/);
  assert.match(blocks.domPlaylistCardsCssRules, /yt-lockup-view-model/);
  assert.match(blocks.domPlaylistCardsCssRules, /start_radio=1/);
  assert.match(blocks.domPlaylistCardsDirect, /effectiveSettings\.hidePlaylistCards/);
  assert.match(blocks.domPlaylistCardsDirect, /a\[href\*="start_radio=1"\]/);
  assert.match(blocks.domPlaylistCardsDirect, /a\[href\*="list="\]/);
  assert.match(blocks.domPlaylistCardsDirect, /ytd-shelf-renderer/);
  assert.match(blocks.domPlaylistCardsDirect, /ytd-horizontal-list-renderer/);
  assert.match(blocks.domActiveBooleanKeys, /'hidePlaylistCards'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hidePlaylistCards = boolFromV4\('hidePlaylistCards', items\.hidePlaylistCards \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hidePlaylistCards'/);
  assert.match(blocks.sharedSettingsKeys, /'hidePlaylistCards'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hidePlaylistCards: !!hidePlaylistCards/);
  assert.match(doc, /Background storage-change invalidation does not include `hidePlaylistCards` today/);
  assert.match(doc, /Seed JSON active-work detection does not include `hidePlaylistCards`/);
  assert.match(doc, /Playlist-like JSON renderer objects pass through unchanged when only `hidePlaylistCards` is enabled/);
  assert.match(doc, /CSS and DOM direct pass exclude `start_radio=1`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
