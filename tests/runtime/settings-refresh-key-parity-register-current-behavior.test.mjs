import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/background.js': [6984, 315747, '080d15907b26314873138c5dcc5d9653a2a27e933049be10361dfe0047f0a7cc'],
  'js/settings_shared.js': [1196, 59725, '2d4458a87dce945bf560123e54534854c52fe1de20ac5dae3e3b019bf7a37311'],
  'js/content/bridge_settings.js': [1459, 57855, '6434bd16233044ebb4aaef69261126f3b1852213cffd24ce82b4ecf2bb7a4486'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']
};

const expectedSets = {
  backgroundCompilerStorageGet: ['enabled', 'filterKeywords', 'uiKeywords', 'filterChannels', 'contentFilters', 'useExactWordMatching', 'filterKeywordsComments', 'filterChannelsAdditionalKeywords', 'uiChannels', 'hideAllShorts', 'hideAllComments', 'filterComments', 'hideHomeFeed', 'hideSponsoredCards', 'hideWatchPlaylistPanel', 'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton', 'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers', 'hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations', 'hideTopHeader', 'hideNotificationBell', 'hideExploreTrending', 'hideMoreFromYouTube', 'hideSubscriptions', 'hideSearchShelves', 'channelMap', 'videoChannelMap', 'videoMetaMap', 'stats', 'ftProfilesV3', 'ftProfilesV4'],
  backgroundStorageInvalidation: ['uiKeywords', 'filterKeywords', 'filterKeywordsComments', 'uiChannels', 'filterChannels', 'contentFilters', 'hideMembersOnly', 'hideAllShorts', 'hideComments', 'filterComments', 'hideHomeFeed', 'hideSponsoredCards', 'ftProfilesV3', 'ftProfilesV4'],
  sharedSettingsKeys: ['enabled', 'filterKeywords', 'uiKeywords', 'filterChannels', 'hideAllShorts', 'hideAllComments', 'hideHomeFeed', 'hideSponsoredCards', 'hideWatchPlaylistPanel', 'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton', 'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers', 'hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations', 'hideTopHeader', 'hideNotificationBell', 'hideExploreTrending', 'hideMoreFromYouTube', 'hideSubscriptions', 'showQuickBlockButton', 'showBlockMenuItem', 'hideSearchShelves', 'stats', 'statsBySurface', 'channelMap'],
  contentBridgeStorageRefreshKeys: ['enabled', 'uiKeywords', 'filterKeywords', 'filterKeywordsComments', 'filterChannels', 'contentFilters', 'uiChannels', 'ftProfilesV3', 'ftProfilesV4', 'channelMap', 'videoChannelMap', 'videoMetaMap', 'hideAllComments', 'filterComments', 'hideAllShorts', 'hideHomeFeed', 'hideSponsoredCards', 'hideWatchPlaylistPanel', 'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton', 'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers', 'hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations', 'hideTopHeader', 'hideNotificationBell', 'hideExploreTrending', 'hideMoreFromYouTube', 'hideSubscriptions', 'showQuickBlockButton', 'showBlockMenuItem', 'hideSearchShelves'],
  stateManagerExternalReloadKeys: ['enabled', 'uiKeywords', 'filterKeywords', 'filterKeywordsComments', 'filterChannels', 'hideAllShorts', 'hideAllComments', 'filterComments', 'hideHomeFeed', 'hideSponsoredCards', 'hideWatchPlaylistPanel', 'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton', 'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers', 'hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations', 'hideTopHeader', 'hideNotificationBell', 'hideExploreTrending', 'hideMoreFromYouTube', 'hideSubscriptions', 'showQuickBlockButton', 'showBlockMenuItem', 'hideSearchShelves', 'stats', 'channelMap', 'ftProfilesV3', 'ftProfilesV4']
};

