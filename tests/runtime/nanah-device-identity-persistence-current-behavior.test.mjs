import { createSharedLockManager, installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a);
  return source.slice(a, b);
}
function fixture({ stored = '', readFailure = '', writeFailure = '', delayedWrite = false, locks } = {}) {
  const disk = stored ? { deviceId: stored } : {};
  const calls = { reads: 0, writes: 0, generated: 0 };
  let finishWrite;
  const box = {
    nanahStableDeviceId: '', nanahStableDeviceIdPromise: null, nanahTrustedIdentityRestoreInProgress: false,
    nanahTrustedLinks: [], NANAH_DEVICE_ID_KEY: 'deviceId', NANAH_TRUSTED_LINKS_KEY: 'trustedLinks',
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNanahTrustedLink: value => value,
    safeArray: value => Array.isArray(value) ? value : [],
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    renderNanahTrustedLinks() {},
    crypto: { randomUUID: () => `generated-${++calls.generated}` },
    runtimeAPI: { runtime: { lastError: null }, storage: { local: {
      get(keys, callback) {
        calls.reads++;
        if (box.readFailure === 'promise') return Promise.reject(new Error('read rejected'));
        box.runtimeAPI.runtime.lastError = box.readFailure === 'callback' ? { message: 'read failed' } : null;
        callback({ ...disk });
        box.runtimeAPI.runtime.lastError = null;
      },
      set(payload, callback) {
        calls.writes++;
        if (box.writeFailure === 'promise') return Promise.reject(new Error('write rejected'));
        const complete = () => {
          const failed = box.writeFailure === 'callback';
          if (!failed) Object.assign(disk, payload);
          box.runtimeAPI.runtime.lastError = failed ? { message: 'write failed' } : null;
          callback();
          box.runtimeAPI.runtime.lastError = null;
        };
        if (delayedWrite) finishWrite = complete;
        else complete();
      }
    } } }, readFailure, writeFailure
  };
  box.window = box;
  vm.createContext(box);
  installNanahStorageLock(box, { locks });
  vm.runInContext(section('    async function ensureNanahStableDeviceId(', '    async function loadNanahPreferredDeviceLabel(')
    + section('    async function readNanahStorage(', '    function normalizeNanahManagedSigningPublicDescriptor(')
    + section('    async function loadNanahTrustedLinks(', '    function buildManagedTrustRevocationHistoryRow('), box);
  return { box, disk, calls, finish: () => { assert.ok(finishWrite); finishWrite(); } };
}
async function waitForWrite(f, expected = 1) {
  for (let i = 0; i < 32 && f.calls.writes < expected; i++) await Promise.resolve();
  assert.equal(f.calls.writes, expected);
}

test('existing device identity is retained without generating or writing another one', async () => {
  const f = fixture({ stored: 'existing-device' });
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'existing-device');
  assert.equal(f.calls.writes, 0);
  assert.equal(f.calls.generated, 0);
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'existing-device');
  assert.equal(f.calls.reads, 2);
});

test('a new identity is not published until its actual storage callback confirms the write', async () => {
  const f = fixture({ delayedWrite: true });
  const pending = f.box.ensureNanahStableDeviceId();
  await waitForWrite(f);
  assert.equal(f.box.nanahStableDeviceId, '');
  assert.equal(f.disk.deviceId, undefined);
  f.finish();
  const id = await pending;
  assert.equal(id, f.disk.deviceId);
  assert.equal(id, f.box.nanahStableDeviceId);
});

test('concurrent pairing preparation uses one provisioning operation and one durable identity', async () => {
  const f = fixture({ delayedWrite: true });
  const first = f.box.ensureNanahStableDeviceId();
  const second = f.box.ensureNanahStableDeviceId();
  await waitForWrite(f);
  f.finish();
  const ids = await Promise.all([first, second]);
  assert.equal(ids[0], ids[1]);
  assert.equal(ids[0], f.disk.deviceId);
  assert.equal(f.calls.reads, 1);
  assert.equal(f.calls.generated, 1);
});

