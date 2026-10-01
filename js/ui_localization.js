/* Bundled, local-only interface copy. Video metadata and saved rules are not localized. */
(function installFilterTubeUiLocalization(root) {
    'use strict';
    if (!root || root.FilterTubeUiLocalization) return;

    const runtimeAPI = globalThis.browser || globalThis.chrome;
    const CATALOG_PATH = 'data/ui_locales/';
    // Supported locally; publication and fluent-speaker review are separate gates.
    const RELEASED_LOCALES = Object.freeze([
        'en', 'zh-Hans', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'id', 'ur', 'ru',
        'de', 'ja', 'pcm', 'arz', 'mr', 'vi', 'te', 'sw', 'ha', 'tr',
        'pa-Arab', 'fil', 'ta', 'yue-Hant', 'wuu-Hans', 'fa', 'ko',
        'am', 'th', 'jv', 'it', 'gu', 'kn', 'apc', 'apd', 'yo', 'bho'
    ]);
    const STAGED_LOCALES = Object.freeze([]);
    const RTL_LANGUAGES = new Set(['ar', 'arz', 'apc', 'apd', 'fa', 'ur', 'pa']);
    const catalogs = new Map();
    const inFlight = new Map();
    const staticCatalogs = new Map();
    const staticCaptures = [];
    let activeLocale = 'en';
    let selectionRevision = 0;

    function normalizeLocale(value) {
        const code = String(value || '').trim().replace(/_/g, '-');
        if (!/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(code)) return 'en';
        try {
            return Intl.getCanonicalLocales(code)[0];
        } catch (_) {
            return 'en';
        }
    }

    function matchLocale(value, available, fallback = 'en') {
        const requested = normalizeLocale(value);
        const candidates = [requested];
        try {
            candidates.push(new Intl.Locale(requested).maximize().toString());
        } catch (_) {
            // Some older browser builds lack Locale.maximize.
        }
        for (const candidate of candidates) {
            const parts = candidate.split('-');
            while (parts.length) {
                const prefix = parts.join('-');
                const matched = available.find(locale => locale.toLowerCase() === prefix.toLowerCase());
                if (matched) return matched;
                parts.pop();
            }
        }
        return fallback;
    }

    function releaseLocale(value) {
        return matchLocale(value, RELEASED_LOCALES);
    }

    async function loadCatalog(value, options = {}) {
        const locale = matchLocale(value, options.allowStaged === true
            ? [...RELEASED_LOCALES, ...STAGED_LOCALES] : RELEASED_LOCALES, null);
        if (!locale) throw new Error(`FilterTube UI locale is not released: ${value}`);
        if (catalogs.has(locale)) return catalogs.get(locale);
        if (inFlight.has(locale)) return inFlight.get(locale);
        const resource = runtimeAPI?.runtime?.getURL?.(`${CATALOG_PATH}${locale}.json`);
        if (!resource) throw new Error('FilterTube UI catalog URL is unavailable');
        const pending = fetch(resource).then(response => {
            if (!response.ok) throw new Error(`FilterTube UI catalog could not load: ${locale}`);
            return response.json();
        }).then(catalog => {
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
                throw new Error(`Invalid FilterTube UI catalog: ${locale}`);
            }
            catalogs.set(locale, catalog);
            return catalog;
        }).finally(() => inFlight.delete(locale));
        inFlight.set(locale, pending);
        return pending;
    }

    async function loadStaticCatalog(locale) {
        if (locale === 'en' || staticCatalogs.has(locale)) return staticCatalogs.get(locale) || null;
        const resource = runtimeAPI?.runtime?.getURL?.(`${CATALOG_PATH}${locale}_static.json`);
        if (!resource) return null;
        try {
            const response = await fetch(resource);
            if (!response.ok) {
                staticCatalogs.set(locale, null);
                return null;
            }
            const catalog = await response.json();
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
                staticCatalogs.set(locale, null);
                return null;
            }
            staticCatalogs.set(locale, catalog);
            return catalog;
        } catch (_) {
            staticCatalogs.set(locale, null);
            return null;
        }
    }

    function captureStatic(container = root.document?.body) {
        if (!container || staticCaptures.length || !root.document?.createTreeWalker) return;
        const blocked = 'script, style, svg, noscript, [data-ft-i18n]';
        const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
        const walker = root.document.createTreeWalker(container, 4);
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentElement?.closest?.(blocked)) continue;
            const source = normalize(node.nodeValue);
            if (source) staticCaptures.push({ node, kind: 'text', source, lastApplied: null });
        }
        for (const element of container.querySelectorAll?.('*') || []) {
            if (element.closest?.('script, style, svg, noscript')) continue;
            for (const attribute of ['title', 'placeholder', 'aria-label', 'alt']) {
                if (element.hasAttribute?.(`data-ft-i18n-${attribute}`)) continue;
                const source = normalize(element.getAttribute?.(attribute));
                if (source) staticCaptures.push({ node: element, kind: attribute, source, lastApplied: null });
            }
        }
    }

    function applyStatic() {
        const translations = staticCatalogs.get(activeLocale) || {};
        for (const item of staticCaptures) {
            if (!item.node.isConnected) continue;
            const current = item.kind === 'text' ? item.node.nodeValue : item.node.getAttribute(item.kind);
            const normalized = String(current || '').replace(/\s+/g, ' ').trim();
            if (normalized !== item.source && normalized !== item.lastApplied) continue;
            const translated = translations[item.source];
            const next = typeof translated === 'string' && translated.trim() ? translated : item.source;
            if (item.kind === 'text') {
                const leading = (current.match(/^\s*/) || [''])[0];
                const trailing = (current.match(/\s*$/) || [''])[0];
                item.node.nodeValue = `${leading}${next}${trailing}`;
            } else {
                item.node.setAttribute(item.kind, next);
            }
            item.lastApplied = next;
        }
    }

    function interpolate(template, values = {}) {
        return String(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) =>
            Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match);
    }

    function text(key, values = {}) {
        const english = catalogs.get('en')?.[key];
        if (typeof english !== 'string') throw new Error(`Missing English FilterTube UI key: ${key}`);
        const translated = catalogs.get(activeLocale)?.[key];
        return interpolate(typeof translated === 'string' ? translated : english, values);
    }

    async function select(value, options = {}) {
        const revision = ++selectionRevision;
        const locale = options.allowStaged === true
            ? matchLocale(value, [...RELEASED_LOCALES, ...STAGED_LOCALES]) : releaseLocale(value);
        await loadCatalog('en');
        if (locale !== 'en') await loadCatalog(locale, options);
        if (locale !== 'en') await loadStaticCatalog(locale);
        if (revision === selectionRevision) activeLocale = locale;
        return revision === selectionRevision ? locale : activeLocale;
    }

    function apply(container = root.document) {
        // Controllers can create keyed controls on DOMContentLoaded while the
        // async boot path is still loading the bundled English catalog.
        // Leave those nodes untouched for now; boot reapplies after selection.
        if (!catalogs.has('en')) return;
        for (const node of container?.querySelectorAll?.('[data-ft-i18n]') || []) {
            const key = node.getAttribute('data-ft-i18n');
            if (key) node.textContent = text(key);
        }
        for (const attribute of ['title', 'placeholder', 'aria-label']) {
            for (const node of container?.querySelectorAll?.(`[data-ft-i18n-${attribute}]`) || []) {
                const key = node.getAttribute(`data-ft-i18n-${attribute}`);
                if (key) node.setAttribute(attribute, text(key));
            }
        }
        applyStatic();
        if (container === root.document && root.document?.documentElement) {
            root.document.documentElement.lang = activeLocale;
            root.document.documentElement.dir = RTL_LANGUAGES.has(activeLocale.split('-')[0]) ? 'rtl' : 'ltr';
        }
    }

    root.FilterTubeUiLocalization = Object.freeze({
        releasedLocales: RELEASED_LOCALES,
        stagedLocales: STAGED_LOCALES,
        loadCatalog, select, text, apply, captureStatic,
        get locale() { return activeLocale; }
    });
})(typeof window !== 'undefined' ? window : globalThis);
