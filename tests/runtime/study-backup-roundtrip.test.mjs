import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// The study object rides inside the profile in the v3 backup: export, restore, merge and the
// rebuild from study:<packId> tags after an older app dropped it.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

const study = (overrides = {}) => ({
  version: 1,
  activePackIds: ['in_upsc_cse'],
  packEdits: { in_upsc_cse: { channelsAdded: [{ handle: '@clearias' }], channelsRemoved: [], topicsAdded: ['polity'], topicsRemoved: [] } },
  focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 },
  plan: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '18:00', setByParentId: null },
  lock: { sessionId: 'session-here', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
  savedListMode: 'blocklist',
  breakMode: 'normal',
  progress: { laptop: { '2026-11-14': 50, '2026-11-15': 20 } },
  weekView: true,
  ...overrides
});

function profileRoot(defaultStudy, extraMain = {}) {
  return { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Student', parentProfileId: null, settings: {},
    main: { mode: 'whitelist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [], ...extraMain },
    kids: { mode: 'blocklist', blockedKeywords: [] },
    ...(defaultStudy ? { study: defaultStudy } : {})
  } } };
}

async function device(root) {
  const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device' };
  const box = { console, setTimeout, clearTimeout,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box; vm.createContext(box); installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box);
  vm.runInContext(read('shared/study_model'), box);
  vm.runInContext(read('io_manager'), box);
  vm.runInContext(read('nanah_sync_adapter'), box);
  await box.FilterTubeSettings.loadSettings();
  return { io: box.FilterTubeIO, adapter: box.FilterTubeNanahAdapter, model: box.FilterTubeStudyModel, storage,
    study: () => storage.ftProfilesV4.profiles.default.study };
}

test('a full backup carries the study object unchanged', async () => {
  const laptop = await device(profileRoot(study()));
  const backup = await laptop.io.exportV3({ scope: 'full' });
  assert.equal(backup.meta.version, 3);
  assert.deepEqual(clone(backup.profilesV4.profiles.default.study), study());
});

test('restoring on another device keeps everything but the running lock', async () => {
  const backup = await (await device(profileRoot(study()))).io.exportV3({ scope: 'full' });
  const phone = await device(profileRoot(null));
  const result = await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace' });
  assert.equal(result.ok, true);
  assert.deepEqual(phone.study(), { ...study(), lock: null });
});

test('a replace restore never ends the lock running on this device', async () => {
  const backup = await (await device(profileRoot(study({ lock: null, activePackIds: ['gb_gcse'] })))).io.exportV3({ scope: 'full' });
  const phone = await device(profileRoot(study({ lock: { sessionId: 'phone-session', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
    progress: { phone: { '2026-11-15': 7 } } })));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace' });
  assert.deepEqual(clone(phone.study().activePackIds), ['gb_gcse']);
  assert.equal(phone.study().lock.sessionId, 'phone-session');
  assert.deepEqual(clone(phone.study().progress), { phone: { '2026-11-15': 7 }, laptop: { '2026-11-14': 50, '2026-11-15': 20 } });
});

test('a merge unions packs and edits and takes the larger progress per device and day', async () => {
  const backup = await (await device(profileRoot(study({
    activePackIds: ['in_ssc'],
    packEdits: { in_upsc_cse: { channelsAdded: [], channelsRemoved: [], topicsAdded: ['ethics'], topicsRemoved: [] } },
    lock: { sessionId: 'laptop-session', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
    progress: { laptop: { '2026-11-14': 30, '2026-11-15': 45 }, phone: { '2026-11-15': 3 } }
  })))).io.exportV3({ scope: 'full' });
  const phone = await device(profileRoot(study({ lock: null, progress: { phone: { '2026-11-15': 10 }, laptop: { '2026-11-14': 50 } } })));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'merge' });
  const merged = clone(phone.study());
  assert.deepEqual(merged.activePackIds, ['in_upsc_cse', 'in_ssc']);
  assert.deepEqual(merged.packEdits.in_upsc_cse.topicsAdded, ['polity', 'ethics']);
  assert.deepEqual(merged.progress, { phone: { '2026-11-15': 10 }, laptop: { '2026-11-14': 50, '2026-11-15': 45 } });
  assert.equal(merged.lock, null, 'the other device\'s lock is not copied');
});

