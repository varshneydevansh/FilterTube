import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_PROFILE_MANAGEMENT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const profileSettingsUiFamilyDocs = [
  'docs/audit/FILTERTUBE_EXTENSION_UI_CSS_PAGE_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_POPUP_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_PROFILE_MANAGEMENT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_PROFILE_VIEWING_SPACE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md',
  'docs/audit/FILTERTUBE_TAB_VIEW_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_UI_SETTINGS_CALLABLE_AUDIT_2026-05-18.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function sourceLineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function blockStats(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text)
  };
}

const sources = {
  tabView: read('js/tab-view.js'),
  popup: read('js/popup.js'),
  ioManager: read('js/io_manager.js'),
  background: read('js/background.js')
};

function blocks() {
  return {
    tabRenderProfilesManager: sliceBetween(
      sources.tabView,
      'function renderProfilesManager(profilesV4) {',
      'async function refreshProfilesUI() {'
    ),
    tabRefreshProfilesUI: sliceBetween(
      sources.tabView,
      'async function refreshProfilesUI() {',
      'async function switchToProfile(nextProfileId) {'
    ),
    tabSwitchToProfile: sliceBetween(
      sources.tabView,
      'async function switchToProfile(nextProfileId) {',
      'try {\n        const io = window.FilterTubeIO || {};'
    ),
    popupSwitchToProfile: sliceBetween(
      sources.popup,
      'async function switchToProfile(nextProfileId) {',
      'let keywordSearchValue ='
    ),
    tabCreateAccountHandler: sliceBetween(
      sources.tabView,
      "if (ftCreateAccountBtn) {\n        ftCreateAccountBtn.addEventListener('click', async () => {",
      "\n\n    if (ftCreateChildBtn) {\n        ftCreateChildBtn.addEventListener('click', async () => {"
    ),
    tabCreateChildHandler: sliceBetween(
      sources.tabView,
      "if (ftCreateChildBtn) {\n        ftCreateChildBtn.addEventListener('click', async () => {",
      '\n\n    if (ftSetMasterPinBtn) {'
    ),
    tabSaveManagedChildSurface: sliceBetween(
      sources.tabView,
      'async function saveManagedChildSurface(surface, mutator) {',
      'try {\n        window.__filtertubeIsManagedChildEditFor = isManagedChildEditFor;'
    ),
    ioLoadSaveProfiles: sliceBetween(
      sources.ioManager,
      'async function loadProfilesV4() {',
      'function sanitizeProfilesV4'
    ),
    backgroundProfileStorageInvalidation: sliceBetween(
      sources.background,
      '// Listen for storage changes to re-compile settings',
      '/**\n * Fetch channel name and handle from YouTube by scraping the channel page'
    )
  };
}

