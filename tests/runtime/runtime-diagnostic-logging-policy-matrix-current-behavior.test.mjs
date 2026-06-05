import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';

const sourceFingerprints = {
  'build.js': [740, 26978, 'c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04'],
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5'],
  'js/content/block_channel.js': [3189, 127857, 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba'],
  'js/content/bridge_settings.js': [1113, 44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
  'js/content/collab_dialog.js': [393, 14623, 'dc34bba556b310da8b7516d106e9d67addea59d8a707a02f21607ac97af1f72a'],
  'js/content/dom_extractors.js': [1137, 46896, 'adf2c04f14f0f3bb44556e216af25aca8ff182dfa569c248ddb150d0cca38a4e'],
  'js/content/dom_fallback.js': [5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/injector.js': [3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
  'js/io_manager.js': [2097, 100479, 'f6f4119992f63a92dd984cd5eb9d5d5c946c839f63abef070ad0dace77474d62'],
  'js/layout.js': [680, 30604, '48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7'],
  'js/popup.js': [1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/tab-view.js': [13983, 648380, '9be470a5d3e13c962ab3a07111eb9d600819375887d034f6380a6c484f42b013'],
  'scripts/build-extension-ui.mjs': [50, 1188, '6326362ebf90f448ccdbf68945b3fb522b7b215edaf9b3e28589a4e166239cf3'],
  'scripts/build-nanah-vendor.mjs': [65, 1818, 'dae8d3ef29c4cd44b0bf975090e9d53f3bb05b523355f5038930fc03b27e921c'],
  'scripts/sync-native-runtime.mjs': [34, 1070, '4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6']
};

const expectedConsoleRows = {
  'build.js': { log: 14, warn: 6, error: 8, debug: 0, info: 0, total: 28 },
  'js/background.js': { log: 49, warn: 28, error: 12, debug: 13, info: 0, total: 102 },
  'js/content/block_channel.js': { log: 1, warn: 3, error: 5, debug: 0, info: 0, total: 9 },
  'js/content/bridge_settings.js': { log: 3, warn: 3, error: 0, debug: 0, info: 0, total: 6 },
  'js/content/collab_dialog.js': { log: 1, warn: 3, error: 0, debug: 0, info: 0, total: 4 },
  'js/content/dom_extractors.js': { log: 0, warn: 0, error: 1, debug: 0, info: 0, total: 1 },
  'js/content/dom_fallback.js': { log: 2, warn: 1, error: 0, debug: 0, info: 0, total: 3 },
  'js/content/handle_resolver.js': { log: 2, warn: 3, error: 0, debug: 0, info: 0, total: 5 },
  'js/content_bridge.js': { log: 114, warn: 46, error: 14, debug: 8, info: 0, total: 182 },
  'js/filter_logic.js': { log: 2, warn: 5, error: 2, debug: 1, info: 0, total: 10 },
  'js/injector.js': { log: 0, warn: 0, error: 0, debug: 1, info: 0, total: 1 },
  'js/io_manager.js': { log: 3, warn: 5, error: 0, debug: 0, info: 0, total: 8 },
  'js/layout.js': { log: 4, warn: 0, error: 0, debug: 0, info: 0, total: 4 },
  'js/popup.js': { log: 1, warn: 1, error: 0, debug: 0, info: 0, total: 2 },
  'js/seed.js': { log: 2, warn: 0, error: 0, debug: 1, info: 0, total: 3 },
  'js/settings_shared.js': { log: 0, warn: 1, error: 0, debug: 0, info: 0, total: 1 },
  'js/state_manager.js': { log: 3, warn: 14, error: 3, debug: 0, info: 0, total: 20 },
  'js/tab-view.js': { log: 1, warn: 5, error: 14, debug: 0, info: 0, total: 20 },
  'scripts/build-extension-ui.mjs': { log: 0, warn: 0, error: 2, debug: 0, info: 0, total: 2 },
  'scripts/build-nanah-vendor.mjs': { log: 0, warn: 0, error: 2, debug: 0, info: 0, total: 2 },
  'scripts/sync-native-runtime.mjs': { log: 1, warn: 0, error: 5, debug: 0, info: 0, total: 6 }
};

const futureAuthorityTokens = [
  'diagnosticLoggingPolicyMatrixContract',
  'diagnosticLogPolicyReport',
  'diagnosticLogDecision',
  'diagnosticLogPrivacyClassReport',
  'diagnosticLogRedactionPolicy',
  'diagnosticLogNoWorkBudget',
  'diagnosticLogMetricArtifact',
  'diagnosticLogFixtureProvenance',
  'diagnosticLogJsonFirstGate',
  'diagnosticLogReleaseGate',
  'diagnosticLoggingSourceFlowReport',
  'diagnosticLogRouteSurfaceMatrix',
  'diagnosticConsoleBudgetReport',
  'diagnosticMetricReplacementPlan',
  'diagnosticLoggingConvergenceAuthority',
  'diagnosticLoggingConvergenceReport',
  'diagnosticLogWorkBudget',
  'diagnosticMetricReplacementAuthority',
  'diagnosticPrivacyRedactionAuthority',
  'diagnosticConsoleResidualHotPathReport',
  'diagnosticProductionConsoleRuntimeSample',
  'diagnosticConsoleReleaseSamplingArtifact',
  'diagnosticConsoleResidualOwnerBudget'
];

const expectedDiagnosticSourceFlowRows = {
  diagnostic_flow_seed_gate_and_relay: [
    '`js/seed.js:25-33`',
    '`js/seed.js:139-168`',
    '`js/seed.js:253-260`',
    '`js/seed.js:983-1014`'
  ],
  diagnostic_flow_injector_postlog_relay: [
    '`js/injector.js:105-130`',
    '`js/injector.js:1925-2047`',
    '`js/injector.js:3382-3495`'
  ],
  diagnostic_flow_filter_logic_engine: [
    '`js/filter_logic.js:19-44`',
    '`js/filter_logic.js:1566-1595`',
    '`js/filter_logic.js:3588-3650`'
  ],
  diagnostic_flow_bridge_request_response: [
    '`js/content_bridge.js:5424-5524`',
    '`js/content_bridge.js:5780-5986`'
  ],
  diagnostic_flow_bridge_menu_identity: [
    '`js/content_bridge.js:7303-7452`',
    '`js/content_bridge.js:10010-10630`',
    '`js/content_bridge.js:12237-13151`'
  ],
  diagnostic_flow_background_settings_identity: [
    '`js/background.js:2609-2674`',
    '`js/background.js:2720-3321`'
  ],
  diagnostic_flow_import_export_backup: [
    '`js/io_manager.js:1670-1987`',
    '`js/tab-view.js:9275-9525`'
  ],
  diagnostic_flow_content_helper_menu: [
    '`js/content/block_channel.js:7-14`',
    '`js/content/block_channel.js:1744-2858`',
    '`js/content/block_channel.js:3130-3130`'
  ],
  diagnostic_flow_build_release_scripts: [
    '`build.js:75-190`',
    '`build.js:536-716`',
    '`scripts/build-extension-ui.mjs:47-48`',
    '`scripts/build-nanah-vendor.mjs:62-63`',
    '`scripts/sync-native-runtime.mjs:12-30`'
  ]
};

const activeManifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];

const routineConsoleSourceFiles = [
  'js/background.js',
  'js/content/dom_fallback.js',
  'js/content_bridge.js',
  'js/seed.js',
  'js/filter_logic.js',
  'js/injector.js',
  'js/layout.js',
  'js/popup.js',
  'js/tab-view.js',
  'js/content/bridge_settings.js',
  'js/content/handle_resolver.js',
  'js/content/collab_dialog.js',
  'js/content/block_channel.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function consoleCounts(file) {
  const counts = { log: 0, warn: 0, error: 0, debug: 0, info: 0 };
  for (const line of read(file).split(/\r?\n/)) {
    if (line.trim().startsWith('//')) continue;
    if (/console\.log\s*\(/.test(line)) counts.log += 1;
    if (/console\.warn\s*\(/.test(line)) counts.warn += 1;
    if (/console\.error\s*\(/.test(line)) counts.error += 1;
    if (/console\.debug\s*\(/.test(line)) counts.debug += 1;
    if (/console\.info\s*\(/.test(line)) counts.info += 1;
  }
  counts.total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return counts;
}

function routineConsoleSites(file) {
  const out = [];
  read(file).split(/\r?\n/).forEach((line, index) => {
    if (line.trim().startsWith('//')) return;
    if (/console\.(log|debug|info)\s*\(|console\[['"](?:log|debug|info)['"]\]/.test(line)) {
      out.push(index + 1);
    }
  });
  return out;
}

function lineNumberForToken(source, token) {
  const index = source.split(/\r?\n/).findIndex((line) => line.includes(token));
  assert.notEqual(index, -1, `missing token ${token}`);
  return index + 1;
}

function manifestJson(file) {
  return JSON.parse(read(file));
}

function scopedSource() {
  return Object.keys(sourceFingerprints).map(read).join('\n');
}

function ownerFamily(file) {
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-scripts';
  if (['js/background.js', 'js/io_manager.js', 'js/state_manager.js', 'js/settings_shared.js'].includes(file)) return 'background-storage-state';
  if (file === 'js/tab-view.js' || file === 'js/popup.js') return 'extension-ui';
  if (file === 'js/layout.js') return 'quarantined-legacy';
  if (['js/content_bridge.js', 'js/seed.js', 'js/filter_logic.js', 'js/injector.js'].includes(file)) return 'page-runtime-core';
  if (file.startsWith('js/content/')) return 'content-helper';
  return 'other';
}

function assertDiagnosticSourceFlowAddendum(doc) {
  assert.match(doc, /Runtime Diagnostic Source-Flow Addendum - 2026-05-27/);
  assert.match(doc, /This addendum records how current runtime diagnostics move through/);
  assert.match(doc, /page main world/);
  assert.match(doc, /missing first-class policy/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /No first-class diagnostic policy artifact/);
  assert.match(doc, /current diagnostic source-flow rows: 9/);
  assert.match(doc, /ASCII diagnostic source-flow diagram: present/);
  assert.match(doc, /Mermaid diagnostic source-flow diagram: present/);
  assert.match(doc, /diagnostic source-flow proof: PARTIAL/);
  assert.match(doc, /runtime diagnostic policy approvals: 0/);
  assert.match(doc, /implementation-ready diagnostic rows: 0/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /diagnostic cleanup blocked/);
  assert.match(doc, /metric replacement/);
  assert.match(doc, /release rollback boundary/);

  for (const [rowId, refs] of Object.entries(expectedDiagnosticSourceFlowRows)) {
    assert.match(doc, new RegExp(`\\| \`${rowId}\` \\|`), `missing diagnostic source-flow row ${rowId}`);
    for (const ref of refs) {
      assert.ok(doc.includes(ref), `missing ${ref} for ${rowId}`);
    }
  }
}

function assertDiagnosticLoggingConvergenceBoundary(doc) {
  assert.match(doc, /Diagnostic Logging Convergence Boundary - 2026-05-30/);
  assert.match(doc, /joins the console callsite inventory, diagnostic\s+source-flow rows, debug-gated relay paths/);
  assert.match(doc, /identity and\s+import privacy exposure, JSON decision diagnostics, build\/release diagnostics/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /diagnostic logging convergence rows: 10/);
  assert.match(doc, /diagnostic logging policy source files covered by convergence: 21/);
  assert.match(doc, /active console callsites covered by convergence: 419/);
  assert.match(doc, /diagnostic source-flow rows covered by convergence: 9/);
  assert.match(doc, /implementation-ready diagnostic logging convergence rows: 0/);
  assert.match(doc, /runtime diagnostic logging convergence approvals: 0/);
  assert.match(doc, /diagnostic logging cleanup approval: NO-GO/);
  assert.match(doc, /diagnostic metric replacement approval: NO-GO/);
  assert.match(doc, /diagnostic privacy\/redaction approval: NO-GO/);
  assert.match(doc, /diagnostic logging convergence authority product source symbol: absent/);
  assert.match(doc, /runtime behavior changed by this convergence boundary: no/);

  for (const row of [
    'diagnostic_convergence_inventory',
    'diagnostic_convergence_hot_runtime_files',
    'diagnostic_convergence_level_split',
    'diagnostic_convergence_source_flow',
    'diagnostic_convergence_identity_privacy',
    'diagnostic_convergence_json_decision',
    'diagnostic_convergence_no_work_budget',
    'diagnostic_convergence_release_build',
    'diagnostic_convergence_metric_foundation',
    'diagnostic_convergence_authority_absence'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${row}\` \\|`), `missing diagnostic convergence row ${row}`);
  }
}

function assertContentBridgeProductionConsoleGateAddendum(doc) {
  assert.match(doc, /Content Bridge Production Console Gate Addendum - 2026-05-30/);
  assert.match(doc, /gate is installed from `js\/content_bridge\.js` and\s+guards isolated content-script-world `console\.log` and `console\.debug` calls/);
  assert.match(doc, /`js\/content\/dom_fallback\.js` routine gate already\s+runs before `content_bridge\.js`/);
  assert.match(doc, /intentionally does not gate `console\.warn` or `console\.error`/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /content_bridge production log\/debug gate: GO/);
  assert.match(doc, /warn\/error suppression: NO/);
  assert.match(doc, /page-world console override: NO/);
  assert.match(doc, /blocking\/whitelist behavior change intended: NO/);
  assert.match(doc, /runtime behavior changed by this addendum: yes, content_bridge-installed isolated-world log\/debug gate only/);
  assert.match(doc, /release\/public-claim proof from this addendum: NO-GO/);
  assert.match(doc, /broad audit completion from this addendum: NO-GO/);

  for (const row of [
    'content_bridge_console_gate_scope',
    'content_bridge_console_gate_levels',
    'content_bridge_console_gate_idempotency',
    'content_bridge_console_gate_debug_escape',
    'content_bridge_console_gate_behavior_surface'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${row}\` \\|`), `missing production console gate row ${row}`);
  }
}

function assertProductionConsoleGateLoadOrderAddendum(doc) {
  assert.match(doc, /Production Console Gate Load-Order Addendum - 2026-05-30/);
  assert.match(doc, /It is audit-only and makes no runtime change/);
  assert.match(doc, /manifest isolated content scripts/);
  assert.match(doc, /MAIN-world seed\/filter\/injector/);
  assert.match(doc, /legacy layout/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /active manifests checked: 4/);
  assert.match(doc, /selected routine log\/debug\/info token rows: 210/);
  assert.match(doc, /background routine log\/debug\/info token rows: 62/);
  assert.match(doc, /content_bridge routine log\/debug\/info token rows: 126/);
  assert.match(doc, /isolated pre-dom_fallback routine log\/debug\/info token rows: 0/);
  assert.match(doc, /active manifest js\/layout\.js refs: 0/);
  assert.match(doc, /runtime behavior changed by load-order addendum: no/);
  assert.match(doc, /production console load-order release proof: NO-GO/);
  assert.match(doc, /broad audit completion from load-order addendum: NO-GO/);

  for (const row of [
    'production_console_gate_background',
    'production_console_gate_isolated_manifest_order',
    'production_console_gate_isolated_pre_gate_silence',
    'production_console_gate_content_bridge_backup',
    'production_console_gate_main_world',
    'production_console_gate_legacy_layout',
    'production_console_gate_extension_ui',
    'production_console_gate_open_risks'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${row}\` \\|`), `missing production load-order row ${row}`);
  }

  const routineTotal = routineConsoleSourceFiles
    .map((file) => routineConsoleSites(file).length)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(routineTotal, 210);
  assert.equal(routineConsoleSites('js/background.js').length, 62);
  assert.equal(routineConsoleSites('js/content_bridge.js').length, 126);

  const background = read('js/background.js');
  assert.ok(
    lineNumberForToken(background, 'installFilterTubeBackgroundConsoleGate();') < routineConsoleSites('js/background.js')[0],
    'background console gate must install before routine background log/debug/info tokens'
  );
  assert.match(background, /console\.log = \(\.\.\.args\) => \{ if \(isEnabled\(\)\) originalLog\(\.\.\.args\); \}/);
  assert.match(background, /console\.debug = \(\.\.\.args\) => \{ if \(isEnabled\(\)\) originalDebug\(\.\.\.args\); \}/);
  assert.doesNotMatch(background, /console\.warn =/);
  assert.doesNotMatch(background, /console\.error =/);

  const domFallback = read('js/content/dom_fallback.js');
  assert.ok(
    lineNumberForToken(domFallback, 'installFilterTubeRoutineConsoleGate();') < routineConsoleSites('js/content/dom_fallback.js')[0],
    'dom_fallback routine console gate must install before routine DOM fallback log/debug/info tokens'
  );
  assert.match(domFallback, /if \(originalLog\) console\.log = \(\.\.\.args\) => \{ if \(isEnabled\(\)\) originalLog\(\.\.\.args\); \}/);
  assert.match(domFallback, /if \(originalInfo\) console\.info = \(\.\.\.args\) => \{ if \(isEnabled\(\)\) originalInfo\(\.\.\.args\); \}/);
  assert.match(domFallback, /if \(originalDebug\) console\.debug = \(\.\.\.args\) => \{ if \(isEnabled\(\)\) originalDebug\(\.\.\.args\); \}/);
  assert.doesNotMatch(domFallback, /console\.warn =/);
  assert.doesNotMatch(domFallback, /console\.error =/);

  const contentBridge = read('js/content_bridge.js');
  assert.ok(
    lineNumberForToken(contentBridge, 'installFilterTubeProductionConsoleGate();') < lineNumberForToken(contentBridge, "window.addEventListener('message'"),
    'content_bridge backup gate must install before bridge message listener'
  );
  assert.ok(
    lineNumberForToken(contentBridge, 'installFilterTubeProductionConsoleGate();') < lineNumberForToken(contentBridge, 'setTimeout(() => initialize(), 50);'),
    'content_bridge backup gate must install before initialize timer'
  );
  assert.match(contentBridge, /console\['log'\] = function filterTubeProductionLogGate/);
  assert.match(contentBridge, /console\['debug'\] = function filterTubeProductionDebugGate/);
  assert.doesNotMatch(contentBridge, /console\['warn'\]\s*=/);
  assert.doesNotMatch(contentBridge, /console\['error'\]\s*=/);

  let preGateRoutineConsoleSites = 0;
  let layoutRefs = 0;
  for (const manifestFile of activeManifestFiles) {
    const manifestText = read(manifestFile);
    const manifest = manifestJson(manifestFile);
    layoutRefs += (manifestText.match(/js\/layout\.js/g) || []).length;
    for (const entry of manifest.content_scripts || []) {
      if (!entry.js?.includes('js/content/dom_fallback.js')) continue;
      const domIndex = entry.js.indexOf('js/content/dom_fallback.js');
      assert.equal(domIndex, 5, `${manifestFile} dom_fallback isolated order drifted`);
      assert.ok(entry.js.indexOf('js/content/block_channel.js') > domIndex);
      assert.ok(entry.js.indexOf('js/content/bridge_settings.js') > domIndex);
      assert.ok(entry.js.indexOf('js/content/handle_resolver.js') > domIndex);
      assert.ok(entry.js.indexOf('js/content/collab_dialog.js') > domIndex);
      assert.ok(entry.js.indexOf('js/content_bridge.js') > domIndex);
      for (const file of entry.js.slice(0, domIndex)) {
        preGateRoutineConsoleSites += routineConsoleSites(file).length;
      }
    }
  }
  assert.equal(preGateRoutineConsoleSites, 0);
  assert.equal(layoutRefs, 0);

  assert.deepEqual(routineConsoleSites('js/seed.js'), [11, 33, 153]);
  assert.match(read('js/seed.js'), /if \(filterTubeSeedDebugEnabled\) \{\s*console\.log\('FilterTube: seed\.js initializing \(MAIN world\)'\);/s);
  assert.match(read('js/seed.js'), /function seedDebugLog\(message, \.\.\.args\) \{\s*if \(!isSeedDebugEnabled\(\)\) return;/s);
  assert.deepEqual(routineConsoleSites('js/filter_logic.js'), [11, 1575, 1590]);
  assert.match(read('js/filter_logic.js'), /if \(level === 'log' && !window\.__filtertubeDebug\) \{\s*return;/s);
  assert.match(read('js/filter_logic.js'), /if \(enabled\) \{\s*console\.log\(`FilterTube \(Filter\):`, message, \.\.\.args\);/s);
  assert.deepEqual(routineConsoleSites('js/injector.js'), [97]);
  assert.match(read('js/injector.js'), /if \(window\.__filtertubeDebug \|\| document\.documentElement\?\.getAttribute\('data-filtertube-debug'\) === 'true'\) \{\s*console\.debug\('FilterTube \(Injector\): Already initialized, skipping'\);/s);

  assert.equal(routineConsoleSites('js/layout.js').length, 4);
  assert.equal(routineConsoleSites('js/popup.js').length, 1);
  assert.equal(routineConsoleSites('js/tab-view.js').length, 1);
}

function assertProductionConsoleGateCoverageReconciliation(doc) {
  assert.match(doc, /Production Console Gate Coverage Reconciliation - 2026-05-31/);
  assert.match(doc, /Current source has three runtime gate owners/);
  assert.match(doc, /runtime console gate owner files: 3/);
  assert.match(doc, /background gate levels: log\/debug\/info/);
  assert.match(doc, /dom_fallback routine gate levels: log\/debug\/info/);
  assert.match(doc, /content_bridge backup gate levels: log\/debug/);
  assert.match(doc, /warn\/error suppression: NO/);
  assert.match(doc, /MAIN-world global console override: NO/);
  assert.match(doc, /live installed-tab console sampling proof: NO-GO/);
  assert.match(doc, /runtime behavior changed by this reconciliation: no/);
  assert.match(doc, /diagnostic logging cleanup approval: NO-GO/);

  for (const row of [
    'production_console_gate_coverage_background',
    'production_console_gate_coverage_dom_fallback',
    'production_console_gate_coverage_content_bridge',
    'production_console_gate_coverage_main_world',
    'production_console_gate_coverage_extension_ui',
    'production_console_gate_coverage_release_gap'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${row}\` \\|`), `missing coverage reconciliation row ${row}`);
  }

  const gateOwners = [
    ['js/background.js', 'function installFilterTubeBackgroundConsoleGate()'],
    ['js/content/dom_fallback.js', 'function installFilterTubeRoutineConsoleGate()'],
    ['js/content_bridge.js', 'function installFilterTubeProductionConsoleGate()']
  ];
  for (const [file, token] of gateOwners) {
    assert.match(read(file), new RegExp(escapeRegExp(token)), `${file} missing gate owner ${token}`);
  }
}

function assertProductionConsoleResidualHotPathPreflight(doc) {
  assert.match(doc, /Production Console Residual Hot-Path Preflight - 2026-05-31/);
  assert.match(doc, /separates textual `console\.log`\/`console\.debug`\/\s+`console\.info` callsites from execution-time console work/);
  assert.match(doc, /does not mistake function-body definitions for\s+pre-gate runtime output/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /production console residual preflight rows: 7/);
  assert.match(doc, /selected routine log\/debug\/info token rows: 210/);
  assert.match(doc, /content_bridge textual routine rows before backup install: 126/);
  assert.match(doc, /content_bridge top-level executed routine rows before backup install: 1/);
  assert.match(doc, /content_bridge debug helper routine definition rows: 1/);
  assert.match(doc, /content_bridge post-gate function-body routine rows: 124/);
  assert.match(doc, /background routine log\/debug\/info rows behind startup gate: 62/);
  assert.match(doc, /manifest-isolated routine rows behind dom_fallback gate: 135/);
  assert.match(doc, /MAIN-world local-debug routine rows: 7/);
  assert.match(doc, /extension UI\/layout routine rows outside YouTube hot path: 6/);
  assert.match(doc, /live installed-tab console sampling proof: NO-GO/);
  assert.match(doc, /diagnostic logging cleanup approval from residual preflight: NO-GO/);
  assert.match(doc, /runtime behavior changed by this preflight: no/);

  for (const row of [
    'production_console_residual_bridge_preface',
    'production_console_residual_bridge_function_bodies',
    'production_console_residual_background_gate',
    'production_console_residual_isolated_shared_gate',
    'production_console_residual_main_world_local_debug',
    'production_console_residual_non_hotpath_ui_layout',
    'production_console_residual_release_gate'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${row}\` \\|`), `missing residual hot-path row ${row}`);
  }

  const contentBridge = read('js/content_bridge.js');
  const backupInstallLine = lineNumberForToken(contentBridge, 'installFilterTubeProductionConsoleGate();');
  const bridgeSites = routineConsoleSites('js/content_bridge.js');
  assert.equal(bridgeSites.length, 126);
  assert.equal(bridgeSites.filter((line) => line < backupInstallLine).length, 126);
  assert.deepEqual(bridgeSites.filter((line) => line < 55), [13, 36]);
  assert.equal(bridgeSites.filter((line) => line > 55 && line < backupInstallLine).length, 124);
  assert.match(contentBridge, /function filterTubeDebugLog\(\.\.\.args\) \{\s*if \(!isFilterTubeDebugEnabled\(\)\) return;\s*console\.log\('FilterTube:', \.\.\.args\);/s);
  assert.match(contentBridge, /if \(isFilterTubeDebugEnabled\(\)\) \{\s*console\.log\("FilterTube: content_bridge\.js loaded \(Isolated World\)"\);/s);
  assert.ok(backupInstallLine < lineNumberForToken(contentBridge, "window.addEventListener('message'"));
  assert.ok(backupInstallLine < lineNumberForToken(contentBridge, 'setTimeout(() => initialize(), 50);'));

  assert.equal(routineConsoleSites('js/background.js').length, 62);
  assert.equal(lineNumberForToken(read('js/background.js'), 'installFilterTubeBackgroundConsoleGate();'), 12);
  assert.equal(routineConsoleSites('js/background.js')[0], 2187);

  const isolatedGateFiles = new Set();
  for (const manifestFile of activeManifestFiles) {
    const manifest = manifestJson(manifestFile);
    for (const entry of manifest.content_scripts || []) {
      if (!entry.js?.includes('js/content/dom_fallback.js')) continue;
      const domIndex = entry.js.indexOf('js/content/dom_fallback.js');
      for (const file of entry.js.slice(domIndex)) isolatedGateFiles.add(file);
    }
  }
  const isolatedRoutineRows = [...isolatedGateFiles]
    .map((file) => routineConsoleSites(file).length)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(isolatedRoutineRows, 135);

  const mainWorldRoutineRows = ['js/seed.js', 'js/filter_logic.js', 'js/injector.js']
    .map((file) => routineConsoleSites(file).length)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(mainWorldRoutineRows, 7);

  const extensionUiLayoutRows = ['js/popup.js', 'js/tab-view.js', 'js/layout.js']
    .map((file) => routineConsoleSites(file).length)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(extensionUiLayoutRows, 6);
}

function assertConnectedChromeConsoleSamplingPreconditionRecheck(doc) {
  assert.match(doc, /Connected Chrome Console Sampling Precondition Recheck - 2026-05-31/);
  assert.match(doc, /Chrome connector was reachable/);
  assert.match(doc, /connected Chrome endpoint reachable: yes/);
  assert.match(doc, /connected open top-level tabs observed: 45/);
  assert.match(doc, /connected relevant YouTube\/FilterTube tabs observed: 0/);
  assert.match(doc, /tab claimed for console sampling: no/);
  assert.match(doc, /raw tab titles or URLs committed: no/);
  assert.match(doc, /production console runtime sample collected: no/);
  assert.match(doc, /diagnostic console release sampling artifact written: no/);
  assert.match(doc, /live installed-tab console sampling proof: NO-GO/);
  assert.match(doc, /diagnostic logging cleanup approval from connector recheck: NO-GO/);
  assert.match(doc, /runtime behavior changed by connector recheck: no/);
  assert.match(doc, /no\s+relevant live target available through the connected inventory/);
}

test('runtime diagnostic logging policy matrix is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof slice with a production console-gate addendum/);
  assert.match(doc, /The original 2026-05-24 inventory was audit-only and changed no runtime\s+behavior/);
  assert.match(doc, /2026-05-30 addendum adds a `content_bridge\.js` bootstrap gate\s+for isolated content-script-world `console\.log` and `console\.debug` calls/);
  assert.match(doc, /diagnostic logging policy matrix source files: 21/);
  assert.match(doc, /active console callsites: 419/);
  assert.match(doc, /runtime behavior changed by original 2026-05-24 inventory: no/);
  assert.match(doc, /runtime behavior changed by 2026-05-30 content bridge console gate: yes/);
  assert.match(doc, /not completion proof for diagnostic logging policy authority/);
  assertDiagnosticSourceFlowAddendum(doc);
  assertDiagnosticLoggingConvergenceBoundary(doc);
  assertContentBridgeProductionConsoleGateAddendum(doc);
  assertProductionConsoleGateLoadOrderAddendum(doc);
  assertProductionConsoleGateCoverageReconciliation(doc);
  assertProductionConsoleResidualHotPathPreflight(doc);
  assertConnectedChromeConsoleSamplingPreconditionRecheck(doc);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('active console callsite counts stay source-derived', () => {
  const doc = read(docPath);
  const totals = { log: 0, warn: 0, error: 0, debug: 0, info: 0, total: 0 };

  for (const [file, expected] of Object.entries(expectedConsoleRows)) {
    const actual = consoleCounts(file);
    assert.deepEqual(actual, expected, `${file} console counts drifted`);
    for (const key of Object.keys(totals)) totals[key] += actual[key];
    assert.match(
      doc,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expected.log} \\| ${expected.warn} \\| ${expected.error} \\| ${expected.debug} \\| ${expected.info} \\| ${expected.total} \\|`)
    );
  }

  assert.deepEqual(totals, { log: 203, warn: 124, error: 68, debug: 24, info: 0, total: 419 });
  assert.match(doc, /console\.log callsites: 203/);
  assert.match(doc, /console\.warn callsites: 124/);
  assert.match(doc, /console\.error callsites: 68/);
  assert.match(doc, /console\.debug callsites: 24/);
  assert.match(doc, /console\.info callsites: 0/);
});

test('diagnostic owner family totals and hot files remain pinned', () => {
  const doc = read(docPath);
  const familyTotals = {};

  for (const [file, row] of Object.entries(expectedConsoleRows)) {
    const family = ownerFamily(file);
    familyTotals[family] = (familyTotals[family] || 0) + row.total;
  }

  assert.deepEqual(familyTotals, {
    'build-release-sync-scripts': 38,
    'background-storage-state': 131,
    'content-helper': 28,
    'page-runtime-core': 196,
    'quarantined-legacy': 4,
    'extension-ui': 22
  });
  assert.equal(expectedConsoleRows['js/content_bridge.js'].total, 182);
  assert.equal(expectedConsoleRows['js/background.js'].total, 102);

  for (const phrase of [
    '| `page-runtime-core` | 196 |',
    '| `background-storage-state` | 131 |',
    '| `build-release-sync-scripts` | 38 |',
    '| `content-helper` | 28 |',
    '| `extension-ui` | 22 |',
    '| `quarantined-legacy` | 4 |'
  ]) {
    assert.ok(doc.includes(phrase), `missing family row ${phrase}`);
  }
});

test('current logging surface includes identity network import and JSON decision diagnostics without policy authority', () => {
  const doc = read(docPath);
  const background = read('js/background.js');
  const bridge = read('js/content_bridge.js');
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');

  assert.match(background, /console\.log\('FilterTube Background: Extracted -', \{ name: channelName, handle: channelHandle, logo: channelLogo, resolvedChannelId: resolvedChannelId \}\)/);
  assert.match(background, /console\.log\('FilterTube Subscriptions Import:', \{/);
  assert.match(background, /console\.log\(`FilterTube Background: Received getCompiledSettings message for profile:/);
  assert.match(bridge, /console\.log\('FilterTube: Extracted from lockup data attrs:', \{ handle: dataHandle, id: dataId, name \}\)/);
  assert.match(bridge, /console\.log\('FilterTube: Falling back to main-world lookup for video:'/);
  assert.match(filterLogic, /console\.log\('FilterTube Whitelist \(JSON\):', \{/);
  assert.match(filterLogic, /console\.log\(`FilterTube \(Filter\):`, message, \.\.\.args\)/);
  assert.match(seed, /console\.log\('FilterTube: seed\.js initializing \(MAIN world\)'\)/);
  assert.match(injector, /postLog\('log', 'FilterTube Subscriptions Import:', \{/);

  for (const boundary of [
    'Page runtime extraction',
    'Background identity repair',
    'JSON filter engine',
    'Seed interception',
    'Import/export/sync',
    'Build/release scripts'
  ]) {
    assert.ok(doc.includes(`| ${boundary} |`), `missing boundary ${boundary}`);
  }
});

test('runtime diagnostic logging matrix is linked from audit ledgers and runtime results', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const readinessGate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const gapRegister = read('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex
  ]) {
    assert.match(artifact, /Runtime diagnostic logging policy matrix addendum/);
    assert.ok(artifact.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
    assert.ok(artifact.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  }

  for (const artifact of [readinessGate, gapRegister]) {
    assert.ok(artifact.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
    assert.ok(artifact.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  }

  for (const artifact of [objectiveLedger, activeGoal, readinessGate, gapRegister]) {
    assert.match(artifact, /diagnostic logging convergence/i);
    assert.match(artifact, /10 diagnostic logging convergence\s+rows/);
    assert.match(artifact, /419 active console\s+callsites/);
    assert.match(artifact, /9 diagnostic\s+source-flow\s+rows/);
    assert.match(artifact, /implementation-ready diagnostic\s+logging\s+convergence\s+rows\s+0|0\s+implementation-ready diagnostic\s+logging\s+convergence\s+rows/);
  }

  for (const artifact of [objectiveLedger, activeGoal, readinessGate, gapRegister]) {
    assert.match(artifact, /2026-05-31 production console gate coverage reconciliation|Production console gate coverage reconciliation - 2026-05-31/);
    assert.match(artifact, /3 runtime console\s+gate owner\s+files/);
    assert.match(artifact, /no MAIN-world global console\s+override|no MAIN-world global console override/);
    assert.match(artifact, /no live installed-tab console\s+sampling\s+proof/);
  }

  for (const artifact of [readinessGate, gapRegister]) {
    assert.match(artifact, /2026-05-31 production console residual hot-path preflight|Production console residual hot-path preflight - 2026-05-31/);
    assert.match(artifact, /7 residual (?:preflight )?rows/);
    assert.match(artifact, /210 selected\s+routine `log\/debug\/info` token rows/);
    assert.match(artifact, /126 textual content-bridge routine rows/);
    assert.match(artifact, /1 content-bridge top-level executed routine\s+row/);
    assert.match(artifact, /135 manifest-isolated routine rows behind the `dom_fallback`\s+gate/);
    assert.match(artifact, /live installed-tab console sampling/);
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('first-class diagnostic logging authority tokens are absent from scoped product source', () => {
  const doc = read(docPath);
  const productSource = scopedSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(productSource, new RegExp(`\\b${token}\\b`), `source unexpectedly defines ${token}`);
  }

  assert.doesNotMatch(productSource, /diagnosticLogPolicyReport/);
  assert.doesNotMatch(productSource, /diagnosticLogDecision/);
});
