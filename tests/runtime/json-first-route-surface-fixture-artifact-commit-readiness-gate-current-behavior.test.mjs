import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-artifact-commit-readiness-gate-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const artifactRoot = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/';

const sourceDocs = {
  pathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenanceContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  bindingMatrix: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceEffect: 'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md'
};

const expectedRows = [
  'FT-JSON-FIXTURE-COMMIT-READY-00-root-boundary',
  'FT-JSON-FIXTURE-COMMIT-READY-01-reserved-path-set',
  'FT-JSON-FIXTURE-COMMIT-READY-02-packet-contract',
  'FT-JSON-FIXTURE-COMMIT-READY-03-artifact-absence',
  'FT-JSON-FIXTURE-COMMIT-READY-04-route-metric-approval',
  'FT-JSON-FIXTURE-COMMIT-READY-05-fixture-provenance',
  'FT-JSON-FIXTURE-COMMIT-READY-06-no-work-side-effect',
  'FT-JSON-FIXTURE-COMMIT-READY-07-parity-diagnostic',
  'FT-JSON-FIXTURE-COMMIT-READY-08-rollback-release-public',
  'FT-JSON-FIXTURE-COMMIT-READY-09-ledger-runtime-results'
];

const reservedArtifactPaths = [
  artifactRoot,
  `${artifactRoot}manifest.json`,
  `${artifactRoot}fixture-sample.json`,
  `${artifactRoot}provenance.json`,
  `${artifactRoot}parity-report.json`,
  `${artifactRoot}verification-output.tap`
];

const requiredFields = [
  'artifactRoot',
  'artifactRootExists',
  'artifactRootCommitDecision',
  'artifactRootOwner',
  'auditDirectoryBoundary',
  'reservedArtifactPaths',
  'reservedArtifactCount',
  'pathBoundaryDoc',
  'pathBoundaryTest',
  'reservedPathApprovalStatus',
  'fixturePacketContractDoc',
  'fixturePacketRows',
  'fixtureModeClasses',
  'fixtureEvidenceClasses',
  'fixturePacketApprovalStatus',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'committedFixturePacketFiles',
  'artifactAbsenceCommand',
  'artifactAbsenceResult',
  'artifactCommitGate',
  'verificationOutputAbsent',
  'routeSurfaceMetricApprovalStatus',
  'routeSurfaceMetricArtifactStatus',
  'obligationCoverage',
  'sampleEnvelopeStatus',
  'counterApprovalStatus',
  'fixtureProvenanceApprovalStatus',
  'sourceCaptureBoundary',
  'reducedFixtureStatus',
  'rawCaptureExclusion',
  'releaseInputExclusion',
  'noWorkApprovalStatus',
  'sideEffectBudgetApprovalStatus',
  'disabledProof',
  'emptyListProof',
  'sideEffectBudgetProof',
  'jsonDomParityStatus',
  'nativeParityStatus',
  'diagnosticPrivacyStatus',
  'commentContinuationStatus',
  'selectedCurrentStatus',
  'rollbackBoundaryStatus',
  'unclaimedSurfaceStatus',
  'nativeSyncStatus',
  'releaseClaimScope',
  'publicClaimGate',
  'runtimeResultsPath',
  'objectiveLedgerPath',
  'activeGoalAuditPath',
  'trackedFileIndexPath',
  'expectedTests',
  'expectedPass',
  'expectedFail'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureArtifactCommitReadinessGate',
  'jsonFirstRouteSurfaceFixtureArtifactCommitReport',
  'jsonFirstRouteSurfaceFixtureArtifactCommitApproval',
  'jsonFirstRouteSurfaceFixtureArtifactCommitNoGoBoundary',
  'jsonFirstRouteSurfaceFixtureRootCommitApproval',
  'jsonFirstRouteSurfaceFixtureFilesCommitApproval',
  'jsonFirstRouteSurfaceFixtureVerificationCommitApproval',
  'jsonFirstRouteSurfaceFixtureArtifactCollector',
  'jsonFirstRouteSurfaceFixtureArtifactRollbackApproval',
  'jsonFirstRouteSurfaceFixtureArtifactPublicClaimApproval'
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
    'build.js'
  ]
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

test('JSON-first route/surface fixture artifact commit readiness gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture artifact\s+commit readiness gate/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface fixture packet root: docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\//);
  assert.match(doc, /Committed route\/surface fixture packet files: 0/);
  assert.match(doc, /Runtime JSON-first fixture packet approval exists: no/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture artifact commit authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture artifact commit rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-COMMIT-READY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /JSON-first route\/surface fixture artifact commit readiness rows: 10/);
  assert.match(doc, /reserved future artifact roots covered: 1/);
  assert.match(doc, /reserved future artifact files covered: 5/);
  assert.match(doc, /fixture artifact path boundary rows covered: 6/);
  assert.match(doc, /fixture packet contract rows covered: 12/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /fixture mode classes covered: 8/);
  assert.match(doc, /fixture evidence classes covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing required field ${field}`);
  }
});

test('JSON-first route/surface fixture artifact commit set is named but absent', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }
});

test('JSON-first route/surface fixture artifact commit readiness is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.pathBoundary);
  const fixturePacketContract = read(sourceDocs.fixturePacketContract);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const collectorFixtureProvenance = read(sourceDocs.collectorFixtureProvenance);
  const fixtureProvenanceContract = read(sourceDocs.fixtureProvenanceContract);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface fixture artifact path rows: 0/);
  assert.match(fixturePacketContract, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(fixturePacketContract, /implementation-ready JSON-first fixture packet rows: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(jsonFirstImplementation, /implementation-ready JSON-first rows: 0/);
  assert.match(collectorFixtureProvenance, /runtime collector fixture packets approved: 0/);
  assert.match(fixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5736/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture artifact commit decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'commit route/surface fixture packet root now: NO-GO',
    'commit route/surface fixture packet files now: NO-GO',
    'persist route/surface fixture verification-output.tap now: NO-GO',
    'use route/surface fixture packet artifact as implementation authority now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'runtime JSON-first fixture packet approval now: NO-GO',
    'runtime route/surface metric artifact approval now: NO-GO',
    'runtime metric collector insertion now: NO-GO',
    'native sync patch now: NO-GO',
    'release package patch now: NO-GO',
    'public claim patch now: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('JSON-first route/surface fixture artifact commit readiness gate is linked from ledgers and adjacent gates', () => {
  const { methodGap, ...sourceDocsRequiringBacklink } = sourceDocs;
  const requiredLinkFiles = {
    ...sourceDocsRequiringBacklink,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('tests 4457'));
  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture artifact commit readiness gate addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture artifact commit readiness gate addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture artifact commit readiness gate addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture artifact commit readiness gate addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
});
