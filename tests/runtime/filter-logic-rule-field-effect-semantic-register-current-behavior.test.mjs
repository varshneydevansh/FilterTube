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
  title: 4,
  description: 5,
  commentText: 5,
  channelName: 5,
  channelId: 2,
  channelHandle: 4,
  videoId: 14,
  duration: 6,
  publishedTime: 6,
  viewCount: 2,
  metadataRows: 10
};

const expectedMethodFieldCounts = {
  '_extractVideoId:videoId': 2,
  '_buildCandidate:channelName': 1,
  '_buildCandidate:duration': 2,
  '_buildCandidate:publishedTime': 2,
  '_buildCandidate:viewCount': 2,
  '_buildCandidate:metadataRows': 1,
  '_buildCandidate:commentText': 1,
  '_shouldBlock:commentText': 4,
  '_checkCategoryFilters:videoId': 4,
  '_extractTitle:title': 4,
  '_extractDescription:description': 5,
  '_extractDescription:metadataRows': 5,
  '_extractDuration:duration': 4,
  '_extractDuration:videoId': 4,
  '_extractPublishedTime:publishedTime': 4,
  '_extractPublishedTime:metadataRows': 4,
  '_extractPublishedTime:videoId': 4,
  '_extractChannelInfo:channelName': 4,
  '_extractChannelInfo:channelId': 2,
  '_extractChannelInfo:channelHandle': 4
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
  assert.match(text, /source line count: 3652/);
  assert.match(text, /source bytes: 172174/);
  assert.match(text, /source sha256: 953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5/);
  assert.equal(sourceLineCount(sourceText), 3652);
  assert.equal(Buffer.byteLength(sourceText), 172174);
  assert.equal(sha256(sourcePath), '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5');
  assert.match(text, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21\.md/);
});

test('filter logic rule field effect register pins current rules field consumers', () => {
  const text = doc();
  const summary = ruleFieldReferenceSummary(source());

  assert.deepEqual(summary.fieldCounts, expectedFieldCounts);
  assert.deepEqual(summary.methodFieldCounts, expectedMethodFieldCounts);
  assert.equal(summary.totalReferences, 63);
  assert.equal(summary.consumerMethods.size, 9);
  assert.equal(Object.keys(summary.methodFieldCounts).length, 20);

  for (const [field, count] of Object.entries(expectedFieldCounts)) {
    assert.ok(text.includes(`| \`${field}\` | ${count} |`), `missing field count for ${field}`);
  }

  for (const token of [
    'rule fields with runtime consumers: 11',
    'consumer methods with rules.<field> references: 9',
    'method-field consumer pairs: 20',
    'rules.<field> token references: 63',
    'effective runtime path rows inherited from path register: 440',
    'effective unique path literals inherited from path register: 174',
    'effective renderer-field pairs inherited from path register: 177',
    '| `_extractVideoId` | `videoId` | 2 |',
    '| `_buildCandidate` | `channelName`, `duration`, `publishedTime`, `viewCount`, `metadataRows`, `commentText` | 9 |',
    '| `_shouldBlock` | `commentText` | 4 |',
    '| `_checkCategoryFilters` | `videoId` | 4 |',
    '| `_extractTitle` | `title` | 4 |',
    '| `_extractDescription` | `description`, `metadataRows` | 10 |',
    '| `_extractDuration` | `duration`, `videoId` | 8 |',
    '| `_extractPublishedTime` | `publishedTime`, `metadataRows`, `videoId` | 12 |',
    '| `_extractChannelInfo` | `channelName`, `channelId`, `channelHandle` | 11 |'
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
    'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true });',
    'const durationSeconds = this._extractDuration(item, rules, rendererType);',
    'const publishTimestamp = this._extractPublishedTime(item, rules, rendererType);',
    'const title = this._extractTitle(item, rules);',
    'this._harvestChannelData(data);',
    'if (this.settings.enabled === false)'
  ]) {
    assert.ok(sourceText.includes(token), `missing source token ${token}`);
  }

  for (const token of [
    '`title`, `description`, `commentText`, `channelName`, `duration`,',
    '`publishedTime`, `viewCount`, and `metadataRows` can enter',
    '`channelName`, `channelId`, and `channelHandle` only become channel-policy',
    '`videoId` is a join key, not channel identity',
    '`duration` and `publishedTime` can directly feed content-filter hide',
    '`viewCount` has no current view-count threshold predicate',
    '_checkCategoryFilters()` can schedule `scheduleVideoMetaFetch(videoId, {',
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
