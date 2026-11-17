/* "What Uljhan tried today" (the dashboard Home): a small, bounded list of the last things FilterTube
 * hid on this device, kept in chrome.storage.local under ftHiddenLogV1. Nothing leaves the device.
 * - The content script adds an entry where a hide is counted (content_bridge.incrementHiddenStats).
 * - Each entry: {at, day, videoId, title, channel, channelId, handle, reason, surface}; reason is
 *   "keyword", "channel", "control" or "allowOnly".
 * - At most MAX entries, newest last; the same video on the same day is kept once (its newest hide).
 * - allowAction() says what "Allow" does for an entry, as the app's allow does: a precise exception
 *   for that one video (the profile's allowedVideoIds, which outranks a blocked word or channel),
 *   or, for a content control, opening Content Controls instead (a control has no per-video exception).
 * Pure functions only; the callers do the storage.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.FilterTubeHiddenLog = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const KEY = 'ftHiddenLogV1';
    const MAX = 30;
    const REASONS = Object.freeze(['keyword', 'channel', 'control', 'allowOnly']);
    const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
    const TEXT_MAX = 140;

    function text(value, max = TEXT_MAX) {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
    }

    function localDay(at) {
        const date = new Date(Number(at) || 0);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Which kind of rule hid a card, from the hide's reason line and the list mode. Lines naming a channel
     * are "channel"; content controls (Clips, duration, date, category, language, views, mixes) are
     * "control"; anything else in allow mode is "allowOnly"; otherwise a keyword, unless the card's own
     * channel is one of the blocked channels ([channelBlocked]).
     */
    function classify(reasonLine, { listMode = 'blocklist', channelBlocked = false } = {}) {
        const line = String(reasonLine || '');
        if (/^(Blocked channel|Pending channel block|Blocked comment author)/i.test(line)) return 'channel';
        if (/^(Duration filter|Upload date filter|Category filter|Language filter|View count filter|Mix\/radio hidden|Shorts hidden|Hide |Category unavailable)/i.test(line)) return 'control';
        if (listMode === 'whitelist') return 'allowOnly';
        return channelBlocked ? 'channel' : 'keyword';
    }

    /** The video id in a watch or Clips link; '' when there is none. */
    function videoIdFromHref(href) {
        const value = String(href || '');
        const watch = value.match(/[?&]v=([A-Za-z0-9_-]{11})/);
        if (watch) return watch[1];
        const clip = value.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
        return clip ? clip[1] : '';
    }

    /** A clean entry, or null when it can't be shown (no title and no video). */
    function entry(input = {}) {
        const at = Number(input.at) || Date.now();
        const videoId = VIDEO_ID.test(String(input.videoId || '')) ? String(input.videoId) : '';
        const title = text(input.title);
        if (!title && !videoId) return null;
        const reason = REASONS.includes(input.reason) ? input.reason : 'keyword';
        return {
            at,
            day: localDay(at),
            videoId,
            title,
            channel: text(input.channel, 80),
            channelId: /^UC[\w-]{22}$/.test(String(input.channelId || '')) ? String(input.channelId) : '',
            handle: /^@[\w.-]{1,60}$/.test(String(input.handle || '')) ? String(input.handle) : '',
            reason,
            surface: input.surface === 'kids' ? 'kids' : 'main'
        };
    }

    /** [log] with [items] added: newest last, one per video a day, at most MAX. */
    function push(log, items) {
        const out = (Array.isArray(log) ? log : []).map(entry).filter(Boolean);
        for (const raw of Array.isArray(items) ? items : [items]) {
            const next = entry(raw);
            if (!next) continue;
            const same = out.findIndex(old => old.day === next.day && (next.videoId ? old.videoId === next.videoId : old.title === next.title));
            if (same >= 0) out.splice(same, 1);
            out.push(next);
        }
        return out.slice(-MAX);
    }

    /** Today's entries (local day), newest first, at most [limit]. */
    function today(log, now = Date.now(), limit = 5) {
        const day = localDay(now);
        return (Array.isArray(log) ? log : []).map(entry).filter(item => item && item.day === day)
            .sort((a, b) => b.at - a.at).slice(0, limit);
    }

    /**
     * What Allow does for an entry: {kind: "allowVideo", videoId, surface} adds the video to the
     * profile's allowedVideoIds; {kind: "openControls"} for a content control; null when nothing can be
     * allowed (no video id).
     */
    function allowAction(item) {
        const value = entry(item || {});
        if (!value) return null;
        if (value.reason === 'control') return { kind: 'openControls' };
        if (!value.videoId) return null;
        return { kind: 'allowVideo', videoId: value.videoId, surface: value.surface };
    }

    /** The profile surface with [videoId] in allowedVideoIds (once); the same object when already there. */
    function withAllowedVideo(surface, videoId) {
        const data = surface && typeof surface === 'object' ? surface : {};
        const list = Array.isArray(data.allowedVideoIds) ? data.allowedVideoIds : [];
        if (!VIDEO_ID.test(String(videoId || '')) || list.includes(videoId)) return data;
        return { ...data, allowedVideoIds: [...list, videoId] };
    }

    /** The log without a video once it is allowed. */
    function without(log, videoId) {
        return (Array.isArray(log) ? log : []).filter(item => item?.videoId !== videoId);
    }

    return Object.freeze({ KEY, MAX, REASONS, classify, videoIdFromHref, entry, push, today, allowAction, withAllowedVideo, without, localDay });
}));
