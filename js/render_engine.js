/**
 * FilterTube Render Engine
 * Universal rendering logic for keywords and channels
 * 
 * This module provides adaptive rendering that works for both:
 * - Minimal UI (popup): Simple lists with basic controls
 * - Full UI (tab-view): Advanced lists with search, sort, and detailed info
 */

const RenderEngine = (() => {
    'use strict';

    // Get references to dependencies
    const getStateManager = () => window.StateManager;
    const getUIComponents = () => window.UIComponents;
    const getSettings = () => window.FilterTubeSettings || {};

    const scheduleIdle = (cb) => {
        if (typeof requestIdleCallback === 'function') {
            return requestIdleCallback(cb, { timeout: 250 });
        }
        return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 0);
    };

    const cancelIdle = (id) => {
        if (!id) return;
        if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
        else clearTimeout(id);
    };

    // ============================================================================
    // KEYWORD RENDERING
    // ============================================================================

    function safeTimestamp(value) {
        return (typeof value === 'number' && Number.isFinite(value)) ? value : 0;
    }

    function createPillBadge({ text, title, variantClass = '' }) {
        const badge = document.createElement('span');
        badge.className = `channel-derived-badge ${variantClass}`.trim();
        badge.textContent = text;
        if (title) badge.title = title;
        return badge;
    }

    function applySourceClasses(element, { channelDerived = false, sourceKey = null } = {}) {
        if (!element) return;
        if (channelDerived) element.classList.add('channel-derived');
        if (sourceKey === 'comments') element.classList.add('source-comments');
        if (sourceKey === 'kids') element.classList.add('source-kids');
    }

    function createSourceBadge({ sourceKey, title }) {
        const isFromComments = sourceKey === 'comments';
        const isKidsSynced = sourceKey === 'kids';
        return createPillBadge({
            text: isFromComments ? 'From Comments' : 'From Channel',
            title,
            variantClass: isFromComments
                ? 'badge-variant-comments'
                : (isKidsSynced ? 'badge-variant-kids' : '')
        });
    }

    function createKidsSyncBadge() {
        return createPillBadge({
            text: 'From Kids',
            title: 'This entry is synced from your YouTube Kids blocklist',
            variantClass: 'badge-variant-kids'
        });
    }

    /**
     * Render keyword list with adaptive UI
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Rendering options
     * @param {boolean} options.showSearch - Show search input
     * @param {boolean} options.showSort - Show sort dropdown
     * @param {boolean} options.minimal - Use minimal UI mode
     * @param {string} options.searchValue - Current search value
     * @param {string} options.sortValue - Current sort value
     */
    function renderKeywordList(container, options = {}) {
        if (!container) return;

        const StateManager = getStateManager();
        const state = StateManager?.getState() || { keywords: [], kids: { blockedKeywords: [], blockedChannels: [] } };
        const Settings = getSettings();

        const {
            showSearch = false,
            showSort = false,
            minimal = false,
            searchValue = '',
            sortValue = 'newest',
            dateFrom = null,
            dateTo = null,
            profile = 'main',
            includeToggles = true,
            onDelete = null
        } = options;

        // Filter and sort keywords
        const mainMode = state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const kidsMode = state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';

        const keywordsSource = profile === 'kids'
            ? (() => {
                if (kidsMode === 'whitelist') {
                    return Array.isArray(state.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [];
                }
                const base = Array.isArray(state.kids?.blockedKeywords) ? state.kids.blockedKeywords : [];
                const channels = Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : [];
                return (typeof Settings?.syncFilterAllKeywords === 'function')
                    ? Settings.syncFilterAllKeywords(base, channels)
                    : base;
            })()
            : (mainMode === 'whitelist'
                ? (Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : [])
                : state.keywords);
        let displayKeywords = [...keywordsSource];

        // If syncing Kids → Main, include ALL kids keywords (both blocked and whitelist)
        // Respect Main's mode: only show synced keywords in the active list view
        // Merge BEFORE sorting so Kids entries are interleaved by time
        if (profile !== 'kids' && state.syncKidsToMain) {
            const kidsBlockedKeywordsBase = Array.isArray(state.kids?.blockedKeywords) ? state.kids.blockedKeywords : [];
            const kidsBlockedChannels = Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : [];
            const kidsBlockedKeywords = (typeof Settings?.syncFilterAllKeywords === 'function')
                ? Settings.syncFilterAllKeywords(kidsBlockedKeywordsBase, kidsBlockedChannels)
                : kidsBlockedKeywordsBase;
            const kidsWhitelistKeywords = Array.isArray(state.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [];
            const allKidsKeywords = [...kidsBlockedKeywords, ...kidsWhitelistKeywords];
            // Use the appropriate main keywords based on mode
            const mainKeywords = mainMode === 'whitelist'
                ? (Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : [])
                : (Array.isArray(state.keywords) ? state.keywords : []);
            const seen = new Set(mainKeywords.map(k => (typeof k === 'object' ? k.word : String(k)).toLowerCase()));
            const kidsOnly = [];
            allKidsKeywords.forEach(k => {
                const word = typeof k === 'object' ? k.word : String(k);
                if (!seen.has(word.toLowerCase())) {
                    seen.add(word.toLowerCase());
                    if (k && typeof k === 'object') {
                        kidsOnly.push({ ...k, __ftFromKids: true });
                    } else {
                        kidsOnly.push({ word: String(k), exact: false, comments: true, __ftFromKids: true });
                    }
                }
            });
            displayKeywords = [...displayKeywords, ...kidsOnly];
        }

        // Apply search filter
        if (showSearch && searchValue) {
            const search = searchValue.toLowerCase();
            displayKeywords = displayKeywords.filter(k =>
                k.word.toLowerCase().includes(search)
            );
        }

        // Apply date filter
        if ((typeof dateFrom === 'number' && Number.isFinite(dateFrom)) || (typeof dateTo === 'number' && Number.isFinite(dateTo))) {
            const from = (typeof dateFrom === 'number' && Number.isFinite(dateFrom)) ? dateFrom : null;
            const to = (typeof dateTo === 'number' && Number.isFinite(dateTo)) ? dateTo : null;
            displayKeywords = displayKeywords.filter(entry => {
                const ts = safeTimestamp(entry.addedAt);
                if (from !== null && ts < from) return false;
                if (to !== null && ts > to) return false;
                return true;
            });
        }

        // Apply sorting - always sort by time for proper Kids/Main interleaving
        // showSort only controls whether sort UI dropdown is shown
        if (showSort && sortValue === 'az') {
            displayKeywords.sort((a, b) => a.word.localeCompare(b.word));
        } else if (showSort && sortValue === 'oldest') {
            displayKeywords.sort((a, b) => safeTimestamp(a.addedAt) - safeTimestamp(b.addedAt));
        } else {
            // Default: newest first (for proper interleaving of Kids entries)
            displayKeywords.sort((a, b) => safeTimestamp(b.addedAt) - safeTimestamp(a.addedAt));
        }

        // Clear container
        container.innerHTML = '';

        // Empty state
        if (displayKeywords.length === 0) {
            const emptyMsg = showSearch && searchValue
                ? 'No keywords found'
                : (() => {
                    if (profile === 'kids') {
                        return kidsMode === 'whitelist' ? 'No keywords allowed' : 'No keywords blocked';
                    }
                    return mainMode === 'whitelist' ? 'No keywords allowed' : 'No keywords blocked';
                })();

            if (minimal) {
                container.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
            } else {
                container.innerHTML = `<div class="empty-state-large" style="padding: 20px;">${emptyMsg}</div>`;
            }
            return;
        }

        // Render each keyword
        displayKeywords.forEach(entry => {
            const effectiveProfile = (profile !== 'kids' && entry?.__ftFromKids) ? 'kids' : profile;
            const item = createKeywordListItem(entry, { minimal, profile: effectiveProfile, includeToggles, onDelete });
            if (item instanceof Node) {
                container.appendChild(item);
            }
        });
    }

    /**
     * Create a single keyword list item
     * @param {Object} entry - Keyword entry
     * @param {Object} config - Configuration
     * @param {boolean} config.minimal - Use minimal UI
     * @returns {HTMLElement} List item element
     */
    function createKeywordListItem(entry, config = {}) {
        const {
            minimal = false,
            profile = 'main',
            includeToggles = true,
            onDelete = null
        } = config;
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();
        const Settings = getSettings();

        const isChannelDerived = entry.source === 'channel';
        const linkedChannel = isChannelDerived ? findChannelByRef(entry.channelRef) : null;
        const channelDerivedSourceKey = 'channel';

        // Create item container
        const item = document.createElement('div');
        item.className = minimal ? 'keyword-item' : 'list-item';
        applySourceClasses(item, {
            channelDerived: isChannelDerived,
            sourceKey: entry?.__ftFromKids ? 'kids' : null
        });

        // Left side: word and badges
        const left = document.createElement('div');
        left.className = minimal ? 'keyword-text' : 'item-left';

        const word = document.createElement('span');
        word.className = minimal ? '' : 'item-word';
        word.textContent = entry.word;

        if (minimal) {
            left.textContent = entry.word;
        } else {
            left.appendChild(word);
            if (entry?.__ftFromKids) {
                const kidsBadge = createKidsSyncBadge();
                if (kidsBadge instanceof Node) {
                    left.appendChild(kidsBadge);
                }
            }
        }

        // Right side: controls
        const controls = document.createElement('div');
        controls.className = minimal ? 'keyword-controls' : 'item-controls';

        const shouldShowToggles = includeToggles;
        const shouldShowCommentsToggle = shouldShowToggles && profile !== 'kids';

        const commentsEnabled = entry.comments !== false;
        let commentsToggle = null;
        if (shouldShowCommentsToggle) {
            const commentsToggleText = minimal ? 'C' : 'Comment';
            commentsToggle = UIComponents?.createToggleButton
                ? UIComponents.createToggleButton({
                    text: commentsToggleText,
                    active: commentsEnabled,
                    onToggle: async () => {
                        if (isChannelDerived) {
                            await StateManager?.toggleChannelFilterAllCommentsByRef?.(entry.channelRef);
                            return;
                        }
                        await StateManager?.toggleKeywordComments(entry.word);
                    },
                    className: 'toggle-variant-blue'
                })
                : (() => {
                    const toggle = document.createElement('div');
                    toggle.className = `exact-toggle toggle-variant-blue ${commentsEnabled ? 'active' : ''}`.trim();
                    toggle.textContent = commentsToggleText;
                    toggle.setAttribute('role', 'button');
                    toggle.setAttribute('aria-pressed', commentsEnabled);
                    toggle.setAttribute('tabindex', '0');
                    toggle.addEventListener('click', async () => {
                        if (isChannelDerived) {
                            await StateManager?.toggleChannelFilterAllCommentsByRef?.(entry.channelRef);
                            return;
                        }
                        await StateManager?.toggleKeywordComments(entry.word);
                    });
                    toggle.addEventListener('keydown', async (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isChannelDerived) {
                                await StateManager?.toggleChannelFilterAllCommentsByRef?.(entry.channelRef);
                                return;
                            }
                            await StateManager?.toggleKeywordComments(entry.word);
                        }
                    });
                    return toggle;
                })();

            commentsToggle.title = commentsEnabled
                ? 'Keyword applies to comment filtering'
                : 'Keyword does not apply to comment filtering';
        }

        if (isChannelDerived && shouldShowToggles && profile === 'kids') {
            const badge = createSourceBadge({
                sourceKey: channelDerivedSourceKey,
                title: 'Auto-added by "Filter All" - managed in Channel Management'
            });

            if (!minimal) {
                if (badge instanceof Node) controls.appendChild(badge);
            }

            if (!minimal) {
                const channel = linkedChannel;
                if (channel) {
                    const originLabel = document.createElement('span');
                    originLabel.className = 'channel-derived-origin';
                    originLabel.textContent = `Linked to ${channel.name || channel.handle || channel.id}`;
                    originLabel.title = `This keyword is automatically synced with channel's "Filter All" setting`;
                    left.appendChild(originLabel);
                }
            }
        } else if (isChannelDerived && shouldShowToggles && profile !== 'kids') {
            const badge = createSourceBadge({
                sourceKey: channelDerivedSourceKey,
                title: 'Auto-added by "Filter All Content" - managed in Channel Management'
            });
            if (commentsToggle) controls.appendChild(commentsToggle);

            if (!minimal) {
                if (badge instanceof Node) controls.appendChild(badge);
            }

            // In full UI, show channel origin
            if (!minimal) {
                const channel = linkedChannel;
                if (channel) {
                    const originLabel = document.createElement('span');
                    originLabel.className = 'channel-derived-origin';
                    originLabel.textContent = `Linked to ${channel.name || channel.handle || channel.id}`;
                    originLabel.title = `This keyword filters content mentioning "${entry.word}" - automatically synced with channel's "Filter All Content" setting`;
                    left.appendChild(originLabel);
                }
            }
        } else if (!isChannelDerived && shouldShowToggles) {
            // User keyword: show exact toggle and delete button

            // Exact toggle
            const exactToggleText = minimal ? 'E' : 'Exact';
            const exactToggle = UIComponents?.createToggleButton ?
                UIComponents.createToggleButton({
                    text: exactToggleText,
                    active: entry.exact,
                    onToggle: async () => {
                        if (profile === 'kids') {
                            await StateManager?.toggleKidsKeywordExact?.(entry.word);
                            return;
                        }
                        await StateManager?.toggleKeywordExact(entry.word);
                        // Re-render will be triggered by state change listener
                    },
                    className: minimal ? '' : ''
                }) :
                createFallbackExactToggle(entry, minimal, profile);

            // Delete button
            const deleteBtn = UIComponents?.createDeleteButton ?
                UIComponents.createDeleteButton(async () => {
                    if (profile === 'kids') {
                        await StateManager?.removeKidsKeyword?.(entry.word);
                        return;
                    }
                    await StateManager?.removeKeyword(entry.word);
                    // Re-render will be triggered by state change listener
                }) :
                createFallbackDeleteButton(async () => {
                    if (profile === 'kids') {
                        await StateManager?.removeKidsKeyword?.(entry.word);
                        return;
                    }
                    await StateManager?.removeKeyword(entry.word);
                });

            if (commentsToggle) controls.appendChild(commentsToggle);
            if (exactToggle instanceof Node) controls.appendChild(exactToggle);

            // In full UI, add semantic toggle (disabled for now)
            if (!minimal && profile !== 'kids') {
                const semanticToggle = document.createElement('div');
                semanticToggle.className = 'exact-toggle toggle-variant-purple';
                semanticToggle.textContent = 'Semantic';
                semanticToggle.title = 'Enable semantic matching (Coming Soon)';
                semanticToggle.style.opacity = '0.5';
                semanticToggle.style.cursor = 'not-allowed';
                controls.appendChild(semanticToggle);
            }

            if (deleteBtn instanceof Node) controls.appendChild(deleteBtn);
        }

        item.appendChild(left);
        item.appendChild(controls);

        return item;
    }

    // ============================================================================
    // CHANNEL RENDERING
    // ============================================================================

    /**
     * Render channel list with adaptive UI
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Rendering options
     */
    function renderChannelList(container, options = {}) {
        if (!container) return;

        cancelIdle(container.__ftChannelRenderTaskId);
        container.__ftChannelRenderTaskId = 0;
        container.__ftChannelRenderGen = (container.__ftChannelRenderGen || 0) + 1;
        const renderGen = container.__ftChannelRenderGen;

        const StateManager = getStateManager();
        const state = StateManager?.getState() || { channels: [], kids: { blockedChannels: [] } };
        const Settings = getSettings();

        const {
            showSearch = false,
            showSort = false,
            showNodeMapping = false,
            minimal = false,
            searchValue = '',
            sortValue = 'newest',
            dateFrom = null,
            dateTo = null,
            profile = 'main',
            onDelete = null
        } = options;

        const mainMode = state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const kidsMode = state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';

        const deriveChannelKey = (entry) => {
            try {
                if (Settings?.getChannelDerivedKey) return Settings.getChannelDerivedKey(entry);
            } catch (e) {
            }
            const id = (entry?.id || '').toLowerCase();
            const handle = (entry?.handle || '').toLowerCase();
            const customUrl = (entry?.customUrl || '').toLowerCase();
            const name = (entry?.name || '').toLowerCase();
            return id || handle || customUrl || name;
        };

        let channelsSource = profile === 'kids'
            ? (kidsMode === 'whitelist'
                ? (Array.isArray(state.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])
                : (state.kids?.blockedChannels || []))
            : (mainMode === 'whitelist'
                ? (Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [])
                : state.channels);

        // If syncing Kids → Main, include ALL kids channels (both blocked and whitelist)
        // Respect Main's mode: only show synced channels in the active list view
        // Merge BEFORE sorting so Kids entries are interleaved by time
        if (profile !== 'kids' && state.syncKidsToMain) {
            const kidsBlocked = Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : [];
            const kidsWhitelist = Array.isArray(state.kids?.whitelistChannels) ? state.kids.whitelistChannels : [];
            const allKidsChannels = [...kidsBlocked, ...kidsWhitelist];
            // Use the appropriate main channels based on mode
            const mainChannels = mainMode === 'whitelist'
                ? (Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [])
                : (Array.isArray(state.channels) ? state.channels : []);
            const seen = new Set(mainChannels.map(deriveChannelKey).filter(Boolean));
            const kidsOnly = [];
            allKidsChannels.forEach(ch => {
                const key = deriveChannelKey(ch);
                if (!key || seen.has(key)) return;
                seen.add(key);
                kidsOnly.push({ ...ch, __ftFromKids: true });
            });
            channelsSource = [...channelsSource, ...kidsOnly];
        }

        const { groups: collaborationGroups } = groupChannelsByCollaboration(state.channels);

        let displayChannels = [...channelsSource];

        if (showSearch && searchValue) {
            const search = searchValue.toLowerCase();
            displayChannels = displayChannels.filter(ch => {
                const name = (ch.name || '').toLowerCase();
                const id = (ch.id || '').toLowerCase();
                const handle = (ch.handle || '').toLowerCase();
                return name.includes(search) || id.includes(search) || handle.includes(search);
            });
        }

        if ((typeof dateFrom === 'number' && Number.isFinite(dateFrom)) || (typeof dateTo === 'number' && Number.isFinite(dateTo))) {
            const from = (typeof dateFrom === 'number' && Number.isFinite(dateFrom)) ? dateFrom : null;
            const to = (typeof dateTo === 'number' && Number.isFinite(dateTo)) ? dateTo : null;
            displayChannels = displayChannels.filter(entry => {
                const ts = safeTimestamp(entry.addedAt);
                if (from !== null && ts < from) return false;
                if (to !== null && ts > to) return false;
                return true;
            });
        }

        // Apply sorting - always sort by time for proper Kids/Main interleaving
        // showSort only controls whether sort UI dropdown is shown
        if (showSort && sortValue === 'az') {
            displayChannels.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        } else if (showSort && sortValue === 'oldest') {
            displayChannels.sort((a, b) => safeTimestamp(a.addedAt) - safeTimestamp(b.addedAt));
        } else {
            // Default: newest first (for proper interleaving of Kids entries)
            displayChannels.sort((a, b) => safeTimestamp(b.addedAt) - safeTimestamp(a.addedAt));
        }

        container.innerHTML = '';

        if (displayChannels.length === 0) {
            const emptyMsg = showSearch && searchValue
                ? 'No channels found'
                : (() => {
                    if (profile === 'kids') {
                        return kidsMode === 'whitelist' ? 'No channels allowed' : 'No channels blocked';
                    }
                    return mainMode === 'whitelist' ? 'No channels allowed' : 'No channels blocked';
                })();

            if (minimal) {
                container.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
            } else {
                container.innerHTML = `<div class="empty-state-large" style="padding: 20px;">${emptyMsg}</div>`;
            }
            return;
        }

        const mainIndexByRef = new Map();
        const mainList = (mainMode === 'whitelist')
            ? (Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [])
            : (Array.isArray(state.channels) ? state.channels : []);
        mainList.forEach((ch, idx) => mainIndexByRef.set(ch, idx));

        const kidsList = (kidsMode === 'whitelist')
            ? (Array.isArray(state.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])
            : (Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : []);
        const kidsIndexByRef = new Map();
        const kidsIndexByKey = new Map();
        kidsList.forEach((ch, idx) => {
            kidsIndexByRef.set(ch, idx);
            const key = deriveChannelKey(ch);
            if (key && !kidsIndexByKey.has(key)) kidsIndexByKey.set(key, idx);
        });

        const renderChannelRow = (channel) => {
            const isFromKids = !!channel?.__ftFromKids;
            const effectiveProfile = isFromKids ? 'kids' : profile;

            let listIndex = -1;
            if (effectiveProfile === 'kids') {
                const targetKey = deriveChannelKey(channel);
                if (targetKey && kidsIndexByKey.has(targetKey)) {
                    listIndex = kidsIndexByKey.get(targetKey);
                } else if (kidsIndexByRef.has(channel)) {
                    listIndex = kidsIndexByRef.get(channel);
                } else {
                    listIndex = kidsList.indexOf(channel);
                }
            } else {
                if (mainIndexByRef.has(channel)) {
                    listIndex = mainIndexByRef.get(channel);
                } else {
                    listIndex = mainList.indexOf(channel);
                }
            }

            const collaborationMeta = (effectiveProfile === 'kids') ? null : buildCollaborationMeta(channel, collaborationGroups);
            return createChannelListItem(channel, listIndex, {
                minimal,
                showNodeMapping,
                collaborationMeta,
                profile: effectiveProfile,
                onDelete
            });
        };

        let cursor = 0;
        const total = displayChannels.length;
        const batchSize = minimal ? 80 : 60;
        const minBatch = minimal ? 20 : 15;

        const processBatch = (deadline) => {
            if (container.__ftChannelRenderGen !== renderGen) return;

            const fragment = document.createDocumentFragment();
            let processed = 0;

            while (cursor < total && processed < batchSize) {
                const shouldYield = deadline
                    && !deadline.didTimeout
                    && typeof deadline.timeRemaining === 'function'
                    && processed >= minBatch
                    && deadline.timeRemaining() <= 4;
                if (shouldYield) break;

                const item = renderChannelRow(displayChannels[cursor]);
                cursor += 1;
                processed += 1;
                if (item instanceof Node) fragment.appendChild(item);
            }

            container.appendChild(fragment);

            if (cursor < total) {
                container.__ftChannelRenderTaskId = scheduleIdle(processBatch);
                return;
            }

            container.__ftChannelRenderTaskId = 0;
        };

        processBatch({ didTimeout: true, timeRemaining: () => 0 });
    }

    /**
     * Group channels by collaborationGroupId
     * @param {Array} channels - Array of channel objects
     * @returns {Object} { groups: Map<groupId, channels[]>, individual: channels[] }
     */
    function groupChannelsByCollaboration(channels) {
        const groups = new Map(); // groupId -> channels[]
        const individual = [];

        channels.forEach(channel => {
            if (channel.collaborationGroupId) {
                if (!groups.has(channel.collaborationGroupId)) {
                    groups.set(channel.collaborationGroupId, []);
                }
                groups.get(channel.collaborationGroupId).push(channel);
            } else {
                individual.push(channel);
            }
        });

        return { groups, individual };
    }

    function buildCollaborationMeta(channel, groups) {
        const groupId = channel?.collaborationGroupId;
        if (!groupId || !groups?.has(groupId)) return null;

        const currentMembers = groups.get(groupId) || [];
        const allCollaborators = Array.isArray(channel.allCollaborators) && channel.allCollaborators.length > 0
            ? channel.allCollaborators
            : currentMembers.map(member => ({ handle: member.handle, name: member.name, id: member.id }));

        const missingNames = [];
        const presentNames = [];

        allCollaborators.forEach(collab => {
            const displayName = collab.handle || collab.name || collab.id || 'Unknown';
            if (currentMembers.some(member => matchesCollaborator(member, collab))) {
                presentNames.push(displayName);
            } else {
                missingNames.push(displayName);
            }
        });

        const totalCount = allCollaborators.length || currentMembers.length;
        const presentCount = totalCount > 0
            ? totalCount - missingNames.length
            : currentMembers.length;

        const tooltipParts = [];
        if (allCollaborators.length > 0) {
            tooltipParts.push(`Originally blocked with: ${allCollaborators.map(c => c.handle || c.name || c.id || 'Unknown').join(', ')}`);
        }
        if (presentNames.length > 0) {
            tooltipParts.push(`Still blocked: ${presentNames.join(', ')}`);
        }
        if (missingNames.length > 0) {
            tooltipParts.push(`Missing now: ${missingNames.join(', ')}`);
        }

        return {
            groupId,
            totalCount: totalCount || presentCount,
            presentCount: presentCount || currentMembers.length,
            missingNames,
            isPartial: missingNames.length > 0,
            tooltip: tooltipParts.join('\n').trim()
        };
    }

    function matchesCollaborator(channel, collaborator) {
        if (!channel || !collaborator) return false;
        const channelHandle = (channel.handle || '').toLowerCase();
        const collabHandle = (collaborator.handle || '').toLowerCase();
        if (channelHandle && collabHandle && channelHandle === collabHandle) return true;

        if (channel.id && collaborator.id && channel.id === collaborator.id) return true;

        const channelName = (channel.name || '').toLowerCase();
        const collabName = (collaborator.name || '').toLowerCase();
        return !!channelName && !!collabName && channelName === collabName;
    }

    function createCollaborationBadge(meta) {
        if (!meta) return null;
        const badge = document.createElement('span');
        badge.className = 'collaboration-badge';
        badge.innerHTML = '<span class="icon">🤝</span>' +
            `<span class="badge-count">${meta.presentCount}/${meta.totalCount}</span>`;
        if (meta.tooltip) {
            badge.setAttribute('title', meta.tooltip);
        }
        return badge;
    }

    /**
     * Create a collaboration group container with yellow border
     * @param {Array} channels - Channels in this group
     * @param {string} groupId - The collaboration group ID
     * @param {Array} allChannels - All channels in state (for index lookup)
     * @param {Object} config - Configuration options
     * @returns {HTMLElement} Group container element
     */
    /**
     * Create a single channel list item
     * @param {Object} channel - Channel data
     * @param {number} index - Original index in state
     * @param {Object} config - Configuration
     * @returns {HTMLElement} List item element
     */
    function createChannelListItem(channel, index, config = {}) {
        const {
            minimal = false,
            showNodeMapping = false,
            collaborationMeta = null,
            profile = 'main'
        } = config;
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();

        if (minimal) {
            return createMinimalChannelItem(channel, index, collaborationMeta, profile);
        } else {
            return createFullChannelItem(channel, index, showNodeMapping, collaborationMeta, profile);
        }
    }

    /**
     * Create minimal channel item (for popup)
     */
    function createMinimalChannelItem(channel, index, collaborationMeta, profile) {
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();

        const item = document.createElement('div');
        item.className = 'keyword-item';
        applySourceClasses(item, {
            sourceKey: channel?.__ftFromKids ? 'kids' : (channel?.source === 'comments' ? 'comments' : null)
        });
        if (channel.collaborationGroupId) {
            item.classList.add('collaboration-member');
            item.setAttribute('data-collaboration-group-id', channel.collaborationGroupId);
        }
        if (collaborationMeta?.isPartial) {
            item.classList.add('collaboration-partial');
        }
        const tooltipParts = [];
        if (collaborationMeta?.tooltip) {
            tooltipParts.push(collaborationMeta.tooltip);
        }
        const topicTooltip = getTopicChannelTooltip(channel);
        if (topicTooltip) {
            tooltipParts.push(topicTooltip);
        }
        if (tooltipParts.length > 0) {
            item.setAttribute('title', tooltipParts.join('\n'));
        }

        const text = document.createElement('span');
        text.className = 'keyword-text';
        const displayName = (channel.name && channel.name !== channel.id)
            ? channel.name
            : (channel.handle || channel.customUrl || channel.id);
        text.textContent = displayName;

        const controls = document.createElement('div');
        controls.className = 'keyword-controls';

        const deleteHandler = async () => {
            if (profile === 'kids') {
                await StateManager?.removeKidsChannel?.(index);
                return;
            }
            await StateManager?.removeChannel(index);
        };

        const deleteBtn = UIComponents?.createDeleteButton
            ? UIComponents.createDeleteButton(deleteHandler)
            : createFallbackDeleteButton(deleteHandler);

        controls.appendChild(deleteBtn);

        item.appendChild(text);
        item.appendChild(controls);

        return item;
    }

    /**
     * Create full channel item (for tab-view)
     */
    function createFullChannelItem(channel, index, showNodeMapping, collaborationMeta, profile) {
        const StateManager = getStateManager();
        const Settings = getSettings();

        const item = document.createElement('div');
        item.className = 'list-item channel-item';
        applySourceClasses(item, {
            sourceKey: channel?.__ftFromKids ? 'kids' : (channel?.source === 'comments' ? 'comments' : null)
        });
        if (collaborationMeta) {
            item.classList.add('collaboration-entry');
            if (collaborationMeta.isPartial) {
                item.classList.add('collaboration-partial');
            }
            const tooltipParts = [];
            if (collaborationMeta.tooltip) {
                tooltipParts.push(collaborationMeta.tooltip);
            }
            const topicTooltip = getTopicChannelTooltip(channel);
            if (topicTooltip) {
                tooltipParts.push(topicTooltip);
            }
            if (tooltipParts.length > 0) {
                item.setAttribute('title', tooltipParts.join('\n'));
            }
        }
        if (!collaborationMeta) {
            const topicTooltip = getTopicChannelTooltip(channel);
            if (topicTooltip) {
                item.setAttribute('title', topicTooltip);
            }
        }

        // Header row: Logo + Name + Delete
        const headerRow = document.createElement('div');
        headerRow.className = 'channel-header-row';

        const infoGroup = document.createElement('div');
        infoGroup.className = 'channel-info-group';

        // Logo
        const logoImg = document.createElement('img');
        logoImg.className = 'channel-logo';
        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
        logoImg.src = channel.logo || defaultAvatar;
        logoImg.onerror = () => { logoImg.src = defaultAvatar; };

        // Name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'channel-name';
        nameSpan.textContent = (channel.name && channel.name !== channel.id)
            ? channel.name
            : (channel.handle || channel.customUrl || channel.id);

        infoGroup.appendChild(logoImg);
        infoGroup.appendChild(nameSpan);

        if (channel?.__ftFromKids) {
            const badge = createKidsSyncBadge();
            if (badge instanceof Node) infoGroup.appendChild(badge);
        }

        if (channel?.source === 'comments') {
            infoGroup.appendChild(createSourceBadge({
                sourceKey: 'comments',
                title: 'This channel was blocked from the YouTube comments menu'
            }));
        }

        if (collaborationMeta) {
            const badge = createCollaborationBadge(collaborationMeta);
            if (badge) {
                infoGroup.appendChild(badge);
            }
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', async () => {
            if (profile === 'kids') {
                await StateManager?.removeKidsChannel?.(index);
                return;
            }
            await StateManager?.removeChannel(index);
        });

        headerRow.appendChild(infoGroup);
        headerRow.appendChild(deleteBtn);
        item.appendChild(headerRow);

        // Body row: Node mapping + Filter All toggle
        const bodyRow = document.createElement('div');
        bodyRow.className = 'channel-body-row';

        // Node mapping (if enabled)
        if (showNodeMapping) {
            const nodeContainer = createNodeMapping(channel);
            bodyRow.appendChild(nodeContainer);
        }

        // Filter All toggle
        const filterAllToggle = createFilterAllToggle(channel, index, profile);
        bodyRow.appendChild(filterAllToggle);

        item.appendChild(bodyRow);

        return item;
    }

    /**
     * Create node mapping visualization
     */
    function createNodeMapping(channel) {
        const Settings = getSettings();
        const state = getStateManager()?.getState() || {};

        const nodeContainer = document.createElement('div');
        nodeContainer.className = 'channel-node-container';

        // Determine source and target
        const mapping = deriveChannelMapping(channel, state.channelMap);

        // Source text (what user entered)
        const sourceText = document.createElement('span');
        sourceText.className = 'node-source-text';
        sourceText.textContent = mapping.source;
        sourceText.title = 'What you entered';

        // Connector arrow
        const connector = document.createElement('span');
        connector.className = `node-connector ${mapping.isResolved ? 'active' : ''}`;
        connector.innerHTML = '→';

        // Target badge (fetched ID)
        const targetBadge = document.createElement('span');
        if (mapping.isResolved) {
            targetBadge.className = 'node-badge resolved';
            targetBadge.textContent = mapping.target;
            if (isTopicChannel(channel)) {
                targetBadge.title = getTopicChannelTooltip(channel);
            } else {
                targetBadge.title = 'Fetched ID';
            }
        } else {
            targetBadge.className = 'node-source-text';
            targetBadge.textContent = mapping.target || 'Not fetched';
            targetBadge.style.opacity = '0.5';
        }

        nodeContainer.appendChild(sourceText);
        nodeContainer.appendChild(connector);
        nodeContainer.appendChild(targetBadge);

        return nodeContainer;
    }

    /**
     * Create Filter All Content toggle
     */
    function createFilterAllToggle(channel, index, profile = 'main') {
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();
        const state = StateManager?.getState?.() || {};
        const mainMode = state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const kidsMode = state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';

        // For synced channels (__ftFromKids), use Main's mode since they're displayed in Main's list
        const isFromKids = !!channel?.__ftFromKids;
        const effectiveMode = isFromKids ? mainMode : (profile === 'kids' ? kidsMode : mainMode);

        if (effectiveMode === 'whitelist') {
            const spacer = document.createElement('div');
            spacer.className = 'filter-all-toggle disabled';
            spacer.style.visibility = 'hidden';
            spacer.textContent = 'Filter All';
            return spacer;
        }

        // Use pill toggle with red variant (no label text)
        const pillToggle = UIComponents?.createToggleButton ?
            UIComponents.createToggleButton({
                text: 'Filter All',
                active: channel.filterAll || false,
                onToggle: async () => {
                    if (profile === 'kids') {
                        await StateManager?.toggleKidsChannelFilterAll?.(index);
                        return;
                    }
                    await StateManager?.toggleChannelFilterAll(index);
                },
                className: 'toggle-variant-red',
                title: `Automatically adds "${channel.name || channel.handle || channel.id}" as a fuzzy keyword filter - hides any content mentioning this channel name`
            }) :
            createFallbackFilterAllToggle(channel, index, profile);

        return pillToggle;
    }

    /**
     * Fallback Filter All toggle
     */
    function createFallbackFilterAllToggle(channel, index, profile = 'main') {
        const StateManager = getStateManager();
        const state = StateManager?.getState?.() || {};
        const mainMode = state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const kidsMode = state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';

        // For synced channels (__ftFromKids), use Main's mode since they're displayed in Main's list
        const isFromKids = !!channel?.__ftFromKids;
        const effectiveMode = isFromKids ? mainMode : (profile === 'kids' ? kidsMode : mainMode);

        if (effectiveMode === 'whitelist') {
            const spacer = document.createElement('div');
            spacer.className = 'exact-toggle toggle-variant-red disabled';
            spacer.style.visibility = 'hidden';
            spacer.textContent = 'Filter All';
            return spacer;
        }
        const toggle = document.createElement('div');
        toggle.className = `exact-toggle toggle-variant-red ${channel.filterAll ? 'active' : ''}`;
        toggle.textContent = 'Filter All';
        toggle.title = `Automatically adds "${channel.name || channel.handle || channel.id}" as a fuzzy keyword filter - hides any content mentioning this channel name`;
        toggle.addEventListener('click', async () => {
            if (profile === 'kids') {
                await StateManager?.toggleKidsChannelFilterAll?.(index);
                return;
            }
            await StateManager?.toggleChannelFilterAll(index);
        });
        return toggle;
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function isTopicChannel(channel) {
        if (channel?.topicChannel === true) return true;
        const name = typeof channel?.name === 'string' ? channel.name.trim() : '';
        const id = typeof channel?.id === 'string' ? channel.id.trim() : '';
        const handle = typeof channel?.handle === 'string' ? channel.handle.trim() : '';
        const customUrl = typeof channel?.customUrl === 'string' ? channel.customUrl.trim() : '';
        if (!name || !/\s-\sTopic$/i.test(name)) return false;
        if (handle || customUrl) return false;
        return Boolean(id && id.toUpperCase().startsWith('UC'));
    }

    function getTopicChannelTooltip(channel) {
        if (!isTopicChannel(channel)) return '';
        return 'Topic channels do not have @handles or custom URLs. The UC ID is the canonical identifier.';
    }

    /**
     * Find channel by channelRef
     */
    function findChannelByRef(channelRef) {
        const state = getStateManager()?.getState() || { channels: [], kids: { blockedChannels: [] } };
        const Settings = getSettings();

        if (!channelRef || !Settings.getChannelDerivedKey) return null;

        const mainChannels = Array.isArray(state.channels) ? state.channels : [];
        const kidsChannels = Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : [];
        const allChannels = [...mainChannels, ...kidsChannels];

        return allChannels.find(ch => {
            const key = Settings.getChannelDerivedKey(ch);
            return key === channelRef;
        });
    }

    /**
     * Derive channel mapping for visualization
     */
    function deriveChannelMapping(channel, channelMap = {}) {
        // Prefer to show what the user typed (originalInput) → what we resolved (id/handle/customUrl)
        const originalInput = channel.originalInput || channel.customUrl || channel.handle || channel.id;
        const fetchedId = channel.id;
        const fetchedHandle = channel.handle || channel.canonicalHandle || channel.handleDisplay || null;
        const customUrl = channel.customUrl;
        const topicName = typeof channel?.name === 'string' ? channel.name.trim() : '';
        const isTopic = isTopicChannel(channel);

        let source = originalInput;
        let target = null;
        let isResolved = false;

        const inputLooksLikeUc = Boolean(originalInput && originalInput.toUpperCase().startsWith('UC'));
        const inputLooksLikeWatch = Boolean(originalInput && /^watch:[a-zA-Z0-9_-]{11}$/.test(originalInput));
        const inputLooksLikeVideoId = Boolean(originalInput && /^[a-zA-Z0-9_-]{11}$/.test(originalInput));
        const hasCustomUrl = Boolean(customUrl);

        // Case: input was a watch placeholder / bare videoId, resolved to UC ID
        if ((inputLooksLikeWatch || inputLooksLikeVideoId) && fetchedId) {
            source = originalInput;
            target = fetchedId;
            isResolved = true;
        }

        // Case: input was UC ID, resolved to handle (or display handle)
        else if (inputLooksLikeUc && fetchedHandle) {
            source = originalInput;
            target = fetchedHandle;
            isResolved = true;
        }
        // Case: Topic channels (UC ID + "- Topic" name) count as resolved
        else if (inputLooksLikeUc && !fetchedHandle && isTopic) {
            source = originalInput;
            target = topicName;
            isResolved = true;
        }
        // Case: input was handle, resolved to UC ID
        else if (originalInput && originalInput.startsWith('@') && fetchedId && fetchedId !== originalInput) {
            source = originalInput;
            target = fetchedId;
            isResolved = true;
        }
        // Case: input was UC ID, no handle but we learned customUrl
        else if (inputLooksLikeUc && hasCustomUrl) {
            source = originalInput;
            target = customUrl;
            isResolved = true;
        }
        // Case: input was customUrl c/ or user/, resolved to UC ID
        else if (originalInput && (originalInput.startsWith('c/') || originalInput.startsWith('user/')) && fetchedId) {
            source = originalInput;
            target = fetchedId;
            isResolved = true;
        }
        // Case: we learned customUrl separately; show it if the input was something else
        else if (customUrl && fetchedId && customUrl !== originalInput) {
            source = customUrl;
            target = fetchedId;
            isResolved = true;
        }
        // Fallback to channelMap if we have a mapping.
        // NOTE: channelMap stores both directions (UC -> @handle AND @handle -> UC).
        else if (channelMap && originalInput) {
            const key = String(originalInput).toLowerCase();
            const direct = channelMap[key];
            if (direct) {
                source = originalInput;
                target = direct;
                isResolved = true;
            } else if (fetchedId) {
                const byId = channelMap[String(fetchedId).toLowerCase()];
                if (byId) {
                    source = originalInput;
                    target = byId;
                    isResolved = true;
                }
            }
        }

        // If source and target are identical (e.g., UC... → UC...), treat as unresolved to avoid noisy arrow
        if (target === source) {
            target = null;
            isResolved = false;
        }

        // If nothing resolved, still show source
        return { source, target, isResolved };
    }

    /**
     * Fallback exact toggle (if UIComponents not available)
     */
    function createFallbackExactToggle(entry, minimal, profile = 'main') {
        const StateManager = getStateManager();
        const toggle = document.createElement('div');
        toggle.className = `exact-toggle ${entry.exact ? 'active' : ''}`;
        toggle.textContent = minimal ? 'E' : 'Exact';
        toggle.title = 'Exact word matching';
        toggle.addEventListener('click', async () => {
            if (profile === 'kids') {
                await StateManager?.toggleKidsKeywordExact?.(entry.word);
                return;
            }
            await StateManager?.toggleKeywordExact(entry.word);
        });
        toggle.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (profile === 'kids') {
                    await StateManager?.toggleKidsKeywordExact?.(entry.word);
                    return;
                }
                await StateManager?.toggleKeywordExact(entry.word);
            }
        });
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.setAttribute('aria-pressed', entry.exact ? 'true' : 'false');
        return toggle;
    }

    /**
     * Fallback delete button (if UIComponents not available)
     */
    function createFallbackDeleteButton(onClick) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        deleteBtn.addEventListener('click', onClick);
        return deleteBtn;
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        renderKeywordList,
        renderChannelList,
        createKeywordListItem,
        createChannelListItem
    };
})();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.RenderEngine = RenderEngine;
}
