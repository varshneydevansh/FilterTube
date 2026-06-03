import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md';

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

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    showQuickBlockButton: false,
    showBlockMenuItem: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function assertJsonFirstOwnerBudgetLedger(doc) {
  assert.match(doc, /JSON-First Owner Budget Ledger Addendum - 2026-05-27/);
  assert.match(doc, /records the current JSON-first ownership\s+boundary after the release-lag fixes/);
  assert.match(doc, /JSON transport can now stay idle when\s+blocklist mode has no active JSON\/content\/category work/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /JSON-first owner budget proof slices: 6/);
  assert.match(doc, /JSON-first source proof: PARTIAL/);
  assert.match(doc, /JSON-first promotion authority: NO-GO/);
  assert.match(doc, /JSON-vs-DOM owner authority: NO-GO/);
  assert.match(doc, /unsupported renderer policy authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /JSON owns:/);
  assert.match(doc, /JSON does not yet own:/);
  assert.match(doc, /unsupported renderer policy/);
  assert.match(doc, /all DOM fallback hide\/restore decisions/);
  assert.match(doc, /quick-block and native\/fallback menu explicit actions/);

  for (const row of [
    /\| Seed transport admission \| `js\/seed\.js:220-260`, `js\/seed\.js:383-430`, `js\/seed\.js:1002-1014` \|/,
    /\| Injector transport admission \| `js\/injector\.js:171-188`, `js\/injector\.js:1940-1944`, `js\/injector\.js:3405-3437` \|/,
    /\| JSON renderer owner \| `js\/filter_logic\.js:435-529`, `js\/filter_logic\.js:1721-2261`, `js\/filter_logic\.js:3588-3619` \|/,
    /\| DOM fallback owner \| `js\/content\/dom_fallback\.js:1933-1999`, `js\/content\/dom_fallback\.js:2035-2088`, `js\/content\/dom_fallback\.js:4547-4752` \|/,
    /\| Bridge\/action owner \| `js\/content_bridge\.js:6014-6037`, `js\/content\/block_channel\.js:1205-1222` \|/,
    /\| Release proof owner \| `docs\/audit\/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26\.md` \|/
  ]) {
    assert.match(doc, row);
  }

  const seed = read('js/seed.js');
  assert.match(seed, /function hasNetworkJsonWork\(settings\) \{/);
  assert.match(seed, /if \(!settings \|\| settings\.enabled === false\) return false;/);
  assert.match(seed, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(seed, /if \(!hasNetworkJsonWork\(cachedSettings\)\) \{[\s\S]*passing through without engine processing/);
  assert.match(seed, /pendingDataQueue = \[\];[\s\S]*rawYtInitialData = null;[\s\S]*cleared queued seed data without replay/);

  const injector = read('js/injector.js');
  assert.match(injector, /function hasNetworkJsonWork\(settings\) \{[\s\S]*return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(injector, /if \(!hasNetworkJsonWork\(currentSettings\)\) \{[\s\S]*initialDataQueue = \[\];[\s\S]*return;/);
  assert.match(injector, /No active JSON work for \$\{dataName\}; passing through injector hook/);

  const filterLogic = read('js/filter_logic.js');
  assert.match(filterLogic, /const FILTER_RULES = \{/);
  assert.match(filterLogic, /const listMode = \(this\.settings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(filterLogic, /if \(listMode === 'whitelist' && !isCommentRenderer\) \{/);
  assert.match(filterLogic, /if \(this\.settings\.filterChannels\.length > 0\) \{/);
  assert.match(filterLogic, /this\._harvestChannelData\(data\);[\s\S]*if \(this\.settings\.enabled === false\)/);

  const domFallback = read('js/content/dom_fallback.js');
  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\) \{/);
  assert.match(domFallback, /if \(listMode === 'whitelist'\) return true;/);
  assert.match(domFallback, /if \(!hasActiveFallbackWork && !onlyWhitelistPending\) \{/);
  assert.match(domFallback, /if \(listMode === 'whitelist' && !isCommentContext\) \{/);
  assert.match(domFallback, /if \(settings\.filterChannels && settings\.filterChannels\.length > 0/);

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstOwnerBudgetLedger',
    'jsonFirstSourceOwnerDecision',
    'jsonFirstDomFallbackOwnershipPolicy',
    'jsonFirstUnsupportedRendererPolicy',
    'jsonFirstJsonDomPromotionGate'
  ]) {
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
}

function homePayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'abcdefghijk',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

test('JSON-first no-work optimization crosswalk is audit-only and source-pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior crosswalk with 2026-05-25 SPA drag optimization addendum/);
  assert.match(doc, /Runtime behavior changed for seed no-work transport bypass and quick-block\/fallback-menu lifecycle\s+scheduling/);
  assert.match(doc, /does not open .*implementation gate/);
  assert.match(doc, /JSON-first optimization is not just adding more FILTER_RULES paths/);

  for (const [file, lines, bytes, hash] of [
    ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
    ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
    ['js/content/dom_fallback.js', 5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'],
    ['js/content/block_channel.js', 3189, 127857, 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba']
  ]) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`\`${file}\``), `doc should list ${file}`);
  }

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
    'docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('seed fetch path bypasses body work before no-settings disabled and empty-rule decisions', async () => {
  const noSettingsRuntime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homePayload()
  });

  await noSettingsRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(noSettingsRuntime.calls.processData.length, 0);
  assert.equal(noSettingsRuntime.calls.harvestOnly.length, 0);
  assert.equal(noSettingsRuntime.calls.responseJson.length, 0, 'no-settings endpoint bypasses response JSON parsing');
  assert.equal(noSettingsRuntime.calls.jsonStringify.length, 0, 'no-settings endpoint bypasses response body rebuild');

  const disabledRuntime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homePayload()
  });
  disabledRuntime.window.filterTube.updateSettings(settings({ enabled: false }));

  await disabledRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(disabledRuntime.calls.processData.length, 0);
  assert.equal(disabledRuntime.calls.harvestOnly.length, 0);
  assert.equal(disabledRuntime.calls.responseJson.length, 0, 'disabled endpoint bypasses response JSON parsing');
  assert.equal(disabledRuntime.calls.jsonStringify.length, 0, 'disabled endpoint bypasses response body rebuild');
});

test('current source facts map every optimization candidate to a blocked proof gate', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const bridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const quickBlock = read('js/content/block_channel.js');

  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  assert.match(fetchSetup, /fetchEndpoints = \[/);
  assert.match(fetchSetup, /urlStr\.includes\(endpoint\)/);
  assert.ok(
    fetchSetup.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < fetchSetup.indexOf('response.clone().json()'),
    'fetch path should check the no-work gate before response clone/JSON parsing'
  );
  assert.doesNotMatch(fetchSetup.slice(0, fetchSetup.indexOf('response.clone().json()')), /enabled === false/);

  const skip = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName) {', 'function processWithEngine(data, dataName) {');
  assert.match(skip, /const mode = \(cachedSettings && cachedSettings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(skip, /if \(mode === 'whitelist'\) return false/);
  assert.match(skip, /const isOnHomeFeed = path === '\/' && !isMobileInterface/);
  assert.match(skip, /if \(!isOnHomeFeed\) return false/);

  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  assert.match(xhrSetup, /proto\.addEventListener = function \(type, listener, options\)/);
  assert.match(xhrSetup, /proto\.removeEventListener = function \(type, listener, options\)/);
  assert.match(xhrSetup, /proto\.open = function\(method, url\)/);
  assert.match(xhrSetup, /proto\.send = function\(\)/);
  assert.match(xhrSetup, /urlStr[\s\S]*&& xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)[\s\S]*&& !shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  const xhrSend = sliceBetween(xhrSetup, 'proto.send = function() {', 'return originalSend.apply(this, arguments);');
  const xhrProcessor = sliceBetween(xhrSetup, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');
  assert.match(xhrSend, /originalAddEventListener\.call\(this, 'readystatechange', processIfReady\)/);
  assert.match(xhrSend, /originalAddEventListener\.call\(this, 'load', processIfReady\)/);
  assert.doesNotMatch(xhrSend, /cachedSettings|enabled === false/);
  assert.match(xhrProcessor, /if \(!cachedSettings\) return/);
  assert.match(xhrProcessor, /if \(cachedSettings\.enabled === false\) return/);

  const processData = sliceBetween(filterLogic, "processData(data, dataName = 'unknown') {", '// 2. THEN FILTER');
  assert.ok(processData.indexOf('this._harvestChannelData(data);') < processData.indexOf('if (this.settings.enabled === false)'));
  assert.match(filterLogic, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  const activeDom = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  assert.match(activeDom, /if \(listMode === 'whitelist'\) return true/);
  assert.match(activeDom, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(activeDom, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(activeDom, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(activeDom, /return categoryFilters\?\.enabled === true/);

  const domStartup = sliceBetween(bridge, 'async function initializeDOMFallback(settings)', 'let fallbackMenuButtonsInstalled = false;');
  assert.match(domStartup, /const observer = new MutationObserver/);
  assert.match(domStartup, /schedulePrefetchScan\(\)/);
  assert.match(bridge, /function startCardPrefetchObserver\(\)/);
  assert.match(bridge, /function installPlaylistPanelPrefetchHook\(\)/);
  assert.match(bridge, /function installRightRailWhitelistObserver\(\)/);

  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');
  assert.match(fallbackMenu, /const observer = new MutationObserver/);
  assert.match(fallbackMenu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenu, /document\.addEventListener\('click'/);
  assert.match(fallbackMenu, /window\.addEventListener\('scroll'/);
  assert.match(fallbackMenu, /const warmupTimer = setInterval/);

  const quickBlockSetup = sliceBetween(quickBlock, 'const isQuickBlockEnabled = () => {', 'function setupMenuObserver()');
  assert.match(quickBlockSetup, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(quickBlockSetup, /currentSettings\.listMode === 'whitelist'/);
  assert.match(quickBlockSetup, /function setupQuickBlockObserver\(\)/);
  assert.match(quickBlockSetup, /ensureQuickBlockStyles\(\)/);
  assert.match(quickBlockSetup, /document\.addEventListener\('focusin'/);
  assert.match(quickBlockSetup, /const observer = new MutationObserver/);
  assert.match(quickBlockSetup, /document\.addEventListener\('yt-navigate-finish'/);
  assert.doesNotMatch(quickBlockSetup, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(quickBlock, /setTimeout\(\(\) => \{[\s\S]*setupMenuObserver\(\);[\s\S]*setupQuickBlockObserver\(\);[\s\S]*\}, 1000\)/);

  for (const candidate of [
    'Seed fetch pass-through',
    'Seed XHR pass-through',
    'Engine harvest split',
    'DOM lifecycle gate',
    'Quick-block lifecycle gate',
    'Category metadata fetch gate',
    'Metric artifact gate'
  ]) {
    assert.ok(doc.includes(`| ${candidate} |`), `missing candidate row ${candidate}`);
  }
});

test('JSON-first optimization budget shape keeps no-work and parity proof explicit', () => {
  const doc = read(docPath);

  for (const field of [
    'sourceOwner',
    'route',
    'surface',
    'endpoint',
    'profileType',
    'listMode',
    'ruleState',
    'activeJsonFields',
    'activeDomSelectors',
    'workAllowed',
    'workForbidden',
    'parseBudget',
    'stringifyBudget',
    'processDataBudget',
    'harvestBudget',
    'listenerBudget',
    'observerBudget',
    'timerBudget',
    'networkFetchBudget',
    'storageWriteBudget',
    'hideMutationBudget',
    'restoreBudget',
    'positiveFixture',
    'negativeSiblingFixture',
    'domParityFixture',
    'nativeParityFixture',
    'metricArtifact'
  ]) {
    assert.ok(doc.includes(field), `missing optimization budget field ${field}`);
  }
});

test('runtime source lacks JSON-first no-work optimization authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstNoWorkOptimizationCrosswalk',
    'jsonFirstWorkDecision',
    'jsonFirstSeedPassThroughBudget',
    'jsonFirstXhrPassThroughBudget',
    'jsonFirstHarvestDecision',
    'jsonFirstDomLifecycleBudget',
    'jsonFirstQuickBlockLifecycleBudget',
    'jsonFirstCategoryMetadataBudget',
    'jsonFirstMetricArtifactReport',
    'jsonFirstNoWorkOptimizationBudget',
    'jsonFirstOwnerBudgetLedger',
    'jsonFirstSourceOwnerDecision',
    'jsonFirstDomFallbackOwnershipPolicy',
    'jsonFirstUnsupportedRendererPolicy',
    'jsonFirstJsonDomPromotionGate'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing runtime symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});

test('JSON-first no-work crosswalk links source-locus register as audit-only implementation map', () => {
  const doc = read(docPath);

  assert.match(doc, /Implementation Locus Register Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-implementation-locus-register-current-behavior\.test\.mjs/);
  assert.match(doc, /seed active-rule\/no-work decisions/);
  assert.match(doc, /seed fetch\/XHR transport wrappers/);
  assert.match(doc, /runtime\s+path syntax/);
  assert.match(doc, /hand-authored renderer rules/);
  assert.match(doc, /category metadata fetches/);
  assert.match(doc, /engine\s+harvest-before-disabled behavior/);
  assert.match(doc, /DOM fallback active-work and lifecycle gates/);
  assert.match(doc, /fallback menu lifecycle/);
  assert.match(doc, /quick-block action\/setup split/);
  assert.match(doc, /metric fixture\s+requirements/);
  assert.match(doc, /remains audit-only/);
  assert.match(doc, /implementation boundary closed/);
  assertJsonFirstOwnerBudgetLedger(doc);
});
