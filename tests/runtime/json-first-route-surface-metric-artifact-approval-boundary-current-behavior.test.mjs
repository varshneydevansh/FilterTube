import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-artifact-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const metricArtifactRoot = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/';

const sourceDocs = {
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  fixturePacket: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedRows = [
  'FT-JSON-METRIC-APPROVAL-00-binding-scope',
  'FT-JSON-METRIC-APPROVAL-01-obligation-coverage',
  'FT-JSON-METRIC-APPROVAL-02-fixture-preconditions',
  'FT-JSON-METRIC-APPROVAL-03-artifact-schema',
  'FT-JSON-METRIC-APPROVAL-04-source-owner-production',
  'FT-JSON-METRIC-APPROVAL-05-collector-insertion',
  'FT-JSON-METRIC-APPROVAL-06-no-work-proof',
  'FT-JSON-METRIC-APPROVAL-07-side-effect-budget',
  'FT-JSON-METRIC-APPROVAL-08-fixture-provenance',
  'FT-JSON-METRIC-APPROVAL-09-diagnostic-performance',
  'FT-JSON-METRIC-APPROVAL-10-json-whitelist-authority',
  'FT-JSON-METRIC-APPROVAL-11-ledger-runtime-results'
];

const reservedArtifactPaths = [
  metricArtifactRoot,
  `${metricArtifactRoot}metric-sample.json`,
  `${metricArtifactRoot}no-work-budget.json`,
  `${metricArtifactRoot}side-effect-budget.json`,
  `${metricArtifactRoot}fixture-provenance.json`,
  `${metricArtifactRoot}verification-output.tap`,
  'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricArtifactApprovalBoundary',
  'jsonFirstRouteSurfaceMetricArtifactApprovalReport',
  'jsonFirstRouteSurfaceMetricArtifactApprovalPacket',
  'jsonFirstRouteSurfaceMetricArtifactApprovalStatus',
  'jsonFirstRouteSurfaceMetricArtifactRuntimeApproval',
  'jsonFirstRouteSurfaceMetricArtifactCollectorApproval',
  'jsonFirstRouteSurfaceMetricArtifactSchemaApproval',
  'jsonFirstRouteSurfaceMetricSourceOwnerApproval',
  'jsonFirstRouteSurfaceMetricNoWorkApproval',
  'jsonFirstRouteSurfaceMetricSideEffectApproval',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceApproval',
  'jsonFirstRouteSurfaceMetricDiagnosticApproval',
  'jsonFirstRouteSurfaceMetricJsonFirstGoGate',
  'jsonFirstRouteSurfaceMetricWhitelistGoGate',
  'jsonFirstRouteSurfaceMetricApprovalNoGoBoundary',
  'runtimeRouteSurfaceMetricArtifactApproval',
  'runtimeJsonFirstMetricArtifactApproval',
  'routeSurfaceMetricArtifactApprovalRuntimeAuthority'
];

const approvalAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Aa]pproval [Bb]oundary [Aa]ddendum/;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  return [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    ...walk('src'),
    ...walk('css'),
    ...walk('assets'),
    'build.js',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json'
  ]
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

test('JSON-first route/surface metric artifact approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric artifact\s+approval boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /This is approval absence proof/);
  assert.match(doc, /JSON-first route\/surface metric artifact approval boundary rows: 12/);
  assert.match(doc, /Runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /Runtime whitelist optimization approvals: 0/);
  assert.match(doc, /not completion proof for route\/surface metric artifact approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric artifact approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /JSON-first fixture approval rows covered: 12/);
  assert.match(doc, /JSON-first route\/surface authority rows covered: 12/);
  assert.match(doc, /JSON-first implementation authority rows covered: 13/);
  assert.match(doc, /metric artifact schema rows covered: 12/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /metric collector insertion rows covered: 12/);
  assert.match(doc, /metric collector no-work rows covered: 12/);
  assert.match(doc, /metric collector side-effect rows covered: 12/);
  assert.match(doc, /metric collector fixture provenance rows covered: 12/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5701/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5701/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /runtime whitelist optimization approvals: 0/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed JSON-first fixture packet files: 0/);
  assert.match(doc, /implementation-ready route\/surface metric artifact approval rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
});

test('JSON-first route/surface metric artifact approval is backed by current NO-GO gates', () => {
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const fixtureApproval = read(sourceDocs.fixtureApproval);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const stopGo = read(sourceDocs.stopGo);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /runtime route\/surface metric artifacts: 0/);
  assert.match(routeSurfaceAuthority, /runtime JSON-first implementation approvals: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(metricSchema, /Runtime metric collectors implemented: 0/);
  assert.match(metricSchema, /Implementation-ready metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5701/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
});

test('JSON-first route/surface metric artifact files remain absent and unapproved', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }

  for (const decision of [
    'JSON-first route/surface metric artifact approval boundary documented: GO',
    'runtime route/surface metric artifact approval now: NO-GO',
    'runtime JSON-first metric artifact approval now: NO-GO',
    'runtime metric collector approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'JSON-first runtime implementation approval now: NO-GO',
    'whitelist optimization approval now: NO-GO',
    'commit route/surface metric artifact root now: NO-GO',
    'commit JSON-first fixture packet root now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }
});

test('JSON-first route/surface metric artifact approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('JSON-first route/surface metric artifact approval boundary is linked from ledgers and adjacent gates', () => {
  const linkedDocs = {
    routeSurfaceMetric: sourceDocs.routeSurfaceMetric,
    fixtureApproval: sourceDocs.fixtureApproval,
    routeSurfaceAuthority: sourceDocs.routeSurfaceAuthority,
    jsonFirstImplementation: sourceDocs.jsonFirstImplementation,
    metricSchema: sourceDocs.metricSchema,
    sourceOwner: sourceDocs.sourceOwner,
    collectorInsertion: sourceDocs.collectorInsertion,
    collectorNoWork: sourceDocs.collectorNoWork,
    collectorSideEffect: sourceDocs.collectorSideEffect,
    collectorFixture: sourceDocs.collectorFixture,
    implementationReadiness: sourceDocs.implementationReadiness,
    stopGo: sourceDocs.stopGo,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, approvalAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(ledgerDocs.runtimeResults), /tests 4457/);
  assert.match(read(ledgerDocs.runtimeResults), /pass 4457/);
  assert.match(read(ledgerDocs.runtimeResults), /JSON-first route\/surface metric artifact approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-First Route\/Surface Metric Artifact Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /JSON-First Route\/Surface Metric Artifact Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-First Route\/Surface Metric Artifact Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
