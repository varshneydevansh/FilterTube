import fs from 'node:fs';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const queueApi = require('../../js/auto_sync_queue.js');
const controllerApi = require('../../js/device_auto_sync.js');
const personalApi = require('../../js/personal_sync.js');
require('../../js/managed_auto_sync.js');
const managedApi = globalThis.FilterTubeManagedAutoSync;
const box = {};
new Function('window', fs.readFileSync(new URL('../../js/nanah_managed_live_policy.js', import.meta.url), 'utf8'))(box);
const liveFactory = box.FilterTubeNanahManagedLivePolicy;
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function fixture(t, { two = false, autoApply = true } = {}) {
    const data = {}, calls = { signed: [], reservations: [], sent: [], personalRuns: 0, confirms: 0 };
    let time = 1000, tail = Promise.resolve(), generation = 0;
    const profilesV4 = { activeProfileId: 'parent', profiles: {
        default: { type: 'account' }, parent: { type: 'account', name: 'Parent', security: { profilePinVerifier: { hash: 'opaque-verifier' } } },
        otherParent: { type: 'account' },
        child: { type: 'child', parentProfileId: 'parent', name: 'Child A', main: { mode: 'blocklist', keywords: [{ word: 'first' }] } },
        childB: { type: 'child', parentProfileId: 'parent', name: 'Child B', main: { mode: 'blocklist', keywords: [{ word: 'other-child' }] } }
    } };
    const makeLink = (linkId, localPolicyProfileId, targetProfileId) => ({
        linkId, linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
        sourceDeviceId: 'source-device', sourceProfileId: 'parent', localPolicyProfileId,
        remoteDeviceId: 'target-device', sourcePublicKeyId: 'parent-key', keyVersion: 1,
        policy: { targetProfileBehavior: 'fixed_profile', targetProfileId, targetProfileName: targetProfileId,
            autoApplyControlProposals: autoApply, lockedChildMode: 'allow_trusted_updates', reconnectMode: 'fast',
            syncOnProfileOpen: true, allowedScopes: ['main'] }
    });
    const links = [makeLink('link-a', 'child', 'remote-child-a')];
    if (two) links.push(makeLink('link-b', 'childB', 'remote-child-b'));
    const current = { profilesV4, links, deviceId: 'source-device', unlocked: true };
    const session = { ready: false, remoteDeviceId: 'target-device', role: 'source', remoteRole: 'replica', managedReady: links.map(link => link.linkId) };
    const hooks = { confirm: async () => true, beforeSend: null, afterSend: null, beforeQueueRemove: null };
    const deps = {
        get: async keys => Object.fromEntries(keys.filter(key => key in data).map(key => [key, clone(data[key])])),
        set: async value => { Object.assign(data, clone(value)); },
        withLock: fn => { const result = tail.then(fn); tail = result.catch(() => {}); return result; },
        now: () => time
    };
    const liveDeps = {
        normalizeString: value => typeof value === 'string' ? value.trim() : '',
        safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
        normalizeNonNegativeInteger: value => Number.isSafeInteger(value) && value >= 0 ? value : null,
        getLocalProfileContext: () => ({ profileId: profilesV4.activeProfileId, profileType: profilesV4.profiles[profilesV4.activeProfileId]?.type }),
        getProfileSurface: (profile, surface) => profile[surface] || {}, getManagedTimeLimitPolicy: profile => profile.settings?.timeLimitPolicy || null,
        normalizeTrustedLink: value => value || null, getTargetProfileBehavior: value => value,
        normalizeTargetProfileContext: value => value || {}, getRemoteTargetProfile: () => null,
        getAllowedScopeList: value => value || [], getScopeLabel: value => value,
        buildLocalPolicyHash: (prefix, text) => crypto.createHash('sha256').update(prefix + text).digest('hex'),
        ensureSigningKeyPair: async () => ({ managedPublicKeyId: 'parent-key', managedKeyVersion: 1, privateKeyJwk: { d: 'synthetic-local-key' } }),
        getStableDeviceId: () => current.deviceId,
        findTrustedLinkById: id => links.find(link => link.linkId === id),
        async updateTrustedLinkPolicy(id, updates) {
            const link = links.find(link => link.linkId === id);
            if (!link) return false;
            const patch = clone(updates.policy);
            if (patch.autoSyncReservedPolicies) {
                calls.reservations.push(clone(patch.autoSyncReservedPolicies));
                patch.autoSyncReservedPolicies = { ...link.policy.autoSyncReservedPolicies, ...patch.autoSyncReservedPolicies };
            }
            link.policy = { ...link.policy, ...patch };
            return true;
        },
        now: () => time,
        getAdapter: () => ({ async signManagedPolicyEnvelope(envelope) {
            calls.signed.push(clone(envelope));
            return { ...envelope, integrity: { algorithm: 'fixture', signature: 'fixture-signature' } };
        } })
    };
    const live = liveFactory.create(liveDeps);
    const instances = [];
    function instance() {
        const actualQueue = queueApi.create(deps);
        const queue = { ...actualQueue, async remove(id, expected) {
            if (hooks.beforeQueueRemove) await hooks.beforeQueueRemove(id, expected);
            return actualQueue.remove(id, expected);
        } };
        const controller = controllerApi.create({
            ...deps, queue, managed: managedApi, personal: personalApi, crypto: crypto.webcrypto,
            randomId: () => `consent-${++generation}`,
            context: async () => clone(current), session: () => ({ ...session }),
            operation: (grant, context) => live.createSendOperation({
                source: { profileId: grant.binding.localPolicyProfileId, profile: context.profilesV4.profiles[grant.binding.localPolicyProfileId] },
                actor: { profileId: grant.binding.sourceProfileId, profileType: 'account' }, surface: 'main'
            }),
            hasTimePolicy: profile => !!profile.settings?.timeLimitPolicy,
            confirmManaged: async () => { calls.confirms++; return hooks.confirm(); },
            async sendManaged(envelope, captured, authorize) {
                await live.sendLiveEnvelope(envelope, async outgoing => {
                    if (!await authorize()) throw Error('authorization changed');
                    await hooks.beforeSend?.(outgoing);
                    if (!await authorize()) throw Error('authorization changed');
                    calls.sent.push(clone(outgoing));
                    await hooks.afterSend?.(outgoing);
                });
            },
            personalRuntime: { create: () => ({ run: async () => { calls.personalRuns++; }, view: async () => [] }) }
        });
        instances.push(controller);
        return { controller, queue: actualQueue };
    }
    async function ack(envelope, decision = { accepted: true, applied: true }) {
        const receiver = liveFactory.create({ ...liveDeps, getStableDeviceId: () => 'target-device' });
        return live.recordLiveAckPayload(receiver.buildLiveAckPayload(envelope, decision));
    }
    t.after(() => instances.forEach(controller => controller.dispose()));
    return { data, calls, current, links, session, hooks, live, instance, ack,
        advance: delta => { time += delta; } };
}