for (const failure of ['callback', 'promise']) {
  test(`a ${failure} storage write failure cannot publish a transient paired identity and can be retried`, async () => {
    const f = fixture({ writeFailure: failure });
    await assert.rejects(f.box.ensureNanahStableDeviceId(), /Could not save this device identity/);
    assert.equal(f.box.nanahStableDeviceId, '');
    assert.equal(f.box.nanahStableDeviceIdPromise, null);
    assert.equal(f.disk.deviceId, undefined);
    f.box.writeFailure = '';
    const id = await f.box.ensureNanahStableDeviceId();
    assert.equal(id, f.disk.deviceId);
    assert.equal(f.calls.writes, 2);
  });

  test(`a ${failure} read failure preserves the existing stored identity rather than replacing it`, async () => {
    const f = fixture({ stored: 'existing-device', readFailure: failure });
    await assert.rejects(f.box.ensureNanahStableDeviceId(), /read/);
    assert.equal(f.box.nanahStableDeviceId, '');
    assert.equal(f.disk.deviceId, 'existing-device');
    assert.equal(f.calls.writes, 0);
    assert.equal(f.calls.generated, 0);
    f.box.readFailure = '';
    assert.equal(await f.box.ensureNanahStableDeviceId(), 'existing-device');
  });
}

test('identity invalidation during provisioning cannot publish an obsolete operation', async () => {
  const f = fixture({ delayedWrite: true });
  const pending = f.box.ensureNanahStableDeviceId();
  await waitForWrite(f);
  f.box.nanahStableDeviceIdPromise = null;
  f.finish();
  await assert.rejects(pending, /Device identity changed/);
  assert.equal(f.box.nanahStableDeviceId, '');
  assert.equal(f.box.nanahStableDeviceIdPromise, null);
});

test('unavailable storage cannot silently replace device identity', async () => {
  const f = fixture();
  f.box.runtimeAPI.storage.local = {};
  await assert.rejects(f.box.ensureNanahStableDeviceId(), /unavailable/);
  assert.equal(f.box.nanahStableDeviceId, '');
  assert.equal(f.calls.generated, 0);
});

test('trusted restore waits for an already-started provisioning write before replacing the durable identity', async () => {
  const f = fixture({ delayedWrite: true });
  const provision = f.box.ensureNanahStableDeviceId();
  await waitForWrite(f);
  let restoreStarted = false;
  const restored = f.box.withNanahTrustedIdentityRestore(async () => {
    restoreStarted = true;
    assert.equal(await f.box.writeNanahStorage('deviceId', 'restored-device-id'), true);
    return 'restored';
  });
  assert.equal(restoreStarted, false);
  await assert.rejects(f.box.ensureNanahStableDeviceId(), /being restored/);
  f.finish();
  await provision;
  await waitForWrite(f, 2);
  assert.equal(restoreStarted, true);
  f.finish();
  assert.equal(await restored, 'restored');
  assert.equal(f.disk.deviceId, 'restored-device-id');
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'restored-device-id');
  assert.equal(f.calls.generated, 1);
});

test('an approved restore can recover a failed provisioning write without starting competing provisioning', async () => {
  const f = fixture({ delayedWrite: true, writeFailure: 'callback' });
  const provision = f.box.ensureNanahStableDeviceId();
  const failed = assert.rejects(provision, /Could not save/);
  await waitForWrite(f);
  const restore = f.box.withNanahTrustedIdentityRestore(async () => {
    f.box.writeFailure = '';
    assert.equal(await f.box.writeNanahStorage('deviceId', 'restored-after-failure'), true);
  });
  f.finish();
  await failed;
  await waitForWrite(f, 2);
  await assert.rejects(f.box.ensureNanahStableDeviceId(), /being restored/);
  f.finish();
  await restore;
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'restored-after-failure');
  assert.equal(f.calls.generated, 1);
});

