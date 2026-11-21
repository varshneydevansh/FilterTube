import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture, fakeRelay } from './helpers/managed-sync-fixtures.mjs';

// Spec §14.4 (Android ec74d1add, Pixel run 7): the first Send after a re-pair is delivered first time.
const require = createRequire(import.meta.url);
const Receiver = require('../../js/managed_update_receiver.js');
const Sync = require('../../js/managed_sync_background.js');
const Doorbell = require('../../js/managed_doorbell.js');
const Courier = require('../../js/managed_courier.js');
const Auth = require('../../js/managed_seamless_auth.js');

function fakeApi(store, tabs = [{ id: 1, url: 'https://www.youtube.com/watch?v=abc', active: true }]) {
    const event = () => ({ addListener: () => {}, removeListener: () => {} });
    return {
        runtime: { id: 'ext', lastError: null, getURL: path => `chrome-extension://ext/${path}`, onMessage: event(), sendMessage: (_m, cb) => cb?.() },
        storage: { local: {
            get: (keys, cb) => { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = JSON.parse(JSON.stringify(store[key])); cb(out); },
            set: (values, cb) => { Object.assign(store, JSON.parse(JSON.stringify(values))); cb?.(); },
            remove: (_k, cb) => cb?.() }, onChanged: event() },
        tabs: { query: (_q, cb) => cb(tabs), get: (id, cb) => cb(tabs[0]), sendMessage: (_i, _m, cb) => cb?.(), onActivated: event(), onUpdated: event(), onRemoved: event() },
        alarms: { get: (_n, cb) => cb(undefined), create: (_n, _o, cb) => cb?.(), clear: (_n, cb) => cb?.(true), onAlarm: event() }
    };
}
const until = async (check, ms = 5000) => {
    const start = Date.now();
    while (!(await check())) { if (Date.now() - start > ms) throw new Error('timed out'); await new Promise(r => setTimeout(r, 10)); }
};

test('a Send warms one relay socket ahead of the announce', async () => {
    const relay = fakeRelay();
    let opened = 0;
    class Counting extends relay.WebSocketImpl { constructor(...args) { super(...args); opened += 1; } }
    globalThis.WebSocket = Counting;
    try {
        const child = await familyFixture();
        const store = { ftNanahDeviceId: 'parent-device', ftNanahTrustedLinks: [{ linkId: child.link.linkId, remoteDeviceId: 'child-device',
            linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', policy: {} }] };
        const sync = Sync.install({ api: fakeApi(store), Receiver, Doorbell, Courier, Auth, isTrustedUiSender: () => true });
        await sync.ready;
        const before = opened;
        await sync.handleMessage({ action: 'FilterTube_ManagedOutboxEnqueue', items: [{ item: await child.sealedItem() }] },
            { id: 'ext', url: 'chrome-extension://ext/html/tab-view.html' });
        await until(() => opened > before);
        sync.dispose();
    } finally { delete globalThis.WebSocket; }
});

test('the child announces once more when the answer does not come in time', async () => {
    const relay = fakeRelay();
    globalThis.WebSocket = relay.WebSocketImpl;
    try {
        const child = await familyFixture();
        child.store.ftInternetSyncConsentV1 = { accepted: true };
        // A parent that hears announces but never answers (its courier never starts).
        let heard = 0;
        const parent = Doorbell.listen({ ownDeviceId: 'parent-device', WebSocketImpl: relay.WebSocketImpl, timers: globalThis, onSignal: () => { heard += 1; } });
        const childReceiver = { ...Receiver, create: options => Receiver.create({ ...options, adapter: child.adapter, openSync: child.box.FilterTubeNanahManagedOpenSync }) };
        const sync = Sync.install({ api: fakeApi(child.store, []), Receiver: childReceiver, Doorbell, Courier, Auth, isTrustedUiSender: () => true, answerWaitMs: 150 });
        await until(() => relay.byCode.size >= 1);
        await sync.announceAll({ force: true });
        assert.equal(heard, 2, 'one announce, then one more after the timeout, and no more');
        parent.stop(); sync.dispose();
    } finally { delete globalThis.WebSocket; }
});

test('a repeat announce while the courier is still starting joins it and gets the same code', async () => {
    const relay = fakeRelay();
    let releaseHost;
    const hostGate = new Promise(resolve => { releaseHost = resolve; });
    let hosts = 0;
    class SlowHost {
        constructor() { hosts += 1; }
        async host(_session, hooks) { this.hooks = hooks; await hostGate; }
        async join() {}
        async confirmSas() {}
        async send() {}
        async close() {}
    }
    Object.assign(globalThis, { WebSocket: relay.WebSocketImpl, RTCPeerConnection: function () {}, FilterTubeNanah: { WebRtcDataChannelTransport: SlowHost } });
    try {
        const child = await familyFixture();
        const item = await child.sealedItem();
        const key = child.link.mailboxWrappingKeyBase64Url;
        const store = { ftNanahDeviceId: 'parent-device', ftInternetSyncConsentV1: { accepted: true },
            ftNanahTrustedLinks: [{ linkId: child.link.linkId, remoteDeviceId: 'child-device', linkType: 'managed_link', localRole: 'source',
                remoteRole: 'replica', mailboxWrappingKeyBase64Url: key, policy: {} }] };
        const sync = Sync.install({ api: fakeApi(store), Receiver, Doorbell, Courier, Auth, isTrustedUiSender: () => true });
        await sync.ready;
        await sync.handleMessage({ action: 'FilterTube_ManagedOutboxEnqueue', items: [{ item }] }, { id: 'ext', url: 'chrome-extension://ext/html/tab-view.html' });
        await until(() => relay.byCode.size >= 1);
        const announce = timeoutMs => Doorbell.call({ remoteDeviceId: 'parent-device', fromDeviceId: 'child-device', WebSocketImpl: relay.WebSocketImpl,
            timeoutMs, log: () => {},
            converse: async ({ send, next }) => {
                send(await Auth.signAnnounce(Doorbell.announceMessage('child-device', [child.link.linkId]), () => child.link, Date.now()));
                return { ok: true, answer: await next() };
            } });
        // The child's first wait ends before the courier hosts (the cold-start case), so it announces again.
        const first = await announce(200);
        assert.equal(first.ok, false);
        setTimeout(() => releaseHost(), 300);
        const second = await announce(4000);
        assert.equal(second.answer.type, 'ft_update_announce_answer');
        assert.match(second.answer.courier, /^ftcour-[a-z2-7]{26}$/);
        assert.equal(hosts, 1, 'joined the starting courier instead of replacing it');
        sync.dispose();
    } finally { delete globalThis.WebSocket; delete globalThis.RTCPeerConnection; delete globalThis.FilterTubeNanah; }
});
