import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const sourcePath = 'js/state_manager.js';

const sourceFingerprint = {
  lines: 2491,
  bytes: 99780,
  hash: '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'
};

const blockSpecs = {
  saveSettingsBroadcastPath: {
    start: "    async function saveSettings({ broadcast = true, profile = 'main' } = {}) {",
    end: '    /**\n     * Ensure settings are loaded before operations',
    startLine: 1009,
    lines: 59,
    bytes: 2677,
    hash: '1aa8b8b90ff6c1b8b85166dd87c861e248da73b7097d20eee31c8612fa98df42'
  },
  broadcastSettings: {
    start: "    function broadcastSettings(compiledSettings, profile = 'main') {",
    end: '    /**\n     * Explicitly request background to re-compile',
    startLine: 1231,
    lines: 11,
    bytes: 309,
    hash: '6db0b7fd3ba83a0cb3d83839f62240e7116fc4773cc163fcc8cf641a0c0a32a3'
  },
  requestRefresh: {
    start: "    async function requestRefresh(profile = 'main') {",
    end: '    function delay(ms) {',
    startLine: 1246,
    lines: 15,
    bytes: 486,
    hash: '8e3f649c94f43442428ed1f496fd2bb67b9032b2f97148ee5b7b08d701730c93'
  },
  kidsRequestRefreshMutations: {
    start: '    async function addKidsKeyword(word) {',
    end: '    /**\n     * Save current state to storage',
    startLine: 701,
    lines: 302,
    bytes: 11258,
    hash: '0624a8ef43c6cf6c9aadba95859bbfa4e1a9d6c722850395c30b50b941d8bdd4'
  },
  mainKeywordRequestRefreshMutations: {
    start: '    async function addKeyword(word, options = {}) {',
    end: '    /**\n     * Recompute all keywords including channel-derived ones',
    startLine: 1360,
    lines: 214,
    bytes: 8120,
    hash: '6bbc1326e9fffee88212e058cf21576c6178026a89fa2974ecb4e78e53039076'
  },
  mainChannelWhitelistRequestRefresh: {
    start: '    async function addChannel(input) {',
    end: '    async function fetchSubscribedChannelsFromImportTab',
    startLine: 1604,
    lines: 74,
    bytes: 3276,
    hash: 'f14d8bd84e43b3508cad69d694bd7725c19b771c8835d9f9a97b1e85c29ad87d'
  },
  subscriptionImportRequestRefresh: {
    start: '    async function importSubscribedChannelsToWhitelist(options = {}) {',
    end: '    /**\n     * Remove a channel from the filter list',
    startLine: 1733,
    lines: 110,
    bytes: 4533,
    hash: '8d06c99a560288097fdbd033874c84f45608ff6d9c9cbd528001e9e54759a831'
  },
  mainChannelRemoveRequestRefresh: {
    start: '    async function removeChannel(index) {',
    end: '    /**\n     * Toggle "Filter All Content"',
    startLine: 1848,
    lines: 39,
    bytes: 1391,
    hash: '28c00e8afa51209b65a867ec4a572530605a4d4973f18d6194fc9d1272bf7ec9'
  },
  syncKidsToMainRequestRefresh: {
    start: '    async function updateSetting(key, value) {',
    end: '    /**\n     * Update content filter settings',
    startLine: 2020,
    lines: 112,
    bytes: 4232,
    hash: 'ae60b767453f670b560261eaa96ed234f2edf15c0c650ee7df776fbbf05ed764'
  },
  contentCategoryRequestRefresh: {
    start: '    async function updateContentFilters(nextContentFilters) {',
    end: '    // ============================================================================\n    // THEME MANAGEMENT',
    startLine: 2137,
    lines: 104,
    bytes: 4476,
    hash: '7617559675676ed51cbf9c941d38f181e8ee2d8c788903a86233abe43c964b49'
  }
};

