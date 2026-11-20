/*
 * Managed history rows for parent updates received in the background worker, so a pickup there
 * leaves the same trail as one run by the dashboard. GENERATED COPY of tab-view.js
 * (recordManagedNanahPolicyValidationHistory, recordManagedOpenSyncAckHistory and their helpers),
 * kept identical by tests/runtime/managed-action-history-parity.test.mjs: change both together.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeManagedActionHistory = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    const getIO = () => root.FilterTubeIO || {};

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }


    function normalizeNonNegativeInteger(value) {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isInteger(num)) return null;
        return num >= 0 ? num : null;
    }

    const MANAGED_ACTION_HISTORY_SCHEMA = 'filtertube_managed_action_history';
    const MANAGED_ACTION_HISTORY_LIMIT = 500;
    const MANAGED_ACTION_HISTORY_DAY_MS = 24 * 60 * 60 * 1000;
    const MANAGED_ACTION_HISTORY_ACCEPTED_RETENTION_MS = 30 * MANAGED_ACTION_HISTORY_DAY_MS;
    const MANAGED_ACTION_HISTORY_PROTECTED_RETENTION_MS = 90 * MANAGED_ACTION_HISTORY_DAY_MS;
    const MANAGED_ACTION_HISTORY_PROTECTED_RESULTS = new Set(['rejected', 'conflict', 'failed_auth', 'expired_session', 'cleared_by_admin']);
    const MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS = new Set(['trust_link.revoke', 'trust_link.key_revoke', 'managed_signing_key.rotate', 'admin_session.failed_unlock', 'admin_session.lock', 'policy.time_limit.update', 'policy.time_limit.request_extra', 'policy.viewing_space.update', 'policy.channel_list.import', 'policy.channel_list.remove', 'policy.channel_list.check', 'policy.channel_list.refresh', 'policy.channel_list.pause', 'policy.channel_list.resume', 'remote_policy.source_push']);
    const MANAGED_ACTION_HISTORY_SUMMARY_PRIVACY_SCHEMA = 'filtertube_managed_action_history_summary_privacy';
    const MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA = 'filtertube_managed_action_history_encrypted_summary';
    const MANAGED_ACTION_HISTORY_SAFE_LABELS = Object.freeze({
        'rule.video.block': 'Video rule changed',
        'rule.keyword.add': 'Keyword rule changed',
        'rule.keyword.remove': 'Keyword rule changed',
        'rule.channel.block': 'Channel rule changed',
        'rule.channel.unblock': 'Channel rule changed',
        'policy.viewing_space.update': 'Viewing space policy changed',
        'policy.time_limit.update': 'Time limit policy changed',
        'policy.time_limit.request_extra': 'Extra time requested',
        'policy.channel_list.import': 'Approved list imported',
        'policy.channel_list.remove': 'Approved list removed',
        'policy.channel_list.check': 'Approved list checked',
        'policy.channel_list.refresh': 'Approved list refreshed',
        'policy.channel_list.pause': 'Approved list paused',
        'policy.channel_list.resume': 'Approved list resumed',
        'policy.sync_policy.update': 'Sync policy changed',
        'trust_link.create': 'Trusted link created',
        'trust_link.revoke': 'Trusted link removed',
        'trust_link.key_revoke': 'Trusted link key revoked',
        'managed_signing_key.rotate': 'Managed signing key rotated',
        'admin_session.unlock': 'Admin session unlocked',
        'admin_session.failed_unlock': 'Admin unlock failed',
        'admin_session.lock': 'Admin session locked',
        'local_policy.update': 'Local policy changed',
        'remote_policy.accept': 'Remote policy accepted',
        'remote_policy.reject': 'Remote policy rejected',
        'remote_policy.conflict': 'Remote policy conflict',
        'remote_policy.mailbox.accept': 'Internet Pickup update accepted',
        'remote_policy.mailbox.reject': 'Internet Pickup update rejected',
        'remote_policy.mailbox.conflict': 'Internet Pickup update conflict',
        'remote_policy.mailbox.expire': 'Internet Pickup update expired',
        'remote_policy.mailbox.revoke': 'Internet Pickup update revoked',
        'remote_policy.mailbox.ack': 'Internet Pickup receipt recorded',
        'remote_policy.local_network.ack': 'Home Pickup receipt recorded',
        'delivery.mailbox.configure': 'Internet Pickup setting changed',
        'delivery.local_network.configure': 'Home Pickup setting changed',
        'trust_link.saved_updates': 'Saved update setting changed',
        'remote_policy.source_push': 'Parent policy push',
        'history.clear': 'History cleared'
    });
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_NUMBER_KEYS = new Set([
        'clearedAcceptedRows',
        'consumedSeconds',
        'dailyBudgetSeconds',
        'deliveredCount',
        'failedCount',
        'changedCount',
        'addedCount',
        'duplicateCount',
        'kidsRuleCount',
        'listEntryCount',
        'linkCount',
        'liveSentCount',
        'localNetworkDeliveredCount',
        'localNetworkPurgedCount',
        'mainRuleCount',
        'mailboxUploadedCount',
        'mailboxPurgedCount',
        'noLinkCount',
        'nextKeyVersion',
        'parentGrantSeconds',
        'providerMissingCount',
        'previousKeyVersion',
        'protectedRows',
        'removedCount',
        'remoteFailedAttemptLimit',
        'remoteFailedAttempts',
        'removedScopeCount',
        'revokedLinkCount',
        'retainedProtectedRows',
        'retryAt',
        'remainingSeconds',
        'ruleCount',
        'selectedProfileCount',
        'sentCount',
        'skippedCount',
        'targetCount',
        'totalCount'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_BOOLEAN_KEYS = new Set([
        'hasPolicy',
        'hasTimeLimit',
        'kidsEnabled',
        'localNetworkConfigured',
        'mainEnabled',
        'mailboxConfigured',
        'rateLimited',
        'redacted',
        'savedUpdatesEnabled'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_KEYS = new Set([
        'endpointHost',
        'label',
        'scope',
        'deliveryStatus',
        'dateKey',
        'profileName',
        'surface',
        'timezone',
        'transport'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_ARRAY_KEYS = new Set([
        'removedScopes',
        'transports'
    ]);
    const MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_FORBIDDEN_KEYS = new Set([
        'channels',
        'keywords',
        'label',
        'operations',
        'payload',
        'plaintext',
        'plaintextValue',
        'ruleValue',
        'summary',
        'videoIds'
    ]);
    const MANAGED_ADMIN_SESSION_TTL_MS = 15 * 60 * 1000;
    const MANAGED_ADMIN_REAUTH_TTL_MS = 5 * 60 * 1000;
    const MANAGED_ADMIN_FAILED_UNLOCK_LIMIT = 5;
    const MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS = 10 * 60 * 1000;
    const MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA = 'filtertube_managed_admin_failed_unlock_rate_limit';
    const MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA = 'filtertube_managed_remote_failed_attempt_rate_limit';
    const MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT = 20;
    const MANAGED_REMOTE_FAILED_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
    const MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA = 'filtertube_managed_remote_policy_conflict';
    const MANAGED_REMOTE_POLICY_CONFLICT_LIMIT = 100;
    const MANAGED_REMOTE_POLICY_CONFLICT_REASONS = new Set([
        'equal_revision_hash_conflict',
        'stale_revision',
        'link_revoked',
        'key_revoked',
        'stale_pairing',
        'duplicate_source_device_id'
    ]);

    function getManagedActionHistoryRowTime(row) {
        const item = safeObject(row);
        for (const key of ['receivedAt', 'issuedAt', 'createdAt']) {
            const value = normalizeNonNegativeInteger(item[key]);
            if (value != null) return value;
        }
        const orderKey = normalizeString(item.orderKey);
        const match = orderKey.match(/(\d{12,})$/);
        if (match) {
            const value = normalizeNonNegativeInteger(match[1]);
            if (value != null) return value;
        }
        return null;
    }

    function getManagedActionHistoryRetentionMs(row) {
        const item = safeObject(row);
        const result = normalizeString(item.result);
        const actionType = normalizeString(item.actionType);
        if (MANAGED_ACTION_HISTORY_PROTECTED_RESULTS.has(result) ||
            MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS.has(actionType)) {
            return MANAGED_ACTION_HISTORY_PROTECTED_RETENTION_MS;
        }
        return MANAGED_ACTION_HISTORY_ACCEPTED_RETENTION_MS;
    }

    function pruneManagedActionHistoryRows(rows, now = Date.now()) {
        return safeArray(rows)
            .filter(row => safeObject(row).schema === MANAGED_ACTION_HISTORY_SCHEMA)
            .map(sanitizeManagedActionHistoryRow)
            .filter((row) => {
                const timestamp = getManagedActionHistoryRowTime(row);
                if (timestamp == null) return true;
                return now - timestamp < getManagedActionHistoryRetentionMs(row);
            })
            .slice(-MANAGED_ACTION_HISTORY_LIMIT);
    }

    function sanitizeManagedActionHistorySummaryValue(key, value) {
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_NUMBER_KEYS.has(key)) {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : null;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_BOOLEAN_KEYS.has(key)) {
            return value === true;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_KEYS.has(key)) {
            const normalized = normalizeString(value);
            return normalized ? normalized.slice(0, 160) : null;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_ARRAY_KEYS.has(key)) {
            const items = safeArray(value)
                .map(item => normalizeString(item))
                .filter(Boolean)
                .map(item => item.replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 64))
                .filter(Boolean)
                .slice(0, 12);
            return items.length ? items : null;
        }
        return null;
    }

    function sanitizeManagedEncryptedSummaryToken(value, maxLength) {
        const normalized = normalizeString(value);
        if (!normalized || normalized.length > maxLength) return '';
        return /^[a-zA-Z0-9_.:+/=-]+$/.test(normalized) ? normalized : '';
    }

    function sanitizeManagedActionHistoryEncryptedSummary(value) {
        const root = safeObject(value);
        if (root.schema !== MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA) return null;
        for (const key of Object.keys(root)) {
            if (MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_FORBIDDEN_KEYS.has(key)) return null;
        }
        const cipherSuite = sanitizeManagedEncryptedSummaryToken(root.cipherSuite || root.algorithm, 80);
        const keyId = sanitizeManagedEncryptedSummaryToken(root.keyId || root.wrappingKeyId, 128);
        const nonce = sanitizeManagedEncryptedSummaryToken(root.nonce || root.iv, 256);
        const ciphertext = sanitizeManagedEncryptedSummaryToken(root.ciphertext, 4096);
        const ciphertextHash = sanitizeManagedEncryptedSummaryToken(root.ciphertextHash || root.hash, 160);
        if (!cipherSuite || !keyId || !nonce || !ciphertext || !ciphertextHash) return null;
        const createdAt = normalizeNonNegativeInteger(root.createdAt);
        return {
            schema: MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA,
            version: 1,
            cipherSuite,
            keyId,
            nonce,
            ciphertext,
            ciphertextHash,
            ...(createdAt ? { createdAt } : {})
        };
    }

    function sanitizeManagedActionHistorySummary(summary, actionType, sensitive) {
        const root = safeObject(summary);
        const safeLabel = MANAGED_ACTION_HISTORY_SAFE_LABELS[actionType] || actionType || 'Managed action';
        const next = {
            redacted: true,
            label: sensitive === true ? safeLabel : (normalizeString(root.label) || safeLabel).slice(0, 160)
        };
        Object.entries(root).forEach(([key, value]) => {
            if (key === 'label' || key === 'redacted' || key === 'summaryPrivacy' || key === 'encryptedSummary') return;
            const sanitized = sanitizeManagedActionHistorySummaryValue(key, value);
            if (sanitized == null) return;
            next[key] = sanitized;
        });
        const encryptedSummary = sanitizeManagedActionHistoryEncryptedSummary(root.encryptedSummary);
        if (encryptedSummary) {
            next.encryptedSummary = encryptedSummary;
        }
        next.summaryPrivacy = {
            schema: MANAGED_ACTION_HISTORY_SUMMARY_PRIVACY_SCHEMA,
            version: 1,
            redacted: true,
            encrypted: !!encryptedSummary,
            plaintextPolicy: encryptedSummary
                ? 'safe_counts_status_transport_and_ciphertext_only'
                : 'safe_counts_status_and_transport_only'
        };
        return next;
    }

    function sanitizeManagedActionHistoryRow(row) {
        const root = safeObject(row);
        const actionType = normalizeString(root.actionType);
        const sensitive = root.sensitive !== false;
        return {
            ...root,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actionType,
            scope: normalizeString(root.scope) || 'policy',
            result: normalizeString(root.result) || 'unknown',
            reason: normalizeString(root.reason) || null,
            sensitive,
            summary: sanitizeManagedActionHistorySummary(root.summary, actionType, sensitive)
        };
    }

    function appendManagedActionHistoryRow(profile, row) {
        const receivedAt = getManagedActionHistoryRowTime(row);
        const now = receivedAt == null ? Date.now() : receivedAt;
        return appendManagedActionHistoryRows(profile, [row], now);
    }

    function appendManagedActionHistoryRows(profile, rows, now = Date.now()) {
        return pruneManagedActionHistoryRows([
            ...safeArray(profile?.managedActionHistory),
            ...safeArray(rows)
        ], now);
    }


    function summarizeManagedNanahPolicyEnvelope(envelope, decision) {
        const root = safeObject(envelope);
        const payload = safeObject(root.payload);
        const operations = safeArray(payload.operations);
        const scope = normalizeString(root.scope).toLowerCase() || 'policy';
        const reason = normalizeString(decision?.reason);
        const label = reason
            ? `Rejected remote ${scope} policy`
            : `Received remote ${scope} policy`;
        return {
            redacted: true,
            label,
            operationCount: operations.length,
            payloadScope: normalizeString(payload.scope) || scope,
            decision: normalizeString(decision?.decision),
            reason: reason || null
        };
    }

    function resolveManagedRemoteHistoryActionType({ accepted, conflict, reason, transport }) {
        const channel = normalizeString(transport).toLowerCase();
        if (channel === 'mailbox') {
            if (accepted) return 'remote_policy.mailbox.accept';
            if (conflict) return 'remote_policy.mailbox.conflict';
            if (reason === 'mailbox_item_expired') return 'remote_policy.mailbox.expire';
            if (reason === 'link_revoked' || reason === 'key_revoked') return 'remote_policy.mailbox.revoke';
            return 'remote_policy.mailbox.reject';
        }
        return accepted ? 'remote_policy.accept' : (conflict ? 'remote_policy.conflict' : 'remote_policy.reject');
    }

    function isManagedRemotePolicyConflictReason(reason) {
        return MANAGED_REMOTE_POLICY_CONFLICT_REASONS.has(normalizeString(reason));
    }

    function buildManagedRemotePolicyConflictRecord({ envelope, reason, transport, trustedLinkId, targetProfileId, scope, now }) {
        const root = safeObject(envelope);
        const normalizedReason = normalizeString(reason) || 'validation_failed';
        if (!isManagedRemotePolicyConflictReason(normalizedReason)) return null;
        const linkId = normalizeString(trustedLinkId || root.linkId) || 'unknown_link';
        const sourceDeviceId = normalizeString(root.sourceDeviceId) || 'unknown_device';
        const normalizedTargetId = normalizeString(targetProfileId || root.targetProfileId) || 'unknown_target';
        const normalizedScope = normalizeString(scope || root.scope).toLowerCase() || 'sync_policy';
        const normalizedTransport = normalizeString(transport) || 'nanah';
        const key = [
            normalizedTransport,
            linkId,
            sourceDeviceId,
            normalizedTargetId,
            normalizedScope,
            normalizedReason
        ].join(':');
        return {
            schema: MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA,
            version: 1,
            key,
            transport: normalizedTransport,
            trustedLinkId: linkId === 'unknown_link' ? null : linkId,
            sourceDeviceId: sourceDeviceId === 'unknown_device' ? null : sourceDeviceId,
            sourceProfileId: normalizeString(root.sourceProfileId) || null,
            targetProfileId: normalizedTargetId === 'unknown_target' ? null : normalizedTargetId,
            scope: normalizedScope,
            revision: normalizeNonNegativeInteger(root.revision) || null,
            policyHash: normalizeString(root.policyHash) || null,
            reason: normalizedReason,
            lastSeenAt: now,
            count: 1,
            redacted: true
        };
    }

    function appendManagedRemotePolicyConflict(managedPolicyState, record) {
        if (!record) return managedPolicyState;
        const state = { ...safeObject(managedPolicyState) };
        const existing = safeObject(state.remotePolicyConflicts);
        const prior = safeObject(existing[record.key]);
        const nextRecord = prior.schema === MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA
            ? {
                ...prior,
                ...record,
                firstSeenAt: normalizeNonNegativeInteger(prior.firstSeenAt) || record.lastSeenAt,
                count: Math.max(0, normalizeNonNegativeInteger(prior.count) || 0) + 1
            }
            : {
                ...record,
                firstSeenAt: record.lastSeenAt
            };
        const entries = Object.entries({
            ...existing,
            [record.key]: nextRecord
        }).sort((a, b) => {
            const at = normalizeNonNegativeInteger(safeObject(a[1]).lastSeenAt) || 0;
            const bt = normalizeNonNegativeInteger(safeObject(b[1]).lastSeenAt) || 0;
            return bt - at;
        }).slice(0, MANAGED_REMOTE_POLICY_CONFLICT_LIMIT);
        state.remotePolicyConflicts = Object.fromEntries(entries);
        return state;
    }

    async function recordManagedNanahPolicyValidationHistory(envelope, decision, context = {}) {
        const root = safeObject(envelope);
        const io = getIO();
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            return false;
        }
        const targetProfileId = normalizeString(context.historyTargetProfileId || root.targetProfileId);
        if (!targetProfileId) return false;

        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetProfileId]);
        if (!profile || Object.keys(profile).length === 0) return false;

        const now = Date.now();
        const scope = normalizeString(root.scope).toLowerCase() || 'sync_policy';
        const revision = normalizeNonNegativeInteger(root.revision) || null;
        const policyHash = normalizeString(root.policyHash) || null;
        const reason = normalizeString(decision?.reason);
        const accepted = decision?.accepted === true && !reason;
        const conflict = reason === 'equal_revision_hash_conflict';
        const result = accepted ? 'accepted' : (conflict ? 'conflict' : 'rejected');
        const actionType = resolveManagedRemoteHistoryActionType({
            accepted,
            conflict,
            reason,
            transport: context.transport
        });
        const trustedLink = safeObject(context.trustedLink);
        const trustedLinkId = normalizeString(root.linkId || trustedLink.linkId || trustedLink.id);
        const transport = normalizeString(context.transport) || 'nanah';
        let remoteFailedAttempt = null;
        const managedPolicyState = { ...safeObject(profile.managedPolicyState) };
        if (!accepted) {
            const attemptKey = [
                transport,
                trustedLinkId || 'unknown_link',
                normalizeString(root.sourceDeviceId) || 'unknown_device',
                targetProfileId,
                scope
            ].join(':');
            const existingAttempts = safeObject(managedPolicyState.remoteFailedAttemptRateLimits);
            const existingAttempt = safeObject(existingAttempts[attemptKey]);
            const existingResetAt = Number(existingAttempt.resetAt);
            const activeWindow = existingAttempt.schema === MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA
                && Number.isFinite(existingResetAt)
                && now < existingResetAt;
            const priorCount = activeWindow
                ? Math.max(0, Math.floor(Number(existingAttempt.failedAttempts) || 0))
                : 0;
            const failedAttempts = priorCount + 1;
            remoteFailedAttempt = {
                schema: MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA,
                version: 1,
                key: attemptKey,
                transport,
                trustedLinkId,
                sourceDeviceId: normalizeString(root.sourceDeviceId) || null,
                targetProfileId,
                scope,
                failedAttempts,
                limit: MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT,
                resetAt: activeWindow ? existingResetAt : now + MANAGED_REMOTE_FAILED_ATTEMPT_WINDOW_MS,
                updatedAt: now,
                rateLimited: failedAttempts >= MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT,
                lastReason: reason || 'validation_failed'
            };
            managedPolicyState.remoteFailedAttemptRateLimits = {
                ...existingAttempts,
                [attemptKey]: remoteFailedAttempt
            };
        }
        const conflictRecord = buildManagedRemotePolicyConflictRecord({
            envelope: root,
            reason,
            transport,
            trustedLinkId,
            targetProfileId,
            scope,
            now
        });
        const nextManagedPolicyState = appendManagedRemotePolicyConflict(managedPolicyState, conflictRecord);
        const row = {
            rowId: `remote-managed-${normalizeString(context.transport) || 'nanah'}-${scope}-${revision || 'none'}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: normalizeString(root.sourceProfileId) || null,
            actorDeviceId: normalizeString(root.sourceDeviceId) || null,
            targetProfileId,
            trustedLinkId,
            actionType,
            scope,
            revision,
            policyHash,
            result,
            reason: accepted ? null : (reason || 'validation_failed'),
            receivedAt: now,
            issuedAt: normalizeNonNegativeInteger(root.issuedAt) || null,
            orderKey: `${String(revision || 0).padStart(6, '0')}:${now}`,
            summary: {
                ...summarizeManagedNanahPolicyEnvelope(root, decision),
                transport,
                mailboxItemId: normalizeString(context.mailboxItemId || decision?.mailboxItemId) || null,
                ...(remoteFailedAttempt ? {
                    remoteFailedAttempts: remoteFailedAttempt.failedAttempts,
                    remoteFailedAttemptLimit: remoteFailedAttempt.limit,
                    rateLimited: remoteFailedAttempt.rateLimited,
                    retryAt: remoteFailedAttempt.resetAt
                } : {})
            },
            sensitive: true
        };
        profiles[targetProfileId] = {
            ...profile,
            ...(remoteFailedAttempt || conflictRecord ? { managedPolicyState: nextManagedPolicyState } : {}),
            managedActionHistory: appendManagedActionHistoryRow(profile, row)
        };
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        return true;
    }


    async function recordManagedOpenSyncAckHistory(details = {}) {
        const root = safeObject(details);
        const request = safeObject(root.request);
        const candidate = safeObject(root.candidate);
        const ackResult = safeObject(root.ackResult);
        const records = safeArray(root.records);
        const targetProfileId = normalizeString(request.targetProfileId || candidate.targetProfileId);
        const transport = normalizeString(root.transport || ackResult.transport || request.transport).toLowerCase() === 'local_network'
            ? 'local_network'
            : 'mailbox';
        if (!targetProfileId || records.length === 0) {
            return { ok: false, reason: 'missing_ack_history_target', recordedCount: 0, failedCount: records.length };
        }

        const io = getIO();
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            return { ok: false, reason: 'profiles_unavailable', recordedCount: 0, failedCount: records.length };
        }

        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetProfileId]);
        if (!profile || Object.keys(profile).length === 0) {
            return { ok: false, reason: 'target_profile_missing', recordedCount: 0, failedCount: records.length };
        }

        const now = Date.now();
        const ackedCount = Math.max(0, Math.floor(Number(ackResult.ackedItemCount ?? ackResult.ackedCandidateCount) || 0));
        const failedCount = Math.max(0, Math.floor(Number(ackResult.failedAckCount ?? ackResult.failedCandidateCount) || 0));
        const providerAcceptedAll = ackResult.ok !== false && failedCount === 0 && ackedCount >= records.length;
        const historyRows = [];
        records.forEach((record, index) => {
            const ackRecord = safeObject(record);
            const scope = normalizeString(ackRecord.scope).toLowerCase() || 'sync_policy';
            const revision = normalizeNonNegativeInteger(ackRecord.revision) || null;
            const policyHash = normalizeString(ackRecord.policyHash) || null;
            if (!scope || !revision || !policyHash) return;
            const mailboxItemId = normalizeString(ackRecord.mailboxItemId);
            const localNetworkCandidateId = normalizeString(ackRecord.localNetworkCandidateId || ackRecord.candidateId);
            const itemId = transport === 'local_network' ? localNetworkCandidateId : mailboxItemId;
            const transportLabel = transport === 'local_network' ? 'Home Pickup' : 'Internet Pickup';
            const result = providerAcceptedAll ? 'accepted' : 'rejected';
            const reason = providerAcceptedAll
                ? null
                : (normalizeString(ackResult.reason) || 'ack_handoff_failed');
            historyRows.push({
                rowId: `remote-${transport.replace('_', '-')}-ack-${scope}-${revision}-${itemId || 'item'}-${now}-${index}`,
                schema: MANAGED_ACTION_HISTORY_SCHEMA,
                version: 1,
                actorProfileId: normalizeString(ackRecord.sourceProfileId || request.sourceProfileId || candidate.sourceProfileId) || null,
                actorDeviceId: normalizeString(ackRecord.sourceDeviceId || request.sourceDeviceId || candidate.sourceDeviceId) || 'unknown-source-device',
                targetProfileId,
                trustedLinkId: normalizeString(ackRecord.linkId || request.linkId || candidate.linkId),
                actionType: transport === 'local_network' ? 'remote_policy.local_network.ack' : 'remote_policy.mailbox.ack',
                scope,
                revision,
                policyHash,
                result,
                reason,
                receivedAt: now,
                issuedAt: normalizeNonNegativeInteger(ackRecord.ackedAt || request.ackedAt) || now,
                orderKey: `ack:${String(revision).padStart(6, '0')}:${now}:${index}`,
                summary: {
                    redacted: true,
                    label: providerAcceptedAll ? `${transportLabel} ack delivered` : `${transportLabel} ack handoff failed`,
                    transport,
                    mailboxItemId: mailboxItemId || null,
                    localNetworkCandidateId: localNetworkCandidateId || null,
                    ackState: normalizeString(ackRecord.ackState) || null,
                    providerAckedItemCount: ackedCount,
                    providerFailedAckCount: failedCount,
                    providerAckedCandidateCount: transport === 'local_network' ? ackedCount : null,
                    providerFailedCandidateCount: transport === 'local_network' ? failedCount : null
                },
                sensitive: true
            });
        });

        if (historyRows.length === 0) {
            return { ok: false, reason: 'no_recordable_ack_history_rows', recordedCount: 0, failedCount: records.length };
        }

        profiles[targetProfileId] = {
            ...profile,
            managedActionHistory: appendManagedActionHistoryRows(profile, historyRows)
        };
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        return { ok: true, reason: '', recordedCount: historyRows.length, failedCount: 0 };
    }

    return Object.freeze({
        recordValidationHistory: recordManagedNanahPolicyValidationHistory,
        recordAckHistory: recordManagedOpenSyncAckHistory
    });
}));
