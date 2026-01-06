// background.js

/**
 * Background / service worker entrypoint.
 *
 * Responsibilities in this file now include:
 * - Hydrating release notes payloads from data/release_notes.json
 * - Tracking whether the current version’s release notes have been seen
 * - Opening the dashboard tab in response to CTA clicks from the content banner
 * - (Plus the long-standing storage + messaging plumbing below)
 */


// Load shared identity helpers in MV3 service worker environments (Chrome/Opera).
// Firefox MV3 can also load `js/shared/identity.js` via manifest ordering.
try {
    if (typeof importScripts === 'function' && !globalThis.FilterTubeIdentity) {
        importScripts('shared/identity.js');
    }
} catch (e) {
    console.warn('FilterTube Background: Failed to load shared identity helpers', e);
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeObject(value) {
    return value && typeof value === 'object' ? value : {};
}

function nowTs() {
    return Date.now();
}

function buildAutoBackupPayload({ settings, profilesV3, theme }) {
    const s = safeObject(settings);
    const p = safeObject(profilesV3);
    const mainProfile = safeObject(p.main);
    const kidsProfile = safeObject(p.kids);

    return {
        meta: {
            version: 3,
            timestamp: nowTs(),
            application: 'FilterTube',
            exportType: 'full'
        },
        settings: {
            theme: theme === 'dark' ? 'dark' : 'light',
            sync: {
                enabled: false,
                deviceName: null
            },
            main: {
                mode: typeof mainProfile.mode === 'string' ? mainProfile.mode : 'blocklist',
                hideShorts: !!s.hideShorts,
                hideComments: !!s.hideComments,
                filterComments: !!s.filterComments,
                hideHomeFeed: !!s.hideHomeFeed,
                hideSponsoredCards: !!s.hideSponsoredCards,
                hideWatchPlaylistPanel: !!s.hideWatchPlaylistPanel,
                hidePlaylistCards: !!s.hidePlaylistCards,
                hideMembersOnly: !!s.hideMembersOnly,
                hideMixPlaylists: !!s.hideMixPlaylists,
                hideVideoSidebar: !!s.hideVideoSidebar,
                hideRecommended: !!s.hideRecommended,
                hideLiveChat: !!s.hideLiveChat,
                hideVideoInfo: !!s.hideVideoInfo,
                hideVideoButtonsBar: !!s.hideVideoButtonsBar,
                hideAskButton: !!s.hideAskButton,
                hideVideoChannelRow: !!s.hideVideoChannelRow,
                hideVideoDescription: !!s.hideVideoDescription,
                hideMerchTicketsOffers: !!s.hideMerchTicketsOffers,
                hideEndscreenVideowall: !!s.hideEndscreenVideowall,
                hideEndscreenCards: !!s.hideEndscreenCards,
                disableAutoplay: !!s.disableAutoplay,
                disableAnnotations: !!s.disableAnnotations,
                hideTopHeader: !!s.hideTopHeader,
                hideNotificationBell: !!s.hideNotificationBell,
                hideExploreTrending: !!s.hideExploreTrending,
                hideMoreFromYouTube: !!s.hideMoreFromYouTube,
                hideSubscriptions: !!s.hideSubscriptions,
                hideSearchShelves: !!s.hideSearchShelves,
                applyKidsRulesOnMain: !!mainProfile.applyKidsRulesOnMain
            },
            kids: {
                mode: typeof kidsProfile.mode === 'string' ? kidsProfile.mode : 'whitelist',
                strictMode: kidsProfile.strictMode !== false,
                enableSearch: true
            }
        },
        profiles: {
            main: {
                channels: safeArray(s.channels),
                keywords: safeArray(s.keywords),
                videoIds: safeArray(mainProfile.videoIds),
                whitelistedChannels: safeArray(mainProfile.whitelistedChannels),
                whitelistedKeywords: safeArray(mainProfile.whitelistedKeywords),
                subscriptions: safeArray(mainProfile.subscriptions)
            },
            kids: {
                blockedChannels: safeArray(kidsProfile.blockedChannels),
                blockedKeywords: safeArray(kidsProfile.blockedKeywords),
                whitelistedChannels: safeArray(kidsProfile.whitelistedChannels),
                whitelistedKeywords: safeArray(kidsProfile.whitelistedKeywords),
                videoIds: safeArray(kidsProfile.videoIds),
                subscriptions: safeArray(kidsProfile.subscriptions)
            }
        },
        intelligence: {
            thumbnail: {
                blurNsfw: false,
                blurClickbait: false
            },
            semantic: {
                enabled: false,
                rules: []
            }
        },
        maps: {
            channelMap: safeObject(s.channelMap)
        }
    };
}

function readAutoBackupState() {
    return new Promise(resolve => {
        browserAPI.storage.local.get([
            'enabled',
            'uiKeywords',
            'filterChannels',
            'hideAllShorts',
            'hideAllComments',
            'filterComments',
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
            'hideSearchShelves',
            'channelMap',
            'ftProfilesV3',
            'ftThemePreference'
        ], items => {
            const theme = items?.ftThemePreference === 'dark' ? 'dark' : 'light';
            const settings = {
                enabled: items?.enabled !== false,
                channels: safeArray(items?.filterChannels),
                keywords: safeArray(items?.uiKeywords),
                hideShorts: !!items?.hideAllShorts,
                hideComments: !!items?.hideAllComments,
                filterComments: !!items?.filterComments,
                hideHomeFeed: !!items?.hideHomeFeed,
                hideSponsoredCards: !!items?.hideSponsoredCards,
                hideWatchPlaylistPanel: !!items?.hideWatchPlaylistPanel,
                hidePlaylistCards: !!items?.hidePlaylistCards,
                hideMembersOnly: !!items?.hideMembersOnly,
                hideMixPlaylists: !!items?.hideMixPlaylists,
                hideVideoSidebar: !!items?.hideVideoSidebar,
                hideRecommended: !!items?.hideRecommended,
                hideLiveChat: !!items?.hideLiveChat,
                hideVideoInfo: !!items?.hideVideoInfo,
                hideVideoButtonsBar: !!items?.hideVideoButtonsBar,
                hideAskButton: !!items?.hideAskButton,
                hideVideoChannelRow: !!items?.hideVideoChannelRow,
                hideVideoDescription: !!items?.hideVideoDescription,
                hideMerchTicketsOffers: !!items?.hideMerchTicketsOffers,
                hideEndscreenVideowall: !!items?.hideEndscreenVideowall,
                hideEndscreenCards: !!items?.hideEndscreenCards,
                disableAutoplay: !!items?.disableAutoplay,
                disableAnnotations: !!items?.disableAnnotations,
                hideTopHeader: !!items?.hideTopHeader,
                hideNotificationBell: !!items?.hideNotificationBell,
                hideExploreTrending: !!items?.hideExploreTrending,
                hideMoreFromYouTube: !!items?.hideMoreFromYouTube,
                hideSubscriptions: !!items?.hideSubscriptions,
                hideSearchShelves: !!items?.hideSearchShelves,
                channelMap: safeObject(items?.channelMap),
                theme
            };
            const profilesV3 = safeObject(items?.ftProfilesV3);
            resolve({ settings, profilesV3, theme });
        });
    });
}

function rotateAutoBackups(keepCount = 10) {
    return new Promise(resolve => {
        if (!browserAPI.downloads || typeof browserAPI.downloads.search !== 'function') {
            resolve();
            return;
        }

        browserAPI.downloads.search({
            query: 'FilterTube-Backup-',
            limit: 100
        }, results => {
            const items = Array.isArray(results) ? results : [];
            const backups = items
                .filter(d => (d?.filename || '').includes('FilterTube-Backup-'))
                .sort((a, b) => {
                    const at = (a?.endTime ? new Date(a.endTime).getTime() : 0);
                    const bt = (b?.endTime ? new Date(b.endTime).getTime() : 0);
                    return bt - at;
                });

            const toDelete = backups.slice(keepCount);
            if (toDelete.length === 0) {
                resolve();
                return;
            }

            let remaining = toDelete.length;
            toDelete.forEach(file => {
                try {
                    browserAPI.downloads.erase({ id: file.id }, () => {
                        remaining -= 1;
                        if (remaining <= 0) resolve();
                    });
                } catch (e) {
                    remaining -= 1;
                    if (remaining <= 0) resolve();
                }
            });
        });
    });
}

async function createAutoBackupInBackground(triggerType, options = {}) {
    if (!browserAPI.downloads || typeof browserAPI.downloads.download !== 'function') {
        return { ok: false, reason: 'downloads_unavailable' };
    }

    try {
        const flag = await new Promise(resolve => {
            browserAPI.storage.local.get(['ftAutoBackupEnabled'], items => {
                resolve(items?.ftAutoBackupEnabled !== false);
            });
        });
        if (!flag) {
            return { ok: true, skipped: true, reason: 'disabled' };
        }
    } catch (e) {
    }

    const { settings, profilesV3, theme } = await readAutoBackupState();
    const payload = buildAutoBackupPayload({ settings, profilesV3, theme });

    payload.meta.backupType = 'auto';
    payload.meta.trigger = triggerType || 'unknown';
    payload.meta.backupLocation = 'FilterTube Backup';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `FilterTube-Backup-${timestamp}.json`;
    const fullPath = `FilterTube Backup/${fileName}`;

    const jsonData = JSON.stringify(payload, null, 2);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`;

    return new Promise(resolve => {
        browserAPI.downloads.download({
            url: dataUrl,
            filename: fullPath,
            saveAs: false
        }, downloadId => {
            const err = browserAPI.runtime?.lastError;
            if (err) {
                resolve({ ok: false, reason: err.message || 'download_failed' });
                return;
            }

            if (!options?.skipRotation) {
                rotateAutoBackups(10).finally(() => resolve({ ok: true, filename: fullPath, downloadId }));
            } else {
                resolve({ ok: true, filename: fullPath, downloadId });
            }
        });
    });
}

function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {
    pendingAutoBackupTrigger = triggerType;
    pendingAutoBackupOptions = options;

    if (autoBackupTimer) {
        clearTimeout(autoBackupTimer);
    }

    autoBackupTimer = setTimeout(async () => {
        const trigger = pendingAutoBackupTrigger;
        const opts = pendingAutoBackupOptions;
        pendingAutoBackupTrigger = null;
        pendingAutoBackupOptions = null;
        autoBackupTimer = null;
        try {
            await createAutoBackupInBackground(trigger, opts || {});
        } catch (e) {
            console.warn('FilterTube Background: Auto-backup failed', e);
        }
    }, delay);
}


// Browser detection for compatibility
const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI = IS_FIREFOX ? browser : chrome;
const SHORTS_PARTIAL_STREAM_LIMIT = 51200;
const WATCH_PARTIAL_STREAM_LIMIT = 2000000;
const SHORTS_FETCH_TIMEOUT_MS = 8000;
const pendingShortsIdentityFetches = new Map();
const shortsIdentitySessionCache = new Map();
const pendingWatchIdentityFetches = new Map();
const watchIdentitySessionCache = new Map();
const pendingKidsWatchIdentityFetches = new Map();
const kidsWatchIdentitySessionCache = new Map();
const CURRENT_VERSION = (browserAPI.runtime.getManifest()?.version || '').trim();
// Deep link into the tab-view dashboard; query param avoids hash-only navigation
// so we can reliably parse intent even when hash stripping occurs.
const WHATS_NEW_PAGE_URL = browserAPI.runtime.getURL('html/tab-view.html?view=whatsnew');
const RELEASE_NOTES_TEMPLATE = {
    headline: 'FilterTube just updated',
    body: 'Open the dashboard → What’s New tab to see the latest highlights.',
    link: WHATS_NEW_PAGE_URL,
    ctaLabel: 'Open What’s New'
};
let releaseNotesCache = null;
let compiledSettingsCache = { main: null, kids: null };

let videoChannelMapCache = null;
let videoChannelMapLoadPromise = null;
let videoChannelMapFlushPromise = Promise.resolve();
let videoChannelMapFlushTimer = null;
const pendingVideoChannelMapUpdates = new Map();

let autoBackupTimer = null;
let pendingAutoBackupTrigger = null;
let pendingAutoBackupOptions = null;

function isKidsUrl(url) {
    return typeof url === 'string' && url.includes('youtubekids.com');
}

function ensureVideoChannelMapCache() {
    if (videoChannelMapCache && typeof videoChannelMapCache === 'object') {
        return Promise.resolve(videoChannelMapCache);
    }
    if (videoChannelMapLoadPromise) return videoChannelMapLoadPromise;

    videoChannelMapLoadPromise = storageGet(['videoChannelMap']).then(result => {
        const stored = result?.videoChannelMap;
        videoChannelMapCache = stored && typeof stored === 'object' ? { ...stored } : {};
        videoChannelMapLoadPromise = null;
        return videoChannelMapCache;
    }).catch(() => {
        videoChannelMapCache = {};
        videoChannelMapLoadPromise = null;
        return videoChannelMapCache;
    });

    return videoChannelMapLoadPromise;
}

function enforceVideoChannelMapCap(map) {
    if (!map || typeof map !== 'object') return;
    const keys = Object.keys(map);
    if (keys.length <= 1000) return;
    keys.slice(0, 100).forEach(k => {
        try {
            delete map[k];
        } catch (e) {
        }
    });
}

function flushVideoChannelMapUpdates() {
    videoChannelMapFlushPromise = videoChannelMapFlushPromise.then(async () => {
        if (pendingVideoChannelMapUpdates.size === 0) return;
        const map = await ensureVideoChannelMapCache();
        for (const [videoId, channelId] of pendingVideoChannelMapUpdates.entries()) {
            if (!videoId || !channelId) continue;
            map[videoId] = channelId;
        }
        pendingVideoChannelMapUpdates.clear();
        enforceVideoChannelMapCap(map);
        await browserAPI.storage.local.set({ videoChannelMap: map });
    }).catch(() => {
    });
    return videoChannelMapFlushPromise;
}

function scheduleVideoChannelMapFlush() {
    if (videoChannelMapFlushTimer) return;
    videoChannelMapFlushTimer = setTimeout(() => {
        videoChannelMapFlushTimer = null;
        flushVideoChannelMapUpdates();
    }, 50);
}

function enqueueVideoChannelMapUpdate(videoId, channelId) {
    const v = typeof videoId === 'string' ? videoId.trim() : '';
    const c = typeof channelId === 'string' ? channelId.trim() : '';
    if (!v || !c) return;
    pendingVideoChannelMapUpdates.set(v, c);

    if (videoChannelMapCache && typeof videoChannelMapCache === 'object') {
        videoChannelMapCache[v] = c;
    }
    scheduleVideoChannelMapFlush();
}

/**
 * Lazy-loads the curated release_notes.json file and caches it for the lifetime
 * of the service worker (until it’s terminated by MV3).
 */
async function loadReleaseNotesData() {
    if (releaseNotesCache) return releaseNotesCache;
    try {
        const url = browserAPI.runtime.getURL('data/release_notes.json');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        releaseNotesCache = await response.json();
    } catch (error) {
        console.warn('FilterTube Background: Failed to load release notes data', error);
        releaseNotesCache = [];
    }
    return releaseNotesCache;
}

/**
 * Looks up the given version in release_notes.json and builds the payload used
 * both in the dashboard cards and the YouTube banner CTA.
 */
async function buildReleaseNotesPayload(version) {
    try {
        const data = await loadReleaseNotesData();
        if (Array.isArray(data)) {
            const entry = data.find(note => note?.version === version);
            if (entry) {
                return {
                    version,
                    headline: entry.headline || RELEASE_NOTES_TEMPLATE.headline,
                    body: entry.bannerSummary || entry.summary || entry.body || RELEASE_NOTES_TEMPLATE.body,
                    link: WHATS_NEW_PAGE_URL,
                    ctaLabel: entry.ctaLabel || RELEASE_NOTES_TEMPLATE.ctaLabel
                };
            }
        }
    } catch (error) {
        console.warn('FilterTube Background: buildReleaseNotesPayload failed', error);
    }
    return Object.assign({ version, link: WHATS_NEW_PAGE_URL }, RELEASE_NOTES_TEMPLATE);
}

// Log when the background script loads with browser info
console.log(`FilterTube background script loaded in ${IS_FIREFOX ? 'Firefox' : 'Chrome/Edge/Other'}`);

// Function to compile settings from storage
// Function to compile settings from storage
async function getCompiledSettings(sender = null, profileType = null) {
    const senderUrl = sender?.tab?.url || sender?.url || '';
    const targetProfile = profileType === 'kids' || isKidsUrl(senderUrl) ? 'kids' : 'main';

    // Return cached settings if available
    if (compiledSettingsCache[targetProfile]) {
        return compiledSettingsCache[targetProfile];
    }

    return new Promise((resolve) => {
        browserAPI.storage.local.get([
            'enabled',
            'filterKeywords',
            'uiKeywords',
            'filterChannels',
            'useExactWordMatching',
            'filterKeywordsComments',
            'filterChannelsAdditionalKeywords',
            'uiChannels',
            'hideAllShorts',
            'hideAllComments',
            'filterComments',
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
            'hideSearchShelves',
            'channelMap',
            'videoChannelMap',
            'stats',
            'ftProfilesV3'
        ], (items) => {
            const compiledSettings = {};
            const storageUpdates = {};

            const shouldUseKidsProfile = targetProfile === 'kids';

            const storedCompiled = items.filterKeywords;
            const storedUiKeywords = Array.isArray(items.uiKeywords) ? items.uiKeywords : null;
            const storedUiChannels = Array.isArray(items.uiChannels) ? items.uiChannels : null;
            const useExact = items.useExactWordMatching || false;

            // Helper to validate compiled keyword entries
            const sanitizeCompiledList = (list = []) => list.filter(entry => {
                return entry && typeof entry.pattern === 'string' && typeof entry.flags === 'string';
            });

            if (Array.isArray(storedCompiled)) {
                compiledSettings.filterKeywords = sanitizeCompiledList(storedCompiled);

                // If we don't yet have uiKeywords, attempt to reconstruct them from the compiled list
                if (!storedUiKeywords && compiledSettings.filterKeywords.length) {
                    storageUpdates.uiKeywords = compiledSettings.filterKeywords.map(keyword => {
                        const isExact = keyword.pattern.startsWith('\\b') && keyword.pattern.endsWith('\\b');
                        const raw = keyword.pattern
                            .replace(/^\\b/, '')
                            .replace(/\\b$/, '')
                            .replace(/\\(.)/g, '$1');
                        return { word: raw, exact: isExact };
                    });
                }
            } else if (typeof storedCompiled === 'string') {
                // Legacy string storage fallback
                const keywordsString = storedCompiled;
                const parsedKeywords = keywordsString
                    .split(',')
                    .map(k => k.trim())
                    .filter(Boolean);

                compiledSettings.filterKeywords = parsedKeywords.map(keyword => {
                    try {
                        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        return {
                            pattern: useExact ? `\\b${escaped}\\b` : escaped,
                            flags: 'i'
                        };
                    } catch (error) {
                        console.error(`FilterTube: Invalid regex from legacy keyword: ${keyword}`, error);
                        return null;
                    }
                }).filter(Boolean);

                storageUpdates.filterKeywords = compiledSettings.filterKeywords;
                storageUpdates.uiKeywords = parsedKeywords.map(keyword => ({ word: keyword, exact: useExact }));
            } else {
                compiledSettings.filterKeywords = [];
            }

            // Comments-only keyword list (defaults to the full list if not present)
            const storedCompiledComments = items.filterKeywordsComments;
            if (Array.isArray(storedCompiledComments)) {
                compiledSettings.filterKeywordsComments = sanitizeCompiledList(storedCompiledComments);
            } else if (storedUiKeywords && Array.isArray(compiledSettings.filterKeywords) && compiledSettings.filterKeywords.length) {
                // Best-effort reconstruction from uiKeywords when possible.
                // If a uiKeywords entry has comments:false, exclude it.
                const uiKeywords = storedUiKeywords;
                const includeWords = new Set(
                    uiKeywords
                        .filter(k => k && typeof k.word === 'string' && (k.comments !== false))
                        .map(k => k.word.trim().toLowerCase())
                        .filter(Boolean)
                );
                if (includeWords.size > 0) {
                    compiledSettings.filterKeywordsComments = compiledSettings.filterKeywords.filter(kw => {
                        try {
                            const raw = typeof kw.pattern === 'string' ? kw.pattern : '';
                            const unwrapped = raw
                                .replace(/^\\b/, '')
                                .replace(/\\b$/, '')
                                .replace(/\\(.)/g, '$1')
                                .trim()
                                .toLowerCase();
                            return includeWords.has(unwrapped);
                        } catch (e) {
                            return true;
                        }
                    });
                } else {
                    compiledSettings.filterKeywordsComments = compiledSettings.filterKeywords;
                }
            } else {
                compiledSettings.filterKeywordsComments = compiledSettings.filterKeywords;
            }

            // Persist any migrations we calculated
            if (Object.keys(storageUpdates).length > 0) {
                browserAPI.storage.local.set(storageUpdates);
            }

            // Compile channels - preserve objects with name, id, handle, filterAll
            const storedProfilesV3 = items.ftProfilesV3 && typeof items.ftProfilesV3 === 'object' ? items.ftProfilesV3 : null;
            const kidsProfile = storedProfilesV3?.kids && typeof storedProfilesV3.kids === 'object' ? storedProfilesV3.kids : null;

            const storedChannels = shouldUseKidsProfile
                ? (Array.isArray(kidsProfile?.blockedChannels) ? kidsProfile.blockedChannels : [])
                : items.filterChannels;
            let compiledChannels = [];
            const additionalKeywordsFromChannels = [];

            if (Array.isArray(storedChannels)) {
                compiledChannels = storedChannels.map(ch => {
                    if (typeof ch === 'string') {
                        const trimmed = ch.trim();
                        // Legacy string format - convert to object format
                        return {
                            name: trimmed,
                            id: trimmed, // Preserve case for UC IDs
                            handle: null,
                            handleDisplay: trimmed || null,
                            canonicalHandle: null,
                            logo: null,
                            filterAll: false,
                            originalInput: trimmed
                        };
                    } else if (ch && typeof ch === 'object') {
                        // New object format - preserve the original case for IDs and handles
                        // canonicalHandle should only come from actual handle sources, not channel name
                        const canonicalHandle = ch.canonicalHandle || ch.handle || '';
                        // normalizedHandle must only be set if there's an actual @handle, never from channel name
                        const normalizedHandle = ch.handle ? ch.handle.toLowerCase() : (ch.canonicalHandle ? ch.canonicalHandle.toLowerCase() : null);
                        const displayHandle = ch.handleDisplay || canonicalHandle || ch.name || '';
                        const channelObj = {
                            name: ch.name,
                            id: ch.id || '', // Preserve case for UC IDs
                            handle: normalizedHandle,
                            handleDisplay: displayHandle || null,
                            canonicalHandle: canonicalHandle || null,
                            logo: ch.logo || null,
                            filterAll: !!ch.filterAll,
                            originalInput: ch.originalInput || ch.id || ch.handle || ch.name || null,
                            customUrl: ch.customUrl || null  // c/Name or user/Name for legacy channels
                        };

                        // If filterAll is enabled, add the channel name to keywords
                        if (channelObj.filterAll && channelObj.name && channelObj.name !== channelObj.id) {
                            const escaped = channelObj.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            additionalKeywordsFromChannels.push({
                                pattern: escaped,
                                flags: 'i'
                            });
                        }

                        return channelObj;
                    }
                    return null;
                }).filter(Boolean);

                const beforeCount = compiledChannels.length;
                compiledChannels = compiledChannels.filter(ch => {
                    if (!ch || typeof ch !== 'object') return false;
                    if (typeof ch.id === 'string' && ch.id.toUpperCase().startsWith('UC')) return true;
                    if (typeof ch.id === 'string' && ch.id.trim() !== '') return true;
                    console.warn('FilterTube Background: Dropping invalid channel entry missing id', ch);
                    return false;
                });

                if (compiledChannels.length !== beforeCount) {
                    if (!shouldUseKidsProfile) {
                        storageUpdates.filterChannels = compiledChannels;
                    }
                }
            } else if (typeof storedChannels === 'string') {
                // Legacy string format
                compiledChannels = storedChannels
                    .split(',')
                    .map(c => c.trim()) // Preserve case for UC IDs
                    .filter(Boolean)
                    .map(c => ({ name: c, id: c, handle: null, handleDisplay: c, canonicalHandle: null, filterAll: false }));
                if (!shouldUseKidsProfile) {
                    storageUpdates.filterChannels = compiledChannels;
                    storageUpdates.uiChannels = compiledChannels.map(ch => ch.name);
                }
            }

            compiledSettings.filterChannels = compiledChannels;

            // Merge channel-based keywords with existing keywords (with deduplication)
            if (additionalKeywordsFromChannels.length > 0) {
                // Create a Set of existing patterns for deduplication
                const existingPatterns = new Set(
                    compiledSettings.filterKeywords.map(kw => kw.pattern.toLowerCase())
                );

                // Only add channel keywords that don't already exist
                const uniqueChannelKeywords = additionalKeywordsFromChannels.filter(kw => {
                    return !existingPatterns.has(kw.pattern.toLowerCase());
                });

                if (uniqueChannelKeywords.length > 0) {
                    compiledSettings.filterKeywords = [
                        ...compiledSettings.filterKeywords,
                        ...uniqueChannelKeywords
                    ];
                }

                console.log(`FilterTube Background: Added ${uniqueChannelKeywords.length} unique channel-based keywords (${additionalKeywordsFromChannels.length - uniqueChannelKeywords.length} duplicates skipped)`);
            }

            // Pass through the channel map (UC ID <-> @handle mappings)
            compiledSettings.channelMap = items.channelMap || {};

            // Pass through the video-channel map (videoId -> channelId for Shorts persistence)
            compiledSettings.videoChannelMap = items.videoChannelMap || {};

            // Kids profile keyword compilation (YouTube Kids domain only)
            if (shouldUseKidsProfile) {
                const rawKidsKeywords = Array.isArray(kidsProfile?.blockedKeywords) ? kidsProfile.blockedKeywords : [];
                const compiledKidsKeywords = rawKidsKeywords.map(entry => {
                    try {
                        const word = typeof entry?.word === 'string' ? entry.word.trim() : '';
                        if (!word) return null;
                        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
                        const exact = entry?.exact === true;
                        return {
                            pattern: exact ? `\\b${escaped}\\b` : escaped,
                            flags: 'i'
                        };
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);

                // Preserve channel-derived keywords (Filter All) alongside kids keyword list.
                // We want: (kids keyword entries) + (channel-derived patterns) with de-dup.
                const mergedPatterns = [];
                const seen = new Set();
                const pushUnique = (entry) => {
                    if (!entry?.pattern) return;
                    const key = `${String(entry.pattern).toLowerCase()}::${String(entry.flags || '').toLowerCase()}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    mergedPatterns.push(entry);
                };

                compiledKidsKeywords.forEach(pushUnique);
                (additionalKeywordsFromChannels || []).forEach(pushUnique);

                compiledSettings.filterKeywords = mergedPatterns;
                compiledSettings.filterKeywordsComments = mergedPatterns;
            }

            // Pass through boolean flags
            compiledSettings.enabled = items.enabled !== false;
            compiledSettings.hideAllComments = items.hideAllComments || false;
            compiledSettings.filterComments = items.filterComments || false;
            compiledSettings.useExactWordMatching = useExact;
            compiledSettings.hideAllShorts = items.hideAllShorts || false;
            compiledSettings.hideHomeFeed = items.hideHomeFeed || false;
            compiledSettings.hideSponsoredCards = items.hideSponsoredCards || false;
            compiledSettings.hideWatchPlaylistPanel = items.hideWatchPlaylistPanel || false;
            compiledSettings.hidePlaylistCards = items.hidePlaylistCards || false;
            compiledSettings.hideMembersOnly = items.hideMembersOnly || false;
            compiledSettings.hideMixPlaylists = items.hideMixPlaylists || false;
            compiledSettings.hideVideoSidebar = items.hideVideoSidebar || false;
            compiledSettings.hideRecommended = items.hideRecommended || false;
            compiledSettings.hideLiveChat = items.hideLiveChat || false;
            compiledSettings.hideVideoInfo = items.hideVideoInfo || false;
            compiledSettings.hideVideoButtonsBar = items.hideVideoButtonsBar || false;
            compiledSettings.hideAskButton = items.hideAskButton || false;
            compiledSettings.hideVideoChannelRow = items.hideVideoChannelRow || false;
            compiledSettings.hideVideoDescription = items.hideVideoDescription || false;
            compiledSettings.hideMerchTicketsOffers = items.hideMerchTicketsOffers || false;
            compiledSettings.hideEndscreenVideowall = items.hideEndscreenVideowall || false;
            compiledSettings.hideEndscreenCards = items.hideEndscreenCards || false;
            compiledSettings.disableAutoplay = items.disableAutoplay || false;
            compiledSettings.disableAnnotations = items.disableAnnotations || false;
            compiledSettings.hideTopHeader = items.hideTopHeader || false;
            compiledSettings.hideNotificationBell = items.hideNotificationBell || false;
            compiledSettings.hideExploreTrending = items.hideExploreTrending || false;
            compiledSettings.hideMoreFromYouTube = items.hideMoreFromYouTube || false;
            compiledSettings.hideSubscriptions = items.hideSubscriptions || false;
            compiledSettings.hideSearchShelves = items.hideSearchShelves || false;

            console.log(`FilterTube Background: Compiled ${targetProfile} settings: ${compiledChannels.length} channels, ${compiledSettings.filterKeywords.length} keywords`);

            // Update cache
            compiledSettingsCache[targetProfile] = compiledSettings;

            resolve(compiledSettings);
        });
    });
}


// Extension installed or updated handler
browserAPI.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        console.log('FilterTube extension installed');

        // Initialize with some default settings
        browserAPI.storage.local.set({
            filterKeywords: '',
            filterChannels: '',
            useExactWordMatching: false,
            hideAllComments: false,
            filterComments: false,
            hideAllShorts: false,
            firstRunRefreshNeeded: true,
            releaseNotesSeenVersion: CURRENT_VERSION,
            releaseNotesPayload: null
        });

        // Proactively inject the first-run prompt into already-open YouTube tabs
        try {
            browserAPI.tabs.query({ url: ['*://*.youtube.com/*', '*://*.youtubekids.com/*'] }, (tabs) => {
                if (browserAPI.runtime.lastError) {
                    console.warn('FilterTube: tabs.query failed', browserAPI.runtime.lastError);
                    return;
                }
                tabs?.forEach(tab => {
                    if (!tab?.id || !browserAPI.scripting?.executeScript) return;
                    browserAPI.scripting.executeScript({
                        target: { tabId: tab.id },
                        world: 'ISOLATED',
                        files: ['js/content/first_run_prompt.js']
                    }, () => {
                        if (browserAPI.runtime.lastError) {
                            console.warn('FilterTube: failed to inject first_run_prompt', browserAPI.runtime.lastError);
                        }
                    });
                });
            });
        } catch (e) {
            console.warn('FilterTube: failed to inject first-run prompt on install', e);
        }
    } else if (details.reason === 'update') {
        console.log('FilterTube extension updated from version ' + details.previousVersion);
        buildReleaseNotesPayload(CURRENT_VERSION).then((payload) => {
            browserAPI.storage.local.set({
                releaseNotesPayload: payload
            });
        }).catch(error => {
            console.warn('FilterTube Background: unable to prepare release notes payload', error);
        });
        // You could handle migration of settings between versions here if needed
    }
});

