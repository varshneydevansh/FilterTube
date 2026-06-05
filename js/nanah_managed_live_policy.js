(function initNanahManagedLivePolicy(global) {
    'use strict';

    const MANAGED_LIVE_POLICY_SCOPES = ['active', 'full', 'main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits', 'rules_bundle'];
    const MANAGED_LIVE_BUNDLE_SCOPES = { active: ['main', 'kids', 'viewing_space', 'time_limits'], full: ['main', 'kids', 'viewing_space', 'time_limits'], rules_bundle: ['keywords', 'channels', 'videos'] };
    const MANAGED_LIVE_ACK_SCHEMA = 'filtertube_nanah_managed_live_ack';
    const MANAGED_MAILBOX_ACK_SCHEMA = 'filtertube_nanah_managed_open_sync_ack';
    const MANAGED_LOCAL_NETWORK_ACK_SCHEMA = 'filtertube_managed_local_network_candidate_ack';
    const MANAGED_LOCAL_NETWORK_CANDIDATE_SCHEMA = 'filtertube_managed_local_network_candidate';
    const MANAGED_LOCAL_NETWORK_DELIVERY_REQUEST_SCHEMA = 'filtertube_managed_local_network_delivery_request';
    const MANAGED_MAILBOX_UPLOAD_REQUEST_SCHEMA = 'filtertube_managed_mailbox_upload_request';
    const MANAGED_MAILBOX_PURGE_REQUEST_SCHEMA = 'filtertube_managed_mailbox_purge_request';
    const MANAGED_LIVE_ACK_HISTORY_SCHEMA = 'filtertube_managed_live_ack_history';
    const MANAGED_REMOTE_DELIVERY_ACK_HISTORY_SCHEMA = 'filtertube_managed_remote_delivery_ack_history';
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

        function isProfilePolicyBundle(scope) {
            const normalizedScope = normalizeScope(scope);
            return normalizedScope === 'active' || normalizedScope === 'full';
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

        function resolveConcreteSendScopes(scope) {
            const normalizedScope = normalizeScope(scope);
            const scopes = expandScope(normalizedScope);
            if (!isProfilePolicyBundle(normalizedScope)) return scopes;

            const source = resolvePolicySourceProfile();
            const profile = safeObject(source.profile);
            const timeLimitPolicy = typeof deps.getManagedTimeLimitPolicy === 'function'
                ? deps.getManagedTimeLimitPolicy(profile)
                : null;
            return scopes.filter((item) => item !== 'time_limits' || !!timeLimitPolicy);
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

        function stripEnvelopePrivateFields(envelope) {
            const clean = {
                ...safeObject(envelope)
            };
            delete clean.privateKeyJwk;
            delete clean.privateKey;
            delete clean.secretKey;
            delete clean.signingKey;
            return clean;
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

            const signedEnvelope = await adapter.signManagedPolicyEnvelope({
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
            return stripEnvelopePrivateFields(signedEnvelope);
        }

        async function buildEnvelopeForLiveSend(policy) {
            const scope = normalizeScope(policy.scope);
            if (MANAGED_LIVE_BUNDLE_SCOPES[scope]) {
                throw new Error('Managed bundle sends must use buildEnvelopeBatchForLiveSend.');
            }
            return buildEnvelopeForScope(policy, scope);
        }

        async function buildEnvelopeBatchForLiveSend(policy) {
            const scopes = resolveConcreteSendScopes(policy.scope);
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
            const scopes = resolveConcreteSendScopes(policy.scope);
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
                    delivery: normalizeString(optionRoot.delivery) || 'live_nanah_session'
                },
                sensitive: true
            };
        }

        async function ensureProviderDeliveryAuthorized(transport, options = {}, context = {}) {
            const root = safeObject(options);
            const proof = safeObject(root.auth || root.adminAuth || root.authorization);
            if (root.providerDeliveryAuthorized === true || root.adminAuthorized === true || proof.ok === true || proof.valid === true || proof.authorized === true) return { ok: true };
            if (typeof deps.ensureManagedProviderDeliveryAuthorized !== 'function') return { ok: false, reason: 'managed_provider_delivery_reauth_required' };
            const result = await deps.ensureManagedProviderDeliveryAuthorized({ ...safeObject(context), transport, reason: normalizeString(root.reason) || 'manual_send', sensitiveAction: true });
            const normalized = safeObject(result);
            if (result === true || normalized.ok === true || normalized.valid === true || normalized.authorized === true) return { ok: true };
            return { ok: false, reason: normalizeString(normalized.reason || normalized.error) || 'managed_provider_delivery_reauth_required' };
        }

        function buildLocalNetworkCandidateFromEnvelope(envelope, options = {}) {
            const root = safeObject(envelope);
            const optionRoot = safeObject(options);
            const scope = normalizeScope(root.scope);
            const revision = normalizeNonNegativeInteger(root.revision);
            const policyHash = normalizeString(root.policyHash);
            const linkId = normalizeString(root.linkId);
            if (!scope || !revision || !policyHash || !linkId) {
                throw new Error('Local-network managed candidates require link, scope, revision, and policy hash.');
            }

            const createdAt = normalizeNonNegativeInteger(optionRoot.createdAt) || deps.now();
            const ttlSeconds = normalizeNonNegativeInteger(optionRoot.ttlSeconds) || 3600;
            const expiresAt = optionRoot.expiresAt === null
                ? null
                : (normalizeNonNegativeInteger(optionRoot.expiresAt) || (createdAt + (ttlSeconds * 1000)));
            const candidateId = normalizeString(optionRoot.candidateId)
                || `managed-ln-${linkId}-${scope}-${revision}-${policyHash.slice(0, 16)}-${createdAt}`;
            return {
                schema: MANAGED_LOCAL_NETWORK_CANDIDATE_SCHEMA,
                version: 1,
                candidateId,
                transport: 'local_network',
                linkId,
                sourceDeviceId: normalizeString(root.sourceDeviceId),
                sourceProfileId: normalizeString(root.sourceProfileId),
                targetProfileId: normalizeString(root.targetProfileId),
                targetProfileName: normalizeString(root.targetProfileName),
                scope,
                revision,
                policyHash,
                sourcePublicKeyId: normalizeString(root.sourcePublicKeyId),
                keyVersion: normalizeNonNegativeInteger(root.keyVersion) || 0,
                issuedAt: normalizeNonNegativeInteger(root.issuedAt) || createdAt,
                createdAt,
                expiresAt,
                envelope: root,
                summary: {
                    redacted: true,
                    label: 'Signed local-network managed policy candidate',
                    scope,
                    revision
                },
                sensitive: true
            };
        }

        async function buildLocalNetworkCandidateBatchForTrustedLinks(policy, trustedLinks, options = {}) {
            const envelopes = await buildEnvelopeBatchForTrustedLinks(policy, trustedLinks);
            return envelopes.map((envelope, index) => buildLocalNetworkCandidateFromEnvelope(envelope, {
                ...safeObject(options),
                candidateId: normalizeString(safeObject(options).candidateId)
                    ? `${normalizeString(safeObject(options).candidateId)}-${index + 1}`
                    : ''
            }));
        }

        function buildLocalNetworkDeliveryRequest(candidates, options = {}) {
            const optionRoot = safeObject(options);
            const rows = safeArray(candidates).map(row => safeObject(row)).filter(row => normalizeString(row.candidateId));
            return {
                schema: MANAGED_LOCAL_NETWORK_DELIVERY_REQUEST_SCHEMA,
                version: 1,
                transport: 'local_network',
                reason: normalizeString(optionRoot.reason) || 'manual_send',
                requestedAt: normalizeNonNegativeInteger(optionRoot.requestedAt) || deps.now(),
                candidateCount: rows.length,
                targetProfileIds: Array.from(new Set(rows.map(row => normalizeString(row.targetProfileId)).filter(Boolean))),
                scopes: Array.from(new Set(rows.map(row => normalizeScope(row.scope)).filter(Boolean))),
                candidates: rows
            };
        }

        function getLocalNetworkDeliveryWriter(provider) {
            const root = safeObject(provider);
            return root.publishManagedPolicyCandidates || root.deliverManagedPolicyCandidates || root.publishLocalNetworkCandidates || root.putManagedPolicyCandidates || null;
        }

        function normalizeDeliveredCandidateIds(result, candidates, ok) {
            const root = safeObject(result);
            const candidateRows = safeArray(candidates);
            const explicit = safeArray(root.deliveredCandidateIds || root.acceptedCandidateIds || root.candidateIds)
                .map(item => normalizeString(item))
                .filter(Boolean);
            if (explicit.length > 0) return new Set(explicit);
            const count = Number(root.deliveredCandidateCount ?? root.acceptedCandidateCount ?? root.queuedCandidateCount);
            const deliveredCount = Number.isFinite(count)
                ? Math.max(0, Math.min(candidateRows.length, Math.floor(count)))
                : (ok ? candidateRows.length : 0);
            return new Set(candidateRows.slice(0, deliveredCount).map(row => normalizeString(row.candidateId)).filter(Boolean));
        }

        async function deliverLocalNetworkCandidates(candidates, provider, options = {}) {
            const rows = safeArray(candidates).map(row => safeObject(row)).filter(row => normalizeString(row.candidateId));
            const writer = getLocalNetworkDeliveryWriter(provider);
            const request = buildLocalNetworkDeliveryRequest(rows, options);
            const auth = await ensureProviderDeliveryAuthorized('local_network', options, request);
            if (!auth.ok) return { ok: false, reason: auth.reason, candidateCount: rows.length, deliveredCandidateCount: 0, failedCandidateCount: rows.length, markedSentCount: 0, request };
            if (!writer) {
                return {
                    ok: false,
                    reason: 'local_network_delivery_provider_unavailable',
                    candidateCount: rows.length,
                    deliveredCandidateCount: 0,
                    failedCandidateCount: rows.length,
                    markedSentCount: 0,
                    request
                };
            }

            try {
                const rawResult = safeObject(await writer.call(provider, request));
                const ok = rawResult.ok !== false;
                const deliveredIds = normalizeDeliveredCandidateIds(rawResult, rows, ok);
                let markedSentCount = 0;
                for (const row of rows) {
                    if (!deliveredIds.has(normalizeString(row.candidateId))) continue;
                    const marked = await markSent(row.linkId, row.scope, row.revision, row.policyHash, {
                        targetProfileId: row.targetProfileId,
                        targetProfileName: row.targetProfileName,
                        sourceProfileId: row.sourceProfileId,
                        sourceDeviceId: row.sourceDeviceId,
                        issuedAt: row.issuedAt,
                        delivery: 'local_network_provider'
                    });
                    if (marked) markedSentCount += 1;
                }
                const deliveredCandidateCount = deliveredIds.size;
                return {
                    ok,
                    reason: normalizeString(rawResult.reason),
                    candidateCount: rows.length,
                    deliveredCandidateCount,
                    failedCandidateCount: Math.max(0, rows.length - deliveredCandidateCount),
                    markedSentCount,
                    request
                };
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'local_network_delivery_provider_failed',
                    candidateCount: rows.length,
                    deliveredCandidateCount: 0,
                    failedCandidateCount: rows.length,
                    markedSentCount: 0,
                    request
                };
            }
        }

        async function deliverLocalNetworkPolicyBatch(policy, trustedLinks, provider, options = {}) {
            const auth = await ensureProviderDeliveryAuthorized('local_network', options, { policy, trustedLinkCount: safeArray(trustedLinks).length });
            if (!auth.ok) return { ok: false, reason: auth.reason, candidateCount: 0, deliveredCandidateCount: 0, failedCandidateCount: 0, markedSentCount: 0, request: null };
            const candidates = await buildLocalNetworkCandidateBatchForTrustedLinks(policy, trustedLinks, options);
            return deliverLocalNetworkCandidates(candidates, provider, { ...safeObject(options), providerDeliveryAuthorized: true });
        }

        async function buildMailboxStorageItemFromEnvelope(envelope, options = {}) {
            const root = safeObject(envelope);
            const optionRoot = safeObject(options);
            const adapter = deps.getAdapter();
            if (!adapter) throw new Error('Managed mailbox upload handoff requires the Nanah adapter.');
            const mailboxItemId = normalizeString(optionRoot.mailboxItemId);
            const mailboxWrappingKey = optionRoot.mailboxWrappingKey || optionRoot.wrappingKey;
            const itemOptions = {
                ...optionRoot,
                ...(mailboxWrappingKey ? { mailboxWrappingKey } : {}),
                ...(mailboxItemId ? { mailboxItemId } : {})
            };
            if (typeof adapter.sealManagedMailboxEnvelope === 'function' && (optionRoot.seal === true || mailboxWrappingKey)) {
                return adapter.sealManagedMailboxEnvelope(root, itemOptions);
            }
            if (typeof adapter.buildManagedMailboxStorageItem !== 'function') throw new Error('Managed mailbox upload handoff requires mailbox seal/build helpers.');
            const sealedPayload = safeObject(typeof optionRoot.sealedPayloadForEnvelope === 'function'
                ? await optionRoot.sealedPayloadForEnvelope(root, optionRoot.index || 0)
                : optionRoot.sealedPayload);
            return adapter.buildManagedMailboxStorageItem(root, sealedPayload, itemOptions);
        }

        async function buildMailboxStorageItemBatchForTrustedLinks(policy, trustedLinks, options = {}) {
            const envelopes = await buildEnvelopeBatchForTrustedLinks(policy, trustedLinks);
            const optionRoot = safeObject(options);
            const items = [];
            for (let index = 0; index < envelopes.length; index += 1) {
                const mailboxItemId = normalizeString(optionRoot.mailboxItemId) ? `${normalizeString(optionRoot.mailboxItemId)}-${index + 1}` : '';
                items.push(await buildMailboxStorageItemFromEnvelope(envelopes[index], { ...optionRoot, index, ...(mailboxItemId ? { mailboxItemId } : {}) }));
            }
            return items;
        }
        function buildMailboxUploadRequest(items, options = {}) {
            const optionRoot = safeObject(options);
            const rows = safeArray(items).map((row) => {
                const root = safeObject(row);
                const mailboxItemId = normalizeString(root.mailboxItemId);
                if (!mailboxItemId) return null;
                const clean = {
                    schema: normalizeString(root.schema) || 'filtertube_managed_mailbox_item',
                    version: normalizeNonNegativeInteger(root.version) || 1, mailboxItemId,
                    revision: normalizeNonNegativeInteger(root.revision), keyVersion: normalizeNonNegativeInteger(root.keyVersion) || 0,
                    createdAtMs: normalizeNonNegativeInteger(root.createdAtMs) || deps.now(),
                    expiresAtMs: root.expiresAtMs === null ? null : normalizeNonNegativeInteger(root.expiresAtMs),
                    ackState: normalizeString(root.ackState) || 'pending'
                };
                for (const field of ['linkId', 'targetProfileId', 'sourceDeviceId', 'sourceProfileId', 'policyHash', 'sourcePublicKeyId', 'cipherSuite', 'keyAgreementId', 'encryptedDek', 'nonce', 'ciphertext', 'ciphertextHash']) {
                    clean[field] = normalizeString(root[field]);
                }
                clean.scope = normalizeScope(root.scope);
                return clean;
            }).filter(Boolean);
            return {
                schema: MANAGED_MAILBOX_UPLOAD_REQUEST_SCHEMA,
                version: 1,
                transport: 'encrypted_mailbox',
                reason: normalizeString(optionRoot.reason) || 'manual_send',
                requestedAt: normalizeNonNegativeInteger(optionRoot.requestedAt) || deps.now(),
                mailboxItemCount: rows.length,
                targetProfileIds: Array.from(new Set(rows.map(row => normalizeString(row.targetProfileId)).filter(Boolean))),
                scopes: Array.from(new Set(rows.map(row => normalizeScope(row.scope)).filter(Boolean))),
                items: rows
            };
        }

        function getMailboxUploadWriter(provider) {
            const root = safeObject(provider);
            return root.uploadManagedMailboxItems || root.publishManagedMailboxItems || root.putManagedMailboxItems || root.enqueueManagedMailboxItems || null;
        }

        function normalizeUploadedMailboxItemIds(result, items, ok) {
            const root = safeObject(result);
            const itemRows = safeArray(items);
            const explicit = safeArray(root.uploadedMailboxItemIds || root.acceptedMailboxItemIds || root.mailboxItemIds)
                .map(item => normalizeString(item))
                .filter(Boolean);
            if (explicit.length > 0) return new Set(explicit);
            const count = Number(root.uploadedMailboxItemCount ?? root.acceptedMailboxItemCount ?? root.queuedMailboxItemCount);
            const uploadedCount = Number.isFinite(count)
                ? Math.max(0, Math.min(itemRows.length, Math.floor(count)))
                : (ok ? itemRows.length : 0);
            return new Set(itemRows.slice(0, uploadedCount).map(row => normalizeString(row.mailboxItemId)).filter(Boolean));
        }

        async function uploadMailboxItems(items, provider, options = {}) {
            const rows = safeArray(items).map(row => safeObject(row)).filter(row => normalizeString(row.mailboxItemId));
            const writer = getMailboxUploadWriter(provider);
            const request = buildMailboxUploadRequest(rows, options);
            const auth = await ensureProviderDeliveryAuthorized('encrypted_mailbox', options, request);
            if (!auth.ok) return { ok: false, reason: auth.reason, mailboxItemCount: rows.length, uploadedMailboxItemCount: 0, failedMailboxItemCount: rows.length, markedSentCount: 0, request };
            if (!writer) {
                return {
                    ok: false,
                    reason: 'mailbox_upload_provider_unavailable',
                    mailboxItemCount: rows.length,
                    uploadedMailboxItemCount: 0,
                    failedMailboxItemCount: rows.length,
                    markedSentCount: 0,
                    request
                };
            }

            try {
                const rawResult = safeObject(await writer.call(provider, request));
                const ok = rawResult.ok !== false;
                const uploadedIds = normalizeUploadedMailboxItemIds(rawResult, rows, ok);
                let markedSentCount = 0;
                for (const row of rows) {
                    if (!uploadedIds.has(normalizeString(row.mailboxItemId))) continue;
                    const marked = await markSent(row.linkId, row.scope, row.revision, row.policyHash, {
                        targetProfileId: row.targetProfileId,
                        sourceProfileId: row.sourceProfileId,
                        sourceDeviceId: row.sourceDeviceId,
                        issuedAt: row.createdAtMs,
                        delivery: 'encrypted_mailbox_provider'
                    });
                    if (marked) markedSentCount += 1;
                }
                const uploadedMailboxItemCount = uploadedIds.size;
                return {
                    ok,
                    reason: normalizeString(rawResult.reason),
                    mailboxItemCount: rows.length,
                    uploadedMailboxItemCount,
                    failedMailboxItemCount: Math.max(0, rows.length - uploadedMailboxItemCount),
                    markedSentCount,
                    request
                };
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'mailbox_upload_provider_failed',
                    mailboxItemCount: rows.length,
                    uploadedMailboxItemCount: 0,
                    failedMailboxItemCount: rows.length,
                    markedSentCount: 0,
                    request
                };
            }
        }

        async function uploadMailboxPolicyBatch(policy, trustedLinks, provider, options = {}) {
            const auth = await ensureProviderDeliveryAuthorized('encrypted_mailbox', options, { policy, trustedLinkCount: safeArray(trustedLinks).length });
            if (!auth.ok) return { ok: false, reason: auth.reason, mailboxItemCount: 0, uploadedMailboxItemCount: 0, failedMailboxItemCount: 0, markedSentCount: 0, request: null };
            const items = await buildMailboxStorageItemBatchForTrustedLinks(policy, trustedLinks, options);
            return uploadMailboxItems(items, provider, { ...safeObject(options), providerDeliveryAuthorized: true });
        }

        function resolveTrustedLinkProviderScopes(trustedLink) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const policy = safeObject(trusted?.policy);
            const allowedScopes = deps.getAllowedScopeList(policy.allowedScopes || policy.defaultScope)
                .map(scope => normalizeScope(scope))
                .filter(Boolean);
            const outgoingScopes = Object.keys(safeObject(policy.outgoingManagedPolicies))
                .map(scope => normalizeScope(scope))
                .filter(Boolean);
            return Array.from(new Set([...allowedScopes, ...outgoingScopes]));
        }

        function buildMailboxPurgeRequestForTrustedLink(trustedLink, options = {}) {
            const trusted = deps.normalizeTrustedLink(trustedLink);
            const optionRoot = safeObject(options);
            if (!trusted || trusted.linkType !== 'managed_link') {
                throw new Error('Mailbox purge requests require a saved managed link.');
            }
            if (trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') {
                throw new Error('Mailbox purge requests require Source -> Replica roles.');
            }
            const linkId = normalizeString(trusted.linkId || trusted.id);
            if (!linkId) {
                throw new Error('Mailbox purge requests require a trusted link id.');
            }

            const policy = safeObject(trusted.policy);
            const localContext = deps.getLocalProfileContext();
            const requestedAt = normalizeNonNegativeInteger(optionRoot.requestedAt) || deps.now();
            return {
                schema: MANAGED_MAILBOX_PURGE_REQUEST_SCHEMA,
                version: 1,
                transport: 'encrypted_mailbox',
                reason: normalizeString(optionRoot.reason) || 'trusted_link_removed',
                requestedAt,
                linkId,
                remoteDeviceId: normalizeString(trusted.remoteDeviceId),
                sourceDeviceId: normalizeString(trusted.sourceDeviceId || policy.sourceDeviceId) || normalizeString(deps.getStableDeviceId()),
                sourceProfileId: normalizeString(trusted.sourceProfileId || policy.sourceProfileId) || normalizeString(localContext.profileId),
                targetProfileId: normalizeString(policy.targetProfileId),
                targetProfileName: normalizeString(policy.targetProfileName),
                scopes: resolveTrustedLinkProviderScopes(trusted),
                purgeStates: ['pending'],
                revokedAt: normalizeNonNegativeInteger(optionRoot.revokedAt) || requestedAt
            };
        }

        function getMailboxPurgeWriter(provider) {
            const root = safeObject(provider);
            return root.purgeManagedMailboxItems
                || root.deleteManagedMailboxItems
                || root.revokeManagedMailboxItems
                || root.markManagedMailboxItemsRevoked
                || null;
        }

        function normalizePurgedMailboxItemCount(result, ok) {
            const root = safeObject(result);
            const count = Number(root.purgedMailboxItemCount ?? root.deletedMailboxItemCount ?? root.revokedMailboxItemCount ?? root.mailboxItemCount);
            return Number.isFinite(count)
                ? Math.max(0, Math.floor(count))
                : (ok ? 0 : 0);
        }

        async function purgeMailboxItemsForTrustedLink(trustedLink, provider, options = {}) {
            let request = null;
            try {
                request = buildMailboxPurgeRequestForTrustedLink(trustedLink, options);
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'mailbox_purge_request_invalid',
                    purgedMailboxItemCount: 0,
                    request: null
                };
            }
            const auth = await ensureProviderDeliveryAuthorized('encrypted_mailbox_purge', options, request);
            if (!auth.ok) {
                return {
                    ok: false,
                    reason: auth.reason,
                    purgedMailboxItemCount: 0,
                    request
                };
            }

            const writer = getMailboxPurgeWriter(provider);
            if (!writer) {
                return {
                    ok: false,
                    reason: 'mailbox_purge_provider_unavailable',
                    purgedMailboxItemCount: 0,
                    request
                };
            }

            try {
                const rawResult = safeObject(await writer.call(provider, request));
                const ok = rawResult.ok !== false;
                return {
                    ok,
                    reason: normalizeString(rawResult.reason),
                    purgedMailboxItemCount: normalizePurgedMailboxItemCount(rawResult, ok),
                    request
                };
            } catch (error) {
                return {
                    ok: false,
                    reason: normalizeString(error?.message) || 'mailbox_purge_provider_failed',
                    purgedMailboxItemCount: 0,
                    request
                };
            }
        }

        function normalizeAckState(value) {
            const normalized = normalizeString(value).toLowerCase();
            if (normalized === 'accepted' || normalized === 'applied') return 'delivered';
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

        function resolveAckTransport(ackPayload) {
            const root = safeObject(ackPayload);
            const schema = normalizeString(root.schema);
            const explicit = normalizeString(root.transport).toLowerCase();
            if (schema === MANAGED_MAILBOX_ACK_SCHEMA || explicit === 'mailbox') return 'mailbox';
            if (schema === MANAGED_LOCAL_NETWORK_ACK_SCHEMA || explicit === 'local_network') return 'local_network';
            return 'live_nanah_session';
        }

        function ackActionTypeForTransport(transport) {
            if (transport === 'mailbox') return 'remote_policy.mailbox.ack';
            if (transport === 'local_network') return 'remote_policy.local_network.ack';
            return 'remote_policy.live_ack';
        }

        function ackHistorySchemaForTransport(transport) {
            return transport === 'live_nanah_session'
                ? MANAGED_LIVE_ACK_HISTORY_SCHEMA
                : MANAGED_REMOTE_DELIVERY_ACK_HISTORY_SCHEMA;
        }

        function ackLabelForTransport(transport, result) {
            if (transport === 'mailbox') {
                return result === 'accepted' ? 'Mailbox policy delivered' : 'Mailbox policy delivery failed';
            }
            if (transport === 'local_network') {
                return result === 'accepted' ? 'Local-network policy delivered' : 'Local-network policy delivery failed';
            }
            return result === 'accepted' ? 'Replica applied managed policy' : 'Replica rejected managed policy';
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
            const transport = resolveAckTransport(root);
            const rowTransport = transport.replace(/[^a-z0-9]+/g, '-');
            const mailboxItemId = normalizeString(record.mailboxItemId);
            const localNetworkCandidateId = normalizeString(record.localNetworkCandidateId || record.candidateId);
            return {
                rowId: `managed-${rowTransport}-ack-${normalizeString(trusted?.linkId)}-${scope}-${revision || 'none'}-${receivedAt}`,
                schema: ackHistorySchemaForTransport(transport),
                version: 1,
                trustedLinkId: normalizeString(trusted?.linkId),
                actionType: ackActionTypeForTransport(transport),
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
                    label: ackLabelForTransport(transport, result),
                    transport,
                    mailboxItemId: mailboxItemId || null,
                    localNetworkCandidateId: localNetworkCandidateId || null
                },
                sensitive: true
            };
        }

        function isInboundAckHistoryRow(row) {
            const schema = normalizeString(safeObject(row).schema);
            return schema === MANAGED_LIVE_ACK_HISTORY_SCHEMA || schema === MANAGED_REMOTE_DELIVERY_ACK_HISTORY_SCHEMA;
        }

        async function recordInboundAckPayload(ackPayload, allowedSchemas) {
            const root = safeObject(ackPayload);
            const schema = normalizeString(root.schema);
            if (!allowedSchemas.includes(schema)) return { ok: false, reason: 'wrong_ack_schema', recordedCount: 0 };
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
                    .filter(isInboundAckHistoryRow)
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

        async function recordLiveAckPayload(ackPayload) {
            return recordInboundAckPayload(ackPayload, [MANAGED_LIVE_ACK_SCHEMA]);
        }

        async function recordRemoteDeliveryAckPayload(ackPayload) {
            return recordInboundAckPayload(ackPayload, [MANAGED_MAILBOX_ACK_SCHEMA, MANAGED_LOCAL_NETWORK_ACK_SCHEMA]);
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
            resolveConcreteSendScopes,
            buildPayload,
            buildEnvelopeForLiveSend,
            buildEnvelopeBatchForLiveSend,
            buildEnvelopeBatchForTrustedLinks,
            buildLocalNetworkCandidateFromEnvelope,
            buildLocalNetworkCandidateBatchForTrustedLinks,
            buildLocalNetworkDeliveryRequest,
            deliverLocalNetworkCandidates,
            deliverLocalNetworkPolicyBatch,
            buildMailboxStorageItemFromEnvelope,
            buildMailboxStorageItemBatchForTrustedLinks,
            buildMailboxUploadRequest,
            uploadMailboxItems,
            uploadMailboxPolicyBatch,
            buildMailboxPurgeRequestForTrustedLink,
            purgeMailboxItemsForTrustedLink,
            buildOutboundHistoryRow,
            buildLiveAckPayload,
            recordLiveAckPayload,
            recordRemoteDeliveryAckPayload,
            markSent
        };
    }

    global.FilterTubeNanahManagedLivePolicy = { create };
})(window);
