import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-implementation-authority-boundary-current-behavior.test.mjs';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusDiagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusParityReleaseVerification: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-SOURCE-LOCUS-IMPLEMENTATION-00-settings-scope',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-02-transport-json',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-03-filter-engine',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-04-dom-fallback',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-05-menu-quickblock',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-06-network-resolver',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-09-whitelist-policy',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-IMPLEMENTATION-11-parity-release-verification'
];

const closureRows = [
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-00-settings-scope',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-02-transport-json',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-03-filter-engine',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-04-dom-fallback',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-05-menu-quickblock',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-06-network-resolver',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-09-whitelist-policy',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-11-parity-release-verification'
];

const sourceLocusRows = [
  'FT-SOURCE-LOCUS-CALLABLE-00-settings-scope',
  'FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-CALLABLE-02-transport-json',
  'FT-SOURCE-LOCUS-CALLABLE-03-filter-engine',
  'FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback',
  'FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock',
  'FT-SOURCE-LOCUS-CALLABLE-06-network-resolver',
  'FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy',
  'FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification'
];

const riskClasses = [
  'line-anchor-without-owner',
  'hash-without-approval',
  'lifecycle-without-teardown-owner',
  'no-work-without-preservation-artifact',
  'side-effect-without-budget-artifact',
  'fixture-without-provenance-artifact',
  'diagnostic-without-privacy-artifact',
  'parity-release-without-verification-output'
];