function handleFetchShortsIdentityMessage(request, sendResponse) {
    const videoId = typeof request.videoId === 'string' ? request.videoId.trim() : '';
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        sendResponse({ success: false, error: 'invalid_video_id' });
        return;
    }

    const normalizedHandle = typeof FilterTubeIdentity?.normalizeHandleValue === 'function'
        ? FilterTubeIdentity.normalizeHandleValue(request.expectedHandle || '')
        : '';
    const cacheKey = normalizedHandle ? `${videoId}:${normalizedHandle}` : videoId;

    if (shortsIdentitySessionCache.has(cacheKey)) {
        sendResponse({ success: true, identity: shortsIdentitySessionCache.get(cacheKey) });
        return;
    }

    if (pendingShortsIdentityFetches.has(cacheKey)) {
        pendingShortsIdentityFetches.get(cacheKey).then(sendResponse);
        return;
    }

    const fetchPromise = (async () => {
        try {
            const identity = await performShortsIdentityFetch(videoId, normalizedHandle);
            if (identity) {
                shortsIdentitySessionCache.set(cacheKey, identity);
                return { success: true, identity };
            }
            return { success: false, identity: null, error: 'not_found' };
        } catch (error) {
            console.debug('FilterTube Background: fetchShortsIdentity failed', error);
            return { success: false, error: 'shorts_fetch_failed' };
        } finally {
            pendingShortsIdentityFetches.delete(cacheKey);
        }
    })();

    pendingShortsIdentityFetches.set(cacheKey, fetchPromise);
    fetchPromise.then(sendResponse);
}

function handleFetchWatchIdentityMessage(request, sendResponse) {
    const videoId = typeof request.videoId === 'string' ? request.videoId.trim() : '';
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        sendResponse({ success: false, error: 'invalid_video_id' });
        return;
    }

    const profileType = request?.profileType === 'kids' ? 'kids' : 'main';

    (async () => {
        try {
            const identity = profileType === 'kids'
                ? (await performKidsWatchIdentityFetch(videoId) || await performWatchIdentityFetch(videoId))
                : await performWatchIdentityFetch(videoId);

            if (identity) {
                sendResponse({ success: true, identity });
                return;
            }

            sendResponse({ success: false, identity: null, error: 'not_found' });
        } catch (error) {
            console.debug('FilterTube Background: fetchWatchIdentity failed', error);
            sendResponse({ success: false, error: 'watch_fetch_failed' });
        }
    })();
}

function storageGet(keys) {
    return new Promise((resolve) => browserAPI.storage.local.get(keys, resolve));
}

async function performShortsIdentityFetch(videoId, normalizedHandle) {
    const stored = await storageGet(['videoChannelMap']);
    const storedId = stored?.videoChannelMap?.[videoId];
    if (storedId) {
        return { id: storedId, videoId, source: 'videoChannelMap' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
            credentials: 'include',
            headers: { 'Accept': 'text/html' },
            signal: controller.signal
        });

        if (!response.ok || !response.body) {
            console.debug('FilterTube Background: Shorts response not usable', response.status);
            return null;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let previewBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            previewBuffer += decoder.decode(value, { stream: true });
            const quickIdentity = extractIdentityFromPreview(previewBuffer, normalizedHandle);
            if (quickIdentity) {
                controller.abort('identity_found');
                quickIdentity.partial = true;
                quickIdentity.videoId = videoId;
                return quickIdentity;
            }

            if (previewBuffer.length >= SHORTS_PARTIAL_STREAM_LIMIT) {
                await reader.cancel();
                controller.abort('preview_limit');
                break;
            }
        }

        previewBuffer += decoder.decode();
        const fallbackIdentity = extractIdentityFromPreview(previewBuffer, normalizedHandle);
        if (fallbackIdentity) {
            fallbackIdentity.videoId = videoId;
            return fallbackIdentity;
        }

        return null;
    } catch (error) {
        if (error?.name === 'AbortError') {
            console.debug('FilterTube Background: Shorts fetch aborted', error?.message || '');
        } else {
            console.debug('FilterTube Background: Shorts fetch exception', error);
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

function extractIdentityFromPreview(preview, normalizedHandle) {
    if (!preview || typeof FilterTubeIdentity?.fastExtractIdentityFromHtmlChunk !== 'function') {
        return null;
    }
    const identity = FilterTubeIdentity.fastExtractIdentityFromHtmlChunk(preview);
    if (!identity) return null;

    const normalizedFound = typeof FilterTubeIdentity.normalizeHandleValue === 'function'
        ? FilterTubeIdentity.normalizeHandleValue(identity.handle || '')
        : '';

    if (normalizedHandle && normalizedFound && normalizedFound !== normalizedHandle) {
        return null;
    }

    return identity;
}

function extractKidsWatchIdentityFromPreview(preview) {
    if (!preview || typeof preview !== 'string') return null;

    const base = typeof FilterTubeIdentity?.fastExtractIdentityFromHtmlChunk === 'function'
        ? FilterTubeIdentity.fastExtractIdentityFromHtmlChunk(preview)
        : null;
    if (base?.id || base?.handle || base?.customUrl) return base;

    const hrefIdMatch = preview.match(/href="\/channel\/(UC[\w-]{22})"/i);
    if (hrefIdMatch && hrefIdMatch[1]) {
        return { id: hrefIdMatch[1] };
    }

    return null;
}

async function performKidsWatchIdentityFetch(videoId) {
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return null;
    }

    const stored = await storageGet(['videoChannelMap']);
    const storedId = stored?.videoChannelMap?.[videoId];
    if (storedId) {
        return { id: storedId, videoId, source: 'videoChannelMap' };
    }

    if (kidsWatchIdentitySessionCache.has(videoId)) {
        return kidsWatchIdentitySessionCache.get(videoId);
    }

    if (pendingKidsWatchIdentityFetches.has(videoId)) {
        return await pendingKidsWatchIdentityFetches.get(videoId);
    }

    const fetchPromise = (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(`https://www.youtubekids.com/watch?v=${videoId}`, {
                credentials: 'include',
                headers: { 'Accept': 'text/html' },
                signal: controller.signal
            });

            if (!response.ok || !response.body) {
                console.debug('FilterTube Background: Kids watch response not usable', response.status);
                return null;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let previewBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                previewBuffer += decoder.decode(value, { stream: true });
                const quickIdentity = extractKidsWatchIdentityFromPreview(previewBuffer);
                if (quickIdentity) {
                    controller.abort('identity_found');
                    quickIdentity.partial = true;
                    quickIdentity.videoId = videoId;
                    return quickIdentity;
                }

                if (previewBuffer.length >= WATCH_PARTIAL_STREAM_LIMIT) {
                    await reader.cancel();
                    controller.abort('preview_limit');
                    break;
                }
            }

            previewBuffer += decoder.decode();
            const fallbackIdentity = extractKidsWatchIdentityFromPreview(previewBuffer);
            if (fallbackIdentity) {
                fallbackIdentity.videoId = videoId;
                return fallbackIdentity;
            }

            return null;
        } catch (error) {
            if (error?.name === 'AbortError') {
                console.debug('FilterTube Background: Kids watch fetch aborted', error?.message || '');
            } else {
                console.debug('FilterTube Background: Kids watch fetch exception', error);
            }
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    })();

    pendingKidsWatchIdentityFetches.set(videoId, fetchPromise);
    try {
        const identity = await fetchPromise;
        if (identity) {
            kidsWatchIdentitySessionCache.set(videoId, identity);
        }
        return identity;
    } finally {
        pendingKidsWatchIdentityFetches.delete(videoId);
    }
}

