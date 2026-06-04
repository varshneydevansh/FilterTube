import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs';

const artifactPaths = [
  'docs/audit/artifacts/first-optimization/metric-foundation/parity-rollout.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/verification-output.tap',
  'docs/audit/artifacts/first-optimization/metric-foundation/diagnostic-privacy.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json',
  'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json'
];

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusDiagnosticPrivacy: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_DIAGNOSTIC_PRIVACY_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRolloutContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutputContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  rollbackUnclaimed: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorParityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  nativeRuntimeSync: 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md',
  releasePackageParity: 'docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md',
  publicReleaseClaim: 'docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  rawCaptureRelease: 'docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-SOURCE-LOCUS-PARITY-00-settings-scope',
  'FT-SOURCE-LOCUS-PARITY-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-PARITY-02-transport-json',
  'FT-SOURCE-LOCUS-PARITY-03-filter-engine',
  'FT-SOURCE-LOCUS-PARITY-04-dom-fallback',
  'FT-SOURCE-LOCUS-PARITY-05-menu-quickblock',
  'FT-SOURCE-LOCUS-PARITY-06-network-resolver',
  'FT-SOURCE-LOCUS-PARITY-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-PARITY-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-PARITY-09-whitelist-policy',
  'FT-SOURCE-LOCUS-PARITY-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-PARITY-11-parity-release-verification'
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

const parityRolloutRows = [
  'FT-PARITY-ROLLOUT-00-packet-binding',
  'FT-PARITY-ROLLOUT-01-artifact-binding',
  'FT-PARITY-ROLLOUT-02-json-dom-parity',
  'FT-PARITY-ROLLOUT-03-comment-root-parity',
  'FT-PARITY-ROLLOUT-04-kids-native-webview',
  'FT-PARITY-ROLLOUT-05-native-sync-freshness',
  'FT-PARITY-ROLLOUT-06-release-package',
  'FT-PARITY-ROLLOUT-07-public-claim',
  'FT-PARITY-ROLLOUT-08-raw-capture-exclusion',
  'FT-PARITY-ROLLOUT-09-mobile-artifact',
  'FT-PARITY-ROLLOUT-10-diagnostic-claim-scope',
  'FT-PARITY-ROLLOUT-11-verification'
];

const verificationRows = [
  'FT-VERIFY-OUTPUT-00-packet-binding',
  'FT-VERIFY-OUTPUT-01-artifact-binding',
  'FT-VERIFY-OUTPUT-02-command-contract',
  'FT-VERIFY-OUTPUT-03-runtime-counts',
  'FT-VERIFY-OUTPUT-04-tap-format',
  'FT-VERIFY-OUTPUT-05-artifact-absence-check',
  'FT-VERIFY-OUTPUT-06-authority-token-check',
  'FT-VERIFY-OUTPUT-07-source-of-truth-register',
  'FT-VERIFY-OUTPUT-08-adjacent-gate-chain',
  'FT-VERIFY-OUTPUT-09-rollback-unclaimed-surfaces',
  'FT-VERIFY-OUTPUT-10-diagnostic-parity-release-boundary',
  'FT-VERIFY-OUTPUT-11-persistence-gate'
];

const rollbackRows = [
  'FT-ROLLBACK-UNCLAIMED-00-packet-binding',
  'FT-ROLLBACK-UNCLAIMED-01-json-dom-scope',
  'FT-ROLLBACK-UNCLAIMED-02-comment-continuation-scope',
  'FT-ROLLBACK-UNCLAIMED-03-ytm-selected-row-scope',
  'FT-ROLLBACK-UNCLAIMED-04-kids-native-webview-scope',
  'FT-ROLLBACK-UNCLAIMED-05-native-sync-scope',
  'FT-ROLLBACK-UNCLAIMED-06-release-package-scope',
  'FT-ROLLBACK-UNCLAIMED-07-public-claim-scope',
  'FT-ROLLBACK-UNCLAIMED-08-raw-capture-exclusion-scope',
  'FT-ROLLBACK-UNCLAIMED-09-diagnostic-performance-scope',
  'FT-ROLLBACK-UNCLAIMED-10-rollback-command-boundary',
  'FT-ROLLBACK-UNCLAIMED-11-claim-block'
];

