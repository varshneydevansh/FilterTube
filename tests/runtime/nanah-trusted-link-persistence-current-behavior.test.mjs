import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Reuse the real two-peer/Ed25519/IO fixture without registering its tests.
const fixtureUrl = new URL('./nanah-managed-shared-link-handshake-current-behavior.test.mjs', import.meta.url);
let fixture = fs.readFileSync(fixtureUrl, 'utf8').split("test('production first Apply+Save")[0];
fixture = fixture.replace("'./helpers/nanah-storage-lock-fixture.mjs'", JSON.stringify(new URL('./helpers/nanah-storage-lock-fixture.mjs', import.meta.url).href));
fixture = fixture.replace('new URL(`../../js/${name}.js`, import.meta.url)', `new URL(\`${new URL('../../js/', import.meta.url).href}\${name}.js\`)`);
const { setup, peer } = await import(`data:text/javascript;base64,${Buffer.from(`${fixture}\nexport { setup, peer };`).toString('base64')}`);
const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
function section(a, b) { const i = tab.indexOf(a), j = tab.indexOf(b, i); assert.ok(i > 0 && j > i); return tab.slice(i, j); }
function extra(peer) {
  vm.runInContext([
    section('    async function loadNanahTrustedLinks(', '    async function persistNanahTrustedLinks('),
    section('    async function removeNanahTrustedLink(', '    function isActiveNanahSourceManagedLink('),
    section('    async function markNanahTrustedLinkUsed(', '    async function loadNanahManagedOpenSyncState('),
    section('    function isActiveNanahSourceManagedLink(', '    async function updateNanahTrustedLinkPolicy(')
  ].join('\n'), peer.box);
  peer.purges = [];
  for (const fn of ['purgeNanahManagedMailboxQueueForTrustedLink', 'purgeNanahManagedLocalNetworkQueueForTrustedLink',
    'purgeNanahManagedPolicyStateForTrustedLink', 'purgeNanahManagedOpenSyncStateForTrustedLink',
    'purgeNanahManagedLocalNetworkSyncStateForTrustedLink', 'purgeNanahManagedSourceAckSyncStateForTrustedLink']) {
    peer.box[fn] = async () => { peer.purges.push({ fn, stored: clone(peer.storage.ftNanahTrustedLinks) }); return {}; };
  }
}
function failWrites(peer, mode = 'callback', key = 'ftNanahTrustedLinks') {
  const original = peer.box.chrome.storage.local.set;
  peer.box.chrome.storage.local.set = (payload, done) => {
    if (!Object.hasOwn(payload, key)) return original(payload, done);
    if (mode === 'promise') return Promise.reject(new Error('synthetic rejected write'));
    peer.box.chrome.runtime.lastError = { message: 'synthetic quota failure' };
    done?.(); peer.box.chrome.runtime.lastError = null;
  };
  return () => { peer.box.chrome.storage.local.set = original; };
}
async function saved() {
  const f = await setup();
  const { envelope } = await f.prepareFirst();
  await f.receiver.box.handleNanahIncomingProposal(envelope);
  extra(f.source); extra(f.receiver);
  return f;
}
const entry = id => ({ linkId: id, remoteDeviceId: `remote-${id}`, localRole: 'peer', remoteRole: 'peer', linkType: 'peer_link', policy: {} });

for (const mode of ['callback', 'promise']) {
  test(`real first receiver save ${mode} failure emits no saved-link ACK or source grant`, async () => {
    const f = await setup(); failWrites(f.receiver, mode);
    const { envelope } = await f.prepareFirst();
    await assert.rejects(f.receiver.box.handleNanahIncomingProposal(envelope), /could not be saved/);
    assert.equal(f.receiver.box.nanahTrustedLinks.length, 0);
    assert.equal(f.receiver.storage.ftNanahTrustedLinks.length, 0);
    assert.equal(f.source.storage.ftNanahTrustedLinks.length, 0);
    assert.ok(!f.receiver.calls.decisions?.some(row => row.savedManagedLink));
    assert.ok(!f.receiver.calls.toasts.some(row => row[1] === 'success'));
  });
}

