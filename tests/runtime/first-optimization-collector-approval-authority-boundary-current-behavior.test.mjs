import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-approval-authority-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  artifactCommitReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParity: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedRows = [
  'FT-COLLECTOR-APPROVAL-00-packet-binding',
  'FT-COLLECTOR-APPROVAL-01-source-owner',
  'FT-COLLECTOR-APPROVAL-02-insertion-point',
  'FT-COLLECTOR-APPROVAL-03-no-work',
  'FT-COLLECTOR-APPROVAL-04-side-effect',
  'FT-COLLECTOR-APPROVAL-05-fixture-provenance',
  'FT-COLLECTOR-APPROVAL-06-diagnostic-privacy',
  'FT-COLLECTOR-APPROVAL-07-parity-rollout',
  'FT-COLLECTOR-APPROVAL-08-verification-output',
  'FT-COLLECTOR-APPROVAL-09-rollback-unclaimed',
  'FT-COLLECTOR-APPROVAL-10-release-public',
  'FT-COLLECTOR-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'candidateId',
  'bindingId',
  'obligationId',
  'artifactRoot',
  'packetManifest',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'approvalStatus',
  'ownerRows',
  'sourceFiles',
  'producerFields',
  'teardownOwner',
  'collectorOwner',
  'sourceOwnerApprovalStatus',
  'insertionRows',
  'insertionPoint',
  'passiveReadOnlyProof',
  'observerTimerBudget',
  'collectorInsertionApprovalStatus',
  'disabledProof',
  'noRuleProof',
  'emptyListProof',
  'passThroughProof',
  'noWorkApprovalStatus',
  'settingsBudget',
  'networkBudget',
  'storageBudget',
  'domMutationBudget',
  'visualBudget',
  'sideEffectApprovalStatus',
  'rawSourceBoundary',
  'fixturePacket',
  'positiveFixtures',
  'negativeFixtures',
  'releaseInputExclusion',
  'fixtureApprovalStatus',
  'privacyClass',
  'redactionPolicy',
  'debugGate',
  'consoleBudget',
  'metricReplacementPolicy',
  'diagnosticApprovalStatus',
  'jsonDomParity',
  'nativeParity',
  'releasePackageParity',
  'publicClaimBoundary',
  'unmeasuredSurfaceExclusion',
  'parityApprovalStatus',
  'tapOutputPath',
  'expectedCommands',
  'artifactAbsenceCheck',
  'authorityAbsenceCheck',
  'verificationApprovalStatus',
  'rollbackCommand',
  'artifactRemovalCommand',
  'collectorDisableCommand',
  'unclaimedSurfaces',
  'rollbackApprovalStatus',
  'nativeSyncStatus',
  'releasePackageStatus',
  'rawCaptureExclusion',
  'publicClaimStatus',
  'releasePublicApprovalStatus',
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
  'firstOptimizationCollectorApprovalAuthorityBoundary',
  'firstOptimizationCollectorApprovalAuthorityReport',
  'firstOptimizationRuntimeCollectorApproval',
  'firstOptimizationCollectorApprovalNoGoBoundary',
  'metricFoundationCollectorApprovalAuthority',
  'jsonFirstCollectorApprovalGate',
  'whitelistCollectorApprovalGate',
  'collectorApprovalNoWorkProof',
  'collectorApprovalSideEffectBudget',
  'collectorApprovalFixturePacket',
  'collectorApprovalDiagnosticPrivacy',
  'collectorApprovalParityRollout',
  'collectorApprovalVerificationOutput',
  'collectorApprovalRollbackBoundary',
  'collectorApprovalReleasePublicBoundary'
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

test('first optimization collector approval authority boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Implementation-ready collector approval rows: 0/);
  assert.match(doc, /affected callable set has semantic proof/);
  assert.match(doc, /not completion proof for collector approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector approval rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector approval authority rows: 12/);
  assert.match(doc, /selected first optimization bindings covered: 1/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /implementation readiness rows covered: 14/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /runtime collector parity rollout proofs approved: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /implementation-ready collector approval rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5673/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5673/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing collector approval field ${field}`);
  }
});

test('collector approval boundary is backed by current collector and artifact gates', () => {
  const artifactCommitReadiness = read(sourceDocs.artifactCommitReadiness);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const collectorParity = read(sourceDocs.collectorParity);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(artifactCommitReadiness, /runtime metric collector approvals: 0/);
  assert.match(artifactCommitReadiness, /implementation-ready artifact commit rows: 0/);
  assert.match(artifactCommitReadiness, /method semantic proof gap files covered: 69/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorInsertion, /collector rows implementation-ready: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorNoWork, /collector no-work rows implementation-ready: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorSideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(collectorFixture, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(diagnosticPrivacy, /Committed diagnostic privacy files: 0/);
  assert.match(diagnosticPrivacy, /Implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(collectorParity, /runtime collector parity rollout proofs approved: 0/);
  assert.match(collectorParity, /collector parity rollout rows implementation-ready: 0/);
  assert.match(verificationOutput, /Committed verification output files: 0/);
  assert.match(verificationOutput, /Implementation-ready verification output contract rows: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(rollbackUnclaimed, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5673/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /fail 0/);
});

test('collector approval current source anchors still expose measurement side-effect risks', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');

  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('new Response(JSON.stringify(processed)'));
  assert.ok(seed.includes('proto.addEventListener = function (type, listener, options)'));
  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));
  assert.ok(contentBridge.includes('whitelistPendingRefreshState.timer = setTimeout'));
  assert.ok(contentBridge.includes('const observer = new MutationObserver(() => {'));
  assert.ok(domFallback.includes('function hasActiveDOMFallbackWork(settings)'));
  assert.ok(domFallback.includes('setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0)'));
  assert.ok(blockChannel.includes('function setupQuickBlockObserver()'));
  assert.ok(blockChannel.includes('quickBlockSweepTimer = setTimeout(() =>'));
  assert.ok(handleResolver.includes("resolvedHandleCache.set(cleanHandle, 'PENDING')"));
  assert.ok(background.includes('browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse)'));
  assert.ok(background.includes('browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) =>'));
  assert.ok(stateManager.includes('chrome.storage.onChanged.addListener(async (changes, area) =>'));
  assert.ok(stateManager.includes('externalReloadTimer = setTimeout(() =>'));
});

test('collector approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }
});

test('collector approval boundary is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    read(sourceDocs.artifactCommitReadiness),
    read(sourceDocs.collectorInsertion),
    read(sourceDocs.collectorNoWork),
    read(sourceDocs.collectorSideEffect),
    read(sourceDocs.collectorFixture),
    read(sourceDocs.collectorParity),
    read(sourceDocs.implementationReadiness)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization collector approval authority boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /First optimization collector approval authority boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization collector approval authority boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization collector approval authority boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization collector approval authority boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
});
