import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-verification-output-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const verificationOutputPath = 'docs/audit/artifacts/first-optimization/metric-foundation/verification-output.tap';

const sourceDocs = {
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParityApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  parityContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusParity: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorDiagnosticApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffectApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertionApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-COLLECTOR-VERIFY-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-VERIFY-APPROVAL-01-source-collector-preconditions',
  'FT-COLLECTOR-VERIFY-APPROVAL-02-verification-command',
  'FT-COLLECTOR-VERIFY-APPROVAL-03-runtime-counts',
  'FT-COLLECTOR-VERIFY-APPROVAL-04-tap-format-failure-boundary',
  'FT-COLLECTOR-VERIFY-APPROVAL-05-artifact-absence',
  'FT-COLLECTOR-VERIFY-APPROVAL-06-authority-token-absence',
  'FT-COLLECTOR-VERIFY-APPROVAL-07-claim-register-anchor',
  'FT-COLLECTOR-VERIFY-APPROVAL-08-adjacent-gate-chain',
  'FT-COLLECTOR-VERIFY-APPROVAL-09-rollback-unclaimed-scope',
  'FT-COLLECTOR-VERIFY-APPROVAL-10-diagnostic-parity-release-scope',
  'FT-COLLECTOR-VERIFY-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved verification output packet id',
  'source-owner approval',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'callable semantic proof',
  'Verification command',
  'Persisted TAP path',
  'Expected and actual tests/pass/fail counts',
  'Reserved artifact absence command',
  'Scoped source roots',
  'sourceOfTruthRegisterPath',
  'Adjacent command',
  'Rollback boundary',
  'Diagnostic privacy id',
  'Persisted verification output',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorVerificationOutputApprovalBoundary',
  'firstOptimizationCollectorVerificationOutputApprovalReport',
  'collectorVerificationOutputApprovalPacket',
  'collectorVerificationOutputApprovalStatus',
  'collectorVerificationCommandApproval',
  'collectorTapOutputApproval',
  'collectorRuntimeAuditCountApproval',
  'collectorArtifactAbsenceApproval',
  'collectorAuthorityTokenAbsenceApproval',
  'collectorSourceOfTruthClaimApproval',
  'collectorAdjacentGateChainApproval',
  'collectorRollbackUnclaimedVerificationApproval',
  'collectorDiagnosticParityReleaseVerificationApproval',
  'collectorVerificationOutputRuntimeAuthority',
  'metricFoundationCollectorVerificationOutputApproval',
  'jsonFirstCollectorVerificationOutputApprovalGate',
  'whitelistCollectorVerificationOutputApprovalGate',
  'runtimeCollectorVerificationOutputApproval',
  'collectorVerificationOutputApprovalNoGoBoundary'
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
    'build.js'
  ]
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

test('collector verification output approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector verification\s+output approval boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Neither one is runtime approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime collector verification output approvals: 0/);
  assert.match(doc, /Committed verification output files: 0/);
  assert.match(doc, /Implementation-ready collector verification output approval rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector verification output approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector verification output approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-VERIFY-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector verification output approval boundary rows: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /collector parity rollout approval rows covered: 12/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /source-locus parity release verification rows covered: 12/);
  assert.match(doc, /collector diagnostic privacy approval rows covered: 12/);
  assert.match(doc, /collector fixture provenance approval rows covered: 12/);
  assert.match(doc, /collector side-effect approval rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /collector insertion approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /current parity release verification anchors covered: 68/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5744/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5744/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /runtime collector diagnostic privacy approvals: 0/);
  assert.match(doc, /runtime collector parity rollout approvals: 0/);
  assert.match(doc, /runtime collector verification output approvals: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /committed parity rollout files: 0/);
  assert.match(doc, /committed verification output files: 0/);
  assert.match(doc, /implementation-ready collector verification output approval rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector verification output approval is backed by current NO-GO gates', () => {
  const verificationOutput = read(sourceDocs.verificationOutput);
  const collectorParityApproval = read(sourceDocs.collectorParityApproval);
  const parityContract = read(sourceDocs.parityContract);
  const sourceLocusParity = read(sourceDocs.sourceLocusParity);
  const collectorDiagnosticApproval = read(sourceDocs.collectorDiagnosticApproval);
  const collectorFixtureApproval = read(sourceDocs.collectorFixtureApproval);
  const collectorSideEffectApproval = read(sourceDocs.collectorSideEffectApproval);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const collectorInsertionApproval = read(sourceDocs.collectorInsertionApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(verificationOutput, /Committed verification output files: 0/);
  assert.match(verificationOutput, /implementation-ready verification output contract rows: 0/);
  assert.match(verificationOutput, /commit verification-output\.tap now: NO-GO/);
  assert.match(collectorParityApproval, /runtime collector parity rollout approval now: NO-GO/);
  assert.match(collectorParityApproval, /runtime collector parity rollout approvals: 0/);
  assert.match(collectorParityApproval, /method semantic proof gap files covered: 69/);
  assert.match(parityContract, /committed parity rollout files: 0/);
  assert.match(parityContract, /method semantic proof gap files covered: 69/);
  assert.match(sourceLocusParity, /commit verification-output\.tap now: NO-GO/);
  assert.match(sourceLocusParity, /implementation-ready source-locus parity release verification rows: 0/);
  assert.match(sourceLocusParity, /method semantic proof gap files covered: 69/);
  assert.match(collectorDiagnosticApproval, /runtime collector diagnostic privacy approval now: NO-GO/);
  assert.match(collectorDiagnosticApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorFixtureApproval, /runtime collector fixture provenance approval now: NO-GO/);
  assert.match(collectorFixtureApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorSideEffectApproval, /runtime collector side-effect approval now: NO-GO/);
  assert.match(collectorSideEffectApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorNoWorkApproval, /runtime collector no-work approval now: NO-GO/);
  assert.match(collectorNoWorkApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorInsertionApproval, /runtime collector insertion approval now: NO-GO/);
  assert.match(collectorInsertionApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorApproval, /Verification output approval/);
  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5744/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('collector verification output approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, verificationOutputPath)), false, `${verificationOutputPath} should not exist yet`);

  for (const decision of [
    'collector verification output approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'runtime collector diagnostic privacy approval now: NO-GO',
    'runtime collector parity rollout approval now: NO-GO',
    'runtime collector verification output approval now: NO-GO',
    'use verification output contract as approval now: NO-GO',
    'use runtime audit pass count as approval now: NO-GO',
    'use adjacent approval chain as approval now: NO-GO',
    'commit verification-output.tap now: NO-GO',
    'commit metric foundation artifact files now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'JSON-first runtime behavior patch: NO-GO',
    'whitelist optimization patch: NO-GO',
    'native sync patch: NO-GO',
    'release package patch: NO-GO',
    'public claim patch: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }
});

test('collector verification output approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector verification output approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    verificationOutput: sourceDocs.verificationOutput,
    collectorParityApproval: sourceDocs.collectorParityApproval,
    collectorApproval: sourceDocs.collectorApproval,
    rollbackUnclaimed: sourceDocs.rollbackUnclaimed,
    implementationReadiness: sourceDocs.implementationReadiness,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('tests 4457'));
  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector verification output approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Verification Output Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Verification Output Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Verification Output Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
