import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-route-surface-fixture-approval-boundary-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const artifactRoot = 'docs/audit/artifacts/json-first/route-surface-fixture-packet/';

const sourceDocs = {
  fixturePacketContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  commitReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  contractCoverage: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  manifestContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sampleContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  provenanceContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  parityContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  verificationContract: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceAuthority: 'docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstImplementation: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath,
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const expectedRows = [
  'FT-JSON-FIXTURE-APPROVAL-00-binding-scope',
  'FT-JSON-FIXTURE-APPROVAL-01-packet-contract-preconditions',
  'FT-JSON-FIXTURE-APPROVAL-02-artifact-contract-coverage',
  'FT-JSON-FIXTURE-APPROVAL-03-artifact-absence',
  'FT-JSON-FIXTURE-APPROVAL-04-manifest-approval',
  'FT-JSON-FIXTURE-APPROVAL-05-sample-approval',
  'FT-JSON-FIXTURE-APPROVAL-06-provenance-approval',
  'FT-JSON-FIXTURE-APPROVAL-07-parity-report-approval',
  'FT-JSON-FIXTURE-APPROVAL-08-verification-output-approval',
  'FT-JSON-FIXTURE-APPROVAL-09-route-surface-metric-approval',
  'FT-JSON-FIXTURE-APPROVAL-10-native-release-public-scope',
  'FT-JSON-FIXTURE-APPROVAL-11-ledger-runtime-results'
];

const reservedArtifactPaths = [
  artifactRoot,
  `${artifactRoot}manifest.json`,
  `${artifactRoot}fixture-sample.json`,
  `${artifactRoot}provenance.json`,
  `${artifactRoot}parity-report.json`,
  `${artifactRoot}verification-output.tap`
];

const futureAuthorityTokens = [
  'jsonFirstRouteSurfaceFixtureApprovalBoundary',
  'jsonFirstRouteSurfaceFixtureApprovalReport',
  'jsonFirstRouteSurfaceFixtureApprovalPacket',
  'jsonFirstRouteSurfaceFixtureApprovalStatus',
  'jsonFirstRouteSurfaceFixtureRuntimeApproval',
  'jsonFirstRouteSurfaceFixturePacketRuntimeApproval',
  'jsonFirstRouteSurfaceFixtureArtifactApproval',
  'jsonFirstRouteSurfaceFixtureManifestApproval',
  'jsonFirstRouteSurfaceFixtureSampleApproval',
  'jsonFirstRouteSurfaceFixtureProvenanceApproval',
  'jsonFirstRouteSurfaceFixtureParityApproval',
  'jsonFirstRouteSurfaceFixtureVerificationApproval',
  'jsonFirstRouteSurfaceMetricArtifactApproval',
  'jsonFirstRouteSurfaceFixtureApprovalNoGoBoundary',
  'jsonFirstRouteSurfaceFixtureApprovalRuntimeAuthority',
  'jsonFirstRouteSurfaceFixtureOptimizationGoGate',
  'jsonFirstRouteSurfaceFixturePublicClaimApproval',
  'jsonFirstRouteSurfaceFixtureNativeSyncApproval',
  'jsonFirstRouteSurfaceFixtureReleaseApproval'
];

const approvalAddendumPattern = /JSON-[Ff]irst [Rr]oute\/[Ss]urface [Ff]ixture [Aa]pproval [Bb]oundary [Aa]ddendum/;

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

test('JSON-first route/surface fixture approval boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first route\/surface fixture approval\s+boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,?\s+optimization patch/);
  assert.match(doc, /This is approval absence proof/);
  assert.match(doc, /JSON-first route\/surface fixture approval boundary rows: 12/);
  assert.match(doc, /Runtime JSON-first fixture packet approvals: 0/);
  assert.match(doc, /Runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /Committed route\/surface fixture packet files: 0/);
  assert.match(doc, /not completion proof for JSON-first route\/surface fixture approval authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('JSON-first route/surface fixture approval rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-FIXTURE-APPROVAL-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /fixture packet contract rows covered: 12/);
  assert.match(doc, /fixture artifact path boundary rows covered: 6/);
  assert.match(doc, /fixture artifact commit readiness rows covered: 10/);
  assert.match(doc, /fixture artifact contract coverage rows covered: 10/);
  assert.match(doc, /manifest contract rows covered: 12/);
  assert.match(doc, /fixture sample contract rows covered: 12/);
  assert.match(doc, /provenance artifact contract rows covered: 12/);
  assert.match(doc, /parity report contract rows covered: 12/);
  assert.match(doc, /verification output contract rows covered: 12/);
  assert.match(doc, /route\/surface authority rows covered: 12/);
  assert.match(doc, /route\/surface metric obligations covered: 12/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5827/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5827/);
  assert.match(doc, /runtime JSON-first fixture artifact approvals: 0/);
  assert.match(doc, /runtime route\/surface metric artifact approvals: 0/);
  assert.match(doc, /committed route\/surface fixture verification output files: 0/);
  assert.match(doc, /implementation-ready JSON-first fixture approval rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
});

test('JSON-first fixture approval is backed by current contracts and NO-GO gates', () => {
  const packet = read(sourceDocs.fixturePacketContract);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const commitReadiness = read(sourceDocs.commitReadiness);
  const contractCoverage = read(sourceDocs.contractCoverage);
  const routeSurfaceAuthority = read(sourceDocs.routeSurfaceAuthority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const jsonFirstImplementation = read(sourceDocs.jsonFirstImplementation);
  const methodGap = read(sourceDocs.methodGap);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.match(packet, /Runtime JSON-first fixture packet approvals: 0/);
  assert.match(packet, /Committed route\/surface fixture packet files: 0/);
  assert.match(pathBoundary, /committed route\/surface fixture packet files: 0/);
  assert.match(pathBoundary, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(commitReadiness, /commit route\/surface fixture packet root now: NO-GO/);
  assert.match(commitReadiness, /runtime route\/surface metric artifact approval now: NO-GO/);
  assert.match(contractCoverage, /per-file fixture artifact contract docs covered: 5/);
  assert.match(contractCoverage, /runtime JSON-first fixture packet approvals: 0/);
  assert.match(routeSurfaceAuthority, /runtime JSON-first route\/surface approvals: 0/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(jsonFirstImplementation, /method semantic proof gap files covered: 69/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5827/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(implementationReadiness, /runtime first optimization approvals: 0/);
  assert.match(implementationReadiness, /implementation-ready first optimization rows: 0/);
});

test('JSON-first route/surface fixture artifacts remain absent and unapproved', () => {
  const doc = read(docPath);

  assert.ok(doc.includes('affected callable semantic proof: NO-GO'));

  for (const reservedPath of reservedArtifactPaths) {
    assert.ok(doc.includes(reservedPath), `missing reserved path ${reservedPath}`);
    assert.equal(fs.existsSync(path.join(repoRoot, reservedPath)), false, `${reservedPath} should not exist yet`);
  }

  for (const sourceDoc of [
    sourceDocs.manifestContract,
    sourceDocs.sampleContract,
    sourceDocs.provenanceContract,
    sourceDocs.parityContract,
    sourceDocs.verificationContract
  ]) {
    const source = read(sourceDoc);
    assert.match(source, /runtime JSON-first fixture .*approvals: 0|Runtime JSON-first fixture .*approval exists: no/);
    assert.match(source, /commit route\/surface fixture .*now: NO-GO|committed route\/surface fixture .*files: 0/i);
  }
});

test('JSON-first route/surface fixture approval future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('JSON-first route/surface fixture approval boundary is linked from ledgers and adjacent gates', () => {
  const runtimeResults = read(ledgerDocs.runtimeResults);
  const objectiveLedger = read(ledgerDocs.objectiveLedger);
  const activeGoal = read(ledgerDocs.activeGoal);
  const trackedIndex = read(ledgerDocs.trackedIndex);
  const stopGo = read(ledgerDocs.stopGo);

  for (const artifact of [runtimeResults, objectiveLedger, activeGoal, trackedIndex, stopGo]) {
    assert.match(artifact, approvalAddendumPattern);
    assert.ok(artifact.includes(docPath), `missing doc backlink in ${artifact.slice(0, 40)}`);
    assert.ok(artifact.includes(runtimeTestPath), `missing test backlink in ${artifact.slice(0, 40)}`);
  }

  for (const adjacentDoc of [
    sourceDocs.fixturePacketContract,
    sourceDocs.contractCoverage,
    sourceDocs.commitReadiness,
    sourceDocs.routeSurfaceAuthority,
    sourceDocs.jsonFirstImplementation,
    sourceDocs.implementationReadiness
  ]) {
    const adjacent = read(adjacentDoc);
    assert.match(adjacent, approvalAddendumPattern);
    assert.ok(adjacent.includes(docPath), `missing adjacent doc backlink in ${adjacentDoc}`);
    assert.ok(adjacent.includes(runtimeTestPath), `missing adjacent test backlink in ${adjacentDoc}`);
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /JSON-first route\/surface fixture approval boundary addendum:[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(objectiveLedger, /JSON-First Route\/Surface Fixture Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(activeGoal, /JSON-First Route\/Surface Fixture Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
  assert.match(trackedIndex, /JSON-First Route\/Surface Fixture Approval Boundary Addendum[\s\S]*69\s+method\s+semantic\s+proof\s+gap\s+files covered/);
});
