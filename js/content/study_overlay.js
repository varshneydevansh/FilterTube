/* Study mode on YouTube pages (3.6.2, Phase 2), isolated content world.
 *
 * - Rest break (breakMode "rest") and LIMIT: a calm full-page overlay hides the feed, and playback is
 *   paused and held. A break waits for the video that is playing to end, for 5 minutes at most.
 *   "Skip break" shows only for sessions the person started themselves.
 * - The break is announced 2 minutes ahead.
 * - Study time: counted only while a video actually plays in a visible tab, during STUDY, and sent
 *   to the background worker, which credits it per device and local date.
 * The state comes from the background (FilterTube_StudyState pushes, FilterTube_StudyGetState on load
 * and at each transition); this script keeps no clock of its own beyond those times.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyOverlay = api;
    try {
        const runtime = root.chrome?.runtime || root.browser?.runtime;
        if (!api.autoStarted && runtime?.sendMessage && root.document && root.location
            && /(^|\.)youtube(kids)?\.com$/.test(String(root.location.hostname || ''))) {
            api.autoStarted = true;
            api.createStudyOverlay({ window: root, document: root.document, runtime }).start();
        }
    } catch (e) {
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const OVERLAY_ID = 'filtertube-study-overlay';
    const NOTICE_ID = 'filtertube-study-notice';
    const TICK_MS = 15 * 1000;
    const SEND_AFTER_SECONDS = 60;
    const BREAK_WAIT_MAX_MS = 5 * 60 * 1000;
    const NOTICE_SHOW_MS = 10 * 1000;

    function formatTime(ms) {
        try {
            return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    function createStudyOverlay(env) {
        const win = env.window;
        const doc = env.document;
        const runtime = env.runtime;
        const now = env.now || (() => Date.now());
        const setTimer = env.setTimeout || ((fn, ms) => win.setTimeout(fn, ms));
        const clearTimer = env.clearTimeout || (id => win.clearTimeout(id));
        const setRepeat = env.setInterval || ((fn, ms) => win.setInterval(fn, ms));
        let state = null;
        let transitionTimer = null;
        let noticeTimer = null;
        let breakSeenAt = null;
        let pendingSeconds = 0;
        let lastCheckAt = null;
        let holdingPlayback = false;

        function send(message) {
            try {
                return Promise.resolve(runtime.sendMessage(message)).catch(() => null);
            } catch (e) {
                return Promise.resolve(null);
            }
        }

        function videos() {
            try {
                return Array.from(doc.querySelectorAll('video'));
            } catch (e) {
                return [];
            }
        }

        function playingVideo() {
            return videos().some(video => video && !video.paused && !video.ended && Number(video.readyState) >= 3);
        }

        function visible() {
            return doc.visibilityState === undefined || doc.visibilityState === 'visible';
        }

        function pauseAll() {
            for (const video of videos()) {
                try { if (!video.paused) video.pause(); } catch (e) { }
            }
        }

        function onPlay(event) {
            if (!holdingPlayback) return;
            try { event?.target?.pause?.(); } catch (e) { }
        }

        function overlayKind() {
            if (!state) return null;
            if (state.state === 'LIMIT') return 'limit';
            if (state.state === 'BREAK' && state.breakMode !== 'normal' && !state.breakSkipped) return 'rest';
            return null;
        }

        function removeElement(id) {
            const existing = doc.getElementById(id);
            if (existing) existing.remove();
        }

        function element(tag, styles, textValue) {
            const node = doc.createElement(tag);
            Object.assign(node.style, styles || {});
            if (textValue) node.textContent = textValue;
            return node;
        }

        function showOverlay(kind) {
            removeElement(OVERLAY_ID);
            const rest = kind === 'rest';
            const box = element('div', {
                position: 'fixed', inset: '0', zIndex: '2147483646', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center',
                background: rest ? '#FDF3E1' : '#ECEAE6', color: rest ? '#633806' : '#3A3732',
                fontFamily: 'Roboto, Arial, sans-serif', transition: 'opacity 200ms ease-out'
            });
            box.id = OVERLAY_ID;
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-live', 'polite');
            box.dataset.kind = kind;
            const until = state?.until ? formatTime(state.until) : '';
            box.appendChild(element('div', { fontSize: '28px', fontWeight: '600' }, rest ? 'Break time' : 'Done for today'));
            box.appendChild(element('div', { fontSize: '16px', maxWidth: '420px', lineHeight: '1.5' }, rest
                ? `Rest your eyes and stretch. Study starts again${until ? ` at ${until}` : ' soon'}.`
                : 'Today\'s video time is over. See you tomorrow.'));
            if (rest && state?.canSkipBreak) {
                const button = element('button', {
                    marginTop: '8px', padding: '10px 20px', borderRadius: '20px', border: '1px solid #854F0B',
                    background: 'transparent', color: '#854F0B', fontSize: '14px', cursor: 'pointer'
                }, 'Skip break');
                button.type = 'button';
                button.dataset.action = 'skip-break';
                button.addEventListener('click', () => {
                    send({ action: 'FilterTube_StudySkipBreak' }).then(response => {
                        if (response?.ok) setState({ ...state, breakSkipped: true });
                    });
                });
                box.appendChild(button);
            }
            (doc.body || doc.documentElement).appendChild(box);
        }

        function holdPlayback(hold) {
            holdingPlayback = hold;
            if (hold) pauseAll();
        }

        function showNotice(textValue) {
            removeElement(NOTICE_ID);
            const note = element('div', {
                position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483646', padding: '12px 16px',
                borderRadius: '12px', background: '#FDF3E1', color: '#633806', border: '1px solid #EF9F27',
                fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px'
            }, textValue);
            note.id = NOTICE_ID;
            note.setAttribute('role', 'status');
            (doc.body || doc.documentElement).appendChild(note);
            setTimer(() => removeElement(NOTICE_ID), NOTICE_SHOW_MS);
        }

        /** Shows or clears the overlay; a rest break waits for a playing video (5 minutes at most). */
        function render() {
            const kind = overlayKind();
            if (!kind) {
                breakSeenAt = null;
                removeElement(OVERLAY_ID);
                holdPlayback(false);
                return;
            }
            if (kind === 'rest') {
                if (breakSeenAt === null) breakSeenAt = now();
                const waitedEnough = now() - breakSeenAt >= BREAK_WAIT_MAX_MS;
                if (playingVideo() && !waitedEnough) {
                    removeElement(OVERLAY_ID);
                    holdPlayback(false);
                    setTimer(render, Math.min(TICK_MS, BREAK_WAIT_MAX_MS - (now() - breakSeenAt)));
                    return;
                }
            }
            showOverlay(kind);
            holdPlayback(true);
        }

        function scheduleNext() {
            if (transitionTimer !== null) clearTimer(transitionTimer);
            if (noticeTimer !== null) clearTimer(noticeTimer);
            transitionTimer = null;
            noticeTimer = null;
            const at = now();
            const until = Number(state?.validUntil || state?.until);
            if (Number.isFinite(until) && until > at) transitionTimer = setTimer(refresh, until - at + 500);
            const noticeAt = Number(state?.breakNoticeAt);
            if (state?.state === 'STUDY' && Number.isFinite(noticeAt)) {
                noticeTimer = setTimer(() => showNotice('Break in 2 minutes. Finish this video.'), Math.max(0, noticeAt - at));
            }
        }

        function setState(next) {
            state = next && typeof next === 'object' && next.state ? next : null;
            render();
            scheduleNext();
        }

        function refresh() {
            return send({ action: 'FilterTube_StudyGetState' }).then(response => {
                if (response && response.ok !== false) setState(response);
            });
        }

        /** Counts a check interval only while studying, the tab is visible and a video really plays. */
        function checkTime() {
            const at = now();
            const elapsed = lastCheckAt === null ? 0 : Math.min(at - lastCheckAt, TICK_MS + 5000);
            lastCheckAt = at;
            if (state?.state !== 'STUDY' || !visible() || !playingVideo()) return;
            pendingSeconds += Math.max(0, Math.round(elapsed / 1000));
            if (pendingSeconds >= SEND_AFTER_SECONDS) flush();
        }

        function flush() {
            const seconds = Math.min(pendingSeconds, 60);
            if (seconds <= 0) return Promise.resolve(null);
            pendingSeconds -= seconds;
            return send({ action: 'FilterTube_StudyProgressTick', seconds });
        }

        function onMessage(message) {
            if (message?.action === 'FilterTube_StudyState') setState(message.state);
            else if (message?.action === 'FilterTube_ApplySettings' && message.settings && 'study' in message.settings) setState(message.settings.study);
        }

        function start() {
            try { runtime.onMessage?.addListener?.(onMessage); } catch (e) { }
            try { doc.addEventListener('play', onPlay, true); } catch (e) { }
            try { doc.addEventListener('visibilitychange', () => { if (!visible()) flush(); lastCheckAt = now(); }); } catch (e) { }
            try { win.addEventListener?.('pagehide', () => flush()); } catch (e) { }
            setRepeat(checkTime, TICK_MS);
            refresh();
            return api;
        }

        const api = { start, setState, refresh, render, checkTime, flush, onMessage, onPlay, get state() { return state; }, get pendingSeconds() { return pendingSeconds; } };
        return api;
    }

    return { OVERLAY_ID, NOTICE_ID, TICK_MS, BREAK_WAIT_MAX_MS, createStudyOverlay, autoStarted: false };
}));
