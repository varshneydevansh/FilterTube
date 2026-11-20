import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// SEAMLESS_SYNC_SPEC.md §10: link-keyed HMACs on acks and announces.
const require = createRequire(import.meta.url);
const Auth = require('../../js/managed_seamless_auth.js');
const Sync = require('../../js/managed_sync_background.js');
const key = Buffer.alloc(32, 7).toString('base64url');
const link = { linkId: 'L1', mailboxWrappingKeyBase64Url: key };
const now = 1_790_000_000_000;

test('the MAC follows §10.1 and §10.2 exactly (independent HKDF + HMAC)', async () => {
    const k = Buffer.from(crypto.hkdfSync('sha256', Buffer.alloc(32, 7), Buffer.from('filtertube-seamless-auth-v1'), Buffer.from('L1'), 32));
    const record = { linkId: 'L1', mailboxItemId: 'm1', ackState: 'delivered', accepted: true, applied: false, decision: 'idempotent_same_hash', ackedAt: now };
    assert.equal(Auth.ackStatus(record), 'delivered:1:0:idempotent_same_hash');
    const expected = crypto.createHmac('sha256', k).update('ft-ack-v1\nL1\nm1\ndelivered:1:0:idempotent_same_hash\n' + now).digest('base64url');
    assert.deepEqual((await Auth.signAck(record, link)).auth, { v: 1, mac: expected });
    const announce = await Auth.signAnnounce({ type: 'ft_update_announce', v: 1, fromDeviceId: 'kid', linkIds: ['L1'] }, () => link, now);
    assert.equal(announce.auth.macs.L1, crypto.createHmac('sha256', k).update(`ft-announce-v1\nL1\nkid\n${now}`).digest('base64url'));
});

test('the MACs equal Android\'s test vectors (SeamlessSyncAuthTest, 044d6b35d)', async () => {
    const wrapping = { mailboxWrappingKeyBase64Url: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8' };
    const ack = await Auth.signAck({ linkId: 'nm1-test', mailboxItemId: 'mbx_1', ackState: 'delivered', accepted: true, applied: true,
        decision: '', ackedAt: 1779300000000 }, wrapping);
    assert.equal(ack.auth.mac, '8G7ssYM4g_57c3_ohEVCG_sAfwDXbocjDKyC6-j8M5E');
    const announce = await Auth.signAnnounce({ fromDeviceId: 'android-child', linkIds: ['nm1-test'] }, () => wrapping, 1779300000000);
    assert.equal(announce.auth.macs['nm1-test'], 'wT0WV3pI2RHDHf3qQAYup6NcwHZTJPhjE0Ayq6goNhg');
    assert.equal((await Auth.verifyAnnounce({ fromDeviceId: 'c', linkIds: ['x'], auth: null }, () => wrapping, 0)).status, 'missing');
});

test('acks: valid → verified, no auth → unverified, wrong MAC, stale or wrong link → bad', async () => {
    const record = { linkId: 'L1', mailboxItemId: 'm1', ackState: 'delivered', accepted: true, applied: true, decision: '', ackedAt: now };
    const signed = await Auth.signAck(record, link);
    assert.equal(await Auth.verifyAck(signed, link, now + 1000), 'verified');
    assert.equal(await Auth.verifyAck(record, link, now), 'unverified');
    assert.equal(await Auth.verifyAck({ ...signed, applied: false }, link, now), 'bad', 'the status is covered');
    assert.equal(await Auth.verifyAck(signed, link, now + 11 * 60 * 1000), 'bad', '±10 minutes');
    assert.equal(await Auth.verifyAck(signed, { linkId: 'L1', mailboxWrappingKeyBase64Url: Buffer.alloc(32, 8).toString('base64url') }, now), 'bad');
});

test('announces: only links whose MAC verifies count; none verifying or a stale ts is bad; no auth is accepted for now', async () => {
    const payload = { type: 'ft_update_announce', v: 1, fromDeviceId: 'kid', linkIds: ['L1', 'L2'] };
    const links = { L1: link, L2: { linkId: 'L2', mailboxWrappingKeyBase64Url: Buffer.alloc(32, 9).toString('base64url') } };
    const signed = await Auth.signAnnounce(payload, id => links[id], now);
    assert.deepEqual(await Auth.verifyAnnounce(signed, id => links[id], now), { status: 'ok', linkIds: ['L1', 'L2'] });
    const halfForged = { ...signed, auth: { ...signed.auth, macs: { L1: signed.auth.macs.L1, L2: 'AAAA' } } };
    assert.deepEqual(await Auth.verifyAnnounce(halfForged, id => links[id], now), { status: 'ok', linkIds: ['L1'] });
    assert.equal((await Auth.verifyAnnounce({ ...signed, fromDeviceId: 'stranger' }, id => links[id], now)).status, 'bad');
    assert.equal((await Auth.verifyAnnounce(signed, id => links[id], now + 121 * 1000)).status, 'bad');
    assert.deepEqual(await Auth.verifyAnnounce(payload, id => links[id], now), { status: 'missing', linkIds: ['L1', 'L2'] });
});

test('the outbox marks unverified acks and a replay can\'t move a finished entry', () => {
    const item = { schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: 'm', linkId: 'L', targetDeviceId: 'c', scope: 'keywords', ciphertext: 'x' };
    let box = Sync.enqueueOutbox(Sync.emptyOutbox(), [Sync.outboxRow(item, { linkId: 'L', remoteDeviceId: 'c' }, {}, now)], now);
    const delivered = { mailboxItemId: 'm', linkId: 'L', ackState: 'delivered', accepted: true, applied: false };
    box = Sync.applyAcks(box, [delivered], 'c', () => 'c', now, new Set(['m'])).outbox;
    assert.deepEqual([box.entries[0].state, box.entries[0].unverified], ['up_to_date', true]);
    const replay = Sync.applyAcks(box, [{ ...delivered, ackState: 'rejected', accepted: false }], 'c', () => 'c', now);
    assert.equal(replay.changed, 0, 'a finished entry never moves again');
    // An older stored `delivered` entry can still become applied.
    const legacy = { version: 1, entries: [{ ...box.entries[0], state: 'delivered', unverified: true }] };
    const moved = Sync.applyAcks(legacy, [{ ...delivered, applied: true }], 'c', () => 'c', now).outbox;
    assert.deepEqual([moved.entries[0].state, moved.entries[0].unverified], ['applied', false]);
});
