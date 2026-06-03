import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
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

function countLiteral(source, literal) {
  return source.split(literal).length - 1;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function loadContentBridgeTransportRuntime() {
  const bridge = read('js/content_bridge.js');
  const requestBlock = sliceBetween(
    bridge,
    'if (!(window.pendingCollaboratorRequests instanceof Map)) {',
    '/**\n * Normalize collaborator names for comparison'
  );
  const handlerBlock = sliceBetween(
    bridge,
    'function handleMainWorldMessages(event) {',
    '\n\nasync function initialize() {'
  );

  let nextTimerId = 1;
  const timers = [];
  const clearedTimers = new Set();
  const messages = [];
  const resolvedCollaborators = [];

  const windowObject = {
    postMessage(message, target) {
      messages.push({ message, target });
    },
    pendingCollaboratorRequests: undefined,
    pendingChannelInfoRequests: undefined,
    pendingSubscriptionImportRequests: undefined
  };

  const context = {
    window: windowObject,
    document: {
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    },
    console: {
      log() {},
      warn() {},
      error() {}
    },
    setTimeout(handler, delay) {
      const id = nextTimerId;
      nextTimerId += 1;
      timers.push({ id, handler, delay, fired: false });
      return id;
    },
    clearTimeout(id) {
      clearedTimers.add(id);
    },
    requestAnimationFrame(handler) {
      return context.setTimeout(handler, 16);
    },
    sanitizeCollaboratorList(value) {
      return Array.isArray(value) ? value : [];
    },
    resolveExpectedCollaboratorCount(_raw, _sanitized, attrCount, fallbackCount) {
      return Math.max(Number(attrCount) || 0, Number(fallbackCount) || 0);
    },
    applyResolvedCollaborators(videoId, collaborators, options) {
      resolvedCollaborators.push({ videoId, collaborators, options });
    },
    requestSettingsFromBackground() {
      return Promise.resolve(null);
    },
    persistChannelMappings() {},
    persistVideoChannelMapping() {},
    persistVideoMetaMapping() {},
    touchDomForVideoMetaUpdate() {
      return false;
    },
    scheduleVideoMetaDomRerun() {},
    findVideoCardElement() {
      return null;
    },
    shouldStampCardForVideoId() {
      return true;
    },
    stampChannelIdentity() {},
    applyDOMFallback() {},
    browserAPI_BRIDGE: {
      storage: {
        local: {
          get(_keys, callback) {
            callback({});
          },
          set(_payload, callback) {
            if (typeof callback === 'function') callback();
          }
        }
      }
    },
    Map,
    Array,
    Boolean,
    Math,
    Number,
    String,
    Promise,
    parseInt,
    isFinite
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      requestBlock,
      handlerBlock,
      'window.__transportAuditExports = {',
      '  requestCollaboratorInfoFromMainWorld,',
      '  requestChannelInfoFromMainWorld,',
      '  handleMainWorldMessages',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );

  function pendingTimers(delay) {
    return timers.filter((timer) => timer.delay === delay && !timer.fired && !clearedTimers.has(timer.id));
  }

  function fireDelay(delay) {
    const runnable = pendingTimers(delay);
    for (const timer of runnable) {
      timer.fired = true;
      timer.handler();
    }
  }

  return {
    context,
    window: windowObject,
    exports: windowObject.__transportAuditExports,
    timers,
    clearedTimers,
    messages,
    resolvedCollaborators,
    fireDelay,
    pendingTimers
  };
}

function dispatchMainWorldMessage(runtime, data) {
  runtime.exports.handleMainWorldMessages({
    source: runtime.window,
    data
  });
}

async function flushLazyMainWorldRequest() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test('JSON-first network snapshot consumer request transport audit is audit-only and source pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const bridgeHash = 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c';
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, transport patch/);
  assert.match(text, /consumer request-transport source files: 2/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(bridge), 13571);
  assert.equal(Buffer.byteLength(bridge), 601694);
  assert.equal(sha256('js/content_bridge.js'), bridgeHash);
  assert.match(text, new RegExp(`\\| \`js/content_bridge\\.js\` \\| 13571 \\| 601694 \\| \`${bridgeHash}\` \\|`));

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('consumer request transport source rows and counts are pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const collaboratorRequest = sliceBetween(
    bridge,
    'function requestCollaboratorInfoFromMainWorld(videoId, options = {}) {',
    '\n}\n\nfunction requestChannelInfoFromMainWorld'
  );
  const channelRequest = sliceBetween(
    bridge,
    'function requestChannelInfoFromMainWorld(videoId, options = {}) {',
    '\n}\n\nfunction requestSubscribedChannelsFromMainWorld'
  );
  const collaboratorResponse = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_CollaboratorInfoResponse') {",
    "    } else if (type === 'FilterTube_SubscriptionsImportProgress') {"
  );
  const channelResponse = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_ChannelInfoResponse') {",
    "    } else if (type === 'FilterTube_CollabDialogData') {"
  );
  const injectorMessageListener = sliceBetween(
    injector,
    "window.addEventListener('message', (event) => {",
    '        if (type === \'FilterTube_SettingsToInjector\''
  );
  const injectorCollaboratorRequest = sliceBetween(
    injector,
    "if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge') {",
    '        // Handle single-channel info request'
  );
  const injectorChannelRequest = sliceBetween(
    injector,
    "if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge') {",
    '    });\n\n    window.filterTubeInjectorBridgeReady'
  );

  for (const marker of [
    'pending snapshot request maps: 2',
    'snapshot request id counters: 2',
    'snapshot request functions: 2',
    'request timeout constants at 2000 ms: 2',
    'request retry delays at 250 ms: 2',
    'request retry delays at 1000 ms: 2',
    'request postMessage wildcard targets: 2',
    'injector same-window request listener gates: 1',
    'injector content_bridge request source gates: 2',
    'injector response postMessage wildcard targets: 2',
    'bridge response clearTimeout sites: 2',
    'bridge response pending delete sites: 2',
    'bridge response pending resolve sites: 2',
    'runtime channel retry and timeout fixtures: 1',
    'runtime channel response clear fixtures: 1',
    'runtime collaborator retry and timeout fixtures: 1',
    'runtime unsolicited collaborator response fixture: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [5296, 5299, 5304, 5307, 5325, 5332, 5344, 5375, 5366, 5371, 5380, 5383, 5394, 5425, 5416, 5421, 5789, 5767, 5853]) {
    assert.ok(text.includes(`\`js/content_bridge.js:${line}\``), `doc should cite js/content_bridge.js:${line}`);
  }
  for (const line of [1916, 1922, 1961, 1997, 2005, 2011, 2023, 2031]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(collaboratorRequest, 'const timeoutMs = 2000'), 1);
  assert.equal(countLiteral(collaboratorRequest, 'setTimeout'), 3);
  assert.equal(countLiteral(collaboratorRequest, 'window.postMessage'), 1);
  assert.equal(countLiteral(collaboratorRequest, "}, '*')"), 1);
  assert.match(collaboratorRequest, /}, 250\)/);
  assert.match(collaboratorRequest, /}, 1000\)/);

  assert.equal(countLiteral(channelRequest, 'const timeoutMs = 2000'), 1);
  assert.equal(countLiteral(channelRequest, 'setTimeout'), 3);
  assert.equal(countLiteral(channelRequest, 'window.postMessage'), 1);
  assert.equal(countLiteral(channelRequest, "}, '*')"), 1);
  assert.match(channelRequest, /}, 250\)/);
  assert.match(channelRequest, /}, 1000\)/);

  assert.match(injectorMessageListener, /event\.source !== window/);
  assert.match(injectorMessageListener, /source === 'injector'/);
  assert.match(injectorCollaboratorRequest, /source === 'content_bridge'/);
  assert.match(injectorChannelRequest, /source === 'content_bridge'/);
  assert.equal(countLiteral(injectorCollaboratorRequest, "}, '*')"), 1);
  assert.equal(countLiteral(injectorChannelRequest, "}, '*')"), 1);

  assert.equal(countLiteral(collaboratorResponse, 'clearTimeout'), 1);
  assert.equal(countLiteral(collaboratorResponse, 'pendingCollaboratorRequests.delete'), 1);
  assert.equal(countLiteral(collaboratorResponse, 'pending.resolve'), 1);
  assert.match(collaboratorResponse, /applyResolvedCollaborators/);

  assert.equal(countLiteral(channelResponse, 'clearTimeout'), 1);
  assert.equal(countLiteral(channelResponse, 'pendingChannelInfoRequests.delete'), 1);
  assert.equal(countLiteral(channelResponse, 'pending.resolve'), 1);
  assert.doesNotMatch(channelResponse, /applyResolvedCollaborators|stampChannelIdentity|persistVideoChannelMapping/);
});

