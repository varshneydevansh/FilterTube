import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const gapRegisterPath = 'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md';
const objectiveLedgerPath = 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md';
const activeGoalPath = 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md';
const backupImportNanahFamilyDocs = [
  'docs/audit/FILTERTUBE_BACKUP_DOWNLOAD_BLOB_URL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_BACKUP_EXPORT_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_BACKUP_EXPORT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_STATIC_GENERATED_VENDOR_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

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

test('import export Nanah audit documents current authority flow and future contract', () => {
  const doc = read(auditDocPath);
  const methodGap = read(methodGapPath);

  for (const marker of [
    'dry-run mutation report',
    'background compiled settings revision',
    'Simultaneous Allow And Block',
    'External Settings Ingress Snapshot - 2026-05-27',
    'external settings ingress mutation authority: NO-GO',
    'Nanah apply promotion authority: NO-GO',
    'dual allow/block migration through import/sync: NO-GO',
    'runtime behavior changed by this addendum: no',
    'Content Filter Ingress Normalization Addendum - 2026-05-27',
    'content-filter ingress normalization rows: 8',
    'content-filter state load deep enabled coercion: absent',
    'content-filter state update deep enabled coercion: absent',
    'category filter enabled coercion contrast: present',
    'import/sync content-filter schema authority: NO-GO',
    'JSON-first predicate merge approval from ingress addendum: NO-GO',
    'runtime behavior changed by ingress addendum: no',
    'Encrypted and unencrypted imports must accept the same target profile/scope',
    'Ignored root captures remain raw evidence inputs',
    'tests/runtime/import-export-nanah-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  assert.match(doc, /external payload or sync envelope\s+\|\s+\+--> file backup import/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /External or synced contentFilters/);
  assert.match(doc, /\| Plain V3\/V4 import \| `js\/io_manager\.js:1241-1726` \|/);
  assert.match(doc, /\| Encrypted import \| `js\/io_manager\.js:1759-1770` \|/);
  assert.match(doc, /\| Full encrypted export with trusted Nanah state \| `js\/io_manager\.js:1729-1748` \|/);
  assert.match(doc, /\| Nanah scoped apply \| `js\/nanah_sync_adapter\.js:186-277` \|/);
  assert.match(doc, /\| Nanah envelope parsing \| `js\/nanah_sync_adapter\.js:353-397` \|/);
  assert.match(doc, /\| Background cache convergence \| `js\/background\.js:4484-4523` \|/);
  assert.match(doc, /\| StateManager external reload \| `js\/state_manager\.js:2356-2405` \|/);
  assert.match(doc, /\| V4 profile sanitizer pass-through \| `js\/io_manager\.js:627-706` \|/);
  assert.match(doc, /\| Plain import V4 merge pass-through \| `js\/io_manager\.js:1511-1675` \|/);
  assert.match(doc, /\| Nanah scoped apply pass-through \| `js\/nanah_sync_adapter\.js:186-270` \|/);
  assert.match(doc, /\| Main state load pass-through \| `js\/state_manager\.js:250-254` \|/);
  assert.match(doc, /\| Kids V4\/V3 state load pass-through \| `js\/state_manager\.js:380-399`, `js\/state_manager\.js:444-463` \|/);
  assert.match(doc, /\| Local content-filter update pass-through \| `js\/state_manager\.js:2147-2175` \|/);
  assert.match(doc, /\| Category filter contrast \| `js\/state_manager\.js:262-268`, `js\/state_manager\.js:403-408`, `js\/state_manager\.js:2194-2228` \|/);
  assert.match(doc, /\| Runtime predicate impact \| `docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md` \|/);

  for (const source of [
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/security_manager.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/background.js'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }

  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);

  assert.equal(backupImportNanahFamilyDocs.length, 10);
  for (const familyDocPath of backupImportNanahFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5812/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5812/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('content-filter ingress addendum pins pass-through normalization contrast', () => {
  const doc = read(auditDocPath);
  const ioManager = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const stateManager = read('js/state_manager.js');
  const compiledSettingsDoc = read('docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');
  const gapRegister = read(gapRegisterPath);
  const objectiveLedger = read(objectiveLedgerPath);
  const activeGoal = read(activeGoalPath);

  const sanitizerBlock = sliceBetween(
    ioManager,
    'function sanitizeProfilesV4(profilesV4',
    'const activeProfileId = normalizeString(profilesV4.activeProfileId)'
  );
  assert.match(sanitizerBlock, /\.\.\.main/);
  assert.match(sanitizerBlock, /\.\.\.kids/);
  assert.match(sanitizerBlock, /sanitizeMainChannels/);
  assert.match(sanitizerBlock, /sanitizeMainKeywords/);
  assert.doesNotMatch(sanitizerBlock, /contentFilters[\s\S]{0,120}enabled\s*===\s*true/);
  assert.doesNotMatch(sanitizerBlock, /sanitizeContentFilter|normalizeContentFilter|coerceContentFilter/);

  const importMergeBlock = sliceBetween(
    ioManager,
    'const incomingProfilesV4 = incomingV4;',
    'await saveProfilesV4({'
  );
  assert.match(importMergeBlock, /const sanitizedIncoming = sanitizeProfilesV4\(incomingProfilesV4, \{ source: 'import' \}\)/);
  assert.match(importMergeBlock, /\.\.\.incMain/);
  assert.match(importMergeBlock, /\.\.\.incKids/);
  assert.match(importMergeBlock, /\.\.\.targetMain/);
  assert.match(importMergeBlock, /\.\.\.targetKids/);
  assert.doesNotMatch(importMergeBlock, /contentFilters[\s\S]{0,160}enabled\s*===\s*true/);

  const nanahApplyBlock = sliceBetween(
    nanah,
    'async function applyScopedPortablePayload',
    'await io.saveProfilesV4({'
  );
  assert.match(nanahApplyBlock, /\.\.\.data/);
  assert.match(nanahApplyBlock, /main: nextMain/);
  assert.match(nanahApplyBlock, /kids: nextKids/);
  assert.doesNotMatch(nanahApplyBlock, /contentFilters[\s\S]{0,160}enabled\s*===\s*true/);
  assert.doesNotMatch(nanahApplyBlock, /sanitizeContentFilter|normalizeContentFilter|coerceContentFilter/);

  const mainLoadBlock = sliceBetween(
    stateManager,
    'state.contentFilters = data.contentFilters',
    'state.categoryFilters = data.categoryFilters'
  );
  assert.match(mainLoadBlock, /JSON\.parse\(JSON\.stringify\(data\.contentFilters\)\)/);
  assert.doesNotMatch(mainLoadBlock, /enabled\s*===\s*true/);

  const kidsV4ContentBlock = sliceBetween(
    stateManager,
    'contentFilters: (kidsFromV4.contentFilters',
    'const defaults = { enabled: false, mode:'
  );
  assert.match(kidsV4ContentBlock, /JSON\.parse\(JSON\.stringify\(kidsFromV4\.contentFilters\)\)/);
  assert.match(kidsV4ContentBlock, /duration: \{ \.\.\.defaults\.duration, \.\.\.\(loaded\.duration \|\| \{\}\) \}/);
  assert.doesNotMatch(kidsV4ContentBlock, /enabled\s*===\s*true/);

  const kidsV3ContentBlock = sliceBetween(
    stateManager,
    'contentFilters: (profilesV3.kids.contentFilters',
    'const defaults = { enabled: false, mode:'
  );
  assert.match(kidsV3ContentBlock, /JSON\.parse\(JSON\.stringify\(profilesV3\.kids\.contentFilters\)\)/);
  assert.match(kidsV3ContentBlock, /duration: \{ \.\.\.defaults\.duration, \.\.\.\(loaded\.duration \|\| \{\}\) \}/);
  assert.doesNotMatch(kidsV3ContentBlock, /enabled\s*===\s*true/);

  const mainUpdateBlock = sliceBetween(
    stateManager,
    'async function updateContentFilters',
    'async function updateKidsContentFilters'
  );
  assert.match(mainUpdateBlock, /duration: \{ \.\.\.state\.contentFilters\.duration, \.\.\.\(nextContentFilters\.duration \|\| \{\}\) \}/);
  assert.doesNotMatch(mainUpdateBlock, /enabled\s*===\s*true/);

  const kidsUpdateBlock = sliceBetween(
    stateManager,
    'async function updateKidsContentFilters',
    'async function updateCategoryFilters'
  );
  assert.match(kidsUpdateBlock, /duration: \{ \.\.\.\(current\.duration \|\| \{\}\), \.\.\.\(nextContentFilters\.duration \|\| \{\}\) \}/);
  assert.doesNotMatch(kidsUpdateBlock, /enabled\s*===\s*true/);

  const categoryLoadBlock = sliceBetween(
    stateManager,
    'const loaded = state.categoryFilters',
    'const pickActiveProfileFromV4 = () => {'
  );
  const kidsCategoryV4Block = sliceBetween(
    stateManager,
    'const loaded = state.kids.categoryFilters',
    '} else if (profilesV3 && profilesV3.kids) {'
  );
  const categoryUpdateBlock = sliceBetween(
    stateManager,
    'async function updateCategoryFilters',
    'async function updateKidsCategoryFilters'
  );
  const kidsCategoryUpdateBlock = sliceBetween(
    stateManager,
    'async function updateKidsCategoryFilters',
    '// ============================================================================\n    // THEME MANAGEMENT'
  );
  assert.match(categoryLoadBlock, /enabled: loaded\.enabled === true/);
  assert.match(kidsCategoryV4Block, /enabled: loaded\.enabled === true/);
  assert.match(categoryUpdateBlock, /enabled: nextCategoryFilters\.enabled === true/);
  assert.match(kidsCategoryUpdateBlock, /enabled: nextCategoryFilters\.enabled === true/);

  assert.match(compiledSettingsDoc, /Content Filter Enabled Normalization Addendum - 2026-05-27/);
  assert.match(compiledSettingsDoc, /deep content-filter enabled coercion in shared compiler: absent/);
  assert.match(compiledSettingsDoc, /deep content-filter enabled coercion in background compiler: absent/);
  assert.match(compiledSettingsDoc, /deep content-filter enabled coercion in filter_logic processing: absent/);
  assert.match(doc, /content-filter ingress normalization rows: 8/);
  assert.match(doc, /runtime behavior changed by ingress addendum: no/);

  for (const ledgerDoc of [gapRegister, objectiveLedger, activeGoal]) {
    assert.ok(ledgerDoc.includes('2026-05-27 content-filter ingress normalization continuation'));
    assert.ok(ledgerDoc.includes('FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md'));
    assert.match(ledgerDoc, /import\/sync\s+content-filter schema authority/i);
    assert.match(ledgerDoc, /runtime\s+behavior changes remain\s+(?:at\s+)?`NO-GO`/);
  }
});

test('saveProfilesV4 currently writes an empty payload for invalid profile state', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'async function saveProfilesV4(nextProfiles)',
    'function sanitizeProfilesV4'
  );

  assert.match(block, /if \(!isValidProfilesV4\(nextProfiles\)\) \{/);
  assert.match(block, /return writeStorage\(\{\}\);/);
  assert.match(block, /return writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: nextProfiles \}\);/);
  assert.doesNotMatch(block, /throw new Error|return \{ ok: false|revision|broadcast/);
});

test('loadProfilesV4 currently can sanitize and write profiles during a read path', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'async function loadProfilesV4()',
    'async function saveProfilesV4'
  );

  assert.match(block, /const data = await readStorage\(\[FT_PROFILES_V4_KEY, 'filterChannels', 'uiKeywords', FT_PROFILES_V3_KEY\]\)/);
  assert.match(block, /const sanitized = sanitizeProfilesV4\(existing, \{ source: 'local' \}\)/);
  assert.match(block, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: sanitized \}\)/);
  assert.match(block, /const migrated = buildDefaultProfilesV4FromLegacyStorage\(data\)/);
  assert.match(block, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: migrated \}\)/);
});

