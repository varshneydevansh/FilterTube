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
    const SKIP_UNDO_MS = 5 * 1000;
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
        // After Skip break the screen stays this long with "Break skipped ... Undo" (Android StudyRestActivity).
        let skipped = null;
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

        const SKIP_ID = 'filtertube-study-skip';

        /** The playing lecture's title, for "Up next after the break" (Android StudyWatchOverlay lastSubject). */
        function lectureTitle() {
            try {
                const heading = doc.querySelector?.('ytd-watch-metadata h1, h1.ytd-watch-metadata, h1.title, .slim-video-information-title');
                const value = (heading?.textContent || String(doc.title || '').replace(/\s+-\s+YouTube$/, '')).trim();
                return value.slice(0, 300);
            } catch (e) {
                return '';
            }
        }

        function currentVideoId() {
            try {
                const url = new URL(String(win.location?.href || ''));
                const fromQuery = url.searchParams.get('v');
                if (fromQuery) return fromQuery;
                const match = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{6,64})/);
                return match ? match[1] : '';
            } catch (e) {
                return '';
            }
        }

        /**
         * "Skip this video" (Android StudyWatchOverlay SKIP_ACTION_ID): while study runs, the video in
         * the player can be skipped. It hides from now on for this profile and never unblocks anything.
         */
        function renderSkip() {
            // Only a video that plays can be skipped: not one the watch gate already holds back.
            const gated = !!doc.querySelector?.('[data-filtertube-direct-access-overlay-host="true"]');
            // During a round, and a break that plays videos (Android: "during a study round or break").
            const running = state?.state === 'STUDY' || (state?.state === 'BREAK' && state?.breakMode === 'normal');
            const videoId = running && onWatchRoute() && !overlayKind() && !gated ? currentVideoId() : '';
            const existing = doc.getElementById(SKIP_ID);
            if (!videoId) { if (existing) existing.remove(); return; }
            const rowReady = !!doc.querySelector?.('ytd-watch-metadata #top-level-buttons-computed, #actions #top-level-buttons-computed, ytm-slim-video-action-bar-renderer .slim-video-action-bar-actions');
            if (existing && existing.getAttribute('data-video-id') === videoId && (existing.getAttribute('data-in-action-row') === 'true' || !rowReady)) return;
            if (existing) existing.remove();
            // "Skip this video" is the first chip in the Watch page's action row (Android 9ed6a1e27), never
            // floating over the recommendations; while the row isn't there yet it waits at the page's corner.
            const row = doc.querySelector?.('ytd-watch-metadata #top-level-buttons-computed, #actions #top-level-buttons-computed, ytm-slim-video-action-bar-renderer .slim-video-action-bar-actions') || null;
            const button = element('button', row ? {
                minHeight: '36px', padding: '0 16px', marginInlineEnd: '8px', borderRadius: '999px', background: 'var(--yt-spec-badge-chip-background, rgba(0,0,0,.05))',
                color: 'var(--yt-spec-text-primary, #0f0f0f)', border: '0', cursor: 'pointer', font: '500 14px/36px Roboto, Arial, sans-serif', flex: '0 0 auto'
            } : {
                position: 'fixed', left: '16px', bottom: '16px', zIndex: '2147483646', minHeight: '40px', padding: '0 16px',
                borderRadius: '999px', background: '#FFFCF6', color: '#1b1a18', border: '1.5px solid #cdbfae', cursor: 'pointer',
                font: '700 14px/1 Roboto, Arial, sans-serif', boxShadow: '0 3px 0 rgba(27,26,24,.14)'
            }, t('study.skipVideo', 'Skip this video'));
            button.id = SKIP_ID;
            button.type = 'button';
            button.setAttribute('data-video-id', videoId);
            if (row) button.setAttribute('data-in-action-row', 'true');
            button.addEventListener('click', () => {
                button.disabled = true;
                send({ action: 'FilterTube_StudySkipVideo', videoId }).then(response => {
                    if (response?.ok) {
                        removeElement(SKIP_ID);
                        pauseAll();
                        showNotice(t('study.skipped', 'Skipped. It won\'t show again.'));
                    } else {
                        button.disabled = false;
                    }
                });
            });
            if (row && typeof row.insertBefore === 'function') { row.insertBefore(button, row.firstChild || null); return; }
            (doc.body || doc.documentElement).appendChild(button);
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
            if (rest && Number.isFinite(Number(state?.until)) && typeof doc.createElementNS === 'function') box.appendChild(breakSun(dark));
            box.appendChild(element('div', { fontSize: '28px', fontWeight: '600' }, copy[0]));
            box.appendChild(element('div', { fontSize: '16px', maxWidth: '420px', lineHeight: '1.5' }, copy[1]));
            if (rest && state?.upNext) {
                // "Up next after the break: {subject}", when the last lecture's subject is known.
                const next = element('div', { fontSize: '18px', fontWeight: '600', maxWidth: '420px', lineHeight: '1.3' },
                    t('study.overlay.upNext', 'Up next after the break: {subject}', { subject: state.upNext }));
                next.dataset.role = 'up-next';
                box.appendChild(next);
            }
            if (rest && state?.canSkipBreak) {
                const button = element('button', {
                    marginTop: '8px', padding: '10px 20px', borderRadius: '20px', border: `1px solid ${dark ? '#f6d58a' : '#854F0B'}`,
                    background: 'transparent', color: dark ? '#f6d58a' : '#854F0B', fontSize: '14px', cursor: 'pointer'
                }, t('study.overlay.skipBreak', 'Skip break'));
                button.type = 'button';
                button.dataset.action = 'skip-break';
                const preview = state.skipPreview && typeof state.skipPreview === 'object' ? state.skipPreview : null;
                button.addEventListener('click', () => {
                    send({ action: 'FilterTube_StudySkipBreak' }).then(response => {
                        if (!response?.ok) return;
                        if (preview) showSkipped(box, preview, dark);
                        else setState({ ...state, breakSkipped: true });
                    });
                });
                box.appendChild(button);
                if (preview) {
                    // What skipping costs, under the button (Android study_break_skip_cost).
                    const cost = element('div', { fontSize: '13px', opacity: '.85', marginTop: '-4px' },
                        t('study.overlay.skipCost', '+{minutes} min to round {round}', { minutes: preview.addedMinutes, round: preview.round }));
                    cost.dataset.role = 'skip-cost';
                    box.appendChild(cost);
                }
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
                // On a break she stands at the sun's 4 o'clock edge, never over the numbers (Android StudyRestActivity).
                const sunNode = rest ? Array.from(box.children || []).find(child => child.dataset?.role === 'break-sun') : null;
                if (sunNode) {
                    Object.assign(picture.style, { position: 'absolute', right: '-78px', bottom: '-14px', height: '120px', order: '' });
                    sunNode.appendChild(picture);
                } else {
                    box.appendChild(picture);
                }
                // Idle life with the page's interaction wake (shared with the blocked card).
                try { localizer()?.idle?.(picture); } catch (e) { }
            }
            (doc.body || doc.documentElement).appendChild(box);
        }

        /**
         * The break sun (Android StudyBreakSunView, StudyBreakClock): a crayon sun whose arc drains with
         * the break and the m:ss left in its middle, ticking every second while the screen shows. Its
         * accessible name stays the minutes left, so a screen reader isn't read every second.
         */
        let sunTimer = null;
        function breakSun(dark) {
            const NS = 'http://www.w3.org/2000/svg';
            const ink = dark ? '#f6d58a' : '#854F0B';
            const sun = dark ? '#c99a2e' : '#EDB12E';
            const wrap = element('div', { position: 'relative', width: '200px', height: '200px', order: '-2' });
            wrap.dataset.role = 'break-sun';
            wrap.setAttribute?.('role', 'timer');
            const svg = doc.createElementNS(NS, 'svg');
            svg.setAttribute('viewBox', '0 0 200 200');
            svg.setAttribute('width', '200');
            svg.setAttribute('height', '200');
            svg.setAttribute('aria-hidden', 'true');
            for (let i = 0; i < 12; i += 1) {
                const ray = doc.createElementNS(NS, 'line');
                const angle = (Math.PI * 2 * i) / 12;
                ray.setAttribute('x1', String(100 + 82 * Math.cos(angle))); ray.setAttribute('y1', String(100 + 82 * Math.sin(angle)));
                ray.setAttribute('x2', String(100 + 95 * Math.cos(angle))); ray.setAttribute('y2', String(100 + 95 * Math.sin(angle)));
                ray.setAttribute('stroke', sun); ray.setAttribute('stroke-width', '5'); ray.setAttribute('stroke-linecap', 'round');
                svg.appendChild(ray);
            }
            const disc = doc.createElementNS(NS, 'circle');
            disc.setAttribute('cx', '100'); disc.setAttribute('cy', '100'); disc.setAttribute('r', '70');
            disc.setAttribute('fill', dark ? 'rgba(237,177,46,.12)' : 'rgba(237,177,46,.18)');
            const track = doc.createElementNS(NS, 'circle');
            track.setAttribute('cx', '100'); track.setAttribute('cy', '100'); track.setAttribute('r', '62');
            track.setAttribute('fill', 'none'); track.setAttribute('stroke', sun); track.setAttribute('stroke-opacity', '.25'); track.setAttribute('stroke-width', '10');
            const arc = doc.createElementNS(NS, 'circle');
            arc.setAttribute('cx', '100'); arc.setAttribute('cy', '100'); arc.setAttribute('r', '62');
            arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', sun); arc.setAttribute('stroke-width', '10'); arc.setAttribute('stroke-linecap', 'round');
            arc.setAttribute('transform', 'rotate(-90 100 100)');
            svg.append(disc, track, arc);
            const digits = element('div', { position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px', fontWeight: '600', color: ink, fontVariantNumeric: 'tabular-nums' });
            digits.dataset.role = 'sun-countdown';
            wrap.append(svg, digits);
            const length = 2 * Math.PI * 62;
            let lastMinutes = null;
            const tickSun = () => {
                const at = now();
                const end = Number(state?.until);
                const start = Number(state?.segmentStart);
                const left = Math.max(0, end - at);
                const remaining = Number.isFinite(start) && end > start ? Math.min(1, Math.max(0, left / (end - start))) : 1;
                arc.setAttribute('stroke-dasharray', `${(remaining * length).toFixed(1)} ${length.toFixed(1)}`);
                digits.textContent = countdown(left);
                const minutes = Math.ceil(left / 60000);
                if (minutes !== lastMinutes) {
                    lastMinutes = minutes;
                    let category = minutes === 1 ? 'one' : 'other';
                    try { category = new Intl.PluralRules(doc.documentElement?.lang || undefined).select(minutes); } catch (e) { }
                    wrap.setAttribute?.('aria-label', t(`study.overlay.breakLeft.${category}`, '{count} min left in your break', { count: minutes }));
                }
            };
            tickSun();
            const every = env.setInterval || ((fn, ms) => win.setInterval(fn, ms));
            const stop = env.clearInterval || (id => win.clearInterval(id));
            if (sunTimer !== null) stop(sunTimer);
            sunTimer = every(() => {
                if (!wrap.isConnected) { stop(sunTimer); sunTimer = null; return; }
                tickSun();
            }, 1000);
            return wrap;
        }

        /**
         * Skip break, then (Android StudyRestActivity.skipBreak): the break's words and button leave, Kriti
         * gives a thumbs up, and a paper line says "Break skipped. Round 3 is now 55 min." with Undo for
         * 5 seconds. Undo puts the break back; otherwise the screen closes and study goes on.
         */
        function showSkipped(box, preview, dark) {
            const expiresAt = now() + SKIP_UNDO_MS;
            skipped = { preview, expiresAt };
            for (const child of Array.from(box.children || [])) {
                if (child.dataset?.filtertubeStudyMascot) {
                    child.dataset.filtertubeStudyMascot = 'kriti_thumbsup.webp';
                    try { child.src = runtime?.getURL?.('assets/images/mascots/kriti_thumbsup.webp') || child.src; } catch (e) { }
                } else if (child.style) child.style.visibility = 'hidden';
            }
            const toast = element('div', {
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '16px',
                background: dark ? '#151c24' : '#fffcf6', color: dark ? '#edf2f7' : '#1b1a18',
                border: `1px solid ${dark ? '#2a3440' : '#dcd1c2'}`, fontSize: '15px'
            });
            toast.dataset.role = 'skip-undo';
            toast.setAttribute('role', 'status');
            toast.appendChild(element('span', {}, t('study.overlay.breakSkipped', 'Break skipped. Round {round} is now {minutes} min.',
                { round: preview.round, minutes: preview.roundMinutes })));
            const undo = element('button', {
                padding: '6px 14px', borderRadius: '16px', border: 'none', background: 'transparent',
                color: dark ? '#e0796b' : '#a93e31', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
            }, t('study.undo', 'Undo'));
            undo.type = 'button';
            undo.dataset.action = 'undo-skip-break';
            undo.addEventListener('click', () => {
                skipped = null;
                send({ action: 'FilterTube_StudyUndoSkipBreak', until: preview.breakEnd }).then(() => refresh());
            });
            toast.appendChild(undo);
            box.appendChild(toast);
            setTimer(() => {
                if (!skipped || skipped.expiresAt !== expiresAt) return;
                skipped = null;
                setState({ ...state, breakSkipped: true, skipPreview: null });
            }, SKIP_UNDO_MS);
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
            // The 5 seconds of "Break skipped ... Undo" keep their screen whatever arrives meanwhile.
            if (skipped && now() < skipped.expiresAt && doc.getElementById(OVERLAY_ID)) return;
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
            renderSkip();
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
            renderSkip();
            if (state?.state !== 'STUDY' || !visible() || !playingVideo()) return;
            pendingSeconds += Math.max(0, Math.round(elapsed / 1000));
            if (pendingSeconds >= SEND_AFTER_SECONDS) flush();
        }

        function flush() {
            const seconds = Math.min(pendingSeconds, 60);
            if (seconds <= 0) return Promise.resolve(null);
            pendingSeconds -= seconds;
            return send({ action: 'FilterTube_StudyProgressTick', seconds, title: lectureTitle() });
        }

        function onMessage(message) {
            if (message?.action === 'FilterTube_StudyState') setState(message.state);
            else if (message?.action === 'FilterTube_ApplySettings' && message.settings && 'study' in message.settings) setState(message.settings.study);
        }

        function start() {
            try { runtime.onMessage?.addListener?.(onMessage); } catch (e) { }
            try { doc.addEventListener('play', onPlay, true); } catch (e) { }
            // SPA navigations (yt-navigate-finish) and leaving the watch page into the miniplayer.
            try { doc.addEventListener('yt-navigate-finish', () => { guardMiniplayer(); renderSkip(); }, true); } catch (e) { }
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

        const api = { start, setState, refresh, render, renderSkip, checkTime, flush, onMessage, onPlay, guardMiniplayer, get state() { return state; }, get pendingSeconds() { return pendingSeconds; } };
        return api;
    }

    return { OVERLAY_ID, NOTICE_ID, MINI_ID: 'filtertube-study-mini-gate', TICK_MS, BREAK_WAIT_MAX_MS, KRITI_READING, countdown, isKidsHost, createStudyOverlay, autoStarted: false };
}));
