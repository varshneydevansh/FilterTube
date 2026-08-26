import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const stateManagerSource = fs.readFileSync('js/state_manager.js', 'utf8');
const backgroundSource = fs.readFileSync('js/background.js', 'utf8');
const tabViewSource = fs.readFileSync('js/tab-view.js', 'utf8');
const renderEngineSource = fs.readFileSync('js/render_engine.js', 'utf8');
const tabViewCssSource = fs.readFileSync('css/tab-view.css', 'utf8');

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function validId(letter) {
  return `UC${String(letter).repeat(22)}`;
}

function profilesFor(channels) {
  return {
    schemaVersion: 4,
    activeProfileId: 'default',
    profiles: {
      default: {
        type: 'account',
        parentProfileId: null,
        name: 'Default',
        settings: {},
        main: {
          mode: 'blocklist',
          channels,
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        }
      }
    }
  };
}

function createStateManagerRuntime({ response = null, channels = [], profilesV4: suppliedProfilesV4 = null } = {}) {
  const profilesV4 = clone(suppliedProfilesV4 || profilesFor(clone(channels)));
  const storage = {};
  const timers = [];
  const runtimeMessages = [];
  let timerId = 0;

  const settings = {
    enabled: true,
    channels: clone(channels),
    keywords: [],
    userKeywords: [],
    channelMap: {},
    theme: 'light',
    themeSource: 'system',
    contentFilters: {},
    categoryFilters: { enabled: false, mode: 'block', selected: [] },
    languageFilters: { enabled: false, mode: 'block', selected: [] }
  };

  const local = {
    get(keys, callback) {
      const result = {};
      if (keys == null) {
        Object.assign(result, clone(storage));
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(storage, key)) result[key] = clone(storage[key]);
        });
      } else if (typeof keys === 'string') {
        if (Object.prototype.hasOwnProperty.call(storage, keys)) result[keys] = clone(storage[keys]);
      } else if (keys && typeof keys === 'object') {
        Object.keys(keys).forEach((key) => {
          result[key] = Object.prototype.hasOwnProperty.call(storage, key)
            ? clone(storage[key])
            : clone(keys[key]);
        });
      }
      callback?.(result);
    },
    set(payload, callback) {
      Object.assign(storage, clone(payload));
      callback?.();
    },
    remove(keys, callback) {
      for (const key of (Array.isArray(keys) ? keys : [keys])) delete storage[key];
      callback?.();
    }
  };

  const context = {
    console,
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Promise,
    setTimeout(callback, delayMs) {
      const timer = { id: ++timerId, callback, delayMs };
      timers.push(timer);
      return timer.id;
    },
    clearTimeout(id) {
      const index = timers.findIndex(timer => timer.id === id);
      if (index >= 0) timers.splice(index, 1);
    },
    FilterTubeSettings: {
      async loadSettings() {
        return clone(settings);
      },
      async saveSettings() {
        return { compiledSettings: {} };
      },
      syncFilterAllKeywords(userKeywords, currentChannels) {
        return [
          ...(Array.isArray(userKeywords) ? userKeywords : []),
          ...(Array.isArray(currentChannels) ? currentChannels : [])
            .filter(channel => channel?.filterAll === true)
            .map(channel => ({
              word: channel.name || channel.id,
              exact: true,
              semantic: false,
              source: 'channel',
              channelRef: String(channel.id || '').toLowerCase()
            }))
        ];
      }
    },
    FilterTubeIO: {
      async loadProfilesV3() {
        return { main: {}, kids: {} };
      },
      async loadProfilesV4() {
        return clone(profilesV4);
      }
    },
    FilterTubeIdentity: {
      isUcId(value) {
        return /^UC[a-zA-Z0-9_-]{22}$/.test(String(value || '').trim());
      },
      normalizeUcIdForComparison(value) {
        return String(value || '').trim().toLowerCase();
      }
    },
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(message, callback) {
          runtimeMessages.push(clone(message));
          callback?.(clone(response || {
            success: true,
            channelData: {
              id: message.input,
              name: 'Complete channel',
              handle: '@complete-channel',
              handleDisplay: '@complete-channel',
              canonicalHandle: '@complete-channel',
              logo: 'https://example.test/avatar.jpg',
              customUrl: null
            }
          }));
        }
      },
      storage: {
        local,
        onChanged: { addListener() {} }
      }
    }
  };
  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(stateManagerSource, context, { filename: 'js/state_manager.js' });

  return {
    manager: context.StateManager,
    runtimeMessages,
    storage,
    timers,
    async runNextTimer() {
      const timer = timers.shift();
      assert.ok(timer, 'expected a queued timer');
      await timer.callback();
    }
  };
}

