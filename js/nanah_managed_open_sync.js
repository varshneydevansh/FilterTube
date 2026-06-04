(function initFilterTubeNanahManagedOpenSync(global) {
    'use strict';

    const REQUEST_SCHEMA = 'filtertube_nanah_managed_open_sync_request';
    const STATE_SCHEMA = 'filtertube_nanah_managed_open_sync_state';

    function defaultNormalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function defaultSafeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function defaultSafeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function create(deps = {}) {
        const normalizeString = deps.normalizeString || defaultNormalizeString;
        const safeObject = deps.safeObject || defaultSafeObject;
        const safeArray = deps.safeArray || defaultSafeArray;
        const now = typeof deps.now === 'function' ? deps.now : () => Date.now();

        function normalizeAllowedScopes(value) {
            const raw = Array.isArray(value) ? value : [value];
            return raw
                .map(scope => normalizeString(scope).toLowerCase())
                .filter(Boolean);
        }

        function getPolicy(link) {
            return safeObject(safeObject(link).policy);
        }

        function resolveTargetProfileId(link, activeProfileId) {
            const policy = getPolicy(link);
            const behavior = normalizeString(policy.targetProfileBehavior).toLowerCase();
            if (behavior === 'fixed_profile') {
                return normalizeString(policy.targetProfileId);
            }
            return normalizeString(activeProfileId);
        }

        function getAcceptedStateByScope(profile, linkId, scopes) {
            const remotePolicies = safeObject(safeObject(profile.managedPolicyState).remoteManagedPolicies);
            const byLink = safeObject(remotePolicies[normalizeString(linkId)]);
            const accepted = {};
            for (const scope of scopes) {
                const row = safeObject(byLink[scope]);
                const revision = Number(row.revision);
                const policyHash = normalizeString(row.policyHash);
                if (Number.isInteger(revision) && revision > 0 && policyHash) {
                    accepted[scope] = { revision, policyHash };
                }
            }
            return accepted;
        }

        function explainIneligibleLink(link, { activeProfileId = '', profilesV4 = {} } = {}) {
            const root = safeObject(link);
            const policy = getPolicy(root);
            if (normalizeString(root.linkType) !== 'managed_link') return 'not_managed_link';
            if (normalizeString(root.localRole) !== 'replica' || normalizeString(root.remoteRole) !== 'source') {
                return 'wrong_link_roles';
            }
            if (root.revoked === true || policy.revoked === true) return 'link_revoked';
            if (root.keyRevoked === true || policy.keyRevoked === true) return 'key_revoked';
            if (root.stalePairing === true || policy.stalePairing === true) return 'stale_pairing';
            if (policy.syncOnProfileOpen !== true) return 'open_sync_disabled';
            if (normalizeString(policy.lockedChildMode).toLowerCase() !== 'allow_trusted_updates') {
                return 'locked_trusted_updates_not_allowed';
            }
            const targetProfileId = resolveTargetProfileId(root, activeProfileId);
            if (!targetProfileId) return 'missing_target_profile';
            const profiles = safeObject(safeObject(profilesV4).profiles);
            if (!safeObject(profiles[targetProfileId]) || Object.keys(safeObject(profiles[targetProfileId])).length === 0) {
                return 'target_profile_missing';
            }
            if (normalizeString(activeProfileId) && targetProfileId !== normalizeString(activeProfileId)) {
                return 'different_target_profile';
            }
            const sourceDeviceId = normalizeString(root.sourceDeviceId || policy.sourceDeviceId) || normalizeString(root.remoteDeviceId);
            const sourceProfileId = normalizeString(root.sourceProfileId || policy.sourceProfileId);
            const sourcePublicKeyId = normalizeString(root.sourcePublicKeyId || policy.sourcePublicKeyId);
            if (!sourceDeviceId) return 'missing_source_device';
            if (!sourceProfileId) return 'missing_source_profile';
            if (!sourcePublicKeyId) return 'missing_source_key';
            return '';
        }

        function collectManagedOpenSyncLinks({ links = [], activeProfileId = '', profilesV4 = {} } = {}) {
            const profiles = safeObject(safeObject(profilesV4).profiles);
            return safeArray(links)
                .map((link) => {
                    const reason = explainIneligibleLink(link, { activeProfileId, profilesV4 });
                    if (reason) return null;
                    const policy = getPolicy(link);
                    const targetProfileId = resolveTargetProfileId(link, activeProfileId);
                    const allowedScopes = normalizeAllowedScopes(policy.allowedScopes || policy.defaultScope);
                    const sourceDeviceId = normalizeString(link.sourceDeviceId || policy.sourceDeviceId) || normalizeString(link.remoteDeviceId);
                    const sourceProfileId = normalizeString(link.sourceProfileId || policy.sourceProfileId);
                    const sourcePublicKeyId = normalizeString(link.sourcePublicKeyId || policy.sourcePublicKeyId);
                    return {
                        linkId: normalizeString(link.linkId || link.id),
                        remoteDeviceId: normalizeString(link.remoteDeviceId),
                        sourceDeviceId,
                        sourceProfileId,
                        targetProfileId,
                        targetProfileName: normalizeString(policy.targetProfileName),
                        allowedScopes,
                        sourcePublicKeyId,
                        keyVersion: Number(link.keyVersion || policy.keyVersion) || 0,
                        accepted: getAcceptedStateByScope(safeObject(profiles[targetProfileId]), link.linkId || link.id, allowedScopes)
                    };
                })
                .filter(Boolean);
        }

        function buildPullRequest(candidate, reason) {
            return {
                schema: REQUEST_SCHEMA,
                version: 1,
                reason: normalizeString(reason) || 'dashboard_open',
                requestedAt: now(),
                linkId: candidate.linkId,
                remoteDeviceId: candidate.remoteDeviceId,
                sourceDeviceId: candidate.sourceDeviceId,
                sourceProfileId: candidate.sourceProfileId,
                targetProfileId: candidate.targetProfileId,
                allowedScopes: candidate.allowedScopes,
                sourcePublicKeyId: candidate.sourcePublicKeyId,
                keyVersion: candidate.keyVersion,
                accepted: candidate.accepted
            };
        }

        function getProvider() {
            if (typeof deps.getProvider === 'function') return deps.getProvider();
            return safeObject(global.FilterTubeManagedPolicyOpenSync);
        }

        async function pullItems(provider, request) {
            if (!provider || typeof provider.pullDecryptedMailboxItems !== 'function') {
                return { ok: false, reason: 'pull_provider_unavailable', items: [] };
            }
            const result = await provider.pullDecryptedMailboxItems(request);
            if (Array.isArray(result)) return { ok: true, reason: '', items: result };
            return {
                ok: result?.ok !== false,
                reason: normalizeString(result?.reason),
                items: safeArray(result?.items)
            };
        }

        async function runOpenSync({
            links = [],
            activeProfileId = '',
            profilesV4 = {},
            reason = 'dashboard_open',
            applyMailboxItem = null,
            writeState = null
        } = {}) {
            const startedAt = now();
            const candidates = collectManagedOpenSyncLinks({ links, activeProfileId, profilesV4 });
            const state = {
                schema: STATE_SCHEMA,
                version: 1,
                reason: normalizeString(reason) || 'dashboard_open',
                profileId: normalizeString(activeProfileId),
                checkedAt: startedAt,
                eligibleLinkCount: candidates.length,
                providerAvailable: false,
                pulledItemCount: 0,
                appliedItemCount: 0,
                rejectedItemCount: 0,
                linkResults: []
            };

            const provider = getProvider();
            state.providerAvailable = !!(provider && typeof provider.pullDecryptedMailboxItems === 'function');
            if (!state.providerAvailable || candidates.length === 0 || typeof applyMailboxItem !== 'function') {
                if (!state.providerAvailable && candidates.length > 0) {
                    state.reasonCode = 'pull_provider_unavailable';
                } else if (candidates.length === 0) {
                    state.reasonCode = 'no_eligible_links';
                } else {
                    state.reasonCode = 'mailbox_apply_unavailable';
                }
                if (typeof writeState === 'function') await writeState(state);
                return state;
            }

            for (const candidate of candidates) {
                const request = buildPullRequest(candidate, reason);
                const result = await pullItems(provider, request);
                const linkRow = {
                    linkId: candidate.linkId,
                    targetProfileId: candidate.targetProfileId,
                    ok: result.ok === true,
                    reason: result.reason || null,
                    pulledItemCount: result.items.length,
                    appliedItemCount: 0,
                    rejectedItemCount: 0
                };
                state.pulledItemCount += result.items.length;
                for (const item of result.items) {
                    try {
                        const applyResult = await applyMailboxItem(item);
                        if (applyResult?.accepted === true || applyResult?.applied === true || applyResult === true) {
                            linkRow.appliedItemCount += 1;
                            state.appliedItemCount += 1;
                        } else {
                            linkRow.rejectedItemCount += 1;
                            state.rejectedItemCount += 1;
                        }
                    } catch (error) {
                        linkRow.rejectedItemCount += 1;
                        state.rejectedItemCount += 1;
                    }
                }
                state.linkResults.push(linkRow);
            }

            if (typeof writeState === 'function') await writeState(state);
            return state;
        }

        function getLinkResult(state, linkId) {
            const normalized = normalizeString(linkId);
            return safeArray(safeObject(state).linkResults)
                .find(row => normalizeString(row?.linkId) === normalized) || null;
        }

        function formatStatus(link, state, activeProfileId = '') {
            const root = safeObject(link);
            if (normalizeString(root.linkType) !== 'managed_link' || normalizeString(root.localRole) !== 'replica' || normalizeString(root.remoteRole) !== 'source') {
                return '';
            }
            const policy = getPolicy(root);
            if (policy.syncOnProfileOpen !== true) return 'Off';
            const openState = safeObject(state);
            if (normalizeString(openState.profileId) && normalizeString(openState.profileId) !== normalizeString(activeProfileId)) return 'Ready';
            if (normalizeString(openState.reasonCode) === 'pull_provider_unavailable') return 'Waiting for provider';
            if (normalizeString(openState.reasonCode) === 'mailbox_apply_unavailable') return 'Apply unavailable';
            const result = getLinkResult(openState, root.linkId || root.id);
            if (!result) return openState.checkedAt ? 'Checked' : 'Ready';
            const applied = Number(result.appliedItemCount) || 0;
            const rejected = Number(result.rejectedItemCount) || 0;
            const pulled = Number(result.pulledItemCount) || 0;
            if (applied || rejected) return `${applied} applied, ${rejected} rejected`;
            if (pulled === 0) return 'Checked, no updates';
            return result.ok === false ? 'Rejected by provider' : 'Checked';
        }

        return {
            REQUEST_SCHEMA,
            STATE_SCHEMA,
            collectManagedOpenSyncLinks,
            explainIneligibleLink,
            formatStatus,
            runOpenSync
        };
    }

    global.FilterTubeNanahManagedOpenSync = { create };
})(typeof window !== 'undefined' ? window : globalThis);
