/**
 * Shared utilities for managing FilterTube settings across popup and tab views.
 * Exposes a global `FilterTubeSettings` object with helpers for loading,
 * normalizing, and persisting settings, as well as theme preference helpers.
 */
(function (global) {
    const STORAGE_NAMESPACE = chrome?.storage?.local;
    if (!STORAGE_NAMESPACE) {
        console.warn('FilterTubeSettings: chrome.storage.local unavailable');
    }

    const THEME_KEY = 'ftThemePreference';
    const SETTINGS_KEYS = [
        'uiKeywords',
        'filterKeywords',
        'filterChannels',
        'hideAllShorts',
        'hideAllComments',
        'filterComments',
        'stats',
        'channelMap'
    ];

    const SETTINGS_CHANGE_KEYS = new Set(SETTINGS_KEYS);

    function sanitizeKeywordEntry(entry, overrides = {}) {
        if (!entry) return null;
        const word = typeof entry.word === 'string' ? entry.word.trim() : '';
        if (!word) return null;
        return {
            word,
            exact: !!entry.exact,
            semantic: !!entry.semantic,
            source: overrides.source || (entry.source === 'channel' ? 'channel' : 'user'),
            channelRef: overrides.channelRef || entry.channelRef || null,
            addedAt: overrides.addedAt || entry.addedAt || Date.now() // Track insertion time
        };
    }

    function normalizeKeywords(rawKeywords, compiledKeywords) {
        if (Array.isArray(rawKeywords)) {
            // For existing keywords without timestamps, assign them based on array position
            // This ensures older entries get older timestamps
            const now = Date.now();
            return rawKeywords
                .map((entry, index) => {
                    // Preserve source and channelRef if they exist (for channel-derived keywords)
                    const source = entry.source === 'channel' ? 'channel' : 'user';
                    const channelRef = entry.source === 'channel' ? entry.channelRef : null;
                    // If no timestamp exists, assign based on position (newer items have higher timestamps)
                    const addedAt = entry.addedAt || (now - index * 1000);
                    return sanitizeKeywordEntry(entry, { source, channelRef, addedAt });
                })
                .filter(Boolean);
        }

        if (Array.isArray(compiledKeywords)) {
            return compiledKeywords
                .map(entry => {
                    if (!entry || typeof entry.pattern !== 'string') return null;
                    const isExact = entry.pattern.startsWith('\\b') && entry.pattern.endsWith('\\b');
                    const raw = entry.pattern
                        .replace(/^\\b/, '')
                        .replace(/\\b$/, '')
                        .replace(/\\(.)/g, '$1');
                    return sanitizeKeywordEntry({ word: raw, exact: isExact }, { source: 'user', channelRef: null });
                })
                .filter(Boolean);
        }

        if (typeof compiledKeywords === 'string') {
            return compiledKeywords
                .split(',')
                .map(word => sanitizeKeywordEntry({ word: word.trim() }, { source: 'user', channelRef: null }))
                .filter(Boolean);
        }

        return [];
    }

    function sanitizeChannelEntry(entry) {
        if (typeof entry === 'string') {
            const trimmed = entry.trim();
            if (!trimmed) return null;
            return {
                name: trimmed,
                id: trimmed,
                handle: null,
                logo: null,
                filterAll: false,
                originalInput: trimmed,
                addedAt: Date.now()
            };
        }

        if (!entry || typeof entry !== 'object') return null;

        const id = typeof entry.id === 'string' ? entry.id.trim() : (entry.id || '');
        const handle = typeof entry.handle === 'string' ? entry.handle : null;
        const name = entry.name || id || handle || entry.originalInput || '';
        const originalInput = entry.originalInput || handle || id || name || '';

        return {
            name: name || id,
            id,
            handle,
            logo: entry.logo || null,
            filterAll: !!entry.filterAll,
            originalInput,
            addedAt: entry.addedAt || Date.now()
        };
    }

    function normalizeChannels(rawChannels) {
        if (Array.isArray(rawChannels)) {
            return rawChannels
                .map(sanitizeChannelEntry)
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(sanitizeChannelEntry)
                .filter(Boolean);
        }

        return [];
    }

    function sanitizeChannelsList(channels) {
        if (!Array.isArray(channels)) return [];
        return channels.map(sanitizeChannelEntry).filter(Boolean);
    }

    function extractUserKeywords(keywords) {
        if (!Array.isArray(keywords)) return [];
        return keywords
            .filter(entry => entry && entry.source !== 'channel')
            .map(entry => sanitizeKeywordEntry(entry, { source: 'user', channelRef: null }))
            .filter(Boolean);
    }

    function compileKeywords(keywords) {
        return (keywords || [])
            .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source, channelRef: entry?.channelRef }))
            .filter(Boolean)
            .map(entry => {
                const escaped = entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return {
                    pattern: entry.exact ? `\\b${escaped}\\b` : escaped,
                    flags: 'i'
                };
            });
    }

    function getChannelDerivedKey(channel) {
        if (!channel) return '';
        const keySource = channel.id || channel.handle || channel.originalInput || channel.name || '';
        return keySource.toLowerCase();
    }

    function getChannelKeywordWord(channel) {
        if (!channel) return '';
        if (channel.name && channel.name !== channel.id) {
            return channel.name;
        }
        if (channel.handle) {
            return channel.handle;
        }
        return channel.id || channel.originalInput || '';
    }

    function syncFilterAllKeywords(keywords, channels) {
        const sanitizedChannels = sanitizeChannelsList(channels);

        // Create a set of channel keys that should have keywords
        const activeChannelKeys = new Set();
        const channelKeywordMap = new Map();

        sanitizedChannels.forEach(channel => {
            if (!channel || !channel.filterAll) return;
            const key = getChannelDerivedKey(channel);
            if (!key) return;
            const word = getChannelKeywordWord(channel);
            if (!word) return;

            activeChannelKeys.add(key);
            channelKeywordMap.set(key, {
                word,
                exact: false,
                semantic: false,
                source: 'channel',
                channelRef: key,
                addedAt: channel.addedAt || Date.now() // Use channel timestamp if available
            });
        });

        // Filter existing keywords and preserve order with timestamps
        const result = [];

        // First pass: keep existing keywords (both user and channel-derived) in their current order
        if (Array.isArray(keywords)) {
            keywords.forEach(entry => {
                if (!entry) return;

                // If it's a user keyword, always keep it
                if (entry.source !== 'channel') {
                    result.push(entry);
                    return;
                }

                // If it's a channel-derived keyword, only keep if channel still has filterAll
                if (entry.channelRef && activeChannelKeys.has(entry.channelRef)) {
                    result.push(entry);
                    activeChannelKeys.delete(entry.channelRef); // Mark as already added
                }
            });
        }

        // Second pass: add new channel-derived keywords
        activeChannelKeys.forEach(key => {
            const keyword = channelKeywordMap.get(key);
            if (keyword) {
                result.push(keyword);
            }
        });

        // Sort by addedAt timestamp to maintain true insertion order (newest first = reverse chronological)
        result.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

        return result;
    }

    function buildCompiledSettings({ keywords, channels, hideShorts, hideComments, filterComments }) {
        const sanitizedChannels = sanitizeChannelsList(channels);
        const sanitizedKeywords = syncFilterAllKeywords(keywords, sanitizedChannels);
        return {
            filterKeywords: compileKeywords(sanitizedKeywords),
            filterChannels: sanitizedChannels,
            hideAllShorts: !!hideShorts,
            hideAllComments: !!hideComments,
            filterComments: hideComments ? false : !!filterComments
        };
    }

    function loadSettings() {
        return new Promise(resolve => {
            STORAGE_NAMESPACE?.get([...SETTINGS_KEYS, THEME_KEY], result => {
                // Load all keywords (user + channel-derived) from storage
                const allKeywords = normalizeKeywords(result.uiKeywords, result.filterKeywords);
                const channels = normalizeChannels(result.filterChannels);

                // Sync keywords with current channel filterAll state (preserves order)
                const keywords = syncFilterAllKeywords(allKeywords, channels);

                // Extract just user keywords for compatibility
                const userKeywords = extractUserKeywords(keywords);

                const hideAllComments = !!result.hideAllComments;
                const filterComments = !hideAllComments && !!result.filterComments;
                const theme = result[THEME_KEY] === 'dark' ? 'dark' : 'light';

                resolve({
                    keywords,
                    userKeywords,
                    channels,
                    hideShorts: !!result.hideAllShorts,
                    hideComments: hideAllComments,
                    filterComments,
                    stats: result.stats || { hiddenCount: 0, savedMinutes: 0 },
                    channelMap: result.channelMap || {},
                    theme
                });
            });
        });
    }

    function saveSettings({ keywords, channels, hideShorts, hideComments, filterComments }) {
        const sanitizedChannels = sanitizeChannelsList(channels);
        const sanitizedKeywords = syncFilterAllKeywords(keywords, sanitizedChannels);
        const compiledSettings = buildCompiledSettings({
            keywords: sanitizedKeywords,
            channels: sanitizedChannels,
            hideShorts,
            hideComments,
            filterComments
        });

        const payload = {
            uiKeywords: sanitizedKeywords, // Save ALL keywords (user + channel-derived) to preserve order
            filterKeywords: compiledSettings.filterKeywords,
            filterChannels: compiledSettings.filterChannels,
            hideAllShorts: compiledSettings.hideAllShorts,
            hideAllComments: compiledSettings.hideAllComments,
            filterComments: compiledSettings.filterComments
        };

        return new Promise(resolve => {
            STORAGE_NAMESPACE?.set(payload, () => {
                const error = chrome.runtime?.lastError || null;
                resolve({ compiledSettings, error });
            });
        });
    }

    function applyThemePreference(theme) {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', normalized);
        }
        return normalized;
    }

    function getThemePreference() {
        return new Promise(resolve => {
            STORAGE_NAMESPACE?.get([THEME_KEY], result => {
                resolve(result?.[THEME_KEY] === 'dark' ? 'dark' : 'light');
            });
        });
    }

    function setThemePreference(theme) {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        return new Promise(resolve => {
            STORAGE_NAMESPACE?.set({ [THEME_KEY]: normalized }, () => resolve(normalized));
        });
    }

    function isSettingsChange(changes) {
        return Object.keys(changes).some(key => SETTINGS_CHANGE_KEYS.has(key));
    }

    function isThemeChange(changes) {
        return Object.prototype.hasOwnProperty.call(changes, THEME_KEY);
    }

    function getThemeFromChange(changes) {
        if (!isThemeChange(changes)) return null;
        const newValue = changes[THEME_KEY]?.newValue;
        return newValue === 'dark' ? 'dark' : 'light';
    }

    global.FilterTubeSettings = {
        STORAGE_KEYS: SETTINGS_KEYS,
        THEME_KEY,
        normalizeKeywords,
        normalizeChannels,
        compileKeywords,
        extractUserKeywords,
        syncFilterAllKeywords,
        getChannelDerivedKey,
        getChannelKeywordWord,
        buildCompiledSettings,
        loadSettings,
        saveSettings,
        applyThemePreference,
        getThemePreference,
        setThemePreference,
        isSettingsChange,
        isThemeChange,
        getThemeFromChange
    };
})(typeof window !== 'undefined' ? window : this);