test('channel request posts immediately retries while pending and times out at 2000 ms', async () => {
  const runtime = loadContentBridgeTransportRuntime();
  const promise = runtime.exports.requestChannelInfoFromMainWorld('channelTransportVideo', {
    expectedHandle: '@expected',
    expectedName: 'Expected Channel'
  });
  await flushLazyMainWorldRequest();

  assert.equal(runtime.window.channelInfoRequestId, 1);
  assert.equal(runtime.window.pendingChannelInfoRequests.size, 1);
  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.messages[0].target, '*');
  assert.deepEqual(plain(runtime.messages[0].message), {
    type: 'FilterTube_RequestChannelInfo',
    payload: {
      videoId: 'channelTransportVideo',
      requestId: 1,
      expectedHandle: '@expected',
      expectedName: 'Expected Channel'
    },
    source: 'content_bridge'
  });
  assert.equal(runtime.pendingTimers(250).length, 1);
  assert.equal(runtime.pendingTimers(1000).length, 1);
  assert.equal(runtime.pendingTimers(2000).length, 1);

  runtime.fireDelay(250);
  assert.equal(runtime.messages.length, 2);
  runtime.fireDelay(1000);
  assert.equal(runtime.messages.length, 3);
  assert.deepEqual(runtime.messages.map((entry) => entry.message.payload.requestId), [1, 1, 1]);

  runtime.fireDelay(2000);
  assert.equal(runtime.window.pendingChannelInfoRequests.size, 0);
  assert.equal(await promise, null);
});

