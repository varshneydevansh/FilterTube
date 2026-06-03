import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sourcePath = path.join(repoRoot, 'js/content/bridge_settings.js');
const docPath = path.join(repoRoot, 'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_LISTENER_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `missing start anchor ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing end anchor ${end}`);
  return text.slice(startIndex, endIndex);
}

function lineCount(text) {
  return text.split('\n').length;
}

function byteCount(text) {
  return Buffer.byteLength(text);
}

function makeBridgeRuntime({ hostname = 'www.youtube.com' } = {}) {
  const source = read(sourcePath);
  const calls = {
    addEventListener: [],
    postMessage: [],
    runtimeSendMessage: [],
    runtimeListeners: [],
    storageListeners: [],
    applyDOMFallback: [],
    debugLog: [],
    setTimeout: [],
    clearTimeout: [],
    seedUpdates: []
  };
  let now = 1000;
  let timerId = 0;
  const timers = new Map();
  const listeners = new Map();

  const windowObject = {
    pendingSubscriptionImportRequests: new Map(),
    subscriptionImportRequestId: 0,
    __filtertubeMainWorldImportBridgeReady: false,
    __filtertubeMainWorldSubscriptionsImportReady: false,
    __filtertubeMainWorldBridgeWaiters: new Set(),
    __filtertubeMainWorldImportCapabilityWaiters: new Set(),
    addEventListener(type, listener) {
      calls.addEventListener.push({ type, listener });
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event?.type;
      for (const listener of listeners.get(type) || []) {
        listener(event || { type });
      }
    },
    postMessage(message, targetOrigin) {
      calls.postMessage.push({ message, targetOrigin });
    }
  };
  windowObject.window = windowObject;

  const runtime = {
    id: 'runtime-id',
    lastError: null,
    onMessage: {
      addListener(listener) {
        calls.runtimeListeners.push(listener);
      }
    },
    sendMessage(payload, callback) {
      calls.runtimeSendMessage.push(payload);
      const response = {
        enabled: true,
        profileType: payload?.profileType || 'main',
        listMode: 'blocklist',
        filterChannels: [],
        filterKeywords: [],
        whitelistChannels: [],
        whitelistKeywords: []
      };
      callback?.(response);
    }
  };

  const storage = {
    onChanged: {
      addListener(listener) {
        calls.storageListeners.push(listener);
      }
    }
  };

  const context = vm.createContext({
    window: windowObject,
    browserAPI_BRIDGE: { runtime, storage },
    debugLog(...args) {
      calls.debugLog.push(args);
    },
    applyDOMFallback(settings, options) {
      calls.applyDOMFallback.push({ settings, options });
    },
    injectMainWorldScripts() {
      return Promise.resolve(true);
    },
    document: {
      readyState: 'complete',
      documentElement: {
        getAttribute() {
          return '';
        }
      }
    },
    location: {
      hostname,
      pathname: '/watch',
      href: `https://${hostname}/watch?v=abc`
    },
    console,
    currentSettings: null,
    latestSettings: null,
    setTimeout(callback, delay) {
      const id = ++timerId;
      calls.setTimeout.push({ id, delay, callback });
      timers.set(id, { callback, delay, cleared: false });
      return id;
    },
    clearTimeout(id) {
      calls.clearTimeout.push(id);
      const timer = timers.get(id);
      if (timer) timer.cleared = true;
    },
    Date: {
      now() {
        return now;
      }
    },
    Math,
    Map,
    Set,
    Promise,
    String,
    Number,
    parseInt,
    isFinite,
    RegExp,
    Error,
    TypeError,
    Object,
    Array
  });

  vm.runInContext(source, context, { filename: sourcePath });

  return {
    calls,
    context,
    timers,
    window: windowObject,
    setNow(value) {
      now = value;
    },
    runTimer(id) {
      const timer = timers.get(id);
      assert.ok(timer, `missing timer ${id}`);
      timer.callback();
    },
    eval(expression) {
      return vm.runInContext(expression, context);
    },
    sendSettings(settings) {
      context.__testSettings = settings;
      return vm.runInContext('sendSettingsToMainWorld(__testSettings)', context);
    }
  };
}

