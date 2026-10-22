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
  'js/content_bridge.js': [15054, 678313, '4daad851b77516cbe723e6695d5553752f663be55813b7019bfddce2479a917a'],
  'js/background.js': [8538, 386043, 'cc89bb4a0375145e1c811b7cf5953729c39c409b6b24cacdc65c80f9f6ff44d0'],
  'js/state_manager.js': [2979, 124009, '04879b5b1dcac9229c70d0ea14241667755682649865ad1d52030c1ce21950d3'],
  'js/settings_shared.js': [1313, 66857, '19f0a1fb3cd512494481b7eb39169bf84feeda4a0a6a20cf58ebaf1c18ff7ba9']
};

const blockSpecs = {
  contentBridgeAddChannelDirectly: {
    file: 'js/content_bridge.js',
    start: 'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {',
    end: '/**\n * Add "Filter All Content" checkbox below the blocked channel',
    startLine: 14856,
    lines: 55,
    bytes: 2759,
    hash: 'de0b0304a2269331926856153492eae471d385455e5548c45b11f8cf01e4582d'
  },
  backgroundAddFilteredChannelReceiver: {
    file: 'js/background.js',
    start: "if (message.type === 'addFilteredChannel')",
    end: "if (message.type === 'toggleChannelFilterAll')",
    startLine: 7072,
    lines: 58,
    bytes: 2408,
    hash: '3a506e117b2d2a79bc9156c5dcb782077c69bc63a3b3a3fe982d25d7f2f5553c'
  },
  backgroundHandleAddFilteredChannelSignature: {
    file: 'js/background.js',
    start: 'async function handleAddFilteredChannel(input, filterAll = false',
    end: '        const isHandleLike = (value) => {',
    startLine: 7156,
    lines: 2,
    bytes: 204,
    hash: 'ce94174aa1b2f302e1e89a75b463271aa13d1c95f62cb89ee34364fb9c3ab603'
  },
  backgroundExistingChannelUpdate: {
    file: 'js/background.js',
    start: 'const updated = {\n                ...existing,',
    end: '            if (Array.isArray(collaborationWith) && collaborationWith.length > 0) {',
    startLine: 7974,
    lines: 22,
    bytes: 1331,
    hash: 'ccc5b7c341685ced769a8bab9846303ca1b3028fe0ee71a768993c1c8bdc35cb'
  },
  backgroundNewChannelObject: {
    file: 'js/background.js',
    start: 'const newChannel = {\n                id: channelInfo.id,',
    end: '            channels.unshift(newChannel);',
    startLine: 8025,
    lines: 21,
    bytes: 1181,
    hash: '2502df79c0fb8aecc76228aee6d237d09930e56f75edf58b8effd4f15495b692'
  },
  backgroundChannelDerivedKeywordHelpersAndSync: {
    file: 'js/background.js',
    start: 'function getChannelDerivedKeywordRef(channel) {',
    end: '// Deep link into the tab-view dashboard',
    startLine: 1891,
    lines: 106,
    bytes: 3482,
    hash: '22f1f880c4b67f0b366020641f94e988d19a4e0312b073c20048c4f2bcd0a455'
  },
  stateManagerChannelEnrichmentMessage: {
    file: 'js/state_manager.js',
    start: "chrome.runtime.sendMessage({\n            type: 'addFilteredChannel',",
    end: '        }, () => {\n            channelEnrichmentProcessedThisSession++;',
    startLine: 850,
    lines: 12,
    bytes: 460,
    hash: '1f802c946742b856d5c4f6aea62777de9e1e3fcebae08085d632259d1bac0132'
  },
  settingsSharedSyncFilterAllKeywords: {
    file: 'js/settings_shared.js',
    start: 'function syncFilterAllKeywords',
    end: '    function buildCompiledSettings',
    startLine: 493,
    lines: 75,
    bytes: 3138,
    hash: 'e53763406df6485ad16125eeba30be1bd1e10688f211d4541915bc9f8063c91b'
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
  profile: 6,
  listType: 2,
  metadata: 20,
  comment_filter_toggled: 0,
  channel_added: 6,
  kids_channel_added: 1,
  whitelist_channel_added: 2,
  kids_whitelist_channel_added: 1,
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

function formatNumber(value) {
  return Number(value).toLocaleString('en-US');
}

function formatSourceNumber(file, value) {
  return file === 'js/background.js' ? String(value) : formatNumber(value);
}

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
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${formatSourceNumber(file, lines)} \\| ${formatSourceNumber(file, bytes)} \\| \`${hash}\` \\|`));
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
    'lmnopqrstuv',
    'whitelist'
  ]);
  assert.equal(runtime.__helperCalls[0].length, 8);
  assert.deepEqual(runtime.__backups, ['kids_whitelist_channel_added']);
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
