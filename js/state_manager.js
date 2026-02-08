/**
 * FilterTube State Manager
 * Centralized state management and business logic for popup and tab-view
 * 
 * This module provides a single source of truth for all state operations,
 * eliminating duplicated logic across different UI contexts.
 */

const StateManager = (() => {
    'use strict';

    // Import shared settings utilities
    const SettingsAPI = window.FilterTubeSettings || {};

    function isUiLocked() {
        try {
            if (typeof window.FilterTubeIsUiLocked === 'function') {
                return !!window.FilterTubeIsUiLocked();
            }
        } catch (e) {
        }
        return false;
    }

    function scheduleAutoBackup(triggerType, delay = 1000) {
        try {
            const action = 'FilterTube_ScheduleAutoBackup';
            const trigger = typeof triggerType === 'string' ? triggerType : 'unknown';

            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                chrome.runtime.sendMessage({ action, triggerType: trigger, delay }, () => {
                    // ignore errors; backups should be best-effort
                });
                return;
            }

            if (typeof window.FilterTubeIO !== 'undefined' && window.FilterTubeIO.scheduleAutoBackup) {
                window.FilterTubeIO.scheduleAutoBackup(trigger, delay);
            }
        } catch (e) {
            console.warn('FilterTube: Failed to schedule backup:', e);
        }
    }

    // ============================================================================
    // STATE
    // ============================================================================

    let state = {
        enabled: true,
        autoBackupEnabled: false,
        syncKidsToMain: false,
        mode: 'blocklist',
        whitelistChannels: [],
        whitelistKeywords: [],
        userWhitelistKeywords: [],
        keywords: [],
        userKeywords: [],
        channels: [],
        hideShorts: false,
        hideComments: false,
        filterComments: false,
        hideHomeFeed: false,
        hideSponsoredCards: false,
        hideWatchPlaylistPanel: false,
        hidePlaylistCards: false,
        hideMembersOnly: false,
        hideMixPlaylists: false,
        hideVideoSidebar: false,
        hideRecommended: false,
        hideLiveChat: false,
        hideVideoInfo: false,
        hideVideoButtonsBar: false,
        hideAskButton: false,
        hideVideoChannelRow: false,
        hideVideoDescription: false,
        hideMerchTicketsOffers: false,
        hideEndscreenVideowall: false,
        hideEndscreenCards: false,
        disableAutoplay: false,
        disableAnnotations: false,
        hideTopHeader: false,
        hideNotificationBell: false,
        hideExploreTrending: false,
        hideMoreFromYouTube: false,
        hideSubscriptions: false,
        showQuickBlockButton: true,
        hideSearchShelves: false,
        stats: { hiddenCount: 0, savedMinutes: 0 },
        statsBySurface: {},
        channelMap: {},
        theme: 'light',
        isLoaded: false,
        kids: {
            blockedKeywords: [],
            blockedChannels: [],
            whitelistChannels: [],
            whitelistKeywords: [],
            mode: 'blocklist',
            strictMode: true,
            videoIds: [],
            subscriptions: [],
            contentFilters: {
                duration: {
                    enabled: false,
                    condition: 'between',
                    value: '',
                    minMinutes: 0,
                    maxMinutes: 0
                },
                uploadDate: {
                    enabled: false,
                    condition: 'newer',
                    value: '',
                    fromDate: '',
                    toDate: ''
                },
                uppercase: {
                    enabled: false,
                    mode: 'single_word',
                    minWordLength: 2
                }
            },
            categoryFilters: {
                enabled: false,
                mode: 'block',
                selected: []
            }
        },
        contentFilters: {
            duration: {
                enabled: false,
                condition: 'between', // 'longer', 'shorter', 'between'
                value: '',
                minMinutes: 0,
                maxMinutes: 0
            },
            uploadDate: {
                enabled: false,
                condition: 'newer', // 'newer', 'older', 'between'
                value: '',
                fromDate: '',
                toDate: ''
            },
            uppercase: {
                enabled: false,
                mode: 'single_word',
                minWordLength: 2
            }
        },
        categoryFilters: {
            enabled: false,
            mode: 'block',
            selected: []
        }
    };

    const channelEnrichmentAttempted = new Set();
    const channelEnrichmentQueue = [];
    let isEnriching = false;
    let lastEnrichmentSignature = '';

    const MAX_CHANNEL_ENRICHMENTS_PER_SESSION = 10;
    let channelEnrichmentProcessedThisSession = 0;

    let isSaving = false;
    let listeners = [];

    // ============================================================================
    // SETTINGS MANAGEMENT
    // ============================================================================

    /**
     * Load settings from storage and populate state
     * @returns {Promise<Object>} Loaded state
     */
    async function loadSettings(options = {}) {
        const opts = options && typeof options === 'object' ? options : {};
        const shouldNotify = opts.notify !== false;
        const shouldResetEnrichment = opts.resetEnrichment !== false;
        const shouldScheduleEnrichment = opts.scheduleEnrichment !== false;
        if (!SettingsAPI.loadSettings) {
            console.warn('StateManager: SettingsAPI.loadSettings not available');
            return state;
        }

        const data = await SettingsAPI.loadSettings();
        const io = window.FilterTubeIO || {};
        let profilesV3 = null;
        let profilesV4 = null;
        if (io && typeof io.loadProfilesV3 === 'function') {
            try {
                profilesV3 = await io.loadProfilesV3();
            } catch (e) {
                console.warn('StateManager: loadProfilesV3 failed', e);
            }
        }

        if (io && typeof io.loadProfilesV4 === 'function') {
            try {
                profilesV4 = await io.loadProfilesV4();
            } catch (e) {
                console.warn('StateManager: loadProfilesV4 failed', e);
            }
        }

        state.enabled = data.enabled !== false;
        state.autoBackupEnabled = data.autoBackupEnabled === true;
        state.keywords = data.keywords || [];
        state.userKeywords = data.userKeywords || [];
        state.channels = data.channels || [];
        state.hideShorts = data.hideShorts || false;
        state.hideComments = data.hideComments || false;
        state.filterComments = data.filterComments || false;
        state.hideHomeFeed = data.hideHomeFeed || false;
        state.hideSponsoredCards = data.hideSponsoredCards || false;
        state.hideWatchPlaylistPanel = data.hideWatchPlaylistPanel || false;
        state.hidePlaylistCards = data.hidePlaylistCards || false;
        state.hideMembersOnly = data.hideMembersOnly || false;
        state.hideMixPlaylists = data.hideMixPlaylists || false;
        state.hideVideoSidebar = data.hideVideoSidebar || false;
        state.hideRecommended = data.hideRecommended || false;
        state.hideLiveChat = data.hideLiveChat || false;
        state.hideVideoInfo = data.hideVideoInfo || false;
        state.hideVideoButtonsBar = data.hideVideoButtonsBar || false;
        state.hideAskButton = data.hideAskButton || false;
        state.hideVideoChannelRow = data.hideVideoChannelRow || false;
        state.hideVideoDescription = data.hideVideoDescription || false;
        state.hideMerchTicketsOffers = data.hideMerchTicketsOffers || false;
        state.hideEndscreenVideowall = data.hideEndscreenVideowall || false;
        state.hideEndscreenCards = data.hideEndscreenCards || false;
        state.disableAutoplay = data.disableAutoplay || false;
        state.disableAnnotations = data.disableAnnotations || false;
        state.hideTopHeader = data.hideTopHeader || false;
        state.hideNotificationBell = data.hideNotificationBell || false;
        state.hideExploreTrending = data.hideExploreTrending || false;
        state.hideMoreFromYouTube = data.hideMoreFromYouTube || false;
        state.hideSubscriptions = data.hideSubscriptions || false;
        state.showQuickBlockButton = data.showQuickBlockButton !== false;
        state.hideSearchShelves = data.hideSearchShelves || false;
        state.stats = data.stats || { hiddenCount: 0, savedMinutes: 0 };
        state.statsBySurface = (data.statsBySurface && typeof data.statsBySurface === 'object' && !Array.isArray(data.statsBySurface))
            ? data.statsBySurface
            : {};
        state.channelMap = data.channelMap || {};
        state.theme = data.theme || 'light';
        state.syncKidsToMain = false;
        state.contentFilters = data.contentFilters ? JSON.parse(JSON.stringify(data.contentFilters)) : {
            duration: { enabled: false, minMinutes: 0, maxMinutes: 0, condition: 'between' },
            uploadDate: { enabled: false, fromDate: '', toDate: '' },
            uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
        };

        state.categoryFilters = data.categoryFilters ? JSON.parse(JSON.stringify(data.categoryFilters)) : {
            enabled: false,
            mode: 'block',
            selected: []
        };

        try {
            const loaded = state.categoryFilters && typeof state.categoryFilters === 'object' ? state.categoryFilters : {};
            state.categoryFilters = {
                enabled: loaded.enabled === true,
                mode: loaded.mode === 'allow' ? 'allow' : 'block',
                selected: Array.isArray(loaded.selected) ? [...loaded.selected] : []
            };
        } catch (e) {
        }

        const pickActiveProfileFromV4 = () => {
            if (!profilesV4 || typeof profilesV4 !== 'object' || Array.isArray(profilesV4)) return null;
            const activeId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId.trim() : '';
            if (!activeId) return null;
            const profiles = profilesV4.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles)
                ? profilesV4.profiles
                : null;
            if (!profiles) return null;
            const activeProfile = profiles[activeId] && typeof profiles[activeId] === 'object' ? profiles[activeId] : null;
            return activeProfile;
        };
        const pickKidsFromV4 = () => {
            if (!profilesV4 || typeof profilesV4 !== 'object' || Array.isArray(profilesV4)) return null;
            const activeId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId.trim() : '';
            if (!activeId) return null;
            const profiles = profilesV4.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles)
                ? profilesV4.profiles
                : null;
            if (!profiles) return null;
            const activeProfile = profiles[activeId] && typeof profiles[activeId] === 'object' ? profiles[activeId] : null;
            if (!activeProfile) return null;
            const kids = activeProfile.kids && typeof activeProfile.kids === 'object' ? activeProfile.kids : null;
            if (!kids) return null;
            return kids;
        };

        const pickMainFromV4 = () => {
            if (!profilesV4 || typeof profilesV4 !== 'object' || Array.isArray(profilesV4)) return null;
            const activeId = typeof profilesV4.activeProfileId === 'string' ? profilesV4.activeProfileId.trim() : '';
            if (!activeId) return null;
            const profiles = profilesV4.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles)
                ? profilesV4.profiles
                : null;
            if (!profiles) return null;
            const activeProfile = profiles[activeId] && typeof profiles[activeId] === 'object' ? profiles[activeId] : null;
            if (!activeProfile) return null;
            const main = activeProfile.main && typeof activeProfile.main === 'object' ? activeProfile.main : null;
            if (!main) return null;
            return main;
        };

        const activeProfileFromV4 = pickActiveProfileFromV4();
        if (activeProfileFromV4 && activeProfileFromV4.settings && typeof activeProfileFromV4.settings === 'object') {
            state.syncKidsToMain = !!activeProfileFromV4.settings.syncKidsToMain;
        }

        const mainFromV4 = pickMainFromV4();
        if (mainFromV4) {
            state.mode = mainFromV4.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            state.whitelistChannels = Array.isArray(mainFromV4.whitelistChannels) ? mainFromV4.whitelistChannels : [];
            state.whitelistKeywords = Array.isArray(mainFromV4.whitelistKeywords) ? mainFromV4.whitelistKeywords : [];
            // Also load blocklist channels/keywords from profile
            state.channels = Array.isArray(mainFromV4.channels) ? mainFromV4.channels : 
                (Array.isArray(mainFromV4.blockedChannels) ? mainFromV4.blockedChannels : []);
            state.keywords = Array.isArray(mainFromV4.keywords) ? mainFromV4.keywords : 
                (Array.isArray(mainFromV4.blockedKeywords) ? mainFromV4.blockedKeywords : []);
        } else if (profilesV3 && profilesV3.main) {
            state.mode = profilesV3.main.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            state.whitelistChannels = profilesV3.main.whitelistChannels
                || profilesV3.main.whitelistedChannels
                || [];
            state.whitelistKeywords = profilesV3.main.whitelistKeywords
                || profilesV3.main.whitelistedKeywords
                || [];
            // Also load blocklist channels/keywords from profile
            state.channels = profilesV3.main.channels
                || profilesV3.main.blockedChannels
                || [];
            state.keywords = profilesV3.main.keywords
                || profilesV3.main.blockedKeywords
                || [];
        } else {
            state.mode = 'blocklist';
            state.whitelistChannels = [];
            state.whitelistKeywords = [];
        }
        state.userWhitelistKeywords = Array.isArray(state.whitelistKeywords)
            ? state.whitelistKeywords.filter(entry => entry && entry.source !== 'channel')
            : [];

        const kidsFromV4 = pickKidsFromV4();
        if (kidsFromV4) {
            const cleanBlockedChannels = (kidsFromV4.blockedChannels || []).filter(ch => {
                const id = (ch.id || '').trim();
                const handle = (ch.handle || '').trim();
                const customUrl = (ch.customUrl || '').trim();
                const name = (ch.name || '').trim();

                if (id.toUpperCase().startsWith('UC') || (handle && handle.startsWith('@')) || customUrl) {
                    return true;
                }

                if (name === 'Blocked Video (Kids)' || name === 'Channel') {
                    return false;
                }

                return !!name;
            });

            state.kids = {
                blockedKeywords: kidsFromV4.blockedKeywords || [],
                blockedChannels: cleanBlockedChannels,
                whitelistChannels: kidsFromV4.whitelistChannels || [],
                whitelistKeywords: kidsFromV4.whitelistKeywords || [],
                mode: kidsFromV4.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                strictMode: kidsFromV4.strictMode !== false,
                videoIds: kidsFromV4.videoIds || [],
                subscriptions: kidsFromV4.subscriptions || [],
                contentFilters: (kidsFromV4.contentFilters && typeof kidsFromV4.contentFilters === 'object')
                    ? JSON.parse(JSON.stringify(kidsFromV4.contentFilters))
                    : {},
                categoryFilters: (kidsFromV4.categoryFilters && typeof kidsFromV4.categoryFilters === 'object')
                    ? JSON.parse(JSON.stringify(kidsFromV4.categoryFilters))
                    : {}
            };

            try {
                const defaults = {
                    duration: { enabled: false, condition: 'between', value: '', minMinutes: 0, maxMinutes: 0 },
                    uploadDate: { enabled: false, condition: 'newer', value: '', fromDate: '', toDate: '' },
                    uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
                };
                const loaded = state.kids.contentFilters && typeof state.kids.contentFilters === 'object' ? state.kids.contentFilters : {};
                state.kids.contentFilters = {
                    duration: { ...defaults.duration, ...(loaded.duration || {}) },
                    uploadDate: { ...defaults.uploadDate, ...(loaded.uploadDate || {}) },
                    uppercase: { ...defaults.uppercase, ...(loaded.uppercase || {}) }
                };
            } catch (e) {
            }

            try {
                const defaults = { enabled: false, mode: 'block', selected: [] };
                const loaded = state.kids.categoryFilters && typeof state.kids.categoryFilters === 'object' ? state.kids.categoryFilters : {};
                state.kids.categoryFilters = {
                    enabled: loaded.enabled === true,
                    mode: loaded.mode === 'allow' ? 'allow' : defaults.mode,
                    selected: Array.isArray(loaded.selected) ? [...loaded.selected] : []
                };
            } catch (e) {
            }
        } else if (profilesV3 && profilesV3.kids) {
            // Cleanup legacy "Blocked Video (Kids)" entries that have no valid ID/handle
            const cleanBlockedChannels = (profilesV3.kids.blockedChannels || []).filter(ch => {
                const id = (ch.id || '').trim();
                const handle = (ch.handle || '').trim();
                const customUrl = (ch.customUrl || '').trim();
                const name = (ch.name || '').trim();

                // If it has a valid identifier (UC ID, handle, customUrl), keep it for enrichment
                if (id.toUpperCase().startsWith('UC') || (handle && handle.startsWith('@')) || customUrl) {
                    return true;
                }

                // If it's a legacy placeholder with no identifier, drop it
                if (name === 'Blocked Video (Kids)' || name === 'Channel') {
                    return false;
                }

                // Keep if it has a non-placeholder name (it might be a text-based ID we can resolve)
                return !!name;
            });

            state.kids = {
                blockedKeywords: profilesV3.kids.blockedKeywords || [],
                blockedChannels: cleanBlockedChannels,
                whitelistChannels: profilesV3.kids.whitelistChannels || profilesV3.kids.whitelistedChannels || [],
                whitelistKeywords: profilesV3.kids.whitelistKeywords || profilesV3.kids.whitelistedKeywords || [],
                mode: profilesV3.kids.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                strictMode: profilesV3.kids.strictMode !== false,
                videoIds: profilesV3.kids.videoIds || [],
                subscriptions: profilesV3.kids.subscriptions || [],
                contentFilters: (profilesV3.kids.contentFilters && typeof profilesV3.kids.contentFilters === 'object')
                    ? JSON.parse(JSON.stringify(profilesV3.kids.contentFilters))
                    : {},
                categoryFilters: (profilesV3.kids.categoryFilters && typeof profilesV3.kids.categoryFilters === 'object')
                    ? JSON.parse(JSON.stringify(profilesV3.kids.categoryFilters))
                    : {}
            };

            try {
                const defaults = {
                    duration: { enabled: false, condition: 'between', value: '', minMinutes: 0, maxMinutes: 0 },
                    uploadDate: { enabled: false, condition: 'newer', value: '', fromDate: '', toDate: '' },
                    uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
                };
                const loaded = state.kids.contentFilters && typeof state.kids.contentFilters === 'object' ? state.kids.contentFilters : {};
                state.kids.contentFilters = {
                    duration: { ...defaults.duration, ...(loaded.duration || {}) },
                    uploadDate: { ...defaults.uploadDate, ...(loaded.uploadDate || {}) },
                    uppercase: { ...defaults.uppercase, ...(loaded.uppercase || {}) }
                };
            } catch (e) {
            }

            try {
                const defaults = { enabled: false, mode: 'block', selected: [] };
                const loaded = state.kids.categoryFilters && typeof state.kids.categoryFilters === 'object' ? state.kids.categoryFilters : {};
                state.kids.categoryFilters = {
                    enabled: loaded.enabled === true,
                    mode: loaded.mode === 'allow' ? 'allow' : defaults.mode,
                    selected: Array.isArray(loaded.selected) ? [...loaded.selected] : []
                };
            } catch (e) {
            }
        }
        if (shouldResetEnrichment) {
            // Reset enrichment state so re-imports can re-run enrichment
            resetEnrichmentState();
        }
        lastEnrichmentSignature = computeChannelSignature();
        state.isLoaded = true;

        if (shouldNotify) {
            notifyListeners('load', state);
        }
        // Kick off async channel name enrichment after initial load
        if (shouldScheduleEnrichment) {
            scheduleChannelNameEnrichment();
        }
        return state;
    }

    let channelEnrichmentScheduled = false;
    function scheduleChannelNameEnrichment() {
        try {
            if (channelEnrichmentScheduled) return;
            channelEnrichmentScheduled = true;
            setTimeout(() => {
                channelEnrichmentScheduled = false;
                enqueueChannelEnrichment();
            }, 0);
        } catch (e) {
        }
    }

    function resetEnrichmentState() {
        channelEnrichmentQueue.length = 0;
        channelEnrichmentAttempted.clear();
        isEnriching = false;
    }

    function getKidsState() {
        if (!state.kids) {
            state.kids = {
                blockedKeywords: [],
                blockedChannels: [],
                whitelistChannels: [],
                whitelistKeywords: [],
                mode: 'blocklist',
                strictMode: true,
                videoIds: [],
                subscriptions: [],
                contentFilters: {
                    duration: { enabled: false, condition: 'between', value: '', minMinutes: 0, maxMinutes: 0 },
                    uploadDate: { enabled: false, condition: 'newer', value: '', fromDate: '', toDate: '' },
                    uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
                }
            };
        }
        return state.kids;
    }

    function isHandleLike(value) {
        return typeof value === 'string' && value.trim().startsWith('@');
    }

    function shouldEnrichChannel(channel) {
        if (!channel || typeof channel !== 'object') return false;
        const name = typeof channel.name === 'string' ? channel.name.trim() : '';
        const id = typeof channel.id === 'string' ? channel.id.trim() : '';
        const handle = typeof channel.handle === 'string' ? channel.handle.trim() : '';
        const customUrl = typeof channel.customUrl === 'string' ? channel.customUrl.trim() : '';
        const source = typeof channel.source === 'string' ? channel.source.trim() : '';
        const hasLookup = !!(id || handle || customUrl);
        if (!hasLookup) return false;

        if (!id || !id.toUpperCase().startsWith('UC')) return true;

        if (source === 'import') {
            if (name && id && name === id && !handle && !customUrl) {
                return false;
            }
        }
        if (!name) return true;
        if (id && name === id) return true;
        if (isHandleLike(name)) return true;
        // Topic channels often only have a stable UC ID and a display name like "Artist - Topic".
        // Treat these as complete enough to avoid repeated enrichment attempts.
        if (name && /\s-\sTopic$/i.test(name) && id && id.toUpperCase().startsWith('UC')) {
            return false;
        }
        return false;
    }

    function channelEnrichmentKey(channel, profile = 'main') {
        const baseKey = String(channel?.id || channel?.handle || channel?.customUrl || '').toLowerCase();
        if (!baseKey) return '';
        return `${profile}:${baseKey}`;
    }

    function computeChannelSignature() {
        const mainChannels = Array.isArray(state.channels) ? state.channels : [];
        const kids = state.kids || {};
        const kidsChannels = Array.isArray(kids.blockedChannels) ? kids.blockedChannels : [];

        const mainSig = mainChannels
            .map(ch => channelEnrichmentKey(ch, 'main'))
            .filter(Boolean)
            .sort()
            .join('|');

        const kidsSig = kidsChannels
            .map(ch => channelEnrichmentKey(ch, 'kids'))
            .filter(Boolean)
            .sort()
            .join('|');

        return `${mainSig}|||${kidsSig}`;
    }

    function queueChannelForEnrichment(channel, profile = 'main') {
        if (!shouldEnrichChannel(channel)) return;
        const key = channelEnrichmentKey(channel, profile);
        if (!key || channelEnrichmentAttempted.has(key)) return;
        channelEnrichmentAttempted.add(key);

        channelEnrichmentQueue.push({
            input: channel.id || channel.handle || channel.customUrl,
            handleDisplay: channel.handleDisplay || null,
            canonicalHandle: channel.canonicalHandle || null,
            customUrl: channel.customUrl || null,
            source: channel.source || null,
            profile: profile
        });
    }

    function triggerChannelEnrichmentRefresh() {
        enqueueChannelEnrichment();
        lastEnrichmentSignature = computeChannelSignature();
    }

    async function enqueueChannelEnrichment() {
        // Main channels
        if (Array.isArray(state.channels)) {
            for (const channel of state.channels) {
                queueChannelForEnrichment(channel, 'main');
            }
        }
        // Kids channels
        const kids = state.kids || {};
        if (Array.isArray(kids.blockedChannels)) {
            for (const channel of kids.blockedChannels) {
                queueChannelForEnrichment(channel, 'kids');
            }
        }
        processChannelEnrichmentQueue();
    }

    function maybeRefreshEnrichmentFromChannels() {
        const sig = computeChannelSignature();
        if (sig !== lastEnrichmentSignature) {
            lastEnrichmentSignature = sig;
            enqueueChannelEnrichment();
        }
    }

    function processChannelEnrichmentQueue() {
        if (isEnriching) return;
        if (channelEnrichmentQueue.length === 0) return;

        if (channelEnrichmentProcessedThisSession >= MAX_CHANNEL_ENRICHMENTS_PER_SESSION) {
            channelEnrichmentQueue.length = 0;
            return;
        }

        const task = channelEnrichmentQueue.shift();
        if (!task || !task.input) {
            setTimeout(processChannelEnrichmentQueue, 0);
            return;
        }

        isEnriching = true;

        const startedAt = Date.now();
        if (window.__filtertubeDebug) {
            console.log('FilterTube StateManager: channel enrichment start', {
                input: task.input,
                queueLength: channelEnrichmentQueue.length,
                startedAt
            });
        }

        chrome.runtime.sendMessage({
            type: 'addFilteredChannel',
            input: task.input,
            filterAll: false,
            collaborationWith: null,
            collaborationGroupId: null,
            displayHandle: task.handleDisplay,
            canonicalHandle: task.canonicalHandle,
            channelName: null,
            customUrl: task.customUrl,
            source: task.source || null,
            profile: task.profile || 'main'
        }, () => {
            channelEnrichmentProcessedThisSession++;
            // throttle to avoid hammering
            const durationMs = Date.now() - startedAt;
            const delayMs = 5000 + Math.floor(Math.random() * 2000); // 5-7s backoff to reduce request burstiness
            if (window.__filtertubeDebug) {
                console.log('FilterTube StateManager: channel enrichment complete', {
                    input: task.input,
                    durationMs,
                    nextDelayMs: delayMs,
                    remainingQueue: channelEnrichmentQueue.length
                });
            }
            setTimeout(() => {
                isEnriching = false;
                processChannelEnrichmentQueue();
            }, delayMs);
        });
    }

    // ============================================================================
    // KIDS PROFILE MANAGEMENT (Keywords + Channels)
    // ============================================================================

    async function addKidsKeyword(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        const trimmed = (word || '').trim();
        if (!trimmed) return false;

        const lower = trimmed.toLowerCase();
        const kids = getKidsState();
        const listKey = kids.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];
        if (list.some(entry => (entry.word || '').toLowerCase() === lower)) {
            return false;
        }

        const entry = {
            word: trimmed,
            exact: false,
            semantic: false,
            comments: false,
            source: 'user',
            addedAt: Date.now()
        };

        kids[listKey] = [entry, ...list];
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordAdded', { word: trimmed });
        
        // Trigger auto-backup after successful Kids keyword addition
        scheduleAutoBackup('kids_keyword_added');
        
        return true;
    }

    async function removeKidsKeyword(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }
        const kids = getKidsState();
        const listKey = kids.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];
        const before = list.length;
        kids[listKey] = list.filter(entry => (entry.word || '') !== word);
        if (kids[listKey].length === before) return false;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordRemoved', { word });
        
        // Trigger auto-backup after successful Kids keyword removal
        scheduleAutoBackup('kids_keyword_removed');
        
        return true;
    }

    /**
     * Toggle "comments" flag for a Kids keyword entry.
     * Mirrors main behavior, but persists inside ftProfilesV3.kids.blockedKeywords.
     */
    async function toggleKidsKeywordComments(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return null;
        }
        const kids = getKidsState();
        const listKey = kids.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];
        const index = list.findIndex(k => (k?.word || '') === word);
        if (index < 0) return null;

        const entry = list[index] && typeof list[index] === 'object'
            ? { ...list[index] }
            : null;
        if (!entry) return null;

        // Default is comments enabled (same as main)
        const current = entry.comments !== false;
        entry.comments = !current;
        list[index] = entry;
        kids[listKey] = list;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordUpdated', { word, comments: entry.comments !== false });
        
        // Trigger auto-backup after Kids keyword comments toggle
        scheduleAutoBackup('kids_keyword_comments_toggled');
        
        return entry.comments !== false;
    }

    /**
     * Toggle "exact" flag for a Kids keyword entry.
     * Mirrors main behavior, but persists inside ftProfilesV3.kids.blockedKeywords.
     */
    async function toggleKidsKeywordExact(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return null;
        }
        const kids = getKidsState();
        const listKey = kids.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];
        const index = list.findIndex(k => (k?.word || '') === word);
        if (index < 0) return null;

        const entry = list[index] && typeof list[index] === 'object'
            ? { ...list[index] }
            : null;
        if (!entry) return null;

        entry.exact = !entry.exact;
        list[index] = entry;
        kids[listKey] = list;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordUpdated', { word, exact: !!entry.exact });
        
        // Trigger auto-backup after Kids keyword exact toggle
        scheduleAutoBackup('kids_keyword_exact_toggled');
        
        return !!entry.exact;
    }

    function normalizeKidsChannelInput(input) {
        const raw = (input || '').trim();
        if (!raw) return null;
        const lower = raw.toLowerCase();
        const isUc = lower.startsWith('uc');
        const isHandle = lower.startsWith('@');
        const customUrl = lower.startsWith('c/') || lower.startsWith('/c/')
            ? raw.replace(/^\/?c\//i, 'c/')
            : (lower.startsWith('user/') || lower.startsWith('/user/')
                ? raw.replace(/^\/?user\//i, 'user/')
                : null);
        return {
            name: raw,
            // Keep id non-empty for legacy compilation paths, but treat @handles as handle-only during matching.
            id: isUc ? raw : (customUrl || raw),
            handle: isHandle ? raw : null,
            customUrl,
            originalInput: raw,
            addedAt: Date.now(),
            source: 'user'
        };
    }

    async function addKidsChannel(input) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return { success: false, error: 'Profile is locked' };
        }

        const kids = getKidsState();
        const rawValue = (input || '').trim();
        if (!rawValue) return { success: false, error: 'Empty input' };

        // Validate format - Allow @handle, UC ID, or YouTube URLs
        const lowerValue = rawValue.toLowerCase();
        const isHandle = rawValue.startsWith('@');
        const isUcId = lowerValue.startsWith('uc') || lowerValue.startsWith('channel/uc');
        const isUrl = rawValue.includes('youtube.com') || rawValue.includes('youtu.be');
        const isCustomUrl = lowerValue.startsWith('c/') || lowerValue.startsWith('/c/') ||
            lowerValue.startsWith('user/') || lowerValue.startsWith('/user/');

        if (!isHandle && !isUcId && !isUrl && !isCustomUrl) {
            return {
                success: false,
                error: 'Invalid format. Use @handle, Channel ID, legacy c/ChannelName'
            };
        }

        const channelMap = state.channelMap && typeof state.channelMap === 'object' ? state.channelMap : {};
        const listKey = kids.mode === 'whitelist' ? 'whitelistChannels' : 'blockedChannels';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];

        // Helper to normalize UC ID
        const normalizeUcId = (v) => {
            const fn = window.FilterTubeIdentity?.normalizeUcIdForComparison;
            if (typeof fn === 'function') return fn(v);
            return (v || '').trim().toLowerCase();
        };

        // Duplicate check via channelMap
        const keySource = rawValue.startsWith('@') ? rawValue : (window.FilterTubeIdentity?.isUcId?.(rawValue) ? rawValue : null);
        if (keySource) {
            const mappedId = channelMap[keySource.toLowerCase()];
            if (mappedId) {
                const normMappedId = normalizeUcId(mappedId);
                const alreadyExists = list.some(c =>
                    (c.id && normalizeUcId(c.id) === normMappedId)
                );
                if (alreadyExists) return { success: false, error: 'Channel already exists' };
            }
        }

        try {
            const action = kids.mode === 'whitelist' ? 'FilterTube_KidsWhitelistChannel' : 'FilterTube_KidsBlockChannel';
            const response = await chrome.runtime.sendMessage({
                action,
                channel: {
                    originalInput: rawValue,
                    source: 'user'
                }
            });

            if (response && response.success) {
                // Background handles persistence. We re-load settings to sync local state.
                await loadSettings();
                
                // Trigger auto-backup after successful Kids channel addition
                scheduleAutoBackup('kids_channel_added');
                
                return { success: true, channel: response.channel };
            } else {
                return { success: false, error: response?.error || 'Failed to add Kids channel' };
            }
        } catch (e) {
            console.error('FilterTube: addKidsChannel background call failed', e);
            return { success: false, error: 'Connection to background failed' };
        }
    }

    async function removeKidsChannel(index) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }
        const kids = getKidsState();
        const listKey = kids.mode === 'whitelist' ? 'whitelistChannels' : 'blockedChannels';
        const list = Array.isArray(kids[listKey]) ? kids[listKey] : [];
        if (index < 0 || index >= list.length) return false;
        const channel = list[index];
        list.splice(index, 1);
        kids[listKey] = list;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsChannelRemoved', { channel, index });
        
        // Trigger auto-backup after successful Kids channel removal
        scheduleAutoBackup('kids_channel_removed');
        
        return true;
    }

    /**
     * Toggle "Filter All Content" for a Kids channel.
     * This mirrors main behavior, but persists inside ftProfilesV3.kids.blockedChannels.
     */
    async function toggleKidsChannelFilterAll(index) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }
        const kids = getKidsState();
        if (kids.mode === 'whitelist') {
            return false;
        }
        if (index < 0 || index >= kids.blockedChannels.length) return false;

        const existing = kids.blockedChannels[index] && typeof kids.blockedChannels[index] === 'object'
            ? kids.blockedChannels[index]
            : null;
        if (!existing) return false;

        existing.filterAll = !existing.filterAll;
        kids.blockedChannels[index] = { ...existing };
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsChannelUpdated', {
            channel: kids.blockedChannels[index],
            index,
            filterAll: kids.blockedChannels[index].filterAll
        });
        
        // Trigger auto-backup after Kids Filter All toggle
        scheduleAutoBackup('kids_filter_all_toggled');
        
        return kids.blockedChannels[index].filterAll;
    }

    /**
     * Save current state to storage
     * @param {Object} options - Save options
     * @param {boolean} options.broadcast - Whether to broadcast to other contexts
     * @returns {Promise<Object>} Result of save operation
     */
    async function saveSettings({ broadcast = true, profile = 'main' } = {}) {
        if (isSaving) return;
        if (!SettingsAPI.saveSettings) {
            console.warn('StateManager: SettingsAPI.saveSettings not available');
            return;
        }

        isSaving = true;

        try {
            const result = await SettingsAPI.saveSettings({
                keywords: state.keywords,
                channels: state.channels,
                enabled: state.enabled,
                autoBackupEnabled: state.autoBackupEnabled,
                hideShorts: state.hideShorts,
                hideComments: state.hideComments,
                filterComments: state.filterComments,
                hideHomeFeed: state.hideHomeFeed,
                hideSponsoredCards: state.hideSponsoredCards,
                hideWatchPlaylistPanel: state.hideWatchPlaylistPanel,
                hidePlaylistCards: state.hidePlaylistCards,
                hideMembersOnly: state.hideMembersOnly,
                hideMixPlaylists: state.hideMixPlaylists,
                hideVideoSidebar: state.hideVideoSidebar,
                hideRecommended: state.hideRecommended,
                hideLiveChat: state.hideLiveChat,
                hideVideoInfo: state.hideVideoInfo,
                hideVideoButtonsBar: state.hideVideoButtonsBar,
                hideAskButton: state.hideAskButton,
                hideVideoChannelRow: state.hideVideoChannelRow,
                hideVideoDescription: state.hideVideoDescription,
                hideMerchTicketsOffers: state.hideMerchTicketsOffers,
                hideEndscreenVideowall: state.hideEndscreenVideowall,
                hideEndscreenCards: state.hideEndscreenCards,
                disableAutoplay: state.disableAutoplay,
                disableAnnotations: state.disableAnnotations,
                hideTopHeader: state.hideTopHeader,
                hideNotificationBell: state.hideNotificationBell,
                hideExploreTrending: state.hideExploreTrending,
                hideMoreFromYouTube: state.hideMoreFromYouTube,
                hideSubscriptions: state.hideSubscriptions,
                showQuickBlockButton: state.showQuickBlockButton,
                hideSearchShelves: state.hideSearchShelves,
                contentFilters: state.contentFilters,
                categoryFilters: state.categoryFilters
            });

            if (broadcast && result.compiledSettings) {
                broadcastSettings(result.compiledSettings, profile);
            }

            notifyListeners('save', state);
            return result;
        } finally {
            isSaving = false;
        }
    }

    /**
     * Ensure settings are loaded before operations
     */
    async function ensureLoaded() {
        if (!state.isLoaded) {
            await loadSettings();
        }
    }

    async function persistMainProfiles(nextMain) {
        const io = window.FilterTubeIO || {};
        const canV3 = !!(io && typeof io.saveProfilesV3 === 'function' && typeof io.loadProfilesV3 === 'function');
        const canV4 = !!(io && typeof io.saveProfilesV4 === 'function' && typeof io.loadProfilesV4 === 'function');
        if (!canV3 && !canV4) {
            console.warn('StateManager: FilterTubeIO not available for main persistence');
            return;
        }

        try {
            if (canV3) {
                const existing = await io.loadProfilesV3();
                const merged = {
                    ...existing,
                    main: {
                        ...existing?.main,
                        ...nextMain,
                        mode: (typeof nextMain?.mode === 'string') ? nextMain.mode : existing?.main?.mode,
                        whitelistedChannels: Array.isArray(nextMain?.whitelistChannels)
                            ? nextMain.whitelistChannels
                            : (Array.isArray(existing?.main?.whitelistedChannels) ? existing.main.whitelistedChannels : []),
                        whitelistedKeywords: Array.isArray(nextMain?.whitelistKeywords)
                            ? nextMain.whitelistKeywords
                            : (Array.isArray(existing?.main?.whitelistedKeywords) ? existing.main.whitelistedKeywords : []),
                        // Also persist blocklist channels/keywords
                        channels: Array.isArray(nextMain?.channels)
                            ? nextMain.channels
                            : (Array.isArray(existing?.main?.channels) ? existing.main.channels : []),
                        keywords: Array.isArray(nextMain?.keywords)
                            ? nextMain.keywords
                            : (Array.isArray(existing?.main?.keywords) ? existing.main.keywords : [])
                    }
                };
                await io.saveProfilesV3(merged);
            }
        } catch (e) {
            console.warn('StateManager: Failed to persist main profiles (v3)', e);
        }

        try {
            if (canV4) {
                const existing = await io.loadProfilesV4();
                const profiles = (existing && typeof existing === 'object' && !Array.isArray(existing) && existing.profiles && typeof existing.profiles === 'object' && !Array.isArray(existing.profiles))
                    ? existing.profiles
                    : {};
                const activeId = typeof existing?.activeProfileId === 'string' ? existing.activeProfileId : 'default';
                const activeProfile = profiles[activeId] && typeof profiles[activeId] === 'object' ? profiles[activeId] : {};

                profiles[activeId] = {
                    ...activeProfile,
                    main: {
                        ...(activeProfile.main || {}),
                        ...nextMain,
                        mode: (typeof nextMain?.mode === 'string') ? nextMain.mode : (activeProfile.main || {}).mode
                    }
                };

                const nextProfiles = {
                    ...existing,
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles
                };

                await io.saveProfilesV4(nextProfiles);
            }
        } catch (e) {
            console.warn('StateManager: Failed to persist main profiles (v4)', e);
        }
    }

    async function persistKidsProfiles(nextKids) {
        const io = window.FilterTubeIO || {};
        const canV3 = !!(io && typeof io.saveProfilesV3 === 'function' && typeof io.loadProfilesV3 === 'function');
        const canV4 = !!(io && typeof io.saveProfilesV4 === 'function' && typeof io.loadProfilesV4 === 'function');
        if (!canV3 && !canV4) {
            console.warn('StateManager: FilterTubeIO not available for kids persistence');
            return;
        }

        try {
            if (canV3) {
                const existing = await io.loadProfilesV3();
                const merged = {
                    ...existing,
                    kids: {
                        ...existing?.kids,
                        ...nextKids,
                        mode: (typeof nextKids?.mode === 'string') ? nextKids.mode : existing?.kids?.mode
                    }
                };
                await io.saveProfilesV3(merged);
            }
        } catch (e) {
            console.warn('StateManager: Failed to persist kids profiles', e);
        }

        try {
            if (canV4) {
                const existing = await io.loadProfilesV4();
                const profiles = (existing && typeof existing === 'object' && !Array.isArray(existing) && existing.profiles && typeof existing.profiles === 'object' && !Array.isArray(existing.profiles))
                    ? existing.profiles
                    : {};
                const activeId = typeof existing?.activeProfileId === 'string' ? existing.activeProfileId : 'default';
                const activeProfile = profiles[activeId] && typeof profiles[activeId] === 'object' ? profiles[activeId] : {};

                profiles[activeId] = {
                    ...activeProfile,
                    kids: {
                        ...(activeProfile.kids || {}),
                        ...nextKids,
                        mode: (typeof nextKids?.mode === 'string') ? nextKids.mode : (activeProfile.kids || {}).mode
                    }
                };

                const nextProfiles = {
                    ...existing,
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles
                };

                await io.saveProfilesV4(nextProfiles);
            }
        } catch (e) {
            console.warn('StateManager: Failed to persist kids profiles', e);
        }
    }

    /**
     * Broadcast settings to content scripts
     */
    function broadcastSettings(compiledSettings, profile = 'main') {
        try {
            chrome.runtime?.sendMessage({
                action: 'FilterTube_ApplySettings',
                settings: compiledSettings,
                profile: profile
            });
        } catch (e) {
        }
    }

    /**
     * Explicitly request background to re-compile and broadcast settings for a given profile.
     * Used for Kids profile actions where we don't compile locally in StateManager.
     */
    async function requestRefresh(profile = 'main') {
        return new Promise((resolve) => {
            chrome.runtime?.sendMessage({
                action: 'getCompiledSettings',
                profileType: profile,
                forceRefresh: true
            }, (compiled) => {
                if (compiled && !compiled.error) {
                    broadcastSettings(compiled, profile);
                }
                resolve(compiled);
            });
        });
    }

    // ============================================================================
    // KEYWORD MANAGEMENT
    // ============================================================================

    /**
     * Add a keyword to the filter list
     * @param {string} word - Keyword to add
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} Success status
     */
    async function addKeyword(word, options = {}) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            const trimmed = (word || '').trim();
            if (!trimmed) return false;
            const lowerWord = trimmed.toLowerCase();
            const exact = options.exact === true;
            const list = Array.isArray(state.userWhitelistKeywords) ? state.userWhitelistKeywords : [];
            if (list.some(entry => (entry?.word || '').toLowerCase() === lowerWord && (entry?.exact === true) === exact)) {
                return false;
            }

            const entry = {
                word: trimmed,
                exact,
                semantic: options.semantic === true,
                source: 'user',
                channelRef: null,
                comments: Object.prototype.hasOwnProperty.call(options, 'comments') ? !!options.comments : true,
                addedAt: Date.now()
            };

            state.userWhitelistKeywords = [entry, ...list];
            state.whitelistKeywords = [...state.userWhitelistKeywords];
            await persistMainProfiles({
                mode: 'whitelist',
                whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],
                whitelistKeywords: state.whitelistKeywords
            });
            await requestRefresh('main');
            notifyListeners('keywordAdded', { word: trimmed });
            scheduleAutoBackup('keyword_added');
            return true;
        }

        const trimmed = word.trim();
        if (!trimmed) return false;

        const lowerWord = trimmed.toLowerCase();
        if (state.userKeywords.some(entry => entry.word.toLowerCase() === lowerWord)) {
            return false; // Duplicate
        }

        state.userKeywords.unshift({
            word: trimmed,
            exact: options.exact || false,
            semantic: options.semantic || false,
            source: 'user',
            channelRef: null,
            comments: Object.prototype.hasOwnProperty.call(options, 'comments') ? !!options.comments : true,
            addedAt: Date.now() // Timestamp for proper ordering
        });

        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordAdded', { word: trimmed });
        
        // Trigger auto-backup after successful keyword addition
        scheduleAutoBackup('keyword_added');
        
        return true;
    }

    /**
     * Toggle whether a keyword should apply to comment filtering
     * @param {string} word - Keyword to toggle
     * @returns {Promise<boolean>} New comments state
     */
    async function toggleKeywordComments(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            const list = Array.isArray(state.userWhitelistKeywords) ? state.userWhitelistKeywords : [];
            const index = list.findIndex(k => (k?.word || '') === word);
            if (index === -1) return false;

            const current = list[index];
            const nextValue = (typeof current.comments === 'boolean') ? !current.comments : false;
            list[index] = { ...current, comments: nextValue };
            state.userWhitelistKeywords = [...list];
            state.whitelistKeywords = [...state.userWhitelistKeywords];

            await persistMainProfiles({
                mode: 'whitelist',
                whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],
                whitelistKeywords: state.whitelistKeywords
            });
            await requestRefresh('main');
            notifyListeners('keywordUpdated', { word, comments: nextValue });
            scheduleAutoBackup('keyword_comments_toggled');
            return nextValue;
        }

        let index = state.userKeywords.findIndex(k => k.word === word);
        if (index === -1) {
            return false;
        }

        const current = state.userKeywords[index];
        const nextValue = (typeof current.comments === 'boolean') ? !current.comments : false;
        state.userKeywords[index].comments = nextValue;

        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordUpdated', { word, comments: nextValue });
        
        // Trigger auto-backup after keyword comments toggle
        scheduleAutoBackup('keyword_comments_toggled');
        
        return nextValue;
    }

    /**
     * Remove a keyword from the filter list
     * @param {string} word - Keyword to remove
     * @returns {Promise<boolean>} Success status
     */
    async function removeKeyword(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            const list = Array.isArray(state.userWhitelistKeywords) ? state.userWhitelistKeywords : [];
            const index = list.findIndex(k => (k?.word || '') === word && k?.source !== 'channel');
            if (index === -1) return false;
            list.splice(index, 1);
            state.userWhitelistKeywords = [...list];
            state.whitelistKeywords = [...state.userWhitelistKeywords];
            await persistMainProfiles({
                mode: 'whitelist',
                whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],
                whitelistKeywords: state.whitelistKeywords
            });
            await requestRefresh('main');
            notifyListeners('keywordRemoved', { word });
            scheduleAutoBackup('keyword_removed');
            return true;
        }

        const index = state.userKeywords.findIndex(k => k.word === word && k.source !== 'channel');
        if (index === -1) return false;

        state.userKeywords.splice(index, 1);
        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordRemoved', { word });
        
        // Trigger auto-backup after successful keyword removal
        scheduleAutoBackup('keyword_removed');
        
        return true;
    }

    /**
     * Toggle exact match for a keyword
     * @param {string} word - Keyword to toggle
     * @returns {Promise<boolean>} New exact state
     */
    async function toggleKeywordExact(word) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            const list = Array.isArray(state.userWhitelistKeywords) ? state.userWhitelistKeywords : [];
            const index = list.findIndex(k => (k?.word || '') === word && k?.source !== 'channel');
            if (index === -1) return false;
            const next = { ...list[index], exact: !list[index].exact };
            list[index] = next;
            state.userWhitelistKeywords = [...list];
            state.whitelistKeywords = [...state.userWhitelistKeywords];
            await persistMainProfiles({
                mode: 'whitelist',
                whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],
                whitelistKeywords: state.whitelistKeywords
            });
            await requestRefresh('main');
            notifyListeners('keywordUpdated', { word, exact: !!next.exact });
            scheduleAutoBackup('keyword_exact_toggled');
            return !!next.exact;
        }

        const index = state.userKeywords.findIndex(k => k.word === word && k.source !== 'channel');
        if (index === -1) return false;

        state.userKeywords[index].exact = !state.userKeywords[index].exact;
        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordUpdated', { word, exact: state.userKeywords[index].exact });
        
        // Trigger auto-backup after keyword exact toggle
        scheduleAutoBackup('keyword_exact_toggled');
        
        return state.userKeywords[index].exact;
    }

    /**
     * Recompute all keywords including channel-derived ones
     */
    function recomputeKeywords() {
        if (!SettingsAPI.syncFilterAllKeywords) {
            state.keywords = state.userKeywords;
            return;
        }
        let channelsForKeywords = state.channels;
        if (state.syncKidsToMain) {
            const kidsBlocked = Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : [];
            const kidsWhitelist = Array.isArray(state.kids?.whitelistChannels) ? state.kids.whitelistChannels : [];
            channelsForKeywords = [...(Array.isArray(state.channels) ? state.channels : []), ...kidsBlocked, ...kidsWhitelist];
        }

        state.keywords = SettingsAPI.syncFilterAllKeywords(state.userKeywords, channelsForKeywords);
    }

    // ============================================================================
    // CHANNEL MANAGEMENT
    // ============================================================================

    /**
     * Add a channel to the filter list (Delegates to Background for persistence)
     * @param {string} input - Channel identifier (@handle or UC ID)
     * @returns {Promise<Object>} Result with success status and channel data
     */
    async function addChannel(input) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return { success: false, error: 'Profile is locked' };
        }

        const rawValue = (input || '').trim();
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        // Validate format - Allow @handle, UC ID, or YouTube URLs
        const lowerValue = rawValue.toLowerCase();
        const isHandle = rawValue.startsWith('@');
        const isUcId = lowerValue.startsWith('uc') || lowerValue.startsWith('channel/uc');
        const isUrl = rawValue.includes('youtube.com') || rawValue.includes('youtu.be');
        const isCustomUrl = lowerValue.startsWith('c/') || lowerValue.startsWith('/c/') ||
            lowerValue.startsWith('user/') || lowerValue.startsWith('/user/');

        if (!isHandle && !isUcId && !isUrl && !isCustomUrl) {
            return {
                success: false,
                error: 'Invalid format. Use @handle, Channel ID, legacy c/ChannelName, or YouTube URL'
            };
        }

        // DELEGATE TO BACKGROUND SCRIPT
        // This ensures the fetch+save completes even if the popup is closed immediately
        try {
            const action = state.mode === 'whitelist' ? 'addWhitelistChannelPersistent' : 'addChannelPersistent';
            const response = await chrome.runtime.sendMessage({
                action,
                input: rawValue
            });

            if (response && response.success) {
                if (state.mode === 'whitelist') {
                    const whitelistChannels = Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [];
                    const incoming = response.channel;
                    const alreadyExists = whitelistChannels.some(ch => ch?.id && incoming?.id && ch.id === incoming.id);

                    if (!alreadyExists) {
                        state.whitelistChannels = [incoming, ...whitelistChannels];
                        notifyListeners('channelAdded', { channel: incoming });
                    }

                    await requestRefresh('main');
                    return { success: true, channel: incoming };
                }

                // FIX: Check if channel was already added via storage sync mechanism
                // to prevent duplicate entries (Race Condition Fix)
                const alreadyExists = state.channels.some(ch => ch.id === response.channel.id);

                if (!alreadyExists) {
                    state.channels.unshift(response.channel);
                    recomputeKeywords();
                    queueChannelForEnrichment(response.channel);
                    processChannelEnrichmentQueue();
                    notifyListeners('channelAdded', { channel: response.channel });
                }

                return { success: true, channel: response.channel };
            } else {
                return { success: false, error: response?.error || 'Unknown error' };
            }
        } catch (error) {
            console.error('StateManager: Background delegation failed', error);
            return { success: false, error: 'Connection to background failed' };
        }
    }

    /**
     * Remove a channel from the filter list
     * @param {number} index - Index of channel to remove
     * @returns {Promise<boolean>} Success status
     */
    async function removeChannel(index) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            const list = Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [];
            if (index < 0 || index >= list.length) return false;
            const channel = list[index];
            list.splice(index, 1);
            state.whitelistChannels = [...list];
            await persistMainProfiles({
                mode: 'whitelist',
                whitelistChannels: state.whitelistChannels,
                whitelistKeywords: Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : []
            });
            await requestRefresh('main');
            notifyListeners('channelRemoved', { channel, index });
            scheduleAutoBackup('channel_removed');
            return true;
        }

        if (index < 0 || index >= state.channels.length) return false;

        const channel = state.channels[index];
        state.channels.splice(index, 1);
        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelRemoved', { channel, index });
        
        // Trigger auto-backup after successful channel removal
        scheduleAutoBackup('channel_removed');
        
        return true;
    }

    /**
     * Toggle "Filter All Content" for a channel
     * @param {number} index - Index of channel
     * @returns {Promise<boolean>} New filterAll state
     */
    async function toggleChannelFilterAll(index) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            return false;
        }

        if (index < 0 || index >= state.channels.length) return false;

        state.channels[index].filterAll = !state.channels[index].filterAll;
        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelUpdated', {
            channel: state.channels[index],
            index,
            filterAll: state.channels[index].filterAll
        });
        
        // Trigger auto-backup after Filter All toggle
        scheduleAutoBackup('filter_all_toggled');
        
        return state.channels[index].filterAll;
    }

    /**
     * Toggle whether a channel-derived keyword should apply to comment filtering.
     * This persists on the channel entry itself (filterAllComments).
     */
    async function toggleChannelFilterAllCommentsByRef(channelRef) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return false;
        }

        if (state.mode === 'whitelist') {
            return false;
        }

        if (!channelRef) return false;
        const Settings = SettingsAPI || {};
        const getKey = Settings.getChannelDerivedKey;

        const index = state.channels.findIndex(ch => {
            if (!ch) return false;
            if (typeof getKey === 'function') {
                return getKey(ch) === channelRef;
            }
            const fallbackKey = (ch.id || ch.handle || ch.originalInput || ch.name || '').toLowerCase();
            return fallbackKey === channelRef;
        });

        if (index === -1) return false;

        const current = state.channels[index];
        const currentValue = (typeof current.filterAllComments === 'boolean') ? current.filterAllComments : true;
        current.filterAllComments = !currentValue;

        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelUpdated', {
            channel: current,
            index,
            filterAllComments: current.filterAllComments
        });
        
        // Trigger auto-backup after comment filter toggle
        scheduleAutoBackup('comment_filter_toggled');
        
        return current.filterAllComments;
    }

    /**
     * Check if a channel already exists
     * @param {string} input - Channel identifier
     * @returns {boolean} True if duplicate
     */
    function isDuplicateChannel(input) {
        const normalized = input.toLowerCase();

        return state.channels.some(ch => {
            const id = (ch.id || '').toLowerCase();
            const handle = (ch.handle || '').toLowerCase();
            const name = (ch.name || '').toLowerCase();
            const original = (ch.originalInput || '').toLowerCase();

            return id === normalized ||
                handle === normalized ||
                name === normalized ||
                original === normalized ||
                (normalized.startsWith('@') && handle === normalized.substring(1));
        });
    }

    /**
     * Persist channel ID -> handle mapping
     */
    async function persistChannelMap(channelId, channelHandle) {
        if (!channelId || !channelHandle) return;

        const key = channelId.toLowerCase();
        const value = channelHandle.toLowerCase();

        state.channelMap[key] = value;

        try {
            await chrome.storage?.local.set({ channelMap: state.channelMap });
        } catch (error) {
            console.warn('StateManager: Error persisting channel map', error);
        }
    }

    // ============================================================================
    // CHECKBOX SETTINGS
    // ============================================================================

    /**
     * Update a checkbox/toggle setting
     * @param {string} key - Setting key (hideShorts, hideComments, filterComments)
     * @param {boolean} value - New value
     * @returns {Promise<void>}
     */
    async function updateSetting(key, value) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return;
        }

        const validKeys = [
            'enabled',
            'autoBackupEnabled',
            'syncKidsToMain',
            'hideShorts',
            'hideComments',
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
            'showQuickBlockButton',
            'hideSearchShelves'
        ];

        if (!validKeys.includes(key)) {
            console.warn(`StateManager: Invalid setting key: ${key}`);
            return;
        }

        state[key] = !!value;

        if (key === 'syncKidsToMain') {
            try {
                const io = window.FilterTubeIO || {};
                if (typeof io.loadProfilesV4 === 'function' && typeof io.saveProfilesV4 === 'function') {
                    const profilesV4 = await io.loadProfilesV4();
                    const activeId = (typeof profilesV4?.activeProfileId === 'string' && profilesV4.activeProfileId.trim())
                        ? profilesV4.activeProfileId.trim()
                        : 'default';
                    const profiles = (profilesV4?.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles))
                        ? { ...profilesV4.profiles }
                        : {};
                    const activeProfile = (profiles[activeId] && typeof profiles[activeId] === 'object') ? profiles[activeId] : {};
                    const settings = (activeProfile.settings && typeof activeProfile.settings === 'object' && !Array.isArray(activeProfile.settings))
                        ? activeProfile.settings
                        : {};

                    profiles[activeId] = {
                        ...activeProfile,
                        settings: {
                            ...settings,
                            syncKidsToMain: !!state.syncKidsToMain
                        }
                    };

                    await io.saveProfilesV4({
                        ...profilesV4,
                        schemaVersion: 4,
                        activeProfileId: activeId,
                        profiles
                    });
                }

                if (typeof io.loadProfilesV3 === 'function' && typeof io.saveProfilesV3 === 'function') {
                    const profilesV3 = await io.loadProfilesV3();
                    if (profilesV3 && typeof profilesV3 === 'object') {
                        profilesV3.main = profilesV3.main && typeof profilesV3.main === 'object' ? profilesV3.main : {};
                        profilesV3.main.applyKidsRulesOnMain = !!state.syncKidsToMain;
                        await io.saveProfilesV3(profilesV3);
                    }
                }
            } catch (e) {
                console.warn('StateManager: failed to persist syncKidsToMain', e);
            }

            try {
                await requestRefresh('main');
            } catch (e) {
            }

            notifyListeners('settingUpdated', { key, value: state[key] });
            scheduleAutoBackup('setting_updated');
            return;
        }

        // Handle hideComments and filterComments mutual exclusivity
        if (key === 'hideComments' && value === true) {
            state.filterComments = false;
        }

        await saveSettings();
        notifyListeners('settingUpdated', { key, value: state[key] });

        if (key !== 'autoBackupEnabled' || state.autoBackupEnabled === true) {
            scheduleAutoBackup('setting_updated');
        }
    }

    /**
     * Update content filter settings (duration, uploadDate)
     * @param {Object} nextContentFilters - Partial contentFilters object to merge
     * @returns {Promise<void>}
     */
    async function updateContentFilters(nextContentFilters) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return;
        }

        if (!nextContentFilters || typeof nextContentFilters !== 'object') return;

        state.contentFilters = {
            duration: { ...state.contentFilters.duration, ...(nextContentFilters.duration || {}) },
            uploadDate: { ...state.contentFilters.uploadDate, ...(nextContentFilters.uploadDate || {}) },
            uppercase: { ...state.contentFilters.uppercase, ...(nextContentFilters.uppercase || {}) }
        };

        await saveSettings();
        await requestRefresh('main');
        notifyListeners('contentFiltersUpdated', { contentFilters: state.contentFilters });
        scheduleAutoBackup('content_filters_updated');
    }

    async function updateKidsContentFilters(nextContentFilters) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return;
        }

        if (!nextContentFilters || typeof nextContentFilters !== 'object') return;

        const kids = getKidsState();
        const current = (kids.contentFilters && typeof kids.contentFilters === 'object') ? kids.contentFilters : {};
        kids.contentFilters = {
            duration: { ...(current.duration || {}), ...(nextContentFilters.duration || {}) },
            uploadDate: { ...(current.uploadDate || {}), ...(nextContentFilters.uploadDate || {}) },
            uppercase: { ...(current.uppercase || {}), ...(nextContentFilters.uppercase || {}) }
        };
        state.kids = { ...kids };

        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsContentFiltersUpdated', { contentFilters: kids.contentFilters });
        scheduleAutoBackup('kids_content_filters_updated');
    }

    async function updateCategoryFilters(nextCategoryFilters) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return;
        }

        if (!nextCategoryFilters || typeof nextCategoryFilters !== 'object') return;

        const current = state.categoryFilters && typeof state.categoryFilters === 'object' ? state.categoryFilters : {};
        const next = {
            enabled: nextCategoryFilters.enabled === true,
            mode: Object.prototype.hasOwnProperty.call(nextCategoryFilters, 'mode')
                ? (nextCategoryFilters.mode === 'allow' ? 'allow' : 'block')
                : (current.mode === 'allow' ? 'allow' : 'block'),
            selected: Object.prototype.hasOwnProperty.call(nextCategoryFilters, 'selected')
                ? (Array.isArray(nextCategoryFilters.selected) ? [...nextCategoryFilters.selected] : [])
                : (Array.isArray(current.selected) ? [...current.selected] : [])
        };
        state.categoryFilters = next;

        await saveSettings();
        await requestRefresh('main');
        notifyListeners('categoryFiltersUpdated', { categoryFilters: state.categoryFilters });
        scheduleAutoBackup('category_filters_updated');
    }

    async function updateKidsCategoryFilters(nextCategoryFilters) {
        await ensureLoaded();

        if (isUiLocked()) {
            await loadSettings();
            return;
        }

        if (!nextCategoryFilters || typeof nextCategoryFilters !== 'object') return;

        const kids = getKidsState();
        const current = kids.categoryFilters && typeof kids.categoryFilters === 'object' ? kids.categoryFilters : {};
        kids.categoryFilters = {
            enabled: nextCategoryFilters.enabled === true,
            mode: Object.prototype.hasOwnProperty.call(nextCategoryFilters, 'mode')
                ? (nextCategoryFilters.mode === 'allow' ? 'allow' : 'block')
                : (current.mode === 'allow' ? 'allow' : 'block'),
            selected: Object.prototype.hasOwnProperty.call(nextCategoryFilters, 'selected')
                ? (Array.isArray(nextCategoryFilters.selected) ? [...nextCategoryFilters.selected] : [])
                : (Array.isArray(current.selected) ? [...current.selected] : [])
        };
        state.kids = { ...kids };

        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsCategoryFiltersUpdated', { categoryFilters: kids.categoryFilters });
        scheduleAutoBackup('kids_category_filters_updated');
    }

    // ============================================================================
    // THEME MANAGEMENT
    // ============================================================================

    /**
     * Toggle theme between light and dark
     * @returns {Promise<string>} New theme
     */
    async function toggleTheme() {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        await setTheme(newTheme);
        return newTheme;
    }

    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     * @returns {Promise<string>} Applied theme
     */
    async function setTheme(theme) {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        state.theme = normalized;

        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(normalized);
        }

        if (SettingsAPI.setThemePreference) {
            await SettingsAPI.setThemePreference(normalized);
        }

        notifyListeners('themeChanged', { theme: normalized });
        return normalized;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function(eventType, data)
     * @returns {Function} Unsubscribe function
     */
    function subscribe(callback) {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    }

    /**
     * Notify all listeners of a state change
     */
    function notifyListeners(eventType, data) {
        listeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('StateManager: Listener error', error);
            }
        });
    }

    // ============================================================================
    // STORAGE SYNC
    // ============================================================================

    /**
     * Handle storage changes from other contexts
     */
    function setupStorageListener() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            let externalReloadTimer = 0;
            let externalReloadInFlight = false;
            let externalReloadPending = false;

            const runExternalReload = async () => {
                if (externalReloadInFlight) {
                    externalReloadPending = true;
                    return;
                }
                const beforeSig = computeChannelSignature();
                externalReloadInFlight = true;
                try {
                    // External reload should not trigger a full UI rerender via the 'load' event
                    // and must not reset/schedule enrichment (it can cascade storage writes).
                    await loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
                } catch (e) {
                } finally {
                    externalReloadInFlight = false;
                }

                const afterSig = computeChannelSignature();
                if (afterSig !== beforeSig) {
                    notifyListeners('load', state);
                } else {
                    notifyListeners('externalUpdate', state);
                }

                if (externalReloadPending) {
                    externalReloadPending = false;
                    setTimeout(runExternalReload, 0);
                }
            };

            const scheduleExternalReload = () => {
                if (externalReloadTimer) return;
                externalReloadTimer = setTimeout(() => {
                    externalReloadTimer = 0;
                    runExternalReload();
                }, 150);
            };

            chrome.storage.onChanged.addListener(async (changes, area) => {
                if (area !== 'local' || isSaving) return;

                const changedKeys = Object.keys(changes || {});
                if (changedKeys.length === 1 && changedKeys[0] === 'channelMap') {
                    return;
                }

                // Check for theme changes
                if (changes.ftThemePreference) {
                    const newTheme = changes.ftThemePreference.newValue || 'light';
                    if (state.theme !== newTheme) {
                        state.theme = newTheme;
                        if (SettingsAPI.applyThemePreference) {
                            SettingsAPI.applyThemePreference(newTheme);
                        }
                        notifyListeners('themeChanged', { theme: newTheme });
                    }
                }

                // Check for settings changes using actual storage keys
                const storageKeys = [
                    'enabled',
                    'uiKeywords',
                    'filterKeywords',
                    'filterKeywordsComments',
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
                    'showQuickBlockButton',
                    'hideSearchShelves',
                    'stats',
                    'channelMap',
                    'ftProfilesV3',
                    'ftProfilesV4'
                ];
                const hasSettingsChange = storageKeys.some(key => changes[key]);

                if (hasSettingsChange) {
                    if (window.__filtertubeDebug) {
                        console.log('StateManager: Detected external settings change, reloading...');
                    }

                    scheduleExternalReload();
                }
            });
        }
    }

    // Initialize listener
    setupStorageListener();

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        // State access
        getState: () => ({ ...state }),
        isLoaded: () => state.isLoaded,

        // Settings
        loadSettings,
        saveSettings,
        ensureLoaded,
        getKidsState,

        // Keywords
        addKeyword,
        removeKeyword,
        toggleKeywordExact,
        toggleKeywordComments,
        addKidsKeyword,
        removeKidsKeyword,
        toggleKidsKeywordExact,
        toggleKidsKeywordComments,

        // Channels
        addChannel,
        removeChannel,
        toggleChannelFilterAll,
        toggleChannelFilterAllCommentsByRef,
        addKidsChannel,
        removeKidsChannel,
        toggleKidsChannelFilterAll,

        // Settings
        updateSetting,
        updateContentFilters,
        updateKidsContentFilters,
        updateCategoryFilters,
        updateKidsCategoryFilters,

        // Theme
        toggleTheme,
        setTheme,

        // Events
        subscribe
    };
})();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    globalThis.StateManager = StateManager;
}