const anchorChecks = [
  { file: sourceDocs.sourceLocusCallable, line: 54, needle: 'source-locus callable boundary rows: 12' },
  { file: sourceDocs.sourceLocusCallable, line: 67, needle: 'implementation-ready source-locus callable rows: 0' },
  { file: sourceDocs.sourceLocusCallable, line: 68, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusFingerprint, line: 56, needle: 'source-locus fingerprint boundary rows: 12' },
  { file: sourceDocs.sourceLocusFingerprint, line: 66, needle: 'implementation-ready source-locus fingerprint rows: 0' },
  { file: sourceDocs.sourceLocusFingerprint, line: 67, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusFingerprint, line: 71, needle: 'not completion proof for source-locus fingerprint approval authority' },
  { file: sourceDocs.sourceLocusTeardown, line: 61, needle: 'source-locus teardown boundary rows: 12' },
  { file: sourceDocs.sourceLocusTeardown, line: 73, needle: 'implementation-ready source-locus teardown rows: 0' },
  { file: sourceDocs.sourceLocusTeardown, line: 74, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusTeardown, line: 78, needle: 'not completion proof for source-locus teardown approval authority' },
  { file: sourceDocs.sourceLocusNoWork, line: 55, needle: 'source-locus no-work boundary rows: 12' },
  { file: sourceDocs.sourceLocusNoWork, line: 72, needle: 'implementation-ready source-locus no-work rows: 0' },
  { file: sourceDocs.sourceLocusNoWork, line: 73, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusNoWork, line: 77, needle: 'not completion proof for source-locus no-work approval authority' },
  { file: sourceDocs.sourceLocusSideEffect, line: 58, needle: 'source-locus side-effect boundary rows: 12' },
  { file: sourceDocs.sourceLocusSideEffect, line: 77, needle: 'implementation-ready source-locus side-effect rows: 0' },
  { file: sourceDocs.sourceLocusSideEffect, line: 78, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusSideEffect, line: 82, needle: 'not completion proof for source-locus side-effect approval authority' },
  { file: sourceDocs.sourceLocusFixtureProvenance, line: 61, needle: 'source-locus fixture provenance boundary rows: 12' },
  { file: sourceDocs.sourceLocusFixtureProvenance, line: 86, needle: 'implementation-ready source-locus fixture provenance rows: 0' },
  { file: sourceDocs.sourceLocusFixtureProvenance, line: 87, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusFixtureProvenance, line: 91, needle: 'not completion proof for source-locus fixture provenance approval authority' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 60, needle: 'source-locus diagnostic privacy boundary rows: 12' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 87, needle: 'implementation-ready source-locus diagnostic privacy rows: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 88, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 92, needle: 'not completion proof for source-locus diagnostic privacy approval authority' },
  { file: sourceDocs.sourceLocusParityReleaseVerification, line: 73, needle: 'source-locus parity release verification boundary rows: 12' },
  { file: sourceDocs.sourceLocusParityReleaseVerification, line: 106, needle: 'implementation-ready source-locus parity release verification rows: 0' },
  { file: sourceDocs.sourceLocusParityReleaseVerification, line: 107, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusParityReleaseVerification, line: 111, needle: 'not completion proof for source-locus parity release verification approval authority' },
  { file: sourceDocs.implementationReadiness, line: 29, needle: 'First optimization implementation gate decision: NO-GO' },
  { file: sourceDocs.implementationReadiness, line: 57, needle: 'first optimization implementation readiness rows: 14' },
  { file: sourceDocs.implementationReadiness, line: 75, needle: 'runtime first optimization approvals: 0' },
  { file: sourceDocs.implementationReadiness, line: 76, needle: 'implementation-ready first optimization rows: 0' },
  { file: sourceDocs.sourceOwnerApproval, line: 63, needle: 'source-owner approval boundary rows: 12' },
  { file: sourceDocs.sourceOwnerApproval, line: 74, needle: 'runtime source-owner approvals: 0' },
  { file: sourceDocs.sourceOwnerApproval, line: 77, needle: 'implementation-ready source-owner approval rows: 0' },
  { file: sourceDocs.sourceOwnerApproval, line: 82, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceOwnerApproval, line: 86, needle: 'not completion proof for source-owner approval authority' },
  { file: sourceDocs.collectorApproval, line: 69, needle: 'collector approval authority rows: 12' },
  { file: sourceDocs.collectorApproval, line: 80, needle: 'runtime metric collector approvals: 0' },
  { file: sourceDocs.collectorApproval, line: 81, needle: 'runtime collector insertion points approved: 0' },
  { file: sourceDocs.collectorApproval, line: 88, needle: 'implementation-ready collector approval rows: 0' },
  { file: sourceDocs.collectorApproval, line: 93, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.collectorApproval, line: 97, needle: 'not completion proof for collector approval authority' },
  { file: sourceDocs.artifactCommitReadiness, line: 104, needle: 'first optimization artifact commit readiness rows: 12' },
  { file: sourceDocs.artifactCommitReadiness, line: 106, needle: 'reserved artifact files covered: 9' },
  { file: sourceDocs.artifactCommitReadiness, line: 114, needle: 'committed metric foundation artifact files: 0' },
  { file: sourceDocs.artifactCommitReadiness, line: 118, needle: 'implementation-ready artifact commit rows: 0' },
  { file: sourceDocs.artifactCommitReadiness, line: 130, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.artifactCommitReadiness, line: 134, needle: 'not completion proof for artifact commit authority' },
  { file: sourceDocs.metricFoundationCoverage, line: 102, needle: 'first optimization metric foundation contract coverage rows: 12' },
  { file: sourceDocs.metricFoundationCoverage, line: 113, needle: 'committed foundation metric artifact files: 0' },
  { file: sourceDocs.metricFoundationCoverage, line: 115, needle: 'implementation-ready contract coverage rows: 0' },
  { file: sourceDocs.metricFoundationCoverage, line: 129, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.metricFoundationCoverage, line: 133, needle: 'not completion proof for metric foundation artifact authority' },
  { file: sourceDocs.runtimeResults, line: 16, needle: 'tests 4457' },
  { file: sourceDocs.runtimeResults, line: 17, needle: 'pass 4457' },
  { file: sourceDocs.runtimeResults, line: 18, needle: 'fail 0' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusImplementationAuthorityBoundary',
  'firstOptimizationSourceLocusImplementationReport',
  'sourceLocusImplementationAuthorityApproval',
  'sourceLocusImplementationGoGate',
  'sourceLocusRuntimeOptimizationApproval',
  'jsonFirstSourceLocusImplementationGate',
  'whitelistSourceLocusImplementationGate',
  'runtimeSourceLocusImplementationMap',
  'metricFoundationSourceLocusImplementationAuthority',
  'sourceLocusImplementationPacket',
  'firstOptimizationRuntimePatchAuthority',
  'sourceLocusImplementationNoGoReport',
  'firstOptimizationSourceLocusImplementationClosure',
  'sourceLocusImplementationClosureApproval',
  'sourceLocusImplementationReadinessFromClosure'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineAt(file, lineNumber) {
  return read(file).split(/\r?\n/)[lineNumber - 1] || '';
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
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

test('source-locus implementation authority boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus\s+implementation authority boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not\s+an implementation patch, optimization patch/);
  assert.match(doc, /This is implementation authority classification, not implementation approval/);
  assert.match(doc, /runtime first optimization approval now: NO-GO/);
  assert.match(doc, /commit metric foundation artifact files now: NO-GO/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /source-locus implementation closure rows: 12/);
  assert.match(doc, /implementation rows covered by closure: 12/);
  assert.match(doc, /callable rows linked by closure: 12/);
  assert.match(doc, /risk classes linked by closure: 8/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /runtime implementation approvals from closure: 0/);
  assert.match(doc, /runtime source-owner approvals from closure: 0/);
  assert.match(doc, /runtime collector approvals from closure: 0/);
  assert.match(doc, /source-locus implementation closure: IMPLEMENTATION-CHAIN-CLOSED/);
  assert.match(doc, /source-locus implementation readiness from closure: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus implementation authority rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-IMPLEMENTATION-[^`]+)` \|/gm)].map((row) => row[1]);
  const foundClosureRows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-AUTHORITY-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.deepEqual(foundClosureRows, closureRows);
  assert.equal(rows.length, 12);
  assert.equal(foundClosureRows.length, 12);
  for (const row of expectedRows) {
    const references = [...doc.matchAll(new RegExp(`\\b${row}\\b`, 'g'))].length;
    assert.ok(references >= 2, `implementation row ${row} is not linked from closure`);
  }
  assert.match(doc, /source-locus implementation authority boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /source-locus diagnostic privacy rows covered: 12/);
  assert.match(doc, /source-locus parity release verification rows covered: 12/);
  assert.match(doc, /source-owner approval rows covered: 12/);
  assert.match(doc, /collector approval authority rows covered: 12/);
  assert.match(doc, /artifact commit readiness rows covered: 12/);
  assert.match(doc, /metric foundation contract coverage rows covered: 12/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /reserved metric foundation artifact files covered: 9/);
  assert.match(doc, /current source-locus implementation authority anchors covered: 60/);
  assert.match(doc, /source-locus implementation risk classes covered: 8/);
  assert.match(doc, /committed metric foundation artifact files: 0/);
  assert.match(doc, /runtime first optimization approvals: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /implementation-ready source-locus implementation rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /source-locus implementation closure rows: 12/);
  assert.match(doc, /implementation rows covered by closure: 12/);
  assert.match(doc, /callable rows linked by closure: 12/);
  assert.match(doc, /risk classes linked by closure: 8/);
  assert.match(doc, /reserved artifact paths linked by closure: 9/);
  assert.match(doc, /runtime implementation approvals from closure: 0/);
  assert.match(doc, /runtime source-owner approvals from closure: 0/);
  assert.match(doc, /runtime collector approvals from closure: 0/);
  assert.match(doc, /source-locus implementation closure: IMPLEMENTATION-CHAIN-CLOSED/);
  assert.match(doc, /source-locus implementation readiness from closure: NO-GO/);

  for (const row of sourceLocusRows) assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  for (const riskClass of riskClasses) assert.ok(doc.includes(riskClass), `missing risk class ${riskClass}`);
  for (const artifactPath of artifactPaths) assert.ok(doc.includes(artifactPath), `missing artifact path ${artifactPath}`);
});

test('source-locus implementation authority anchors resolve to current audit text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 60);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus implementation authority preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const artifactCommitReadiness = read(sourceDocs.artifactCommitReadiness);
  const metricFoundationCoverage = read(sourceDocs.metricFoundationCoverage);

  for (const artifactPath of artifactPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, artifactPath)), false, `unexpected artifact exists: ${artifactPath}`);
  }

  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(collectorApproval, /runtime metric collector approvals: 0/);
  assert.match(collectorApproval, /runtime collector insertion points approved: 0/);
  assert.match(artifactCommitReadiness, /committed metric foundation artifact files: 0/);
  assert.match(metricFoundationCoverage, /committed foundation metric artifact files: 0/);
  assert.match(doc, /commit packet-manifest\.json now: NO-GO/);
  assert.match(doc, /commit verification-output\.tap now: NO-GO/);
  assert.match(doc, /native sync patch: NO-GO/);
  assert.match(doc, /release package patch: NO-GO/);
  assert.match(doc, /public claim patch: NO-GO/);
});

