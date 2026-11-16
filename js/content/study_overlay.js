/* Study mode on YouTube pages (3.6.2, Phase 2), isolated content world.
 *
 * - Rest break (breakMode "rest") and LIMIT: a calm full-page overlay hides the feed, and playback is
 *   paused and held. A break waits for the video that is playing to end, for 5 minutes at most.
 *   "Skip break" shows only for sessions the person started themselves.
 * - The break is announced 2 minutes ahead.
 * - Study time: counted only while a video actually plays in a visible tab, during STUDY, and sent
 *   to the background worker, which credits it per device and local date.
 * - The Watch gate (STUDY_ENFORCEMENT_SPEC P0.1): at each phase change the current video is decided
 *   again (dom_fallback's admission, which shows "Not part of today's study"), and a video still
 *   playing in the miniplayer, away from the watch page, is paused unless it was admitted under the
 *   rules in force now. A study round with no known pack and a clock hold get their own calm card.
 * - Kids study time (Android StudyKidsSpace, KidsStudyTimeHost): on the Kids site, a study round
 *   with no Kids learning pack holds Kids. Nothing loads there (the rules allow nothing) and every
 *   page shows the calm study card with Kriti reading and the countdown to the next break, or to
 *   the end of the last round. With a Kids learning pack the Kids site stays open with that pack.
 *   Kriti is left out when the Companion setting is Off.
 * Copy comes from the bundled interface catalogs (data/ui_locales) through admission_overlay.js.
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
    const KIDS_TICK_MS = 1000;
    const KRITI_READING = 'assets/images/mascots/kriti_reading.webp';
    const COMPANION_KEY = 'ftCompanionMode';

    /** "4:12" (minutes and seconds), rounded up so it never shows 0:00 early (Android StudyBreakClock). */
    function countdown(leftMs) {
        const seconds = Math.floor((Math.max(0, Number(leftMs) || 0) + 999) / 1000);
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }

    function isKidsHost(hostname) {
        return /(^|\.)youtubekids\.com$/.test(String(hostname || ''));
    }

    function interpolate(template, values) {
        return String(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) =>
            Object.prototype.hasOwnProperty.call(values || {}, key) ? String(values[key]) : match);
    }

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
        let lastPhaseKey = null;
        let kidsTick = null;
        let companionOff = false;
        const clearRepeat = env.clearInterval || (id => win.clearInterval?.(id));
        const onKids = isKidsHost(win.location?.hostname);
        const localizer = () => env.localizer || win.FilterTubeAdmissionOverlay || null;
        function t(key, fallback, values) {
            let value = fallback;
            try {
                const localized = localizer()?.text?.(key, fallback);
                if (typeof localized === 'string' && localized.trim()) value = localized;
            } catch (e) { }
            return interpolate(value, values);
        }
        /** Re-decide the current watch page with the rules in force now (dom_fallback's Watch gate). */
        const recheckWatch = env.recheckWatch || (() => {
            try {
                if (typeof win.enforceCurrentWatchOwnerBlock === 'function') win.enforceCurrentWatchOwnerBlock(win.currentSettings);
            } catch (e) { }
        });
        /** True when the video in the player was admitted under the rules in force now. */
        const currentAdmitted = env.currentAdmitted || (() => {
            try {
                const record = win.__filtertubeCurrentVideoAdmission;
                return !!record && typeof win.isCurrentVideoAdmittedUnderSettings === 'function'
                    && win.isCurrentVideoAdmittedUnderSettings(record.videoId, win.currentSettings);
            } catch (e) {
                return false;
            }
        });

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
            if (holdingPlayback) {
                try { event?.target?.pause?.(); } catch (e) { }
                return;
            }
            guardMiniplayer();
        }

        function overlayKind() {
            if (!state) return null;
            if (state.clockHold) return 'hold';
            if (state.state === 'LIMIT') return 'limit';
            if (state.state === 'BREAK' && state.breakMode !== 'normal' && !state.breakSkipped) return 'rest';
            // Fail closed: a study round with no known pack (and no own allowed channels) is rest.
            if (state.state === 'STUDY' && state.phase === 'rest') return 'unavailable';
            // Kids holds during an exam or class round; Kids learning packs keep it open.
            if (onKids && state.state === 'STUDY' && state.kidsSpace === 'study_time') return 'kids';
            return null;
        }

        function onWatchRoute() {
            const path = String(win.location?.pathname || '');
            return path.startsWith('/watch') || path.startsWith('/shorts/') || path.startsWith('/embed/');
        }

        /** The main player's video when it plays away from the watch page (the miniplayer). */
        function miniplayerVideo() {
            if (onWatchRoute()) return null;
            try {
                const video = doc.querySelector?.('ytd-miniplayer video, #movie_player video.html5-main-video');
                if (!video || video.closest?.('ytd-video-preview, #inline-preview-player, ytd-thumbnail')) return null;
                return video;
            } catch (e) {
                return null;
            }
        }

        const MINI_ID = 'filtertube-study-mini-gate';

        /** During study, a miniplayer video not admitted under the rules in force now is paused. */
        function guardMiniplayer() {
            const studying = !!state && (state.phase === 'study' || state.phase === 'rest');
            const video = studying ? miniplayerVideo() : null;
            if (!video || currentAdmitted()) {
                removeElement(MINI_ID);
                return false;
            }
            try { if (!video.paused) video.pause(); } catch (e) { }
            if (!doc.getElementById(MINI_ID)) {
                const note = element('div', {
                    position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483646', padding: '12px 16px',
                    borderRadius: '12px', background: '#EEF6F4', color: '#163f3c', border: '1px solid #1F6F6A',
                    fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', maxWidth: '320px'
                }, t('admission.studyOffList', "Not part of today's study"));
                note.id = MINI_ID;
                note.setAttribute('role', 'status');
                (doc.body || doc.documentElement).appendChild(note);
            }
            return true;
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

        function stopKidsTick() {
            if (kidsTick !== null) clearRepeat(kidsTick);
            kidsTick = null;
        }

        /** "Break in 4:12, at 5:30 PM", or "Study ends in ..." in the last round; empty once it is due. */
        function kidsBackLine() {
            const opensAt = Number(state?.kidsOpensAt);
            const at = now();
            if (!Number.isFinite(opensAt) || opensAt <= at) return '';
            const values = { left: countdown(opensAt - at), time: formatTime(opensAt) };
            return state.kidsOpensAtBreak
                ? t('study.overlay.kidsBackAtBreak', 'Break in {left}, at {time}', values)
                : t('study.overlay.kidsBackAtEnd', 'Study ends in {left}, at {time}', values);
        }

        /** Kids study time: the study card (admission_overlay's study card look) with Kriti reading. */
        function showKidsStudyTime() {
            removeElement(OVERLAY_ID);
            stopKidsTick();
            let dark = false;
            try { dark = !!win.matchMedia?.('(prefers-color-scheme: dark)')?.matches; } catch (e) { }
            const box = element('div', {
                position: 'fixed', inset: '0', zIndex: '2147483646', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'clamp(16px, 4vw, 56px)', boxSizing: 'border-box', textAlign: 'center',
                background: dark ? '#10201f' : '#EEF6F4', color: dark ? '#e6f2ef' : '#163f3c',
                font: '400 15px/1.55 "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
            });
            box.id = OVERLAY_ID;
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-live', 'polite');
            box.dataset.kind = 'kids';
            const card = element('section', {
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: 'min(480px, 100%)', boxSizing: 'border-box',
                padding: 'clamp(24px, 5vw, 40px)', borderRadius: '24px', border: '1px solid rgba(31,111,106,.25)',
                background: dark ? 'rgba(20,40,38,.96)' : '#ffffff', boxShadow: '0 18px 50px rgba(22,63,60,.16)'
            });
            card.dataset.filtertubeStudyCard = 'kids';
            let kritiUrl = '';
            try { kritiUrl = companionOff ? '' : String(runtime.getURL?.(KRITI_READING) || ''); } catch (e) { }
            if (kritiUrl) {
                const kriti = element('img', { width: '120px', height: '120px', objectFit: 'contain' });
                kriti.src = kritiUrl;
                kriti.alt = '';
                kriti.setAttribute('aria-hidden', 'true');
                kriti.dataset.mascot = 'kriti-reading';
                card.appendChild(kriti);
            }
            card.appendChild(element('div', { font: '700 clamp(22px, 3.6vw, 30px)/1.15 "Outfit", "Plus Jakarta Sans", sans-serif' },
                t('study.overlay.kidsTitle', 'Study time')));
            card.appendChild(element('div', { fontSize: '15px', maxWidth: '380px', lineHeight: '1.5', opacity: '.85' },
                t('study.overlay.kidsBody', 'Kids videos wait while you study. They come back at your break.')));
            const back = element('div', { fontSize: '16px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', minHeight: '1.5em' });
            back.dataset.role = 'kids-back';
            back.textContent = kidsBackLine();
            card.appendChild(back);
            box.appendChild(card);
            (doc.body || doc.documentElement).appendChild(box);
            kidsTick = setRepeat(() => {
                if (overlayKind() !== 'kids' || !doc.getElementById(OVERLAY_ID)) { stopKidsTick(); return; }
                back.textContent = kidsBackLine();
            }, KIDS_TICK_MS);
        }

        function showOverlay(kind) {
            if (kind === 'kids') { showKidsStudyTime(); return; }
            stopKidsTick();
            removeElement(OVERLAY_ID);
            const rest = kind === 'rest';
            // Night follows the page's own theme, as the gate card does: sun-wash for a break, navy otherwise.
            let dark = false;
            try {
                const theme = doc.documentElement?.getAttribute?.('data-theme') || '';
                dark = theme === 'dark' || (theme !== 'light' && win.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true);
            } catch (e) { }
            const box = element('div', {
                position: 'fixed', inset: '0', zIndex: '2147483646', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center',
                background: dark ? (rest ? '#3d3220' : '#0f141b') : (rest ? '#FDF3E1' : '#ECEAE6'),
                color: dark ? (rest ? '#f6d58a' : '#edf2f7') : (rest ? '#633806' : '#3A3732'),
                fontFamily: 'Roboto, Arial, sans-serif', transition: 'opacity 200ms ease-out'
            });
            box.id = OVERLAY_ID;
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-live', 'polite');
            box.dataset.kind = kind;
            const until = state?.until ? formatTime(state.until) : '';
            const copy = {
                rest: [t('study.overlay.restTitle', 'Break time'), until
                    ? t('study.overlay.restBodyAt', 'Rest your eyes and stretch. Study starts again at {time}.', { time: until })
                    : t('study.overlay.restBody', 'Rest your eyes and stretch. Study starts again soon.')],
                limit: [t('study.overlay.limitTitle', 'Done for today'), t('study.overlay.limitBody', 'Today\'s video time is over. See you tomorrow.')],
                hold: [t('study.overlay.holdTitle', 'Study is on hold'), t('study.overlay.holdBody', 'The time or time zone on this device changed during a lock. Study continues when the clock is right again.')],
                unavailable: [t('study.overlay.unavailableTitle', 'Study pack unavailable'), t('study.overlay.unavailableBody', 'Your study videos can\'t load right now, so nothing plays until this study time ends.')]
            }[kind] || [t('study.overlay.limitTitle', 'Done for today'), ''];
            box.appendChild(element('div', { fontSize: '28px', fontWeight: '600' }, copy[0]));
            box.appendChild(element('div', { fontSize: '16px', maxWidth: '420px', lineHeight: '1.5' }, copy[1]));
            if (rest && state?.canSkipBreak) {
                const button = element('button', {
                    marginTop: '8px', padding: '10px 20px', borderRadius: '20px', border: `1px solid ${dark ? '#f6d58a' : '#854F0B'}`,
                    background: 'transparent', color: dark ? '#f6d58a' : '#854F0B', fontSize: '14px', cursor: 'pointer'
                }, t('study.overlay.skipBreak', 'Skip break'));
                button.type = 'button';
                button.dataset.action = 'skip-break';
                button.addEventListener('click', () => {
                    send({ action: 'FilterTube_StudySkipBreak' }).then(response => {
                        if (response?.ok) setState({ ...state, breakSkipped: true });
                    });
                });
                box.appendChild(button);
            }
            // Kriti keeps the break company (her mug), cheers the end of the day, and Uljhan shrugs when the
            // pack can't load. A clock hold has no character. Appended last and drawn first, so the
            // title and body keep their places; the Companion set to Off leaves the words alone.
            const pose = { rest: 'kriti_mug_06.webp', limit: 'kriti_thumbsup.webp', unavailable: 'uljhan_shrug.webp' }[kind];
            let poseUrl = '';
            try {
                const companion = localizer()?.getCompanion?.() || 'quiet';
                if (pose && companion !== 'off') poseUrl = runtime?.getURL?.(`assets/images/mascots/${pose}`) || '';
            } catch (e) { }
            if (poseUrl) {
                const picture = element('img', { order: '-1', height: '132px', width: 'auto', pointerEvents: 'none', userSelect: 'none' });
                picture.src = poseUrl;
                picture.alt = '';
                picture.setAttribute?.('aria-hidden', 'true');
                picture.dataset && (picture.dataset.filtertubeStudyMascot = pose);
                box.appendChild(picture);
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
                stopKidsTick();
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
                noticeTimer = setTimer(() => showNotice(t('study.overlay.breakNotice', 'Break in 2 minutes. Finish this video.')), Math.max(0, noticeAt - at));
            }
        }

        function setState(next) {
            state = next && typeof next === 'object' && next.state ? next : null;
            // A phase change (study starts, a break, the limit, a hold) re-decides what is playing now,
            // including a video that was already playing when study started.
            const phaseKey = state ? `${state.phase || 'normal'}|${state.state}|${state.sessionStart || ''}|${(state.packIds || []).join(',')}|${state.kidsSpace || ''}` : 'none';
            if (lastPhaseKey !== null && phaseKey !== lastPhaseKey) recheckWatch();
            lastPhaseKey = phaseKey;
            render();
            guardMiniplayer();
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
            // SPA navigations (yt-navigate-finish) and leaving the watch page into the miniplayer.
            try { doc.addEventListener('yt-navigate-finish', () => { guardMiniplayer(); }, true); } catch (e) { }
            try { Promise.resolve(localizer()?.loadLocale?.()).then(() => { if (state) render(); }).catch(() => {}); } catch (e) { }
            try { Promise.resolve(localizer()?.loadCompanion?.()).then(() => { if (state) render(); }).catch(() => {}); } catch (e) { }
            try { doc.addEventListener('visibilitychange', () => { if (!visible()) flush(); lastCheckAt = now(); }); } catch (e) { }
            try { win.addEventListener?.('pagehide', () => flush()); } catch (e) { }
            // Companion Off: no characters, so the Kids study card shows without Kriti.
            try {
                const storage = env.storage || win.chrome?.storage?.local || win.browser?.storage?.local;
                const apply = items => { companionOff = items?.[COMPANION_KEY] === 'off'; if (state) render(); };
                const read = storage?.get?.([COMPANION_KEY]);
                if (read && typeof read.then === 'function') read.then(apply).catch(() => {});
                else storage?.get?.([COMPANION_KEY], apply);
            } catch (e) { }
            setRepeat(checkTime, TICK_MS);
            refresh();
            return api;
        }

        const api = { start, setState, refresh, render, checkTime, flush, onMessage, onPlay, guardMiniplayer, get state() { return state; }, get pendingSeconds() { return pendingSeconds; } };
        return api;
    }

    return { OVERLAY_ID, NOTICE_ID, MINI_ID: 'filtertube-study-mini-gate', TICK_MS, BREAK_WAIT_MAX_MS, KRITI_READING, countdown, isKidsHost, createStudyOverlay, autoStarted: false };
}));
