import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
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

function initialDataPayload() {
  return {
    contents: {
      twoColumnWatchNextResults: {
        results: {
          results: {
            contents: [{ videoPrimaryInfoRenderer: { title: { runs: [{ text: 'Initial watch payload' }] } } }]
          }
        }
      }
    }
  };
}

function playerPayload() {
  return {
    videoDetails: {
      videoId: 'settings-replay-player-1',
      title: 'Settings replay player',
      channelId: 'UCreplaysettings0000'
    }
  };
}

function loadSeedSettingsRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    processData: [],
    harvestOnly: [],
    jsonStringify: [],
    setTimeout: [],
    postMessage: [],
    dispatchEvent: []
  };
  const timers = [];

  function MockXhr() {}
  MockXhr.prototype.open = function open() {};
  MockXhr.prototype.send = function send() {};
  MockXhr.prototype.addEventListener = function addEventListener() {};
  MockXhr.prototype.removeEventListener = function removeEventListener() {};

  class MockResponse {
    constructor(body) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body);
      this.status = 200;
      this.statusText = 'OK';
      this.headers = {};
      this.ok = true;
    }

    clone() {
      return new MockResponse(this._body);
    }

    async json() {
      return JSON.parse(this._body);
    }
  }

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        if (options.processData) return options.processData(data, activeSettings, dataName);
        return data;
      },
      harvestOnly(data, activeSettings) {
        calls.harvestOnly.push({ settings: clone(activeSettings), data: clone(data) });
      }
    },
    fetch() {
      return Promise.resolve(new MockResponse({ ok: true }));
    },
    XMLHttpRequest: MockXhr,
    postMessage(message, targetOrigin) {
      calls.postMessage.push({ message: clone(message), targetOrigin });
    },
    dispatchEvent(event) {
      calls.dispatchEvent.push(event?.type || '');
    }
  };

  if (options.initialYtInitialData !== undefined) {
    windowObject.ytInitialData = options.initialYtInitialData;
  }
  if (options.initialYtInitialPlayerResponse !== undefined) {
    windowObject.ytInitialPlayerResponse = options.initialYtInitialPlayerResponse;
  }

  const documentObject = {
    location: {
      hostname: options.hostname || 'www.youtube.com',
      pathname: options.pathname || '/watch',
      origin: options.origin || 'https://www.youtube.com'
    },
    documentElement: {
      getAttribute() {
        return null;
      }
    }
  };

  const context = {
    window: windowObject,
    document: documentObject,
    console: {
      log() {},
      debug() {},
      warn() {},
      error() {}
    },
    browser: undefined,
    Request: class Request {},
    Response: MockResponse,
    XMLHttpRequest: MockXhr,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    URL,
    Date,
    Promise,
    WeakMap,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON: {
      parse(text, reviver) {
        return JSON.parse(text, reviver);
      },
      stringify(value, replacer, space) {
        calls.jsonStringify.push(value);
        return JSON.stringify(value, replacer, space);
      }
    },
    structuredClone: clone,
    setTimeout(callback, delay) {
      timers.push(callback);
      calls.setTimeout.push({ delay });
      return timers.length;
    },
    clearTimeout() {}
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: path.join(repoRoot, 'js', 'seed.js') });

  return { context, window: context.window, calls, timers };
}

test('seed settings replay provenance audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for seed settings replay authority/);

  for (const [file, lines, bytes, hash] of [
    ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
    ['js/content/bridge_settings.js',  1113,  44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
    ['js/injector.js', 3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
    ['js/state_manager.js', 2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
    ['js/background.js', 6657, 299580, 'f05fe6f65f9de1218299374ac3c82dd6b6ae9e17e3d862926a20e6c2981c19c7']
  ]) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`| \`${file}\` | ${lines} | ${bytes} | \`${hash}\` |`));
  }
});

