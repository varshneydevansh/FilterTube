import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_INJECTOR_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(source) {
  const normalized = source.endsWith('\n') ? source.slice(0, -1) : source;
  return normalized.split('\n').length;
}

function sha256(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function count(source, pattern) {
  return source.match(pattern)?.length || 0;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('unterminated block');
}

function functionBlock(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker ${marker}`);
  const brace = source.indexOf('{', index);
  assert.notEqual(brace, -1, `missing body for ${marker}`);
  const end = findMatchingBrace(source, brace);
  return source.slice(index, end + 1);
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker ${endMarker}`);
  return source.slice(start, end);
}

function injectorBlocks() {
  const injector = read('js/injector.js');
  const subscriptionHandler = functionBlock(injector, 'function handleSubscriptionsImportBridgeMessage');
  const installBlock = functionBlock(injector, 'function installSubscriptionsImportBridge');
  const mainListener = sliceBetween(
    injector,
    "window.addEventListener('message', (event) => {",
    '    });\n\n    window.filterTubeInjectorBridgeReady = true;'
  );
  const selected = `${subscriptionHandler}\n${installBlock}\n${mainListener}`;

  return {
    injector,
    subscriptionHandler,
    installBlock,
    mainListener,
    selected
  };
}

function selectedMessageTypes(selected) {
  return [...selected.matchAll(/type(?: !==| ===) '([^']+)'/g)].map((match) => match[1]);
}

