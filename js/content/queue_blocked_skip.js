/*
 * What to do when the current Watch video turns out blocked, often only once its Watch page loads
 * (a description keyword, or other late metadata such as category or language). Port of the
 * Android NativeMainQueueBlockedSkip model (fde90885d). Inside a site playlist or Mix the rows
 * are the queue and skipping is always on. Outside a list, with "Skip blocked autoplay videos"
 * (#82), the Up next / related videos are the queue, forward only.
 *
 * Model:
 *  - Every watch-to-watch navigation records how it was entered. The player's Next / Previous,
 *    the playlist's own advance at the end of a video, media keys and this module's own skips
 *    are queue-driven. A click on that exact video anywhere (including a playlist panel row),
 *    browser Back/Forward, a typed or pasted URL and a reload are direct. When unsure: direct.
 *  - A late block on a direct selection keeps today's blocked card: the user chose it.
 *  - A late block on a queue-driven selection skips, once, to the first allowed row in the same
 *    direction (Previous goes back; everything else goes forward). Rows come only from one side
 *    of the current row, never wrapping, and a skip chain is bounded by MAX_CHAIN.
 *  - No allowed row left that way: the normal blocked card with an end-of-queue line.
 *  - Pre-check: panel rows already carry title and channel (the page pass hides rows those
 *    block), and a session-only verdict cache remembers videos whose Watch page was blocked
 *    under the current rules, so known-blocked rows are hidden in place and passed over before
 *    they start. The cache lives in this tab's memory only: never storage, backups or sync.
 *
 * Decisions are pure (decide / classifyNavigation); the controller gathers facts from a host
 * (dom_fallback.js) and owns every effect.
 */
