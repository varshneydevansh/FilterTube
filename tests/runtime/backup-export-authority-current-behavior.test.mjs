import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_BACKUP_EXPORT_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('backup export authority audit documents split writers and future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'backupExportAuthority',
    'There are two auto-backup implementations',
    'FilterTube_ScheduleAutoBackup',
    'background scheduleAutoBackupInBackground()',
    'io_manager scheduleAutoBackup()',
    'Manual tab-view export/import',
    'tests/runtime/backup-export-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  for (const source of [
    'js/state_manager.js',
    'js/background.js',
    'js/io_manager.js',
    'js/tab-view.js',
    'js/content_bridge.js'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }
});

test('StateManager schedules backups through background or IO fallback after mutations', () => {
  const source = read('js/state_manager.js');
  const scheduler = sliceBetween(source, 'function scheduleAutoBackup(triggerType, delay = 1000) {', '// ============================================================================');

  assert.match(scheduler, /const action = 'FilterTube_ScheduleAutoBackup'/);
  assert.match(scheduler, /chrome\.runtime\.sendMessage\(\{ action, triggerType: trigger, delay \}/);
  assert.match(scheduler, /window\.FilterTubeIO\.scheduleAutoBackup\(trigger, delay\)/);
  assert.match(source, /scheduleAutoBackup\('keyword_added'\)/);
  assert.match(source, /scheduleAutoBackup\('kids_keyword_added'\)/);
  assert.match(source, /scheduleAutoBackup\('content_filters_updated'\)/);
  assert.match(source, /scheduleAutoBackup\('kids_category_filters_updated'\)/);
});

test('background schedule message currently accepts caller trigger delay and options without trusted UI guard', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "} else if (action === 'FilterTube_ScheduleAutoBackup') {",
    "} else if (action === 'fetchShortsIdentity') {"
  );

  assert.match(block, /const triggerType = typeof request\?\.triggerType === 'string' \? request\.triggerType : 'unknown'/);
  assert.match(block, /const delay = typeof request\?\.delay === 'number' && Number\.isFinite\(request\.delay\) \? request\.delay : 1000/);
  assert.match(block, /const options = request\?\.options && typeof request\.options === 'object' \? request\.options : \{\}/);
  assert.match(block, /scheduleAutoBackupInBackground\(triggerType, options, delay\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|trustedUi|allowedYoutubeContentScript|backgroundInternal/);
  assert.doesNotMatch(block, /Math\.max|Math\.min|clamp|MAX_BACKUP_DELAY|MIN_BACKUP_DELAY/);
});

test('background auto-backup owns encryption policy based on autoBackupFormat and session PIN', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    'async function createAutoBackupInBackground(triggerType, options = {}) {',
    'function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {'
  );

  assert.match(block, /settings\.autoBackupEnabled !== true/);
  assert.match(block, /const hasPin = !!extractPinVerifierFromProfilesV4\(profilesV4, activeId\)/);
  assert.match(block, /const format = typeof settings\?\.autoBackupFormat === 'string' \? settings\.autoBackupFormat : 'auto'/);
  assert.match(block, /const shouldEncrypt = \(format === 'encrypted'\) \|\| \(format !== 'plain' && hasPin\)/);
  assert.match(block, /const pin = sessionPinCache\.get\(activeId\) \|\| ''/);
  assert.match(block, /reason: 'missing_session_pin'/);
  assert.match(block, /Security\.encryptJson\(payload, pin\)/);
});

test('background auto-backup filename policy uses latest overwrite or history uniquify', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    'const mode = typeof settings?.autoBackupMode',
    'return { ok: true, filename: fullPath, downloadId: result.downloadId };'
  );

  assert.match(block, /const useHistory = mode === 'history'/);
  assert.match(block, /FilterTube-Backup-\$\{timestamp\}\.\$\{ext\}/);
  assert.match(block, /FilterTube-Backup-Latest\.\$\{ext\}/);
  assert.match(block, /filename: fullPath/);
  assert.match(block, /conflictAction: useHistory \? 'uniquify' : 'overwrite'/);
  assert.match(block, /if \(useHistory\) \{/);
  assert.match(block, /rotateAutoBackups\(10, label\)/);
});

