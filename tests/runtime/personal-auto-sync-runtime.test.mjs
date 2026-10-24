import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const require = createRequire(import.meta.url);
const protocol = require('../../js/personal_sync.js');
const runtime = require('../../js/personal_auto_sync_runtime.js');
const queueAPI = require('../../js/auto_sync_queue.js');
const notesAPI = require('../../js/video_notes_store.js');
const notes = require('../../js/shared/saved_video_notes.js');
const copy = value => structuredClone(value);
const videoId = 'abcdefghijk';
function fixture() {
    let clock = 10000;
    const states = ['a', 'b'].map(name => {
        const id = 'profile-' + name, remote = name === 'a' ? 'b' : 'a';
        const state = { name, id, personal: [], data: {}, sent: [], confirms: [], confirm: true, unlocked: true,
            profilesV4: { schemaVersion: 4, activeProfileId: id, profiles: {
                [id]: { type: 'account', parentProfileId: null, security: { pinVerifier: 'local-' + name },
                    settings: { hideShorts: false }, main: { channels: [] }, kids: {} },
                child: { type: 'child', parentProfileId: id, settings: {}, main: {}, kids: {} }
            } }, links: [{ linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer', remoteDeviceId: 'device-' + remote }],
            session: { client: {}, ready: true, remoteDeviceId: 'device-' + remote, remoteProfileId: 'profile-' + remote,
                remoteProfileType: 'account', role: 'peer', remoteRole: 'peer', autoSyncVersion: 1 } };
        const security = (root, profileId) => {
            const profile = root.profiles[profileId];
            if (!profile || root.activeProfileId !== profileId || profile.type !== 'account' || profile.parentProfileId) throw Error('profile denied');
            return JSON.stringify([profileId, profile.type, profile.security]);
        };
        const get = async keys => Object.fromEntries(keys.filter(key => key in state.data).map(key => [key, copy(state.data[key])]));
        const set = async update => Object.assign(state.data, copy(update));
        let queueLock = Promise.resolve(), configLock = Promise.resolve();
        state.queue = queueAPI.create({ get, set, now: () => clock, retryMs: 100, withLock: work => {
            const result = queueLock.then(work); queueLock = result.catch(() => {}); return result;
        } });
        const authorize = async row => {
            await state.authorizeHook?.(row);
            const current = state.personal.find(value => value.grant.localGrantId === row.grant.localGrantId);
            try { return !!current && current.grant.enabled && state.unlocked
                && JSON.stringify(row.grant) === JSON.stringify(current.grant)
                && current.securityFingerprint === security(state.profilesV4, current.grant.localProfileId); }
            catch (_) { return false; }
        };
        state.notes = notesAPI.create({ get, set, randomId: () => 'writer-' + name,
            authorize: async (key, scope) => scope === 'editor' && key.profileId === state.id,
            authorizeSync: async (profileId, scope) => {
                const row = state.personal.find(value => value.grant.localGrantId === scope.grantId);
                return !!row && row.grant.areas.includes('notes') && row.grant.localProfileId === profileId && await authorize(row);
            } });
        state.start = () => runtime.create({ crypto: webcrypto, protocol,
            context: async () => ({ profilesV4: copy(state.profilesV4), deviceId: 'device-' + name, links: copy(state.links), unlocked: state.unlocked }),
            session: () => ({ ...state.session }), security, authorize, queue: state.queue,
            read: async () => copy(state.personal), mutate: fn => {
                const result = configLock.then(() => { state.personal = copy(fn(copy(state.personal))); });
                configLock = result.catch(() => {}); return result;
            },
            send: async (message, captured) => {
                if (!state.session.ready || captured.client !== state.session.client) throw Error('connection lost');
                state.sent.push(copy(message)); await state.sendHook?.(message);
                return state.peer.controller.receive(copy(message));
            },
            confirm: async request => { state.confirms.push(copy(request)); await state.confirmHook?.(); return state.confirm; },
            notesRead: (profileId, grantId) => state.notes.syncRead(profileId, { grantId }),
            notesMerge: (profileId, envelope, grantId) => state.notes.syncMerge(profileId, envelope, { grantId }),
            applySettings: async (profileId, snapshot, beforeCheck) => {
                await state.applyHook?.();
                if (!await beforeCheck()) throw Error('access changed');
                state.profilesV4.profiles[profileId] = protocol.applySettings(state.profilesV4.profiles[profileId], snapshot);
            }, now: () => clock
        });
        state.controller = state.start();
        state.readNote = () => state.notes.read({ profileId: id, videoId }, 'editor');
        state.saveNote = async text => state.notes.save({ profileId: id, videoId }, await state.readNote(), text, 'editor');
        state.profile = () => state.profilesV4.profiles[id];
        return state;
    });
    const [a, b] = states; a.peer = b; b.peer = a;
    return { a, b, advance: () => { clock += 1000000; },
        enroll: async (areas = { settings: true, notes: true }) => a.controller.request(areas),
        cycle: async () => { await a.queue.wake(); await b.queue.wake(); await a.controller.run(); await b.controller.run(); } };
}
test('explicit consent on both verified account profiles enrolls exact reciprocal grants and no private keys leave the device', async () => {
    const { a, b, enroll } = fixture(); await enroll();
    assert.equal(a.personal.length, 1); assert.equal(b.personal.length, 1);
    const ga = a.personal[0].grant, gb = b.personal[0].grant;
    assert.equal(ga.localGrantId, gb.remoteGrantId); assert.equal(ga.remoteGrantId, gb.localGrantId);
    assert.equal(ga.localProfileId, 'profile-a'); assert.equal(gb.localProfileId, 'profile-b');
    assert.equal(a.confirms.length, 1); assert.equal(b.confirms.length, 1);
    assert.ok(a.personal[0].privateKeyJwk.d); assert.ok(b.personal[0].privateKeyJwk.d);
    assert.equal(JSON.stringify([...a.sent, ...b.sent]).includes('"d":'), false);
});
test('receiver decline, unverified peer and child sessions cannot silently enroll', async () => {
    for (const denial of ['decline', 'untrusted', 'child', 'phrase', 'version']) {
        const { a, b, enroll } = fixture();
        if (denial === 'decline') b.confirm = false;
        if (denial === 'untrusted') a.links = [];
        if (denial === 'child') { a.profilesV4.activeProfileId = 'child'; a.session.remoteProfileType = 'child'; }
        if (denial === 'phrase') a.session.ready = false;
        if (denial === 'version') a.session.autoSyncVersion = 0;
        if (denial === 'decline') await enroll(); else await assert.rejects(enroll());
        assert.equal(a.personal.length, 0); assert.equal(b.personal.length, 0);
    }
});
test('profile, PIN-security or client changes during either enrollment approval abort persistence', async () => {
    for (const location of ['source', 'receiver']) for (const change of ['profile', 'security', 'client']) {
        const { a, b, enroll } = fixture(); const selected = location === 'source' ? a : b;
        selected.confirmHook = async () => {
            if (change === 'profile') selected.profilesV4.activeProfileId = 'child';
            if (change === 'security') selected.profile().security.pinVerifier = 'changed';
            if (change === 'client') selected.session.client = {};
        };
        await assert.rejects(enroll()); assert.equal(a.personal.length, 0); assert.equal(b.personal.length, 0);
    }
});
test('unsolicited or expired acceptances cannot create source grants', async () => {
    const { a, b, enroll, advance } = fixture();
    b.sendHook = async message => { if (message.schema === runtime.ACCEPT) advance(); };
    await enroll(); assert.equal(a.personal.length, 0); assert.equal(b.personal.length, 1);
    const accept = b.sent.find(value => value.schema === runtime.ACCEPT);
    a.controller = a.start(); await a.controller.receive(accept); assert.equal(a.personal.length, 0);
});
test('settings and notes synchronize with signed Applied receipts and survive controller restart', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll();
    a.profile().settings.hideShorts = true; await a.saveNote('हिन्दी 🎵\n1:30 A note');
    await f.cycle();
    assert.equal(b.profile().settings.hideShorts, true);
    assert.equal((await b.readNote()).versions[0].text, 'हिन्दी 🎵\n1:30 A note');
    assert.equal(a.profile().security.pinVerifier, 'local-a'); assert.equal(b.profile().security.pinVerifier, 'local-b');
    const queue = await a.queue.read(); assert.equal(queue.enrollments[0].channels[0].status, 'applied');
    assert.equal((await a.controller.view())[0].status, 'Up to date');
    a.controller = a.start(); b.controller = b.start();
    b.profile().settings.disableAutoplay = true; await b.saveNote('After restart'); await f.cycle();
    assert.equal(a.profile().settings.disableAutoplay, true); assert.equal((await a.readNote()).versions[0].text, 'After restart');
});
test('offline changes remain queued with monotonic reserved sequence and exchange on reconnect after restart', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll();
    a.session.ready = false; b.session.ready = false;
    a.profile().settings.hideShorts = true; await a.saveNote('While offline');
    await a.controller.run();
    const initial = (await a.queue.read()).enrollments[0].channels[0];
    assert.equal(initial.status, 'waiting'); assert.equal(initial.reason, 'waiting_for_device');
    assert.equal(b.profile().settings.hideShorts, false); assert.equal(await b.readNote(), null);
    a.controller = a.start(); b.controller = b.start(); f.advance();
    a.session.ready = true; b.session.ready = true; await f.cycle();
    assert.equal(b.profile().settings.hideShorts, true); assert.equal((await b.readNote()).versions[0].text, 'While offline');
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'applied');
    assert.equal(a.personal[0].sequence, initial.payload.envelope.sequence);
});
test('successive offline changes coalesce the pending snapshot without reusing its signed sequence', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll(); a.session.ready = false;
    await a.saveNote('First'); await a.controller.run();
    const first = (await a.queue.read()).enrollments[0].channels[0].payload.envelope;
    await a.saveNote('Second'); await a.controller.run();
    const second = (await a.queue.read()).enrollments[0].channels[0].payload.envelope;
    assert.ok(second.sequence > first.sequence); assert.notEqual(second.messageId, first.messageId);
    a.session.ready = true; await f.cycle(); assert.equal((await b.readNote()).versions[0].text, 'Second');
});
test('filter removals propagate; simultaneous independent field edits merge without overwriting either', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll(); await f.cycle();
    a.profile().main.channels.push({ id: 'UC123' }); await f.cycle(); assert.deepEqual(b.profile().main.channels, [{ id: 'UC123' }]);
    a.profile().main.channels = []; await f.cycle(); assert.deepEqual(b.profile().main.channels, []);
    a.profile().settings.hideShorts = true; b.profile().settings.disableAutoplay = true; await f.cycle(); await f.cycle();
    assert.deepEqual(a.profile().settings, b.profile().settings);
    assert.equal(a.profile().settings.hideShorts, true); assert.equal(a.profile().settings.disableAutoplay, true);
});
test('conflicting rule arrays stop before Notes apply and require explicit review', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll(); await f.cycle();
    a.profile().main.channels = [{ id: 'UCA' }]; b.profile().main.channels = [{ id: 'UCB' }];
    await a.saveNote('Wait for settings review'); await a.queue.wake(); await a.controller.run();
    assert.deepEqual(b.profile().main.channels, [{ id: 'UCB' }]); assert.equal(await b.readNote(), null);
    assert.equal((await b.controller.view())[0].needsReview, true);
    assert.equal((await a.controller.view())[0].status, 'Needs review');
    await b.controller.resolve(b.personal[0].grant.localGrantId, 'remote');
    assert.deepEqual(b.profile().main.channels, [{ id: 'UCA' }]);
    assert.equal((await b.readNote()).versions[0].text, 'Wait for settings review');
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'applied');
});
test('offline note edit/delete convergence retains both heads and stale replay cannot resurrect deletion', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll({ notes: true });
    await a.saveNote('Original'); await f.cycle();
    const original = a.sent.find(value => value.schema === protocol.MESSAGE_SCHEMA);
    await a.saveNote(null); await f.cycle(); assert.equal((await b.readNote()).versions[0].text, null);
    await b.controller.receive(original); assert.equal((await b.readNote()).versions[0].text, null);
    await a.saveNote('Restored'); await f.cycle();
    await a.saveNote(null); await b.saveNote('Offline edit'); await f.cycle(); await f.cycle();
    assert.deepEqual(new Set((await a.readNote()).versions.map(value => value.text)), new Set([null, 'Offline edit']));
    assert.deepEqual(await a.readNote(), { ...(await b.readNote()), profileId: a.id });
});
test('disable and saved-peer revocation prevent queued updates after reconnect', async () => {
    for (const action of ['disable', 'unlink']) {
        const f = fixture(); const { a, b } = f; await f.enroll(); a.session.ready = false;
        await a.saveNote('Never deliver'); await a.controller.run();
        if (action === 'disable') await a.controller.disable(a.personal[0].grant.localGrantId);
        else a.links[0].revoked = true;
        a.session.ready = true; f.advance(); await a.queue.wake(); await a.controller.run();
        assert.equal(await b.readNote(), null);
        if (action === 'disable') assert.equal((await a.queue.read()).enrollments.length, 0);
    }
});
test('authority change during application prevents settings and Notes writes and cannot produce Applied', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll();
    a.profile().settings.hideShorts = true; await a.saveNote('Denied');
    b.applyHook = async () => { b.profile().security.pinVerifier = 'new-policy'; };
    await a.controller.run();
    assert.equal(b.profile().settings.hideShorts, false); assert.equal(await b.readNote(), null);
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'waiting');
    assert.equal(b.sent.some(value => value.schema === runtime.ACK && value.status === 'applied'), false);
});
test('tampered payloads and receipts cannot apply changes or acknowledge an unrelated pending message', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll(); await a.saveNote('Signed');
    await a.controller.run(); const message = a.sent.find(value => value.schema === protocol.MESSAGE_SCHEMA);
    const wrong = copy(message); wrong.payload.notes.entries[0].versions[0].text = 'Tampered';
    await assert.rejects(b.controller.receive(wrong)); assert.equal((await b.readNote()).versions[0].text, 'Signed');
    const ack = b.sent.find(value => value.schema === runtime.ACK); const forged = copy(ack); forged.messageId = 'other-message';
    await assert.rejects(a.controller.receive(forged));
    const wrongProfile = copy(message); wrongProfile.targetProfileId = 'child'; await assert.rejects(b.controller.receive(wrongProfile));
});
test('lost confirmations remain waiting and a delayed old signed confirmation cannot confirm a newer queued update', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll({ notes: true });
    let delayed;
    b.sendHook = async message => { if (message.schema === runtime.ACK) { delayed = copy(message); throw Error('confirmation connection lost'); } };
    await a.saveNote('First'); await a.controller.run();
    assert.equal((await b.readNote()).versions[0].text, 'First');
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'waiting');
    a.session.ready = false; await a.saveNote('Second'); await a.controller.run();
    const latest = (await a.queue.read()).enrollments[0].channels[0];
    assert.ok(latest.payload.envelope.sequence > delayed.sequence);
    a.session.ready = true; b.sendHook = null;
    await a.controller.receive(delayed);
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'waiting');
    await f.cycle(); assert.equal((await b.readNote()).versions[0].text, 'Second');
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'applied');
});
test('a missing Applied confirmation is recovered by duplicate authenticated delivery after restart', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll({ notes: true });
    b.sendHook = async message => { if (message.schema === runtime.ACK) throw Error('confirmation lost'); };
    await a.saveNote('Apply once'); await a.controller.run();
    const applied = await b.readNote();
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'waiting');
    a.controller = a.start(); b.controller = b.start(); b.sendHook = null; f.advance();
    await a.queue.wake(); await a.controller.run();
    assert.deepEqual(await b.readNote(), applied);
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'applied');
});
test('receiver revocation during an in-flight update prevents settings and Notes application', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll();
    a.profile().settings.hideShorts = true; await a.saveNote('Do not write');
    b.applyHook = async () => { b.personal[0].grant.enabled = false; };
    await a.controller.run();
    assert.equal(b.profile().settings.hideShorts, false); assert.equal(await b.readNote(), null);
    assert.equal((await a.queue.read()).enrollments[0].channels[0].status, 'waiting');
});
test('different initial settings are exposed for review rather than overwriting either device', async () => {
    const f = fixture(); const { a, b } = f; a.profile().settings.hideShorts = true;
    await f.enroll({ settings: true }); await f.cycle();
    assert.equal(a.profile().settings.hideShorts, true); assert.equal(b.profile().settings.hideShorts, false);
    assert.equal((await a.controller.view())[0].status, 'Needs review');
    assert.equal((await b.controller.view())[0].status, 'Needs review');
});
test('a profile switch never redirects incoming settings or Notes to a child or sibling', async () => {
    const f = fixture(); const { a, b } = f; await f.enroll(); b.profilesV4.activeProfileId = 'child';
    a.profile().settings.hideShorts = true; await a.saveNote('No child writes'); await a.controller.run();
    assert.deepEqual(b.profilesV4.profiles.child.settings, {}); assert.equal(b.profile().settings.hideShorts, false);
    assert.equal(b.data[notesAPI.DATA_KEY], undefined);
});
