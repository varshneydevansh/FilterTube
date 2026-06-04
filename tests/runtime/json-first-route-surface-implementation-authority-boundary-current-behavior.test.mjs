import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-implementation-authority-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  routeSurfaceEffect: 'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  readinessGate: 'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
  listMode: 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  whitelistDecision: 'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  bindingMatrix: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedRows = [
  'FT-JSON-ROUTE-00-endpoint-admission',
  'FT-JSON-ROUTE-01-main-home',
  'FT-JSON-ROUTE-02-main-search',
  'FT-JSON-ROUTE-03-watch-player-next',
  'FT-JSON-ROUTE-04-shorts',
  'FT-JSON-ROUTE-05-playlist-mix',
  'FT-JSON-ROUTE-06-comments-posts',
  'FT-JSON-ROUTE-07-kids',
  'FT-JSON-ROUTE-08-ytm-mobile',
  'FT-JSON-ROUTE-09-native-overlay',
  'FT-JSON-ROUTE-10-lifecycle-affordance',
  'FT-JSON-ROUTE-11-diagnostic-metric'
];

const metricObligations = [
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

const requiredPacketFields = [
  'JSONRouteSurfaceRowId',
  'candidateId',
  'obligationId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'sourceLocus',
  'endpointFamily',
  'route',
  'surface',
  'profileType',
  'listMode',
  'ruleState',
  'rendererClass',
  'identityTier',
  'allowedEffects',
  'forbiddenEffects',
  'parseBudget',
  'stringifyBudget',
  'harvestBudget',
  'domScanBudget',
  'listenerObserverTimerBudget',
  'networkStorageBudget',
  'hideRestoreBudget',
  'playbackSideEffectBudget',
  'diagnosticBudget',
  'positiveFixture',
  'negativeSiblingFixture',
  'disabledFixture',
  'emptyListFixture',
  'sparseSurfaceFixture',
  'domParityFixture',
  'nativeParityFixture',
  'metricArtifact',
  'rollbackPlan',
  'unclaimedSurfaceList',
  'releaseClaimScope'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceImplementationAuthorityBoundary',
  'jsonFirstRouteSurfaceImplementationReport',
  'jsonFirstRouteSurfaceApproval',
  'jsonFirstEndpointRouteSurfaceGoGate',
  'jsonFirstRouteSurfaceMetricArtifact',
  'jsonFirstRouteSurfaceFixturePacket',
  'jsonFirstSurfaceParityImplementationPacket',
  'jsonFirstRouteSurfaceNoGoReport'
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

test('JSON-first route/surface implementation authority boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface implementation\s+authority boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation\s+patch, optimization patch/);
  assert.match(doc, /endpoint-shaped JSON rows are not enough/);
  assert.match(doc, /route\/surface implementation authority classification, not route\/surface\s+implementation approval/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5836/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-ROUTE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface implementation authority rows: 12/);
  assert.match(doc, /route\/surface effect classes covered: 9/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /endpoint families covered: 5/);
  assert.match(doc, /surface families covered: 6/);
  assert.match(doc, /JSON-first implementation authority rows covered: 13/);
  assert.match(doc, /JSON-first readiness promotion rows covered: 13/);
  assert.match(doc, /JSON-first list-mode states covered: 6/);
  assert.match(doc, /JSON-first whitelist decision states covered: 7/);
  assert.match(doc, /candidate-obligation binding rows covered: 10/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5836/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5836/);
  assert.match(doc, /runtime JSON-first route\/surface approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifacts: 0/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /runtime whitelist optimization approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('JSON-first route/surface authority is backed by route and metric obligation docs', () => {
  const doc = read(docPath);
  const routeSurface = read(sourceDocs.routeSurfaceEffect);
  const metricMatrix = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const methodGap = read(sourceDocs.methodGap);

  for (const routeClass of [
    'YouTubei endpoints',
    'Main home/search',
    'Main watch/current video',
    'Shorts',
    'Playlist/Mix',
    'Comments/posts',
    'YouTube Kids',
    'YouTube Music/mobile `ytm-*`',
    'Native overlays/fullscreen/app shells'
  ]) {
    assert.ok(routeSurface.includes(routeClass), `missing route/surface class ${routeClass}`);
  }

  for (const obligation of metricObligations) {
    assert.ok(metricMatrix.includes(obligation), `missing metric obligation ${obligation}`);
  }

  assert.match(jsonFirstImplementation, /FT-JSON-AUTH-03-route-surface-scope/);
  assert.match(jsonFirstImplementation, /JSON rows are endpoint-shaped, while visible effects differ/);
  assert.match(metricMatrix, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(metricMatrix, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5836/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Route\/surface metric artifact with sample envelope/);
});

test('JSON-first route/surface packet fields and NO-GO decisions are complete', () => {
  const doc = read(docPath);

  for (const field of requiredPacketFields) {
    assert.ok(doc.includes(field), `missing packet field ${field}`);
  }

  for (const decision of [
    'JSON-first route/surface runtime approval now: NO-GO',
    'JSON-first endpoint pass-through by route now: NO-GO',
    'JSON-first home/search/watch route promotion now: NO-GO',
    'JSON-first Shorts/playlist/comments/Kids/YTM promotion now: NO-GO',
    'JSON-first native overlay or release claim now: NO-GO',
    'commit route/surface metric artifact now: NO-GO',
    'affected callable semantic proof: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }
});

test('JSON-first route/surface future symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('JSON-first route/surface authority boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    routeSurfaceEffect: sourceDocs.routeSurfaceEffect,
    routeSurfaceMetric: sourceDocs.routeSurfaceMetric,
    jsonFirstImplementation: sourceDocs.jsonFirstImplementation,
    bindingMatrix: sourceDocs.bindingMatrix,
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
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
});
