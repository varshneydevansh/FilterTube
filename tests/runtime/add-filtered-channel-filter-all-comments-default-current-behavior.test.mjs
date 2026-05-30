import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'],
  'js/background.js': [6313, 284710, '46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c']
};

const blockSpecs = {
  contentBridgeAddChannelDirectly: {
    file: 'js/content_bridge.js',
    start: 'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {',
    end: '/**\n * Add "Filter All Content" checkbox below the blocked channel',
    startLine: 13375,
    lines: 54,
    bytes: 2662,
    hash: '4eb280573a5611b695c8284a8e6b85d17b2a97c459143a3054d02374cdf7c2ca'
  },
  backgroundAddFilteredChannelReceiver: {
    file: 'js/background.js',
    start: "if (message.type === 'addFilteredChannel')",
    end: "if (message.type === 'toggleChannelFilterAll')",
    startLine: 5244,
    lines: 32,
    bytes: 1186,
    hash: '68b592ef1b1365757100285ab9e7c3589727600f0b2be908466b992fb59c00f9'
  },
  backgroundHandleAddFilteredChannelSignature: {
    file: 'js/background.js',
    start: 'async function handleAddFilteredChannel(input, filterAll = false',
    end: '        const isHandleLike = (value) => {',
    startLine: 5302,
    lines: 2,
    bytes: 204,
    hash: 'ce94174aa1b2f302e1e89a75b463271aa13d1c95f62cb89ee34364fb9c3ab603'
  },
  backgroundExistingChannelUpdate: {
    file: 'js/background.js',
    start: 'const updated = {\n                ...existing,',
    end: '            if (Array.isArray(collaborationWith) && collaborationWith.length > 0) {',
    startLine: 5945,
    lines: 21,
    bytes: 1247,
    hash: '9ac97ce884e9c319e0267a60bbbacbdb26b0a3ea6f1f0cca416615ad234e96dd'
  },
  backgroundNewChannelObject: {
    file: 'js/background.js',
    start: 'const newChannel = {\n                id: channelInfo.id,',
    end: '            channels.unshift(newChannel);',
    startLine: 5995,
    lines: 20,
    bytes: 1081,
    hash: '5fa1776809d1d10187ead655c7b8a566c15935b2667f95e8cd5f7875c28f4be4'
  },
  backgroundChannelDerivedKeywordHelpersAndSync: {
    file: 'js/background.js',
    start: 'function getChannelDerivedKeywordRef(channel) {',
    end: '// Deep link into the tab-view dashboard',
    startLine: 1172,
    lines: 106,
    bytes: 3482,
    hash: '22f1f880c4b67f0b366020641f94e988d19a4e0312b073c20048c4f2bcd0a455'
  },
  stateManagerChannelEnrichmentMessage: {
    file: 'js/state_manager.js',
    start: "chrome.runtime.sendMessage({\n            type: 'addFilteredChannel',",
    end: '        }, () => {\n            channelEnrichmentProcessedThisSession++;',
    startLine: 665,
    lines: 12,
    bytes: 460,
    hash: '1f802c946742b856d5c4f6aea62777de9e1e3fcebae08085d632259d1bac0132'
  },
  settingsSharedSyncFilterAllKeywords: {
    file: 'js/settings_shared.js',
    start: 'function syncFilterAllKeywords',
    end: '    function buildCompiledSettings',
    startLine: 412,
    lines: 72,
    bytes: 2967,
    hash: 'ce4e49c6055252ab9a6db6a30be91ddfb50efead1c1ef76bf736c38717febd25'
  }
};

const selectedCounts = {
  addFilteredChannel: 3,
  filterAllComments: 4,
  'message.filterAllComments': 0,
  'filterAll: filterAll': 2,
  'filterAll: false': 1,
  filterAll: 19,
  'comments:': 4,
  channelRef: 26,
  syncStoredMainKeywordsWithChannels: 1,
  syncFilterAllKeywords: 1,
  filterKeywordsComments: 0,
  profile: 7,
  listType: 1,
  metadata: 18,
  comment_filter_toggled: 0,
  channel_added: 4,
  kids_channel_added: 1,
  scheduleAutoBackupInBackground: 1,
  FilterTube_ScheduleAutoBackup: 1,
  'browserAPI_BRIDGE.runtime.sendMessage': 2,
  'chrome.runtime.sendMessage': 1,
  "source: 'channel'": 6,
  parsePackedChannelKeywordSource: 2,
  'filterAll !== true': 1,
  'filterAll) return': 1
};

