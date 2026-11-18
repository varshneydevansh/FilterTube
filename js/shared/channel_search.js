/* A search in allowed-only mode or during a study round also asks the allowed (or plan) channels' own
 * search (Android StudySearch.kt: StudySearchPlanner, ChannelSearchScope, StudySearchCache).
 * Pure rules here; content/channel_search_shelf.js does the asking and draws the shelf.
 *
 * - scope(settings): STUDY in a round on Main (settings.channelSearchGroups, one group per pack); ALLOWED
 *   in allowed-only mode outside study (the allowed channels with a UC id and the allowed words); null
 *   in a block list, a rest break, the limit, a hold, on Kids or with no channel to ask.
 * - plan(query, groups, limit): the channels to ask, most likely first: packs whose topics the query
 *   is about (their channels lead), then the rest, round-robin inside each tier; a shared channel once.
 * - merge(perChannel, site, id): plan channels' answers first, one from each in turn (6 each at most),
 *   then the site's; no video twice.
 * - parseChannelSearch(json): the videos of a channel's search answer ({videoId, title, channelId,
 *   channelName, published, length, views, thumbnail}).
 * - createCache(ttl = 10 min): the same search in the same scope asks nobody again.
 * Every result still passes the page's normal matcher before it shows.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeChannelSearch) root.FilterTubeChannelSearch = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MAX_FIRST = 6;
    const MAX_ALL = 30;
    const PER_CHANNEL = 6;
    const CACHE_TTL_MS = 10 * 60 * 1000;
    const CACHE_CAPACITY = 24;
    // The channel page's Search tab (browse with these params and a query).
    const CHANNEL_SEARCH_PARAMS = 'EgZzZWFyY2jyBgQKAloA';
    const UC_ID = /^UC[\w-]{10,}$/;

    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function key(value) { return text(value).toLowerCase().normalize('NFKC').replace(/\s+/g, ' '); }
    function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function wordPattern(phrase) {
        const value = key(phrase);
        if (value.length < 2) return null;
        try { return new RegExp(`(?<![\\p{L}\\p{N}])${value.split(' ').map(escapeRegExp).join('\\s+')}(?![\\p{L}\\p{N}])`, 'iu'); } catch (e) { return null; }
    }

    /** How many of a group's terms the query is about: named whole in it, or the query named in one. */
    function relevance(query, terms) {
        const q = key(query);
        if (q.length < 2) return 0;
        const whole = wordPattern(q);
        let count = 0;
        for (const term of Array.isArray(terms) ? terms : []) {
            const pattern = wordPattern(term);
            if ((pattern && pattern.test(q)) || (whole && whole.test(key(term)))) count++;
        }
        return count;
    }

    /** The plain words of a compiled allow word ({pattern} of a whole word or a substring); '' for a regex. */
    function literalWord(item) {
        let pattern = typeof item === 'string' ? escapeRegExp(item) : text(item?.pattern || item?.source);
        const prefix = '(^|[^\\p{L}\\p{N}_])';
        const suffix = '(?=$|[^\\p{L}\\p{N}_])';
        if (pattern.startsWith(prefix) && pattern.endsWith(suffix)) pattern = pattern.slice(prefix.length, pattern.length - suffix.length);
        pattern = pattern.replace(/\\s\+/g, ' ');
        if (/(^|[^\\])[.*+?^${}()|[\]]/.test(pattern)) return '';
        return pattern.replace(/\\(.)/g, '$1').trim();
    }

    function hash(value) {
        let h = 0;
        for (const char of String(value)) h = (Math.imul(h, 31) + char.codePointAt(0)) | 0;
        return (h >>> 0).toString(36);
    }

    /** Whose channels a search also asks; null when none. */
    function scope(settings) {
        const value = isObject(settings) ? settings : {};
        if (value.enabled === false || value.profileType === 'kids') return null;
        const phase = isObject(value.study) ? value.study.phase : 'normal';
        if (phase === 'rest') return null;
        if (phase === 'study') {
            const groups = (Array.isArray(value.channelSearchGroups) ? value.channelSearchGroups : [])
                .filter(isObject)
                .map(group => ({
                    packId: text(group.packId),
                    channels: (Array.isArray(group.channels) ? group.channels : []).map(text).filter(id => UC_ID.test(id)),
                    terms: (Array.isArray(group.terms) && group.terms.length ? group.terms : (Array.isArray(group.topics) ? group.topics : [])).map(text).filter(Boolean)
                }))
                .filter(group => group.channels.length);
            if (!groups.length) return null;
            return { kind: 'study', key: `study|${hash(JSON.stringify(groups))}`, groups };
        }
        if (value.listMode !== 'whitelist') return null;
        const channels = [];
        for (const row of Array.isArray(value.whitelistChannels) ? value.whitelistChannels : []) {
            if (!isObject(row) || row.managedListPaused === true) continue;
            const id = text(row.id);
            if (UC_ID.test(id) && !channels.includes(id)) channels.push(id);
        }
        if (!channels.length) return null;
        const words = (Array.isArray(value.whitelistKeywords) ? value.whitelistKeywords : []).map(literalWord).filter(Boolean);
        const groups = [{ packId: 'allowed', channels, terms: words }];
        return { kind: 'allowed', key: `allowed|${hash(JSON.stringify(groups))}`, groups };
    }

    /** The channels to ask for `query`, most likely first, at most `limit`. */
    function plan(query, groups, limit = MAX_FIRST) {
        const list = (Array.isArray(groups) ? groups : []).filter(isObject);
        const scored = list.map(group => ({ group, score: relevance(query, group.terms) }));
        const relevant = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.group);
        const rest = scored.filter(item => item.score === 0).map(item => item.group);
        const out = new Map();
        for (const tier of [relevant, rest]) {
            const longest = Math.max(0, ...tier.map(group => (group.channels || []).length));
            for (let index = 0; index < longest; index++) {
                for (const group of tier) {
                    const channel = (group.channels || [])[index];
                    if (channel && !out.has(channel.toLowerCase())) out.set(channel.toLowerCase(), channel);
                }
            }
        }
        return [...out.values()].slice(0, Math.max(0, limit));
    }

    /** Plan channels' answers first, one from each in turn, `take` each at most; then the site's. */
    function merge(perChannel, site, id = item => item?.videoId, take = PER_CHANNEL) {
        const lists = (Array.isArray(perChannel) ? perChannel : []).map(list => (Array.isArray(list) ? list : []).slice(0, take));
        const seen = new Set();
        const out = [];
        const longest = Math.max(0, ...lists.map(list => list.length));
        for (let index = 0; index < longest; index++) {
            for (const list of lists) {
                if (index >= list.length) continue;
                const item = list[index];
                const itemId = item == null ? null : id(item);
                if (itemId == null || itemId === '' || seen.has(itemId)) continue;
                seen.add(itemId);
                out.push(item);
            }
        }
        for (const item of Array.isArray(site) ? site : []) {
            const itemId = id(item);
            if (itemId == null) { out.push(item); continue; }
            if (seen.has(itemId)) continue;
            seen.add(itemId);
            out.push(item);
        }
        return out;
    }

    function runsText(value) {
        if (!value) return '';
        if (typeof value.simpleText === 'string') return value.simpleText;
        if (Array.isArray(value.runs)) return value.runs.map(run => run?.text || '').join('');
        return '';
    }

    function bestThumbnail(thumbnail) {
        const list = Array.isArray(thumbnail?.thumbnails) ? thumbnail.thumbnails : [];
        const pick = list.filter(item => typeof item?.url === 'string').sort((a, b) => (b.width || 0) - (a.width || 0))[0];
        return pick ? pick.url : '';
    }

    /** The videos of a channel search answer (videoRenderer items; playlists and shelves are left out). */
    function parseChannelSearch(json) {
        const tabs = json?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        if (!Array.isArray(tabs)) return [];
        const out = [];
        const visit = node => {
            if (!node || typeof node !== 'object' || out.length >= 60) return;
            if (Array.isArray(node)) { node.forEach(visit); return; }
            const video = node.videoRenderer;
            if (isObject(video) && typeof video.videoId === 'string') {
                const byline = (video.longBylineText || video.ownerText || video.shortBylineText)?.runs?.[0];
                const browse = byline?.navigationEndpoint?.browseEndpoint;
                out.push({
                    videoId: video.videoId,
                    title: runsText(video.title),
                    channelId: text(browse?.browseId),
                    channelHandle: text(browse?.canonicalBaseUrl).replace(/^\//, '').startsWith('@') ? text(browse.canonicalBaseUrl).replace(/^\//, '') : '',
                    channelName: text(byline?.text),
                    published: runsText(video.publishedTimeText),
                    length: runsText(video.lengthText),
                    views: runsText(video.shortViewCountText) || runsText(video.viewCountText),
                    thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
                    live: !video.lengthText && Array.isArray(video.badges) && video.badges.some(badge => /live/i.test(JSON.stringify(badge)))
                });
                return;
            }
            for (const [name, child] of Object.entries(node)) {
                if (name === 'videoRenderer') continue;
                if (child && typeof child === 'object') visit(child);
            }
        };
        visit(tabs);
        const seen = new Set();
        return out.filter(item => !seen.has(item.videoId) && seen.add(item.videoId) && !!item.title);
    }

    /** The request body for one channel's search. */
    function channelSearchBody(channelId, query, clientVersion, { hl = 'en', gl = 'US' } = {}) {
        return {
            context: { client: { clientName: 'WEB', clientVersion: text(clientVersion) || '2.20251110.00.00', hl, gl } },
            browseId: channelId,
            params: CHANNEL_SEARCH_PARAMS,
            query: text(query)
        };
    }

    /** A small time-limited cache (StudySearchCache): 10 minutes, the 24 latest searches. */
    function createCache({ ttlMs = CACHE_TTL_MS, capacity = CACHE_CAPACITY, now = () => Date.now() } = {}) {
        const map = new Map();
        return {
            get(cacheKey) {
                const hit = map.get(cacheKey);
                if (!hit) return null;
                if (now() - hit.at > ttlMs) { map.delete(cacheKey); return null; }
                map.delete(cacheKey);
                map.set(cacheKey, hit);
                return hit.value;
            },
            set(cacheKey, value) {
                map.delete(cacheKey);
                map.set(cacheKey, { at: now(), value });
                while (map.size > capacity) map.delete(map.keys().next().value);
            },
            size: () => map.size
        };
    }

    /** "study|…|cement" — the cache key of one search in one scope (widened or not). */
    function searchKey(scopeValue, query, widened = false) {
        return `${scopeValue?.key || ''}|${key(query)}|${widened ? 'all' : 'first'}`;
    }

    /** Every channel the scope can ask. */
    function channelCount(scopeValue) {
        return new Set((scopeValue?.groups || []).flatMap(group => group.channels || []).map(id => id.toLowerCase())).size;
    }

    return Object.freeze({
        MAX_FIRST, MAX_ALL, PER_CHANNEL, CACHE_TTL_MS, CHANNEL_SEARCH_PARAMS,
        relevance, scope, plan, merge, parseChannelSearch, channelSearchBody, createCache, searchKey, channelCount
    });
}));
