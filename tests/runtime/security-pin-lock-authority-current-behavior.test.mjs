import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md';

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

test('security PIN lock audit documents current authority boundaries and required future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Current PIN Primitives',
    'Background Session Cache',
    'Mutation Paths With Session Checks',
    'Mutation Paths Without A Shared Lock Contract',
    'UI Lock Gate',
    'Import, Export, And Nanah Boundary',
    'Profile/PIN Mutation Gate Snapshot - 2026-05-27',
    'securityLockAuthority',
    'locked_profile_rejects_set_list_mode',
    'profile/PIN mutation authority approval: NO-GO',
    'managed child mutation authority approval: NO-GO',
    'import/Nanah trust restoration authority approval: NO-GO',
    'runtime behavior changed by this addendum: no',
    'flowchart TD'
  ]) {
    assert.ok(doc.includes(marker), `missing audit marker ${marker}`);
  }

  for (const source of [
    'js/security_manager.js',
    'js/background.js',
    'js/state_manager.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/tab-view.js',
    'js/popup.js'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }

  for (const pinnedSource of [
    '`js/tab-view.js:3000-3106`',
    '`js/tab-view.js:3909-3932`',
    '`js/tab-view.js:8357-8397`',
    '`js/tab-view.js:9720-9784`',
    '`js/tab-view.js:9787-9905`',
    '`js/tab-view.js:9908-10013`',
    '`js/tab-view.js:10016-10140`',
    '`js/tab-view.js:4207-4278`',
    '`js/tab-view.js:9132-9391`',
    '`js/io_manager.js:1241-1289`',
    '`js/io_manager.js:1691-1770`',
    '`js/nanah_sync_adapter.js:186-277`'
  ]) {
    assert.ok(doc.includes(pinnedSource), `missing pinned source ${pinnedSource}`);
  }
});

test('security manager currently uses PBKDF2 SHA-256 and AES-GCM for PIN verifier and encrypted JSON', () => {
  const source = read('js/security_manager.js');

  const verifierBlock = sliceBetween(
    source,
    'async function createPinVerifier',
    'async function verifyPin'
  );
  const verifyBlock = sliceBetween(
    source,
    'async function verifyPin',
    'async function encryptJson'
  );
  const encryptBlock = sliceBetween(
    source,
    'async function encryptJson',
    'async function decryptJson'
  );
  const decryptBlock = sliceBetween(
    source,
    'async function decryptJson',
    'global.FilterTubeSecurity'
  );

  assert.match(verifierBlock, /iterations = 150000/);
  assert.match(verifierBlock, /randomBytes\(16\)/);
  assert.match(verifierBlock, /kdf: 'PBKDF2'/);
  assert.match(verifierBlock, /hashAlg: 'SHA-256'/);
  assert.match(verifyBlock, /deriveBitsPBKDF2\(pin, salt, iterations, 256\)/);
  assert.match(encryptBlock, /randomBytes\(12\)/);
  assert.match(encryptBlock, /AES-GCM/);
  assert.match(decryptBlock, /Unsupported KDF/);
  assert.match(decryptBlock, /Unsupported cipher/);
});

test('background currently has a session PIN cache but only explicit callers consult it', () => {
  const source = read('js/background.js');

  assert.match(source, /const sessionPinCache = new Map\(\)/);
  assert.match(source, /function isProfileSessionAuthorized\(profilesV4, profileId\)/);
  assert.match(source, /return sessionPinCache\.has\(profileId\)/);
  assert.match(source, /async function verifyAndCacheSessionPin\(profileId, pin\)/);
  assert.match(source, /sessionPinCache\.set\(profileId, pin\)/);
});

test('SessionPinAuth and ClearSessionPin are trusted UI guarded', () => {
  const source = read('js/background.js');
  const authBlock = sliceBetween(
    source,
    "} else if (action === 'FilterTube_SessionPinAuth')",
    "} else if (action === 'FilterTube_ClearSessionPin')"
  );
  const clearBlock = sliceBetween(
    source,
    "} else if (action === 'FilterTube_ClearSessionPin')",
    "} else if (action === 'FilterTube_SetListMode')"
  );

  assert.match(authBlock, /isTrustedUiSender\(sender\)/);
  assert.match(authBlock, /verifyAndCacheSessionPin\(profileId, pin\)/);
  assert.match(clearBlock, /isTrustedUiSender\(sender\)/);
  assert.match(clearBlock, /sessionPinCache\.delete\(profileId\)/);
});

