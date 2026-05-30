import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_SEMANTICS_CONTRACT_GATE_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md'
];

const rows = [
  'FT-CFEFFECT-00-scope',
  'FT-CFEFFECT-01-json-duration',
  'FT-CFEFFECT-02-json-upload-date',
  'FT-CFEFFECT-03-json-uppercase',
  'FT-CFEFFECT-04-json-category',
  'FT-CFEFFECT-05-dom-category',
  'FT-CFEFFECT-06-dom-upload-date',
  'FT-CFEFFECT-07-dom-duration',
  'FT-CFEFFECT-08-dom-pending-rerun',
  'FT-CFEFFECT-09-dom-visibility-markers',
  'FT-CFEFFECT-10-bridge-background-meta',
  'FT-CFEFFECT-11-promotion-decision'
];

const productFiles = [
  'js/seed.js',
  'js/injector.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/settings_shared.js',
  'js/background.js',
  'js/io_manager.js',
  'js/state_manager.js',
  'build.js',
  'scripts/sync-native-runtime.mjs'
];

const futureAuthorityTokens = [
  'contentFilterFieldEffectManifestGate',
  'contentFilterFieldEffectManifestReport',
  'jsonFirstContentFilterEffectAuthority',
  'jsonFirstContentFilterPureDecisionReport',
  'jsonFirstContentFilterFetchSideEffectBudget',
  'domContentFilterPendingEffectBudget',
  'domContentFilterVisibilityMarkerManifest',
  'contentFilterVideoMetaFetchOwnerReport',
  'contentFilterFieldEffectRouteSurfaceMatrix',
  'contentFilterFieldEffectRollbackReport',
  'contentFilterFieldEffectPublicClaimBoundary'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function doc() {
  return read(docPath);
}

function productSource() {
  return productFiles.filter(exists).map(read).join('\n');
}

test('content-filter field-effect manifest gate is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior content-filter field-effect manifest gate/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /content-filter field-effect manifest rows: 12/);
  assert.match(text, /JSON pure decision rows: 3/);
  assert.match(text, /JSON metadata-fetch side-effect rows: 1/);
  assert.match(text, /DOM side-effect rows: 5/);
  assert.match(text, /bridge\/background metadata side-effect rows: 2/);
  assert.match(text, /JSON-first content-filter first-class approvals: 0/);
  assert.match(text, /DOM fallback content-filter deletion approvals: 0/);
  assert.match(text, /content-filter field-effect manifest approval: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `effect manifest doc does not cite ${sourceDoc}`);
  }
});

test('content-filter field-effect manifest rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-CFEFFECT-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /JSON duration\/upload-date\/uppercase pure decisions/);
  assert.match(text, /DOM fallback metadata reads, fetch scheduling, pending attrs, timers, markers/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /May call scheduleVideoMetaFetch for missing category/);
  assert.match(text, /Writes pending attrs, hidden attrs, data duration, timers, visibility/);
});

test('content-filter field-effect source facts remain pinned', () => {
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const methodGate = read('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md');

  assert.match(filterLogic, /cf\.duration && cf\.duration\.enabled/);
  assert.match(filterLogic, /cf\.uploadDate\?\.enabled/);
  assert.match(filterLogic, /cf\.uppercase\?\.enabled/);
  assert.match(filterLogic, /_checkCategoryFilters\(item, rules, rendererType\)/);
  assert.match(filterLogic, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: true \}\)/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: true, needDates: false, needCategory: false \}\)/);
  assert.match(domFallback, /element\.setAttribute\('data-filtertube-duration', String\(parsed\)\)/);
  assert.match(domFallback, /targetToHide\.setAttribute\('data-filtertube-pending-category', 'true'\)/);
  assert.match(domFallback, /targetToHide\.setAttribute\('data-filtertube-pending-upload-date', 'true'\)/);
  assert.match(domFallback, /window\.__filtertubePendingMetaRecheck/);
  assert.match(domFallback, /setTimeout\(\(\) => \{/);
  assert.match(domFallback, /nextBtn\.click\(\)/);
  assert.match(domFallback, /toggleVisibility\(targetToHide, shouldHide, hideReason, pendingMetaOnly\)/);
  assert.match(bridge, /function scheduleVideoMetaFetch\(videoId, options = null\)/);
  assert.match(bridge, /action: 'updateVideoMetaMap'/);
  assert.match(background, /request\.action === "updateVideoMetaMap"/);
  assert.match(methodGate, /dom_fallback_uploadDate_fetch_pending_side_effect/);
  assert.match(methodGate, /background_enqueueVideoMetaMapUpdate_cache_patch/);
});

test('content-filter field-effect decisions and future authorities stay NO-GO', () => {
  const text = doc();
  const source = productSource();

  for (const decision of [
    'define content-filter field-effect manifest gate: GO',
    'approve JSON-first content-filter as first-class filter authority now: NO-GO',
    'delete DOM fallback content-filter behavior now: NO-GO',
    'merge JSON and DOM category fetch ownership now: NO-GO',
    'use content-filter field effects for release/public claims now: NO-GO',
    'runtime behavior changed by this gate: no',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }
});

test('content-filter field-effect manifest remains linked to blocked promotion gates', () => {
  const text = doc();
  const semantics = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_SEMANTICS_CONTRACT_GATE_CURRENT_BEHAVIOR_2026-05-29.md');
  const parity = read('docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md');
  const cacheSpaGate = read('docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md');
  const activeWork = read('docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');

  assert.match(semantics, /content-filter field semantics contract approval: NO-GO/);
  assert.match(semantics, /Metric artifact packet, live route\/surface smoke, DOM parity, native parity, and public-claim boundary/);
  assert.match(parity, /content-filter field semantics rows: 8/);
  assert.match(cacheSpaGate, /approve JSON-first as first-class filter authority now: NO-GO/);
  assert.match(activeWork, /shared active-work authority: NO-GO/);
  assert.match(text, /Field-effect manifest artifact, route\/surface metrics, DOM parity, native parity, rollback proof, and public-claim boundary/);
});

test('content-filter field-effect manifest gate records no committed manifest artifact approval', () => {
  const text = doc();
  const manifestArtifactPaths = [
    'docs/audit/artifacts/content-filter-field-effect-manifest.json',
    'docs/audit/artifacts/content-filter-field-effect-route-surface-matrix.json',
    'docs/audit/artifacts/content-filter-field-effect-rollback-report.json'
  ];

  for (const artifactPath of manifestArtifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This gate is not a completion claim/);
  assert.match(text, /before JSON-first\s+content filters can be treated as first-class filter authority/);
  assert.match(text, /before DOM\s+fallback content-filter behavior can be removed/);
});
