/* The narrowed mode (owner, 2026-11-19): one layer for Allowed only and Study.
 *
 * Allowed only is the superset: only the allowed channels and words show. A study round is a narrower
 * case of it: the background compiles the plan into the same allow list (Android
 * StudyEffectiveRules.studyProfile: the plan's channels and the person's own allowed channels, the plan's
 * topics instead of their own words, block lists kept). So every page asks one question, once: which
 * narrowed mode is on, and what does this page do in it. This file answers it; the page controller
 * (js/content/narrowed_view.js) and the Home feed (js/content/allowlist_feed_view.js) only draw.
 *
 * Page x mode (none = the profile's block list; study = a study round; rest = a break or the limit,
 * which js/content/study_overlay.js owns):
 *
 *   page        allow                                         study
 *   home        built feed owns the page body (site grid,      built study feed, ranked by plan topic;
 *               chip bar, shelves, loader hidden in place)     mode strip; plan subject chips -> search
 *   search      allowed channels' shelf first, a calm line     plan channels' shelf first, "anything
 *               for the rest, empty shelves folded             else waits until study ends"
 *   watch       mode bar; a video outside the list is held      mode bar with round, time left, End;
 *               ("Not on your allowed list")                   outside the plan: "Not part of today's study"
 *   channel     an allowed channel shows; others held          a plan channel shows; others held
 *   guide       Home, Shorts, Subscriptions, You, History;     same, "Study channels"
 *               Explore and the product links hidden;
 *               the allowed channels as the channel list
 * Every page: changes are in place, per element; leaving the mode removes the attribute and the
 * FilterTube elements, so the site's own page is exactly as it was.
 * Nothing here names the video site in UI text; there is no UI text here at all.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeNarrowedMode) root.FilterTubeNarrowedMode = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function handleKey(value) {
        const raw = text(value).toLowerCase();
        if (!raw) return '';
        return raw.startsWith('@') ? raw : `@${raw}`;
    }

    /** The plain word of a compiled allow keyword ({pattern, flags}); '' for a real regular expression. */
    function keywordWord(entry) {
        if (typeof entry === 'string') return entry.trim();
        if (!isObject(entry)) return '';
        if (typeof entry.word === 'string') return entry.word.trim();
        let raw = typeof entry.pattern === 'string' ? entry.pattern : '';
        const prefix = '(^|[^\\p{L}\\p{N}_])';
        const suffix = '(?=$|[^\\p{L}\\p{N}_])';
        if (raw.startsWith(prefix) && raw.endsWith(suffix)) raw = raw.slice(prefix.length, raw.length - suffix.length);
        else if (raw.startsWith('\\b') && raw.endsWith('\\b')) raw = raw.slice(2, -2);
        if (/(^|[^\\])[.*+?^${}()|[\]]/.test(raw)) return '';
        return raw.replace(/\\(.)/g, '$1').trim();
    }

    /**
     * The narrowed mode of compiled settings:
     * {kind: 'none'|'allow'|'study'|'rest', channels: [{id, handle, name, plan}], words: [...], key}.
     * "rest" (a break, the limit, a clock hold) narrows to nothing; the study overlay draws it.
     */
    function modeOf(settings) {
        const value = isObject(settings) ? settings : {};
        const none = { kind: 'none', channels: [], words: [], key: 'none' };
        if (!isObject(settings) || value.enabled === false) return none;
        const study = isObject(value.study) ? value.study : null;
        const phase = text(study?.phase);
        if (phase === 'rest') return { ...none, kind: 'rest', key: 'rest' };
        const studying = phase === 'study';
        if (!studying && value.listMode !== 'whitelist') return none;
        const channels = [];
        const seen = new Set();
        for (const row of array(value.whitelistChannels)) {
            if (!isObject(row)) continue;
            const id = /^UC[\w-]{22}$/.test(text(row.id)) ? text(row.id) : '';
            const handle = handleKey(row.handleDisplay || row.canonicalHandle || row.handle);
            const key = id || handle;
            if (!key || seen.has(key)) continue;
            seen.add(key);
            channels.push({ id, handle, name: text(row.name), plan: text(row.source) === 'study_pack' });
        }
        const words = [];
        const wordSeen = new Set();
        for (const entry of array(value.whitelistKeywords)) {
            const word = keywordWord(entry);
            const key = word.toLowerCase();
            if (word.length < 2 || wordSeen.has(key)) continue;
            wordSeen.add(key);
            words.push(word);
        }
        const kind = studying ? 'study' : 'allow';
        return { kind, channels, words, key: `${kind}|${channels.map(ch => ch.id || ch.handle).join(',')}|${words.length}` };
    }

    function narrowed(mode) { return mode?.kind === 'allow' || mode?.kind === 'study'; }

    /** The page kind of a path. */
    function pageOf(pathname) {
        const path = String(pathname || '/');
        if (path === '/' || path === '') return 'home';
        if (path === '/results') return 'search';
        if (path === '/watch' || path.startsWith('/live/')) return 'watch';
        if (path.startsWith('/shorts')) return 'shorts';
        if (path === '/feed/subscriptions') return 'subscriptions';
        if (path === '/feed/history') return 'history';
        if (path === '/playlist') return 'playlist';
        if (path.startsWith('/feed/')) return 'feed';
        if (/^\/(@[^/]+|channel\/UC[\w-]{22}|c\/[^/]+|user\/[^/]+)(\/|$)/.test(path)) return 'channel';
        return 'other';
    }

    /**
     * The behaviour table above as data: what this page does in this mode. Every flag is false outside a
     * narrowed mode, so the site's page is left as it is.
     */
    function pagePlan(mode, page) {
        const on = narrowed(mode);
        const study = mode?.kind === 'study';
        return Object.freeze({
            narrowed: on,
            kind: on ? mode.kind : 'none',
            page,
            builtFeed: on && page === 'home',
            hideSiteFeed: on && page === 'home',
            searchShelf: on && page === 'search',
            searchLine: on && page === 'search',
            modeBar: on && (page === 'watch' || page === 'home'),
            holdChannel: on && page === 'channel',
            guide: on,
            hideExplore: on,
            hideSearchShelves: on && page === 'search',
            studyCopy: study
        });
    }

    /** True when a channel ({id, handle}) is one of the mode's channels. */
    function channelInMode(mode, meta) {
        if (!narrowed(mode) || !isObject(meta)) return false;
        const id = text(meta.id || meta.channelId);
        const handle = handleKey(meta.handle || meta.channelHandle);
        return mode.channels.some(ch => (id && ch.id === id) || (handle && ch.handle === handle));
    }

    function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    /**
     * Why a video shows in the mode (for the mode bar): {kind: 'plan'|'own'|'word'|'none', word, channel}.
     * A channel of the plan reads "From your plan"; the person's own allowed channel "From your allowed
     * channels"; a title naming an allowed word or topic (whole word, as the filters match it) names it.
     */
    function whyShown(mode, video) {
        if (!narrowed(mode) || !isObject(video)) return { kind: 'none', word: '', channel: null };
        const id = text(video.channelId);
        const handle = handleKey(video.channelHandle);
        const channel = mode.channels.find(ch => (id && ch.id === id) || (handle && ch.handle === handle)) || null;
        if (channel) return { kind: channel.plan ? 'plan' : 'own', word: '', channel };
        const title = String(video.title || '');
        // The longest word that matches reads best ("gmat focus" over "gmat").
        const words = [...mode.words].sort((a, b) => b.length - a.length);
        for (const word of words) {
            const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu');
            // The word as the title writes it ("GMAT", not the stored "gmat").
            const found = pattern.exec(title);
            if (found) return { kind: 'word', word: found[0].replace(/\s+/g, ' '), channel: null };
        }
        return { kind: 'none', word: '', channel: null };
    }

    /*
     * The left pane. Sections are recognised by the links in them, so it works in any language:
     * - explore: a section with Trending, Movies, Gaming, the topic destinations (Music, Live, Sports,
     *   News, Learning, Fashion), Podcasts, Playables or Courses;
     * - more: the product links (Premium, Music, Kids, Studio, Labs);
     * - subscriptions: a section of channel links only (the signed-in channel list);
     * - main / you / settings: everything else stays.
     */
    const EXPLORE_HREFS = ['/feed/explore', '/feed/trending', '/feed/storefront', '/gaming', '/feed/news_destination',
        '/feed/sports_destination', '/feed/learning_destination', '/feed/fashion_destination', '/podcasts', '/playables',
        '/feed/courses_destination', '/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ', '/channel/UC4R8DWoMoI7CAwX8_LjQHig',
        '/channel/UCEgdi0XIXXZ-qJOFPf4JSKw', '/channel/UCOpNcN46UbXVtpKMrmU4Abg', '/channel/UCYfdidRxbB8Qhf0Nx7ioOYw',
        '/channel/UCtFRv9O2AHqOZjjynzrv-xg', '/channel/UCrpQ4p1Ql_hG8rKXIKM1MOQ'];
    const MORE_HREFS = ['/premium', 'music.youtube.com', 'youtubekids.com', 'studio.youtube.com', '/labs', '/new', 'tv.youtube.com'];
    const KEEP_HREFS = ['/', '/feed/subscriptions', '/feed/you', '/feed/history', '/feed/playlists', '/playlist?list=WL',
        '/playlist?list=LL', '/feed/downloads', '/feed/clips', '/shorts', '/account', '/reporthistory'];

    function hrefMatches(href, list) {
        const value = String(href || '');
        return list.some(entry => (entry.startsWith('/') ? (value === entry || value.startsWith(`${entry}?`) || value.startsWith(`${entry}/`)) : value.includes(entry)));
    }

    /** 'explore' | 'more' | 'subscriptions' | 'keep' for a guide section's link hrefs. */
    function guideSectionKind(hrefs) {
        const list = array(hrefs).map(href => String(href || '')).filter(Boolean);
        if (!list.length) return 'keep';
        if (list.some(href => hrefMatches(href, KEEP_HREFS))) return 'keep';
        if (list.some(href => hrefMatches(href, MORE_HREFS))) return 'more';
        if (list.some(href => hrefMatches(href, EXPLORE_HREFS))) return 'explore';
        if (list.some(href => /^\/(@|channel\/UC)/.test(href))) return 'subscriptions';
        return 'keep';
    }

    /** What a narrowed mode does with a guide section: hide Explore, the product links and the site's channel list. */
    function guideSectionAction(mode, kind) {
        if (!narrowed(mode)) return 'show';
        return kind === 'explore' || kind === 'more' || kind === 'subscriptions' ? 'hide' : 'show';
    }

    function hasLink(hrefs) {
        return hrefs.map(href => (href.startsWith('/')
            ? `a[href="${href}"],a[href^="${href}?"]`
            : `a[href*="${href}"]`)).join(',');
    }

    /**
     * The narrowed mode's page CSS, gated on html[attr] (the mode) and html[attr-page] (the page), so
     * removing the attributes restores the site exactly. `guideId` is FilterTube's own channel list.
     */
    function narrowedCss(attr, { guideId } = {}) {
        const on = `html[${attr}]`;
        const home = `html[${attr}][${attr}-page="home"] ytd-browse[page-subtype="home"]`;
        const search = `html[${attr}][${attr}-page="search"] ytd-search`;
        return [
            // Home: the built feed owns the page body. The site's grid (its chip bar, shelves, the cards the
            // filters hid and the loader) is hidden in place, so it never loads more or shows a second bar.
            `${home} ytd-rich-grid-renderer,`,
            `${home} ytd-feed-filter-chip-bar-renderer,`,
            `${home} > #header #chips-wrapper{display:none!important}`,
            // The app's frosted backdrop is as tall as masthead + chip bar while the chip bar shows; it would
            // cover the feed's first row. Masthead height only.
            `html[${attr}][${attr}-page="home"] #frosted-glass.with-chipbar{height:var(--ytd-masthead-height,56px)!important}`,
            // Search: the site's shelves (Shorts rows, "People also watched") are off, as on Android.
            `${search} grid-shelf-view-model,`,
            `${search} ytd-reel-shelf-renderer,`,
            `${search} ytd-shelf-renderer,`,
            `${search} ytd-horizontal-card-list-renderer{display:none!important}`,
            // Once the feed guard has stopped a page that only came back hidden, its loader goes too.
            `html[${attr}][${attr}-done] ytd-continuation-item-renderer{display:none!important}`,
            // Left pane: Explore, the product links and the site's own channel list.
            `${on} ytd-guide-section-renderer:has(${hasLink(EXPLORE_HREFS)}),`,
            `${on} ytd-guide-section-renderer:has(${hasLink(MORE_HREFS)}),`,
            `${on} ytd-guide-section-renderer:has(a[href^="/@"]):not(:has(a[href="/feed/history"],a[href="/feed/you"],a[href="/"])),`,
            `${on} ytd-mini-guide-entry-renderer:has(${hasLink(EXPLORE_HREFS)}){display:none!important}`,
            guideId ? `html:not([${attr}]) #${guideId}{display:none!important}` : ''
        ].filter(Boolean).join('\n');
    }

    /** CSS that folds a site shelf whose cards were all hidden (no empty "Shorts" headers), in any mode. */
    function emptyShelfCss() {
        const visible = ':not([data-filtertube-hidden]):not(.filtertube-hidden)';
        return [
            `grid-shelf-view-model:not(:has(.ytGridShelfViewModelGridShelfRow > ${visible})),`,
            `ytd-rich-shelf-renderer:not(:has(#contents > ytd-rich-item-renderer${visible})),`,
            `ytd-rich-section-renderer:has(> #content > ytd-rich-shelf-renderer):not(:has(ytd-rich-item-renderer${visible})),`,
            `ytd-reel-shelf-renderer:not(:has(#items > ${visible})){display:none!important}`
        ].join('\n');
    }

    /**
     * The mode bar's words (keys and fallbacks for the catalog; values filled in): Study shows the plan, the
     * round and minutes left, and End per the lock rules (Android StudyLocks: only a self-started Gentle
     * session ends, after a 30-second pause; Locked and a parent's plan say until when). There is no pause.
     */
    function modeBarModel(mode, study, why, { now = Date.now(), label = '' } = {}) {
        if (!narrowed(mode)) return null;
        const reason = isObject(why) ? why : { kind: 'none' };
        const reasonLine = reason.kind === 'plan'
            ? { key: 'narrowed.why.plan', fallback: 'From your plan’s channels', values: {} }
            : reason.kind === 'own'
                ? { key: 'narrowed.why.own', fallback: 'From your allowed channels', values: {} }
                : reason.kind === 'word'
                    ? { key: mode.kind === 'study' ? 'narrowed.why.topic' : 'narrowed.why.word', fallback: mode.kind === 'study' ? 'Matches your topic “{word}”' : 'Matches your allowed word “{word}”', values: { word: reason.word } }
                    : null;
        if (mode.kind === 'allow') {
            return { kind: 'allow', label: { key: 'narrowed.allow.label', fallback: 'Allowed only', values: {} }, detail: null, reason: reasonLine, action: null };
        }
        const state = isObject(study) ? study : {};
        const until = Number(state.until);
        const minutes = Number.isFinite(until) && until > now ? Math.max(1, Math.ceil((until - now) / 60000)) : null;
        const round = Number(state.round);
        const rounds = Number(state.rounds);
        const detail = minutes === null ? null
            : (Number.isFinite(round) && Number.isFinite(rounds) && rounds > 1
                ? { key: 'study.strip.roundLeft', fallback: 'Round {round} of {rounds} · {minutes} min left', values: { round, rounds, minutes } }
                : { key: 'study.strip.minutesLeft', fallback: '{minutes} min left', values: { minutes } });
        const policy = isObject(state.endPolicy) ? state.endPolicy : {};
        let action = null;
        const endAt = Number(state.endRequestedAt);
        if (Number.isFinite(endAt) && endAt > 0) {
            const seconds = Math.max(0, Math.ceil((endAt + (Number(policy.pauseMs) || 30000) - now) / 1000));
            action = { kind: 'cancel', seconds };
        } else if (policy.canEnd === true && state.source === 'session') {
            action = { kind: 'end' };
        } else {
            const lockedUntil = Number(state.lockedUntil) || Number(state.sessionEnd) || null;
            action = { kind: 'locked', until: lockedUntil && lockedUntil > now ? lockedUntil : null };
        }
        return {
            kind: 'study',
            label: label
                ? { key: 'narrowed.study.labelPlan', fallback: 'Study · {plan}', values: { plan: label } }
                : { key: 'study.pill.label', fallback: 'Study', values: {} },
            detail,
            reason: reasonLine,
            action
        };
    }

    return Object.freeze({
        modeOf, narrowed, pageOf, pagePlan, channelInMode, whyShown, keywordWord,
        EXPLORE_HREFS, MORE_HREFS, KEEP_HREFS, guideSectionKind, guideSectionAction, narrowedCss, emptyShelfCss,
        modeBarModel
    });
}));
