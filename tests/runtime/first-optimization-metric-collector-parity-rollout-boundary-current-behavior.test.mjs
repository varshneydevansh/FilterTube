import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs';

const sourceDocs = {
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-COLLECTOR-PARITY-00-json-inventory-discovery-boundary',
  'FT-COLLECTOR-PARITY-01-json-supported-nested-dom-classification',
  'FT-COLLECTOR-PARITY-02-ytm-watch-selected-row-boundary',
  'FT-COLLECTOR-PARITY-03-comment-root-parity-boundary',
  'FT-COLLECTOR-PARITY-04-kids-extension-native-webview-boundary',
  'FT-COLLECTOR-PARITY-05-native-runtime-sync-freshness-boundary',
  'FT-COLLECTOR-PARITY-06-release-package-manifest-boundary',
  'FT-COLLECTOR-PARITY-07-public-release-claim-boundary',
  'FT-COLLECTOR-PARITY-08-raw-capture-release-exclusion-boundary',
  'FT-COLLECTOR-PARITY-09-mobile-artifact-direct-apk-boundary',
  'FT-COLLECTOR-PARITY-10-diagnostic-performance-claim-scope-boundary',
  'FT-COLLECTOR-PARITY-11-rollout-unification-boundary'
];

const expectedFixtureRows = [
  'FT-COLLECTOR-FIXTURE-00-disabled-all-intercepts-provenance',
  'FT-COLLECTOR-FIXTURE-01-empty-blocklist-desktop-home-provenance',
  'FT-COLLECTOR-FIXTURE-02-empty-blocklist-mobile-home-provenance',
  'FT-COLLECTOR-FIXTURE-03-empty-blocklist-watch-player-provenance',
  'FT-COLLECTOR-FIXTURE-04-empty-blocklist-watch-next-provenance',
  'FT-COLLECTOR-FIXTURE-05-empty-blocklist-guide-provenance',
  'FT-COLLECTOR-FIXTURE-06-empty-whitelist-main-json-provenance',
  'FT-COLLECTOR-FIXTURE-07-nonempty-blocklist-core-routes-provenance',
  'FT-COLLECTOR-FIXTURE-08-nonempty-whitelist-unresolved-identity-provenance',
  'FT-COLLECTOR-FIXTURE-09-content-category-empty-values-provenance',
  'FT-COLLECTOR-FIXTURE-10-lifecycle-affordance-off-provenance',
  'FT-COLLECTOR-FIXTURE-11-diagnostic-measurement-budget-provenance'
];

const expectedEvidenceRows = [
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricCollectorParityRolloutBoundary',
  'optimizationMetricCollectorParityRolloutReport',
  'optimizationMetricCollectorJsonDomNativeParityPacket',
  'optimizationMetricCollectorJsonInventoryCoverageGate',
  'optimizationMetricCollectorDomSelectedRowParityGate',
  'optimizationMetricCollectorNativeRuntimeParityGate',
  'optimizationMetricCollectorReleasePackageParityGate',
  'optimizationMetricCollectorPublicClaimGate',
  'optimizationMetricCollectorRawCaptureReleaseGate',
  'optimizationMetricCollectorPerformanceClaimScope',
  'optimizationMetricCollectorRolloutScopeBoundary'
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
  return ['js', 'build.js', 'scripts']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization collector parity rollout boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric collector parity rollout boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Metric collector parity and rollout proof is required/);
  assert.match(doc, /Runtime collector parity rollout proof exists: no/);
  assert.match(doc, /Implementation-ready collector parity rollout rows: 0/);
  assert.match(doc, /not completion proof for metric collector parity rollout authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization collector parity rollout rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-PARITY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedParityRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector parity rollout rows: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /evidence parity rollout rows covered: 2/);
  assert.match(doc, /parity and release boundary source docs covered: 8/);
  assert.match(doc, /runtime collector parity rollout proofs approved: 0/);
  assert.match(doc, /collector parity rollout rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const fixtureRow of expectedFixtureRows) {
    assert.ok(doc.includes(fixtureRow), `missing fixture row ${fixtureRow}`);
  }

  for (const evidenceRow of expectedEvidenceRows) {
    assert.ok(doc.includes(evidenceRow), `missing evidence row ${evidenceRow}`);
  }
});