test('channel response clears timeout deletes pending state and suppresses later retries', async () => {
  const runtime = loadContentBridgeTransportRuntime();
  const promise = runtime.exports.requestChannelInfoFromMainWorld('channelResponseVideo');
  await flushLazyMainWorldRequest();
  const timeoutTimer = runtime.pendingTimers(2000)[0];

  dispatchMainWorldMessage(runtime, {
    type: 'FilterTube_ChannelInfoResponse',
    payload: {
      requestId: 1,
      videoId: 'differentVideoStillAccepted',
      channel: { id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Accepted by request id only' }
    },
    source: 'injector'
  });

  assert.ok(runtime.clearedTimers.has(timeoutTimer.id));
  assert.equal(runtime.window.pendingChannelInfoRequests.size, 0);
  assert.deepEqual(await promise, { id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Accepted by request id only' });

  runtime.fireDelay(250);
  runtime.fireDelay(1000);
  runtime.fireDelay(2000);
  assert.equal(runtime.messages.length, 1);
});

test('collaborator request posts expected fields retries while pending and times out at 2000 ms', async () => {
  const runtime = loadContentBridgeTransportRuntime();
  const promise = runtime.exports.requestCollaboratorInfoFromMainWorld('collabTransportVideo', {
    expectedNames: ['Alpha', 'Beta'],
    expectedHandles: ['@alpha', '@beta'],
    expectedCollaboratorCount: 2,
    allowRosterFallbackForCollabMarkup: true
  });
  await flushLazyMainWorldRequest();

  assert.equal(runtime.window.collaboratorRequestId, 1);
  assert.equal(runtime.window.pendingCollaboratorRequests.size, 1);
  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.messages[0].target, '*');
  assert.deepEqual(plain(runtime.messages[0].message), {
    type: 'FilterTube_RequestCollaboratorInfo',
    payload: {
      videoId: 'collabTransportVideo',
      requestId: 1,
      expectedNames: ['Alpha', 'Beta'],
      expectedHandles: ['@alpha', '@beta'],
      expectedCollaboratorCount: 2,
      allowRosterFallbackForCollabMarkup: true
    },
    source: 'content_bridge'
  });

  runtime.fireDelay(250);
  runtime.fireDelay(1000);
  assert.equal(runtime.messages.length, 3);
  assert.deepEqual(runtime.messages.map((entry) => entry.message.payload.requestId), [1, 1, 1]);

  runtime.fireDelay(2000);
  assert.equal(runtime.window.pendingCollaboratorRequests.size, 0);
  assert.equal(await promise, null);
});

test('unsolicited collaborator response can still apply collaborators without a pending request', () => {
  const runtime = loadContentBridgeTransportRuntime();
  assert.equal(runtime.window.pendingCollaboratorRequests.size, 0);

  dispatchMainWorldMessage(runtime, {
    type: 'FilterTube_CollaboratorInfoResponse',
    payload: {
      requestId: 999,
      videoId: 'unsolicitedCollabVideo',
      collaborators: [
        { id: 'UCbbbbbbbbbbbbbbbbbbbbbb', name: 'Unsolicited A' },
        { id: 'UCcccccccccccccccccccccc', name: 'Unsolicited B' }
      ]
    },
    source: 'injector'
  });

  assert.equal(runtime.window.pendingCollaboratorRequests.size, 0);
  assert.equal(runtime.resolvedCollaborators.length, 1);
  assert.equal(runtime.resolvedCollaborators[0].videoId, 'unsolicitedCollabVideo');
  assert.equal(runtime.resolvedCollaborators[0].options.force, true);
  assert.equal(runtime.resolvedCollaborators[0].options.expectedCount, 2);
});

test('network snapshot consumer request transport authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotConsumerRequestTransportDecision',
    'requestType',
    'requestId',
    'requestNonce',
    'senderClass',
    'sourceWorld',
    'targetWorld',
    'route',
    'profileType',
    'listMode',
    'settingsRevision',
    'requestedVideoId',
    'expectedHandle',
    'expectedName',
    'retryPolicy',
    'timeoutMs',
    'attemptCount',
    'pendingCreatedAt',
    'pendingClearedAt',
    'clearReason',
    'responseVideoId',
    'responseCorrelationResult',
    'allowedResponseEffects',
    'blockedResponseEffects',
    'fixtureProvenance',
    'metricArtifact'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerRequestTransportContract',
    'jsonFirstNetworkSnapshotConsumerRequestTransportDecision',
    'jsonFirstNetworkSnapshotConsumerRequestNonce',
    'jsonFirstNetworkSnapshotConsumerPendingRequestRegistry',
    'jsonFirstNetworkSnapshotConsumerRetryPolicy',
    'jsonFirstNetworkSnapshotConsumerTimeoutPolicy',
    'jsonFirstNetworkSnapshotConsumerResponseCorrelationReport',
    'jsonFirstNetworkSnapshotConsumerTransportSenderCapability',
    'jsonFirstNetworkSnapshotConsumerRequestFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerRequestMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
