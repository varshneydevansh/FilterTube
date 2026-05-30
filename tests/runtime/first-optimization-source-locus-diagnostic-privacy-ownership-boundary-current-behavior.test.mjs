import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-diagnostic-privacy-ownership-boundary-current-behavior.test.mjs';
const diagnosticPrivacyPath = 'docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json';
const fixtureProvenancePath = 'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';
const sideEffectBudgetPath = 'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json';
const noWorkPreservationPath = 'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticPrivacyContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticLoggingPolicy: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-SOURCE-LOCUS-DIAGNOSTIC-00-settings-scope',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-02-transport-json',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-03-filter-engine',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-04-dom-fallback',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-05-menu-quickblock',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-06-network-resolver',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-09-whitelist-policy',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-DIAGNOSTIC-11-parity-release-verification'
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

const diagnosticPrivacyRows = [
  'FT-DIAGNOSTIC-PRIVACY-00-packet-binding',
  'FT-DIAGNOSTIC-PRIVACY-01-artifact-binding',
  'FT-DIAGNOSTIC-PRIVACY-02-console-inventory',
  'FT-DIAGNOSTIC-PRIVACY-03-owner-reason-scope',
  'FT-DIAGNOSTIC-PRIVACY-04-privacy-class',
  'FT-DIAGNOSTIC-PRIVACY-05-redaction-policy',
  'FT-DIAGNOSTIC-PRIVACY-06-debug-gate',
  'FT-DIAGNOSTIC-PRIVACY-07-metric-replacement',
  'FT-DIAGNOSTIC-PRIVACY-08-no-work-budget',
  'FT-DIAGNOSTIC-PRIVACY-09-fixture-provenance',
  'FT-DIAGNOSTIC-PRIVACY-10-release-public-scope',
  'FT-DIAGNOSTIC-PRIVACY-11-verification'
];

const riskClasses = [
  'console-inventory-budget',
  'identity-payload-redaction',
  'import-payload-redaction',
  'debug-gate',
  'metric-replacement',
  'no-work-preservation',
  'fixture-provenance-coupling',
  'release-public-claim-scope'
];

const anchorChecks = [
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 65, needle: 'first optimization diagnostic privacy contract rows: 12' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 66, needle: 'reserved diagnostic privacy paths covered: 1' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 68, needle: 'runtime metric collector approvals: 0' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 69, needle: 'implementation-ready diagnostic privacy contract rows: 0' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 85, needle: 'diagnostic logging policy source files covered: 21' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 86, needle: 'active console callsites covered: 418' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 87, needle: 'console.log callsites covered: 203' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 88, needle: 'console.warn callsites covered: 123' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 89, needle: 'console.error callsites covered: 68' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 90, needle: 'console.debug callsites covered: 24' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 91, needle: 'console.info callsites covered: 0' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 54, needle: 'diagnostic logging policy matrix source files: 21' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 55, needle: 'active console callsites: 418' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 56, needle: 'console.log callsites: 203' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 57, needle: 'console.warn callsites: 123' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 58, needle: 'console.error callsites: 68' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 59, needle: 'console.debug callsites: 24' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 60, needle: 'console.info callsites: 0' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 96, needle: '`page-runtime-core` | 196' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 97, needle: '`background-storage-state` | 131' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 107, needle: 'Page runtime extraction' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 108, needle: 'Background identity repair' },
  { file: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 109, needle: 'JSON filter engine' },
  { file: 'js/seed.js', line: 33, needle: 'FilterTube: seed.js initializing (MAIN world)' },
  { file: 'js/seed.js', line: 157, needle: 'window.postMessage({' },
  { file: 'js/filter_logic.js', line: 1566, needle: 'console.log(`FilterTube (Filter):`, message, ...args);' },
  { file: 'js/filter_logic.js', line: 1581, needle: "console.log('FilterTube Whitelist (JSON):', {" },
  { file: 'js/filter_logic.js', line: 3444, needle: "console.warn('FilterTube: Harvesting failed', e);" },
  { file: 'js/content/dom_fallback.js', line: 4559, needle: "console.log('FilterTube Whitelist (DOM):', {" },
  { file: 'js/background.js', line: 3236, needle: "console.log('FilterTube Subscriptions Import:', {" },
  { file: 'js/background.js', line: 3254, needle: 'FilterTube Background: Received getCompiledSettings message' },
  { file: 'js/background.js', line: 5206, needle: "console.log('FilterTube Background: Extracted -'" },
  { file: 'js/content_bridge.js', line: 10571, needle: "console.log('FilterTube: Extracted from lockup data attrs:'" },
  { file: 'js/content_bridge.js', line: 10651, needle: "console.log('FilterTube: Falling back to main-world lookup for video:'" },
  { file: 'js/injector.js', line: 1274, needle: "postLog('log', 'FilterTube Subscriptions Import:', {" }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusDiagnosticPrivacyBoundary',
  'firstOptimizationSourceLocusDiagnosticPrivacyReport',
  'sourceLocusDiagnosticPrivacyApproval',
  'sourceLocusDiagnosticOwnerApproval',
  'jsonFirstSourceLocusDiagnosticPrivacyGate',
  'whitelistSourceLocusDiagnosticPrivacyGate',
  'metricFoundationDiagnosticPrivacyAuthority',
  'runtimeSourceDiagnosticPrivacyMap',
  'sourceLocusDiagnosticPrivacyArtifact',
  'sourceLocusDiagnosticPrivacyPacket',
  'runtimeDiagnosticPrivacyOptimizationAuthority',
  'sourceLocusDiagnosticRedactionReport'
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

