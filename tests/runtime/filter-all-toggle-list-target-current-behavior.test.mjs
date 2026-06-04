import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FILTER_ALL_TOGGLE_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [6711, 301840, 'b27206ec2b6927fc33f823c4832ff95ace7c97bd4284eb950fc5964baf666346'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']
};

const blockSpecs = {
  backgroundToggleChannelFilterAllReceiver: {
    file: 'js/background.js',
    start: "if (message.type === 'toggleChannelFilterAll')",
    end: 'return false;\n});',
    startLine: 5673,
    lines: 14,
    bytes: 413,
    hash: '7e15cc800cdde69487959513b30d2cfab29c55f9b1caa566f96b99bcb844c94e'
  },
  backgroundHandleToggleChannelFilterAll: {
    file: 'js/background.js',
    start: 'async function handleToggleChannelFilterAll(channelId, value) {',
    end: "console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} loaded and ready to serve filtered content.`);",
    startLine: 6599,
    lines: 95,
    bytes: 3435,
    hash: '84afd60fbb6c140a1a20880b7cb2b81a7ce33fe95c89b4278c1d00e1b1756dd4'
  },
  contentBridgeAddFilterAllContentCheckbox: {
    file: 'js/content_bridge.js',
    start: 'function addFilterAllContentCheckbox(menuItem, channelData) {',
    end: 'function contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard) {',
    startLine: 13499,
    lines: 66,
    bytes: 2391,
    hash: '03861f56c173757f479e0863d16fab83df5ba180e5d21d8adb37cdf0b5fcb490'
  },
  stateManagerToggleChannelFilterAll: {
    file: 'js/state_manager.js',
    start: 'async function toggleChannelFilterAll(index) {',
    end: 'async function toggleChannelFilterAllCommentsByRef(channelRef) {',
    startLine: 1892,
    lines: 34,
    bytes: 988,
    hash: 'b7028d96e93e5b89cfcf68d83d09256c9b06888a3b5b0ee181e6165f74318298'
  },
  stateManagerToggleKidsChannelFilterAll: {
    file: 'js/state_manager.js',
    start: 'async function toggleKidsChannelFilterAll(index) {',
    end: '/**\n     * Save current state to storage',
    startLine: 968,
    lines: 36,
    bytes: 1188,
    hash: 'f798f6b4a379f1101dea3b1777b046e2631ea1ab032b01b56716dc09878b72ac'
  }
};

const selectedCounts = {
  toggleChannelFilterAll: 3,
  handleToggleChannelFilterAll: 2,
  filterChannels: 4,
  whitelistChannels: 0,
  blockedChannels: 8,
  ftProfilesV3: 1,
  FT_PROFILES_V4_KEY: 3,
  currentSettings: 0,
  filterAll: 18,
  filterAllComments: 1,
  channelId: 6,
  channelData: 4,
  'message.channelId': 1,
  'message.value': 1,
  isTrustedUiSender: 0,
  isProfileSessionAuthorized: 0,
  'storage.local.get': 1,
  'storage.local.set': 1,
  'compiledSettingsCache.main = null': 1,
  'compiledSettingsCache.kids = null': 1,
  scheduleAutoBackupInBackground: 1,
  filter_all_toggled: 3,
  kids_filter_all_toggled: 1,
  requestRefresh: 1,
  scheduleAutoBackup: 3,
  saveSettings: 1,
  persistKidsProfiles: 1,
  notifyListeners: 2,
  isUiLocked: 2,
  profile: 10,
  kids: 20,
  main: 8,
  querySelector: 4,
  addEventListener: 2,
  change: 2,
  click: 3,
  'browserAPI_BRIDGE.runtime.sendMessage': 1
};

const missingRuntimeSymbols = [
  'filterAllToggleListTargetContract',
  'filterAllToggleReceiverReport',
  'filterAllToggleSenderPolicy',
  'filterAllToggleListTargetPolicy',
  'filterAllToggleProfileTargetReport',
  'filterAllToggleStorageWriteReport',
  'filterAllToggleCacheInvalidationReport',
  'filterAllToggleRowActionParityReport',
  'filterAllToggleCommentScopeReport',
  'filterAllToggleFixtureProvenance'
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
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixtureProfilesV4(channel = { id: 'UCfilteralltoggle0000001', handle: '@filterall', name: 'Filter All', filterAll: false }) {
  return {
    schemaVersion: 4,
    activeProfileId: 'active',
    profiles: {
      active: {
        name: 'Active',
        settings: { enabled: true },
        main: {
          channels: [plain(channel)],
          keywords: [{ pattern: 'keep-me', source: 'user' }],
          blockedKeywords: [{ pattern: 'keep-me', source: 'user' }],
          whitelistChannels: [{ id: 'UCwhitelistonly000001', handle: '@allowonly', name: 'Allow Only', filterAll: false }]
        },
        kids: {
          mode: 'whitelist',
          blockedChannels: [{ id: 'UCkidsblock000000001', handle: '@kidsblock', filterAll: false }],
          whitelistChannels: [{ id: 'UCkidsallow000000001', handle: '@kidsallow', filterAll: false }]
        }
      }
    }
  };
}

function loadBackgroundToggleRuntime(storageState) {
  const getCalls = [];
  const setPayloads = [];
  const context = {
    FT_PROFILES_V4_KEY: 'ftProfilesV4',
    DEFAULT_PROFILE_ID: 'default',
    compiledSettingsCache: { main: { cached: true }, kids: { cached: true } },
    console: { log() {}, warn() {}, error() {} },
    browserAPI: {
      storage: {
        local: {
          get(keys, callback) {
            getCalls.push(keys);
            callback(plain(storageState));
          },
          set(payload, callback = () => {}) {
            setPayloads.push(plain(payload));
            Object.assign(storageState, plain(payload));
            callback();
          }
        }
      }
    },
    isValidProfilesV4(value) {
      return Boolean(value && typeof value === 'object' && value.profiles && typeof value.profiles === 'object');
    },
    buildProfilesV4FromLegacyState(storage) {
      return fixtureProfilesV4({ id: 'UClegacy000000000000001', handle: '@legacy', name: 'Legacy', filterAll: false });
    },
    safeObject(value) {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    },
    safeArray(value) {
      return Array.isArray(value) ? value : [];
    },
    syncStoredMainKeywordsWithChannels(keywords) {
      return Array.isArray(keywords) ? keywords : [];
    },
    Promise,
    JSON,
    String,
    Array,
    Object,
    Boolean
  };
  vm.createContext(context);
  vm.runInContext(`${blockMetric(blockSpecs.backgroundHandleToggleChannelFilterAll).block}\nthis.handleToggleChannelFilterAll = handleToggleChannelFilterAll;`, context);
  return { context, getCalls, setPayloads };
}

function loadReceiverRuntime() {
  const receiverBlock = blockMetric(blockSpecs.backgroundToggleChannelFilterAllReceiver).block;
  const context = {
    __helperCalls: [],
    __backups: [],
    __responses: [],
    handleToggleChannelFilterAll(...args) {
      context.__helperCalls.push(plain(args));
      return Promise.resolve({ success: true });
    },
    scheduleAutoBackupInBackground(trigger) {
      context.__backups.push(trigger);
    },
    Promise,
    JSON
  };
  vm.createContext(context);
  vm.runInContext(`
    this.runReceiver = function(message) {
      const sendResponse = (response) => this.__responses.push(response);
      ${receiverBlock}
      return false;
    };
  `, context);
  return context;
}

test('filter-all toggle list-target audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /Filter All mutation authority/);
  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${formatSourceNumber(file, lines)} \\| ${formatSourceNumber(file, bytes)} \\| \`${hash}\` \\|`));
  }
});

test('filter-all toggle source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${name}\` \\| \`${spec.file.replace('.', '\\.')}:${spec.startLine}\` \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }
});

test('filter-all toggle selected token counts remain pinned', () => {
  const source = selectedSource();
  const audit = doc();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(audit, new RegExp(`\\| \`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${expected} \\|`));
  }
});

test('filter-all toggle missing future symbols remain absent from product runtime', () => {
  const source = productRuntimeSource();
  const audit = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in runtime`);
    assert.match(audit, new RegExp(`- \`${symbol}\``));
  }
});

test('content bridge Filter All checkbox sends channel id or handle without profile/list target', () => {
  const block = blockMetric(blockSpecs.contentBridgeAddFilterAllContentCheckbox).block;

  assert.match(block, /type: 'toggleChannelFilterAll'/);
  assert.match(block, /channelId: channelData\?\.id \|\| channelData\?\.handle/);
  assert.match(block, /value: checked/);
  assert.match(block, /checkbox\.addEventListener\('change'/);
  assert.equal(countLiteral(block, 'profile'), 0);
  assert.equal(countLiteral(block, 'listMode'), 0);
  assert.equal(countLiteral(block, 'whitelistChannels'), 0);
  assert.equal(countLiteral(block, 'filterChannels'), 0);
});

test('background toggle receiver forwards only channelId and value then schedules backup', async () => {
  const runtime = loadReceiverRuntime();
  const returned = runtime.runReceiver({
    type: 'toggleChannelFilterAll',
    channelId: '@filterall',
    value: true,
    profile: 'kids',
    listType: 'whitelist'
  });

  assert.equal(returned, true);
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(runtime.__helperCalls, [['@filterall', true]]);
  assert.deepEqual(runtime.__backups, ['filter_all_toggled']);
  assert.equal(runtime.__responses[0].success, true);
});

test('background helper toggles root filterChannels and active V4 main.channels only', async () => {
  const channel = { id: 'UCfilteralltoggle0000001', handle: '@filterall', name: 'Filter All', filterAll: false };
  const storageState = {
    filterChannels: [plain(channel)],
    uiKeywords: [],
    filterKeywords: [],
    ftProfilesV3: {
      main: { whitelistedChannels: [{ id: 'UCv3allow000000000001', handle: '@v3allow', filterAll: false }] },
      kids: { blockedChannels: [{ id: 'UCv3kidsblock000001', handle: '@v3kidsblock', filterAll: false }] }
    },
    ftProfilesV4: fixtureProfilesV4(channel)
  };
  const runtime = loadBackgroundToggleRuntime(storageState);

  const result = await runtime.context.handleToggleChannelFilterAll('UCfilteralltoggle0000001', true);

  assert.deepEqual(plain(runtime.getCalls[0]), ['filterChannels', 'uiKeywords', 'filterKeywords', 'ftProfilesV3', 'ftProfilesV4']);
  assert.equal(result.success, true);
  assert.equal(runtime.setPayloads.length, 1);
  assert.equal(runtime.setPayloads[0].filterChannels[0].filterAll, true);
  assert.equal(runtime.setPayloads[0].ftProfilesV4.profiles.active.main.channels[0].filterAll, true);
  assert.equal(runtime.setPayloads[0].ftProfilesV4.profiles.active.main.whitelistChannels[0].filterAll, false);
  assert.equal(runtime.setPayloads[0].ftProfilesV4.profiles.active.kids.blockedChannels[0].filterAll, false);
  assert.equal(runtime.setPayloads[0].ftProfilesV4.profiles.active.kids.whitelistChannels[0].filterAll, false);
  assert.equal(Object.hasOwn(runtime.setPayloads[0], 'ftProfilesV3'), false);
  assert.equal(runtime.context.compiledSettingsCache.main, null);
  assert.equal(runtime.context.compiledSettingsCache.kids, null);
});

test('background helper returns not found for whitelist-only row and writes nothing', async () => {
  const storageState = {
    filterChannels: [],
    uiKeywords: [],
    filterKeywords: [],
    ftProfilesV3: {
      main: { whitelistedChannels: [{ id: 'UCwhitelistonly000001', handle: '@allowonly', filterAll: false }] }
    },
    ftProfilesV4: fixtureProfilesV4()
  };
  const runtime = loadBackgroundToggleRuntime(storageState);

  const result = await runtime.context.handleToggleChannelFilterAll('UCwhitelistonly000001', true);

  assert.deepEqual(plain(result), { success: false, error: 'Channel not found' });
  assert.equal(runtime.setPayloads.length, 0);
  assert.deepEqual(runtime.context.compiledSettingsCache, { main: { cached: true }, kids: { cached: true } });
});

test('StateManager Main and Kids Filter All UI paths guard whitelist mode', () => {
  const mainBlock = blockMetric(blockSpecs.stateManagerToggleChannelFilterAll).block;
  const kidsBlock = blockMetric(blockSpecs.stateManagerToggleKidsChannelFilterAll).block;

  assert.match(mainBlock, /if \(isUiLocked\(\)\) \{/);
  assert.match(mainBlock, /if \(state\.mode === 'whitelist'\) \{/);
  assert.match(mainBlock, /return false;/);
  assert.match(mainBlock, /state\.channels\[index\]\.filterAll = !state\.channels\[index\]\.filterAll;/);
  assert.match(mainBlock, /recomputeKeywords\(\);/);
  assert.match(mainBlock, /await saveSettings\(\);/);
  assert.match(mainBlock, /scheduleAutoBackup\('filter_all_toggled'\);/);

  assert.match(kidsBlock, /if \(isUiLocked\(\)\) \{/);
  assert.match(kidsBlock, /if \(kids\.mode === 'whitelist'\) \{/);
  assert.match(kidsBlock, /existing\.filterAll = !existing\.filterAll;/);
  assert.match(kidsBlock, /await persistKidsProfiles\(state\.kids\);/);
  assert.match(kidsBlock, /await requestRefresh\('kids'\);/);
  assert.match(kidsBlock, /scheduleAutoBackup\('kids_filter_all_toggled'\);/);
});

test('filter-all toggle audit doc records list-target behavior and open gates', () => {
  const audit = doc();

  assert.match(audit, /does not include profile, list mode, whitelist\/blocklist target/);
  assert.match(audit, /calls `handleToggleChannelFilterAll\(message\.channelId, message\.value\)`/);
  assert.match(audit, /does not check `isTrustedUiSender\(\)`/);
  assert.match(audit, /searches only root `filterChannels`/);
  assert.match(audit, /exists only in V4 Main whitelist, V4 Kids lists, or V3 whitelist lists/);
  assert.match(audit, /writes root `filterChannels`/);
  assert.match(audit, /does not update V4 Main whitelist rows, V4 Kids rows, V3 Kids rows, or V3 Main whitelist rows/);
  assert.match(audit, /StateManager’s visible UI paths are narrower/);
  assert.match(audit, /returns `false` when `state\.mode === 'whitelist'`/);
  assert.match(audit, /returns `false` when `kids\.mode === 'whitelist'`/);
  assert.match(audit, /Filter All toggle contracts/);
  assert.match(audit, /list-target policies/);
  assert.match(audit, /row-action parity reports/);
  assert.match(audit, /comment-scope reports/);
});
