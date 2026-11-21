// js/content/bridge_settings.js - Isolated World
//
// Settings sync extracted from `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.
//
// Responsibilities:
// - Receive UI/background refresh/apply requests via runtime messaging.
// - Pull compiled settings from background and forward to MAIN-world injector.
// - Apply settings to the Isolated World DOM fallback immediately.
//
// Depends on globals provided by earlier content scripts:
// - `browserAPI_BRIDGE`, `debugLog`, `currentSettings` (bridge_injection.js)
// - `applyDOMFallback` (dom_fallback.js)

if (!(window.pendingSubscriptionImportRequests instanceof Map)) {
    window.pendingSubscriptionImportRequests = new Map();
}
if (typeof window.subscriptionImportRequestId !== 'number' || !isFinite(window.subscriptionImportRequestId)) {
    window.subscriptionImportRequestId = 0;
}
if (typeof window.__filtertubeMainWorldImportBridgeReady !== 'boolean') {
    window.__filtertubeMainWorldImportBridgeReady = false;
}
if (typeof window.__filtertubeMainWorldSubscriptionsImportReady !== 'boolean') {
    window.__filtertubeMainWorldSubscriptionsImportReady = false;
}
if (!(window.__filtertubeMainWorldBridgeWaiters instanceof Set)) {
    window.__filtertubeMainWorldBridgeWaiters = new Set();
}
if (!(window.__filtertubeMainWorldImportCapabilityWaiters instanceof Set)) {
    window.__filtertubeMainWorldImportCapabilityWaiters = new Set();
}

function managedOverlayText(key, fallback, values = {}) {
    try {
        const localized = window.__filterTubeContentUiCopy?.text?.(key, fallback, values);
        if (typeof localized === 'string' && localized.trim()) return localized;
    } catch (_) {
    }
    return String(fallback).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
}

function markMainWorldImportBridgeReady() {
    window.__filtertubeMainWorldImportBridgeReady = true;
    if (!(window.__filtertubeMainWorldBridgeWaiters instanceof Set)) return;
    window.__filtertubeMainWorldBridgeWaiters.forEach((resolve) => {
        try {
            resolve(true);
        } catch (e) {
        }
    });
    window.__filtertubeMainWorldBridgeWaiters.clear();
}

function markMainWorldSubscriptionsImportReady() {
    window.__filtertubeMainWorldSubscriptionsImportReady = true;
    if (!(window.__filtertubeMainWorldImportCapabilityWaiters instanceof Set)) return;
    window.__filtertubeMainWorldImportCapabilityWaiters.forEach((resolve) => {
        try {
            resolve(true);
        } catch (e) {
        }
    });
    window.__filtertubeMainWorldImportCapabilityWaiters.clear();
}

function waitForMainWorldImportBridgeReady(timeoutMs = 4000) {
    if (window.__filtertubeMainWorldImportBridgeReady === true) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const waiters = window.__filtertubeMainWorldBridgeWaiters instanceof Set
            ? window.__filtertubeMainWorldBridgeWaiters
            : (window.__filtertubeMainWorldBridgeWaiters = new Set());

        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            waiters.delete(finish);
            resolve(value === true);
        };

        waiters.add(finish);
        setTimeout(() => finish(false), Math.max(250, timeoutMs));
    });
}

function waitForMainWorldSubscriptionsImportReady(timeoutMs = 4000) {
    if (window.__filtertubeMainWorldSubscriptionsImportReady === true) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const waiters = window.__filtertubeMainWorldImportCapabilityWaiters instanceof Set
            ? window.__filtertubeMainWorldImportCapabilityWaiters
            : (window.__filtertubeMainWorldImportCapabilityWaiters = new Set());

        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            waiters.delete(finish);
            resolve(value === true);
        };

        waiters.add(finish);
        setTimeout(() => finish(false), Math.max(250, timeoutMs));
    });
}

if (typeof globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld !== 'function') {
    const logSubscriptionImportDebug = (...args) => {
        try {
            const debugEnabled = !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
            if (debugEnabled) console.log(...args);
        } catch (e) {
            if (window.__filtertubeDebug) console.log(...args);
        }
    };

    globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld = function requestSubscribedChannelsFromMainWorld(options = {}, onProgress = null) {
        return new Promise((resolve) => {
            const requestId = ++window.subscriptionImportRequestId;
            const timeoutMs = Math.max(5000, Math.min(parseInt(options.timeoutMs, 10) || 60000, 120000));
            const maxChannels = Math.max(1, Math.min(parseInt(options.maxChannels, 10) || 5000, 5000));
            const pageDelayMs = Math.max(50, Math.min(parseInt(options.pageDelayMs, 10) || 140, 500));

            const armTimeout = () => setTimeout(() => {
                const pending = window.pendingSubscriptionImportRequests.get(requestId);
                if (pending) {
                    window.pendingSubscriptionImportRequests.delete(requestId);
                    logSubscriptionImportDebug('FilterTube: Subscription import request timed out');
                    resolve({ success: false, error: 'Subscription import timed out', errorCode: 'timeout', channels: [], stats: null });
                }
            }, timeoutMs);

            const pendingRequest = {
                resolve,
                timeoutId: armTimeout(),
                timeoutMs,
                onProgress: typeof onProgress === 'function' ? onProgress : null
            };

            window.pendingSubscriptionImportRequests.set(requestId, pendingRequest);

            window.postMessage({
                type: 'FilterTube_RequestSubscriptionImport',
                payload: {
                    requestId,
                    timeoutMs,
                    maxChannels,
                    pageDelayMs
                },
                source: 'content_bridge'
            }, '*');

            logSubscriptionImportDebug('FilterTube: Sent subscriptions import request to Main World');
        });
    };
}

if (!window.__filtertubeSubscriptionImportMessageListenerAttached) {
    window.__filtertubeSubscriptionImportMessageListenerAttached = true;
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const data = event.data || {};
        if (data.source !== 'injector') return;

        const type = data.type;
        const payload = data.payload || {};
        if (type === 'FilterTube_InjectorBridgeReady' || type === 'FilterTube_InjectorToBridge_Ready') {
            markMainWorldImportBridgeReady();
            return;
        }
        if (type === 'FilterTube_SubscriptionsImportBridgeReady') {
            markMainWorldSubscriptionsImportReady();
            return;
        }

        if (type === 'FilterTube_SubscriptionsImportProgress') {
            const { requestId } = payload || {};
            const pending = window.pendingSubscriptionImportRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timeoutId);
                pending.timeoutId = setTimeout(() => {
                    const latestPending = window.pendingSubscriptionImportRequests.get(requestId);
                    if (latestPending) {
                        window.pendingSubscriptionImportRequests.delete(requestId);
                        latestPending.resolve({ success: false, error: 'Subscription import timed out', errorCode: 'timeout', channels: [], stats: null });
                    }
                }, Math.max(5000, Math.min(parseInt(pending.timeoutMs, 10) || 60000, 120000)));
            }
            if (pending?.onProgress) {
                try {
                    pending.onProgress(payload || {});
                } catch (e) {
                }
            }
            return;
        }

        if (type === 'FilterTube_SubscriptionsImportResponse') {
            const { requestId } = payload || {};
            const pending = window.pendingSubscriptionImportRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timeoutId);
                window.pendingSubscriptionImportRequests.delete(requestId);
                pending.resolve(payload || { success: false, error: 'Unknown subscriptions import response', channels: [] });
            }
        }
    });
}

if (window.__filtertubeRuntimeBridgeListenerAttached !== true) {
    window.__filtertubeRuntimeBridgeListenerAttached = true;
    browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (!request) return;

        if (request.action === 'FilterTube_Ping') {
            (async () => {
                try {
                    if (request?.feature === 'subscriptions_import' && typeof injectMainWorldScripts === 'function') {
                        await injectMainWorldScripts();
                        await waitForMainWorldImportBridgeReady(4000);
                        await waitForMainWorldSubscriptionsImportReady(4000);
                    }
                } catch (e) {
                }

                sendResponse?.({
                    ok: window.__filtertubeMainWorldImportBridgeReady === true
                        && window.__filtertubeMainWorldSubscriptionsImportReady === true,
                    pathname: String(location?.pathname || ''),
                    href: String(location?.href || ''),
                    readyState: String(document?.readyState || '')
                });
            })();
            return true;
        } else if (request.action === 'FilterTube_RefreshNow') {
            debugLog('🔄 Refresh requested via runtime messaging');
            requestSettingsFromBackground({ forceRefresh: true }).then(result => {
                if (result?.success) {
                    applyDOMFallback(result.settings, { forceReprocess: true });
                    refreshRuntimeObserversAfterSettingsUpdate();
                }
            });
            sendResponse?.({ acknowledged: true });
        } else if (request.action === 'FilterTube_ImportSubscribedChannels') {
            (async () => {
                let injectionFailed = false;
                try {
                    if (typeof injectMainWorldScripts === 'function') {
                        await injectMainWorldScripts();
                    }
                } catch (e) {
                    injectionFailed = true;
                }

                const bridgeReady = await waitForMainWorldImportBridgeReady(4000);
                const subscriptionsImportReady = await waitForMainWorldSubscriptionsImportReady(4000);

                const importer = globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld;
                if (typeof importer !== 'function' || injectionFailed || !bridgeReady || !subscriptionsImportReady) {
                    sendResponse?.({
                        success: false,
                        error: 'subscriptions_import_unavailable',
                        errorCode: 'subscriptions_import_unavailable'
                    });
                    return;
                }

                importer(request || {}, (progress) => {
                    try {
                        browserAPI_BRIDGE.runtime.sendMessage({
                            action: 'FilterTube_SubscriptionsImportProgress',
                            requestId: request?.requestId || '',
                            sourceTabId: request?.sourceTabId || null,
                            progress: progress || {}
                        }, () => {
                            const err = browserAPI_BRIDGE.runtime?.lastError;
                            const errMessage = String(err?.message || '');
                            if (
                                err
                                && !/Receiving end does not exist/i.test(errMessage)
                                && !/The message port closed before a response was received/i.test(errMessage)
                            ) {
                                console.warn('FilterTube: Failed to relay subscriptions import progress', err.message || err);
                            }
                        });
                    } catch (e) {
                    }
                }).then((result) => {
                    sendResponse?.(result || { success: false, error: 'subscriptions_import_failed', channels: [] });
                }).catch((error) => {
                    sendResponse?.({ success: false, error: error?.message || 'subscriptions_import_failed', channels: [] });
                });
            })();

            return true;
        } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
            debugLog('⚡ Applying settings pushed from UI');
            try {
                const expectedProfile = (() => {
                    try {
                        const host = String(location?.hostname || '').toLowerCase();
                        return host.includes('youtubekids.com') ? 'kids' : 'main';
                    } catch (e) {
                        return 'main';
                    }
                })();

                const incomingProfile = request.settings?.profileType === 'kids'
                    ? 'kids'
                    : (request.settings?.profileType === 'main' ? 'main' : '');

                if (incomingProfile && incomingProfile !== expectedProfile) {
                    requestSettingsFromBackground().then(result => {
                        if (result?.success) {
                            applyDOMFallback(result.settings, { forceReprocess: true });
                        }
                    });
                    sendResponse?.({ acknowledged: true });
                    return;
                }
            } catch (e) {
            }

            const normalized = normalizeSettingsForHost(request.settings);
            sendSettingsToMainWorld(normalized);
            applyDOMFallback(normalized, { forceReprocess: true });
            sendResponse?.({ acknowledged: true });
        }
    });
}

let pendingSeedSettings = null;
let pendingSeedSettingsRevision = 0;
let mainWorldSettingsDispatchRevision = 0;
let seedListenerAttached = false;

