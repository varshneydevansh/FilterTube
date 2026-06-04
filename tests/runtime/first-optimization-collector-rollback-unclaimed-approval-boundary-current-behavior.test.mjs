import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_ROLLBACK_UNCLAIMED_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-rollback-unclaimed-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const verificationOutputPath = 'docs/audit/artifacts/first-optimization/metric-foundation/verification-output.tap';

const sourceDocs = {
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorVerificationApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParityApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusParity: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorDiagnosticApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffectApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertionApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-COLLECTOR-ROLLBACK-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-01-source-collector-preconditions',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-02-measured-surface-scope',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-03-unclaimed-json-dom-scope',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-04-native-webview-sync-scope',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-05-release-package-scope',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-06-public-claim-retraction',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-07-raw-capture-exclusion',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-08-diagnostic-performance-claim',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-09-rollback-command-owner',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-10-authority-artifact-absence',
  'FT-COLLECTOR-ROLLBACK-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved rollback/unclaimed packet id',
  'source-owner approval',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'callable semantic proof',
  'measured-surface list',
  'unclaimed JSON/DOM list',
  'native rollback owner',
  'release rollback command',
  'public claim retraction command',
  'Raw capture exclusion manifest',
  'Diagnostic privacy id',
  'Rollback command',
  'Authority token absence check',
  'Persisted rollback/unclaimed approval packet'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorRollbackUnclaimedApprovalBoundary',
  'firstOptimizationCollectorRollbackUnclaimedApprovalReport',
  'collectorRollbackUnclaimedApprovalPacket',
  'collectorRollbackUnclaimedApprovalStatus',
  'collectorRollbackCommandApproval',
  'collectorUnclaimedSurfaceApproval',
  'collectorNativeUnclaimedSurfaceApproval',
  'collectorReleaseUnclaimedSurfaceApproval',
  'collectorPublicClaimRetractionApproval',
  'collectorArtifactRemovalApproval',
  'collectorDisableRollbackApproval',
  'collectorRollbackVerificationOutputApproval',
  'collectorRollbackUnclaimedRuntimeAuthority',
  'metricFoundationCollectorRollbackUnclaimedApproval',
  'jsonFirstCollectorRollbackUnclaimedApprovalGate',
  'whitelistCollectorRollbackUnclaimedApprovalGate',
  'runtimeCollectorRollbackApproval',
  'runtimeCollectorUnclaimedSurfaceApproval',
  'collectorRollbackUnclaimedApprovalNoGoBoundary'
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

test('collector rollback unclaimed approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector rollback and\s+unclaimed-surface approval boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is\s+not an implementation patch, optimization patch/);
  assert.match(doc, /still not runtime rollback approval or runtime unclaimed-surface approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime rollback approvals: 0/);
  assert.match(doc, /Runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /Runtime collector rollback\/unclaimed approvals: 0/);
  assert.match(doc, /Committed rollback\/unclaimed artifacts: 0/);
  assert.match(doc, /Implementation-ready collector rollback\/unclaimed approval rows: 0/);
  assert.match(doc, /not completion proof for collector rollback\/unclaimed approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector rollback unclaimed approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-ROLLBACK-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector rollback\/unclaimed approval boundary rows: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /collector verification output approval rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /collector parity rollout approval rows covered: 12/);
  assert.match(doc, /source-locus parity release verification rows covered: 12/);
  assert.match(doc, /collector diagnostic privacy approval rows covered: 12/);
  assert.match(doc, /collector fixture provenance approval rows covered: 12/);
  assert.match(doc, /collector side-effect approval rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /collector insertion approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /current parity release verification anchors covered: 68/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /runtime collector diagnostic privacy approvals: 0/);
  assert.match(doc, /runtime collector parity rollout approvals: 0/);
  assert.match(doc, /runtime collector verification output approvals: 0/);
  assert.match(doc, /runtime collector rollback\/unclaimed approvals: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /committed parity rollout files: 0/);
  assert.match(doc, /committed verification output files: 0/);
  assert.match(doc, /committed rollback\/unclaimed artifacts: 0/);
  assert.match(doc, /implementation-ready collector rollback\/unclaimed approval rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector rollback unclaimed approval is backed by current NO-GO gates', () => {
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const collectorVerificationApproval = read(sourceDocs.collectorVerificationApproval);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const collectorParityApproval = read(sourceDocs.collectorParityApproval);
  const sourceLocusParity = read(sourceDocs.sourceLocusParity);
  const collectorDiagnosticApproval = read(sourceDocs.collectorDiagnosticApproval);
  const collectorFixtureApproval = read(sourceDocs.collectorFixtureApproval);
  const collectorSideEffectApproval = read(sourceDocs.collectorSideEffectApproval);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const collectorInsertionApproval = read(sourceDocs.collectorInsertionApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(rollbackUnclaimed, /commit rollback\/unclaimed artifact now: NO-GO/);
  assert.match(collectorVerificationApproval, /runtime collector verification output approval now: NO-GO/);
  assert.match(collectorVerificationApproval, /runtime collector verification output approvals: 0/);
  assert.match(verificationOutput, /Committed verification output files: 0/);
  assert.match(collectorParityApproval, /runtime collector parity rollout approval now: NO-GO/);
  assert.match(sourceLocusParity, /runtime rollback approval now: NO-GO/);
  assert.match(sourceLocusParity, /runtime unclaimed-surface approval now: NO-GO/);
  assert.match(collectorDiagnosticApproval, /runtime collector diagnostic privacy approval now: NO-GO/);
  assert.match(collectorFixtureApproval, /runtime collector fixture provenance approval now: NO-GO/);
  assert.match(collectorSideEffectApproval, /runtime collector side-effect approval now: NO-GO/);
  assert.match(collectorNoWorkApproval, /runtime collector no-work approval now: NO-GO/);
  assert.match(collectorInsertionApproval, /runtime collector insertion approval now: NO-GO/);
  assert.match(collectorApproval, /Rollback and unclaimed-surface approval/);
  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('collector rollback unclaimed approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, verificationOutputPath)), false, `${verificationOutputPath} should not exist yet`);

  for (const decision of [
    'collector rollback/unclaimed approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'runtime collector diagnostic privacy approval now: NO-GO',
    'runtime collector parity rollout approval now: NO-GO',
    'runtime collector verification output approval now: NO-GO',
    'runtime collector rollback/unclaimed approval now: NO-GO',
    'runtime rollback approval now: NO-GO',
    'runtime unclaimed-surface approval now: NO-GO',
    'use rollback/unclaimed boundary as approval now: NO-GO',
    'use verification output approval chain as rollback approval now: NO-GO',
    'commit rollback/unclaimed artifact now: NO-GO',
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

test('collector rollback unclaimed approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector rollback unclaimed approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    rollbackUnclaimed: sourceDocs.rollbackUnclaimed,
    collectorVerificationApproval: sourceDocs.collectorVerificationApproval,
    collectorApproval: sourceDocs.collectorApproval,
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
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector rollback\/unclaimed approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Rollback Unclaimed Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Rollback Unclaimed Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Rollback Unclaimed Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
