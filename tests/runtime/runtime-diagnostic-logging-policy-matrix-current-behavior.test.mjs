import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';

const sourceFingerprints = {
  'build.js': [686, 24689, 'f6778ce29f1d7f520a66ab689f8c1a2999e5887ffa8c53bd5039f4976b2671b6'],
  'js/background.js': [6313, 284710, '46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb'],
  'js/content/block_channel.js': [3175, 127396, '1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83'],
  'js/content/bridge_settings.js': [651, 26462, 'c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b'],
  'js/content/collab_dialog.js': [393, 14623, 'dc34bba556b310da8b7516d106e9d67addea59d8a707a02f21607ac97af1f72a'],
  'js/content/dom_extractors.js': [1102, 45149, '3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'],
  'js/filter_logic.js': [3498, 165151, '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641'],
  'js/injector.js': [3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
  'js/io_manager.js': [2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'],
  'js/layout.js': [680, 30604, '48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7'],
  'js/popup.js': [1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7'],
  'scripts/build-extension-ui.mjs': [50, 1188, '6326362ebf90f448ccdbf68945b3fb522b7b215edaf9b3e28589a4e166239cf3'],
  'scripts/build-nanah-vendor.mjs': [65, 1818, 'dae8d3ef29c4cd44b0bf975090e9d53f3bb05b523355f5038930fc03b27e921c'],
  'scripts/sync-native-runtime.mjs': [34, 1070, '4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6']
};

const expectedConsoleRows = {
  'build.js': { log: 14, warn: 5, error: 8, debug: 0, info: 0, total: 27 },
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
  'diagnosticPrivacyRedactionAuthority'
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
    '`js/filter_logic.js:1557-1586`',
    '`js/filter_logic.js:3434-3496`'
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
    '`js/background.js:2555-2620`',
    '`js/background.js:2666-3267`'
  ],
  diagnostic_flow_import_export_backup: [
    '`js/io_manager.js:1670-1987`',
    '`js/tab-view.js:9100-9350`'
  ],
  diagnostic_flow_content_helper_menu: [
    '`js/content/block_channel.js:7-14`',
    '`js/content/block_channel.js:1744-2858`',
    '`js/content/block_channel.js:3130-3130`'
  ],
  diagnostic_flow_build_release_scripts: [
    '`build.js:75-190`',
    '`build.js:529-682`',
    '`scripts/build-extension-ui.mjs:47-48`',
    '`scripts/build-nanah-vendor.mjs:62-63`',
    '`scripts/sync-native-runtime.mjs:12-30`'
  ]
};

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
  assert.match(doc, /active console callsites covered by convergence: 418/);
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

test('runtime diagnostic logging policy matrix is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, logging patch, privacy patch/);
  assert.match(doc, /diagnostic logging policy matrix source files: 21/);
  assert.match(doc, /active console callsites: 418/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /not completion proof for diagnostic logging policy authority/);
  assertDiagnosticSourceFlowAddendum(doc);
  assertDiagnosticLoggingConvergenceBoundary(doc);

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

  assert.deepEqual(totals, { log: 203, warn: 123, error: 68, debug: 24, info: 0, total: 418 });
  assert.match(doc, /console\.log callsites: 203/);
  assert.match(doc, /console\.warn callsites: 123/);
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
    'build-release-sync-scripts': 37,
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
    '| `build-release-sync-scripts` | 37 |',
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
    assert.match(artifact, /418 active console\s+callsites/);
    assert.match(artifact, /9 diagnostic\s+source-flow\s+rows/);
    assert.match(artifact, /implementation-ready diagnostic\s+logging\s+convergence\s+rows\s+0|0\s+implementation-ready diagnostic\s+logging\s+convergence\s+rows/);
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
