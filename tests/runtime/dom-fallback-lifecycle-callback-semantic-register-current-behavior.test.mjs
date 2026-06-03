import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md';
const domFallbackPath = 'js/content/dom_fallback.js';

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
  if (line <= 930) return 'currentWatchOwnerRetryAndNavigationTimers';
  if (line <= 1100) return 'continuationNudgeTimer';
  if (line <= 2250) return 'mainPipelineYieldTimer';
  if (line <= 2300) return 'mainPipelineScrollStateListener';
  if (line <= 2590) return 'playlistClickEndedGuards';
  if (line <= 2620) return 'playlistAutoplayDeferredClickTimer';
  if (line <= 4010) return 'pendingMetadataAndSelectedRowTimers';
  return 'pendingRunRerunTimer';
}

function domFallbackLifecycleInstances() {
  const text = read(domFallbackPath);
  const starts = lineStarts(text);
  const lines = text.split('\n');
  const rows = [];

  for (const [family, pattern] of Object.entries(LIFECYCLE_PATTERNS)) {
    for (const match of text.matchAll(pattern)) {
      const line = lineForIndex(starts, match.index);
      rows.push({
        id: `${domFallbackPath}:${line}:${family}`,
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

test('DOM fallback lifecycle callback register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content\/dom_fallback\.js/);
  assert.match(text, /lifecycle instances: 14/);
  assert.match(text, /lifecycle primitive families: 2/);
  assert.match(text, /semantic callback groups: 8/);
  assert.match(text, /explicit teardown or clear instances: 0/);
  assert.match(text, /page-lifetime listener guards: 3/);
  assert.match(text, /source-derived from exact lifecycle-register patterns/);
  assert.match(text, /not completion proof for every callback/);
  assert.match(text, /not permission to optimize, delete, gate, or merge lifecycle work/);
});

test('DOM fallback lifecycle callback register accounts for every current DOM fallback lifecycle instance', () => {
  const rows = domFallbackLifecycleInstances();
  const ids = new Set(rows.map(row => row.id));
  const text = doc();

  assert.equal(rows.length, 14);
  assert.equal(ids.size, rows.length, 'DOM fallback lifecycle instance ids must remain unique');
  assert.deepEqual(countBy(rows, 'family'), {
    addEventListener: 3,
    setTimeout: 11
  });

  assert.deepEqual(
    rows.filter(row => row.family !== 'addEventListener' && row.family !== 'setTimeout'),
    [],
    'DOM fallback lifecycle inventory currently has no teardown, observer, interval, or frame primitives'
  );

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.family}\` | \`${row.group}\` |`),
      `missing inventory row for ${row.id}`
    );
  }
});

test('DOM fallback lifecycle callback register preserves semantic group counts and future callback fields', () => {
  const rows = domFallbackLifecycleInstances();
  const text = doc();
  const expectedGroups = new Map([
    ['currentWatchOwnerRetryAndNavigationTimers', 4],
    ['continuationNudgeTimer', 1],
    ['mainPipelineScrollStateListener', 1],
    ['mainPipelineYieldTimer', 1],
    ['pendingMetadataAndSelectedRowTimers', 3],
    ['pendingRunRerunTimer', 1],
    ['playlistAutoplayDeferredClickTimer', 1],
    ['playlistClickEndedGuards', 2]
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
    'mediaOrPlayerEffect',
    'syntheticNavigationEffect',
    'teardownOwner',
    'pageLifetimeReason',
    'nativeOverlayPausePolicy',
    'fullscreenPausePolicy',
    'noRuleBudget',
    'positiveFixture',
    'negativeRouteFixture',
    'negativeNoRuleFixture',
    'negativeOverlayFixture',
    'negativeFullscreenNativeFixture',
    'restoreOrClearProof'
  ]) {
    assert.ok(text.includes(field), `missing future callback field ${field}`);
  }
});

test('DOM fallback source still proves selected lifecycle callback side effects', () => {
  const source = read(domFallbackPath);

  for (const pattern of [
    /function enforceCurrentWatchOwnerBlock/,
    /targetLink\.click\(\)/,
    /applyDOMFallback\(settings, \{ preserveScroll: true, forceReprocess: true \}\)/,
    /nextButton\.click\(\)/,
    /const yieldToMain = \(\) => new Promise\(resolve => setTimeout\(resolve, 0\)\)/,
    /window\.__filtertubeScrollState/,
    /window\.addEventListener\('scroll'/,
    /window\.__filtertubePlaylistNavGuardInstalled/,
    /document\.addEventListener\('click', \(event\) =>/,
    /currentSettings\?\.listMode === 'whitelist'/,
    /video\.pause\(\)/,
    /window\.__filtertubePlaylistAutoplayGuardInstalled/,
    /document\.addEventListener\('ended', \(event\) =>/,
    /nextBtn\.click\(\)/,
    /window\.__filtertubePendingMetaRecheck/,
    /pendingTimerState\.timer = setTimeout/,
    /applyDOMFallback\(null, \{ preserveScroll: true \}\)/,
    /window\.__filtertubeLastPlaylistSkipTs/,
    /setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\)/
  ]) {
    assert.match(source, pattern);
  }
});

test('runtime source lacks DOM fallback lifecycle callback authority symbols', () => {
  const text = doc();
  const authorities = [
    'domFallbackLifecycleCallbackAuthority',
    'domFallbackLifecycleEffectReport',
    'domFallbackCallbackOwnerContract',
    'domFallbackNoRuleLifecycleBudget',
    'domFallbackCallbackTeardownRegistry',
    'domFallbackPlaylistGuardPolicy',
    'domFallbackPendingRunBudget',
    'domFallbackSyntheticNavigationBudget'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    for (const sourceFile of [
      'js/content/dom_fallback.js',
      'js/content/dom_helpers.js',
      'js/content_bridge.js',
      'js/content/block_channel.js',
      'js/background.js'
    ]) {
      assert.doesNotMatch(read(sourceFile), new RegExp(authority), `${authority} should not exist in ${sourceFile}`);
    }
  }
});
