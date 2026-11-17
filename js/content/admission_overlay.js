/* Shared presentation only; admission decisions remain with their existing owners. */
(function(root) {
    const runtimeAPI = root.browser || root.chrome;
    let localeCatalog = null;
    let localeCatalogLoading = null;
    let localeDirection = 'ltr';
    let localeLanguage = 'en';
    const pendingLocaleOverlays = new Set();
    const RTL_LANGUAGES = new Set(['apc', 'apd', 'ar', 'arz', 'fa', 'he', 'ur', 'yi']);
    const RTL_SCRIPTS = new Set(['Adlm', 'Arab', 'Hebr', 'Nkoo', 'Rohg', 'Thaa']);

    function resolveAutomaticAdmissionLocale(requestedLocale) {
        // Keep the fallback aligned with RELEASED_LOCALES in js/ui_localization.js.
        // Content scripts do not load the dashboard localization runtime.
        // The fallback is parity-tested against all supported bundled catalogs.
        const configured = root.FilterTubeUiLocalization?.releasedLocales;
        const releasedLocales = Array.isArray(configured) ? configured : ['en', 'zh-Hans', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'id', 'ur', 'ru', 'de', 'ja', 'pcm', 'arz', 'mr', 'vi', 'te', 'sw', 'ha', 'tr', 'pa-Arab', 'fil', 'ta', 'yue-Hant', 'wuu-Hans', 'fa', 'ko', 'am', 'th', 'jv', 'it', 'gu', 'kn', 'apc', 'apd', 'yo', 'bho'];
        const available = releasedLocales.filter(locale => typeof locale === 'string'
            && /^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale));
        if (!available.includes('en')) available.unshift('en');

        const code = String(requestedLocale || 'en').trim().replace(/_/g, '-');
        let requested = 'en';
        if (/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(code)) {
            try { requested = Intl.getCanonicalLocales(code)[0] || 'en'; } catch (e) {}
        }
        const candidates = [requested];
        try { candidates.push(new Intl.Locale(requested).maximize().toString()); } catch (e) {}
        for (const candidate of candidates) {
            const parts = candidate.split('-');
            while (parts.length) {
                const prefix = parts.join('-');
                const match = available.find(locale => locale.toLowerCase() === prefix.toLowerCase());
                if (match) return match;
                parts.pop();
            }
        }
        return 'en';
    }

    function admissionTextDirection(locale) {
        const parts = String(locale || '').split('-');
        const script = parts.find(part => /^[A-Za-z]{4}$/.test(part));
        if (script) return RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr';
        return RTL_LANGUAGES.has((parts[0] || '').toLowerCase()) ? 'rtl' : 'ltr';
    }

    function applyAdmissionDirection(overlay) {
        if (!overlay || typeof overlay.setAttribute !== 'function') return;
        try { overlay.setAttribute('dir', localeDirection); } catch (e) {}
        try { overlay.setAttribute('lang', localeLanguage); } catch (e) {}
    }

    function localizedAdmissionText(key, fallback) {
        const value = localeCatalog?.[key];
        return typeof value === 'string' && value.trim() ? value : fallback;
    }

    function localizedAdmissionMessage(message) {
        const labels = {
            'Checking FilterTube rules…': 'admission.checkingRules',
            'Unable to verify required metadata': 'admission.unverified',
            'Playback remains paused': 'admission.paused',
            'Blocked video': 'admission.blockedVideo',
            'Blocked channel': 'admission.blockedChannel',
            'Blocked keyword': 'admission.blockedKeyword',
            'Not in Allow only selected': 'admission.allowOnly',
            'Blocked by Duration Filter': 'admission.blockedDuration',
            'Blocked by Upload Date Filter': 'admission.blockedUploadDate',
            'Blocked by Uppercase Title Filter': 'admission.blockedUppercase',
            'Blocked by Category Filter': 'admission.blockedCategory',
            'Blocked by Language Filter': 'admission.blockedLanguage',
            "Not part of today's study": 'admission.studyOffList',
            'Not during study': 'admission.studyNotNow'
        };
        return String(message || '').split('\n').map(line =>
            labels[line] ? localizedAdmissionText(labels[line], line) : line).join('\n');
    }

    function loadAdmissionLocale(overlay) {
        if (localeCatalogLoading) {
            if (overlay) pendingLocaleOverlays.add(overlay);
            return localeCatalogLoading;
        }
        if (!runtimeAPI?.storage?.local?.get || !runtimeAPI?.runtime?.getURL) return Promise.resolve(null);
        if (overlay) pendingLocaleOverlays.add(overlay);
        localeCatalogLoading = new Promise(resolve => {
            try {
                const result = runtimeAPI.storage.local.get('ftUiLocalePreference', value => resolve(value));
                if (result?.then) result.then(resolve, () => resolve({}));
            } catch (_) {
                try {
                    Promise.resolve(runtimeAPI.storage.local.get('ftUiLocalePreference'))
                        .then(resolve, () => resolve({}));
                } catch (_) { resolve({}); }
            }
        }).then(saved => {
            const preference = typeof saved?.ftUiLocalePreference === 'string' ? saved.ftUiLocalePreference : 'auto';
            const locale = preference === 'auto'
                ? resolveAutomaticAdmissionLocale(root.navigator?.language)
                : preference;
            localeDirection = admissionTextDirection(locale);
            localeLanguage = typeof locale === 'string' ? locale : 'en';
            if (typeof locale !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale) || locale === 'en') return null;
            return fetch(runtimeAPI.runtime.getURL(`data/ui_locales/${locale}.json`))
                .then(response => response.ok ? response.json() : null).catch(() => null);
        }).then(catalog => {
            localeCatalog = catalog && typeof catalog === 'object' && !Array.isArray(catalog) ? catalog : null;
            if (!localeCatalog) {
                localeLanguage = 'en';
                localeDirection = 'ltr';
            }
            for (const pendingOverlay of pendingLocaleOverlays) {
                if (pendingOverlay?.isConnected && pendingOverlay.__filtertubeAdmissionState) {
                    ensureAdmissionOverlayVisuals(pendingOverlay, pendingOverlay.__filtertubeAdmissionState, pendingOverlay.__filtertubeAdmissionMessage);
                }
            }
            pendingLocaleOverlays.clear();
            return localeCatalog;
        }).catch(() => { pendingLocaleOverlays.clear(); return null; });
        return localeCatalogLoading;
    }

    // Kriti and Uljhan on the gate (BIBLE.md moments map): Kriti shoos Uljhan off a blocked video, and
    // stands by the study card. They follow the Companion setting (Lively plays the sheet once, Quiet
    // shows the still, Off shows no character) and never move with reduced motion.
    const MASCOT_DIR = 'assets/images/mascots/';
    // The app's DUO_SHOO (420 ms a frame): Uljhan sneaks up, Kriti waves him off, he hops away, and she
    // reads on (the resting frame).
    const SHOO_FRAMES = [1, 2, 3, 4, 5, 6].map(index => `duo_shoo_0${index}.webp`);
    const SHOO_FRAME_MS = 420;
    let companionMode = 'quiet';
    let companionLoading = null;

    function loadAdmissionCompanion() {
        if (companionLoading) return companionLoading;
        if (!runtimeAPI?.storage?.local?.get) return Promise.resolve(companionMode);
        companionLoading = new Promise(resolve => {
            try {
                const result = runtimeAPI.storage.local.get('ftCompanionMode', value => resolve(value));
                if (result?.then) result.then(resolve, () => resolve({}));
            } catch (_) { resolve({}); }
        }).then(saved => {
            const mode = typeof saved?.ftCompanionMode === 'string' ? saved.ftCompanionMode.trim().toLowerCase() : '';
            companionMode = mode === 'lively' || mode === 'off' ? mode : 'quiet';
            return companionMode;
        }).catch(() => companionMode);
        return companionLoading;
    }

    function admissionMascotUrl(name) {
        try {
            const getURL = runtimeAPI?.runtime?.getURL;
            return typeof getURL === 'function' ? getURL.call(runtimeAPI.runtime, `${MASCOT_DIR}${name}`) : '';
        } catch (e) { return ''; }
    }

    /** A decorative pose for a gate card; null when there is no extension URL to load it from. */
    function createAdmissionMascot(name, height) {
        const url = admissionMascotUrl(name);
        if (!url || typeof document.createElement !== 'function') return null;
        const picture = document.createElement('img');
        picture.setAttribute('aria-hidden', 'true');
        picture.setAttribute('data-filtertube-admission-mascot', name);
        picture.alt = '';
        picture.draggable = false;
        picture.src = url;
        admissionOverlayStyle(picture, {
            display: 'block', width: 'auto', height: `${height}px`, maxWidth: '100%', objectFit: 'contain',
            border: '0', margin: '0', padding: '0', background: 'none', pointerEvents: 'none', userSelect: 'none'
        });
        return picture;
    }

    // The shoo plays at most three times a day (Android MascotStatePolicy.BLOCKED_DAILY_PLAYS, keyed by
    // the local date); otherwise, and in Quiet, the gate shows Uljhan's shrug still, as the app does.
    const SHOO_DAILY_PLAYS = 3;
    const SHOO_CAP_KEY = 'ftMascotCapsV1';
    const SHOO_REST = 'uljhan_shrug.webp';

    function admissionLocalDay(date = new Date()) {
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    /** Resolves true when a play is left today, and counts it. */
    function takeShooPlay() {
        const local = runtimeAPI?.storage?.local;
        if (!local?.get || !local?.set) return Promise.resolve(true);
        return new Promise(resolve => {
            try {
                const done = value => {
                    const caps = value?.[SHOO_CAP_KEY] && typeof value[SHOO_CAP_KEY] === 'object' ? value[SHOO_CAP_KEY] : {};
                    const today = admissionLocalDay();
                    const plays = caps.blockedDay === today ? Math.max(0, Number(caps.blockedCount) || 0) : 0;
                    if (plays >= SHOO_DAILY_PLAYS) { resolve(false); return; }
                    try { local.set({ [SHOO_CAP_KEY]: { ...caps, blockedDay: today, blockedCount: plays + 1 } }); } catch (e) {}
                    resolve(true);
                };
                const result = local.get(SHOO_CAP_KEY, done);
                if (result && typeof result.then === 'function') result.then(done, () => resolve(true));
            } catch (e) { resolve(true); }
        });
    }

    function restAdmissionShoo(picture) {
        const url = admissionMascotUrl(SHOO_REST);
        if (!url) return;
        picture.src = url;
        picture.setAttribute('data-filtertube-admission-mascot', SHOO_REST);
        admissionOverlayStyle(picture, { height: '112px' });
    }

    /** The shoo sheet once (Lively, motion allowed, under the daily cap), ending on its last frame;
     * otherwise Uljhan's shrug still. */
    function playAdmissionShoo(picture) {
        if (!picture || picture.__filtertubeShooPlayed) return;
        picture.__filtertubeShooPlayed = true;
        if (companionMode !== 'lively' || admissionOverlayPrefersReducedMotion() || typeof root.setTimeout !== 'function') {
            restAdmissionShoo(picture);
            return;
        }
        takeShooPlay().then(allowed => {
            if (allowed) runAdmissionShoo(picture);
            else restAdmissionShoo(picture);
        });
    }

    function runAdmissionShoo(picture) {
        admissionOverlayStyle(picture, { height: '132px' });
        let index = 0;
        const step = () => {
            if (picture.isConnected === false) return;
            const url = admissionMascotUrl(SHOO_FRAMES[index]);
            if (url) picture.src = url;
            index += 1;
            if (index < SHOO_FRAMES.length) root.setTimeout(step, SHOO_FRAME_MS);
            else admissionIdle(picture);
        };
        step();
    }

    // Idle life on the in-page cards (the app's MascotIdle, as js/mascots.js does on the extension's
    // pages): a small bob or squash now and then, the first after 6 to 12 s, then 12, 20, 30 s, none
    // after two minutes. Any interaction on the page wakes it with a fresh budget (one throttled,
    // passive listener; no sound). Lively only, never with reduced motion.
    const ADMISSION_IDLE = { firstMin: 6000, firstMax: 12000, gaps: [12000, 20000, 30000], jitter: 0.15, budget: 120000, wakeMs: 1000 };
    const ADMISSION_WAKE_EVENTS = ['pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'];
    const admissionIdleLives = new Set();
    let admissionWakeInstalled = false;
    let admissionLastWake = -Infinity;

    function admissionSpring(stiffness, damping, velocity) {
        const omega = Math.sqrt(stiffness);
        const decay = damping * omega;
        const damped = omega * Math.sqrt(1 - damping * damping);
        const samples = [0];
        for (let ms = 1000 / 60; ms <= 900; ms += 1000 / 60) samples.push((velocity / damped) * Math.exp(-decay * ms / 1000) * Math.sin(damped * ms / 1000));
        samples.push(0);
        return samples;
    }

    function admissionIdle(picture) {
        if (!picture || picture.__filtertubeIdle || typeof root.setTimeout !== 'function') return;
        let timer = 0;
        let index = 0;
        let started = Date.now();
        let pending = false;
        const may = () => companionMode === 'lively' && !admissionOverlayPrefersReducedMotion();
        const delay = () => index === 0
            ? ADMISSION_IDLE.firstMin + (ADMISSION_IDLE.firstMax - ADMISSION_IDLE.firstMin) * Math.random()
            : ADMISSION_IDLE.gaps[Math.min(index - 1, 2)] * (1 - ADMISSION_IDLE.jitter + 2 * ADMISSION_IDLE.jitter * Math.random());
        const schedule = () => {
            root.clearTimeout(timer);
            pending = false;
            if (picture.isConnected === false || !may()) return;
            const wait = delay();
            if (Date.now() + wait - started > ADMISSION_IDLE.budget) return;
            pending = true;
            timer = root.setTimeout(beat, wait);
        };
        const beat = () => {
            pending = false;
            if (picture.isConnected === false) return;
            if (document.visibilityState !== 'hidden' && typeof picture.animate === 'function') {
                const squash = Math.random() < 0.4;
                const samples = squash ? admissionSpring(700, 0.55, -1) : admissionSpring(800, 0.45, -125);
                try {
                    picture.style.transformOrigin = '50% 100%';
                    picture.animate(samples.map(v => ({ transform: squash ? `scaleY(${(1 + v).toFixed(4)})` : `translateY(${v.toFixed(2)}px)` })),
                        { duration: Math.round((samples.length - 1) * 1000 / 60), easing: 'linear' });
                } catch (e) {}
            }
            index += 1;
            schedule();
        };
        const life = {
            picture,
            wake(now) {
                started = now;
                if (!pending) { index = 0; schedule(); }
            }
        };
        picture.__filtertubeIdle = life;
        admissionIdleLives.add(life);
        if (!admissionWakeInstalled && typeof document.addEventListener === 'function') {
            admissionWakeInstalled = true;
            const onInteraction = () => {
                const now = Date.now();
                if (now - admissionLastWake < ADMISSION_IDLE.wakeMs) return;
                admissionLastWake = now;
                for (const entry of [...admissionIdleLives]) {
                    if (entry.picture.isConnected === false) { admissionIdleLives.delete(entry); continue; }
                    entry.wake(now);
                }
            };
            for (const type of ADMISSION_WAKE_EVENTS) document.addEventListener(type, onInteraction, { passive: true, capture: true });
        }
        schedule();
    }

    function syncAdmissionMascot(overlay, slot, holder, name, height) {
        const show = companionMode !== 'off';
        let picture = overlay[slot] || null;
        if (!show) {
            if (picture) { try { picture.remove?.(); } catch (e) {} }
            overlay[slot] = null;
            return null;
        }
        if (picture && picture.getAttribute?.('data-filtertube-admission-mascot') !== name) {
            try { picture.remove?.(); } catch (e) {}
            picture = null;
        }
        if (!picture) {
            picture = createAdmissionMascot(name, height);
            if (!picture) return null;
            holder.appendChild(picture);
            overlay[slot] = picture;
            if (!SHOO_FRAMES.includes(name)) admissionIdle(picture);
        }
        return picture;
    }

    // The Watch gate during Study: dom_fallback's study first lines become a calm teal study card
    // with "Back to study" (top frames only; an embedded player can't leave its page).
    const STUDY_LINES = { "Not part of today's study": 'offList', 'Not during study': 'notNow' };

    function studyKind(message) {
        return STUDY_LINES[String(message || '').split('\n')[0]] || '';
    }

    /** Home is the study feed while studying (the filters keep only plan videos there). */
    function backToStudy() {
        try { root.location.assign('/'); } catch (e) {}
    }

    function renderStudyCard(overlay, kind, message) {
        const darkTheme = admissionOverlayUsesDarkTheme();
        admissionOverlayStyle(overlay, {
            position: 'fixed', inset: '0', zIndex: '2147483647', width: '100vw', height: '100vh', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 56px)', overflow: 'hidden',
            pointerEvents: 'auto', userSelect: 'text', whiteSpace: 'normal',
            background: darkTheme ? '#0f141b' : '#f6f2eb', color: darkTheme ? '#edf2f7' : '#1b1a18',
            font: '400 15px/1.55 system-ui, Roboto, "Segoe UI", -apple-system, sans-serif'
        });
        removeAdmissionOverlayBackground(overlay);
        if (typeof overlay?.appendChild !== 'function' || typeof document.createElement !== 'function') {
            try { overlay.textContent = localizedAdmissionMessage(message); } catch (e) {}
            return;
        }
        let card = overlay.__filtertubeStudyCard || null;
        if (!card) {
            while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
            overlay.__filtertubeAdmissionPanel = null;
            overlay.__filtertubeAdmissionScrim = null;
            card = document.createElement('section');
            card.setAttribute('data-filtertube-study-card', 'true');
            admissionOverlayStyle(card, {
                display: 'flex', flexDirection: 'column', gap: '14px', width: 'min(480px, 100%)', boxSizing: 'border-box',
                padding: 'clamp(24px, 5vw, 40px)', borderRadius: '24px', border: `1px solid ${darkTheme ? '#2a3440' : '#dcd1c2'}`,
                background: darkTheme ? '#151c24' : '#fffcf6', boxShadow: `0 3px 0 ${darkTheme ? 'rgba(0,0,0,.42)' : 'rgba(27,26,24,.14)'}`
            });
            const status = document.createElement('p');
            const title = document.createElement('h1');
            const reason = document.createElement('p');
            const owner = document.createElement('p');
            const actions = document.createElement('div');
            admissionOverlayStyle(status, { margin: '0', color: darkTheme ? '#7fb89a' : '#1F6F6A', font: '700 12px/1.3 system-ui, Roboto, "Segoe UI", sans-serif', letterSpacing: '0', textTransform: 'none' });
            admissionOverlayStyle(title, { margin: '0', font: '400 clamp(22px, 3.6vw, 32px)/1.2 "FilterTube Delius", "Outfit", system-ui, sans-serif', color: darkTheme ? '#edf2f7' : '#1b1a18' });
            admissionOverlayStyle(reason, { margin: '0', font: '500 15px/1.55 system-ui, Roboto, "Segoe UI", sans-serif' });
            admissionOverlayStyle(owner, { margin: '0', opacity: '.75', font: '500 13px/1.4 system-ui, Roboto, "Segoe UI", sans-serif', overflowWrap: 'anywhere' });
            admissionOverlayStyle(actions, { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' });
            card.append(status, title, reason, owner, actions);
            overlay.appendChild(card);
            overlay.__filtertubeStudyCard = card;
            overlay.__filtertubeStudyParts = { status, title, reason, owner, actions };
        }
        const parts = overlay.__filtertubeStudyParts;
        const offList = kind === 'offList';
        // Kriti points back to the plan (off the list) or holds her mug (a break, the limit, a clock check).
        const kriti = syncAdmissionMascot(overlay, '__filtertubeStudyMascot', card, offList ? 'kriti_pointing.webp' : 'kriti_mug_06.webp', 132);
        if (kriti) admissionOverlayStyle(kriti, { order: '-1', alignSelf: localeDirection === 'rtl' ? 'flex-start' : 'flex-end', marginBottom: '-6px' });
        parts.status.textContent = localizedAdmissionText('admission.studyStatus', 'Study');
        parts.title.textContent = offList
            ? localizedAdmissionText('admission.studyOffList', "Not part of today's study")
            : localizedAdmissionText('admission.studyNotNow', 'Not during study');
        parts.reason.textContent = offList
            ? localizedAdmissionText('admission.studyOffListBody', 'Videos from your study plan play now. This one can wait until study ends.')
            : localizedAdmissionText('admission.studyNotNowBody', 'Nothing plays during a break, after today\'s limit or while the clock is being checked.');
        parts.owner.textContent = String(message || '').split('\n').slice(1).join(' ').trim();
        while (parts.actions.firstChild) parts.actions.removeChild(parts.actions.firstChild);
        let topFrame = true;
        try { topFrame = root.top === root; } catch (e) { topFrame = false; }
        if (offList && topFrame) {
            const back = document.createElement('button');
            back.type = 'button';
            back.setAttribute('data-filtertube-study-action', 'back');
            back.textContent = localizedAdmissionText('admission.studyBack', 'Back to study');
            admissionOverlayStyle(back, {
                padding: '10px 20px', borderRadius: '999px', border: '0', cursor: 'pointer',
                background: '#1F6F6A', color: '#ffffff', font: '700 14px/1 system-ui, Roboto, "Segoe UI", sans-serif'
            });
            back.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); backToStudy(); });
            parts.actions.appendChild(back);
        }
    }

    function resolveAdmissionMessage(message) {
        return Promise.resolve(loadAdmissionLocale()).then(() => localizedAdmissionMessage(message));
    }
    function admissionOverlayPrefersReducedMotion() {
        try { return root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch (e) { return false; }
    }

    function admissionOverlayUsesDarkTheme() {
        try {
            const rootElement = document.documentElement;
            const theme = rootElement?.getAttribute?.('data-theme') || rootElement?.dataset?.theme || '';
            return theme === 'dark' || (theme !== 'light' && root.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true);
        } catch (e) { return false; }
    }

    function admissionOverlayHeroUrl() {
        try {
            const getURL = runtimeAPI?.runtime?.getURL;
            return typeof getURL === 'function' ? getURL.call(runtimeAPI.runtime, 'assets/images/homepage_hero_day.mp4') : '';
        } catch (e) { return ''; }
    }

    // The app's hand for titles: the extension's own Delius (SIL OFL), loaded once into this page
    // from the extension under its own family name, so the site's fonts are never touched.
    let admissionHandLoaded = false;
    function loadAdmissionHand() {
        if (admissionHandLoaded) return;
        admissionHandLoaded = true;
        try {
            const runtimeAPI = typeof browser !== 'undefined' && browser?.runtime ? browser : (typeof chrome !== 'undefined' ? chrome : null);
            const url = runtimeAPI?.runtime?.getURL?.('assets/fonts/delius.ttf');
            if (!url || typeof FontFace !== 'function' || !document.fonts) return;
            const face = new FontFace('FilterTube Delius', `url("${url}")`, { display: 'swap' });
            document.fonts.add(face);
            face.load().catch(() => {});
        } catch (e) {}
    }

    function admissionOverlayStyle(element, styles) {
        if (styles && typeof styles.font === 'string' && styles.font.includes('FilterTube Delius')) loadAdmissionHand();
        try { if (element?.style) Object.assign(element.style, styles); } catch (e) {}
    }

    function removeAdmissionOverlayBackground(overlay) {
        const background = overlay?.__filtertubeAdmissionBackground || null;
        if (!background) return;
        try { background.pause?.(); } catch (e) {}
        try { background.remove?.(); } catch (e) {}
        try { overlay.__filtertubeAdmissionBackground = null; } catch (e) {}
    }

    // ---- Quiet blocking (settings.quietBlocking) ---------------------------------------------------
    // A parent can ask for blocks a child does not notice: no brand, no reason, no character, no
    // "blocked". The check before playback is a plain dark cover with no words, and a blocked video
    // (or channel page) reads like an ordinary unavailable item with a way back. Only presentation
    // changes here; the callers' pause and play guards decide exactly as before.

    /** options.quiet wins when given; a redraw without options (locale, companion) keeps the last value. */
    function resolveAdmissionQuiet(overlay, options) {
        if (options && typeof options.quiet === 'boolean') return options.quiet;
        return overlay?.__filtertubeAdmissionQuiet === true;
    }

    function emptyAdmissionOverlay(overlay) {
        try {
            if (typeof overlay.replaceChildren === 'function') { overlay.replaceChildren(); return; }
        } catch (e) {}
        try { while (overlay.firstChild) overlay.removeChild(overlay.firstChild); } catch (e) {}
        try { if (Array.isArray(overlay.children)) overlay.children.slice().forEach(child => overlay.removeChild(child)); } catch (e) {}
    }

    /** Drops every branded part so the next branded render rebuilds from nothing. */
    function clearBrandedAdmissionParts(overlay) {
        if (!overlay) return;
        removeAdmissionOverlayBackground(overlay);
        removeAskParent(overlay);
        emptyAdmissionOverlay(overlay);
        for (const slot of ['__filtertubeAdmissionPanel', '__filtertubeAdmissionBrand', '__filtertubeAdmissionBrandMark',
            '__filtertubeAdmissionBrandName', '__filtertubeAdmissionStatus', '__filtertubeAdmissionTitle',
            '__filtertubeAdmissionReason', '__filtertubeAdmissionScrim', '__filtertubeAdmissionMascot',
            '__filtertubeChannelBack', '__filtertubeStudyCard', '__filtertubeStudyParts', '__filtertubeStudyMascot']) {
            try { overlay[slot] = null; } catch (e) {}
        }
    }

    function removeQuietAdmissionCover(overlay) {
        if (!overlay?.__filtertubeQuietCover) return;
        emptyAdmissionOverlay(overlay);
        overlay.__filtertubeQuietCover = null;
        overlay.__filtertubeQuietParts = null;
        try { overlay.removeAttribute?.('data-filtertube-quiet'); } catch (e) {}
        try { overlay.removeAttribute?.('aria-busy'); } catch (e) {}
    }

    /** Back in history when there is somewhere to go, else the site's Home. */
    function quietGoBack() {
        try {
            if (root.history && Number(root.history.length) > 1 && typeof root.history.back === 'function') {
                root.history.back();
                return;
            }
        } catch (e) {}
        try { root.location.assign('/'); } catch (e) {}
    }

    function quietAdmissionTitle(overlay) {
        return overlay?.__filtertubeAdmissionKind === 'channel'
            ? localizedAdmissionText('admission.quietChannelTitle', "This channel isn't available")
            : localizedAdmissionText('admission.quietVideoTitle', "This video isn't available");
    }

    function renderQuietAdmissionCover(overlay, state) {
        if (!overlay) return;
        const blocked = state === 'blocked';
        const channelPage = overlay.__filtertubeAdmissionKind === 'channel';
        // Inside the player the cover is player-dark; a channel page follows the page's theme.
        const dark = channelPage ? admissionOverlayUsesDarkTheme() : true;
        const ink = dark ? '#e8e8e8' : '#1f1f1f';
        admissionOverlayStyle(overlay, {
            position: 'fixed', inset: '0', zIndex: '2147483647', width: '100vw', height: '100vh',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 56px)', overflow: 'hidden', isolation: 'isolate',
            pointerEvents: 'auto', userSelect: 'none', whiteSpace: 'normal',
            background: dark ? (blocked ? '#121212' : '#000000') : '#ffffff', color: ink,
            font: '400 15px/1.5 system-ui, Roboto, "Segoe UI", -apple-system, sans-serif'
        });
        const title = blocked ? quietAdmissionTitle(overlay) : '';
        if (typeof overlay.setAttribute === 'function') {
            overlay.setAttribute('data-filtertube-quiet', 'true');
            if (blocked) {
                overlay.setAttribute('aria-label', title);
                try { overlay.removeAttribute?.('aria-busy'); } catch (e) {}
            } else {
                try { overlay.removeAttribute?.('aria-label'); } catch (e) {}
                overlay.setAttribute('aria-busy', 'true');
            }
        }
        const canCompose = typeof overlay.appendChild === 'function' && typeof document.createElement === 'function';
        if (!canCompose) {
            try { overlay.textContent = title; } catch (e) {}
            return;
        }
        let cover = overlay.__filtertubeQuietCover || null;
        if (!cover) {
            clearBrandedAdmissionParts(overlay);
            cover = document.createElement('section');
            cover.setAttribute('data-filtertube-quiet-cover', 'true');
            admissionOverlayStyle(cover, {
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                maxWidth: 'min(420px, 100%)', textAlign: 'center'
            });
            const heading = document.createElement('h1');
            heading.setAttribute('data-filtertube-quiet-title', 'true');
            admissionOverlayStyle(heading, {
                margin: '0', font: '500 clamp(16px, 2.4vw, 20px)/1.4 system-ui, Roboto, "Segoe UI", -apple-system, sans-serif',
                letterSpacing: '0', color: ink
            });
            const actions = document.createElement('div');
            admissionOverlayStyle(actions, { display: 'flex', gap: '10px', justifyContent: 'center' });
            cover.appendChild(heading);
            cover.appendChild(actions);
            overlay.appendChild(cover);
            overlay.__filtertubeQuietCover = cover;
            overlay.__filtertubeQuietParts = { heading, actions, back: null };
        }
        const parts = overlay.__filtertubeQuietParts;
        admissionOverlayStyle(cover, { display: blocked ? 'flex' : 'none' });
        parts.heading.textContent = title;
        admissionOverlayStyle(parts.heading, { color: ink });
        let topFrame = true;
        try { topFrame = root.top === root; } catch (e) { topFrame = false; }
        // An embedded player cannot leave its host page, so it gets the words only.
        if (blocked && topFrame) {
            if (!parts.back) {
                const back = document.createElement('button');
                back.type = 'button';
                back.setAttribute('data-filtertube-quiet-action', 'back');
                back.addEventListener('click', event => {
                    event?.preventDefault?.();
                    event?.stopPropagation?.();
                    quietGoBack();
                });
                parts.actions.appendChild(back);
                parts.back = back;
            }
            parts.back.textContent = localizedAdmissionText('admission.quietBack', 'Go back');
            admissionOverlayStyle(parts.back, {
                minHeight: '40px', padding: '0 20px', borderRadius: '999px', cursor: 'pointer',
                border: `1px solid ${dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'}`,
                background: 'transparent', color: ink, font: '500 14px/1 system-ui, Roboto, "Segoe UI", sans-serif'
            });
        } else if (parts.back) {
            try { parts.back.remove(); } catch (e) {}
            parts.back = null;
        }
    }

    function ensureAdmissionOverlayVisuals(overlay, state, message, options) {
        const quiet = resolveAdmissionQuiet(overlay, options);
        // Study cards stay as they are: a study plan is chosen, not a hidden block.
        const studyLine = state === 'blocked' ? studyKind(message) : '';
        const quietCover = quiet && !studyLine;
        if (overlay) {
            overlay.__filtertubeAdmissionQuiet = quiet;
            overlay.__filtertubeAdmissionState = state;
            overlay.__filtertubeAdmissionMessage = message;
            applyAdmissionDirection(overlay);
            if (!quietCover && typeof overlay.setAttribute === 'function') {
                overlay.setAttribute('aria-label', localizedAdmissionMessage(message));
            }
            loadAdmissionLocale(overlay);
        }
        if (quietCover) {
            renderQuietAdmissionCover(overlay, state);
            return;
        }
        removeQuietAdmissionCover(overlay);
        if (overlay) {
            if (!companionLoading && runtimeAPI?.storage?.local?.get) {
                // The Companion setting arrives once; redraw so the pose follows it.
                loadAdmissionCompanion().then(() => {
                    if (overlay.isConnected !== false && overlay.__filtertubeAdmissionState) {
                        ensureAdmissionOverlayVisuals(overlay, overlay.__filtertubeAdmissionState, overlay.__filtertubeAdmissionMessage);
                    }
                });
            }
        }
        const study = studyLine;
        if (study) {
            renderStudyCard(overlay, study, message);
            return;
        }
        if (overlay && overlay.__filtertubeStudyCard) {
            try { overlay.__filtertubeStudyCard.remove(); } catch (e) {}
            overlay.__filtertubeStudyCard = null;
            overlay.__filtertubeStudyParts = null;
            overlay.__filtertubeStudyMascot = null;
        }
        const blocked = state === 'blocked';
        const reducedMotion = admissionOverlayPrefersReducedMotion();
        const darkTheme = admissionOverlayUsesDarkTheme();
        const canCompose = typeof overlay?.appendChild === 'function' && typeof document.createElement === 'function';
        const blockedBackground = darkTheme ? '#172329' : '#304c4e';
        const pendingBackground = darkTheme ? '#0b1016' : '#f6f2eb';
        const blockedText = darkTheme ? '#fffaf4' : '#fffaf4';
        const pendingText = darkTheme ? '#f3f6fa' : '#1b1a18';
        const accentColor = darkTheme ? '#c35a4b' : '#ab4438';
        const rtl = localeDirection === 'rtl';

        admissionOverlayStyle(overlay, {
            position: 'fixed', inset: '0', zIndex: '2147483647', width: '100vw', height: '100vh',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 56px)', overflow: 'hidden', isolation: 'isolate',
            pointerEvents: 'auto', userSelect: 'text', whiteSpace: 'normal',
            background: blocked ? blockedBackground : pendingBackground,
            color: blocked ? blockedText : pendingText,
            font: '400 15px/1.55 system-ui, Roboto, "Segoe UI", -apple-system, sans-serif'
        });

        if (!canCompose) {
            // The small test/runtime DOMs may expose only textContent. Keep the
            // exact admission reason observable there without requiring child nodes.
            try { overlay.textContent = localizedAdmissionMessage(message); } catch (e) {}
            return;
        }

        let panel = overlay.__filtertubeAdmissionPanel || null;
        let brand = overlay.__filtertubeAdmissionBrand || null;
        let brandMark = overlay.__filtertubeAdmissionBrandMark || null;
        let brandName = overlay.__filtertubeAdmissionBrandName || null;
        let status = overlay.__filtertubeAdmissionStatus || null;
        let title = overlay.__filtertubeAdmissionTitle || null;
        let reason = overlay.__filtertubeAdmissionReason || null;
        let scrim = overlay.__filtertubeAdmissionScrim || null;

        if (!panel) {
            panel = document.createElement('section');
            panel.setAttribute('aria-live', 'polite');
            panel.setAttribute('data-filtertube-admission-panel', 'true');
            admissionOverlayStyle(panel, {
                position: 'relative', zIndex: '2', display: 'flex', flexDirection: 'column', gap: '18px',
                width: 'min(540px, 100%)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', boxSizing: 'border-box',
                padding: 'clamp(24px, 5vw, 44px)', border: '1px solid transparent', borderRadius: '28px'
            });

            brand = document.createElement('div');
            brand.setAttribute('data-filtertube-admission-brand', 'true');
            admissionOverlayStyle(brand, { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '36px' });
            brandMark = document.createElement('img');
            brandMark.setAttribute('aria-hidden', 'true');
            admissionOverlayStyle(brandMark, {
                display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '12px',
                background: '#ab4438', padding: '5px', boxSizing: 'border-box', objectFit: 'contain',
                boxShadow: '0 8px 18px rgba(105,35,29,.2)'
            });
            brandMark.src = runtimeAPI?.runtime?.getURL?.('icons/icon-48.png') || '';
            brandMark.alt = '';
            brandName = document.createElement('span');
            admissionOverlayStyle(brandName, { color: blocked || darkTheme ? '#f3f6fa' : '#1b1a18', font: '400 18px/1 "FilterTube Delius", "Outfit", sans-serif', letterSpacing: '0' });
            brandName.textContent = 'FilterTube';
            brand.appendChild(brandMark);
            brand.appendChild(brandName);

            status = document.createElement('p');
            status.setAttribute('data-filtertube-admission-status', 'true');
            admissionOverlayStyle(status, {
                margin: '12px 0 0', color: blocked ? '#cfe2d2' : (darkTheme ? '#9aa6b4' : '#827b73'),
                font: '700 12px/1.35 system-ui, Roboto, "Segoe UI", sans-serif', letterSpacing: '0', textTransform: 'none'
            });

            title = document.createElement('h1');
            title.setAttribute('data-filtertube-admission-title', 'true');
            admissionOverlayStyle(title, {
                margin: '0', color: blocked ? '#fffaf4' : pendingText,
                font: '400 clamp(24px, 4vw, 36px)/1.2 "FilterTube Delius", "Outfit", system-ui, sans-serif', letterSpacing: '0'
            });

            reason = document.createElement('p');
            reason.setAttribute('data-filtertube-admission-reason', 'true');
            admissionOverlayStyle(reason, {
                margin: '0', padding: '15px 16px',
                borderLeft: rtl ? 'none' : `3px solid ${accentColor}`,
                borderRight: rtl ? `3px solid ${accentColor}` : 'none',
                borderRadius: rtl ? '14px 4px 4px 14px' : '4px 14px 14px 4px',
                background: blocked ? 'rgba(255,255,255,.1)' : (darkTheme ? 'rgba(255,255,255,.06)' : 'rgba(171,68,56,.07)'),
                color: blocked ? '#fffaf4' : pendingText, font: '650 14px/1.55 system-ui, Roboto, "Segoe UI", sans-serif',
                whiteSpace: 'pre-line', overflowWrap: 'anywhere'
            });

            panel.appendChild(brand);
            panel.appendChild(status);
            panel.appendChild(title);
            panel.appendChild(reason);
            overlay.appendChild(panel);
            overlay.__filtertubeAdmissionPanel = panel;
            overlay.__filtertubeAdmissionBrand = brand;
            overlay.__filtertubeAdmissionBrandMark = brandMark;
            overlay.__filtertubeAdmissionBrandName = brandName;
            overlay.__filtertubeAdmissionStatus = status;
            overlay.__filtertubeAdmissionTitle = title;
            overlay.__filtertubeAdmissionReason = reason;
        }

        if (!scrim) {
            scrim = document.createElement('div');
            scrim.setAttribute('aria-hidden', 'true');
            scrim.setAttribute('data-filtertube-admission-scrim', 'true');
            admissionOverlayStyle(scrim, { position: 'absolute', inset: '0', zIndex: '1', pointerEvents: 'none' });
            overlay.insertBefore?.(scrim, panel);
            if (!scrim.parentNode) overlay.appendChild(scrim);
            overlay.__filtertubeAdmissionScrim = scrim;
        }

        let background = overlay.__filtertubeAdmissionBackground || null;
        if (blocked && !reducedMotion && !background && admissionOverlayHeroUrl()) {
            background = document.createElement('video');
            background.setAttribute('aria-hidden', 'true');
            background.setAttribute('data-filtertube-admission-background', 'true');
            background.setAttribute('muted', '');
            background.setAttribute('autoplay', '');
            background.setAttribute('loop', '');
            background.setAttribute('playsinline', '');
            background.muted = true;
            background.defaultMuted = true;
            background.autoplay = true;
            background.loop = true;
            background.playsInline = true;
            background.preload = 'metadata';
            background.src = admissionOverlayHeroUrl();
            admissionOverlayStyle(background, {
                position: 'absolute', inset: '0', zIndex: '0', width: '100%', height: '100%', objectFit: 'cover',
                opacity: '.58', filter: 'saturate(.82) brightness(.8)', pointerEvents: 'none'
            });
            overlay.appendChild(background);
            overlay.__filtertubeAdmissionBackground = background;
        } else if (!blocked || reducedMotion) {
            removeAdmissionOverlayBackground(overlay);
            background = null;
        }

        admissionOverlayStyle(scrim, {
            display: blocked ? 'block' : 'none',
            background: blocked
                ? 'linear-gradient(135deg, rgba(8,13,18,.78), rgba(15,23,42,.62) 45%, rgba(27,38,48,.72))'
                : 'transparent'
        });
        // PaperKit: what you read sits on a paper sheet (cream by day, navy at night), never on frosted glass.
        const paperInk = darkTheme ? '#edf2f7' : '#1b1a18';
        admissionOverlayStyle(panel, {
            background: darkTheme ? '#151c24' : '#fffcf6',
            color: paperInk,
            border: `1px solid ${darkTheme ? '#2a3440' : '#dcd1c2'}`,
            boxShadow: `0 3px 0 ${darkTheme ? 'rgba(0,0,0,.42)' : 'rgba(27,26,24,.14)'}, 0 28px 70px -30px rgba(0,0,0,.45)`
        });
        admissionOverlayStyle(brandMark, { background: '#ab4438' });
        admissionOverlayStyle(brandName, { color: paperInk });
        admissionOverlayStyle(status, { color: blocked ? (darkTheme ? '#e0796b' : '#a93e31') : (darkTheme ? '#b8c3ce' : '#625f58') });
        admissionOverlayStyle(title, { color: paperInk });
        admissionOverlayStyle(reason, {
            borderLeft: rtl ? 'none' : `3px solid ${accentColor}`,
            borderRight: rtl ? `3px solid ${accentColor}` : 'none',
            borderRadius: rtl ? '14px 4px 4px 14px' : '4px 14px 14px 4px',
            background: darkTheme ? '#3a2422' : '#fae8e6',
            color: paperInk
        });
        // Kriti shoos Uljhan off a blocked video; the short check before playback has no character.
        const shoo = blocked
            ? syncAdmissionMascot(overlay, '__filtertubeAdmissionMascot', panel, SHOO_REST, 112)
            : (overlay.__filtertubeAdmissionMascot ? (overlay.__filtertubeAdmissionMascot.remove?.(), overlay.__filtertubeAdmissionMascot = null) : null);
        if (shoo) {
            admissionOverlayStyle(shoo, { order: '-1', alignSelf: 'center', marginBottom: '-4px' });
            if (companionLoading) companionLoading.then(() => playAdmissionShoo(shoo));
            else playAdmissionShoo(shoo);
        }
        // A blocked channel page (dom_fallback.js showBlockedChannelPage): the reason as the status,
        // the channel's name as the title, then the ask and a way back. There is no player here.
        const channelPage = blocked && overlay.__filtertubeAdmissionKind === 'channel';
        const channelLines = channelPage ? String(message || '').split('\n') : [];
        status.textContent = channelPage
            ? localizedAdmissionMessage(channelLines[0] || '')
            : (blocked
                ? localizedAdmissionText('admission.blockedStatus', 'Playback blocked')
                : localizedAdmissionText('admission.checkingStatus', 'Checking playback'));
        title.textContent = channelPage
            ? (channelLines.slice(1).join(' ').trim() || localizedAdmissionMessage(channelLines[0] || ''))
            : (blocked
                ? localizedAdmissionText('admission.blockedTitle', 'This video is blocked')
                : localizedAdmissionText('admission.checkingTitle', 'Checking before playback'));
        reason.textContent = localizedAdmissionMessage(message);
        admissionOverlayStyle(reason, { display: channelPage ? 'none' : 'block' });
        if (channelPage) mountChannelBack(overlay, panel, darkTheme);
        if (blocked) mountAskParent(overlay, panel, darkTheme);
        else removeAskParent(overlay);
        if (blocked && background?.play && background.paused !== false) {
            try { background.play()?.catch?.(() => {}); } catch (e) {}
        }
    }


    // ---- Ask a parent (Android AskParentUi) ---------------------------------------------------------
    // On a child profile with a parent who can answer, the blocked card offers "Ask to watch": reason
    // chips, a one-line note, then "Sent to Mum" with Kriti thinking. The ask goes to the background
    // (js/ask_parent_background.js); nothing plays until a parent answers.

    function askText(key, fallback, values = {}) {
        return String(localizedAdmissionText(key, fallback)).replace(/\{([a-zA-Z]+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function askSend(message) {
        return new Promise(resolve => {
            try {
                const maybe = runtimeAPI?.runtime?.sendMessage?.(message, response => {
                    if (runtimeAPI.runtime.lastError) resolve(null); else resolve(response);
                });
                if (maybe && typeof maybe.then === 'function') maybe.then(resolve, () => resolve(null));
            } catch (e) { resolve(null); }
        });
    }

    function removeAskParent(overlay) {
        const holder = overlay?.__filtertubeAskParent;
        if (holder) {
            try { holder.remove(); } catch (e) {}
            overlay.__filtertubeAskParent = null;
            overlay.__filtertubeAskParentKey = '';
        }
    }

    function askButton(label, primary, dark) {
        const node = document.createElement('button');
        node.type = 'button';
        node.textContent = label;
        admissionOverlayStyle(node, {
            minHeight: '44px', padding: '0 18px', borderRadius: '999px', cursor: 'pointer',
            font: '700 14px/1 system-ui, Roboto, "Segoe UI", sans-serif', letterSpacing: '0',
            border: primary ? '0' : `1.5px solid ${dark ? '#3a4654' : '#cdbfae'}`,
            background: primary ? '#ab4438' : 'transparent', color: primary ? '#fffaf4' : (dark ? '#edf2f7' : '#1b1a18')
        });
        return node;
    }

    function askLine(textValue, dark, weight = 500) {
        const node = document.createElement('p');
        node.textContent = textValue;
        admissionOverlayStyle(node, { margin: '0', color: dark ? '#cfd8e2' : '#4a4640', font: `${weight} 14px/1.5 system-ui, Roboto, "Segoe UI", sans-serif` });
        return node;
    }

    function waitingLine(state) {
        const name = state.parentName || askText('askParent.parentFallback', 'Your parent');
        return state.route === 'same_device'
            ? askText('askParent.waitingHere', '{name} can answer on this device.', { name })
            : askText('askParent.waitingRemote', '{name} will see it next time their device connects.', { name });
    }

    function renderAskSent(holder, state, dark, already) {
        const name = state.parentName || askText('askParent.parentFallback', 'Your parent');
        holder.replaceChildren();
        makeRoomForSheet(holder, false);
        const row = document.createElement('div');
        admissionOverlayStyle(row, { display: 'flex', alignItems: 'center', gap: '12px' });
        const kriti = companionMode === 'off' ? null : createAdmissionMascot('kriti_thinking.webp', 64);
        if (kriti) row.appendChild(kriti);
        const words = document.createElement('div');
        admissionOverlayStyle(words, { display: 'grid', gap: '4px' });
        words.appendChild(askLine(already
            ? askText('askParent.already', 'You already asked for this. Waiting for {name}.', { name })
            : askText('askParent.sent', 'Sent to {name}', { name }), dark, 700));
        words.appendChild(askLine(waitingLine(state), dark));
        row.appendChild(words);
        holder.appendChild(row);
    }

    function askRefusal(result, state) {
        const name = state.parentName || askText('askParent.parentFallback', 'Your parent');
        switch (result?.type) {
            case 'too_many': return askText('askParent.tooMany', 'You have {count} asks waiting. Wait for an answer first.', { count: 3 });
            case 'wait': return askText('askParent.wait', 'Wait a little before asking again.');
            case 'recently_declined': {
                let time = '';
                try { time = new Date(result.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) {}
                return askText('askParent.recentlyNo', '{name} said not now. You can ask again at {time}.', { name, time });
            }
            case 'asking_off': return askText('askParent.off', 'Asking is turned off.');
            default: return askText('askParent.noParent', 'No parent is linked yet, so this can\'t be sent.');
        }
    }

    /** The card sits inside the player: while the sheet is open the shoo pose steps aside for it. */
    function makeRoomForSheet(holder, open) {
        const panel = holder.parentNode;
        const pose = panel?.querySelector?.('[data-filtertube-admission-mascot]');
        if (pose) admissionOverlayStyle(pose, { display: open ? 'none' : 'block' });
    }

    function renderAskSheet(holder, target, state, dark) {
        const name = state.parentName || askText('askParent.parentFallback', 'Your parent');
        holder.replaceChildren();
        makeRoomForSheet(holder, true);
        // The sheet is sun paper (Android AskParentUi), inside the blocked card.
        admissionOverlayStyle(holder, { padding: '16px', borderRadius: '18px', background: dark ? '#2c2716' : '#fff3cf',
            border: `1px solid ${dark ? '#4a4128' : '#ecd9a0'}` });
        const title = document.createElement('h2');
        title.textContent = target.kind === 'channel'
            ? askText('askParent.titleChannel', 'Ask for this channel')
            : askText('askParent.titleVideo', 'Ask to watch');
        admissionOverlayStyle(title, { margin: '0', font: '400 22px/1.2 "FilterTube Delius", "Outfit", system-ui, sans-serif', color: dark ? '#f6eccd' : '#1b1a18' });
        holder.appendChild(title);
        holder.appendChild(askLine(askText('askParent.sheetBody', '{name} will see your ask and answer it.', { name }), dark));
        holder.appendChild(askLine(askText('askParent.why', 'Why do you want it?'), dark, 700));
        const chips = document.createElement('div');
        chips.setAttribute('role', 'radiogroup');
        admissionOverlayStyle(chips, { display: 'flex', flexWrap: 'wrap', gap: '8px' });
        let reason = '';
        const chipLabels = { school: ['askParent.reasonSchool', 'For school'], once: ['askParent.reasonOnce', 'Just this once'], other: ['askParent.reasonOther', 'Something else'] };
        const chipNodes = [];
        for (const [key, [labelKey, fallback]] of Object.entries(chipLabels)) {
            const chip = askButton(askText(labelKey, fallback), false, dark);
            chip.setAttribute('role', 'radio');
            chip.setAttribute('aria-checked', 'false');
            chip.addEventListener('click', () => {
                reason = reason === key ? '' : key;
                for (const [node, nodeKey] of chipNodes) {
                    const on = nodeKey === reason;
                    node.setAttribute('aria-checked', on ? 'true' : 'false');
                    admissionOverlayStyle(node, { background: on ? (dark ? '#e7c35a' : '#1b1a18') : 'transparent', color: on ? (dark ? '#1b1a18' : '#fffaf4') : (dark ? '#edf2f7' : '#1b1a18') });
                }
            });
            chipNodes.push([chip, key]);
            chips.appendChild(chip);
        }
        holder.appendChild(chips);
        const note = document.createElement('input');
        note.type = 'text';
        note.maxLength = 80;
        note.placeholder = askText('askParent.noteHint', 'Add a note (optional)');
        note.setAttribute('aria-label', note.placeholder);
        admissionOverlayStyle(note, { minHeight: '48px', padding: '0 14px', borderRadius: '14px', boxSizing: 'border-box', width: '100%',
            border: `1.5px solid ${dark ? '#4a4128' : '#d8c38a'}`, background: dark ? '#151c24' : '#fffcf6', color: dark ? '#edf2f7' : '#1b1a18',
            font: '500 15px/1.4 system-ui, Roboto, "Segoe UI", sans-serif' });
        holder.appendChild(note);
        const status = askLine('', dark);
        status.setAttribute('role', 'status');
        const actions = document.createElement('div');
        admissionOverlayStyle(actions, { display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' });
        const cancel = askButton(askText('askParent.cancel', 'Not now'), false, dark);
        const send = askButton(askText('askParent.send', 'Send to {name}', { name }), true, dark);
        cancel.addEventListener('click', () => renderAskStart(holder, target, state, dark));
        send.addEventListener('click', async () => {
            send.disabled = true;
            const result = await askSend({ action: 'FilterTube_AskParentCreate', target, reason, note: note.value });
            if (result?.type === 'created') {
                // The crayon note folds and flies (Android PAPER_FLIP), then "Sent".
                const still = admissionOverlayPrefersReducedMotion() || typeof holder.animate !== 'function';
                if (!still) {
                    try { await holder.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-24px) rotate(-4deg) scale(.92)', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' }).finished; } catch (e) {}
                }
                renderAskSent(holder, state, dark, false);
                return;
            }
            if (result?.type === 'already_open') { renderAskSent(holder, state, dark, true); return; }
            send.disabled = false;
            status.textContent = askRefusal(result, state);
        });
        actions.append(cancel, send);
        holder.append(status, actions);
        try { note.focus({ preventScroll: true }); } catch (e) {}
        try { send.scrollIntoView?.({ block: 'nearest' }); } catch (e) {}
    }

    function renderAskStart(holder, target, state, dark) {
        holder.replaceChildren();
        makeRoomForSheet(holder, false);
        admissionOverlayStyle(holder, { padding: '0', background: 'transparent', border: '0' });
        const ask = askButton(target.kind === 'channel'
            ? askText('askParent.titleChannel', 'Ask for this channel')
            : askText('askParent.button', 'Ask to watch'), true, dark);
        ask.setAttribute('data-filtertube-ask-parent', 'true');
        ask.addEventListener('click', () => renderAskSheet(holder, target, state, dark));
        holder.appendChild(ask);
    }

    /** "Back" on a blocked channel page: there is no player to return to, so it goes Home. */
    function mountChannelBack(overlay, panel, dark) {
        if (!panel || typeof document.createElement !== 'function' || overlay.__filtertubeChannelBack) return;
        const back = askButton(askText('askParent.back', 'Back'), false, dark);
        back.setAttribute('data-filtertube-channel-back', 'true');
        back.addEventListener('click', () => {
            try { root.location.assign('/'); } catch (e) {}
        });
        const row = document.createElement('div');
        admissionOverlayStyle(row, { display: 'flex', justifyContent: 'flex-start', order: '10' });
        row.appendChild(back);
        panel.appendChild(row);
        overlay.__filtertubeChannelBack = row;
    }

    async function mountAskParent(overlay, panel, dark) {
        const target = root.__filtertubeAskParentTarget;
        const channelAsk = target?.kind === 'channel' && !!target.channelId;
        if (!overlay || !panel || (!target?.videoId && !channelAsk) || typeof document.createElement !== 'function') { removeAskParent(overlay); return; }
        const key = channelAsk ? `c:${target.channelId}|${target.blockedBy}` : `${target.videoId}|${target.blockedBy}`;
        // One ask card per blocked video or channel; a redraw of the same card keeps it (and its typed note).
        if (overlay.__filtertubeAskParentKey === key) return;
        removeAskParent(overlay);
        overlay.__filtertubeAskParentKey = key;
        const state = await askSend(channelAsk
            ? { action: 'FilterTube_AskParentState', channelId: target.channelId }
            : { action: 'FilterTube_AskParentState', videoId: target.videoId });
        if (!state?.isChild || overlay.__filtertubeAskParentKey !== key || overlay.__filtertubeAdmissionState !== 'blocked') return;
        // Quiet blocking turned on while the state was loading: the ask would name the block.
        if (overlay.__filtertubeAdmissionQuiet === true || overlay.__filtertubeAdmissionPanel !== panel) return;
        if (!state.canAsk && !state.openFor) return;
        const holder = document.createElement('div');
        holder.setAttribute('data-filtertube-ask-parent-holder', 'true');
        admissionOverlayStyle(holder, { display: 'grid', gap: '12px' });
        panel.appendChild(holder);
        overlay.__filtertubeAskParent = holder;
        if (state.openFor) renderAskSent(holder, state, dark, true);
        else renderAskStart(holder, target, state, dark);
    }


    root.FilterTubeAdmissionOverlay = {
        // render(overlay, state, message, { quiet }): quiet draws the unbranded cover (settings.quietBlocking).
        render: ensureAdmissionOverlayVisuals,
        isQuiet: overlay => overlay?.__filtertubeAdmissionQuiet === true,
        clear: removeAdmissionOverlayBackground,
        localizeMessage: localizedAdmissionMessage,
        resolveMessage: resolveAdmissionMessage,
        // For study_overlay.js: the same bundled catalog, by key.
        text: (key, fallback) => localizedAdmissionText(key, fallback),
        loadLocale: () => loadAdmissionLocale(),
        // For study_overlay.js: the Companion setting (lively, quiet or off) the poses follow.
        loadCompanion: () => loadAdmissionCompanion(),
        idle: picture => admissionIdle(picture),
        // For bridge_settings.js (the time-limit screen and the viewing-route gate): a pose, or null
        // with the Companion Off; the page's theme; the app's hand for titles.
        pose: (name, height) => (companionMode === 'off' ? null : createAdmissionMascot(name, height)),
        isDark: () => admissionOverlayUsesDarkTheme(),
        loadHand: () => loadAdmissionHand(),
        getCompanion: () => companionMode,
        getDirection: () => localeDirection
    };
})(typeof window !== 'undefined' ? window : globalThis);
