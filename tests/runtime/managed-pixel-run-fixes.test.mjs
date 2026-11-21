import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeRelay } from './helpers/managed-sync-fixtures.mjs';

// Real-Pixel run 6 (Android 1faed7705, ea46f60f5, cf9f6f882, e7bea951e; nanah 01aa172; spec §14).
const require = createRequire(import.meta.url);
const Courier = require('../../js/managed_courier.js');
const Doorbell = require('../../js/managed_doorbell.js');
const tabView = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const fn = name => {
    const start = tabView.search(new RegExp(`\\n    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return tabView.slice(start, tabView.indexOf('\n    }\n', start) + 7);
};

test('§14: a Send seals the whole bundle for a link that allows it, and each allowed area otherwise', () => {
    const box = { safeObject: v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}), safeArray: v => (Array.isArray(v) ? v : []),
        normalizeString: v => (typeof v === 'string' ? v.trim() : ''), normalizeNanahTrustedLink: link => link,
        getManagedTimeLimitPolicy: profile => profile?.timeLimit || null };
    vm.runInNewContext(['getNanahManagedPolicyScopeList', 'expandNanahManagedSendScope', 'getConcreteManagedPolicyScopesForProfile',
        'getNanahSavedUpdateScopes', 'buildNanahSendScopePlans'].map(fn).join('\n') + '\nthis.scopes = (...a) => JSON.stringify(getNanahSavedUpdateScopes(...a)); this.plans = buildNanahSendScopePlans;', box);
    box.scopesOf = (...a) => JSON.parse(box.scopes(...a));
    const link = (id, allowedScopes, defaultScope = allowedScopes[0]) => ({ linkId: id, policy: { allowedScopes, defaultScope } });
    // The run-6 link: concrete areas listed, defaultScope main. Kids must travel too.
    const accepted = link('accepted', ['main', 'kids', 'viewing_space', 'time_limits'], 'main');
    assert.deepEqual(box.scopesOf(accepted, 'active', {}), ['active']);
    assert.deepEqual(box.scopesOf(link('partial', ['main', 'kids']), 'active', {}), ['main', 'kids']);
    assert.deepEqual(box.scopesOf(link('kidsOnly', ['kids']), 'active', {}), ['kids']);
    assert.deepEqual(box.scopesOf(link('mainOnly', ['main']), 'kids', {}), [], 'a single-area send needs that area');
    const plans = box.plans([accepted, link('partial', ['main', 'kids'])], 'active', {});
    assert.deepEqual(JSON.parse(JSON.stringify(plans.map(plan => [plan.scope, [...plan.linkIds]]))), [['active', ['accepted']], ['main', ['partial']], ['kids', ['partial']]]);
    assert.match(tabView, /for \(const plan of buildNanahSendScopePlans\(links, normalizedScope, targetProfile\)\)/);
});

test('early ICE candidates queued while the answer is applied are added afterwards', async () => {
    const added = [];
    class Transport {
        constructor() { this.pendingIceCandidates = []; this.peerConnection = { remoteDescription: null, addIceCandidate: async c => added.push(c) }; }
        async applySignalPayload(payload) {
            if (payload.type === 'answer') {
                this.pendingIceCandidates.push({ candidate: 'early' }); // arrived during setRemoteDescription
                this.peerConnection.remoteDescription = { type: 'answer' };
            }
        }
    }
    assert.equal(Courier.patchIceDrain({ WebRtcDataChannelTransport: Transport }), true);
    assert.equal(Courier.patchIceDrain({ WebRtcDataChannelTransport: Transport }), false, 'patched once');
    const transport = new Transport();
    await transport.applySignalPayload({ type: 'answer' });
    assert.deepEqual(added, [{ candidate: 'early' }]);
});

test('the first courier host gets 9 s, and a host that finishes late is closed', async () => {
    assert.equal(Courier.HOST_TIMEOUT_MS, 9000);
    let closedLate = 0;
    let made = 0;
    class Late {
        constructor() { made += 1; this.first = made === 1; }
        async host(_session, hooks) { this.hooks = hooks; if (this.first) await new Promise(r => setTimeout(r, 120)); }
        async join() {}
        async confirmSas() {}
        async send() {}
        async close() { if (this.first) closedLate += 1; }
    }
    await Courier.host({ code: Doorbell.courierCode(), items: [{ schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'm', ciphertext: 'c' }],
        nanah: { WebRtcDataChannelTransport: Late }, hostTimeoutMs: 40, timeoutMs: 200, log: () => {} });
    await new Promise(r => setTimeout(r, 200));
    assert.ok(closedLate >= 2, 'closed when the attempt gave up and again when its late host() finished');
});

test('a busy doorbell session is retried with the logged reason; nobody listening is not', async () => {
    const relay = fakeRelay();
    const logs = [];
    const handle = Doorbell.listen({ ownDeviceId: 'child', WebSocketImpl: relay.WebSocketImpl, timers: globalThis,
        onSignal: (payload, reply) => reply(Doorbell.ringAnswer()) });
    await new Promise(r => setTimeout(r, 30));
    // Someone else holds the session for a moment.
    const squatter = new relay.WebSocketImpl();
    await new Promise(r => setTimeout(r, 5));
    squatter.send(JSON.stringify({ type: 'join_session', code: await Doorbell.code('child') }));
    setTimeout(() => squatter.close(), 300);
    const result = await Doorbell.call({ remoteDeviceId: 'child', fromDeviceId: 'parent', WebSocketImpl: relay.WebSocketImpl, timeoutMs: 8000,
        log: (event, details) => logs.push([event, details?.reason]),
        converse: async ({ send, next }) => { send(Doorbell.ringMessage('parent', ['l'])); return { ok: true, answer: await next() }; } });
    assert.equal(result.ok, true);
    assert.deepEqual(logs[0], ['doorbell_signal_retry', 'session_occupied']);
    const offline = await Doorbell.call({ remoteDeviceId: 'nobody', fromDeviceId: 'p', WebSocketImpl: relay.WebSocketImpl,
        log: (event, details) => logs.push([event, details?.reason]), converse: async () => ({ ok: true }) });
    assert.equal(offline.reason, 'offline');
    assert.deepEqual(logs.at(-1), ['doorbell_signal_failed', 'offline']);
    handle.stop();
});
