import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md';

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

function quotedStrings(text) {
  return Array.from(text.matchAll(/['"]([^'"\n]+)['"]/g), match => match[1]);
}

function keyArrayFromBlock(text, startNeedle, endNeedle) {
  return quotedStrings(sliceBetween(text, startNeedle, endNeedle));
}

function assertIncludesAll(keys, expected, label) {
  for (const key of expected) {
    assert.ok(keys.includes(key), `${label} should include ${key}`);
  }
}

function assertOmitsAll(keys, expected, label) {
  for (const key of expected) {
    assert.ok(!keys.includes(key), `${label} should currently omit ${key}`);
  }
}

const storageP0Fixtures = [
  'storage_key_background_invalidation_covers_compiler_dependencies',
  'storage_key_content_bridge_map_only_refresh_policy_is_named',
  'storage_key_state_manager_reload_keys_match_ui_claims',
  'storage_key_settings_shared_load_keys_are_classified',
  'storage_key_video_channel_map_change_has_cache_and_dom_policy',
  'storage_key_video_meta_map_change_has_cache_and_dom_policy',
  'storage_key_stats_by_surface_change_refreshes_dashboard',
  'storage_key_channel_map_only_change_does_not_force_dom_reprocess',
  'storage_key_read_path_write_reports_migration_revision',
  'storage_key_import_nanah_profile_write_reports_target_profile_revision',
  'storage_key_unknown_key_is_ignored_with_no_runtime_reprocess',
  'storage_key_raw_capture_evidence_never_becomes_storage_authority'
];

test('P0 storage/cache audit documents fixture family and current blocked verdict', () => {
  const doc = read(auditDocPath);
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of storageP0Fixtures) {
    assert.ok(doc.includes(fixture), `missing storage fixture in audit doc: ${fixture}`);
    assert.ok(gate.includes(fixture), `missing storage fixture in readiness gate: ${fixture}`);
  }

  assert.match(p0Register, /\| storage\/cache key authority \| 12 \|/);
  for (const phrase of [
    'P0 storage/cache slice is not green',
    'Current behavior is proof-pinned',
    'Runtime behavior remains unchanged',
    'Implementation gate remains closed',
    'storageKeyAuthority.report'
  ]) {
    assert.ok(doc.includes(phrase), `missing storage verdict phrase: ${phrase}`);
  }
});

test('storage_key_background_invalidation_covers_compiler_dependencies is not satisfied', () => {
  const background = read('js/background.js');
  const compilerBlock = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    '], (items) => {'
  );
  const listenerBlock = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {'
  );
  const compilerKeys = quotedStrings(compilerBlock);
  const listenerKeys = keyArrayFromBlock(
    listenerBlock,
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );

  assertIncludesAll(compilerKeys, [
    'enabled',
    'contentFilters',
    'useExactWordMatching',
    'filterChannelsAdditionalKeywords',
    'videoChannelMap',
    'videoMetaMap',
    'hideEndscreenVideowall',
    'disableAnnotations',
    'ftProfilesV3'
  ], 'background compiler keys');
  assertOmitsAll(listenerKeys, [
    'enabled',
    'categoryFilters',
    'useExactWordMatching',
    'filterChannelsAdditionalKeywords',
    'videoChannelMap',
    'videoMetaMap',
    'showQuickBlockButton',
    'showBlockMenuItem',
    'hideEndscreenVideowall',
    'disableAnnotations'
  ], 'background invalidation keys');
});

