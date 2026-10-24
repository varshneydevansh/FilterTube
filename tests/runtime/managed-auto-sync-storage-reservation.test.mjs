import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// The two pages execute production trust transactions and real Ed25519 signing,
// sharing the same storage and origin lock, not a mock reservation transaction.
const fixtureUrl = new URL('./nanah-managed-shared-link-handshake-current-behavior.test.mjs', import.meta.url);
let fixture = fs.readFileSync(fixtureUrl, 'utf8').split("test('production first Apply+Save")[0];
fixture = fixture.replace("'./helpers/nanah-storage-lock-fixture.mjs'", JSON.stringify(new URL('./helpers/nanah-storage-lock-fixture.mjs', import.meta.url).href));
fixture = fixture.replace('new URL(`../../js/${name}.js`, import.meta.url)', `new URL(\`${new URL('../../js/', import.meta.url).href}\${name}.js\`)`);
const { setup, peer } = await import(`data:text/javascript;base64,${Buffer.from(`${fixture}\nexport { setup, peer };`).toString('base64')}`);
const clone = value => JSON.parse(JSON.stringify(value));
const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const loadStart = tab.indexOf('    async function loadNanahTrustedLinks(');
const loadEnd = tab.indexOf('    async function persistNanahTrustedLinks(', loadStart);
assert.ok(loadStart > 0 && loadEnd > loadStart);

function helperFor(p, keys) {
    const box = p.box;
    return box.FilterTubeNanahManagedLivePolicy.create({
        normalizeString: box.normalizeString, safeObject: box.safeObject,
        normalizeNonNegativeInteger: box.normalizeNonNegativeInteger,
        getProfilesRoot: () => box.profilesV4Cache, getLocalProfileContext: box.getNanahLocalProfileContext,
        getPolicySourceProfile: () => ({ profileId: p.childId, profile: box.profilesV4Cache.profiles[p.childId] }),
        getActiveManagedSurface: () => 'kids', getProfileSurface: (profile, surface) => profile[surface] || {},
        getManagedTimeLimitPolicy: profile => profile.settings?.timeLimitPolicy || null,
        normalizeTrustedLink: box.normalizeNanahTrustedLink, getTargetProfileBehavior: value => value,
        normalizeTargetProfileContext: value => value || {}, getRemoteTargetProfile: () => null,
        buildLocalPolicyHash: box.buildLocalPolicyHash, getAllowedScopeList: box.getNanahManagedPolicyScopeList,
        getScopeLabel: value => value, ensureSigningKeyPair: async () => keys,
        getStableDeviceId: () => box.nanahStableDeviceId,
        findTrustedLinkById: id => box.nanahTrustedLinks.find(link => link.linkId === id),
        updateTrustedLinkPolicy: box.updateNanahTrustedLinkPolicy,
        getAdapter: () => box.FilterTubeNanahAdapter, now: () => 1000
    });
}

async function pairedPages() {
    const f = await setup();
    const { envelope } = await f.prepareFirst();
    await f.receiver.box.handleNanahIncomingProposal(envelope);
    const a = f.source;
    const b = await peer(a.box.nanahStableDeviceId, a.parentId, a.childId, 'source');
    for (const method of ['get', 'set', 'remove', 'getBytesInUse']) {
        b.box.chrome.storage.local[method] = (...args) => a.box.chrome.storage.local[method](...args);
    }
    b.box.chrome.runtime = a.box.chrome.runtime;
    installNanahStorageLock(b.box, { locks: a.box.navigator.locks });
    for (const p of [a, b]) vm.runInContext(tab.slice(loadStart, loadEnd), p.box);
    await b.box.loadNanahTrustedLinks();
    const keys = a.box.nanahManagedSigningKeyDescriptor;
    return { ...f, a, b, helperA: f.helpers, helperB: helperFor(b, keys) };
}

async function signed(p, helper, scope = 'kids') {
    return (await helper.buildEnvelopeBatchForTrustedLinks({ scope }, p.box.nanahTrustedLinks))[0];
}

test('actual overlapping page reservations merge independent scopes without sent or receipt claims', async () => {
    const f = await pairedPages();
    const kids = await signed(f.a, f.helperA, 'kids'), main = await signed(f.b, f.helperB, 'main');
    await Promise.all([f.helperA.reserveEnvelope(kids), f.helperB.reserveEnvelope(main)]);
    const row = f.a.storage.ftNanahTrustedLinks[0];
    assert.deepEqual(Object.keys(row.policy.autoSyncReservedPolicies).sort(), ['kids', 'main']);
    assert.equal(row.policy.autoSyncReservedPolicies.kids.policyHash, kids.policyHash);
    assert.equal(row.policy.autoSyncReservedPolicies.main.policyHash, main.policyHash);
    assert.equal(row.autoSyncReservationExpected, undefined);
    assert.equal(row.policy.outgoingManagedPolicies, undefined);
    assert.equal(row.policy.outboundManagedPolicyHistory, undefined);
});