test('actual source handover failure and manual trust failure never publish local trust', async () => {
  const f = await setup(); failWrites(f.source);
  const { envelope } = await f.prepareFirst();
  await assert.rejects(f.receiver.box.handleNanahIncomingProposal(envelope), /could not be saved/);
  assert.equal(f.receiver.storage.ftNanahTrustedLinks.length, 1, 'receiver approval remains its independent durable consent');
  assert.equal(f.source.storage.ftNanahTrustedLinks.length, 0);
  assert.equal(f.source.box.nanahTrustedLinks.length, 0);
  assert.ok(!f.source.calls.toasts.some(row => row[1] === 'success'));
  const m = await setup(); failWrites(m.source);
  await assert.rejects(m.source.box.trustConnectedNanahDevice(), /could not be saved/);
  assert.equal(m.source.box.nanahTrustedLinks.length, 0);
  assert.ok(!m.source.calls.toasts.some(row => row[1] === 'success'));
});

test('failed removal denies only that link, survives load, preserves stored receipts and performs zero purges', async () => {
  const f = await saved(), r = f.receiver, id = r.box.nanahTrustedLinks[0].linkId;
  const before = clone(r.storage.ftNanahTrustedLinks);
  failWrites(r);
  await assert.rejects(r.box.removeNanahTrustedLink(id), /could not be saved/);
  assert.deepEqual(r.storage.ftNanahTrustedLinks, before);
  assert.equal(r.purges.length, 0);
  assert.equal(r.box.nanahTrustedLinks[0].revoked, true);
  await r.box.loadNanahTrustedLinks();
  assert.equal(r.box.nanahTrustedLinks[0].revoked, true);
  const writes = r.calls.profileWrites;
  await f.repeat();
  assert.equal(r.calls.profileWrites, writes, 'signed auto-update cannot revive the page-denied link');
  assert.ok(r.calls.receipts.some(row => row.accepted === false));
});

test('successful removal persists before every destructive cleanup and leaves unrelated link unchanged', async () => {
  const f = await saved(), r = f.receiver, id = r.box.nanahTrustedLinks[0].linkId;
  await r.box.saveNanahTrustedLink(entry('unrelated'));
  await r.box.removeNanahTrustedLink(id);
  assert.equal(r.purges.length, 5);
  assert.ok(r.purges.every(call => call.stored.every(row => row.linkId !== id)));
  assert.deepEqual(r.storage.ftNanahTrustedLinks.map(x => x.linkId), ['unrelated']);
});

test('failed usage, source mapping, sent-state and ACK writes preserve the last committed rows', async () => {
  const f = await saved(), s = f.source, id = s.box.nanahTrustedLinks[0].linkId;
  const before = clone(s.storage.ftNanahTrustedLinks);
  failWrites(s);
  await assert.rejects(s.box.markNanahTrustedLinkUsed(s.box.nanahTrustedLinks[0].remoteDeviceId), /could not be saved/);
  await assert.rejects(s.box.updateNanahTrustedLinkPolicy(id, { localPolicyProfileId: 'other-child' }), /could not be saved/);
  await assert.rejects(f.helpers.markSent(id, 'kids', 1, 'policy-hash'), /could not be saved/);
  assert.deepEqual(clone(s.box.nanahTrustedLinks), before);
  assert.deepEqual(s.storage.ftNanahTrustedLinks, before);
});

test('early live ACK is not drained into Applied if actual sent-state persistence fails', async () => {
  const f = await saved(), s = f.source;
  const [envelope] = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, s.box.nanahTrustedLinks);
  failWrites(s);
  await assert.rejects(f.helpers.sendLiveEnvelope(envelope, async sent => {
    const result = await f.helpers.recordLiveAckPayload({ schema: 'filtertube_nanah_managed_live_ack', linkId: sent.linkId,
      sourceDeviceId: sent.sourceDeviceId, sourceProfileId: sent.sourceProfileId,
      targetDeviceId: sent.targetDeviceId, targetProfileId: sent.targetProfileId,
      records: [{ scope: sent.scope, revision: sent.revision, policyHash: sent.policyHash, result: 'accepted', ackState: 'applied' }] });
    assert.equal(result.queuedCount, 1);
  }), /could not be saved/);
  const p = s.box.nanahTrustedLinks[0].policy;
  assert.ok(!p.outgoingManagedPolicies?.kids?.lastAckResult);
  assert.ok(!p.inboundManagedAckHistory?.length);
});

