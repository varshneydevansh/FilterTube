import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-foundation-contract-coverage-gate-current-behavior.test.mjs';
const artifactRoot = 'docs/audit/artifacts/first-optimization/metric-foundation/';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const runtimeTestProvenanceIndexPath = 'docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

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

const sourceDocs = {
  pathBoundary: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  foundationPacket: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedCoverageRows = [
  'FT-METRIC-CONTRACT-COVERAGE-00-root-boundary',
  'FT-METRIC-CONTRACT-COVERAGE-01-packet-manifest-contract',
  'FT-METRIC-CONTRACT-COVERAGE-02-metric-sample-contract',
  'FT-METRIC-CONTRACT-COVERAGE-03-source-owner-map-contract',
  'FT-METRIC-CONTRACT-COVERAGE-04-fixture-provenance-contract',
  'FT-METRIC-CONTRACT-COVERAGE-05-no-work-preservation-contract',
  'FT-METRIC-CONTRACT-COVERAGE-06-side-effect-budget-contract',
  'FT-METRIC-CONTRACT-COVERAGE-07-diagnostic-privacy-contract',
  'FT-METRIC-CONTRACT-COVERAGE-08-parity-rollout-contract',
  'FT-METRIC-CONTRACT-COVERAGE-09-verification-output-contract',
  'FT-METRIC-CONTRACT-COVERAGE-10-ledger-runtime-results',
  'FT-METRIC-CONTRACT-COVERAGE-11-authority-artifact-absence-gate'
];

const closureRows = [
  'FT-METRIC-CONTRACT-CLOSURE-00-root-boundary',
  'FT-METRIC-CONTRACT-CLOSURE-01-packet-manifest-contract',
  'FT-METRIC-CONTRACT-CLOSURE-02-metric-sample-contract',
  'FT-METRIC-CONTRACT-CLOSURE-03-source-owner-map-contract',
  'FT-METRIC-CONTRACT-CLOSURE-04-fixture-provenance-contract',
  'FT-METRIC-CONTRACT-CLOSURE-05-no-work-preservation-contract',
  'FT-METRIC-CONTRACT-CLOSURE-06-side-effect-budget-contract',
  'FT-METRIC-CONTRACT-CLOSURE-07-diagnostic-privacy-contract',
  'FT-METRIC-CONTRACT-CLOSURE-08-parity-rollout-contract',
  'FT-METRIC-CONTRACT-CLOSURE-09-verification-output-contract',
  'FT-METRIC-CONTRACT-CLOSURE-10-ledger-runtime-results',
  'FT-METRIC-CONTRACT-CLOSURE-11-authority-artifact-absence-gate'
];

const requiredCoverageFields = [
  'artifactRoot',
  'reservedArtifactRoot',
  'artifactRootExists',
  'artifactRootCommitGate',
  'artifactPathBoundaryDoc',
  'artifactPathBoundaryTest',
  'packetManifestPath',
  'packetManifestContractDoc',
  'packetManifestContractTest',
  'packetManifestRows',
  'packetManifestFilesCommitted',
  'metricSamplePath',
  'metricSampleContractDoc',
  'metricSampleContractTest',
  'sourceOwnerMapPath',
  'sourceOwnerMapContractDoc',
  'sourceOwnerMapContractTest',
  'fixtureProvenancePath',
  'fixtureProvenanceContractDoc',
  'fixtureProvenanceContractTest',
  'noWorkPreservationPath',
  'noWorkPreservationContractDoc',
  'noWorkPreservationContractTest',
  'sideEffectBudgetPath',
  'sideEffectBudgetContractDoc',
  'sideEffectBudgetContractTest',
  'diagnosticPrivacyPath',
  'diagnosticPrivacyContractDoc',
  'diagnosticPrivacyContractTest',
  'parityRolloutPath',
  'parityRolloutContractDoc',
  'parityRolloutContractTest',
  'verificationOutputPath',
  'verificationOutputContractDoc',
  'verificationOutputContractTest',
  'runtimeResultsPath',
  'objectiveLedgerPath',
  'activeGoalAuditPath',
  'trackedFileIndexPath',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'callableOwnerProofStatus',
  'reservedArtifactPaths',
  'futureAuthorityTokens',
  'runtimeAuthorityMatches',
  'artifactAbsenceCheck',
  'collectorApprovalStatus',
  'optimizationApprovalStatus',
  'releaseClaimStatus',
  'publicClaimStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricFoundationContractCoverageGate',
  'firstOptimizationMetricFoundationContractCoverageReport',
  'firstOptimizationMetricFoundationContractCoverageApproval',
  'firstOptimizationMetricFoundationContractCoverageNoGoBoundary',
  'jsonFirstMetricFoundationContractCoverageAuthority',
  'metricArtifactContractCoverageCollector',
  'metricArtifactContractCoverageRuntimeApproval',
  'metricArtifactContractCoverageVerification',
  'metricFoundationArtifactCommitApproval',
  'whitelistOptimizationContractCoverageBudget',
  'releasePackageContractCoverageApproval',
  'publicClaimContractCoverageApproval',
  'nativeSyncContractCoverageApproval',
  'rawCaptureContractCoverageExclusionProof',
  'firstOptimizationMetricFoundationInlineCoverageClosure',
  'metricFoundationInlineCoverageClosureApproval',
  'metricFoundationInlineCoverageImplementationReadiness'
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

function sourceTopLevelRuntimeTestDeclarationsFromIndex() {
  const index = read(runtimeTestProvenanceIndexPath);
  const match = index.match(/source top-level test declarations counted: (\d+)/);
  assert.ok(match, 'missing runtime test declaration count');
  return Number(match[1]);
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

test('first optimization metric foundation contract coverage gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization metric foundation/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Reserved metric foundation artifact root: docs\/audit\/artifacts\/first-optimization\/metric-foundation\//);
  assert.match(doc, /Committed foundation metric artifact files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready contract coverage rows: 0/);
  assert.match(doc, /metric foundation inline coverage closure rows: 12/);
  assert.match(doc, /coverage rows covered by closure: 12/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /contract docs linked by closure: 9/);
  assert.match(doc, /contract tests linked by closure: 9/);
  assert.match(doc, /inline draft sources linked by closure: 9/);
  assert.match(doc, /inline draft verifier tests linked by closure: 9/);
  assert.match(doc, /committed foundation metric artifacts from closure: 0/);
  assert.match(doc, /runtime metric collector approvals from closure: 0/);
  assert.match(doc, /metric foundation inline coverage closure: COVERAGE-CHAIN-CLOSED/);
  assert.match(doc, /metric foundation artifact readiness from closure: NO-GO/);
  assert.match(doc, /not completion proof for metric foundation artifact authority/);

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

test('metric foundation contract coverage rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-METRIC-CONTRACT-COVERAGE-[^`]+)` \|/gm)].map((row) => row[1]);
  const foundClosureRows = [...doc.matchAll(/^\| `(FT-METRIC-CONTRACT-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedCoverageRows);
  assert.deepEqual(foundClosureRows, closureRows);
  assert.equal(rows.length, 12);
  assert.equal(foundClosureRows.length, 12);
  for (const row of expectedCoverageRows) {
    const references = [...doc.matchAll(new RegExp(`\\b${row}\\b`, 'g'))].length;
    assert.ok(references >= 2, `coverage row ${row} is not linked from closure`);
  }
  assert.match(doc, /first optimization metric foundation contract coverage rows: 12/);
  assert.match(doc, /reserved metric foundation artifact roots covered: 1/);
  assert.match(doc, /reserved metric foundation artifact files covered: 9/);
  assert.match(doc, /metric foundation contract docs covered: 9/);
  assert.match(doc, /metric foundation contract tests covered: 9/);
  assert.match(doc, /metric foundation inline draft sources covered: 9/);
  assert.match(doc, /metric foundation inline draft verifier tests covered: 9/);
  assert.match(doc, /metric foundation inline draft sections covered: 108/);
  assert.match(doc, /metric foundation inline draft artifact promotion decisions: 9 NO-GO/);
  assert.match(doc, /combined metric-foundation inline artifact chain verifier tests observed: 55/);
  assert.match(doc, /combined metric-foundation inline artifact chain plus coverage gate verifier tests observed: 61/);
  assert.match(doc, /5 route\/surface-specific\s+per-file metric artifact contract docs covered/);
  assert.match(doc, /5 route\/surface-specific\s+per-file metric artifact contract tests covered/);
  assert.equal(doc.includes('0 route/surface-specific per-file metric artifact contract docs covered'), false);
  assert.match(doc, /committed foundation metric artifact files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready contract coverage rows: 0/);
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
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /metric foundation inline coverage closure rows: 12/);
  assert.match(doc, /coverage rows covered by closure: 12/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /contract docs linked by closure: 9/);
  assert.match(doc, /contract tests linked by closure: 9/);
  assert.match(doc, /inline draft sources linked by closure: 9/);
  assert.match(doc, /inline draft verifier tests linked by closure: 9/);
  assert.match(doc, /committed foundation metric artifacts from closure: 0/);
  assert.match(doc, /runtime metric collector approvals from closure: 0/);
  assert.match(doc, /metric foundation inline coverage closure: COVERAGE-CHAIN-CLOSED/);
  assert.match(doc, /metric foundation artifact readiness from closure: NO-GO/);
  assert.match(doc, /## Runtime Count Reconciliation Addendum - 2026-05-27/);
  assert.match(doc, /legacy metric contract expected tests: 4457/);
  assert.match(doc, /current generated runtime test declarations: 4667/);
  assert.match(doc, /latest full runtime pass count observed: 4663/);
  assert.match(doc, /latest full runtime pass freshness: 2026-05-30 full runtime rerun covers 4663 generated declarations before 4 later audit-only content-filter declarations/);
  assert.match(doc, /count reconciliation status for metric foundation: BLOCKED/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /legacy `4457` rows are historical metric-contract snapshot evidence/);
  assert.match(doc, /not\s+current full-suite proof or optimization approval/);
  assert.ok(doc.includes(runtimeTestProvenanceIndexPath));
  assert.equal(sourceTopLevelRuntimeTestDeclarationsFromIndex(), 4667);

  for (const field of requiredCoverageFields) {
    assert.ok(doc.includes(field), `missing contract coverage field ${field}`);
  }
});

test('all reserved metric foundation artifact paths remain absent', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(artifactRoot));
  assert.equal(fs.existsSync(path.join(repoRoot, artifactRoot)), false, `${artifactRoot} should not exist yet`);

  for (const contract of contractArtifacts) {
    assert.ok(doc.includes(contract.reservedPath), `missing reserved path ${contract.reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, contract.reservedPath)), false, `${contract.reservedPath} should not exist yet`);
  }
});

test('metric foundation contract coverage is backed by every artifact contract and upstream gate', () => {
  const pathBoundary = read(sourceDocs.pathBoundary);
  const foundationPacket = read(sourceDocs.foundationPacket);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);
  const methodGap = read(sourceDocs.methodGap);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(pathBoundary, /reserved future artifact files: 9/);
  assert.match(pathBoundary, /committed foundation metric artifact files: 0/);
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
  assert.match(methodGap, /repo-wide lexical callables: 5469/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5469/);
  assert.match(runtimeResults, /Historical 2026-05-17 ledger snapshot:[\s\S]*tests 4457/);
  assert.match(runtimeResults, /Historical 2026-05-17 ledger snapshot:[\s\S]*pass 4457/);
  assert.match(runtimeResults, /fail 0/);
  assert.match(runtimeResults, /current generated source top-level declarations: 4667/);
  assert.match(runtimeResults, /latest full runtime pass evidence: current 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(runtimeResults, /stored TAP output: \/private\/tmp\/filtertube-runtime-full-after-lifecycle-convergence\.tap/);
  assert.match(runtimeResults, /runtime-results ledger completion authority: NO-GO/);

  for (const contract of contractArtifacts) {
    const contractDoc = read(contract.doc);
    const inlineDoc = read(contract.inlineDoc);
    const shape = inlineDraftShape(contract.inlineDoc);

    assert.match(contractDoc, contract.committedPattern, `missing committed-zero proof for ${contract.id}`);
    assert.match(contractDoc, contract.readyPattern, `missing implementation-ready-zero proof for ${contract.id}`);
    assert.ok(contractDoc.includes(contract.reservedPath), `missing reserved path in ${contract.id} doc`);
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
  assert.match(releaseFixStatus, /combined metric-foundation inline artifact chain verifier after 2026-05-29 continuation: 55\/55 pass/);
});

test('metric foundation contract coverage authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }

  for (const decision of [
    'close metric foundation inline coverage documentation chain now: GO',
    'accept coverage closure as artifact root creation approval now: NO-GO',
    'accept coverage closure as artifact file commit approval now: NO-GO',
    'accept coverage closure as collector insertion approval now: NO-GO',
    'accept coverage closure as JSON-first runtime behavior approval now: NO-GO',
    'accept coverage closure as whitelist optimization approval now: NO-GO',
    'accept coverage closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing closure decision ${decision}`);
  }

  assert.match(doc, /Root is reserved only; it is not created/);
  assert.match(doc, /Ledger evidence is audit-only; count reconciliation remains blocked/);
  assert.match(doc, /No artifact file, runtime collector approval, release approval, or public-claim approval exists/);
});

test('metric foundation contract coverage gate is linked from audit ledgers and upstream gates', () => {
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
      .map(([, sourceDoc]) => read(sourceDoc)),
    ...contractArtifacts.map((contract) => read(contract.doc))
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization metric foundation contract coverage gate addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /Historical 2026-05-17 ledger snapshot:[\s\S]*tests 4457/);
  assert.match(runtimeResults, /current generated source top-level declarations: 4667/);
  assert.match(runtimeResults, /runtime-results ledger completion authority: NO-GO/);
  assert.match(runtimeResults, /First optimization metric foundation contract coverage gate addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization metric foundation contract coverage gate addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization metric foundation contract coverage gate addendum:[\s\S]*63 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization metric foundation contract coverage gate addendum:[\s\S]*63 method semantic proof gap files covered/);
});
