import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-side-effect-ownership-boundary-current-behavior.test.mjs';
const sideEffectBudgetPath = 'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json';
const noWorkPreservationPath = 'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-SOURCE-LOCUS-SIDEEFFECT-00-settings-scope',
  'FT-SOURCE-LOCUS-SIDEEFFECT-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-SIDEEFFECT-02-transport-json',
  'FT-SOURCE-LOCUS-SIDEEFFECT-03-filter-engine',
  'FT-SOURCE-LOCUS-SIDEEFFECT-04-dom-fallback',
  'FT-SOURCE-LOCUS-SIDEEFFECT-05-menu-quickblock',
  'FT-SOURCE-LOCUS-SIDEEFFECT-06-network-resolver',
  'FT-SOURCE-LOCUS-SIDEEFFECT-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-SIDEEFFECT-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-SIDEEFFECT-09-whitelist-policy',
  'FT-SOURCE-LOCUS-SIDEEFFECT-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-SIDEEFFECT-11-parity-release-verification'
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

const collectorSideEffectRows = [
  'FT-COLLECTOR-SIDEEFFECT-00-settings-refresh-broadcast-budget',
  'FT-COLLECTOR-SIDEEFFECT-01-artifact-write-provenance-budget',
  'FT-COLLECTOR-SIDEEFFECT-02-fetch-body-rebuild-budget',
  'FT-COLLECTOR-SIDEEFFECT-03-xhr-listener-override-budget',
  'FT-COLLECTOR-SIDEEFFECT-04-engine-map-side-effect-budget',
  'FT-COLLECTOR-SIDEEFFECT-05-dom-selector-rerun-budget',
  'FT-COLLECTOR-SIDEEFFECT-06-menu-quick-lifecycle-budget',
  'FT-COLLECTOR-SIDEEFFECT-07-network-timeout-credential-budget',
  'FT-COLLECTOR-SIDEEFFECT-08-storage-backup-refresh-budget',
  'FT-COLLECTOR-SIDEEFFECT-09-visual-hide-restore-budget',
  'FT-COLLECTOR-SIDEEFFECT-10-whitelist-pending-policy-budget',
  'FT-COLLECTOR-SIDEEFFECT-11-diagnostic-rollout-budget'
];

