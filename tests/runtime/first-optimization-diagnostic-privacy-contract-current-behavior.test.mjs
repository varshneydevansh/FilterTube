import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs';
const diagnosticPrivacyPath = 'docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
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
  diagnosticLoggingPolicy: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedDiagnosticRows = [
  'FT-DIAGNOSTIC-PRIVACY-00-packet-binding',
  'FT-DIAGNOSTIC-PRIVACY-01-artifact-binding',
  'FT-DIAGNOSTIC-PRIVACY-02-console-inventory',
  'FT-DIAGNOSTIC-PRIVACY-03-owner-reason-scope',
  'FT-DIAGNOSTIC-PRIVACY-04-privacy-class',
  'FT-DIAGNOSTIC-PRIVACY-05-redaction-policy',
  'FT-DIAGNOSTIC-PRIVACY-06-debug-gate',
  'FT-DIAGNOSTIC-PRIVACY-07-metric-replacement',
  'FT-DIAGNOSTIC-PRIVACY-08-no-work-budget',
  'FT-DIAGNOSTIC-PRIVACY-09-fixture-provenance',
  'FT-DIAGNOSTIC-PRIVACY-10-release-public-scope',
  'FT-DIAGNOSTIC-PRIVACY-11-verification'
];

const expectedDiagnosticClosureRows = [
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-00-packet-binding',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-01-artifact-binding',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-02-console-inventory',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-03-owner-reason-scope',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-04-privacy-class',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-05-redaction-policy',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-06-debug-gate',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-07-metric-replacement',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-08-no-work-budget',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-09-fixture-provenance',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-10-release-public-scope',
  'FT-DIAGNOSTIC-PRIVACY-CLOSURE-11-verification'
];

const requiredDiagnosticFields = [
  'privacyVersion',
  'privacyId',
  'packetId',
  'sampleId',
  'sideEffectBudgetId',
  'noWorkPreservationId',
  'candidateId',
  'bindingId',
  'obligationId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'diagnosticPrivacyPath',
  'consoleInventoryId',
  'sourceFileCount',
  'activeConsoleCallsites',
  'consoleLogCount',
  'consoleWarnCount',
  'consoleErrorCount',
  'consoleDebugCount',
  'consoleInfoCount',
  'ownerFamilyTotals',
  'logOwner',
  'callableOwnerProofStatus',
  'logReason',
  'logLevel',
  'route',
  'surface',
  'profileType',
  'listMode',
  'privacyClass',
  'payloadClass',
  'identityPayloadPolicy',
  'importPayloadPolicy',
  'urlPayloadPolicy',
  'profilePayloadPolicy',
  'channelIdPolicy',
  'handlePolicy',
  'collaboratorPolicy',
  'redactionPolicy',
  'redactedFields',
  'redactionProof',
  'negativeLeakFixture',
  'debugGate',
  'debugModeSource',
  'debugDisabledBehavior',
  'consoleBudget',
  'diagnosticLogBudget',
  'metricReplacementPolicy',
  'machineReadableArtifact',
  'metricReplacementPath',
  'consoleToMetricParity',
  'noWorkBudget',
  'diagnosticNoWorkFixture',
  'disabledBudget',
  'noRuleBudget',
  'emptyListBudget',
  'fixtureProvenanceId',
  'positiveFixture',
  'negativeSiblingFixture',
  'rawSourceExcluded',
  'releaseInputExcluded',
  'publicClaimScope',
  'nativeParityBudget',
  'rolloutBoundary',
  'rollbackBoundary',
  'unclaimedSurfaces',
  'verificationCommand',
  'expectedTests',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'firstOptimizationDiagnosticPrivacyContract',
  'firstOptimizationDiagnosticPrivacyReport',
  'firstOptimizationDiagnosticPrivacyApproval',
  'firstOptimizationDiagnosticPrivacyNoGoBoundary',
  'jsonFirstOptimizationDiagnosticPrivacy',
  'jsonFirstDiagnosticPrivacyAuthority',
  'metricArtifactDiagnosticPrivacyCollector',
  'metricArtifactDiagnosticPrivacyVerification',
  'metricArtifactDiagnosticPrivacyRuntimeApproval',
  'whitelistOptimizationDiagnosticPrivacyBudget',
  'diagnosticPrivacyMetricReplacementPolicy',
  'diagnosticPrivacyRedactionProof',
  'diagnosticPrivacyDraftClosure',
  'diagnosticPrivacyDraftClosureRuntimeApproval',
  'diagnosticPrivacyDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineDiagnosticPrivacyShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline diagnostic privacy JSON block');
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

