import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const runtime = fs.readFileSync(new URL('../../js/nanah_managed_live_policy.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture(savedLink = null) {
    const box = { window: {} };
    vm.runInNewContext(runtime, box);
    let trusted = savedLink || {
        linkId: 'parent-child', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
        sourceDeviceId: 'parent-device', sourceProfileId: 'parent', localPolicyProfileId: 'local-child',
        remoteDeviceId: 'child-device', sourcePublicKeyId: 'public-key', keyVersion: 1,
        policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'remote-child', allowedScopes: ['main', 'kids'] }
    };
    const current = {
        source: { profileId: 'local-child', profile: { main: { mode: 'blocklist', keywords: [{ word: 'first' }] } } },
        actor: { profileId: 'parent', profileType: 'account' }, surface: 'main'
    };
    const writes = [];
    let failWrite = false, afterWrite = null;
    const deps = {
        normalizeString: value => typeof value === 'string' ? value.trim() : '',
        safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
        normalizeNonNegativeInteger: value => Number.isInteger(value) && value >= 0 ? value : null,
        getProfilesRoot: () => ({}), getLocalProfileContext: () => current.actor,
        getPolicySourceProfile: () => current.source, getActiveManagedSurface: () => current.surface,
        getProfileSurface: (profile, surface) => profile[surface] || {}, getManagedTimeLimitPolicy: () => null,
        normalizeTrustedLink: value => value || null, getTargetProfileBehavior: value => value,
        normalizeTargetProfileContext: value => value || {}, getRemoteTargetProfile: () => null,
        getAllowedScopeList: value => value || [], getScopeLabel: value => value,
        buildLocalPolicyHash: (prefix, body) => crypto.createHash('sha256').update(prefix + body).digest('hex'),
        ensureSigningKeyPair: async () => ({ managedPublicKeyId: 'public-key', managedKeyVersion: 1, privateKeyJwk: { d: 'fixture' } }),
        getStableDeviceId: () => 'parent-device', getCurrentTrustedLink: () => trusted,
        findTrustedLinkById: id => trusted?.linkId === id ? trusted : null,
        async updateTrustedLinkPolicy(id, updates) {
            writes.push(plain(updates));
            if (failWrite) return false;
            trusted = { ...trusted, policy: { ...trusted.policy, ...plain(updates.policy) } };
            if (afterWrite) afterWrite(trusted);
            return true;
        },
        now: () => 1000,
        getAdapter: () => ({ async signManagedPolicyEnvelope(envelope) {
            return { ...envelope, integrity: { algorithm: 'fixture', signature: `signature-${envelope.policyHash}` } };
        } })
    };
    return {
        helper: box.window.FilterTubeNanahManagedLivePolicy.create(deps), current, deps, writes,
        get link() { return trusted; }, set link(value) { trusted = value; },
        set failWrite(value) { failWrite = value; }, set afterWrite(value) { afterWrite = value; }
    };
}

test('reservation persists an allocation floor without sent history, receipt or applied state', async () => {
    const f = fixture();
    const envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal((await f.helper.reserveEnvelope(envelope)).ok, true);
    assert.deepEqual(f.link.policy.autoSyncReservedPolicies.main, { revision: 1, policyHash: envelope.policyHash });
    assert.equal(f.link.policy.outgoingManagedPolicies, undefined);
    assert.equal(f.link.policy.outboundManagedPolicyHistory, undefined);
    assert.equal(f.writes[0].autoSyncReservationExpected.targetProfileId, 'remote-child');
});

test('crash after reservation but before queue persistence cannot reuse a revision for changed content', async () => {
    const first = fixture();
    const envelope = await first.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    await first.helper.reserveEnvelope(envelope);
    const restarted = fixture(plain(first.link));
    restarted.current.source.profile.main.keywords = [{ word: 'changed after crash' }];
    const newer = await restarted.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(newer.revision, envelope.revision + 1);
    assert.notEqual(newer.policyHash, envelope.policyHash);
});

test('same policy after restart retains its reserved revision and serialized retry envelope remains identical', async () => {
    const f = fixture(), original = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    await f.helper.reserveEnvelope(original);
    const durableQueuedEnvelope = JSON.stringify(original);
    const restarted = fixture(plain(f.link));
    const same = await restarted.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(same.revision, original.revision);
    assert.equal(same.policyHash, original.policyHash);
    await restarted.helper.reserveEnvelope(JSON.parse(durableQueuedEnvelope));
    assert.equal(JSON.stringify(JSON.parse(durableQueuedEnvelope)), durableQueuedEnvelope);
});

