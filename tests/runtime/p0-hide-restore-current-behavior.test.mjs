import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const p0DocPath = 'docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md';
const auditDocPath = 'docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md';
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';

const fixtures = [
  'hide_restore_shared_toggle_reports_writer_reason_and_marker',
  'hide_restore_direct_display_writes_have_registered_restorers',
  'hide_restore_disabled_extension_clears_all_filtertube_hide_markers',
  'hide_restore_css_control_rules_have_route_owner_and_disable_path',
  'hide_restore_members_only_restore_clears_members_marker_and_generic_marker',
  'hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats',
  'hide_restore_pending_whitelist_restore_requires_identity_outcome',
  'hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers',
  'hide_restore_shelf_title_restore_clears_specific_marker',
  'hide_restore_current_watch_owner_block_has_playback_side_effect_reason',
  'hide_restore_no_rule_path_does_not_leave_inline_display_none',
  'hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css'
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

function countDirectDisplayNone(text) {
  return (text.match(/style\.display\s*=\s*['"]none['"]|style\.setProperty\(['"]display['"],\s*['"]none['"]/g) || []).length;
}

test('P0 hide/restore audit documents fixture family and current blocked verdict', () => {
  const doc = read(p0DocPath);
  const audit = read(auditDocPath);
  const readiness = read(readinessPath);

  assert.match(doc, /P0 hide\/restore slice is not green/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /Implementation gate remains closed/);
  assert.match(doc, /hideRestoreAuthority/);
  assert.match(audit, /Hide\/restore authority is split/);

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing P0 doc fixture: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing readiness fixture: ${fixture}`);
  }
});

test('hide_restore_shared_toggle_reports_writer_reason_and_marker is not satisfied by current helper signature', () => {
  const helpers = read('js/content/dom_helpers.js');
  const block = sliceBetween(helpers, 'function toggleVisibility', '/**\n * Recursively checks if a container should be hidden');

  assert.match(block, /function toggleVisibility\(element, shouldHide, reason = '', skipStats = false\)/);
  assert.match(block, /setAttribute\('data-filtertube-hidden', 'true'\)/);
  assert.match(block, /style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(block, /filteringTracker\.recordHide\(element, reason\)/);
  assert.match(block, /handleMediaPlayback\(element, true\)/);
  assert.doesNotMatch(block, /writer/);
  assert.doesNotMatch(block, /restoreOwner/);
  assert.doesNotMatch(block, /mediaPolicy/);
});

test('hide_restore_direct_display_writes_have_registered_restorers is not centrally satisfied', () => {
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const pending = sliceBetween(bridge, 'function applyWhitelistPendingHide', '        function fallbackRelevantSelector()');
  const fallbackMenu = sliceBetween(bridge, 'const performBlock = async (channelInfo, filterAll) => {', '        try {\n            if (channelInfo?.isBlockAllOption');
  const playlist = sliceBetween(fallback, 'if (effectiveSettings.hidePlaylistCards) {', '        if (effectiveSettings.hideMixPlaylists) {');

  assert.ok(countDirectDisplayNone(bridge) > 1, 'bridge should still have direct display-none writers');
  assert.ok(countDirectDisplayNone(fallback) > 1, 'fallback should still have direct display-none writers');
  assert.match(pending, /element\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(fallbackMenu, /row\.style\.display = 'none'/);
  assert.match(playlist, /lockup\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.doesNotMatch(playlist, /removeProperty\('display'\)/);
  assert.doesNotMatch(bridge + fallback, /hideRestoreAuthority/);
});

test('hide_restore_disabled_extension_clears_all_filtertube_hide_markers is not satisfied today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const staleCleanup = sliceBetween(fallback, 'function clearStaleDOMFallbackVisibility', '// DOM fallback function');
  const disabledCleanup = sliceBetween(fallback, 'if (effectiveSettings.enabled === false) {', '        return;\n    }');

  for (const generic of [
    'data-filtertube-hidden',
    'filtertube-hidden',
    'data-filtertube-whitelist-pending',
    'data-filtertube-pending-category',
    'data-filtertube-hidden-by-hide-all-shorts'
  ]) {
    assert.ok(staleCleanup.includes(generic), `generic cleanup should mention ${generic}`);
  }

  for (const specialized of [
    'data-filtertube-members-only-hidden',
    'data-filtertube-hidden-open-app',
    'data-filtertube-hidden-by-mix-radio',
    'data-filtertube-hidden-by-playlist-enrichment',
    'data-filtertube-hidden-by-hide-home-feed'
  ]) {
    assert.ok(!staleCleanup.includes(specialized), `stale cleanup unexpectedly mentions ${specialized}`);
    assert.ok(!disabledCleanup.includes(specialized), `disabled cleanup unexpectedly mentions ${specialized}`);
  }
});

test('hide_restore_css_control_rules_have_route_owner_and_disable_path is only implicit today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const styles = sliceBetween(fallback, 'function ensureContentControlStyles(settings)', 'function hideYouTubeOpenAppButtons()');

  assert.match(styles, /style\.id = styleId/);
  assert.match(styles, /data-filtertube-route-home/);
  assert.match(styles, /data-filtertube-route-watch/);
  assert.match(styles, /display: none !important/);
  assert.match(styles, /hideEndscreenVideowall/);
  assert.match(styles, /hideAllComments/);
  assert.doesNotMatch(styles, /hideRestoreAuthority/);
  assert.doesNotMatch(styles, /routeOwner/);
  assert.doesNotMatch(styles, /restoreOwner/);
});

test('hide_restore_members_only_restore_clears_members_marker_and_generic_marker is only local marker behavior today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const membersCss = sliceBetween(fallback, 'if (settings.hideMembersOnly) {', '    // If :has()');
  const membersDirect = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards) {');

  assert.match(membersCss, /ytd-watch-flexy:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersCss, /ytd-watch-metadata:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersDirect, /data-filtertube-members-only-hidden/);
  assert.match(membersDirect, /el\.style\.removeProperty\('display'\)/);
  assert.match(membersDirect, /el\.removeAttribute\('data-filtertube-hidden'\)/);
  assert.match(membersDirect, /el\.removeAttribute\('data-filtertube-members-only-hidden'\)/);
  assert.doesNotMatch(membersDirect, /hideRestoreAuthority/);
});

test('hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats is accidental direct-shell behavior today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const block = sliceBetween(fallback, 'function hideYouTubeOpenAppButtons()', 'function normalizeTextForMatching');

  assert.match(block, /open app/);
  assert.match(block, /target\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(block, /data-filtertube-hidden-open-app/);
  assert.doesNotMatch(block, /toggleVisibility\(/);
  assert.doesNotMatch(block, /incrementHiddenStats/);
  assert.doesNotMatch(block, /filteringTracker/);
  assert.doesNotMatch(block, /shellCleanup/);
});

test('hide_restore_pending_whitelist_restore_requires_identity_outcome is not satisfied by direct pending hide', () => {
  const bridge = read('js/content_bridge.js');
  const pending = sliceBetween(bridge, 'function applyWhitelistPendingHide', '        function fallbackRelevantSelector()');

  assert.match(pending, /listMode !== 'whitelist'/);
  assert.match(pending, /queuePrefetchForCard\(element\)/);
  assert.match(pending, /data-filtertube-whitelist-pending/);
  assert.match(pending, /scheduleWhitelistPendingRecheck\(\)/);
  assert.match(pending, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);
  assert.doesNotMatch(pending, /ttl/i);
  assert.doesNotMatch(pending, /identityOutcome/);
  assert.doesNotMatch(pending, /restoreOwner/);
});

test('hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers is locally satisfied and must remain invariant', () => {
  const extractors = read('js/content/dom_extractors.js');
  const cleanup = sliceBetween(extractors, 'YouTube frequently recycles DOM nodes', 'return extractedVideoId;');

  for (const token of [
    'data-filtertube-channel-id',
    'data-filtertube-channel-handle',
    'data-filtertube-processed',
    'data-filtertube-whitelist-pending',
    'data-filtertube-hidden',
    'data-filtertube-hidden-by-channel',
    'data-filtertube-hidden-by-keyword',
    'data-filtertube-hidden-by-duration',
    'data-filtertube-hidden-by-upload-date',
    'data-filtertube-hidden-by-category',
    'data-filtertube-blocked-state',
    'data-filtertube-collaborators',
    "classList.remove('filtertube-hidden')",
    "card.style.display = ''"
  ]) {
    assert.ok(cleanup.includes(token), `missing recycled cleanup token: ${token}`);
  }
});

test('hide_restore_shelf_title_restore_clears_specific_marker is locally satisfied but lacks mixed-sibling proof', () => {
  const fallback = read('js/content/dom_fallback.js');
  const shelf = sliceBetween(fallback, 'const shelves = document.querySelectorAll', 'if (i > 0 && i % 30 === 0)');
  const p0Doc = read(p0DocPath);

  assert.match(shelf, /data-filtertube-hidden-by-shelf-title/);
  assert.match(shelf, /toggleVisibility\(shelf, true, `Shelf title: \$\{shelfTitle\}`\)/);
  assert.match(shelf, /shelf\.removeAttribute\('data-filtertube-hidden-by-shelf-title'\)/);
  assert.match(shelf, /toggleVisibility\(shelf, false\)/);
  assert.match(p0Doc, /negative sibling-visible fixtures for mixed shelves/);
});

test('hide_restore_current_watch_owner_block_has_playback_side_effect_reason is not structured today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const currentWatch = sliceBetween(fallback, 'function enforceCurrentWatchOwnerBlock', 'function markedChannelIsStillBlocked');

  assert.match(currentWatch, /video\.pause\(\)/);
  assert.match(currentWatch, /targetLink\.click\(\)/);
  assert.match(currentWatch, /toggleVisibility\(selected, true, `Current watch blocked:/);
  assert.match(currentWatch, /toggleVisibility\(shell, true, `Current watch blocked:/);
  assert.doesNotMatch(currentWatch, /mediaPolicy/);
  assert.doesNotMatch(currentWatch, /navigationPolicy/);
  assert.doesNotMatch(currentWatch, /hideRestoreAuthority/);
});

test('hide_restore_no_rule_path_does_not_leave_inline_display_none is not globally proven today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const staleCleanup = sliceBetween(fallback, 'function clearStaleDOMFallbackVisibility', '// DOM fallback function');
  const noWork = sliceBetween(fallback, 'if (!hasActiveFallbackWork && !onlyWhitelistPending) {', '    try {\n        const state = window.__filtertubeDomFallbackPerfState');

  assert.match(noWork, /clearStaleDOMFallbackVisibility\(\)/);
  assert.match(staleCleanup, /toggleVisibility\(el, false, '', true\)/);
  assert.match(staleCleanup, /contentControlStyle\.textContent = ''/);
  assert.doesNotMatch(staleCleanup, /data-filtertube-members-only-hidden/);
  assert.doesNotMatch(staleCleanup, /data-filtertube-hidden-open-app/);
  assert.doesNotMatch(staleCleanup, /data-filtertube-hidden-by-playlist-enrichment/);
});

test('hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css is absent from product source', () => {
  const productSource = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');

  assert.doesNotMatch(productSource, /\bhideRestoreAuthority\b/);
  assert.doesNotMatch(productSource, /\bhideWriterRegistry\b/);
  assert.doesNotMatch(productSource, /\brestoreOwner\b/);
});