function normalizeSettingsForHost(settings) {
    try {
        if (!settings || typeof settings !== 'object') return settings;
        const host = String(location?.hostname || '').toLowerCase();
        if (!host.includes('youtubekids.com')) return settings;
        const profile = settings.profileType === 'kids' ? 'kids' : (settings.profileType === 'main' ? 'main' : '');
        if (profile === 'kids') return settings;
        const listMode = settings.listMode === 'whitelist' ? 'whitelist' : 'blocklist';
        if (listMode !== 'whitelist') return settings;

        const wlChannels = Array.isArray(settings.whitelistChannels) ? settings.whitelistChannels.length : 0;
        const wlKeywords = Array.isArray(settings.whitelistKeywords) ? settings.whitelistKeywords.length : 0;
        if (wlChannels !== 0 || wlKeywords !== 0) return settings;

        const debugEnabled = (() => {
            try {
                return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
            } catch (e) {
                return !!window.__filtertubeDebug;
            }
        })();
        if (debugEnabled) {
            console.warn('[FilterTube] Forcing Kids whitelist(empty) -> blocklist for fail-open filtering.');
        }

        return { ...settings, listMode: 'blocklist' };
    } catch (e) {
        return settings;
    }
}

const MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID = 'filtertube-managed-viewing-route-gate';
const MANAGED_TIME_LIMIT_OVERLAY_ID = 'filtertube-managed-timeout-overlay';
const MANAGED_TIME_LIMIT_STATUS_ID = 'filtertube-managed-time-status';
const MANAGED_OVERLAY_STYLE_ID = 'filtertube-managed-overlay-styles';
const MANAGED_TIME_LIMIT_HEARTBEAT_MS = 5000;
const MANAGED_TIME_LIMIT_RESPONSE_TIMEOUT_MS = 7000;
const MANAGED_TIME_LIMIT_REVALIDATION_EVENTS = [
    'yt-navigate-finish',
    'yt-page-data-updated',
    'popstate',
    'hashchange',
    'visibilitychange',
    'focus',
    'blur'
];
let managedViewingRouteGateListenersAttached = false;
let managedViewingRouteGateHandler = null;
let managedTimeLimitHeartbeatTimer = 0;
let managedTimeLimitHeartbeatInFlight = false;
let managedTimeLimitPendingHeartbeat = false;
let managedTimeLimitHeartbeatRequest = null;
let managedTimeLimitListenersAttached = false;
let managedTimeLimitRouteHandler = null;
let managedTimeLimitRuntimeGeneration = 0;
let managedTimeLimitPolicyKey = '';
let managedTimeLimitParentRequestKey = '';

// This closure consumes extension-runtime replies only. Page messages and media
// metadata can neither publish nor extend a managed playback allowance.
const managedContentPlaybackPermit = (() => {
    const MAX_FRESHNESS_MS = 7000;
    let epoch = 0;
    let record = null;
    function clear(reason = 'managed_time_authority_changed') {
        epoch += 1;
        const hadPermit = Boolean(record);
        record = null;
        if (hadPermit) {
            try { window.FilterTubeContentPlayback?.invalidate?.(reason); } catch (_) {}
        }
    }
    function capture(settings, policy, href) {
        return { settings, profileId: settings?.activeProfileId, profileKind: settings?.activeProfileKind,
            profileType: settings?.profileType, policyKey: JSON.stringify(policy), href, epoch, startedAt: Date.now() };
    }
    function current(request) {
        try {
            return request && request.epoch === epoch && request.settings === currentSettings
                && request.profileId === currentSettings?.activeProfileId
                && request.profileKind === currentSettings?.activeProfileKind && request.profileType === currentSettings?.profileType
                && request.href === location.href
                && request.policyKey === JSON.stringify(getManagedTimeLimitPolicy(currentSettings));
        } catch (_) { return false; }
    }
    function publish(request, response) {
        try {
            if (!current(request)) return false;
            const policy = getManagedTimeLimitPolicy(currentSettings);
            const route = classifyManagedViewingRoute(request.href);
            const at = Date.now();
            const parsed = new URL(request.href);
            const id = parsed.pathname === '/watch' ? parsed.searchParams.get('v') : '';
            if (!policy || route.surface === 'external' || currentSettings.activeProfileId !== policy.profileId
                || !Number.isFinite(at) || !Number.isFinite(request.startedAt) || at < request.startedAt
                || !/^[a-zA-Z0-9_-]{11}$/.test(id || '')
                || response?.ok !== true || response.enforced !== true || response.timedOut !== false
                || response.requestPolicyMatched !== true || response.policySource !== 'compiled_active_profile'
                || response.profileId !== policy.profileId || response.surface !== route.surface
                || response.policyRevision !== policy.policyRevision || response.policyHash !== policy.policyHash
                || !Number.isFinite(response.remainingSeconds) || response.remainingSeconds <= 0) {
                clear(); return false;
            }
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: policy.timezone, year: 'numeric', month: '2-digit', day: '2-digit'
            });
            const dateKey = time => {
                const parts = formatter.formatToParts(new Date(time));
                return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
            };
            const day = dateKey(request.startedAt);
            if (dateKey(at) !== day || response.dateKey !== day) { clear(); return false; }
            let expiresAt = Math.min(request.startedAt + MAX_FRESHNESS_MS,
                request.startedAt + response.remainingSeconds * 1000);
            if (policy.validFrom != null && (!Number.isFinite(policy.validFrom) || at < policy.validFrom)) {
                clear(); return false;
            }
            for (const deadline of [policy.validUntil, policy.parentGrant?.enabled === true ? policy.parentGrant.expiresAt : null]) {
                if (deadline != null) {
                    if (!Number.isFinite(deadline)) { clear(); return false; }
                    expiresAt = Math.min(expiresAt, deadline);
                }
            }
            // A receipt from yesterday cannot authorize tomorrow's reset. Only
            // a new background heartbeat may publish the next day's budget.
            if (dateKey(expiresAt) !== day) {
                let low = request.startedAt, high = expiresAt;
                while (high - low > 1) {
                    const middle = Math.floor((low + high) / 2);
                    if (dateKey(middle) === day) low = middle; else high = middle;
                }
                expiresAt = high;
            }
            if (!Number.isFinite(expiresAt) || expiresAt <= at) { clear(); return false; }
            record = { request, receipt: Object.freeze({ decision: 'allowed', videoId: id,
                profileId: policy.profileId, policyRevision: policy.policyRevision,
                policyHash: policy.policyHash, surface: route.surface, expiresAt }) };
            queueMicrotask(() => window.FilterTubeContentPlayback?.refresh?.());
            return true;
        } catch (_) { clear(); return false; }
    }
    function read({ settings, videoId, href } = {}) {
        try {
            const at = Date.now();
            if (!record || settings !== currentSettings || href !== location.href
                || !current(record.request) || videoId !== record.receipt.videoId
                || !Number.isFinite(at) || at < record.request.startedAt || at >= record.receipt.expiresAt) return null;
            return record.receipt;
        } catch (_) { return null; }
    }
    for (const eventName of ['yt-navigate-start', 'popstate', 'hashchange', 'pagehide']) {
        try { window.addEventListener(eventName, () => clear('managed_time_navigation'), true); } catch (_) {}
    }
    return Object.freeze({ capture, current, publish, clear, read });
})();
window.FilterTubeManagedPlaybackPermit = Object.freeze({ read: managedContentPlaybackPermit.read });

function classifyManagedViewingRoute(rawUrl) {
    try {
        const parsed = new URL(rawUrl || location.href);
        const host = String(parsed.hostname || '').toLowerCase();
        if (host === 'youtubekids.com' || host.endsWith('.youtubekids.com')) {
            return { surface: 'kids', host };
        }
        if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
            return { surface: 'main', host };
        }
        return { surface: 'external', host };
    } catch (e) {
        return { surface: 'external', host: '' };
    }
}

function getManagedViewingRouteGatePolicy(settings) {
    try {
        if (!settings || typeof settings !== 'object') return null;
        if (settings.activeProfileKind !== 'child') return null;
        const policy = settings.managedViewingRouteGate;
        if (!policy || typeof policy !== 'object') return null;
        if (policy.schema !== 'filtertube_managed_viewing_space_route_gate') return null;
        if (policy.version !== 1) return null;
        if (typeof policy.allowMainViewing !== 'boolean') return null;
        if (typeof policy.allowKidsViewing !== 'boolean') return null;
        return policy;
    } catch (e) {
        return null;
    }
}

function removeManagedViewingBlockedOverlay() {
    try {
        globalThis.__filtertubeManagedViewingRouteDenied = false;
        document.documentElement?.removeAttribute?.('data-filtertube-managed-viewing-route-denied');
        const existing = document.getElementById(MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID);
        if (existing) existing.remove();
    } catch (e) {
    }
}

function openFilterTubeDashboardFromManagedOverlay(source, view = '') {
    try {
        pauseManagedTimeoutVideos();
    } catch (e) {
    }
    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: 'FilterTube_OpenDashboard',
            source: source || 'managed_overlay',
            view: view === 'sync' ? 'sync' : ''
        }, () => {
            try {
                pauseManagedTimeoutVideos();
            } catch (e) {
            }
        });
    } catch (e) {
    }
}

function getFilterTubeManagedOverlayHeroUrl() {
    try {
        const runtime = browserAPI_BRIDGE && browserAPI_BRIDGE.runtime;
        if (runtime && typeof runtime.getURL === 'function') {
            return runtime.getURL('assets/images/homepage_hero_day.mp4');
        }
    } catch (e) {
    }
    return '';
}

