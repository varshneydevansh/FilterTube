import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs';
const manifestPath = 'docs/audit/artifacts/first-optimization/metric-foundation/packet-manifest.json';

const sourceDocs = {
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

const expectedManifestRows = [
  'FT-MANIFEST-00-packet-identity',
  'FT-MANIFEST-01-artifact-paths',
  'FT-MANIFEST-02-source-locus-owner',
  'FT-MANIFEST-03-route-surface-mode',
  'FT-MANIFEST-04-json-dom-authority',
  'FT-MANIFEST-05-metric-field-groups',
  'FT-MANIFEST-06-fixture-provenance',
  'FT-MANIFEST-07-no-work-preservation',
  'FT-MANIFEST-08-side-effect-budget',
  'FT-MANIFEST-09-diagnostic-privacy',
  'FT-MANIFEST-10-parity-rollout',
  'FT-MANIFEST-11-verification'
];

const expectedManifestClosureRows = [
  'FT-MANIFEST-CLOSURE-00-packet-identity',
  'FT-MANIFEST-CLOSURE-01-artifact-paths',
  'FT-MANIFEST-CLOSURE-02-source-locus-owner',
  'FT-MANIFEST-CLOSURE-03-route-surface-mode',
  'FT-MANIFEST-CLOSURE-04-json-dom-authority',
  'FT-MANIFEST-CLOSURE-05-metric-field-groups',
  'FT-MANIFEST-CLOSURE-06-fixture-provenance',
  'FT-MANIFEST-CLOSURE-07-no-work-preservation',
  'FT-MANIFEST-CLOSURE-08-side-effect-budget',
  'FT-MANIFEST-CLOSURE-09-diagnostic-privacy',
  'FT-MANIFEST-CLOSURE-10-parity-rollout',
  'FT-MANIFEST-CLOSURE-11-verification'
];

const requiredManifestFields = [
  'manifestVersion',
  'packetId',
  'candidateId',
  'bindingId',
  'obligationId',
  'readinessId',
  'artifactRoot',
  'packetManifestPath',
  'sourceLocus',
  'sourceOwner',
  'route',
  'surface',
  'endpoint',
  'listMode',
  'jsonPathClass',
  'jsonPaths',
  'domSelectorClass',
  'domSelectors',
  'positiveFixture',
  'negativeSiblingFixture',
  'disabledFixture',
  'emptyListFixture',
  'diagnosticLogBudget',
  'privacyClass',
  'jsonParityProof',
  'domParityProof',
  'nativeParityProof',
  'verificationCommand',
  'expectedTests',
  'authorityTokenAbsenceCheck'
];

const futureAuthorityTokens = [
  'firstOptimizationPacketManifestContract',
  'firstOptimizationPacketManifestReport',
  'firstOptimizationPacketManifestApproval',
  'firstOptimizationPacketManifestNoGoBoundary',
  'jsonFirstOptimizationPacketManifest',
  'jsonFirstPacketManifestAuthority',
  'metricArtifactPacketManifestCollector',
  'metricArtifactPacketManifestVerification',
  'metricArtifactPacketManifestArtifactPaths',
  'metricArtifactPacketManifestRuntimeApproval',
  'packetManifestDraftClosure',
  'packetManifestDraftClosureRuntimeApproval',
  'packetManifestDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineManifestShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline manifest JSON block');
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

test('first optimization packet manifest contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization packet manifest/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved manifest path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/packet-manifest\.json/);
  assert.match(doc, /Committed packet manifest files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready manifest contract rows: 0/);
  assert.match(doc, /not completion proof for packet manifest authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('packet manifest contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-MANIFEST-(?!CLOSURE)[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-MANIFEST-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedManifestRows);
  assert.deepEqual(closureRows, expectedManifestClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization packet manifest contract rows: 12/);
  assert.match(doc, /reserved manifest paths covered: 1/);
  assert.match(doc, /committed packet manifest files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready manifest contract rows: 0/);
  assert.match(doc, /artifact path boundary rows covered: 10/);
  assert.match(doc, /foundation packet rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /source-owner rows covered: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /collector side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /collector parity rollout rows covered: 12/);
  assert.match(doc, /inline manifest JSON sections covered: 12/);
  assert.match(doc, /inline manifest artifact promotion decision: NO-GO/);
  assert.match(doc, /packet manifest draft closure rows: 12/);
  assert.match(doc, /manifest rows linked by closure: 12/);
  assert.match(doc, /inline manifest JSON sections linked by closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by manifest closure: 10/);
  assert.match(doc, /foundation packet rows linked by manifest closure: 12/);
  assert.match(doc, /metric schema rows linked by manifest closure: 12/);
  assert.match(doc, /metric source-owner rows linked by manifest closure: 12/);
  assert.match(doc, /collector readiness families linked by manifest closure: 5/);
  assert.match(doc, /runtime packet manifest closure approvals: 0/);
  assert.match(doc, /implementation-ready packet manifest closure rows: 0/);
  assert.match(doc, /packet manifest draft closure: PACKET-MANIFEST-CHAIN-CLOSED/);
  assert.match(doc, /packet manifest implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredManifestFields) {
    assert.ok(doc.includes(field), `missing manifest field ${field}`);
  }

  const manifestShape = inlineManifestShape();
  const manifestRows = manifestShape.sections.map((section) => section.id);
  const manifestSections = manifestShape.sections.map((section) => section.section);
  const inlineFields = new Set(manifestShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(manifestShape.manifestVersion, 'packet-manifest-draft-2026-05-29');
  assert.equal(manifestShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(manifestShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(manifestShape.packetManifestPath, manifestPath);
  assert.equal(manifestShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(manifestShape.runtimeBehaviorChanged, false);
  assert.deepEqual(manifestRows, expectedManifestRows);
  assert.equal(new Set(manifestSections).size, 12);

  for (const field of requiredManifestFields) {
    assert.ok(inlineFields.has(field), `inline manifest missing field ${field}`);
  }

  for (const section of manifestShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('packet manifest path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const manifestShape = inlineManifestShape();

  assert.ok(doc.includes(manifestPath));
  assert.equal(manifestShape.packetManifestPath, manifestPath);
  assert.equal(manifestShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, manifestPath)), false, `${manifestPath} should not exist yet`);
});

test('packet manifest contract is backed by current artifact path and foundation gates', () => {
  const pathBoundary = read(sourceDocs.pathBoundary);
  const foundationPacket = read(sourceDocs.foundationPacket);
  const metricSchema = read(sourceDocs.metricSchema);
  const sourceOwner = read(sourceDocs.sourceOwner);
  const insertion = read(sourceDocs.insertion);
  const noWork = read(sourceDocs.noWork);
  const sideEffect = read(sourceDocs.sideEffect);
  const fixtureProvenance = read(sourceDocs.fixtureProvenance);
  const parityRollout = read(sourceDocs.parityRollout);

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
});

test('packet manifest authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('packet manifest contract is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization packet manifest contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(doc, /close packet manifest documentation chain now: GO/);
  assert.match(doc, /accept packet manifest closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept packet manifest closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept packet manifest closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept packet manifest closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept packet manifest closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept packet manifest closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
