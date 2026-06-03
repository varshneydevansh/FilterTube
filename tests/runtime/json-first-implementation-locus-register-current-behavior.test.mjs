import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md';

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

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first implementation locus register is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only source-locus register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, or permission/);
  assert.match(doc, /optimization work is being mapped to exact source loci before any code changes/);

  for (const [file, lines, bytes, hash] of [
    ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
    ['js/content_bridge.js', 13623, 603362, 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c'],
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
    'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing related proof layer ${artifact}`);
  }
});

test('JSON-first implementation locus register line anchors match current source', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const bridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const quickBlock = read('js/content/block_channel.js');

  const anchors = [
    ['js/seed.js', 'function shouldSkipEngineProcessing(data, dataName) {', 263, seed, true],
    ['js/seed.js', 'function processWithEngine(data, dataName) {', 383, seed, true],
    ['js/seed.js', 'function setupFetchInterception() {', 666, seed, true],
    ['js/seed.js', 'return response.clone().json().then(jsonData => {', 701, seed, false],
    ['js/seed.js', 'function setupXhrInterception() {', 757, seed, true],
    ['js/seed.js', 'proto.addEventListener = function (type, listener, options) {', 899, seed, false],
    ['js/seed.js', 'proto.open = function(method, url) {', 924, seed, false],
    ['js/seed.js', 'proto.send = function() {', 940, seed, false],
    ['js/filter_logic.js', 'function getByPath(obj, path, defaultValue = undefined) {', 163, filterLogic, true],
    ['js/filter_logic.js', 'const FILTER_RULES = {', 435, filterLogic, true],
    ['js/filter_logic.js', '_checkCategoryFilters(item, rules, rendererType) {', 2263, filterLogic, true],
    ['js/filter_logic.js', "processData(data, dataName = 'unknown') {", 3588, filterLogic, true],
    ['js/content_bridge.js', 'function scheduleVideoMetaFetch(videoId, options = null) {', 1785, bridge, true],
    ['js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 6140, bridge, true],
    ['js/content_bridge.js', 'function ensureFallbackMenuButtons() {', 6541, bridge, true],
    ['js/content/dom_fallback.js', 'function hasActiveDOMFallbackWork(settings) {', 2117, domFallback, true],
    ['js/content/dom_fallback.js', 'if (!categoryRaw && videoId && typeof scheduleVideoMetaFetch ===', 2669, domFallback, true],
    ['js/content/block_channel.js', 'const isQuickBlockEnabled = () => {', 1212, quickBlock, true],
    ['js/content/block_channel.js', 'function setupQuickBlockObserver() {', 1993, quickBlock, true],
    ['js/content/block_channel.js', '// Initialize menu observer after a delay', 3185, quickBlock, false]
  ];

  for (const [file, needle, expectedLine, source, requireDocCitation] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `${file} anchor moved: ${needle}`);
    if (requireDocCitation) {
      assert.ok(doc.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
    }
  }
  assert.ok(doc.includes('`js/content/block_channel.js:3185`'), 'doc should cite fixed quick-block startup timer');
});

