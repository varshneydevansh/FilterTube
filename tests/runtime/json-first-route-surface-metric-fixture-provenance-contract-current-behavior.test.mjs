import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-fixture-provenance-contract-current-behavior.test.mjs';
const fixtureProvenancePath = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/fixture-provenance.json';
const foundationFixtureProvenancePath = 'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricPathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricContractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricCommitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricNoWorkContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_NO_WORK_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSideEffectContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceFixtureProvenanceContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-00-provenance-identity',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-01-artifact-path-binding',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-02-source-contract-handoff',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-03-route-surface-obligation',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-04-raw-source-boundary',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-05-reduced-fixture-inventory',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-06-positive-negative-proof',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-07-disabled-empty-no-work',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-08-json-dom-parity-source-owner',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-09-side-effect-diagnostic-coupling',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-10-rollout-release-public',
  'FT-JSON-METRIC-FIXTURE-PROVENANCE-11-verification-authority'
];

const requiredFields = [
  'provenanceVersion',
  'provenanceId',
  'metricArtifactId',
  'metricSampleId',
  'noWorkBudgetId',
  'sideEffectBudgetId',
  'candidateId',
  'bindingId',
  'obligationId',
  'contractCoverageId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'auditOnlyStatus',
  'routeSurfaceFixtureProvenancePath',
  'foundationFixtureProvenancePath',
  'artifactRoot',
  'metricSamplePath',
  'noWorkBudgetPath',
  'sideEffectBudgetPath',
  'verificationOutputPath',
  'artifactAbsenceCheck',
  'sourceFixtureProvenanceContract',
  'sourceFixtureProvenanceRows',
  'collectorFixtureProvenanceRows',
  'sourceLocusFixtureProvenanceRows',
  'collectorFixtureApprovalRows',
  'runtimeCollectorApprovalStatus',
  'route',
  'surface',
  'endpointFamily',
  'rendererClass',
  'profileType',
  'listMode',
  'ruleState',
  'routeSurfaceMetricObligationId',
  'fixtureApprovalStatus',
  'implementationApprovalStatus',
  'rawSourcePath',
  'rawSourceKind',
  'rawSourceHash',
  'rawSourceIgnored',
  'rawSourceReleaseExcluded',
  'captureDate',
  'rawCapturePromotionStatus',
  'releaseInputExcluded',
  'committedFixturePath',
  'fixtureHash',
  'fixtureRoute',
  'fixtureSurface',
  'fixtureEndpointFamily',
  'fixtureRendererClass',
  'fixtureOwner',
  'fixtureCorpusScope',
  'positiveFixture',
  'positiveRule',
  'positiveExpectedDecision',
  'positiveExpectedMutation',
  'negativeSiblingFixture',
  'negativeExpectedDecision',
  'expectedVisibleVideoIds',
  'falseHideProof',
  'leakProof',
  'restoreProof',
  'disabledFixture',
  'noRuleFixture',
  'emptyBlocklistFixture',
  'emptyWhitelistFixture',
  'missingSettingsFixture',
  'passThroughProof',
  'transportNoWorkProof',
  'visualNoWorkProof',
  'diagnosticNoWorkProof',
  'noWorkApprovalStatus',
  'jsonFixture',
  'domFixture',
  'nativeFixture',
  'jsonPathClass',
  'jsonPaths',
  'domSelectorClass',
  'domSelectors',
  'sourceOwnersCovered',
  'unownedFields',
  'parityExpectedResult',
  'sideEffectBudget',
  'noWorkRowsCovered',
  'sideEffectRowsCovered',
  'listenerObserverTimerBudget',
  'networkStorageBudget',
  'diagnosticPrivacy',
  'redactionPolicy',
  'consoleBudget',
  'privacyClass',
  'sideEffectApprovalStatus',
  'nativeParityFixture',
  'rollbackBoundary',
  'unclaimedSurfaceBoundary',
  'nativeSyncBoundary',
  'publicClaimScope',
  'rolloutProofStatus',
  'rollbackApprovalStatus',
  'verificationCommand',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'authorityTokenAbsenceCheck',
  'approvalStatus'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricFixtureProvenanceContract',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceReport',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceApproval',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceNoGoBoundary',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceArtifact',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceCollector',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceRuntimeApproval',
  'jsonFirstRouteSurfaceMetricFixtureProvenanceVerification',
  'jsonFirstRouteSurfaceMetricFixtureProvenancePublicClaimApproval',
  'routeSurfaceMetricFixtureProvenanceRuntimeAuthority'
];

const fixtureProvenanceAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Ff]ixture [Pp]rovenance [Cc]ontract [Aa]ddendum/;

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

