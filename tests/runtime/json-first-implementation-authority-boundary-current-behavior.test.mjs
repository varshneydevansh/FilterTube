import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs';
const methodSemanticGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  readinessGate: 'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
  noWorkCrosswalk: 'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
  implementationLocus: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
  rulePath: 'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
  ruleField: 'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
  listMode: 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  whitelistDecision: 'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  contentControlIndex: 'docs/audit/FILTERTUBE_CONTENT_CONTROL_JSON_FIRST_BOUNDARY_INDEX_CURRENT_BEHAVIOR_2026-05-22.md',
  bindingMatrix: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusImplementation: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  whitelistReadiness: 'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
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
  'FT-JSON-AUTH-00-path-syntax',
  'FT-JSON-AUTH-01-renderer-ownership',
  'FT-JSON-AUTH-02-field-effect',
  'FT-JSON-AUTH-03-route-surface-scope',
  'FT-JSON-AUTH-04-list-mode-whitelist-policy',
  'FT-JSON-AUTH-05-identity-confidence',
  'FT-JSON-AUTH-06-mutation-effect',
  'FT-JSON-AUTH-07-transport-no-work',
  'FT-JSON-AUTH-08-dom-lifecycle-parity',
  'FT-JSON-AUTH-09-menu-quick-action-lifecycle',
  'FT-JSON-AUTH-10-category-metadata-fetch-budget',
  'FT-JSON-AUTH-11-metric-diagnostic-artifact',
  'FT-JSON-AUTH-12-release-rollout-boundary'
];

const expectedAnchors = [
  'js/seed.js:263',
  'js/seed.js:383',
  'js/seed.js:666',
  'js/seed.js:757',
  'js/filter_logic.js:163',
  'js/filter_logic.js:435',
  'js/filter_logic.js:2263',
  'js/filter_logic.js:3588',
  'js/content_bridge.js:1794',
  'js/content_bridge.js:6150',
  'js/content_bridge.js:6554',
  'js/content/dom_fallback.js:2117',
  'js/content/dom_fallback.js:2669',
  'js/content/block_channel.js:1212',
  'js/content/block_channel.js:1993',
  'js/content/block_channel.js:3185'
];

const expectedSourceFlowRows = [
  'json_flow_seed_active_work_gate',
  'json_flow_seed_fetch_response_owner',
  'json_flow_seed_xhr_response_owner',
  'json_flow_injector_active_work_gate',
  'json_flow_injector_processing_replay_owner',
  'json_flow_renderer_rule_owner',
  'json_flow_settings_list_mode_owner',
  'json_flow_harvest_mutation_owner',
  'json_flow_category_metadata_owner',
  'json_flow_dom_fallback_parity_owner',
  'json_flow_quick_block_action_owner',
  'json_flow_fallback_menu_action_owner'
];

const requiredContractFields = [
  'candidateId',
  'obligationId',
  'JSONAuthorityRowId',
  'sourceLocus',
  'sourceOwner',
  'rendererKey',
  'runtimePath',
  'documentedPath',
  'endpoint',
  'route',
  'surface',
  'profileType',
  'listMode',
  'ruleState',
  'fieldEffect',
  'identityConfidence',
  'allowedEffects',
  'forbiddenEffects',
  'activeJsonFields',
  'activeDomControls',
  'parseBudget',
  'stringifyBudget',
  'harvestBudget',
  'listenerBudget',
  'observerBudget',
  'timerBudget',
  'networkBudget',
  'storageBudget',
  'hideBudget',
  'restoreBudget',
  'positiveFixture',
  'negativeSiblingFixture',
  'disabledFixture',
  'emptyListFixture',
  'domParityFixture',
  'nativeParityFixture',
  'metricArtifact',
  'diagnosticPrivacy',
  'rollbackPlan',
  'releaseClaimScope'
];

