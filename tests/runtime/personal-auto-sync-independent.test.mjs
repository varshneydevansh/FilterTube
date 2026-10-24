import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const require = createRequire(import.meta.url);
const protocol = require('../../js/personal_sync.js');
const runtime = require('../../js/personal_auto_sync_runtime.js');
const queueAPI = require('../../js/auto_sync_queue.js');
const clone = value => structuredClone(value);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function network() {
    const invitations = []; let holdOffers = false;
    const endpoints = ['A', 'B'].map(name => {
        const remote = name === 'A' ? 'B' : 'A', id = 'profile-' + name;
        const state = { id, deviceId: 'device-' + name, rows: [], data: {}, unlocked: true, sent: [], confirmations: [],
            root: { activeProfileId: id, profiles: { [id]: { type: 'account', security: { localOnly: name },
                settings: { hideShorts: false, hideComments: false }, main: { channels: [] }, kids: {} } } },
            links: [{ linkId: 'peer-' + name + '-' + remote, createdAt: '2026-10-24T00:00:00.000Z',
                linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer', remoteDeviceId: 'device-' + remote }],
            session: { client: {}, ready: true, role: 'peer', remoteRole: 'peer', autoSyncVersion: 1,
                remoteDeviceId: 'device-' + remote, remoteProfileId: 'profile-' + remote, remoteProfileType: 'account' } };
        let lock = Promise.resolve(), mutation = Promise.resolve(), receiveLock = Promise.resolve();
        state.queue = queueAPI.create({ get: async keys => Object.fromEntries(keys.map(key => [key, state.data[key]])),
            set: async values => Object.assign(state.data, clone(values)), now: () => 10000,
            withLock: work => { const result = lock.then(work); lock = result.catch(() => {}); return result; } });
        const security = (root, profileId) => {
            const profile = root.profiles[profileId];
            if (!profile || root.activeProfileId !== profileId || profile.type !== 'account') throw Error('access changed');
            return JSON.stringify(profile.security);
        };
        state.profile = () => state.root.profiles[id];
        state.start = () => runtime.create({ protocol, crypto: webcrypto, queue: state.queue,
            withReceiveLock: (_id, work) => { const result = receiveLock.then(work); receiveLock = result.catch(() => {}); return result; },
            context: async () => { await state.contextHook?.(); return { profilesV4: clone(state.root), deviceId: state.deviceId, unlocked: state.unlocked, links: clone(state.links) }; },
            session: () => ({ ...state.session }), security,
            read: async () => clone(state.rows),
            mutate: fn => {
                const result = mutation.then(async () => { await state.mutateHook?.(); state.rows = clone(fn(clone(state.rows))); });
                mutation = result.catch(() => {}); return result;
            },
            authorize: async row => state.unlocked && state.root.activeProfileId === row.grant.localProfileId
                && security(state.root, row.grant.localProfileId) === row.securityFingerprint
                && state.rows.some(value => JSON.stringify(value.grant) === JSON.stringify(row.grant)),
            confirm: async proposal => { state.confirmations.push(clone(proposal)); await state.confirmHook?.(); return true; },
            send: async (message, captured) => {
                assert.equal(captured.client, state.session.client); state.sent.push(clone(message));
                if (await state.sendHook?.(message) === false) return;
                if (holdOffers && message.schema === runtime.OFFER) { invitations.push({ source: state, message: clone(message) }); return; }
                return state.peer.controller.receive(clone(message));
            },
            applySettings: async (profileId, snapshot, beforeCheck, expectedLocalSnapshot) => {
                await state.applyHook?.();
                if (!await beforeCheck()) throw Error('access changed');
                const latest = protocol.snapshotSettings(state.root.profiles[profileId]);
                // This models the root callback's proposed observed-base comparison.
                if (expectedLocalSnapshot && JSON.stringify(latest) !== JSON.stringify(expectedLocalSnapshot)) throw Error('local settings changed');
                state.root.profiles[profileId] = protocol.applySettings(state.root.profiles[profileId], snapshot);
            },
            notesRead: async () => { throw Error('Notes not selected'); }, notesMerge: async () => { throw Error('Notes not selected'); }
        });
        state.controller = state.start();
        return state;
    });
    const [a, b] = endpoints; a.peer = b; b.peer = a;
    return { a, b, invitations, holdOffers: () => { holdOffers = true; },
        deliver: item => item.source.peer.controller.receive(clone(item.message)),
        enroll: () => a.controller.request({ settings: true }),
        cycle: async () => { await a.queue.wake(); await b.queue.wake(); await a.controller.run(); await b.controller.run(); } };
}
test('simultaneous first invitations settle on one reciprocal grant instead of mismatched orphan grants', async () => {
    const n = network(); n.holdOffers();
    await Promise.all([n.a.controller.request({ settings: true }), n.b.controller.request({ settings: true })]);
    assert.equal(n.invitations.length, 2);
    const delivery = await Promise.allSettled(n.invitations.map(n.deliver));
    assert.equal(delivery.every(result => result.status === 'fulfilled'), true);
    assert.equal(n.a.rows.length, 1); assert.equal(n.b.rows.length, 1);
    const left = n.a.rows[0].grant, right = n.b.rows[0].grant;
    assert.equal(left.localGrantId, right.remoteGrantId); assert.equal(left.remoteGrantId, right.localGrantId);
});
test('a local edit made after merge observation is preserved and then merged on retry', async () => {
    const n = network(); await n.enroll();
    n.a.profile().settings.hideShorts = true;
    n.b.applyHook = async () => { n.b.profile().settings.hideComments = true; n.b.applyHook = null; };
    await n.a.controller.run();
    assert.equal(n.b.profile().settings.hideComments, true);
    assert.equal(n.b.profile().settings.hideShorts, false);
    await n.a.queue.wake(); await n.a.controller.run();
    assert.equal(n.b.profile().settings.hideComments, true); assert.equal(n.b.profile().settings.hideShorts, true);
});
test('a role change during source consent cannot publish an invitation or save a grant', async () => {
    const n = network(); n.a.confirmHook = async () => { n.a.session.role = 'source'; };
    await assert.rejects(n.enroll());
    assert.deepEqual(n.a.sent, []); assert.deepEqual(n.a.rows, []); assert.deepEqual(n.b.rows, []);
});
test('profile switching during enrollment storage cannot leave a newly approved grant', async () => {
    const n = network(); let once = false;
    n.b.mutateHook = async () => { if (!once) { once = true; n.b.root.activeProfileId = 'other-profile'; } };
    await assert.rejects(n.enroll());
    assert.deepEqual(n.a.rows, []); assert.deepEqual(n.b.rows, []);
});
test('lost initial acceptance remains unconfirmed and a fresh source invitation can repair it with receiver consent', async () => {
    const n = network(); n.b.sendHook = async message => message.schema === runtime.ACCEPT ? false : undefined;
    await n.enroll(); assert.equal(n.a.rows.length, 0); assert.equal(n.b.rows.length, 1);
    const orphan = n.b.rows[0].grant.localGrantId;
    assert.equal(n.b.rows[0].confirmed, false);
    assert.equal((await n.b.controller.view())[0].status, 'Waiting for other device approval');
    n.b.profile().settings.hideShorts = true; await n.b.controller.run();
    assert.equal(n.b.sent.some(message => message.schema === protocol.MESSAGE_SCHEMA), false);
    n.a.controller = n.a.start(); n.b.sendHook = null;
    await n.enroll(); assert.equal(n.a.rows.length, 1); assert.equal(n.b.rows.length, 1);
    assert.notEqual(n.b.rows[0].grant.localGrantId, orphan);
    assert.equal(n.a.rows[0].confirmed, true); assert.equal(n.b.rows[0].confirmed, false);
    await n.a.controller.run(); assert.equal(n.b.rows[0].confirmed, true);
});
test('unlink/re-pair cannot reactivate old personal consent or its queued private update', async () => {
    for (const observeMissing of [true, false]) {
        const n = network(); await n.enroll(); await n.cycle();
        n.a.session.ready = false; n.a.profile().settings.hideShorts = true; await n.a.controller.run();
        const peer = clone(n.a.links[0]);
        if (observeMissing) { n.a.links = []; await n.a.controller.run(); }
        n.a.links = [{ ...peer, linkId: peer.linkId + '-new', createdAt: '2026-10-24T00:01:00.000Z' }];
        n.a.session.ready = true; await n.a.queue.wake(); await n.a.controller.run();
        assert.deepEqual(n.a.rows, []); assert.deepEqual((await n.a.queue.read()).enrollments, []);
        assert.equal(n.b.profile().settings.hideShorts, false);
    }
});
test('another account or locked owner cannot disable a personal grant; switching accounts only pauses it', async () => {
    const n = network(); await n.enroll(); const id = n.a.rows[0].grant.localGrantId;
    n.a.root.profiles.other = { type: 'account', security: {} }; n.a.root.activeProfileId = 'other';
    await assert.rejects(n.a.controller.disable(id)); assert.equal(n.a.rows.length, 1);
    await n.a.controller.run(); assert.equal(n.a.rows.length, 1);
    n.a.root.activeProfileId = n.a.id; n.a.unlocked = false;
    await assert.rejects(n.a.controller.disable(id)); assert.equal(n.a.rows.length, 1);
    n.a.unlocked = true; await n.a.controller.disable(id); assert.deepEqual(n.a.rows, []);
});
test('personal rows and consent show friendly names while exact grant IDs remain the authority', async () => {
    const n = network(); n.a.profile().name = 'My laptop profile'; n.b.profile().name = 'My phone profile';
    n.a.session.remoteProfileName = 'My phone profile'; n.a.session.remoteDeviceLabel = 'My phone';
    n.b.session.remoteProfileName = 'My laptop profile'; n.b.session.remoteDeviceLabel = 'My laptop';
    await n.enroll();
    assert.equal((await n.a.controller.view())[0].label, 'My laptop profile ↔ My phone profile · My phone');
    assert.equal(n.a.confirmations[0].details[0], 'My laptop profile ↔ My phone profile · My phone');
    assert.equal(n.a.rows[0].grant.localProfileId, 'profile-A'); assert.equal(n.a.rows[0].grant.remoteProfileId, 'profile-B');
});
test('lost initial acceptance retries explicitly with the same invitation, keys and saved receiver consent', async () => {
    const n = network(); let drop = true;
    n.b.sendHook = async message => { if (message.schema === runtime.ACCEPT && drop) { drop = false; return false; } };
    await n.enroll(); assert.equal(n.a.rows.length, 0); assert.equal(n.b.rows.length, 1);
    const original = n.a.sent.find(message => message.schema === runtime.OFFER), receiverId = n.b.rows[0].grant.localGrantId;
    const originalAcceptance = n.b.sent.find(message => message.schema === runtime.ACCEPT);
    await n.enroll();
    assert.equal(n.a.rows.length, 1); assert.equal(n.b.rows.length, 1);
    assert.equal(n.b.rows[0].grant.localGrantId, receiverId);
    assert.deepEqual(n.a.sent.filter(message => message.schema === runtime.OFFER), [original, original]);
    assert.deepEqual(n.b.sent.filter(message => message.schema === runtime.ACCEPT), [originalAcceptance, originalAcceptance]);
    assert.equal(n.a.confirmations.length, 1); assert.equal(n.b.confirmations.length, 1);
    assert.equal(JSON.stringify([...n.a.sent, ...n.b.sent]).includes('"d":'), false);
    await n.a.controller.run(); assert.equal(n.b.rows[0].confirmed, true);
});
test('retry rechecks original profile security and refuses changed areas or changed invitation key', async () => {
    const n = network(); n.b.sendHook = async message => message.schema === runtime.ACCEPT ? false : undefined;
    await n.enroll(); const sent = n.a.sent.length, original = n.a.sent.find(message => message.schema === runtime.OFFER);
    n.a.profile().security.localOnly = 'changed'; await assert.rejects(n.enroll());
    assert.equal(n.a.sent.length, sent);
    n.a.profile().security.localOnly = 'A';
    await assert.rejects(n.a.controller.request({ notes: true })); assert.equal(n.a.sent.length, sent);
    const changedAreas = { ...clone(original), areas: ['notes'], initialSettings: null };
    await assert.rejects(n.b.controller.receive(changedAreas));
    const pair = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    const publicKeyJwk = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
    await assert.rejects(n.b.controller.receive({ ...clone(original), publicKeyJwk }));
    assert.equal(n.a.rows.length, 0); assert.equal(n.b.rows.length, 1); assert.equal(n.b.confirmations.length, 1);
});
test('overlapping identical acceptances adopt one grant without resetting it or failing the retry', async () => {
    const n = network(); n.b.sendHook = async message => message.schema === runtime.ACCEPT ? false : undefined;
    await n.enroll();
    const acceptance = n.b.sent.find(message => message.schema === runtime.ACCEPT);
    const entered = deferred(), release = deferred(), secondAtSave = deferred();
    n.a.mutateHook = async () => { entered.resolve(); await release.promise; };
    const first = n.a.controller.receive(clone(acceptance)); await entered.promise;
    n.a.contextHook = async () => { secondAtSave.resolve(); };
    const second = n.a.controller.receive(clone(acceptance)); await secondAtSave.promise; release.resolve();
    const result = await Promise.allSettled([first, second]);
    assert.equal(result.every(value => value.status === 'fulfilled'), true);
    assert.equal(n.a.rows.length, 1); assert.equal(n.a.rows[0].grant.localGrantId, n.b.rows[0].grant.remoteGrantId);
});
test('malformed or oversized latest settings pause old queued snapshots and valid repair resumes the current state', async () => {
    for (const malformed of [true, false]) {
        const n = network(); await n.enroll(); await n.cycle();
        n.a.session.ready = false; n.a.profile().settings.hideShorts = true; await n.a.controller.run();
        if (malformed) n.a.profile().settings.contentFilters = { views: { enabled: true, minViews: -1 } };
        else n.a.profile().main.channels = Array.from({ length: 8000 }, (_, index) => 'UC' + index + 'x'.repeat(80));
        const sent = n.a.sent.length;
        n.a.session.ready = true; await n.a.queue.wake(); await n.a.controller.run();
        assert.equal(n.a.rows[0].scanIssue, true); assert.equal(n.a.sent.length, sent);
        assert.equal(n.b.profile().settings.hideShorts, false);
        assert.equal((await n.a.controller.view())[0].status, 'Needs review');
        delete n.a.profile().settings.contentFilters; n.a.profile().main.channels = [];
        n.a.profile().settings.hideComments = true;
        await n.a.queue.wake(); await n.a.controller.run();
        assert.equal(n.a.rows[0].scanIssue, false);
        assert.equal(n.b.profile().settings.hideShorts, true); assert.equal(n.b.profile().settings.hideComments, true);
    }
});
