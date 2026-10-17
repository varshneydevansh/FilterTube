import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const runtime = fs.readFileSync(new URL('../../js/nanah_managed_live_policy.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function profile(name) {
  return {
    settings: { allowMainViewing: true, allowKidsViewing: true, timeLimitPolicy: { enabled: true, timezone: 'UTC', dailyBudgetSeconds: 1800 } },
    main: { mode: 'blocklist', keywords: [{ word: `${name}-main`, dateFilter: { after: '2026-01-01' } }] },
    kids: { mode: 'blocklist', blockedKeywords: [{ word: `${name}-kids` }] }
  };
}
function fixture() {
  const box = { window: {} };
  vm.runInNewContext(runtime, box);
  const current = { source: { profileId: 'source-a', profile: profile('a'), sourceKind: 'managed_child_edit' }, actor: 'parent-a', surface: 'main' };
  const calls = { signed: [], published: [], uploaded: [], updates: [] };
  const links = new Map();
  const key = { managedPublicKeyId: 'synthetic-key', managedKeyVersion: 1, privateKeyJwk: { d: 'synthetic' } };
  const deps = {
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null,
    getPolicySourceProfile: () => current.source,
    getProfilesRoot: () => ({ profiles: {} }),
    getLocalProfileContext: () => ({ profileId: current.actor }),
    getActiveManagedSurface: () => current.surface,
    getProfileSurface: (value, surface) => value[surface] || {},
    getManagedTimeLimitPolicy: value => value.settings?.timeLimitPolicy || null,
    normalizeTrustedLink: value => value,
    getTargetProfileBehavior: value => value,
    normalizeTargetProfileContext: value => value || {},
    getRemoteTargetProfile: () => null,
    getAllowedScopeList: value => value,
    getScopeLabel: value => value,
    buildLocalPolicyHash: (prefix, seed) => `${prefix}-${seed}`,
    ensureSigningKeyPair: async () => key,
    getStableDeviceId: () => 'source-device',
    findTrustedLinkById: id => links.get(id),
    updateTrustedLinkPolicy: async (id, patch) => { calls.updates.push({ id, patch: plain(patch) }); return true; },
    ensureManagedProviderDeliveryAuthorized: async () => ({ ok: true }),
    now: () => 1000,
    getAdapter: () => ({
      async signManagedPolicyEnvelope(envelope) { calls.signed.push(plain(envelope)); return envelope; },
      async buildManagedMailboxStorageItem(envelope) {
        return { ...envelope, mailboxItemId: `item-${envelope.linkId}-${envelope.scope}`, ciphertext: 'synthetic-ciphertext', encryptedDek: 'synthetic-dek', nonce: 'synthetic-nonce' };
      }
    })
  };
  function link(id = 'link-a') {
    const value = { linkId: id, linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', remoteDeviceId: `device-${id}`, policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: `remote-${id}`, allowedScopes: ['main', 'kids', 'keywords', 'viewing_space', 'time_limits'] } };
    links.set(id, value);
    return value;
  }
  const helper = box.window.FilterTubeNanahManagedLivePolicy.create(deps);
  const provider = {
    async publishManagedPolicyCandidates(request) { calls.published.push(plain(request)); return { ok: true }; },
    async uploadManagedMailboxItems(request) { calls.uploaded.push(plain(request)); return { ok: true }; }
  };
  return { helper, current, calls, deps, key, link, provider };
}

test('a signing await cannot switch the selected profile, surface, actor, or nested rules', async () => {
  const f = fixture();
  const gate = deferred();
  f.deps.ensureSigningKeyPair = () => gate.promise;
  f.deps.getCurrentTrustedLink = () => f.link();
  const pending = f.helper.buildEnvelopeForLiveSend({ scope: 'keywords' });
  f.current.source.profile.main.keywords[0].dateFilter.after = '2026-10-01';
  f.current.source = { profileId: 'source-b', profile: profile('b') };
  f.current.actor = 'parent-b';
  f.current.surface = 'kids';
  gate.resolve(f.key);
  const envelope = await pending;
  assert.equal(envelope.sourceProfileId, 'parent-a');
  assert.equal(envelope.payload.surface, 'main');
  assert.equal(envelope.payload.keywords[0].word, 'a-main');
  assert.equal(envelope.payload.keywords[0].dateFilter.after, '2026-01-01');
});

test('concurrent operations preserve their own source rules and fixed remote targets', async () => {
  const f = fixture();
  const gates = [];
  f.deps.ensureSigningKeyPair = () => { const gate = deferred(); gates.push(gate); return gate.promise; };
  const first = f.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, [f.link('a')]);
  f.current.source = { profileId: 'source-b', profile: profile('b') };
  const second = f.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, [f.link('b')]);
  gates[1].resolve(f.key);
  gates[0].resolve(f.key);
  const [[a], [b]] = await Promise.all([first, second]);
  assert.equal(a.targetProfileId, 'remote-a');
  assert.equal(a.payload.keywords[0].word, 'a-main');
  assert.equal(b.targetProfileId, 'remote-b');
  assert.equal(b.payload.keywords[0].word, 'b-main');
});

