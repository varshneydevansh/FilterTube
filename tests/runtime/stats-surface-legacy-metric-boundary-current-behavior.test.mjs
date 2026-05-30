import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STATS_SURFACE_LEGACY_METRIC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/content/dom_helpers.js': [206, 8292, 'a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242'],
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'],
  'js/background.js': [6313, 284710, '46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7']
};

const blockSpecs = {
  domToggleVisibility: {
    file: 'js/content/dom_helpers.js',
    start: "function toggleVisibility(element, shouldHide, reason = '', skipStats = false) {",
    end: '/**\n * Recursively checks',
    startLine: 67,
    lines: 84,
    bytes: 3286
  },
  contentInitializeStats: {
    file: 'js/content_bridge.js',
    start: 'function initializeStats() {',
    end: '/**\n * Determine content type from element',
    startLine: 3709,
    lines: 30,
    bytes: 1223
  },
  contentGetContentType: {
    file: 'js/content_bridge.js',
    start: 'function getContentType(element) {',
    end: '/**\n * Estimate time saved',
    startLine: 3744,
    lines: 46,
    bytes: 1347
  },
  contentEstimateTimeSaved: {
    file: 'js/content_bridge.js',
    start: 'function estimateTimeSaved(contentType, duration = null) {',
    end: '/**\n * Increment hidden stats',
    startLine: 3796,
    lines: 26,
    bytes: 901
  },
  contentIncrementStats: {
    file: 'js/content_bridge.js',
    start: 'function incrementHiddenStats(element) {',
    end: '/**\n * Decrement hidden stats',
    startLine: 3826,
    lines: 69,
    bytes: 2489
  },
  contentDecrementStats: {
    file: 'js/content_bridge.js',
    start: 'function decrementHiddenStats(element) {',
    end: '/**\n * Save stats to storage',
    startLine: 3899,
    lines: 19,
    bytes: 560
  },
  contentSaveStats: {
    file: 'js/content_bridge.js',
    start: 'function saveStats() {',
    end: 'function handleMediaPlayback(element, shouldHide) {',
    startLine: 3921,
    lines: 36,
    bytes: 1109
  },
  backgroundCompiledGetStatsKey: {
    file: 'js/background.js',
    start: "            'stats',",
    end: '        ], (items) => {',
    startLine: 1825,
    lines: 3,
    bytes: 80
  },
  backgroundRecordTimeSaved: {
    file: 'js/background.js',
    start: '} else if (request.action === "recordTimeSaved") {',
    end: '\n    }\n\n    else if (request.action === "fetchChannelDetails")',
    startLine: 4449,
    lines: 12,
    bytes: 571
  },
  sharedSettingsStatsKeys: {
    file: 'js/settings_shared.js',
    start: "        'stats',",
    end: "        'channelMap'",
    startLine: 51,
    lines: 2,
    bytes: 43
  },
  sharedLoadStatsPayload: {
    file: 'js/settings_shared.js',
    start: '                    stats: result.stats || { hiddenCount: 0, savedMinutes: 0 },',
    end: '                    channelMap: result.channelMap || {},',
    startLine: 729,
    lines: 2,
    bytes: 151
  },
  stateLoadStatsPayload: {
    file: 'js/state_manager.js',
    start: '        state.stats = data.stats || { hiddenCount: 0, savedMinutes: 0 };',
    end: '        state.channelMap = data.channelMap || {};',
    startLine: 242,
    lines: 4,
    bytes: 260
  },
  stateExternalReloadStatsKey: {
    file: 'js/state_manager.js',
    start: "                    'stats',",
    end: "                    'channelMap',",
    startLine: 2416,
    lines: 1,
    bytes: 29
  },
  tabDashboardStatsBlock: {
    file: 'js/tab-view.js',
    start: '    function getDashboardSurfaceStats(surface, state) {',
    end: '    // Initial render',
    startLine: 10744,
    lines: 214,
    bytes: 9136
  }
};

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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const text = read(spec.file);
  const { start, block } = sliceBetween(text, spec.start, spec.end);
  return {
    startLine: text.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('stats surface legacy metric boundary is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /first-class JSON filtering/);
  assert.match(text, /stats metric boundary source files pinned \| 6/);
  assert.match(text, /stats metric source\/effect blocks pinned \| 14/);
  assert.match(text, /runtime implementation changed \| no/);

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

test('stats surface legacy metric source/effect blocks remain current', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.lines.toLocaleString('en-US')} \\| ${spec.bytes.toLocaleString('en-US')} \\|`)
    );
  }
});

test('stats side effects remain split between hide restore media and metric writes', () => {
  const toggle = blockMetric(blockSpecs.domToggleVisibility).block;
  const increment = blockMetric(blockSpecs.contentIncrementStats).block;
  const decrement = blockMetric(blockSpecs.contentDecrementStats).block;

  assert.match(toggle, /filteringTracker\.recordHide\(element, reason\)/);
  assert.match(toggle, /incrementHiddenStats\(element\)/);
  assert.match(toggle, /filteringTracker\.recordRestore\(element\)/);
  assert.match(toggle, /decrementHiddenStats\(element\)/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.match(toggle, /handleMediaPlayback\(element, false\)/);
  assert.ok(
    toggle.indexOf('handleMediaPlayback(element, true)') > toggle.indexOf('incrementHiddenStats(element);'),
    'media hide side effect should still run after stats logic'
  );

  assert.match(increment, /const contentType = getContentType\(element\)/);
  assert.match(increment, /const hasVideoLink = element\.querySelector\('a\[href\*="\/watch\?"\]'\)/);
  assert.match(increment, /statsCountToday\+\+/);
  assert.match(increment, /statsTotalSeconds \+= secondsSaved/);
  assert.match(increment, /element\.setAttribute\('data-filtertube-time-saved', secondsSaved\.toString\(\)\)/);
  assert.match(increment, /saveStats\(\)/);
  assert.doesNotMatch(increment, /hideDecisionId|statsStructuredHideDecisionReport|compiledRuleActive|routeScoped/);

  assert.match(decrement, /parseFloat\(element\?\.getAttribute\('data-filtertube-time-saved'\) \|\| '0'\)/);
  assert.match(decrement, /statsCountToday = Math\.max\(0, statsCountToday - 1\)/);
  assert.match(decrement, /element\.removeAttribute\('data-filtertube-time-saved'\)/);
  assert.doesNotMatch(decrement, /priorCountedElement|hideDecisionId|statsSurfaceMetricBoundaryContract/);
});

test('surface stats legacy stats and dashboard refresh parity remain incomplete', () => {
  const init = blockMetric(blockSpecs.contentInitializeStats).block;
  const save = blockMetric(blockSpecs.contentSaveStats).block;
  const background = blockMetric(blockSpecs.backgroundRecordTimeSaved).block;
  const stateLoad = blockMetric(blockSpecs.stateLoadStatsPayload).block;
  const stateReload = blockMetric(blockSpecs.stateExternalReloadStatsKey).block;
  const dashboard = blockMetric(blockSpecs.tabDashboardStatsBlock).block;

  assert.match(init, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(init, /const effective = picked \|\| \(surface === 'main' \? legacy : \{\}\)/);
  assert.match(save, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(save, /const statsBySurface = \{/);
  assert.match(save, /\[surface\]: nextStats/);
  assert.match(save, /if \(surface === 'main'\) \{\s*payload\.stats = nextStats;/);
  assert.match(save, /chrome\.storage\.local\.set\(payload\)/);
  assert.doesNotMatch(save, /setTimeout|clearTimeout|requestIdleCallback|debounce|pendingStatsWrite/);

  assert.match(background, /browserAPI\.storage\.local\.get\(\['stats'\]/);
  assert.match(background, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.match(background, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
  assert.doesNotMatch(background, /statsBySurface|isTrustedUiSender|Number\.isFinite|Math\.max|senderClass/);

  assert.match(stateLoad, /state\.stats = data\.stats \|\| \{ hiddenCount: 0, savedMinutes: 0 \}/);
  assert.match(stateLoad, /state\.statsBySurface = \(data\.statsBySurface/);
  assert.match(stateReload, /'stats'/);
  assert.doesNotMatch(stateReload, /statsBySurface/);

  assert.match(dashboard, /const picked = bySurface\[surface\]/);
  assert.match(dashboard, /if \(surface === 'main'\) return state\?\.stats \|\| \{\}/);
  assert.match(dashboard, /Number\.isFinite\(totalSeconds\)/);
  assert.match(dashboard, /Math\.max\(0, totalSeconds\)/);
  assert.match(dashboard, /dashboardStatsMainBtn\.addEventListener\('click'/);
  assert.match(dashboard, /dashboardStatsKidsBtn\.addEventListener\('click'/);
  assert.match(dashboard, /dashboardStatsRotationTimer = setInterval/);
});

test('stats boundary links existing P0 evidence and keeps implementation blocked', () => {
  const text = doc();

  for (const artifact of [
    'tests/runtime/stats-surface-legacy-metric-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/p0-stats-time-saved-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_STATS_TIME_SAVED_AUTHORITY_AUDIT_2026-05-18.md',
    'tests/runtime/stats-time-saved-authority-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(text.includes(artifact), `missing linked artifact ${artifact}`);
  }

  assert.match(text, /This does not complete the active goal/);
  assert.match(text, /This slice does not approve changing stats behavior/);
  assert.match(text, /JSON-side hides cannot increment metrics without the same eligibility decision as DOM hides/);
});

test('stats metric boundary keeps future authority symbols absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const missing of [
    'statsSurfaceMetricBoundaryContract',
    'statsSideEffectAuthority',
    'statsStructuredHideDecisionReport',
    'statsLegacyRecordTimeSavedGate',
    'statsSurfaceRefreshParityReport',
    'statsStorageWriteBudget',
    'statsDashboardFallbackDecision',
    'statsNoRuleMetricEligibilityReport',
    'statsMediaSideEffectSeparationReport',
    'statsMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime`);
  }
});
