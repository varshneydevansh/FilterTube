import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs';

const sourceDocs = {
  noWorkMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  network: 'docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedSideEffectRows = [
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

const expectedNoWorkRows = [
  'FT-COLLECTOR-NOWORK-00-settings-snapshot-preservation',
  'FT-COLLECTOR-NOWORK-01-fixture-envelope-preservation',
  'FT-COLLECTOR-NOWORK-02-fetch-pass-through-preservation',
  'FT-COLLECTOR-NOWORK-03-xhr-hook-preservation',
  'FT-COLLECTOR-NOWORK-04-engine-harvest-preservation',
  'FT-COLLECTOR-NOWORK-05-dom-quiet-preservation',
  'FT-COLLECTOR-NOWORK-06-menu-quick-off-preservation',
  'FT-COLLECTOR-NOWORK-07-network-zero-fetch-preservation',
  'FT-COLLECTOR-NOWORK-08-storage-zero-mutation-preservation',
  'FT-COLLECTOR-NOWORK-09-visual-no-mutation-preservation',
  'FT-COLLECTOR-NOWORK-10-whitelist-fail-state-preservation',
  'FT-COLLECTOR-NOWORK-11-diagnostic-claim-preservation'
];

const expectedEvidenceRows = [
  'FT-EVIDENCE-02-metric-artifact',
  'FT-EVIDENCE-04-false-hide-leak-restore',
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-06-lifecycle-budget',
  'FT-EVIDENCE-07-settings-mutation-profile',
  'FT-EVIDENCE-08-diagnostic-privacy',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const expectedWorkBudgetFields = [
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

const futureAuthorityTokens = [
  'firstOptimizationMetricCollectorSideEffectBudgetMatrix',
  'optimizationMetricCollectorSideEffectBudgetReport',
  'optimizationMetricCollectorSettingsBudget',
  'optimizationMetricCollectorArtifactWriteBudget',
  'optimizationMetricCollectorFetchBodyBudget',
  'optimizationMetricCollectorXhrListenerBudget',
  'optimizationMetricCollectorEngineSideEffectBudget',
  'optimizationMetricCollectorDomSideEffectBudget',
  'optimizationMetricCollectorLifecycleBudget',
  'optimizationMetricCollectorNetworkSideEffectBudget',
  'optimizationMetricCollectorStorageSideEffectBudget',
  'optimizationMetricCollectorVisualMutationBudget',
  'optimizationMetricCollectorWhitelistPolicyBudget',
  'optimizationMetricCollectorDiagnosticRolloutBudget'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  return ['js', 'build.js', 'scripts']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization collector side-effect budget matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric collector side-effect budget matrix/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Metric collector side-effect budget proof is required/);
  assert.match(doc, /Runtime collector side-effect budget proof exists: no/);
  assert.match(doc, /Implementation-ready collector side-effect rows: 0/);
  assert.match(doc, /not completion proof for metric collector side-effect budget authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization collector side-effect budget rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-SIDEEFFECT-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSideEffectRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector side-effect budget rows: 12/);
  assert.match(doc, /collector no-work preservation rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /evidence side-effect rows covered: 7/);
  assert.match(doc, /required work-budget fields covered: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /collector side-effect rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const noWorkRow of expectedNoWorkRows) {
    assert.ok(doc.includes(noWorkRow), `missing no-work row ${noWorkRow}`);
  }

  for (const evidenceRow of expectedEvidenceRows) {
    assert.ok(doc.includes(evidenceRow), `missing evidence row ${evidenceRow}`);
  }

  for (const field of expectedWorkBudgetFields) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing work budget field ${field}`);
  }
});

test('first optimization collector side-effect matrix is backed by current side-effect gates', () => {
  const noWorkMatrix = read(sourceDocs.noWorkMatrix);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const activeWork = read(sourceDocs.activeWork);
  const network = read(sourceDocs.network);
  const diagnostic = read(sourceDocs.diagnostic);
  const p0Gate = read(sourceDocs.p0Gate);

  assert.match(noWorkMatrix, /collector no-work preservation rows: 12/);
  assert.match(noWorkMatrix, /runtime collector no-work proofs approved: 0/);
  assert.match(noWorkMatrix, /collector no-work rows implementation-ready: 0/);

  assert.match(evidence, /required work-budget fields: 12/);
  assert.match(evidence, /required side-effect policy fields: 8/);
  assert.match(evidence, /FT-EVIDENCE-06-lifecycle-budget/);
  assert.match(evidence, /FT-EVIDENCE-07-settings-mutation-profile/);
  assert.match(evidence, /FT-EVIDENCE-08-diagnostic-privacy/);
  assert.match(evidence, /FT-EVIDENCE-09-rollout-claim-boundary/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /listenerCount/);
  assert.match(routeSurfaceMetric, /networkFetchCount/);
  assert.match(routeSurfaceMetric, /diagnosticLogCount/);

  assert.match(activeWork, /fallback menu warmup scans: 8/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);

  assert.match(network, /product fetch callsites in scoped files: 13/);
  assert.match(network, /fetch callsites with explicit credentials: 11/);

  assert.match(diagnostic, /active console callsites: 419/);
  assert.match(p0Gate, /P0 rows with unified work decision authority: 0/);
});

test('current source anchors still show side-effect budget risks before collector implementation', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  const ioManager = read('js/io_manager.js');

  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('new Response(JSON.stringify(processed)'));
  assert.ok(seed.includes('proto.addEventListener = function (type, listener, options)'));
  assert.ok(seed.includes("Object.defineProperty(xhr, 'response'"));

  assert.ok(filterLogic.includes('window.postMessage({'));
  assert.ok(filterLogic.includes("type: 'FilterTube_UpdateChannelMap'"));
  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));

  assert.ok(contentBridge.includes("element.classList.add('filtertube-hidden')"));
  assert.ok(contentBridge.includes("element.setAttribute('data-filtertube-hidden', 'true')"));
  assert.ok(contentBridge.includes('const refreshed = await requestSettingsFromBackground()'));
  assert.ok(contentBridge.includes('applyDOMFallback(refreshedSettings || currentSettings, { forceReprocess: true, preserveScroll: true })'));

  assert.ok(domFallback.includes("document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')"));
  assert.ok(domFallback.includes('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })'));
  assert.ok(domFallback.includes("toggleVisibility(el, false, '', true)"));

  assert.ok(blockChannel.includes("document.addEventListener('focusin', () => {"));
  assert.ok(blockChannel.includes('const observer = new MutationObserver((mutations) => {'));
  assert.ok(!blockChannel.includes('quickBlockPeriodicTimer = window.setInterval(() => {'));
  assert.ok(blockChannel.includes("document.addEventListener('yt-navigate-finish'"));
  assert.ok(blockChannel.includes("targetToHide.classList.add('filtertube-hidden')"));

  assert.ok(handleResolver.includes('pendingDomFallbackRerunTimer = setTimeout(() => {'));
  assert.ok(handleResolver.includes('response = await fetch(path'));

  assert.ok(background.includes("const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS)"));
  assert.ok(background.includes('const response = await fetch(`https://www.youtube.com/shorts/${videoId}`'));
  assert.ok(background.includes('enqueueChannelMapUpdate(keyId, m.handle)'));

  assert.ok(stateManager.includes('broadcastSettings(result.compiledSettings, profile)'));
  assert.ok(stateManager.includes("action: 'FilterTube_ApplySettings'"));
  assert.ok(stateManager.includes('await chrome.storage?.local.set({ channelMap: state.channelMap })'));

  assert.ok(ioManager.includes('backupScheduleTimer = setTimeout(async () => {'));
});

test('first optimization collector side-effect authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization collector side-effect matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const noWorkMatrix = read(sourceDocs.noWorkMatrix);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const activeWork = read(sourceDocs.activeWork);
  const network = read(sourceDocs.network);
  const diagnostic = read(sourceDocs.diagnostic);
  const p0Gate = read(sourceDocs.p0Gate);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    noWorkMatrix,
    evidence,
    routeSurfaceMetric,
    activeWork,
    network,
    diagnostic,
    p0Gate
  ]) {
    assert.match(artifact, /First optimization metric collector side-effect budget matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