const expectedRefreshRows = [
  [732, 'addKidsKeyword', 'kids', 'persistKidsProfiles->requestRefresh'],
  [756, 'removeKidsKeyword', 'kids', 'persistKidsProfiles->requestRefresh'],
  [793, 'toggleKidsKeywordComments', 'kids', 'persistKidsProfiles->requestRefresh'],
  [829, 'toggleKidsKeywordExact', 'kids', 'persistKidsProfiles->requestRefresh'],
  [955, 'removeKidsChannel', 'kids', 'persistKidsProfiles->requestRefresh'],
  [990, 'toggleKidsChannelFilterAll', 'kids', 'persistKidsProfiles->requestRefresh'],
  [1395, 'addKeyword', 'main', 'persistMainProfiles->requestRefresh'],
  [1458, 'toggleKeywordComments', 'main', 'persistMainProfiles->requestRefresh'],
  [1508, 'removeKeyword', 'main', 'persistMainProfiles->requestRefresh'],
  [1554, 'toggleKeywordExact', 'main', 'persistMainProfiles->requestRefresh'],
  [1652, 'addChannel', 'main', 'backgroundPersistentAdd->requestRefresh'],
  [1824, 'importSubscribedChannelsToWhitelist', 'main', 'backgroundBatchImport->loadSettings->requestRefresh'],
  [1867, 'removeChannel', 'main', 'persistMainProfiles->requestRefresh'],
  [2115, 'updateSetting', 'main', 'syncKidsToMainProfileWrites->requestRefresh'],
  [2154, 'updateContentFilters', 'main', 'saveSettings->requestRefresh'],
  [2179, 'updateKidsContentFilters', 'kids', 'persistKidsProfiles->requestRefresh'],
  [2207, 'updateCategoryFilters', 'main', 'saveSettings->requestRefresh'],
  [2236, 'updateKidsCategoryFilters', 'kids', 'persistKidsProfiles->requestRefresh']
];

