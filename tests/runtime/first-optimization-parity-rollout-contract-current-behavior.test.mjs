import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs';
const parityRolloutPath = 'docs/audit/artifacts/first-optimization/metric-foundation/parity-rollout.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  diagnosticPrivacyContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  sideEffectBudgetContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  noWorkPreservationContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenanceContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSampleContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  foundationPacket: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonDomInventory: 'docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md',
  ytmParity: 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYLIST_PANEL_JSON_PARITY_CURRENT_BEHAVIOR_2026-05-23.md',
  commentParity: 'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  nativeSync: 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md',
  releaseParity: 'docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md',
  publicClaim: 'docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  rawRelease: 'docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md'
};

const expectedParityRows = [
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

const expectedParityClosureRows = [
  'FT-PARITY-ROLLOUT-CLOSURE-00-packet-binding',
  'FT-PARITY-ROLLOUT-CLOSURE-01-artifact-binding',
  'FT-PARITY-ROLLOUT-CLOSURE-02-json-dom-parity',
  'FT-PARITY-ROLLOUT-CLOSURE-03-comment-root-parity',
  'FT-PARITY-ROLLOUT-CLOSURE-04-kids-native-webview',
  'FT-PARITY-ROLLOUT-CLOSURE-05-native-sync-freshness',
  'FT-PARITY-ROLLOUT-CLOSURE-06-release-package',
  'FT-PARITY-ROLLOUT-CLOSURE-07-public-claim',
  'FT-PARITY-ROLLOUT-CLOSURE-08-raw-capture-exclusion',
  'FT-PARITY-ROLLOUT-CLOSURE-09-mobile-artifact',
  'FT-PARITY-ROLLOUT-CLOSURE-10-diagnostic-claim-scope',
  'FT-PARITY-ROLLOUT-CLOSURE-11-verification'
];

const requiredParityFields = [
  'rolloutVersion',
  'rolloutId',
  'packetId',
  'sampleId',
  'diagnosticPrivacyId',
  'candidateId',
  'bindingId',
  'obligationId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'parityRolloutPath',
  'jsonFixturePath',
  'domFixturePath',
  'jsonDomParityStatus',
  'jsonSupportedClass',
  'nestedSupportedClass',
  'domSelectedRowPolicy',
  'restoreProof',
  'noPlaybackProof',
  'endpointRootPolicy',
  'actionRootPolicy',
  'commandRootPolicy',
  'appendCommandPolicy',
  'engineBypassPolicy',
  'mixedRootLeakBudget',
  'kidsExtensionFixture',
  'nativeWebViewFixture',
  'platformScope',
  'generatedRuntimeHash',
  'intentionalDivergence',
  'sourceRevision',
  'appRevision',
  'syncCommand',
  'sourceHash',
  'destinationHash',
  'iosFreshnessGate',
  'androidFreshnessGate',
  'releasePackageManifest',
  'browser',
  'packagePath',
  'sourcePath',
  'sourceFamily',
  'manifestReferenced',
  'webAccessible',
  'quarantineStatus',
  'packageHash',
  'publicClaimId',
  'surface',
  'requiredArtifact',
  'requiredChecksum',
  'requiredSigningFingerprint',
  'requiredStoreUrl',
  'requiredVersion',
  'rawCaptureExclusionManifest',
  'captureName',
  'ignored',
  'tracked',
  'extractedFixturePaths',
  'packageIncluded',
  'websiteReferenced',
  'nativeSyncSource',
  'generatedRuntimeInput',
  'releaseClaimId',
  'signedReleaseApkProof',
  'packageName',
  'githubAsset',
  'sha256Path',
  'signingFingerprint',
  'cleanInstallProof',
  'tvExclusionProof',
  'metricArtifact',
  'browserDeviceScope',
  'sampleEnvelope',
  'elapsedWorkCounters',
  'publicClaimScope',
  'logOnlyClaimForbidden',
  'verificationCommand',
  'verificationOutputPath',
  'expectedTests',
  'expectedPass',
  'expectedFail',
  'rollbackBoundary',
  'unclaimedSurfaces',
  'authorityTokenAbsenceCheck',
  'callableOwnerProofStatus'
];

const futureAuthorityTokens = [
  'firstOptimizationParityRolloutContract',
  'firstOptimizationParityRolloutReport',
  'firstOptimizationParityRolloutApproval',
  'firstOptimizationParityRolloutNoGoBoundary',
  'jsonFirstOptimizationParityRollout',
  'jsonFirstParityRolloutAuthority',
  'metricArtifactParityRolloutCollector',
  'metricArtifactParityRolloutVerification',
  'metricArtifactParityRolloutRuntimeApproval',
  'whitelistOptimizationParityRolloutBudget',
  'releasePackageParityRolloutApproval',
  'publicClaimParityRolloutApproval',
  'nativeSyncParityRolloutApproval',
  'rawCaptureParityRolloutExclusionProof',
  'parityRolloutDraftClosure',
  'parityRolloutDraftClosureRuntimeApproval',
  'parityRolloutDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineParityRolloutShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline parity rollout JSON block');
  return JSON.parse(match[1]);
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
  return ['js', 'build.js', 'scripts']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization parity rollout contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization parity rollout contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved parity rollout path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/parity-rollout\.json/);
  assert.match(doc, /Committed parity rollout files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready parity rollout contract rows: 0/);
  assert.match(doc, /not completion proof for parity rollout authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('parity rollout contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-PARITY-ROLLOUT-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-PARITY-ROLLOUT-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedParityRows);
  assert.deepEqual(closureRows, expectedParityClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization parity rollout contract rows: 12/);
  assert.match(doc, /reserved parity rollout paths covered: 1/);
  assert.match(doc, /committed parity rollout files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready parity rollout contract rows: 0/);
  assert.match(doc, /diagnostic privacy contract rows covered: 12/);
  assert.match(doc, /side-effect budget contract rows covered: 12/);
  assert.match(doc, /no-work preservation contract rows covered: 12/);
  assert.match(doc, /fixture provenance contract rows covered: 12/);
  assert.match(doc, /source owner map contract rows covered: 12/);
  assert.match(doc, /metric sample contract rows covered: 12/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /artifact path boundary rows covered: 10/);
  assert.match(doc, /foundation packet rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /evidence parity rollout rows covered: 2/);
  assert.match(doc, /parity and release boundary source docs covered: 8/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5720/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5720/);
  assert.match(doc, /inline parity rollout JSON sections covered: 12/);
  assert.match(doc, /inline parity rollout artifact promotion decision: NO-GO/);
  assert.match(doc, /parity rollout draft closure rows: 12/);
  assert.match(doc, /parity rollout rows linked by closure: 12/);
  assert.match(doc, /inline parity rollout JSON sections linked by closure: 12/);
  assert.match(doc, /diagnostic privacy contract rows linked by parity closure: 12/);
  assert.match(doc, /side-effect budget contract rows linked by parity closure: 12/);
  assert.match(doc, /no-work preservation contract rows linked by parity closure: 12/);
  assert.match(doc, /fixture provenance contract rows linked by parity closure: 12/);
  assert.match(doc, /source owner map contract rows linked by parity closure: 12/);
  assert.match(doc, /metric sample contract rows linked by parity closure: 12/);
  assert.match(doc, /manifest contract rows linked by parity closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by parity closure: 10/);
  assert.match(doc, /foundation packet rows linked by parity closure: 12/);
  assert.match(doc, /metric schema rows linked by parity closure: 12/);
  assert.match(doc, /metric source-owner rows linked by parity closure: 12/);
  assert.match(doc, /collector readiness families linked by parity closure: 5/);
  assert.match(doc, /evidence parity rollout rows linked by parity closure: 2/);
  assert.match(doc, /parity and release boundary source docs linked by parity closure: 8/);
  assert.match(doc, /method semantic proof gap files linked by parity closure: 69/);
  assert.match(doc, /lexical callables linked by parity closure: 5720/);
  assert.match(doc, /runtime parity rollout closure approvals: 0/);
  assert.match(doc, /implementation-ready parity rollout closure rows: 0/);
  assert.match(doc, /parity rollout draft closure: PARITY-ROLLOUT-CHAIN-CLOSED/);
  assert.match(doc, /parity rollout implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredParityFields) {
    assert.ok(doc.includes(field), `missing parity rollout field ${field}`);
  }

  const parityShape = inlineParityRolloutShape();
  const parityRows = parityShape.sections.map((section) => section.id);
  const paritySections = parityShape.sections.map((section) => section.section);
  const inlineFields = new Set(parityShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(parityShape.rolloutVersion, 'parity-rollout-draft-2026-05-29');
  assert.equal(parityShape.rolloutId, 'FT-PARITY-ROLLOUT-DRAFT-00');
  assert.equal(parityShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(parityShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(parityShape.diagnosticPrivacyId, 'FT-DIAGNOSTIC-PRIVACY-DRAFT-00');
  assert.equal(parityShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(parityShape.parityRolloutPath, parityRolloutPath);
  assert.equal(parityShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(parityShape.runtimeBehaviorChanged, false);
  assert.deepEqual(parityRows, expectedParityRows);
  assert.equal(new Set(paritySections).size, 12);

  for (const field of requiredParityFields) {
    assert.ok(inlineFields.has(field), `inline parity rollout missing field ${field}`);
  }

  for (const section of parityShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('parity rollout path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const parityShape = inlineParityRolloutShape();

  assert.ok(doc.includes(parityRolloutPath));
  assert.equal(parityShape.parityRolloutPath, parityRolloutPath);
  assert.equal(parityShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, parityRolloutPath)), false, `${parityRolloutPath} should not exist yet`);
});

test('parity rollout contract is backed by current artifact collector parity release and public-claim gates', () => {
  const diagnosticPrivacyContract = read(sourceDocs.diagnosticPrivacyContract);
  const methodGap = read(sourceDocs.methodGap);
  const sideEffectBudgetContract = read(sourceDocs.sideEffectBudgetContract);
  const noWorkPreservationContract = read(sourceDocs.noWorkPreservationContract);
  const fixtureProvenanceContract = read(sourceDocs.fixtureProvenanceContract);
  const manifestContract = read(sourceDocs.manifestContract);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const foundationPacket = read(sourceDocs.foundationPacket);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);
  const evidence = read(sourceDocs.evidence);
  const jsonDomInventory = read(sourceDocs.jsonDomInventory);
  const ytmParity = read(sourceDocs.ytmParity);
  const commentParity = read(sourceDocs.commentParity);
  const nativeSync = read(sourceDocs.nativeSync);
  const releaseParity = read(sourceDocs.releaseParity);
  const publicClaim = read(sourceDocs.publicClaim);
  const rawRelease = read(sourceDocs.rawRelease);

  assert.match(diagnosticPrivacyContract, /Committed diagnostic privacy files: 0/);
  assert.match(diagnosticPrivacyContract, /Implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(diagnosticPrivacyContract, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5720/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5720/);
  assert.match(sideEffectBudgetContract, /Committed side-effect budget files: 0/);
  assert.match(sideEffectBudgetContract, /Implementation-ready side-effect budget contract rows: 0/);
  assert.match(noWorkPreservationContract, /Committed no-work preservation files: 0/);
  assert.match(noWorkPreservationContract, /Implementation-ready no-work preservation contract rows: 0/);
  assert.match(fixtureProvenanceContract, /Committed fixture provenance files: 0/);
  assert.match(fixtureProvenanceContract, /Implementation-ready fixture provenance contract rows: 0/);
  assert.match(manifestContract, /Committed packet manifest files: 0/);
  assert.match(manifestContract, /Implementation-ready manifest contract rows: 0/);
  assert.match(pathBoundary, /Committed foundation metric artifact files: 0/);
  assert.match(pathBoundary, /Implementation-ready artifact path rows: 0/);
  assert.match(foundationPacket, /required foundation metric artifact packet exists: no/);
  assert.match(foundationPacket, /runtime metric collectors approved: 0/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
  assert.match(evidence, /FT-EVIDENCE-05-json-dom-native-parity/);
  assert.match(evidence, /FT-EVIDENCE-09-rollout-claim-boundary/);
  assert.match(jsonDomInventory, /discovery indexes and fixture backlog/);
  assert.match(ytmParity, /JSON playlist-panel filtering cannot yet replace the DOM selected-row\s+policy/);
  assert.match(commentParity, /runtime JSON comment continuation collection-root parity fixtures: 8/);
  assert.match(nativeSync, /entries: 28/);
  assert.match(releaseParity, /no committed `releasePackageParity` manifest/);
  assert.match(publicClaim, /publicReleaseClaimAuthority/);
  assert.match(rawRelease, /must not enter browser ZIPs, website source, native sync manifests/);
});

test('parity rollout authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('parity rollout contract is linked from audit ledgers and upstream gates', () => {
  const doc = read(docPath);
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
    assert.match(artifact, /First optimization parity rollout contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization parity rollout contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization parity rollout contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization parity rollout contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization parity rollout contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(doc, /close parity rollout documentation chain now: GO/);
  assert.match(doc, /accept parity rollout closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as native sync approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as release package approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as public claim approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept parity rollout closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
