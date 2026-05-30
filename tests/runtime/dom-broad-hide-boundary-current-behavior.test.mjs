import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_DOM_BROAD_HIDE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md';

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

test('broad hide boundary audit documents false-hide surfaces and blocked verdict', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'current-behavior proof only',
    'Runtime behavior is unchanged',
    'implementation gate remains closed',
    'members-only',
    'playlist lockup',
    'selected playlist row',
    'Shelf/container cleanup',
    'stale specialized markers'
  ]) {
    assert.ok(doc.includes(token), `missing audit token: ${token}`);
  }

  assert.match(doc, /broadHideBoundaryAuthority/);
  assert.match(doc, /negative sibling-visible fixtures/);
});

test('product source still lacks one central broad-hide boundary authority', () => {
  const source = productSource();

  assert.doesNotMatch(source, /\bbroadHideBoundaryAuthority\b/);
  assert.doesNotMatch(source, /\bhideTargetPolicy\b/);
  assert.doesNotMatch(source, /\bnegativeSiblingVisible\b/);
  assert.doesNotMatch(source, /\bwatchShellHidePolicy\b/);
});

test('members-only CSS and JS fallback can target watch shells and shelf parents today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const cssBlock = sliceBetween(fallback, 'if (settings.hideMembersOnly) {', '    // If :has()');
  const jsBlock = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards) {');

  for (const token of [
    'ytd-watch-flexy:has(.yt-badge-shape--membership)',
    'ytd-watch-metadata:has(.yt-badge-shape--membership)',
    'ytd-video-primary-info-renderer:has(.yt-badge-shape--membership)'
  ]) {
    assert.ok(cssBlock.includes(token), `missing members-only CSS target: ${token}`);
  }

  assert.match(jsBlock, /ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer/);
  assert.match(jsBlock, /host\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(jsBlock, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(jsBlock, /data-filtertube-members-only-hidden/);
  assert.doesNotMatch(jsBlock, /watchShellHidePolicy|broadHideBoundaryAuthority|negativeSiblingVisible/);
});

test('playlist card CSS and JS can hide parent shelf or horizontal list from one lockup today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const cssBlock = sliceBetween(fallback, 'if (settings.hidePlaylistCards) {', '    if (settings.hideMixPlaylists) {');
  const jsBlock = sliceBetween(fallback, 'if (effectiveSettings.hidePlaylistCards) {', '        if (effectiveSettings.hideMixPlaylists) {');

  assert.match(cssBlock, /ytd-horizontal-list-renderer:has\(yt-lockup-view-model\.yt-lockup-view-model--collection-stack-2\)/);
  assert.match(cssBlock, /ytd-shelf-renderer:has\(yt-lockup-view-model\.yt-lockup-view-model--collection-stack-2\)/);

  assert.match(jsBlock, /lockup\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(jsBlock, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(jsBlock, /horiz\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(jsBlock, /data-filtertube-hidden/);
  assert.doesNotMatch(jsBlock, /removeProperty\('display'\)/);
  assert.doesNotMatch(jsBlock, /negativeSiblingVisible|broadHideBoundaryAuthority|playlistCardBoundary/);
});

test('current-watch owner enforcement can hide selected playlist row and click alternate targets today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const currentWatch = sliceBetween(fallback, 'function enforceCurrentWatchOwnerBlock', 'function markedChannelIsStillBlocked');

  assert.match(currentWatch, /const selected = getPlaylistPanelRows\(getPlaylistPanelContainer\(\) \|\| document\)/);
  assert.match(currentWatch, /toggleVisibility\(selected, true, `Current watch blocked: \$\{ownerName\}`, true\)/);
  assert.match(currentWatch, /targetLink\.click\(\)/);
  assert.match(currentWatch, /nextButton\.click\(\)/);
  assert.doesNotMatch(currentWatch, /selectedRowPreservationPolicy|broadHideBoundaryAuthority|ownerConfidenceReport/);
});

test('container cleanup can collapse parent shelves from child hidden or missing state today', () => {
  const helpers = read('js/content/dom_helpers.js');
  const container = sliceBetween(helpers, 'function updateContainerVisibility', '\n}');

  assert.match(container, /data-filtertube-container-had-children/);
  assert.match(container, /children\.length === 0/);
  assert.match(container, /Array\.from\(children\)\.every/);
  assert.match(container, /child\.closest\('\.filtertube-hidden'\)/);
  assert.match(container, /child\.closest\('\.filtertube-hidden-shelf'\)/);
  assert.match(container, /container\.classList\.add\('filtertube-hidden-shelf'\)/);
  assert.doesNotMatch(container, /siblingVisibleProof|broadHideBoundaryAuthority|containerCollapsePolicy/);
});

test('disabled stale cleanup does not enumerate every specialized hide marker today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const staleCleanup = sliceBetween(fallback, 'function clearStaleDOMFallbackVisibility', '// DOM fallback function');

  for (const token of [
    'data-filtertube-hidden',
    'data-filtertube-whitelist-pending',
    'data-filtertube-hidden-by-hide-all-shorts'
  ]) {
    assert.ok(staleCleanup.includes(token), `expected stale cleanup marker: ${token}`);
  }

  for (const missing of [
    'data-filtertube-members-only-hidden',
    'data-filtertube-hidden-by-shelf-title',
    'data-filtertube-hidden-by-playlist-enrichment',
    'data-filtertube-hidden-by-optimistic-menu'
  ]) {
    assert.ok(!staleCleanup.includes(missing), `stale cleanup unexpectedly handles ${missing}`);
  }
});

test('existing P0 and ledger docs keep broad false-hide proof partial rather than green', () => {
  const selectorDoc = read('docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const hideDoc = read('docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  assert.match(selectorDoc, /P0 selector authority slice is not green/);
  assert.match(selectorDoc, /members-only badge on a normal card versus watch metadata/);
  assert.match(hideDoc, /mixed shelf where only one child matches/);
  assert.match(hideDoc, /members-only badge on watch metadata versus a normal card/);
  assert.match(ledger, /False-hide risks/);
  assert.match(ledger, /negative sibling-visible and restore-owner fixtures/);
});
