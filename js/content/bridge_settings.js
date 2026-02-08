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

function requestSettingsFromBackground() {
    return new Promise((resolve) => {
        const profileType = (() => {
            try {
                const host = String(location?.hostname || '').toLowerCase();
                return host.includes('youtubekids.com') ? 'kids' : 'main';
            } catch (e) {
                return 'main';
            }
        })();

        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings", profileType }, (response) => {
            if (response && !response.error) {
                try {
                    const resolvedProfile = response.profileType === 'kids'
                        ? 'kids'
                        : (response.profileType === 'main' ? 'main' : '');
                    if (resolvedProfile && resolvedProfile !== profileType) {
                        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings", profileType, forceRefresh: true }, (retry) => {
                            if (retry && !retry.error) {
                                const normalized = normalizeSettingsForHost(retry);
                                sendSettingsToMainWorld(normalized);
                                resolve({ success: true, settings: normalized });
                            } else {
                                const normalized = normalizeSettingsForHost(response);
                                sendSettingsToMainWorld(normalized);
                                resolve({ success: true, settings: normalized });
                            }
                        });
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

function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {
    const now = Date.now();
    const elapsed = now - lastStorageRefreshTs;
    if (elapsed >= MIN_STORAGE_REFRESH_INTERVAL_MS && !pendingStorageRefreshTimer) {
        lastStorageRefreshTs = now;
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: forceReprocess === true });
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
                applyDOMFallback(result.settings, { forceReprocess: forceReprocess === true });
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
