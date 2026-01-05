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

    // ============================================================================
    // STATE
    // ============================================================================

    let state = {
        enabled: true,
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
        hideSearchShelves: false,
        stats: { hiddenCount: 0, savedMinutes: 0 },
        channelMap: {},
        theme: 'light',
        isLoaded: false,
        kids: {
            blockedKeywords: [],
            blockedChannels: [],
            whitelistedChannels: [],
            whitelistedKeywords: [],
            mode: 'whitelist',
            strictMode: true,
            videoIds: [],
            subscriptions: []
        }
    };

    const channelEnrichmentAttempted = new Set();
    const channelEnrichmentQueue = [];
    let isEnriching = false;
    let lastEnrichmentSignature = '';

    let isSaving = false;
    let listeners = [];

    // ============================================================================
    // SETTINGS MANAGEMENT
    // ============================================================================

    /**
     * Load settings from storage and populate state
     * @returns {Promise<Object>} Loaded state
     */
    async function loadSettings() {
        if (!SettingsAPI.loadSettings) {
            console.warn('StateManager: SettingsAPI.loadSettings not available');
            return state;
        }

        const data = await SettingsAPI.loadSettings();
        const io = window.FilterTubeIO || {};
        let profilesV3 = null;
        if (io && typeof io.loadProfilesV3 === 'function') {
            try {
                profilesV3 = await io.loadProfilesV3();
            } catch (e) {
                console.warn('StateManager: loadProfilesV3 failed', e);
            }
        }

        state.enabled = data.enabled !== false;
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
        state.hideSearchShelves = data.hideSearchShelves || false;
        state.stats = data.stats || { hiddenCount: 0, savedMinutes: 0 };
        state.channelMap = data.channelMap || {};
        state.theme = data.theme || 'light';
        if (profilesV3 && profilesV3.kids) {
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
                whitelistedChannels: profilesV3.kids.whitelistedChannels || [],
                whitelistedKeywords: profilesV3.kids.whitelistedKeywords || [],
                mode: profilesV3.kids.mode || 'whitelist',
                strictMode: profilesV3.kids.strictMode !== false,
                videoIds: profilesV3.kids.videoIds || [],
                subscriptions: profilesV3.kids.subscriptions || []
            };
        }
        // Reset enrichment state so re-imports can re-run enrichment
        resetEnrichmentState();
        lastEnrichmentSignature = computeChannelSignature();
        state.isLoaded = true;

        notifyListeners('load', state);
        // Kick off async channel name enrichment after initial load
        scheduleChannelNameEnrichment();
        return state;
    }

    function scheduleChannelNameEnrichment() {
        try {
            setTimeout(() => {
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
                whitelistedChannels: [],
                whitelistedKeywords: [],
                mode: 'whitelist',
                strictMode: true,
                videoIds: [],
                subscriptions: []
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
        const hasLookup = !!(id || handle || customUrl);
        if (!hasLookup) return false;
        if (!name) return true;
        if (id && name === id) return true;
        if (isHandleLike(name)) return true;
        if (!channel.handle || !channel.logo) return true;
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
        resetEnrichmentState();
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
            triggerChannelEnrichmentRefresh();
        }
    }

    function processChannelEnrichmentQueue() {
        if (isEnriching) return;
        if (channelEnrichmentQueue.length === 0) return;

        const task = channelEnrichmentQueue.shift();
        if (!task || !task.input) {
            setTimeout(processChannelEnrichmentQueue, 0);
            return;
        }

        isEnriching = true;

        const startedAt = Date.now();
        console.log('FilterTube StateManager: channel enrichment start', {
            input: task.input,
            queueLength: channelEnrichmentQueue.length,
            startedAt
        });

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
            // throttle to avoid hammering
            const durationMs = Date.now() - startedAt;
            const delayMs = 5000 + Math.floor(Math.random() * 2000); // 5-7s backoff to reduce request burstiness
            console.log('FilterTube StateManager: channel enrichment complete', {
                input: task.input,
                durationMs,
                nextDelayMs: delayMs,
                remainingQueue: channelEnrichmentQueue.length
            });
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

        const trimmed = (word || '').trim();
        if (!trimmed) return false;

        const lower = trimmed.toLowerCase();
        const kids = getKidsState();
        if (kids.blockedKeywords.some(entry => (entry.word || '').toLowerCase() === lower)) {
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

        kids.blockedKeywords = [entry, ...kids.blockedKeywords];
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordAdded', { word: trimmed });
        return true;
    }

    async function removeKidsKeyword(word) {
        await ensureLoaded();
        const kids = getKidsState();
        const before = kids.blockedKeywords.length;
        kids.blockedKeywords = kids.blockedKeywords.filter(entry => (entry.word || '') !== word);
        if (kids.blockedKeywords.length === before) return false;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordRemoved', { word });
        return true;
    }

    /**
     * Toggle "comments" flag for a Kids keyword entry.
     * Mirrors main behavior, but persists inside ftProfilesV3.kids.blockedKeywords.
     */
    async function toggleKidsKeywordComments(word) {
        await ensureLoaded();
        const kids = getKidsState();
        const index = kids.blockedKeywords.findIndex(k => (k?.word || '') === word);
        if (index < 0) return null;

        const entry = kids.blockedKeywords[index] && typeof kids.blockedKeywords[index] === 'object'
            ? { ...kids.blockedKeywords[index] }
            : null;
        if (!entry) return null;

        // Default is comments enabled (same as main)
        const current = entry.comments !== false;
        entry.comments = !current;
        kids.blockedKeywords[index] = entry;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordUpdated', { word, comments: entry.comments !== false });
        return entry.comments !== false;
    }

    /**
     * Toggle "exact" flag for a Kids keyword entry.
     * Mirrors main behavior, but persists inside ftProfilesV3.kids.blockedKeywords.
     */
    async function toggleKidsKeywordExact(word) {
        await ensureLoaded();
        const kids = getKidsState();
        const index = kids.blockedKeywords.findIndex(k => (k?.word || '') === word);
        if (index < 0) return null;

        const entry = kids.blockedKeywords[index] && typeof kids.blockedKeywords[index] === 'object'
            ? { ...kids.blockedKeywords[index] }
            : null;
        if (!entry) return null;

        entry.exact = !entry.exact;
        kids.blockedKeywords[index] = entry;
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsKeywordUpdated', { word, exact: !!entry.exact });
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

        const kids = getKidsState();

        const channelMap = state.channelMap && typeof state.channelMap === 'object' ? state.channelMap : {};

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
                const alreadyExists = kids.blockedChannels.some(c =>
                    (c.id && normalizeUcId(c.id) === normMappedId)
                );
                if (alreadyExists) return { success: false, error: 'Channel already exists' };
            }
        }

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'FilterTube_KidsBlockChannel',
                channel: {
                    originalInput: rawValue,
                    source: 'user'
                }
            });

            if (response && response.success) {
                // Background handles persistence. We re-load settings to sync local state.
                await loadSettings();
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
        const kids = getKidsState();
        if (index < 0 || index >= kids.blockedChannels.length) return false;
        const channel = kids.blockedChannels[index];
        kids.blockedChannels.splice(index, 1);
        state.kids = { ...kids };
        await persistKidsProfiles(state.kids);
        await requestRefresh('kids');
        notifyListeners('kidsChannelRemoved', { channel, index });
        return true;
    }

    /**
     * Toggle "Filter All Content" for a Kids channel.
     * This mirrors main behavior, but persists inside ftProfilesV3.kids.blockedChannels.
     */
    async function toggleKidsChannelFilterAll(index) {
        await ensureLoaded();
        const kids = getKidsState();
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
                hideSearchShelves: state.hideSearchShelves
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

    async function persistKidsProfiles(nextKids) {
        const io = window.FilterTubeIO || {};
        if (!io || typeof io.saveProfilesV3 !== 'function' || typeof io.loadProfilesV3 !== 'function') {
            console.warn('StateManager: FilterTubeIO not available for kids persistence');
            return;
        }

        try {
            const existing = await io.loadProfilesV3();
            const merged = {
                ...existing,
                kids: {
                    ...existing?.kids,
                    ...nextKids
                }
            };
            await io.saveProfilesV3(merged);
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
        return true;
    }

    /**
     * Toggle whether a keyword should apply to comment filtering
     * @param {string} word - Keyword to toggle
     * @returns {Promise<boolean>} New comments state
     */
    async function toggleKeywordComments(word) {
        await ensureLoaded();

        let index = state.userKeywords.findIndex(k => k.word === word);
        if (index === -1) {
            // If the entry isn't in userKeywords (e.g., channel-derived), we don't currently
            // persist keyword-level overrides separately.
            return false;
        }

        const current = state.userKeywords[index];
        const nextValue = (typeof current.comments === 'boolean') ? !current.comments : false;
        state.userKeywords[index].comments = nextValue;

        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordUpdated', { word, comments: nextValue });
        return nextValue;
    }

    /**
     * Remove a keyword from the filter list
     * @param {string} word - Keyword to remove
     * @returns {Promise<boolean>} Success status
     */
    async function removeKeyword(word) {
        await ensureLoaded();

        const index = state.userKeywords.findIndex(k => k.word === word && k.source !== 'channel');
        if (index === -1) return false;

        state.userKeywords.splice(index, 1);
        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordRemoved', { word });
        return true;
    }

    /**
     * Toggle exact match for a keyword
     * @param {string} word - Keyword to toggle
     * @returns {Promise<boolean>} New exact state
     */
    async function toggleKeywordExact(word) {
        await ensureLoaded();

        const index = state.userKeywords.findIndex(k => k.word === word && k.source !== 'channel');
        if (index === -1) return false;

        state.userKeywords[index].exact = !state.userKeywords[index].exact;
        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordUpdated', { word, exact: state.userKeywords[index].exact });
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

        state.keywords = SettingsAPI.syncFilterAllKeywords(state.userKeywords, state.channels);
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

        const rawValue = input.trim();
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
            const response = await chrome.runtime.sendMessage({
                action: 'addChannelPersistent',
                input: rawValue
            });

            if (response && response.success) {
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

        if (index < 0 || index >= state.channels.length) return false;

        const channel = state.channels[index];
        state.channels.splice(index, 1);
        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelRemoved', { channel, index });
        return true;
    }

    /**
     * Toggle "Filter All Content" for a channel
     * @param {number} index - Index of channel
     * @returns {Promise<boolean>} New filterAll state
     */
    async function toggleChannelFilterAll(index) {
        await ensureLoaded();

        if (index < 0 || index >= state.channels.length) return false;

        state.channels[index].filterAll = !state.channels[index].filterAll;
        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelUpdated', {
            channel: state.channels[index],
            index,
            filterAll: state.channels[index].filterAll
        });
        return state.channels[index].filterAll;
    }

    /**
     * Toggle whether a channel-derived keyword should apply to comment filtering.
     * This persists on the channel entry itself (filterAllComments).
     */
    async function toggleChannelFilterAllCommentsByRef(channelRef) {
        await ensureLoaded();

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

        const validKeys = [
            'enabled',
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
            'hideSearchShelves'
        ];

        if (!validKeys.includes(key)) {
            console.warn(`StateManager: Invalid setting key: ${key}`);
            return;
        }

        state[key] = !!value;

        // Handle hideComments and filterComments mutual exclusivity
        if (key === 'hideComments' && value === true) {
            state.filterComments = false;
        }

        await saveSettings();
        notifyListeners('settingUpdated', { key, value: state[key] });
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
            chrome.storage.onChanged.addListener(async (changes, area) => {
                if (area !== 'local' || isSaving) return;

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
                    'hideSearchShelves',
                    'stats',
                    'channelMap',
                    'ftProfilesV3'
                ];
                const hasSettingsChange = storageKeys.some(key => changes[key]);

                if (hasSettingsChange) {
                    console.log('StateManager: Detected external settings change, reloading...');

                    // Reload all settings from storage to ensure sync
                    await loadSettings();

                    notifyListeners('externalUpdate', state);
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
