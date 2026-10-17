import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSharedLockManager, installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve, reject; const promise = new Promise((ok, no) => { resolve = ok; reject = no; }); return { promise, resolve, reject }; };
function realm(locks = createSharedLockManager()) {
  const context = {}; vm.createContext(context); installNanahStorageLock(context, { locks }); return context;
}

test('separate globals share the exact exclusive lock and hold it through awaited work', async () => {
  const locks = createSharedLockManager(), a = realm(locks), b = realm(locks), gate = deferred(), entered = deferred(), events = [];
  const first = a.FilterTubeNanahStorageLock.run(async () => { events.push('A start'); entered.resolve(); await gate.promise; events.push('A finish'); return 'A result'; });
  await entered.promise;
  const second = b.FilterTubeNanahStorageLock.run(async () => { events.push('B start'); return 'B result'; });
  await Promise.resolve(); assert.deepEqual(events, ['A start']);
  gate.resolve(); assert.equal(await first, 'A result'); assert.equal(await second, 'B result');
  assert.deepEqual(events, ['A start', 'A finish', 'B start']);
  assert.deepEqual(locks.requests, [{ name: 'filtertube-nanah-trusted-storage-v1', mode: 'exclusive' }, { name: 'filtertube-nanah-trusted-storage-v1', mode: 'exclusive' }]);
});

test('rejected operations release the lock and do not poison another global', async () => {
  const locks = createSharedLockManager(), a = realm(locks), b = realm(locks), gate = deferred(), entered = deferred();
  const first = a.FilterTubeNanahStorageLock.run(async () => { entered.resolve(); await gate.promise; throw new Error('intentional operation failure'); });
  const denied = assert.rejects(first, /intentional operation failure/); await entered.promise;
  let ran = false; const next = b.FilterTubeNanahStorageLock.run(() => { ran = true; return 'recovered'; });
  assert.equal(ran, false); gate.resolve(); await denied; assert.equal(await next, 'recovered');
});

test('only an explicitly supplied live same-realm token permits nesting without reacquiring', async () => {
  const locks = createSharedLockManager(), a = realm(locks), b = realm(locks); let savedToken;
  await a.FilterTubeNanahStorageLock.run(async token => {
    savedToken = token; assert.ok(Object.isFrozen(token));
    assert.equal(await a.FilterTubeNanahStorageLock.run(same => { assert.equal(same, token); return 17; }, token), 17);
    await assert.rejects(b.FilterTubeNanahStorageLock.run(() => assert.fail('foreign token executed'), token), /invalid or expired/);
    for (const invalid of [{}, [], 'token', 0, false]) await assert.rejects(a.FilterTubeNanahStorageLock.run(() => assert.fail('fabricated token executed'), invalid), /invalid or expired/);
  });
  assert.equal(locks.requests.length, 1);
  await assert.rejects(a.FilterTubeNanahStorageLock.run(() => assert.fail('expired token executed'), savedToken), /invalid or expired/);
});

test('holding a lock does not create a page-global implicit nesting bypass', async () => {
  const a = realm(), gate = deferred(), entered = deferred(); let independentRan = false;
  const outer = a.FilterTubeNanahStorageLock.run(async () => { entered.resolve(); await gate.promise; }); await entered.promise;
  const independent = a.FilterTubeNanahStorageLock.run(() => { independentRan = true; });
  await Promise.resolve(); assert.equal(independentRan, false);
  gate.resolve(); await outer; await independent; assert.equal(independentRan, true);
});

test('unsupported Web Locks, denied lock requests and invalid callbacks run no operation', async () => {
  for (const locks of [undefined, {}, { request: () => Promise.reject(new Error('request denied')) }]) {
    const a = {}; vm.createContext(a); a.navigator = { locks }; vm.runInContext(read('nanah_storage_lock'), a);
    let ran = false; await assert.rejects(a.FilterTubeNanahStorageLock.run(() => { ran = true; }), /unsupported|request denied/);
    assert.equal(ran, false);
  }
  await assert.rejects(realm().FilterTubeNanahStorageLock.run(null), /operation is required/);
});

