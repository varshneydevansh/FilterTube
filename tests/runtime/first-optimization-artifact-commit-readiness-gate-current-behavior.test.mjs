import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-artifact-commit-readiness-gate-current-behavior.test.mjs';
const artifactRoot = 'docs/audit/artifacts/first-optimization/metric-foundation/';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  pathBoundary: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  foundationPacket: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md',
  contractCoverage: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  noWorkPreservation: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectBudget: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const contractArtifacts = [
  {
    id: 'packet-manifest',
    reservedPath: `${artifactRoot}packet-manifest.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs',
    inlinePathKey: 'packetManifestPath',
    committedPattern: /Committed packet manifest files: 0/,
    readyPattern: /Implementation-ready manifest contract rows: 0/
  },
  {
    id: 'metric-sample',
    reservedPath: `${artifactRoot}metric-sample.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs',
    inlinePathKey: 'metricSamplePath',
    committedPattern: /Committed metric sample files: 0/,
    readyPattern: /Implementation-ready metric sample contract rows: 0/
  },
  {
    id: 'source-owner-map',
    reservedPath: `${artifactRoot}source-owner-map.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-source-owner-map-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_DRAFT_READINESS_CURRENT_BEHAVIOR_2026-05-29.md',
    inlineTest: 'tests/runtime/first-optimization-source-owner-map-draft-readiness-current-behavior.test.mjs',
    inlinePathKey: 'artifactPath',
    committedPattern: /Committed source owner map files: 0/,
    readyPattern: /Implementation-ready source owner map contract rows: 0/
  },
  {
    id: 'fixture-provenance',
    reservedPath: `${artifactRoot}fixture-provenance.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs',
    inlinePathKey: 'fixtureProvenancePath',
    committedPattern: /Committed fixture provenance files: 0/,
    readyPattern: /Implementation-ready fixture provenance contract rows: 0/
  },
  {
    id: 'no-work-preservation',
    reservedPath: `${artifactRoot}no-work-preservation.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs',
    inlinePathKey: 'noWorkPath',
    committedPattern: /Committed no-work preservation files: 0/,
    readyPattern: /Implementation-ready no-work preservation contract rows: 0/
  },
  {
    id: 'side-effect-budget',
    reservedPath: `${artifactRoot}side-effect-budget.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs',
    inlinePathKey: 'sideEffectPath',
    committedPattern: /Committed side-effect budget files: 0/,
    readyPattern: /Implementation-ready side-effect budget contract rows: 0/
  },
  {
    id: 'diagnostic-privacy',
    reservedPath: `${artifactRoot}diagnostic-privacy.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs',
    inlinePathKey: 'diagnosticPrivacyPath',
    committedPattern: /Committed diagnostic privacy files: 0/,
    readyPattern: /Implementation-ready diagnostic privacy contract rows: 0/
  },
  {
    id: 'parity-rollout',
    reservedPath: `${artifactRoot}parity-rollout.json`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs',
    inlinePathKey: 'parityRolloutPath',
    committedPattern: /Committed parity rollout files: 0/,
    readyPattern: /Implementation-ready parity rollout contract rows: 0/
  },
  {
    id: 'verification-output',
    reservedPath: `${artifactRoot}verification-output.tap`,
    doc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    test: 'tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs',
    inlineDoc: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
    inlineTest: 'tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs',
    inlinePathKey: 'verificationOutputPath',
    committedPattern: /Committed verification output files: 0/,
    readyPattern: /Implementation-ready verification output contract rows: 0/
  }
];

const expectedRows = [
  'FT-ARTIFACT-COMMIT-READY-00-root-boundary',
  'FT-ARTIFACT-COMMIT-READY-01-reserved-path-set',
  'FT-ARTIFACT-COMMIT-READY-02-contract-set-complete',
  'FT-ARTIFACT-COMMIT-READY-03-artifact-absence',
  'FT-ARTIFACT-COMMIT-READY-04-collector-approval',
  'FT-ARTIFACT-COMMIT-READY-05-no-work-side-effect',
  'FT-ARTIFACT-COMMIT-READY-06-fixture-provenance',
  'FT-ARTIFACT-COMMIT-READY-07-diagnostic-privacy',
  'FT-ARTIFACT-COMMIT-READY-08-parity-verification',
  'FT-ARTIFACT-COMMIT-READY-09-rollback-unclaimed',
  'FT-ARTIFACT-COMMIT-READY-10-release-public',
  'FT-ARTIFACT-COMMIT-READY-11-ledger-runtime-results'
];

const closureRows = [
  'FT-ARTIFACT-COMMIT-CLOSURE-00-root-boundary',
  'FT-ARTIFACT-COMMIT-CLOSURE-01-reserved-path-set',
  'FT-ARTIFACT-COMMIT-CLOSURE-02-contract-set-complete',
  'FT-ARTIFACT-COMMIT-CLOSURE-03-artifact-absence',
  'FT-ARTIFACT-COMMIT-CLOSURE-04-collector-approval',
  'FT-ARTIFACT-COMMIT-CLOSURE-05-no-work-side-effect',
  'FT-ARTIFACT-COMMIT-CLOSURE-06-fixture-provenance',
  'FT-ARTIFACT-COMMIT-CLOSURE-07-diagnostic-privacy',
  'FT-ARTIFACT-COMMIT-CLOSURE-08-parity-verification',
  'FT-ARTIFACT-COMMIT-CLOSURE-09-rollback-unclaimed',
  'FT-ARTIFACT-COMMIT-CLOSURE-10-release-public',
  'FT-ARTIFACT-COMMIT-CLOSURE-11-ledger-runtime-results'
];

const requiredFields = [
  'artifactRoot',
  'artifactRootExists',
  'artifactRootCommitDecision',
  'artifactRootOwner',
  'auditDirectoryBoundary',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'reservedArtifactPaths',
  'reservedArtifactCount',
  'contractDocs',
  'contractTests',
  'pathBoundaryDoc',
  'pathBoundaryTest',
  'metricFoundationContractCoverageDoc',
  'contractCoverageRows',
  'contractDocsCovered',
  'contractTestsCovered',
  'contractCoverageApprovalStatus',
  'committedArtifactFiles',
  'artifactAbsenceCommand',
  'artifactAbsenceResult',
  'artifactCommitGate',
  'verificationOutputAbsent',
  'collectorApprovalStatus',
  'collectorInsertionApprovalStatus',
  'runtimeAuthorityTokens',
  'runtimeAuthorityMatches',
  'scopedProductSourceRoots',
  'noWorkApprovalStatus',
  'sideEffectBudgetApprovalStatus',
  'disabledModeProof',
  'emptyListProof',
  'sideEffectBudgetProof',
  'fixtureProvenanceApprovalStatus',
  'rawSourceBoundary',
  'fixturePacketStatus',
  'positiveFixtureProof',
  'negativeFixtureProof',
  'releaseInputExclusion',
  'diagnosticPrivacyApprovalStatus',
  'consolePrivacyClass',
  'redactionPolicy',
  'debugGate',
  'metricReplacementPolicy',
  'parityRolloutApprovalStatus',
  'verificationOutputApprovalStatus',
  'jsonDomParityStatus',
  'nativeParityStatus',
  'tapPersistenceStatus',
  'rollbackBoundaryStatus',
  'rollbackCommandStatus',
  'unclaimedSurfaceStatus',
  'unclaimedNativeSurfaces',
  'unclaimedReleaseSurfaces',
  'unclaimedPublicClaims',
  'nativeSyncStatus',
  'releasePackageStatus',
  'rawCaptureExclusionStatus',
  'publicClaimStatus',
  'releaseClaimGate',
  'publicClaimGate',
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
  'firstOptimizationArtifactCommitReadinessGate',
  'firstOptimizationArtifactCommitReadinessReport',
  'firstOptimizationArtifactCommitApproval',
  'firstOptimizationArtifactCommitNoGoBoundary',
  'metricFoundationArtifactCommitReadinessAuthority',
  'metricFoundationArtifactCommitCollector',
  'jsonFirstArtifactCommitApproval',
  'whitelistArtifactCommitApproval',
  'nativeSyncArtifactCommitApproval',
  'releasePackageArtifactCommitApproval',
  'publicClaimArtifactCommitApproval',
  'rawCaptureArtifactCommitExclusionProof',
  'artifactCommitRollbackApproval',
  'artifactCommitUnclaimedSurfaceApproval',
  'firstOptimizationArtifactCommitBlockerClosure',
  'metricFoundationArtifactCommitClosureApproval',
  'metricFoundationArtifactCommitImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineDraftShape(file) {
  const doc = read(file);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, `missing inline draft JSON block in ${file}`);
  return JSON.parse(match[1]);
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

test('first optimization artifact commit readiness gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization artifact commit/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /Reserved artifact root: docs\/audit\/artifacts\/first-optimization\/metric-foundation\//);
  assert.match(doc, /Committed metric foundation artifact files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Runtime rollback approval exists: no/);
  assert.match(doc, /Runtime unclaimed-surface approval exists: no/);
  assert.match(doc, /Implementation-ready artifact commit rows: 0/);
  assert.match(doc, /first optimization artifact commit blocker closure rows: 12/);
  assert.match(doc, /artifact commit rows covered by closure: 12/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /inline draft sources linked by closure: 9/);
  assert.match(doc, /inline draft verifier tests linked by closure: 9/);
  assert.match(doc, /artifact promotion approvals from closure: 0/);
  assert.match(doc, /runtime optimization approvals from closure: 0/);
  assert.match(doc, /artifact commit blocker closure: BLOCKER-CHAIN-CLOSED/);
  assert.match(doc, /artifact commit readiness from closure: NO-GO/);
  assert.match(doc, /affected callable set\s+and method semantic proof status/);
  assert.match(doc, /not completion proof for artifact commit authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
  for (const contract of contractArtifacts) {
    assert.ok(doc.includes(contract.doc), `missing contract doc ${contract.doc}`);
    assert.ok(doc.includes(contract.test), `missing contract test ${contract.test}`);
    assert.ok(doc.includes(contract.reservedPath), `missing reserved path ${contract.reservedPath}`);
    assert.ok(doc.includes(contract.inlineDoc), `missing inline draft doc ${contract.inlineDoc}`);
    assert.ok(doc.includes(contract.inlineTest), `missing inline draft test ${contract.inlineTest}`);
  }
});

test('artifact commit readiness rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-ARTIFACT-COMMIT-READY-[^`]+)` \|/gm)].map((row) => row[1]);
  const foundClosureRows = [...doc.matchAll(/^\| `(FT-ARTIFACT-COMMIT-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.deepEqual(foundClosureRows, closureRows);
  assert.equal(rows.length, 12);
  assert.equal(foundClosureRows.length, 12);
  for (const row of expectedRows) {
    const references = [...doc.matchAll(new RegExp(`\\b${row}\\b`, 'g'))].length;
    assert.ok(references >= 2, `commit row ${row} is not linked from closure`);
  }
  assert.match(doc, /first optimization artifact commit readiness rows: 12/);
  assert.match(doc, /reserved artifact roots covered: 1/);
  assert.match(doc, /reserved artifact files covered: 9/);
  assert.match(doc, /metric foundation contract docs covered: 9/);
  assert.match(doc, /metric foundation contract tests covered: 9/);
  assert.match(doc, /metric foundation inline draft sources covered: 9/);
  assert.match(doc, /metric foundation inline draft verifier tests covered: 9/);
  assert.match(doc, /metric foundation inline draft sections covered: 108/);
  assert.match(doc, /metric foundation inline draft artifact promotion decisions: 9 NO-GO/);
  assert.match(doc, /combined metric-foundation inline artifact chain plus coverage gate verifier tests observed: 61/);
  assert.match(doc, /committed metric foundation artifact files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /implementation-ready artifact commit rows: 0/);
  assert.match(doc, /contract coverage rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /foundation packet rows covered: 12/);
  assert.match(doc, /artifact path boundary rows covered: 10/);
  assert.match(doc, /implementation readiness rows covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /first optimization artifact commit blocker closure rows: 12/);
  assert.match(doc, /artifact commit rows covered by closure: 12/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /inline draft sources linked by closure: 9/);
  assert.match(doc, /inline draft verifier tests linked by closure: 9/);
  assert.match(doc, /artifact promotion approvals from closure: 0/);
  assert.match(doc, /runtime optimization approvals from closure: 0/);
  assert.match(doc, /artifact commit blocker closure: BLOCKER-CHAIN-CLOSED/);
  assert.match(doc, /artifact commit readiness from closure: NO-GO/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing artifact commit field ${field}`);
  }
});

test('reserved metric foundation artifact root and files remain absent', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(artifactRoot));
  assert.equal(fs.existsSync(path.join(repoRoot, artifactRoot)), false, `${artifactRoot} should not exist yet`);

  for (const contract of contractArtifacts) {
    assert.ok(doc.includes(contract.reservedPath), `missing reserved path ${contract.reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, contract.reservedPath)), false, `${contract.reservedPath} should not exist yet`);
  }
});

