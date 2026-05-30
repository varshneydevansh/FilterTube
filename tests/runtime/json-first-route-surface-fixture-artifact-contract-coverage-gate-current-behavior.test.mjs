import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs';
const artifactRoot = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  pathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  provenanceArtifactContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityReportContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutputContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  commitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-00-root-boundary',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-01-manifest-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-02-fixture-sample-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-03-provenance-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-04-parity-report-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-05-verification-output-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-06-aggregate-packet-contract',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-07-artifact-path-boundary',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-08-commit-readiness-gate',
  'FT-JSON-FIXTURE-CONTRACT-COVERAGE-09-ledger-runtime-results'
];

const reservedArtifactPaths = [
  artifactRoot,
  `${artifactRoot}manifest.json`,
  `${artifactRoot}fixture-sample.json`,
  `${artifactRoot}provenance.json`,
  `${artifactRoot}parity-report.json`,
  `${artifactRoot}verification-output.tap`
];

const perFileContracts = [
  {
    artifact: `${artifactRoot}manifest.json`,
    doc: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs',
    exists: true
  },
  {
    artifact: `${artifactRoot}fixture-sample.json`,
    doc: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs',
    exists: true
  },
  {
    artifact: `${artifactRoot}provenance.json`,
    doc: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs',
    exists: true
  },
  {
    artifact: `${artifactRoot}parity-report.json`,
    doc: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs',
    exists: true
  },
  {
    artifact: `${artifactRoot}verification-output.tap`,
    doc: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs',
    exists: true
  }
];

