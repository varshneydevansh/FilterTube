import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Doorbell = require('../../js/managed_doorbell.js');
const Sync = require('../../js/managed_sync_background.js');
const Courier = require('../../js/managed_courier.js');
import { fakeRelay } from './helpers/managed-sync-fixtures.mjs';

const until = async (check, ms = 2000) => {
    const start = Date.now();
    while (!check()) {
        if (Date.now() - start > ms) throw new Error('timed out');
        await new Promise(resolve => setTimeout(resolve, 5));
    }
};

test('doorbell hash matches the Android recipe and never contains the device id', async () => {
    const id = 'android-11111111-2222-3333-4444-555555555555';
    // Independent RFC 4648 base32 of the first 15 digest bytes, lower-cased (Kotlin NanahDoorbellCodes.hash).
    const digest = crypto.createHash('sha256').update(`filtertube-doorbell-v1:${id}`).digest().subarray(0, 15);
    let bits = '';
    for (const byte of digest) bits += byte.toString(2).padStart(8, '0');
    const expected = bits.match(/.{5}/g).map(chunk => 'abcdefghijklmnopqrstuvwxyz234567'[parseInt(chunk, 2)]).join('');
    const hash = await Doorbell.hash(id);
    assert.equal(hash, expected);
    assert.equal(hash, 'tdfvmcnvs653dv6hgqlublqb');
    assert.equal(await Doorbell.hash(` ${id} `), hash);
    assert.match(hash, /^[a-z2-7]{24}$/);
    assert.equal(await Doorbell.code(id), `ftdoor-${hash}`);
});

test('ring and announce follow the spec bounds and answer shapes', () => {
    const ok = Doorbell.parseUpdateCall({ type: 'ft_update_ring', v: 1, fromDeviceId: 'p', linkIds: ['a', 'a', 'b'] }, Doorbell.RING);
    assert.deepEqual(ok, { fromDeviceId: 'p', linkIds: ['a', 'b'] });
    for (const bad of [
        { type: 'ft_update_ring', v: 2, fromDeviceId: 'p', linkIds: ['a'] },
        { type: 'ft_update_ring', v: 1, fromDeviceId: '', linkIds: ['a'] },
        { type: 'ft_update_ring', v: 1, fromDeviceId: 'x'.repeat(129), linkIds: ['a'] },
        { type: 'ft_update_ring', v: 1, fromDeviceId: 'p', linkIds: [] },
        { type: 'ft_update_ring', v: 1, fromDeviceId: 'p', linkIds: Array.from({ length: 17 }, (_, i) => `l${i}`) },
        { type: 'ft_update_ring', v: 1, fromDeviceId: 'p', linkIds: [5] },
        { type: 'ft_update_announce', v: 1, fromDeviceId: 'p', linkIds: ['a'] }
    ]) assert.equal(Doorbell.parseUpdateCall(bad, Doorbell.RING), null);
    assert.deepEqual(Doorbell.ringAnswer(), { type: 'ft_update_ring_answer', v: 1, ok: true });
    assert.deepEqual(Doorbell.announceAnswer('', 0), { type: 'ft_update_announce_answer', v: 1, courier: '', itemCount: 0 });
    const code = Doorbell.courierCode();
    assert.match(code, /^ftcour-[a-z2-7]{26}$/);
    assert.deepEqual(Doorbell.parseAnnounceAnswer(Doorbell.announceAnswer(code, 2)), { courier: code, itemCount: 2 });
    assert.equal(Doorbell.parseAnnounceAnswer({ type: 'ft_update_announce_answer', v: 1, courier: 'ABCD', itemCount: 1 }).courier, '');
});