test('seed settings replay source relay blocks remain pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');
  const bridge = read('js/content/bridge_settings.js');
  const injector = read('js/injector.js');
  const state = read('js/state_manager.js');
  const background = read('js/background.js');

  const blocks = {
    seedUpdate: sliceBetween(seed, '    function updateSettings(newSettings) {', '    // ============================================================================\n    // GLOBAL INTERFACE'),
    seedInterface: sliceBetween(seed, '    // Create global FilterTube object for inter-script communication', '    // ============================================================================\n    // INITIALIZATION'),
    bridgeApplyMessage: sliceBetween(bridge, "        } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {", '    });\n}'),
    bridgeSeedRelay: sliceBetween(bridge, 'function tryApplySettingsToSeed(settings) {', 'let pendingStorageRefreshTimer = 0;'),
    injectorSeedRelay: sliceBetween(injector, '    // Function to update seed.js settings', "    // Set up additional data hooks if seed.js didn"),
    stateBroadcast: sliceBetween(state, "    function broadcastSettings(compiledSettings, profile = 'main') {", '    /**\n     * Explicitly request background'),
    backgroundApply: sliceBetween(background, '    } else if (request.action === "FilterTube_ApplySettings" && request.settings) {', '    } else if (request.action === "updateChannelMap")')
  };

  for (const [name, expectedLines, expectedBytes] of [
    ['seedUpdate', 98, 4640],
    ['seedInterface', 25, 867],
    ['bridgeApplyMessage', 33, 1454],
    ['bridgeSeedRelay', 51, 1335],
    ['injectorSeedRelay', 115, 4346],
    ['stateBroadcast', 11, 309],
    ['backgroundApply', 28, 1487]
  ]) {
    assert.equal(lineCount(blocks[name]), expectedLines, `${name} line count changed`);
    assert.equal(Buffer.byteLength(blocks[name]), expectedBytes, `${name} byte count changed`);
  }

  for (const [literal, expected] of [
    ['cachedSettings = newSettings', 1],
    ['window.filterTube.settings = newSettings', 1],
    ['pendingDataQueue', 5],
    ['cloneData', 7],
    ['processWithEngine', 3],
    ['-queued', 1],
    ['window.ytInitialData = processed', 1],
    ['window.ytInitialPlayerResponse = processed', 1],
    ['rawYtInitialData', 6],
    ['rawYtInitialPlayerResponse', 6],
    ['ytInitialData-reprocess', 1],
    ['ytInitialPlayerResponse-reprocess', 1],
    ['settingsRevision', 0],
    ['dirtyKeys', 0]
  ]) {
    assert.equal(countLiteral(blocks.seedUpdate, literal), expected, `seed updateSettings ${literal} changed`);
  }

  for (const [blockName, literal, expected] of [
    ['bridgeApplyMessage', 'FilterTube_ApplySettings', 1],
    ['bridgeApplyMessage', 'requestSettingsFromBackground', 1],
    ['bridgeApplyMessage', 'sendSettingsToMainWorld', 1],
    ['bridgeApplyMessage', 'applyDOMFallback', 2],
    ['bridgeSeedRelay', 'updateSettings', 2],
    ['bridgeSeedRelay', 'filterTubeSeedReady', 1],
    ['bridgeSeedRelay', 'setTimeout', 1],
    ['bridgeSeedRelay', 'pendingSeedSettings', 6],
    ['bridgeSeedRelay', 'scheduleSeedRetry', 3],
    ['bridgeSeedRelay', 'postMessage', 1],
    ['injectorSeedRelay', 'updateSettings', 6],
    ['injectorSeedRelay', 'setTimeout', 2],
    ['stateBroadcast', 'FilterTube_ApplySettings', 1],
    ['backgroundApply', 'FilterTube_ApplySettings', 2],
    ['backgroundApply', 'compiledSettingsCache', 2],
    ['backgroundApply', 'getCompiledSettings', 1],
    ['backgroundApply', 'sendMessageToTabQuietly', 1]
  ]) {
    assert.equal(countLiteral(blocks[blockName], literal), expected, `${blockName} ${literal} count changed`);
  }

  for (const phrase of [
    'seed settings replay provenance source files: 5',
    'seed updateSettings block lines: 98',
    'bridge apply-settings message block lines: 33',
    'bridge seed relay block lines: 51',
    'injector seed relay block lines: 115',
    'StateManager broadcastSettings block lines: 11',
    'background apply-settings block lines: 28',
    'runtime seed settings replay provenance fixtures: 5'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('first settings update drains queued globals without duplicate raw snapshot replay', () => {
  const runtime = loadSeedSettingsRuntime({
    initialYtInitialData: initialDataPayload(),
    initialYtInitialPlayerResponse: playerPayload()
  });
  const activeSettings = settings({ filterKeywords: [{ pattern: 'replay', flags: 'i' }] });

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 2);
  assert.equal(runtime.calls.processData.length, 0);

  runtime.window.filterTube.updateSettings(activeSettings);

  assert.equal(runtime.window.filterTube.settings, activeSettings);
  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), [
    'ytInitialData-existing-queued',
    'ytInitialData',
    'ytInitialPlayerResponse-existing-queued',
    'ytInitialPlayerResponse'
  ]);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('duplicate active settings update replays last processed snapshots when JSON work remains active', () => {
  const runtime = loadSeedSettingsRuntime({
    initialYtInitialData: initialDataPayload(),
    initialYtInitialPlayerResponse: playerPayload()
  });

  runtime.window.filterTube.updateSettings(settings({ filterKeywords: [{ pattern: 'one', flags: 'i' }] }));
  const firstNames = runtime.calls.processData.map((call) => call.dataName);
  assert.equal(firstNames.filter((name) => name.endsWith('-reprocess')).length, 0);

  const equivalentSettings = settings({ filterKeywords: [{ pattern: 'one', flags: 'i' }] });
  runtime.window.filterTube.updateSettings(equivalentSettings);

  assert.equal(runtime.window.filterTube.settings, equivalentSettings);
  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName).slice(firstNames.length), [
    'ytInitialData-reprocess',
    'ytInitialData',
    'ytInitialPlayerResponse-reprocess',
    'ytInitialPlayerResponse'
  ]);
  assert.equal(runtime.calls.processData.length, 8);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('public raw snapshot fields can trigger settings replay when closure raw snapshots are absent', () => {
  const runtime = loadSeedSettingsRuntime();

  runtime.window.filterTube.rawYtInitialData = initialDataPayload();
  runtime.window.filterTube.rawYtInitialPlayerResponse = playerPayload();

  runtime.window.filterTube.updateSettings(settings({ filterChannels: [{ id: 'UCreplaysettings0000' }] }));

  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), [
    'ytInitialData-reprocess',
    'ytInitialData',
    'ytInitialPlayerResponse-reprocess',
    'ytInitialPlayerResponse'
  ]);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
  assert.equal(runtime.window.filterTube.getStats().lastPlayerData, true);
});

