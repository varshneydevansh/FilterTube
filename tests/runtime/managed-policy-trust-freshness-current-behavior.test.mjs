import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const adapterSource = fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function section(a, b) { const i = tab.indexOf(a), j = tab.indexOf(b, i); assert.ok(i > 0 && j > i, a); return tab.slice(i, j); }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

async function fixture() {
  let profiles = { schemaVersion: 4, activeProfileId: 'child', profiles: {
    'local-parent': { type: 'account' },
    child: { type: 'child', parentProfileId: 'local-parent', main: { keywords: [] }, settings: {} }
  } };
  let persisted = [];
  let storageFailure = false;
  let readHook = null;
  const writes = [], receipts = [];
  const sandbox = {
    crypto: webcrypto, TextEncoder, Uint8Array, atob, btoa,
    FilterTubeIO: { exportV3: async () => ({}), importV3: async () => ({}),
      loadProfilesV4: async () => { await readHook?.(); return profiles; },
      saveProfilesV4: async next => { writes.push(clone(next)); profiles = next; return { ok: true }; } }
  };
  sandbox.window = sandbox;
  vm.runInNewContext(adapterSource, sandbox);
  const adapter = sandbox.FilterTubeNanahAdapter;
  const keys = await adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'pinned-parent-key', keyVersion: 1 });
  const rawLink = {
    linkId: 'link', linkType: 'managed_link', remoteDeviceId: 'source-device', localRole: 'replica', remoteRole: 'source',
    sourceProfileId: 'remote-parent', sourceDeviceId: 'source-device', sourcePublicKeyId: keys.sourcePublicKeyId,
    sourcePublicKeyJwk: keys.sourcePublicKeyJwk, keyVersion: 1, localParentProfileId: 'local-parent',
    policy: { targetProfileId: 'child', targetProfileBehavior: 'fixed_profile', allowedScopes: ['keywords'] }
  };
  persisted = [clone(rawLink)];
  Object.assign(sandbox, {
    profilesV4Cache: profiles, nanahTrustedLinks: [clone(rawLink)], nanahStableDeviceId: 'receiver-device', NANAH_TRUSTED_LINKS_KEY: 'ftNanahTrustedLinks',
    normalizeString: x => typeof x === 'string' ? x.trim() : '', safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, safeArray: x => Array.isArray(x) ? x : [],
    normalizeNonNegativeInteger: x => Number.isInteger(Number(x)) && Number(x) >= 0 ? Number(x) : null,
    normalizeNanahTrustedLink: x => x ? { ...x, policy: { ...x.policy } } : null,
    findNanahTrustedLinkForManagedEnvelope: () => sandbox.nanahTrustedLinks[0] || null,
    getNanahManagedPolicyScopeList: x => x || [], getManagedNanahPolicyAcceptedState: () => null, getNanahManagedDuplicateDeviceIds: () => [],
    readNanahStorage: async () => { if (storageFailure) throw new Error('synthetic storage failure'); return clone(persisted); },
    recordManagedNanahPolicyValidationHistory: async () => {}, sendNanahManagedLivePolicyAck: async (_, decision) => { receipts.push(clone(decision)); },
    refreshFilterTubeUiAfterNanahImport: async () => {}, UIComponents: { showToast() {} }, tabViewUiText: (_, fallback) => fallback, formatManagedNanahBlockedReason: x => x
  });
  vm.runInNewContext([
    section('    function buildNanahManagedValidationTrustedLink(', '    function getNanahManagedDuplicateDeviceIds('),
    section('    function buildManagedNanahPolicyValidationContext(', '    function summarizeManagedNanahPolicyEnvelope('),
    section('    async function handleNanahIncomingManagedPolicyEnvelope(', '    async function handleNanahIncomingManagedMailboxItem(')
  ].join('\n'), sandbox);
  const unsigned = { type: 'filtertube_managed_policy', linkId: 'link', scope: 'keywords', targetProfileId: 'child', sourceProfileId: 'remote-parent',
    sourceDeviceId: 'source-device', targetDeviceId: 'receiver-device', revision: 1, sourcePublicKeyId: keys.sourcePublicKeyId, keyVersion: 1,
    payload: { scope: 'keywords', surface: 'main', operations: [{ op: 'add_keyword', value: 'approved-rule' }] } };
  unsigned.policyHash = adapter.buildManagedPolicyPayloadHash(unsigned);
  const envelope = await adapter.signManagedPolicyEnvelope(unsigned, keys.privateKeyJwk);
  const verificationStarted = deferred(), verificationGate = deferred();
  const verify = adapter.verifyManagedNanahPolicyIntegritySignature;
  adapter.verifyManagedNanahPolicyIntegritySignature = async (...args) => {
    const result = await verify(...args);
    assert.equal(result.verified, true);
    verificationStarted.resolve();
    await verificationGate.promise;
    return result;
  };
  return {
    sandbox, adapter, envelope, writes, receipts,
    get profiles() { return profiles; }, get memory() { return sandbox.nanahTrustedLinks; }, get persisted() { return persisted; },
    removeMemory: () => { sandbox.nanahTrustedLinks = []; }, removePersisted: () => { persisted = []; },
    failStorage: () => { storageFailure = true; }, setReadHook: hook => { readHook = hook; },
    async duringVerification(change) {
      const pending = sandbox.handleNanahIncomingManagedPolicyEnvelope(envelope);
      await verificationStarted.promise;
      await change?.();
      verificationGate.resolve();
      await pending;
    }
  };
}

