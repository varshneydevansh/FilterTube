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
    const AUTO_BACKUP_KEY = 'ftAutoBackupEnabled';
    const FT_PROFILES_V3_KEY = 'ftProfilesV3';
    const FT_PROFILES_V4_KEY = 'ftProfilesV4';
    const DEFAULT_PROFILE_ID = 'default';
    const SETTINGS_KEYS = [
        'enabled',
        'filterKeywords',
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
        'showQuickBlockButton',
        'hideSearchShelves',
        'stats',
        'statsBySurface',
        'channelMap'
    ];

    const SETTINGS_CHANGE_KEYS = new Set([...SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY]);

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
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

    function buildProfilesV4FromLegacyState(storage, mainChannels, mainKeywords) {
        const profilesV3 = safeObject(storage?.[FT_PROFILES_V3_KEY]);
        const kidsV3 = safeObject(profilesV3.kids);
        const mainV3 = safeObject(profilesV3.main);

        const enabled = storage?.enabled !== false;
        const hideComments = !!storage?.hideAllComments;

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
                        hideShorts: !!storage?.hideAllShorts,
                        hideComments,
                        filterComments: hideComments ? false : !!storage?.filterComments,
                        hideHomeFeed: !!storage?.hideHomeFeed,
                        hideSponsoredCards: !!storage?.hideSponsoredCards,
                        hideWatchPlaylistPanel: !!storage?.hideWatchPlaylistPanel,
                        hidePlaylistCards: !!storage?.hidePlaylistCards,
                        hideMembersOnly: !!storage?.hideMembersOnly,
                        hideMixPlaylists: !!storage?.hideMixPlaylists,
                        hideVideoSidebar: !!storage?.hideVideoSidebar,
                        hideRecommended: !!storage?.hideRecommended,
                        hideLiveChat: !!storage?.hideLiveChat,
                        hideVideoInfo: !!storage?.hideVideoInfo,
                        hideVideoButtonsBar: !!storage?.hideVideoButtonsBar,
                        hideAskButton: !!storage?.hideAskButton,
                        hideVideoChannelRow: !!storage?.hideVideoChannelRow,
                        hideVideoDescription: !!storage?.hideVideoDescription,
                        hideMerchTicketsOffers: !!storage?.hideMerchTicketsOffers,
                        hideEndscreenVideowall: !!storage?.hideEndscreenVideowall,
                        hideEndscreenCards: !!storage?.hideEndscreenCards,
                        disableAutoplay: !!storage?.disableAutoplay,
                        disableAnnotations: !!storage?.disableAnnotations,
                        hideTopHeader: !!storage?.hideTopHeader,
                        hideNotificationBell: !!storage?.hideNotificationBell,
                        hideExploreTrending: !!storage?.hideExploreTrending,
                        hideMoreFromYouTube: !!storage?.hideMoreFromYouTube,
                        hideSubscriptions: !!storage?.hideSubscriptions,
                        showQuickBlockButton: storage?.showQuickBlockButton !== false,
                        hideSearchShelves: !!storage?.hideSearchShelves
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

    function sanitizeKeywordEntry(entry, overrides = {}) {
        if (!entry) return null;
        const word = typeof entry.word === 'string' ? entry.word.trim() : '';
        if (!word) return null;

        const addedAtCandidate = Object.prototype.hasOwnProperty.call(overrides, 'addedAt')
            ? overrides.addedAt
            : entry.addedAt;
        const addedAt = (typeof addedAtCandidate === 'number' && Number.isFinite(addedAtCandidate))
            ? addedAtCandidate
            : Date.now();

        const commentsCandidate = Object.prototype.hasOwnProperty.call(overrides, 'comments')
            ? overrides.comments
            : entry.comments;
        const comments = (typeof commentsCandidate === 'boolean') ? commentsCandidate : true;
        return {
            word,
            exact: !!entry.exact,
            semantic: !!entry.semantic,
            source: overrides.source || (entry.source === 'channel' ? 'channel' : 'user'),
            channelRef: overrides.channelRef || entry.channelRef || null,
            comments,
            addedAt // Track insertion time
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

    function sanitizeChannelEntry(entry, overrides = {}) {
        if (typeof entry === 'string') {
            const trimmed = entry.trim();
            if (!trimmed) return null;
            return {
                name: trimmed,
                id: trimmed,
                handle: null,
                handleDisplay: null,
                canonicalHandle: null,
                logo: null,
                customUrl: null,
                filterAll: false,
                source: overrides.source || null,
                originalInput: trimmed,
                addedAt: overrides.addedAt || Date.now()
            };
        }

        if (!entry || typeof entry !== 'object') return null;

        const id = typeof entry.id === 'string' ? entry.id.trim() : (entry.id || '');
        const handle = typeof entry.handle === 'string' ? entry.handle : null;
        const handleDisplay = typeof entry.handleDisplay === 'string' ? entry.handleDisplay : null;
        const canonicalHandle = typeof entry.canonicalHandle === 'string' ? entry.canonicalHandle : null;
        const customUrl = typeof entry.customUrl === 'string' ? entry.customUrl : null;
        const source = overrides.source || (typeof entry.source === 'string' ? entry.source : null);
        const filterAllCommentsCandidate = Object.prototype.hasOwnProperty.call(overrides, 'filterAllComments')
            ? overrides.filterAllComments
            : entry.filterAllComments;
        const filterAllComments = (typeof filterAllCommentsCandidate === 'boolean') ? filterAllCommentsCandidate : true;
        const name = entry.name || id || handle || entry.originalInput || '';
        const originalInput = entry.originalInput || customUrl || handle || id || name || '';
        const collaborationGroupId = typeof entry.collaborationGroupId === 'string'
            ? entry.collaborationGroupId
            : null;
        const collaborationWith = Array.isArray(entry.collaborationWith)
            ? entry.collaborationWith.filter(Boolean)
            : [];
        const allCollaborators = Array.isArray(entry.allCollaborators)
            ? entry.allCollaborators
                .map(collab => {
                    if (!collab || typeof collab !== 'object') return null;
                    const collabHandle = typeof collab.handle === 'string' ? collab.handle : null;
                    const collabName = collab.name || collabHandle || collab.id || null;
                    const collabId = typeof collab.id === 'string' ? collab.id : null;
                    if (!collabHandle && !collabName && !collabId) return null;
                    return {
                        handle: collabHandle,
                        name: collabName,
                        id: collabId
                    };
                })
                .filter(Boolean)
            : [];

        const addedAtCandidate = Object.prototype.hasOwnProperty.call(overrides, 'addedAt')
            ? overrides.addedAt
            : entry.addedAt;
        const addedAt = (typeof addedAtCandidate === 'number' && Number.isFinite(addedAtCandidate))
            ? addedAtCandidate
            : Date.now();

        return {
            name: name || id,
            id,
            handle,
            handleDisplay,
            canonicalHandle,
            logo: entry.logo || null,
            customUrl,
            filterAll: !!entry.filterAll,
            filterAllComments,
            source,
            originalInput,
            addedAt,
            collaborationGroupId,
            collaborationWith,
            allCollaborators
        };
    }

    function normalizeChannels(rawChannels) {
        if (Array.isArray(rawChannels)) {
            const now = Date.now();
            return rawChannels
                .map((entry, index) => {
                    const addedAtRaw = entry && typeof entry === 'object' ? entry.addedAt : null;
                    const addedAt = (typeof addedAtRaw === 'number' && Number.isFinite(addedAtRaw))
                        ? addedAtRaw
                        : (now - index * 1000);
                    return sanitizeChannelEntry(entry, { addedAt });
                })
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(entry => sanitizeChannelEntry(entry))
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

    function compileKeywords(keywords, predicate = null) {
        return (keywords || [])
            .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source, channelRef: entry?.channelRef, comments: entry?.comments }))
            .filter(Boolean)
            .filter(entry => (typeof predicate === 'function' ? predicate(entry) : true))
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
        // Existing keywords (user + channel-derived)
        const existing = Array.isArray(keywords) ? keywords : [];
        const sanitizedChannels = sanitizeChannelsList(channels);

        // Create a set of channel keys that should have keywords
        const activeChannelKeys = new Set();
        const channelKeywordMap = new Map();

        sanitizedChannels.forEach(channel => {
            if (!channel.filterAll) return;
            const key = getChannelDerivedKey(channel);
            if (!key) return;

            activeChannelKeys.add(key);
            channelKeywordMap.set(key, {
                word: getChannelKeywordWord(channel),
                exact: false,
                semantic: false,
                source: 'channel',
                channelRef: key,
                comments: (typeof channel.filterAllComments === 'boolean') ? channel.filterAllComments : true,
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

    function buildCompiledSettings({
        keywords,
        channels,
        enabled,
        hideShorts,
        hideComments,
        filterComments,
        hideHomeFeed,
        hideSponsoredCards,
        hideWatchPlaylistPanel,
        hidePlaylistCards,
        hideMembersOnly,
        hideMixPlaylists,
        hideVideoSidebar,
        hideRecommended,
        hideLiveChat,
        hideVideoInfo,
        hideVideoButtonsBar,
        hideAskButton,
        hideVideoChannelRow,
        hideVideoDescription,
        hideMerchTicketsOffers,
        hideEndscreenVideowall,
        hideEndscreenCards,
        disableAutoplay,
        disableAnnotations,
        hideTopHeader,
        hideNotificationBell,
        hideExploreTrending,
        hideMoreFromYouTube,
        hideSubscriptions,
        showQuickBlockButton,
        hideSearchShelves,
        contentFilters,
        categoryFilters
    }) {
        const sanitizedChannels = sanitizeChannelsList(channels);
        const sanitizedKeywords = syncFilterAllKeywords(keywords, sanitizedChannels);
        const sanitizedContentFilters = safeObject(contentFilters);
        const sanitizedCategoryFilters = safeObject(categoryFilters);
        return {
            enabled: enabled !== false,
            filterKeywords: compileKeywords(sanitizedKeywords),
            filterKeywordsComments: compileKeywords(sanitizedKeywords, entry => entry.comments !== false),
            filterChannels: sanitizedChannels,
            hideAllShorts: !!hideShorts,
            hideAllComments: !!hideComments,
            filterComments: hideComments ? false : !!filterComments,
            hideHomeFeed: !!hideHomeFeed,
            hideSponsoredCards: !!hideSponsoredCards,
            hideWatchPlaylistPanel: !!hideWatchPlaylistPanel,
            hidePlaylistCards: !!hidePlaylistCards,
            hideMembersOnly: !!hideMembersOnly,
            hideMixPlaylists: !!hideMixPlaylists,
            hideVideoSidebar: !!hideVideoSidebar,
            hideRecommended: !!hideRecommended,
            hideLiveChat: !!hideLiveChat,
            hideVideoInfo: !!hideVideoInfo,
            hideVideoButtonsBar: !!hideVideoButtonsBar,
            hideAskButton: !!hideAskButton,
            hideVideoChannelRow: !!hideVideoChannelRow,
            hideVideoDescription: !!hideVideoDescription,
            hideMerchTicketsOffers: !!hideMerchTicketsOffers,
            hideEndscreenVideowall: !!hideEndscreenVideowall,
            hideEndscreenCards: !!hideEndscreenCards,
            disableAutoplay: !!disableAutoplay,
            disableAnnotations: !!disableAnnotations,
            hideTopHeader: !!hideTopHeader,
            hideNotificationBell: !!hideNotificationBell,
            hideExploreTrending: !!hideExploreTrending,
            hideMoreFromYouTube: !!hideMoreFromYouTube,
            hideSubscriptions: !!hideSubscriptions,
            showQuickBlockButton: showQuickBlockButton !== false,
            hideSearchShelves: !!hideSearchShelves,
            contentFilters: sanitizedContentFilters,
            categoryFilters: sanitizedCategoryFilters
        };
    }

    function loadSettings() {
        return new Promise(resolve => {
            STORAGE_NAMESPACE?.get([...SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY, FT_PROFILES_V3_KEY, FT_PROFILES_V4_KEY], result => {
                const profilesV4 = result?.[FT_PROFILES_V4_KEY];
                const hasProfilesV4 = isValidProfilesV4(profilesV4);

                let mainRawKeywords = result.uiKeywords;
                let mainRawChannels = result.filterChannels;

                if (hasProfilesV4) {
                    const activeId = profilesV4.activeProfileId;
                    const activeProfile = safeObject(safeObject(profilesV4.profiles)[activeId]);
                    const main = safeObject(activeProfile.main);
                    mainRawKeywords = Array.isArray(main.keywords) ? main.keywords : mainRawKeywords;
                    mainRawChannels = Array.isArray(main.channels) ? main.channels : mainRawChannels;
                }

                // Load all keywords (user + channel-derived) from storage
                const allKeywords = normalizeKeywords(mainRawKeywords, result.filterKeywords);
                const channels = normalizeChannels(mainRawChannels);

                // Sync keywords with current channel filterAll state (preserves order)
                const keywords = syncFilterAllKeywords(allKeywords, channels);

                // Extract just user keywords for compatibility
                const userKeywords = extractUserKeywords(keywords);

                const activeId = hasProfilesV4 ? profilesV4.activeProfileId : '';
                const activeProfile = hasProfilesV4 ? safeObject(safeObject(profilesV4.profiles)[activeId]) : {};
                const profileSettings = safeObject(activeProfile.settings);

                const readBool = (key, fallback) => {
                    if (Object.prototype.hasOwnProperty.call(profileSettings, key)) {
                        return !!profileSettings[key];
                    }
                    return !!fallback;
                };

                const enabled = Object.prototype.hasOwnProperty.call(profileSettings, 'enabled')
                    ? profileSettings.enabled !== false
                    : (result.enabled !== false);

                const hideComments = readBool('hideComments', !!result.hideAllComments);
                const filterComments = hideComments ? false : readBool('filterComments', !!result.filterComments);
                const theme = result[THEME_KEY] === 'dark' ? 'dark' : 'light';
                const autoBackupEnabled = Object.prototype.hasOwnProperty.call(profileSettings, 'autoBackupEnabled')
                    ? (profileSettings.autoBackupEnabled === true)
                    : (result?.[AUTO_BACKUP_KEY] === true);

                const effectiveSettings = {
                    autoBackupEnabled,
                    enabled,
                    hideShorts: readBool('hideShorts', !!result.hideAllShorts),
                    hideComments,
                    filterComments,
                    hideHomeFeed: readBool('hideHomeFeed', !!result.hideHomeFeed),
                    hideSponsoredCards: readBool('hideSponsoredCards', !!result.hideSponsoredCards),
                    hideWatchPlaylistPanel: readBool('hideWatchPlaylistPanel', !!result.hideWatchPlaylistPanel),
                    hidePlaylistCards: readBool('hidePlaylistCards', !!result.hidePlaylistCards),
                    hideMembersOnly: readBool('hideMembersOnly', !!result.hideMembersOnly),
                    hideMixPlaylists: readBool('hideMixPlaylists', !!result.hideMixPlaylists),
                    hideVideoSidebar: readBool('hideVideoSidebar', !!result.hideVideoSidebar),
                    hideRecommended: readBool('hideRecommended', !!result.hideRecommended),
                    hideLiveChat: readBool('hideLiveChat', !!result.hideLiveChat),
                    hideVideoInfo: readBool('hideVideoInfo', !!result.hideVideoInfo),
                    hideVideoButtonsBar: readBool('hideVideoButtonsBar', !!result.hideVideoButtonsBar),
                    hideAskButton: readBool('hideAskButton', !!result.hideAskButton),
                    hideVideoChannelRow: readBool('hideVideoChannelRow', !!result.hideVideoChannelRow),
                    hideVideoDescription: readBool('hideVideoDescription', !!result.hideVideoDescription),
                    hideMerchTicketsOffers: readBool('hideMerchTicketsOffers', !!result.hideMerchTicketsOffers),
                    hideEndscreenVideowall: readBool('hideEndscreenVideowall', !!result.hideEndscreenVideowall),
                    hideEndscreenCards: readBool('hideEndscreenCards', !!result.hideEndscreenCards),
                    disableAutoplay: readBool('disableAutoplay', !!result.disableAutoplay),
                    disableAnnotations: readBool('disableAnnotations', !!result.disableAnnotations),
                    hideTopHeader: readBool('hideTopHeader', !!result.hideTopHeader),
                    hideNotificationBell: readBool('hideNotificationBell', !!result.hideNotificationBell),
                    hideExploreTrending: readBool('hideExploreTrending', !!result.hideExploreTrending),
                    hideMoreFromYouTube: readBool('hideMoreFromYouTube', !!result.hideMoreFromYouTube),
                    hideSubscriptions: readBool('hideSubscriptions', !!result.hideSubscriptions),
                    showQuickBlockButton: readBool('showQuickBlockButton', result.showQuickBlockButton !== false),
                    hideSearchShelves: readBool('hideSearchShelves', !!result.hideSearchShelves)
                };

                if (!hasProfilesV4) {
                    try {
                        const nextProfilesV4 = buildProfilesV4FromLegacyState(result, channels, keywords);
                        STORAGE_NAMESPACE?.set({ [FT_PROFILES_V4_KEY]: nextProfilesV4 }, () => {
                            // ignore
                        });
                    } catch (e) {
                    }
                } else {
                    try {
                        if (activeId && activeProfile && typeof activeProfile === 'object') {
                            const missing = {};
                            let needsWrite = false;
                            for (const [key, value] of Object.entries(effectiveSettings)) {
                                if (!Object.prototype.hasOwnProperty.call(profileSettings, key)) {
                                    missing[key] = value;
                                    needsWrite = true;
                                }
                            }

                            if (needsWrite) {
                                const profiles = safeObject(profilesV4.profiles);
                                profiles[activeId] = {
                                    ...activeProfile,
                                    settings: {
                                        ...profileSettings,
                                        ...missing
                                    }
                                };
                                STORAGE_NAMESPACE?.set({
                                    [FT_PROFILES_V4_KEY]: {
                                        ...profilesV4,
                                        schemaVersion: 4,
                                        profiles
                                    }
                                }, () => {
                                    // ignore
                                });
                            }
                        }
                    } catch (e) {
                    }
                }

                const contentFilters = safeObject(profileSettings.contentFilters);
                const categoryFilters = safeObject(profileSettings.categoryFilters);

                resolve({
                    enabled,
                    keywords,
                    userKeywords,
                    channels,
                    hideShorts: effectiveSettings.hideShorts,
                    hideComments,
                    filterComments,
                    hideHomeFeed: effectiveSettings.hideHomeFeed,
                    hideSponsoredCards: effectiveSettings.hideSponsoredCards,
                    hideWatchPlaylistPanel: effectiveSettings.hideWatchPlaylistPanel,
                    hidePlaylistCards: effectiveSettings.hidePlaylistCards,
                    hideMembersOnly: effectiveSettings.hideMembersOnly,
                    hideMixPlaylists: effectiveSettings.hideMixPlaylists,
                    hideVideoSidebar: effectiveSettings.hideVideoSidebar,
                    hideRecommended: effectiveSettings.hideRecommended,
                    hideLiveChat: effectiveSettings.hideLiveChat,
                    hideVideoInfo: effectiveSettings.hideVideoInfo,
                    hideVideoButtonsBar: effectiveSettings.hideVideoButtonsBar,
                    hideAskButton: effectiveSettings.hideAskButton,
                    hideVideoChannelRow: effectiveSettings.hideVideoChannelRow,
                    hideVideoDescription: effectiveSettings.hideVideoDescription,
                    hideMerchTicketsOffers: effectiveSettings.hideMerchTicketsOffers,
                    hideEndscreenVideowall: effectiveSettings.hideEndscreenVideowall,
                    hideEndscreenCards: effectiveSettings.hideEndscreenCards,
                    disableAutoplay: effectiveSettings.disableAutoplay,
                    disableAnnotations: effectiveSettings.disableAnnotations,
                    hideTopHeader: effectiveSettings.hideTopHeader,
                    hideNotificationBell: effectiveSettings.hideNotificationBell,
                    hideExploreTrending: effectiveSettings.hideExploreTrending,
                    hideMoreFromYouTube: effectiveSettings.hideMoreFromYouTube,
                    hideSubscriptions: effectiveSettings.hideSubscriptions,
                    showQuickBlockButton: effectiveSettings.showQuickBlockButton,
                    hideSearchShelves: effectiveSettings.hideSearchShelves,
                    stats: result.stats || { hiddenCount: 0, savedMinutes: 0 },
                    statsBySurface: safeObject(result.statsBySurface),
                    channelMap: result.channelMap || {},
                    theme,
                    autoBackupEnabled,
                    contentFilters,
                    categoryFilters
                });
            });
        });
    }

    function saveSettings(options = {}) {
        const opts = options && typeof options === 'object' ? options : {};
        const hasCategoryFiltersInput = Object.prototype.hasOwnProperty.call(opts, 'categoryFilters');

        const {
            keywords,
            channels,
            enabled,
            hideShorts,
            hideComments,
            filterComments,
            hideHomeFeed,
            hideSponsoredCards,
            hideWatchPlaylistPanel,
            hidePlaylistCards,
            hideMembersOnly,
            hideMixPlaylists,
            hideVideoSidebar,
            hideRecommended,
            hideLiveChat,
            hideVideoInfo,
            hideVideoButtonsBar,
            hideAskButton,
            hideVideoChannelRow,
            hideVideoDescription,
            hideMerchTicketsOffers,
            hideEndscreenVideowall,
            hideEndscreenCards,
            disableAutoplay,
            disableAnnotations,
            hideTopHeader,
            hideNotificationBell,
            hideExploreTrending,
            hideMoreFromYouTube,
            hideSubscriptions,
            showQuickBlockButton,
            hideSearchShelves,
            autoBackupEnabled,
            contentFilters,
            categoryFilters
        } = opts;

        const sanitizedChannels = sanitizeChannelsList(channels);
        const sanitizedKeywords = syncFilterAllKeywords(keywords, sanitizedChannels);
        const sanitizedContentFilters = safeObject(contentFilters);

        return new Promise(resolve => {
            STORAGE_NAMESPACE?.get([FT_PROFILES_V4_KEY, FT_PROFILES_V3_KEY], (existing) => {
                let nextProfilesV4 = null;
                let effectiveCategoryFilters = null;
                try {
                    const existingV4 = existing?.[FT_PROFILES_V4_KEY];
                    if (isValidProfilesV4(existingV4)) {
                        const profiles = safeObject(existingV4.profiles);
                        const activeId = existingV4.activeProfileId;
                        const activeProfile = safeObject(profiles[activeId]);
                        const existingKids = safeObject(activeProfile.kids);

                        const existingSettings = safeObject(activeProfile.settings);
                        const existingCategoryFilters = safeObject(existingSettings.categoryFilters);
                        effectiveCategoryFilters = hasCategoryFiltersInput
                            ? safeObject(categoryFilters)
                            : existingCategoryFilters;

                        const compiledSettings = buildCompiledSettings({
                            keywords: sanitizedKeywords,
                            channels: sanitizedChannels,
                            enabled,
                            hideShorts,
                            hideComments,
                            filterComments,
                            hideHomeFeed,
                            hideSponsoredCards,
                            hideWatchPlaylistPanel,
                            hidePlaylistCards,
                            hideMembersOnly,
                            hideMixPlaylists,
                            hideVideoSidebar,
                            hideRecommended,
                            hideLiveChat,
                            hideVideoInfo,
                            hideVideoButtonsBar,
                            hideAskButton,
                            hideVideoChannelRow,
                            hideVideoDescription,
                            hideMerchTicketsOffers,
                            hideEndscreenVideowall,
                            hideEndscreenCards,
                            disableAutoplay,
                            disableAnnotations,
                            hideTopHeader,
                            hideNotificationBell,
                            hideExploreTrending,
                            hideMoreFromYouTube,
                            hideSubscriptions,
                            showQuickBlockButton,
                            hideSearchShelves,
                            contentFilters: sanitizedContentFilters,
                            categoryFilters: effectiveCategoryFilters
                        });

                        const payload = {
                            enabled: compiledSettings.enabled,
                            uiKeywords: sanitizedKeywords,
                            filterKeywords: compiledSettings.filterKeywords,
                            filterKeywordsComments: compiledSettings.filterKeywordsComments,
                            filterChannels: compiledSettings.filterChannels,
                            hideAllShorts: compiledSettings.hideAllShorts,
                            hideAllComments: compiledSettings.hideAllComments,
                            filterComments: compiledSettings.filterComments,
                            hideHomeFeed: compiledSettings.hideHomeFeed,
                            hideSponsoredCards: compiledSettings.hideSponsoredCards,
                            hideWatchPlaylistPanel: compiledSettings.hideWatchPlaylistPanel,
                            hidePlaylistCards: compiledSettings.hidePlaylistCards,
                            hideMembersOnly: compiledSettings.hideMembersOnly,
                            hideMixPlaylists: compiledSettings.hideMixPlaylists,
                            hideVideoSidebar: compiledSettings.hideVideoSidebar,
                            hideRecommended: compiledSettings.hideRecommended,
                            hideLiveChat: compiledSettings.hideLiveChat,
                            hideVideoInfo: compiledSettings.hideVideoInfo,
                            hideVideoButtonsBar: compiledSettings.hideVideoButtonsBar,
                            hideAskButton: compiledSettings.hideAskButton,
                            hideVideoChannelRow: compiledSettings.hideVideoChannelRow,
                            hideVideoDescription: compiledSettings.hideVideoDescription,
                            hideMerchTicketsOffers: compiledSettings.hideMerchTicketsOffers,
                            hideEndscreenVideowall: compiledSettings.hideEndscreenVideowall,
                            hideEndscreenCards: compiledSettings.hideEndscreenCards,
                            disableAutoplay: compiledSettings.disableAutoplay,
                            disableAnnotations: compiledSettings.disableAnnotations,
                            hideTopHeader: compiledSettings.hideTopHeader,
                            hideNotificationBell: compiledSettings.hideNotificationBell,
                            hideExploreTrending: compiledSettings.hideExploreTrending,
                            hideMoreFromYouTube: compiledSettings.hideMoreFromYouTube,
                            hideSubscriptions: compiledSettings.hideSubscriptions,
                            showQuickBlockButton: compiledSettings.showQuickBlockButton,
                            hideSearchShelves: compiledSettings.hideSearchShelves,
                            [AUTO_BACKUP_KEY]: autoBackupEnabled === true
                        };

                        const nextSettings = {
                            ...existingSettings,
                            autoBackupEnabled: autoBackupEnabled === true,
                            enabled: compiledSettings.enabled,
                            hideShorts: compiledSettings.hideAllShorts,
                            hideComments: compiledSettings.hideAllComments,
                            filterComments: compiledSettings.filterComments,
                            hideHomeFeed: compiledSettings.hideHomeFeed,
                            hideSponsoredCards: compiledSettings.hideSponsoredCards,
                            hideWatchPlaylistPanel: compiledSettings.hideWatchPlaylistPanel,
                            hidePlaylistCards: compiledSettings.hidePlaylistCards,
                            hideMembersOnly: compiledSettings.hideMembersOnly,
                            hideMixPlaylists: compiledSettings.hideMixPlaylists,
                            hideVideoSidebar: compiledSettings.hideVideoSidebar,
                            hideRecommended: compiledSettings.hideRecommended,
                            hideLiveChat: compiledSettings.hideLiveChat,
                            hideVideoInfo: compiledSettings.hideVideoInfo,
                            hideVideoButtonsBar: compiledSettings.hideVideoButtonsBar,
                            hideAskButton: compiledSettings.hideAskButton,
                            hideVideoChannelRow: compiledSettings.hideVideoChannelRow,
                            hideVideoDescription: compiledSettings.hideVideoDescription,
                            hideMerchTicketsOffers: compiledSettings.hideMerchTicketsOffers,
                            hideEndscreenVideowall: compiledSettings.hideEndscreenVideowall,
                            hideEndscreenCards: compiledSettings.hideEndscreenCards,
                            disableAutoplay: compiledSettings.disableAutoplay,
                            disableAnnotations: compiledSettings.disableAnnotations,
                            hideTopHeader: compiledSettings.hideTopHeader,
                            hideNotificationBell: compiledSettings.hideNotificationBell,
                            hideExploreTrending: compiledSettings.hideExploreTrending,
                            hideMoreFromYouTube: compiledSettings.hideMoreFromYouTube,
                            hideSubscriptions: compiledSettings.hideSubscriptions,
                            showQuickBlockButton: compiledSettings.showQuickBlockButton,
                            hideSearchShelves: compiledSettings.hideSearchShelves,
                            contentFilters: sanitizedContentFilters,
                            categoryFilters: effectiveCategoryFilters
                        };

                        profiles[activeId] = {
                            ...activeProfile,
                            name: typeof activeProfile.name === 'string' ? activeProfile.name : 'Default',
                            settings: nextSettings,
                            main: {
                                ...safeObject(activeProfile.main),
                                channels: sanitizedChannels,
                                keywords: sanitizedKeywords
                            },
                            kids: {
                                ...existingKids,
                                mode: (typeof existingKids.mode === 'string' && existingKids.mode === 'whitelist') ? 'whitelist' : 'blocklist',
                                strictMode: existingKids.strictMode !== false,
                                blockedChannels: safeArray(existingKids.blockedChannels),
                                blockedKeywords: safeArray(existingKids.blockedKeywords)
                            }
                        };

                        nextProfilesV4 = {
                            ...existingV4,
                            schemaVersion: 4,
                            profiles
                        };

                        payload[FT_PROFILES_V4_KEY] = nextProfilesV4;
                        STORAGE_NAMESPACE?.set(payload, () => {
                            const error = chrome.runtime?.lastError || null;
                            resolve({ compiledSettings, error });
                        });
                        return;
                    }

                    // No profiles v4: fall back to legacy migration path.
                    // In this mode we cannot reliably preserve categoryFilters.
                    const compiledSettings = buildCompiledSettings({
                        keywords: sanitizedKeywords,
                        channels: sanitizedChannels,
                        enabled,
                        hideShorts,
                        hideComments,
                        filterComments,
                        hideHomeFeed,
                        hideSponsoredCards,
                        hideWatchPlaylistPanel,
                        hidePlaylistCards,
                        hideMembersOnly,
                        hideMixPlaylists,
                        hideVideoSidebar,
                        hideRecommended,
                        hideLiveChat,
                        hideVideoInfo,
                        hideVideoButtonsBar,
                        hideAskButton,
                        hideVideoChannelRow,
                        hideVideoDescription,
                        hideMerchTicketsOffers,
                        hideEndscreenVideowall,
                        hideEndscreenCards,
                        disableAutoplay,
                        disableAnnotations,
                        hideTopHeader,
                        hideNotificationBell,
                        hideExploreTrending,
                        hideMoreFromYouTube,
                        hideSubscriptions,
                        showQuickBlockButton,
                        hideSearchShelves,
                        contentFilters: sanitizedContentFilters,
                        categoryFilters: safeObject(categoryFilters)
                    });

                    const payload = {
                        enabled: compiledSettings.enabled,
                        uiKeywords: sanitizedKeywords,
                        filterKeywords: compiledSettings.filterKeywords,
                        filterKeywordsComments: compiledSettings.filterKeywordsComments,
                        filterChannels: compiledSettings.filterChannels,
                        hideAllShorts: compiledSettings.hideAllShorts,
                        hideAllComments: compiledSettings.hideAllComments,
                        filterComments: compiledSettings.filterComments,
                        hideHomeFeed: compiledSettings.hideHomeFeed,
                        hideSponsoredCards: compiledSettings.hideSponsoredCards,
                        hideWatchPlaylistPanel: compiledSettings.hideWatchPlaylistPanel,
                        hidePlaylistCards: compiledSettings.hidePlaylistCards,
                        hideMembersOnly: compiledSettings.hideMembersOnly,
                        hideMixPlaylists: compiledSettings.hideMixPlaylists,
                        hideVideoSidebar: compiledSettings.hideVideoSidebar,
                        hideRecommended: compiledSettings.hideRecommended,
                        hideLiveChat: compiledSettings.hideLiveChat,
                        hideVideoInfo: compiledSettings.hideVideoInfo,
                        hideVideoButtonsBar: compiledSettings.hideVideoButtonsBar,
                        hideAskButton: compiledSettings.hideAskButton,
                        hideVideoChannelRow: compiledSettings.hideVideoChannelRow,
                        hideVideoDescription: compiledSettings.hideVideoDescription,
                        hideMerchTicketsOffers: compiledSettings.hideMerchTicketsOffers,
                        hideEndscreenVideowall: compiledSettings.hideEndscreenVideowall,
                        hideEndscreenCards: compiledSettings.hideEndscreenCards,
                        disableAutoplay: compiledSettings.disableAutoplay,
                        disableAnnotations: compiledSettings.disableAnnotations,
                        hideTopHeader: compiledSettings.hideTopHeader,
                        hideNotificationBell: compiledSettings.hideNotificationBell,
                        hideExploreTrending: compiledSettings.hideExploreTrending,
                        hideMoreFromYouTube: compiledSettings.hideMoreFromYouTube,
                        hideSubscriptions: compiledSettings.hideSubscriptions,
                        showQuickBlockButton: compiledSettings.showQuickBlockButton,
                        hideSearchShelves: compiledSettings.hideSearchShelves,
                        [AUTO_BACKUP_KEY]: autoBackupEnabled === true
                    };

                    try {
                        const legacyStorage = {
                            ...safeObject(existing),
                            enabled: compiledSettings.enabled,
                            hideAllShorts: compiledSettings.hideAllShorts,
                            hideAllComments: compiledSettings.hideAllComments,
                            filterComments: compiledSettings.filterComments,
                            hideHomeFeed: compiledSettings.hideHomeFeed,
                            hideSponsoredCards: compiledSettings.hideSponsoredCards,
                            hideWatchPlaylistPanel: compiledSettings.hideWatchPlaylistPanel,
                            hidePlaylistCards: compiledSettings.hidePlaylistCards,
                            hideMembersOnly: compiledSettings.hideMembersOnly,
                            hideMixPlaylists: compiledSettings.hideMixPlaylists,
                            hideVideoSidebar: compiledSettings.hideVideoSidebar,
                            hideRecommended: compiledSettings.hideRecommended,
                            hideLiveChat: compiledSettings.hideLiveChat,
                            hideVideoInfo: compiledSettings.hideVideoInfo,
                            hideVideoButtonsBar: compiledSettings.hideVideoButtonsBar,
                            hideAskButton: compiledSettings.hideAskButton,
                            hideVideoChannelRow: compiledSettings.hideVideoChannelRow,
                            hideVideoDescription: compiledSettings.hideVideoDescription,
                            hideMerchTicketsOffers: compiledSettings.hideMerchTicketsOffers,
                            hideEndscreenVideowall: compiledSettings.hideEndscreenVideowall,
                            hideEndscreenCards: compiledSettings.hideEndscreenCards,
                            disableAutoplay: compiledSettings.disableAutoplay,
                            disableAnnotations: compiledSettings.disableAnnotations,
                            hideTopHeader: compiledSettings.hideTopHeader,
                            hideNotificationBell: compiledSettings.hideNotificationBell,
                            hideExploreTrending: compiledSettings.hideExploreTrending,
                            hideMoreFromYouTube: compiledSettings.hideMoreFromYouTube,
                            hideSubscriptions: compiledSettings.hideSubscriptions,
                            showQuickBlockButton: compiledSettings.showQuickBlockButton,
                            hideSearchShelves: compiledSettings.hideSearchShelves,
                            [FT_PROFILES_V3_KEY]: existing?.[FT_PROFILES_V3_KEY]
                        };
                        payload[FT_PROFILES_V4_KEY] = buildProfilesV4FromLegacyState(legacyStorage, sanitizedChannels, sanitizedKeywords);
                    } catch (e) {
                    }

                    STORAGE_NAMESPACE?.set(payload, () => {
                        const error = chrome.runtime?.lastError || null;
                        resolve({ compiledSettings, error });
                    });
                } catch (e) {
                    const compiledSettings = buildCompiledSettings({
                        keywords: sanitizedKeywords,
                        channels: sanitizedChannels,
                        enabled,
                        hideShorts,
                        hideComments,
                        filterComments,
                        hideHomeFeed,
                        hideSponsoredCards,
                        hideWatchPlaylistPanel,
                        hidePlaylistCards,
                        hideMembersOnly,
                        hideMixPlaylists,
                        hideVideoSidebar,
                        hideRecommended,
                        hideLiveChat,
                        hideVideoInfo,
                        hideVideoButtonsBar,
                        hideAskButton,
                        hideVideoChannelRow,
                        hideVideoDescription,
                        hideMerchTicketsOffers,
                        hideEndscreenVideowall,
                        hideEndscreenCards,
                        disableAutoplay,
                        disableAnnotations,
                        hideTopHeader,
                        hideNotificationBell,
                        hideExploreTrending,
                        hideMoreFromYouTube,
                        hideSubscriptions,
                        showQuickBlockButton,
                        hideSearchShelves,
                        contentFilters: sanitizedContentFilters,
                        categoryFilters: safeObject(categoryFilters)
                    });
                    resolve({ compiledSettings, error: e });
                }
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
        AUTO_BACKUP_KEY,
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