const missingRuntimeSymbols = [
  'addFilteredChannelFilterAllCommentsContract',
  'addFilteredChannelFilterAllCommentsPayloadPolicy',
  'addFilteredChannelFilterAllCommentsReceiverReport',
  'addFilteredChannelFilterAllCommentsDefaultPolicy',
  'addFilteredChannelFilterAllCommentsCompilerReport',
  'addFilteredChannelFilterAllCommentsExistingRowReport',
  'addFilteredChannelFilterAllCommentsJsonProvenanceReport',
  'addFilteredChannelFilterAllCommentsBackupPolicy',
  'addFilteredChannelFilterAllCommentsFixtureProvenance',
  'addFilteredChannelFilterAllCommentsAuthorityGate'
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

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return { start, block: text.slice(start, end) };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256Text(block),
    block
  };
}

function selectedSource() {
  return Object.values(blockSpecs).map((spec) => blockMetric(spec).block).join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadContentDirectAddRuntime(hostname = 'www.youtube.com') {
  const block = blockMetric(blockSpecs.contentBridgeAddChannelDirectly).block;
  const messages = [];
  const context = {
    console: { warn() {}, log() {}, error() {} },
    location: { hostname },
    window: {},
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(message, callback) {
          messages.push(plain(message));
          if (message.type === 'addFilteredChannel') {
            callback?.({ success: true, channelData: { id: 'UCdirectcomments00001' } });
          } else {
            callback?.({ ok: true });
          }
        }
      }
    },
    Promise,
    JSON,
    String
  };
  vm.createContext(context);
  vm.runInContext(`${block}\nthis.addChannelDirectly = addChannelDirectly;`, context);
  return { context, messages };
}

function loadReceiverRuntime() {
  const receiverBlock = blockMetric(blockSpecs.backgroundAddFilteredChannelReceiver).block;
  const context = {
    __helperCalls: [],
    __backups: [],
    __responses: [],
    globalThis: {},
    console: { log() {}, warn() {}, error() {} },
    handleAddFilteredChannel(...args) {
      context.__helperCalls.push(plain(args));
      return Promise.resolve({ success: true, channelData: { id: 'UCreceivercomments0001' } });
    },
    scheduleAutoBackupInBackground(trigger) {
      context.__backups.push(trigger);
    },
    Promise,
    JSON,
    String,
    Boolean
  };
  vm.createContext(context);
  vm.runInContext(`
    this.runReceiver = function(message) {
      const sender = { id: 'sender-fixture' };
      const sendResponse = (response) => this.__responses.push(response);
      ${receiverBlock}
      return false;
    };
  `, context);
  return context;
}

function loadBackgroundSyncRuntime() {
  const block = blockMetric(blockSpecs.backgroundChannelDerivedKeywordHelpersAndSync).block;
  const context = { Date, JSON, String, Array, Set, Map };
  vm.createContext(context);
  vm.runInContext(`${block}\nthis.syncStoredMainKeywordsWithChannels = syncStoredMainKeywordsWithChannels;`, context);
  return context;
}

function loadSettingsSharedRuntime() {
  const context = {
    console: { warn() {}, log() {}, error() {} },
    Date,
    JSON,
    window: null,
    globalThis: null,
    chrome: {
      storage: {
        local: {
          get(_keys, callback) { callback({}); },
          set(_payload, callback) { callback?.(); }
        }
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInContext(read('js/settings_shared.js'), vm.createContext(context), {
    filename: path.join(repoRoot, 'js/settings_shared.js')
  });
  return context.FilterTubeSettings;
}

test('addFilteredChannel Filter All comments default audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /addFilteredChannel Filter All comments default source files: 4/);
  assert.match(audit, /addFilteredChannel Filter All comments default source\/effect blocks: 8/);
  assert.match(audit, /runtime addFilteredChannel Filter All comments default fixtures: 11/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('addFilteredChannel Filter All comments default source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${name}\` \\| \`${escapeRegex(`${spec.file}:${spec.startLine}`)}\` \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }
});

test('addFilteredChannel Filter All comments default selected token counts remain pinned', () => {
  const source = selectedSource();
  const audit = doc();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(token)}\` \\| ${expected} \\|`));
  }
});

