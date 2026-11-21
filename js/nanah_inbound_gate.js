/*
 * SEAMLESS_SYNC_SPEC.md §11 "Pairing order" (Android d231a33c7): the transport decrypts peer data as
 * soon as keys exist, before this side confirms the safety phrase. Incoming envelopes wait until the
 * session is connected and confirmed here, then run one at a time in arrival order; a reset drops
 * them. Peer data is never acted on or answered before the local confirmation.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeNanahInboundGate = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const MAX_HELD = 64;

    function create({ isOpen, handle, onError = null } = {}) {
        let held = [];
        let chain = Promise.resolve();
        let epoch = 0;
        function run(envelope, at) {
            chain = chain.then(() => (at === epoch ? handle(envelope) : null)).catch(error => { try { onError?.(error); } catch (_) {} });
            return chain;
        }
        return Object.freeze({
            push(envelope) {
                if (!isOpen()) {
                    if (held.length < MAX_HELD) held.push(envelope);
                    return chain;
                }
                // Anything still held goes first, so order is kept.
                if (held.length) this.drain();
                return run(envelope, epoch);
            },
            drain() {
                if (!isOpen() || !held.length) return chain;
                const queued = held;
                held = [];
                for (const envelope of queued) run(envelope, epoch);
                return chain;
            },
            reset() { held = []; epoch += 1; },
            get heldCount() { return held.length; }
        });
    }

    return Object.freeze({ create, MAX_HELD });
}));
