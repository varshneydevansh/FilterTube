import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  'js/content/bridge_settings.js': [1113, 44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
};

const blockSpecs = {
  backgroundProfileListModeWhitelist: {
    file: 'js/background.js',
    from: 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {',
    start: '            const activeSettings = safeObject(activeProfile.settings);',
    end: '            const boolFromV4 = (key, legacyValue) => {',
    startLine: 2266,
    lines: 88,
    bytes: 5201,
    hash: 'fde880c68148975730478f0c0e768b9585168ab3e260e8f6ecd8f7fc1220f9b2'
  },
  backgroundWhitelistChannelCompiler: {
    file: 'js/background.js',
    from: 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {',
    start: '            const compileWhitelistChannels = (channels = []) => {',
    end: '            const storedChannels = shouldUseKidsProfile',
    startLine: 2467,
    lines: 65,
    bytes: 3878,
    hash: '433527aec588525d8f3747ce7ffe20b1d2d78905c6812a6fcf6703bbee507322'
  },
  bridgeNormalizeSettingsForHost: {
    file: 'js/content/bridge_settings.js',
    start: 'function normalizeSettingsForHost(settings) {',
    end: "const MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID = 'filtertube-managed-viewing-route-gate';",
    startLine: 322,
    lines: 31,
    bytes: 1404,
    hash: '5f05ac1dba540e69103fe5725ad258d203f03e72762a1cc887d8c70e847988ac'
  },
  bridgeRequestProfileGate: {
    file: 'js/content/bridge_settings.js',
    start: '        const profileType = (() => {',
    end: '                try {\n                    const debugEnabled',
    startLine: 833,
    lines: 36,
    bytes: 1758,
    hash: '713d4c00573258982f7dbf77cc451307b24a421ad8916fed859445df88fdadb8'
  },
  filterProcessSettings: {
    file: 'js/filter_logic.js',
    start: '        _processSettings(settings) {',
    end: '        /**\n         * Harvest channel ID/Handle mappings from YouTube data',
    startLine: 947,
    lines: 125,
    bytes: 6348,
    hash: '666c5725170dcd5eb01aa66cbfd27e64d33fa0ae937d1c5553665b4ede149e0f'
  },
  filterListModeIdentityAdmission: {
    file: 'js/filter_logic.js',
    start: "        _hasChannelPolicyRules(listMode = '') {",
    end: '            const title = candidate.title;',
    startLine: 1715,
    lines: 268,
    bytes: 12855,
    hash: '3de047cd70f0734c2bdcf6ae481d23a3c78fe08f3aa280c2f59680cad04761af'
  }
};

const selectedCounts = {
  'compiledSettings.listMode': 1,
  'compiledSettings.profileType': 1,
  rawWhitelistKeywords: 2,
  'compileKeywordEntries(rawWhitelistKeywords)': 1,
  rawWhitelistChannels: 2,
  'compileWhitelistChannels(rawWhitelistChannels)': 1,
  syncKidsToMain: 4,
  mainModeFromV4: 4,
  kidsModeFromV4: 4,
  __ftFromKids: 1,
  profileType: 9,
  'forceRefresh: true': 1,
  normalizeSettingsForHost: 3,
  "listMode: 'blocklist'": 2,
  'settings.whitelistKeywords': 7,
  'settings.whitelistChannels': 9,
  'processed.whitelistKeywords': 1,
  'processed.whitelistChannels': 1,
  'new RegExp': 2,
  'toLowerCase()': 17,
  _hasChannelPolicyRules: 2,
  needsChannelIdentity: 2,
  extractChannelIdentity: 2
};

const zeroPolicyCounts = [
  'settingsRevision',
  'compiledSettingsRevision',
  'compiledSettingsProfileListModeContract',
  'profileListModeDecisionReport',
  'emptyWhitelistPolicy',
  'kidsEmptyWhitelistFailOpenReport'
];

const missingRuntimeSymbols = [
  'compiledSettingsProfileListModeContract',
  'compiledSettingsProfileListModeReport',
  'compiledSettingsListModeProfileScopePolicy',
  'compiledSettingsWhitelistAssemblyReport',
  'compiledSettingsKidsEmptyWhitelistPolicy',
  'compiledSettingsBridgeNormalizationReport',
  'compiledSettingsFilterLogicConsumerParity',
  'compiledSettingsProfileListModeFixtureProvenance',
  'compiledSettingsProfileListModeMetricArtifact',
  'compiledSettingsProfileListModeRevisionPolicy'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const from = spec.from ? text.indexOf(spec.from) : 0;
  assert.notEqual(from, -1, `missing from needle: ${spec.from}`);
  const start = text.indexOf(spec.start, from);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  return Object.values(blockSpecs)
    .map((spec) => blockMetric(spec).block)
    .join('\n');
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

function normalizeForHost(hostname, settings) {
  const context = {
    location: { hostname },
    window: { __filtertubeDebug: false },
    document: { documentElement: { getAttribute: () => null } },
    console: { warn() {} }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    `${blockMetric(blockSpecs.bridgeNormalizeSettingsForHost).block}\nglobalThis.__normalizeSettingsForHost = normalizeSettingsForHost;`,
    context,
    { filename: 'bridge-normalize-settings-for-host.vm.js' }
  );
  return context.__normalizeSettingsForHost(settings);
}

function compiledWhitelistSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [{ pattern: 'Allowed Creator', flags: 'i' }],
    whitelistChannels: [{
      id: 'UCALLOWEDCHANNEL00000001',
      handle: '@AllowedCreator',
      name: 'Allowed Creator',
      customUrl: '/c/AllowedCreator'
    }],
    contentFilters: {},
    categoryFilters: {},
    videoMetaMap: { videoA: { title: 'Cached title' } },
    ...overrides
  };
}

test('compiled settings profile/list-mode assembly doc is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Compiled-settings assembly behavior is unchanged/);
  assert.match(text, /not an implementation patch/);
  assert.match(text, /compiled settings profile\/list-mode assembly source files pinned: 3/);
  assert.match(text, /compiled settings profile\/list-mode assembly source\/effect blocks pinned: 6/);
  assert.match(text, /future whitelist optimization and first-class JSON filtering/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('compiled settings profile/list-mode source/effect blocks remain pinned', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.startLine.toLocaleString('en-US')} \\| ${spec.lines} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('compiled settings profile/list-mode selected token counts remain current', () => {
  const text = doc();
  const selected = selectedSource();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drifted`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }

  for (const token of zeroPolicyCounts) {
    assert.equal(countLiteral(selected, token), 0, `${token} unexpectedly appeared`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| 0 \\|`));
  }
});

test('compiled settings profile/list-mode assembly remains source-derived', () => {
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));
  const text = doc();

  assert.match(blocks.backgroundProfileListModeWhitelist, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(blocks.backgroundProfileListModeWhitelist, /compiledSettings\.profileType = targetProfile/);
  assert.match(blocks.backgroundProfileListModeWhitelist, /compileKeywordEntries\(rawWhitelistKeywords\)/);
  assert.match(blocks.backgroundProfileListModeWhitelist, /syncKidsToMain \|\| mainModeFromV4 !== 'whitelist' \|\| kidsModeFromV4 !== 'whitelist'/);
  assert.match(blocks.backgroundProfileListModeWhitelist, /merged\.push\(\{ \.\.\.ch, __ftFromKids: true \}\)/);

  assert.match(blocks.backgroundWhitelistChannelCompiler, /const compileWhitelistChannels = \(channels = \[\]\) =>/);
  assert.match(blocks.backgroundWhitelistChannelCompiler, /collaborationGroupId/);
  assert.match(blocks.backgroundWhitelistChannelCompiler, /compiledSettings\.whitelistChannels = compileWhitelistChannels\(rawWhitelistChannels\)/);

  assert.match(blocks.bridgeNormalizeSettingsForHost, /host\.includes\('youtubekids\.com'\)/);
  assert.match(blocks.bridgeNormalizeSettingsForHost, /profile === 'kids'/);
  assert.match(blocks.bridgeNormalizeSettingsForHost, /listMode !== 'whitelist'/);
  assert.match(blocks.bridgeNormalizeSettingsForHost, /wlChannels !== 0 \|\| wlKeywords !== 0/);
  assert.match(blocks.bridgeNormalizeSettingsForHost, /return \{ \.\.\.settings, listMode: 'blocklist' \}/);

  assert.match(blocks.bridgeRequestProfileGate, /const profileType = \(\(\) =>/);
  assert.match(blocks.bridgeRequestProfileGate, /action: "getCompiledSettings", profileType, forceRefresh/);
  assert.match(blocks.bridgeRequestProfileGate, /resolvedProfile && resolvedProfile !== profileType/);
  assert.match(blocks.bridgeRequestProfileGate, /forceRefresh: true/);
  assert.match(blocks.bridgeRequestProfileGate, /normalizeSettingsForHost\(retry\)/);

  assert.match(blocks.filterProcessSettings, /filterKeywords: \[\]/);
  assert.match(blocks.filterProcessSettings, /whitelistKeywords: \[\]/);
  assert.match(blocks.filterProcessSettings, /listMode: 'blocklist'/);
  assert.match(blocks.filterProcessSettings, /processed\.whitelistKeywords = settings\.whitelistKeywords\.map/);
  assert.match(blocks.filterProcessSettings, /processed\.whitelistChannels = settings\.whitelistChannels\.map/);
  assert.match(blocks.filterProcessSettings, /new RegExp\(item\.pattern, item\.flags\)/);
  assert.match(blocks.filterProcessSettings, /id: ch\.id \? ch\.id\.toLowerCase\(\) : ''/);

  assert.match(blocks.filterListModeIdentityAdmission, /const hasWhitelistChannels = listMode === 'whitelist'/);
  assert.match(blocks.filterListModeIdentityAdmission, /const listMode = \(this\.settings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(blocks.filterListModeIdentityAdmission, /const needsChannelIdentity = this\._hasChannelPolicyRules\(listMode\)/);
  assert.match(blocks.filterListModeIdentityAdmission, /extractChannelIdentity: needsChannelIdentity/);

  assert.match(text, /a main-profile empty whitelist delivered to Kids hosts can become blocklist before reaching the main-world consumers/);
});

test('bridge host normalization fixtures remain current', () => {
  const emptyMainWhitelist = {
    profileType: 'main',
    listMode: 'whitelist',
    whitelistChannels: [],
    whitelistKeywords: [],
    marker: 'main-empty'
  };
  const kidsEmpty = normalizeForHost('www.youtubekids.com', emptyMainWhitelist);
  assert.notEqual(kidsEmpty, emptyMainWhitelist);
  assert.equal(kidsEmpty.listMode, 'blocklist');
  assert.equal(kidsEmpty.marker, 'main-empty');

  const kidsProfile = {
    profileType: 'kids',
    listMode: 'whitelist',
    whitelistChannels: [],
    whitelistKeywords: []
  };
  assert.equal(normalizeForHost('www.youtubekids.com', kidsProfile), kidsProfile);

  const mainNonEmpty = {
    profileType: 'main',
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC1' }],
    whitelistKeywords: []
  };
  assert.equal(normalizeForHost('www.youtubekids.com', mainNonEmpty), mainNonEmpty);
  assert.equal(normalizeForHost('www.youtube.com', emptyMainWhitelist), emptyMainWhitelist);
});

test('filter logic consumes compiled whitelist settings as current behavior', () => {
  const harness = loadFilterTubeEngine();
  const filter = new harness.engine.YouTubeDataFilter(compiledWhitelistSettings());

  assert.equal(filter.settings.listMode, 'whitelist');
  assert.equal(filter.settings.whitelistKeywords.length, 1);
  assert.equal(filter.settings.whitelistKeywords[0].test('allowed creator video'), true);
  assert.equal(filter.settings.whitelistChannels[0].id, 'ucallowedchannel00000001');
  assert.equal(filter.settings.whitelistChannels[0].handle, '@allowedcreator');
  assert.equal(filter.settings.whitelistChannels[0].name, 'allowed creator');
  assert.equal(filter.settings.videoMetaMap.videoA.title, 'Cached title');
  assert.equal(filter._hasChannelPolicyRules('whitelist'), true);

  const whitelistOnly = new harness.engine.YouTubeDataFilter(compiledWhitelistSettings({ filterChannels: [] }));
  assert.equal(whitelistOnly._hasChannelPolicyRules('blocklist'), false);
});

test('compiled settings profile/list-mode future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  assert.match(text, /Compiled settings profile\/list-mode assembly still needs/);
  assert.match(text, /background\/bridge\/filter parity reports/);
  assert.match(text, /explicit Kids empty-whitelist policy/);
  assert.match(text, /sync-Kids-to-main merge reports/);
  assert.match(text, /JSON-first consumer parity fixtures/);

  for (const symbol of missingRuntimeSymbols) {
    assert.match(text, new RegExp(escapeRegExp(symbol)));
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }

  assert.match(
    text,
    /No `compiledSettingsProfileListModeContract`, `compiledSettingsProfileListModeReport`, `compiledSettingsListModeProfileScopePolicy`, `compiledSettingsWhitelistAssemblyReport`, `compiledSettingsKidsEmptyWhitelistPolicy`, `compiledSettingsBridgeNormalizationReport`, `compiledSettingsFilterLogicConsumerParity`, `compiledSettingsProfileListModeFixtureProvenance`, `compiledSettingsProfileListModeMetricArtifact`, or `compiledSettingsProfileListModeRevisionPolicy` exists/
  );
});