async function performWatchIdentityFetch(videoId) {
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return null;
    }

    if (watchIdentitySessionCache.has(videoId)) {
        return watchIdentitySessionCache.get(videoId);
    }

    if (pendingWatchIdentityFetches.has(videoId)) {
        return await pendingWatchIdentityFetches.get(videoId);
    }

    const fetchPromise = (async () => {
        const stored = await storageGet(['videoChannelMap']);
        const storedId = stored?.videoChannelMap?.[videoId];
        if (storedId) {
            return { id: storedId, videoId, source: 'videoChannelMap' };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                credentials: 'include',
                headers: { 'Accept': 'text/html' },
                signal: controller.signal
            });

            if (!response.ok || !response.body) {
                console.debug('FilterTube Background: Watch response not usable', response.status);
                return null;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let previewBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                previewBuffer += decoder.decode(value, { stream: true });
                const quickIdentity = extractIdentityFromPreview(previewBuffer, '');
                if (quickIdentity) {
                    controller.abort('identity_found');
                    quickIdentity.partial = true;
                    quickIdentity.videoId = videoId;
                    return quickIdentity;
                }

                if (previewBuffer.length >= WATCH_PARTIAL_STREAM_LIMIT) {
                    await reader.cancel();
                    controller.abort('preview_limit');
                    break;
                }
            }

            previewBuffer += decoder.decode();
            const fallbackIdentity = extractIdentityFromPreview(previewBuffer, '');
            if (fallbackIdentity) {
                fallbackIdentity.videoId = videoId;
                return fallbackIdentity;
            }

            return null;
        } catch (error) {
            if (error?.name === 'AbortError') {
                console.debug('FilterTube Background: Watch fetch aborted', error?.message || '');
            } else {
                console.debug('FilterTube Background: Watch fetch exception', error);
            }
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    })();

    pendingWatchIdentityFetches.set(videoId, fetchPromise);
    try {
        const identity = await fetchPromise;
        if (identity) {
            watchIdentitySessionCache.set(videoId, identity);
        }
        return identity;
    } finally {
        pendingWatchIdentityFetches.delete(videoId);
    }
}

