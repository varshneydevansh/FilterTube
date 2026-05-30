import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs';
const verificationOutputPath = 'docs/audit/artifacts/first-optimization/metric-foundation/verification-output.tap';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  parityRolloutContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  diagnosticPrivacyContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectBudgetContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  noWorkPreservationContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenanceContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSampleContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  foundationPacket: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedVerificationRows = [
  'FT-VERIFY-OUTPUT-00-packet-binding',
  'FT-VERIFY-OUTPUT-01-artifact-binding',
  'FT-VERIFY-OUTPUT-02-command-contract',
  'FT-VERIFY-OUTPUT-03-runtime-counts',
  'FT-VERIFY-OUTPUT-04-tap-format',
  'FT-VERIFY-OUTPUT-05-artifact-absence-check',
  'FT-VERIFY-OUTPUT-06-authority-token-check',
  'FT-VERIFY-OUTPUT-07-source-of-truth-register',
  'FT-VERIFY-OUTPUT-08-adjacent-gate-chain',
  'FT-VERIFY-OUTPUT-09-rollback-unclaimed-surfaces',
  'FT-VERIFY-OUTPUT-10-diagnostic-parity-release-boundary',
  'FT-VERIFY-OUTPUT-11-persistence-gate'
];

const expectedVerificationClosureRows = [
  'FT-VERIFY-OUTPUT-CLOSURE-00-packet-binding',
  'FT-VERIFY-OUTPUT-CLOSURE-01-artifact-binding',
  'FT-VERIFY-OUTPUT-CLOSURE-02-command-contract',
  'FT-VERIFY-OUTPUT-CLOSURE-03-runtime-counts',
  'FT-VERIFY-OUTPUT-CLOSURE-04-tap-format',
  'FT-VERIFY-OUTPUT-CLOSURE-05-artifact-absence-check',
  'FT-VERIFY-OUTPUT-CLOSURE-06-authority-token-check',
  'FT-VERIFY-OUTPUT-CLOSURE-07-source-of-truth-register',
  'FT-VERIFY-OUTPUT-CLOSURE-08-adjacent-gate-chain',
  'FT-VERIFY-OUTPUT-CLOSURE-09-rollback-unclaimed-surfaces',
  'FT-VERIFY-OUTPUT-CLOSURE-10-diagnostic-parity-release-boundary',
  'FT-VERIFY-OUTPUT-CLOSURE-11-persistence-gate'
];

const requiredVerificationFields = [
  'verificationVersion',
  'verificationRunId',
  'packetId',
  'candidateId',
  'bindingId',
  'obligationId',
  'manifestId',
  'sampleId',
  'parityRolloutId',
  'diagnosticPrivacyId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'packetManifestPath',
  'metricSamplePath',
  'sourceOwnerMapPath',
  'fixtureProvenancePath',
  'noWorkPreservationPath',
  'sideEffectBudgetPath',
  'diagnosticPrivacyPath',
  'parityRolloutPath',
  'verificationOutputPath',
  'verificationCommand',
  'workingDirectory',
  'nodeVersion',
  'packageScript',
  'commandExitCode',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'actualTests',
  'actualPass',
  'actualFail',
  'runtimeResultsPath',
  'tapVersion',
  'tapPath',
  'notOkCount',
  'failureExcerptPolicy',
  'reservedArtifactPaths',
  'committedArtifactFiles',
  'artifactAbsenceCommand',
  'artifactAbsenceResult',
  'authorityTokenAbsenceCheck',
  'scopedProductSourceRoots',
  'futureAuthorityTokens',
  'runtimeTokenMatches',
  'documentationTokenMatches',
  'sourceOfTruthRegisterPath',
  'sourceOfTruthRuntimeResultsLine',
  'sourceTierClaimClass',
  'behaviorPermissionStatus',
  'callableOwnerProofStatus',
  'adjacentCommand',
  'adjacentExpectedTests',
  'gateDocsCovered',
  'gateTestsCovered',
  'rollbackBoundary',
  'rollbackCommand',
  'unclaimedSurfaces',
  'unclaimedNativeSurfaces',
  'unclaimedReleaseSurfaces',
  'unclaimedPublicClaims',
  'nativeSyncStatus',
  'releasePackageStatus',
  'publicClaimStatus',
  'rawCaptureExclusionStatus',
  'performanceClaimScope',
  'verificationOutputPersistencePolicy',
  'tapRetentionPolicy',
  'artifactCommitGate',
  'collectorApprovalGate',
  'optimizationApprovalGate',
  'releaseClaimGate',
  'publicClaimGate'
];

const futureAuthorityTokens = [
  'firstOptimizationVerificationOutputContract',
  'firstOptimizationVerificationOutputReport',
  'firstOptimizationVerificationOutputApproval',
  'firstOptimizationVerificationOutputNoGoBoundary',
  'jsonFirstOptimizationVerificationOutput',
  'jsonFirstVerificationOutputAuthority',
  'metricArtifactVerificationOutputCollector',
  'metricArtifactVerificationOutputRuntimeApproval',
  'metricArtifactVerificationOutputPersistence',
  'whitelistOptimizationVerificationOutputBudget',
  'releasePackageVerificationOutputApproval',
  'publicClaimVerificationOutputApproval',
  'nativeSyncVerificationOutputApproval',
  'rawCaptureVerificationOutputExclusionProof',
  'verificationOutputDraftClosure',
  'verificationOutputDraftClosureRuntimeApproval',
  'verificationOutputDraftPersistenceApproval',
  'verificationOutputDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineVerificationOutputShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline verification output metadata JSON block');
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
  return ['js', 'build.js', 'scripts']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization verification output contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization verification output/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved verification output path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/verification-output\.tap/);
  assert.match(doc, /Committed verification output files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready verification output contract rows: 0/);
  assert.match(doc, /not completion proof for verification output authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('verification output contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-VERIFY-OUTPUT-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-VERIFY-OUTPUT-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedVerificationRows);
  assert.deepEqual(closureRows, expectedVerificationClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization verification output contract rows: 12/);
  assert.match(doc, /reserved verification output paths covered: 1/);
  assert.match(doc, /committed verification output files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready verification output contract rows: 0/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /side-effect budget contract rows covered: 12/);
  assert.match(doc, /no-work preservation contract rows covered: 12/);
  assert.match(doc, /fixture provenance contract rows covered: 12/);
  assert.match(doc, /source owner map contract rows covered: 12/);
  assert.match(doc, /metric sample contract rows covered: 12/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /artifact path boundary rows covered: 10/);
  assert.match(doc, /foundation packet rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 63/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5469/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5469/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /inline verification output JSON sections covered: 12/);
  assert.match(doc, /inline verification output artifact promotion decision: NO-GO/);
  assert.match(doc, /verification output draft closure rows: 12/);
  assert.match(doc, /verification output rows linked by closure: 12/);
  assert.match(doc, /inline verification output JSON sections linked by closure: 12/);
  assert.match(doc, /parity rollout contract rows linked by verification closure: 12/);
  assert.match(doc, /diagnostic privacy contract rows linked by verification closure: 12/);
  assert.match(doc, /side-effect budget contract rows linked by verification closure: 12/);
  assert.match(doc, /no-work preservation contract rows linked by verification closure: 12/);
  assert.match(doc, /fixture provenance contract rows linked by verification closure: 12/);
  assert.match(doc, /source owner map contract rows linked by verification closure: 12/);
  assert.match(doc, /metric sample contract rows linked by verification closure: 12/);
  assert.match(doc, /manifest contract rows linked by verification closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by verification closure: 10/);
  assert.match(doc, /foundation packet rows linked by verification closure: 12/);
  assert.match(doc, /metric schema rows linked by verification closure: 12/);
  assert.match(doc, /metric source-owner rows linked by verification closure: 12/);
  assert.match(doc, /collector readiness families linked by verification closure: 5/);
  assert.match(doc, /method semantic proof gap files linked by verification closure: 63/);
  assert.match(doc, /lexical callables linked by verification closure: 5469/);
  assert.match(doc, /runtime fixture result count rows linked by verification closure: 3/);
  assert.match(doc, /runtime verification output closure approvals: 0/);
  assert.match(doc, /persisted verification output closure approvals: 0/);
  assert.match(doc, /implementation-ready verification output closure rows: 0/);
  assert.match(doc, /verification output draft closure: VERIFICATION-OUTPUT-CHAIN-CLOSED/);
  assert.match(doc, /verification output implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredVerificationFields) {
    assert.ok(doc.includes(field), `missing verification output field ${field}`);
  }

  const verificationShape = inlineVerificationOutputShape();
  const verificationRows = verificationShape.sections.map((section) => section.id);
  const verificationSections = verificationShape.sections.map((section) => section.section);
  const inlineFields = new Set(verificationShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(verificationShape.verificationVersion, 'verification-output-draft-2026-05-29');
  assert.equal(verificationShape.verificationRunId, 'FT-VERIFY-OUTPUT-DRAFT-00');
  assert.equal(verificationShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(verificationShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(verificationShape.manifestId, 'FT-PACKET-MANIFEST-DRAFT-00');
  assert.equal(verificationShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(verificationShape.parityRolloutId, 'FT-PARITY-ROLLOUT-DRAFT-00');
  assert.equal(verificationShape.diagnosticPrivacyId, 'FT-DIAGNOSTIC-PRIVACY-DRAFT-00');
  assert.equal(verificationShape.verificationOutputPath, verificationOutputPath);
  assert.equal(verificationShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(verificationShape.runtimeBehaviorChanged, false);
  assert.deepEqual(verificationRows, expectedVerificationRows);
  assert.equal(new Set(verificationSections).size, 12);

  for (const field of requiredVerificationFields) {
    assert.ok(inlineFields.has(field), `inline verification output metadata missing field ${field}`);
  }

  for (const section of verificationShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('verification output path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const verificationShape = inlineVerificationOutputShape();

  assert.ok(doc.includes(verificationOutputPath));
  assert.equal(verificationShape.verificationOutputPath, verificationOutputPath);
  assert.equal(verificationShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, verificationOutputPath)), false, `${verificationOutputPath} should not exist yet`);
});

test('verification output contract is backed by current metric artifact gates', () => {
  const parityRolloutContract = read(sourceDocs.parityRolloutContract);
  const methodGap = read(sourceDocs.methodGap);
  const diagnosticPrivacyContract = read(sourceDocs.diagnosticPrivacyContract);
  const sideEffectBudgetContract = read(sourceDocs.sideEffectBudgetContract);
  const noWorkPreservationContract = read(sourceDocs.noWorkPreservationContract);
  const fixtureProvenanceContract = read(sourceDocs.fixtureProvenanceContract);
  const sourceOwnerMapContract = read(sourceDocs.sourceOwnerMapContract);
  const metricSampleContract = read(sourceDocs.metricSampleContract);
  const manifestContract = read(sourceDocs.manifestContract);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const foundationPacket = read(sourceDocs.foundationPacket);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(parityRolloutContract, /Committed parity rollout files: 0/);
  assert.match(parityRolloutContract, /Implementation-ready parity rollout contract rows: 0/);
  assert.match(parityRolloutContract, /method semantic proof gap files covered: 63/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 63/);
  assert.match(methodGap, /repo-wide lexical callables: 5469/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5469/);
  assert.match(diagnosticPrivacyContract, /Committed diagnostic privacy files: 0/);
  assert.match(sideEffectBudgetContract, /Committed side-effect budget files: 0/);
  assert.match(noWorkPreservationContract, /Committed no-work preservation files: 0/);
  assert.match(fixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(sourceOwnerMapContract, /Committed source owner map files: 0/);
  assert.match(metricSampleContract, /Committed metric sample files: 0/);
  assert.match(manifestContract, /Committed packet manifest files: 0/);
  assert.match(pathBoundary, /FT-ARTIFACTPATH-09-verification-output/);
  assert.match(pathBoundary, /Committed foundation metric artifact files: 0/);
  assert.match(foundationPacket, /required foundation metric artifact packet exists: no/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /fail 0/);
});

test('verification output authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('verification output contract is linked from audit ledgers and upstream gates', () => {
  const doc = read(docPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    ...Object.entries(sourceDocs)
      .filter(([key]) => key !== 'methodGap')
      .map(([, sourceDoc]) => read(sourceDoc))
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization verification output contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization verification output contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization verification output contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization verification output contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization verification output contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(doc, /close verification output documentation chain now: GO/);
  assert.match(doc, /accept verification output closure as persisted verification output approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as native sync approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as release package approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as public claim approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept verification output closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
