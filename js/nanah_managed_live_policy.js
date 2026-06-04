(function initNanahManagedLivePolicy(global) {
    'use strict';

    function create(deps = {}) {
        const normalizeString = deps.normalizeString;
        const safeObject = deps.safeObject;
        const normalizeNonNegativeInteger = deps.normalizeNonNegativeInteger;

        function normalizeScope(scope) {
            const normalized = normalizeString(scope).toLowerCase();
            return normalized === 'main' || normalized === 'kids' ? normalized : '';
        }

        function buildPayload(scope) {
            const normalizedScope = normalizeScope(scope);
            if (!normalizedScope) {
                throw new Error('Signed managed sends currently require Main or Kids scope.');
            }
            const profilesRoot = safeObject(deps.getProfilesRoot());
            const profileId = normalizeString(deps.getLocalProfileContext().profileId) || 'default';
            const profile = safeObject(safeObject(profilesRoot.profiles)[profileId]);
            if (!profile || Object.keys(profile).length === 0) {
                throw new Error('Active profile is unavailable for managed policy send.');
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

        async function buildEnvelopeForLiveSend(policy) {
            const adapter = deps.getAdapter();
            if (typeof adapter.signManagedPolicyEnvelope !== 'function') {
                throw new Error('Managed policy signing is unavailable');
            }

            const trustedLink = deps.normalizeTrustedLink(deps.getCurrentTrustedLink());
            if (!trustedLink || trustedLink.linkType !== 'managed_link') {
                throw new Error('Signed managed sends require a saved managed link.');
            }
            if (trustedLink.localRole !== 'source' || trustedLink.remoteRole !== 'replica') {
                throw new Error('Signed managed sends require Source -> Replica roles.');
            }

            const scope = normalizeScope(policy.scope);
            if (!scope) {
                throw new Error('Signed managed sends currently support Main or Kids scope. Use a proposal for other scopes.');
            }
            const allowedScopes = deps.getAllowedScopeList(safeObject(trustedLink.policy).allowedScopes || safeObject(trustedLink.policy).defaultScope);
            if (!allowedScopes.includes(scope)) {
                throw new Error(`This managed link does not allow signed ${deps.getScopeLabel(scope)} policy sends.`);
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
            const payload = buildPayload(scope);
            const policyHash = buildPolicyHash({
                linkId: trustedLink.linkId,
                scope,
                targetProfileId: targetProfile.profileId,
                sourceProfileId: sourceProfile.profileId,
                sourceDeviceId: normalizeString(deps.getStableDeviceId()),
                payload
            });
            const prior = getOutgoingPolicyState(trustedLink, scope);
            const revision = prior?.policyHash === policyHash
                ? prior.revision
                : Math.max(0, prior?.revision || 0) + 1;

            return adapter.signManagedPolicyEnvelope({
                type: 'filtertube_managed_policy',
                linkId: normalizeString(trustedLink.linkId),
                scope,
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
            buildPayload,
            buildEnvelopeForLiveSend,
            markSent
        };
    }

    global.FilterTubeNanahManagedLivePolicy = { create };
})(window);
