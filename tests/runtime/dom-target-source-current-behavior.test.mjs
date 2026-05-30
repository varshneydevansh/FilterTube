import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('quick-block card selector covers watch-card and playlist surfaces but is disabled in whitelist mode', () => {
  const text = source('js/content/block_channel.js');
  const selectorBlock = sliceBetween(text, 'const QUICK_BLOCK_CARD_SELECTORS = [', '].join');
  const enabledBlock = sliceBetween(text, 'const isQuickBlockEnabled = () => {', 'function ensureQuickBlockStyles()');

  assert.match(selectorBlock, /'ytd-watch-card-compact-video-renderer'/);
  assert.match(selectorBlock, /'ytd-watch-card-hero-video-renderer'/);
  assert.match(selectorBlock, /'ytd-watch-card-rhs-panel-video-renderer'/);
  assert.match(selectorBlock, /'ytd-playlist-panel-video-renderer'/);
  assert.match(selectorBlock, /'ytm-playlist-panel-video-renderer'/);
  assert.match(enabledBlock, /currentSettings\.enabled === false/);
  assert.match(enabledBlock, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(enabledBlock, /currentSettings\.listMode === 'whitelist'/);
  assert.match(enabledBlock, /Quick-block is the entry point for creating the first channel rule/);
});

test('native dropdown targeting prefers comment context before watch or playlist fallbacks', () => {
  const text = source('js/content/block_channel.js');
  const block = sliceBetween(
    text,
    '// Prefer comment context first',
    'if (!videoCard && !clickInComments)'
  );

  assert.match(block, /const commentContextCard = lastClickedMenuButton\.closest/);
  assert.match(block, /'#comments, ytd-comments, ytd-item-section-renderer\[section-identifier="comment-item-section"\]'/);
  assert.match(block, /let videoCard = commentContextCard \|\| lastClickedMenuButton\.closest/);
  assert.match(block, /'ytd-post-renderer, '/);
  assert.match(block, /'ytm-backstage-post-thread-renderer, '/);
});

test('fallback 3-dot scan currently omits post renderers even though native dropdown targeting includes them', () => {
  const text = source('js/content_bridge.js');
  const scanBlock = sliceBetween(
    text,
    'const fallbackMenuCardSelector = [',
    'const scan = (root = document) => {'
  );

  assert.match(scanBlock, /'ytd-playlist-panel-video-renderer'/);
  assert.match(scanBlock, /'ytd-comment-thread-renderer'/);
  assert.doesNotMatch(scanBlock, /ytd-post-renderer/);
  assert.doesNotMatch(scanBlock, /ytm-post-renderer/);
  assert.doesNotMatch(scanBlock, /ytm-backstage-post-renderer/);
});

test('fallback 3-dot scan currently gates native overlays but not list mode or showBlockMenuItem', () => {
  const text = source('js/content_bridge.js');
  const scanBlock = sliceBetween(
    text,
    'const scan = (root = document) => {',
    'const scanVisible = () => {'
  );

  assert.match(scanBlock, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.match(scanBlock, /collectFallbackMenuCards\(root\)/);
  assert.doesNotMatch(scanBlock, /showBlockMenuItem/);
  assert.doesNotMatch(scanBlock, /listMode/);
  assert.doesNotMatch(scanBlock, /currentSettings/);
  assert.doesNotMatch(scanBlock, /isQuickBlockEnabled/);
});

test('normal dropdown injection has whitelist and showBlockMenuItem gates', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );

  assert.match(block, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(block, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(block, /clearFilterTubeMenuItems\(dropdown\)/);
  assert.match(block, /clearMultiStepStateForDropdown\(dropdown\)/);
});

test('fallback playlist menu button currently opens without list-mode or showBlockMenuItem gate', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'const createFallbackButton = (card, surface) => {',
    'const ensureFallbackButtonForCard = (card, debug = null) => {'
  );

  assert.match(block, /openFilterTubePlaylistFallbackPopover\(btn, card\)/);
  assert.doesNotMatch(block, /showBlockMenuItem/);
  assert.doesNotMatch(block, /listMode/);
  assert.doesNotMatch(block, /currentSettings/);
  assert.doesNotMatch(block, /isQuickBlockEnabled/);
});

test('fallback playlist menu rows currently bind block actions without list-mode or showBlockMenuItem gate', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'const bindFallbackRow = ({ item, toggle }, channelInfo) => {',
    'let baseInfo = resolveFallbackBaseInfo();'
  );

  assert.match(block, /createFallbackMenuRow/);
  assert.match(block, /bindFallbackRow/);
  assert.match(block, /performBlock\(channelInfo, isFilterAllToggleActive\(toggle\)\)/);
  assert.doesNotMatch(block, /showBlockMenuItem/);
  assert.doesNotMatch(block, /listMode/);
  assert.doesNotMatch(block, /currentSettings/);
});

test('playlist selected-row detection is present, and current-watch owner block hides the selected playlist row', () => {
  const text = source('js/content/dom_fallback.js');
  const selectedFn = sliceBetween(
    text,
    'function isSelectedPlaylistPanelRow(element) {',
    'function extractPlaylistPanelBylineChannelName(value) {'
  );
  const currentWatchBlock = sliceBetween(
    text,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );

  assert.match(selectedFn, /row\.hasAttribute\('selected'\)/);
  assert.match(selectedFn, /row\.getAttribute\('aria-selected'\) === 'true'/);
  assert.match(selectedFn, /row\.classList\?\.contains\('ytm-playlist-panel-video-renderer-selected'\)/);
  assert.match(currentWatchBlock, /find\(row => isSelectedPlaylistPanelRow\(row\)\)/);
  assert.match(currentWatchBlock, /selected\.setAttribute\('data-filtertube-hidden-by-channel', 'true'\)/);
  assert.match(currentWatchBlock, /toggleVisibility\(selected, true, `Current watch blocked:/);
});

test('clicked content hide target has shorts-specific handling and generic lockup parent scoping', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'function resolveClickedContentHideTarget(node) {',
    'function syncBlockedElementsWithFilters(effectiveSettings) {'
  );

  assert.match(block, /tag\.includes\('shorts-lockup-view-model'\) \|\| tag\.includes\('reel'\)/);
  assert.match(block, /return shortsNode\.closest\(/);
  assert.match(block, /'ytd-rich-item-renderer, ytd-reel-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, '/);
  assert.match(block, /if \(tag\.includes\('lockup-view-model'\)\)/);
  assert.match(block, /return node\.closest\('ytd-rich-item-renderer, ytm-rich-item-renderer, \.ytGridShelfViewModelGridShelfItem'\) \|\| node/);
});

test('DOM fallback active predicate currently treats raw content and category enabled flags as active', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );

  assert.match(block, /if \(settings\.enabled === false\) return false/);
  assert.match(block, /if \(listMode === 'whitelist'\) return true/);
  assert.match(block, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(block, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(block, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(block, /return categoryFilters\?\.enabled === true/);
  assert.doesNotMatch(block, /categoryFilters\?\.selected/);
  assert.doesNotMatch(block, /minMinutes/);
  assert.doesNotMatch(block, /fromDate/);
});

test('DOM fallback category card logic requires selected categories before metadata fetch scheduling', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'let hideByCategory = false;',
    'const alreadyProcessed = element.hasAttribute'
  );

  assert.match(block, /const enabled = !!catFilters\?\.enabled/);
  assert.match(block, /const selected = Array\.isArray\(catFilters\?\.selected\) \? catFilters\.selected : \[\]/);
  assert.match(block, /if \(enabled && selected\.length > 0\) \{/);
  assert.match(block, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
});

test('DOM fallback upload-date logic can schedule metadata before validating blank date predicates', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'let hideByUploadDate = false;',
    'const isWatchPlaylistRow = (() => {'
  );

  const scheduleIndex = block.indexOf("scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })");
  const needsTimestampIndex = text.indexOf('const needsTimestamp = (() => {', text.indexOf('let hideByUploadDate = false;'));

  assert.notEqual(scheduleIndex, -1, 'missing upload-date metadata fetch scheduling');
  assert.notEqual(needsTimestampIndex, -1, 'missing later needsTimestamp guard');
  assert.match(block, /if \(uploadSettings && uploadSettings\.enabled\) \{/);
  assert.ok(
    text.indexOf('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })') < needsTimestampIndex,
    'metadata fetch scheduling occurs before the later valid-date needsTimestamp check'
  );
});

test('DOM fallback duration logic uses zero threshold for longer and shorter comparisons', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'let hideByDuration = false;',
    'const skipKeywordFiltering = listMode'
  );

  assert.match(block, /if \(durationSettings && durationSettings\.enabled && typeof extractVideoDuration === 'function'\)/);
  assert.match(block, /const min = Number\(durationSettings\.minMinutes \?\? durationSettings\.minutes \?\? durationSettings\.value \?\? durationSettings\.minutesMin \?\? 0\) \|\| 0/);
  assert.match(block, /if \(condition === 'longer'\) \{\s*hideByDuration = durationMinutes > min;/);
  assert.match(block, /else if \(condition === 'shorter'\) \{\s*hideByDuration = durationMinutes < min;/);
});

test('DOM fallback keyword normalization currently accepts one-sided word boundary matches', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'function matchesKeyword(regex, rawText, keywordData) {',
    '// ============================================================================'
  );

  assert.match(block, /const hasLeftBoundary = !beforeChar \|\| !isAlphanumeric\(beforeChar\)/);
  assert.match(block, /const hasRightBoundary = !afterChar \|\| !isAlphanumeric\(afterChar\)/);
  assert.match(block, /if \(hasLeftBoundary \|\| hasRightBoundary\) \{\s*return true;/);
  assert.doesNotMatch(block, /hasLeftBoundary && hasRightBoundary/);
});

test('DOM fallback members-only badge host selector currently includes watch primary containers', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'const membershipBadges = document.querySelectorAll',
    '// 2) Shelves/playlists identified by UUMO playlist id or label text'
  );

  assert.match(block, /ytd-watch-flexy/);
  assert.match(block, /ytd-watch-metadata/);
  assert.match(block, /ytd-video-primary-info-renderer/);
  assert.match(block, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(block, /shelf\.setAttribute\('data-filtertube-hidden', 'true'\)/);
});
