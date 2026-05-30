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
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

test('engagement budget audit documents recommendation-risk boundaries and blocked verdict', () => {
  const doc = read('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'This does not prove YouTube recommendation behavior',
    'engagement_side_effect_normal_prefetch_is_no_network_today',
    'engagement_side_effect_whitelist_pending_prefetches_before_hide_today',
    'engagement_side_effect_watch_metadata_fetch_lacks_budget_today',
    'engagement_side_effect_identity_fallback_fetch_lacks_budget_today',
    'engagement_side_effect_current_watch_block_can_click_and_pause_today',
    'engagement_side_effect_playlist_guard_can_click_and_pause_today',
    'engagement_side_effect_subscription_import_is_user_action_but_observable_today',
    'engagement side-effect authority slice is not green',
    '2026-05-30 Store-Feedback Linkage',
    'FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'end-screen leaks and recommendation side effects are adjacent release risks',
    'YouTube recommendation impact remains unproven but plausible enough to budget',
    'runtime behavior changed by this continuation: no',
    'Engagement side-effect budget: NO-GO',
    'flowchart TD'
  ]) {
    assert.ok(doc.includes(phrase), `missing engagement budget phrase: ${phrase}`);
  }
});

test('product source still lacks one central engagement side-effect authority contract', () => {
  const sideEffectFiles = [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_helpers.js',
    'js/content/block_channel.js',
    'js/injector.js',
    'js/seed.js'
  ];
  const source = [...sideEffectFiles, 'js/background.js'].map(read).join('\n');

  assert.doesNotMatch(source, /engagementSideEffectAuthority/);
  assert.doesNotMatch(source, /observableSideEffectBudget/);
  assert.doesNotMatch(source, /sideEffectBudget/);
  assert.doesNotMatch(source, /maxPerNavigation/);

  const doc = read('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md');
  const tokenMatrix = {
    'js/content_bridge.js': {
      'await fetch(': 3,
      '.click(': 0,
      'video.pause()': 0,
      'media.pause()': 1,
      'pauseVideo(': 1,
      'stopVideo(': 1,
      'dispatchEvent(': 5,
      'new MouseEvent(': 1,
      'new KeyboardEvent(': 1,
      'window.scrollTo(': 0
    },
    'js/content/dom_fallback.js': {
      'await fetch(': 0,
      '.click(': 7,
      'video.pause()': 4,
      'media.pause()': 0,
      'pauseVideo(': 0,
      'stopVideo(': 0,
      'dispatchEvent(': 0,
      'new MouseEvent(': 0,
      'new KeyboardEvent(': 0,
      'window.scrollTo(': 2
    },
    'js/content/dom_helpers.js': {
      'await fetch(': 0,
      '.click(': 0,
      'video.pause()': 0,
      'media.pause()': 0,
      'pauseVideo(': 0,
      'stopVideo(': 0,
      'dispatchEvent(': 0,
      'new MouseEvent(': 0,
      'new KeyboardEvent(': 0,
      'window.scrollTo(': 0
    },
    'js/content/block_channel.js': {
      'await fetch(': 0,
      '.click(': 0,
      'video.pause()': 0,
      'media.pause()': 0,
      'pauseVideo(': 0,
      'stopVideo(': 0,
      'dispatchEvent(': 2,
      'new MouseEvent(': 0,
      'new KeyboardEvent(': 2,
      'window.scrollTo(': 0
    },
    'js/injector.js': {
      'await fetch(': 1,
      '.click(': 1,
      'video.pause()': 0,
      'media.pause()': 0,
      'pauseVideo(': 0,
      'stopVideo(': 0,
      'dispatchEvent(': 2,
      'new MouseEvent(': 0,
      'new KeyboardEvent(': 0,
      'window.scrollTo(': 2
    },
    'js/seed.js': {
      'await fetch(': 0,
      '.click(': 0,
      'video.pause()': 0,
      'media.pause()': 0,
      'pauseVideo(': 0,
      'stopVideo(': 0,
      'dispatchEvent(': 1,
      'new MouseEvent(': 0,
      'new KeyboardEvent(': 0,
      'window.scrollTo(': 0
    }
  };
  const totals = {};

  assert.match(doc, /Observable Side-Effect Token Snapshot - 2026-05-27/);

  for (const [file, expectedTokens] of Object.entries(tokenMatrix)) {
    const fileSource = read(file);
    for (const [token, expectedCount] of Object.entries(expectedTokens)) {
      const actual = fileSource.split(token).length - 1;
      assert.equal(actual, expectedCount, `${file} ${token} count should match engagement budget`);
      totals[token] = (totals[token] || 0) + actual;
    }
  }

  assert.deepEqual(totals, {
    'await fetch(': 4,
    '.click(': 8,
    'video.pause()': 4,
    'media.pause()': 1,
    'pauseVideo(': 1,
    'stopVideo(': 1,
    'dispatchEvent(': 10,
    'new MouseEvent(': 1,
    'new KeyboardEvent(': 3,
    'window.scrollTo(': 4
  });

  assert.match(doc, /\| \*\*Total\*\* \| \*\*4\*\* \| \*\*8\*\* \| \*\*4\*\* \| \*\*1\*\* \| \*\*1\*\* \| \*\*1\*\* \| \*\*10\*\* \| \*\*1\*\* \| \*\*3\*\* \| \*\*4\*\* \|/);
  assert.match(doc, /Normal card prefetch remains no-network inside `prefetchIdentityForCard\(\)`/);
  assert.match(doc, /The highest passive synthetic-navigation footprint is still in\s+`js\/content\/dom_fallback\.js`/);
  assert.match(doc, /the risk is cross-file/);
});

