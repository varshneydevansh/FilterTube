import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const p0DocPath = 'docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';
const auditDocPath = 'docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md';
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';

const fixtures = [
  'selector_authority_global_card_selector_split_by_surface_route_action',
  'selector_authority_dom_fallback_no_rule_zero_card_scan',
  'selector_authority_quick_block_disabled_zero_selector_scan',
  'selector_authority_fallback_menu_uses_primary_menu_action_gate',
  'selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy',
  'selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture',
  'selector_authority_playlist_selected_row_preserves_current_watch_card',
  'selector_authority_kids_selectors_have_kids_surface_gate',
  'selector_authority_ytm_selectors_are_not_claimed_for_main_release_without_fixture',
  'selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly',
  'selector_authority_inventory_rows_require_runtime_source_or_fixture_status',
  'selector_authority_raw_capture_extracts_minimal_committed_dom_fixture'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('P0 selector authority audit documents fixture family and current blocked verdict', () => {
  const doc = read(p0DocPath);
  const audit = read(auditDocPath);
  const readiness = read(readinessPath);

  assert.match(doc, /P0 selector authority slice is not green/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /Implementation gate remains closed/);
  assert.match(doc, /selectorAuthority/);
  assert.match(audit, /Selector authority is not centralized/);

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing P0 doc fixture: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing readiness fixture: ${fixture}`);
  }
});

test('selector_authority_global_card_selector_split_by_surface_route_action is not satisfied today', () => {
  const extractors = read('js/content/dom_extractors.js');
  const selectorBlock = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');

  for (const token of [
    'ytd-rich-item-renderer',
    'ytd-watch-card-rhs-panel-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-radio-renderer',
    'ytm-video-with-context-renderer',
    'ytm-compact-playlist-renderer',
    'ytm-shorts-lockup-view-model',
    'ytk-compact-video-renderer',
    'ytk-kids-slim-owner-renderer'
  ]) {
    assert.ok(selectorBlock.includes(token), `global selector should still include ${token}`);
  }

  assert.doesNotMatch(productSource(), /\bselectorAuthority\b/);
});

test('selector_authority_dom_fallback_no_rule_zero_card_scan is only partially satisfied today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const noWorkGate = sliceBetween(fallback, 'if (!hasActiveFallbackWork && !onlyWhitelistPending) {', '    try {\n        const state = window.__filtertubeDomFallbackPerfState');
  const staleCleanup = sliceBetween(fallback, 'function clearStaleDOMFallbackVisibility', '// DOM fallback function');
  const cardScan = sliceBetween(fallback, '// 1. Video/Content Filtering', 'const isWatchPage = (() => {');

  assert.match(noWorkGate, /clearStaleDOMFallbackVisibility\(\)/);
  assert.match(noWorkGate, /return;/);
  assert.match(staleCleanup, /document\.querySelectorAll\(hiddenSelector\)/);
  assert.match(cardScan, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);
  assert.doesNotMatch(fallback, /zeroCardScan|selectorBudget|selectorAuthority/);
});

test('selector_authority_quick_block_disabled_zero_selector_scan has local entry guard but no central authority today', () => {
  const quick = read('js/content/block_channel.js');
  const setup = sliceBetween(quick, 'function setupQuickBlockObserver()', '/**\n * Observe dropdowns and inject FilterTube menu items');
  const sweep = sliceBetween(quick, 'function sweepQuickBlockButtons(root = document)', 'function scheduleQuickBlockSweep');

  const enabledGuardIndex = setup.indexOf('if (!isQuickBlockEnabled()) return false;');
  assert.notEqual(enabledGuardIndex, -1, 'quick-block setup should have a disabled-mode entry guard');
  assert.ok(enabledGuardIndex < setup.indexOf('ensureQuickBlockStyles();'), 'entry guard runs before style injection');

  assert.match(quick, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(quick, /currentSettings\.listMode === 'whitelist'/);
  assert.match(sweep, /if \(!isQuickBlockEnabled\(\)\) \{\s*removeQuickBlockButtons\(\);\s*return;\s*\}/);
  for (const lifecycleToken of [
    'ensureQuickBlockStyles();',
    'scheduleQuickBlockSweep(document)',
    'new MutationObserver',
    "document.addEventListener('yt-navigate-finish'"
  ]) {
    const index = setup.indexOf(lifecycleToken);
    assert.notEqual(index, -1, `missing quick-block lifecycle token ${lifecycleToken}`);
    assert.ok(index > enabledGuardIndex, `${lifecycleToken} should be after the entry enabled guard`);
  }
  assert.doesNotMatch(setup, /setInterval/);
  assert.doesNotMatch(setup, /selectorAuthority|zeroSelectorScan|lifecycleOwner/);
});

test('selector_authority_fallback_menu_uses_primary_menu_action_gate is not satisfied by current split gates', () => {
  const bridge = read('js/content_bridge.js');
  const primary = sliceBetween(bridge, 'async function injectFilterTubeMenuItem', 'const videoCardTagName =');
  const fallback = sliceBetween(bridge, 'function ensureFallbackMenuButtons()', 'let playlistFallbackPopoverState = null;');
  const scan = sliceBetween(fallback, 'const fallbackMenuCardSelector = [', 'let scanQueued = false;');

  assert.match(primary, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(primary, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(scan, /querySelectorAll\(fallbackMenuCardSelector\)/);
  assert.match(scan, /ytd-playlist-panel-video-renderer/);
  assert.match(scan, /ytd-comment-thread-renderer/);
  assert.match(scan, /ytm-shorts-lockup-view-model/);
  assert.doesNotMatch(scan, /showBlockMenuItem|listMode|injectFilterTubeMenuItem|selectorAuthority/);
});

test('selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy is not satisfied today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const styles = sliceBetween(fallback, 'function ensureContentControlStyles(settings)', 'function hideYouTubeOpenAppButtons()');
  const currentWatch = sliceBetween(fallback, 'function enforceCurrentWatchOwnerBlock', 'function markedChannelIsStillBlocked');

  for (const token of [
    'ytd-watch-flexy',
    'ytd-watch-metadata',
    '#secondary.ytd-watch-flexy',
    'ytd-video-primary-info-renderer',
    'ytm-watch'
  ]) {
    assert.ok(styles.includes(token) || currentWatch.includes(token), `missing watch selector token: ${token}`);
  }

  assert.doesNotMatch(styles + currentWatch, /watchSelectorPolicy|playerShellPolicy|selectorAuthority/);
});

test('selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture is not satisfied today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const membersCss = sliceBetween(fallback, 'if (settings.hideMembersOnly) {', '    // If :has()');
  const membersDirect = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards) {');

  assert.match(membersCss, /ytd-watch-flexy:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersCss, /ytd-watch-metadata:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersDirect, /ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer/);
  assert.doesNotMatch(membersDirect, /membersOnlyWatchFixture|watchShellPolicy|selectorAuthority/);
});

test('selector_authority_playlist_selected_row_preserves_current_watch_card is not proven today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const selectedHelper = sliceBetween(fallback, 'function isSelectedPlaylistPanelRow(element)', 'function extractPlaylistPanelBylineChannelName');
  const currentWatch = sliceBetween(fallback, 'function enforceCurrentWatchOwnerBlock', 'function markedChannelIsStillBlocked');
  const selectedFixture = read('tests/runtime/fixtures/captures/playlist-selected-row.html');

  assert.match(selectedHelper, /row\.hasAttribute\('selected'\)/);
  assert.match(selectedHelper, /ytm-playlist-panel-video-renderer-selected/);
  assert.match(selectedFixture, /ytd-playlist-panel-video-renderer/);
  assert.match(selectedFixture, /id="menu"|id='menu'|<ytd-menu-renderer/);
  assert.match(currentWatch, /toggleVisibility\(selected, true/);
  assert.match(currentWatch, /targetLink\.click\(\)/);
  assert.doesNotMatch(currentWatch, /preserveCurrentWatchCard|selectedRowPolicy|selectorAuthority/);
});

test('selector_authority_kids_selectors_have_kids_surface_gate is not centralized today', () => {
  const extractors = read('js/content/dom_extractors.js');
  const fallback = read('js/content/dom_fallback.js');
  const selectorBlock = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');
  const cardScan = sliceBetween(fallback, '// 1. Video/Content Filtering', 'const isWatchPage = (() => {');

  for (const token of [
    'ytk-compact-video-renderer',
    'ytk-grid-video-renderer',
    'ytk-video-renderer',
    'ytk-compact-channel-renderer',
    'ytk-compact-playlist-renderer',
    'ytk-kids-slim-owner-renderer'
  ]) {
    assert.ok(selectorBlock.includes(token), `global selector should include ${token}`);
  }

  assert.match(fallback, /String\(location\.hostname \|\| ''\)\.includes\('youtubekids\.com'\)/);
  assert.match(cardScan, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);
  assert.doesNotMatch(productSource(), /\bkidsSelectorAuthority\b|\bselectorAuthority\b/);
});

test('selector_authority_ytm_selectors_have_dom_and_json_fixtures_but_remain_not_fully_proven_today', () => {
  const extractors = read('js/content/dom_extractors.js');
  const bridge = read('js/content_bridge.js');
  const fixturesDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');
  const fixtureFiles = fs.readdirSync(fixturesDir).sort();
  const ytmDomFixture = read('tests/runtime/fixtures/captures/ytm-dom-video-card-with-menu.html');
  const ytmPostFixture = read('tests/runtime/fixtures/captures/ytm-dom-post-card-with-menu.html');
  const ytmWatchFixture = read('tests/runtime/fixtures/captures/ytm-watch-player-dom.html');
  const ytmBrowseFixture = JSON.parse(read('tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json'));

  assert.match(extractors, /ytm-video-with-context-renderer/);
  assert.match(extractors, /ytm-compact-playlist-renderer/);
  assert.match(extractors, /ytm-shorts-lockup-view-model/);
  assert.match(bridge, /ytm-playlist-panel-video-renderer/);
  assert.ok(fixtureFiles.includes('ytm-compact-playlist-renderer.json'));
  assert.ok(fixtureFiles.includes('ytm-dom-post-card-with-menu.html'));
  assert.ok(fixtureFiles.includes('ytm-dom-video-card-with-menu.html'));
  assert.ok(fixtureFiles.includes('ytm-watch-player-dom.html'));
  assert.ok(fixtureFiles.includes('ytm-browse-channel-list-item-renderer.json'));
  assert.ok(fixtureFiles.includes('ytm-show-sheet-collab-video-with-context-renderer.json'));
  assert.match(ytmDomFixture, /<ytm-video-with-context-renderer\b/);
  assert.match(ytmDomFixture, /href="\/channel\/UCu7TZ_ATWgjgD9IrNLdnYDA"/);
  assert.match(ytmPostFixture, /<ytm-backstage-post-thread-renderer\b/);
  assert.match(ytmPostFixture, /aria-label="Action menu"/);
  assert.match(ytmWatchFixture, /id="movie_player"/);
  assert.match(ytmWatchFixture, /<ytm-playlist-panel-video-renderer\b/);
  assert.match(ytmWatchFixture, /aria-selected="true"/);
  assert.match(ytmWatchFixture, /filtertube-hidden/);
  assert.equal(ytmBrowseFixture.provenance.rendererType, 'channelListItemRenderer');
  assert.equal(ytmBrowseFixture.provenance.source, 'ytm_browse?prettyPrint=false.json');
  assert.match(fixtureFiles.join('\n'), /ytm-watch-player-dom\.html/);
});

test('selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly is only release-boundary proven today', () => {
  const layout = read('js/layout.js');
  const manifests = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']
    .map(read)
    .join('\n');

  assert.match(layout, /querySelector|querySelectorAll|closest/);
  assert.doesNotMatch(manifests, /js\/layout\.js/);
  assert.doesNotMatch(layout, /selectorAuthority|legacyLayoutQuarantine/);
});

test('selector_authority_inventory_rows_require_runtime_source_or_fixture_status remains a documentation boundary', () => {
  const selectorInventory = read('docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md');
  const rendererInventory = read('docs/youtube_renderer_inventory.md');
  const jsonInventory = read('docs/json_paths_encyclopedia.md');
  const p0Doc = read(p0DocPath);

  assert.match(selectorInventory, /Generated static audit artifact/);
  assert.match(rendererInventory, /✅ Covered|✅ \*\*IMPLEMENTED\*\*/);
  assert.match(jsonInventory, /Absolute JSON Trace/);
  assert.match(p0Doc, /Inventory docs are evidence maps/);
  assert.match(p0Doc, /Every inventory row has source-backed status, fixture-backed status, or explicit backlog status/);
});

test('selector_authority_raw_capture_extracts_minimal_committed_dom_fixture is only partially satisfied today', () => {
  const gitignore = read('.gitignore');
  const fixtureFiles = fs.readdirSync(path.join(repoRoot, 'tests/runtime/fixtures/captures')).sort();
  const htmlFixtures = fixtureFiles.filter(file => file.endsWith('.html'));

  assert.deepEqual(htmlFixtures, [
    'collab-mix-selected-row.html',
    'main-collab-homepage-avatar-stack.html',
    'main-collab-resolved-search-card-dialog.html',
    'main-doms-mutated-main-dom.html',
    'playlist-panel-header-mix-dom.html',
    'playlist-player-endscreen-dom.html',
    'playlist-selected-row.html',
    'ytm-dom-post-card-with-menu.html',
    'ytm-dom-video-card-with-menu.html',
    'ytm-logs-playlist-bottom-sheet-stale-identity.html',
    'ytm-watch-player-dom.html'
  ]);

  for (const rawCapture of [
    'DOMs.html',
    'playlist.html',
    'collab.html',
    'YTM-DOM.html',
    'YT_MAIN_WATCH.html'
  ]) {
    assert.match(gitignore, new RegExp(rawCapture.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.ok(htmlFixtures.length <= 11, 'committed DOM fixture set should still be intentionally small/incomplete');
});
