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
let managedTimeLimitListenersAttached = false;
let managedTimeLimitRouteHandler = null;
let managedTimeLimitRuntimeGeneration = 0;
let managedTimeLimitPolicyKey = '';
let managedTimeLimitParentRequestKey = '';

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
                color: #1b1a18 !important;
                font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
                pointer-events: auto !important;
                background: linear-gradient(180deg, #dcebf4 0%, #edf5f1 52%, #f7f4ec 100%) !important;
            }
            #${MANAGED_TIME_LIMIT_OVERLAY_ID} *,
            #${MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID} * { box-sizing: border-box !important; }
            .filtertube-managed-overlay__media {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                transform: scale(1.035) !important;
                filter: saturate(.82) contrast(.94) brightness(1.04) !important;
                pointer-events: none !important;
            }
            .filtertube-managed-overlay__scrim {
                position: absolute !important;
                inset: 0 !important;
                pointer-events: none !important;
                background:
                    radial-gradient(circle at 16% 10%, rgba(197, 222, 241, .52), transparent 34%),
                    radial-gradient(circle at 86% 12%, rgba(244, 217, 193, .42), transparent 30%),
                    linear-gradient(180deg, rgba(247, 250, 251, .2), rgba(239, 237, 229, .44)) !important;
                backdrop-filter: blur(2px) !important;
            }
            .filtertube-managed-overlay__panel {
                position: relative !important;
                z-index: 1 !important;
                width: min(460px, 100%) !important;
                max-height: calc(100dvh - clamp(28px, 6vw, 84px)) !important;
                overflow: auto !important;
            }
            .filtertube-managed-overlay__panel--time {
                display: grid !important;
                grid-template-columns: minmax(0, 1.18fr) minmax(300px, .82fr) !important;
                width: min(1120px, 100%) !important;
                padding: 0 !important;
                border: 1px solid rgba(70, 60, 48, .14) !important;
                border-radius: clamp(24px, 3vw, 42px) !important;
                background: rgba(249, 248, 244, .9) !important;
                color: #1b1a18 !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 40px 110px -45px rgba(50, 39, 31, .5) !important;
                backdrop-filter: blur(24px) saturate(.92) !important;
            }
            .filtertube-managed-overlay__story {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                min-height: min(620px, 72dvh) !important;
                padding: clamp(30px, 6vw, 78px) !important;
                background:
                    radial-gradient(circle at 8% 8%, rgba(173,207,234,.22), transparent 34%),
                    radial-gradient(circle at 92% 94%, rgba(182,206,193,.2), transparent 34%) !important;
            }
            .filtertube-managed-overlay__aside {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                padding: clamp(26px, 4vw, 54px) !important;
                border-left: 1px solid rgba(70, 60, 48, .1) !important;
                background: rgba(255,255,255,.46) !important;
            }
            .filtertube-managed-overlay__brand {
                display: inline-flex !important;
                align-items: center !important;
                align-self: flex-start !important;
                gap: 10px !important;
                margin-bottom: clamp(34px, 7vh, 70px) !important;
                color: #24211d !important;
                font-size: 13px !important;
                font-weight: 850 !important;
                letter-spacing: .08em !important;
                text-transform: uppercase !important;
            }
            .filtertube-managed-overlay__mark {
                display: grid !important;
                place-items: center !important;
                width: 30px !important;
                height: 30px !important;
                border: 1px solid rgba(171,68,56,.35) !important;
                border-radius: 50% !important;
                background: rgba(255,255,255,.72) !important;
                color: #ab4438 !important;
                font-family: Georgia, serif !important;
                font-size: 16px !important;
                font-style: italic !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.9) !important;
                object-fit: contain !important;
                padding: 5px !important;
                box-sizing: border-box !important;
            }
            .filtertube-managed-overlay__eyebrow {
                margin: 0 0 16px !important;
                color: #ab4438 !important;
                font-family: "SFMono-Regular", Consolas, monospace !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                letter-spacing: .2em !important;
                line-height: 1.4 !important;
                text-transform: uppercase !important;
            }
            .filtertube-managed-overlay__title {
                max-width: 11ch !important;
                margin: 0 !important;
                color: #1b1a18 !important;
                font-family: "Outfit", "Avenir Next", "Segoe UI", sans-serif !important;
                font-size: clamp(44px, 6vw, 78px) !important;
                font-weight: 650 !important;
                letter-spacing: -.07em !important;
                line-height: .93 !important;
            }
            .filtertube-managed-overlay__title-emphasis {
                display: block !important;
                color: #ab4438 !important;
                font-family: "Cormorant Garamond", Georgia, serif !important;
                font-style: italic !important;
                font-weight: 500 !important;
                letter-spacing: -.04em !important;
            }
            .filtertube-managed-overlay__lede {
                max-width: 610px !important;
                margin: 26px 0 0 !important;
                color: #5b5750 !important;
                font-size: clamp(15px, 1.5vw, 18px) !important;
                font-weight: 600 !important;
                line-height: 1.7 !important;
            }
            .filtertube-managed-overlay__profile {
                display: inline-flex !important;
                align-items: center !important;
                align-self: flex-start !important;
                gap: 8px !important;
                margin-top: 28px !important;
                padding: 9px 13px !important;
                border: 1px solid rgba(70,60,48,.12) !important;
                border-radius: 999px !important;
                background: rgba(255,255,255,.66) !important;
                color: #45413b !important;
                font-size: 12px !important;
                font-weight: 800 !important;
            }
            .filtertube-managed-overlay__facts {
                display: grid !important;
                gap: 10px !important;
                margin: 0 !important;
            }
            .filtertube-managed-overlay__fact {
                display: grid !important;
                grid-template-columns: 1fr auto !important;
                align-items: baseline !important;
                gap: 18px !important;
                margin: 0 !important;
                padding: 15px 16px !important;
                border: 1px solid rgba(70,60,48,.1) !important;
                border-radius: 16px !important;
                background: rgba(255,255,255,.62) !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.84) !important;
            }
            .filtertube-managed-overlay__fact dt {
                margin: 0 !important;
                color: #7a746b !important;
                font-size: 12px !important;
                font-weight: 750 !important;
            }
            .filtertube-managed-overlay__fact dd {
                margin: 0 !important;
                color: #292622 !important;
                font-size: 13px !important;
                font-weight: 850 !important;
                text-align: right !important;
            }
            .filtertube-managed-overlay__guidance {
                margin-top: 18px !important;
                padding: 14px 15px !important;
                border-left: 3px solid #ab4438 !important;
                border-radius: 4px 14px 14px 4px !important;
                background: rgba(171,68,56,.07) !important;
                color: #5b514a !important;
                font-size: 13px !important;
                font-weight: 650 !important;
                line-height: 1.55 !important;
            }
            .filtertube-managed-overlay__actions {
                display: grid !important;
                gap: 10px !important;
                margin-top: 22px !important;
            }
            .filtertube-managed-overlay__button {
                min-height: 48px !important;
                width: 100% !important;
                padding: 10px 18px !important;
                border: 1px solid rgba(70,60,48,.14) !important;
                border-radius: 999px !important;
                background: rgba(255,255,255,.72) !important;
                color: #24211d !important;
                font: 800 14px/1.2 "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
                cursor: pointer !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 16px 34px -28px rgba(17,18,24,.4) !important;
                transition: transform 180ms ease, border-color 180ms ease, background 180ms ease !important;
            }
            .filtertube-managed-overlay__button:hover { transform: translateY(-1px) !important; border-color: rgba(171,68,56,.42) !important; }
            .filtertube-managed-overlay__button:focus-visible { outline: 3px solid rgba(171,68,56,.24) !important; outline-offset: 3px !important; }
            .filtertube-managed-overlay__button--primary { border-color: #ab4438 !important; background: #ab4438 !important; color: #fffaf4 !important; }
            .filtertube-managed-overlay__button:disabled { cursor: default !important; opacity: .7 !important; transform: none !important; }
            .filtertube-managed-overlay__instruction {
                display: none !important;
                margin: 0 !important;
                padding: 12px 14px !important;
                border: 1px solid rgba(70,60,48,.1) !important;
                border-radius: 14px !important;
                background: rgba(255,255,255,.58) !important;
                color: #625f58 !important;
                font-size: 12px !important;
                font-weight: 650 !important;
                line-height: 1.55 !important;
            }
            .filtertube-managed-overlay__instruction[data-visible="true"] { display: block !important; }
            .filtertube-managed-overlay__profiles {
                display: grid !important;
                gap: 8px !important;
                margin-top: 14px !important;
            }
            .filtertube-managed-overlay__profiles[hidden] { display: none !important; }
            .filtertube-managed-overlay__profile-option {
                display: grid !important;
                grid-template-columns: 34px minmax(0,1fr) auto !important;
                align-items: center !important;
                gap: 10px !important;
                width: 100% !important;
                min-height: 52px !important;
                padding: 8px 12px !important;
                border: 1px solid rgba(70,60,48,.12) !important;
                border-radius: 16px !important;
                background: rgba(255,255,255,.68) !important;
                color: #292622 !important;
                cursor: pointer !important;
                text-align: left !important;
            }
            .filtertube-managed-overlay__profile-option:hover { border-color: rgba(171,68,56,.38) !important; }
            .filtertube-managed-overlay__profile-avatar {
                display: grid !important;
                place-items: center !important;
                width: 34px !important;
                height: 34px !important;
                border-radius: 50% !important;
                background: rgba(171,68,56,.12) !important;
                color: #8e352d !important;
                font-size: 12px !important;
                font-weight: 850 !important;
            }
            .filtertube-managed-overlay__profile-meta { min-width: 0 !important; }
            .filtertube-managed-overlay__profile-name { display: block !important; font-size: 13px !important; font-weight: 850 !important; }
            .filtertube-managed-overlay__profile-type { display: block !important; margin-top: 2px !important; color: #777067 !important; font-size: 11px !important; font-weight: 650 !important; }
            .filtertube-managed-overlay__profile-lock { color: #8e352d !important; font-size: 11px !important; font-weight: 800 !important; }
            @media (max-width: 760px) {
                .filtertube-managed-overlay__panel--time { grid-template-columns: 1fr !important; }
                .filtertube-managed-overlay__story { min-height: auto !important; padding: 30px 24px !important; }
                .filtertube-managed-overlay__aside { padding: 24px !important; border-left: 0 !important; border-top: 1px solid rgba(70,60,48,.1) !important; }
                .filtertube-managed-overlay__brand { margin-bottom: 34px !important; }
                .filtertube-managed-overlay__title { font-size: clamp(40px, 13vw, 58px) !important; }
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
        video.style.cssText = [
            'position:absolute',
            'inset:0',
            'width:100%',
            'height:100%',
            'object-fit:cover',
            'opacity:.58',
            'filter:saturate(.82) brightness(.8)',
            'pointer-events:none'
        ].join(';');
        overlay.appendChild(video);
    }
    const scrim = document.createElement('div');
    scrim.setAttribute('aria-hidden', 'true');
    scrim.className = 'filtertube-managed-overlay__scrim';
    scrim.style.cssText = [
        'position:absolute',
        'inset:0',
        'background:linear-gradient(135deg,rgba(8,13,18,.78),rgba(15,23,42,.62) 45%,rgba(27,38,48,.72))',
        'pointer-events:none'
    ].join(';');
    overlay.appendChild(scrim);
}

function createManagedOverlayPanel(kind = '') {
    const panel = document.createElement('section');
    panel.className = `filtertube-managed-overlay__panel${kind ? ` filtertube-managed-overlay__panel--${kind}` : ''}`;
    panel.style.cssText = [
        'position:relative',
        'width:min(460px,100%)',
        'border:1px solid rgba(255,255,255,.28)',
        'border-radius:10px',
        'background:rgba(12,18,25,.82)',
        'box-shadow:0 28px 90px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.08)',
        'backdrop-filter:blur(18px)',
        'padding:26px'
    ].join(';');
    return panel;
}

function showManagedViewingBlockedOverlay(decision) {
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

        const profileName = String(decision.profileName || 'This profile').trim() || 'This profile';
        const surfaceLabel = decision.surface === 'kids' ? 'YouTube Kids' : 'YouTube';
        overlay.innerHTML = '';
        appendManagedOverlayBackground(overlay);

        const panel = createManagedOverlayPanel();

        const eyebrow = document.createElement('div');
        eyebrow.textContent = 'FilterTube managed profile';
        eyebrow.style.cssText = 'color:#fca5a5;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0;margin-bottom:10px';

        const title = document.createElement('h1');
        title.textContent = `${surfaceLabel} is not available for this profile`;
        title.style.cssText = 'font-size:23px;line-height:1.2;margin:0 0 10px;font-weight:800;color:#fff';

        const copy = document.createElement('p');
        copy.textContent = `${profileName} can use only the viewing spaces approved by the parent or caregiver profile.`;
        copy.style.cssText = 'font-size:14px;line-height:1.5;margin:0;color:#cbd5e1';

        const dashboardButton = document.createElement('button');
        dashboardButton.type = 'button';
        dashboardButton.textContent = 'Open FilterTube';
        dashboardButton.style.cssText = [
            'min-height:44px',
            'width:100%',
            'margin-top:20px',
            'border:1px solid rgba(255,255,255,.22)',
            'border-radius:8px',
            'background:rgba(18,27,38,.82)',
            'color:#e2e8f0',
            'font-weight:800',
            'font-size:14px',
            'cursor:pointer'
        ].join(';');
        dashboardButton.addEventListener('click', () => {
            openFilterTubeDashboardFromManagedOverlay('managed_viewing_route_gate');
        });

        panel.appendChild(eyebrow);
        panel.appendChild(title);
        panel.appendChild(copy);
        panel.appendChild(dashboardButton);
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
    if (!total) return '0m';
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${Math.max(1, minutes)}m`;
}

function formatManagedTimeRemaining(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!total) return '0s';
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainder = total % 60;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m ${remainder}s`;
    return `${remainder}s`;
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

        const profileName = String(state.profileName || 'Protected profile').trim() || 'Protected profile';
        const surfaceLabel = state.surface === 'kids' ? 'YouTube Kids' : 'YouTube';
        const timeLeft = formatManagedTimeRemaining(remainingSeconds);
        status.textContent = `${surfaceLabel} time left: ${timeLeft}`;
        status.title = `${profileName} has ${timeLeft} left today.`;
    } catch (e) {
    }
}

function showManagedTimeoutOverlay(state) {
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

        const profileName = String(state?.profileName || 'This profile').trim() || 'This profile';
        const surfaceLabel = state?.surface === 'kids' ? 'YouTube Kids' : 'YouTube';
        const timezone = String(state?.timezone || '').trim();
        const resetCopy = timezone
            ? `Resets at midnight (${timezone}).`
            : 'Resets at the next daily policy reset.';
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
        brandText.textContent = 'FilterTube · profile time';
        brand.append(brandMark, brandText);

        const eyebrow = document.createElement('div');
        eyebrow.className = 'filtertube-managed-overlay__eyebrow';
        eyebrow.textContent = policyExpired ? 'Parent review needed' : 'Daily pause reached';

        const title = document.createElement('h1');
        title.id = 'filtertube-managed-timeout-title';
        title.className = 'filtertube-managed-overlay__title';
        title.append(document.createTextNode(policyExpired ? `${surfaceLabel} needs ` : `Today's watching time is `));
        const titleEmphasis = document.createElement('span');
        titleEmphasis.className = 'filtertube-managed-overlay__title-emphasis';
        titleEmphasis.textContent = policyExpired ? 'parent approval.' : 'complete.';
        title.appendChild(titleEmphasis);

        const copy = document.createElement('p');
        copy.className = 'filtertube-managed-overlay__lede';
        copy.textContent = policyExpired
            ? `${profileName} needs a parent or caregiver to review this time rule before ${surfaceLabel} can continue.`
            : `${profileName} has used today's YouTube time allowance. ${surfaceLabel} stays paused until the daily reset or until more time is approved.`;

        const profilePill = document.createElement('div');
        profilePill.className = 'filtertube-managed-overlay__profile';
        profilePill.textContent = `${profileName} · ${surfaceLabel}`;

        story.append(brand, eyebrow, title, copy, profilePill);

        const aside = document.createElement('aside');
        aside.className = 'filtertube-managed-overlay__aside';

        const facts = document.createElement('dl');
        facts.className = 'filtertube-managed-overlay__facts';
        [
            ['Daily limit', totalBudgetCopy],
            ['Used today', usedCopy],
            ['Reset', resetCopy]
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
            ? 'Switch to a parent, caregiver, or another authorized profile. The exhausted profile cannot dismiss this screen or approve its own access.'
            : 'Switching profiles follows the normal PIN check. A request for more time is saved for parent review, but never unlocks this profile by itself.';

        const actionArea = document.createElement('div');
        actionArea.className = 'filtertube-managed-overlay__actions';

        const profileSwitcher = document.createElement('div');
        profileSwitcher.className = 'filtertube-managed-overlay__profiles';
        profileSwitcher.hidden = true;

        const switchButton = document.createElement('button');
        switchButton.type = 'button';
        switchButton.className = 'filtertube-managed-overlay__button filtertube-managed-overlay__button--primary';
        switchButton.textContent = 'Switch profile';
        switchButton.addEventListener('click', () => {
            if (!profileSwitcher.hidden) {
                profileSwitcher.hidden = true;
                profileSwitcher.innerHTML = '';
                switchButton.textContent = 'Switch profile';
                return;
            }
            switchButton.disabled = true;
            switchButton.textContent = 'Loading profiles…';
            browserAPI_BRIDGE.runtime.sendMessage({
                action: 'FilterTube_GetManagedProfileSwitchOptions'
            }, response => {
                switchButton.disabled = false;
                switchButton.textContent = 'Cancel profile switch';
                profileSwitcher.hidden = false;
                profileSwitcher.innerHTML = '';
                const options = Array.isArray(response?.options) ? response.options : [];
                if (!response?.ok || !options.length) {
                    const empty = document.createElement('p');
                    empty.className = 'filtertube-managed-overlay__instruction';
                    empty.setAttribute('data-visible', 'true');
                    empty.textContent = response?.ok
                        ? 'No other profile is available on this device.'
                        : 'Profiles could not be loaded. Keep this page open and try again.';
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
                    name.textContent = option.profileName || 'Profile';
                    const type = document.createElement('span');
                    type.className = 'filtertube-managed-overlay__profile-type';
                    type.textContent = option.type === 'child' ? 'Protected profile' : 'Account profile';
                    meta.append(name, type);
                    const lock = document.createElement('span');
                    lock.className = 'filtertube-managed-overlay__profile-lock';
                    lock.textContent = option.requiresPin ? 'PIN' : 'Open';
                    optionButton.append(avatar, meta, lock);
                    optionButton.addEventListener('click', () => {
                        let pin = '';
                        if (option.requiresPin) {
                            pin = String(window.prompt(`Enter the PIN for ${option.profileName || 'this profile'}`) || '').trim();
                            if (!pin) return;
                        }
                        optionButton.disabled = true;
                        lock.textContent = 'Switching…';
                        browserAPI_BRIDGE.runtime.sendMessage({
                            action: 'FilterTube_SwitchManagedProfile',
                            targetProfileId: option.profileId,
                            pin
                        }, result => {
                            if (result?.ok) {
                                instruction.textContent = `Switching to ${result.profileName || option.profileName || 'profile'}…`;
                                instruction.setAttribute('data-visible', 'true');
                                profileSwitcher.querySelectorAll('button').forEach(button => { button.disabled = true; });
                                return;
                            }
                            optionButton.disabled = false;
                            lock.textContent = option.requiresPin ? 'PIN' : 'Open';
                            instruction.textContent = result?.reason === 'rate_limited'
                                ? 'Too many incorrect PIN attempts. Wait before trying again.'
                                : (result?.reason === 'incorrect_pin' ? 'That PIN was not correct.' : 'Profile switch failed. Try again.');
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
        askButton.textContent = 'Request more time';

        const instruction = document.createElement('p');
        instruction.className = 'filtertube-managed-overlay__instruction';
        instruction.textContent = 'Request saved here only tells the parent profile that more time is needed. It does not unlock YouTube by itself.';

        askButton.addEventListener('click', () => {
            instruction.setAttribute('data-visible', 'true');
            askButton.textContent = 'Request sent';
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
                                ? 'Request saved for parent review. YouTube stays paused until a parent or caregiver grants more time from FilterTube.'
                                : 'A recent request is already saved for parent review. YouTube stays paused until more time is granted from FilterTube.';
                        } else {
                            instruction.textContent = 'A parent or caregiver can still open FilterTube and grant more time from a trusted profile. This button did not unlock YouTube.';
                        }
                        pauseManagedTimeoutVideos();
                    });
                } catch (e) {
                    instruction.textContent = 'A parent or caregiver can still open FilterTube and grant more time from a trusted profile. This button did not unlock YouTube.';
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

    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: 'FilterTube_ManagedTimeLimitHeartbeat',
            profileId: policy.profileId,
            policy,
            href: location.href,
            visible: document.visibilityState === 'visible',
            focused: isManagedTimeLimitTabActive(),
            playing: isManagedTimeLimitPlaybackActive()
        }, response => {
            managedTimeLimitHeartbeatInFlight = false;
            if (heartbeatGeneration !== managedTimeLimitRuntimeGeneration) return;
            const err = browserAPI_BRIDGE.runtime?.lastError;
            if (!err && response?.enforced === true && response.timedOut === true) {
                showManagedTimeoutOverlay(response);
            } else if (!err && response?.enforced === true && response?.timedOut !== true) {
                removeManagedTimeoutOverlay();
                showManagedTimeLimitStatus(response);
            } else if (!err && response?.timedOut !== true) {
                removeManagedTimeLimitStatus();
                removeManagedTimeoutOverlay();
            } else {
                removeManagedTimeLimitStatus();
                removeManagedTimeoutOverlay();
            }
            if (managedTimeLimitPendingHeartbeat) {
                managedTimeLimitPendingHeartbeat = false;
                sendManagedTimeLimitHeartbeat();
            }
        });
    } catch (e) {
        managedTimeLimitHeartbeatInFlight = false;
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

function tryApplySettingsToSeed(settings) {
    if (window.filterTube?.updateSettings) {
        try {
            window.filterTube.updateSettings(settings);
            pendingSeedSettings = null;
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
            tryApplySettingsToSeed(pendingSeedSettings);
        }
    });
}

function scheduleSeedRetry() {
    setTimeout(() => {
        if (pendingSeedSettings) {
            if (!tryApplySettingsToSeed(pendingSeedSettings)) {
                scheduleSeedRetry();
            }
        }
    }, 250);
}

function sendSettingsToMainWorld(settings) {
    latestSettings = settings;
    currentSettings = settings;

    if (applyManagedViewingRouteGate(settings)) {
        releaseManagedTimeLimitRuntime();
        pendingSeedSettings = null;
        return;
    }
    applyManagedTimeLimitRuntime(settings);

    window.postMessage({
        type: 'FilterTube_SettingsToInjector',
        payload: settings,
        source: 'content_bridge'
    }, '*');

    if (!tryApplySettingsToSeed(settings)) {
        pendingSeedSettings = settings;
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
    ].includes(key))) return true;
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
        // FIX: Apply changes IMMEDIATELY without debounce
        scheduleSettingsRefreshFromStorage({ forceReprocess: !(isVideoChannelMapOnly || isVideoMetaMapOnly) });
    }
}

try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }
