/* The allow-list feed and the calm empty-feed state on the video site's pages (isolated world).
 *
 * Allow-list mode (any profile; Study is one source of it): when Home comes back fully hidden, or a
 * study round is on, a FilterTube-owned panel is built from the allowed channels' latest uploads and a
 * few searches for the allowed words (js/shared/allowlist_feed.js). Every item passes the page's own
 * matcher (shouldHideContent in dom_fallback.js), so blocked words in a layered allow list, Kids rules
 * and the rest still apply. Nothing to show gives Kriti with the next steps, never an endless loader.
 * Block-list mode: after the main world's guard stops a feed that keeps coming back fully hidden
 * (data-filtertube-feed-exhausted), or the page's cards are all hidden after three loads, Kriti says
 * that most of this page matched the filters, with Subscriptions, Search and Review filters.
 * The panel swaps in and out live: rules or a study session changing re-decide it at once.
 * Copy comes from data/ui_locales through admission_overlay.js; no string names the video site.
 */
(function () {
    'use strict';
    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    if (root.__filtertubeAllowFeedView) return;
    root.__filtertubeAllowFeedView = true;
    const doc = root.document;
    const host = String(root.location?.hostname || '');
    if (!doc || !/(^|\.)youtube\.com$/.test(host) || host.startsWith('m.')) return;
    const Feed = root.FilterTubeAllowlistFeed;
    const runtime = root.chrome?.runtime || root.browser?.runtime;
    const storage = root.chrome?.storage?.local || root.browser?.storage?.local;
    if (!Feed || !runtime) return;

    const PANEL_ID = 'filtertube-allow-feed';
    const STYLE_ID = 'filtertube-allow-feed-style';
    const BUILT_ATTR = 'data-filtertube-built-feed';
    const DOM_EMPTY_LOADS = 3;
    const COMPANION_KEY = 'ftCompanionMode';
    const SETTLE_MS = 2500;

    let companion = 'quiet';
    let studyLabel = '';
    let built = null;          // {key, items, nextOffset}
    let building = null;       // Promise while a build runs
    let shownFor = '';         // route + decision the panel was drawn for
    let domWatch = { route: '', loads: 0, lastCount: 0 };
    let lastSettingsRef = null;
    let token = 0;
    let navigatedAt = Date.now();

    const builder = Feed.createFeedBuilder({
        fetchText: async (url) => {
            const response = await root.fetch(url, { credentials: 'omit' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        },
        searchJson: async (query) => {
            const response = await root.fetch('/youtubei/v1/search?prettyPrint=false', {
                method: 'POST',
                credentials: 'omit',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: clientVersion(), hl: lang() } }, query })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        },
        storage: storage ? {
            get: key => new Promise(resolve => { try { storage.get(key, items => resolve(items || {})); } catch (e) { resolve({}); } }),
            set: items => new Promise(resolve => { try { storage.set(items, () => resolve()); } catch (e) { resolve(); } })
        } : null
    });

    function clientVersion() {
        try {
            const match = /"INNERTUBE_CLIENT_VERSION":"([\d.]+)"/.exec(doc.documentElement.innerHTML.slice(0, 400000));
            if (match) return match[1];
        } catch (e) { }
        return '2.20251110.00.00';
    }
    function lang() { return String(doc.documentElement.lang || 'en').split('-')[0] || 'en'; }

    function t(key, fallback, values) {
        let value = fallback;
        try {
            const localized = root.FilterTubeAdmissionOverlay?.text?.(key, fallback);
            if (typeof localized === 'string' && localized.trim()) value = localized;
        } catch (e) { }
        return String(value).replace(/\{([a-zA-Z]+)\}/g, (m, name) => (values && name in values ? String(values[name]) : m));
    }

    function settings() {
        try { return root.currentSettings || null; } catch (e) { return null; }
    }
    function routeKey() { return `${root.location.pathname}${root.location.search}`; }

    function asset(name) {
        try { return runtime.getURL(`assets/images/mascots/${name}`); } catch (e) { return ''; }
    }

    function ensureStyle() {
        if (doc.getElementById(STYLE_ID)) return;
        const style = doc.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
#${PANEL_ID}{--ftf-paper:#fffdfa;--ftf-ink:#2b2622;--ftf-muted:#625f58;--ftf-line:#ddd5ca;--ftf-brick:#a93e31;--ftf-sage:#3e7d5b;--ftf-wash:#eef5ef;
  box-sizing:border-box;margin:16px 0 20px;padding:18px 20px 20px;border:1.5px solid var(--ftf-line);border-radius:18px;background:var(--ftf-paper);color:var(--ftf-ink);
  font-family:"Outfit","Roboto",system-ui,sans-serif;width:100%;max-width:min(100%,1680px)}
html[dark] #${PANEL_ID}{--ftf-paper:#151c24;--ftf-ink:#eef2f6;--ftf-muted:#b8c3ce;--ftf-line:#2a3440;--ftf-brick:#e0796b;--ftf-sage:#7fb89a;--ftf-wash:#1d2a24}
#${PANEL_ID} *{box-sizing:border-box}
#${PANEL_ID} .ftf-head{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
#${PANEL_ID} .ftf-head-text{flex:1 1 320px;min-width:0}
#${PANEL_ID} .ftf-title{margin:0;font-family:"Delius","Outfit",system-ui,sans-serif;font-size:20px;font-weight:400;line-height:1.3}
#${PANEL_ID} .ftf-title::after{content:"";display:block;width:44px;height:3px;margin-top:6px;border-radius:3px;background:var(--ftf-sage)}
#${PANEL_ID}[data-kind="block"] .ftf-title::after{background:var(--ftf-brick)}
#${PANEL_ID} .ftf-line{margin:8px 0 0;color:var(--ftf-muted);font-size:14px;line-height:1.5;max-width:64ch}
#${PANEL_ID} .ftf-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#${PANEL_ID} .ftf-chip,#${PANEL_ID} .ftf-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:6px 14px;border-radius:999px;
  border:1.5px solid var(--ftf-line);background:transparent;color:var(--ftf-ink);font:500 14px/1.2 "Outfit","Roboto",system-ui,sans-serif;text-decoration:none;cursor:pointer;
  transition:background-color .15s ease,border-color .15s ease,transform .1s ease}
#${PANEL_ID} .ftf-chip:hover,#${PANEL_ID} .ftf-btn:hover{border-color:var(--ftf-sage);background:var(--ftf-wash)}
#${PANEL_ID}[data-kind="block"] .ftf-btn:hover{border-color:var(--ftf-brick)}
#${PANEL_ID} .ftf-chip:focus-visible,#${PANEL_ID} .ftf-btn:focus-visible,#${PANEL_ID} .ftf-card:focus-visible{outline:2px solid var(--ftf-ink);outline-offset:2px}
#${PANEL_ID} .ftf-chip:active,#${PANEL_ID} .ftf-btn:active{transform:translateY(1px)}
#${PANEL_ID} .ftf-btn--primary{background:var(--ftf-sage);border-color:var(--ftf-sage);color:var(--ftf-paper)}
#${PANEL_ID} .ftf-btn--primary:hover{background:var(--ftf-sage);filter:brightness(1.06)}
#${PANEL_ID}[data-kind="block"] .ftf-btn--primary{background:var(--ftf-brick);border-color:var(--ftf-brick)}
#${PANEL_ID}[data-kind="block"] .ftf-btn--primary:hover{background:var(--ftf-brick)}
#${PANEL_ID} .ftf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px 16px;margin-top:18px}
#${PANEL_ID} .ftf-card{display:block;color:inherit;text-decoration:none;border-radius:14px;padding:6px;margin:-6px;transition:background-color .15s ease}
#${PANEL_ID} .ftf-card:hover{background:var(--ftf-wash)}
#${PANEL_ID} .ftf-thumb{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:var(--ftf-line)}
#${PANEL_ID} .ftf-card-title{margin:10px 0 4px;font-size:15px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#${PANEL_ID} .ftf-card-meta{margin:0;color:var(--ftf-muted);font-size:13px;line-height:1.4}
#${PANEL_ID} .ftf-empty{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
#${PANEL_ID} .ftf-kriti{width:auto;height:112px;flex:0 0 auto}
#${PANEL_ID} .ftf-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#${PANEL_ID} .ftf-loading{display:flex;align-items:center;gap:12px;margin-top:16px;color:var(--ftf-muted);font-size:14px}
#${PANEL_ID} .ftf-loading img{height:56px;width:auto}
#${PANEL_ID} .ftf-more{margin-top:18px}
@media (prefers-reduced-motion:reduce){#${PANEL_ID} *{transition:none!important}}
html[${BUILT_ATTR}] ytd-browse[page-subtype="home"] ytd-rich-grid-renderer ytd-continuation-item-renderer,
html[${BUILT_ATTR}] ytd-browse[page-subtype="home"] ytd-rich-grid-renderer #ghost-cards{display:none!important}`;
        (doc.head || doc.documentElement).appendChild(style);
    }

    function el(tag, className, textValue) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (textValue !== undefined && textValue !== null) node.textContent = textValue;
        return node;
    }

    function activePage() {
        return doc.querySelector('ytd-page-manager > :not([hidden])') || null;
    }
    function mountPoint() {
        const page = activePage();
        if (!page) return null;
        return page.querySelector('#primary') || page.querySelector('#contents') || page;
    }

    function removePanel() {
        doc.getElementById(PANEL_ID)?.remove();
        doc.documentElement.removeAttribute(BUILT_ATTR);
        shownFor = '';
    }

    function openDashboard(view) {
        try { runtime.sendMessage({ action: 'FilterTube_OpenDashboard', view }); } catch (e) { }
    }
    function focusSearch() {
        const input = doc.querySelector('input#search, yt-searchbox input, input[name="search_query"]');
        if (input) { input.focus(); input.select?.(); }
    }

    function age(item) {
        if (item.publishedText) return item.publishedText;
        if (!item.publishedAt) return '';
        try {
            const days = Math.round((Date.now() - item.publishedAt) / 86400000);
            const rtf = new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' });
            if (days < 1) return rtf.format(-Math.max(1, Math.round((Date.now() - item.publishedAt) / 3600000)), 'hour');
            if (days < 31) return rtf.format(-days, 'day');
            if (days < 365) return rtf.format(-Math.round(days / 30), 'month');
            return rtf.format(-Math.round(days / 365), 'year');
        } catch (e) {
            return '';
        }
    }

    /** True when the page's own rules would hide this item (unknown answers hide). */
    function hiddenByRules(item, current) {
        try {
            if (typeof root.shouldHideContent !== 'function' && typeof shouldHideContent !== 'function') return false;
            const fn = typeof shouldHideContent === 'function' ? shouldHideContent : root.shouldHideContent;
            const verdict = fn(item.title || '', item.channelName || '', current, {
                channelMeta: { id: item.channelId || '', handle: item.channelHandle ? String(item.channelHandle).toLowerCase() : '', customUrl: '' },
                videoId: item.videoId,
                contentTag: 'ytd-rich-item-renderer'
            });
            return verdict !== false && verdict !== null && verdict !== undefined;
        } catch (e) {
            return true;
        }
    }

    function header(panel, kind, title, line) {
        panel.dataset.kind = kind;
        const head = el('div', 'ftf-head');
        const textBox = el('div', 'ftf-head-text');
        const heading = el('h2', 'ftf-title', title);
        textBox.append(heading);
        if (line) textBox.append(el('p', 'ftf-line', line));
        head.append(textBox);
        panel.append(head);
        return head;
    }

    function mascot(name, alt) {
        if (companion === 'off') return null;
        const img = el('img', 'ftf-kriti');
        img.src = asset(name);
        img.alt = alt || '';
        img.decoding = 'async';
        return img;
    }

    function button(label, onClick, primary) {
        const node = el('button', primary ? 'ftf-btn ftf-btn--primary' : 'ftf-btn', label);
        node.type = 'button';
        node.addEventListener('click', onClick);
        return node;
    }

    function chips(sources) {
        const box = el('div', 'ftf-chips');
        for (const topic of sources.topics.slice(0, 8)) {
            const chip = el('a', 'ftf-chip', topic);
            chip.href = `/results?search_query=${encodeURIComponent(topic)}`;
            box.append(chip);
        }
        return box.childElementCount ? box : null;
    }

    function panelShell() {
        ensureStyle();
        let panel = doc.getElementById(PANEL_ID);
        const mount = mountPoint();
        if (!mount) return null;
        if (!panel || panel.parentElement !== mount) {
            panel?.remove();
            panel = el('section');
            panel.id = PANEL_ID;
            panel.setAttribute('aria-live', 'polite');
            mount.prepend(panel);
        }
        panel.textContent = '';
        return panel;
    }

    function drawAllowEmpty(panel, sources, { unreachable }) {
        header(panel, 'allow', unreachable
            ? t('feed.built.offlineTitle', 'Couldn’t reach your channels')
            : t('feed.built.emptyTitle', 'Nothing from your allowed channels yet'),
        unreachable
            ? t('feed.built.offlineBody', 'Check the connection and try again. Search still works.')
            : (sources.study
                ? t('feed.built.emptyBodyStudy', 'Try a subject search, or open the plan to add channels.')
                : t('feed.built.emptyBody', 'Search for something on your list, or add channels to it.')));
        const row = el('div', 'ftf-empty');
        const kriti = mascot(unreachable ? 'uljhan_shrug.webp' : 'kriti_pointing.webp', '');
        if (kriti) row.append(kriti);
        const actions = el('div', 'ftf-actions');
        if (unreachable) actions.append(button(t('feed.built.retry', 'Try again'), () => { built = null; decide(true); }, true));
        actions.append(button(t('feed.built.search', 'Search'), focusSearch, !unreachable));
        actions.append(button(sources.study ? t('feed.built.openStudy', 'Open study plan') : t('feed.built.reviewAllowed', 'Review allowed channels'),
            () => openDashboard(sources.study ? 'study' : 'filters')));
        row.append(actions);
        panel.append(row);
        const chipRow = chips(sources);
        if (chipRow) panel.append(chipRow);
    }

    function drawFeed(panel, sources, items, more) {
        header(panel, 'allow',
            sources.study
                ? (studyLabel ? t('feed.built.studyTitleLabel', 'Study feed · {label}', { label: studyLabel }) : t('feed.built.studyTitle', 'Study feed'))
                : t('feed.built.title', 'From your allowed channels'),
            sources.study
                ? t('feed.built.studyLine', 'Latest lessons from your plan’s channels and topics.')
                : t('feed.built.line', 'Latest videos from the channels and words you allow.'));
        const chipRow = chips(sources);
        if (chipRow) panel.append(chipRow);
        const grid = el('div', 'ftf-grid');
        for (const item of items) {
            const card = el('a', 'ftf-card');
            card.href = `/watch?v=${encodeURIComponent(item.videoId)}`;
            const img = el('img', 'ftf-thumb');
            img.src = item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            card.append(img, el('p', 'ftf-card-title', item.title || ''));
            const meta = [item.channelName, age(item)].filter(Boolean).join(' · ');
            if (meta) card.append(el('p', 'ftf-card-meta', meta));
            grid.append(card);
        }
        panel.append(grid);
        if (more) {
            const moreRow = el('div', 'ftf-more');
            moreRow.append(button(t('feed.built.more', 'Show more'), () => loadMore(), false));
            panel.append(moreRow);
        }
    }

    function drawLoading(panel, sources) {
        header(panel, 'allow',
            sources.study ? (studyLabel ? t('feed.built.studyTitleLabel', 'Study feed · {label}', { label: studyLabel }) : t('feed.built.studyTitle', 'Study feed'))
                : t('feed.built.title', 'From your allowed channels'), null);
        const row = el('div', 'ftf-loading');
        const uljhan = mascot('uljhan_fetch_01.webp', '');
        if (uljhan) row.append(uljhan);
        row.append(el('span', '', t('feed.built.loading', 'Gathering the latest from your list…')));
        panel.append(row);
    }

    function drawBlockCalm(panel) {
        header(panel, 'block', t('feed.calm.title', 'Most of this page matched your filters'),
            t('feed.calm.body', 'FilterTube stopped loading more of it. Your subscriptions and search still work.'));
        const row = el('div', 'ftf-empty');
        const kriti = mascot('kriti_peek.webp', '');
        if (kriti) row.append(kriti);
        const actions = el('div', 'ftf-actions');
        actions.append(button(t('feed.calm.subscriptions', 'Open subscriptions'), () => { root.location.href = '/feed/subscriptions'; }, true));
        actions.append(button(t('feed.built.search', 'Search'), focusSearch));
        actions.append(button(t('feed.calm.review', 'Review filters'), () => openDashboard('filters')));
        row.append(actions);
        panel.append(row);
    }

    function visibleItems(items, current) {
        return items.filter(item => !hiddenByRules(item, current));
    }

    async function ensureBuilt(sources, current) {
        const key = `${sources.channels.map(ch => ch.id).join(',')}|${sources.topics.slice(0, 20).join(',')}`;
        if (built && built.key === key) return built;
        if (building && building.key === key) return building.promise;
        const promise = builder.build(sources).then(result => {
            built = { key, items: result.items, nextOffset: result.nextOffset, unreachable: result.unreachable };
            return built;
        }).finally(() => { if (building?.promise === promise) building = null; });
        building = { key, promise };
        return promise;
    }

    async function loadMore() {
        const current = settings();
        if (!built || built.nextOffset === null || !current) return;
        const sources = Feed.feedSources(current);
        const result = await builder.build(sources, { offset: built.nextOffset, searches: 0 });
        const seen = new Set(built.items.map(item => item.videoId));
        built = { ...built, items: built.items.concat(result.items.filter(item => !seen.has(item.videoId))), nextOffset: result.nextOffset };
        shownFor = '';
        decide(true);
    }

    function loadStudyLabel(current) {
        if (!current?.study || current.study.phase !== 'study') { studyLabel = ''; return; }
        try {
            Promise.resolve(runtime.sendMessage({ action: 'FilterTube_StudyGetState' })).then(state => {
                const packs = Array.isArray(state?.packs) ? state.packs : [];
                const first = packs[0];
                if (!first) return;
                const name = first.shortName || first.names?.[lang()] || first.names?.en || '';
                const next = packs.length > 1 ? `${name} + ${packs.length - 1}` : name;
                if (next && next !== studyLabel) { studyLabel = next; shownFor = ''; decide(); }
            }).catch(() => { });
        } catch (e) { }
    }

    function visibleCardCount() {
        const page = activePage();
        if (!page) return 0;
        return Array.from(page.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer'))
            .filter(card => !card.closest(`#${PANEL_ID}`) && !card.classList.contains('filtertube-hidden') && card.offsetParent !== null).length;
    }

    /** Block list on a page whose cards are all hidden, three loads in a row: stop it here too. */
    function domLooksExhausted() {
        const page = activePage();
        if (!page) return false;
        const cards = page.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
        if (!cards.length) return false;
        const route = routeKey();
        if (domWatch.route !== route) domWatch = { route, loads: 0, lastCount: 0 };
        const visible = Array.from(cards).some(card => !card.classList.contains('filtertube-hidden') && !card.hasAttribute('data-filtertube-hidden') && card.offsetParent !== null);
        if (visible) { domWatch.loads = 0; domWatch.lastCount = cards.length; return false; }
        if (cards.length > domWatch.lastCount) { domWatch.loads += 1; domWatch.lastCount = cards.length; }
        if (domWatch.loads >= DOM_EMPTY_LOADS) {
            page.querySelectorAll('ytd-continuation-item-renderer').forEach(node => node.remove());
            return true;
        }
        return false;
    }

    async function decide(force = false) {
        const current = settings();
        const kind = Feed.routeKind(root.location.pathname);
        const html = doc.documentElement;
        if (!current || current.enabled === false || kind === 'watch') {
            html.setAttribute('data-filtertube-feed-decision', current ? 'off' : 'no-settings');
            removePanel();
            return;
        }
        const route = routeKey();
        const exhaustedAttr = String(html.getAttribute('data-filtertube-feed-exhausted') || '');
        const emptyAttr = String(html.getAttribute('data-filtertube-feed-empty') || '');
        const exhausted = exhaustedAttr.endsWith(`:${route}`);
        const emptyHere = emptyAttr.endsWith(`:${route}`);
        const sources = Feed.feedSources(current);
        const studying = sources.study;

        let decision = 'none';
        if (sources.allow) {
            // A Home with no cards of its own at all (signed out, or history off) has nothing to hide
            // either: once it has settled, the allowed sources fill it.
            const bareHome = kind === 'home' && Date.now() - navigatedAt > SETTLE_MS && visibleCardCount() === 0;
            if (kind === 'home' && (studying || emptyHere || exhausted || bareHome)) decision = 'feed';
            else if (exhausted) decision = 'allow-empty';
        } else if (exhausted || ((kind === 'home' || kind === 'feed' || kind === 'search') && domLooksExhausted())) {
            decision = 'block-calm';
        }
        // A plain word for diagnostics (and the capture scripts): what this page decided.
        html.setAttribute('data-filtertube-feed-decision', `${decision}${sources.allow ? ':allow' : ':block'}${studying ? ':study' : ''}`);
        const stamp = `${route}|${decision}|${built?.key || ''}|${built?.items?.length || 0}|${studyLabel}|${companion}`;
        if (decision === 'none') { if (doc.getElementById(PANEL_ID)) removePanel(); return; }
        if (!force && stamp === shownFor && doc.getElementById(PANEL_ID)?.isConnected) return;

        const my = ++token;
        if (decision === 'block-calm') {
            const panel = panelShell();
            if (!panel) return;
            drawBlockCalm(panel);
            shownFor = stamp;
            return;
        }
        if (decision === 'allow-empty') {
            const panel = panelShell();
            if (!panel) return;
            drawAllowEmpty(panel, sources, { unreachable: false });
            shownFor = stamp;
            return;
        }
        // decision === 'feed'
        html.setAttribute(BUILT_ATTR, '');
        let panel = panelShell();
        if (!panel) return;
        if (!sources.channels.length && !sources.topics.length) {
            drawAllowEmpty(panel, sources, { unreachable: false });
            shownFor = stamp;
            return;
        }
        if (!built || built.key !== `${sources.channels.map(ch => ch.id).join(',')}|${sources.topics.slice(0, 20).join(',')}`) drawLoading(panel, sources);
        const result = await ensureBuilt(sources, current).catch(() => null);
        if (my !== token) return;
        panel = panelShell();
        if (!panel) return;
        const items = result ? visibleItems(result.items, settings() || current) : [];
        if (!items.length) drawAllowEmpty(panel, sources, { unreachable: !result || result.unreachable });
        else drawFeed(panel, sources, items.slice(0, 48), result.nextOffset !== null);
        shownFor = `${route}|${decision}|${built?.key || ''}|${built?.items?.length || 0}|${studyLabel}|${companion}`;
    }

    let scheduled = 0;
    function schedule(force) {
        if (scheduled) return;
        scheduled = root.setTimeout(() => { scheduled = 0; decide(force); }, 120);
    }

    function watchSettings() {
        const current = settings();
        if (current === lastSettingsRef) return;
        const previous = lastSettingsRef;
        lastSettingsRef = current;
        const prevAllow = previous?.listMode === 'whitelist';
        const prevStudy = previous?.study?.phase === 'study';
        if (!current || prevAllow !== (current.listMode === 'whitelist') || prevStudy !== (current.study?.phase === 'study')) {
            built = null;
            loadStudyLabel(current);
        }
        schedule(true);
    }

    try {
        storage?.get?.(COMPANION_KEY, items => { companion = String(items?.[COMPANION_KEY] || 'quiet'); schedule(true); });
        root.chrome?.storage?.onChanged?.addListener?.((changes, area) => {
            if (area === 'local' && changes[COMPANION_KEY]) { companion = String(changes[COMPANION_KEY].newValue || 'quiet'); schedule(true); }
        });
    } catch (e) { }

    new MutationObserver(() => schedule(false)).observe(doc.documentElement, {
        attributes: true, attributeFilter: ['data-filtertube-feed-empty', 'data-filtertube-feed-exhausted']
    });
    doc.addEventListener('yt-navigate-finish', () => { navigatedAt = Date.now(); shownFor = ''; schedule(true); root.setTimeout(() => schedule(false), SETTLE_MS + 200); }, true);
    doc.addEventListener('yt-page-data-updated', () => schedule(false), true);
    try {
        runtime.onMessage.addListener(message => {
            if (message?.action === 'FilterTube_ApplySettings' || message?.action === 'FilterTube_StudyState') root.setTimeout(watchSettings, 50);
        });
    } catch (e) { }
    // Settings also change from storage (bridge_settings refreshes currentSettings): look every 2 s.
    root.setInterval(() => { watchSettings(); if (!shownFor && Feed.routeKind(root.location.pathname) !== 'watch') schedule(false); }, 2000);
    root.setTimeout(() => schedule(false), SETTLE_MS + 200);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => schedule(true), { once: true });
    else schedule(true);

    root.FilterTubeAllowFeedView = { decide, removePanel, _state: () => ({ built, shownFor, studyLabel }) };
}());
