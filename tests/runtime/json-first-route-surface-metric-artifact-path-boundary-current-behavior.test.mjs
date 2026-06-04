import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-metric-artifact-path-boundary-current-behavior.test.mjs';
const metricArtifactRoot = 'docs/audit/artifacts/json-first/route-surface-metric-artifact/';
const foundationMetricSamplePath = 'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  metricApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureApproval: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixture: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-JSON-METRIC-PATH-00-root',
  'FT-JSON-METRIC-PATH-01-metric-sample',
  'FT-JSON-METRIC-PATH-02-no-work-budget',
  'FT-JSON-METRIC-PATH-03-side-effect-budget',
  'FT-JSON-METRIC-PATH-04-fixture-provenance',
  'FT-JSON-METRIC-PATH-05-verification-output'
];

const reservedArtifactPaths = [
  metricArtifactRoot,
  `${metricArtifactRoot}metric-sample.json`,
  `${metricArtifactRoot}no-work-budget.json`,
  `${metricArtifactRoot}side-effect-budget.json`,
  `${metricArtifactRoot}fixture-provenance.json`,
  `${metricArtifactRoot}verification-output.tap`,
  foundationMetricSamplePath
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceMetricArtifactPathBoundary',
  'jsonFirstRouteSurfaceMetricArtifactPathReport',
  'jsonFirstRouteSurfaceMetricArtifactRoot',
  'jsonFirstRouteSurfaceMetricSamplePath',
  'jsonFirstRouteSurfaceMetricNoWorkBudgetPath',
  'jsonFirstRouteSurfaceMetricSideEffectBudgetPath',
  'jsonFirstRouteSurfaceMetricFixtureProvenancePath',
  'jsonFirstRouteSurfaceMetricVerificationOutputPath',
  'jsonFirstRouteSurfaceMetricArtifactPathApproval',
  'jsonFirstRouteSurfaceMetricArtifactPathNoGoReport',
  'routeSurfaceMetricArtifactPathRuntimeAuthority',
  'runtimeRouteSurfaceMetricArtifactPathApproval'
];

const pathAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Pp]ath [Bb]oundary [Aa]ddendum/;
const methodGapAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Pp]ath [Bb]oundary [Aa]ddendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/;
const affectedCallableAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Mm]etric [Aa]rtifact [Pp]ath [Bb]oundary [Aa]ddendum[\s\S]*affected\s+callable\s+semantic\s+proof/;

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
    ...walk('src'),
    ...walk('css'),
    ...walk('assets'),
    'build.js',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json'
  ]
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

test('JSON-first route/surface metric artifact path boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface metric artifact\s+path boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /Reserved route\/surface metric artifact root: docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\//);
  assert.match(doc, /Committed route\/surface metric artifact files: 0/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5812/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5812/);
  assert.match(doc, /Runtime route\/surface metric artifact approval exists: no/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface metric artifact path authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface metric artifact path rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-METRIC-PATH-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 6);
  assert.match(doc, /JSON-first route\/surface metric artifact path rows: 6/);
  assert.match(doc, /reserved future metric artifact roots: 1/);
  assert.match(doc, /reserved future metric artifact files: 5/);
  assert.match(doc, /related first-optimization foundation sample paths covered: 1/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5812/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5812/);
  assert.match(doc, /committed route\/surface metric artifact files: 0/);
  assert.match(doc, /committed first-optimization foundation metric sample files: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /runtime whitelist optimization approvals: 0/);
  assert.match(doc, /implementation-ready route\/surface metric artifact path rows: 0/);
  assert.match(doc, /metric artifact approval boundary rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /JSON-first fixture approval rows covered: 12/);
  assert.match(doc, /metric artifact schema rows covered: 12/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /metric collector insertion rows covered: 12/);
  assert.match(doc, /metric collector no-work rows covered: 12/);
  assert.match(doc, /metric collector side-effect rows covered: 12/);
  assert.match(doc, /metric collector fixture provenance rows covered: 12/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
});

test('reserved JSON-first route/surface metric artifact paths are named but absent', () => {
  const doc = read(docPath);

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }
});

test('JSON-first route/surface metric artifact path boundary is backed by current NO-GO gates', () => {
  const metricApproval = read(sourceDocs.metricApproval);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const fixtureApproval = read(sourceDocs.fixtureApproval);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const collectorNoWork = read(sourceDocs.collectorNoWork);
  const collectorSideEffect = read(sourceDocs.collectorSideEffect);
  const collectorFixture = read(sourceDocs.collectorFixture);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);
  const stopGo = read(sourceDocs.stopGo);

  assert.match(metricApproval, /committed route\/surface metric artifact files: 0/);
  assert.match(metricApproval, /commit route\/surface metric artifact root now: NO-GO/);
  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(fixtureApproval, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /runtime route\/surface metric artifacts: 0/);
  assert.match(jsonFirstImplementation, /runtime JSON-first implementation approvals: 0/);
  assert.match(metricSchema, /Current committed first-optimization metric artifacts: 0/);
  assert.match(metricSchema, /Runtime metric collectors implemented: 0/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(collectorNoWork, /runtime collector no-work proofs approved: 0/);
  assert.match(collectorSideEffect, /runtime collector side-effect budgets approved: 0/);
  assert.match(collectorFixture, /runtime collector fixture packets approved: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
});

test('JSON-first route/surface metric artifact path symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const decision of [
    'reserve JSON-first route/surface metric artifact path under docs/audit: GO',
    'commit route/surface metric artifact root now: NO-GO',
    'commit route/surface metric artifact files now: NO-GO',
    'commit first-optimization foundation metric sample now: NO-GO',
    'use route/surface metric artifact path as implementation authority now: NO-GO',
    'use route/surface metric artifact path as collector approval now: NO-GO',
    'runtime route/surface metric artifact approval now: NO-GO',
    'runtime metric collector approval now: NO-GO',
    'JSON-first runtime behavior patch now: NO-GO',
    'whitelist optimization patch now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'native/release/public claim based on metric artifact path now: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('JSON-first route/surface metric artifact path boundary is linked from ledgers and adjacent gates', () => {
  const { methodGap, ...sourceDocsRequiringBacklink } = sourceDocs;
  const linkedDocs = {
    ...sourceDocsRequiringBacklink,
    ...ledgerDocs
  };

  for (const [label, file] of Object.entries(linkedDocs)) {
    const artifact = read(file);
    assert.match(artifact, pathAddendumPattern, `${label} missing addendum heading`);
    assert.ok(artifact.includes(docPath), `${label} missing doc backlink`);
    assert.ok(artifact.includes(runtimeTestPath), `${label} missing test backlink`);
  }

  assert.match(read(sourceDocs.runtimeResults), /tests 4457/);
  assert.match(read(sourceDocs.runtimeResults), /pass 4457/);
  assert.match(read(sourceDocs.runtimeResults), methodGapAddendumPattern);
  assert.match(read(sourceDocs.runtimeResults), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.objectiveLedger), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.objectiveLedger), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.activeGoal), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.activeGoal), affectedCallableAddendumPattern);
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.match(read(ledgerDocs.trackedIndex), methodGapAddendumPattern);
  assert.match(read(ledgerDocs.trackedIndex), affectedCallableAddendumPattern);
});
