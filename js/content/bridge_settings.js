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
                    console.log('FilterTube: Subscription import request timed out');
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

            console.log('FilterTube: Sent subscriptions import request to Main World');
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
            requestSettingsFromBackground().then(result => {
                if (result?.success) {
                    applyDOMFallback(result.settings, { forceReprocess: true });
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

function openFilterTubeDashboardFromManagedOverlay(source) {
    try {
        pauseManagedTimeoutVideos();
    } catch (e) {
    }
    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: 'FilterTube_OpenDashboard',
            source: source || 'managed_overlay'
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

function applyManagedOverlayShell(overlay) {
    if (!overlay) return;
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
    scrim.style.cssText = [
        'position:absolute',
        'inset:0',
        'background:linear-gradient(135deg,rgba(8,13,18,.78),rgba(15,23,42,.62) 45%,rgba(27,38,48,.72))',
        'pointer-events:none'
    ].join(';');
    overlay.appendChild(scrim);
}

function createManagedOverlayPanel() {
    const panel = document.createElement('section');
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
        if (settings.activeProfileKind !== 'child') return null;
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

function pauseManagedTimeoutVideos() {
    try {
        document.querySelectorAll('video').forEach(video => {
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
        const timeLeft = formatManagedTimeoutDuration(remainingSeconds);
        status.textContent = `${surfaceLabel} time left: ${timeLeft}`;
        status.title = `${profileName} has ${timeLeft} left today.`;
    } catch (e) {
    }
}

function showManagedTimeoutOverlay(state) {
    try {
        globalThis.__filtertubeManagedTimeLimitTimedOut = true;
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
        overlay.innerHTML = '';
        appendManagedOverlayBackground(overlay);

        const panel = createManagedOverlayPanel();

        const eyebrow = document.createElement('div');
        eyebrow.textContent = 'FilterTube parent-managed time';
        eyebrow.style.cssText = 'color:#fca5a5;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0;margin-bottom:10px';

        const title = document.createElement('h1');
        title.textContent = policyExpired ? `${surfaceLabel} needs parent approval` : `${surfaceLabel} time is finished for today`;
        title.style.cssText = 'font-size:23px;line-height:1.2;margin:0 0 10px;font-weight:800;color:#fff';

        const copy = document.createElement('p');
        copy.textContent = policyExpired
            ? `${profileName} needs a parent or caregiver to review this time rule before ${surfaceLabel} can continue.`
            : `${profileName} has used today's parent-managed YouTube time. Come back after the daily reset, or ask a parent for more time.`;
        copy.style.cssText = 'font-size:14px;line-height:1.5;margin:0;color:#cbd5e1';

        const facts = document.createElement('dl');
        facts.style.cssText = [
            'display:grid',
            'grid-template-columns:auto 1fr',
            'gap:8px 14px',
            'margin:18px 0 0',
            'font-size:13px',
            'line-height:1.35'
        ].join(';');
        [
            ['Daily limit', totalBudgetCopy],
            ['Used today', usedCopy],
            ['Reset', resetCopy]
        ].forEach(([label, value]) => {
            const dt = document.createElement('dt');
            dt.textContent = label;
            dt.style.cssText = 'margin:0;color:#94a3b8;font-weight:700';
            const dd = document.createElement('dd');
            dd.textContent = value;
            dd.style.cssText = 'margin:0;color:#e2e8f0';
            facts.append(dt, dd);
        });

        const actionArea = document.createElement('div');
        actionArea.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'gap:10px',
            'margin-top:20px'
        ].join(';');

        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = [
            'display:grid',
            'grid-template-columns:repeat(auto-fit,minmax(160px,1fr))',
            'gap:10px'
        ].join(';');

        const askButton = document.createElement('button');
        askButton.type = 'button';
        askButton.textContent = 'Ask parent for more time';
        askButton.style.cssText = [
            'min-height:44px',
            'border:0',
            'border-radius:8px',
            'background:#b44339',
            'color:#fff',
            'font-weight:800',
            'font-size:14px',
            'cursor:pointer'
        ].join(';');

        const dashboardButton = document.createElement('button');
        dashboardButton.type = 'button';
        dashboardButton.textContent = 'Open FilterTube';
        dashboardButton.style.cssText = [
            'min-height:44px',
            'border:1px solid rgba(255,255,255,.22)',
            'border-radius:8px',
            'background:rgba(18,27,38,.82)',
            'color:#e2e8f0',
            'font-weight:800',
            'font-size:14px',
            'cursor:pointer'
        ].join(';');
        dashboardButton.addEventListener('click', () => {
            openFilterTubeDashboardFromManagedOverlay('managed_time_limit_overlay');
        });

        const instruction = document.createElement('p');
        instruction.textContent = 'Request saved here only tells the parent profile that more time is needed. It does not unlock YouTube by itself.';
        instruction.style.cssText = [
            'display:none',
            'margin:0',
            'padding:10px 12px',
            'border:1px solid rgba(148,163,184,.24)',
            'border-radius:8px',
            'background:rgba(15,23,42,.72)',
            'color:#cbd5e1',
            'font-size:13px',
            'line-height:1.45'
        ].join(';');

        askButton.addEventListener('click', () => {
            instruction.style.display = 'block';
            askButton.textContent = 'Waiting for parent approval';
            askButton.style.background = '#475569';
            askButton.disabled = true;
            askButton.style.cursor = 'default';
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
                                ? 'Request saved. A parent or caregiver can open FilterTube, review the request, and grant more time from a trusted profile.'
                                : 'A recent request is already saved. A parent or caregiver can review it from FilterTube.';
                        } else {
                            instruction.textContent = 'A parent or caregiver can still open FilterTube and grant more time from a trusted profile.';
                        }
                        pauseManagedTimeoutVideos();
                    });
                } catch (e) {
                    instruction.textContent = 'A parent or caregiver can still open FilterTube and grant more time from a trusted profile.';
                }
            }
        });
        buttonRow.append(askButton, dashboardButton);
        actionArea.append(buttonRow, instruction);

        panel.appendChild(eyebrow);
        panel.appendChild(title);
        panel.appendChild(copy);
        panel.appendChild(facts);
        panel.appendChild(actionArea);
        overlay.appendChild(panel);
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
            focused: isManagedTimeLimitTabActive()
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
        // FIX: Apply changes IMMEDIATELY without debounce
        scheduleSettingsRefreshFromStorage({ forceReprocess: !(isVideoChannelMapOnly || isVideoMetaMapOnly) });
    }
}

try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }
