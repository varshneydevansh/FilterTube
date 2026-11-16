/* Parent mode's pure parts (Android ParentMode.kt): which Family link makes a session remote, which local
 * child an "Open Aarav's space" request opens, and the remote sync badge's wording. The options page
 * draws the frame and the bar (js/tab-view.js renderManagedChildGlobalBanner); nothing here grants or
 * widens authority, every write still goes through the profile gates. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeParentMode = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }

    /** A Family-control link that sends from this device: managed, source, live. */
    function sending(link) {
        const value = object(link);
        const policy = object(value.policy);
        return value.linkType === 'managed_link' && value.localRole === 'source' && value.enabled !== false
            && !value.revoked && !value.keyRevoked && !value.quarantined && !policy.revoked && !policy.keyRevoked && !policy.quarantined;
    }

    /** The local child a link sends (the extension keeps it in policy.targetProfileId; Android in sourceProfileId). */
    function linkChild(link) {
        const value = object(link);
        return text(value.localPolicyProfileId) || text(object(value.policy).targetProfileId) || text(value.targetProfileId);
    }

    /** The live Family-control link that sends [childId]'s rules from this device, most recently used first. */
    function remoteLinkFor(childId, links) {
        const id = text(childId);
        if (!id) return null;
        const time = link => Date.parse(text(object(link).lastUsedAt) || text(object(link).createdAt)) || 0;
        return array(links).filter(link => sending(link) && linkChild(link) === id).sort((a, b) => time(b) - time(a))[0] || null;
    }

    /**
     * The local child profile behind an "Open Aarav's space" request: the profile itself, or the child a
     * live Family link sends (a remote session). Null when nothing local can be managed.
     */
    function spaceTarget(profileId, linkId, links) {
        const id = text(profileId);
        if (id) return id;
        const link = array(links).find(item => text(object(item).linkId) === text(linkId));
        if (!link || !sending(link)) return null;
        return linkChild(link) || null;
    }

    const SYNC = Object.freeze({
        CONNECTING: 'connecting', CONNECTED: 'connected', SENDING: 'sending', SAVED_TO_DEVICE: 'saved',
        UP_TO_DATE: 'upToDate', WAITING: 'waiting', OFFLINE: 'offline'
    });

    /** States that describe a connection in progress, which end when it does. */
    function isLiveSync(state) {
        return state === SYNC.CONNECTING || state === SYNC.CONNECTED || state === SYNC.SENDING;
    }

    /**
     * The badge on a remote session. `reported` comes from Accounts & Sync when it knows more; otherwise
     * the bar never claims a send it can't see.
     */
    function sync(reported, online, unsentChanges) {
        if (isLiveSync(reported)) return reported;
        if (!online) return SYNC.OFFLINE;
        if (unsentChanges > 0) return SYNC.WAITING;
        if (reported === SYNC.SAVED_TO_DEVICE) return SYNC.SAVED_TO_DEVICE;
        return SYNC.UP_TO_DATE;
    }

    /** busy (connecting, sending), done (connected, saved, up to date) or waiting (waiting, offline). */
    function syncTone(state) {
        if (state === SYNC.CONNECTING || state === SYNC.SENDING) return 'busy';
        if (state === SYNC.WAITING || state === SYNC.OFFLINE) return 'waiting';
        return 'done';
    }

    /**
     * Android ParentModeSession: what Accounts & Sync reported for one child and the changes made since
     * the last confirmed send. Another child's events are ignored; a failure never leaves a live state.
     */
    function createSession(childId) {
        const state = { childId: text(childId), reported: null, unsentChanges: 0, savedTo: '' };
        return {
            state,
            report(child, value, deviceLabel = '') {
                if (text(child) !== state.childId) return false;
                state.reported = value;
                if (value === SYNC.SAVED_TO_DEVICE) { state.unsentChanges = 0; state.savedTo = text(deviceLabel); }
                return true;
            },
            clearLive(child) {
                if (text(child) === state.childId && isLiveSync(state.reported)) state.reported = null;
            },
            recordChange() { state.unsentChanges += 1; },
            badge(online) { return sync(state.reported, online, state.unsentChanges); }
        };
    }

    return Object.freeze({ SYNC, remoteLinkFor, spaceTarget, sync, isLiveSync, syncTone, createSession });
}));