async function channel(queue, id = 'link-a') {
    return (await queue.read()).enrollments.find(row => row.enrollmentId === 'managed:' + id)?.channels[0];
}

test('personal setup appears only for an unlocked account and an exact saved verified account peer', async t => {
    const f = fixture(t), { controller } = f.instance();
    Object.assign(f.session, { ready: true, role: 'peer', remoteRole: 'peer', autoSyncVersion: 1,
        remoteProfileType: 'account', remoteProfileId: 'other-account', remoteDeviceId: 'my-tablet' });
    assert.equal((await controller.view()).canPairPersonal, false, 'phrase confirmation alone is not a saved trust link');
    const peer = { linkId: 'saved-peer', createdAt: '2026-10-24T00:00:00Z', remoteDeviceId: 'my-tablet',
        linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer' };
    f.links.push(peer);
    assert.equal((await controller.view()).canPairPersonal, true);
    peer.revoked = true;
    assert.equal((await controller.view()).canPairPersonal, false);
    delete peer.revoked;
    f.session.remoteProfileType = 'child';
    assert.equal((await controller.view()).canPairPersonal, false);
    f.session.remoteProfileType = 'account';
    f.current.unlocked = false;
    assert.equal((await controller.view()).canPairPersonal, false);
    f.current.unlocked = true;
    f.current.profilesV4.activeProfileId = 'child';
    assert.equal((await controller.view()).canPairPersonal, false);
});

test('verified links remain off by default with no signing, queue, or automatic send', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    f.session.ready = true;
    await controller.run({ wake: true });
    assert.equal((await controller.view()).managed[0].status, 'Off');
    assert.equal(f.calls.signed.length, 0); assert.equal(f.calls.sent.length, 0);
    assert.deepEqual((await queue.read()).enrollments, []);
});

test('cancelled enrollment returns false and changes no permission or queue state', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    f.hooks.confirm = async () => false;
    assert.equal(await controller.setManaged('link-a', true), false);
    assert.deepEqual((await controller.read()).managed, []);
    assert.deepEqual((await queue.read()).enrollments, []);
    assert.equal(f.calls.signed.length, 0);
});