test('IO-manager auto-backup is a separate plain-download path with its own timer and directory probe', () => {
  const source = read('js/io_manager.js');
  const createBlock = sliceBetween(
    source,
    'async function createAutoBackup(triggerType, options = {}) {',
    '/**\n     * Determines the best backup directory location'
  );
  const scheduleBlock = sliceBetween(
    source,
    'function scheduleAutoBackup(triggerType, delay = 1000) {',
    '// ============================================================================\n    // PUBLIC API'
  );
  const directoryBlock = sliceBetween(
    source,
    'async function getBackupDirectory() {',
    '/**\n     * Saves backup file using Chrome downloads API'
  );

  assert.match(createBlock, /settings\.autoBackupEnabled !== true/);
  assert.match(createBlock, /const backupData = buildV3Export/);
  assert.match(createBlock, /backupData\.meta\.backupType = 'auto'/);
  assert.match(createBlock, /backupData\.meta\.backupLocation = await getBackupDirectory\(\)/);
  assert.match(createBlock, /await saveBackupFile\(backupData, filename, options\)/);
  assert.match(createBlock, /await rotateBackups\(10\)/);
  assert.doesNotMatch(createBlock, /autoBackupFormat|sessionPinCache|encryptJson|missing_session_pin/);

  assert.match(source, /let backupScheduleTimer = null/);
  assert.match(source, /let pendingBackupTrigger = null/);
  assert.match(scheduleBlock, /pendingBackupTrigger = triggerType/);
  assert.match(scheduleBlock, /backupScheduleTimer = setTimeout/);
  assert.match(scheduleBlock, /await createAutoBackup\(pendingBackupTrigger\)/);

  assert.match(directoryBlock, /const testPath = 'FilterTube Backup\/\.test'/);
  assert.match(directoryBlock, /downloadWithRuntimeApi\(\{/);
  assert.match(directoryBlock, /runtimeAPI\.downloads\.erase\(\{ id: result\.downloadId \}\)/);
});

test('backup rotation currently erases download records rather than proving filesystem deletion', () => {
  const background = read('js/background.js');
  const io = read('js/io_manager.js');
  const backgroundRotate = sliceBetween(background, 'function rotateAutoBackups(keepCount = 10, label = \'\') {', 'function revokeBackgroundBlobUrlLater');
  const ioRotate = sliceBetween(io, 'async function rotateBackups(keepCount = 10) {', '/**\n     * Schedules a backup with debouncing');

  assert.match(backgroundRotate, /browserAPI\.downloads\.search/);
  assert.match(backgroundRotate, /browserAPI\.downloads\.erase\(\{ id: file\.id \}/);
  assert.doesNotMatch(backgroundRotate, /downloads\.removeFile|removeFile|unlink|rm\(/);

  assert.match(ioRotate, /runtimeAPI\.downloads\.search/);
  assert.match(ioRotate, /runtimeAPI\.downloads\.erase\(\{ id: file\.id \}/);
  assert.doesNotMatch(ioRotate, /downloads\.removeFile|removeFile|unlink|rm\(/);
});

test('manual export import UI has child/default gates and Firefox anchor fallback separate from auto-backup', () => {
  const source = read('js/tab-view.js');
  const downloadBlock = sliceBetween(source, 'function downloadViaAnchor(blob, filename) {', 'async function runExportV3() {');
  const exportBlock = sliceBetween(source, 'async function runExportV3() {', 'async function runExportV3Encrypted() {');
  const encryptedExportBlock = sliceBetween(source, 'async function runExportV3Encrypted() {', 'async function runImportV3FromFile(file) {');
  const importBlock = sliceBetween(source, 'async function runImportV3FromFile(file) {', 'if (ftExportV3Btn) {');

  assert.match(downloadBlock, /a\.download = filename/);
  assert.match(downloadBlock, /a\.click\(\)/);
  assert.match(downloadBlock, /preferAnchor.*IS_FIREFOX_TAB_VIEW/s);
  assert.match(downloadBlock, /runtimeAPI\.downloads\.download/);

  assert.match(exportBlock, /ensureNonChildAdminAction\('Child profiles cannot export backups from this surface\.'\)/);
  assert.match(exportBlock, /ensureAdminUnlocked\(profilesV4\)/);
  assert.match(exportBlock, /io\.exportV3\(\{ scope: ftExportActiveOnly\?\.checked \? 'active' : 'auto', auth \}\)/);

  assert.match(encryptedExportBlock, /ensureNonChildAdminAction\('Child profiles cannot export encrypted backups from this surface\.'\)/);
  assert.match(encryptedExportBlock, /showPromptModal\(\{\s*title: 'Encrypted Export Password'/);
  assert.match(encryptedExportBlock, /includeTrustedNanahState = !ftExportActiveOnly\?\.checked/);
  assert.match(encryptedExportBlock, /io\.exportV3Encrypted/);

  assert.match(importBlock, /ensureNonChildAdminAction\('Child profiles cannot import backups from this surface\.'\)/);
  assert.match(importBlock, /if \(activeId !== 'default'\)/);
  assert.match(importBlock, /Switch to Default \(Master\) to import backups/);
  assert.match(importBlock, /Security\.decryptJson\(parsed\.encrypted, password\)/);
  assert.match(importBlock, /restoreTrustedNanahState/);
  assert.match(importBlock, /io\.importV3\(payload,/);
});

test('content-script channel add and background channel add can both schedule backup for one mutation family', () => {
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const bridgeBlock = sliceBetween(
    bridge,
    'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {',
    '/**\n * Add "Filter All Content" checkbox below the blocked channel'
  );
  const backgroundBlock = sliceBetween(
    background,
    "if (message.type === 'addFilteredChannel') {",
    "if (message.type === 'toggleChannelFilterAll') {"
  );

  assert.match(bridgeBlock, /type: 'addFilteredChannel'/);
  assert.match(bridgeBlock, /FilterTube_ScheduleAutoBackup/);
  assert.match(bridgeBlock, /triggerType: 'channel_added'/);

  assert.match(backgroundBlock, /handleAddFilteredChannel/);
  assert.match(backgroundBlock, /const backupTrigger = targetListType === 'whitelist'/);
  assert.match(backgroundBlock, /scheduleAutoBackupInBackground\(backupTrigger\)/);
});

test('auto-backup policy UI writes V4 profile settings directly then schedules another backup', () => {
  const source = read('js/tab-view.js');
  const modeBlock = sliceBetween(
    source,
    "if (ftAutoBackupMode) {\n        ftAutoBackupMode.addEventListener('change', async () => {",
    'if (ftAutoBackupFormat) {'
  );
  const formatBlock = sliceBetween(
    source,
    "if (ftAutoBackupFormat) {\n        ftAutoBackupFormat.addEventListener('change', async () => {",
    '// Kids UI refs & state'
  );

  for (const block of [modeBlock, formatBlock]) {
    assert.match(block, /StateManager\.getState\(\)\?\.autoBackupEnabled !== true/);
    assert.match(block, /typeof io\.loadProfilesV4 !== 'function' \|\| typeof io\.saveProfilesV4 !== 'function'/);
    assert.match(block, /await io\.saveProfilesV4\(\{/);
    assert.match(block, /await refreshProfilesUI\(\)/);
    assert.match(block, /await scheduleAutoBackup\('setting_updated'\)/);
  }

  assert.match(modeBlock, /autoBackupMode: next/);
  assert.match(formatBlock, /autoBackupFormat: next/);
});
