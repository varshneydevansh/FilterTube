import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Android cf8520e63 (device test 2026-11-21): "connected" comes before the data channel opens.
const require = createRequire(import.meta.url);
const Courier = require('../../js/managed_courier.js');
const Doorbell = require('../../js/managed_doorbell.js');
const item = { schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: 'm1', linkId: 'L', ciphertext: 'c' };

/** A paired transport whose channel opens `openDelay` ms after connecting; send throws while closed. */
function pairedTransports({ openDelay = 120, failFirstSend = false, closeChildAfter = null } = {}) {
    const sides = [];
    let sendFailures = failFirstSend ? 1 : 0;
    class Transport {
        constructor() { sides.push(this); this.dataChannel = { readyState: 'connecting' }; this.sendKey = null; }
        async host(session, hooks) { this.hooks = hooks; this.code = session.code; }
        async join(session, hooks) {
            this.hooks = hooks;
            const host = sides.find(side => side !== this && side.code === session.code);
            this.peer = host; host.peer = this;
            for (const side of [host, this]) {
                setTimeout(() => side.hooks.onConnected(), 0); // connected, channel not open yet
                if (openDelay !== null) setTimeout(() => { side.dataChannel.readyState = 'open'; side.sendKey = {}; }, openDelay);
            }
            if (closeChildAfter !== null) setTimeout(() => this.hooks.onClosed(), closeChildAfter);
        }
        async confirmSas() {}
        async send(envelope) {
            if (this.dataChannel.readyState !== 'open') throw new Error('Nanah data channel is not open');
            if (sendFailures > 0) { sendFailures -= 1; throw new Error('transient'); }
            setTimeout(() => this.peer.hooks.onData(JSON.parse(JSON.stringify(envelope))), 0);
        }
        async close() {}
    }
    return { WebRtcDataChannelTransport: Transport };
}

test('the parent waits for the open channel, the child gets the items and the parent gets acks', async () => {
    const nanah = pairedTransports({ openDelay: 150 });
    const code = Doorbell.courierCode();
    const parent = Courier.host({ code, items: [item], nanah });
    const child = Courier.join({ code, nanah, onItems: async items => items.map(row => ({ mailboxItemId: row.mailboxItemId, linkId: 'L', ackState: 'delivered' })) });
    const [sent, received] = await Promise.all([parent, child]);
    assert.equal(received.ok, true);
    assert.deepEqual(sent.acks.map(row => row.mailboxItemId), ['m1']);
});

test('a send that still fails once is retried', async () => {
    const nanah = pairedTransports({ openDelay: 20, failFirstSend: true });
    const code = Doorbell.courierCode();
    const [sent] = await Promise.all([Courier.host({ code, items: [item], nanah }),
        Courier.join({ code, nanah, onItems: async items => items.map(row => ({ mailboxItemId: row.mailboxItemId, linkId: 'L', ackState: 'delivered' })) })]);
    assert.equal(sent.ok, true);
});

test('a channel that never opens fails with a named reason; a close fails the child at once', async () => {
    const neverOpens = pairedTransports({ openDelay: null });
    const code = Doorbell.courierCode();
    const [sent] = await Promise.all([Courier.host({ code, items: [item], nanah: neverOpens, openTimeoutMs: 200 }),
        Courier.join({ code, nanah: neverOpens, openTimeoutMs: 200, retries: 0, onItems: async () => [] })]);
    assert.equal(sent.reason, 'courier_channel_open_timeout');
    const closing = pairedTransports({ openDelay: null, closeChildAfter: 30 });
    const other = Doorbell.courierCode();
    void Courier.host({ code: other, items: [item], nanah: closing, openTimeoutMs: 300 });
    const started = Date.now();
    const result = await Courier.join({ code: other, nanah: closing, retries: 0, onItems: async () => [] });
    assert.equal(result.reason, 'courier_closed');
    assert.ok(Date.now() - started < 1000, 'fails fast, not after the 30 s courier limit');
});
