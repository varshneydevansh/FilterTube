import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-side-effect-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const sideEffectPath = 'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json';

const sourceDocs = {
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffectContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertionApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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

const expectedRows = [
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-01-source-insertion-no-work-preconditions',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-02-settings-artifact-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-03-fetch-body-rebuild-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-04-xhr-listener-override-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-05-engine-map-side-effect-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-06-dom-selector-rerun-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-07-menu-quick-lifecycle-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-08-network-timeout-credential-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-09-storage-backup-refresh-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-10-visual-whitelist-diagnostic-budget',
  'FT-COLLECTOR-SIDEEFFECT-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved packet id',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'Source-owner approval',
  'callable semantic proof',
  'Settings read/write budget',
  'Clone/read budget',
  'Listener-wrap budget',
  'Harvest versus mutation budget',
  'Selector budget',
  'Listener/observer/timer budget',
  'Credential policy',
  'Storage read/write budget',
  'Hide/restore mutation budget',
  'Persisted side-effect packet',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorSideEffectApprovalBoundary',
  'firstOptimizationCollectorSideEffectApprovalReport',
  'collectorSideEffectApprovalPacket',
  'collectorSideEffectApprovalStatus',
  'collectorSettingsSideEffectApproval',
  'collectorTransportSideEffectApproval',
  'collectorDomLifecycleSideEffectApproval',
  'collectorNetworkStorageSideEffectApproval',
  'collectorVisualWhitelistSideEffectApproval',
  'collectorDiagnosticRolloutSideEffectApproval',
  'collectorSideEffectRuntimeAuthority',
  'metricFoundationCollectorSideEffectApproval',
  'jsonFirstCollectorSideEffectApprovalGate',
  'whitelistCollectorSideEffectApprovalGate',
  'runtimeCollectorSideEffectApproval',
  'collectorSideEffectApprovalNoGoBoundary'
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

test('collector side-effect approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector side-effect\s+approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /None of those\s+facts is runtime side-effect approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /Committed side-effect budget files: 0/);
  assert.match(doc, /Implementation-ready collector side-effect approval rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector side-effect approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector side-effect approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-SIDEEFFECT-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector side-effect approval boundary rows: 12/);
  assert.match(doc, /collector side-effect budget rows covered: 12/);
  assert.match(doc, /side-effect budget contract rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /collector insertion approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /collector insertion gate rows covered: 12/);
  assert.match(doc, /collector no-work preservation rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /required work-budget fields covered: 12/);
  assert.match(doc, /current source side-effect anchors covered: 53/);
  assert.match(doc, /side-effect risk classes covered: 8/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /implementation-ready collector side-effect approval rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5720/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5720/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector side-effect approval is backed by current NO-GO gates', () => {
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const sideEffectContract = read(sourceDocs.sideEffectContract);
  const sourceLocusSideEffect = read(sourceDocs.sourceLocusSideEffect);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const collectorInsertionApproval = read(sourceDocs.collectorInsertionApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const collectorParity = read(sourceDocs.collectorParity);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorSideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(sideEffectContract, /committed side-effect budget files: 0/);
  assert.match(sideEffectContract, /implementation-ready side-effect budget contract rows: 0/);
  assert.match(sourceLocusSideEffect, /implementation-ready source-locus side-effect rows: 0/);
  assert.match(sourceLocusSideEffect, /commit side-effect-budget\.json now: NO-GO/);
  assert.match(collectorNoWorkApproval, /runtime collector no-work approval now: NO-GO/);
  assert.match(collectorNoWorkApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorInsertionApproval, /runtime collector insertion approval now: NO-GO/);
  assert.match(collectorInsertionApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorApproval, /runtime collector side-effect budgets approved: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5720/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(collectorInsertion, /collector rows implementation-ready: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
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

test('collector side-effect approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, sideEffectPath)), false, `${sideEffectPath} should not exist yet`);

  for (const decision of [
    'collector side-effect approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'use side-effect matrix as side-effect approval now: NO-GO',
    'use side-effect contract as side-effect approval now: NO-GO',
    'use source-locus side-effect classification as side-effect approval now: NO-GO',
    'commit side-effect-budget.json now: NO-GO',
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

test('collector side-effect approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector side-effect approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    collectorSideEffect: sourceDocs.collectorSideEffect,
    sideEffectContract: sourceDocs.sideEffectContract,
    sourceLocusSideEffect: sourceDocs.sourceLocusSideEffect,
    collectorNoWorkApproval: sourceDocs.collectorNoWorkApproval,
    collectorInsertionApproval: sourceDocs.collectorInsertionApproval,
    collectorApproval: sourceDocs.collectorApproval,
    implementationReadiness: sourceDocs.implementationReadiness,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector side-effect approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Side-Effect Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Side-Effect Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Side-Effect Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