const evidenceRows = [
  'FT-EVIDENCE-02-metric-artifact',
  'FT-EVIDENCE-04-false-hide-leak-restore',
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-06-lifecycle-budget',
  'FT-EVIDENCE-07-settings-mutation-profile',
  'FT-EVIDENCE-08-diagnostic-privacy',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const workBudgetFields = [
  'parseBudget',
  'stringifyBudget',
  'processDataBudget',
  'harvestBudget',
  'listenerBudget',
  'observerBudget',
  'timerBudget',
  'networkBudget',
  'storageBudget',
  'hideBudget',
  'restoreBudget',
  'diagnosticBudget'
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

const sideEffectEvidenceFiles = [
  'js/settings_shared.js',
  'js/state_manager.js',
  'js/seed.js',
  'js/filter_logic.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/io_manager.js',
  'js/content_bridge.js',
  'build.js',
  'scripts/sync-native-runtime.mjs'
];

const anchorChecks = [
  { file: 'js/settings_shared.js', line: 564, needle: 'function loadSettings()' },
  { file: 'js/state_manager.js', line: 178, needle: 'async function loadSettings(options = {})' },
  { file: 'js/state_manager.js', line: 1233, needle: 'chrome.runtime?.sendMessage({' },
  { file: 'js/seed.js', line: 157, needle: 'window.postMessage({' },
  { file: 'js/seed.js', line: 701, needle: 'return response.clone().json().then(jsonData =>' },
  { file: 'js/seed.js', line: 731, needle: 'return new Response(JSON.stringify(emptyCommentResponse), {' },
  { file: 'js/seed.js', line: 741, needle: 'return new Response(JSON.stringify(processed), {' },
  { file: 'js/seed.js', line: 843, needle: 'jsonData = JSON.parse(trimmed)' },
  { file: 'js/seed.js', line: 878, needle: "Object.defineProperty(xhr, 'responseText'" },
  { file: 'js/seed.js', line: 899, needle: 'proto.addEventListener = function (type, listener, options)' },
  { file: 'js/filter_logic.js', line: 74, needle: 'pendingVideoChannelFlush = setTimeout(() =>' },
  { file: 'js/filter_logic.js', line: 80, needle: 'window.postMessage({' },
  { file: 'js/filter_logic.js', line: 141, needle: 'window.postMessage({' },
  { file: 'js/filter_logic.js', line: 1511, needle: 'window.postMessage({' },
  { file: 'js/filter_logic.js', line: 1590, needle: "console.log('FilterTube Whitelist (JSON):'" },
  { file: 'js/filter_logic.js', line: 2305, needle: 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })' },
  { file: 'js/filter_logic.js', line: 3596, needle: 'this._harvestChannelData(data)' },
  { file: 'js/filter_logic.js', line: 3598, needle: "console.warn('FilterTube: Harvesting failed', e)" },
  { file: 'js/filter_logic.js', line: 3613, needle: 'const filtered = this.filter(data)' },
  { file: 'js/content/dom_fallback.js', line: 2035, needle: 'async function applyDOMFallback(settings, options = {})' },
  { file: 'js/content/dom_fallback.js', line: 2310, needle: "document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')" },
  { file: 'js/content/dom_fallback.js', line: 2488, needle: 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })' },
  { file: 'js/content/dom_fallback.js', line: 3668, needle: "targetToHide.setAttribute('data-filtertube-whitelist-pending', 'true')" },
  { file: 'js/content/dom_fallback.js', line: 4559, needle: "console.log('FilterTube Whitelist (DOM):'" },
  { file: 'js/content/block_channel.js', line: 1408, needle: 'function removeQuickBlockButtons()' },
  { file: 'js/content/block_channel.js', line: 1699, needle: 'chrome.runtime?.sendMessage({' },
  { file: 'js/content/block_channel.js', line: 1734, needle: "targetToHide.classList.add('filtertube-hidden')" },
  { file: 'js/content/block_channel.js', line: 1735, needle: "targetToHide.setAttribute('data-filtertube-hidden', 'true')" },
  { file: 'js/content/block_channel.js', line: 2218, needle: 'const observer = new MutationObserver((mutations) =>' },
  { file: 'js/content/block_channel.js', line: 2277, needle: "document.addEventListener('yt-navigate-finish'" },
  { file: 'js/content/block_channel.js', line: 2835, needle: 'chrome.runtime?.sendMessage({' },
  { file: 'js/content/block_channel.js', line: 3149, needle: 'await injectFilterTubeMenuItem(dropdown, videoCard)' },
  { file: 'js/content/handle_resolver.js', line: 167, needle: "const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap'])" },
  { file: 'js/content/handle_resolver.js', line: 192, needle: "resolvedHandleCache.set(cleanHandle, 'PENDING')" },
  { file: 'js/content/handle_resolver.js', line: 218, needle: 'window.postMessage({' },
  { file: 'js/content/handle_resolver.js', line: 239, needle: 'response = await fetch(path' },
  { file: 'js/content/handle_resolver.js', line: 240, needle: "credentials: 'same-origin'" },
  { file: 'js/background.js', line: 1480, needle: 'pendingChannelMapUpdates.clear()' },
  { file: 'js/background.js', line: 1481, needle: 'await browserAPI.storage.local.set({ channelMap: map })' },
  { file: 'js/background.js', line: 1489, needle: 'channelMapFlushTimer = setTimeout(() =>' },
  { file: 'js/state_manager.js', line: 2004, needle: 'await chrome.storage?.local.set({ channelMap: state.channelMap })' },
  { file: 'js/io_manager.js', line: 2000, needle: 'clearTimeout(backupScheduleTimer)' },
  { file: 'js/io_manager.js', line: 2003, needle: 'backupScheduleTimer = setTimeout(async () =>' },
  { file: 'js/content_bridge.js', line: 3713, needle: "chrome.storage.local.get(['stats', 'statsBySurface']" },
  { file: 'js/content_bridge.js', line: 6158, needle: 'whitelistPendingRefreshState.timer = setTimeout(() =>' },
  { file: 'js/content_bridge.js', line: 6208, needle: 'whitelistPendingRefreshState.pendingHideTimer = setTimeout(() =>' },
  { file: 'js/content_bridge.js', line: 6297, needle: "element.classList.add('filtertube-hidden')" },
  { file: 'js/content_bridge.js', line: 6298, needle: "element.setAttribute('data-filtertube-hidden', 'true')" },
  { file: 'js/content_bridge.js', line: 12216, needle: "prevHiddenAttr: element.getAttribute('data-filtertube-hidden')" },
  { file: 'js/content_bridge.js', line: 12229, needle: "element.classList.add('filtertube-hidden')" },
  { file: 'build.js', line: 84, needle: "execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' })" },
  { file: 'build.js', line: 186, needle: "const zipPath = path.join('dist', zipName)" },
  { file: 'scripts/sync-native-runtime.mjs', line: 21, needle: 'const result = spawnSync(process.execPath, [syncScript]' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusSideEffectBoundary',
  'firstOptimizationSourceLocusSideEffectReport',
  'sourceLocusSideEffectApproval',
  'sourceLocusCallableSideEffectOwnerApproval',
  'jsonFirstSourceLocusSideEffectGate',
  'whitelistSourceLocusSideEffectGate',
  'metricFoundationSideEffectAuthority',
  'runtimeSourceSideEffectOwnerMap',
  'runtimeSourceSideEffectCollector',
  'sourceLocusSideEffectMetricArtifact',
  'sourceLocusSideEffectBudgetPacket',
  'runtimeSideEffectOptimizationAuthority'
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

test('source-locus side-effect ownership boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus\s+side-effect ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /This is side-effect ownership classification, not side-effect budget approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus side-effect rows counts and classified files stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-SIDEEFFECT-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus side-effect boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /evidence side-effect rows covered: 7/);
  assert.match(doc, /required work-budget fields covered: 12/);
  assert.match(doc, /runtime\/build source files classified: 14/);
  assert.match(doc, /runtime\/build source files with side-effect evidence covered: 12/);
  assert.match(doc, /audit\/test anchor files covered: 2/);
  assert.match(doc, /current source side-effect anchors covered: 53/);
  assert.match(doc, /side-effect risk classes covered: 8/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /committed no-work preservation files: 0/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus side-effect rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) {
    assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  }
  for (const row of collectorSideEffectRows) {
    assert.ok(doc.includes(row), `missing collector side-effect row ${row}`);
  }
  for (const evidenceRow of evidenceRows) {
    assert.ok(doc.includes(evidenceRow), `missing evidence row ${evidenceRow}`);
  }
  for (const field of workBudgetFields) {
    assert.ok(doc.includes(field), `missing work-budget field ${field}`);
  }
  for (const sourceFile of classifiedSourceFiles) {
    assert.ok(doc.includes(sourceFile), `missing classified file ${sourceFile}`);
  }
  for (const sourceFile of sideEffectEvidenceFiles) {
    assert.ok(doc.includes(sourceFile), `missing side-effect evidence file ${sourceFile}`);
  }
});

test('source-locus side-effect anchors resolve to current source text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 53);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus side-effect boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const sourceLocusNoWork = read(sourceDocs.sourceLocusNoWork);
  const sideEffectMatrix = read(sourceDocs.sideEffectMatrix);
  const sideEffectContract = read(sourceDocs.sideEffectContract);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, sideEffectBudgetPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, noWorkPreservationPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.match(sourceLocusNoWork, /implementation-ready source-locus no-work rows: 0/);
  assert.match(sideEffectMatrix, /runtime collector side-effect budgets approved: 0/);
  assert.match(sideEffectMatrix, /required work-budget fields covered: 12/);
  assert.match(sideEffectContract, /Committed side-effect budget files: 0/);
  assert.match(sideEffectContract, /runtime metric collector approvals: 0/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /commit side-effect-budget\.json now: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
});

test('source-locus side-effect future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus side-effect boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusCallable: sourceDocs.sourceLocusCallable,
    sourceLocusFingerprint: sourceDocs.sourceLocusFingerprint,
    sourceLocusTeardown: sourceDocs.sourceLocusTeardown,
    sourceLocusNoWork: sourceDocs.sourceLocusNoWork,
    sideEffectMatrix: sourceDocs.sideEffectMatrix,
    sideEffectContract: sourceDocs.sideEffectContract,
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
