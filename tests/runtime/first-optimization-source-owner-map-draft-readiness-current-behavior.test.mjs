import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_DRAFT_READINESS_CURRENT_BEHAVIOR_2026-05-29.md';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';
const metricFoundationRoot = 'docs/audit/artifacts/first-optimization/metric-foundation';

const sourceDocs = {
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  pathBoundary: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'
};

const expectedDraftRows = [
  'FT-SOURCE-OWNER-MAP-DRAFT-00-map-identity',
  'FT-SOURCE-OWNER-MAP-DRAFT-01-artifact-binding',
  'FT-SOURCE-OWNER-MAP-DRAFT-02-source-locus-catalog',
  'FT-SOURCE-OWNER-MAP-DRAFT-03-collector-insertion-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-04-transport-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-05-engine-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-06-dom-lifecycle-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-07-network-storage-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-08-visual-diagnostic-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-09-no-work-side-effect-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-10-fixture-parity-owner',
  'FT-SOURCE-OWNER-MAP-DRAFT-11-verification-owner'
];

const upstreamContractRows = [
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

const expectedClosureRows = [
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-00-map-identity',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-01-artifact-binding',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-02-source-locus-catalog',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-03-collector-insertion-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-04-transport-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-05-engine-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-06-dom-lifecycle-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-07-network-storage-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-08-visual-diagnostic-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-09-no-work-side-effect-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-10-fixture-parity-owner',
  'FT-SOURCE-OWNER-DRAFT-CLOSURE-11-verification-owner'
];

const futureAuthorityTokens = [
  'firstOptimizationSourceOwnerMapDraftReadiness',
  'firstOptimizationSourceOwnerMapDraftReadinessReport',
  'firstOptimizationSourceOwnerMapDraftApproval',
  'sourceOwnerMapDraftArtifactPromotion',
  'metricFoundationSourceOwnerMapDraftCollector',
  'jsonFirstSourceOwnerMapDraftAuthority',
  'whitelistSourceOwnerMapDraftBudget',
  'runtimeSourceOwnerMapDraftCollector',
  'sourceOwnerMapDraftClosure',
  'sourceOwnerMapDraftClosureRuntimeApproval',
  'sourceOwnerMapDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineDraftShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline draft JSON block');
  return JSON.parse(match[1]);
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next') continue;
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  if (/\.(?:js|mjs|cjs|ts|tsx|json|html|css)$/.test(relativePath)) {
    result.push(relativePath.replaceAll(path.sep, '/'));
  }
  return result;
}

function productSource() {
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files.map((file) => read(file)).join('\n');
}

test('source owner map draft readiness proof is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior source owner map draft readiness proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /pre-artifact readiness proof/);
  assert.match(doc, /source-owner-map\.json remains absent/);
  assert.match(doc, /not completion proof for source owner map authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(fs.existsSync(path.join(repoRoot, sourceDoc)), `missing source doc on disk ${sourceDoc}`);
  }
});

test('source owner map draft readiness rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-OWNER-MAP-DRAFT-[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-SOURCE-OWNER-DRAFT-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedDraftRows);
  assert.deepEqual(closureRows, expectedClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /source owner map draft readiness rows: 12/);
  assert.match(doc, /source owner map contract rows covered: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 16/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /source-owner approval rows covered: 12/);
  assert.match(doc, /line anchors covered: 38/);
  assert.match(doc, /runtime source files covered: 14/);
  assert.match(doc, /audit\/test anchor files covered: 2/);
  assert.match(doc, /owner families covered: 10/);
  assert.match(doc, /reserved source-owner map paths covered: 1/);
  assert.match(doc, /committed reserved source-owner map files: 0/);
  assert.match(doc, /reserved metric-foundation artifact root exists: no/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready draft readiness rows: 0/);
  assert.match(doc, /inline draft JSON sections covered: 12/);
  assert.match(doc, /inline draft JSON artifact promotion decision: NO-GO/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5744/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5744/);
  assert.match(doc, /draft artifact promotion decision: NO-GO/);
  assert.match(doc, /source-owner draft closure rows: 12/);
  assert.match(doc, /source-owner draft rows linked by closure: 12/);
  assert.match(doc, /upstream contract rows linked by draft closure: 12/);
  assert.match(doc, /inline draft JSON sections linked by closure: 12/);
  assert.match(doc, /source-locus callable rows linked by draft closure: 12/);
  assert.match(doc, /source-locus fingerprint rows linked by draft closure: 16/);
  assert.match(doc, /metric source-owner rows linked by draft closure: 12/);
  assert.match(doc, /source-owner approval rows linked by draft closure: 12/);
  assert.match(doc, /runtime source-owner draft closure approvals: 0/);
  assert.match(doc, /implementation-ready source-owner draft closure rows: 0/);
  assert.match(doc, /source-owner draft closure: SOURCE-OWNER-DRAFT-CHAIN-CLOSED/);
  assert.match(doc, /source-owner draft implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);
});