test('failed queued save does not roll back a later successful candidate; caller intent is detached', async () => {
  const p = await peer('local', 'parent', 'child', 'source'); extra(p);
  const original = p.box.chrome.storage.local.set;
  let release, started;
  const began = new Promise(resolve => { started = resolve; });
  p.box.chrome.storage.local.set = (payload, done) => {
    if (!Object.hasOwn(payload, 'ftNanahTrustedLinks')) return original(payload, done);
    p.box.chrome.storage.local.set = original; started();
    release = () => { p.box.chrome.runtime.lastError = { message: 'synthetic fail' }; done(); p.box.chrome.runtime.lastError = null; };
  };
  const a = p.box.saveNanahTrustedLink(entry('A')); const rejection = assert.rejects(a, /could not be saved/);
  await began;
  const proposed = entry('B'); const b = p.box.saveNanahTrustedLink(proposed); proposed.remoteDeviceId = 'mutated-foreign-peer';
  release(); await rejection; await b;
  assert.deepEqual(p.storage.ftNanahTrustedLinks.map(row => row.linkId), ['B']);
  assert.equal(p.box.nanahTrustedLinks[0].remoteDeviceId, 'remote-B');
});

test('queued beforeSave checks run after the wait, and removal during approval or storage never returns Saved', async () => {
  for (const phase of ['approval', 'write']) {
    const p = await peer('local', 'parent', 'child', 'source'); extra(p);
    let release, started; const began = new Promise(resolve => { started = resolve; });
    const original = p.box.chrome.storage.local.set;
    if (phase === 'write') p.box.chrome.storage.local.set = (payload, done) => {
      if (!payload.ftNanahTrustedLinks) return original(payload, done);
      p.box.chrome.storage.local.set = original; started(); release = () => original(payload, done);
    };
    const pending = p.box.saveNanahTrustedLink(entry('race'), { beforeSave: async () => {
      if (phase === 'approval') { started(); await new Promise(resolve => { release = resolve; }); }
      return true;
    } });
    const rejected = assert.rejects(pending, /revoked/); await began;
    const removal = p.box.removeNanahTrustedLink('race'); release(); await rejected; await removal;
    assert.equal(p.storage.ftNanahTrustedLinks.length, 0);
    assert.equal(p.box.nanahTrustedLinks.length, 0);
  }
});

test('checked initial/load read failures preserve committed rows and block writes until readable', async () => {
  const p = await peer('local', 'parent', 'child', 'source'); extra(p);
  p.storage.ftNanahTrustedLinks = [entry('existing')];
  const original = p.box.chrome.storage.local.get;
  p.box.chrome.storage.local.get = (_, done) => { p.box.chrome.runtime.lastError = { message: 'synthetic read failure' }; done({}); p.box.chrome.runtime.lastError = null; };
  await assert.rejects(p.box.saveNanahTrustedLink(entry('new')), /could not be read/);
  assert.equal(p.calls.trustWrites, 0);
  p.box.chrome.storage.local.get = original; await p.box.loadNanahTrustedLinks();
  p.box.chrome.storage.local.get = () => Promise.reject(new Error('synthetic read rejection'));
  await assert.rejects(p.box.loadNanahTrustedLinks(), /synthetic read rejection/);
  assert.deepEqual(p.box.nanahTrustedLinks.map(row => row.linkId), ['existing']);
  assert.equal(p.box.getNanahTrustedLinkMutationState().loaded, false);
  await assert.rejects(p.box.saveNanahTrustedLink(entry('after-read-error')), /synthetic read rejection/);
  assert.equal(p.calls.trustWrites, 0, 'a failed reload cannot leave stale rows eligible for a write');
  p.storage.ftNanahTrustedLinks.push(entry('external-row'));
  p.box.chrome.storage.local.get = original;
  await p.box.saveNanahTrustedLink(entry('after-recovery'));
  assert.deepEqual(p.storage.ftNanahTrustedLinks.map(row => row.linkId).sort(), ['after-recovery', 'existing', 'external-row']);
});

test('rotation persists revocation before key writes; partial key storage rejects without cleanup or false completion', async () => {
  const f = await saved(), p = f.source;
  Object.assign(p.box, { confirm: () => true, NANAH_MANAGED_SIGNING_KEYPAIR_KEY: 'pair-key',
    NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY: 'public-key', refreshProfilesUI: async () => {},
    recordManagedSigningKeyRotationHistoryForLink: async () => {}, recordManagedAdminAuthFailureHistory: async () => {} });
  vm.runInContext(section('    function normalizeNanahManagedSigningPublicDescriptor(', '    async function loadNanahTrustedLinks('), p.box);
  p.calls.toasts.length = 0;
  p.storage['pair-key'] = clone(f.keys);
  failWrites(p, 'promise', 'public-key');
  await assert.rejects(p.box.rotateNanahManagedSourceSigningKey(), /Rotation is incomplete/);
  assert.equal(p.storage.ftNanahTrustedLinks[0].keyRevoked, true);
  assert.equal(p.box.nanahTrustedLinks[0].revoked, true);
  assert.equal(p.purges.length, 0);
  assert.ok(p.storage['pair-key'].managedKeyVersion > f.keys.managedKeyVersion, 'new private key is not silently rolled back');
  assert.ok(!p.calls.toasts.some(row => row[1] === 'success'));
});

