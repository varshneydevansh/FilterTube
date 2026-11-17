/* The empty-feed guard and the rule-change check, in the page's main world (seed.js).
 *
 * Chrome injects a content-script file once per frame, whichever world lists it first, so this part
 * lives apart from js/shared/allowlist_feed.js (the isolated world's feed builder).
 * - Empty-feed guard (Android NativeMainContinuationAutoLoadGuard.MAX_EMPTY_AUTO_LOADS): a feed page
 *   or continuation that had cards and lost all of them to the rules counts as empty; after 3 in a
 *   row on one route the continuation token is removed, so the page stops asking for more.
 * - classifyRuleChange(prev, next): "tighten" (only hides more), "loosen" (something hidden before may
 *   show now) or "same", so an open page can bring hidden items back when rules loosen.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeFeedGuard) root.FilterTubeFeedGuard = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MAX_EMPTY_AUTO_LOADS = 3;

    // Outermost card renderers: each counts once and is not searched inside.
    const CARD_KEYS = new Set([
        'richItemRenderer', 'videoRenderer', 'gridVideoRenderer', 'compactVideoRenderer', 'lockupViewModel',
        'reelItemRenderer', 'shortsLockupViewModel', 'playlistRenderer', 'gridPlaylistRenderer', 'radioRenderer',
        'compactRadioRenderer', 'channelRenderer', 'gridChannelRenderer', 'movieRenderer', 'postRenderer',
        'backstagePostThreadRenderer', 'compactPlaylistRenderer', 'videoCardRenderer'
    ]);
    const CONTINUATION_KEY = 'continuationItemRenderer';

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }

    /** {cards, continuations} in a payload: cards counted at their outermost renderer. */
    function countFeedItems(data) {
        let cards = 0;
        let continuations = 0;
        const stack = [[data, 0]];
        while (stack.length) {
            const [node, depth] = stack.pop();
            if (!node || typeof node !== 'object' || depth > 60) continue;
            if (Array.isArray(node)) {
                for (const item of node) stack.push([item, depth + 1]);
                continue;
            }
            for (const [key, value] of Object.entries(node)) {
                if (CARD_KEYS.has(key)) { cards += 1; continue; }
                if (key === CONTINUATION_KEY) { continuations += 1; continue; }
                if (value && typeof value === 'object') stack.push([value, depth + 1]);
            }
        }
        return { cards, continuations };
    }

    /** Removes every continuation entry from item lists (in place); returns how many it removed. */
    function stripContinuations(data) {
        let removed = 0;
        const stack = [[data, 0]];
        while (stack.length) {
            const [node, depth] = stack.pop();
            if (!node || typeof node !== 'object' || depth > 60) continue;
            if (Array.isArray(node)) {
                for (let index = node.length - 1; index >= 0; index -= 1) {
                    const item = node[index];
                    if (isObject(item) && Object.prototype.hasOwnProperty.call(item, CONTINUATION_KEY)) {
                        node.splice(index, 1);
                        removed += 1;
                    } else {
                        stack.push([item, depth + 1]);
                    }
                }
                continue;
            }
            for (const value of Object.values(node)) {
                if (value && typeof value === 'object') stack.push([value, depth + 1]);
            }
        }
        return removed;
    }

    /** Feed requests the guard watches: Home and other browse feeds, and search; never watch or player. */
    function isGuardedPayload(dataName) {
        const name = String(dataName || '');
        if (/\/youtubei\/v1\/(next|player|guide|account|notification|live_chat|reel)/.test(name)) return false;
        if (name.includes('PlayerResponse')) return false;
        // A replay of a payload already counted (settings arrived late, or a reprocess) isn't a new load.
        if (/-(reprocess|replay|queued)$/.test(name)) return false;
        return name.includes('/youtubei/v1/browse') || name.includes('/youtubei/v1/search') || name.startsWith('ytInitialData');
    }

    /**
     * Counts fully hidden feed payloads per route. observe() returns {empty, streak, exhausted}:
     * exhausted means this payload should lose its continuation (the page stops asking for more).
     */
    function createContinuationGuard({ max = MAX_EMPTY_AUTO_LOADS } = {}) {
        let route = null;
        let streak = 0;
        let exhausted = false;
        return {
            observe({ routeKey, before, after }) {
                if (routeKey !== route) { route = routeKey; streak = 0; exhausted = false; }
                const had = Number(before) || 0;
                const kept = Number(after) || 0;
                if (had <= 0) return { empty: false, streak, exhausted };
                if (kept > 0) { streak = 0; exhausted = false; return { empty: false, streak, exhausted }; }
                streak += 1;
                if (streak >= max) exhausted = true;
                return { empty: true, streak, exhausted };
            },
            reset() { route = null; streak = 0; exhausted = false; },
            state() { return { route, streak, exhausted }; }
        };
    }

    function entryKey(entry) {
        if (typeof entry === 'string') return entry.trim().toLowerCase();
        if (!isObject(entry)) return '';
        if (typeof entry.pattern === 'string') return `${entry.pattern.toLowerCase()}::${entry.flags || ''}::${entry.titleOnly ? 't' : ''}`;
        const id = text(entry.id) || text(entry.channelId) || text(entry.handle) || text(entry.customUrl) || text(entry.name) || text(entry.word);
        return id.toLowerCase();
    }
    function keySet(list) { return new Set(array(list).map(entryKey).filter(Boolean)); }
    function subset(a, b) { for (const key of a) if (!b.has(key)) return false; return true; }

    const LIST_KEYS_BLOCK = ['filterKeywords', 'filterChannels', 'filterKeywordsComments'];
    const LIST_KEYS_ALLOW = ['whitelistKeywords', 'whitelistChannels', 'allowedVideoIds', 'askParentPassVideoIds'];

    /**
     * How the effective rules moved: "same", "tighten" (only hides more) or "loosen" (something hidden
     * before may show now). Anything this can't prove to be tighter counts as "loosen".
     */
    function classifyRuleChange(prev, next) {
        if (!isObject(next)) return 'same';
        if (!isObject(prev)) return 'tighten';
        if (JSON.stringify(prev) === JSON.stringify(next)) return 'same';
        let looser = false;
        let tighter = false;
        const wasOn = prev.enabled !== false;
        const isOn = next.enabled !== false;
        if (wasOn && !isOn) return 'loosen';
        if (!wasOn && isOn) tighter = true;
        const prevAllow = prev.listMode === 'whitelist';
        const nextAllow = next.listMode === 'whitelist';
        if (prevAllow && !nextAllow) return 'loosen';
        if (!prevAllow && nextAllow) tighter = true;
        for (const key of LIST_KEYS_BLOCK) {
            const before = keySet(prev[key]);
            const after = keySet(next[key]);
            if (!subset(before, after)) looser = true;
            if (!subset(after, before)) tighter = true;
        }
        if (nextAllow && prevAllow) {
            for (const key of LIST_KEYS_ALLOW) {
                const before = keySet(prev[key]);
                const after = keySet(next[key]);
                if (!subset(after, before)) looser = true;
                if (!subset(before, after)) tighter = true;
            }
        }
        const prevStudy = isObject(prev.study) ? text(prev.study.phase) : '';
        const nextStudy = isObject(next.study) ? text(next.study.phase) : '';
        if (prevStudy && prevStudy !== 'normal' && (!nextStudy || nextStudy === 'normal')) looser = true;
        if (prev.profileType !== next.profileType || prev.activeProfileId !== next.activeProfileId) looser = true;
        for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
            if (!/^(hide|disable)[A-Z]/.test(key)) continue;
            if (prev[key] === true && next[key] !== true) looser = true;
            if (prev[key] !== true && next[key] === true) tighter = true;
        }
        for (const key of ['contentFilters', 'categoryFilters', 'languageFilters']) {
            if (JSON.stringify(prev[key] ?? null) !== JSON.stringify(next[key] ?? null)) looser = true;
        }
        if (looser) return 'loosen';
        return tighter ? 'tighten' : 'same';
    }

    /** Pages whose data is never loaded again on a rule change (the player keeps playing). */
    function isPlayerPath(pathname) {
        return /^\/(watch|shorts\/|live\/|embed\/)/.test(String(pathname || ''));
    }

    return Object.freeze({
        MAX_EMPTY_AUTO_LOADS, countFeedItems, stripContinuations, isGuardedPayload, createContinuationGuard,
        classifyRuleChange, isPlayerPath
    });
}));
