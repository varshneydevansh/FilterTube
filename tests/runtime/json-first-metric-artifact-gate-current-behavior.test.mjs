import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceRows = [
  ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  ['js/content/dom_fallback.js', 5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'],
  ['js/content/block_channel.js', 3189, 127857, 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba'],
  ['js/content/handle_resolver.js', 282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  ['js/background.js', 6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  ['js/state_manager.js', 2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  ['js/settings_shared.js', 1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  ['docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md', 116, 6248, 'f460f1987fda8ec26b639b261bddfb55b92ec3da05877b01dfb9c16e13f7277b'],
  ['docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md', 273, 16005, 'f753087303cbad26f09ac45d9dccf2b60ebf2942d2b64dea6c9373cc168d6f1a'],
];

const runtimeFiles = sourceRows
  .map(([file]) => file)
  .filter((file) => file.startsWith('js/'));

const blockRows = [
  ['seedEngineDebugTiming', 'js/seed.js', 'seedDebugLog(`🔧 Starting to process ${dataName}...`);', '} else {\n            seedDebugLog(`⚠️ FilterTubeEngine not available yet`);', 437, 43, 2292],
  ['filterLogicProcessTiming', 'js/filter_logic.js', "processData(data, dataName = 'unknown') {", '    // ============================================================================\n    // GLOBAL INTERFACE', 3588, 34, 1239],
  ['stateManagerEnrichmentTiming', 'js/state_manager.js', 'function processChannelEnrichmentQueue() {', '    // ============================================================================\n    // KIDS PROFILE MANAGEMENT', 639, 58, 2072],
  ['backgroundIdentityBudgetConstants', 'js/background.js', 'const SHORTS_PARTIAL_STREAM_LIMIT', 'function compareSemver', 926, 20, 985],
  ['backgroundShortsIdentityFetchBudget', 'js/background.js', 'async function performShortsIdentityFetch', 'function extractIdentityFromPreview', 2879, 67, 2543],
  ['backgroundKidsWatchIdentityFetchBudget', 'js/background.js', 'async function performKidsWatchIdentityFetch', 'async function performWatchIdentityFetch', 2980, 94, 3605],
  ['backgroundWatchIdentityFetchBudget', 'js/background.js', 'async function performWatchIdentityFetch', 'browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse)', 3074, 94, 3678],
  ['handleResolverActiveFetchBudget', 'js/content/handle_resolver.js', 'const resolvedHandleCache = new Map();', null, 133, 150, 5256],
  ['contentBridgeStatsMetricBlock', 'js/content_bridge.js', '// Initialize stats from storage', 'function saveStats()', 3699, 213, 7246],
  ['contentBridgeSaveStatsBlock', 'js/content_bridge.js', 'function saveStats()', 'function handleMediaPlayback', 3912, 36, 1109],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(filePath(file));
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sourceLineOf(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runtimeSource() {
  return runtimeFiles.map(read).join('\n');
}

test('JSON-first metric artifact gate is audit-only and fingerprint pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /codebase inspection is finding real optimization locations/);
  assert.match(text, /making JSON a first-class filter surface/);
  assert.match(text, /metric artifact boundary files: 11/);
  assert.match(text, /runtime metric boundary source files: 9/);
  assert.match(text, /metric source\/effect blocks: 10/);
  assert.match(text, /runtime behavior changed: no/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(fs.statSync(filePath(file)).size, expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('JSON-first metric artifact gate pins source and effect block boundaries', () => {
  const text = doc();

  for (const [name, file, startNeedle, endNeedle, expectedStartLine, expectedLines, expectedBytes] of blockRows) {
    const source = read(file);
    const start = source.indexOf(startNeedle);
    assert.notEqual(start, -1, `missing start needle ${name}`);
    const end = endNeedle ? source.indexOf(endNeedle, start + startNeedle.length) : source.length;
    assert.notEqual(end, -1, `missing end needle ${name}`);
    const block = source.slice(start, end);

    assert.equal(sourceLineOf(source, start), expectedStartLine, `${name} start line drifted`);
    assert.equal(lineCount(block), expectedLines, `${name} line count drifted`);
    assert.equal(Buffer.byteLength(block), expectedBytes, `${name} byte count drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(file)}\` \\| ${expectedStartLine} \\| ${expectedLines} \\| ${expectedBytes} \\|`)
    );
  }
});

test('JSON-first metric artifact gate records current runtime instrumentation counts', () => {
  const text = doc();
  const source = runtimeSource();
  const expectedCounts = [
    ['performance.now callsites', count(source, /performance\.now\s*\(/g), 0],
    ['console.time callsites', count(source, /console\.time\s*\(/g), 0],
    ['console.timeEnd callsites', count(source, /console\.timeEnd\s*\(/g), 0],
    ['Date.now callsites', count(source, /Date\.now\s*\(/g), 84],
    ['debugStatsEnabled token occurrences', countLiteral(source, 'debugStatsEnabled'), 5],
    ['statsBySurface token occurrences', countLiteral(source, 'statsBySurface'), 21],
    ['recordTimeSaved token occurrences', countLiteral(source, 'recordTimeSaved'), 1],
    ['console.log token occurrences', countLiteral(source, 'console.log'), 180],
    ['console.debug token occurrences', countLiteral(source, 'console.debug'), 27],
    ['console.warn token occurrences', countLiteral(source, 'console.warn'), 101],
    ['setTimeout callsites', count(source, /\bsetTimeout\s*\(/g), 83],
    ['setInterval callsites', count(source, /\bsetInterval\s*\(/g), 1],
    ['MutationObserver token occurrences', countLiteral(source, 'MutationObserver'), 23],
    ['requestAnimationFrame token occurrences', countLiteral(source, 'requestAnimationFrame'), 15],
    ['fetch callsites', count(source, /\bfetch\s*\(/g), 12],
    ['XMLHttpRequest token occurrences', countLiteral(source, 'XMLHttpRequest'), 2],
    ['jsonFirstMetricArtifactReport token occurrences', countLiteral(source, 'jsonFirstMetricArtifactReport'), 0],
    ['performanceClaimAuthority token occurrences', countLiteral(source, 'performanceClaimAuthority'), 0],
    ['runtimeMetricSample token occurrences', countLiteral(source, 'runtimeMetricSample'), 0],
    ['routeWorkBudgetReport token occurrences', countLiteral(source, 'routeWorkBudgetReport'), 0],
  ];

  for (const [label, actual, expected] of expectedCounts) {
    assert.equal(actual, expected, `${label} drifted`);
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${expected}`));
  }
});

test('current source separates debug timings product stats and fetch budgets from metric artifacts', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const bridge = read('js/content_bridge.js');

  assert.match(seed, /const debugStatsEnabled = isSeedDebugEnabled\(\)/);
  assert.match(seed, /const startedAt = debugStatsEnabled \? Date\.now\(\) : 0/);
  assert.match(seed, /const originalSize = debugStatsEnabled \? JSON\.stringify\(data\)\.length : 0/);
  assert.match(seed, /seedDebugLog\(`⏱️ Engine processing time: \$\{Date\.now\(\) - startedAt\}ms`\)/);

  assert.match(filterLogic, /const startTime = Date\.now\(\)/);
  assert.match(filterLogic, /const endTime = Date\.now\(\)/);
  assert.match(filterLogic, /this\._log\(`✅ Filtered \$\{dataName\} in \$\{endTime - startTime\}ms, blocked \$\{this\.blockedCount\} items`\)/);

  assert.match(stateManager, /const startedAt = Date\.now\(\)/);
  assert.match(stateManager, /if \(window\.__filtertubeDebug\)/);
  assert.match(stateManager, /const durationMs = Date\.now\(\) - startedAt/);
  assert.match(stateManager, /const delayMs = 5000 \+ Math\.floor\(Math\.random\(\) \* 2000\)/);

  assert.match(background, /const SHORTS_PARTIAL_STREAM_LIMIT = 51200/);
  assert.match(background, /const WATCH_PARTIAL_STREAM_LIMIT = 2000000/);
  assert.match(background, /const SHORTS_FETCH_TIMEOUT_MS = 8000/);
  assert.match(background, /setTimeout\(\(\) => controller\.abort\('timeout'\), SHORTS_FETCH_TIMEOUT_MS\)/);
  assert.match(background, /previewBuffer\.length >= SHORTS_PARTIAL_STREAM_LIMIT/);
  assert.match(background, /previewBuffer\.length >= WATCH_PARTIAL_STREAM_LIMIT/);

  assert.match(handleResolver, /let pendingDomFallbackRerunTimer = 0/);
  assert.match(handleResolver, /setTimeout\(\(\) => \{/);
  assert.match(handleResolver, /\}, 250\)/);
  assert.match(handleResolver, /const resolvedHandleCache = new Map\(\)/);
  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
  assert.match(handleResolver, /response = await fetch\(path/);

  assert.match(bridge, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(bridge, /element\.setAttribute\('data-filtertube-time-saved'/);
  assert.match(bridge, /const statsBySurface = \{/);
  assert.match(bridge, /payload\.stats = nextStats/);

  assert.match(text, /User-facing saved-time stats estimate hidden content time/);
  assert.match(text, /should not be treated as\s+CPU, parse, selector, network, storage, or paint performance metrics/);
});

test('JSON-first metric artifact gate keeps future metric authority missing', () => {
  const text = doc();
  const source = runtimeSource();

  for (const missing of [
    'jsonFirstMetricArtifactGate',
    'jsonFirstMetricArtifactReport',
    'jsonFirstRuntimeMetricSample',
    'jsonFirstRouteWorkBudgetReport',
    'jsonFirstOptimizationMeasurementFixture',
    'jsonFirstPerformanceClaimAuthority',
    'jsonFirstNoWorkMetricArtifact',
    'jsonFirstDomMetricParityReport',
    'jsonFirstResolverMetricBudget',
    'jsonFirstStorageMetricBudget',
  ]) {
    assert.equal(source.includes(missing), false, `${missing} should remain absent from runtime source`);
    assert.match(text, new RegExp(escapeRegExp(missing)));
  }

  for (const requiredField of [
    'metricId',
    'sourceOwner',
    'route',
    'surface',
    'profileType',
    'listMode',
    'ruleState',
    'browser',
    'deviceClass',
    'sampleSize',
    'parseCount',
    'stringifyCount',
    'processDataCount',
    'harvestCount',
    'listenerCount',
    'observerCount',
    'timerCount',
    'networkFetchCount',
    'storageReadCount',
    'storageWriteCount',
    'hideMutationCount',
    'restoreMutationCount',
    'elapsedMs',
    'artifactPath',
  ]) {
    assert.match(text, new RegExp(escapeRegExp(requiredField)));
  }
});
