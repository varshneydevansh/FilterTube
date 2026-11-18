/* Search-box suggestions under the active rules (main world, before seed.js; isolated world for the
 * dropdown safety net in js/content/search_suggestions_dom.js).
 *
 * The search box asks /complete/search?...&q=<prefix> and gets JSONP:
 *   window.google.ac.h(["<q>", [[text, 0, [512, ...], {zae, zaf: "@handle", zai: picture, zao: name,
 *                                zav: "UC...", zal: videoId, ...}], ...], {"j": "4", "k": 1}])
 * With an empty q the list is the person's past searches, some with a picture.
 *
 * The text rule, allowsSearchText(settings, text), is Android's NativeOwnedFilterDecider.allowsSearchText
 * (RuleLayerDecision.allowsText) extended as the filter-modes review asks (FILTER_MODES_EDGE_CASES 5.2):
 * - Block list: hidden when a blocked word matches and no allowed word does.
 * - Allow list: shown only when an allowed word matches, or the text names an allowed channel (its name
 *   or @handle, whole word). Layered (allow and block, as Study is): any blocked word hides it.
 * - Study round: also a plan topic or one of its synonyms (study_engine.topicsForQuery: "cement" for
 *   GATE Civil), from settings.studySearchTerms; a rest break, the limit or a clock hold: nothing.
 * - Kids: the Kids matchers (the settings compiled for Kids), and never any picture.
 * - Words with a date window are not judged (a suggestion has no date), as on Android.
 * Typed suggestions (q not empty) in allow mode also keep a typed prefix of an allowed topic ("sat ma"),
 * and allowed topics or channel names that start with what was typed are added.
 *
 * Pictures (NativeMainSearchSuggestionArtworkAdmission, extended): a video picture stays only when the
 * video's channel is already known (videoChannelMap, never fetched per suggestion) and admitted (not
 * blocked; allowed in allow mode), and the picture is the video's canonical i.ytimg.com thumbnail. A
 * channel's own picture (zav/zaf) stays when that channel is admitted. Kids: never.
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
    const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
    const THUMBNAIL_PATH = /^\/(?:vi|vi_webp)\/([A-Za-z0-9_-]{11})\/(?:default|mqdefault|hqdefault|sddefault|maxresdefault|hq720)\.(?:jpg|webp)$/;
    const ATTACHMENT_KEYS = ['zai', 'zal', 'zaq', 'zam', 'zav', 'zaf'];

    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function lower(value) { return text(value).toLowerCase(); }
    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function normalize(value) { return lower(String(value || '').replace(/<\/?b>/g, '')).normalize('NFKC').replace(/\s+/g, ' '); }
    function handleKey(value) { return lower(value).replace(/^@/, ''); }
    function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

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
        if (!isPayload(payload)) return null;
        return { prefix, payload, suffix };
    }

    function isPayload(payload) {
        return Array.isArray(payload) && typeof payload[0] === 'string' && Array.isArray(payload[1]);
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
            if (!isObject(row) || row.managedListPaused === true) return null;
            return {
                id: lower(row.id || row.channelId),
                handle: handleKey(row.handle || row.canonicalHandle || row.handleDisplay),
                name: normalize(row.name || row.title)
            };
        }).filter(row => row && (row.id || row.handle || row.name));
    }

    /** Whole-word, any-case pattern for a phrase (letters and digits in any script). */
    function wordPattern(phrase) {
        const key = normalize(phrase);
        if (key.length < 2) return null;
        try {
            return new RegExp(`(?<![\\p{L}\\p{N}])${key.split(' ').map(escapeRegExp).join('\\s+')}(?![\\p{L}\\p{N}])`, 'iu');
        } catch (e) {
            return null;
        }
    }

    /** What the rules say about suggestions, worked out once per settings object. */
    function compile(settings, options = {}) {
        const value = isObject(settings) ? settings : {};
        const allowMode = value.listMode === 'whitelist';
        const kids = options.kids === true || value.profileType === 'kids';
        const study = isObject(value.study) ? value.study : null;
        const rest = study?.phase === 'rest';
        const studying = study?.phase === 'study';
        const blocked = (Array.isArray(value.filterKeywords) ? value.filterKeywords : [])
            .filter(item => !datedKeyword(item)).map(toRegex).filter(Boolean);
        const allowedItems = Array.isArray(value.whitelistKeywords) ? value.whitelistKeywords.filter(item => !datedKeyword(item)) : [];
        const allowed = allowedItems.map(toRegex).filter(Boolean);
        const topics = [];
        const seenTopics = new Set();
        const studyTerms = studying && Array.isArray(value.studySearchTerms) ? value.studySearchTerms : [];
        for (const candidate of [...allowedItems.map(literalOf), ...studyTerms]) {
            const key = candidate ? normalize(candidate) : '';
            if (!key || key.length < 2 || seenTopics.has(key)) continue;
            seenTopics.add(key);
            topics.push(key);
        }
        const blockedChannels = channelRows(value.filterChannels);
        const allowedChannels = channelRows(value.whitelistChannels);
        const allowedNames = [...new Set(allowedChannels.flatMap(row => [row.name, row.handle]).filter(name => name && name.length >= 2))];
        return {
            enabled: value.enabled !== false,
            // BLOCK_ONLY, ALLOW_ONLY or ALLOW_AND_BLOCK (Android RuleLayering).
            layering: !allowMode ? 'block' : (value.listLayered === true || studying ? 'layered' : 'allow'),
            allowMode,
            kids,
            rest,
            studying,
            blocked,
            allowed,
            topics,
            studyTermPatterns: studyTerms.map(wordPattern).filter(Boolean),
            studyTermKeys: studyTerms.map(normalize).filter(key => key.length >= 2),
            blockedChannels,
            allowedChannels,
            allowedNames,
            allowedNamePatterns: allowedNames.map(wordPattern).filter(Boolean),
            videoChannelMap: isObject(value.videoChannelMap) ? value.videoChannelMap : {}
        };
    }

    /** A Study term named whole in the text, or the whole text named in a term (topicsForQuery). */
    function studyTermHit(words, rules) {
        if (!rules.studying || !rules.studyTermPatterns.length) return false;
        if (rules.studyTermPatterns.some(pattern => pattern.test(words))) return true;
        const whole = wordPattern(words);
        return !!whole && rules.studyTermKeys.some(term => whole.test(term));
    }

    function allowedHit(words, rules) {
        return matchesAny(rules.allowed, words)
            || rules.allowedNamePatterns.some(pattern => pattern.test(words))
            || studyTermHit(words, rules);
    }

    /** Android RuleLayerDecision.allowsText for bare text, on compiled rules. */
    function allowsWords(words, rules) {
        if (!rules.enabled || !words) return true;
        if (rules.rest) return false;
        const blocked = matchesAny(rules.blocked, words);
        const allowed = rules.layering === 'block' ? matchesAny(rules.allowed, words) : allowedHit(words, rules);
        if (rules.layering === 'layered') return !blocked && allowed;
        if (!blocked && !allowed) return rules.layering === 'block';
        return allowed;
    }

    /** True when the settings let this search text show (suggestions, past searches, chips). */
    function allowsSearchText(settings, value, options = {}) {
        const rules = options.rules || compile(settings, options);
        return allowsWords(normalize(value), rules);
    }

    function sameChannel(rows, { id, handle }) {
        const idKey = lower(id);
        const handleValue = handleKey(handle);
        return rows.some(row => (idKey && row.id && row.id === idKey) || (handleValue && row.handle && row.handle === handleValue));
    }

    /** The attachment's channel ({id, handle, video}) when it is known without asking; null otherwise. */
    function attachmentChannel(attachment, rules) {
        if (!isObject(attachment)) return null;
        const videoId = typeof attachment.zal === 'string' ? attachment.zal : '';
        if (videoId) {
            const mapped = rules.videoChannelMap[videoId];
            if (typeof mapped !== 'string' || !mapped) return null;
            return mapped.startsWith('@') ? { id: '', handle: mapped, video: videoId } : { id: mapped, handle: '', video: videoId };
        }
        const handle = typeof attachment.zaf === 'string' && attachment.zaf.startsWith('@') ? attachment.zaf : '';
        const id = typeof attachment.zav === 'string' && /^UC[\w-]{10,}$/.test(attachment.zav) ? attachment.zav : '';
        return id || handle ? { id, handle, video: '' } : null;
    }

    /** The canonical thumbnail of that video (NativeMainSearchSuggestionArtwork.from). */
    function canonicalThumbnail(videoId, url) {
        if (!VIDEO_ID.test(String(videoId || ''))) return false;
        let parsed;
        try { parsed = new URL(String(url || '')); } catch (e) { return false; }
        if (parsed.protocol !== 'https:' || parsed.host !== 'i.ytimg.com' || parsed.username || parsed.password || parsed.hash) return false;
        const match = parsed.pathname.match(THUMBNAIL_PATH);
        return !!match && match[1] === videoId;
    }

    function hasAttachment(entry) {
        const attachment = Array.isArray(entry) && entry.length > 3 ? entry[3] : null;
        return isObject(attachment) && ATTACHMENT_KEYS.some(key => key in attachment);
    }

    /** True when the suggestion's picture may stay. */
    function admitsAttachment(attachment, rules) {
        if (!isObject(attachment) || rules.kids) return false;
        const channel = attachmentChannel(attachment, rules);
        if (!channel) return false;
        if (channel.video && !canonicalThumbnail(channel.video, attachment.zai)) return false;
        if (sameChannel(rules.blockedChannels, channel) && !(rules.layering === 'allow' && sameChannel(rules.allowedChannels, channel))) return false;
        if (rules.allowMode) return sameChannel(rules.allowedChannels, channel);
        return true;
    }

    /** "alg" on the way to "algebra", "sat ma" on the way to "sat math". */
    function prefixOfTopic(words, rules) {
        if (words.length < 2) return false;
        return rules.topics.some(topic => topic.length > words.length && topic.startsWith(words))
            || rules.allowedNames.some(name => name.length > words.length && name.startsWith(words));
    }

    /**
     * One suggestion's fate: 'keep', 'drop' or 'strip' (keep the words, drop the picture).
     * `history` is the empty-q list of past searches.
     */
    function decide(entry, rules, { history = false } = {}) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string') return 'keep';
        if (rules.rest) return 'drop';
        const words = normalize(entry[0]);
        if (!words) return 'keep';
        let shown = allowsWords(words, rules);
        if (!shown && rules.allowMode && !history && !matchesAny(rules.blocked, words) && prefixOfTopic(words, rules)) shown = true;
        // Kids: past searches only when they name something allowed.
        if (shown && rules.kids && history && !allowedHit(words, rules)) shown = false;
        if (!shown) return 'drop';
        if (hasAttachment(entry) && !admitsAttachment(entry[3], rules)) return 'strip';
        return 'keep';
    }

    /** Allowed topics and channel names that start with what was typed and aren't suggested yet. */
    function additions(query, kept, rules) {
        if (!rules.allowMode || rules.rest) return [];
        const typed = normalize(query);
        if (!typed) return [];
        const present = new Set(kept.map(entry => normalize(String(entry?.[0] || ''))));
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
        if (!isPayload(payload)) return { payload, changed: false, removed: 0, stripped: 0, added: 0 };
        const query = payload[0];
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

    /** The payload with no suggestions at all (fail closed, rest phase). */
    function emptyPayload(payload) {
        if (!isPayload(payload)) return payload;
        const next = payload.slice();
        next[1] = [];
        return next;
    }

    /** True when the settings could change a suggestion at all. */
    function hasWork(rules) {
        if (!rules || !rules.enabled) return false;
        return rules.allowMode || rules.kids || rules.rest || rules.blocked.length > 0 || rules.blockedChannels.length > 0
            || Object.keys(rules.videoChannelMap).length > 0;
    }

    /** The response text under the rules; the same string when nothing changes or it can't be read. */
    function filterResponseText(raw, settings, options = {}) {
        const parsed = parse(raw);
        if (!parsed) return raw;
        if (options.failClosed === true) {
            if (!parsed.payload[1].length) return raw;
            return serialize({ ...parsed, payload: emptyPayload(parsed.payload) });
        }
        const rules = options.rules || compile(settings, options);
        if (!hasWork(rules)) return raw;
        const result = filterPayload(parsed.payload, rules);
        if (!result.changed) return raw;
        return serialize({ ...parsed, payload: result.payload });
    }

    /** True for the search box's suggestion request ("/complete/search?...ds=yt..."). */
    function isSuggestionUrl(url) {
        const value = String(url || '');
        return /\/complete\/search\?/.test(value) && /[?&](ds=yt|client=youtube)/.test(value);
    }

    return Object.freeze({
        parse, serialize, compile, literalOf, allowsSearchText, admitsAttachment, canonicalThumbnail, decide,
        filterPayload, emptyPayload, filterResponseText, hasWork, isSuggestionUrl, MAX_ADDED
    });
}));