test('profile management persistence audit document records current boundary and fixtures', () => {
  const doc = read(auditDocPath);
  const methodGap = read(methodGapPath);

  for (const marker of [
    'Status: current-behavior proof slice. This is not an implementation patch.',
    '4 profile management persistence source files',
    'source/effect blocks: 9',
    'tab_and_popup_profile_switch_write_active_profile_after_unlock',
    'profile_manager_delete_writes_resolved_active_profile_without_backup_report',
    'account_profile_creation_copies_backup_policy_without_switching_active_profile',
    'child_profile_creation_requires_parent_account_and_defaults_main_denied_kids_allowed',
    'managed_child_save_writes_target_profile_surface_with_local_revision_history_without_broadcast_report',
    'io_load_profiles_can_write_sanitized_or_migrated_v4_during_read_path',
    'background_profile_storage_change_invalidates_both_compiled_caches_without_revision_report',
    'Profile switch, create, delete, managed-child save, IO read-path writes, and background cache invalidation do not share one mutation report.',
    'Runtime behavior remains unchanged.'
  ]) {
    assert.ok(doc.includes(marker), `missing marker: ${marker}`);
  }

  assert.match(methodGap, /repo-wide lexical callables: 5744/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5744/);

  assert.equal(profileSettingsUiFamilyDocs.length, 12);
  for (const familyDocPath of profileSettingsUiFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5744/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5744/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('profile management source fingerprints stay pinned', () => {
  const doc = read(auditDocPath);
  const expected = [
    ['js/tab-view.js', 11960, 542356, '0bc598eec24a3800592fd570a1b411ab71d77f610b56589d9b6a6baff3021bce'],
    ['js/popup.js', 1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
    ['js/io_manager.js', 2097, 100479, 'f6f4119992f63a92dd984cd5eb9d5d5c946c839f63abef070ad0dace77474d62'],
    ['js/background.js', 6343, 286370, 'ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36']
  ];

  for (const [file, lines, bytes, hash] of expected) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('profile management source/effect block metrics stay pinned in the doc', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    tabRenderProfilesManager: ['tab-view renderProfilesManager block', 390, 19757],
    tabRefreshProfilesUI: ['tab-view refreshProfilesUI block', 24, 954],
    tabSwitchToProfile: ['tab-view switchToProfile block', 44, 1595],
    popupSwitchToProfile: ['popup switchToProfile block', 48, 1659],
    tabCreateAccountHandler: ['tab-view create account handler block', 120, 5004],
    tabCreateChildHandler: ['tab-view create child handler block', 107, 4589],
    tabSaveManagedChildSurface: ['tab-view saveManagedChildSurface block', 61, 2716],
    ioLoadSaveProfiles: ['io_manager load/save profiles block', 67, 2563],
    backgroundProfileStorageInvalidation: ['background profile storage invalidation block', 42, 1464]
  };

  for (const [key, [label, lines, bytes]] of Object.entries(expected)) {
    assert.deepEqual(blockStats(currentBlocks[key]), { lines, bytes }, `${key} stats drifted`);
    assert.match(doc, new RegExp(`${label}: ${lines} lines, ${bytes} bytes`));
  }
});

test('selected profile management token counts stay pinned', () => {
  const doc = read(auditDocPath);
  const selected = [
    ['tab-view ensureProfileUnlocked tokens: 16', sources.tabView, 'ensureProfileUnlocked', 16],
    ['tab-view saveProfilesV4 tokens: 30', sources.tabView, 'saveProfilesV4', 30],
    ['tab-view loadProfilesV4 tokens: 54', sources.tabView, 'loadProfilesV4', 54],
    ['tab-view activeProfileId tokens: 69', sources.tabView, 'activeProfileId', 69],
    ['tab-view StateManager.loadSettings tokens: 8', sources.tabView, 'StateManager.loadSettings', 8],
    ['tab-view refreshProfilesUI tokens: 20', sources.tabView, 'refreshProfilesUI', 20],
    ['tab-view applyLockGateIfNeeded tokens: 4', sources.tabView, 'applyLockGateIfNeeded', 4],
    ['tab-view scheduleAutoBackup tokens: 6', sources.tabView, 'scheduleAutoBackup', 6],
    ['tab-view profile_created tokens: 2', sources.tabView, 'profile_created', 2],
    ['tab-view managedChildEdit tokens: 12', sources.tabView, 'managedChildEdit', 12],
    ['tab-view unlockedProfiles tokens: 18', sources.tabView, 'unlockedProfiles', 18],
    ['tab-view allowMainViewing tokens: 4', sources.tabView, 'allowMainViewing', 4],
    ['tab-view allowKidsViewing tokens: 4', sources.tabView, 'allowKidsViewing', 4],
    ['tab-view schemaVersion tokens: 16', sources.tabView, 'schemaVersion', 16],
    ['popup ensureProfileUnlocked tokens: 3', sources.popup, 'ensureProfileUnlocked', 3],
    ['popup saveProfilesV4 tokens: 2', sources.popup, 'saveProfilesV4', 2],
    ['popup loadProfilesV4 tokens: 4', sources.popup, 'loadProfilesV4', 4],
    ['popup activeProfileId tokens: 16', sources.popup, 'activeProfileId', 16],
    ['popup StateManager.loadSettings tokens: 3', sources.popup, 'StateManager.loadSettings', 3],
    ['popup refreshProfilesUI tokens: 6', sources.popup, 'refreshProfilesUI', 6],
    ['popup applyLockGateIfNeeded tokens: 3', sources.popup, 'applyLockGateIfNeeded', 3],
    ['popup unlockedProfiles tokens: 5', sources.popup, 'unlockedProfiles', 5],
    ['io_manager FT_PROFILES_V4_KEY tokens: 10', sources.ioManager, 'FT_PROFILES_V4_KEY', 10],
    ['io_manager writeStorage tokens: 8', sources.ioManager, 'writeStorage', 8],
    ['background compiledSettingsCache tokens: 39', sources.background, 'compiledSettingsCache', 39],
    ['background getCompiledSettings tokens: 8', sources.background, 'getCompiledSettings', 8],
    ['background FT_PROFILES_V4_KEY tokens: 34', sources.background, 'FT_PROFILES_V4_KEY', 34]
  ];

  for (const [docLine, source, token, expected] of selected) {
    assert.equal(countLiteral(source, token), expected, `${token} count drifted`);
    assert.match(doc, new RegExp(docLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('tab-view and popup profile switches write active profile after local unlock without revision reports', () => {
  const currentBlocks = blocks();

  for (const block of [currentBlocks.tabSwitchToProfile, currentBlocks.popupSwitchToProfile]) {
    assert.match(block, /const ok = await ensureProfileUnlocked\(profilesV4, targetId\)/);
    assert.match(block, /if \(!ok\) \{/);
    assert.match(block, /return/);
    assert.match(block, /await io\.saveProfilesV4\(\{/);
    assert.match(block, /schemaVersion: 4/);
    assert.match(block, /activeProfileId: targetId/);
    assert.match(block, /await StateManager\.loadSettings\(\)/);
    assert.match(block, /await refreshProfilesUI\(\)/);
    assert.doesNotMatch(block, /compiledSettingsRevision|settingsRevision|profileManagementMutationReport|profileManagementSwitchRevisionReport/);
  }

  assert.match(currentBlocks.tabSwitchToProfile, /managedChildEdit = null/);
  assert.match(currentBlocks.tabSwitchToProfile, /updateStats\(\)/);
  assert.match(currentBlocks.popupSwitchToProfile, /renderKeywords\(\)/);
  assert.match(currentBlocks.popupSwitchToProfile, /renderChannels\(\)/);
});

test('profile manager delete writes resolved active profile without backup or revision report', () => {
  const { tabRenderProfilesManager: block } = blocks();

  assert.match(block, /deleteBtn\.disabled = profileId === 'default' \|\| childAdminRestricted/);
  assert.match(block, /Child profiles cannot delete profiles here/);
  assert.match(block, /if \(currentActive === 'default'\) \{/);
  assert.match(block, /const okAdmin = await ensureAdminUnlocked\(fresh\)/);
  assert.match(block, /const okSelf = await ensureProfileUnlocked\(fresh, profileId\)/);
  assert.match(block, /delete profiles\[profileId\]/);
  assert.match(block, /const resolvedActive = profiles\[nextActive\] \? nextActive : 'default'/);
  assert.match(block, /activeProfileId: resolvedActive/);
  assert.match(block, /unlockedProfiles\.delete\(profileId\)/);
  assert.match(block, /await StateManager\.loadSettings\(\)/);
  assert.match(block, /await applyLockGateIfNeeded\(\)/);
  assert.doesNotMatch(block, /scheduleAutoBackup|compiledSettingsRevision|profileManagementCreateDeleteReport|profileManagementBackupPolicy/);
});

test('account and child profile creation write V4 and conditionally schedule backup without switching active profile', () => {
  const { tabCreateAccountHandler: account, tabCreateChildHandler: child } = blocks();

  assert.match(account, /ensureNonChildAdminAction\('Child profiles cannot manage accounts here\.'\)/);
  assert.match(account, /normalizeString\(profilesV4\?\.activeProfileId\) !== 'default'/);
  assert.match(account, /const okAdmin = await ensureAdminUnlocked\(profilesV4\)/);
  assert.match(account, /policy\.allowAccountCreation/);
  assert.match(account, /policy\.maxAccounts > 0/);
  assert.match(account, /type: 'account'/);
  assert.match(account, /allowMainViewing: true/);
  assert.match(account, /allowKidsViewing: true/);
  assert.match(account, /syncKidsToMain: false/);
  assert.match(account, /autoBackupEnabled,/);
  assert.match(account, /await io\.saveProfilesV4\(\{/);
  assert.match(account, /schemaVersion: 4/);
  assert.match(account, /await refreshProfilesUI\(\)/);
  assert.match(account, /scheduleAutoBackup\('profile_created', 1500\)/);
  assert.doesNotMatch(account, /activeProfileId:\s*candidate|profileManagementCreateDeleteReport|profileManagementMutationReport/);

  assert.match(child, /ensureNonChildAdminAction\('Child profiles cannot create child profiles here\.'\)/);
  assert.match(child, /const currentType = getProfileType\(profilesV4, currentActive\)/);
  assert.match(child, /currentType !== 'account'/);
  assert.match(child, /const okUnlocked = await ensureProfileUnlocked\(profilesV4, currentActive\)/);
  assert.match(child, /type: 'child'/);
  assert.match(child, /parentProfileId: currentActive/);
  assert.match(child, /allowMainViewing: false/);
  assert.match(child, /allowKidsViewing: true/);
  assert.match(child, /syncKidsToMain: false/);
  assert.match(child, /autoBackupEnabled,/);
  assert.match(child, /await io\.saveProfilesV4\(\{/);
  assert.match(child, /scheduleAutoBackup\('profile_created', 1500\)/);
  assert.doesNotMatch(child, /activeProfileId:\s*candidate|profileManagementCreateDeleteReport|profileManagementMutationReport/);
});

test('managed child save writes target surface locally with local revision history but without broadcast or compiled revision report', () => {
  const { tabSaveManagedChildSurface: block } = blocks();

  assert.match(block, /const profileId = normalizeString\(managedChildEdit\?\.profileId\)/);
  assert.match(block, /canActiveProfileManageProfile\(fresh, profileId\)/);
  assert.match(block, /const nextSurface = getProfileSurface\(profile, surface\)/);
  assert.match(block, /const nextProfile = setProfileSurface\(profile, surface, nextSurface\)/);
  assert.match(block, /const report = buildManagedChildLocalEditReport\(\{/);
  assert.match(block, /actorProfileId: normalizeString\(fresh\.activeProfileId\) \|\| activeProfileId \|\| 'default'/);
  assert.match(block, /profiles\[profileId\] = recordManagedChildLocalEditHistory\(nextProfile, report\)/);
  assert.match(block, /await io\.saveProfilesV4\(\{/);
  assert.match(block, /profilesV4Cache = \{ \.\.\.fresh, schemaVersion: 4, profiles \}/);
  assert.match(block, /await StateManager\.loadSettings\(\{ notify: false, resetEnrichment: false, scheduleEnrichment: false \}\)/);
  assert.match(block, /renderKeywords\(\)/);
  assert.match(block, /renderKidsKeywords\(\)/);
  assert.match(block, /updateStats\(\)/);
  assert.doesNotMatch(block, /broadcastScope|compiledSettingsRevision|profileManagementManagedChildReport|scheduleAutoBackup|FilterTube_RefreshNow/);
});

test('IO profile load and save paths can write during read and invalid candidate handling', () => {
  const { ioLoadSaveProfiles: block } = blocks();

  assert.match(block, /async function loadProfilesV4\(\)/);
  assert.match(block, /const data = await readStorage\(\[FT_PROFILES_V4_KEY, 'filterChannels', 'uiKeywords', FT_PROFILES_V3_KEY\]\)/);
  assert.match(block, /if \(isValidProfilesV4\(existing\)\) \{/);
  assert.match(block, /let needsWrite = false/);
  assert.match(block, /const sanitized = sanitizeProfilesV4\(existing, \{ source: 'local' \}\)/);
  assert.match(block, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: sanitized \}\)/);
  assert.match(block, /const migrated = buildDefaultProfilesV4FromLegacyStorage\(data\)/);
  assert.match(block, /await writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: migrated \}\)/);
  assert.match(block, /async function saveProfilesV4\(nextProfiles\)/);
  assert.match(block, /if \(!isValidProfilesV4\(nextProfiles\)\) \{/);
  assert.match(block, /return writeStorage\(\{\}\)/);
  assert.match(block, /return writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: nextProfiles \}\)/);
  assert.doesNotMatch(block, /profileManagementMutationReport|profileManagementFixtureProvenance|settingsRevision|compiledSettingsRevision/);
});

test('background profile storage change invalidates both compiled caches without a revision report', () => {
  const { backgroundProfileStorageInvalidation: block } = blocks();

  assert.match(block, /browserAPI\.storage\.onChanged\.addListener\(\(changes, area\) => \{/);
  assert.match(block, /FT_PROFILES_V4_KEY/);
  assert.match(block, /compiledSettingsCache\.main = null/);
  assert.match(block, /compiledSettingsCache\.kids = null/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\)/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\)/);
  assert.match(block, /this won't broadcast automatically/);
  assert.doesNotMatch(block, /profileManagementCacheInvalidationReport|compiledSettingsRevision|settingsRevision|broadcastScope/);
});

test('future profile management authority symbols are not present in product runtime source yet', () => {
  const runtime = `${sources.tabView}\n${sources.popup}\n${sources.ioManager}\n${sources.background}`;
  for (const symbol of [
    'profileManagementPersistenceContract',
    'profileManagementMutationReport',
    'profileManagementSwitchRevisionReport',
    'profileManagementLockPolicy',
    'profileManagementCreateDeleteReport',
    'profileManagementBackupPolicy',
    'profileManagementCacheInvalidationReport',
    'profileManagementManagedChildReport',
    'profileManagementFixtureProvenance',
    'profileManagementMetricArtifact'
  ]) {
    assert.equal(runtime.includes(symbol), false, `${symbol} should not exist in runtime source yet`);
    assert.match(read(auditDocPath), new RegExp(symbol));
  }
});