test('offline queue survives controller restart and sends the identical envelope only to the pinned child', async t => {
    const f = fixture(t), first = f.instance();
    assert.equal(await first.controller.setManaged('link-a', true), true);
    const waiting = await channel(first.queue), encoded = JSON.stringify(waiting.payload.envelope);
    assert.equal(waiting.status, 'waiting'); assert.equal(waiting.reason, 'waiting_for_device');
    assert.equal(waiting.payload.envelope.targetProfileId, 'remote-child-a');
    first.controller.dispose();
    const restarted = f.instance(); f.session.ready = true;
    await restarted.controller.run({ wake: true });
    assert.equal(f.calls.signed.length, 1);
    assert.equal(f.calls.sent.length, 1);
    assert.equal(JSON.stringify(f.calls.sent[0]), encoded);
    assert.equal((await channel(restarted.queue)).reason, 'waiting_for_receipt');
    assert.equal((await restarted.controller.view()).managed[0].status, 'Waiting for confirmation');
    assert.notEqual((await channel(restarted.queue)).status, 'applied');
});

test('transport failure survives restart and retries the exact reserved envelope without new signing', async t => {
    const f = fixture(t), first = f.instance(); f.session.ready = true;
    f.hooks.beforeSend = async () => { throw Error('simulated disconnected transport'); };
    await first.controller.setManaged('link-a', true);
    const queued = await channel(first.queue), exact = JSON.stringify(queued.payload.envelope);
    assert.equal(queued.reason, 'delivery_unavailable');
    assert.equal(f.links[0].policy.outgoingManagedPolicies, undefined);
    first.controller.dispose(); f.hooks.beforeSend = null;
    const restarted = f.instance(); await restarted.controller.run({ wake: true });
    assert.equal(f.calls.signed.length, 1); assert.equal(f.calls.reservations.length, 1);
    assert.equal(JSON.stringify(f.calls.sent[0]), exact);
    assert.equal((await channel(restarted.queue)).status, 'waiting');
});

test('actual managed accepted/delivered receipt marks Up to date without a duplicate send', async t => {
    const f = fixture(t), { controller, queue } = f.instance(); f.session.ready = true;
    await controller.setManaged('link-a', true);
    assert.equal((await channel(queue)).status, 'waiting');
    const receipt = await f.ack(f.calls.sent[0]); assert.equal(receipt.ok, true);
    const outgoing = f.links[0].policy.outgoingManagedPolicies.main;
    assert.equal(outgoing.lastAckState, 'delivered'); assert.equal(outgoing.lastAckResult, 'accepted');
    await controller.run({ wake: true });
    assert.equal((await channel(queue)).status, 'applied');
    assert.equal((await controller.view()).managed[0].status, 'Up to date');
    assert.equal(f.calls.sent.length, 1);
    assert.equal(Object.hasOwn(await channel(queue), 'payload'), false);
});

test('unchanged profile content does not sign or allocate another revision after confirmed apply', async t => {
    const f = fixture(t), { controller } = f.instance(); f.session.ready = true;
    await controller.setManaged('link-a', true); await f.ack(f.calls.sent[0]);
    await controller.run({ wake: true });
    await controller.run({ wake: true }); await controller.run({ wake: true });
    assert.equal(f.calls.signed.length, 1); assert.equal(f.calls.reservations.length, 1);
    assert.equal(f.calls.sent.length, 1);
});

test('multiple offline changes coalesce to the latest exact child policy with increasing reserved revision', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true);
    f.current.profilesV4.profiles.child.main.keywords.push({ word: 'second' });
    await controller.run({ wake: true });
    f.current.profilesV4.profiles.child.main.keywords.push({ word: 'latest' });
    await controller.run({ wake: true });
    const latest = await channel(queue);
    assert.equal(latest.sequence, 3); assert.equal(latest.payload.envelope.revision, 3);
    assert.equal(f.links[0].policy.autoSyncReservedPolicies.main.revision, 3);
    f.session.ready = true; await controller.run({ wake: true });
    assert.equal(f.calls.sent.length, 1);
    assert.deepEqual(f.calls.sent[0].payload.data.keywords.map(row => row.word), ['first', 'second', 'latest']);
});

test('parent switch and lock pause pending payloads and resume without new signatures', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true); f.session.ready = true;
    f.current.profilesV4.activeProfileId = 'child';
    await controller.run({ wake: true });
    assert.equal(f.calls.sent.length, 0); assert.equal((await controller.read()).managed[0].invalidated, undefined);
    assert.ok((await channel(queue)).payload);
    f.current.profilesV4.activeProfileId = 'parent'; f.current.unlocked = false;
    await controller.run({ wake: true }); assert.equal(f.calls.sent.length, 0);
    f.current.unlocked = true; await controller.run({ wake: true });
    assert.equal(f.calls.sent.length, 1); assert.equal(f.calls.signed.length, 1);
});