function ensureManagedOverlayStyles() {
    try {
        if (document.getElementById(MANAGED_OVERLAY_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = MANAGED_OVERLAY_STYLE_ID;
        style.textContent = `
            #${MANAGED_TIME_LIMIT_OVERLAY_ID},
            #${MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID} {
                --ftm-canvas: #f6f2eb; --ftm-paper: #fffcf6; --ftm-desk: #ece4d9; --ftm-ink: #1b1a18;
                --ftm-muted: #625f58; --ftm-line: #dcd1c2; --ftm-brick: #a93e31; --ftm-ledge: #7e2c22;
                --ftm-rose: #fae8e6; --ftm-on-brick: #fffaf4; --ftm-scrim: 255, 252, 246;
                position: fixed !important;
                inset: 0 !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                padding: clamp(14px, 3vw, 42px) !important;
                overflow: hidden !important;
                isolation: isolate !important;
                color: var(--ftm-ink) !important;
                font: 400 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
                letter-spacing: 0 !important;
                text-transform: none !important;
                pointer-events: auto !important;
                background: var(--ftm-canvas) !important;
            }
            #${MANAGED_TIME_LIMIT_OVERLAY_ID}[data-ftm-dark="true"],
            #${MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID}[data-ftm-dark="true"] {
                --ftm-canvas: #0b0f14; --ftm-paper: #151c24; --ftm-desk: #0b0f14; --ftm-ink: #edf2f7;
                --ftm-muted: #b8c3ce; --ftm-line: #2a3440; --ftm-brick: #e0796b; --ftm-ledge: #a5483c;
                --ftm-rose: #3a2422; --ftm-on-brick: #1b1110; --ftm-scrim: 21, 28, 36;
            }
            #${MANAGED_TIME_LIMIT_OVERLAY_ID} *,
            #${MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID} * { box-sizing: border-box !important; text-transform: none !important; }
            .filtertube-managed-overlay__media {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                opacity: 1 !important;
                filter: none !important;
                pointer-events: none !important;
            }
            /* The app's paper scrim over the theme video: 95 %, 85 %, 55 % from top-start to bottom-end. */
            .filtertube-managed-overlay__scrim {
                position: absolute !important;
                inset: 0 !important;
                pointer-events: none !important;
                background: linear-gradient(135deg, rgba(var(--ftm-scrim), .95), rgba(var(--ftm-scrim), .85) 50%, rgba(var(--ftm-scrim), .55)) !important;
            }
            /* A paper sheet with a second sheet peeking beneath, 20 px corners. */
            .filtertube-managed-overlay__panel {
                position: relative !important;
                z-index: 1 !important;
                width: min(480px, 100%) !important;
                max-height: calc(100dvh - clamp(28px, 6vw, 84px)) !important;
                overflow: auto !important;
                padding: 28px !important;
                border: 1.5px solid var(--ftm-line) !important;
                border-radius: 20px !important;
                background: var(--ftm-paper) !important;
                color: var(--ftm-ink) !important;
                box-shadow: 0 3px 0 var(--ftm-desk), 0 4px 0 var(--ftm-line), 0 30px 60px -40px rgba(27, 26, 24, .45) !important;
            }
            .filtertube-managed-overlay__panel--gate { text-align: center !important; }
            .filtertube-managed-overlay__panel--time {
                display: grid !important;
                grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr) !important;
                width: min(1040px, 100%) !important;
                padding: 0 !important;
            }
            .filtertube-managed-overlay__story {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                min-height: min(560px, 70dvh) !important;
                padding: clamp(28px, 5vw, 64px) !important;
            }
            .filtertube-managed-overlay__aside {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                padding: clamp(24px, 4vw, 48px) !important;
                border-left: 1.5px dashed var(--ftm-line) !important;
                background: transparent !important;
            }
            .filtertube-managed-overlay__pose {
                display: block !important;
                align-self: flex-start !important;
                height: 120px !important;
                width: auto !important;
                margin: 0 0 18px !important;
                pointer-events: none !important;
            }
            .filtertube-managed-overlay__panel--gate .filtertube-managed-overlay__pose { margin: 0 auto 14px !important; }
            .filtertube-managed-overlay__brand {
                display: inline-flex !important;
                align-items: center !important;
                align-self: flex-start !important;
                gap: 10px !important;
                margin-bottom: 22px !important;
                color: var(--ftm-ink) !important;
                font: 400 17px/1 "FilterTube Delius", system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__mark {
                width: 28px !important;
                height: 28px !important;
                object-fit: contain !important;
                border: 0 !important;
                background: none !important;
                box-shadow: none !important;
                padding: 0 !important;
            }
            .filtertube-managed-overlay__eyebrow {
                margin: 0 0 10px !important;
                color: var(--ftm-brick) !important;
                font: 600 14px/1.4 system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__title {
                max-width: 18ch !important;
                margin: 0 !important;
                color: var(--ftm-ink) !important;
                font: 400 clamp(30px, 4vw, 46px)/1.15 "FilterTube Delius", system-ui, sans-serif !important;
                letter-spacing: 0 !important;
            }
            .filtertube-managed-overlay__panel--gate .filtertube-managed-overlay__title { max-width: none !important; font-size: clamp(24px, 3vw, 30px) !important; }
            .filtertube-managed-overlay__lede {
                max-width: 560px !important;
                margin: 16px 0 0 !important;
                color: var(--ftm-muted) !important;
                font: 400 16px/1.6 system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__profile {
                display: inline-flex !important;
                align-items: center !important;
                align-self: flex-start !important;
                gap: 8px !important;
                margin-top: 22px !important;
                padding: 8px 14px !important;
                border: 1.5px solid var(--ftm-line) !important;
                border-radius: 999px !important;
                background: var(--ftm-desk) !important;
                color: var(--ftm-ink) !important;
                font: 600 13px/1.2 system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__facts { display: grid !important; gap: 0 !important; margin: 0 !important; }
            .filtertube-managed-overlay__fact {
                display: grid !important;
                grid-template-columns: 1fr auto !important;
                align-items: baseline !important;
                gap: 18px !important;
                margin: 0 !important;
                padding: 14px 2px !important;
                border-bottom: 1.5px dashed var(--ftm-line) !important;
            }
            .filtertube-managed-overlay__fact dt { margin: 0 !important; color: var(--ftm-muted) !important; font: 500 14px/1.4 system-ui, sans-serif !important; }
            .filtertube-managed-overlay__fact dd { margin: 0 !important; color: var(--ftm-ink) !important; font: 400 18px/1.2 "FilterTube Delius", system-ui, sans-serif !important; text-align: right !important; }
            .filtertube-managed-overlay__guidance {
                margin-top: 18px !important;
                padding: 14px 16px !important;
                border: 0 !important;
                border-radius: 16px !important;
                background: var(--ftm-rose) !important;
                color: var(--ftm-ink) !important;
                font: 400 14px/1.55 system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__actions { display: grid !important; gap: 12px !important; margin-top: 22px !important; }
            /* The app's pills: brick on a 3 px ledge (sinks when pressed); paper on a 2 px ledge. */
            .filtertube-managed-overlay__button {
                min-height: 52px !important;
                width: 100% !important;
                padding: 10px 20px !important;
                border: 1.5px solid var(--ftm-line) !important;
                border-radius: 999px !important;
                background: var(--ftm-paper) !important;
                color: var(--ftm-ink) !important;
                font: 600 15px/1.2 "FilterTube Outfit", "Outfit", system-ui, sans-serif !important;
                letter-spacing: 0 !important;
                cursor: pointer !important;
                box-shadow: 0 2px 0 var(--ftm-line) !important;
                transform: none !important;
                transition: transform 120ms ease, box-shadow 120ms ease !important;
            }
            .filtertube-managed-overlay__button:active { transform: translateY(2px) !important; box-shadow: 0 0 0 var(--ftm-line) !important; }
            .filtertube-managed-overlay__button:focus-visible { outline: 3px solid var(--ftm-brick) !important; outline-offset: 3px !important; }
            .filtertube-managed-overlay__button--primary {
                border-color: var(--ftm-brick) !important;
                background: var(--ftm-brick) !important;
                color: var(--ftm-on-brick) !important;
                box-shadow: 0 3px 0 var(--ftm-ledge) !important;
            }
            .filtertube-managed-overlay__button--primary:active { transform: translateY(3px) !important; box-shadow: 0 0 0 var(--ftm-ledge) !important; }
            .filtertube-managed-overlay__button:disabled { cursor: default !important; opacity: .7 !important; transform: none !important; }
            .filtertube-managed-overlay__instruction {
                display: none !important;
                margin: 0 !important;
                padding: 12px 14px !important;
                border: 1.5px solid var(--ftm-line) !important;
                border-radius: 16px !important;
                background: var(--ftm-desk) !important;
                color: var(--ftm-muted) !important;
                font: 400 13px/1.55 system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__instruction[data-visible="true"] { display: block !important; }
            .filtertube-managed-overlay__profiles { display: grid !important; gap: 8px !important; margin-top: 14px !important; }
            .filtertube-managed-overlay__profiles[hidden] { display: none !important; }
            .filtertube-managed-overlay__profile-option {
                display: grid !important;
                grid-template-columns: 34px minmax(0,1fr) auto !important;
                align-items: center !important;
                gap: 10px !important;
                width: 100% !important;
                min-height: 52px !important;
                padding: 8px 12px !important;
                border: 1.5px solid var(--ftm-line) !important;
                border-radius: 16px !important;
                background: var(--ftm-paper) !important;
                color: var(--ftm-ink) !important;
                cursor: pointer !important;
                text-align: start !important;
            }
            .filtertube-managed-overlay__profile-option:hover { border-color: var(--ftm-brick) !important; }
            .filtertube-managed-overlay__profile-avatar {
                display: grid !important;
                place-items: center !important;
                width: 34px !important;
                height: 34px !important;
                border-radius: 50% !important;
                background: var(--ftm-rose) !important;
                color: var(--ftm-brick) !important;
                font: 400 14px/1 "FilterTube Delius", system-ui, sans-serif !important;
            }
            .filtertube-managed-overlay__profile-meta { min-width: 0 !important; }
            .filtertube-managed-overlay__profile-name { display: block !important; font: 600 14px/1.3 system-ui, sans-serif !important; }
            .filtertube-managed-overlay__profile-type { display: block !important; margin-top: 2px !important; color: var(--ftm-muted) !important; font: 400 12px/1.3 system-ui, sans-serif !important; }
            .filtertube-managed-overlay__profile-lock { color: var(--ftm-brick) !important; font: 600 12px/1.3 system-ui, sans-serif !important; }
            @media (max-width: 760px) {
                .filtertube-managed-overlay__panel--time { grid-template-columns: 1fr !important; }
                .filtertube-managed-overlay__story { min-height: auto !important; padding: 28px 24px !important; }
                .filtertube-managed-overlay__aside { padding: 24px !important; border-left: 0 !important; border-top: 1.5px dashed var(--ftm-line) !important; }
                .filtertube-managed-overlay__pose { height: 96px !important; }
            }
            @media (prefers-reduced-motion: reduce) {
                .filtertube-managed-overlay__media { display: none !important; }
                .filtertube-managed-overlay__button { transition: none !important; }
            }
        `;
        (document.head || document.documentElement)?.appendChild(style);
    } catch (e) {
    }
}

function applyManagedOverlayShell(overlay) {
    if (!overlay) return;
    ensureManagedOverlayStyles();
    overlay.classList.add('filtertube-managed-overlay');
    // The paper look comes from the stylesheet; only the theme is decided here (the page's own).
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647';
    try {
        const visuals = globalThis.FilterTubeAdmissionOverlay;
        overlay.setAttribute('data-ftm-dark', visuals?.isDark?.() ? 'true' : 'false');
        visuals?.loadHand?.();
    } catch (e) {
    }
}

/** Kriti on the managed screens (BIBLE.md moments): null with the Companion Off. */
function createManagedOverlayPose(name, height = 120) {
    try {
        const visuals = globalThis.FilterTubeAdmissionOverlay;
        const pose = visuals?.pose?.(name, height);
        if (!pose) return null;
        pose.classList.add('filtertube-managed-overlay__pose');
        pose.style.removeProperty('max-width');
        if (visuals?.getCompanion?.() === 'lively') visuals.idle?.(pose);
        return pose;
    } catch (e) {
        return null;
    }
}

function appendManagedOverlayBackground(overlay) {
    if (!overlay) return;
    const heroUrl = getFilterTubeManagedOverlayHeroUrl();
    if (heroUrl) {
        const video = document.createElement('video');
        video.setAttribute('aria-hidden', 'true');
        video.setAttribute('data-filtertube-managed-overlay-background', 'true');
        video.className = 'filtertube-managed-overlay__media';
        video.muted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.src = heroUrl;
        overlay.appendChild(video);
    }
    const scrim = document.createElement('div');
    scrim.setAttribute('aria-hidden', 'true');
    scrim.className = 'filtertube-managed-overlay__scrim';
    overlay.appendChild(scrim);
}

function createManagedOverlayPanel(kind = '') {
    const panel = document.createElement('section');
    panel.className = `filtertube-managed-overlay__panel${kind ? ` filtertube-managed-overlay__panel--${kind}` : ''}`;
    return panel;
}

function showManagedViewingBlockedOverlay(decision) {
    try { if (typeof window !== 'undefined') window.FilterTubeContentPlayback?.invalidate?.('managed_route_denied'); } catch (_) {}
    try {
        globalThis.__filtertubeManagedViewingRouteDenied = true;
        document.documentElement?.setAttribute?.('data-filtertube-managed-viewing-route-denied', decision.surface || 'blocked');
        const host = document.body || document.documentElement;
        if (!host) return true;

        let overlay = document.getElementById(MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID;
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            applyManagedOverlayShell(overlay);
            host.appendChild(overlay);
        }

        const fallbackProfileName = managedOverlayText('managedOverlay.profile.this', 'This profile');
        const profileName = String(decision.profileName || fallbackProfileName).trim() || fallbackProfileName;
        const surfaceLabel = decision.surface === 'kids' ? managedOverlayText('family.commandCenter.surface.kids', 'Kids') : managedOverlayText('family.commandCenter.surface.main', 'Main');
        overlay.innerHTML = '';
        appendManagedOverlayBackground(overlay);

        const panel = createManagedOverlayPanel('gate');
        // Kriti points the way to the spaces this profile may use.
        const pose = createManagedOverlayPose('kriti_pose_08.webp', 120);

        const eyebrow = document.createElement('div');
        eyebrow.className = 'filtertube-managed-overlay__eyebrow';
        eyebrow.textContent = managedOverlayText('managedOverlay.blocked.eyebrow', 'FilterTube managed profile');

        const title = document.createElement('h1');
        title.className = 'filtertube-managed-overlay__title';
        title.textContent = managedOverlayText(
            'managedOverlay.blocked.title',
            '{surface} is not available for this profile',
            { surface: surfaceLabel }
        );

        const copy = document.createElement('p');
        copy.className = 'filtertube-managed-overlay__lede';
        copy.textContent = managedOverlayText(
            'managedOverlay.blocked.message',
            '{profileName} can use only the viewing spaces approved by the parent or caregiver profile.',
            { profileName }
        );

        const actions = document.createElement('div');
        actions.className = 'filtertube-managed-overlay__actions';
        const dashboardButton = document.createElement('button');
        dashboardButton.type = 'button';
        dashboardButton.className = 'filtertube-managed-overlay__button filtertube-managed-overlay__button--primary';
        dashboardButton.textContent = managedOverlayText('managedOverlay.openDashboard', 'Open FilterTube');
        dashboardButton.addEventListener('click', () => {
            openFilterTubeDashboardFromManagedOverlay('managed_viewing_route_gate');
        });
        actions.appendChild(dashboardButton);

        if (pose) panel.appendChild(pose);
        panel.append(eyebrow, title, copy, actions);
        overlay.appendChild(panel);
    } catch (e) {
    }
    return true;
}

function releaseManagedViewingRouteGateRevalidation() {
    if (!managedViewingRouteGateListenersAttached || !managedViewingRouteGateHandler) return;
    try {
        window.removeEventListener('yt-navigate-finish', managedViewingRouteGateHandler, true);
        window.removeEventListener('yt-page-data-updated', managedViewingRouteGateHandler, true);
        window.removeEventListener('popstate', managedViewingRouteGateHandler, true);
        window.removeEventListener('hashchange', managedViewingRouteGateHandler, true);
    } catch (e) {
    }
    managedViewingRouteGateListenersAttached = false;
    managedViewingRouteGateHandler = null;
}

function ensureManagedViewingRouteGateRevalidation() {
    if (managedViewingRouteGateListenersAttached) return;
    managedViewingRouteGateHandler = () => {
        try {
            applyManagedViewingRouteGate(currentSettings);
        } catch (e) {
        }
    };
    try {
        window.addEventListener('yt-navigate-finish', managedViewingRouteGateHandler, true);
        window.addEventListener('yt-page-data-updated', managedViewingRouteGateHandler, true);
        window.addEventListener('popstate', managedViewingRouteGateHandler, true);
        window.addEventListener('hashchange', managedViewingRouteGateHandler, true);
        managedViewingRouteGateListenersAttached = true;
    } catch (e) {
        managedViewingRouteGateListenersAttached = false;
        managedViewingRouteGateHandler = null;
    }
}

function applyManagedViewingRouteGate(settings) {
    try {
        const route = classifyManagedViewingRoute(location.href);
        if (route.surface === 'external') {
            releaseManagedViewingRouteGateRevalidation();
            removeManagedViewingBlockedOverlay();
            return false;
        }

        const policy = getManagedViewingRouteGatePolicy(settings);
        if (!policy) {
            releaseManagedViewingRouteGateRevalidation();
            removeManagedViewingBlockedOverlay();
            return false;
        }

        ensureManagedViewingRouteGateRevalidation();
        const decision = {
            surface: route.surface,
            profileName: policy.profileName || '',
            profileId: policy.profileId || '',
            reason: 'viewing_space_allowed'
        };

        if (policy.allowMainViewing !== true && policy.allowKidsViewing !== true) {
            decision.reason = 'no_viewing_spaces_parent_repair_required';
            return showManagedViewingBlockedOverlay(decision);
        }
        if (route.surface === 'main' && policy.allowMainViewing !== true) {
            decision.reason = 'main_viewing_space_denied';
            return showManagedViewingBlockedOverlay(decision);
        }
        if (route.surface === 'kids' && policy.allowKidsViewing !== true) {
            decision.reason = 'kids_viewing_space_denied';
            return showManagedViewingBlockedOverlay(decision);
        }

        removeManagedViewingBlockedOverlay();
        return false;
    } catch (e) {
        removeManagedViewingBlockedOverlay();
        return false;
    }
}

function normalizeManagedTimeLimitInteger(value) {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(num)) return null;
    return num >= 0 ? num : null;
}

function isValidManagedTimeLimitTimezone(timezone) {
    const value = typeof timezone === 'string' ? timezone.trim() : '';
    if (!value) return false;
    try {
        if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
            return value === 'UTC' || value === 'Etc/UTC';
        }
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
        return true;
    } catch (e) {
        return false;
    }
}

