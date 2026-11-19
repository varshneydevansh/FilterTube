/* The allow-list feed and the empty-feed guard (shared by the main world and the isolated world).
 *
 * Allow-list mode is the inverse of the block list: only allowed channels and words show. The site's
 * generic Home is built for someone else, so in allow-list mode it usually comes back fully hidden.
 * Android does not filter that page; it builds Home from the allowed sources (StudyHomeFeed,
 * NativeMainStudyHomeProvider, StudyFeedMix). This module is that builder for every allow-list
 * profile, Main or Kids; Study is one source of it (its plan's pack channels and topics are already
 * in the compiled allow list, so Study adds only its label).
 *
 * - The empty-feed guard and the rule-change check run in the main world (js/shared/feed_guard.js);
 *   this file is the isolated world's part.
 * - Feed builder: each allowed channel's public uploads feed (same-origin videos.xml), newest first,
 *   plus a few searches for allowed words through the site's own search; at most 3 requests at once,
 *   paced, cached locally for 60 minutes. Ranked as StudyHomeFeed.rank (titles naming a topic first,
 *   then newest); during study, non-lessons and other exams are left out (lessonTier below); in
 *   allowed-only mode spaced as StudyFeedMix.spaced (one channel never fills the screen).
 * - The study Home's label ("SAT + GMAT") and subject chips (StudyHomeFeed.chips), from the plan's packs.
 * Every built item still goes through the normal matcher in the isolated world before it shows.
 * Nothing here names the video site in UI text; there is no UI text here at all.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeAllowlistFeed) root.FilterTubeAllowlistFeed = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CACHE_TTL_MS = 60 * 60 * 1000;
    const CACHE_KEY = 'ftAllowFeedCacheV1';
    const CACHE_MAX_SOURCES = 80;
    const ITEMS_PER_CHANNEL = 15;
    const FIRST_BATCH = 9;
    const MAX_TOPIC_SEARCHES = 3;
    const MAX_CONCURRENT = 3;
    const MIN_GAP_MS = 250;
    const CHANNEL_SPACING = 3;
    const MAX_TOPICS = 200;


    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }

    /** "home" | "search" | "feed" | "channel" | "watch" | "other" for a pathname. */
    function routeKind(pathname) {
        const path = String(pathname || '/');
        if (path === '/' || path === '') return 'home';
        if (path === '/results') return 'search';
        if (path.startsWith('/watch') || path.startsWith('/shorts/') || path.startsWith('/live/')) return 'watch';
        if (path.startsWith('/feed/')) return 'feed';
        if (/^\/(@|channel\/|c\/|user\/)/.test(path)) return 'channel';
        return 'other';
    }

    /** The plain word of a compiled keyword ({pattern, flags}); '' for a real regular expression. */
    function keywordText(entry) {
        if (typeof entry === 'string') return entry.trim();
        if (!isObject(entry)) return '';
        if (typeof entry.word === 'string') return entry.word.trim();
        let raw = typeof entry.pattern === 'string' ? entry.pattern : '';
        const prefix = '(^|[^\\p{L}\\p{N}_])';
        const suffix = '(?=$|[^\\p{L}\\p{N}_])';
        if (raw.startsWith(prefix) && raw.endsWith(suffix)) raw = raw.slice(prefix.length, raw.length - suffix.length);
        else if (raw.startsWith('\\b') && raw.endsWith('\\b')) raw = raw.slice(2, -2);
        // Only escaped literal text: any bare regular-expression syntax means it isn't a plain word.
        if (/(^|[^\\])[.*+?^${}()|[\]]/.test(raw)) return '';
        return raw.replace(/\\(.)/g, '$1').trim();
    }

    function channelIdOf(row) {
        if (!isObject(row)) return '';
        for (const value of [row.id, row.channelId, row.originalInput]) {
            const id = text(value);
            if (/^UC[\w-]{22}$/.test(id)) return id;
        }
        return '';
    }

    /**
     * What the built feed may use: {allow, channels: [{id, handle, name}], topics, study}. Channels
     * without a channel id can't be read from the uploads feed and are left out; topics are the
     * allowed plain words (pack topics during Study).
     */
    function feedSources(settings) {
        const value = isObject(settings) ? settings : {};
        const allow = value.listMode === 'whitelist';
        const seen = new Set();
        const channels = [];
        for (const row of array(value.whitelistChannels)) {
            const id = channelIdOf(row);
            if (!id || seen.has(id)) continue;
            seen.add(id);
            channels.push({ id, handle: text(row.handleDisplay) || text(row.canonicalHandle) || text(row.handle), name: text(row.name) });
        }
        const topics = [];
        const topicSeen = new Set();
        for (const entry of array(value.whitelistKeywords)) {
            const word = keywordText(entry);
            const key = word.toLowerCase();
            if (word.length < 2 || topicSeen.has(key)) continue;
            topicSeen.add(key);
            topics.push(word);
            if (topics.length >= MAX_TOPICS) break;
        }
        const study = isObject(value.study) && value.study.phase === 'study';
        return { allow, channels: allow ? channels : [], topics: allow ? topics : [], study };
    }

    function decodeXml(value) {
        return String(value || '')
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/&#(\d+);/g, (m, code) => String.fromCodePoint(Number(code)))
            .replace(/&#x([0-9a-f]+);/gi, (m, code) => String.fromCodePoint(parseInt(code, 16)))
            .replace(/&amp;/g, '&');
    }
    function tag(block, name) {
        const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block);
        return match ? decodeXml(match[1]).trim() : '';
    }
    function attr(block, name, attribute) {
        const match = new RegExp(`<${name}\\s[^>]*${attribute}="([^"]*)"`).exec(block);
        return match ? decodeXml(match[1]) : '';
    }

    /** A channel's public uploads feed (Atom) as items, Shorts left out (Home lists videos). */
    function parseUploadsFeed(xml) {
        const source = String(xml || '');
        const feedChannelName = tag(source.split('<entry')[0] || '', 'name') || tag(source.split('<entry')[0] || '', 'title');
        const items = [];
        const entries = source.split('<entry>').slice(1);
        for (const raw of entries) {
            const block = raw.split('</entry>')[0];
            const videoId = tag(block, 'yt:videoId');
            if (!/^[\w-]{11}$/.test(videoId)) continue;
            const link = attr(block, 'link', 'href');
            if (/\/shorts\//.test(link)) continue;
            const published = Date.parse(tag(block, 'published'));
            items.push({
                videoId,
                title: tag(block, 'title') || tag(block, 'media:title'),
                channelId: tag(block, 'yt:channelId'),
                channelName: tag(block, 'name') || feedChannelName,
                publishedAt: Number.isFinite(published) ? published : null,
                views: Number(attr(block, 'media:statistics', 'views')) || null,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            });
        }
        return items;
    }

    function runsText(value) {
        if (!value) return '';
        if (typeof value.simpleText === 'string') return value.simpleText;
        if (Array.isArray(value.runs)) return value.runs.map(run => run?.text || '').join('');
        if (typeof value.content === 'string') return value.content;
        return '';
    }

    /** Video results of a site search response (videoRenderer and lockupViewModel cards). */
    function parseSearchResults(json) {
        const items = [];
        const stack = [[json, 0]];
        while (stack.length && items.length < 40) {
            const [node, depth] = stack.pop();
            if (!node || typeof node !== 'object' || depth > 40) continue;
            if (Array.isArray(node)) { for (let i = node.length - 1; i >= 0; i -= 1) stack.push([node[i], depth + 1]); continue; }
            if (isObject(node.videoRenderer)) {
                const video = node.videoRenderer;
                const owner = array(video.ownerText?.runs)[0] || array(video.longBylineText?.runs)[0] || {};
                const browse = owner.navigationEndpoint?.browseEndpoint || {};
                if (/^[\w-]{11}$/.test(String(video.videoId || ''))) {
                    items.push({
                        videoId: video.videoId,
                        title: runsText(video.title),
                        channelId: text(browse.browseId),
                        channelHandle: text(browse.canonicalBaseUrl).replace(/^\//, ''),
                        channelName: text(owner.text),
                        publishedText: runsText(video.publishedTimeText),
                        publishedAt: null,
                        lengthText: runsText(video.lengthText),
                        thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
                    });
                }
                continue;
            }
            for (const value of Object.values(node)) if (value && typeof value === 'object') stack.push([value, depth + 1]);
        }
        return items;
    }

    function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    /** Whole-word, case-insensitive patterns for topics (letters and digits in any script). */
    function topicPatterns(topics) {
        const seen = new Set();
        const out = [];
        for (const topic of array(topics)) {
            const key = text(topic).toLowerCase().replace(/\s+/g, ' ');
            if (key.length < 2 || seen.has(key)) continue;
            seen.add(key);
            out.push(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(key).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu'));
            if (out.length >= MAX_TOPICS) break;
        }
        return out;
    }

    function relevance(title, patterns) { return patterns.reduce((count, pattern) => count + (pattern.test(String(title || '')) ? 1 : 0), 0); }

    /*
     * Lesson relevance (owner, 2026-11-19, from a SAT + GMAT feed full of greetings, GRE drills and campus
     * tours). Android StudyHomeFeed.rank puts titles naming a plan topic first; the rest keeps upload order.
     * The extension splits that rest further, still title-only like the app:
     * - a clear non-lesson (a holiday greeting, a stream placeholder, a spelling bee) is left out;
     * - a title naming another exam (GRE in a SAT + GMAT plan) and none of the plan's own is left out too,
     *   even when a shared word ("practice test") matches: plan channels that also teach other exams
     *   (Magoosh, Manhattan Prep, Kaplan) would otherwise fill the feed with them;
     * - a likely non-lesson (a webinar for teachers, an admissions tour, a note to parents) goes last.
     * Within each tier the newest comes first, as in the app. If leaving titles out would leave nothing,
     * they all stay (ranked), so the feed is never empty because of this.
     */
    const DROP_TITLES = [
        /\bhappy\b[^|]{0,40}\b(day|week|month|holidays?|new\s+year|thanksgiving|halloween|diwali|eid|christmas|hanukkah|easter|lunar\s+new\s+year)\b/iu,
        /\b(merry\s+christmas|season['’]?s\s+greetings|juneteenth)\b/iu,
        /\b(live\s*)?stream\s+will\s+(begin|start)\b/iu,
        /\b(will\s+begin|starting)\s+(shortly|soon)\b/iu,
        /\bspelling\s+bee\b/iu
    ];
    const LATER_TITLES = [
        /\bwebinar\b/iu,
        /\binside\s+look\b/iu,
        /\b(campus|virtual|college)\s+tour\b/iu,
        /\b(for|to)\s+(educators|teachers|parents)\b/iu,
        /\b(educators|teachers)\s*:/iu,
        /\bself[-\s]care\b/iu,
        /\bparents\b/iu,
        /^the\s+future\s+is\b/iu,
        /\b(teacher|educator)s?['’]?\s+(appreciation|day)\b/iu
    ];
    // Uploads about the road around a test rather than the test (admissions fairs, college rankings, jobs,
    // testimonials): after the neutral uploads, unless the title names a plan topic ("MBA admissions").
    const SOFT_LATER_TITLES = [
        /\badmissions?\b/iu,
        /\b(best|top)\b[^|]{0,30}\bcolleges\b/iu,
        /\b(job|jobs|career|hired)\b/iu,
        /\b(fair|testimonial|mental\s+health)\b/iu
    ];
    // Exam names. Short ones that are also English words match only in capitals ("ACT", not "act").
    const EXAMS = ['sat', 'psat', 'gre', 'gmat', 'lsat', 'mcat', 'toefl', 'ielts', 'pte', 'duolingo english test', 'ged', 'praxis',
        'gate', 'jee', 'neet', 'upsc', 'clat', 'cuet', 'cfa', 'cpa', 'acca', 'gaokao', 'suneung'];
    const CAPITAL_EXAMS = ['ACT', 'CAT', 'AP', 'IB', 'DAT', 'OAT', 'PCAT', 'SSC'];

    function examPattern(name, capital) {
        return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, capital ? 'u' : 'iu');
    }
    const EXAM_PATTERNS = [...EXAMS.map(name => ({ key: name, pattern: examPattern(name, false) })),
        ...CAPITAL_EXAMS.map(name => ({ key: name.toLowerCase(), pattern: examPattern(name, true) }))];

    /** The exams a plan studies: exam names among its topics ("sat", "digital sat", "gmat focus"). */
    function planExams(topics) {
        const out = new Set();
        for (const topic of array(topics)) {
            const value = text(topic);
            for (const exam of EXAM_PATTERNS) if (exam.pattern.test(value) || exam.pattern.test(value.toUpperCase())) out.add(exam.key);
        }
        return out;
    }

    /** {tier, drop} for a title: 3 names a plan topic, 2 neutral, 1 a likely non-lesson; another exam only is dropped. */
    function lessonTier(title, patterns, exams) {
        const value = String(title || '');
        if (DROP_TITLES.some(pattern => pattern.test(value))) return { tier: -1, drop: true };
        const named = EXAM_PATTERNS.filter(exam => exam.pattern.test(value)).map(exam => exam.key);
        // Only when the plan names its exams: an allow list without exam names keeps every exam.
        const otherExamOnly = exams.size > 0 && named.length > 0 && !named.some(key => exams.has(key));
        if (otherExamOnly) return { tier: 0, drop: true };
        if (LATER_TITLES.some(pattern => pattern.test(value))) return { tier: 1, drop: false };
        if (relevance(value, patterns) > 0) return { tier: 3, drop: false };
        return { tier: SOFT_LATER_TITLES.some(pattern => pattern.test(value)) ? 1 : 2, drop: false };
    }

    /**
     * StudyHomeFeed.rank with the lesson tiers above: plan topics first, then neutral uploads, then likely
     * non-lessons; newest first in each. Clear non-lessons and other exams are left out, unless that would
     * leave nothing at all. Without `lessons` (Allowed only, outside study) it is the app's two buckets only:
     * the person chose those channels, so nothing of theirs is left out.
     */
    function rank(items, topics, { lessons = true } = {}) {
        const patterns = topicPatterns(topics);
        const exams = planExams(topics);
        const scored = array(items).map((item, index) => (lessons
            ? { item, index, ...lessonTier(item?.title, patterns, exams) }
            : { item, index, tier: relevance(item?.title, patterns) > 0 ? 1 : 0, drop: false }));
        const kept = scored.filter(entry => !entry.drop);
        return (kept.length ? kept : scored)
            .sort((a, b) => (b.tier - a.tier)
                || ((b.item.publishedAt ?? -Infinity) - (a.item.publishedAt ?? -Infinity))
                || (a.index - b.index))
            .map(entry => entry.item);
    }

    /*
     * The study Home's subject chips (Android StudyHomeFeed.chips/query/fallbackChips): the chosen
     * variant's chips, else the pack's, else its keywords without the meta words and the exam's own name.
     * Each runs "<subject> <exam>" as a search. packs: [{id, shortName, names, chips, keywords}].
     */
    const MAX_CHIPS = 14;
    const META = new Set(['pyq', 'previous year questions', 'previous year papers', 'past papers', 'mock test', 'mock tests', 'test series',
        'tier 1', 'tier 2', 'answer writing', 'optional', 'ncert', 'syllabus', 'exam', 'exam preparation', 'preparation', 'revision',
        'notes', 'tips', 'strategy', 'toppers', 'result']);

    /** StudyPackLabels.short: "GMAT (Focus Edition)" -> "GMAT", "UPSC Civil Services" -> "UPSC". */
    function shortExamName(pack) {
        const own = text(pack?.shortName);
        if (own) return own;
        const names = isObject(pack?.names) ? pack.names : (isObject(pack?.name) ? pack.name : {});
        const name = text(names.en || Object.values(names)[0] || pack?.id).split(': ').pop();
        const plain = name.split(' (')[0].trim() || name.trim();
        const words = plain.split(/\s+/);
        return words.length >= 3 && /^[A-Z][A-Z0-9-]+$/.test(words[0]) && !/^\d/.test(words[1]) && words[1].toLowerCase() !== 'class'
            ? words[0] : plain;
    }

    /** The plan's name for the study Home and the mode bar: "SAT", "SAT + GMAT", "SAT + 2". */
    function studyLabel(packs) {
        const names = array(packs).map(shortExamName).filter(Boolean);
        if (!names.length) return '';
        if (names.length <= 2) return names.join(' + ');
        return `${names[0]} + ${names.length - 1}`;
    }

    function chipQuery(chip, exam) {
        const subject = text(chip).toLowerCase();
        const name = text(exam).toLowerCase();
        return !name || subject.split(' ').includes(name) ? subject : `${subject} ${name}`;
    }

    function homeChips(packs) {
        const out = [];
        const seen = new Set();
        for (const pack of array(packs)) {
            const exam = shortExamName(pack);
            let labels = array(pack?.chips).map(text).filter(Boolean);
            if (!labels.length) {
                const examWords = new Set([exam, pack?.id, ...Object.values(isObject(pack?.names) ? pack.names : {})]
                    .flatMap(value => text(value).toLowerCase().split(/[^\p{L}\p{N}]+/u)).filter(word => word.length >= 2));
                labels = array(pack?.keywords).map(text).filter(word => {
                    const key = word.toLowerCase().replace(/\s+/g, ' ');
                    return word && !META.has(key) && !key.endsWith(' pyq') && !key.split(' ').some(part => examWords.has(part));
                }).map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1));
            }
            for (const label of labels) {
                const key = label.toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);
                out.push({ label, query: chipQuery(label, exam) });
                if (out.length >= MAX_CHIPS) return out;
            }
        }
        return out;
    }

    /** StudyFeedMix.spaced: the same channel doesn't come back within `spacing` items while another can fill it. */
    function spaced(items, spacing = CHANNEL_SPACING, key = item => item.channelId || item.channelName || '') {
        const queues = new Map();
        for (const item of array(items)) {
            const k = key(item);
            if (!queues.has(k)) queues.set(k, []);
            queues.get(k).push(item);
        }
        const out = [];
        const recent = [];
        const total = array(items).length;
        while (out.length < total) {
            const live = [...queues.entries()].filter(([, list]) => list.length);
            const window = Math.max(0, Math.min(spacing - 1, live.length - 1));
            const blocked = new Set(recent.slice(recent.length - window));
            let pick = null;
            for (const entry of live) {
                if (window && blocked.has(entry[0])) continue;
                if (!pick || entry[1].length > pick[1].length) pick = entry;
            }
            if (!pick) pick = live[0];
            out.push(pick[1].shift());
            recent.push(pick[0]);
            if (recent.length > spacing) recent.shift();
        }
        return out;
    }

    /** StudyFeedMix.dailyOrder: channels rotated by a seed of the plan and the day (stable all day). */
    function dailyOrder(channels, planKey, nowMs) {
        const list = array(channels);
        if (list.length < 2) return list;
        let hash = 0;
        for (const ch of String(planKey || '')) hash = (Math.imul(hash, 31) + ch.codePointAt(0)) | 0;
        const day = Math.floor(Number(nowMs || 0) / 86400000);
        const seed = ((hash * 31 + day) % list.length + list.length) % list.length;
        return list.slice(seed).concat(list.slice(0, seed));
    }

    /** At most `maxConcurrent` jobs at once, at least `minGapMs` between starts. */
    function createLimiter({ maxConcurrent = MAX_CONCURRENT, minGapMs = MIN_GAP_MS, now = () => Date.now(), wait } = {}) {
        const sleep = wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
        let active = 0;
        let lastStart = -Infinity;
        const queue = [];
        let peak = 0;
        async function pump() {
            while (active < maxConcurrent && queue.length) {
                const job = queue.shift();
                active += 1;
                peak = Math.max(peak, active);
                const gap = lastStart + minGapMs - now();
                lastStart = Math.max(now(), lastStart + minGapMs);
                (async () => {
                    try {
                        if (gap > 0) await sleep(gap);
                        job.resolve(await job.run());
                    } catch (error) {
                        job.reject(error);
                    } finally {
                        active -= 1;
                        pump();
                    }
                })();
            }
        }
        return {
            run(task) { return new Promise((resolve, reject) => { queue.push({ run: task, resolve, reject }); pump(); }); },
            peak: () => peak
        };
    }

    function planKey(sources) {
        return `${sources.channels.map(ch => ch.id).join(',')}|${sources.topics.slice(0, 20).join(',')}`;
    }

    /**
     * The builder. deps: fetchText(url) -> text, searchJson(query) -> json, storage {get(key), set(obj)}
     * (chrome.storage.local shaped, promise based), now(). build(sources, {batch}) returns
     * {items, attempted, failed, fromCache, key}.
     */
    function createFeedBuilder(deps = {}) {
        const now = deps.now || (() => Date.now());
        const limiter = deps.limiter || createLimiter({ now });
        let memory = null;

        async function readCache() {
            if (memory) return memory;
            try {
                const stored = await deps.storage?.get?.(CACHE_KEY);
                memory = isObject(stored?.[CACHE_KEY]) ? stored[CACHE_KEY] : {};
            } catch (e) {
                memory = {};
            }
            return memory;
        }
        async function writeCache(cache) {
            const entries = Object.entries(cache).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, CACHE_MAX_SOURCES);
            memory = Object.fromEntries(entries);
            try { await deps.storage?.set?.({ [CACHE_KEY]: memory }); } catch (e) { }
        }
        function fresh(entry) { return isObject(entry) && Array.isArray(entry.items) && now() - Number(entry.at || 0) < CACHE_TTL_MS; }

        async function channelItems(channel, cache, stats) {
            const cacheKey = `c:${channel.id}`;
            if (fresh(cache[cacheKey])) { stats.fromCache += 1; return cache[cacheKey].items; }
            stats.attempted += 1;
            try {
                const xml = await limiter.run(() => deps.fetchText(`/feeds/videos.xml?channel_id=${encodeURIComponent(channel.id)}`));
                const items = parseUploadsFeed(xml).slice(0, ITEMS_PER_CHANNEL)
                    .map(item => ({ ...item, channelId: item.channelId || channel.id, channelName: item.channelName || channel.name, channelHandle: channel.handle || '' }));
                cache[cacheKey] = { at: now(), items };
                return items;
            } catch (e) {
                stats.failed += 1;
                return [];
            }
        }

        async function topicItems(topic, cache, stats) {
            const cacheKey = `s:${topic.toLowerCase()}`;
            if (fresh(cache[cacheKey])) { stats.fromCache += 1; return cache[cacheKey].items; }
            if (typeof deps.searchJson !== 'function') return [];
            stats.attempted += 1;
            try {
                const json = await limiter.run(() => deps.searchJson(topic));
                const items = parseSearchResults(json).slice(0, 12);
                cache[cacheKey] = { at: now(), items };
                return items;
            } catch (e) {
                stats.failed += 1;
                return [];
            }
        }

        async function build(sources, { batch = FIRST_BATCH, offset = 0, searches = MAX_TOPIC_SEARCHES } = {}) {
            const key = planKey(sources);
            const order = dailyOrder(sources.channels, key, now());
            const step = order.slice(offset, offset + batch);
            const cache = await readCache();
            const stats = { attempted: 0, failed: 0, fromCache: 0 };
            const lists = await Promise.all(step.map(channel => channelItems(channel, cache, stats)));
            // Searches for allowed words when the channels alone give little (or there are none).
            const topics = offset === 0 ? dailyOrder(sources.topics, key, now()).slice(0, searches) : [];
            const searched = lists.flat().length < 12 || !sources.channels.length
                ? await Promise.all(topics.map(topic => topicItems(topic, cache, stats)))
                : [];
            await writeCache(cache);
            const seen = new Set();
            const merged = [];
            for (const item of [...lists.flat(), ...searched.flat()]) {
                if (!item || seen.has(item.videoId)) continue;
                seen.add(item.videoId);
                merged.push(item);
            }
            // Study keeps the rank order (Android StudyHomeFeed ranks uploads and spaces only Shorts); the
            // allowed-only feed is also spaced, so one busy channel doesn't fill the screen.
            const items = sources.study === true
                ? rank(merged, sources.topics, { lessons: true })
                : spaced(rank(merged, sources.topics, { lessons: false }));
            return { key, items, attempted: stats.attempted, failed: stats.failed, fromCache: stats.fromCache,
                nextOffset: offset + step.length < order.length ? offset + step.length : null,
                unreachable: stats.attempted > 0 && stats.failed === stats.attempted && !items.length };
        }

        return { build, readCache, clear: () => { memory = {}; return writeCache({}); } };
    }

    return Object.freeze({
        CACHE_TTL_MS, CACHE_KEY, MAX_CONCURRENT, FIRST_BATCH, ITEMS_PER_CHANNEL,
        routeKind, keywordText, feedSources, parseUploadsFeed, parseSearchResults,
        topicPatterns, rank, lessonTier, planExams, homeChips, shortExamName, studyLabel, chipQuery, spaced, dailyOrder, createLimiter, createFeedBuilder
    });
}));
