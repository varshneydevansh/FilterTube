import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_P0_COMPILED_RULE_STATE_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

test('compiled rule state audit documents blocked verdict and fixture surface', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'P0 compiled rule state is not green',
    'Seed JSON processing wakes from strict content-filter `enabled === true`',
    'DOM fallback wakes from strict content-filter `enabled === true`',
    'Quick-block lifecycle installs styles, listeners, observer, and a periodic',
    'Fallback 3-dot scanning has native-overlay quiet checks',
    'Background compilation can prefer V4 `blockedKeywords` / `blockedChannels`',
    'compiledRuleState(profile, surface, route, settings)'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('compiled_rule_state_future_token_absent in product source', () => {
  const sourceFiles = [
    'js/seed.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/content_bridge.js',
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/render_engine.js'
  ];
  const combined = sourceFiles.map(read).join('\n');

  assert.doesNotMatch(combined, /\bfunction\s+compiledRuleState\b/);
  assert.doesNotMatch(combined, /\bconst\s+compiledRuleState\b/);
  assert.doesNotMatch(combined, /\bcompiledRuleState\s*=/);
  assert.match(read(auditDocPath), /Product source does not implement `compiledRuleState` today/);
});

test('compiled_rule_state_seed_uses_split_enabled_predicates', () => {
  const seed = read('js/seed.js');
  const helpers = sliceBetween(seed, 'function hasEnabledContentFilters(settings)', 'function shouldCaptureRawSnapshot()');
  const skip = sliceBetween(seed, 'function shouldSkipEngineProcessing', 'const searchActionCollections');

  assert.match(helpers, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(helpers, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(helpers, /settings\.contentFilters\.uppercase\?\.enabled === true/);
  assert.match(helpers, /settings\?\.categoryFilters\?\.enabled\s*===\s*true/);
  assert.match(helpers, /hasList\(settings\.categoryFilters\.selected\)/);
  assert.match(skip, /const activeContentFilters = hasEnabledContentFilters\(cachedSettings\)/);
  assert.match(skip, /const activeJsonFilterRules = hasActiveJsonFilterRules\(cachedSettings\)/);
  assert.doesNotMatch(helpers + skip, /hasValidCategoryRule|hasValidDurationRule|compiledRuleState/);
});

test('compiled_rule_state_dom_fallback_uses_split_enabled_predicates', () => {
  const fallback = read('js/content/dom_fallback.js');
  const active = sliceBetween(fallback, 'function hasActiveDOMFallbackWork(settings)', 'function clearStaleDOMFallbackVisibility()');

  assert.match(active, /if \(listMode === 'whitelist'\) return true/);
  assert.match(active, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(active, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(active, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(active, /categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);
  assert.doesNotMatch(active, /selected\?\.length|selected\.length|hasValidCategoryRule|hasValidDurationRule|compiledRuleState/);
});

test('compiled_rule_state_quick_block_lifecycle_is_outside_action_gate', () => {
  const quickBlock = read('js/content/block_channel.js');
  const gate = sliceBetween(quickBlock, 'const isQuickBlockEnabled = () =>', 'function ensureQuickBlockStyles()');
  const setup = sliceBetween(quickBlock, 'function setupQuickBlockObserver()', '/**\n * Observe dropdowns');

  assert.match(gate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(gate, /currentSettings\.enabled === false/);
  assert.match(gate, /currentSettings\.listMode === 'whitelist'/);
  assert.match(gate, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(gate, /return true/);
  assert.match(setup, /quickBlockObserverStarted = true/);
  assert.match(setup, /ensureQuickBlockStyles\(\)/);
  assert.match(setup, /document\.addEventListener\('focusin'/);
  assert.match(setup, /window\.addEventListener\('resize'/);
  assert.match(setup, /new MutationObserver/);
  assert.doesNotMatch(setup, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(setup, /document\.addEventListener\('yt-navigate-finish'/);
  assert.ok(setup.indexOf('if (!isQuickBlockEnabled())') < setup.indexOf('ensureQuickBlockStyles()'));
});

test('compiled_rule_state_fallback_menu_lacks_shared_action_gate', () => {
  const bridge = read('js/content_bridge.js');
  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons()', 'let playlistFallbackPopoverState = null;');
  const normalMenuGate = sliceBetween(bridge, 'async function injectFilterTubeMenuItem(dropdown, videoCard)', 'const videoCardTagName');

  assert.match(normalMenuGate, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(normalMenuGate, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(fallbackMenu, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.match(fallbackMenu, /new MutationObserver/);
  assert.match(fallbackMenu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenu, /window\.addEventListener\('scroll'/);
  assert.match(fallbackMenu, /setInterval\(\(\) =>/);
  assert.doesNotMatch(fallbackMenu, /showBlockMenuItem|listMode === 'whitelist'|isQuickBlockEnabled|compiledRuleState/);
});

test('compiled_rule_state_background_passes_raw_predicates', () => {
  const background = read('js/background.js');
  const compile = sliceBetween(background, 'const profileContentFilters = (() =>', 'console.log(`FilterTube Background: Compiled');

  assert.match(compile, /compiledSettings\.contentFilters = profileContentFilters \|\| legacyContentFilters \|\|/);
  assert.match(compile, /compiledSettings\.categoryFilters = profileCategoryFilters \|\| legacyCategoryFilters \|\|/);
  assert.match(compile, /duration: \{ enabled: false, minMinutes: 0, maxMinutes: 0, condition: 'between' \}/);
  assert.match(compile, /categoryFilters[\s\S]*selected: \[\]/);
  assert.doesNotMatch(compile, /hasValidCategoryRule|hasValidDurationRule|hasValidUploadDateRule|compiledRuleState/);
});

test('compiled_rule_state_background_main_keywords_prefer_visible_rows', () => {
  const background = read('js/background.js');
  const keywords = sliceBetween(background, 'const v4KeywordEntries = shouldUseKidsProfile', 'const storedProfilesV3');
  const channels = sliceBetween(background, 'const storedChannels = shouldUseKidsProfile', 'let compiledChannels');

  assert.match(keywords, /Array\.isArray\(activeMain\.blockedKeywords\)/);
  assert.match(keywords, /Array\.isArray\(activeMain\.keywords\)/);
  assert.ok(keywords.indexOf('activeMain.keywords') < keywords.indexOf('activeMain.blockedKeywords'));
  assert.match(keywords, /Main profile blocklist keywords are written by the dashboard\/popup under/);
  assert.match(channels, /Array\.isArray\(activeMain\.blockedChannels\)/);
  assert.match(channels, /Array\.isArray\(activeMain\.channels\)/);
  assert.ok(channels.indexOf('activeMain.channels') < channels.indexOf('activeMain.blockedChannels'));
  assert.match(channels, /Main profile blocklist channels are written by the dashboard\/popup under/);
});

test('compiled_rule_state_dependency_keys_are_split', () => {
  const storageAudit = read('docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md');
  const storageP0 = read('docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(storageAudit, /Background Compiler Reads More Than Background Invalidates/);
  assert.match(storageAudit, /StateManager Watches A Different UI Reload List/);
  assert.match(storageP0, /storage_key_background_invalidation_covers_compiler_dependencies/);
  assert.match(storageP0, /storage_key_settings_shared_load_keys_are_classified/);
  assert.doesNotMatch(read(auditDocPath), /P0 compiled rule state is green/);
});
