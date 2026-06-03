import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md';

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

function tabSwitchBlock() {
  return sliceBetween(
    read('js/tab-view.js'),
    'async function switchToProfile(nextProfileId) {',
    'try {\n        const io = window.FilterTubeIO || {};'
  );
}

function popupSwitchBlock() {
  return sliceBetween(
    read('js/popup.js'),
    'async function switchToProfile(nextProfileId) {',
    'let keywordSearchValue ='
  );
}

function backgroundCompileBlock() {
  return sliceBetween(
    read('js/background.js'),
    'const effectiveProfilesV4 = hasProfilesV4 ? storedProfilesV4 : storageUpdates?.[FT_PROFILES_V4_KEY];',
    'console.log(`FilterTube Background: Compiled ${targetProfile} settings:'
  );
}

function backgroundCompiledMessageBlock() {
  return sliceBetween(
    read('js/background.js'),
    '} else if (action === "getCompiledSettings") {',
    "} else if (action === 'FilterTube_SessionPinAuth') {"
  );
}

function viewingAccessUpdateBlock() {
  return sliceBetween(
    read('js/tab-view.js'),
    'async function updateProfileViewingAccess(profileId, patch) {',
    'function isUiLocked() {'
  );
}

function managedChildSaveBlock() {
  return sliceBetween(
    read('js/tab-view.js'),
    'async function saveManagedChildSurface(surface, mutator) {',
    'try {\n        window.__filtertubeIsManagedChildEditFor = isManagedChildEditFor;'
  );
}

test('P0 profile viewing-space doc lists all ten readiness fixtures', () => {
  const doc = read(docPath);

  for (const fixture of [
    'profile_switch_invalidates_compiled_main_and_kids_by_revision',
    'profile_switch_rejects_locked_profile_without_session_unlock',
    'profile_viewing_space_main_denied_blocks_main_runtime_compile',
    'profile_viewing_space_kids_denied_blocks_kids_runtime_compile',
    'profile_viewing_space_cannot_disable_both_surfaces',
    'child_profile_cannot_mutate_parent_policy_from_child_surface',
    'parent_managed_child_edit_reports_target_profile_and_surface',
    'managed_child_edit_refreshes_only_target_surface_or_reports_broadcast_scope',
    'sync_kids_to_main_requires_matching_modes_and_profile_authority',
    'import_nanah_profile_apply_updates_profile_viewing_authority_revision'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }

  assert.match(doc, /Status: current-behavior proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /profileViewingAuthority/);
});

test('profile_switch_invalidates_compiled_main_and_kids_by_revision is not revision-backed today', () => {
  const tabSwitch = tabSwitchBlock();
  const popupSwitch = popupSwitchBlock();
  const background = read('js/background.js');
  const message = backgroundCompiledMessageBlock();
  const storageBlock = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    '/**\n * Fetch channel name and handle from YouTube by scraping the channel page'
  );

  for (const block of [tabSwitch, popupSwitch]) {
    assert.match(block, /activeProfileId: targetId/);
    assert.match(block, /await StateManager\.loadSettings\(\)/);
  }

  assert.match(message, /compiledSettingsCache\[profileType\]/);
  assert.match(storageBlock, /compiledSettingsCache\.main = null/);
  assert.match(storageBlock, /compiledSettingsCache\.kids = null/);
  assert.doesNotMatch(`${tabSwitch}\n${popupSwitch}\n${message}\n${storageBlock}`, /compiledSettingsRevision|settingsRevision|profileViewingRevision|revisionId/);
});

