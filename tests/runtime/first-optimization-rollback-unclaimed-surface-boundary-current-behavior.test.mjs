import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricCoverage: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationOutput: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRolloutContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnosticPrivacyContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  collectorParityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonDomInventory: 'docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md',
  nativeRuntimeSync: 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md',
  nativeRuntimeSyncFreshness: 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  releasePackageParity: 'docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md',
  releaseBuildArtifact: 'docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  publicReleaseClaim: 'docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  rawCaptureRelease: 'docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  trackedPublicDocClaims: 'docs/audit/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedRows = [
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

const requiredFields = [
  'packetId',
  'candidateId',
  'bindingId',
  'obligationId',
  'metricFoundationContractId',
  'verificationOutputId',
  'parityRolloutId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'jsonFixturePaths',
  'domFixturePaths',
  'measuredJsonSurfaces',
  'measuredDomSurfaces',
  'unclaimedJsonSurfaces',
  'unclaimedDomSurfaces',
  'siblingPreservationProof',
  'endpointContinuationSurfaces',
  'actionContinuationSurfaces',
  'commandContinuationSurfaces',
  'appendCommandSurfaces',
  'unclaimedContinuationRoots',
  'continuationRollbackBoundary',
  'ytmJsonSurfaces',
  'ytmDomSurfaces',
  'selectedRowProof',
  'currentRowProof',
  'unclaimedYtmSurfaces',
  'ytmRollbackBoundary',
  'kidsExtensionSurfaces',
  'nativeWebViewSurfaces',
  'unclaimedNativeWebViewSurfaces',
  'intentionalDivergence',
  'platformRollbackBoundary',
  'sourceRevision',
  'appRevision',
  'generatedRuntimeHashes',
  'nativeSyncCommand',
  'nativeRollbackCommand',
  'unclaimedNativeSyncClaims',
  'releasePackageManifest',
  'packagePath',
  'packageHash',
  'includedSourceFamilies',
  'excludedSourceFamilies',
  'releaseRollbackCommand',
  'unclaimedReleaseArtifacts',
  'publicClaimIds',
  'claimSurface',
  'platform',
  'claimStatus',
  'requiredArtifact',
  'requiredChecksum',
  'requiredSigningFingerprint',
  'unclaimedPublicClaims',
  'rawCaptureExclusionManifest',
  'ignoredCapturePaths',
  'trackedFixturePaths',
  'packageIncluded',
  'websiteReferenced',
  'nativeSyncInput',
  'publicClaimInput',
  'diagnosticPrivacyId',
  'metricArtifactPath',
  'browserDeviceScope',
  'elapsedWorkCounters',
  'consolePrivacyClass',
  'publicPerformanceClaimScope',
  'logOnlyClaimForbidden',
  'rollbackBoundary',
  'rollbackCommand',
  'manualRollbackOwner',
  'artifactRemovalCommand',
  'collectorDisableCommand',
  'publicClaimRetractionCommand',
  'unclaimedSurfaces',
  'unclaimedNativeSurfaces',
  'unclaimedReleaseSurfaces',
  'authorityTokenAbsenceCheck',
  'claimExpansionGate',
  'approvalStatus',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationRollbackUnclaimedSurfaceBoundary',
  'firstOptimizationRollbackUnclaimedSurfaceReport',
  'firstOptimizationRollbackApproval',
  'firstOptimizationRollbackNoGoBoundary',
  'jsonFirstRollbackUnclaimedSurfaceAuthority',
  'metricArtifactRollbackUnclaimedCollector',
  'metricArtifactRollbackRuntimeApproval',
  'whitelistOptimizationRollbackBudget',
  'nativeSyncRollbackApproval',
  'releasePackageRollbackApproval',
  'publicClaimRollbackApproval',
  'rawCaptureRollbackExclusionProof',
  'unclaimedSurfaceClaimBlock',
  'unclaimedSurfacePublicScopeReport'
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
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  return ['js', 'build.js', 'scripts', 'website']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs|jsx|ts|tsx)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization rollback unclaimed surface boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization rollback/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /Rollback\/unclaimed boundary artifact files: 0/);
  assert.match(doc, /Runtime rollback approvals: 0/);
  assert.match(doc, /Runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready rollback\/unclaimed rows: 0/);
  assert.match(doc, /not completion proof for rollback or unclaimed-surface authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('rollback unclaimed surface rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-ROLLBACK-UNCLAIMED-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /first optimization rollback unclaimed surface boundary rows: 12/);
  assert.match(doc, /upstream metric foundation contract coverage rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /parity rollout contract rows covered: 12/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /release\/native\/public boundary source docs covered: 8/);
  assert.match(doc, /committed rollback\/unclaimed artifacts: 0/);
  assert.match(doc, /runtime rollback approvals: 0/);
  assert.match(doc, /runtime unclaimed-surface approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready rollback\/unclaimed rows: 0/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5827/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5827/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.ok(doc.includes(field), `missing rollback/unclaimed field ${field}`);
  }
});

