/* Search-box suggestions under the active rules (main world, before seed.js).
 *
 * The search box asks /complete/search?...&q=<prefix> and gets JSONP:
 *   window.google.ac.h(["<q>", [[text, 0, [512, ...], {zae, zaf: "@handle", zai: thumbUrl, zao: name,
 *                                zav: "UC...", zal: videoId, ...}], ...], {"j": "4", "k": 1}])
 * With an empty q the list is the person's past searches, some with a picture.
 *
 * - Blocklist: a suggestion whose text matches a blocked word (the same compiled patterns titles use)
 *   is removed. A picture or video attached to a suggestion is stripped when it belongs to a blocked
 *   channel (its UC id or @handle, or a video whose channel is already known). An unknown channel
 *   keeps its picture: only word matches are removed.
 * - Allow list and Study: blocked words go first (layered rules), then only suggestions that name an
 *   allowed word or topic, or an allowed channel (by name, @handle or id), stay. A typed prefix of an
 *   allowed topic stays too ("alg" on the way to "algebra"), and allowed topics and channel names that
 *   start with what was typed are added when the site did not suggest them. The empty-q history keeps
 *   only matching entries.
 * - Kids: the stricter of the two. Blocked words go; in allow mode only allowed ones stay; the empty-q
 *   history keeps only entries that name an allowed word or channel, and a picture stays only when its
 *   channel is known to be allowed.
 * The response text is rewritten only when something changed; the callback wrapper is kept as is.
 * Unknown shapes pass through untouched.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeSearchSuggestions) root.FilterTubeSearchSuggestions = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MAX_ADDED = 6;
    const XSSI_PREFIX = /^\)\]\}'\s*/;
    const WRAPPER = /^(\s*[A-Za-z_$][\w$.]*\s*\()([\s\S]*)(\)\s*;?\s*)$/;
    const UNICODE_EXACT_PREFIX = '(^|[^\\p{L}\\p{N}_])';
    const UNICODE_EXACT_SUFFIX = '(?=$|[^\\p{L}\\p{N}_])';

    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function lower(value) { return text(value).toLowerCase(); }
    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function normalize(value) { return lower(value).normalize('NFKC').replace(/\s+/g, ' '); }
    function handleKey(value) { return lower(value).replace(/^@/, ''); }

    /** The response text split into {prefix, payload, suffix}; null when it isn't a suggestion response. */
    function parse(raw) {
        if (typeof raw !== 'string' || !raw) return null;
        let head = '';
        let body = raw;
        const xssi = body.match(XSSI_PREFIX);
        if (xssi) { head = xssi[0]; body = body.slice(xssi[0].length); }
        let prefix = head;
        let suffix = '';
        const wrapped = body.match(WRAPPER);
        if (wrapped) { prefix += wrapped[1]; body = wrapped[2]; suffix = wrapped[3]; }
        let payload;
        try { payload = JSON.parse(body); } catch (e) { return null; }
        if (!Array.isArray(payload) || typeof payload[0] !== 'string' || !Array.isArray(payload[1])) return null;
        return { prefix, payload, suffix };
    }

    function serialize(parsed) {
        return parsed.prefix + JSON.stringify(parsed.payload) + parsed.suffix;
    }

    /** A compiled keyword ({pattern, flags} or a RegExp) as a RegExp; null when unusable. */
    function toRegex(item) {
        if (item instanceof RegExp) return item;
        if (!isObject(item) || typeof item.pattern !== 'string' || !item.pattern) return null;
        try { return new RegExp(item.pattern, typeof item.flags === 'string' ? item.flags : 'i'); } catch (e) { return null; }
    }

    /** True for a word with a date window: a suggestion has no date, so it can't be judged. */
    function datedKeyword(item) {
        return (isObject(item) && item.dateFilter?.enabled === true) || (item instanceof RegExp && !!item.__filtertubeDateFilter);
    }

    /** The plain words of a compiled keyword ("algebra" from the whole-word pattern); null for a real regex. */
    function literalOf(item) {
        let pattern = item instanceof RegExp ? item.source : (isObject(item) ? text(item.pattern) : '');
        if (!pattern) return null;
        if (pattern.startsWith(UNICODE_EXACT_PREFIX) && pattern.endsWith(UNICODE_EXACT_SUFFIX)) {
            pattern = pattern.slice(UNICODE_EXACT_PREFIX.length, pattern.length - UNICODE_EXACT_SUFFIX.length);
        } else if (pattern.startsWith('\\b') && pattern.endsWith('\\b')) {
            pattern = pattern.slice(2, -2);
        }
        // Study topics compile spaces as \s+; anything else unescaped is a real regex.
        pattern = pattern.replace(/\\s\+/g, ' ');
        if (/(^|[^\\])[.*+?^${}()|[\]]/.test(pattern)) return null;
        const literal = pattern.replace(/\\(.)/g, '$1').trim();
        return literal || null;
    }

    function matchesAny(regexes, value) {
        for (const regex of regexes) {
            regex.lastIndex = 0;
            if (regex.test(value)) return true;
        }
        return false;
    }

    function channelRows(list) {
        return (Array.isArray(list) ? list : []).map(row => {
            if (typeof row === 'string') {
                const value = row.trim();
                return { id: /^uc[\w-]{10,}$/i.test(value) ? lower(value) : '', handle: value.startsWith('@') ? handleKey(value) : '', name: value.startsWith('@') ? '' : normalize(value) };
            }
            if (!isObject(row)) return null;
            return {
                id: lower(row.id || row.channelId),
                handle: handleKey(row.handle || row.canonicalHandle || row.handleDisplay),
                name: normalize(row.name || row.title)
            };
        }).filter(row => row && (row.id || row.handle || row.name));
    }

    function wordPattern(name) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
        try { return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, 'iu'); } catch (e) { return null; }
    }

    /** What the rules say about suggestions, worked out once per settings object. */
    function compile(settings, options = {}) {
        const value = isObject(settings) ? settings : {};
        const allowMode = value.listMode === 'whitelist';
        const kids = options.kids === true || value.profileType === 'kids';
        const blocked = (Array.isArray(value.filterKeywords) ? value.filterKeywords : [])
            .filter(item => !datedKeyword(item)).map(toRegex).filter(Boolean);
        const allowedItems = Array.isArray(value.whitelistKeywords) ? value.whitelistKeywords.filter(item => !datedKeyword(item)) : [];
        const allowed = allowedItems.map(toRegex).filter(Boolean);
        const topics = [];
        const seenTopics = new Set();
        for (const item of allowedItems) {
            const literal = literalOf(item);
            const key = literal ? normalize(literal) : '';
            if (!key || key.length < 2 || seenTopics.has(key)) continue;
            seenTopics.add(key);
            topics.push(key);
        }
        const blockedChannels = channelRows(value.filterChannels);
        const allowedChannels = channelRows(value.whitelistChannels);
        const allowedNames = allowedChannels.map(row => row.name).filter(name => name && name.length >= 2);
        const allowedNamePatterns = allowedNames.map(wordPattern).filter(Boolean);
        return {
            enabled: value.enabled !== false,
            allowMode,
            kids,
            blocked,
            allowed,
            topics,
            blockedChannels,
            allowedChannels,
            allowedNames,
            allowedNamePatterns,
            videoChannelMap: isObject(value.videoChannelMap) ? value.videoChannelMap : {}
        };
    }

    function sameChannel(rows, { id, handle }) {
        const idKey = lower(id);
        const handleValue = handleKey(handle);
        return rows.some(row => (idKey && row.id && row.id === idKey) || (handleValue && row.handle && row.handle === handleValue));
    }

    /** The attachment's channel ({id, handle}) when it is known; null otherwise. */
    function attachmentChannel(attachment, rules) {
        if (!isObject(attachment)) return null;
        const handle = typeof attachment.zaf === 'string' && attachment.zaf.startsWith('@') ? attachment.zaf : '';
        const id = typeof attachment.zav === 'string' && /^UC[\w-]{10,}$/.test(attachment.zav) ? attachment.zav : '';
        if (id || handle) return { id, handle };
        const videoId = typeof attachment.zal === 'string' ? attachment.zal : '';
        const mapped = videoId ? rules.videoChannelMap[videoId] : null;
        if (typeof mapped === 'string' && mapped) return mapped.startsWith('@') ? { id: '', handle: mapped } : { id: mapped, handle: '' };
        return null;
    }

    function namesAllowedChannel(value, rules) {
        return rules.allowedNamePatterns.some(pattern => pattern.test(value));
    }

    /** "alg" on the way to "algebra", "sat ma" on the way to "sat math". */
    function prefixOfTopic(value, rules) {
        if (value.length < 2) return false;
        return rules.topics.some(topic => topic.length > value.length && topic.startsWith(value))
            || rules.allowedNames.some(name => name.length > value.length && name.startsWith(value));
    }

    /**
     * One suggestion's fate: 'keep', 'drop' or 'strip' (keep the words, drop the picture).
     * `history` is the empty-q list of past searches.
     */
    function decide(entry, rules, { history = false } = {}) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string') return 'keep';
        const words = normalize(entry[0].replace(/<\/?b>/g, ''));
        if (!words) return 'keep';
        if (matchesAny(rules.blocked, words)) return 'drop';
        const attachment = entry.length > 3 ? entry[3] : null;
        const channel = attachmentChannel(attachment, rules);
        const blockedChannel = !!channel && sameChannel(rules.blockedChannels, channel);
        const allowedChannel = !!channel && sameChannel(rules.allowedChannels, channel);
        const restrict = rules.allowMode || (rules.kids && history);
        if (restrict) {
            const named = matchesAny(rules.allowed, words) || namesAllowedChannel(words, rules) || allowedChannel;
            const onTheWay = !history && prefixOfTopic(words, rules);
            if (!named && !onTheWay) return 'drop';
        }
        if (isObject(attachment)) {
            if (blockedChannel) return 'strip';
            // Kids: a picture stays only when its channel is known to be allowed.
            if (rules.kids && !allowedChannel && (attachment.zai || attachment.zal || attachment.zaq)) return 'strip';
        }
        return 'keep';
    }

    /** Allowed topics and channel names that start with what was typed and aren't suggested yet. */
    function additions(query, kept, rules) {
        if (!rules.allowMode) return [];
        const typed = normalize(query);
        if (!typed) return [];
        const present = new Set(kept.map(entry => normalize(String(entry?.[0] || '').replace(/<\/?b>/g, ''))));
        const out = [];
        for (const candidate of [...rules.topics, ...rules.allowedNames]) {
            if (out.length >= MAX_ADDED) break;
            if (candidate === typed || !candidate.startsWith(typed) || present.has(candidate)) continue;
            if (matchesAny(rules.blocked, candidate)) continue;
            present.add(candidate);
            out.push([candidate, 0, [512]]);
        }
        return out;
    }

    /** The payload ([q, entries, meta]) under the rules; returns {payload, changed, removed, stripped, added}. */
    function filterPayload(payload, rules) {
        if (!Array.isArray(payload) || !Array.isArray(payload[1])) return { payload, changed: false, removed: 0, stripped: 0, added: 0 };
        const query = typeof payload[0] === 'string' ? payload[0] : '';
        const history = normalize(query) === '';
        const kept = [];
        let removed = 0;
        let stripped = 0;
        for (const entry of payload[1]) {
            const verdict = decide(entry, rules, { history });
            if (verdict === 'drop') { removed++; continue; }
            if (verdict === 'strip') { stripped++; kept.push(entry.slice(0, 3)); continue; }
            kept.push(entry);
        }
        const added = additions(query, kept, rules);
        const changed = removed > 0 || stripped > 0 || added.length > 0;
        if (!changed) return { payload, changed: false, removed: 0, stripped: 0, added: 0 };
        const next = payload.slice();
        next[1] = [...kept, ...added];
        return { payload: next, changed: true, removed, stripped, added: added.length };
    }

    /** True when the settings could change a suggestion at all. */
    function hasWork(rules) {
        if (!rules || !rules.enabled) return false;
        return rules.allowMode || rules.kids || rules.blocked.length > 0 || rules.blockedChannels.length > 0;
    }

    /** The response text under the rules; the same string when nothing changes or it can't be read. */
    function filterResponseText(raw, settings, options = {}) {
        const rules = options.rules || compile(settings, options);
        if (!hasWork(rules)) return raw;
        const parsed = parse(raw);
        if (!parsed) return raw;
        const result = filterPayload(parsed.payload, rules);
        if (!result.changed) return raw;
        return serialize({ ...parsed, payload: result.payload });
    }

    /** True for the search box's suggestion request ("/complete/search?...ds=yt..." on the site's own host). */
    function isSuggestionUrl(url) {
        const value = String(url || '');
        return /\/complete\/search\?/.test(value) && /[?&](ds=yt|client=youtube)/.test(value);
    }

    return Object.freeze({ parse, serialize, compile, literalOf, decide, filterPayload, filterResponseText, hasWork, isSuggestionUrl, MAX_ADDED });
}));