test('failed trusted restore releases the pairing barrier and reloads the actual durable identity', async () => {
  const f = fixture({ stored: 'existing-device' });
  await f.box.ensureNanahStableDeviceId();
  await assert.rejects(f.box.withNanahTrustedIdentityRestore(async () => { throw new Error('import failed'); }), /import failed/);
  assert.equal(f.box.nanahTrustedIdentityRestoreInProgress, false);
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'existing-device');
  assert.equal(f.calls.generated, 0);
});

test('overlapping trusted restores are refused while the existing restore retains control', async () => {
  const f = fixture({ stored: 'existing-device' });
  let finishRestore;
  const restore = f.box.withNanahTrustedIdentityRestore(() => new Promise(resolve => { finishRestore = resolve; }));
  await assert.rejects(f.box.withNanahTrustedIdentityRestore(async () => {}), /already in progress/);
  await assert.rejects(f.box.ensureNanahStableDeviceId(), /being restored/);
  finishRestore();
  await restore;
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'existing-device');
});

const importCall = section('            const importOptions = {', '            await StateManager.loadSettings(');
test('actual trusted-backup import dispatcher waits before invoking the identity-writing importer', async () => {
  const f = fixture({ delayedWrite: true });
  let imports = 0;
  Object.assign(f.box, { restoreTrustedNanahState: true, auth: { actorProfileId: 'parent' }, payload: { synthetic: true },
    io: { importV3: async (payload, options) => {
      imports++;
      assert.equal(options.auth.restoreTrustedNanahState, true);
      assert.equal(options.auth.actorProfileId, 'parent');
      assert.equal(await f.box.writeNanahStorage('deviceId', 'trusted-backup-device'), true);
      return { restoredNanahState: true };
    } }
  });
  const provision = f.box.ensureNanahStableDeviceId();
  await waitForWrite(f);
  const imported = vm.runInContext(`(async () => { ${importCall} return importResult; })()`, f.box);
  assert.equal(imports, 0);
  f.finish();
  await provision;
  await waitForWrite(f, 2);
  assert.equal(imports, 1);
  f.finish();
  assert.equal((await imported).restoredNanahState, true);
  assert.equal(f.disk.deviceId, 'trusted-backup-device');
  assert.equal(await f.box.ensureNanahStableDeviceId(), 'trusted-backup-device');
});

test('actual settings-only import dispatcher preserves its existing path without an identity-restore barrier', async () => {
  const f = fixture({ stored: 'existing-device' });
  Object.assign(f.box, { restoreTrustedNanahState: false, auth: null, payload: { synthetic: true },
    io: { importV3: async (_, options) => {
      assert.equal(options.auth.restoreTrustedNanahState, false);
      assert.equal(f.box.nanahTrustedIdentityRestoreInProgress, false);
      return { restoredNanahState: false };
    } }
  });
  assert.equal((await vm.runInContext(`(async () => { ${importCall} return importResult; })()`, f.box)).restoredNanahState, false);
  assert.equal(f.disk.deviceId, 'existing-device');
  assert.equal(f.calls.writes, 0);
});

