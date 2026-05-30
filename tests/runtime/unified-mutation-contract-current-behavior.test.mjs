import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

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

test('unified mutation contract audit documents required future fields and current split owners', () => {
  const doc = read('docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md');

  for (const field of [
    'senderClass',
    'targetProfileId',
    'allowedStorageWrites',
    'compiledSettingsRevision',
    'broadcastScope',
    'domSideEffects',
    'resultReport'
  ]) {
    assert.match(doc, new RegExp(`\\\`${field}\\\``), `missing contract field ${field}`);
  }

  for (const file of [
    'js/background.js',
    'js/state_manager.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/content_bridge.js'
  ]) {
    assert.match(doc, new RegExp(file.replaceAll('.', '\\.')), `missing source proof ${file}`);
  }

  assert.match(
    doc,
    /one user action\s*-> one mutation report\s*-> one background-owned compiled settings revision\s*-> one scoped runtime apply/s
  );
  assert.match(doc, /ignored root capture files[\s\S]*raw evidence\s+inputs/);
});

test('current source has no central mutation contract registry or settings revision field', () => {
  const combined = [
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/content_bridge.js'
  ].map(read).join('\n');

  assert.doesNotMatch(combined, /\bbackgroundActionRegistry\b/);
  assert.doesNotMatch(combined, /\bfilterTubeMutationIntent\b/);
  assert.doesNotMatch(combined, /\bcompiledSettingsRevision\b/);
  assert.doesNotMatch(combined, /\bmutationReport\b/);
});

test('FilterTube_SetListMode currently combines storage writes cache invalidation backup and broad refresh broadcast', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    "action === 'FilterTube_SetListMode'",
    "action === 'addWhitelistChannelPersistent'"
  );

  assert.match(block, /isTrustedUiSender\(sender\)/);
  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true;/);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/s);
  assert.match(block, /browserAPI\.storage\.local\.set\(writePayload\)/);
  assert.match(block, /compiledSettingsCache\.main = null;/);
  assert.match(block, /compiledSettingsCache\.kids = null;/);
  assert.match(block, /scheduleAutoBackupInBackground\('mode_changed'\)/);
  assert.match(block, /browserAPI\.tabs\.query\(\{ url: urlPattern \}/);
  assert.match(block, /FilterTube_RefreshNow/);
  assert.doesNotMatch(block, /mutationReport|compiledSettingsRevision|allowedStorageWrites/);
});

test('StateManager currently pushes caller compiled settings through FilterTube_ApplySettings instead of background revision', () => {
  const stateManager = read('js/state_manager.js');
  const saveBlock = sliceBetween(stateManager, 'async function saveSettings', 'async function ensureLoaded');
  const broadcastBlock = sliceBetween(stateManager, 'function broadcastSettings', 'async function requestRefresh');
  const refreshBlock = sliceBetween(stateManager, 'async function requestRefresh', 'function delay');

  assert.match(saveBlock, /if \(isSaving\) return;/);
  assert.match(saveBlock, /SettingsAPI\.saveSettings/);
  assert.match(saveBlock, /broadcastSettings\(result\.compiledSettings, profile\)/);
  assert.match(broadcastBlock, /action:\s*'FilterTube_ApplySettings'/);
  assert.match(broadcastBlock, /settings:\s*compiledSettings/);
  assert.match(broadcastBlock, /profile:\s*profile/);
  assert.match(refreshBlock, /action:\s*'getCompiledSettings'/);
  assert.match(refreshBlock, /forceRefresh:\s*true/);
  assert.match(refreshBlock, /broadcastSettings\(compiled, profile\)/);
  assert.doesNotMatch(`${saveBlock}\n${broadcastBlock}\n${refreshBlock}`, /compiledSettingsRevision|mutationReport/);
});

test('import and Nanah apply paths write profile state without shared mutation report', () => {
  const io = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const loadProfilesV4 = sliceBetween(io, 'async function loadProfilesV4', 'async function saveProfilesV4');
  const nanahScoped = sliceBetween(nanah, 'async function applyScopedPortablePayload', 'function generateId');

  assert.match(loadProfilesV4, /writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: sanitized \}\)/);
  assert.match(loadProfilesV4, /writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: migrated \}\)/);
  assert.match(io, /await saveProfilesV3\(nextProfiles\)/);
  assert.match(io, /await saveProfilesV4\(\{/);
  assert.match(io, /writeStorage\(\{ channelMap: nextChannelMap \}\)/);
  assert.match(io, /incomingNanahState|restoreTrustedNanahState/);
  assert.match(nanahScoped, /io\.loadProfilesV4/);
  assert.match(nanahScoped, /io\.saveProfilesV4/);
  assert.doesNotMatch(`${loadProfilesV4}\n${nanahScoped}`, /mutationReport|compiledSettingsRevision/);
});

test('learned identity and stats mutations currently lack shared sender class revision and side-effect budgets', () => {
  const background = read('js/background.js');
  const contentBridge = read('js/content_bridge.js');
  const learnedBlock = sliceBetween(
    background,
    'request.action === "updateChannelMap"',
    'request.action === "fetchChannelDetails"'
  );
  const persistBlock = sliceBetween(contentBridge, 'function persistVideoChannelMapping', 'function persistVideoMetaMapping');
  const stampBlock = sliceBetween(contentBridge, 'function stampChannelIdentity', 'function resetCardIdentityIfStale');

  assert.match(learnedBlock, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(learnedBlock, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(learnedBlock, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);
  assert.match(learnedBlock, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.match(persistBlock, /action:\s*'updateVideoChannelMap'/);
  assert.match(stampBlock, /applyDOMFallback\(null\)/);
  assert.doesNotMatch(`${learnedBlock}\n${persistBlock}\n${stampBlock}`, /compiledSettingsRevision|mutationReport|domSideEffects|statsSideEffects|senderClass/);
});
