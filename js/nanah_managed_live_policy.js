(function initNanahManagedLivePolicy(global) {
    'use strict';

    const MANAGED_LIVE_POLICY_SCOPES = [
        'main',
        'kids',
        'videos',
        'keywords',
        'channels',
        'viewing_space',
        'time_limits',
        'rules_bundle'
    ];
    const MANAGED_LIVE_BUNDLE_SCOPES = {
        rules_bundle: ['keywords', 'channels', 'videos']
    };
    const MANAGED_LIVE_ACK_SCHEMA = 'filtertube_nanah_managed_live_ack';
    const MANAGED_LIVE_ACK_HISTORY_SCHEMA = 'filtertube_managed_live_ack_history';
    const MANAGED_OUTBOUND_HISTORY_SCHEMA = 'filtertube_managed_outbound_policy_history';
    const MANAGED_OUTBOUND_HISTORY_LIMIT = 50;
    const MANAGED_LIVE_ACK_HISTORY_LIMIT = 50;

    function create(deps = {}) {
        const normalizeString = deps.normalizeString;
        const safeObject = deps.safeObject;
        const normalizeNonNegativeInteger = deps.normalizeNonNegativeInteger;

        function normalizeScope(scope) {
            const normalized = normalizeString(scope).toLowerCase();
            return MANAGED_LIVE_POLICY_SCOPES.includes(normalized) ? normalized : '';
        }

        function safeArray(value) {
            return Array.isArray(value) ? value : [];
        }

        function expandScope(scope) {
            const normalizedScope = normalizeScope(scope);
            return MANAGED_LIVE_BUNDLE_SCOPES[normalizedScope] || (normalizedScope ? [normalizedScope] : []);
        }

        function cloneList(value) {
            return Array.isArray(value)
                ? value.map((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? { ...entry } : entry)
                : [];
        }

        function resolvePolicySourceProfile() {
            const explicitSource = typeof deps.getPolicySourceProfile === 'function'
                ? safeObject(deps.getPolicySourceProfile())
                : {};
            if (Object.keys(safeObject(explicitSource.profile)).length > 0) {
                return explicitSource;
            }
            const profilesRoot = safeObject(deps.getProfilesRoot());
            const profileId = normalizeString(deps.getLocalProfileContext().profileId) || 'default';
            const profile = safeObject(safeObject(profilesRoot.profiles)[profileId]);
            return {
                profileId,
                profile,
                sourceKind: 'active_profile'
            };
        }

        function resolvePayloadSurface(scope) {
            if (scope === 'kids') return 'kids';
            if (scope === 'main') return 'main';
            const activeSurface = normalizeString(typeof deps.getActiveManagedSurface === 'function'
                ? deps.getActiveManagedSurface()
                : '').toLowerCase();
            return activeSurface === 'kids' ? 'kids' : 'main';
        }

        function buildListPayload(scope, profile, surface) {
            const data = deps.getProfileSurface(profile, surface);
            const list = data.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            const payload = {
                scope,
                surface,
                list,
                replace: true
            };
            if (scope === 'keywords') {
                if (list === 'whitelist') {
                    payload.whitelistKeywords = cloneList(data.whitelistKeywords);
                } else if (surface === 'kids') {
                    payload.blockedKeywords = cloneList(data.blockedKeywords);
                } else {
                    payload.keywords = cloneList(data.keywords);
                }
            } else if (scope === 'channels') {
                if (list === 'whitelist') {
                    payload.whitelistChannels = cloneList(data.whitelistChannels);
                } else if (surface === 'kids') {
                    payload.blockedChannels = cloneList(data.blockedChannels);
                } else {
                    payload.channels = cloneList(data.channels);
                }
            }
            return payload;
        }

        function buildViewingSpacePayload(profile) {
            const settings = safeObject(profile.settings);
            const allowMain = settings.allowMainViewing !== false;
            const allowKids = settings.allowKidsViewing !== false;
            if (!allowMain && !allowKids) {
                throw new Error('Signed managed viewing-space sends require at least one allowed viewing space.');
            }
            return {
                scope: 'viewing_space',
                allowMain,
                allowKids,
                ...(normalizeString(settings.defaultLaunchTarget)
                    ? { defaultLaunchTarget: normalizeString(settings.defaultLaunchTarget) }
                    : {})
            };
        }

        function buildTimeLimitPayload(profile) {
            const policy = typeof deps.getManagedTimeLimitPolicy === 'function'
                ? deps.getManagedTimeLimitPolicy(profile)
                : null;
            if (!policy) {
                throw new Error('Signed managed time-limit sends require a saved profile time limit.');
            }
            return {
                scope: 'time_limits',
                enabled: policy.enabled === true,
                timezone: normalizeString(policy.timezone) || 'UTC',
                dailyBudgetMinutes: Math.floor(policy.dailyBudgetSeconds / 60),
                dailyBudgetSeconds: policy.dailyBudgetSeconds,
                surfaceBudgets: safeObject(policy.surfaceBudgets),
                countingMode: normalizeString(policy.countingMode) || 'active_youtube_tab',
                activeDeviceBudgetPolicy: normalizeString(policy.activeDeviceBudgetPolicy) || 'single_active_tab_no_double_count',
                resetPolicy: normalizeString(policy.resetPolicy) || 'policy_timezone_midnight',
                graceSeconds: normalizeNonNegativeInteger(policy.graceSeconds) || 0,
                parentGrant: safeObject(policy.parentGrant),
                validFrom: policy.validFrom == null ? null : normalizeNonNegativeInteger(policy.validFrom),
                validUntil: policy.validUntil == null ? null : normalizeNonNegativeInteger(policy.validUntil)
            };
        }

        function buildPayload(scope) {
            const normalizedScope = normalizeScope(scope);
            if (!normalizedScope) {
                throw new Error('Signed managed sends require a managed policy scope.');
            }
            if (MANAGED_LIVE_BUNDLE_SCOPES[normalizedScope]) {
                throw new Error('Managed bundle sends must expand into individual policy payloads.');
            }
            const source = resolvePolicySourceProfile();
            const profile = safeObject(source.profile);
            if (!profile || Object.keys(profile).length === 0) {
                throw new Error('Active profile is unavailable for managed policy send.');
            }
            const surface = resolvePayloadSurface(normalizedScope);
            if (normalizedScope === 'keywords' || normalizedScope === 'channels') {
                return buildListPayload(normalizedScope, profile, surface);
            }
            if (normalizedScope === 'videos') {
                return {
                    scope: 'videos',
                    surface,
                    replace: true,
                    videoIds: cloneList(deps.getProfileSurface(profile, surface).videoIds)
                };
            }
            if (normalizedScope === 'viewing_space') {
                return buildViewingSpacePayload(profile);
            }
            if (normalizedScope === 'time_limits') {
                return buildTimeLimitPayload(profile);
            }
            return {
                scope: normalizedScope,
                replace: true,
                data: deps.getProfileSurface(profile, normalizedScope)
            };
        }

        function resolveTargetProfile(trustedLink) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const policy = safeObject(trusted?.policy);
            const policyBehavior = deps.getTargetProfileBehavior(policy.targetProfileBehavior, 'current_active');
            if (policyBehavior === 'fixed_profile' && normalizeString(policy.targetProfileId)) {
                return {
                    profileId: normalizeString(policy.targetProfileId),
                    profileName: normalizeString(policy.targetProfileName),
                    profileType: normalizeString(policy.targetProfileType) || 'child'
                };
            }

            const remoteTarget = deps.normalizeTargetProfileContext(deps.getRemoteTargetProfile());
            if (remoteTarget.behavior === 'fixed_profile' && normalizeString(remoteTarget.profileId)) {
                return {
                    profileId: remoteTarget.profileId,
                    profileName: remoteTarget.profileName,
                    profileType: normalizeString(remoteTarget.profileType) || 'child'
                };
            }

            return null;
        }

        function stablePolicyJson(value) {
            if (Array.isArray(value)) {
                return `[${value.map(stablePolicyJson).join(',')}]`;
            }
            if (value && typeof value === 'object') {
                return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stablePolicyJson(value[key])}`).join(',')}}`;
            }
            return JSON.stringify(value);
        }

        function buildPolicyHash(seed) {
            return deps.buildLocalPolicyHash('remote-managed-policy', stablePolicyJson(seed));
        }

        function getOutgoingPolicyState(trustedLink, scope) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const state = safeObject(safeObject(safeObject(trusted?.policy).outgoingManagedPolicies)[normalizeString(scope).toLowerCase()]);
            const revision = normalizeNonNegativeInteger(state.revision);
            const policyHash = normalizeString(state.policyHash);
            return revision && policyHash ? { revision, policyHash } : null;
        }

        async function buildEnvelopeForScope(policy, scope, options = {}) {
            const adapter = deps.getAdapter();
            if (typeof adapter.signManagedPolicyEnvelope !== 'function') {
                throw new Error('Managed policy signing is unavailable');
            }

            const optionRoot = safeObject(options);
            const trustedLink = deps.normalizeTrustedLink(optionRoot.trustedLink || deps.getCurrentTrustedLink());
            if (!trustedLink || trustedLink.linkType !== 'managed_link') {
                throw new Error('Signed managed sends require a saved managed link.');
            }
            if (trustedLink.localRole !== 'source' || trustedLink.remoteRole !== 'replica') {
                throw new Error('Signed managed sends require Source -> Replica roles.');
            }

            const normalizedScope = normalizeScope(scope);
            if (!normalizedScope) {
                throw new Error('Signed managed sends require Main, Kids, keyword, channel, video, viewing-space, or time-limit scope.');
            }
            const allowedScopes = deps.getAllowedScopeList(safeObject(trustedLink.policy).allowedScopes || safeObject(trustedLink.policy).defaultScope);
            if (!allowedScopes.includes(normalizedScope)) {
                throw new Error(`This managed link does not allow signed ${deps.getScopeLabel(normalizedScope)} policy sends.`);
            }

            const targetProfile = resolveTargetProfile(trustedLink);
            if (!normalizeString(targetProfile?.profileId)) {
                throw new Error('Signed managed sends require the replica to save a fixed child target profile.');
            }

            const keyPair = await deps.ensureSigningKeyPair({ required: true });
            const sourcePublicKeyId = normalizeString(keyPair?.managedPublicKeyId || keyPair?.sourcePublicKeyId || keyPair?.publicKeyId);
            const keyVersion = normalizeNonNegativeInteger(keyPair?.managedKeyVersion || keyPair?.keyVersion || keyPair?.sourceKeyVersion) || 0;
            if (!sourcePublicKeyId || keyVersion <= 0 || Object.keys(safeObject(keyPair?.privateKeyJwk)).length === 0) {
                throw new Error('Managed source signing key is incomplete.');
            }

            const sourceProfile = deps.getLocalProfileContext();
            const payload = buildPayload(normalizedScope);
            const policyHash = buildPolicyHash({
                linkId: trustedLink.linkId,
                scope: normalizedScope,
                targetProfileId: targetProfile.profileId,
                sourceProfileId: sourceProfile.profileId,
                sourceDeviceId: normalizeString(deps.getStableDeviceId()),
                payload
            });
            const prior = getOutgoingPolicyState(trustedLink, normalizedScope);
            const revision = prior?.policyHash === policyHash
                ? prior.revision
                : Math.max(0, prior?.revision || 0) + 1;

            return adapter.signManagedPolicyEnvelope({
                type: 'filtertube_managed_policy',
                linkId: normalizeString(trustedLink.linkId),
                scope: normalizedScope,
                targetProfileId: targetProfile.profileId,
                targetProfileName: normalizeString(targetProfile.profileName),
                sourceProfileId: normalizeString(sourceProfile.profileId),
                sourceDeviceId: normalizeString(deps.getStableDeviceId()),
                revision,
                policyHash,
                sourcePublicKeyId,
                keyVersion,
                issuedAt: deps.now(),
                payload,
                privateKeyJwk: keyPair.privateKeyJwk
            });
        }

        async function buildEnvelopeForLiveSend(policy) {
            const scope = normalizeScope(policy.scope);
            if (MANAGED_LIVE_BUNDLE_SCOPES[scope]) {
                throw new Error('Managed bundle sends must use buildEnvelopeBatchForLiveSend.');
            }
            return buildEnvelopeForScope(policy, scope);
        }

        async function buildEnvelopeBatchForLiveSend(policy) {
            const scopes = expandScope(policy.scope);
            if (scopes.length === 0) {
                throw new Error('Signed managed sends require Main, Kids, keyword, channel, video, viewing-space, or time-limit scope.');
            }
            const envelopes = [];
            for (const scope of scopes) {
                envelopes.push(await buildEnvelopeForScope(policy, scope));
            }
            return envelopes;
        }

        async function buildEnvelopeBatchForTrustedLinks(policy, trustedLinks) {
            const links = Array.isArray(trustedLinks)
                ? trustedLinks.map((link) => deps.normalizeTrustedLink(link)).filter(Boolean)
                : [];
            if (links.length === 0) {
                throw new Error('Managed fanout sends require at least one saved profile-scoped trusted link.');
            }
            const scopes = expandScope(policy.scope);
            if (scopes.length === 0) {
                throw new Error('Signed managed sends require Main, Kids, keyword, channel, video, viewing-space, or time-limit scope.');
            }
            const envelopes = [];
            for (const trustedLink of links) {
                if (!normalizeString(trustedLink.linkId)) {
                    throw new Error('Managed fanout sends require every trusted link to have a link id.');
                }
                for (const scope of scopes) {
                    envelopes.push(await buildEnvelopeForScope(policy, scope, { trustedLink }));
                }
            }
            return envelopes;
        }

        function buildOutboundHistoryRow(trustedLink, scope, revision, policyHash, options = {}) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const policy = safeObject(trusted?.policy);
            const optionRoot = safeObject(options);
            const now = normalizeNonNegativeInteger(optionRoot.sentAt) || deps.now();
            const normalizedScope = normalizeScope(scope);
            const sourceProfile = deps.getLocalProfileContext();
            const targetProfileId = normalizeString(optionRoot.targetProfileId)
                || normalizeString(policy.targetProfileId);
            return {
                rowId: `managed-outbound-${normalizeString(trusted?.linkId)}-${normalizedScope}-${revision}-${now}`,
                schema: MANAGED_OUTBOUND_HISTORY_SCHEMA,
                version: 1,
                trustedLinkId: normalizeString(trusted?.linkId),
                actionType: 'remote_policy.live_send',
                scope: normalizedScope,
                revision,
                policyHash: normalizeString(policyHash),
                result: 'sent',
                reason: null,
                targetProfileId,
                targetProfileName: normalizeString(optionRoot.targetProfileName)
                    || normalizeString(policy.targetProfileName),
                sourceProfileId: normalizeString(optionRoot.sourceProfileId)
                    || normalizeString(sourceProfile.profileId),
                sourceDeviceId: normalizeString(optionRoot.sourceDeviceId)
                    || normalizeString(deps.getStableDeviceId()),
                issuedAt: normalizeNonNegativeInteger(optionRoot.issuedAt) || now,
                sentAt: now,
                summary: {
                    redacted: true,
                    label: 'Sent signed managed policy',
                    delivery: 'live_nanah_session'
                },
                sensitive: true
            };
        }

        function normalizeAckState(value) {
            const normalized = normalizeString(value).toLowerCase();
            if (['delivered', 'rejected', 'conflict', 'expired', 'revoked'].includes(normalized)) {
                return normalized;
            }
            return 'rejected';
        }

        function resolveAckState(decision) {
            const root = safeObject(decision);
            const explicit = normalizeString(root.ackState).toLowerCase();
            if (explicit) return normalizeAckState(explicit);
            const reason = normalizeString(root.reason).toLowerCase();
            if (reason === 'equal_revision_hash_conflict') return 'conflict';
            if (reason === 'mailbox_item_expired') return 'expired';
            if (reason === 'link_revoked' || reason === 'key_revoked' || reason === 'trust_revoked') return 'revoked';
            return root.accepted === true ? 'delivered' : 'rejected';
        }

        function resultForAckState(ackState) {
            if (ackState === 'delivered') return 'accepted';
            if (ackState === 'conflict') return 'conflict';
            if (ackState === 'expired') return 'expired';
            if (ackState === 'revoked') return 'revoked';
            return 'rejected';
        }

        function buildLiveAckPayload(envelope, decision, options = {}) {
            const root = safeObject(envelope);
            const optionRoot = safeObject(options);
            const decisionRoot = safeObject(decision);
            const scope = normalizeScope(root.scope);
            const now = normalizeNonNegativeInteger(optionRoot.ackedAt) || deps.now();
            const ackState = resolveAckState(decisionRoot);
            const reason = normalizeString(decisionRoot.reason);
            const record = {
                mailboxItemId: normalizeString(optionRoot.mailboxItemId || decisionRoot.mailboxItemId) || null,
                scope,
                revision: normalizeNonNegativeInteger(root.revision) || null,
                policyHash: normalizeString(root.policyHash),
                ackState,
                accepted: ackState === 'delivered',
                applied: decisionRoot.applied !== false && ackState === 'delivered',
                decision: normalizeString(decisionRoot.decision),
                reason: ackState === 'delivered' ? null : (reason || ackState),
                ackedAt: now
            };
            return {
                schema: MANAGED_LIVE_ACK_SCHEMA,
                version: 1,
                ackedAt: now,
                linkId: normalizeString(root.linkId),
                sourceDeviceId: normalizeString(root.sourceDeviceId),
                sourceProfileId: normalizeString(root.sourceProfileId),
                targetDeviceId: normalizeString(deps.getStableDeviceId()),
                targetProfileId: normalizeString(root.targetProfileId),
                targetProfileName: normalizeString(root.targetProfileName),
                transport: normalizeString(optionRoot.transport) || 'live_nanah_session',
                records: [record],
                summary: {
                    redacted: true,
                    label: ackState === 'delivered' ? 'Managed policy applied' : 'Managed policy rejected',
                    ackState
                },
                sensitive: true
            };
        }

        function buildInboundAckHistoryRow(trustedLink, ackPayload, ackRecord) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const policy = safeObject(trusted?.policy);
            const root = safeObject(ackPayload);
            const record = safeObject(ackRecord);
            const scope = normalizeScope(record.scope || root.scope);
            const revision = normalizeNonNegativeInteger(record.revision);
            const policyHash = normalizeString(record.policyHash);
            const ackState = normalizeAckState(record.ackState);
            const receivedAt = deps.now();
            const ackedAt = normalizeNonNegativeInteger(record.ackedAt || root.ackedAt) || receivedAt;
            const result = resultForAckState(ackState);
            return {
                rowId: `managed-live-ack-${normalizeString(trusted?.linkId)}-${scope}-${revision || 'none'}-${receivedAt}`,
                schema: MANAGED_LIVE_ACK_HISTORY_SCHEMA,
                version: 1,
                trustedLinkId: normalizeString(trusted?.linkId),
                actionType: 'remote_policy.live_ack',
                scope,
                revision,
                policyHash,
                result,
                reason: result === 'accepted' ? null : (normalizeString(record.reason) || ackState),
                targetProfileId: normalizeString(root.targetProfileId) || normalizeString(policy.targetProfileId),
                targetProfileName: normalizeString(root.targetProfileName) || normalizeString(policy.targetProfileName),
                sourceProfileId: normalizeString(root.sourceProfileId) || normalizeString(policy.sourceProfileId),
                sourceDeviceId: normalizeString(root.sourceDeviceId) || normalizeString(policy.sourceDeviceId),
                targetDeviceId: normalizeString(root.targetDeviceId),
                ackState,
                ackedAt,
                receivedAt,
                summary: {
                    redacted: true,
                    label: result === 'accepted' ? 'Replica applied managed policy' : 'Replica rejected managed policy',
                    transport: normalizeString(root.transport) || 'live_nanah_session'
                },
                sensitive: true
            };
        }

        async function recordLiveAckPayload(ackPayload) {
            const root = safeObject(ackPayload);
            if (root.schema !== MANAGED_LIVE_ACK_SCHEMA) return { ok: false, reason: 'wrong_ack_schema', recordedCount: 0 };
            const normalizedLinkId = normalizeString(root.linkId);
            if (!normalizedLinkId) return { ok: false, reason: 'missing_link_id', recordedCount: 0 };
            const trusted = deps.normalizeTrustedLink(deps.findTrustedLinkById(normalizedLinkId));
            if (!trusted) return { ok: false, reason: 'unknown_trusted_link', recordedCount: 0 };

            const policy = safeObject(trusted.policy);
            const localSourceDeviceId = normalizeString(deps.getStableDeviceId());
            const ackSourceDeviceId = normalizeString(root.sourceDeviceId);
            if (localSourceDeviceId && ackSourceDeviceId && localSourceDeviceId !== ackSourceDeviceId) {
                return { ok: false, reason: 'source_device_mismatch', recordedCount: 0 };
            }
            const policyTargetProfileId = normalizeString(policy.targetProfileId);
            const ackTargetProfileId = normalizeString(root.targetProfileId);
            if (policyTargetProfileId && ackTargetProfileId && policyTargetProfileId !== ackTargetProfileId) {
                return { ok: false, reason: 'target_profile_mismatch', recordedCount: 0 };
            }

            const outgoing = safeObject(policy.outgoingManagedPolicies);
            const validRows = [];
            const nextOutgoing = { ...outgoing };
            for (const ackRecord of safeArray(root.records)) {
                const row = buildInboundAckHistoryRow(trusted, root, ackRecord);
                if (!row.scope || !Number.isInteger(row.revision) || !row.policyHash) continue;
                const currentState = safeObject(outgoing[row.scope]);
                if (currentState.revision !== row.revision || normalizeString(currentState.policyHash) !== row.policyHash) continue;
                validRows.push(row);
                nextOutgoing[row.scope] = {
                    ...currentState,
                    lastAckAt: row.receivedAt,
                    lastAckState: row.ackState,
                    lastAckResult: row.result,
                    lastAckReason: row.reason,
                    lastAckTargetProfileId: row.targetProfileId
                };
            }
            if (validRows.length === 0) {
                return { ok: false, reason: 'no_matching_ack_records', recordedCount: 0 };
            }

            const historyRows = Array.isArray(policy.inboundManagedAckHistory)
                ? policy.inboundManagedAckHistory
                    .filter((row) => safeObject(row).schema === MANAGED_LIVE_ACK_HISTORY_SCHEMA)
                : [];
            const updated = await deps.updateTrustedLinkPolicy(normalizedLinkId, {
                policy: {
                    outgoingManagedPolicies: nextOutgoing,
                    inboundManagedAckHistory: [...historyRows, ...validRows].slice(-MANAGED_LIVE_ACK_HISTORY_LIMIT)
                }
            });
            return updated
                ? { ok: true, reason: '', recordedCount: validRows.length, latest: validRows[validRows.length - 1] }
                : { ok: false, reason: 'trusted_link_update_failed', recordedCount: 0 };
        }

        async function markSent(linkId, scope, revision, policyHash, options = {}) {
            const normalizedLinkId = normalizeString(linkId);
            const normalizedScope = normalizeScope(scope);
            if (!normalizedLinkId || !normalizedScope || !Number.isInteger(revision) || !normalizeString(policyHash)) return false;
            const trusted = deps.normalizeTrustedLink(deps.findTrustedLinkById(normalizedLinkId));
            if (!trusted) return false;
            const policy = safeObject(trusted.policy);
            const outgoing = safeObject(policy.outgoingManagedPolicies);
            const sentAt = deps.now();
            const historyRows = Array.isArray(policy.outboundManagedPolicyHistory)
                ? policy.outboundManagedPolicyHistory
                    .filter((row) => safeObject(row).schema === MANAGED_OUTBOUND_HISTORY_SCHEMA)
                : [];
            const historyRow = buildOutboundHistoryRow(trusted, normalizedScope, revision, policyHash, {
                ...safeObject(options),
                sentAt
            });
            return deps.updateTrustedLinkPolicy(normalizedLinkId, {
                policy: {
                    outgoingManagedPolicies: {
                        ...outgoing,
                        [normalizedScope]: {
                            revision,
                            policyHash,
                            sentAt
                        }
                    },
                    outboundManagedPolicyHistory: [...historyRows, historyRow].slice(-MANAGED_OUTBOUND_HISTORY_LIMIT)
                }
            });
        }

        return {
            normalizeScope,
            expandScope,
            buildPayload,
            buildEnvelopeForLiveSend,
            buildEnvelopeBatchForLiveSend,
            buildEnvelopeBatchForTrustedLinks,
            buildOutboundHistoryRow,
            buildLiveAckPayload,
            recordLiveAckPayload,
            markSent
        };
    }

    global.FilterTubeNanahManagedLivePolicy = { create };
})(window);
