import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md';
const contentBridgePath = 'js/content_bridge.js';

const LIFECYCLE_PATTERNS = {
  addEventListener: /\.addEventListener\s*\(/g,
  removeEventListener: /\.removeEventListener\s*\(/g,
  mutationObserver: /new\s+MutationObserver\s*\(/g,
  intersectionObserver: /new\s+IntersectionObserver\s*\(/g,
  setInterval: /\bsetInterval\s*\(/g,
  clearInterval: /\bclearInterval\s*\(/g,
  setTimeout: /\bsetTimeout\s*\(/g,
  clearTimeout: /\bclearTimeout\s*\(/g,
  requestAnimationFrame: /\brequestAnimationFrame\s*\(/g,
  cancelAnimationFrame: /\bcancelAnimationFrame\s*\(/g
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function groupForLine(line) {
  if (line <= 570) return 'dropdownCleanupAndFrameWait';
  if (line <= 1146) return 'prefetchObserverAndRouteHooks';
  if (line <= 1556) return 'prefetchMapWritesAndMetaRerun';
  if (line <= 3506) return 'collaborationRetryAndSelectionState';
  if (line <= 5860) return 'mainWorldRequestResponseBridge';
  if (line <= 6217) return 'domFallbackStartupAndPendingWhitelist';
  if (line <= 6778) return 'fallbackMenuButtonLifecycle';
  if (line <= 7475) return 'playlistFallbackPopoverLifecycle';
  if (line <= 8216) return 'postActionShortsPlaylistEnrichment';
  if (line <= 10566) return 'menuInjectionWaitAndLookup';
  if (line <= 11506) return 'menuItemActionHandlers';
  if (line <= 13016) return 'blockClickHideMutationFollowup';
  return 'globalBootstrap';
}

function contentBridgeLifecycleInstances() {
  const text = read(contentBridgePath);
  const starts = lineStarts(text);
  const lines = text.split('\n');
  const rows = [];

  for (const [family, pattern] of Object.entries(LIFECYCLE_PATTERNS)) {
    for (const match of text.matchAll(pattern)) {
      const line = lineForIndex(starts, match.index);
      rows.push({
        id: `${contentBridgePath}:${line}:${family}`,
        line,
        family,
        group: groupForLine(line),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }

  return rows.sort((a, b) => a.line - b.line || a.family.localeCompare(b.family));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

test('content bridge lifecycle callback register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content_bridge\.js/);
  assert.match(text, /lifecycle instances: 91/);
  assert.match(text, /lifecycle primitive families: 9/);
  assert.match(text, /semantic callback groups: 13/);
  assert.match(text, /source-derived from exact lifecycle-register patterns/);
  assert.match(text, /not completion proof for every nested callback/);
  assert.match(text, /not permission to optimize, delete, gate, or merge lifecycle work/);
});

test('content bridge lifecycle callback register accounts for every current content bridge lifecycle instance', () => {
  const rows = contentBridgeLifecycleInstances();
  const ids = new Set(rows.map(row => row.id));
  const text = doc();

  assert.equal(rows.length, 91);
  assert.equal(ids.size, rows.length, 'content bridge lifecycle instance ids must remain unique');
  assert.deepEqual(countBy(rows, 'family'), {
    addEventListener: 25,
    clearInterval: 1,
    clearTimeout: 10,
    intersectionObserver: 1,
    mutationObserver: 7,
    removeEventListener: 1,
    requestAnimationFrame: 9,
    setInterval: 1,
    setTimeout: 36
  });

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.family}\` | \`${row.group}\` |`),
      `missing inventory row for ${row.id}`
    );
  }
});

test('content bridge lifecycle callback register preserves semantic group counts and future callback fields', () => {
  const rows = contentBridgeLifecycleInstances();
  const text = doc();
  const expectedGroups = new Map([
    ['blockClickHideMutationFollowup', 4],
    ['collaborationRetryAndSelectionState', 8],
    ['domFallbackStartupAndPendingWhitelist', 11],
    ['dropdownCleanupAndFrameWait', 1],
    ['fallbackMenuButtonLifecycle', 2],
    ['globalBootstrap', 7],
    ['mainWorldRequestResponseBridge', 9],
    ['menuItemActionHandlers', 6],
    ['playlistFallbackPopoverLifecycle', 21],
    ['postActionShortsPlaylistEnrichment', 7],
    ['prefetchMapWritesAndMetaRerun', 12],
    ['prefetchObserverAndRouteHooks', 3]
  ]);

  assert.deepEqual(countBy(rows, 'group'), Object.fromEntries([...expectedGroups].sort()));

  for (const [group, count] of expectedGroups) {
    assert.ok(text.includes(`| \`${group}\` | ${count} |`), `missing group count for ${group}`);
  }

  for (const field of [
    'instanceId',
    'primitiveFamily',
    'ownerFunction',
    'callbackKind',
    'installTrigger',
    'routeOrSurface',
    'settingsPredicate',
    'listMode',
    'identitySourceTier',
    'allowedEffects',
    'scheduledDomWork',
    'scheduledNetworkWork',
    'scheduledMessageWork',
    'storageOrStatsEffect',
    'teardownOwner',
    'pageLifetimeReason',
    'nativeOverlayPausePolicy',
    'fullscreenPausePolicy',
    'noRuleBudget',
    'positiveFixture',
    'negativeRouteFixture',
    'negativeNoRuleFixture',
    'negativeOverlayFixture',
    'restoreOrClearProof'
  ]) {
    assert.ok(text.includes(field), `missing future callback field ${field}`);
  }
});

test('content bridge source still proves selected lifecycle callback side effects', () => {
  const source = read(contentBridgePath);

  for (const pattern of [
    /prefetchObserver = new IntersectionObserver/,
    /document\.addEventListener\('visibilitychange'/,
    /document\.addEventListener\('yt-navigate-finish'/,
    /window\.addEventListener\('scroll'/,
    /const warmupTimer = setInterval/,
    /clearInterval\(warmupTimer\)/,
    /window\.addEventListener\('message', handleMainWorldMessages, false\)/,
    /setTimeout\(\(\) => initialize\(\), 50\)/,
    /pendingImmediateFallbackTimer = setTimeout/,
    /whitelistPendingRefreshState\.pendingHideTimer = setTimeout/,
    /observer = new MutationObserver/,
    /closeObserver = new MutationObserver/,
    /menuItem\.addEventListener\('click', handleInteraction, \{ capture: true \}\)/,
    /type: 'addFilteredChannel'/,
    /type: 'toggleChannelFilterAll'/,
    /requestAnimationFrame\(\(\) =>/,
    /applyDOMFallback/,
    /style\.display = 'none'/
  ]) {
    assert.match(source, pattern);
  }
});

test('runtime source lacks content bridge lifecycle callback authority symbols', () => {
  const text = doc();
  const authorities = [
    'contentBridgeLifecycleCallbackAuthority',
    'contentBridgeLifecycleEffectReport',
    'contentBridgeCallbackOwnerContract',
    'contentBridgeNoRuleLifecycleBudget',
    'contentBridgeCallbackTeardownRegistry'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    for (const sourceFile of [
      'js/content_bridge.js',
      'js/content/block_channel.js',
      'js/content/dom_fallback.js',
      'js/background.js'
    ]) {
      assert.doesNotMatch(read(sourceFile), new RegExp(authority), `${authority} should not exist in ${sourceFile}`);
    }
  }
});
