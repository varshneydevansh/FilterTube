import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content/dom_fallback.js': [5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5']
};

const blockSpecs = {
  backgroundShortsMessage: {
    file: 'js/background.js',
    start: 'function handleFetchShortsIdentityMessage(request, sendResponse) {',
    end: 'function handleFetchWatchIdentityMessage',
    label: 'background handleFetchShortsIdentityMessage block',
    startLine: 2666,
    lines: 42,
    bytes: 1658
  },
  backgroundWatchMessage: {
    file: 'js/background.js',
    start: 'function handleFetchWatchIdentityMessage(request, sendResponse) {',
    end: 'function storageGet',
    label: 'background handleFetchWatchIdentityMessage block',
    startLine: 2708,
    lines: 28,
    bytes: 1054
  },
  backgroundShortsFetch: {
    file: 'js/background.js',
    start: 'async function performShortsIdentityFetch(videoId, normalizedHandle) {',
    end: 'function extractIdentityFromPreview',
    label: 'background performShortsIdentityFetch block',
    startLine: 2879,
    lines: 67,
    bytes: 2543
  },
  backgroundKidsFetch: {
    file: 'js/background.js',
    start: 'async function performKidsWatchIdentityFetch(videoId) {',
    end: 'async function performWatchIdentityFetch',
    label: 'background performKidsWatchIdentityFetch block',
    startLine: 2980,
    lines: 94,
    bytes: 3605
  },
  backgroundWatchFetch: {
    file: 'js/background.js',
    start: 'async function performWatchIdentityFetch(videoId) {',
    end: '// Listen for messages sent from other parts',
    label: 'background performWatchIdentityFetch block',
    startLine: 3074,
    lines: 93,
    bytes: 3584
  },
  backgroundIdentityActionBranch: {
    file: 'js/background.js',
    start: "} else if (action === 'fetchShortsIdentity') {",
    end: "} else if (action === 'FilterTube_KidsBlockChannel')",
    label: 'background fetchShorts/fetchWatch action branch block',
    startLine: 3975,
    lines: 7,
    bytes: 272
  },
  backgroundChannelDetailsBranch: {
    file: 'js/background.js',
    start: 'else if (request.action === "fetchChannelDetails")',
    end: '// Handle any browser-specific actions if needed',
    label: 'background fetchChannelDetails branch block',
    startLine: 4463,
    lines: 12,
    bytes: 607
  },
  backgroundChannelInfo: {
    file: 'js/background.js',
    start: 'async function fetchChannelInfo(channelIdOrHandle) {',
    end: 'async function handleAddFilteredChannel(input, filterAll = false',
    label: 'background fetchChannelInfo block',
    startLine: 4558,
    lines: 751,
    bytes: 32503
  },
  bridgeWatchIdentity: {
    file: 'js/content_bridge.js',
    start: 'async function fetchWatchIdentityFromBackground(videoId, requestedHandle = null) {',
    end: 'async function enrichVisiblePlaylistRowsWithChannelInfo',
    label: 'content_bridge fetchWatchIdentityFromBackground block',
    startLine: 8451,
    lines: 56,
    bytes: 2118
  },
  bridgeShortsIdentity: {
    file: 'js/content_bridge.js',
    start: 'async function fetchChannelFromShortsUrl(videoId, requestedHandle = null) {',
    end: 'async function fetchChannelFromShortsUrlDirect',
    label: 'content_bridge fetchChannelFromShortsUrl block',
    startLine: 8634,
    lines: 69,
    bytes: 2661
  },
  bridgeDirectShortsIdentity: {
    file: 'js/content_bridge.js',
    start: 'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {',
    end: '/**\n * Fetch channel information from the /watch?v=ID page',
    label: 'content_bridge fetchChannelFromShortsUrlDirect block',
    startLine: 8703,
    lines: 124,
    bytes: 6367
  },
  handleResolverFetch: {
    file: 'js/content/handle_resolver.js',
    start: 'async function fetchIdForHandle(handle, options = {}) {',
    end: null,
    label: 'handle_resolver fetchIdForHandle block',
    startLine: 149,
    lines: 134,
    bytes: 4787
  },
  domFallbackUnresolvedEscalation: {
    file: 'js/content/dom_fallback.js',
    start: 'if (channelMeta.id && !channelMeta.handle && Array.isArray(index.unresolvedHandleKeys)',
    end: '\n        }\n    }\n\n    return false;',
    label: 'dom_fallback unresolved handle escalation block',
    startLine: 4758,
    lines: 53,
    bytes: 3572
  }
};

const policyTokens = [
  'identityFetchAuthority',
  'networkAuthority',
  'activeRuleReason',
  'fetchBudget',
  'request.reason',
  'request.route',
  'request.tabId',
  'isTrustedUiSender',
  'isProfileSessionAuthorized'
];

