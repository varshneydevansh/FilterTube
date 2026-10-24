/* Explicit ordinary viewing preferences. Rules, safety policy and device trust are separate. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeProfilePreferenceDefaults = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const entries = [
        ['hideShorts', false, 'Hide Shorts'], ['hideComments', false, 'Hide comments'],
        ['hideHomeFeed', false, 'Hide Home feed'], ['hideSponsoredCards', true, 'Hide sponsored cards'],
        ['contentOnlyPlayback', true, 'Content-only playback'], ['hidePlayables', false, 'Hide Playables'],
        ['hideWatchPlaylistPanel', false, 'Hide watch playlist panel'], ['hidePlaylistCards', false, 'Hide playlist cards'],
        ['hideMembersOnly', false, 'Hide members-only videos'], ['hideMixPlaylists', false, 'Hide Mix playlists'],
        ['hideVideoSidebar', false, 'Hide video sidebar'], ['hideRecommended', false, 'Hide recommendations'],
        ['hideLiveChat', false, 'Hide live chat'], ['hideVideoInfo', false, 'Hide video information'],
        ['hideVideoButtonsBar', false, 'Hide video buttons'], ['hideAskButton', false, 'Hide Ask button'],
        ['hideVideoChannelRow', false, 'Hide channel row'], ['hideVideoDescription', false, 'Hide video description'],
        ['hideMerchTicketsOffers', false, 'Hide merchandise and ticket offers'], ['hideEndscreenVideowall', false, 'Hide end-screen video wall'],
        ['hideEndscreenCards', false, 'Hide end-screen cards'], ['disableAutoplay', false, 'Disable autoplay'],
        ['alwaysUseOriginalAudio', false, 'Always use original audio'], ['disableAnnotations', false, 'Disable annotations'],
        ['hideTopHeader', false, 'Hide top header'], ['hideNotificationBell', false, 'Hide notification bell'],
        ['hideExploreTrending', false, 'Hide Explore and Trending'], ['hideMoreFromYouTube', false, 'Hide More from YouTube'],
        ['hideSubscriptions', false, 'Hide subscriptions'], ['showQuickBlockButton', true, 'Show quick block button'],
        ['showBlockMenuItem', true, 'Show block menu item'], ['hideSearchShelves', false, 'Hide search shelves']
    ].map(([key, value, label]) => Object.freeze({ key, value, label }));
    Object.freeze(entries);
    const defaults = Object.freeze(Object.fromEntries(entries.map(entry => [entry.key, entry.value])));
    const legacyKeys = Object.freeze(entries.map(({ key }) => key === 'hideShorts' ? 'hideAllShorts' : key === 'hideComments' ? 'hideAllComments' : key));
    const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const clone = value => JSON.parse(JSON.stringify(value));
    const stable = value => Array.isArray(value) ? `[${value.map(stable).join(',')}]`
        : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
            : JSON.stringify(value);
    const fail = code => { const error = Error(code); error.code = code; throw error; };
    function plan(profile) {
        const settings = object(profile?.settings);
        // Explicit canonical values also carry the reset intent to linked
        // profiles that may otherwise inherit different legacy preferences.
        const changes = entries.filter(({ key, value }) => !own(settings, key)
            || typeof settings[key] !== 'boolean' || settings[key] !== value).map(entry => ({ ...entry }));
        return { changes, settings: { ...settings, ...defaults } };
    }
    function syncImpact(config, profileId) {
        if (config === undefined || config === null) return { devices: [], fingerprint: '[]' };
        if (config.version !== 1 || !Array.isArray(config.personal) || !Array.isArray(config.managed)) fail('sync_unavailable');
        const rows = config.personal.filter(row => row?.grant?.enabled === true && row.grant.localProfileId === profileId
            && Array.isArray(row.grant.areas) && row.grant.areas.includes('settings'));
        const devices = [...new Map(rows.map(row => [row.grant.remoteDeviceId + ':' + row.grant.remoteProfileId, {
            deviceId: row.grant.remoteDeviceId, profileId: row.grant.remoteProfileId,
            label: typeof row.label === 'string' && row.label.trim() ? row.label : row.grant.remoteDeviceId
        }])).values()];
        // Compare local grant identity, not private signing keys, and never display this token.
        return { devices, fingerprint: stable(rows.map(row => ({ grant: row.grant, label: row.label || '' }))) };
    }
    function create(deps) {
        let busy = false;
        function select(state) {
            const selection = deps.selection(state.root);
            const actor = state.root?.profiles?.[selection?.actorProfileId];
            const target = state.root?.profiles?.[selection?.targetProfileId];
            if (!actor || !target || state.root.activeProfileId !== selection.actorProfileId
                || actor.type === 'child' || actor.parentProfileId
                || (selection.actorProfileId !== selection.targetProfileId && target.type !== 'child')) fail('profile_changed');
            return selection;
        }
        function identity(state, selection) {
            if (deps.authority) return stable(deps.authority(state.root, selection));
            const fields = profile => ({ type: profile.type, parentProfileId: profile.parentProfileId || null, security: profile.security || null, pinVerifier: profile.pinVerifier || null });
            return stable([fields(state.root.profiles[selection.actorProfileId]), fields(state.root.profiles[selection.targetProfileId]), state.root.security || null]);
        }
        function snapshot(state, selection) {
            return { selection: { ...selection }, scopeValue: stable(selection.scope || null), identity: identity(state, selection), target: stable(state.root.profiles[selection.targetProfileId]),
                actor: stable(state.root.profiles[selection.actorProfileId]), security: stable(state.root.security || null),
                legacy: stable(state.legacy || {}), impact: syncImpact(state.sync, selection.targetProfileId) };
        }
        function checked(state, expected) {
            const selection = select(state), prior = expected.selection;
            if (selection.actorProfileId !== prior.actorProfileId || selection.targetProfileId !== prior.targetProfileId
                || selection.scope !== prior.scope || stable(selection.scope || null) !== expected.scopeValue || stable(state.root.profiles[prior.targetProfileId]) !== expected.target
                || stable(state.root.profiles[prior.actorProfileId]) !== expected.actor
                || stable(state.root.security || null) !== expected.security || stable(state.legacy || {}) !== expected.legacy
                || syncImpact(state.sync, prior.targetProfileId).fingerprint !== expected.impact.fingerprint
                || deps.authorized(state.root, selection) !== true) fail('profile_changed');
            if (state.session?.active === true && Number(state.session.lockedUntil) > (deps.now?.() ?? Date.now())) fail('session_locked');
            return selection;
        }
        async function restore() {
            if (busy) return { status: 'busy' };
            busy = true;
            try {
                let state = await deps.read(), selection = select(state);
                const opening = { selection: { ...selection }, scopeValue: stable(selection.scope || null), identity: identity(state, selection) };
                await deps.guard();
                if (!await deps.unlock(state.root, selection)) return { status: 'cancelled' };
                state = await deps.read();
                // Re-check the named actor/target and their entire snapshots after unlocking.
                const unlocked = select(state);
                if (unlocked.actorProfileId !== selection.actorProfileId || unlocked.targetProfileId !== selection.targetProfileId
                    || unlocked.scope !== selection.scope || stable(unlocked.scope || null) !== opening.scopeValue || identity(state, unlocked) !== opening.identity
                    || deps.authorized(state.root, unlocked) !== true) fail('profile_changed');
                await deps.guard();
                state = await deps.read();
                const reviewed = select(state);
                if (reviewed.actorProfileId !== selection.actorProfileId || reviewed.targetProfileId !== selection.targetProfileId
                    || reviewed.scope !== selection.scope || stable(reviewed.scope || null) !== opening.scopeValue
                    || identity(state, reviewed) !== opening.identity || deps.authorized(state.root, reviewed) !== true) fail('profile_changed');
                if (state.session?.active === true && Number(state.session.lockedUntil) > (deps.now?.() ?? Date.now())) fail('session_locked');
                const expected = snapshot(state, selection), prepared = plan(state.root.profiles[selection.targetProfileId], state.legacy);
                if (!prepared.changes.length) return { status: 'noop', profileId: selection.targetProfileId };
                if (!await deps.confirm({ profileId: selection.targetProfileId,
                    profileName: state.root.profiles[selection.targetProfileId].name || selection.targetProfileId,
                    changes: prepared.changes, devices: expected.impact.devices })) return { status: 'cancelled' };
                return await deps.withLock(async () => {
                    let latest = await deps.read(); checked(latest, expected);
                    await deps.guard();
                    latest = await deps.read(); checked(latest, expected);
                    const profileId = selection.targetProfileId;
                    const nextProfile = { ...latest.root.profiles[profileId], settings: plan(latest.root.profiles[profileId], latest.legacy).settings };
                    const next = { ...latest.root, profiles: { ...latest.root.profiles, [profileId]: nextProfile } };
                    const saved = await deps.save(next);
                    if (!saved || saved.ok !== true) fail('save_failed');
                    const after = await deps.read();
                    if (stable(after.root.profiles?.[profileId]) !== stable(nextProfile)) fail('readback_failed');
                    const current = select(after);
                    if (current.actorProfileId !== selection.actorProfileId || current.targetProfileId !== profileId
                        || current.scope !== selection.scope || stable(current.scope || null) !== expected.scopeValue
                        || identity(after, current) !== expected.identity || stable(after.root.security || null) !== expected.security
                        || syncImpact(after.sync, profileId).fingerprint !== expected.impact.fingerprint || deps.authorized(after.root, current) !== true) fail('profile_changed');
                    await deps.guard();
                    return { status: 'restored', profileId, changedCount: prepared.changes.length };
                });
            } finally { busy = false; }
        }
        return Object.freeze({ restore });
    }
    return Object.freeze({ entries, legacyKeys, defaults: () => ({ ...defaults }), plan, syncImpact, create });
}));
