import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_PROFILE_VIEWING_SPACE_AUTHORITY_AUDIT_2026-05-18.md';

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

test('profile viewing-space audit documents UI policy and runtime route-gate boundary', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'profileViewingAuthority',
    'allowMainViewing / allowKidsViewing are UI/admin policy fields today',
    'Viewing-space flags now feed runtime route enforcement for child profiles',
    'filtertube_managed_viewing_space_route_gate',
    'Profile selection and surface selection are separate authorities',
    'Compiled settings cache is surface-keyed',
    'Managed child editing bypasses active-profile switching by design',
    'tests/runtime/profile-viewing-space-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  for (const source of [
    'js/settings_shared.js',
    'js/background.js',
    'js/state_manager.js',
    'js/tab-view.js',
    'js/popup.js',
    'html/tab-view.html'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }
});

test('tab-view owns viewing access labels and writes allowMainViewing allowKidsViewing', () => {
  const source = read('js/tab-view.js');
  const accessBlock = sliceBetween(
    source,
    'function getProfileViewingAccess(profile) {',
    'function canActiveProfileManageProfile(profilesV4, targetProfileId) {'
  );
  const updateBlock = sliceBetween(
    source,
    'async function updateProfileViewingAccess(profileId, patch) {',
    'function isUiLocked() {'
  );
  const managerBlock = sliceBetween(
    source,
    'function renderProfilesManager(profilesV4) {',
    'async function refreshProfilesUI() {'
  );

  assert.match(accessBlock, /main: settings\.allowMainViewing !== false/);
  assert.match(accessBlock, /kids: settings\.allowKidsViewing !== false/);
  assert.match(accessBlock, /return 'Main \+ Kids'/);
  assert.match(accessBlock, /return 'No viewing spaces'/);

  assert.match(updateBlock, /getProfileType\(fresh, currentActive\) === 'child'/);
  assert.match(updateBlock, /if \(!nextMain && !nextKids\)/);
  assert.match(updateBlock, /allowMainViewing: nextMain/);
  assert.match(updateBlock, /allowKidsViewing: nextKids/);
  assert.match(updateBlock, /await io\.saveProfilesV4/);

  assert.match(managerBlock, /Viewing access: \$\{viewingAccessLabel\(profiles\[profileId\]\)\}/);
  assert.match(managerBlock, /Main allowed/);
  assert.match(managerBlock, /Kids allowed/);
});

