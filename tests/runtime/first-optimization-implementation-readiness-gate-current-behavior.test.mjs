import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs';
const methodSemanticGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  whitelistReadiness: 'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedReadinessRows = [
  'FT-FIRSTOPT-READY-00-stop-go-decision',
  'FT-FIRSTOPT-READY-01-candidate-priority',
  'FT-FIRSTOPT-READY-02-p0-work-authority',
  'FT-FIRSTOPT-READY-03-route-surface-obligation',
  'FT-FIRSTOPT-READY-04-whitelist-readiness',
  'FT-FIRSTOPT-READY-05-evidence-packet',
  'FT-FIRSTOPT-READY-06-candidate-binding',
  'FT-FIRSTOPT-READY-07-metric-artifact-schema',
  'FT-FIRSTOPT-READY-08-source-owner',
  'FT-FIRSTOPT-READY-09-collector-insertion',
  'FT-FIRSTOPT-READY-10-no-work-preservation',
  'FT-FIRSTOPT-READY-11-side-effect-budget',
  'FT-FIRSTOPT-READY-12-fixture-provenance',
  'FT-FIRSTOPT-READY-13-parity-rollout'
];

const futureAuthorityTokens = [
  'firstOptimizationImplementationReadinessGate',
  'firstOptimizationImplementationReadinessReport',
  'firstOptimizationRuntimePatchGoDecision',
  'firstOptimizationRuntimePatchNoGoBoundary',
  'firstOptimizationScopedCollectorApproval',
  'firstOptimizationEvidencePacketApproval',
  'firstOptimizationMetricArtifactApproval',
  'firstOptimizationSideEffectBudgetApproval',
  'firstOptimizationFixturePacketApproval',
  'firstOptimizationParityRolloutApproval',
  'jsonFirstWhitelistOptimizationGoGate'
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

test('first optimization implementation readiness gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization implementation readiness/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /Runtime first optimization approval exists: no/);
  assert.match(doc, /Implementation-ready first optimization rows: 0/);
  assert.match(doc, /method\/callable boundary is now explicit/);
  assert.match(doc, /69 tracked\s+JS\/JSX\/MJS files, 5,789 lexical callables/);
  assert.match(doc, /0 files with complete per-callable\s+semantic proof/);
  assert.match(doc, /5,789 callables requiring semantic proof/);
  assert.match(doc, /not completion proof for first optimization implementation readiness/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
  assert.ok(doc.includes(methodSemanticGapPath), `missing source doc ${methodSemanticGapPath}`);
});

test('first optimization implementation readiness rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-FIRSTOPT-READY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedReadinessRows);
  assert.equal(rows.length, 14);
  assert.match(doc, /first optimization implementation readiness rows: 14/);
  assert.match(doc, /stop\/go decision rows covered: 8/);
  assert.match(doc, /optimization candidates covered: 12/);
  assert.match(doc, /P0 authority rows covered: 6/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /whitelist readiness gaps covered: 10/);
  assert.match(doc, /evidence packet rows covered: 10/);
  assert.match(doc, /candidate binding rows covered: 10/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /complete per-callable semantic proof files covered: 0/);
  assert.match(doc, /5 route\/surface-specific\s+per-file metric artifact contract docs covered/);
  assert.match(doc, /5 route\/surface-specific\s+per-file metric artifact contract tests covered/);
  assert.equal(doc.includes('0 route/surface-specific per-file metric artifact contract docs covered'), false);
  assert.match(doc, /runtime first optimization approvals: 0/);
  assert.match(doc, /implementation-ready first optimization rows: 0/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('first optimization implementation readiness gate is backed by all current prerequisite gates', () => {
  const stopGo = read(sourceDocs.stopGo);
  const priority = read(sourceDocs.priority);
  const p0Gate = read(sourceDocs.p0Gate);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const whitelistReadiness = read(sourceDocs.whitelistReadiness);
  const evidence = read(sourceDocs.evidence);
  const binding = read(sourceDocs.binding);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);
  const methodSemanticGap = read(methodSemanticGapPath);

  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(stopGo, /Continue proof-backed pre-implementation audit: GO/);

  assert.match(priority, /optimization priority candidates: 12/);
  assert.match(priority, /implementation-ready candidates: 0/);
  assert.match(p0Gate, /P0 rows with unified work decision authority: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(whitelistReadiness, /implementation-ready whitelist optimization rows: 0/);
  assert.match(evidence, /implementation-ready evidence packets: 0/);
  assert.match(binding, /implementation-ready bindings: 0/);
  assert.match(metricSchema, /committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
  assert.match(methodSemanticGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodSemanticGap, /repo-wide lexical callables: 5830/);
  assert.match(methodSemanticGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodSemanticGap, /lexical callables requiring semantic proof before behavior changes: 5830/);
});

test('current source anchors still show implementation readiness risks before a first optimization patch', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const background = read('js/background.js');
  const build = read('build.js');

  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('new Response(JSON.stringify(processed)'));
  assert.ok(seed.includes('proto.addEventListener = function (type, listener, options)'));

  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));
  assert.ok(contentBridge.includes("element.classList.add('filtertube-hidden')"));
  assert.ok(domFallback.includes("document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')"));
  assert.ok(!blockChannel.includes('quickBlockPeriodicTimer = window.setInterval(() => {'));
  assert.ok(blockChannel.includes("document.addEventListener('yt-navigate-finish'"));
  assert.ok(background.includes("const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS)"));
  assert.ok(build.includes('draft: false'));
});

test('first optimization implementation readiness authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization implementation readiness gate is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    ...Object.values(sourceDocs).map(read)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization implementation readiness gate addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