const expectedDeltas = {
  backgroundCompilerNotBackgroundInvalidation: ['channelMap', 'disableAnnotations', 'disableAutoplay', 'enabled', 'filterChannelsAdditionalKeywords', 'hideAllComments', 'hideAskButton', 'hideEndscreenCards', 'hideEndscreenVideowall', 'hideExploreTrending', 'hideLiveChat', 'hideMerchTicketsOffers', 'hideMixPlaylists', 'hideMoreFromYouTube', 'hideNotificationBell', 'hidePlaylistCards', 'hideRecommended', 'hideSearchShelves', 'hideSubscriptions', 'hideTopHeader', 'hideVideoButtonsBar', 'hideVideoChannelRow', 'hideVideoDescription', 'hideVideoInfo', 'hideVideoSidebar', 'hideWatchPlaylistPanel', 'stats', 'useExactWordMatching', 'videoChannelMap', 'videoMetaMap'],
  backgroundCompilerNotContentBridgeRefresh: ['filterChannelsAdditionalKeywords', 'stats', 'useExactWordMatching'],
  backgroundCompilerNotStateManagerReload: ['contentFilters', 'filterChannelsAdditionalKeywords', 'uiChannels', 'useExactWordMatching', 'videoChannelMap', 'videoMetaMap'],
  backgroundCompilerNotSharedSettingsKeys: ['contentFilters', 'filterChannelsAdditionalKeywords', 'filterComments', 'filterKeywordsComments', 'ftProfilesV3', 'ftProfilesV4', 'uiChannels', 'useExactWordMatching', 'videoChannelMap', 'videoMetaMap'],
  backgroundCompilerNotSharedLoadSettingsReads: ['contentFilters', 'filterChannelsAdditionalKeywords', 'filterComments', 'filterKeywordsComments', 'uiChannels', 'useExactWordMatching', 'videoChannelMap', 'videoMetaMap'],
  contentBridgeRefreshNotBackgroundInvalidation: ['channelMap', 'disableAnnotations', 'disableAutoplay', 'enabled', 'hideAllComments', 'hideAskButton', 'hideEndscreenCards', 'hideEndscreenVideowall', 'hideExploreTrending', 'hideLiveChat', 'hideMerchTicketsOffers', 'hideMixPlaylists', 'hideMoreFromYouTube', 'hideNotificationBell', 'hidePlaylistCards', 'hideRecommended', 'hideSearchShelves', 'hideSubscriptions', 'hideTopHeader', 'hideVideoButtonsBar', 'hideVideoChannelRow', 'hideVideoDescription', 'hideVideoInfo', 'hideVideoSidebar', 'hideWatchPlaylistPanel', 'showBlockMenuItem', 'showQuickBlockButton', 'videoChannelMap', 'videoMetaMap'],
  stateManagerReloadNotBackgroundInvalidation: ['channelMap', 'disableAnnotations', 'disableAutoplay', 'enabled', 'hideAllComments', 'hideAskButton', 'hideEndscreenCards', 'hideEndscreenVideowall', 'hideExploreTrending', 'hideLiveChat', 'hideMerchTicketsOffers', 'hideMixPlaylists', 'hideMoreFromYouTube', 'hideNotificationBell', 'hidePlaylistCards', 'hideRecommended', 'hideSearchShelves', 'hideSubscriptions', 'hideTopHeader', 'hideVideoButtonsBar', 'hideVideoChannelRow', 'hideVideoDescription', 'hideVideoInfo', 'hideVideoSidebar', 'hideWatchPlaylistPanel', 'showBlockMenuItem', 'showQuickBlockButton', 'stats'],
  sharedSettingsKeysNotBackgroundCompiler: ['showBlockMenuItem', 'showQuickBlockButton', 'statsBySurface']
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function parseArrayItems(block) {
  const out = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').trim().replace(/,$/, '').trim();
    if (!line) continue;
    const quoted = /^['"]([^'"]+)['"]$/.exec(line);
    if (quoted) out.push(quoted[1]);
    else if (line === 'FT_PROFILES_V4_KEY') out.push('ftProfilesV4');
    else if (line === 'FT_PROFILES_V3_KEY') out.push('ftProfilesV3');
    else if (line === 'THEME_KEY') out.push('ftThemePreference');
    else if (line === 'AUTO_BACKUP_KEY') out.push('ftAutoBackupEnabled');
  }
  return out;
}