function loadInjectorDispatchRuntime({ networkJsonWork = true } = {}) {
  const blocks = injectorBlocks();
  const executableMainListener = `${blocks.mainListener}\n    });`;
  const events = [];
  const windowObject = {
    __listeners: { message: [] },
    addEventListener(type, handler) {
      events.push({ type: 'addEventListener', eventType: type });
      this.__listeners[type] ||= [];
      this.__listeners[type].push(handler);
    },
    postMessage(data, target) {
      events.push({ type: 'postMessage', data, target });
    }
  };
  const context = {
    __events: events,
    __networkJsonWork: networkJsonWork,
    window: windowObject,
    console: { log() {}, warn() {}, error() {} },
    Map,
    Promise,
    Array
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(`
    let currentSettings = { enabled: true, listMode: 'blocklist', filterKeywords: ['old'] };
    let settingsReceived = false;
    let initialDataQueue = ['queued'];
    const collaboratorCache = new Map();
    function announceSubscriptionsImportBridgeReady() {
      window.postMessage({ type: 'FilterTube_SubscriptionsImportBridgeReady', source: 'injector' }, '*');
    }
    function postLog() {}
    async function fetchSubscribedChannelsFromYoutubei(requestId, payload) {
      globalThis.__events.push({ type: 'fetchSubscribedChannelsFromYoutubei', requestId, payload });
      return { success: true, channels: [{ id: 'UC1', name: 'One' }] };
    }
    function updateSeedSettings() {
      globalThis.__events.push({ type: 'updateSeedSettings', currentSettings });
    }
    function hasNetworkJsonWork(settings) {
      globalThis.__events.push({ type: 'hasNetworkJsonWork', settings });
      return globalThis.__networkJsonWork;
    }
    function processInitialDataQueue() {
      globalThis.__events.push({ type: 'processInitialDataQueue' });
    }
    function cacheCollaboratorsIfBetter(videoId, collaborators) {
      collaboratorCache.set(videoId, collaborators);
      globalThis.__events.push({ type: 'cacheCollaboratorsIfBetter', videoId, collaborators });
      return collaborators;
    }
    function searchYtInitialDataForCollaborators(videoId) {
      globalThis.__events.push({ type: 'searchYtInitialDataForCollaborators', videoId });
      return [{ name: 'Collab' }];
    }
    function searchYtInitialDataForVideoChannel(videoId, expected) {
      globalThis.__events.push({ type: 'searchYtInitialDataForVideoChannel', videoId, expected });
      return { id: 'UC-channel', name: 'Channel' };
    }
    ${blocks.subscriptionHandler}
    ${blocks.installBlock}
    installSubscriptionsImportBridge();
    ${executableMainListener}
    globalThis.__exports = {
      handleSubscriptionsImportBridgeMessage,
      installSubscriptionsImportBridge,
      messageListeners: window.__listeners.message,
      getState() { return { currentSettings, settingsReceived, initialDataQueue, collaboratorCacheSize: collaboratorCache.size }; }
    };
  `, context);

  return {
    exports: context.__exports,
    events,
    window: windowObject
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

test('injector main-world message dispatch audit is audit-only and source counted', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: audit-only',
    'Runtime behavior is unchanged',
    'This is not an implementation patch',
    'runtime injector main-world message dispatch fixtures: 8',
    'injector dispatch executable ingress rows: 8',
    'injector dispatch executable behavior changed: no',
    'injector dispatch executable approval: NO-GO',
    'not completion proof for injector message trust'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  const blocks = injectorBlocks();
  const expectedMetrics = {
    'subscription handler lines': lineCount(blocks.subscriptionHandler),
    'subscription handler bytes': Buffer.byteLength(blocks.subscriptionHandler),
    'install block lines': lineCount(blocks.installBlock),
    'install block bytes': Buffer.byteLength(blocks.installBlock),
    'main listener block lines': lineCount(blocks.mainListener),
    'main listener block bytes': Buffer.byteLength(blocks.mainListener),
    'selected addEventListener tokens': count(blocks.selected, /addEventListener/g),
    'selected removeEventListener tokens': count(blocks.selected, /removeEventListener/g),
    'selected postMessage tokens': count(blocks.selected, /postMessage/g),
    'selected wildcard postMessage target tokens': count(blocks.selected, /\}, '\*'\)/g),
    'selected event.source window guards': count(blocks.selected, /event\.source !== window/g),
    'selected source injector self-guards': count(blocks.selected, /source === 'injector'/g),
    'selected source content_bridge gates': count(blocks.selected, /source === 'content_bridge'|source !== 'content_bridge'/g),
    'selected source filter_logic gates': count(blocks.selected, /source === 'filter_logic'/g),
    'selected event.origin tokens': count(blocks.selected, /event\.origin/g),
    'selected nonce tokens': count(blocks.selected, /\bnonce\b/g),
    'selected capability tokens': count(blocks.selected, /capability|capabilityToken|senderCapability/g),
    'selected revision tokens': count(blocks.selected, /revision|settingsRevision/g),
    'selected requestId tokens': count(blocks.selected, /requestId/g),
    'selected currentSettings tokens': count(blocks.selected, /currentSettings/g),
    'selected updateSeedSettings tokens': count(blocks.selected, /updateSeedSettings/g),
    'selected processInitialDataQueue tokens': count(blocks.selected, /processInitialDataQueue/g),
    'selected collaboratorCache tokens': count(blocks.selected, /collaboratorCache/g),
    'selected searchYtInitialDataForCollaborators tokens': count(blocks.selected, /searchYtInitialDataForCollaborators/g),
    'selected searchYtInitialDataForVideoChannel tokens': count(blocks.selected, /searchYtInitialDataForVideoChannel/g),
    'selected fetchSubscribedChannelsFromYoutubei tokens': count(blocks.selected, /fetchSubscribedChannelsFromYoutubei/g),
    'selected setTimeout tokens': count(blocks.selected, /setTimeout/g),
    'selected clearTimeout tokens': count(blocks.selected, /clearTimeout/g),
    'selected return statements': count(blocks.selected, /\breturn\b/g),
    'selected settingsReceived tokens': count(blocks.selected, /settingsReceived/g)
  };

  assert.ok(doc.includes(`lines: ${lineCount(blocks.injector)}`));
  assert.ok(doc.includes(`bytes: ${Buffer.byteLength(blocks.injector)}`));
  assert.ok(doc.includes(`sha256: \`${sha256(blocks.injector)}\``));

  for (const [label, value] of Object.entries(expectedMetrics)) {
    assert.ok(doc.includes(`${label}: ${value}`), `doc missing metric ${label}: ${value}`);
  }
});

test('injector dispatch selected message inventory is pinned exactly', () => {
  const { selected } = injectorBlocks();

  assert.deepEqual(selectedMessageTypes(selected), [
    'FilterTube_RequestSubscriptionImport',
    'FilterTube_SettingsToInjector',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_RequestCollaboratorInfo',
    'FilterTube_RequestChannelInfo'
  ]);
});

