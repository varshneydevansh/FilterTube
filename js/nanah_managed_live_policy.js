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

    function create(deps = {}) {
        const normalizeString = deps.normalizeString;
        const safeObject = deps.safeObject;
        const normalizeNonNegativeInteger = deps.normalizeNonNegativeInteger;

        function normalizeScope(scope) {
            const normalized = normalizeString(scope).toLowerCase();
            return MANAGED_LIVE_POLICY_SCOPES.includes(normalized) ? normalized : '';
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

        async function markSent(linkId, scope, revision, policyHash) {
            const normalizedLinkId = normalizeString(linkId);
            const normalizedScope = normalizeScope(scope);
            if (!normalizedLinkId || !normalizedScope || !Number.isInteger(revision) || !normalizeString(policyHash)) return false;
            const trusted = deps.normalizeTrustedLink(deps.findTrustedLinkById(normalizedLinkId));
            if (!trusted) return false;
            const outgoing = safeObject(safeObject(trusted.policy).outgoingManagedPolicies);
            return deps.updateTrustedLinkPolicy(normalizedLinkId, {
                policy: {
                    outgoingManagedPolicies: {
                        ...outgoing,
                        [normalizedScope]: {
                            revision,
                            policyHash,
                            sentAt: deps.now()
                        }
                    }
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
            markSent
        };
    }

    global.FilterTubeNanahManagedLivePolicy = { create };
})(window);
