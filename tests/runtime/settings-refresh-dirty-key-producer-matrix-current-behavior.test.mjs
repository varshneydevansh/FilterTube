import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_CONSUMER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'
];

const rows = [
  'FT-SRDP-00-scope',
  'FT-SRDP-01-shared-save-settings',
  'FT-SRDP-02-state-manager-save-broadcast',
  'FT-SRDP-03-state-manager-direct-main-profile',
  'FT-SRDP-04-state-manager-direct-kids-profile',
  'FT-SRDP-05-background-set-list-mode',
  'FT-SRDP-06-background-batch-whitelist-import',
  'FT-SRDP-07-background-add-channel-helper',
  'FT-SRDP-08-background-filter-all-toggle',
  'FT-SRDP-09-background-channel-map-queue',
  'FT-SRDP-10-background-video-channel-map-queue',
  'FT-SRDP-11-background-video-meta-map-queue',
  'FT-SRDP-12-content-bridge-custom-url-map',
  'FT-SRDP-13-import-sync-profile-write'
];

const producerClosureRows = [
  'FT-SRDP-CLOSURE-00-scope',
  'FT-SRDP-CLOSURE-01-shared-save-settings',
  'FT-SRDP-CLOSURE-02-state-manager-save-broadcast',
  'FT-SRDP-CLOSURE-03-state-manager-direct-main-profile',
  'FT-SRDP-CLOSURE-04-state-manager-direct-kids-profile',
  'FT-SRDP-CLOSURE-05-background-set-list-mode',
  'FT-SRDP-CLOSURE-06-background-batch-whitelist-import',
  'FT-SRDP-CLOSURE-07-background-add-channel-helper',
  'FT-SRDP-CLOSURE-08-background-filter-all-toggle',
  'FT-SRDP-CLOSURE-09-background-channel-map-queue',
  'FT-SRDP-CLOSURE-10-background-video-channel-map-queue',
  'FT-SRDP-CLOSURE-11-background-video-meta-map-queue',
  'FT-SRDP-CLOSURE-12-content-bridge-custom-url-map',
  'FT-SRDP-CLOSURE-13-import-sync-profile-write'
];

const futureAuthorityTokens = [
  'settingsRefreshDirtyKeyProducerMatrix',
  'settingsRefreshProducerDecisionReport',
  'settingsRefreshProducerConsumerJoinReport',
  'settingsRefreshWriteRevision',
  'settingsRefreshNoOpWriteReport',
  'settingsRefreshRuleMutationReport',
  'settingsRefreshImportSyncWriteReport',
  'settingsRefreshMapProducerBudget',
  'settingsRefreshProducerMetricArtifact',
  'settingsRefreshProducerRollbackReport',
  'settingsRefreshDirtyKeyProducerClosure',
  'settingsRefreshDirtyKeyProducerClosureRuntimeApproval',
  'settingsRefreshDirtyKeyProducerImplementationReadiness'
];

const productFiles = [
  'js/background.js',
  'js/settings_shared.js',
  'js/state_manager.js',
  'js/io_manager.js',
  'js/nanah_sync_adapter.js',
  'js/content_bridge.js',
  'js/content/bridge_settings.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function doc() {
  return read(docPath);
}

function productSource() {
  return productFiles.filter(exists).map(read).join('\n');
}

test('settings refresh dirty-key producer matrix is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh dirty-key producer\s+matrix/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh dirty-key producer matrix rows: 14/);
  assert.match(text, /settings refresh producer work families covered: 8/);
  assert.match(text, /producer persistence shapes covered: 4/);
  assert.match(text, /producer broadcast shapes covered: 4/);
  assert.match(text, /runtime dirty-key producer authority approvals: 0/);
  assert.match(text, /settings refresh dirty-key producer matrix approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh dirty-key producer closure rows: 14/);
  assert.match(text, /producer matrix rows linked by closure: 14/);
  assert.match(text, /producer work families linked by closure: 8/);
  assert.match(text, /producer persistence shapes linked by closure: 4/);
  assert.match(text, /producer broadcast shapes linked by closure: 4/);
  assert.match(text, /source input families linked by producer closure: 7/);
  assert.match(text, /runtime dirty-key producer closure approvals: 0/);
  assert.match(text, /implementation-ready dirty-key producer rows: 0/);
  assert.match(text, /settings refresh dirty-key producer closure: PRODUCER-CHAIN-CLOSED/);
  assert.match(text, /settings refresh producer implementation readiness from closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `producer matrix doc does not cite ${sourceDoc}`);
  }
});

