/* Durable delivery bookkeeping only. Callers own consent, signatures and profile authority. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeAutoSyncQueue = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const KEY = 'ftAutoSyncQueueV1';
    // Payloads default to 512 KiB. A caller may allow up to LARGE_PAYLOAD_BYTES for one item:
    // personal sync does, because a message carrying playlists can reach 3 MiB.
    const MAX_BYTES = 16 * 1024 * 1024, MAX_PAYLOAD_BYTES = 512 * 1024, LARGE_PAYLOAD_BYTES = 4 * 1024 * 1024;
    const MAX_ENROLLMENTS = 64, MAX_CHANNELS = 256;
    const fail = reason => { throw Error(reason); };
    const bytes = value => new TextEncoder().encode(value).length;
    const integer = value => Number.isSafeInteger(value) && value >= 0;
    const id = (value, max = 128) => typeof value === 'string' && value.length > 0
        && value.length <= max && !/[\u0000-\u001f]/u.test(value);
    function keys(value, required, optional = []) {
        if (!value || typeof value !== 'object' || Array.isArray(value)
            || required.some(key => !Object.hasOwn(value, key))
            || Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) fail('queue_state_invalid');
    }
    function json(value, depth = 0, seen = new Set()) {
        if (depth > 32) fail('queue_payload_invalid');
        if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (!value || typeof value !== 'object' || seen.has(value)
            || (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))) fail('queue_payload_invalid');
        seen.add(value);
        if (Array.isArray(value) && (Object.keys(value).length !== value.length
            || Object.keys(value).some((key, index) => key !== String(index)))) fail('queue_payload_invalid');
        const out = Array.isArray(value) ? [] : Object.create(null);
        for (const key of Object.keys(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (!descriptor || !Object.hasOwn(descriptor, 'value')) fail('queue_payload_invalid');
            out[key] = json(descriptor.value, depth + 1, seen);
        }
        seen.delete(value);
        return out;
    }
    function payload(value, limit = MAX_PAYLOAD_BYTES) {
        const encoded = JSON.stringify(json(value));
        if (bytes(encoded) > Math.min(limit, LARGE_PAYLOAD_BYTES)) fail('queue_payload_too_large');
        return JSON.parse(encoded);
    }
    function validate(state) {
        keys(state, ['version', 'nextEpoch', 'nextTicket', 'enrollments']);
        if (state.version !== 1 || !integer(state.nextEpoch) || state.nextEpoch < 1
            || !integer(state.nextTicket) || state.nextTicket < 1 || !Array.isArray(state.enrollments)
            || state.enrollments.length > MAX_ENROLLMENTS) fail('queue_state_invalid');
        const ids = new Set(); let count = 0;
        for (const enrollment of state.enrollments) {
            keys(enrollment, ['enrollmentId', 'binding', 'epoch', 'enabled', 'channels']);
            if (!id(enrollment.enrollmentId) || !id(enrollment.binding, 1024) || !integer(enrollment.epoch)
                || enrollment.epoch < 1 || enrollment.epoch >= state.nextEpoch || typeof enrollment.enabled !== 'boolean'
                || !Array.isArray(enrollment.channels) || ids.has(enrollment.enrollmentId)
                || (!enrollment.enabled && enrollment.channels.length)) fail('queue_state_invalid');
            ids.add(enrollment.enrollmentId);
            const channels = new Set();
            for (const row of enrollment.channels) {
                keys(row, ['channel', 'fingerprint', 'sequence', 'status', 'attempts', 'dueAt', 'ticket', 'reason'], ['payload']);
                if (!id(row.channel) || !id(row.fingerprint, 256) || !integer(row.sequence) || row.sequence < 1
                    || !['pending', 'inflight', 'waiting', 'applied', 'rejected'].includes(row.status)
                    || !integer(row.attempts) || row.attempts > 30 || !integer(row.dueAt)
                    || !integer(row.ticket) || row.ticket >= state.nextTicket || typeof row.reason !== 'string'
                    || row.reason.length > 128 || channels.has(row.channel)) fail('queue_state_invalid');
                channels.add(row.channel); count++;
                const terminal = ['applied', 'rejected'].includes(row.status);
                if (terminal === Object.hasOwn(row, 'payload')) fail('queue_state_invalid');
                if (!terminal) payload(row.payload, LARGE_PAYLOAD_BYTES);
            }
        }
        if (count > MAX_CHANNELS) fail('queue_capacity');
        return state;
    }
    function create({ get, set, withLock, now = Date.now, key = KEY, leaseMs = 30000, retryMs = 1000, maxRetryMs = 300000 }) {
        if (![get, set, withLock, now].every(value => typeof value === 'function') || !id(key)
            || ![leaseMs, retryMs, maxRetryMs].every(value => integer(value) && value > 0)
            || maxRetryMs < retryMs) fail('queue_dependencies_invalid');
        const clock = () => { const value = now(); if (!integer(value)) fail('queue_clock_invalid'); return value; };
        const increment = value => { if (value >= Number.MAX_SAFE_INTEGER) fail('queue_counter_exhausted'); return value + 1; };
        async function load() {
            const raw = (await get([key]))[key];
            if (raw === undefined) return { version: 1, nextEpoch: 1, nextTicket: 1, enrollments: [] };
            if (typeof raw !== 'string' || raw.length > MAX_BYTES || bytes(raw) > MAX_BYTES) fail('queue_state_invalid');
            let state; try { state = JSON.parse(raw); } catch (_) { fail('queue_state_invalid'); }
            return validate(state);
        }
        async function save(state) {
            const encoded = JSON.stringify(validate(state));
            if (bytes(encoded) > MAX_BYTES) fail('queue_capacity');
            await set({ [key]: encoded });
            if ((await get([key]))[key] !== encoded) fail('queue_storage_not_verified');
        }
        const find = (state, enrollmentId) => state.enrollments.find(row => row.enrollmentId === enrollmentId);
        const handle = (enrollment, row) => ({ enrollmentId: enrollment.enrollmentId, binding: enrollment.binding,
            epoch: enrollment.epoch, channel: row.channel, fingerprint: row.fingerprint, sequence: row.sequence, ticket: row.ticket });
        function match(state, expected, ticket = false) {
            const enrollment = find(state, expected?.enrollmentId);
            if (!enrollment?.enabled || enrollment.binding !== expected.binding || enrollment.epoch !== expected.epoch) return null;
            const row = enrollment.channels.find(item => item.channel === expected.channel);
            return row && row.sequence === expected.sequence && row.fingerprint === expected.fingerprint
                && (!ticket || row.ticket === expected.ticket) ? row : null;
        }
        function enroll({ enrollmentId, binding, enabled = true }) {
            if (!id(enrollmentId) || !id(binding, 1024) || typeof enabled !== 'boolean') return Promise.reject(Error('queue_enrollment_invalid'));
            return withLock(async () => {
                const state = await load(), old = find(state, enrollmentId);
                if (old?.binding === binding && old.enabled === enabled) return { enrollmentId, binding, enabled, epoch: old.epoch };
                const epoch = state.nextEpoch; state.nextEpoch = increment(epoch);
                const next = { enrollmentId, binding, enabled, epoch, channels: [] };
                state.enrollments = state.enrollments.filter(row => row.enrollmentId !== enrollmentId).concat(next);
                await save(state); return { enrollmentId, binding, enabled, epoch };
            });
        }
        function disable(enrollmentId) {
            if (!id(enrollmentId)) return Promise.reject(Error('queue_enrollment_invalid'));
            return withLock(async () => {
                const state = await load(), old = find(state, enrollmentId);
                if (!old || !old.enabled) return false;
                old.epoch = state.nextEpoch; state.nextEpoch = increment(state.nextEpoch);
                old.enabled = false; old.channels = [];
                await save(state); return true;
            });
        }
        function remove(enrollmentId, expectedBinding = null) {
            if (!id(enrollmentId) || (expectedBinding !== null && !id(expectedBinding, 1024))) return Promise.reject(Error('queue_enrollment_invalid'));
            return withLock(async () => {
                const state = await load(), enrollment = find(state, enrollmentId);
                if (!enrollment || (expectedBinding !== null && enrollment.binding !== expectedBinding)) return false;
                state.enrollments = state.enrollments.filter(row => row.enrollmentId !== enrollmentId);
                await save(state); return true;
            });
        }
        function enqueue(enrollmentId, channel, fingerprint, value, { maxBytes = MAX_PAYLOAD_BYTES } = {}) {
            if (!id(enrollmentId) || !id(channel) || !id(fingerprint, 256)) return Promise.reject(Error('queue_item_invalid'));
            const detached = payload(value, maxBytes);
            return withLock(async () => {
                const state = await load(), enrollment = find(state, enrollmentId);
                if (!enrollment?.enabled) fail('queue_not_enrolled');
                const old = enrollment.channels.find(row => row.channel === channel);
                if (old?.fingerprint === fingerprint) return { changed: false, ...handle(enrollment, old), status: old.status };
                const row = { channel, fingerprint, sequence: increment(old?.sequence || 0), status: 'pending',
                    attempts: 0, dueAt: clock(), ticket: 0, reason: '', payload: detached };
                enrollment.channels = enrollment.channels.filter(item => item.channel !== channel).concat(row);
                await save(state); return { changed: true, ...handle(enrollment, row), status: row.status };
            });
        }
        function read() { return withLock(load); }
        function wake(enrollmentId = null) {
            if (enrollmentId !== null && !id(enrollmentId)) return Promise.reject(Error('queue_enrollment_invalid'));
            return withLock(async () => {
                const state = await load(), time = clock(); let changed = false;
                for (const enrollment of state.enrollments) {
                    if (!enrollment.enabled || (enrollmentId !== null && enrollment.enrollmentId !== enrollmentId)) continue;
                    for (const row of enrollment.channels) {
                        if (row.status === 'waiting' && row.dueAt > time) { row.dueAt = time; changed = true; }
                    }
                }
                if (changed) await save(state);
                return changed;
            });
        }
        async function claim(filter) {
            return withLock(async () => {
                const state = await load(), time = clock();
                for (const enrollment of state.enrollments) {
                    if (!enrollment.enabled) continue;
                    const row = enrollment.channels.find(item => !['applied', 'rejected'].includes(item.status) && item.dueAt <= time
                        && filter(Object.freeze(handle(enrollment, item))) === true);
                    if (!row) continue;
                    row.status = 'inflight'; row.attempts = Math.min(30, row.attempts + 1);
                    row.ticket = state.nextTicket; state.nextTicket = increment(state.nextTicket);
                    row.dueAt = time + leaseMs;
                    await save(state);
                    return { ...handle(enrollment, row), payload: row.payload, attempts: row.attempts };
                }
                return null;
            });
        }
        async function finish(expected, result, checkTicket) {
            return withLock(async () => {
                const state = await load(), row = match(state, expected, checkTicket);
                if (!row || ['applied', 'rejected'].includes(row.status)) return false;
                const status = result?.status;
                if (!['waiting', 'applied', 'rejected'].includes(status)) fail('queue_result_invalid');
                row.status = status;
                row.reason = typeof result.reason === 'string' ? result.reason.slice(0, 128) : '';
                if (status === 'waiting') row.dueAt = clock() + Math.min(maxRetryMs, retryMs * (2 ** Math.min(29, Math.max(0, row.attempts - 1))));
                else { delete row.payload; row.dueAt = 0; }
                await save(state); return true;
            });
        }
        function acknowledge(expected, result) {
            // The handle is correlation, never proof. Call only after authenticating a receipt.
            return finish(expected, result, false);
        }
        async function run({ authorize, send, filter = () => true, limit = 16 }) {
            if (typeof authorize !== 'function' || typeof send !== 'function' || typeof filter !== 'function'
                || !integer(limit) || limit < 1 || limit > MAX_CHANNELS) fail('queue_runner_invalid');
            const results = [];
            for (let index = 0; index < limit; index++) {
                const item = await claim(filter); if (!item) break;
                let result;
                try {
                    if (await authorize(item) !== true) result = { status: 'waiting', reason: 'authorization_required' };
                    else if (!await withLock(async () => !!match(await load(), item, true))) {
                        results.push({ ...handle({ enrollmentId: item.enrollmentId, binding: item.binding, epoch: item.epoch }, item), current: false });
                        continue;
                    } else {
                        result = await send(item);
                        if (await authorize(item) !== true) result = { status: 'waiting', reason: 'authorization_changed' };
                        else if (!['waiting', 'applied', 'rejected'].includes(result?.status)) result = { status: 'waiting', reason: 'delivery_result_invalid' };
                    }
                } catch (_) { result = { status: 'waiting', reason: 'delivery_unavailable' }; }
                const current = await finish(item, result, true);
                const { payload: _payload, ...summary } = item;
                results.push({ ...summary, status: result.status, reason: result.reason || '', current });
            }
            return results;
        }
        return Object.freeze({ enroll, disable, remove, enqueue, read, wake, run, acknowledge });
    }
    return Object.freeze({ KEY, MAX_BYTES, MAX_PAYLOAD_BYTES, LARGE_PAYLOAD_BYTES, MAX_ENROLLMENTS, MAX_CHANNELS, create });
}));
