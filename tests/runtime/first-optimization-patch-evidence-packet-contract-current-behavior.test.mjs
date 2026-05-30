import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-patch-evidence-packet-contract-current-behavior.test.mjs';

const sourceDocs = {
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  whitelistReadiness: 'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metric: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  locus: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
  readiness: 'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md'
};

const expectedEvidenceRows = [
  'FT-EVIDENCE-00-candidate-obligation-binding',
  'FT-EVIDENCE-01-route-surface-mode-scope',
  'FT-EVIDENCE-02-metric-artifact',
  'FT-EVIDENCE-03-positive-negative-fixtures',
  'FT-EVIDENCE-04-false-hide-leak-restore',
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-06-lifecycle-budget',
  'FT-EVIDENCE-07-settings-mutation-profile',
  'FT-EVIDENCE-08-diagnostic-privacy',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const identityScopeFields = [
  'candidateId',
  'obligationId',
  'readinessId',
  'sourceLocus',
  'sourceOwner',
  'route',
  'surface',
  'endpoint',
  'profileType',
  'listMode',
  'ruleState',
  'settingsRevision'
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

const fixtureParityFields = [
  'positiveFixture',
  'negativeSiblingFixture',
  'noRuleFixture',
  'disabledFixture',
  'emptyListFixture',
  'unrelatedSurfaceFixture',
  'domParityFixture',
  'nativeParityFixture'
];

const sideEffectPolicyFields = [
  'falseHideBudget',
  'leakBudget',
  'pendingIdentityPolicy',
  'staleMarkerCleanupPolicy',
  'settingsMutationPolicy',
  'lifecycleOwnerPolicy',
  'diagnosticPrivacyPolicy',
  'rolloutClaimPolicy'
];

const futureAuthorityTokens = [
  'firstOptimizationPatchEvidencePacketContract',
  'firstOptimizationPatchEvidencePacket',
  'firstOptimizationCandidateObligationBinding',
  'firstOptimizationMetricArtifactPacket',
  'firstOptimizationFixtureParityPacket',
  'firstOptimizationSideEffectBudgetPacket',
  'firstOptimizationSettingsMutationPacket',
  'firstOptimizationLifecycleBudgetPacket',
  'firstOptimizationDiagnosticPrivacyPacket',
  'firstOptimizationRolloutClaimPacket'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function productSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');
}

test('first optimization patch evidence packet contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior evidence packet contract/);
  assert.match(doc, /Runtime behavior\s+is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /First optimization evidence packet required: yes/);
  assert.match(doc, /Current runtime evidence packet exists: no/);
  assert.match(doc, /Implementation-ready optimization rows: 0/);
  assert.match(doc, /not completion proof for optimization readiness/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization patch evidence rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-EVIDENCE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedEvidenceRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /first optimization evidence packet rows: 10/);
  assert.match(doc, /implementation-ready evidence packets: 0/);
  assert.match(doc, /candidate-obligation bindings ready: 0/);
  assert.match(doc, /required identity-scope fields: 12/);
  assert.match(doc, /required work-budget fields: 12/);
  assert.match(doc, /required fixture-parity fields: 8/);
  assert.match(doc, /required side-effect policy fields: 8/);
});

test('first optimization evidence packet contract is backed by current gate documents', () => {
  const stopGo = read(sourceDocs.stopGo);
  const whitelistReadiness = read(sourceDocs.whitelistReadiness);
  const priority = read(sourceDocs.priority);
  const p0Gate = read(sourceDocs.p0Gate);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const metric = read(sourceDocs.metric);
  const locus = read(sourceDocs.locus);
  const readiness = read(sourceDocs.readiness);

  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(stopGo, /The first acceptable runtime patch shape is a measured work-decision or metric-artifact patch/);

  assert.match(whitelistReadiness, /whitelist readiness gap rows: 10/);
  assert.match(whitelistReadiness, /implementation-ready whitelist optimization rows: 0/);
  assert.match(whitelistReadiness, /readiness rows requiring metric artifacts: 10/);

  assert.match(priority, /optimization priority candidates: 12/);
  assert.match(priority, /P0 prerequisite candidates: 6/);
  assert.match(priority, /implementation-ready candidates: 0/);

  assert.match(p0Gate, /P0 optimization authority rows: 6/);
  assert.match(p0Gate, /P0 rows implementation-ready: 0/);
  assert.match(p0Gate, /P0 rows with metric artifact authority: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);

  assert.match(metric, /performance\.now callsites: 0/);
  assert.match(metric, /jsonFirstMetricArtifactReport token occurrences: 0/);
  assert.match(metric, /Required Future Metric Artifact/);

  assert.match(locus, /Current Implementation Loci/);
  assert.match(locus, /jsonFirstSourceLocusDecision/);
  assert.match(readiness, /JSON-first promotion rows remain blocked|JSON-First Promotion Gate/);
});

test('first optimization evidence packet fields stay explicit', () => {
  const doc = read(docPath);

  for (const field of [
    ...identityScopeFields,
    ...workBudgetFields,
    ...fixtureParityFields,
    ...sideEffectPolicyFields
  ]) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing evidence field ${field}`);
  }

  assert.match(doc, /positive match, negative sibling-visible, no-rule, disabled, empty-list, and unrelated-surface fixtures/);
  assert.match(doc, /false-hide, leak, pending identity, restore, stale-marker, and cleanup behavior/);
  assert.match(doc, /JSON, DOM, and native\/runtime parity/);
  assert.match(doc, /storage, profile, lock\/session, import, transition, backup, cache invalidation, and refresh/);
});

test('first optimization evidence packet authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization evidence packet contract is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const stopGo = read(sourceDocs.stopGo);
  const whitelistReadiness = read(sourceDocs.whitelistReadiness);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    stopGo,
    whitelistReadiness,
    routeSurfaceMetric
  ]) {
    assert.match(artifact, /First optimization patch evidence packet contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
