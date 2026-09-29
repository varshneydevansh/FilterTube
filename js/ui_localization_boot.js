/* Device-local interface preference; never changes video-language rules or profile data. */
(function bootFilterTubeUiLocalization(root) {
    'use strict';
    const ui = root.FilterTubeUiLocalization;
    if (!ui) return;

    const api = root.browser || root.chrome;
    const storage = api?.storage?.local;
    const preferenceKey = 'ftUiLocalePreference';
    const selector = root.document?.getElementById?.('ftInterfaceLanguage');
    let activationRevision = 0;
    let preferenceWriteQueue = Promise.resolve();

    function storageCall(method, payload, fallback) {
        return new Promise(resolve => {
            if (!storage?.[method]) return resolve(fallback);
            let settled = false;
            const finish = result => {
                if (settled) return;
                settled = true;
                resolve(result);
            };
            try {
                const pending = storage[method](payload, finish);
                if (pending?.then) pending.then(finish, () => finish(fallback));
            } catch (_) {
                try {
                    Promise.resolve(storage[method](payload)).then(finish, () => finish(fallback));
                } catch (_) {
                    finish(fallback);
                }
            }
        });
    }

    async function populateSelector() {
        if (!selector) return;
        let targets;
        try {
            const url = api?.runtime?.getURL?.('data/ui_locales/targets.json');
            if (url) {
                const response = await fetch(url);
                if (response.ok) targets = await response.json();
            }
        } catch (_) {
            // Locale choices remain available when target metadata cannot load.
        }
        const displayNames = typeof Intl?.DisplayNames === 'function'
            ? new Intl.DisplayNames([root.navigator?.language || 'en'], { type: 'language' })
            : null;
        for (const locale of [...ui.releasedLocales, ...ui.stagedLocales]) {
            if (locale === 'en' || [...selector.options].some(option => option.value === locale)) continue;
            const entry = targets?.locales?.find(item => item.code === locale);
            const option = root.document.createElement('option');
            option.value = locale;
            const name = entry?.name || displayNames?.of(locale) || locale;
            option.textContent = ui.releasedLocales.includes(locale) ? name : `${name} (preview)`;
            selector.appendChild(option);
        }
        const progress = root.document.getElementById('ftInterfaceLanguageProgress');
        if (progress && ui.releasedLocales.length === 1 + ui.stagedLocales.length) progress.hidden = true;
    }

    async function activate(preference, revision = ++activationRevision) {
        const requested = preference === 'auto' ? root.navigator?.language || 'en' : preference;
        await ui.select(requested, { allowStaged: preference !== 'auto' });
        if (revision !== activationRevision) return;
        ui.apply(root.document);
        announceLocale();
    }

    function announceLocale() {
        if (typeof root.CustomEvent === 'function') {
            root.dispatchEvent?.(new root.CustomEvent('filtertube-ui-locale-changed', { detail: { locale: ui.locale } }));
        }
    }

    async function start() {
        await populateSelector();
        const saved = await storageCall('get', [preferenceKey], {});
        const preference = typeof saved?.[preferenceKey] === 'string' ? saved[preferenceKey] : 'auto';
        if (selector) selector.value = [...selector.options].some(option => option.value === preference) ? preference : 'auto';
        await activate(preference);
        if (root.document?.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', () => {
                ui.apply(root.document);
                announceLocale();
            }, { once: true });
        }
        selector?.addEventListener('change', async () => {
            const revision = ++activationRevision;
            const next = selector.value;
            const pendingWrite = preferenceWriteQueue
                .catch(() => {})
                .then(() => storageCall('set', { [preferenceKey]: next }, undefined));
            preferenceWriteQueue = pendingWrite;
            await pendingWrite;
            if (revision !== activationRevision) return;
            await activate(next, revision);
        });
    }

    start().catch(() => ui.select('en').then(() => ui.apply(root.document)).catch(() => {}));
})(typeof window !== 'undefined' ? window : globalThis);