test('first optimization collector parity rollout boundary is backed by current parity and release gates', () => {
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const evidence = read(sourceDocs.evidence);
  const jsonDomInventory = read(sourceDocs.jsonDomInventory);
  const ytmParity = read(sourceDocs.ytmParity);
  const commentParity = read(sourceDocs.commentParity);
  const nativeSync = read(sourceDocs.nativeSync);
  const releaseParity = read(sourceDocs.releaseParity);
  const publicClaim = read(sourceDocs.publicClaim);
  const rawRelease = read(sourceDocs.rawRelease);

  assert.match(fixtureProvenance, /collector fixture provenance rows: 12/);
  assert.match(fixtureProvenance, /runtime collector fixture packets approved: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);

  assert.match(evidence, /FT-EVIDENCE-05-json-dom-native-parity/);
  assert.match(evidence, /FT-EVIDENCE-09-rollout-claim-boundary/);

  assert.match(jsonDomInventory, /discovery indexes and fixture backlog/);
  assert.match(jsonDomInventory, /No renderer should be called "covered" in release-facing claims/);

  assert.match(ytmParity, /JSON playlist-panel filtering cannot yet replace the DOM selected-row\s+policy/);
  assert.match(ytmParity, /no-playback side effects/);

  assert.match(commentParity, /runtime JSON comment continuation collection-root parity fixtures: 8/);
  assert.match(commentParity, /mixed-root leak behavior/);

  assert.match(nativeSync, /entries: 32/);
  assert.match(nativeSync, /direct manifest copy hash diffs: 0/);
  assert.match(nativeSync, /Raw Capture Evidence Boundary/);

  assert.match(releaseParity, /COMMON_DIRS = js, css, html, icons, data, assets/);
  assert.match(releaseParity, /no committed `releasePackageParity` manifest/);
  assert.match(releaseParity, /GitHub release publishing is public before upload proof/);

  assert.match(publicClaim, /publicReleaseClaimAuthority/);
  assert.match(publicClaim, /Direct APK Gate/);
  assert.match(publicClaim, /Final release testing/);

  assert.match(rawRelease, /must not enter browser ZIPs, website source, native sync manifests/);
  assert.match(rawRelease, /rawCaptureReleaseBoundary/);
});

test('current source anchors still show parity rollout risks before collector implementation', () => {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const build = read('build.js');
  const syncNative = read('scripts/sync-native-runtime.mjs');
  const ytmDom = read('tests/runtime/fixtures/captures/ytm-watch-player-dom.html');
  const ytmJson = read('tests/runtime/fixtures/captures/ytm-watch-playlist-panel-json.json');

  assert.ok(filterLogic.includes('playlistPanelVideoRenderer'));
  assert.ok(filterLogic.includes('universalWatchCardRenderer'));
  assert.ok(filterLogic.includes('showDialogCommand'));

  assert.ok(seed.includes('onResponseReceivedEndpoints'));
  assert.ok(seed.includes('appendContinuationItemsAction'));
  assert.ok(seed.includes('return new Response(JSON.stringify(processed)'));

  assert.ok(build.includes("const COMMON_DIRS = ['js', 'css', 'html', 'icons', 'data', 'assets'];"));
  assert.ok(build.includes('draft: false'));
  assert.ok(build.includes('await updateReadmeBadges(VERSION)'));

  assert.ok(syncNative.includes('FILTERTUBE_APP_REPO'));
  assert.ok(syncNative.includes('sync-runtime-from-extension.mjs'));

  assert.match(ytmDom, /data-filtertube-hidden="true"/);
  assert.match(ytmDom, /aria-selected="true"/);
  assert.match(ytmJson, /"playlistPanelVideoRenderer"/);
  assert.match(ytmJson, /"selected": false/);
});

test('first optimization collector parity rollout authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization collector parity rollout boundary is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const evidence = read(sourceDocs.evidence);
  const jsonDomInventory = read(sourceDocs.jsonDomInventory);
  const ytmParity = read(sourceDocs.ytmParity);
  const commentParity = read(sourceDocs.commentParity);
  const nativeSync = read(sourceDocs.nativeSync);
  const releaseParity = read(sourceDocs.releaseParity);
  const publicClaim = read(sourceDocs.publicClaim);
  const rawRelease = read(sourceDocs.rawRelease);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    fixtureProvenance,
    evidence,
    jsonDomInventory,
    ytmParity,
    commentParity,
    nativeSync,
    releaseParity,
    publicClaim,
    rawRelease
  ]) {
    assert.match(artifact, /First optimization metric collector parity rollout boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
