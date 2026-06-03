import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs';
const parityReportPath = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/parity-report.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  provenanceArtifactContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRolloutContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-FIXTURE-PARITY-00-report-identity',
  'FT-JSON-FIXTURE-PARITY-01-artifact-binding',
  'FT-JSON-FIXTURE-PARITY-02-json-path-scope',
  'FT-JSON-FIXTURE-PARITY-03-dom-selector-scope',
  'FT-JSON-FIXTURE-PARITY-04-json-dom-diff',
  'FT-JSON-FIXTURE-PARITY-05-native-runtime',
  'FT-JSON-FIXTURE-PARITY-06-release-package',
  'FT-JSON-FIXTURE-PARITY-07-raw-capture-exclusion',
  'FT-JSON-FIXTURE-PARITY-08-public-claim-scope',
  'FT-JSON-FIXTURE-PARITY-09-diagnostic-performance',
  'FT-JSON-FIXTURE-PARITY-10-rollback-unclaimed',
  'FT-JSON-FIXTURE-PARITY-11-verification'
];

const requiredFields = [
  'parityReportVersion',
  'parityReportId',
  'packetId',
  'manifestId',
  'sampleId',
  'provenanceArtifactId',
  'auditOnlyStatus',
  'manifestPath',
  'fixtureSamplePath',
  'provenanceArtifactPath',
  'parityReportPath',
  'fixturePacketContractVersion',
  'routeSurfaceRowId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'jsonRoute',
  'endpointFamily',
  'jsonPathClass',
  'jsonPaths',
  'rendererClass',
  'nestedRendererPolicy',
  'jsonSupportedStatus',
  'domSurface',
  'domSelectorClass',
  'domSelectors',
  'selectedCurrentPolicy',
  'restoreProof',
  'playbackSafetyProof',
  'domSupportedStatus',
  'jsonFixturePath',
  'domFixturePath',
  'expectedHiddenVideoIds',
  'expectedVisibleVideoIds',
  'parityDiff',
  'falseHideLeakBudget',
  'nativeFixturePath',
  'generatedRuntimeHash',
  'sourceRevision',
  'appRevision',
  'intentionalDivergence',
  'nativeParityStatus',
  'releasePackageManifest',
  'packagePath',
  'sourcePath',
  'manifestReferenced',
  'webAccessible',
  'packageHash',
  'quarantineStatus',
  'rawCaptureExclusionManifest',
  'rawSourcePath',
  'ignored',
  'packageIncluded',
  'websiteReferenced',
  'nativeSyncSource',
  'releaseInputExcluded',
  'publicClaimScope',
  'platformScope',
  'claimSurface',
  'requiredArtifact',
  'requiredChecksum',
  'requiredStoreUrl',
  'lastVerifiedAt',
  'diagnosticPrivacy',
  'redactionPolicy',
  'metricSampleEnvelope',
  'elapsedWorkCounters',
  'consoleBudget',
  'publicPerformanceClaimForbidden',
  'rollbackScope',
  'rollbackCommand',
  'unclaimedSurfaces',
  'unmeasuredSurfaceExclusion',
  'rolloutProofStatus',
  'authorityBoundary',
  'verificationCommand',
  'verificationOutput',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureParityReportContract',
  'jsonFirstRouteSurfaceFixtureParityReportApproval',
  'jsonFirstRouteSurfaceFixtureParityReportNoGoBoundary',
  'jsonFirstRouteSurfaceFixtureParityReportRuntimeApproval',
  'jsonFirstRouteSurfaceFixtureParityReportMetricApproval',
  'jsonFirstRouteSurfaceFixtureParityReportPublicClaimApproval',
  'jsonFirstRouteSurfaceFixtureParityReportNativeSyncApproval',
  'jsonFirstRouteSurfaceFixtureParityReportReleaseApproval',
  'jsonFirstRouteSurfaceFixtureParityReportRawCaptureExclusion',
  'jsonFirstRouteSurfaceFixtureParityReportRuntimeAuthority'
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

test('JSON-first route/surface fixture parity report contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture parity\s+report contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface fixture parity report path: docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\/parity-report\.json/);
  assert.match(doc, /Committed route\/surface fixture parity report files: 0/);
  assert.match(doc, /Runtime JSON-first fixture parity report approval exists: no/);
  assert.match(doc, /Runtime JSON-first fixture packet approval exists: no/);
  assert.match(doc, /Implementation-ready JSON-first fixture parity report contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture parity report authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture parity report rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-PARITY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface fixture parity report contract rows: 12/);
  assert.match(doc, /reserved fixture parity report paths covered: 1/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /fixture sample contract rows covered: 12/);
  assert.match(doc, /provenance artifact contract rows covered: 12/);
  assert.match(doc, /aggregate fixture packet contract rows covered: 12/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /artifact contract coverage rows covered: 10/);
  assert.match(doc, /artifact path boundary rows covered: 6/);
  assert.match(doc, /artifact commit readiness rows covered: 10/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /fixture mode classes covered: 8/);
  assert.match(doc, /fixture evidence classes covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(doc, /committed route\/surface fixture parity report files: 0/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /runtime JSON-first fixture parity report approvals: 0/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first fixture parity report contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing parity report field ${field}`);
  }
});

test('JSON-first route/surface fixture parity report path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(parityReportPath));
  assert.equal(fs.existsSync(path.join(repoRoot, parityReportPath)), false, `${parityReportPath} should not exist yet`);
});

test('JSON-first route/surface fixture parity report contract is backed by current NO-GO gates', () => {
  const fixturePacketContract = read(sourceDocs.fixturePacketContract);
  const manifestContract = read(sourceDocs.manifestContract);
  const sampleContract = read(sourceDocs.sampleContract);
  const provenanceArtifactContract = read(sourceDocs.provenanceArtifactContract);
  const parityRolloutContract = read(sourceDocs.parityRolloutContract);
  const collectorParityRollout = read(sourceDocs.collectorParityRollout);
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
  assert.match(parityRolloutContract, /first optimization parity rollout contract rows: 12/);
  assert.match(parityRolloutContract, /Committed parity rollout files: 0/);
  assert.match(parityRolloutContract, /Implementation-ready parity rollout contract rows: 0/);
  assert.match(collectorParityRollout, /collector parity rollout rows: 12/);
  assert.match(collectorParityRollout, /runtime collector parity rollout proofs approved: 0/);
  assert.match(pathBoundary, /reserved future artifact files: 5/);
  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(contractCoverage, /per-file fixture artifact contract docs covered: 5/);
  assert.match(contractCoverage, /per-file fixture artifact contract tests covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface fixture artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5736/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture parity report decisions and authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface fixture parity report contract: GO',
    'commit route/surface fixture parity report artifact now: NO-GO',
    'commit route/surface fixture packet root now: NO-GO',
    'use route/surface fixture parity report as implementation authority now: NO-GO',
    'runtime JSON-first fixture parity report approval now: NO-GO',
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

test('JSON-first route/surface fixture parity report contract is linked from ledgers and adjacent gates', () => {
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
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture parity report contract addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture parity report contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture parity report contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture parity report contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/i);
});