test('explicit source/actor/surface snapshot remains detached through sequential asynchronous signing', async () => {
    const f = fixture();
    const selected = plain(f.current);
    const operation = f.helper.createSendOperation(selected);
    selected.source.profile.main.keywords[0].word = 'mutated';
    f.current.source.profile.main.keywords[0].word = 'changed current';
    f.current.actor.profileId = 'other-parent'; f.current.surface = 'kids';
    const envelope = await operation.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(envelope.payload.data.keywords[0].word, 'first');
    assert.equal(envelope.sourceProfileId, 'parent');
    assert.equal(operation.createSendOperation(), operation);
});

test('malformed explicit snapshots and child actors cannot create managed updates', async () => {
    const f = fixture();
    assert.throws(() => f.helper.createSendOperation({}), /explicit managed send snapshot/);
    const child = f.helper.createSendOperation({ ...plain(f.current), actor: { profileId: 'parent', profileType: 'child' } });
    await assert.rejects(child.buildEnvelopeForLiveSend({ scope: 'main' }), /parent account/);
});

test('sent and reserved revision maxima both constrain the next revision', async () => {
    const f = fixture();
    f.link.policy.outgoingManagedPolicies = { main: { revision: 3, policyHash: 'sent' } };
    f.link.policy.autoSyncReservedPolicies = { main: { revision: 5, policyHash: 'reserved' } };
    assert.equal((await f.helper.buildEnvelopeForLiveSend({ scope: 'main' })).revision, 6);
    f.link.policy.outgoingManagedPolicies.main.revision = 7;
    assert.equal((await f.helper.buildEnvelopeForLiveSend({ scope: 'main' })).revision, 8);
});

test('equal reserved/sent revision with a different hash refuses signing', async () => {
    const f = fixture();
    f.link.policy.outgoingManagedPolicies = { main: { revision: 3, policyHash: 'sent' } };
    f.link.policy.autoSyncReservedPolicies = { main: { revision: 3, policyHash: 'reserved' } };
    await assert.rejects(f.helper.buildEnvelopeForLiveSend({ scope: 'main' }), /conflicting reservations/);
});

test('malformed and exhausted reservation floors fail closed', async () => {
    const f = fixture();
    f.link.policy.autoSyncReservedPolicies = { main: { revision: '3', policyHash: 'bad' } };
    await assert.rejects(f.helper.buildEnvelopeForLiveSend({ scope: 'main' }), /revision is invalid/);
    f.link.policy.autoSyncReservedPolicies.main = { revision: Number.MAX_SAFE_INTEGER, policyHash: 'full' };
    await assert.rejects(f.helper.buildEnvelopeForLiveSend({ scope: 'main' }), /revision limit/);
});

test('reservation rejects stale and equal-conflicting payloads while allowing identical retries', async () => {
    const f = fixture(), first = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    await f.helper.reserveEnvelope(first);
    await f.helper.reserveEnvelope(first);
    await assert.rejects(f.helper.reserveEnvelope({ ...first, policyHash: 'different' }), /stale or conflicts/);
    f.link.policy.autoSyncReservedPolicies.main = { revision: 2, policyHash: 'second' };
    await assert.rejects(f.helper.reserveEnvelope(first), /stale or conflicts/);
});

test('failed durable reservation is never reported as successful', async () => {
    const f = fixture(), envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    f.failWrite = true;
    await assert.rejects(f.helper.reserveEnvelope(envelope), /could not be saved/);
    assert.equal(f.link.policy.autoSyncReservedPolicies, undefined);
});

for (const [label, mutate] of Object.entries({
    revoked: f => { f.link.revoked = true; },
    'key revoked': f => { f.link.keyRevoked = true; },
    'pairing stale': f => { f.link.stalePairing = true; },
    removed: f => { f.link = null; },
    'target changed': f => { f.link.policy.targetProfileId = 'sibling'; },
    'source changed': f => { f.link.sourceProfileId = 'other-parent'; },
    'key changed': f => { f.link.keyVersion = 2; },
    'scope removed': f => { f.link.policy.allowedScopes = ['kids']; },
    'roles changed': f => { f.link.localRole = 'replica'; }
})) {
    test(`${label} before reservation prevents persistence`, async () => {
        const f = fixture(), envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
        mutate(f);
        await assert.rejects(f.helper.reserveEnvelope(envelope));
        assert.equal(f.writes.length, 0);
    });
}

test('revocation while persistence awaits prevents queue handoff success', async () => {
    const f = fixture(), envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    f.afterWrite = link => { link.revoked = true; };
    await assert.rejects(f.helper.reserveEnvelope(envelope), /revoked or changed/);
    assert.equal(f.link.policy.outgoingManagedPolicies, undefined);
});

test('a reservation cannot accidentally mark sent or drain receipt state', async () => {
    const f = fixture(), envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    await f.helper.reserveEnvelope(envelope);
    assert.equal(f.writes.length, 1);
    assert.deepEqual(Object.keys(f.writes[0].policy), ['autoSyncReservedPolicies']);
    assert.equal(f.link.policy.autoSyncReservedPolicies.main.lastAckAt, undefined);
});
