import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

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
  'locked_profile_rejects_set_list_mode',
  'locked_profile_rejects_add_whitelist_channel',
  'locked_profile_rejects_transfer_whitelist_to_blocklist',
  'settings_mode_locked_profile_rejects_all_rule_mutations',
  'rule_mutation_report_exists_for_kids_block_and_whitelist',
  'rule_mutation_report_exists_for_list_mode_transfer',
  'rule_mutation_report_exists_for_nanah_scoped_apply',
  'encrypted_import_preserves_target_profile_id',
  'nanah_envelope_requires_filtertube_app_action_version'
];

test('P0 settings mutation audit documents fixture families and current blocked verdict', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md');
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const settingsMatrix = read('docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md');
  const ruleMutation = read('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md');
  const importNanah = read('docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md');

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing fixture in doc ${fixture}`);
  }

  for (const fixture of [
    'locked_profile_rejects_set_list_mode',
    'locked_profile_rejects_add_whitelist_channel',
    'locked_profile_rejects_transfer_whitelist_to_blocklist',
    'encrypted_import_preserves_target_profile_id',
    'rule_mutation_report_exists_for_kids_block_and_whitelist',
    'rule_mutation_report_exists_for_nanah_scoped_apply'
  ]) {
    assert.ok(readiness.includes(fixture), `readiness gate should keep ${fixture}`);
  }

  assert.ok(settingsMatrix.includes('settings_mode_locked_profile_rejects_all_rule_mutations'));
  assert.ok(ruleMutation.includes('rule_mutation_report_exists_for_list_mode_transfer'));
  assert.ok(ruleMutation.includes('encrypted_import_preserves_target_profile_id'));
  assert.ok(importNanah.includes('Nanah envelope parsing'));

  for (const phrase of [
    'P0 settings/mutation slice is not green',
    'Runtime behavior remains unchanged',
    'locked profile',
    'target profile',
    'dry-run mutation report'
  ]) {
    assert.ok(doc.includes(phrase), `missing verdict phrase ${phrase}`);
  }
});

test('locked_profile_rejects_set_list_mode is not enforced in the SetListMode branch today', () => {
  const block = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(writePayload\)/);
  assert.match(block, /scheduleAutoBackupInBackground\('mode_changed'\)/);
  assert.match(block, /FilterTube_RefreshNow/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|sessionPinCache|lockAuthority/);
});

test('locked_profile_rejects_add_whitelist_channel is not enforced in the single-channel branch today', () => {
  const block = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'addWhitelistChannelPersistent')",
    "} else if (action === 'FilterTube_BatchImportWhitelistChannels')"
  );

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /handleAddFilteredChannel\(/);
  assert.match(block, /'main'/);
  assert.match(block, /'whitelist'/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|sessionPinCache|lockAuthority/);
});

test('locked_profile_rejects_transfer_whitelist_to_blocklist is not enforced today', () => {
  const block = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')",
    "} else if (action === 'fetchShortsIdentity')"
  );

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /nextMain\.channels = dedupeChannels\(\[\.\.\.blockedChannels, \.\.\.whitelistChannels\]\)/);
  assert.match(block, /nextMain\.whitelistChannels = \[\]/);
  assert.match(block, /nextKids\.blockedChannels = dedupeChannels\(\[\.\.\.blockedChannels, \.\.\.whitelistChannels\]\)/);
  assert.match(block, /nextKids\.whitelistChannels = \[\]/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|sessionPinCache|lockAuthority|dryRun|mutationReport/);
});

test('settings_mode_locked_profile_rejects_all_rule_mutations is only partial today', () => {
  const source = read('js/background.js');
  const batchImport = sliceBetween(
    source,
    "} else if (action === 'FilterTube_BatchImportWhitelistChannels')",
    "} else if (action === 'FilterTube_KidsWhitelistChannel')"
  );
  const setListMode = sliceBetween(
    source,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
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

  assert.match(batchImport, /isProfileSessionAuthorized\(profilesV4, targetProfileId\)/);
  assert.match(batchImport, /errorCode: 'profile_locked'/);

  for (const block of [setListMode, kidsWhitelist, kidsBlock]) {
    assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|lockAuthority/);
  }
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

  for (const block of [kidsWhitelist, kidsBlock]) {
    assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|settingsRevision|lockAuthority/);
  }
});

test('rule_mutation_report_exists_for_list_mode_transfer is not satisfied today', () => {
  const setListMode = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.match(setListMode, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(setListMode, /mergeAndClearBlocklistIntoWhitelist\(requestedProfile\)/);
  assert.match(setListMode, /compiledSettingsCache\.main = null/);
  assert.match(setListMode, /compiledSettingsCache\.kids = null/);
  assert.match(setListMode, /scheduleAutoBackupInBackground\('mode_changed'\)/);
  assert.doesNotMatch(setListMode, /dryRun|mutationReport|settingsRevision|rollback|migrationPlan/);
});

test('encrypted_import_preserves_target_profile_id is not satisfied today', () => {
  const source = read('js/io_manager.js');
  const encrypted = sliceBetween(
    source,
    'async function importV3Encrypted',
    '// ============================================================================\n    // AUTO-BACKUP SYSTEM'
  );
  const importV3 = sliceBetween(
    source,
    'async function importV3(json',
    'const rawRoot = safeObject(json);'
  );

  assert.match(importV3, /targetProfileId = null/);
  assert.match(importV3, /const requestedTargetProfileId = normalizeString\(targetProfileId\)/);

  assert.match(encrypted, /async function importV3Encrypted\(container, \{ password = '', strategy = 'merge', scope = 'auto', auth = null \} = \{\}\)/);
  assert.match(encrypted, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(encrypted, /targetProfileId/);
});

test('nanah_envelope_requires_filtertube_app_action_version is not satisfied today', () => {
  const block = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'function extractPortableFromEnvelope(envelope) {',
    'async function applyIncomingEnvelope'
  );

  assert.match(block, /root\.t === 'app_sync'/);
  assert.match(block, /JSON\.parse\(root\.payload\)/);
  assert.match(block, /root\.t === 'control_proposal'/);
  assert.match(block, /proposal\.portable/);
  assert.doesNotMatch(block, /root\.app|proposal\.app|payloadVersion|proposal\.action|filtertube\.apply_sync_payload|validateEnvelope|allowedAction/);
});

test('rule_mutation_report_exists_for_nanah_scoped_apply is not satisfied today', () => {
  const block = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /const activeId = normalizeString\(profilesV4\.activeProfileId\) \|\| 'default'/);
  assert.match(block, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(block, /await io\.saveProfilesV4\(/);
  assert.match(block, /return \{\s*ok: true,\s*scope,\s*profileId: resolvedTargetProfileId,\s*strategy:/);
  assert.doesNotMatch(block, /ruleMutationAuthority|mutationReport|settingsRevision|lockAuthority|previewConfirmed|broadcast|refresh/);
});
