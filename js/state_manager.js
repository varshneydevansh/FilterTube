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
        keywords: [],
        userKeywords: [],
        channels: [],
        hideShorts: false,
        hideComments: false,
        filterComments: false,
        stats: { hiddenCount: 0, savedMinutes: 0 },
        channelMap: {},
        theme: 'light',
        isLoaded: false
    };

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

        state.keywords = data.keywords || [];
        state.userKeywords = data.userKeywords || [];
        state.channels = data.channels || [];
        state.hideShorts = data.hideShorts || false;
        state.hideComments = data.hideComments || false;
        state.filterComments = data.filterComments || false;
        state.stats = data.stats || { hiddenCount: 0, savedMinutes: 0 };
        state.channelMap = data.channelMap || {};
        state.theme = data.theme || 'light';
        state.isLoaded = true;

        notifyListeners('load', state);
        return state;
    }

    /**
     * Save current state to storage
     * @param {Object} options - Save options
     * @param {boolean} options.broadcast - Whether to broadcast to other contexts
     * @returns {Promise<Object>} Result of save operation
     */
    async function saveSettings({ broadcast = true } = {}) {
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
                hideShorts: state.hideShorts,
                hideComments: state.hideComments,
                filterComments: state.filterComments
            });

            if (broadcast && result.compiledSettings) {
                broadcastSettings(result.compiledSettings);
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

    /**
     * Broadcast settings to content scripts
     */
    function broadcastSettings(compiledSettings) {
        chrome.tabs?.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id && tab.url?.startsWith('http')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingsUpdated',
                        settings: compiledSettings
                    }).catch(() => {
                        // Ignore errors for tabs that don't have content script
                    });
                }
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
            channelRef: null
        });

        recomputeKeywords();
        await saveSettings();
        notifyListeners('keywordAdded', { word: trimmed });
        return true;
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
     * Add a channel to the filter list
     * @param {string} input - Channel identifier (@handle or UC ID)
     * @returns {Promise<Object>} Result with success status and channel data
     */
    async function addChannel(input) {
        await ensureLoaded();

        const rawValue = input.trim();
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        // Validate format
        if (!rawValue.startsWith('@') && !rawValue.toLowerCase().startsWith('uc') && !rawValue.toLowerCase().startsWith('channel/uc')) {
            return {
                success: false,
                error: 'Invalid format. Use @handle or UC ID'
            };
        }

        const normalizedInput = rawValue.replace(/^channel\//i, '');

        // Check for duplicates
        if (isDuplicateChannel(normalizedInput)) {
            return { success: false, error: 'Channel already exists' };
        }

        // Create initial channel entry
        let channelEntry = {
            name: normalizedInput,
            id: normalizedInput,
            handle: null,
            logo: null,
            filterAll: false,
            originalInput: rawValue
        };

        // Fetch channel details
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchChannelDetails',
                channelIdOrHandle: normalizedInput
            });

            if (response?.success && response.id) {
                channelEntry = {
                    ...channelEntry,
                    name: response.name || channelEntry.name,
                    id: response.id,
                    handle: response.handle || channelEntry.handle,
                    logo: response.logo || channelEntry.logo
                };

                // Persist channel mapping
                if (response.handle && response.id) {
                    await persistChannelMap(response.id, response.handle);
                }
            }
        } catch (error) {
            console.warn('StateManager: Error fetching channel details', error);
            // Continue with basic channel entry
        }

        state.channels.unshift(channelEntry);
        recomputeKeywords();
        await saveSettings();
        notifyListeners('channelAdded', { channel: channelEntry });

        return { success: true, channel: channelEntry };
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

        const validKeys = ['hideShorts', 'hideComments', 'filterComments'];
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

        // Keywords
        addKeyword,
        removeKeyword,
        toggleKeywordExact,

        // Channels
        addChannel,
        removeChannel,
        toggleChannelFilterAll,

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
    window.StateManager = StateManager;
}
