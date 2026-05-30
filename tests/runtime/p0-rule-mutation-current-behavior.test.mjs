import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

const fixtures = [
  'rule_mutation_report_exists_for_state_manager_add_keyword',
  'rule_mutation_report_exists_for_state_manager_add_channel',
  'rule_mutation_report_exists_for_background_add_filtered_channel',
  'rule_mutation_report_exists_for_kids_block_and_whitelist',
  'rule_mutation_report_exists_for_list_mode_transfer',
  'rule_mutation_report_exists_for_managed_child_edit',
  'rule_mutation_report_exists_for_import_v3',
  'rule_mutation_report_exists_for_nanah_scoped_apply',
  'rule_mutation_report_exists_for_learned_identity_writes',
  'content_script_channel_add_requires_allowed_youtube_action',
  'page_world_identity_update_requires_owned_request'
];

test('P0 rule mutation doc lists all readiness fixtures and blocked verdict', () => {
  const doc = read(docPath);
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');
  const authorityAudit = read('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md');

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing fixture in P0 doc: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing fixture in readiness gate: ${fixture}`);
    assert.ok(register.includes(fixture), `missing fixture in P0 register: ${fixture}`);
  }

  for (const token of [
    'ruleMutationAuthority',
    'P0 rule mutation authority is not implementation-ready',
    'trustedUi | allowedYoutubeContentScript | ownedPageWorldRequest | backgroundInternal | import | nanah',
    'compiled settings revision'
  ]) {
    assert.ok(doc.includes(token), `missing P0 doc token: ${token}`);
  }

  assert.ok(authorityAudit.includes('Minimum Fixtures Before Fixes'));
});

test('rule_mutation_report_exists_for_state_manager_add_keyword is not satisfied today', () => {
  const block = sliceBetween(
    read('js/state_manager.js'),
    'async function addKeyword',
    'async function toggleKeywordComments'
  );

  assert.match(block, /if \(state\.mode === 'whitelist'\)/);
  assert.match(block, /state\.userWhitelistKeywords = \[entry, \.\.\.list\]/);
  assert.match(block, /await persistMainProfiles\(/);
  assert.match(block, /state\.userKeywords\.unshift\(/);
  assert.match(block, /recomputeKeywords\(\)/);
  assert.match(block, /await saveSettings\(\)/);
  assert.match(block, /requestRefresh\('main'\)/);
  assert.match(block, /scheduleAutoBackup\('keyword_added'\)/);
  assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|listTarget|operationId|compiledSettingsRevision/);
});

test('rule_mutation_report_exists_for_state_manager_add_channel is not satisfied today', () => {
  const block = sliceBetween(
    read('js/state_manager.js'),
    'async function addChannel',
    '/**\n     * Remove a channel'
  );

  assert.match(block, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(block, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(block, /input: rawValue/);
  assert.match(block, /notifyListeners\('channelAdded'/);
  assert.match(block, /requestRefresh\('main'\)/);
  assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|listTarget|operationId|compiledSettingsRevision/);
});

test('rule_mutation_report_exists_for_background_add_filtered_channel is not satisfied today', () => {
  const source = read('js/background.js');
  const persistent = sliceBetween(
    source,
    '} else if (request.action === "addChannelPersistent")',
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)'
  );
  const secondary = sliceBetween(
    source,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.match(persistent, /browserAPI\.storage\.local\.set\(writePayload/);
  assert.match(persistent, /FT_PROFILES_V4_KEY/);
  assert.match(persistent, /scheduleAutoBackupInBackground\('channel_added'\)/);
  assert.doesNotMatch(persistent, /ruleMutationAuthority|mutationReport|listTarget|compiledSettingsRevision/);

  assert.match(secondary, /handleAddFilteredChannel\(/);
  assert.match(secondary, /message\.profile \|\| 'main'/);
  assert.doesNotMatch(secondary, /isTrustedUiSender\(sender\)|message\.listType|allowedYoutubeContentScript|ruleMutationAuthority|mutationReport/);
});

test('rule_mutation_report_exists_for_kids_block_and_whitelist is not satisfied today', () => {
  const source = read('js/background.js');
  const kidsWhitelist = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsWhitelistChannel')",
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"
  );
  const kidsBlock = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsBlockChannel')",
    '} else if (request.action === "injectScripts")'
  );

  assert.match(kidsWhitelist, /isTrustedUiSender\(sender\)/);
  assert.match(kidsWhitelist, /handleAddFilteredChannel\(/);
  assert.match(kidsWhitelist, /'kids'/);
  assert.match(kidsWhitelist, /'whitelist'/);

  assert.doesNotMatch(kidsBlock, /isTrustedUiSender\(sender\)/);
  assert.match(kidsBlock, /handleAddFilteredChannel\(/);
  assert.match(kidsBlock, /'kids'/);

  assert.doesNotMatch(kidsWhitelist + kidsBlock, /ruleMutationAuthority|mutationReport|compiledSettingsRevision|lockAuthority/);
});

test('rule_mutation_report_exists_for_list_mode_transfer is not satisfied today', () => {
  const source = read('js/background.js');
  const setListMode = sliceBetween(
    source,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
  const transfer = sliceBetween(
    source,
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')",
    "} else if (action === 'FilterTube_ScheduleAutoBackup')"
  );

  assert.match(setListMode, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(setListMode, /mergeAndClearBlocklistIntoWhitelist\(requestedProfile\)/);
  assert.match(setListMode, /compiledSettingsCache\.main = null/);
  assert.match(setListMode, /scheduleAutoBackupInBackground\('mode_changed'\)/);

  assert.match(transfer, /nextKids\.whitelistChannels = \[\]/);
  assert.match(transfer, /nextMain\.whitelistChannels = \[\]/);
  assert.match(transfer, /compiledSettingsCache\.kids = null/);
  assert.match(transfer, /scheduleAutoBackupInBackground\('whitelist_to_blocklist_transfer'\)/);
  assert.doesNotMatch(setListMode + transfer, /dryRun|mutationReport|settingsRevision|compiledSettingsRevision|rollback|migrationPlan/);
});

test('rule_mutation_report_exists_for_managed_child_edit is not satisfied today', () => {
  const source = read('js/tab-view.js');
  const saveBlock = sliceBetween(
    source,
    'async function saveManagedChildSurface',
    'try {\n        window.__filtertubeIsManagedChildEditFor'
  );
  const childMutators = sliceBetween(
    source,
    'async function addManagedKeyword',
    'function renderKeywords'
  );

  assert.match(saveBlock, /canActiveProfileManageProfile\(fresh, profileId\)/);
  assert.match(saveBlock, /const result = await mutator\(nextSurface, profile\)/);
  assert.match(saveBlock, /await io\.saveProfilesV4\(/);
  assert.match(saveBlock, /await StateManager\.loadSettings/);
  assert.match(saveBlock, /updateStats\(\)/);
  assert.match(childMutators, /surface === 'kids'/);
  assert.match(childMutators, /mode === 'whitelist'/);
  assert.doesNotMatch(saveBlock + childMutators, /ruleMutationAuthority|mutationReport|compiledSettingsRevision|settingsRevision/);
});

test('rule_mutation_report_exists_for_import_v3 is not satisfied today', () => {
  const block = sliceBetween(
    read('js/io_manager.js'),
    'async function importV3(json',
    'async function exportV3Encrypted'
  );

  assert.match(block, /await SettingsAPI\.saveSettings\(payload\)/);
  assert.match(block, /await saveProfilesV3\(nextProfiles\)/);
  assert.match(block, /await saveProfilesV4\(/);
  assert.match(block, /await writeStorage\(\{ channelMap: nextChannelMap \}\)/);
  assert.match(block, /restoreTrustedNanahState/);
  assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|compiledSettingsRevision|settingsRevision|postApplyRevision/);
});

test('rule_mutation_report_exists_for_nanah_scoped_apply is not satisfied today', () => {
  const block = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(block, /const incomingChannels = Array\.isArray\(data\.channels\) \? data\.channels : data\.blockedChannels/);
  assert.match(block, /mergeChannelLists\(currentMain\.channels, incomingChannels\)/);
  assert.match(block, /mergeChannelLists\(currentKids\.blockedChannels, data\.blockedChannels\)/);
  assert.match(block, /normalizeMainProfileAliasFields/);
  assert.match(block, /await io\.saveProfilesV4\(/);
  assert.match(block, /return \{\s*ok: true,\s*scope,\s*profileId: resolvedTargetProfileId,\s*strategy:/);
  assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|compiledSettingsRevision|lockAuthority|refresh|broadcast/);
});

test('rule_mutation_report_exists_for_learned_identity_writes is not satisfied today', () => {
  const bridge = sliceBetween(
    read('js/content_bridge.js'),
    'function handleMainWorldMessages',
    'window.addEventListener'
  );
  const background = sliceBetween(
    read('js/background.js'),
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    'else if (request.action === "fetchChannelDetails")'
  );

  assert.match(bridge, /FilterTube_UpdateVideoChannelMap/);
  assert.match(bridge, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(bridge, /FilterTube_UpdateVideoMetaMap/);
  assert.match(bridge, /persistVideoMetaMapping\(updates\)/);
  assert.match(bridge, /FilterTube_UpdateCustomUrlMap/);
  assert.match(bridge, /storage\.local\.set\(\{ channelMap \}/);

  assert.match(background, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(background, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.doesNotMatch(background, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.match(background, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(background, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.doesNotMatch(bridge + background, /ruleMutationAuthority|mutationReport|ownedPageWorldRequest|allowedYoutubeContentScript|identityProvenanceReport/);
});

test('content_script_channel_add_requires_allowed_youtube_action is not satisfied today', () => {
  const bridgeAdd = sliceBetween(
    read('js/content_bridge.js'),
    'async function addChannelDirectly',
    '/**\n * Add "Filter All Content" checkbox below the blocked channel'
  );
  const secondary = sliceBetween(
    read('js/background.js'),
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.match(bridgeAdd, /browserAPI_BRIDGE\.runtime\.sendMessage\(\{/);
  assert.match(bridgeAdd, /type: 'addFilteredChannel'/);
  assert.match(bridgeAdd, /profile,/);
  assert.match(secondary, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(secondary, /allowedYoutubeContentScript|isAllowedYoutubeContentScript|routeActionToken|isTrustedUiSender\(sender\)|profile_locked/);
});

test('page_world_identity_update_requires_owned_request is not satisfied today', () => {
  const pageIdentityBlock = sliceBetween(
    read('js/content_bridge.js'),
    'function handleMainWorldMessages',
    "} else if (type === 'FilterTube_CollaboratorInfoResponse')"
  );

  assert.match(pageIdentityBlock, /event\.source !== window/);
  assert.match(pageIdentityBlock, /event\.data\.source === 'content_bridge'/);
  assert.match(pageIdentityBlock, /FilterTube_UpdateVideoChannelMap/);
  assert.match(pageIdentityBlock, /FilterTube_UpdateVideoMetaMap/);
  assert.match(pageIdentityBlock, /FilterTube_UpdateCustomUrlMap/);
  assert.doesNotMatch(pageIdentityBlock, /ownedPageWorldRequest|capability|nonce|pendingRequest|requestId|identityProvenanceReport/);
});