for (const [label, mutate] of Object.entries({
    revoke: f => { f.links[0].revoked = true; },
    'key rotate': f => { f.links[0].keyVersion = 2; },
    'scope change': f => { f.links[0].policy.allowedScopes = ['kids']; },
    'owner change': f => { f.current.profilesV4.profiles.child.parentProfileId = 'otherParent'; },
    'parent security change': f => { f.current.profilesV4.profiles.parent.security.profilePinVerifier.hash = 'new-verifier'; }
})) {
    test(`${label} purges queued payloads even while another profile is active and requires re-enrollment`, async t => {
        const f = fixture(t), { controller, queue } = f.instance();
        await controller.setManaged('link-a', true);
        const original = clone(f.current);
        f.current.profilesV4.activeProfileId = 'otherParent'; mutate(f);
        await controller.run({ wake: true });
        assert.equal((await controller.read()).managed[0].invalidated, true);
        assert.deepEqual((await queue.read()).enrollments, []);
        Object.assign(f.current, clone(original));
        // Restore the original logical link as well: stale authority restoration must not revive consent.
        f.links[0].revoked = false; f.links[0].keyVersion = 1; f.links[0].policy.allowedScopes = ['main'];
        f.current.links = f.links; f.session.ready = true;
        await controller.run({ wake: true });
        assert.equal(f.calls.sent.length, 0);
        assert.match((await controller.view()).managed[0].status, /Needs review/);
    });
}

test('revocation during asynchronous send authorization purges payload and cannot claim applied', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true); f.session.ready = true;
    f.hooks.beforeSend = async () => { f.links[0].keyRevoked = true; };
    await controller.run({ wake: true });
    assert.equal(f.calls.sent.length, 0);
    assert.deepEqual((await queue.read()).enrollments, []);
    assert.equal((await controller.read()).managed[0].invalidated, true);
});

test('child cannot disable the source parent enrollment', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true);
    f.current.profilesV4.activeProfileId = 'child';
    await assert.rejects(controller.setManaged('link-a', false), /own parent\/account/);
    assert.equal((await controller.read()).managed.length, 1);
    assert.ok((await channel(queue)).payload);
});

test('receiver ask-first permission and absent readiness pause automatic sending without broadening permission', async t => {
    const f = fixture(t, { autoApply: false }), { controller, queue } = f.instance(); f.session.ready = true;
    await controller.setManaged('link-a', true);
    assert.equal(f.calls.sent.length, 0);
    assert.equal((await channel(queue)).reason, 'receiver_review_required');
    assert.equal(f.links[0].policy.autoApplyControlProposals, false);
    const other = fixture(t), second = other.instance(); other.session.ready = true; other.session.managedReady = [];
    await second.controller.setManaged('link-a', true);
    assert.equal(other.calls.sent.length, 0);
    assert.equal((await channel(second.queue)).reason, 'receiver_review_required');
    other.session.managedReady = ['different-link']; await second.controller.run({ wake: true });
    assert.equal(other.calls.sent.length, 0);
    other.session.managedReady = ['link-a']; await second.controller.run({ wake: true });
    assert.equal(other.calls.sent.length, 1);
});

test('oversized profile pauses only that enrollment and does not repeatedly sign or block another grant/personal work', async t => {
    const f = fixture(t, { two: true }), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true); await controller.setManaged('link-b', true);
    f.current.profilesV4.profiles.child.main.keywords = [{ word: 'x'.repeat(600000) }];
    const signatures = f.calls.signed.length, personalRuns = f.calls.personalRuns;
    f.session.ready = true; await controller.run({ wake: true });
    assert.equal((await controller.read()).managed.find(row => row.binding.linkId === 'link-a').invalidated, true);
    assert.equal(await channel(queue, 'link-a'), undefined);
    assert.equal(f.calls.sent.length, 1); assert.equal(f.calls.sent[0].targetProfileId, 'remote-child-b');
    assert.equal(f.calls.signed.length, signatures);
    assert.equal(f.calls.personalRuns, personalRuns + 1);
    await controller.run({ wake: true }); assert.equal(f.calls.signed.length, signatures);
    assert.equal(JSON.stringify(await controller.view()).includes('x'.repeat(100)), false);
});