function getManagedTimeLimitPolicy(settings) {
    try {
        if (!settings || typeof settings !== 'object') return null;
        const policy = settings.managedTimeLimitPolicy;
        if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return null;
        if (policy.schema !== 'filtertube_managed_time_limit') return null;
        if (policy.version !== 1) return null;
        if (policy.enabled !== true) return null;
        if (!policy.profileId || typeof policy.profileId !== 'string') return null;
        if (!isValidManagedTimeLimitTimezone(policy.timezone)) return null;
        if (normalizeManagedTimeLimitInteger(policy.dailyBudgetSeconds) == null) return null;
        if (normalizeManagedTimeLimitInteger(policy.policyRevision) == null) return null;
        if (!policy.policyHash || typeof policy.policyHash !== 'string') return null;
        if (policy.countingMode !== 'active_youtube_tab') return null;
        if (policy.activeDeviceBudgetPolicy !== 'single_active_tab_no_double_count') return null;
        if (policy.resetPolicy !== 'policy_timezone_midnight') return null;
        return policy;
    } catch (e) {
        return null;
    }
}

function removeManagedTimeoutOverlay() {
    try {
        globalThis.__filtertubeManagedTimeLimitTimedOut = false;
        const existing = document.getElementById(MANAGED_TIME_LIMIT_OVERLAY_ID);
        if (existing) existing.remove();
    } catch (e) {
    }
}

function ensureManagedTimeoutPlayGuard() {
    if (globalThis.__filtertubeManagedTimeLimitPlayGuardInstalled === true) return;
    globalThis.__filtertubeManagedTimeLimitPlayGuardInstalled = true;
    try {
        document.addEventListener('play', event => {
            if (globalThis.__filtertubeManagedTimeLimitTimedOut !== true) return;
            const media = event?.target;
            if (String(media?.tagName || '').toLowerCase() !== 'video') return;
            if (media?.hasAttribute?.('data-filtertube-managed-overlay-background')) return;
            try {
                media.pause?.();
            } catch (e) {
            }
        }, true);
    } catch (e) {
    }
}

function pauseManagedTimeoutVideos() {
    try {
        document.querySelectorAll('video:not([data-filtertube-managed-overlay-background="true"])').forEach(video => {
            try {
                if (!video.paused) video.pause();
            } catch (e) {
            }
        });
    } catch (e) {
    }
}

function formatManagedTimeoutDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!total) return managedOverlayText('managedOverlay.duration.zeroMinutes', '0m');
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours && minutes) {
        return managedOverlayText('managedOverlay.duration.hoursMinutes', '{hours}h {minutes}m', { hours, minutes });
    }
    if (hours) return managedOverlayText('managedOverlay.duration.hours', '{hours}h', { hours });
    return managedOverlayText('managedOverlay.duration.minutes', '{minutes}m', { minutes: Math.max(1, minutes) });
}

function formatManagedTimeRemaining(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!total) return managedOverlayText('managedOverlay.duration.zeroSeconds', '0s');
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainder = total % 60;
    if (hours) return managedOverlayText('managedOverlay.duration.hoursMinutes', '{hours}h {minutes}m', { hours, minutes });
    if (minutes) {
        return managedOverlayText('managedOverlay.duration.minutesSeconds', '{minutes}m {seconds}s', {
            minutes,
            seconds: remainder
        });
    }
    return managedOverlayText('managedOverlay.duration.seconds', '{seconds}s', { seconds: remainder });
}

function removeManagedTimeLimitStatus() {
    try {
        const existing = document.getElementById(MANAGED_TIME_LIMIT_STATUS_ID);
        if (existing) existing.remove();
    } catch (e) {
    }
}

function showManagedTimeLimitStatus(state) {
    try {
        if (!state || state.enforced !== true || state.timedOut === true) {
            removeManagedTimeLimitStatus();
            return;
        }
        const remainingSeconds = Number(state.remainingSeconds);
        const totalBudgetSeconds = Number(state.totalBudgetSeconds);
        if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0 || !Number.isFinite(totalBudgetSeconds) || totalBudgetSeconds <= 0) {
            removeManagedTimeLimitStatus();
            return;
        }

        const host = document.body || document.documentElement;
        if (!host) return;

        let status = document.getElementById(MANAGED_TIME_LIMIT_STATUS_ID);
        if (!status) {
            status = document.createElement('div');
            status.id = MANAGED_TIME_LIMIT_STATUS_ID;
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            status.style.cssText = [
                'position:fixed',
                'right:16px',
                'bottom:16px',
                'z-index:2147483645',
                'max-width:calc(100vw - 32px)',
                'box-sizing:border-box',
                'display:flex',
                'align-items:center',
                'gap:8px',
                'padding:9px 12px',
                'border:1px solid rgba(180,67,57,.26)',
                'border-radius:8px',
                'background:rgba(17,24,39,.92)',
                'box-shadow:0 14px 34px rgba(15,23,42,.18)',
                'color:#f8fafc',
                'font-family:Roboto,Arial,sans-serif',
                'font-size:12px',
                'font-weight:800',
                'line-height:1.25',
                'pointer-events:none'
            ].join(';');
            host.appendChild(status);
        }

        const fallbackProfileName = managedOverlayText('managedOverlay.profile.protected', 'Protected profile');
        const profileName = String(state.profileName || fallbackProfileName).trim() || fallbackProfileName;
        const surfaceLabel = state.surface === 'kids' ? managedOverlayText('family.commandCenter.surface.kids', 'Kids') : managedOverlayText('family.commandCenter.surface.main', 'Main');
        const timeLeft = formatManagedTimeRemaining(remainingSeconds);
        status.textContent = managedOverlayText(
            'managedOverlay.timeRemaining.status',
            '{surface} time left: {timeLeft}',
            { surface: surfaceLabel, timeLeft }
        );
        status.title = managedOverlayText(
            'managedOverlay.timeRemaining.title',
            '{profileName} has {timeLeft} left today.',
            { profileName, timeLeft }
        );
    } catch (e) {
    }
}

