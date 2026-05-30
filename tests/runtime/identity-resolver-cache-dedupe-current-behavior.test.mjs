import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('identity resolver cache dedupe register is audit-only and keeps runtime behavior unchanged', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /Resolver cache\/dedupe is not the same as resolver authority/);
});

test('identity resolver cache dedupe register covers all current resolver state surfaces', () => {
  const doc = read(docPath);

  for (const surface of [
    'Background Shorts identity',
    'Background Main watch identity',
    'Background Kids watch identity',
    'Content-side watch identity bridge',
    'Content-side Shorts identity bridge',
    'Handle resolver',
    'Watch metadata fetch',
    'Fallback menu pending enrichment',
    'Post-block background enrichment'
  ]) {
    assert.ok(doc.includes(surface), `missing resolver surface ${surface}`);
  }
});

test('identity resolver cache dedupe register pins source proof slices', () => {
  const doc = read(docPath);

  for (const proof of [
    'js/background.js:929-938',
    'js/background.js:1108-1167',
    'js/background.js:2665-2703',
    'js/background.js:2984-3068',
    'js/background.js:3071-3161',
    'js/content_bridge.js:1610-1712',
    'js/content_bridge.js:7867-7920',
    'js/content_bridge.js:7848-7917',
    'js/content_bridge.js:7980-8115',
    'js/content_bridge.js:8066-8116',
    'js/content_bridge.js:466-489',
    'js/content_bridge.js:10480-10780',
    'js/content/handle_resolver.js:133-279'
  ]) {
    assert.ok(doc.includes(proof), `missing source proof ${proof}`);
  }
});

test('current source has resolver caches pending maps queues and fanout state', () => {
  const background = read('js/background.js');
  const bridge = read('js/content_bridge.js');
  const handleResolver = read('js/content/handle_resolver.js');

  for (const token of [
    'const pendingShortsIdentityFetches = new Map()',
    'const shortsIdentitySessionCache = new Map()',
    'const pendingWatchIdentityFetches = new Map()',
    'const watchIdentitySessionCache = new Map()',
    'const pendingKidsWatchIdentityFetches = new Map()',
    'const kidsWatchIdentitySessionCache = new Map()',
    'const pendingPostBlockEnrichments = new Map()',
    'const postBlockEnrichmentAttempted = new Map()',
    'const queuedPostBlockEnrichmentKeys = new Set()',
    'let postBlockEnrichmentWorker = Promise.resolve()'
  ]) {
    assert.ok(background.includes(token), `missing background resolver state ${token}`);
  }

  for (const token of [
    'const pendingWatchMetaFetches = new Map()',
    'const queuedWatchMetaFetches = new Set()',
    'const watchMetaFetchQueue = []',
    'const lastWatchMetaFetchAttempt = new Map()',
    'let activeWatchMetaFetches = 0',
    'const WATCH_META_FETCH_CONCURRENCY = 3',
    'const backgroundWatchIdentityInFlight = new Map()',
    'pendingShortsFetches.has(videoId)',
    'pendingDropdownFetches.set(dropdown'
  ]) {
    assert.ok(bridge.includes(token), `missing content bridge resolver state ${token}`);
  }

  assert.match(handleResolver, /const resolvedHandleCache = new Map\(\)/);
  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
});

test('current source coalesces or rate-limits resolver work locally but not through shared authority', () => {
  const background = read('js/background.js');
  const bridge = read('js/content_bridge.js');
  const handleResolver = read('js/content/handle_resolver.js');

  assert.match(background, /const cacheKey = normalizedHandle \? `\$\{videoId\}:\$\{normalizedHandle\}` : videoId/);
  assert.match(background, /pendingShortsIdentityFetches\.has\(cacheKey\)/);
  assert.match(background, /shortsIdentitySessionCache\.set\(cacheKey, identity\)/);
  assert.match(background, /pendingKidsWatchIdentityFetches\.has\(videoId\)/);
  assert.match(background, /kidsWatchIdentitySessionCache\.set\(videoId, identity\)/);
  assert.match(background, /pendingWatchIdentityFetches\.has\(videoId\)/);
  assert.match(background, /watchIdentitySessionCache\.set\(videoId, identity\)/);
  assert.match(background, /now - lastAttempt < 6 \* 60 \* 60 \* 1000/);
  assert.match(background, /queuedPostBlockEnrichmentKeys\.has\(key\)/);

  assert.match(bridge, /const key = `\$\{videoId\}:\$\{normalizedExpected \|\| ''\}`/);
  assert.match(bridge, /backgroundWatchIdentityInFlight\.has\(key\)/);
  assert.match(bridge, /backgroundWatchIdentityInFlight\.delete\(key\)/);
  assert.match(bridge, /now - last < 60 \* 1000/);
  assert.match(bridge, /activeWatchMetaFetches < WATCH_META_FETCH_CONCURRENCY/);
  assert.match(bridge, /const MAX_CONCURRENT = 3/);
  assert.match(bridge, /allowDirectFetch === true/);

  assert.match(handleResolver, /resolvedHandleCache\.has\(cleanHandle\)/);
  assert.match(handleResolver, /if \(cached !== 'PENDING'\)/);
  assert.match(handleResolver, /return null/);
  assert.match(handleResolver, /fetchIdForHandle\(handle, options = \{\}\)/);
});

test('runtime does not yet contain resolver cache authority symbols', () => {
  const runtime = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/handle_resolver.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');

  for (const token of [
    'identityResolverCacheDecision',
    'identityResolverDedupeAuthority',
    'resolverFetchBudget',
    'noRuleResolverCounter',
    'postActionResolverFanoutBudget',
    'handleResolverPendingPolicy'
  ]) {
    assert.equal(runtime.includes(token), false, `${token} should not exist in runtime source yet`);
  }
});