test('first optimization diagnostic privacy contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization diagnostic privacy/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved diagnostic privacy path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/diagnostic-privacy\.json/);
  assert.match(doc, /Committed diagnostic privacy files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(doc, /not completion proof for diagnostic privacy authority/);
  assert.match(doc, /affected callable set and method semantic proof status/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('diagnostic privacy contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-DIAGNOSTIC-PRIVACY-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-DIAGNOSTIC-PRIVACY-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedDiagnosticRows);
  assert.deepEqual(closureRows, expectedDiagnosticClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization diagnostic privacy contract rows: 12/);
  assert.match(doc, /reserved diagnostic privacy paths covered: 1/);
  assert.match(doc, /committed diagnostic privacy files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready diagnostic privacy contract rows: 0/);
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
  assert.match(doc, /diagnostic logging policy source files covered: 21/);
  assert.match(doc, /active console callsites covered: 418/);
  assert.match(doc, /console\.log callsites covered: 203/);
  assert.match(doc, /console\.warn callsites covered: 123/);
  assert.match(doc, /console\.error callsites covered: 68/);
  assert.match(doc, /console\.debug callsites covered: 24/);
  assert.match(doc, /console\.info callsites covered: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /inline diagnostic privacy JSON sections covered: 12/);
  assert.match(doc, /inline diagnostic privacy artifact promotion decision: NO-GO/);
  assert.match(doc, /diagnostic privacy draft closure rows: 12/);
  assert.match(doc, /diagnostic privacy rows linked by closure: 12/);
  assert.match(doc, /inline diagnostic privacy JSON sections linked by closure: 12/);
  assert.match(doc, /side-effect budget contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /no-work preservation contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /fixture provenance contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /source owner map contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /metric sample contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /manifest contract rows linked by diagnostic closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by diagnostic closure: 10/);
  assert.match(doc, /foundation packet rows linked by diagnostic closure: 12/);
  assert.match(doc, /metric schema rows linked by diagnostic closure: 12/);
  assert.match(doc, /metric source-owner rows linked by diagnostic closure: 12/);
  assert.match(doc, /collector readiness families linked by diagnostic closure: 5/);
  assert.match(doc, /diagnostic logging policy source files linked by diagnostic closure: 21/);
  assert.match(doc, /active console callsites linked by diagnostic closure: 418/);
  assert.match(doc, /method semantic proof gap files linked by diagnostic closure: 69/);
  assert.match(doc, /lexical callables linked by diagnostic closure: 5830/);
  assert.match(doc, /runtime diagnostic privacy closure approvals: 0/);
  assert.match(doc, /implementation-ready diagnostic privacy closure rows: 0/);
  assert.match(doc, /diagnostic privacy draft closure: DIAGNOSTIC-PRIVACY-CHAIN-CLOSED/);
  assert.match(doc, /diagnostic privacy implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredDiagnosticFields) {
    assert.ok(doc.includes(field), `missing diagnostic privacy field ${field}`);
  }

  const diagnosticShape = inlineDiagnosticPrivacyShape();
  const diagnosticRows = diagnosticShape.sections.map((section) => section.id);
  const diagnosticSections = diagnosticShape.sections.map((section) => section.section);
  const inlineFields = new Set(diagnosticShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(diagnosticShape.privacyVersion, 'diagnostic-privacy-draft-2026-05-29');
  assert.equal(diagnosticShape.privacyId, 'FT-DIAGNOSTIC-PRIVACY-DRAFT-00');
  assert.equal(diagnosticShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(diagnosticShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(diagnosticShape.sideEffectBudgetId, 'FT-SIDE-EFFECT-BUDGET-DRAFT-00');
  assert.equal(diagnosticShape.noWorkPreservationId, 'FT-NO-WORK-PRESERVATION-DRAFT-00');
  assert.equal(diagnosticShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(diagnosticShape.diagnosticPrivacyPath, diagnosticPrivacyPath);
  assert.equal(diagnosticShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(diagnosticShape.runtimeBehaviorChanged, false);
  assert.deepEqual(diagnosticRows, expectedDiagnosticRows);
  assert.equal(new Set(diagnosticSections).size, 12);

  for (const field of requiredDiagnosticFields) {
    assert.ok(inlineFields.has(field), `inline diagnostic privacy missing field ${field}`);
  }

  for (const section of diagnosticShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('diagnostic privacy path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const diagnosticShape = inlineDiagnosticPrivacyShape();

  assert.ok(doc.includes(diagnosticPrivacyPath));
  assert.equal(diagnosticShape.diagnosticPrivacyPath, diagnosticPrivacyPath);
  assert.equal(diagnosticShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, diagnosticPrivacyPath)), false, `${diagnosticPrivacyPath} should not exist yet`);
});

test('diagnostic privacy contract is backed by current side-effect no-work fixture artifact collector and logging gates', () => {
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
  const diagnosticLoggingPolicy = read(sourceDocs.diagnosticLoggingPolicy);
  const methodGap = read(methodGapPath);

  assert.match(sideEffectBudgetContract, /Committed side-effect budget files: 0/);
  assert.match(sideEffectBudgetContract, /Implementation-ready side-effect budget contract rows: 0/);
  assert.match(sideEffectBudgetContract, /method semantic proof gap files covered: 69/);
  assert.match(noWorkPreservationContract, /Committed no-work preservation files: 0/);
  assert.match(noWorkPreservationContract, /Implementation-ready no-work preservation contract rows: 0/);
  assert.match(fixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(fixtureProvenanceContract, /Implementation-ready fixture provenance contract rows: 0/);
  assert.match(sourceOwnerMapContract, /Committed source owner map files: 0/);
  assert.match(sourceOwnerMapContract, /Implementation-ready source owner map contract rows: 0/);
  assert.match(metricSampleContract, /Committed metric sample files: 0/);
  assert.match(metricSampleContract, /Implementation-ready metric sample contract rows: 0/);
  assert.match(manifestContract, /Committed packet manifest files: 0/);
  assert.match(manifestContract, /Implementation-ready manifest contract rows: 0/);
  assert.match(pathBoundary, /Committed foundation metric artifact files: 0/);
  assert.match(pathBoundary, /Implementation-ready artifact path rows: 0/);
  assert.match(foundationPacket, /required foundation metric artifact packet exists: no/);
  assert.match(foundationPacket, /runtime metric collectors approved: 0/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
  assert.match(diagnosticLoggingPolicy, /diagnostic logging policy matrix source files: 21/);
  assert.match(diagnosticLoggingPolicy, /active console callsites: 419/);
  assert.match(diagnosticLoggingPolicy, /console\.log callsites: 203/);
  assert.match(diagnosticLoggingPolicy, /not completion proof for diagnostic logging policy authority/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5830/);
});

test('diagnostic privacy authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('diagnostic privacy contract is linked from audit ledgers and upstream gates', () => {
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
    ...Object.values(sourceDocs).map(read)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization diagnostic privacy contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization diagnostic privacy contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization diagnostic privacy contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization diagnostic privacy contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization diagnostic privacy contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(doc, /close diagnostic privacy documentation chain now: GO/);
  assert.match(doc, /accept diagnostic privacy closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as diagnostic logging removal approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept diagnostic privacy closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
