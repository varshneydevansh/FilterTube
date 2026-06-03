import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceDocs = {
  stopGo: 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  listMode: 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  whitelistIdentity: 'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  pendingRefresh: 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  pendingIntake: 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md',
  pendingReadiness: 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md',
  pendingSourceLocus: 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
  rightRail: 'docs/audit/FILTERTUBE_RIGHT_RAIL_WHITELIST_OBSERVER_CURRENT_BEHAVIOR_2026-05-19.md',
  ytmSelected: 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_WHITELIST_SELECTED_ROW_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  batchImport: 'docs/audit/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  transition: 'docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  settingsMode: 'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  methodGap: methodGapPath
};

const expectedReadinessIds = [
  'FT-WLREADY-00-empty-whitelist-policy',
  'FT-WLREADY-01-unresolved-identity-policy',
  'FT-WLREADY-02-list-mode-conflict-policy',
  'FT-WLREADY-03-transition-mutation-policy',
  'FT-WLREADY-04-import-dormant-mode-policy',
  'FT-WLREADY-05-pending-hide-lifecycle-policy',
  'FT-WLREADY-06-watch-right-rail-policy',
  'FT-WLREADY-07-json-dom-selected-row-parity',
  'FT-WLREADY-08-surface-parity-policy',
  'FT-WLREADY-09-metric-and-entry-gate'
];

const whitelistFamilyDocs = [
  sourceDocs.whitelistIdentity,
  sourceDocs.pendingRefresh,
  sourceDocs.pendingSourceLocus,
  sourceDocs.rightRail,
  sourceDocs.ytmSelected,
  sourceDocs.batchImport,
  'docs/audit/FILTERTUBE_IGNORED_WHITELIST_BUNDLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  docPath
];

const futureAuthorityTokens = [
  'whitelistOptimizationReadinessGapMatrix',
  'whitelistOptimizationReadinessReport',
  'whitelistFirstPatchEvidencePacket',
  'whitelistEmptyPolicyReport',
  'whitelistUnresolvedIdentityPolicyReport',
  'whitelistPendingHideLifecycleBudget',
  'whitelistSelectedRowParityReport',
  'whitelistTransitionMutationReport',
  'whitelistImportModeEffectReport',
  'whitelistSurfaceParityReport'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function productSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');
}

test('whitelist optimization readiness gap matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior readiness gap matrix/);
  assert.match(doc, /Runtime behavior is\s+unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /No whitelist optimization row is implementation-ready/);
  assert.match(doc, /Method semantic proof gap files covered: 69/);
  assert.match(doc, /Method semantic proof gap lexical callables covered: 5744/);
  assert.match(doc, /Files with complete per-callable semantic proof: 0/);
  assert.match(doc, /Lexical callables requiring semantic proof before behavior changes: 5744/);
  assert.match(doc, /not completion proof for whitelist optimization readiness/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }

  for (const whitelistDocPath of whitelistFamilyDocs) {
    const whitelistDoc = read(whitelistDocPath);
    assert.ok(whitelistDoc.includes(methodGapPath), `${whitelistDocPath} missing method gap source path`);
    assert.match(whitelistDoc, /## Method Semantic Proof Gap Boundary/, `${whitelistDocPath} missing method gap section`);
    assert.match(whitelistDoc, /method semantic proof gap files covered: 69/, `${whitelistDocPath} missing file count`);
    assert.match(whitelistDoc, /method semantic proof gap lexical callables covered: 5744/, `${whitelistDocPath} missing callable count`);
    assert.match(whitelistDoc, /files with complete per-callable semantic proof: 0/, `${whitelistDocPath} missing complete proof count`);
    assert.match(whitelistDoc, /lexical callables requiring semantic proof before behavior changes: 5744/, `${whitelistDocPath} missing required proof count`);
    assert.match(whitelistDoc, /affected callable semantic proof: NO-GO/, `${whitelistDocPath} missing affected callable NO-GO`);
    if (whitelistDocPath === sourceDocs.pendingRefresh || whitelistDocPath === sourceDocs.pendingIntake || whitelistDocPath === sourceDocs.pendingSourceLocus) {
      assert.match(whitelistDoc, /narrow runtime behavior changed: yes|Runtime behavior changed only for whitelist pending-hide mutation intake/, `${whitelistDocPath} missing narrow runtime change boundary`);
    } else {
      assert.match(whitelistDoc, /runtime behavior changed: no/, `${whitelistDocPath} missing runtime unchanged boundary`);
    }
    assert.match(whitelistDoc, /do not\s+approve runtime\s+optimization/, `${whitelistDocPath} missing approval warning`);
  }
});

