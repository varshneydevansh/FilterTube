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
    // Android cf8520e63 (device test 2026-11-21): the transport reports "connected" when the peer
    // connection connects, but the data channel can open later, so a first send threw and nothing
    // was delivered. Sends wait for an open, keyed channel (15 s) and retry once.
    const OPEN_TIMEOUT_MS = 15 * 1000;
    const OPEN_POLL_MS = 50;
    // Android 79108f833: host() must reach the relay within 6 s, then one retry on a fresh socket.
    const HOST_TIMEOUT_MS = 6 * 1000;

    /** Step log with timings (ids and reason codes only, never items). */
    function defaultLog(event, details) {
        try { root.console?.info?.(`FilterTube courier: ${event}`, JSON.stringify(details || {})); } catch (_) {}
    }

    /** Resolves once the channel is open and the session keys exist (Android waitForCourierOpen). */
    function waitForOpen(transport, isClosed, timeoutMs = OPEN_TIMEOUT_MS) {
        return new Promise((resolve, reject) => {
            const startedAt = Date.now();
            const check = () => {
                if (isClosed()) { reject(new Error('courier_closed')); return; }
                if (transport.dataChannel && transport.dataChannel.readyState === 'open' && transport.sendKey) { resolve(); return; }
                if (Date.now() - startedAt >= timeoutMs) { reject(new Error('courier_channel_open_timeout')); return; }
                setTimeout(check, OPEN_POLL_MS);
            };
            check();
        });
    }

    const reasonOf = error => String(error?.message || 'courier_failed').slice(0, 80);
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

    function session({ code, mode, deviceId, nanah, timeoutMs, onReady, onData, onStarted, openTimeoutMs = OPEN_TIMEOUT_MS,
        hostTimeoutMs = HOST_TIMEOUT_MS, log = defaultLog, registerAbort = null }) {
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
            const timer = setTimeout(() => finish({ ok: false, reason: 'courier_timeout' }), timeoutMs || TIMEOUT_MS);
            // Spec §13: a re-announce from the same child replaces this courier.
            registerAbort?.(() => finish({ ok: false, reason: 'courier_replaced' }));
            const isClosed = () => finished;
            // Waits for the data channel, and retries once if the first send still fails.
            const send = async envelope => {
                await waitForOpen(transport, isClosed, openTimeoutMs);
                try {
                    await transport.send(envelope);
                } catch (_) {
                    await waitForOpen(transport, isClosed, openTimeoutMs);
                    await transport.send(envelope);
                }
            };
            let connected = false;
            const hooks = {
                onStageChange() {},
                onProgress() {},
                onSas() { void transport.confirmSas(); },
                // Connected is not yet open: onReady runs once the channel can carry a message.
                onConnected() {
                    if (connected) return;
                    connected = true;
                    waitForOpen(transport, isClosed, openTimeoutMs)
                        .then(() => onReady?.({ send, finish }))
                        .catch(error => finish({ ok: false, reason: reasonOf(error) }));
                },
                onData(envelope) {
                    Promise.resolve(onData?.(obj(envelope), { send, finish })).catch(error => finish({ ok: false, reason: reasonOf(error) }));
                },
                // A close or an error ends the wait at once, the child's wait for items included.
                onClosed() { finish({ ok: false, reason: 'courier_closed' }); },
                onError(error) { finish({ ok: false, reason: reasonOf(error) }); }
            };
            // A throwaway id, as on Android: the relay cannot tie a courier to a doorbell.
            const device = { deviceId: `courier-${sessionId()}` };
            const startedAt = Date.now();
            // A relay socket that never opens must not hold the whole courier.
            const hostTimer = mode === 'host' ? setTimeout(() => finish({ ok: false, reason: 'courier_host_timeout' }), hostTimeoutMs) : 0;
            const start = mode === 'host'
                ? transport.host({ code, sessionId: sessionId(), device }, hooks)
                : transport.join({ code, device }, hooks);
            Promise.resolve(start).then(() => {
                clearTimeout(hostTimer);
                if (mode === 'host') log('courier_host_started', { elapsedMs: Date.now() - startedAt });
                if (!finished) onStarted?.();
            }, error => {
                clearTimeout(hostTimer);
                finish({ ok: false, reason: String(error?.message || 'start_failed').slice(0, 80) });
            });
        });
    }

    /** Parent: host `code`, send the sealed items, resolve with the child's ack records. */
    async function host({ code, items, deviceId, nanah, timeoutMs, onHosting, openTimeoutMs, hostTimeoutMs, log = defaultLog, registerAbort = null } = {}) {
        const sealed = sealedOnly(items);
        if (!sealed.length) return { ok: false, reason: 'no_items', acks: [] };
        const startedAt = Date.now();
        let hosted = false;
        const attempt = () => hostOnce({ code, sealed, deviceId, nanah, timeoutMs, openTimeoutMs, hostTimeoutMs, log, registerAbort,
            onHosting: () => { if (!hosted) { hosted = true; onHosting?.(); } } });
        let result = await attempt();
        if (!result.ok && ['courier_host_timeout', 'courier_closed'].includes(result.reason)) {
            log('courier_host_retry', { reason: result.reason, elapsedMs: Date.now() - startedAt });
            result = await attempt();
        }
        log(result.ok ? 'courier_finished' : 'courier_failed', { reason: result.reason || null, elapsedMs: Date.now() - startedAt });
        return result;
    }

    function hostOnce({ code, sealed, deviceId, nanah, timeoutMs, onHosting, openTimeoutMs, hostTimeoutMs, log, registerAbort }) {
        return session({
            code, mode: 'host', deviceId, nanah, timeoutMs, onStarted: onHosting, openTimeoutMs, hostTimeoutMs, log, registerAbort,
            onReady: ({ send }) => { log('courier_connected', {}); return send({ t: 'ft_courier_items', v: 1, items: sealed }); },
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
    async function join({ code, deviceId, nanah, timeoutMs, openTimeoutMs, onItems, retries = JOIN_RETRIES, wait = ms => new Promise(r => setTimeout(r, ms)),
        log = defaultLog } = {}) {
        let last = { ok: false, reason: 'not_started' };
        const startedAt = Date.now();
        for (let attempt = 0; attempt <= retries; attempt += 1) {
            last = await session({
                code, mode: 'join', deviceId, nanah, timeoutMs, openTimeoutMs, log,
                onReady: () => log('courier_joined', { elapsedMs: Date.now() - startedAt }),
                onData: async (envelope, { send, finish }) => {
                    if (envelope.t !== 'ft_courier_items' || envelope.v !== 1) return;
                    const items = sealedOnly(envelope.items);
                    log('courier_items', { elapsedMs: Date.now() - startedAt, count: items.length });
                    const records = await onItems(items);
                    await send({ t: 'ft_courier_acks', v: 1, records: Array.isArray(records) ? records : [] });
                    // Let the last frame leave before the channel closes.
                    setTimeout(() => finish({ ok: true, itemCount: items.length }), 300);
                }
            });
            if (last.ok || last.reason !== 'session_not_found' || attempt === retries) {
                if (!last.ok) log('courier_join_failed', { reason: last.reason, elapsedMs: Date.now() - startedAt });
                return last;
            }
            await wait(JOIN_RETRY_MS);
        }
        return last;
    }

    return Object.freeze({ TIMEOUT_MS, OPEN_TIMEOUT_MS, HOST_TIMEOUT_MS, MAX_ITEMS, CODE, sealedOnly, waitForOpen, host, join });
}));
