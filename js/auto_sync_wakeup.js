/* Background wakeups only: no transport, payload reads, new tabs or authority. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeAutoSyncWakeup = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    const KEY = 'ftAutoSyncQueueV1';
    const ALARM = 'filtertube-auto-sync-wake-v1';
    const ACTION = 'FilterTube_AutoSyncWake';
    function describe(raw) {
        if (raw === undefined) return { enabled: false, signature: '' };
        try {
            if (typeof raw !== 'string' || raw.length > 4 * 1024 * 1024) return { enabled: false, signature: 'invalid' };
            const state = JSON.parse(raw);
            if (state.version !== 1 || !Array.isArray(state.enrollments) || state.enrollments.length > 64) return { enabled: false, signature: 'invalid' };
            const rows = state.enrollments.map(row => {
                if (!row || typeof row.enrollmentId !== 'string' || typeof row.binding !== 'string'
                    || typeof row.enabled !== 'boolean' || !Number.isSafeInteger(row.epoch) || !Array.isArray(row.channels)) throw Error('invalid');
                return [row.enrollmentId, row.binding, row.epoch, row.enabled,
                    row.channels.map(area => [area.channel, area.fingerprint, area.sequence])];
            });
            return { enabled: state.enrollments.some(row => row.enabled === true), signature: JSON.stringify(rows) };
        } catch (_) { return { enabled: false, signature: 'invalid' }; }
    }
    function install({ api, promiseApi = !!root.browser && api === root.browser }) {
        let stopped = false, pending = Promise.resolve();
        const listeners = [];
        function invoke(target, method, args = [], noCallback = false) {
            return new Promise((resolve, reject) => {
                let settled = false;
                const done = result => {
                    if (settled) return; settled = true;
                    const error = api.runtime?.lastError;
                    if (error) reject(Error('autosync_wakeup_api_failed'));
                    else resolve(result);
                };
                try {
                    const result = target[method](...args, ...(!promiseApi && !noCallback ? [done] : []));
                    if (result && typeof result.then === 'function') result.then(done, reject);
                    else if (promiseApi || noCallback) done(result);
                } catch (error) { reject(error); }
            });
        }
        async function check(reason) {
            if (stopped) return { ok: true, enabled: false };
            // A read failure must not interpret unknown enrollment state as consent.
            const stored = await invoke(api.storage.local, 'get', [[KEY]]);
            if (stopped) return { ok: true, enabled: false };
            const enabled = describe(stored?.[KEY]).enabled;
            const current = await invoke(api.alarms, 'get', [ALARM]);
            if (stopped) return { ok: true, enabled: false };
            if (!enabled) {
                if (current) await invoke(api.alarms, 'clear', [ALARM]);
                return { ok: true, enabled: false };
            }
            if (!current || current.periodInMinutes !== 1) {
                // Chrome 111 supports one-minute alarms; no indefinite worker keepalive.
                await invoke(api.alarms, 'create', [ALARM, { delayInMinutes: 1, periodInMinutes: 1 }], true);
            }
            if (stopped) return { ok: true, enabled: false };
            try { await invoke(api.runtime, 'sendMessage', [{ action: ACTION, reason }]); }
            catch (_) { /* No dashboard is open. Keep the durable queue for a later wake. */ }
            return { ok: true, enabled: true };
        }
        function reconcile(reason = 'background_wake') {
            const safeReason = ['worker_start', 'browser_start', 'extension_installed', 'queue_changed', 'retry_alarm'].includes(reason)
                ? reason : 'background_wake';
            const result = pending.then(() => check(safeReason)).catch(() => ({ ok: false, reason: 'wakeup_unavailable' }));
            pending = result; return result;
        }
        function listen(event, callback) {
            if (!event || typeof event.addListener !== 'function') return;
            event.addListener(callback); listeners.push([event, callback]);
        }
        listen(api.runtime?.onStartup, () => reconcile('browser_start'));
        listen(api.runtime?.onInstalled, () => reconcile('extension_installed'));
        listen(api.alarms?.onAlarm, alarm => alarm?.name === ALARM ? reconcile('retry_alarm') : undefined);
        listen(api.storage?.onChanged, (changes, area) => {
            if (area !== 'local' || !Object.hasOwn(changes || {}, KEY)) return;
            const change = changes[KEY];
            // Claims, retries and receipts do not themselves cause a message loop.
            if (describe(change?.oldValue).signature !== describe(change?.newValue).signature) return reconcile('queue_changed');
        });
        const ready = reconcile('worker_start');
        function dispose() {
            stopped = true;
            for (const [event, callback] of listeners) event.removeListener?.(callback);
        }
        return Object.freeze({ ready, reconcile, dispose });
    }
    return Object.freeze({ KEY, ALARM, ACTION, install });
}));
