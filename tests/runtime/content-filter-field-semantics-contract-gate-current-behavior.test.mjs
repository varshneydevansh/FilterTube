import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_SEMANTICS_CONTRACT_GATE_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
  'docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md'
];

const rows = [
  'FT-CFFIELD-00-contract-scope',
  'FT-CFFIELD-01-duration-json',
  'FT-CFFIELD-02-duration-dom',
  'FT-CFFIELD-03-upload-date-json',
  'FT-CFFIELD-04-upload-date-dom',
  'FT-CFFIELD-05-uppercase-json',
  'FT-CFFIELD-06-uppercase-dom',
  'FT-CFFIELD-07-category-json',
  'FT-CFFIELD-08-category-dom',
  'FT-CFFIELD-09-active-work-gates',
  'FT-CFFIELD-10-settings-ingress',
  'FT-CFFIELD-11-promotion-decision'
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
  'contentFilterFieldSemanticsContractGate',
  'contentFilterFieldSemanticsReport',
  'jsonFirstContentFilterFirstClassAuthority',
  'jsonFirstContentFilterJsonDomParityReport',
  'jsonFirstContentFilterFieldEffectManifest',
  'jsonFirstContentFilterDurationPolicy',
  'jsonFirstContentFilterUploadDatePolicy',
  'jsonFirstContentFilterUppercasePolicy',
  'jsonFirstCategoryFilterSideEffectBudget',
  'contentFilterSettingsIngressNormalizer',
  'contentFilterActiveWorkEffectAuthority',
  'contentFilterFieldSemanticsMetricArtifact'
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

test('content-filter field semantics contract gate is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior content-filter field semantics contract/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /content-filter field semantics contract rows: 12/);
  assert.match(text, /content\/category semantic callable rows already lifted into method gate: 16/);
  assert.match(text, /JSON-first content-filter first-class approvals: 0/);
  assert.match(text, /DOM fallback content-filter deletion approvals: 0/);
  assert.match(text, /settings ingress content-filter normalization approvals: 0/);
  assert.match(text, /content-filter field semantics contract approval: NO-GO/);
  assert.match(text, /not completion proof for JSON-first content-filter promotion/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `contract doc does not cite ${sourceDoc}`);
  }
});

test('content-filter field semantics rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-CFFIELD-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /settings\/import\/sync\/state payload\s+-> compiled settings contentFilters\/categoryFilters/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Admission only, not schema authority/);
  assert.match(text, /DOM metadata reads, pending markers, fetches, and restore markers/);

  for (const token of [
    'JSON duration uses extracted seconds',
    'DOM duration reads visible text',
    'JSON upload-date checks extracted timestamps',
    'DOM upload-date reads text',
    'JSON uppercase uses ASCII title heuristic',
    'DOM active-work can wake for uppercase',
    'JSON category uses `categoryFilters.enabled`',
    'DOM category reads learned category',
    'Active-work gates require exact `enabled === true`',
    'Nested objects pass through without deep content-filter schema normalization'
  ]) {
    assert.ok(text.includes(token), `missing row behavior ${token}`);
  }
});

test('content-filter field semantics source facts remain pinned', () => {
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const videoMetaDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md');
  const methodGate = read('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md');

  assert.match(filterLogic, /cf\.duration && cf\.duration\.enabled/);
  assert.match(filterLogic, /cf\.duration\.minMinutes/);
  assert.match(filterLogic, /parseRangeValue\(cf\.duration\.value\)/);
  assert.match(filterLogic, /cf\.uploadDate\?\.enabled/);
  assert.match(filterLogic, /cf\.uppercase\?\.enabled/);
  assert.match(filterLogic, /this\.settings\.categoryFilters/);
  assert.match(domFallback, /durationSettings && durationSettings\.enabled/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: true \}\)/);
  assert.match(domFallback, /settings\.categoryFilters && typeof settings\.categoryFilters === 'object'/);
  assert.match(domFallback, /categoryFilters\?\.enabled === true/);
  assert.match(domFallback, /categoryFilters\.selected/);
  assert.match(seed, /settings\.contentFilters\.duration\?\.enabled === true/);
  assert.match(injector, /settings\.contentFilters\.uploadDate\?\.enabled === true/);
  assert.match(bridge, /settings\.contentFilters\.uppercase\?\.enabled === true/);
  assert.match(settingsShared, /const sanitizedContentFilters = safeObject\(contentFilters\)/);
  assert.match(background, /compiledSettings\.contentFilters = profileContentFilters \|\| legacyContentFilters/);
  assert.match(videoMetaDoc, /content-filter field semantics rows: 8/);
  assert.match(methodGate, /selected content\/category field semantic triage rows: 16/);
});

test('content-filter field semantics decisions and future authorities stay NO-GO', () => {
  const text = doc();
  const source = productSource();

  for (const decision of [
    'define content-filter field semantics contract gate: GO',
    'approve JSON-first content-filter as first-class filter authority now: NO-GO',
    'delete DOM fallback content-filter behavior now: NO-GO',
    'merge active-work predicates into effect authority now: NO-GO',
    'normalize import/sync/state content-filter payloads now: NO-GO',
    'use content-filter semantics for release/public claims now: NO-GO',
    'continue proof-backed audit: GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }
});

test('content-filter field semantics contract remains linked to current NO-GO gates', () => {
  const text = doc();
  const readiness = read('docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md');
  const cacheSpaGate = read('docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md');
  const compiledFields = read('docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');

  assert.match(readiness, /## JSON-First Promotion Gate/);
  assert.match(readiness, /JSON-first can be a priority order only after each path\/field\/effect/);
  assert.match(readiness, /field availability remains separate\s+from effect authority/);
  assert.match(cacheSpaGate, /approve JSON-first as first-class filter authority now: NO-GO/);
  assert.match(cacheSpaGate, /route\/surface metric artifact files required: 5/);
  assert.match(compiledFields, /raw compiled\/settings field rows: 309/);
  assert.match(compiledFields, /compiledSettingsFieldRegisterAuthority/);
  assert.match(compiledFields, /compiledSettingsSchemaManifest/);
  assert.match(text, /currently pins 309 raw compiled\/settings field rows/);
  assert.match(text, /Route\/surface metric artifact, field-effect manifest, and behavior fixture packet/);
  assert.match(text, /Metric artifact packet, live route\/surface smoke, DOM parity, native parity, and public-claim boundary/);
});
