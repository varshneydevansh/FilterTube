import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-artifact-path-boundary-current-behavior.test.mjs';
const artifactRoot = 'docs/audit/artifacts/first-optimization/metric-foundation/';

const sourceDocs = {
  foundationPacket: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md',
  selection: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  insertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedPathRows = [
  'FT-ARTIFACTPATH-00-root',
  'FT-ARTIFACTPATH-01-packet-manifest',
  'FT-ARTIFACTPATH-02-metric-sample',
  'FT-ARTIFACTPATH-03-source-owner-map',
  'FT-ARTIFACTPATH-04-fixture-provenance',
  'FT-ARTIFACTPATH-05-no-work-preservation',
  'FT-ARTIFACTPATH-06-side-effect-budget',
  'FT-ARTIFACTPATH-07-diagnostic-privacy',
  'FT-ARTIFACTPATH-08-parity-rollout',
  'FT-ARTIFACTPATH-09-verification-output'
];

const reservedArtifactPaths = [
  artifactRoot,
  `${artifactRoot}packet-manifest.json`,
  `${artifactRoot}metric-sample.json`,
  `${artifactRoot}source-owner-map.json`,
  `${artifactRoot}fixture-provenance.json`,
  `${artifactRoot}no-work-preservation.json`,
  `${artifactRoot}side-effect-budget.json`,
  `${artifactRoot}diagnostic-privacy.json`,
  `${artifactRoot}parity-rollout.json`,
  `${artifactRoot}verification-output.tap`
];

const futureAuthorityTokens = [
  'firstOptimizationMetricArtifactPathBoundary',
  'firstOptimizationMetricArtifactReservedRoot',
  'firstOptimizationMetricArtifactManifestPath',
  'firstOptimizationMetricArtifactSamplePath',
  'firstOptimizationMetricArtifactPathApproval',
  'firstOptimizationMetricArtifactPathNoGoBoundary',
  'jsonFirstMetricArtifactReservedRoot',
  'jsonFirstMetricArtifactPathAuthority',
  'metricArtifactFoundationPathCollector',
  'metricArtifactFoundationPathVerification'
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

test('first optimization metric artifact path boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization metric artifact path/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved future artifact root: docs\/audit\/artifacts\/first-optimization\/metric-foundation\//);
  assert.match(doc, /Committed foundation metric artifact files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready artifact path rows: 0/);
  assert.match(doc, /not completion proof for metric artifact path authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('metric artifact reserved path rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-ARTIFACTPATH-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedPathRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /first optimization metric artifact path boundary rows: 10/);
  assert.match(doc, /reserved future artifact roots: 1/);
  assert.match(doc, /reserved future artifact files: 9/);
  assert.match(doc, /committed foundation metric artifact files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready artifact path rows: 0/);
  assert.match(doc, /foundation packet rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('reserved metric artifact paths are named but not committed yet', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }
});

test('metric artifact path boundary is backed by current foundation packet gates', () => {
  const foundationPacket = read(sourceDocs.foundationPacket);
  const selection = read(sourceDocs.selection);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);

  assert.match(foundationPacket, /required foundation metric artifact packet exists: no/);
  assert.match(foundationPacket, /committed foundation metric artifacts: 0/);
  assert.match(foundationPacket, /runtime metric collectors approved: 0/);
  assert.match(selection, /Selected audit work packet: FT-BIND-00-metric-artifact-foundation/);
  assert.match(metricSchema, /current committed first-optimization metric artifacts: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(insertion, /collector rows implementation-ready: 0/);
  assert.match(noWork, /collector no-work rows implementation-ready: 0/);
  assert.match(sideEffect, /collector side-effect rows implementation-ready: 0/);
  assert.match(fixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(parityRollout, /collector parity rollout rows implementation-ready: 0/);
});

test('metric artifact path authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('metric artifact path boundary is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const artifacts = [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    ...Object.values(sourceDocs).map(read)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization metric artifact path boundary addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