test('JSON-first route/surface metric fixture provenance contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric fixture\s+provenance contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface metric fixture provenance path: docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\/fixture-provenance\.json/);
  assert.match(doc, /Related first-optimization foundation fixture provenance path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/fixture-provenance\.json/);
  assert.match(doc, /Committed route\/surface metric fixture provenance files: 0/);
  assert.match(doc, /Committed route\/surface metric artifact files: 0/);
  assert.match(doc, /Runtime route\/surface metric fixture provenance approval exists: no/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5836/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /Implementation-ready JSON-first route\/surface metric fixture provenance contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface metric fixture provenance authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric fixture provenance rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-FIXTURE-PROVENANCE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface metric fixture provenance contract rows: 12/);
  assert.match(doc, /reserved route\/surface metric fixture provenance paths covered: 1/);
  assert.match(doc, /related first-optimization foundation fixture provenance paths covered: 1/);
  assert.match(doc, /source fixture provenance contract rows covered: 12/);
  assert.match(doc, /metric sample contract rows covered: 12/);
  assert.match(doc, /metric no-work budget contract rows covered: 12/);
  assert.match(doc, /metric side-effect budget contract rows covered: 12/);
  assert.match(doc, /metric artifact contract coverage rows covered: 10/);
  assert.match(doc, /metric artifact path boundary rows covered: 6/);
  assert.match(doc, /metric artifact commit readiness rows covered: 10/);
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
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /collector fixture provenance approval rows covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5836/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5836/);
  assert.match(doc, /committed route\/surface metric fixture provenance files: 0/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed first-optimization foundation fixture provenance files: 0/);
  assert.match(doc, /runtime route\/surface metric fixture provenance approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector fixture provenance approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first route\/surface metric fixture provenance contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing metric fixture provenance field ${field}`);
  }
});

test('JSON-first route/surface metric fixture provenance path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(fixtureProvenancePath));
  assert.ok(doc.includes(foundationFixtureProvenancePath));
  assert.equal(fs.existsSync(path.join(repoRoot, fixtureProvenancePath)), false, `${fixtureProvenancePath} should not exist yet`);
  assert.equal(fs.existsSync(path.join(repoRoot, foundationFixtureProvenancePath)), false, `${foundationFixtureProvenancePath} should not exist yet`);
});

test('JSON-first route/surface metric fixture provenance contract is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.metricPathBoundary);
  const contractCoverage = read(sourceDocs.metricContractCoverage);
  const commitReadiness = read(sourceDocs.metricCommitReadiness);
  const metricApproval = read(sourceDocs.metricApproval);
  const metricSampleContract = read(sourceDocs.metricSampleContract);
  const metricNoWorkContract = read(sourceDocs.metricNoWorkContract);
  const metricSideEffectContract = read(sourceDocs.metricSideEffectContract);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const fixtureApproval = read(sourceDocs.fixtureApproval);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const sourceFixtureProvenanceContract = read(sourceDocs.sourceFixtureProvenanceContract);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const sourceLocusFixture = read(sourceDocs.sourceLocusFixture);
  const collectorFixtureApproval = read(sourceDocs.collectorFixtureApproval);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(pathBoundary, /committed route\/surface metric artifact files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(contractCoverage, /route\/surface-specific per-file metric artifact contract docs covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface metric artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface metric artifact commit rows: 0/);
  assert.match(metricApproval, /implementation-ready route\/surface metric artifact approval rows: 0/);
  assert.match(metricSampleContract, /implementation-ready JSON-first route\/surface metric sample contract rows: 0/);
  assert.match(metricNoWorkContract, /implementation-ready JSON-first route\/surface metric no-work budget contract rows: 0/);
  assert.match(metricSideEffectContract, /implementation-ready JSON-first route\/surface metric side-effect budget contract rows: 0/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(sourceFixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(sourceFixtureProvenanceContract, /Implementation-ready fixture provenance contract rows: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(sourceLocusFixture, /implementation-ready source-locus fixture provenance rows: 0/);
  assert.match(collectorFixtureApproval, /implementation-ready collector fixture provenance approval rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5836/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface metric fixture provenance decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface metric fixture provenance contract: GO',
    'commit route/surface metric fixture provenance artifact now: NO-GO',
    'commit route/surface metric artifact root now: NO-GO',
    'use route/surface metric fixture provenance as implementation authority now: NO-GO',
    'runtime route/surface metric fixture provenance approval now: NO-GO',
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

test('JSON-first route/surface metric fixture provenance contract is linked from ledgers and adjacent gates', () => {
  const linkedDocs = {
    metricContractCoverage: sourceDocs.metricContractCoverage,
    metricCommitReadiness: sourceDocs.metricCommitReadiness,
    metricApproval: sourceDocs.metricApproval,
    sourceFixtureProvenanceContract: sourceDocs.sourceFixtureProvenanceContract,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, fixtureProvenanceAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(sourceDocs.runtimeResults), /tests 4457/);
  assert.match(read(sourceDocs.runtimeResults), /pass 4457/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
