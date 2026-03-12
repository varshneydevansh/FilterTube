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

try {
    if (typeof importScripts === 'function' && !globalThis.FilterTubeSecurity) {
        importScripts('security_manager.js');
    }
} catch (e) {
    console.warn('FilterTube Background: Failed to load security helpers', e);
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeObject(value) {
    return value && typeof value === 'object' ? value : {};
}

function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function nowTs() {
    return Date.now();
}

function isValidProfilesV4(value) {
    return !!(
        value
        && typeof value === 'object'
        && !Array.isArray(value)
        && typeof value.activeProfileId === 'string'
        && value.activeProfileId.trim()
        && value.profiles
        && typeof value.profiles === 'object'
        && !Array.isArray(value.profiles)
    );
}

function buildAutoBackupPayload({ settings, profilesV3, theme }) {
    const s = safeObject(settings);
    const p = safeObject(profilesV3);
    const mainProfile = safeObject(p.main);
    const kidsProfile = safeObject(p.kids);

    const profilesV4 = s?.ftProfilesV4;
    const hasProfilesV4 = isValidProfilesV4(profilesV4);
    const activeProfileId = hasProfilesV4 && typeof profilesV4.activeProfileId === 'string'
        ? profilesV4.activeProfileId
        : 'default';
    const activeProfile = hasProfilesV4
        ? safeObject(safeObject(profilesV4.profiles)[activeProfileId])
        : {};
    const activeProfileName = normalizeString(activeProfile?.name) || (activeProfileId === 'default' ? 'Default' : activeProfileId);

    const exportType = (activeProfileId === 'default') ? 'full' : 'profile';
    const effectiveProfilesV4 = hasProfilesV4
        ? (exportType === 'full'
            ? profilesV4
            : {
                schemaVersion: 4,
                activeProfileId,
                profiles: {
                    [activeProfileId]: activeProfile
                }
            })
        : null;

    const activeMainV4 = safeObject(activeProfile?.main);
    const activeKidsV4 = safeObject(activeProfile?.kids);
    const activeSettingsV4 = safeObject(activeProfile?.settings);
    const applyKidsRulesOnMain = hasProfilesV4
        ? !!activeSettingsV4.syncKidsToMain
        : !!mainProfile.applyKidsRulesOnMain;

    const mainMode = hasProfilesV4
        ? (activeMainV4.mode === 'whitelist' ? 'whitelist' : 'blocklist')
        : (typeof mainProfile.mode === 'string' ? mainProfile.mode : 'blocklist');
    const kidsMode = hasProfilesV4
        ? (activeKidsV4.mode === 'whitelist' ? 'whitelist' : 'blocklist')
        : (typeof kidsProfile.mode === 'string' ? kidsProfile.mode : 'blocklist');

    const mainWhitelistChannels = hasProfilesV4
        ? safeArray(activeMainV4.whitelistChannels)
        : safeArray(mainProfile.whitelistedChannels);
    const mainWhitelistKeywords = hasProfilesV4
        ? safeArray(activeMainV4.whitelistKeywords)
        : safeArray(mainProfile.whitelistedKeywords);

    const kidsWhitelistChannels = hasProfilesV4
        ? safeArray(activeKidsV4.whitelistChannels)
        : safeArray(kidsProfile.whitelistedChannels);
    const kidsWhitelistKeywords = hasProfilesV4
        ? safeArray(activeKidsV4.whitelistKeywords)
        : safeArray(kidsProfile.whitelistedKeywords);

    return {
        meta: {
            version: 3,
            timestamp: nowTs(),
            application: 'FilterTube',
            exportType,
            profileId: activeProfileId,
            profileName: activeProfileName
        },
        ...(effectiveProfilesV4 ? { profilesV4: effectiveProfilesV4 } : {}),
        settings: {
            theme: theme === 'dark' ? 'dark' : 'light',
            sync: {
                enabled: false,
                deviceName: null
            },
            main: {
                mode: mainMode,
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
                applyKidsRulesOnMain
            },
            kids: {
                mode: kidsMode,
                strictMode: hasProfilesV4 ? (activeKidsV4.strictMode !== false) : (kidsProfile.strictMode !== false),
                enableSearch: true
            }
        },
        profiles: {
            main: {
                channels: safeArray(s.channels),
                keywords: safeArray(s.keywords),
                videoIds: safeArray(mainProfile.videoIds),
                whitelistChannels: mainWhitelistChannels,
                whitelistKeywords: mainWhitelistKeywords,
                whitelistedChannels: mainWhitelistChannels,
                whitelistedKeywords: mainWhitelistKeywords,
                subscriptions: safeArray(mainProfile.subscriptions)
            },
            kids: {
                blockedChannels: hasProfilesV4 ? safeArray(activeKidsV4.blockedChannels) : safeArray(kidsProfile.blockedChannels),
                blockedKeywords: hasProfilesV4 ? safeArray(activeKidsV4.blockedKeywords) : safeArray(kidsProfile.blockedKeywords),
                whitelistChannels: kidsWhitelistChannels,
                whitelistKeywords: kidsWhitelistKeywords,
                whitelistedChannels: kidsWhitelistChannels,
                whitelistedKeywords: kidsWhitelistKeywords,
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
            'ftAutoBackupEnabled',
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
            'ftProfilesV4',
            'ftProfilesV3',
            'ftThemePreference'
        ], items => {
            const theme = items?.ftThemePreference === 'dark' ? 'dark' : 'light';

            const storedProfilesV4 = items?.ftProfilesV4;
            const hasProfilesV4 = isValidProfilesV4(storedProfilesV4);
            const activeProfileId = hasProfilesV4 && typeof storedProfilesV4.activeProfileId === 'string'
                ? storedProfilesV4.activeProfileId
                : DEFAULT_PROFILE_ID;
            const activeProfile = hasProfilesV4
                ? safeObject(safeObject(storedProfilesV4.profiles)?.[activeProfileId])
                : {};
            const activeMain = safeObject(activeProfile.main);
            const activeSettings = safeObject(activeProfile.settings);

            const boolFromV4 = (key, legacyValue) => {
                try {
                    if (Object.prototype.hasOwnProperty.call(activeSettings, key)) {
                        return !!activeSettings[key];
                    }
                } catch (e) {
                }
                return !!legacyValue;
            };

            const enabledFromV4 = (() => {
                try {
                    if (Object.prototype.hasOwnProperty.call(activeSettings, 'enabled')) {
                        return activeSettings.enabled !== false;
                    }
                } catch (e) {
                }
                return items?.enabled !== false;
            })();

            const hideCommentsFromV4 = boolFromV4('hideComments', !!items?.hideAllComments);
            const filterCommentsFromV4 = hideCommentsFromV4 ? false : boolFromV4('filterComments', !!items?.filterComments);

            const channelsFromV4 = (hasProfilesV4 && Array.isArray(activeMain.channels))
                ? activeMain.channels
                : safeArray(items?.filterChannels);
            const keywordsFromV4 = (hasProfilesV4 && Array.isArray(activeMain.keywords))
                ? activeMain.keywords
                : safeArray(items?.uiKeywords);

            const settings = {
                enabled: enabledFromV4,
                channels: channelsFromV4,
                keywords: keywordsFromV4,
                autoBackupEnabled: (() => {
                    try {
                        if (Object.prototype.hasOwnProperty.call(activeSettings, 'autoBackupEnabled')) {
                            return activeSettings.autoBackupEnabled === true;
                        }
                    } catch (e) {
                    }
                    return items?.ftAutoBackupEnabled === true;
                })(),
                autoBackupMode: (() => {
                    try {
                        const raw = typeof activeSettings.autoBackupMode === 'string' ? activeSettings.autoBackupMode.trim().toLowerCase() : '';
                        if (raw === 'history' || raw === 'latest') return raw;
                    } catch (e) {
                    }
                    return 'latest';
                })(),
                autoBackupFormat: (() => {
                    try {
                        const raw = typeof activeSettings.autoBackupFormat === 'string' ? activeSettings.autoBackupFormat.trim().toLowerCase() : '';
                        if (raw === 'plain' || raw === 'encrypted' || raw === 'auto') return raw;
                    } catch (e) {
                    }
                    return 'auto';
                })(),
                hideShorts: boolFromV4('hideShorts', !!items?.hideAllShorts),
                hideComments: hideCommentsFromV4,
                filterComments: filterCommentsFromV4,
                hideHomeFeed: boolFromV4('hideHomeFeed', !!items?.hideHomeFeed),
                hideSponsoredCards: boolFromV4('hideSponsoredCards', !!items?.hideSponsoredCards),
                hideWatchPlaylistPanel: boolFromV4('hideWatchPlaylistPanel', !!items?.hideWatchPlaylistPanel),
                hidePlaylistCards: boolFromV4('hidePlaylistCards', !!items?.hidePlaylistCards),
                hideMembersOnly: boolFromV4('hideMembersOnly', !!items?.hideMembersOnly),
                hideMixPlaylists: boolFromV4('hideMixPlaylists', !!items?.hideMixPlaylists),
                hideVideoSidebar: boolFromV4('hideVideoSidebar', !!items?.hideVideoSidebar),
                hideRecommended: boolFromV4('hideRecommended', !!items?.hideRecommended),
                hideLiveChat: boolFromV4('hideLiveChat', !!items?.hideLiveChat),
                hideVideoInfo: boolFromV4('hideVideoInfo', !!items?.hideVideoInfo),
                hideVideoButtonsBar: boolFromV4('hideVideoButtonsBar', !!items?.hideVideoButtonsBar),
                hideAskButton: boolFromV4('hideAskButton', !!items?.hideAskButton),
                hideVideoChannelRow: boolFromV4('hideVideoChannelRow', !!items?.hideVideoChannelRow),
                hideVideoDescription: boolFromV4('hideVideoDescription', !!items?.hideVideoDescription),
                hideMerchTicketsOffers: boolFromV4('hideMerchTicketsOffers', !!items?.hideMerchTicketsOffers),
                hideEndscreenVideowall: boolFromV4('hideEndscreenVideowall', !!items?.hideEndscreenVideowall),
                hideEndscreenCards: boolFromV4('hideEndscreenCards', !!items?.hideEndscreenCards),
                disableAutoplay: boolFromV4('disableAutoplay', !!items?.disableAutoplay),
                disableAnnotations: boolFromV4('disableAnnotations', !!items?.disableAnnotations),
                hideTopHeader: boolFromV4('hideTopHeader', !!items?.hideTopHeader),
                hideNotificationBell: boolFromV4('hideNotificationBell', !!items?.hideNotificationBell),
                hideExploreTrending: boolFromV4('hideExploreTrending', !!items?.hideExploreTrending),
                hideMoreFromYouTube: boolFromV4('hideMoreFromYouTube', !!items?.hideMoreFromYouTube),
                hideSubscriptions: boolFromV4('hideSubscriptions', !!items?.hideSubscriptions),
                hideSearchShelves: boolFromV4('hideSearchShelves', !!items?.hideSearchShelves),
                channelMap: safeObject(items?.channelMap),
                ftProfilesV4: items?.ftProfilesV4 || null,
                theme
            };
            const profilesV3 = safeObject(items?.ftProfilesV3);
            resolve({ settings, profilesV3, theme });
        });
    });
}

function isTrustedUiSender(sender) {
    try {
        if (!sender) return false;
        const url = typeof sender.url === 'string' ? sender.url : '';
        if (!url) return false;
        const base = typeof browserAPI?.runtime?.getURL === 'function' ? browserAPI.runtime.getURL('') : '';
        return !!(base && url.startsWith(base));
    } catch (e) {
        return false;
    }
}

function extractPinVerifierFromProfilesV4(profilesV4, profileId) {
    const root = safeObject(profilesV4);
    const profiles = safeObject(root.profiles);
    const profile = safeObject(profiles[profileId]);
    const security = safeObject(profile.security);
    if (profileId === DEFAULT_PROFILE_ID) {
        const verifier = security.masterPinVerifier || security.masterPin || null;
        return verifier && typeof verifier === 'object' ? verifier : null;
    }
    const verifier = security.profilePinVerifier || security.pinVerifier || null;
    return verifier && typeof verifier === 'object' ? verifier : null;
}

const sessionPinCache = new Map();

async function verifyAndCacheSessionPin(profileId, pin) {
    const Security = globalThis.FilterTubeSecurity || null;
    if (!Security || typeof Security.verifyPin !== 'function') {
        throw new Error('Security manager unavailable');
    }

    const stored = await new Promise(resolve => {
        browserAPI.storage.local.get([FT_PROFILES_V4_KEY], items => resolve(items?.[FT_PROFILES_V4_KEY] || null));
    });
    if (!isValidProfilesV4(stored)) {
        throw new Error('Profiles unavailable');
    }
    const verifier = extractPinVerifierFromProfilesV4(stored, profileId);
    if (!verifier) {
        sessionPinCache.delete(profileId);
        return { ok: true, stored: false, reason: 'no_pin' };
    }
    const ok = await Security.verifyPin(pin, verifier);
    if (!ok) {
        return { ok: false, error: 'Incorrect PIN' };
    }
    sessionPinCache.set(profileId, pin);
    return { ok: true, stored: true };
}

