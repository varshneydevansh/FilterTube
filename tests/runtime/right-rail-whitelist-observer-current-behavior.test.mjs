import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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

function createRightRailHarness({ pathname = '/results', listMode = 'whitelist', hasApply = true, hasRail = true } = {}) {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function installRightRailWhitelistObserver() {',
    'function queuePrefetchForCard(card) {'
  );
  const timers = [];
  const listeners = new Map();
  const observed = [];
  const rail = {};
  let observerCallback = null;
  const context = {
    currentSettings: { listMode },
    applyCalls: [],
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    MutationObserver: class {
      constructor(callback) {
        observerCallback = callback;
      }

      observe(target, options) {
        observed.push({ target, options });
      }

      disconnect() {
        observed.push({ disconnected: true });
      }
    },
    document: {
      location: { pathname },
      querySelector(selector) {
        context.lastSelector = selector;
        return hasRail ? rail : null;
      },
      addEventListener(type, callback) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(callback);
      }
    }
  };
  if (hasApply) {
    context.applyDOMFallback = (...args) => {
      context.applyCalls.push(args);
    };
  }

  vm.runInNewContext(
    `var rightRailWhitelistObserverInstalled = false;\n${block}\ninstallRightRailWhitelistObserver();`,
    context
  );

  return {
    timers,
    listeners,
    observed,
    applyCalls: context.applyCalls,
    setPathname(value) {
      context.document.location.pathname = value;
    },
    setListMode(value) {
      context.currentSettings.listMode = value;
    },
    triggerMutation() {
      assert.equal(typeof observerCallback, 'function', 'expected mutation observer callback to be installed');
      observerCallback();
    },
    triggerNavigate() {
      for (const callback of listeners.get('yt-navigate-finish') || []) callback();
    },
    runTimer(index) {
      assert.ok(timers[index], `missing timer ${index}`);
      timers[index].callback();
    }
  };
}

const auditDoc = 'docs/audit/FILTERTUBE_RIGHT_RAIL_WHITELIST_OBSERVER_CURRENT_BEHAVIOR_2026-05-19.md';
const liveSmokeDoc = 'docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md';
const liveSmokeTemplate = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
const liveSmokeRunner = 'docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs';

