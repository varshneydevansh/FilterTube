import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-candidate-selection-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  readinessGate: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedSelectionRows = [
  'FT-FIRSTOPT-SELECT-00-metric-artifact-foundation',
  'FT-FIRSTOPT-SELECT-01-fetch-empty-disabled-pass-through',
  'FT-FIRSTOPT-SELECT-02-xhr-empty-disabled-pass-through',
  'FT-FIRSTOPT-SELECT-03-active-work-decision',
  'FT-FIRSTOPT-SELECT-04-harvest-mutation-split',
  'FT-FIRSTOPT-SELECT-05-whitelist-list-mode-policy',
  'FT-FIRSTOPT-SELECT-06-dom-lifecycle-and-pending',
  'FT-FIRSTOPT-SELECT-07-menu-quick-affordance',
  'FT-FIRSTOPT-SELECT-08-category-empty-values',
  'FT-FIRSTOPT-SELECT-09-native-release-rollout'
];

const firstOptimizationMethodGapDocs = [
  docPath,
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md'
];

const futureAuthorityTokens = [
  'firstOptimizationCandidateSelectionBoundary',
  'firstOptimizationSelectedCandidateReport',
  'firstOptimizationMetricArtifactFoundationWorkPacket',
  'firstOptimizationSelectedBindingDecision',
  'firstOptimizationRuntimeCandidateApproval',
  'firstOptimizationMetricArtifactRuntimeCollector',
  'firstOptimizationCandidateSelectionGoGate',
  'firstOptimizationCandidateSelectionNoGoBoundary',
  'jsonFirstFirstOptimizationCandidateAuthority',
  'jsonFirstMetricArtifactFoundationAuthority'
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

test('first optimization candidate selection boundary is audit-only and source-backed', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization candidate selection/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Selected audit work packet: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Selected runtime behavior patch: none/);
  assert.match(doc, /Selected implementation-ready optimization row: none/);
  assert.match(doc, /not completion proof for first optimization candidate selection/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }

  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5720/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5720/);

  for (const firstOptimizationDocPath of firstOptimizationMethodGapDocs) {
    const firstOptimizationDoc = read(firstOptimizationDocPath);
    assert.ok(firstOptimizationDoc.includes(methodGapPath), `${firstOptimizationDocPath} missing method gap source path`);
    assert.match(firstOptimizationDoc, /## Method Semantic Proof Gap Boundary/, `${firstOptimizationDocPath} missing method gap section`);
    assert.match(firstOptimizationDoc, /method semantic proof gap files covered: 69/, `${firstOptimizationDocPath} missing file count`);
    assert.match(firstOptimizationDoc, /method semantic proof gap lexical callables covered: 5720/, `${firstOptimizationDocPath} missing callable count`);
    assert.match(firstOptimizationDoc, /files with complete per-callable semantic proof: 0/, `${firstOptimizationDocPath} missing complete proof count`);
    assert.match(firstOptimizationDoc, /lexical callables requiring semantic proof before behavior changes: 5720/, `${firstOptimizationDocPath} missing required proof count`);
    assert.match(firstOptimizationDoc, /affected callable semantic proof: NO-GO/, `${firstOptimizationDocPath} missing affected callable NO-GO`);
    assert.match(firstOptimizationDoc, /runtime behavior changed: no/, `${firstOptimizationDocPath} missing runtime unchanged boundary`);
    assert.match(firstOptimizationDoc, /do not approve runtime\s+optimization/, `${firstOptimizationDocPath} missing audit-only approval warning`);
  }
});

test('first optimization candidate selection rows counts and decisions stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-FIRSTOPT-SELECT-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSelectionRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /first optimization candidate selection rows: 10/);
  assert.match(doc, /selected audit work packets: 1/);
  assert.match(doc, /selected runtime behavior patches: 0/);
  assert.match(doc, /implementation-ready selected candidate rows: 0/);
  assert.match(doc, /candidate-obligation bindings reviewed: 10/);
  assert.match(doc, /optimization candidates covered: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /evidence packet rows covered: 10/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('candidate selection boundary is backed by current first optimization gates', () => {
  const readinessGate = read(sourceDocs.readinessGate);
  const stopGo = read(sourceDocs.stopGo);
  const priority = read(sourceDocs.priority);
  const binding = read(sourceDocs.binding);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);

  assert.match(readinessGate, /runtime first optimization approvals: 0/);
  assert.match(readinessGate, /implementation-ready first optimization rows: 0/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(priority, /`FT-OPT-00-metric-artifact-gate` \| P0/);
  assert.match(priority, /implementation-ready candidates: 0/);
  assert.match(binding, /`FT-BIND-00-metric-artifact-foundation`/);
  assert.match(binding, /bindings with committed metric artifact: 0/);
  assert.match(evidence, /`FT-EVIDENCE-02-metric-artifact`/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
});

test('current source still exposes metric-foundation gaps before runtime optimization', () => {
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
  assert.ok(filterLogic.includes('const startTime = Date.now();'));
  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(contentBridge.includes("element.classList.add('filtertube-hidden')"));
  assert.ok(domFallback.includes('[data-filtertube-hidden], .filtertube-hidden'));
  assert.ok(!blockChannel.includes('quickBlockPeriodicTimer = window.setInterval(() => {'));
  assert.ok(blockChannel.includes("document.addEventListener('yt-navigate-finish'"));
  assert.ok(background.includes("const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS)"));
  assert.ok(build.includes('draft: false'));
});

test('first optimization candidate selection authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization candidate selection boundary is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization candidate selection boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
