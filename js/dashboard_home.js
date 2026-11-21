/* The options page's Home (owner, 2026-11-17): the older dashboard's hero, stats, quick actions and
 * app cards, combined with the app's tile system, in the paper-and-crayon look.
 * - The sidebar rows wear their tile's hue (data-pk-tint) and carry a live count where the area has
 *   one; What's New, Help, About and Support are quiet links at the bottom.
 * - Greeting: a time-of-day hello and what was kept out today (the hidden count tab-view.js writes
 *   into #statHiddenToday), the profile card, and Kriti sieving Uljhan (FilterTubeMascots.mountLoop:
 *   Lively loops, Quiet plays once, reduced motion and Companion Off as the mascots module decides).
 * - Study today: planned minutes, the next round, today's progress, Start now, and today's plan as a
 *   read-only day bar (FilterTubeStudyUi.planBar when it is loaded) with Edit, which opens the Study
 *   page: the plan has one editor (DESIGN_PASS_2026-11-21 §4 decision 3). "Set up study" with no plan.
 * - What Uljhan tried today: the last few hides on this device (js/shared/hidden_log.js,
 *   ftHiddenLogV1), each with what hid it and Allow: a precise exception for that one video (the
 *   profile's allowedVideoIds), or Change for a content control. A control row names its control
 *   (Clips, Duration, ...; the entry's control key) and Change opens Content Controls (Kids for a Kids
 *   hide) on that switch: scrolled into view, focused and pulsed once (still under reduced motion).
 *   A row without a known control opens the page. A Kids profile or a running Self-Control Session
 *   can't allow.
 * - Quick actions, the app cards (tab-view.js renderControlCenterApps) and the support strip.
 * Words come from data/ui_locales; nothing names the video site.
 */
