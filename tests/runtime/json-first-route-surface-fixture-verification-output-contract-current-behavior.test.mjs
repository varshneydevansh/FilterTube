import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs';
const verificationOutputPath = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/verification-output.tap';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  provenanceArtifactContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityReportContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  firstOptimizationVerificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  contractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  commitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-FIXTURE-VERIFY-00-run-identity',
  'FT-JSON-FIXTURE-VERIFY-01-artifact-binding',
  'FT-JSON-FIXTURE-VERIFY-02-command-contract',
  'FT-JSON-FIXTURE-VERIFY-03-runtime-counts',
  'FT-JSON-FIXTURE-VERIFY-04-tap-format',
  'FT-JSON-FIXTURE-VERIFY-05-artifact-absence-check',
  'FT-JSON-FIXTURE-VERIFY-06-authority-token-check',
  'FT-JSON-FIXTURE-VERIFY-07-adjacent-gate-chain',
  'FT-JSON-FIXTURE-VERIFY-08-route-surface-parity',
  'FT-JSON-FIXTURE-VERIFY-09-no-work-side-effect',
  'FT-JSON-FIXTURE-VERIFY-10-rollback-unclaimed-public',
  'FT-JSON-FIXTURE-VERIFY-11-persistence-gate'
];

const requiredFields = [
  'verificationVersion',
  'verificationRunId',
  'packetId',
  'manifestId',
  'sampleId',
  'provenanceArtifactId',
  'parityReportId',
  'auditOnlyStatus',
  'artifactRoot',
  'manifestPath',
  'fixtureSamplePath',
  'provenanceArtifactPath',
  'parityReportPath',
  'verificationOutputPath',
  'routeSurfaceRowId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'verificationCommand',
  'workingDirectory',
  'nodeVersion',
  'packageScript',
  'commandExitCode',
  'commandStartedAt',
  'commandFinishedAt',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'actualTests',
  'actualPass',
  'actualFail',
  'durationMs',
  'runtimeResultsPath',
  'tapVersion',
  'tapPath',
  'notOkCount',
  'todoCount',
  'skipCount',
  'cancelledCount',
  'failureExcerptPolicy',
  'reservedArtifactPaths',
  'committedFixturePacketFiles',
  'artifactAbsenceCommand',
  'artifactAbsenceResult',
  'verificationOutputAbsent',
  'artifactRootAbsent',
  'authorityTokenAbsenceCheck',
  'scopedProductSourceRoots',
  'futureAuthorityTokens',
  'runtimeTokenMatches',
  'documentationTokenMatches',
  'authorityApprovalStatus',
  'adjacentCommand',
  'adjacentExpectedTests',
  'adjacentExpectedPass',
  'adjacentExpectedFail',
  'gateDocsCovered',
  'gateTestsCovered',
  'jsonRouteScope',
  'domSelectorScope',
  'nativeSyncStatus',
  'releasePackageStatus',
  'rawCaptureExclusionStatus',
  'jsonDomParityStatus',
  'nativeParityStatus',
  'disabledSettingsProof',
  'emptyListProof',
  'sideEffectBudgetProof',
  'restoreProof',
  'playbackSafetyProof',
  'falseHideLeakBudget',
  'performanceBudget',
  'rollbackBoundary',
  'rollbackCommand',
  'unclaimedSurfaces',
  'diagnosticPrivacyStatus',
  'publicClaimStatus',
  'performanceClaimScope',
  'releaseClaimGate',
  'verificationOutputPersistencePolicy',
  'tapRetentionPolicy',
  'artifactCommitGate',
  'fixturePacketApprovalGate',
  'metricApprovalGate',
  'collectorApprovalGate',
  'optimizationApprovalGate'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureVerificationOutputContract',
  'jsonFirstRouteSurfaceFixtureVerificationOutputApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputNoGoBoundary',
  'jsonFirstRouteSurfaceFixtureVerificationOutputRuntimeApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputMetricApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputPublicClaimApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputNativeSyncApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputReleaseApproval',
  'jsonFirstRouteSurfaceFixtureVerificationOutputPersistence',
  'jsonFirstRouteSurfaceFixtureVerificationOutputRuntimeAuthority'
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

test('JSON-first route/surface fixture verification output contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture\s+verification output contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface fixture verification output path: docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\/verification-output\.tap/);
  assert.match(doc, /Committed route\/surface fixture verification output files: 0/);
  assert.match(doc, /Runtime JSON-first fixture verification output approval exists: no/);
  assert.match(doc, /Runtime JSON-first fixture packet approval exists: no/);
  assert.match(doc, /Implementation-ready JSON-first fixture verification output contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture verification output authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture verification output rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-VERIFY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface fixture verification output contract rows: 12/);
  assert.match(doc, /reserved fixture verification output paths covered: 1/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /fixture sample contract rows covered: 12/);
  assert.match(doc, /provenance artifact contract rows covered: 12/);
  assert.match(doc, /parity report contract rows covered: 12/);
  assert.match(doc, /aggregate fixture packet contract rows covered: 12/);
  assert.match(doc, /first optimization verification output rows covered: 12/);
  assert.match(doc, /artifact contract coverage rows covered: 10/);
  assert.match(doc, /artifact path boundary rows covered: 6/);
  assert.match(doc, /artifact commit readiness rows covered: 10/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /fixture mode classes covered: 8/);
  assert.match(doc, /fixture evidence classes covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5701/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5701/);
  assert.match(doc, /committed route\/surface fixture verification output files: 0/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /runtime JSON-first fixture verification output approvals: 0/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first fixture verification output contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing verification output field ${field}`);
  }
});

test('JSON-first route/surface fixture verification output path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(verificationOutputPath));
  assert.equal(fs.existsSync(path.join(repoRoot, verificationOutputPath)), false, `${verificationOutputPath} should not exist yet`);
});

test('JSON-first route/surface fixture verification output contract is backed by current NO-GO gates', () => {
  const fixturePacketContract = read(sourceDocs.fixturePacketContract);
  const manifestContract = read(sourceDocs.manifestContract);
  const sampleContract = read(sourceDocs.sampleContract);
  const provenanceArtifactContract = read(sourceDocs.provenanceArtifactContract);
  const parityReportContract = read(sourceDocs.parityReportContract);
  const firstOptimizationVerificationOutput = read(sourceDocs.firstOptimizationVerificationOutput);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const contractCoverage = read(sourceDocs.contractCoverage);
  const commitReadiness = read(sourceDocs.commitReadiness);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(fixturePacketContract, /fixture evidence classes required: 14/);
  assert.match(fixturePacketContract, /implementation-ready JSON-first fixture packet rows: 0/);
  assert.match(manifestContract, /Implementation-ready JSON-first fixture manifest contract rows: 0/);
  assert.match(sampleContract, /Implementation-ready JSON-first fixture sample contract rows: 0/);
  assert.match(provenanceArtifactContract, /Implementation-ready JSON-first fixture provenance artifact contract rows: 0/);
  assert.match(parityReportContract, /Implementation-ready JSON-first fixture parity report contract rows: 0/);
  assert.match(firstOptimizationVerificationOutput, /Committed verification output files: 0/);
  assert.match(firstOptimizationVerificationOutput, /Implementation-ready verification output contract rows: 0/);
  assert.match(pathBoundary, /reserved future artifact files: 5/);
  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(contractCoverage, /per-file fixture artifact contract docs covered: 5/);
  assert.match(contractCoverage, /per-file fixture artifact contract tests covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface fixture artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5701/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture verification output decisions and authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface fixture verification output contract: GO',
    'commit route/surface fixture verification-output.tap now: NO-GO',
    'commit route/surface fixture packet root now: NO-GO',
    'use route/surface fixture verification output as implementation authority now: NO-GO',
    'runtime JSON-first fixture verification output approval now: NO-GO',
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

test('JSON-first route/surface fixture verification output contract is linked from ledgers and adjacent gates', () => {
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
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture verification output contract addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture verification output contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture verification output contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture verification output contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
});