test('trusted restore orders pending and subsequent link commits around the actual restored rows', async () => {
  const f = fixture({ delayedWrite: true, stored: 'device' });
  const first = f.box.commitNanahTrustedLinkMutation(rows => ({ rows: [...rows, { linkId: 'before-restore' }], result: true }));
  await waitForWrite(f);
  let imports = 0;
  const restore = f.box.withNanahTrustedIdentityRestore(async () => {
    imports++;
    assert.equal(await f.box.writeNanahStorage('trustedLinks', [{ linkId: 'from-backup' }]), true);
  });
  const after = f.box.commitNanahTrustedLinkMutation(rows => {
    assert.deepEqual(JSON.parse(JSON.stringify(rows)), [{ linkId: 'from-backup' }]);
    return { rows: [...rows, { linkId: 'after-restore' }], result: true };
  });
  assert.equal(imports, 0);
  f.finish();
  await first;
  await waitForWrite(f, 2);
  assert.equal(imports, 1);
  f.finish();
  await restore;
  await waitForWrite(f, 3);
  f.finish();
  assert.equal(await after, true);
  assert.deepEqual(JSON.parse(JSON.stringify(f.disk.trustedLinks)), [{ linkId: 'from-backup' }, { linkId: 'after-restore' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(f.box.nanahTrustedLinks)), JSON.parse(JSON.stringify(f.disk.trustedLinks)));
});

test('a partially failed trusted restore forces a fresh checked read before the next link mutation', async () => {
  const f = fixture({ stored: 'device' });
  f.disk.trustedLinks = [{ linkId: 'old-link' }];
  await f.box.loadNanahTrustedLinks();
  await assert.rejects(f.box.withNanahTrustedIdentityRestore(async () => {
    assert.equal(await f.box.writeNanahStorage('trustedLinks', [{ linkId: 'restored-link' }]), true);
    throw new Error('later import step failed');
  }), /later import step failed/);
  assert.equal(f.box.getNanahTrustedLinkMutationState().loaded, false);
  f.box.readFailure = 'callback';
  const writes = f.calls.writes;
  await assert.rejects(f.box.commitNanahTrustedLinkMutation(rows => ({ rows: [...rows, { linkId: 'new-link' }], result: true })), /could not be read/);
  assert.equal(f.calls.writes, writes);
  f.box.readFailure = '';
  await f.box.commitNanahTrustedLinkMutation(rows => ({ rows: [...rows, { linkId: 'new-link' }], result: true }));
  assert.deepEqual(JSON.parse(JSON.stringify(f.disk.trustedLinks)), [{ linkId: 'restored-link' }, { linkId: 'new-link' }]);
});


test('two extension pages provision one durable identity through the shared lock', async () => {
  const locks = createSharedLockManager();
  const pageA = fixture({ delayedWrite: true, locks }), pageB = fixture({ locks });
  pageB.box.runtimeAPI.storage.local = pageA.box.runtimeAPI.storage.local;
  pageB.box.runtimeAPI.runtime = pageA.box.runtimeAPI.runtime;
  const first = pageA.box.ensureNanahStableDeviceId(); await waitForWrite(pageA);
  const second = pageB.box.ensureNanahStableDeviceId();
  for (let i = 0; i < 16; i++) await Promise.resolve();
  assert.equal(pageB.calls.generated, 0);
  pageA.finish();
  const ids = await Promise.all([first, second]);
  assert.equal(ids[0], ids[1]); assert.equal(ids[0], pageA.disk.deviceId);
  assert.equal(pageA.calls.generated + pageB.calls.generated, 1);
  assert.equal(pageA.calls.writes, 1);
});

test("a cached page identity refreshes from another page's durable restore", async () => {
  const locks = createSharedLockManager(), pageA = fixture({ stored: 'old-device', locks }), pageB = fixture({ locks });
  pageB.box.runtimeAPI.storage.local = pageA.box.runtimeAPI.storage.local;
  pageB.box.runtimeAPI.runtime = pageA.box.runtimeAPI.runtime;
  assert.equal(await pageB.box.ensureNanahStableDeviceId(), 'old-device');
  await pageA.box.withNanahTrustedIdentityRestore(() => pageA.box.FilterTubeNanahStorageLock.run(async () => {
    assert.equal(await pageA.box.writeNanahStorage('deviceId', 'restored-device'), true);
  }));
  assert.equal(pageB.box.nanahStableDeviceId, 'old-device');
  assert.equal(await pageB.box.ensureNanahStableDeviceId(), 'restored-device');
  assert.equal(pageB.calls.generated, 0);
});


test('unsupported cross-window locking stops identity provisioning before any storage access', async () => {
  const f = fixture(); delete f.box.navigator.locks;
  await assert.rejects(f.box.ensureNanahStableDeviceId(), /locking is unsupported/);
  assert.equal(f.calls.reads, 0); assert.equal(f.calls.writes, 0); assert.equal(f.calls.generated, 0);
  assert.equal(f.box.nanahStableDeviceId, '');
});
