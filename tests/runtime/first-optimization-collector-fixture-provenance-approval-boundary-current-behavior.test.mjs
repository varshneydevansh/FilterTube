import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-fixture-provenance-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const fixturePath = 'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json';

const sourceDocs = {
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffectApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWorkApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertionApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-COLLECTOR-FIXTURE-APPROVAL-00-binding-scope',
  'FT-COLLECTOR-FIXTURE-APPROVAL-01-source-insertion-no-work-side-effect-preconditions',
  'FT-COLLECTOR-FIXTURE-APPROVAL-02-raw-source-provenance',
  'FT-COLLECTOR-FIXTURE-APPROVAL-03-committed-fixture-provenance',
  'FT-COLLECTOR-FIXTURE-APPROVAL-04-positive-fixture',
  'FT-COLLECTOR-FIXTURE-APPROVAL-05-negative-sibling-fixture',
  'FT-COLLECTOR-FIXTURE-APPROVAL-06-no-rule-disabled-empty',
  'FT-COLLECTOR-FIXTURE-APPROVAL-07-json-dom-parity',
  'FT-COLLECTOR-FIXTURE-APPROVAL-08-native-release-public-boundary',
  'FT-COLLECTOR-FIXTURE-APPROVAL-09-side-effect-no-work-diagnostic-coupling',
  'FT-COLLECTOR-FIXTURE-APPROVAL-10-verification-output',
  'FT-COLLECTOR-FIXTURE-APPROVAL-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved packet id',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'Source-owner approval',
  'callable semantic proof',
  'Raw-source hashes',
  'Committed fixture hashes',
  'Positive fixture output',
  'Negative sibling fixture output',
  'Disabled fixture output',
  'JSON fixture',
  'Native parity fixture',
  'Side-effect budget link',
  'Verification command',
  'Persisted fixture provenance packet',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorFixtureProvenanceApprovalBoundary',
  'firstOptimizationCollectorFixtureProvenanceApprovalReport',
  'collectorFixtureProvenanceApprovalPacket',
  'collectorFixtureProvenanceApprovalStatus',
  'collectorRawSourceFixtureApproval',
  'collectorCommittedFixtureApproval',
  'collectorPositiveFixtureApproval',
  'collectorNegativeSiblingFixtureApproval',
  'collectorNoWorkFixtureApproval',
  'collectorParityFixtureApproval',
  'collectorReleaseFixtureApproval',
  'collectorFixtureProvenanceRuntimeAuthority',
  'metricFoundationCollectorFixtureProvenanceApproval',
  'jsonFirstCollectorFixtureProvenanceApprovalGate',
  'whitelistCollectorFixtureProvenanceApprovalGate',
  'runtimeCollectorFixtureProvenanceApproval',
  'collectorFixtureProvenanceApprovalNoGoBoundary'
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

test('collector fixture provenance approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector fixture\s+provenance approval/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /None of those facts is runtime fixture provenance approval/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Runtime collector fixture packets approved: 0/);
  assert.match(doc, /Committed fixture provenance files: 0/);
  assert.match(doc, /Implementation-ready collector fixture provenance approval rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector fixture provenance approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector fixture provenance approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-FIXTURE-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector fixture provenance approval boundary rows: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /fixture provenance contract rows covered: 12/);
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /collector side-effect approval rows covered: 12/);
  assert.match(doc, /collector no-work approval rows covered: 12/);
  assert.match(doc, /collector insertion approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /collector side-effect budget rows covered: 12/);
  assert.match(doc, /collector no-work preservation rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed rows covered: 12/);
  assert.match(doc, /P0 capture traceability rows covered: 11/);
  assert.match(doc, /unique raw capture obligation paths covered: 46/);
  assert.match(doc, /committed reduced fixture fragments covered: 44/);
  assert.match(doc, /current fixture provenance anchors covered: 25/);
  assert.match(doc, /fixture provenance risk classes covered: 8/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /runtime collector side-effect budgets approved: 0/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /committed fixture provenance files: 0/);
  assert.match(doc, /implementation-ready collector fixture provenance approval rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5797/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5797/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing required field ${field}`);
});

test('collector fixture provenance approval is backed by current NO-GO gates', () => {
  const collectorFixture = read(sourceDocs.collectorFixture);
  const fixtureContract = read(sourceDocs.fixtureContract);
  const sourceLocusFixture = read(sourceDocs.sourceLocusFixture);
  const collectorSideEffectApproval = read(sourceDocs.collectorSideEffectApproval);
  const collectorNoWorkApproval = read(sourceDocs.collectorNoWorkApproval);
  const collectorInsertionApproval = read(sourceDocs.collectorInsertionApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const methodGap = read(sourceDocs.methodGap);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const diagnosticPrivacy = read(sourceDocs.diagnosticPrivacy);
  const collectorParity = read(sourceDocs.collectorParity);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(collectorFixture, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(fixtureContract, /committed fixture provenance files: 0/);
  assert.match(fixtureContract, /implementation-ready fixture provenance contract rows: 0/);
  assert.match(sourceLocusFixture, /implementation-ready source-locus fixture provenance rows: 0/);
  assert.match(sourceLocusFixture, /commit fixture-provenance\.json now: NO-GO/);
  assert.match(collectorSideEffectApproval, /runtime collector side-effect approval now: NO-GO/);
  assert.match(collectorSideEffectApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorNoWorkApproval, /runtime collector no-work approval now: NO-GO/);
  assert.match(collectorNoWorkApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorInsertionApproval, /runtime collector insertion approval now: NO-GO/);
  assert.match(collectorInsertionApproval, /method semantic proof gap files covered: 69/);
  assert.match(collectorApproval, /runtime collector fixture packets approved: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5797/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(diagnosticPrivacy, /implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(collectorParity, /runtime collector parity rollout proofs approved: 0/);
  assert.match(verificationOutput, /implementation-ready verification output contract rows: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('collector fixture provenance approval preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, fixturePath)), false, `${fixturePath} should not exist yet`);

  for (const decision of [
    'collector fixture provenance approval boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime collector insertion approval now: NO-GO',
    'runtime collector no-work approval now: NO-GO',
    'runtime collector side-effect approval now: NO-GO',
    'runtime collector fixture provenance approval now: NO-GO',
    'use fixture provenance matrix as fixture approval now: NO-GO',
    'use fixture provenance contract as fixture approval now: NO-GO',
    'use source-locus fixture classification as fixture approval now: NO-GO',
    'commit fixture-provenance.json now: NO-GO',
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

test('collector fixture provenance approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector fixture provenance approval boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    collectorFixture: sourceDocs.collectorFixture,
    fixtureContract: sourceDocs.fixtureContract,
    sourceLocusFixture: sourceDocs.sourceLocusFixture,
    collectorSideEffectApproval: sourceDocs.collectorSideEffectApproval,
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
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector fixture provenance approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Fixture Provenance Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Fixture Provenance Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Fixture Provenance Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
