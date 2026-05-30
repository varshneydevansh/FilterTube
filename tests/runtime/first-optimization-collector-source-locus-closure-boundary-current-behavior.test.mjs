import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SOURCE_LOCUS_CLOSURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-collector-source-locus-closure-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusImplementation: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusDiagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusParityRelease: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  artifactCommitReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  metricFoundationCoverage: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-COLLECTOR-SOURCE-LOCUS-00-binding',
  'FT-COLLECTOR-SOURCE-LOCUS-01-callable',
  'FT-COLLECTOR-SOURCE-LOCUS-02-teardown',
  'FT-COLLECTOR-SOURCE-LOCUS-03-no-work',
  'FT-COLLECTOR-SOURCE-LOCUS-04-side-effect',
  'FT-COLLECTOR-SOURCE-LOCUS-05-fixture-provenance',
  'FT-COLLECTOR-SOURCE-LOCUS-06-diagnostic-privacy',
  'FT-COLLECTOR-SOURCE-LOCUS-07-parity-release-verification',
  'FT-COLLECTOR-SOURCE-LOCUS-08-source-owner-approval',
  'FT-COLLECTOR-SOURCE-LOCUS-09-collector-approval',
  'FT-COLLECTOR-SOURCE-LOCUS-10-artifact-absence',
  'FT-COLLECTOR-SOURCE-LOCUS-11-ledger-runtime-results'
];

const requiredFields = [
  'Owner-approved packet id',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'Exact producer callable approval',
  'semantic method proof',
  'Observer/timer ownership',
  'Disabled, no-rule, empty-list',
  'Settings, network, storage',
  'Raw source boundary',
  'Privacy class',
  'JSON/DOM/native parity',
  'source-owner map',
  'Runtime metric collector approval',
  'Packet manifest',
  'Runtime approval token',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationCollectorSourceLocusClosureBoundary',
  'firstOptimizationCollectorSourceLocusClosureReport',
  'collectorSourceLocusClosureApproval',
  'collectorSourceLocusRuntimeApproval',
  'collectorSourceLocusNoGoBoundary',
  'metricFoundationCollectorSourceLocusAuthority',
  'jsonFirstCollectorSourceLocusGate',
  'whitelistCollectorSourceLocusGate',
  'runtimeCollectorSourceLocusMap',
  'collectorSourceLocusApprovalPacket',
  'collectorSourceLocusArtifactApproval',
  'collectorSourceLocusRuntimeAuthority'
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

test('collector source-locus closure boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization collector source-locus\s+closure boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /This is a closure boundary, not an approval boundary/);
  assert.match(doc, /Selected first optimization binding: FT-BIND-00-metric-artifact-foundation/);
  assert.match(doc, /Runtime source-owner approvals: 0/);
  assert.match(doc, /Runtime metric collector approvals: 0/);
  assert.match(doc, /Implementation-ready collector source-locus closure rows: 0/);
  assert.match(doc, /affected callable semantic proof/);
  assert.match(doc, /not completion proof for collector source-locus closure authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('collector source-locus closure rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-SOURCE-LOCUS-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector source-locus closure rows: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /source-locus implementation authority rows covered: 12/);
  assert.match(doc, /source-owner approval rows covered: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /source-locus diagnostic privacy rows covered: 12/);
  assert.match(doc, /source-locus parity release verification rows covered: 12/);
  assert.match(doc, /artifact commit readiness rows covered: 12/);
  assert.match(doc, /metric foundation contract coverage rows covered: 12/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /committed metric foundation artifact files: 0/);
  assert.match(doc, /implementation-ready collector source-locus closure rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 63/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5469/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5469/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) assert.ok(doc.includes(field), `missing field ${field}`);
  for (const artifactPath of artifactPaths) assert.ok(doc.includes(artifactPath), `missing artifact path ${artifactPath}`);
});

test('collector source-locus closure is backed by source-locus and collector NO-GO gates', () => {
  const collectorApproval = read(sourceDocs.collectorApproval);
  const sourceLocusImplementation = read(sourceDocs.sourceLocusImplementation);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const methodGap = read(sourceDocs.methodGap);
  const sourceLocusCallable = read(sourceDocs.sourceLocusCallable);
  const sourceLocusTeardown = read(sourceDocs.sourceLocusTeardown);
  const sourceLocusNoWork = read(sourceDocs.sourceLocusNoWork);
  const sourceLocusSideEffect = read(sourceDocs.sourceLocusSideEffect);
  const sourceLocusFixtureProvenance = read(sourceDocs.sourceLocusFixtureProvenance);
  const sourceLocusDiagnosticPrivacy = read(sourceDocs.sourceLocusDiagnosticPrivacy);
  const sourceLocusParityRelease = read(sourceDocs.sourceLocusParityRelease);
  const artifactCommitReadiness = read(sourceDocs.artifactCommitReadiness);
  const metricFoundationCoverage = read(sourceDocs.metricFoundationCoverage);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(collectorApproval, /implementation-ready collector approval rows: 0/);
  assert.match(collectorApproval, /method semantic proof gap files covered: 63/);
  assert.match(sourceLocusImplementation, /implementation-ready source-locus implementation rows: 0/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(sourceOwnerApproval, /method semantic proof gap files covered: 63/);
  assert.match(methodGap, /files with lexical accounting: 63/);
  assert.match(methodGap, /repo-wide lexical callables: 5469/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(sourceLocusCallable, /implementation-ready source-locus callable rows: 0/);
  assert.match(sourceLocusTeardown, /implementation-ready source-locus teardown rows: 0/);
  assert.match(sourceLocusNoWork, /implementation-ready source-locus no-work rows: 0/);
  assert.match(sourceLocusSideEffect, /implementation-ready source-locus side-effect rows: 0/);
  assert.match(sourceLocusFixtureProvenance, /implementation-ready source-locus fixture provenance rows: 0/);
  assert.match(sourceLocusDiagnosticPrivacy, /implementation-ready source-locus diagnostic privacy rows: 0/);
  assert.match(sourceLocusParityRelease, /implementation-ready source-locus parity release verification rows: 0/);
  assert.match(artifactCommitReadiness, /committed metric foundation artifact files: 0/);
  assert.match(metricFoundationCoverage, /committed foundation metric artifact files: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
});

test('collector source-locus closure preserves artifact absence and NO-GO decisions', () => {
  const doc = read(docPath);

  for (const artifactPath of artifactPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, artifactPath)), false, `unexpected artifact exists: ${artifactPath}`);
  }

  for (const decision of [
    'collector source-locus closure boundary documented: GO',
    'runtime source-owner approval now: NO-GO',
    'runtime metric collector approval now: NO-GO',
    'runtime collector insertion now: NO-GO',
    'commit metric foundation artifact files now: NO-GO',
    'use source-locus classification as collector approval now: NO-GO',
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

test('collector source-locus closure future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('collector source-locus closure boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    collectorApproval: sourceDocs.collectorApproval,
    sourceLocusImplementation: sourceDocs.sourceLocusImplementation,
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
  assert.match(read(sourceDocs.runtimeResults), /First optimization collector source-locus closure boundary addendum:[\s\S]*63\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /First Optimization Collector Source-Locus Closure Boundary Addendum[\s\S]*63\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /First Optimization Collector Source-Locus Closure Boundary Addendum[\s\S]*63\s+method semantic proof gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /First Optimization Collector Source-Locus Closure Boundary Addendum[\s\S]*63\s+method semantic proof gap\s+files covered/);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
