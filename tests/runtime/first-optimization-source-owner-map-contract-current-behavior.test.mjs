import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-owner-map-contract-current-behavior.test.mjs';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
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
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedSourceOwnerMapRows = [
  'FT-SOURCE-OWNER-MAP-00-map-identity',
  'FT-SOURCE-OWNER-MAP-01-artifact-binding',
  'FT-SOURCE-OWNER-MAP-02-source-locus-catalog',
  'FT-SOURCE-OWNER-MAP-03-collector-insertion-owner',
  'FT-SOURCE-OWNER-MAP-04-transport-owner',
  'FT-SOURCE-OWNER-MAP-05-engine-owner',
  'FT-SOURCE-OWNER-MAP-06-dom-lifecycle-owner',
  'FT-SOURCE-OWNER-MAP-07-network-storage-owner',
  'FT-SOURCE-OWNER-MAP-08-visual-diagnostic-owner',
  'FT-SOURCE-OWNER-MAP-09-no-work-side-effect-owner',
  'FT-SOURCE-OWNER-MAP-10-fixture-parity-owner',
  'FT-SOURCE-OWNER-MAP-11-verification-owner'
];

const requiredSourceOwnerMapFields = [
  'mapVersion',
  'mapId',
  'packetId',
  'sampleId',
  'candidateId',
  'bindingId',
  'obligationId',
  'manifestVersion',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'metricSamplePath',
  'sourceOwnerMapPath',
  'sourceLocus',
  'sourceOwner',
  'ownerFamily',
  'sourceFiles',
  'callables',
  'lineAnchors',
  'callableOwnerProofStatus',
  'collectorInsertionId',
  'approvedInsertionPoint',
  'collectorApproved',
  'transportOwner',
  'fetchOwner',
  'xhrOwner',
  'engineOwner',
  'candidateExtractionOwner',
  'domOwner',
  'selectorOwner',
  'observerOwner',
  'timerOwner',
  'networkOwner',
  'credentialOwner',
  'storageOwner',
  'mapWriteOwner',
  'visualOwner',
  'diagnosticOwner',
  'privacyOwner',
  'noWorkResponsibilities',
  'sideEffectResponsibilities',
  'fixtureResponsibilities',
  'parityResponsibilities',
  'verificationResponsibilities',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'firstOptimizationSourceOwnerMapContract',
  'firstOptimizationSourceOwnerMapReport',
  'firstOptimizationSourceOwnerMapApproval',
  'firstOptimizationSourceOwnerMapNoGoBoundary',
  'jsonFirstOptimizationSourceOwnerMap',
  'jsonFirstSourceOwnerMapAuthority',
  'metricArtifactSourceOwnerMapCollector',
  'metricArtifactSourceOwnerMapVerification',
  'metricArtifactSourceOwnerMapRuntimeApproval',
  'whitelistOptimizationSourceOwnerMapBudget'
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

test('first optimization source owner map contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source owner map/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved source owner map path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/source-owner-map\.json/);
  assert.match(doc, /Committed source owner map files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready source owner map contract rows: 0/);
  assert.match(doc, /not completion proof for source owner map authority/);
  assert.match(doc, /affected callable set and method semantic proof\s+status/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source owner map contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-OWNER-MAP-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSourceOwnerMapRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /first optimization source owner map contract rows: 12/);
  assert.match(doc, /reserved source owner map paths covered: 1/);
  assert.match(doc, /committed source owner map files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready source owner map contract rows: 0/);
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
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5812/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5812/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredSourceOwnerMapFields) {
    assert.ok(doc.includes(field), `missing source owner map field ${field}`);
  }
});

test('source owner map path is reserved but not committed yet', () => {
  const doc = read(docPath);

  assert.ok(doc.includes(sourceOwnerMapPath));
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false, `${sourceOwnerMapPath} should not exist yet`);
});

test('source owner map contract is backed by current sample manifest artifact and collector gates', () => {
  const metricSampleContract = read(sourceDocs.metricSampleContract);
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
  const methodGap = read(methodGapPath);

  assert.match(metricSampleContract, /Committed metric sample files: 0/);
  assert.match(metricSampleContract, /Implementation-ready metric sample contract rows: 0/);
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
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);
});

test('source owner map authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('source owner map contract is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization source owner map contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization source owner map contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization source owner map contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization source owner map contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization source owner map contract addendum:[\s\S]*69 method semantic proof gap files covered/);
});
