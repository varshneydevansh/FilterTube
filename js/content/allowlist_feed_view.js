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
 * In a narrowed mode (Allowed only, Study) the decision is the narrowed layer's (narrowed_mode.js,
 * narrowed_view.js): Home is always the built feed, and it owns the page body. The site's grid, its chip
 * bar, shelves and loader are hidden in place by the layer's stylesheet, so the site never draws a second
 * chip bar under the feed, empty "Shorts" headers, or a chip that loads into a blank feed. Search belongs
 * to the channel search shelf. Redraws are per element: cards already shown stay, with their thumbnails.
 * It runs on events (settings applied, the layer's decision, navigation); nothing polls.
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
    const PAGE_SIZE = 48;
    const STUDY_BATCH = 24;

    let companion = 'quiet';
    let built = null;          // {key, items, nextOffset}
    let shownCount = PAGE_SIZE; // cards drawn; "Show more" adds a page
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
#${PANEL_ID} .ftf-line{margin:6px 0 0;color:var(--ftf-muted);font-size:14px;line-height:1.5;max-width:64ch}
#${PANEL_ID} .ftf-line:empty{display:none}
#${PANEL_ID} .ftf-chips{display:flex;gap:8px;margin-top:14px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;
  -webkit-mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent)}
#${PANEL_ID} .ftf-chips::-webkit-scrollbar{display:none}
#${PANEL_ID} .ftf-chips:empty{display:none}
#${PANEL_ID} .ftf-chip{flex:0 0 auto;white-space:nowrap}
#${PANEL_ID} .ftf-chip[aria-current="page"]{background:var(--ftf-ink);border-color:var(--ftf-ink);color:var(--ftf-paper)}
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
html[${BUILT_ATTR}] ytd-browse[page-subtype="home"] ytd-rich-grid-renderer #ghost-cards{display:none!important}
#${PANEL_ID} .ftf-bar:empty{display:none}
#${PANEL_ID} .ftf-bar .filtertube-mode-bar{margin:0 0 14px}`;
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

    function setText(node, value) {
        const next = value || '';
        if (node.textContent !== next) node.textContent = next;
    }

    /** The panel's three parts, made once: the header, the chips row and the body. Later draws change them in place. */
    function parts(panel) {
        let bar = panel.querySelector(':scope > .ftf-bar');
        if (!bar) { bar = el('div', 'ftf-bar'); panel.prepend(bar); }
        let head = panel.querySelector(':scope > .ftf-head');
        if (!head) {
            head = el('div', 'ftf-head');
            const textBox = el('div', 'ftf-head-text');
            textBox.append(el('h2', 'ftf-title'), el('p', 'ftf-line'));
            head.append(textBox);
            bar.after(head);
        }
        let chipRow = panel.querySelector(':scope > .ftf-chips');
        if (!chipRow) { chipRow = el('nav', 'ftf-chips'); head.after(chipRow); }
        let body = panel.querySelector(':scope > .ftf-body');
        if (!body) { body = el('div', 'ftf-body'); chipRow.after(body); }
        return { bar, head, chipRow, body };
    }

    function narrowedView() { return root.FilterTubeNarrowedView || null; }
    function studyInfo() { return narrowedView()?.studyInfo?.() || { label: '', chips: [] }; }

    /** The mode bar heads the built feed (round, minutes left, End), the same bar as on Watch. */
    function refreshModeBar() {
        const panel = doc.getElementById(PANEL_ID);
        const barHost = panel?.querySelector(':scope > .ftf-bar');
        if (!barHost) return;
        // Only during study: there it carries the round, the time left and End. In allowed-only mode the
        // feed's title already says it.
        const studying = narrowedView()?.current?.()?.mode?.kind === 'study';
        if (panel.dataset.kind !== 'allow' || !studying) { barHost.textContent = ''; return; }
        narrowedView().renderModeBar(barHost);
    }

    function studyTitle(sources) {
        const label = studyInfo().label;
        return label ? t('feed.built.studyingTitle', 'Studying {label}', { label }) : t('feed.built.studyTitle', 'Study feed');
    }

    function header(panel, kind, title, line) {
        if (panel.dataset.kind !== kind) panel.dataset.kind = kind;
        const { head } = parts(panel);
        setText(head.querySelector('.ftf-title'), title);
        setText(head.querySelector('.ftf-line'), line);
        return head;
    }

    /** Swaps the body's content only when its kind changes ("grid", "empty", "loading", "calm"). */
    function body(panel, kind) {
        const node = parts(panel).body;
        if (node.dataset.kind !== kind) {
            node.textContent = '';
            node.dataset.kind = kind;
        }
        return node;
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

    /**
     * The chips row: during study "All" and the plan's subjects (Android StudyHomeFeed chips, each a search
     * "<subject> <exam>"); in allowed-only mode the allowed words. Redrawn only when the list changes.
     */
    function chips(panel, sources, show) {
        const row = parts(panel).chipRow;
        const studyChips = sources?.study ? studyInfo().chips : [];
        const list = !show ? [] : (sources.study
            ? (studyChips.length
                ? [{ label: t('feed.built.chipAll', 'All'), href: '/', current: true }, ...studyChips.map(chip => ({ label: chip.label, href: `/results?search_query=${encodeURIComponent(chip.query)}` }))]
                : [])
            : sources.topics.slice(0, 8).map(topic => ({ label: topic, href: `/results?search_query=${encodeURIComponent(topic)}` })));
        const signature = JSON.stringify(list);
        if (row.dataset.signature === signature) return;
        row.dataset.signature = signature;
        row.textContent = '';
        row.setAttribute('aria-label', t('feed.built.chipsLabel', 'Subjects'));
        for (const entry of list) {
            const chip = el('a', 'ftf-chip', entry.label);
            chip.href = entry.href;
            if (entry.current) chip.setAttribute('aria-current', 'page');
            row.append(chip);
        }
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
        parts(panel);
        return panel;
    }

    function drawAllowEmpty(panel, sources, { unreachable, page = 'home' }) {
        const label = studyInfo().label;
        // Home: nothing came from the channels. Another page (Subscriptions, History): it all waits.
        const title = unreachable
            ? t('feed.built.offlineTitle', 'Couldn’t reach your channels')
            : (sources.study
                ? (page === 'home' ? t('feed.built.studyEmptyTitle', 'No study videos right now') : t('feed.built.studyPageEmptyTitle', 'Nothing from your study plan here'))
                : t('feed.built.emptyTitle', 'Nothing from your allowed channels yet'));
        const line = unreachable
            ? t('feed.built.offlineBody', 'Check the connection and try again. Search still works.')
            : (sources.study
                ? (page === 'home'
                    ? (label ? t('feed.built.studyEmptyBody', 'Study videos come from your {label} channels. Try a subject search.', { label }) : t('feed.built.emptyBodyStudy', 'Try a subject search, or open the plan to add channels.'))
                    : t('feed.built.studyPageEmptyBody', 'It’ll be here after study ends.'))
                : t('feed.built.emptyBody', 'Search for something on your list, or add channels to it.'));
        header(panel, 'allow', title, line);
        const row = el('div', 'ftf-empty');
        const kriti = mascot(unreachable ? 'uljhan_pose_02.webp' : 'kriti_pose_08.webp', '');
        const box = body(panel, unreachable ? 'offline' : 'empty');
        box.textContent = '';
        if (kriti) row.append(kriti);
        const actions = el('div', 'ftf-actions');
        if (unreachable) actions.append(button(t('feed.built.retry', 'Try again'), () => { built = null; decide(true); }, true));
        actions.append(button(t('feed.built.search', 'Search'), focusSearch, !unreachable));
        actions.append(button(sources.study ? t('feed.built.openStudy', 'Open study plan') : t('feed.built.reviewAllowed', 'Review allowed channels'),
            () => openDashboard(sources.study ? 'study' : 'filters')));
        row.append(actions);
        box.append(row);
        chips(panel, sources, true);
    }

    function drawFeed(panel, sources, items, more) {
        header(panel, 'allow',
            sources.study ? studyTitle(sources) : t('feed.built.title', 'From your allowed channels'),
            sources.study
                ? t('feed.built.studyLessonsLine', 'Lessons from your plan’s channels, the ones on your topics first.')
                : t('feed.built.line', 'Latest videos from the channels and words you allow.'));
        chips(panel, sources, true);
        const box = body(panel, 'grid');
        let grid = box.querySelector(':scope > .ftf-grid');
        if (!grid) { grid = el('div', 'ftf-grid'); box.prepend(grid); }
        // Per element: cards already shown stay as they are; new ones are added, gone ones removed.
        const existing = new Map(Array.from(grid.children).map(node => [node.dataset.videoId, node]));
        let cursor = grid.firstElementChild;
        for (const item of items) {
            let card = existing.get(item.videoId);
            existing.delete(item.videoId);
            if (!card) card = feedCard(item);
            if (card !== cursor) grid.insertBefore(card, cursor);
            else cursor = cursor.nextElementSibling;
        }
        for (const node of existing.values()) node.remove();
        let moreRow = box.querySelector(':scope > .ftf-more');
        if (more && !moreRow) {
            moreRow = el('div', 'ftf-more');
            moreRow.append(button(t('feed.built.more', 'Show more'), () => loadMore(), false));
            box.append(moreRow);
        } else if (!more && moreRow) moreRow.remove();
    }

    function feedCard(item) {
        const card = el('a', 'ftf-card');
        card.dataset.videoId = item.videoId;
        card.href = `/watch?v=${encodeURIComponent(item.videoId)}`;
        const img = el('img', 'ftf-thumb');
        img.src = item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        card.append(img, el('p', 'ftf-card-title', item.title || ''));
        const meta = [item.channelName, age(item)].filter(Boolean).join(' · ');
        if (meta) card.append(el('p', 'ftf-card-meta', meta));
        return card;
    }

    function drawLoading(panel, sources) {
        header(panel, 'allow',
            sources.study ? studyTitle(sources) : t('feed.built.title', 'From your allowed channels'), null);
        chips(panel, sources, true);
        const box = body(panel, 'loading');
        if (box.childElementCount) return;
        const row = el('div', 'ftf-loading');
        const uljhan = mascot('uljhan_fetch_01.webp', '');
        if (uljhan) row.append(uljhan);
        row.append(el('span', '', t('feed.built.loading', 'Gathering the latest from your list…')));
        box.append(row);
    }

    function drawBlockCalm(panel) {
        header(panel, 'block', t('feed.calm.title', 'Most of this page matched your filters'),
            t('feed.calm.body', 'FilterTube stopped loading more of it. Your subscriptions and search still work.'));
        chips(panel, null, false);
        const box = body(panel, 'calm');
        if (box.childElementCount) return;
        const row = el('div', 'ftf-empty');
        const kriti = mascot('kriti_peek.webp', '');
        if (kriti) row.append(kriti);
        const actions = el('div', 'ftf-actions');
        actions.append(button(t('feed.calm.subscriptions', 'Open subscriptions'), () => { root.location.href = '/feed/subscriptions'; }, true));
        actions.append(button(t('feed.built.search', 'Search'), focusSearch));
        actions.append(button(t('feed.calm.review', 'Review filters'), () => openDashboard('filters')));
        row.append(actions);
        box.append(row);
    }

    function visibleItems(items, current) {
        return items.filter(item => !hiddenByRules(item, current));
    }

    async function ensureBuilt(sources, current) {
        const key = `${sources.channels.map(ch => ch.id).join(',')}|${sources.topics.slice(0, 20).join(',')}`;
        if (built && built.key === key) return built;
        if (building && building.key === key) return building.promise;
        // Study ranks by plan topic, which only means something over the whole plan: every plan channel
        // is read at once (at most 24, cached for an hour, three requests at a time). Allowed only starts
        // with the first few channels and "Show more" reads the rest.
        const batch = sources.study ? Math.min(Math.max(sources.channels.length, Feed.FIRST_BATCH), STUDY_BATCH) : Feed.FIRST_BATCH;
        const promise = builder.build(sources, { batch }).then(result => {
            shownCount = PAGE_SIZE;
            built = { key, items: result.items, nextOffset: result.nextOffset, unreachable: result.unreachable };
            return built;
        }).finally(() => { if (building?.promise === promise) building = null; });
        building = { key, promise };
        return promise;
    }

    async function loadMore() {
        const current = settings();
        if (!built || !current) return;
        const visible = visibleItems(built.items, current).length;
        // Cards already fetched come first; the next channels are asked only when those run out.
        if (visible <= shownCount + PAGE_SIZE / 2 && built.nextOffset !== null) {
            const sources = Feed.feedSources(current);
            const result = await builder.build(sources, { offset: built.nextOffset, searches: 0 });
            const seen = new Set(built.items.map(item => item.videoId));
            built = { ...built, items: built.items.concat(result.items.filter(item => !seen.has(item.videoId))), nextOffset: result.nextOffset };
        }
        shownCount += PAGE_SIZE / 2;
        shownFor = '';
        decide(true);
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

    function feedKey(sources) {
        return `${sources.channels.map(ch => ch.id).join(',')}|${sources.topics.slice(0, 20).join(',')}`;
    }

    /**
     * What this page shows: 'feed' (the built feed), 'allow-empty', 'block-calm' or 'none'. In a narrowed
     * mode the narrowed layer's page plan decides (Home is always the built feed; Search, Watch and channel
     * pages have their own owners); otherwise the block list's empty-feed guard does.
     */
    function decision(current, sources, kind, route) {
        const html = doc.documentElement;
        const exhausted = String(html.getAttribute('data-filtertube-feed-exhausted') || '').endsWith(`:${route}`);
        const emptyHere = String(html.getAttribute('data-filtertube-feed-empty') || '').endsWith(`:${route}`);
        const layer = narrowedView()?.current?.();
        if (layer && layer.plan?.narrowed) {
            if (layer.plan.builtFeed) return 'feed';
            const page = layer.plan.page;
            if (page === 'search' || page === 'watch' || page === 'channel' || page === 'shorts') return 'none';
            return exhausted ? 'allow-empty' : 'none';
        }
        if (sources.allow) {
            // A Home with no cards of its own at all (signed out, or history off) has nothing to hide
            // either: once it has settled, the allowed sources fill it.
            const bareHome = kind === 'home' && Date.now() - navigatedAt > SETTLE_MS && visibleCardCount() === 0;
            if (kind === 'home' && (sources.study || emptyHere || exhausted || bareHome)) return 'feed';
            if (exhausted && kind !== 'search') return 'allow-empty';
            return 'none';
        }
        if (exhausted || ((kind === 'home' || kind === 'feed' || kind === 'search') && domLooksExhausted())) return 'block-calm';
        return 'none';
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
        const sources = Feed.feedSources(current);
        const studying = sources.study;
        const chosen = decision(current, sources, kind, route);
        // A plain word for diagnostics (and the capture scripts): what this page decided.
        html.setAttribute('data-filtertube-feed-decision', `${chosen}${sources.allow ? ':allow' : ':block'}${studying ? ':study' : ''}`);
        const info = studyInfo();
        const stamp = `${route}|${chosen}|${built?.key || ''}|${built?.items?.length || 0}|${info.label}|${info.chips.length}|${companion}`;
        if (chosen === 'none') { if (doc.getElementById(PANEL_ID)) removePanel(); return; }
        if (!force && stamp === shownFor && doc.getElementById(PANEL_ID)?.isConnected) return;

        const my = ++token;
        if (chosen === 'block-calm') {
            const panel = panelShell();
            if (!panel) return;
            drawBlockCalm(panel);
            refreshModeBar();
            shownFor = stamp;
            return;
        }
        if (chosen === 'allow-empty') {
            const panel = panelShell();
            if (!panel) return;
            drawAllowEmpty(panel, sources, { unreachable: false, page: kind });
            refreshModeBar();
            shownFor = stamp;
            return;
        }
        // chosen === 'feed'
        html.setAttribute(BUILT_ATTR, '');
        let panel = panelShell();
        if (!panel) return;
        if (!sources.channels.length && !sources.topics.length) {
            drawAllowEmpty(panel, sources, { unreachable: false });
            refreshModeBar();
            shownFor = stamp;
            return;
        }
        if (!built || built.key !== feedKey(sources)) drawLoading(panel, sources);
        refreshModeBar();
        const result = await ensureBuilt(sources, current).catch(() => null);
        if (my !== token) return;
        panel = panelShell();
        if (!panel) return;
        const items = result ? visibleItems(result.items, settings() || current) : [];
        if (!items.length) drawAllowEmpty(panel, sources, { unreachable: !result || result.unreachable });
        else drawFeed(panel, sources, items.slice(0, shownCount), result.nextOffset !== null || items.length > shownCount);
        refreshModeBar();
        const after = studyInfo();
        shownFor = `${route}|${chosen}|${built?.key || ''}|${built?.items?.length || 0}|${after.label}|${after.chips.length}|${companion}`;
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
        if (!current || prevAllow !== (current.listMode === 'whitelist') || prevStudy !== (current.study?.phase === 'study')) built = null;
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
    // Events only: settings applied in this tab, the narrowed layer's decision, navigation. A block-list
    // Home that turns out bare is looked at once more after it has settled.
    doc.addEventListener('filtertube-settings-applied', watchSettings);
    doc.addEventListener('filtertube-narrowed-change', () => schedule(false));
    doc.addEventListener('yt-navigate-finish', () => { navigatedAt = Date.now(); shownFor = ''; schedule(true); root.setTimeout(() => schedule(false), SETTLE_MS + 200); }, true);
    doc.addEventListener('yt-page-data-updated', () => schedule(false), true);
    try {
        runtime.onMessage.addListener(message => {
            if (message?.action === 'FilterTube_ApplySettings' || message?.action === 'FilterTube_StudyState') root.setTimeout(watchSettings, 50);
        });
    } catch (e) { }
    root.setTimeout(() => { watchSettings(); schedule(false); }, SETTLE_MS + 200);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => schedule(true), { once: true });
    else schedule(true);

    root.FilterTubeAllowFeedView = { decide, removePanel, refreshModeBar, _state: () => ({ built, shownFor }) };
}());
