/*
 * Seamless parent→child sync in the background worker (docs/sync/SEAMLESS_SYNC_SPEC.md, Android
 * reference on feature/sync-seamless-android). No dashboard tab is needed on either side.
 *
 * - Doorbell: while a YouTube (or dashboard) tab is open, internet sync was allowed and the device
 *   has a managed link, the worker waits at its doorbell. In Chrome the open WebSocket plus a 20 s
 *   keepalive frame keeps the worker running (Chrome 116+); the 1-minute alarm restarts it when
 *   the browser stopped the worker anyway (older Chrome, Firefox event page).
 * - Child: a valid ring → announce → courier pickup. Viewer focus → announce (30 s per parent) and
 *   mailbox pickup. Every check goes through managed_update_receiver.js (the adapter's checks).
 * - Parent: the outbox (device-local, ciphertext only) holds each Send until the child acks it.
 *   Ring after Send and on focus (60 s per link); answer an announce by hosting a courier.
 * - The courier is WebRTC, which a Chrome service worker lacks: it runs in the Firefox background
 *   page, an open dashboard, or a hidden extension frame in a YouTube tab. No new permission.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedSyncBackground = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const OUTBOX_KEY = 'ftManagedOutboxV1';
    const CONSENT_KEY = 'ftInternetSyncConsentV1';
    const MAILBOX_CONFIG_KEY = 'ftManagedMailboxServerConfig';
    const OPEN_SYNC_STATE_KEY = 'ftNanahManagedOpenSyncState';
    const ALARM = 'filtertube-managed-sync-v1';
    const DAY_MS = 24 * 60 * 60 * 1000;
    const OUTBOX_TTL_MS = 7 * DAY_MS;
    const OUTBOX_LIMIT = 64;
    const ANNOUNCE_GAP_MS = 30 * 1000;
    const RING_GAP_MS = 60 * 1000;
    const MAILBOX_EVERY_MS = 45 * 1000;
    const ANSWER_WAIT_MS = 20 * 1000;
    const FINISHED = ['delivered', 'up_to_date', 'applied', 'rejected', 'expired'];
    const VIEWER_PATTERNS = ['*://*.youtube.com/*', '*://*.youtubekids.com/*'];

    const str = value => (typeof value === 'string' ? value.trim() : '');
    const obj = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    const arr = value => (Array.isArray(value) ? value : []);

    // ---------------------------------------------------------------- outbox (§4), pure helpers

    function emptyOutbox() { return { version: 1, entries: [] }; }

    function readOutbox(raw) {
        const root = obj(raw);
        if (root.version !== 1 || !Array.isArray(root.entries)) return emptyOutbox();
        return { version: 1, entries: root.entries.filter(entry => str(obj(entry).entryId) && str(obj(entry).linkId)) };
    }

    /** Drops what is older than 7 days, expires stale queued entries, keeps at most 64. */
    function pruneOutbox(outbox, nowMs) {
        const entries = readOutbox(outbox).entries.map(entry => {
            if (entry.state === 'queued' && Number(entry.expiresAt) <= nowMs) {
                return { ...entry, state: 'expired', stateAt: nowMs, reason: 'outbox_expired' };
            }
            return entry;
        }).filter(entry => !(FINISHED.includes(entry.state) && nowMs - (Number(entry.stateAt) || 0) > OUTBOX_TTL_MS));
        while (entries.length > OUTBOX_LIMIT) {
            const finished = entries.map((entry, index) => [entry, index]).filter(([entry]) => FINISHED.includes(entry.state))
                .sort((a, b) => (Number(a[0].stateAt) || 0) - (Number(b[0].stateAt) || 0));
            const drop = finished.length ? finished[0][1] : entries
                .map((entry, index) => [entry, index]).sort((a, b) => (Number(a[0].createdAt) || 0) - (Number(b[0].createdAt) || 0))[0][1];
            entries.splice(drop, 1);
        }
        return { version: 1, entries };
    }

    /** A new Send for the same link + scope replaces any older queued entry for it. */
    function enqueueOutbox(outbox, rows, nowMs) {
        const entries = readOutbox(outbox).entries.slice();
        for (const row of rows) {
            for (let index = entries.length - 1; index >= 0; index -= 1) {
                const old = entries[index];
                if (old.state === 'queued' && old.linkId === row.linkId && old.scope === row.scope) entries.splice(index, 1);
                else if (old.entryId === row.entryId) entries.splice(index, 1);
            }
            entries.push(row);
        }
        return pruneOutbox({ version: 1, entries }, nowMs);
    }

    /** §4 state from a child's ack record. */
    function stateFromAck(record) {
        const ack = obj(record);
        const ackState = str(ack.ackState).toLowerCase();
        if (ackState === 'expired') return 'expired';
        if (ackState === 'rejected' || ackState === 'revoked' || ackState === 'conflict') return 'rejected';
        // Spec §4 (79108f833): applied only when the child's rules changed; accepted without a change
        // (idempotent, or the same rules again) is up_to_date. `delivered` stays for older entries only.
        if (ack.accepted === true && ack.applied === true) return 'applied';
        if (ack.accepted === true || ackState === 'delivered') return 'up_to_date';
        return '';
    }

    /**
     * Applies acks that came from `fromDeviceId`; an ack for another device's entry is ignored, and so
     * is one for an entry already past `delivered` (a replay can't move it twice, spec §10.3).
     * `unverified` holds the mailboxItemIds whose ack had no MAC (an older child).
     */
    function applyAcks(outbox, acks, fromDeviceId, linkDevice, nowMs, unverified = new Set()) {
        const byId = new Map(arr(acks).map(obj).filter(row => str(row.mailboxItemId)).map(row => [str(row.mailboxItemId), row]));
        let changed = 0;
        const entries = readOutbox(outbox).entries.map(entry => {
            const ack = byId.get(entry.entryId);
            if (!ack || !['queued', 'delivered'].includes(entry.state) || str(ack.linkId) !== entry.linkId) return entry;
            if (linkDevice(entry.linkId) !== str(fromDeviceId)) return entry;
            const state = stateFromAck(ack);
            if (!state || state === entry.state) return entry;
            changed += 1;
            const unresolved = arr(ack.unresolvedPackIds).map(str).filter(id => /^[A-Za-z0-9_.-]{1,64}$/.test(id)).slice(0, 64);
            return { ...entry, state, stateAt: nowMs, reason: state === 'rejected' || state === 'expired' ? (str(ack.reason).slice(0, 80) || state) : null,
                ...(unresolved.length && ['applied', 'delivered', 'up_to_date'].includes(state) ? { unresolvedPackIds: unresolved } : {}),
                unverified: unverified.has(entry.entryId) };
        });
        return { outbox: { version: 1, entries }, changed };
    }

    /** Builds an outbox row from a sealed item the dashboard handed over (ciphertext only). */
    function outboxRow(raw, link, meta, nowMs) {
        const item = obj(raw);
        if (item.schema !== 'filtertube_managed_mailbox_item' || item.version !== 1 || !str(item.mailboxItemId)
            || !str(item.ciphertext) || item.decryptedEnvelope || item.envelope || item.payload) return null;
        if (str(item.linkId) !== str(link.linkId) || str(item.targetDeviceId) !== str(link.remoteDeviceId)) return null;
        const createdAt = Number(item.createdAtMs) || nowMs;
        const expiresAt = Number(item.expiresAtMs) || createdAt + OUTBOX_TTL_MS;
        return {
            entryId: str(item.mailboxItemId),
            linkId: str(item.linkId),
            remoteDeviceId: str(link.remoteDeviceId),
            remoteLabel: str(meta.remoteLabel || link.deviceLabel).slice(0, 80),
            targetProfileId: str(item.targetProfileId),
            targetProfileName: str(meta.targetProfileName).slice(0, 80),
            scope: str(item.scope),
            revision: Number(item.revision) || null,
            policyHash: str(item.policyHash),
            item,
            createdAt,
            expiresAt,
            state: 'queued',
            stateAt: nowMs,
            reason: null,
            attempts: 0,
            lastAttemptAt: null,
            via: 'courier'
        };
    }

    function usable(link) {
        const policy = obj(link.policy);
        return link.linkType === 'managed_link' && !link.revoked && !link.keyRevoked && !link.stalePairing
            && policy.revoked !== true && policy.keyRevoked !== true && policy.stalePairing !== true;
    }
    const isParentLink = link => usable(link) && link.localRole === 'source' && link.remoteRole === 'replica';
    const isChildLink = link => usable(link) && link.localRole === 'replica' && link.remoteRole === 'source';

    // ---------------------------------------------------------------- worker wiring

    function install({ api, promiseApi = false, isTrustedUiSender, getSelfControlSession = null, now = () => Date.now(),
        Receiver = root.FilterTubeManagedUpdateReceiver, Doorbell = root.FilterTubeManagedDoorbell,
        Courier = root.FilterTubeManagedCourier, MailboxClient = root.FilterTubeManagedMailboxClient,
        Auth = root.FilterTubeManagedSeamlessAuth } = {}) {
        if (!api?.storage?.local || !Receiver || !Doorbell) return null;
        const call = (target, method, ...args) => (promiseApi
            ? Promise.resolve().then(() => target[method](...args))
            : new Promise((resolve, reject) => {
                try {
                    target[method](...args, result => (api.runtime?.lastError ? reject(new Error('api_failed')) : resolve(result)));
                } catch (error) { reject(error); }
            }));
        const get = keys => call(api.storage.local, 'get', keys).then(obj);
        const set = values => call(api.storage.local, 'set', values);
        const receiver = Receiver.create({ get, set });
        const selfControlActive = typeof getSelfControlSession === 'function'
            ? async () => !!(await getSelfControlSession()) : null;
        const dashboardUrl = api.runtime.getURL('html/tab-view.html');
        // Step log (ids, counts and reason codes only), like Android's seamless-sync debug lines.
        const log = (event, details) => {
            try { root.console?.info?.(`FilterTube sync: ${event}`, JSON.stringify(details || {})); } catch (_) {}
        };

        let listener = null;
        let listenerDevice = '';
        let mailboxTimer = null;
        const lastAnnounce = new Map();
        const lastRing = new Map();
        const jobs = new Map();

        // One writer for the outbox: every change goes through this chain.
        let outboxChain = Promise.resolve();
        function mutateOutbox(fn) {
            const next = outboxChain.then(async () => {
                const stored = await get([OUTBOX_KEY]);
                const result = await fn(pruneOutbox(stored[OUTBOX_KEY], now()));
                if (result?.outbox) await set({ [OUTBOX_KEY]: pruneOutbox(result.outbox, now()) });
                return result;
            });
            outboxChain = next.catch(() => null);
            return next;
        }

        /**
         * The Internet Pickup config holds a bearer token, so it never sits in storage.local, which
         * YouTube content scripts can read. Chrome: storage.session (trusted contexts only), filled by
         * the dashboard. Firefox: the background page shares the dashboard's localStorage.
         */
        async function mailboxConfig() {
            try {
                if (api.storage.session?.get) {
                    const stored = obj(await call(api.storage.session, 'get', [MAILBOX_CONFIG_KEY]));
                    if (stored[MAILBOX_CONFIG_KEY]) return stored[MAILBOX_CONFIG_KEY];
                }
            } catch (_) { /* fall through */ }
            try {
                const raw = root.localStorage?.getItem?.(MAILBOX_CONFIG_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (_) { return null; }
        }

        async function context() {
            const trust = await receiver.readTrust();
            const stored = await get([CONSENT_KEY]);
            return {
                ...trust,
                consent: obj(stored[CONSENT_KEY]).accepted === true,
                mailboxConfig: await mailboxConfig(),
                parentLinks: trust.links.filter(isParentLink),
                childLinks: trust.links.filter(isChildLink)
            };
        }

        async function viewerTabs() {
            try {
                const tabs = arr(await call(api.tabs, 'query', { url: VIEWER_PATTERNS }));
                const dashboards = arr(await call(api.tabs, 'query', {})).filter(tab => str(tab.url).startsWith(dashboardUrl));
                return { youtube: tabs, dashboards };
            } catch (_) { return { youtube: [], dashboards: [] }; }
        }

        function mailboxProvider(config) {
            if (!MailboxClient?.createProvider || !config) return null;
            try {
                const provider = MailboxClient.createProvider(config, { adapter: root.FilterTubeNanahAdapter });
                return provider?.configured ? provider : null;
            } catch (_) { return null; }
        }

        // ------------------------------------------------------------ pickup (child, §5)
        // Every apply (mailbox pickup or courier items) runs one at a time, so two runs never
        // read and write the same profiles at once.
        let applyChain = Promise.resolve();
        function serialApply(fn) {
            const next = applyChain.then(fn);
            applyChain = next.catch(() => null);
            return next;
        }
        const pickupRunner = Receiver.createCoalescingRunner(reason => serialApply(async () => {
            const ctx = await context();
            const provider = mailboxProvider(ctx.mailboxConfig);
            if (!provider) return null;
            const writeState = state => set({ [OPEN_SYNC_STATE_KEY]: state });
            return receiver.runPickup({ reason, mailboxProvider: provider, selfControlActive, writeState });
        }));

        // ------------------------------------------------------------ courier jobs
        function courierHere() {
            return typeof root.RTCPeerConnection === 'function' && !!Courier && !!root.FilterTubeNanah;
        }

        function rawLinkFor(ctx, linkId) {
            return ctx.rawLinks.find(raw => Receiver.projectTrustedLink(raw)?.linkId === str(linkId)) || null;
        }

        async function applyCourierItems(items) {
            const result = await serialApply(() => receiver.runPickup({ reason: 'courier', courierItems: arr(items), selfControlActive }));
            const acks = arr(result?.acks);
            if (!Auth) return acks;
            // §10.2: each ack is MACed with its own link's key, so a stranger can't forge "Applied".
            const ctx = await context();
            return Promise.all(acks.map(ack => Auth.signAck(ack, rawLinkFor(ctx, ack.linkId)).catch(() => ack)));
        }

        /** Runs a courier job here (Firefox) or in an extension page; resolves with its result. */
        async function runCourier(job) {
            if (courierHere()) {
                return job.role === 'host'
                    ? Courier.host({ code: job.code, items: job.items, deviceId: job.deviceHash, onHosting: job.onHosting })
                    : Courier.join({ code: job.code, deviceId: job.deviceHash, onItems: applyCourierItems });
            }
            const id = Doorbell.courierCode().slice(7);
            return new Promise(resolve => {
                const entry = { ...job, id, claimed: false, resolve, timer: null, mountedTab: null, onHosting: job.onHosting };
                jobs.set(id, entry);
                const done = result => {
                    if (!jobs.has(id)) return;
                    jobs.delete(id);
                    clearTimeout(entry.timer);
                    if (entry.mountedTab !== null) {
                        call(api.tabs, 'sendMessage', entry.mountedTab, { action: 'FilterTube_CourierUnmount', jobId: id }).catch(() => {});
                    }
                    resolve(result);
                };
                entry.finish = done;
                entry.timer = setTimeout(() => done({ ok: false, reason: entry.claimed ? 'timeout' : 'no_courier_host' }), 45 * 1000);
                // An open dashboard takes it first; otherwise a hidden frame in a YouTube tab.
                call(api.runtime, 'sendMessage', { action: 'FilterTube_CourierOffer', jobId: id }).catch(() => {});
                setTimeout(async () => {
                    if (!jobs.has(id) || entry.claimed) return;
                    // Tabs where managed_update_banner.js runs (not Studio or bare embeds), the
                    // active one first; a tab whose content script is gone is skipped.
                    const { youtube } = await viewerTabs();
                    const hosts = youtube.filter(row => !/^https?:\/\/(studio\.youtube\.com|[^/]*youtube\.com\/embed\/)/i.test(str(row.url)))
                        .sort((a, b) => Number(!!b.active) - Number(!!a.active));
                    for (const tab of hosts) {
                        if (!jobs.has(id) || entry.claimed) return;
                        try {
                            await call(api.tabs, 'sendMessage', tab.id, { action: 'FilterTube_CourierMount', jobId: id });
                            entry.mountedTab = tab.id;
                            return;
                        } catch (_) { /* try the next tab */ }
                    }
                    done({ ok: false, reason: 'no_courier_host' });
                }, 700);
            });
        }

        // ------------------------------------------------------------ child: announce (§2.2)
        async function announceTo(parentDeviceId, linkIds, { force = false } = {}) {
            const ctx = await context();
            if (!ctx.consent || !ctx.deviceId) return { ok: false, reason: 'not_ready' };
            const last = lastAnnounce.get(parentDeviceId) || 0;
            if (!force && now() - last < ANNOUNCE_GAP_MS) return { ok: false, reason: 'throttled' };
            lastAnnounce.set(parentDeviceId, now());
            const answer = await Doorbell.call({
                remoteDeviceId: parentDeviceId,
                fromDeviceId: ctx.deviceId,
                timeoutMs: ANSWER_WAIT_MS + 5000,
                converse: async ({ send, next }) => {
                    const message = Doorbell.announceMessage(ctx.deviceId, linkIds);
                    send(Auth ? await Auth.signAnnounce(message, id => rawLinkFor(ctx, id), now()).catch(() => message) : message);
                    const timeout = new Promise(resolve => setTimeout(() => resolve(null), ANSWER_WAIT_MS));
                    for (;;) {
                        const payload = await Promise.race([next(), timeout]);
                        if (!payload) return { ok: false, reason: 'no_answer' };
                        const parsed = Doorbell.parseAnnounceAnswer(payload);
                        if (parsed) return { ok: true, ...parsed };
                    }
                }
            });
            log('announce_result', { ok: answer.ok === true, courier: !!answer.courier, itemCount: answer.itemCount || 0, reason: answer.reason || null });
            // §2.2: run a pickup with the courier code, or without one when there is none.
            if (answer.ok && answer.courier) {
                const deviceHash = await Doorbell.hash(ctx.deviceId);
                const result = await runCourier({ role: 'join', code: answer.courier, deviceHash });
                if (!result?.ok) {
                    // The courier's own error is the reason for this check (Android cf8520e63), not a
                    // mailbox or Home Pickup reason.
                    const reason = `courier:${str(result?.reason) || 'courier_failed'}`.slice(0, 96);
                    await set({ [Receiver.STATE_KEY]: { version: 1, lastPickupAt: now(), reason, appliedProfileIds: [] } }).catch(() => null);
                    void pickupRunner('courier');
                    return { ok: false, courier: true, reason };
                }
                void pickupRunner('courier');
                return { ok: true, courier: true };
            }
            void pickupRunner('announce');
            return { ok: answer.ok === true, courier: false, reason: answer.reason };
        }

        async function announceAll({ force = false } = {}) {
            const ctx = await context();
            const byParent = new Map();
            for (const link of ctx.childLinks) {
                if (!Receiver.explainIneligible || Receiver.explainIneligible(link, ctx.profilesV4)) continue;
                const parent = str(link.remoteDeviceId);
                if (!byParent.has(parent)) byParent.set(parent, []);
                byParent.get(parent).push(link.linkId);
            }
            await Promise.all([...byParent].map(([parent, ids]) => announceTo(parent, ids.slice(0, 16), { force }).catch(() => null)));
        }

        // ------------------------------------------------------------ parent: ring (§2.1)
        async function ringQueued({ linkIds = null, force = false } = {}) {
            const ctx = await context();
            if (!ctx.consent || !ctx.deviceId) return;
            const outbox = pruneOutbox((await get([OUTBOX_KEY]))[OUTBOX_KEY], now());
            const wanted = linkIds ? new Set(arr(linkIds).map(str)) : null;
            const byChild = new Map();
            for (const link of ctx.parentLinks) {
                if (wanted && !wanted.has(link.linkId)) continue;
                if (!outbox.entries.some(entry => entry.state === 'queued' && entry.linkId === link.linkId)) continue;
                if (!force && now() - (lastRing.get(link.linkId) || 0) < RING_GAP_MS) continue;
                lastRing.set(link.linkId, now());
                const child = str(link.remoteDeviceId);
                if (!byChild.has(child)) byChild.set(child, []);
                byChild.get(child).push(link.linkId);
            }
            await Promise.all([...byChild].map(([child, ids]) => Doorbell.call({
                remoteDeviceId: child,
                fromDeviceId: ctx.deviceId,
                timeoutMs: 10000,
                converse: async ({ send, next }) => {
                    send(Doorbell.ringMessage(ctx.deviceId, ids.slice(0, 16)));
                    const payload = await Promise.race([next(), new Promise(r => setTimeout(() => r(null), 8000))]);
                    return { ok: payload?.type === 'ft_update_ring_answer' && payload.ok === true };
                }
            }).catch(() => null)));
        }

        // ------------------------------------------------------------ doorbell signals
        async function onSignal(payload, reply) {
            const ctx = await context();
            const ring = Doorbell.parseUpdateCall(payload, Doorbell.RING);
            if (ring) {
                log('ring_received', { linkCount: ring.linkIds.length });
                // §2.1: keep only usable replica links to that same parent device.
                // Only links this device would apply on its own (the same rule as announceAll).
                const kept = ring.linkIds.filter(id => ctx.childLinks
                    .some(link => link.linkId === id && str(link.remoteDeviceId) === ring.fromDeviceId
                        && !Receiver.explainIneligible(link, ctx.profilesV4)));
                if (!kept.length) return;
                reply(Doorbell.ringAnswer());
                await announceTo(ring.fromDeviceId, kept, { force: true });
                return;
            }
            const announce = Doorbell.parseUpdateCall(payload, Doorbell.ANNOUNCE);
            if (!announce) return;
            log('announce_received', { linkCount: announce.linkIds.length, signed: !!payload?.auth });
            // §2.2: usable source links to that same child device.
            let kept = announce.linkIds.filter(id => ctx.parentLinks
                .some(link => link.linkId === id && str(link.remoteDeviceId) === announce.fromDeviceId));
            if (!kept.length) return;
            // §10.3: an announce with a MAC must verify for a link to count; none verifying means no
            // answer. One without `auth` (an older child) is still accepted in this version.
            if (Auth) {
                const check = await Auth.verifyAnnounce({ ...payload, linkIds: kept }, id => rawLinkFor(ctx, id), now());
                if (check.status === 'bad') return;
                if (check.status === 'ok') kept = check.linkIds;
            }
            const outbox = pruneOutbox((await get([OUTBOX_KEY]))[OUTBOX_KEY], now());
            const queued = outbox.entries.filter(entry => entry.state === 'queued' && kept.includes(entry.linkId)).slice(0, 16);
            if (!queued.length) { reply(Doorbell.announceAnswer('', 0)); return; }
            const code = Doorbell.courierCode();
            const deviceHash = await Doorbell.hash(ctx.deviceId);
            await mutateOutbox(box => ({
                outbox: { version: 1, entries: box.entries.map(entry => queued.some(row => row.entryId === entry.entryId)
                    ? { ...entry, attempts: (Number(entry.attempts) || 0) + 1, lastAttemptAt: now(), via: 'courier' } : entry) }
            }));
            let answered = false;
            const answer = () => { if (!answered) { answered = true; reply(Doorbell.announceAnswer(code, queued.length)); } };
            const result = await runCourier({ role: 'host', code, deviceHash, items: queued.map(entry => entry.item), onHosting: answer });
            if (!answered) answer();
            if (!result?.ok) {
                // The parent keeps the courier's reason on the waiting entries (still queued, retried).
                const reason = `courier:${str(result?.reason) || 'courier_failed'}`.slice(0, 96);
                await mutateOutbox(box => ({ outbox: { version: 1, entries: box.entries.map(entry =>
                    queued.some(row => row.entryId === entry.entryId) && entry.state === 'queued' ? { ...entry, lastAttemptReason: reason } : entry) } }));
            }
            if (result?.ok) {
                const linkDevice = id => str(ctx.parentLinks.find(link => link.linkId === id)?.remoteDeviceId);
                // §10.3: a wrong MAC is ignored; no MAC (an older child) applies but stays "unverified".
                const accepted = [];
                const unverified = new Set();
                for (const ack of arr(result.acks)) {
                    const verdict = Auth ? await Auth.verifyAck(ack, rawLinkFor(ctx, ack.linkId), now()).catch(() => 'bad') : 'unverified';
                    if (verdict === 'bad') continue;
                    if (verdict === 'unverified') unverified.add(str(ack.mailboxItemId));
                    accepted.push(ack);
                }
                await mutateOutbox(box => applyAcks(box, accepted, announce.fromDeviceId, linkDevice, now(), unverified));
            }
        }

        // ------------------------------------------------------------ listener lifecycle
        // Reconciles run one after another, so an older snapshot never overrides a newer one
        // (for example, consent withdrawn while a tab event was still being handled).
        let reconcileChain = Promise.resolve();
        function reconcile(reason = 'check') {
            const next = reconcileChain.then(() => reconcileNow(reason));
            reconcileChain = next.catch(() => null);
            return next;
        }
        async function reconcileNow(reason) {
            const ctx = await context();
            const tabs = await viewerTabs();
            const open = tabs.youtube.length > 0 || tabs.dashboards.length > 0;
            const wanted = open && ctx.consent && !!ctx.deviceId && (ctx.parentLinks.length > 0 || ctx.childLinks.length > 0);
            if (!wanted || listenerDevice !== ctx.deviceId) {
                listener?.stop();
                listener = null;
                listenerDevice = '';
            }
            if (wanted && !listener && typeof root.WebSocket === 'function') {
                listenerDevice = ctx.deviceId;
                listener = Doorbell.listen({ ownDeviceId: ctx.deviceId, onSignal: (payload, reply) => onSignal(payload, reply).catch(() => null) });
            }
            const pickupReady = open && ctx.childLinks.length > 0 && !!ctx.mailboxConfig;
            if (pickupReady && !mailboxTimer) mailboxTimer = setInterval(() => { void pickupRunner('viewer_open'); }, MAILBOX_EVERY_MS);
            if (!pickupReady && mailboxTimer) { clearInterval(mailboxTimer); mailboxTimer = null; }
            try {
                const alarm = await call(api.alarms, 'get', ALARM);
                if (open && !alarm) await call(api.alarms, 'create', ALARM, { delayInMinutes: 1, periodInMinutes: 1 });
                if (!open && alarm) await call(api.alarms, 'clear', ALARM);
            } catch (_) { /* The alarm is only a fallback. */ }
            if (reason === 'alarm' && pickupReady) void pickupRunner('alarm');
            return { listening: !!listener, open };
        }

        /** A viewer or the dashboard came to the front (§2.2, §5). */
        async function onForeground() {
            await reconcile('foreground');
            void pickupRunner('viewer_resume');
            void announceAll().catch(() => null);
            void ringQueued().catch(() => null);
        }

        function isViewerUrl(url) {
            const value = str(url);
            return /^https?:\/\/([a-z0-9-]+\.)*(youtube|youtubekids)\.com\//i.test(value) || value.startsWith(dashboardUrl);
        }

        // ------------------------------------------------------------ messages
        async function handleMessage(request, sender) {
            const action = request?.action;
            const trusted = typeof isTrustedUiSender === 'function' && isTrustedUiSender(sender) && sender.id === api.runtime.id;
            if (action === 'FilterTube_ManagedPickupNow' && trusted) {
                const result = await pickupRunner(str(request.reason) || 'dashboard');
                // No mailbox the worker can use: the dashboard runs its own check instead.
                if (!result) return { ok: false, reason: 'no_mailbox_provider' };
                const state = result.states?.[result.states.length - 1] || null;
                return { ok: true, state, appliedProfileIds: result.appliedProfileIds || [], pulledItemCount: Number(state?.pulledItemCount) || 0 };
            }
            if (action === 'FilterTube_ManagedOutboxEnqueue' && trusted) {
                const ctx = await context();
                const rows = [];
                for (const raw of arr(request.items).slice(0, 64)) {
                    const link = ctx.parentLinks.find(row => row.linkId === str(obj(raw.item).linkId));
                    const row = link ? outboxRow(raw.item, link, obj(raw), now()) : null;
                    if (row) rows.push(row);
                }
                await mutateOutbox(box => ({ outbox: enqueueOutbox(box, rows, now()) }));
                void reconcile('outbox').then(() => ringQueued({ linkIds: rows.map(row => row.linkId), force: true })).catch(() => null);
                return { ok: true, uploadedMailboxItemIds: rows.map(row => row.entryId) };
            }
            if (action === 'FilterTube_CourierClaim' && trusted) {
                const job = jobs.get(str(request.jobId));
                if (!job || job.claimed) return { ok: false };
                job.claimed = true;
                return { ok: true, job: { role: job.role, code: job.code, deviceHash: job.deviceHash, items: job.role === 'host' ? job.items : [] } };
            }
            if (action === 'FilterTube_CourierHosting' && trusted) {
                const job = jobs.get(str(request.jobId));
                if (job?.claimed) job.onHosting?.();
                return { ok: !!job };
            }
            if (action === 'FilterTube_CourierItems' && trusted) {
                const job = jobs.get(str(request.jobId));
                if (!job?.claimed || job.role !== 'join') return { ok: false, records: [] };
                return { ok: true, records: await applyCourierItems(request.items) };
            }
            if (action === 'FilterTube_CourierDone' && trusted) {
                const job = jobs.get(str(request.jobId));
                if (job?.claimed) job.finish(obj(request.result));
                return { ok: !!job };
            }
            return undefined;
        }

        const listeners = [];
        function listen(event, fn) {
            if (!event?.addListener) return;
            event.addListener(fn);
            listeners.push([event, fn]);
        }
        const ACTIONS = new Set(['FilterTube_ManagedPickupNow', 'FilterTube_ManagedOutboxEnqueue', 'FilterTube_CourierClaim',
            'FilterTube_CourierHosting', 'FilterTube_CourierItems', 'FilterTube_CourierDone']);
        listen(api.runtime.onMessage, (request, sender, sendResponse) => {
            // Exactly these actions; every other message stays with background.js's own listeners.
            if (!ACTIONS.has(request?.action)) return false;
            const pending = handleMessage(request, sender).catch(() => ({ ok: false }));
            if (promiseApi) return pending.then(result => result ?? { ok: false });
            pending.then(result => sendResponse(result ?? { ok: false }));
            return true;
        });
        listen(api.alarms?.onAlarm, alarm => { if (alarm?.name === ALARM) void reconcile('alarm'); });
        listen(api.tabs?.onActivated, info => {
            call(api.tabs, 'get', info.tabId).then(tab => { if (isViewerUrl(tab?.url)) void onForeground(); }).catch(() => null);
        });
        listen(api.tabs?.onUpdated, (_tabId, change, tab) => {
            if (change?.status === 'complete' && tab?.active && isViewerUrl(tab.url)) void onForeground();
        });
        listen(api.tabs?.onRemoved, () => { void reconcile('tab_closed'); });
        listen(api.windows?.onFocusChanged, windowId => {
            if (windowId === api.windows.WINDOW_ID_NONE) return;
            call(api.tabs, 'query', { active: true, windowId }).then(tabs => {
                if (isViewerUrl(arr(tabs)[0]?.url)) void onForeground();
            }).catch(() => null);
        });
        listen(api.storage?.onChanged, (changes, area) => {
            if (area === 'session' && changes[MAILBOX_CONFIG_KEY]) void reconcile('storage');
            if (area !== 'local') return;
            if (changes.ftNanahTrustedLinks || changes[CONSENT_KEY] || changes.ftNanahDeviceId) void reconcile('storage');
        });
        // An earlier build of this branch mirrored the config into storage.local; never leave it there.
        try { Promise.resolve(call(api.storage.local, 'remove', MAILBOX_CONFIG_KEY)).catch(() => {}); } catch (_) {}
        const ready = reconcile('worker_start').catch(() => null);

        return Object.freeze({
            ready, reconcile, onForeground, announceAll, ringQueued, handleMessage,
            pickup: reason => pickupRunner(reason),
            dispose() {
                listener?.stop();
                if (mailboxTimer) clearInterval(mailboxTimer);
                for (const [event, fn] of listeners) event.removeListener?.(fn);
            }
        });
    }

    return Object.freeze({
        OUTBOX_KEY, ALARM, OUTBOX_TTL_MS, OUTBOX_LIMIT,
        emptyOutbox, readOutbox, pruneOutbox, enqueueOutbox, stateFromAck, applyAcks, outboxRow, install
    });
}));