function showManagedTimeoutOverlay(state) {
    try { if (typeof window !== 'undefined') window.FilterTubeContentPlayback?.invalidate?.('managed_time_denied'); } catch (_) {}
    try {
        globalThis.__filtertubeManagedTimeLimitTimedOut = true;
        ensureManagedTimeoutPlayGuard();
        removeManagedTimeLimitStatus();
        pauseManagedTimeoutVideos();

        const host = document.body || document.documentElement;
        if (!host) return;

        let overlay = document.getElementById(MANAGED_TIME_LIMIT_OVERLAY_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = MANAGED_TIME_LIMIT_OVERLAY_ID;
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'filtertube-managed-timeout-title');
            overlay.tabIndex = -1;
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'z-index:2147483647',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'padding:24px',
                'background:linear-gradient(180deg,#dcebf4 0%,#edf5f1 52%,#f7f4ec 100%)',
                'color:#f8fafc',
                'font-family:Roboto,Arial,sans-serif',
                'pointer-events:auto',
                'overflow:hidden'
            ].join(';');
            applyManagedOverlayShell(overlay);
            host.appendChild(overlay);
        }

        const fallbackProfileName = managedOverlayText('managedOverlay.profile.this', 'This profile');
        const profileName = String(state?.profileName || fallbackProfileName).trim() || fallbackProfileName;
        const surfaceLabel = state?.surface === 'kids' ? managedOverlayText('family.commandCenter.surface.kids', 'Kids') : managedOverlayText('family.commandCenter.surface.main', 'Main');
        const timezone = String(state?.timezone || '').trim();
        const resetCopy = timezone
            ? managedOverlayText('managedOverlay.reset.midnight', 'Resets at midnight ({timezone}).', { timezone })
            : managedOverlayText('managedOverlay.reset.nextDaily', 'Resets at the next daily policy reset.');
        const totalBudgetCopy = formatManagedTimeoutDuration(state?.totalBudgetSeconds);
        const usedCopy = formatManagedTimeoutDuration(state?.consumedSeconds);
        const policyExpired = state?.reason === 'expired_policy_requires_parent_revalidation';
        const stateKey = [
            String(state?.profileId || ''),
            String(state?.surface || ''),
            String(state?.reason || ''),
            String(state?.dateKey || ''),
            String(state?.policyRevision || ''),
            String(state?.policyHash || ''),
            String(state?.totalBudgetSeconds || 0),
            String(state?.consumedSeconds || 0)
        ].join(':');
        if (overlay.getAttribute('data-filtertube-managed-state-key') === stateKey && overlay.childElementCount > 0) {
            return;
        }
        overlay.setAttribute('data-filtertube-managed-state-key', stateKey);
        overlay.innerHTML = '';
        appendManagedOverlayBackground(overlay);

        const panel = createManagedOverlayPanel('time');

        const story = document.createElement('div');
        story.className = 'filtertube-managed-overlay__story';

        const brand = document.createElement('div');
        brand.className = 'filtertube-managed-overlay__brand';
        const brandMark = document.createElement('img');
        brandMark.className = 'filtertube-managed-overlay__mark';
        brandMark.alt = 'FilterTube';
        brandMark.src = browserAPI_BRIDGE.runtime.getURL('icons/icon-48.png');
        const brandText = document.createElement('span');
        brandText.textContent = managedOverlayText('managedOverlay.brand.time', 'FilterTube · profile time');
        brand.append(brandMark, brandText);

        const eyebrow = document.createElement('div');
        eyebrow.className = 'filtertube-managed-overlay__eyebrow';
        eyebrow.textContent = policyExpired
            ? managedOverlayText('managedOverlay.timeout.eyebrow.parentReview', 'Parent review needed')
            : managedOverlayText('managedOverlay.timeout.eyebrow.dailyPause', 'Daily pause reached');

        const title = document.createElement('h1');
        title.id = 'filtertube-managed-timeout-title';
        title.className = 'filtertube-managed-overlay__title';
        title.textContent = policyExpired
            ? managedOverlayText(
                'managedOverlay.timeout.title.parentReview',
                '{surface} needs parent approval.',
                { surface: surfaceLabel }
            )
            : managedOverlayText('managedOverlay.timeout.title.dailyPause', "Today's watching time is complete.");

        const copy = document.createElement('p');
        copy.className = 'filtertube-managed-overlay__lede';
        copy.textContent = policyExpired
            ? managedOverlayText(
                'managedOverlay.timeout.copy.parentReview',
                '{profileName} needs a parent or caregiver to review this time rule before {surface} can continue.',
                { profileName, surface: surfaceLabel }
            )
            : managedOverlayText(
                'managedOverlay.timeout.copy.dailyPause',
                "{profileName} has used today's viewing time allowance. {surface} stays paused until the daily reset or until more time is approved.",
                { profileName, surface: surfaceLabel }
            );

        const profilePill = document.createElement('div');
        profilePill.className = 'filtertube-managed-overlay__profile';
        profilePill.textContent = managedOverlayText(
            'managedOverlay.timeout.profilePill',
            '{profileName} · {surface}',
            { profileName, surface: surfaceLabel }
        );

        // Kriti with her mug for the daily pause; thinking while a parent needs to review the rule.
        const pose = createManagedOverlayPose(policyExpired ? 'kriti_pose_03.webp' : 'kriti_mug_06.webp', 120);
        if (pose) story.appendChild(pose);
        story.append(brand, eyebrow, title, copy, profilePill);

        const aside = document.createElement('aside');
        aside.className = 'filtertube-managed-overlay__aside';

        const facts = document.createElement('dl');
        facts.className = 'filtertube-managed-overlay__facts';
        [
            [managedOverlayText('managedOverlay.timeout.fact.dailyLimit', 'Daily limit'), totalBudgetCopy],
            [managedOverlayText('managedOverlay.timeout.fact.usedToday', 'Used today'), usedCopy],
            [managedOverlayText('managedOverlay.timeout.fact.reset', 'Reset'), resetCopy]
        ].forEach(([label, value]) => {
            const fact = document.createElement('div');
            fact.className = 'filtertube-managed-overlay__fact';
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            dd.textContent = value;
            fact.append(dt, dd);
            facts.appendChild(fact);
        });

        const guidance = document.createElement('div');
        guidance.className = 'filtertube-managed-overlay__guidance';
        guidance.textContent = policyExpired
            ? managedOverlayText(
                'managedOverlay.timeout.guidance.parentReview',
                'Switch to a parent, caregiver, or another authorized profile. The exhausted profile cannot dismiss this screen or approve its own access.'
            )
            : managedOverlayText(
                'managedOverlay.timeout.guidance.dailyPause',
                'Switching profiles follows the normal PIN check. A request for more time is saved for parent review, but never unlocks this profile by itself.'
            );

        const actionArea = document.createElement('div');
        actionArea.className = 'filtertube-managed-overlay__actions';

        const profileSwitcher = document.createElement('div');
        profileSwitcher.className = 'filtertube-managed-overlay__profiles';
        profileSwitcher.hidden = true;

        const switchButton = document.createElement('button');
        switchButton.type = 'button';
        switchButton.className = 'filtertube-managed-overlay__button filtertube-managed-overlay__button--primary';
        switchButton.textContent = managedOverlayText('managedOverlay.switch.action', 'Switch profile');
        switchButton.addEventListener('click', () => {
            if (!profileSwitcher.hidden) {
                profileSwitcher.hidden = true;
                profileSwitcher.innerHTML = '';
                switchButton.textContent = managedOverlayText('managedOverlay.switch.action', 'Switch profile');
                return;
            }
            switchButton.disabled = true;
            switchButton.textContent = managedOverlayText('managedOverlay.switch.loading', 'Loading profiles…');
            browserAPI_BRIDGE.runtime.sendMessage({
                action: 'FilterTube_GetManagedProfileSwitchOptions'
            }, response => {
                switchButton.disabled = false;
                switchButton.textContent = managedOverlayText('managedOverlay.switch.cancel', 'Cancel profile switch');
                profileSwitcher.hidden = false;
                profileSwitcher.innerHTML = '';
                const options = Array.isArray(response?.options) ? response.options : [];
                if (!response?.ok || !options.length) {
                    const empty = document.createElement('p');
                    empty.className = 'filtertube-managed-overlay__instruction';
                    empty.setAttribute('data-visible', 'true');
                    empty.textContent = response?.ok
                        ? managedOverlayText('managedOverlay.switch.noOtherProfile', 'No other profile is available on this device.')
                        : managedOverlayText('managedOverlay.switch.loadFailed', 'Profiles could not be loaded. Keep this page open and try again.');
                    profileSwitcher.appendChild(empty);
                    return;
                }
                options.forEach(option => {
                    const optionButton = document.createElement('button');
                    optionButton.type = 'button';
                    optionButton.className = 'filtertube-managed-overlay__profile-option';
                    const avatar = document.createElement('span');
                    avatar.className = 'filtertube-managed-overlay__profile-avatar';
                    avatar.textContent = String(option.profileName || 'P').trim().charAt(0).toUpperCase() || 'P';
                    const meta = document.createElement('span');
                    meta.className = 'filtertube-managed-overlay__profile-meta';
                    const name = document.createElement('span');
                    name.className = 'filtertube-managed-overlay__profile-name';
                    name.textContent = option.profileName || managedOverlayText('managedOverlay.profile.generic', 'Profile');
                    const type = document.createElement('span');
                    type.className = 'filtertube-managed-overlay__profile-type';
                    type.textContent = option.type === 'child'
                        ? managedOverlayText('managedOverlay.profile.protected', 'Protected profile')
                        : managedOverlayText('managedOverlay.profile.account', 'Account profile');
                    meta.append(name, type);
                    const lock = document.createElement('span');
                    lock.className = 'filtertube-managed-overlay__profile-lock';
                    lock.textContent = option.requiresPin ? 'PIN' : managedOverlayText('managedOverlay.switch.open', 'Open');
                    optionButton.append(avatar, meta, lock);
                    optionButton.addEventListener('click', () => {
                        let pin = '';
                        if (option.requiresPin) {
                            const profileNameForPrompt = option.profileName
                                || managedOverlayText('managedOverlay.profile.genericLowercase', 'this profile');
                            pin = String(window.prompt(managedOverlayText(
                                'managedOverlay.switch.pinPrompt',
                                'Enter the PIN for {profileName}',
                                { profileName: profileNameForPrompt }
                            )) || '').trim();
                            if (!pin) return;
                        }
                        optionButton.disabled = true;
                        lock.textContent = managedOverlayText('managedOverlay.switch.switching', 'Switching…');
                        browserAPI_BRIDGE.runtime.sendMessage({
                            action: 'FilterTube_SwitchManagedProfile',
                            targetProfileId: option.profileId,
                            pin
                        }, result => {
                            if (result?.ok) {
                                const targetProfileName = result.profileName || option.profileName
                                    || managedOverlayText('managedOverlay.profile.genericLowercase', 'this profile');
                                instruction.textContent = managedOverlayText(
                                    'managedOverlay.switch.switchingTo',
                                    'Switching to {profileName}…',
                                    { profileName: targetProfileName }
                                );
                                instruction.setAttribute('data-visible', 'true');
                                profileSwitcher.querySelectorAll('button').forEach(button => { button.disabled = true; });
                                return;
                            }
                            optionButton.disabled = false;
                            lock.textContent = option.requiresPin ? 'PIN' : managedOverlayText('managedOverlay.switch.open', 'Open');
                            instruction.textContent = result?.reason === 'rate_limited'
                                ? managedOverlayText('managedOverlay.switch.pinRateLimited', 'Too many incorrect PIN attempts. Wait before trying again.')
                                : (result?.reason === 'incorrect_pin'
                                    ? managedOverlayText('managedOverlay.switch.pinIncorrect', 'That PIN was not correct.')
                                    : managedOverlayText('managedOverlay.switch.failed', 'Profile switch failed. Try again.'));
                            instruction.setAttribute('data-visible', 'true');
                        });
                    });
                    profileSwitcher.appendChild(optionButton);
                });
            });
        });

        const askButton = document.createElement('button');
        askButton.type = 'button';
        askButton.className = 'filtertube-managed-overlay__button';
        askButton.textContent = managedOverlayText('managedOverlay.request.action', 'Request more time');

        const instruction = document.createElement('p');
        instruction.className = 'filtertube-managed-overlay__instruction';
        instruction.textContent = managedOverlayText(
            'managedOverlay.request.initialInstruction',
            'Request saved here only tells the parent profile that more time is needed. It does not unlock viewing by itself.'
        );

        askButton.addEventListener('click', () => {
            instruction.setAttribute('data-visible', 'true');
            askButton.textContent = managedOverlayText('managedOverlay.request.sent', 'Request sent');
            askButton.disabled = true;
            pauseManagedTimeoutVideos();
            const requestKey = [
                String(state?.profileId || ''),
                String(state?.policyRevision || ''),
                String(state?.policyHash || ''),
                String(state?.dateKey || '')
            ].join(':');
            if (requestKey && requestKey !== managedTimeLimitParentRequestKey) {
                managedTimeLimitParentRequestKey = requestKey;
                try {
                    const policy = getManagedTimeLimitPolicy(currentSettings);
                    browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'FilterTube_ManagedTimeLimitParentRequest',
                        profileId: String(state?.profileId || ''),
                        policy,
                        href: location.href,
                        surface: state?.surface || classifyManagedViewingRoute(location.href).surface
                    }, response => {
                        const err = browserAPI_BRIDGE.runtime?.lastError;
                        if (!err && response?.ok === true) {
                            instruction.textContent = response.recorded === true
                                ? managedOverlayText(
                                    'managedOverlay.request.saved',
                                    'Request saved for parent review. Viewing stays paused until a parent or caregiver grants more time from FilterTube.'
                                )
                                : managedOverlayText(
                                    'managedOverlay.request.alreadySaved',
                                    'A recent request is already saved for parent review. Viewing stays paused until more time is granted from FilterTube.'
                                );
                        } else {
                            instruction.textContent = managedOverlayText(
                                'managedOverlay.request.unavailable',
                                'A parent or caregiver can still open FilterTube and grant more time from a trusted profile. This button did not unlock viewing.'
                            );
                        }
                        pauseManagedTimeoutVideos();
                    });
                } catch (e) {
                    instruction.textContent = managedOverlayText(
                        'managedOverlay.request.unavailable',
                        'A parent or caregiver can still open FilterTube and grant more time from a trusted profile. This button did not unlock viewing.'
                    );
                }
            }
        });
        actionArea.appendChild(switchButton);
        if (!policyExpired) actionArea.appendChild(askButton);

        aside.append(facts, guidance, profileSwitcher, actionArea, instruction);
        panel.append(story, aside);
        overlay.appendChild(panel);
        try {
            overlay.focus({ preventScroll: true });
        } catch (e) {
        }
    } catch (e) {
    }
}

