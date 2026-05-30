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

test('DOM route-scope audit documents current selector authority gaps and future rule', () => {
  const doc = source('docs/audit/FILTERTUBE_DOM_ROUTE_SCOPE_AUDIT_2026-05-18.md');

  assert.match(doc, /global selector constants/);
  assert.match(doc, /VIDEO_CARD_SELECTORS/);
  assert.match(doc, /QUICK_BLOCK_CARD_SELECTORS/);
  assert.match(doc, /ignored root captures are audit evidence only/i);
  assert.match(doc, /Fallback menu gate split/);
  assert.match(doc, /Kids\/recycled node safety/);
  assert.match(doc, /Every selector family should have an explicit owner record/);
});

test('VIDEO_CARD_SELECTORS currently mixes desktop mobile Kids and YTM tags in one global selector', () => {
  const text = source('js/content/dom_extractors.js');
  const block = sliceBetween(text, 'const VIDEO_CARD_SELECTORS = [', '].join');

  assert.match(block, /'ytd-rich-item-renderer'/);
  assert.match(block, /'ytd-watch-card-rhs-panel-video-renderer'/);
  assert.match(block, /'ytd-radio-renderer'/);
  assert.match(block, /'ytm-video-with-context-renderer'/);
  assert.match(block, /'ytm-compact-playlist-renderer'/);
  assert.match(block, /'ytk-compact-video-renderer'/);
  assert.match(block, /'ytk-kids-slim-owner-renderer'/);
  assert.doesNotMatch(block, /route/);
  assert.doesNotMatch(block, /surfaceRegistry/);
});

test('ensureVideoIdForCard has Kids and recycled-node stale marker guards to preserve', () => {
  const text = source('js/content/dom_extractors.js');
  const block = sliceBetween(
    text,
    'function ensureVideoIdForCard(card) {',
    'function getCardTitle(card) {'
  );

  assert.match(block, /isKidsHost/);
  assert.match(block, /location\.hostname/);
  assert.match(block, /canFastReturnStamp/);
  assert.match(block, /shouldClearOnMismatch/);
  assert.match(block, /clearCachedChannelMetadata\(card\)/);
  assert.match(block, /data-filtertube-channel-id/);
  assert.match(block, /data-filtertube-whitelist-pending/);
  assert.match(block, /filtertube-hidden/);
});

test('applyDOMFallback uses global card selectors after active-work gate and only has local route cleanup', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'async function applyDOMFallback(settings, options = {}) {',
    'const isWatchPage = (() => {'
  );

  assert.match(block, /hasActiveDOMFallbackWork\(effectiveSettings\)/);
  assert.match(block, /window\.addEventListener\('scroll'/);
  assert.match(block, /path === '\/feed\/channels'/);
  assert.match(block, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);
  assert.doesNotMatch(block, /selectorRegistry/);
  assert.doesNotMatch(block, /routeBudget/);
});

test('quick-block has mobile watch-next gates but broad shared host and hide-target resolvers', () => {
  const text = source('js/content/block_channel.js');
  const mobileGate = sliceBetween(
    text,
    'const isMobileWatchNextQuickBlockHost = (hostCard) => {',
    'function isPostLikeQuickBlockCard(card) {'
  );
  const hostResolver = sliceBetween(
    text,
    'function resolveQuickBlockHost(node) {',
    'function resolveQuickBlockHideTarget(videoCard) {'
  );
  const hideResolver = sliceBetween(
    text,
    'function resolveQuickBlockHideTarget(videoCard) {',
    'function isRenderableQuickBlockAnchor(node) {'
  );

  assert.match(mobileGate, /m\.youtube\.com/);
  assert.match(mobileGate, /path\.startsWith\('\/watch'\)/);
  assert.match(mobileGate, /section-identifier="related-items"/);
  assert.match(hostResolver, /ytd-rich-item-renderer/);
  assert.match(hostResolver, /ytm-rich-item-renderer/);
  assert.match(hostResolver, /yt-lockup-view-model/);
  assert.doesNotMatch(hostResolver, /location\?\.pathname/);
  assert.match(hideResolver, /tag\.includes\('lockup-view-model'\)/);
  assert.match(hideResolver, /\.ytGridShelfViewModelGridShelfItem/);
});

test('primary menu injection and fallback menu scan currently use split action gates', () => {
  const text = source('js/content_bridge.js');
  const primary = sliceBetween(
    text,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );
  const fallbackScan = sliceBetween(
    text,
    'const fallbackMenuCardSelector = [',
    'let scanQueued = false;'
  );

  assert.match(primary, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(primary, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(primary, /clearFilterTubeMenuItems\(dropdown\)/);
  assert.match(fallbackScan, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.match(fallbackScan, /ytm-shorts-lockup-view-model/);
  assert.match(fallbackScan, /ytd-comment-thread-renderer/);
  assert.doesNotMatch(fallbackScan, /showBlockMenuItem/);
  assert.doesNotMatch(fallbackScan, /listMode/);
});

test('playlist and Mix DOM identity guards are localized safety behavior that must be preserved', () => {
  const text = source('js/content_bridge.js');
  const playlistBlock = sliceBetween(
    text,
    'if (isPlaylistPanelCard) {',
    'for (const candidate of dataCandidates) {'
  );
  const lockupBlock = sliceBetween(
    text,
    '// Never treat lockup metadata text',
    'console.log(\'FilterTube: Extracted from lockup data attrs:'
  );
  const injectionBlock = sliceBetween(
    text,
    'const isMixContextCard = !isCommentContextCard && isMixCardElement(videoCard);',
    '// Extract initial channel info'
  );

  assert.match(playlistBlock, /Playlist rows without explicit author links must not trust recycled stamped IDs\/handles/);
  assert.match(playlistBlock, /clearCachedChannelMetadata\(card\)/);
  assert.match(lockupBlock, /Never treat lockup metadata text/);
  assert.match(lockupBlock, /name\.includes\('•'\)/);
  assert.match(injectionBlock, /isMixContextCard/);
  assert.match(injectionBlock, /clearCollaboratorMetadataFromCard\(videoCard\)/);
});

test('watch playlist and members-only selectors remain route-sensitive broad hide candidates', () => {
  const text = source('js/content/dom_fallback.js');
  const selectedBlock = sliceBetween(
    text,
    'function isSelectedPlaylistPanelRow(element) {',
    'function extractPlaylistPanelBylineChannelName(value) {'
  );
  const currentWatchBlock = sliceBetween(
    text,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );
  const membersBlock = sliceBetween(
    text,
    'const membershipBadges = document.querySelectorAll',
    '// 2) Shelves/playlists identified by UUMO playlist id or label text'
  );

  assert.match(selectedBlock, /aria-selected/);
  assert.match(selectedBlock, /ytm-playlist-panel-video-renderer-selected/);
  assert.match(currentWatchBlock, /find\(row => isSelectedPlaylistPanelRow\(row\)\)/);
  assert.match(currentWatchBlock, /toggleVisibility\(selected, true, `Current watch blocked:/);
  assert.match(membersBlock, /ytd-watch-flexy/);
  assert.match(membersBlock, /ytd-watch-metadata/);
  assert.match(membersBlock, /ytd-video-primary-info-renderer/);
  assert.match(membersBlock, /shelf\.style\.setProperty\('display', 'none', 'important'\)/);
});
