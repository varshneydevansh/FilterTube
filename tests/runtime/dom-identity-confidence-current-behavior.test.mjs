import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('dom_identity_confidence_doc_is_audit_only_and_names_the_missing_authority', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /DOM-confidence question/);
  assert.match(doc, /canonical, joined-by-video-id, display-only, pending, stale, or unsafe/);
  assert.match(doc, /domIdentityConfidenceAuthority/);
  assert.match(doc, /domIdentityConfidenceDecision/);
  assert.match(doc, /identitySourceConfidence/);
  assert.match(doc, /displayOnlyIdentity/);
  assert.match(doc, /pendingIdentityRestoreOwner/);
});

test('dom_identity_confidence_is_source_backed_for_recycled_card_and_stamp_paths', () => {
  const bridge = read('js/content_bridge.js');
  const prefetch = sliceBetween(bridge, 'function queuePrefetchForCard(card)', 'function drainPrefetchQueue()');
  const identityPrefetch = sliceBetween(bridge, 'async function prefetchIdentityForCard({ videoId, card })', 'function stampChannelIdentity(card, info, options = {})');
  const stamp = sliceBetween(bridge, 'function stampChannelIdentity(card, info, options = {})', 'function resetCardIdentityIfStale(card, videoId)');
  const reset = sliceBetween(bridge, 'function resetCardIdentityIfStale(card, videoId)', 'function cardContainsVideoIdLink(card, videoId)');
  const ownership = sliceBetween(bridge, 'function cardContainsVideoIdLink(card, videoId)', 'function resolveIdFromHandle(handle)');

  assert.match(prefetch, /priorCachedVideoId/);
  assert.match(prefetch, /removeAttribute\('data-filtertube-channel-id'\)/);
  assert.match(prefetch, /persistVideoChannelMapping\(videoId, existingId\)/);
  assert.match(prefetch, /resolveIdFromHandle\(existingHandle\)/);

  assert.match(identityPrefetch, /currentSettings\?\.videoChannelMap/);
  assert.match(identityPrefetch, /extractChannelFromCard\(card\)/);
  assert.match(identityPrefetch, /searchYtInitialDataForVideoChannel\(videoId, null\)/);
  assert.match(identityPrefetch, /persistVideoChannelMapping\(videoId, ytInfo\.id\)/);

  assert.match(stamp, /data-filtertube-channel-id/);
  assert.match(stamp, /data-filtertube-channel-handle/);
  assert.match(stamp, /data-filtertube-channel-name/);
  assert.match(stamp, /applyDOMFallback\(null\)/);

  assert.match(reset, /cachedId && videoId && cachedId !== videoId/);
  assert.match(reset, /clearBlockedElementAttributes\(card\)/);
  assert.match(reset, /data-filtertube-collaborators/);
  assert.match(reset, /data-filtertube-hidden-by-channel/);
  assert.match(reset, /style\.removeProperty\('display'\)/);

  assert.match(ownership, /cardContainsVideoIdLink/);
  assert.match(ownership, /shouldStampCardForVideoId/);
  assert.match(ownership, /No live\/anchor proof this card belongs to `videoId` yet/);
});

