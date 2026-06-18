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
const appManagedWebViewActivityPath = '/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/ManagedWebViewActivity.kt';
const appManagedHelperDestinations = Object.freeze({
  'js/nanah_managed_live_policy.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_live_policy.js',
  'js/nanah_managed_open_sync.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_open_sync.js',
  'js/nanah_managed_mailbox_client.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_mailbox_client.js',
  'js/nanah_managed_local_network_client.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/nanah_managed_local_network_client.js'
});
const appManagedUiMirrorDestinations = Object.freeze({
  'js/managed_admin_authority.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/managed_admin_authority.js',
  'js/managed_parent_command_center.js': '/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/js/managed_parent_command_center.js'
});
const APP_SYNC_PENDING_STATUSES = new Set([
  'extension_contract_updated_native_sync_pending'
]);

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

test('managed app policy parity doc records extension-owned app contract artifact with app runtime proof boundary', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const contract = contractFromDoc();
  const artifactContract = contractFromArtifact();

  assert.equal(contract.schema, 'filtertube_managed_app_policy_contract');
  assert.equal(contract.version, 1);
  assert.equal(contract.runtimeBehaviorChanged, false);
  assert.ok(
    [
      'app_manifest_contract_helpers_and_android_time_entry_wiring_present_ios_pending',
      'extension_contract_updated_native_sync_pending'
    ].includes(contract.appSyncStatus),
    `unexpected app sync status ${contract.appSyncStatus}`
  );
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
    assert.match(helper.boundary, /native|server mailbox|local-network|encrypted-mailbox/);
  }
  assert.deepEqual(
    contract.uiHelperMirror.map(row => row.sourcePath),
    Object.keys(appManagedUiMirrorDestinations)
  );
  for (const helper of contract.uiHelperMirror) {
    assert.equal(helper.manifestSyncMode, 'extension_source_mirror');
    assert.equal(helper.appDestination, appManagedUiMirrorDestinations[helper.sourcePath].replace('/Users/devanshvarshney/FilterTubeApp/', ''));
    assert.match(helper.boundary, /native|policy authority|settings locks/);
  }
  assert.match(doc, /Runtime behavior changed\*\*: extension no; Android app yes/);
  assert.match(doc, /Android native\s+model and Activity runtime proof/);
  assert.match(doc, /iOS parity remains\s+pending/);
  assert.match(doc, /App Sync Boundary/);
  assert.match(doc, /Required Parity Decisions/);
  assert.match(doc, /Current Gap/);
  assert.match(doc, /flowchart TD/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('android app has native managed time-limit model and Activity runtime proof', () => {
  for (const absolutePath of [
    appProfileModelsPath,
    appPreferencesPath,
    appProfilePolicyGatePath,
    appProfilePolicyGateTestPath,
    appManagedWebViewActivityPath
  ]) {
    assert.equal(fs.existsSync(absolutePath), true, `missing app proof file ${absolutePath}`);
  }

  const profileModels = readAbsolute(appProfileModelsPath);
  const preferences = readAbsolute(appPreferencesPath);
  const policyGate = readAbsolute(appProfilePolicyGatePath);
  const policyGateTest = readAbsolute(appProfilePolicyGateTestPath);
  const managedWebViewActivity = readAbsolute(appManagedWebViewActivityPath);

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
    'timeLimitPolicy',
    'loadManagedTimeBudgetState',
    'saveManagedTimeBudgetState',
    'clearManagedTimeBudgetState',
    'KEY_MANAGED_TIME_BUDGET_STATES'
  ]) {
    if (['managedPolicyState', 'managedActionHistory', 'timeLimitPolicy'].includes(token)) {
      assert.match(profileModels, new RegExp(token));
    }
    assert.match(preferences, new RegExp(token));
  }

  assert.match(policyGate, /timeLimitPolicy\?\.policyFingerprint\(\)/);
  for (const token of [
    'enforceManagedTimeBudget(source = "startup", active = true)',
    'enforceManagedTimeBudget(source = "resume", active = true)',
    'recordManagedTimeBudgetPause()',
    'cancelManagedTimeBudgetHeartbeat()',
    'ManagedAppTimeBudgetGate.evaluate',
    'ViewingLaunchCoordinator.safeExitToLauncher',
    'loadUrl("about:blank")',
    'MANAGED_TIME_BUDGET_HEARTBEAT_MS',
    'profile.type != ProfileType.CHILD',
    'policy == null || !policy.enabled'
  ]) {
    assert.match(managedWebViewActivity, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(
    managedWebViewActivity.indexOf('enforceManagedTimeBudget(source = "startup", active = true)') <
      managedWebViewActivity.indexOf('configureWebSurface()'),
    'startup time-budget gate should run before initial web surface configuration'
  );
  assert.match(managedWebViewActivity, /binding\.webView\.removeCallbacks\(managedTimeBudgetHeartbeatRunnable\)/);
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
    'parent_account_must_be_bound_to_child_target',
    'default_master_may_manage_independent_protected_accounts',
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

  assert.equal(contract.managedRules.schema, 'filtertube_managed_rule_policy');
  for (const scope of ['keywords', 'channels', 'videos']) {
    assert.ok(contract.managedRules.requiredScopes.includes(scope), `missing managed rule scope ${scope}`);
  }
  for (const surface of ['main', 'kids']) {
    assert.ok(contract.managedRules.requiredSurfaces.includes(surface), `missing managed rule surface ${surface}`);
  }
  for (const field of ['scope', 'surface', 'targetProfileId', 'revision', 'policyHash', 'payload']) {
    assert.ok(contract.managedRules.requiredFields.includes(field), `missing managed rule field ${field}`);
  }
  for (const decision of [
    'keyword_rule_apply',
    'channel_rule_apply',
    'video_rule_apply',
    'same_validated_rule_paths_as_local_controls',
    'wrong_scope_rejected',
    'wrong_surface_rejected',
    'protected_user_cannot_mutate_rules'
  ]) {
    assert.ok(contract.managedRules.requiredDecisions.includes(decision), `missing managed rule decision ${decision}`);
  }
  assert.match(contract.managedRules.runtimeBoundary, /validated policy payloads/);

  assert.equal(contract.managedChannelLists.schema, 'filtertube_managed_channel_list_rule_source');
  for (const format of [
    'plain_text_rows',
    'csv_like_text_rows',
    'simple_json_array',
    'simple_json_object_channels',
    'public_https_text_or_json_url'
  ]) {
    assert.ok(contract.managedChannelLists.acceptedInputFormats.includes(format), `missing managed channel list input format ${format}`);
  }
  for (const action of [
    'import_pasted_or_file_list',
    'import_simple_json_list_after_preview',
    'import_public_https_url_after_preview',
    'send_channel_policy_to_verified_devices'
  ]) {
    assert.ok(contract.managedChannelLists.requiredActions.includes(action), `missing managed channel list action ${action}`);
  }
  assert.ok(
    contract.managedChannelLists.materializedRowFields.includes('managedListSourceFormat'),
    'managed list source format must be preserved on materialized rows'
  );
  for (const decision of [
    'list_url_is_data_source_only',
    'json_document_is_data_source_only',
    'parent_preview_before_write',
    'parent_reauth_before_protected_profile_write',
    'manual_channel_rows_remain_distinguishable'
  ]) {
    assert.ok(contract.managedChannelLists.requiredDecisions.includes(decision), `missing managed channel list decision ${decision}`);
  }
  assert.ok(
    contract.managedChannelLists.nativeParityRequirements.includes('preserve_managed_list_source_format_metadata'),
    'native apps must preserve managed list source format metadata'
  );

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
    'native_keyword_rule_apply',
    'native_channel_rule_apply',
    'native_video_rule_apply',
    'native_time_budget_gate_before_web_content',
    'native_settings_sync_lock'
  ]) {
    assert.ok(contract.appBoundary.nativeOwnedResponsibilities.includes(nativeResponsibility));
  }

  for (const appContract of [
    'profile_contract',
    'managed_policy_envelope_contract',
    'managed_rule_policy_contract',
    'viewing_space_policy_contract',
    'time_limit_policy_contract',
    'action_history_contract'
  ]) {
    assert.ok(contract.appBoundary.appsMustConsume.includes(appContract), `missing app contract ${appContract}`);
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
    'js/nanah_managed_mailbox_client.js',
    'js/nanah_managed_local_network_client.js',
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
  if (!APP_SYNC_PENDING_STATUSES.has(contractFromArtifact().appSyncStatus)) {
    assert.equal(fs.existsSync(appContractDestinationPath), true);
    assert.equal(read(contractArtifactPath), readAbsolute(appContractDestinationPath));
  }

  for (const [source, destination] of Object.entries(appManagedHelperDestinations)) {
    const helperEntry = manifest.find(entry => entry.source === source);
    assert.ok(helperEntry, `missing managed helper sync entry ${source}`);
    assert.equal(helperEntry.destination, destination.replace('/Users/devanshvarshney/FilterTubeApp/', ''));
    assert.equal(helperEntry.syncMode, 'copy');
    assert.equal(fs.existsSync(destination), true);
    assert.equal(read(source), readAbsolute(destination));
  }
  for (const [source, destination] of Object.entries(appManagedUiMirrorDestinations)) {
    assert.equal(fs.existsSync(path.join(repoRoot, source)), true, `missing managed UI helper source ${source}`);
    if (!APP_SYNC_PENDING_STATUSES.has(contractFromArtifact().appSyncStatus)) {
      assert.equal(fs.existsSync(destination), true, `missing managed UI helper mirror ${destination}`);
      assert.equal(read(source), readAbsolute(destination));
    }
  }
});
