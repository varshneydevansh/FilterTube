import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs';
const sideEffectPath = 'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
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
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedSideEffectRows = [
  'FT-SIDE-EFFECT-BUDGET-00-packet-binding',
  'FT-SIDE-EFFECT-BUDGET-01-artifact-binding',
  'FT-SIDE-EFFECT-BUDGET-02-settings-artifact',
  'FT-SIDE-EFFECT-BUDGET-03-transport',
  'FT-SIDE-EFFECT-BUDGET-04-engine',
  'FT-SIDE-EFFECT-BUDGET-05-dom-lifecycle',
  'FT-SIDE-EFFECT-BUDGET-06-network-storage',
  'FT-SIDE-EFFECT-BUDGET-07-visual-whitelist',
  'FT-SIDE-EFFECT-BUDGET-08-diagnostic-privacy',
  'FT-SIDE-EFFECT-BUDGET-09-no-work-coupling',
  'FT-SIDE-EFFECT-BUDGET-10-parity-rollout',
  'FT-SIDE-EFFECT-BUDGET-11-verification'
];

const expectedSideEffectClosureRows = [
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-00-packet-binding',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-01-artifact-binding',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-02-settings-artifact',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-03-transport',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-04-engine',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-05-dom-lifecycle',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-06-network-storage',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-07-visual-whitelist',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-08-diagnostic-privacy',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-09-no-work-coupling',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-10-parity-rollout',
  'FT-SIDE-EFFECT-BUDGET-CLOSURE-11-verification'
];

const requiredSideEffectFields = [
  'budgetVersion',
  'budgetId',
  'packetId',
  'sampleId',
  'noWorkPreservationId',
  'candidateId',
  'bindingId',
  'obligationId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'sideEffectPath',
  'settingsReadBudget',
  'settingsWriteBudget',
  'settingsBroadcastBudget',
  'artifactReadBudget',
  'artifactWriteBudget',
  'artifactReleaseExcluded',
  'fetchPatchBudget',
  'xhrPatchBudget',
  'bodyReadBudget',
  'responseRewriteBudget',
  'processDataBudget',
  'candidateExtractionBudget',
  'ruleCheckBudget',
  'rendererMutationBudget',
  'domQueryBudget',
  'domMutationBudget',
  'listenerBudget',
  'observerBudget',
  'timerBudget',
  'callableOwnerProofStatus',
  'networkFetchBudget',
  'credentialBudget',
  'resolverBudget',
  'storageWriteBudget',
  'mapWriteBudget',
  'messageBudget',
  'hideMutationBudget',
  'restoreMutationBudget',
  'pendingHideBudget',
  'whitelistAllowBudget',
  'falseHideBudget',
  'leakBudget',
  'diagnosticLogBudget',
  'consoleBudget',
  'privacyClass',
  'redactionPolicy',
  'disabledBudget',
  'noRuleBudget',
  'emptyListBudget',
  'jsonDomParityBudget',
  'nativeParityBudget',
  'releaseInputExcluded',
  'publicClaimScope',
  'verificationCommand',
  'expectedTests',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'firstOptimizationSideEffectBudgetContract',
  'firstOptimizationSideEffectBudgetReport',
  'firstOptimizationSideEffectBudgetApproval',
  'firstOptimizationSideEffectBudgetNoGoBoundary',
  'jsonFirstOptimizationSideEffectBudget',
  'jsonFirstSideEffectBudgetAuthority',
  'metricArtifactSideEffectBudgetCollector',
  'metricArtifactSideEffectBudgetVerification',
  'metricArtifactSideEffectBudgetRuntimeApproval',
  'whitelistOptimizationSideEffectBudget',
  'sideEffectBudgetDraftClosure',
  'sideEffectBudgetDraftClosureRuntimeApproval',
  'sideEffectBudgetDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineSideEffectShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline side-effect budget JSON block');
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

