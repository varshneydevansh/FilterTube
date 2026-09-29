/* Shared presentation only; admission decisions remain with their existing owners. */
(function(root) {
    const runtimeAPI = root.browser || root.chrome;
    let localeCatalog = null;
    let localeCatalogLoading = null;
    let localeDirection = 'ltr';
    const pendingLocaleOverlays = new Set();
    const RTL_LANGUAGES = new Set(['apc', 'apd', 'ar', 'arz', 'fa', 'he', 'ur', 'yi']);
    const RTL_SCRIPTS = new Set(['Adlm', 'Arab', 'Hebr', 'Nkoo', 'Rohg', 'Thaa']);

    function resolveAutomaticAdmissionLocale(requestedLocale) {
        // Keep the fallback aligned with RELEASED_LOCALES in js/ui_localization.js.
        // Content scripts do not load the dashboard localization runtime, so only
        // its released allowlist (never its preview/staged list) may opt in here.
        const configured = root.FilterTubeUiLocalization?.releasedLocales;
        const releasedLocales = Array.isArray(configured) ? configured : ['en'];
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
            'Blocked by Language Filter': 'admission.blockedLanguage'
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
            const preference = saved?.ftUiLocalePreference;
            const locale = preference === 'auto'
                ? resolveAutomaticAdmissionLocale(root.navigator?.language)
                : preference;
            localeDirection = admissionTextDirection(locale);
            if (typeof locale !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale) || locale === 'en') return null;
            return fetch(runtimeAPI.runtime.getURL(`data/ui_locales/${locale}.json`))
                .then(response => response.ok ? response.json() : null).catch(() => null);
        }).then(catalog => {
            localeCatalog = catalog && typeof catalog === 'object' && !Array.isArray(catalog) ? catalog : null;
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

    function admissionOverlayStyle(element, styles) {
        try { if (element?.style) Object.assign(element.style, styles); } catch (e) {}
    }

    function removeAdmissionOverlayBackground(overlay) {
        const background = overlay?.__filtertubeAdmissionBackground || null;
        if (!background) return;
        try { background.pause?.(); } catch (e) {}
        try { background.remove?.(); } catch (e) {}
        try { overlay.__filtertubeAdmissionBackground = null; } catch (e) {}
    }

    function ensureAdmissionOverlayVisuals(overlay, state, message) {
        if (overlay) {
            overlay.__filtertubeAdmissionState = state;
            overlay.__filtertubeAdmissionMessage = message;
            applyAdmissionDirection(overlay);
            if (typeof overlay.setAttribute === 'function') {
                overlay.setAttribute('aria-label', localizedAdmissionMessage(message));
            }
            loadAdmissionLocale(overlay);
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
            font: '400 15px/1.55 "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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
                padding: 'clamp(24px, 5vw, 44px)', border: '1px solid rgba(255,255,255,.28)', borderRadius: '28px',
                boxShadow: '0 28px 90px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)'
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
            admissionOverlayStyle(brandName, { color: blocked || darkTheme ? '#f3f6fa' : '#1b1a18', font: '750 16px/1 "Outfit", sans-serif', letterSpacing: '.01em' });
            brandName.textContent = 'FilterTube';
            brand.appendChild(brandMark);
            brand.appendChild(brandName);

            status = document.createElement('p');
            status.setAttribute('data-filtertube-admission-status', 'true');
            admissionOverlayStyle(status, {
                margin: '12px 0 0', color: blocked ? '#cfe2d2' : (darkTheme ? '#9aa6b4' : '#827b73'),
                font: '700 12px/1.35 "Plus Jakarta Sans", sans-serif', letterSpacing: '.08em', textTransform: 'uppercase'
            });

            title = document.createElement('h1');
            title.setAttribute('data-filtertube-admission-title', 'true');
            admissionOverlayStyle(title, {
                margin: '0', color: blocked ? '#fffaf4' : pendingText,
                font: '700 clamp(24px, 4vw, 38px)/1.12 "Outfit", "Plus Jakarta Sans", sans-serif', letterSpacing: '-.02em'
            });

            reason = document.createElement('p');
            reason.setAttribute('data-filtertube-admission-reason', 'true');
            admissionOverlayStyle(reason, {
                margin: '0', padding: '15px 16px',
                borderLeft: rtl ? 'none' : `3px solid ${accentColor}`,
                borderRight: rtl ? `3px solid ${accentColor}` : 'none',
                borderRadius: rtl ? '14px 4px 4px 14px' : '4px 14px 14px 4px',
                background: blocked ? 'rgba(255,255,255,.1)' : (darkTheme ? 'rgba(255,255,255,.06)' : 'rgba(171,68,56,.07)'),
                color: blocked ? '#fffaf4' : pendingText, font: '650 14px/1.55 "Plus Jakarta Sans", sans-serif',
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
        admissionOverlayStyle(panel, {
            background: blocked ? 'rgba(12,18,25,.82)' : (darkTheme ? 'rgba(18,24,33,.96)' : 'rgba(255,255,255,.84)'),
            color: blocked ? blockedText : pendingText
        });
        admissionOverlayStyle(brandMark, { background: '#ab4438' });
        admissionOverlayStyle(brandName, { color: blocked || darkTheme ? '#f3f6fa' : '#1b1a18' });
        admissionOverlayStyle(status, { color: blocked ? '#cfe2d2' : (darkTheme ? '#9aa6b4' : '#827b73') });
        admissionOverlayStyle(title, { color: blocked ? '#fffaf4' : pendingText });
        admissionOverlayStyle(reason, {
            borderLeft: rtl ? 'none' : `3px solid ${accentColor}`,
            borderRight: rtl ? `3px solid ${accentColor}` : 'none',
            borderRadius: rtl ? '14px 4px 4px 14px' : '4px 14px 14px 4px',
            background: blocked ? 'rgba(255,255,255,.1)' : (darkTheme ? 'rgba(255,255,255,.06)' : 'rgba(171,68,56,.07)'),
            color: blocked ? '#fffaf4' : pendingText
        });
        status.textContent = blocked
            ? localizedAdmissionText('admission.blockedStatus', 'Playback blocked')
            : localizedAdmissionText('admission.checkingStatus', 'Checking playback');
        title.textContent = blocked
            ? localizedAdmissionText('admission.blockedTitle', 'This video is blocked')
            : localizedAdmissionText('admission.checkingTitle', 'Checking before playback');
        reason.textContent = localizedAdmissionMessage(message);
        if (blocked && background?.play && background.paused !== false) {
            try { background.play()?.catch?.(() => {}); } catch (e) {}
        }
    }


    root.FilterTubeAdmissionOverlay = {
        render: ensureAdmissionOverlayVisuals,
        clear: removeAdmissionOverlayBackground,
        localizeMessage: localizedAdmissionMessage,
        resolveMessage: resolveAdmissionMessage,
        getDirection: () => localeDirection
    };
})(typeof window !== 'undefined' ? window : globalThis);
