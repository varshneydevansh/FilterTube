import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function quotedStrings(text) {
  return Array.from(text.matchAll(/['"]([^'"\n]+)['"]/g), match => match[1]);
}

function keyArrayFromBlock(text, startNeedle, endNeedle) {
  return quotedStrings(sliceBetween(text, startNeedle, endNeedle));
}

function assertIncludesAll(keys, expected, label) {
  for (const key of expected) {
    assert.ok(keys.includes(key), `${label} should include ${key}`);
  }
}

function assertOmitsAll(keys, expected, label) {
  for (const key of expected) {
    assert.ok(!keys.includes(key), `${label} should currently omit ${key}`);
  }
}

function assertStorageCacheConvergenceBoundary(doc) {
  const section = sliceBetween(
    doc,
    '## Storage/Cache Key Convergence Boundary - 2026-05-30',
    '## Method Semantic Proof Gap Boundary'
  );

  for (const row of [
    'storage_cache_compiler_invalidation_split',
    'storage_cache_bridge_map_only_refresh_split',
    'storage_cache_force_reprocess_coalescing_guard',
    'storage_cache_state_manager_reload_split',
    'storage_cache_shared_settings_load_split',
    'storage_cache_background_map_flush_dirty_state',
    'storage_cache_profile_import_nanah_revision_gap',
    'storage_cache_stats_dashboard_reload_gap',
    'storage_cache_settings_refresh_evidence_packet_gap',
    'storage_cache_whitelist_spa_metric_gap'
  ]) {
    assert.ok(section.includes(row), `missing storage/cache convergence row ${row}`);
  }

  for (const marker of [
    'storage/cache convergence rows: 10',
    'implementation-ready storage/cache convergence rows: 0',
    'storageKeyAuthority product source symbol: absent',
    'settings refresh evidence packets defined: 12',
    'required settings refresh packet fields: 29',
    'implementation-ready settings refresh evidence packets: 0',
    'map-only pending refresh upgrade proof: PRESENT',
    'map-only pruning approval from this convergence: NO-GO',
    'compiled-cache invalidation approval from this convergence: NO-GO',
    'whitelist/cache optimization approval from this convergence: NO-GO',
    'JSON-first promotion approval from this convergence: NO-GO',
    'runtime behavior changed by this addendum: no',
    'ASCII storage/cache convergence diagram: present',
    'Mermaid storage/cache convergence diagram: present'
  ]) {
    assert.ok(section.includes(marker), `missing storage/cache convergence marker ${marker}`);
  }

  for (const sourcePin of [
    'js/background.js:2059',
    'js/background.js:4808',
    'js/content/bridge_settings.js:1018',
    'js/content/bridge_settings.js:1050',
    'js/content/bridge_settings.js:1060',
    'js/state_manager.js:2356',
    'js/state_manager.js:243-244',
    'js/settings_shared.js:52',
    'js/settings_shared.js:564',
    'js/background.js:1933',
    'js/background.js:1958',
    'js/background.js:4747',
    'js/background.js:4754',
    'js/background.js:3613',
    'js/background.js:3866',
    'js/state_manager.js:1809',
    'js/content_bridge.js:3713-3718',
    'js/content_bridge.js:3926-3944'
  ]) {
    assert.ok(section.includes(sourcePin), `missing storage/cache source pin ${sourcePin}`);
  }

  for (const linkedProof of [
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/settings-refresh-fanout-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/compiled-cache-authority-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_CONSUMER_JOIN_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
    'tests/runtime/settings-refresh-dirty-key-producer-consumer-join-matrix-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-29.md',
    'tests/runtime/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_STORAGE_REFRESH_FORCE_REPROCESS_COALESCING_CURRENT_BEHAVIOR_2026-05-30.md',
    'tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
    'tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'tests/runtime/learned-identity-map-cache-persistence-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
    'tests/runtime/storage-access-callsite-register-current-behavior.test.mjs'
  ]) {
    assert.ok(section.includes(linkedProof), `missing linked proof ${linkedProof}`);
  }
}

function storageAccessCounts() {
  const files = git([
    'ls-files',
    '*.js',
    '*.mjs',
    ':(exclude)docs/**',
    ':(exclude)tests/**'
  ])
    .filter(file => !file.includes('/vendor/'));
  const patterns = [
    /storage\.local\.get/g,
    /storage\.local\.set/g,
    /storage\.local\.remove/g,
    /storage\.onChanged\.addListener/g,
    /STORAGE_NAMESPACE\?\.get/g,
    /STORAGE_NAMESPACE\?\.set/g,
    /STORAGE_NAMESPACE\.get/g,
    /STORAGE_NAMESPACE\.set/g,
    /readStorage\(/g,
    /writeStorage\(/g
  ];

  const counts = {};
  for (const file of files) {
    const text = read(file);
    let total = 0;
    for (const pattern of patterns) {
      total += (text.match(pattern) || []).length;
    }
    if (total) counts[file] = total;
  }
  return counts;
}

test('storage key authority audit documents access counts split watch lists and future gate', () => {
  const doc = read(auditDocPath);

  assert.match(doc, /Current tracked non-vendor storage access count: 72 call sites/);
  assert.match(doc, /Background Compiler Reads More Than Background Invalidates/);
  assert.match(doc, /Content Bridge Watches More Learned Identity Keys/);
  assert.match(doc, /StateManager Watches A Different UI Reload List/);
  assert.match(doc, /Future token: `storageKeyAuthority`/);
  assert.match(doc, /ignored root captures/);
  assertStorageCacheConvergenceBoundary(doc);
});

test('current tracked non-vendor storage access counts match the audit', () => {
  assert.deepEqual(storageAccessCounts(), {
    'js/background.js': 36,
    'js/content/bridge_settings.js': 1,
    'js/content/handle_resolver.js': 1,
    'js/content_bridge.js': 6,
    'js/io_manager.js': 17,
    'js/settings_shared.js': 8,
    'js/state_manager.js': 1,
    'js/tab-view.js': 2
  });
});

test('background compiler reads more storage keys than background invalidation watches', () => {
  const background = read('js/background.js');
  const compilerBlock = sliceBetween(
    background,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    '], (items) => {'
  );
  const compilerKeys = quotedStrings(compilerBlock);
  const listenerBlock = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {'
  );
  const listenerKeys = keyArrayFromBlock(
    listenerBlock,
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );

  assertIncludesAll(
    compilerKeys,
    [
      'enabled',
      'contentFilters',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'videoChannelMap',
      'videoMetaMap',
      'hideEndscreenVideowall',
      'disableAnnotations',
      'ftProfilesV3'
    ],
    'background compiler keys'
  );
  assertOmitsAll(
    listenerKeys,
    [
      'enabled',
      'categoryFilters',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'videoChannelMap',
      'videoMetaMap',
      'showQuickBlockButton',
      'showBlockMenuItem',
      'hideEndscreenVideowall',
      'disableAnnotations'
    ],
    'background invalidation keys'
  );
});

test('content bridge has map-only refresh policy that differs from background invalidation', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    bridgeSettings,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );
  const keys = keyArrayFromBlock(block, 'const relevantKeys = [', '];\n    if (Object.keys(changes)');

  assert.match(block, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(block, /changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(block, /changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(block, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);
  assertIncludesAll(keys, ['channelMap', 'videoChannelMap', 'videoMetaMap', 'showQuickBlockButton', 'showBlockMenuItem'], 'content bridge keys');
});

test('StateManager external reload list is a third storage-key authority', () => {
  const stateManager = read('js/state_manager.js');
  const block = sliceBetween(
    stateManager,
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'const hasSettingsChange = storageKeys.some(key => changes[key]);'
  );
  const keys = keyArrayFromBlock(block, 'const storageKeys = [', '];');

  assert.match(block, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assertIncludesAll(keys, ['stats', 'channelMap', 'ftProfilesV3', 'ftProfilesV4', 'showQuickBlockButton'], 'StateManager reload keys');
  assertOmitsAll(
    keys,
    [
      'contentFilters',
      'categoryFilters',
      'videoChannelMap',
      'videoMetaMap',
      'useExactWordMatching',
      'filterChannelsAdditionalKeywords',
      'statsBySurface'
    ],
    'StateManager reload keys'
  );
});

test('shared settings load keys and future storage authority gates are explicit', () => {
  const settingsShared = read('js/settings_shared.js');
  const loadBlock = sliceBetween(
    settingsShared,
    'function loadSettings()',
    '// Load all keywords (user + channel-derived) from storage'
  );
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const productSource = [
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/content_bridge.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/io_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');

  assert.match(loadBlock, /\.\.\.SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY, FT_PROFILES_V3_KEY, FT_PROFILES_V4_KEY/);
  assert.doesNotMatch(loadBlock, /videoChannelMap|videoMetaMap|statsBySurface/);
  for (const fixture of [
    'storage_key_background_invalidation_covers_compiler_dependencies',
    'storage_key_content_bridge_map_only_refresh_policy_is_named',
    'storage_key_state_manager_reload_keys_match_ui_claims',
    'storage_key_unknown_key_is_ignored_with_no_runtime_reprocess'
  ]) {
    assert.ok(gate.includes(fixture), `missing readiness fixture ${fixture}`);
  }
  assert.doesNotMatch(productSource, /\bstorageKeyAuthority\b/);
});