test('a profile (active) import merges the study object the same way', async () => {
  const backup = await (await device(profileRoot(study({ activePackIds: ['in_ssc'] })))).io.exportV3({ scope: 'active' });
  const phone = await device(profileRoot(study({ lock: null })));
  await phone.io.importV3(clone(backup), { scope: 'active', strategy: 'merge' });
  assert.deepEqual(clone(phone.study().activePackIds), ['in_upsc_cse', 'in_ssc']);
  assert.equal(phone.study().lock, null);
});

test('when an older app dropped study, the pack ids come back from study:<packId> tags', async () => {
  const older = profileRoot(null, {
    whitelistChannels: [{ id: 'UCV1lbzgZNcYFAT3VHKOb7Cg', name: 'Unacademy UPSC', managedListId: 'study:in_upsc_cse' }],
    whitelistKeywords: [{ word: 'reasoning', managedListId: 'study:in_ssc' }]
  });
  const backup = await (await device(older)).io.exportV3({ scope: 'full' });
  assert.equal(backup.profilesV4.profiles.default.main.whitelistKeywords[0].managedListId, 'study:in_ssc', 'keyword tags survive the backup');
  assert.equal(Object.hasOwn(backup.profilesV4.profiles.default, 'study'), false, 'the stored bytes are unchanged');
  const phone = await device(profileRoot(null));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace' });
  const rebuilt = phone.model.profileStudy(phone.storage.ftProfilesV4.profiles.default);
  assert.deepEqual(clone(rebuilt.activePackIds), ['in_upsc_cse', 'in_ssc']);
  assert.equal(rebuilt.version, 1);
});

test('a backup without study leaves this profile\'s study alone on merge', async () => {
  const backup = await (await device(profileRoot(null))).io.exportV3({ scope: 'full' });
  const phone = await device(profileRoot(study()));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'merge' });
  assert.deepEqual(phone.study(), study());
});

test('the layered-rules marker survives a backup and the mode stays readable', async () => {
  const backup = await (await device(profileRoot(null, { layered: true, keywords: [{ word: 'drama' }] }))).io.exportV3({ scope: 'full' });
  const main = backup.profilesV4.profiles.default.main;
  assert.equal(main.mode, 'whitelist');
  assert.equal(main.layered, true);
  const phone = await device(profileRoot(null));
  await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace' });
  assert.equal(phone.storage.ftProfilesV4.profiles.default.main.layered, true);
  assert.equal(phone.storage.ftProfilesV4.profiles.default.main.mode, 'whitelist');
});

test('Nanah Copy once and Merge send lock: null; Move account carries the lock', async () => {
  const laptop = await device(profileRoot(study()));
  const active = await laptop.adapter.buildPortablePayload({ scope: 'active' });
  assert.equal(active.portable.profilesV4.profiles.default.study.lock, null);
  assert.equal(active.portable.profilesV4.profiles.default.study.activePackIds[0], 'in_upsc_cse');
  const full = await laptop.adapter.buildPortablePayload({ scope: 'full' });
  assert.equal(full.portable.profilesV4.profiles.default.study.lock.sessionId, 'session-here');

  const phone = await device(profileRoot(study({ lock: null, progress: { phone: { '2026-11-15': 3 } } })));
  const envelope = scope => ({ t: 'app_sync', scope, payload: JSON.stringify((scope === 'full' ? full : active).portable) });
  await phone.adapter.applyIncomingEnvelope(envelope('active'), { strategy: 'merge' });
  assert.equal(phone.study().lock, null, 'Copy once / Merge never bring a lock');
  await phone.adapter.applyIncomingEnvelope(envelope('full'), { strategy: 'replace' });
  assert.equal(phone.study().lock.sessionId, 'session-here', 'Move account carries everything');
  assert.deepEqual(clone(phone.study().progress), { phone: { '2026-11-15': 3 }, laptop: { '2026-11-14': 50, '2026-11-15': 20 } });
});

test('Main-only and Kids-only sends leave study alone', async () => {
  const laptop = await device(profileRoot(study({ activePackIds: ['in_ssc'] })));
  const main = await laptop.adapter.buildPortablePayload({ scope: 'main' });
  const phone = await device(profileRoot(study()));
  await phone.adapter.applyIncomingEnvelope({ t: 'app_sync', scope: 'main', payload: JSON.stringify(main.portable) }, { strategy: 'replace' });
  assert.deepEqual(clone(phone.study()), study());
});
