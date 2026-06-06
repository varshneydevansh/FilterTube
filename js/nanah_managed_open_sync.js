(function initFilterTubeNanahManagedOpenSync(global) {
    'use strict';

    const REQUEST_SCHEMA = 'filtertube_nanah_managed_open_sync_request';
    const STATE_SCHEMA = 'filtertube_nanah_managed_open_sync_state';
    const ACK_SCHEMA = 'filtertube_nanah_managed_open_sync_ack';

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
                    const root = safeObject(link);
                    const reason = explainIneligibleLink(link, { activeProfileId, profilesV4 });
                    if (reason) return null;
                    const policy = getPolicy(root);
                    const targetProfileId = resolveTargetProfileId(root, activeProfileId);
                    const allowedScopes = normalizeAllowedScopes(policy.allowedScopes || policy.defaultScope);
                    const sourceDeviceId = normalizeString(root.sourceDeviceId || policy.sourceDeviceId) || normalizeString(root.remoteDeviceId);
                    const sourceProfileId = normalizeString(root.sourceProfileId || policy.sourceProfileId);
                    const sourcePublicKeyId = normalizeString(root.sourcePublicKeyId || policy.sourcePublicKeyId);
                    return {
                        linkId: normalizeString(root.linkId || root.id),
                        remoteDeviceId: normalizeString(root.remoteDeviceId),
                        sourceDeviceId,
                        sourceProfileId,
                        targetProfileId,
                        targetProfileName: normalizeString(policy.targetProfileName),
                        allowedScopes,
                        sourcePublicKeyId,
                        keyVersion: Number(root.keyVersion || policy.keyVersion) || 0,
                        trustedLink: root,
                        accepted: getAcceptedStateByScope(safeObject(profiles[targetProfileId]), root.linkId || root.id, allowedScopes)
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
                trustedLink: candidate.trustedLink,
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
            try {
                const result = await provider.pullDecryptedMailboxItems(request);
                if (Array.isArray(result)) return { ok: true, reason: '', items: result };
                const ok = result?.ok !== false;
                return {
                    ok,
                    reason: normalizeString(result?.reason),
                    items: ok ? safeArray(result?.items) : []
                };
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'pull_provider_failed',
                    items: []
                };
            }
        }

        function normalizeAckState(result) {
            const root = safeObject(result);
            const explicit = normalizeString(root.ackState).toLowerCase();
            if (['delivered', 'rejected', 'expired', 'revoked', 'conflict'].includes(explicit)) {
                return explicit;
            }
            if (root.accepted === true || root.applied === true) return 'delivered';
            const reason = normalizeString(root.reason).toLowerCase();
            if (reason === 'mailbox_item_expired') return 'expired';
            if (reason === 'link_revoked' || reason === 'key_revoked') return 'revoked';
            if (reason === 'equal_revision_hash_conflict') return 'conflict';
            return 'rejected';
        }

        function buildAckRecord(candidate, item, applyResult = {}, error = null) {
            const root = safeObject(item);
            const result = safeObject(applyResult);
            const errorReason = error ? normalizeString(error.reason || error.message) : '';
            return {
                schema: ACK_SCHEMA,
                version: 1,
                ackedAt: now(),
                linkId: candidate.linkId,
                mailboxItemId: normalizeString(root.mailboxItemId || result.mailboxItemId),
                targetProfileId: candidate.targetProfileId,
                sourceDeviceId: candidate.sourceDeviceId,
                sourceProfileId: candidate.sourceProfileId,
                scope: normalizeString(root.scope || result.scope).toLowerCase(),
                revision: Number(root.revision || result.revision) || null,
                policyHash: normalizeString(root.policyHash || result.policyHash),
                ackState: normalizeAckState(error ? { reason: errorReason } : result),
                accepted: result.accepted === true,
                applied: result.applied === true,
                decision: normalizeString(result.decision),
                reason: normalizeString(result.reason) || errorReason || null
            };
        }

        function normalizeAckResult(result, attemptedCount) {
            if (attemptedCount <= 0) {
                return { ok: true, reason: '', ackedItemCount: 0, failedAckCount: 0 };
            }
            if (Array.isArray(result)) {
                return {
                    ok: true,
                    reason: '',
                    ackedItemCount: result.length,
                    failedAckCount: Math.max(0, attemptedCount - result.length)
                };
            }
            const root = safeObject(result);
            const ok = root.ok !== false;
            const acked = Number(root.ackedItemCount ?? root.acknowledgedItemCount ?? root.ackedCount);
            const failed = Number(root.failedAckCount ?? root.failedItemCount ?? root.rejectedAckCount);
            return {
                ok,
                reason: normalizeString(root.reason),
                ackedItemCount: Number.isFinite(acked)
                    ? Math.max(0, acked)
                    : (ok ? attemptedCount : 0),
                failedAckCount: Number.isFinite(failed)
                    ? Math.max(0, failed)
                    : (ok ? 0 : attemptedCount)
            };
        }

        async function ackItems(provider, request, records) {
            const ackRecords = safeArray(records).filter(row => normalizeString(row?.mailboxItemId));
            if (ackRecords.length === 0) {
                return { ok: true, reason: '', ackedItemCount: 0, failedAckCount: 0, providerAvailable: false };
            }
            const ackPayload = {
                schema: ACK_SCHEMA,
                version: 1,
                ackedAt: now(),
                linkId: request.linkId,
                remoteDeviceId: request.remoteDeviceId,
                sourceDeviceId: request.sourceDeviceId,
                sourceProfileId: request.sourceProfileId,
                targetProfileId: request.targetProfileId,
                records: ackRecords
            };
            const ackWriter = provider && (
                typeof provider.ackDecryptedMailboxItems === 'function'
                    ? provider.ackDecryptedMailboxItems
                    : (typeof provider.ackMailboxItems === 'function' ? provider.ackMailboxItems : null)
            );
            if (!ackWriter) {
                return {
                    ok: false,
                    reason: 'ack_provider_unavailable',
                    ackedItemCount: 0,
                    failedAckCount: ackRecords.length,
                    providerAvailable: false
                };
            }
            try {
                return {
                    ...normalizeAckResult(await ackWriter.call(provider, ackPayload), ackRecords.length),
                    providerAvailable: true
                };
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'ack_failed',
                    ackedItemCount: 0,
                    failedAckCount: ackRecords.length,
                    providerAvailable: true
                };
            }
        }

        async function runOpenSync({
            links = [],
            activeProfileId = '',
            profilesV4 = {},
            reason = 'dashboard_open',
            applyMailboxItem = null,
            recordAckHistory = null,
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
                ackProviderAvailable: false,
                pulledItemCount: 0,
                appliedItemCount: 0,
                rejectedItemCount: 0,
                ackAttemptedCount: 0,
                ackedItemCount: 0,
                ackFailedCount: 0,
                ackHistoryRecordedCount: 0,
                ackHistoryFailedCount: 0,
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
                    rejectedItemCount: 0,
                    ackAttemptedCount: 0,
                    ackedItemCount: 0,
                    ackFailedCount: 0,
                    ackReason: null,
                    ackHistoryRecordedCount: 0,
                    ackHistoryFailedCount: 0,
                    ackHistoryReason: null
                };
                state.pulledItemCount += result.items.length;
                const ackRecords = [];
                if (result.ok !== true) {
                    state.linkResults.push(linkRow);
                    continue;
                }
                for (const item of result.items) {
                    try {
                        const applyResult = await applyMailboxItem(item);
                        if (applyResult?.accepted === true || applyResult?.applied === true || applyResult === true) {
                            linkRow.appliedItemCount += 1;
                            state.appliedItemCount += 1;
                            ackRecords.push(buildAckRecord(candidate, item, applyResult === true ? { accepted: true, applied: true } : applyResult));
                        } else {
                            linkRow.rejectedItemCount += 1;
                            state.rejectedItemCount += 1;
                            ackRecords.push(buildAckRecord(candidate, item, applyResult));
                        }
                    } catch (error) {
                        linkRow.rejectedItemCount += 1;
                        state.rejectedItemCount += 1;
                        ackRecords.push(buildAckRecord(candidate, item, { accepted: false }, error));
                    }
                }
                const ackResult = await ackItems(provider, request, ackRecords);
                linkRow.ackAttemptedCount = ackRecords.length;
                linkRow.ackedItemCount = ackResult.ackedItemCount;
                linkRow.ackFailedCount = ackResult.failedAckCount;
                linkRow.ackReason = ackResult.reason || null;
                state.ackProviderAvailable = state.ackProviderAvailable || ackResult.providerAvailable === true;
                state.ackAttemptedCount += ackRecords.length;
                state.ackedItemCount += ackResult.ackedItemCount;
                state.ackFailedCount += ackResult.failedAckCount;
                if (ackRecords.length > 0 && typeof recordAckHistory === 'function') {
                    try {
                        const historyResult = await recordAckHistory({
                            request,
                            candidate,
                            records: ackRecords,
                            ackResult,
                            linkResult: linkRow,
                            reason
                        });
                        const historyRoot = safeObject(historyResult);
                        const recorded = Number(historyRoot.recordedCount ?? historyRoot.writtenCount);
                        const failed = Number(historyRoot.failedCount ?? historyRoot.failedHistoryCount);
                        linkRow.ackHistoryRecordedCount = Number.isFinite(recorded)
                            ? Math.max(0, recorded)
                            : (historyResult === true ? ackRecords.length : 0);
                        linkRow.ackHistoryFailedCount = Number.isFinite(failed)
                            ? Math.max(0, failed)
                            : (historyRoot.ok === false ? ackRecords.length : 0);
                        linkRow.ackHistoryReason = normalizeString(historyRoot.reason) || null;
                    } catch (error) {
                        linkRow.ackHistoryRecordedCount = 0;
                        linkRow.ackHistoryFailedCount = ackRecords.length;
                        linkRow.ackHistoryReason = normalizeString(error?.message) || 'ack_history_failed';
                    }
                    state.ackHistoryRecordedCount += linkRow.ackHistoryRecordedCount;
                    state.ackHistoryFailedCount += linkRow.ackHistoryFailedCount;
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

        function formatCheckedAge(checkedAt) {
            const ts = Number(checkedAt);
            if (!Number.isFinite(ts) || ts <= 0) return '';
            const elapsedMs = Math.max(0, now() - ts);
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            if (elapsedSeconds < 60) return 'just now';
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
            const elapsedHours = Math.floor(elapsedMinutes / 60);
            if (elapsedHours < 24) return `${elapsedHours}h ago`;
            const elapsedDays = Math.floor(elapsedHours / 24);
            return `${elapsedDays}d ago`;
        }

        function appendCheckedAge(label, state) {
            const age = formatCheckedAge(safeObject(state).checkedAt);
            return age ? `${label} (${age})` : label;
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
            if (normalizeString(openState.reasonCode) === 'pull_provider_unavailable') {
                return appendCheckedAge('Provider unavailable', openState);
            }
            if (normalizeString(openState.reasonCode) === 'mailbox_apply_unavailable') {
                return appendCheckedAge('Apply unavailable', openState);
            }
            if (normalizeString(openState.reasonCode) === 'no_eligible_links') {
                return appendCheckedAge('No eligible open-sync link', openState);
            }
            const result = getLinkResult(openState, root.linkId || root.id);
            if (!result) return openState.checkedAt ? appendCheckedAge('Checked', openState) : 'Ready';
            const applied = Number(result.appliedItemCount) || 0;
            const rejected = Number(result.rejectedItemCount) || 0;
            const pulled = Number(result.pulledItemCount) || 0;
            const ackFailed = Number(result.ackFailedCount) || 0;
            if (ackFailed > 0) return appendCheckedAge(`${applied} applied, ${rejected} rejected, ${ackFailed} ack failed`, openState);
            if (applied || rejected) return appendCheckedAge(`${applied} applied, ${rejected} rejected`, openState);
            if (result.ok === false) return appendCheckedAge('Provider rejected pull', openState);
            if (pulled === 0) return appendCheckedAge('No updates', openState);
            return appendCheckedAge('Checked', openState);
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