test('storage_key_content_bridge_map_only_refresh_policy_is_named is local-only today', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  const productSource = [bridgeSettings, background, stateManager].join('\n');
  const block = sliceBetween(
    bridgeSettings,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );

  assert.match(block, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(block, /return;/);
  assert.match(block, /const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(block, /const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(block, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);
  assert.doesNotMatch(productSource, /\bstorageKeyAuthority\b/);
});

test('storage_key_state_manager_reload_keys_match_ui_claims is not satisfied', () => {
  const stateManager = read('js/state_manager.js');
  const block = sliceBetween(
    stateManager,
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'const hasSettingsChange = storageKeys.some(key => changes[key]);'
  );
  const keys = keyArrayFromBlock(block, 'const storageKeys = [', '];');

  assertIncludesAll(keys, ['enabled', 'filterKeywords', 'filterChannels', 'stats', 'channelMap', 'ftProfilesV4'], 'StateManager reload keys');
  assertOmitsAll(keys, [
    'contentFilters',
    'categoryFilters',
    'videoChannelMap',
    'videoMetaMap',
    'useExactWordMatching',
    'filterChannelsAdditionalKeywords',
    'statsBySurface'
  ], 'StateManager reload keys');
});

test('storage_key_settings_shared_load_keys_are_classified is not satisfied', () => {
  const settingsShared = read('js/settings_shared.js');
  const loadBlock = sliceBetween(
    settingsShared,
    'function loadSettings()',
    'function saveSettings(options = {})'
  );
  const productSource = [
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/settings_shared.js',
    'js/state_manager.js'
  ].map(read).join('\n');

  assert.match(loadBlock, /\.\.\.SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY, FT_PROFILES_V3_KEY, FT_PROFILES_V4_KEY/);
  assert.match(loadBlock, /statsBySurface: safeObject\(result\.statsBySurface\)/);
  assert.match(loadBlock, /channelMap: result\.channelMap \|\| \{\}/);
  assert.doesNotMatch(loadBlock, /videoChannelMap|videoMetaMap/);
  assert.doesNotMatch(productSource, /\bstorageKeyAuthority\b/);
});

test('video map changes have split cache and DOM policies today', () => {
  const background = read('js/background.js');
  const compileBlock = sliceBetween(
    background,
    '// Pass through the video-channel map',
    '// Kids profile keyword compilation'
  );
  const mapWriterBlock = sliceBetween(
    background,
    'function enqueueVideoChannelMapUpdate(videoId, channelId) {',
    'function enqueueVideoMetaMapUpdate(videoId, meta) {'
  );
  const metaWriterBlock = sliceBetween(
    background,
    'function enqueueVideoMetaMapUpdate(videoId, meta) {',
    'async function loadReleaseNotesData() {'
  );
  const bridgeSettings = read('js/content/bridge_settings.js');
  const bridgeBlock = sliceBetween(
    bridgeSettings,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );

  assert.match(compileBlock, /pendingVideoChannelMapUpdates\.entries\(\)/);
  assert.match(compileBlock, /compiledSettings\.videoChannelMap = compiledVideoChannelMap;/);
  assert.match(compileBlock, /videoChannelMapCache = \{ \.\.\.compiledVideoChannelMap \};/);
  assert.match(compileBlock, /compiledSettings\.videoMetaMap = items\.videoMetaMap \|\| \{\};/);
  assert.match(mapWriterBlock, /pendingVideoChannelMapUpdates\.set\(v, c\)/);
  assert.match(mapWriterBlock, /compiledSettingsCache\.main\.videoChannelMap/);
  assert.match(metaWriterBlock, /pendingVideoMetaMapUpdates\.set\(v, clean\)/);
  assert.match(metaWriterBlock, /compiledSettingsCache\.main\.videoMetaMap/);
  assert.match(bridgeBlock, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);
});

test('storage_key_stats_by_surface_change_refreshes_dashboard is not satisfied', () => {
  const settingsShared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');
  const loadBlock = sliceBetween(
    settingsShared,
    'function loadSettings()',
    'function saveSettings(options = {})'
  );
  const reloadBlock = sliceBetween(
    stateManager,
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'const hasSettingsChange = storageKeys.some(key => changes[key]);'
  );
  const reloadKeys = keyArrayFromBlock(reloadBlock, 'const storageKeys = [', '];');

  assert.match(loadBlock, /statsBySurface: safeObject\(result\.statsBySurface\)/);
  assertIncludesAll(reloadKeys, ['stats'], 'StateManager reload keys');
  assertOmitsAll(reloadKeys, ['statsBySurface'], 'StateManager reload keys');
});

test('read-path V4 writes currently lack migration revision reports', () => {
  const settingsShared = read('js/settings_shared.js');
  const ioManager = read('js/io_manager.js');
  const settingsLoad = sliceBetween(
    settingsShared,
    'function loadSettings()',
    'function saveSettings(options = {})'
  );
  const loadProfilesV4 = sliceBetween(
    ioManager,
    'async function loadProfilesV4()',
    'async function saveProfilesV4(nextProfiles)'
  );

  assert.match(settingsLoad, /STORAGE_NAMESPACE\?\.set\(\{ \[FT_PROFILES_V4_KEY\]: nextProfilesV4 \}/);
  assert.match(settingsLoad, /STORAGE_NAMESPACE\?\.set\(\{\s*\[FT_PROFILES_V4_KEY\]: \{/);
  assert.match(loadProfilesV4, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: sanitized \}\)/);
  assert.match(loadProfilesV4, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: migrated \}\)/);
  assert.doesNotMatch(`${settingsLoad}\n${loadProfilesV4}`, /migrationRevision|settingsRevision|storageKeyAuthority|mutationReport/);
});

test('import and Nanah profile writes lack shared target-profile revision report today', () => {
  const ioManager = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const importBlock = sliceBetween(
    ioManager,
    "async function importV3(json, { strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null } = {})",
    'if (Object.keys(nextChannelMap).length > 0) {'
  );
  const nanahApply = sliceBetween(
    nanah,
    'async function applyScopedPortablePayload(io, portable, { strategy = \'merge\', targetProfileId = null } = {})',
    'function generateId() {'
  );

  assert.match(importBlock, /const targetProfileId = explicitTargetProfileId/);
  assert.match(importBlock, /await saveProfilesV4\(\{/);
  assert.match(nanahApply, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(nanahApply, /await io\.saveProfilesV4\(\{/);
  assert.doesNotMatch(`${importBlock}\n${nanahApply}`, /storageKeyAuthority|mutationReport|profileRevision|settingsRevision|lockAuthority/);
});

test('unknown storage keys have no shared no-runtime-reprocess report today', () => {
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const stateManager = read('js/state_manager.js');
  const productSource = [background, bridgeSettings, stateManager].join('\n');
  const backgroundListener = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {'
  );
  const bridgeBlock = sliceBetween(
    bridgeSettings,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );
  const stateBlock = sliceBetween(
    stateManager,
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'const hasSettingsChange = storageKeys.some(key => changes[key]);'
  );

  assert.match(backgroundListener, /const relevantKeys = \[/);
  assert.match(bridgeBlock, /const relevantKeys = \[/);
  assert.match(stateBlock, /const storageKeys = \[/);
  assert.doesNotMatch(productSource, /unknown.*storage.*key|storageKeyAuthority|noRuntimeReprocess|ignoredStorageKey/i);
});

test('raw capture evidence remains excluded from storage authority', () => {
  const doc = read(auditDocPath);
  const gitignore = read('.gitignore');
  const productSource = [
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js'
  ].map(read).join('\n');

  assert.match(doc, /Ignored root capture files remain evidence only/);
  for (const rawCapture of [
    'YT_MAIN.json',
    'YT_MAIN_WATCH.html',
    'YT_MAIN_next?prettyPrint.json',
    'YT_KIDS.json',
    'YTM-XHR.json',
    'comments.json',
    'playlist.html',
    'collab.json'
  ]) {
    assert.ok(gitignore.includes(rawCapture), `${rawCapture} should remain ignored raw evidence`);
    assert.ok(!productSource.includes(rawCapture), `${rawCapture} should not appear in product storage authority source`);
  }
});