function extractArray(file, outerStart, outerEnd, arrayStart, arrayEnd) {
  const source = read(file);
  const outer = sliceBetween(source, outerStart, outerEnd);
  return parseArrayItems(sliceBetween(outer, arrayStart, arrayEnd));
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function diff(a, b) {
  const bSet = new Set(b);
  return a.filter(value => !bSet.has(value)).sort();
}

function keySets() {
  const backgroundCompilerStorageGet = extractArray(
    'js/background.js',
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'const compiledSettings = {};',
    'browserAPI.storage.local.get([',
    '], (items) => {'
  );
  const backgroundStorageInvalidation = extractArray(
    'js/background.js',
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {',
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );
  const sharedSettingsKeys = parseArrayItems(sliceBetween(
    read('js/settings_shared.js'),
    'const SETTINGS_KEYS = [',
    '];\n\n    const SETTINGS_CHANGE_KEYS'
  ));
  const sharedSettingsChangeKeysExpanded = sortedUnique([
    ...sharedSettingsKeys,
    'ftThemePreference',
    'ftAutoBackupEnabled'
  ]);
  const sharedLoadSettingsReadKeysExpanded = sortedUnique([
    ...sharedSettingsKeys,
    'ftThemePreference',
    'ftAutoBackupEnabled',
    'ftProfilesV3',
    'ftProfilesV4'
  ]);
  const contentBridgeStorageRefreshKeys = extractArray(
    'js/content/bridge_settings.js',
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);',
    'const relevantKeys = [',
    '];\n    if (Object.keys(changes).some'
  );
  const stateManagerExternalReloadKeys = extractArray(
    'js/state_manager.js',
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'if (hasSettingsChange) {',
    'const storageKeys = [',
    '];\n                const hasSettingsChange'
  );

  return {
    backgroundCompilerStorageGet,
    backgroundStorageInvalidation,
    sharedSettingsKeys,
    sharedSettingsChangeKeysExpanded,
    sharedLoadSettingsReadKeysExpanded,
    contentBridgeStorageRefreshKeys,
    stateManagerExternalReloadKeys
  };
}

function deltaSets(sets) {
  return {
    backgroundCompilerNotBackgroundInvalidation: diff(sets.backgroundCompilerStorageGet, sets.backgroundStorageInvalidation),
    backgroundCompilerNotContentBridgeRefresh: diff(sets.backgroundCompilerStorageGet, sets.contentBridgeStorageRefreshKeys),
    backgroundCompilerNotStateManagerReload: diff(sets.backgroundCompilerStorageGet, sets.stateManagerExternalReloadKeys),
    backgroundCompilerNotSharedSettingsKeys: diff(sets.backgroundCompilerStorageGet, sets.sharedSettingsKeys),
    backgroundCompilerNotSharedLoadSettingsReads: diff(sets.backgroundCompilerStorageGet, sets.sharedLoadSettingsReadKeysExpanded),
    contentBridgeRefreshNotBackgroundInvalidation: diff(sets.contentBridgeStorageRefreshKeys, sets.backgroundStorageInvalidation),
    stateManagerReloadNotBackgroundInvalidation: diff(sets.stateManagerExternalReloadKeys, sets.backgroundStorageInvalidation),
    sharedSettingsKeysNotBackgroundCompiler: diff(sets.sharedSettingsKeys, sets.backgroundCompilerStorageGet)
  };
}

function allKeys(sets) {
  return sortedUnique(Object.values(sets).flat());
}

function presenceRows(sets) {
  return allKeys(sets).map(key => [
    key,
    sets.backgroundCompilerStorageGet.includes(key) ? 1 : 0,
    sets.backgroundStorageInvalidation.includes(key) ? 1 : 0,
    sets.sharedSettingsKeys.includes(key) ? 1 : 0,
    sets.sharedSettingsChangeKeysExpanded.includes(key) ? 1 : 0,
    sets.sharedLoadSettingsReadKeysExpanded.includes(key) ? 1 : 0,
    sets.contentBridgeStorageRefreshKeys.includes(key) ? 1 : 0,
    sets.stateManagerExternalReloadKeys.includes(key) ? 1 : 0
  ].join(':'));
}

test('settings refresh key parity register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source files with settings refresh key sets: 4/);
  assert.match(text, /settings refresh key owner sets: 7/);
  assert.match(text, /unique keys across owner sets: 49/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for storage-key authority/);
  assert.match(text, /first-class JSON filter\s+behavior/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('settings refresh key owner sets remain source-derived', () => {
  const sets = keySets();
  const text = doc();

  assert.deepEqual(sets.backgroundCompilerStorageGet, expectedSets.backgroundCompilerStorageGet);
  assert.deepEqual(sets.backgroundStorageInvalidation, expectedSets.backgroundStorageInvalidation);
  assert.deepEqual(sets.sharedSettingsKeys, expectedSets.sharedSettingsKeys);
  assert.deepEqual(sets.contentBridgeStorageRefreshKeys, expectedSets.contentBridgeStorageRefreshKeys);
  assert.deepEqual(sets.stateManagerExternalReloadKeys, expectedSets.stateManagerExternalReloadKeys);
  assert.equal(sets.sharedSettingsChangeKeysExpanded.length, 38);
  assert.equal(sets.sharedLoadSettingsReadKeysExpanded.length, 40);
  assert.equal(allKeys(sets).length, 49);

  for (const [name, values] of Object.entries(sets)) {
    const label = name
      .replace('backgroundCompilerStorageGet', 'backgroundCompilerStorageGet')
      .replace('backgroundStorageInvalidation', 'backgroundStorageInvalidation')
      .replace('sharedSettingsKeys', 'sharedSettingsKeys')
      .replace('sharedSettingsChangeKeysExpanded', 'sharedSettingsChangeKeysExpanded')
      .replace('sharedLoadSettingsReadKeysExpanded', 'sharedLoadSettingsReadKeysExpanded')
      .replace('contentBridgeStorageRefreshKeys', 'contentBridgeStorageRefreshKeys')
      .replace('stateManagerExternalReloadKeys', 'stateManagerExternalReloadKeys');
    assert.match(text, new RegExp(`${label} \\(${values.length}\\): ${escapeRegExp(values.join(','))}`));
  }
});

test('settings refresh parity deltas and presence matrix remain source-derived', () => {
  const sets = keySets();
  const deltas = deltaSets(sets);
  const text = doc();

  assert.deepEqual(deltas, expectedDeltas);
  for (const [name, values] of Object.entries(deltas)) {
    assert.match(text, new RegExp(`${name} \\(${values.length}\\): ${escapeRegExp(values.join(','))}`));
  }

  for (const row of presenceRows(sets)) {
    assert.ok(text.includes(row), `missing presence row ${row}`);
  }

  const bridgeSource = read('js/content/bridge_settings.js');
  const bridgeHandler = sliceBetween(
    bridgeSource,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );
  assert.match(bridgeHandler, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(bridgeHandler, /const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(bridgeHandler, /const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(bridgeHandler, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);
});

test('settings refresh key parity register records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const field of [
    'settingsRefreshKeyReference',
    'storageKey',
    'keyOwner',
    'compilerDependency',
    'backgroundInvalidationDependency',
    'contentBridgeRefreshDependency',
    'stateManagerReloadDependency',
    'jsonFirstFieldDecision',
    'dirtyKeyDecision',
    'settingsRevisionBefore',
    'settingsRevisionAfter',
    'noOpRefreshDecision',
    'activeRuleDelta',
    'domReprocessDecision',
    'seedUpdateDecision',
    'mainWorldRelayDecision',
    'uiReloadDecision',
    'networkWorkBudget',
    'domWorkBudget',
    'messageWorkBudget',
    'negativeNoOpFixture',
    'negativeSiblingFixture'
  ]) {
    assert.match(text, new RegExp(`\\b${field}\\b`), `missing future proof field ${field}`);
  }

  const productSource = Object.keys(sourceFingerprints).map(read).join('\n');
  for (const symbol of [
    'settingsRefreshKeyParityAuthority',
    'settingsRefreshKeyManifest',
    'settingsRefreshRevisionContract',
    'settingsDirtyKeyDecision',
    'settingsNoOpRefreshReport',
    'settingsConsumerRefreshMatrix',
    'settingsRefreshWorkBudget',
    'settingsRefreshFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(`\\b${symbol}\\b`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
  }
});