test('addFilteredChannel Filter All comments default missing future symbols remain absent from product runtime', () => {
  const source = productRuntimeSource();
  const audit = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in runtime`);
    assert.match(audit, new RegExp(`- \`${symbol}\``));
  }
});

test('content addChannelDirectly sends filterAll without filterAllComments payload', async () => {
  const runtime = loadContentDirectAddRuntime('www.youtube.com');

  const result = await runtime.context.addChannelDirectly('@directcomments', true, ['@other'], 'group-1', {
    handleDisplay: '@DirectComments',
    canonicalHandle: '@directcomments',
    channelName: 'Direct Comments',
    channelLogo: 'https://example.test/logo.png',
    videoId: 'abcdefghijk',
    videoTitleHint: 'Video Fixture',
    expectedChannelName: 'Direct Comments',
    lowConfidenceExpectedName: true,
    customUrl: 'c/DirectComments',
    source: 'playlist_fallback_menu',
    filterAllComments: false
  });

  assert.equal(result.success, true);
  assert.equal(runtime.messages[0].type, 'addFilteredChannel');
  assert.equal(runtime.messages[0].input, '@directcomments');
  assert.equal(runtime.messages[0].filterAll, true);
  assert.equal(runtime.messages[0].profile, 'main');
  assert.equal(Object.hasOwn(runtime.messages[0], 'filterAllComments'), false);
  assert.equal(Object.hasOwn(runtime.messages[0], 'comments'), false);
  assert.equal(runtime.messages[1].action, 'FilterTube_ScheduleAutoBackup');
  assert.equal(runtime.messages[1].triggerType, 'channel_added');
});

test('content addChannelDirectly uses kids profile while still omitting filterAllComments', async () => {
  const runtime = loadContentDirectAddRuntime('www.youtubekids.com');

  await runtime.context.addChannelDirectly('UCkidscomments000001', true, null, null, { filterAllComments: false });

  assert.equal(runtime.messages[0].type, 'addFilteredChannel');
  assert.equal(runtime.messages[0].profile, 'kids');
  assert.equal(runtime.messages[0].filterAll, true);
  assert.equal(Object.hasOwn(runtime.messages[0], 'filterAllComments'), false);
});

