import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md';
const contractArtifactPath = 'docs/audit/artifacts/managed-app-policy-contract-v1.json';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const appManifestPath = '/Users/devanshvarshney/FilterTubeApp/tools/runtime-sync-manifest.json';
const appContractDestinationPath = '/Users/devanshvarshney/FilterTubeApp/packages/managed-policy-contract/src/upstream/managed-app-policy-contract-v1.json';
const appProfileModelsPath = '/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/ProfileModels.kt';
const appPreferencesPath = '/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/AppPreferences.kt';
const appProfilePolicyGatePath = '/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/ProfilePolicyGate.kt';
const appProfilePolicyGateTestPath = '/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/test/java/com/filtertube/app/ProfilePolicyGateTest.kt';
const appManagedHelperDestinations = Object.freeze({
  'js/nanah_managed_live_policy.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_live_policy.js',
  'js/nanah_managed_open_sync.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_open_sync.js'
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readAbsolute(absolutePath) {
  return fs.readFileSync(absolutePath, 'utf8');
}

function contractFromDoc() {
  const doc = read(docPath);
  const match = doc.match(/## Contract Snapshot JSON[\s\S]*?```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'contract JSON block should exist');
  return JSON.parse(match[1]);
}

function contractFromArtifact() {
  return JSON.parse(read(contractArtifactPath));
}

function withoutForbiddenRuntimeTokenList(contract) {
  const clone = JSON.parse(JSON.stringify(contract));
  delete clone.appBoundary.forbiddenRuntimeTokens;
  return JSON.stringify(clone);
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/bridge_settings.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

test('managed app policy parity doc records extension-owned app contract artifact without runtime change', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const contract = contractFromDoc();
  const artifactContract = contractFromArtifact();

  assert.equal(contract.schema, 'filtertube_managed_app_policy_contract');
  assert.equal(contract.version, 1);
  assert.equal(contract.runtimeBehaviorChanged, false);
  assert.equal(contract.appSyncStatus, 'app_manifest_contract_and_managed_helper_sync_present_native_enforcement_pending');
  assert.deepEqual(contract, artifactContract);
  assert.equal(contract.artifact.sourcePath, contractArtifactPath);
  assert.equal(contract.artifact.appDestination, 'packages/managed-policy-contract/src/upstream/managed-app-policy-contract-v1.json');
  assert.equal(contract.artifact.manifestSyncMode, 'copy');
  assert.deepEqual(
    contract.runtimeHelperSync.map(row => row.sourcePath),
    Object.keys(appManagedHelperDestinations)
  );
  for (const helper of contract.runtimeHelperSync) {
    assert.equal(helper.manifestSyncMode, 'copy');
    assert.equal(helper.appDestination, appManagedHelperDestinations[helper.sourcePath].replace('/Users/devanshvarshney/FilterTubeApp/', ''));
    assert.match(helper.boundary, /native|server mailbox|local-network/);
  }
  assert.match(doc, /Runtime behavior changed\*\*: no/);
  assert.match(doc, /Android native\s+model proof/);
  assert.match(doc, /Activity-wide runtime wiring and iOS parity remain\s+pending/);
  assert.match(doc, /App Sync Boundary/);
  assert.match(doc, /Required Parity Decisions/);
  assert.match(doc, /Current Gap/);
  assert.match(doc, /flowchart TD/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('android app has native managed time-limit model proof without claiming full runtime wiring', () => {
  for (const absolutePath of [
    appProfileModelsPath,
    appPreferencesPath,
    appProfilePolicyGatePath,
    appProfilePolicyGateTestPath
  ]) {
    assert.equal(fs.existsSync(absolutePath), true, `missing app proof file ${absolutePath}`);
  }

  const profileModels = readAbsolute(appProfileModelsPath);
  const preferences = readAbsolute(appPreferencesPath);
  const policyGate = readAbsolute(appProfilePolicyGatePath);
  const policyGateTest = readAbsolute(appProfilePolicyGateTestPath);

  for (const token of [
    'data class ManagedTimeLimitPolicy',
    'data class ManagedPolicyState',
    'data class ManagedActionHistoryRow',
    'object ManagedAppTimeBudgetGate',
    'sealed class ManagedTimeBudgetDecision',
    'zero_budget_immediate_timeout',
    'single_active_tab_no_double_count',
    'stale_reduced_budget_rejected',
    'equal_revision_hash_conflict',
    'ManagedTimePolicyUpdateDecision'
  ]) {
    assert.match(profileModels, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const token of [
    'managedPolicyState',
    'managedActionHistory',
    'timeLimitPolicy'
  ]) {
    assert.match(profileModels, new RegExp(token));
    assert.match(preferences, new RegExp(token));
  }

  assert.match(policyGate, /timeLimitPolicy\?\.policyFingerprint\(\)/);
  for (const token of [
    'managedTimeLimitPolicyChangeInvalidatesPolicyVersion',
    'disabledManagedTimeLimitPolicyIsNoWorkForNativeApp',
    'zeroManagedTimeBudgetImmediatelyTimesOutBeforeOpeningManagedWebContent',
    'activeManagedTimeSessionHeartbeatDoesNotDoubleCountSameTick',
    'managedTimeTimezoneDriftRevalidatesDayBucketInsteadOfCarryingWrongZoneUsage',
    'newerManagedTimeReducedBudgetClampsRemainingTime',
    'staleManagedTimeReducedBudgetIsRejected'
  ]) {
    assert.match(policyGateTest, new RegExp(token));
  }
});

test('managed app contract preserves profile viewing time envelope and history fields', () => {
  const contract = contractFromDoc();

  for (const field of ['ftProfilesV4', 'profile.settings', 'profile.managedPolicyState', 'profile.managedActionHistory']) {
    assert.ok(contract.profileAuthority.stores.includes(field), `missing profile store ${field}`);
  }

  for (const boundary of [
    'child_pin_is_not_admin_authority',
    'sibling_profiles_cannot_manage_each_other',
    'parent_account_must_be_bound_to_target_child',
    'admin_session_ttl_required_for_sensitive_actions'
  ]) {
    assert.ok(contract.profileAuthority.requiredBoundaries.includes(boundary), `missing profile boundary ${boundary}`);
  }

  for (const field of [
    'allowMainViewing',
    'allowKidsViewing',
    'defaultLaunchTarget',
    'allowYouTubeAccountSessionActions',
    'nativeOwnedMainSurface',
    'nativeOwnedKidsSurface'
  ]) {
    assert.ok(contract.viewingSpaces.requiredFields.includes(field), `missing viewing-space field ${field}`);
  }

  for (const field of [
    'dailyBudgetSeconds',
    'timezone',
    'surfaceBudgets',
    'countingMode',
    'activeDeviceBudgetPolicy',
    'resetPolicy',
    'policyRevision',
    'policyHash'
  ]) {
    assert.ok(contract.timeLimitPolicy.requiredFields.includes(field), `missing time-limit field ${field}`);
  }

  for (const scope of ['main', 'kids', 'keywords', 'channels', 'videos', 'viewing_space', 'time_limits']) {
    assert.ok(contract.managedEnvelope.scopes.includes(scope), `missing managed scope ${scope}`);
  }

  for (const row of [
    'local_managed_save_accepted',
    'remote_policy_rejected',
    'remote_policy_conflict',
    'remote_policy_accepted',
    'admin_session_failed_unlock',
    'history_clear_accepted_rows'
  ]) {
    assert.ok(contract.actionHistory.requiredRows.includes(row), `missing history row ${row}`);
  }
});

test('managed app contract excludes extension runtime APIs from downstream authority payload', () => {
  const contract = contractFromDoc();

  for (const token of ['chrome.', 'browser.', 'chrome.runtime', 'browser.runtime', 'chrome.tabs', 'browser.tabs']) {
    assert.ok(contract.appBoundary.forbiddenRuntimeTokens.includes(token), `missing forbidden token ${token}`);
  }

  const payload = withoutForbiddenRuntimeTokenList(contract);
  for (const token of contract.appBoundary.forbiddenRuntimeTokens) {
    assert.doesNotMatch(payload, new RegExp(token.replace('.', '\\.')));
  }

  for (const forbiddenAuthority of [
    'extension_background_session_cache',
    'extension_content_script_dom_state',
    'youtube_dom_selectors',
    'page_message_sender_state'
  ]) {
    assert.ok(contract.appBoundary.appsMustNotConsumeAsAuthority.includes(forbiddenAuthority));
  }

  for (const nativeResponsibility of [
    'app_open_lock',
    'native_main_surface_route_gate',
    'native_kids_surface_route_gate',
    'native_time_budget_gate_before_web_content',
    'native_settings_sync_lock'
  ]) {
    assert.ok(contract.appBoundary.nativeOwnedResponsibilities.includes(nativeResponsibility));
  }
});

test('extension runtime has the fields the app contract requires today', () => {
  const source = runtimeSource();

  for (const token of [
    'ftProfilesV4',
    'managedPolicyState',
    'managedActionHistory',
    'allowMainViewing',
    'allowKidsViewing',
    'defaultLaunchTarget',
    'timeLimitPolicy',
    'dailyBudgetSeconds',
    'filtertube_managed_time_limit',
    'filtertube_managed_policy',
    'policyHash',
    'sourcePublicKeyId',
    'keyVersion'
  ]) {
    assert.match(source, new RegExp(token));
  }
});

test('current app sync manifest copies runtime sources dedicated contract artifact and managed helpers', () => {
  assert.equal(fs.existsSync(appManifestPath), true);
  const manifest = JSON.parse(readAbsolute(appManifestPath));

  for (const source of [
    'js/settings_shared.js',
    'js/nanah_sync_adapter.js',
    'js/nanah_managed_live_policy.js',
    'js/nanah_managed_open_sync.js',
    'js/content_bridge.js',
    'js/injector.js',
    'js/seed.js'
  ]) {
    assert.ok(manifest.some(entry => entry.source === source), `missing app sync source ${source}`);
  }

  const contractEntry = manifest.find(entry => entry.source === contractArtifactPath);
  assert.ok(contractEntry, 'missing managed app policy contract artifact entry');
  assert.equal(contractEntry.destination, 'packages/managed-policy-contract/src/upstream/managed-app-policy-contract-v1.json');
  assert.equal(contractEntry.syncMode, 'copy');
  assert.equal(fs.existsSync(appContractDestinationPath), true);
  assert.equal(read(contractArtifactPath), readAbsolute(appContractDestinationPath));

  for (const [source, destination] of Object.entries(appManagedHelperDestinations)) {
    const helperEntry = manifest.find(entry => entry.source === source);
    assert.ok(helperEntry, `missing managed helper sync entry ${source}`);
    assert.equal(helperEntry.destination, destination.replace('/Users/devanshvarshney/FilterTubeApp/', ''));
    assert.equal(helperEntry.syncMode, 'copy');
    assert.equal(fs.existsSync(destination), true);
    assert.equal(read(source), readAbsolute(destination));
  }
});
