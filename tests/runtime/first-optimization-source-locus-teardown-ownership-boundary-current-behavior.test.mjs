import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-teardown-ownership-boundary-current-behavior.test.mjs';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  lifecycleTeardown: 'docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md',
  noWorkMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-SOURCE-LOCUS-TEARDOWN-00-settings-scope',
  'FT-SOURCE-LOCUS-TEARDOWN-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-TEARDOWN-02-transport-json',
  'FT-SOURCE-LOCUS-TEARDOWN-03-filter-engine',
  'FT-SOURCE-LOCUS-TEARDOWN-04-dom-fallback',
  'FT-SOURCE-LOCUS-TEARDOWN-05-menu-quickblock',
  'FT-SOURCE-LOCUS-TEARDOWN-06-network-resolver',
  'FT-SOURCE-LOCUS-TEARDOWN-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-TEARDOWN-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-TEARDOWN-09-whitelist-policy',
  'FT-SOURCE-LOCUS-TEARDOWN-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-TEARDOWN-11-parity-release-verification'
];

const sourceLocusRows = [
  'FT-SOURCE-LOCUS-CALLABLE-00-settings-scope',
  'FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-CALLABLE-02-transport-json',
  'FT-SOURCE-LOCUS-CALLABLE-03-filter-engine',
  'FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback',
  'FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock',
  'FT-SOURCE-LOCUS-CALLABLE-06-network-resolver',
  'FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy',
  'FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification'
];

const classifiedSourceFiles = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/state_manager.js',
  'js/settings_shared.js',
  'js/io_manager.js',
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs'
];

const teardownEvidenceFiles = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/background.js',
  'js/state_manager.js',
  'js/io_manager.js'
];