test('engagement_side_effect_normal_prefetch_is_no_network_today but still owns observer and map-write work', () => {
  const bridge = read('js/content_bridge.js');
  const queueBlock = sliceBetween(bridge, '// PREFETCH / HYDRATION QUEUE', 'function withTimeout(promise, ms) {');
  const identityBlock = sliceBetween(
    bridge,
    'async function prefetchIdentityForCard({ videoId, card }) {',
    'function stampChannelIdentity(card, info, options = {}) {'
  );

  assert.match(queueBlock, /const PREFETCH_MAX_QUEUE = 10/);
  assert.match(queueBlock, /const PREFETCH_CONCURRENCY = 2/);
  assert.match(queueBlock, /prefetchObserver = new IntersectionObserver/);
  assert.match(queueBlock, /rootMargin: '400px 0px 800px 0px'/);
  assert.match(queueBlock, /document\.addEventListener\('visibilitychange'/);
  assert.match(queueBlock, /queuePrefetchForCard\(entry\.target\)/);
  assert.doesNotMatch(identityBlock, /\bfetch\s*\(/);
  assert.match(identityBlock, /searchYtInitialDataForVideoChannel\(videoId, null\)/);
  assert.match(identityBlock, /persistVideoChannelMapping\(videoId, ytInfo\.id\)/);
});

test('engagement_side_effect_whitelist_pending_prefetches_before_hide_today', () => {
  const bridge = read('js/content_bridge.js');
  const block = sliceBetween(
    bridge,
    'const hidePending = (element) => {',
    'if (hidPendingCard) {'
  );

  assert.ok(block.indexOf('queuePrefetchForCard(element)') < block.indexOf("element.classList.add('filtertube-hidden')"));
  assert.match(block, /data-filtertube-whitelist-pending/);
  assert.match(block, /style\.setProperty\('display', 'none', 'important'\)/);
  assert.doesNotMatch(block, /engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_watch_metadata_fetch_lacks_budget_today', () => {
  const bridge = read('js/content_bridge.js');
  const block = sliceBetween(
    bridge,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '        if (!lengthSeconds && !publishDate && !uploadDate && !category) return null;'
  );

  assert.equal(count(block, /\bfetch\s*\(/g), 1);
  assert.match(block, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(block, /credentials: 'same-origin'/);
  assert.match(block, /response\.text\(\)/);
  assert.match(block, /ytInitialPlayerResponse/);
  assert.doesNotMatch(block, /metadataReason|engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_identity_fallback_fetch_lacks_budget_today', () => {
  const bridge = read('js/content_bridge.js');
  const shortsBlock = sliceBetween(
    bridge,
    'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {',
    '/**\n * Fetch channel information from the /watch?v=ID page'
  );
  const watchBlock = sliceBetween(
    bridge,
    'async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {',
    'async function injectFilterTubeMenuItem'
  );

  assert.equal(count(shortsBlock, /\bfetch\s*\(/g), 1);
  assert.equal(count(watchBlock, /\bfetch\s*\(/g), 1);
  assert.match(shortsBlock, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /pendingWatchFetches/);
  assert.doesNotMatch(shortsBlock + watchBlock, /identityReason|engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_current_watch_block_can_click_and_pause_today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    fallback,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );
  const openPanelBlock = sliceBetween(
    fallback,
    'function openWatchPlaylistPanelIfCollapsed() {',
    'function enforceCurrentWatchOwnerBlock(settings) {'
  );

  assert.match(block, /if \(listMode === 'whitelist'\) return/);
  assert.equal(count(block, /video\.pause\(\)/g), 2);
  assert.match(block, /targetLink\.click\(\)/);
  assert.match(block, /nextButton\.click\(\)/);
  assert.match(openPanelBlock, /clickable\.click\(\)/);
  assert.match(block, /toggleVisibility\(selected, true, `Current watch blocked:/);
  assert.match(block, /toggleVisibility\(shell, true, `Current watch blocked:/);
  assert.doesNotMatch(block + openPanelBlock, /ownerConfidence|engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_playlist_guard_can_click_and_pause_today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const guardBlock = sliceBetween(
    fallback,
    "if (!window.__filtertubePlaylistNavGuardInstalled) {",
    'try {\n        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {'
  );

  assert.match(guardBlock, /document\.addEventListener\('click'/);
  assert.match(guardBlock, /document\.addEventListener\('ended'/);
  assert.match(guardBlock, /event\.preventDefault\(\)/);
  assert.match(guardBlock, /event\.stopImmediatePropagation\(\)/);
  assert.match(guardBlock, /video\.pause\(\)/);
  assert.match(guardBlock, /targetLink\.click\(\)/);
  assert.match(guardBlock, /nextBtn\.click\(\)/);
  assert.doesNotMatch(guardBlock, /removeEventListener|engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_subscription_import_is_user_action_but_observable_today', () => {
  const injector = read('js/injector.js');
  const block = sliceBetween(
    injector,
    'const performScrollStep = async () => {',
    "window.postMessage({\n                type: 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.match(injector, /FilterTube_RequestSubscriptionImport/);
  assert.match(block, /window\.scrollTo/);
  assert.match(block, /window\.dispatchEvent\(new Event\('scroll'\)\)/);
  assert.match(block, /button\.click\(\)/);
  assert.match(block, /expansionActions >= 18/);
  assert.match(block, /fetch\(endpointUrl,/);
  assert.match(block, /method: 'POST'/);
  assert.match(block, /credentials: 'include'/);
  assert.doesNotMatch(block, /engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});

test('engagement_side_effect_hide_helper_media_pause_is_not_separated_from_skipstats_today', () => {
  const helpers = read('js/content/dom_helpers.js');
  const bridge = read('js/content_bridge.js');
  const toggleBlock = sliceBetween(
    helpers,
    'function toggleVisibility(element, shouldHide, reason = \'\', skipStats = false) {',
    '/**\n * Recursively checks if a container should be hidden because all its relevant children are hidden.'
  );
  const mediaBlock = sliceBetween(
    bridge,
    'function handleMediaPlayback(element, shouldHide) {',
    'function extractCollaboratorMetadataFromRenderer(rendererCandidate) {'
  );

  assert.match(toggleBlock, /if \(!skipStats\) \{/);
  assert.match(toggleBlock, /handleMediaPlayback\(element, true\)/);
  assert.match(toggleBlock, /handleMediaPlayback\(element, false\)/);
  assert.match(mediaBlock, /media\.pause\(\)/);
  assert.match(mediaBlock, /moviePlayer\.pauseVideo\(\)/);
  assert.match(mediaBlock, /moviePlayer\.stopVideo\(\)/);
  assert.doesNotMatch(toggleBlock + mediaBlock, /mediaPolicy|engagementSideEffectAuthority|sideEffectBudget|maxPerNavigation/);
});