test('whitelist optimization readiness rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-WLREADY-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedReadinessIds);
  assert.equal(rows.length, 10);
  assert.match(doc, /whitelist readiness gap rows: 10/);
  assert.match(doc, /implementation-ready whitelist optimization rows: 0/);
  assert.match(doc, /readiness rows requiring metric artifacts: 10/);
  assert.match(doc, /readiness rows requiring false-hide or leak proof: 10/);
  assert.match(doc, /readiness rows requiring route\/surface proof: 10/);
  assert.match(doc, /required first whitelist patch evidence classes: 12/);
  assert.match(doc, /method semantic proof gap files covered: 69/);
  assert.match(doc, /method semantic proof gap lexical callables covered: 5744/);
  assert.match(doc, /files with complete per-callable semantic proof: 0/);
  assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5744/);
  assert.match(doc, /affected callable semantic proof: NO-GO/);
});

test('whitelist readiness matrix is backed by list-mode identity pending and surface docs', () => {
  const stopGo = read(sourceDocs.stopGo);
  const listMode = read(sourceDocs.listMode);
  const whitelistIdentity = read(sourceDocs.whitelistIdentity);
  const pendingRefresh = read(sourceDocs.pendingRefresh);
  const pendingIntake = read(sourceDocs.pendingIntake);
  const pendingReadiness = read(sourceDocs.pendingReadiness);
  const pendingSourceLocus = read(sourceDocs.pendingSourceLocus);
  const rightRail = read(sourceDocs.rightRail);
  const ytmSelected = read(sourceDocs.ytmSelected);
  const batchImport = read(sourceDocs.batchImport);
  const transition = read(sourceDocs.transition);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const methodGap = read(sourceDocs.methodGap);

  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(stopGo, /Stop-now JSON-first optimization decision: NO-GO/);

  assert.match(listMode, /empty whitelist mode removes the same renderer/);
  assert.match(listMode, /unknown `listMode` falls back to blocklist/);
  assert.match(listMode, /Comment renderers bypass non-comment whitelist fail-close/);

  assert.match(whitelistIdentity, /block:no_whitelist_rules/);
  assert.match(whitelistIdentity, /block:unresolved_identity/);
  assert.match(whitelistIdentity, /allow:creator_page_whitelisted/);
  assert.match(whitelistIdentity, /Comment renderers bypass this\s+non-comment whitelist branch/);

  assert.match(pendingRefresh, /temporary false-hide state/);
  assert.match(pendingRefresh, /bounded candidate array capped at 160/);
  assert.match(pendingRefresh, /onlyWhitelistPending: true/);
  assert.match(pendingIntake, /whitelist pending intake no-work contract rows: 12/);
  assert.match(pendingIntake, /runtime whitelist pending intake patch now: GO/);
  assert.match(pendingIntake, /blocklistModeRejectsBeforeSelectorTraversal/);
  assert.match(pendingReadiness, /whitelist pending intake implementation readiness rows: 14/);
  assert.match(pendingReadiness, /prepare narrow whitelist pending-intake implementation patch: GO/);
  assert.match(pendingReadiness, /narrow runtime whitelist pending intake patch in this audit slice: GO/);
  assert.match(pendingReadiness, /required future no-work fixture names covered: 10/);
  assert.match(pendingSourceLocus, /whitelist pending intake patch source-locus rows: 12/);
  assert.match(pendingSourceLocus, /runtime source file families allowed for narrow patch: 1/);
  assert.match(pendingSourceLocus, /allowed runtime file: js\/content_bridge\.js/);
  assert.match(pendingSourceLocus, /forbidden runtime source families: 8/);
  assert.match(pendingSourceLocus, /patch source locus approval: GO/);
  assert.match(pendingSourceLocus, /narrow runtime whitelist pending intake patch in this audit slice: GO/);

  assert.match(rightRail, /current callback no longer\s+skips watch routes/);
  assert.match(rightRail, /watch-route delayed stale pass: admitted when whitelist mode remains active/);
  assert.match(rightRail, /right-rail duplicate forced refresh fanout: reduced/);
  assert.match(rightRail, /current-gap/);

  assert.match(ytmSelected, /has no selected\/current-row state/);
  assert.match(ytmSelected, /JSON\/DOM parity/);

  assert.match(batchImport, /does not switch blocklist to whitelist/);
  assert.match(batchImport, /currentMode/);

  assert.match(transition, /copyBlocklist:false/);
  assert.match(transition, /always calls `mergeAndClearBlocklistIntoWhitelist/);

  assert.match(routeSurfaceMetric, /FT-METRIC-06-empty-whitelist-main-json/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5744/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5744/);
});

test('whitelist readiness source anchors still show split runtime ownership', () => {
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  assert.match(filterLogic, /if \(listMode === 'whitelist' && !isCommentRenderer\)/);
  assert.match(filterLogic, /block:no_whitelist_rules/);
  assert.match(filterLogic, /block:unresolved_identity/);
  assert.match(filterLogic, /allow:matched_channel/);
  assert.match(filterLogic, /allow:matched_keyword/);
  assert.match(filterLogic, /allow:creator_page_whitelisted/);

  assert.match(domFallback, /if \(listMode === 'whitelist'\) return true/);
  assert.match(domFallback, /data-filtertube-whitelist-pending/);
  assert.match(domFallback, /onlyWhitelistPending/);

  assert.match(bridge, /whitelistPendingRefreshState/);
  assert.match(bridge, /WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT/);
  assert.match(bridge, /applyDOMFallback\(null, \{ preserveScroll: true, onlyWhitelistPending: true \}\)/);
  assert.match(bridge, /function installRightRailWhitelistObserver\(\)/);
  assert.match(bridge, /path\.startsWith\('\/watch'\)/);

  assert.match(background, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(background, /mergeAndClearBlocklistIntoWhitelist\(requestedProfile\)/);
  assert.match(background, /FilterTube_BatchImportWhitelistChannels/);
  assert.match(background, /currentMode/);
});

test('whitelist readiness first-patch evidence and future authority tokens are pinned', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const field of [
    'candidateId',
    'obligationId',
    'readinessId',
    'sourceLocus',
    'route',
    'surface',
    'endpoint',
    'profileType',
    'listMode',
    'ruleState',
    'positiveFixture',
    'negativeSiblingFixture',
    'metricArtifact',
    'affectedCallableIds',
    'methodSemanticProofStatus',
    'methodSemanticProofArtifact',
    'emptyWhitelistPolicy',
    'unresolvedIdentityPolicy',
    'commentWhitelistPolicy',
    'pendingHidePolicy',
    'selectedRowPolicy',
    'transitionMutationPolicy',
    'importModeEffectPolicy',
    'surfaceParityPolicy'
  ]) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing evidence field ${field}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('whitelist readiness matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const stopGo = read(sourceDocs.stopGo);
  const whitelistIdentity = read(sourceDocs.whitelistIdentity);
  const listMode = read(sourceDocs.listMode);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    stopGo,
    whitelistIdentity,
    listMode
  ]) {
    assert.match(artifact, /Whitelist optimization readiness gap matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
