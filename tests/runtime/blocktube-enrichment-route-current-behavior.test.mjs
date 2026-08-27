import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const stateManagerSource = fs.readFileSync('js/state_manager.js', 'utf8');
const backgroundSource = fs.readFileSync('js/background.js', 'utf8');
const helperSource = fs.readFileSync('js/imported_channel_enrichment.js', 'utf8');
const tabViewSource = fs.readFileSync('js/tab-view.js', 'utf8');
const renderEngineSource = fs.readFileSync('js/render_engine.js', 'utf8');
const tabViewCssSource = fs.readFileSync('css/tab-view.css', 'utf8');
const manifestSources = ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']
  .map(path => fs.readFileSync(path, 'utf8'));

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

function createStateManagerRuntime({ response = null, channels = [], profilesV4: suppliedProfilesV4 = null, browserMode = false } = {}) {
  const profilesV4 = clone(suppliedProfilesV4 || profilesFor(clone(channels)));
  const storage = {};
  const timers = [];
  const runtimeMessages = [];
  let timerId = 0;
  let importedPaused = false;

  const importedPendingCount = (message = {}) => {
    const activeProfileId = profilesV4.activeProfileId || 'default';
    const requestedIds = Array.isArray(message.profileIds) && message.profileIds.length
      ? new Set(message.profileIds.map(value => String(value || '').trim()).filter(Boolean))
      : new Set([activeProfileId]);
    let count = 0;
    requestedIds.forEach(profileId => {
      const profile = profilesV4.profiles?.[profileId];
      if (!profile) return;
      const lists = [
        profile.main?.channels,
        profile.main?.whitelistChannels,
        profile.kids?.blockedChannels,
        profile.kids?.whitelistChannels
      ];
      lists.forEach(list => {
        (Array.isArray(list) ? list : []).forEach(channel => {
          const source = String(channel?.source || '').trim().toLowerCase();
          const incomplete = !channel?.handle && !channel?.customUrl && !channel?.logo;
          if (['import', 'managed_channel_list', 'blocktube', 'blocktube-channel-name'].includes(source) && incomplete) {
            count += 1;
          }
        });
      });
    });
    return count;
  };

  const importedStatus = (message = {}) => {
    const pending = importedPendingCount(message);
    return {
      ok: true,
      scheduler: 'background',
      pending,
      inFlight: false,
      total: pending,
      paused: importedPaused,
      minDelayMs: 7000,
      maxDelayMs: 15000,
      alarmFloorMs: 30000,
      nextRunAt: pending ? Date.now() + 7000 : 0
    };
  };

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
          if (message.action === 'FilterTube_StartImportedChannelEnrichment') {
            importedPaused = false;
            callback?.(clone(importedStatus(message)));
            return;
          }
          if (message.action === 'FilterTube_ResumeImportedChannelEnrichment') {
            if (message.unpause === true) importedPaused = false;
            callback?.(clone(importedStatus(message)));
            return;
          }
          if (message.action === 'FilterTube_PauseImportedChannelEnrichment') {
            importedPaused = true;
            callback?.(clone(importedStatus(message)));
            return;
          }
          if (message.action === 'FilterTube_GetImportedChannelEnrichmentStatus') {
            callback?.(clone(importedStatus(message)));
            return;
          }
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
  if (browserMode) {
    context.browser = {
      runtime: {
        sendMessage(message, callback) {
          assert.equal(callback, undefined, 'Firefox browser messaging must use the returned Promise');
          runtimeMessages.push(clone(message));
          if (message.action === 'FilterTube_StartImportedChannelEnrichment') {
            importedPaused = false;
            return Promise.resolve(clone(importedStatus(message)));
          }
          if (message.action === 'FilterTube_ResumeImportedChannelEnrichment') {
            if (message.unpause === true) importedPaused = false;
            return Promise.resolve(clone(importedStatus(message)));
          }
          if (message.action === 'FilterTube_PauseImportedChannelEnrichment') {
            importedPaused = true;
            return Promise.resolve(clone(importedStatus(message)));
          }
          if (message.action === 'FilterTube_GetImportedChannelEnrichmentStatus') {
            return Promise.resolve(clone(importedStatus(message)));
          }
          return Promise.resolve(clone(response || {
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
    };
  }
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
  assert.equal(generic.timers.length, 0);
  assert.equal(generic.runtimeMessages[0].action, 'FilterTube_StartImportedChannelEnrichment');
  assert.deepEqual(generic.runtimeMessages[0].profileIds, undefined);
  assert.equal(generic.storage.ftBlockTubeEnrichmentJobV1, undefined);
  const genericAfterLookupStatus = await generic.manager.getImportedChannelEnrichmentStatus();
  assert.equal(genericAfterLookupStatus.pending, 2);
  assert.equal(genericAfterLookupStatus.total, 2);
  assert.equal(generic.runtimeMessages[2].action, 'FilterTube_GetImportedChannelEnrichmentStatus');

  const reload = createStateManagerRuntime({ channels: [managedListChannel] });
  await reload.manager.loadSettings({ scheduleEnrichment: false });
  const reloadStarted = await reload.manager.resumeImportedChannelEnrichment();
  assert.equal(reloadStarted.pending, 1);
  assert.equal(reload.timers.length, 0);
  assert.equal(reload.runtimeMessages[0].action, 'FilterTube_ResumeImportedChannelEnrichment');
  assert.equal(reload.storage.ftBlockTubeEnrichmentJobV1, undefined);

  const migration = createStateManagerRuntime({ channels: [blockTubeChannel] });
  await migration.manager.loadSettings({ scheduleEnrichment: false });
  const started = await migration.manager.startBlockTubeEnrichment();

  assert.equal(started.pending, 1);
  assert.equal(migration.runtimeMessages.length, 1);
  assert.equal(migration.runtimeMessages[0].action, 'FilterTube_StartImportedChannelEnrichment');
  assert.equal(migration.storage.ftBlockTubeEnrichmentJobV1, undefined);

  const paused = await migration.manager.pauseImportedChannelEnrichment();
  assert.equal(paused.paused, true);
  const resumed = await migration.manager.explicitResumeImportedChannelEnrichment();
  assert.equal(resumed.paused, false);
  assert.equal(migration.runtimeMessages.at(-2).action, 'FilterTube_PauseImportedChannelEnrichment');
  assert.equal(migration.runtimeMessages.at(-1).action, 'FilterTube_ResumeImportedChannelEnrichment');
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
  assert.deepEqual(parentRuntime.runtimeMessages[0].profileIds, ['child']);

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
  assert.equal(childStarted.pending, 2);
  assert.deepEqual(childRuntime.runtimeMessages[0].profileIds, ['parent', 'child']);
});

test('StateManager delegates imported retry state to the background worker', async () => {
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
  const started = await runtime.manager.startImportedChannelEnrichment();
  const status = await runtime.manager.getImportedChannelEnrichmentStatus();

  assert.equal(started.pending, 1);
  assert.equal(status.pending, 1);
  assert.equal(runtime.runtimeMessages[0].action, 'FilterTube_StartImportedChannelEnrichment');
  assert.equal(runtime.runtimeMessages[1].action, 'FilterTube_GetImportedChannelEnrichmentStatus');
  assert.equal(runtime.timers.length, 0);
  assert.equal(runtime.storage.ftBlockTubeEnrichmentJobV1, undefined);
});

test('StateManager uses Promise-based browser messaging for Firefox background commands', async () => {
  const runtime = createStateManagerRuntime({
    browserMode: true,
    channels: [{
      id: validId('f'),
      name: validId('f'),
      handle: null,
      customUrl: null,
      logo: null,
      source: 'import'
    }]
  });

  const status = await runtime.manager.getImportedChannelEnrichmentStatus();
  assert.equal(status.scheduler, 'background');
  assert.equal(status.pending, 1);
  assert.equal(runtime.runtimeMessages[0].action, 'FilterTube_GetImportedChannelEnrichmentStatus');
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
  assert.match(tabViewSource, /card\.className = 'card ft-modal rule-list-report-modal'/);
  assert.match(tabViewSource, /header\.className = 'card-header ft-modal-header'/);
  const importModalStart = tabViewSource.indexOf('async function showManagedChannelListImportModal');
  const importModalEnd = tabViewSource.indexOf('async function promptManagedChannelListSurface');
  assert.ok(importModalStart >= 0);
  assert.ok(importModalEnd > importModalStart);
  const importModalSource = tabViewSource.slice(importModalStart, importModalEnd);
  assert.match(importModalSource, /actions\.append\(cancelBtn, okBtn\);\s+card\.append\(header, body, actions\)/);
  assert.doesNotMatch(importModalSource, /body\.appendChild\(actions\)/);
  assert.match(tabViewCssSource, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.match(tabViewCssSource, /\.managed-channel-list-modal__body\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow:\s*auto;/);
  assert.match(tabViewCssSource, /\.managed-channel-list-modal \.ft-modal-actions\s*\{[\s\S]*align-self:\s*stretch;[\s\S]*padding:[^;]*var\(--ft-space-lg\)/);
  assert.match(tabViewCssSource, /\.rule-list-report-modal-overlay > \.rule-list-report-modal\s*\{[\s\S]*box-sizing:\s*border-box;[\s\S]*grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto[\s\S]*margin:\s*0;/);
  assert.match(tabViewCssSource, /\.rule-list-report-modal \.ft-modal-header\s*\{[\s\S]*display:\s*block;[\s\S]*padding:\s*var\(--ft-space-lg\)/);
  assert.match(tabViewCssSource, /\.rule-list-report-modal-overlay > \.rule-list-report-modal\s*\{[\s\S]*height:\s*min\(860px, calc\(100dvh - 2rem\)\)/);
  assert.match(tabViewSource, /randomized 7–15 second interval/);
  assert.match(tabViewSource, /extension background/);
  assert.match(tabViewSource, /Pause metadata completion/);
  assert.match(tabViewSource, /Estimated active time/);
  assert.match(tabViewSource, /Completing imported channel details/);
  assert.match(tabViewSource, /Temporary failures stay visible in Import Reports/);
  assert.match(tabViewSource, /Permanent not-found\/deleted responses stop retrying/);
  assert.match(tabViewSource, /Verify this identifier on YouTube or replace it/);
  assert.match(tabViewSource, /const statusDescriptions = \{/);
  assert.match(tabViewSource, /The row is waiting for its first paced lookup/);
  assert.match(tabViewSource, /The UC ID, channel name, handle\/custom URL, and avatar are available/);
  assert.match(tabViewSource, /rule-list-report-selected-state/);
  assert.doesNotMatch(tabViewSource, /rule-list-report-filter-help/);
  assert.match(tabViewSource, /Remove imported channel rule\?/);
  assert.match(tabViewSource, /rule-list-report-remove/);
  assert.match(tabViewSource, /metadata lookup stopped/);
  assert.match(tabViewSource, /A failed row retries after about 2 minutes/);
  assert.match(tabViewSource, /backs off up to 30 minutes without pausing fresh rows/);
  assert.match(tabViewSource, /older queue timing is being corrected/);
  assert.match(tabViewSource, /function managedChannelEntryKeys\(channel\)/);
  assert.match(tabViewSource, /alternateIds/);
  assert.match(tabViewSource, /addManagedChannelIdentityKeys\(seenChannels, channel\)/);
  assert.match(renderEngineSource, /Name rule only/);
  assert.match(renderEngineSource, /paced metadata lookup/);
  assert.match(tabViewCssSource, /\.subscriptions-import-inline\[hidden\]\s*\{\s*display:\s*none\s*!important;/s);
  assert.match(tabViewCssSource, /\.rule-list-report-selected-state\s*\{/);
  assert.match(tabViewCssSource, /\.rule-list-report-actions\s*\{/);
  assert.match(backgroundSource, /resolvedPrimaryId/);
  assert.match(backgroundSource, /incomingCustomUrlForMatch/);
  assert.match(backgroundSource, /actorProfileId/);
  assert.match(backgroundSource, /FilterTube_StartImportedChannelEnrichment/);
  assert.match(backgroundSource, /FilterTube_PauseImportedChannelEnrichment/);
  assert.match(backgroundSource, /importedChannelEnrichmentScheduler/);
  assert.match(backgroundSource, /ftImportedChannelMetadataRevision/);
  assert.match(backgroundSource, /channel: finalChannelData/);
  assert.match(backgroundSource, /errorCode: 'channel_not_found'/);
  assert.match(backgroundSource, /errorCode: 'channel_terminated'/);
  assert.match(backgroundSource, /This account has been terminated for a violation of YouTube's Terms of Service/);
  assert.match(backgroundSource, /This channel does not exist\./);
  assert.match(helperSource, /failureKind: 'permanent'/);
  assert.match(backgroundSource, /shouldProjectImportedMetadataToLegacy/);
  assert.match(backgroundSource, /alarms\.onAlarm/);
  assert.match(helperSource, /DEFAULT_MIN_DELAY_MS = 7000/);
  assert.match(helperSource, /DEFAULT_MAX_DELAY_MS = 15000/);
  assert.match(helperSource, /DEFAULT_ALARM_FLOOR_MS = 30000/);
  assert.match(helperSource, /DEFAULT_RETRY_DELAY_MS = 2 \* 60 \* 1000/);
  assert.match(helperSource, /DEFAULT_MAX_RETRY_DELAY_MS = 30 \* 60 \* 1000/);
  assert.match(helperSource, /hasReadyPendingTask/);
  assert.match(helperSource, /staleGlobalDelay/);
  manifestSources.forEach((manifest) => assert.match(manifest, /"alarms"/));
  assert.match(manifestSources.at(-1), /js\/imported_channel_enrichment\.js/);
  assert.match(stateManagerSource, /FilterTube_StartImportedChannelEnrichment/);
  assert.match(stateManagerSource, /explicitResumeImportedChannelEnrichment/);
  assert.match(stateManagerSource, /importedMetadataOnly/);
  assert.match(stateManagerSource, /applyImportedChannelMetadataPatch/);
  assert.match(stateManagerSource, /__ftMetadataOnly: true/);
  assert.match(tabViewSource, /metadataOnlyChannelUpdate/);
  assert.match(tabViewSource, /metadataOnlyKidsChannelUpdate/);
  assert.match(tabViewSource, /if \(!metadataOnlyChannelUpdate\) \{\s+renderKeywords\(\);/);
  assert.match(tabViewSource, /if \(!metadataOnlyKidsChannelUpdate\) renderKidsKeywords\(\);/);
  assert.match(stateManagerSource, /ftRuleListImportReportsV1/);
});
