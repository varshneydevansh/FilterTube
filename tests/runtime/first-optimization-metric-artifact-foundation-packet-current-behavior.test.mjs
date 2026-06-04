import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-artifact-foundation-packet-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  selection: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  readinessGate: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticLogging: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedPacketRows = [
  'FT-ARTIFACTPKT-00-work-packet-identity',
  'FT-ARTIFACTPKT-01-route-surface-mode-scope',
  'FT-ARTIFACTPKT-02-sample-environment',
  'FT-ARTIFACTPKT-03-transport-json-body-work',
  'FT-ARTIFACTPKT-04-filter-engine-work',
  'FT-ARTIFACTPKT-05-dom-lifecycle-work',
  'FT-ARTIFACTPKT-06-network-resolver-work',
  'FT-ARTIFACTPKT-07-storage-mutation-work',
  'FT-ARTIFACTPKT-08-hide-restore-visual-work',
  'FT-ARTIFACTPKT-09-whitelist-identity-policy',
  'FT-ARTIFACTPKT-10-diagnostic-privacy',
  'FT-ARTIFACTPKT-11-parity-rollout-provenance'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricArtifactFoundationPacket',
  'firstOptimizationMetricArtifactFoundationReport',
  'firstOptimizationFoundationArtifactPath',
  'firstOptimizationFoundationCollectorApproval',
  'firstOptimizationFoundationPacketGoGate',
  'firstOptimizationFoundationPacketNoGoBoundary',
  'jsonFirstMetricArtifactFoundationPacket',
  'jsonFirstFoundationMetricArtifactReport',
  'metricArtifactFoundationRuntimeCollector',
  'metricArtifactFoundationVerificationCommand'
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

test('first optimization metric artifact foundation packet is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization metric artifact/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /Selected foundation binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Required foundation metric artifact packet exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready foundation packet rows: 0/);
  assert.match(doc, /not completion proof for metric artifact foundation packet/);
  assert.match(doc, /repo-wide method semantic proof gap is open/);
  assert.match(doc, /affected callable has semantic\s+proof for owner, trigger, inputs, route\/surface, side effects, no-work behavior/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('metric artifact foundation packet rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-ARTIFACTPKT-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedPacketRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /first optimization metric artifact foundation packet rows: 12/);
  assert.match(doc, /selected foundation binding rows covered: 1/);
  assert.match(doc, /candidate selection rows covered: 10/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /diagnostic logging policy rows covered: 8/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /required foundation metric artifact packet exists: no/);
  assert.match(doc, /committed foundation metric artifacts: 0/);
  assert.match(doc, /runtime metric collectors approved: 0/);
  assert.match(doc, /implementation-ready foundation packet rows: 0/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('metric artifact foundation packet is backed by current first optimization gates', () => {
  const selection = read(sourceDocs.selection);
  const readinessGate = read(sourceDocs.readinessGate);
  const binding = read(sourceDocs.binding);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const diagnosticLogging = read(sourceDocs.diagnosticLogging);
  const methodGap = read(methodGapPath);

  assert.match(selection, /Selected audit work packet: FT-BIND-00-metric-artifact-foundation/);
  assert.match(selection, /selected runtime behavior patches: 0/);
  assert.match(readinessGate, /runtime first optimization approvals: 0/);
  assert.match(binding, /`FT-BIND-00-metric-artifact-foundation`/);
  assert.match(binding, /bindings with committed metric artifact: 0/);
  assert.match(metricSchema, /metric artifact schema rows: 12/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(diagnosticLogging, /active console callsites: 419/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5830/);
});

test('current source anchors still show packet field owners before collector approval', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const background = read('js/background.js');
  const ioManager = read('js/io_manager.js');
  const build = read('build.js');

  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('new Response(JSON.stringify(processed)'));
  assert.ok(seed.includes('proto.addEventListener = function (type, listener, options)'));
  assert.ok(filterLogic.includes('const startTime = Date.now();'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));
  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(contentBridge.includes("element.classList.add('filtertube-hidden')"));
  assert.ok(domFallback.includes("document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden"));
  assert.ok(!blockChannel.includes('quickBlockPeriodicTimer = window.setInterval(() => {'));
  assert.ok(blockChannel.includes("document.addEventListener('yt-navigate-finish'"));
  assert.ok(background.includes("const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS)"));
  assert.ok(ioManager.includes('chrome.storage.local.set'));
  assert.ok(build.includes('draft: false'));
  assert.match(read(docPath), /affected callable ids, artifact path, schema version, semantic proof status, and command/);
});

test('metric artifact foundation packet authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('metric artifact foundation packet is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization metric artifact foundation packet addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(activeGoal, /First optimization metric artifact foundation packet addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization metric artifact foundation packet addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization metric artifact foundation packet addendum:[\s\S]*69 method semantic proof gap files covered/);
});
