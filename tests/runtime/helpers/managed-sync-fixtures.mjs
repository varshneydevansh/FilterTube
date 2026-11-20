// Shared fixtures for the seamless-sync tests (SEAMLESS_SYNC_SPEC.md).
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Receiver = require('../../../js/managed_update_receiver.js');
const read = file => fs.readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');

// The background worker's environment: no window, chrome.storage only.
export function workerContext(initial = {}) {
    const store = JSON.parse(JSON.stringify(initial));
    const chrome = {
        runtime: { id: 'test', lastError: null },
        storage: {
            local: {
                get(keys, callback) {
                    const out = {};
                    for (const key of [].concat(keys ?? Object.keys(store))) if (key in store) out[key] = JSON.parse(JSON.stringify(store[key]));
                    callback?.(out);
                },
                set(values, callback) { Object.assign(store, JSON.parse(JSON.stringify(values))); callback?.(); }
            }
        }
    };
    const box = { chrome, console, setTimeout, clearTimeout, crypto: webcrypto, TextEncoder, TextDecoder,
        atob: v => Buffer.from(v, 'base64').toString('binary'), btoa: v => Buffer.from(v, 'binary').toString('base64') };
    box.globalThis = box;
    vm.createContext(box);
    for (const file of ['js/security_manager.js', 'js/shared/backup_integrity.js', 'js/shared/study_model.js', 'js/io_manager.js', 'js/nanah_sync_adapter.js', 'js/nanah_managed_open_sync.js']) {
        vm.runInContext(read(file), box, { filename: file });
    }
    const get = keys => new Promise(resolve => chrome.storage.local.get(keys, resolve));
    const set = values => new Promise(resolve => chrome.storage.local.set(values, resolve));
    return { box, store, get, set, adapter: box.FilterTubeNanahAdapter };
}

export async function familyFixture({ linkOverrides = {}, policyOverrides = {}, activeProfileId = 'Parent', childStudy = null, studyPacks = null } = {}) {
    const ctx = workerContext();
    const keys = await ctx.adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'parent-key-1', keyVersion: 1 });
    const wrapping = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('base64url');
    const link = {
        linkId: 'link-parent-child',
        remoteDeviceId: 'parent-device',
        linkType: 'managed_link',
        localRole: 'replica',
        remoteRole: 'source',
        sourceDeviceId: 'parent-device',
        sourceProfileId: 'Parent',
        targetProfileId: 'Child',
        sourcePublicKeyId: 'parent-key-1',
        sourcePublicKeyJwk: keys.sourcePublicKeyJwk,
        keyVersion: 1,
        mailboxWrappingKeyBase64Url: wrapping,
        policy: {
            allowedScopes: ['keywords', 'channels'],
            syncOnProfileOpen: true,
            lockedChildMode: 'allow_trusted_updates',
            targetProfileBehavior: 'fixed_profile',
            targetProfileId: 'Child',
            ...policyOverrides
        },
        ...linkOverrides
    };
    await ctx.set({
        ftNanahDeviceId: 'child-device',
        ftNanahTrustedLinks: [link],
        ftProfilesV4: {
            schemaVersion: 4,
            activeProfileId,
            profiles: {
                Parent: { type: 'account', name: 'Parent', main: { keywords: [] }, settings: {}, security: {} },
                Child: { type: 'child', name: 'Child', parentProfileId: 'Parent', main: { keywords: [] }, settings: {}, security: {},
                    ...(childStudy ? { study: childStudy } : {}) }
            }
        }
    });
    async function sealedItem({ revision = 1, word = 'scary clown', mutate = null, expiresAtMs = null, scope = 'keywords', payload = null } = {}) {
        const envelope = {
            type: 'filtertube_managed_policy',
            linkId: link.linkId,
            scope,
            sourceDeviceId: 'parent-device',
            targetDeviceId: 'child-device',
            sourceProfileId: 'Parent',
            targetProfileId: 'Child',
            revision,
            sourcePublicKeyId: 'parent-key-1',
            keyVersion: 1,
            issuedAt: Date.now(),
            payload: payload || { operations: [{ op: 'add_keyword', value: word }] }
        };
        envelope.policyHash = ctx.adapter.buildManagedPolicyPayloadHash(envelope);
        const signed = await ctx.adapter.signManagedPolicyEnvelope(envelope, keys.privateKeyJwk);
        if (mutate) mutate(signed);
        return ctx.adapter.sealManagedMailboxEnvelope(signed, {
            trustedLink: link, ...(expiresAtMs ? { createdAtMs: expiresAtMs - 1000, expiresAtMs } : {})
        });
    }
    const receiver = Receiver.create({ get: ctx.get, set: ctx.set, adapter: ctx.adapter, openSync: ctx.box.FilterTubeNanahManagedOpenSync,
        ...(studyPacks ? { studyPacks } : {}) });
    return { ...ctx, link, keys, sealedItem, receiver };
}

/** In-memory copy of the Nanah relay's session rules (nanah/packages/signaling-cloudflare). */
export function fakeRelay() {
    const byCode = new Map();
    const bySocket = new Map();
    const frames = [];
    class FakeSocket {
        constructor() {
            this.readyState = 0;
            setTimeout(() => { this.readyState = 1; this.onopen?.(); }, 0);
        }
        deliver(message) { setTimeout(() => this.onmessage?.({ data: JSON.stringify(message) }), 0); }
        send(raw) {
            const message = JSON.parse(raw);
            frames.push(message);
            if (message.type === 'host_session') {
                const record = { code: message.code, sessionId: message.sessionId, host: this, peer: null };
                byCode.set(message.code, record);
                bySocket.set(this, record);
                this.deliver({ type: 'session_ready', code: message.code, sessionId: message.sessionId });
            } else if (message.type === 'join_session') {
                const record = byCode.get(message.code);
                if (!record) return this.deliver({ type: 'error', error: 'session_not_found' });
                if (record.peer) return this.deliver({ type: 'error', error: 'session_occupied' });
                record.peer = this;
                bySocket.set(this, record);
                this.deliver({ type: 'session_ready', code: record.code, sessionId: record.sessionId });
                record.host.deliver({ type: 'peer_joined', sessionId: record.sessionId });
            } else if (message.type === 'signal') {
                const record = bySocket.get(this);
                const target = record && (record.host === this ? record.peer : record.host);
                if (target) target.deliver(message);
            }
        }
        close() {
            if (this.readyState === 3) return;
            this.readyState = 3;
            const record = bySocket.get(this);
            bySocket.delete(this);
            if (record?.host === this) {
                byCode.delete(record.code);
                record.peer?.deliver({ type: 'peer_left', sessionId: record.sessionId });
            } else if (record?.peer === this) {
                record.peer = null;
                record.host.deliver({ type: 'peer_left', sessionId: record.sessionId });
            }
            setTimeout(() => this.onclose?.(), 0);
        }
    }
    return { WebSocketImpl: FakeSocket, frames, byCode };
}

