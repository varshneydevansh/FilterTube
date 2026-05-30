import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const p0DocPath = 'docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md';
const auditDocPath = 'docs/audit/FILTERTUBE_CONTENT_CATEGORY_PREDICATE_AUTHORITY_AUDIT_2026-05-18.md';
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';

const fixtures = [
  'content_predicate_enabled_empty_category_is_inactive',
  'content_predicate_blank_upload_date_is_inactive',
  'content_predicate_zero_duration_longer_is_inactive',
  'content_predicate_blank_duration_save_clears_old_threshold',
  'content_predicate_route_scope_home_does_not_scan_watch_controls',
  'content_predicate_route_scope_watch_does_not_scan_home_feed_controls',
  'content_predicate_category_storage_change_refreshes_runtime',
  'content_predicate_kids_and_main_are_independent',
  'content_predicate_boolean_controls_are_route_scoped',
  'content_predicate_metadata_fetch_requires_valid_pending_reason'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'p0content001',
    title: { runs: [{ text: 'Calm test video' }] },
    shortBylineText: {
      runs: [{
        text: 'Calm Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@calmchannel'
          }
        }
      }]
    },
    ...overrides
  };
}

function runEngine(payload, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, 'p0-content-category-fixture');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('P0 content/category audit documents fixture family and blocked verdict', () => {
  const doc = read(p0DocPath);
  const audit = read(auditDocPath);
  const readiness = read(readinessPath);

  assert.match(doc, /P0 content\/category predicate slice is not green/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /Implementation gate remains closed/);
  assert.match(doc, /contentPredicateAuthority/);
  assert.match(audit, /The main finding is split authority/);

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing P0 doc fixture: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing readiness fixture: ${fixture}`);
  }
});

test('content_predicate_enabled_empty_category_is seed-and-DOM inactive today', () => {
  const input = { contents: [{ videoRenderer: videoRenderer() }] };
  const output = runEngine(input, baseSettings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));
  const seed = read('js/seed.js');
  const fallback = read('js/content/dom_fallback.js');
  const seedPredicate = sliceBetween(seed, 'function hasSelectedCategoryFilters(settings) {', 'function hasNetworkJsonWork(settings) {');
  const fallbackPredicate = sliceBetween(fallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');

  assert.deepEqual(plain(output), plain(input));
  assert.match(seedPredicate, /settings\?\.categoryFilters\?\.enabled === true/);
  assert.match(seedPredicate, /hasList\(settings\.categoryFilters\.selected\)/);
  assert.match(fallbackPredicate, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);
});

test('content_predicate_blank_upload_date_is_inactive is not satisfied before work today', () => {
  const input = { contents: [{ videoRenderer: videoRenderer({ publishedTimeText: { simpleText: '3 days ago' } }) }] };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '', value: '' },
      uppercase: { enabled: false }
    }
  }));
  const seed = read('js/seed.js');
  const fallback = read('js/content/dom_fallback.js');
  const seedPredicate = sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  const fallbackPredicate = sliceBetween(fallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');

  assert.deepEqual(plain(output), plain(input));
  assert.match(seedPredicate, /settings\.contentFilters\.uploadDate\?\.enabled/);
  assert.doesNotMatch(seedPredicate, /fromDate|toDate/);
  assert.match(fallbackPredicate, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.doesNotMatch(fallbackPredicate, /fromDate|toDate/);
});

test('content_predicate_zero_duration_longer_is_inactive is not satisfied today', () => {
  const input = { contents: [{ videoRenderer: videoRenderer({ lengthText: { simpleText: '4:00' } }) }] };
  const output = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));
  const logic = read('js/filter_logic.js');
  const contentDecision = sliceBetween(logic, '_checkContentFilters(item, rules, rendererType) {', '/**\n         * Check if title contains uppercase words');

  assert.deepEqual(plain(output), { contents: [] });
  assert.match(contentDecision, /if \(!Number\.isFinite\(min\)\) min = 0/);
  assert.match(contentDecision, /matches = durationMinutes > min/);
});

test('content_predicate_blank_duration_save_clears_old_threshold is not satisfied by UI save today', () => {
  const tabView = read('js/tab-view.js');
  const mainSave = sliceBetween(tabView, 'function saveVideoFilters(options = {}) {', 'function saveKidsVideoFilters(options = {}) {');
  const kidsSave = sliceBetween(tabView, 'function saveKidsVideoFilters(options = {}) {', 'function applyKidsVideoFiltersToUI');

  for (const block of [mainSave, kidsSave]) {
    assert.match(block, /const nextDuration = \{\s*\.\.\.\(prior\.duration \|\| \{\}\)/);
    assert.match(block, /const parsePositiveFloat = \(value\) =>/);
    assert.match(block, /return Number\.isFinite\(num\) && num > 0 \? num : null/);
    assert.match(block, /if \(val !== null\) \{\s*nextDuration\.minMinutes = val/);
    assert.doesNotMatch(block, /else\s*\{\s*delete nextDuration\.minMinutes/);
    assert.doesNotMatch(block, /nextDuration\.minMinutes = 0;\s*nextDuration\.value = ''/);
  }
});

test('content_predicate_route_scope_home_does_not_scan_watch_controls is not satisfied at top-level DOM gate', () => {
  const fallback = read('js/content/dom_fallback.js');
  const predicate = sliceBetween(fallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  const styles = sliceBetween(fallback, 'if (settings.hideWatchPlaylistPanel) {', 'if (settings.hidePlaylistCards) {');

  assert.match(predicate, /'hideWatchPlaylistPanel'/);
  assert.match(predicate, /'hideVideoSidebar'/);
  assert.match(predicate, /'hideEndscreenVideowall'/);
  assert.match(predicate, /booleanFilterKeys\.some\(key => settings\[key\] === true\)/);
  assert.doesNotMatch(predicate, /location|pathname|routePath|data-filtertube-route-watch/);
  assert.doesNotMatch(styles, /data-filtertube-route-watch/);
});

test('content_predicate_route_scope_watch_does_not_scan_home_feed_controls is not satisfied at top-level DOM gate', () => {
  const fallback = read('js/content/dom_fallback.js');
  const predicate = sliceBetween(fallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  const searchStyles = sliceBetween(fallback, 'if (settings.hideSearchShelves) {', 'style.textContent = rules.join');

  assert.match(predicate, /'hideHomeFeed'/);
  assert.match(predicate, /'hideSearchShelves'/);
  assert.match(predicate, /booleanFilterKeys\.some\(key => settings\[key\] === true\)/);
  assert.doesNotMatch(predicate, /location|pathname|routePath|data-filtertube-route-home/);
  assert.match(searchStyles, /\.ytd-two-column-search-results-renderer ytd-shelf-renderer/);
  assert.doesNotMatch(searchStyles, /data-filtertube-route-watch/);
});

test('content_predicate_category_storage_change_refreshes_runtime is split today', () => {
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const bridge = read('js/content/bridge_settings.js');
  const updateCategory = sliceBetween(stateManager, 'async function updateCategoryFilters(nextCategoryFilters) {', 'async function updateKidsCategoryFilters(nextCategoryFilters) {');
  const updateKidsCategory = sliceBetween(stateManager, 'async function updateKidsCategoryFilters(nextCategoryFilters) {', '// ============================================================================\n    // THEME MANAGEMENT');
  const backgroundKeys = sliceBetween(background, 'const relevantKeys = [', 'let settingsChanged = false;');
  const bridgeKeys = sliceBetween(bridge, 'const relevantKeys = [', 'if (Object.keys(changes).some');

  assert.match(updateCategory, /await requestRefresh\('main'\)/);
  assert.match(updateKidsCategory, /await requestRefresh\('kids'\)/);
  assert.doesNotMatch(backgroundKeys, /'categoryFilters'/);
  assert.doesNotMatch(bridgeKeys, /'categoryFilters'/);
  assert.match(bridgeKeys, /'contentFilters'/);
});

test('content_predicate_kids_and_main_are_independent is source-local but not reported today', () => {
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const mainUpdate = sliceBetween(stateManager, 'async function updateContentFilters(nextContentFilters) {', 'async function updateKidsContentFilters(nextContentFilters) {');
  const kidsUpdate = sliceBetween(stateManager, 'async function updateKidsContentFilters(nextContentFilters) {', 'async function updateCategoryFilters(nextCategoryFilters) {');
  const compileBlock = sliceBetween(background, 'const profileContentFilters = (() => {', 'console.log(`FilterTube Background: Compiled');

  assert.match(mainUpdate, /state\.contentFilters =/);
  assert.match(mainUpdate, /await requestRefresh\('main'\)/);
  assert.match(kidsUpdate, /kids\.contentFilters =/);
  assert.match(kidsUpdate, /await persistKidsProfiles\(state\.kids\)/);
  assert.match(kidsUpdate, /await requestRefresh\('kids'\)/);
  assert.match(compileBlock, /if \(shouldUseKidsProfile\)/);
  assert.match(compileBlock, /profileContentFilters \|\| legacyContentFilters/);
  assert.doesNotMatch(productSource(), /\bcontentPredicateAuthority\b/);
});

