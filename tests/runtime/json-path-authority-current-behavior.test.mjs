import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function filterRulesBlock() {
  return sliceBetween(
    read('js/filter_logic.js'),
    'const FILTER_RULES = {',
    '// ============================================================================\n    // FILTERING ENGINE'
  );
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = read(file).split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function lineOfAfterSequence(file, needles) {
  const lines = read(file).split(/\r?\n/);
  let start = 0;
  let foundIndex = -1;
  for (const needle of needles) {
    foundIndex = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
    assert.ok(foundIndex >= 0, `${file} missing sequence needle ${needle}`);
    start = foundIndex + 1;
  }
  return foundIndex + 1;
}

function assertDocIncludesRange(doc, file, startLine, endLine) {
  assert.ok(
    doc.includes(`\`${file}:${startLine}-${endLine}\``),
    `missing source pin ${file}:${startLine}-${endLine}`
  );
}

test('JSON path authority audit documents discovery/runtime split and blocked verdict', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'current-behavior proof only',
    'Runtime behavior is unchanged',
    'implementation gate remains closed',
    'jsonPathAuthority',
    'docs/json_paths_encyclopedia.md',
    'FILTER_RULES',
    'bracket-index',
    'dot-index',
    'source capture / fixture id',
    'provenance row from docs/capture to runtime rule',
    'Executable JSON Path Owner Flow Addendum - 2026-05-27',
    'executable JSON path owner rows: 8',
    'ASCII executable JSON path flow diagram: present',
    'Mermaid executable JSON path flow diagram: present',
    'JSON path source proof: PARTIAL',
    'JSON-first promotion approval from path owner flow: NO-GO',
    'JSON Path Convergence Boundary - 2026-05-30',
    'JSON path convergence rows: 10',
    'implementation-ready JSON path convergence rows: 0',
    'effective runtime path rows: 440',
    'JSON-first promotion rows blocked: 13',
    'JSON-first behavior approval: NO-GO'
  ]) {
    assert.ok(doc.includes(token), `missing audit token: ${token}`);
  }

  assertExecutableJsonPathOwnerFlowAddendum(doc);
  assertJsonPathConvergenceBoundary(doc);
});

