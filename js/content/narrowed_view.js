/* The narrowed mode on the video site's pages (isolated world): Allowed only and Study, one layer.
 *
 * js/shared/narrowed_mode.js decides, once per page, what the page does in the mode in force (the table is
 * at the top of that file). This script applies it:
 * - html[data-filtertube-narrowed] (the mode) and [...-page] (the page) switch one stylesheet: on Home the
 *   site's grid, chip bar and loader are hidden in place (the built feed owns the page body), on Search the
 *   site's shelves are off, in the left pane Explore, the product links and the site's channel list are off;
 * - the left pane gets FilterTube's own channel list ("Study channels" / "Allowed channels");
 * - the mode bar (Watch, and the Home feed's header): the plan, the round and minutes left, End per the lock
 *   rules; or "Allowed only"; and why this video shows;
 * - Home's built feed (allowlist_feed_view.js), the search shelf (channel_search_shelf.js) and the channel
 *   page hold (dom_fallback.js) read the same decision.
 * It runs on events only (settings applied, navigation, page data, study state pushes); nothing polls. Every
 * change is in place: an element is created once and its text changed when the text changes. Leaving the mode
 * removes the attributes and FilterTube's elements, so the site's page is exactly as it was.
 * Copy comes from data/ui_locales through admission_overlay.js; no string names the video site.
 */