function isManagedTimeLimitTabActive() {
    try {
        return document.visibilityState === 'visible' && document.hasFocus();
    } catch (e) {
        return false;
    }
}

function isManagedTimeLimitPlaybackActive() {
    try {
        return Array.from(document.querySelectorAll('video:not([data-filtertube-managed-overlay-background="true"])'))
            .some(video => video.paused !== true && video.ended !== true && Number(video.readyState) >= 2);
    } catch (e) {
        return false;
    }
}

function clearManagedTimeLimitHeartbeatTimer() {
    if (!managedTimeLimitHeartbeatTimer) return;
    try {
        clearInterval(managedTimeLimitHeartbeatTimer);
    } catch (e) {
    }
    managedTimeLimitHeartbeatTimer = 0;
}

function releaseManagedTimeLimitRuntime() {
    managedContentPlaybackPermit.clear('managed_time_runtime_released');
    managedTimeLimitRuntimeGeneration += 1;
    managedTimeLimitPolicyKey = '';
    managedTimeLimitParentRequestKey = '';
    clearManagedTimeLimitHeartbeatTimer();
    if (managedTimeLimitListenersAttached && managedTimeLimitRouteHandler) {
        try {
            for (const eventName of MANAGED_TIME_LIMIT_REVALIDATION_EVENTS) {
                window.removeEventListener(eventName, managedTimeLimitRouteHandler, true);
            }
        } catch (e) {
        }
    }
    managedTimeLimitListenersAttached = false;
    managedTimeLimitRouteHandler = null;
    managedTimeLimitHeartbeatInFlight = false;
    managedTimeLimitPendingHeartbeat = false;
    clearManagedTimeLimitHeartbeatRequest();
    removeManagedTimeLimitStatus();
    removeManagedTimeoutOverlay();
}

function ensureManagedTimeLimitRuntimeListeners() {
    if (!managedTimeLimitListenersAttached) {
        managedTimeLimitRouteHandler = () => {
            try {
                applyManagedTimeLimitRuntime(currentSettings, { immediate: true });
            } catch (e) {
            }
        };
        try {
            for (const eventName of MANAGED_TIME_LIMIT_REVALIDATION_EVENTS) {
                window.addEventListener(eventName, managedTimeLimitRouteHandler, true);
            }
            managedTimeLimitListenersAttached = true;
        } catch (e) {
            managedTimeLimitListenersAttached = false;
            managedTimeLimitRouteHandler = null;
        }
    }

    if (!managedTimeLimitHeartbeatTimer) {
        managedTimeLimitHeartbeatTimer = setInterval(() => {
            try {
                sendManagedTimeLimitHeartbeat();
            } catch (e) {
            }
        }, MANAGED_TIME_LIMIT_HEARTBEAT_MS);
    }
}

function clearManagedTimeLimitHeartbeatRequest() {
    if (managedTimeLimitHeartbeatRequest) clearTimeout(managedTimeLimitHeartbeatRequest.timer);
    managedTimeLimitHeartbeatRequest = null;
    managedTimeLimitHeartbeatInFlight = false;
    managedTimeLimitPendingHeartbeat = false;
}

function managedTimeLimitResponseMatches(request, response, policy, route) {
    const at = Date.now();
    if (!Number.isFinite(at) || at < request.startedAt || at - request.startedAt >= MANAGED_TIME_LIMIT_RESPONSE_TIMEOUT_MS
        || response?.ok !== true || response.enforced !== true || response.requestPolicyMatched !== true
        || response.policySource !== 'compiled_active_profile' || response.profileId !== policy.profileId
        || response.surface !== route.surface || response.policyRevision !== policy.policyRevision
        || response.policyHash !== policy.policyHash || typeof response.timedOut !== 'boolean'
        || !Number.isFinite(response.remainingSeconds) || response.remainingSeconds < 0
        || response.timedOut !== (response.remainingSeconds === 0)) return false;
    // An expired policy may deny access without a daily-usage row. Only a
    // current same-day budget response may remove an existing exhausted lock.
    if (response.timedOut && response.reason === 'expired_policy_requires_parent_revalidation'
        && Number.isFinite(policy.validUntil) && at > policy.validUntil) return true;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: policy.timezone, year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const day = value => {
        const parts = formatter.formatToParts(new Date(value));
        return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
    };
    return day(request.startedAt) === day(at) && response.dateKey === day(at)
        && (policy.validFrom == null || at >= policy.validFrom)
        && (policy.validUntil == null || at <= policy.validUntil);
}

function sendManagedTimeLimitHeartbeat() {
    const policy = getManagedTimeLimitPolicy(currentSettings);
    const route = classifyManagedViewingRoute(location.href);
    if (!policy || route.surface === 'external') {
        releaseManagedTimeLimitRuntime();
        return;
    }

    if (managedTimeLimitHeartbeatInFlight) {
        managedTimeLimitPendingHeartbeat = true;
        return;
    }

    managedTimeLimitHeartbeatInFlight = true;
    managedTimeLimitPendingHeartbeat = false;
    const heartbeatGeneration = managedTimeLimitRuntimeGeneration;
    const playbackPermitRequest = managedContentPlaybackPermit.capture(currentSettings, policy, location.href);
    const transaction = { timer: 0 };
    managedTimeLimitHeartbeatRequest = transaction;
    const finish = (response, err = null) => {
        // A timed-out or replaced request must not finish a newer heartbeat.
        if (managedTimeLimitHeartbeatRequest !== transaction) return;
        clearTimeout(transaction.timer);
        managedTimeLimitHeartbeatRequest = null;
        managedTimeLimitHeartbeatInFlight = false;
        if (heartbeatGeneration === managedTimeLimitRuntimeGeneration && managedContentPlaybackPermit.current(playbackPermitRequest)) {
            let valid = false;
            try { valid = !err && managedTimeLimitResponseMatches(playbackPermitRequest, response, policy, route); } catch (_) {}
            if (!valid) {
                managedContentPlaybackPermit.clear(err ? 'managed_time_heartbeat_error' : 'managed_time_authority_changed');
                removeManagedTimeLimitStatus();
                // Unknown authority is never a reason to unlock an exhausted
                // profile. A fresh policy response or authorized settings change
                // must explicitly recover it.
            } else if (response.timedOut) {
                managedContentPlaybackPermit.clear('managed_time_budget_exhausted');
                showManagedTimeoutOverlay(response);
            } else {
                managedContentPlaybackPermit.publish(playbackPermitRequest, response);
                removeManagedTimeoutOverlay();
                showManagedTimeLimitStatus(response);
            }
        }
        if (managedTimeLimitPendingHeartbeat) {
            managedTimeLimitPendingHeartbeat = false;
            sendManagedTimeLimitHeartbeat();
        }
    };
    transaction.timer = setTimeout(() => finish(null, { message: 'managed_time_heartbeat_timeout' }), MANAGED_TIME_LIMIT_RESPONSE_TIMEOUT_MS);
    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: 'FilterTube_ManagedTimeLimitHeartbeat',
            profileId: policy.profileId,
            policy,
            href: location.href,
            visible: document.visibilityState === 'visible',
            focused: isManagedTimeLimitTabActive(),
            playing: isManagedTimeLimitPlaybackActive()
        }, response => finish(response, browserAPI_BRIDGE.runtime?.lastError));
    } catch (e) {
        finish(null, e);
    }
}

function applyManagedTimeLimitRuntime(settings, options = {}) {
    try {
        const route = classifyManagedViewingRoute(location.href);
        const policy = getManagedTimeLimitPolicy(settings);
        if (!policy || route.surface === 'external') {
            releaseManagedTimeLimitRuntime();
            return false;
        }

        const policyKey = `${policy.profileId}:${policy.policyRevision}:${policy.policyHash}`;
        if (policyKey !== managedTimeLimitPolicyKey) {
            clearManagedTimeLimitHeartbeatRequest();
            managedTimeLimitRuntimeGeneration += 1;
            managedTimeLimitPolicyKey = policyKey;
        }
        ensureManagedTimeLimitRuntimeListeners();
        if (options?.immediate !== false) {
            sendManagedTimeLimitHeartbeat();
        }
        return true;
    } catch (e) {
        releaseManagedTimeLimitRuntime();
        return false;
    }
}