test('source-locus implementation authority future symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }

  for (const decision of [
    'close source-locus implementation documentation chain now: GO',
    'accept source-locus closure as runtime optimization approval now: NO-GO',
    'accept source-locus closure as source-owner approval now: NO-GO',
    'accept source-locus closure as collector insertion approval now: NO-GO',
    'accept source-locus closure as metric artifact commit approval now: NO-GO',
    'accept source-locus closure as JSON-first runtime behavior approval now: NO-GO',
    'accept source-locus closure as whitelist optimization approval now: NO-GO',
    'accept source-locus closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing closure decision ${decision}`);
  }

  assert.match(doc, /Settings scope is classified; source-owner, no-work, side-effect, metric sample, and rollback proof remain absent/);
  assert.match(doc, /DOM fallback is classified; clean DOM fixtures, negative sibling proof, restore proof, and parity rollout remain absent/);
  assert.match(doc, /Diagnostic privacy is absent; redaction proof, debug-disabled proof, metric replacement, performance-claim scope, and owner approval remain absent/);
});

test('source-locus implementation authority boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusParityReleaseVerification: sourceDocs.sourceLocusParityReleaseVerification,
    implementationReadiness: sourceDocs.implementationReadiness,
    sourceOwnerApproval: sourceDocs.sourceOwnerApproval,
    collectorApproval: sourceDocs.collectorApproval,
    artifactCommitReadiness: sourceDocs.artifactCommitReadiness,
    metricFoundationCoverage: sourceDocs.metricFoundationCoverage,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };
  const doc = read(docPath);

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('tests 4457'));
  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.ok(doc.includes(runtimeTestPath));
});
