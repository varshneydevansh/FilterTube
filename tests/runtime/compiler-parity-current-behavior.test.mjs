import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPILER_PARITY_CURRENT_BEHAVIOR_2026-05-19.md';

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

test('compiler_parity_doc_lists_current_compiler_authorities', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /compilerParityAuthority/);
  assert.match(doc, /compiledSchemaVersion/);

  for (const fixture of [
    'compiler_parity_shared_compiler_emits_smaller_payload',
    'compiler_parity_background_compiler_derives_profile_mode_and_whitelist',
    'compiler_parity_background_merges_sync_kids_to_main',
    'compiler_parity_background_includes_learned_identity_maps',
    'compiler_parity_read_paths_can_write_profiles',
    'compiler_parity_state_manager_overlays_profile_state_after_shared_load',
    'compiler_parity_state_manager_broadcast_triggers_background_recompile_path'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }
});

test('compiler_parity_shared_compiler_emits_smaller_payload', () => {
  const shared = read('js/settings_shared.js');
  const block = sliceBetween(shared, 'function buildCompiledSettings({', 'function loadSettings()');

  assert.match(block, /filterKeywords: compileKeywords\(sanitizedKeywords\)/);
  assert.match(block, /filterChannels: sanitizedChannels/);
  assert.match(block, /contentFilters: sanitizedContentFilters/);
  assert.match(block, /categoryFilters: sanitizedCategoryFilters/);

  for (const backgroundOnly of [
    'listMode',
    'profileType',
    'whitelistKeywords',
    'whitelistChannels',
    'channelMap',
    'videoChannelMap',
    'videoMetaMap',
    'useExactWordMatching'
  ]) {
    assert.ok(!block.includes(backgroundOnly), `shared compiler should currently omit ${backgroundOnly}`);
  }

  assert.doesNotMatch(block, /compilerParityAuthority|compiledSchemaVersion|compiledSettingsRevision/);
});

test('compiler_parity_background_compiler_derives_profile_mode_and_whitelist', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'function shouldSuppressFirstRunPromptInjectionError'
  );

  assert.match(block, /const shouldUseKidsProfile = targetProfile === 'kids'/);
  assert.match(block, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(block, /compiledSettings\.profileType = targetProfile/);
  assert.match(block, /compiledSettings\.whitelistKeywords = compileKeywordEntries\(rawWhitelistKeywords\)/);
  assert.match(block, /const rawWhitelistChannels = shouldUseKidsProfile/);
  assert.match(block, /compiledSettings\.filterChannels = compiledChannels/);
});

test('compiler_parity_background_merges_sync_kids_to_main', () => {
  const background = read('js/background.js');
  const compiler = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'function shouldSuppressFirstRunPromptInjectionError'
  );
  const block = sliceBetween(
    compiler,
    'const activeSettings = safeObject(activeProfile.settings);',
    'const boolFromV4 = (key, legacyValue) => {'
  );

  assert.match(block, /const syncKidsToMain = !!activeSettings\.syncKidsToMain/);
  assert.match(block, /if \(!syncKidsToMain \|\| mainModeFromV4 !== 'whitelist' \|\| kidsModeFromV4 !== 'whitelist'\) return mainKeywords/);
  assert.match(block, /kidsWhitelistKeywords\.forEach/);
  assert.match(block, /kidsWhitelistChannels\.forEach/);

  const keywordBlock = sliceBetween(
    compiler,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  assert.match(keywordBlock, /if \(!syncKidsToMain \|\| mainModeFromV4 !== 'blocklist' \|\| kidsModeFromV4 !== 'blocklist'\) return mainKeywords/);
  assert.match(keywordBlock, /return \[\.\.\.mainKeywords, \.\.\.kidsBlockedKeywords\]/);
});

test('compiler_parity_background_includes_learned_identity_maps', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    '// Pass through the channel map',
    '// Kids profile keyword compilation'
  );
  const shared = sliceBetween(read('js/settings_shared.js'), 'function buildCompiledSettings({', 'function loadSettings()');

  assert.match(block, /compiledSettings\.channelMap = items\.channelMap \|\| \{\}/);
  assert.match(block, /compiledSettings\.videoChannelMap = compiledVideoChannelMap/);
  assert.match(block, /compiledSettings\.videoMetaMap = items\.videoMetaMap \|\| \{\}/);
  assert.doesNotMatch(shared, /videoChannelMap|videoMetaMap|compiledVideoChannelMap/);
});

test('compiler_parity_read_paths_can_write_profiles', () => {
  const shared = read('js/settings_shared.js');
  const sharedLoad = sliceBetween(shared, 'function loadSettings()', 'function saveSettings(options = {})');
  const background = read('js/background.js');
  const backgroundCompile = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'function shouldSuppressFirstRunPromptInjectionError'
  );

  assert.match(sharedLoad, /STORAGE_NAMESPACE\?\.set\(\{\s*\[FT_PROFILES_V4_KEY\]: nextProfilesV4/);
  assert.match(sharedLoad, /needsWrite/);
  assert.match(backgroundCompile, /storageUpdates\[FT_PROFILES_V4_KEY\] = buildProfilesV4FromLegacyState/);
  assert.match(backgroundCompile, /browserAPI\.storage\.local\.set\(storageUpdates\)/);
  assert.match(backgroundCompile, /browserAPI\.storage\.local\.set\(\{ ftProfilesV4: updatedProfilesV4 \}\)/);
});

test('compiler_parity_state_manager_overlays_profile_state_after_shared_load', () => {
  const state = read('js/state_manager.js');
  const load = sliceBetween(state, 'async function loadSettings(options = {}) {', 'async function addKidsChannel');

  assert.match(load, /const data = await SettingsAPI\.loadSettings\(\)/);
  assert.match(load, /profilesV3 = await io\.loadProfilesV3\(\)/);
  assert.match(load, /profilesV4 = await io\.loadProfilesV4\(\)/);
  assert.match(load, /state\.mode = mainFromV4\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(load, /state\.whitelistChannels = Array\.isArray\(mainFromV4\.whitelistChannels\)/);
  assert.match(load, /state\.channels = Array\.isArray\(mainFromV4\.channels\)/);
  assert.match(load, /state\.kids = \{/);
  assert.match(load, /contentFilters: \(kidsFromV4\.contentFilters/);
});

test('compiler_parity_state_manager_broadcast_triggers_background_recompile_path', () => {
  const state = read('js/state_manager.js');
  const save = sliceBetween(state, 'async function saveSettings({ broadcast = true, profile = \'main\' } = {}) {', 'async function ensureLoaded()');
  const broadcast = sliceBetween(state, 'function broadcastSettings(compiledSettings, profile = \'main\')', 'async function requestRefresh(profile = \'main\')');
  const backgroundApply = sliceBetween(
    read('js/background.js'),
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.match(save, /const result = await SettingsAPI\.saveSettings\(\{/);
  assert.match(save, /if \(broadcast && result\.compiledSettings\) \{/);
  assert.match(save, /broadcastSettings\(result\.compiledSettings, profile\)/);
  assert.match(broadcast, /action: 'FilterTube_ApplySettings'/);
  assert.match(broadcast, /settings: compiledSettings/);
  assert.match(backgroundApply, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(backgroundApply, /settings: compiledSettings/);
  assert.doesNotMatch(backgroundApply, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.doesNotMatch(`${save}\n${broadcast}\n${backgroundApply}`, /compilerParityAuthority|compiledSchemaVersion|getCompiledSettings\(sender/);
});
