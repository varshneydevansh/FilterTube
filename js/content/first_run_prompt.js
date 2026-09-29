// Shows a one-time prompt after initial install on YouTube asking the user to refresh.
(function () {
    if (window.top !== window) return;
    const api = (typeof browserAPI_BRIDGE !== 'undefined' && browserAPI_BRIDGE.runtime)
        ? browserAPI_BRIDGE
        : (typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null));
    if (!api || !api.runtime) return;

    const PROMPT_ID = 'ft-first-run-refresh-prompt';
    let dismissed = false;

    async function localizePrompt(container) {
        try {
            const stored = await new Promise(resolve => {
                if (!api.storage?.local?.get) return resolve({});
                const result = api.storage.local.get('ftUiLocalePreference', resolve);
                if (result?.then) result.then(resolve, () => resolve({}));
            });
            const preference = stored?.ftUiLocalePreference;
            const locale = preference === 'auto'
                ? resolveAutomaticPromptLocale(window.navigator?.language)
                : preference;
            if (typeof locale !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale) || locale === 'en') return;
            const response = await fetch(api.runtime.getURL(`data/ui_locales/${locale}.json`));
            if (!response.ok || !container.isConnected) return;
            const catalog = await response.json();
            if (!container.isConnected) return;
            for (const element of container.querySelectorAll('[data-ft-first-run-i18n]')) {
                const value = catalog[element.dataset.ftFirstRunI18n];
                if (typeof value === 'string' && value.trim()) element.textContent = value;
            }
            const close = container.querySelector('[data-ft-first-run-i18n-aria]');
            const closeLabel = close && catalog[close.dataset.ftFirstRunI18nAria];
            if (typeof closeLabel === 'string' && closeLabel.trim()) close.setAttribute('aria-label', closeLabel);
            if (/^(ar|arz|apc|apd|fa|ur|pa-Arab)(-|$)/.test(locale)) {
                container.dir = 'rtl';
                container.style.right = 'auto';
                container.style.left = '16px';
            }
        } catch (_) { /* The bundled English copy remains usable. */ }

        function resolveAutomaticPromptLocale(requestedLocale) {
            // Match the released-only gate in js/ui_localization.js. Explicitly
            // selected preview locales bypass this resolver and keep working.
            const configured = window.FilterTubeUiLocalization?.releasedLocales;
            const releasedLocales = Array.isArray(configured) ? configured : ['en'];
            const available = releasedLocales.filter(value => typeof value === 'string'
                && /^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(value));
            if (!available.includes('en')) available.unshift('en');

            const code = String(requestedLocale || 'en').trim().replace(/_/g, '-');
            let requested = 'en';
            if (/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(code)) {
                try { requested = Intl.getCanonicalLocales(code)[0] || 'en'; } catch (_) {}
            }
            const candidates = [requested];
            try { candidates.push(new Intl.Locale(requested).maximize().toString()); } catch (_) {}
            for (const candidate of candidates) {
                const parts = candidate.split('-');
                while (parts.length) {
                    const prefix = parts.join('-');
                    const match = available.find(value => value.toLowerCase() === prefix.toLowerCase());
                    if (match) return match;
                    parts.pop();
                }
            }
            return 'en';
        }
    }

    function getPalette() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            return {
                surface: '#1E1E1E',
                border: 'rgba(255,255,255,0.12)',
                text: '#F5F5F5',
                subtext: '#CFCFD0',
                accent: '#C0392B',
                accentSoft: 'rgba(192,57,43,0.25)',
                buttonText: '#FFFFFF',
                secondaryBg: 'rgba(255,255,255,0.08)',
                shadow: '0 16px 40px rgba(0,0,0,0.45)'
            };
        }
        return {
            surface: '#FFFFFF',
            border: 'rgba(0,0,0,0.08)',
            text: '#111827',
            subtext: '#4B5563',
            accent: '#C0392B',
            accentSoft: 'rgba(192,57,43,0.12)',
            buttonText: '#FFFFFF',
            secondaryBg: 'rgba(17,24,39,0.04)',
            shadow: '0 18px 46px rgba(15,23,36,0.14)'
        };
    }

    function createPrompt() {
        if (dismissed) return;
        if (document.getElementById(PROMPT_ID)) return;

        const palette = getPalette();

        const container = document.createElement('section');
        container.id = PROMPT_ID;
        container.style.position = 'fixed';
        container.style.zIndex = '2147483647';
        container.style.top = '16px';
        container.style.right = '16px';
        container.style.maxWidth = '360px';
        container.style.width = 'clamp(280px, 32vw, 360px)';
        container.style.background = palette.surface;
        container.style.border = `1px solid ${palette.border}`;
        container.style.borderRadius = '16px';
        container.style.padding = '18px';
        container.style.color = palette.text;
        container.style.boxShadow = palette.shadow;
        container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        container.style.lineHeight = '1.45';
        container.style.boxSizing = 'border-box';
        container.style.backdropFilter = 'blur(10px)';
        container.style.animation = 'ft-first-run-fade 220ms ease-out';

        const accentBar = document.createElement('div');
        accentBar.style.height = '4px';
        accentBar.style.width = '48px';
        accentBar.style.borderRadius = '999px';
        accentBar.style.background = `linear-gradient(135deg, ${palette.accent}, ${palette.accentSoft})`;
        accentBar.style.marginBottom = '14px';
        container.appendChild(accentBar);

        const title = document.createElement('div');
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';
        title.style.letterSpacing = '-0.01em';
        title.textContent = 'FilterTube is active';
        title.dataset.ftFirstRunI18n = 'firstRun.activeTitle';
        title.style.marginBottom = '8px';
        container.appendChild(title);

        const desc = document.createElement('div');
        desc.style.marginBottom = '16px';
        desc.style.color = palette.subtext;
        desc.style.fontSize = '14px';
        desc.textContent = 'This tab can now use FilterTube controls. Reload once if you want the earliest YouTube data on this already-open tab covered too.';
        desc.dataset.ftFirstRunI18n = 'firstRun.reloadExplanation';
        container.appendChild(desc);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '10px';
        actions.style.flexWrap = 'wrap';

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh now';
        refreshBtn.dataset.ftFirstRunI18n = 'firstRun.refreshNow';
        refreshBtn.style.flex = '1 1 auto';
        refreshBtn.style.background = palette.accent;
        refreshBtn.style.color = palette.buttonText;
        refreshBtn.style.border = 'none';
        refreshBtn.style.borderRadius = '999px';
        refreshBtn.style.padding = '10px 16px';
        refreshBtn.style.fontWeight = '600';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.boxShadow = '0 12px 28px rgba(192,57,43,0.25)';
        refreshBtn.onclick = () => {
            markComplete();
            window.location.reload();
        };

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Not now';
        dismissBtn.dataset.ftFirstRunI18n = 'firstRun.notNow';
        dismissBtn.style.flex = '0 0 auto';
        dismissBtn.style.border = `1px solid ${palette.border}`;
        dismissBtn.style.borderRadius = '999px';
        dismissBtn.style.padding = '10px 16px';
        dismissBtn.style.fontWeight = '600';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.style.background = palette.secondaryBg;
        dismissBtn.style.color = palette.text;
        dismissBtn.onclick = () => {
            markComplete();
            container.classList.add('ft-first-run-closing');
            setTimeout(() => container.remove(), 180);
        };

        actions.appendChild(refreshBtn);
        actions.appendChild(dismissBtn);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Dismiss');
        closeBtn.dataset.ftFirstRunI18nAria = 'firstRun.dismiss';
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '8px';
        closeBtn.style.right = '12px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = palette.subtext;
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            markComplete();
            container.classList.add('ft-first-run-closing');
            setTimeout(() => container.remove(), 180);
        };

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ft-first-run-fade {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #${PROMPT_ID}.ft-first-run-closing {
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 180ms ease, transform 180ms ease;
            }
            @media (max-width: 600px) {
                #${PROMPT_ID} {
                    left: 12px;
                    right: 12px;
                    width: auto;
                }
            }
        `;

        container.appendChild(actions);
        container.appendChild(closeBtn);
        document.head.appendChild(style);
        document.body.appendChild(container);
        void localizePrompt(container);
    }

    function markComplete() {
        dismissed = true;
        api.runtime.sendMessage({ action: 'FilterTube_FirstRunComplete' });
    }

    function init() {
        api.runtime.sendMessage({ action: 'FilterTube_FirstRunCheck' }, (resp) => {
            if (resp && resp.needed) {
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    createPrompt();
                } else {
                    document.addEventListener('DOMContentLoaded', createPrompt, { once: true });
                }
            }
        });
    }

    init();
})();
