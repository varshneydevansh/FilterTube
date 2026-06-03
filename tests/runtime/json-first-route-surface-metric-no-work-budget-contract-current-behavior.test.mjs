import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_NO_WORK_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-no-work-budget-contract-current-behavior.test.mjs';
const noWorkPath = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/no-work-budget.json';
const foundationNoWorkPath = 'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricPathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricContractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricCommitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceNoWorkContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-METRIC-NO-WORK-00-budget-identity',
  'FT-JSON-METRIC-NO-WORK-01-route-surface-mode',
  'FT-JSON-METRIC-NO-WORK-02-obligation-candidate-binding',
  'FT-JSON-METRIC-NO-WORK-03-source-owner-locus',
  'FT-JSON-METRIC-NO-WORK-04-disabled-missing-settings',
  'FT-JSON-METRIC-NO-WORK-05-no-rule-empty-list',
  'FT-JSON-METRIC-NO-WORK-06-transport-budget',
  'FT-JSON-METRIC-NO-WORK-07-engine-json-budget',
  'FT-JSON-METRIC-NO-WORK-08-dom-lifecycle-budget',
  'FT-JSON-METRIC-NO-WORK-09-network-storage-visual-budget',
  'FT-JSON-METRIC-NO-WORK-10-diagnostic-parity-rollout',
  'FT-JSON-METRIC-NO-WORK-11-verification-authority'
];

const requiredFields = [
  'budgetVersion',
  'budgetId',
  'artifactId',
  'sampleId',
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
  'noWorkApprovalStatus',
  'implementationApprovalStatus',
  'sourceLocus',
  'sourceOwner',
  'ownerFamily',
  'collectorInsertionId',
  'collectorApproved',
  'sourceFiles',
  'sourceHashStatus',
  'sourceNoWorkOwnershipStatus',
  'disabledFixture',
  'disabledPassThrough',
  'disabledTransportWork',
  'disabledDomWork',
  'missingSettingsFixture',
  'missingSettingsPassThrough',
  'settingsRecoveryBoundary',
  'noRuleFixture',
  'noRulePassThrough',
  'noRuleEngineWork',
  'emptyBlocklistFixture',
  'emptyWhitelistFixture',
  'emptyListPassThrough',
  'emptyListPolicy',
  'fetchPatched',
  'xhrPatched',
  'endpointMatched',
  'fetchBodyReadBudget',
  'xhrBodyReadBudget',
  'responseRewriteBudget',
  'transportCounters',
  'transportNoWork',
  'processDataBudget',
  'itemsVisitedBudget',
  'candidateRowsBudget',
  'ruleCheckBudget',
  'jsonPathClass',
  'jsonPaths',
  'jsonRowsVisitedBudget',
  'renderersRemovedBudget',
  'engineNoWork',
  'domSelectorClass',
  'domSelectors',
  'domQueryBudget',
  'domNodesVisitedBudget',
  'listenerCallbackBudget',
  'observerCallbackBudget',
  'timerCallbackBudget',
  'teardownProof',
  'domNoWork',
  'networkRequestBudget',
  'credentialBudget',
  'resolverRequestBudget',
  'storageReadBudget',
  'storageWriteBudget',
  'mapWriteBudget',
  'hideMutationBudget',
  'restoreMutationBudget',
  'visualNoWork',
  'diagnosticLogBudget',
  'privacyClass',
  'jsonDomParityNoWork',
  'nativeParityNoWork',
  'releaseInputExcluded',
  'rollbackBoundary',
  'unclaimedSurfaceStatus',
  'publicClaimScope',
  'verificationCommand',
  'verificationOutputPath',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'artifactAbsenceCheck',
  'authorityTokenAbsenceCheck',
  'approvalStatus'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricNoWorkBudgetContract',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetReport',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetApproval',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetNoGoBoundary',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetArtifact',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetCollector',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetRuntimeApproval',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetVerification',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetPublicClaimApproval',
  'routeSurfaceMetricNoWorkBudgetRuntimeAuthority'
];

const noWorkBudgetAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Nn]o-[Ww]ork [Bb]udget [Cc]ontract [Aa]ddendum/;

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