test('dom_identity_confidence_is_source_backed_for_low_confidence_extraction_and_menu_guards', () => {
  const bridge = read('js/content_bridge.js');
  const extraction = sliceBetween(bridge, 'function extractChannelFromCard(card)', 'async function injectFilterTubeMenuItem(dropdown, videoCard)');
  const menu = sliceBetween(bridge, 'async function injectFilterTubeMenuItem(dropdown, videoCard)', 'function attachFilterTubeMenuHandlers');

  for (const token of [
    'normalizeYtmChannelName',
    "if (normalized.startsWith('@')) return '';",
    'if (/^UC[\\w-]{22}$/i.test(normalized)) return \'\';',
    'if (normalized.includes(\'•\')) return \'\';',
    'Never treat lockup metadata text (which includes title + view count) as a channel name.',
    'needsFetch: true',
    "fetchStrategy: 'mainworld'",
    'expectedChannelName',
    'expectedHandle'
  ]) {
    assert.ok(extraction.includes(token), `missing extraction token: ${token}`);
  }

  assert.match(menu, /resetCardIdentityIfStale\(videoCard, liveVideoId\)/);
  assert.match(menu, /promoteChannelInfoFromCollaboratorSignals/);
  assert.match(menu, /hydrateChannelInfoFromCurrentMappings/);
  assert.match(menu, /safeName && safeName\.toLowerCase\(\) !== 'channel'/);
  assert.match(menu, /missingIdentityBits/);
  assert.match(menu, /searchYtInitialDataForVideoChannel\(initialChannelInfo\.videoId/);
  assert.match(menu, /Ignoring main-world channel mismatch \(card UCID vs fetched UCID\)/);
  assert.match(menu, /Ignoring main-world channel mismatch \(card handle vs fetched handle\)/);
  assert.match(menu, /fetchIdForHandle\(finalChannelInfo\.handle, \{ skipNetwork: true \}\)/);
});

test('dom_identity_confidence_pins_text_derived_handle_fallback_as_low_confidence', () => {
  const doc = read(docPath);
  const extractors = read('js/content/dom_extractors.js');
  const textFallback = sliceBetween(
    extractors,
    'if (!meta.handle) {',
    'if (meta.handle) {'
  );

  assert.match(doc, /Text-derived handle fallback/);
  assert.match(doc, /broader visible text rather than a proven channel-owner endpoint/);
  assert.match(doc, /title\/description `@handle` cannot become canonical owner identity/);
  assert.match(doc, /A handle found in broad visible text is weaker than a handle found on a\s+stable channel link or JSON endpoint/);

  assert.match(textFallback, /channelText/);
  assert.match(textFallback, /cacheTarget\?\.innerText/);
  assert.match(textFallback, /element\?\.innerText/);
  assert.match(textFallback, /relatedElements\.map\(el => el\?\.innerText\)/);
  assert.match(textFallback, /extractHandleFromString\(sourceText\)/);
  assert.doesNotMatch(textFallback, /domIdentityConfidenceAuthority|displayOnlyIdentity|sourceConfidenceDecision/);
});

test('dom_identity_confidence_is_source_backed_for_whitelist_pending_hide_and_dom_allow_fallbacks', () => {
  const bridge = read('js/content_bridge.js');
  const pendingHide = sliceBetween(bridge, 'const whitelistPendingRefreshState = {', 'function fallbackRelevantSelector()');
  const fallback = read('js/content/dom_fallback.js');
  const currentPageIdentity = sliceBetween(fallback, 'let channelMeta = extractChannelMetadataFromElement(element, channel, channelHref, {', 'const collaboratorMetas = Array.isArray(extractCollaboratorMetadataFromElement(element))');
  const whitelist = sliceBetween(fallback, 'if (listMode === \'whitelist\' && !isCommentContext) {', '// Debug logging (disabled by default - set to true for troubleshooting)');

  assert.match(pendingHide, /WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT = 160/);
  assert.match(pendingHide, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);
  assert.match(pendingHide, /if \(isSelected\) return false/);
  assert.match(pendingHide, /queuePrefetchForCard\(element\)/);
  assert.match(pendingHide, /data-filtertube-whitelist-pending/);
  assert.match(pendingHide, /style\.setProperty\('display', 'none', 'important'\)/);

  assert.match(currentPageIdentity, /const currentPageChannelMeta = getCurrentPageChannelMeta\(\)/);
  assert.match(currentPageIdentity, /!channelMeta\.handle/);
  assert.match(currentPageIdentity, /element\.setAttribute\('data-filtertube-channel-handle', channelMeta\.handle\)/);
  assert.match(currentPageIdentity, /element\.setAttribute\('data-filtertube-channel-id', channelMeta\.id\)/);

  assert.match(whitelist, /channelMetaMatchesIndex\(identityOnlyMeta, index, channelMap\)/);
  assert.match(whitelist, /allow:matched_channel_name_fallback/);
  assert.match(whitelist, /allow:matched_collaborator_name_fallback/);
  assert.match(whitelist, /block:unresolved_identity/);
  assert.match(whitelist, /isKidsVideoCard \|\| isLikelyShorts/);
  assert.match(whitelist, /allow:creator_page_whitelisted/);
});

test('dom_identity_confidence_has_no_runtime_authority_yet', () => {
  const files = [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js',
    'js/filter_logic.js',
    'js/background.js'
  ];
  const source = files.map(read).join('\n');

  assert.doesNotMatch(source, /domIdentityConfidenceAuthority/);
  assert.doesNotMatch(source, /domIdentityConfidenceDecision/);
  assert.doesNotMatch(source, /identitySourceConfidence/);
  assert.doesNotMatch(source, /displayOnlyIdentity/);
  assert.doesNotMatch(source, /pendingIdentityRestoreOwner/);
});
