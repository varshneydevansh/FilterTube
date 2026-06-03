import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs';
const manifestPath = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/manifest.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  contractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  commitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-FIXTURE-MANIFEST-00-packet-identity',
  'FT-JSON-FIXTURE-MANIFEST-01-route-surface-binding',
  'FT-JSON-FIXTURE-MANIFEST-02-obligation-candidate-binding',
  'FT-JSON-FIXTURE-MANIFEST-03-endpoint-profile-mode',
  'FT-JSON-FIXTURE-MANIFEST-04-artifact-path-set',
  'FT-JSON-FIXTURE-MANIFEST-05-source-capture-provenance',
  'FT-JSON-FIXTURE-MANIFEST-06-fixture-evidence-index',
  'FT-JSON-FIXTURE-MANIFEST-07-json-dom-native-parity',
  'FT-JSON-FIXTURE-MANIFEST-08-no-work-side-effect-budget',
  'FT-JSON-FIXTURE-MANIFEST-09-diagnostic-metric-privacy',
  'FT-JSON-FIXTURE-MANIFEST-10-rollback-release-public',
  'FT-JSON-FIXTURE-MANIFEST-11-verification-authority'
];

const requiredFields = [
  'manifestVersion',
  'packetId',
  'manifestSchemaVersion',
  'fixturePacketContractVersion',
  'createdByAuditSlice',
  'JSONRouteSurfaceRowId',
  'route',
  'surface',
  'endpointFamily',
  'rendererClass',
  'identityTier',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'obligationId',
  'candidateId',
  'bindingId',
  'optimizationReadinessId',
  'profileType',
  'listMode',
  'ruleState',
  'extensionEnabled',
  'settingsRevision',
  'artifactRoot',
  'manifestPath',
  'fixtureSamplePath',
  'provenancePath',
  'parityReportPath',
  'verificationOutputPath',
  'sourceCapturePath',
  'reducedFixturePath',
  'rawCaptureBoundary',
  'releaseInputExcluded',
  'positiveFixture',
  'negativeSiblingFixture',
  'disabledFixture',
  'emptyListFixture',
  'sparseSurfaceFixture',
  'lifecycleAffordanceFixture',
  'selectedCurrentFixture',
  'commentContinuationFixture',
  'domParityFixture',
  'nativeParityFixture',
  'playbackSafetyFixture',
  'restorePreserved',
  'JSONDOMParity',
  'nativeParity',
  'noWorkProof',
  'sideEffectBudget',
  'listenerObserverTimerBudget',
  'networkStorageBudget',
  'metricArtifact',
  'diagnosticPrivacyFixture',
  'diagnosticPrivacy',
  'metricSampleEnvelope',
  'rollbackPlan',
  'rollbackScope',
  'unclaimedSurfaceList',
  'releaseClaimScope',
  'publicClaimScope',
  'verificationCommand',
  'verificationOutput',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'artifactAbsenceCheck',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureManifestContract',
  'jsonFirstRouteSurfaceFixtureManifestReport',
  'jsonFirstRouteSurfaceFixtureManifestApproval',
  'jsonFirstRouteSurfaceFixtureManifestNoGoBoundary',
  'jsonFirstRouteSurfaceFixtureRouteBindingManifest',
  'jsonFirstRouteSurfaceFixtureArtifactManifest',
  'jsonFirstRouteSurfaceFixtureManifestRuntimeApproval',
  'jsonFirstRouteSurfaceFixtureManifestMetricApproval',
  'jsonFirstRouteSurfaceFixtureManifestVerification',
  'jsonFirstRouteSurfaceFixtureManifestPublicClaimApproval'
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

test('JSON-first route/surface fixture manifest contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture manifest\s+contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved route\/surface fixture manifest path: docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\/manifest\.json/);
  assert.match(doc, /Committed route\/surface fixture manifest files: 0/);
  assert.match(doc, /Runtime JSON-first fixture manifest approval exists: no/);
  assert.match(doc, /Runtime JSON-first fixture packet approval exists: no/);
  assert.match(doc, /Implementation-ready JSON-first fixture manifest contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture manifest authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture manifest rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-MANIFEST-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface fixture manifest contract rows: 12/);
  assert.match(doc, /reserved manifest paths covered: 1/);
  assert.match(doc, /aggregate fixture packet contract rows covered: 12/);
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
  assert.match(doc, /committed route\/surface fixture manifest files: 0/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /runtime JSON-first fixture manifest approvals: 0/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first fixture manifest contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing manifest field ${field}`);
  }
});

test('JSON-first route/surface fixture manifest path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(manifestPath));
  assert.equal(fs.existsSync(path.join(repoRoot, manifestPath)), false, `${manifestPath} should not exist yet`);
});

test('JSON-first route/surface fixture manifest contract is backed by current NO-GO gates', () => {
  const fixturePacketContract = read(sourceDocs.fixturePacketContract);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const contractCoverage = read(sourceDocs.contractCoverage);
  const commitReadiness = read(sourceDocs.commitReadiness);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const collectorFixtureProvenance = read(sourceDocs.collectorFixtureProvenance);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(fixturePacketContract, /JSON-first route\/surface fixture packet rows: 12/);
  assert.match(fixturePacketContract, /implementation-ready JSON-first fixture packet rows: 0/);
  assert.match(pathBoundary, /reserved future artifact files: 5/);
  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(contractCoverage, /per-file fixture artifact contract docs covered: 5/);
  assert.match(contractCoverage, /per-file fixture artifact contract tests covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface fixture artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface fixture artifact commit rows: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(jsonFirstImplementation, /implementation-ready JSON-first rows: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(collectorFixtureProvenance, /runtime collector fixture packets approved: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5736/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture manifest decisions and authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface fixture manifest contract: GO',
    'commit route/surface fixture manifest artifact now: NO-GO',
    'commit route/surface fixture packet root now: NO-GO',
    'use route/surface fixture manifest as implementation authority now: NO-GO',
    'runtime JSON-first fixture manifest approval now: NO-GO',
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

test('JSON-first route/surface fixture manifest contract is linked from ledgers and adjacent gates', () => {
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
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture manifest contract addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture manifest contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture manifest contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture manifest contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
});
