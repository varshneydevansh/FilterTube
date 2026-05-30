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
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('engagement side-effect audit documents observable effect owners and future budget contract', () => {
  const doc = source('docs/audit/FILTERTUBE_ENGAGEMENT_SIDE_EFFECT_AUDIT_2026-05-18.md');

  for (const pattern of [
    /synthetic\s+clicks/,
    /direct watch\/shorts fetches/,
    /media pause\/play\/stop calls/,
    'Card identity prefetch',
    'Watch metadata fetch',
    'Current watch owner block',
    'Every YouTube-observable side effect should report an owner and budget'
  ]) {
    const re = pattern instanceof RegExp
      ? pattern
      : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    assert.match(doc, re);
  }
});

test('card prefetch queue uses observer scheduling, de-dupe, queue cap, and concurrency budget', () => {
  const text = source('js/content_bridge.js');
  const prefetch = sliceBetween(text, '// PREFETCH / HYDRATION QUEUE', 'function withTimeout(promise, ms) {');

  assert.match(prefetch, /const PREFETCH_MAX_QUEUE = 10/);
  assert.match(prefetch, /const PREFETCH_CONCURRENCY = 2/);
  assert.match(prefetch, /prefetchObserver = new IntersectionObserver/);
  assert.match(prefetch, /queuePrefetchForCard\(entry\.target\)/);
  assert.match(prefetch, /prefetchSeen\.has\(key\) && \(Date\.now\(\) - lastSeen\) < 30 \* 1000/);
  assert.match(prefetch, /if \(prefetchQueue\.length > PREFETCH_MAX_QUEUE\)/);
  assert.match(prefetch, /while \(prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue\.length > 0\)/);
});

test('normal card prefetch currently avoids direct YouTube network fetches and uses DOM or ytInitialData search', () => {
  const text = source('js/content_bridge.js');
  const prefetchIdentity = sliceBetween(
    text,
    'async function prefetchIdentityForCard({ videoId, card }) {',
    'function stampChannelIdentity(card, info, options = {}) {'
  );

  assert.match(prefetchIdentity, /Kids: do NOT prefetch via network/);
  assert.match(prefetchIdentity, /extractChannelFromCard\(card\)/);
  assert.match(prefetchIdentity, /searchYtInitialDataForVideoChannel\(videoId, null\)/);
  assert.match(prefetchIdentity, /persistVideoChannelMapping\(videoId, ytInfo\.id\)/);
  assert.doesNotMatch(prefetchIdentity, /fetch\(/);
  assert.doesNotMatch(prefetchIdentity, /fetchChannelFromWatchUrl/);
  assert.doesNotMatch(prefetchIdentity, /fetchChannelFromShortsUrlDirect/);
});

test('whitelist pending hide can queue card identity prefetch before hiding unresolved cards', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'const hidePending = (element) => {',
    'if (hidPendingCard) {'
  );

  assert.match(block, /queuePrefetchForCard\(element\)/);
  assert.match(block, /element\.classList\.add\('filtertube-hidden'\)/);
  assert.match(block, /data-filtertube-whitelist-pending/);
  assert.match(block, /style\.setProperty\('display', 'none', 'important'\)/);
});

test('watch metadata fetch performs direct YouTube watch HTML fetch for metadata extraction', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(
    text,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '        if (!lengthSeconds && !publishDate && !uploadDate && !category) return null;'
  );

  assert.match(block, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(block, /credentials: 'same-origin'/);
  assert.match(block, /response\.text\(\)/);
  assert.match(block, /ytInitialPlayerResponse/);
  assert.match(block, /lengthSeconds/);
  assert.match(block, /publishDate/);
});

test('legacy shorts and watch identity fallbacks still have direct page fetch paths', () => {
  const text = source('js/content_bridge.js');
  const shortsBlock = sliceBetween(
    text,
    'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {',
    '/**\n * Fetch channel information from the /watch?v=ID page'
  );
  const watchStart = text.indexOf('async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {');
  assert.notEqual(watchStart, -1, 'missing fetchChannelFromWatchUrl');
  const watchBlock = text.slice(watchStart, text.indexOf('function isProbablyCollaborationContext', watchStart) > -1
    ? text.indexOf('function isProbablyCollaborationContext', watchStart)
    : text.length);

  assert.match(shortsBlock, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(shortsBlock, /response\.text\(\)/);
  assert.match(shortsBlock, /ytInitialData/);
  assert.match(watchBlock, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /response\.text\(\)/);
  assert.match(watchBlock, /pendingWatchFetches/);
});

test('current watch owner block can pause playback and synthetic-click playlist or player next targets', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );

  assert.match(block, /video\.pause\(\)/);
  assert.match(block, /toggleVisibility\(selected, true, `Current watch blocked:/);
  assert.match(block, /targetLink\.click\(\)/);
  assert.match(block, /openWatchPlaylistPanelIfCollapsed\(\)/);
  assert.match(block, /nextButton\.click\(\)/);
  assert.match(block, /toggleVisibility\(shell, true, `Current watch blocked:/);
});

test('playlist navigation guards synthesize click-based skip behavior on blocked next entries', () => {
  const text = source('js/content/dom_fallback.js');
  const guardBlock = sliceBetween(
    text,
    "if (!window.__filtertubePlaylistNavGuardInstalled) {",
    'try {\n        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {'
  );
  const selectedRowBlock = sliceBetween(
    text,
    '// Never hide the currently-selected playlist row.',
    'if (isShortVideoRenderer) {'
  );
  const finalSelectedSkipBlock = sliceBetween(
    text,
    "const params = new URLSearchParams(document.location?.search || '');\n            const isPlaylistWatch = params.has('list');",
    '    } finally {'
  );

  assert.match(guardBlock, /event\.preventDefault\(\)/);
  assert.match(guardBlock, /event\.stopImmediatePropagation\(\)/);
  assert.match(guardBlock, /video\.pause\(\)/);
  assert.match(guardBlock, /targetLink\.click\(\)/);
  assert.match(guardBlock, /document\.addEventListener\('ended'/);
  assert.match(guardBlock, /nextBtn\.click\(\)/);
  assert.match(selectedRowBlock, /nextBtn\.click\(\)/);
  assert.match(finalSelectedSkipBlock, /video\.currentTime = 0/);
  assert.match(finalSelectedSkipBlock, /target\.click\(\)/);
});

test('subscription import main-world path is explicitly user-requested but performs scroll click and YouTubei fetch work', () => {
  const text = source('js/injector.js');
  const block = sliceBetween(
    text,
    'const performScrollStep = async () => {',
    "window.postMessage({\n                type: 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.match(block, /window\.scrollTo/);
  assert.match(block, /window\.dispatchEvent\(new Event\('scroll'\)\)/);
  assert.match(block, /button\.click\(\)/);
  assert.match(block, /fetch\(endpointUrl,/);
  assert.match(block, /method: 'POST'/);
  assert.match(block, /credentials: 'include'/);
});
