(function (global) {
    'use strict';

    const SCHEMA = 'filtertube_managed_auto_sync_grant';
    const SCOPES = ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'];
    const FIELDS = ['linkId', 'sourceDeviceId', 'sourceProfileId', 'localPolicyProfileId',
        'targetDeviceId', 'targetProfileId', 'sourcePublicKeyId', 'securityFingerprint', 'policyFingerprint'];
    const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const id = value => typeof value === 'string' && value.length > 0 && value.length <= 1024
        && value.trim() === value ? value : '';
    const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

    function stable(value) {
        if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
        if (value && typeof value === 'object') {
            return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
        }
        return JSON.stringify(value === undefined ? null : value);
    }

    function normalizeScopes(value) {
        const values = Array.isArray(value) ? value : [value];
        const result = [];
        for (const scope of values) {
            const expanded = scope === 'active' || scope === 'full'
                ? ['main', 'kids', 'viewing_space', 'time_limits']
                : scope === 'rules_bundle' ? ['keywords', 'channels', 'videos'] : [scope];
            if (expanded.some(item => !SCOPES.includes(item))) return [];
            result.push(...expanded);
        }
        return [...new Set(result)].sort();
    }

    function type(profile, profileId) {
        if (profileId === 'default') return 'account';
        if (profile.type === 'child' || profile.type === 'account') return profile.type;
        return id(profile.parentProfileId) ? 'child' : 'account';
    }

    // This is a private comparison token, not a public device identifier or
    // credential. Never include it in envelopes, exports, telemetry or UI copy.
    function securityFingerprint(profilesV4, actorId, localPolicyProfileId) {
        const profiles = object(object(profilesV4).profiles);
        const actor = object(profiles[actorId]);
        const child = object(profiles[localPolicyProfileId]);
        const ownerId = id(child.parentProfileId);
        const owner = object(profiles[ownerId]);
        return stable({
            actorId, actorType: type(actor, actorId), actorSecurity: object(actor.security),
            actorPinVerifier: actor.pinVerifier || null,
            localPolicyProfileId, childType: type(child, localPolicyProfileId),
            childSecurity: object(child.security), childPinVerifier: child.pinVerifier || null,
            ownerId, ownerType: type(owner, ownerId), ownerSecurity: object(owner.security), ownerPinVerifier: owner.pinVerifier || null
        });
    }

    function bindingFor(value, context = {}) {
        const link = object(value);
        const policy = object(link.policy);
        const root = object(context.profilesV4);
        const profiles = object(root.profiles);
        const fail = reason => ({ ok: false, reason, binding: null });
        if (link.linkType !== 'managed_link' || link.localRole !== 'source' || link.remoteRole !== 'replica') {
            return fail('wrong_link_roles');
        }
        if (link.revoked === true || policy.revoked === true) return fail('link_revoked');
        if (link.keyRevoked === true || policy.keyRevoked === true) return fail('key_revoked');
        if (link.stalePairing === true || policy.stalePairing === true) return fail('stale_pairing');
        if (link.quarantined === true || policy.quarantined === true) return fail('trusted_link_quarantined');
        const field = name => {
            const top = id(link[name]);
            const nested = id(policy[name]);
            if ((has(link, name) && link[name] != null && !top)
                || (has(policy, name) && policy[name] != null && !nested)
                || (top && nested && top !== nested)) return '';
            return top || nested;
        };
        const binding = {
            linkId: id(link.linkId), sourceDeviceId: field('sourceDeviceId'),
            sourceProfileId: field('sourceProfileId'), localPolicyProfileId: id(link.localPolicyProfileId),
            targetDeviceId: field('targetDeviceId') || id(link.remoteDeviceId),
            targetProfileId: field('targetProfileId'), sourcePublicKeyId: field('sourcePublicKeyId'),
            keyVersion: link.keyVersion == null ? policy.keyVersion : link.keyVersion,
            allowedScopes: normalizeScopes(policy.allowedScopes)
        };
        if (['linkId', 'sourceDeviceId', 'sourceProfileId', 'localPolicyProfileId', 'targetDeviceId',
            'targetProfileId', 'sourcePublicKeyId'].some(name => !binding[name])) return fail('missing_link_binding');
        if ((id(link.remoteDeviceId) && id(link.remoteDeviceId) !== binding.targetDeviceId)
            || ((has(link, 'targetDeviceId') || has(policy, 'targetDeviceId')) && !field('targetDeviceId'))) return fail('target_device_mismatch');
        if (policy.localPolicyProfileId != null && policy.localPolicyProfileId !== binding.localPolicyProfileId) {
            return fail('local_policy_profile_mismatch');
        }
        if (policy.targetProfileBehavior !== 'fixed_profile'
            || (link.targetProfileBehavior && link.targetProfileBehavior !== 'fixed_profile')) return fail('fixed_target_required');
        if (policy.targetProfileType && policy.targetProfileType !== 'child') return fail('child_target_required');
        if (!Number.isSafeInteger(binding.keyVersion) || binding.keyVersion <= 0
            || (link.keyVersion != null && policy.keyVersion != null && link.keyVersion !== policy.keyVersion)) {
            return fail('invalid_key_version');
        }
        if (binding.allowedScopes.length === 0) return fail('scope_not_allowed');
        if (id(context.sourceDeviceId) !== binding.sourceDeviceId) return fail('source_device_mismatch');
        if (id(root.activeProfileId) !== binding.sourceProfileId
            || (context.actorProfileId != null && id(context.actorProfileId) !== binding.sourceProfileId)) {
            return fail('source_actor_changed');
        }
        const actor = object(profiles[binding.sourceProfileId]);
        const child = object(profiles[binding.localPolicyProfileId]);
        if (!has(profiles, binding.sourceProfileId) || !has(profiles, binding.localPolicyProfileId)) return fail('profile_missing');
        if (type(actor, binding.sourceProfileId) !== 'account') return fail('child_actor_not_admin');
        if (type(child, binding.localPolicyProfileId) !== 'child') return fail('local_child_required');
        const ownerId = id(child.parentProfileId);
        if (!ownerId || !has(profiles, ownerId) || type(object(profiles[ownerId]), ownerId) !== 'account') return fail('owner_missing');
        if (binding.sourceProfileId !== 'default' && ownerId !== binding.sourceProfileId) return fail('actor_not_target_parent');
        binding.securityFingerprint = securityFingerprint(root, binding.sourceProfileId, binding.localPolicyProfileId);
        binding.policyFingerprint = stable({
            allowedScopes: binding.allowedScopes,
            targetProfileBehavior: policy.targetProfileBehavior,
            applyMode: policy.applyMode,
            autoApplyControlProposals: policy.autoApplyControlProposals,
            reconnectMode: policy.reconnectMode,
            lockedChildMode: policy.lockedChildMode,
            syncOnProfileOpen: policy.syncOnProfileOpen,
            sourcePublicKeyJwk: object(link.sourcePublicKeyJwk || policy.sourcePublicKeyJwk)
        });
        return { ok: true, reason: '', binding };
    }

    function normalizeGrant(value) {
        const grant = object(value);
        const binding = object(grant.binding);
        if (grant.schema !== SCHEMA || grant.version !== 1 || grant.enabled !== true
            || FIELDS.some(name => typeof binding[name] !== 'string' || !binding[name])
            || !Number.isSafeInteger(binding.keyVersion) || binding.keyVersion <= 0) return null;
        const scopes = normalizeScopes(binding.allowedScopes);
        if (scopes.length === 0) return null;
        const normalized = Object.fromEntries(FIELDS.map(name => [name, binding[name]]));
        normalized.keyVersion = binding.keyVersion;
        normalized.allowedScopes = scopes;
        return { schema: SCHEMA, version: 1, enabled: true, binding: normalized };
    }

    function eligible(snapshot, value) {
        const grant = normalizeGrant(value);
        if (!grant) return { ok: false, reason: 'auto_sync_not_enrolled', binding: null, scopes: [] };
        const current = bindingFor(object(snapshot).link, snapshot);
        if (!current.ok) return { ...current, scopes: [] };
        if (stable(current.binding) !== stable(grant.binding)) {
            return { ok: false, reason: 'auto_sync_binding_changed', binding: null, scopes: [] };
        }
        return { ok: true, reason: '', binding: current.binding, scopes: [...current.binding.allowedScopes] };
    }

    global.FilterTubeManagedAutoSync = { SCHEMA, bindingFor, normalizeGrant, eligible, normalizeScopes, securityFingerprint };
})(typeof globalThis !== 'undefined' ? globalThis : window);
