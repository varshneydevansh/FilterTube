/*
 * Doorbell on the public Nanah relay, for the background worker (docs/app/NEARBY_SYNC_DESIGN.md
 * §3.4, docs/sync/SEAMLESS_SYNC_SPEC.md). Same wire format as Android NanahDoorbell.kt:
 * a device waits at relay code "ftdoor-" + base32(SHA-256("filtertube-doorbell-v1:" + id))[:24];
 * a caller joins that code and exchanges `signal` frames. The relay forwards frames between the
 * two sockets and keeps nothing. Whatever rides in a frame is decided by the caller of this file.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedDoorbell = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const DEFAULT_RELAY = 'wss://nanah-signaling.varshney-devansh614.workers.dev/ws';
    const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
    // The relay drops a hosted code after 5 minutes; host again well before that.
    const REHOST_MS = 4 * 60 * 1000;
    // Chrome keeps a service worker alive while its WebSocket sends or receives within 30 s
    // (Chrome 116+). The relay ignores unknown frame types, so this costs one tiny frame.
    const KEEPALIVE_MS = 20 * 1000;
    const MAX_FRAME_CHARS = 512 * 1024;

    const str = value => (typeof value === 'string' ? value.trim() : '');

    async function hash(deviceId, subtle = root.crypto?.subtle) {
        const bytes = new TextEncoder().encode(`filtertube-doorbell-v1:${str(deviceId)}`);
        const digest = new Uint8Array(await subtle.digest('SHA-256', bytes)).slice(0, 15);
        let out = '';
        let buffer = 0;
        let bits = 0;
        for (const byte of digest) {
            buffer = (buffer << 8) | byte;
            bits += 8;
            while (bits >= 5) {
                out += BASE32[(buffer >> (bits - 5)) & 31];
                bits -= 5;
            }
            buffer &= (1 << bits) - 1;
        }
        return out;
    }

    async function code(deviceId, subtle) {
        return `ftdoor-${await hash(deviceId, subtle)}`;
    }

    function parse(raw) {
        if (typeof raw !== 'string' || raw.length > MAX_FRAME_CHARS) return null;
        try {
            const value = JSON.parse(raw);
            return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
        } catch (_) { return null; }
    }

    function randomId() {
        if (typeof root.crypto?.randomUUID === 'function') return root.crypto.randomUUID();
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Holds this device's doorbell open until stop(). onSignal(payload, reply) gets each forwarded
     * payload; reply(payload) answers on the same relay session. Reconnects with backoff.
     */
    function listen({ ownDeviceId, onSignal, WebSocketImpl = root.WebSocket, relayUrl = DEFAULT_RELAY,
        timers = root, onState = null } = {}) {
        let stopped = false;
        let socket = null;
        let attempt = 0;
        let keepalive = null;
        let rehost = null;
        let retry = null;
        let sessionId = '';
        let doorCode = '';
        const state = value => { try { onState?.(value); } catch (_) {} };

        function clearTimers() {
            timers.clearInterval(keepalive); timers.clearInterval(rehost); timers.clearTimeout(retry);
            keepalive = rehost = retry = null;
        }
        function send(message) {
            try { if (socket && socket.readyState === 1) socket.send(JSON.stringify(message)); } catch (_) {}
        }
        async function host() {
            sessionId = randomId();
            send({ type: 'host_session', code: doorCode, sessionId, deviceId: await hash(ownDeviceId) });
        }
        function scheduleRetry() {
            clearTimers();
            if (stopped) return;
            state('offline');
            const delay = Math.min(60000, 2000 * (2 ** Math.min(attempt, 5)));
            attempt += 1;
            retry = timers.setTimeout(open, delay);
        }
        function cycle(ws) {
            if (socket !== ws || stopped) return;
            socket = null;
            clearTimers();
            try { ws.close(1000, 'answered'); } catch (_) {}
            retry = timers.setTimeout(open, 250);
        }
        async function open() {
            if (stopped) return;
            if (typeof WebSocketImpl !== 'function') { state('unsupported'); return; }
            if (!doorCode) doorCode = await code(ownDeviceId);
            if (stopped || socket) return;
            let ws;
            try { ws = new WebSocketImpl(relayUrl); } catch (_) { scheduleRetry(); return; }
            socket = ws;
            ws.onopen = () => {
                if (stopped || socket !== ws) return;
                attempt = 0;
                void host();
                keepalive = timers.setInterval(() => send({ type: 'ft_keepalive' }), KEEPALIVE_MS);
                rehost = timers.setInterval(() => void host(), REHOST_MS);
            };
            ws.onmessage = event => {
                if (socket !== ws) return;
                const message = parse(String(event?.data ?? ''));
                if (!message) return;
                if (message.type === 'session_ready') { state('listening'); return; }
                if (message.type !== 'signal' || !message.payload || typeof message.payload !== 'object') return;
                const replySession = str(message.sessionId) || sessionId;
                // §2.3: after answering, leave and host again with a fresh session, so the next
                // caller never meets an occupied one.
                // The answer may come seconds later (a courier starting): it goes out on this socket.
                let replied = false;
                const reply = payload => {
                    if (replied) return;
                    replied = true;
                    try { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'signal', sessionId: replySession, payload })); } catch (_) {}
                    cycle(ws);
                };
                // Whatever the handler decides, this session is not reused afterwards: an ignored
                // caller must not keep the doorbell occupied until the next re-host.
                Promise.resolve().then(() => onSignal?.(message.payload, reply)).catch(() => null).finally(() => cycle(ws));
            };
            ws.onclose = () => { if (socket === ws) { socket = null; scheduleRetry(); } };
            ws.onerror = () => { try { ws.close(); } catch (_) {} };
        }
        void open();
        return Object.freeze({
            stop() {
                stopped = true;
                clearTimers();
                const ws = socket;
                socket = null;
                try { ws?.close(1000, 'closed'); } catch (_) {}
                state('stopped');
            },
            get running() { return !stopped; }
        });
    }

    /**
     * Joins remoteDeviceId's doorbell and runs one exchange. converse({ send, next }) sends
     * payloads and awaits replies; it resolves with its own result. Resolves { ok:false, reason }
     * with 'offline' when nobody waits at that doorbell.
     */
    function call({ remoteDeviceId, fromDeviceId, converse, WebSocketImpl = root.WebSocket, relayUrl = DEFAULT_RELAY,
        timers = root, timeoutMs = 20000 } = {}) {
        return new Promise(resolve => {
            let ws;
            let done = false;
            const inbox = [];
            const waiters = [];
            let sessionId = '';
            const finish = result => {
                if (done) return;
                done = true;
                timers.clearTimeout(timer);
                while (waiters.length) waiters.shift()(null);
                try { ws?.close(1000, 'done'); } catch (_) {}
                resolve(result);
            };
            const timer = timers.setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs);
            if (typeof WebSocketImpl !== 'function') { finish({ ok: false, reason: 'unsupported' }); return; }
            try { ws = new WebSocketImpl(relayUrl); } catch (_) { finish({ ok: false, reason: 'offline' }); return; }
            const send = payload => {
                try { ws.send(JSON.stringify({ type: 'signal', sessionId, payload })); } catch (_) {}
            };
            const next = () => (inbox.length ? Promise.resolve(inbox.shift()) : new Promise(r => waiters.push(r)));
            ws.onopen = async () => {
                try {
                    ws.send(JSON.stringify({ type: 'join_session', code: await code(remoteDeviceId), deviceId: await hash(fromDeviceId) }));
                } catch (_) { finish({ ok: false, reason: 'failed' }); }
            };
            ws.onmessage = event => {
                const message = parse(String(event?.data ?? ''));
                if (!message) return;
                if (message.type === 'error') {
                    finish({ ok: false, reason: message.error === 'session_not_found' ? 'offline' : 'failed' });
                } else if (message.type === 'peer_left') {
                    finish({ ok: false, reason: 'peer_left' });
                } else if (message.type === 'session_ready') {
                    sessionId = str(message.sessionId);
                    Promise.resolve().then(() => converse({ send, next }))
                        .then(result => finish(result || { ok: false, reason: 'failed' }),
                            () => finish({ ok: false, reason: 'failed' }));
                } else if (message.type === 'signal' && message.payload && typeof message.payload === 'object') {
                    if (waiters.length) waiters.shift()(message.payload);
                    else inbox.push(message.payload);
                }
            };
            ws.onclose = () => finish({ ok: false, reason: 'offline' });
            ws.onerror = () => finish({ ok: false, reason: 'offline' });
        });
    }

    // ---- SEAMLESS_SYNC_SPEC.md §2: ring and announce (ids only, never filter data) ----
    const RING = 'ft_update_ring';
    const ANNOUNCE = 'ft_update_announce';
    const boundedId = value => typeof value === 'string' && value.length >= 1 && value.length <= 128;

    /** { fromDeviceId, linkIds } when payload is a well-formed ring/announce of `type`, else null. */
    function parseUpdateCall(payload, type) {
        if (!payload || typeof payload !== 'object' || payload.type !== type || payload.v !== 1) return null;
        if (!boundedId(payload.fromDeviceId)) return null;
        const linkIds = payload.linkIds;
        if (!Array.isArray(linkIds) || linkIds.length < 1 || linkIds.length > 16 || !linkIds.every(boundedId)) return null;
        return { fromDeviceId: payload.fromDeviceId, linkIds: Array.from(new Set(linkIds)) };
    }
    const ringMessage = (fromDeviceId, linkIds) => ({ type: RING, v: 1, fromDeviceId, linkIds });
    const ringAnswer = () => ({ type: 'ft_update_ring_answer', v: 1, ok: true });
    const announceMessage = (fromDeviceId, linkIds) => ({ type: ANNOUNCE, v: 1, fromDeviceId, linkIds });
    const announceAnswer = (courier, itemCount) => ({ type: 'ft_update_announce_answer', v: 1,
        courier: typeof courier === 'string' ? courier : '', itemCount: Number.isInteger(itemCount) && itemCount > 0 ? itemCount : 0 });
    function parseAnnounceAnswer(payload) {
        if (!payload || payload.type !== 'ft_update_announce_answer' || payload.v !== 1) return null;
        const courier = typeof payload.courier === 'string' && /^ftcour-[a-z2-7]{26}$/.test(payload.courier) ? payload.courier : '';
        return { courier, itemCount: Number.isInteger(payload.itemCount) && payload.itemCount > 0 ? payload.itemCount : 0 };
    }
    /** §3: "ftcour-" + 26 random base32 characters (130 bits), fresh for each delivery. */
    function courierCode(cryptoApi = root.crypto) {
        const bytes = cryptoApi.getRandomValues(new Uint8Array(26));
        return `ftcour-${Array.from(bytes, byte => BASE32[byte & 31]).join('')}`;
    }

    return Object.freeze({
        DEFAULT_RELAY, REHOST_MS, KEEPALIVE_MS, RING, ANNOUNCE, hash, code, parse, listen, call,
        parseUpdateCall, ringMessage, ringAnswer, announceMessage, announceAnswer, parseAnnounceAnswer, courierCode
    });
}));