test('importV3 currently spans settings profiles maps theme and Nanah trusted state writes', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'async function importV3(json',
    'async function exportV3Encrypted'
  );

  for (const pattern of [
    /await SettingsAPI\.saveSettings/,
    /await saveProfilesV3\(nextProfiles\)/,
    /await saveProfilesV4\(\{/,
    /await writeStorage\(\{ channelMap: nextChannelMap \}\)/,
    /await SettingsAPI\.setThemePreference\(parsed\.theme\)/,
    /await writeStorage\(nanahPayload\)/
  ]) {
    assert.match(block, pattern);
  }
});

test('importV3 currently catches V4 sync failures and can still return ok true', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'try {\n            let profilesV4 = localProfilesV4 || await loadProfilesV4();',
    'if (shouldTouchLegacyV3 && parsed.theme && SettingsAPI.setThemePreference)'
  );

  assert.match(block, /await saveProfilesV4\(\{/);
  assert.match(block, /catch \(e\) \{/);
  assert.match(block, /console\.warn\('FilterTube: importV3 failed to sync ftProfilesV4', e\)/);
  assert.match(source, /return \{ ok: true, result, restoredNanahState \};/);
});

test('importV3Encrypted currently drops targetProfileId while forwarding decrypted import options', () => {
  const source = read('js/io_manager.js');
  const block = sliceBetween(
    source,
    'async function importV3Encrypted',
    '// ============================================================================\n    // AUTO-BACKUP SYSTEM'
  );

  assert.match(block, /\{ password = '', strategy = 'merge', scope = 'auto', auth = null \} = \{\}/);
  assert.match(block, /const decrypted = await Security\.decryptJson\(root\.encrypted, password\)/);
  assert.match(block, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(block, /targetProfileId/);
});

test('scoped Nanah apply currently writes V4 directly and returns no refresh or revision contract', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /await io\.saveProfilesV4\(\{/);
  assert.match(block, /return \{\s*ok: true,/);
  assert.match(block, /scope,/);
  assert.match(block, /profileId: resolvedTargetProfileId,/);
  assert.match(block, /strategy: replace \? 'replace' : 'merge'/);
  assert.doesNotMatch(block, /requestRefresh|broadcast|revision|compiledSettings|FilterTube_ApplySettings/);
});

test('scoped Nanah replace uses safeArray for channel arrays and normalizes Main aliases', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(block, /const incomingChannels = Array\.isArray\(data\.channels\) \? data\.channels : data\.blockedChannels/);
  assert.match(block, /channels: replace\s*\?\s*safeArray\(incomingChannels\)/);
  assert.match(block, /whitelistChannels: replace\s*\?\s*safeArray\(data\.whitelistChannels\)/);
  assert.match(block, /blockedChannels: replace\s*\?\s*safeArray\(data\.blockedChannels\)/);
  assert.match(block, /normalizeMainProfileAliasFields/);
  assert.doesNotMatch(block, /sanitizeChannelEntry|FilterTubeIO\.sanitize|normalizeChannel/);
});

test('Nanah envelope extraction currently parses payload without app action or version validation', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'function extractPortableFromEnvelope(envelope)',
    'async function applyIncomingEnvelope'
  );

  assert.match(block, /if \(root\.t === 'app_sync'\)/);
  assert.match(block, /portable: JSON\.parse\(root\.payload\)/);
  assert.match(block, /if \(root\.t === 'control_proposal'\)/);
  assert.match(block, /const proposal = safeObject\(JSON\.parse\(root\.payload\)\)/);
  assert.match(block, /portable: proposal\.portable/);
  assert.doesNotMatch(block, /root\.app|APP_ID|payloadVersion|PAYLOAD_VERSION|proposal\.action|filtertube\.apply_sync_payload/);
});