test('a failed actual receipt update cannot turn durable Sent into Applied', async () => {
  const f = await saved(), s = f.source;
  const [sent] = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, s.box.nanahTrustedLinks);
  await f.helpers.markSent(sent.linkId, sent.scope, sent.revision, sent.policyHash);
  const before = clone(s.storage.ftNanahTrustedLinks);
  failWrites(s);
  await assert.rejects(f.helpers.recordLiveAckPayload({ schema: 'filtertube_nanah_managed_live_ack', linkId: sent.linkId,
    sourceDeviceId: sent.sourceDeviceId, sourceProfileId: sent.sourceProfileId,
    targetDeviceId: sent.targetDeviceId, targetProfileId: sent.targetProfileId,
    records: [{ scope: sent.scope, revision: sent.revision, policyHash: sent.policyHash, result: 'accepted', ackState: 'applied' }] }), /could not be saved/);
  assert.deepEqual(clone(s.box.nanahTrustedLinks), before);
  assert.deepEqual(s.storage.ftNanahTrustedLinks, before);
});

test('a load queued during a pending commit observes that commit rather than restoring an older row set', async () => {
  const p = await peer('local', 'parent', 'child', 'source'); extra(p);
  const original = p.box.chrome.storage.local.set;
  let release, started; const began = new Promise(resolve => { started = resolve; });
  p.box.chrome.storage.local.set = (payload, done) => {
    if (!payload.ftNanahTrustedLinks) return original(payload, done);
    p.box.chrome.storage.local.set = original; started(); release = () => original(payload, done);
  };
  const save = p.box.saveNanahTrustedLink(entry('new')); await began;
  const load = p.box.loadNanahTrustedLinks(); release(); await save; await load;
  assert.deepEqual(p.box.nanahTrustedLinks.map(x => x.linkId), ['new']);
});

test('actual first-save authorization rechecks actor, owner, PIN and session after a queued write', async () => {
  for (const changed of ['actor', 'owner', 'PIN', 'session']) {
    const f = await setup(), p = f.receiver; extra(p);
    const original = p.box.chrome.storage.local.set;
    let release, started; const began = new Promise(resolve => { started = resolve; });
    p.box.chrome.storage.local.set = (payload, done) => {
      if (!payload.ftNanahTrustedLinks) return original(payload, done);
      p.box.chrome.storage.local.set = original; started(); release = () => original(payload, done);
    };
    const first = p.box.saveNanahTrustedLink(entry('unrelated')); await began;
    const { envelope } = await f.prepareFirst();
    let reached; const queued = new Promise(resolve => { reached = resolve; });
    const save = p.box.saveNanahTrustedLink;
    p.box.saveNanahTrustedLink = (...args) => { const result = save(...args); reached(); return result; };
    const incoming = p.box.handleNanahIncomingProposal(envelope);
    const denied = assert.rejects(incoming, /profile or paired device changed/);
    await queued;
    if (changed === 'actor') p.storage.ftProfilesV4.activeProfileId = 'default';
    if (changed === 'owner') p.storage.ftProfilesV4.profiles[p.childId].parentProfileId = 'default';
    if (changed === 'PIN') p.storage.ftProfilesV4.profiles[p.parentId].security = { profilePinVerifier: { hash: 'replacement', salt: 'new' } };
    if (changed === 'session') p.box.nanahSessionState.sasConfirmed = false;
    release(); await first; await denied;
    assert.deepEqual(p.storage.ftNanahTrustedLinks.map(x => x.linkId), ['unrelated'], changed);
    assert.ok(!p.calls.decisions?.some(row => row.savedManagedLink), changed);
    assert.equal(p.calls.profileWrites, 0, changed);
  }
});

