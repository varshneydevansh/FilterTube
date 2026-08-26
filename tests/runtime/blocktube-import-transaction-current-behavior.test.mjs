import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const ioSource = fs.readFileSync('js/io_manager.js', 'utf8');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultProfilesV4() {
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
          channels: [],
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: [],
          videoIds: [],
          blockedVideoIds: []
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

function initialStorage() {
  return {
    ftProfilesV4: defaultProfilesV4(),
    ftProfilesV3: {
      main: {
        mode: 'blocklist',
        whitelistedChannels: [],
        whitelistedKeywords: [],
        videoIds: [],
        subscriptions: []
      },
      kids: {
        mode: 'blocklist',
        strictMode: true,
        blockedChannels: [],
        blockedKeywords: [],
        whitelistedChannels: [],
        whitelistedKeywords: [],
        videoIds: [],
        subscriptions: []
      }
    },
    preservedUnrelatedKey: { value: 'must survive rollback' }
  };
}

function createContext({ failActiveProfileWrite = false } = {}) {
  const storage = structuredClone(initialStorage());
  let shouldFailV4 = failActiveProfileWrite;
  let savedSettingsPayload = null;
  const runtime = {
    lastError: null,
    getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] })
  };

  const local = {
    QUOTA_BYTES: 10 * 1024 * 1024,
    get(keys, callback) {
      let result = {};
      if (keys == null) result = { ...storage };
      else if (Array.isArray(keys)) keys.forEach(key => { result[key] = storage[key]; });
      else if (typeof keys === 'string') result[keys] = storage[keys];
      else if (keys && typeof keys === 'object') {
        result = { ...keys };
        Object.keys(keys).forEach(key => {
          if (Object.prototype.hasOwnProperty.call(storage, key)) result[key] = storage[key];
        });
      }
      callback(result);
    },
    set(payload, callback) {
      if (shouldFailV4 && Object.prototype.hasOwnProperty.call(payload, 'ftProfilesV4')) {
        shouldFailV4 = false;
        runtime.lastError = { message: 'QUOTA_BYTES quota exceeded' };
        callback?.();
        runtime.lastError = null;
        return;
      }
      Object.assign(storage, structuredClone(payload));
      callback?.();
    },
    remove(keys, callback) {
      keys.forEach(key => delete storage[key]);
      callback?.();
    },
    getBytesInUse(_keys, callback) {
      callback(Buffer.byteLength(JSON.stringify(storage)));
    }
  };

  const context = {
    console,
    Date,
    JSON,
    Math,
    TextEncoder,
    setTimeout,
    clearTimeout,
    structuredClone,
    __storage: storage,
    chrome: {
      runtime,
      storage: { local }
    }
  };
  context.window = context;
  context.FilterTubeSettings = {
    loadSettings: async () => ({
      enabled: true,
      channels: plain(storage.ftProfilesV4.profiles.default.main.channels),
      keywords: plain(storage.ftProfilesV4.profiles.default.main.keywords),
      channelMap: {},
      contentFilters: {}
    }),
    saveSettings: async payload => {
      savedSettingsPayload = plain(payload);
      return { compiledSettings: {}, error: null };
    },
    setThemePreference: async () => {}
  };
  context.__getSavedSettingsPayload = () => savedSettingsPayload;

  vm.runInNewContext(ioSource, context, { filename: 'js/io_manager.js' });
  return context;
}

function blockTubeFixture(ruleCount = 31000) {
  return {
    filterData: {
      title: Array.from({ length: ruleCount }, (_, index) => `blocked phrase ${index}`),
      channelId: Array.from({ length: 250 }, (_, index) => `UC${String(index).padStart(22, '0')}`),
      channelName: [],
      videoId: Array.from({ length: 100 }, (_, index) => `vid${String(index).padStart(8, '0')}`),
      comment: ['blocked comment'],
      vidLength: [],
      javascript: []
    },
    options: {}
  };
}

test('large BlockTube import returns a verified receipt only after V4 read-back', async () => {
  const context = createContext();
  const input = blockTubeFixture();

  const result = await context.FilterTubeIO.importV3(input, { strategy: 'merge', scope: 'auto' });

  assert.equal(result.ok, true);
  assert.equal(result.receipt.verified, true);
  assert.equal(result.receipt.channels, 250);
  assert.ok(Buffer.byteLength(JSON.stringify(input)) >= 690 * 1024);
  assert.equal(result.receipt.keywords, 31000);
  assert.equal(result.receipt.comments, 1);
  assert.equal(result.receipt.videoIds, 100);
  assert.equal(result.receipt.addedChannels, 250);
  assert.equal(result.receipt.addedKeywords, 31001);
  assert.equal(result.receipt.addedVideoIds, 100);
  assert.equal(result.receipt.duplicateChannels, 0);
  assert.equal(result.receipt.skippedRows, 0);
  assert.equal(context.__storage.ftProfilesV4.profiles.default.main.channels.length, 250);
  assert.equal(context.__storage.ftProfilesV4.profiles.default.main.keywords.length, 31001);
  assert.equal(context.__storage.ftProfilesV4.profiles.default.main.videoIds.length, 100);
});

test('failed active-profile write rejects the import and restores the complete prior snapshot', async () => {
  const context = createContext({ failActiveProfileWrite: true });
  const before = plain(context.__storage);

  await assert.rejects(
    context.FilterTubeIO.importV3(blockTubeFixture(25), { strategy: 'merge', scope: 'auto' }),
    /Active profile write failed: QUOTA_BYTES quota exceeded/
  );

  assert.deepEqual(plain(context.__storage), before);
  assert.deepEqual(context.__storage.preservedUnrelatedKey, { value: 'must survive rollback' });
});

test('nested BlockTube backups preserve channel-name rules, channel IDs, video IDs, comments, and duration semantics', async () => {
  const context = createContext();
  const channelId = `UC${'a'.repeat(22)}`;
  const input = {
    storageData: {
      filterData: {
        title: ['blocked title', '/^CaseSensitive$/'],
        channelId: [`// Blocked by context menu (Acme (TV) Channel) (26/08/2026, 00:00:00)`, channelId],
        channelName: ['Creator Name', '/^CaseSensitive Channel$/'],
        videoId: ['abcdefghijk'],
        comment: ['blocked comment'],
        vidLength: [60, 120],
        javascript: ['alert("must not run")']
      },
      options: {
        trending: true,
        mixes: true,
        shorts: true,
        vidLength_type: 'block',
        enable_javascript: true
      },
      uiPass: '1234'
    }
  };

  const preview = context.FilterTubeIO.previewBlockTubeMigration(input);
  assert.equal(preview.ok, true);
  assert.deepEqual(plain(preview.counts), {
    channels: 3,
    channelIds: 1,
    channelNameRules: 2,
    keywords: 2,
    comments: 1,
    regex: 1,
    videoIds: 1,
    mappedOptions: 3,
    durationFilters: 1
  });
  assert.ok(preview.report.translated.some(row => row.treatment === 'preserved_channel_name_regex_rule'));
  assert.ok(preview.report.inactive.some(row => row.field === 'uiPass'));
  assert.ok(preview.report.inactive.some(row => row.field === 'filterData.javascript'));

  const result = await context.FilterTubeIO.importV3(input, { strategy: 'merge', scope: 'auto' });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.channels, 3);

  const main = context.__storage.ftProfilesV4.profiles.default.main;
  const importedId = main.channels.find(channel => channel.source === 'blocktube');
  assert.equal(importedId.id, channelId);
  assert.equal(importedId.name, 'Acme (TV) Channel');
  assert.equal(main.channels.filter(channel => channel.source === 'blocktube-channel-name').length, 2);
  assert.deepEqual(main.videoIds, ['abcdefghijk']);

  const savedPayload = context.__getSavedSettingsPayload();
  assert.equal(savedPayload.contentFilters.duration.mode, 'block');
  assert.equal(savedPayload.contentFilters.duration.condition, 'between');
  assert.equal(savedPayload.contentFilters.duration.minMinutes, 1);
  assert.equal(savedPayload.contentFilters.duration.maxMinutes, 2);
  assert.equal(savedPayload.hideExploreTrending, true);
  assert.equal(savedPayload.hideMixPlaylists, true);
  assert.equal(savedPayload.hideShorts, true);
});

test('split BlockTube context-menu labels are rejoined instead of becoming fake channel IDs', async () => {
  const context = createContext();
  const channelId = `UC${'b'.repeat(22)}`;
  const input = {
    filterData: {
      channelId: [
        '// Blocked by context menu (Broken channel label',
        '...)',
        channelId
      ],
      channelName: [],
      title: [],
      comment: [],
      videoId: [],
      vidLength: []
    },
    options: {}
  };

  const preview = context.FilterTubeIO.previewBlockTubeMigration(input);
  assert.deepEqual(plain(preview.counts), {
    channels: 1,
    channelIds: 1,
    channelNameRules: 0,
    keywords: 0,
    comments: 0,
    regex: 0,
    videoIds: 0,
    mappedOptions: 0,
    durationFilters: 0
  });
  assert.ok(preview.report.translated.some(row => row.treatment === 'rejoined_split_context_comment'));

  await context.FilterTubeIO.importV3(input, { strategy: 'merge', scope: 'auto' });
  const imported = context.__storage.ftProfilesV4.profiles.default.main.channels[0];
  assert.equal(imported.id, channelId);
  assert.equal(imported.name, 'Broken channel label...');
});

test('all extension manifests grant local storage capacity for reviewed large imports', () => {
  for (const manifestPath of [
    'manifest.json',
    'manifest.chrome.json',
    'manifest.opera.json',
    'manifest.firefox.json'
  ]) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.permissions.includes('unlimitedStorage'), `${manifestPath} lacks unlimitedStorage`);
  }
});

test('dashboard reports verified receipts and preserves the real storage failure message', () => {
  const source = fs.readFileSync('js/tab-view.js', 'utf8');
  assert.match(source, /title: 'BlockTube Import Verified'/);
  assert.match(source, /receipt\.verified === true/);
  assert.match(source, /Import failed: \$\{message\.slice\(0, 180\)\}/);
  assert.doesNotMatch(source, /Import failed \(invalid file\?\)/);
});
