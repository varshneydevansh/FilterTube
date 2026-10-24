import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/filter_logic.js';

const fields = [
  'title',
  'description',
  'commentText',
  'channelName',
  'channelId',
  'channelHandle',
  'videoId',
  'duration',
  'publishedTime',
  'viewCount',
  'metadataRows'
];

const expectedFieldCounts = {
  "videoId": 18,
  "channelName": 5,
  "duration": 5,
  "publishedTime": 5,
  "viewCount": 1,
  "metadataRows": 10,
  "commentText": 5,
  "title": 4,
  "description": 5,
  "channelId": 2,
  "channelHandle": 4
};

const expectedMethodFieldCounts = {
  "_extractVideoId:videoId": 2,
  "_buildCandidate:channelName": 1,
  "_buildCandidate:duration": 1,
  "_buildCandidate:publishedTime": 1,
  "_buildCandidate:viewCount": 1,
  "_buildCandidate:metadataRows": 1,
  "_buildCandidate:commentText": 1,
  "_shouldBlock:commentText": 4,
  "_checkCategoryFilters:videoId": 4,
  "_checkLanguageFilters:videoId": 4,
  "_extractTitle:title": 4,
  "_extractDescription:description": 5,
  "_extractDescription:metadataRows": 5,
  "_extractDuration:videoId": 4,
  "_extractDuration:duration": 4,
  "_extractPublishedTime:videoId": 4,
  "_extractPublishedTime:publishedTime": 4,
  "_extractPublishedTime:metadataRows": 4,
  "_extractChannelInfo:channelName": 4,
  "_extractChannelInfo:channelId": 2,
  "_extractChannelInfo:channelHandle": 4
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function source() {
  return read(sourcePath);
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function methodForLine(methodStarts, lineNumber) {
  let current = '<top>';
  for (let index = 0; index < methodStarts.length - 1; index += 1) {
    if (lineNumber >= methodStarts[index].start && lineNumber < methodStarts[index + 1].start) {
      current = methodStarts[index].name;
    }
  }
  return current;
}

function ruleFieldReferenceSummary(text) {
  const lines = text.split(/\r?\n/);
  const methodStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^        ([A-Za-z0-9_$]+)\(/);
    if (match) {
      methodStarts.push({ name: match[1], start: index + 1 });
    }
  }
  methodStarts.push({ name: '<end>', start: lines.length + 1 });

  const fieldCounts = {};
  const methodFieldCounts = {};
  const consumerMethods = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const method = methodForLine(methodStarts, lineNumber);
    for (const field of fields) {
      const matches = [...lines[index].matchAll(new RegExp(`rules\\.${field}\\b`, 'g'))];
      if (matches.length === 0) continue;
      fieldCounts[field] = (fieldCounts[field] || 0) + matches.length;
      methodFieldCounts[`${method}:${field}`] = (methodFieldCounts[`${method}:${field}`] || 0) + matches.length;
      consumerMethods.add(method);
    }
  }

  return {
    fieldCounts,
    methodFieldCounts,
    consumerMethods,
    totalReferences: Object.values(fieldCounts).reduce((sum, count) => sum + count, 0)
  };
}

test('filter logic rule field effect register is audit-only and source scoped', () => {
  const text = doc();
  const sourceText = source();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not implementation readiness/);
  assert.match(text, /field-effect coverage/);
  assert.match(text, /JSON-first filtering work does not confuse/);
  assert.match(text, /source file: js\/filter_logic\.js/);
  assert.match(text, /source line count: 4536/);
  assert.match(text, /source bytes: 222044/);
  assert.match(text, /source sha256: 20c1426a56eeaa925b42d192a56699c2cfaafbc291bb7e2f583d3e5d29fc7f6c/);
  assert.equal(sourceLineCount(sourceText), 4536);
  assert.equal(Buffer.byteLength(sourceText), 222044);
  assert.equal(sha256(sourcePath), '20c1426a56eeaa925b42d192a56699c2cfaafbc291bb7e2f583d3e5d29fc7f6c');
  assert.match(text, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21\.md/);
});

test('filter logic rule field effect register pins current rules field consumers', () => {
  const text = doc();
  const summary = ruleFieldReferenceSummary(source());

  assert.deepEqual(summary.fieldCounts, expectedFieldCounts);
  assert.deepEqual(summary.methodFieldCounts, expectedMethodFieldCounts);
  assert.equal(summary.totalReferences, 64);
  assert.equal(summary.consumerMethods.size, 10);
  assert.equal(Object.keys(summary.methodFieldCounts).length, 21);

  for (const [field, count] of Object.entries(expectedFieldCounts)) {
    assert.ok(text.includes(`| \`${field}\` | ${count} |`), `missing field count for ${field}`);
  }

  for (const token of [
    'rule fields with runtime consumers: 11',
    'consumer methods with rules.<field> references: 10',
    'method-field consumer pairs: 21',
    'rules.<field> token references: 64',
    'effective runtime path rows inherited from path register: 467',
    'effective unique path literals inherited from path register: 184',
    'effective renderer-field pairs inherited from path register: 189',
    '| `_extractVideoId` | `videoId` | 2 |',
    '| `_buildCandidate` | `channelName`, `duration`, `publishedTime`, `viewCount`, `metadataRows`, `commentText` | 6 |',
    '| `_shouldBlock` | `commentText` | 4 |',
    '| `_checkCategoryFilters` | `videoId` | 4 |',
    '| `_extractTitle` | `title` | 4 |',
    '| `_extractDescription` | `description`, `metadataRows` | 10 |',
    '| `_extractDuration` | `duration`, `videoId` | 8 |',
    '| `_extractPublishedTime` | `publishedTime`, `metadataRows`, `videoId` | 12 |',
    '| `_extractChannelInfo` | `channelName`, `channelId`, `channelHandle` | 10 |'
  ]) {
    assert.ok(text.includes(token), `missing consumer token ${token}`);
  }
});

test('filter logic rule field effect register pins current behavior boundaries from source', () => {
  const text = doc();
  const sourceText = source();

  for (const token of [
    'const rules = FILTER_RULES[rendererType];',
    'const needsChannelIdentity = this._hasChannelPolicyRules(listMode);',
    'extractChannelIdentity: needsChannelIdentity',
    'const textToSearch = this._candidateSearchText(candidate);',
    'const commentText = rules.commentText ? getTextFromPaths',
    'const durationSeconds = this._extractDuration(item, rules, rendererType);',
    'const publishTimestamp = this._extractPublishedTime(item, rules, rendererType);',
    'const title = this._extractTitle(item, rules);',
    'this._harvestChannelData(data);',
    'if (this.settings.enabled === false)'
  ]) {
    assert.ok(sourceText.includes(token), `missing source token ${token}`);
  }

  const categoryBranch = sourceText.slice(sourceText.indexOf('        _checkCategoryFilters('), sourceText.indexOf('        _checkLanguageFilters('));
  assert.doesNotMatch(categoryBranch, /scheduleVideoMetaFetch/);
  assert.match(categoryBranch, /if \(!categoryRaw\) \{[\s\S]*?return false;/);

  for (const token of [
    '`title`, `description`, `commentText`, `channelName`, `duration`,',
    '`publishedTime`, `viewCount`, and `metadataRows` can enter',
    '`channelName`, `channelId`, and `channelHandle` only become channel-policy',
    '`videoId` is a join key, not channel identity',
    '`duration` and `publishedTime` can directly feed content-filter hide',
    '`viewCount` feeds an optional conservative minimum-view threshold',
    '_checkCategoryFilters()` does not schedule metadata fetches',
    '`processData()` harvests channel mappings before the `settings.enabled ===',
    'hide/allow mutation work',
    'changing view-count semantics',
    'treating JSON rule fields as native-runtime parity proof'
  ]) {
    assert.ok(text.includes(token), `missing behavior-boundary token ${token}`);
  }
});

test('runtime source lacks filter logic rule field effect authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missing of [
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
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
    assert.match(doc(), new RegExp(missing));
  }
});