test('successful durable removal requires reload for re-pair; a fresh page can explicitly save the same canonical identity', async () => {
  const f = await saved(), p = f.receiver, row = clone(p.box.nanahTrustedLinks[0]);
  await p.box.removeNanahTrustedLink(row.linkId);
  await assert.rejects(p.box.saveNanahTrustedLink(row, { beforeSave: async () => true }), /Reload this page, then pair/);
  const fresh = await peer(p.box.nanahStableDeviceId, p.parentId, p.childId, 'replica');
  fresh.storage.ftNanahTrustedLinks = clone(p.storage.ftNanahTrustedLinks);
  extra(fresh); await fresh.box.loadNanahTrustedLinks();
  assert.equal(fresh.box.nanahTrustedLinks.length, 0);
  const restored = await fresh.box.saveNanahTrustedLink(row, { beforeSave: async () => true });
  assert.equal(restored.linkId, row.linkId);
  assert.equal(fresh.storage.ftNanahTrustedLinks.length, 1);
});

test('both actual source-mapping buttons do not publish a choice or dispatch a policy after durable write failure', async () => {
  let picker = fs.readFileSync(new URL('./family-device-picker-actions-current-behavior.test.mjs', import.meta.url), 'utf8').split("test('verified managed device")[0];
  picker = picker.replace("new URL('../../js/tab-view.js', import.meta.url)", `new URL('${new URL('../../js/tab-view.js', import.meta.url).href}')`);
  const { harness } = await import(`data:text/javascript;base64,${Buffer.from(`${picker}\nexport { harness };`).toString('base64')}`);
  const f = await saved(), p = f.source, row = clone(p.box.nanahTrustedLinks[0]);
  failWrites(p);
  const h = harness({ live: true, link: row });
  h.context.console = { warn() {} };
  h.context.nanahTrustedLinks = [row];
  h.context.nanahFamilyDeviceSelectedIntent.linkId = row.linkId;
  h.context.updateNanahTrustedLinkPolicy = p.box.updateNanahTrustedLinkPolicy;
  h.context.chooseNanahDevicePolicySource = async () => ({ profileId: 'different-source', profileName: 'Different rules' });
  const before = clone(p.storage.ftNanahTrustedLinks);
  await h.action.run();
  assert.equal(h.calls.sends.length, 0);
  let chooseAction;
  h.context.ftNanahDeviceSourceBtn = { addEventListener(_, fn) { chooseAction = fn; } };
  vm.runInNewContext(section("    ftNanahDeviceSourceBtn?.addEventListener('click'", '    if (ftNanahCompassLaterBtn)'), h.context);
  await chooseAction();
  assert.equal(h.calls.sends.length, 0);
  assert.deepEqual(clone(p.box.nanahTrustedLinks), before);
});

test('actual rotation rechecks actor and PIN after queue wait before revocation or key writes', async () => {
  for (const changed of ['actor', 'PIN']) {
    const f = await saved(), p = f.source;
    Object.assign(p.box, { confirm: () => true, NANAH_MANAGED_SIGNING_KEYPAIR_KEY: 'pair-key',
      normalizeNanahManagedSigningKeyPair: x => x, recordManagedAdminAuthFailureHistory: async () => {} });
    let keyWrites = 0; p.box.ensureNanahManagedSigningKeyPair = async () => { keyWrites++; return f.keys; };
    const original = p.box.chrome.storage.local.set;
    let release, started; const began = new Promise(resolve => { started = resolve; });
    p.box.chrome.storage.local.set = (payload, done) => {
      if (!payload.ftNanahTrustedLinks) return original(payload, done);
      p.box.chrome.storage.local.set = original; started(); release = () => original(payload, done);
    };
    const first = p.box.saveNanahTrustedLink(entry('unrelated')); await began;
    let reached; const queued = new Promise(resolve => { reached = resolve; });
    const commit = p.box.commitNanahTrustedLinkMutation;
    p.box.commitNanahTrustedLinkMutation = candidate => { reached(); return commit(candidate); };
    const rotation = p.box.rotateNanahManagedSourceSigningKey();
    const denied = assert.rejects(rotation, /parent profile or PIN changed/); await queued;
    if (changed === 'actor') p.storage.ftProfilesV4.activeProfileId = 'default';
    else p.storage.ftProfilesV4.profiles[p.parentId].security = { profilePinVerifier: { hash: 'replaced', salt: 'new' } };
    release(); await first; await denied;
    assert.equal(keyWrites, 0); assert.equal(p.purges.length, 0);
    assert.ok(p.storage.ftNanahTrustedLinks.every(row => !row.keyRevoked));
  }
});

