import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
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

test('FilterTube_SetListMode currently reads copyBlocklist but does not use it to guard merge-and-clear', () => {
  const text = source('js/background.js');
  const block = sliceBetween(
    text,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.equal(count(block, 'shouldCopyBlocklist'), 1);
  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true;/);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
});

test('tab-view import path asks for copyBlocklist:false before enabling whitelist', () => {
  const text = source('js/tab-view.js');
  const block = sliceBetween(
    text,
    'async function enableWhitelistModeAfterImport(context = {})',
    'renderKeywords();'
  );

  assert.match(block, /action: 'FilterTube_SetListMode'/);
  assert.match(block, /mode: 'whitelist'/);
  assert.match(block, /copyBlocklist: false/);
});

test('FilterTube_ApplySettings recompiles background settings before compiled cache broadcast', () => {
  const text = source('js/background.js');
  const block = sliceBetween(
    text,
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.match(block, /compiledSettingsCache\[targetProfile\] = null;/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(block, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
});

test('background compiler currently writes storage during getCompiledSettings read path', () => {
  const text = source('js/background.js');
  const block = sliceBetween(
    text,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'function shouldSuppressFirstRunPromptInjectionError'
  );

  assert.match(block, /const storageUpdates = \{\};/);
  assert.match(block, /storageUpdates\[FT_PROFILES_V4_KEY\] = buildProfilesV4FromLegacyState\(items, storageUpdates\);/);
  assert.match(block, /if \(Object\.keys\(storageUpdates\)\.length > 0\) \{\s*browserAPI\.storage\.local\.set\(storageUpdates\);/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ ftProfilesV4: updatedProfilesV4 \}\);/);
  assert.match(block, /compiledSettingsCache\[targetProfile\] = compiledSettings;/);
});

test('background currently has two separate channel-add implementations', () => {
  const text = source('js/background.js');
  const legacyBlock = sliceBetween(
    text,
    '} else if (request.action === "addChannelPersistent")',
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)'
  );
  const messageBlock = sliceBetween(
    text,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );
  const helperBlock = sliceBetween(
    text,
    'async function handleAddFilteredChannel(input, filterAll = false',
    '/**\n * Handle toggling Filter All Content for a channel'
  );

  assert.equal(count(text, 'const normalizeChannelInput = (rawInput) =>'), 2);
  assert.match(legacyBlock, /let details = await fetchChannelInfo\(lookupValue\);/);
  assert.match(legacyBlock, /browserAPI\.storage\.local\.set\(writePayload, resolve\)/);
  assert.match(legacyBlock, /scheduleAutoBackupInBackground\('channel_added'\)/);
  assert.match(messageBlock, /handleAddFilteredChannel\(/);
  assert.match(messageBlock, /const backupTrigger = targetListType === 'whitelist'/);
  assert.match(messageBlock, /scheduleAutoBackupInBackground\(backupTrigger\)/);
  assert.match(helperBlock, /const targetListType = listType === 'whitelist' \? 'whitelist' : 'blocklist';/);
  assert.match(helperBlock, /storageWritePayload\[FT_PROFILES_V4_KEY\]/);
  assert.match(helperBlock, /storageWritePayload\.filterChannels = channels;/);
});

test('addFilteredChannel message path forwards normalized listType to handleAddFilteredChannel', () => {
  const text = source('js/background.js');
  const block = sliceBetween(
    text,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.match(block, /const targetListType = message\.listType === 'whitelist' \? 'whitelist' : 'blocklist';/);
  assert.match(block, /targetProfile,\s*message\.videoId \|\| '',\s*targetListType\s*\)/);
});

test('settings compilation currently merges Kids whitelist into Main whitelist when syncKidsToMain and modes match', () => {
  const text = source('js/background.js');
  const block = sliceBetween(
    text,
    'const rawWhitelistKeywords = shouldUseKidsProfile',
    'const boolFromV4 = (key, legacyValue) =>'
  );

  assert.match(block, /if \(!syncKidsToMain \|\| mainModeFromV4 !== 'whitelist' \|\| kidsModeFromV4 !== 'whitelist'\) return mainKeywords;/);
  assert.match(block, /kidsWhitelistKeywords\.forEach/);
  assert.match(block, /if \(!syncKidsToMain \|\| mainModeFromV4 !== 'whitelist' \|\| kidsModeFromV4 !== 'whitelist'\) return mainChannels;/);
  assert.match(block, /kidsWhitelistChannels\.forEach/);
});

test('settings_shared SETTINGS_KEYS currently omits several runtime compiler dependencies', () => {
  const text = source('js/settings_shared.js');
  const keys = keyArrayFromBlock(
    text,
    'const SETTINGS_KEYS = [',
    '];\n\n    const SETTINGS_CHANGE_KEYS'
  );

  assertIncludesAll(keys, ['enabled', 'filterKeywords', 'uiKeywords', 'filterChannels', 'channelMap'], 'SETTINGS_KEYS');
  assertOmitsAll(
    keys,
    [
      'contentFilters',
      'categoryFilters',
      'filterKeywordsComments',
      'videoChannelMap',
      'videoMetaMap',
      'ftProfilesV4',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords'
    ],
    'SETTINGS_KEYS'
  );
});

test('background compiler reads more setting keys than its storage invalidation listener watches', () => {
  const text = source('js/background.js');
  const compilerBlock = sliceBetween(
    text,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    '], (items) => {'
  );
  const compilerKeys = quotedStrings(compilerBlock);
  const storageListenerBlock = sliceBetween(
    text,
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {'
  );
  const listenerKeys = keyArrayFromBlock(
    storageListenerBlock,
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );

  assertIncludesAll(
    compilerKeys,
    [
      'enabled',
      'contentFilters',
      'videoChannelMap',
      'videoMetaMap',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords'
    ],
    'background compiler key list'
  );
  assertOmitsAll(
    listenerKeys,
    [
      'enabled',
      'categoryFilters',
      'videoChannelMap',
      'videoMetaMap',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'showQuickBlockButton',
      'showBlockMenuItem',
      'hideEndscreenVideowall',
      'hideEndscreenCards'
    ],
    'background storage invalidation key list'
  );
  assert.ok(listenerKeys.includes('hideComments'), 'background invalidation currently watches legacy hideComments key');
  assert.ok(!listenerKeys.includes('hideAllComments'), 'background invalidation currently omits compiled hideAllComments key');
});

test('bridge settings storage refresh currently omits category and exact-match keys', () => {
  const text = source('js/content/bridge_settings.js');
  const keys = keyArrayFromBlock(
    text,
    'const relevantKeys = [',
    '];\n    if (Object.keys(changes).some'
  );

  assertIncludesAll(keys, ['enabled', 'contentFilters', 'videoChannelMap', 'videoMetaMap', 'showQuickBlockButton'], 'bridge storage key list');
  assertOmitsAll(
    keys,
    [
      'categoryFilters',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'stats',
      'statsBySurface'
    ],
    'bridge storage key list'
  );
});

test('StateManager external reload key list currently omits content/category and learned video maps', () => {
  const text = source('js/state_manager.js');
  const keys = keyArrayFromBlock(
    text,
    'const storageKeys = [',
    '];\n                const hasSettingsChange'
  );

  assertIncludesAll(keys, ['enabled', 'filterKeywords', 'filterChannels', 'ftProfilesV4', 'channelMap'], 'StateManager storage key list');
  assertOmitsAll(
    keys,
    [
      'contentFilters',
      'categoryFilters',
      'videoChannelMap',
      'videoMetaMap',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'statsBySurface'
    ],
    'StateManager storage key list'
  );
});

test('legacy V3 to V4 builder currently forces blocklist mode and empty whitelists', () => {
  const text = source('js/settings_shared.js');
  const block = sliceBetween(
    text,
    'function buildProfilesV4FromLegacyState(storage, mainChannels, mainKeywords) {',
    'function sanitizeKeywordEntry(entry, overrides = {})'
  );

  assert.match(block, /const mainV3 = safeObject\(profilesV3\.main\);/);
  assert.match(block, /syncKidsToMain: !!mainV3\.applyKidsRulesOnMain/);
  assert.match(block, /main:\s*\{\s*mode: 'blocklist',\s*channels: safeArray\(mainChannels\),\s*keywords: safeArray\(mainKeywords\),\s*whitelistChannels: \[\],\s*whitelistKeywords: \[\]/);
  assert.match(block, /kids:\s*\{\s*mode: 'blocklist',\s*strictMode: kidsV3\.strictMode !== false,\s*blockedChannels: safeArray\(kidsV3\.blockedChannels\),\s*blockedKeywords: safeArray\(kidsV3\.blockedKeywords\),\s*whitelistChannels: \[\],\s*whitelistKeywords: \[\]/);
  assert.doesNotMatch(block, /mainV3\.whitelist/);
  assert.doesNotMatch(block, /kidsV3\.whitelist/);
});

test('settings_shared loadSettings currently writes generated V4 during read path when V4 is missing', () => {
  const text = source('js/settings_shared.js');
  const block = sliceBetween(
    text,
    'if (!hasProfilesV4) {',
    '} else {\n                    try {'
  );

  assert.match(block, /const nextProfilesV4 = buildProfilesV4FromLegacyState\(result, channels, keywords\);/);
  assert.match(block, /STORAGE_NAMESPACE\?\.set\(\{ \[FT_PROFILES_V4_KEY\]: nextProfilesV4 \}/);
});

test('V4 main blocked aliases are now secondary to canonical saved main lists', () => {
  const background = source('js/background.js');
  const compilerBlock = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'compiledSettings.whitelistChannels = compileWhitelistChannels(rawWhitelistChannels);'
  );
  const channelBlock = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'let compiledChannels = [];'
  );
  const sharedSaveBlock = sliceBetween(
    source('js/settings_shared.js'),
    'profiles[activeId] = {',
    'payload[FT_PROFILES_V4_KEY] = nextProfilesV4;'
  );

  assert.match(compilerBlock, /const mainKeywords = Array\.isArray\(activeMain\.keywords\)\s*\?\s*activeMain\.keywords\s*:\s*\(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\);/);
  assert.match(channelBlock, /const mainChannels = Array\.isArray\(activeMain\.channels\)\s*\?\s*activeMain\.channels\s*:\s*\(Array\.isArray\(activeMain\.blockedChannels\) \? activeMain\.blockedChannels : items\.filterChannels\);/);
  assert.match(sharedSaveBlock, /channels: sanitizedChannels/);
  assert.match(sharedSaveBlock, /keywords: sanitizedKeywords/);
  assert.match(sharedSaveBlock, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
  assert.match(sharedSaveBlock, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
});

test('StateManager saveSettings currently drops concurrent save requests instead of queuing them', () => {
  const text = source('js/state_manager.js');
  const block = sliceBetween(
    text,
    'async function saveSettings({ broadcast = true, profile = \'main\' } = {})',
    'async function ensureLoaded()'
  );

  assert.match(block, /if \(isSaving\) return;/);
  assert.match(block, /isSaving = true;/);
  assert.match(block, /const result = await SettingsAPI\.saveSettings\(/);
  assert.match(block, /if \(broadcast && result\.compiledSettings\) \{\s*broadcastSettings\(result\.compiledSettings, profile\);/);
  assert.match(block, /finally \{\s*isSaving = false;\s*\}/);
});

test('StateManager mutators update state before saveSettings and can notify after a dropped save', () => {
  const text = source('js/state_manager.js');
  const keywordBlock = sliceBetween(
    text,
    'async function addKeyword(word, options = {})',
    'async function toggleKeywordComments(word)'
  );
  const contentBlock = sliceBetween(
    text,
    'async function updateContentFilters(nextContentFilters)',
    'async function updateKidsContentFilters(nextContentFilters)'
  );
  const categoryBlock = sliceBetween(
    text,
    'async function updateCategoryFilters(nextCategoryFilters)',
    'async function updateKidsCategoryFilters(nextCategoryFilters)'
  );

  assert.match(keywordBlock, /state\.userKeywords\.unshift\(/);
  assert.match(keywordBlock, /recomputeKeywords\(\);\s*await saveSettings\(\);\s*notifyListeners\('keywordAdded'/);
  assert.match(contentBlock, /state\.contentFilters = \{/);
  assert.match(contentBlock, /await saveSettings\(\);\s*await requestRefresh\('main'\);\s*notifyListeners\('contentFiltersUpdated'/);
  assert.match(categoryBlock, /state\.categoryFilters = next;/);
  assert.match(categoryBlock, /await saveSettings\(\);\s*await requestRefresh\('main'\);\s*notifyListeners\('categoryFiltersUpdated'/);
});

test('profile persistence helpers currently swallow V3 and V4 save failures', () => {
  const text = source('js/state_manager.js');
  const mainBlock = sliceBetween(
    text,
    'async function persistMainProfiles(nextMain)',
    'async function persistKidsProfiles(nextKids)'
  );
  const kidsBlock = sliceBetween(
    text,
    'async function persistKidsProfiles(nextKids)',
    '/**\n     * Broadcast settings to content scripts'
  );

  assert.match(mainBlock, /catch \(e\) \{\s*console\.warn\('StateManager: Failed to persist main profiles \(v3\)', e\);\s*\}/);
  assert.match(mainBlock, /catch \(e\) \{\s*console\.warn\('StateManager: Failed to persist main profiles \(v4\)', e\);\s*\}/);
  assert.equal(count(kidsBlock, "console.warn('StateManager: Failed to persist kids profiles', e);"), 2);
});

test('syncKidsToMain keyword recomputation can merge Kids channel-derived keywords into Main keyword state', () => {
  const text = source('js/state_manager.js');
  const stateBlock = sliceBetween(
    text,
    'function recomputeKeywords()',
    '// ============================================================================\n    // CHANNEL MANAGEMENT'
  );
  const sharedSaveBlock = sliceBetween(
    source('js/settings_shared.js'),
    'function saveSettings(options = {})',
    'function applyThemePreference(theme)'
  );

  assert.match(stateBlock, /if \(state\.syncKidsToMain && kidsMode === mainMode\) \{/);
  assert.match(stateBlock, /channelsForKeywords = \[\.\.\.\(Array\.isArray\(state\.channels\) \? state\.channels : \[\]\), \.\.\.kidsChannels\];/);
  assert.match(stateBlock, /state\.keywords = SettingsAPI\.syncFilterAllKeywords\(state\.userKeywords, channelsForKeywords\);/);
  assert.match(sharedSaveBlock, /const sanitizedKeywords = syncFilterAllKeywords\(keywords, sanitizedChannels\);/);
  assert.match(sharedSaveBlock, /keywords: sanitizedKeywords/);
});
