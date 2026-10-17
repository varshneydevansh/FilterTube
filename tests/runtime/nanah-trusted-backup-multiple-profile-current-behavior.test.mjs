import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const link = (id, parent = 'parent-A', child = 'child-one', extra = {}) => ({
  ...(id ? { linkId: id } : {}), remoteDeviceId: 'shared-parent-device', sourceDeviceId: 'shared-parent-device', targetDeviceId: 'receiver-device',
  sourceProfileId: parent, localRole: 'replica', remoteRole: 'source', linkType: 'managed_link',
  policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: child }, ...extra
});
async function fixture(existing = []) {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Parent', parentProfileId: null, settings: {},
    main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] }
  } } }, ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: clone(existing), ftNanahDeviceId: 'receiver-device',
    ftNanahManagedSigningKeyPair: { syntheticPrivate: 'preserve-private' }, ftNanahManagedSigningPublicKey: { syntheticPublic: 'preserve-public' } };
  const calls = { writes: [], removes: [], settingsLoads: 0 };
  const box = { console, setTimeout, clearTimeout,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { calls.writes.push(clone(payload)); Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { calls.removes.push(clone(keys)); (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box; vm.createContext(box); installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box); vm.runInContext(read('io_manager'), box);
  await box.FilterTubeSettings.loadSettings();
  const payload = await box.FilterTubeIO.exportV3({ scope: 'full' });
  const load = box.FilterTubeSettings.loadSettings;
  box.FilterTubeSettings.loadSettings = (...args) => { calls.settingsLoads++; return load(...args); };
  calls.writes.length = 0; calls.removes.length = 0;
  async function restore(incoming, { strategy = 'merge', auth = { restoreTrustedNanahState: true } } = {}) {
    const backup = clone(payload); backup.nanahState = { deviceId: 'receiver-device', trustedLinks: clone(incoming) };
    return box.FilterTubeIO.importV3(backup, { scope: 'full', strategy, auth });
  }
  return { box, storage, calls, restore };
}

for (const [name, existing, incoming] of [
  ['two incoming children', [], [link('A-one'), link('A-two', 'parent-A', 'child-two')]],
  ['existing child and incoming second child', [link('A-one')], [link('A-two', 'parent-A', 'child-two')]],
  ['two existing children plus unrelated incoming peer', [link('A-one'), link('A-two', 'parent-A', 'child-two')], [{ linkId: 'unrelated', remoteDeviceId: 'unrelated-device', localRole: 'peer', remoteRole: 'peer' }]],
  ['two independent parents and receiving children', [], [link('A-one'), link('B-three', 'parent-B', 'child-three')]],
  ['two independent parents for the same child', [link('A-one')], [link('B-one', 'parent-B')]]
]) {
  test(`real IO restore preserves ${name}`, async () => {
    const f = await fixture(existing), result = await f.restore(incoming);
    assert.equal(result.ok, true); assert.equal(result.restoredNanahState, true); assert.equal(result.receipt.verified, true);
    assert.deepEqual(f.storage.ftNanahTrustedLinks.map(row => row.linkId), [...existing, ...incoming].map(row => row.linkId));
    assert.deepEqual(f.storage.ftNanahManagedSigningKeyPair, { syntheticPrivate: 'preserve-private' });
    assert.deepEqual(f.storage.ftNanahManagedSigningPublicKey, { syntheticPublic: 'preserve-public' });
  });
}

test('only the same explicit ID and binding is intentionally replaced; unrelated receipts and opaque IDs survive', async () => {
  const untouched = link('opaque-existing-two', 'parent-A', 'child-two', { policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'child-two', outboundManagedPolicyHistory: [{ rowId: 'preserved-receipt' }] } });
  const f = await fixture([link('opaque-existing-one'), untouched]);
  await f.restore([link('opaque-existing-one', 'parent-A', 'child-one', { deviceLabel: 'Reviewed new label' })]);
  assert.deepEqual(f.storage.ftNanahTrustedLinks.map(row => row.linkId), ['opaque-existing-one', 'opaque-existing-two']);
  assert.equal(f.storage.ftNanahTrustedLinks[0].deviceLabel, 'Reviewed new label');
  assert.deepEqual(f.storage.ftNanahTrustedLinks[1], untouched);
});

test('different explicit IDs with the same tuple remain distinct instead of silently migrating receipts', async () => {
  const old = link('old-protocol-id', 'parent-A', 'child-one', { policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'child-one', outgoingManagedPolicies: { kids: { revision: 7, policyHash: 'old-policy' } } } });
  const f = await fixture([old]); await f.restore([link('new-protocol-id')]);
  assert.deepEqual(f.storage.ftNanahTrustedLinks.map(row => row.linkId), ['old-protocol-id', 'new-protocol-id']);
  assert.deepEqual(f.storage.ftNanahTrustedLinks[0], old);
  assert.equal(f.storage.ftNanahTrustedLinks[1].policy.outgoingManagedPolicies, undefined);
});

