import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md';

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

function backgroundActionBlock(action, nextAction) {
  return sliceBetween(
    read('js/background.js'),
    `} else if (action === '${action}')`,
    `} else if (action === '${nextAction}')`
  );
}

test('P0 security PIN lock doc lists all eight readiness fixtures', () => {
  const doc = read(docPath);

  for (const fixture of [
    'locked_profile_rejects_set_list_mode',
    'locked_profile_rejects_add_whitelist_channel',
    'locked_profile_rejects_transfer_whitelist_to_blocklist',
    'child_profile_rejects_parent_policy_mutation',
    'content_script_rejects_add_filtered_channel_without_ui_owner',
    'nanah_apply_requires_target_profile_authority',
    'encrypted_import_preserves_target_profile_id',
    'sync_kids_to_main_setter_requires_unlocked_ui_or_background_authority'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }

  assert.match(doc, /securityLockAuthority/);
  assert.match(doc, /not implementation-ready/);
});

test('locked_profile_rejects_set_list_mode is not satisfied at the background mutation boundary today', () => {
  const block = backgroundActionBlock('FilterTube_SetListMode', 'addWhitelistChannelPersistent');

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /mergeAndClearBlocklistIntoWhitelist\(requestedProfile\)/);
  assert.match(block, /await browserAPI\.storage\.local\.set\(writePayload\)/);
  assert.match(block, /compiledSettingsCache\.main = null/);
  assert.match(block, /compiledSettingsCache\.kids = null/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|ensureProfileUnlocked|securityLockAuthority/);
});

test('locked_profile_rejects_add_whitelist_channel is not satisfied for main and Kids whitelist actions today', () => {
  const mainBlock = backgroundActionBlock('addWhitelistChannelPersistent', 'FilterTube_BatchImportWhitelistChannels');
  const kidsBlock = backgroundActionBlock('FilterTube_KidsWhitelistChannel', 'FilterTube_TransferWhitelistToBlocklist');

  for (const block of [mainBlock, kidsBlock]) {
    assert.match(block, /isTrustedUiSender\(sender\)/);
    assert.match(block, /handleAddFilteredChannel\(/);
    assert.match(block, /'whitelist'/);
    assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|ensureProfileUnlocked|securityLockAuthority/);
  }
});

test('locked_profile_rejects_transfer_whitelist_to_blocklist is not satisfied today', () => {
  const block = backgroundActionBlock('FilterTube_TransferWhitelistToBlocklist', 'FilterTube_ScheduleAutoBackup');

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /nextMain\.whitelistChannels = \[\]/);
  assert.match(block, /nextKids\.whitelistChannels = \[\]/);
  assert.match(block, /nextMain\.mode = 'blocklist'/);
  assert.match(block, /nextKids\.mode = 'blocklist'/);
  assert.match(block, /await browserAPI\.storage\.local\.set\(writePayload\)/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|ensureProfileUnlocked|securityLockAuthority/);
});

test('child_profile_rejects_parent_policy_mutation is UI-path partial rather than shared authority today', () => {
  const tab = read('js/tab-view.js');
  const viewingAccess = sliceBetween(
    tab,
    'async function updateProfileViewingAccess(profileId, patch) {',
    'function isUiLocked() {'
  );
  const capabilityControls = sliceBetween(
    tab,
    'function updateChildProfileCapabilityControls() {',
    'function isChildProfileAdminSurface() {'
  );

  assert.match(viewingAccess, /getProfileType\(fresh, currentActive\) === 'child'/);
  assert.match(viewingAccess, /Child profiles cannot change viewing access/);
  assert.match(viewingAccess, /currentActive === 'default'/);
  assert.match(viewingAccess, /getParentAccountId\(fresh, targetId\) === currentActive/);
  assert.match(viewingAccess, /ensureProfileUnlocked\(fresh, currentActive\)/);
  assert.match(capabilityControls, /const isChild = getActiveProfileType\(\) === 'child'/);
  assert.match(capabilityControls, /syncKidsToMainToggle\.disabled = isChild/);
  assert.doesNotMatch(`${viewingAccess}\n${capabilityControls}`, /securityLockAuthority|mutationReport|compiledSettingsRevision/);
});

test('content_script_rejects_add_filtered_channel_without_ui_owner is not satisfied in secondary listener today', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.match(block, /handleAddFilteredChannel\(/);
  assert.match(block, /message\.profile \|\| 'main'/);
  assert.match(block, /scheduleAutoBackupInBackground\(\(message\.profile === 'kids'\) \? 'kids_channel_added' : 'channel_added'\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|isAllowedYoutubeContentScript|isProfileSessionAuthorized|profile_locked|securityLockAuthority/);
});

test('nanah_apply_requires_target_profile_authority is not satisfied inside scoped apply today', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(block, /profiles\[resolvedTargetProfileId\] =/);
  assert.match(block, /await io\.saveProfilesV4\(\{/);
  assert.match(block, /return \{\s*ok: true,/);
  assert.doesNotMatch(block, /ensureProfileUnlocked|isProfileSessionAuthorized|securityLockAuthority|mutationReport|compiledSettingsRevision/);
});

test('encrypted_import_preserves_target_profile_id is not satisfied today', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'async function importV3Encrypted',
    '// ============================================================================\n    // AUTO-BACKUP SYSTEM'
  );

  assert.match(block, /const decrypted = await Security\.decryptJson\(root\.encrypted, password\)/);
  assert.match(block, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(block, /targetProfileId/);
});

test('sync_kids_to_main_setter_requires_unlocked_ui_or_background_authority is only UI-path partial today', () => {
  const stateManager = read('js/state_manager.js');
  const setterBlock = sliceBetween(
    stateManager,
    "if (key === 'syncKidsToMain') {",
    "await saveSettings();"
  );
  const tab = read('js/tab-view.js');
  const capabilityControls = sliceBetween(
    tab,
    'function updateChildProfileCapabilityControls() {',
    'function isChildProfileAdminSurface() {'
  );

  assert.match(capabilityControls, /syncKidsToMainToggle\.disabled = isChild/);
  assert.match(setterBlock, /profiles\[activeId\] = \{/);
  assert.match(setterBlock, /syncKidsToMain: !!state\.syncKidsToMain/);
  assert.match(setterBlock, /await io\.saveProfilesV4\(\{/);
  assert.match(setterBlock, /profilesV3\.main\.applyKidsRulesOnMain = !!state\.syncKidsToMain/);
  assert.match(setterBlock, /await requestRefresh\('main'\)/);
  assert.doesNotMatch(setterBlock, /isUiLocked|ensureProfileUnlocked|isProfileSessionAuthorized|securityLockAuthority|profile_locked/);
});