test('queue-size failure after reservation pauses review without allocating the same failing update repeatedly', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    f.current.profilesV4.profiles.child.main.keywords = [{ word: 'x'.repeat(512 * 1024 - 120) }];
    await controller.setManaged('link-a', true);
    assert.equal(f.calls.signed.length, 1, 'fingerprint succeeds before the complete signed envelope exceeds queue capacity');
    assert.equal(f.calls.reservations.length, 1);
    assert.equal((await controller.read()).managed[0].invalidated, true);
    assert.deepEqual((await queue.read()).enrollments, []);
    await controller.run({ wake: true });
    assert.equal(f.calls.reservations.length, 1); assert.equal(f.calls.signed.length, 1);
});

test('explicit stop removes private queued payload and re-enrollment receives a fresh consent generation', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    await controller.setManaged('link-a', true);
    const previous = (await controller.read()).managed[0].generation;
    assert.equal(await controller.setManaged('link-a', false), true);
    assert.deepEqual((await queue.read()).enrollments, []);
    assert.equal(await controller.setManaged('link-a', true), true);
    assert.notEqual((await controller.read()).managed[0].generation, previous);
});

test('stale invalidation cannot purge a freshly re-approved same-link generation', async t => {
    const f = fixture(t), first = f.instance();
    await first.controller.setManaged('link-a', true);
    const old = (await first.queue.read()).enrollments[0];
    const entered = deferred(), release = deferred();
    f.hooks.beforeQueueRemove = async () => { f.hooks.beforeQueueRemove = null; entered.resolve(); await release.promise; };
    f.links[0].revoked = true;
    const invalidating = first.controller.run({ wake: true });
    await entered.promise;
    assert.equal((await first.controller.read()).managed[0].invalidated, true);
    f.links[0].revoked = false;
    const second = f.instance();
    await second.controller.setManaged('link-a', true);
    const fresh = (await second.queue.read()).enrollments[0];
    assert.notEqual(fresh.binding, old.binding);
    release.resolve(); await invalidating;
    const after = (await second.queue.read()).enrollments[0];
    assert.equal(after.binding, fresh.binding); assert.ok(after.channels[0].payload);
    assert.equal((await second.controller.read()).managed[0].invalidated, undefined);
});

test('loss of an existing time policy purges its obsolete pending budget before reconnect', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    f.links[0].policy.allowedScopes = ['main', 'time_limits'];
    f.current.profilesV4.profiles.child.settings = { timeLimitPolicy: {
        enabled: true, timezone: 'UTC', dailyBudgetSeconds: 1800, dailyBudgetMinutes: 30
    } };
    await controller.setManaged('link-a', true);
    assert.ok((await queue.read()).enrollments[0].channels.some(row => row.channel === 'time_limits'));
    delete f.current.profilesV4.profiles.child.settings.timeLimitPolicy;
    f.session.ready = true; await controller.run({ wake: true });
    assert.equal((await controller.read()).managed[0].invalidated, true);
    assert.deepEqual((await queue.read()).enrollments, []);
    assert.equal(f.calls.sent.length, 0);
});

test('valid disabled time policy is queued as a newer update rather than retaining an older active budget', async t => {
    const f = fixture(t), { controller, queue } = f.instance();
    f.links[0].policy.allowedScopes = ['time_limits'];
    f.current.profilesV4.profiles.child.settings = { timeLimitPolicy: { enabled: true, timezone: 'UTC', dailyBudgetSeconds: 1800 } };
    await controller.setManaged('link-a', true);
    f.current.profilesV4.profiles.child.settings.timeLimitPolicy.enabled = false;
    await controller.run({ wake: true });
    const pending = await channel(queue);
    assert.equal(pending.payload.envelope.payload.enabled, false);
    assert.equal(pending.payload.envelope.revision, 2);
    assert.equal((await controller.read()).managed[0].invalidated, undefined);
});

test('malformed config fails closed instead of assuming an enrollment or overwriting it', async t => {
    const f = fixture(t), { controller } = f.instance();
    f.data[controllerApi.KEY] = { version: 1, managed: [{ enabled: true }], personal: [] };
    const before = clone(f.data);
    await assert.rejects(controller.run(), /preferences need review/);
    assert.deepEqual(f.data, before); assert.equal(f.calls.sent.length, 0);
});

test('combined enrollment capacity is checked before preference persistence', async t => {
    const f = fixture(t);
    const state = {version:1,managed:[],personal:Array.from({length:64},(_,i)=>({placeholder:i}))};
    f.data.ftDeviceAutoSyncV1 = clone(state);
    await assert.rejects(f.instance().controller.setManaged('link-a',true),/preferences need review/i);
    assert.deepEqual(f.data.ftDeviceAutoSyncV1,state);
    assert.equal(f.calls.signed.length,0);
});
