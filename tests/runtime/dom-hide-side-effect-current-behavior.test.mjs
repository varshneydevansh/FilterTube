import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_DOM_HIDE_SIDE_EFFECT_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countDirectDisplayNone(text) {
  return (text.match(/style\.display\s*=\s*['"]none['"]|style\.setProperty\(['"]display['"],\s*['"]none['"]/g) || []).length;
}

function countToggleRefs(text) {
  return (text.match(/toggleVisibility\(/g) || []).length;
}

test('DOM hide side-effect audit documents shared, direct, container, and recycled-node hide authorities', () => {
  const doc = read(auditDocPath);

  for (const heading of [
    'Shared `toggleVisibility()`',
    'Shelf/container cleanup',
    'Current watch owner block',
    'Members-only CSS and JS fallback',
    'Playlist enrichment hide',
    'Optimistic menu hide',
    'Immediate comment/card hide',
    'DOM recycled-card cleanup'
  ]) {
    assert.ok(doc.includes(heading), `missing hide authority row: ${heading}`);
  }

  assert.match(doc, /hide source\s+-> feature key/);
  assert.match(doc, /dom_direct_hide_inventory/);
  assert.match(doc, /dom_members_only_no_watch_primary_hide/);
});

test('toggleVisibility currently couples visual hide with stats, inline display, pending whitelist, and media playback', () => {
  const helpers = read('js/content/dom_helpers.js');
  const toggle = sliceBetween(helpers, 'function toggleVisibility', '/**\n * Recursively checks if a container should be hidden');

  assert.match(toggle, /classList\.add\('filtertube-hidden'\)/);
  assert.match(toggle, /setAttribute\('data-filtertube-hidden', 'true'\)/);
  assert.match(toggle, /style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(toggle, /removeProperty\('display'\)/);
  assert.match(toggle, /filteringTracker\.recordHide/);
  assert.match(toggle, /incrementHiddenStats/);
  assert.match(toggle, /filteringTracker\.recordRestore/);
  assert.match(toggle, /decrementHiddenStats/);
  assert.match(toggle, /data-filtertube-whitelist-pending/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.match(toggle, /handleMediaPlayback\(element, false\)/);
});

test('container visibility currently hides shelves when all children are hidden or prior children disappear', () => {
  const helpers = read('js/content/dom_helpers.js');
  const container = sliceBetween(helpers, 'function updateContainerVisibility', '\n}');

  assert.match(container, /data-filtertube-container-had-children/);
  assert.match(container, /children\.length === 0/);
  assert.match(container, /container\.classList\.add\('filtertube-hidden-shelf'\)/);
  assert.match(container, /Array\.from\(children\)\.every/);
  assert.match(container, /child\.closest\('\.filtertube-hidden'\)/);
  assert.match(container, /child\.closest\('\.filtertube-hidden-shelf'\)/);
  assert.match(container, /container\.classList\.remove\('filtertube-hidden-shelf'\)/);
});

test('direct display-none writes currently bypass the shared toggleVisibility path in bridge and fallback code', () => {
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const helpers = read('js/content/dom_helpers.js');

  assert.equal(countDirectDisplayNone(bridge), 11);
  assert.equal(countToggleRefs(bridge), 3);
  assert.equal(countDirectDisplayNone(fallback), 10);
  assert.equal(countToggleRefs(fallback), 55);
  assert.equal(countDirectDisplayNone(helpers), 1);
  assert.equal(countToggleRefs(helpers), 1);

  const playlistEnrichment = sliceBetween(bridge, 'const hideRow = (row, info = {}) => {', '    for (const row of rows) {');
  assert.match(playlistEnrichment, /target\.style\.display = 'none'/);
  assert.doesNotMatch(playlistEnrichment, /toggleVisibility\(/);

  const optimisticHide = sliceBetween(bridge, 'const recordOptimisticHide = (element, meta) => {', '    const restoreOptimisticHide = () => {');
  assert.match(optimisticHide, /element\.style\.display = 'none'/);
  assert.doesNotMatch(optimisticHide, /toggleVisibility\(/);

  const immediateHide = sliceBetween(bridge, 'if (!didOptimisticHide) {', '        const successDropdown = dropdown');
  assert.match(immediateHide, /commentTarget\.style\.display = 'none'/);
  assert.match(immediateHide, /containerToHide\.style\.display = 'none'/);
  assert.doesNotMatch(immediateHide, /toggleVisibility\(/);
});

test('current watch and members-only fallback paths include broad hide and playback/navigation side effects', () => {
  const fallback = read('js/content/dom_fallback.js');
  const currentWatch = sliceBetween(fallback, 'function enforceCurrentWatchOwnerBlock', 'function markedChannelIsStillBlocked');
  const membersOnly = sliceBetween(fallback, 'if (settings.hideMembersOnly) {', '    // If :has()');
  const membersOnlyFallback = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards)');

  assert.match(currentWatch, /video\.pause\(\)/);
  assert.match(currentWatch, /toggleVisibility\(selected, true/);
  assert.match(currentWatch, /targetLink\.click\(\)/);
  assert.match(currentWatch, /applyDOMFallback\(settings, \{ preserveScroll: true, forceReprocess: true \}\)/);

  assert.match(membersOnly, /ytd-watch-flexy:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersOnly, /ytd-watch-metadata:has\(\.yt-badge-shape--membership\)/);
  assert.match(membersOnly, /ytd-video-primary-info-renderer:has\(\.yt-badge-shape--membership\)/);

  assert.match(membersOnlyFallback, /ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer/);
  assert.match(membersOnlyFallback, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(membersOnlyFallback, /data-filtertube-members-only-hidden/);
});

test('recycled-card cleanup currently proves hidden and identity markers can survive until explicit reset', () => {
  const extractors = read('js/content/dom_extractors.js');
  const cleanup = sliceBetween(extractors, 'if (extractedVideoId) {', '        return extractedVideoId;');

  assert.match(cleanup, /YouTube frequently recycles DOM nodes/);
  assert.match(cleanup, /data-filtertube-video-id/);
  assert.match(cleanup, /data-filtertube-hidden/);
  assert.match(cleanup, /classList\?\.contains\('filtertube-hidden'\)/);
  assert.match(cleanup, /card\.classList\.remove\('filtertube-hidden'\)/);
  assert.match(cleanup, /card\.style\.display === 'none'/);
  assert.match(cleanup, /card\.style\.display = ''/);
});
