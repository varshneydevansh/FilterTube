import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

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

const docPath = 'docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md';

test('network fetch reason matrix is audit-only and separates source order from fetch reason', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /identity waterfall says where channel and video identity can come from/);
  assert.match(doc, /That source order is not enough to judge performance or YouTube-visible side\s+effects/);
  assert.match(doc, /not permission to change\s+fetch behavior/);
});

test('network fetch reason matrix records every current reason family', () => {
  const doc = read(docPath);

  for (const reason of [
    'passive_youtubei_intercept',
    'extension_resource',
    'explicit_subscription_import',
    'metadata_fetch',
    'identity_fallback',
    'menu_open_enrichment',
    'dom_repair_fallback',
    'direct_handle_fallback',
    'explicit_rule_mutation_lookup',
    'clicked_target_retry',
    'post_action_fanout',
    'caller_requested_channel_fetch',
    'public_website_remote'
  ]) {
    assert.ok(doc.includes(reason), `missing reason family ${reason}`);
  }
});

test('runtime has no shared network fetch reason authority yet', () => {
  const productSource = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/handle_resolver.js',
    'js/injector.js',
    'js/seed.js'
  ].map(read).join('\n');

  for (const token of [
    'networkFetchReasonAuthority',
    'networkFetchReasonDecision',
    'passiveInterceptWorkBudget',
    'metadataFetchReasonBudget',
    'identityFallbackFetchBudget',
    'postActionFetchFanoutBudget',
    'noRuleNetworkFetchCounter'
  ]) {
    assert.doesNotMatch(productSource, new RegExp(token), `${token} should not exist in runtime source yet`);
  }
});