function requestSettingsFromBackground(options = {}) {
    return new Promise((resolve) => {
        const safeResolveFailure = () => {
            resolve({ success: false, settings: null, error: 'extension_context_invalidated' });
        };
        const sendRuntimeMessage = (payload, callback) => {
            try {
                if (!browserAPI_BRIDGE?.runtime?.sendMessage || !browserAPI_BRIDGE?.runtime?.id) {
                    safeResolveFailure();
                    return false;
                }
                browserAPI_BRIDGE.runtime.sendMessage(payload, (response) => {
                    const err = browserAPI_BRIDGE.runtime?.lastError;
                    if (err) {
                        safeResolveFailure();
                        return;
                    }
                    callback(response);
                });
                return true;
            } catch (e) {
                safeResolveFailure();
                return false;
            }
        };

        const profileType = (() => {
            try {
                const host = String(location?.hostname || '').toLowerCase();
                return host.includes('youtubekids.com') ? 'kids' : 'main';
            } catch (e) {
                return 'main';
            }
        })();

        const forceRefresh = options && typeof options === 'object' && options.forceRefresh === true;

        if (!sendRuntimeMessage({ action: "getCompiledSettings", profileType, forceRefresh }, (response) => {
            if (response && !response.error) {
                try {
                    const resolvedProfile = response.profileType === 'kids'
                        ? 'kids'
                        : (response.profileType === 'main' ? 'main' : '');
                    if (resolvedProfile && resolvedProfile !== profileType) {
                        if (!sendRuntimeMessage({ action: "getCompiledSettings", profileType, forceRefresh: true }, (retry) => {
                            if (retry && !retry.error) {
                                const normalized = normalizeSettingsForHost(retry);
                                sendSettingsToMainWorld(normalized);
                                resolve({ success: true, settings: normalized });
                            } else {
                                const normalized = normalizeSettingsForHost(response);
                                sendSettingsToMainWorld(normalized);
                                resolve({ success: true, settings: normalized });
                            }
                        })) {
                            return;
                        }
                        return;
                    }
                } catch (e) {
                }

                try {
                    const debugEnabled = (() => {
                        try {
                            return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
                        } catch (e) {
                            return !!window.__filtertubeDebug;
                        }
                    })();

                    if (debugEnabled) {
                        const host = (() => {
                            try {
                                return String(location?.hostname || '').toLowerCase();
                            } catch (e) {
                                return '';
                            }
                        })();

                        const isKidsHost = host.includes('youtubekids.com');
                        const listMode = response.listMode === 'whitelist' ? 'whitelist' : 'blocklist';
                        const wlChannels = Array.isArray(response.whitelistChannels) ? response.whitelistChannels.length : 0;
                        const wlKeywords = Array.isArray(response.whitelistKeywords) ? response.whitelistKeywords.length : 0;
                        const blChannels = Array.isArray(response.filterChannels) ? response.filterChannels.length : 0;
                        const blKeywords = Array.isArray(response.filterKeywords) ? response.filterKeywords.length : 0;

                        console.log('[FilterTube] Compiled settings received', {
                            host,
                            requestedProfileType: profileType,
                            listMode,
                            filterChannels: blChannels,
                            filterKeywords: blKeywords,
                            whitelistChannels: wlChannels,
                            whitelistKeywords: wlKeywords
                        });

                        if (isKidsHost && listMode === 'whitelist' && wlChannels === 0 && wlKeywords === 0) {
                            console.warn('[FilterTube] Kids host received whitelist mode with empty allow-lists (this hides most content).');
                        }
                    }
                } catch (e) {
                }
                const normalized = normalizeSettingsForHost(response);
                sendSettingsToMainWorld(normalized);
                resolve({ success: true, settings: normalized });
            } else {
                resolve({ success: false });
            }
        })) {
            return;
        }
    });
}

function tryApplySettingsToSeed(settings, dispatchRevision = 0) {
    if (window.filterTube?.updateSettings) {
        try {
            window.filterTube.updateSettings(settings, dispatchRevision);
            pendingSeedSettings = null;
            pendingSeedSettingsRevision = 0;
            return true;
        } catch (error) {
            debugLog('❌ Failed to forward settings to seed.js:', error);
        }
    }
    return false;
}

function ensureSeedReadyListener() {
    if (seedListenerAttached) return;
    seedListenerAttached = true;
    window.addEventListener('filterTubeSeedReady', () => {
        if (pendingSeedSettings) {
            tryApplySettingsToSeed(pendingSeedSettings, pendingSeedSettingsRevision);
        }
    });
}

function scheduleSeedRetry() {
    setTimeout(() => {
        if (pendingSeedSettings) {
            if (!tryApplySettingsToSeed(pendingSeedSettings, pendingSeedSettingsRevision)) {
                scheduleSeedRetry();
            }
        }
    }, 250);
}

function retainVerifiedVideoMetadata(settings) {
    // Player verification belongs to this page's video IDs, not to a replaceable
    // settings snapshot. A storage refresh must not send an already checked
    // player back through the pending state merely because persistence omits it.
    const cache = window.__filtertubeVerifiedVideoMetadata instanceof Map
        ? window.__filtertubeVerifiedVideoMetadata
        : (window.__filtertubeVerifiedVideoMetadata = new Map());
    const remember = (map) => {
        for (const [id, meta] of Object.entries(map || {})) {
            if (!/^[a-zA-Z0-9_-]{11}$/.test(id) || !meta || typeof meta !== 'object') continue;
            if (meta.identityVerified !== true && meta.textVerified !== true) continue;
            const previous = cache.get(id) || {};
            const merged = { ...previous, ...meta };
            if (previous.identityVerified === true && meta.identityVerified !== true) {
                for (const field of ['channelId', 'channelName', 'channelHandle', 'identityVerified']) merged[field] = previous[field];
            }
            if (previous.textVerified === true && meta.textVerified !== true) {
                for (const field of ['title', 'shortDescription', 'keywords', 'textVerified']) merged[field] = previous[field];
            }
            cache.delete(id);
            cache.set(id, merged);
        }
    };
    // Official category/language answers are page facts too. If a snapshot is
    // compiled before the background has merged them, dropping them would show
    // a card that was hidden by a confirmed match and then hide it again once
    // the lookup re-resolves (a visible hide/unhide loop, #79). Only these
    // fields are retained for unverified entries; identity/text never are.
    const contentCache = window.__filtertubeResolvedVideoContentMetadata instanceof Map
        ? window.__filtertubeResolvedVideoContentMetadata
        : (window.__filtertubeResolvedVideoContentMetadata = new Map());
    const CONTENT_FIELDS = ['category', 'languageCode', 'languageSource', 'languageConfidence'];
    const rememberContent = (map) => {
        for (const [id, meta] of Object.entries(map || {})) {
            if (!/^[a-zA-Z0-9_-]{11}$/.test(id) || !meta || typeof meta !== 'object') continue;
            const category = typeof meta.category === 'string' ? meta.category.trim() : '';
            const languageCode = typeof meta.languageCode === 'string' ? meta.languageCode.trim() : '';
            const staleLanguage = languageCode.toLowerCase() === 'und'
                && String(meta.languageSource || '').trim() === 'player-unavailable';
            const usableLanguage = Boolean(languageCode) && !staleLanguage;
            if (!category && !usableLanguage) continue;
            const entry = { ...(contentCache.get(id) || {}) };
            if (category) entry.category = category;
            if (usableLanguage) {
                entry.languageCode = languageCode;
                entry.languageSource = typeof meta.languageSource === 'string' ? meta.languageSource : '';
                entry.languageConfidence = typeof meta.languageConfidence === 'string' ? meta.languageConfidence : '';
            }
            contentCache.delete(id);
            contentCache.set(id, entry);
        }
    };
    remember(currentSettings?.videoMetaMap);
    remember(settings?.videoMetaMap);
    rememberContent(currentSettings?.videoMetaMap);
    rememberContent(settings?.videoMetaMap);
    while (cache.size > 256) cache.delete(cache.keys().next().value);
    while (contentCache.size > 512) contentCache.delete(contentCache.keys().next().value);
    if (!settings || typeof settings !== 'object' || (cache.size === 0 && contentCache.size === 0)) return;
    const nextMap = { ...(settings.videoMetaMap || {}) };
    for (const [id, content] of contentCache) {
        const incoming = nextMap[id];
        if (incoming && typeof incoming === 'object') {
            const patched = { ...incoming };
            let changed = false;
            if (content.category && !String(incoming.category || '').trim()) {
                patched.category = content.category;
                changed = true;
            }
            const incomingLanguage = String(incoming.languageCode || '').trim();
            const incomingStale = incomingLanguage.toLowerCase() === 'und'
                && String(incoming.languageSource || '').trim() === 'player-unavailable';
            if (content.languageCode && (!incomingLanguage || incomingStale)) {
                patched.languageCode = content.languageCode;
                patched.languageSource = content.languageSource;
                patched.languageConfidence = content.languageConfidence;
                changed = true;
            }
            if (changed) nextMap[id] = patched;
        } else {
            const restored = {};
            for (const field of CONTENT_FIELDS) {
                if (content[field]) restored[field] = content[field];
            }
            nextMap[id] = restored;
        }
    }
    for (const [id, verified] of cache) {
        const incoming = nextMap[id] || {};
        const merged = { ...verified, ...incoming };
        if (incoming.identityVerified !== true && verified.identityVerified === true) {
            for (const field of ['channelId', 'channelName', 'channelHandle', 'identityVerified']) merged[field] = verified[field];
        }
        if (incoming.textVerified !== true && verified.textVerified === true) {
            for (const field of ['title', 'shortDescription', 'keywords', 'textVerified']) merged[field] = verified[field];
        }
        nextMap[id] = merged;
    }
    settings.videoMetaMap = nextMap;
}

function sendSettingsToMainWorld(settings) {
    managedContentPlaybackPermit.clear('managed_time_settings_changed');
    try { if (typeof window !== 'undefined') window.FilterTubeContentPlayback?.invalidate?.('settings_changed'); } catch (_) {}
    const dispatchRevision = ++mainWorldSettingsDispatchRevision;
    // A pending blocked-autoplay skip (#82) belongs to the previous settings.
    try { if (typeof cancelBlockedAutoplaySkip === 'function') cancelBlockedAutoplaySkip(); } catch (_) {}
    retainVerifiedVideoMetadata(settings);
    latestSettings = settings;
    currentSettings = settings;
    // The page's own views (narrowed_view.js, allowlist_feed_view.js) redraw on this, without polling.
    try { document.dispatchEvent(new Event('filtertube-settings-applied')); } catch (_) {}

    if (applyManagedViewingRouteGate(settings)) {
        releaseManagedTimeLimitRuntime();
        pendingSeedSettings = null;
        pendingSeedSettingsRevision = 0;
        return;
    }
    applyManagedTimeLimitRuntime(settings);

    window.postMessage({
        type: 'FilterTube_SettingsToInjector',
        payload: settings,
        revision: dispatchRevision,
        source: 'content_bridge'
    }, '*');

    if (!tryApplySettingsToSeed(settings, dispatchRevision)) {
        pendingSeedSettings = settings;
        pendingSeedSettingsRevision = dispatchRevision;
        ensureSeedReadyListener();
        scheduleSeedRetry();
    }

    refreshRuntimeObserversAfterSettingsUpdate();
}

let pendingStorageRefreshTimer = 0;
let lastStorageRefreshTs = 0;
let pendingStorageRefreshForceReprocess = false;
const MIN_STORAGE_REFRESH_INTERVAL_MS = 250;

function refreshRuntimeObserversAfterSettingsUpdate() {
    try {
        if (typeof refreshFilterTubeRuntimeObservers === 'function') {
            refreshFilterTubeRuntimeObservers();
            return;
        }
    } catch (e) {
    }
    try {
        if (typeof window.FilterTube_refreshRuntimeObservers === 'function') {
            window.FilterTube_refreshRuntimeObservers();
            return;
        }
    } catch (e) {
    }
    try {
        if (typeof window.FilterTube_refreshQuickBlockAvailability === 'function') {
            window.FilterTube_refreshQuickBlockAvailability({ force: true });
        }
    } catch (e) {
    }
    try {
        if (typeof window.FilterTube_refreshDOMFallbackObserver === 'function') {
            window.FilterTube_refreshDOMFallbackObserver();
        }
    } catch (e) {
    }
    try {
        if (typeof schedulePrefetchScan === 'function') schedulePrefetchScan();
    } catch (e) {
    }
}