const missingAuthoritySymbols = [
  'stateManagerRequestRefreshFanoutContract',
  'stateManagerRequestRefreshCallsiteReport',
  'stateManagerDirectCompiledBroadcastPolicy',
  'stateManagerBackgroundRefreshReboundPolicy',
  'stateManagerRefreshRevisionReport',
  'stateManagerRefreshProfileScopeReport',
  'stateManagerSaveVsRefreshDecisionReport',
  'stateManagerContentCategoryRefreshBudget',
  'stateManagerKidsMutationRefreshPolicy',
  'stateManagerRefreshFanoutMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(sourcePath);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('StateManager request refresh fanout doc records audit-only boundary and source blocks', () => {
  const doc = read(docPath);
  const source = read(sourcePath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /direct compiled-settings broadcast/);
  assert.match(doc, /background force-refresh rebound/);
  assert.match(doc, /Main\/Kids\s+mutation callsites/);
  assert.match(doc, /StateManager request refresh fanout source files pinned \| 1/);
  assert.match(doc, /StateManager request refresh fanout source\/effect blocks pinned \| 10/);

  assert.equal(lineCount(source), sourceFingerprint.lines);
  assert.equal(Buffer.byteLength(source), sourceFingerprint.bytes);
  assert.equal(sha256(source), sourceFingerprint.hash);
  assert.match(
    doc,
    new RegExp(`\\| \`${sourcePath}\` \\| ${sourceFingerprint.lines.toLocaleString('en-US')} \\| ${sourceFingerprint.bytes.toLocaleString('en-US')} \\| \`${sourceFingerprint.hash}\` \\|`)
  );

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${sourcePath}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('StateManager request refresh token counts and callsite matrix remain current', () => {
  const source = read(sourcePath);
  const doc = read(docPath);
  const lines = source.split(/\r?\n/);
  const refreshCallLines = lines
    .map((line, index) => [index + 1, line.trim()])
    .filter(([, line]) => /^await requestRefresh\('(main|kids)'\);$/.test(line));

  assert.equal(refreshCallLines.length, 18);
  assert.equal(countLiteral(source, "await requestRefresh('main')"), 10);
  assert.equal(countLiteral(source, "await requestRefresh('kids')"), 8);
  assert.equal(countLiteral(source, 'broadcastSettings('), 3);
  assert.equal(countLiteral(source, 'FilterTube_ApplySettings'), 1);
  assert.equal(countLiteral(source, 'getCompiledSettings'), 1);
  assert.equal(countLiteral(source, 'forceRefresh'), 1);
  assert.equal(countLiteral(source, 'SettingsAPI.saveSettings'), 3);
  assert.equal(countLiteral(source, 'await saveSettings()'), 10);
  assert.equal(countLiteral(source, 'persistMainProfiles('), 6);
  assert.equal(countLiteral(source, 'persistKidsProfiles('), 9);
  assert.equal(countLiteral(source, 'settingsRevision'), 0);
  assert.equal(countLiteral(source, 'stateManagerRefreshFanoutReport'), 0);
  assert.equal(countLiteral(source, 'dirtyKeys'), 0);
  assert.equal(countLiteral(source, 'activeRuleDelta'), 0);
  assert.equal(countLiteral(source, 'noOpRefreshDecision'), 0);

  for (const [lineNumber, method, profile, pathLabel] of expectedRefreshRows) {
    assert.equal(lines[lineNumber - 1].trim(), `await requestRefresh('${profile}');`);
    assert.match(doc, new RegExp(`${sourcePath}:${lineNumber}:${method}:${profile}:${escapeRegExp(pathLabel)}`));
  }

  for (const [label, expected] of [
    ["selected `await requestRefresh\\('main'\\)` tokens \\| 10", 10],
    ["selected `await requestRefresh\\('kids'\\)` tokens \\| 8", 8],
    ['selected `broadcastSettings\\(` tokens \\| 3', 3],
    ['selected `settingsRevision` tokens \\| 0', 0]
  ]) {
    assert.match(doc, new RegExp(label), `missing token count ${expected}`);
  }
});

test('StateManager direct compiled broadcast and background refresh rebound are pinned', () => {
  const saveBlock = blockMetric(blockSpecs.saveSettingsBroadcastPath).block;
  const broadcastBlock = blockMetric(blockSpecs.broadcastSettings).block;
  const refreshBlock = blockMetric(blockSpecs.requestRefresh).block;

  assert.match(saveBlock, /const result = await SettingsAPI\.saveSettings\(\{/);
  assert.match(saveBlock, /if \(broadcast && result\.compiledSettings\) \{/);
  assert.match(saveBlock, /broadcastSettings\(result\.compiledSettings, profile\);/);
  assert.doesNotMatch(saveBlock, /settingsRevision|dirtyKeys|activeRuleDelta|noOpRefreshDecision/);

  assert.match(broadcastBlock, /chrome\.runtime\?\.sendMessage\(\{/);
  assert.match(broadcastBlock, /action: 'FilterTube_ApplySettings'/);
  assert.match(broadcastBlock, /settings: compiledSettings/);
  assert.match(broadcastBlock, /profile: profile/);
  assert.doesNotMatch(broadcastBlock, /backgroundOwnedRevision|stateManagerDirectCompiledBroadcastPolicy|trustedSender/);

  assert.match(refreshBlock, /action: 'getCompiledSettings'/);
  assert.match(refreshBlock, /profileType: profile/);
  assert.match(refreshBlock, /forceRefresh: true/);
  assert.match(refreshBlock, /if \(compiled && !compiled\.error\) \{/);
  assert.match(refreshBlock, /broadcastSettings\(compiled, profile\);/);
  assert.doesNotMatch(refreshBlock, /stateManagerBackgroundRefreshReboundPolicy|settingsRevision|dirtyKeys|activeRuleDelta/);
});

test('StateManager refresh fanout paths split by Main Kids mode and save-vs-refresh shape', () => {
  const kidsBlock = blockMetric(blockSpecs.kidsRequestRefreshMutations).block;
  const mainKeywordBlock = blockMetric(blockSpecs.mainKeywordRequestRefreshMutations).block;
  const mainChannelBlock = blockMetric(blockSpecs.mainChannelWhitelistRequestRefresh).block;
  const importBlock = blockMetric(blockSpecs.subscriptionImportRequestRefresh).block;
  const removeChannelBlock = blockMetric(blockSpecs.mainChannelRemoveRequestRefresh).block;
  const syncBlock = blockMetric(blockSpecs.syncKidsToMainRequestRefresh).block;
  const contentCategoryBlock = blockMetric(blockSpecs.contentCategoryRequestRefresh).block;

  assert.equal(countLiteral(kidsBlock, "await requestRefresh('kids')"), 6);
  assert.equal(countLiteral(kidsBlock, 'await persistKidsProfiles(state.kids);'), 6);
  assert.match(kidsBlock, /async function addKidsChannel\(input\)[\s\S]*await loadSettings\(\);[\s\S]*return \{ success: true, channel: response\.channel \}/);
  const addKidsChannelBlock = kidsBlock.slice(
    kidsBlock.indexOf('async function addKidsChannel(input)'),
    kidsBlock.indexOf('async function removeKidsChannel(index)')
  );
  assert.doesNotMatch(addKidsChannelBlock, /await requestRefresh\('kids'\)/);

  assert.equal(countLiteral(mainKeywordBlock, "await requestRefresh('main')"), 4);
  assert.equal(countLiteral(mainKeywordBlock, 'await saveSettings()'), 4);
  assert.match(mainKeywordBlock, /state\.mode === 'whitelist'[\s\S]*await persistMainProfiles\(/);

  assert.equal(countLiteral(mainChannelBlock, "await requestRefresh('main')"), 1);
  assert.match(mainChannelBlock, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(mainChannelBlock, /if \(state\.mode === 'whitelist'\)[\s\S]*await requestRefresh\('main'\)/);

  assert.match(importBlock, /action: 'FilterTube_BatchImportWhitelistChannels'/);
  assert.match(importBlock, /await loadSettings\(\{ notify: true \}\);/);
  assert.match(importBlock, /await requestRefresh\('main'\);/);

  assert.match(removeChannelBlock, /if \(state\.mode === 'whitelist'\)[\s\S]*await persistMainProfiles\(/);
  assert.match(removeChannelBlock, /await requestRefresh\('main'\);/);
  assert.match(removeChannelBlock, /state\.channels\.splice\(index, 1\);[\s\S]*await saveSettings\(\);/);

  assert.match(syncBlock, /if \(key === 'syncKidsToMain'\) \{/);
  assert.match(syncBlock, /await io\.saveProfilesV4\(/);
  assert.match(syncBlock, /await io\.saveProfilesV3\(profilesV3\);/);
  assert.match(syncBlock, /try \{[\s\S]*await requestRefresh\('main'\);[\s\S]*\} catch \(e\) \{/);

  assert.match(contentCategoryBlock, /async function updateContentFilters/);
  assert.match(contentCategoryBlock, /await saveSettings\(\);[\s\S]*await requestRefresh\('main'\);/);
  assert.match(contentCategoryBlock, /async function updateKidsContentFilters/);
  assert.match(contentCategoryBlock, /await persistKidsProfiles\(state\.kids\);[\s\S]*await requestRefresh\('kids'\);/);
  assert.match(contentCategoryBlock, /async function updateCategoryFilters/);
  assert.match(contentCategoryBlock, /await saveSettings\(\);[\s\S]*await requestRefresh\('main'\);/);
  assert.match(contentCategoryBlock, /async function updateKidsCategoryFilters/);
  assert.equal(countLiteral(contentCategoryBlock, "await requestRefresh('main')"), 2);
  assert.equal(countLiteral(contentCategoryBlock, "await requestRefresh('kids')"), 2);
});

test('StateManager request refresh fanout future authority symbols are absent from runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /Required Future Authority Before Behavior Changes/);
  for (const symbol of missingAuthoritySymbols) {
    assert.match(doc, new RegExp(`\\b${symbol}\\b`));
    assert.equal(runtime.includes(symbol), false, `${symbol} should be absent from product runtime source`);
  }

  for (const futureField of [
    'refreshCaller',
    'targetProfile',
    'settingsMode',
    'mutationKind',
    'persistedStorageKeys',
    'compiledPayloadSource',
    'backgroundCompileProof',
    'settingsRevisionBefore',
    'settingsRevisionAfter',
    'dirtyKeyDecision',
    'activeRuleDelta',
    'directBroadcastDecision',
    'backgroundReboundDecision',
    'domReprocessDecision',
    'seedRelayDecision',
    'noOpRefreshDecision',
    'messageWorkBudget',
    'domWorkBudget',
    'negativeWrongProfileFixture',
    'metricArtifact'
  ]) {
    assert.match(doc, new RegExp(`\\b${futureField}\\b`));
  }
});
