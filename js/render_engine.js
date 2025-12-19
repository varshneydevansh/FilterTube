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

    // ============================================================================
    // KEYWORD RENDERING
    // ============================================================================

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
        const state = StateManager?.getState() || { keywords: [] };

        const {
            showSearch = false,
            showSort = false,
            minimal = false,
            searchValue = '',
            sortValue = 'newest'
        } = options;

        // Filter and sort keywords
        let displayKeywords = [...state.keywords];

        // Apply search filter
        if (showSearch && searchValue) {
            const search = searchValue.toLowerCase();
            displayKeywords = displayKeywords.filter(k =>
                k.word.toLowerCase().includes(search)
            );
        }

        // Apply sorting
        if (showSort) {
            if (sortValue === 'az') {
                displayKeywords.sort((a, b) => a.word.localeCompare(b.word));
            } else if (sortValue === 'oldest') {
                displayKeywords.reverse();
            }
            // 'newest' is default order (no change needed)
        }

        // Clear container
        container.innerHTML = '';

        // Empty state
        if (displayKeywords.length === 0) {
            const emptyMsg = showSearch && searchValue
                ? 'No keywords found'
                : 'No keywords added';

            if (minimal) {
                container.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
            } else {
                container.innerHTML = `<div class="empty-state-large" style="padding: 20px;">${emptyMsg}</div>`;
            }
            return;
        }

        // Render each keyword
        displayKeywords.forEach(entry => {
            const item = createKeywordListItem(entry, { minimal });
            container.appendChild(item);
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
        const { minimal = false } = config;
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();
        const Settings = getSettings();

        const isChannelDerived = entry.source === 'channel';

        // Create item container
        const item = document.createElement('div');
        item.className = minimal ? 'keyword-item' : 'list-item';
        if (isChannelDerived) item.classList.add('channel-derived');

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
        }

        // Right side: controls
        const controls = document.createElement('div');
        controls.className = minimal ? 'keyword-controls' : 'item-controls';

        if (isChannelDerived) {
            // Channel-derived keyword: show badge only
            const badge = document.createElement('span');
            badge.className = 'channel-derived-badge';
            badge.textContent = 'From Channel';
            badge.title = 'Auto-added by "Filter All Content" - managed in Channel Management';


            controls.appendChild(badge);

            // In full UI, show channel origin
            if (!minimal) {
                const channel = findChannelByRef(entry.channelRef);
                if (channel) {
                    const originLabel = document.createElement('span');
                    originLabel.className = 'channel-derived-origin';
                    originLabel.textContent = `Linked to ${channel.name || channel.handle || channel.id}`;
                    originLabel.title = `This keyword filters content mentioning "${entry.word}" - automatically synced with channel's "Filter All Content" setting`;
                    left.appendChild(originLabel);
                }
            }
        } else {
            // User keyword: show exact toggle and delete button

            // Exact toggle
            const exactToggle = UIComponents?.createToggleButton ?
                UIComponents.createToggleButton({
                    text: 'Exact',
                    active: entry.exact,
                    onToggle: async () => {
                        await StateManager?.toggleKeywordExact(entry.word);
                        // Re-render will be triggered by state change listener
                    },
                    className: minimal ? '' : ''
                }) :
                createFallbackExactToggle(entry, minimal);

            // Delete button
            const deleteBtn = UIComponents?.createDeleteButton ?
                UIComponents.createDeleteButton(async () => {
                    await StateManager?.removeKeyword(entry.word);
                    // Re-render will be triggered by state change listener
                }) :
                createFallbackDeleteButton(async () => {
                    await StateManager?.removeKeyword(entry.word);
                });

            controls.appendChild(exactToggle);

            // In full UI, add semantic toggle (disabled for now)
            if (!minimal) {
                const semanticToggle = document.createElement('div');
                semanticToggle.className = 'exact-toggle toggle-variant-purple';
                semanticToggle.textContent = 'Semantic';
                semanticToggle.title = 'Enable semantic matching (Coming Soon)';
                semanticToggle.style.opacity = '0.5';
                semanticToggle.style.cursor = 'not-allowed';
                controls.appendChild(semanticToggle);
            }

            controls.appendChild(deleteBtn);
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

        const StateManager = getStateManager();
        const state = StateManager?.getState() || { channels: [] };
        const { groups: collaborationGroups } = groupChannelsByCollaboration(state.channels);

        const {
            showSearch = false,
            showSort = false,
            showNodeMapping = false,
            minimal = false,
            searchValue = '',
            sortValue = 'newest'
        } = options;

        // Filter and sort channels
        let displayChannels = [...state.channels];

        // Apply search filter
        if (showSearch && searchValue) {
            const search = searchValue.toLowerCase();
            displayChannels = displayChannels.filter(ch => {
                const name = (ch.name || '').toLowerCase();
                const id = (ch.id || '').toLowerCase();
                const handle = (ch.handle || '').toLowerCase();
                return name.includes(search) || id.includes(search) || handle.includes(search);
            });
        }

        // Apply sorting
        if (showSort) {
            if (sortValue === 'az') {
                displayChannels.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
            } else if (sortValue === 'oldest') {
                displayChannels.reverse();
            }
        }

        // Clear container
        container.innerHTML = '';

        // Empty state
        if (displayChannels.length === 0) {
            const emptyMsg = showSearch && searchValue
                ? 'No channels found'
                : 'No channels blocked';

            if (minimal) {
                container.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
            } else {
                container.innerHTML = `<div class="empty-state-large" style="padding: 20px;">${emptyMsg}</div>`;
            }
            return;
        }

        const renderChannelRow = (channel) => {
            const originalIndex = state.channels.indexOf(channel);
            const collaborationMeta = buildCollaborationMeta(channel, collaborationGroups);
            return createChannelListItem(channel, originalIndex, {
                minimal,
                showNodeMapping,
                collaborationMeta
            });
        };

        // Popup/minimal mode renders a flat list with subtle indicators only
        if (minimal) {
            displayChannels.forEach(channel => {
                const item = renderChannelRow(channel);
                container.appendChild(item);
            });
            return;
        }

        // Render channels in the exact order of the filtered/sorted list.
        displayChannels.forEach(channel => {
            const item = renderChannelRow(channel);
            container.appendChild(item);
        });
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
            collaborationMeta = null
        } = config;
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();

        if (minimal) {
            return createMinimalChannelItem(channel, index, collaborationMeta);
        } else {
            return createFullChannelItem(channel, index, showNodeMapping, collaborationMeta);
        }
    }

    /**
     * Create minimal channel item (for popup)
     */
    function createMinimalChannelItem(channel, index, collaborationMeta) {
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();

        const item = document.createElement('div');
        item.className = 'keyword-item';
        if (channel.collaborationGroupId) {
            item.classList.add('collaboration-member');
            item.setAttribute('data-collaboration-group-id', channel.collaborationGroupId);
        }
        if (collaborationMeta?.isPartial) {
            item.classList.add('collaboration-partial');
        }
        if (collaborationMeta?.tooltip) {
            item.setAttribute('title', collaborationMeta.tooltip);
        }

        const text = document.createElement('span');
        text.className = 'keyword-text';
        const displayName = (channel.name && channel.name !== channel.id)
            ? channel.name
            : (channel.handle || channel.id);
        text.textContent = displayName;

        const controls = document.createElement('div');
        controls.className = 'keyword-controls';

        const deleteBtn = UIComponents?.createDeleteButton ?
            UIComponents.createDeleteButton(async () => {
                await StateManager?.removeChannel(index);
            }) :
            createFallbackDeleteButton(async () => {
                await StateManager?.removeChannel(index);
            });

        controls.appendChild(deleteBtn);

        item.appendChild(text);
        item.appendChild(controls);

        return item;
    }

    /**
     * Create full channel item (for tab-view)
     */
    function createFullChannelItem(channel, index, showNodeMapping, collaborationMeta) {
        const StateManager = getStateManager();
        const Settings = getSettings();

        const item = document.createElement('div');
        item.className = 'list-item channel-item';
        if (collaborationMeta) {
            item.classList.add('collaboration-entry');
            if (collaborationMeta.isPartial) {
                item.classList.add('collaboration-partial');
            }
            if (collaborationMeta.tooltip) {
                item.setAttribute('title', collaborationMeta.tooltip);
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
            : channel.id;

        infoGroup.appendChild(logoImg);
        infoGroup.appendChild(nameSpan);

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
        const filterAllToggle = createFilterAllToggle(channel, index);
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
            targetBadge.title = 'Fetched ID';
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
    function createFilterAllToggle(channel, index) {
        const StateManager = getStateManager();
        const UIComponents = getUIComponents();

        // Use pill toggle with red variant (no label text)
        const pillToggle = UIComponents?.createToggleButton ?
            UIComponents.createToggleButton({
                text: 'Filter All Content',
                active: channel.filterAll || false,
                onToggle: async () => {
                    await StateManager?.toggleChannelFilterAll(index);
                },
                className: 'toggle-variant-red',
                title: `Automatically adds "${channel.name || channel.handle || channel.id}" as a fuzzy keyword filter - hides any content mentioning this channel name`
            }) :
            createFallbackFilterAllToggle(channel, index);

        return pillToggle;
    }

    /**
     * Fallback Filter All toggle
     */
    function createFallbackFilterAllToggle(channel, index) {
        const StateManager = getStateManager();
        const toggle = document.createElement('div');
        toggle.className = `exact-toggle toggle-variant-red ${channel.filterAll ? 'active' : ''}`;
        toggle.textContent = 'Filter All Content';
        toggle.title = `Automatically adds "${channel.name || channel.handle || channel.id}" as a fuzzy keyword filter - hides any content mentioning this channel name`;
        toggle.addEventListener('click', async () => {
            await StateManager?.toggleChannelFilterAll(index);
        });
        return toggle;
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Find channel by channelRef
     */
    function findChannelByRef(channelRef) {
        const state = getStateManager()?.getState() || { channels: [] };
        const Settings = getSettings();

        if (!channelRef || !Settings.getChannelDerivedKey) return null;

        return state.channels.find(ch => {
            const key = Settings.getChannelDerivedKey(ch);
            return key === channelRef;
        });
    }

    /**
     * Derive channel mapping for visualization
     */
    function deriveChannelMapping(channel, channelMap = {}) {
        // Prioritize customUrl for c/Name channels, then handle, then id
        const originalInput = channel.originalInput || channel.customUrl || channel.handle || channel.id;
        const fetchedId = channel.id;
        const fetchedHandle = channel.handle;
        const customUrl = channel.customUrl;

        let source = originalInput;
        let target = fetchedId;
        let isResolved = false;

        // Check if we successfully fetched details
        if (fetchedId && fetchedId !== originalInput) {
            // Case 1: Input was @handle or c/Name, resolved to UC ID
            isResolved = true;
            target = fetchedId;
        } else if (originalInput && originalInput.toUpperCase().startsWith('UC') && fetchedHandle) {
            // Case 2: Input was UC ID, resolved to @handle (Better visualization)
            isResolved = true;
            target = fetchedHandle;
        } else if (originalInput && originalInput.toUpperCase().startsWith('UC') && customUrl) {
            // Case 3: Input was UC ID, but we have customUrl - show customUrl → UC ID
            source = customUrl;
            target = fetchedId;
            isResolved = true;
        } else if (channelMap && originalInput && channelMap[originalInput.toLowerCase()]) {
            // Case 4: Fallback to map
            isResolved = true;
            target = channelMap[originalInput.toLowerCase()];
        }

        return { source, target, isResolved };
    }

    /**
     * Fallback exact toggle (if UIComponents not available)
     */
    function createFallbackExactToggle(entry, minimal) {
        const exactToggle = document.createElement('div');
        exactToggle.className = `exact-toggle ${entry.exact ? 'active' : ''}`;
        exactToggle.textContent = 'Exact';
        exactToggle.title = entry.exact
            ? `Exact match: Only filters "${entry.word}" as a complete word`
            : `Partial match: Filters "${entry.word}" anywhere in text`;
        exactToggle.addEventListener('click', async () => {
            const StateManager = getStateManager();
            await StateManager?.toggleKeywordExact(entry.word);
        });
        return exactToggle;
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
