import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_BACKUP_EXPORT_CURRENT_BEHAVIOR_2026-05-19.md';

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

function backgroundScheduleMessageBlock() {
  return sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_ScheduleAutoBackup') {",
    "} else if (action === 'fetchShortsIdentity') {"
  );
}

function backgroundSchedulerBlock() {
  return sliceBetween(
    read('js/background.js'),
    'function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {',
    'function shouldWaitForPostBlockEnrichmentBeforeBackup(triggerType, options = {}) {'
  );
}

function backgroundCreateBackupBlock() {
  return sliceBetween(
    read('js/background.js'),
    'async function createAutoBackupInBackground(triggerType, options = {}) {',
    'function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {'
  );
}

function ioCreateBackupBlock() {
  return sliceBetween(
    read('js/io_manager.js'),
    'async function createAutoBackup(triggerType, options = {}) {',
    '/**\n     * Determines the best backup directory location'
  );
}

function ioDirectoryProbeBlock() {
  return sliceBetween(
    read('js/io_manager.js'),
    'async function getBackupDirectory() {',
    '/**\n     * Saves backup file using Chrome downloads API'
  );
}

function importV3Block() {
  return sliceBetween(
    read('js/io_manager.js'),
    'async function importV3(json, { strategy = \'merge\', scope = \'auto\', auth = null, targetProfileId = null } = {}) {',
    'async function exportV3Encrypted'
  );
}

function importV3EncryptedBlock() {
  return sliceBetween(
    read('js/io_manager.js'),
    'async function importV3Encrypted(container, { password = \'\', strategy = \'merge\', scope = \'auto\', auth = null } = {}) {',
    '// ============================================================================\n    // PUBLIC API'
  );
}

function manualImportBlock() {
  return sliceBetween(
    read('js/tab-view.js'),
    'async function runImportV3FromFile(file) {',
    'if (ftExportV3Btn) {'
  );
}

test('P0 backup export current-behavior doc lists all twelve readiness fixtures', () => {
  const doc = read(docPath);

  for (const fixture of [
    'backup_schedule_rejects_untrusted_sender_or_non_internal_actor',
    'backup_schedule_clamps_delay_to_known_range',
    'backup_schedule_dedupes_same_mutation_trigger',
    'backup_auto_encryption_policy_matches_manual_export_policy',
    'backup_auto_missing_session_pin_reports_visible_skip',
    'backup_io_and_background_paths_share_one_filename_policy',
    'backup_rotation_policy_does_not_claim_file_deletion_without_remove_proof',
    'backup_directory_probe_does_not_write_test_file_per_backup',
    'backup_manual_export_child_gate_and_master_pin_gate_are_consistent',
    'backup_import_encrypted_and_plain_share_target_profile_contract',
    'backup_trusted_nanah_restore_requires_explicit_same_device_choice',
    'backup_after_import_or_nanah_apply_refreshes_compiled_runtime_revision'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }

  assert.match(doc, /Status: current-behavior proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /backupExportAuthority/);
});

test('backup_schedule_rejects_untrusted_sender_or_non_internal_actor is not satisfied today', () => {
  const block = backgroundScheduleMessageBlock();

  assert.match(block, /action === 'FilterTube_ScheduleAutoBackup'/);
  assert.match(block, /scheduleAutoBackupInBackground\(triggerType, options, delay\)/);
  assert.match(block, /sendResponse\?\.\(\{ ok: true \}\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|trustedUi|senderClass|sender\.url|backgroundInternal|allowedYoutubeContentScript/);
});

test('backup_schedule_clamps_delay_to_known_range is not satisfied today', () => {
  const messageBlock = backgroundScheduleMessageBlock();
  const scheduler = backgroundSchedulerBlock();

  assert.match(messageBlock, /Number\.isFinite\(request\.delay\) \? request\.delay : 1000/);
  assert.match(scheduler, /setTimeout\(async \(\) => \{/);
  assert.match(scheduler, /\}, delay\)/);
  assert.doesNotMatch(`${messageBlock}\n${scheduler}`, /Math\.max|Math\.min|clamp|MAX_BACKUP_DELAY|MIN_BACKUP_DELAY/);
});

test('backup_schedule_dedupes_same_mutation_trigger is only timer-overwrite today', () => {
  const scheduler = backgroundSchedulerBlock();

  assert.match(scheduler, /pendingAutoBackupTrigger = triggerType/);
  assert.match(scheduler, /pendingAutoBackupOptions = options/);
  assert.match(scheduler, /if \(autoBackupTimer\) \{\s*clearTimeout\(autoBackupTimer\);/);
  assert.doesNotMatch(scheduler, /mutationId|mutationRevision|dedupeKey|triggerQueue|sameMutation|Set\(/);
});

test('backup_auto_encryption_policy_matches_manual_export_policy is split today', () => {
  const backgroundCreate = backgroundCreateBackupBlock();
  const ioCreate = ioCreateBackupBlock();
  const tabView = read('js/tab-view.js');
  const encryptedExportBlock = sliceBetween(
    tabView,
    'async function runExportV3Encrypted() {',
    'async function runImportV3FromFile(file) {'
  );

  assert.match(backgroundCreate, /const format = typeof settings\?\.autoBackupFormat === 'string' \? settings\.autoBackupFormat : 'auto'/);
  assert.match(backgroundCreate, /const shouldEncrypt = \(format === 'encrypted'\) \|\| \(format !== 'plain' && hasPin\)/);
  assert.match(backgroundCreate, /const pin = sessionPinCache\.get\(activeId\) \|\| ''/);
  assert.match(encryptedExportBlock, /showPromptModal\(\{\s*title: 'Encrypted Export Password'/);
  assert.match(encryptedExportBlock, /io\.exportV3Encrypted/);
  assert.doesNotMatch(ioCreate, /autoBackupFormat|sessionPinCache|encryptJson|missing_session_pin/);
});

test('backup_auto_missing_session_pin_reports_visible_skip is not satisfied today', () => {
  const create = backgroundCreateBackupBlock();
  const scheduler = backgroundSchedulerBlock();

  assert.match(create, /reason: 'missing_session_pin'/);
  assert.match(scheduler, /await createAutoBackupInBackground\(trigger, opts \|\| \{\}\)/);
  assert.match(scheduler, /console\.warn\('FilterTube Background: Auto-backup failed', e\)/);
  assert.doesNotMatch(scheduler, /missing_session_pin|UIComponents|notifications|sendResponse|visibleResult|showToast/);
});

test('backup_io_and_background_paths_share_one_filename_policy is not satisfied today', () => {
  const backgroundCreate = backgroundCreateBackupBlock();
  const ioCreate = ioCreateBackupBlock();

  assert.match(backgroundCreate, /FilterTube-Backup-\$\{timestamp\}\.\$\{ext\}/);
  assert.match(backgroundCreate, /FilterTube-Backup-Latest\.\$\{ext\}/);
  assert.match(backgroundCreate, /const fullPath = `FilterTube Backup\/\$\{label\}\/\$\{fileName\}`/);
  assert.match(ioCreate, /const filename = `FilterTube-Backup-\$\{label\}-\$\{timestamp\}\.json`/);
  assert.doesNotMatch(ioCreate, /FilterTube-Backup-Latest|autoBackupMode|conflictAction: useHistory/);
});

test('backup_rotation_policy_does_not_claim_file_deletion_without_remove_proof is current limitation', () => {
  const background = read('js/background.js');
  const io = read('js/io_manager.js');
  const backgroundRotate = sliceBetween(background, 'function rotateAutoBackups(keepCount = 10, label = \'\') {', 'function revokeBackgroundBlobUrlLater');
  const ioRotate = sliceBetween(io, 'async function rotateBackups(keepCount = 10) {', '/**\n     * Schedules a backup with debouncing');

  assert.match(backgroundRotate, /browserAPI\.downloads\.erase\(\{ id: file\.id \}/);
  assert.match(ioRotate, /runtimeAPI\.downloads\.erase\(\{ id: file\.id \}/);
  assert.doesNotMatch(`${backgroundRotate}\n${ioRotate}`, /downloads\.removeFile|removeFile|unlink|rm\(/);
});

test('backup_directory_probe_does_not_write_test_file_per_backup is not satisfied in IO path today', () => {
  const create = ioCreateBackupBlock();
  const directory = ioDirectoryProbeBlock();

  assert.match(create, /backupData\.meta\.backupLocation = await getBackupDirectory\(\)/);
  assert.match(directory, /const testPath = 'FilterTube Backup\/\.test'/);
  assert.match(directory, /downloadWithRuntimeApi\(\{/);
  assert.match(directory, /runtimeAPI\.downloads\.erase\(\{ id: result\.downloadId \}\)/);
});

test('backup_manual_export_child_gate_and_master_pin_gate_are_consistent only in manual UI today', () => {
  const tabView = read('js/tab-view.js');
  const exportBlock = sliceBetween(tabView, 'async function runExportV3() {', 'async function runExportV3Encrypted() {');
  const encryptedExportBlock = sliceBetween(tabView, 'async function runExportV3Encrypted() {', 'async function runImportV3FromFile(file) {');
  const importBlock = manualImportBlock();
  const backgroundMessage = backgroundScheduleMessageBlock();
  const ioCreate = ioCreateBackupBlock();

  assert.match(exportBlock, /ensureNonChildAdminAction\('Child profiles cannot export backups from this surface\.'\)/);
  assert.match(exportBlock, /ensureAdminUnlocked\(profilesV4\)/);
  assert.match(encryptedExportBlock, /ensureNonChildAdminAction\('Child profiles cannot export encrypted backups from this surface\.'\)/);
  assert.match(encryptedExportBlock, /ensureAdminUnlocked\(profilesV4\)/);
  assert.match(importBlock, /ensureNonChildAdminAction\('Child profiles cannot import backups from this surface\.'\)/);
  assert.match(importBlock, /Switch to Default \(Master\) to import backups/);
  assert.doesNotMatch(`${backgroundMessage}\n${ioCreate}`, /ensureNonChildAdminAction|ensureAdminUnlocked|sessionMasterPin|Switch to Default/);
});

test('backup_import_encrypted_and_plain_share_target_profile_contract is not satisfied today', () => {
  const plain = importV3Block();
  const encrypted = importV3EncryptedBlock();

  assert.match(plain, /async function importV3\(json, \{ strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null \} = \{\}\)/);
  assert.match(plain, /const requestedTargetProfileId = normalizeString\(targetProfileId\)/);
  assert.match(plain, /const explicitTargetProfileId = effectiveScope === 'full' \? '' : requestedTargetProfileId/);
  assert.match(encrypted, /async function importV3Encrypted\(container, \{ password = '', strategy = 'merge', scope = 'auto', auth = null \} = \{\}\)/);
  assert.match(encrypted, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(encrypted, /targetProfileId/);
});

test('backup_trusted_nanah_restore_requires_explicit_same_device_choice is UI-only partial today', () => {
  const importBlock = manualImportBlock();
  const ioImport = importV3Block();

  assert.match(importBlock, /title: 'Restore Trusted Devices Too\?'/);
  assert.match(importBlock, /Use this only when restoring the same device after reinstall or local data loss\./);
  assert.match(importBlock, /recommended: true/);
  assert.match(importBlock, /restoreTrustedNanahState = restoreChoice === 'restore_trust'/);
  assert.match(ioImport, /auth\?\.restoreTrustedNanahState === true/);
  assert.match(ioImport, /await writeStorage\(nanahPayload\)/);
  assert.doesNotMatch(`${importBlock}\n${ioImport}`, /sameDeviceToken|deviceFingerprint|confirmDeviceId|hardwareKey|deviceAttestation/);
});

test('backup_after_import_or_nanah_apply_refreshes_compiled_runtime_revision is not satisfied today', () => {
  const tabImport = manualImportBlock();
  const ioImport = importV3Block();
  const nanah = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'async function applyScopedPortablePayload(io, portable, { strategy = \'merge\', targetProfileId = null } = {}) {',
    'function generateId() {'
  );

  assert.match(tabImport, /await StateManager\.loadSettings\(\)/);
  assert.match(ioImport, /await saveProfilesV4\(\{/);
  assert.match(nanah, /await io\.saveProfilesV4\(\{/);
  assert.match(nanah, /return \{\s*ok: true,\s*scope,\s*profileId: resolvedTargetProfileId,\s*strategy: replace \? 'replace' : 'merge'\s*\}/);
  assert.doesNotMatch(`${ioImport}\n${nanah}`, /compiledSettingsRevision|runtimeRevision|mutationReport|FilterTube_ApplySettings|broadcastCompiledSettings/);
});