function assertExecutableJsonPathOwnerFlowAddendum(doc) {
  const ownerRows = [
    'json_path_syntax_owner',
    'json_direct_rule_owner',
    'json_candidate_field_owner',
    'json_decision_effect_owner',
    'json_content_category_owner',
    'json_learned_map_owner',
    'json_collaboration_identity_owner',
    'json_process_export_owner'
  ];

  for (const rowId of ownerRows) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing executable JSON owner row ${rowId}`);
  }

  assert.match(doc, /documented JSON path evidence/);
  assert.match(doc, /hand-authored FILTER_RULES runtime dot paths/);
  assert.match(doc, /getByPath \/ flattenText extraction/);
  assert.match(doc, /_shouldBlock list-mode decision and processData mutation/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /FILTER_RULES dot-path rules/);
  assert.match(doc, /Learned channel and video metadata maps/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'function getByPath(obj, path, defaultValue = undefined) {'),
    lineOfAfter('js/filter_logic.js', 'function getByPath(obj, path, defaultValue = undefined) {', 'return current;') + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'function getTextFromPaths(obj, paths) {'),
    lineOfAfter('js/filter_logic.js', 'function getTextFromPaths(obj, paths) {', "return '';") + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'const FILTER_RULES = {'),
    lineOfAfter('js/filter_logic.js', 'const FILTER_RULES = {', "title: ['title.runs', 'title.simpleText']") + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_collectTextFromPaths(item, paths) {'),
    lineOfAfter('js/filter_logic.js', '_collectTextFromPaths(item, paths) {', "return '';")
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_buildCandidate(item, rendererType, wrapperRendererType = null, options = {}) {'),
    lineOfAfter('js/filter_logic.js', '_buildCandidate(item, rendererType, wrapperRendererType = null, options = {}) {', 'isStructural: WHITELIST_CONTAINER_RENDERERS.has(rendererType) || CHIP_RENDERERS.has(rendererType)') + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_shouldBlock(item, rendererType) {'),
    lineOfAfter('js/filter_logic.js', '_shouldBlock(item, rendererType) {', 'const shouldBlockByContent = this._checkContentFilters(item, rules, rendererType);')
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_checkCategoryFilters(item, rules, rendererType) {'),
    lineOfAfterSequence('js/filter_logic.js', [
      '_checkCategoryFilters(item, rules, rendererType) {',
      'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true });',
      'return false;'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_checkContentFilters(item, rules, rendererType) {'),
    lineOfAfterSequence('js/filter_logic.js', [
      '_checkContentFilters(item, rules, rendererType) {',
      'if (cf.uppercase?.enabled) {',
      'return false;'
    ]) + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'function queueVideoChannelMapping(videoId, channelId) {'),
    lineOfAfter('js/filter_logic.js', 'function queueVideoChannelMapping(videoId, channelId) {', '}, 50);')
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'const pendingVideoMetaUpdates = [];'),
    lineOfAfter('js/filter_logic.js', 'function queueVideoMetaMapping(videoId, meta) {', '}, 75);')
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'if (Array.isArray(playlistContents) && playlistContents.length > 0) {'),
    lineOfAfter('js/filter_logic.js', 'if (Array.isArray(playlistContents) && playlistContents.length > 0) {', '});') + 1
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_harvestRendererChannelMappings(root) {'),
    lineOfAfterSequence('js/filter_logic.js', [
      '_harvestRendererChannelMappings(root) {',
      'candidate = candidate.content.videoWithContextRenderer;'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', '_extractChannelInfo(item, rules) {'),
    lineOfAfterSequence('js/filter_logic.js', [
      '_extractChannelInfo(item, rules) {',
      'channelInfo.logo = lockupLogoUrl;'
    ]) + 3
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', 'processData(data, dataName = \'unknown\') {'),
    lineOfAfter('js/filter_logic.js', 'processData(data, dataName = \'unknown\') {', 'processData: function (data, settings, dataName = \'data\') {') + 2
  );

  const getByPathBlock = sliceBetween(
    read('js/filter_logic.js'),
    'function getByPath(obj, path, defaultValue = undefined) {',
    'function flattenText'
  );
  assert.match(getByPathBlock, /path\.split\('\.'\)/);
  assert.doesNotMatch(getByPathBlock, /\[\d+\]/);

  const processBlock = sliceBetween(
    read('js/filter_logic.js'),
    'processData(data, dataName = \'unknown\') {',
    '// ============================================================================\n    // GLOBAL INTERFACE'
  );
  assert.ok(processBlock.indexOf('this._harvestChannelData(data);') < processBlock.indexOf("if (this.settings.enabled === false)"));
  assert.ok(processBlock.indexOf('this.filter(data)') > processBlock.indexOf("if (this.settings.enabled === false)"));
}

function assertJsonPathConvergenceBoundary(doc) {
  const section = sliceBetween(
    doc,
    '## JSON Path Convergence Boundary - 2026-05-30',
    '## Runnable Proof'
  );

  for (const sourceInput of [
    'docs/json_paths_encyclopedia.md',
    'docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
    'tests/runtime/json-path-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(section.includes(sourceInput), `JSON path convergence boundary missing source input ${sourceInput}`);
  }

  for (const rowId of [
    'json_path_convergence_docs_not_runtime_authority',
    'json_path_convergence_syntax_boundary',
    'json_path_convergence_owner_flow',
    'json_path_convergence_runtime_coverage_classes',
    'json_path_convergence_section_index',
    'json_path_convergence_executable_rule_paths',
    'json_path_convergence_field_effect_gap',
    'json_path_convergence_json_first_promotion_gate',
    'json_path_convergence_method_dependency',
    'json_path_convergence_authority_absence'
  ]) {
    assert.ok(section.includes(rowId), `JSON path convergence boundary missing row ${rowId}`);
  }

  for (const phrase of [
    'docs/json_paths_encyclopedia.md',
    'FILTER_RULES + getByPath dot syntax',
    '440 effective runtime path rows',
    '174 effective unique path literals',
    '177 renderer-field pairs',
    '20 documented section rows',
    '5 unsupported/direct-gap section rows',
    '11 rule fields with runtime consumers',
    '13 blocked JSON-first promotion rows',
    'NO-GO until route/surface, list-mode, identity-confidence, side-effect',
    'flowchart TD',
    'JSON path behavior changes remain NO-GO',
    'JSON path convergence rows: 10',
    'implementation-ready JSON path convergence rows: 0',
    'executable JSON path owner rows: 8',
    'JSON runtime coverage classes: 5',
    'JSON section coverage rows: 20',
    'unsupported/direct-gap JSON section rows: 5',
    'JSON-first promotion rows blocked: 13',
    'method semantic complete proof files: 0',
    'runtime behavior changed by this addendum: no',
    'renderer promotion approval: NO-GO',
    'JSON-first behavior approval: NO-GO',
    'DOM fallback deletion approval: NO-GO',
    'no-work optimization approval: NO-GO',
    'whitelist/cache optimization approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(section.includes(phrase), `JSON path convergence boundary missing phrase ${phrase}`);
  }

  for (const token of [
    'jsonPathAuthority',
    'rulePathManifest',
    'jsonPathProvenance',
    'jsonRuntimeCoverageAuthority',
    'rendererFieldCoverageClass',
    'jsonFieldEffectAuthority',
    'jsonSectionCoverageDecision',
    'documentedJsonSectionAuthority',
    'jsonFirstFilterReadinessGate',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstOptimizationBudget'
  ]) {
    assert.ok(section.includes(`${token} product source symbol: absent`), `missing absent token ${token}`);
  }
}

test('product source still lacks a central JSON path authority or generated path manifest', () => {
  const source = productSource();

  for (const token of [
    'jsonPathAuthority',
    'rulePathManifest',
    'jsonPathProvenance',
    'pathTraceabilityMap',
    'jsonRuntimeCoverageAuthority',
    'rendererFieldCoverageClass',
    'jsonFieldEffectAuthority',
    'jsonSectionCoverageDecision',
    'documentedJsonSectionAuthority',
    'jsonFirstFilterReadinessGate',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstOptimizationBudget'
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`));
  }
});

