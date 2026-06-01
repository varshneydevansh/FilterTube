import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-insertion-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusClosure: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SOURCE_LOCUS_CLOSURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParity: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const artifactPaths = [
  'docs/audit/artifacts/first-optimization/metric-foundation/packet-manifest.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/parity-rollout.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/verification-output.tap'
];

const expectedRows = [
  'FT-COLLECTOR-INSERTION-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-INSERTION-APPROVAL-01-source-owner-precondition',
  'FT-COLLECTOR-INSERTION-APPROVAL-02-passive-read-only',
  'FT-COLLECTOR-INSERTION-APPROVAL-03-settings-route-mode',
  'FT-COLLECTOR-INSERTION-APPROVAL-04-transport-fetch-xhr',
  'FT-COLLECTOR-INSERTION-APPROVAL-05-engine-renderer',
  'FT-COLLECTOR-INSERTION-APPROVAL-06-dom-lifecycle',
  'FT-COLLECTOR-INSERTION-APPROVAL-07-network-resolver',
  'FT-COLLECTOR-INSERTION-APPROVAL-08-storage-refresh',
  'FT-COLLECTOR-INSERTION-APPROVAL-09-visual-whitelist',
  'FT-COLLECTOR-INSERTION-APPROVAL-10-diagnostic-fixture-parity',
  'FT-COLLECTOR-INSERTION-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved packet id',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'Committed source-owner map',
  'callable semantic proof',
  'No clone',
  'Revision snapshot',
  'Clone-free disabled proof',
  'Disabled, no-rule, harvest-only',
  'observer/timer teardown proof',
  'No-fetch budget',
  'Storage read/write budget',
  'false-hide/leak budget',
  'exact TAP output',
  'Runtime insertion approval token',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorInsertionApprovalBoundary',
  'firstOptimizationCollectorInsertionApprovalReport',
  'collectorInsertionApprovalPacket',
  'collectorInsertionApprovalStatus',
  'collectorInsertionPassiveReadOnlyProof',
  'collectorInsertionObserverTimerBudgetApproval',
  'collectorInsertionRuntimeAuthority',
  'metricFoundationCollectorInsertionApproval',
  'jsonFirstCollectorInsertionApprovalGate',
  'whitelistCollectorInsertionApprovalGate',
  'runtimeCollectorInsertionApproval',
  'collectorInsertionApprovalNoGoBoundary'
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

test('collector insertion approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector insertion\s+approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Mapping an insertion risk is not insertion approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime collector insertion points approved: 0/);
  assert.match(doc, /Implementation-ready collector insertion approval rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector insertion approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector insertion approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-INSERTION-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector insertion approval boundary rows: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /collector insertion gate rows covered: 12/);
  assert.match(doc, /source-owner approval rows covered: 12/);
  assert.match(doc, /collector source-locus closure rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /implementation-ready collector insertion approval rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5681/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5681/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector insertion approval is backed by current NO-GO gates', () => {
  const collectorApproval = read(sourceDocs.collectorApproval);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const sourceLocusClosure = read(sourceDocs.sourceLocusClosure);
  const methodGap = read(sourceDocs.methodGap);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const collectorParity = read(sourceDocs.collectorParity);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(collectorApproval, /runtime collector insertion points approved: 0/);
  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(collectorInsertion, /collector insertion gate rows: 12/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorInsertion, /collector rows with no-work preservation proof: 0/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(sourceOwnerApproval, /method semantic proof gap files covered: 69/);
  assert.match(sourceLocusClosure, /runtime collector insertion now: NO-GO/);
  assert.match(sourceLocusClosure, /use source-locus classification as collector approval now: NO-GO/);
  assert.match(sourceLocusClosure, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5681/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(diagnosticPrivacy, /implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(collectorParity, /runtime collector parity rollout proofs approved: 0/);
  assert.match(verificationOutput, /implementation-ready verification output contract rows: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('collector insertion approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  for (const artifactPath of artifactPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, artifactPath)), false, `unexpected artifact exists: ${artifactPath}`);
  }

  for (const decision of [
    'collector insertion approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime metric collector approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'use insertion risk mapping as insertion approval now: NO-GO',
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

test('collector insertion approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector insertion approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    collectorApproval: sourceDocs.collectorApproval,
    collectorInsertion: sourceDocs.collectorInsertion,
    sourceOwnerApproval: sourceDocs.sourceOwnerApproval,
    sourceLocusClosure: sourceDocs.sourceLocusClosure,
    implementationReadiness: sourceDocs.implementationReadiness,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector insertion approval boundary addendum:[\s\S]*69\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Insertion Approval Boundary Addendum[\s\S]*69\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Insertion Approval Boundary Addendum[\s\S]*69\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Insertion Approval Boundary Addendum[\s\S]*69\s+method semantic proof gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
