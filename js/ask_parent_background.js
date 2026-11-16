// js/ask_parent_background.js
//
// Ask a parent on this device (Android AskParentService; docs/app/family/ASK_A_PARENT.md in the app
// repository). Device-local state, never synced and never in a backup: the child's asks, the passes a
// parent gave, answers already seen, nonces already applied and the asking switch per child; on a
// parent's device, each linked child's asks as they arrived and the answers waiting for the next
// connection to that child.
//
// The invariant: nothing here changes a rule or plays a video because of an ask. Only decideHere (a
// parent profile with a fresh unlock on this device) or applySigned (an answer that passed
// FilterTubeAskParent.checkAnswer) adds a pass. "Always allow this channel" is the parent's own rule
// write on the parent's device; a child's device never writes a rule from an answer.
//
// Nanah: the child's open asks ride in `asks` of a `study_family` message and the parent's answers in
// `signed` (body type filtertube.ask.v1), signed with the parent's Family (managed) Ed25519 key, the
// same message the Android and iOS apps send.
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.FilterTubeAskParentBackground = api;
}(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis), function (root) {
    'use strict';

    const STORE_KEY = 'ftAskParentV1';
    const LINKS_KEY = 'ftNanahTrustedLinks';
    const PROFILES_KEY = 'ftProfilesV4';
    const SIGNING_KEY = 'ftNanahManagedSigningKeyPair';
    const STUDY_CAPABILITY = 'filtertube.study.v1';

    const object = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    const array = value => (Array.isArray(value) ? value : []);
    const text = value => (typeof value === 'string' ? value.trim() : '');

    function usable(link) {
        const policy = object(link.policy);
        return link.linkType === 'managed_link' && link.enabled !== false && !link.revoked && !link.keyRevoked
            && !link.quarantined && !link.stalePairing && policy.enabled !== false && !policy.revoked
            && !policy.keyRevoked && !policy.quarantined;
    }

    function normalizeStore(value) {
        const raw = object(value);
        return {
            version: 1,
            asks: array(raw.asks),
            remote: object(raw.remote),
            passes: array(raw.passes),
            seen: array(raw.seen).filter(id => typeof id === 'string').slice(-60),
            nonces: object(raw.nonces),
            asking: object(raw.asking),
            outbox: object(raw.outbox),
            // Ask for time (Android StudyFamilyStore): this device's requests, the parent's copy of each
            // linked child's last report, and the remote requests a parent said "Not now" to.
            timeRequests: array(raw.timeRequests),
            reports: object(raw.reports),
            dismissed: object(raw.dismissed)
        };
    }

    /**
     * deps: { browserAPI, Ask (FilterTubeAskParent), now?, verify(jwk, bytes, signature)?, sign(payload,
     * keyPair)?, parentUnlockFresh(profileId), writeChannelRule({ parentId, childId, channelId, channelName }),
     * addGrant?(grant) (Study: minutes a parent gave, normal rules until they end), studyReport?(childId)
     * ({dayMinutes, lockEndsAt} for the child's report), onChange?() }
     */
    function createAskParentService(deps) {
        const api = deps.browserAPI;
        const Ask = deps.Ask || root.FilterTubeAskParent;
        const now = () => (typeof deps.now === 'function' ? deps.now() : Date.now());
        let queue = Promise.resolve();

        function storageGet(keys) {
            return new Promise(resolve => {
                try {
                    const maybe = api.storage.local.get(keys, items => resolve(items || {}));
                    if (maybe && typeof maybe.then === 'function') maybe.then(items => resolve(items || {}), () => resolve({}));
                } catch (e) { resolve({}); }
            });
        }

        function storageSet(items) {
            return new Promise(resolve => {
                try {
                    const maybe = api.storage.local.set(items, () => resolve());
                    if (maybe && typeof maybe.then === 'function') maybe.then(() => resolve(), () => resolve());
                } catch (e) { resolve(); }
            });
        }

        /** One writer at a time, so two tabs asking at once never lose an ask. */
        function mutate(fn) {
            const run = queue.then(async () => {
                const items = await storageGet([STORE_KEY]);
                const store = normalizeStore(items[STORE_KEY]);
                const result = await fn(store);
                await storageSet({ [STORE_KEY]: store });
                return result;
            });
            queue = run.catch(() => {});
            return run.then(async result => { try { await deps.onChange?.(); } catch (e) { } return result; });
        }

        async function read() {
            await queue;
            const items = await storageGet([STORE_KEY, LINKS_KEY, PROFILES_KEY]);
            return {
                store: normalizeStore(items[STORE_KEY]),
                links: array(items[LINKS_KEY]).filter(link => link && typeof link === 'object'),
                profiles: object(items[PROFILES_KEY])
            };
        }

        const profileOf = (profiles, id) => {
            const value = object(object(profiles.profiles)[id]);
            return Object.keys(value).length ? { ...value, id, type: text(value.type) || 'account' } : null;
        };
        const activeOf = profiles => profileOf(profiles, text(profiles.activeProfileId) || 'default');
        const askingOff = (store, key) => object(store.asking[key]).off === true;
        const parentLinksFor = (links, childId) => links.filter(link => usable(link) && link.localRole === 'replica'
            && link.remoteRole === 'source' && text(object(link.policy).targetProfileId) === childId);
        /**
         * Android StudyReportFreshness: FilterTube can't stop a child clearing its data or removing the
         * extension, so the parent's device notices instead. Reports only travel on a parent's managed
         * link, so a report this old is from a managed child. Returns its time, or null while it's fresh.
         */
        const REPORT_STALE_MS = 3 * 24 * 60 * 60 * 1000;
        function reportStopped(report, at) {
            const generatedAt = Number(object(report).generatedAt);
            return Number.isFinite(generatedAt) && generatedAt > 0 && at - generatedAt > REPORT_STALE_MS ? generatedAt : null;
        }

        const childLinks = links => links.filter(link => usable(link) && link.localRole === 'source' && link.remoteRole === 'replica');
        /** A parent profile on this device that could answer (AskParentAccess.parentHere). */
        const parentHere = (profiles, child) => !!child && child.type === 'child' && Object.entries(object(profiles.profiles))
            .some(([id, profile]) => text(object(profile).type || 'account') !== 'child' && (id === 'default' || child.parentProfileId === id));
        const parentName = (profiles, child, links) => {
            const parent = profileOf(profiles, text(child?.parentProfileId));
            if (parent && text(parent.name)) return text(parent.name);
            const link = links[0];
            return text(link?.deviceLabel) || '';
        };

        // ---- Child --------------------------------------------------------------------------------

        /** What the active profile sees: can it ask, its open asks, unseen answers. */
        async function stateFor({ videoId = '', channelId = '' } = {}) {
            const { store, links, profiles } = await read();
            const at = now();
            const child = activeOf(profiles);
            if (!child || child.type !== 'child') return { ok: true, isChild: false, canAsk: false };
            const here = parentHere(profiles, child);
            const remote = parentLinksFor(links, child.id);
            const routes = Ask.routes(here, remote.length);
            const asks = Ask.normalize(store.asks, at).filter(ask => ask.childProfileId === child.id);
            const open = asks.filter(ask => Ask.isOpenAt(ask, at));
            const seen = new Set(store.seen);
            return {
                ok: true,
                isChild: true,
                childId: child.id,
                childName: text(child.name),
                parentName: parentName(profiles, child, remote),
                route: routes[0],
                canAsk: !askingOff(store, child.id) && routes[0] !== 'none',
                askingOff: askingOff(store, child.id),
                openCount: open.length,
                openFor: open.find(ask => (videoId && ask.videoId === videoId) || (!videoId && channelId && ask.channelId === channelId)) || null,
                unseen: asks.filter(ask => ask.decision && !seen.has(ask.id)).sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0)),
                passes: Ask.passesFrom(store.passes).filter(pass => pass.profileId === child.id && at < pass.until).map(pass => pass.videoId)
            };
        }

        async function ask({ target, reason, note } = {}) {
            const { profiles } = await read();
            const child = activeOf(profiles);
            if (!child || child.type !== 'child') return { ok: false, type: 'not_child' };
            return mutate(store => {
                const at = now();
                const result = Ask.create(store.asks, child.id, target, reason, note, at, Ask.randomId('pa'), askingOff(store, child.id));
                if (result.type === 'created') store.asks = result.list.map(Ask.toJson);
                return { ok: result.type === 'created', ...result, ask: result.ask ? Ask.toJson(result.ask) : undefined, list: undefined };
            });
        }

        async function cancel(askId) {
            return mutate(store => {
                store.asks = Ask.cancel(store.asks, text(askId), now()).map(Ask.toJson);
                return { ok: true };
            });
        }

        async function markSeen(askId) {
            return mutate(store => {
                store.seen = Array.from(new Set([...store.seen, text(askId)])).slice(-60);
                return { ok: true };
            });
        }

        // ---- Child: Ask for time (Android StudyFamilyService.ask / latestRequest) --------------------

        /** The active child's latest time request and who decides it. */
        async function timeState() {
            const { store, links, profiles } = await read();
            const at = now();
            const child = activeOf(profiles);
            if (!child || child.type !== 'child') return { ok: true, isChild: false };
            const remote = parentLinksFor(links, child.id);
            const routes = Ask.routes(parentHere(profiles, child), remote.length);
            const latest = Ask.latestTimeRequest(store.timeRequests, child.id, at);
            return {
                ok: true, isChild: true, childId: child.id, parentName: parentName(profiles, child, remote),
                route: routes[0], canAsk: routes[0] !== 'none', latest: latest ? Ask.timeRequestToJson(latest) : null
            };
        }

        async function askTime({ minutes, reason } = {}) {
            const { links, profiles } = await read();
            const child = activeOf(profiles);
            if (!child || child.type !== 'child') return { ok: false, type: 'not_child' };
            if (Ask.routes(parentHere(profiles, child), parentLinksFor(links, child.id).length)[0] === 'none') return { ok: false, type: 'no_parent' };
            return mutate(store => {
                const result = Ask.createTimeRequest(store.timeRequests, child.id, Math.trunc(Number(minutes)), reason, now(), Ask.randomId('ask'));
                if (result.type === 'created') store.timeRequests = result.list.map(Ask.timeRequestToJson);
                return { ok: result.type === 'created', type: result.type, request: result.request ? Ask.timeRequestToJson(result.request) : undefined };
            });
        }

        async function cancelTime(requestId) {
            return mutate(store => {
                store.timeRequests = Ask.cancelTimeRequest(store.timeRequests, text(requestId), now()).map(Ask.timeRequestToJson);
                return { ok: true };
            });
        }

        /** Child device: one report per child the parent on [remoteDeviceId] manages here (StudyFamilyService.reportsFor). */
        async function reportsFor(remoteDeviceId) {
            const { store, links } = await read();
            const at = now();
            const children = [...new Set(links.filter(link => usable(link) && link.localRole === 'replica' && link.remoteDeviceId === remoteDeviceId)
                .map(link => text(object(link.policy).targetProfileId)).filter(Boolean))];
            const reports = [];
            for (const childId of children) {
                const study = object(await Promise.resolve(deps.studyReport?.(childId)).catch(() => null));
                reports.push(Ask.reportJson({ childProfileId: childId, generatedAt: at, dayMinutes: object(study.dayMinutes),
                    requests: store.timeRequests, lockEndsAt: Number.isFinite(study.lockEndsAt) ? study.lockEndsAt : null }));
            }
            return reports;
        }

        /** Child device: a signed grant from the parent on [remoteDeviceId] (StudyFamilyService.applySigned). */
        async function applyGrantSigned(remoteDeviceId, message) {
            const body = Ask.parseGrant(text(message?.payload));
            if (!body) return { ok: false, reason: 'malformed' };
            const { links } = await read();
            const link = links.find(item => usable(item) && item.localRole === 'replica' && item.remoteDeviceId === remoteDeviceId
                && text(object(item.policy).targetProfileId) === body.childProfileId);
            if (!link) return { ok: false, reason: 'no_link' };
            const jwk = object(link.sourcePublicKeyJwk && Object.keys(object(link.sourcePublicKeyJwk)).length ? link.sourcePublicKeyJwk : object(link.policy).sourcePublicKeyJwk);
            if (!Object.keys(jwk).length) return { ok: false, reason: 'no_key' };
            const signer = { parentProfileId: text(link.sourceProfileId) || text(object(link.policy).sourceProfileId), publicKeyJwk: jwk };
            const checked = await mutate(async store => {
                const at = now();
                const childId = body.childProfileId;
                const nonces = array(store.nonces[childId]);
                const check = await Ask.checkGrant(childId, message, signer, new Set(nonces), at, deps.verify || verifyEd25519);
                if (!check.ok) return { ok: false, reason: check.reason };
                store.nonces[childId] = Array.from(new Set([...nonces, body.nonce])).slice(-200);
                if (body.requestId) {
                    const decided = Ask.decideTimeRequest(store.timeRequests, body.requestId, true, at, signer.parentProfileId);
                    if (decided.type === 'decided') store.timeRequests = decided.list.map(Ask.timeRequestToJson);
                }
                return { ok: true, grant: { id: `signed-${body.nonce}`, profileId: childId, minutes: body.minutes, startsAt: at,
                    source: 'signed', parentProfileId: signer.parentProfileId, requestId: body.requestId } };
            });
            if (!checked.ok) return checked;
            const placed = await Promise.resolve(deps.addGrant?.(checked.grant)).catch(() => null);
            return { ok: true, type: 'granted', grant: placed?.grant || checked.grant };
        }

        /** Child device: open asks for the parent on [remoteDeviceId] (every child it manages here). */
        async function asksFor(remoteDeviceId) {
            const { store, links } = await read();
            const children = new Set(links.filter(link => usable(link) && link.localRole === 'replica'
                && link.remoteDeviceId === remoteDeviceId).map(link => text(object(link.policy).targetProfileId)).filter(Boolean));
            if (!children.size) return [];
            return Ask.open(store.asks, now()).filter(item => children.has(item.childProfileId)).map(Ask.wireJson);
        }

        function grantPass(store, decided, at) {
            const pass = Ask.passFor(decided, at);
            if (pass) store.passes = Ask.addPass(store.passes, pass, at);
        }

        /** Child device: a signed answer from the parent on [remoteDeviceId]. */
        async function applySigned(remoteDeviceId, message) {
            const body = Ask.parseAnswer(text(message?.payload));
            if (!body) return { ok: false, reason: 'malformed' };
            const { links } = await read();
            const link = links.find(item => usable(item) && item.localRole === 'replica' && item.remoteDeviceId === remoteDeviceId
                && text(object(item.policy).targetProfileId) === body.childProfileId);
            if (!link) return { ok: false, reason: 'no_link' };
            const jwk = object(link.sourcePublicKeyJwk && Object.keys(object(link.sourcePublicKeyJwk)).length ? link.sourcePublicKeyJwk : object(link.policy).sourcePublicKeyJwk);
            if (!Object.keys(jwk).length) return { ok: false, reason: 'no_key' };
            const signer = { parentProfileId: text(link.sourceProfileId) || text(object(link.policy).sourceProfileId), publicKeyJwk: jwk };
            return mutate(async store => {
                const at = now();
                const childId = body.childProfileId;
                const nonces = array(store.nonces[childId]);
                const check = await Ask.checkAnswer(childId, message, signer, new Set(nonces), store.asks, at, deps.verify || verifyEd25519);
                if (!check.ok) return { ok: false, reason: check.reason };
                store.nonces[childId] = Array.from(new Set([...nonces, body.nonce])).slice(-200);
                if (body.kind === 'asking') {
                    const current = object(store.asking[childId]);
                    if (body.issuedAt >= (Number(current.at) || 0)) store.asking[childId] = { off: body.askingOn === false, at: body.issuedAt };
                    return { ok: true, type: 'asking', on: body.askingOn === true };
                }
                const name = body.parentName || text(link.deviceLabel);
                const decided = Ask.decide(store.asks, body.askId, body.decision, body.reply, name, at);
                if (decided.type !== 'decided') return { ok: false, reason: 'not_open' };
                store.asks = decided.list.map(Ask.toJson);
                grantPass(store, decided.ask, at);
                return { ok: true, type: 'answered', ask: Ask.toJson(decided.ask) };
            });
        }

        // ---- Parent on this device ----------------------------------------------------------------

        async function inbox() {
            const { store, links, profiles } = await read();
            const at = now();
            const active = activeOf(profiles);
            if (!active || active.type === 'child') return { ok: true, isParent: false, here: [], remote: [], children: [] };
            const children = Object.entries(object(profiles.profiles))
                .filter(([id, profile]) => text(object(profile).type) === 'child' && (active.id === 'default' || text(object(profile).parentProfileId) === active.id))
                .map(([id, profile]) => ({ id, name: text(profile.name) || id, askingOff: askingOff(store, id) }));
            const ids = new Set(children.map(child => child.id));
            const here = Ask.open(store.asks, at).filter(item => ids.has(item.childProfileId)).map(item => ({
                ...Ask.toJson(item), childName: children.find(child => child.id === item.childProfileId)?.name || item.childProfileId
            }));
            const remote = childLinks(links).flatMap(link => Ask.open(array(store.remote[link.linkId]), at).map(item => ({
                ...Ask.toJson(item), linkId: link.linkId,
                childName: text(object(link.policy).targetProfileName) || text(link.deviceLabel),
                deviceLabel: text(link.deviceLabel), waiting: array(store.outbox[link.linkId]).length
            })));
            const remoteChildren = childLinks(links).map(link => ({
                linkId: link.linkId, name: text(object(link.policy).targetProfileName) || text(link.deviceLabel),
                askingOff: askingOff(store, `link:${link.linkId}`),
                // "Aarav's device stopped reporting": its last report is older than 3 days.
                stoppedSince: reportStopped(store.reports[link.linkId], at)
            }));
            // Ask for time: requests from children here, and each linked child's last report minus what
            // this parent already answered (a grant waiting to send, or "Not now").
            const timeHere = Ask.pendingTimeRequests(store.timeRequests, at).filter(item => ids.has(item.childProfileId)).map(item => ({
                ...Ask.timeRequestToJson(item), kind: 'time',
                childName: children.find(child => child.id === item.childProfileId)?.name || item.childProfileId
            }));
            const timeRemote = childLinks(links).flatMap(link => {
                const answered = new Set([...array(store.dismissed[link.linkId]),
                    ...array(store.outbox[link.linkId]).map(payload => Ask.parseGrant(payload)?.requestId).filter(Boolean)]);
                return Ask.pendingTimeRequests(array(object(store.reports[link.linkId]).requests), at)
                    .filter(item => !answered.has(item.id)).map(item => ({
                        ...Ask.timeRequestToJson(item), kind: 'time', linkId: link.linkId,
                        childName: text(object(link.policy).targetProfileName) || text(link.deviceLabel), deviceLabel: text(link.deviceLabel)
                    }));
            });
            return { ok: true, isParent: true, parentId: active.id, here, remote, timeHere, timeRemote, children, remoteChildren };
        }

        /**
         * A parent answers on this device ({askId, decision, reply}) or for a child on another device
         * ({linkId, ...}). The authority is checked here, not only in the page: never a child, only
         * that child's parent (or the master profile), and the parent's PIN typed in the last 5 minutes.
         */
        async function answer({ askId, decision, reply, linkId } = {}) {
            const { links, profiles } = await read();
            const active = activeOf(profiles);
            const fresh = active ? await deps.parentUnlockFresh?.(active.id) !== false : false;
            if (text(linkId)) {
                const link = childLinks(links).find(item => item.linkId === text(linkId));
                if (!link || !Ask.canDecideRemote(active, true, fresh)) return { ok: false, type: fresh ? 'not_allowed' : 'parent_unlock_required', parentId: active?.id };
                return mutate(store => {
                    const at = now();
                    const decided = Ask.decide(array(store.remote[link.linkId]), text(askId), decision, reply, text(active.name), at);
                    if (decided.type !== 'decided') return { ok: false, type: decided.type };
                    store.remote[link.linkId] = decided.list.map(Ask.toJson);
                    const payload = Ask.answerPayload(text(object(link.policy).targetProfileId), text(link.sourceProfileId) || active.id,
                        decided.ask.id, decision, decided.ask.reply, text(active.name), at, Ask.randomId('n'));
                    store.outbox[link.linkId] = [...array(store.outbox[link.linkId]), payload].slice(-20);
                    return { ok: true, type: 'decided', ask: Ask.toJson(decided.ask), sendsLater: true };
                });
            }
            const { store } = await read();
            const current = Ask.normalize(store.asks, now()).find(item => item.id === text(askId));
            const child = current ? profileOf(profiles, current.childProfileId) : null;
            if (!Ask.canDecide(active, child, true, fresh)) {
                return { ok: false, type: active && active.type !== 'child' && !fresh ? 'parent_unlock_required' : 'not_allowed', parentId: active?.id };
            }
            if (decision === Ask.DECISION_CHANNEL) {
                // The parent's own checked rule write, before the answer is recorded (Android AskParentRuleWrite).
                const wrote = await deps.writeChannelRule?.({ parentId: active.id, childId: child.id,
                    channelId: current.channelId, channelName: current.channelName });
                if (!wrote?.ok) return { ok: false, type: 'channel_failed' };
            }
            return mutate(next => {
                const at = now();
                const decided = Ask.decide(next.asks, text(askId), decision, reply, text(active.name), at);
                if (decided.type !== 'decided') return { ok: false, type: decided.type };
                next.asks = decided.list.map(Ask.toJson);
                grantPass(next, decided.ask, at);
                return { ok: true, type: 'decided', ask: Ask.toJson(decided.ask) };
            });
        }

        /**
         * A parent answers a time request: "Give 20 min" or "Not now" (StudyFamilyService.giveHere /
         * declineHere / giveRemote / dismissRemote). Here the grant starts now; for a child on another
         * device the signed grant is queued and goes at the next connection. Same authority as an ask.
         */
        async function answerTime({ requestId, linkId, grant } = {}) {
            const { store: snapshot, links, profiles } = await read();
            const active = activeOf(profiles);
            const fresh = active ? await deps.parentUnlockFresh?.(active.id) !== false : false;
            const id = text(requestId);
            if (text(linkId)) {
                const link = childLinks(links).find(item => item.linkId === text(linkId));
                if (!link || !Ask.canDecideRemote(active, true, fresh)) return { ok: false, type: fresh ? 'not_allowed' : 'parent_unlock_required', parentId: active?.id };
                const request = Ask.pendingTimeRequests(array(object(snapshot.reports[link.linkId]).requests), now()).find(item => item.id === id);
                if (!request) return { ok: false, type: 'not_pending' };
                return mutate(store => {
                    if (grant === true) {
                        const payload = Ask.grantPayload(text(object(link.policy).targetProfileId), text(link.sourceProfileId) || active.id,
                            request.minutes, now(), Ask.randomId('n'), request.id);
                        store.outbox[link.linkId] = [...array(store.outbox[link.linkId]), payload].slice(-20);
                    } else {
                        store.dismissed[link.linkId] = Array.from(new Set([...array(store.dismissed[link.linkId]), request.id])).slice(-40);
                    }
                    return { ok: true, type: 'decided', minutes: request.minutes, sendsLater: grant === true };
                });
            }
            const current = Ask.pendingTimeRequests(snapshot.timeRequests, now()).find(item => item.id === id);
            const child = current ? profileOf(profiles, current.childProfileId) : null;
            if (!current) return { ok: false, type: 'not_pending' };
            if (!Ask.canDecide(active, child, true, fresh)) {
                return { ok: false, type: active && active.type !== 'child' && !fresh ? 'parent_unlock_required' : 'not_allowed', parentId: active?.id };
            }
            const decided = await mutate(store => {
                const at = now();
                const result = Ask.decideTimeRequest(store.timeRequests, id, grant === true, at, active.id);
                if (result.type !== 'decided') return { ok: false, type: result.type };
                store.timeRequests = result.list.map(Ask.timeRequestToJson);
                return { ok: true, type: 'decided', minutes: result.request.minutes, request: Ask.timeRequestToJson(result.request), at };
            });
            if (!decided.ok || grant !== true) return decided;
            await Promise.resolve(deps.addGrant?.({ id: Ask.randomId('give'), profileId: current.childProfileId, minutes: current.minutes,
                startsAt: decided.at, source: 'parent_here', parentProfileId: active.id, requestId: current.id })).catch(() => null);
            return decided;
        }

        /** "Let Aarav ask": here for a child on this device, or a signed switch for a linked device. */
        async function setAsking({ childId, linkId, on } = {}) {
            const { links, profiles } = await read();
            const active = activeOf(profiles);
            const fresh = active ? await deps.parentUnlockFresh?.(active.id) !== false : false;
            if (text(linkId)) {
                const link = childLinks(links).find(item => item.linkId === text(linkId));
                if (!link || !Ask.canDecideRemote(active, true, fresh)) return { ok: false, type: fresh ? 'not_allowed' : 'parent_unlock_required', parentId: active?.id };
                return mutate(store => {
                    const at = now();
                    store.asking[`link:${link.linkId}`] = { off: on !== true, at };
                    store.outbox[link.linkId] = [...array(store.outbox[link.linkId]),
                        Ask.askingPayload(text(object(link.policy).targetProfileId), text(link.sourceProfileId) || active.id, on === true, at, Ask.randomId('n'))].slice(-20);
                    return { ok: true };
                });
            }
            const child = profileOf(profiles, text(childId));
            if (!Ask.canDecide(active, child, true, fresh)) return { ok: false, type: fresh ? 'not_allowed' : 'parent_unlock_required', parentId: active?.id };
            return mutate(store => {
                const at = now();
                store.asking[child.id] = { off: on !== true, at };
                if (on !== true) {
                    store.asks = Ask.normalize(store.asks, at).map(item => (item.childProfileId === child.id && Ask.isOpenAt(item, at)
                        ? { ...item, status: Ask.STATUS_CANCELLED, decidedAt: at } : item)).map(Ask.toJson);
                }
                return { ok: true };
            });
        }

        // ---- Parent: a child on another device -----------------------------------------------------

        /** Parent device: asks from the child on [remoteDeviceId]. Returns how many were new. */
        async function receiveAsks(remoteDeviceId, incoming) {
            const { links } = await read();
            const targets = childLinks(links).filter(link => link.remoteDeviceId === remoteDeviceId);
            if (!targets.length) return 0;
            return mutate(store => {
                const at = now();
                let fresh = 0;
                for (const link of targets) {
                    const child = text(object(link.policy).targetProfileId);
                    if (!child) continue;
                    const before = Ask.normalize(array(store.remote[link.linkId]), at);
                    const after = Ask.receive(before, array(incoming), child, at);
                    const added = after.filter(item => !before.some(old => old.id === item.id));
                    if (added.length) {
                        store.remote[link.linkId] = after.map(Ask.toJson);
                        fresh += added.length;
                    }
                }
                return fresh;
            });
        }

        /**
         * Parent device: reports from the child on [remoteDeviceId], kept per link where this device is
         * the parent (StudyFamilyService.receiveReports). Returns how many time requests are new.
         */
        async function receiveReports(remoteDeviceId, incoming) {
            const reports = array(incoming).map(Ask.reportFrom).filter(Boolean);
            if (!reports.length) return 0;
            const { links } = await read();
            const targets = childLinks(links).filter(link => link.remoteDeviceId === remoteDeviceId);
            if (!targets.length) return 0;
            return mutate(store => {
                const at = now();
                let fresh = 0;
                for (const link of targets) {
                    const report = reports.find(item => item.childProfileId === text(object(link.policy).targetProfileId));
                    if (!report) continue;
                    const known = new Set(Ask.pendingTimeRequests(array(object(store.reports[link.linkId]).requests), at).map(item => item.id));
                    fresh += Ask.pendingTimeRequests(report.requests, at).filter(item => !known.has(item.id)).length;
                    store.reports[link.linkId] = report;
                }
                return fresh;
            });
        }

        /** Bodies waiting for the child on [remoteDeviceId]: [{linkId, payload}]. */
        async function toSign(remoteDeviceId) {
            const { store, links } = await read();
            return childLinks(links).filter(link => link.remoteDeviceId === remoteDeviceId)
                .flatMap(link => array(store.outbox[link.linkId]).map(payload => ({ linkId: link.linkId, payload })));
        }

        async function sent(linkId, payloads) {
            const mine = array(payloads).filter(payload => Ask.isAskPayload(payload) || Ask.isGrantPayload(payload));
            if (!mine.length) return;
            await mutate(store => {
                store.outbox[linkId] = array(store.outbox[linkId]).filter(payload => !mine.includes(payload));
            });
        }

        // ---- Nanah: one study_family message each way -------------------------------------------------

        /**
         * What this device sends to [remote] in a study_family message: its open asks (child side) and
         * the answers waiting for that child, signed now with this device's Family key (parent side).
         * Only to a device that advertised filtertube.study.v1. Returns null when there's nothing to send.
         */
        async function outbox(remote) {
            const remoteId = text(object(remote).deviceId);
            const capabilities = array(object(remote).capabilities).map(text);
            if (!remoteId || !capabilities.includes(STUDY_CAPABILITY)) return null;
            const asks = (await asksFor(remoteId)).slice(0, 12);
            const reports = (await reportsFor(remoteId)).slice(0, 8);
            const pending = await toSign(remoteId);
            const signed = [];
            if (pending.length) {
                const items = await storageGet([SIGNING_KEY]);
                const keyPair = object(items[SIGNING_KEY]);
                if (Object.keys(object(keyPair.privateKeyJwk)).length) {
                    for (const item of pending) {
                        signed.push({ linkId: item.linkId, payload: item.payload,
                            signature: await (deps.sign || signEd25519)(item.payload, keyPair),
                            keyId: text(keyPair.managedPublicKeyId) });
                    }
                }
            }
            if (!asks.length && !signed.length && !reports.length) return null;
            return {
                message: { t: 'study_family', reports, asks, signed: signed.map(({ linkId, ...rest }) => rest) },
                sentByLink: signed.reduce((byLink, item) => { (byLink[item.linkId] = byLink[item.linkId] || []).push(item.payload); return byLink; }, {})
            };
        }

        async function markSent(sentByLink) {
            for (const [linkId, payloads] of Object.entries(object(sentByLink))) await sent(linkId, payloads);
        }

        /** A study_family message from [remoteDeviceId]: asks for this parent, answers for this child. */
        async function receive(remoteDeviceId, message) {
            const root = object(message);
            const asks = array(root.asks).slice(0, 12);
            const fresh = asks.length ? await receiveAsks(remoteDeviceId, asks) : 0;
            const freshTime = await receiveReports(remoteDeviceId, array(root.reports).slice(0, 8));
            const results = [];
            for (const signedMessage of array(root.signed).slice(0, 20)) {
                const payload = text(object(signedMessage).payload);
                if (Ask.isAskPayload(payload)) results.push(await applySigned(remoteDeviceId, signedMessage));
                else if (Ask.isGrantPayload(payload)) results.push(await applyGrantSigned(remoteDeviceId, signedMessage));
            }
            return { ok: true, fresh: fresh + freshTime, answered: results.filter(result => result.ok && result.type === 'answered').length,
                granted: results.filter(result => result.ok && result.type === 'granted').length };
        }

        /** What a parent profile here has to answer: asks and time requests (the toolbar badge's count). */
        async function openRequestCount() {
            const data = await inbox();
            if (!data.isParent) return 0;
            return array(data.here).length + array(data.remote).length + array(data.timeHere).length + array(data.timeRemote).length;
        }

        // ---- Filtering ---------------------------------------------------------------------------

        /** The videos a parent let [profileId] watch once, still running. */
        async function passVideoIds(profileId) {
            const { store } = await read();
            const at = now();
            return Ask.passesFrom(store.passes).filter(pass => pass.profileId === profileId && at < pass.until).map(pass => pass.videoId);
        }

        return Object.freeze({
            STORE_KEY, stateFor, ask, cancel, markSeen, asksFor, applySigned, inbox, answer, setAsking,
            receiveAsks, toSign, sent, outbox, markSent, receive, passVideoIds,
            timeState, askTime, cancelTime, answerTime, reportsFor, receiveReports, applyGrantSigned, openRequestCount
        });
    }

    async function verifyEd25519(publicKeyJwk, bytes, signature) {
        const subtle = root.crypto?.subtle;
        if (!subtle) return false;
        const jwk = { kty: 'OKP', crv: 'Ed25519', x: text(object(publicKeyJwk).x) };
        const key = await subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);
        return subtle.verify({ name: 'Ed25519' }, key, signature, bytes);
    }

    async function signEd25519(payload, keyPair) {
        const subtle = root.crypto?.subtle;
        const key = await subtle.importKey('jwk', object(keyPair).privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
        const signature = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, key, new TextEncoder().encode(payload)));
        let binary = '';
        for (const byte of signature) binary += String.fromCharCode(byte);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    return Object.freeze({ STORE_KEY, createAskParentService, verifyEd25519, signEd25519 });
}));
