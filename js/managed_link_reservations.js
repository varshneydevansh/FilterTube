/*
 * SEAMLESS_SYNC_SPEC.md §11 (Android 997ac7c74, NanahRepairRelease): removing a parent→child link
 * leaves a reservation on every transport whose cleanup isn't confirmed, so an old envelope can
 * never revive the link. A fresh, phrase-confirmed pairing may release a reservation only when the
 * link was tracked from creation, nothing was ever prepared for it on that transport, and the
 * transport was and still is unconfigured. Pure functions; the dashboard stores the two records.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedLinkReservations = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const EXPOSURE_KEY = 'ftManagedProviderExposureV1';
    const REMOVED_KEY = 'ftManagedRemovedLinksV1';
    const TRANSPORTS = ['mailbox', 'local_network', 'courier'];
    const MAX_LINKS = 256;
    const str = value => (typeof value === 'string' ? value.trim() : '');
    const obj = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

    function readLedger(raw) {
        const value = obj(raw);
        return { version: 1, tracked: { ...obj(value.tracked) }, exposed: { ...obj(value.exposed) } };
    }

    function cap(map) {
        const keys = Object.keys(map);
        return keys.length > MAX_LINKS ? Object.fromEntries(keys.slice(-MAX_LINKS).map(key => [key, map[key]])) : map;
    }

    /** Written when a source link is created on this version: only these links can ever be released. */
    function markTracked(raw, linkId) {
        const ledger = readLedger(raw);
        const id = str(linkId);
        if (id) ledger.tracked = cap({ ...ledger.tracked, [id]: true });
        return ledger;
    }

    /** Written before any send is prepared on `transport`; it outlives the send and the link. */
    function markExposed(raw, linkId, transport) {
        const ledger = readLedger(raw);
        const id = str(linkId);
        if (!id || !TRANSPORTS.includes(transport)) return ledger;
        ledger.exposed = cap({ ...ledger.exposed, [id]: { ...obj(ledger.exposed[id]), [transport]: true } });
        return ledger;
    }

    /** "configured:<host>" or "unconfigured", so a later check can tell the config didn't change. */
    function configDigest(configured, host = '') {
        return configured ? `configured:${str(host).toLowerCase()}` : 'unconfigured';
    }

    /**
     * The record kept after a removal. Each transport is `purged` (its cleanup was confirmed),
     * `blocked` with reason `provider_unconfigured` (no provider, so nothing could be cleaned), or
     * `pending` (configured, cleanup not confirmed).
     */
    function removalRecord({ linkId, removedAt, transports = {} }) {
        const out = { linkId: str(linkId), removedAt: Number(removedAt) || 0, transports: {} };
        for (const transport of TRANSPORTS) {
            const row = obj(transports[transport]);
            const digest = str(row.digest) || configDigest(row.configured === true, row.host);
            if (row.ok === true) out.transports[transport] = { state: 'purged', digest };
            else if (row.configured !== true) out.transports[transport] = { state: 'blocked', reason: 'provider_unconfigured', digest };
            else out.transports[transport] = { state: 'pending', reason: str(row.reason) || 'cleanup_unconfirmed', digest };
        }
        return out;
    }

    /**
     * Whether a fresh pairing may save `linkId` again. `{ allowed: true, released: [...] }` or
     * `{ allowed: false, reason: 'source_link_reserved_<transport>' }`.
     */
    function evaluateRepair({ record, ledger, currentDigests = {} }) {
        const removed = obj(record);
        if (!str(removed.linkId)) return { allowed: true, released: [] };
        const book = readLedger(ledger);
        const tracked = book.tracked[removed.linkId] === true;
        const exposed = obj(book.exposed[removed.linkId]);
        const released = [];
        for (const transport of TRANSPORTS) {
            const row = obj(obj(removed.transports)[transport]);
            if (!row.state || row.state === 'purged' || row.state === 'released') continue;
            const releasable = row.state === 'blocked' && row.reason === 'provider_unconfigured'
                && tracked && exposed[transport] !== true
                && row.digest === 'unconfigured' && str(currentDigests[transport]) === 'unconfigured';
            if (!releasable) return { allowed: false, reason: `source_link_reserved_${transport}` };
            released.push(transport);
        }
        return { allowed: true, released };
    }

    /** The record after a release: each released transport is kept as released_unexposed_repair. */
    function releaseRecord(record, released) {
        const removed = obj(record);
        const transports = { ...obj(removed.transports) };
        for (const transport of released) transports[transport] = { ...obj(transports[transport]), state: 'released', reason: 'released_unexposed_repair' };
        return { ...removed, transports };
    }

    return Object.freeze({ EXPOSURE_KEY, REMOVED_KEY, TRANSPORTS, readLedger, markTracked, markExposed, configDigest,
        removalRecord, evaluateRepair, releaseRecord });
}));
