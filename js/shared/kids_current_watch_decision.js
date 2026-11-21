/*
 * The YouTube Kids watch check (product rule: any filter entry hides that content everywhere, so a
 * newly blocked Kids video must stop). Runs only when a rules update arrives or the page loads, and
 * then until the decision is definite. It decides from data already known for the video id: the
 * explicit video lists, its channel (videoChannelMap), its title (videoMetaMap) and its category, with
 * the same card matcher the Kids feed filter uses. Only a definite "blocked" stops playback; anything
 * still loading is "unknown" and keeps playing.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeKidsCurrentWatchDecision = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const text = value => (typeof value === 'string' ? value.trim() : '');
    const list = value => (Array.isArray(value) ? value : []);

    function categoryDecision(settings, category) {
        const filters = settings && typeof settings.categoryFilters === 'object' ? settings.categoryFilters : null;
        const selected = list(filters?.selected).map(value => text(String(value || '')).toLowerCase()).filter(Boolean);
        if (filters?.enabled !== true || !selected.length) return 'none';
        const known = text(String(category || '')).toLowerCase();
        if (!known) return filters.mode === 'allow' ? 'unknown' : 'none';
        if (filters.mode === 'allow') return selected.includes(known) ? 'allowed' : 'blocked';
        return selected.includes(known) ? 'blocked' : 'none';
    }

    /**
     * { state: 'allowed' | 'blocked' | 'unknown', reason } for `videoId` under `settings`.
     * `matches(title, channelId)` is the Kids card matcher (dom_fallback.js shouldHideContent).
     */
    function decide({ videoId, settings, matches }) {
        const id = text(videoId);
        if (!id || !settings || typeof settings !== 'object') return { state: 'unknown', reason: 'no_video' };
        if (list(settings.blockedVideoIds).includes(id)) return { state: 'blocked', reason: 'video' };
        const whitelist = settings.listMode === 'whitelist';
        const meta = settings.videoMetaMap && typeof settings.videoMetaMap === 'object' ? (settings.videoMetaMap[id] || {}) : {};
        const mapped = settings.videoChannelMap && typeof settings.videoChannelMap === 'object' ? settings.videoChannelMap[id] : '';
        const channelId = text(typeof mapped === 'string' ? mapped : (mapped && mapped.id) || '');
        const title = text(meta.title);
        const category = categoryDecision(settings, meta.category);
        if (category === 'blocked') return { state: 'blocked', reason: 'category' };
        if (whitelist && list(settings.allowedVideoIds).includes(id)) return { state: 'allowed', reason: 'allowed_video' };
        if (!channelId && !title) return { state: 'unknown', reason: 'metadata_pending' };
        const hidden = typeof matches === 'function' ? matches(title, channelId) === true : false;
        if (!whitelist) {
            // Blocklist: a match on known data is definite; no match is only final once both are known.
            if (hidden) return { state: 'blocked', reason: 'rules' };
            if (channelId && title && category !== 'unknown') return { state: 'allowed', reason: 'no_match' };
            return { state: 'unknown', reason: 'metadata_pending' };
        }
        // Allow only selected: allowed as soon as known data allows it; blocked only once everything is known.
        if (!hidden) return category === 'unknown' ? { state: 'unknown', reason: 'category_pending' } : { state: 'allowed', reason: 'allowed' };
        return channelId && title ? { state: 'blocked', reason: 'not_allowed' } : { state: 'unknown', reason: 'metadata_pending' };
    }

    return Object.freeze({ decide, categoryDecision });
}));
