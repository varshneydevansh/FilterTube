import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function source(file) {
  return read(file);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineOf(file, needle) {
  const lines = source(file).split(/\r?\n/);
  const index = lines.findIndex(line => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = source(file).split(/\r?\n/);
  const start = lines.findIndex(line => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function lineOfAfterSequence(file, needles) {
  const lines = source(file).split(/\r?\n/);
  let start = 0;
  let index = -1;
  for (const needle of needles) {
    index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
    assert.ok(index >= 0, `${file} missing sequence needle ${needle}`);
    start = index + 1;
  }
  return index + 1;
}

function assertSourcePin(doc, rowId, file, startLine, endLine) {
  const sourcePin = `${file}:${startLine}-${endLine}`;
  assert.match(
    doc,
    new RegExp(`\\| \`${escapeRegExp(rowId)}\` \\| \`${escapeRegExp(sourcePin)}\``),
    `missing source pin ${sourcePin} for ${rowId}`
  );
}

function assertCurrentTeardownOwnershipSourceFlow(doc) {
  assert.match(doc, /Current Teardown Ownership Source-Flow Addendum - 2026-05-27/);
  assert.match(doc, /current teardown owner-flow rows: 11/);
  assert.match(doc, /ASCII teardown owner-flow diagram: present/);
  assert.match(doc, /Mermaid teardown owner-flow diagram: present/);
  assert.match(doc, /current teardown source proof: PARTIAL/);
  assert.match(doc, /shared lifecycle teardown authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /runtime owner installs lifecycle work/);
  assert.match(doc, /no shared route\/mode\/no-rule teardown authority exists yet/);

  assertSourcePin(
    doc,
    'teardown_seed_xhr_patch_owner',
    'js/seed.js',
    lineOf('js/seed.js', 'function setupXhrInterception() {'),
    lineOfAfter('js/seed.js', 'proto.removeEventListener = function', '};')
  );
  assertSourcePin(
    doc,
    'teardown_injector_readiness_interval_owner',
    'js/injector.js',
    lineOf('js/injector.js', 'const engineCheckInterval = setInterval(() => {'),
    lineOfAfter('js/injector.js', '// Timeout for engine check', 'clearInterval(engineCheckInterval);')
  );
  assertSourcePin(
    doc,
    'teardown_bridge_prefetch_observer_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'function schedulePrefetchScan() {'),
    lineOfAfter('js/content_bridge.js', "document.addEventListener('visibilitychange'", 'attachPrefetchObservers();')
  );
  assertSourcePin(
    doc,
    'teardown_bridge_playlist_prefetch_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'function installPlaylistPanelPrefetchHook() {'),
    lineOfAfter('js/content_bridge.js', "document.addEventListener('yt-navigate-finish'", '});')
  );
  assertSourcePin(
    doc,
    'teardown_bridge_right_rail_whitelist_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'function installRightRailWhitelistObserver() {'),
    lineOfAfterSequence('js/content_bridge.js', [
      'function installRightRailWhitelistObserver() {',
      "document.addEventListener('yt-navigate-finish', () => {",
      "document.addEventListener('yt-navigate-finish', () => {",
      '});'
    ])
  );
  assertSourcePin(
    doc,
    'teardown_bridge_whitelist_pending_timer_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'const whitelistPendingRefreshState = {'),
    lineOfAfterSequence('js/content_bridge.js', ['whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {', '}, delayMs);'])
  );
  assertSourcePin(
    doc,
    'teardown_bridge_dom_fallback_observer_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'function hasActiveFallbackLifecycleWork() {'),
    lineOfAfter('js/content_bridge.js', 'refreshDOMFallbackMutationObserver();', 'refreshFilterTubeRuntimeObservers();')
  );
  assertSourcePin(
    doc,
    'teardown_bridge_fallback_menu_scanner_owner',
    'js/content_bridge.js',
    lineOfAfter('js/content_bridge.js', 'function ensureFallbackMenuButtons() {', 'const observer = new MutationObserver((mutations) => {'),
    lineOfAfter('js/content_bridge.js', 'const warmupTimer = setInterval(() => {', '}, 1500);')
  );
  assertSourcePin(
    doc,
    'teardown_bridge_playlist_popover_owner',
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'if (!playlistFallbackPopoverState) {'),
    lineOfAfter('js/content_bridge.js', "document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);", 'playlistFallbackPopoverState.onDocClick = null;')
  );
  assertSourcePin(
    doc,
    'teardown_quick_block_page_lifecycle_owner',
    'js/content/block_channel.js',
    lineOf('js/content/block_channel.js', 'if (quickBlockSweepTimer) return;'),
    lineOfAfterSequence('js/content/block_channel.js', [
      "document.addEventListener('yt-navigate-finish', () => {",
      'scheduleQuickBlockSweep(document);',
      '});'
    ])
  );
  assertSourcePin(
    doc,
    'teardown_dom_fallback_playlist_guard_owner',
    'js/content/dom_fallback.js',
    lineOf('js/content/dom_fallback.js', 'async function applyDOMFallback(settings, options = {}) {'),
    lineOfAfterSequence('js/content/dom_fallback.js', ["document.addEventListener('ended', (event) => {", 'if (items.length === 0) return;'])
  );
}

test('lifecycle teardown decision register is audit-only and keeps runtime behavior unchanged', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /does not authorize deleting, merging,\s+or moving any observer, listener, timer, frame, page-global patch/);
  assertCurrentTeardownOwnershipSourceFlow(doc);
});

test('lifecycle teardown decision register separates teardown classes from shared authority', () => {
  const doc = read(docPath);

  for (const teardownClass of [
    '`explicit-teardown`',
    '`bounded-warmup`',
    '`navigation-scoped`',
    '`page-lifetime-local-gate`',
    '`missing-shared-authority`'
  ]) {
    assert.ok(doc.includes(teardownClass), `missing teardown class ${teardownClass}`);
  }

  assert.match(doc, /does not have\s+one shared teardown decision report/);
  assert.match(doc, /do not optimize until the owner has route, mode, no-rule, fullscreen,\s+native-overlay, and teardown proof/);
});

test('lifecycle teardown decision register covers the current owner map', () => {
  const doc = read(docPath);

  for (const owner of [
    'Seed page transport',
    'Injector readiness polling',
    'Content bridge prefetch / playlist hydration',
    'Whitelist pending refresh',
    'Fallback menu lifecycle',
    'Quick block lifecycle',
    'Normal menu / Kids passive menu',
    'DOM fallback core',
    'Playlist/player guards',
    'Collaborator dialog',
    'Extension UI surfaces',
    'Website components'
  ]) {
    assert.ok(doc.includes(owner), `missing owner row ${owner}`);
  }
});

test('lifecycle teardown decision register pins source proof for page runtime owners', () => {
  const doc = read(docPath);

  for (const proof of [
    'js/seed.js:710-841',
    'js/injector.js:3503-3528',
    'js/content_bridge.js:1012-1140',
    'js/content_bridge.js:5576-5837',
    'js/content_bridge.js:6563-6622',
    'js/content_bridge.js:6675-6681',
    'js/content/block_channel.js:1961-2289',
    'js/content/block_channel.js:2293-2322',
    'js/content/dom_fallback.js:2105-2403',
    'website/components/theme-toggle.js:59-63',
    'website/components/scene-controller.js:79-83'
  ]) {
    assert.ok(doc.includes(proof), `missing source proof ${proof}`);
  }
});

test('current source still has mixed explicit teardown and page-lifetime lifecycle work', () => {
  const seed = source('js/seed.js');
  const injector = source('js/injector.js');
  const bridge = source('js/content_bridge.js');
  const quick = source('js/content/block_channel.js');
  const fallback = source('js/content/dom_fallback.js');

  assert.match(seed, /const originalRemoveEventListener = proto\.removeEventListener/);
  assert.match(seed, /proto\.removeEventListener = function/);

  assert.match(injector, /clearInterval\(engineCheckInterval\)/);

  assert.match(bridge, /function startCardPrefetchObserver\(\)/);
  assert.match(bridge, /new IntersectionObserver/);
  assert.match(bridge, /new MutationObserver/);
  assert.match(bridge, /document\.removeEventListener\('click', playlistFallbackPopoverState\.onDocClick, true\)/);
  assert.match(bridge, /clearInterval\(warmupTimer\)/);

  assert.match(quick, /function setupQuickBlockObserver\(\)/);
  assert.match(quick, /window\.addEventListener\('resize'/);
  assert.match(quick, /window\.addEventListener\('orientationchange'/);
  assert.match(quick, /new MutationObserver/);
  assert.match(quick, /quickBlockSweepTimer = setTimeout/);
  assert.doesNotMatch(quick, /quickBlockPeriodicTimer = window\.setInterval/);

  assert.match(fallback, /window\.addEventListener\('scroll'/);
  assert.match(fallback, /document\.addEventListener\('click'/);
  assert.match(fallback, /document\.addEventListener\('ended'/);
});

test('runtime does not yet contain lifecycle teardown authority symbols', () => {
  const runtimeFiles = [
    'js/seed.js',
    'js/injector.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/bridge_settings.js',
    'js/content/collab_dialog.js'
  ];
  const runtime = runtimeFiles.map(source).join('\n');

  for (const token of [
    'lifecycleTeardownDecision',
    'lifecycleTeardownRegistry',
    'lifecycleOwnerTeardownReport',
    'currentLifecycleTeardownOwnerFlow',
    'routeLifecyclePauseReport',
    'pageLifetimeListenerBudgetReport',
    'teardownNoWorkCounterArtifact',
    'routeLifecycleDisposeAll'
  ]) {
    assert.equal(runtime.includes(token), false, `${token} should not exist in runtime source yet`);
  }
});