function assertWhitelistObserverBudgetMatrixAddendum() {
  const doc = read(auditDoc);
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');

  assert.match(doc, /Whitelist Observer Budget Matrix Addendum - 2026-05-27/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /whitelist observer budget proof slices: 6/);
  assert.match(doc, /watch\/right-rail whitelist authority: NO-GO/);
  assert.match(doc, /JSON-vs-DOM whitelist owner authority: NO-GO/);
  assert.match(doc, /active whitelist live trace authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  for (const row of [
    /\| JSON transport admission \| `js\/seed\.js:234-238`, `js\/injector\.js:185-188` \|/,
    /\| Identity prefetch admission \| `js\/content_bridge\.js:1006-1015`, `js\/content_bridge\.js:1311-1316` \|/,
    /\| Right-rail observer install \| `js\/content_bridge\.js:1211-1226`, `js\/content_bridge\.js:1286-1301` \|/,
    /\| Whitelist pending timers \| `js\/content_bridge\.js:5992-6040` \|/,
    /\| DOM fallback active predicate \| `js\/content\/dom_fallback\.js:1933-1938`, `js\/content\/dom_fallback\.js:2039-2076`, `js\/content\/dom_fallback\.js:4595-4604` \|/,
    /\| Quick\/menu quiet gates \| `js\/content\/block_channel\.js:1209-1229`, `js\/content\/block_channel\.js:2895-2897`, `js\/content_bridge\.js:10517-10498` \|/
  ]) {
    assert.match(doc, row);
  }

  assert.match(seed, /function hasNetworkJsonWork\(settings\) \{\s*if \(!settings \|\| settings\.enabled === false\) return false;\s*if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(injector, /function hasNetworkJsonWork\(settings\) \{\s*if \(!settings \|\| settings\.enabled === false\) return false;\s*if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(bridge, /function needsIdentityPrefetchWork\(settings\) \{[\s\S]*if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(bridge, /function installRightRailWhitelistObserver\(\) \{\s*if \(currentSettings\?\.listMode !== 'whitelist'\) return;/);
  assert.match(bridge, /if \(\(document\.location\?\.pathname \|\| ''\)\.startsWith\('\/watch'\)\) return;/);
  assert.match(bridge, /const whitelistPendingRefreshState = \{[\s\S]*pendingHideCandidates: \[\][\s\S]*\};/);
  assert.match(bridge, /if \(path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)\) return;/);
  assert.match(fallback, /function hasActiveDOMFallbackWork\(settings\) \{[\s\S]*if \(listMode === 'whitelist'\) return true;/);
  assert.match(fallback, /if \(listMode === 'whitelist' && !isCommentContext\) \{/);
  assert.match(blockChannel, /currentSettings\.listMode === 'whitelist'[\s\S]*return false;/);
  assert.match(blockChannel, /if \(isWhitelistModeActive\(\)\) \{[\s\S]*cleanupInjectedMenuItems\(dropdown\);[\s\S]*return;/);
}

test('right-rail whitelist observer audit documents watch-route ambiguity and coalesced timer fix', () => {
  assertWhitelistObserverBudgetMatrixAddendum();

  const doc = read(auditDoc);

  for (const phrase of [
    'current-behavior audit proof with a narrow runtime hot-path fix',
    'installRightRailWhitelistObserver()',
    'returns immediately when pathname starts /watch',
    'coalesces one immediate and one follow-up forced applyDOMFallback() pass',
    'right-rail duplicate forced refresh fanout: reduced',
    'watch/right-rail shaped',
    'current-gap',
    'watch/right-rail authority',
    'Runtime behavior changed only for duplicate timer fanout',
    'executable timer harness'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit phrase: ${phrase}`);
  }
});

test('release live YouTube SPA smoke remains a separate missing release gate', () => {
  const rightRailDoc = read(auditDoc);
  const smokeDoc = read(liveSmokeDoc);
  const template = JSON.parse(read(liveSmokeTemplate));
  const runner = read(liveSmokeRunner);
  const artifactDir = path.join(repoRoot, 'docs/audit/artifacts/release-live-youtube-spa-smoke');

  assert.ok(rightRailDoc.includes(liveSmokeDoc), 'right rail audit should cite live smoke boundary');
  assert.match(smokeDoc, /Status: audit-only release boundary/);
  assert.match(smokeDoc, /Runtime behavior is unchanged/);
  assert.match(smokeDoc, /live YouTube SPA smoke status: missing/);
  assert.match(smokeDoc, /live smoke evidence template: docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json/);
  assert.match(smokeDoc, /live smoke runner contract rows: 12/);
  assert.match(smokeDoc, /runner\/template source anchors covered: 60/);
  assert.match(smokeDoc, /executed live smoke result artifacts committed: 0/);
  assert.match(smokeDoc, /release readiness from this slice: NO-GO until live smoke is recorded/);
  assert.match(smokeDoc, /release readiness from runner contract: NO-GO/);
  assert.match(smokeDoc, /runner installed-byte-parity release gate: NO-GO/);
  assert.match(smokeDoc, /runner automated-lane-evidence release gate: NO-GO/);
  assert.match(smokeDoc, /runtime right-rail timer coalescing proof: automated/);
  assert.match(smokeDoc, /runtime learned-map duplicate DOM-work proof: automated/);
  assert.match(smokeDoc, /live YouTube SPA smoke complete: NO/);
  assert.match(smokeDoc, /release package ready because runtime tests pass: NO/);
  assert.match(smokeDoc, /public performance claim ready: NO/);
  assert.match(smokeDoc, /Required Live Smoke Matrix/);
  assert.match(smokeDoc, /Executable Runner Contract/);
  assert.match(smokeDoc, /runner output accepted as release proof now: NO-GO/);
  assert.match(smokeDoc, /runner smoke-slice readiness can pass without release readiness: yes/);
  assert.match(smokeDoc, /runner release readiness without installed byte parity: NO-GO/);
  assert.match(smokeDoc, /runner release readiness without automated lane evidence: NO-GO/);
  assert.match(smokeDoc, /template accepted as release proof now: NO-GO/);
  assert.match(smokeDoc, /Installed Chrome CDP Preflight - 2026-05-31/);
  assert.match(smokeDoc, /installed Chrome CDP preflight status: unavailable on 2026-05-31/);
  assert.match(smokeDoc, /installed Chrome CDP preflight rows: 4/);
  assert.match(smokeDoc, /CDP endpoint status: unavailable/);
  assert.match(smokeDoc, /installed Chrome CDP preflight accepted as live smoke proof: NO-GO/);
  assert.match(smokeDoc, /CDP base \+ target list/);
  assert.match(smokeDoc, /flowchart TD/);
  assert.match(smokeDoc, /Still not broad release authority without installed-byte parity, automated lane evidence, and route-mode packets/);
  assert.match(smokeDoc, /Connected Chrome Tab Inventory Recheck - 2026-05-31/);
  assert.match(smokeDoc, /connected Chrome inventory endpoint reachable: yes/);
  assert.match(smokeDoc, /connected open top-level tabs observed: 45/);
  assert.match(smokeDoc, /connected relevant YouTube\/FilterTube tabs observed: 0/);
  assert.match(smokeDoc, /tab claimed or mutated by connector recheck: no/);
  assert.match(smokeDoc, /raw tab titles or URLs committed: no/);
  assert.match(smokeDoc, /live smoke runner executed after connector recheck: no/);
  assert.match(smokeDoc, /installed-byte parity artifact written: no/);
  assert.match(smokeDoc, /production console runtime sample collected: no/);
  assert.match(smokeDoc, /release readiness from connector recheck: NO-GO/);

  for (const row of [
    'FT-LIVE-SPA-00-home-to-search',
    'FT-LIVE-SPA-01-search-to-channel',
    'FT-LIVE-SPA-02-channel-to-watch',
    'FT-LIVE-SPA-03-watch-to-home',
    'FT-LIVE-SPA-04-watch-rail-scroll',
    'FT-LIVE-SPA-05-cache-repeat-navigation'
  ]) {
    assert.ok(smokeDoc.includes(row), `missing live smoke row ${row}`);
  }

  for (const row of [
    'FT-LIVE-CONNECTOR-00-communication',
    'FT-LIVE-CONNECTOR-01-target-absence',
    'FT-LIVE-CONNECTOR-02-no-mutation',
    'FT-LIVE-CONNECTOR-03-byte-parity-gap',
    'FT-LIVE-CONNECTOR-04-console-gap'
  ]) {
    assert.ok(smokeDoc.includes(row), `missing live connector row ${row}`);
  }

  for (const row of [
    'FT-LIVE-RUNNER-00-cdp-binding',
    'FT-LIVE-RUNNER-01-extension-source-binding',
    'FT-LIVE-RUNNER-02-storage-whitelist-setup',
    'FT-LIVE-RUNNER-03-extension-context-selection',
    'FT-LIVE-RUNNER-04-page-snapshot-counters',
    'FT-LIVE-RUNNER-05-route-row-execution',
    'FT-LIVE-RUNNER-06-console-issue-classification',
    'FT-LIVE-RUNNER-07-screenshot-artifacts',
    'FT-LIVE-RUNNER-08-output-artifact-schema',
    'FT-LIVE-RUNNER-09-installed-byte-parity-gate',
    'FT-LIVE-RUNNER-10-template-non-evidence-guard',
    'FT-LIVE-RUNNER-11-automated-lane-evidence-gate'
  ]) {
    assert.ok(smokeDoc.includes(row), `missing live smoke runner row ${row}`);
  }

  for (const needle of [
    "const cdpBase = process.env.FILTERTUBE_CDP_BASE || 'http://127.0.0.1:9222'",
    'const extensionPath = process.env.FILTERTUBE_EXTENSION_PATH || repoRoot',
    "name: 'Google Developers'",
    "id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw'",
    "mode: 'whitelist'",
    'async function setStorageThroughAvailableExtensionContext',
    "target.url.startsWith('chrome-extension://')",
    'function extensionContexts(events)',
    'function getPageSnapshot(client)',
    'seedReady: !!window.ftSeedInitialized',
    'filterTubeMainWorld: !!window.filterTube',
    "hiddenByFilterTube: q('[data-filtertube-hidden],.filtertube-hidden,.filtertube-hidden-shelf')",
    "whitelistPending: q('[data-filtertube-whitelist-pending=\"true\"]')",
    "stampedVideoIds: q('[data-filtertube-video-id]')",
    "stampedChannelIds: q('[data-filtertube-channel-id]')",
    "playerPresent: !!document.querySelector('#movie_player, ytd-player')",
    'async function runStep',
    'function hasNoSevereConsoleIssues(events)',
    'function buildInstalledByteParity',
    'function sourceHashSnapshot',
    'function buildChangeContext',
    'sha256FileIfPresent',
    "packet_id: 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes'",
    'const smokeSliceReadiness = allRowsPassed && consoleIssues.length === 0 ?',
    'const changeContext = buildChangeContext()',
    "releaseReadiness: smokeSliceReadiness === 'GO-FOR-THIS-SMOKE-SLICE' && installedByteParity.verdict === 'GO' && changeContextReady ? 'GO-FOR-RELEASE-SMOKE' : 'NO-GO'",
    'installedByteParityMustPass: true',
    'automatedLaneEvidenceMustPass: true',
    'automatedLaneEvidenceMustCoverRequiredLanes: true',
    "releaseReadinessWhenByteParityMissing: 'NO-GO'",
    "releaseReadinessWhenAutomatedLaneEvidenceMissing: 'NO-GO'",
    'observedStallOrNoStall: rows.map',
    'observedFalseHideLeakResult: allRowsPassed',
    'fs.writeFileSync(artifactPath',
    'smokeSliceReadiness: artifact.smokeSliceReadiness',
    'installedByteParity: artifact.installedByteParity.verdict',
    'rowStatuses: rows.map(row => [row.id, row.status])'
  ]) {
    assert.ok(runner.includes(needle), `missing runner source needle ${needle}`);
  }

  assert.equal(template.artifactType, 'filtertube-release-live-youtube-spa-smoke');
  assert.equal(template.schemaVersion, 3);
  assert.equal(template.status, 'template-not-executed');
  assert.equal(template.smokeSliceReadiness, 'NO-GO');
  assert.equal(template.releaseReadiness, 'NO-GO');
  assert.equal(template.runtimeBehaviorChanged, false);
  assert.deepEqual(template.changeContext.requiredLanes, []);
  assert.deepEqual(template.changeContext.automatedLaneEvidence, []);
  assert.equal(template.boundaryDoc, liveSmokeDoc);
  assert.equal(template.installedByteParity.packet_id, 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes');
  assert.equal(template.installedByteParity.verdict, 'NO-GO');
  assert.ok(template.installedByteParity.missing_fields.includes('content_script_marker_or_hash'));
  assert.ok(template.installedByteParity.missing_fields.includes('extension_reload_timestamp'));
  assert.deepEqual(
    template.requiredRows.map((row) => row.id),
    [
      'FT-LIVE-SPA-00-home-to-search',
      'FT-LIVE-SPA-01-search-to-channel',
      'FT-LIVE-SPA-02-channel-to-watch',
      'FT-LIVE-SPA-03-watch-to-home',
      'FT-LIVE-SPA-04-watch-rail-scroll',
      'FT-LIVE-SPA-05-cache-repeat-navigation'
    ]
  );
  assert.deepEqual([...new Set(template.requiredRows.map((row) => row.status))], ['missing']);
  assert.equal(template.completionRules.allRecordingFieldsRequired, true);
  assert.equal(template.completionRules.allRowsMustPass, true);
  assert.equal(template.completionRules.consoleErrorsMustBeClassified, true);
  assert.equal(template.completionRules.installedByteParityMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustCoverRequiredLanes, true);
  assert.equal(template.completionRules.releaseReadinessWhenTemplate, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenByteParityMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAutomatedLaneEvidenceMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAnyRowMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAnyRowFailed, 'NO-GO');

  for (const field of [
    'browser name/version',
    'extension build/source path',
    'profile/list-mode settings',
    'whitelist entries used',
    'route sequence',
    'observed stall or no-stall',
    'observed false-hide/leak result',
    'console error summary',
    'manual timestamp',
    'tester initials'
  ]) {
    assert.ok(smokeDoc.includes(field), `missing live smoke recording field ${field}`);
  }

  for (const field of [
    'browserNameVersion',
    'extensionBuildSourcePath',
    'profileListModeSettings',
    'whitelistEntriesUsed',
    'routeSequence',
    'observedStallOrNoStall',
    'observedFalseHideLeakResult',
    'consoleErrorSummary',
    'manualTimestamp',
    'testerInitials'
  ]) {
    assert.ok(Object.prototype.hasOwnProperty.call(template.recordingFields, field), `missing template field ${field}`);
  }

  const committedResultArtifacts = fs.readdirSync(artifactDir)
    .filter((entry) => entry.endsWith('.json') && entry !== 'template.json');
  assert.deepEqual(committedResultArtifacts, []);
});

test('initializeDOMFallback currently installs the right-rail observer after fallback startup', () => {
  const source = read('js/content_bridge.js');
  const initializer = sliceBetween(
    source,
    'async function initializeDOMFallback(settings) {',
    'let fallbackMenuButtonsInstalled = false;'
  );

  assert.match(initializer, /applyDOMFallback\(settings\)/);
  assert.match(initializer, /ensureFallbackMenuButtons\(\)/);
  assert.match(initializer, /refreshDOMFallbackMutationObserver\(\)/);
  assert.match(initializer, /refreshFilterTubeRuntimeObservers\(\)/);
});

test('right-rail observer attaches to watch rail selectors but its scheduler skips watch routes', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function installRightRailWhitelistObserver() {',
    'function queuePrefetchForCard(card) {'
  );
  const scheduler = sliceBetween(
    block,
    'const scheduleWhitelistRefresh = () => {',
    'const observer = new MutationObserver'
  );
  const attach = sliceBetween(
    block,
    'const attach = () => {',
    'if (!attach()) {'
  );

  assert.match(attach, /'#related, #secondary, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary'/);
  assert.match(attach, /observer\.observe\(rail, \{ childList: true, subtree: true \}\)/);
  assert.match(scheduler, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.match(scheduler, /\(document\.location\?\.pathname \|\| ''\)\.startsWith\('\/watch'\)/);
});

test('forced whitelist reprocess is coalesced and delayed passes recheck route', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function installRightRailWhitelistObserver() {',
    'function queuePrefetchForCard(card) {'
  );
  const runner = sliceBetween(
    block,
    'const runWhitelistRefreshPass = () => {',
    'const scheduleWhitelistRefresh = () => {'
  );
  const scheduler = sliceBetween(
    block,
    'const scheduleWhitelistRefresh = () => {',
    'const observer = new MutationObserver'
  );

  const watchSkipIndex = scheduler.indexOf("startsWith('/watch')");
  assert.ok(watchSkipIndex > -1, 'expected watch skip in scheduler');
  assert.match(runner, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.match(runner, /\(document\.location\?\.pathname \|\| ''\)\.startsWith\('\/watch'\)/);
  assert.match(runner, /applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\)/);
  assert.match(scheduler, /if \(!whitelistRefreshImmediateTimer\)/);
  assert.match(scheduler, /whitelistRefreshImmediateTimer = setTimeout\(\(\) => \{/);
  assert.match(scheduler, /\}, 0\);/);
  assert.match(scheduler, /if \(!whitelistRefreshFollowupTimer\)/);
  assert.match(scheduler, /whitelistRefreshFollowupTimer = setTimeout\(\(\) => \{/);
  assert.match(scheduler, /\}, 120\);/);
  assert.equal(
    (scheduler.match(/runWhitelistRefreshPass\(\)/g) || []).length,
    2
  );
  assert.equal(
    (block.match(/applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\)/g) || []).length,
    1
  );

  const runtime = createRightRailHarness({ pathname: '/results' });
  assert.equal(runtime.observed.length, 1);
  assert.equal(runtime.timers.length, 0);
  runtime.triggerMutation();
  runtime.triggerMutation();
  runtime.triggerMutation();
  assert.deepEqual(runtime.timers.map((timer) => timer.delay), [0, 120]);
  assert.equal(runtime.applyCalls.length, 0);
  runtime.setPathname('/watch');
  runtime.runTimer(0);
  runtime.runTimer(1);
  assert.equal(runtime.applyCalls.length, 0, 'stale delayed passes should skip after SPA navigation to /watch');

  const whitelistRuntime = createRightRailHarness({ pathname: '/results' });
  whitelistRuntime.triggerMutation();
  whitelistRuntime.runTimer(0);
  whitelistRuntime.runTimer(1);
  assert.equal(whitelistRuntime.applyCalls.length, 2);
  assert.equal(whitelistRuntime.applyCalls[0][0], null);
  assert.equal(whitelistRuntime.applyCalls[0][1].preserveScroll, true);
  assert.equal(whitelistRuntime.applyCalls[0][1].forceReprocess, true);

  const blocklistRuntime = createRightRailHarness({ pathname: '/results', listMode: 'blocklist' });
  assert.equal(blocklistRuntime.observed.length, 0);
  assert.equal(blocklistRuntime.timers.length, 0);
});

test('right-rail mutation and navigation callbacks reuse the same watch-skipping scheduler', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function installRightRailWhitelistObserver() {',
    'function queuePrefetchForCard(card) {'
  );

  assert.match(block, /const observer = new MutationObserver\(\(\) => \{\s*scheduleWhitelistRefresh\(\);\s*\}\)/);
  assert.match(block, /document\.addEventListener\('yt-navigate-finish', \(\) => \{/);
  assert.match(block, /attach\(\);\s*scheduleWhitelistRefresh\(\);/);
  assert.match(block, /document\.addEventListener\('yt-navigate-finish', \(\) => \{\s*scheduleWhitelistRefresh\(\);\s*\}\)/);
});

test('watch right-rail whitelist authority is still not centralized in product source', () => {
  const combined = [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/background.js',
    'js/settings_shared.js'
  ].map(read).join('\n');

  assert.doesNotMatch(
    combined,
    /rightRailWhitelistAuthority|watchRailWhitelistAuthority|watchSurfaceControlAuthority|compiledRuleState/
  );
});

test('existing readiness docs still classify watch rail proof as partial rather than solved', () => {
  const p0Watch = read('docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  assert.match(p0Watch, /watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible/);
  assert.match(p0Watch, /only partially guarded|no unified whitelist-safe watch report/);
  assert.match(convergence, /watch rail false-hides|watch rail gaps|watch rail false-hides/i);
  assert.match(ledger, /watch rails.*need|watch rails.*still need|watch rail gaps/i);
});
