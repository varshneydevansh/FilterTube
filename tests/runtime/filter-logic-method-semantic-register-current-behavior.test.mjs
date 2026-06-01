import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/filter_logic.js';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const filterLogicJsonDecisionFamilyDocs = [
  'docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_KEYWORD_MATCH_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_KEYWORD_MATCH_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_HIDE_DECISION_PIPELINE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function findBalancedBlock(source, startNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing block start ${startNeedle}`);
  const starts = lineStarts(source);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = null;

  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          start,
          braceStart,
          end: i,
          startLine: lineForIndex(starts, braceStart),
          endLine: lineForIndex(starts, i)
        };
      }
    }
  }

  assert.fail(`missing block end ${startNeedle}`);
}

function groupForMethod(row) {
  const name = row.name;
  if (['postLogToBridge', 'queueVideoChannelMapping', 'queueVideoMetaMapping'].includes(name)) return 'debugBridgeAndBatchQueues';
  if ([
    'hasAutoplayEndpointKey',
    '_extractAutoplayEndpointVideoId',
    '_autoplayEndpointCandidate',
    '_shouldBlockAutoplayEndpoint',
    '_shouldDropAutoplayEndpointSet'
  ].includes(name)) return 'autoplayEndpointFiltering';
  if (['getByPath', 'flattenText', 'getTextFromPaths', 'flattenMetadataRow', 'flattenMetadataRowsContainer', 'getMetadataRowsText'].includes(name)) return 'pathTextAndMetadataHelpers';
  if (['normalizeChannelHandle', 'findHandleInValue', 'extractChannelHandleFromPaths'].includes(name)) return 'channelHandleExtractionHelpers';
  if (['constructor', '_processSettings', '_buildChannelFilterIndex'].includes(name)) return 'constructionAndSettings';
  if (['_matchesAnyChannel', '_matchesChannel', '_hasChannelPolicyRules', '_emptyChannelInfo'].includes(name)) return 'channelMatchPolicy';
  if ([
    '_harvestBrowseEndpoint',
    '_harvestChannelData',
    '_harvestPlayerOwnerData',
    '_harvestRendererChannelMappings',
    '_harvestVideoOwnerFromRenderer',
    '_harvestFromRendererByline',
    '_registerVideoChannelMapping',
    '_registerVideoMetaMapping',
    '_registerMapping',
    '_registerCustomUrlMapping'
  ].includes(name)) return 'harvestAndMapWrites';
  if ([
    '_unwrapRendererForFiltering',
    '_paths',
    '_collectTextFromPaths',
    '_extractVideoId',
    '_extractPlaylistId',
    '_buildCandidate',
    '_candidateSearchText',
    '_regexMatches'
  ].includes(name)) return 'candidateAndRendererUnwrap';
  if (['_shouldBlock', '_checkCategoryFilters', '_checkContentFilters', '_checkUppercaseTitle'].includes(name)) return 'blockDecisionPipeline';
  if ([
    '_extractTitle',
    '_extractDescription',
    '_parseDurationToSeconds',
    '_parseAriaLabelDurationSeconds',
    '_parseRelativeTimeToTimestamp',
    '_extractDuration',
    '_extractPublishedTime',
    '_extractChannelInfo'
  ].includes(name)) return 'fieldExtractionAndParsing';
  if (['filter', 'processData', 'FilterTubeEngine.processData', 'FilterTubeEngine.harvestOnly'].includes(name)) return 'recursionAndEntrypoints';
  if (['_log', '_logWhitelistDecision'].includes(name)) return 'loggingAndDecisionTelemetry';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const source = read('js/filter_logic.js');
  const classBounds = findBalancedBlock(source, 'class YouTubeDataFilter');
  const lines = source.split(/\r?\n/);
  const rows = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^    function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) rows.push({ line: lineNumber, scope: 'topLevelFunction', name: match[1] });

    if (lineNumber > classBounds.startLine && lineNumber < classBounds.endLine) {
      match = line.match(/^        (constructor|[A-Za-z_$][\w$]*)\s*\(/);
      if (match) rows.push({ line: lineNumber, scope: 'classMethod', name: match[1] });
    }

    match = line.match(/^        ([A-Za-z_$][\w$]*): function\s*\(/);
    if (match) rows.push({ line: lineNumber, scope: 'globalInterfaceFunction', name: `FilterTubeEngine.${match[1]}` });
  });

  return rows.map(row => ({ ...row, group: groupForMethod(row) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countByName(values) {
  const out = {};
  for (const value of values) out[value] = (out[value] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sourceStats(file) {
  const text = read(file);
  return {
    bytes: readBuffer(file).length,
    sha256: sha256(file),
    splitLines: text.split(/\r?\n/).length
  };
}

function broadCallableRows() {
  const rows = [];
  const src = read(sourcePath);
  let match;
  while ((match = broadCallableRe.exec(src))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function localCallableRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  });
  return rows;
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'abcdefghijk',
    title: { runs: [{ text: 'Calm test video' }] },
    shortBylineText: {
      runs: [{
        text: 'Calm Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@calmchannel'
          }
        }
      }]
    },
    ...overrides
  };
}

function payload(renderer = videoRenderer()) {
  return { contents: [{ videoRenderer: renderer }] };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('filter logic method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/filter_logic\.js/);
  assert.match(text, /split source lines: 3653/);
  assert.match(text, /wc line count: 3652/);
  assert.match(text, /source bytes: 172174/);
  assert.match(text, /source sha256: 953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5/);
  assert.match(text, /source object\/class: YouTubeDataFilter/);
  assert.match(text, /global interface: window\.FilterTubeEngine/);
  assert.match(text, /method and entrypoint rows: 60/);
  assert.match(text, /top-level helper function declarations: 13/);
  assert.match(text, /YouTubeDataFilter class methods: 45/);
  assert.match(text, /FilterTubeEngine global interface functions: 2/);
  assert.match(text, /semantic method groups: 12/);
  assert.match(text, /repo-wide broad parser lexical callable matches: 313/);
  assert.match(text, /broad parser declaration\/inventory matches: 73/);
  assert.match(text, /semantic method rows promoted: 60/);
  assert.match(text, /local callable tokens held below method authority: 13/);
  assert.match(text, /control-flow lexical artifacts: 240/);
  assert.match(text, /file-local executable proof probes: 7/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /not completion proof for every nested local callback/);

  assert.deepEqual(sourceStats(sourcePath), {
    bytes: 172174,
    sha256: '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5',
    splitLines: 3653
  });
});

test('filter logic JSON decision family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  assert.match(methodGap, /repo-wide lexical callables: 5681/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5681/);

  assert.equal(filterLogicJsonDecisionFamilyDocs.length, 14);
  for (const familyDocPath of filterLogicJsonDecisionFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5681/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5681/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('filter logic method semantic register accounts for every current method and entrypoint row', () => {
  const rows = methodRows();

  assert.equal(rows.length, 60);
  assert.deepEqual(countBy(rows, 'scope'), {
    classMethod: 45,
    globalInterfaceFunction: 2,
    topLevelFunction: 13
  });
  assert.deepEqual(countBy(rows, 'group'), {
    autoplayEndpointFiltering: 5,
    blockDecisionPipeline: 4,
    candidateAndRendererUnwrap: 8,
    channelHandleExtractionHelpers: 3,
    channelMatchPolicy: 4,
    constructionAndSettings: 3,
    debugBridgeAndBatchQueues: 3,
    fieldExtractionAndParsing: 8,
    harvestAndMapWrites: 10,
    loggingAndDecisionTelemetry: 2,
    pathTextAndMetadataHelpers: 6,
    recursionAndEntrypoints: 4
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.scope}:${row.name}:${row.line} should be classified`);
  }
});

test('filter logic broad lexical reconciliation separates method rows from control artifacts', () => {
  const text = doc();
  const rows = methodRows();
  const localRows = localCallableRows();
  const acceptedNames = new Set([
    ...rows.map(row => row.name.replace(/^FilterTubeEngine\./, '')),
    ...localRows.map(row => row.name)
  ]);
  const broadRows = broadCallableRows();
  const artifacts = broadRows.filter(name => !acceptedNames.has(name));

  assert.equal(broadRows.length, 313);
  assert.equal(rows.length, 60);
  assert.equal(localRows.length, 13);
  assert.equal(rows.length + localRows.length, 73);
  assert.equal(artifacts.length, 240);
  assert.deepEqual(countByName(artifacts), {
    for: 59,
    if: 181
  });

  for (const token of [
    '## Lexical Callable Reconciliation',
    'js/filter_logic.js broad callable matches: 313',
    'accepted top-level helper function rows: 13',
    'accepted YouTubeDataFilter class method rows: 45',
    'accepted FilterTubeEngine global interface function rows: 2',
    'accepted local arrow callable tokens: 13',
    'accepted declaration/inventory rows total: 73',
    'rejected control-flow artifacts total: 240',
    'rejected if artifacts: 181',
    'rejected for artifacts: 59',
    'runtime behavior changed: no'
  ]) {
    assert.ok(text.includes(token), `missing lexical reconciliation token ${token}`);
  }
});

test('filter logic method semantic register preserves every source row and future proof field', () => {
  const rows = methodRows();
  const text = doc();

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.scope}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing method row ${row.scope}:${row.name}:${row.line}`
    );
  }

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'ownerRuntime',
    'callerClass',
    'triggerSurface',
    'settingsModeInput',
    'profileInput',
    'listModeInput',
    'routeOrEndpoint',
    'jsonRendererInput',
    'identitySourceTier',
    'observableSideEffects',
    'harvestOnlyBehavior',
    'disabledBehavior',
    'noRuleBehavior',
    'emptyListBehavior',
    'teardownOrFlushBoundary',
    'positiveFixture',
    'whitelistFixture',
    'negativeSiblingFixture',
    'falseHideFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('filter logic source still proves method behavior boundaries', () => {
  const source = read('js/filter_logic.js');

  assert.ok(
    source.indexOf('this._harvestChannelData(data);') < source.indexOf('if (this.settings.enabled === false)'),
    'processData should harvest before disabled filtering skip'
  );
  assert.match(source, /window\.FilterTubeEngine = \{/);
  assert.match(source, /processData: function \(data, settings, dataName = 'data'\)/);
  assert.match(source, /harvestOnly: function \(data, settings\)/);
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*FilterTube_UpdateVideoChannelMap/);
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*FilterTube_UpdateVideoMetaMap/);
  assert.match(source, /if \(listMode === 'whitelist' && !isCommentRenderer\)/);
  assert.match(source, /this\._checkContentFilters\(item, rules, rendererType\)/);
  assert.match(source, /this\._checkCategoryFilters\(item, rules, rendererType\)/);
});

test('filter logic executable proof pins entrypoint harvest list-mode keyword and content decisions', () => {
  const text = doc();

  const disabledRuntime = loadFilterTubeEngine();
  const disabledInput = payload(videoRenderer({ videoId: 'abcdeFGHI12' }));
  const disabledOutput = disabledRuntime.engine.processData(disabledInput, baseSettings({
    enabled: false,
    filterKeywords: [keyword('Calm')]
  }), 'disabled-proof');
  disabledRuntime.flushTimers();
  assert.equal(disabledOutput, disabledInput);
  assert.deepEqual(plain(disabledRuntime.messages.filter(message => message?.type === 'FilterTube_UpdateVideoChannelMap')), [{
    type: 'FilterTube_UpdateVideoChannelMap',
    payload: [{ videoId: 'abcdeFGHI12', channelId: 'UC1234567890123456789012' }],
    source: 'filter_logic'
  }]);

  const harvestRuntime = loadFilterTubeEngine();
  const harvestInput = payload(videoRenderer({ videoId: 'abcdeFGHI12' }));
  harvestRuntime.engine.harvestOnly(harvestInput, baseSettings());
  harvestRuntime.flushTimers();
  assert.deepEqual(plain(harvestInput), plain(payload(videoRenderer({ videoId: 'abcdeFGHI12' }))));
  assert.deepEqual(plain(harvestRuntime.messages.filter(message => message?.type === 'FilterTube_UpdateVideoChannelMap')), [{
    type: 'FilterTube_UpdateVideoChannelMap',
    payload: [{ videoId: 'abcdeFGHI12', channelId: 'UC1234567890123456789012' }],
    source: 'filter_logic'
  }]);

  const metaRuntime = loadFilterTubeEngine();
  metaRuntime.engine.harvestOnly({
    videoDetails: {
      videoId: 'abcdeFGHI12',
      videoOwnerChannelId: 'UC1234567890123456789012',
      lengthSeconds: '245'
    },
    microformat: {
      playerMicroformatRenderer: {
        ownerProfileUrl: 'https://www.youtube.com/@calmchannel',
        publishDate: '2026-05-01',
        uploadDate: '2026-05-02',
        category: 'Education'
      }
    }
  }, baseSettings());
  metaRuntime.flushTimers();
  assert.deepEqual(plain(metaRuntime.messages.filter(message => message?.type === 'FilterTube_UpdateVideoMetaMap')), [{
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: [{
      videoId: 'abcdeFGHI12',
      lengthSeconds: '245',
      publishDate: '2026-05-01',
      uploadDate: '2026-05-02',
      category: 'Education'
    }],
    source: 'filter_logic'
  }]);

  const emptyBlocklist = loadFilterTubeEngine().engine.processData(payload(), baseSettings(), 'empty-blocklist-proof');
  assert.deepEqual(plain(emptyBlocklist), plain(payload()));

  const keywordBlocked = loadFilterTubeEngine().engine.processData(payload(), baseSettings({
    filterKeywords: [keyword('Calm')]
  }), 'keyword-block-proof');
  assert.deepEqual(plain(keywordBlocked), { contents: [] });

  const emptyWhitelist = loadFilterTubeEngine().engine.processData(payload(), baseSettings({
    listMode: 'whitelist'
  }), 'empty-whitelist-proof');
  assert.deepEqual(plain(emptyWhitelist), { contents: [] });

  const keywordAllowed = loadFilterTubeEngine().engine.processData(payload(), baseSettings({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Calm')]
  }), 'keyword-allow-proof');
  assert.deepEqual(plain(keywordAllowed), plain(payload()));

  const channelAllowed = loadFilterTubeEngine().engine.processData(payload(), baseSettings({
    listMode: 'whitelist',
    whitelistChannels: ['UC1234567890123456789012']
  }), 'channel-allow-proof');
  assert.deepEqual(plain(channelAllowed), plain(payload()));

  const durationBlocked = loadFilterTubeEngine().engine.processData(payload(videoRenderer({
    lengthText: { simpleText: '4:00' }
  })), baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }), 'duration-proof');
  assert.deepEqual(plain(durationBlocked), { contents: [] });

  const emptyCategorySelected = loadFilterTubeEngine().engine.processData(payload(), baseSettings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }), 'empty-category-proof');
  assert.deepEqual(plain(emptyCategorySelected), plain(payload()));

  for (const token of [
    '## File-Local Executable Behavior Proof',
    'disabled harvest proof: executable',
    'harvest-only channel proof: executable',
    'harvest-only meta proof: executable',
    'blocklist keyword proof: executable',
    'whitelist fail-closed proof: executable',
    'whitelist allow proof: executable',
    'content duration proof: executable',
    'without changing runtime source'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }
});

test('runtime source lacks filter logic method semantic authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'filterLogicMethodAuthority',
    'filterLogicMethodEffectReport',
    'filterLogicNoRuleMethodBudget',
    'filterLogicHarvestMutationDecision',
    'filterLogicEntrypointContract',
    'filterLogicMethodFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