test('first optimization side-effect budget contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization side-effect budget/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved side-effect budget path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/side-effect-budget\.json/);
  assert.match(doc, /Committed side-effect budget files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready side-effect budget contract rows: 0/);
  assert.match(doc, /not completion proof for side-effect budget authority/);
  assert.match(doc, /affected callable set\s+and method semantic proof status/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('side-effect budget contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SIDE-EFFECT-BUDGET-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-SIDE-EFFECT-BUDGET-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSideEffectRows);
  assert.deepEqual(closureRows, expectedSideEffectClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization side-effect budget contract rows: 12/);
  assert.match(doc, /reserved side-effect budget paths covered: 1/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready side-effect budget contract rows: 0/);
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
  assert.match(doc, /method semantic proof gap lexical callables covered: 5473/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5473/);
  assert.match(doc, /inline side-effect budget JSON sections covered: 12/);
  assert.match(doc, /inline side-effect budget artifact promotion decision: NO-GO/);
  assert.match(doc, /side-effect budget draft closure rows: 12/);
  assert.match(doc, /side-effect budget rows linked by closure: 12/);
  assert.match(doc, /inline side-effect budget JSON sections linked by closure: 12/);
  assert.match(doc, /no-work preservation contract rows linked by side-effect closure: 12/);
  assert.match(doc, /fixture provenance contract rows linked by side-effect closure: 12/);
  assert.match(doc, /source owner map contract rows linked by side-effect closure: 12/);
  assert.match(doc, /metric sample contract rows linked by side-effect closure: 12/);
  assert.match(doc, /manifest contract rows linked by side-effect closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by side-effect closure: 10/);
  assert.match(doc, /foundation packet rows linked by side-effect closure: 12/);
  assert.match(doc, /metric schema rows linked by side-effect closure: 12/);
  assert.match(doc, /metric source-owner rows linked by side-effect closure: 12/);
  assert.match(doc, /collector readiness families linked by side-effect closure: 5/);
  assert.match(doc, /method semantic proof gap files linked by side-effect closure: 63/);
  assert.match(doc, /lexical callables linked by side-effect closure: 5473/);
  assert.match(doc, /runtime side-effect budget closure approvals: 0/);
  assert.match(doc, /implementation-ready side-effect budget closure rows: 0/);
  assert.match(doc, /side-effect budget draft closure: SIDE-EFFECT-BUDGET-CHAIN-CLOSED/);
  assert.match(doc, /side-effect budget implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredSideEffectFields) {
    assert.ok(doc.includes(field), `missing side-effect budget field ${field}`);
  }

  const sideEffectShape = inlineSideEffectShape();
  const sideEffectRows = sideEffectShape.sections.map((section) => section.id);
  const sideEffectSections = sideEffectShape.sections.map((section) => section.section);
  const inlineFields = new Set(sideEffectShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(sideEffectShape.budgetVersion, 'side-effect-budget-draft-2026-05-29');
  assert.equal(sideEffectShape.budgetId, 'FT-SIDE-EFFECT-BUDGET-DRAFT-00');
  assert.equal(sideEffectShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(sideEffectShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(sideEffectShape.noWorkPreservationId, 'FT-NO-WORK-PRESERVATION-DRAFT-00');
  assert.equal(sideEffectShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(sideEffectShape.sideEffectPath, sideEffectPath);
  assert.equal(sideEffectShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(sideEffectShape.runtimeBehaviorChanged, false);
  assert.deepEqual(sideEffectRows, expectedSideEffectRows);
  assert.equal(new Set(sideEffectSections).size, 12);

  for (const field of requiredSideEffectFields) {
    assert.ok(inlineFields.has(field), `inline side-effect budget missing field ${field}`);
  }

  for (const section of sideEffectShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('side-effect budget path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const sideEffectShape = inlineSideEffectShape();

  assert.ok(doc.includes(sideEffectPath));
  assert.equal(sideEffectShape.sideEffectPath, sideEffectPath);
  assert.equal(sideEffectShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, sideEffectPath)), false, `${sideEffectPath} should not exist yet`);
});

test('side-effect budget contract is backed by current no-work fixture owner sample artifact and collector gates', () => {
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
  const methodGap = read(methodGapPath);

  assert.match(noWorkPreservationContract, /Committed no-work preservation files: 0/);
  assert.match(noWorkPreservationContract, /Implementation-ready no-work preservation contract rows: 0/);
  assert.match(noWorkPreservationContract, /method semantic proof gap files covered: 63/);
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
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 63/);
  assert.match(methodGap, /repo-wide lexical callables: 5473/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5473/);
});

test('side-effect budget authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('side-effect budget contract is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization side-effect budget contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization side-effect budget contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization side-effect budget contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization side-effect budget contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization side-effect budget contract addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(doc, /close side-effect budget documentation chain now: GO/);
  assert.match(doc, /accept side-effect budget closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept side-effect budget closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept side-effect budget closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept side-effect budget closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept side-effect budget closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept side-effect budget closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