test('source-locus diagnostic privacy ownership boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus\s+diagnostic privacy ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch/);
  assert.match(doc, /This is diagnostic privacy ownership classification, not diagnostic privacy\s+approval/);
  assert.match(doc, /diagnostic logging removal patch: NO-GO/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus diagnostic privacy rows and console counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-DIAGNOSTIC-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus diagnostic privacy boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /diagnostic logging policy source files covered: 21/);
  assert.match(doc, /active console callsites covered: 418/);
  assert.match(doc, /console\.log callsites covered: 203/);
  assert.match(doc, /console\.warn callsites covered: 123/);
  assert.match(doc, /console\.error callsites covered: 68/);
  assert.match(doc, /console\.debug callsites covered: 24/);
  assert.match(doc, /console\.info callsites covered: 0/);
  assert.match(doc, /page-runtime-core callsites covered: 196/);
  assert.match(doc, /background-storage-state callsites covered: 131/);
  assert.match(doc, /current diagnostic privacy anchors covered: 35/);
  assert.match(doc, /diagnostic privacy risk classes covered: 8/);
  assert.match(doc, /committed diagnostic privacy files: 0/);
  assert.match(doc, /committed fixture provenance files: 0/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /committed no-work preservation files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus diagnostic privacy rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  for (const row of diagnosticPrivacyRows) assert.ok(doc.includes(row), `missing diagnostic privacy row ${row}`);
  for (const riskClass of riskClasses) assert.ok(doc.includes(riskClass), `missing risk class ${riskClass}`);
});

test('source-locus diagnostic privacy anchors resolve to current source and audit text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 35);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus diagnostic privacy boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const diagnosticPrivacyContract = read(sourceDocs.diagnosticPrivacyContract);
  const diagnosticLoggingPolicy = read(sourceDocs.diagnosticLoggingPolicy);
  const sourceLocusFixtureProvenance = read(sourceDocs.sourceLocusFixtureProvenance);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, diagnosticPrivacyPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, fixtureProvenancePath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sideEffectBudgetPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, noWorkPreservationPath)), false);
  assert.match(diagnosticPrivacyContract, /committed diagnostic privacy files: 0/);
  assert.match(diagnosticPrivacyContract, /runtime metric collector approvals: 0/);
  assert.match(diagnosticPrivacyContract, /implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(diagnosticLoggingPolicy, /not completion proof for diagnostic logging policy authority/);
  assert.match(sourceLocusFixtureProvenance, /implementation-ready source-locus fixture provenance rows: 0/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /commit diagnostic-privacy\.json now: NO-GO/);
  assert.match(doc, /diagnostic logging removal patch: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
});

test('source-locus diagnostic privacy future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus diagnostic privacy boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusFixtureProvenance: sourceDocs.sourceLocusFixtureProvenance,
    diagnosticPrivacyContract: sourceDocs.diagnosticPrivacyContract,
    diagnosticLoggingPolicy: sourceDocs.diagnosticLoggingPolicy,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };
  const doc = read(docPath);

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.ok(doc.includes(runtimeTestPath));
});
