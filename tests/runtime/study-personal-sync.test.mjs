import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';

// Personal Auto-sync carries the study object as its own area. Packs and edits merge like keywords,
// progress takes the larger value per device and day, and the running lock never leaves the device.
const require = createRequire(import.meta.url);
const harness = require('./fixtures/auto-sync-two-endpoint-harness.js');
const modules = {
  queueAPI: require('../../js/auto_sync_queue.js'),
  controllerAPI: require('../../js/device_auto_sync.js'),
  protocol: require('../../js/personal_sync.js'),
  notesAPI: require('../../js/video_notes_store.js'),
  managedAPI: require('../../js/managed_auto_sync.js'),
  runtimeAPI: require('../../js/personal_auto_sync_runtime.js')
};
const protocol = modules.protocol;

async function network(t) {
  const value = await harness.create({ modules, crypto: webcrypto });
  t.after(() => value.dispose());
  return value;
}

test('the study area syncs packs, edits and progress but never the lock', async t => {
  const n = await network(t);
  await n.a.editProfile(profile => {
    profile.study = { version: 1, activePackIds: ['in_upsc_cse'], focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 },
      packEdits: { in_upsc_cse: { channelsAdded: [{ handle: '@clearias' }], channelsRemoved: [], topicsAdded: ['polity'], topicsRemoved: [] } },
      lock: { sessionId: 'session-on-A', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
      progress: { 'device-A': { '2026-11-15': 30 }, 'device-B': { '2026-11-15': 5 } }, weekView: true };
  });
  await n.b.editProfile(profile => {
    profile.study = { version: 1, activePackIds: ['in_ssc'], lock: { sessionId: 'session-on-B', sessionKind: 'self_control', mode: 'gentle', setByParentId: null },
      progress: { 'device-B': { '2026-11-15': 20 } } };
  });
  await n.enroll({ settings: true, study: true });
  await n.cycle({ rounds: 4 });
  const b = (await n.b.profile()).study;
  assert.deepEqual(b.activePackIds, ['in_ssc', 'in_upsc_cse']);
  assert.deepEqual(b.packEdits.in_upsc_cse.topicsAdded, ['polity']);
  assert.deepEqual(b.progress, { 'device-B': { '2026-11-15': 20 }, 'device-A': { '2026-11-15': 30 } });
  assert.equal(b.lock.sessionId, 'session-on-B', 'B keeps its own lock');
  const a = (await n.a.profile()).study;
  assert.equal(a.lock.sessionId, 'session-on-A', 'A keeps its own lock');
  assert.deepEqual(a.progress['device-B'], { '2026-11-15': 20 });
  const wire = JSON.stringify([...n.a.sent, ...n.b.sent]);
  assert.equal(wire.includes('session-on-A'), false);
  assert.equal(wire.includes('session-on-B'), false);
});

test('a device without a study object sends none and changes nothing on the other device', async t => {
  const n = await network(t);
  await n.b.editProfile(profile => {
    profile.study = { version: 1, activePackIds: ['in_ssc'], focus: { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 90 } };
  });
  await n.enroll({ settings: true, study: true });
  await n.cycle({ rounds: 4 });
  assert.deepEqual((await n.b.profile()).study.focus, { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 90 });
  assert.deepEqual((await n.a.profile()).study.activePackIds, ['in_ssc']);
  assert.equal((await n.a.profile()).study.lock, null);
});

test('settings sync carries layered (written only when on)', async t => {
  const n = await network(t);
  await n.enroll({ settings: true });
  await n.cycle({ rounds: 2 });
  await n.a.editProfile(profile => { profile.main.mode = 'whitelist'; profile.main.layered = true; });
  await n.cycle({ rounds: 3 });
  assert.equal((await n.b.profile()).main.layered, true);
  assert.equal((await n.b.profile()).main.mode, 'whitelist');
  await n.a.editProfile(profile => { delete profile.main.layered; });
  await n.cycle({ rounds: 3 });
  assert.equal(Object.hasOwn((await n.b.profile()).main, 'layered'), false);
  assert.equal(Object.hasOwn(protocol.snapshotSettings({ main: { mode: 'blocklist', layered: false } }).main, 'layered'), false);
});

test('the study area is its own grant and is rejected when not granted', () => {
  const key = { kty: 'OKP', crv: 'Ed25519', x: 'A'.repeat(43) };
  const grant = protocol.normalizeGrant({ localDeviceId: 'a', localProfileId: 'p', remoteDeviceId: 'b', remoteProfileId: 'q',
    localGrantId: 'g1', remoteGrantId: 'g2', localGeneration: 1, remoteGeneration: 1, areas: ['settings'], enabled: true,
    localPublicKeyJwk: key, remotePublicKeyJwk: key });
  assert.throws(() => protocol.mergeStudy(null, { version: 1, activePackIds: [] }, grant), /study_not_authorized/);
  const studyGrant = protocol.normalizeGrant({ ...grant, areas: ['study'] });
  assert.equal(protocol.mergeStudy(null, { version: 1, activePackIds: ['a_pack'], lock: { sessionId: 'x' } }, studyGrant).lock, null);
  assert.equal(protocol.snapshotStudy({ main: {} }), null);
  assert.equal(protocol.snapshotStudy({ study: { version: 1, activePackIds: [], lock: { sessionId: 's' } } }).lock, null);
  assert.ok(protocol.AREAS.includes('study'));
});

test('a copy of personal_sync.js without the study model (the Android runtime) behaves as before', async () => {
  const { default: fs } = await import('node:fs');
  const { default: vm } = await import('node:vm');
  const box = { TextEncoder, crypto: globalThis.crypto };
  vm.runInNewContext(fs.readFileSync(new URL('../../js/personal_sync.js', import.meta.url), 'utf8'), box);
  assert.deepEqual([...box.FilterTubePersonalSync.AREAS], ['settings', 'notes', 'playlists']);
  const key = { kty: 'OKP', crv: 'Ed25519', x: 'A'.repeat(43) };
  assert.throws(() => box.FilterTubePersonalSync.normalizeGrant({ localDeviceId: 'a', localProfileId: 'p', remoteDeviceId: 'b', remoteProfileId: 'q',
    localGrantId: 'g1', remoteGrantId: 'g2', localGeneration: 1, remoteGeneration: 1, areas: ['study'], enabled: true,
    localPublicKeyJwk: key, remotePublicKeyJwk: key }));
});