// Listen for messages sent from other parts of the extension (e.g., content scripts, popup).
browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    const action = request?.action || request?.type;

    if (action === "getCompiledSettings") {
        const senderUrl = sender?.tab?.url || sender?.url || '';
        const requestedProfile = request.profileType;
        const profileType = requestedProfile === 'kids' ? 'kids' : (requestedProfile === 'main' ? 'main' : (isKidsUrl(senderUrl) ? 'kids' : 'main'));

        if (compiledSettingsCache[profileType] && !request.forceRefresh) {
            sendResponse(compiledSettingsCache[profileType]);
            return;
        }

        console.log(`FilterTube Background: Received getCompiledSettings message for profile: ${profileType} (force: ${!!request.forceRefresh})`);
        getCompiledSettings(sender, profileType).then(compiledSettings => {
            if (browserAPI.runtime.lastError) {
                console.error("FilterTube Background: Error retrieving settings from storage:", browserAPI.runtime.lastError);
                sendResponse({ error: browserAPI.runtime.lastError.message });
            } else {
                compiledSettingsCache[profileType] = compiledSettings;
                sendResponse(compiledSettings);
            }
        }).catch(error => {
            console.error("FilterTube Background: Unhandled error in getCompiledSettings promise:", error);
            sendResponse({ error: error.message || "Unknown error occurred while compiling settings." });
        });
        return true; // Indicates that the response is sent asynchronously.
    } else if (action === 'FilterTube_ScheduleAutoBackup') {
        try {
            const triggerType = typeof request?.triggerType === 'string' ? request.triggerType : 'unknown';
            const delay = typeof request?.delay === 'number' && Number.isFinite(request.delay) ? request.delay : 1000;
            const options = request?.options && typeof request.options === 'object' ? request.options : {};
            scheduleAutoBackupInBackground(triggerType, options, delay);
            sendResponse?.({ ok: true });
        } catch (e) {
            sendResponse?.({ ok: false, error: e?.message || 'failed' });
        }
        return true;
    } else if (action === 'fetchShortsIdentity') {
        handleFetchShortsIdentityMessage(request, sendResponse);
        return true;
    } else if (action === 'fetchWatchIdentity') {
        handleFetchWatchIdentityMessage(request, sendResponse);
        return true;
    } else if (request.action === "injectScripts") {
        // Handle script injection via Chrome scripting API
        console.log("FilterTube Background: Received injectScripts request for:", request.scripts);
        sendResponse({ acknowledged: true });
        return;
    } else if (action === 'FilterTube_KidsBlockChannel') {
        const channel = request?.channel && typeof request.channel === 'object' ? request.channel : null;
        if (!channel) {
            sendResponse?.({ success: false, error: 'missing_channel' });
            return;
        }

        const requestVideoId = (typeof request.videoId === 'string' ? request.videoId.trim() : '');

        handleAddFilteredChannel(
            channel.id || channel.handle || channel.customUrl || channel.originalInput,
            false, // filterAll
            null,  // collaborationWith
            null,  // collaborationGroupId
            {
                displayHandle: channel.handleDisplay,
                canonicalHandle: channel.canonicalHandle,
                channelName: channel.name,
                customUrl: channel.customUrl,
                source: channel.source || 'kidsNative'
            },
            'kids',
            requestVideoId
        ).then(result => {
            if (result.success) {
                try {
                    scheduleAutoBackupInBackground('kids_channel_added');
                } catch (e) {
                }
                sendResponse?.({ success: true, channel: result.channelData });
            } else {
                sendResponse?.({ success: false, error: result.error });
            }
        });
        return true;
    } else if (action === 'FilterTube_FirstRunCheck') {
        browserAPI.storage.local.get(['firstRunRefreshNeeded'], (result) => {
            sendResponse({
                needed: Boolean(result?.firstRunRefreshNeeded)
            });
        });
        return true;
    } else if (action === 'FilterTube_FirstRunComplete') {
        browserAPI.storage.local.set({ firstRunRefreshNeeded: false }, () => {
            sendResponse({ ok: true });
        });
        return true;
    } else if (action === 'FilterTube_ReleaseNotesCheck') {
        // Content script ping: “Do I need to show the banner right now?”
        browserAPI.storage.local.get(['releaseNotesPayload', 'releaseNotesSeenVersion'], async (result) => {
            let payload = result?.releaseNotesPayload;
            const seenVersion = result?.releaseNotesSeenVersion;
            if (!payload?.version && CURRENT_VERSION) {
                try {
                    payload = await buildReleaseNotesPayload(CURRENT_VERSION);
                    await new Promise(resolve => browserAPI.storage.local.set({ releaseNotesPayload: payload }, resolve));
                } catch (error) {
                    console.warn('FilterTube Background: Unable to hydrate release notes payload on demand', error);
                }
            }
            const shouldShow = payload && payload.version && payload.version !== seenVersion;
            sendResponse({
                needed: Boolean(shouldShow),
                payload: shouldShow ? payload : null
            });
        });
        return true;
    } else if (action === 'FilterTube_ReleaseNotesAck') {
        // Banner dismissed – remember the version so we don’t prompt repeatedly.
        const version = typeof request?.version === 'string' ? request.version : null;
        if (!version) {
            sendResponse({ ok: false, error: 'missing_version' });
            return;
        }
        browserAPI.storage.local.set({ releaseNotesSeenVersion: version, releaseNotesPayload: null }, () => {
            sendResponse({ ok: true });
        });
        return true;
    } else if (action === 'FilterTube_OpenWhatsNew') {
        // CTA from the YouTube banner – open or focus the dashboard’s What’s New view.
        const requestedUrl = typeof request?.url === 'string' && request.url.trim()
            ? request.url
            : WHATS_NEW_PAGE_URL;
        const finalUrl = requestedUrl || WHATS_NEW_PAGE_URL;

        const focusExistingTab = () => {
            browserAPI.tabs.query({
                url: browserAPI.runtime.getURL('html/tab-view.html*')
            }, (tabs) => {
                if (browserAPI.runtime.lastError) {
                    console.warn('FilterTube Background: tabs.query failed', browserAPI.runtime.lastError);
                }
                const existing = Array.isArray(tabs) ? tabs[0] : null;
                if (existing?.id) {
                    browserAPI.tabs.update(existing.id, { active: true, url: finalUrl }, () => {
                        if (browserAPI.runtime.lastError) {
                            console.warn('FilterTube Background: tabs.update failed', browserAPI.runtime.lastError);
                            browserAPI.tabs.create({ url: finalUrl });
                        }
                        sendResponse({ ok: true, reused: true });
                    });
                } else {
                    browserAPI.tabs.create({ url: finalUrl }, () => {
                        if (browserAPI.runtime.lastError) {
                            console.warn('FilterTube Background: tabs.create failed', browserAPI.runtime.lastError);
                            sendResponse({ ok: false, error: browserAPI.runtime.lastError.message });
                        } else {
                            sendResponse({ ok: true, reused: false });
                        }
                    });
                }
            });
        };

        focusExistingTab();
        return true;
    } else if (request.action === "injectScripts") {
        // Handle script injection via Chrome scripting API
        console.log("FilterTube Background: Received injectScripts request for:", request.scripts);

        if (!browserAPI.scripting?.executeScript) {
            console.error("FilterTube Background: scripting API not available");
            sendResponse({ success: false, error: "Scripting API not available" });
            return false;
        }

        if (!sender.tab?.id) {
            console.error("FilterTube Background: No tab ID available from sender");
            sendResponse({ success: false, error: "No tab ID available" });
            return false;
        }

        // Inject scripts sequentially
        const injectSequentially = async () => {
            try {
                for (const scriptName of request.scripts) {
                    console.log(`FilterTube Background: Injecting ${scriptName}.js into tab ${sender.tab.id}`);

                    await browserAPI.scripting.executeScript({
                        target: { tabId: sender.tab.id },
                        files: [`js/${scriptName}.js`],
                        world: 'MAIN'
                    });

                    console.log(`FilterTube Background: Successfully injected ${scriptName}.js`);
                }

                sendResponse({ success: true });
            } catch (error) {
                console.error("FilterTube Background: Script injection failed:", error);
                sendResponse({ success: false, error: error.message });
            }
        };

        injectSequentially();
        return true; // Indicates that the response is sent asynchronously
    } else if (request.action === "processFetchData") {
        // Handle fetch/XHR data processing from content_bridge
        if (request.url && request.data) {
            console.log(`FilterTube Background: Received data to process from ${request.url}`);
            // You could implement centralized data processing here if needed
            // For now, we'll let content scripts handle filtering
        }
        return false; // No response needed
    } else if (request.action === "addChannelPersistent") {
        const input = request.input;
        console.log(`FilterTube Background: persistent add request for "${input}"`);

        // Helper to normalize input (URL/Handle/ID) -> @handle or UC...
        const normalizeChannelInput = (rawInput) => {
            if (!rawInput) return '';
            let cleaned = rawInput.trim();

            try {
                cleaned = decodeURIComponent(cleaned);
            } catch (e) {
                // ignore
            }

            // Handle full URLs
            try {
                const url = new URL(cleaned);
                const path = url.pathname; // e.g. /@handle, /channel/UC..., /c/User

                // Case 1: /channel/UC...
                if (path.match(/^\/channel\/(UC[\w-]{22})/)) {
                    return path.match(/^\/channel\/(UC[\w-]{22})/)[1];
                }

                // Case 2: /@handle
                if (path.startsWith('/@')) {
                    const handlePart = path.substring(2).split('/')[0];
                    let decodedHandle = handlePart;
                    try {
                        decodedHandle = decodeURIComponent(handlePart);
                    } catch (e) {
                        // ignore
                    }
                    return '@' + decodedHandle;
                }

                // Case 3: /c/User or /user/User (Legacy) - return as is for search fallback
                if (path.startsWith('/c/')) {
                    const slug = path.split('/')[2];
                    let decodedSlug = slug;
                    try {
                        decodedSlug = decodeURIComponent(slug);
                    } catch (e) {
                        // ignore
                    }
                    return decodedSlug ? `c/${decodedSlug}` : '';
                }

                if (path.startsWith('/user/')) {
                    const slug = path.split('/')[2];
                    let decodedSlug = slug;
                    try {
                        decodedSlug = decodeURIComponent(slug);
                    } catch (e) {
                        // ignore
                    }
                    return decodedSlug ? `user/${decodedSlug}` : '';
                }

                // Case 4: Just the path (fallback)
                return path.substring(1);
            } catch (e) {
                // Not a URL, treat as string
            }

            // Handle "youtube.com/..." without protocol
            if (cleaned.includes('youtube.com/') || cleaned.includes('youtu.be/')) {
                const cleanedPath = cleaned.split(/[?#]/)[0];
                const parts = cleanedPath.split('/');
                const lastPart = parts[parts.length - 1];
                const secondLast = parts[parts.length - 2];

                if (secondLast === 'channel' && lastPart.startsWith('UC')) return lastPart;
                if (lastPart.startsWith('@')) return lastPart;
                if (secondLast === 'c' && lastPart) return `c/${lastPart}`;
                if (secondLast === 'user' && lastPart) return `user/${lastPart}`;
            }

            // Handle direct inputs
            if (cleaned.startsWith('channel/')) return cleaned.replace('channel/', '');
            if (cleaned.startsWith('c/')) return cleaned;
            if (cleaned.startsWith('user/')) return cleaned;
            if (cleaned.startsWith('/c/')) {
                const slug = cleaned.split('/')[2];
                return slug ? `c/${slug}` : '';
            }
            if (cleaned.startsWith('/user/')) {
                const slug = cleaned.split('/')[2];
                return slug ? `user/${slug}` : '';
            }

            return cleaned;
        };

        // Keep service worker alive while processing
        (async () => {
            try {
                // 1. Get current channels
                const data = await new Promise(resolve => browserAPI.storage.local.get(['filterChannels'], resolve));
                let channels = data.filterChannels || [];

                // Normalize legacy string arrays to objects if necessary
                if (Array.isArray(channels) && typeof channels[0] === 'string') {
                    channels = channels.map(c => ({ name: c, id: c, handle: null, filterAll: false, addedAt: Date.now() }));
                }

                // 2. Normalize Input & Check duplicates
                const normalizedInput = normalizeChannelInput(input);
                console.log(`FilterTube Background: Normalized "${input}" -> "${normalizedInput}"`);

                const isHandle = typeof normalizedInput === 'string' && normalizedInput.startsWith('@');
                const isUcId = typeof normalizedInput === 'string' && normalizedInput.toUpperCase().startsWith('UC') && normalizedInput.length === 24;

                const exists = channels.some(ch => {
                    const normId = (ch.id || '').toLowerCase();
                    const normHandle = (ch.handle || '').toLowerCase();
                    const normName = (ch.name || '').toLowerCase();
                    const checkInput = normalizedInput.toLowerCase();

                    return normId === checkInput || normHandle === checkInput || normName === checkInput;
                });

                if (exists) {
                    sendResponse({ success: false, error: 'Channel already exists' });
                    return;
                }

                // 3. Fetch details (This is the slow part that was getting killed)
                let lookupValue = normalizedInput;
                let mappedId = null;
                if (isHandle) {
                    try {
                        const mapStorage = await new Promise(resolve => browserAPI.storage.local.get(['channelMap'], resolve));
                        const channelMap = mapStorage.channelMap || {};
                        const candidateId = channelMap[normalizedInput.toLowerCase()];
                        if (candidateId && typeof candidateId === 'string' && candidateId.toUpperCase().startsWith('UC')) {
                            mappedId = candidateId;
                            lookupValue = candidateId;
                            console.log('FilterTube Background: Using mapped UC ID for handle', normalizedInput, '->', mappedId);
                        }
                    } catch (e) {
                        console.warn('FilterTube Background: Failed to read channelMap for persistent handle resolution:', e);
                    }
                }

                let details = await fetchChannelInfo(lookupValue);

                if (!details.success && isHandle && mappedId) {
                    console.warn('FilterTube Background: fetchChannelInfo failed, falling back to mapped UC ID for handle', normalizedInput);
                    details = {
                        success: true,
                        id: mappedId,
                        handle: normalizedInput,
                        name: normalizedInput,
                        logo: null
                    };
                }

                if (!details.success) {
                    sendResponse({ success: false, error: details.error || 'Failed to fetch channel info' });
                    return;
                }

                if (!details.id || typeof details.id !== 'string' || !details.id.toUpperCase().startsWith('UC')) {
                    sendResponse({ success: false, error: 'Failed to resolve channel UC ID' });
                    return;
                }

                const normalizedResolvedId = details.id.toUpperCase();
                const existingById = channels.find(ch => (ch.id || '').toUpperCase() === normalizedResolvedId);
                if (existingById) {
                    console.log('FilterTube Background: Channel already exists (matched by UC ID), skipping duplicate add:', normalizedResolvedId);
                    sendResponse({ success: false, error: 'Channel already exists' });
                    return;
                }

                // 4. Construct entry
                // Determine customUrl: from fetchChannelInfo result OR from normalizedInput if it's a c/Name or user/Name
                // Decode for unicode consistency (like handles)
                let customUrl = details.customUrl || null;
                const lowerInput = normalizedInput.toLowerCase();
                if (!customUrl && (lowerInput.startsWith('c/') || lowerInput.startsWith('user/'))) {
                    customUrl = normalizedInput; // The input itself is the customUrl
                }
                if (customUrl) {
                    try {
                        customUrl = decodeURIComponent(customUrl);
                    } catch (e) { /* already decoded or invalid */ }
                }

                const newEntry = {
                    name: details.name || details.handle || normalizedInput,
                    id: details.id,
                    handle: isHandle ? (details.handle || normalizedInput) : (details.handle || null),
                    logo: details.logo || null,
                    filterAll: false,
                    originalInput: normalizedInput, // Store normalized value, not the raw URL
                    customUrl: customUrl, // c/Name or user/Name for legacy channels
                    addedAt: Date.now()
                };

                // 5. Update channelMap with customUrl → UC ID mapping if available
                if (customUrl && details.id) {
                    try {
                        const mapStorage = await new Promise(resolve => browserAPI.storage.local.get(['channelMap'], resolve));
                        const channelMap = mapStorage.channelMap || {};
                        let normalizedCustomUrl = customUrl.toLowerCase();
                        try {
                            normalizedCustomUrl = decodeURIComponent(normalizedCustomUrl).toLowerCase();
                        } catch (e) { /* ignore */ }
                        if (!channelMap[normalizedCustomUrl]) {
                            channelMap[normalizedCustomUrl] = details.id;
                            console.log('FilterTube Background: Added customUrl mapping (popup):', normalizedCustomUrl, '->', details.id);
                            await new Promise(resolve => browserAPI.storage.local.set({ channelMap: channelMap }, resolve));
                        }
                    } catch (e) {
                        console.warn('FilterTube Background: Failed to update channelMap with customUrl:', e);
                    }
                }

                // 6. Add to list and save
                channels.unshift(newEntry); // Add to top

                await new Promise(resolve => browserAPI.storage.local.set({ filterChannels: channels }, resolve));

                console.log("FilterTube Background: Persistent add success", newEntry);
                try {
                    scheduleAutoBackupInBackground('channel_added');
                } catch (e) {
                }
                sendResponse({ success: true, channel: newEntry });

            } catch (err) {
                console.error("FilterTube Background: Persistent add failed", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep message channel open for async response
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        // Forward compiled settings to all relevant tabs for immediate application.
        // request.profile should be passed from the UI (popup/tab-view) to avoid cross-domain leaks.
        const targetProfile = request.profile === 'kids' ? 'kids' : 'main';
        const urlPattern = targetProfile === 'kids' ? ["*://*.youtubekids.com/*"] : ["*://*.youtube.com/*"];

        // Update cache
        compiledSettingsCache[targetProfile] = request.settings;

        browserAPI.tabs.query({ url: urlPattern }, tabs => {
            tabs.forEach(tab => {
                browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_ApplySettings', settings: request.settings }, () => {
                    if (browserAPI.runtime.lastError && !/Receiving end does not exist/i.test(browserAPI.runtime.lastError.message)) {
                        console.warn('FilterTube Background: sendMessage error', browserAPI.runtime.lastError.message);
                    }
                });
            });
        });
        sendResponse({ acknowledged: true });
        return false;
    } else if (request.action === "updateChannelMap") {
        // Handle learned ID/Handle mappings from filter_logic
        browserAPI.storage.local.get(['channelMap'], (result) => {
            const currentMap = result.channelMap || {};
            let hasChange = false;

            request.mappings.forEach(m => {
                if (!m || !m.id || !m.handle) return;

                // Keys are lowercase for case-insensitive lookup
                // Values preserve ORIGINAL case from YouTube
                const keyId = m.id.toLowerCase();
                const keyHandle = m.handle.toLowerCase();

                if (currentMap[keyId] !== m.handle) {
                    currentMap[keyId] = m.handle;    // UC... -> @HandleDisplay (original case)
                    hasChange = true;
                }
                if (currentMap[keyHandle] !== m.id) {
                    currentMap[keyHandle] = m.id;    // @handle -> UC... (original case)
                    hasChange = true;
                }
            });

            if (hasChange) {
                browserAPI.storage.local.set({ channelMap: currentMap });
                console.log("FilterTube Background: Channel map updated in storage");
            }
        });
        return false; // No response needed
    } else if (request.action === "updateVideoChannelMap") {
        // Store videoId → channelId mappings for Shorts persistence after refresh
        if (request.videoId && request.channelId) {
            enqueueVideoChannelMapUpdate(request.videoId, request.channelId);
            console.log("FilterTube Background: Video-channel mapping stored:", request.videoId, "->", request.channelId);
        }
        return false;
    } else if (request.action === "recordTimeSaved") {
        // Accumulate saved time
        browserAPI.storage.local.get(['stats'], (result) => {
            const stats = result.stats || { savedSeconds: 0, hiddenCount: 0 };
            const oldSeconds = stats.savedSeconds || 0;
            stats.savedSeconds = oldSeconds + (request.seconds || 0);

            // console.log(`FilterTube Background: Time Saved Updated. Added: ${request.seconds}s. Total: ${stats.savedSeconds}s`);

            browserAPI.storage.local.set({ stats });
        });
        return false;
    }

    else if (request.action === "fetchChannelDetails") {
        console.log("FilterTube Background: Received fetchChannelDetails request for:", request.channelIdOrHandle);
        fetchChannelInfo(request.channelIdOrHandle).then(channelInfo => {
            sendResponse(channelInfo);
        }).catch(error => {
            console.error("FilterTube Background: Error fetching channel details:", error);
            sendResponse({ success: false, error: error.message || "Failed to fetch channel details." });
        });
        return true; // Indicates that the response is sent asynchronously.
    }

    // Handle any browser-specific actions if needed
    if (request.action === "getBrowserInfo") {
        sendResponse({
            isFirefox: IS_FIREFOX,
            browser: IS_FIREFOX ? "Firefox" : "Chrome/Edge/Other"
        });
        return false; // Synchronous response
    }
});

// Listen for storage changes to re-compile settings
browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        const relevantKeys = [
            'filterKeywords',
            'filterChannels',
            'hideMembersOnly',
            'hideAllShorts',
            'hideComments',
            'filterComments',
            'hideHomeFeed',
            'hideSponsoredCards',
            'channelMap',
            'videoChannelMap',
            'ftProfilesV3'
        ];
        let settingsChanged = false;
        for (const key of relevantKeys) {
            if (changes[key]) {
                settingsChanged = true;
                console.log(`FilterTube Background: Setting changed - ${key}:`, changes[key]);
                break;
            }
        }

        if (settingsChanged) {
            console.log('FilterTube Background: Settings changed, invalidating caches and re-compiling.');
            compiledSettingsCache.main = null;
            compiledSettingsCache.kids = null;

            // Re-compile both to be safe, though this won't broadcast automatically.
            // Content scripts will re-request via their own onChanged listeners.
            getCompiledSettings({ url: 'https://www.youtube.com/' });
            getCompiledSettings({ url: 'https://www.youtubekids.com/' });
        }
    }
});

