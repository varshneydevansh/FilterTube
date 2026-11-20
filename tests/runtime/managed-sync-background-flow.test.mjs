import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture, fakeRelay } from './helpers/managed-sync-fixtures.mjs';

const require = createRequire(import.meta.url);
const Receiver = require('../../js/managed_update_receiver.js');
const Sync = require('../../js/managed_sync_background.js');
const Doorbell = require('../../js/managed_doorbell.js');
const Courier = require('../../js/managed_courier.js');

function fakeApi(store, tabs = [{ id: 1, url: 'https://www.youtube.com/watch?v=abc', active: true }], session = null) {
    const changed = [];
    const event = list => ({ addListener: fn => list.push(fn), removeListener: () => {} });
    const messages = [];
    return {
        runtime: { id: 'ext', lastError: null, getURL: path => `chrome-extension://ext/${path}`, onMessage: event(messages),
            sendMessage: (_message, callback) => callback?.() },
        storage: {
            local: {
                get: (keys, callback) => {
                    const out = {};
                    for (const key of [].concat(keys)) if (key in store) out[key] = JSON.parse(JSON.stringify(store[key]));
                    callback(out);
                },
                set: (values, callback) => { Object.assign(store, JSON.parse(JSON.stringify(values))); callback?.(); },
                remove: (key, callback) => { for (const k of [].concat(key)) delete store[k]; callback?.(); }
            },
            ...(session ? { session: { get: (keys, callback) => {
                const out = {};
                for (const key of [].concat(keys)) if (key in session) out[key] = JSON.parse(JSON.stringify(session[key]));
                callback(out);
            } } } : {}),
            onChanged: event(changed)
        },
        tabs: { query: (query, callback) => callback(query.url ? tabs : tabs), get: (id, callback) => callback(tabs.find(tab => tab.id === id)),
            sendMessage: (_id, _message, callback) => callback?.(), onActivated: event([]), onUpdated: event([]), onRemoved: event([]) },
        alarms: { get: (_name, callback) => callback(undefined), create: (_n, _o, callback) => callback?.(), clear: (_n, callback) => callback?.(true), onAlarm: event([]) },
        messages
    };
}

const until = async (check, ms = 5000) => {
    const start = Date.now();
    while (!(await check())) {
        if (Date.now() - start > ms) throw new Error('timed out');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
};

test('Send → ring → announce → courier → applied on the child and "applied" in the parent outbox', async () => {
    const relay = fakeRelay();
    const sides = [];
    class PairedTransport {
        constructor() { sides.push(this); }
        async host(session, hooks) { this.hooks = hooks; this.code = session.code; }
        async join(session, hooks) {
            this.hooks = hooks;
            const host = sides.find(side => side !== this && side.code === session.code && !side.peer);
            if (!host) { setTimeout(() => hooks.onError(new Error('session_not_found')), 0); return; }
            host.peer = this; this.peer = host;
            for (const side of [host, this]) setTimeout(() => side.hooks.onSas({ phrase: 'auto' }), 0);
        }
        async confirmSas() { this.confirmed = true; if (this.peer?.confirmed) for (const side of [this, this.peer]) side.hooks.onConnected(); }
        async send(envelope) { setTimeout(() => this.peer.hooks.onData(JSON.parse(JSON.stringify(envelope))), 0); }
        async close() {}
    }
    Object.assign(globalThis, { WebSocket: relay.WebSocketImpl, RTCPeerConnection: function () {}, FilterTubeNanah: { WebRtcDataChannelTransport: PairedTransport } });
    try {
        const child = await familyFixture({ activeProfileId: 'Child' });
        child.store.ftInternetSyncConsentV1 = { accepted: true };
        const item = await child.sealedItem({ revision: 5, word: 'creepy doll' });
        const parentStore = {
            ftNanahDeviceId: 'parent-device',
            ftInternetSyncConsentV1: { accepted: true },
            ftNanahTrustedLinks: [{ linkId: child.link.linkId, remoteDeviceId: 'child-device', deviceLabel: 'Kid tablet', linkType: 'managed_link',
                localRole: 'source', remoteRole: 'replica', policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'Child' } }]
        };
        const childReceiver = { ...Receiver, create: options => Receiver.create({ ...options, adapter: child.adapter, openSync: child.box.FilterTubeNanahManagedOpenSync }) };
        const common = { isTrustedUiSender: () => true, Doorbell, Courier };
        const childSync = Sync.install({ api: fakeApi(child.store), Receiver: childReceiver, ...common, getSelfControlSession: async () => null });
        const parentSync = Sync.install({ api: fakeApi(parentStore), Receiver, ...common });
        await Promise.all([childSync.ready, parentSync.ready]);
        await until(() => relay.byCode.size === 2);

        const queued = await parentSync.handleMessage({ action: 'FilterTube_ManagedOutboxEnqueue', items: [{ item, targetProfileName: 'Child' }] },
            { id: 'ext', url: 'chrome-extension://ext/html/tab-view.html' });
        assert.deepEqual(queued.uploadedMailboxItemIds, [item.mailboxItemId]);
        assert.equal(parentStore.ftManagedOutboxV1.entries[0].state, 'queued');
        assert.equal(JSON.stringify(parentStore.ftManagedOutboxV1).includes('creepy doll'), false, 'the outbox holds ciphertext only');

        await until(() => parentStore.ftManagedOutboxV1.entries[0].state !== 'queued');
        assert.equal(parentStore.ftManagedOutboxV1.entries[0].state, 'applied');
        assert.deepEqual(child.store.ftProfilesV4.profiles.Child.main.keywords.map(entry => entry.word), ['creepy doll']);
        assert.equal(child.store.ftManagedUpdateNotice.activeChanged, true);
        const kinds = relay.frames.filter(frame => frame.type === 'signal').map(frame => frame.payload?.type);
        for (const kind of ['ft_update_ring', 'ft_update_ring_answer', 'ft_update_announce', 'ft_update_announce_answer']) assert.ok(kinds.includes(kind), kind);
        for (const frame of relay.frames) assert.equal(JSON.stringify(frame).includes('ciphertext'), false, 'the relay never sees an item');
        childSync.dispose();
        parentSync.dispose();
    } finally {
        delete globalThis.WebSocket; delete globalThis.RTCPeerConnection; delete globalThis.FilterTubeNanah;
    }
});