test('background identity message handlers validate video id but lack sender reason budget', () => {
  const background = read('js/background.js');
  const shorts = sliceBetween(background, 'function handleFetchShortsIdentityMessage(request, sendResponse)', 'function handleFetchWatchIdentityMessage(request, sendResponse)');
  const watch = sliceBetween(background, 'function handleFetchWatchIdentityMessage(request, sendResponse)', 'function storageGet(keys)');
  const listener = sliceBetween(background, "} else if (action === 'fetchShortsIdentity')", "} else if (action === 'FilterTube_KidsBlockChannel')");

  assert.match(shorts, /\!\/\^\[a-zA-Z0-9_-\]\{11\}\$\/\.test\(videoId\)/);
  assert.match(shorts, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(watch, /profileType === 'kids'/);
  assert.match(watch, /performKidsWatchIdentityFetch\(videoId\) \|\| await performWatchIdentityFetch\(videoId\)/);
  assert.match(watch, /performWatchIdentityFetch\(videoId\)/);
  assert.match(listener, /handleFetchShortsIdentityMessage\(request, sendResponse\)/);
  assert.match(listener, /handleFetchWatchIdentityMessage\(request, sendResponse\)/);
  assert.doesNotMatch(shorts + watch + listener, /isTrustedUiSender|networkFetchReasonAuthority|activeRuleReason|maxPerNavigation/);
});

test('content bridge has metadata, background identity, direct identity, and menu-open fetch reasons', () => {
  const bridge = read('js/content_bridge.js');
  const metadata = sliceBetween(bridge, 'async function fetchVideoMetaFromWatchUrl(videoId) {', '// ==========================================');
  const backgroundWatch = sliceBetween(bridge, 'async function fetchWatchIdentityFromBackground(videoId, requestedHandle = null) {', 'async function enrichVisiblePlaylistRowsWithChannelInfo(blockedChannelId, settings) {');
  const shorts = sliceBetween(bridge, 'async function fetchChannelFromShortsUrl(videoId, requestedHandle = null) {', 'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {');
  const shortsDirect = sliceBetween(bridge, 'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {', '/**\n * Fetch channel information from the /watch?v=ID page');
  const watchDirect = sliceBetween(bridge, 'async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {', 'async function injectFilterTubeMenuItem');
  const menuOpen = sliceBetween(bridge, 'const stillNeedsNameEnrichment = !enrichedInfo?.name', 'updateInjectedMenuChannelName(dropdown, enrichedInfo);');

  assert.match(metadata, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(metadata, /persistVideoMetaMapping/);
  assert.match(metadata, /scheduleVideoMetaDomRerun/);
  assert.match(backgroundWatch, /action: 'fetchWatchIdentity'/);
  assert.match(shorts, /action: 'fetchShortsIdentity'/);
  assert.match(shorts, /allowDirectFetch/);
  assert.match(shortsDirect, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchDirect, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(menuOpen, /action: 'fetchChannelDetails'/);
  assert.doesNotMatch(metadata + backgroundWatch + shorts + shortsDirect + watchDirect + menuOpen, /networkFetchReasonAuthority|metadataFetchReasonBudget|identityFallbackFetchBudget/);
});

test('handle resolver separates background-only repair from direct handle fallback fetch', () => {
  const resolver = read('js/content/handle_resolver.js');
  const block = sliceBetween(resolver, 'if (backgroundOnly) {', '        const encodedHandle = encodeURIComponent(networkHandleCore);');
  const direct = sliceBetween(resolver, 'const handlePaths = [', '        const text = await response.text();');

  assert.match(block, /action: 'fetchChannelDetails'/);
  assert.match(block, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(block, /scheduleDomFallbackRerun\(\)/);
  assert.match(direct, /`\/@\$\{encodedHandle\}\/about`/);
  assert.match(direct, /`\/@\$\{encodedHandle\}`/);
  assert.match(direct, /fetch\(path,/);
  assert.match(direct, /credentials: 'same-origin'/);
  assert.doesNotMatch(block + direct, /networkFetchReasonAuthority|domRepairFetchBudget|directHandleFetchBudget/);
});

test('background channel add can chain video identity, channel page, watch repair, and post-block enrichment reasons', () => {
  const background = read('js/background.js');
  const add = sliceBetween(background, 'async function handleAddFilteredChannel(input, filterAll = false', 'async function handleToggleChannelFilterAll');
  const enrichment = sliceBetween(background, 'function schedulePostBlockEnrichment(channel, profile =', 'function getChannelDerivedKeywordRef(channel)');

  assert.match(add, /performKidsWatchIdentityFetch\(effectiveVideoId\) \|\| await performWatchIdentityFetch\(effectiveVideoId\)/);
  assert.match(add, /performShortsIdentityFetch\(effectiveVideoId, ''\) \|\| await performWatchIdentityFetch\(effectiveVideoId\)/);
  assert.match(add, /fetchChannelInfo\(lookupValue\)/);
  assert.match(add, /incomingSource === 'playlist_fallback_menu' \|\| incomingSource === 'postBlockEnrichment'/);
  assert.match(add, /schedulePostBlockEnrichment\(finalChannelData, profile/);
  assert.match(enrichment, /source === 'postBlockEnrichment'/);
  assert.match(enrichment, /6 \* 60 \* 60 \* 1000/);
  assert.match(enrichment, /3500 \+ Math\.floor\(Math\.random\(\) \* 750\)/);
  assert.match(enrichment, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(add + enrichment, /networkFetchReasonAuthority|postActionFetchFanoutBudget|clickedTargetFetchBudget/);
});

test('background caller requested channel details and subscription import remain separate network reasons', () => {
  const background = read('js/background.js');
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const details = sliceBetween(background, 'else if (request.action === "fetchChannelDetails")', '// Handle any browser-specific actions if needed');
  const importBlock = sliceBetween(injector, "if (type !== 'FilterTube_RequestSubscriptionImport' || source !== 'content_bridge') return;", 'async function fetchSubscribedChannelsFromYoutubei(requestId, options = {})');
  const bridgeRequest = sliceBetween(bridge, 'function requestSubscribedChannelsFromMainWorld(options = {}, onProgress = null) {', 'window.FilterTubeRequestSubscribedChannelsFromMainWorld = requestSubscribedChannelsFromMainWorld;');
  const injectorFetch = sliceBetween(injector, 'response = await fetch(endpointUrl, {', '            } catch (error) {');

  assert.match(details, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.doesNotMatch(details, /isTrustedUiSender|activeRuleReason|networkFetchReasonAuthority/);
  assert.match(importBlock, /FilterTube_RequestSubscriptionImport/);
  assert.match(bridgeRequest, /requestId/);
  assert.match(bridgeRequest, /timeoutMs/);
  assert.match(bridgeRequest, /maxChannels/);
  assert.match(injectorFetch, /method: 'POST'/);
  assert.match(injectorFetch, /credentials: 'include'/);
  assert.match(injectorFetch, /body: JSON\.stringify\(requestBody\)/);
  assert.doesNotMatch(importBlock + bridgeRequest + injectorFetch, /networkFetchReasonAuthority|explicitUserImport|subscriptionImportFetchBudget/);
});

test('network fetch reason matrix is linked from the active stabilization docs', () => {
  const stabilization = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const fixtureResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(stabilization, /Network fetch reason matrix/);
  assert.match(stabilization, /FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(ledger, /Network fetch reason matrix addendum/);
  assert.match(ledger, /passive interception, explicit import, metadata fetch, identity fallback, menu-open enrichment, DOM repair, clicked-target retry, post-block fanout, and caller-requested channel fetch/);
  assert.match(fixtureResults, /tests\/runtime\/network-fetch-reason-matrix-current-behavior\.test\.mjs/);
});