const riskClasses = [
  'json-dom-native-parity',
  'native-sync-freshness',
  'release-package-parity',
  'public-claim-scope',
  'raw-capture-release-exclusion',
  'rollback-unclaimed-scope',
  'verification-output-persistence',
  'diagnostic-performance-claim-scope'
];

const anchorChecks = [
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 60, needle: 'source-locus diagnostic privacy boundary rows: 12' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 67, needle: 'diagnostic privacy contract rows covered: 12' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 77, needle: 'current diagnostic privacy anchors covered: 35' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 79, needle: 'committed diagnostic privacy files: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 80, needle: 'committed fixture provenance files: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 81, needle: 'committed source-owner map files: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 82, needle: 'committed side-effect budget files: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 83, needle: 'committed no-work preservation files: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 84, needle: 'runtime source-owner approvals: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 85, needle: 'runtime metric collector approvals: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 86, needle: 'runtime collector insertion points approved: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 87, needle: 'implementation-ready source-locus diagnostic privacy rows: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 88, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 89, needle: 'expected runtime audit pass: 4457' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 90, needle: 'expected runtime audit fail: 0' },
  { file: sourceDocs.sourceLocusDiagnosticPrivacy, line: 91, needle: 'runtime behavior changed: no' },
  { file: sourceDocs.parityRolloutContract, line: 71, needle: 'first optimization parity rollout contract rows: 12' },
  { file: sourceDocs.parityRolloutContract, line: 73, needle: 'committed parity rollout files: 0' },
  { file: sourceDocs.parityRolloutContract, line: 75, needle: 'implementation-ready parity rollout contract rows: 0' },
  { file: sourceDocs.parityRolloutContract, line: 92, needle: 'evidence parity rollout rows covered: 2' },
  { file: sourceDocs.parityRolloutContract, line: 93, needle: 'parity and release boundary source docs covered: 8' },
  { file: sourceDocs.parityRolloutContract, line: 123, needle: 'runtime behavior changed: no' },
  { file: sourceDocs.parityRolloutContract, line: 124, needle: 'not completion proof for parity rollout authority' },
  { file: sourceDocs.verificationOutputContract, line: 64, needle: 'first optimization verification output contract rows: 12' },
  { file: sourceDocs.verificationOutputContract, line: 66, needle: 'committed verification output files: 0' },
  { file: sourceDocs.verificationOutputContract, line: 68, needle: 'implementation-ready verification output contract rows: 0' },
  { file: sourceDocs.verificationOutputContract, line: 90, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.verificationOutputContract, line: 91, needle: 'expected runtime audit pass: 4457' },
  { file: sourceDocs.verificationOutputContract, line: 92, needle: 'expected runtime audit fail: 0' },
  { file: sourceDocs.verificationOutputContract, line: 120, needle: 'not completion proof for verification output authority' },
  { file: sourceDocs.rollbackUnclaimed, line: 61, needle: 'first optimization rollback unclaimed surface boundary rows: 12' },
  { file: sourceDocs.rollbackUnclaimed, line: 67, needle: 'release/native/public boundary source docs covered: 8' },
  { file: sourceDocs.rollbackUnclaimed, line: 69, needle: 'runtime rollback approvals: 0' },
  { file: sourceDocs.rollbackUnclaimed, line: 70, needle: 'runtime unclaimed-surface approvals: 0' },
  { file: sourceDocs.rollbackUnclaimed, line: 72, needle: 'implementation-ready rollback/unclaimed rows: 0' },
  { file: sourceDocs.rollbackUnclaimed, line: 77, needle: 'expected runtime audit tests: 4457' },
  { file: sourceDocs.rollbackUnclaimed, line: 78, needle: 'expected runtime audit pass: 4457' },
  { file: sourceDocs.rollbackUnclaimed, line: 79, needle: 'expected runtime audit fail: 0' },
  { file: sourceDocs.rollbackUnclaimed, line: 81, needle: 'not completion proof for rollback or unclaimed-surface authority' },
  { file: sourceDocs.collectorParityRollout, line: 44, needle: 'collector parity rollout rows: 12' },
  { file: sourceDocs.collectorParityRollout, line: 47, needle: 'evidence parity rollout rows covered: 2' },
  { file: sourceDocs.collectorParityRollout, line: 48, needle: 'parity and release boundary source docs covered: 8' },
  { file: sourceDocs.collectorParityRollout, line: 49, needle: 'runtime collector parity rollout proofs approved: 0' },
  { file: sourceDocs.collectorParityRollout, line: 50, needle: 'collector parity rollout rows implementation-ready: 0' },
  { file: sourceDocs.collectorParityRollout, line: 51, needle: 'runtime behavior changed: no' },
  { file: sourceDocs.nativeRuntimeSync, line: 35, needle: 'entries: 30' },
  { file: sourceDocs.nativeRuntimeSync, line: 37, needle: 'missing source files: 0' },
  { file: sourceDocs.nativeRuntimeSync, line: 38, needle: 'direct manifest copy hash diffs: 6' },
  { file: sourceDocs.nativeRuntimeSync, line: 199, needle: 'Android and iOS freshness gates are asymmetric.' },
  { file: sourceDocs.nativeRuntimeSync, line: 209, needle: 'Future token: `nativeRuntimeSyncAuthority`' },
  { file: sourceDocs.releasePackageParity, line: 26, needle: 'COMMON_DIRS = js, css, html, icons, data, assets' },
  { file: sourceDocs.releasePackageParity, line: 70, needle: 'GitHub release publishing is public before upload proof.' },
  { file: sourceDocs.releasePackageParity, line: 87, needle: 'Future token: `releasePackageParity`' },
  { file: sourceDocs.publicReleaseClaim, line: 27, needle: 'publicReleaseClaimAuthority' },
  { file: sourceDocs.publicReleaseClaim, line: 49, needle: 'Direct APK Gate' },
  { file: sourceDocs.rawCaptureRelease, line: 15, needle: 'ignored root captures' },
  { file: sourceDocs.rawCaptureRelease, line: 27, needle: 'COMMON_DIRS = js, css, html, icons, data, assets' },
  { file: sourceDocs.rawCaptureRelease, line: 49, needle: 'Future token: `rawCaptureReleaseBoundary`' },
  { file: sourceDocs.rawCaptureRelease, line: 83, needle: 'product source has no `rawCaptureReleaseBoundary` implementation yet' },
  { file: sourceDocs.runtimeResults, line: 16, needle: 'tests 4457' },
  { file: sourceDocs.runtimeResults, line: 17, needle: 'pass 4457' },
  { file: sourceDocs.runtimeResults, line: 18, needle: 'fail 0' },
  { file: 'build.js', line: 84, needle: "execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' });" },
  { file: 'build.js', line: 147, needle: 'const zipPath = await createZip(browser, targetDir, versionForZip);' },
  { file: 'build.js', line: 157, needle: 'const mobileArtifactPaths = await maybeCollectMobileArtifacts(VERSION);' },
  { file: 'scripts/build-extension-ui.mjs', line: 23, needle: 'async function bundleAll()' },
  { file: 'scripts/build-nanah-vendor.mjs', line: 18, needle: 'await esbuild.build({' },
  { file: 'scripts/sync-native-runtime.mjs', line: 21, needle: 'const result = spawnSync(process.execPath, [syncScript], {' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusParityReleaseVerificationBoundary',
  'firstOptimizationSourceLocusParityReleaseVerificationReport',
  'sourceLocusParityReleaseVerificationApproval',
  'sourceLocusReleaseOwnerApproval',
  'jsonFirstSourceLocusParityGate',
  'whitelistSourceLocusParityGate',
  'metricFoundationParityReleaseAuthority',
  'runtimeSourceParityReleaseMap',
  'sourceLocusParityReleaseArtifact',
  'sourceLocusParityReleasePacket',
  'runtimeParityReleaseOptimizationAuthority',
  'sourceLocusPublicClaimBoundaryReport'
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

test('source-locus parity release verification boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus parity,\s+release, and verification ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch/);
  assert.match(doc, /This is parity, release, and verification ownership classification, not\s+approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /native sync patch: NO-GO/);
  assert.match(doc, /release package patch: NO-GO/);
  assert.match(doc, /public claim patch: NO-GO/);
  assert.match(doc, /persist verification output now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus parity release verification rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-PARITY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus parity release verification boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /source-locus fixture provenance rows covered: 12/);
  assert.match(doc, /source-locus diagnostic privacy rows covered: 12/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /rollback\/unclaimed boundary rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /evidence parity rollout rows covered: 2/);
  assert.match(doc, /parity and release boundary source docs covered: 8/);
  assert.match(doc, /release\/native\/public boundary source docs covered: 8/);
  assert.match(doc, /current parity release verification anchors covered: 68/);
  assert.match(doc, /parity release verification risk classes covered: 8/);
  assert.match(doc, /committed parity rollout files: 0/);
  assert.match(doc, /committed verification output files: 0/);
  assert.match(doc, /committed diagnostic privacy files: 0/);
  assert.match(doc, /committed fixture provenance files: 0/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /committed no-work preservation files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /implementation-ready source-locus parity release verification rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  for (const row of parityRolloutRows) assert.ok(doc.includes(row), `missing parity rollout row ${row}`);
  for (const row of verificationRows) assert.ok(doc.includes(row), `missing verification row ${row}`);
  for (const row of rollbackRows) assert.ok(doc.includes(row), `missing rollback row ${row}`);
  for (const riskClass of riskClasses) assert.ok(doc.includes(riskClass), `missing risk class ${riskClass}`);
});

test('source-locus parity release verification anchors resolve to current source and audit text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 68);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus parity release verification boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const sourceLocusDiagnosticPrivacy = read(sourceDocs.sourceLocusDiagnosticPrivacy);
  const parityRolloutContract = read(sourceDocs.parityRolloutContract);
  const verificationOutputContract = read(sourceDocs.verificationOutputContract);
  const rollbackUnclaimed = read(sourceDocs.rollbackUnclaimed);
  const collectorParityRollout = read(sourceDocs.collectorParityRollout);
  const nativeRuntimeSync = read(sourceDocs.nativeRuntimeSync);
  const releasePackageParity = read(sourceDocs.releasePackageParity);
  const publicReleaseClaim = read(sourceDocs.publicReleaseClaim);
  const rawCaptureRelease = read(sourceDocs.rawCaptureRelease);

  for (const artifactPath of artifactPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, artifactPath)), false, `unexpected artifact exists: ${artifactPath}`);
  }

  assert.match(sourceLocusDiagnosticPrivacy, /implementation-ready source-locus diagnostic privacy rows: 0/);
  assert.match(parityRolloutContract, /committed parity rollout files: 0/);
  assert.match(parityRolloutContract, /implementation-ready parity rollout contract rows: 0/);
  assert.match(verificationOutputContract, /committed verification output files: 0/);
  assert.match(verificationOutputContract, /implementation-ready verification output contract rows: 0/);
  assert.match(rollbackUnclaimed, /runtime rollback approvals: 0/);
  assert.match(rollbackUnclaimed, /runtime unclaimed-surface approvals: 0/);
  assert.match(collectorParityRollout, /runtime collector parity rollout proofs approved: 0/);
  assert.match(nativeRuntimeSync, /nativeRuntimeSyncAuthority/);
  assert.match(releasePackageParity, /releasePackageParity/);
  assert.match(publicReleaseClaim, /publicReleaseClaimAuthority/);
  assert.match(rawCaptureRelease, /rawCaptureReleaseBoundary/);
  assert.match(doc, /commit parity-rollout\.json now: NO-GO/);
  assert.match(doc, /commit verification-output\.tap now: NO-GO/);
  assert.match(doc, /runtime rollback approval now: NO-GO/);
  assert.match(doc, /runtime unclaimed-surface approval now: NO-GO/);
});

test('source-locus parity release verification future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus parity release verification boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusDiagnosticPrivacy: sourceDocs.sourceLocusDiagnosticPrivacy,
    parityRolloutContract: sourceDocs.parityRolloutContract,
    verificationOutputContract: sourceDocs.verificationOutputContract,
    rollbackUnclaimed: sourceDocs.rollbackUnclaimed,
    collectorParityRollout: sourceDocs.collectorParityRollout,
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