test('rotation holds queued saves until key persistence completes, including partial failure', async () => {
  const f = await saved(), p = f.source;
  Object.assign(p.box, { confirm: () => true, NANAH_MANAGED_SIGNING_KEYPAIR_KEY: 'pair-key', normalizeNanahManagedSigningKeyPair: x => x,
    recordManagedAdminAuthFailureHistory: async () => {} });
  let release, started; const began = new Promise(resolve => { started = resolve; });
  p.box.ensureNanahManagedSigningKeyPair = async () => { started(); await new Promise(resolve => { release = resolve; }); return null; };
  const rotation = p.box.rotateNanahManagedSourceSigningKey();
  const failed = assert.rejects(rotation, /Rotation is incomplete/); await began;
  let savedOther = false;
  const other = p.box.saveNanahTrustedLink(entry('new-unrelated')).then(() => { savedOther = true; });
  await Promise.resolve(); assert.equal(savedOther, false);
  release(); await failed; await other;
  assert.equal(p.storage.ftNanahTrustedLinks.find(row => row.linkId === 'new-unrelated').remoteDeviceId, 'remote-new-unrelated');
  assert.ok(p.storage.ftNanahTrustedLinks.find(row => row.linkType === 'managed_link').keyRevoked);
});

test('actual concurrent Main and Kids markSent retain both scopes, history rows and unrelated policy settings', async () => {
  const f = await saved(), p = f.source, id = p.box.nanahTrustedLinks[0].linkId;
  await Promise.all([
    f.helpers.markSent(id, 'main', 1, 'main-policy'),
    f.helpers.markSent(id, 'kids', 1, 'kids-policy'),
    p.box.updateNanahTrustedLinkPolicy(id, { policy: { syncOnProfileOpen: true } })
  ]);
  const policy = p.storage.ftNanahTrustedLinks[0].policy;
  assert.deepEqual(Object.keys(policy.outgoingManagedPolicies).sort(), ['kids', 'main']);
  assert.deepEqual(policy.outboundManagedPolicyHistory.map(row => row.scope).sort(), ['kids', 'main']);
  assert.equal(policy.syncOnProfileOpen, true);
});

test('a queued same-scope markSent cannot erase a newer committed actual ACK', async () => {
  const f = await saved(), p = f.source;
  const [sent] = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, p.box.nanahTrustedLinks);
  await f.helpers.markSent(sent.linkId, sent.scope, sent.revision, sent.policyHash);
  const original = p.box.chrome.storage.local.set;
  let release, started; const began = new Promise(resolve => { started = resolve; });
  p.box.chrome.storage.local.set = (payload, done) => {
    if (!payload.ftNanahTrustedLinks) return original(payload, done);
    p.box.chrome.storage.local.set = original; started(); release = () => original(payload, done);
  };
  const ack = f.helpers.recordLiveAckPayload({ schema: 'filtertube_nanah_managed_live_ack', linkId: sent.linkId,
    sourceDeviceId: sent.sourceDeviceId, sourceProfileId: sent.sourceProfileId,
    targetDeviceId: sent.targetDeviceId, targetProfileId: sent.targetProfileId,
    records: [{ scope: sent.scope, revision: sent.revision, policyHash: sent.policyHash, result: 'accepted', ackState: 'applied' }] });
  await began;
  const conflicting = f.helpers.markSent(sent.linkId, sent.scope, sent.revision + 1, 'new-policy');
  const denied = assert.rejects(conflicting, /newer update or receipt/);
  release(); assert.equal((await ack).recordedCount, 1); await denied;
  const policy = p.storage.ftNanahTrustedLinks[0].policy;
  assert.equal(policy.outgoingManagedPolicies.kids.revision, sent.revision);
  assert.equal(policy.outgoingManagedPolicies.kids.lastAckResult, 'accepted');
  assert.equal(policy.inboundManagedAckHistory.length, 1);
  assert.equal(policy.outboundManagedPolicyHistory.length, 1);
});

async function secondReceiverPage(pageA) {
  const pageB = await peer(pageA.box.nanahStableDeviceId, pageA.parentId, pageA.childId, 'replica');
  extra(pageB);
  // Distinct page globals/queues, one extension's actual storage boundary.
  // Keep the original namespace object used by the real IO/settings modules.
  for (const method of ['get', 'set', 'remove', 'getBytesInUse']) {
    pageB.box.chrome.storage.local[method] = (...args) => pageA.box.chrome.storage.local[method](...args);
  }
  pageB.box.chrome.runtime = pageA.box.chrome.runtime;
  installNanahStorageLock(pageB.box, { locks: pageA.box.navigator.locks });
  await pageB.box.loadNanahTrustedLinks();
  return pageB;
}

