import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const sourcePath = 'js/background.js';
const backgroundSettingsStorageFamilyDocs = [
  'docs/audit/FILTERTUBE_BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_BACKGROUND_AUTO_BACKUP_SCHEDULER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_TRIGGER_CHAIN_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_LISTENER_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_STATE_MANAGER_STORAGE_RELOAD_ENRICHMENT_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_STORAGE_PAYLOAD_QUOTA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

const sourceFingerprint = {
  lines: 6320,
  bytes: 285103,
  hash: '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'
};

const functionStart = 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {';

const blockSpecs = {
  cacheShape: {
    start: 'let compiledSettingsCache = { main: null, kids: null };',
    end: '\nlet channelMapCache',
    startLine: 1288,
    lines: 1,
    bytes: 56,
    hash: '1036c4cba5a87cfa01e6e456e091676e8f03d64e95e8788de2ac5e875df43398'
  },
  getCompiledSettingsCacheGate: {
    start: functionStart,
    end: '\n\n    return new Promise((resolve) => {',
    startLine: 1774,
    lines: 8,
    bytes: 414,
    hash: '9f6bb35a293ebb4cdb91887529559cefe1bf00d316a1547e9ef3273b59ddeea5'
  },
  getCompiledSettingsStorageKeys: {
    from: functionStart,
    start: '        browserAPI.storage.local.get([\n',
    end: '        ], (items) => {',
    startLine: 1784,
    lines: 44,
    bytes: 1408,
    hash: '13672cc628bae23213c11257baed164f5aabbbf6d822b2fbf62fdd9b60b75f9f'
  },
  getCompiledSettingsMigrationWrite: {
    from: functionStart,
    start: '            // Persist any migrations we calculated\n',
    end: '\n\n            const storedProfilesV3',
    startLine: 2079,
    lines: 4,
    bytes: 185,
    hash: '22dc5c70ec30edfbc76170a5dab2e12d8d2872521ac5f874bb097c64292ff15f'
  },
  getCompiledSettingsCacheAssign: {
    from: functionStart,
    start: '            console.log(`FilterTube Background: Compiled ${targetProfile} settings:',
    end: 'function shouldSuppressFirstRunPromptInjectionError',
    startLine: 2555,
    lines: 10,
    bytes: 336,
    hash: '34ea84a49f14d93ccdecf3afbabb42229ff8647582820403b66bb7be56f3643b'
  },
  runtimeGetCompiledSettingsBranch: {
    start: '    } else if (action === "getCompiledSettings") {',
    end: "    } else if (action === 'FilterTube_SessionPinAuth') {",
    startLine: 3244,
    lines: 24,
    bytes: 1474,
    hash: '62d977a4fe0068a72d6703e70984af5a9a95cd7d69918e11fa6a0a6bc33f117f'
  },
  applySettingsBranch: {
    start: '    } else if (request.action === "FilterTube_ApplySettings" && request.settings) {',
    end: '    } else if (request.action === "updateChannelMap") {',
    startLine: 4395,
    lines: 28,
    bytes: 1487,
    hash: 'b585d94cc410f7acd929db780840f7cb02b44bb9819b34eb34985b713485e3d6'
  },
  storageInvalidationListener: {
    start: '// Listen for storage changes to re-compile settings\n',
    end: '/**\n * Fetch channel name and handle from YouTube by scraping the channel page',
    startLine: 4484,
    lines: 41,
    bytes: 1464,
    hash: 'e5c76f714f31a1d325385b3eaa051c0eb73e6a29ec1c69b1493cc4bb7f796de2'
  }
};

const expectedCompilerKeys = [
  'enabled',
  'filterKeywords',
  'uiKeywords',
  'filterChannels',
  'contentFilters',
  'useExactWordMatching',
  'filterKeywordsComments',
  'filterChannelsAdditionalKeywords',
  'uiChannels',
  'hideAllShorts',
  'hideAllComments',
  'filterComments',
  'hideHomeFeed',
  'hideSponsoredCards',
  'hideWatchPlaylistPanel',
  'hidePlaylistCards',
  'hideMembersOnly',
  'hideMixPlaylists',
  'hideVideoSidebar',
  'hideRecommended',
  'hideLiveChat',
  'hideVideoInfo',
  'hideVideoButtonsBar',
  'hideAskButton',
  'hideVideoChannelRow',
  'hideVideoDescription',
  'hideMerchTicketsOffers',
  'hideEndscreenVideowall',
  'hideEndscreenCards',
  'disableAutoplay',
  'disableAnnotations',
  'hideTopHeader',
  'hideNotificationBell',
  'hideExploreTrending',
  'hideMoreFromYouTube',
  'hideSubscriptions',
  'hideSearchShelves',
  'channelMap',
  'videoChannelMap',
  'videoMetaMap',
  'stats',
  'ftProfilesV3',
  'FT_PROFILES_V4_KEY'
];

const expectedInvalidationKeys = [
  'uiKeywords',
  'filterKeywords',
  'filterKeywordsComments',
  'uiChannels',
  'filterChannels',
  'contentFilters',
  'hideMembersOnly',
  'hideAllShorts',
  'hideComments',
  'filterComments',
  'hideHomeFeed',
  'hideSponsoredCards',
  'ftProfilesV3',
  'FT_PROFILES_V4_KEY'
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

function selectedSource() {
  const source = read(sourcePath);
  return Object.values(blockSpecs)
    .map((spec) => sliceBetween(source, spec).block)
    .join('\n');
}

function keyRows(block) {
  return [
    ...[...block.matchAll(/^\s*'([^']+)'[,]?$/gm)].map((match) => match[1]),
    ...Array.from({ length: countLiteral(block, 'FT_PROFILES_V4_KEY') }, () => 'FT_PROFILES_V4_KEY')
  ];
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('background compiled cache invalidation doc records audit-only boundary', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /This is not an implementation\s+patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /cache-return gates/);
  assert.match(doc, /storage read keys/);
  assert.match(doc, /caller-pushed cache updates/);
  assert.match(doc, /storage-change invalidation/);
  assert.match(doc, /background compiled cache invalidation lifecycle source files pinned \| 1/);
  assert.match(doc, /background compiled cache invalidation lifecycle source\/effect blocks pinned \| 8/);
  assert.match(doc, /compiler storage key rows \| 43/);
  assert.match(doc, /background invalidation key rows \| 14/);
  assert.match(doc, /compiler-only storage key rows \| 30/);
  assert.match(doc, /invalidation-only storage key rows \| 1/);

  assert.match(methodGap, /repo-wide lexical callables: 5701/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5701/);

  assert.equal(backgroundSettingsStorageFamilyDocs.length, 23);
  for (const familyDocPath of backgroundSettingsStorageFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5701/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5701/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    if (familyDocPath.includes('BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET')) {
      assert.match(familyDoc, /runtime behavior changed: yes, scoped to secondary addFilteredChannel list target and matching backup trigger/);
    } else {
      assert.match(familyDoc, /runtime behavior changed: no/);
    }
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('background compiled cache source fingerprint and blocks remain current', () => {
  const source = read(sourcePath);
  const doc = read(docPath);

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

test('background compiled cache token counts and key parity remain current', () => {
  const selected = selectedSource();
  const compilerKeyBlock = blockMetric(blockSpecs.getCompiledSettingsStorageKeys).block;
  const invalidationBlock = blockMetric(blockSpecs.storageInvalidationListener).block;
  const compilerKeys = keyRows(compilerKeyBlock);
  const invalidationKeys = keyRows(invalidationBlock);
  const compileOnly = compilerKeys.filter((key) => !invalidationKeys.includes(key));
  const invalidOnly = invalidationKeys.filter((key) => !compilerKeys.includes(key));
  const doc = read(docPath);

  assert.deepEqual(compilerKeys, expectedCompilerKeys);
  assert.deepEqual(invalidationKeys, expectedInvalidationKeys);
  assert.deepEqual(compileOnly, [
    'enabled',
    'useExactWordMatching',
    'filterChannelsAdditionalKeywords',
    'hideAllComments',
    'hideWatchPlaylistPanel',
    'hidePlaylistCards',
    'hideMixPlaylists',
    'hideVideoSidebar',
    'hideRecommended',
    'hideLiveChat',
    'hideVideoInfo',
    'hideVideoButtonsBar',
    'hideAskButton',
    'hideVideoChannelRow',
    'hideVideoDescription',
    'hideMerchTicketsOffers',
    'hideEndscreenVideowall',
    'hideEndscreenCards',
    'disableAutoplay',
    'disableAnnotations',
    'hideTopHeader',
    'hideNotificationBell',
    'hideExploreTrending',
    'hideMoreFromYouTube',
    'hideSubscriptions',
    'hideSearchShelves',
    'channelMap',
    'videoChannelMap',
    'videoMetaMap',
    'stats'
  ]);
  assert.deepEqual(invalidOnly, ['hideComments']);

  const counts = {
    'selected compiledSettingsCache tokens': countLiteral(selected, 'compiledSettingsCache'),
    'selected getCompiledSettings tokens': countLiteral(selected, 'getCompiledSettings'),
    'selected FilterTube_ApplySettings tokens': countLiteral(selected, 'FilterTube_ApplySettings'),
    'selected browserAPI.storage.local.get tokens': countLiteral(selected, 'browserAPI.storage.local.get'),
    'selected browserAPI.storage.local.set tokens': countLiteral(selected, 'browserAPI.storage.local.set'),
    'selected browserAPI.storage.onChanged.addListener tokens': countLiteral(selected, 'browserAPI.storage.onChanged.addListener'),
    'selected sendMessageToTabQuietly tokens': countLiteral(selected, 'sendMessageToTabQuietly'),
    'selected forceRefresh tokens': countLiteral(selected, 'forceRefresh'),
    'selected request.settings tokens': countLiteral(selected, 'request.settings'),
    'selected compiledSettingsRevision tokens': countLiteral(selected, 'compiledSettingsRevision'),
    'selected cacheInvalidationReport tokens': countLiteral(selected, 'cacheInvalidationReport'),
    'selected isTrustedUiSender tokens': countLiteral(selected, 'isTrustedUiSender'),
    'selected channelMap tokens': countLiteral(selected, 'channelMap'),
    'selected videoChannelMap tokens': countLiteral(selected, 'videoChannelMap'),
    'selected videoMetaMap tokens': countLiteral(selected, 'videoMetaMap'),
    'selected contentFilters tokens': countLiteral(selected, 'contentFilters'),
    'selected categoryFilters tokens': countLiteral(selected, 'categoryFilters'),
    'selected hideRecommended tokens': countLiteral(selected, 'hideRecommended'),
    'selected hideAskButton tokens': countLiteral(selected, 'hideAskButton'),
    'selected hideAllComments tokens': countLiteral(selected, 'hideAllComments'),
    'selected hideComments tokens': countLiteral(selected, 'hideComments'),
    'selected clearTimeout tokens': countLiteral(selected, 'clearTimeout'),
    'selected removeListener tokens': countLiteral(selected, 'removeListener'),
    'compiler storage key rows': compilerKeys.length,
    'background invalidation key rows': invalidationKeys.length,
    'compiler-only storage key rows': compileOnly.length,
    'invalidation-only storage key rows': invalidOnly.length
  };

  assert.deepEqual(counts, {
    'selected compiledSettingsCache tokens': 11,
    'selected getCompiledSettings tokens': 8,
    'selected FilterTube_ApplySettings tokens': 2,
    'selected browserAPI.storage.local.get tokens': 1,
    'selected browserAPI.storage.local.set tokens': 1,
    'selected browserAPI.storage.onChanged.addListener tokens': 1,
    'selected sendMessageToTabQuietly tokens': 1,
    'selected forceRefresh tokens': 5,
    'selected request.settings tokens': 1,
    'selected compiledSettingsRevision tokens': 0,
    'selected cacheInvalidationReport tokens': 0,
    'selected isTrustedUiSender tokens': 0,
    'selected channelMap tokens': 1,
    'selected videoChannelMap tokens': 1,
    'selected videoMetaMap tokens': 1,
    'selected contentFilters tokens': 2,
    'selected categoryFilters tokens': 0,
    'selected hideRecommended tokens': 1,
    'selected hideAskButton tokens': 1,
    'selected hideAllComments tokens': 1,
    'selected hideComments tokens': 1,
    'selected clearTimeout tokens': 0,
    'selected removeListener tokens': 0,
    'compiler storage key rows': 43,
    'background invalidation key rows': 14,
    'compiler-only storage key rows': 30,
    'invalidation-only storage key rows': 1
  });

  for (const [label, value] of Object.entries(counts)) {
    assert.ok(doc.includes(`${label} | ${value}`), `missing doc token count ${label}`);
  }

  for (const key of [...compilerKeys, ...compileOnly, ...invalidOnly]) {
    assert.ok(doc.includes(key), `missing key ${key} from doc`);
  }
});

test('background compiled cache current cache gate behavior is pinned', () => {
  const shape = blockMetric(blockSpecs.cacheShape).block;
  const gate = blockMetric(blockSpecs.getCompiledSettingsCacheGate).block;

  assert.match(shape, /let compiledSettingsCache = \{ main: null, kids: null \};/);
  assert.match(gate, /const targetProfile = profileType === 'kids' \|\| isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(gate, /if \(!forceRefresh && compiledSettingsCache\[targetProfile\]\) \{/);
  assert.match(gate, /return compiledSettingsCache\[targetProfile\]/);
  assert.doesNotMatch(`${shape}\n${gate}`, /activeProfileId|storageRevision|dirtyKeys|compiledSettingsRevision/);
});

test('background compiled cache current read path write and assign behavior is pinned', () => {
  const migration = blockMetric(blockSpecs.getCompiledSettingsMigrationWrite).block;
  const assign = blockMetric(blockSpecs.getCompiledSettingsCacheAssign).block;

  assert.match(migration, /if \(Object\.keys\(storageUpdates\)\.length > 0\) \{/);
  assert.match(migration, /browserAPI\.storage\.local\.set\(storageUpdates\)/);
  assert.match(assign, /console\.log\(`FilterTube Background: Compiled \$\{targetProfile\} settings:/);
  assert.match(assign, /compiledSettingsCache\[targetProfile\] = compiledSettings/);
  assert.match(assign, /resolve\(compiledSettings\)/);
  assert.doesNotMatch(`${migration}\n${assign}`, /compiledSettingsRevision|cacheInvalidationReport|backgroundCompiledCacheReadPathMutationReport/);
});

test('background runtime getCompiledSettings current cache gate is pinned', () => {
  const block = blockMetric(blockSpecs.runtimeGetCompiledSettingsBranch).block;

  assert.match(block, /const requestedProfile = request\.profileType/);
  assert.match(block, /if \(compiledSettingsCache\[profileType\] && !request\.forceRefresh\) \{/);
  assert.match(block, /sendResponse\(compiledSettingsCache\[profileType\]\)/);
  assert.match(block, /getCompiledSettings\(sender, profileType, !!request\.forceRefresh\)/);
  assert.match(block, /compiledSettingsCache\[profileType\] = compiledSettings/);
  assert.match(block, /return true/);
  assert.doesNotMatch(block, /compiledSettingsRevision|storageRevision|cacheInvalidationReport|backgroundCompiledCacheRevisionReport/);
});

test('background ApplySettings current recompile-before-broadcast behavior is pinned', () => {
  const block = blockMetric(blockSpecs.applySettingsBranch).block;

  assert.match(block, /request\.action === "FilterTube_ApplySettings" && request\.settings/);
  assert.match(block, /const targetProfile = request\.profile === 'kids' \? 'kids' : 'main'/);
  assert.match(block, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /browserAPI\.tabs\.query\(\{ url: urlPattern \}, tabs => \{/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.match(block, /sendResponse\(\{ acknowledged: true, profile: targetProfile \}\)/);
  assert.doesNotMatch(block, /isTrustedUiSender\(sender\)|compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings|compiledSettingsRevision|backgroundApplySettingsPayloadPolicy/);
});

test('background storage invalidation current listener behavior is pinned', () => {
  const block = blockMetric(blockSpecs.storageInvalidationListener).block;

  assert.match(block, /browserAPI\.storage\.onChanged\.addListener\(\(changes, area\) => \{/);
  assert.match(block, /if \(area === 'local'\) \{/);
  assert.match(block, /const relevantKeys = \[/);
  assert.match(block, /let settingsChanged = false/);
  assert.match(block, /for \(const key of relevantKeys\) \{/);
  assert.match(block, /if \(changes\[key\]\) \{/);
  assert.match(block, /compiledSettingsCache\.main = null/);
  assert.match(block, /compiledSettingsCache\.kids = null/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\)/);
  assert.match(block, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\)/);
  assert.doesNotMatch(block, /sendMessageToTabQuietly|FilterTube_ApplySettings|compiledSettingsRevision|cacheInvalidationReport|clearTimeout\(|removeListener/);
});

test('background compiled cache invalidation authority symbols are absent from runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const authorities = [
    'backgroundCompiledCacheInvalidationLifecycleContract',
    'backgroundCompiledCacheKeyParityReport',
    'backgroundCompiledCacheRevisionReport',
    'backgroundCompiledCacheSourceReport',
    'backgroundStorageInvalidationDecisionReport',
    'backgroundStorageInvalidationKeyManifest',
    'backgroundApplySettingsPayloadPolicy',
    'backgroundCompiledCacheReadPathMutationReport',
    'backgroundCompiledCacheRecompileBudget',
    'backgroundCompiledCacheBroadcastPolicy',
    'backgroundCompiledCacheMetricArtifact'
  ];

  for (const authority of authorities) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
