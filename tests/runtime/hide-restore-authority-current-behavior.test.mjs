import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md';

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

test('hide/restore authority audit documents every current hide writer family', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'Shared helper',
    'Container cleanup',
    'Runtime CSS controls',
    'Open-app button cleanup',
    'Disabled/stale cleanup',
    'Watch whitelist restore',
    'Members-only fallback',
    'Playlist/mix fallback',
    'Main card decisions',
    'Shelf title / empty shelf',
    'Whitelist pending bridge',
    'Fallback-menu immediate hide',
    '3-dot optimistic hide',
    'Recycled-card cleanup',
    'hideRestoreAuthority'
  ]) {
    assert.ok(doc.includes(phrase), `missing authority phrase: ${phrase}`);
  }
});

test('product source does not yet define a hideRestoreAuthority contract', () => {
  const sourceFiles = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'));
  const combined = sourceFiles.map(read).join('\n');

  assert.doesNotMatch(combined, /\bhideRestoreAuthority\b/);
});

test('shared toggleVisibility owns class attr inline display stats and media side effects today', () => {
  const helpers = read('js/content/dom_helpers.js');
  const block = sliceBetween(helpers, 'function toggleVisibility', '/**\n * Recursively checks if a container should be hidden');

  for (const pattern of [
    /classList\.add\('filtertube-hidden'\)/,
    /setAttribute\('data-filtertube-hidden', 'true'\)/,
    /style\.setProperty\('display', 'none', 'important'\)/,
    /removeProperty\('display'\)/,
    /filteringTracker\.recordHide/,
    /incrementHiddenStats/,
    /filteringTracker\.recordRestore/,
    /decrementHiddenStats/,
    /handleMediaPlayback\(element, true\)/,
    /handleMediaPlayback\(element, false\)/
  ]) {
    assert.match(block, pattern);
  }
});

test('stale cleanup restores generic hidden state but not every specialized direct-hide marker', () => {
  const fallback = read('js/content/dom_fallback.js');
  const staleCleanup = sliceBetween(fallback, 'function clearStaleDOMFallbackVisibility', '// DOM fallback function');
  const disabledCleanup = sliceBetween(fallback, 'const contentControlStyle = document.getElementById', '        return;\n    }');

  assert.match(staleCleanup, /\[data-filtertube-hidden\]/);
  assert.match(staleCleanup, /\.filtertube-hidden/);
  assert.match(staleCleanup, /data-filtertube-whitelist-pending/);
  assert.match(staleCleanup, /data-filtertube-pending-category/);
  assert.match(staleCleanup, /data-filtertube-hidden-by-hide-all-shorts/);
  assert.match(staleCleanup, /toggleVisibility\(el, false, '', true\)/);
  assert.match(staleCleanup, /contentControlStyle\.textContent = ''/);

  assert.doesNotMatch(staleCleanup, /data-filtertube-members-only-hidden/);
  assert.doesNotMatch(staleCleanup, /data-filtertube-hidden-open-app/);
  assert.doesNotMatch(staleCleanup, /data-filtertube-hidden-by-mix-radio/);
  assert.doesNotMatch(disabledCleanup, /data-filtertube-members-only-hidden/);
  assert.doesNotMatch(disabledCleanup, /data-filtertube-hidden-open-app/);
});

test('direct hide writers still bypass shared toggleVisibility in pending whitelist and user action paths', () => {
  const bridge = read('js/content_bridge.js');
  const pending = sliceBetween(bridge, 'function applyWhitelistPendingHide', '        function fallbackRelevantSelector()');
  const fallbackMenu = sliceBetween(bridge, 'const performBlock = async (channelInfo, filterAll) => {', '        try {\n            if (channelInfo?.isBlockAllOption');
  const optimistic = sliceBetween(bridge, 'const recordOptimisticHide = (element, meta) => {', '    const restoreOptimisticHide = () => {');
  const immediate = sliceBetween(bridge, 'if (!didOptimisticHide) {', '        const successDropdown = dropdown');

  assert.match(pending, /queuePrefetchForCard\(element\)/);
  assert.match(pending, /element\.classList\.add\('filtertube-hidden'\)/);
  assert.match(pending, /element\.setAttribute\('data-filtertube-whitelist-pending', 'true'\)/);
  assert.match(pending, /element\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.doesNotMatch(pending, /toggleVisibility\(/);

  assert.match(fallbackMenu, /row\.style\.display = 'none'/);
  assert.doesNotMatch(fallbackMenu, /toggleVisibility\(/);

  assert.match(optimistic, /element\.style\.display = 'none'/);
  assert.doesNotMatch(optimistic, /toggleVisibility\(/);

  assert.match(immediate, /commentTarget\.style\.display = 'none'/);
  assert.match(immediate, /containerToHide\.style\.display = 'none'/);
  assert.doesNotMatch(immediate, /toggleVisibility\(/);
});

test('fallback direct hide owners have marker-specific or incomplete restore paths today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const members = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards) {');
  const playlist = sliceBetween(fallback, 'if (effectiveSettings.hidePlaylistCards) {', '        if (effectiveSettings.hideMixPlaylists) {');
  const mix = sliceBetween(fallback, 'if (effectiveSettings.hideMixPlaylists) {', '    if (effectiveSettings.enabled === false) {');

  assert.match(members, /data-filtertube-members-only-hidden/);
  assert.match(members, /previouslyHidden/);
  assert.match(members, /el\.style\.removeProperty\('display'\)/);
  assert.match(members, /el\.removeAttribute\('data-filtertube-members-only-hidden'\)/);

  assert.match(playlist, /lockup\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(playlist, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.doesNotMatch(playlist, /removeProperty\('display'\)/);
  assert.doesNotMatch(playlist, /toggleVisibility\(/);

  assert.match(mix, /chip\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(mix, /hiddenMixChips/);
  assert.match(mix, /chip\.style\.removeProperty\('display'\)/);
});

test('recycled-card cleanup proves stale identity and hide markers must be reset with inline display', () => {
  const extractors = read('js/content/dom_extractors.js');
  const cleanup = sliceBetween(extractors, 'YouTube frequently recycles DOM nodes', 'return extractedVideoId;');

  for (const pattern of [
    /data-filtertube-channel-id/,
    /data-filtertube-processed/,
    /data-filtertube-hidden/,
    /data-filtertube-hidden-by-channel/,
    /data-filtertube-hidden-by-keyword/,
    /data-filtertube-hidden-by-duration/,
    /data-filtertube-hidden-by-upload-date/,
    /data-filtertube-hidden-by-category/,
    /data-filtertube-blocked-state/,
    /classList\.remove\('filtertube-hidden'\)/,
    /card\.style\.display === 'none'/,
    /card\.style\.display = ''/
  ]) {
    assert.match(cleanup, pattern);
  }
});

test('hide/restore audit names the required future P0 fixture wall', () => {
  const doc = read(auditDocPath);

  for (const fixture of [
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
  ]) {
    assert.ok(doc.includes(fixture), `missing hide/restore fixture: ${fixture}`);
  }
});
