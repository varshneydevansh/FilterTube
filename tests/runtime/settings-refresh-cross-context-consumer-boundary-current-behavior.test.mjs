import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [6984, 315747, '080d15907b26314873138c5dcc5d9653a2a27e933049be10361dfe0047f0a7cc'],
  'js/content/bridge_settings.js': [1459, 57855, '6434bd16233044ebb4aaef69261126f3b1852213cffd24ce82b4ecf2bb7a4486'],
  'js/content_bridge.js': [13803, 610592, 'cc838f9f12fc6941bba04b7a0244a14ef60581461bcc24dbb8ba7a9bce8e287b'],
  'js/injector.js': [3696, 160366, '468e59a4749bbb8aa52723aaab51dbac44076885f211f05f0a73096d2e49d2b9'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content/dom_fallback.js': [5837, 276985, '5162d14abdd6c7769d495d9157d9772cfef4f15e529b7dea885b2887be60d066'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
};

const blockSpecs = {
  backgroundApplySettingsBranch: {
    file: 'js/background.js',
    start: '    } else if (request.action === "FilterTube_ApplySettings" && request.settings) {',
    end: '    } else if (request.action === "updateChannelMap") {',
    startLine: 5059,
    lines: 28,
    bytes: 1487,
    hash: 'b585d94cc410f7acd929db780840f7cb02b44bb9819b34eb34985b713485e3d6'
  },
  backgroundStorageInvalidation: {
    file: 'js/background.js',
    start: '// Listen for storage changes to re-compile settings\n',
    end: '/**\n * Fetch channel name and handle from YouTube by scraping the channel page',
    startLine: 5148,
    lines: 41,
    bytes: 1464,
    hash: 'e5c76f714f31a1d325385b3eaa051c0eb73e6a29ec1c69b1493cc4bb7f796de2'
  },
  bridgeRuntimeListener: {
    file: 'js/content/bridge_settings.js',
    start: 'if (window.__filtertubeRuntimeBridgeListenerAttached !== true) {',
    end: 'let pendingSeedSettings = null;',
    startLine: 198,
    lines: 121,
    bytes: 5684,
    hash: 'ba565d7340f7b7150423e5daaa87f400769b2ce13216ed8af6509e23e6a6085c'
  },
  bridgeRequestSettings: {
    file: 'js/content/bridge_settings.js',
    start: 'function requestSettingsFromBackground(options = {}) {',
    end: 'function tryApplySettingsToSeed(settings)',
    startLine: 1153,
    lines: 115,
    bytes: 5333,
    hash: '10e99aaff431ece732d33435b7ea618f9c2333ededd839ec07d4b164b8f45227'
  },
  bridgeSeedDelivery: {
    file: 'js/content/bridge_settings.js',
    start: 'function tryApplySettingsToSeed(settings)',
    end: 'let pendingStorageRefreshTimer = 0;',
    startLine: 1268,
    lines: 59,
    bytes: 1531,
    hash: '15627c0c528d75636e9954d0b0ff5d0b4b03e4792e37514423654ea4d4d16c2f'
  },
  bridgeStorageRefresh: {
    file: 'js/content/bridge_settings.js',
    start: 'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {',
    end: 'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);',
    startLine: 1365,
    lines: 92,
    bytes: 3395,
    hash: '6f65d55d5d8dcf9c5ad753df10d9a9f45ca5548787b949b6576bf8c310975dbf'
  },
  contentBridgePageRefresh: {
    file: 'js/content_bridge.js',
    start: 'function handleMainWorldMessages(event) {',
    end: "    } else if (type === 'FilterTube_UpdateChannelMap') {",
    startLine: 6073,
    lines: 12,
    bytes: 603,
    hash: '4674cde24c6350286c67ec26e28a75f0e360bdb0a42f89e4c78cc39a58257f5c'
  },
  injectorSettingsReceiver: {
    file: 'js/injector.js',
    start: "        if (type === 'FilterTube_SettingsToInjector' && source === 'content_bridge') {",
    end: '        // Handle collaboration data caching from filter_logic.js',
    startLine: 1925,
    lines: 23,
    bytes: 871,
    hash: '8c0c9cdff9e9fa153eb8e0ed0528d2f7d431663b15ecebd951866870783a2bf1'
  },
  injectorSeedUpdate: {
    file: 'js/injector.js',
    start: '    function updateSeedSettings() {',
    end: '    // Process data with FilterTubeEngine',
    startLine: 3486,
    lines: 21,
    bytes: 1003,
    hash: '07e4027d2e306ff9046594fc68609b34074526a5a229a31057e06b3a2b97ce0d'
  },
  injectorProcessQueue: {
    file: 'js/injector.js',
    start: '    function processDataWithFilterLogic(data, dataName) {',
    end: "        postLog('log', 'Connecting to seed.js global object');",
    startLine: 3508,
    lines: 60,
    bytes: 2108,
    hash: 'd17bae535755636d9b51d10b3153650b7eed3ff0c0abf99ee988b9d44eb76233'
  },
  seedUpdateSettings: {
    file: 'js/seed.js',
    start: '    function updateSettings(newSettings) {',
    end: '    // ============================================================================\n    // GLOBAL INTERFACE',
    startLine: 983,
    lines: 98,
    bytes: 4640,
    hash: '687d0cf2fcec26709486afb3b8c99cae3e79e8003e17c398ccf3cf214af06cf7'
  },
  domFallbackApplyHead: {
    file: 'js/content/dom_fallback.js',
    start: 'async function applyDOMFallback(settings, options = {}) {',
    end: '    const scrollState = window.__filtertubeScrollState',
    startLine: 3000,
    lines: 65,
    bytes: 2280,
    hash: '2dc1a42c6ba1c0fbe3604d85969ec3656a0f51cf37b32ffe509c80d5b1c5376f'
  },
  filterLogicGlobalProcess: {
    file: 'js/filter_logic.js',
    start: "        processData(data, dataName = 'unknown') {",
    end: '    // ============================================================================\n    // GLOBAL INTERFACE',
    startLine: 3588,
    lines: 34,
    bytes: 1247,
    hash: '2134623c293b2cddc6177a9a1732f6ca45e4014dc4ba3872ebe375c47e96e4d2'
  }
};