test('JSON-first implementation loci preserve current behavior risks', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const bridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const quickBlock = read('js/content/block_channel.js');

  const skip = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName) {', 'function processWithEngine(data, dataName) {');
  assert.match(skip, /const mode = \(cachedSettings && cachedSettings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(skip, /const activeContentFilters = hasEnabledContentFilters\(cachedSettings\)/);
  assert.match(skip, /const activeJsonFilterRules = hasActiveJsonFilterRules\(cachedSettings\)/);
  assert.match(skip, /if \(mode === 'whitelist'\) return false/);

  const processWithEngine = sliceBetween(seed, 'function processWithEngine(data, dataName) {', '/**\n     * Basic fallback processing');
  assert.match(processWithEngine, /if \(!cachedSettings\)/);
  assert.match(processWithEngine, /if \(cachedSettings\.enabled === false\)/);
  assert.match(processWithEngine, /FilterTubeEngine\.harvestOnly/);
  assert.match(processWithEngine, /FilterTubeEngine\.processData/);

  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  assert.match(fetchSetup, /'\/youtubei\/v1\/search'/);
  assert.match(fetchSetup, /'\/youtubei\/v1\/guide'/);
  assert.match(fetchSetup, /'\/youtubei\/v1\/browse'/);
  assert.match(fetchSetup, /'\/youtubei\/v1\/next'/);
  assert.match(fetchSetup, /'\/youtubei\/v1\/player'/);
  assert.match(fetchSetup, /response\.clone\(\)\.json\(\)/);
  assert.match(fetchSetup, /JSON\.stringify\(processed\)/);

  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  assert.match(xhrSetup, /proto\.addEventListener = function/);
  assert.match(xhrSetup, /proto\.removeEventListener = function/);
  assert.match(xhrSetup, /proto\.open = function/);
  assert.match(xhrSetup, /proto\.send = function/);
  assert.match(xhrSetup, /xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(xhrSetup, /JSON\.parse\(trimmed\)/);
  assert.match(xhrSetup, /JSON\.stringify\(processed\)/);

  const getByPath = sliceBetween(filterLogic, 'function getByPath(obj, path, defaultValue = undefined) {', 'function flattenText');
  assert.match(getByPath, /path\.split\('\.'\)/);
  assert.match(filterLogic, /const FILTER_RULES = \{/);

  const category = sliceBetween(filterLogic, '_checkCategoryFilters(item, rules, rendererType) {', '_checkContentFilters(item, rules, rendererType) {');
  assert.match(category, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  const processData = sliceBetween(filterLogic, "processData(data, dataName = 'unknown') {", '// 2. THEN FILTER');
  assert.ok(processData.indexOf('this._harvestChannelData(data);') < processData.indexOf('if (this.settings.enabled === false)'));

  const metaFetch = sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', 'function processWatchMetaFetchQueue() {');
  assert.match(metaFetch, /needDuration/);
  assert.match(metaFetch, /needDates/);
  assert.match(metaFetch, /needCategory/);
  assert.match(metaFetch, /watchMetaFetchQueue/);

  const initDom = sliceBetween(bridge, 'async function initializeDOMFallback(settings) {', 'let fallbackMenuButtonsInstalled = false;');
  assert.match(initDom, /setTimeout\(resolve, 1000\)/);
  assert.match(initDom, /applyDOMFallback\(settings\)/);
  assert.match(initDom, /ensureFallbackMenuButtons\(\)/);
  assert.match(initDom, /new MutationObserver/);

  const activeDom = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  assert.match(activeDom, /if \(listMode === 'whitelist'\) return true/);
  assert.match(activeDom, /booleanFilterKeys/);
  assert.match(activeDom, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(activeDom, /return categoryFilters\?\.enabled === true/);
  assert.match(domFallback, /pendingCategoryMeta = true/);

  const menu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');
  assert.match(menu, /document\.createElement\('style'\)/);
  assert.match(menu, /new MutationObserver/);
  assert.match(menu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(menu, /window\.addEventListener\('scroll'/);

  const quickBlockGate = sliceBetween(quickBlock, 'const isQuickBlockEnabled = () => {', 'function ensureQuickBlockStyles() {');
  assert.match(quickBlockGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(quickBlockGate, /currentSettings\.listMode === 'whitelist'/);
  const quickBlockObserver = sliceBetween(quickBlock, 'function setupQuickBlockObserver() {', 'function setupMenuObserver()');
  assert.match(quickBlockObserver, /ensureQuickBlockStyles\(\)/);
  assert.match(quickBlockObserver, /document\.addEventListener\('focusin'/);
  assert.match(quickBlockObserver, /new MutationObserver/);
  assert.doesNotMatch(quickBlockObserver, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(quickBlockObserver, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(quickBlock, /setTimeout\(\(\) => \{[\s\S]*setupMenuObserver\(\);[\s\S]*setupQuickBlockObserver\(\);[\s\S]*\}, 1000\)/);

  for (const token of [
    'Endpoint pass-through, XHR wrapper work, engine harvest',
    'category metadata',
    'DOM fallback lifecycle',
    'fallback menu lifecycle, quick-block lifecycle',
    'A first-class JSON filter contract must describe work allowed',
    'forbidden, not only the JSON path string'
  ]) {
    assert.ok(doc.includes(token), `missing risk summary token ${token}`);
  }
});

test('JSON-first implementation locus contract keeps future proof fields explicit', () => {
  const doc = read(docPath);

  for (const field of [
    'sourceLocus',
    'sourceOwner',
    'endpoint',
    'route',
    'surface',
    'profileType',
    'listMode',
    'activeJsonFields',
    'activeDomControls',
    'currentWorkClass',
    'allowedFutureWork',
    'forbiddenFutureWork',
    'parseBudget',
    'stringifyBudget',
    'harvestBudget',
    'listenerBudget',
    'observerBudget',
    'timerBudget',
    'networkBudget',
    'storageBudget',
    'hideBudget',
    'restoreBudget',
    'positiveFixture',
    'negativeSiblingFixture',
    'domParityFixture',
    'nativeParityFixture',
    'metricArtifact',
    'rollbackPlan'
  ]) {
    assert.ok(doc.includes(field), `missing future contract field ${field}`);
  }
});

test('runtime source lacks JSON-first implementation locus authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstImplementationLocusRegister',
    'jsonFirstSourceLocusDecision',
    'jsonFirstEndpointDecision',
    'jsonFirstActiveRuleReport',
    'jsonFirstRendererRuleManifest',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstWorkDecision',
    'jsonFirstTransportBudget',
    'jsonFirstHarvestMutationBudget',
    'jsonFirstMetadataFetchBudget',
    'jsonFirstDomActiveWorkReport',
    'jsonFirstDomLifecycleBudget',
    'jsonFirstDomCategoryParityReport',
    'jsonFirstMenuLifecycleBudget',
    'jsonFirstQuickBlockLifecycleBudget',
    'jsonFirstMetricFixtureReport'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});
