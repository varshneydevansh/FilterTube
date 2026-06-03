import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  sourceOwnerMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSample: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifest: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedRows = [
  'FT-SOURCE-OWNER-APPROVAL-00-selected-binding',
  'FT-SOURCE-OWNER-APPROVAL-01-source-locus-catalog',
  'FT-SOURCE-OWNER-APPROVAL-02-line-anchor-policy',
  'FT-SOURCE-OWNER-APPROVAL-03-callable-owner-policy',
  'FT-SOURCE-OWNER-APPROVAL-04-field-production-owner',
  'FT-SOURCE-OWNER-APPROVAL-05-settings-scope-owner',
  'FT-SOURCE-OWNER-APPROVAL-06-transport-engine-owner',
  'FT-SOURCE-OWNER-APPROVAL-07-dom-visual-owner',
  'FT-SOURCE-OWNER-APPROVAL-08-network-storage-owner',
  'FT-SOURCE-OWNER-APPROVAL-09-diagnostic-privacy-owner',
  'FT-SOURCE-OWNER-APPROVAL-10-parity-release-owner',
  'FT-SOURCE-OWNER-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'candidateId',
  'bindingId',
  'obligationId',
  'artifactRoot',
  'sourceOwnerMapPath',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'approvalStatus',
  'sourceLocus',
  'sourceOwner',
  'ownerFamily',
  'sourceFiles',
  'sourceRevision',
  'sourceLocusApprovalStatus',
  'lineAnchors',
  'sourceHash',
  'callsiteLine',
  'ownerLine',
  'lineAnchorFreshness',
  'lineAnchorApprovalStatus',
  'callables',
  'callableOwner',
  'teardownOwner',
  'listenerOwner',
  'observerOwner',
  'timerOwner',
  'callableApprovalStatus',
  'metricFields',
  'producerField',
  'producerOwner',
  'fieldDerivation',
  'fieldProductionApprovalStatus',
  'settingsOwner',
  'profileOwner',
  'listModeOwner',
  'routeOwner',
  'settingsRevisionOwner',
  'settingsScopeApprovalStatus',
  'fetchOwner',
  'xhrOwner',
  'endpointOwner',
  'bodyReadOwner',
  'engineOwner',
  'rendererMutationOwner',
  'transportEngineApprovalStatus',
  'domOwner',
  'selectorOwner',
  'visualOwner',
  'hideOwner',
  'restoreOwner',
  'domVisualApprovalStatus',
  'networkOwner',
  'credentialOwner',
  'resolverOwner',
  'storageOwner',
  'mapWriteOwner',
  'networkStorageApprovalStatus',
  'diagnosticOwner',
  'privacyOwner',
  'redactionOwner',
  'debugGateOwner',
  'consoleBudgetOwner',
  'diagnosticPrivacyApprovalStatus',
  'fixtureOwner',
  'parityOwner',
  'nativeParityOwner',
  'releaseOwner',
  'publicClaimOwner',
  'parityReleaseApprovalStatus',
  'runtimeResultsPath',
  'objectiveLedgerPath',
  'activeGoalAuditPath',
  'trackedFileIndexPath',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationSourceOwnerApprovalBoundary',
  'firstOptimizationSourceOwnerApprovalReport',
  'firstOptimizationSourceOwnerApproval',
  'firstOptimizationSourceOwnerApprovalNoGoBoundary',
  'metricFoundationSourceOwnerApprovalAuthority',
  'metricFoundationSourceOwnerApprovalCollector',
  'jsonFirstSourceOwnerApprovalGate',
  'whitelistSourceOwnerApprovalGate',
  'sourceOwnerLineAnchorApproval',
  'sourceOwnerCallableApproval',
  'sourceOwnerFieldProductionApproval',
  'sourceOwnerTeardownApproval',
  'sourceOwnerRuntimeCollectorApproval'
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
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  return ['js', 'build.js', 'scripts', 'website']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs|jsx|ts|tsx)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization source-owner approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-owner approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Implementation-ready source-owner approval rows: 0/);
  assert.match(doc, /affected\s+callable set has semantic proof/);
  assert.match(doc, /not completion proof for source-owner approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-owner approval rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-OWNER-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-owner approval boundary rows: 12/);
  assert.match(doc, /selected first optimization bindings covered: 1/);
  assert.match(doc, /source-owner matrix rows covered: 12/);
  assert.match(doc, /source-owner map contract rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /metric sample contract rows covered: 12/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /runtime source files referenced: 14/);
  assert.match(doc, /owner families referenced: 10/);
  assert.match(doc, /reserved source-owner map paths covered: 1/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-owner approval rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5789/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5789/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing source-owner approval field ${field}`);
  }
});

test('source-owner approval does not commit the source-owner map artifact', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(sourceOwnerMapPath));
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false, `${sourceOwnerMapPath} should not exist yet`);
});

test('source-owner approval boundary is backed by current source-owner and collector gates', () => {
  const sourceOwnerMatrix = read(sourceDocs.sourceOwnerMatrix);
  const sourceOwnerMapContract = read(sourceDocs.sourceOwnerMapContract);
  const metricSchema = read(sourceDocs.metricSchema);
  const metricSample = read(sourceDocs.metricSample);
  const manifest = read(sourceDocs.manifest);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(sourceOwnerMatrix, /metric source-owner rows: 12/);
  assert.match(sourceOwnerMatrix, /source-owner rows with implemented collector: 0/);
  assert.match(sourceOwnerMatrix, /source-owner rows implementation-ready: 0/);
  assert.match(sourceOwnerMapContract, /first optimization source owner map contract rows: 12/);
  assert.match(sourceOwnerMapContract, /committed source owner map files: 0/);
  assert.match(sourceOwnerMapContract, /implementation-ready source owner map contract rows: 0/);
  assert.match(sourceOwnerMapContract, /method semantic proof gap files covered: 69/);
  assert.match(metricSchema, /metric artifact schema rows: 12/);
  assert.match(metricSchema, /runtime metric collectors implemented: 0/);
  assert.match(metricSample, /Committed metric sample files: 0/);
  assert.match(manifest, /Committed packet manifest files: 0/);
  assert.match(collectorApproval, /runtime metric collector approvals: 0/);
  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(collectorApproval, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5789/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorInsertion, /collector rows implementation-ready: 0/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /fail 0/);
});

test('source-owner approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }
});

test('source-owner approval boundary is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    read(sourceDocs.sourceOwnerMatrix),
    read(sourceDocs.sourceOwnerMapContract),
    read(sourceDocs.collectorApproval),
    read(sourceDocs.collectorInsertion),
    read(sourceDocs.implementationReadiness)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization source-owner approval boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /First optimization source-owner approval boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization source-owner approval boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization source-owner approval boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization source-owner approval boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
});