test('a multi-scope batch keeps one source snapshot after its first signature awaits', async () => {
  const f = fixture();
  const gate = deferred();
  const original = f.deps.getAdapter;
  f.deps.getAdapter = () => ({ ...original(), async signManagedPolicyEnvelope(envelope) {
    f.calls.signed.push(plain(envelope));
    if (f.calls.signed.length === 1) await gate.promise;
    return envelope;
  } });
  f.deps.getCurrentTrustedLink = () => f.link();
  const pending = f.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' });
  await Promise.resolve();
  f.current.source = { profileId: 'source-b', profile: profile('b') };
  f.current.source.profile.settings.timeLimitPolicy = null;
  f.current.actor = 'parent-b';
  gate.resolve();
  const envelopes = await pending;
  assert.deepEqual(plain(envelopes.map(row => row.scope)), ['main', 'kids', 'viewing_space', 'time_limits']);
  assert.ok(envelopes.every(row => row.sourceProfileId === 'parent-a'));
  assert.equal(envelopes[0].payload.data.keywords[0].word, 'a-main');
  assert.equal(envelopes[1].payload.data.blockedKeywords[0].word, 'a-kids');
  assert.equal(envelopes[3].payload.dailyBudgetSeconds, 1800);
});

test('an explicit send operation retains its chosen source across sequential delivery paths', async () => {
  const f = fixture();
  const operation = f.helper.createSendOperation();
  assert.equal(operation.createSendOperation(), operation);
  f.current.source = { profileId: 'source-b', profile: profile('b') };
  const links = [f.link()];
  const [live] = await operation.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, links);
  await operation.deliverLocalNetworkPolicyBatch({ scope: 'keywords' }, links, f.provider);
  await operation.uploadMailboxPolicyBatch({ scope: 'keywords' }, links, f.provider);
  assert.equal(live.payload.keywords[0].word, 'a-main');
  assert.equal(f.calls.published[0].candidates[0].envelope.payload.keywords[0].word, 'a-main');
  assert.ok(f.calls.signed.every(row => row.payload.keywords[0].word === 'a-main'));
  assert.equal(f.calls.uploaded.length, 1);
});

test('a saved source parent pin rejects a different actor before requesting a signing key', async () => {
  for (const policyPin of [false, true]) {
    const f = fixture();
    const link = f.link();
    if (policyPin) link.policy.sourceProfileId = 'paired-parent';
    else link.sourceProfileId = 'paired-parent';
    let keyRequests = 0;
    f.deps.ensureSigningKeyPair = async () => { keyRequests += 1; return f.key; };
    await assert.rejects(f.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, [link]), /Switch to the parent account that paired this device/);
    assert.equal(keyRequests, 0);
    assert.equal(f.calls.signed.length, 0);
  }
});

test('a child actor cannot sign managed updates even if its ID matches the saved source pin', async () => {
  const f = fixture();
  const link = f.link();
  link.sourceProfileId = 'parent-a';
  f.deps.getLocalProfileContext = () => ({ profileId: 'parent-a', profileType: 'child' });
  let keyRequests = 0;
  f.deps.ensureSigningKeyPair = async () => { keyRequests += 1; return f.key; };
  await assert.rejects(f.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, [link]), /Switch to the parent account that paired this device/);
  assert.equal(keyRequests, 0);
  assert.equal(f.calls.signed.length, 0);
});

test('a matching captured parent remains the signer after an active actor switch', async () => {
  const f = fixture();
  const link = f.link();
  link.sourceProfileId = 'parent-a';
  f.deps.getLocalProfileContext = () => ({ profileId: f.current.actor, profileType: f.current.actor === 'parent-a' ? 'account' : 'child' });
  const operation = f.helper.createSendOperation();
  f.current.actor = 'child-b';
  const [message] = await operation.buildEnvelopeBatchForTrustedLinks({ scope: 'keywords' }, [link]);
  assert.equal(message.sourceProfileId, 'parent-a');
});

for (const [name, method] of [['Home Pickup', 'deliverLocalNetworkPolicyBatch'], ['Internet Pickup', 'uploadMailboxPolicyBatch']]) {
  test(`${name} captures the selected source before provider authorization awaits`, async () => {
    const f = fixture();
    const gate = deferred();
    f.deps.ensureManagedProviderDeliveryAuthorized = () => gate.promise;
    const pending = f.helper[method]({ scope: 'keywords' }, [f.link()], f.provider);
    f.current.source = { profileId: 'source-b', profile: profile('b') };
    gate.resolve({ ok: true });
    const result = await pending;
    assert.equal(result.ok, true);
    assert.ok(f.calls.signed.length > 0);
    assert.ok(f.calls.signed.every(row => row.payload.keywords[0].word === 'a-main'));
  });
}