test('two stale pages cannot reserve different payloads under the same revision', async () => {
    const f = await pairedPages();
    const first = await signed(f.a, f.helperA);
    f.b.box.profilesV4Cache.profiles[f.b.childId].kids.blockedKeywords.push({ word: 'second-page-change' });
    const conflict = await signed(f.b, f.helperB);
    assert.equal(conflict.revision, first.revision);
    assert.notEqual(conflict.policyHash, first.policyHash);
    await f.helperA.reserveEnvelope(first);
    await assert.rejects(f.helperB.reserveEnvelope(conflict), /conflicting managed policy revision/);
    assert.equal(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies.kids.policyHash, first.policyHash);
    await f.b.box.loadNanahTrustedLinks();
    const newer = await signed(f.b, f.helperB);
    assert.equal(newer.revision, first.revision + 1);
    assert.equal((await f.helperB.reserveEnvelope(newer)).ok, true);
});

test('actual colliding legacy policy hashes still allocate distinct strong-payload revisions across pages', async () => {
    const f = await pairedPages();
    f.a.box.profilesV4Cache.profiles[f.a.childId].kids.blockedKeywords = [{ word: 'Aa' }];
    f.b.box.profilesV4Cache.profiles[f.b.childId].kids.blockedKeywords = [{ word: 'BB' }];
    const first = await signed(f.a, f.helperA), conflicting = await signed(f.b, f.helperB);
    assert.equal(first.policyHash, conflicting.policyHash, 'exercise an actual legacy polynomial collision');
    assert.notEqual(first.integrity.signedFields.payloadSha256, conflicting.integrity.signedFields.payloadSha256);
    await f.helperA.reserveEnvelope(first);
    await assert.rejects(f.helperB.reserveEnvelope(conflicting), /conflicting managed policy revision/);
    await f.b.box.loadNanahTrustedLinks();
    const newer = await signed(f.b, f.helperB);
    assert.equal(newer.revision, first.revision + 1);
    await f.helperB.reserveEnvelope(newer);
    assert.equal(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies.kids.payloadSha256,
        newer.integrity.signedFields.payloadSha256);
});

test('actual duplicate same-policy reservations are idempotent across overlapping pages', async () => {
    const f = await pairedPages(), envelope = await signed(f.a, f.helperA);
    const results = await Promise.all([f.helperA.reserveEnvelope(envelope), f.helperB.reserveEnvelope(envelope)]);
    assert.ok(results.every(result => result.ok));
    assert.deepEqual(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies.kids,
        { revision: envelope.revision, policyHash: envelope.policyHash, payloadSha256: envelope.integrity.signedFields.payloadSha256 });
});

test('persisted sent floor prevents a stale page from reserving an older or equal conflicting policy', async () => {
    const f = await pairedPages(), envelope = await signed(f.b, f.helperB);
    await f.helperA.markSent(envelope.linkId, 'kids', 3, 'already-sent-policy');
    await assert.rejects(f.helperB.reserveEnvelope(envelope), /newer or conflicting managed policy revision/);
    assert.equal(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies, undefined);
    await f.b.box.loadNanahTrustedLinks();
    const stale = { ...envelope, revision: 3 };
    await assert.rejects(f.helperB.reserveEnvelope(stale), /stale or conflicts/);
});

for (const [label, patch] of Object.entries({
    revoked: { revoked: true },
    'key revoked': { keyRevoked: true },
    'key rotated': { keyVersion: 2 },
    'local mapping changed': { localPolicyProfileId: 'another-source-child' },
    'receiving target changed': { policy: { targetProfileId: 'another-receiver-child' } },
    'scope reduced': { policy: { allowedScopes: ['main'] } }
})) {
    test(`fresh stored ${label} rejects stale-page reservation without restoring the grant`, async () => {
        const f = await pairedPages(), envelope = await signed(f.b, f.helperB);
        await f.a.box.updateNanahTrustedLinkPolicy(envelope.linkId, patch);
        const before = clone(f.a.storage.ftNanahTrustedLinks);
        await assert.rejects(f.helperB.reserveEnvelope(envelope), /saved managed link changed/);
        assert.deepEqual(f.a.storage.ftNanahTrustedLinks, before);
    });
}

test('missing expected binding cannot write reservation state through the public policy updater', async () => {
    const f = await pairedPages(), id = f.a.box.nanahTrustedLinks[0].linkId;
    await assert.rejects(f.a.box.updateNanahTrustedLinkPolicy(id, {
        policy: { autoSyncReservedPolicies: { kids: { revision: 1, policyHash: 'unbound' } } }
    }), /exact saved-link binding/);
    assert.equal(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies, undefined);
});

test('reservation persistence failures leave no queue-ready allocation success', async () => {
    const f = await pairedPages(), envelope = await signed(f.a, f.helperA);
    const original = f.a.box.chrome.storage.local.set;
    f.a.box.chrome.storage.local.set = (payload, callback) => {
        if (!Object.hasOwn(payload, 'ftNanahTrustedLinks')) return original(payload, callback);
        f.a.box.chrome.runtime.lastError = { message: 'reservation write quota failure' };
        callback?.(); f.a.box.chrome.runtime.lastError = null;
    };
    await assert.rejects(f.helperA.reserveEnvelope(envelope), /could not be saved/);
    assert.equal(f.a.storage.ftNanahTrustedLinks[0].policy.autoSyncReservedPolicies, undefined);
});