/**
 * Fetch channel name and handle from YouTube by scraping the channel page
 * More reliable than API calls which can be blocked
 */
function extractCustomUrlFromPath(path) {
    if (!path || typeof path !== 'string') return '';
    let working = path;
    try {
        if (/^https?:\/\//i.test(working)) {
            working = new URL(working).pathname;
        }
    } catch (e) { /* ignore */ }

    if (!working.startsWith('/')) working = '/' + working;
    working = working.split(/[?#]/)[0];

    if (working.startsWith('/c/')) {
        const parts = working.split('/');
        if (parts[2]) {
            try { return `c/${decodeURIComponent(parts[2])}`; }
            catch (e) { return `c/${parts[2]}`; }
        }
    } else if (working.startsWith('/user/')) {
        const parts = working.split('/');
        if (parts[2]) {
            try { return `user/${decodeURIComponent(parts[2])}`; }
            catch (e) { return `user/${parts[2]}`; }
        }
    }

    return '';
}

async function fetchChannelInfo(channelIdOrHandle) {
    try {
        // Determine if it's a handle or a UC ID
        const safeValue = String(channelIdOrHandle || '').trim();
        const isHandle = safeValue.startsWith('@');
        let cleanId = safeValue.replace(/^channel\//i, ''); // cleanId is input without "channel/"
        let channelUrl = '';
        let resolvedChannelId = null; // Initialize early
        let customUrl = null; // Track if this is a c/Name or user/Name channel
        const lowerCleanId = cleanId.toLowerCase();
        const isCustomUrl = lowerCleanId.startsWith('c/');
        const isUserUrl = lowerCleanId.startsWith('user/');

        const assignCustomUrl = (value) => {
            if (!value || customUrl) return;
            const extracted = extractCustomUrlFromPath(value);
            if (extracted) customUrl = extracted;
        };

        // If the input itself is a UC ID, use it directly as the resolved ID and construct canonical URL
        if (cleanId.toUpperCase().startsWith('UC') && cleanId.length === 24) { // UC + 22 chars
            resolvedChannelId = cleanId;
            channelUrl = `https://www.youtube.com/channel/${resolvedChannelId}`;
        } else if (isHandle) {
            // For handles, try /about first, then fall back to the channel root.
            // Some handles (or certain surfaces) may 404 on /about.
            const handleWithoutAt = cleanId
                .replace(/^@+/, '')
                .split(/[/?#]/)[0]
                .trim();
            const encodedHandle = encodeURIComponent(handleWithoutAt);
            channelUrl = `https://www.youtube.com/@${encodedHandle}/about`;
        } else if (isCustomUrl) {
            const slug = cleanId
                .substring(2)
                .replace(/^\//, '')
                .split(/[/?#]/)[0]
                .trim();
            let decodedSlug = slug;
            try {
                decodedSlug = decodeURIComponent(slug);
            } catch (e) {
                // ignore
            }
            customUrl = `c/${decodedSlug}`; // Store the customUrl
            const encodedSlug = encodeURIComponent(decodedSlug);
            channelUrl = `https://www.youtube.com/c/${encodedSlug}`;
        } else if (isUserUrl) {
            const slug = cleanId
                .substring(5)
                .replace(/^\//, '')
                .split(/[/?#]/)[0]
                .trim();
            let decodedSlug = slug;
            try {
                decodedSlug = decodeURIComponent(slug);
            } catch (e) {
                // ignore
            }
            customUrl = `user/${decodedSlug}`; // Store the customUrl
            const encodedSlug = encodeURIComponent(decodedSlug);
            channelUrl = `https://www.youtube.com/user/${encodedSlug}`;
        } else {
            // If it's not a handle and not a direct UC ID, assume it's a malformed URL or invalid ID initially
            // We'll still try to fetch, but resolvedChannelId will remain null unless found in page data
            channelUrl = `https://www.youtube.com/channel/${cleanId}`; // Best guess for URL
        }

        console.log('FilterTube Background: Fetching channel info for:', cleanId);

        // Fetch the channel page HTML
        let response = await fetch(channelUrl);

        // If /@handle/about 404s, fall back to /@handle
        if (!response.ok && isHandle) {
            try {
                const handleWithoutAt = cleanId
                    .replace(/^@+/, '')
                    .split(/[/?#]/)[0]
                    .trim();
                const encodedHandle = encodeURIComponent(handleWithoutAt);
                const fallbackUrl = `https://www.youtube.com/@${encodedHandle}`;
                response = await fetch(fallbackUrl);
            } catch (fallbackError) {
                // Ignore, keep original response for error handling below
            }
        }

        if (!response.ok) {
            console.error('FilterTube Background: Failed to fetch channel page:', response.status, response.statusText);
            return { success: false, error: `Failed to fetch channel page: ${response.status}` };
        }

        const html = await response.text();

        // Extract ytInitialData from the page using a more robust method
        let data = null;

        // Helper function to extract JSON with balanced braces
        function extractJSON(text, startPattern) {
            const startIndex = text.search(startPattern);
            if (startIndex === -1) return null;

            const jsonStart = text.indexOf('{', startIndex);
            if (jsonStart === -1) return null;

            let depth = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = jsonStart; i < text.length; i++) {
                const char = text[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                }

                if (!inString) {
                    if (char === '{') depth++;
                    else if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            return text.substring(jsonStart, i + 1);
                        }
                    }
                }
            }

            return null;
        }

        // Try different patterns
        const patterns = [
            /var ytInitialData\s*=/,
            /window\["ytInitialData"\]\s*=/,
            /ytInitialData"\s*:/
        ];

        for (const pattern of patterns) {
            const jsonStr = extractJSON(html, pattern);
            if (jsonStr) {
                try {
                    data = JSON.parse(jsonStr);
                    console.log('FilterTube Background: Successfully extracted ytInitialData using pattern:', pattern);
                    break;
                } catch (e) {
                    console.warn('FilterTube Background: Failed to parse JSON for pattern:', pattern, e.message);
                }
            }
        }

        if (!data) {
            console.error('FilterTube Background: Could not extract ytInitialData from page');
            return { success: false, error: 'Could not extract channel data' };
        }

        let channelName = null;
        let channelHandle = null;
        let channelLogo = null;

        const normalizeHandleOutput = (value) => {
            if (!value || typeof value !== 'string') return null;
            let v = value.trim();
            if (!v) return null;
            // Some surfaces provide "/@handle"; normalize to "@handle".
            if (v.startsWith('/@')) v = v.slice(1);
            if (!v.startsWith('@')) return null;
            // Strip path segments.
            v = v.split(/[/?#]/)[0].trim();
            return v || null;
        };

        // --- BLOCK 1: Metadata Renderer (Standard & Most Reliable) ---
        const metadata = data?.metadata?.channelMetadataRenderer;
        if (metadata) {
            console.log('FilterTube Background: Found metadata:', metadata);

            // Name
            if (metadata.title) {
                channelName = metadata.title;
                console.log('FilterTube Background: Got name from metadata:', channelName);
            }

            // Handle from vanityChannelUrl
            if (metadata.vanityChannelUrl) {
                const match = metadata.vanityChannelUrl.match(/@([^/]+)/);
                if (match) {
                    channelHandle = normalizeHandleOutput('@' + match[1]) || channelHandle;
                }
                assignCustomUrl(metadata.vanityChannelUrl);
            }

            if (!customUrl && metadata.channelUrl) assignCustomUrl(metadata.channelUrl);
            if (!customUrl && Array.isArray(metadata.ownerUrls)) {
                metadata.ownerUrls.forEach(assignCustomUrl);
            }

            if (!resolvedChannelId && metadata.externalId && typeof metadata.externalId === 'string' && metadata.externalId.toUpperCase().startsWith('UC')) {
                resolvedChannelId = metadata.externalId;
                console.log('FilterTube Background: Got resolvedChannelId from metadata.externalId:', resolvedChannelId);
            }

            if (!resolvedChannelId && metadata.channelUrl && typeof metadata.channelUrl === 'string') {
                const match = metadata.channelUrl.match(/channel\/(UC[\w-]{22})/);
                if (match) {
                    resolvedChannelId = match[1];
                    console.log('FilterTube Background: Got resolvedChannelId from metadata.channelUrl:', resolvedChannelId);
                }
            }

            if (!resolvedChannelId && metadata.rssUrl && typeof metadata.rssUrl === 'string') {
                const match = metadata.rssUrl.match(/channel_id=(UC[\w-]{22})/);
                if (match) {
                    resolvedChannelId = match[1];
                    console.log('FilterTube Background: Got resolvedChannelId from metadata.rssUrl:', resolvedChannelId);
                }
            }

            // Resolved Channel ID (from the canonical link)
            if (metadata.canonicalUrl) {
                const match = metadata.canonicalUrl.match(/channel\/(UC[\w-]{22})/);
                if (match) {
                    resolvedChannelId = match[1];
                    console.log('FilterTube Background: Got resolvedChannelId from metadata:', resolvedChannelId);
                }
            }

            // Logo (Avatar)
            if (metadata.avatar?.thumbnails?.length > 0) {
                channelLogo = metadata.avatar.thumbnails[metadata.avatar.thumbnails.length - 1].url;
                console.log('FilterTube Background: Got logo from metadata:', channelLogo);
            }
        } else {
            console.log('FilterTube Background: No metadata block found');
        }

        // --- BLOCK 2: Page Header ViewModel (New YouTube Structure) ---
        if (!channelName || !channelLogo || !resolvedChannelId) {
            const pageHeader = data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

            if (pageHeader) {
                console.log('FilterTube Background: Found pageHeaderViewModel:', pageHeader);

                // Name from ViewModel
                if (!channelName && pageHeader.title?.dynamicTextViewModel?.text?.content) {
                    channelName = pageHeader.title.dynamicTextViewModel.text.content;
                }

                // Handle from metadata rows
                if (!channelHandle) {
                    const metadataRows = pageHeader.metadata?.contentMetadataViewModel?.metadataRows;
                    if (metadataRows && metadataRows.length > 0) {
                        const handlePart = metadataRows[0]?.metadataParts?.[0]?.text?.content;
                        if (handlePart && handlePart.startsWith('@')) {
                            channelHandle = normalizeHandleOutput(handlePart) || channelHandle;
                        } else {
                            const canonicalUrl = metadataRows[0]?.metadataParts?.[0]?.navigationEndpoint?.urlEndpoint?.url;
                            if (canonicalUrl && canonicalUrl.startsWith('/@')) {
                                channelHandle = normalizeHandleOutput(canonicalUrl) || channelHandle;
                            }
                            assignCustomUrl(canonicalUrl);
                        }
                    }
                }

                // Resolved Channel ID from ViewModel
                if (!resolvedChannelId) {
                    const canonicalUrl = pageHeader.actions?.channelHeaderMenuViewModel?.primaryNavigationButtons?.[0]?.buttonViewModel?.command?.urlEndpoint?.url;
                    if (canonicalUrl) {
                        const match = canonicalUrl.match(/channel\/(UC[\w-]{22})/);
                        if (match) {
                            resolvedChannelId = match[1];
                        }
                        assignCustomUrl(canonicalUrl);
                    }
                }

                // Logo from decoratedAvatarViewModel
                if (!channelLogo) {
                    const sources = pageHeader.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
                    if (sources && sources.length > 0) {
                        channelLogo = sources[sources.length - 1].url;
                    }
                }
            }
        }

        // --- BLOCK 3: Legacy Headers (c4TabbedHeaderRenderer / pageHeaderRenderer) ---
        if (!channelName || !channelLogo || !resolvedChannelId) {
            const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
            if (header) {
                console.log('FilterTube Background: Trying legacy header:', header);

                // Name
                if (!channelName) {
                    channelName = header.title || header.channelTitle?.simpleText || header.pageTitle;
                }

                // Handle
                if (!channelHandle) {
                    if (header.channelHandleText?.runs?.[0]?.text) {
                        channelHandle = normalizeHandleOutput(header.channelHandleText.runs[0].text) || channelHandle;
                    } else if (header.handle?.simpleText) {
                        channelHandle = normalizeHandleOutput(header.handle.simpleText) || channelHandle;
                    }
                }

                // Resolved Channel ID
                if (!resolvedChannelId && header.channelId) { // c4TabbedHeaderRenderer has channelId directly
                    resolvedChannelId = header.channelId;
                } else if (!resolvedChannelId && header.url) { // pageHeaderRenderer might have it in URL
                    const match = header.url.match(/channel\/(UC[\w-]{22})/);
                    if (match) {
                        resolvedChannelId = match[1];
                    }
                    assignCustomUrl(header.url);
                }

                // Logo
                if (!channelLogo && header.avatar?.thumbnails?.length > 0) {
                    channelLogo = header.avatar.thumbnails[header.avatar.thumbnails.length - 1].url;
                }
            }
        }

        // --- BLOCK 4: Microformat (Backup) ---
        if (!channelName || !channelHandle || !resolvedChannelId) {
            const microformat = data?.microformat?.microformatDataRenderer;
            if (microformat) {
                console.log('FilterTube Background: Trying microformat:', microformat);

                if (!channelName) {
                    channelName = microformat.title;
                }

                if (!channelHandle && microformat.vanityChannelUrl) {
                    const match = microformat.vanityChannelUrl.match(/@([^/]+)/);
                    if (match) channelHandle = normalizeHandleOutput('@' + match[1]) || channelHandle;
                    assignCustomUrl(microformat.vanityChannelUrl);
                }

                if (!resolvedChannelId && microformat.url) {
                    const match = microformat.url.match(/channel\/(UC[\w-]{22})/);
                    if (match) {
                        resolvedChannelId = match[1];
                    }
                    assignCustomUrl(microformat.url);
                }

                if (!channelLogo && microformat.thumbnail?.thumbnails?.length > 0) {
                    channelLogo = microformat.thumbnail.thumbnails[microformat.thumbnail.thumbnails.length - 1].url;
                }
            }
        }

        // --- Try to find UC ID directly in HTML if not found yet (especially for handles) ---
        if (!resolvedChannelId) {
            const match = html.match(/\/channel\/(UC[\w-]{22})/);
            if (match && match[1]) {
                resolvedChannelId = match[1];
                console.log('FilterTube Background: Got resolvedChannelId from direct HTML match:', resolvedChannelId);
            }
        }

        if (!customUrl) {
            const canonicalMatch = html.match(/"canonicalBaseUrl":"(\/(?:c|user)\/[^"]+)"/);
            if (canonicalMatch && canonicalMatch[1]) {
                const extracted = extractCustomUrlFromPath(canonicalMatch[1]);
                if (extracted) {
                    customUrl = extracted;
                    console.log('FilterTube Background: Learned customUrl from HTML canonicalBaseUrl:', customUrl);
                }
            }
        }

        // Fallback to original cleanId if it looks like a UC ID and resolvedChannelId is still missing
        // This is now less critical as direct UC ID is handled at the start
        if (!resolvedChannelId && cleanId.toUpperCase().startsWith('UC') && cleanId.length === 24) {
            resolvedChannelId = cleanId;
            console.log('FilterTube Background: Falling back to cleanId as resolvedChannelId:', resolvedChannelId);
        }


        console.log('FilterTube Background: Extracted -', { name: channelName, handle: channelHandle, logo: channelLogo, resolvedChannelId: resolvedChannelId });

        if (!resolvedChannelId) {
            console.error('FilterTube Background: Could not resolve actual Channel ID from page data.');
            return { success: false, error: 'Could not resolve actual Channel ID.' };
        }

        channelHandle = normalizeHandleOutput(channelHandle) || null;

        return {
            success: true,
            name: channelName || resolvedChannelId, // Fallback to ID if name fails
            id: resolvedChannelId,
            handle: channelHandle,
            logo: channelLogo,
            customUrl: customUrl // c/Name or user/Name if that was the input
        };
    } catch (error) {
        console.error('FilterTube Background: Failed to fetch channel info:', error);
        return { success: false, error: error.message || 'Unknown error during channel info fetch.' };
    }
}


// ==========================================
// MESSAGE HANDLERS - Support 3-Dot Menu Feature
// ==========================================

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('FilterTube Background: Received message:', message?.type || message?.action);

    if (message.type === 'addFilteredChannel') {
        handleAddFilteredChannel(
            message.input,
            message.filterAll,
            message.collaborationWith,
            message.collaborationGroupId,
            {
                displayHandle: message.displayHandle,
                canonicalHandle: message.canonicalHandle,
                channelName: message.channelName,
                customUrl: message.customUrl,
                source: message.source || null
            },
            message.profile || 'main',
            message.videoId || ''
        ).then(result => {
            try {
                if (result && result.success) {
                    scheduleAutoBackupInBackground((message.profile === 'kids') ? 'kids_channel_added' : 'channel_added');
                }
            } catch (e) {
            }
            sendResponse(result);
        });
        return true;
    }

    if (message.type === 'toggleChannelFilterAll') {
        handleToggleChannelFilterAll(message.channelId, message.value).then(result => {
            try {
                if (result && result.success) {
                    scheduleAutoBackupInBackground('filter_all_toggled');
                }
            } catch (e) {
            }
            sendResponse(result);
        });
        return true;
    }

    return false;
});

/**
 * Handle adding a filtered channel (from 3-dot menu or enrichment queue)
 * @param {string} input - Channel identifier (@handle or UC ID)
 * @param {boolean} filterAll - Whether to enable Filter All for this channel
 * @param {Array<string>} collaborationWith - Optional list of handles/names this channel is collaborating with
 * @param {string} collaborationGroupId - Optional UUID linking channels blocked together
 * @param {Object} metadata - Optional metadata about the channel (display handle, canonical handle, etc.)
 * @param {string} profile - 'main' or 'kids'
 * @param {string} videoId - Optional video ID to help with identity resolution
 * @returns {Promise<Object>} Result with success status
 */
async function handleAddFilteredChannel(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}, profile = 'main', videoId = '') {
    try {
        const isHandleLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return value.trim().startsWith('@');
        };

        const pickBetterName = (...candidates) => {
            const cleaned = candidates
                .map(v => (typeof v === 'string' ? v.trim() : ''))
                .filter(Boolean);
            if (cleaned.length === 0) return '';
            const preferred = cleaned.find(v => !isHandleLike(v) && v.toLowerCase() !== 'channel');
            return preferred || cleaned[0];
        };

        const normalizeChannelInput = (rawInput) => {
            if (!rawInput) return '';
            let cleaned = String(rawInput).trim();

            // decode percent-encoded unicode handles/custom URLs
            try {
                cleaned = decodeURIComponent(cleaned);
            } catch (e) {
                // ignore
            }

            const extractSlug = (path, marker) => {
                const rx = new RegExp(`/${marker}/([^/?#]+)`, 'i');
                const m = path.match(rx);
                if (m && m[1]) {
                    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
                }
                const parts = path.split('/').filter(Boolean);
                const idx = parts.findIndex(p => p.toLowerCase() === marker.toLowerCase());
                if (idx !== -1 && parts[idx + 1]) {
                    try { return decodeURIComponent(parts[idx + 1]); } catch (e) { return parts[idx + 1]; }
                }
                return '';
            };

            // URL form
            try {
                const url = new URL(cleaned);
                const path = url.pathname;

                if (path.match(/^\/channel\/(UC[\w-]{22})/)) {
                    return path.match(/^\/channel\/(UC[\w-]{22})/)[1];
                }

                if (path.startsWith('/@')) {
                    const handlePart = path.substring(2).split('/')[0];
                    let decodedHandle = handlePart;
                    try {
                        decodedHandle = decodeURIComponent(handlePart);
                    } catch (e) {
                        // ignore
                    }
                    return '@' + decodedHandle;
                }

                if (path.startsWith('/c/')) {
                    const slug = extractSlug(path, 'c');
                    let decodedSlug = slug;
                    try {
                        decodedSlug = decodeURIComponent(slug);
                    } catch (e) {
                        // ignore
                    }
                    return decodedSlug ? `c/${decodedSlug}` : '';
                }

                if (path.startsWith('/user/')) {
                    const slug = extractSlug(path, 'user');
                    let decodedSlug = slug;
                    try {
                        decodedSlug = decodeURIComponent(slug);
                    } catch (e) {
                        // ignore
                    }
                    return decodedSlug ? `user/${decodedSlug}` : '';
                }

                return path.substring(1);
            } catch (e) {
                // Not a URL, treat as string
            }

            if (cleaned.includes('youtube.com/') || cleaned.includes('youtu.be/')) {
                const cleanedPath = cleaned.split(/[?#]/)[0];
                const cSlug = extractSlug(cleanedPath, 'c');
                if (cSlug) return `c/${cSlug}`;
                const userSlug = extractSlug(cleanedPath, 'user');
                if (userSlug) return `user/${userSlug}`;

                const ucMatch = cleanedPath.match(/\/channel\/(UC[\w-]{22})/i);
                if (ucMatch && ucMatch[1]) return ucMatch[1];

                const handleMatch = cleanedPath.match(/\/@([^/?#]+)/);
                if (handleMatch && handleMatch[1]) return '@' + handleMatch[1];
            }

            if (cleaned.startsWith('channel/')) return cleaned.replace('channel/', '');
            if (cleaned.startsWith('c/')) return cleaned;
            if (cleaned.startsWith('user/')) return cleaned;
            if (cleaned.startsWith('/c/')) {
                const slug = cleaned.split('/')[2];
                return slug ? `c/${slug}` : '';
            }
            if (cleaned.startsWith('/user/')) {
                const slug = cleaned.split('/')[2];
                return slug ? `user/${slug}` : '';
            }

            return cleaned;
        };

        const rawValue = String(input || '').trim();
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        // Support Kids/native flows that send `watch:<videoId>` as a placeholder identifier
        // when channel identity isn't available on the client.
        let videoIdFromInput = '';
        if (rawValue.startsWith('watch:')) {
            const candidate = rawValue.slice('watch:'.length).trim();
            if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
                videoIdFromInput = candidate;
            }
        } else if (/^[a-zA-Z0-9_-]{11}$/.test(rawValue)) {
            // Allow callers to pass a bare videoId as input.
            videoIdFromInput = rawValue;
        }

        const normalizedValue = normalizeChannelInput(rawValue);
        if (!normalizedValue) {
            return { success: false, error: 'Invalid channel identifier' };
        }

        // Validate format (but allow resolution by videoId when provided)
        const isHandle = normalizedValue.startsWith('@');
        const lowerNormalized = normalizedValue.toLowerCase();
        const isUcId = lowerNormalized.startsWith('uc') || lowerNormalized.startsWith('channel/uc');
        const isCustomUrl = lowerNormalized.startsWith('c/');
        const isUserUrl = lowerNormalized.startsWith('user/');

        const effectiveVideoId = (typeof videoId === 'string' && videoId.trim())
            ? videoId.trim()
            : videoIdFromInput;

        if (!isHandle && !isUcId && !isCustomUrl && !isUserUrl) {
            if (!effectiveVideoId) {
                return { success: false, error: 'Invalid channel identifier' };
            }
        }

        // Prefer canonical UC IDs via channelMap when available, especially for @handles
        let lookupValue = normalizedValue;
        let mappedId = null;

        if (isHandle) {
            try {
                const mapStorage = await storageGet(['channelMap']);
                const channelMap = mapStorage.channelMap || {};
                const lowerHandle = normalizedValue.toLowerCase();
                const candidateId = channelMap[lowerHandle];

                if (candidateId && candidateId.toUpperCase().startsWith('UC')) {
                    mappedId = candidateId;
                    lookupValue = candidateId;
                    console.log('FilterTube Background: Using mapped UC ID for handle', normalizedValue, '->', mappedId);
                }
            } catch (e) {
                console.warn('FilterTube Background: Failed to read channelMap for handle resolution:', e);
            }
        }

        // If we have a videoId and NO UC ID yet, try to resolve from the video page (Shorts, Watch, Kids)
        if (effectiveVideoId && (!lookupValue || !lookupValue.toUpperCase().startsWith('UC'))) {
            try {
                const isKids = profile === 'kids';
                const resolution = isKids
                    ? (await performKidsWatchIdentityFetch(effectiveVideoId) || await performWatchIdentityFetch(effectiveVideoId))
                    : await performWatchIdentityFetch(effectiveVideoId);

                if (resolution?.id && resolution.id.toUpperCase().startsWith('UC')) {
                    mappedId = resolution.id;
                    lookupValue = resolution.id;
                    if (!metadata.channelName && resolution.name) metadata.channelName = resolution.name;
                    if (!metadata.displayHandle && resolution.handle) metadata.displayHandle = resolution.handle;
                    console.log('FilterTube Background: Resolved UC ID from videoId:', effectiveVideoId, '->', mappedId);

                    try {
                        enqueueVideoChannelMapUpdate(effectiveVideoId, mappedId);
                    } catch (e) {
                    }

                    // If we have both handle and ID now, persist to channelMap
                    const resolvedHandle = (resolution.handle || (isHandle ? normalizedValue : '')).toLowerCase();
                    if (resolvedHandle && resolvedHandle.startsWith('@')) {
                        try {
                            const mapStorage = await storageGet(['channelMap']);
                            const currentMap = mapStorage.channelMap || {};
                            if (currentMap[resolvedHandle] !== mappedId) {
                                currentMap[resolvedHandle] = mappedId;
                                await browserAPI.storage.local.set({ channelMap: currentMap });
                            }
                        } catch (e) { }
                    }
                }
            } catch (e) {
                console.warn('FilterTube Background: Resolution from videoId failed:', e);
            }
        }

        // Fetch channel info (by UC ID when possible, otherwise by original input)
        console.log('FilterTube Background: Fetching channel info for:', lookupValue);
        let channelInfo = await fetchChannelInfo(lookupValue);

        // If scraping failed for a handle but we know a UC ID from channelMap, synthesize a minimal entry
        if (!channelInfo.success && isHandle && mappedId) {
            console.warn('FilterTube Background: fetchChannelInfo failed, falling back to mapped UC ID for handle', normalizedValue);
            channelInfo = {
                success: true,
                id: mappedId,
                handle: normalizedValue,
                name: normalizedValue,
                logo: null
            };
        }

        if (!channelInfo.success) {
            const fetchError = channelInfo.error || null;
            const fallbackId = (mappedId && String(mappedId).toUpperCase().startsWith('UC'))
                ? mappedId
                : (normalizedValue && String(normalizedValue).toUpperCase().startsWith('UC') ? normalizedValue
                    : (lookupValue && String(lookupValue).toUpperCase().startsWith('UC') ? lookupValue : ''));

            if (fallbackId) {
                const candidateHandle = (metadata.canonicalHandle || metadata.displayHandle || '').trim();
                const normalizedHandle = candidateHandle && candidateHandle.startsWith('@') ? candidateHandle.toLowerCase()
                    : (isHandle ? normalizedValue.toLowerCase() : '');

                const candidateName = (metadata.channelName || '').trim();
                channelInfo = {
                    success: true,
                    id: fallbackId,
                    handle: normalizedHandle || null,
                    name: candidateName || normalizedHandle || fallbackId,
                    logo: null,
                    customUrl: metadata.customUrl || null
                };
                console.warn('FilterTube Background: fetchChannelInfo failed; persisting minimal channel entry with UC ID', {
                    input: rawValue,
                    lookupValue,
                    id: fallbackId,
                    error: fetchError
                });
            }
        }

        if (!channelInfo.success) {
            return { success: false, error: channelInfo.error || 'Failed to fetch channel info' };
        }

        // Never persist a channel without a resolved UC ID.
        if (!channelInfo.id || typeof channelInfo.id !== 'string' || !channelInfo.id.toUpperCase().startsWith('UC')) {
            console.warn('FilterTube Background: Refusing to persist channel without UC ID', {
                input: rawValue,
                lookupValue,
                mappedId,
                channelInfo
            });
            return { success: false, error: 'Failed to resolve channel UC ID' };
        }

        // Get existing channels from the correct profile
        const isKids = profile === 'kids';
        const storageKeys = isKids ? ['ftProfilesV3'] : ['filterChannels'];
        const storage = await storageGet(storageKeys);

        let channels = [];
        let profilesV3 = null;
        if (isKids) {
            profilesV3 = storage.ftProfilesV3 || {};
            const kidsProfile = profilesV3.kids || {};
            channels = Array.isArray(kidsProfile.blockedChannels) ? kidsProfile.blockedChannels : [];
        } else {
            channels = Array.isArray(storage.filterChannels) ? storage.filterChannels : [];
        }

        // Build allCollaborators array from collaborationWith for popup grouping
        const allCollaborators = collaborationWith && collaborationWith.length > 0
            ? [{ handle: channelInfo.handle, name: channelInfo.name }, ...collaborationWith.map(h => ({ handle: h }))]
            : [];

        const canonicalHandle = (metadata.canonicalHandle || channelInfo.canonicalHandle || channelInfo.handle || (isHandle ? rawValue : '') || '').trim();
        const normalizedHandle = canonicalHandle ? canonicalHandle.toLowerCase() : (channelInfo.handle ? channelInfo.handle.toLowerCase() : '');
        const handleDisplay = metadata.displayHandle || channelInfo.handleDisplay || canonicalHandle || (metadata.channelName || channelInfo.name) || '';
        const finalChannelName = pickBetterName(metadata.channelName, channelInfo.name, handleDisplay, canonicalHandle, normalizedValue);

        if (normalizedHandle) {
            channelInfo.handle = normalizedHandle;
        }
        channelInfo.canonicalHandle = canonicalHandle || channelInfo.canonicalHandle || normalizedHandle || null;
        channelInfo.handleDisplay = handleDisplay || channelInfo.handleDisplay || channelInfo.canonicalHandle || channelInfo.handle || channelInfo.name || '';
        channelInfo.name = finalChannelName;

        // Check if channel already exists; if so, upgrade instead of rejecting
        const existingIndex = channels.findIndex(ch =>
            ch && (ch.id === channelInfo.id || ch.handle === channelInfo.handle)
        );

        let finalChannelData = null;

        if (existingIndex !== -1) {
            const existing = channels[existingIndex] || {};
            // Determine customUrl from metadata, channelInfo, or existing (decode for unicode consistency)
            let customUrl = metadata.customUrl || channelInfo.customUrl || existing.customUrl || null;
            if (customUrl) {
                try {
                    customUrl = decodeURIComponent(customUrl);
                } catch (e) { /* already decoded or invalid */ }
            }

            const updated = {
                ...existing,
                id: existing.id || channelInfo.id,
                handle: existing.handle || channelInfo.handle,
                handleDisplay: existing.handleDisplay || channelInfo.handleDisplay,
                canonicalHandle: existing.canonicalHandle || channelInfo.canonicalHandle,
                name: (existing.name && !(isHandleLike(existing.name) && !isHandleLike(finalChannelName)))
                    ? existing.name
                    : finalChannelName,
                logo: existing.logo || channelInfo.logo,
                customUrl: existing.customUrl || customUrl,
                source: existing.source || metadata.source || null,
                originalInput: existing.originalInput || customUrl || channelInfo.handle || channelInfo.id || rawValue,
                addedAt: existing.addedAt || Date.now()
            };

            if (filterAll && !existing.filterAll) {
                updated.filterAll = true;
            }

            if (Array.isArray(collaborationWith) && collaborationWith.length > 0) {
                const existingWith = Array.isArray(existing.collaborationWith) ? existing.collaborationWith : [];
                const mergedWith = [...new Set([...existingWith, ...collaborationWith])];
                updated.collaborationWith = mergedWith;
                updated.allCollaborators = allCollaborators;
            }

            if (collaborationGroupId) {
                updated.collaborationGroupId = collaborationGroupId;
            }

            channels[existingIndex] = updated;
            finalChannelData = updated;
            console.log(`FilterTube Background: Updated existing channel (${profile}):`, updated);
        } else {
            // Add new channel
            let customUrl = metadata.customUrl || channelInfo.customUrl || null;
            if (customUrl) {
                try {
                    customUrl = decodeURIComponent(customUrl);
                } catch (e) { /* already decoded or invalid */ }
            }

            const newChannel = {
                id: channelInfo.id,
                handle: channelInfo.handle,
                handleDisplay: channelInfo.handleDisplay || null,
                canonicalHandle: channelInfo.canonicalHandle || null,
                name: finalChannelName,
                logo: channelInfo.logo,
                filterAll: filterAll,
                collaborationWith: collaborationWith || [],
                collaborationGroupId: collaborationGroupId || null,
                allCollaborators: allCollaborators,
                customUrl: customUrl || null,
                source: metadata.source || (isKids ? 'user' : null),
                originalInput: customUrl || channelInfo.handle || channelInfo.id || rawValue,
                addedAt: Date.now()
            };

            channels.unshift(newChannel);
            finalChannelData = newChannel;
            console.log(`FilterTube Background: Successfully added channel (${profile}):`, newChannel);
        }

        // Update channelMap with customUrl → UC ID mapping if available
        const customUrlToMap = finalChannelData.customUrl || metadata.customUrl || channelInfo.customUrl;
        if (customUrlToMap && finalChannelData.id) {
            try {
                const mapStorage = await storageGet(['channelMap']);
                const channelMap = mapStorage.channelMap || {};
                let normalizedCustomUrl = customUrlToMap.toLowerCase();
                try {
                    normalizedCustomUrl = decodeURIComponent(normalizedCustomUrl).toLowerCase();
                } catch (e) { }

                if (!channelMap[normalizedCustomUrl] || channelMap[normalizedCustomUrl] !== finalChannelData.id) {
                    channelMap[normalizedCustomUrl] = finalChannelData.id;
                    await browserAPI.storage.local.set({ channelMap: channelMap });
                    console.log('FilterTube Background: Added customUrl mapping:', normalizedCustomUrl, '->', finalChannelData.id);
                }
            } catch (e) { }
        }

        // Save back to storage
        if (isKids) {
            profilesV3.kids = {
                ...(profilesV3.kids || {}),
                blockedChannels: channels
            };
            await browserAPI.storage.local.set({ ftProfilesV3: profilesV3 });

            // Broadcast refresh for Kids
            try {
                browserAPI.tabs.query({ url: ['*://*.youtubekids.com/*'] }, tabs => {
                    (tabs || []).forEach(tab => {
                        if (tab?.id) browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_RefreshNow' }, () => { });
                    });
                });
            } catch (e) { }
        } else {
            await browserAPI.storage.local.set({ filterChannels: channels });
        }

        return {
            success: true,
            channelData: finalChannelData,
            updated: existingIndex !== -1
        };

    } catch (error) {
        console.error('FilterTube Background: Error adding channel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle toggling Filter All Content for a channel
 * @param {string} channelId - Channel ID or handle
 * @param {boolean} value - New filterAll value
 * @returns {Promise<Object>} Result with success status
 */
async function handleToggleChannelFilterAll(channelId, value) {
    try {
        // Get existing channels
        const storage = await new Promise(resolve => {
            browserAPI.storage.local.get(['filterChannels'], resolve);
        });

        const channels = Array.isArray(storage.filterChannels) ? storage.filterChannels : [];

        // Find channel by ID or handle
        const channelIndex = channels.findIndex(ch =>
            ch.id === channelId || ch.handle === channelId
        );

        if (channelIndex === -1) {
            return { success: false, error: 'Channel not found' };
        }

        // Toggle filterAll
        channels[channelIndex].filterAll = value;

        // Save to storage
        await new Promise(resolve => {
            browserAPI.storage.local.set({ filterChannels: channels }, resolve);
        });

        console.log('FilterTube Background: Toggled filterAll for channel:', channelId, 'to:', value);

        return { success: true };

    } catch (error) {
        console.error('FilterTube Background: Error toggling filterAll:', error);
        return { success: false, error: error.message };
    }
}

console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} loaded and ready to serve filtered content.`);