test('ordinary user enrichment stays fast while every imported source uses the paced queue', async () => {
  const userChannel = {
    id: validId('u'),
    name: validId('u'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'user'
  };
  const blockTubeChannel = {
    id: validId('b'),
    name: validId('b'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'blocktube'
  };
  const importedChannel = {
    id: validId('i'),
    name: validId('i'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'import'
  };
  const managedListChannel = {
    id: validId('m'),
    name: validId('m'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'managed_channel_list',
    managedListSourceFormat: 'csv'
  };

  const ordinary = createStateManagerRuntime({ channels: [userChannel, blockTubeChannel, importedChannel, managedListChannel] });
  await ordinary.manager.loadSettings();
  assert.equal(ordinary.timers[0].delayMs, 0);
  await ordinary.runNextTimer();

  assert.equal(ordinary.runtimeMessages.length, 1);
  assert.equal(ordinary.runtimeMessages[0].input, userChannel.id);
  assert.equal(ordinary.runtimeMessages[0].enrichmentFromImport, undefined);
  assert.equal(ordinary.runtimeMessages[0].targetProfileId, undefined);

  // A later startup/reload must not turn a generic imported UC row into an
  // ordinary burst of metadata requests. Imported rows are re-enabled only
  // through the explicit serialized imported-channel route.
  assert.equal(ordinary.runtimeMessages.some(message => message.input === importedChannel.id), false);
  assert.equal(ordinary.runtimeMessages.some(message => message.input === managedListChannel.id), false);

  const generic = createStateManagerRuntime({
    channels: [importedChannel, managedListChannel]
  });
  await generic.manager.loadSettings({ scheduleEnrichment: false });
  const genericStarted = await generic.manager.startImportedChannelEnrichment();
  assert.equal(genericStarted.pending, 2);
  const genericStatus = await generic.manager.getImportedChannelEnrichmentStatus();
  assert.equal(genericStatus.pending, 2);
  assert.equal(genericStatus.inFlight, false);
  assert.equal(genericStatus.total, 2);
  assert.equal(generic.timers.at(-1).delayMs, 0);
  await generic.runNextTimer();
  assert.equal(generic.runtimeMessages.length, 1);
  assert.equal(generic.runtimeMessages[0].enrichmentFromImport, true);
  assert.equal(generic.runtimeMessages[0].input, importedChannel.id);
  assert.equal(generic.storage.ftBlockTubeEnrichmentJobV1.pending.length, 1);
  assert.equal(generic.storage.ftBlockTubeEnrichmentJobV1.pending[0].source, 'managed_channel_list');
  assert.equal(generic.storage.ftBlockTubeEnrichmentJobV1.pending[0].listType, 'blocklist');
  const genericAfterLookupStatus = await generic.manager.getImportedChannelEnrichmentStatus();
  assert.equal(genericAfterLookupStatus.pending, 1);
  assert.equal(genericAfterLookupStatus.total, 1);

  const reload = createStateManagerRuntime({ channels: [managedListChannel] });
  await reload.manager.loadSettings({ scheduleEnrichment: false });
  const reloadStarted = await reload.manager.resumeImportedChannelEnrichment();
  assert.equal(reloadStarted.pending, 1);
  assert.equal(reload.timers.at(-1).delayMs, 0);
  await reload.runNextTimer();
  assert.equal(reload.runtimeMessages[0].enrichmentFromImport, true);
  assert.equal(reload.storage.ftBlockTubeEnrichmentJobV1, undefined);

  const migration = createStateManagerRuntime({ channels: [blockTubeChannel] });
  await migration.manager.loadSettings({ scheduleEnrichment: false });
  const started = await migration.manager.startBlockTubeEnrichment();

  assert.equal(started.pending, 1);
  assert.equal(migration.runtimeMessages.length, 0);
  assert.equal(migration.storage.ftBlockTubeEnrichmentJobV1.pending.length, 1);
  assert.equal(migration.storage.ftBlockTubeEnrichmentJobV1.pending[0].id, blockTubeChannel.id);
  assert.equal(migration.timers.at(-1).delayMs, 0);

  await migration.runNextTimer();
  assert.equal(migration.runtimeMessages.length, 1);
  assert.equal(migration.runtimeMessages[0].enrichmentFromImport, true);
  assert.equal(migration.runtimeMessages[0].targetProfileId, 'default');
  assert.equal(migration.storage.ftBlockTubeEnrichmentJobV1, undefined);

  const parentChannel = {
    id: validId('p'),
    name: validId('p'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'managed_channel_list'
  };
  const childProfiles = {
    schemaVersion: 4,
    activeProfileId: 'parent',
    profiles: {
      parent: {
        type: 'account',
        parentProfileId: null,
        name: 'Parent',
        settings: {},
        main: {
          mode: 'blocklist',
          channels: [],
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        }
      },
      child: {
        type: 'child',
        parentProfileId: 'parent',
        name: 'Child',
        settings: {},
        main: {
          mode: 'blocklist',
          channels: [parentChannel],
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        }
      }
    }
  };
  const parentRuntime = createStateManagerRuntime({ profilesV4: childProfiles });
  await parentRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const parentStarted = await parentRuntime.manager.startImportedChannelEnrichment({ profileIds: ['child'] });
  assert.equal(parentStarted.pending, 1);
  await parentRuntime.runNextTimer();
  assert.equal(parentRuntime.runtimeMessages[0].targetProfileId, 'child');
  assert.equal(parentRuntime.runtimeMessages[0].actorProfileId, 'parent');

  const childRuntime = createStateManagerRuntime({
    profilesV4: {
      ...childProfiles,
      activeProfileId: 'child',
      profiles: {
        ...childProfiles.profiles,
        parent: {
          ...childProfiles.profiles.parent,
          main: {
            ...childProfiles.profiles.parent.main,
            channels: [{ ...parentChannel, id: validId('x') }]
          }
        }
      }
    }
  });
  await childRuntime.manager.loadSettings({ scheduleEnrichment: false });
  const childStarted = await childRuntime.manager.startImportedChannelEnrichment({ profileIds: ['parent', 'child'] });
  assert.equal(childStarted.pending, 1);
  await childRuntime.runNextTimer();
  assert.equal(childRuntime.runtimeMessages[0].targetProfileId, 'child');
  assert.equal(childRuntime.runtimeMessages[0].actorProfileId, 'child');
});

test('failed imported metadata lookup is persisted and retried with a long backoff', async () => {
  const channel = {
    id: validId('r'),
    name: validId('r'),
    handle: null,
    customUrl: null,
    logo: null,
    source: 'managed_channel_list'
  };
  const runtime = createStateManagerRuntime({
    channels: [channel],
    response: { success: false, error: 'temporary fetch failure' }
  });

  await runtime.manager.loadSettings({ scheduleEnrichment: false });
  await runtime.manager.startImportedChannelEnrichment();
  await runtime.runNextTimer();

  const job = runtime.storage.ftBlockTubeEnrichmentJobV1;
  assert.equal(runtime.runtimeMessages.length, 1);
  assert.equal(job.pending.length, 1);
  assert.equal(job.pending[0].attempts, 1);
  assert.ok(job.pending[0].nextAttemptAt - Date.now() > (6 * 60 * 60 * 1000) - 10000);
  assert.ok(runtime.timers.at(-1).delayMs > (6 * 60 * 60 * 1000) - 10000);
});

test('import and profile-switch paths preserve the normal post-entry enrichment contract', () => {
  const scheduleBlock = backgroundSource.slice(
    backgroundSource.indexOf('function schedulePostBlockEnrichment(channel, profile ='),
    backgroundSource.indexOf('function getChannelDerivedKeywordRef(channel)')
  );
  assert.match(scheduleBlock, /source === 'postBlockEnrichment' \|\| metadata\?\.enrichmentFromImport === true/);
  assert.match(scheduleBlock, /normalizedSource === 'import'/);
  assert.match(scheduleBlock, /const delayMs = 3500 \+ Math\.floor\(Math\.random\(\) \* 750\)/);

  const targetGuard = "const requestedTargetProfileId = normalizeString(metadata?.targetProfileId);";
  assert.ok(backgroundSource.includes(targetGuard));
  assert.match(backgroundSource, /errorCode: 'target_profile_changed'/);

  assert.match(tabViewSource, /await StateManager\.loadSettings\(\);\s+await \(StateManager\.resumeImportedChannelEnrichment \|\| StateManager\.resumeBlockTubeEnrichment\)\?\.\(\);/);
  assert.match(tabViewSource, /resetEnrichment: false, scheduleEnrichment: false/);
  assert.match(tabViewSource, /StateManager\.startImportedChannelEnrichment/);
  assert.match(tabViewSource, /StateManager\.startBlockTubeEnrichment/);
  assert.match(tabViewSource, /id="importedChannelEnrichmentNotice"/);
  assert.match(tabViewSource, /getImportedChannelEnrichmentStatus/);
  assert.match(tabViewSource, /one lookup about every 20 seconds/);
  assert.match(tabViewSource, /Name-only rules, including BlockTube name-only rules, have no unique UC ID/);
  assert.match(renderEngineSource, /Name rule only/);
  assert.match(renderEngineSource, /paced metadata lookup/);
  assert.match(tabViewCssSource, /\.subscriptions-import-inline\[hidden\]\s*\{\s*display:\s*none\s*!important;/s);
  assert.match(backgroundSource, /resolvedPrimaryId/);
  assert.match(backgroundSource, /incomingCustomUrlForMatch/);
  assert.match(backgroundSource, /actorProfileId/);
});