test('background addFilteredChannel receiver drops filterAllComments before helper call', async () => {
  const runtime = loadReceiverRuntime();
  const returned = runtime.runReceiver({
    type: 'addFilteredChannel',
    input: '@receivercomments',
    filterAll: true,
    filterAllComments: false,
    collaborationWith: ['@other'],
    collaborationGroupId: 'group-2',
    displayHandle: '@ReceiverComments',
    canonicalHandle: '@receivercomments',
    channelName: 'Receiver Comments',
    channelLogo: 'https://example.test/logo.png',
    videoTitleHint: 'Receiver Fixture',
    expectedChannelName: 'Receiver Comments',
    lowConfidenceExpectedName: true,
    customUrl: 'c/ReceiverComments',
    source: 'playlist_fallback_menu',
    profile: 'kids',
    videoId: 'lmnopqrstuv',
    listType: 'whitelist'
  });

  assert.equal(returned, true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(runtime.__helperCalls.length, 1);
  assert.deepEqual(runtime.__helperCalls[0], [
    '@receivercomments',
    true,
    ['@other'],
    'group-2',
    {
      displayHandle: '@ReceiverComments',
      canonicalHandle: '@receivercomments',
      channelName: 'Receiver Comments',
      channelLogo: 'https://example.test/logo.png',
      videoTitleHint: 'Receiver Fixture',
      expectedChannelName: 'Receiver Comments',
      lowConfidenceExpectedName: true,
      customUrl: 'c/ReceiverComments',
      source: 'playlist_fallback_menu'
    },
    'kids',
    'lmnopqrstuv'
  ]);
  assert.equal(runtime.__helperCalls[0].length, 7);
  assert.deepEqual(runtime.__backups, ['kids_channel_added']);
});

test('background new-channel object stores filterAll but has no filterAllComments field', () => {
  const signature = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelSignature).block;
  const newChannel = blockMetric(blockSpecs.backgroundNewChannelObject).block;
  const existingUpdate = blockMetric(blockSpecs.backgroundExistingChannelUpdate).block;

  assert.match(signature, /async function handleAddFilteredChannel\(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = \{\}, profile = 'main', videoId = '', listType = 'blocklist'\)/);
  assert.match(newChannel, /filterAll: filterAll,/);
  assert.doesNotMatch(newChannel, /filterAllComments/);
  assert.match(existingUpdate, /\.\.\.existing/);
  assert.match(existingUpdate, /if \(filterAll && !existing\.filterAll\) \{\s+updated\.filterAll = true;/);
  assert.doesNotMatch(existingUpdate, /filterAllComments/);
});

test('background and shared compilers default missing filterAllComments to comment-enabled', () => {
  const backgroundRuntime = loadBackgroundSyncRuntime();
  const backgroundSynced = backgroundRuntime.syncStoredMainKeywordsWithChannels([], [
    { id: 'UCdefaultcomments0001', name: 'Default Comments', filterAll: true, addedAt: 2000 },
    { id: 'UCmutedcomments00001', name: 'Muted Comments', filterAll: true, filterAllComments: false, addedAt: 1000 },
    { id: 'UCinactivecomments01', name: 'Inactive Comments', filterAll: false, filterAllComments: false, addedAt: 3000 }
  ]);

  assert.ok(backgroundSynced.some((entry) => entry.channelRef === 'ucdefaultcomments0001' && entry.comments === true));
  assert.ok(backgroundSynced.some((entry) => entry.channelRef === 'ucmutedcomments00001' && entry.comments === false));
  assert.equal(backgroundSynced.some((entry) => entry.channelRef === 'ucinactivecomments01'), false);

  const Settings = loadSettingsSharedRuntime();
  const sharedSynced = Settings.syncFilterAllKeywords([], [
    { id: 'UCshareddefault001', name: 'Shared Default', filterAll: true, addedAt: 2000 },
    { id: 'UCsharedmuted0001', name: 'Shared Muted', filterAll: true, filterAllComments: false, addedAt: 1000 }
  ]);

  assert.ok(sharedSynced.some((entry) => entry.channelRef === 'ucshareddefault001' && entry.comments === true));
  assert.ok(sharedSynced.some((entry) => entry.channelRef === 'ucsharedmuted0001' && entry.comments === false));
});

test('StateManager enrichment addFilteredChannel message is comment-scope silent', () => {
  const block = blockMetric(blockSpecs.stateManagerChannelEnrichmentMessage).block;

  assert.match(block, /type: 'addFilteredChannel'/);
  assert.match(block, /filterAll: false/);
  assert.match(block, /profile: task\.profile \|\| 'main'/);
  assert.doesNotMatch(block, /filterAllComments/);
  assert.doesNotMatch(block, /comments:/);
});

test('addFilteredChannel Filter All comments default audit doc records payload and provenance gaps', () => {
  const audit = doc();

  assert.match(audit, /Content `addChannelDirectly\(\)` forwards `filterAll` but does not forward `filterAllComments`/);
  assert.match(audit, /secondary background receiver drops `filterAllComments` even when the/);
  assert.match(audit, /new channel object stores `filterAll: filterAll` without a `filterAllComments` field/);
  assert.match(audit, /Existing rows preserve whatever `filterAllComments` they already had/);
  assert.match(audit, /missing `filterAllComments` compiles as `comments: true`/);
  assert.match(audit, /with `filterAll: false` and no comments-scope field/);
  assert.match(audit, /payload policy/);
  assert.match(audit, /default comments policy/);
  assert.match(audit, /JSON comment provenance report/);
});
