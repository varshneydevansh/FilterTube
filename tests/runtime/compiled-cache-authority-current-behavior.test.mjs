import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';

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

test('compiled_cache_doc_lists_current_cache_authorities', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /compiledCacheAuthority/);
  assert.match(doc, /compiledSettingsRevision/);

  for (const fixture of [
    'compiled_cache_shape_is_surface_only_without_revision',
    'compiled_cache_getter_returns_cache_before_storage_read',
    'compiled_cache_runtime_message_has_second_cache_gate',
    'compiled_cache_compiler_and_message_handler_both_assign_cache',
    'compiled_cache_apply_settings_recompiles_background_payload',
    'compiled_cache_learned_map_writers_patch_cached_objects',
    'compiled_cache_storage_invalidation_recompiles_without_revision_report'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }
});

test('compiled_cache_shape_is_surface_only_without_revision', () => {
  const background = read('js/background.js');

  assert.match(background, /let compiledSettingsCache = \{ main: null, kids: null \};/);
  assert.doesNotMatch(background, /compiledSettingsCache\s*=\s*\{[\s\S]{0,120}revision/);
  assert.doesNotMatch(background, /compiledSettingsCache\[activeProfileId\]|compiledSettingsCache\[profileId\]/);
  assert.doesNotMatch(background, /compiledCacheAuthority|compiledSettingsRevision/);
});

test('compiled_cache_getter_returns_cache_before_storage_read', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'return new Promise((resolve) => {'
  );

  assert.match(block, /const targetProfile = profileType === 'kids' \|\| isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(block, /if \(!forceRefresh && compiledSettingsCache\[targetProfile\]\) \{/);
  assert.match(block, /return compiledSettingsCache\[targetProfile\]/);
  assert.doesNotMatch(block, /storageRevision|dirtyKeys|compiledSettingsRevision|activeProfileId/);
});

test('compiled_cache_runtime_message_has_second_cache_gate', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    '} else if (action === "getCompiledSettings") {',
    "} else if (action === 'FilterTube_SessionPinAuth') {"
  );

  assert.match(block, /if \(compiledSettingsCache\[profileType\] && !request\.forceRefresh\) \{/);
  assert.match(block, /sendResponse\(compiledSettingsCache\[profileType\]\)/);
  assert.match(block, /getCompiledSettings\(sender, profileType, !!request\.forceRefresh\)/);
  assert.match(block, /compiledSettingsCache\[profileType\] = compiledSettings/);
  assert.doesNotMatch(block, /compiledSettingsRevision|cacheSource|storageRevision|dirtyKeys/);
});

test('compiled_cache_compiler_and_message_handler_both_assign_cache', () => {
  const background = read('js/background.js');
  const compileTail = sliceBetween(
    background,
    'console.log(`FilterTube Background: Compiled ${targetProfile} settings:',
    'function shouldSuppressFirstRunPromptInjectionError'
  );
  const message = sliceBetween(
    background,
    '} else if (action === "getCompiledSettings") {',
    "} else if (action === 'FilterTube_SessionPinAuth') {"
  );

  assert.match(compileTail, /compiledSettingsCache\[targetProfile\] = compiledSettings/);
  assert.match(compileTail, /resolve\(compiledSettings\)/);
  assert.match(message, /compiledSettingsCache\[profileType\] = compiledSettings/);
  assert.match(message, /sendResponse\(compiledSettings\)/);
});

test('compiled_cache_apply_settings_recompiles_background_payload', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.match(block, /const targetProfile = request\.profile === 'kids' \? 'kids' : 'main'/);
  assert.match(block, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(block, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings|storageRevision|compiledSettingsRevision|compiledCacheAuthority/);
});

test('compiled_cache_learned_map_writers_patch_cached_objects', () => {
  const background = read('js/background.js');
  const channelMap = sliceBetween(
    background,
    'function enqueueChannelMapUpdate(key, value)',
    'function enqueueChannelMapMappings(mappings = [])'
  );
  const videoMap = sliceBetween(
    background,
    'function enqueueVideoChannelMapUpdate(videoId, channelId)',
    'function enqueueVideoMetaMapUpdate(videoId, meta)'
  );
  const metaMap = sliceBetween(
    background,
    'function enqueueVideoMetaMapUpdate(videoId, meta)',
    '/**\n * Lazy-loads the curated release_notes.json file'
  );

  assert.match(channelMap, /compiledSettingsCache\.main\.channelMap = channelMapCache/);
  assert.match(channelMap, /compiledSettingsCache\.kids\.channelMap = channelMapCache/);
  assert.match(videoMap, /compiledSettingsCache\.main\.videoChannelMap = \{/);
  assert.match(videoMap, /compiledSettingsCache\.kids\.videoChannelMap = \{/);
  assert.match(metaMap, /compiledSettingsCache\.main\.videoMetaMap = videoMetaMapCache/);
  assert.match(metaMap, /compiledSettingsCache\.kids\.videoMetaMap = videoMetaMapCache/);
  assert.doesNotMatch(`${channelMap}\n${videoMap}\n${metaMap}`, /compiledSettingsRevision|mapOnlyPatch|compiledCacheAuthority|storageRevision/);
});

test('compiled_cache_storage_invalidation_recompiles_without_revision_report', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    '/**\n * Fetch channel name and handle from YouTube by scraping the channel page'
  );

  assert.match(block, /const relevantKeys = \[/);
  assert.match(block, /compiledSettingsCache\.main = null/);
  assert.match(block, /compiledSettingsCache\.kids = null/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\)/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\)/);
  assert.doesNotMatch(block, /settingsRevision|compiledSettingsRevision|dirtyKeys|compiledCacheAuthority|cacheInvalidationReport/);
});
