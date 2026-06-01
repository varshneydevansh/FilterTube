import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

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

const mutationFixtures = [
  'set_list_mode_copy_false_does_not_clear_blocklist',
  'apply_settings_payload_cannot_override_background_revision',
  'two_mutations_during_save_are_not_dropped',
  'v3_to_v4_preserves_modes_and_whitelists'
];
const p0MethodGapDocs = [
  'docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md'
];

test('P0 mutation audit documents fixture family and current non-green verdict', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md');
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const messageDoc = read('docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md');
  const settingsDoc = read('docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const fixture of mutationFixtures) {
    assert.ok(doc.includes(fixture), `missing mutation fixture in doc ${fixture}`);
    assert.ok(readiness.includes(fixture), `readiness gate should keep ${fixture}`);
  }

  for (const fixture of [
    'set_list_mode_copy_false_does_not_clear_blocklist',
    'apply_settings_payload_cannot_override_background_revision'
  ]) {
    assert.ok(messageDoc.includes(fixture), `message proof should still contain overlap fixture ${fixture}`);
  }

  assert.ok(settingsDoc.includes('rule_mutation_report_exists_for_list_mode_transfer'));

  for (const phrase of [
    'P0 mutation/revision slice is not green',
    'Runtime behavior remains unchanged',
    'dry-run mutation plan',
    'queued/merged/retried save status',
    'background compile/cache revision'
  ]) {
    assert.ok(doc.includes(phrase), `missing mutation contract phrase ${phrase}`);
  }
});

test('P0 mutation and security gates carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5681',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5681',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of p0MethodGapDocs) {
    const text = read(auditDoc);
    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5681',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5681',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'runtime optimization or JSON-first promotion',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('set_list_mode_copy_false_does_not_clear_blocklist is not satisfied by current SetListMode branch', () => {
  const block = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(block, /const mergeAndClearBlocklistIntoWhitelist = \(scope\) => \{/);
  assert.match(block, /nextKids\.blockedChannels = \[\]/);
  assert.match(block, /nextKids\.blockedKeywords = \[\]/);
  assert.match(block, /nextMain\.channels = \[\]/);
  assert.match(block, /nextMain\.keywords = \[\]/);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
  assert.doesNotMatch(block, /if \(shouldCopyBlocklist\)[\s\S]{0,180}mergeAndClearBlocklistIntoWhitelist/);
  assert.doesNotMatch(block, /dryRun|mutationPlan|mutationReport|settingsRevision/);
});

test('apply_settings_payload_cannot_override_background_revision now recompiles before broadcast', () => {
  const block = sliceBetween(
    read('js/background.js'),
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.match(block, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.match(block, /sendResponse\(\{ acknowledged: true, profile: targetProfile \}\)/);
  assert.doesNotMatch(block, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings|settingsRevision|backgroundRevision|mutationReport|isTrustedUiSender/);
});

test('two_mutations_during_save_are_not_dropped is not satisfied by StateManager.saveSettings today', () => {
  const block = sliceBetween(
    read('js/state_manager.js'),
    "async function saveSettings({ broadcast = true, profile = 'main' } = {})",
    '/**\n     * Ensure settings are loaded before operations'
  );

  assert.match(block, /if \(isSaving\) return;/);
  assert.match(block, /isSaving = true;/);
  assert.match(block, /SettingsAPI\.saveSettings\(\{/);
  assert.match(block, /finally \{\s*isSaving = false;\s*\}/);
  assert.doesNotMatch(block, /pendingSave|queuedSave|saveAgain|retry|mutationQueue|revision|dirtyWhileSaving/);
});

test('v3_to_v4_preserves_modes_and_whitelists is not satisfied by settings_shared read migration', () => {
  const block = sliceBetween(
    read('js/settings_shared.js'),
    'function buildProfilesV4FromLegacyState(storage, mainChannels, mainKeywords) {',
    'function sanitizeKeywordEntry(entry, overrides = {}) {'
  );

  assert.match(block, /const profilesV3 = safeObject\(storage\?\.\[FT_PROFILES_V3_KEY\]\)/);
  assert.match(block, /const kidsV3 = safeObject\(profilesV3\.kids\)/);
  assert.match(block, /const mainV3 = safeObject\(profilesV3\.main\)/);
  assert.match(block, /main:\s*\{\s*mode: 'blocklist'/);
  assert.match(block, /whitelistChannels: \[\]/);
  assert.match(block, /whitelistKeywords: \[\]/);
  assert.match(block, /kids:\s*\{\s*mode: 'blocklist'/);
  assert.match(block, /blockedChannels: safeArray\(kidsV3\.blockedChannels\)/);
  assert.match(block, /blockedKeywords: safeArray\(kidsV3\.blockedKeywords\)/);
  assert.doesNotMatch(block, /mainV3\.mode|mainV3\.whitelistedChannels|mainV3\.whitelistChannels|kidsV3\.mode|kidsV3\.whitelistedChannels|kidsV3\.whitelistChannels/);
  assert.doesNotMatch(block, /migrationReport|settingsRevision|schemaMigrationAuthority/);
});

test('read-path V3-to-V4 migration writes storage without one mutation authority report', () => {
  const loadBlock = sliceBetween(
    read('js/settings_shared.js'),
    'function loadSettings() {',
    'function saveSettings(options = {}) {'
  );

  assert.match(loadBlock, /if \(!hasProfilesV4\) \{/);
  assert.match(loadBlock, /const nextProfilesV4 = buildProfilesV4FromLegacyState\(result, channels, keywords\)/);
  assert.match(loadBlock, /STORAGE_NAMESPACE\?\.set\(\{ \[FT_PROFILES_V4_KEY\]: nextProfilesV4 \}/);
  assert.match(loadBlock, /if \(needsWrite\) \{/);
  assert.match(loadBlock, /STORAGE_NAMESPACE\?\.set\(\{\s*\[FT_PROFILES_V4_KEY\]: \{/);
  assert.doesNotMatch(loadBlock, /mutationAuthority|mutationReport|settingsRevision|migrationReport|queuedMutation/);
});
