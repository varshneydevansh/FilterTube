import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs';
const metricSamplePath = 'docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
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

const expectedMetricSampleRows = [
  'FT-METRIC-SAMPLE-00-sample-identity',
  'FT-METRIC-SAMPLE-01-route-surface-mode',
  'FT-METRIC-SAMPLE-02-source-locus-owner',
  'FT-METRIC-SAMPLE-03-transport-counters',
  'FT-METRIC-SAMPLE-04-engine-counters',
  'FT-METRIC-SAMPLE-05-dom-lifecycle-counters',
  'FT-METRIC-SAMPLE-06-network-storage-counters',
  'FT-METRIC-SAMPLE-07-visual-decision-counters',
  'FT-METRIC-SAMPLE-08-json-dom-parity',
  'FT-METRIC-SAMPLE-09-no-work-preservation',
  'FT-METRIC-SAMPLE-10-side-effect-budget',
  'FT-METRIC-SAMPLE-11-verification-rollout'
];

const expectedMetricSampleClosureRows = [
  'FT-METRIC-SAMPLE-CLOSURE-00-sample-identity',
  'FT-METRIC-SAMPLE-CLOSURE-01-route-surface-mode',
  'FT-METRIC-SAMPLE-CLOSURE-02-source-locus-owner',
  'FT-METRIC-SAMPLE-CLOSURE-03-transport-counters',
  'FT-METRIC-SAMPLE-CLOSURE-04-engine-counters',
  'FT-METRIC-SAMPLE-CLOSURE-05-dom-lifecycle-counters',
  'FT-METRIC-SAMPLE-CLOSURE-06-network-storage-counters',
  'FT-METRIC-SAMPLE-CLOSURE-07-visual-decision-counters',
  'FT-METRIC-SAMPLE-CLOSURE-08-json-dom-parity',
  'FT-METRIC-SAMPLE-CLOSURE-09-no-work-preservation',
  'FT-METRIC-SAMPLE-CLOSURE-10-side-effect-budget',
  'FT-METRIC-SAMPLE-CLOSURE-11-verification-rollout'
];

