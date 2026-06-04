import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs';
const fixtureProvenancePath = 'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
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
  parityRollout: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedFixtureProvenanceRows = [
  'FT-FIXTURE-PROVENANCE-00-packet-binding',
  'FT-FIXTURE-PROVENANCE-01-artifact-binding',
  'FT-FIXTURE-PROVENANCE-02-raw-source',
  'FT-FIXTURE-PROVENANCE-03-committed-fixture',
  'FT-FIXTURE-PROVENANCE-04-positive-fixture',
  'FT-FIXTURE-PROVENANCE-05-negative-sibling-fixture',
  'FT-FIXTURE-PROVENANCE-06-no-rule-disabled-empty',
  'FT-FIXTURE-PROVENANCE-07-json-dom-parity',
  'FT-FIXTURE-PROVENANCE-08-source-owner-coverage',
  'FT-FIXTURE-PROVENANCE-09-side-effect-no-work',
  'FT-FIXTURE-PROVENANCE-10-parity-rollout',
  'FT-FIXTURE-PROVENANCE-11-verification'
];

const expectedFixtureProvenanceClosureRows = [
  'FT-FIXTURE-PROVENANCE-CLOSURE-00-packet-binding',
  'FT-FIXTURE-PROVENANCE-CLOSURE-01-artifact-binding',
  'FT-FIXTURE-PROVENANCE-CLOSURE-02-raw-source',
  'FT-FIXTURE-PROVENANCE-CLOSURE-03-committed-fixture',
  'FT-FIXTURE-PROVENANCE-CLOSURE-04-positive-fixture',
  'FT-FIXTURE-PROVENANCE-CLOSURE-05-negative-sibling-fixture',
  'FT-FIXTURE-PROVENANCE-CLOSURE-06-no-rule-disabled-empty',
  'FT-FIXTURE-PROVENANCE-CLOSURE-07-json-dom-parity',
  'FT-FIXTURE-PROVENANCE-CLOSURE-08-source-owner-coverage',
  'FT-FIXTURE-PROVENANCE-CLOSURE-09-side-effect-no-work',
  'FT-FIXTURE-PROVENANCE-CLOSURE-10-parity-rollout',
  'FT-FIXTURE-PROVENANCE-CLOSURE-11-verification'
];

const requiredFixtureProvenanceFields = [
  'provenanceVersion',
  'provenanceId',
  'packetId',
  'sampleId',
  'sourceOwnerMapId',
  'candidateId',
  'bindingId',
  'obligationId',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'artifactRoot',
  'fixtureProvenancePath',
  'rawSourcePath',
  'rawSourceHash',
  'rawSourceIgnored',
  'rawSourceReleaseExcluded',
  'committedFixturePath',
  'fixtureHash',
  'fixtureRoute',
  'fixtureSurface',
  'fixtureEndpoint',
  'positiveFixture',
  'positiveExpectedDecision',
  'negativeSiblingFixture',
  'siblingVisibleProof',
  'noRuleFixture',
  'disabledFixture',
  'emptyBlocklistFixture',
  'emptyWhitelistFixture',
  'passThroughProof',
  'jsonFixture',
  'domFixture',
  'jsonPaths',
  'domSelectors',
  'sourceOwnersCovered',
  'callableOwnerProofStatus',
  'unownedFields',
  'noWorkRowsCovered',
  'sideEffectRowsCovered',
  'networkNoWorkFixture',
  'storageNoWorkFixture',
  'visualNoWorkFixture',
  'nativeParityFixture',
  'releaseInputExcluded',
  'publicClaimScope',
  'rollbackBoundary',
  'verificationCommand',
  'expectedTests',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'firstOptimizationFixtureProvenanceContract',
  'firstOptimizationFixtureProvenanceReport',
  'firstOptimizationFixtureProvenanceApproval',
  'firstOptimizationFixtureProvenanceNoGoBoundary',
  'jsonFirstOptimizationFixtureProvenance',
  'jsonFirstFixtureProvenanceAuthority',
  'metricArtifactFixtureProvenanceCollector',
  'metricArtifactFixtureProvenanceVerification',
  'metricArtifactFixtureProvenanceRuntimeApproval',
  'whitelistOptimizationFixtureProvenanceBudget',
  'fixtureProvenanceDraftClosure',
  'fixtureProvenanceDraftClosureRuntimeApproval',
  'fixtureProvenanceDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineFixtureProvenanceShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline fixture provenance JSON block');
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