test('an unchanged cryptographically pinned parent update still applies', async () => {
  const f = await fixture();
  await f.duringVerification();
  assert.equal(f.writes.length, 1);
  assert.equal(f.receipts[0].accepted, true);
  assert.equal(f.profiles.profiles.child.main.keywords[0].word, 'approved-rule');
});

for (const [name, change] of [
  ['removed in memory and storage', f => { f.removeMemory(); f.removePersisted(); }],
  ['removed in memory before storage persistence', f => { f.removeMemory(); }],
  ['removed from storage while memory is stale', f => { f.removePersisted(); }],
  ['revoked', f => { for (const link of [...f.memory, ...f.persisted]) link.revoked = true; }],
  ['key revoked', f => { for (const link of [...f.memory, ...f.persisted]) link.keyRevoked = true; }],
  ['allowed scope removed', f => { for (const link of [...f.memory, ...f.persisted]) link.policy.allowedScopes = ['main']; }],
  ['fixed target changed', f => { for (const link of [...f.memory, ...f.persisted]) link.policy.targetProfileId = 'other-child'; }],
  ['source parent identity changed', f => { for (const link of [...f.memory, ...f.persisted]) link.sourceProfileId = 'other-parent'; }],
  ['key version changed', f => { for (const link of [...f.memory, ...f.persisted]) link.keyVersion = 2; }]
]) {
  test(`a link ${name} during real signature verification cannot apply`, async () => {
    const f = await fixture();
    await f.duringVerification(() => change(f));
    assert.equal(f.writes.length, 0);
    assert.equal(f.receipts[0].accepted, false);
    assert.equal(f.profiles.profiles.child.main.keywords.length, 0);
  });
}

test('changed signing material under the same public-key ID cannot reuse earlier signature verification', async () => {
  const f = await fixture();
  const replacement = await f.adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'pinned-parent-key', keyVersion: 1 });
  await f.duringVerification(() => {
    // Mutate the existing nested objects, exercising initial deep key snapshotting.
    for (const link of [...f.memory, ...f.persisted]) Object.assign(link.sourcePublicKeyJwk, replacement.sourcePublicKeyJwk);
  });
  assert.equal(f.writes.length, 0);
  assert.equal(f.receipts[0].reason, 'wrong_public_key');
});

test('trust changes during the final profiles await are checked synchronously before writing', async () => {
  const f = await fixture();
  await f.duringVerification(() => { f.setReadHook(async () => { f.removeMemory(); }); });
  assert.equal(f.writes.length, 0);
  assert.equal(f.receipts[0].accepted, false);
});

test('fresh trust storage failure refuses the pending update', async () => {
  const f = await fixture();
  await f.duringVerification(() => f.failStorage());
  assert.equal(f.writes.length, 0);
  assert.equal(f.receipts[0].accepted, false);
});

test('the adapter fails closed when the fresh trust callback throws or returns no context', async () => {
  for (const loadFreshManagedValidationContext of [async () => { throw new Error('synthetic failure'); }, async () => null]) {
    const f = await fixture();
    const context = f.sandbox.buildManagedNanahPolicyValidationContext(f.envelope, f.profiles);
    context.signatureVerified = true;
    context.loadFreshManagedValidationContext = loadFreshManagedValidationContext;
    const result = await f.adapter.applyManagedPolicyEnvelope(f.envelope, context);
    assert.equal(result.accepted, false);
    assert.equal(f.writes.length, 0);
  }
});