test('settings refresh dirty-key producer rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-SRDP-(?!CLOSURE)[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-SRDP-CLOSURE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, producerClosureRows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /UI action \/ import \/ sync \/ learned identity \/ install migration/);
  assert.match(text, /no shared producer report connects writer/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /No shared dirty-key producer report/);
});

test('shared settings and StateManager producer paths remain pinned', () => {
  const shared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');

  assert.match(shared, /function saveSettings\(options = \{\}\) \{[\s\S]*?const sanitizedKeywords = syncFilterAllKeywords\(keywords, sanitizedChannels\);[\s\S]*?const payload = \{[\s\S]*?enabled: compiledSettings\.enabled,[\s\S]*?uiKeywords: sanitizedKeywords,[\s\S]*?filterKeywords: compiledSettings\.filterKeywords,[\s\S]*?showBlockMenuItem: compiledSettings\.showBlockMenuItem,[\s\S]*?\[AUTO_BACKUP_KEY\]: autoBackupEnabled === true[\s\S]*?payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4;[\s\S]*?STORAGE_NAMESPACE\?\.set\(payload/);
  assert.match(shared, /No profiles v4: fall back to legacy migration path[\s\S]*?payload\[FT_PROFILES_V4_KEY\] = buildProfilesV4FromLegacyState\(legacyStorage, sanitizedChannels, sanitizedKeywords\);[\s\S]*?STORAGE_NAMESPACE\?\.set\(payload/);

  assert.match(stateManager, /async function saveSettings\(\{ broadcast = true, profile = 'main' \} = \{\}\) \{[\s\S]*?const result = await SettingsAPI\.saveSettings\(\{[\s\S]*?keywords: state\.keywords,[\s\S]*?channels: state\.channels,[\s\S]*?contentFilters: state\.contentFilters,[\s\S]*?categoryFilters: state\.categoryFilters[\s\S]*?if \(broadcast && result\.compiledSettings\) \{[\s\S]*?broadcastSettings\(result\.compiledSettings, profile\);/);
  assert.match(stateManager, /async function persistMainProfiles\(nextMain\) \{[\s\S]*?await io\.saveProfilesV3\(merged\);[\s\S]*?await io\.saveProfilesV4\(nextProfiles\);/);
  assert.match(stateManager, /async function persistKidsProfiles\(nextKids\) \{[\s\S]*?await io\.saveProfilesV3\(merged\);[\s\S]*?await io\.saveProfilesV4\(nextProfiles\);/);
  assert.match(stateManager, /async function requestRefresh\(profile = 'main'\) \{[\s\S]*?action: 'getCompiledSettings'[\s\S]*?forceRefresh: true[\s\S]*?broadcastSettings\(compiled, profile\);/);
});

test('background rule and import producer paths remain pinned', () => {
  const background = read('js/background.js');

  assert.match(background, /if \(requestedMode === 'whitelist' && requestedProfile === 'main'\) \{[\s\S]*?writePayload\.filterChannels = \[\];[\s\S]*?writePayload\.uiKeywords = \[\];[\s\S]*?writePayload\.filterKeywordsComments = \[\];[\s\S]*?await browserAPI\.storage\.local\.set\(writePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\);/);
  assert.match(background, /action === 'FilterTube_BatchImportWhitelistChannels'[\s\S]*?const writePayload = \{[\s\S]*?\[FT_PROFILES_V4_KEY\]: \{[\s\S]*?ftProfilesV3: profilesV3[\s\S]*?if \(didUpdateChannelMap\) \{[\s\S]*?writePayload\.channelMap = nextChannelMap;[\s\S]*?await browserAPI\.storage\.local\.set\(writePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\);/);
  assert.match(background, /async function handleAddFilteredChannel\([\s\S]*?const storageWritePayload = \{\};[\s\S]*?storageWritePayload\[FT_PROFILES_V4_KEY\][\s\S]*?storageWritePayload\.filterChannels = channels;[\s\S]*?storageWritePayload\.uiChannels = safeArray\(channels\)[\s\S]*?storageWritePayload\.ftProfilesV3 = profilesV3;[\s\S]*?await browserAPI\.storage\.local\.set\(storageWritePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?compiledSettingsCache\.kids = null;/);
  assert.match(background, /async function handleToggleChannelFilterAll\(channelId, value\) \{[\s\S]*?const payload = \{ filterChannels: channels \};[\s\S]*?payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4;[\s\S]*?browserAPI\.storage\.local\.set\(payload, resolve\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?compiledSettingsCache\.kids = null;/);
});

test('map producer paths remain debounced and map-only current behavior', () => {
  const background = read('js/background.js');
  const bridge = read('js/content_bridge.js');

  assert.match(background, /function enqueueChannelMapUpdate\(key, value\) \{[\s\S]*?pendingChannelMapUpdates\.set\(k, v\);[\s\S]*?compiledSettingsCache\.main\.channelMap = channelMapCache \|\| compiledSettingsCache\.main\.channelMap;[\s\S]*?scheduleChannelMapFlush\(\);/);
  assert.match(background, /function scheduleChannelMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushChannelMapUpdates\(\);[\s\S]*?\}, 250\);/);
  assert.match(background, /function enqueueVideoChannelMapUpdate\(videoId, channelId\) \{[\s\S]*?pendingVideoChannelMapUpdates\.set\(v, c\);[\s\S]*?compiledSettingsCache\.main\.videoChannelMap = \{[\s\S]*?scheduleVideoChannelMapFlush\(\);/);
  assert.match(background, /function scheduleVideoChannelMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushVideoChannelMapUpdates\(\);[\s\S]*?\}, 50\);/);
  assert.match(background, /function enqueueVideoMetaMapUpdate\(videoId, meta\) \{[\s\S]*?const clean = \{[\s\S]*?lengthSeconds:[\s\S]*?publishDate:[\s\S]*?uploadDate:[\s\S]*?category:[\s\S]*?pendingVideoMetaMapUpdates\.set\(v, clean\);[\s\S]*?scheduleVideoMetaMapFlush\(\);/);
  assert.match(background, /function scheduleVideoMetaMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushVideoMetaMapUpdates\(\);[\s\S]*?\}, 75\);/);
  assert.match(bridge, /type === 'FilterTube_UpdateCustomUrlMap'[\s\S]*?browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\][\s\S]*?channelMap\[payload\.customUrl\] = payload\.id;[\s\S]*?browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
});

test('import and sync producers remain profile writes without shared producer reports', () => {
  const ioManager = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');

  assert.match(ioManager, /async function writeStorage\(payload\) \{[\s\S]*?STORAGE_NAMESPACE\.set\(payload, \(\) => \{[\s\S]*?resolve\(\{ ok: !err, error: err \}\);/);
  assert.match(ioManager, /async function saveProfilesV4\(nextProfiles\) \{[\s\S]*?return writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: nextProfiles \}\);/);
  assert.match(ioManager, /const result = shouldImportIntoSeparateProfile[\s\S]*?await SettingsAPI\.saveSettings\(payload\);[\s\S]*?await saveProfilesV3\(nextProfiles\);[\s\S]*?await saveProfilesV4\(\{[\s\S]*?activeProfileId: writeActiveId,[\s\S]*?profiles[\s\S]*?\}\);[\s\S]*?await writeStorage\(\{ channelMap: nextChannelMap \}\);/);
  assert.match(nanah, /async function applyScopedPortablePayload\(io, portable[\s\S]*?if \(typeof io\.loadProfilesV4 !== 'function' \|\| typeof io\.saveProfilesV4 !== 'function'\)[\s\S]*?profiles\[resolvedTargetProfileId\] = \{[\s\S]*?await io\.saveProfilesV4\(\{[\s\S]*?\.\.\.profilesV4,[\s\S]*?profiles[\s\S]*?\}\);/);
});

test('settings refresh dirty-key producer decisions and future authority remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-dirty-key-producer-matrix.json',
    'docs/audit/artifacts/settings-refresh-dirty-key-producer-closure.json',
    'docs/audit/artifacts/settings-refresh-dirty-key-producer-implementation-readiness.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-join-report.json',
    'docs/audit/artifacts/settings-refresh-producer-rollback-report.json'
  ];

  for (const decision of [
    'approve settings refresh dirty-key producer authority now: NO-GO',
    'approve producer-to-consumer revision authority now: NO-GO',
    'approve settings no-op write authority now: NO-GO',
    'approve broad whitelist optimization from current producer gates: NO-GO',
    'approve JSON-first promotion from current producer gates: NO-GO',
    'close settings refresh dirty-key producer documentation chain now: GO',
    'accept producer closure as dirty-key producer authority now: NO-GO',
    'accept producer closure as producer-to-consumer revision authority now: NO-GO',
    'accept producer closure as settings no-op write authority now: NO-GO',
    'accept producer closure as rule mutation report evidence now: NO-GO',
    'accept producer closure as import/sync write report evidence now: NO-GO',
    'accept producer closure as map producer budget evidence now: NO-GO',
    'accept producer closure as whitelist optimization approval now: NO-GO',
    'accept producer closure as JSON-first promotion approval now: NO-GO',
    'accept producer closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This matrix is not a completion claim/);
});