test('Nanah preview mode currently returns parsed portable payload without applying writes', () => {
  const source = read('js/nanah_sync_adapter.js');
  const block = sliceBetween(
    source,
    'async function applyIncomingEnvelope',
    'function getDeviceDescriptor'
  );

  assert.match(block, /const effectiveStrategy = strategy === 'replace' \? 'replace' : \(strategy === 'preview' \? 'preview' : 'merge'\)/);
  assert.match(block, /if \(effectiveStrategy === 'preview'\) \{/);
  assert.match(block, /preview: true/);
  assert.match(block, /portable: extracted\.portable/);
  assert.match(block, /return applyScopedPortablePayload/);
  assert.match(block, /return io\.importV3\(extracted\.portable/);
});

test('trusted Nanah backup state restore is opt-in but writes trust and device state from backup payload', () => {
  const source = read('js/io_manager.js');
  const exportBlock = sliceBetween(
    source,
    'async function exportV3Encrypted',
    'async function importV3Encrypted'
  );
  const importBlock = sliceBetween(
    source,
    'let restoredNanahState = false;',
    'return { ok: true, result, restoredNanahState };'
  );

  assert.match(exportBlock, /includeTrustedNanahState === true && exportType === 'full'/);
  assert.match(exportBlock, /payload\.nanahState = normalizedNanahState/);
  assert.match(importBlock, /auth\?\.restoreTrustedNanahState === true/);
  assert.match(importBlock, /\[NANAH_TRUSTED_LINKS_KEY\]: mergedTrustedLinks/);
  assert.match(importBlock, /nanahPayload\[NANAH_DEVICE_ID_KEY\] = incomingNanahState\.deviceId/);
  assert.match(importBlock, /await writeStorage\(nanahPayload\)/);
});

test('settings invalidation key lists currently differ across shared settings background and StateManager', () => {
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');

  const sharedKeys = sliceBetween(settingsShared, 'const SETTINGS_KEYS = [', 'const SETTINGS_CHANGE_KEYS');
  const compiledSettingsBlock = sliceBetween(
    background,
    'async function getCompiledSettings',
    'function shouldSuppressFirstRunPromptInjectionError'
  );
  const backgroundCompileKeys = sliceBetween(compiledSettingsBlock, 'browserAPI.storage.local.get([', '], (items) => {');
  const backgroundInvalidationKeys = sliceBetween(background, 'const relevantKeys = [', 'let settingsChanged = false;');
  const stateReloadKeys = sliceBetween(stateManager, 'const storageKeys = [', 'const hasSettingsChange = storageKeys.some');

  assert.match(sharedKeys, /'channelMap'/);
  assert.doesNotMatch(sharedKeys, /'videoChannelMap'|'videoMetaMap'|'ftProfilesV4'/);

  assert.match(backgroundCompileKeys, /'videoChannelMap'|videoChannelMap/);
  assert.match(backgroundCompileKeys, /'videoMetaMap'|videoMetaMap/);
  assert.match(backgroundInvalidationKeys, /FT_PROFILES_V4_KEY/);
  assert.doesNotMatch(backgroundInvalidationKeys, /'videoChannelMap'|'videoMetaMap'/);

  assert.match(stateReloadKeys, /'channelMap'/);
  assert.match(stateReloadKeys, /'ftProfilesV4'/);
  assert.doesNotMatch(stateReloadKeys, /'videoChannelMap'|'videoMetaMap'/);
});