test('a caller reaches a listening doorbell, the answer goes back, and the session is kept for the next caller', async () => {
    const relay = fakeRelay();
    const seen = [];
    const handle = Doorbell.listen({ ownDeviceId: 'child', WebSocketImpl: relay.WebSocketImpl, timers: globalThis,
        onSignal: (payload, reply) => { seen.push(payload); reply(Doorbell.ringAnswer()); } });
    await until(() => relay.byCode.size === 1);
    const result = await Doorbell.call({ remoteDeviceId: 'child', fromDeviceId: 'parent', WebSocketImpl: relay.WebSocketImpl,
        converse: async ({ send, next }) => { send(Doorbell.ringMessage('parent', ['l1'])); return { ok: true, answer: await next() }; } });
    assert.equal(result.ok, true);
    assert.deepEqual(result.answer, Doorbell.ringAnswer());
    assert.equal(seen[0].type, 'ft_update_ring');
    // §2.3 (Android e741ca0b1): no re-host after answering; the next caller joins the same session.
    await new Promise(resolve => setTimeout(resolve, 400));
    const second = await Doorbell.call({ remoteDeviceId: 'child', fromDeviceId: 'parent', WebSocketImpl: relay.WebSocketImpl,
        converse: async ({ send, next }) => { send(Doorbell.ringMessage('parent', ['l1'])); return { ok: true, answer: await next() }; } });
    assert.equal(second.ok, true);
    assert.equal(relay.frames.filter(frame => frame.type === 'host_session').length, 1, 'one session for both callers');
    const offline = await Doorbell.call({ remoteDeviceId: 'nobody', fromDeviceId: 'parent', WebSocketImpl: relay.WebSocketImpl,
        converse: async () => ({ ok: true }) });
    assert.deepEqual(offline, { ok: false, reason: 'offline' });
    handle.stop();
    for (const frame of relay.frames.filter(row => row.type === 'signal')) {
        assert.equal(JSON.stringify(frame).includes('ciphertext'), false, 'the doorbell never carries items');
    }
});

test('outbox: replace queued per link and scope, ack states, expiry and the 64 cap', () => {
    const now = 1_000_000;
    const link = { linkId: 'L', remoteDeviceId: 'child' };
    const item = (id, scope = 'keywords', extra = {}) => ({ schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: id,
        linkId: 'L', targetDeviceId: 'child', targetProfileId: 'Kid', scope, revision: 1, policyHash: 'h', ciphertext: 'c', createdAtMs: now, ...extra });
    assert.equal(Sync.outboxRow({ ...item('x'), decryptedEnvelope: {} }, link, {}, now), null, 'plaintext never enters the outbox');
    assert.equal(Sync.outboxRow({ ...item('x'), targetDeviceId: 'other' }, link, {}, now), null);
    const first = Sync.outboxRow(item('a'), link, { remoteLabel: 'Tablet' }, now);
    assert.equal(first.expiresAt, now + Sync.OUTBOX_TTL_MS);
    let box = Sync.enqueueOutbox(Sync.emptyOutbox(), [first], now);
    box = Sync.enqueueOutbox(box, [Sync.outboxRow(item('b'), link, {}, now), Sync.outboxRow(item('c', 'channels'), link, {}, now)], now);
    assert.deepEqual(box.entries.map(entry => entry.entryId), ['b', 'c']);
    const linkDevice = () => 'child';
    let result = Sync.applyAcks(box, [{ mailboxItemId: 'b', linkId: 'L', ackState: 'delivered', accepted: true, applied: true }], 'someone-else', () => 'child', now);
    assert.equal(result.changed, 0, 'acks only count from the linked device');
    result = Sync.applyAcks(box, [
        { mailboxItemId: 'b', linkId: 'L', ackState: 'delivered', accepted: true, applied: true },
        { mailboxItemId: 'c', linkId: 'L', ackState: 'rejected', accepted: false, reason: 'scope_not_allowed' }
    ], 'child', linkDevice, now);
    assert.deepEqual(result.outbox.entries.map(entry => [entry.state, entry.reason]), [['applied', null], ['rejected', 'scope_not_allowed']]);
    // Spec §4 (79108f833): applied only on a real change; otherwise up to date.
    assert.equal(Sync.stateFromAck({ ackState: 'delivered', accepted: true, applied: false, decision: 'idempotent_same_hash' }), 'up_to_date');
    assert.equal(Sync.stateFromAck({ ackState: 'delivered', accepted: true, applied: false, decision: 'unchanged' }), 'up_to_date');
    assert.equal(Sync.stateFromAck({ ackState: 'delivered', accepted: true, applied: true }), 'applied');
    assert.equal(Sync.stateFromAck({ ackState: 'expired' }), 'expired');
    assert.equal(Sync.stateFromAck({ ackState: 'conflict' }), 'rejected');
    const later = Sync.pruneOutbox(Sync.enqueueOutbox(Sync.emptyOutbox(), [first], now), now + Sync.OUTBOX_TTL_MS + 1);
    assert.equal(later.entries[0].state, 'expired');
    assert.equal(Sync.pruneOutbox(later, now + 3 * Sync.OUTBOX_TTL_MS).entries.length, 0, 'finished entries go after 7 days');
    const many = Array.from({ length: 70 }, (_, i) => ({ ...Sync.outboxRow(item(`m${i}`, `s${i}`), link, {}, now), state: i < 10 ? 'applied' : 'queued', stateAt: now + i }));
    const capped = Sync.pruneOutbox({ version: 1, entries: many }, now);
    assert.equal(capped.entries.length, Sync.OUTBOX_LIMIT);
    assert.equal(capped.entries.filter(entry => entry.state === 'applied').length, 4, 'oldest finished entries go first');
});

