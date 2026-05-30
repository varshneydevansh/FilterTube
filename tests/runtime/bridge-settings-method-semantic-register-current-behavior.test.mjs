import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/bridge_settings.js';
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function broadCallableRows() {
  const source = read(sourcePath);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function groupForRow(row) {
  if ([
    'markMainWorldImportBridgeReady',
    'markMainWorldSubscriptionsImportReady',
    'waitForMainWorldImportBridgeReady',
    'waitForMainWorldSubscriptionsImportReady'
  ].includes(row.name)) {
    return 'bridgeSettingsImportReadinessWaiters';
  }
  if (row.name === 'finish' && [69, 92].includes(row.line)) {
    return 'bridgeSettingsImportReadinessWaiters';
  }
  if ([
    'requestSubscribedChannelsFromMainWorld',
    'armTimeout'
  ].includes(row.name)) {
    return 'bridgeSettingsSubscriptionImportRequest';
  }
  if (row.name === 'expectedProfile') {
    return 'bridgeSettingsRuntimeActionProfileGate';
  }
  if (row.name === 'normalizeSettingsForHost' || (row.name === 'debugEnabled' && row.line === 336)) {
    return 'bridgeSettingsHostNormalization';
  }
  if ([
    'requestSettingsFromBackground',
    'safeResolveFailure',
    'sendRuntimeMessage',
    'profileType',
    'host'
  ].includes(row.name) || (row.name === 'debugEnabled' && row.line === 416)) {
    return 'bridgeSettingsBackgroundFetchAndDebug';
  }
  if ([
    'tryApplySettingsToSeed',
    'ensureSeedReadyListener',
    'scheduleSeedRetry',
    'sendSettingsToMainWorld',
    'refreshRuntimeObserversAfterSettingsUpdate'
  ].includes(row.name)) {
    return 'bridgeSettingsSeedRelayLifecycle';
  }
  if ([
    'scheduleSettingsRefreshFromStorage',
    'handleStorageChanges'
  ].includes(row.name)) {
    return 'bridgeSettingsStorageRefreshFanout';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'function', name: match[1] });
      return;
    }
    match = line.match(/=\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'functionExpression', name: match[1] });
      return;
    }
    match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\(\)\s*=>/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'constIifeResult', name: match[1] });
      return;
    }
    match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?[^=]*?\)?\s*=>/);
    if (match) {
      rows.push({ line: lineNumber, kind: line.includes('async') ? 'constAsyncArrow' : 'constArrow', name: match[1] });
    }
  });
  return rows.map((row) => ({ ...row, group: groupForRow(row) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function isMapLike(value) {
  return Boolean(value)
    && typeof value.get === 'function'
    && typeof value.set === 'function'
    && typeof value.delete === 'function'
    && typeof value.clear === 'function'
    && typeof value.size === 'number';
}

function isSetLike(value) {
  return Boolean(value)
    && typeof value.add === 'function'
    && typeof value.delete === 'function'
    && typeof value.clear === 'function'
    && typeof value.size === 'number';
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createBridgeSettingsRuntime({ hostname = 'www.youtube.com', runtimeResponses = [] } = {}) {
  const events = {
    windowListeners: {},
    runtimeListeners: [],
    storageListeners: [],
    postMessages: [],
    runtimeMessages: [],
    timers: new Map(),
    clearedTimers: [],
    domFallbacks: [],
    seedUpdates: [],
    debugLogs: [],
    consoleLogs: [],
    consoleWarns: []
  };
  let timerId = 0;
  const context = {
    console: {
      log: (...args) => events.consoleLogs.push(args),
      warn: (...args) => events.consoleWarns.push(args)
    },
    __filtertubeTestWindowListeners: events.windowListeners,
    __filtertubeTestMessageData: null,
    location: {
      hostname,
      pathname: '/watch',
      href: `https://${hostname}/watch?v=abc`
    },
    document: {
      readyState: 'complete',
      documentElement: {
        getAttribute(name) {
          return this.attrs?.[name] || null;
        },
        attrs: {}
      }
    },
    browserAPI_BRIDGE: {
      runtime: {
        id: 'filtertube-test-extension',
        lastError: null,
        onMessage: {
          addListener(listener) {
            events.runtimeListeners.push(listener);
          }
        },
        sendMessage(payload, callback) {
          events.runtimeMessages.push(payload);
          const response = runtimeResponses.length
            ? runtimeResponses.shift()
            : { enabled: true, profileType: payload.profileType, listMode: 'blocklist' };
          callback?.(response);
        }
      },
      storage: {
        onChanged: {
          addListener(listener) {
            events.storageListeners.push(listener);
          }
        }
      }
    },
    debugLog: (...args) => events.debugLogs.push(args),
    applyDOMFallback(settings, options) {
      events.domFallbacks.push({ settings, options });
    },
    addEventListener(type, listener) {
      if (!events.windowListeners[type]) events.windowListeners[type] = [];
      events.windowListeners[type].push(listener);
    },
    postMessage(message, target) {
      events.postMessages.push({ message, target });
    },
    setTimeout(callback, delay) {
      const id = ++timerId;
      events.timers.set(id, { callback, delay, cleared: false });
      return id;
    },
    clearTimeout(id) {
      events.clearedTimers.push(id);
      const timer = events.timers.get(id);
      if (timer) timer.cleared = true;
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);

  return {
    context,
    events,
    dispatchWindowMessage(data) {
      context.__filtertubeTestMessageData = data;
      vm.runInContext(
        'for (const listener of (__filtertubeTestWindowListeners.message || [])) listener({ source: window, data: __filtertubeTestMessageData });',
        context
      );
    },
    async flush() {
      await Promise.resolve();
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
}

test('bridge settings method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content\/bridge_settings\.js/);
  assert.match(text, /line count: 651/);
  assert.equal(sourceLineCount(), 651);
  assert.match(text, /source bytes: 26462/);
  assert.equal(readBuffer(sourcePath).byteLength, 26462);
  assert.match(text, /source sha256: c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b/);
  assert.equal(sha256(sourcePath), 'c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b');
  assert.match(text, /repo-wide broad parser lexical callable matches: 65/);
  assert.match(text, /broad parser runtime callable\/declaration matches: 23/);
  assert.match(text, /assignment-expression function declarations outside broad parser: 1/);
  assert.match(text, /control-flow lexical artifacts: 42/);
  assert.match(text, /file-local executable proof probes: 5/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named method\/helper\/callback declarations in scope: 24/);
  assert.match(text, /plain function declarations: 13/);
  assert.match(text, /named function expression declarations: 1/);
  assert.match(text, /const helper\/callback declarations: 10/);
  assert.match(text, /const arrow helper\/callback declarations: 5/);
  assert.match(text, /const IIFE result declarations: 5/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /async const arrow declarations: 0/);
  assert.match(text, /arrow callback sites in scope: 39/);
  assert.match(text, /semantic method groups: 7/);
  assert.match(text, /browser\/global export: globalThis\.FilterTubeRequestSubscribedChannelsFromMainWorld/);
  assert.match(text, /CommonJS export: none/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for settings revision authority/);
});

test('bridge settings method register accounts for every current declaration row', () => {
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadRuntimeNames = new Set([
    'markMainWorldImportBridgeReady',
    'markMainWorldSubscriptionsImportReady',
    'waitForMainWorldImportBridgeReady',
    'waitForMainWorldSubscriptionsImportReady',
    'finish',
    'armTimeout',
    'expectedProfile',
    'normalizeSettingsForHost',
    'debugEnabled',
    'requestSettingsFromBackground',
    'safeResolveFailure',
    'sendRuntimeMessage',
    'profileType',
    'host',
    'tryApplySettingsToSeed',
    'ensureSeedReadyListener',
    'scheduleSeedRetry',
    'sendSettingsToMainWorld',
    'refreshRuntimeObserversAfterSettingsUpdate',
    'scheduleSettingsRefreshFromStorage',
    'handleStorageChanges'
  ]);

  assert.equal(rows.length, 24);
  assert.equal(broadRows.length, 65);
  assert.equal(broadRows.filter((name) => broadRuntimeNames.has(name)).length, 23);
  assert.equal(broadRows.filter((name) => name === 'if').length, 42);
  assert.equal(broadRows.includes('requestSubscribedChannelsFromMainWorld'), false);
  assert.deepEqual(countBy(rows, 'kind'), {
    constArrow: 5,
    constIifeResult: 5,
    function: 13,
    functionExpression: 1
  });
  assert.deepEqual(countBy(rows, 'group'), {
    bridgeSettingsBackgroundFetchAndDebug: 6,
    bridgeSettingsHostNormalization: 2,
    bridgeSettingsImportReadinessWaiters: 6,
    bridgeSettingsRuntimeActionProfileGate: 1,
    bridgeSettingsSeedRelayLifecycle: 5,
    bridgeSettingsStorageRefreshFanout: 2,
    bridgeSettingsSubscriptionImportRequest: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }

  const text = doc();
  assert.match(text, /## Lexical Callable Reconciliation/);
  assert.match(text, /\| Plain function declarations \| 13 \| yes \|/);
  assert.match(text, /\| Const arrow\/IIFE helpers \| 10 \| yes \|/);
  assert.match(text, /\| Assignment function expression \| 1 \| yes, outside broad parser \|/);
  assert.match(text, /\| `if` artifacts \| 42 \| no \|/);
  assert.match(text, /does not promote the global method\s+proof count/);
});

test('bridge settings method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing bridge settings method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('bridge settings register pins message lifecycle settings and storage counts', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.equal(countRegex(source, /=>/g), 39);
  assert.equal(countLiteral(source, 'document'), 5);
  assert.equal(countLiteral(source, 'window'), 61);
  assert.equal(countLiteral(source, 'location'), 6);
  assert.equal(countLiteral(source, 'globalThis'), 3);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE'), 9);
  assert.equal(countLiteral(source, 'currentSettings'), 2);
  assert.equal(countLiteral(source, 'latestSettings'), 1);
  assert.equal(countLiteral(source, 'pendingSubscriptionImportRequests'), 10);
  assert.equal(countLiteral(source, 'subscriptionImportRequestId'), 4);
  assert.equal(countLiteral(source, '__filtertubeMainWorldImportBridgeReady'), 5);
  assert.equal(countLiteral(source, '__filtertubeMainWorldSubscriptionsImportReady'), 5);
  assert.equal(countLiteral(source, '__filtertubeMainWorldBridgeWaiters'), 8);
  assert.equal(countLiteral(source, '__filtertubeMainWorldImportCapabilityWaiters'), 8);
  assert.equal(countLiteral(source, 'FilterTubeRequestSubscribedChannelsFromMainWorld'), 3);
  assert.equal(countLiteral(source, 'FilterTube_RequestSubscriptionImport'), 1);
  assert.equal(countLiteral(source, 'FilterTube_SubscriptionsImportProgress'), 2);
  assert.equal(countLiteral(source, 'FilterTube_SubscriptionsImportResponse'), 1);
  assert.equal(countLiteral(source, 'FilterTube_InjectorBridgeReady'), 1);
  assert.equal(countLiteral(source, 'FilterTube_InjectorToBridge_Ready'), 1);
  assert.equal(countLiteral(source, 'FilterTube_SubscriptionsImportBridgeReady'), 1);
  assert.equal(countLiteral(source, 'FilterTube_Ping'), 1);
  assert.equal(countLiteral(source, 'FilterTube_RefreshNow'), 1);
  assert.equal(countLiteral(source, 'FilterTube_ImportSubscribedChannels'), 1);
  assert.equal(countLiteral(source, 'FilterTube_ApplySettings'), 1);
  assert.equal(countLiteral(source, 'FilterTube_SettingsToInjector'), 1);
  assert.equal(countLiteral(source, 'getCompiledSettings'), 2);
  assert.equal(countLiteral(source, 'filterTubeSeedReady'), 1);
  assert.equal(countLiteral(source, 'window.addEventListener'), 2);
  assert.equal(countLiteral(source, 'removeEventListener'), 0);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE.runtime.onMessage.addListener'), 1);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE.storage.onChanged.addListener'), 1);
  assert.equal(countLiteral(source, 'setTimeout'), 6);
  assert.equal(countLiteral(source, 'clearTimeout'), 2);
  assert.equal(countLiteral(source, 'setInterval'), 0);
  assert.equal(countLiteral(source, 'clearInterval'), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'observe('), 0);
  assert.equal(countLiteral(source, 'disconnect('), 0);
  assert.equal(countLiteral(source, 'postMessage'), 2);
  assert.equal(countLiteral(source, "}, '*')"), 2);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE.runtime.sendMessage'), 2);
  assert.equal(countLiteral(source, 'sendMessage'), 3);
  assert.equal(countLiteral(source, 'applyDOMFallback'), 6);
  assert.equal(countLiteral(source, 'injectMainWorldScripts'), 4);
  assert.equal(countLiteral(source, 'refreshRuntimeObserversAfterSettingsUpdate'), 4);
  assert.equal(countLiteral(source, 'refreshFilterTubeRuntimeObservers'), 2);
  assert.equal(countLiteral(source, 'FilterTube_refreshRuntimeObservers'), 2);
  assert.equal(countLiteral(source, 'FilterTube_refreshQuickBlockAvailability'), 2);
  assert.equal(countLiteral(source, 'FilterTube_refreshDOMFallbackObserver'), 2);
  assert.equal(countLiteral(source, 'schedulePrefetchScan'), 2);
  assert.equal(countLiteral(source, 'normalizeSettingsForHost'), 5);
  assert.equal(countLiteral(source, 'requestSettingsFromBackground'), 5);
  assert.equal(countLiteral(source, 'sendSettingsToMainWorld'), 5);
  assert.equal(countLiteral(source, 'tryApplySettingsToSeed'), 4);
  assert.equal(countLiteral(source, 'scheduleSeedRetry'), 3);
  assert.equal(countLiteral(source, 'scheduleSettingsRefreshFromStorage'), 2);
  assert.equal(countLiteral(source, 'handleStorageChanges'), 2);
  assert.equal(countLiteral(source, 'Date.now'), 2);
  assert.equal(countLiteral(source, 'parseInt'), 4);
  assert.equal(countLiteral(source, 'isFinite'), 1);
  assert.equal(countLiteral(source, 'new Map'), 1);
  assert.equal(countLiteral(source, 'new Set'), 4);
  assert.equal(countLiteral(source, 'Promise.resolve'), 2);
  assert.equal(countLiteral(source, 'new Promise'), 4);
  assert.equal(countLiteral(source, 'console.warn'), 3);
  assert.equal(countLiteral(source, 'console.log'), 3);
  assert.equal(countLiteral(source, 'debugLog'), 4);
  assert.equal(countLiteral(source, 'document.documentElement'), 2);
  assert.equal(countLiteral(source, 'getAttribute'), 2);
  assert.equal(countLiteral(source, 'Object.keys'), 2);
  assert.equal(countLiteral(source, 'Array.isArray'), 6);
  assert.equal(countLiteral(source, 'Math.max'), 7);
  assert.equal(countLiteral(source, 'Math.min'), 4);
  assert.equal(countLiteral(source, 'MIN_STORAGE_REFRESH_INTERVAL_MS'), 3);
  assert.equal(countLiteral(source, 'forceRefresh'), 6);
  assert.equal(countLiteral(source, 'profileType'), 11);
  assert.equal(countLiteral(source, 'whitelist'), 18);
  assert.equal(countLiteral(source, 'blocklist'), 4);
  assert.equal(countLiteral(source, 'videoChannelMap'), 2);
  assert.equal(countLiteral(source, 'videoMetaMap'), 2);
  assert.equal(countLiteral(source, 'channelMap'), 2);

  for (const token of [
    'document literal occurrences: 5',
    'window literal occurrences: 61',
    'location literal occurrences: 6',
    'globalThis literal occurrences: 3',
    'browserAPI_BRIDGE references: 9',
    'currentSettings references: 2',
    'latestSettings references: 1',
    'pendingSubscriptionImportRequests references: 10',
    'subscriptionImportRequestId references: 4',
    '__filtertubeMainWorldImportBridgeReady references: 5',
    '__filtertubeMainWorldSubscriptionsImportReady references: 5',
    '__filtertubeMainWorldBridgeWaiters references: 8',
    '__filtertubeMainWorldImportCapabilityWaiters references: 8',
    'FilterTubeRequestSubscribedChannelsFromMainWorld references: 3',
    'FilterTube_RequestSubscriptionImport references: 1',
    'FilterTube_SubscriptionsImportProgress references: 2',
    'FilterTube_SubscriptionsImportResponse references: 1',
    'FilterTube_InjectorBridgeReady references: 1',
    'FilterTube_InjectorToBridge_Ready references: 1',
    'FilterTube_SubscriptionsImportBridgeReady references: 1',
    'FilterTube_Ping references: 1',
    'FilterTube_RefreshNow references: 1',
    'FilterTube_ImportSubscribedChannels references: 1',
    'FilterTube_ApplySettings references: 1',
    'FilterTube_SettingsToInjector references: 1',
    'getCompiledSettings references: 2',
    'filterTubeSeedReady references: 1',
    'window.addEventListener calls: 2',
    'removeEventListener calls: 0',
    'browserAPI_BRIDGE.runtime.onMessage.addListener calls: 1',
    'browserAPI_BRIDGE.storage.onChanged.addListener calls: 1',
    'setTimeout calls: 6',
    'clearTimeout calls: 2',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'MutationObserver references: 0',
    'observe calls: 0',
    'disconnect calls: 0',
    'postMessage calls: 2',
    'wildcard postMessage target calls: 2',
    'browserAPI_BRIDGE.runtime.sendMessage calls: 2',
    'sendMessage token occurrences: 3',
    'applyDOMFallback references: 6',
    'injectMainWorldScripts references: 4',
    'refreshRuntimeObserversAfterSettingsUpdate references: 4',
    'refreshFilterTubeRuntimeObservers references: 2',
    'FilterTube_refreshRuntimeObservers references: 2',
    'FilterTube_refreshQuickBlockAvailability references: 2',
    'FilterTube_refreshDOMFallbackObserver references: 2',
    'schedulePrefetchScan references: 2',
    'normalizeSettingsForHost references: 5',
    'requestSettingsFromBackground references: 5',
    'sendSettingsToMainWorld references: 5',
    'tryApplySettingsToSeed references: 4',
    'scheduleSeedRetry references: 3',
    'scheduleSettingsRefreshFromStorage references: 2',
    'handleStorageChanges references: 2',
    'MIN_STORAGE_REFRESH_INTERVAL_MS references: 3',
    'forceRefresh references: 6',
    'profileType references: 11',
    'whitelist token occurrences: 18',
    'blocklist token occurrences: 4',
    'videoChannelMap token occurrences: 2',
    'videoMetaMap token occurrences: 2',
    'channelMap token occurrences: 2'
  ]) {
    assert.ok(text.includes(token), `missing bridge settings count token ${token}`);
  }
});

test('bridge settings source still proves current message settings seed and storage boundaries', () => {
  const text = doc();
  const source = read(sourcePath);

  for (const token of [
    'window.pendingSubscriptionImportRequests = new Map()',
    'window.__filtertubeMainWorldBridgeWaiters = new Set()',
    'window.__filtertubeMainWorldImportCapabilityWaiters = new Set()',
    'globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld = function requestSubscribedChannelsFromMainWorld',
    'const timeoutMs = Math.max(5000, Math.min(parseInt(options.timeoutMs, 10) || 60000, 120000))',
    'const maxChannels = Math.max(1, Math.min(parseInt(options.maxChannels, 10) || 5000, 5000))',
    'const pageDelayMs = Math.max(50, Math.min(parseInt(options.pageDelayMs, 10) || 140, 500))',
    "type: 'FilterTube_RequestSubscriptionImport'",
    "source: 'content_bridge'",
    "}, '*')",
    "window.addEventListener('message', (event) => {",
    'if (event.source !== window) return;',
    "if (data.source !== 'injector') return;",
    "type === 'FilterTube_InjectorBridgeReady' || type === 'FilterTube_InjectorToBridge_Ready'",
    "type === 'FilterTube_SubscriptionsImportProgress'",
    "type === 'FilterTube_SubscriptionsImportResponse'",
    'browserAPI_BRIDGE.runtime.onMessage.addListener',
    "request.action === 'FilterTube_Ping'",
    "request.action === 'FilterTube_RefreshNow'",
    "request.action === 'FilterTube_ImportSubscribedChannels'",
    "request.action === 'FilterTube_ApplySettings'",
    'const expectedProfile = (() => {',
    'const incomingProfile = request.settings?.profileType',
    'const normalized = normalizeSettingsForHost(request.settings);',
    'sendSettingsToMainWorld(normalized);',
    'applyDOMFallback(normalized, { forceReprocess: true });',
    "sendRuntimeMessage({ action: \"getCompiledSettings\", profileType, forceRefresh }",
    'sendRuntimeMessage({ action: "getCompiledSettings", profileType, forceRefresh: true }',
    'window.filterTube.updateSettings(settings);',
    "window.addEventListener('filterTubeSeedReady'",
    'scheduleSeedRetry();',
    "type: 'FilterTube_SettingsToInjector'",
    'latestSettings = settings;',
    'currentSettings = settings;',
    'const MIN_STORAGE_REFRESH_INTERVAL_MS = 250;',
    'browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges)',
    "if (changedKeys.length === 1 && changedKeys[0] === 'channelMap')",
    "const isVideoChannelMapOnly = changedKeys.length === 1 && changedKeys[0] === 'videoChannelMap'",
    "const isVideoMetaMapOnly = changedKeys.length === 1 && changedKeys[0] === 'videoMetaMap'"
  ]) {
    assert.ok(source.includes(token), `missing current source token ${token}`);
  }

  for (const token of [
    'module entrypoint: manifest-loaded isolated-world content script before content_bridge.js',
    'top-level state initialization: pendingSubscriptionImportRequests Map',
    'subscription import public entrypoint: globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld',
    "subscription import request path: window.postMessage({ type: 'FilterTube_RequestSubscriptionImport', source: 'content_bridge' }, '*')",
    'message source gate: event.source === window and data.source ===',
    'recognized runtime actions: FilterTube_Ping, FilterTube_RefreshNow, FilterTube_ImportSubscribedChannels, FilterTube_ApplySettings',
    'background settings request: browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings", profileType, forceRefresh }, ...)',
    "settings page-message path: window.postMessage({ type: 'FilterTube_SettingsToInjector', source: 'content_bridge' }, '*')",
    'seed direct apply path: window.filterTube.updateSettings(settings)',
    "seed ready listener: window.addEventListener('filterTubeSeedReady', () => ...)",
    'seed retry path: setTimeout(..., 250) while pendingSeedSettings remains',
    'storage listener path: browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges)',
    'storage refresh throttle: MIN_STORAGE_REFRESH_INTERVAL_MS = 250',
    'channelMap-only behavior: ignored',
    'videoChannelMap/videoMetaMap behavior: request settings refresh without forced DOM reprocess',
    'profile source: location.hostname implies kids/main',
    'Kids empty whitelist normalization: listMode whitelist with zero whitelist channels/keywords becomes blocklist',
    'listener teardown path: none',
    'settings revision gate: none',
    'subscription import capability token: none'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  assert.doesNotMatch(source, /removeEventListener/);
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /module\.exports/);
});

test('bridge settings executable proof covers current waiter import seed and storage behavior', async () => {
  const text = doc();
  const runtime = createBridgeSettingsRuntime({
    hostname: 'www.youtubekids.com',
    runtimeResponses: [
      { enabled: true, profileType: 'kids', listMode: 'blocklist', marker: 'video-map' },
      { enabled: true, profileType: 'kids', listMode: 'blocklist', marker: 'regular-key' }
    ]
  });
  const { context, events } = runtime;

  assert.ok(isMapLike(context.pendingSubscriptionImportRequests));
  assert.equal(context.subscriptionImportRequestId, 0);
  assert.equal(context.__filtertubeMainWorldImportBridgeReady, false);
  assert.equal(context.__filtertubeMainWorldSubscriptionsImportReady, false);
  assert.ok(isSetLike(context.__filtertubeMainWorldBridgeWaiters));
  assert.ok(isSetLike(context.__filtertubeMainWorldImportCapabilityWaiters));
  assert.equal(events.windowListeners.message.length, 1);
  assert.equal(events.runtimeListeners.length, 1);
  assert.equal(events.storageListeners.length, 1);

  const bridgeWait = context.waitForMainWorldImportBridgeReady(1);
  assert.equal(context.__filtertubeMainWorldBridgeWaiters.size, 1);
  assert.equal([...events.timers.values()].at(-1).delay, 250);
  runtime.dispatchWindowMessage({
    source: 'injector',
    type: 'FilterTube_InjectorBridgeReady',
    payload: {}
  });
  assert.equal(await bridgeWait, true);
  assert.equal(context.__filtertubeMainWorldBridgeWaiters.size, 0);
  assert.equal(context.__filtertubeMainWorldImportBridgeReady, true);

  const importProgress = [];
  const importPromise = context.FilterTubeRequestSubscribedChannelsFromMainWorld(
    { timeoutMs: 1, maxChannels: 99999, pageDelayMs: 1 },
    (progress) => importProgress.push(progress)
  );
  assert.equal(context.subscriptionImportRequestId, 1);
  assert.equal(context.pendingSubscriptionImportRequests.size, 1);
  assert.deepEqual(plain(events.postMessages.at(-1)), {
    message: {
      type: 'FilterTube_RequestSubscriptionImport',
      payload: {
        requestId: 1,
        timeoutMs: 5000,
        maxChannels: 5000,
        pageDelayMs: 50
      },
      source: 'content_bridge'
    },
    target: '*'
  });
  const initialTimeoutId = context.pendingSubscriptionImportRequests.get(1).timeoutId;
  runtime.dispatchWindowMessage({
    source: 'injector',
    type: 'FilterTube_SubscriptionsImportProgress',
    payload: { requestId: 1, imported: 2 }
  });
  assert.ok(events.clearedTimers.includes(initialTimeoutId));
  assert.deepEqual(plain(importProgress), [{ requestId: 1, imported: 2 }]);

  runtime.dispatchWindowMessage({
    source: 'injector',
    type: 'FilterTube_SubscriptionsImportResponse',
    payload: { requestId: 1, success: true, channels: [{ id: 'UC1' }] }
  });
  assert.deepEqual(plain(await importPromise), { requestId: 1, success: true, channels: [{ id: 'UC1' }] });
  assert.equal(context.pendingSubscriptionImportRequests.size, 0);

  const normalized = context.normalizeSettingsForHost({
    profileType: 'main',
    listMode: 'whitelist',
    whitelistChannels: [],
    whitelistKeywords: []
  });
  assert.equal(normalized.listMode, 'blocklist');

  context.filterTube = {
    updateSettings(settings) {
      events.seedUpdates.push(settings);
    }
  };
  context.sendSettingsToMainWorld(normalized);
  assert.equal(context.latestSettings, normalized);
  assert.equal(context.currentSettings, normalized);
  assert.deepEqual(plain(events.postMessages.at(-1)), {
    message: {
      type: 'FilterTube_SettingsToInjector',
      payload: plain(normalized),
      source: 'content_bridge'
    },
    target: '*'
  });
  assert.deepEqual(events.seedUpdates, [normalized]);

  const retryRuntime = createBridgeSettingsRuntime();
  retryRuntime.context.sendSettingsToMainWorld({ enabled: true, listMode: 'blocklist' });
  assert.equal(retryRuntime.events.windowListeners.filterTubeSeedReady.length, 1);
  assert.equal([...retryRuntime.events.timers.values()].at(-1).delay, 250);

  events.storageListeners[0]({ channelMap: { newValue: {} } }, 'local');
  assert.equal(events.runtimeMessages.length, 0);
  events.storageListeners[0]({ videoChannelMap: { newValue: {} } }, 'local');
  await runtime.flush();
  assert.deepEqual(plain(events.runtimeMessages.at(-1)), {
    action: 'getCompiledSettings',
    profileType: 'kids',
    forceRefresh: true
  });
  assert.equal(events.domFallbacks.at(-1).settings.marker, 'video-map');
  assert.equal(events.domFallbacks.at(-1).options.forceReprocess, false);

  const regularRuntime = createBridgeSettingsRuntime({
    runtimeResponses: [{ enabled: true, profileType: 'main', listMode: 'blocklist', marker: 'regular-key' }]
  });
  regularRuntime.events.storageListeners[0]({ enabled: { newValue: false } }, 'local');
  await regularRuntime.flush();
  assert.equal(regularRuntime.events.domFallbacks.at(-1).settings.marker, 'regular-key');
  assert.equal(regularRuntime.events.domFallbacks.at(-1).options.forceReprocess, true);

  assert.match(text, /## File-Local Executable Behavior Proof/);
  assert.match(text, /Loading the file initializes `pendingSubscriptionImportRequests`/);
  assert.match(text, /arms a timeout with a minimum 250ms delay/);
  assert.match(text, /clamps timeout\/channel\/page-delay inputs/);
  assert.match(text, /posts `FilterTube_RequestSubscriptionImport` to `\*`/);
  assert.match(text, /empty Main whitelist settings normalize to blocklist/);
  assert.match(text, /posts `FilterTube_SettingsToInjector` to `\*`/);
  assert.match(text, /`videoChannelMap`-only change requests forced background settings refresh but applies DOM fallback with `forceReprocess: false`/);
});

test('bridge settings register preserves future proof fields', () => {
  const text = doc();

  for (const token of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'compiledActiveState',
    'senderClass',
    'runtimeAction',
    'messageAction',
    'pageMessageType',
    'pageMessageTarget',
    'requestId',
    'timeoutBudget',
    'capabilityToken',
    'subscriptionImportCapability',
    'settingsRevision',
    'profileSource',
    'hostProfile',
    'hostNormalizationResult',
    'backgroundCacheSource',
    'storageChangedKeys',
    'storageKey',
    'forceRefresh',
    'forceRefreshReason',
    'forceReprocess',
    'seedApplyResult',
    'seedRetryBudget',
    'domFallbackEffect',
    'subscriptionImportProgressEffect',
    'subscriptionImportResponseEffect',
    'lifecyclePrimitive',
    'listenerOwner',
    'timerOwner',
    'teardownPolicy',
    'noRuleBudget',
    'negativeFixture',
    'positiveFixture',
    'sourceFamilyProvenance'
  ]) {
    assert.ok(text.includes(token), `missing future proof field ${token}`);
  }
});

test('runtime source lacks bridge settings method authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missingAuthority of [
    'bridgeSettingsMethodAuthority',
    'bridgeSettingsMessageTrustContract',
    'bridgeSettingsSubscriptionImportActionToken',
    'bridgeSettingsSubscriptionImportProgressBudget',
    'bridgeSettingsRuntimeActionSenderContract',
    'bridgeSettingsSettingsRevisionContract',
    'bridgeSettingsSeedRelayBudget',
    'bridgeSettingsStorageRefreshAuthority',
    'bridgeSettingsProfileHostContract',
    'bridgeSettingsFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