const requiredFields = [
  'artifactRoot',
  'artifactRootExists',
  'artifactRootCommitDecision',
  'auditDirectoryBoundary',
  'pathBoundaryDoc',
  'pathBoundaryTest',
  'manifestArtifactPath',
  'aggregatePacketContractDoc',
  'manifestContractDoc',
  'manifestContractTest',
  'manifestContractStatus',
  'fixtureSampleArtifactPath',
  'fixtureSampleContractDoc',
  'fixtureSampleContractTest',
  'provenanceArtifactPath',
  'fixtureProvenanceSourceDoc',
  'provenanceArtifactContractDoc',
  'provenanceArtifactContractTest',
  'parityReportArtifactPath',
  'parityReportContractDoc',
  'parityReportContractTest',
  'verificationOutputArtifactPath',
  'artifactPathBoundaryDoc',
  'verificationOutputContractDoc',
  'verificationOutputContractTest',
  'fixturePacketContractDoc',
  'fixturePacketContractTest',
  'fixturePacketRows',
  'fixtureModeClasses',
  'fixtureEvidenceClasses',
  'fixturePacketApprovalStatus',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'pathBoundaryRows',
  'reservedArtifactPaths',
  'committedFixturePacketFiles',
  'artifactAbsenceCheck',
  'pathApprovalStatus',
  'commitReadinessDoc',
  'commitReadinessTest',
  'commitReadinessRows',
  'artifactCommitApprovalStatus',
  'metricApprovalStatus',
  'collectorApprovalStatus',
  'runtimeResultsPath',
  'objectiveLedgerPath',
  'activeGoalAuditPath',
  'trackedFileIndexPath',
  'expectedTests',
  'expectedPass',
  'expectedFail'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureArtifactContractCoverageGate',
  'jsonFirstRouteSurfaceFixtureArtifactContractCoverageReport',
  'jsonFirstRouteSurfaceFixtureArtifactContractCoverageApproval',
  'jsonFirstRouteSurfaceFixtureArtifactContractCoverageNoGo',
  'jsonFirstRouteSurfaceFixtureManifestContract',
  'jsonFirstRouteSurfaceFixtureSampleContract',
  'jsonFirstRouteSurfaceFixtureProvenanceContract',
  'jsonFirstRouteSurfaceFixtureParityContract',
  'jsonFirstRouteSurfaceFixtureVerificationContract',
  'jsonFirstRouteSurfaceFixtureArtifactContractCollector',
  'jsonFirstRouteSurfaceFixtureArtifactContractRuntimeApproval',
  'jsonFirstRouteSurfaceFixtureArtifactContractPublicClaimApproval'
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

test('JSON-first route/surface fixture artifact contract coverage gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture artifact\s+contract coverage gate/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface fixture packet root: docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\//);
  assert.match(doc, /Aggregate fixture packet contract docs covered: 1/);
  assert.match(doc, /Per-file fixture artifact contract docs covered: 5/);
  assert.match(doc, /Per-file fixture artifact contract tests covered: 5/);
  assert.match(doc, /Committed route\/surface fixture packet files: 0/);
  assert.match(doc, /Runtime JSON-first fixture packet approval exists: no/);
  assert.match(doc, /Implementation-ready route\/surface fixture artifact contract coverage rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture artifact contract authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
  assert.ok(doc.includes(runtimeTestPath), 'missing runtime test self-reference');
});

test('JSON-first route/surface fixture artifact contract coverage rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-CONTRACT-COVERAGE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /JSON-first route\/surface fixture artifact contract coverage rows: 10/);
  assert.match(doc, /reserved future artifact roots covered: 1/);
  assert.match(doc, /reserved future artifact files covered: 5/);
  assert.match(doc, /aggregate fixture packet contract docs covered: 1/);
  assert.match(doc, /aggregate fixture packet contract tests covered: 1/);
  assert.match(doc, /coverage gate docs covered: 1/);
  assert.match(doc, /coverage gate tests covered: 1/);
  assert.match(doc, /per-file fixture artifact contract docs covered: 5/);
  assert.match(doc, /per-file fixture artifact contract tests covered: 5/);
  assert.match(doc, /preserve the complete per-file contract set/);
  assert.equal(doc.includes('finish the remaining per-file contracts'), false);
  assert.equal(doc.includes('contract coverage remains incomplete'), false);
  assert.match(doc, /fixture artifact path boundary rows covered: 6/);
  assert.match(doc, /fixture artifact commit readiness rows covered: 10/);
  assert.match(doc, /fixture packet contract rows covered: 12/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 63/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5469/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5469/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready route\/surface fixture artifact contract coverage rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing required field ${field}`);
  }
});

test('reserved route/surface fixture artifacts and per-file artifact contracts remain absent', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }

  for (const contract of perFileContracts) {
    assert.ok(doc.includes(contract.artifact), `missing per-file artifact ${contract.artifact}`);
    assert.ok(doc.includes(contract.doc), `missing future per-file contract doc ${contract.doc}`);
    assert.ok(doc.includes(contract.test), `missing future per-file contract test ${contract.test}`);
    assert.equal(fs.existsSync(path.join(repoRoot, contract.doc)), contract.exists, `${contract.doc} existence mismatch`);
    assert.equal(fs.existsSync(path.join(repoRoot, contract.test)), contract.exists, `${contract.test} existence mismatch`);
  }
});

test('JSON-first route/surface fixture artifact contract coverage is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.pathBoundary);
  const fixturePacketContract = read(sourceDocs.fixturePacketContract);
  const manifestContract = read(sourceDocs.manifestContract);
  const sampleContract = read(sourceDocs.sampleContract);
  const provenanceArtifactContract = read(sourceDocs.provenanceArtifactContract);
  const parityReportContract = read(sourceDocs.parityReportContract);
  const verificationOutputContract = read(sourceDocs.verificationOutputContract);
  const commitReadiness = read(sourceDocs.commitReadiness);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const collectorFixtureProvenance = read(sourceDocs.collectorFixtureProvenance);
  const fixtureProvenanceContract = read(sourceDocs.fixtureProvenanceContract);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(pathBoundary, /reserved future artifact files: 5/);
  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface fixture artifact path rows: 0/);
  assert.match(fixturePacketContract, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(fixturePacketContract, /implementation-ready JSON-first fixture packet rows: 0/);
  assert.match(manifestContract, /Committed route\/surface fixture manifest files: 0/);
  assert.match(manifestContract, /Implementation-ready JSON-first fixture manifest contract rows: 0/);
  assert.match(sampleContract, /Committed route\/surface fixture sample files: 0/);
  assert.match(sampleContract, /Implementation-ready JSON-first fixture sample contract rows: 0/);
  assert.match(provenanceArtifactContract, /Committed route\/surface fixture provenance artifact files: 0/);
  assert.match(provenanceArtifactContract, /Implementation-ready JSON-first fixture provenance artifact contract rows: 0/);
  assert.match(parityReportContract, /Committed route\/surface fixture parity report files: 0/);
  assert.match(parityReportContract, /Implementation-ready JSON-first fixture parity report contract rows: 0/);
  assert.match(verificationOutputContract, /Committed route\/surface fixture verification output files: 0/);
  assert.match(verificationOutputContract, /Implementation-ready JSON-first fixture verification output contract rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(commitReadiness, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(jsonFirstImplementation, /implementation-ready JSON-first rows: 0/);
  assert.match(collectorFixtureProvenance, /runtime collector fixture packets approved: 0/);
  assert.match(fixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 63/);
  assert.match(methodGap, /files with lexical accounting: 63/);
  assert.match(methodGap, /repo-wide lexical callables: 5469/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture artifact contract decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface fixture artifact contract coverage gate: GO',
    'treat aggregate fixture packet contract as all per-file artifact contracts now: NO-GO',
    'commit route/surface fixture packet root now: NO-GO',
    'commit route/surface fixture packet files now: NO-GO',
    'persist route/surface fixture verification-output.tap now: NO-GO',
    'use route/surface fixture artifact contracts as implementation authority now: NO-GO',
    'runtime JSON-first fixture packet approval now: NO-GO',
    'runtime route/surface metric artifact approval now: NO-GO',
    'runtime metric collector insertion now: NO-GO',
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
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('JSON-first route/surface fixture artifact contract coverage gate is linked from ledgers and adjacent gates', () => {
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
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture artifact contract coverage gate addendum:[\s\S]*63\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture artifact contract coverage gate addendum[\s\S]*63\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture artifact contract coverage gate addendum[\s\S]*63\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture artifact contract coverage gate addendum[\s\S]*63\s+method\s+semantic\s+proof\s+gap\s+files covered/);
});
