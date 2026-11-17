/* On the results page, in allowed-only mode or during a study round: the allowed (or plan) channels'
 * own search, above the site's results, in a FilterTube shelf (Android StudySearch: the plan's channels
 * lead the page). The rules are in shared/channel_search.js; requests go through shared/paced_fetch.js
 * (three at once, paced), same-origin and without the person's cookies (signed out); answers are kept
 * 10 minutes in this tab's memory only, never stored.
 * Every video still passes the page's normal matcher (dom_fallback.js shouldHideContent): blocked words
 * in a layered profile, channel rules. Copy comes from data/ui_locales through admission_overlay.js.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeChannelSearchShelf = api;
    try {
        if (!api.autoStarted && root.document && /(^|\.)youtube\.com$/.test(String(root.location?.hostname || ''))
            && !/^m\./.test(String(root.location?.hostname || ''))) {
            api.autoStarted = true;
            api.createShelf({ window: root, document: root.document }).start();
        }
    } catch (e) {
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SHELF_ID = 'filtertube-channel-search-shelf';
    const STYLE_ID = 'filtertube-channel-search-style';
    const SHOW_MAX = 18;
    const COPY = Object.freeze({
        study: { title: ['search.channels.studyTitle', 'Showing your study channels'], all: ['search.channels.studyAll', 'Search all your study channels for “{query}”'],
            offline: ['search.channels.studyOffline', 'Your study channels couldn’t be reached. Check your connection and try again.'] },
        allowed: { title: ['search.channels.allowedTitle', 'Showing your allowed channels'], all: ['search.channels.allowedAll', 'Search all your allowed channels for “{query}”'],
            offline: ['search.channels.allowedOffline', 'Your allowed channels couldn’t be reached. Check your connection and try again.'] }
    });

    /** The query of a results page URL; '' elsewhere. */
    function queryOf(location) {
        try {
            const url = new URL(String(location?.href || ''));
            if (url.pathname !== '/results') return '';
            return (url.searchParams.get('search_query') || url.searchParams.get('q') || '').trim();
        } catch (e) {
            return '';
        }
    }

    /** The results that may show: each passes the page's matcher (`hides` true means hidden). */
    function admitted(items, settings, hides) {
        if (typeof hides !== 'function') return [];
        return items.filter(item => {
            try {
                return !hides(item.title, item.channelName, settings, {
                    channelMeta: { id: item.channelId || '', handle: item.channelHandle || '', name: item.channelName || '', customUrl: '' },
                    videoId: item.videoId,
                    contentTag: 'filtertube-channel-search'
                });
            } catch (e) {
                return false;
            }
        });
    }

    const CSS = `
#${SHELF_ID}{--ft-paper:#fffdfa;--ft-line:#ddd5ca;--ft-ink:#2b2622;--ft-muted:#625f58;--ft-brick:#a93e31;--ft-wash:#f7f5f1;
  margin:12px 0 20px;padding:16px 18px 18px;background:var(--ft-paper);color:var(--ft-ink);border:1.5px solid var(--ft-line);
  border-radius:18px 16px 19px 15px;box-shadow:0 1px 0 var(--ft-line);font-family:Outfit,Roboto,system-ui,sans-serif;max-width:1096px}
html[dark] #${SHELF_ID}{--ft-paper:#151c24;--ft-line:#2a3440;--ft-ink:#eef2f5;--ft-muted:#b8c3ce;--ft-brick:#e0796b;--ft-wash:#1b232c}
#${SHELF_ID} .ft-cs-head{display:flex;align-items:center;gap:10px;margin:0 0 12px}
#${SHELF_ID} .ft-cs-title{font:600 18px/1.3 'FilterTube Delius',Outfit,system-ui,sans-serif;margin:0}
#${SHELF_ID} .ft-cs-mark{width:26px;height:4px;border-radius:3px;background:var(--ft-brick);transform:rotate(-2deg)}
#${SHELF_ID} .ft-cs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
#${SHELF_ID} a.ft-cs-card{display:block;color:inherit;text-decoration:none;border-radius:12px;padding:6px;outline-offset:2px}
#${SHELF_ID} a.ft-cs-card:hover{background:var(--ft-wash)}
#${SHELF_ID} a.ft-cs-card:focus-visible{outline:2px solid var(--ft-ink)}
#${SHELF_ID} a.ft-cs-card:active{transform:translateY(1px)}
#${SHELF_ID} .ft-cs-thumb{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:var(--ft-wash)}
#${SHELF_ID} .ft-cs-thumb img{width:100%;height:100%;object-fit:cover;display:block}
#${SHELF_ID} .ft-cs-length{position:absolute;right:6px;bottom:6px;padding:1px 6px;border-radius:6px;background:rgba(20,20,20,.78);color:#fff;font:500 12px/1.5 Roboto,system-ui,sans-serif}
#${SHELF_ID} .ft-cs-name{margin:8px 2px 2px;font:500 14px/1.35 Roboto,system-ui,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#${SHELF_ID} .ft-cs-meta{margin:0 2px;color:var(--ft-muted);font:400 12.5px/1.4 Roboto,system-ui,sans-serif}
#${SHELF_ID} .ft-cs-more{margin-top:14px;padding:8px 14px;border-radius:999px;border:1.5px solid var(--ft-line);background:transparent;color:var(--ft-ink);font:500 14px/1.2 Outfit,Roboto,system-ui,sans-serif;cursor:pointer}
#${SHELF_ID} .ft-cs-more:hover{border-color:var(--ft-brick);color:var(--ft-brick)}
#${SHELF_ID} .ft-cs-more:focus-visible{outline:2px solid var(--ft-ink);outline-offset:2px}
#${SHELF_ID} .ft-cs-note{margin:0;color:var(--ft-muted);font:400 14px/1.45 Roboto,system-ui,sans-serif}
@media (prefers-reduced-motion: reduce){#${SHELF_ID} a.ft-cs-card:active{transform:none}}`;

    function createShelf(env) {
        const win = env.window;
        const doc = env.document;
        const Rules = () => env.rules || win.FilterTubeChannelSearch || null;
        const settings = () => env.settings ? env.settings() : (win.currentSettings || null);
        const hides = () => env.hides || win.shouldHideContent || null;
        const fetcher = env.fetcher || (win.FilterTubePacedFetch ? win.FilterTubePacedFetch.createPacedFetcher({ maxConcurrent: 3, minGapMs: 250,
            fetch: (url, init) => win.fetch(url, init) }) : null);
        const cache = Rules()?.createCache() || null;
        const widened = new Set();
        let runId = 0;
        let clientVersion = '';
        let attemptsWithoutSettings = 0;
        const inFlight = new Map();

        function t(key, fallback, values = {}) {
            let value = fallback;
            try {
                const localized = win.FilterTubeAdmissionOverlay?.text?.(key, fallback);
                if (typeof localized === 'string' && localized.trim()) value = localized;
            } catch (e) { }
            return String(value).replace(/\{([a-zA-Z]+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
        }

        function readClientVersion() {
            if (clientVersion) return clientVersion;
            try {
                for (const script of doc.querySelectorAll('script:not([src])')) {
                    const match = /"INNERTUBE_CLIENT_VERSION":"([^"]+)"/.exec(script.textContent || '');
                    if (match) { clientVersion = match[1]; break; }
                }
            } catch (e) { }
            return clientVersion;
        }

        async function askChannel(channelId, query) {
            const rules = Rules();
            const body = rules.channelSearchBody(channelId, query, readClientVersion(), { hl: (doc.documentElement?.lang || 'en').split('-')[0] || 'en' });
            const response = await fetcher.get('/youtubei/v1/browse?prettyPrint=false', {
                method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
            });
            if (!response || !response.ok) throw new Error(`channel search ${response?.status}`);
            return rules.parseChannelSearch(await response.json());
        }

        /** Asks the scope's channels for `query`; {perChannel, asked, failed}. Cached 10 minutes. */
        async function search(scope, query, all) {
            const rules = Rules();
            const cacheKey = rules.searchKey(scope, query, all);
            const hit = cache?.get(cacheKey);
            if (hit) return hit;
            // A second run for the same search (navigation events come in pairs) waits for the first.
            if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);
            const pending = ask(scope, query, all, cacheKey).finally(() => inFlight.delete(cacheKey));
            inFlight.set(cacheKey, pending);
            return pending;
        }

        async function ask(scope, query, all, cacheKey) {
            const rules = Rules();
            const channels = rules.plan(query, scope.groups, all ? rules.MAX_ALL : rules.MAX_FIRST);
            let failed = 0;
            const perChannel = await Promise.all(channels.map(channel => askChannel(channel, query).catch(() => { failed++; return []; })));
            const result = { perChannel, asked: channels.length, failed };
            if (failed < channels.length) cache?.set(cacheKey, result);
            return result;
        }

        function host() {
            return doc.querySelector('ytd-search ytd-section-list-renderer #contents') || doc.querySelector('ytd-search #contents');
        }

        function ensureStyle() {
            if (doc.getElementById(STYLE_ID)) return;
            const style = doc.createElement('style');
            style.id = STYLE_ID;
            style.textContent = CSS;
            (doc.head || doc.documentElement).appendChild(style);
        }

        function remove() {
            doc.getElementById(SHELF_ID)?.remove();
        }

        function card(item) {
            const link = doc.createElement('a');
            link.className = 'ft-cs-card';
            link.href = `/watch?v=${encodeURIComponent(item.videoId)}`;
            const thumb = doc.createElement('div');
            thumb.className = 'ft-cs-thumb';
            const img = doc.createElement('img');
            img.loading = 'lazy';
            img.alt = '';
            img.src = item.thumbnail;
            thumb.appendChild(img);
            if (item.length) {
                const length = doc.createElement('span');
                length.className = 'ft-cs-length';
                length.textContent = item.length;
                thumb.appendChild(length);
            }
            const name = doc.createElement('p');
            name.className = 'ft-cs-name';
            name.textContent = item.title;
            const meta = doc.createElement('p');
            meta.className = 'ft-cs-meta';
            meta.textContent = [item.channelName, item.views, item.published].filter(Boolean).join(' · ');
            link.append(thumb, name, meta);
            return link;
        }

        function draw(scope, query, outcome, items, all) {
            const target = host();
            if (!target) return false;
            ensureStyle();
            remove();
            const copy = COPY[scope.kind] || COPY.allowed;
            const rules = Rules();
            const unreachable = outcome.asked > 0 && outcome.failed >= outcome.asked;
            if (!items.length && !unreachable) return true;
            const shelf = doc.createElement('section');
            shelf.id = SHELF_ID;
            shelf.setAttribute('aria-label', t(copy.title[0], copy.title[1]));
            const head = doc.createElement('div');
            head.className = 'ft-cs-head';
            const mark = doc.createElement('span');
            mark.className = 'ft-cs-mark';
            mark.setAttribute('aria-hidden', 'true');
            const title = doc.createElement('h2');
            title.className = 'ft-cs-title';
            title.textContent = t(copy.title[0], copy.title[1]);
            head.append(mark, title);
            shelf.appendChild(head);
            if (unreachable) {
                const note = doc.createElement('p');
                note.className = 'ft-cs-note';
                note.textContent = t(copy.offline[0], copy.offline[1]);
                shelf.appendChild(note);
            } else {
                const grid = doc.createElement('div');
                grid.className = 'ft-cs-grid';
                items.slice(0, SHOW_MAX).forEach(item => grid.appendChild(card(item)));
                shelf.appendChild(grid);
            }
            if (!all && rules.channelCount(scope) > outcome.asked) {
                const more = doc.createElement('button');
                more.type = 'button';
                more.className = 'ft-cs-more';
                more.textContent = t(copy.all[0], copy.all[1], { query });
                more.addEventListener('click', () => {
                    widened.add(rules.searchKey(scope, query, false));
                    run();
                });
                shelf.appendChild(more);
            }
            target.prepend(shelf);
            return true;
        }

        async function run() {
            const id = ++runId;
            const rules = Rules();
            const query = queryOf(win.location);
            const current = settings();
            if (!current && query && attemptsWithoutSettings < 8) {
                // Settings come from the background a moment after the page opens.
                attemptsWithoutSettings++;
                win.setTimeout(() => { if (id === runId) run().catch(() => {}); }, 500);
                return;
            }
            attemptsWithoutSettings = 0;
            const scope = rules && query && fetcher ? rules.scope(current) : null;
            if (!scope) { remove(); return; }
            const all = widened.has(rules.searchKey(scope, query, false));
            const outcome = await search(scope, query, all);
            if (id !== runId) return;
            const items = admitted(rules.merge(outcome.perChannel, [], item => item.videoId), current, hides());
            // The results list is drawn after navigation; try a few times.
            for (let attempt = 0; attempt < 20 && id === runId; attempt++) {
                if (draw(scope, query, outcome, items, all)) return;
                await new Promise(resolve => win.setTimeout(resolve, 250));
            }
        }

        function start() {
            const schedule = () => win.setTimeout(() => { run().catch(() => {}); }, 0);
            doc.addEventListener('yt-navigate-finish', schedule);
            win.addEventListener('popstate', schedule);
            if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', schedule, { once: true });
            else schedule();
            return { run, remove };
        }

        return { start, run, remove, search };
    }

    return { createShelf, queryOf, admitted, SHELF_ID };
}));