(function () {
    'use strict';
    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    if (root.__filtertubeNarrowedView) return;
    root.__filtertubeNarrowedView = true;
    const doc = root.document;
    const host = String(root.location?.hostname || '');
    if (!doc || !/(^|\.)youtube\.com$/.test(host) || host.startsWith('m.')) return;
    const Mode = root.FilterTubeNarrowedMode;
    const runtime = root.chrome?.runtime || root.browser?.runtime;
    if (!Mode) return;

    const ATTR = 'data-filtertube-narrowed';
    const STYLE_ID = 'filtertube-narrowed-style';
    const GUIDE_ID = 'filtertube-narrowed-guide';
    const BAR_CLASS = 'filtertube-mode-bar';
    const WATCH_BAR_ID = 'filtertube-mode-bar-watch';
    const GUIDE_SHOWN = 7;

    let mode = Mode.modeOf(null);
    let plan = Mode.pagePlan(mode, 'other');
    let studyState = null;      // the background's study state (FilterTube_StudyGetState / FilterTube_StudyState)
    let packs = [];             // the plan's packs (names, chips, keywords) for the label and the chips
    let packsFor = '';
    let lastSignature = '';
    let guideExpanded = false;
    let guideWatch = null;
    let tickTimer = 0;

    function t(key, fallback, values) {
        let value = fallback;
        try {
            const localized = root.FilterTubeAdmissionOverlay?.text?.(key, fallback);
            if (typeof localized === 'string' && localized.trim()) value = localized;
        } catch (e) { }
        return String(value).replace(/\{([a-zA-Z]+)\}/g, (m, name) => (values && name in values ? String(values[name]) : m));
    }
    function say(entry) { return entry ? t(entry.key, entry.fallback, entry.values) : ''; }
    function settings() { try { return root.currentSettings || null; } catch (e) { return null; } }
    function send(message) {
        try { return Promise.resolve(runtime?.sendMessage?.(message)).catch(() => null); } catch (e) { return Promise.resolve(null); }
    }
    function el(tag, className, value) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined && value !== null) node.textContent = value;
        return node;
    }
    function setText(node, value) {
        const next = value || '';
        if (node && node.textContent !== next) node.textContent = next;
    }
    function formatTime(ms) {
        try { return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
    }

    function ensureStyle() {
        if (doc.getElementById(STYLE_ID)) return;
        const style = doc.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `${Mode.narrowedCss(ATTR, { guideId: GUIDE_ID })}
${Mode.emptyShelfCss()}
.${BAR_CLASS}{--ftm-paper:#fffdfa;--ftm-ink:#2b2622;--ftm-muted:#625f58;--ftm-line:#ddd5ca;--ftm-sage:#3e7d5b;--ftm-teal:#1f6f6a;
  display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;box-sizing:border-box;margin:12px 0 0;padding:8px 10px 8px 14px;min-height:44px;
  border:1.5px solid var(--ftm-line);border-radius:14px;background:var(--ftm-paper);color:var(--ftm-ink);font:400 14px/1.35 "Outfit","Roboto",system-ui,sans-serif}
html[dark] .${BAR_CLASS}{--ftm-paper:#151c24;--ftm-ink:#eef2f6;--ftm-muted:#b8c3ce;--ftm-line:#2a3440;--ftm-sage:#7fb89a;--ftm-teal:#7fc4bd}
.${BAR_CLASS} .ftm-label{display:inline-flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap}
.${BAR_CLASS} .ftm-label::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ftm-sage)}
.${BAR_CLASS} .ftm-detail,.${BAR_CLASS} .ftm-reason{color:var(--ftm-muted);white-space:nowrap}
.${BAR_CLASS} .ftm-detail:empty,.${BAR_CLASS} .ftm-reason:empty{display:none}
.${BAR_CLASS} .ftm-detail::before,.${BAR_CLASS} .ftm-reason::before{content:"·";margin-inline-end:12px;color:var(--ftm-line)}
.${BAR_CLASS} .ftm-action{margin-inline-start:auto;display:inline-flex;align-items:center;gap:8px;color:var(--ftm-muted);font-size:13px}
.${BAR_CLASS} .ftm-action:empty{display:none}
.${BAR_CLASS} button{appearance:none;min-height:32px;padding:4px 14px;border-radius:999px;border:1.5px solid var(--ftm-line);background:transparent;color:var(--ftm-ink);
  font:500 13px/1.2 "Outfit","Roboto",system-ui,sans-serif;cursor:pointer;transition:border-color .15s ease,background-color .15s ease}
.${BAR_CLASS} button:hover{border-color:var(--ftm-teal)}
.${BAR_CLASS} button:focus-visible{outline:2px solid var(--ftm-ink);outline-offset:2px}
#${WATCH_BAR_ID}{margin:12px 0 4px}
#${GUIDE_ID}{padding:12px 0;border-bottom:1px solid var(--yt-spec-10-percent-layer,rgba(0,0,0,.1))}
#${GUIDE_ID} h3{margin:0;padding:6px 12px 4px;font:600 16px/1.4 "Roboto",system-ui,sans-serif;color:var(--yt-spec-text-primary,#0f0f0f)}
#${GUIDE_ID} .ftg-note{margin:0;padding:0 12px 6px;font:400 12px/1.4 "Roboto",system-ui,sans-serif;color:var(--yt-spec-text-secondary,#606060)}
#${GUIDE_ID} a,#${GUIDE_ID} button{display:flex;align-items:center;gap:20px;width:100%;box-sizing:border-box;min-height:40px;padding:0 12px;border:0;border-radius:10px;
  background:transparent;color:var(--yt-spec-text-primary,#0f0f0f);font:400 14px/1.3 "Roboto",system-ui,sans-serif;text-decoration:none;cursor:pointer;text-align:start}
#${GUIDE_ID} a:hover,#${GUIDE_ID} button:hover{background:var(--yt-spec-10-percent-layer,rgba(0,0,0,.05))}
#${GUIDE_ID} .ftg-dot{flex:0 0 24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#eef5ef;color:#3e7d5b;font:600 12px/1 "Roboto",system-ui,sans-serif}
html[dark] #${GUIDE_ID} .ftg-dot{background:#1f2b25;color:#7fb89a}
#${GUIDE_ID} .ftg-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
@media (prefers-reduced-motion:reduce){.${BAR_CLASS} button{transition:none}}`;
        (doc.head || doc.documentElement).appendChild(style);
    }

    // ---- Study label and chips ------------------------------------------------------------------------

    function loadPacks() {
        const key = (settings()?.study?.packIds || []).join(',');
        if (mode.kind !== 'study') { packs = []; packsFor = ''; return; }
        if (key && key === packsFor) return;
        packsFor = key;
        send({ action: 'FilterTube_StudyGetState' }).then(state => {
            if (state && typeof state === 'object') studyState = state;
            const next = Array.isArray(state?.packs) ? state.packs : [];
            if (JSON.stringify(next) !== JSON.stringify(packs)) {
                packs = next;
                notify();
            }
            renderBars();
        });
    }

    /** {label, chips} for the study Home: "SAT + GMAT" and the plan's subject chips. */
    function studyInfo() {
        const Feed = root.FilterTubeAllowlistFeed;
        return {
            label: Feed?.studyLabel ? Feed.studyLabel(packs) : '',
            chips: Feed?.homeChips ? Feed.homeChips(packs) : []
        };
    }

    // ---- The mode bar ---------------------------------------------------------------------------------

    function currentStudy() {
        // The background's own state is fresher (End, Cancel); compiled settings carry the same fields.
        const compiled = settings()?.study || null;
        if (!studyState) return compiled;
        if (compiled && Number(compiled.validUntil || 0) > Number(studyState.validUntil || 0)) return compiled;
        return studyState;
    }

    function watchVideo() {
        const flexy = doc.querySelector('ytd-watch-flexy');
        const wanted = new URLSearchParams(root.location.search).get('v') || '';
        const videoId = flexy?.getAttribute('video-id') || '';
        if (!flexy || !wanted || videoId !== wanted) return null;
        const owner = flexy.querySelector('ytd-watch-metadata #owner ytd-channel-name a, ytd-watch-metadata ytd-video-owner-renderer a[href^="/@"], ytd-video-owner-renderer a.yt-simple-endpoint');
        const href = owner?.getAttribute('href') || '';
        const handle = /^\/(@[^/?#]+)/.exec(href)?.[1] || '';
        const channelId = /^\/channel\/(UC[\w-]{22})/.exec(href)?.[1] || '';
        const title = flexy.querySelector('ytd-watch-metadata h1')?.textContent?.trim() || doc.title.replace(/ - [^-]+$/, '');
        return { videoId, channelHandle: handle ? decodeURIComponent(handle) : '', channelId, title };
    }

    /** Draws (or updates in place) a mode bar in `container`; `why` says why the video shows (Watch). */
    function renderModeBar(container, { why = null, id = '' } = {}) {
        if (!container) return null;
        let bar = id ? doc.getElementById(id) : container.querySelector(`:scope > .${BAR_CLASS}`);
        const label = mode.kind === 'study' ? studyInfo().label : '';
        const model = Mode.modeBarModel(mode, currentStudy(), why, { now: Date.now(), label });
        if (!model) { bar?.remove(); return null; }
        ensureStyle();
        if (!bar) {
            bar = el('div', BAR_CLASS);
            if (id) bar.id = id;
            bar.setAttribute('role', 'status');
            bar.append(el('span', 'ftm-label'), el('span', 'ftm-detail'), el('span', 'ftm-reason'), el('span', 'ftm-action'));
        }
        if (bar.parentElement !== container) container.prepend(bar);
        bar.dataset.kind = model.kind;
        setText(bar.querySelector('.ftm-label'), say(model.label));
        setText(bar.querySelector('.ftm-detail'), say(model.detail));
        setText(bar.querySelector('.ftm-reason'), say(model.reason));
        renderAction(bar.querySelector('.ftm-action'), model.action);
        scheduleTick(model);
        return bar;
    }

    function renderAction(box, action) {
        const signature = action ? `${action.kind}|${action.seconds ?? ''}|${action.until ?? ''}` : '';
        if (box.dataset.signature === signature) return;
        const kindChanged = (box.dataset.signature || '').split('|')[0] !== (action?.kind || '');
        box.dataset.signature = signature;
        if (!action) { box.textContent = ''; return; }
        if (action.kind === 'locked') {
            box.textContent = action.until ? t('study.lockedUntil', 'Locked until {time}', { time: formatTime(action.until) }) : '';
            return;
        }
        if (!kindChanged && action.kind === 'cancel') {
            setText(box.querySelector('.ftm-count'), t('study.endingSeconds', 'Ending in {seconds} seconds', { seconds: action.seconds }));
            return;
        }
        box.textContent = '';
        if (action.kind === 'end') {
            const button = el('button', '', t('study.endSession', 'End session'));
            button.type = 'button';
            button.title = t('study.endHint', 'It ends after a 30-second pause, so you can still cancel.');
            button.addEventListener('click', event => {
                if (!event.isTrusted) return; // only a person's click ends a session
                button.disabled = true;
                send({ action: 'FilterTube_StudyEndSession' }).then(result => { if (!result?.ok) button.disabled = false; return refreshStudyState(); });
            });
            box.append(button);
        } else if (action.kind === 'cancel') {
            box.append(el('span', 'ftm-count', t('study.endingSeconds', 'Ending in {seconds} seconds', { seconds: action.seconds })));
            const button = el('button', '', t('study.cancelEnd', 'Cancel'));
            button.type = 'button';
            button.addEventListener('click', event => {
                if (!event.isTrusted) return;
                button.disabled = true;
                send({ action: 'FilterTube_StudyCancelEnd' }).then(result => { if (!result?.ok) button.disabled = false; return refreshStudyState(); });
            });
            box.append(button);
        }
    }

    /** The minutes left change once a minute; a pending End counts down by the second. One timer, only while a bar shows. */
    function scheduleTick(model) {
        if (tickTimer) { root.clearTimeout(tickTimer); tickTimer = 0; }
        if (!model || model.kind !== 'study') return;
        const delay = model.action?.kind === 'cancel' ? 1000 : 60000 - (Date.now() % 60000) + 50;
        tickTimer = root.setTimeout(() => { tickTimer = 0; renderBars(); }, delay);
    }

    function refreshStudyState() {
        return send({ action: 'FilterTube_StudyGetState' }).then(state => {
            if (state && typeof state === 'object') studyState = state;
            renderBars();
        });
    }

    let watchTries = 0;
    function renderWatchBar() {
        const existing = doc.getElementById(WATCH_BAR_ID);
        if (!plan.modeBar || plan.page !== 'watch') { existing?.remove(); return; }
        const below = doc.querySelector('ytd-watch-flexy #below');
        const video = watchVideo();
        if (!below || !video) {
            // The watch page fills in a moment after navigation; look again a few times, then wait for its event.
            if (watchTries++ < 6) root.setTimeout(renderWatchBar, 300);
            return;
        }
        watchTries = 0;
        renderModeBar(below, { why: Mode.whyShown(mode, video), id: WATCH_BAR_ID });
    }

    function renderBars() {
        renderWatchBar();
        // The Home feed draws its own header and asks for the bar there.
        try { root.FilterTubeAllowFeedView?.refreshModeBar?.(); } catch (e) { }
    }

    // ---- The left pane --------------------------------------------------------------------------------

    function channelHref(channel) {
        if (channel.handle) return `/${channel.handle}`;
        return channel.id ? `/channel/${channel.id}` : '/';
    }

    function renderGuide() {
        const sections = doc.querySelector('ytd-guide-renderer #sections');
        let box = doc.getElementById(GUIDE_ID);
        if (!plan.guide || !mode.channels.length) { box?.remove(); return; }
        if (!sections) { watchForGuide(); return; }
        const signature = `${mode.key}|${guideExpanded}|${mode.channels.length}`;
        if (box && box.dataset.signature === signature && box.isConnected) return;
        if (!box) {
            box = el('div', '');
            box.id = GUIDE_ID;
            box.setAttribute('role', 'navigation');
        }
        box.dataset.signature = signature;
        box.textContent = '';
        const study = mode.kind === 'study';
        const title = study ? t('narrowed.guide.studyTitle', 'Study channels') : t('narrowed.guide.allowTitle', 'Allowed channels');
        box.setAttribute('aria-label', title);
        box.append(el('h3', '', title));
        box.append(el('p', 'ftg-note', study
            ? t('narrowed.guide.studyNote', 'Explore and other links come back after study.')
            : t('narrowed.guide.allowNote', 'Only these channels and your allowed words show.')));
        // Plan channels first during study; then the person's own.
        const list = [...mode.channels].sort((a, b) => Number(b.plan) - Number(a.plan));
        const shown = guideExpanded ? list : list.slice(0, GUIDE_SHOWN);
        for (const channel of shown) {
            const link = el('a', '');
            link.href = channelHref(channel);
            const name = channel.name || channel.handle || channel.id;
            const dot = el('span', 'ftg-dot', (name.replace(/^@/, '')[0] || '•').toUpperCase());
            dot.setAttribute('aria-hidden', 'true');
            link.append(dot, el('span', 'ftg-name', name));
            box.append(link);
        }
        if (list.length > GUIDE_SHOWN) {
            const more = el('button', '', guideExpanded
                ? t('narrowed.guide.less', 'Show fewer')
                : t('narrowed.guide.more', 'Show {count} more', { count: list.length - GUIDE_SHOWN }));
            more.type = 'button';
            more.addEventListener('click', () => { guideExpanded = !guideExpanded; renderGuide(); });
            box.append(more);
        }
        const first = sections.querySelector(':scope > ytd-guide-section-renderer');
        if (first && box.previousElementSibling !== first) first.after(box);
        else if (!first && box.parentElement !== sections) sections.prepend(box);
        keepGuide(sections);
    }

    /** The site redraws the pane's sections now and then (sign-in state, navigation); put the list back then. */
    let keptSections = null;
    let keeper = null;
    function keepGuide(sections) {
        if (keptSections === sections) return;
        keeper?.disconnect();
        keptSections = sections;
        keeper = new MutationObserver(() => {
            if (plan.guide && mode.channels.length && !doc.getElementById(GUIDE_ID)?.isConnected) renderGuide();
        });
        keeper.observe(sections, { childList: true });
    }

    /** The left pane is drawn when it first opens: watch its drawer (only) until it is, then stop. */
    function watchForGuide() {
        if (guideWatch) return;
        const drawer = doc.querySelector('tp-yt-app-drawer#guide, #guide');
        if (!drawer) return; // the next navigation looks again
        guideWatch = new MutationObserver(() => {
            if (!doc.querySelector('ytd-guide-renderer #sections > ytd-guide-section-renderer')) return;
            guideWatch.disconnect();
            guideWatch = null;
            renderGuide();
        });
        guideWatch.observe(drawer, { childList: true, subtree: true });
    }

    // ---- The decision ---------------------------------------------------------------------------------

    function notify() {
        try { doc.dispatchEvent(new CustomEvent('filtertube-narrowed-change')); } catch (e) { }
    }

    function decide() {
        const current = settings();
        const nextMode = Mode.modeOf(current);
        const page = Mode.pageOf(root.location.pathname);
        const nextPlan = Mode.pagePlan(nextMode, page);
        const signature = `${nextMode.key}|${page}|${root.location.search}`;
        const modeChanged = nextMode.key !== mode.key;
        mode = nextMode;
        plan = nextPlan;
        const html = doc.documentElement;
        if (plan.narrowed) {
            ensureStyle();
            if (html.getAttribute(ATTR) !== mode.kind) html.setAttribute(ATTR, mode.kind);
            if (html.getAttribute(`${ATTR}-page`) !== page) html.setAttribute(`${ATTR}-page`, page);
        } else {
            html.removeAttribute(ATTR);
            html.removeAttribute(`${ATTR}-page`);
        }
        markExhausted();
        if (modeChanged) { studyState = null; loadPacks(); }
        renderGuide();
        renderBars();
        if (signature !== lastSignature) {
            lastSignature = signature;
            notify();
        }
    }

    /**
     * The main world's feed guard stopped a page whose loads keep coming back fully hidden: in a narrowed
     * mode its spinner goes too (Search with nothing allowed would otherwise spin under the shelf).
     */
    function markExhausted() {
        const html = doc.documentElement;
        const route = `${root.location.pathname}${root.location.search}`;
        const done = plan.narrowed && String(html.getAttribute('data-filtertube-feed-exhausted') || '').endsWith(`:${route}`);
        if (done) { if (!html.hasAttribute(`${ATTR}-done`)) html.setAttribute(`${ATTR}-done`, ''); }
        else html.removeAttribute(`${ATTR}-done`);
    }
    new MutationObserver(markExhausted).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-filtertube-feed-exhausted'] });

    let scheduled = 0;
    function schedule() {
        if (scheduled) return;
        scheduled = root.setTimeout(() => { scheduled = 0; decide(); }, 30);
    }

    doc.addEventListener('filtertube-settings-applied', schedule);
    doc.addEventListener('yt-navigate-finish', () => { watchTries = 0; schedule(); }, true);
    doc.addEventListener('yt-page-data-updated', () => { watchTries = 0; schedule(); }, true);
    try {
        runtime?.onMessage?.addListener?.(message => {
            if (message?.action === 'FilterTube_StudyState') {
                if (message.state && typeof message.state === 'object') studyState = { ...(studyState || {}), ...message.state };
                root.setTimeout(schedule, 60);
            } else if (message?.action === 'FilterTube_ApplySettings') {
                root.setTimeout(schedule, 60);
            }
        });
    } catch (e) { }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', schedule, { once: true });
    else schedule();

    root.FilterTubeNarrowedView = Object.freeze({
        current: () => ({ mode, plan }),
        studyInfo,
        renderModeBar,
        refresh: schedule
    });
}());