test('legacy no-ID rows retain distinct available parent/child/role bindings without inventing IDs', async () => {
  const a = link('', 'parent-A', 'child-one'), b = link('', 'parent-A', 'child-two'), c = link('', 'parent-B', 'child-one');
  const f = await fixture([a]); await f.restore([b, c]);
  assert.deepEqual(f.storage.ftNanahTrustedLinks, [a, b, c]);
  assert.ok(f.storage.ftNanahTrustedLinks.every(row => !Object.hasOwn(row, 'linkId')));
});

test('legacy rows lacking any role/profile binding are retained individually rather than guessed from remote device', async () => {
  const a = { remoteDeviceId: 'legacy-device', deviceLabel: 'First recovery record' }, b = { remoteDeviceId: 'legacy-device', deviceLabel: 'Second recovery record' };
  const f = await fixture([a]); await f.restore([b]); assert.deepEqual(f.storage.ftNanahTrustedLinks, [a, b]);
});

for (const [name, change] of [
  ['remote device', row => { row.remoteDeviceId = 'foreign-device'; }],
  ['source device', row => { row.sourceDeviceId = 'foreign-source'; }],
  ['receiver device', row => { row.targetDeviceId = 'foreign-receiver'; }],
  ['source parent', row => { row.sourceProfileId = 'foreign-parent'; }],
  ['fixed child', row => { row.policy.targetProfileId = 'foreign-child'; }],
  ['roles', row => { row.localRole = 'source'; row.remoteRole = 'replica'; }],
  ['target behavior', row => { row.policy.targetProfileBehavior = 'current_active'; }]
]) {
  test(`same-ID ${name} conflict rejects the entire real import before any mutation`, async () => {
    for (const strategy of ['merge', 'replace']) {
      const f = await fixture([link('existing-id')]), before = clone(f.storage), foreign = link('existing-id'); change(foreign);
      await assert.rejects(f.restore([foreign], { strategy }), /link ID bound to another/);
      assert.deepEqual(f.storage, before, strategy); assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.removes.length, 0);
      assert.equal(f.calls.settingsLoads, 0, 'collision is rejected before SettingsAPI load/normalization');
    }
  });
}

test('conflicting duplicate incoming IDs reject both merge and replace before profile/trust/key writes', async () => {
  for (const strategy of ['merge', 'replace']) {
    const f = await fixture(), before = clone(f.storage);
    await assert.rejects(f.restore([link('same-id'), link('same-id', 'parent-B')], { strategy }), /link ID bound to another/);
    assert.deepEqual(f.storage, before); assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.removes.length, 0);
  }
});

test('replace keeps distinct incoming recipients and deduplicates only identical explicit ID bindings', async () => {
  const f = await fixture([link('old-only', 'old-parent', 'old-child')]);
  await f.restore([link('A-one'), link('A-two', 'parent-A', 'child-two'), link('A-one', 'parent-A', 'child-one', { deviceLabel: 'Latest approved backup row' })], { strategy: 'replace' });
  assert.deepEqual(f.storage.ftNanahTrustedLinks.map(row => row.linkId), ['A-one', 'A-two']);
  assert.equal(f.storage.ftNanahTrustedLinks[0].deviceLabel, 'Latest approved backup row');
});

