/*
 * SEAMLESS_SYNC_SPEC.md §10: acks and announces carry an HMAC made with a per-link key derived from
 * the link's existing mailbox wrapping key. No new keys are exchanged, and the key never leaves
 * the worker. Pure WebCrypto, so it runs in the Chrome worker and the Firefox background page.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedSeamlessAuth = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const SALT = 'filtertube-seamless-auth-v1';
    const ANNOUNCE_WINDOW_MS = 120 * 1000;
    const ACK_WINDOW_MS = 10 * 60 * 1000;
    const str = value => (typeof value === 'string' ? value.trim() : '');
    const obj = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    const subtle = () => root.crypto?.subtle;

    function b64urlDecode(value) {
        const raw = str(value).replace(/-/g, '+').replace(/_/g, '/');
        if (!raw) return null;
        try {
            const binary = root.atob(raw + '='.repeat((4 - (raw.length % 4)) % 4));
            return Uint8Array.from(binary, char => char.charCodeAt(0));
        } catch (_) { return null; }
    }

    function b64urlEncode(bytes) {
        let binary = '';
        for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
        return root.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /** The saved 32-byte wrapping key of a link (raw base64url, or the `k` of its JWK form). */
    function wrappingKeyBytes(link) {
        const trusted = obj(link);
        const policy = obj(trusted.policy);
        const raw = str(trusted.mailboxWrappingKeyBase64Url || policy.mailboxWrappingKeyBase64Url)
            || str(obj(trusted.mailboxWrappingKeyJwk || policy.mailboxWrappingKeyJwk).k);
        const bytes = b64urlDecode(raw);
        return bytes && bytes.length === 32 ? bytes : null;
    }

    /** §10.1: K = HKDF-SHA256(ikm = wrapping key, salt = SALT, info = linkId, L = 32), as an HMAC key. */
    async function linkKey(link, linkId) {
        const ikm = wrappingKeyBytes(link);
        const id = str(linkId);
        if (!ikm || !id || !subtle()) return null;
        const encoder = new TextEncoder();
        const base = await subtle().importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
        const bits = await subtle().deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: encoder.encode(SALT), info: encoder.encode(id) }, base, 256);
        return subtle().importKey('raw', bits, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    }

    async function mac(key, message) {
        return b64urlEncode(await subtle().sign('HMAC', key, new TextEncoder().encode(message)));
    }

    function sameMac(left, right) {
        const a = str(left);
        const b = str(right);
        let diff = a.length ^ b.length;
        for (let index = 0; index < Math.max(a.length, b.length); index += 1) diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
        return diff === 0;
    }

    /** §10.2 status: ackState:accepted:applied:decision, e.g. "delivered:1:0:idempotent_same_hash". */
    function ackStatus(record) {
        const row = obj(record);
        return `${str(row.ackState)}:${row.accepted === true ? '1' : '0'}:${row.applied === true ? '1' : '0'}:${str(row.decision)}`;
    }

    function ackMessage(record) {
        const row = obj(record);
        return ['ft-ack-v1', str(row.linkId), str(row.mailboxItemId), ackStatus(row), String(row.ackedAt)].join('\n');
    }

    function announceMessage(linkId, fromDeviceId, ts) {
        return ['ft-announce-v1', str(linkId), str(fromDeviceId), String(ts)].join('\n');
    }

    /** Child: an ack record with `auth` added, or unchanged when the link has no key. */
    async function signAck(record, link) {
        const row = obj(record);
        if (!Number.isInteger(row.ackedAt)) return row;
        const key = await linkKey(link, row.linkId);
        return key ? { ...row, auth: { v: 1, mac: await mac(key, ackMessage(row)) } } : row;
    }

    /** Child: the announce payload with `auth` for every link it can key. */
    async function signAnnounce(payload, linksById, ts) {
        const root = obj(payload);
        const macs = {};
        for (const linkId of Array.isArray(root.linkIds) ? root.linkIds : []) {
            const key = await linkKey(linksById(linkId), linkId);
            if (key) macs[linkId] = await mac(key, announceMessage(linkId, root.fromDeviceId, ts));
        }
        return Object.keys(macs).length ? { ...root, auth: { v: 1, ts, macs } } : root;
    }

    /**
     * Parent §10.3: 'verified' | 'unverified' (no auth: an older child) | 'bad' (wrong MAC or
     * outside the ±10 minute window). A bad record is ignored by the caller.
     */
    async function verifyAck(record, link, nowMs) {
        const row = obj(record);
        const auth = row.auth;
        if (auth === undefined || auth === null) return 'unverified';
        if (obj(auth).v !== 1 || !Number.isInteger(row.ackedAt) || Math.abs(nowMs - row.ackedAt) > ACK_WINDOW_MS) return 'bad';
        const key = await linkKey(link, row.linkId);
        if (!key) return 'bad';
        return sameMac(await mac(key, ackMessage(row)), obj(auth).mac) ? 'verified' : 'bad';
    }

    /**
     * Parent §10.3: { status: 'missing' | 'ok' | 'bad', linkIds } where linkIds are the links whose
     * MAC verified ('ok'), or all of them for an older child ('missing').
     */
    async function verifyAnnounce(payload, linksById, nowMs) {
        const root = obj(payload);
        const linkIds = Array.isArray(root.linkIds) ? root.linkIds : [];
        if (root.auth === undefined || root.auth === null) return { status: 'missing', linkIds };
        const auth = obj(root.auth);
        if (auth.v !== 1 || !Number.isInteger(auth.ts) || Math.abs(nowMs - auth.ts) > ANNOUNCE_WINDOW_MS) return { status: 'bad', linkIds: [] };
        const verified = [];
        for (const linkId of linkIds) {
            const sent = obj(auth.macs)[linkId];
            const key = sent ? await linkKey(linksById(linkId), linkId) : null;
            if (key && sameMac(await mac(key, announceMessage(linkId, root.fromDeviceId, auth.ts)), sent)) verified.push(linkId);
        }
        return verified.length ? { status: 'ok', linkIds: verified } : { status: 'bad', linkIds: [] };
    }

    return Object.freeze({ SALT, ANNOUNCE_WINDOW_MS, ACK_WINDOW_MS, linkKey, ackStatus, ackMessage, announceMessage,
        signAck, signAnnounce, verifyAck, verifyAnnounce });
}));