test('bridge settings listener/timer audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const source = read(sourcePath);

  assert.match(doc, /Status: audit-only/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not completion proof for bridge settings listener\/timer authority/);
  assert.match(doc, /promote the bridge settings layer to a first-class JSON filter authority/);
  assert.equal(source.split('\n').length, 652);
  assert.equal(fs.statSync(sourcePath).size, 26462);
  assert.equal(sha256(source), 'c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b');
});

test('bridge settings listener/timer source counts remain pinned', () => {
  const doc = read(docPath);
  const source = read(sourcePath);
  const blocks = {
    waiterCluster: sliceBetween(source, 'function markMainWorldImportBridgeReady()', 'if (typeof globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld'),
    subscriptionRequest: sliceBetween(source, 'if (typeof globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld', 'if (!window.__filtertubeSubscriptionImportMessageListenerAttached)'),
    messageListener: sliceBetween(source, 'if (!window.__filtertubeSubscriptionImportMessageListenerAttached)', 'if (window.__filtertubeRuntimeBridgeListenerAttached !== true)'),
    runtimeListener: sliceBetween(source, 'if (window.__filtertubeRuntimeBridgeListenerAttached !== true)', 'let pendingSeedSettings = null;'),
    seedRelay: sliceBetween(source, 'let pendingSeedSettings = null;', 'let pendingStorageRefreshTimer = 0;'),
    storageRefresh: sliceBetween(source, 'let pendingStorageRefreshTimer = 0;', 'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'),
    storageListener: sliceBetween(source, 'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);', '\n} catch (e) { }') + '\n} catch (e) { }'
  };

  const expectedBlockMetrics = [
    ['waiter cluster block', blocks.waiterCluster, 71, 2340],
    ['subscription request block', blocks.subscriptionRequest, 43, 1942],
    ['subscription message listener block', blocks.messageListener, 53, 2299],
    ['runtime listener block', blocks.runtimeListener, 122, 5701],
    ['seed relay cluster block', blocks.seedRelay, 201, 8139],
    ['storage refresh cluster block', blocks.storageRefresh, 131, 4506],
    ['storage listener registration block', blocks.storageListener, 3, 96]
  ];

  for (const [label, block, lines, bytes] of expectedBlockMetrics) {
    assert.equal(lineCount(block), lines, `${label} lines drifted`);
    assert.equal(byteCount(block), bytes, `${label} bytes drifted`);
    assert.match(doc, new RegExp(`${label} lines: ${lines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${bytes}`));
  }

  const expectedCounts = {
    addEventListener: 2,
    'runtime.onMessage.addListener': 1,
    'storage.onChanged.addListener': 1,
    removeEventListener: 0,
    removeListener: 0,
    setTimeout: 6,
    clearTimeout: 2,
    pendingSeedSettings: 7,
    seedListenerAttached: 3,
    filterTubeSeedReady: 1,
    scheduleSeedRetry: 3,
    pendingStorageRefreshTimer: 5,
    MIN_STORAGE_REFRESH_INTERVAL_MS: 3,
    handleStorageChanges: 2,
    relevantKeys: 2,
    forceRefresh: 6,
    FilterTube_ApplySettings: 1,
    FilterTube_Ping: 1,
    FilterTube_ImportSubscribedChannels: 1,
    waitForMainWorldImportBridgeReady: 3,
    waitForMainWorldSubscriptionsImportReady: 3
  };

  for (const [token, expected] of Object.entries(expectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count drifted`);
  }

  for (const phrase of [
    'bridge settings listener/timer source files: 1',
    'runtime bridge settings listener/timer fixtures: 6',
    'storage admission executable continuation rows: 5',
    'setTimeout tokens: 6',
    'clearTimeout tokens: 2',
    'removeEventListener tokens: 0',
    'removeListener tokens: 0'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('initial bridge settings load installs guarded message runtime and storage listeners', () => {
  const runtime = makeBridgeRuntime();

  assert.equal(runtime.calls.addEventListener.filter(entry => entry.type === 'message').length, 1);
  assert.equal(runtime.calls.addEventListener.filter(entry => entry.type === 'filterTubeSeedReady').length, 0);
  assert.equal(runtime.calls.runtimeListeners.length, 1);
  assert.equal(runtime.calls.storageListeners.length, 1);
  assert.equal(runtime.window.__filtertubeSubscriptionImportMessageListenerAttached, true);
  assert.equal(runtime.window.__filtertubeRuntimeBridgeListenerAttached, true);
});

test('main-world readiness waiters resolve from injector messages while timeout remains armed', async () => {
  const runtime = makeBridgeRuntime();
  const promise = runtime.eval('waitForMainWorldImportBridgeReady(100)');

  assert.equal(runtime.calls.setTimeout.length, 1);
  assert.equal(runtime.calls.setTimeout[0].delay, 250);

  runtime.window.dispatchEvent({
    type: 'message',
    source: runtime.window,
    data: { source: 'injector', type: 'FilterTube_InjectorBridgeReady', payload: {} }
  });

  assert.equal(await promise, true);
  assert.equal(runtime.window.__filtertubeMainWorldBridgeWaiters.size, 0);
  assert.equal(runtime.calls.clearTimeout.length, 0);

  runtime.runTimer(runtime.calls.setTimeout[0].id);
  assert.equal(runtime.window.__filtertubeMainWorldBridgeWaiters.size, 0);
});

test('settings sent before seed readiness attach one ready listener but can schedule multiple retry timers', () => {
  const runtime = makeBridgeRuntime();

  runtime.sendSettings({ enabled: true, revision: 1 });
  runtime.sendSettings({ enabled: true, revision: 2 });

  assert.equal(runtime.calls.postMessage.length, 2);
  assert.equal(runtime.calls.postMessage[0].message.type, 'FilterTube_SettingsToInjector');
  assert.equal(runtime.calls.addEventListener.filter(entry => entry.type === 'filterTubeSeedReady').length, 1);
  assert.equal(runtime.calls.setTimeout.filter(entry => entry.delay === 250).length, 2);
  assert.deepEqual(runtime.eval('pendingSeedSettings'), { enabled: true, revision: 2 });

  runtime.window.filterTube = {
    updateSettings(settings) {
      runtime.calls.seedUpdates.push(settings);
    }
  };
  runtime.window.dispatchEvent({ type: 'filterTubeSeedReady' });

  assert.deepEqual(runtime.calls.seedUpdates, [{ enabled: true, revision: 2 }]);
  assert.equal(runtime.eval('pendingSeedSettings'), null);
});

test('seed retry timer recursively reschedules until seed update succeeds', () => {
  const runtime = makeBridgeRuntime();

  runtime.sendSettings({ enabled: true, revision: 'retry' });
  assert.equal(runtime.calls.setTimeout.length, 1);
  runtime.runTimer(runtime.calls.setTimeout[0].id);

  assert.equal(runtime.calls.setTimeout.length, 2);
  assert.equal(runtime.calls.setTimeout[1].delay, 250);
  assert.deepEqual(runtime.eval('pendingSeedSettings'), { enabled: true, revision: 'retry' });

  runtime.window.filterTube = {
    updateSettings(settings) {
      runtime.calls.seedUpdates.push(settings);
    }
  };
  runtime.runTimer(runtime.calls.setTimeout[1].id);

  assert.deepEqual(runtime.calls.seedUpdates, [{ enabled: true, revision: 'retry' }]);
  assert.equal(runtime.eval('pendingSeedSettings'), null);
});

test('storage refresh immediately force-refreshes then coalesces relevant changes into one timer', async () => {
  const runtime = makeBridgeRuntime();
  runtime.window.filterTube = {
    updateSettings(settings) {
      runtime.calls.seedUpdates.push(settings);
    }
  };
  const storageListener = runtime.calls.storageListeners[0];

  storageListener({ channelMap: { newValue: {} } }, 'local');
  storageListener({ enabled: { newValue: false } }, 'sync');
  assert.equal(runtime.calls.runtimeSendMessage.length, 0);
  assert.equal(runtime.calls.setTimeout.length, 0);

  storageListener({ enabled: { newValue: false } }, 'local');
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(runtime.calls.runtimeSendMessage.length, 1);
  assert.equal(runtime.calls.runtimeSendMessage[0].action, 'getCompiledSettings');
  assert.equal(runtime.calls.runtimeSendMessage[0].profileType, 'main');
  assert.equal(runtime.calls.runtimeSendMessage[0].forceRefresh, true);
  assert.equal(runtime.calls.applyDOMFallback.length, 1);
  assert.equal(runtime.calls.applyDOMFallback[0].options.forceReprocess, true);

  storageListener({ videoMetaMap: { newValue: {} } }, 'local');
  assert.equal(runtime.calls.setTimeout.at(-1).delay, 250);
  const delayedTimerId = runtime.calls.setTimeout.at(-1).id;

  runtime.runTimer(delayedTimerId);
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(runtime.calls.runtimeSendMessage.length, 2);
  assert.equal(runtime.calls.applyDOMFallback.at(-1).options.forceReprocess, false);

  runtime.setNow(1100);
  storageListener({ videoChannelMap: { newValue: {} } }, 'local');
  assert.equal(runtime.calls.setTimeout.at(-1).delay, 150);
  const mixedTimerId = runtime.calls.setTimeout.at(-1).id;

  storageListener({ filterKeywords: { newValue: ['shakira'] } }, 'local');
  assert.equal(runtime.calls.setTimeout.at(-1).id, mixedTimerId);

  runtime.runTimer(mixedTimerId);
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(runtime.calls.runtimeSendMessage.length, 3);
  assert.equal(runtime.calls.applyDOMFallback.at(-1).options.forceReprocess, true);
});

test('subscription import progress rearms timeout and final response clears pending request', () => {
  const runtime = makeBridgeRuntime();
  const importer = runtime.context.FilterTubeRequestSubscribedChannelsFromMainWorld;
  assert.equal(typeof importer, 'function');

  const promise = importer({ timeoutMs: 6000, maxChannels: 10, pageDelayMs: 75 });
  assert.equal(runtime.window.pendingSubscriptionImportRequests.size, 1);
  const requestId = runtime.window.subscriptionImportRequestId;
  const firstTimeout = runtime.window.pendingSubscriptionImportRequests.get(requestId).timeoutId;

  runtime.window.dispatchEvent({
    type: 'message',
    source: runtime.window,
    data: {
      source: 'injector',
      type: 'FilterTube_SubscriptionsImportProgress',
      payload: { requestId, count: 1 }
    }
  });

  const secondTimeout = runtime.window.pendingSubscriptionImportRequests.get(requestId).timeoutId;
  assert.notEqual(secondTimeout, firstTimeout);
  assert.ok(runtime.calls.clearTimeout.includes(firstTimeout));

  runtime.window.dispatchEvent({
    type: 'message',
    source: runtime.window,
    data: {
      source: 'injector',
      type: 'FilterTube_SubscriptionsImportResponse',
      payload: { requestId, success: true, channels: [{ name: 'A' }] }
    }
  });

  assert.equal(runtime.window.pendingSubscriptionImportRequests.size, 0);
  assert.ok(runtime.calls.clearTimeout.includes(secondTimeout));
  return promise.then(result => {
    assert.deepEqual(result, { requestId, success: true, channels: [{ name: 'A' }] });
  });
});

test('product runtime still lacks bridge settings listener/timer authority symbols', () => {
  const result = spawnSync('rg', [
    '-n',
    'bridgeSettingsListenerTimerContract|bridgeSettingsSeedRetryBudgetReport|bridgeSettingsSeedReadyListenerOwnerReport|bridgeSettingsStorageRefreshDecisionReport|bridgeSettingsStorageListenerTeardownReport|bridgeSettingsReadinessTimeoutBudget|bridgeSettingsSubscriptionRequestLifecycleReport|bridgeSettingsRuntimeMessageDecisionReport|bridgeSettingsFixtureProvenance|bridgeSettingsMetricArtifact',
    'js',
    'website',
    'manifest.json'
  ], { cwd: repoRoot, encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), '');
  assert.equal(result.stderr.trim(), '');
});