test('courier sends sealed items only and returns the child acks', async () => {
    assert.deepEqual(Courier.sealedOnly([{ schema: 'filtertube_managed_mailbox_item', ciphertext: 'x', mailboxItemId: 'p', decryptedEnvelope: { payload: 1 } },
        { schema: 'other', ciphertext: 'x', mailboxItemId: 'o' }]),
    [{ schema: 'filtertube_managed_mailbox_item', ciphertext: 'x', mailboxItemId: 'p' }], 'plaintext fields never cross');
    // A paired fake transport: whatever one side sends, the other receives.
    const sides = [];
    class FakeTransport {
        constructor() { sides.push(this); this.confirmed = false; }
        async host(session, hooks) { this.hooks = hooks; this.session = session; setTimeout(() => this.ready(), 0); }
        async join(session, hooks) { this.hooks = hooks; this.session = session; setTimeout(() => this.ready(), 0); }
        ready() { this.hooks.onSas({ phrase: 'auto' }); }
        async confirmSas() { this.confirmed = true; this.dataChannel = { readyState: 'open' }; this.sendKey = {}; if (sides.every(side => side.confirmed) && sides.length === 2) for (const side of sides) side.hooks.onConnected(); }
        async send(envelope) { const other = sides.find(side => side !== this); setTimeout(() => other.hooks.onData(JSON.parse(JSON.stringify(envelope))), 0); }
        async close() {}
    }
    const nanah = { WebRtcDataChannelTransport: FakeTransport };
    const code = Doorbell.courierCode();
    const item = { schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: 'm1', linkId: 'L', ciphertext: 'c' };
    let hosting = false;
    const parent = Courier.host({ code, items: [item], deviceId: 'p', nanah, onHosting: () => { hosting = true; } });
    const child = Courier.join({ code, deviceId: 'c', nanah, onItems: async items => items.map(row => ({ mailboxItemId: row.mailboxItemId, linkId: row.linkId, ackState: 'delivered', accepted: true, applied: true })) });
    const [sent, received] = await Promise.all([parent, child]);
    assert.equal(hosting, true);
    assert.equal(received.ok, true);
    assert.deepEqual(sent.acks.map(row => row.mailboxItemId), ['m1']);
    assert.equal((await Courier.host({ code: 'ABCD', items: [item], nanah })).reason, 'bad_courier_code');
});

test('run 4: the doorbell re-hosts every 4 minutes on a fresh socket, after the old one closed', async () => {
    const relay = fakeRelay();
    const timers = { setTimeout: (fn, ms) => setTimeout(fn, ms === Doorbell.REHOST_MS ? 60 : ms), clearTimeout,
        setInterval: (fn, ms) => setInterval(fn, ms), clearInterval };
    const handle = Doorbell.listen({ ownDeviceId: 'child', WebSocketImpl: relay.WebSocketImpl, timers, onSignal: () => {} });
    await until(() => relay.frames.filter(frame => frame.type === 'host_session').length >= 2, 3000);
    handle.stop();
    const hosts = relay.frames.filter(frame => frame.type === 'host_session');
    assert.notEqual(hosts[0].sessionId, hosts[1].sessionId);
    const result = await Doorbell.call({ remoteDeviceId: 'child', fromDeviceId: 'p', WebSocketImpl: relay.WebSocketImpl, converse: async () => ({ ok: true }) });
    assert.equal(result.reason, 'offline', 'a stopped listener leaves nothing hosted');
});
