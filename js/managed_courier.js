/*
 * Courier (SEAMLESS_SYNC_SPEC.md §3): a short Nanah WebRTC data channel that carries a parent's
 * sealed mailbox items to the child and the child's acks back. Parent hosts, child joins.
 *
 * Runs only where RTCPeerConnection exists: the Firefox background page, an extension page (the
 * dashboard) or the hidden courier frame (html/managed_courier.html). A Chrome service worker has
 * no WebRTC, so the worker hands the job to one of those (managed_sync_background.js).
 *
 * The session phrase is confirmed automatically. That is not a trust shortcut: the courier only
 * moves items that are already sealed to the link's key and signed by the parent's saved key, and
 * the child verifies each one exactly as a mailbox item (managed_update_receiver.js).
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedCourier = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const TIMEOUT_MS = 30 * 1000;
    const MAX_ITEMS = 16;
    const JOIN_RETRIES = 3;
    const JOIN_RETRY_MS = 1500;
    const CODE = /^ftcour-[a-z2-7]{26}$/;
    const obj = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

    function transportClass(nanah) {
        const runtime = nanah || root.FilterTubeNanah;
        return typeof runtime?.WebRtcDataChannelTransport === 'function' ? runtime.WebRtcDataChannelTransport : null;
    }

    function sessionId() {
        return typeof root.crypto?.randomUUID === 'function' ? root.crypto.randomUUID() : `c-${Date.now()}-${Math.random()}`;
    }

    // The mailbox storage schema, field for field (Android filtertube_nanah_engine.html COURIER_ITEM_FIELDS).
    const ITEM_FIELDS = ['schema', 'version', 'mailboxItemId', 'linkId', 'targetProfileId', 'sourceDeviceId',
        'targetDeviceId', 'sourceProfileId', 'scope', 'revision', 'policyHash', 'sourcePublicKeyId', 'keyVersion',
        'cipherSuite', 'keyAgreementId', 'encryptedDek', 'nonce', 'ciphertext', 'ciphertextHash', 'createdAtMs',
        'expiresAtMs', 'ackState'];

    /** Only mailbox-schema items cross, and only their ciphertext fields: anything else is dropped. */
    function sealedOnly(items) {
        return (Array.isArray(items) ? items : []).map(obj)
            .filter(item => item.schema === 'filtertube_managed_mailbox_item' && item.ciphertext && item.mailboxItemId)
            .slice(0, MAX_ITEMS)
            .map(item => Object.fromEntries(ITEM_FIELDS.filter(key => item[key] !== undefined).map(key => [key, item[key]])));
    }

    function session({ code, mode, deviceId, nanah, timeoutMs, onReady, onData, onStarted }) {
        return new Promise(resolve => {
            const Transport = transportClass(nanah);
            if (!Transport) { resolve({ ok: false, reason: 'webrtc_unavailable' }); return; }
            if (!CODE.test(String(code || ''))) { resolve({ ok: false, reason: 'bad_courier_code' }); return; }
            const transport = new Transport({});
            let finished = false;
            const finish = result => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                Promise.resolve().then(() => transport.close()).catch(() => {});
                resolve(result);
            };
            const timer = setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs || TIMEOUT_MS);
            const send = envelope => transport.send(envelope);
            const hooks = {
                onStageChange() {},
                onProgress() {},
                onSas() { void transport.confirmSas(); },
                onConnected() { Promise.resolve(onReady?.({ send, finish })).catch(() => finish({ ok: false, reason: 'send_failed' })); },
                onData(envelope) { Promise.resolve(onData?.(obj(envelope), { send, finish })).catch(() => finish({ ok: false, reason: 'receive_failed' })); },
                onClosed() { finish({ ok: false, reason: 'closed' }); },
                onError(error) { finish({ ok: false, reason: String(error?.message || 'error').slice(0, 80) }); }
            };
            // A throwaway id, as on Android: the relay cannot tie a courier to a doorbell.
            const device = { deviceId: `courier-${sessionId()}` };
            const start = mode === 'host'
                ? transport.host({ code, sessionId: sessionId(), device }, hooks)
                : transport.join({ code, device }, hooks);
            Promise.resolve(start).then(() => { if (!finished) onStarted?.(); },
                error => finish({ ok: false, reason: String(error?.message || 'start_failed').slice(0, 80) }));
        });
    }

    /** Parent: host `code`, send the sealed items, resolve with the child's ack records. */
    function host({ code, items, deviceId, nanah, timeoutMs, onHosting } = {}) {
        const sealed = sealedOnly(items);
        if (!sealed.length) return Promise.resolve({ ok: false, reason: 'no_items', acks: [] });
        return session({
            code, mode: 'host', deviceId, nanah, timeoutMs, onStarted: onHosting,
            onReady: ({ send }) => send({ t: 'ft_courier_items', v: 1, items: sealed }),
            onData: (envelope, { finish }) => {
                if (envelope.t !== 'ft_courier_acks' || envelope.v !== 1) return;
                const acks = (Array.isArray(envelope.records) ? envelope.records : []).map(obj)
                    .filter(row => typeof row.mailboxItemId === 'string' && row.mailboxItemId).slice(0, MAX_ITEMS);
                finish({ ok: true, acks });
            }
        }).then(result => ({ acks: [], ...result }));
    }

    /**
     * Child: join `code`, hand the items to onItems(items) (which verifies and applies them and
     * returns ack records), send the acks, close. Retries a missing session (§3).
     */
    async function join({ code, deviceId, nanah, timeoutMs, onItems, retries = JOIN_RETRIES, wait = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
        let last = { ok: false, reason: 'not_started' };
        for (let attempt = 0; attempt <= retries; attempt += 1) {
            last = await session({
                code, mode: 'join', deviceId, nanah, timeoutMs,
                onData: async (envelope, { send, finish }) => {
                    if (envelope.t !== 'ft_courier_items' || envelope.v !== 1) return;
                    const items = sealedOnly(envelope.items);
                    const records = await onItems(items);
                    await send({ t: 'ft_courier_acks', v: 1, records: Array.isArray(records) ? records : [] });
                    // Let the last frame leave before the channel closes.
                    setTimeout(() => finish({ ok: true, itemCount: items.length }), 300);
                }
            });
            if (last.ok || last.reason !== 'session_not_found' || attempt === retries) return last;
            await wait(JOIN_RETRY_MS);
        }
        return last;
    }

    return Object.freeze({ TIMEOUT_MS, MAX_ITEMS, CODE, sealedOnly, host, join });
}));
