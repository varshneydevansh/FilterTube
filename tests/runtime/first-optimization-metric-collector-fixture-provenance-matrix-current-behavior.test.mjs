import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-collector-fixture-provenance-matrix-current-behavior.test.mjs';

const sourceDocs = {
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  traceability: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
  rawIndex: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md'
};

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

const expectedObligationRows = [
  'FT-METRIC-00-disabled-all-intercepts',
  'FT-METRIC-01-empty-blocklist-desktop-home',
  'FT-METRIC-02-empty-blocklist-mobile-home',
  'FT-METRIC-03-empty-blocklist-watch-player',
  'FT-METRIC-04-empty-blocklist-watch-next',
  'FT-METRIC-05-empty-blocklist-guide',
  'FT-METRIC-06-empty-whitelist-main-json',
  'FT-METRIC-07-nonempty-blocklist-core-routes',
  'FT-METRIC-08-nonempty-whitelist-unresolved-identity',
  'FT-METRIC-09-content-category-empty-values',
  'FT-METRIC-10-lifecycle-affordance-off',
  'FT-METRIC-11-diagnostic-measurement-budget'
];

const expectedEvidenceRows = [
  'FT-EVIDENCE-01-route-surface-mode-scope',
  'FT-EVIDENCE-02-metric-artifact',
  'FT-EVIDENCE-03-positive-negative-fixtures',
  'FT-EVIDENCE-04-false-hide-leak-restore',
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const expectedFixtureFields = [
  'positiveFixture',
  'negativeSiblingFixture',
  'noRuleFixture',
  'disabledFixture',
  'emptyListFixture',
  'unrelatedSurfaceFixture',
  'domParityFixture',
  'nativeParityFixture'
];

const expectedFixturePaths = [
  'tests/runtime/fixtures/captures/main-home-rich-video-renderer.json',
  'tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json',
  'tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json',
  'tests/runtime/fixtures/captures/main-guide-entry-renderer.json',
  'tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json',
  'tests/runtime/fixtures/captures/ytm-watch-player-dom.html',
  'tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html',
  'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricCollectorFixtureProvenanceMatrix',
  'optimizationMetricCollectorFixtureProvenanceReport',
  'optimizationMetricCollectorFixturePacket',
  'optimizationMetricCollectorRawCaptureProvenance',
  'optimizationMetricCollectorPositiveFixtureProof',
  'optimizationMetricCollectorNegativeSiblingFixtureProof',
  'optimizationMetricCollectorNoRuleFixtureProof',
  'optimizationMetricCollectorDisabledFixtureProof',
  'optimizationMetricCollectorEmptyListFixtureProof',
  'optimizationMetricCollectorDomParityFixtureProof',
  'optimizationMetricCollectorNativeParityFixtureProof',
  'optimizationMetricCollectorReleaseInputGate',
  'optimizationMetricCollectorFixtureArtifactGate'
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

test('first optimization collector fixture provenance matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric collector fixture provenance matrix/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Metric collector fixture provenance proof is required/);
  assert.match(doc, /Runtime collector fixture provenance proof exists: no/);
  assert.match(doc, /Implementation-ready collector fixture provenance rows: 0/);
  assert.match(doc, /not completion proof for metric collector fixture provenance authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization collector fixture provenance rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-FIXTURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedFixtureRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector fixture provenance rows: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /candidate binding rows covered: 10/);
  assert.match(doc, /evidence fixture\/parity rows covered: 6/);
  assert.match(doc, /required fixture\/parity fields covered: 8/);
  assert.match(doc, /P0 capture traceability rows covered: 11/);
  assert.match(doc, /unique raw capture obligation paths covered: 46/);
  assert.match(doc, /runtime collector fixture packets approved: 0/);
  assert.match(doc, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const obligation of expectedObligationRows) {
    assert.ok(doc.includes(obligation), `missing obligation ${obligation}`);
  }

  for (const evidenceRow of expectedEvidenceRows) {
    assert.ok(doc.includes(evidenceRow), `missing evidence row ${evidenceRow}`);
  }

  for (const field of expectedFixtureFields) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing fixture field ${field}`);
  }
});

test('first optimization collector fixture provenance matrix is backed by current fixture gates', () => {
  const sideEffect = read(sourceDocs.sideEffect);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const binding = read(sourceDocs.binding);
  const metricSchema = read(sourceDocs.metricSchema);
  const traceability = read(sourceDocs.traceability);
  const rawIndex = read(sourceDocs.rawIndex);

  assert.match(sideEffect, /collector side-effect budget rows: 12/);
  assert.match(sideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);

  assert.match(evidence, /required fixture-parity fields: 8/);
  assert.match(evidence, /FT-EVIDENCE-03-positive-negative-fixtures/);
  assert.match(evidence, /FT-EVIDENCE-05-json-dom-native-parity/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /fixtureSource/);
  assert.match(routeSurfaceMetric, /positiveOrNegative/);
  assert.match(routeSurfaceMetric, /siblingVisibleResult/);

  assert.match(binding, /candidate-obligation binding rows: 10/);
  assert.match(binding, /No binding has a committed metric artifact or complete fixture packet/);
  assert.match(binding, /bindings with committed metric artifact: 0/);

  assert.match(metricSchema, /metric artifact schema rows: 12/);
  assert.match(metricSchema, /committed first-optimization metric artifacts: 0/);
  assert.match(metricSchema, /runtime metric collectors implemented: 0/);

  assert.match(traceability, /capture-to-fixture chain is explicit, but incomplete/);
  assert.match(traceability, /44 committed reduced fixture fragments/);
  assert.match(traceability, /Most high-risk watch, search, guide, comments, Shorts, Kids, YTM,/);

  assert.match(rawIndex, /47 ignored capture entries/);
  assert.match(rawIndex, /46 unique ignored capture paths/);
  assert.match(rawIndex, /45 present in this local workspace/);
  assert.match(rawIndex, /releaseInputAllowed: false/);
});

test('current fixture anchors still show provenance gaps before collector implementation', () => {
  const traceability = read(sourceDocs.traceability);
  const rawIndex = read(sourceDocs.rawIndex);
  const ytmWatchDom = read('tests/runtime/fixtures/captures/ytm-watch-player-dom.html');
  const homeVideo = read('tests/runtime/fixtures/captures/main-home-rich-video-renderer.json');
  const showSheet = read('tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json');

  for (const fixturePath of expectedFixturePaths) {
    assert.ok(fs.existsSync(path.join(repoRoot, fixturePath)), `missing expected fixture ${fixturePath}`);
  }

  assert.match(traceability, /no committed clean Main watch end-screen DOM wall fixture exists/);
  assert.match(traceability, /No literal `compactAutoplayRenderer` fragment has a committed fixture/);
  assert.match(traceability, /P0 capture fixture traceability is not implementation-ready/);
  assert.match(traceability, /not first-class JSON filter authority/);

  assert.match(rawIndex, /Raw captures are evidence, not product source/);
  assert.match(rawIndex, /Loose substring matches are forbidden/);
  assert.match(rawIndex, /post_opt1_logs\.txt` \| `posts-dom` \| no/);

  assert.match(ytmWatchDom, /Raw shape: rendered mobile watch\/player DOM after FilterTube mutation/);
  assert.match(ytmWatchDom, /data-filtertube-hidden="true"/);

  assert.match(homeVideo, /"source": "logs\.json"/);
  assert.match(homeVideo, /"route": "home"/);

  assert.match(showSheet, /"source": "YTM-XHR\.json"/);
  assert.match(showSheet, /"reason": "minimal showSheetCommand collaborator roster with multiple UC browse IDs"/);
});

test('first optimization collector fixture provenance authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization collector fixture provenance matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const sideEffect = read(sourceDocs.sideEffect);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const binding = read(sourceDocs.binding);
  const metricSchema = read(sourceDocs.metricSchema);
  const traceability = read(sourceDocs.traceability);
  const rawIndex = read(sourceDocs.rawIndex);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    sideEffect,
    evidence,
    routeSurfaceMetric,
    binding,
    metricSchema,
    traceability,
    rawIndex
  ]) {
    assert.match(artifact, /First optimization metric collector fixture provenance matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
