import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';

const sourceDocs = {
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
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

const runtimeSourceFiles = [
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

const anchorChecks = [
  { file: 'js/settings_shared.js', line: 564, needle: 'function loadSettings()' },
  { file: 'js/state_manager.js', line: 178, needle: 'async function loadSettings(options = {})' },
  { file: 'js/seed.js', line: 236, needle: "settings.listMode === 'whitelist'" },
  { file: 'tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs', line: 9, needle: sourceOwnerMapPath },
  { file: sourceDocs.sourceOwnerApproval, line: 24, needle: sourceOwnerMapPath },
  { file: 'js/seed.js', line: 685, needle: 'window.fetch = function(resource, init)' },
  { file: 'js/seed.js', line: 813, needle: 'const ensureXhrResponseProcessed = (xhr) =>' },
  { file: 'js/seed.js', line: 924, needle: 'proto.open = function(method, url)' },
  { file: 'js/filter_logic.js', line: 853, needle: 'class YouTubeDataFilter' },
  { file: 'js/filter_logic.js', line: 1957, needle: '_shouldBlock(item, rendererType)' },
  { file: 'js/filter_logic.js', line: 3528, needle: "filter(obj, path = 'root')" },
  { file: 'js/content/dom_fallback.js', line: 2219, needle: 'async function applyDOMFallback(settings, options = {})' },
  { file: 'js/content/dom_fallback.js', line: 2290, needle: "window.addEventListener('scroll'" },
  { file: 'js/content_bridge.js', line: 1195, needle: 'const observer = new MutationObserver' },
  { file: 'js/content/block_channel.js', line: 1963, needle: 'function scheduleQuickBlockSweep' },
  { file: 'js/content/block_channel.js', line: 2232, needle: 'const observer = new MutationObserver' },
  { file: 'js/content_bridge.js', line: 11539, needle: "menuItem.addEventListener('click'" },
  { file: 'js/content/handle_resolver.js', line: 149, needle: 'async function fetchIdForHandle(handle, options = {})' },
  { file: 'js/content/handle_resolver.js', line: 239, needle: 'response = await fetch(path' },
  { file: 'js/background.js', line: 980, needle: 'async function waitForPostBlockEnrichmentBeforeBackup' },
  { file: 'js/background.js', line: 1737, needle: 'function ensureChannelMapCache()' },
  { file: 'js/background.js', line: 1757, needle: 'function flushChannelMapUpdates()' },
  { file: 'js/state_manager.js', line: 2356, needle: 'chrome.storage.onChanged.addListener' },
  { file: 'js/io_manager.js', line: 473, needle: 'async function readStorage(keys)' },
  { file: 'js/content/dom_fallback.js', line: 972, needle: 'function markElementAsBlocked' },
  { file: 'js/content/dom_fallback.js', line: 1027, needle: "element.classList.remove('filtertube-hidden')" },
  { file: 'js/content_bridge.js', line: 12206, needle: 'async function handleBlockChannelClick' },
  { file: 'js/content/dom_fallback.js', line: 2074, needle: "settings.listMode === 'whitelist'" },
  { file: 'js/content_bridge.js', line: 6211, needle: 'const whitelistPendingRefreshState = {' },
  { file: 'js/content_bridge.js', line: 6271, needle: 'whitelistPendingRefreshState.pendingHideTimer = setTimeout' },
  { file: 'js/seed.js', line: 150, needle: 'function seedDebugLog(message, ...args)' },
  { file: 'js/seed.js', line: 153, needle: 'console.log(`[${seedDebugSequence}] FilterTube (Seed):`' },
  { file: 'js/filter_logic.js', line: 21, needle: 'function postLogToBridge(level, ...args)' },
  { file: 'build.js', line: 82, needle: 'async function main()' },
  { file: 'build.js', line: 147, needle: 'const zipPath = await createZip' },
  { file: 'scripts/build-extension-ui.mjs', line: 23, needle: 'async function bundleAll()' },
  { file: 'scripts/build-nanah-vendor.mjs', line: 18, needle: 'await esbuild.build({' },
  { file: 'scripts/sync-native-runtime.mjs', line: 21, needle: 'const result = spawnSync' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusCallableBoundary',
  'firstOptimizationSourceLocusCallableReport',
  'firstOptimizationSourceLocusCallableApproval',
  'metricFoundationSourceLocusApprovalAuthority',
  'metricFoundationCallableOwnerApproval',
  'sourceLocusLineAnchorApproval',
  'sourceLocusCallableOwnerApproval',
  'sourceLocusListenerOwnerApproval',
  'sourceLocusObserverOwnerApproval',
  'sourceLocusTimerOwnerApproval',
  'jsonFirstSourceLocusCallableGate',
  'whitelistSourceLocusCallableGate'
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
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  if (/\.(js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(relativePath)) {
    result.push(relativePath);
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

test('source locus callable anchor boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source locus and\s+callable anchor boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /source-owner approval boundary requires line-anchored source ownership/);
  assert.match(doc, /not completion proof for source-locus or callable approval authority/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source locus callable rows counts and source files stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-CALLABLE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus callable boundary rows: 12/);
  assert.match(doc, /source-owner approval rows covered: 12/);
  assert.match(doc, /source owner map contract rows covered: 12/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /line anchors covered: 38/);
  assert.match(doc, /runtime source files covered: 14/);
  assert.match(doc, /audit\/test anchor files covered: 2/);
  assert.match(doc, /listener\/observer\/timer surfaces pinned: 9/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus callable rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const sourceFile of runtimeSourceFiles) {
    assert.ok(doc.includes(sourceFile), `missing runtime source ${sourceFile}`);
  }
});

test('source locus callable line anchors resolve to current source text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 38);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`${anchor.file}:${anchor.line}`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source locus callable boundary preserves artifact absence and current approval gaps', () => {
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const sourceOwnerMapContract = read(sourceDocs.sourceOwnerMapContract);
  const sourceOwnerMatrix = read(sourceDocs.sourceOwnerMatrix);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.match(sourceOwnerApproval, /line-anchored source ownership, callable ownership, metric field production/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(sourceOwnerMapContract, /`sourceLocus`, `sourceOwner`, `ownerFamily`, `sourceFiles`, `callables`, `lineAnchors`/);
  assert.match(sourceOwnerMapContract, /commit source-owner-map\.json now: NO-GO/);
  assert.match(sourceOwnerMatrix, /runtime source files referenced: 14/);
  assert.match(sourceOwnerMatrix, /source-owner rows implementation-ready: 0/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
});

test('source locus callable future authority symbols are absent from product source', () => {
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source locus callable boundary is linked from ledgers and upstream gates', () => {
  const requiredLinkFiles = {
    ...sourceDocs,
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