const selectedCounts = {
  FilterTube_ApplySettings: 3,
  FilterTube_RefreshNow: 1,
  getCompiledSettings: 5,
  forceRefresh: 6,
  sendMessageToTabQuietly: 1,
  requestSettingsFromBackground: 7,
  sendSettingsToMainWorld: 5,
  FilterTube_SettingsToInjector: 2,
  'window.postMessage': 1,
  tryApplySettingsToSeed: 4,
  pendingSeedSettings: 7,
  filterTubeSeedReady: 1,
  scheduleSeedRetry: 3,
  setTimeout: 4,
  applyDOMFallback: 7,
  forceReprocess: 11,
  MIN_STORAGE_REFRESH_INTERVAL_MS: 2,
  pendingStorageRefreshTimer: 4,
  'storage.onChanged.addListener': 1,
  processInitialDataQueue: 2,
  updateSeedSettings: 2,
  'window.filterTube.updateSettings': 6,
  pendingDataQueue: 5,
  processWithEngine: 3,
  'ytInitialData-reprocess': 1,
  'ytInitialPlayerResponse-reprocess': 1,
  'FilterTubeEngine.processData': 1,
  hasNetworkJsonWork: 4,
  'initialDataQueue = []': 2,
  hasActiveDOMFallbackWork: 1,
  clearStaleDOMFallbackVisibility: 1,
  'runState.pending': 1
};

const zeroPolicyCounts = [
  'settingsRevision',
  'dirtyKeys',
  'activeRuleChanged',
  'domFallbackRequired',
  'jsonReprocessRequired',
  'settingsRefreshConsumerReport',
  'noOpRefreshDecision',
  'consumerRefreshMatrix',
  'metricArtifact'
];

const missingRuntimeSymbols = [
  'settingsRefreshCrossContextConsumerContract',
  'settingsRefreshCrossContextConsumerReport',
  'settingsRefreshRevisionPolicy',
  'settingsRefreshDirtyKeyReport',
  'settingsRefreshDomFallbackBudget',
  'settingsRefreshSeedReplayBudget',
  'settingsRefreshMainWorldCapabilityGate',
  'settingsRefreshProfileScopeReport',
  'settingsRefreshNoOpDecisionReport',
  'settingsRefreshMetricArtifact'
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

function injectorQueueRuntimeBlock() {
  const source = read('js/injector.js');
  const startNeedle = '    function processDataWithFilterLogic(data, dataName) {';
  const endNeedle = '    // Connect to seed.js global object';
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, 'missing injector queue runtime start');
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, 'missing injector queue runtime end');
  return source.slice(start, end);
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

function loadSettingsRefreshInjectorRuntime({ networkJsonWork }) {
  const events = [];
  const windowObject = {
    filterTube: {
      updateSettings(settings) {
        events.push({ type: 'seedUpdate', settings });
      }
    },
    FilterTubeEngine: {
      processData(data, settings, dataName) {
        events.push({ type: 'engineProcess', data, settings, dataName });
        return { processed: dataName };
      }
    }
  };

  const context = {
    __events: events,
    __networkJsonWork: networkJsonWork,
    window: windowObject,
    console: { log() {}, warn() {}, error() {} },
    setTimeout(callback, delay) {
      events.push({ type: 'setTimeout', delay, callback });
      return events.length;
    }
  };
  context.globalThis = context;
  vm.createContext(context);

  const script = [
    'let currentSettings = { enabled: true, listMode: "blocklist", filterKeywords: ["old"] };',
    'let settingsReceived = false;',
    `let initialDataQueue = [
      { name: 'queued-A', process() { globalThis.__events.push({ type: 'queuedProcess', name: 'queued-A' }); processDataWithFilterLogic({ id: 'A' }, 'queued-A'); } },
      { name: 'queued-B', process() { globalThis.__events.push({ type: 'queuedProcess', name: 'queued-B' }); processDataWithFilterLogic({ id: 'B' }, 'queued-B'); } }
    ];`,
    'function postLog(kind, ...args) { globalThis.__events.push({ type: "postLog", kind, args: args.map((value) => String(value)) }); }',
    'function hasNetworkJsonWork(settings) { globalThis.__events.push({ type: "hasNetworkJsonWork", settings }); return globalThis.__networkJsonWork === true; }',
    blockMetric(blockSpecs.injectorSeedUpdate).block,
    injectorQueueRuntimeBlock(),
    'function handleSettingsMessage(event) {',
    '  if (event.source !== window || !event.data) return;',
    '  const { type, payload, source } = event.data;',
    "  if (source === 'injector') return;",
    blockMetric(blockSpecs.injectorSettingsReceiver).block,
    '}',
    'globalThis.__exports = {',
    '  handleSettingsMessage,',
    '  getState() { return { currentSettings, settingsReceived, initialDataQueueLength: initialDataQueue.length }; }',
    '};'
  ].join('\n');

  vm.runInContext(script, context, { filename: 'settings-refresh-injector-runtime.vm.js' });
  return { events, exports: context.__exports, window: windowObject };
}

test('settings refresh cross-context consumer doc records audit-only boundary and source files', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Runtime behavior changed/);
  assert.match(text, /injector no-work JSON gate/);
  assert.match(text, /settings refresh cross-context consumer source files pinned: 7/);
  assert.match(text, /settings refresh cross-context consumer source\/effect blocks pinned: 13/);
  assert.match(text, /settings refresh executable continuation rows: 3/);
  assert.match(text, /background, UI, storage, and page-message entrances/);
  assert.match(text, /whitelist or JSON-first optimization/);

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

