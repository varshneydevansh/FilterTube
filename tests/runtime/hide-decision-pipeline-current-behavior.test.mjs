import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_HIDE_DECISION_PIPELINE_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('hide_decision_pipeline_doc_is_audit_only_and_names_the_split_pipeline', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /background compiled settings/);
  assert.match(doc, /seed main-world JSON hooks/);
  assert.match(doc, /filter_logic JSON mutation/);
  assert.match(doc, /isolated-world DOM fallback/);
  assert.match(doc, /shouldHideContent \+ per-card predicates/);
  assert.match(doc, /toggleVisibility/);
  assert.match(doc, /There is no single `hideDecisionAuthority`/);
  assert.match(doc, /Out-of-Band Hide\/Show Writers/);
  assert.match(doc, /Ptolemy challenged the first version/);
});

test('hide_decision_pipeline_background_compile_can_use_aliases_and_learned_maps', () => {
  const background = read('js/background.js');
  const keywordBlock = sliceBetween(background, 'const v4KeywordEntries = shouldUseKidsProfile', 'if (v4KeywordEntries) {');
  const channelBlock = sliceBetween(background, 'const storedChannels = shouldUseKidsProfile', 'let compiledChannels = [];');
  const derivedKeywordBlock = sliceBetween(background, '// Merge channel-based keywords with existing keywords', '// Pass through the channel map');

  assert.match(keywordBlock, /activeMain\.blockedKeywords/);
  assert.match(keywordBlock, /activeMain\.keywords/);
  assert.match(keywordBlock, /kidsBlockedKeywords/);

  assert.match(channelBlock, /activeMain\.blockedChannels/);
  assert.match(channelBlock, /activeMain\.channels/);
  assert.match(channelBlock, /items\.filterChannels/);

  assert.match(derivedKeywordBlock, /filterAll_channel/);
  assert.match(derivedKeywordBlock, /browserAPI\.storage\.local\.set\(\{ ftProfilesV4: updatedProfilesV4 \}\)/);
  assert.match(background, /compiledSettings\.channelMap = items\.channelMap \|\| \{\}/);
  assert.match(background, /const compiledVideoChannelMap = \{/);
});

test('hide_decision_pipeline_seed_splits_no_work_harvest_and_mutation', () => {
  const seed = read('js/seed.js');
  const skip = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName)', 'function processWithEngine(data, dataName)');
  const process = sliceBetween(seed, 'function processWithEngine(data, dataName)', '/**\n     * Basic fallback processing');

  for (const token of [
    'cachedSettings.listMode',
    'activeContentFilters',
    'activeJsonFilterRules',
    'hasEnabledContentFilters(cachedSettings)',
    'hasActiveJsonFilterRules(cachedSettings)'
  ]) {
    assert.ok(skip.includes(token), `missing skip predicate token ${token}`);
  }

  assert.match(skip, /mode !== 'whitelist'/);
  assert.match(skip, /if \(mode === 'whitelist'\) return false/);
  assert.match(process, /FilterTubeEngine\.harvestOnly\(data, cachedSettings/);
  assert.match(process, /FilterTubeEngine\.processData\(data, cachedSettings, dataName\)/);
  assert.match(process, /stashNetworkSnapshot\(result, dataName\)/);
});

test('hide_decision_pipeline_json_renderer_path_removes_objects_and_fails_closed_in_whitelist', () => {
  const filter = read('js/filter_logic.js');
  const shouldBlock = sliceBetween(filter, '_shouldBlock(item, rendererType) {', '_checkCategoryFilters(item, rules, rendererType) {');
  const filterRecursive = sliceBetween(filter, 'filter(obj, path = \'root\') {', 'processData(data, dataName = \'unknown\') {');
  const processData = sliceBetween(filter, 'processData(data, dataName = \'unknown\') {', '// ============================================================================');

  assert.match(shouldBlock, /const listMode = \(this\.settings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(shouldBlock, /this\.settings\.videoChannelMap\[videoId\]/);
  assert.match(shouldBlock, /if \(!hasChannelRules && !hasKeywordRules\)/);
  assert.match(shouldBlock, /return true/);
  assert.match(shouldBlock, /allow:matched_channel/);
  assert.match(shouldBlock, /allow:matched_keyword/);
  assert.match(shouldBlock, /block:unresolved_identity/);
  assert.match(shouldBlock, /this\.settings\.filterChannels\.length > 0/);
  assert.match(shouldBlock, /this\.settings\.filterKeywords\.length > 0/);
  assert.match(shouldBlock, /this\.settings\.hideAllComments/);

  assert.match(filterRecursive, /return null; \/\/ Remove this entire object/);
  assert.match(processData, /this\._harvestChannelData\(data\)/);
  assert.match(processData, /const filtered = this\.filter\(data\)/);
});

test('hide_decision_pipeline_dom_fallback_active_predicate_is_separate_from_seed', () => {
  const dom = read('js/content/dom_fallback.js');
  const active = sliceBetween(dom, 'function hasActiveDOMFallbackWork(settings)', 'function clearStaleDOMFallbackVisibility()');
  const applyStart = sliceBetween(dom, 'async function applyDOMFallback(settings, options = {})', '// 1. Video/Content Filtering');

  assert.match(active, /if \(listMode === 'whitelist'\) return true/);
  for (const token of [
    'settings.filterKeywords',
    'settings.filterChannels',
    'settings.filterKeywordsComments',
    'hideAllComments',
    'hideAllShorts',
    'hideWatchPlaylistPanel',
    'hideEndscreenVideowall',
    'contentFilters?.duration?.enabled === true',
    'categoryFilters?.enabled === true'
  ]) {
    assert.ok(active.includes(token), `missing DOM active predicate token ${token}`);
  }

  assert.match(applyStart, /runState\.running/);
  assert.match(applyStart, /clearStaleDOMFallbackVisibility\(\)/);
  assert.match(applyStart, /hasActiveDOMFallbackWork\(effectiveSettings\)/);
});

test('hide_decision_pipeline_dom_loop_combines_identity_metadata_predicates_and_parent_targets', () => {
  const dom = read('js/content/dom_fallback.js');
  const loop = sliceBetween(dom, '// 1. Video/Content Filtering', 'const pendingMetaTtlMs = 8000;');

  assert.match(loop, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);
  assert.match(loop, /hasChannelLinkNow/);
  assert.match(loop, /effectiveSettings\.videoChannelMap\[videoId\]/);
  assert.match(loop, /titleElement/);
  assert.match(loop, /channelElement/);
  assert.match(loop, /durationSettings && durationSettings\.enabled/);
  assert.match(loop, /hideByDuration/);
  assert.match(loop, /hideByUploadDate/);
  assert.match(loop, /hideByCategory/);
  assert.match(loop, /shouldHideContent\(keywordTarget, channel, effectiveSettings/);
  assert.match(loop, /targetToHide = parent/);
  assert.match(loop, /targetToHide = wrapper/);
  assert.match(loop, /data-filtertube-whitelist-pending/);
});

test('hide_decision_pipeline_should_hide_content_is_predicate_not_full_authority', () => {
  const dom = read('js/content/dom_fallback.js');
  const predicateStart = dom.indexOf('function shouldHideContent(title, channel, settings, options = {})');
  assert.notEqual(predicateStart, -1, 'Missing shouldHideContent');
  const predicate = dom.slice(predicateStart);

  assert.match(predicate, /if \(listMode === 'whitelist' && isKidsVideoCard\)/);
  assert.match(predicate, /if \(!hasChannelRules && !hasKeywordRules\) return true/);
  assert.match(predicate, /matchesKeyword\(regex, title\)/);
  assert.match(predicate, /channelMetaMatchesIndex\(identityOnlyMeta, index, channelMap\)/);
  assert.match(predicate, /isLikelyShorts/);
  assert.match(predicate, /block:unresolved_identity/);
  assert.match(predicate, /settings\.filterKeywords && settings\.filterKeywords\.length > 0/);
  assert.match(predicate, /settings\.filterChannels && settings\.filterChannels\.length > 0/);
  assert.match(predicate, /fetchIdForHandle\(`@\$\{safeKey\}`, \{ skipNetwork: true, backgroundOnly: true \}\)/);
  assert.doesNotMatch(predicate, /hideDecisionId|hideDecisionAuthority|restoreOwner|statsPolicy|mediaPolicy/);
});

test('hide_decision_pipeline_visual_side_effects_are_coupled_after_match', () => {
  const helpers = read('js/content/dom_helpers.js');
  const toggle = sliceBetween(helpers, 'function toggleVisibility(element, shouldHide, reason = \'\', skipStats = false)', '/**\n * Recursively checks');
  const dom = read('js/content/dom_fallback.js');
  const markers = sliceBetween(dom, 'function markElementAsBlocked(element, channelInfo, state = \'pending\')', 'function clearBlockedElementAttributes(element)');
  const playlistGuard = sliceBetween(dom, 'if (!window.__filtertubePlaylistNavGuardInstalled)', 'try {\n        for (let elementIndex = 0;');
  const contentCss = sliceBetween(dom, 'function ensureContentControlStyles(settings)', 'function hideYouTubeOpenAppButtons()');
  const membersPlaylistDirect = sliceBetween(dom, '// Robust DOM-based passes', '// 1. Video/Content Filtering');
  const seed = read('js/seed.js');
  const commentRewrite = sliceBetween(seed, '// Special handling for comment requests when hideAllComments is enabled', 'return new Response(JSON.stringify(emptyCommentResponse)');
  const blockChannel = read('js/content/block_channel.js');
  const immediateQuickBlock = sliceBetween(blockChannel, 'function applyQuickBlockImmediateHide(videoCard, channelInfo)', 'async function runQuickBlockAction(videoCard, triggerBtn)');
  const bridge = read('js/content_bridge.js');
  const shortsEnrichment = sliceBetween(bridge, '// Check if this Short belongs to the blocked channel', 'async function fetchWatchIdentityFromBackground');
  const playlistEnrichment = sliceBetween(bridge, 'const hideRow = (row, info = {}) => {', 'for (const row of rows)');

  assert.match(toggle, /classList\.add\('filtertube-hidden'\)/);
  assert.match(toggle, /data-filtertube-hidden/);
  assert.match(toggle, /style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(toggle, /filteringTracker\.recordHide/);
  assert.match(toggle, /incrementHiddenStats\(element\)/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.match(toggle, /decrementHiddenStats\(element\)/);

  assert.match(markers, /data-filtertube-blocked-channel-id/);
  assert.match(markers, /data-filtertube-blocked-state/);
  assert.match(playlistGuard, /event\.preventDefault\(\)/);
  assert.match(playlistGuard, /video\.pause\(\)/);
  assert.match(playlistGuard, /targetLink\.click\(\)/);

  assert.match(contentCss, /filtertube-content-controls-style/);
  assert.match(contentCss, /settings\.hideHomeFeed/);
  assert.match(contentCss, /display: none !important/);
  assert.match(membersPlaylistDirect, /effectiveSettings\.hideMembersOnly/);
  assert.match(membersPlaylistDirect, /host\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(membersPlaylistDirect, /effectiveSettings\.hidePlaylistCards/);
  assert.match(membersPlaylistDirect, /lockup\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(membersPlaylistDirect, /effectiveSettings\.hideMixPlaylists/);
  assert.match(commentRewrite, /emptyCommentResponse/);
  assert.match(immediateQuickBlock, /targetToHide\.style\.display = 'none'/);
  assert.match(shortsEnrichment, /container\.style\.display = 'none'/);
  assert.match(playlistEnrichment, /data-filtertube-hidden-by-playlist-enrichment/);
});

test('hide_decision_pipeline_doc_lists_required_future_authority_fields_and_blocked_changes', () => {
  const doc = read(docPath);

  for (const field of [
    'hideDecisionId',
    'runtimeRevision',
    'profileId',
    'viewingSpace',
    'sourceKind: json | dom | learned-map | background-fetch | direct-writer',
    'channelIdentity + confidence + provenance',
    'ruleRowId',
    'decision: hide | allow | pending | restore | no-work',
    'restoreOwner',
    'statsPolicy',
    'mediaPolicy',
    'networkPolicy',
    'engagementPolicy'
  ]) {
    assert.ok(doc.includes(field), `missing future authority field ${field}`);
  }

  for (const blocked of [
    'no-work optimization',
    'stale alias cleanup',
    'JSON renderer expansion',
    'DOM selector narrowing',
    'whitelist behavior changes',
    'simultaneous allow/block migration',
    'learned identity trust changes',
    'stats/time-saved changes',
    'playlist/end-screen/player side-effect changes'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked-change item ${blocked}`);
  }
});