test('rollback unclaimed surface boundary is backed by current parity release and public-claim gates', () => {
  const metricCoverage = read(sourceDocs.metricCoverage);
  const verificationOutput = read(sourceDocs.verificationOutput);
  const parityRolloutContract = read(sourceDocs.parityRolloutContract);
  const diagnosticPrivacyContract = read(sourceDocs.diagnosticPrivacyContract);
  const methodGap = read(sourceDocs.methodGap);
  const collectorParityRollout = read(sourceDocs.collectorParityRollout);
  const jsonDomInventory = read(sourceDocs.jsonDomInventory);
  const nativeRuntimeSync = read(sourceDocs.nativeRuntimeSync);
  const nativeRuntimeSyncFreshness = read(sourceDocs.nativeRuntimeSyncFreshness);
  const releasePackageParity = read(sourceDocs.releasePackageParity);
  const releaseBuildArtifact = read(sourceDocs.releaseBuildArtifact);
  const publicReleaseClaim = read(sourceDocs.publicReleaseClaim);
  const rawCaptureRelease = read(sourceDocs.rawCaptureRelease);
  const trackedPublicDocClaims = read(sourceDocs.trackedPublicDocClaims);
  const runtimeResults = read(sourceDocs.runtimeResults);

  assert.match(metricCoverage, /rollback boundaries,\s+explicit release\/public-claim limits, and affected callable semantic proof/);
  assert.match(verificationOutput, /FT-VERIFY-OUTPUT-09-rollback-unclaimed-surfaces/);
  assert.match(verificationOutput, /unclaimedPublicClaims/);
  assert.match(parityRolloutContract, /FT-PARITY-ROLLOUT-11-verification/);
  assert.match(parityRolloutContract, /unclaimedSurfaces/);
  assert.match(diagnosticPrivacyContract, /release package changes, or public\s+claims/);
  assert.match(metricCoverage, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5827/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5827/);
  assert.match(collectorParityRollout, /runtime collector parity rollout proofs approved: 0/);
  assert.match(jsonDomInventory, /native sync proof, release proof, and public claim proof exist/);
  assert.match(nativeRuntimeSync, /generated assets, native parity, release packages, and public claims/);
  assert.match(nativeRuntimeSyncFreshness, /app release\s+public claims/);
  assert.match(releasePackageParity, /public claims, and uploaded assets auditable before a release is created/);
  assert.match(releaseBuildArtifact, /public claim manifest: absent/);
  assert.match(releaseBuildArtifact, /public release rollback\/delete path: absent/);
  assert.match(publicReleaseClaim, /no public claim manifest, claim IDs, signing fingerprint gate, or APK\/AAB pair gate/);
  assert.match(rawCaptureRelease, /must not become JSON\/DOM\/native parity proof, package input, generated runtime\s+input, website content, release artifact, or public claim source/);
  assert.match(trackedPublicDocClaims, /claim-to-runtime traceability per claim family/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /fail 0/);
});

test('rollback unclaimed surface future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }
});

test('rollback unclaimed surface boundary is linked from audit ledgers and source gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    ...Object.entries(sourceDocs)
      .filter(([key]) => key !== 'methodGap')
      .map(([, sourceDoc]) => read(sourceDoc))
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization rollback unclaimed surface boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /First optimization rollback unclaimed surface boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization rollback unclaimed surface boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization rollback unclaimed surface boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization rollback unclaimed surface boundary addendum:[\s\S]*69 method semantic proof gap files covered/);
});

test('rollback unclaimed surface boundary keeps optimization and release behavior blocked', () => {
  const doc = read(docPath);

  assert.match(doc, /commit rollback\/unclaimed artifact now: NO-GO/);
  assert.match(doc, /runtime rollback implementation: NO-GO/);
  assert.match(doc, /runtime metric collector insertion: NO-GO/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /native sync patch: NO-GO/);
  assert.match(doc, /release package patch: NO-GO/);
  assert.match(doc, /public claim patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