test('BatchImportWhitelistChannels currently checks active target and session authorization', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "} else if (action === 'FilterTube_BatchImportWhitelistChannels')",
    "} else if (action === 'FilterTube_KidsWhitelistChannel')"
  );

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /activeId !== targetProfileId/);
  assert.match(block, /isProfileSessionAuthorized\(profilesV4, targetProfileId\)/);
  assert.match(block, /errorCode: 'profile_locked'/);
});

test('SetListMode and whitelist mutation paths currently lack background session authorization checks', () => {
  const source = read('js/background.js');
  const setMode = sliceBetween(
    source,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
  const addWhitelist = sliceBetween(
    source,
    "} else if (action === 'addWhitelistChannelPersistent')",
    "} else if (action === 'FilterTube_BatchImportWhitelistChannels')"
  );
  const kidsWhitelist = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsWhitelistChannel')",
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"
  );
  const transfer = sliceBetween(
    source,
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')",
    "} else if (action === 'FilterTube_ScheduleAutoBackup')"
  );

  for (const block of [setMode, addWhitelist, kidsWhitelist, transfer]) {
    assert.match(block, /isTrustedUiSender\(sender\)/);
    assert.doesNotMatch(block, /isProfileSessionAuthorized/);
    assert.doesNotMatch(block, /profile_locked/);
  }

  assert.match(setMode, /mergeAndClearBlocklistIntoWhitelist\(requestedProfile\)/);
  assert.match(transfer, /nextMain\.whitelistChannels = \[\]/);
});

test('secondary addFilteredChannel listener currently mutates channel rules without trusted UI sender or lock checks', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.match(block, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.doesNotMatch(block, /isProfileSessionAuthorized/);
  assert.doesNotMatch(block, /profile_locked/);
});

test('import export paths currently enforce Master PIN only for Default full-target authority', () => {
  const source = read('js/io_manager.js');
  const exportBlock = sliceBetween(
    source,
    'async function exportV3',
    'async function importV3'
  );
  const importBlock = sliceBetween(
    source,
    'async function importV3',
    'let incomingProfileForImport = null;'
  );
  const encryptedBlock = sliceBetween(
    source,
    'async function importV3Encrypted',
    '// ============================================================================\n    // AUTO-BACKUP SYSTEM'
  );

  assert.match(exportBlock, /activeId === DEFAULT_PROFILE_ID && masterVerifier/);
  assert.match(exportBlock, /auth\?\.localMasterPin/);
  assert.match(importBlock, /effectiveLocalTargetId === DEFAULT_PROFILE_ID && localMasterVerifier/);
  assert.match(importBlock, /auth\?\.localMasterPin/);
  assert.match(importBlock, /effectiveLocalTargetId === DEFAULT_PROFILE_ID && incomingMasterVerifier/);
  assert.match(importBlock, /auth\?\.incomingMasterPin/);
  assert.match(encryptedBlock, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(encryptedBlock, /targetProfileId/);
});

test('Nanah scoped apply currently writes profiles directly without an internal lock authority', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(block, /await io\.saveProfilesV4\(\{/);
  assert.doesNotMatch(block, /isUiLocked|ensureAdminUnlocked|ensureProfileUnlocked|Security|Pin|PIN|isProfileSessionAuthorized/);
});

test('tab UI currently has lock gates for navigation list mode and row add actions', () => {
  const source = read('js/tab-view.js');
  const lockGate = sliceBetween(
    source,
    'function applyLockGateIfNeeded()',
    'async function showPromptModal'
  );
  const modeBlock = sliceBetween(
    source,
    'const handleModeToggle = async () =>',
    "toggle.addEventListener('click', handleModeToggle)"
  );
  const addKeyword = sliceBetween(
    source,
    'if (addKeywordBtn) {',
    'if (keywordInput) {'
  );
  const addChannel = sliceBetween(
    source,
    'if (addChannelBtn) {',
    'if (channelInput) {'
  );

  assert.match(lockGate, /ft-app-locked/);
  assert.match(lockGate, /ensureProfileUnlocked\(profilesV4Cache, activeProfileId\)/);
  assert.match(modeBlock, /if \(isUiLocked\(\)\)/);
  assert.match(addKeyword, /if \(isUiLocked\(\)\) return/);
  assert.match(addChannel, /if \(isUiLocked\(\)\) return/);

  assert.match(source, /let sessionMasterPin = ''/);
  assert.match(source, /const unlockedProfiles = new Set\(\)/);
  assert.match(source, /async function notifyBackgroundUnlocked\(profileId, pin = ''\)/);
  assert.match(source, /async function ensureProfileUnlocked\(profilesV4, profileId\)/);
  assert.match(source, /async function ensureAdminUnlocked\(profilesV4\)/);
  assert.match(source, /function ensureNonChildAdminAction/);
  assert.match(source, /async function saveManagedChildSurface\(surface, mutator\)/);
});
