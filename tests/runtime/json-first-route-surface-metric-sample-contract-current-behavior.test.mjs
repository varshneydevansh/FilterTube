import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-sample-contract-current-behavior.test.mjs';
const samplePath = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/metric-sample.json';
const foundationMetricSamplePath = 'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricPathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricContractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricCommitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceMetricSample: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-METRIC-SAMPLE-00-sample-identity',
  'FT-JSON-METRIC-SAMPLE-01-route-surface-endpoint-mode',
  'FT-JSON-METRIC-SAMPLE-02-obligation-candidate-binding',
  'FT-JSON-METRIC-SAMPLE-03-source-owner-locus',
  'FT-JSON-METRIC-SAMPLE-04-transport-counters',
  'FT-JSON-METRIC-SAMPLE-05-engine-json-counters',
  'FT-JSON-METRIC-SAMPLE-06-dom-lifecycle-counters',
  'FT-JSON-METRIC-SAMPLE-07-network-storage-counters',
  'FT-JSON-METRIC-SAMPLE-08-visual-restore-counters',
  'FT-JSON-METRIC-SAMPLE-09-json-dom-parity',
  'FT-JSON-METRIC-SAMPLE-10-no-work-side-effect',
  'FT-JSON-METRIC-SAMPLE-11-verification-rollout'
];

const requiredFields = [
  'sampleVersion',
  'sampleId',
  'artifactId',
  'candidateId',
  'bindingId',
  'obligationId',
  'contractCoverageId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'auditOnlyStatus',
  'route',
  'surface',
  'endpointFamily',
  'rendererClass',
  'profileType',
  'listMode',
  'extensionEnabled',
  'ruleState',
  'settingsRevision',
  'routeSurfaceMetricObligationId',
  'bindingMatrixId',
  'fixtureApprovalStatus',
  'metricApprovalStatus',
  'implementationApprovalStatus',
  'sourceLocus',
  'sourceOwner',
  'ownerFamily',
  'collectorInsertionId',
  'collectorApproved',
  'sourceFiles',
  'sourceHashStatus',
  'fetchPatched',
  'xhrPatched',
  'endpointMatched',
  'bodyReadCount',
  'responseParsedCount',
  'responseRebuiltCount',
  'passThroughReason',
  'processDataCount',
  'itemsVisited',
  'candidateRowsEvaluated',
  'ruleChecks',
  'jsonPathClass',
  'jsonPaths',
  'jsonRowsVisited',
  'renderersRemoved',
  'domSelectorClass',
  'domSelectors',
  'domQueries',
  'domNodesVisited',
  'listenerCallbacks',
  'observerCallbacks',
  'timerCallbacks',
  'teardownProof',
  'networkFetches',
  'credentialMode',
  'resolverRequests',
  'storageReads',
  'storageWrites',
  'mapWrites',
  'postMessages',
  'hideMutations',
  'restoreMutations',
  'pendingHides',
  'siblingVisibleProof',
  'falseHideCount',
  'leakCount',
  'restorePreserved',
  'jsonDomParityStatus',
  'nativeParityStatus',
  'fixtureProvenanceId',
  'parityResult',
  'selectedCurrentStatus',
  'commentContinuationStatus',
  'disabledPassThrough',
  'missingSettingsPassThrough',
  'noRulePassThrough',
  'emptyListPassThrough',
  'transportNoWork',
  'domNoWork',
  'networkNoWork',
  'storageNoWork',
  'visualNoWork',
  'sideEffectBudget',
  'verificationCommand',
  'verificationOutputPath',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'releaseInputExcluded',
  'rollbackBoundary',
  'unclaimedSurfaceStatus',
  'publicClaimScope'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricSampleContract',
  'jsonFirstRouteSurfaceMetricSampleReport',
  'jsonFirstRouteSurfaceMetricSampleApproval',
  'jsonFirstRouteSurfaceMetricSampleNoGoBoundary',
  'jsonFirstRouteSurfaceMetricSampleArtifact',
  'jsonFirstRouteSurfaceMetricSampleCollector',
  'jsonFirstRouteSurfaceMetricSampleRuntimeApproval',
  'jsonFirstRouteSurfaceMetricSampleVerification',
  'jsonFirstRouteSurfaceMetricSamplePublicClaimApproval',
  'routeSurfaceMetricSampleRuntimeAuthority'
];

const sampleContractAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Ss]ample [Cc]ontract [Aa]ddendum/;

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

test('JSON-first route/surface metric sample contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric sample\s+contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved route\/surface metric sample path: docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\/metric-sample\.json/);
  assert.match(doc, /Committed route\/surface metric sample files: 0/);
  assert.match(doc, /Committed route\/surface metric artifact files: 0/);
  assert.match(doc, /Runtime route\/surface metric sample approval exists: no/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5789/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(doc, /Implementation-ready JSON-first route\/surface metric sample contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface metric sample authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric sample rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-SAMPLE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface metric sample contract rows: 12/);
  assert.match(doc, /reserved route\/surface metric sample paths covered: 1/);
  assert.match(doc, /source metric sample contract rows covered: 12/);
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
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5789/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(doc, /committed route\/surface metric sample files: 0/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed first-optimization foundation metric sample files: 0/);
  assert.match(doc, /runtime route\/surface metric sample approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first route\/surface metric sample contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing metric sample field ${field}`);
  }
});

test('JSON-first route/surface metric sample path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(samplePath));
  assert.ok(doc.includes(foundationMetricSamplePath));
  assert.equal(fs.existsSync(path.join(repoRoot, samplePath)), false, `${samplePath} should not exist yet`);
  assert.equal(fs.existsSync(path.join(repoRoot, foundationMetricSamplePath)), false, `${foundationMetricSamplePath} should not exist yet`);
});

test('JSON-first route/surface metric sample contract is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.metricPathBoundary);
  const contractCoverage = read(sourceDocs.metricContractCoverage);
  const commitReadiness = read(sourceDocs.metricCommitReadiness);
  const metricApproval = read(sourceDocs.metricApproval);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const fixtureApproval = read(sourceDocs.fixtureApproval);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const sourceMetricSample = read(sourceDocs.sourceMetricSample);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(pathBoundary, /committed route\/surface metric artifact files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(contractCoverage, /route\/surface-specific per-file metric artifact contract docs covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface metric artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface metric artifact commit rows: 0/);
  assert.match(metricApproval, /implementation-ready route\/surface metric artifact approval rows: 0/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(sourceMetricSample, /Committed metric sample files: 0/);
  assert.match(sourceMetricSample, /Implementation-ready metric sample contract rows: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5789/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface metric sample decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface metric sample contract: GO',
    'commit route/surface metric sample artifact now: NO-GO',
    'commit route/surface metric artifact root now: NO-GO',
    'use route/surface metric sample as implementation authority now: NO-GO',
    'runtime route/surface metric sample approval now: NO-GO',
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

test('JSON-first route/surface metric sample contract is linked from ledgers and adjacent gates', () => {
  const linkedDocs = {
    metricContractCoverage: sourceDocs.metricContractCoverage,
    metricCommitReadiness: sourceDocs.metricCommitReadiness,
    metricApproval: sourceDocs.metricApproval,
    sourceMetricSample: sourceDocs.sourceMetricSample,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, sampleContractAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(sourceDocs.runtimeResults), /tests 4457/);
  assert.match(read(sourceDocs.runtimeResults), /pass 4457/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