const futureAuthoritySymbols = [
  'backgroundIdentityFetchNetworkBudgetContract',
  'backgroundIdentityFetchSenderPolicy',
  'backgroundIdentityFetchReasonReport',
  'backgroundIdentityFetchRouteProfileReport',
  'backgroundIdentityFetchCredentialPolicy',
  'backgroundIdentityFetchCacheBudgetReport',
  'backgroundIdentityFetchActiveRuleGate',
  'backgroundIdentityFetchDirectFallbackPolicy',
  'backgroundIdentityFetchDomEscalationReport',
  'backgroundIdentityFetchMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceWithStart(file, startNeedle, endNeedle) {
  const text = read(file);
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = endNeedle === null ? text.length : text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return {
    startLine: text.slice(0, start).split(/\r?\n/).length,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const { startLine, block } = sliceWithStart(spec.file, spec.start, spec.end);
  return {
    startLine,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('background identity fetch network budget audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not approval to change filtering, whitelist,\s+JSON mutation, DOM mutation, storage, message, cache, fetch, or lifecycle\s+behavior/);
  assert.match(doc, /background identity fetch network budget boundary source files: 4/);
  assert.match(doc, /background identity fetch network budget source\/effect blocks: 13/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(doc, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`));
  }
});

test('background identity fetch source/effect blocks stay pinned', () => {
  const doc = read(docPath);

  for (const spec of Object.values(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${spec.label} start line drift`);
    assert.equal(metric.lines, spec.lines, `${spec.label} line count drift`);
    assert.equal(metric.bytes, spec.bytes, `${spec.label} byte count drift`);
    assert.match(
      doc,
      new RegExp(`${escapeRegex(spec.label)}: line ${spec.startLine}, ${spec.lines} lines, ${spec.bytes} bytes`)
    );
  }
});

test('background identity message/cache blocks keep cache and pending behavior explicit', () => {
  const doc = read(docPath);
  const shortsMessage = blockMetric(blockSpecs.backgroundShortsMessage).block;
  const watchMessage = blockMetric(blockSpecs.backgroundWatchMessage).block;
  const kidsFetch = blockMetric(blockSpecs.backgroundKidsFetch).block;
  const watchFetch = blockMetric(blockSpecs.backgroundWatchFetch).block;

  const checks = [
    [shortsMessage, 'pendingShortsIdentityFetches', 4],
    [shortsMessage, 'shortsIdentitySessionCache', 3],
    [shortsMessage, 'sendResponse', 5],
    [watchMessage, 'sendResponse', 5],
    [kidsFetch, 'pendingKidsWatchIdentityFetches', 4],
    [kidsFetch, 'kidsWatchIdentitySessionCache', 2],
    [watchFetch, 'pendingWatchIdentityFetches', 4],
    [watchFetch, 'watchIdentitySessionCache', 2]
  ];

  for (const [block, token, expected] of checks) {
    assert.equal(countLiteral(block, token), expected, `${token} count drift`);
    assert.match(doc, new RegExp(`\\\`${escapeRegex(token)}\\\`: ${expected}`));
  }
});

test('credentialed background fetch helpers keep timeout and request shape explicit', () => {
  const doc = read(docPath);
  const specs = [
    [blockSpecs.backgroundShortsFetch, 'performShortsIdentityFetch'],
    [blockSpecs.backgroundKidsFetch, 'performKidsWatchIdentityFetch'],
    [blockSpecs.backgroundWatchFetch, 'performWatchIdentityFetch']
  ];

  for (const [spec, label] of specs) {
    const block = blockMetric(spec).block;
    assert.equal(countLiteral(block, 'fetch('), 1, `${label} fetch count drift`);
    assert.equal(countLiteral(block, 'credentials'), 1, `${label} credentials count drift`);
    assert.equal(countLiteral(block, 'include'), 1, `${label} include count drift`);
    assert.equal(countLiteral(block, 'AbortController'), 1, `${label} AbortController count drift`);
    assert.equal(countLiteral(block, 'setTimeout'), 1, `${label} setTimeout count drift`);
    assert.equal(countLiteral(block, 'clearTimeout'), 1, `${label} clearTimeout count drift`);
  }

  const channelInfo = blockMetric(blockSpecs.backgroundChannelInfo).block;
  assert.equal(countLiteral(channelInfo, 'fetch('), 3);
  assert.equal(countLiteral(channelInfo, 'credentials'), 3);
  assert.equal(countLiteral(channelInfo, 'include'), 2);
  assert.match(doc, /fetchChannelInfo `fetch\(`: 3/);
  assert.match(doc, /fetchChannelInfo `credentials`: 3/);
  assert.match(doc, /fetchChannelInfo `include`: 2/);
});

test('background identity action branches lack local sender reason and budget policy', () => {
  const doc = read(docPath);
  const actionBranch = blockMetric(blockSpecs.backgroundIdentityActionBranch).block;
  const detailsBranch = blockMetric(blockSpecs.backgroundChannelDetailsBranch).block;
  const selected = [
    blockMetric(blockSpecs.backgroundShortsMessage).block,
    blockMetric(blockSpecs.backgroundWatchMessage).block,
    actionBranch,
    detailsBranch
  ].join('\n');

  assert.match(actionBranch, /handleFetchShortsIdentityMessage\(request, sendResponse\)/);
  assert.match(actionBranch, /handleFetchWatchIdentityMessage\(request, sendResponse\)/);
  assert.match(detailsBranch, /fetchChannelInfo\(request\.channelIdOrHandle\)/);

  for (const token of policyTokens) {
    assert.equal(countLiteral(selected, token), 0, `${token} should remain absent in selected background blocks`);
    assert.match(doc, new RegExp(`\\\`${escapeRegex(token)}\\\`: 0`));
  }
});

test('content callers distinguish background requests from direct same-origin fallback', () => {
  const doc = read(docPath);
  const bridgeWatch = blockMetric(blockSpecs.bridgeWatchIdentity).block;
  const bridgeShorts = blockMetric(blockSpecs.bridgeShortsIdentity).block;
  const bridgeDirect = blockMetric(blockSpecs.bridgeDirectShortsIdentity).block;
  const handle = blockMetric(blockSpecs.handleResolverFetch).block;

  assert.equal(countLiteral(bridgeWatch, 'browserAPI_BRIDGE.runtime.sendMessage'), 1);
  assert.equal(countLiteral(bridgeShorts, 'browserAPI_BRIDGE.runtime.sendMessage'), 1);
  assert.equal(countLiteral(bridgeShorts, 'allowDirectFetch'), 3);
  assert.equal(countLiteral(bridgeDirect, 'fetch('), 1);
  assert.equal(countLiteral(bridgeDirect, 'credentials'), 1);
  assert.equal(countLiteral(bridgeDirect, 'same-origin'), 1);
  assert.equal(countLiteral(handle, 'fetch('), 1);
  assert.equal(countLiteral(handle, 'credentials'), 1);
  assert.equal(countLiteral(handle, 'same-origin'), 1);
  assert.equal(countLiteral(handle, 'fetchChannelDetails'), 1);
  assert.equal(countLiteral(handle, 'FilterTube_UpdateChannelMap'), 2);
  assert.equal(countLiteral(handle, 'scheduleDomFallbackRerun'), 2);

  assert.match(doc, /fetchChannelFromShortsUrl `allowDirectFetch`: 3/);
  assert.match(doc, /fetchChannelFromShortsUrlDirect `same-origin`: 1/);
  assert.match(doc, /fetchIdForHandle `fetchChannelDetails`: 1/);
});

test('DOM fallback unresolved handle path still escalates to backgroundOnly fetchIdForHandle', () => {
  const doc = read(docPath);
  const block = blockMetric(blockSpecs.domFallbackUnresolvedEscalation).block;

  assert.equal(countLiteral(block, 'fetchIdForHandle'), 2);
  assert.equal(countLiteral(block, 'skipNetwork'), 1);
  assert.equal(countLiteral(block, 'backgroundOnly'), 1);
  assert.equal(countLiteral(block, '__filtertubeActiveHandleResolveState'), 2);
  assert.equal(countLiteral(block, '__filtertubeActiveHandleResolveAttempts'), 2);
  assert.equal(countLiteral(block, '10 * 60 * 1000'), 2);
  assert.equal(countLiteral(block, '1500'), 1);
  assert.match(block, /fetchIdForHandle\(`@\$\{safeKey\}`, \{ skipNetwork: true, backgroundOnly: true \}\)/);

  assert.match(doc, /unresolved handle escalation `fetchIdForHandle`: 2/);
  assert.match(doc, /`skipNetwork` avoids the direct content fetch path but still permits the\s+background channel-detail fetch path/);
});

test('background identity fetch network budget authority remains absent from product runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /Product runtime source still\s+lacks/);
  for (const symbol of futureAuthoritySymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly present in runtime source`);
    assert.match(doc, new RegExp(`\\\`${escapeRegex(symbol)}\\\``));
  }

  assert.match(doc, /sender class and tab\/url proof for each identity fetch action/);
  assert.match(doc, /reason codes for user action, active unresolved rule, DOM repair, and menu\s+enrichment/);
  assert.match(doc, /cache hit\/miss, pending-dedupe, timeout, and partial-stream budget metrics/);
  assert.match(doc, /false-hide\/false-allow fixtures for stale, unresolved, and mismatched identity/);
});