test('disabled settings update clears public raw snapshots without engine replay', () => {
  const runtime = loadSeedSettingsRuntime();

  runtime.window.filterTube.rawYtInitialData = initialDataPayload();
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.rawYtInitialData, null);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, false);
  assert.equal(runtime.window.filterTube.settings.enabled, false);
});

test('settings relay source keeps split bridge injector StateManager and background replay owners', () => {
  const bridge = read('js/content/bridge_settings.js');
  const injector = read('js/injector.js');
  const state = read('js/state_manager.js');
  const background = read('js/background.js');
  const doc = read(docPath);

  assert.match(bridge, /pendingSeedSettings = settings/);
  assert.match(bridge, /window\.addEventListener\('filterTubeSeedReady'/);
  assert.match(bridge, /scheduleSeedRetry\(\)/);
  assert.match(bridge, /window\.postMessage\(\{\s*type: 'FilterTube_SettingsToInjector'/);
  assert.match(injector, /function updateSeedSettings\(\)/);
  assert.match(injector, /window\.filterTube\.updateSettings\(currentSettings\)/);
  assert.match(injector, /setTimeout\(\(\) => \{/);
  assert.match(state, /action: 'FilterTube_ApplySettings'/);
  assert.match(background, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(background, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(background, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(background, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.match(doc, /Bridge\/injector owner split report/);
  assert.match(doc, /Sender class, revision, dirty-key, and cache provenance policy/);
});

test('product runtime still lacks seed settings replay authority symbols', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of [
    'seedSettingsReplayProvenanceContract',
    'seedSettingsReplayDecisionReport',
    'seedSettingsRevisionReport',
    'seedSettingsDirtyKeyPolicy',
    'seedSettingsQueueDrainBudget',
    'seedSettingsRawSnapshotReplayPolicy',
    'seedSettingsSetterReentryGuard',
    'seedSettingsRelayOwnerReport',
    'seedSettingsDuplicateDeliveryPolicy',
    'seedSettingsReplayFixtureProvenance',
    'seedSettingsReplayMetricArtifact'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(doc.includes(symbol), `${symbol} missing from audit doc`);
  }
});