(function(root) {
    'use strict';

    const Entry = Object.freeze({
        DIRECT: 'direct',
        NEXT: 'next',
        PREVIOUS: 'previous',
        AUTOPLAY: 'autoplay',
        // No input at all: decided from the playlist index once the new video is known
        // (one step forward = Next from a media key, one step back = Previous, else direct).
        ADJACENT: 'adjacent'
    });

    const MAX_CHAIN = 25;
    const INPUT_WINDOW_MS = 1500;
    const AUTOPLAY_WINDOW_MS = 20000;
    const SKIP_WINDOW_MS = 8000;
    const SKIP_DELAY_MS = 250;
    const SKIP_RETRY_MS = 400;
    // The site's own end-of-video countdown is shorter; only a stalled autoplay waits this long.
    const AUTOPLAY_STALL_MS = 9000;
    const SKIP_RETRIES = 8;
    const TOAST_MS = 3200;
    const VERDICT_LIMIT = 300;
    const SKIPPED_TEXT = 'Skipped a video your filters hide';
    const END_LINE = 'Nothing left in this queue that your filters allow';
    const VERDICT_MARKER = 'data-filtertube-hidden-by-watch-verdict';

    function isQueueDriven(entry) {
        return entry === Entry.NEXT || entry === Entry.PREVIOUS || entry === Entry.AUTOPLAY;
    }

    function isBackward(entry) {
        return entry === Entry.PREVIOUS;
    }

    function selection(entry, fromVideoId, videoId = null, chain = 0, extra = {}) {
        return { entry, fromVideoId: fromVideoId || null, videoId: videoId || null, chain, ...extra };
    }

    function appliesTo(sel, selected) {
        if (!sel || !selected) return false;
        return sel.videoId ? sel.videoId === selected : sel.fromVideoId !== selected;
    }

    /**
     * Bind a selection to the video it landed on. An ADJACENT entry resolves here from the
     * playlist position: one step forward in the same list is Next, one step back is Previous,
     * anything else is direct.
     */
    function boundTo(sel, selected, landing = {}) {
        if (!sel || sel.videoId || !appliesTo(sel, selected)) return sel;
        let entry = sel.entry;
        if (entry === Entry.ADJACENT) {
            const from = Number(sel.fromIndex);
            const to = Number(landing.index);
            const sameList = Boolean(sel.fromList) && sel.fromList === landing.list;
            entry = sameList && from > 0 && to === from + 1 ? Entry.NEXT
                : (sameList && from > 0 && to === from - 1 ? Entry.PREVIOUS : Entry.DIRECT);
        }
        return selection(entry, sel.fromVideoId, selected, sel.chain);
    }

    /** Rows strictly after (forward) or before (backward, nearest first) the selected row; no wrap. */
    function candidatesInDirection(rows, selectedIndex, backward) {
        if (!Array.isArray(rows) || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= rows.length) return [];
        return backward ? rows.slice(0, selectedIndex).reverse() : rows.slice(selectedIndex + 1);
    }

    /** The first candidate the facts on hand do not block. */
    function firstAllowed(candidates) {
        return (candidates || []).find(candidate => candidate && !candidate.precheckBlocked) || null;
    }

    /**
     * decide({ selection, selectedVideoId, blocked, candidates, handledVideoId })
     *   -> { step: { kind: 'none' | 'keepCard' | 'skip' | 'endOfQueue', target?, next? }, handledVideoId }
     */
    function decide({ selection: sel, selectedVideoId, blocked, candidates = [], handledVideoId = null }) {
        if (!blocked) {
            return { step: { kind: 'none' }, handledVideoId: handledVideoId === selectedVideoId ? null : handledVideoId };
        }
        if (handledVideoId === selectedVideoId) return { step: { kind: 'none' }, handledVideoId };
        const applied = appliesTo(sel, selectedVideoId) ? sel : null;
        if (!applied || !isQueueDriven(applied.entry)) return { step: { kind: 'keepCard' }, handledVideoId: selectedVideoId };
        if (applied.chain >= MAX_CHAIN) return { step: { kind: 'endOfQueue' }, handledVideoId: selectedVideoId };
        const next = selection(applied.entry, selectedVideoId, null, applied.chain + 1);
        const target = firstAllowed(candidates);
        if (target) return { step: { kind: 'skip', target, next }, handledVideoId: selectedVideoId };
        return { step: { kind: 'endOfQueue' }, handledVideoId: selectedVideoId };
    }

    /**
     * How a watch-to-watch navigation was entered, from facts recorded before it started.
     * facts: { at, fromVideoId, fromIndex, fromList, input: { kind: 'next'|'previous'|'other', at },
     *          ended: { videoId, at }, popstateAt, pendingSkip: { next, at } }
     */
    function classifyNavigation(facts = {}) {
        const at = Number(facts.at) || 0;
        const fromVideoId = facts.fromVideoId || null;
        const input = facts.input && at - facts.input.at <= INPUT_WINDOW_MS && facts.input.at <= at ? facts.input : null;
        const ended = facts.ended && fromVideoId && facts.ended.videoId === fromVideoId &&
            at - facts.ended.at <= AUTOPLAY_WINDOW_MS ? facts.ended : null;
        const skip = facts.pendingSkip && at - facts.pendingSkip.at <= SKIP_WINDOW_MS && facts.pendingSkip.at <= at
            ? facts.pendingSkip : null;
        const latestEvent = Math.max(input?.at || 0, ended?.at || 0, skip?.at || 0);
        // Browser Back / Forward: the user picked a history entry.
        if (facts.popstateAt && at - facts.popstateAt <= INPUT_WINDOW_MS && facts.popstateAt >= latestEvent) {
            return selection(Entry.DIRECT, fromVideoId);
        }
        if (input && input.at >= (ended?.at || 0) && input.at >= (skip?.at || 0)) {
            if (input.kind === 'next') return selection(Entry.NEXT, fromVideoId);
            if (input.kind === 'previous') return selection(Entry.PREVIOUS, fromVideoId);
            return selection(Entry.DIRECT, fromVideoId);
        }
        if (skip && skip.at >= (ended?.at || 0)) {
            return { ...skip.next, fromVideoId, videoId: null };
        }
        if (ended) return selection(Entry.AUTOPLAY, fromVideoId);
        if (facts.fromList && Number(facts.fromIndex) > 0) {
            return selection(Entry.ADJACENT, fromVideoId, null, 0, { fromIndex: Number(facts.fromIndex), fromList: facts.fromList });
        }
        return selection(Entry.DIRECT, fromVideoId);
    }

    /** Input that starts a navigation: the player's Next / Previous, their keys, or anything else. */
    function classifyInput(event) {
        if (!event || event.isTrusted === false) return null;
        if (event.type === 'keydown') {
            const key = String(event.key || '');
            if (key === 'MediaTrackNext' || (event.shiftKey && key.toLowerCase() === 'n')) return 'next';
            if (key === 'MediaTrackPrevious' || (event.shiftKey && key.toLowerCase() === 'p')) return 'previous';
            return key === 'Enter' || key === ' ' ? 'other' : null;
        }
        const target = event.target;
        const closest = selector => {
            try { return typeof target?.closest === 'function' ? target.closest(selector) : null; } catch (e) { return null; }
        };
        if (closest('.ytp-next-button')) return 'next';
        if (closest('.ytp-prev-button')) return 'previous';
        return 'other';
    }

    /**
     * Session-only verdicts: video id -> the rule signature it was blocked under. A different
     * signature (any rule change) makes the entry stale; it is dropped on the next lookup.
     * Held in this closure only; nothing here is ever written to storage.
     */
    function createVerdictCache(limit = VERDICT_LIMIT) {
        const verdicts = new Map();
        return Object.freeze({
            remember(videoId, signature, reason) {
                if (!videoId || !signature) return;
                verdicts.delete(videoId);
                verdicts.set(videoId, { signature, reason: String(reason || '') });
                while (verdicts.size > limit) verdicts.delete(verdicts.keys().next().value);
            },
            forget(videoId) {
                verdicts.delete(videoId);
            },
            lookup(videoId, signature) {
                const verdict = verdicts.get(videoId);
                if (!verdict) return null;
                if (!signature || verdict.signature !== signature) {
                    verdicts.delete(videoId);
                    return null;
                }
                return { reason: verdict.reason };
            },
            get size() { return verdicts.size; },
            clear() { verdicts.clear(); },
            toJSON() { return undefined; }
        });
    }

    function parseWatchHref(href) {
        const text = String(href || '');
        const v = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(text);
        const list = /[?&]list=([a-zA-Z0-9_-]+)/.exec(text);
        const index = /[?&]index=(\d+)/.exec(text);
        return { videoId: v ? v[1] : '', list: list ? list[1] : '', index: index ? Number(index[1]) : 0 };
    }

    /**
     * host: {
     *   document, now(), setTimeout, clearTimeout,
     *   currentVideoId(), currentList(), currentIndex(),
     *   isEnabled(settings), latestSettings(), signature(settings),
     *   rows(), rowVideoId(row), rowLink(row), rowIsSelected(row), rowBlockedByPage(row, settings),
     *   hideRow(row, reason), restoreRow(row),
     *   skipOutsideLists(settings), relatedCandidates(videoId) -> [{ videoId, link, precheckBlocked }],
 *   autoplayOn(), isEnded(), isStillBlocked(videoId), media(), isQuiet(settings), text(key, fallback), loadLocale(),
     *   refreshBlockedCard(videoId)
     * }
     */
    function createController(host) {
        const cache = createVerdictCache();
        const state = {
            installed: false,
            selection: null,
            handledVideoId: null,
            endVideoId: null,
            input: null,
            ended: null,
            popstateAt: 0,
            pendingSkip: null,
            // Videos this tab just played: autoplay outside a list never goes back to one of them.
            recent: [],
            timer: 0,
            generation: 0
        };
        const now = () => Number(host.now ? host.now() : Date.now());

        function cancelPendingSkip() {
            state.generation++;
            if (state.timer) {
                try { host.clearTimeout(state.timer); } catch (e) {}
                state.timer = 0;
            }
        }

        function recordEnded() {
            const videoId = host.currentVideoId();
            if (videoId) state.ended = { videoId, at: now() };
        }

        function onInput(event) {
            const kind = classifyInput(event);
            if (!kind) return;
            state.input = { kind, at: now() };
            // The user acted: a skip that has not fired yet no longer applies.
            cancelPendingSkip();
        }

        function onNavigateStart() {
            try {
                const media = host.media?.();
                const duration = Number(media?.duration);
                if (media && (media.ended || (duration > 0 && Number(media.currentTime) >= duration - 2))) recordEnded();
            } catch (e) {}
            cancelPendingSkip();
            const leaving = host.currentVideoId();
            if (leaving) state.recent = [leaving, ...state.recent.filter(id => id !== leaving)].slice(0, 50);
            state.selection = classifyNavigation({
                at: now(),
                fromVideoId: host.currentVideoId(),
                fromList: host.currentList(),
                fromIndex: host.currentIndex(),
                input: state.input,
                ended: state.ended,
                popstateAt: state.popstateAt,
                pendingSkip: state.pendingSkip
            });
            state.pendingSkip = null;
            state.lastNavigateAt = now();
            if (state.stallTimer) {
                try { host.clearTimeout(state.stallTimer); } catch (e) {}
                state.stallTimer = 0;
            }
            state.handledVideoId = null;
            state.endVideoId = null;
        }

        function install() {
            if (state.installed) return;
            state.installed = true;
            const doc = host.document;
            try {
                doc.addEventListener('pointerdown', onInput, true);
                doc.addEventListener('keydown', onInput, true);
                doc.addEventListener('ended', event => {
                    if (String(event?.target?.tagName || '').toLowerCase() !== 'video') return;
                    recordEnded();
                    scheduleStalledAutoplayCheck();
                }, true);
                doc.addEventListener('yt-navigate-start', onNavigateStart, true);
                (host.window || doc.defaultView)?.addEventListener?.('popstate', () => { state.popstateAt = now(); }, true);
            } catch (e) {}
        }

        /** Rows of the playlist panel around the current video, as skip candidates. */
        function buildCandidates(videoId, backward, settings) {
            const rows = host.rows() || [];
            const landing = { index: host.currentIndex(), list: host.currentList() };
            let selectedIndex = -1;
            if (landing.index > 0) {
                selectedIndex = rows.findIndex(row => {
                    const link = parseWatchHref(host.rowLink(row)?.getAttribute?.('href'));
                    return link.videoId === videoId && link.index === landing.index;
                });
            }
            if (selectedIndex < 0) selectedIndex = rows.findIndex(row => host.rowVideoId(row) === videoId && host.rowIsSelected(row));
            if (selectedIndex < 0) selectedIndex = rows.findIndex(row => host.rowVideoId(row) === videoId);
            const signature = host.signature(settings);
            let ordered = candidatesInDirection(rows, selectedIndex, backward);
            // The site may drop the current video's own row (a filtered row leaves the panel): place
            // it by its playlist index instead, from the rows' own index= numbers.
            if (selectedIndex < 0 && landing.index > 0) {
                const rowIndex = row => parseWatchHref(host.rowLink(row)?.getAttribute?.('href')).index;
                ordered = rows
                    .filter(row => (backward ? rowIndex(row) > 0 && rowIndex(row) < landing.index : rowIndex(row) > landing.index))
                    .sort((a, b) => (backward ? rowIndex(b) - rowIndex(a) : rowIndex(a) - rowIndex(b)));
            }
            return ordered
                .map((row, index) => ({ row, index, rowVideoId: host.rowVideoId(row), link: host.rowLink(row) }))
                .filter(item => item.rowVideoId && item.link)
                .map(item => ({
                    key: String(item.index),
                    videoId: item.rowVideoId,
                    link: item.link,
                    precheckBlocked: item.rowVideoId === videoId ||
                        Boolean(cache.lookup(item.rowVideoId, signature)) ||
                        Boolean(host.rowBlockedByPage(item.row, settings))
                }));
        }

        function showToast(settings) {
            if (host.isQuiet?.(settings)) return;
            const doc = host.document;
            const render = () => {
                try {
                    const text = host.text ? host.text('admission.queueSkipped', SKIPPED_TEXT) : SKIPPED_TEXT;
                    let toast = doc.getElementById('filtertube-queue-skip-toast');
                    if (!toast) {
                        toast = doc.createElement('div');
                        toast.id = 'filtertube-queue-skip-toast';
                        toast.setAttribute('role', 'status');
                        toast.setAttribute('aria-live', 'polite');
                        Object.assign(toast.style, {
                            position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
                            zIndex: '2147483646', maxWidth: 'min(90vw, 480px)', padding: '10px 16px',
                            borderRadius: '8px', background: 'rgba(28, 28, 28, 0.92)', color: '#fff',
                            font: '500 14px/1.4 Roboto, Arial, sans-serif', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            pointerEvents: 'none', textAlign: 'center'
                        });
                        (doc.body || doc.documentElement).appendChild(toast);
                    }
                    toast.textContent = text;
                    if (toast.__filtertubeHideTimer) host.clearTimeout(toast.__filtertubeHideTimer);
                    toast.__filtertubeHideTimer = host.setTimeout(() => { try { toast.remove(); } catch (e) {} }, TOAST_MS);
                } catch (e) {}
            };
            try {
                const loading = host.loadLocale?.();
                if (loading && typeof loading.then === 'function') loading.then(render, render);
                else render();
            } catch (e) { render(); }
        }

        /**
         * Fire the decided skip after a short delay. The page may re-render the panel or the related
         * list in between (a blocked row can leave the panel; a new Watch page brings new related
         * videos), so the target is chosen again from the live candidates when it fires; a link that
         * left the page is never clicked (a detached link would load the page in full). With no
         * candidate yet (still loading), it retries briefly.
         */
        function performSkip(videoId, step, settings, rebuild, attempt = 0) {
            if (attempt === 0) cancelPendingSkip();
            const generation = state.generation;
            state.timer = host.setTimeout(() => {
                state.timer = 0;
                if (state.generation !== generation) return;
                try {
                    const latest = host.latestSettings?.() || settings;
                    if (!host.isEnabled(latest)) return;
                    if (!host.currentList() && !host.skipOutsideLists?.(latest)) return;
                    if (host.currentVideoId() !== videoId || !host.isStillBlocked(videoId)) return;
                    let target = step.target;
                    if (typeof rebuild === 'function') target = firstAllowed(rebuild()) || null;
                    if (!target || !target.link || target.link.isConnected === false) {
                        if (attempt < SKIP_RETRIES) performSkip(videoId, step, settings, rebuild, attempt + 1);
                        return;
                    }
                    state.pendingSkip = { next: step.next, targetVideoId: target.videoId, at: now() };
                    showToast(latest);
                    // The target's own link: the site's SPA navigation (a playlist row opens
                    // /watch?v=…&list=…&index=…; a related video opens as the site links it).
                    target.link.click();
                } catch (e) {}
            }, attempt === 0 ? SKIP_DELAY_MS : SKIP_RETRY_MS);
        }

        /**
         * Autoplay that never starts. The site can end a video on its "Up next" card and stay there
         * (#82: in Allow only selected the next pick may be one FilterTube refused, and the countdown
         * never runs). With the site's own autoplay switched on, if nothing has moved
         * AUTOPLAY_STALL_MS after the end and the user has not acted, go on to the first allowed
         * video: the next allowed playlist row, or the first allowed Up next / related video.
         */
        function scheduleStalledAutoplayCheck() {
            const ended = state.ended;
            if (!ended || !host.autoplayOn) return;
            if (state.stallTimer) {
                try { host.clearTimeout(state.stallTimer); } catch (e) {}
            }
            state.stallTimer = host.setTimeout(() => {
                state.stallTimer = 0;
                try {
                    const videoId = ended.videoId;
                    const latest = host.latestSettings?.();
                    const inList = Boolean(host.currentList());
                    if (!host.isEnabled(latest) || latest?.disableAutoplay === true) return;
                    if (!inList && !host.skipOutsideLists?.(latest)) return;
                    if (host.currentVideoId() !== videoId || !host.autoplayOn()) return;
                    if (host.isEnded && !host.isEnded()) return;
                    if ((state.lastNavigateAt || 0) > ended.at || (state.input?.at || 0) > ended.at) return;
                    const candidates = inList ? buildCandidates(videoId, false, latest) : buildRelatedCandidates(videoId);
                    const target = firstAllowed(candidates);
                    if (!target || !target.link || target.link.isConnected === false) return;
                    state.pendingSkip = { next: selection(Entry.AUTOPLAY, videoId, null, 0), targetVideoId: target.videoId, at: now() };
                    target.link.click();
                } catch (e) {}
            }, AUTOPLAY_STALL_MS);
        }

        /** Up next / related videos, forward only, for a blocked video outside any list. */
        function buildRelatedCandidates(videoId) {
            const signature = host.signature(host.latestSettings?.());
            return (host.relatedCandidates?.(videoId) || [])
                .filter(item => item && item.videoId && item.link && item.videoId !== videoId && !state.recent.includes(item.videoId))
                .map((item, index) => ({
                    key: `related:${index}`,
                    videoId: item.videoId,
                    link: item.link,
                    precheckBlocked: Boolean(item.precheckBlocked) || Boolean(cache.lookup(item.videoId, signature))
                }));
        }

        /**
         * The current Watch video was blocked. Inside a playlist or Mix this is always on; elsewhere
         * only while host.skipOutsideLists(settings) ("Skip blocked autoplay videos"). Returns
         * true when this module decided what happens next.
         */
        function onBlocked(videoId, settings, reason) {
            if (!videoId) return false;
            const signature = host.signature(settings);
            if (signature) cache.remember(videoId, signature, reason);
            const inList = Boolean(host.currentList());
            if (!host.isEnabled(settings)) return inList;
            if (!inList && !host.skipOutsideLists?.(settings)) return false;
            const landing = { index: host.currentIndex(), list: host.currentList() };
            state.selection = boundTo(state.selection, videoId, landing);
            if (state.handledVideoId === videoId) return true;
            const sel = state.selection;
            // Outside a list there is no way back: Previous is the browser's history, so the card stays.
            const applies = appliesTo(sel, videoId) && isQueueDriven(sel.entry) && (inList || !isBackward(sel.entry));
            const candidates = !applies ? []
                : (inList ? buildCandidates(videoId, isBackward(sel.entry), settings) : buildRelatedCandidates(videoId));
            const result = decide({
                selection: applies ? sel : null,
                selectedVideoId: videoId,
                blocked: true,
                candidates,
                handledVideoId: state.handledVideoId
            });
            state.handledVideoId = result.handledVideoId;
            const step = result.step;
            if (step.kind === 'skip') {
                const backward = isBackward(sel.entry);
                performSkip(videoId, step, settings, () => (host.currentList()
                    ? buildCandidates(videoId, backward, host.latestSettings?.() || settings)
                    : buildRelatedCandidates(videoId)));
            } else if (step.kind === 'endOfQueue' && inList) {
                state.endVideoId = videoId;
                try { host.refreshBlockedCard?.(videoId); } catch (e) {}
            }
            return true;
        }

        function onAllowed(videoId) {
            if (!videoId) return;
            cache.forget(videoId);
            if (state.endVideoId === videoId) state.endVideoId = null;
            const sel = state.selection;
            if (sel && !sel.videoId && appliesTo(sel, videoId)) {
                state.selection = boundTo(sel, videoId, { index: host.currentIndex(), list: host.currentList() });
            }
        }

        /** A cached block for this video under the current rules (playlists only), or null. */
        function cachedVerdict(videoId, settings) {
            if (!videoId || !host.currentList()) return null;
            return cache.lookup(videoId, host.signature(settings));
        }

        /** Hide known-blocked rows in place; restore rows whose verdict went stale. */
        function applyPanelVerdicts(settings) {
            const signature = host.signature(settings);
            for (const row of host.rows() || []) {
                try {
                    const rowVideoId = host.rowVideoId(row);
                    const marked = row.hasAttribute?.(VERDICT_MARKER);
                    const verdict = rowVideoId && signature ? cache.lookup(rowVideoId, signature) : null;
                    // Never hide the selected row: the site may move the playlist on.
                    if (verdict && !host.rowIsSelected(row)) {
                        if (!marked) row.setAttribute(VERDICT_MARKER, 'true');
                        host.hideRow(row, verdict.reason || 'Filtered video');
                    } else if (marked) {
                        row.removeAttribute(VERDICT_MARKER);
                        host.restoreRow(row);
                    }
                } catch (e) {}
            }
        }

        function endLineFor(videoId) {
            if (!videoId || state.endVideoId !== videoId) return '';
            return END_LINE;
        }

        return Object.freeze({
            install,
            // A settings delivery or Disable. Deliveries are frequent (metadata learned, focus), so a
            // pending skip is revoked only when the live settings no longer allow it; the skip also
            // re-checks them when it fires.
            cancel: () => {
                if (!state.timer) return;
                const latest = host.latestSettings?.();
                if (!host.isEnabled(latest) || (!host.currentList() && !host.skipOutsideLists?.(latest))) cancelPendingSkip();
            },
            onBlocked,
            onAllowed,
            cachedVerdict,
            applyPanelVerdicts,
            endLineFor,
            // Exposed for tests and the page log; read-only views.
            get selection() { return state.selection; },
            get verdictCount() { return cache.size; },
            _onNavigateStart: onNavigateStart,
            _onInput: onInput
        });
    }

    root.FilterTubeQueueBlockedSkip = Object.freeze({
        Entry,
        MAX_CHAIN,
        END_LINE,
        SKIPPED_TEXT,
        VERDICT_MARKER,
        isQueueDriven,
        isBackward,
        selection,
        appliesTo,
        boundTo,
        candidatesInDirection,
        firstAllowed,
        decide,
        classifyNavigation,
        classifyInput,
        createVerdictCache,
        createController,
        parseWatchHref
    });
})(typeof window !== 'undefined' ? window : globalThis);