test('artifact commit readiness is backed by current gates and contract docs', () => {
  const pathBoundary = read(sourceDocs.pathBoundary);
  const foundationPacket = read(sourceDocs.foundationPacket);
  const contractCoverage = read(sourceDocs.contractCoverage);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const methodGap = read(sourceDocs.methodGap);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const parityRollout = read(sourceDocs.parityRollout);
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const noWorkPreservation = read(sourceDocs.noWorkPreservation);
  const sideEffectBudget = read(sourceDocs.sideEffectBudget);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(pathBoundary, /committed foundation metric artifact files: 0/);
  assert.match(pathBoundary, /implementation-ready artifact path rows: 0/);
  assert.match(foundationPacket, /Required foundation metric artifact packet exists: no/);
  assert.match(foundationPacket, /runtime metric collectors approved: 0/);
  assert.match(contractCoverage, /Metric foundation contract docs covered: 9/);
  assert.match(contractCoverage, /Metric foundation contract tests covered: 9/);
  assert.match(contractCoverage, /metric foundation inline draft sources covered: 9/);
  assert.match(contractCoverage, /metric foundation inline draft verifier tests covered: 9/);
  assert.match(contractCoverage, /metric foundation inline draft sections covered: 108/);
  assert.match(contractCoverage, /metric foundation inline draft artifact promotion decisions: 9 NO-GO/);
  assert.match(contractCoverage, /combined metric-foundation inline artifact chain plus coverage gate verifier tests observed: 61/);
  assert.match(contractCoverage, /method semantic proof gap files covered: 69/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(rollbackUnclaimed, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(verificationOutput, /Committed verification output files: 0/);
  assert.match(parityRollout, /Committed parity rollout files: 0/);
  assert.match(diagnosticPrivacy, /Committed diagnostic privacy files: 0/);
  assert.match(noWorkPreservation, /Committed no-work preservation files: 0/);
  assert.match(sideEffectBudget, /Committed side-effect budget files: 0/);
  assert.match(fixtureProvenance, /Committed fixture provenance files: 0/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /fail 0/);

  for (const contract of contractArtifacts) {
    const contractDoc = read(contract.doc);
    const inlineDoc = read(contract.inlineDoc);
    const shape = inlineDraftShape(contract.inlineDoc);

    assert.match(contractDoc, contract.committedPattern, `missing committed-zero proof for ${contract.id}`);
    assert.match(contractDoc, contract.readyPattern, `missing ready-zero proof for ${contract.id}`);
    assert.ok(fs.existsSync(path.join(repoRoot, contract.test)), `missing runtime test ${contract.test}`);
    assert.ok(inlineDoc.includes(contract.reservedPath), `missing reserved path in ${contract.id} inline draft doc`);
    assert.equal(shape[contract.inlinePathKey], contract.reservedPath, `${contract.id} inline path mismatch`);
    assert.equal(shape.artifactPromotionDecision, 'NO-GO', `${contract.id} inline artifact promotion decision changed`);
    assert.equal(shape.runtimeBehaviorChanged, false, `${contract.id} inline runtime behavior flag changed`);
    assert.equal(shape.sections.length, 12, `${contract.id} inline section count changed`);
    assert.ok(fs.existsSync(path.join(repoRoot, contract.inlineTest)), `missing inline verifier test ${contract.inlineTest}`);
  }

  const inlineSectionCount = contractArtifacts
    .map((contract) => inlineDraftShape(contract.inlineDoc).sections.length)
    .reduce((total, count) => total + count, 0);
  const inlineNoGoCount = contractArtifacts
    .filter((contract) => inlineDraftShape(contract.inlineDoc).artifactPromotionDecision === 'NO-GO')
    .length;
  const releaseFixStatus = read('docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md');

  assert.equal(inlineSectionCount, 108);
  assert.equal(inlineNoGoCount, 9);
  assert.match(releaseFixStatus, /combined metric-foundation inline artifact chain plus coverage gate verifier after 2026-05-29 continuation: 61\/61 pass/);
});

test('artifact commit readiness future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const decision of [
    'close artifact commit blocker documentation chain now: GO',
    'accept blocker closure as artifact root creation approval now: NO-GO',
    'accept blocker closure as artifact file commit approval now: NO-GO',
    'accept blocker closure as collector insertion approval now: NO-GO',
    'accept blocker closure as verification-output persistence approval now: NO-GO',
    'accept blocker closure as rollback implementation approval now: NO-GO',
    'accept blocker closure as JSON-first runtime behavior approval now: NO-GO',
    'accept blocker closure as whitelist optimization approval now: NO-GO',
    'accept blocker closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing closure decision ${decision}`);
  }

  assert.match(doc, /Root remains absent; callable proof is incomplete/);
  assert.match(doc, /Path set is named only; no reserved artifact file is committed/);
  assert.match(doc, /Contract coverage exists; it is not artifact approval/);
  assert.match(doc, /Ledger evidence is audit-only and cannot approve artifact commits/);
});

test('artifact commit readiness gate is linked from audit ledgers and source gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    read(sourceDocs.pathBoundary),
    read(sourceDocs.foundationPacket),
    read(sourceDocs.contractCoverage),
    read(sourceDocs.rollbackUnclaimed),
    read(sourceDocs.implementationReadiness)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization artifact commit readiness gate addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /First optimization artifact commit readiness gate addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization artifact commit readiness gate addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization artifact commit readiness gate addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization artifact commit readiness gate addendum:[\s\S]*69 method semantic proof gap files covered/);
});
