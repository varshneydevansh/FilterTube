import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-diagnostic-privacy-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const diagnosticPath = 'docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json';

const sourceDocs = {
  diagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusDiagnostic: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  loggingPolicy: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffectApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertionApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-01-source-insertion-fixture-preconditions',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-02-console-inventory',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-03-owner-reason-route-scope',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-04-payload-privacy-class',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-05-redaction-leak-proof',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-06-debug-console-budget',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-07-metric-replacement',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-08-no-work-fixture-coupling',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-09-release-public-rollout-scope',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-10-verification-output',
  'FT-COLLECTOR-DIAGNOSTIC-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved packet id',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'Source-owner approval',
  'callable semantic proof',
  'Console inventory id',
  'Log owner',
  'Privacy class',
  'Redaction policy',
  'Debug gate',
  'Metric replacement policy',
  'No-work budget',
  'Public claim scope',
  'Verification command',
  'Persisted diagnostic privacy packet',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorDiagnosticPrivacyApprovalBoundary',
  'firstOptimizationCollectorDiagnosticPrivacyApprovalReport',
  'collectorDiagnosticPrivacyApprovalPacket',
  'collectorDiagnosticPrivacyApprovalStatus',
  'collectorConsoleInventoryApproval',
  'collectorDiagnosticPayloadPrivacyApproval',
  'collectorDiagnosticRedactionApproval',
  'collectorDiagnosticDebugGateApproval',
  'collectorDiagnosticMetricReplacementApproval',
  'collectorDiagnosticNoWorkApproval',
  'collectorDiagnosticReleaseScopeApproval',
  'collectorDiagnosticPrivacyRuntimeAuthority',
  'metricFoundationCollectorDiagnosticPrivacyApproval',
  'jsonFirstCollectorDiagnosticPrivacyApprovalGate',
  'whitelistCollectorDiagnosticPrivacyApprovalGate',
  'runtimeCollectorDiagnosticPrivacyApproval',
  'collectorDiagnosticPrivacyApprovalNoGoBoundary'
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

test('collector diagnostic privacy approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector diagnostic\s+privacy approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /None of those facts is runtime diagnostic privacy approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime collector diagnostic privacy approvals: 0/);
  assert.match(doc, /Committed diagnostic privacy files: 0/);
  assert.match(doc, /Implementation-ready collector diagnostic privacy approval rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector diagnostic privacy approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector diagnostic privacy approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-DIAGNOSTIC-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector diagnostic privacy approval boundary rows: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /source-locus diagnostic privacy rows covered: 12/);
  assert.match(doc, /collector fixture provenance approval rows covered: 12/);
  assert.match(doc, /collector side-effect approval rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /collector insertion approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /diagnostic logging policy source files covered: 21/);
  assert.match(doc, /active console callsites covered: 418/);
  assert.match(doc, /console\.log callsites covered: 203/);
  assert.match(doc, /console\.warn callsites covered: 123/);
  assert.match(doc, /console\.error callsites covered: 68/);
  assert.match(doc, /console\.debug callsites covered: 24/);
  assert.match(doc, /current diagnostic privacy anchors covered: 35/);
  assert.match(doc, /diagnostic privacy risk classes covered: 8/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5673/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5673/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /runtime collector diagnostic privacy approvals: 0/);
  assert.match(doc, /committed diagnostic privacy files: 0/);
  assert.match(doc, /implementation-ready collector diagnostic privacy approval rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector diagnostic privacy approval is backed by current NO-GO gates', () => {
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const sourceLocusDiagnostic = read(sourceDocs.sourceLocusDiagnostic);
  const loggingPolicy = read(sourceDocs.loggingPolicy);
  const collectorFixtureApproval = read(sourceDocs.collectorFixtureApproval);
  const collectorSideEffectApproval = read(sourceDocs.collectorSideEffectApproval);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const collectorInsertionApproval = read(sourceDocs.collectorInsertionApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const collectorParity = read(sourceDocs.collectorParity);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(diagnosticPrivacy, /committed diagnostic privacy files: 0/);
  assert.match(diagnosticPrivacy, /implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(sourceLocusDiagnostic, /implementation-ready source-locus diagnostic privacy rows: 0/);
  assert.match(sourceLocusDiagnostic, /commit diagnostic-privacy\.json now: NO-GO/);
  assert.match(loggingPolicy, /active console callsites: 419/);
  assert.match(loggingPolicy, /not completion proof for diagnostic logging policy authority/);
  assert.match(collectorFixtureApproval, /runtime collector fixture provenance approval now: NO-GO/);
  assert.match(collectorFixtureApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorSideEffectApproval, /runtime collector side-effect approval now: NO-GO/);
  assert.match(collectorSideEffectApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorNoWorkApproval, /runtime collector no-work approval now: NO-GO/);
  assert.match(collectorNoWorkApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorInsertionApproval, /runtime collector insertion approval now: NO-GO/);
  assert.match(collectorInsertionApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorApproval, /Diagnostic privacy approval/);
  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5673/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(collectorParity, /runtime collector parity rollout proofs approved: 0/);
  assert.match(verificationOutput, /implementation-ready verification output contract rows: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('collector diagnostic privacy approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, diagnosticPath)), false, `${diagnosticPath} should not exist yet`);

  for (const decision of [
    'collector diagnostic privacy approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'runtime collector diagnostic privacy approval now: NO-GO',
    'use diagnostic privacy contract as diagnostic approval now: NO-GO',
    'use source-locus diagnostic classification as diagnostic approval now: NO-GO',
    'use console inventory as diagnostic approval now: NO-GO',
    'commit diagnostic-privacy.json now: NO-GO',
    'commit metric foundation artifact files now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'diagnostic logging removal patch: NO-GO',
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

test('collector diagnostic privacy approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector diagnostic privacy approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    diagnosticPrivacy: sourceDocs.diagnosticPrivacy,
    sourceLocusDiagnostic: sourceDocs.sourceLocusDiagnostic,
    collectorFixtureApproval: sourceDocs.collectorFixtureApproval,
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
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector diagnostic privacy approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Diagnostic Privacy Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Diagnostic Privacy Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Diagnostic Privacy Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
