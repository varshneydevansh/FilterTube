import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md';

const sourceRows = [
  ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  ['js/background.js', 6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  ['js/content/bridge_settings.js',  1113,  44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
  ['js/content/handle_resolver.js', 282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
];

const rawSourceDocNumberFiles = new Set([
  'js/background.js',
  'js/content/bridge_settings.js'
]);

const blockRows = [
  [
    'contentBridgePersistVideoMapping',
    'js/content_bridge.js',
    'function persistVideoChannelMapping(videoId, channelId) {',
    'let pendingVideoMetaDomRerunTimer = 0;',
    1638,
    74,
    3441,
    '043d1f771d3652cd6f35fa205dbdfa92925ebf5e62eb392da800293c6b070dd7'
  ],
  [
    'contentBridgeValidatedCollaboratorCache',
    'js/content_bridge.js',
    'function getCachedCollaboratorsFromCard(card) {',
    'function clearCollaboratorMetadataFromCard(card) {',
    2652,
    94,
    4628,
    'd4c057c1e55d02d8f80062efcbd097b723c111fb5fcce05975aec1cac8684481'
  ],
  [
    'contentBridgeYtInitialDataChannelCache',
    'js/content_bridge.js',
    'const ytInitialDataChannelCache = new Map();',
    '/**\n * Deeply inspect a ytInitialData-like object',
    7982,
    117,
    4807,
    'ae717352ad0b82642af2ffa22128b309d60dca9f990ef579ea3ceaac6d70442f'
  ],
  [
    'backgroundMapCacheDeclarations',
    'js/background.js',
    'let releaseNotesCache = null;',
    'let autoBackupTimer = null;',
    1355,
    21,
    686,
    'f82fd7936485f08734bf18b4da304978f428be0e36b2eef434007116a9cc53ec'
  ],
  [
    'backgroundMapCacheCluster',
    'js/background.js',
    'function ensureChannelMapCache() {',
    '/**\n * Lazy-loads the curated release_notes.json file',
    1737,
    263,
    8987,
    'de1705105e239ce4de8c79d5e4ab3e135ed7133fcbc17f00ce5c1074230b493a'
  ],
  [
    'bridgeSettingsMapOnlyRefresh',
    'js/content/bridge_settings.js',
    'let pendingStorageRefreshTimer = 0;',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);',
    981,
    130,
    4506,
    'f3802437cd0f5bee44ac10378fd4b5156ad87cf3f5db3ee142702c0e7a4fed38'
  ],
  [
    'handleResolverCache',
    'js/content/handle_resolver.js',
    'const resolvedHandleCache = new Map();',
    null,
    133,
    150,
    5256,
    'e21518cc23e4fa108b94507a2c5e9e43e25e5a240df74951f830597405e9a12d'
  ]
];

const tokenRows = [
  ['content_bridge resolvedCollaboratorsByVideoId tokens', 'js/content_bridge.js', 'resolvedCollaboratorsByVideoId', 15],
  ['content_bridge data-filtertube-collaborators tokens', 'js/content_bridge.js', 'data-filtertube-collaborators', 23],
  ['content_bridge ytInitialDataChannelCache tokens', 'js/content_bridge.js', 'ytInitialDataChannelCache', 10],
  ['content_bridge ytInitialDataChannelNegativeExpiry tokens', 'js/content_bridge.js', 'ytInitialDataChannelNegativeExpiry', 6],
  ['content_bridge ytInitialDataChannelInFlight tokens', 'js/content_bridge.js', 'ytInitialDataChannelInFlight', 5],
  ['content_bridge currentSettings.videoChannelMap tokens', 'js/content_bridge.js', 'currentSettings.videoChannelMap', 12],
  ['content_bridge currentSettings.videoMetaMap tokens', 'js/content_bridge.js', 'currentSettings.videoMetaMap', 10],
  ['content_bridge currentSettings?.videoChannelMap tokens', 'js/content_bridge.js', 'currentSettings?.videoChannelMap', 12],
  ['content_bridge currentSettings?.channelMap tokens', 'js/content_bridge.js', 'currentSettings?.channelMap', 8],
  ['background channelMapCache tokens', 'js/background.js', 'channelMapCache', 13],
  ['background videoChannelMapCache tokens', 'js/background.js', 'videoChannelMapCache', 12],
  ['background videoMetaMapCache tokens', 'js/background.js', 'videoMetaMapCache', 15],
  ['background pendingChannelMapUpdates tokens', 'js/background.js', 'pendingChannelMapUpdates', 5],
  ['background pendingVideoChannelMapUpdates tokens', 'js/background.js', 'pendingVideoChannelMapUpdates', 6],
  ['background pendingVideoMetaMapUpdates tokens', 'js/background.js', 'pendingVideoMetaMapUpdates', 5],
  ['background compiledSettingsCache tokens', 'js/background.js', 'compiledSettingsCache', 39],
  ['bridge_settings channelMap-only branch tokens', 'js/content/bridge_settings.js', "changedKeys[0] === 'channelMap'", 1],
  ['bridge_settings videoChannelMap-only branch tokens', 'js/content/bridge_settings.js', "changedKeys[0] === 'videoChannelMap'", 1],
  ['bridge_settings videoMetaMap-only branch tokens', 'js/content/bridge_settings.js', "changedKeys[0] === 'videoMetaMap'", 1],
  ['handle_resolver resolvedHandleCache tokens', 'js/content/handle_resolver.js', 'resolvedHandleCache', 15],
  ['handle_resolver PENDING tokens', 'js/content/handle_resolver.js', "'PENDING'", 4]
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return sha256Text(fs.readFileSync(filePath(file)));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sourceDocNumber(file, value) {
  return rawSourceDocNumberFiles.has(file) ? String(value) : value.toLocaleString('en-US');
}

function sliceBlock(file, startNeedle, endNeedle) {
  const source = read(file);
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = endNeedle === null ? source.length : source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return {
    startLine: lineCount(source.slice(0, start)) + 1,
    text: source.slice(start, end)
  };
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

test('whitelist cache hot-path boundary records narrow dedupe and source pins', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior boundary with a narrow runtime hot-path fix/);
  assert.match(text, /duplicate learned-map persistence/);
  assert.match(text, /whitelist cache hot-path source files: 5/);
  assert.match(text, /cache hot-path source\/effect blocks: 7/);
  assert.match(text, /content bridge cache hot-path blocks: 3/);
  assert.match(text, /background map cache blocks: 2/);
  assert.match(text, /bridge settings refresh blocks: 1/);
  assert.match(text, /handle resolver cache blocks: 1/);
  assert.match(text, /learned map cache freshness rows: 8/);
  assert.match(text, /duplicate page-message DOM work still possible: no, for unchanged learned video rows/);
  assert.match(text, /central learned-map revision counter: absent/);
  assert.match(text, /runtime behavior changed: yes, duplicate learned-map persistence, no-op stamp reruns, and duplicate learned-batch DOM work only/);
  assert.match(text, /runtime narrow learned-map persistence\/deduped-DOM approval: GO/);
  assert.match(text, /runtime broader whitelist cache optimization approval: NO-GO/);
  assert.match(text, /runtime JSON-first cache optimization approval: NO-GO/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256File(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${sourceDocNumber(file, expectedLines)} \\| ${sourceDocNumber(file, expectedBytes)} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('whitelist cache hot-path source/effect blocks stay source-derived', () => {
  const text = doc();

  for (const [name, file, startNeedle, endNeedle, expectedStartLine, expectedLines, expectedBytes, expectedHash] of blockRows) {
    const block = sliceBlock(file, startNeedle, endNeedle);
    assert.equal(block.startLine, expectedStartLine, `${name} start line drifted`);
    assert.equal(lineCount(block.text), expectedLines, `${name} line count drifted`);
    assert.equal(Buffer.byteLength(block.text), expectedBytes, `${name} byte count drifted`);
    assert.equal(sha256Text(block.text), expectedHash, `${name} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(name)}\` \\| \`${escapeRegExp(file)}\` \\| ${expectedStartLine} \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\``)
    );
  }
});

test('selected cache hot-path token counts remain pinned', () => {
  const text = doc();

  for (const [label, file, token, expectedCount] of tokenRows) {
    const count = countLiteral(read(file), token);
    assert.equal(count, expectedCount, `${label} drifted`);
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${expectedCount}`));
  }
});

test('current cache asymmetries remain explicit before broader optimization', () => {
  const contentBridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const filterLogic = read('js/filter_logic.js');

  const ytInitialBlock = sliceBlock(
    'js/content_bridge.js',
    'const ytInitialDataChannelCache = new Map();',
    '/**\n * Deeply inspect a ytInitialData-like object'
  ).text;
  assert.match(ytInitialBlock, /const cacheKey = `\$\{videoId\}\|h:\$\{expectedHandleKey\}\|n:\$\{expectedNameKey\}`/);
  assert.match(ytInitialBlock, /YT_INITIALDATA_CACHE_TTL_MS = 5 \* 60 \* 1000/);
  assert.match(ytInitialBlock, /YT_INITIALDATA_NEGATIVE_TTL_MS = 20 \* 1000/);
  assert.doesNotMatch(ytInitialBlock, /listMode|profileType|location\.pathname|whitelistCacheHotPathAuthority/);

  const collaboratorBlock = sliceBlock(
    'js/content_bridge.js',
    'function getCachedCollaboratorsFromCard(card) {',
    'function clearCollaboratorMetadataFromCard(card) {'
  ).text;
  assert.match(collaboratorBlock, /cachedVideoId !== currentVideoId/);
  assert.match(collaboratorBlock, /removeAttribute\('data-filtertube-collaborators'\)/);
  assert.match(collaboratorBlock, /resolvedCollaboratorsByVideoId\.has\(cachedVideoId\)/);
  assert.doesNotMatch(collaboratorBlock, /resolvedCollaboratorsByVideoId\.delete\(cachedVideoId\)/);

  const videoChannelMessageBlock = sliceBlock(
    'js/content_bridge.js',
    "} else if (type === 'FilterTube_UpdateVideoChannelMap') {",
    "} else if (type === 'FilterTube_UpdateVideoMetaMap') {"
  ).text;
  assert.match(videoChannelMessageBlock, /let didPersist = false/);
  assert.match(videoChannelMessageBlock, /let didPersist = false; let didStampDom = false/);
  assert.match(videoChannelMessageBlock, /const persisted = persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(videoChannelMessageBlock, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(videoChannelMessageBlock, /didPersist = didPersist \|\| persisted/);
  assert.match(videoChannelMessageBlock, /if \(\(didPersist \|\| didStampDom\) && typeof applyDOMFallback === 'function'\)/);

  const videoMetaMessageBlock = sliceBlock(
    'js/content_bridge.js',
    "} else if (type === 'FilterTube_UpdateVideoMetaMap') {",
    "} else if (type === 'FilterTube_UpdateCustomUrlMap')"
  ).text;
  assert.match(videoMetaMessageBlock, /const changedVideoIds = new Set\(persistVideoMetaMapping\(updates\)\)/);
  assert.match(videoMetaMessageBlock, /changedVideoIds\.size === 0\) return/);
  assert.match(videoMetaMessageBlock, /for \(const entry of updates\)/);
  assert.match(videoMetaMessageBlock, /changedVideoIds\.has\(videoId\)/);
  assert.match(videoMetaMessageBlock, /touchDomForVideoMetaUpdate\(videoId\)/);

  const compileMapBlock = sliceBlock(
    'js/background.js',
    '// Pass through the channel map',
    '// Kids profile keyword compilation'
  ).text;
  assert.match(compileMapBlock, /pendingVideoChannelMapUpdates\.entries\(\)/);
  assert.match(compileMapBlock, /compiledSettings\.videoChannelMap = compiledVideoChannelMap/);
  assert.match(compileMapBlock, /videoChannelMapCache = \{ \.\.\.compiledVideoChannelMap \}/);
  assert.match(compileMapBlock, /compiledSettings\.videoMetaMap = items\.videoMetaMap \|\| \{\}/);
  assert.doesNotMatch(compileMapBlock, /pendingVideoMetaMapUpdates/);

  const backgroundStorageListenerBlock = sliceBlock(
    'js/background.js',
    '// Listen for storage changes to re-compile settings',
    '/**\n * Fetch channel name and handle from YouTube by scraping the channel page'
  ).text;
  assert.doesNotMatch(backgroundStorageListenerBlock, /channelMap|videoChannelMap|videoMetaMap/);

  assert.match(background, /function enforceVideoChannelMapCap\(map\)/);
  assert.match(background, /function enforceVideoMetaMapCap\(map\)/);
  assert.doesNotMatch(background, /function enforceChannelMapCap\(map\)/);
  assert.match(background, /channelMapFlushTimer = setTimeout\(\(\) => \{/);
  assert.match(background, /}, 250\)/);
  assert.match(background, /}, 50\)/);
  assert.match(background, /}, 75\)/);

  assert.match(bridgeSettings, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{\s*return;\s*\}/);
  assert.match(bridgeSettings, /const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(bridgeSettings, /const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(bridgeSettings, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);

  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
  assert.match(handleResolver, /resolvedHandleCache\.get\(cleanHandle\) === 'PENDING'\) \{\s*return null;/);
  assert.match(handleResolver, /storage\.local\.get\(\['channelMap'\]\)/);

  assert.match(contentBridge, /currentSettings\.videoChannelMap\[v\].*=== c\) return false;/);
  assert.match(contentBridge, /function stampChannelIdentity\(card, info, options = \{\}\)/);
  assert.match(contentBridge, /if \(!changed \|\| options\?\.scheduleFallback === false\) return changed/);
  assert.match(contentBridge, /currentSettings\.videoChannelMap\[v\] = c/);
  assert.match(contentBridge, /videoId: v,\s*channelId: c/);
  assert.match(contentBridge, /String\(existing\.lengthSeconds \?\? ''\)\.trim\(\) === String\(meta\.lengthSeconds \?\? ''\)\.trim\(\)/);
  assert.match(contentBridge, /currentSettings\.videoMetaMap\[videoId\] = meta/);
  assert.match(filterLogic, /queueVideoChannelMapping/);
  assert.match(filterLogic, /queueVideoMetaMapping/);
  assert.match(filterLogic, /pendingVideoChannelFlush = setTimeout/);
  assert.match(filterLogic, /}, 50\)/);
  assert.match(filterLogic, /pendingVideoMetaFlush = setTimeout/);
  assert.match(filterLogic, /}, 75\)/);
  assert.doesNotMatch([contentBridge, background, bridgeSettings, filterLogic].join('\n'), /learnedMapRevision|videoMapRevision|cacheRevision/);
});

test('whitelist cache hot-path future authority symbols remain absent', () => {
  const runtime = [
    'js/content_bridge.js',
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/content/handle_resolver.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  for (const symbol of [
    'whitelistCacheHotPathAuthority',
    'whitelistCacheWorkDecision',
    'learnedMapCacheRevisionReport',
    'learnedMapFlushFreshnessReport',
    'collaboratorCacheLifetimePolicy',
    'ytInitialDataCacheReasonReport',
    'handleResolverPendingPromisePolicy',
    'mapOnlyStorageRefreshDecision',
    'jsonFirstCacheWriteEffectReport',
    'whitelistCacheMetricArtifact'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(symbol));
    assert.match(doc(), new RegExp(symbol));
  }
});
