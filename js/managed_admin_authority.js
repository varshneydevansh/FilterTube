(function (global) {
    'use strict';

    const MANAGED_ADMIN_AUTHORITY_SCHEMA = 'filtertube_managed_admin_authority';
    const MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA = 'filtertube_managed_admin_failed_unlock_rate_limit';
    const SESSION_TTL_MS = 15 * 60 * 1000;
    const SENSITIVE_REAUTH_TTL_MS = 5 * 60 * 1000;
    const FAILED_UNLOCK_LIMIT = 5;
    const FAILED_UNLOCK_WINDOW_MS = 10 * 60 * 1000;

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeProfileId(value, fallback = '') {
        return normalizeString(value) || fallback;
    }

    function getProfiles(profilesV4) {
        return safeObject(safeObject(profilesV4).profiles);
    }

    function getProfile(profilesV4, profileId) {
        return safeObject(getProfiles(profilesV4)[normalizeString(profileId)]);
    }

    function getProfileType(profilesV4, profileId) {
        const id = normalizeString(profileId);
        if (id === 'default') return 'account';
        const profile = getProfile(profilesV4, id);
        const rawType = normalizeString(profile.type).toLowerCase();
        if (rawType === 'account' || rawType === 'child') return rawType;
        return normalizeString(profile.parentProfileId) ? 'child' : 'account';
    }

    function getParentProfileId(profilesV4, profileId) {
        return normalizeString(getProfile(profilesV4, profileId).parentProfileId);
    }

    function resolveActorProfileId(profilesV4, actorProfileId) {
        return normalizeProfileId(actorProfileId, normalizeProfileId(safeObject(profilesV4).activeProfileId, 'default'));
    }

    function canActorManageProfile(profilesV4, options = {}) {
        const targetId = normalizeString(options.targetProfileId);
        const actorId = resolveActorProfileId(profilesV4, options.actorProfileId);
        if (!targetId) {
            return { allowed: false, reason: 'missing_target_profile', actorProfileId: actorId, targetProfileId: targetId };
        }
        if (!actorId) {
            return { allowed: false, reason: 'missing_actor_profile', actorProfileId: actorId, targetProfileId: targetId };
        }
        if (getProfileType(profilesV4, actorId) === 'child') {
            return { allowed: false, reason: 'child_actor_not_admin', actorProfileId: actorId, targetProfileId: targetId };
        }
        if (actorId === 'default') {
            return { allowed: true, decision: 'default_admin', actorProfileId: actorId, targetProfileId: targetId };
        }
        if (actorId === targetId) {
            return { allowed: true, decision: 'self_account_admin', actorProfileId: actorId, targetProfileId: targetId };
        }
        if (getParentProfileId(profilesV4, targetId) === actorId) {
            return { allowed: true, decision: 'parent_profile_admin', actorProfileId: actorId, targetProfileId: targetId };
        }
        return { allowed: false, reason: 'actor_not_target_parent', actorProfileId: actorId, targetProfileId: targetId };
    }

    function checkAdminUnlockSession(session, options = {}) {
        const profileId = normalizeString(options.profileId);
        const rawSession = safeObject(session);
        const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
        const hasUnlockedProfile = options.hasUnlockedProfile === true;
        const expiresAt = Number(rawSession.expiresAt);
        const reauthAt = Number(rawSession.reauthAt);
        const sensitiveAction = options.sensitiveAction === true;

        if (!profileId) return { valid: false, reason: 'missing_profile' };
        if (!hasUnlockedProfile) return { valid: false, reason: 'profile_not_unlocked' };
        if (!Number.isFinite(expiresAt) || now >= expiresAt) return { valid: false, reason: 'session_expired' };
        if (sensitiveAction && (!Number.isFinite(reauthAt) || now >= reauthAt)) {
            return { valid: false, reason: 'sensitive_reauth_required' };
        }
        return { valid: true, decision: 'admin_session_valid' };
    }

    function createAdminUnlockSession(now = Date.now()) {
        const issuedAt = Number.isFinite(Number(now)) ? Number(now) : Date.now();
        return {
            schema: MANAGED_ADMIN_AUTHORITY_SCHEMA,
            version: 1,
            unlockedAt: issuedAt,
            expiresAt: issuedAt + SESSION_TTL_MS,
            reauthAt: issuedAt + SENSITIVE_REAUTH_TTL_MS
        };
    }

    function normalizeFailedUnlockState(value, now = Date.now()) {
        const raw = safeObject(value);
        const ts = Number.isFinite(Number(now)) ? Number(now) : Date.now();
        const resetAt = Number(raw.resetAt);
        const failedAttempts = Number(raw.failedAttempts);
        if (
            raw.schema !== MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA
            || !Number.isFinite(resetAt)
            || ts >= resetAt
        ) {
            return {
                schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
                version: 1,
                failedAttempts: 0,
                resetAt: ts + FAILED_UNLOCK_WINDOW_MS,
                updatedAt: ts
            };
        }
        return {
            schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
            version: 1,
            failedAttempts: Number.isFinite(failedAttempts) && failedAttempts > 0 ? Math.floor(failedAttempts) : 0,
            resetAt,
            updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : ts
        };
    }

    function nextFailedUnlockState(value, now = Date.now()) {
        const current = normalizeFailedUnlockState(value, now);
        const failedAttempts = current.failedAttempts + 1;
        return {
            ...current,
            failedAttempts,
            updatedAt: Number.isFinite(Number(now)) ? Number(now) : Date.now(),
            rateLimited: failedAttempts >= FAILED_UNLOCK_LIMIT
        };
    }

    global.FilterTubeManagedAdminAuthority = {
        constants: Object.freeze({
            MANAGED_ADMIN_AUTHORITY_SCHEMA,
            MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
            SESSION_TTL_MS,
            SENSITIVE_REAUTH_TTL_MS,
            FAILED_UNLOCK_LIMIT,
            FAILED_UNLOCK_WINDOW_MS
        }),
        getProfileType,
        getParentProfileId,
        resolveActorProfileId,
        canActorManageProfile,
        checkAdminUnlockSession,
        createAdminUnlockSession,
        normalizeFailedUnlockState,
        nextFailedUnlockState
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
