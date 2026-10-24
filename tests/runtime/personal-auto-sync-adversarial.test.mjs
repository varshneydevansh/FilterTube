import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const protocol = require('../../js/personal_sync.js');
const runtime = require('../../js/personal_auto_sync_runtime.js');
const queues = require('../../js/auto_sync_queue.js');
const copy = value => structuredClone(value);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

// A real signed sender and durable receiver. Consent can pause while another
// authenticated message reaches the same production runtime instance.
async function receiver() {
    const pair = () => webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    const [left, right] = await Promise.all([pair(), pair()]);
    const [localPublicKeyJwk, remotePublicKeyJwk, privateKeyJwk] = await Promise.all([
        webcrypto.subtle.exportKey('jwk', right.publicKey), webcrypto.subtle.exportKey('jwk', left.publicKey),
        webcrypto.subtle.exportKey('jwk', right.privateKey)
    ]);
    const grant = protocol.normalizeGrant({ enabled: true, localDeviceId: 'receiver-device', localProfileId: 'receiver-account',
        remoteDeviceId: 'sender-device', remoteProfileId: 'sender-account', localGrantId: 'receiver-grant', remoteGrantId: 'sender-grant',
        localGeneration: 1, remoteGeneration: 1, localPublicKeyJwk, remotePublicKeyJwk, areas: ['settings'] });
    const senderGrant = protocol.normalizeGrant({ ...grant, localDeviceId: grant.remoteDeviceId, localProfileId: grant.remoteProfileId,
        remoteDeviceId: grant.localDeviceId, remoteProfileId: grant.localProfileId, localGrantId: grant.remoteGrantId,
        remoteGrantId: grant.localGrantId, localPublicKeyJwk: remotePublicKeyJwk, remotePublicKeyJwk: localPublicKeyJwk });
    const profile = { type: 'account', security: {}, main: { channels: ['UClocal'] }, settings: { hideShorts: false }, kids: {} };
    const root = { activeProfileId: grant.localProfileId, profiles: { [grant.localProfileId]: profile } };
    const peer = { linkId: 'verified-link', createdAt: 'fixed', linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer', remoteDeviceId: grant.remoteDeviceId };
    const security = (value, id) => {
        if (value.activeProfileId !== id || value.profiles[id]?.type !== 'account') throw Error('access changed');
        return JSON.stringify(value.profiles[id].security);
    };
    const state = { root, links: [peer], rows: [{ grant, privateKeyJwk, confirmed: true,
        securityFingerprint: security(root, grant.localProfileId), peerBinding: protocol.peerBinding([peer], grant.remoteDeviceId),
        sequence: 0, lastSequence: 0, lastRemoteSettings: { settings: { hideShorts: false }, main: { channels: [] }, kids: {} }, received: [] }], sent: [] };
    const data = {}; let lock = Promise.resolve(), rowLock = Promise.resolve(), receiveLock = Promise.resolve();
    const queue = queues.create({ get: async () => copy(data), set: async value => Object.assign(data, copy(value)),
        withLock: work => { const result = lock.then(work); lock = result.catch(() => {}); return result; } });
    const session = { client: {}, ready: true, remoteDeviceId: grant.remoteDeviceId, remoteProfileId: grant.remoteProfileId,
        remoteProfileType: 'account', role: 'peer', remoteRole: 'peer', autoSyncVersion: 1 };
    state.start = applySettings => runtime.create({ protocol, crypto: webcrypto, queue, security,
        withReceiveLock: state.omitReceiveLock ? undefined : (_id, work) => {
            state.lockRequested?.();
            const result = receiveLock.then(work); receiveLock = result.catch(() => {}); return result;
        },
        context: async () => ({ profilesV4: copy(root), links: copy(state.links), deviceId: grant.localDeviceId, unlocked: true }),
        session: () => ({ ...session }), read: async () => copy(state.rows),
        mutate: fn => { const result = rowLock.then(() => { state.rows = copy(fn(copy(state.rows))); }); rowLock = result.catch(() => {}); return result; },
        authorize: async row => root.activeProfileId === row.grant.localProfileId && state.rows.some(value => JSON.stringify(value.grant) === JSON.stringify(row.grant)),
        confirm: async () => { await state.confirm?.(); return true; }, send: async message => state.sent.push(copy(message)),
        applySettings: applySettings || (async (id, snapshot, beforeCheck, expected) => {
            if (!await beforeCheck()) throw Error('access changed');
            assert.deepEqual(protocol.snapshotSettings(root.profiles[id]), expected);
            root.profiles[id] = protocol.applySettings(root.profiles[id], snapshot);
        }), notesRead: async () => { throw Error('not selected'); }, notesMerge: async () => { throw Error('not selected'); }
    });
    state.controller = state.start();
    state.message = (sequence, channels, hideShorts = false) => protocol.create({ crypto: webcrypto }).sign(senderGrant,
        { settings: { main: { channels }, settings: { hideShorts }, kids: {} } },
        { sequence, messageId: 'message-' + sequence, privateKey: left.privateKey });
    return state;
}

test('a pending conflict decision cannot overwrite a newer authenticated update or roll its sequence backward', async () => {
    const state = await receiver(), entered = deferred(), release = deferred();
    await state.controller.receive(await state.message(1, ['UCremote']));
    assert.ok(state.rows[0].conflict);
    state.confirm = async () => { entered.resolve(); await release.promise; };
    const decision = state.controller.resolve('receiver-grant', 'remote');
    await entered.promise;
    await state.controller.receive(await state.message(2, ['UClocal'], true));
    assert.equal(state.rows[0].lastSequence, 2);
    release.resolve();
    await decision.catch(() => {}); // A stale decision may explicitly fail closed.
    assert.equal(state.rows[0].lastSequence, 2, 'the latest applied sequence must never decrease');
    assert.equal(state.root.profiles['receiver-account'].settings.hideShorts, true);
    assert.deepEqual(state.root.profiles['receiver-account'].main.channels, ['UClocal']);
});

test('revoking the verified link while a conflict modal is open denies the decision', async () => {
    const state = await receiver(), entered = deferred(), release = deferred();
    await state.controller.receive(await state.message(1, ['UCremote']));
    state.confirm = async () => { entered.resolve(); await release.promise; };
    const decision = state.controller.resolve('receiver-grant', 'remote'); await entered.promise;
    state.links[0].revoked = true; release.resolve();
    await assert.rejects(decision);
    assert.equal(state.rows[0].lastSequence, 0);
    assert.deepEqual(state.root.profiles['receiver-account'].main.channels, ['UClocal']);
});

test('a replacement conflict needs its own consent while the previous modal is open', async () => {
    const state = await receiver(), entered = deferred(), release = deferred();
    await state.controller.receive(await state.message(1, ['UCfirst']));
    state.confirm = async () => { entered.resolve(); await release.promise; };
    const decision = state.controller.resolve('receiver-grant', 'remote'); await entered.promise;
    await state.controller.receive(await state.message(2, ['UCsecond']));
    assert.equal(state.rows[0].conflict.message.sequence, 2);
    release.resolve(); await assert.rejects(decision, /changed|review/i);
    assert.equal(state.rows[0].lastSequence, 0);
    assert.equal(state.rows[0].conflict.message.sequence, 2);
    assert.deepEqual(state.root.profiles['receiver-account'].main.channels, ['UClocal']);
});

test('overlapping conflict decisions cannot both mutate the same receive revision', async () => {
    const state = await receiver(), entered = deferred(), release = deferred();
    await state.controller.receive(await state.message(1, ['UCremote']));
    let waiting = 0;
    state.confirm = async () => { if (++waiting === 2) entered.resolve(); await release.promise; };
    const first = state.controller.resolve('receiver-grant', 'remote');
    const second = state.controller.resolve('receiver-grant', 'local');
    await entered.promise; release.resolve();
    const results = await Promise.allSettled([first, second]);
    assert.equal(results.filter(value => value.status === 'fulfilled').length, 1);
    assert.equal(state.rows[0].lastSequence, 1);
    assert.equal(state.rows[0].received.length, 1);
});

test('the production dashboard settings writer rejects a nonthrowing failed IO write', async () => {
    const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
    const marker = '            applySettings: ';
    const start = source.indexOf(marker, source.indexOf('async function initializeDeviceAutoSync()')) + marker.length;
    const end = source.indexOf('\n            checkIncoming:', start);
    assert.ok(start > marker.length && end > start, 'evaluate the actual production callback');
    const callback = source.slice(start, end).trim().replace(/,$/, '');
    const root = { activeProfileId: 'own', profiles: { own: { type: 'account', settings: { enabled: true }, main: {}, kids: {} } } };
    let attempted = 0;
    const sandbox = { refreshFilterTubeUiAfterNanahImport: async () => {}, window: {
        FilterTubeNanahStorageLock: { run: work => work() }, FilterTubePersonalSync: protocol,
        FilterTubeDeviceAutoSync: require('../../js/device_auto_sync.js'),
        FilterTubeIO: { loadProfilesV4: async () => copy(root), saveProfilesV4: async () => {
            attempted++; return { ok: false, error: { message: 'QUOTA_BYTES quota exceeded' } };
        } }
    } };
    const apply = vm.runInNewContext('(' + callback + ')', sandbox);
    const baseline = protocol.snapshotSettings(root.profiles.own), remote = copy(baseline); remote.settings.enabled = false;
    await assert.rejects(apply('own', remote, async () => true, baseline), /storage|save|write|quota/i);
    assert.equal(attempted, 1);
    assert.equal(root.profiles.own.settings.enabled, true);
});

test('two dashboards cannot confirm a newer sequence while an older conflict has overwritten its settings', async () => {
    const state = await receiver();
    const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
    const marker = '            applySettings: ';
    const start = source.indexOf(marker, source.indexOf('async function initializeDeviceAutoSync()')) + marker.length;
    const end = source.indexOf('\n            checkIncoming:', start);
    const callback = source.slice(start, end).trim().replace(/,$/, '');
    let profileLock = Promise.resolve();
    const lock = { run: work => { const result = profileLock.then(work); profileLock = result.catch(() => {}); return result; } };
    const newerWritten = deferred(), olderQueued = deferred(), releaseNewer = deferred();
    let olderWrites = 0;
    const writer = asyncRefresh => vm.runInNewContext('(' + callback + ')', {
        refreshFilterTubeUiAfterNanahImport: asyncRefresh,
        window: { FilterTubeNanahStorageLock: lock, FilterTubePersonalSync: protocol,
            FilterTubeDeviceAutoSync: require('../../js/device_auto_sync.js'),
            FilterTubeIO: { loadProfilesV4: async () => copy(state.root), saveProfilesV4: async value => {
                state.root.profiles = copy(value.profiles); state.root.activeProfileId = value.activeProfileId; return { ok: true };
            } }
        }
    });
    const older = state.start(writer(async () => { olderWrites++; }));
    const newer = state.start(writer(async () => { newerWritten.resolve(); await releaseNewer.promise; }));
    await older.receive(await state.message(1, ['UCremote']));
    const newDelivery = newer.receive(await state.message(2, ['UClocal'], true));
    await newerWritten.promise;
    state.lockRequested = () => olderQueued.resolve();
    const oldDecision = older.resolve('receiver-grant', 'remote');
    const oldOutcome = oldDecision.catch(error => error);
    await olderQueued.promise;
    releaseNewer.resolve(); await newDelivery;
    assert.match((await oldOutcome).message, /changed|review|stale/i);
    assert.equal(olderWrites, 0, 'older decision must not write while another dashboard owns the receive transaction');
    assert.equal(state.rows[0].lastSequence, 2);
    assert.equal(state.sent.some(message => message.schema === runtime.ACK && message.sequence === 2 && message.status === 'applied'), true);
    assert.equal(state.root.profiles['receiver-account'].settings.hideShorts, true, 'Applied sequence 2 must match the persisted profile');
    assert.deepEqual(state.root.profiles['receiver-account'].main.channels, ['UClocal']);
});

test('a newer delivery queued behind an older decision applies after its metadata commits', async () => {
    const state = await receiver(), written = deferred(), release = deferred(), queued = deferred();
    const older = state.start(async (id, snapshot, beforeCheck, expected) => {
        if (!await beforeCheck()) throw Error('access changed');
        assert.deepEqual(protocol.snapshotSettings(state.root.profiles[id]), expected);
        state.root.profiles[id] = protocol.applySettings(state.root.profiles[id], snapshot);
        written.resolve(); await release.promise;
    });
    await older.receive(await state.message(1, ['UCremote']));
    const decision = older.resolve('receiver-grant', 'remote'); await written.promise;
    state.lockRequested = () => queued.resolve();
    const newer = state.start(), delivery = newer.receive(await state.message(2, ['UCremote'], true));
    await queued.promise; release.resolve(); await Promise.all([decision, delivery]);
    assert.equal(state.rows[0].lastSequence, 2);
    assert.deepEqual(state.rows[0].received.map(value => value.sequence), [1, 2]);
    assert.equal(state.root.profiles['receiver-account'].settings.hideShorts, true);
    assert.deepEqual(state.root.profiles['receiver-account'].main.channels, ['UCremote']);
});

test('a missing secure receive lock fails closed before applying settings or signing Applied', async () => {
    const state = await receiver(); state.omitReceiveLock = true; state.controller = state.start();
    await assert.rejects(state.controller.receive(await state.message(1, ['UClocal'], true)), /locking.*unavailable/i);
    assert.equal(state.rows[0].lastSequence, 0);
    assert.equal(state.root.profiles['receiver-account'].settings.hideShorts, false);
    assert.equal(state.sent.some(message => message.status === 'applied'), false);
});