const futureAuthorityTokens = [
  'jsonFirstImplementationAuthorityBoundary',
  'jsonFirstImplementationAuthorityReport',
  'jsonFirstFirstClassFilterApproval',
  'jsonFirstRuntimePromotionAuthority',
  'jsonFirstFilterPromotionGoGate',
  'jsonFirstTransportNoWorkApproval',
  'jsonFirstDomParityImplementationPacket',
  'jsonFirstWhitelistPolicyImplementationPacket',
  'jsonFirstMetricDiagnosticApproval',
  'jsonFirstReleaseRolloutApproval',
  'jsonFirstImplementationNoGoReport',
  'jsonFirstSourceFlowAuthority',
  'jsonFirstSourceFlowReport',
  'jsonFirstWorkDecisionReport',
  'jsonFirstActionParityBudget'
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

test('JSON-first implementation authority boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior JSON-first implementation authority\s+boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /codebase inspection is\s+finding concrete optimization locations/);
  assert.match(doc, /JSON-first filtering is the right\s+future direction/);
  assert.match(doc, /JSON path evidence is source evidence/);
  assert.match(doc, /not effect authority by itself/);
  assert.match(doc, /repo-wide method semantic proof gap is now part of this gate/);
  assert.match(doc, /69 tracked JS\/JSX\/MJS files, 5,697 lexical callables/);
  assert.match(doc, /0 files with complete\s+per-callable semantic proof/);
  assert.match(doc, /5,697 callables still requiring semantic proof/);
  assert.match(doc, /continue proof-backed audit: GO/);
  assertJsonFirstSourceFlowAddendum(doc);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
  assert.ok(doc.includes(methodSemanticGapPath), `missing source doc ${methodSemanticGapPath}`);
});

test('JSON-first implementation authority rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-JSON-AUTH-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 13);
  assert.match(doc, /JSON-first implementation authority boundary rows: 13/);
  assert.match(doc, /JSON-first readiness promotion rows covered: 13/);
  assert.match(doc, /JSON-first no-work optimization candidates covered: 7/);
  assert.match(doc, /JSON-first implementation source anchors covered: 16/);
  assert.match(doc, /filter logic path semantic rows covered: 440/);
  assert.match(doc, /filter logic field-effect rows covered: 11/);
  assert.match(doc, /JSON-first list-mode states covered: 6/);
  assert.match(doc, /JSON-first whitelist decision states covered: 7/);
  assert.match(doc, /content control JSON-first proof docs covered: 27/);
  assert.match(doc, /candidate-obligation binding rows covered: 10/);
  assert.match(doc, /first optimization source-locus implementation rows covered: 12/);
  assert.match(doc, /whitelist readiness gaps covered: 10/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(doc, /complete per-callable semantic proof files covered: 0/);
  assert.match(doc, /first optimization implementation readiness rows covered: 14/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /runtime JSON-first promotion authority rows: 0/);
  assert.match(doc, /runtime whitelist optimization approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /committed JSON-first metric artifacts: 0/);
  assert.match(doc, /implementation-ready JSON-first rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /not completion proof for JSON-first implementation authority/);
  assert.match(doc, /2026-05-30 Current-Source Runtime And Method Freshness Addendum/);
  assert.match(doc, /latest full runtime proof: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(doc, /current method semantic gap files: 69/);
  assert.match(doc, /current method semantic gap lexical callables: 5701/);
  assert.match(doc, /complete per-callable semantic proof files: 0/);
  assert.match(doc, /current-source JSON-first implementation readiness: NO-GO/);
  assert.match(doc, /first-class JSON closure packet required proof:/);
  assert.match(doc, /affected_callable_rows_named: required/);
  assert.match(doc, /route_surface_fixture_packet: required/);
  assert.match(doc, /blocklist_behavior_preserved: required/);
  assert.match(doc, /whitelist_behavior_preserved: required/);
  assert.match(doc, /channel_and_collaborator_behavior_preserved: required/);
  assert.match(doc, /transport_no_work_budget: required/);
  assert.match(doc, /DOM_parity_and_restore_budget: required/);
  assert.match(doc, /menu_quick_block_action_budget: required/);
  assert.match(doc, /category_metadata_fetch_budget: required/);
  assert.match(doc, /metric_artifact_and_rollout_boundary: required/);
});

test('JSON-first implementation authority contract requires first-class proof fields', () => {
  const doc = read(docPath);

  for (const anchor of expectedAnchors) {
    assert.ok(doc.includes(`\`${anchor}\``), `missing source anchor ${anchor}`);
  }

  for (const field of requiredContractFields) {
    assert.ok(doc.includes(field), `missing contract field ${field}`);
  }

  for (const decision of [
    'JSON-first runtime implementation now: NO-GO',
    'JSON-first path promotion now: NO-GO',
    'JSON-first whitelist optimization now: NO-GO',
    'JSON-first transport pass-through now: NO-GO',
    'JSON-first DOM fallback pruning now: NO-GO',
    'JSON-first menu or quick-block lifecycle pruning now: NO-GO',
    'JSON-first category metadata fetch pruning now: NO-GO',
    'JSON-first diagnostic log removal now: NO-GO',
    'JSON-first release/native/public rollout claim now: NO-GO'
  ]) {
    assert.ok(doc.includes(decision), `missing decision ${decision}`);
  }
});

function assertJsonFirstSourceFlowAddendum(doc) {
  const rows = [...doc.matchAll(/^\| `(json_flow_[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSourceFlowRows);
  assert.match(doc, /Current JSON-First Source-Flow Addendum - 2026-05-27/);
  assert.match(doc, /current JSON-first source-flow rows: 12/);
  assert.match(doc, /ASCII JSON-first source-flow diagram: present/);
  assert.match(doc, /Mermaid JSON-first source-flow diagram: present/);
  assert.match(doc, /current JSON-first source-flow proof: PARTIAL/);
  assert.match(doc, /runtime JSON-first implementation approvals: 0/);
  assert.match(doc, /implementation-ready JSON-first source-flow rows: 0/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /YouTube page traffic/);
  assert.match(doc, /first-class JSON implementation remains NO-GO/);

  for (const sourcePin of [
    'js/seed.js:220-260',
    'js/seed.js:666-754',
    'js/seed.js:757-971',
    'js/injector.js:171-188',
    'js/injector.js:3405-3476',
    'js/filter_logic.js:435-844',
    'js/filter_logic.js:947-1069',
    'js/filter_logic.js:3588-3619',
    'js/filter_logic.js:2263-2319',
    'js/content_bridge.js:1794-1881',
    'js/content/dom_fallback.js:2117-2184',
    'js/content_bridge.js:6420-6478',
    'js/content/block_channel.js:1212-1296',
    'js/content/block_channel.js:1993-2042',
    'js/content_bridge.js:6554-7241',
    'js/content_bridge.js:7243-7271'
  ]) {
    assert.ok(doc.includes(`\`${sourcePin}\``), `missing JSON-first source-flow pin ${sourcePin}`);
  }

  for (const requiredPhrase of [
    'seed/injector active-work gate',
    'pass through before clone/parse/replay',
    'filter_logic renderer rules',
    'harvest/map write',
    'JSON mutation',
    'category metadata fetch request',
    'DOM fallback, menu, and quick-block parity remain'
  ]) {
    assert.ok(doc.includes(requiredPhrase), `missing source-flow phrase ${requiredPhrase}`);
  }
}

