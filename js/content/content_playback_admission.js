/* ISOLATED-world admission leases for an owned player. This does not evaluate
 * rules or accept page messages: readSnapshot must supply existing authorities. */
(function(root) {
    const LEASE_MS = 1000;

    function create({ readSnapshot, now = Date.now, onInvalidate } = {}) {
        if (typeof readSnapshot !== 'function' || typeof now !== 'function') {
            throw new TypeError('Content playback requires a trusted snapshot reader and clock');
        }
        let active = null;
        let reason = 'not_issued';
        let notifying = false;

        function readTime() {
            try { return now(); } catch (_) { return NaN; }
        }

        function invalidate(nextReason = 'invalidated') {
            active = null;
            reason = String(nextReason || 'invalidated');
            if (!notifying && typeof onInvalidate === 'function') {
                notifying = true;
                try { onInvalidate(reason); } catch (_) {} finally { notifying = false; }
            }
            return false;
        }

        function readAuthority(at) {
            if (!Number.isFinite(at)) return { reason: 'unknown_clock' };
            let snapshot;
            try { snapshot = readSnapshot(); } catch (_) { return { reason: 'snapshot_unavailable' }; }
            const settings = snapshot?.settings;
            if (!settings || typeof settings !== 'object') return { reason: 'settings_unavailable' };
            if (settings.enabled !== true || settings.hideSponsoredCards !== true) return { reason: 'disabled' };
            const videoId = snapshot.videoId;
            if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return { reason: 'unknown_video' };
            const profileId = settings.activeProfileId;
            const profileKind = settings.activeProfileKind;
            const profileType = settings.profileType;
            if (typeof profileId !== 'string' || !profileId.trim()
                || !['account', 'child'].includes(profileKind) || !['main', 'kids'].includes(profileType)) {
                return { reason: 'unknown_profile' };
            }
            if (snapshot.managedDenied !== false) return { reason: 'managed_route_denied_or_unknown' };
            if (snapshot.nativeCovered !== false) return { reason: 'native_owned_or_unknown' };
            const direct = snapshot.directState;
            if (!direct || direct.videoId !== videoId || direct.latestSettings !== settings
                || direct.routeTransitionPending !== false || direct.decision !== 'allowed'
                || direct.pausedByGuard === true || Number(direct.pendingStartedAt || 0) > 0) {
                return { reason: 'video_not_admitted' };
            }
            const category = snapshot.categoryState;
            const needsCategory = settings.categoryFilters?.enabled === true || settings.languageFilters?.enabled === true;
            if (category) {
                if (category.videoId !== videoId || !['allowed', 'inactive'].includes(category.decision)
                    || (needsCategory && category.decision !== 'allowed')
                    || category.pausedByGuard === true || Number(category.pendingStartedAt || 0) > 0) {
                    return { reason: 'category_not_admitted' };
                }
            } else if (needsCategory) {
                return { reason: 'category_unknown' };
            }
            let deadline = at + LEASE_MS;
            const policy = settings.managedTimeLimitPolicy;
            const time = snapshot.managedTimeState;
            if (policy != null && (typeof policy !== 'object' || Array.isArray(policy)
                || policy.schema !== 'filtertube_managed_time_limit' || policy.version !== 1
                || (policy.enabled !== true && policy.enabled !== false))) return { reason: 'invalid_time_policy' };
            if (policy?.enabled === true) {
                if (!time || time.decision !== 'allowed' || time.profileId !== profileId
                    || policy.profileId !== profileId || time.policyRevision !== policy.policyRevision
                    || time.policyHash !== policy.policyHash || !Number.isSafeInteger(policy.policyRevision)
                    || policy.policyRevision < 0 || typeof policy.policyHash !== 'string' || !policy.policyHash
                    || !Number.isFinite(time.expiresAt) || time.expiresAt <= at) {
                    return { reason: 'time_not_admitted' };
                }
                if ((policy.validFrom != null && (!Number.isFinite(policy.validFrom) || at < policy.validFrom))
                    || (policy.validUntil != null && (!Number.isFinite(policy.validUntil) || at >= policy.validUntil))) {
                    return { reason: 'time_policy_outside_window' };
                }
                deadline = Math.min(deadline, time.expiresAt, policy.validUntil ?? Infinity);
            } else if (time) {
                if (time.decision !== 'inactive' || time.profileId !== profileId) return { reason: 'time_not_inactive' };
            } else if (profileKind === 'child') {
                return { reason: 'child_time_unknown' };
            }
            return { settings, videoId, profileId, profileKind, profileType,
                routeEpoch: snapshot.routeEpoch, settingsEpoch: snapshot.settingsEpoch, deadline,
                timePolicyKey: policy?.enabled === true
                    ? JSON.stringify([policy.policyRevision, policy.policyHash, policy.validFrom ?? null, policy.validUntil ?? null])
                    : 'inactive' };
        }

        function inspect(at) {
            try { return readAuthority(at); } catch (_) { return { reason: 'snapshot_unavailable' }; }
        }

        function issue() {
            const at = readTime();
            const current = inspect(at);
            if (current.reason) { invalidate(current.reason); return null; }
            const record = { ...current, issuedAt: at, expiresAt: current.deadline };
            const token = Object.freeze({ get expiresAt() { return record.expiresAt; } });
            record.token = token;
            active = record;
            reason = 'allowed';
            return token;
        }

        function check(lease, extend) {
            if (!active || lease !== active.token) return false;
            const at = readTime();
            if (!Number.isFinite(at) || at < active.issuedAt || at >= active.expiresAt) return invalidate('lease_expired');
            const current = inspect(at);
            if (current.reason) return invalidate(current.reason);
            if (current.settings !== active.settings || current.videoId !== active.videoId
                || current.profileId !== active.profileId || current.profileKind !== active.profileKind
                || current.profileType !== active.profileType || current.routeEpoch !== active.routeEpoch
                || current.settingsEpoch !== active.settingsEpoch
                || current.timePolicyKey !== active.timePolicyKey) return invalidate('authority_changed');
            if (extend) active.expiresAt = current.deadline;
            reason = 'allowed';
            return true;
        }

        return Object.freeze({ invalidate, issue,
            validate: lease => check(lease, false), renew: lease => check(lease, true), getReason: () => reason });
    }

    root.FilterTubeContentPlaybackAdmission = Object.freeze({ create });
})(typeof window !== 'undefined' ? window : globalThis);
