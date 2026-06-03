import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROL_JSON_FIRST_BOUNDARY_INDEX_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const contentControlMethodGapDocs = [
  docPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_UPPERCASE_TITLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

const authoritySymbols = [
  'contentControlJsonFirstBoundaryIndex',
  'contentControlRuntimeSettingContract',
  'contentControlBoundaryProofManifest',
  'contentControlAliasPolicy',
  'contentControlJsonDomParityMatrix',
  'contentControlNoWorkBudgetMatrix',
  'contentControlSettingsInvalidationParityReport',
  'contentControlFixtureProvenance',
  'contentControlFirstClassJsonGate'
];

const expectedRows = [
  ['core', 'hideShorts', 'hideAllShorts', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs'],
  ['core', 'hideHomeFeed', 'hideHomeFeed', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-home-feed-boundary-current-behavior.test.mjs'],
  ['core', 'hideComments', 'hideAllComments', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-all-comments-boundary-current-behavior.test.mjs'],
  ['feed', 'hideSponsoredCards', 'hideSponsoredCards', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-sponsored-cards-boundary-current-behavior.test.mjs'],
  ['feed', 'hidePlaylistCards', 'hidePlaylistCards', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-playlist-cards-boundary-current-behavior.test.mjs'],
  ['feed', 'hideMembersOnly', 'hideMembersOnly', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-members-only-boundary-current-behavior.test.mjs'],
  ['feed', 'hideMixPlaylists', 'hideMixPlaylists', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-mix-playlists-boundary-current-behavior.test.mjs'],
  ['feed', 'showQuickBlockButton', 'showQuickBlockButton', 'docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs'],
  ['feed', 'showBlockMenuItem', 'showBlockMenuItem', 'docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs'],
  ['watch', 'hideVideoSidebar', 'hideVideoSidebar', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-video-sidebar-boundary-current-behavior.test.mjs'],
  ['watch', 'hideRecommended', 'hideRecommended', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-recommended-boundary-current-behavior.test.mjs'],
  ['watch', 'hideLiveChat', 'hideLiveChat', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-live-chat-boundary-current-behavior.test.mjs'],
  ['watch', 'hideWatchPlaylistPanel', 'hideWatchPlaylistPanel', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-watch-playlist-panel-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideVideoInfo', 'hideVideoInfo', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-video-info-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideVideoButtonsBar', 'hideVideoButtonsBar', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-video-buttons-bar-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideAskButton', 'hideAskButton', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-ask-button-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideVideoChannelRow', 'hideVideoChannelRow', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-video-channel-row-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideVideoDescription', 'hideVideoDescription', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-video-description-boundary-current-behavior.test.mjs'],
  ['video_info', 'hideMerchTicketsOffers', 'hideMerchTicketsOffers', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-merch-tickets-offers-boundary-current-behavior.test.mjs'],
  ['player', 'hideEndscreenVideowall', 'hideEndscreenVideowall', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs'],
  ['player', 'hideEndscreenCards', 'hideEndscreenCards', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-endscreen-cards-boundary-current-behavior.test.mjs'],
  ['player', 'disableAutoplay', 'disableAutoplay', 'docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs'],
  ['player', 'disableAnnotations', 'disableAnnotations', 'docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs'],
  ['navigation', 'hideTopHeader', 'hideTopHeader', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-top-header-boundary-current-behavior.test.mjs'],
  ['navigation', 'hideNotificationBell', 'hideNotificationBell', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-notification-bell-boundary-current-behavior.test.mjs'],
  ['navigation', 'hideExploreTrending', 'hideExploreTrending', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-explore-trending-boundary-current-behavior.test.mjs'],
  ['navigation', 'hideMoreFromYouTube', 'hideMoreFromYouTube', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-more-from-youtube-boundary-current-behavior.test.mjs'],
  ['navigation', 'hideSubscriptions', 'hideSubscriptions', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-subscriptions-boundary-current-behavior.test.mjs'],
  ['search', 'hideSearchShelves', 'hideSearchShelves', 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md', 'tests/runtime/json-first-hide-search-shelves-boundary-current-behavior.test.mjs']
].map(([group, key, runtimeKey, proofDoc, proofTest]) => ({ group, key, runtimeKey, proofDoc, proofTest }));

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

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function loadCatalog() {
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/content_controls_catalog.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.FilterTubeContentControlsCatalog.getCatalog()));
}

function sourceBlocks() {
  const settingsShared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    stateValidKeys: sliceBetween(
      stateManager,
      '        const validKeys = [',
      '        ];\n\n        if (!validKeys.includes(key))'
    ),
    stateExternalReloadKeys: sliceBetween(
      stateManager,
      '                const storageKeys = [',
      '                const hasSettingsChange = storageKeys.some'
    ),
    backgroundRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    )
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('content-control JSON-first boundary index is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, catalog patch/);
  assert.match(doc, /content control JSON-first boundary source files: 4/);
  assert.match(doc, /catalog group count: 7/);
  assert.match(doc, /catalog control count: 29/);
  assert.match(doc, /catalog controls with JSON-first-named proof docs: 27/);
  assert.match(doc, /unique proof docs: 27/);
  assert.match(doc, /unique proof tests: 27/);
  assert.match(doc, /runtime alias controls: 2/);
  assert.match(doc, /direct runtime key controls: 27/);
  assert.match(doc, /default-on affordance controls: 2/);

  assert.ok(doc.includes(`| \`js/content_controls_catalog.js\` | 222 | 7822 | \`${sha256('js/content_controls_catalog.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/state_manager.js\` | 2491 | 99780 | \`${sha256('js/state_manager.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6343 | 286370 | \`${sha256('js/background.js')}\` |`));
});

test('content-control JSON-first family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  for (const marker of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5744',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5744',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(marker), `method gap source missing ${marker}`);
  }

  assert.equal(contentControlMethodGapDocs.length, 19);
  for (const file of contentControlMethodGapDocs) {
    const text = read(file);
    assert.ok(text.includes(methodGapPath), `${file} should cite method gap source`);
    assert.match(text, /## Method Semantic Proof Gap Boundary/);
    assert.match(text, /method semantic proof gap files covered: 69/);
    assert.match(text, /method semantic proof gap lexical callables covered: 5744/);
    assert.match(text, /files with complete per-callable semantic proof: 0/);
    assert.match(text, /lexical callables requiring semantic proof before behavior changes: 5744/);
    assert.match(text, /affected callable semantic proof: NO-GO/);
    assert.match(text, /runtime behavior changed: no/);
    assert.match(text, /do not approve runtime\s+optimization/);
    assert.match(text, /JSON-first behavior/);
    assert.match(text, /content-control promotion/);
  }
});

test('catalog controls map to current proof docs and tests', () => {
  const doc = read(docPath);
  const groups = loadCatalog();
  const rows = groups.flatMap((group) => (group.controls || []).map((control) => ({
    group: group.id,
    key: control.key
  })));

  assert.deepEqual(groups.map((group) => group.id), ['core', 'feed', 'watch', 'video_info', 'player', 'navigation', 'search']);
  assert.deepEqual(groups.map((group) => `${group.id}:${group.controls.length}`), ['core:3', 'feed:6', 'watch:4', 'video_info:6', 'player:4', 'navigation:5', 'search:1']);
  assert.deepEqual(rows.map((row) => `${row.group}:${row.key}`), expectedRows.map((row) => `${row.group}:${row.key}`));

  const uniqueDocs = new Set(expectedRows.map((row) => row.proofDoc));
  const uniqueTests = new Set(expectedRows.map((row) => row.proofTest));
  assert.equal(expectedRows.length, 29);
  assert.equal(uniqueDocs.size, 27);
  assert.equal(uniqueTests.size, 27);
  assert.equal(expectedRows.filter((row) => row.proofDoc.includes('JSON_FIRST')).length, 27);
  assert.equal(uniqueDocs.size - [...uniqueDocs].filter((file) => file.includes('JSON_FIRST')).length, 1);

  for (const row of expectedRows) {
    assert.ok(fs.existsSync(path.join(repoRoot, row.proofDoc)), `missing proof doc for ${row.key}`);
    assert.ok(fs.existsSync(path.join(repoRoot, row.proofTest)), `missing proof test for ${row.key}`);
    assert.match(doc, new RegExp(`\\| ${row.group} \\| \`${row.key}\` \\| \`${row.runtimeKey}\` \\|`));
    assert.ok(doc.includes(row.proofDoc), `doc missing proof artifact path for ${row.key}`);
  }

  assert.match(doc, /catalog group ids: core, feed, watch, video_info, player, navigation, search/);
  assert.match(doc, /catalog group sizes: core=3, feed=6, watch=4, video_info=6, player=4, navigation=5, search=1/);
  assert.match(doc, /catalog control keys: hideShorts, hideHomeFeed, hideComments, hideSponsoredCards/);
});

test('catalog aliases and settings invalidation are split across current owners', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.match(blocks.sharedSettingsKeys, /'hideAllShorts'/);
  assert.match(blocks.sharedSettingsKeys, /'hideAllComments'/);
  assert.doesNotMatch(blocks.sharedSettingsKeys, /'hideShorts'/);
  assert.doesNotMatch(blocks.sharedSettingsKeys, /'hideComments'/);

  assert.match(blocks.stateValidKeys, /'hideShorts'/);
  assert.match(blocks.stateValidKeys, /'hideComments'/);
  assert.doesNotMatch(blocks.stateValidKeys, /'hideAllShorts'/);
  assert.doesNotMatch(blocks.stateValidKeys, /'hideAllComments'/);

  assert.match(blocks.stateExternalReloadKeys, /'hideAllShorts'/);
  assert.match(blocks.stateExternalReloadKeys, /'hideAllComments'/);
  assert.doesNotMatch(blocks.stateExternalReloadKeys, /'hideShorts'/);
  assert.doesNotMatch(blocks.stateExternalReloadKeys, /'hideComments'/);

  assert.match(blocks.backgroundRefreshKeys, /'hideAllShorts'/);
  assert.match(blocks.backgroundRefreshKeys, /'hideComments'/);
  assert.doesNotMatch(blocks.backgroundRefreshKeys, /'hideAllComments'/);
  assert.doesNotMatch(blocks.backgroundRefreshKeys, /'hideShorts'/);

  assert.match(doc, /The catalog exposes `hideShorts` and `hideComments`, while shared settings storage uses `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /`SETTINGS_KEYS` includes `hideAllShorts` and `hideAllComments`, and does not include catalog keys `hideShorts` or `hideComments`/);
  assert.match(doc, /`StateManager\.updateSetting\(\)` accepts catalog keys `hideShorts` and `hideComments`, and does not accept `hideAllShorts` or `hideAllComments`/);
  assert.match(doc, /The background storage-change list includes `hideAllShorts` and `hideComments`, but not `hideAllComments` or `hideShorts`/);
});

test('content-control boundary records future proof fields and missing authorities', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /showQuickBlockButton` and `showBlockMenuItem` are action affordances, not\s+JSON row-filter controls/);
  assert.match(doc, /first-class runtime manifest/);
  assert.match(doc, /catalog\/runtime key\s+contract/);
  assert.match(doc, /alias policy/);
  assert.match(doc, /settings-mode matrix/);
  assert.match(doc, /JSON\/DOM parity matrix/);
  assert.match(doc, /settings invalidation parity report/);
  assert.match(doc, /per-control\s+no-work budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /native parity/);
  assert.match(doc, /rollback\/restore proof/);
  assert.match(doc, /No `contentControlJsonFirstBoundaryIndex`/);

  for (const symbol of authoritySymbols) {
    assert.doesNotMatch(runtime, new RegExp(symbol));
    assert.ok(doc.includes(symbol), `doc missing missing-authority symbol ${symbol}`);
  }
});
