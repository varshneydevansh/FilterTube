import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/state_manager.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function sourceStats() {
  const buffer = readBuffer(sourcePath);
  const source = buffer.toString('utf8');
  return {
    bytes: buffer.length,
    sha256: sha256(sourcePath),
    splitLines: source.split(/\r?\n/).length,
    wcLines: (source.match(/\n/g) || []).length
  };
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

function groupForMethod(name) {
  if (['isUiLocked', 'scheduleAutoBackup', 'getKidsState', 'ensureLoaded'].includes(name)) return 'lockBackupAndAccessHelpers';
  if (['loadSettings', 'saveSettings', 'normalizeMainProfileAliasFields', 'persistMainProfiles', 'persistKidsProfiles', 'broadcastSettings', 'requestRefresh'].includes(name)) return 'settingsSaveProfileBroadcast';
  if ([
    'scheduleChannelNameEnrichment',
    'resetEnrichmentState',
    'isHandleLike',
    'shouldEnrichChannel',
    'channelEnrichmentKey',
    'computeChannelSignature',
    'queueChannelForEnrichment',
    'triggerChannelEnrichmentRefresh',
    'enqueueChannelEnrichment',
    'maybeRefreshEnrichmentFromChannels',
    'processChannelEnrichmentQueue'
  ].includes(name)) return 'channelEnrichmentQueue';
  if ([
    'addKidsKeyword',
    'removeKidsKeyword',
    'toggleKidsKeywordComments',
    'toggleKidsKeywordExact',
    'normalizeKidsChannelInput',
    'addKidsChannel',
    'removeKidsChannel',
    'toggleKidsChannelFilterAll'
  ].includes(name)) return 'kidsKeywordAndChannelMutations';
  if (['addKeyword', 'toggleKeywordComments', 'removeKeyword', 'toggleKeywordExact', 'recomputeKeywords'].includes(name)) return 'mainKeywordMutations';
  if ([
    'delay',
    'sendMessageToTab',
    'getActiveProfileContext',
    'addChannel',
    'fetchSubscribedChannelsFromImportTab',
    'importSubscribedChannelsToWhitelist',
    'removeChannel',
    'toggleChannelFilterAll',
    'toggleChannelFilterAllCommentsByRef',
    'isDuplicateChannel',
    'persistChannelMap'
  ].includes(name)) return 'mainChannelImportAndMapMutations';
  if ([
    'updateSetting',
    'updateContentFilters',
    'updateKidsContentFilters',
    'updateCategoryFilters',
    'updateKidsCategoryFilters'
  ].includes(name)) return 'toggleContentCategoryMutations';
  if (['toggleTheme', 'setTheme', 'subscribe', 'notifyListeners'].includes(name)) return 'themeAndListenerApi';
  if (name === 'setupStorageListener') return 'storageSyncListener';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const source = read(sourcePath);
  const rows = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s{4}(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
    }
  });
  return rows;
}

function broadCallableRows() {
  const source = read(sourcePath);
  const re = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  const rows = [];
  let match;
  while ((match = re.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  return rows;
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}return\s+\{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    let match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*),?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1], kind: 'shorthand' });
    match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*):\s*\(.*?=>/);
    if (match) rows.push({ line: index + 1, name: match[1], kind: 'arrow' });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countNames(rows) {
  const out = {};
  for (const name of rows) out[name] = (out[name] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function uniqueNotifyEvents() {
  const events = new Set();
  for (const match of read(sourcePath).matchAll(/notifyListeners\('([^']+)'/g)) {
    events.add(match[1]);
  }
  return [...events].sort();
}

function runtimeActions() {
  const actions = new Set();
  for (const match of read(sourcePath).matchAll(/'FilterTube_[A-Za-z0-9_]+'/g)) {
    actions.add(match[0].slice(1, -1));
  }
  return [...actions].sort();
}

function storageChangedKeys() {
  const lines = read(sourcePath).split(/\r?\n/);
  const keys = [];
  let inKeys = false;
  for (const line of lines) {
    if (/const storageKeys = \[/.test(line)) inKeys = true;
    if (inKeys) {
      const match = line.match(/^\s*'([^']+)',?/);
      if (match) keys.push(match[1]);
      if (/\];/.test(line)) inKeys = false;
    }
  }
  return keys;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function baseProfilesV3(overrides = {}) {
  return {
    main: {
      mode: 'blocklist',
      channels: [],
      keywords: [],
      whitelistChannels: [],
      whitelistKeywords: [],
      ...overrides.main
    },
    kids: {
      mode: 'blocklist',
      blockedChannels: [],
      blockedKeywords: [],
      whitelistChannels: [],
      whitelistKeywords: [],
      strictMode: true,
      ...overrides.kids
    }
  };
}

function baseProfilesV4(activeMain, activeKids = {}, activeSettings = {}) {
  return {
    schemaVersion: 4,
    activeProfileId: 'default',
    profiles: {
      default: {
        name: 'Default',
        main: {
          mode: 'blocklist',
          channels: [],
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: [],
          ...activeMain
        },
        kids: {
          mode: 'blocklist',
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: [],
          strictMode: true,
          ...activeKids
        },
        settings: {
          syncKidsToMain: false,
          ...activeSettings
        }
      }
    }
  };
}

function loadStateManagerRuntime(options = {}) {
  let settings = plain(options.settings || {
    enabled: true,
    keywords: [],
    userKeywords: [],
    channels: [],
    channelMap: {},
    theme: 'light',
    themeSource: 'system',
    contentFilters: {
      duration: { enabled: false, condition: 'between', value: '', minMinutes: 0, maxMinutes: 0 },
      uploadDate: { enabled: false, condition: 'newer', value: '', fromDate: '', toDate: '' },
      uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
    },
    categoryFilters: { enabled: false, mode: 'block', selected: [] }
  });
  let profilesV3 = plain(options.profilesV3 || baseProfilesV3());
  let profilesV4 = plain(options.profilesV4 || baseProfilesV4({}));
  const events = [];
  const runtimeMessages = [];
  const savedSettings = [];
  const savedProfilesV3 = [];
  const savedProfilesV4 = [];
  const storageSets = [];
  const storageListeners = [];
  const timers = [];
  const appliedThemes = [];
  const persistedThemes = [];
  const warnings = [];
  let settingsLoadCalls = 0;

  const context = {
    console: {
      log() {},
      warn(...args) { warnings.push(args.map(String)); },
      error(...args) { warnings.push(args.map(String)); }
    },
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Promise,
    setTimeout(fn, delayMs) {
      const id = timers.length + 1;
      timers.push({ id, fn, delayMs });
      return id;
    },
    clearTimeout() {},
    FilterTubeIsUiLocked() {
      return options.locked === true;
    },
    FilterTubeSettings: {
      async loadSettings() {
        settingsLoadCalls += 1;
        return plain(settings);
      },
      async saveSettings(payload) {
        savedSettings.push(plain(payload));
        settings = { ...settings, ...plain(payload) };
        return { compiledSettings: { compiled: true, source: 'saveSettings', payload: plain(payload) } };
      },
      syncFilterAllKeywords(userKeywords, channels) {
        const base = Array.isArray(userKeywords) ? userKeywords.map(plain) : [];
        const derived = (Array.isArray(channels) ? channels : [])
          .filter((channel) => channel?.filterAll === true)
          .map((channel) => ({
            word: channel.name || channel.handle || channel.id || '',
            exact: true,
            semantic: false,
            source: 'channel',
            channelRef: String(channel.id || channel.handle || channel.name || '').toLowerCase(),
            comments: channel.filterAllComments !== false
          }));
        return [...base, ...derived];
      },
      applyThemePreference(theme) {
        appliedThemes.push(theme);
      },
      async setThemePreference(theme) {
        persistedThemes.push(theme);
      },
      resolveThemePreference(value) {
        return value === 'dark' ? 'dark' : 'light';
      },
      getChannelDerivedKey(channel) {
        return String(channel?.id || channel?.handle || channel?.name || '').toLowerCase();
      }
    },
    FilterTubeIO: {
      async loadProfilesV3() {
        return plain(profilesV3);
      },
      async saveProfilesV3(value) {
        profilesV3 = plain(value);
        savedProfilesV3.push(plain(value));
      },
      async loadProfilesV4() {
        return plain(profilesV4);
      },
      async saveProfilesV4(value) {
        profilesV4 = plain(value);
        savedProfilesV4.push(plain(value));
      }
    },
    FilterTubeIdentity: {
      isUcId(value) {
        return /^UC/i.test(String(value || ''));
      },
      normalizeUcIdForComparison(value) {
        return String(value || '').trim().toLowerCase();
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  context.chrome = {
    runtime: {
      lastError: null,
      sendMessage(message, callback) {
        const msg = plain(message);
        runtimeMessages.push(msg);
        let response = null;
        if (msg?.action === 'getCompiledSettings') {
          response = { compiled: true, profileType: msg.profileType };
        } else if (msg?.action === 'addWhitelistChannelPersistent' || msg?.action === 'addChannelPersistent') {
          response = { success: true, channel: plain(options.addChannelResponse || { id: 'UCnewchannel000000000001', handle: '@new', name: 'New Channel', filterAll: false }) };
        } else if (msg?.action === 'FilterTube_KidsWhitelistChannel' || msg?.action === 'FilterTube_KidsBlockChannel') {
          response = { success: true, channel: plain(options.addKidsChannelResponse || { id: 'UCkidsnew0000000000001', handle: '@kidsnew', name: 'Kids New' }) };
        } else if (msg?.action === 'FilterTube_BatchImportWhitelistChannels') {
          response = { success: true, counts: { imported: msg.channels?.length || 0, updated: 0, duplicates: 0, skipped: 0 }, currentMode: 'whitelist', importedIntoProfileId: msg.targetProfileId };
        }
        if (typeof callback === 'function') {
          callback(response);
          return undefined;
        }
        return Promise.resolve(response);
      }
    },
    storage: {
      local: {
        async set(payload) {
          storageSets.push(plain(payload));
        }
      },
      onChanged: {
        addListener(callback) {
          storageListeners.push(callback);
        }
      }
    },
    tabs: {
      sendMessage(tabId, payload, callback) {
        const response = plain(options.tabResponse || { success: true, channels: [], stats: null });
        if (typeof callback === 'function') callback(response);
        return undefined;
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);
  const unsubscribe = context.StateManager.subscribe((eventType, data) => {
    events.push({ eventType, data: plain(data) });
  });

  return {
    context,
    manager: context.StateManager,
    events,
    runtimeMessages,
    savedSettings,
    savedProfilesV3,
    savedProfilesV4,
    storageSets,
    storageListeners,
    timers,
    appliedThemes,
    persistedThemes,
    warnings,
    get settingsLoadCalls() { return settingsLoadCalls; },
    unsubscribe
  };
}

test('state manager method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/state_manager\.js/);
  assert.match(text, /IIFE-scoped function declarations: 56/);
  assert.match(text, /plain function declarations: 22/);
  assert.match(text, /async function declarations: 34/);
  assert.match(text, /public API entries: 30/);
  assert.match(text, /semantic method groups: 9/);
  assert.match(text, /runtime action strings: 6/);
  assert.match(text, /listener event names: 20/);
  assert.match(text, /timer sites: 6/);
  assert.match(text, /storage-change listener sites: 1/);
  assert.match(text, /storage-change watched keys: 39/);
  assert.match(text, /not completion proof for every inline helper/);
});

test('state manager method semantic register pins source fingerprint and broad callable reconciliation', () => {
  const stats = sourceStats();
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countNames(broadRows);
  const controlArtifacts = (broadCounts.if || 0) + (broadCounts.for || 0);
  const heldOutsideRegister = broadRows.length - rows.length - controlArtifacts;
  const text = doc();

  assert.deepEqual(stats, {
    bytes: 99780,
    sha256: '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6',
    splitLines: 2492,
    wcLines: 2491
  });
  assert.equal(broadRows.length, 155);
  assert.equal(controlArtifacts, 90);
  assert.equal(heldOutsideRegister, 9);
  assert.deepEqual({
    if: broadCounts.if,
    for: broadCounts.for
  }, {
    if: 87,
    for: 3
  });

  for (const expected of [
    'source split lines: 2492',
    'source wc -l: 2491',
    'source bytes: 99780',
    'source sha256: 509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6',
    'broad lexical callable matches: 155',
    'accepted IIFE-scoped method rows: 56',
    'semantic method rows promoted: 56',
    'control-flow lexical artifacts: 90 (`if`: 87, `for`: 3)',
    'local/helper/listener/timer callbacks held outside this IIFE method register: 9',
    'executable current-behavior probes: 6'
  ]) {
    assert.ok(text.includes(expected), `missing source reconciliation line ${expected}`);
  }
});

test('state manager register accounts for every current IIFE-scoped function', () => {
  const rows = methodRows();

  assert.equal(rows.length, 56);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 34,
    function: 22
  });
  assert.deepEqual(countBy(rows, 'group'), {
    channelEnrichmentQueue: 11,
    kidsKeywordAndChannelMutations: 8,
    lockBackupAndAccessHelpers: 4,
    mainChannelImportAndMapMutations: 11,
    mainKeywordMutations: 5,
    settingsSaveProfileBroadcast: 7,
    storageSyncListener: 1,
    themeAndListenerApi: 4,
    toggleContentCategoryMutations: 5
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('state manager register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing StateManager method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  const publicRows = publicApiRows();
  assert.equal(publicRows.length, 30);
  for (const name of publicRows.map((row) => row.name)) {
    assert.ok(text.includes(name), `missing public API entry ${name}`);
  }
});

test('state manager register pins runtime actions events timers and storage listener shape', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.deepEqual(runtimeActions(), [
    'FilterTube_ApplySettings',
    'FilterTube_BatchImportWhitelistChannels',
    'FilterTube_ImportSubscribedChannels',
    'FilterTube_KidsBlockChannel',
    'FilterTube_KidsWhitelistChannel',
    'FilterTube_ScheduleAutoBackup'
  ]);
  assert.equal(uniqueNotifyEvents().length, 20);
  assert.equal(storageChangedKeys().length, 39);
  assert.equal((source.match(/setTimeout\(/g) || []).length, 6);
  assert.equal((source.match(/chrome\.storage\.onChanged\.addListener/g) || []).length, 1);

  for (const token of [
    'FilterTube_ApplySettings',
    'FilterTube_BatchImportWhitelistChannels',
    'keywordAdded',
    'kidsChannelUpdated',
    'categoryFiltersUpdated',
    'externalUpdate',
    'storage-change watched keys: 39'
  ]) {
    assert.ok(text.includes(token), `missing runtime surface token ${token}`);
  }
});

test('state manager source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /const data = await SettingsAPI\.loadSettings\(\)/);
  assert.match(source, /profilesV3 = await io\.loadProfilesV3\(\)/);
  assert.match(source, /profilesV4 = await io\.loadProfilesV4\(\)/);
  assert.match(source, /state\.contentFilters = data\.contentFilters \? JSON\.parse\(JSON\.stringify\(data\.contentFilters\)\)/);
  assert.match(source, /if \(shouldResetEnrichment\) \{[\s\S]*resetEnrichmentState\(\);[\s\S]*\}/);
  assert.match(source, /notifyListeners\('load', state\)/);
  assert.match(source, /scheduleChannelNameEnrichment\(\)/);

  assert.match(source, /async function saveSettings\(\{ broadcast = true, profile = 'main' \} = \{\}\) \{[\s\S]*if \(isSaving\) return;/);
  assert.match(source, /const result = await SettingsAPI\.saveSettings\(\{/);
  assert.match(source, /if \(broadcast && result\.compiledSettings\) \{[\s\S]*broadcastSettings\(result\.compiledSettings, profile\);[\s\S]*\}/);
  assert.match(source, /notifyListeners\('save', state\)/);

  assert.match(source, /await io\.saveProfilesV3\(merged\)/);
  assert.match(source, /await io\.saveProfilesV4\(nextProfiles\)/);
  assert.match(source, /console\.warn\('StateManager: Failed to persist main profiles \(v3\)'/);
  assert.match(source, /console\.warn\('StateManager: Failed to persist kids profiles'/);

  assert.match(source, /chrome\.runtime\.sendMessage\(\{[\s\S]*type: 'addFilteredChannel'/);
  assert.match(source, /channelEnrichmentProcessedThisSession >= MAX_CHANNEL_ENRICHMENTS_PER_SESSION/);
  assert.match(source, /const delayMs = 5000 \+ Math\.floor\(Math\.random\(\) \* 2000\)/);

  assert.match(source, /action: 'FilterTube_ImportSubscribedChannels'/);
  assert.match(source, /for \(let attempt = 0; attempt < 12; attempt \+= 1\)/);
  assert.match(source, /action: 'FilterTube_BatchImportWhitelistChannels'/);
  assert.match(source, /if \(initialProfileContext\.activeId !== targetProfileId\)/);
  assert.match(source, /if \(latestProfileContext\.activeId !== targetProfileId\)/);

  assert.match(source, /if \(area !== 'local' \|\| isSaving\) return/);
  assert.match(source, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{[\s\S]*return;[\s\S]*\}/);
  assert.match(source, /externalReloadTimer = setTimeout\(\(\) => \{[\s\S]*runExternalReload\(\);[\s\S]*\}, 150\)/);
});

test('state manager executable probes preserve current public method behavior', async () => {
  const whitelistProfiles = baseProfilesV4(
    {
      mode: 'whitelist',
      whitelistChannels: [{ id: 'UCallow000000000000000001', handle: '@allow', name: 'Allowed' }],
      whitelistKeywords: [{ word: 'existing allow', exact: false, source: 'user' }],
      channels: [{ id: 'UCblocked000000000000001', handle: '@blocked', name: 'Blocked' }],
      keywords: [{ word: 'blocked term', source: 'user' }]
    },
    {
      mode: 'whitelist',
      whitelistChannels: [{ id: 'UCkidsallow000000000001', name: 'Kids Allowed' }],
      whitelistKeywords: [{ word: 'kids allow', source: 'user' }],
      blockedChannels: [{ id: 'UCkidsblock000000000001', name: 'Kids Blocked' }],
      blockedKeywords: [{ word: 'kids block', source: 'user' }],
      strictMode: false
    },
    { syncKidsToMain: true }
  );

  const loadRuntime = loadStateManagerRuntime({ profilesV4: whitelistProfiles });
  await loadRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const loadedState = loadRuntime.manager.getState();
  assert.equal(loadedState.mode, 'whitelist');
  assert.equal(loadedState.syncKidsToMain, true);
  assert.equal(loadedState.whitelistChannels[0].id, 'UCallow000000000000000001');
  assert.equal(loadedState.channels[0].id, 'UCblocked000000000000001');
  assert.equal(loadedState.kids.mode, 'whitelist');
  assert.equal(loadedState.kids.strictMode, false);
  assert.deepEqual(loadRuntime.events.map((event) => event.eventType), ['load']);
  assert.equal(loadRuntime.timers.length, 0);

  const keywordRuntime = loadStateManagerRuntime({ profilesV4: whitelistProfiles });
  await keywordRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const keywordAdded = await keywordRuntime.manager.addKeyword(' Focus Mode ', { exact: true, comments: true });
  assert.equal(keywordAdded, true);
  const keywordState = keywordRuntime.manager.getState();
  assert.equal(keywordState.whitelistKeywords[0].word, 'Focus Mode');
  assert.equal(keywordState.whitelistKeywords[0].exact, true);
  assert.equal(keywordState.whitelistKeywords[0].comments, true);
  assert.equal(keywordRuntime.savedProfilesV3.at(-1).main.whitelistedKeywords[0].word, 'Focus Mode');
  assert.equal(keywordRuntime.savedProfilesV4.at(-1).profiles.default.main.whitelistKeywords[0].word, 'Focus Mode');
  assert.deepEqual(keywordRuntime.events.map((event) => event.eventType), ['load', 'keywordAdded']);
  assert.ok(keywordRuntime.runtimeMessages.some((message) => message.action === 'getCompiledSettings' && message.profileType === 'main' && message.forceRefresh === true));
  assert.ok(keywordRuntime.runtimeMessages.some((message) => message.action === 'FilterTube_ApplySettings' && message.profile === 'main'));
  assert.ok(keywordRuntime.runtimeMessages.some((message) => message.action === 'FilterTube_ScheduleAutoBackup' && message.triggerType === 'keyword_added'));

  const addChannelRuntime = loadStateManagerRuntime({
    profilesV4: whitelistProfiles,
    addChannelResponse: { id: 'UCnewwhitelist0000000001', handle: '@newallow', name: 'New Allow', filterAll: false }
  });
  await addChannelRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const addChannelResult = await addChannelRuntime.manager.addChannel('@newallow');
  assert.deepEqual(plain(addChannelResult), {
    success: true,
    channel: { id: 'UCnewwhitelist0000000001', handle: '@newallow', name: 'New Allow', filterAll: false }
  });
  assert.equal(addChannelRuntime.manager.getState().whitelistChannels[0].id, 'UCnewwhitelist0000000001');
  assert.ok(addChannelRuntime.runtimeMessages.some((message) => message.action === 'addWhitelistChannelPersistent' && message.input === '@newallow'));
  assert.ok(addChannelRuntime.runtimeMessages.some((message) => message.action === 'getCompiledSettings' && message.profileType === 'main'));
  assert.deepEqual(addChannelRuntime.events.map((event) => event.eventType), ['load', 'channelAdded']);

  const blocklistProfiles = baseProfilesV4({
    mode: 'blocklist',
    channels: [{ id: 'UCblock000000000000000001', handle: '@block', name: 'Block Channel', filterAll: true, filterAllComments: true }],
    keywords: [{ word: 'manual block', source: 'user' }],
    whitelistChannels: [],
    whitelistKeywords: []
  });
  const commentsRuntime = loadStateManagerRuntime({ profilesV4: blocklistProfiles });
  await commentsRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const nextComments = await commentsRuntime.manager.toggleChannelFilterAllCommentsByRef('ucblock000000000000000001');
  assert.equal(nextComments, false);
  assert.equal(commentsRuntime.manager.getState().channels[0].filterAllComments, false);
  assert.equal(commentsRuntime.savedSettings.at(-1).channels[0].filterAllComments, false);
  assert.ok(commentsRuntime.savedSettings.at(-1).keywords.some((entry) => entry.source === 'channel' && entry.comments === false));
  assert.ok(commentsRuntime.runtimeMessages.some((message) => message.action === 'FilterTube_ApplySettings' && message.profile === 'main'));
  assert.ok(commentsRuntime.runtimeMessages.some((message) => message.action === 'FilterTube_ScheduleAutoBackup' && message.triggerType === 'comment_filter_toggled'));
  assert.ok(commentsRuntime.events.some((event) => event.eventType === 'channelUpdated' && event.data.filterAllComments === false));

  const themeRuntime = loadStateManagerRuntime();
  await themeRuntime.manager.setTheme('solarized');
  assert.equal(themeRuntime.manager.getState().theme, 'light');
  assert.deepEqual(themeRuntime.appliedThemes, ['light']);
  assert.deepEqual(themeRuntime.persistedThemes, ['light']);
  assert.deepEqual(themeRuntime.events.map((event) => event.eventType), ['themeChanged']);

  const storageRuntime = loadStateManagerRuntime();
  assert.equal(storageRuntime.storageListeners.length, 1);
  await storageRuntime.storageListeners[0]({ channelMap: { newValue: { uc: '@handle' } } }, 'local');
  assert.equal(storageRuntime.events.length, 0);
  assert.equal(storageRuntime.timers.length, 0);
  assert.equal(storageRuntime.settingsLoadCalls, 0);

  await storageRuntime.storageListeners[0]({ ftThemePreference: { newValue: 'dark' } }, 'local');
  assert.deepEqual(storageRuntime.appliedThemes, ['dark']);
  assert.deepEqual(storageRuntime.events.map((event) => event.eventType), ['themeChanged']);
  assert.equal(storageRuntime.timers.length, 0);
  assert.equal(storageRuntime.settingsLoadCalls, 0);

  await storageRuntime.storageListeners[0]({ hideAllShorts: { newValue: true } }, 'local');
  assert.equal(storageRuntime.timers.length, 1);
  assert.equal(storageRuntime.timers[0].delayMs, 150);
});

test('state manager register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'ownerRuntime',
    'callerUi',
    'triggerControl',
    'profileType',
    'profileId',
    'listModeInput',
    'targetList',
    'uiLockState',
    'storageKeysTouched',
    'profileSchemaTouched',
    'compiledRefreshEffect',
    'runtimeBroadcastEffect',
    'tabMessageEffect',
    'backupEffect',
    'listenerEvent',
    'channelEnrichmentEffect',
    'themeEffect',
    'storageReloadEffect',
    'disabledBehavior',
    'noRuleBehavior',
    'emptyListBehavior',
    'duplicatePolicy',
    'saveQueuePolicy',
    'rollbackFixture',
    'positiveFixture',
    'negativeModeFixture',
    'negativeLockFixture',
    'negativeSiblingFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks state manager method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'stateManagerMethodAuthority',
    'stateManagerMutationEffectReport',
    'stateManagerSaveQueueContract',
    'stateManagerProfileRevisionReport',
    'stateManagerRefreshBroadcastAuthority',
    'stateManagerStorageReloadBudget',
    'stateManagerListenerEventContract',
    'stateManagerChannelEnrichmentBudget'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