test('identity comparison preserves case, normalizes roles and respects runtime policy target aliases', async () => {
  const f = await fixture([link('Case-ID')]);
  const row = link('Case-ID'); row.localRole = ' REPLICA '; row.remoteRole = ' SOURCE ';
  row.targetProfileId = 'ignored-root-target'; row.deviceLabel = 'Normalized roles';
  await f.restore([row, link('case-id', 'parent-B')]);
  assert.deepEqual(f.storage.ftNanahTrustedLinks.map(value => value.linkId), ['Case-ID', 'case-id']);
  assert.equal(f.storage.ftNanahTrustedLinks[0].deviceLabel, 'Normalized roles');
});

test('ordinary import does not restore or validate peer-provided recovery data without explicit restore approval', async () => {
  const f = await fixture([link('preserved')]), before = clone(f.storage.ftNanahTrustedLinks);
  const result = await f.restore([link('conflicting'), link('conflicting', 'parent-B')], { auth: {} });
  assert.equal(result.restoredNanahState, false); assert.deepEqual(f.storage.ftNanahTrustedLinks, before);
});

for (const stage of ['snapshot', 'trust preflight']) {
  for (const mode of ['callback error followed by Promise success', 'Promise rejection', 'synchronous throw']) {
    test(`checked ${stage} ${mode} prevents all import mutations and preserves unseen grants`, async () => {
      const f = await fixture([link('existing-unseen-grant')]), before = clone(f.storage);
      const get = f.box.chrome.storage.local.get;
      f.box.chrome.storage.local.get = (keys, done) => {
        const failHere = stage === 'snapshot' ? keys === null : Array.isArray(keys) && keys.includes('ftNanahTrustedLinks');
        if (!failHere) return get(keys, done);
        if (mode === 'synchronous throw') throw new Error('synthetic required read failure');
        if (mode === 'Promise rejection') return Promise.reject(new Error('synthetic required read failure'));
        f.box.chrome.runtime.lastError = { message: 'synthetic required read failure' }; done({}); f.box.chrome.runtime.lastError = null;
        return Promise.resolve(clone(f.storage));
      };
      await assert.rejects(f.restore([link('new-grant', 'parent-B')]), /synthetic required read failure/);
      assert.deepEqual(f.storage, before); assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.removes.length, 0);
      assert.equal(f.calls.settingsLoads, 0);
    });
  }
}

test('a Promise-only successful checked snapshot read supports the real import without callback fallback', async () => {
  const f = await fixture([link('A-one')]), get = f.box.chrome.storage.local.get;
  let snapshots = 0;
  f.box.chrome.storage.local.get = (keys, done) => {
    if (keys === null && snapshots++ === 0) return Promise.resolve(clone(f.storage));
    return get(keys, done);
  };
  assert.equal((await f.restore([link('B-two', 'parent-B', 'child-two')])).ok, true);
  assert.deepEqual(f.storage.ftNanahTrustedLinks.map(row => row.linkId), ['A-one', 'B-two']);
});

test('a failed checked rollback read reports failure without blindly restoring or removing identity data', async () => {
  const f = await fixture([link('preserved')]), get = f.box.chrome.storage.local.get;
  let rejectRollbackRead = false, checks = 0;
  f.box.chrome.storage.local.get = (keys, done) => {
    if (rejectRollbackRead && keys === null) return Promise.reject(new Error('synthetic rollback read failure'));
    return get(keys, done);
  };
  const payload = await f.box.FilterTubeIO.exportV3({ scope: 'active' });
  await assert.rejects(f.box.FilterTubeIO.importV3(payload, { scope: 'active', beforeProfileWrite: async () => {
    if (++checks === 2) {
      rejectRollbackRead = true;
      f.storage.syntheticConcurrentKey = 'must-not-remove';
      throw new Error('intentional late import failure');
    }
  } }), /rollback also failed: synthetic rollback read failure/);
  assert.equal(f.storage.syntheticConcurrentKey, 'must-not-remove');
  assert.equal(f.calls.removes.length, 0);
  assert.ok(f.calls.writes.every(payload => !Object.hasOwn(payload, 'ftNanahTrustedLinks') && !Object.hasOwn(payload, 'ftNanahManagedSigningKeyPair')));
});
