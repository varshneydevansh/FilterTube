import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const centralLedgerPaths = [
  'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
];
const jsonNoWorkReadinessDocs = [
  docPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md',
  'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md',
  'docs/audit/FILTERTUBE_MAIN_GUIDE_ENDPOINT_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md',
  'docs/audit/FILTERTUBE_ENDPOINT_AUTHORITY_INVENTORY_2026-05-17.md'
];

const sourceFingerprints = [
  ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  ['js/content/dom_fallback.js', 5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'],
  ['js/content/block_channel.js', 3189, 127857, 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba'],
  ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d']
];

const endpoints = [
  '/youtubei/v1/search',
  '/youtubei/v1/guide',
  '/youtubei/v1/browse',
  '/youtubei/v1/next',
  '/youtubei/v1/player'
];

const domBooleanKeys = [
  'hideAllComments',
  'hideAllShorts',
  'hideShorts',
  'hideComments',
  'filterComments',
  'hideHomeFeed',
  'hideSponsoredCards',
  'hideWatchPlaylistPanel',
  'hidePlaylistCards',
  'hideMembersOnly',
  'hideMixPlaylists',
  'hideVideoSidebar',
  'hideRecommended',
  'hideLiveChat',
  'hideVideoInfo',
  'hideVideoButtonsBar',
  'hideAskButton',
  'hideVideoChannelRow',
  'hideVideoDescription',
  'hideMerchTicketsOffers',
  'hideEndscreenVideowall',
  'hideEndscreenCards',
  'hideTopHeader',
  'hideNotificationBell',
  'hideExploreTrending',
  'hideMoreFromYouTube',
  'hideSubscriptions',
  'hideSearchShelves'
];

const seedContentFilterBranches = ['duration.enabled', 'uploadDate.enabled', 'uppercase.enabled'];
const seedJsonActiveRuleBranches = [
  'filterKeywords',
  'filterChannels',
  'filterKeywordsComments',
  'hideAllComments',
  'hideAllShorts',
  'categoryFilters.selected'
];
const seedSkipRouteClasses = ['search-results', 'channel-page', 'desktop-home-browse'];
const processWorkClasses = ['missing-settings-queue', 'disabled-pass-through', 'harvest-only', 'processData-filter'];
const quickBlockActionGateBranches = ['enabled-not-false', 'showQuickBlockButton', 'listMode-not-whitelist'];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineOf(source, needle) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.notEqual(index, -1, `missing source needle ${needle}`);
  return index + 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function normalizedCodeBlock(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function parseArrayItems(block) {
  const out = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').trim().replace(/,$/, '').trim();
    if (!line) continue;
    const quoted = /^['"]([^'"]+)['"]$/.exec(line);
    if (quoted) out.push(quoted[1]);
  }
  return out;
}

function arrayFromSource(source, startNeedle, endNeedle) {
  return parseArrayItems(sliceBetween(source, startNeedle, endNeedle));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first active work predicate register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior register with 2026-05-25 SPA drag optimization addendum/);
  assert.match(text, /Runtime behavior changed only for quick-block and fallback-menu lifecycle\s+scheduling/);
  assert.match(text, /source files with active-work predicates: 5/);
  assert.match(text, /current predicate anchors: 11/);
  assert.match(text, /runtime behavior changed: yes; quick-block periodic sweep removed and fallback-menu mutation repair scoped/);
  assert.match(text, /not completion proof for JSON-first work authority/);
  assert.match(text, /first-class JSON filter behavior/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceFingerprints) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count changed`);
    assert.equal(sha256(file), expectedHash, `${file} hash changed`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('JSON-first no-work and endpoint readiness docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5827',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5827',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of jsonNoWorkReadinessDocs) {
    const text = read(auditDoc);

    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5827',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5827',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'JSON-first promotion',
      'optimization',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('JSON-first active work predicate rows remain source-derived', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');

  const fetchEndpointSet = arrayFromSource(
    seed,
    'const fetchEndpoints = [',
    '];\n\n        const getPathname'
  );
  const xhrEndpointSet = arrayFromSource(
    seed,
    'const xhrEndpoints = [',
    '];\n\n            const proto'
  );
  const domBooleanSet = arrayFromSource(
    domFallback,
    'const booleanFilterKeys = [',
    '];\n        if (booleanFilterKeys.some'
  );

  assert.deepEqual(fetchEndpointSet, endpoints);
  assert.deepEqual(xhrEndpointSet, endpoints);
  assert.deepEqual(domBooleanSet, domBooleanKeys);

  assert.match(text, /endpoint interceptor key sets: 2/);
  assert.match(text, /interceptor endpoint entries per set: 5/);
  assert.match(text, /seed content-filter active branches: 3/);
  assert.match(text, /seed JSON active-rule branches: 6/);
  assert.match(text, /seed skip route classes: 3/);
  assert.match(text, /processWithEngine work classes: 4/);
  assert.match(text, /DOM fallback active trigger total: 36/);
  assert.match(text, /DOM fallback boolean keys: 28/);
  assert.match(text, /fallback menu warmup scans: 8/);
  assert.match(text, /fallback menu warmup interval ms: 1500/);
  assert.match(text, /quick-block setup delay ms: 1000/);
  assert.match(text, /quick-block periodic timer ms: none/);

  assert.ok(text.includes(`fetchEndpoints(5): ${endpoints.join(',')}`));
  assert.ok(text.includes(`xhrEndpoints(5): ${endpoints.join(',')}`));
  assert.ok(text.includes(`seedContentFilterBranches(3): ${seedContentFilterBranches.join(',')}`));
  assert.ok(text.includes(`seedJsonActiveRuleBranches(6): ${seedJsonActiveRuleBranches.join(',')}`));
  assert.ok(text.includes(`seedSkipRouteClasses(3): ${seedSkipRouteClasses.join(',')}`));
  assert.ok(text.includes(`processWithEngineWorkClasses(4): ${processWorkClasses.join(',')}`));
  assert.ok(text.includes('categoryFilters.selected'));
  assert.doesNotMatch(text, /domFallbackActiveTriggers\(36\):[^\n]+categoryFilters\.enabled/);
  assert.ok(text.includes(`domFallbackBooleanKeys(28): ${domBooleanKeys.join(',')}`));
  assert.ok(text.includes(`quickBlockActionGateBranches(${quickBlockActionGateBranches.length}): ${quickBlockActionGateBranches.join(',')}`));
});

test('JSON-first active work source anchors and predicate mismatches remain pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const quickBlock = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');

  const anchors = [
    ['js/seed.js', 'function shouldSkipEngineProcessing(data, dataName) {', 263, seed],
    ['js/seed.js', 'function processWithEngine(data, dataName) {', 383, seed],
    ['js/seed.js', 'function setupFetchInterception() {', 666, seed],
    ['js/seed.js', 'function setupXhrInterception() {', 757, seed],
    ['js/filter_logic.js', "processData(data, dataName = 'unknown') {", 3588, filterLogic],
    ['js/content/dom_fallback.js', 'function hasActiveDOMFallbackWork(settings) {', 2117, domFallback],
    ['js/content/dom_fallback.js', 'if (!categoryRaw && videoId && typeof scheduleVideoMetaFetch ===', 2669, domFallback],
    ['js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 6150, bridge],
    ['js/content_bridge.js', 'function ensureFallbackMenuButtons() {', 6554, bridge],
    ['js/content/block_channel.js', 'const isQuickBlockEnabled = () => {', 1212, quickBlock],
    ['js/content/block_channel.js', 'function setupQuickBlockObserver() {', 1993, quickBlock]
  ];

  for (const [file, needle, expectedLine, source] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `${file} anchor moved: ${needle}`);
    assert.ok(text.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
  }
  assert.ok(text.includes('`js/content/block_channel.js:3185`'), 'doc should cite fixed quick-block startup timer');

  const helperBlock = sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function shouldCaptureRawSnapshot() {');
  for (const token of [
    'settings.contentFilters.duration?.enabled',
    'settings.contentFilters.uploadDate?.enabled',
    'settings.contentFilters.uppercase?.enabled',
    'hasList(settings.filterKeywords)',
    'hasList(settings.filterChannels)',
    'hasList(settings.filterKeywordsComments)',
    'settings.hideAllComments === true',
    'settings.hideAllShorts === true',
    'settings?.categoryFilters?.enabled === true',
    'hasList(settings.categoryFilters.selected)'
  ]) {
    assert.ok(helperBlock.includes(token), `missing seed helper token ${token}`);
  }

  const skip = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName) {', 'function processWithEngine(data, dataName) {');
  for (const token of [
    'const activeContentFilters = hasEnabledContentFilters(cachedSettings)',
    'const activeJsonFilterRules = hasActiveJsonFilterRules(cachedSettings)',
    'if (isSearchResultsPath)',
    'if (isChannelPath)',
    "path === '/' && !isMobileInterface"
  ]) {
    assert.ok(skip.includes(token), `missing seed skip token ${token}`);
  }

  const processWithEngine = sliceBetween(seed, 'function processWithEngine(data, dataName) {', '/**\n     * Basic fallback processing');
  assert.match(processWithEngine, /if \(!cachedSettings\)/);
  assert.match(processWithEngine, /if \(cachedSettings\.enabled === false\)/);
  assert.match(processWithEngine, /FilterTubeEngine\.harvestOnly/);
  assert.match(processWithEngine, /FilterTubeEngine\.processData/);

  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  assert.ok(
    fetchSetup.indexOf('if (shouldBypassYouTubeiNetworkResponse(dataName))') <
      fetchSetup.indexOf('response.clone().json()'),
    'fetch should check active JSON work before cloning/parsing'
  );
  assert.match(fetchSetup, /response\.clone\(\)\.json\(\)/);
  assert.match(fetchSetup, /JSON\.stringify\(processed\)/);

  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  assert.match(xhrSetup, /proto\.open = function/);
  assert.match(xhrSetup, /proto\.send = function/);
  assert.match(xhrSetup, /proto\.addEventListener = function/);
  assert.ok(
    xhrSetup.indexOf('if (shouldBypassYouTubeiNetworkResponse(dataName))') <
      xhrSetup.indexOf('JSON.parse(trimmed)'),
    'XHR should check active JSON work before parsing response text'
  );
  assert.match(xhrSetup, /JSON\.parse\(trimmed\)/);
  assert.match(xhrSetup, /JSON\.stringify\(processed\)/);

  const processData = sliceBetween(filterLogic, "processData(data, dataName = 'unknown') {", '// 2. THEN FILTER');
  assert.ok(processData.indexOf('this._harvestChannelData(data);') < processData.indexOf('if (this.settings.enabled === false)'));

  const activeDom = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  assert.match(activeDom, /if \(listMode === 'whitelist'\) return true/);
  assert.match(activeDom, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);
  const categoryBranch = sliceBetween(domFallback, 'let hideByCategory = false;', 'if (categoryRaw) {');
  assert.match(categoryBranch, /if \(enabled && selected\.length > 0\)/);
  assert.match(categoryBranch, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  const initDom = sliceBetween(bridge, 'async function initializeDOMFallback(settings) {', 'let fallbackMenuButtonsInstalled = false;');
  assert.match(initDom, /setTimeout\(resolve, 1000\)/);
  assert.match(initDom, /applyDOMFallback\(settings\)/);
  assert.match(initDom, /ensureFallbackMenuButtons\(\)/);
  assert.match(initDom, /new MutationObserver/);

  const menu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');
  assert.match(menu, /new MutationObserver/);
  assert.match(menu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(menu, /window\.addEventListener\('scroll'/);
  assert.match(menu, /const warmupTimer = setInterval/);
  assert.match(menu, /if \(warmupScans >= 8\)/);
  assert.match(menu, /\}, 1500\)/);
  assert.match(bridge, /if \(currentSettings\?\.showBlockMenuItem === false\)/);

  const quickBlockGate = sliceBetween(quickBlock, 'const isQuickBlockEnabled = () => {', 'function ensureQuickBlockStyles() {');
  assert.match(quickBlockGate, /currentSettings\.enabled === false/);
  assert.match(quickBlockGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(quickBlockGate, /currentSettings\.listMode === 'whitelist'/);
  const quickBlockObserver = sliceBetween(quickBlock, 'function setupQuickBlockObserver() {', 'function setupMenuObserver()');
  const quickEntryGuard = quickBlockObserver.indexOf('if (!isQuickBlockEnabled()) return false;');
  assert.notEqual(quickEntryGuard, -1, 'quick-block observer should have a setup entry guard');
  assert.ok(quickEntryGuard < quickBlockObserver.indexOf('ensureQuickBlockStyles();'));
  assert.match(quickBlockObserver, /ensureQuickBlockStyles\(\)/);
  assert.match(quickBlockObserver, /document\.addEventListener\('focusin'/);
  assert.match(quickBlockObserver, /new MutationObserver/);
  assert.match(quickBlockObserver, /document\.addEventListener\('yt-navigate-finish'/);
  assert.doesNotMatch(quickBlockObserver, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.doesNotMatch(quickBlockObserver, /\}, 1800\)/);
  assert.match(quickBlock, /setTimeout\(\(\) => \{[\s\S]*setupMenuObserver\(\);[\s\S]*setupQuickBlockObserver\(\);[\s\S]*\}, 1000\)/);

  for (const phrase of [
    'Seed fetch interception now checks `shouldBypassYouTubeiNetworkResponse()` before response clone parsing',
    'Seed XHR interception can still mark endpoint-like requests, but active-work bypass runs before response JSON parse',
    '`hasActiveJsonFilterRules()` requires selected category values before category JSON work is active',
    '`hasActiveDOMFallbackWork()` now requires selected category values before',
    'whitelist mode as active work',
    'harvests channel data before its disabled',
    'Fallback menu lifecycle work is installed separately from the later',
    '`isQuickBlockEnabled()` includes the global enabled flag and gates action insertion',
    '`setupQuickBlockObserver()` starts from a fixed timer but now exits before style/listener/observer setup when quick-block is disabled'
  ]) {
    assert.ok(text.includes(phrase), `missing mismatch phrase ${phrase}`);
  }

  assert.match(text, /Active-Work Predicate Drift Addendum - 2026-05-27/);
  assert.match(text, /post-lag-fix drift between\s+active-work predicates/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /active-work predicate drift proof slices: 7/);
  assert.match(text, /active-work predicate source proof: PARTIAL/);
  assert.match(text, /shared active-work authority: NO-GO/);
  assert.match(text, /predicate merge optimization authority: NO-GO/);
  assert.match(text, /JSON-first active-work promotion authority: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.match(text, /the predicates are intentionally not equivalent today/);
  assert.match(text, /Seed\/Injector\/Bridge Predicate Parity Addendum - 2026-05-27/);
  assert.match(text, /seed\/injector\/bridge predicate parity rows: 7/);
  assert.match(text, /shared JSON rule branch names: 6/);
  assert.match(text, /content-filter enabled strictness mismatch rows: 0/);
  assert.match(text, /seed malformed truthy content-filter JSON admission: no-work/);
  assert.match(text, /whitelist-active JSON predicate families: 3/);
  assert.match(text, /identity-prefetch non-JSON branch: present/);
  assert.match(text, /DOM fallback separate active-work predicate: present/);
  assert.match(text, /shared predicate authority: NO-GO/);
  assert.match(text, /JSON-first predicate merge optimization authority: NO-GO/);
  assert.match(text, /runtime behavior changed by parity addendum: yes; seed content-filter admission is now strict boolean/);
  assert.match(text, /Work-Class Decision Linkage - 2026-05-30/);
  assert.match(text, /a boolean "active work" answer is not enough/);
  assert.match(text, /JSON-first work-class rows: 8/);
  assert.match(text, /passive body parsing authority: PARTIAL/);
  assert.match(text, /queued replay authority: PARTIAL/);
  assert.match(text, /identity prefetch authority: PARTIAL/);
  assert.match(text, /DOM scan\/stale cleanup authority: PARTIAL/);
  assert.match(text, /quick\/menu action affordance authority: PARTIAL/);
  assert.match(text, /shared work-class decision authority: NO-GO/);
  assert.match(text, /JSON-first first-class promotion from work-class linkage: NO-GO/);
  assert.match(text, /runtime behavior changed by this continuation: no/);
  assert.match(text, /jsonFirstWorkClassDecisionReport/);
  assert.match(text, /flowchart TD/);

  for (const row of [
    'passive_json_body_parsing',
    'queued_initial_data_replay',
    'main_world_runtime_injection',
    'identity_prefetch_observer',
    'filter_logic_harvest',
    'filter_logic_mutation',
    'dom_fallback_scan_cleanup',
    'quick_menu_user_action_affordance'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing work-class row ${row}`);
  }

  for (const row of [
    /\| Seed JSON active work \| `js\/seed\.js:202-238`, `js\/seed\.js:253-260`, `js\/seed\.js:383-430` \|/,
    /\| Injector JSON active work \| `js\/injector\.js:153-188`, `js\/injector\.js:1940-1944`, `js\/injector\.js:3405-3437` \|/,
    /\| Bridge MAIN-world and identity work \| `js\/content_bridge\.js:1013-1067`, `js\/content_bridge\.js:1069-1080` \|/,
    /\| DOM fallback lifecycle work \| `js\/content\/dom_fallback\.js:2117-2184`, `js\/content\/dom_fallback\.js:2185-2218`, `js\/content_bridge\.js:6420-6429` \|/,
    /\| Quick-block action and rule context \| `js\/content\/block_channel\.js:1212-1296`, `js\/content\/block_channel\.js:1993-2042` \|/,
    /\| Native\/fallback menu action gate \| `js\/content_bridge\.js:10738-10750` \|/,
    /\| Filter engine mutation gate \| `js\/filter_logic\.js:1957-2261`, `js\/filter_logic\.js:3588-3619` \|/
  ]) {
    assert.match(text, row);
  }

  assert.equal(lineOf(injector, 'function hasNetworkJsonWork(settings) {'), 185);
  assert.equal(lineOf(injector, 'if (!hasNetworkJsonWork(currentSettings)) {'), 1940);
  assert.equal(lineOf(injector, 'function processDataWithFilterLogic(data, dataName) {'), 3405);
  assert.equal(lineOf(bridge, 'function needsMainWorldRuntimeWork(settings) {'), 1057);
  assert.equal(lineOf(bridge, 'async function ensureMainWorldRuntimeForSettings(settings) {'), 1069);
  assert.equal(lineOf(bridge, 'function hasActiveFallbackLifecycleWork() {'), 6420);
  assert.equal(lineOf(bridge, 'async function injectFilterTubeMenuItem(dropdown, videoCard) {'), 10738);
  assert.equal(lineOf(quickBlock, 'function hasActiveQuickBlockRuleContext(settings) {'), 1231);

  const injectorActive = sliceBetween(injector, 'function hasEnabledContentFilters(settings) {', 'const HANDLE_TERMINATOR_REGEX');
  assert.match(injectorActive, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(injectorActive, /settings\?\.categoryFilters\?\.enabled === true/);
  assert.match(injectorActive, /if \(settings\.listMode === 'whitelist'\) return true;/);

  const bridgeWork = sliceBetween(bridge, 'function needsIdentityPrefetchWork(settings) {', 'async function ensureMainWorldRuntimeForSettings(settings) {');
  assert.match(bridgeWork, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(bridgeWork, /return bridgeHasList\(settings\.filterChannels\);/);
  assert.match(bridgeWork, /function needsMainWorldRuntimeWork\(settings\) \{/);
  assert.match(bridgeWork, /return hasBridgeEnabledContentFilters\(settings\) \|\| hasBridgeActiveJsonFilterRules\(settings\);/);

  const ruleContext = sliceBetween(quickBlock, 'function hasActiveQuickBlockRuleContext(settings) {', 'function ensureQuickBlockStyles() {');
  assert.match(ruleContext, /if \(settings\.listMode === 'whitelist'\) return false;/);
  assert.match(ruleContext, /hasList\(settings\.filterKeywords\)/);
  assert.match(ruleContext, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);

  const seedContentFilter = sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  assert.match(seedContentFilter, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(seedContentFilter, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(seedContentFilter, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const injectorContentFilter = sliceBetween(injector, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  assert.match(injectorContentFilter, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(injectorContentFilter, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(injectorContentFilter, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const bridgeContentFilter = sliceBetween(bridge, 'function hasBridgeEnabledContentFilters(settings) {', 'function hasBridgeSelectedCategoryFilters(settings) {');
  assert.match(bridgeContentFilter, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(bridgeContentFilter, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(bridgeContentFilter, /settings\.contentFilters\.uppercase\?\.enabled === true/);

  const bridgeIdentity = sliceBetween(bridge, 'function needsIdentityPrefetchWork(settings) {', 'function hasBridgeEnabledContentFilters(settings) {');
  assert.match(bridgeIdentity, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(bridgeIdentity, /return bridgeHasList\(settings\.filterChannels\);/);

  for (const row of [
    'json_predicate_seed_content_strict',
    'json_predicate_injector_content_strict',
    'json_predicate_bridge_content_strict',
    'json_predicate_shared_rule_fields',
    'json_predicate_whitelist_always_active',
    'json_predicate_identity_prefetch_extra',
    'json_predicate_dom_fallback_not_json'
  ]) {
    assert.ok(text.includes(row), `missing predicate parity row ${row}`);
  }

  for (const ledgerPath of centralLedgerPaths) {
    const ledger = read(ledgerPath);
    assert.ok(
      ledger.includes('2026-05-27 JSON-first seed/injector/bridge predicate parity continuation') ||
        ledger.includes('2026-05-28 JSON-first seed/injector/bridge predicate parity continuation'),
      `${ledgerPath} should cite predicate parity continuation`
    );
    assert.ok(ledger.includes(docPath), `${ledgerPath} should cite ${docPath}`);
  }
});

test('seed/injector network JSON work predicate parity addendum remains source-derived', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');

  const seedActiveRules = normalizedCodeBlock(sliceBetween(
    seed,
    'function hasActiveJsonFilterRules(settings) {',
    'function hasNetworkJsonWork(settings) {'
  ));
  const injectorActiveRules = normalizedCodeBlock(sliceBetween(
    injector,
    'function hasActiveJsonFilterRules(settings) {',
    'function hasNetworkJsonWork(settings) {'
  ));
  const seedNetworkWork = normalizedCodeBlock(sliceBetween(
    seed,
    'function hasNetworkJsonWork(settings) {',
    'function shouldCaptureRawSnapshot() {'
  ));
  const injectorNetworkWork = normalizedCodeBlock(sliceBetween(
    injector,
    'function hasNetworkJsonWork(settings) {',
    'const HANDLE_TERMINATOR_REGEX'
  ));

  assert.equal(seedActiveRules, injectorActiveRules, 'seed and injector active JSON rule predicates drifted');
  assert.equal(seedNetworkWork, injectorNetworkWork, 'seed and injector network JSON work predicates drifted');

  for (const token of [
    'hasList(settings.filterKeywords)',
    'hasList(settings.filterChannels)',
    'hasList(settings.filterKeywordsComments)',
    'settings.hideAllComments === true',
    'settings.hideAllShorts === true',
    'hasSelectedCategoryFilters(settings)'
  ]) {
    assert.ok(seedActiveRules.includes(token), `missing mirrored active-rule branch ${token}`);
  }

  for (const token of [
    'if (!settings || settings.enabled === false) return false;',
    "if (settings.listMode === 'whitelist') return true;",
    'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);'
  ]) {
    assert.ok(seedNetworkWork.includes(token), `missing mirrored network-work branch ${token}`);
  }

  assert.equal(lineOf(seed, 'function hasActiveJsonFilterRules(settings) {'), 220);
  assert.equal(lineOf(seed, 'function hasNetworkJsonWork(settings) {'), 234);
  assert.equal(lineOf(seed, 'function shouldCaptureRawSnapshot() {'), 240);
  assert.equal(lineOf(seed, 'function shouldBypassYouTubeiNetworkResponse(dataName) {'), 253);
  assert.equal(lineOf(seed, 'function shouldSkipEngineProcessing(data, dataName) {'), 263);
  assert.equal(lineOf(seed, 'function processWithEngine(data, dataName) {'), 383);
  assert.equal(lineOf(seed, 'function updateSettings(newSettings) {'), 983);
  assert.equal(lineOf(injector, 'function hasActiveJsonFilterRules(settings) {'), 171);
  assert.equal(lineOf(injector, 'function hasNetworkJsonWork(settings) {'), 185);
  assert.equal(lineOf(injector, 'if (!hasNetworkJsonWork(currentSettings)) {'), 1940);
  assert.equal(lineOf(injector, 'function processDataWithFilterLogic(data, dataName) {'), 3405);
  assert.equal(lineOf(injector, 'function processInitialDataQueue() {'), 3427);
  assert.doesNotMatch(injector, /function shouldSkipEngineProcessing\(data, dataName\)/);

  for (const pin of [
    '`js/seed.js:220-232`',
    '`js/injector.js:171-183`',
    '`js/seed.js:234-238`',
    '`js/injector.js:185-189`',
    '`js/seed.js:240`',
    '`js/seed.js:253`',
    '`js/seed.js:383`',
    '`js/seed.js:983`',
    '`js/injector.js:1940`',
    '`js/injector.js:3405`',
    '`js/injector.js:3427`',
    '`js/seed.js:263-360`'
  ]) {
    assert.ok(text.includes(pin), `missing parity source pin ${pin}`);
  }

  for (const row of [
    'seed_active_json_rules',
    'injector_active_json_rules',
    'seed_network_json_work',
    'injector_network_json_work',
    'seed_no_work_consumers',
    'injector_no_work_consumers',
    'seed_only_route_skip'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing seed/injector parity row ${row}`);
  }

  for (const token of [
    'Seed/Injector Network Predicate Parity Addendum - 2026-05-30',
    'seed/injector network predicate source files covered: 2',
    'seed/injector active-rule predicate blocks compared: 2',
    'seed/injector network-work predicate blocks compared: 2',
    'mirrored active-rule branches: 6',
    'mirrored network-work branches: 3',
    'network no-work consumer rows covered: 7',
    'seed-only route skip classes outside parity: 3',
    'seed/injector network predicate parity source proof: PARTIAL',
    'shared seed/injector network predicate authority: NO-GO',
    'promote seed/injector predicate parity to shared authority now: NO-GO',
    'approve JSON-first first-class filtering from predicate parity now: NO-GO',
    'runtime behavior changed by seed/injector network predicate parity addendum: no',
    'agreement is not authority'
  ]) {
    assert.ok(text.includes(token), `missing seed/injector parity token ${token}`);
  }
});

test('JSON-first active work predicate register records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const field of [
    'sourceOwner',
    'predicateOwner',
    'endpoint',
    'route',
    'surface',
    'profileType',
    'listMode',
    'extensionEnabled',
    'jsonRuleState',
    'domRuleState',
    'contentFilterState',
    'categorySelectedState',
    'whitelistState',
    'quickBlockState',
    'menuActionState',
    'settingsRevision',
    'workAllowed',
    'workForbidden',
    'parseAllowed',
    'stringifyAllowed',
    'harvestAllowed',
    'mutationAllowed',
    'domScanAllowed',
    'menuRepairAllowed',
    'quickBlockLifecycleAllowed',
    'metadataFetchAllowed',
    'listenerAllowed',
    'observerAllowed',
    'timerAllowed',
    'positiveFixture',
    'negativeFixture',
    'siblingVisibleFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstActiveWorkPredicateAuthority',
    'jsonFirstActiveRulePredicateReport',
    'jsonFirstNoWorkDecisionMatrix',
    'jsonFirstEndpointActiveRuleDecision',
    'jsonFirstDomActiveWorkPredicate',
    'jsonFirstQuickBlockLifecyclePredicate',
    'jsonFirstFallbackMenuLifecyclePredicate',
    'jsonFirstCategorySelectedDecision',
    'jsonFirstDisabledModeWorkBudget',
    'jsonFirstActiveWorkFixtureProvenance',
    'jsonFirstSharedActiveWorkAuthority',
    'jsonFirstPredicateDriftReport',
    'jsonFirstPredicateMergeOptimizationGate',
    'jsonFirstBridgeIdentityWorkDecision',
    'jsonFirstActionVsPassiveWorkMatrix',
    'jsonFirstWorkClassDecisionReport',
    'jsonFirstSeedInjectorNetworkPredicateParityReport',
    'jsonFirstSharedNetworkJsonWorkPredicate',
    'jsonFirstNetworkPredicateParityPromotionGate'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