test('JSON-first route/surface metric no-work budget contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric no-work\s+budget contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface metric no-work budget path: docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\/no-work-budget\.json/);
  assert.match(doc, /Committed route\/surface metric no-work budget files: 0/);
  assert.match(doc, /Committed route\/surface metric artifact files: 0/);
  assert.match(doc, /Runtime route\/surface metric no-work budget approval exists: no/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5789/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(doc, /Implementation-ready JSON-first route\/surface metric no-work budget contract rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface metric no-work budget authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric no-work budget rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-NO-WORK-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface metric no-work budget contract rows: 12/);
  assert.match(doc, /reserved route\/surface metric no-work budget paths covered: 1/);
  assert.match(doc, /source no-work preservation contract rows covered: 12/);
  assert.match(doc, /metric sample contract rows covered: 12/);
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
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5789/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(doc, /committed route\/surface metric no-work budget files: 0/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed first-optimization foundation no-work preservation files: 0/);
  assert.match(doc, /runtime route\/surface metric no-work budget approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector no-work approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first route\/surface metric no-work budget contract rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing metric no-work budget field ${field}`);
  }
});

test('JSON-first route/surface metric no-work budget path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(noWorkPath));
  assert.ok(doc.includes(foundationNoWorkPath));
  assert.equal(fs.existsSync(path.join(repoRoot, noWorkPath)), false, `${noWorkPath} should not exist yet`);
  assert.equal(fs.existsSync(path.join(repoRoot, foundationNoWorkPath)), false, `${foundationNoWorkPath} should not exist yet`);
});

test('JSON-first route/surface metric no-work budget contract is backed by current NO-GO gates', () => {
  const pathBoundary = read(sourceDocs.metricPathBoundary);
  const contractCoverage = read(sourceDocs.metricContractCoverage);
  const commitReadiness = read(sourceDocs.metricCommitReadiness);
  const metricApproval = read(sourceDocs.metricApproval);
  const metricSampleContract = read(sourceDocs.metricSampleContract);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const fixtureApproval = read(sourceDocs.fixtureApproval);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const sourceNoWorkContract = read(sourceDocs.sourceNoWorkContract);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const sourceLocusNoWork = read(sourceDocs.sourceLocusNoWork);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(pathBoundary, /committed route\/surface metric artifact files: 0/);
  assert.match(pathBoundary, /implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(contractCoverage, /route\/surface-specific per-file metric artifact contract docs covered: 5/);
  assert.match(contractCoverage, /implementation-ready route\/surface metric artifact contract coverage rows: 0/);
  assert.match(commitReadiness, /implementation-ready route\/surface metric artifact commit rows: 0/);
  assert.match(metricApproval, /implementation-ready route\/surface metric artifact approval rows: 0/);
  assert.match(metricSampleContract, /implementation-ready JSON-first route\/surface metric sample contract rows: 0/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(sourceNoWorkContract, /Committed no-work preservation files: 0/);
  assert.match(sourceNoWorkContract, /Implementation-ready no-work preservation contract rows: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(sourceLocusNoWork, /implementation-ready source-locus no-work rows: 0/);
  assert.match(collectorNoWorkApproval, /implementation-ready collector no-work approval rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5789/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface metric no-work budget decisions and symbols stay absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'define JSON-first route/surface metric no-work budget contract: GO',
    'commit route/surface metric no-work budget artifact now: NO-GO',
    'commit route/surface metric artifact root now: NO-GO',
    'use route/surface metric no-work budget as implementation authority now: NO-GO',
    'runtime route/surface metric no-work budget approval now: NO-GO',
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

test('JSON-first route/surface metric no-work budget contract is linked from ledgers and adjacent gates', () => {
  const linkedDocs = {
    metricContractCoverage: sourceDocs.metricContractCoverage,
    metricCommitReadiness: sourceDocs.metricCommitReadiness,
    metricApproval: sourceDocs.metricApproval,
    sourceNoWorkContract: sourceDocs.sourceNoWorkContract,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, noWorkBudgetAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(sourceDocs.runtimeResults), /tests 4457/);
  assert.match(read(sourceDocs.runtimeResults), /pass 4457/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