test('first optimization fixture provenance contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization fixture provenance/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved fixture provenance path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/fixture-provenance\.json/);
  assert.match(doc, /Committed fixture provenance files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready fixture provenance contract rows: 0/);
  assert.match(doc, /not completion proof for fixture provenance authority/);
  assert.match(doc, /affected callable set and\s+method semantic proof status/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('fixture provenance contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-FIXTURE-PROVENANCE-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-FIXTURE-PROVENANCE-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedFixtureProvenanceRows);
  assert.deepEqual(closureRows, expectedFixtureProvenanceClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization fixture provenance contract rows: 12/);
  assert.match(doc, /reserved fixture provenance paths covered: 1/);
  assert.match(doc, /committed fixture provenance files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready fixture provenance contract rows: 0/);
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
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5830/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5830/);
  assert.match(doc, /inline fixture provenance JSON sections covered: 12/);
  assert.match(doc, /inline fixture provenance artifact promotion decision: NO-GO/);
  assert.match(doc, /fixture provenance draft closure rows: 12/);
  assert.match(doc, /fixture provenance rows linked by closure: 12/);
  assert.match(doc, /inline fixture provenance JSON sections linked by closure: 12/);
  assert.match(doc, /source owner map contract rows linked by fixture closure: 12/);
  assert.match(doc, /metric sample contract rows linked by fixture closure: 12/);
  assert.match(doc, /manifest contract rows linked by fixture closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by fixture closure: 10/);
  assert.match(doc, /foundation packet rows linked by fixture closure: 12/);
  assert.match(doc, /metric schema rows linked by fixture closure: 12/);
  assert.match(doc, /metric source-owner rows linked by fixture closure: 12/);
  assert.match(doc, /collector readiness families linked by fixture closure: 5/);
  assert.match(doc, /method semantic proof gap files linked by fixture closure: 69/);
  assert.match(doc, /lexical callables linked by fixture closure: 5830/);
  assert.match(doc, /runtime fixture provenance closure approvals: 0/);
  assert.match(doc, /implementation-ready fixture provenance closure rows: 0/);
  assert.match(doc, /fixture provenance draft closure: FIXTURE-PROVENANCE-CHAIN-CLOSED/);
  assert.match(doc, /fixture provenance implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFixtureProvenanceFields) {
    assert.ok(doc.includes(field), `missing fixture provenance field ${field}`);
  }

  const provenanceShape = inlineFixtureProvenanceShape();
  const provenanceRows = provenanceShape.sections.map((section) => section.id);
  const provenanceSections = provenanceShape.sections.map((section) => section.section);
  const inlineFields = new Set(provenanceShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(provenanceShape.provenanceVersion, 'fixture-provenance-draft-2026-05-29');
  assert.equal(provenanceShape.provenanceId, 'FT-FIXTURE-PROVENANCE-DRAFT-00');
  assert.equal(provenanceShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(provenanceShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(provenanceShape.sourceOwnerMapId, 'FT-SOURCE-OWNER-MAP-DRAFT-00');
  assert.equal(provenanceShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(provenanceShape.fixtureProvenancePath, fixtureProvenancePath);
  assert.equal(provenanceShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(provenanceShape.runtimeBehaviorChanged, false);
  assert.deepEqual(provenanceRows, expectedFixtureProvenanceRows);
  assert.equal(new Set(provenanceSections).size, 12);

  for (const field of requiredFixtureProvenanceFields) {
    assert.ok(inlineFields.has(field), `inline fixture provenance missing field ${field}`);
  }

  for (const section of provenanceShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 5, `${section.id} requiredFields is too small`);
  }
});

test('fixture provenance path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const provenanceShape = inlineFixtureProvenanceShape();

  assert.ok(doc.includes(fixtureProvenancePath));
  assert.equal(provenanceShape.fixtureProvenancePath, fixtureProvenancePath);
  assert.equal(provenanceShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, fixtureProvenancePath)), false, `${fixtureProvenancePath} should not exist yet`);
});

test('fixture provenance contract is backed by current owner sample artifact and collector gates', () => {
  const sourceOwnerMapContract = read(sourceDocs.sourceOwnerMapContract);
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

  assert.match(sourceOwnerMapContract, /Committed source owner map files: 0/);
  assert.match(sourceOwnerMapContract, /Implementation-ready source owner map contract rows: 0/);
  assert.match(sourceOwnerMapContract, /method semantic proof gap files covered: 69/);
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
  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5830/);
});

test('fixture provenance authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('fixture provenance contract is linked from audit ledgers and upstream gates', () => {
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
    ...Object.values(sourceDocs).map(read)
  ];

  for (const artifact of artifacts) {
    assert.match(artifact, /First optimization fixture provenance contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization fixture provenance contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization fixture provenance contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization fixture provenance contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization fixture provenance contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(doc, /close fixture provenance documentation chain now: GO/);
  assert.match(doc, /accept fixture provenance closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept fixture provenance closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept fixture provenance closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept fixture provenance closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept fixture provenance closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept fixture provenance closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
