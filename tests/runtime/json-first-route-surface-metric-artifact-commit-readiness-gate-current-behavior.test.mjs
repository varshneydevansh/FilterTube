import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-artifact-commit-readiness-gate-current-behavior.test.mjs';
const metricArtifactRoot = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/';
const foundationMetricSamplePath = 'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricPathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
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
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-JSON-METRIC-COMMIT-READY-00-root-boundary',
  'FT-JSON-METRIC-COMMIT-READY-01-reserved-path-set',
  'FT-JSON-METRIC-COMMIT-READY-02-approval-boundary',
  'FT-JSON-METRIC-COMMIT-READY-03-schema-source-owner',
  'FT-JSON-METRIC-COMMIT-READY-04-artifact-absence',
  'FT-JSON-METRIC-COMMIT-READY-05-collector-insertion',
  'FT-JSON-METRIC-COMMIT-READY-06-no-work-side-effect',
  'FT-JSON-METRIC-COMMIT-READY-07-fixture-provenance',
  'FT-JSON-METRIC-COMMIT-READY-08-json-whitelist-rollout',
  'FT-JSON-METRIC-COMMIT-READY-09-ledger-runtime-results'
];

const reservedArtifactPaths = [
  metricArtifactRoot,
  `${metricArtifactRoot}metric-sample.json`,
  `${metricArtifactRoot}no-work-budget.json`,
  `${metricArtifactRoot}side-effect-budget.json`,
  `${metricArtifactRoot}fixture-provenance.json`,
  `${metricArtifactRoot}verification-output.tap`,
  foundationMetricSamplePath
];

const requiredFields = [
  'metricArtifactRoot',
  'metricArtifactRootExists',
  'artifactRootCommitDecision',
  'artifactRootOwner',
  'auditDirectoryBoundary',
  'reservedMetricArtifactPaths',
  'reservedMetricArtifactCount',
  'foundationMetricSamplePath',
  'pathBoundaryDoc',
  'pathBoundaryTest',
  'reservedPathApprovalStatus',
  'metricArtifactApprovalDoc',
  'metricArtifactApprovalRows',
  'routeSurfaceMetricObligations',
  'fixtureApprovalStatus',
  'implementationApprovalStatus',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'metricSchemaDoc',
  'metricSchemaRows',
  'sourceOwnerDoc',
  'sourceOwnerRows',
  'sourceOwnerApprovalStatus',
  'committedMetricArtifactFiles',
  'committedFoundationMetricSampleFiles',
  'artifactAbsenceCommand',
  'artifactAbsenceResult',
  'verificationOutputAbsent',
  'collectorInsertionDoc',
  'collectorInsertionRows',
  'collectorInsertionApprovalStatus',
  'teardownProofStatus',
  'passiveReadStatus',
  'noWorkDoc',
  'noWorkRows',
  'sideEffectDoc',
  'sideEffectRows',
  'disabledProof',
  'emptyListProof',
  'sideEffectBudgetProof',
  'fixtureProvenanceDoc',
  'fixtureProvenanceRows',
  'rawCaptureBoundary',
  'reducedFixtureStatus',
  'releaseInputExclusion',
  'jsonFirstImplementationDoc',
  'routeSurfaceAuthorityDoc',
  'stopGoDoc',
  'jsonFirstApprovalStatus',
  'whitelistOptimizationStatus',
  'nativeReleasePublicClaimStatus',
  'runtimeResultsPath',
  'objectiveLedgerPath',
  'activeGoalAuditPath',
  'trackedFileIndexPath',
  'expectedTests',
  'expectedPass',
  'expectedFail'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricArtifactCommitReadinessGate',
  'jsonFirstRouteSurfaceMetricArtifactCommitReport',
  'jsonFirstRouteSurfaceMetricArtifactCommitApproval',
  'jsonFirstRouteSurfaceMetricArtifactCommitNoGoBoundary',
  'jsonFirstRouteSurfaceMetricArtifactRootCommitApproval',
  'jsonFirstRouteSurfaceMetricArtifactFilesCommitApproval',
  'jsonFirstRouteSurfaceMetricSampleCommitApproval',
  'jsonFirstRouteSurfaceMetricNoWorkCommitApproval',
  'jsonFirstRouteSurfaceMetricSideEffectCommitApproval',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceCommitApproval',
  'jsonFirstRouteSurfaceMetricVerificationCommitApproval',
  'routeSurfaceMetricArtifactCommitRuntimeAuthority'
];

const commitReadinessAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Cc]ommit [Rr]eadiness [Gg]ate [Aa]ddendum/;
const methodGapAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Cc]ommit [Rr]eadiness [Gg]ate [Aa]ddendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files\s+covered/;
const affectedCallableAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Cc]ommit [Rr]eadiness [Gg]ate [Aa]ddendum[\s\S]*affected\s+callable\s+semantic\s+proof/;

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

test('JSON-first route/surface metric artifact commit readiness gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric artifact\s+commit readiness gate/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface metric artifact root: docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\//);
  assert.match(doc, /Committed route\/surface metric artifact files: 0/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5720/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5720/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Runtime JSON-first implementation approval exists: no/);
  assert.match(doc, /Runtime whitelist optimization approval exists: no/);
  assert.match(doc, /Implementation-ready route\/surface metric artifact commit rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface metric artifact commit authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric artifact commit rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-COMMIT-READY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /JSON-first route\/surface metric artifact commit readiness rows: 10/);
  assert.match(doc, /reserved future metric artifact roots covered: 1/);
  assert.match(doc, /reserved future metric artifact files covered: 5/);
  assert.match(doc, /related first-optimization foundation sample paths covered: 1/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5720/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5720/);
  assert.match(doc, /metric artifact path boundary rows covered: 6/);
  assert.match(doc, /metric artifact approval boundary rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /JSON-first fixture approval rows covered: 12/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /JSON-first implementation authority rows covered: 13/);
  assert.match(doc, /metric artifact schema rows covered: 12/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /metric collector insertion rows covered: 12/);
  assert.match(doc, /metric collector no-work rows covered: 12/);
  assert.match(doc, /metric collector side-effect rows covered: 12/);
  assert.match(doc, /metric collector fixture provenance rows covered: 12/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed first-optimization foundation metric sample files: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /runtime whitelist optimization approvals: 0/);
  assert.match(doc, /implementation-ready route\/surface metric artifact commit rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing required field ${field}`);
  }
});

test('JSON-first route/surface metric artifact commit set is named but absent', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }
});

test('JSON-first route/surface metric artifact commit readiness is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.metricPathBoundary);
  const metricApproval = read(sourceDocs.metricApproval);
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

  assert.match(pathBoundary, /committed route\/surface metric artifact files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(metricApproval, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(metricApproval, /implementation-ready route\/surface metric artifact approval rows: 0/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /runtime route\/surface metric artifacts: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(metricSchema, /Runtime metric collectors implemented: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5720/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
});

test('JSON-first route/surface metric artifact commit decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'commit route/surface metric artifact root now: NO-GO',
    'commit route/surface metric artifact files now: NO-GO',
    'commit first-optimization foundation metric sample now: NO-GO',
    'persist route/surface metric verification-output.tap now: NO-GO',
    'use route/surface metric artifact as implementation authority now: NO-GO',
    'use route/surface metric artifact as collector approval now: NO-GO',
    'runtime route/surface metric artifact approval now: NO-GO',
    'runtime metric collector insertion now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'JSON-first runtime behavior patch now: NO-GO',
    'whitelist optimization patch now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'native sync patch now: NO-GO',
    'release package patch now: NO-GO',
    'public claim patch now: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('JSON-first route/surface metric artifact commit readiness gate is linked from ledgers and adjacent gates', () => {
  const { methodGap, ...sourceDocsRequiringBacklink } = sourceDocs;
  const linkedDocs = {
    ...sourceDocsRequiringBacklink,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, commitReadinessAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(sourceDocs.runtimeResults), /tests 4457/);
  assert.match(read(sourceDocs.runtimeResults), /pass 4457/);
  assert.match(read(sourceDocs.runtimeResults), methodGapAddendumPattern);
  assert.match(read(sourceDocs.runtimeResults), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.objectiveLedger), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.objectiveLedger), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.activeGoal), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.activeGoal), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.trackedIndex), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.trackedIndex), affectedCallableAddendumPattern);
});
