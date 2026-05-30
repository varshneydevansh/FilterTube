import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first filter readiness gate is audit-only and links current proof layers', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');

  assert.match(doc, /Status: audit-only current-behavior gate/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not implementation readiness/);
  assert.match(doc, /documented\s+JSON path, a `FILTER_RULES` path, or a consumed `rules\.<field>` value/);
  assert.match(doc, /first-class JSON filter behavior/);
  assert.match(doc, /js\/filter_logic\.js` \| 3,498 lines, 165,151 bytes/);
  assert.match(doc, /js\/seed\.js` \| 1,136 lines, 50,026 bytes/);
  assert.equal(lineCount(filterLogic), 3498);
  assert.equal(Buffer.byteLength(filterLogic), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('JSON-first readiness gate is backed by current source blockers', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const getByPath = sliceBetween(filterLogic, 'function getByPath(obj, path, defaultValue = undefined) {', 'function flattenText');
  const processData = sliceBetween(filterLogic, 'processData(data, dataName = \'unknown\') {', '// 2. THEN FILTER');
  const seedNoWork = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName) {', 'function processWithEngine(data, dataName) {');

  assert.match(getByPath, /path\.split\('\.'\)/);
  assert.doesNotMatch(getByPath, /runs\\\[0\\\]|replace\(\s*\/\\\[/);
  assert.match(read('docs/json_paths_encyclopedia.md'), /runs\[0\]\.text/);
  assert.match(filterLogic, /runs\.0\.text/);

  assert.ok(
    processData.indexOf('this._harvestChannelData(data);') < processData.indexOf('if (this.settings.enabled === false)'),
    'processData should still harvest before the disabled filtering skip'
  );
  assert.match(seedNoWork, /const mode = \(cachedSettings && cachedSettings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(seedNoWork, /if \(mode !== 'whitelist'\)/);
  assert.match(seedNoWork, /if \(mode === 'whitelist'\) return false/);
  assert.match(seed, /window\.FilterTubeEngine\.harvestOnly\(data, cachedSettings/);

  assert.match(filterLogic, /viewCountText: this\._collectTextFromPaths\(item, rules\.viewCount\)\.join\(' '\)/);
  assert.doesNotMatch(filterLogic, /_extractViewCount|viewCountThreshold|minViewCount|maxViewCount/);
  assert.match(filterLogic, /const videoId = candidate\.videoId/);
  assert.match(filterLogic, /this\.settings\.videoChannelMap\[videoId\]/);
  assert.match(filterLogic, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  for (const token of [
    '`viewCount` is metadata/search text only today',
    '`videoId` is a join key rather than channel identity',
    'Harvest work and hide/allow mutation work',
    'whitelist mode bypasses the old no-rule fast path',
    'empty whitelist remains fail-closed'
  ]) {
    assert.ok(doc.includes(token), `missing source blocker token ${token}`);
  }
});

test('JSON-first promotion matrix keeps every future gate blocked', () => {
  const doc = read(docPath);

  for (const row of [
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
    assert.match(doc, new RegExp(`\\| ${row} \\|[\\s\\S]*?\\| blocked \\|`), `missing blocked gate row ${row}`);
  }

  for (const field of [
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
    'networkBudget',
    'noWorkBudget',
    'positiveFixture',
    'negativeSiblingFixture',
    'domParity',
    'nativeParity',
    'rollbackOrRestoreProof'
  ]) {
    assert.ok(doc.includes(field), `missing first-class JSON filter field ${field}`);
  }
});

test('runtime source lacks JSON-first readiness authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstFilterReadinessGate',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstRendererCoverageDecision',
    'jsonFirstFieldEffectDecision',
    'jsonFirstRouteSurfaceReport',
    'jsonFirstListModeMatrix',
    'jsonFirstIdentityConfidenceReport',
    'jsonFirstMutationEffectReport',
    'jsonFirstCategoryFetchBudget',
    'jsonFirstNoWorkBudget',
    'jsonFirstFixtureProvenance',
    'jsonFirstDomParityReport',
    'jsonFirstNativeParityReport',
    'jsonFirstOptimizationBudget'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing runtime symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});

test('JSON-first readiness gate links the no-work optimization crosswalk without opening implementation', () => {
  const doc = read(docPath);

  assert.match(doc, /No-Work Optimization Crosswalk Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-no-work-optimization-crosswalk-current-behavior\.test\.mjs/);
  assert.match(doc, /seed fetch pass-through/);
  assert.match(doc, /seed XHR\s+pass-through/);
  assert.match(doc, /engine harvest split/);
  assert.match(doc, /DOM lifecycle gate/);
  assert.match(doc, /quick-block lifecycle\s+gate/);
  assert.match(doc, /category metadata fetch gate/);
  assert.match(doc, /metric artifact gate/);
  assert.match(doc, /does not\s+approve implementation work/);
  assert.match(doc, /parse, stringify, processData, harvest/);
  assert.match(doc, /listener, observer, timer, network fetch, storage write/);
  assert.match(doc, /DOM parity, native parity, and metric artifact proof/);
});

test('JSON-first readiness gate links the implementation locus register without opening implementation', () => {
  const doc = read(docPath);

  assert.match(doc, /Implementation Locus Register Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-implementation-locus-register-current-behavior\.test\.mjs/);
  for (const anchor of [
    'js/seed.js:263',
    'js/seed.js:383',
    'js/seed.js:666',
    'js/seed.js:757',
    'js/filter_logic.js:154',
    'js/filter_logic.js:426',
    'js/filter_logic.js:2126',
    'js/filter_logic.js:3434',
    'js/content_bridge.js:1788',
    'js/content_bridge.js:5932',
    'js/content_bridge.js:6333',
    'js/content/dom_fallback.js:1933',
    'js/content/dom_fallback.js:2487',
    'js/content/block_channel.js:1205',
    'js/content/block_channel.js:1979',
    'js/content/block_channel.js:3172'
  ]) {
    assert.ok(doc.includes(`\`${anchor}\``), `missing source anchor ${anchor}`);
  }
  assert.match(doc, /does not approve implementation work/);
  assert.match(doc, /`jsonFirstSourceLocusDecision`, `jsonFirstEndpointDecision`/);
  assert.match(doc, /`jsonFirstHarvestMutationBudget`, `jsonFirstMetadataFetchBudget`/);
  assert.match(doc, /`jsonFirstDomActiveWorkReport`, `jsonFirstMenuLifecycleBudget`/);
  assert.match(doc, /`jsonFirstQuickBlockLifecycleBudget`, and `jsonFirstMetricFixtureReport`/);
});