async function ioRealm(storage, locks, trace = []) {
  const context = {
    console, setTimeout, clearTimeout,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { if (keys === null) trace.push('read all'); done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { trace.push({ write: Object.keys(payload) }); Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { trace.push({ remove: clone(keys) }); (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  context.window = context; vm.createContext(context); installNanahStorageLock(context, { locks });
  vm.runInContext(read('settings_shared'), context); vm.runInContext(read('io_manager'), context);
  await context.FilterTubeSettings.loadSettings(); return context;
}
function stored() {
  return { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Parent', parentProfileId: null, settings: {},
    main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] }
  } } }, ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [{ linkId: 'old-link', remoteDeviceId: 'old-peer' }], ftNanahDeviceId: 'old-device',
    ftNanahManagedSigningKeyPair: { syntheticPrivate: 'old-private' }, ftNanahManagedSigningPublicKey: { syntheticPublic: 'old-public' } };
}

test('the whole ordinary IO import, including all-storage rollback, excludes another realm’s trusted restore', async () => {
  const storage = stored(), locks = createSharedLockManager(), aTrace = [], bTrace = [];
  const a = await ioRealm(storage, locks, aTrace), b = await ioRealm(storage, locks, bTrace);
  const payload = await a.FilterTubeIO.exportV3({ scope: 'full' });
  const incoming = clone(payload); incoming.nanahState = { deviceId: 'new-device', trustedLinks: [{ linkId: 'new-link', remoteDeviceId: 'new-peer' }] };
  const gate = deferred(), entered = deferred(); let checks = 0;
  const first = a.FilterTubeIO.importV3(payload, { scope: 'active', beforeProfileWrite: async () => {
    if (++checks === 2) { entered.resolve(); await gate.promise; throw new Error('intentional late import failure'); }
  } });
  const failed = assert.rejects(first, /intentional late import failure/); await entered.promise;
  assert.ok(aTrace.some(entry => entry.write?.includes('ftProfilesV4')), 'a real profile mutation occurred before the injected failure');
  const readsBefore = bTrace.length;
  const second = b.FilterTubeIO.importV3(incoming, { scope: 'full', strategy: 'replace', auth: { restoreTrustedNanahState: true } });
  await Promise.resolve(); assert.equal(bTrace.length, readsBefore, 'waiting import cannot even take its storage snapshot');
  gate.resolve(); await failed; assert.equal((await second).restoredNanahState, true);
  assert.deepEqual(storage.ftNanahTrustedLinks, [{ linkId: 'new-link', remoteDeviceId: 'new-peer' }]);
  assert.equal(storage.ftNanahDeviceId, 'new-device');
  assert.deepEqual(storage.ftNanahManagedSigningKeyPair, { syntheticPrivate: 'old-private' });
  assert.ok(aTrace.filter(row => row === 'read all').length >= 2, 'production rollback read current storage before restoring its snapshot');
});

test('plain and encrypted IO imports accept only an explicitly forwarded active token', async () => {
  const storage = stored(), locks = createSharedLockManager(), a = await ioRealm(storage, locks);
  const payload = await a.FilterTubeIO.exportV3({ scope: 'active' });
  a.FilterTubeSecurity = { decryptJson: async () => clone(payload) };
  let token;
  await a.FilterTubeNanahStorageLock.run(async active => {
    token = active;
    assert.equal((await a.FilterTubeIO.importV3(payload, { scope: 'active', nanahStorageLockToken: active })).ok, true);
    assert.equal((await a.FilterTubeIO.importV3Encrypted({ meta: { encrypted: true }, encrypted: {} }, { password: 'synthetic', scope: 'active', nanahStorageLockToken: active })).ok, true);
  });
  assert.equal(locks.requests.length, 1, 'IO did not request the held lock again');
  await assert.rejects(a.FilterTubeIO.importV3(payload, { nanahStorageLockToken: token }), /invalid or expired/);
});

test('missing coordinator prevents IO reads and writes rather than silently falling back', async () => {
  const context = { window: {}, chrome: { storage: { local: {} } } }; vm.createContext(context); vm.runInContext(read('io_manager'), context);
  await assert.rejects(context.window.FilterTubeIO.importV3({}), /locking is unavailable/);
});

test('both extension documents load the coordinator before IO', () => {
  for (const name of ['popup', 'tab-view']) {
    const html = fs.readFileSync(new URL(`../../html/${name}.html`, import.meta.url), 'utf8');
    const lock = html.indexOf('src="../js/nanah_storage_lock.js"'), io = html.indexOf('src="../js/io_manager.js"');
    assert.ok(lock >= 0 && io > lock, name);
  }
});