test('runtime getByPath supports dot notation but not documented bracket-index notation today', () => {
  const logic = read('js/filter_logic.js');
  const getByPath = sliceBetween(logic, 'function getByPath(obj, path, defaultValue = undefined) {', 'function flattenText');
  const docs = read('docs/json_paths_encyclopedia.md');
  const rules = filterRulesBlock();

  assert.match(getByPath, /path\.split\('\.'\)/);
  assert.match(getByPath, /for \(const key of keys\)/);
  assert.match(getByPath, /!\(key in current\)/);
  assert.doesNotMatch(getByPath, /replace\(\s*\/\\\[\(\\d\+\)\\\]\//);
  assert.match(docs, /listItems\[0\]\.listItemViewModel/);
  assert.match(docs, /runs\[0\]\.text/);
  assert.match(rules, /runs\.0\.text/);
  assert.match(rules, /metadataRows\.0\.metadataParts\.0/);
});

test('json paths encyclopedia is not loaded by runtime or build code today', () => {
  const source = productSource();

  assert.ok(fs.existsSync(path.join(repoRoot, 'docs/json_paths_encyclopedia.md')));
  assert.doesNotMatch(source, /json_paths_encyclopedia\.md/);
  assert.doesNotMatch(source, /youtube_renderer_inventory\.md/);
  assert.match(read('tests/runtime/json-dom-inventory-truth-current-behavior.test.mjs'), /docs\/json_paths_encyclopedia\.md/);
});

test('FILTER_RULES is hand-authored and has no per-path provenance field today', () => {
  const rules = filterRulesBlock();

  assert.match(rules, /videoRenderer:\s*BASE_VIDEO_RULES/);
  assert.match(rules, /universalWatchCardRenderer:\s*\{/);
  assert.match(rules, /lockupViewModel:\s*\{/);
  assert.match(rules, /shortsLockupViewModel:\s*\{/);
  assert.doesNotMatch(rules, /provenance|sourceCapture|rawCapture|jsonPathSource|fixtureId/);
});

test('documented high-risk paths still include runtime unsupported or partial renderer gaps', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const rules = filterRulesBlock();

  for (const heading of [
    '### `compactPlaylistRenderer`',
    '### `searchRefinementCardRenderer`',
    '### `compactChannelRenderer`',
    '### `sharedPostRenderer`'
  ]) {
    assert.ok(docs.includes(heading), `missing documented heading: ${heading}`);
  }

  for (const renderer of [
    'compactPlaylistRenderer',
    'searchRefinementCardRenderer',
    'compactChannelRenderer',
    'postRenderer',
    'sharedPostRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer',
    'watchCardRichHeaderRenderer'
  ]) {
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${renderer}\\s*:`), `${renderer} should still lack a direct rule today`);
  }
});

test('showSheet collaborator path is documented but direct runtime extraction still uses showDialog primary scan', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const logic = read('js/filter_logic.js');
  const channelBlock = sliceBetween(logic, '_extractChannelInfo(item, rules) {', '_matchesChannel(filterChannel, channelInfo)');

  assert.match(docs, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel\.header\.panelHeaderViewModel\.title\.content/);
  assert.match(docs, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel\.content\.listViewModel\.listItems/);
  assert.match(channelBlock, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.match(channelBlock, /dialogViewModel\?\.customContent\?\.listViewModel\?\.listItems/);
  assert.doesNotMatch(channelBlock, /showSheetCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.sheetViewModel/);
});

test('existing JSON inventory tests keep documentation claims separate from runtime proof', () => {
  const truthTest = read('tests/runtime/json-dom-inventory-truth-current-behavior.test.mjs');
  const rendererGapTest = read('tests/runtime/renderer-authority-gap-current-behavior.test.mjs');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  assert.match(truthTest, /discovery maps/);
  assert.match(truthTest, /not proof that the\\s\+current runtime filters every documented renderer/);
  assert.match(rendererGapTest, /compactPlaylistRenderer is unwrapped from richItemRenderer but still has no direct FILTER_RULES entry/);
  assert.match(ledger, /Raw capture corpus boundary/);
  assert.match(ledger, /Most raw capture families remain unextracted/);
});

test('JSON path authority documents path-instance semantic coverage boundary', () => {
  const doc = read(auditDocPath);

  assert.match(doc, /JSON Path Instance Boundary/);
  assert.match(doc, /complete-codebase objective says "every JSON path"/);
  assert.match(doc, /cannot be proven\s+by counting renderer headings/);
  assert.match(doc, /documented path text/);
  assert.match(doc, /normalized runtime path syntax/);
  assert.match(doc, /renderer key and endpoint\/route family/);
  assert.match(doc, /source capture or fixture id/);
  assert.match(doc, /extraction owner: harvest, direct rule, metadata-only, DOM join, or fallback resolver/);
  assert.match(doc, /list-mode behavior: blocklist, whitelist, disabled, and empty-list states/);
  assert.match(doc, /identity confidence: UC id, handle, custom URL, display name, video id join, or unknown/);
  assert.match(doc, /mutation effect: remove renderer, preserve renderer, metadata harvest only, map write, or fetch/);
  assert.match(doc, /negative sibling-visible \/ false-hide fixture/);
  assert.match(doc, /Shorts, watch, playlist, post, collaboration, Kids, and\s+YTM surfaces/);
});

test('JSON path authority links the source-derived filter logic direct renderer rule addendum', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'Filter Logic Direct Renderer Rule Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs',
    '`js/filter_logic.js` `FILTER_RULES` object',
    '45 source declarations',
    '44 unique renderer keys',
    'duplicate `gridVideoRenderer` declarations at lines 431 and',
    '604',
    '7 `BASE_VIDEO_RULES` aliases',
    '38 object literal rules',
    '11 semantic rule groups',
    'does not prove every JSON path',
    'filterLogicDirectRuleAuthority',
    'filterLogicRendererRuleReport',
    'rendererRuleDuplicatePolicy',
    'rendererRuleFieldPathManifest',
    'rendererRuleEffectDecision',
    'rendererRuleFixtureProvenance'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic direct rule addendum token ${token}`);
  }
});

test('JSON path authority links the source-derived filter logic rule path addendum', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'Filter Logic Rule Path Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs',
    'source-derived runtime rule-path coverage',
    '9 `BASE_VIDEO_RULES` field rows',
    '27 `BASE_VIDEO_RULES` authored path rows',
    '45 `FILTER_RULES` source declarations',
    '467 `FILTER_RULES` source path rows before duplicate override',
    '494 source-authored path rows including',
    '44 effective runtime renderer keys after duplicate override',
    '6 effective `BASE_VIDEO_RULES` aliases',
    '38 effective object literal rules',
    '440 effective runtime path rows',
    '174 effective unique path literals',
    '177 effective renderer-field pairs',
    '157 effective path rows use dot numeric indexes',
    '0 use bracket numeric indexes',
    '283 use no numeric indexes',
    '0 use template path literals',
    'current executable `FILTER_RULES` path strings',
    'not documented-only encyclopedia paths',
    'filterLogicRulePathAuthority',
    'filterLogicRulePathManifest',
    'filterLogicRulePathSyntaxContract',
    'filterLogicEffectiveRendererPathReport',
    'filterLogicDuplicatePathOverridePolicy',
    'filterLogicJsonDomParityReport',
    'filterLogicPathFixtureProvenance',
    'filterLogicJsonFirstReadinessGate',
    'filterLogicPathEffectDecision',
    'filterLogicPathNoRuleBudget'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic rule path addendum token ${token}`);
  }
});

test('JSON path authority links the source-derived filter logic rule field effect addendum', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'Filter Logic Rule Field Effect Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs',
    'field-effect permission',
    '11 rule fields with runtime consumers',
    '9 consumer methods with',
    '20 method-field consumer pairs',
    '63 `rules.<field>`',
    '440 inherited effective runtime path rows',
    '174 inherited',
    '177 inherited renderer-field pairs',
    '`viewCount` has no current view-count threshold predicate',
    '`videoId` is a join',
    '`_checkCategoryFilters()` can schedule',
    '`processData()`',
    'field availability is not effect authority',
    'native runtime parity',
    'filterLogicRuleFieldEffectAuthority',
    'filterLogicRuleFieldEffectManifest',
    'filterLogicJsonPathEffectDecision',
    'filterLogicFieldConsumerReport',
    'filterLogicViewCountPredicateAuthority',
    'filterLogicCategoryFetchBudget',
    'filterLogicWhitelistFieldEffectReport',
    'filterLogicRuleFieldFixtureProvenance',
    'filterLogicRuleFieldNoWorkBudget',
    'filterLogicJsonFirstEffectGate'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic rule field effect addendum token ${token}`);
  }
});

test('JSON path authority links the JSON-first filter readiness gate addendum', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'JSON-First Readiness Gate Addendum',
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs',
    'first-class JSON',
    '13 promotion rows',
    'normalized path syntax',
    'renderer ownership',
    'field-effect authority',
    'route/surface scope',
    'list-mode semantics',
    'identity confidence',
    'mutation effect',
    'category/network',
    'no-rule/no-work',
    'fixture provenance',
    'DOM fallback parity',
    'native parity',
    'optimization budget',
    '`rendererKey`',
    '`runtimePath`',
    '`documentedPath`',
    '`fieldEffect`',
    '`identityConfidence`',
    '`positiveFixture`',
    '`negativeSiblingFixture`',
    '`rollbackOrRestoreProof`',
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
    assert.ok(doc.includes(token), `missing JSON-first readiness gate token ${token}`);
  }
});
