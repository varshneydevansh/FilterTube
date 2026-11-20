// "Parent sent an update" banner (SEAMLESS_SYNC_SPEC.md §7).
// The background worker applies a parent's update to ftProfilesV4 (the page re-filters in place
// through bridge_settings.js) and writes a short-lived notice. This script only shows it: it never
// reads filters, never reloads the page and needs no extra permission.
(function managedUpdateBanner(root) {
    'use strict';
    const NOTICE_KEY = 'ftManagedUpdateNotice';
    const NOTICE_SCHEMA = 'filtertube_managed_update_notice';
    const BANNER_ID = 'ft-managed-update-banner';
    const SHOW_MS = 6000;
    // A result that lands while no YouTube tab is on screen shows on the next visit if it is
    // under 2 minutes old (§7), once, in one tab.
    const MAX_AGE_MS = 2 * 60 * 1000;
    const RTL = /^(ar|arz|apc|apd|fa|ur|pa-Arab)(-|$)/;

    /** A notice worth showing now, or null. Pure, so tests can call it. */
    function readableNotice(raw, nowMs = Date.now()) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
        if (raw.schema !== NOTICE_SCHEMA || raw.version !== 1) return null;
        const id = typeof raw.id === 'string' ? raw.id.trim() : '';
        const createdAt = Number(raw.createdAt);
        const expiresAt = Number(raw.expiresAt);
        if (!id || id.length > 200 || !Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) return null;
        if (raw.seen === true || nowMs - createdAt > MAX_AGE_MS || createdAt - nowMs > 60 * 1000) return null;
        const profileName = typeof raw.profileName === 'string' ? raw.profileName.trim().slice(0, 80) : '';
        return { id, createdAt, expiresAt, activeChanged: raw.activeChanged !== false || !profileName, profileName };
    }

    /** The two lines for a notice, from a ui_locales catalog (English when missing). */
    function bannerText(notice, catalog = {}) {
        const text = (key, fallback) => (typeof catalog[key] === 'string' && catalog[key].trim() ? catalog[key] : fallback);
        const title = notice.activeChanged
            ? text('content.managedUpdate.title', 'Parent sent an update')
            : text('content.managedUpdate.otherProfile', 'Rules updated for {profile}').replace('{profile}', notice.profileName);
        return { title, body: text('content.managedUpdate.body', 'Your filters are up to date.') };
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { NOTICE_KEY, NOTICE_SCHEMA, readableNotice, bannerText };
        return;
    }
    if (root.top !== root) return;
    const api = (typeof browserAPI_BRIDGE !== 'undefined' && browserAPI_BRIDGE.storage)
        ? browserAPI_BRIDGE
        : (typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null));
    if (!api?.storage?.local || !api.storage.onChanged) return;

    let shownId = '';
    let hideTimer = null;

    const promiseApi = typeof browser !== 'undefined' && api === browser;
    function storageGet(keys) {
        return new Promise(resolve => {
            try {
                if (promiseApi) { api.storage.local.get(keys).then(value => resolve(value || {}), () => resolve({})); return; }
                api.storage.local.get(keys, value => resolve(value || {}));
            } catch (_) { resolve({}); }
        });
    }

    async function loadCatalog() {
        try {
            const stored = await storageGet(['ftUiLocalePreference']);
            const preference = typeof stored.ftUiLocalePreference === 'string' ? stored.ftUiLocalePreference : 'auto';
            let locale = preference;
            if (preference === 'auto') {
                const released = root.FilterTubeUiLocalization?.releasedLocales;
                const requested = String(root.navigator?.language || 'en').replace(/_/g, '-');
                const base = requested.split('-')[0];
                const list = Array.isArray(released) ? released : [];
                locale = list.includes(requested) ? requested : (list.find(code => code.split('-')[0] === base) || base);
            }
            if (typeof locale !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(locale) || locale === 'en') {
                return { locale: 'en', catalog: {} };
            }
            const response = await fetch(api.runtime.getURL(`data/ui_locales/${locale}.json`));
            if (!response.ok) return { locale: 'en', catalog: {} };
            return { locale, catalog: await response.json() };
        } catch (_) {
            return { locale: 'en', catalog: {} };
        }
    }

    function hide() {
        clearTimeout(hideTimer);
        const existing = document.getElementById(BANNER_ID);
        if (!existing) return;
        existing.style.opacity = '0';
        existing.style.transform = 'translateY(-6px)';
        setTimeout(() => existing.remove(), 180);
    }

    async function show(notice) {
        if (!notice || notice.id === shownId) return;
        shownId = notice.id;
        const { locale, catalog } = await loadCatalog();
        if (!document.body) return;
        document.getElementById(BANNER_ID)?.remove();
        const dark = root.matchMedia?.('(prefers-color-scheme: dark)').matches
            || document.documentElement.hasAttribute('dark');
        const banner = document.createElement('div');
        banner.id = BANNER_ID;
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.dir = RTL.test(locale) ? 'rtl' : 'ltr';
        Object.assign(banner.style, {
            position: 'fixed', zIndex: '2147483646', top: '16px', left: '50%',
            transform: 'translate(-50%, -6px)', opacity: '0', maxWidth: 'min(420px, calc(100vw - 24px))',
            boxSizing: 'border-box', padding: '10px 14px', borderRadius: '12px',
            fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', lineHeight: '1.35',
            background: dark ? '#212121' : '#FFFFFF', color: dark ? '#F1F1F1' : '#0F0F0F',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', pointerEvents: 'auto',
            transition: 'opacity 180ms ease, transform 180ms ease'
        });
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        const lines = bannerText(notice, catalog);
        title.textContent = lines.title;
        const body = document.createElement('div');
        body.style.opacity = '0.8';
        body.style.fontSize = '13px';
        body.textContent = lines.body;
        banner.append(title, body);
        banner.addEventListener('click', hide);
        document.body.appendChild(banner);
        const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduced) banner.style.transition = 'none';
        requestAnimationFrame(() => {
            banner.style.opacity = '1';
            banner.style.transform = 'translate(-50%, 0)';
        });
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, SHOW_MS);
        // Shown once: other tabs and later visits skip it.
        try {
            const pending = api.storage.local.set({ [NOTICE_KEY]: { ...notice.raw, seen: true } });
            if (pending && typeof pending.catch === 'function') pending.catch(() => {});
        } catch (_) {}
    }

    async function showIfFresh() {
        if (document.visibilityState !== 'visible') return;
        const stored = await storageGet([NOTICE_KEY]);
        const notice = readableNotice(stored[NOTICE_KEY]);
        if (notice) void show({ ...notice, raw: stored[NOTICE_KEY] });
    }

    api.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes?.[NOTICE_KEY]) return;
        // Only the tab that is on screen shows it; a hidden tab picks it up when it comes back.
        if (readableNotice(changes[NOTICE_KEY].newValue)) void showIfFresh();
    });
    document.addEventListener('visibilitychange', () => { void showIfFresh(); });

    // Courier frame (SEAMLESS_SYNC_SPEC.md §3). Chrome's background worker has no WebRTC, so on its
    // request this page hosts a hidden extension frame for one delivery and removes it after. The
    // frame is an extension page: this YouTube page cannot read it, and it carries sealed items only.
    const COURIER_PREFIX = 'ft-managed-courier-';
    const courierTimers = new Map();
    function unmountCourier(jobId) {
        clearTimeout(courierTimers.get(jobId));
        courierTimers.delete(jobId);
        document.getElementById(COURIER_PREFIX + jobId)?.remove();
    }
    api.runtime?.onMessage?.addListener((message, sender) => {
        if (sender?.id !== api.runtime.id || sender.tab) return false;
        const jobId = typeof message?.jobId === 'string' && /^[a-z2-7]{26}$/.test(message.jobId) ? message.jobId : '';
        if (!jobId) return false;
        if (message.action === 'FilterTube_CourierUnmount') unmountCourier(jobId);
        if (message.action === 'FilterTube_CourierMount' && !document.getElementById(COURIER_PREFIX + jobId)) {
            const frame = document.createElement('iframe');
            frame.id = COURIER_PREFIX + jobId;
            frame.src = `${api.runtime.getURL('html/managed_courier.html')}#${jobId}`;
            frame.setAttribute('aria-hidden', 'true');
            frame.tabIndex = -1;
            Object.assign(frame.style, { display: 'none', width: '0', height: '0', border: '0' });
            (document.body || document.documentElement).appendChild(frame);
            courierTimers.set(jobId, setTimeout(() => unmountCourier(jobId), 60 * 1000));
        }
        return false;
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void showIfFresh(); }, { once: true });
    else void showIfFresh();
})(typeof window !== 'undefined' ? window : globalThis);