test('content_predicate_boolean_controls_are_route_scoped is not centralized today', () => {
  const fallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const predicate = sliceBetween(fallback, 'const booleanFilterKeys = [', 'const contentFilters = settings.contentFilters');
  const compileBooleans = sliceBetween(background, '// Pass through boolean flags', 'const profileContentFilters = (() => {');

  assert.match(predicate, /'hideAllComments'/);
  assert.match(predicate, /'hideAllShorts'/);
  assert.match(predicate, /'hideWatchPlaylistPanel'/);
  assert.match(predicate, /'hideSearchShelves'/);
  assert.doesNotMatch(predicate, /route|pathname|surface/);
  assert.match(compileBooleans, /compiledSettings\.hideVideoSidebar = boolFromV4/);
  assert.match(compileBooleans, /compiledSettings\.hideSearchShelves = boolFromV4/);
  assert.doesNotMatch(compileBooleans, /routeRelevant|contentPredicateAuthority/);
});

test('content_predicate_metadata_fetch_requires_valid_pending_reason is only partially satisfied today', () => {
  const logic = read('js/filter_logic.js');
  const fallback = read('js/content/dom_fallback.js');
  const categoryDecision = sliceBetween(logic, '_checkCategoryFilters(item, rules, rendererType) {', '/**\n         * Extract title with fallback methods');
  const uploadBlock = sliceBetween(fallback, 'let hideByUploadDate = false;', 'let hideReason = `Content: ${title}`;');

  assert.match(categoryDecision, /if \(selected\.length === 0\) return false/);
  assert.match(categoryDecision, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
  assert.match(uploadBlock, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: true \}\)/);
  assert.match(uploadBlock, /parseDateMs\(uploadSettings\.fromDate\) !== null/);
  assert.ok(
    uploadBlock.indexOf('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })') <
      uploadBlock.indexOf("const condition = uploadSettings.condition || 'newer'"),
    'upload-date metadata scheduling is currently before final condition/date validation'
  );
});