test('JSON-first implementation authority is consistent with existing JSON-first blockers', () => {
  const readinessGate = read(sourceDocs.readinessGate);
  const noWorkCrosswalk = read(sourceDocs.noWorkCrosswalk);
  const implementationLocus = read(sourceDocs.implementationLocus);
  const sourceLocusImplementation = read(sourceDocs.sourceLocusImplementation);
  const whitelistReadiness = read(sourceDocs.whitelistReadiness);
  const methodSemanticGap = read(methodSemanticGapPath);

  for (const blockedGate of [
    'Normalized path syntax',
    'Renderer ownership',
    'Field-effect authority',
    'Route/surface scope',
    'List-mode semantics',
    'Identity confidence',
    'Mutation effect',
    'Category/network budget',
    'No-rule/no-work budget',
    'Fixture provenance',
    'DOM fallback parity',
    'Native parity',
    'Optimization budget'
  ]) {
    assert.match(readinessGate, new RegExp(`\\| ${blockedGate} \\|[\\s\\S]*?\\| blocked \\|`));
  }

  for (const candidate of [
    'Seed fetch pass-through',
    'Seed XHR pass-through',
    'Engine harvest split',
    'DOM lifecycle gate',
    'Quick-block lifecycle gate',
    'Category metadata fetch gate',
    'Metric artifact gate'
  ]) {
    assert.ok(noWorkCrosswalk.includes(candidate), `missing no-work candidate ${candidate}`);
  }

  for (const anchor of expectedAnchors) {
    assert.ok(implementationLocus.includes(anchor), `implementation locus missing ${anchor}`);
  }

  assert.match(sourceLocusImplementation, /source-locus implementation authority boundary rows: 12/);
  assert.match(sourceLocusImplementation, /implementation-ready source-locus implementation rows: 0/);
  assert.match(whitelistReadiness, /whitelist readiness gap rows: 10/);
  assert.match(whitelistReadiness, /implementation-ready whitelist optimization rows: 0/);
  assert.match(methodSemanticGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodSemanticGap, /repo-wide lexical callables: 5736/);
  assert.match(methodSemanticGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodSemanticGap, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(methodSemanticGap, /as the basis for a first-class JSON filter path/);
});

test('JSON-first implementation authority future symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('JSON-first implementation authority boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    readinessGate: sourceDocs.readinessGate,
    noWorkCrosswalk: sourceDocs.noWorkCrosswalk,
    implementationLocus: sourceDocs.implementationLocus,
    bindingMatrix: sourceDocs.bindingMatrix,
    sourceLocusImplementation: sourceDocs.sourceLocusImplementation,
    whitelistReadiness: sourceDocs.whitelistReadiness,
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