test('a ring from a device that is not this child\'s parent gets no answer and starts nothing', async () => {
    const relay = fakeRelay();
    globalThis.WebSocket = relay.WebSocketImpl;
    try {
        const child = await familyFixture();
        child.store.ftInternetSyncConsentV1 = { accepted: true };
        const childReceiver = { ...Receiver, create: options => Receiver.create({ ...options, adapter: child.adapter, openSync: child.box.FilterTubeNanahManagedOpenSync }) };
        const childSync = Sync.install({ api: fakeApi(child.store), Receiver: childReceiver, isTrustedUiSender: () => true, Doorbell, Courier });
        await childSync.ready;
        await until(() => relay.byCode.size === 1);
        const result = await Doorbell.call({ remoteDeviceId: 'child-device', fromDeviceId: 'stranger', WebSocketImpl: relay.WebSocketImpl, timeoutMs: 600,
            converse: async ({ send, next }) => {
                send(Doorbell.ringMessage('stranger', [child.link.linkId]));
                return { ok: true, answer: await Promise.race([next(), new Promise(r => setTimeout(() => r(null), 300))]) };
            } });
        assert.notDeepEqual(result.answer, { type: 'ft_update_ring_answer', v: 1, ok: true });
        assert.equal(relay.frames.some(frame => frame.payload?.type === 'ft_update_ring_answer'), false);
        assert.equal(relay.frames.some(frame => frame.payload?.type === 'ft_update_announce'), false);
        childSync.dispose();
    } finally {
        delete globalThis.WebSocket;
    }
});

test('no doorbell without internet-sync consent or without an open YouTube tab', async () => {
    const relay = fakeRelay();
    globalThis.WebSocket = relay.WebSocketImpl;
    try {
        const child = await familyFixture();
        const noConsent = Sync.install({ api: fakeApi(child.store), Receiver, isTrustedUiSender: () => true, Doorbell, Courier });
        assert.deepEqual(await noConsent.reconcile(), { listening: false, open: true });
        child.store.ftInternetSyncConsentV1 = { accepted: true };
        const noTabs = Sync.install({ api: fakeApi(child.store, []), Receiver, isTrustedUiSender: () => true, Doorbell, Courier });
        assert.deepEqual(await noTabs.reconcile(), { listening: false, open: false });
        noConsent.dispose(); noTabs.dispose();
        assert.equal(relay.byCode.size, 0);
    } finally {
        delete globalThis.WebSocket;
    }
});

test('dashboard-only actions refuse web pages and content scripts', async () => {
    const child = await familyFixture();
    const sync = Sync.install({ api: fakeApi(child.store, []), Receiver, Doorbell, Courier,
        isTrustedUiSender: sender => String(sender?.url || '').startsWith('chrome-extension://ext/') });
    const fromPage = { id: 'ext', url: 'https://www.youtube.com/watch?v=x', tab: { id: 3 } };
    for (const action of ['FilterTube_ManagedOutboxEnqueue', 'FilterTube_ManagedPickupNow', 'FilterTube_CourierClaim', 'FilterTube_CourierItems', 'FilterTube_CourierDone']) {
        assert.equal(await sync.handleMessage({ action, items: [], jobId: 'x' }, fromPage), undefined, action);
    }
    sync.dispose();
});

test('the Internet Pickup token is read from session storage, never left in storage.local', async () => {
    const child = await familyFixture();
    const config = { endpointUrl: 'https://mailbox.example', authToken: 'secret-token' };
    const MailboxClient = { createProvider: cfg => (cfg?.authToken === 'secret-token'
        ? { configured: true, pullDecryptedMailboxItems: async () => ({ ok: true, items: [] }) } : null) };
    const trusted = { id: 'ext', url: 'chrome-extension://ext/html/tab-view.html' };
    child.store.ftManagedMailboxServerConfig = config;
    const fromLocal = Sync.install({ api: fakeApi(child.store, []), Receiver, Doorbell, Courier, MailboxClient, isTrustedUiSender: () => true });
    await fromLocal.ready;
    assert.equal('ftManagedMailboxServerConfig' in child.store, false, 'an old storage.local copy is removed');
    assert.equal((await fromLocal.handleMessage({ action: 'FilterTube_ManagedPickupNow' }, trusted)).ok, false);
    const fromSession = Sync.install({ api: fakeApi(child.store, [], { ftManagedMailboxServerConfig: config }), Receiver, Doorbell, Courier,
        MailboxClient, isTrustedUiSender: () => true });
    assert.equal((await fromSession.handleMessage({ action: 'FilterTube_ManagedPickupNow' }, trusted)).ok, true);
    assert.equal(JSON.stringify(child.store).includes('secret-token'), false);
    fromLocal.dispose(); fromSession.dispose();
});