test('profile_switch_rejects_locked_profile_without_session_unlock is UI-path satisfied today', () => {
  const tabSwitch = tabSwitchBlock();
  const popupSwitch = popupSwitchBlock();

  for (const block of [tabSwitch, popupSwitch]) {
    assert.match(block, /const ok = await ensureProfileUnlocked\(profilesV4, targetId\)/);
    assert.match(block, /if \(!ok\) \{/);
    assert.match(block, /return/);
    assert.match(block, /activeProfileId: targetId/);
  }
});

test('profile_viewing_space_main_denied_blocks_main_runtime_compile is locally route-gate backed today', () => {
  const compile = backgroundCompileBlock();
  const message = backgroundCompiledMessageBlock();
  const bridgeSettings = read('js/content/bridge_settings.js');

  assert.match(message, /isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(message, /getCompiledSettings\(sender, profileType, !!request\.forceRefresh\)/);
  assert.match(compile, /const activeProfile = safeObject\(safeObject\(effectiveProfilesV4\?\.profiles\)\?\.\[activeProfileId\]\)/);
  assert.match(compile, /compiledSettings\.profileType = targetProfile/);
  assert.match(compile, /compiledSettings\.managedViewingRouteGate = \{/);
  assert.match(compile, /allowMainViewing/);
  assert.match(bridgeSettings, /function applyManagedViewingRouteGate\(settings\)/);
  assert.match(bridgeSettings, /main_viewing_space_denied/);
  assert.doesNotMatch(`${compile}\n${message}\n${bridgeSettings}`, /profileViewingAuthority|runtimeAllowed|compiledSettingsRevision/);
});

test('profile_viewing_space_kids_denied_blocks_kids_runtime_compile is locally route-gate backed today', () => {
  const background = read('js/background.js');
  const compile = backgroundCompileBlock();
  const message = backgroundCompiledMessageBlock();
  const bridgeSettings = read('js/content/bridge_settings.js');

  assert.match(message, /const requestedProfile = request\.profileType/);
  assert.match(message, /const profileType = requestedProfile === 'kids' \? 'kids' :/);
  assert.match(background, /const shouldUseKidsProfile = targetProfile === 'kids'/);
  assert.match(compile, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(compile, /compiledSettings\.managedViewingRouteGate = \{/);
  assert.match(compile, /allowKidsViewing/);
  assert.match(bridgeSettings, /function applyManagedViewingRouteGate\(settings\)/);
  assert.match(bridgeSettings, /kids_viewing_space_denied/);
  assert.doesNotMatch(`${compile}\n${message}\n${bridgeSettings}`, /profileViewingAuthority|runtimeAllowed|compiledSettingsRevision/);
});

test('profile_viewing_space_cannot_disable_both_surfaces is UI-path satisfied today', () => {
  const update = viewingAccessUpdateBlock();

  assert.match(update, /const nextMain = Object\.prototype\.hasOwnProperty\.call\(patch, 'main'\) \? patch\.main === true : currentAccess\.main/);
  assert.match(update, /const nextKids = Object\.prototype\.hasOwnProperty\.call\(patch, 'kids'\) \? patch\.kids === true : currentAccess\.kids/);
  assert.match(update, /if \(!nextMain && !nextKids\) \{/);
  assert.match(update, /A profile needs at least one viewing space/);
  assert.match(update, /return/);
});

test('child_profile_cannot_mutate_parent_policy_from_child_surface is tab-view partial today', () => {
  const update = viewingAccessUpdateBlock();
  const tabView = read('js/tab-view.js');
  const capabilityBlock = sliceBetween(
    tabView,
    'function updateChildProfileCapabilityControls() {',
    'function isChildProfileAdminSurface() {'
  );

  assert.match(update, /getProfileType\(fresh, currentActive\) === 'child'/);
  assert.match(update, /Child profiles cannot change viewing access/);
  assert.match(capabilityBlock, /const isChild = getActiveProfileType\(\) === 'child'/);
  assert.match(capabilityBlock, /ftCreateAccountBtn\.disabled = isChild/);
  assert.match(capabilityBlock, /ftCreateChildBtn\.disabled = isChild/);
  assert.doesNotMatch(`${update}\n${capabilityBlock}`, /profileViewingAuthority|mutationReport|settingsRevision/);
});

test('parent_managed_child_edit_reports_target_profile_and_surface is not structured today', () => {
  const tabView = read('js/tab-view.js');
  const startBlock = sliceBetween(
    tabView,
    'async function startManagedChildEdit(profileId, surface) {',
    'function updateAdminPolicyControls() {'
  );
  const saveBlock = managedChildSaveBlock();

  assert.match(startBlock, /managedChildEdit = targetSurface \? \{ profileId: targetId, surface: targetSurface \} : \{ profileId: targetId \}/);
  assert.match(saveBlock, /const profileId = normalizeString\(managedChildEdit\?\.profileId\)/);
  assert.match(saveBlock, /profiles\[profileId\] = setProfileSurface\(profile, surface, nextSurface\)/);
  assert.match(saveBlock, /return true/);
  assert.doesNotMatch(`${startBlock}\n${saveBlock}`, /mutationReport|targetProfileReport|compiledSettingsRevision|profileViewingAuthority/);
});

test('managed_child_edit_refreshes_only_target_surface_or_reports_broadcast_scope is not satisfied today', () => {
  const saveBlock = managedChildSaveBlock();

  assert.match(saveBlock, /await io\.saveProfilesV4\(\{/);
  assert.match(saveBlock, /await StateManager\.loadSettings\(\{ notify: false, resetEnrichment: false, scheduleEnrichment: false \}\)/);
  assert.match(saveBlock, /renderKeywords\(\)/);
  assert.match(saveBlock, /renderChannels\(\)/);
  assert.match(saveBlock, /renderKidsKeywords\(\)/);
  assert.match(saveBlock, /renderKidsChannels\(\)/);
  assert.doesNotMatch(saveBlock, /broadcastScope|targetSurfaceReport|requestRefresh\(|FilterTube_ApplySettings|compiledSettingsRevision/);
});

test('sync_kids_to_main_requires_matching_modes_and_profile_authority is only compile-path partial today', () => {
  const stateManager = read('js/state_manager.js');
  const saveBlock = sliceBetween(
    stateManager,
    "if (key === 'syncKidsToMain') {",
    'await saveSettings();'
  );
  const compile = backgroundCompileBlock();

  assert.match(saveBlock, /settings:\s*\{\s*\.\.\.settings,\s*syncKidsToMain: !!state\.syncKidsToMain/s);
  assert.match(saveBlock, /profilesV3\.main\.applyKidsRulesOnMain = !!state\.syncKidsToMain/);
  assert.match(saveBlock, /await requestRefresh\('main'\)/);
  assert.match(compile, /if \(!syncKidsToMain \|\| mainModeFromV4 !== 'whitelist' \|\| kidsModeFromV4 !== 'whitelist'\) return mainKeywords/);
  assert.match(compile, /if \(!syncKidsToMain\) return mainChannels/);
  assert.match(compile, /if \(mainModeFromV4 !== 'blocklist'\) return mainChannels/);
  assert.match(compile, /if \(kidsModeFromV4 !== 'blocklist'\) return mainChannels/);
  assert.doesNotMatch(`${saveBlock}\n${compile}`, /profileViewingAuthority|syncKidsToMainAllowed|mutationReport|settingsRevision/);
});

test('import_nanah_profile_apply_updates_profile_viewing_authority_revision is not satisfied today', () => {
  const ioImport = sliceBetween(
    read('js/io_manager.js'),
    'async function importV3(json, { strategy = \'merge\', scope = \'auto\', auth = null, targetProfileId = null } = {}) {',
    'async function exportV3Encrypted'
  );
  const nanahApply = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'async function applyScopedPortablePayload(io, portable, { strategy = \'merge\', targetProfileId = null } = {}) {',
    'function generateId() {'
  );

  assert.match(ioImport, /await saveProfilesV4\(\{/);
  assert.match(ioImport, /activeProfileId: writeActiveId/);
  assert.match(nanahApply, /const resolvedTargetProfileId = normalizeString\(targetProfileId\) \|\| activeId/);
  assert.match(nanahApply, /profiles\[resolvedTargetProfileId\] =/);
  assert.match(nanahApply, /await io\.saveProfilesV4\(\{/);
  assert.doesNotMatch(`${ioImport}\n${nanahApply}`, /profileViewingAuthority|compiledSettingsRevision|settingsRevision|runtimeRevision|broadcastScope|mutationReport/);
});
