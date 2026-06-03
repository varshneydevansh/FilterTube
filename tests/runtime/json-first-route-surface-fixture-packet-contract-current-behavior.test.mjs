import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-packet-contract-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorFixtureProvenance: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureProvenanceContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  bindingMatrix: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceEffect: 'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md'
};

const expectedRows = [
  'FT-JSON-FIXTURE-00-endpoint-admission',
  'FT-JSON-FIXTURE-01-main-home',
  'FT-JSON-FIXTURE-02-main-search',
  'FT-JSON-FIXTURE-03-watch-player-next',
  'FT-JSON-FIXTURE-04-shorts',
  'FT-JSON-FIXTURE-05-playlist-mix',
  'FT-JSON-FIXTURE-06-comments-posts',
  'FT-JSON-FIXTURE-07-kids',
  'FT-JSON-FIXTURE-08-ytm-mobile',
  'FT-JSON-FIXTURE-09-native-overlay',
  'FT-JSON-FIXTURE-10-lifecycle-affordance',
  'FT-JSON-FIXTURE-11-diagnostic-metric'
];

const routeSurfaceRows = [
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
  'packetId',
  'JSONRouteSurfaceRowId',
  'obligationId',
  'candidateId',
  'endpointFamily',
  'route',
  'surface',
  'profileType',
  'listMode',
  'ruleState',
  'rendererClass',
  'identityTier',
  'sourceCapturePath',
  'reducedFixturePath',
  'positiveFixture',
  'negativeSiblingFixture',
  'disabledFixture',
  'emptyListFixture',
  'sparseSurfaceFixture',
  'domParityFixture',
  'nativeParityFixture',
  'commentContinuationFixture',
  'selectedCurrentFixture',
  'playbackSafetyFixture',
  'lifecycleAffordanceFixture',
  'diagnosticPrivacyFixture',
  'metricArtifact',
  'sourceOwnerMap',
  'noWorkProof',
  'sideEffectBudget',
  'fixtureProvenance',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'rollbackPlan',
  'unclaimedSurfaceList',
  'releaseClaimScope',
  'verificationOutput'
];

const fixtureModeClasses = [
  'disabled',
  'missingSettings',
  'noRule',
  'emptyBlocklist',
  'emptyWhitelist',
  'nonemptyBlocklist',
  'nonemptyWhitelist',
  'contentFilterEmptyValues'
];

const fixtureEvidenceClasses = [
  'positiveHide',
  'negativeSiblingVisible',
  'restorePreserved',
  'JSONDOMParity',
  'nativeParity',
  'selectedCurrentPreserved',
  'commentContinuationPreserved',
  'playbackSafetyPreserved',
  'sparseIdentityFallback',
  'listenerObserverTimerBudget',
  'networkStorageBudget',
  'diagnosticPrivacy',
  'rollbackScope',
  'publicClaimScope'
];

const reservedFixturePacketPaths = [
  'docs/audit/artifacts/json-first/route-surface-fixture-packet/manifest.json',
  'docs/audit/artifacts/json-first/route-surface-fixture-packet/fixture-sample.json',
  'docs/audit/artifacts/json-first/route-surface-fixture-packet/provenance.json',
  'docs/audit/artifacts/json-first/route-surface-fixture-packet/parity-report.json',
  'docs/audit/artifacts/json-first/route-surface-fixture-packet/verification-output.tap'
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixturePacketContract',
  'jsonFirstRouteSurfaceFixturePacketReport',
  'jsonFirstRouteSurfaceFixturePacketApproval',
  'jsonFirstRouteSurfaceFixtureManifest',
  'jsonFirstRouteSurfacePositiveFixture',
  'jsonFirstRouteSurfaceNegativeSiblingFixture',
  'jsonFirstRouteSurfaceSparseFixture',
  'jsonFirstRouteSurfaceParityPacket',
  'jsonFirstRouteSurfaceFixtureNoGoReport'
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

test('JSON-first route/surface fixture packet contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture packet\s+contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /This is a fixture packet contract, not fixture approval/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture packet rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /JSON-first route\/surface fixture packet rows: 12/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /endpoint families covered: 5/);
  assert.match(doc, /surface families covered: 6/);
  assert.match(doc, /fixture mode classes required: 8/);
  assert.match(doc, /fixture evidence classes required: 14/);
  assert.match(doc, /JSON-first implementation authority rows covered: 13/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(doc, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifacts: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /committed route\/surface fixture packet files: 0/);
  assert.match(doc, /implementation-ready JSON-first fixture packet rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('JSON-first route/surface fixture packet rows bind authority rows and metric obligations', () => {
  const doc = read(docPath);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const collectorFixtureProvenance = read(sourceDocs.collectorFixtureProvenance);
  const methodGap = read(sourceDocs.methodGap);

  for (const row of routeSurfaceRows) {
    assert.ok(doc.includes(row), `missing fixture contract route row ${row}`);
    assert.ok(routeSurfaceAuthority.includes(row), `missing route/surface authority row ${row}`);
  }

  for (const obligation of metricObligations) {
    assert.ok(routeSurfaceMetric.includes(obligation), `missing metric obligation ${obligation}`);
  }

  assert.match(routeSurfaceAuthority, /implementation-ready JSON-first route\/surface rows: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(collectorFixtureProvenance, /runtime collector fixture packets approved: 0/);
  assert.match(collectorFixtureProvenance, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5736/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
});

test('JSON-first route/surface fixture packet fields, modes, evidence, and decisions are complete', () => {
  const doc = read(docPath);

  for (const field of requiredPacketFields) {
    assert.ok(doc.includes(field), `missing packet field ${field}`);
  }
  for (const modeClass of fixtureModeClasses) {
    assert.ok(doc.includes(modeClass), `missing fixture mode class ${modeClass}`);
  }
  for (const evidenceClass of fixtureEvidenceClasses) {
    assert.ok(doc.includes(evidenceClass), `missing fixture evidence class ${evidenceClass}`);
  }
  for (const decision of [
    'JSON-first route/surface fixture packet contract documented: GO',
    'JSON-first route/surface fixture packet approval now: NO-GO',
    'commit route/surface fixture packet artifact now: NO-GO',
    'use route/surface fixture packet as implementation authority now: NO-GO',
    'JSON-first route/surface runtime approval now: NO-GO',
    'route/surface metric artifact approval now: NO-GO',
    'affected callable semantic proof: NO-GO',
    'native/release/public claim based on route/surface packet now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }
});

test('JSON-first route/surface fixture packet artifacts and future symbols are absent from runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const artifactPath of reservedFixturePacketPaths) {
    assert.ok(doc.includes(artifactPath), `missing reserved path ${artifactPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, artifactPath)), false, `reserved fixture packet file exists: ${artifactPath}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('JSON-first route/surface fixture packet contract is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    routeSurfaceAuthority: sourceDocs.routeSurfaceAuthority,
    routeSurfaceMetric: sourceDocs.routeSurfaceMetric,
    jsonFirstImplementation: sourceDocs.jsonFirstImplementation,
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
  assert.match(read(sourceDocs.runtimeResults), /JSON-first route\/surface fixture packet contract addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.objectiveLedger), /JSON-first route\/surface fixture packet contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.activeGoal), /JSON-first route\/surface fixture packet contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(read(ledgerDocs.trackedIndex), /JSON-first route\/surface fixture packet contract addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
});