test('subscription import listener installs before duplicate guard and uses request id without capability', async () => {
  const { injector, subscriptionHandler, installBlock } = injectorBlocks();

  assert.ok(
    injector.indexOf('installSubscriptionsImportBridge();') < injector.indexOf('if (window.filterTubeInjectorHasRun)'),
    'subscription bridge install should currently run before duplicate-run guard'
  );
  assert.match(installBlock, /window\.__filtertubeSubscriptionsImportListenerInstalled !== true/);
  assert.match(installBlock, /window\.addEventListener\('message', handleSubscriptionsImportBridgeMessage\)/);
  assert.match(subscriptionHandler, /if \(event\.source !== window \|\| !event\.data\) return;/);
  assert.match(subscriptionHandler, /if \(source === 'injector'\) return;/);
  assert.match(subscriptionHandler, /if \(type !== 'FilterTube_RequestSubscriptionImport' \|\| source !== 'content_bridge'\) return;/);
  assert.match(subscriptionHandler, /const \{ requestId \} = payload \|\| \{\};/);
  assert.match(subscriptionHandler, /fetchSubscribedChannelsFromYoutubei\(requestId, payload \|\| \{\}\)/);
  assert.doesNotMatch(subscriptionHandler, /actionToken|capabilityToken|senderCapability|settingsRevision|nonce/);

  const runtime = loadInjectorDispatchRuntime();
  const subscriptionListener = runtime.exports.messageListeners[0];
  assert.equal(runtime.exports.messageListeners.length, 2);

  runtime.events.length = 0;
  runtime.exports.installSubscriptionsImportBridge();
  assert.equal(runtime.exports.messageListeners.length, 2);
  assert.equal(runtime.events.filter(event => event.type === 'addEventListener').length, 0);

  subscriptionListener({ source: {}, data: { type: 'FilterTube_RequestSubscriptionImport', source: 'content_bridge' } });
  subscriptionListener({ source: runtime.window, data: { type: 'Noise_RequestSubscriptionImport', source: 'content_bridge' } });
  subscriptionListener({ source: runtime.window, data: { type: 'FilterTube_RequestSubscriptionImport', source: 'injector' } });
  await flushMicrotasks();
  assert.deepEqual(runtime.events.filter(event => event.type === 'fetchSubscribedChannelsFromYoutubei'), []);

  subscriptionListener({
    source: runtime.window,
    data: {
      type: 'FilterTube_RequestSubscriptionImport',
      source: 'content_bridge',
      payload: { requestId: 'sub-1', pageSize: 25 }
    }
  });
  await flushMicrotasks();
  assert.equal(runtime.events.filter(event => event.type === 'fetchSubscribedChannelsFromYoutubei').length, 1);
  assert.equal(runtime.events.find(event => event.type === 'fetchSubscribedChannelsFromYoutubei').requestId, 'sub-1');
  const response = runtime.events.find(event => event.type === 'postMessage' && event.data?.type === 'FilterTube_SubscriptionsImportResponse');
  assert.equal(response?.target, '*');
  assert.equal(response?.data.payload.requestId, 'sub-1');
});

test('subscription import listener posts wildcard response and has no local teardown path', () => {
  const { subscriptionHandler, installBlock } = injectorBlocks();

  assert.match(subscriptionHandler, /type: 'FilterTube_SubscriptionsImportResponse'/);
  assert.match(subscriptionHandler, /requestId,/);
  assert.match(subscriptionHandler, /source: 'injector'/);
  assert.match(subscriptionHandler, /\}, '\*'\)/);
  assert.doesNotMatch(subscriptionHandler + installBlock, /removeEventListener|injectorSubscriptionImportActionTokenReport/);
});