test('a second loaded page cannot resurrect a removed parent grant through usage or an unrelated mutation', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const grant = clone(pageA.box.nanahTrustedLinks[0]);
  await pageA.box.removeNanahTrustedLink(grant.linkId);
  assert.equal(pageA.storage.ftNanahTrustedLinks.length, 0);
  assert.equal(pageB.box.nanahTrustedLinks[0].linkId, grant.linkId, 'second page genuinely starts with the stale grant');
  assert.equal(await pageB.box.markNanahTrustedLinkUsed(grant.remoteDeviceId, { linkId: grant.linkId, exactMatch: true }), false);
  await pageB.box.saveNanahTrustedLink(entry('second-page-new-link'));
  assert.deepEqual(pageA.storage.ftNanahTrustedLinks.map(row => row.linkId), ['second-page-new-link']);
  assert.ok(!pageB.box.nanahTrustedLinks.some(row => row.linkId === grant.linkId));
});

test('a previously loaded second page preserves another page\'s newly committed unrelated row', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const grantId = pageA.box.nanahTrustedLinks[0].linkId;
  await pageA.box.saveNanahTrustedLink(entry('first-page-added'));
  assert.ok(!pageB.box.nanahTrustedLinks.some(row => row.linkId === 'first-page-added'));
  await pageB.box.updateNanahTrustedLinkPolicy(grantId, { policy: { syncOnProfileOpen: true } });
  assert.deepEqual(pageA.storage.ftNanahTrustedLinks.map(row => row.linkId).sort(), ['first-page-added', grantId].sort());
  assert.equal(pageA.storage.ftNanahTrustedLinks.find(row => row.linkId === grantId).policy.syncOnProfileOpen, true);
});

test('a loaded second page cannot write stale rows after a fresh storage read fails', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const grantId = pageA.box.nanahTrustedLinks[0].linkId;
  await pageA.box.removeNanahTrustedLink(grantId);
  await pageA.box.saveNanahTrustedLink(entry('first-page-current'));
  const current = clone(pageA.storage.ftNanahTrustedLinks), writes = pageA.calls.trustWrites;
  const originalGet = pageA.box.chrome.storage.local.get;
  pageA.box.chrome.storage.local.get = () => Promise.reject(new Error('shared storage unavailable'));
  await assert.rejects(pageB.box.saveNanahTrustedLink(entry('second-page-attempt')), /shared storage unavailable/);
  assert.equal(pageA.calls.trustWrites, writes);
  assert.deepEqual(pageA.storage.ftNanahTrustedLinks, current);
  assert.equal(pageB.box.getNanahTrustedLinkMutationState().loaded, false);
  pageA.box.chrome.storage.local.get = originalGet;
  await pageB.box.saveNanahTrustedLink(entry('second-page-recovered'));
  assert.deepEqual(pageA.storage.ftNanahTrustedLinks.map(row => row.linkId).sort(), ['first-page-current', 'second-page-recovered']);
});


function holdNextTrustWrite(page) {
  const original = page.box.chrome.storage.local.set;
  let release, started;
  const began = new Promise(resolve => { started = resolve; });
  page.box.chrome.storage.local.set = (payload, done) => {
    if (!Object.hasOwn(payload, 'ftNanahTrustedLinks')) return original(payload, done);
    page.box.chrome.storage.local.set = original;
    started(); release = () => original(payload, done);
  };
  return { began, release: () => { assert.ok(release); release(); } };
}

test('overlapping second-page update cannot complete after another page reports a durable removal', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const grantId = pageA.box.nanahTrustedLinks[0].linkId;
  const held = holdNextTrustWrite(pageA);
  const update = pageB.box.updateNanahTrustedLinkPolicy(grantId, { policy: { syncOnProfileOpen: true } });
  await held.began;
  let removed = false;
  const removal = pageA.box.removeNanahTrustedLink(grantId).then(() => { removed = true; });
  for (let i = 0; i < 24; i++) await Promise.resolve();
  assert.equal(removed, false, "Remove must wait for the other page's held commit");
  assert.ok(pageA.storage.ftNanahTrustedLinks.some(row => row.linkId === grantId));
  held.release(); await update; await removal;
  assert.equal(removed, true);
  assert.equal(pageA.storage.ftNanahTrustedLinks.length, 0);
  assert.equal(await pageB.box.markNanahTrustedLinkUsed(f.source.box.nanahStableDeviceId, { linkId: grantId, exactMatch: true }), false);
  assert.equal(pageA.storage.ftNanahTrustedLinks.length, 0);
});