const requiredMetricSampleFields = [
  'sampleVersion',
  'sampleId',
  'packetId',
  'candidateId',
  'bindingId',
  'obligationId',
  'manifestVersion',
  'affectedCallableIds',
  'methodSemanticProofStatus',
  'methodSemanticProofArtifact',
  'route',
  'surface',
  'endpoint',
  'profileType',
  'listMode',
  'ruleState',
  'sourceLocus',
  'sourceOwner',
  'ownerFamily',
  'callableOwnerProofStatus',
  'fetchPatched',
  'xhrPatched',
  'bodyReadCount',
  'processDataCount',
  'itemsVisited',
  'renderersRemoved',
  'domQueries',
  'observerCallbacks',
  'timerCallbacks',
  'settingsRefreshFanoutRows',
  'seedRetryDelayMs',
  'observerOwnerReturnPaths',
  'directFallbackFanoutCalls',
  'quickBlockRefreshForced',
  'domFallbackObserverRefresh',
  'identityPrefetchGate',
  'rightRailWhitelistObserverGate',
  'networkFetches',
  'storageWrites',
  'mapWrites',
  'postMessages',
  'hideMutations',
  'restoreMutations',
  'jsonRowsVisited',
  'domNodesVisited',
  'disabledPassThrough',
  'noRulePassThrough',
  'emptyListPassThrough',
  'sideEffectsObserved',
  'verificationCommand',
  'expectedTests',
  'expectedPass',
  'releaseInputExcluded',
  'publicClaimScope'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricSampleContract',
  'firstOptimizationMetricSampleReport',
  'firstOptimizationMetricSampleApproval',
  'firstOptimizationMetricSampleNoGoBoundary',
  'jsonFirstOptimizationMetricSample',
  'jsonFirstMetricSampleAuthority',
  'metricArtifactMetricSampleCollector',
  'metricArtifactMetricSampleVerification',
  'metricArtifactMetricSampleRuntimeApproval',
  'whitelistOptimizationMetricSampleBudget',
  'metricSampleDraftClosure',
  'metricSampleDraftClosureRuntimeApproval',
  'metricSampleDraftImplementationReadiness'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function inlineMetricSampleShape() {
  const doc = read(docPath);
  const match = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'missing inline metric sample JSON block');
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

test('first optimization metric sample contract is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization metric sample contract/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Reserved metric sample path: docs\/audit\/artifacts\/first-optimization\/metric-foundation\/metric-sample\.json/);
  assert.match(doc, /Committed metric sample files: 0/);
  assert.match(doc, /Runtime metric collector approval exists: no/);
  assert.match(doc, /Implementation-ready metric sample contract rows: 0/);
  assert.match(doc, /not completion proof for metric sample authority/);
  assert.match(doc, /affected callable set and method semantic proof\s+status/);
  assert.ok(doc.includes(methodGapPath), `missing method gap doc ${methodGapPath}`);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('metric sample contract rows counts and field names stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-METRIC-SAMPLE-(?!(?:CLOSURE|FANOUT))[^`]+)` \|/gm)].map((row) => row[1]);
  const closureRows = [...doc.matchAll(/^\| `(FT-METRIC-SAMPLE-CLOSURE-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedMetricSampleRows);
  assert.deepEqual(closureRows, expectedMetricSampleClosureRows);
  assert.equal(rows.length, 12);
  assert.equal(closureRows.length, 12);
  assert.match(doc, /first optimization metric sample contract rows: 12/);
  assert.match(doc, /reserved metric sample paths covered: 1/);
  assert.match(doc, /committed metric sample files: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /implementation-ready metric sample contract rows: 0/);
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
  assert.match(doc, /method semantic proof gap lexical callables covered: 5797/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5797/);
  assert.match(doc, /inline metric sample JSON sections covered: 12/);
  assert.match(doc, /inline metric sample artifact promotion decision: NO-GO/);
  assert.match(doc, /metric sample draft closure rows: 12/);
  assert.match(doc, /metric sample rows linked by closure: 12/);
  assert.match(doc, /inline metric sample JSON sections linked by closure: 12/);
  assert.match(doc, /manifest contract rows linked by sample closure: 12/);
  assert.match(doc, /artifact path boundary rows linked by sample closure: 10/);
  assert.match(doc, /foundation packet rows linked by sample closure: 12/);
  assert.match(doc, /metric schema rows linked by sample closure: 12/);
  assert.match(doc, /metric source-owner rows linked by sample closure: 12/);
  assert.match(doc, /collector readiness families linked by sample closure: 5/);
  assert.match(doc, /method semantic proof gap files linked by sample closure: 69/);
  assert.match(doc, /lexical callables linked by sample closure: 5797/);
  assert.match(doc, /runtime metric sample closure approvals: 0/);
  assert.match(doc, /implementation-ready metric sample closure rows: 0/);
  assert.match(doc, /metric sample draft closure: METRIC-SAMPLE-CHAIN-CLOSED/);
  assert.match(doc, /metric sample implementation readiness from closure: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /Settings Refresh Fanout Metric Sample Linkage Addendum/);
  assert.match(doc, /settings refresh fanout metric sample linkage rows: 9/);
  assert.match(doc, /source settings-refresh fanout rows linked: 9/);
  assert.match(doc, /inline domLifecycleCounters fanout fields linked: 8/);
  assert.match(doc, /committed metric sample files from fanout linkage: 0/);
  assert.match(doc, /runtime collector insertion from fanout linkage: NO-GO/);
  assert.match(doc, /observer\/menu\/quick pruning from fanout linkage: NO-GO/);
  assert.match(doc, /whitelist optimization from fanout linkage: NO-GO/);
  assert.match(doc, /JSON-first promotion from fanout linkage: NO-GO/);
  assert.match(doc, /runtime behavior changed by fanout linkage: no/);

  for (const field of requiredMetricSampleFields) {
    assert.ok(doc.includes(field), `missing metric sample field ${field}`);
  }

  const sampleShape = inlineMetricSampleShape();
  const sampleRows = sampleShape.sections.map((section) => section.id);
  const sampleSections = sampleShape.sections.map((section) => section.section);
  const inlineFields = new Set(sampleShape.sections.flatMap((section) => section.requiredFields));

  assert.equal(sampleShape.sampleVersion, 'metric-sample-draft-2026-05-29');
  assert.equal(sampleShape.sampleId, 'FT-METRIC-SAMPLE-DRAFT-00');
  assert.equal(sampleShape.packetId, 'FT-BIND-00-metric-artifact-foundation');
  assert.equal(sampleShape.candidateId, 'FT-OPT-CANDIDATE-00-metric-artifact-foundation');
  assert.equal(sampleShape.metricSamplePath, metricSamplePath);
  assert.equal(sampleShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(sampleShape.runtimeBehaviorChanged, false);
  assert.deepEqual(sampleRows, expectedMetricSampleRows);
  assert.equal(new Set(sampleSections).size, 12);

  for (const field of requiredMetricSampleFields) {
    assert.ok(inlineFields.has(field), `inline metric sample missing field ${field}`);
  }

  const fanoutRows = [
    'FT-METRIC-SAMPLE-FANOUT-00-main-world-post',
    'FT-METRIC-SAMPLE-FANOUT-01-seed-direct-update',
    'FT-METRIC-SAMPLE-FANOUT-02-seed-pending-retry',
    'FT-METRIC-SAMPLE-FANOUT-03-owner-return-selection',
    'FT-METRIC-SAMPLE-FANOUT-04-identity-prefetch',
    'FT-METRIC-SAMPLE-FANOUT-05-playlist-rail',
    'FT-METRIC-SAMPLE-FANOUT-06-quick-block',
    'FT-METRIC-SAMPLE-FANOUT-07-dom-fallback',
    'FT-METRIC-SAMPLE-FANOUT-08-metric-gap'
  ];
  const settingsRefreshFanoutRows = [
    'FT-SRFO-00-settings-main-world-post',
    'FT-SRFO-01-seed-direct-update',
    'FT-SRFO-02-seed-pending-retry',
    'FT-SRFO-03-owner-return-selection',
    'FT-SRFO-04-identity-prefetch-fanout',
    'FT-SRFO-05-playlist-and-rail-observers',
    'FT-SRFO-06-quick-block-refresh',
    'FT-SRFO-07-dom-fallback-observer-refresh',
    'FT-SRFO-08-metric-artifact-gap'
  ];
  const settingsRefreshReadiness = read('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md');

  for (const row of fanoutRows) {
    assert.ok(doc.includes(row), `missing metric fanout linkage row ${row}`);
  }
  for (const row of settingsRefreshFanoutRows) {
    assert.ok(doc.includes(row), `missing source fanout row ${row}`);
    assert.ok(settingsRefreshReadiness.includes(row), `settings refresh readiness doc missing ${row}`);
  }
  for (const decision of [
    'link settings-refresh fanout rows into metric sample contract now: GO',
    'accept fanout linkage as committed metric-sample.json approval now: NO-GO',
    'accept fanout linkage as runtime collector insertion approval now: NO-GO',
    'accept fanout linkage as observer/menu/quick pruning approval now: NO-GO',
    'accept fanout linkage as whitelist optimization approval now: NO-GO',
    'accept fanout linkage as JSON-first promotion approval now: NO-GO',
    'accept fanout linkage as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing fanout linkage decision ${decision}`);
  }

  for (const section of sampleShape.sections) {
    assert.ok(Array.isArray(section.requiredFields), `${section.id} missing requiredFields array`);
    assert.ok(section.requiredFields.length >= 6, `${section.id} requiredFields is too small`);
  }
});

test('metric sample path is reserved but not committed yet', () => {
  const doc = read(docPath);
  const sampleShape = inlineMetricSampleShape();

  assert.ok(doc.includes(metricSamplePath));
  assert.equal(sampleShape.metricSamplePath, metricSamplePath);
  assert.equal(sampleShape.artifactPromotionDecision, 'NO-GO');
  assert.equal(fs.existsSync(path.join(repoRoot, metricSamplePath)), false, `${metricSamplePath} should not exist yet`);
});

test('metric sample contract is backed by current manifest artifact and collector gates', () => {
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
  assert.match(methodGap, /repo-wide lexical callables: 5797/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5797/);
});

test('metric sample authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('metric sample contract is linked from audit ledgers and upstream gates', () => {
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
    assert.match(artifact, /First optimization metric sample contract addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /First optimization metric sample contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(activeGoal, /First optimization metric sample contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(objectiveLedger, /First optimization metric sample contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(trackedIndex, /First optimization metric sample contract addendum:[\s\S]*69 method semantic proof gap files covered/);
  assert.match(doc, /close metric sample documentation chain now: GO/);
  assert.match(doc, /accept metric sample closure as committed artifact approval now: NO-GO/);
  assert.match(doc, /accept metric sample closure as artifact root creation approval now: NO-GO/);
  assert.match(doc, /accept metric sample closure as runtime collector insertion approval now: NO-GO/);
  assert.match(doc, /accept metric sample closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(doc, /accept metric sample closure as whitelist optimization approval now: NO-GO/);
  assert.match(doc, /accept metric sample closure as release\/public-claim approval now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
});
