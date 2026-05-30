import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('content predicate authority audit documents split activation and decision families', () => {
  const doc = source('docs/audit/FILTERTUBE_CONTENT_CATEGORY_PREDICATE_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Content Predicate Families',
    'Activation Versus Decision',
    'Engine Predicate Behavior',
    'Seed Endpoint Activation',
    'DOM Fallback Predicate Behavior',
    'Settings Transport And Invalidation',
    'contentPredicateAuthority',
    'content_predicate_enabled_empty_category_is_inactive',
    'content_predicate_blank_upload_date_is_inactive',
    'content_predicate_zero_duration_longer_is_inactive'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit phrase: ${phrase}`);
  }

  assert.match(doc, /DOM fallback category activation now require selected categories/);
  assert.match(doc, /Enabled-empty category state no longer wakes seed or DOM fallback category work/);
  assert.doesNotMatch(doc, /can still wake DOM fallback lifecycle work/);
});

test('seed endpoint activation now uses selected-category and enabled-content helpers', () => {
  const text = source('js/seed.js');
  const block = sliceBetween(
    text,
    '    function hasEnabledContentFilters(settings) {',
    '\n\n    function shouldCaptureRawSnapshot'
  );

  assert.match(block, /settings\.contentFilters\.duration\?\.enabled/);
  assert.match(block, /settings\.contentFilters\.uploadDate\?\.enabled/);
  assert.match(block, /settings\.contentFilters\.uppercase\?\.enabled/);
  assert.match(block, /settings\?\.categoryFilters\?\.enabled === true/);
  assert.match(block, /hasList\(settings\.categoryFilters\.selected\)/);
  assert.doesNotMatch(block, /fromDate/);
  assert.doesNotMatch(block, /toDate/);
  assert.doesNotMatch(block, /minMinutes/);
  assert.doesNotMatch(block, /maxMinutes/);
});

test('engine category decision currently validates selected categories after raw settings normalization', () => {
  const text = source('js/filter_logic.js');
  const processSettings = sliceBetween(
    text,
    'const categoryFilterDefaults = {',
    '// Reconstruct RegExp objects from serialized patterns'
  );
  const categoryDecision = sliceBetween(
    text,
    '_checkCategoryFilters(item, rules, rendererType) {',
    '/**\n         * Extract title with fallback methods'
  );

  assert.match(processSettings, /enabled: incomingCategoryFilters\.enabled === true/);
  assert.match(processSettings, /selected: Array\.isArray\(incomingCategoryFilters\.selected\)/);
  assert.match(categoryDecision, /if \(!cf \|\| cf\.enabled !== true\) return false/);
  assert.match(categoryDecision, /if \(selected\.length === 0\) return false/);
  assert.match(categoryDecision, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
});

test('engine duration and upload-date predicates currently validate too late for activation', () => {
  const text = source('js/filter_logic.js');
  const contentDecision = sliceBetween(
    text,
    '_checkContentFilters(item, rules, rendererType) {',
    '/**\n         * Check if title contains uppercase words'
  );

  assert.match(contentDecision, /if \(cf\.duration && cf\.duration\.enabled\)/);
  assert.match(contentDecision, /let min = Number\(/);
  assert.match(contentDecision, /if \(!Number\.isFinite\(min\)\) min = 0/);
  assert.match(contentDecision, /if \(condition === 'longer'\) \{\s*matches = durationMinutes > min/);
  assert.match(contentDecision, /if \(cf\.uploadDate\?\.enabled\)/);
  assert.match(contentDecision, /const cutoffMs = parseDateMs\(cf\.uploadDate\.fromDate\)/);
  assert.match(contentDecision, /if \(cutoffMs !== null\) shouldBlock = publishTimestamp < cutoffMs/);
});

test('DOM fallback top-level and per-card category activation both require selected values', () => {
  const text = source('js/content/dom_fallback.js');
  const topLevel = sliceBetween(
    text,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );
  const categoryCard = sliceBetween(
    text,
    'let hideByCategory = false;',
    'const alreadyProcessed = element.hasAttribute'
  );
  const innerActive = sliceBetween(
    text,
    'const hasEnabledContentFilters = (() => {',
    'const matchesFilters = shouldHideContent'
  );

  assert.match(topLevel, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(topLevel, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(topLevel, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(topLevel, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);
  assert.match(categoryCard, /if \(enabled && selected\.length > 0\) \{/);
  assert.match(innerActive, /cat\?\.enabled && Array\.isArray\(cat\?\.selected\) && cat\.selected\.length > 0/);
  assert.match(innerActive, /cf\.duration\?\.enabled/);
});

test('DOM upload-date path currently schedules metadata before final valid cutoff decision', () => {
  const text = source('js/content/dom_fallback.js');
  const uploadBlock = sliceBetween(
    text,
    'let hideByUploadDate = false;',
    'let hideReason = `Content: ${title}`;'
  );

  assert.match(uploadBlock, /if \(uploadSettings && uploadSettings\.enabled\)/);
  assert.match(uploadBlock, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: true \}\)/);
  assert.match(uploadBlock, /const condition = uploadSettings\.condition \|\| 'newer'/);
  assert.match(uploadBlock, /parseDateMs\(uploadSettings\.fromDate\) !== null/);
  assert.match(uploadBlock, /parseDateMs\(uploadSettings\.toDate\) !== null/);
  assert.ok(
    uploadBlock.indexOf('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })') <
      uploadBlock.indexOf('const condition = uploadSettings.condition ||'),
    'metadata fetch scheduling should currently appear before final condition validation'
  );
});

test('content/category settings transport currently uses duplicated save paths and noncanonical refresh keys', () => {
  const tabView = source('js/tab-view.js');
  const stateManager = source('js/state_manager.js');
  const settingsShared = source('js/settings_shared.js');
  const bridgeSettings = source('js/content/bridge_settings.js');

  const mainSave = sliceBetween(
    tabView,
    'function saveVideoFilters(options = {}) {',
    'function saveKidsVideoFilters(options = {}) {'
  );
  const kidsSave = sliceBetween(
    tabView,
    'function saveKidsVideoFilters(options = {}) {',
    'function applyKidsVideoFiltersToUI'
  );
  const stateUpdates = sliceBetween(
    stateManager,
    'async function updateContentFilters(nextContentFilters) {',
    'async function updateKidsCategoryFilters(nextCategoryFilters) {'
  );
  const settingsKeys = sliceBetween(
    settingsShared,
    'const SETTINGS_KEYS = [',
    'const SETTINGS_CHANGE_KEYS ='
  );
  const bridgeKeys = sliceBetween(
    bridgeSettings,
    'const relevantKeys = [',
    'if (Object.keys(changes).some'
  );

  assert.match(mainSave, /const parsePositiveFloat = \(value\) =>/);
  assert.match(kidsSave, /const parsePositiveFloat = \(value\) =>/);
  assert.match(stateUpdates, /requestRefresh\('main'\)/);
  assert.match(stateUpdates, /requestRefresh\('kids'\)/);
  assert.doesNotMatch(settingsKeys, /'contentFilters'/);
  assert.doesNotMatch(settingsKeys, /'categoryFilters'/);
  assert.match(bridgeKeys, /'contentFilters'/);
  assert.doesNotMatch(bridgeKeys, /'categoryFilters'/);
});
