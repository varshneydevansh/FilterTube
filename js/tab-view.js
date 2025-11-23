// js/tab-view.js

/**
 * Initialize the tabbed interface for Filters page
 */
function initializeFiltersTabs() {
    const container = document.getElementById('filtersTabsContainer');
    if (!container) return;

    // Create Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="card full-width">
            <div class="card-header">
                <h3>Keyword Management</h3>
                <div class="card-actions">
                    <button id="clearAllKeywordsBtn" class="btn-text danger">Clear All</button>
                </div>
            </div>
            <div class="card-body">
                <div class="input-row">
                    <input type="text" id="advancedKeywordInput" class="text-input"
                        placeholder="Add a keyword to filter...">
                    <button id="advancedAddBtn" class="btn-primary">Add</button>
                </div>

                <div class="filter-controls">
                    <input type="text" id="searchKeywords" class="search-input"
                        placeholder="Search your keywords...">
                    <div class="sort-controls">
                        <span class="label">Sort by:</span>
                        <select id="sortKeywords" class="select-input">
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A-Z</option>
                        </select>
                    </div>
                </div>

                <div id="advancedKeywordList" class="advanced-list">
                    <!-- Keywords injected here -->
                </div>
            </div>
        </div>
    `;

    // Create Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="card full-width">
            <div class="card-header">
                <h3>Channel Management</h3>
                <div class="card-actions">
                    <button id="clearAllChannelsBtn" class="btn-text danger">Clear All</button>
                </div>
            </div>
            <div class="card-body">
                <div class="input-row">
                    <input type="text" id="channelInput" class="text-input"
                        placeholder="Add @handle or UCxxxxx... (we'll fetch the name!)">
                    <button id="addChannelBtn" class="btn-primary">Add</button>
                </div>
                <p class="hint-text" style="margin-top: 8px; font-size: 0.85em; opacity: 0.7;">
                    💡 Enter a channel UC ID and we'll automatically fetch the channel name for you!
                </p>

                <div class="filter-controls">
                    <input type="text" id="searchChannels" class="search-input"
                        placeholder="Search your channels...">
                    <div class="sort-controls">
                        <span class="label">Sort by:</span>
                        <select id="channelSort" class="select-input">
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A-Z</option>
                        </select>
                    </div>
                </div>

                <div id="channelList" class="advanced-list">
                    <!-- Channels injected here -->
                </div>
            </div>
        </div>
    `;

    // Create tabs using UIComponents
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keywords', content: keywordsContent },
            { id: 'channels', label: 'Channels', content: channelsContent }
        ],
        defaultTab: 'keywords',
        onTabChange: (tabId) => {
            // Optional: track tab changes
            console.log('Switched to tab:', tabId);
        }
    });

    container.appendChild(tabs.container);
}

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Initialize Filters Tabs (Keywords | Channels)
     */
    initializeFiltersTabs();

    /**
     * Navigation handling
     */
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const views = new Map(Array.from(document.querySelectorAll('.view-section')).map(view => [view.id, view]));
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-tab');
            views.forEach(view => view.classList.remove('active'));
            const targetView = views.get(`${targetId}View`);
            if (targetView) targetView.classList.add('active');

            if (pageTitle) {
                const label = item.querySelector('.nav-label');
                pageTitle.textContent = label ? label.textContent : 'FilterTube';
            }
        });
    });

    /**
     * Shared state & element references
     */
    const state = {
        keywords: [],
        channels: [],
        sort: 'newest',
        theme: 'light'
    };

    // Global channelMap for visual node mapping
    let globalChannelMap = {};

    // Ensure settings are loaded before performing write operations
    let settingsReady = false;
    let settingsLoadingPromise = null;

    const keywordListEl = document.getElementById('advancedKeywordList');
    const keywordInput = document.getElementById('advancedKeywordInput');
    const addKeywordBtn = document.getElementById('advancedAddBtn');
    const clearKeywordsBtn = document.getElementById('clearAllKeywordsBtn');
    const searchInput = document.getElementById('searchKeywords');
    const sortSelect = document.getElementById('sortKeywords');

    const channelListEl = document.getElementById('channelList');
    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelSort = document.getElementById('channelSort');
    const searchChannels = document.getElementById('searchChannels');
    const clearChannelsBtn = document.getElementById('clearAllChannelsBtn');
    const hideShortsToggle = document.getElementById('settingHideShorts');
    const hideCommentsToggle = document.getElementById('settingHideComments');
    const filterCommentsToggle = document.getElementById('settingFilterComments');

    const statActiveKeywords = document.getElementById('statActiveKeywords');
    const statFilteredChannels = document.getElementById('statFilteredChannels'); // New stat
    const statHiddenToday = document.getElementById('statHiddenToday');
    const statSavedTime = document.getElementById('statSavedTime');

    const themeToggle = document.getElementById('themeToggle');
    const quickAddKeywordBtn = document.getElementById('quickAddKeywordBtn');
    const quickKidsModeBtn = document.getElementById('quickKidsModeBtn');

    if (sortSelect && sortSelect.value) {
        state.sort = sortSelect.value;
    }

    initializeTheme();

    /**
     * Settings load/save helpers
     */
    function normalizeKeywords(rawKeywords, compiledKeywords) {
        if (Array.isArray(rawKeywords)) {
            return rawKeywords
                .map(entry => {
                    if (!entry || !entry.word) return null;
                    const word = entry.word.trim();
                    if (!word) return null;
                    return {
                        word,
                        exact: !!entry.exact,
                        semantic: !!entry.semantic,
                        source: entry.source === 'channel' ? 'channel' : 'user',
                        channelRef: entry.channelRef || null
                    };
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
                    return raw ? {
                        word: raw,
                        exact: isExact,
                        semantic: !!entry.semantic,
                        source: 'user',
                        channelRef: null
                    } : null;
                })
                .filter(Boolean);
        }

        if (typeof compiledKeywords === 'string') {
            return compiledKeywords
                .split(',')
                .map(k => k.trim())
                .filter(Boolean)
                .map(word => ({ word, exact: false, semantic: false, source: 'user', channelRef: null }));
        }

        return [];
    }

    function normalizeChannels(rawChannels) {
        if (Array.isArray(rawChannels)) {
            return rawChannels
                .map(ch => {
                    if (typeof ch === 'string') {
                        const trimmed = ch.trim();
                        // Legacy string format - convert to object
                        return { name: trimmed, id: trimmed, handle: null, logo: null, filterAll: false, originalInput: trimmed };
                    } else if (ch && typeof ch === 'object') {
                        // Already an object - ensure it has all fields including filterAll and logo
                        return {
                            name: ch.name || ch.id,
                            id: ch.id,
                            handle: ch.handle || null,
                            logo: ch.logo || null,
                            filterAll: !!ch.filterAll, // Preserve filterAll property
                            originalInput: ch.originalInput || ch.id || ch.handle || null
                        };
                    }
                    return null;
                })
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(ch => {
                    const trimmed = ch.trim();
                    return { name: trimmed, id: trimmed, handle: null, logo: null, filterAll: false, originalInput: trimmed };
                })
                .filter(ch => ch.name);
        }

        return [];
    }

    function compileKeywords(keywords) {
        return keywords
            .filter(k => k && k.word)
            .map(k => {
                const escaped = k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return {
                    pattern: k.exact ? `\\b${escaped}\\b` : escaped,
                    flags: 'i'
                };
            });
    }

    function getChannelDerivedKey(channel) {
        return (channel.id || channel.handle || channel.originalInput || channel.name || '').toLowerCase();
    }

    function getChannelKeywordWord(channel) {
        if (channel.name && channel.name !== channel.id) {
            return channel.name;
        }
        if (channel.handle) {
            return channel.handle;
        }
        return channel.id || channel.originalInput || '';
    }

    function syncFilterAllKeywords() {
        if (!Array.isArray(state.channels)) return;

        const activeKeys = new Set();

        state.channels.forEach(channel => {
            if (!channel || !channel.filterAll) return;
            const key = getChannelDerivedKey(channel);
            if (!key) return;
            activeKeys.add(key);

            const word = getChannelKeywordWord(channel);
            if (!word) return;

            const existing = state.keywords.find(entry => entry.source === 'channel' && entry.channelRef === key);

            if (existing) {
                existing.word = word;
            } else {
                state.keywords.push({
                    word,
                    exact: false,
                    semantic: false,
                    source: 'channel',
                    channelRef: key
                });
            }
        });

        // Remove stale channel-derived keywords
        if (activeKeys.size > 0 || state.keywords.some(entry => entry.source === 'channel')) {
            state.keywords = state.keywords.filter(entry => {
                if (entry.source !== 'channel') return true;
                return activeKeys.has(entry.channelRef);
            });
        }
    }

    function deriveChannelMapping(channel) {
        const original = channel.originalInput || channel.handle || channel.id || channel.name || '';
        const normalizedOriginal = original.toLowerCase();
        const resolvedId = channel.id || '';
        const resolvedHandle = channel.handle || '';

        let target = '';

        if (original.startsWith('@')) {
            target = resolvedId || '';
        } else if (normalizedOriginal.startsWith('channel/')) {
            target = resolvedHandle || resolvedId || '';
        } else if (normalizedOriginal.startsWith('uc')) {
            target = resolvedHandle || '';
        }

        if (!target) {
            if (resolvedId && resolvedId.toLowerCase() !== normalizedOriginal) {
                target = resolvedId;
            } else if (resolvedHandle && resolvedHandle.toLowerCase() !== normalizedOriginal) {
                target = resolvedHandle;
            }
        }

        if (!target && channel.name && channel.name.toLowerCase() !== normalizedOriginal) {
            target = channel.name;
        }

        return {
            source: original,
            target: target || null
        };
    }

    function findChannelByDerivedKey(key) {
        if (!key) return null;
        return state.channels.find(channel => getChannelDerivedKey(channel) === key) || null;
    }

    function buildCompiledSettings({ hideShorts, hideComments, filterCommentsOverride }) {
        return {
            filterKeywords: compileKeywords(state.keywords),
            filterChannels: state.channels, // Send full channel objects with name, id, and handle
            hideAllShorts: hideShorts,
            hideAllComments: hideComments,
            filterComments: filterCommentsOverride
        };
    }

    function broadcastSettings(compiledSettings) {
        chrome.tabs.query({ url: ["*://*.youtube.com/*", "*://*.youtubekids.com/*"] }, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'FilterTube_ApplySettings', settings: compiledSettings }, () => {
                    if (chrome.runtime.lastError) {
                        if (!/Receiving end does not exist/i.test(chrome.runtime.lastError.message)) {
                            console.warn('FilterTube Tab View: sendMessage error', chrome.runtime.lastError.message);
                        }
                    }
                });
            });
        });
    }

    function initializeTheme() {
        if (!themeToggle) return;
        chrome.storage?.local.get(['ftThemePreference'], ({ ftThemePreference }) => {
            const savedTheme = ftThemePreference === 'dark' ? 'dark' : 'light';
            applyTheme(savedTheme);
        });
    }

    function applyTheme(nextTheme) {
        state.theme = nextTheme;
        const root = document.documentElement;
        root.setAttribute('data-theme', nextTheme);
        if (themeToggle) {
            themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    function loadSettings() {
        if (settingsReady) return Promise.resolve();
        if (settingsLoadingPromise) return settingsLoadingPromise;

        settingsLoadingPromise = new Promise(resolve => {
            chrome.storage.local.get([
                'uiKeywords',
                'filterKeywords',
                'filterChannels',
                'hideAllShorts',
                'hideAllComments',
                'filterComments',
                'stats', // Load stats object
                'channelMap' // Load channelMap for visual node mapping
            ], result => {
                state.keywords = normalizeKeywords(result.uiKeywords, result.filterKeywords);
                state.channels = normalizeChannels(result.filterChannels);
                state.stats = result.stats || { hiddenCount: 0, savedMinutes: 0 }; // Default stats
                globalChannelMap = result.channelMap || {}; // Load channelMap

                if (hideShortsToggle) hideShortsToggle.checked = !!result.hideAllShorts;
                if (hideCommentsToggle) {
                    hideCommentsToggle.checked = !!result.hideAllComments;
                    state.hideAllComments = !!result.hideAllComments; // Initialize state for new toggle logic
                }
                if (filterCommentsToggle) {
                    filterCommentsToggle.checked = !result.hideAllComments && !!result.filterComments;
                    filterCommentsToggle.disabled = !!result.hideAllComments; // Disable if hide all is on
                    state.filterComments = !result.hideAllComments && !!result.filterComments; // Initialize state
                }

                if (sortSelect && sortSelect.value) {
                    state.sort = sortSelect.value;
                }

                syncFilterAllKeywords();

                renderKeywordList();
                renderChannelList();
                updateStats();

                settingsReady = true;
                resolve();
            });
        }).finally(() => {
            settingsLoadingPromise = null;
        });

        return settingsLoadingPromise;
    }

    async function ensureSettingsLoaded() {
        if (settingsReady) return;
        await loadSettings();
    }

    async function saveSettings() {
        await ensureSettingsLoaded();
        const hideShorts = hideShortsToggle ? hideShortsToggle.checked : false;
        const hideComments = hideCommentsToggle ? hideCommentsToggle.checked : false;
        const filterComments = hideComments ? false : (filterCommentsToggle ? filterCommentsToggle.checked : false);

        syncFilterAllKeywords();

        const compiledSettings = buildCompiledSettings({
            hideShorts,
            hideComments,
            filterCommentsOverride: filterComments
        });

        const userKeywords = state.keywords.filter(entry => entry.source !== 'channel');

        await new Promise(resolve => {
            chrome.storage.local.set({
                uiKeywords: userKeywords,
                filterKeywords: compiledSettings.filterKeywords,
                filterChannels: compiledSettings.filterChannels,
                hideAllShorts: hideShorts,
                hideAllComments: hideComments,
                filterComments: filterComments
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('FilterTube Tab View: Failed to save settings', chrome.runtime.lastError);
                } else {
                    broadcastSettings(compiledSettings);
                    updateStats();
                }
                resolve();
            });
        });
    }

    /**
     * UI rendering helpers
     */
    function filterAndSortKeywords() {
        let filtered = [...state.keywords];
        const term = (searchInput?.value || '').trim().toLowerCase();
        if (term) {
            filtered = filtered.filter(k => k.word.toLowerCase().includes(term));
        }

        if (state.sort === 'az') {
            filtered.sort((a, b) => a.word.localeCompare(b.word));
        } else if (state.sort === 'oldest') {
            // Keep original order (oldest first)
            // No-op - array is already in chronological order
        } else {
            // Newest first (default)
            filtered.reverse();
        }

        return filtered;
    }

    function renderKeywordList() {
        if (!keywordListEl) return;

        const list = filterAndSortKeywords();
        if (list.length === 0) {
            keywordListEl.innerHTML = '<div class="empty-state-large" style="padding: 20px;">No keywords found</div>';
            return;
        }

        keywordListEl.innerHTML = '';
        list.forEach(entry => {
            const originalIndex = state.keywords.indexOf(entry);
            if (originalIndex === -1) return;

            const isChannelDerived = entry.source === 'channel';

            const item = document.createElement('div');
            item.className = 'list-item';
            if (isChannelDerived) item.classList.add('channel-derived');

            const left = document.createElement('div');
            left.className = 'item-left';

            const word = document.createElement('span');
            word.className = 'item-word';
            word.textContent = entry.word;
            left.appendChild(word);

            if (isChannelDerived) {
                const channel = findChannelByDerivedKey(entry.channelRef);

                const badge = document.createElement('span');
                badge.className = 'channel-derived-badge';
                badge.textContent = 'Filter All';
                left.appendChild(badge);

                if (channel) {
                    const originLabel = document.createElement('span');
                    originLabel.className = 'channel-derived-origin';
                    originLabel.textContent = `Linked to ${channel.name || channel.handle || channel.id}`;
                    left.appendChild(originLabel);
                }

                item.appendChild(left);
            } else {
                const controls = document.createElement('div');
                controls.className = 'item-controls';

                const exactToggle = document.createElement('div');
                exactToggle.className = `exact-toggle ${entry.exact ? 'active' : ''}`;
                exactToggle.textContent = 'Exact';
                exactToggle.title = 'Toggle exact match';
                exactToggle.addEventListener('click', () => {
                    state.keywords[originalIndex].exact = !state.keywords[originalIndex].exact;
                    saveSettings();
                    renderKeywordList();
                });

                const semanticToggle = document.createElement('div');
                semanticToggle.className = `exact-toggle ${entry.semantic ? 'active' : ''}`; // Reusing exact-toggle class for now
                semanticToggle.textContent = 'Semantic';
                semanticToggle.title = 'Enable semantic matching (Coming Soon)';
                semanticToggle.style.opacity = '0.5'; // Visual cue that it's not fully active yet
                semanticToggle.style.cursor = 'not-allowed';
                // semanticToggle.addEventListener('click', () => { ... }); // Future wiring

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-text danger';
                deleteBtn.textContent = 'Remove';
                deleteBtn.addEventListener('click', () => {
                    state.keywords.splice(originalIndex, 1);
                    saveSettings();
                    renderKeywordList();
                });

                controls.appendChild(exactToggle);
                controls.appendChild(semanticToggle);
                controls.appendChild(deleteBtn);

                item.appendChild(left);
                item.appendChild(controls);
            }
            keywordListEl.appendChild(item);
        });
    }

    function updateStats() {
        if (statActiveKeywords) statActiveKeywords.textContent = String(state.keywords.length);

        // New Channel Stat
        if (statFilteredChannels) statFilteredChannels.textContent = String(state.channels.length);

        // Real Stats from Storage
        const hidden = state.stats ? state.stats.hiddenCount : 0;
        const saved = state.stats ? state.stats.savedMinutes : 0;

        if (statHiddenToday) statHiddenToday.textContent = String(hidden);
        if (statSavedTime) statSavedTime.textContent = `${saved}m`;
    }

    /**
     * Event wiring
     */
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', () => {
            const word = (keywordInput?.value || '').trim();
            if (!word) return;
            if (state.keywords.some(k => k.source !== 'channel' && k.word.toLowerCase() === word.toLowerCase())) return;

            state.keywords.push({ word, exact: false, semantic: false, source: 'user', channelRef: null });
            if (keywordInput) keywordInput.value = '';
            saveSettings();
            renderKeywordList();

            // Flash success feedback
            UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
        });
    }

    function renderChannelList() {
        if (!channelListEl) return;
        channelListEl.innerHTML = '';

        // Filter Channels by search term (search name, id, handle, and mapped identifiers)
        const searchTerm = (searchChannels?.value || '').trim().toLowerCase();
        let displayChannels = [...state.channels];

        if (searchTerm) {
            displayChannels = displayChannels.filter(ch => {
                const name = (ch.name || '').toLowerCase();
                const id = (ch.id || '').toLowerCase();
                const handle = (ch.handle || '').toLowerCase();

                // Also search in mapped identifiers
                const mappedId = globalChannelMap[id];
                const mappedHandle = globalChannelMap[handle];

                return name.includes(searchTerm) ||
                       id.includes(searchTerm) ||
                       handle.includes(searchTerm) ||
                       (mappedId && mappedId.toLowerCase().includes(searchTerm)) ||
                       (mappedHandle && mappedHandle.toLowerCase().includes(searchTerm));
            });
        }

        // Sort Channels
        const sortMode = channelSort ? channelSort.value : 'newest';

        if (sortMode === 'az') {
            displayChannels.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        } else if (sortMode === 'oldest') {
            // Assuming array order is chronological
            // No-op for oldest first
        } else {
            // Newest first (default)
            displayChannels.reverse();
        }

        if (displayChannels.length === 0) {
            channelListEl.innerHTML = '<div class="empty-state-large" style="padding: 20px;">No channels filtered</div>';
            return;
        }

        displayChannels.forEach((channel, index) => {
            // Find original index for deletion
            const originalIndex = state.channels.indexOf(channel);

            const item = document.createElement('div');
            item.className = 'list-item channel-item';

            // --- ROW 1: HEADER (Logo, Name, Delete) ---
            const headerRow = document.createElement('div');
            headerRow.className = 'channel-header-row';

            const infoGroup = document.createElement('div');
            infoGroup.className = 'channel-info-group';

            // 1. Logo
            const logoImg = document.createElement('img');
            logoImg.className = 'channel-logo';
            // Use a data URI as fallback instead of a broken URL
            const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
            logoImg.src = channel.logo || defaultAvatar;
            logoImg.onerror = () => {
                logoImg.src = defaultAvatar;
            };

            // 2. Name (show the actual channel name, not the ID)
            const nameSpan = document.createElement('div');
            nameSpan.className = 'channel-name';
            // Use name if available and different from ID, otherwise use ID
            nameSpan.textContent = (channel.name && channel.name !== channel.id) ? channel.name : channel.id;

            infoGroup.appendChild(logoImg);
            infoGroup.appendChild(nameSpan);

            // 3. Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Remove channel';
            deleteBtn.addEventListener('click', async () => {
                await ensureSettingsLoaded();
                state.channels.splice(originalIndex, 1);
                syncFilterAllKeywords();
                saveSettings();
                renderChannelList();
                renderKeywordList();
            });

            headerRow.appendChild(infoGroup);
            headerRow.appendChild(deleteBtn);
            item.appendChild(headerRow);

            // --- ROW 2: BODY (Node Map + Pill Button) ---
            const bodyRow = document.createElement('div');
            bodyRow.className = 'channel-body-row';

            // --- A. VISUAL NODE MAPPING ---
            const nodeContainer = document.createElement('div');
            nodeContainer.className = 'channel-node-container';

            // Logic: Find Partner mapping
            const mapping = deriveChannelMapping(channel);
            const rawId = (channel.id || '').toLowerCase();
            let partnerValue = mapping.target;

            if (!partnerValue) {
                if (globalChannelMap[rawId]) {
                    partnerValue = globalChannelMap[rawId];
                } else if (mapping.source && mapping.source.startsWith('@')) {
                    const stripped = mapping.source.replace('@', '').toLowerCase();
                    partnerValue = globalChannelMap[stripped] || partnerValue;
                } else if (channel.handle && channel.handle.toLowerCase() !== rawId) {
                    partnerValue = channel.handle;
                } else if (channel.name && channel.name !== mapping.source) {
                    partnerValue = channel.name;
                }
            }

            // SOURCE (What user entered - NO BOX, just plain text)
            const sourceText = document.createElement('span');
            sourceText.className = 'node-source-text';
            const sourceLabel = mapping.source || channel.originalInput || channel.handle || channel.id || channel.name || '';
            sourceText.textContent = sourceLabel;

            // CONNECTOR (Green Arrow - only show if we have a mapping)
            if (partnerValue) {
                const connector = document.createElement('div');
                connector.className = 'node-connector active';
                connector.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                nodeContainer.appendChild(sourceText);
                nodeContainer.appendChild(connector);

                // TARGET BADGE (Resolved mapping - Green Box ONLY around fetched ID)
                const targetBadge = document.createElement('span');
                targetBadge.className = 'node-badge resolved';
                targetBadge.textContent = partnerValue;
                nodeContainer.appendChild(targetBadge);
            } else {
                // No mapping yet - just show source
                nodeContainer.appendChild(sourceText);

                const pendingText = document.createElement('span');
                pendingText.className = 'node-pending-text';
                pendingText.textContent = ' → ...';
                pendingText.style.color = '#94a3b8';
                pendingText.style.fontStyle = 'italic';
                nodeContainer.appendChild(pendingText);
            }

            bodyRow.appendChild(nodeContainer);

            // --- B. FILTER ALL PILL BUTTON ---
            const pillBtn = document.createElement('button');
            pillBtn.className = channel.filterAll ? 'filter-pill active' : 'filter-pill';
            pillBtn.innerHTML = `
                <span class="pill-icon">${channel.filterAll ? '✓' : '○'}</span>
                <span class="pill-text">Filter all content</span>
            `;
            pillBtn.title = 'Also block videos mentioning this channel name';
            pillBtn.addEventListener('click', async () => {
                await ensureSettingsLoaded();
                state.channels[originalIndex].filterAll = !state.channels[originalIndex].filterAll;
                syncFilterAllKeywords();
                saveSettings();
                renderChannelList(); // Re-render to update style
                renderKeywordList();
            });

            bodyRow.appendChild(pillBtn);
            item.appendChild(bodyRow);

            channelListEl.appendChild(item);
        });
    }

    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', async () => {
            const val = (channelInput?.value || '').trim();
            if (!val) return;

            await ensureSettingsLoaded();

            // Validate input format
            if (!val.startsWith('@') && !val.toLowerCase().startsWith('uc') && !val.toLowerCase().startsWith('channel/uc')) {
                alert('Please enter a valid channel identifier:\n- @handle (e.g., @shakira)\n- UC ID (e.g., UCYLNGLIzMhRTi6ZOLjAPSmw)\n- channel/UC ID');
                return;
            }

            // Remove channel/ prefix but preserve case for UC IDs
            const normalizedId = val.replace(/^channel\//i, '');

            // Check for duplicates - need to check against channelMap too
            const isDuplicate = state.channels.some(ch => {
                const chId = ch.id.toLowerCase();
                const chHandle = (ch.handle || '').toLowerCase();
                const inputLower = normalizedId.toLowerCase(); // Lowercase for comparison

                // Direct match
                if (chId === inputLower || chHandle === inputLower) return true;

                // Check if the input maps to an existing channel via channelMap
                const mappedValue = globalChannelMap[inputLower];
                if (mappedValue && (mappedValue === chId || mappedValue === chHandle)) {
                    return true;
                }

                // Check if existing channel maps to the input
                const existingMapped = globalChannelMap[chId] || globalChannelMap[chHandle];
                if (existingMapped === inputLower) {
                    return true;
                }

                return false;
            });

            if (isDuplicate) {
                alert('This channel is already in your filter list!');
                return;
            }

            // Show loading state
            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            let channelName = val;
            let channelHandle = null;
            let channelLogo = null;
            let channelId = normalizedId;

            try {
                const response = await chrome.runtime.sendMessage({
                    action: "fetchChannelDetails",
                    channelIdOrHandle: normalizedId // Send the case-preserved normalizedId
                });

                if (response.success && response.id) {
                    channelName = response.name;
                    channelHandle = response.handle;
                    channelLogo = response.logo;
                    channelId = response.id; // Use the resolved ID from the background script
                    console.log('FilterTube Tab View: Successfully fetched - Name:', channelName, 'Handle:', channelHandle, 'Logo:', channelLogo, 'ID:', channelId);

                    // Update channelMap with new mappings
                    if (channelHandle && channelId) {
                        await new Promise((resolve) => {
                            chrome.storage.local.get(['channelMap'], (result) => {
                                const currentMap = result.channelMap || {};
                                const keyId = channelId.toLowerCase();
                                const keyHandle = channelHandle.toLowerCase();
                                currentMap[keyId] = channelHandle;      // UC... -> @BTS (original case)
                                currentMap[keyHandle] = channelId;      // @bts -> UCLkAepWjdylmXSltofFvsYQ (original case)

                                globalChannelMap = currentMap;

                                chrome.storage.local.set({ channelMap: currentMap }, () => {
                                    console.log('FilterTube Tab View: Updated channelMap with new mapping:', keyId, '<->', channelHandle, 'and', keyHandle, '<->', channelId);
                                    resolve();
                                });
                            });
                        });
                    }
                } else {
                    alert(`Failed to fetch channel details: ${response.error || 'Unknown error'}`);
                    console.error('FilterTube Tab View: Failed to fetch channel details', response);
                    return; // Stop processing if fetching failed
                }
            } catch (error) {
                alert('Error communicating with background script. Please try again.');
                console.error('FilterTube Tab View: Error fetching channel details via background script:', error);
                return; // Stop processing if communication failed
            } finally {
                addChannelBtn.disabled = false;
                addChannelBtn.textContent = originalText;
            }

            console.log('FilterTube: Final channel entry:', { name: channelName, id: channelId, handle: channelHandle, logo: channelLogo });

            // Store with name, id, handle, logo, and filterAll
            const channelEntry = {
                name: channelName,
                id: channelId,
                handle: channelHandle,
                logo: channelLogo,
                filterAll: false, // Default to false
                originalInput: val // Store the original user input
            };

            state.channels.push(channelEntry);
            if (channelInput) channelInput.value = '';

            // Re-enable button
            addChannelBtn.disabled = false;
            addChannelBtn.textContent = originalText;

            // Save settings first
            syncFilterAllKeywords();
            saveSettings();

            // Reload the channelMap from storage to get the latest mappings
            chrome.storage.local.get(['channelMap'], (result) => {
                globalChannelMap = result.channelMap || {};
                console.log('FilterTube: Reloaded channelMap:', globalChannelMap);

                // Now render the list with updated mapping
                renderChannelList();
                renderKeywordList();
            });

            // Flash success feedback
            UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
        });
    }

    if (keywordInput) {
        keywordInput.addEventListener('keypress', event => {
            if (event.key === 'Enter') addKeywordBtn?.click();
        });
    }

    if (channelInput) {
        channelInput.addEventListener('keypress', event => {
            if (event.key === 'Enter') addChannelBtn?.click();
        });
    }

    if (clearKeywordsBtn) {
        clearKeywordsBtn.addEventListener('click', () => {
            if (!state.keywords.length) return;
            if (!confirm('Delete all keywords? This cannot be undone.')) return;
            state.keywords = [];
            saveSettings();
            renderKeywordList();
        });
    }

    if (clearChannelsBtn) {
        clearChannelsBtn.addEventListener('click', async () => {
            await ensureSettingsLoaded();
            if (!state.channels.length) return;
            if (!confirm('Delete all blocked channels? This cannot be undone.')) return;
            state.channels = [];
            syncFilterAllKeywords();
            saveSettings();
            renderChannelList();
            renderKeywordList();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderKeywordList);
    }

    if (searchChannels) {
        searchChannels.addEventListener('input', renderChannelList);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sort = sortSelect.value;
            renderKeywordList();
        });
    }

    hideShortsToggle?.addEventListener('change', saveSettings);
    // --- Toggle Logic ---
    if (hideCommentsToggle && filterCommentsToggle) {
        hideCommentsToggle.addEventListener('change', async () => {
            await ensureSettingsLoaded();
            state.hideAllComments = hideCommentsToggle.checked;

            // Instant Feedback: Disable filter toggle if hide all is on
            if (state.hideAllComments) {
                filterCommentsToggle.checked = false;
                filterCommentsToggle.disabled = true;
                state.filterComments = false; // Force state update
            } else {
                filterCommentsToggle.disabled = false;
            }

            saveSettings();
        });

        filterCommentsToggle.addEventListener('change', async () => {
            await ensureSettingsLoaded();
            state.filterComments = filterCommentsToggle.checked;
            saveSettings();
        });
    }
});