function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {
    const shouldForceReprocess = forceReprocess === true;
    const now = Date.now();
    const elapsed = now - lastStorageRefreshTs;
    if (elapsed >= MIN_STORAGE_REFRESH_INTERVAL_MS && !pendingStorageRefreshTimer) {
        lastStorageRefreshTs = now;
        requestSettingsFromBackground({ forceRefresh: true }).then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: shouldForceReprocess });
                refreshRuntimeObserversAfterSettingsUpdate();
            }
        });
        return;
    }

    pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess || shouldForceReprocess;
    if (pendingStorageRefreshTimer) return;
    const delay = Math.max(0, MIN_STORAGE_REFRESH_INTERVAL_MS - elapsed);
    pendingStorageRefreshTimer = setTimeout(() => {
        pendingStorageRefreshTimer = 0;
        const forcePendingReprocess = pendingStorageRefreshForceReprocess === true;
        pendingStorageRefreshForceReprocess = false;
        lastStorageRefreshTs = Date.now();
        requestSettingsFromBackground({ forceRefresh: true }).then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: forcePendingReprocess });
                refreshRuntimeObserversAfterSettingsUpdate();
            }
        });
    }, delay);
}

const FILTERTUBE_METADATA_ONLY_CHANNEL_FIELDS = [
    'name',
    'handle',
    'handleDisplay',
    'canonicalHandle',
    'logo',
    'customUrl',
    'topicChannel',
    'managedListId',
    'managedListName',
    'managedListSourceLabel',
    'managedListSourceUrl',
    'managedListSourceFormat',
    'managedListImportedAt',
    'managedListLastCheckedAt',
    'managedListContentHash',
    'managedListSourceTitle',
    'managedListSourceVersion',
    'managedListSourceUpdatedLabel',
    'managedListSourceHomepage'
];

function filterTubeStripMetadataOnlyChannelFields(value) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(filterTubeStripMetadataOnlyChannelFields);

    const output = { ...value };
    const id = typeof output.id === 'string' ? output.id.trim() : '';
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(id)) {
        FILTERTUBE_METADATA_ONLY_CHANNEL_FIELDS.forEach((field) => {
            if (field === 'name' && output.filterAll === true) return;
            delete output[field];
        });
    }
    return output;
}

function filterTubeStripMetadataOnlyChannelLists(value) {
    let cloned = value;
    try {
        cloned = JSON.parse(JSON.stringify(value));
    } catch (e) {
        return value;
    }
    if (Array.isArray(cloned)) return cloned.map(filterTubeStripMetadataOnlyChannelFields);
    if (!cloned || typeof cloned !== 'object') return cloned;

    if (Array.isArray(cloned.filterChannels)) {
        cloned.filterChannels = cloned.filterChannels.map(filterTubeStripMetadataOnlyChannelFields);
    }
    const profiles = cloned.profiles && typeof cloned.profiles === 'object' && !Array.isArray(cloned.profiles)
        ? cloned.profiles
        : {};
    Object.values(profiles).forEach((profile) => {
        if (!profile || typeof profile !== 'object') return;
        [profile, profile.main, profile.kids].forEach((surface) => {
            if (!surface || typeof surface !== 'object') return;
            ['channels', 'blockedChannels', 'whitelistChannels', 'allowedChannels'].forEach((key) => {
                if (Array.isArray(surface[key])) {
                    surface[key] = surface[key].map(filterTubeStripMetadataOnlyChannelFields);
                }
            });
        });
    });
    return cloned;
}

function filterTubeIsMetadataOnlySettingsChange(changes) {
    const keys = Object.keys(changes || {});
    if (!keys.length) return false;
    if (changes.ftImportedChannelMetadataRevision && keys.every(key => [
        'ftProfilesV4',
        'ftImportedChannelMetadataRevision',
        'ftBlockTubeEnrichmentJobV1'
    ].includes(key))) {
        if (!changes.ftProfilesV4) return true;
        const profileChange = changes.ftProfilesV4;
        if (!Object.prototype.hasOwnProperty.call(profileChange, 'oldValue')
            || !Object.prototype.hasOwnProperty.call(profileChange, 'newValue')) return false;
        try {
            // A revision marker is not proof that the same write preserved
            // profile selection, rules and parent-controlled permissions.
            return JSON.stringify(filterTubeStripMetadataOnlyChannelLists(profileChange.oldValue))
                === JSON.stringify(filterTubeStripMetadataOnlyChannelLists(profileChange.newValue));
        } catch (e) {
            return false;
        }
    }
    const allowedKeys = new Set(['ftProfilesV4', 'filterChannels', 'uiChannels', 'channelMap']);
    if (keys.some(key => !allowedKeys.has(key))) return false;
    if (!changes.ftProfilesV4 && !changes.filterChannels) return false;
    if (changes.ftProfilesV4 && !Object.prototype.hasOwnProperty.call(changes.ftProfilesV4, 'oldValue')) return false;
    if (changes.filterChannels && !Object.prototype.hasOwnProperty.call(changes.filterChannels, 'oldValue')) return false;
    try {
        if (changes.ftProfilesV4
            && JSON.stringify(filterTubeStripMetadataOnlyChannelLists(changes.ftProfilesV4.oldValue))
                !== JSON.stringify(filterTubeStripMetadataOnlyChannelLists(changes.ftProfilesV4.newValue))) {
            return false;
        }
        if (changes.filterChannels
            && JSON.stringify(filterTubeStripMetadataOnlyChannelLists(changes.filterChannels.oldValue))
                !== JSON.stringify(filterTubeStripMetadataOnlyChannelLists(changes.filterChannels.newValue))) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Applying a parent's update must never disturb a playing video unless the video is now blocked
// (Android 79108f833 test 2026-11-21). A profiles write that changes no rules (history rows, policy
// receipts) refreshes nothing; one that only adds or removes list entries re-filters the page but
// leaves the running player alone: a now-blocked video is handled by the normal filter pass.
const FILTERTUBE_PROFILE_RULE_KEYS = ['settings', 'main', 'kids', 'study', 'type', 'parentProfileId', 'locked', 'security'];
// Settings that decide whether the playing video may play at all (content-only playback admission,
// time limits, category/language checks, viewing spaces). Run 4 (Android d760d6c2a): any other rules
// change keeps the mounted player; the normal filter pass still ends a newly blocked video.
const FILTERTUBE_PLAYBACK_SETTINGS_KEYS = ['enabled', 'contentOnlyPlayback', 'hideSponsoredCards', 'timeLimitPolicy',
    'categoryFilters', 'languageFilters', 'allowMainViewing', 'allowKidsViewing', 'defaultLaunchTarget'];

/** The rules of every profile; with `playbackOnly`, only what decides whether a video may play. */
function filterTubeProfilesRuleProjection(root, playbackOnly) {
    const tree = root && typeof root === 'object' ? root : {};
    const profiles = tree.profiles && typeof tree.profiles === 'object' ? tree.profiles : {};
    const out = { activeProfileId: tree.activeProfileId ?? null, profiles: {} };
    for (const id of Object.keys(profiles).sort()) {
        const profile = profiles[id] && typeof profiles[id] === 'object' ? profiles[id] : {};
        const row = {};
        for (const key of FILTERTUBE_PROFILE_RULE_KEYS) {
            let value = profile[key];
            if (playbackOnly && (key === 'main' || key === 'kids')) continue;
            if (playbackOnly && key === 'settings') {
                const settings = value && typeof value === 'object' ? value : {};
                value = Object.fromEntries(FILTERTUBE_PLAYBACK_SETTINGS_KEYS.map(name => [name, settings[name] === undefined ? null : settings[name]]));
            }
            row[key] = value === undefined ? null : value;
        }
        out.profiles[id] = row;
    }
    return out;
}

function filterTubeStableJson(value) {
    if (Array.isArray(value)) return `[${value.map(filterTubeStableJson).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${filterTubeStableJson(value[key])}`).join(',')}}`;
    return JSON.stringify(value === undefined ? null : value);
}

/** 'none' (no rule changed), 'lists' (rules changed, the playing video may keep playing) or 'other'. */
function filterTubeProfilesChangeKind(change) {
    try {
        if (!change || !Object.prototype.hasOwnProperty.call(change, 'oldValue')) return 'other';
        // A first write, a reset or a malformed tree is never "no change".
        const isTree = value => !!value && typeof value === 'object' && !!value.profiles && typeof value.profiles === 'object';
        if (!isTree(change.oldValue) || !isTree(change.newValue)) return 'other';
        const same = withoutLists => filterTubeStableJson(filterTubeProfilesRuleProjection(change.oldValue, withoutLists))
            === filterTubeStableJson(filterTubeProfilesRuleProjection(change.newValue, withoutLists));
        if (same(false)) return 'none';
        return same(true) ? 'lists' : 'other';
    } catch (e) {
        return 'other';
    }
}

function handleStorageChanges(changes, area) {
    if (area !== 'local') return;

    const changedKeys = Object.keys(changes || {});
    if (changedKeys.length === 1 && changedKeys[0] === 'channelMap') {
        return;
    }

    const isVideoChannelMapOnly = changedKeys.length === 1 && changedKeys[0] === 'videoChannelMap';
    const isVideoMetaMapOnly = changedKeys.length === 1 && changedKeys[0] === 'videoMetaMap';
    const relevantKeys = [
        'enabled',
        'uiKeywords',
        'filterKeywords',
        'filterKeywordsComments',
        'filterChannels',
        'contentFilters',
        'uiChannels',
        'ftProfilesV3',
        'ftProfilesV4',
        'channelMap',
        'videoChannelMap', // Needed so Shorts videoId → channelId updates re-apply settings
        'videoMetaMap',
        'hideAllComments',
        'filterComments',
        'hideAllShorts',
        'hideHomeFeed',
        'hideSponsoredCards',
        'contentOnlyPlayback',
        'hidePlayables',
        'hideWatchPlaylistPanel',
        'hidePlaylistCards',
        'hideMembersOnly',
        'hideMixPlaylists',
        'hideVideoSidebar',
        'hideRecommended',
        'hideLiveChat',
        'hideVideoInfo',
        'hideVideoButtonsBar',
        'hideAskButton',
        'hideVideoChannelRow',
        'hideVideoDescription',
        'hideMerchTicketsOffers',
        'hideEndscreenVideowall',
        'hideEndscreenCards',
        'disableAutoplay',
        'skipBlockedAutoplay',
        'quietBlocking',
        'alwaysUseOriginalAudio',
        'disableAnnotations',
        'hideTopHeader',
        'hideNotificationBell',
        'hideExploreTrending',
        'hideMoreFromYouTube',
        'hideSubscriptions',
        'showQuickBlockButton',
        'showBlockMenuItem',
        'hideSearchShelves'
    ];
    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {
        if (filterTubeIsMetadataOnlySettingsChange(changes)) return;
        const profilesOnly = changedKeys.length === 1 && changedKeys[0] === 'ftProfilesV4';
        const profilesChange = profilesOnly ? filterTubeProfilesChangeKind(changes.ftProfilesV4) : 'other';
        if (profilesChange === 'none') return;
        // A rules update re-checks the playing YouTube Kids video (dom_fallback.js).
        const metadataOnly = changedKeys.every(key => ['channelMap', 'videoChannelMap', 'videoMetaMap'].includes(key));
        if (!metadataOnly && typeof filterTubeArmKidsCurrentWatchRecheck === 'function') filterTubeArmKidsCurrentWatchRecheck();
        const metadataMapsOnly = changedKeys.every(key => ['channelMap', 'videoChannelMap', 'videoMetaMap'].includes(key));
        if (!metadataMapsOnly && profilesChange !== 'lists') {
            managedContentPlaybackPermit.clear('managed_time_storage_changed');
            try { if (typeof window !== 'undefined') window.FilterTubeContentPlayback?.invalidate?.('storage_settings_changed'); } catch (_) {}
        }
        // FIX: Apply changes IMMEDIATELY without debounce
        scheduleSettingsRefreshFromStorage({ forceReprocess: !(isVideoChannelMapOnly || isVideoMetaMapOnly) });
    }
}

try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }
