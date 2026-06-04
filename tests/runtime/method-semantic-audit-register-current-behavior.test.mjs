import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_AUDIT_REGISTER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('method semantic audit register is audit-only and does not certify lexical counts as behavior proof', () => {
  const text = doc();

  assert.match(text, /Status: audit artifact only/);
  assert.match(text, /does not change product behavior/);
  assert.match(text, /repo-wide callable index proves that tracked source files are visible/);
  assert.match(text, /does not prove that each method is safe to optimize, delete,\s+merge, or trust/);
  assert.match(text, /counted" to "semantic audit candidate"/);
});

test('method semantic audit register preserves the identity waterfall and incomplete JSON boundary', () => {
  const text = doc();

  for (const token of [
    'XHR JSON / ytInitial* snapshots',
    'learned maps and renderer/player joins',
    'DOM anchors, bylines, stamped attributes, visible text',
    'bounded background resolver fetches',
    'A JSON-first method may not be',
    'Watch and Shorts DOM can be',
    'video-id-only',
    'Mix can be playlist/seed identity',
    'Kids/YTM/collaborator surfaces can expose different fields'
  ]) {
    assert.ok(text.includes(token), `missing waterfall token ${token}`);
  }
});

test('method semantic audit register lists required semantic fields before behavior changes', () => {
  const text = doc();

  for (const token of [
    'owner family and source file',
    'representative callable or source token',
    'trigger path and caller class',
    'settings/profile/list-mode inputs',
    'route/surface scope',
    'DOM writes, fetches, storage writes',
    'page messages',
    'tab opens',
    'timers',
    'observers, RAFs, intervals',
    'active, disabled, no-rule, and empty-list behavior',
    'teardown, idempotence, or restore behavior',
    'positive fixtures',
    'negative fixtures'
  ]) {
    assert.ok(text.includes(token), `missing semantic field ${token}`);
  }
});

test('method semantic audit register covers high-risk callable families', () => {
  const text = doc();

  for (const family of [
    'Seed page-global transport',
    'Background message and mutation actions',
    'Content bridge menu, quick action, and identity methods',
    'DOM fallback and hide/restore decisions',
    'Quick-block and fallback-menu lifecycle',
    'UI/settings mutation and render methods',
    'Import, export, backup, and Nanah sync',
    'Prompt, onboarding, release-note methods',
    'Build, release, website, and native sync methods',
    'Vendor and generated output boundaries'
  ]) {
    assert.ok(text.includes(family), `missing method family ${family}`);
  }
});

test('method semantic audit register cites representative source tokens that still exist', () => {
  const text = doc();
  const sourceTokenPairs = [
    ['js/seed.js', 'function setupFetchInterception()'],
    ['js/seed.js', 'function setupXhrInterception()'],
    ['js/seed.js', 'const ensureXhrResponseProcessed = (xhr) =>'],
    ['js/seed.js', 'function processWithEngine(data, dataName)'],
    ['js/background.js', "action === 'FilterTube_SetListMode'"],
    ['js/background.js', 'request.action === "FilterTube_ApplySettings"'],
    ['js/background.js', 'request.action === "recordTimeSaved"'],
    ['js/background.js', 'request.action === "fetchChannelDetails"'],
    ['js/background.js', 'function schedulePostBlockEnrichment'],
    ['js/background.js', 'async function handleAddFilteredChannel'],
    ['js/content_bridge.js', 'function extractChannelFromCard(card)'],
    ['js/content_bridge.js', 'async function injectFilterTubeMenuItem'],
    ['js/content_bridge.js', 'async function handleBlockChannelClick'],
    ['js/content_bridge.js', 'async function fetchChannelFromWatchUrl'],
    ['js/content_bridge.js', 'async function fetchChannelFromShortsUrl'],
    ['js/content/dom_fallback.js', 'async function applyDOMFallback'],
    ['js/content/dom_fallback.js', 'function shouldHideContent'],
    ['js/content/dom_helpers.js', 'function toggleVisibility'],
    ['js/content/dom_helpers.js', 'function updateContainerVisibility'],
    ['js/state_manager.js', 'const StateManager = (() =>'],
    ['js/state_manager.js', 'async function saveSettings'],
    ['js/render_engine.js', 'const RenderEngine = (() =>'],
    ['js/io_manager.js', 'async function importV3'],
    ['js/io_manager.js', 'async function importV3Encrypted'],
    ['js/nanah_sync_adapter.js', 'global.FilterTubeNanahAdapter'],
    ['js/tab-view.js', 'async function applyNanahEnvelope'],
    ['js/tab-view.js', 'function resolveTrustedNanahManagedApply'],
    ['build.js', 'async function maybePromptRelease'],
    ['build.js', 'function createGitHubRelease'],
    ['build.js', 'function uploadReleaseAsset']
  ];

  for (const [file, token] of sourceTokenPairs) {
    const identifier = token.match(/(?:function|const|async function)\s+([A-Za-z_$][\w$]*)/)?.[1]
      || token.match(/action === '([^']+)'/)?.[1]
      || token.match(/request\.action === "([^"]+)"/)?.[1]
      || token.split('.').pop();
    assert.ok(text.includes(identifier), `doc should cite representative identifier ${identifier}`);
    assert.ok(read(file).includes(token), `${file} should still contain ${token}`);
  }
});

test('method semantic audit register source-backs lifecycle UI sync release and generated boundaries', () => {
  const text = doc();
  const blockChannel = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const state = read('js/state_manager.js');
  const render = read('js/render_engine.js');
  const settings = read('js/settings_shared.js');
  const io = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const tabView = read('js/tab-view.js');
  const firstRunPrompt = read('js/content/first_run_prompt.js');
  const releasePrompt = read('js/content/release_notes_prompt.js');
  const build = read('build.js');
  const nativeSync = read('scripts/sync-native-runtime.mjs');
  const vendorBuild = read('scripts/build-nanah-vendor.mjs');
  const uiBuild = read('scripts/build-extension-ui.mjs');

  assert.match(text, /Quick-block and fallback-menu lifecycle/);
  assert.match(blockChannel, /showQuickBlockButton/);
  assert.match(blockChannel, /new MutationObserver/);
  assert.match(bridge, /fallback menu/);
  assert.match(bridge, /new MutationObserver/);

  assert.match(text, /UI\/settings mutation and render methods/);
  assert.match(state, /const StateManager = \(\(\) =>/);
  assert.match(state, /async function saveSettings/);
  assert.match(render, /const RenderEngine = \(\(\) =>/);
  assert.match(settings, /function saveSettings\(options = \{\}\)/);

  assert.match(text, /Import, export, backup, and Nanah sync/);
  assert.match(io, /async function importV3/);
  assert.match(io, /async function importV3Encrypted/);
  assert.match(nanah, /global\.FilterTubeNanahAdapter/);
  assert.match(tabView, /async function applyNanahEnvelope/);
  assert.match(tabView, /function resolveTrustedNanahManagedApply/);

  assert.match(text, /Prompt, onboarding, release-note methods/);
  assert.match(firstRunPrompt, /first[-_ ]run|FilterTube/i);
  assert.match(releasePrompt, /FilterTube_OpenWhatsNew/);

  assert.match(text, /Build, release, website, and native sync methods/);
  assert.match(build, /async function maybePromptRelease/);
  assert.match(build, /function createGitHubRelease/);
  assert.match(build, /function uploadReleaseAsset/);
  assert.match(nativeSync, /FILTERTUBE_APP_REPO/);

  assert.match(text, /Vendor and generated output boundaries/);
  assert.match(vendorBuild, /nanah\.bundle\.js/);
  assert.match(vendorBuild, /qrcode\.bundle\.js/);
  assert.match(uiBuild, /src\/extension-shell\/popup\.jsx/);
  assert.match(uiBuild, /js\/ui-shell\/popup-shell\.js/);
});

test('method semantic audit register defines implementation boundary and user-symptom mapping', () => {
  const text = doc();

  for (const token of [
    'A method cannot be optimized, deleted, broadened, or used as the single source',
    'owner + trigger + caller class',
    'settings/profile/list-mode inputs',
    'route/surface scope',
    'side-effect list',
    'disabled/no-rule/empty-list budget',
    'teardown/idempotence/restore proof',
    'empty-install lag',
    'false hiding',
    'end-screen and watch gaps',
    'engagement side effects'
  ]) {
    assert.ok(text.includes(token), `missing implementation boundary token ${token}`);
  }
});

test('method semantic audit register links the source-derived background action addendum', () => {
  const text = doc();

  for (const token of [
    'Background Message Action Addendum',
    'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs',
    'all 31 current `js/background.js`',
    'action/type branches',
    'sender/guard shape',
    'observable side effects',
    'backgroundMessageActionAuthority',
    'backgroundActionSemanticReport',
    'messageActionEffectDecision',
    'messageActionSenderContract'
  ]) {
    assert.ok(text.includes(token), `missing background action addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived content bridge top-level method addendum', () => {
  const text = doc();

  for (const token of [
    'Content Bridge Top-Level Method Addendum',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_TOP_LEVEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-bridge-top-level-method-semantic-register-current-behavior.test.mjs',
    '`js/content_bridge.js` currently has 1,189 lexical callable forms',
    '187',
    'top-level function declarations',
    '186 unique top-level function names',
    'duplicate top-level name (`injectCollaboratorPlaceholderMenu` at lines 599 and',
    '7788)',
    '14 semantic groups',
    'identity metadata',
    'main-world message',
    'clicked',
    'contentBridgeMethodAuthority',
    'contentBridgeMethodEffectReport',
    'contentBridgeCallerContract',
    'contentBridgeLifecycleBudget',
    'contentBridgeIdentityConfidenceReport'
  ]) {
    assert.ok(text.includes(token), `missing content bridge addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived background method addendum', () => {
  const text = doc();

  for (const token of [
    'Background Method Addendum',
    'docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/background-method-semantic-register-current-behavior.test.mjs',
    'source-derived top-level method inventory',
    '`js/background.js` currently has 75 top-level function declarations',
    '62 plain',
    '13 async',
    '12 semantic method groups',
    'defensive helpers and messaging',
    'profile backup/export',
    'subscription import and sender normalization',
    'security session/PIN',
    'backup download/scheduling',
    'migration/versioning',
    'post-block enrichment and',
    'profile compile/storage',
    'learned identity map caches',
    'release notes/runtime info',
    'identity resolver network work',
    'rule mutation/channel persistence',
    'backgroundMethodAuthority',
    'backgroundMethodEffectReport',
    'backgroundMethodNoWorkBudget',
    'backgroundStorageRevisionReport',
    'backgroundNetworkResolverBudget',
    'backgroundRuleMutationContract',
    'backgroundBackupScheduleAuthority'
  ]) {
    assert.ok(text.includes(token), `missing background method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived content bridge lifecycle callback addendum', () => {
  const text = doc();

  for (const token of [
    'Content Bridge Lifecycle Callback Addendum',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-bridge-lifecycle-callback-semantic-register-current-behavior.test.mjs',
    '87 current lifecycle instances',
    'nested callback-bearing lifecycle',
    'listener, observer, timer, and frame',
    'contentBridgeLifecycleCallbackAuthority',
    'contentBridgeLifecycleEffectReport',
    'contentBridgeCallbackOwnerContract',
    'contentBridgeNoRuleLifecycleBudget',
    'contentBridgeCallbackTeardownRegistry'
  ]) {
    assert.ok(text.includes(token), `missing content bridge lifecycle callback addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived filter logic method addendum', () => {
  const text = doc();

  for (const token of [
    'Filter Logic Method Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs',
    '`js/filter_logic.js` currently has 55 method and entrypoint rows',
    '12 top-level',
    '41 `YouTubeDataFilter` class methods',
    '2',
    '`FilterTubeEngine` global interface functions',
    '11 semantic method groups',
    'debug/log relay queues',
    'harvest/map writes',
    'block decisions',
    'recursion/entrypoints',
    'filterLogicMethodAuthority',
    'filterLogicMethodEffectReport',
    'filterLogicNoRuleMethodBudget',
    'filterLogicHarvestMutationDecision',
    'filterLogicEntrypointContract',
    'filterLogicMethodFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing filter logic method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived seed method addendum', () => {
  const text = doc();

  for (const token of [
    'Seed Method Addendum',
    'docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/seed-method-semantic-register-current-behavior.test.mjs',
    '`js/seed.js` currently has 35 method and callback rows',
    '13 top-level function',
    '6 local helper functions',
    '5 page/prototype patch functions',
    '6',
    'property accessor functions',
    '1 timer callback',
    '1 local wrapped-listener',
    '2 bootstrap entrypoints',
    '8 semantic',
    'bootstrap/idempotency',
    'snapshot/replay queue',
    'engine dispatch/no-work',
    '`ytInitial*` data',
    'fetch interception',
    'XHR interception',
    'settings/global',
    'seedMethodAuthority',
    'seedMethodEffectReport',
    'seedNoWorkBudget',
    'seedTransportPatchOwner',
    'seedReplayQueueBudget',
    'seedAccessorContract',
    'seedPageGlobalFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing seed method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived DOM fallback method addendum', () => {
  const text = doc();

  for (const token of [
    'DOM Fallback Method Addendum',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs',
    '`js/content/dom_fallback.js` and `js/content/dom_helpers.js` currently have 49',
    'top-level function declarations',
    '46 in `dom_fallback.js`',
    '3 in',
    '`dom_helpers.js`',
    '11 semantic method groups',
    'run-state/tracking',
    'identity normalization and compiled rules',
    'playlist/watch route identity',
    'blocked markers and stale restore',
    'dynamic style controls',
    'fallback surface handlers',
    'main DOM fallback',
    'hide decision engine',
    'shared visual writers',
    'domFallbackMethodAuthority',
    'domFallbackEffectReport',
    'domFallbackNoWorkBudget',
    'domFallbackLifecycleOwner',
    'domFallbackHideDecisionReport',
    'domFallbackSelectorTargetReport',
    'domFallbackGlobalDependencyContract',
    'domHelperVisualWriterReport'
  ]) {
    assert.ok(text.includes(token), `missing DOM fallback method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived DOM fallback lifecycle callback addendum', () => {
  const text = doc();

  for (const token of [
    'DOM Fallback Lifecycle Callback Addendum',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-lifecycle-callback-semantic-register-current-behavior.test.mjs',
    'source-derived callback/effect inventory',
    '`js/content/dom_fallback.js` currently has 13 lifecycle instances',
    '3 addEventListener instances',
    '10 setTimeout instances',
    '7 semantic callback',
    'current-watch owner retry/navigation timers',
    'main pipeline',
    'page-lifetime scroll state',
    'playlist click/ended guards',
    'deferred playlist autoplay clicks',
    'pending metadata and selected-row timers',
    'serialized pending reruns',
    'domFallbackLifecycleCallbackAuthority',
    'domFallbackLifecycleEffectReport',
    'domFallbackCallbackOwnerContract',
    'domFallbackNoRuleLifecycleBudget',
    'domFallbackCallbackTeardownRegistry',
    'domFallbackPlaylistGuardPolicy',
    'domFallbackPendingRunBudget',
    'domFallbackSyntheticNavigationBudget'
  ]) {
    assert.ok(text.includes(token), `missing DOM fallback lifecycle callback addendum token ${token}`);
  }
});

test('method semantic audit register names missing runtime authorities without implementing them', () => {
  const text = doc();

  for (const authority of [
    'methodSemanticAuthority',
    'callableEffectReport',
    'callableNoWorkBudget',
    'callableTeardownRegistry'
  ]) {
    assert.ok(text.includes(authority), `doc should name future authority ${authority}`);
    for (const sourceFile of [
      'js/seed.js',
      'js/background.js',
      'js/content_bridge.js',
      'js/content/dom_fallback.js',
      'js/state_manager.js',
      'js/tab-view.js'
    ]) {
      assert.doesNotMatch(read(sourceFile), new RegExp(authority), `${authority} should not exist in runtime source yet`);
    }
  }
});

test('method semantic audit register links the source-derived state manager method addendum', () => {
  const text = doc();

  for (const token of [
    'State Manager Method Addendum',
    'docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs',
    '`js/state_manager.js` currently has 55 IIFE-scoped function declarations',
    '21 plain function declarations',
    '34 async function declarations',
    '30 public API',
    '9 semantic method groups',
    'lock/backup/access helpers',
    'settings save/profile/broadcast',
    'channel enrichment queue',
    'keyword/channel mutations',
    'Main keyword mutations',
    'Main channel/import/map',
    'toggle/content/category',
    'theme/listener APIs',
    'storage-sync reload',
    'stateManagerMethodAuthority',
    'stateManagerMutationEffectReport',
    'stateManagerSaveQueueContract',
    'stateManagerProfileRevisionReport',
    'stateManagerRefreshBroadcastAuthority',
    'stateManagerStorageReloadBudget',
    'stateManagerListenerEventContract',
    'stateManagerChannelEnrichmentBudget'
  ]) {
    assert.ok(text.includes(token), `missing state manager method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived render engine method addendum', () => {
  const text = doc();

  for (const token of [
    'Render Engine Method Addendum',
    'docs/audit/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs',
    '`js/render_engine.js` currently has 35 IIFE-scoped declarations',
    '30 plain',
    '5 const arrow helper',
    '0 async',
    '4 public API',
    '6 semantic method groups',
    'dependency/scheduling helpers',
    'badge/source decoration',
    'channel display identity',
    'keyword rendering and row actions',
    'channel rendering and row actions',
    'collaboration grouping',
    '7 row-action listener sites',
    '26 direct `StateManager` optional calls',
    '11 unique `StateManager` methods',
    'idle batching',
    '10 `innerHTML` writes',
    '12 `setAttribute` calls',
    '0 `querySelector`',
    'renderEngineMethodAuthority',
    'renderEngineRowActionContract',
    'renderEngineDomEffectReport',
    'renderEngineIdleRenderBudget',
    'renderEngineVisibleRowParityReport',
    'renderEngineAccessibilityContract',
    'renderEngineIdentityDisplayPolicy'
  ]) {
    assert.ok(text.includes(token), `missing render engine method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived tab-view method addendum', () => {
  const text = doc();

  for (const token of [
    'Tab View Method Addendum',
    'docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/tab-view-method-semantic-register-current-behavior.test.mjs',
    '`js/tab-view.js` currently has 311 named declarations',
    '210 plain function',
    'declarations, 70 async function declarations',
    '70 async function declarations',
    '29 const arrow helper',
    '2 async const arrow helper',
    '22 semantic method',
    'groups. It separates responsive navigation',
    'responsive navigation',
    'Main/Kids filter',
    'runtime/browser-tab messaging',
    'subscription import',
    'managed child editing',
    'lock/navigation',
    'Nanah mode/scope/target/session/apply flows',
    'PIN/profile',
    'managed row',
    'list-mode rendering',
    'dashboard stats',
    '147 listener sites',
    '14 `setTimeout` calls',
    '1 `setInterval` call',
    '11 `requestAnimationFrame` calls',
    '333 `document.createElement` calls',
    '`innerHTML` writes',
    '61 `setAttribute` calls',
    '42 direct `StateManager` calls',
    '14 unique `StateManager` methods',
    '4 `RenderEngine` calls',
    '`sendRuntimeMessage` calls',
    'tabViewMethodAuthority',
    'tabViewListenerLifecycleContract',
    'tabViewListModeMutationReport',
    'tabViewManagedChildEditContract',
    'tabViewNanahSyncPolicyReport',
    'tabViewImportExportMutationPlan',
    'tabViewProfileLockAccessReport',
    'tabViewDashboardRenderBudget',
    'tabViewNavigationStateContract'
  ]) {
    assert.ok(text.includes(token), `missing tab-view method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived settings shared method addendum', () => {
  const text = doc();

  for (const token of [
    'Settings Shared Method Addendum',
    'docs/audit/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs',
    '`js/settings_shared.js` currently has 29 named declarations',
    '27 IIFE-scoped function declarations',
    '2 local const arrow helper declarations',
    '0 async function declarations',
    '21 public `FilterTubeSettings` entries',
    '9 semantic method groups',
    'defensive object helpers',
    'keyword normalization and compilation',
    'channel normalization',
    'profile migration',
    'compiled settings building',
    'settings load/read-path migration',
    'settings save/storage persistence',
    'theme preference/change helpers',
    'storage change detection',
    '36 `SETTINGS_KEYS` entries',
    '38 effective',
    '`SETTINGS_CHANGE_KEYS` entries',
    '3 `STORAGE_NAMESPACE.get` calls',
    '5 `STORAGE_NAMESPACE.set` calls',
    '2 `chrome.runtime.lastError` reads',
    '4 `buildCompiledSettings` calls',
    '3 `buildProfilesV4FromLegacyState` calls',
    '1 theme DOM attribute write',
    '0 listener/timer/selector calls',
    'settingsSharedMethodAuthority',
    'settingsSharedStorageDependencyManifest',
    'settingsSharedProfileMigrationReport',
    'settingsSharedReadPathWriteBudget',
    'settingsSharedSaveResultContract',
    'settingsSharedCompiledSettingsReport',
    'settingsSharedThemePreferenceContract',
    'settingsSharedChangeDetectionContract'
  ]) {
    assert.ok(text.includes(token), `missing settings shared method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived io manager method addendum', () => {
  const text = doc();

  for (const token of [
    'IO Manager Method Addendum',
    'docs/audit/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs',
    '`js/io_manager.js` currently has 52 named declarations',
    '46 IIFE-scoped function declarations',
    '30 plain function declarations',
    '16 async function declarations',
    '6 local const arrow helper declarations',
    '11 public',
    '`FilterTubeIO` entries',
    '12 semantic method groups',
    'primitive defensive helpers',
    'download runtime helpers',
    'keyword/channel normalization',
    'profile scope and security',
    'legacy profile derivation and V3 persistence',
    'storage access wrappers',
    'profiles V4 migration and sanitization',
    'import format parsing',
    'export serialization',
    'import merge and persistence',
    'encrypted/Nanah state',
    'auto-backup download/rotation',
    '4 storage key constants',
    '5 `readStorage` occurrences',
    '8 `writeStorage` occurrences',
    '1 `STORAGE_NAMESPACE.get` call',
    '1 `STORAGE_NAMESPACE.set` call',
    '1 `chrome.runtime.lastError` read',
    '2 `runtimeAPI.downloads.download` calls',
    '1 `runtimeAPI.downloads.search` call',
    '2 `runtimeAPI.downloads.erase` calls',
    '2 `URL.createObjectURL` calls',
    '1 `URL.revokeObjectURL` call',
    '2 `Blob`',
    'constructor calls',
    '2 `setTimeout` calls',
    '1 `clearTimeout` call',
    '0 listener/interval/selector calls',
    'ioManagerMethodAuthority',
    'ioManagerProfileMigrationReport',
    'ioManagerImportMutationPlan',
    'ioManagerExportScopeContract',
    'ioManagerPinAuthContract',
    'ioManagerEncryptedBackupContract',
    'ioManagerNanahRestorePolicy',
    'ioManagerDownloadLifecycleBudget',
    'ioManagerAutoBackupScheduleAuthority',
    'ioManagerBackupRotationReport',
    'ioManagerStorageWriteEffectReport',
    'ioManagerFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing io manager method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived popup method addendum', () => {
  const text = doc();

  for (const token of [
    'Popup Method Addendum',
    'docs/audit/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/popup-method-semantic-register-current-behavior.test.mjs',
    '`js/popup.js`',
    'currently has 53 named declarations',
    '36 plain function declarations',
    '11 async function declarations',
    '3 const arrow helper declarations',
    '3 async const arrow helper declarations',
    '0 public exported API entries',
    '11 semantic method groups',
    'popup bootstrap/content DOM',
    'video filter controls',
    'content-control visibility',
    'runtime messaging/session unlock',
    'list mode controls',
    'defensive helpers',
    'profile metadata helpers',
    'dropdown/modal/PIN unlock',
    'lock gate/profile switch',
    'rendering/search sync',
    'enabled toggle',
    '52 `document.getElementById` calls',
    '23 unique getElementById ids',
    '82 `document.createElement` calls',
    '30 `addEventListener` calls',
    '3 `document.addEventListener` calls',
    '2 `setTimeout` calls',
    '1 `requestAnimationFrame` call',
    '5 `innerHTML` writes',
    '34 `setAttribute` calls',
    '19 `StateManager` references',
    '2 `RenderEngine`',
    '13 `UIComponents` references',
    '4 `sendRuntimeMessage` occurrences',
    'popupMethodAuthority',
    'popupDomEffectReport',
    'popupListenerLifecycleContract',
    'popupListModeMutationReport',
    'popupProfileLockAccessReport',
    'popupProfileSwitchMutationPlan',
    'popupContentControlVisibilityReport',
    'popupVideoFilterRoutePolicy',
    'popupRuntimeMessageContract',
    'popupRenderStateDependencyReport',
    'popupAccessibilityContract',
    'popupFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing popup method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived UI components method addendum', () => {
  const text = doc();

  for (const token of [
    'UI Components Method Addendum',
    'docs/audit/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/ui-components-method-semantic-register-current-behavior.test.mjs',
    '`js/ui_components.js` currently has 33 named declarations',
    '22 plain function declarations',
    '11 const arrow helper declarations',
    '0 async function declarations',
    '19 public',
    '`UIComponents` entries',
    '7 semantic method groups',
    'module theme/profile helpers',
    'button/icon factories',
    'input/select factories',
    'tab factories',
    'list/card factories',
    'enhanced select dropdown helpers',
    'toast lifecycle',
    '36 `document.createElement` calls',
    '1 `document.querySelectorAll` call',
    '17 `addEventListener` calls',
    '1 `document.addEventListener` call',
    '2 `window.addEventListener` calls',
    '3 `setTimeout` calls',
    '4 `requestAnimationFrame` calls',
    '1 `cancelAnimationFrame` call',
    '1 `MutationObserver` constructor',
    '0 `disconnect` calls',
    '5 `innerHTML` writes',
    '21 `setAttribute` calls',
    '2 `document.body.appendChild` calls',
    '2 `dispatchEvent` calls',
    'uiComponentsMethodAuthority',
    'uiComponentsDomEffectReport',
    'uiComponentsListenerLifecycleContract',
    'uiComponentsDropdownTeardownRegistry',
    'uiComponentsToastLifecycleBudget',
    'uiComponentsAccessibilityContract',
    'uiComponentsSelectorScopeReport',
    'uiComponentsPublicApiManifest',
    'uiComponentsRawHtmlPolicy',
    'uiComponentsProfileColorContract',
    'uiComponentsFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing UI components method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived security manager method addendum', () => {
  const text = doc();

  for (const token of [
    'Security Manager Method Addendum',
    'docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/security-manager-method-semantic-register-current-behavior.test.mjs',
    '`js/security_manager.js` currently has 12 named declarations',
    '6 plain function declarations',
    '6 async function declarations',
    '0 const arrow helper declarations',
    '4 public',
    '`FilterTubeSecurity` entries',
    '5 semantic method groups',
    'crypto defensive helpers',
    'byte encoding helpers',
    'PBKDF2 derivation',
    'PIN verifier lifecycle',
    'encrypted JSON lifecycle',
    '3 `TextEncoder` constructions',
    '1 `TextDecoder` construction',
    '1 `btoa` call',
    '1 `atob` call',
    '1 `cryptoApi.getRandomValues` call',
    '2 `subtle.importKey` calls',
    '1 `subtle.deriveBits` call',
    '1 `subtle.deriveKey` call',
    '1 `subtle.encrypt` call',
    '1 `subtle.decrypt` call',
    '1 `JSON.stringify` call',
    '1 `JSON.parse` call',
    '7 `throw new Error` statements',
    '0 `addEventListener` calls',
    '0 `setTimeout` calls',
    '0 `document` references',
    '0 `window` references',
    'securityManagerMethodAuthority',
    'securityManagerCryptoAvailabilityContract',
    'securityManagerPinVerifierContract',
    'securityManagerEncryptedJsonContract',
    'securityManagerKdfCompatibilityReport',
    'securityManagerTimingComparisonPolicy',
    'securityManagerPayloadValidationReport',
    'securityManagerCallerMutationGate',
    'securityManagerFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing security manager method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived content controls catalog method addendum', () => {
  const text = doc();

  for (const token of [
    'Content Controls Catalog Method Addendum',
    'docs/audit/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-controls-catalog-method-semantic-register-current-behavior.test.mjs',
    '`js/content_controls_catalog.js` currently',
    'has 3 named declarations',
    '3 plain function declarations',
    '0 async function declarations',
    '0 const arrow helper declarations',
    '3 public',
    '`FilterTubeContentControlsCatalog` entries',
    '2 semantic method groups',
    '7 catalog groups',
    '29 catalog controls',
    '`core`, `feed`, `watch`, `video_info`, `player`',
    '`navigation`, and `search`',
    '7 `accentColor` entries',
    '1 empty description entry',
    '1 escaped-newline description entry',
    '2 `map` calls',
    '1 `flatMap` call',
    '1 `find` call',
    '1 `Array.isArray` call',
    '0 `document` references',
    '0 `window` references',
    '0 `addEventListener` calls',
    '0 `setTimeout` calls',
    '0 `MutationObserver` references',
    'preserving nested control object identity',
    'contentControlsCatalogMethodAuthority',
    'contentControlsCatalogRuntimeSemanticsManifest',
    'contentControlsCatalogKeyParityReport',
    'contentControlsCatalogRouteScopeReport',
    'contentControlsCatalogControlEffectBudget',
    'contentControlsCatalogAccessorCopyContract',
    'contentControlsCatalogUiRuntimeAlignmentReport',
    'contentControlsCatalogFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing content controls catalog method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived Nanah sync adapter method addendum', () => {
  const text = doc();

  for (const token of [
    'Nanah Sync Adapter Method Addendum',
    'docs/audit/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/nanah-sync-adapter-method-semantic-register-current-behavior.test.mjs',
    '`js/nanah_sync_adapter.js` currently has 23 named declarations',
    '16 plain function declarations',
    '7 async function declarations',
    '0 const arrow helper declarations',
    '10 public',
    '`FilterTubeNanahAdapter` entries',
    '5 semantic method groups',
    'defensive normalization/merge helpers',
    'scoped profile transfer',
    'runtime/device descriptor helpers',
    'envelope build/summary',
    'incoming envelope apply',
    '3 `JSON.stringify` calls',
    '3 `JSON.parse` calls',
    '8 `throw new Error` statements',
    '2 `new Map` calls',
    '2 `await io.loadProfilesV4` calls',
    '1 `await io.saveProfilesV4` call',
    '1 `await io.exportV3` call',
    '1 `return io.importV3` call',
    '0 `document` references',
    '0 `addEventListener` calls',
    '0 `setTimeout` calls',
    'preview strategy writes no storage',
    'Main/Kids route to scoped V4 apply',
    'active/full route to `io.importV3()`',
    'nanahAdapterMethodAuthority',
    'nanahAdapterEnvelopeContract',
    'nanahAdapterScopedMutationReport',
    'nanahAdapterPreviewApplyEquivalenceReport',
    'nanahAdapterTargetProfileAuthority',
    'nanahAdapterTrustedSenderContract',
    'nanahAdapterProfileLockGate',
    'nanahAdapterRuntimeRefreshContract',
    'nanahAdapterSanitizerParityReport',
    'nanahAdapterFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing Nanah sync adapter method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived block channel method addendum', () => {
  const text = doc();

  for (const token of [
    'Block Channel Method Addendum',
    'docs/audit/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs',
    '`js/content/block_channel.js` currently has 61 named method/helper/callback',
    '40 function declarations in scope',
    '35 plain function declarations',
    '5 async function declarations',
    '21 const helper/callback declarations',
    '19 const arrow helper/callback',
    '2 local const IIFE result declarations',
    '9 semantic method groups',
    'module state/mode gates',
    'surface overlay/visibility helpers',
    'card target/anchor resolution',
    'viewport hover/occlusion work',
    'quick-block identity/action builders',
    'mutation and optimistic hide paths',
    'quick-block DOM lifecycle',
    'dropdown injection lifecycle',
    'Kids native block sync',
    '34 `addEventListener` calls',
    '6 `MutationObserver` references',
    '6 `observe` calls',
    '2 `disconnect` calls',
    '11 `setTimeout` calls',
    '1 `setInterval` call',
    '3 `requestAnimationFrame` calls',
    '5 `document.createElement` occurrences',
    '17 `setAttribute` calls',
    '11 `style.display` references',
    '2 `chrome.runtime?.sendMessage` calls',
    '2 `addChannelDirectly` references',
    '2 `applyDOMFallback` references',
    'delayed boot starts menu and quick-block',
    'observers after 1000ms',
    '`showQuickBlockButton === true` and non-whitelist mode',
    "`style.display = 'none'`",
    '`FilterTube_KidsBlockChannel`',
    'no `removeEventListener` path',
    'no `clearInterval` path',
    'blockChannelMethodAuthority',
    'blockChannelQuickBlockLifecycleContract',
    'blockChannelQuickBlockActionReport',
    'blockChannelAffordanceNoWorkBudget',
    'blockChannelSelectorTargetReport',
    'blockChannelOptimisticHideReport',
    'blockChannelDropdownObserverRegistry',
    'blockChannelKidsNativeSyncContract',
    'blockChannelMutationSenderContract',
    'blockChannelFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing block channel method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived collaborator dialog method addendum', () => {
  const text = doc();

  for (const token of [
    'Collaborator Dialog Method Addendum',
    'docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs',
    '`js/content/collab_dialog.js` currently has 13 named function declarations',
    '13 plain function declarations',
    '0 async function declarations',
    '0 const helper/callback declarations',
    '9 arrow callback sites in scope',
    '6 semantic method groups',
    'refresh and boot lifecycle',
    'trigger capture and queueing',
    'entry resolution',
    'card mutation and propagation',
    'broadcast and extraction',
    'dialog acceptance/observer dispatch',
    '7 `document` literal occurrences',
    '14 `window` literal occurrences',
    '1 `document.querySelectorAll` call',
    '6 element `querySelector` calls',
    '1 `querySelector?.` call',
    '2 `closest` calls',
    '1 `matches` call',
    '3 `addEventListener` calls',
    '0 `removeEventListener` calls',
    '1 `MutationObserver` reference',
    '1 `observe` call',
    '0 `disconnect` calls',
    '2 `setTimeout` calls',
    '2 `clearTimeout` calls',
    '0 `setInterval` calls',
    '0 `requestAnimationFrame` calls',
    '7 `setAttribute` calls',
    '4 `removeAttribute` calls',
    '1 `postMessage` call',
    '2 `applyDOMFallback`',
    '7 `pendingCollabCards` references',
    '12 `pendingCollabDialogTrigger` references',
    '2 `resolvedCollaboratorsByVideoId` references',
    '1 `refreshActiveCollaborationMenu` reference',
    'boot only runs from `DOMContentLoaded`',
    '`window.collabDialogModule` exports',
    'document click/keydown capture listeners have no removal path',
    'dialog observer has no disconnect path',
    'collaborator cards can be mutated',
    '`resolvedCollaboratorsByVideoId` can be updated',
    '`FilterTube_CollabDialogData` is posted with wildcard target',
    'collabDialogMethodAuthority',
    'collabDialogLifecycleContract',
    'collabDialogPendingCardAuthority',
    'collabDialogMutationReport',
    'collabDialogMessageTrustContract',
    'collabDialogSelectorTargetReport',
    'collabDialogIdentityConfidenceReport',
    'collabDialogNoWorkBudget',
    'collabDialogTeardownRegistry',
    'collabDialogFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing collaborator dialog method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived injector method addendum', () => {
  const text = doc();

  for (const token of [
    'Injector Method Addendum',
    'docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/injector-method-semantic-register-current-behavior.test.mjs',
    '`js/injector.js` currently has 103 named method/helper/callback declarations',
    '64 function declarations in scope',
    '61 plain function declarations',
    '3 async function declarations',
    '39 const helper/callback declarations',
    '31 const arrow helper/callback declarations',
    '1 async const arrow helper/callback',
    '7 const IIFE result declarations',
    '100 arrow callback sites',
    '12 semantic method groups',
    'bridge lifecycle and logging',
    'collaborator identity sanitization',
    'subscription context helpers',
    'seed collection',
    'subscription expansion/wait work',
    'subscription entry',
    'credentialed YouTubei fetch queueing',
    'matcher/cache work',
    'collaborator data extraction',
    'channel snapshot identity',
    'collaborator snapshot/DOM search',
    'seed hook/queue lifecycle',
    '15 `document` literal occurrences',
    '123 `window` literal occurrences',
    '10 `location` literal occurrences',
    '1 `document.querySelector` call',
    '3 `document.querySelectorAll` calls',
    '1 element `querySelector` call',
    '2 `querySelectorAll?.` calls',
    '2 `window.addEventListener` calls',
    '0 `removeEventListener` calls',
    '0 `MutationObserver` references',
    '5 `setTimeout` calls',
    '2 `clearTimeout` calls',
    '1 `setInterval` call',
    '2 `clearInterval` calls',
    '1 `fetch` call',
    '2 `AbortController` references',
    '10 `postMessage` calls',
    '10 wildcard postMessage target calls',
    '2 `dispatchEvent` calls',
    '1 click call',
    '3 `scrollTo` calls',
    '2 `Object.defineProperty` calls',
    '4 `JSON.parse` calls',
    '2 `JSON.stringify` calls',
    '7 `new Map` calls',
    '19 `new Set` calls',
    '7 `WeakSet` references',
    '58 `window.filterTube` references',
    '15 `FilterTubeEngine` references',
    '7 `initialDataQueue` references',
    '6 `collaboratorCache` references',
    'import bridge installation runs before',
    'settings messages merge caller payload',
    'subscription import can scroll/click and issue credentialed',
    '`/youtubei/v1/browse?prettyPrint=false` requests',
    'responses use wildcard page messages',
    '`connectToSeedGlobal()` writes',
    '`window.filterTube.processFetchResponse`',
    'the backup',
    '`ytInitialData` hook uses `Object.defineProperty`',
    'engine readiness interval',
    'there is no listener teardown path',
    'injectorMethodAuthority',
    'injectorBridgeMessageTrustContract',
    'injectorSettingsRevisionContract',
    'injectorSubscriptionImportActionToken',
    'injectorSubscriptionImportWorkBudget',
    'injectorYoutubeiFetchPolicy',
    'injectorSnapshotSearchProvenance',
    'injectorCollaboratorIdentityConfidenceReport',
    'injectorChannelLookupAuthority',
    'injectorSeedHookLifecycleContract',
    'injectorPageGlobalPatchReport',
    'injectorFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing injector method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived content menu method addendum', () => {
  const text = doc();

  for (const token of [
    'Content Menu Method Addendum',
    'docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs',
    '`js/content/menu.js`',
    '2 named function declarations in scope',
    '2 plain function declarations',
    '0 async function declarations',
    '0 const helper/callback declarations',
    '1 module-scoped state declaration',
    '0 arrow callback sites',
    '2 semantic method groups',
    'HTML escaping',
    'style injection',
    '3 `document` literal occurrences',
    '0 `window` literal occurrences',
    '0 `location` literal occurrences',
    '0 selector API calls',
    '1 `document.createElement` call',
    '1 `document.documentElement` reference',
    '0 `addEventListener` calls',
    '0 `removeEventListener` calls',
    '0 `MutationObserver` references',
    '0 `setTimeout` calls',
    '0 `setInterval` calls',
    '0 `innerHTML` references',
    '1 `textContent` reference',
    '1 `appendChild` call',
    '0 `postMessage` calls',
    '0 `chrome.runtime` references',
    '0 `fetch` calls',
    '5 `.replace` calls',
    '1 `String` call',
    '1 `styleTag.id` assignment',
    '3 `filterTubeMenuStylesInjected` references',
    '2 `styleContent` references',
    '21 `filtertube-menu-item` selector token occurrences',
    '31 `filtertube-block-channel-item` selector token occurrences',
    '9 `filtertube-modern-bottom-sheet-item` selector token occurrences',
    '14 `filtertube-filter-all-toggle` selector token occurrences',
    '17 `filtertube-collab-selected` selector token occurrences',
    '114 `!important` declarations',
    '`js/content/menu.js` is manifest-loaded before `js/content_bridge.js`',
    '`escapeHtml()` replaces five HTML-sensitive characters',
    '`ensureFilterTubeMenuStyles()` uses a boolean-only injection guard',
    '`#filtertube-menu-styles` to `document.documentElement`',
    'check beyond the boolean',
    'has no style teardown path',
    'explicit browser global',
    'contentMenuMethodAuthority',
    'contentMenuStyleInjectionContract',
    'contentMenuHtmlEscapingContract',
    'contentMenuStyleScopeReport',
    'contentMenuLoadOrderContract',
    'contentMenuThemeParityReport',
    'contentMenuTeardownRegistry',
    'contentMenuFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing content menu method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived bridge settings method addendum', () => {
  const text = doc();

  for (const token of [
    'Bridge Settings Method Addendum',
    'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/bridge-settings-method-semantic-register-current-behavior.test.mjs',
    '`js/content/bridge_settings.js`',
    '23 named method/helper/callback',
    '12 plain function declarations',
    '1 named function',
    'expression declaration',
    '10 const helper/callback declarations',
    '5 const arrow',
    'helper/callback declarations',
    '5 const IIFE result declarations',
    '0 async',
    'function declarations',
    '0 async const arrow declarations',
    '39 arrow callback',
    'sites in scope',
    '7 semantic method groups',
    'import readiness',
    'subscription import requests',
    'runtime action profile gates',
    'host-normalization behavior',
    'background fetch/debug work',
    'seed relay lifecycle',
    'storage refresh fanout',
    '5 `document` literal occurrences',
    '55 `window` literal occurrences',
    '6 `location` literal occurrences',
    '3 `globalThis` literal occurrences',
    '9 `browserAPI_BRIDGE` references',
    '10 `pendingSubscriptionImportRequests` references',
    '4 `subscriptionImportRequestId` references',
    '2 `window.addEventListener` calls',
    '0 `removeEventListener` calls',
    '1 runtime `onMessage.addListener` call',
    '1 storage `onChanged.addListener` call',
    '6 `setTimeout` calls',
    '2 `clearTimeout` calls',
    '0 `MutationObserver` references',
    '2 `postMessage`',
    '2 wildcard postMessage target calls',
    '2 runtime sendMessage calls',
    '6 `applyDOMFallback` references',
    '4 `injectMainWorldScripts` references',
    '5 `sendSettingsToMainWorld` references',
    '4 `tryApplySettingsToSeed` references',
    '3 `scheduleSeedRetry` references',
    '2 `handleStorageChanges` references',
    'globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld',
    "event.source === window",
    "data.source === 'injector'",
    'FilterTube_Ping',
    'FilterTube_RefreshNow',
    'FilterTube_ImportSubscribedChannels',
    'FilterTube_ApplySettings',
    'getCompiledSettings',
    'Kids empty whitelist',
    'FilterTube_SettingsToInjector',
    'seed settings retry every',
    '`channelMap`-only storage writes are ignored',
    '`videoChannelMap`/`videoMetaMap` writes refresh without forced DOM reprocess',
    'bridgeSettingsMethodAuthority',
    'bridgeSettingsMessageTrustContract',
    'bridgeSettingsSubscriptionImportActionToken',
    'bridgeSettingsSubscriptionImportProgressBudget',
    'bridgeSettingsRuntimeActionSenderContract',
    'bridgeSettingsSettingsRevisionContract',
    'bridgeSettingsSeedRelayBudget',
    'bridgeSettingsStorageRefreshAuthority',
    'bridgeSettingsProfileHostContract',
    'bridgeSettingsFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing bridge settings method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived handle resolver method addendum', () => {
  const text = doc();

  for (const token of [
    'Handle Resolver Method Addendum',
    'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/handle-resolver-method-semantic-register-current-behavior.test.mjs',
    '`js/content/handle_resolver.js`',
    '7 named method/helper',
    '6 plain function declarations',
    '1 async function',
    '0 const helper/callback declarations',
    '0 const arrow',
    '5 arrow callback sites',
    '4 semantic',
    'learned map persistence',
    'handle normalization',
    'DOM fallback rerun scheduling',
    'resolver fetch/cache behavior',
    '0 `document` literal occurrences',
    '5 `window` literal occurrences',
    '4 `browserAPI_BRIDGE` references',
    '8 `currentSettings` references',
    '3 `applyDOMFallback` references',
    '15 `resolvedHandleCache` references',
    '4 `pendingDomFallbackRerunTimer` references',
    '2 `FilterTube_UpdateChannelMap`',
    '1 `fetchChannelDetails` reference',
    '1 `updateChannelMap` reference',
    '12 `channelMap` references',
    '4 `PENDING` token occurrences',
    '2 `skipNetwork`',
    '3 `backgroundOnly`',
    '1 `setTimeout` call',
    '0 `addEventListener` calls',
    '0 `MutationObserver` references',
    '2 `postMessage`',
    '2 runtime sendMessage calls',
    '1 `fetch` call',
    '`browserAPI_BRIDGE.storage.local.get` reference',
    '1 `response.text` reference',
    '1 `text.match` reference',
    '`channelMap` before network work',
    '`PENDING` sentinel',
    '`backgroundOnly` repair',
    '`fetchChannelDetails`',
    '`/@handle/about`',
    '`FilterTube_UpdateChannelMap` with wildcard target',
    '`currentSettings.channelMap`',
    '250ms forced DOM fallback rerun',
    'no listener, observer, interval, teardown',
    'settings revision, network',
    'message trust token',
    'handleResolverMethodAuthority',
    'handleResolverNetworkPolicy',
    'handleResolverCacheContract',
    'handleResolverMapWriteAuthority',
    'handleResolverPageMessageTrustContract',
    'handleResolverDomFallbackRerunBudget',
    'handleResolverBackgroundFetchContract',
    'handleResolverIdentityConfidenceReport',
    'handleResolverNoRuleBudget',
    'handleResolverFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing handle resolver method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived DOM extractors method addendum', () => {
  const text = doc();

  for (const token of [
    'DOM Extractors Method Addendum',
    'docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-extractors-method-semantic-register-current-behavior.test.mjs',
    '`js/content/dom_extractors.js`',
    '1,103 source lines',
    '18',
    'top-level function declarations',
    '0 async function declarations',
    '5 local const',
    '23 arrow token sites',
    '47',
    '`VIDEO_CARD_SELECTORS` entries',
    '5 semantic method groups',
    'identity stamping and recycled-node cleanup',
    'card selector and title',
    'duration parsing and cache behavior',
    'channel metadata',
    'video id extraction waterfall',
    '2 `document` literal occurrences',
    '2 `window` literal occurrences',
    '3 `location` literal occurrences',
    '21 `querySelector` calls',
    '`querySelectorAll` calls',
    '9 `closest` calls',
    '20 `getAttribute` calls',
    '`setAttribute` calls',
    '59 `removeAttribute` calls',
    '8 `hasAttribute` calls',
    '`classList.remove` calls',
    '2 `style.display` references',
    '10 `textContent`',
    '3 `innerText` references',
    '`data-filtertube-*` token',
    '0 `setTimeout` calls',
    '0 `addEventListener` calls',
    '0 `MutationObserver` references',
    '0 `postMessage` calls',
    '0 runtime sendMessage',
    '0 `fetch` calls',
    'stamping can clear stale',
    'clear stale channel, hidden, blocked, collaborator, processed',
    'trust or remove cached',
    'write new DOM channel stamps',
    'empty `data-filtertube-duration` negative cache',
    'prefers Kids/current hrefs',
    'stamped, dataset, attribute',
    'selected data-host slots',
    'domExtractorMethodAuthority',
    'domExtractorIdentityConfidenceReport',
    'domExtractorSelectorScopeContract',
    'domExtractorCacheFreshnessContract',
    'domExtractorVideoStampMutationReport',
    'domExtractorChannelMetadataReport',
    'domExtractorDurationCacheBudget',
    'domExtractorInnerTextBudget',
    'domExtractorRecycledNodeRestoreProof',
    'domExtractorFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing DOM extractors method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived shared identity method addendum', () => {
  const text = doc();

  for (const token of [
    'Shared Identity Method Addendum',
    'docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/shared-identity-method-semantic-register-current-behavior.test.mjs',
    '`js/shared/identity.js`',
    '808 source lines',
    '22 IIFE-scoped named function declarations',
    '22',
    'plain function declarations',
    '0 async function declarations',
    '5 const arrow helper',
    '1 returned arrow helper',
    '8 arrow token sites',
    '14',
    'public `FilterTubeIdentity` API entries',
    '6 semantic method groups',
    'handle normalization',
    'canonical UC/custom URL',
    'filter index construction',
    'indexed channel matching',
    'direct one-filter matching',
    'fast HTML fragment identity extraction',
    '0 `document` literal occurrences',
    '3 `window` literal occurrences',
    '3 `self` literal occurrences',
    '1 `globalThis` literal occurrence',
    '`new URL` calls',
    '`JSON.parse` call',
    '`decodeURIComponent` calls',
    '`new RegExp` call',
    '`new Set` calls',
    '`new Map` calls',
    '`Array.isArray`',
    '9 try/catch blocks',
    '0 listeners',
    '0 observers',
    '0 timers',
    '0 fetches',
    'runtime messages',
    'page messages',
    '1 `Object.assign` export merge',
    '`normalizeUcIdForComparison` internal',
    'optional probe',
    'existing extra `root.FilterTubeIdentity` keys',
    'encoded zero-width handles',
    "`@some` for `normalizeHandleValue('@Some Handle')`",
    'indexed stable-name',
    'direct `channelMatchesFilter`',
    'object filters by equal name',
    'Name-only strings can match',
    'plain string name by metadata name',
    'Fast HTML extraction returns null',
    'sharedIdentityMethodAuthority',
    'sharedIdentityApiManifest',
    'sharedIdentityNormalizationContract',
    'sharedIdentityMatchDecisionReport',
    'sharedIdentityIndexParityReport',
    'sharedIdentityCallerParityReport',
    'sharedIdentityHtmlExtractionProvenance',
    'sharedIdentityNameFallbackPolicy',
    'sharedIdentityUnicodeFixtureProvenance',
    'sharedIdentityLoadOrderContract'
  ]) {
    assert.ok(text.includes(token), `missing shared identity method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived prompt onboarding method addendum', () => {
  const text = doc();

  for (const token of [
    'Prompt Onboarding Method Addendum',
    'docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/prompt-onboarding-method-semantic-register-current-behavior.test.mjs',
    '`js/content/first_run_prompt.js`',
    '`js/content/release_notes_prompt.js`',
    '440 combined source',
    '2 prompt content-script modules',
    '9 named function declarations',
    '9 plain',
    '0 async function declarations',
    '1 const arrow callback',
    '14 arrow token sites',
    '4 semantic method groups',
    'theme palette selection',
    'DOM overlay assembly',
    'dismissal/ack behavior',
    'eligibility requests',
    '31 `document` literal occurrences',
    '6 `window` literal',
    '2 `location` literal',
    '18 `document.createElement`',
    '3 `document.getElementById`',
    '18 `appendChild`',
    '6 `onclick`',
    '2 `addEventListener`',
    '0 `removeEventListener`',
    '`MutationObserver` references',
    '3 `setTimeout`',
    '0 intervals',
    '0 fetches',
    'runtime sendMessage calls',
    '1 runtime `getURL` call',
    '1 `window.open` call',
    '`location.href` write',
    '1 `window.location.reload` call',
    'loads `release_notes_prompt.js` before `first_run_prompt.js`',
    'injects only',
    'guards duplicate',
    'higher',
    'z-index',
    'anonymous style nodes',
    'sends first-run completion before reload',
    '`FilterTube_OpenWhatsNew` with',
    '`window.open`/`location.href`',
    'PromptCoordinator',
    'promptQueue',
    'activePromptOwner',
    'promptOnboardingMethodAuthority',
    'promptOnboardingQueueContract',
    'promptOnboardingSenderClassContract',
    'promptOnboardingStorageAckReport',
    'promptOnboardingUrlNavigationPolicy',
    'promptOnboardingDomLifecycleContract',
    'promptOnboardingViewportFitProof',
    'promptOnboardingDuplicateOverlayRegistry',
    'promptOnboardingStyleTeardownRegistry',
    'promptOnboardingFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing prompt onboarding method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived bridge injection method addendum', () => {
  const text = doc();

  for (const token of [
    'Bridge Injection Method Addendum',
    'docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs',
    '`js/content/bridge_injection.js`',
    '5 named method/helper',
    '1 plain function declaration',
    '2 async function',
    '1 named function expression declaration',
    '1 async named function',
    '0 const helper/callback declarations',
    '0 const arrow',
    '8 arrow callback sites',
    '4 semantic',
    'method groups',
    'debug/global bootstrap',
    'background scripting',
    'fallback DOM script injection',
    'main-world orchestration',
    '15 `globalThis` literal occurrences',
    '15 `bridgeState` references',
    '5 `scriptsInjected` references',
    '3 `injectionInProgress` references',
    '7 `injectionPromise` references',
    '4 `browserAPI_BRIDGE` references',
    '4 `IS_FIREFOX_BRIDGE` references',
    '5 `currentSettings` references',
    '7 `debugLog` references',
    '4 `injectMainWorldScripts` references',
    '2 `requestSettingsFromBackground` references',
    '1 `api.runtime.sendMessage`',
    '1 `api.runtime.getURL`',
    '1 `api.scripting?.executeScript`',
    '4 `document` literal occurrences',
    '1 `document.createElement` call',
    '1 `appendChild` call',
    '2 `setTimeout` calls',
    '0 `addEventListener` calls',
    '0 `removeEventListener` calls',
    '0 `MutationObserver` references',
    '0 `postMessage` calls',
    '2 `new Promise` calls',
    '2 `new Error` calls',
    '3 try',
    '3 catch blocks',
    '1 finally block',
    '2 await expressions',
    '`script.onload` assignment',
    '1 `script.onerror` assignment',
    'Chromium injection sends background action',
    '`injectScripts`',
    'background maps caller script names to `js/*.js`',
    '`MAIN` world',
    'fallback browsers append web-accessible script tags',
    '`document.head || document.documentElement`',
    'Firefox adds `seed` only',
    'schedules `requestSettingsFromBackground()`',
    'failed injection clears `injectionPromise`',
    '`injectionInProgress` is state-only',
    '`bridgeInjectionMethodAuthority`',
    '`bridgeInjectionScriptManifest`',
    '`bridgeInjectionMainWorldLoadOrderContract`',
    '`bridgeInjectionSenderContract`',
    '`bridgeInjectionFallbackDomLifecycleReport`',
    '`bridgeInjectionRetryBudget`',
    '`bridgeInjectionSettingsReplayContract`',
    '`bridgeInjectionGlobalAliasContract`',
    '`bridgeInjectionFixtureProvenance`'
  ]) {
    assert.ok(text.includes(token), `missing bridge injection method addendum token ${token}`);
  }
});

test('method semantic audit register links the source-derived build release method addendum', () => {
  const text = doc();
  const oneLineText = text.replace(/\s+/g, ' ');

  for (const token of [
    'Build Release Method Addendum',
    'docs/audit/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs',
    '`build.js`',
    '25 named method/helper/callback declarations',
    '17 plain function declarations',
    '4 async function declarations',
    '4 const arrow',
    '37 arrow token sites',
    '35 callback-like sites',
    '6 semantic method groups',
    'package assembly',
    'mobile artifact staging',
    'release prompt/body generation',
    'GitHub release transport',
    'interactive prompt helpers',
    'README badge/LoC mutation',
    '3 `fs.copySync` references',
    '1 `fs.readJsonSync` reference',
    '1 `fs.writeJsonSync` reference',
    '2 `fs.writeFileSync` references',
    '8 `fs.existsSync` references',
    '2 `https.request` references',
    '2 `readline.createInterface` references',
    '2 `process.stdout.isTTY` references',
    '9 await expressions',
    '5 `new Promise` references',
    '1 `archive.glob` reference',
    '1 `archive.finalize` reference',
    '2 `GITHUB_TOKEN` references',
    '1 `draft: false` reference',
    '1 `prerelease: false` reference',
    '4 `.sha256` references',
    '0 listeners',
    '0 timers',
    '0 observers',
    '0 fetch calls',
    'normal builds mutate README badges before copying packages',
    'single-target builds do not remove the whole `dist` directory',
    'package roots are broad directories',
    'repairs only `collab_dialog.js` before `content_bridge.js`',
    'ZIP creation does not emit a checksum manifest',
    'mobile artifact staging is opt-in',
    'non-interactive terminals skip release prompting',
    'GitHub releases are created as public before asset uploads start',
    'failed asset uploads have no rollback or delete path',
    '`buildReleaseMethodAuthority`',
    '`buildPackageManifestAuthority`',
    '`buildReadmeMutationContract`',
    '`buildReleaseDraftFirstContract`',
    '`buildMobileArtifactClaimGate`',
    '`buildGitHubAssetUploadManifest`',
    '`buildGeneratedUiFreshnessReport`',
    '`buildManifestParityReport`',
    '`buildVendorNativeFreshnessContract`',
    '`buildReleaseFixtureProvenance`'
  ]) {
    assert.ok(
      oneLineText.includes(token.replace(/\s+/g, ' ')),
      `missing build release method addendum token ${token}`
    );
  }
});

test('method semantic audit register links the source-derived generated UI shell method addendum', () => {
  const text = doc();
  const oneLineText = text.replace(/\s+/g, ' ');

  for (const token of [
    'Generated UI Shell Method Addendum',
    'docs/audit/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/generated-ui-shell-method-semantic-register-current-behavior.test.mjs',
    '`scripts/build-extension-ui.mjs`',
    '`src/extension-shell/popup.jsx`',
    '`src/extension-shell/tab-view-decor.jsx`',
    '`src/extension-shell/shared/runtime.js`',
    '`js/ui-shell/popup-shell.js`',
    '`js/ui-shell/tab-view-decor.js`',
    '249 authoring/build source lines',
    '697 generated output lines',
    '7,615 authoring/build bytes',
    '39,369 generated output bytes',
    '8 named method/helper/component declarations',
    '3 plain function declarations',
    '2 async function declarations',
    '3 export function declarations',
    '2 arrow token sites',
    '4 semantic method groups',
    'esbuild UI build script',
    'popup shell render',
    'tab-view ambient shell render',
    'shared shell runtime',
    '6 `document` literal occurrences in authoring/build source',
    '1 `window` literal occurrence in authoring/build source',
    '12 style property writes in authoring/build source',
    '6 dataset writes/reads in authoring/build source',
    '2 render calls in authoring/build source',
    '2 video JSX elements in authoring/build source',
    '20 `document` literal occurrences in generated output',
    '2 `window` literal occurrences in generated output',
    '28 style property writes in generated output',
    '12 dataset writes/reads in generated output',
    '4 render calls in generated output',
    '`npm run build:ui`',
    '`build.js` run `scripts/build-extension-ui.mjs`',
    'two browser IIFE esbuild outputs into `js/ui-shell`',
    'HTML load those generated scripts before the hand-owned popup/tab-view runtime',
    'generated output is tracked source',
    'missing mount nodes skip rendering silently',
    'build failure sets `process.exitCode` without deleting stale output',
    'no source/output freshness manifest',
    'generated output hash manifest',
    '`sourceMappingURL` exists today',
    '`generatedUiShellMethodAuthority`',
    '`uiShellFreshnessManifest`',
    '`uiShellSourceHashManifest`',
    '`uiShellGeneratedOutputHash`',
    '`uiShellGeneratedOutputOwner`',
    '`uiShellPackageParityReport`',
    '`uiShellBrowserRenderFixture`',
    '`uiShellBuildFailureContract`',
    '`uiShellSourceOutputDriftReport`',
    '`uiShellReleaseFixtureProvenance`'
  ]) {
    assert.ok(
      oneLineText.includes(token.replace(/\s+/g, ' ')),
      `missing generated UI shell method addendum token ${token}`
    );
  }
});

test('method semantic audit register links the source-derived Nanah vendor build method addendum', () => {
  const text = doc();
  const oneLineText = text.replace(/\s+/g, ' ');

  for (const token of [
    'Nanah Vendor Build Method Addendum',
    'docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/nanah-vendor-build-method-semantic-register-current-behavior.test.mjs',
    '`scripts/build-nanah-vendor.mjs`',
    '`js/vendor/nanah.bundle.js`',
    '`js/vendor/qrcode.bundle.js`',
    '`html/tab-view.html`',
    '`js/tab-view.js`',
    '`js/nanah_sync_adapter.js`',
    '65 build script lines',
    '2,961 vendor output lines',
    '1,818 build script bytes',
    '94,657 vendor output bytes',
    '4 named method/helper declarations',
    '0 plain function declarations',
    '4 async function declarations',
    '1 arrow token site',
    '4 semantic method groups',
    'vendor directory preparation',
    'QR vendor bundle build',
    'Nanah vendor bundle build',
    'vendor build orchestration',
    '8 `path.resolve` occurrences',
    '2 `esbuild.build` occurrences',
    '6 await expressions',
    '1 `fs.mkdir` occurrence',
    '1 `window` literal occurrence',
    '0 `document` literal occurrences',
    '0 listeners',
    '0 timers',
    '0 observers',
    '0 fetch calls',
    '`npm run build:nanah-vendor`',
    'normal `npm run build` does not invoke `scripts/build-nanah-vendor.mjs`',
    '`qrcode ^1.5.4`',
    '`qrcode 1.5.4`',
    'sibling `../nanah`',
    'loads `qrcode.bundle.js` before `nanah.bundle.js` before `nanah_sync_adapter.js` before `tab-view.js`',
    '`window.FilterTubeQrCode?.toCanvas`',
    '`window.FilterTubeNanah`',
    'tracked vendor output has no `sourceMappingURL`',
    'build failure sets `process.exitCode` without deleting stale vendor output',
    '`nanahVendorBuildMethodAuthority`',
    '`nanahVendorSourceRevisionManifest`',
    '`nanahVendorOutputHashManifest`',
    '`nanahVendorPackageVersionManifest`',
    '`nanahVendorSiblingRepoContract`',
    '`nanahVendorQrCodePackageContract`',
    '`nanahVendorGlobalApiContract`',
    '`nanahVendorBuildFreshnessReport`',
    '`nanahVendorPackageParityReport`',
    '`nanahVendorFixtureProvenance`'
  ]) {
    assert.ok(
      oneLineText.includes(token.replace(/\s+/g, ' ')),
      `missing Nanah vendor build method addendum token ${token}`
    );
  }
});

test('method semantic audit register links the source-derived legacy layout method addendum', () => {
  const text = doc();
  const oneLineText = text.replace(/\s+/g, ' ');

  for (const token of [
    'Legacy Layout Method Addendum',
    'docs/audit/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/legacy-layout-method-semantic-register-current-behavior.test.mjs',
    '`js/layout.js`',
    '680 source lines',
    '30,604 source bytes',
    '5 exported method declarations',
    '`window.filterTubeLayout`',
    '0 plain function declarations',
    '5 function expression properties',
    '0 async function declarations',
    '18 arrow token sites',
    '5 semantic method groups',
    'search/watch layout repair',
    'Shorts shelf layout repair',
    'homepage Shorts layout rewrite',
    'extreme hide writer',
    'post-filter hide sweep',
    '63 selector API sites',
    '63 static selector sites',
    '0 dynamic selector sites',
    '52 unique static selector literals',
    '42 `querySelector` calls',
    '18 `querySelectorAll` calls',
    '3 `closest` calls',
    '0 `matches` calls',
    '146 direct style property writes',
    '34 `style.display` writes',
    '3 `classList.add` calls',
    '32 `filter-tube-visible` tokens',
    '10 `:not(.filter-tube-visible)` selector clauses',
    '0 listeners',
    '0 timers',
    '0 observers',
    '0 fetch calls',
    'absent from active and dist browser manifest content scripts',
    'copied into `dist/chrome/js/layout.js`',
    '`dist/firefox/js/layout.js`',
    '`dist/opera/js/layout.js`',
    '`build.js` broad `COMMON_DIRS` package copying',
    'has no current non-doc source caller',
    'can hide broad renderer families solely because `.filter-tube-visible` is absent',
    '`legacyLayoutMethodAuthority`',
    '`legacyLayoutManifestLoadContract`',
    '`legacyLayoutPackageQuarantineManifest`',
    '`legacyLayoutSelectorEffectReport`',
    '`legacyLayoutVisibleMarkerDecisionContract`',
    '`legacyLayoutExtremeHideRestoreProof`',
    '`legacyLayoutInventoryCoveragePolicy`',
    '`legacyLayoutNativeSyncGate`',
    '`legacyLayoutFixtureProvenance`',
    '`legacyLayoutDeletionReadinessReport`'
  ]) {
    assert.ok(
      oneLineText.includes(token.replace(/\s+/g, ' ')),
      `missing legacy layout method addendum token ${token}`
    );
  }
});

test('method semantic audit register links the source-derived native runtime sync method addendum', () => {
  const text = doc();
  const oneLineText = text.replace(/\s+/g, ' ');

  for (const token of [
    'Native Runtime Sync Method Addendum',
    'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/native-runtime-sync-method-semantic-register-current-behavior.test.mjs',
    '`scripts/sync-native-runtime.mjs`',
    '34 source lines',
    '1,070 source bytes',
    '4 script-level semantic phases',
    '0 named method declarations',
    '0 plain function declarations',
    '0 async function declarations',
    '0 arrow token sites',
    '3 import declarations',
    '6 const declarations',
    'app repo path resolution',
    'sync script existence gating',
    'process delegation',
    'status propagation',
    '2 `path.resolve` occurrences',
    '1 `path.join` occurrence',
    '1 `fs.existsSync` occurrence',
    '2 `spawnSync` token occurrences',
    '1 `spawnSync` call site',
    '3 `process.exit` calls',
    '0 `process.exitCode` occurrences',
    '5 `console.error` calls',
    '1 `console.log` call',
    '2 `process.env` occurrences',
    '1 `process.cwd` occurrence',
    '1 `process.execPath` occurrence',
    '1 stdio inherit occurrence',
    '0 manifest literal reads in the public wrapper',
    '0 listeners',
    '0 timers',
    '0 observers',
    '0 fetch calls',
    '0 write/copy/remove file mutation calls in the public wrapper',
    '`npm run sync:native-runtime`',
    'normal `npm run build` does not invoke it',
    '`FILTERTUBE_APP_REPO`',
    'sibling `../FilterTubeApp`',
    '`spawnSync(process.execPath, [syncScript])`',
    '`cwd: appRepo`',
    '`result.status ?? 1`',
    '/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs',
    '2,284 lines',
    '109,397 bytes',
    '15 plain function declarations',
    '3 async function declarations',
    '18 total named function declarations',
    '16 `runtimeBundleOrder` entries',
    '`runtime-sync-manifest.json`',
    'current app manifest has 32 entries',
    'all sourced from `/Users/devanshvarshney/FilterTube`',
    '0 `destinationKind` fields',
    'includes `js/layout.js`, `js/vendor/nanah.bundle.js`, and `js/vendor/qrcode.bundle.js`',
    '`js/nanah_managed_live_policy.js`',
    '`js/nanah_managed_open_sync.js`',
    'does not include `data/release_notes.json`',
    '`nativeSyncWrapperMethodAuthority`',
    '`nativeSyncWrapperAppRepoContract`',
    '`nativeSyncWrapperAppRevisionReport`',
    '`nativeSyncWrapperManifestHashReport`',
    '`nativeSyncWrapperDestinationKindManifest`',
    '`nativeSyncWrapperBuildIntegrationGate`',
    '`nativeSyncWrapperReleaseFreshnessReport`',
    '`nativeSyncWrapperStatusContract`',
    '`nativeSyncWrapperFixtureProvenance`',
    '`nativeSyncWrapperRawCaptureExclusionReport`'
  ]) {
    assert.ok(
      oneLineText.includes(token.replace(/\s+/g, ' ')),
      `missing native runtime sync method addendum token ${token}`
    );
  }
});
