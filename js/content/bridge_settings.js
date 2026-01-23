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

browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request) return;

    if (request.action === 'FilterTube_RefreshNow') {
        debugLog('🔄 Refresh requested via runtime messaging');
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
        sendResponse?.({ acknowledged: true });
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        debugLog('⚡ Applying settings pushed from UI');
        sendSettingsToMainWorld(request.settings);
        applyDOMFallback(request.settings, { forceReprocess: true });
        sendResponse?.({ acknowledged: true });
    }
});

let pendingSeedSettings = null;
let seedListenerAttached = false;

function requestSettingsFromBackground() {
    return new Promise((resolve) => {
        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings" }, (response) => {
            if (response && !response.error) {
                sendSettingsToMainWorld(response);
                resolve({ success: true, settings: response });
            } else {
                resolve({ success: false });
            }
        });
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
}

let pendingStorageRefreshTimer = 0;
let lastStorageRefreshTs = 0;
const MIN_STORAGE_REFRESH_INTERVAL_MS = 250;

function scheduleSettingsRefreshFromStorage() {
    const now = Date.now();
    const elapsed = now - lastStorageRefreshTs;
    if (elapsed >= MIN_STORAGE_REFRESH_INTERVAL_MS && !pendingStorageRefreshTimer) {
        lastStorageRefreshTs = now;
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
        return;
    }

    if (pendingStorageRefreshTimer) return;
    const delay = Math.max(0, MIN_STORAGE_REFRESH_INTERVAL_MS - elapsed);
    pendingStorageRefreshTimer = setTimeout(() => {
        pendingStorageRefreshTimer = 0;
        lastStorageRefreshTs = Date.now();
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
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
    const relevantKeys = [
        'enabled',
        'filterKeywords',
        'filterKeywordsComments',
        'filterChannels',
        'uiChannels',
        'ftProfilesV3',
        'ftProfilesV4',
        'channelMap',
        'videoChannelMap', // Needed so Shorts videoId → channelId updates re-apply settings
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
        'hideSearchShelves'
    ];
    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {
        // FIX: Apply changes IMMEDIATELY without debounce
        scheduleSettingsRefreshFromStorage();
    }
}

try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }
