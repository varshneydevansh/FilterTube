import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

function settingsRuntime(initial = {}) {
  const data = structuredClone(initial);
  const writes = [];
  const local = {
    get(keys, done) { done(Object.fromEntries(keys.filter(key => key in data).map(key => [key, structuredClone(data[key])]))); },
    set(patch, done) { writes.push(structuredClone(patch)); Object.assign(data, structuredClone(patch)); done?.(); }
  };
  const context = vm.createContext({ chrome: { storage: { local }, runtime: {} }, console,
    matchMedia: () => ({ matches: false }), window: {} });
  vm.runInContext(fs.readFileSync('js/settings_shared.js', 'utf8'), context);
  return { api: context.window.FilterTubeSettings, data, writes };
}
function profiles(settings = {}, other = {}) {
  return { schemaVersion: 4, activeProfileId: 'child', profiles: {
    default: { type: 'account', settings: other, main: {}, kids: {} },
    child: { type: 'child', parentProfileId: 'default', settings, main: {}, kids: {} }
  } };
}

for (const value of [undefined, true, false]) {
  test(`content-only setting compiles and persists ${String(value)} with missing default on`, async () => {
    const runtime = settingsRuntime({ ftProfilesV4: profiles() });
    const options = { keywords: [], channels: [], ...(value === undefined ? {} : { contentOnlyPlayback: value }) };
    assert.equal(runtime.api.buildCompiledSettings(options).contentOnlyPlayback, value !== false);
    const result = await runtime.api.saveSettings(options);
    assert.equal(result.error, null);
    assert.equal(result.compiledSettings.contentOnlyPlayback, value !== false);
    assert.equal(runtime.data.contentOnlyPlayback, value !== false);
    assert.equal(runtime.data.ftProfilesV4.profiles.child.settings.contentOnlyPlayback, value !== false);
    assert.equal((await runtime.api.loadSettings()).contentOnlyPlayback, value !== false);
  });
}

test('active profile is authoritative over stale root and another profile playback preferences', async () => {
  const runtime = settingsRuntime({ contentOnlyPlayback: false, ftProfilesV4: profiles({}, { contentOnlyPlayback: false }) });
  assert.equal((await runtime.api.loadSettings()).contentOnlyPlayback, true);
  runtime.data.ftProfilesV4.profiles.child.settings.contentOnlyPlayback = false;
  runtime.data.contentOnlyPlayback = true;
  assert.equal((await runtime.api.loadSettings()).contentOnlyPlayback, false);
  runtime.data.ftProfilesV4.activeProfileId = 'default';
  runtime.data.ftProfilesV4.profiles.default.settings.contentOnlyPlayback = true;
  assert.equal((await runtime.api.loadSettings()).contentOnlyPlayback, true);
});

for (const value of [undefined, false]) {
  test(`legacy ${String(value)} migrates without losing the explicit off choice`, async () => {
    const runtime = settingsRuntime(value === undefined ? {} : { contentOnlyPlayback: value });
    const loaded = await runtime.api.loadSettings();
    assert.equal(loaded.contentOnlyPlayback, value !== false);
    assert.equal(runtime.data.ftProfilesV4.profiles.default.settings.contentOnlyPlayback, value !== false);
  });
}

test('playback changes join settings storage invalidation without becoming a blocking rule', () => {
  const { api } = settingsRuntime();
  assert.ok(api.STORAGE_KEYS.includes('contentOnlyPlayback'));
  assert.equal(api.isSettingsChange({ contentOnlyPlayback: { oldValue: true, newValue: false } }), true);
  const source = fs.readFileSync('js/content/block_channel.js', 'utf8');
  const ruleKeys = source.split('const booleanFilterKeys = [')[1].split('];')[0];
  assert.doesNotMatch(ruleKeys, /contentOnlyPlayback/);
});

function profileRuntime() {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Default', settings: {}, main: { channels: [], keywords: [] },
    kids: { blockedChannels: [], blockedKeywords: [], contentFilters: {} }
  } } }, ftProfilesV3: { main: {}, kids: {} } };
  const clone = value => JSON.parse(JSON.stringify(value));
  const box = { console, setTimeout: () => 1, clearTimeout() {}, chrome: {
    runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }),
      sendMessage(message, done) { done?.({ ok: true, success: true }); } },
    storage: { onChanged: { addListener() {} }, local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } }
  } };
  box.window = box;
  vm.createContext(box);
  installNanahStorageLock(box);
  for (const name of ['settings_shared', 'io_manager', 'state_manager']) {
    vm.runInContext(fs.readFileSync(`js/${name}.js`, 'utf8'), box);
  }
  return { box, storage };
}

test('actual state save, backup export/import and unrelated edits retain explicit off', async () => {
  const runtime = profileRuntime();
  const manager = runtime.box.StateManager;
  await manager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  assert.equal(manager.getState().contentOnlyPlayback, true);
  await manager.updateSetting('contentOnlyPlayback', false);
  await manager.updateSetting('hideComments', true);
  await manager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  assert.equal(manager.getState().contentOnlyPlayback, false);
  const exported = await runtime.box.FilterTubeIO.exportV3({ scope: 'full' });
  assert.equal(exported.settings.main.contentOnlyPlayback, false);
  assert.equal(exported.profilesV4.profiles.default.settings.contentOnlyPlayback, false);
  const restored = profileRuntime();
  await restored.box.FilterTubeIO.importV3(exported, { scope: 'full', strategy: 'replace' });
  assert.equal(restored.storage.ftProfilesV4.profiles.default.settings.contentOnlyPlayback, false);
  assert.equal((await restored.box.FilterTubeSettings.loadSettings()).contentOnlyPlayback, false);
});

test('the existing protected UI lock rejects content-only setting writes', async () => {
  const runtime = profileRuntime();
  const manager = runtime.box.StateManager;
  await manager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  const before = JSON.stringify(runtime.storage);
  runtime.box.FilterTubeIsUiLocked = () => true;
  await manager.updateSetting('contentOnlyPlayback', false);
  assert.equal(manager.getState().contentOnlyPlayback, true);
  assert.equal(JSON.stringify(runtime.storage), before);
});

test('legacy backup import preserves explicit off before profile migration', async () => {
  const source = profileRuntime();
  await source.box.StateManager.loadSettings({ resetEnrichment: false, scheduleEnrichment: false });
  await source.box.StateManager.updateSetting('contentOnlyPlayback', false);
  const exported = await source.box.FilterTubeIO.exportV3({ scope: 'full' });
  delete exported.profilesV4;
  const restored = profileRuntime();
  await restored.box.FilterTubeIO.importV3(exported, { scope: 'full', strategy: 'replace' });
  assert.equal((await restored.box.FilterTubeSettings.loadSettings()).contentOnlyPlayback, false);
  assert.equal(restored.storage.ftProfilesV4.profiles.default.settings.contentOnlyPlayback, false);
});