test('draft readiness proof maps every upstream source owner map contract row', () => {
  const doc = read(docPath);
  const sourceOwnerContract = read(sourceDocs.sourceOwnerMapContract);
  const shape = inlineDraftShape();
  const shapeIds = shape.sections.map((section) => section.id);
  const shapeRows = shape.sections.map((section) => section.contractRow);
  const mapSections = shape.sections.map((section) => section.mapSection);

  assert.equal(shape.schemaVersion, 'source-owner-map-draft-readiness-2026-05-29');
  assert.equal(shape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.deepEqual(shapeIds, expectedDraftRows);
  assert.deepEqual(shapeRows, upstreamContractRows);
  assert.equal(new Set(mapSections).size, 12);

  for (const row of upstreamContractRows) {
    assert.ok(sourceOwnerContract.includes(row), `upstream contract missing ${row}`);
    assert.ok(doc.includes(row), `draft readiness doc missing upstream row ${row}`);
    assert.ok(shapeRows.includes(row), `inline draft shape missing upstream row ${row}`);
  }

  for (const section of shape.sections) {
    assert.ok(Array.isArray(section.requiredProof), `${section.id} missing requiredProof array`);
    assert.ok(section.requiredProof.length >= 4, `${section.id} requiredProof is too small`);
  }
});

test('draft readiness proof preserves reserved artifact absence', () => {
  const doc = read(docPath);
  const pathBoundary = read(sourceDocs.pathBoundary);
  const sourceOwnerContract = read(sourceDocs.sourceOwnerMapContract);
  const shape = inlineDraftShape();

  assert.ok(doc.includes(sourceOwnerMapPath));
  assert.equal(shape.artifactPath, sourceOwnerMapPath);
  assert.equal(shape.artifactPromotionDecision, 'NO-GO');
  assert.equal(shape.runtimeBehaviorChanged, false);
  assert.ok(pathBoundary.includes(sourceOwnerMapPath));
  assert.ok(sourceOwnerContract.includes(sourceOwnerMapPath));
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false, `${sourceOwnerMapPath} should not exist yet`);
  assert.equal(fs.existsSync(path.join(repoRoot, metricFoundationRoot)), false, `${metricFoundationRoot} should not exist yet`);
  assert.match(pathBoundary, /Committed foundation metric artifact files: 0/);
  assert.match(sourceOwnerContract, /commit source-owner-map\.json now: NO-GO/);
});

test('draft readiness source inputs preserve current no-go authority gaps', () => {
  const sourceLocusCallable = read(sourceDocs.sourceLocusCallable);
  const sourceLocusFingerprint = read(sourceDocs.sourceLocusFingerprint);
  const metricSourceOwner = read(sourceDocs.metricSourceOwner);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const methodGap = read(sourceDocs.methodGap);

  assert.match(sourceLocusCallable, /source-locus callable boundary rows: 12/);
  assert.match(sourceLocusCallable, /line anchors covered: 38/);
  assert.match(sourceLocusCallable, /runtime source files covered: 14/);
  assert.match(sourceLocusCallable, /runtime source-owner approvals: 0/);
  assert.match(sourceLocusFingerprint, /current fingerprint rows covered: 16/);
  assert.match(metricSourceOwner, /metric source-owner rows: 12/);
  assert.match(metricSourceOwner, /owner families referenced: 10/);
  assert.match(metricSourceOwner, /source-owner rows implementation-ready: 0/);
  assert.match(sourceOwnerApproval, /runtime source-owner approvals: 0/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5744/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
});

test('draft readiness authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('draft readiness proof includes ascii and mermaid flow boundaries', () => {
  const doc = read(docPath);

  assert.match(doc, /metric source-owner matrix\s+-> source owner map contract\s+-> source-locus callable anchors\s+-> source-locus file fingerprints\s+-> draft readiness proof\s+-> source-owner-map\.json remains absent/);
  assert.match(doc, /```mermaid\s+flowchart TD/);
  assert.match(doc, /Reserved source-owner-map\.json remains absent/);
  assert.match(doc, /Runtime collectors remain unapproved/);
  assert.match(doc, /write pre-artifact source owner map readiness proof: GO/);
  assert.match(doc, /commit source-owner-map\.json now: NO-GO/);
  assert.match(doc, /create reserved metric-foundation artifact root now: NO-GO/);
  assert.match(doc, /runtime metric collector insertion: NO-GO/);
  assert.match(doc, /JSON-first runtime behavior patch from this gate: NO-GO/);
  assert.match(doc, /whitelist optimization patch from this gate: NO-GO/);
  assert.match(doc, /close source-owner draft documentation chain now: GO/);
  assert.match(doc, /accept source-owner draft closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as source-owner authority approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept source-owner draft closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