(function (root) {
    'use strict';
    const doc = root && root.document;
    if (!doc || root.FilterTubeDashboardHome) return;

    const LOG_KEY = 'ftHiddenLogV1';
    const PROFILES_KEY = 'ftProfilesV4';
    const SHOWN = 5;

    function t(key, fallback, values = {}) {
        let text = '';
        try { text = root.FilterTubeUiLocalization?.text?.(key, values) || ''; } catch (e) { }
        if (!text || text === key) text = fallback;
        return String(text).replace(/\{([a-zA-Z]+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function locale() {
        return root.FilterTubeUiLocalization?.locale || doc.documentElement.lang || 'en';
    }

    function plural(key, count, one, other, values = {}) {
        let category = count === 1 ? 'one' : 'other';
        try { category = new Intl.PluralRules(locale()).select(count); } catch (e) { }
        const fallback = count === 1 ? one : other;
        for (const candidate of [category, 'other']) {
            let text = '';
            try { text = root.FilterTubeUiLocalization?.text?.(`${key}.${candidate}`, { count, ...values }) || ''; } catch (e) { }
            if (text && text !== `${key}.${candidate}`) return text.replace(/\{count\}/g, formatCount(count));
        }
        return t(key, fallback, { count: formatCount(count), ...values });
    }

    function formatCount(value) {
        try { return new Intl.NumberFormat(locale()).format(value); } catch (e) { return String(value); }
    }

    function formatTime(ms) {
        try { return new Date(ms).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
    }

    function el(tag, className, text) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function api() {
        return (typeof chrome !== 'undefined' && chrome?.runtime) ? chrome : (typeof browser !== 'undefined' ? browser : null);
    }

    function send(message) {
        return new Promise(resolve => {
            try {
                api()?.runtime?.sendMessage(message, response => {
                    void api()?.runtime?.lastError;
                    resolve(response || null);
                });
            } catch (e) { resolve(null); }
        });
    }

    function storageGet(keys) {
        return new Promise(resolve => {
            try { api()?.storage?.local?.get(keys, items => resolve(items || {})); } catch (e) { resolve({}); }
        });
    }

    function storageSet(items) {
        return new Promise(resolve => {
            try { api()?.storage?.local?.set(items, () => resolve()); } catch (e) { resolve(); }
        });
    }

    function openNav(selector) {
        doc.querySelector(selector)?.click();
    }

    function toast(message, type) {
        try { root.UIComponents?.showToast?.(message, type); } catch (e) { }
    }

    // ---- Pure rules (unit-tested) -------------------------------------------------------------------

    /** "morning" 5:00-11:59, "afternoon" 12:00-17:59, else "evening". */
    function partOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    }

    /** Minutes from "HH:MM"; NaN for anything else. */
    function minutesOf(value) {
        const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
        return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
    }

    const DAY_KEYS = Object.freeze(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);

    /**
     * What the Study today card shows: {kind: "setup"} with no plan; else {kind: "plan", planned (minutes
     * a day), today (is a study day), studying, until, nextAt, studied, progress 0..1}.
     */
    function studyToday(state, now = Date.now()) {
        const value = state && typeof state === 'object' ? state : {};
        const plan = value.study && typeof value.study === 'object' ? value.study.plan : null;
        const start = minutesOf(plan?.start);
        const end = minutesOf(plan?.end);
        if (!plan || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { kind: 'setup' };
        const planned = end - start;
        const days = Array.isArray(plan.days) ? plan.days : [];
        const today = days.length === 0 || days.includes(DAY_KEYS[new Date(now).getDay()]);
        const studying = value.state === 'STUDY';
        const studied = Math.max(0, Number(value.todayMinutes) || 0);
        const nextAt = Number(value.next?.at) > now ? Number(value.next.at) : null;
        return {
            kind: 'plan', planned, today, studying,
            until: studying && Number(value.until) > now ? Number(value.until) : null,
            nextAt, studied,
            progress: planned > 0 ? Math.min(1, studied / planned) : 0
        };
    }

    /** The numbers on a sidebar row: Filters and Kids add their counts; Content Controls has one. */
    function navCount(tint, summary) {
        const numbers = (String(summary || '').match(/\d[\d,.\s]*/g) || []).map(part => Number(part.replace(/[^\d]/g, '')) || 0);
        if (tint === 'filters' || tint === 'kids') return numbers.reduce((sum, item) => sum + item, 0);
        if (tint === 'content') return numbers.length ? numbers[0] : null;
        return null;
    }

    const REASON_COPY = Object.freeze({
        keyword: ['home.tried.keyword', 'Matched a blocked word'],
        channel: ['home.tried.channel', 'Blocked channel'],
        control: ['home.tried.control', 'Content control'],
        allowOnly: ['home.tried.allowOnly', 'Not on your allowed list']
    });

    // A control row's pill: the control's own name, as the Content Controls page words it.
    const CONTROL_COPY = Object.freeze({
        clips: ['home.tried.controlName.clips', 'Clips'],
        duration: ['home.tried.controlName.duration', 'Duration'],
        uploadDate: ['home.tried.controlName.uploadDate', 'Upload date'],
        category: ['home.tried.controlName.category', 'Category'],
        language: ['home.tried.controlName.language', 'Language'],
        views: ['home.tried.controlName.views', 'View count'],
        mixes: ['home.tried.controlName.mixes', 'Auto playlists'],
        homeFeed: ['home.tried.controlName.homeFeed', 'Home feed'],
        comments: ['home.tried.controlName.comments', 'Comments'],
        membersOnly: ['home.tried.controlName.membersOnly', 'Members-only'],
        playlistCards: ['home.tried.controlName.playlistCards', 'Playlist cards'],
        playables: ['home.tried.controlName.playables', 'Playables']
    });

    /** [key, fallback] for a row's reason pill: a control row names its control when the log knows it. */
    function reasonCopy(item) {
        if (item?.reason === 'control' && Object.prototype.hasOwnProperty.call(CONTROL_COPY, item.control)) return CONTROL_COPY[item.control];
        return REASON_COPY[item?.reason] || REASON_COPY.keyword;
    }

    /**
     * Where Change goes for a control: {nav, scope, control} — the sidebar row to open, the page that
     * holds the switch and the switch's data-ft-control key ('' when unknown: just open the page).
     * A Kids hide goes to the Kids page when that page has the control, else to Content Controls.
     */
    function controlDestination(control, surface, hasKidsRow = false) {
        const key = Object.prototype.hasOwnProperty.call(CONTROL_COPY, control) ? control : '';
        if (key && surface === 'kids' && hasKidsRow) return { nav: '.nav-item[data-tab="kids"]', scope: '#kidsView', control: key };
        return { nav: '.nav-item[data-nav-id="content"]', scope: '#filtersView', control: key };
    }

    // ---- Study state, shared (one request per change) ---------------------------------------------------

    let studyLoad = null;
    let studyCache = null;
    const studyListeners = new Set();
    function studyState(force = false) {
        if (studyLoad && !force) return studyLoad;
        studyLoad = send({ action: 'FilterTube_StudyGetState' }).then(state => {
            studyCache = state && state.ok !== false ? state : null;
            for (const listener of studyListeners) { try { listener(studyCache); } catch (e) { } }
            return studyCache;
        });
        return studyLoad;
    }
    try {
        api()?.storage?.onChanged?.addListener((changes, area) => {
            if (area === 'local' && (changes.ftStudyRuntimeV1 || changes[PROFILES_KEY])) studyState(true);
        });
    } catch (e) { }

    /** The effective mode (js/shared/effective_mode.js): {mode: 'study' | ..., ...} or null. */
    function effectiveMode(state) {
        try {
            const own = root.StateManager?.getState?.()?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            return root.FilterTubeEffectiveMode?.effectiveModeFor?.(own, state, Date.now()) || null;
        } catch (e) { return null; }
    }

    function effectiveText(effective) {
        try {
            return root.FilterTubeEffectiveMode?.effectiveModeText?.(effective, (key, fallback, values) => t(key, fallback, values), formatTime) || null;
        } catch (e) { return null; }
    }

    // ---- The sidebar ----------------------------------------------------------------------------------

    function mountNav() {
        const nav = doc.getElementById('sidebarNav');
        if (!nav) return;
        const rows = [...nav.querySelectorAll('.nav-item[data-pk-tint]')];
        for (const row of rows) {
            if (row.querySelector('.nav-count')) continue;
            const count = el('span', 'nav-count');
            count.setAttribute('aria-hidden', 'true');
            row.appendChild(count);
        }
        let queued = false;
        const render = () => {
            queued = false;
            for (const row of rows) {
                const value = navCount(row.dataset.pkTint, row.querySelector('.nav-summary')?.textContent);
                const count = row.querySelector('.nav-count');
                const text = value === null ? '' : formatCount(value);
                if (count && count.textContent !== text) count.textContent = text;
                row.classList.toggle('has-count', value !== null);
                row.classList.toggle('is-washed', value !== null && value > 0);
            }
        };
        render();
        // During a study session the Home and Filters rows say Study (the plan holds the rules).
        const studyRows = rows.filter(row => ['home', 'filters'].includes(row.dataset.pkTint));
        for (const row of studyRows) {
            if (row.querySelector('.nav-study')) continue;
            const line = el('span', 'nav-study');
            line.hidden = true;
            row.querySelector('.nav-text')?.appendChild(line);
        }
        const showStudy = state => {
            const text = effectiveText(effectiveMode(state));
            nav.classList.toggle('is-studying', !!text);
            for (const row of studyRows) {
                const line = row.querySelector('.nav-study');
                if (!line) continue;
                line.hidden = !text;
                line.textContent = text ? text.label : '';
                if (text) line.title = text.title; else line.removeAttribute('title');
            }
        };
        studyListeners.add(showStudy);
        new root.MutationObserver(records => {
            if (records.every(record => record.target?.closest?.('.nav-count') || record.target?.classList?.contains?.('nav-count'))) return;
            if (queued) return;
            queued = true;
            root.requestAnimationFrame(render);
        }).observe(nav, { subtree: true, childList: true, characterData: true });
    }

    // ---- Greeting ---------------------------------------------------------------------------------------

    function mountGreeting() {
        const hello = doc.getElementById('ftHomeHello');
        const kept = doc.getElementById('ftHomeKept');
        const stat = doc.getElementById('statHiddenToday');
        if (!hello || !kept) return;
        let modeLine = doc.getElementById('ftHomeMode');
        if (!modeLine) {
            modeLine = el('p', 'ft-home-greeting__mode');
            modeLine.id = 'ftHomeMode';
            modeLine.hidden = true;
            kept.insertAdjacentElement('afterend', modeLine);
        }
        const showStudy = state => {
            const text = effectiveText(effectiveMode(state));
            modeLine.hidden = !text;
            modeLine.textContent = text ? text.title : '';
        };
        studyListeners.add(showStudy);
        const render = () => {
            if (studyCache) showStudy(studyCache);
            const part = partOfDay(new Date().getHours());
            hello.textContent = t(`home.greet.${part}`, { morning: 'Good morning.', afternoon: 'Good afternoon.', evening: 'Good evening.' }[part]);
            const count = Number(String(stat?.textContent || '0').replace(/[^\d]/g, '')) || 0;
            kept.textContent = count > 0
                ? plural('home.kept', count, '{count} thing kept out today.', '{count} things kept out today.')
                : t('home.kept.none', 'Nothing to keep out yet today.');
        };
        render();
        if (stat) new root.MutationObserver(render).observe(stat, { childList: true, characterData: true, subtree: true });
        root.addEventListener('filtertube-ui-locale-changed', render);
        root.setInterval(render, 5 * 60 * 1000);
        const duo = doc.getElementById('ftHomeDuo');
        const mount = () => root.FilterTubeMascots?.mountLoop?.(duo, 'duoSieveLoop', { height: 168, className: 'ft-home-duo' });
        if (duo && !mount()) root.setTimeout(mount, 400);
    }

    // ---- Study today ------------------------------------------------------------------------------------

    function mountStudy() {
        const body = doc.getElementById('ftHomeStudyBody');
        if (!body) return null;
        let setupArt = null;
        let busy = false;
        const openStudy = () => openNav('.nav-item[data-nav-id="timeLimits"]');
        const button = (label, className, onClick) => {
            const node = el('button', className, label);
            node.type = 'button';
            node.addEventListener('click', onClick);
            return node;
        };
        const draw = async () => {
            const state = await studyState();
            const view = studyToday(state);
            body.replaceChildren();
            if (view.kind === 'setup') {
                // Kriti reads beside the words (kept across redraws, so she doesn't re-enter every minute).
                const setup = el('div', 'ft-home-study__setup');
                const words = el('div', 'ft-home-study__words');
                words.append(
                    el('p', 'ft-home-study__lead', t('home.study.noPlanTitle', 'No study plan yet')),
                    el('p', 'ft-home-study__line', t('home.study.noPlanBody', 'Choose what you study and when. While you study, FilterTube shows only that.')));
                setup.appendChild(words);
                const Mascots = root.FilterTubeMascots;
                if (!Mascots?.showsCharacters?.(Mascots?.mode)) setupArt = null;
                else if (!setupArt) setupArt = Mascots.moment?.('reading', { height: 96 }) || null;
                if (setupArt) setup.appendChild(setupArt);
                body.append(setup, button(t('study.setup.title', 'Set up study'), 'btn-primary ft-home-study__go', openStudy));
                return;
            }
            const big = el('p', 'ft-home-study__big');
            big.append(el('span', 'ft-home-study__minutes', formatCount(view.planned)), el('span', 'ft-home-study__unit', t('study.ring.planned', 'min planned')));
            let lineText = '';
            if (view.studying && view.until) lineText = t('home.study.now', 'Studying now, until {time}', { time: formatTime(view.until) });
            else if (view.nextAt) lineText = t('home.study.next', 'Next round at {time}', { time: formatTime(view.nextAt) });
            else if (!view.today) lineText = t('home.study.offToday', 'No study planned today.');
            const line = el('p', 'ft-home-study__line', lineText);
            const bar = el('div', 'ft-home-study__bar');
            bar.setAttribute('role', 'progressbar');
            bar.setAttribute('aria-valuemin', '0');
            bar.setAttribute('aria-valuemax', String(view.planned));
            bar.setAttribute('aria-valuenow', String(Math.min(view.studied, view.planned)));
            const studiedText = t('home.study.studied', '{minutes} min studied today', { minutes: formatCount(view.studied) });
            bar.setAttribute('aria-valuetext', studiedText);
            const fill = el('span', 'ft-home-study__fill');
            fill.style.setProperty('--ft-home-progress', String(view.progress));
            bar.appendChild(fill);
            const studied = el('p', 'ft-home-study__studied', studiedText);
            const actions = el('div', 'ft-home-study__actions');
            if (view.studying) actions.append(button(t('study.openStudy', 'Open study'), 'btn-primary', openStudy));
            else {
                actions.append(button(t('study.setup.startNow', 'Start now'), 'btn-primary', async event => {
                    if (busy) return;
                    busy = true;
                    event.currentTarget.disabled = true;
                    const result = await send({ action: 'FilterTube_StudyStartSession', minutes: Math.min(view.planned, 240), lock: 'gentle' });
                    busy = false;
                    if (result?.ok === false) {
                        if (result.error === 'no_active_pack') openStudy();
                        else toast(t('home.study.startFailed', 'Study could not start. Open Study to see why.'), 'error');
                    }
                    studyState(true);
                }));
            }
            // Today's plan, read-only: the Study page's day bar is the one editor; Edit opens it.
            const study = state?.study && typeof state.study === 'object' ? state.study : {};
            let plan = null;
            try {
                if (study.plan) plan = root.FilterTubeStudyUi?.planBar?.(study.plan, study.focus || {}, study.breakMode === 'normal' ? 'normal' : 'rest', { editable: false }) || null;
            } catch (e) { plan = null; }
            const planRow = el('div', 'ft-home-study__plan');
            if (plan) planRow.appendChild(plan);
            const edit = button(t('home.study.edit', 'Edit'), 'btn-secondary ft-home-study__edit', openStudy);
            planRow.appendChild(edit);
            body.append(big, line, bar, studied, planRow, actions);
        };
        draw();
        let drawing = false;
        studyListeners.add(() => { if (!drawing) { drawing = true; Promise.resolve().then(() => { drawing = false; draw(); }); } });
        root.addEventListener('filtertube-ui-locale-changed', () => draw());
        root.setInterval(() => { if (doc.getElementById('dashboardView')?.classList.contains('active')) studyState(true); }, 60 * 1000);
        return { draw };
    }

    // ---- What Uljhan tried today --------------------------------------------------------------------------

    async function allowVideo(item, action) {
        const Log = root.FilterTubeHiddenLog;
        if (!Log) return false;
        if (typeof root.FilterTubeIsUiLocked === 'function' && root.FilterTubeIsUiLocked()) {
            toast(t('home.tried.locked', 'Only a parent can allow this.'), 'error');
            return false;
        }
        const io = root.FilterTubeIO;
        const stored = io?.loadProfilesV4 ? await io.loadProfilesV4() : (await storageGet([PROFILES_KEY]))[PROFILES_KEY];
        const tree = stored && typeof stored === 'object' ? stored : null;
        const activeId = typeof tree?.activeProfileId === 'string' ? tree.activeProfileId : 'default';
        const profile = tree?.profiles?.[activeId];
        if (!tree || !profile) return false;
        // A Kids profile never loosens its own rules (the app asks a parent instead).
        if (String(profile.type || '').toLowerCase() === 'child') {
            toast(t('home.tried.locked', 'Only a parent can allow this.'), 'error');
            return false;
        }
        const surface = action.surface === 'kids' ? 'kids' : 'main';
        const next = { ...tree, profiles: { ...tree.profiles, [activeId]: { ...profile, [surface]: Log.withAllowedVideo(profile[surface], action.videoId) } } };
        if (io?.saveProfilesV4) await io.saveProfilesV4(next);
        else await storageSet({ [PROFILES_KEY]: next });
        const log = (await storageGet([LOG_KEY]))[LOG_KEY];
        await storageSet({ [LOG_KEY]: Log.without(log, action.videoId) });
        const compiled = await send({ action: 'getCompiledSettings', profileType: surface, forceRefresh: true });
        if (compiled && !compiled.error) send({ action: 'FilterTube_ApplySettings', settings: compiled, profile: surface });
        toast(t('home.tried.allowed', 'Allowed. It can show again.'), 'success');
        return true;
    }

    const frame = () => new Promise(resolve => root.requestAnimationFrame(() => resolve()));
    const wait = ms => new Promise(resolve => root.setTimeout(resolve, ms));
    let spotlightTimer = 0;

    /** Open the page that holds [item]'s control and bring that switch forward: scroll, focus, one pulse. */
    async function revealControl(item) {
        const control = Object.prototype.hasOwnProperty.call(CONTROL_COPY, item?.control) ? item.control : '';
        const hasKidsRow = !!control && !!doc.querySelector(`#kidsView [data-ft-control="${control}"]`);
        const where = controlDestination(control, item?.surface, hasKidsRow);
        openNav(where.nav);
        if (!where.control) return;
        // The router switches pages and the sidebar opens the Content Controls tab a frame later.
        await frame();
        await frame();
        await wait(60);
        const row = doc.querySelector(`${where.scope} [data-ft-control="${where.control}"]`);
        if (!row) return;
        const pane = row.closest('.tab-pane[data-tab-id]');
        if (pane && !pane.classList.contains('active')) {
            pane.closest('.tabs-container')?.querySelector(`.tab-button[data-tab-id="${pane.dataset.tabId}"]`)?.click();
        }
        // A search typed on that page earlier could be hiding the row.
        if (row.style.display === 'none' || row.closest('[data-ft-control-group]')?.style.display === 'none') {
            const search = pane?.querySelector('input.search-input');
            if (search && search.value) {
                search.value = '';
                search.dispatchEvent(new root.Event('input', { bubbles: true }));
            }
        }
        await frame();
        const still = !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        try { row.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' }); } catch (e) { row.scrollIntoView(); }
        const target = row.querySelector('input[type="checkbox"]') || row.querySelector('select, input, button');
        try { target?.focus({ preventScroll: true }); } catch (e) { }
        doc.querySelectorAll('.ft-control-spotlight').forEach(node => node.classList.remove('ft-control-spotlight'));
        root.clearTimeout(spotlightTimer);
        void row.offsetWidth; // restart the pulse when Change is pressed again
        row.classList.add('ft-control-spotlight');
        spotlightTimer = root.setTimeout(() => row.classList.remove('ft-control-spotlight'), 2400);
    }

    function mountTried() {
        const list = doc.getElementById('ftHomeTriedList');
        if (!list) return;
        const draw = async () => {
            const Log = root.FilterTubeHiddenLog;
            const items = Log ? Log.today((await storageGet([LOG_KEY]))[LOG_KEY], Date.now(), SHOWN) : [];
            list.replaceChildren();
            if (!items.length) {
                const empty = el('li', 'ft-home-tried__empty');
                const art = root.FilterTubeMascots?.showsCharacters?.(root.FilterTubeMascots?.mode)
                    ? root.FilterTubeMascots.moment?.('resting', { height: 56 }) : null;
                if (art) empty.appendChild(art);
                empty.appendChild(el('span', 'ft-home-tried__empty-line', t('home.tried.empty', 'Nothing got past today. Uljhan is resting.')));
                list.appendChild(empty);
                return;
            }
            for (const item of items) {
                const row = el('li', `ft-home-tried__row ft-home-tried__row--${item.reason}`);
                const words = el('div', 'ft-home-tried__words');
                words.append(el('span', 'ft-home-tried__title', item.title || item.videoId));
                const meta = el('span', 'ft-home-tried__meta');
                const reasonText = t(...reasonCopy(item));
                const reason = el('span', 'ft-home-tried__reason', reasonText);
                meta.appendChild(reason);
                if (item.channel) meta.appendChild(el('span', 'ft-home-tried__channel', item.channel));
                words.appendChild(meta);
                row.appendChild(words);
                const action = Log.allowAction(item);
                if (action) {
                    const label = action.kind === 'openControls' ? t('study.setup.change', 'Change') : t('home.tried.allow', 'Allow');
                    const allow = el('button', 'ft-home-tried__allow', label);
                    allow.type = 'button';
                    const named = action.kind === 'openControls' && CONTROL_COPY[action.control]
                        ? t('home.tried.changeControl', 'Change {control} setting', { control: reasonText })
                        : label;
                    allow.setAttribute('aria-label', `${named}: ${item.title || item.videoId}`);
                    if (action.kind === 'openControls' && action.control) allow.dataset.ftControl = action.control;
                    allow.addEventListener('click', async () => {
                        if (action.kind === 'openControls') { revealControl(action).catch(() => { }); return; }
                        allow.disabled = true;
                        const ok = await allowVideo(item, action).catch(() => false);
                        if (ok) draw(); else allow.disabled = false;
                    });
                    row.appendChild(allow);
                }
                list.appendChild(row);
            }
        };
        draw();
        try {
            api()?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && changes[LOG_KEY]) draw(); });
        } catch (e) { }
        root.addEventListener('filtertube-ui-locale-changed', () => draw());
    }

    // ---- Quick actions -----------------------------------------------------------------------------------

    function mountQuick() {
        doc.getElementById('quickStartStudyBtn')?.addEventListener('click', () => openNav('.nav-item[data-nav-id="timeLimits"]'));
    }

    function start() {
        if (!doc.querySelector('#dashboardView[data-ft-home]')) return;
        mountNav();
        mountGreeting();
        mountStudy();
        mountTried();
        mountQuick();
    }

    root.FilterTubeDashboardHome = Object.freeze({ partOfDay, minutesOf, studyToday, navCount, REASON_COPY, CONTROL_COPY, reasonCopy, controlDestination });
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})(typeof window !== 'undefined' ? window : globalThis);
