/*
 * Child side of a parent's update, run by the background worker (Firefox: event page) so no
 * dashboard tab is needed (docs/sync/SEAMLESS_SYNC_SPEC.md).
 *
 * Trust is unchanged from the dashboard path (tab-view.js handleNanahIncomingManagedMailboxItem):
 * the item is opened with the saved link's wrapping key, the Ed25519 signature is checked against
 * the parent key saved on that link, and nanah_sync_adapter.js applies it with its own
 * validateManagedPolicyEnvelope / applyManagedMailboxItem checks, re-reading the saved links before
 * the write. Nothing here shortcuts those checks; it only gathers the same context outside a page.
 *
 * Changes from the dashboard path, both from the audit (§4a, §6):
 * - an update for any child profile on this device applies, not only the active one;
 * - a trigger that arrives while a check runs is queued (one more run), never dropped.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedUpdateReceiver = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const TRUSTED_LINKS_KEY = 'ftNanahTrustedLinks';
    const DEVICE_ID_KEY = 'ftNanahDeviceId';
    const PROFILES_KEY = 'ftProfilesV4';
    const NOTICE_KEY = 'ftManagedUpdateNotice';
    const NOTICE_SCHEMA = 'filtertube_managed_update_notice';
    const NOTICE_TTL_MS = 2 * 60 * 1000;
    const STATE_KEY = 'ftManagedReceiverStateV1';
    const MANAGED_SCOPES = ['main', 'kids', 'videos', 'keywords', 'channels', 'rules_bundle', 'viewing_space', 'time_limits'];

    const str = value => (typeof value === 'string' ? value.trim() : '');
    const obj = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    const arr = value => (Array.isArray(value) ? value : []);
    const role = value => {
        const v = str(value).toLowerCase();
        return v === 'source' || v === 'replica' || v === 'peer' ? v : 'peer';
    };
    const nonNegative = value => {
        const n = typeof value === 'number' ? value : Number(value);
        return Number.isInteger(n) && n >= 0 ? n : null;
    };

    function managedScopeList(value) {
        const list = Array.isArray(value) ? value : [value];
        return Array.from(new Set(list.map(item => str(item).toLowerCase()).flatMap(item => {
            if (item === 'rules_bundle') return ['keywords', 'channels', 'videos'];
            if (item === 'active' || item === 'full') return ['main', 'kids', 'viewing_space', 'time_limits'];
            return [item];
        }).filter(item => MANAGED_SCOPES.includes(item))));
    }

    function profileScopedLinkId(remoteDeviceId, targetProfileId) {
        const devicePart = str(remoteDeviceId).replace(/[^A-Za-z0-9_.-]/g, '-');
        const targetPart = str(targetProfileId).replace(/[^A-Za-z0-9_.-]/g, '-');
        return devicePart && targetPart ? `nanah-${devicePart}-target-${targetPart}` : '';
    }

    /**
     * The saved link as the dashboard sees it (tab-view.js normalizeNanahTrustedLink followed by
     * buildNanahManagedValidationTrustedLink). Only fields the managed checks read are derived.
     */
    function projectTrustedLink(entry) {
        const raw = obj(entry);
        const remoteDeviceId = str(raw.remoteDeviceId);
        if (!remoteDeviceId) return null;
        const rawPolicy = obj(raw.policy);
        const localRole = role(raw.localRole);
        const remoteRole = role(raw.remoteRole || raw.role);
        const derived = (localRole === 'source' && remoteRole === 'replica') || (localRole === 'replica' && remoteRole === 'source')
            ? 'managed_link' : (localRole === 'peer' && remoteRole === 'peer' ? 'peer_link' : '');
        const requested = str(raw.linkType || rawPolicy.linkType);
        const linkType = requested === 'managed_link' || requested === 'peer_link' ? requested : (derived || 'peer_link');
        const behaviorRaw = str(rawPolicy.targetProfileBehavior || raw.targetProfileBehavior).toLowerCase();
        const targetProfileBehavior = behaviorRaw === 'fixed_profile' ? 'fixed_profile' : 'current_active';
        const fixedTarget = str(rawPolicy.targetProfileId || raw.targetProfileId);
        const legacyLinkId = `nanah-${remoteDeviceId}`;
        const scopedLinkId = linkType === 'managed_link' && targetProfileBehavior === 'fixed_profile' && fixedTarget
            ? profileScopedLinkId(remoteDeviceId, fixedTarget) : legacyLinkId;
        const rawLinkId = str(raw.linkId);
        const linkId = rawLinkId && rawLinkId !== legacyLinkId ? rawLinkId : scopedLinkId;
        const lockedRaw = str(rawPolicy.lockedChildMode || raw.lockedChildMode).toLowerCase();
        const policy = {
            ...rawPolicy,
            linkType,
            allowedScopes: linkType === 'managed_link'
                ? managedScopeList(rawPolicy.allowedScopes || raw.allowedScopes || rawPolicy.defaultScope || raw.defaultScope) : [],
            lockedChildMode: lockedRaw === 'allow_trusted_updates' ? 'allow_trusted_updates' : 'require_unlock',
            syncOnProfileOpen: linkType === 'managed_link' && (rawPolicy.syncOnProfileOpen === true || raw.syncOnProfileOpen === true),
            targetProfileBehavior,
            targetProfileId: targetProfileBehavior === 'fixed_profile' ? fixedTarget : ''
        };
        const trusted = { ...raw, linkId, remoteDeviceId, localRole, remoteRole, linkType, policy };
        const keyVersion = nonNegative(trusted.keyVersion || policy.keyVersion);
        return {
            ...trusted,
            id: str(trusted.id) || linkId,
            type: linkType,
            sourceDeviceId: str(trusted.sourceDeviceId || policy.sourceDeviceId)
                || (localRole === 'replica' && remoteRole === 'source' ? remoteDeviceId : ''),
            sourceProfileId: str(trusted.sourceProfileId || policy.sourceProfileId),
            targetProfileId: str(trusted.targetProfileId || policy.targetProfileId),
            allowedScopes: managedScopeList(trusted.allowedScopes || policy.allowedScopes || policy.defaultScope),
            sourcePublicKeyId: str(trusted.sourcePublicKeyId || policy.sourcePublicKeyId),
            sourcePublicKeyJwk: obj(trusted.sourcePublicKeyJwk || policy.sourcePublicKeyJwk || policy.publicKeyJwk),
            keyVersion: keyVersion || 0,
            revoked: trusted.revoked === true || policy.revoked === true,
            keyRevoked: trusted.keyRevoked === true || policy.keyRevoked === true,
            stalePairing: trusted.stalePairing === true || policy.stalePairing === true,
            policy
        };
    }

    function acceptedState(profile, linkId, scope) {
        const row = obj(obj(obj(obj(profile).managedPolicyState).remoteManagedPolicies)[str(linkId)])[str(scope).toLowerCase()];
        const revision = nonNegative(obj(row).revision);
        const policyHash = str(obj(row).policyHash);
        const payloadSha256 = str(obj(row).payloadSha256);
        return revision && policyHash ? { revision, policyHash, ...(payloadSha256 ? { payloadSha256 } : {}) } : null;
    }

    function targetOf(link) {
        const policy = obj(link.policy);
        return str(policy.targetProfileBehavior || link.targetProfileBehavior) === 'fixed_profile'
            ? str(policy.targetProfileId || link.targetProfileId) : '';
    }

    /** Same rule as tab-view.js getNanahManagedDuplicateDeviceIds over the saved links. */
    function duplicateDeviceIds(links, envelope, pinned) {
        const deviceId = str(envelope.sourceDeviceId);
        if (!deviceId) return [];
        const duplicate = links.some(candidate => {
            if (str(candidate.sourceDeviceId || candidate.remoteDeviceId) !== deviceId
                || str(candidate.linkId) === str(envelope.linkId)) return false;
            const candidateTarget = targetOf(candidate);
            const pinnedTarget = str(pinned.targetProfileId);
            if (!candidateTarget || !pinnedTarget) return true;
            if (candidateTarget !== pinnedTarget) return false;
            const pinnedParent = str(pinned.sourceProfileId);
            const candidateParent = str(candidate.sourceProfileId || obj(candidate.policy).sourceProfileId);
            return !pinnedParent || !candidateParent || pinnedParent === candidateParent;
        });
        return duplicate ? [deviceId] : [];
    }

    /**
     * Whether a saved link lets this device apply a parent's update without anyone present:
     * a receive-only managed link with "apply on profile open" and trusted updates allowed, not
     * revoked or stale, with the parent's key. Any child profile, active or not.
     */
    function explainIneligible(link, profilesV4) {
        const trusted = obj(link);
        const policy = obj(trusted.policy);
        if (trusted.linkType !== 'managed_link') return 'not_managed_link';
        if (trusted.localRole !== 'replica' || trusted.remoteRole !== 'source') return 'wrong_link_roles';
        if (trusted.revoked) return 'link_revoked';
        if (trusted.keyRevoked) return 'key_revoked';
        if (trusted.stalePairing) return 'stale_pairing';
        if (policy.syncOnProfileOpen !== true) return 'open_sync_disabled';
        if (policy.lockedChildMode !== 'allow_trusted_updates') return 'locked_trusted_updates_not_allowed';
        if (!trusted.sourceDeviceId) return 'missing_source_device';
        if (!trusted.sourceProfileId) return 'missing_source_profile';
        if (!trusted.sourcePublicKeyId) return 'missing_source_key';
        const target = targetOf(trusted) || str(obj(profilesV4).activeProfileId);
        if (!target || !Object.keys(obj(obj(obj(profilesV4).profiles)[target])).length) return 'target_profile_missing';
        return '';
    }

    /** Runs fn once; a call while it runs schedules exactly one more run instead of dropping it. */
    function createCoalescingRunner(fn) {
        let running = null;
        let again = false;
        let lastArgs = [];
        function start() {
            again = false;
            const args = lastArgs;
            running = Promise.resolve().then(() => fn(...args)).catch(() => null).then(result => {
                if (again) return start();
                running = null;
                return result;
            });
            return running;
        }
        return function run(...args) {
            lastArgs = args;
            if (running) { again = true; return running; }
            return start();
        };
    }

    function create(deps = {}) {
        const get = deps.get;
        const set = deps.set;
        const now = typeof deps.now === 'function' ? deps.now : () => Date.now();
        const adapter = () => deps.adapter || root.FilterTubeNanahAdapter || {};
        if (typeof get !== 'function' || typeof set !== 'function') throw new Error('managed_receiver_storage_unavailable');

        async function readTrust() {
            const stored = obj(await get([TRUSTED_LINKS_KEY, DEVICE_ID_KEY, PROFILES_KEY]));
            const rawLinks = arr(stored[TRUSTED_LINKS_KEY]);
            return {
                rawLinks,
                links: rawLinks.map(projectTrustedLink).filter(Boolean),
                deviceId: str(stored[DEVICE_ID_KEY]),
                profilesV4: obj(stored[PROFILES_KEY])
            };
        }

        /** Links this device would apply updates from, for the pickup and doorbell paths. */
        async function eligibleLinks() {
            const trust = await readTrust();
            return {
                ...trust,
                eligible: trust.links.filter(link => !explainIneligible(link, trust.profilesV4))
            };
        }

        function buildContext(envelope, trust, link) {
            const trustedLink = JSON.parse(JSON.stringify(link));
            const profiles = obj(trust.profilesV4.profiles);
            const targetProfileId = str(envelope.targetProfileId || trustedLink.targetProfileId);
            const context = {
                profilesV4: trust.profilesV4,
                profiles,
                trustedLink,
                accepted: acceptedState(profiles[targetProfileId], envelope.linkId || trustedLink.linkId, envelope.scope),
                targetDeviceId: trust.deviceId,
                duplicateDeviceIds: duplicateDeviceIds(trust.links, envelope, trustedLink),
                signatureVerification: null,
                historyTargetProfileId: targetProfileId
            };
            // As on the dashboard: re-read saved trust right before the write; a link removed,
            // re-keyed or narrowed meanwhile stops the apply (adapter.applyManagedPolicyEnvelope).
            context.loadFreshManagedValidationContext = async freshEnvelope => {
                const fresh = await readTrust();
                if (!Array.isArray(fresh.rawLinks)) return null;
                const freshLink = fresh.links.find(entry => str(entry.linkId) === str(obj(freshEnvelope).linkId));
                const next = buildContext(obj(freshEnvelope), fresh, freshLink || {});
                if (!freshLink || explainIneligible(freshLink, fresh.profilesV4)) next.trustedLink = {};
                next.getCurrentManagedValidationContext = () => next;
                return next;
            };
            return context;
        }

        function profileName(profilesV4, profileId) {
            const profile = obj(obj(obj(profilesV4).profiles)[profileId]);
            return str(profile.name) || str(profile.profileName) || '';
        }

        /** §7: one short-lived notice for the page banner. Identifiers and a profile name only. */
        async function writeNotice(appliedProfileIds) {
            const ids = arr(appliedProfileIds).map(str).filter(Boolean);
            if (!ids.length) return null;
            const profilesV4 = obj(obj(await get([PROFILES_KEY]))[PROFILES_KEY]);
            const activeId = str(profilesV4.activeProfileId);
            const activeChanged = ids.includes(activeId);
            const createdAt = now();
            const notice = {
                schema: NOTICE_SCHEMA,
                version: 1,
                id: `${ids.join(',')}:${createdAt}`,
                createdAt,
                expiresAt: createdAt + NOTICE_TTL_MS,
                activeChanged,
                profileName: activeChanged ? '' : profileName(profilesV4, ids[0]).slice(0, 80)
            };
            await set({ [NOTICE_KEY]: notice });
            return notice;
        }

        function finishDecision(applied, mailboxItemId) {
            const { envelope: _plaintext, decryptedEnvelope: _decrypted, ...decision } = obj(applied);
            const result = { ...decision, mailboxItemId: str(mailboxItemId) };
            const reason = str(result.reason);
            // The adapter can carry the first validation's 'delivered' onto a later refusal (fresh
            // trust gone before the write); a refused item is never reported as delivered.
            if (result.accepted !== true && result.ackState === 'delivered') result.ackState = '';
            if (!result.ackState) {
                result.ackState = result.accepted === true ? 'delivered'
                    : reason === 'mailbox_item_expired' ? 'expired'
                        : (reason === 'link_revoked' || reason === 'key_revoked') ? 'revoked'
                            : reason === 'equal_revision_hash_conflict' ? 'conflict' : 'rejected';
            }
            return result;
        }

        /**
         * Verifies and applies one opened item (decryptedEnvelope present). The same steps as
         * tab-view.js handleNanahIncomingManagedMailboxItem, minus the toasts.
         */
        async function applyOpenedItem(opened, { transport = 'courier', selfControlActive = null } = {}) {
            const nanah = adapter();
            const item = obj(opened);
            if (typeof nanah.applyManagedMailboxItem !== 'function'
                || typeof nanah.verifyManagedNanahPolicyIntegritySignature !== 'function') {
                return { accepted: false, reason: 'managed_mailbox_apply_unavailable', ackState: 'rejected', mailboxItemId: str(item.mailboxItemId) };
            }
            const trust = await readTrust();
            const envelope = obj(item.decryptedEnvelope);
            const link = trust.links.find(entry => str(entry.linkId) === str(item.linkId))
                || trust.links.find(entry => str(entry.linkId) === str(envelope.linkId));
            if (!link || explainIneligible(link, trust.profilesV4)) {
                const reason = link ? explainIneligible(link, trust.profilesV4) : 'missing_trusted_link';
                return finishDecision({ accepted: false, reason }, item.mailboxItemId);
            }
            const context = {
                ...buildContext(envelope, trust, link),
                transport,
                mailboxItemId: str(item.mailboxItemId),
                nowMs: now()
            };
            if (typeof selfControlActive === 'function') context.selfControlActive = selfControlActive;
            const verification = await nanah.verifyManagedNanahPolicyIntegritySignature(envelope, context.trustedLink);
            context.signatureVerification = verification;
            context.verifyIntegritySignature = () => verification;
            if (verification?.verified === true) {
                context.signatureVerified = true;
                context.integrityVerified = true;
            }
            // applyManagedMailboxItem runs validateManagedMailboxItem first and records the decision
            // in the profile's managed history, accepted or not.
            return finishDecision(await nanah.applyManagedMailboxItem(item, context), item.mailboxItemId);
        }

        async function openItem(sealed, trust, linkId) {
            const nanah = adapter();
            const rawLink = trust.rawLinks.find(entry => projectTrustedLink(entry)?.linkId === linkId);
            if (!rawLink || typeof nanah.openManagedMailboxStorageItem !== 'function') throw new Error('courier_open_failed');
            return nanah.openManagedMailboxStorageItem(sealed, { trustedLink: rawLink });
        }

        /** Opens, verifies and applies one sealed item outside a pickup (tests, single deliveries). */
        async function receiveSealedItem(item, options = {}) {
            const sealed = obj(item);
            const trust = await readTrust();
            const link = trust.links.find(entry => str(entry.linkId) === str(sealed.linkId));
            if (!link || explainIneligible(link, trust.profilesV4)) {
                return finishDecision({ accepted: false, reason: link ? explainIneligible(link, trust.profilesV4) : 'missing_trusted_link' },
                    sealed.mailboxItemId);
            }
            let opened;
            try { opened = await openItem(sealed, trust, link.linkId); } catch (_) {
                return finishDecision({ accepted: false, reason: 'courier_open_failed' }, sealed.mailboxItemId);
            }
            const result = await applyOpenedItem(opened, options);
            if (result.accepted === true && result.applied === true) await writeNotice([result.profileId]);
            return result;
        }

        function ackRecord(item, trust, { ackState = 'rejected', reason = null, accepted = false, applied = false } = {}) {
            const root = obj(item);
            return {
                schema: 'filtertube_nanah_managed_open_sync_ack',
                version: 1,
                ackedAt: now(),
                linkId: str(root.linkId),
                mailboxItemId: str(root.mailboxItemId),
                targetProfileId: str(root.targetProfileId),
                targetDeviceId: trust.deviceId,
                sourceDeviceId: str(root.sourceDeviceId),
                sourceProfileId: str(root.sourceProfileId),
                scope: str(root.scope).toLowerCase(),
                revision: nonNegative(root.revision) || null,
                policyHash: str(root.policyHash),
                ackState,
                accepted,
                applied,
                decision: '',
                reason
            };
        }

        /**
         * One pickup over the runOpenSync path (SEAMLESS_SYNC_SPEC.md §3.1, §5): courier items
         * handed in by a parent, and/or a configured mailbox. Returns the acks for the courier and
         * the profiles that changed. Writes the banner notice when something changed.
         */
        async function runPickup({ reason = 'background', courierItems = null, mailboxProvider = null,
            selfControlActive = null, writeState = null } = {}) {
            const openSync = (deps.openSync || root.FilterTubeNanahManagedOpenSync)?.create?.({ now });
            if (!openSync) return { ok: false, reason: 'open_sync_unavailable', acks: [], appliedProfileIds: [] };
            const trust = await readTrust();
            const common = {
                links: trust.links,
                activeProfileId: str(trust.profilesV4.activeProfileId),
                profilesV4: trust.profilesV4,
                targetDeviceId: trust.deviceId,
                includeInactiveFixedTargets: true,
                applyMailboxItem: opened => applyOpenedItem(opened, { transport: courierItems ? 'courier' : 'mailbox', selfControlActive })
            };
            const acks = [];
            const appliedProfileIds = [];
            const states = [];
            if (Array.isArray(courierItems)) {
                const items = courierItems.slice(0, 16).map(obj).filter(item => str(item.mailboxItemId));
                const candidates = openSync.collectManagedOpenSyncLinks(common);
                const eligibleIds = new Set(candidates.map(candidate => candidate.linkId));
                for (const item of items) {
                    if (!eligibleIds.has(str(item.linkId))) acks.push(ackRecord(item, trust, { reason: 'no_eligible_link' }));
                }
                const provider = {
                    async pullDecryptedMailboxItems(request) {
                        const out = [];
                        for (const item of items.filter(row => str(row.linkId) === str(request.linkId))) {
                            try { out.push(await openItem(item, trust, str(request.linkId))); } catch (_) {
                                acks.push(ackRecord(item, trust, { reason: 'courier_open_failed' }));
                            }
                        }
                        return { ok: true, items: out };
                    },
                    async ackDecryptedMailboxItems(payload) {
                        const records = arr(obj(payload).records);
                        acks.push(...records);
                        return { ok: true, ackedItemCount: records.length, failedAckCount: 0 };
                    }
                };
                const state = await openSync.runOpenSync({ ...common, reason: 'courier', provider });
                states.push(state);
                appliedProfileIds.push(...arr(state.appliedProfileIds));
            }
            if (mailboxProvider) {
                const state = await openSync.runOpenSync({ ...common, reason, provider: mailboxProvider, writeState });
                states.push(state);
                appliedProfileIds.push(...arr(state.appliedProfileIds));
            }
            const changed = Array.from(new Set(appliedProfileIds));
            const notice = await writeNotice(changed);
            await set({
                [STATE_KEY]: {
                    version: 1,
                    lastPickupAt: now(),
                    reason: str(reason) || null,
                    appliedProfileIds: changed,
                    pulledItemCount: states.reduce((sum, row) => sum + (Number(row?.pulledItemCount) || 0), 0),
                    appliedItemCount: states.reduce((sum, row) => sum + (Number(row?.appliedItemCount) || 0), 0),
                    rejectedItemCount: states.reduce((sum, row) => sum + (Number(row?.rejectedItemCount) || 0), 0)
                }
            });
            return { ok: true, acks, appliedProfileIds: changed, notice, states };
        }

        return Object.freeze({ readTrust, eligibleLinks, applyOpenedItem, receiveSealedItem, runPickup });
    }

    return Object.freeze({
        TRUSTED_LINKS_KEY, DEVICE_ID_KEY, PROFILES_KEY, NOTICE_KEY, NOTICE_SCHEMA, NOTICE_TTL_MS, STATE_KEY,
        projectTrustedLink, explainIneligible, duplicateDeviceIds, createCoalescingRunner, create
    });
}));