const anchorChecks = [
  { file: 'js/seed.js', line: 685, needle: 'window.fetch = function(resource, init)' },
  { file: 'js/seed.js', line: 775, needle: 'const originalAddEventListener = proto.addEventListener' },
  { file: 'js/seed.js', line: 776, needle: 'const originalRemoveEventListener = proto.removeEventListener' },
  { file: 'js/seed.js', line: 863, needle: "Object.defineProperty(xhr, 'response'" },
  { file: 'js/seed.js', line: 912, needle: 'proto.removeEventListener = function (type, listener, options)' },
  { file: 'js/filter_logic.js', line: 65, needle: 'pendingVideoChannelFlush = setTimeout' },
  { file: 'js/filter_logic.js', line: 126, needle: 'pendingVideoMetaFlush = setTimeout' },
  { file: 'js/content_bridge.js', line: 1148, needle: 'prefetchObserver = new IntersectionObserver' },
  { file: 'js/content_bridge.js', line: 1160, needle: "document.addEventListener('visibilitychange'" },
  { file: 'js/content_bridge.js', line: 1185, needle: "document.addEventListener('scroll'" },
  { file: 'js/content_bridge.js', line: 1193, needle: 'const observer = new MutationObserver' },
  { file: 'js/content_bridge.js', line: 1208, needle: 'observer.disconnect()' },
  { file: 'js/content_bridge.js', line: 1248, needle: 'const observer = new MutationObserver' },
  { file: 'js/content_bridge.js', line: 1268, needle: 'observer.disconnect()' },
  { file: 'js/content_bridge.js', line: 5945, needle: 'clearTimeout(pending.timeoutId)' },
  { file: 'js/content_bridge.js', line: 6107, needle: 'const debouncedFallback = debounce' },
  { file: 'js/content_bridge.js', line: 6126, needle: 'pendingImmediateFallbackTimer = setTimeout' },
  { file: 'js/content_bridge.js', line: 6148, needle: 'const whitelistPendingRefreshState = {' },
  { file: 'js/content_bridge.js', line: 6208, needle: 'whitelistPendingRefreshState.pendingHideTimer = setTimeout' },
  { file: 'js/content_bridge.js', line: 6416, needle: 'const observer = new MutationObserver' },
  { file: 'js/content_bridge.js', line: 7094, needle: 'const observer = new MutationObserver' },
  { file: 'js/content_bridge.js', line: 7178, needle: "window.addEventListener('scroll'" },
  { file: 'js/content_bridge.js', line: 7198, needle: 'const warmupTimer = setInterval' },
  { file: 'js/content_bridge.js', line: 7204, needle: 'clearInterval(warmupTimer)' },
  { file: 'js/content_bridge.js', line: 7258, needle: 'playlistFallbackPopoverState.rowObserver.disconnect()' },
  { file: 'js/content_bridge.js', line: 7264, needle: "document.removeEventListener('click'" },
  { file: 'js/content/block_channel.js', line: 1949, needle: 'function scheduleQuickBlockSweep' },
  { file: 'js/content/block_channel.js', line: 1991, needle: "document.addEventListener('focusin'" },
  { file: 'js/content/block_channel.js', line: 2201, needle: "document.addEventListener('pointermove'" },
  { file: 'js/content/block_channel.js', line: 2218, needle: 'const observer = new MutationObserver' },
  { file: 'js/content/block_channel.js', line: 2277, needle: "document.addEventListener('yt-navigate-finish'" },
  { file: 'js/content/dom_fallback.js', line: 2105, needle: "window.addEventListener('scroll'" },
  { file: 'js/content/dom_fallback.js', line: 2339, needle: "document.addEventListener('click'" },
  { file: 'js/content/dom_fallback.js', line: 2403, needle: "document.addEventListener('ended'" },
  { file: 'js/background.js', line: 912, needle: 'async function waitForPostBlockEnrichmentBeforeBackup' },
  { file: 'js/background.js', line: 918, needle: 'new Promise(resolve => setTimeout(resolve, timeoutMs))' },
  { file: 'js/background.js', line: 1489, needle: 'channelMapFlushTimer = setTimeout' },
  { file: 'js/state_manager.js', line: 2350, needle: 'externalReloadTimer = setTimeout' },
  { file: 'js/state_manager.js', line: 2356, needle: 'chrome.storage.onChanged.addListener' },
  { file: 'js/io_manager.js', line: 50, needle: 'setTimeout(() =>' },
  { file: 'js/io_manager.js', line: 2000, needle: 'clearTimeout(backupScheduleTimer)' },
  { file: 'js/io_manager.js', line: 2003, needle: 'backupScheduleTimer = setTimeout' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusTeardownBoundary',
  'firstOptimizationSourceLocusTeardownReport',
  'sourceLocusTeardownApproval',
  'sourceLocusCallableTeardownOwnerApproval',
  'jsonFirstSourceLocusTeardownGate',
  'whitelistSourceLocusTeardownGate',
  'metricFoundationTeardownAuthority',
  'runtimeSourceTeardownOwnerMap',
  'runtimeSourceTeardownCollector',
  'sourceLocusTeardownMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineAt(file, lineNumber) {
  return read(file).split(/\r?\n/)[lineNumber - 1] || '';
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next' || entry === '.vercel') continue;
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  if (/\.(js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(relativePath)) {
    result.push(relativePath.replaceAll(path.sep, '/'));
  }
  return result;
}

function productSource() {
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files.map((file) => read(file)).join('\n');
}

test('source-locus teardown ownership boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus teardown\s+ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /do not prove teardown\s+ownership/);
  assert.match(doc, /This is teardown ownership classification, not teardown approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus teardown rows counts and classified files stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-TEARDOWN-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus teardown boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /runtime source files with teardown evidence covered: 8/);
  assert.match(doc, /runtime\/build source files classified: 14/);
  assert.match(doc, /audit\/test anchor files covered: 2/);
  assert.match(doc, /current source teardown anchors covered: 42/);
  assert.match(doc, /lifecycle teardown classes covered: 5/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus teardown rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) {
    assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  }
  for (const sourceFile of classifiedSourceFiles) {
    assert.ok(doc.includes(sourceFile), `missing classified file ${sourceFile}`);
  }
  for (const sourceFile of teardownEvidenceFiles) {
    assert.ok(doc.includes(sourceFile), `missing teardown evidence file ${sourceFile}`);
  }
});

test('source-locus teardown anchors resolve to current source text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 42);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus teardown boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const lifecycleTeardown = read(sourceDocs.lifecycleTeardown);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const noWorkMatrix = read(sourceDocs.noWorkMatrix);
  const sideEffectMatrix = read(sourceDocs.sideEffectMatrix);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.match(lifecycleTeardown, /missing-shared-authority/);
  assert.match(lifecycleTeardown, /No runtime symbol exists yet for:/);
  assert.match(sourceOwnerApproval, /Callable and teardown owner approval/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(noWorkMatrix, /observer\/timer teardown proof/);
  assert.match(sideEffectMatrix, /teardown proof/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
  assert.match(doc, /commit source-owner-map\.json now: NO-GO/);
});

test('source-locus teardown future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus teardown boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusCallable: sourceDocs.sourceLocusCallable,
    sourceLocusFingerprint: sourceDocs.sourceLocusFingerprint,
    sourceOwnerApproval: sourceDocs.sourceOwnerApproval,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };
  const doc = read(docPath);

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.ok(doc.includes(runtimeTestPath));
});