test('background compile emits child viewing route gate without broad profile authority object', () => {
  const source = read('js/background.js');
  const compileBlock = sliceBetween(
    source,
    'const effectiveProfilesV4 = hasProfilesV4 ? storedProfilesV4 : storageUpdates?.[FT_PROFILES_V4_KEY];',
    'console.log(`FilterTube Background: Compiled ${targetProfile} settings:'
  );
  const messageBlock = sliceBetween(
    source,
    '} else if (action === "getCompiledSettings") {',
    "} else if (action === 'FilterTube_SessionPinAuth') {"
  );

  assert.match(compileBlock, /const activeProfileId = typeof effectiveProfilesV4\?\.activeProfileId === 'string'/);
  assert.match(compileBlock, /const activeProfile = safeObject\(safeObject\(effectiveProfilesV4\?\.profiles\)\?\.\[activeProfileId\]\)/);
  assert.match(compileBlock, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(compileBlock, /compiledSettings\.profileType = targetProfile/);
  assert.match(compileBlock, /const allowMainViewing = activeSettings\.allowMainViewing !== false/);
  assert.match(compileBlock, /const allowKidsViewing = activeSettings\.allowKidsViewing !== false/);
  assert.match(compileBlock, /compiledSettings\.managedViewingRouteGate = \{/);
  assert.match(compileBlock, /schema: 'filtertube_managed_viewing_space_route_gate'/);
  assert.doesNotMatch(compileBlock, /profileViewingAuthority/);

  assert.match(messageBlock, /const requestedProfile = request\.profileType/);
  assert.match(messageBlock, /isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(messageBlock, /compiledSettingsCache\[profileType\]/);
  assert.match(messageBlock, /getCompiledSettings\(sender, profileType, !!request\.forceRefresh\)/);
  assert.doesNotMatch(messageBlock, /profileViewingAuthority/);
});

test('background cache invalidates on ftProfilesV4 but cache identity is still only main and kids', () => {
  const source = read('js/background.js');
  const messageBlock = sliceBetween(
    source,
    '} else if (action === "getCompiledSettings") {',
    "} else if (action === 'FilterTube_SessionPinAuth') {"
  );
  const storageBlock = sliceBetween(
    source,
    '// Listen for storage changes to re-compile settings',
    '/**\n * Fetch channel name and handle from YouTube by scraping the channel page'
  );

  assert.match(messageBlock, /compiledSettingsCache\[profileType\]/);
  assert.doesNotMatch(messageBlock, /compiledSettingsCache\[activeProfileId\]|settingsRevision|compiledSettingsRevision/);

  assert.match(storageBlock, /FT_PROFILES_V4_KEY/);
  assert.match(storageBlock, /compiledSettingsCache\.main = null/);
  assert.match(storageBlock, /compiledSettingsCache\.kids = null/);
  assert.match(storageBlock, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\)/);
  assert.match(storageBlock, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\)/);
});

test('popup and tab-view profile switching write activeProfileId after unlock but do not check viewing access', () => {
  const tabView = read('js/tab-view.js');
  const popup = read('js/popup.js');
  const tabSwitch = sliceBetween(
    tabView,
    'async function switchToProfile(nextProfileId) {',
    'try {\n        const io = window.FilterTubeIO || {};'
  );
  const popupSwitch = sliceBetween(
    popup,
    'async function switchToProfile(nextProfileId) {',
    'let keywordSearchValue ='
  );

  for (const block of [tabSwitch, popupSwitch]) {
    assert.match(block, /ensureProfileUnlocked\(profilesV4, targetId\)/);
    assert.match(block, /activeProfileId: targetId/);
    assert.match(block, /await StateManager\.loadSettings\(\)/);
    assert.doesNotMatch(block, /allowMainViewing|allowKidsViewing|viewingAccess|profileViewingAuthority/);
  }
});

test('StateManager loads active Main and Kids surfaces from V4 without viewing-space authority', () => {
  const source = read('js/state_manager.js');
  const loadBlock = sliceBetween(
    source,
    'async function loadSettings(options = {}) {',
    'async function saveSettings({ broadcast = true, profile = \'main\' } = {}) {'
  );

  assert.match(loadBlock, /const activeId = typeof profilesV4\.activeProfileId === 'string' \? profilesV4\.activeProfileId\.trim\(\) : ''/);
  assert.match(loadBlock, /const mainFromV4 = pickMainFromV4\(\)/);
  assert.match(loadBlock, /const kidsFromV4 = pickKidsFromV4\(\)/);
  assert.match(loadBlock, /state\.mode = mainFromV4\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(loadBlock, /state\.kids = \{/);
  assert.match(loadBlock, /state\.syncKidsToMain = !!activeProfileFromV4\.settings\.syncKidsToMain/);
  assert.doesNotMatch(loadBlock, /allowMainViewing|allowKidsViewing|viewingAccess|profileViewingAuthority/);
});

test('managed child edit writes target profile surfaces directly through V4 save', () => {
  const source = read('js/tab-view.js');
  const saveBlock = sliceBetween(
    source,
    'async function saveManagedChildSurface(surface, mutator) {',
    'try {\n        window.__filtertubeIsManagedChildEditFor = isManagedChildEditFor;'
  );
  const editBlock = sliceBetween(
    source,
    'async function startManagedChildEdit(profileId, surface) {',
    'function updateAdminPolicyControls() {'
  );

  assert.match(editBlock, /getProfileType\(fresh, targetId\) !== 'child'/);
  assert.match(editBlock, /canActiveProfileManageProfile\(fresh, targetId\)/);
  assert.match(editBlock, /ensureProfileUnlocked\(fresh, currentActive, \{ sensitiveAction: true \}\)/);
  assert.match(editBlock, /managedChildEdit = targetSurface \? \{ profileId: targetId, surface: targetSurface \}/);

  assert.match(saveBlock, /canActiveProfileManageProfile\(fresh, profileId\)/);
  assert.match(saveBlock, /const nextSurface = getProfileSurface\(profile, surface\)/);
  assert.match(saveBlock, /const nextProfile = setProfileSurface\(profile, surface, nextSurface\)/);
  assert.match(saveBlock, /recordManagedChildLocalEditHistory\(nextProfile, report\)/);
  assert.match(saveBlock, /await io\.saveProfilesV4/);
  assert.match(saveBlock, /await StateManager\.loadSettings/);
  assert.doesNotMatch(saveBlock, /profileViewingAuthority|compiledSettingsRevision|FilterTube_RefreshNow/);
});

test('syncKidsToMain currently persists profile setting and requests only main refresh', () => {
  const source = read('js/state_manager.js');
  const block = sliceBetween(
    source,
    "if (key === 'syncKidsToMain') {",
    'await saveSettings();'
  );

  assert.match(block, /settings:\s*\{\s*\.\.\.settings,\s*syncKidsToMain: !!state\.syncKidsToMain/s);
  assert.match(block, /profilesV3\.main\.applyKidsRulesOnMain = !!state\.syncKidsToMain/);
  assert.match(block, /await requestRefresh\('main'\)/);
  assert.doesNotMatch(block, /requestRefresh\('kids'\)|profileViewingAuthority|mutationContract|settingsRevision/);
});