test('main injector listener accepts string source labels without origin nonce revision or capability checks', async () => {
  const { mainListener } = injectorBlocks();

  assert.match(mainListener, /if \(event\.source !== window \|\| !event\.data\) return;/);
  assert.match(mainListener, /const \{ type, payload, source \} = event\.data;/);
  assert.match(mainListener, /if \(source === 'injector'\) return;/);
  assert.match(mainListener, /type === 'FilterTube_SettingsToInjector' && source === 'content_bridge'/);
  assert.match(mainListener, /type === 'FilterTube_CacheCollaboratorInfo' && source === 'filter_logic'/);
  assert.match(mainListener, /type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge'/);
  assert.match(mainListener, /type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge'/);
  assert.doesNotMatch(mainListener, /event\.origin|nonce|capability|capabilityToken|senderCapability|revision|settingsRevision|routePolicy|activeRule/);

  const runtime = loadInjectorDispatchRuntime({ networkJsonWork: true });
  const mainMessageListener = runtime.exports.messageListeners[1];
  runtime.events.length = 0;

  mainMessageListener({ source: {}, data: { type: 'FilterTube_SettingsToInjector', source: 'content_bridge', payload: { filterKeywords: ['new'] } } });
  mainMessageListener({ source: runtime.window, data: { type: 'FilterTube_SettingsToInjector', source: 'injector', payload: { filterKeywords: ['new'] } } });
  mainMessageListener({ source: runtime.window, data: { type: 'FilterTube_SettingsToInjector', source: 'filter_logic', payload: { filterKeywords: ['new'] } } });
  assert.deepEqual(runtime.events, []);

  mainMessageListener({ source: runtime.window, data: { type: 'FilterTube_SettingsToInjector', source: 'content_bridge', payload: { filterKeywords: ['new'] } } });
  assert.deepEqual(runtime.events.map(event => event.type), ['updateSeedSettings', 'hasNetworkJsonWork', 'processInitialDataQueue']);
  assert.equal(runtime.exports.getState().settingsReceived, true);
  assert.deepEqual(runtime.exports.getState().currentSettings.filterKeywords, ['new']);
});

test('settings message merges caller payload and drains queue without revision gate', () => {
  const { mainListener } = injectorBlocks();
  const settingsBlock = sliceBetween(
    mainListener,
    "if (type === 'FilterTube_SettingsToInjector' && source === 'content_bridge')",
    '// Handle collaboration data caching from filter_logic.js'
  );

  assert.match(settingsBlock, /currentSettings = \{ \.\.\.currentSettings, \.\.\.payload \};/);
  assert.match(settingsBlock, /settingsReceived = true;/);
  assert.match(settingsBlock, /updateSeedSettings\(\);/);
  assert.match(settingsBlock, /processInitialDataQueue\(\);/);
  assert.doesNotMatch(settingsBlock, /revision|settingsRevision|nonce|capability/);
});

test('collaborator cache and lookup requests use wildcard responses or local cache mutation', () => {
  const { mainListener } = injectorBlocks();
  const cacheBlock = sliceBetween(
    mainListener,
    "if (type === 'FilterTube_CacheCollaboratorInfo' && source === 'filter_logic')",
    '// Handle collaborator info request from content_bridge'
  );
  const collaboratorBlock = sliceBetween(
    mainListener,
    "if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge')",
    '// Handle single-channel info request from content_bridge'
  );
  const channelBlock = sliceBetween(
    mainListener,
    "if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge')",
    '\n        }\n\n'
  );

  assert.match(cacheBlock, /cacheCollaboratorsIfBetter\(videoId, collaborators\)/);
  assert.doesNotMatch(cacheBlock, /requestId|nonce|capability|cacheProvenance/);

  assert.match(collaboratorBlock, /collaboratorCache\.get\(videoId\)/);
  assert.match(collaboratorBlock, /searchYtInitialDataForCollaborators\(videoId, matcher\)/);
  assert.match(collaboratorBlock, /type: 'FilterTube_CollaboratorInfoResponse'/);
  assert.match(collaboratorBlock, /source: 'injector'/);
  assert.match(collaboratorBlock, /\}, '\*'\)/);

  assert.match(channelBlock, /searchYtInitialDataForVideoChannel\(videoId/);
  assert.match(channelBlock, /type: 'FilterTube_ChannelInfoResponse'/);
  assert.match(channelBlock, /source: 'injector'/);
  assert.match(channelBlock, /\}, '\*'\)/);

  assert.doesNotMatch(collaboratorBlock + channelBlock, /activeRule|lookupBudget|settingsRevision|nonce|capability/);
});

test('product runtime has no shared injector main-world dispatch authority symbols yet', () => {
  const runtime = read('js/injector.js');

  for (const missingAuthority of [
    'injectorMainWorldMessageDispatchContract',
    'injectorPageMessageSenderPolicy',
    'injectorPageMessageNonceReport',
    'injectorSettingsMessageRevisionReport',
    'injectorSubscriptionImportDispatchPolicy',
    'injectorSubscriptionImportActionTokenReport',
    'injectorCollaboratorCacheMessagePolicy',
    'injectorLookupRequestCorrelationReport',
    'injectorMainWorldDispatchMetricArtifact',
    'injectorMainWorldMessageFixtureProvenance'
  ]) {
    assert.equal(runtime.includes(missingAuthority), false, `${missingAuthority} should remain absent in current product runtime`);
  }
});
