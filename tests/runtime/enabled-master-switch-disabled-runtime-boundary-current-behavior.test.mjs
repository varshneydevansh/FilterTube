import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/content/dom_fallback.js': [5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'],
  'js/background.js': [6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/content/bridge_settings.js': [1113, 44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']
};

const blockSpecs = {
  seedProcessDisabledGate: {
    file: 'js/seed.js',
    start: '        if (cachedSettings.enabled === false) {',
    end: '        if (shouldSkipEngineProcessing(data, dataName)) {',
    startLine: 411,
    lines: 5,
    bytes: 192
  },
  seedFetchBypassDecision: {
    file: 'js/seed.js',
    start: '            const dataName = `fetch:${getPathname(urlStr)}`;',
    end: '            return originalFetch.apply(this, arguments).then(response => {',
    startLine: 693,
    lines: 5,
    bytes: 202
  },
  seedFetchBodyRewrite: {
    file: 'js/seed.js',
    start: '                return response.clone().json().then(jsonData => {',
    end: '                }).catch(err => {',
    startLine: 701,
    lines: 45,
    bytes: 2750
  },
  seedXhrDisabledGuard: {
    file: 'js/seed.js',
    start: '            const ensureXhrResponseProcessed = (xhr) => {',
    end: '                    const status = Number(xhr.status || 0);',
    startLine: 813,
    lines: 8,
    bytes: 394
  },
  engineHarvestBeforeDisabled: {
    file: 'js/filter_logic.js',
    start: "        processData(data, dataName = 'unknown') {",
    end: '            // 2. THEN FILTER',
    startLine: 3588,
    lines: 20,
    bytes: 826
  },
  domActiveWorkPredicate: {
    file: 'js/content/dom_fallback.js',
    start: 'function hasActiveDOMFallbackWork(settings) {',
    end: 'function clearStaleDOMFallbackVisibility() {',
    startLine: 2117,
    lines: 68,
    bytes: 2333
  },
  domDisabledCleanupGate: {
    file: 'js/content/dom_fallback.js',
    start: '    if (effectiveSettings.enabled === false) {',
    end: '    // 1. Video/Content Filtering',
    startLine: 2487,
    lines: 18,
    bytes: 791
  },
  backgroundEnabledFromV4: {
    file: 'js/background.js',
    start: '            const enabledFromV4 = (() => {',
    end: '            const hideCommentsFromV4 = boolFromV4',
    startLine: 353,
    lines: 10,
    bytes: 359
  },
  backgroundBooleanPassThrough: {
    file: 'js/background.js',
    start: '            // Pass through boolean flags',
    end: '            const profileSettings = activeProfile?.settings || {};',
    startLine: 2794,
    lines: 34,
    bytes: 3529
  },
  backgroundInvalidationKeys: {
    file: 'js/background.js',
    start: '        const relevantKeys = [',
    end: '        let settingsChanged = false;',
    startLine: 4808,
    lines: 16,
    bytes: 461
  },
  sharedSettingsKeys: {
    file: 'js/settings_shared.js',
    start: '    const SETTINGS_KEYS = [',
    end: '    const SETTINGS_CHANGE_KEYS = new Set',
    startLine: 17,
    lines: 39,
    bytes: 1033
  },
  sharedCompileEnabled: {
    file: 'js/settings_shared.js',
    start: '        return {\n            enabled: enabled !== false,',
    end: '            hideAllComments: !!hideComments,',
    startLine: 524,
    lines: 6,
    bytes: 315
  },
  bridgeRefreshKeys: {
    file: 'js/content/bridge_settings.js',
    start: '    const relevantKeys = [',
    end: '    if (Object.keys(changes).some',
    startLine: 1061,
    lines: 44,
    bytes: 1263
  },
  stateValidKeys: {
    file: 'js/state_manager.js',
    start: '        const validKeys = [',
    end: '        if (!validKeys.includes(key))',
    startLine: 2028,
    lines: 35,
    bytes: 1075
  },
  stateExternalReloadKeys: {
    file: 'js/state_manager.js',
    start: '                const storageKeys = [',
    end: '                const hasSettingsChange = storageKeys.some',
    startLine: 2380,
    lines: 41,
    bytes: 1604
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

function parseArrayItems(block) {
  const out = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').trim().replace(/,$/, '').trim();
    if (!line) continue;
    const quoted = /^['"]([^'"]+)['"]$/.exec(line);
    if (quoted) out.push(quoted[1]);
    else if (line === 'FT_PROFILES_V4_KEY') out.push('ftProfilesV4');
    else if (line === 'FT_PROFILES_V3_KEY') out.push('ftProfilesV3');
  }
  return out;
}

function extractArray(file, outerStart, outerEnd, arrayStart, arrayEnd) {
  const source = read(file);
  const outer = sliceBetween(source, outerStart, outerEnd).block;
  return parseArrayItems(sliceBetween(outer, arrayStart, arrayEnd).block);
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function homeContinuationPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'abcdefghijk',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
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

test('enabled disabled-runtime boundary is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Runtime behavior reflects the scoped disabled\/no-rule fast-path optimization/);
  assert.match(text, /This document is not a standalone implementation patch/);
  assert.match(text, /first-class JSON filter work/);
  assert.match(text, /enabled disabled-runtime source files pinned \| 7/);
  assert.match(text, /enabled disabled-runtime source\/effect blocks pinned \| 15/);
  assert.match(text, /runtime implementation changed \| yes/);

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

test('enabled disabled-runtime source/effect blocks remain current', () => {
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

  const seedProcessGate = blockMetric(blockSpecs.seedProcessDisabledGate).block;
  assert.match(seedProcessGate, /cachedSettings\.enabled === false/);
  assert.doesNotMatch(seedProcessGate, /harvestOnly|stashNetworkSnapshot|JSON\.parse|JSON\.stringify/);

  const seedFetchBypass = blockMetric(blockSpecs.seedFetchBypassDecision).block;
  assert.match(seedFetchBypass, /shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(seedFetchBypass, /return originalFetch\.apply\(this, arguments\)/);

  const seedFetchBody = blockMetric(blockSpecs.seedFetchBodyRewrite).block;
  assert.ok(
    seedFetchBody.indexOf('response.clone().json()') < seedFetchBody.indexOf('processWithEngine(jsonData'),
    'active JSON-work fetch path should parse before processWithEngine'
  );
  assert.match(seedFetchBody, /new Response\(JSON\.stringify\(processed\)/);

  const seedXhrGuard = blockMetric(blockSpecs.seedXhrDisabledGuard).block;
  assert.ok(
    seedXhrGuard.indexOf('if (cachedSettings.enabled === false) return;') < seedXhrGuard.length,
    'XHR disabled guard should be present before body parsing block'
  );

  const engineBlock = blockMetric(blockSpecs.engineHarvestBeforeDisabled).block;
  assert.ok(
    engineBlock.indexOf('this._harvestChannelData(data);') < engineBlock.indexOf('if (this.settings.enabled === false)'),
    'engine harvest should precede disabled mutation skip'
  );

  const domPredicate = blockMetric(blockSpecs.domActiveWorkPredicate).block;
  assert.match(domPredicate, /if \(settings\.enabled === false\) return false/);
  assert.match(domPredicate, /if \(listMode === 'whitelist'\) return true/);
  assert.match(domPredicate, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(domPredicate, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);

  const domCleanup = blockMetric(blockSpecs.domDisabledCleanupGate).block;
  assert.match(domCleanup, /clearContentControlStyles\(\)/);
  assert.match(domCleanup, /toggleVisibility\(el, false, '', true\)/);
});

test('enabled key propagation is not parity-complete across background content and UI refresh', () => {
  const backgroundInvalidation = extractArray(
    'js/background.js',
    '// Listen for storage changes to re-compile settings',
    'if (settingsChanged) {',
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );
  const sharedSettingsKeys = parseArrayItems(sliceBetween(
    read('js/settings_shared.js'),
    'const SETTINGS_KEYS = [',
    '];\n\n    const SETTINGS_CHANGE_KEYS'
  ).block);
  const contentBridgeRefresh = extractArray(
    'js/content/bridge_settings.js',
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);',
    'const relevantKeys = [',
    '];\n    if (Object.keys(changes).some'
  );
  const stateValidKeys = parseArrayItems(sliceBetween(
    read('js/state_manager.js'),
    '        const validKeys = [',
    '        ];\n\n        if (!validKeys.includes(key))'
  ).block);
  const stateExternalReload = extractArray(
    'js/state_manager.js',
    'chrome.storage.onChanged.addListener(async (changes, area) => {',
    'if (hasSettingsChange) {',
    'const storageKeys = [',
    '];\n                const hasSettingsChange'
  );

  assert.equal(backgroundInvalidation.includes('enabled'), false);
  assert.equal(sharedSettingsKeys.includes('enabled'), true);
  assert.equal(contentBridgeRefresh.includes('enabled'), true);
  assert.equal(stateValidKeys.includes('enabled'), true);
  assert.equal(stateExternalReload.includes('enabled'), true);

  const text = doc();
  assert.match(text, /background storage invalidation `enabled` entries \| 0/);
  assert.match(text, /content bridge storage refresh `enabled` entries \| 1/);
  assert.match(text, /StateManager external reload `enabled` entries \| 1/);
  assert.match(text, /Background storage-change cache invalidation does not include `enabled`/);
});

test('disabled runtime behavior is pinned by seed and engine fixtures', async () => {
  const seedRuntime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  seedRuntime.window.filterTube.updateSettings(settings({ enabled: false }));

  const response = await seedRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  assert.equal(response.status, 200);
  assert.equal(seedRuntime.calls.harvestOnly.length, 0);
  assert.equal(seedRuntime.calls.processData.length, 0);
  assert.equal(seedRuntime.calls.responseJson.length, 0);
  assert.equal(seedRuntime.calls.jsonStringify.length, 0);

  const { engine } = loadFilterTubeEngine();
  const input = {
    contents: [{
      videoRenderer: {
        videoId: 'abcdefghijk',
        title: { runs: [{ text: 'blocked keyword' }] }
      }
    }]
  };
  const output = engine.processData(input, settings({
    enabled: false,
    filterKeywords: [{ pattern: 'blocked', flags: 'i' }]
  }), 'disabled-fixture');

  assert.equal(output, input);
});

test('enabled disabled-runtime boundary keeps future authority symbols absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const missing of [
    'enabledMasterSwitchRuntimeContract',
    'enabledDisabledNoWorkDecisionReport',
    'enabledSeedTransportNoWorkBudget',
    'enabledEngineHarvestBeforeSkipReport',
    'enabledDomFallbackActiveGateReport',
    'enabledSettingsRefreshParityReport',
    'enabledBackgroundCacheInvalidationReport',
    'enabledDisabledRuntimeFixtureProvenance',
    'enabledDisabledRuntimeMetricArtifact',
    'enabledRuntimeAuthorityGate'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime`);
  }
});

test('enabled disabled-runtime boundary links related audit evidence without opening implementation', () => {
  const text = doc();

  for (const artifact of [
    'tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md'
  ]) {
    assert.ok(text.includes(artifact), `missing linked artifact ${artifact}`);
  }

  assert.match(text, /This does not complete the active goal/);
  assert.match(text, /does not permit additional broad\s+implementation changes/);
  assert.match(text, /A future optimization must prove endpoint permission/);
});