test('overlapping adds from two real page contexts preserve both committed rows', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const grantId = pageA.box.nanahTrustedLinks[0].linkId;
  const held = holdNextTrustWrite(pageA);
  const first = pageB.box.saveNanahTrustedLink(entry('overlapping-first')); await held.began;
  const second = pageA.box.saveNanahTrustedLink(entry('overlapping-second'));
  held.release(); await first; await second;
  assert.deepEqual(pageA.storage.ftNanahTrustedLinks.map(row => row.linkId).sort(), [grantId, 'overlapping-first', 'overlapping-second'].sort());
});

test('fresh authorization runs after the cross-page lock wait and refuses a changed actor', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  const authorization = pageB.box.captureProfileMutationAuthorization(pageA.storage.ftProfilesV4, pageA.childId, pageA.childId);
  const held = holdNextTrustWrite(pageA);
  const first = pageA.box.saveNanahTrustedLink(entry('cross-page-blocker')); await held.began;
  let checked = false;
  const pending = pageB.box.saveNanahTrustedLink(entry('stale-authority'), { beforeSave: async () => {
    checked = true;
    return !!await pageB.box.loadAuthorizedNanahReceiverTrustRoot(pageB.box.FilterTubeIO, {
      actorType: 'child', actor: authorization,
      approving: pageB.box.captureProfileMutationAuthorization(pageA.storage.ftProfilesV4, pageA.childId, pageA.parentId)
    });
  } });
  const rejected = assert.rejects(pending, /profile or paired device changed/);
  for (let i = 0; i < 16; i++) await Promise.resolve();
  assert.equal(checked, false);
  pageA.storage.ftProfilesV4.activeProfileId = 'default';
  held.release(); await first; await rejected;
  assert.ok(!pageA.storage.ftNanahTrustedLinks.some(row => row.linkId === 'stale-authority'));
});

function actualSigning(page) {
  Object.assign(page.box, { NANAH_MANAGED_SIGNING_KEYPAIR_KEY: 'actual-pair-key', NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY: 'actual-public-key' });
  vm.runInContext(section('    function normalizeNanahManagedSigningPublicDescriptor(', '    async function loadNanahTrustedLinks('), page.box);
}

test('two pages provisioning a signing key share one durable pair instead of overwriting each other', async () => {
  const f = await saved(), pageA = f.receiver, pageB = await secondReceiverPage(pageA);
  actualSigning(pageA); actualSigning(pageB);
  let generated = 0;
  for (const page of [pageA, pageB]) {
    const create = page.box.FilterTubeNanahAdapter.createManagedNanahSigningKeyPair;
    page.box.FilterTubeNanahAdapter.createManagedNanahSigningKeyPair = async options => { generated++; return create(options); };
  }
  const [first, second] = await Promise.all([pageA.box.ensureNanahManagedSigningKeyPair({ required: true }), pageB.box.ensureNanahManagedSigningKeyPair({ required: true })]);
  assert.equal(generated, 1);
  assert.equal(first.sourcePublicKeyId, second.sourcePublicKeyId);
  assert.equal(pageA.storage['actual-pair-key'].sourcePublicKeyId, first.sourcePublicKeyId);
  assert.equal(pageA.storage['actual-public-key'].sourcePublicKeyId, first.sourcePublicKeyId);
});

test('a failed checked signing-key read cannot be mistaken for absence or generate a new key', async () => {
  const f = await saved(), page = f.receiver;
  actualSigning(page);
  const stored = await page.box.ensureNanahManagedSigningKeyPair({ required: true });
  const before = clone(page.storage), get = page.box.chrome.storage.local.get;
  let generated = 0;
  page.box.FilterTubeNanahAdapter.createManagedNanahSigningKeyPair = async () => { generated++; return null; };
  page.box.chrome.storage.local.get = (keys, done) => keys.includes('actual-pair-key')
    ? Promise.reject(new Error('signing storage unavailable')) : get(keys, done);
  await assert.rejects(page.box.ensureNanahManagedSigningKeyPair({ required: true }), /signing storage unavailable/);
  assert.equal(generated, 0);
  assert.deepEqual(page.storage, before);
  assert.equal(page.box.nanahManagedSigningKeyDescriptor.sourcePublicKeyId, stored.sourcePublicKeyId);
});