function rotateAutoBackups(keepCount = 10, label = '') {
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
            const safeLabel = typeof label === 'string' ? label.trim() : '';
            const folderNeedle = safeLabel ? `FilterTube Backup/${safeLabel}/` : '';
            const backups = items
                .filter(d => (d?.filename || '').includes('FilterTube-Backup-'))
                .filter(d => !folderNeedle || (d?.filename || '').includes(folderNeedle))
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

    const { settings, profilesV3, theme } = await readAutoBackupState();
    if (!settings || settings.autoBackupEnabled !== true) {
        return { ok: true, skipped: true, reason: 'disabled' };
    }
    const payload = buildAutoBackupPayload({ settings, profilesV3, theme });

    payload.meta.backupType = 'auto';
    payload.meta.trigger = triggerType || 'unknown';
    payload.meta.backupLocation = 'FilterTube Backup';

    const safePart = (value) => {
        const raw = typeof value === 'string' ? value.trim() : '';
        if (!raw) return '';
        return raw
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9._-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^[-_.]+|[-_.]+$/g, '')
            .slice(0, 48);
    };

    const label = safePart(typeof payload?.meta?.profileName === 'string' ? payload.meta.profileName : '')
        || safePart(typeof payload?.meta?.profileId === 'string' ? payload.meta.profileId : '')
        || 'Default';
    const profilesV4 = safeObject(settings?.ftProfilesV4);
    const activeId = normalizeString(profilesV4?.activeProfileId) || DEFAULT_PROFILE_ID;
    const hasPin = !!extractPinVerifierFromProfilesV4(profilesV4, activeId);
    const format = typeof settings?.autoBackupFormat === 'string' ? settings.autoBackupFormat : 'auto';
    const shouldEncrypt = (format === 'encrypted') || (format !== 'plain' && hasPin);

    let exportObject = payload;
    let ext = 'json';
    if (shouldEncrypt) {
        const pin = sessionPinCache.get(activeId) || '';
        if (!pin) {
            return { ok: true, skipped: true, reason: 'missing_session_pin' };
        }
        const Security = globalThis.FilterTubeSecurity || null;
        if (!Security || typeof Security.encryptJson !== 'function') {
            return { ok: false, reason: 'security_unavailable' };
        }
        const encrypted = await Security.encryptJson(payload, pin);
        exportObject = {
            meta: {
                ...safeObject(payload?.meta),
                encrypted: true
            },
            encrypted
        };
        ext = 'encrypted.json';
    }

    const mode = typeof settings?.autoBackupMode === 'string' ? settings.autoBackupMode : 'latest';
    const useHistory = mode === 'history';
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = useHistory
        ? `FilterTube-Backup-${timestamp}.${ext}`
        : `FilterTube-Backup-Latest.${ext}`;
    const fullPath = `FilterTube Backup/${label}/${fileName}`;

    const jsonData = JSON.stringify(exportObject, null, 2);
    const hasObjectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    const downloadUrl = hasObjectUrl
        ? URL.createObjectURL(new Blob([jsonData], { type: 'application/json' }))
        : `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`;

    return new Promise(resolve => {
        browserAPI.downloads.download({
            url: downloadUrl,
            filename: fullPath,
            saveAs: false,
            conflictAction: useHistory ? 'uniquify' : 'overwrite'
        }, downloadId => {
            if (hasObjectUrl) {
                try {
                    URL.revokeObjectURL(downloadUrl);
                } catch (e) {
                }
            }
            const err = browserAPI.runtime?.lastError;
            if (err) {
                resolve({ ok: false, reason: err.message || 'download_failed' });
                return;
            }

            if (useHistory) {
                try {
                    rotateAutoBackups(10, label);
                } catch (e) {
                }
            }

            resolve({ ok: true, filename: fullPath, downloadId });
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
const pendingPostBlockEnrichments = new Map();
const postBlockEnrichmentAttempted = new Map();
const queuedPostBlockEnrichmentKeys = new Set();
let postBlockEnrichmentWorker = Promise.resolve();
const CURRENT_VERSION = (browserAPI.runtime.getManifest()?.version || '').trim();
const FT_PROFILES_V4_KEY = 'ftProfilesV4';
const DEFAULT_PROFILE_ID = 'default';
const QUICK_BLOCK_DEFAULT_MIGRATION_KEY = 'quickBlockDefaultV327Applied';
const QUICK_BLOCK_DEFAULT_TARGET_VERSION = '3.2.7';

function compareSemver(a = '', b = '') {
    const toParts = (value) => String(value || '')
        .trim()
        .split('.')
        .map(part => parseInt(part, 10))
        .map(num => (Number.isFinite(num) ? num : 0));
    const ap = toParts(a);
    const bp = toParts(b);
    const len = Math.max(ap.length, bp.length, 3);
    for (let i = 0; i < len; i++) {
        const av = ap[i] || 0;
        const bv = bp[i] || 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }
    return 0;
}

function isVersionAtLeast(version, minimum) {
    return compareSemver(version, minimum) >= 0;
}

function applyQuickBlockDefaultMigrationOnce({ previousVersion = '', isInstall = false } = {}) {
    return new Promise((resolve) => {
        browserAPI.storage.local.get([FT_PROFILES_V4_KEY, QUICK_BLOCK_DEFAULT_MIGRATION_KEY, 'showQuickBlockButton'], (items) => {
            try {
                if (items?.[QUICK_BLOCK_DEFAULT_MIGRATION_KEY]) {
                    resolve(false);
                    return;
                }

                // Apply only on install or when moving from pre-v3.2.7 to v3.2.7+.
                const shouldApplyByVersion = isInstall
                    || !previousVersion
                    || compareSemver(previousVersion, QUICK_BLOCK_DEFAULT_TARGET_VERSION) < 0;
                if (!shouldApplyByVersion || !isVersionAtLeast(CURRENT_VERSION, QUICK_BLOCK_DEFAULT_TARGET_VERSION)) {
                    resolve(false);
                    return;
                }

                const updates = {
                    [QUICK_BLOCK_DEFAULT_MIGRATION_KEY]: true,
                    showQuickBlockButton: true
                };

                const profilesV4 = items?.[FT_PROFILES_V4_KEY];
                if (profilesV4 && typeof profilesV4 === 'object' && profilesV4.profiles && typeof profilesV4.profiles === 'object') {
                    const nextProfiles = {};
                    for (const [profileId, rawProfile] of Object.entries(profilesV4.profiles)) {
                        const profile = (rawProfile && typeof rawProfile === 'object') ? rawProfile : {};
                        const settings = (profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings))
                            ? profile.settings
                            : {};
                        nextProfiles[profileId] = {
                            ...profile,
                            settings: {
                                ...settings,
                                showQuickBlockButton: true
                            }
                        };
                    }
                    updates[FT_PROFILES_V4_KEY] = {
                        ...profilesV4,
                        profiles: nextProfiles
                    };
                }

                browserAPI.storage.local.set(updates, () => resolve(true));
            } catch (e) {
                browserAPI.storage.local.set({ [QUICK_BLOCK_DEFAULT_MIGRATION_KEY]: true }, () => resolve(false));
            }
        });
    });
}

function schedulePostBlockEnrichment(channel, profile = 'main', metadata = {}) {
    const source = typeof metadata?.source === 'string' ? metadata.source : '';
    if (source === 'postBlockEnrichment') return;

    const topicFlag = channel?.topicChannel === true || metadata?.topicChannel === true;
    if (topicFlag) return;

    const id = typeof channel?.id === 'string' ? channel.id.trim() : '';
    if (!id || !id.toUpperCase().startsWith('UC')) return;

    const key = `${profile === 'kids' ? 'kids' : 'main'}:${id.toLowerCase()}`;
    const now = Date.now();
    const lastAttempt = postBlockEnrichmentAttempted.get(key) || 0;
    if (now - lastAttempt < 6 * 60 * 60 * 1000) return;

    const name = typeof channel?.name === 'string' ? channel.name.trim() : '';
    const handle = typeof channel?.handle === 'string' ? channel.handle.trim() : '';
    const customUrl = typeof channel?.customUrl === 'string' ? channel.customUrl.trim() : '';
    const logo = typeof channel?.logo === 'string' ? channel.logo.trim() : '';

    const needsEnrichment = ((!handle && !customUrl) || !logo || !name);
    if (!needsEnrichment) return;

    if (pendingPostBlockEnrichments.has(key) || queuedPostBlockEnrichmentKeys.has(key)) return;
    postBlockEnrichmentAttempted.set(key, now);
    queuedPostBlockEnrichmentKeys.add(key);

    const delayMs = 3500 + Math.floor(Math.random() * 750);

    const run = postBlockEnrichmentWorker
        .then(() => new Promise(resolve => setTimeout(resolve, delayMs)))
        .then(() => handleAddFilteredChannel(
            id,
            false,
            null,
            null,
            { source: 'postBlockEnrichment' },
            profile === 'kids' ? 'kids' : 'main',
            ''
        ))
        .catch(() => {
        })
        .finally(() => {
            pendingPostBlockEnrichments.delete(key);
            queuedPostBlockEnrichmentKeys.delete(key);
        });

    postBlockEnrichmentWorker = run.catch(() => {
    });
    pendingPostBlockEnrichments.set(key, run);
}

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

let channelMapCache = null;
let channelMapLoadPromise = null;
let channelMapFlushPromise = Promise.resolve();
let channelMapFlushTimer = null;
const pendingChannelMapUpdates = new Map();

let videoChannelMapCache = null;
let videoChannelMapLoadPromise = null;
let videoChannelMapFlushPromise = Promise.resolve();
let videoChannelMapFlushTimer = null;
const pendingVideoChannelMapUpdates = new Map();

let videoMetaMapCache = null;
let videoMetaMapLoadPromise = null;
let videoMetaMapFlushPromise = Promise.resolve();
let videoMetaMapFlushTimer = null;
const pendingVideoMetaMapUpdates = new Map();

let autoBackupTimer = null;
let pendingAutoBackupTrigger = null;
let pendingAutoBackupOptions = null;

function isKidsUrl(url) {
    return typeof url === 'string' && url.includes('youtubekids.com');
}

function buildProfilesV4FromLegacyState(items, storageUpdates = {}) {
    const profilesV3 = safeObject(items?.ftProfilesV3);
    const kidsV3 = safeObject(profilesV3.kids);
    const mainV3 = safeObject(profilesV3.main);
    const now = nowTs();

    const enabled = items?.enabled !== false;
    const hideComments = !!items?.hideAllComments;

    const rawChannels = Object.prototype.hasOwnProperty.call(storageUpdates, 'filterChannels')
        ? storageUpdates.filterChannels
        : items?.filterChannels;

    let mainChannels = [];
    if (Array.isArray(rawChannels)) {
        mainChannels = rawChannels;
    } else if (typeof rawChannels === 'string') {
        mainChannels = rawChannels
            .split(',')
            .map(c => c.trim())
            .filter(Boolean)
            .map(c => ({
                name: c,
                id: c,
                handle: null,
                handleDisplay: c,
                canonicalHandle: null,
                logo: null,
                filterAll: false,
                originalInput: c
            }));
    }

    const rawKeywords = Object.prototype.hasOwnProperty.call(storageUpdates, 'uiKeywords')
        ? storageUpdates.uiKeywords
        : items?.uiKeywords;

    let mainKeywords = [];
    if (Array.isArray(rawKeywords)) {
        mainKeywords = rawKeywords;
    } else if (Array.isArray(items?.filterKeywords)) {
        mainKeywords = items.filterKeywords
            .map(keyword => {
                const pattern = typeof keyword?.pattern === 'string' ? keyword.pattern : '';
                if (!pattern) return null;
                const isExact = pattern.startsWith('\\b') && pattern.endsWith('\\b');
                const raw = pattern
                    .replace(/^\\b/, '')
                    .replace(/\\b$/, '')
                    .replace(/\\(.)/g, '$1');
                const word = raw.trim();
                if (!word) return null;
                return { word, exact: isExact, comments: true, addedAt: now, source: 'user' };
            })
            .filter(Boolean);
    } else if (typeof items?.filterKeywords === 'string') {
        mainKeywords = items.filterKeywords
            .split(',')
            .map(word => word.trim())
            .filter(Boolean)
            .map(word => ({ word, exact: false, comments: true, addedAt: now, source: 'user' }));
    }

    return {
        schemaVersion: 4,
        activeProfileId: DEFAULT_PROFILE_ID,
        profiles: {
            [DEFAULT_PROFILE_ID]: {
                type: 'account',
                parentProfileId: null,
                name: 'Default',
                settings: {
                    syncKidsToMain: !!mainV3.applyKidsRulesOnMain,
                    enabled,
                    hideShorts: !!items?.hideAllShorts,
                    hideComments,
                    filterComments: hideComments ? false : !!items?.filterComments,
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
                    hideSearchShelves: !!items?.hideSearchShelves
                },
                main: {
                    mode: 'blocklist',
                    channels: safeArray(mainChannels),
                    keywords: safeArray(mainKeywords),
                    whitelistChannels: [],
                    whitelistKeywords: []
                },
                kids: {
                    mode: 'blocklist',
                    strictMode: kidsV3.strictMode !== false,
                    blockedChannels: safeArray(kidsV3.blockedChannels),
                    blockedKeywords: safeArray(kidsV3.blockedKeywords),
                    whitelistChannels: [],
                    whitelistKeywords: []
                }
            }
        }
    };
}

function ensureChannelMapCache() {
    if (channelMapCache && typeof channelMapCache === 'object') {
        return Promise.resolve(channelMapCache);
    }
    if (channelMapLoadPromise) return channelMapLoadPromise;

    channelMapLoadPromise = storageGet(['channelMap']).then(result => {
        const stored = result?.channelMap;
        channelMapCache = stored && typeof stored === 'object' ? { ...stored } : {};
        channelMapLoadPromise = null;
        return channelMapCache;
    }).catch(() => {
        channelMapCache = {};
        channelMapLoadPromise = null;
        return channelMapCache;
    });

    return channelMapLoadPromise;
}

function flushChannelMapUpdates() {
    channelMapFlushPromise = channelMapFlushPromise.then(async () => {
        if (pendingChannelMapUpdates.size === 0) return;
        const map = await ensureChannelMapCache();
        for (const [key, value] of pendingChannelMapUpdates.entries()) {
            if (!key || !value) continue;
            map[key] = value;
        }
        pendingChannelMapUpdates.clear();
        await browserAPI.storage.local.set({ channelMap: map });
    }).catch(() => {
    });
    return channelMapFlushPromise;
}

function scheduleChannelMapFlush() {
    if (channelMapFlushTimer) return;
    channelMapFlushTimer = setTimeout(() => {
        channelMapFlushTimer = null;
        flushChannelMapUpdates();
    }, 250);
}

function enqueueChannelMapUpdate(key, value) {
    const k = typeof key === 'string' ? key.trim().toLowerCase() : '';
    const v = typeof value === 'string' ? value.trim() : '';
    if (!k || !v) return;
    pendingChannelMapUpdates.set(k, v);

    if (channelMapCache && typeof channelMapCache === 'object') {
        channelMapCache[k] = v;
    }

    if (compiledSettingsCache.main) {
        compiledSettingsCache.main.channelMap = channelMapCache || compiledSettingsCache.main.channelMap;
    }
    if (compiledSettingsCache.kids) {
        compiledSettingsCache.kids.channelMap = channelMapCache || compiledSettingsCache.kids.channelMap;
    }

    scheduleChannelMapFlush();
}

function enqueueChannelMapMappings(mappings = []) {
    const list = Array.isArray(mappings) ? mappings : [];
    if (list.length === 0) return;

    list.forEach(m => {
        if (!m || !m.id || !m.handle) return;
        const keyId = String(m.id).toLowerCase();
        const keyHandle = String(m.handle).toLowerCase();
        enqueueChannelMapUpdate(keyId, m.handle);
        enqueueChannelMapUpdate(keyHandle, m.id);
    });
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

function ensureVideoMetaMapCache() {
    if (videoMetaMapCache && typeof videoMetaMapCache === 'object') {
        return Promise.resolve(videoMetaMapCache);
    }
    if (videoMetaMapLoadPromise) return videoMetaMapLoadPromise;

    videoMetaMapLoadPromise = storageGet(['videoMetaMap']).then(result => {
        const stored = result?.videoMetaMap;
        videoMetaMapCache = stored && typeof stored === 'object' ? { ...stored } : {};
        videoMetaMapLoadPromise = null;
        return videoMetaMapCache;
    }).catch(() => {
        videoMetaMapCache = {};
        videoMetaMapLoadPromise = null;
        return videoMetaMapCache;
    });

    return videoMetaMapLoadPromise;
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

function enforceVideoMetaMapCap(map) {
    if (!map || typeof map !== 'object') return;
    const keys = Object.keys(map);
    const MAX_VIDEO_META_ENTRIES = 2000;
    const EVICT_COUNT = 500;
    if (keys.length <= MAX_VIDEO_META_ENTRIES) return;
    keys.slice(0, EVICT_COUNT).forEach(k => {
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

function flushVideoMetaMapUpdates() {
    videoMetaMapFlushPromise = videoMetaMapFlushPromise.then(async () => {
        if (pendingVideoMetaMapUpdates.size === 0) return;
        const map = await ensureVideoMetaMapCache();
        for (const [videoId, meta] of pendingVideoMetaMapUpdates.entries()) {
            if (!videoId || !meta) continue;
            try {
                if (Object.prototype.hasOwnProperty.call(map, videoId)) {
                    delete map[videoId];
                }
            } catch (e) {
            }
            map[videoId] = meta;
        }
        pendingVideoMetaMapUpdates.clear();
        enforceVideoMetaMapCap(map);
        await browserAPI.storage.local.set({ videoMetaMap: map });
    }).catch(() => {
    });
    return videoMetaMapFlushPromise;
}

function scheduleVideoChannelMapFlush() {
    if (videoChannelMapFlushTimer) return;
    videoChannelMapFlushTimer = setTimeout(() => {
        videoChannelMapFlushTimer = null;
        flushVideoChannelMapUpdates();
    }, 50);
}

function scheduleVideoMetaMapFlush() {
    if (videoMetaMapFlushTimer) return;
    videoMetaMapFlushTimer = setTimeout(() => {
        videoMetaMapFlushTimer = null;
        flushVideoMetaMapUpdates();
    }, 75);
}

function enqueueVideoChannelMapUpdate(videoId, channelId) {
    const v = typeof videoId === 'string' ? videoId.trim() : '';
    const c = typeof channelId === 'string' ? channelId.trim() : '';
    if (!v || !c) return;
    pendingVideoChannelMapUpdates.set(v, c);

    if (videoChannelMapCache && typeof videoChannelMapCache === 'object') {
        videoChannelMapCache[v] = c;
    }

    if (compiledSettingsCache.main) {
        compiledSettingsCache.main.videoChannelMap = videoChannelMapCache || compiledSettingsCache.main.videoChannelMap;
    }
    if (compiledSettingsCache.kids) {
        compiledSettingsCache.kids.videoChannelMap = videoChannelMapCache || compiledSettingsCache.kids.videoChannelMap;
    }
    scheduleVideoChannelMapFlush();
}

function enqueueVideoMetaMapUpdate(videoId, meta) {
    const v = typeof videoId === 'string' ? videoId.trim() : '';
    if (!v) return;
    if (!meta || typeof meta !== 'object') return;

    const lengthSecondsRaw = meta.lengthSeconds;
    const publishDateRaw = meta.publishDate;
    const uploadDateRaw = meta.uploadDate;
    const categoryRaw = meta.category;

    const clean = {
        lengthSeconds: (typeof lengthSecondsRaw === 'number' && Number.isFinite(lengthSecondsRaw))
            ? lengthSecondsRaw
            : (typeof lengthSecondsRaw === 'string' ? lengthSecondsRaw.trim() : null),
        publishDate: (typeof publishDateRaw === 'string' ? publishDateRaw.trim() : ''),
        uploadDate: (typeof uploadDateRaw === 'string' ? uploadDateRaw.trim() : ''),
        category: (typeof categoryRaw === 'string' ? categoryRaw.trim() : '')
    };

    if (!clean.lengthSeconds && !clean.publishDate && !clean.uploadDate && !clean.category) return;
    pendingVideoMetaMapUpdates.set(v, clean);

    if (videoMetaMapCache && typeof videoMetaMapCache === 'object') {
        try {
            if (Object.prototype.hasOwnProperty.call(videoMetaMapCache, v)) {
                delete videoMetaMapCache[v];
            }
        } catch (e) {
        }
        videoMetaMapCache[v] = clean;
    }

    if (compiledSettingsCache.main) {
        compiledSettingsCache.main.videoMetaMap = videoMetaMapCache || compiledSettingsCache.main.videoMetaMap;
    }
    if (compiledSettingsCache.kids) {
        compiledSettingsCache.kids.videoMetaMap = videoMetaMapCache || compiledSettingsCache.kids.videoMetaMap;
    }

    scheduleVideoMetaMapFlush();
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
async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {
    const senderUrl = sender?.tab?.url || sender?.url || '';
    const targetProfile = profileType === 'kids' || isKidsUrl(senderUrl) ? 'kids' : 'main';

    // Return cached settings if available
    if (!forceRefresh && compiledSettingsCache[targetProfile]) {
        return compiledSettingsCache[targetProfile];
    }

    return new Promise((resolve) => {
        browserAPI.storage.local.get([
            'enabled',
            'filterKeywords',
            'uiKeywords',
            'filterChannels',
            'contentFilters',
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
            'videoMetaMap',
            'stats',
            'ftProfilesV3',
            FT_PROFILES_V4_KEY
        ], (items) => {
            const compiledSettings = {};
            const storageUpdates = {};

            const shouldUseKidsProfile = targetProfile === 'kids';

            const storedCompiled = items.filterKeywords;
            const storedUiKeywords = Array.isArray(items.uiKeywords) ? items.uiKeywords : null;
            const storedUiChannels = Array.isArray(items.uiChannels) ? items.uiChannels : null;
            const useExact = items.useExactWordMatching || false;

            const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const compileKeywordEntries = (entries, predicate = null) => {
                const list = Array.isArray(entries) ? entries : [];
                const compiled = [];
                const seen = new Set();

                for (const entry of list) {
                    const word = (typeof entry === 'string')
                        ? entry.trim()
                        : (typeof entry?.word === 'string' ? entry.word.trim() : '');
                    if (!word) continue;
                    if (predicate && !predicate(entry)) continue;

                    const exact = (typeof entry === 'object' && entry) ? entry.exact === true : false;
                    const escaped = escapeRegex(word);
                    const pattern = exact ? `\\b${escaped}\\b` : escaped;
                    const key = `${pattern.toLowerCase()}::i`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    compiled.push({ pattern, flags: 'i' });
                }

                return compiled;
            };

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

            // Compile channels - preserve objects with name, id, handle, filterAll
            const storedProfilesV4 = items?.[FT_PROFILES_V4_KEY];
            const hasProfilesV4 = isValidProfilesV4(storedProfilesV4);

            if (!hasProfilesV4) {
                try {
                    storageUpdates[FT_PROFILES_V4_KEY] = buildProfilesV4FromLegacyState(items, storageUpdates);
                } catch (e) {
                }
            }

            const effectiveProfilesV4 = hasProfilesV4 ? storedProfilesV4 : storageUpdates?.[FT_PROFILES_V4_KEY];
            const activeProfileId = typeof effectiveProfilesV4?.activeProfileId === 'string'
                ? effectiveProfilesV4.activeProfileId
                : DEFAULT_PROFILE_ID;
            const activeProfile = safeObject(safeObject(effectiveProfilesV4?.profiles)?.[activeProfileId]);
            const activeMain = safeObject(activeProfile.main);
            const activeKids = safeObject(activeProfile.kids);

            const activeSettings = safeObject(activeProfile.settings);
            const syncKidsToMain = !!activeSettings.syncKidsToMain;

            const mainModeFromV4 = (typeof activeMain.mode === 'string' && activeMain.mode === 'whitelist')
                ? 'whitelist'
                : 'blocklist';
            const kidsModeFromV4 = (typeof activeKids.mode === 'string' && activeKids.mode === 'whitelist')
                ? 'whitelist'
                : 'blocklist';
            compiledSettings.listMode = shouldUseKidsProfile ? kidsModeFromV4 : mainModeFromV4;
            compiledSettings.profileType = targetProfile;

            const rawWhitelistKeywords = shouldUseKidsProfile
                ? (Array.isArray(activeKids.whitelistKeywords) ? activeKids.whitelistKeywords : [])
                : (() => {
                    const mainKeywords = Array.isArray(activeMain.whitelistKeywords) ? activeMain.whitelistKeywords : [];
                    // Only merge Kids keywords when sync enabled AND Main is in whitelist mode
                    if (!syncKidsToMain || mainModeFromV4 !== 'whitelist') return mainKeywords;
                    const kidsBlockedKeywords = Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : [];
                    const kidsWhitelistKeywords = Array.isArray(activeKids.whitelistKeywords) ? activeKids.whitelistKeywords : [];
                    const allKidsKeywords = [...kidsBlockedKeywords, ...kidsWhitelistKeywords];
                    if (!allKidsKeywords.length) return mainKeywords;
                    const seen = new Set(mainKeywords.map(k => (typeof k === 'object' ? k.word : String(k)).toLowerCase()));
                    const merged = [...mainKeywords];
                    allKidsKeywords.forEach(k => {
                        const word = typeof k === 'object' ? k.word : String(k);
                        if (!seen.has(word.toLowerCase())) {
                            seen.add(word.toLowerCase());
                            merged.push(k);
                        }
                    });
                    return merged;
                })();
            compiledSettings.whitelistKeywords = compileKeywordEntries(rawWhitelistKeywords);

            const rawWhitelistChannels = shouldUseKidsProfile
                ? (Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [])
                : (() => {
                    const mainChannels = Array.isArray(activeMain.whitelistChannels) ? activeMain.whitelistChannels : [];
                    // Only merge Kids channels when sync enabled AND Main is in whitelist mode
                    if (!syncKidsToMain || mainModeFromV4 !== 'whitelist') return mainChannels;
                    const kidsBlockedChannels = Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : [];
                    const kidsWhitelistChannels = Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [];
                    const allKidsChannels = [...kidsBlockedChannels, ...kidsWhitelistChannels];
                    if (!allKidsChannels.length) return mainChannels;
                    const keyFor = (ch) => {
                        const id = typeof ch?.id === 'string' ? ch.id.trim().toLowerCase() : '';
                        const handle = typeof ch?.handle === 'string' ? ch.handle.trim().toLowerCase() : '';
                        return id || handle || '';
                    };
                    const seen = new Set(mainChannels.map(keyFor).filter(Boolean));
                    const merged = [...mainChannels];
                    allKidsChannels.forEach(ch => {
                        const key = keyFor(ch);
                        if (!key || seen.has(key)) return;
                        seen.add(key);
                        merged.push({ ...ch, __ftFromKids: true });
                    });
                    return merged;
                })();

            const boolFromV4 = (key, legacyValue) => {
                try {
                    if (Object.prototype.hasOwnProperty.call(activeSettings, key)) {
                        return !!activeSettings[key];
                    }
                } catch (e) {
                }
                return !!legacyValue;
            };

            const enabledFromV4 = (() => {
                try {
                    if (Object.prototype.hasOwnProperty.call(activeSettings, 'enabled')) {
                        return activeSettings.enabled !== false;
                    }
                } catch (e) {
                }
                return items.enabled !== false;
            })();

            const hideCommentsFromV4 = boolFromV4('hideComments', items.hideAllComments || false);
            const filterCommentsFromV4 = hideCommentsFromV4 ? false : boolFromV4('filterComments', items.filterComments || false);

            const v4KeywordEntries = shouldUseKidsProfile
                ? (Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : null)
                : (() => {
                    // V4 schema uses 'blockedKeywords' for blocklist mode, fallback to 'keywords' for migration
                    const mainKeywords = Array.isArray(activeMain.blockedKeywords) 
                        ? activeMain.blockedKeywords 
                        : (Array.isArray(activeMain.keywords) ? activeMain.keywords : null);
                    // Only merge Kids keywords when sync enabled AND Main is in blocklist mode
                    if (!syncKidsToMain || mainModeFromV4 !== 'blocklist') return mainKeywords;
                    // Merge ALL kids keywords (blocked + whitelist) into main blocklist when sync enabled
                    const kidsBlockedKeywords = Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : [];
                    const kidsWhitelistKeywords = Array.isArray(activeKids.whitelistKeywords) ? activeKids.whitelistKeywords : [];
                    const allKidsKeywords = [...kidsBlockedKeywords, ...kidsWhitelistKeywords];
                    if (!mainKeywords && allKidsKeywords.length) return allKidsKeywords;
                    if (!allKidsKeywords.length) return mainKeywords;
                    return [...mainKeywords, ...allKidsKeywords];
                })();

            if (v4KeywordEntries) {
                compiledSettings.filterKeywords = compileKeywordEntries(v4KeywordEntries);
                compiledSettings.filterKeywordsComments = compileKeywordEntries(v4KeywordEntries, entry => {
                    return (typeof entry === 'object' && entry) ? entry.comments !== false : true;
                });
            }

            // Persist any migrations we calculated
            if (Object.keys(storageUpdates).length > 0) {
                browserAPI.storage.local.set(storageUpdates);
            }

            const storedProfilesV3 = items.ftProfilesV3 && typeof items.ftProfilesV3 === 'object' ? items.ftProfilesV3 : null;
            const kidsProfile = storedProfilesV3?.kids && typeof storedProfilesV3.kids === 'object' ? storedProfilesV3.kids : null;

            const kidsChannelsV3 = Array.isArray(kidsProfile?.blockedChannels) ? kidsProfile.blockedChannels : [];
            const kidsKeywordsV3 = Array.isArray(kidsProfile?.blockedKeywords) ? kidsProfile.blockedKeywords : [];

            const kidsChannelsV4 = Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : null;
            const kidsKeywordsV4 = Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : null;

            // For sync, we need ALL kids channels (both blocked and whitelist)
            const kidsBlockedChannelsV4 = Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : [];
            const kidsWhitelistChannelsV4 = Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [];
            const allKidsChannelsV4 = [...kidsBlockedChannelsV4, ...kidsWhitelistChannelsV4];

            const effectiveKidsChannels = (kidsChannelsV4 != null)
                ? kidsChannelsV4
                : kidsChannelsV3;

            // For sync, use all kids channels when merging
            const effectiveKidsChannelsForSync = allKidsChannelsV4.length > 0 ? allKidsChannelsV4 : effectiveKidsChannels;

            const effectiveKidsKeywords = (kidsKeywordsV4 != null)
                ? kidsKeywordsV4
                : kidsKeywordsV3;

            const dedupeChannels = (channels = []) => {
                const out = [];
                const seen = new Set();
                for (const ch of Array.isArray(channels) ? channels : []) {
                    if (!ch) continue;
                    const normalized = (() => {
                        if (typeof ch === 'string') {
                            const trimmed = ch.trim();
                            if (!trimmed) return null;
                            const looksLikeHandle = trimmed.startsWith('@');
                            return {
                                name: trimmed,
                                id: trimmed,
                                handle: looksLikeHandle ? trimmed.toLowerCase() : null,
                                handleDisplay: looksLikeHandle ? trimmed : null,
                                canonicalHandle: looksLikeHandle ? trimmed : null,
                                customUrl: null,
                                logo: null,
                                filterAll: false,
                                originalInput: trimmed
                            };
                        }
                        if (typeof ch === 'object') {
                            return ch;
                        }
                        return null;
                    })();
                    if (!normalized || typeof normalized !== 'object') continue;
                    const id = typeof normalized.id === 'string' ? normalized.id.trim().toLowerCase() : '';
                    const handle = typeof normalized.handle === 'string' ? normalized.handle.trim().toLowerCase() : '';
                    const customUrl = typeof normalized.customUrl === 'string' ? normalized.customUrl.trim().toLowerCase() : '';
                    const name = typeof normalized.name === 'string' ? normalized.name.trim().toLowerCase() : '';
                    const key = id ? `id:${id}` : (handle ? `handle:${handle}` : (customUrl ? `custom:${customUrl}` : (name ? `name:${name}` : '')));
                    if (!key) continue;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(normalized);
                }
                return out;
            };

            const compileWhitelistChannels = (channels = []) => {
                const out = [];
                for (const ch of Array.isArray(channels) ? channels : []) {
                    if (!ch) continue;
                    if (typeof ch === 'string') {
                        const trimmed = ch.trim();
                        if (!trimmed) continue;
                        const looksLikeHandle = trimmed.startsWith('@');
                        const canonicalHandle = looksLikeHandle ? trimmed : null;
                        const normalizedHandle = looksLikeHandle ? trimmed.toLowerCase() : null;
                        out.push({
                            name: trimmed,
                            id: trimmed,
                            handle: normalizedHandle,
                            handleDisplay: looksLikeHandle ? trimmed : null,
                            canonicalHandle: canonicalHandle,
                            logo: null,
                            filterAll: false,
                            originalInput: trimmed,
                            customUrl: null,
                            source: null,
                            addedAt: null,
                            collaborationGroupId: null,
                            collaborationWith: null,
                            allCollaborators: null
                        });
                        continue;
                    }
                    if (ch && typeof ch === 'object') {
                        const candidateCanonical = (ch.canonicalHandle || ch.handle || '').trim();
                        const canonicalHandle = candidateCanonical.startsWith('@') ? candidateCanonical : '';
                        const normalizedHandle = canonicalHandle ? canonicalHandle.toLowerCase() : null;
                        const candidateDisplay = (ch.handleDisplay || '').trim();
                        const displayHandle = candidateDisplay.startsWith('@')
                            ? candidateDisplay
                            : (canonicalHandle || '');
                        const collaborationGroupId = typeof ch.collaborationGroupId === 'string' ? ch.collaborationGroupId : null;
                        const collaborationWith = Array.isArray(ch.collaborationWith) ? ch.collaborationWith : null;
                        const allCollaborators = Array.isArray(ch.allCollaborators) ? ch.allCollaborators : null;
                        const channelObj = {
                            name: ch.name,
                            id: ch.id || ch.originalInput || ch.handle || ch.customUrl || ch.name || '',
                            handle: normalizedHandle,
                            handleDisplay: displayHandle || null,
                            canonicalHandle: canonicalHandle || null,
                            logo: ch.logo || null,
                            filterAll: ch.filterAll || false,
                            filterAllComments: ch.filterAllComments ?? true,
                            originalInput: ch.originalInput || ch.id || ch.handle || ch.name || null,
                            customUrl: ch.customUrl || null,
                            source: typeof ch.source === 'string' ? ch.source : null,
                            addedAt: typeof ch.addedAt === 'number' ? ch.addedAt : null,
                            collaborationGroupId,
                            collaborationWith,
                            allCollaborators
                        };
                        if (!channelObj.id && !channelObj.handle && !channelObj.customUrl && !channelObj.name) continue;
                        out.push(channelObj);
                    }
                }
                return dedupeChannels(out);
            };

            compiledSettings.whitelistChannels = compileWhitelistChannels(rawWhitelistChannels);

            const storedChannels = shouldUseKidsProfile
                ? effectiveKidsChannels
                : (() => {
                    // V4 schema uses 'blockedChannels' for blocklist mode, fallback to 'channels' for migration
                    const mainChannels = Array.isArray(activeMain.blockedChannels) 
                        ? activeMain.blockedChannels 
                        : (Array.isArray(activeMain.channels) ? activeMain.channels : items.filterChannels);
                    // Only merge Kids channels when sync enabled AND Main is in blocklist mode
                    if (!syncKidsToMain) return mainChannels;
                    if (mainModeFromV4 !== 'blocklist') return mainChannels;
                    // Merge ALL kids channels (blocked + whitelist) into main blocklist when sync enabled
                    const kidsChannelsWithTag = effectiveKidsChannelsForSync.map(ch => ({ ...ch, __ftFromKids: true }));
                    const merged = dedupeChannels([...(Array.isArray(mainChannels) ? mainChannels : []), ...kidsChannelsWithTag]);
                    return merged;
                })();
            let compiledChannels = [];
            const additionalKeywordsFromChannels = [];

            if (Array.isArray(storedChannels)) {
                compiledChannels = storedChannels.map(ch => {
                    if (typeof ch === 'string') {
                        const trimmed = ch.trim();
                        const looksLikeHandle = trimmed.startsWith('@');
                        const looksLikeUc = trimmed.toUpperCase().startsWith('UC');
                        const canonicalHandle = looksLikeHandle ? trimmed : null;
                        const normalizedHandle = looksLikeHandle ? trimmed.toLowerCase() : null;
                        // Legacy string format - convert to object format
                        return {
                            name: trimmed,
                            id: trimmed, // Preserve case for UC IDs
                            handle: normalizedHandle,
                            handleDisplay: looksLikeHandle ? trimmed : null,
                            canonicalHandle: canonicalHandle,
                            logo: null,
                            filterAll: false,
                            originalInput: trimmed
                        };
                    } else if (ch && typeof ch === 'object') {
                        // New object format - preserve the original case for IDs and handles
                        // canonicalHandle should only come from actual handle sources, not channel name
                        const candidateCanonical = (ch.canonicalHandle || ch.handle || '').trim();
                        const canonicalHandle = candidateCanonical.startsWith('@') ? candidateCanonical : '';
                        // normalizedHandle must only be set if there's an actual @handle, never from channel name
                        const normalizedHandle = canonicalHandle ? canonicalHandle.toLowerCase() : null;
                        const candidateDisplay = (ch.handleDisplay || '').trim();
                        const displayHandle = candidateDisplay.startsWith('@')
                            ? candidateDisplay
                            : (canonicalHandle || '');
                        const filterAllComments = (typeof ch.filterAllComments === 'boolean') ? ch.filterAllComments : true;
                        const collaborationGroupId = typeof ch.collaborationGroupId === 'string' ? ch.collaborationGroupId : null;
                        const collaborationWith = Array.isArray(ch.collaborationWith) ? ch.collaborationWith : null;
                        const allCollaborators = Array.isArray(ch.allCollaborators) ? ch.allCollaborators : null;
                        const channelObj = {
                            name: ch.name,
                            id: ch.id || '', // Preserve case for UC IDs
                            handle: normalizedHandle,
                            handleDisplay: displayHandle || null,
                            canonicalHandle: canonicalHandle || null,
                            logo: ch.logo || null,
                            filterAll: !!ch.filterAll,
                            filterAllComments,
                            originalInput: ch.originalInput || ch.id || ch.handle || ch.name || null,
                            customUrl: ch.customUrl || null,  // c/Name or user/Name for legacy channels
                            source: typeof ch.source === 'string' ? ch.source : null,
                            addedAt: typeof ch.addedAt === 'number' ? ch.addedAt : null,
                            collaborationGroupId,
                            collaborationWith,
                            allCollaborators
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
                    const id = typeof ch.id === 'string' ? ch.id.trim() : '';
                    const handle = typeof ch.handle === 'string' ? ch.handle.trim() : '';
                    const customUrl = typeof ch.customUrl === 'string' ? ch.customUrl.trim() : '';
                    const originalInput = typeof ch.originalInput === 'string' ? ch.originalInput.trim() : '';

                    if (id && id.toUpperCase().startsWith('UC')) return true;
                    if (id) return true;
                    if (handle.startsWith('@')) return true;
                    if (customUrl.startsWith('c/') || customUrl.startsWith('user/')) return true;
                    if (originalInput.startsWith('watch:')) return true;

                    console.warn('FilterTube Background: Dropping invalid channel entry missing id/handle/customUrl', ch);
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

                    // Persist channel-based keywords to Main's keyword storage
                    // Only if NOT using Kids profile (Main profile only)
                    if (!shouldUseKidsProfile) {
                        const activeProfileId = items.ftActiveProfileId || 'default';
                        
                        // Determine which keyword list to update based on Main's mode
                        // V4 schema uses 'blockedKeywords' for blocklist mode, 'whitelistKeywords' for whitelist mode
                        const isWhitelistMode = mainModeFromV4 === 'whitelist';
                        const keywordKey = isWhitelistMode ? 'whitelistKeywords' : 'blockedKeywords';
                        const currentKeywords = Array.isArray(activeMain[keywordKey]) ? activeMain[keywordKey] : [];
                        
                        // Get existing words to avoid duplicates
                        const existingWords = new Set(
                            currentKeywords.map(k => (typeof k === 'object' ? k.word : String(k)).toLowerCase())
                        );
                        
                        // Convert compiled keyword format back to storage format
                        const keywordsToPersist = uniqueChannelKeywords
                            .map(kw => {
                                const word = kw.pattern.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
                                // Skip if already exists in storage
                                if (existingWords.has(word.toLowerCase())) return null;
                                return {
                                    word: word,
                                    exact: false,
                                    comments: true,
                                    addedAt: Date.now(),
                                    source: 'filterAll_channel'
                                };
                            })
                            .filter(Boolean);
                        
                        if (keywordsToPersist.length > 0 && items.ftProfilesV4?.profiles?.[activeProfileId]) {
                            const updatedKeywords = [...currentKeywords, ...keywordsToPersist];
                            // Update the nested structure properly
                            const updatedProfilesV4 = {
                                ...items.ftProfilesV4,
                                profiles: {
                                    ...items.ftProfilesV4.profiles,
                                    [activeProfileId]: {
                                        ...items.ftProfilesV4.profiles[activeProfileId],
                                        main: {
                                            ...items.ftProfilesV4.profiles[activeProfileId].main,
                                            [keywordKey]: updatedKeywords
                                        }
                                    }
                                }
                            };
                            // Save to storage immediately
                            browserAPI.storage.local.set({ ftProfilesV4: updatedProfilesV4 });
                            console.log(`[FilterTube Sync] Persisted ${keywordsToPersist.length} new channel keywords to Main ${keywordKey}`);
                        }
                    }
                }

                if (uniqueChannelKeywords.length > 0) {
                    console.log(`[FilterTube Sync] Added ${uniqueChannelKeywords.length} channel keywords to compiled settings`);
                }
            }

            // Pass through the channel map (UC ID <-> @handle mappings)
            compiledSettings.channelMap = items.channelMap || {};

            // Pass through the video-channel map (videoId -> channelId for Shorts persistence)
            compiledSettings.videoChannelMap = items.videoChannelMap || {};

            compiledSettings.videoMetaMap = items.videoMetaMap || {};

            // Kids profile keyword compilation (YouTube Kids domain only)
            if (shouldUseKidsProfile) {
                const rawKidsKeywords = effectiveKidsKeywords;
                const compiledKidsKeywords = rawKidsKeywords.map(entry => {
                    try {
                        const word = typeof entry?.word === 'string' ? entry.word.trim() : '';
                        if (!word) return null;
                        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const exact = entry?.exact === true;
                        return {
                            pattern: exact ? `\\b${escaped}\\b` : escaped,
                            flags: 'i'
                        };
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);

                const compiledKidsKeywordsComments = rawKidsKeywords.map(entry => {
                    try {
                        if (entry && typeof entry === 'object' && entry.comments === false) return null;
                        const word = typeof entry?.word === 'string' ? entry.word.trim() : '';
                        if (!word) return null;
                        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
                const mergeWithChannels = (baseList = []) => {
                    const merged = [];
                    const seen = new Set();
                    const pushUnique = (entry) => {
                        if (!entry?.pattern) return;
                        const key = `${String(entry.pattern).toLowerCase()}::${String(entry.flags || '').toLowerCase()}`;
                        if (seen.has(key)) return;
                        seen.add(key);
                        merged.push(entry);
                    };
                    baseList.forEach(pushUnique);
                    (additionalKeywordsFromChannels || []).forEach(pushUnique);
                    return merged;
                };

                compiledSettings.filterKeywords = mergeWithChannels(compiledKidsKeywords);
                compiledSettings.filterKeywordsComments = mergeWithChannels(compiledKidsKeywordsComments);
            }

            // Pass through boolean flags
            compiledSettings.enabled = enabledFromV4;
            compiledSettings.hideAllComments = hideCommentsFromV4;
            compiledSettings.filterComments = filterCommentsFromV4;
            compiledSettings.useExactWordMatching = useExact;
            compiledSettings.hideAllShorts = boolFromV4('hideShorts', items.hideAllShorts || false);
            compiledSettings.hideHomeFeed = boolFromV4('hideHomeFeed', items.hideHomeFeed || false);
            compiledSettings.hideSponsoredCards = boolFromV4('hideSponsoredCards', items.hideSponsoredCards || false);
            compiledSettings.hideWatchPlaylistPanel = boolFromV4('hideWatchPlaylistPanel', items.hideWatchPlaylistPanel || false);
            compiledSettings.hidePlaylistCards = boolFromV4('hidePlaylistCards', items.hidePlaylistCards || false);
            compiledSettings.hideMembersOnly = boolFromV4('hideMembersOnly', items.hideMembersOnly || false);
            compiledSettings.hideMixPlaylists = boolFromV4('hideMixPlaylists', items.hideMixPlaylists || false);
            compiledSettings.hideVideoSidebar = boolFromV4('hideVideoSidebar', items.hideVideoSidebar || false);
            compiledSettings.hideRecommended = boolFromV4('hideRecommended', items.hideRecommended || false);
            compiledSettings.hideLiveChat = boolFromV4('hideLiveChat', items.hideLiveChat || false);
            compiledSettings.hideVideoInfo = boolFromV4('hideVideoInfo', items.hideVideoInfo || false);
            compiledSettings.hideVideoButtonsBar = boolFromV4('hideVideoButtonsBar', items.hideVideoButtonsBar || false);
            compiledSettings.hideAskButton = boolFromV4('hideAskButton', items.hideAskButton || false);
            compiledSettings.hideVideoChannelRow = boolFromV4('hideVideoChannelRow', items.hideVideoChannelRow || false);
            compiledSettings.hideVideoDescription = boolFromV4('hideVideoDescription', items.hideVideoDescription || false);
            compiledSettings.hideMerchTicketsOffers = boolFromV4('hideMerchTicketsOffers', items.hideMerchTicketsOffers || false);
            compiledSettings.hideEndscreenVideowall = boolFromV4('hideEndscreenVideowall', items.hideEndscreenVideowall || false);
            compiledSettings.hideEndscreenCards = boolFromV4('hideEndscreenCards', items.hideEndscreenCards || false);
            compiledSettings.disableAutoplay = boolFromV4('disableAutoplay', items.disableAutoplay || false);
            compiledSettings.disableAnnotations = boolFromV4('disableAnnotations', items.disableAnnotations || false);
            compiledSettings.hideTopHeader = boolFromV4('hideTopHeader', items.hideTopHeader || false);
            compiledSettings.hideNotificationBell = boolFromV4('hideNotificationBell', items.hideNotificationBell || false);
            compiledSettings.hideExploreTrending = boolFromV4('hideExploreTrending', items.hideExploreTrending || false);
            compiledSettings.hideMoreFromYouTube = boolFromV4('hideMoreFromYouTube', items.hideMoreFromYouTube || false);
            compiledSettings.hideSubscriptions = boolFromV4('hideSubscriptions', items.hideSubscriptions || false);
            compiledSettings.showQuickBlockButton = boolFromV4('showQuickBlockButton', items.showQuickBlockButton !== false);
            compiledSettings.hideSearchShelves = boolFromV4('hideSearchShelves', items.hideSearchShelves || false);

            const profileSettings = activeProfile?.settings || {};
            const profileContentFilters = (() => {
                try {
                    if (shouldUseKidsProfile) {
                        const kidsFilters = activeKids && typeof activeKids === 'object' ? activeKids.contentFilters : null;
                        if (kidsFilters && typeof kidsFilters === 'object' && !Array.isArray(kidsFilters)) return kidsFilters;
                        return null;
                    }
                    const mainFilters = profileSettings && typeof profileSettings === 'object' ? profileSettings.contentFilters : null;
                    if (mainFilters && typeof mainFilters === 'object' && !Array.isArray(mainFilters)) return mainFilters;
                } catch (e) {
                }
                return null;
            })();
            const legacyContentFilters = (!shouldUseKidsProfile && items.contentFilters && typeof items.contentFilters === 'object' && !Array.isArray(items.contentFilters))
                ? items.contentFilters
                : null;
            compiledSettings.contentFilters = profileContentFilters || legacyContentFilters || {
                duration: { enabled: false, minMinutes: 0, maxMinutes: 0, condition: 'between' },
                uploadDate: { enabled: false, fromDate: '', toDate: '', condition: 'newer' },
                uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
            };

            const profileCategoryFilters = (() => {
                try {
                    if (shouldUseKidsProfile) {
                        const kidsFilters = activeKids && typeof activeKids === 'object' ? activeKids.categoryFilters : null;
                        if (kidsFilters && typeof kidsFilters === 'object' && !Array.isArray(kidsFilters)) return kidsFilters;
                        return null;
                    }
                    const mainFilters = profileSettings && typeof profileSettings === 'object' ? profileSettings.categoryFilters : null;
                    if (mainFilters && typeof mainFilters === 'object' && !Array.isArray(mainFilters)) return mainFilters;
                } catch (e) {
                }
                return null;
            })();
            const legacyCategoryFilters = (!shouldUseKidsProfile && items.categoryFilters && typeof items.categoryFilters === 'object' && !Array.isArray(items.categoryFilters))
                ? items.categoryFilters
                : null;
            compiledSettings.categoryFilters = profileCategoryFilters || legacyCategoryFilters || {
                enabled: false,
                mode: 'block',
                selected: []
            };

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
            showQuickBlockButton: true,
            firstRunRefreshNeeded: true,
            releaseNotesSeenVersion: CURRENT_VERSION,
            releaseNotesPayload: null
        });
        applyQuickBlockDefaultMigrationOnce({ isInstall: true }).catch(() => {
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
        applyQuickBlockDefaultMigrationOnce({ previousVersion: details.previousVersion || '' }).catch(() => {
        });
        buildReleaseNotesPayload(CURRENT_VERSION).then((payload) => {
            browserAPI.storage.local.set({
                releaseNotesPayload: payload,
                firstRunRefreshNeeded: true
            });
        }).catch(error => {
            console.warn('FilterTube Background: unable to prepare release notes payload', error);
        });

        // Show refresh prompt in already-open YouTube tabs after update.
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
            console.warn('FilterTube: failed to inject first-run prompt on update', e);
        }
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

    if (action === 'FilterTube_ReleaseNotesCheck') {
        storageGet(['releaseNotesSeenVersion', 'releaseNotesPayload']).then(async (data) => {
            const seenVersion = typeof data?.releaseNotesSeenVersion === 'string'
                ? data.releaseNotesSeenVersion
                : '';
            const cachedPayload = data?.releaseNotesPayload && typeof data.releaseNotesPayload === 'object'
                ? data.releaseNotesPayload
                : null;

            if (cachedPayload?.version && cachedPayload.version !== seenVersion) {
                sendResponse({ needed: true, payload: cachedPayload });
                return;
            }

            if (seenVersion && seenVersion === CURRENT_VERSION) {
                sendResponse({ needed: false });
                return;
            }

            try {
                const payload = await buildReleaseNotesPayload(CURRENT_VERSION);
                await browserAPI.storage.local.set({ releaseNotesPayload: payload });
                sendResponse({ needed: true, payload });
            } catch (e) {
                console.warn('FilterTube Background: release notes check failed', e);
                sendResponse({ needed: false });
            }
        });
        return true;
    } else if (action === 'FilterTube_ReleaseNotesAck') {
        const version = typeof request?.version === 'string' ? request.version.trim() : '';
        browserAPI.storage.local.set({
            releaseNotesSeenVersion: version || CURRENT_VERSION,
            releaseNotesPayload: null
        }).then(() => sendResponse?.({ ok: true })).catch((e) => {
            console.warn('FilterTube Background: release notes ack failed', e);
            sendResponse?.({ ok: false });
        });
        return true;
    } else if (action === 'FilterTube_FirstRunCheck') {
        storageGet(['firstRunRefreshNeeded']).then((data) => {
            sendResponse?.({ needed: data?.firstRunRefreshNeeded !== false });
        }).catch(() => sendResponse?.({ needed: false }));
        return true;
    } else if (action === 'FilterTube_FirstRunComplete') {
        browserAPI.storage.local.set({ firstRunRefreshNeeded: false })
            .then(() => sendResponse?.({ ok: true }))
            .catch((e) => {
                console.warn('FilterTube Background: first-run completion failed', e);
                sendResponse?.({ ok: false });
            });
        return true;
    } else if (action === 'FilterTube_OpenWhatsNew') {
        // Open the What's New page in a new tab
        const url = request?.url || WHATS_NEW_PAGE_URL;
        browserAPI.tabs.create({ url: url, active: true }, (tab) => {
            if (browserAPI.runtime.lastError) {
                console.warn('FilterTube Background: failed to open What\'s New tab', browserAPI.runtime.lastError);
                sendResponse?.({ ok: false, error: browserAPI.runtime.lastError.message });
            } else {
                sendResponse?.({ ok: true, tabId: tab.id });
            }
        });
        return true;
    } else if (action === "getCompiledSettings") {
        const senderUrl = sender?.tab?.url || sender?.url || '';
        const requestedProfile = request.profileType;
        const profileType = requestedProfile === 'kids' ? 'kids' : (requestedProfile === 'main' ? 'main' : (isKidsUrl(senderUrl) ? 'kids' : 'main'));

        if (compiledSettingsCache[profileType] && !request.forceRefresh) {
            sendResponse(compiledSettingsCache[profileType]);
            return;
        }

        console.log(`FilterTube Background: Received getCompiledSettings message for profile: ${profileType} (force: ${!!request.forceRefresh})`);
        getCompiledSettings(sender, profileType, !!request.forceRefresh).then(compiledSettings => {
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
    } else if (action === 'FilterTube_SessionPinAuth') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ ok: false, error: 'untrusted_sender' });
            return false;
        }
        const profileId = normalizeString(request?.profileId) || DEFAULT_PROFILE_ID;
        const pin = normalizeString(request?.pin);
        verifyAndCacheSessionPin(profileId, pin).then((result) => {
            sendResponse?.(result);
        }).catch((e) => {
            sendResponse?.({ ok: false, error: e?.message || 'failed' });
        });
        return true;
    } else if (action === 'FilterTube_ClearSessionPin') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ ok: false, error: 'untrusted_sender' });
            return false;
        }
        const profileId = normalizeString(request?.profileId);
        if (profileId) {
            sessionPinCache.delete(profileId);
        }
        sendResponse?.({ ok: true });
        return false;
    } else if (action === 'FilterTube_SetListMode') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ ok: false, error: 'untrusted_sender' });
            return false;
        }

        const requestedMode = (typeof request?.mode === 'string' && request.mode === 'whitelist')
            ? 'whitelist'
            : 'blocklist';
        const requestedProfile = (typeof request?.profileType === 'string' && request.profileType === 'kids')
            ? 'kids'
            : 'main';
        const shouldCopyBlocklist = request?.copyBlocklist === true;

        (async () => {
            const storage = await storageGet([
                FT_PROFILES_V4_KEY,
                'filterChannels',
                'uiKeywords',
                'filterKeywords',
                'ftProfilesV3'
            ]);

            let profilesV4 = storage?.[FT_PROFILES_V4_KEY];
            if (!isValidProfilesV4(profilesV4)) {
                try {
                    profilesV4 = buildProfilesV4FromLegacyState(storage, {});
                } catch (e) {
                    profilesV4 = null;
                }
            }
            if (!profilesV4 || !isValidProfilesV4(profilesV4)) {
                sendResponse?.({ ok: false, error: 'profiles_unavailable' });
                return;
            }

            const activeId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID;
            const profiles = safeObject(profilesV4.profiles);
            const activeProfile = safeObject(profiles[activeId]);
            const activeMain = safeObject(activeProfile.main);
            const activeKids = safeObject(activeProfile.kids);

            const nextMain = { ...activeMain };
            const nextKids = { ...activeKids };

            if (requestedProfile === 'kids') {
                nextKids.mode = requestedMode;
            } else {
                nextMain.mode = requestedMode;
            }

            const sanitizeKeywordList = (raw) => {
                return (Array.isArray(raw) ? raw : [])
                    .map(entry => {
                        if (!entry) return null;
                        if (typeof entry === 'string') {
                            const word = entry.trim();
                            if (!word) return null;
                            return { word, exact: false, comments: true, source: 'user', channelRef: null, addedAt: Date.now() };
                        }
                        if (typeof entry === 'object') {
                            const word = typeof entry.word === 'string' ? entry.word.trim() : '';
                            if (!word) return null;
                            return {
                                ...entry,
                                word,
                                exact: entry.exact === true,
                                comments: entry.comments !== false,
                                source: entry.source === 'channel' ? 'channel' : 'user',
                                channelRef: entry.source === 'channel' ? (entry.channelRef || null) : null,
                                addedAt: (typeof entry.addedAt === 'number' && Number.isFinite(entry.addedAt)) ? entry.addedAt : Date.now()
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);
            };

            const dedupeKeywordList = (list) => {
                const out = [];
                const seen = new Set();
                for (const entry of Array.isArray(list) ? list : []) {
                    const word = typeof entry?.word === 'string' ? entry.word.trim() : '';
                    if (!word) continue;
                    const exact = entry.exact === true;
                    const key = `${word.toLowerCase()}::${exact ? '1' : '0'}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(entry);
                }
                return out;
            };

            const dedupeChannels = (channels = []) => {
                const out = [];
                const seen = new Set();
                for (const ch of Array.isArray(channels) ? channels : []) {
                    if (!ch || typeof ch !== 'object') continue;
                    const id = typeof ch.id === 'string' ? ch.id.trim().toLowerCase() : '';
                    const handle = typeof ch.handle === 'string' ? ch.handle.trim().toLowerCase() : '';
                    const customUrl = typeof ch.customUrl === 'string' ? ch.customUrl.trim().toLowerCase() : '';
                    const name = typeof ch.name === 'string' ? ch.name.trim().toLowerCase() : '';
                    const key = id ? `id:${id}` : (handle ? `handle:${handle}` : (customUrl ? `custom:${customUrl}` : (name ? `name:${name}` : '')));
                    if (!key) continue;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(ch);
                }
                return out;
            };

            const mergeAndClearBlocklistIntoWhitelist = (scope) => {
                if (scope === 'kids') {
                    const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];
                    const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];
                    const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];
                    const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];

                    nextKids.whitelistChannels = dedupeChannels([...whitelistChannels, ...blockedChannels]);
                    nextKids.whitelistKeywords = dedupeKeywordList([
                        ...sanitizeKeywordList(whitelistKeywords),
                        ...sanitizeKeywordList(blockedKeywords)
                    ]);

                    nextKids.blockedChannels = [];
                    nextKids.blockedKeywords = [];
                    return;
                }

                const blockedChannels = Array.isArray(nextMain.channels)
                    ? nextMain.channels
                    : (Array.isArray(storage.filterChannels) ? storage.filterChannels : []);
                const blockedKeywords = Array.isArray(nextMain.keywords)
                    ? nextMain.keywords
                    : (Array.isArray(storage.uiKeywords) ? storage.uiKeywords : []);
                const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];
                const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];

                nextMain.whitelistChannels = dedupeChannels([...whitelistChannels, ...blockedChannels]);
                nextMain.whitelistKeywords = dedupeKeywordList([
                    ...sanitizeKeywordList(whitelistKeywords),
                    ...sanitizeKeywordList(blockedKeywords)
                ]);

                nextMain.channels = [];
                nextMain.keywords = [];
            };

            if (requestedMode === 'whitelist') {
                mergeAndClearBlocklistIntoWhitelist(requestedProfile);
            }

            profiles[activeId] = {
                ...activeProfile,
                name: typeof activeProfile.name === 'string' ? activeProfile.name : 'Default',
                settings: safeObject(activeProfile.settings),
                main: nextMain,
                kids: nextKids
            };

            const nextProfilesV4 = {
                ...profilesV4,
                schemaVersion: 4,
                activeProfileId: activeId,
                profiles
            };

            const writePayload = { [FT_PROFILES_V4_KEY]: nextProfilesV4 };

            if (requestedMode === 'whitelist' && requestedProfile === 'main') {
                writePayload.filterChannels = [];
                writePayload.uiChannels = [];
                writePayload.uiKeywords = [];
                writePayload.filterKeywords = [];
                writePayload.filterKeywordsComments = [];
            }

            await browserAPI.storage.local.set(writePayload);

            compiledSettingsCache.main = null;
            compiledSettingsCache.kids = null;

            try {
                scheduleAutoBackupInBackground('mode_changed');
            } catch (e) {
            }

            try {
                const urlPattern = requestedProfile === 'kids' ? ['*://*.youtubekids.com/*'] : ['*://*.youtube.com/*'];
                browserAPI.tabs.query({ url: urlPattern }, tabs => {
                    (tabs || []).forEach(tab => {
                        if (tab?.id) browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_RefreshNow' }, () => { });
                    });
                });
            } catch (e) {
            }

            sendResponse?.({ ok: true, profileType: requestedProfile, mode: requestedMode });
        })().catch((e) => {
            sendResponse?.({ ok: false, error: e?.message || 'failed' });
        });

        return true;
    } else if (action === 'addWhitelistChannelPersistent') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ success: false, error: 'untrusted_sender' });
            return false;
        }

        const input = typeof request?.input === 'string' ? request.input.trim() : '';
        if (!input) {
            sendResponse?.({ success: false, error: 'Empty input' });
            return false;
        }

        handleAddFilteredChannel(
            input,
            false,
            null,
            null,
            { source: 'user' },
            'main',
            '',
            'whitelist'
        ).then(result => {
            try {
                if (result && result.success) {
                    scheduleAutoBackupInBackground('whitelist_channel_added');
                }
            } catch (e) {
            }

            if (result?.success) {
                sendResponse?.({ success: true, channel: result.channelData || null, updated: !!result.updated });
            } else {
                sendResponse?.({ success: false, error: result?.error || 'Failed to add whitelist channel' });
            }
        }).catch((error) => {
            sendResponse?.({ success: false, error: error?.message || 'Failed to add whitelist channel' });
        });

        return true;
    } else if (action === 'FilterTube_KidsWhitelistChannel') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ success: false, error: 'untrusted_sender' });
            return false;
        }

        const channel = request?.channel && typeof request.channel === 'object' ? request.channel : {};
        const rawVideoId = typeof request?.videoId === 'string' ? request.videoId.trim() : '';
        const originalInput = typeof channel?.originalInput === 'string' ? channel.originalInput.trim() : '';

        const input = originalInput
            || (rawVideoId ? `watch:${rawVideoId}` : '')
            || (typeof channel?.id === 'string' ? channel.id.trim() : '')
            || (typeof channel?.name === 'string' ? channel.name.trim() : '');

        if (!input) {
            sendResponse?.({ success: false, error: 'Empty input' });
            return false;
        }

        handleAddFilteredChannel(
            input,
            false,
            null,
            null,
            {
                displayHandle: channel?.handleDisplay || null,
                canonicalHandle: channel?.canonicalHandle || null,
                channelName: channel?.name || null,
                customUrl: channel?.customUrl || null,
                source: channel?.source || 'user'
            },
            'kids',
            rawVideoId,
            'whitelist'
        ).then(result => {
            try {
                if (result && result.success) {
                    scheduleAutoBackupInBackground('kids_whitelist_channel_added');
                }
            } catch (e) {
            }

            if (result?.success) {
                sendResponse?.({ success: true, channel: result.channelData || null, updated: !!result.updated });
            } else {
                sendResponse?.({ success: false, error: result?.error || 'Failed to add Kids whitelist channel' });
            }
        }).catch(error => {
            sendResponse?.({ success: false, error: error?.message || 'Failed to add Kids whitelist channel' });
        });

        return true;
    } else if (action === 'FilterTube_TransferWhitelistToBlocklist') {
        if (!isTrustedUiSender(sender)) {
            sendResponse?.({ ok: false, error: 'untrusted_sender' });
            return false;
        }

        const requestedProfile = (typeof request?.profileType === 'string' && request.profileType === 'kids')
            ? 'kids'
            : 'main';

        (async () => {
            const storage = await storageGet([
                FT_PROFILES_V4_KEY,
                'filterChannels',
                'uiKeywords',
                'filterKeywords',
                'filterKeywordsComments',
                'ftProfilesV3'
            ]);

            let profilesV4 = storage?.[FT_PROFILES_V4_KEY];
            if (!isValidProfilesV4(profilesV4)) {
                try {
                    profilesV4 = buildProfilesV4FromLegacyState(storage, {});
                } catch (e) {
                    profilesV4 = null;
                }
            }
            if (!profilesV4 || !isValidProfilesV4(profilesV4)) {
                sendResponse?.({ ok: false, error: 'profiles_unavailable' });
                return;
            }

            const activeId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID;
            const profiles = safeObject(profilesV4.profiles);
            const activeProfile = safeObject(profiles[activeId]);
            const activeMain = safeObject(activeProfile.main);
            const activeKids = safeObject(activeProfile.kids);

            const nextMain = { ...activeMain };
            const nextKids = { ...activeKids };

            const sanitizeKeywordList = (raw) => {
                return (Array.isArray(raw) ? raw : [])
                    .map(entry => {
                        if (!entry) return null;
                        if (typeof entry === 'string') {
                            const word = entry.trim();
                            if (!word) return null;
                            return { word, exact: false, comments: true, source: 'user', channelRef: null, addedAt: Date.now() };
                        }
                        if (typeof entry === 'object') {
                            const word = typeof entry.word === 'string' ? entry.word.trim() : '';
                            if (!word) return null;
                            return {
                                ...entry,
                                word,
                                exact: entry.exact === true,
                                comments: entry.comments !== false,
                                source: entry.source === 'channel' ? 'channel' : 'user',
                                channelRef: entry.source === 'channel' ? (entry.channelRef || null) : null,
                                addedAt: (typeof entry.addedAt === 'number' && Number.isFinite(entry.addedAt)) ? entry.addedAt : Date.now()
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);
            };

            const dedupeKeywordList = (list) => {
                const out = [];
                const seen = new Set();
                for (const entry of Array.isArray(list) ? list : []) {
                    const word = typeof entry?.word === 'string' ? entry.word.trim() : '';
                    if (!word) continue;
                    const exact = entry.exact === true;
                    const key = `${word.toLowerCase()}::${exact ? '1' : '0'}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(entry);
                }
                return out;
            };

            const dedupeChannels = (channels = []) => {
                const out = [];
                const seen = new Set();
                for (const ch of Array.isArray(channels) ? channels : []) {
                    if (!ch || typeof ch !== 'object') continue;
                    const id = typeof ch.id === 'string' ? ch.id.trim().toLowerCase() : '';
                    const handle = typeof ch.handle === 'string' ? ch.handle.trim().toLowerCase() : '';
                    const customUrl = typeof ch.customUrl === 'string' ? ch.customUrl.trim().toLowerCase() : '';
                    const name = typeof ch.name === 'string' ? ch.name.trim().toLowerCase() : '';
                    const key = id ? `id:${id}` : (handle ? `handle:${handle}` : (customUrl ? `custom:${customUrl}` : (name ? `name:${name}` : '')));
                    if (!key) continue;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(ch);
                }
                return out;
            };

            if (requestedProfile === 'kids') {
                const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];
                const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];
                const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];
                const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];

                nextKids.blockedChannels = dedupeChannels([...blockedChannels, ...whitelistChannels]);
                nextKids.blockedKeywords = dedupeKeywordList([
                    ...sanitizeKeywordList(blockedKeywords),
                    ...sanitizeKeywordList(whitelistKeywords)
                ]);
                nextKids.whitelistChannels = [];
                nextKids.whitelistKeywords = [];
                nextKids.mode = 'blocklist';
            } else {
                const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];
                const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];
                const blockedChannels = Array.isArray(nextMain.channels) ? nextMain.channels : [];
                const blockedKeywords = Array.isArray(nextMain.keywords) ? nextMain.keywords : [];

                nextMain.channels = dedupeChannels([...blockedChannels, ...whitelistChannels]);
                nextMain.keywords = dedupeKeywordList([
                    ...sanitizeKeywordList(blockedKeywords),
                    ...sanitizeKeywordList(whitelistKeywords)
                ]);
                nextMain.whitelistChannels = [];
                nextMain.whitelistKeywords = [];
                nextMain.mode = 'blocklist';
            }

            profiles[activeId] = {
                ...activeProfile,
                name: typeof activeProfile.name === 'string' ? activeProfile.name : 'Default',
                settings: safeObject(activeProfile.settings),
                main: nextMain,
                kids: nextKids
            };

            const nextProfilesV4 = {
                ...profilesV4,
                schemaVersion: 4,
                activeProfileId: activeId,
                profiles
            };

            const writePayload = { [FT_PROFILES_V4_KEY]: nextProfilesV4 };

            if (requestedProfile === 'main') {
                writePayload.filterChannels = Array.isArray(nextMain.channels) ? nextMain.channels : [];
                writePayload.uiKeywords = Array.isArray(nextMain.keywords) ? nextMain.keywords : [];
                try {
                    writePayload.uiChannels = safeArray(writePayload.filterChannels)
                        .map(ch => (typeof ch?.name === 'string' ? ch.name : ''))
                        .filter(Boolean);
                } catch (e) {
                }
            }

            await browserAPI.storage.local.set(writePayload);

            compiledSettingsCache.main = null;
            compiledSettingsCache.kids = null;

            try {
                const urlPattern = requestedProfile === 'kids' ? ['*://*.youtubekids.com/*'] : ['*://*.youtube.com/*'];
                browserAPI.tabs.query({ url: urlPattern }, tabs => {
                    (tabs || []).forEach(tab => {
                        if (tab?.id) browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_RefreshNow' }, () => { });
                    });
                });
            } catch (e) {
            }

            try {
                scheduleAutoBackupInBackground('whitelist_to_blocklist_transfer');
            } catch (e) {
            }

            sendResponse?.({ ok: true, profileType: requestedProfile });
        })().catch((e) => {
            sendResponse?.({ ok: false, error: e?.message || 'failed' });
        });

        return true;
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
    } else if (action === 'FilterTube_KidsBlockChannel') {
        const rawVideoId = typeof request?.videoId === 'string' ? request.videoId.trim() : '';
        const channel = request?.channel && typeof request.channel === 'object' ? request.channel : {};
        const originalInput = typeof channel?.originalInput === 'string' ? channel.originalInput.trim() : '';

        const input = originalInput
            || (rawVideoId ? `watch:${rawVideoId}` : '')
            || (typeof channel?.id === 'string' ? channel.id.trim() : '')
            || (typeof channel?.name === 'string' ? channel.name.trim() : '');

        handleAddFilteredChannel(
            input,
            false,
            null,
            null,
            {
                displayHandle: channel?.handleDisplay || null,
                canonicalHandle: channel?.canonicalHandle || null,
                channelName: channel?.name || null,
                customUrl: channel?.customUrl || null,
                source: channel?.source || 'kidsNative'
            },
            'kids',
            rawVideoId
        ).then(result => {
            try {
                if (result && result.success) {
                    scheduleAutoBackupInBackground('kids_channel_added');
                }
            } catch (e) {
            }

            if (result?.success) {
                sendResponse({ success: true, channel: result.channelData || null, updated: !!result.updated });
            } else {
                sendResponse({ success: false, error: result?.error || 'Failed to block Kids channel' });
            }
        }).catch(error => {
            sendResponse({ success: false, error: error?.message || 'Failed to block Kids channel' });
        });

        return true;
    } else if (request.action === "injectScripts") {
        // Handle script injection via Chrome scripting API
        console.log("FilterTube Background: Received injectScripts request for:", request.scripts);
        sendResponse({ acknowledged: true });
        return;
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
                const data = await new Promise(resolve => browserAPI.storage.local.get([
                    'filterChannels',
                    'uiKeywords',
                    'filterKeywords',
                    'ftProfilesV3',
                    FT_PROFILES_V4_KEY
                ], resolve));
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
                const existingById = channels.find(ch =>
                    ch && (ch.id === normalizedResolvedId || ch.handle === normalizedResolvedId)
                );

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

                let nextProfilesV4 = null;
                try {
                    const existingV4 = data?.[FT_PROFILES_V4_KEY];
                    const profilesV4 = isValidProfilesV4(existingV4)
                        ? existingV4
                        : buildProfilesV4FromLegacyState(data, {});

                    const activeId = typeof profilesV4?.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID;
                    const profiles = safeObject(profilesV4?.profiles);
                    const activeProfile = safeObject(profiles?.[activeId]);
                    const main = safeObject(activeProfile.main);

                    profiles[activeId] = {
                        ...activeProfile,
                        name: typeof activeProfile.name === 'string' ? activeProfile.name : 'Default',
                        settings: safeObject(activeProfile.settings),
                        main: {
                            ...main,
                            channels: channels
                        },
                        kids: {
                            ...safeObject(activeProfile.kids)
                        }
                    };

                    nextProfilesV4 = {
                        ...profilesV4,
                        schemaVersion: 4,
                        profiles
                    };
                } catch (e) {
                }

                const writePayload = { filterChannels: channels };
                if (nextProfilesV4) {
                    writePayload[FT_PROFILES_V4_KEY] = nextProfilesV4;
                }
                await new Promise(resolve => browserAPI.storage.local.set(writePayload, resolve));

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
    } else if (request.action === "FilterTube_ApplySettings" && request.settings) {
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
        enqueueChannelMapMappings(request.mappings);
        return false; // No response needed
    } else if (request.action === "updateVideoChannelMap") {
        // Store videoId → channelId mappings for Shorts persistence after refresh
        if (request.videoId && request.channelId) {
            enqueueVideoChannelMapUpdate(request.videoId, request.channelId);
            console.log("FilterTube Background: Video-channel mapping stored:", request.videoId, "->", request.channelId);
        }
        return false;
    } else if (request.action === "updateVideoMetaMap") {
        const entries = Array.isArray(request.entries)
            ? request.entries
            : (request.videoId ? [{
                videoId: request.videoId,
                lengthSeconds: request.lengthSeconds,
                publishDate: request.publishDate,
                uploadDate: request.uploadDate
            }] : []);

        for (const entry of entries) {
            const videoId = entry?.videoId;
            if (!videoId) continue;
            enqueueVideoMetaMapUpdate(videoId, entry);
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
            'contentFilters',
            'hideMembersOnly',
            'hideAllShorts',
            'hideComments',
            'filterComments',
            'hideHomeFeed',
            'hideSponsoredCards',
            'ftProfilesV3',
            FT_PROFILES_V4_KEY
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

        let channelName = null;
        let channelHandle = null;
        let channelLogo = null;

        const normalizeHandleOutput = (value) => {
            if (!value || typeof value !== 'string') return null;
            let v = value.trim();
            if (!v) return null;
            if (v.startsWith('/@')) v = v.slice(1);
            if (!v.startsWith('@')) return null;
            v = v.split(/[/?#]/)[0].trim();
            return v || null;
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
        let response = await fetch(channelUrl, {
            credentials: 'include',
            headers: { 'Accept': 'text/html' }
        });

        // If /@handle/about 404s, fall back to /@handle
        if (!response.ok && isHandle) {
            try {
                const handleWithoutAt = cleanId
                    .replace(/^@+/, '')
                    .split(/[/?#]/)[0]
                    .trim();
                const encodedHandle = encodeURIComponent(handleWithoutAt);
                const fallbackUrl = `https://www.youtube.com/@${encodedHandle}`;
                response = await fetch(fallbackUrl, {
                    credentials: 'include',
                    headers: { 'Accept': 'text/html' }
                });
            } catch (fallbackError) {
                // Ignore, keep original response for error handling below
            }
        }

        if (!response.ok) {
            console.error('FilterTube Background: Failed to fetch channel page:', response.status, response.statusText);
            return { success: false, error: `Failed to fetch channel page: ${response.status}` };
        }

        const html = await response.text();

        const topicChannel = /id=["']links-section["'][\s\S]*?Auto-generated by YouTube/i.test(html)
            || /ytChannelExternalLinkViewModelTitle[\s\S]*?>\s*Auto-generated by YouTube\s*</i.test(html);

        const decodeHtmlEntities = (value) => {
            if (!value || typeof value !== 'string') return value;
            return value
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
        };

        const extractMeta = (key) => {
            if (!key) return null;
            const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const patterns = [
                new RegExp(`<meta[^>]+property=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
                new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapedKey}["'][^>]*>`, 'i'),
                new RegExp(`<meta[^>]+name=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
                new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapedKey}["'][^>]*>`, 'i')
            ];
            for (const re of patterns) {
                const match = html.match(re);
                if (match && match[1]) return decodeHtmlEntities(match[1].trim());
            }
            return null;
        };

        const extractCanonicalHref = () => {
            const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
                || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
            return match && match[1] ? decodeHtmlEntities(match[1].trim()) : null;
        };

        const ogTitle = extractMeta('og:title') || extractMeta('twitter:title');
        const ogImage = extractMeta('og:image') || extractMeta('twitter:image');
        const ogUrl = extractMeta('og:url') || extractCanonicalHref();
        if (ogUrl) {
            assignCustomUrl(ogUrl);
            const handleMatch = ogUrl.match(/\/(@[^/?#]+)/);
            if (!channelHandle && handleMatch && handleMatch[1]) {
                channelHandle = normalizeHandleOutput(handleMatch[1]) || channelHandle;
            }
            const ucMatch = ogUrl.match(/\/channel\/(UC[\w-]{22})/i);
            if (!resolvedChannelId && ucMatch && ucMatch[1]) {
                resolvedChannelId = ucMatch[1];
            }
        }

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
            if (!resolvedChannelId && cleanId.toUpperCase().startsWith('UC') && cleanId.length === 24) {
                resolvedChannelId = cleanId;
            }

            if (!resolvedChannelId) {
                const match = html.match(/\/channel\/(UC[\w-]{22})/);
                if (match && match[1]) {
                    resolvedChannelId = match[1];
                }
            }

            if (!resolvedChannelId) {
                console.error('FilterTube Background: Could not extract ytInitialData from page');
                return { success: false, error: 'Could not extract channel data' };
            }

            channelName = ogTitle || channelName;
            channelLogo = ogImage || channelLogo;
            channelHandle = normalizeHandleOutput(channelHandle) || null;

            return {
                success: true,
                name: channelName || resolvedChannelId, // Fallback to ID if name fails
                id: resolvedChannelId,
                handle: channelHandle,
                logo: channelLogo,
                customUrl: customUrl, // c/Name or user/Name if that was the input
                topicChannel
            };
        }

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

        if (!channelName && ogTitle) {
            channelName = ogTitle;
        }

        if (!channelLogo && ogImage) {
            channelLogo = ogImage;
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
            customUrl: customUrl, // c/Name or user/Name if that was the input
            topicChannel
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
    if (!message?.type) return false;
    try {
        if (globalThis?.__filtertubeDebug) {
            console.log('FilterTube Background: Received message:', message.type);
        }
    } catch (e) {
    }

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
                channelLogo: message.channelLogo,
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
async function handleAddFilteredChannel(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}, profile = 'main', videoId = '', listType = 'blocklist') {
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
        let channelInfo = null;
        const isUcIdLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
        };

        const isProbablyNotChannelName = (value) => {
            if (!value || typeof value !== 'string') return true;
            const trimmed = value.trim();
            if (!trimmed) return true;
            if (isUcIdLike(trimmed)) return true;
            if (trimmed.startsWith('@')) return true;
            if (trimmed.toLowerCase() === 'channel') return true;
            if (trimmed.includes('•')) return true;
            if (/\bviews?\b/i.test(trimmed)) return true;
            if (/\bago\b/i.test(trimmed)) return true;
            if (/\bwatching\b/i.test(trimmed)) return true;
            return false;
        };

        const sanitizePersistedChannelName = (value) => {
            if (!value || typeof value !== 'string') return '';
            const trimmed = value.trim();
            if (!trimmed) return '';
            if (isProbablyNotChannelName(trimmed)) return '';
            return trimmed;
        };

        const hasMetadataName = typeof metadata.channelName === 'string' && metadata.channelName.trim();
        const hasGoodMetadataName = Boolean(hasMetadataName && !isProbablyNotChannelName(metadata.channelName));
        const looksLikeTopicName = hasMetadataName && /\s-\sTopic$/i.test(metadata.channelName.trim());
        const hasMetadataHandle = typeof metadata.displayHandle === 'string' && metadata.displayHandle.trim();
        const hasMetadataLogo = typeof metadata.channelLogo === 'string' && metadata.channelLogo.trim();

        // Important: do NOT skip fetch purely because we have a logo.
        // That leads to persisting {name: UC...} entries when name/handle were missing.
        const shouldSkipFetch = lookupValue
            && String(lookupValue).toUpperCase().startsWith('UC')
            && (hasGoodMetadataName || hasMetadataHandle)
            && !looksLikeTopicName;
        if (shouldSkipFetch) {
            channelInfo = {
                success: true,
                id: String(lookupValue),
                handle: (isHandle ? normalizedValue : null),
                name: (metadata.channelName || metadata.displayHandle || (isHandle ? normalizedValue : '') || String(lookupValue)),
                logo: metadata.channelLogo || null,
                customUrl: metadata.customUrl || null,
                topicChannel: false
            };
        } else {
            channelInfo = await fetchChannelInfo(lookupValue);
        }

        // If channel page scraping failed (often due to google.com/sorry redirects + CORS),
        // fall back to watch identity resolution when a videoId is available.
        // This path is spec-aligned: it uses video payload surfaces and avoids brittle channel page HTML.
        if (!channelInfo.success && effectiveVideoId) {
            try {
                const isKids = profile === 'kids';
                const identity = isKids
                    ? (await performKidsWatchIdentityFetch(effectiveVideoId) || await performWatchIdentityFetch(effectiveVideoId))
                    : await performWatchIdentityFetch(effectiveVideoId);

                if (identity && (identity.id || identity.handle || identity.name)) {
                    channelInfo = {
                        success: true,
                        id: identity.id || mappedId || (lookupValue && String(lookupValue).toUpperCase().startsWith('UC') ? lookupValue : ''),
                        handle: identity.handle || (isHandle ? normalizedValue : null),
                        name: identity.name || metadata.channelName || metadata.displayHandle || (isHandle ? normalizedValue : null),
                        logo: (identity.logo || metadata.channelLogo || null),
                        customUrl: identity.customUrl || metadata.customUrl || null
                    };
                    if (!metadata.channelName && identity.name) metadata.channelName = identity.name;
                    if (!metadata.displayHandle && identity.handle) metadata.displayHandle = identity.handle;
                }
            } catch (e) {
            }
        }

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
                    logo: metadata.channelLogo || null,
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
        const targetListType = listType === 'whitelist' ? 'whitelist' : 'blocklist';
        const storage = await storageGet([
            FT_PROFILES_V4_KEY,
            'filterChannels',
            'uiKeywords',
            'filterKeywords',
            'ftProfilesV3'
        ]);

        let profilesV4 = storage?.[FT_PROFILES_V4_KEY];
        let profilesV3 = storage.ftProfilesV3 || {};
        let activeProfileId = DEFAULT_PROFILE_ID;
        let activeProfile = {};
        let activeMain = {};
        let activeKids = {};

        if (!isValidProfilesV4(profilesV4)) {
            try {
                profilesV4 = buildProfilesV4FromLegacyState(storage, {});
            } catch (e) {
                profilesV4 = null;
            }
        }

        if (profilesV4 && isValidProfilesV4(profilesV4)) {
            activeProfileId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID;
            activeProfile = safeObject(safeObject(profilesV4.profiles)[activeProfileId]);
            activeMain = safeObject(activeProfile.main);
            activeKids = safeObject(activeProfile.kids);
        }

        let channels = [];
        if (isKids) {
            const kidsFromV4 = targetListType === 'whitelist'
                ? (Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : null)
                : (Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : null);
            const kidsProfile = safeObject(profilesV3.kids);
            const kidsFromV3 = targetListType === 'whitelist'
                ? (Array.isArray(kidsProfile.whitelistChannels) ? kidsProfile.whitelistChannels : safeArray(kidsProfile.whitelistedChannels))
                : (Array.isArray(kidsProfile.blockedChannels) ? kidsProfile.blockedChannels : []);
            channels = kidsFromV4 || kidsFromV3;
        } else {
            const mainFromV4 = targetListType === 'whitelist'
                ? (Array.isArray(activeMain.whitelistChannels) ? activeMain.whitelistChannels : null)
                : (Array.isArray(activeMain.channels) ? activeMain.channels : null);
            const mainProfile = safeObject(profilesV3.main);
            const mainFromV3 = targetListType === 'whitelist'
                ? (Array.isArray(mainProfile.whitelistChannels) ? mainProfile.whitelistChannels : safeArray(mainProfile.whitelistedChannels))
                : null;
            channels = mainFromV4
                || (targetListType === 'whitelist'
                    ? mainFromV3
                    : (Array.isArray(storage.filterChannels) ? storage.filterChannels : []));
        }

        // Build allCollaborators array from collaborationWith for popup grouping
        const allCollaborators = collaborationWith && collaborationWith.length > 0
            ? [{ handle: channelInfo.handle, name: channelInfo.name }, ...collaborationWith.map(h => ({ handle: h }))]
            : [];

        const canonicalCandidate = (metadata.canonicalHandle || channelInfo.canonicalHandle || channelInfo.handle || (isHandle ? rawValue : '') || '').trim();
        const canonicalHandle = isHandleLike(canonicalCandidate) ? canonicalCandidate : '';
        const normalizedHandle = canonicalHandle
            ? canonicalHandle.toLowerCase()
            : (isHandleLike(channelInfo.handle) ? String(channelInfo.handle).trim().toLowerCase() : '');
        const displayCandidate = String(metadata.displayHandle || channelInfo.handleDisplay || '').trim();
        const handleDisplay = isHandleLike(displayCandidate)
            ? displayCandidate
            : (canonicalHandle || '');

        const finalChannelName = sanitizePersistedChannelName(
            pickBetterName(metadata.channelName, channelInfo.name, normalizedValue)
        );

        if (normalizedHandle) {
            channelInfo.handle = normalizedHandle;
        }
        channelInfo.canonicalHandle = canonicalHandle || null;
        channelInfo.handleDisplay = handleDisplay || null;
        channelInfo.name = finalChannelName;
        channelInfo.topicChannel = channelInfo.topicChannel === true || metadata.topicChannel === true;

        // Check if channel already exists; if so, upgrade instead of rejecting.
        // IMPORTANT: Never match on empty/null handles. That caused unrelated channels
        // (both with null handle) to collide and overwrite each other.
        const normalizeHandleForMatch = (value) => {
            if (!value || typeof value !== 'string') return '';
            const trimmed = value.trim();
            if (!trimmed || !trimmed.startsWith('@')) return '';
            return trimmed.toLowerCase();
        };
        const incomingIdForMatch = (typeof channelInfo.id === 'string' ? channelInfo.id.trim() : '');
        const incomingHandleForMatch = normalizeHandleForMatch(
            channelInfo.handle || channelInfo.canonicalHandle || channelInfo.handleDisplay || ''
        );
        const existingIndex = channels.findIndex((ch) => {
            if (!ch) return false;

            const existingIdForMatch = (typeof ch.id === 'string' ? ch.id.trim() : '');
            if (incomingIdForMatch && existingIdForMatch && existingIdForMatch === incomingIdForMatch) {
                return true;
            }

            const existingHandleForMatch = normalizeHandleForMatch(
                ch.handle || ch.canonicalHandle || ch.handleDisplay || ''
            );
            if (incomingHandleForMatch && existingHandleForMatch && existingHandleForMatch === incomingHandleForMatch) {
                // Defensive: if both sides also have UC IDs and they differ, do not merge.
                if (incomingIdForMatch && existingIdForMatch && incomingIdForMatch !== existingIdForMatch) {
                    return false;
                }
                return true;
            }

            return false;
        });

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

            const mergedName = (() => {
                const existingName = sanitizePersistedChannelName(existing.name || '');
                if (existingName) return existingName;
                return finalChannelName;
            })();

            const updated = {
                ...existing,
                id: existing.id || channelInfo.id,
                handle: existing.handle || channelInfo.handle,
                handleDisplay: (isHandleLike(existing.handleDisplay) ? existing.handleDisplay : '') || channelInfo.handleDisplay || null,
                canonicalHandle: (isHandleLike(existing.canonicalHandle) ? existing.canonicalHandle : '') || channelInfo.canonicalHandle || null,
                name: mergedName,
                logo: existing.logo || channelInfo.logo,
                customUrl: existing.customUrl || customUrl,
                topicChannel: existing.topicChannel === true || channelInfo.topicChannel === true,
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
                handleDisplay: isHandleLike(channelInfo.handleDisplay) ? channelInfo.handleDisplay : null,
                canonicalHandle: isHandleLike(channelInfo.canonicalHandle) ? channelInfo.canonicalHandle : null,
                name: finalChannelName,
                logo: channelInfo.logo,
                filterAll: filterAll,
                collaborationWith: collaborationWith || [],
                collaborationGroupId: collaborationGroupId || null,
                allCollaborators: allCollaborators,
                customUrl: customUrl || null,
                topicChannel: channelInfo.topicChannel === true,
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

        if (finalChannelData?.id && typeof finalChannelData.id === 'string' && finalChannelData.id.toUpperCase().startsWith('UC')) {
            const handleToMap = (finalChannelData.handleDisplay || finalChannelData.canonicalHandle || finalChannelData.handle || '').trim();
            const normalizedHandleKey = (finalChannelData.handle || '').trim().toLowerCase();
            if (handleToMap && handleToMap.startsWith('@')) {
                try {
                    const mapStorage = await storageGet(['channelMap']);
                    const channelMap = mapStorage.channelMap || {};
                    const keyId = finalChannelData.id.toLowerCase();
                    const keyHandle = normalizedHandleKey || handleToMap.toLowerCase();
                    let hasChange = false;
                    if (keyHandle && channelMap[keyHandle] !== finalChannelData.id) {
                        channelMap[keyHandle] = finalChannelData.id;
                        hasChange = true;
                    }
                    if (channelMap[keyId] !== handleToMap) {
                        channelMap[keyId] = handleToMap;
                        hasChange = true;
                    }
                    if (hasChange) {
                        await browserAPI.storage.local.set({ channelMap });
                    }
                } catch (e) {
                }
            }
        }

        // Save back to storage
        const storageWritePayload = {};

        if (profilesV4 && isValidProfilesV4(profilesV4)) {
            const profiles = safeObject(profilesV4.profiles);
            const baseProfile = safeObject(profiles[activeProfileId]);
            const nextMain = safeObject(baseProfile.main);
            const nextKids = safeObject(baseProfile.kids);

            profiles[activeProfileId] = {
                ...baseProfile,
                name: typeof baseProfile.name === 'string' ? baseProfile.name : 'Default',
                settings: safeObject(baseProfile.settings),
                main: {
                    ...nextMain,
                    channels: (!isKids && targetListType === 'blocklist') ? channels : safeArray(nextMain.channels),
                    whitelistChannels: (!isKids && targetListType === 'whitelist') ? channels : safeArray(nextMain.whitelistChannels)
                },
                kids: {
                    ...nextKids,
                    mode: nextKids.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                    strictMode: nextKids.strictMode !== false,
                    blockedChannels: (isKids && targetListType === 'blocklist') ? channels : safeArray(nextKids.blockedChannels),
                    blockedKeywords: safeArray(nextKids.blockedKeywords),
                    whitelistChannels: (isKids && targetListType === 'whitelist') ? channels : safeArray(nextKids.whitelistChannels),
                    whitelistKeywords: safeArray(nextKids.whitelistKeywords)
                }
            };

            storageWritePayload[FT_PROFILES_V4_KEY] = {
                ...profilesV4,
                schemaVersion: 4,
                profiles
            };
        }

        if (isKids) {
            const existingKidsV3 = safeObject(profilesV3.kids);
            profilesV3.kids = {
                ...existingKidsV3,
                blockedChannels: targetListType === 'blocklist'
                    ? channels
                    : safeArray(existingKidsV3.blockedChannels),
                whitelistedChannels: targetListType === 'whitelist'
                    ? channels
                    : safeArray(existingKidsV3.whitelistedChannels),
                mode: existingKidsV3.mode === 'whitelist' ? 'whitelist' : 'blocklist'
            };
            storageWritePayload.ftProfilesV3 = profilesV3;

            // Broadcast refresh for Kids
            try {
                browserAPI.tabs.query({ url: ['*://*.youtubekids.com/*'] }, tabs => {
                    (tabs || []).forEach(tab => {
                        if (tab?.id) browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_RefreshNow' }, () => { });
                    });
                });
            } catch (e) { }
        } else {
            if (targetListType === 'blocklist') {
                storageWritePayload.filterChannels = channels;
                try {
                    storageWritePayload.uiChannels = safeArray(channels).map(ch => (typeof ch?.name === 'string' ? ch.name : '')).filter(Boolean);
                } catch (e) {
                }
            }

            if (targetListType === 'whitelist') {
                const existingMainV3 = safeObject(profilesV3.main);
                profilesV3.main = {
                    ...existingMainV3,
                    whitelistedChannels: channels,
                    mode: existingMainV3.mode === 'whitelist' ? 'whitelist' : 'blocklist'
                };
                storageWritePayload.ftProfilesV3 = profilesV3;
            }
        }

        await browserAPI.storage.local.set(storageWritePayload);

        compiledSettingsCache.main = null;
        compiledSettingsCache.kids = null;

        try {
            if (existingIndex === -1) {
                schedulePostBlockEnrichment(finalChannelData, profile, metadata);
            }
        } catch (e) {
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
            browserAPI.storage.local.get([
                'filterChannels',
                'uiKeywords',
                'filterKeywords',
                'ftProfilesV3',
                FT_PROFILES_V4_KEY
            ], resolve);
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

        let nextProfilesV4 = null;
        try {
            const existingV4 = storage?.[FT_PROFILES_V4_KEY];
            const profilesV4 = isValidProfilesV4(existingV4)
                ? existingV4
                : buildProfilesV4FromLegacyState(storage, {});

            const activeId = typeof profilesV4?.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID;
            const profiles = safeObject(profilesV4?.profiles);
            const activeProfile = safeObject(profiles?.[activeId]);
            const main = safeObject(activeProfile.main);

            profiles[activeId] = {
                ...activeProfile,
                name: typeof activeProfile.name === 'string' ? activeProfile.name : 'Default',
                settings: safeObject(activeProfile.settings),
                main: {
                    ...main,
                    channels
                },
                kids: {
                    ...safeObject(activeProfile.kids),
                    mode: safeObject(activeProfile.kids).mode === 'whitelist' ? 'whitelist' : 'blocklist'
                }
            };

            nextProfilesV4 = {
                ...profilesV4,
                schemaVersion: 4,
                activeProfileId: activeId,
                profiles
            };
        } catch (e) {
        }

        // Save to storage
        await new Promise(resolve => {
            const payload = { filterChannels: channels };
            if (nextProfilesV4) {
                payload[FT_PROFILES_V4_KEY] = nextProfilesV4;
            }
            browserAPI.storage.local.set(payload, resolve);
        });

        compiledSettingsCache.main = null;
        compiledSettingsCache.kids = null;

        console.log('FilterTube Background: Toggled filterAll for channel:', channelId, 'to:', value);

        return { success: true };

    } catch (error) {
        console.error('FilterTube Background: Error toggling filterAll:', error);
        return { success: false, error: error.message };
    }
}

console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} loaded and ready to serve filtered content.`);