test('settings refresh cross-context consumer source/effect blocks remain pinned', () => {
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

test('settings refresh cross-context selected token counts remain current', () => {
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

test('settings refresh cross-context current behavior remains source-derived', () => {
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));
  const text = doc();

  assert.match(blocks.backgroundApplySettingsBranch, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(blocks.backgroundApplySettingsBranch, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(blocks.backgroundApplySettingsBranch, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(blocks.backgroundApplySettingsBranch, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.doesNotMatch(blocks.backgroundApplySettingsBranch, /settingsRevision|dirtyKeys|noOpRefreshDecision|settingsRefreshConsumerReport/);

  assert.match(blocks.backgroundStorageInvalidation, /compiledSettingsCache\.main = null/);
  assert.match(blocks.backgroundStorageInvalidation, /compiledSettingsCache\.kids = null/);
  assert.match(blocks.backgroundStorageInvalidation, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\)/);
  assert.match(blocks.backgroundStorageInvalidation, /getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\)/);

  assert.match(blocks.bridgeRuntimeListener, /request\.action === 'FilterTube_RefreshNow'/);
  assert.match(blocks.bridgeRuntimeListener, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(blocks.bridgeRuntimeListener, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.match(blocks.bridgeRuntimeListener, /request\.action === 'FilterTube_ApplySettings' && request\.settings/);
  assert.match(blocks.bridgeRuntimeListener, /sendSettingsToMainWorld\(normalized\)/);

  assert.match(blocks.bridgeRequestSettings, /action: "getCompiledSettings", profileType, forceRefresh/);
  assert.match(blocks.bridgeRequestSettings, /forceRefresh: true/);
  assert.match(blocks.bridgeRequestSettings, /sendSettingsToMainWorld\(normalized\)/);

  assert.match(blocks.bridgeSeedDelivery, /latestSettings = settings/);
  assert.match(blocks.bridgeSeedDelivery, /currentSettings = settings/);
  assert.match(blocks.bridgeSeedDelivery, /type: 'FilterTube_SettingsToInjector'/);
  assert.match(blocks.bridgeSeedDelivery, /pendingSeedSettings = settings/);
  assert.match(blocks.bridgeSeedDelivery, /window\.addEventListener\('filterTubeSeedReady'/);
  assert.match(blocks.bridgeSeedDelivery, /setTimeout\(\(\) =>/);

  assert.match(read('js/content/bridge_settings.js'), /const MIN_STORAGE_REFRESH_INTERVAL_MS = 250/);
  assert.match(blocks.bridgeStorageRefresh, /requestSettingsFromBackground\(\{ forceRefresh: true \}\)/);
  assert.match(blocks.bridgeStorageRefresh, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(blocks.bridgeStorageRefresh, /forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\)/);

  assert.match(blocks.contentBridgePageRefresh, /type === 'FilterTube_InjectorToBridge_Ready'/);
  assert.match(blocks.contentBridgePageRefresh, /type === 'FilterTube_Refresh'/);
  assert.match(blocks.contentBridgePageRefresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);

  assert.match(blocks.injectorSettingsReceiver, /currentSettings = \{ \.\.\.currentSettings, \.\.\.payload \}/);
  assert.match(blocks.injectorSettingsReceiver, /settingsReceived = true/);
  assert.match(blocks.injectorSettingsReceiver, /updateSeedSettings\(\)/);
  assert.match(blocks.injectorSettingsReceiver, /if \(!hasNetworkJsonWork\(currentSettings\)\) \{\s*initialDataQueue = \[\];\s*return;/);
  assert.match(blocks.injectorSettingsReceiver, /processInitialDataQueue\(\)/);

  assert.match(blocks.injectorSeedUpdate, /window\.filterTube\.updateSettings\(currentSettings\)/);
  assert.match(blocks.injectorSeedUpdate, /setTimeout\(\(\) =>/);
  assert.match(blocks.injectorProcessQueue, /if \(!hasNetworkJsonWork\(currentSettings\)\) \{/);
  assert.match(blocks.injectorProcessQueue, /No active JSON work for \$\{dataName\}; passing through injector hook/);
  assert.match(blocks.injectorProcessQueue, /initialDataQueue = \[\]/);
  assert.match(blocks.injectorProcessQueue, /window\.FilterTubeEngine\.processData\(data, currentSettings, dataName\)/);
  assert.match(blocks.injectorProcessQueue, /initialDataQueue\.shift\(\)/);

  assert.match(blocks.seedUpdateSettings, /cachedSettings = newSettings/);
  assert.match(blocks.seedUpdateSettings, /window\.filterTube\.settings = newSettings/);
  assert.match(blocks.seedUpdateSettings, /pendingDataQueue\.length > 0/);
  assert.match(blocks.seedUpdateSettings, /ytInitialData-reprocess/);
  assert.match(blocks.seedUpdateSettings, /ytInitialPlayerResponse-reprocess/);

  assert.match(blocks.domFallbackApplyHead, /runState\.latestSettings = effectiveSettings/);
  assert.match(blocks.domFallbackApplyHead, /runState\.pending = true/);
  assert.match(blocks.domFallbackApplyHead, /const \{ forceReprocess = false, preserveScroll = true, onlyWhitelistPending = false \} = options/);
  assert.match(blocks.domFallbackApplyHead, /clearStaleDOMFallbackVisibility\(\)/);

  assert.match(blocks.filterLogicGlobalProcess, /this\._harvestChannelData\(data\)/);
  assert.match(blocks.filterLogicGlobalProcess, /this\.settings\.enabled === false/);
  assert.match(blocks.filterLogicGlobalProcess, /const filtered = this\.filter\(data\)/);

  assert.match(text, /queued JSON replay when active JSON work exists/);
  assert.match(text, /stored snapshot reprocess when active JSON work exists/);
  assert.match(text, /off-window and self-source settings messages remain no-ops/);
  assert.match(text, /no-work settings update seed state and clear queued injector data without engine calls/);
  assert.match(text, /active settings update seed state, drain queued injector data, and replay both queued items through `FilterTubeEngine\.processData\(\)`/);

  const ignored = loadSettingsRefreshInjectorRuntime({ networkJsonWork: true });
  ignored.exports.handleSettingsMessage({
    source: {},
    data: {
      type: 'FilterTube_SettingsToInjector',
      source: 'content_bridge',
      payload: { enabled: true, filterKeywords: ['ignored'] }
    }
  });
  ignored.exports.handleSettingsMessage({
    source: ignored.window,
    data: {
      type: 'FilterTube_SettingsToInjector',
      source: 'injector',
      payload: { enabled: true, filterKeywords: ['ignored'] }
    }
  });
  assert.equal(ignored.exports.getState().settingsReceived, false);
  assert.equal(ignored.exports.getState().initialDataQueueLength, 2);
  assert.equal(ignored.events.filter((event) => event.type === 'seedUpdate').length, 0);
  assert.equal(ignored.events.filter((event) => event.type === 'engineProcess').length, 0);

  const noWork = loadSettingsRefreshInjectorRuntime({ networkJsonWork: false });
  noWork.exports.handleSettingsMessage({
    source: noWork.window,
    data: {
      type: 'FilterTube_SettingsToInjector',
      source: 'content_bridge',
      payload: { enabled: true, listMode: 'blocklist', filterKeywords: [], filterChannels: [] }
    }
  });
  assert.equal(noWork.exports.getState().settingsReceived, true);
  assert.equal(noWork.exports.getState().initialDataQueueLength, 0);
  assert.equal(noWork.events.filter((event) => event.type === 'seedUpdate').length, 1);
  assert.equal(noWork.events.filter((event) => event.type === 'queuedProcess').length, 0);
  assert.equal(noWork.events.filter((event) => event.type === 'engineProcess').length, 0);

  const active = loadSettingsRefreshInjectorRuntime({ networkJsonWork: true });
  active.exports.handleSettingsMessage({
    source: active.window,
    data: {
      type: 'FilterTube_SettingsToInjector',
      source: 'content_bridge',
      payload: { enabled: true, listMode: 'blocklist', filterKeywords: ['shakira'], filterChannels: [] }
    }
  });
  assert.equal(active.exports.getState().settingsReceived, true);
  assert.equal(active.exports.getState().initialDataQueueLength, 0);
  assert.equal(active.events.filter((event) => event.type === 'seedUpdate').length, 1);
  assert.deepEqual(active.events.filter((event) => event.type === 'queuedProcess').map((event) => event.name), ['queued-A', 'queued-B']);
  assert.deepEqual(active.events.filter((event) => event.type === 'engineProcess').map((event) => event.dataName), ['queued-A', 'queued-B']);
});

test('settings refresh cross-context future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  assert.match(text, /Settings refresh cross-context consumers still need/);
  assert.match(text, /revision and dirty-key reports/);
  assert.match(text, /DOM fallback and seed replay budgets/);
  assert.match(text, /main-world sender\/capability gates/);
  assert.match(text, /route\/surface JSON-reprocess decisions/);

  for (const symbol of missingRuntimeSymbols) {
    assert.match(text, new RegExp(escapeRegExp(symbol)));
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }

  assert.match(
    text,
    /No `settingsRefreshCrossContextConsumerContract`, `settingsRefreshCrossContextConsumerReport`, `settingsRefreshRevisionPolicy`, `settingsRefreshDirtyKeyReport`, `settingsRefreshDomFallbackBudget`, `settingsRefreshSeedReplayBudget`, `settingsRefreshMainWorldCapabilityGate`, `settingsRefreshProfileScopeReport`, `settingsRefreshNoOpDecisionReport`, or `settingsRefreshMetricArtifact` exists/
  );
});
