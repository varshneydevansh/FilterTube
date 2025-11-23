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

    // Create Content tab content
    const contentTab = document.createElement('div');
    contentTab.innerHTML = `
        <div class="card full-width">
            <div class="card-header">
                <h3>Content Control</h3>
            </div>
            <div class="card-body">
                <div class="toggle-row">
                    <div class="toggle-info">
                        <span class="toggle-title">Hide Shorts</span>
                        <span class="toggle-desc">Remove Shorts shelves and tab.</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="settingHideShorts">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="toggle-row">
                    <div class="toggle-info">
                        <span class="toggle-title">Hide Comments</span>
                        <span class="toggle-desc">Remove comment sections entirely.</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="settingHideComments">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="toggle-row">
                    <div class="toggle-info">
                        <span class="toggle-title">Filter Comments</span>
                        <span class="toggle-desc">Hide only comments matching your keywords.</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="settingFilterComments">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    `;

    // Create tabs using UIComponents
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keywords', content: keywordsContent },
            { id: 'channels', label: 'Channels', content: channelsContent },
            { id: 'content', label: 'Content', content: contentTab }
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
        userKeywords: [],
        keywords: [],
        channels: [],
        hideShorts: false,
        hideComments: false,
        filterComments: false,
        stats: { hiddenCount: 0, savedMinutes: 0 },
        channelMap: {},
        sort: 'newest',
        theme: 'light'
    };

    // Global channelMap for visual node mapping
    let globalChannelMap = {};

    // Ensure settings are loaded before performing write operations
    let settingsReady = false;
    let settingsLoadingPromise = null;
    let isSaving = false;
    let isInitializing = true;
    let isAddingChannel = false; // Flag to prevent race conditions during channel addition

    const SettingsAPI = window.FilterTubeSettings || {};
    const {
        loadSettings: sharedLoadSettings,
        saveSettings: sharedSaveSettings,
        syncFilterAllKeywords: sharedSyncFilterAllKeywords,
        extractUserKeywords: sharedExtractUserKeywords,
        applyThemePreference: sharedApplyThemePreference,
        setThemePreference: sharedSetThemePreference,
        getThemePreference: sharedGetThemePreference,
        isSettingsChange: sharedIsSettingsChange,
        isThemeChange: sharedIsThemeChange,
        getThemeFromChange: sharedGetThemeFromChange
    } = SettingsAPI;

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
    if (quickAddKeywordBtn) {
        quickAddKeywordBtn.addEventListener('click', () => {
            // Switch to Filters tab
            const filtersTab = document.querySelector('.nav-item[data-tab="filters"]');
            if (filtersTab) filtersTab.click();

            // Switch to Keywords sub-tab (if not already)
            setTimeout(() => {
                const keywordTabBtn = document.querySelector('.tab-button[data-tab-id="keywords"]');
                if (keywordTabBtn) keywordTabBtn.click();
                if (keywordInput) keywordInput.focus();
            }, 100);
        });
    }

    const quickAddChannelBtn = document.getElementById('quickAddChannelBtn');
    if (quickAddChannelBtn) {
        quickAddChannelBtn.addEventListener('click', () => {
            // Switch to Filters tab
            const filtersTab = document.querySelector('.nav-item[data-tab="filters"]');
            if (filtersTab) filtersTab.click();

            // Switch to Channels sub-tab
            setTimeout(() => {
                const channelTabBtn = document.querySelector('.tab-button[data-tab-id="channels"]');
                if (channelTabBtn) channelTabBtn.click();
                if (channelInput) channelInput.focus();
            }, 100);
        });
    }

    if (quickKidsModeBtn) {
        quickKidsModeBtn.addEventListener('click', () => {
            const kidsTab = document.querySelector('.nav-item[data-tab="kids"]');
            if (kidsTab) kidsTab.click();
        });
    }

    if (sortSelect && sortSelect.value) {
        state.sort = sortSelect.value;
    }

    initializeTheme();

    /**
     * Settings load/save helpers
     */
    const fallbackGetChannelDerivedKey = SettingsAPI.getChannelDerivedKey || function (channel) {
        return (channel?.id || channel?.handle || channel?.originalInput || channel?.name || '').toLowerCase();
    };

    const fallbackGetChannelKeywordWord = SettingsAPI.getChannelKeywordWord || function (channel) {
        if (!channel) return '';
        if (channel.name && channel.name !== channel.id) return channel.name;
        if (channel.handle) return channel.handle;
        return channel.id || channel.originalInput || '';
    };

    function recomputeKeywords() {
        if (sharedSyncFilterAllKeywords) {
            state.keywords = sharedSyncFilterAllKeywords(state.userKeywords, state.channels);
        } else {
            const userOnly = state.userKeywords.slice();
            const derived = [];
            const seen = new Set();
            state.channels.forEach(channel => {
                if (!channel?.filterAll) return;
                const key = fallbackGetChannelDerivedKey(channel);
                if (!key || seen.has(key)) return;
                const word = fallbackGetChannelKeywordWord(channel);
                if (!word) return;
                seen.add(key);
                derived.push({
                    word,
                    exact: false,
                    semantic: false,
                    source: 'channel',
                    channelRef: key
                });
            });
            state.keywords = userOnly.concat(derived);
        }
    }

    function sanitizeUserKeywords(keywords) {
        if (sharedExtractUserKeywords) {
            return sharedExtractUserKeywords(keywords);
        }

        return (keywords || [])
            .filter(entry => entry && entry.source !== 'channel')
            .map(entry => ({
                word: entry.word,
                exact: !!entry.exact,
                semantic: !!entry.semantic,
                source: 'user',
                channelRef: null
            }));
    }

    function setUserKeywords(nextKeywords) {
        state.userKeywords = sanitizeUserKeywords(nextKeywords);
        recomputeKeywords();
    }

    function findUserKeywordIndex(word) {
        if (!word) return -1;
        const target = word.toLowerCase();
        return state.userKeywords.findIndex(entry => entry.word.toLowerCase() === target);
    }

    function applyTheme(nextTheme) {
        const normalized = sharedApplyThemePreference ? sharedApplyThemePreference(nextTheme) : (nextTheme === 'dark' ? 'dark' : 'light');
        state.theme = normalized;
        if (!sharedApplyThemePreference) {
            document.documentElement.setAttribute('data-theme', normalized);
        }
        if (themeToggle) {
            themeToggle.textContent = normalized === 'dark' ? '☀️' : '🌙';
        }
    }

    function initializeTheme() {
        if (!themeToggle) return;
        if (sharedGetThemePreference) {
            sharedGetThemePreference().then(theme => {
                state.theme = theme || state.theme;
                applyTheme(state.theme);
            });
        }
    }

    function applyLoadedSettings(data) {
        console.log('FilterTube Tab View: Applying loaded settings', {
            channels: data?.channels?.length,
            userKeywords: data?.userKeywords?.length,
            keywords: data?.keywords?.length
        });

        setUserKeywords(data?.userKeywords || []);

        // Explicitly set keywords from loaded data to ensure channel-derived keywords are included
        if (Array.isArray(data?.keywords)) {
            state.keywords = data.keywords.map(k => ({ ...k }));
            console.log('FilterTube Tab View: Set keywords from loaded data', state.keywords);
        }

        state.channels = (data?.channels || []).slice();
        state.hideShorts = !!data?.hideShorts;
        state.hideComments = !!data?.hideComments;
        state.filterComments = !!data?.filterComments;
        state.stats = data?.stats || { hiddenCount: 0, savedMinutes: 0 };
        state.channelMap = data.channelMap || {};
        globalChannelMap = state.channelMap;

        if (hideShortsToggle) hideShortsToggle.checked = state.hideShorts;
        if (hideCommentsToggle) hideCommentsToggle.checked = state.hideComments;
        if (filterCommentsToggle) {
            filterCommentsToggle.checked = state.filterComments;
            filterCommentsToggle.disabled = state.hideComments;
        }

        if (typeof data?.theme === 'string') {
            state.theme = data.theme;
            applyTheme(state.theme);
        }

        renderKeywordList();
        renderChannelList();
        updateStats();
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
        return state.channels.find(channel => fallbackGetChannelDerivedKey(channel) === key) || null;
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

    function loadSettings() {
        if (settingsReady) return Promise.resolve();
        if (settingsLoadingPromise) return settingsLoadingPromise;

        if (!sharedLoadSettings) {
            console.warn('FilterTube Tab View: sharedLoadSettings unavailable');
            settingsReady = true;
            isInitializing = false;
            return Promise.resolve();
        }

        settingsLoadingPromise = sharedLoadSettings().then(data => {
            applyLoadedSettings(data);
            settingsReady = true;
            isInitializing = false;
        }).finally(() => {
            settingsLoadingPromise = null;
        });

        return settingsLoadingPromise;
    }

    async function ensureSettingsLoaded() {
        if (settingsReady) return;
        await loadSettings();
    }

    async function saveSettings({ broadcast = true } = {}) {
        await ensureSettingsLoaded();
        if (!sharedSaveSettings) return;

        if (isSaving) return;
        isSaving = true;

        recomputeKeywords();

        const { compiledSettings, error } = await sharedSaveSettings({
            keywords: state.keywords,
            channels: state.channels,
            hideShorts: state.hideShorts,
            hideComments: state.hideComments,
            filterComments: state.filterComments
        });

        if (error) {
            console.error('FilterTube Tab View: Failed to save settings', error);
        } else if (broadcast && compiledSettings) {
            broadcastSettings(compiledSettings);
            updateStats();
        }

        isSaving = false;
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
            // Reverse to show oldest first (array is naturally newest-first)
            filtered.reverse();
        } else {
            // Newest first (default) - no-op, array is already newest-first
            // Keep natural order
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
                badge.title = 'This keyword was automatically added from "Filter All Content" on a channel';
                left.appendChild(badge);

                if (channel) {
                    const originLabel = document.createElement('span');
                    originLabel.className = 'channel-derived-origin';
                    originLabel.textContent = `Linked to ${channel.name || channel.handle || channel.id}`;
                    originLabel.title = `This keyword filters content mentioning "${entry.word}" - automatically synced with channel's "Filter All Content" setting`;
                    left.appendChild(originLabel);
                }

                item.appendChild(left);
            } else {
                const controls = document.createElement('div');
                controls.className = 'item-controls';

                const exactToggle = document.createElement('div');
                exactToggle.className = `exact-toggle ${entry.exact ? 'active' : ''}`;
                exactToggle.textContent = 'Exact';
                exactToggle.title = entry.exact
                    ? `Exact match enabled: Only filters when "${entry.word}" appears as a complete word`
                    : `Partial match enabled: Filters "${entry.word}" anywhere in text (e.g., "Shakira" matches "Shakira Concert")`;
                exactToggle.addEventListener('click', async () => {
                    if (entry.source === 'channel') return;
                    const userIndex = findUserKeywordIndex(entry.word);
                    if (userIndex === -1) return;
                    state.userKeywords[userIndex].exact = !state.userKeywords[userIndex].exact;
                    recomputeKeywords();
                    await saveSettings();
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
                deleteBtn.addEventListener('click', async () => {
                    if (entry.source === 'channel') return;
                    const userIndex = findUserKeywordIndex(entry.word);
                    if (userIndex === -1) return;
                    state.userKeywords.splice(userIndex, 1);
                    recomputeKeywords();
                    await saveSettings();
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
        let saved = 0;

        if (state.stats && state.stats.savedSeconds) {
            // Use precise seconds if available
            saved = Math.round(state.stats.savedSeconds / 60);
        } else {
            // Fallback to estimate (4 seconds per hidden item)
            saved = Math.round((hidden || 0) * 4 / 60);
        }

        console.log('FilterTube Tab View: Stats updated - Hidden:', hidden, 'Saved Seconds:', state.stats?.savedSeconds, 'Display Minutes:', saved);

        if (statHiddenToday) statHiddenToday.textContent = String(hidden);
        if (statSavedTime) statSavedTime.textContent = `${saved}m`;
    }

    /**
     * Event wiring
     */
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            const word = (keywordInput?.value || '').trim();
            if (!word) return;
            if (state.userKeywords.some(k => k.word.toLowerCase() === word.toLowerCase())) return;

            state.userKeywords.unshift({ word, exact: false, semantic: false, source: 'user', channelRef: null }); // Add to beginning for newest-first order
            recomputeKeywords();
            if (keywordInput) keywordInput.value = '';
            await saveSettings();
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
            // Reverse to show oldest first (array is naturally newest-first)
            displayChannels.reverse();
        } else {
            // Newest first (default) - no-op, array is already newest-first
            // Keep natural order
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
            deleteBtn.addEventListener('click', async () => {
                await ensureSettingsLoaded();
                state.channels.splice(originalIndex, 1);
                recomputeKeywords();
                await saveSettings();
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
            sourceText.title = `What you entered: ${sourceLabel}`;

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
                targetBadge.title = mapping.target === channel.id
                    ? `Channel UC ID: ${partnerValue} (auto-resolved)`
                    : `Channel Handle: ${partnerValue} (auto-resolved)`;
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
            pillBtn.title = `${channel.filterAll ? 'Enabled' : 'Disabled'}: Also filter videos that mention "${channel.name || channel.handle || channel.id}" in title/description (uses partial/substring matching)`;
            pillBtn.addEventListener('click', async () => {
                await ensureSettingsLoaded();
                state.channels[originalIndex].filterAll = !state.channels[originalIndex].filterAll;
                recomputeKeywords();
                await saveSettings(); // Wait for save to complete before rendering
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
            // Check for duplicates
            const normalizedIdLower = normalizedId.toLowerCase();
            const isDuplicate = state.channels.some(ch =>
                ch.id.toLowerCase() === normalizedIdLower ||
                (ch.handle && ch.handle.toLowerCase() === normalizedIdLower) ||
                (ch.originalInput && ch.originalInput.toLowerCase() === normalizedIdLower)
            );

            if (isDuplicate) {
                alert('Channel already added!');
                return;
            }

            isAddingChannel = true; // Start critical section

            // Show loading state
            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            // OPTIMISTIC UPDATE: Add a temporary entry immediately
            const tempId = 'temp-' + Date.now();
            const tempEntry = {
                name: val, // Use input as name initially
                id: normalizedId,
                handle: val.startsWith('@') ? val : null,
                logo: null, // No logo yet
                filterAll: false,
                originalInput: val,
                isPending: true // Flag to indicate pending state
            };

            state.channels.unshift(tempEntry);
            if (channelInput) channelInput.value = '';
            renderChannelList(); // Render immediately

            let channelName = val;
            let channelHandle = null;
            let channelLogo = null;
            let channelId = normalizedId;

            try {
                const response = await chrome.runtime.sendMessage({
                    action: "fetchChannelDetails",
                    channelIdOrHandle: normalizedId // Send the case-preserved normalizedId
                });

                // Remove the temporary entry
                state.channels = state.channels.filter(ch => ch !== tempEntry);

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
                    // If fetch failed, we removed the temp entry, so we should alert the user
                    // But maybe we want to keep it as a "raw" entry? 
                    // For now, let's keep the behavior of alerting on failure, but we already removed the optimistic entry.
                    alert(`Failed to fetch channel details: ${response.error || 'Unknown error'}`);
                    console.error('FilterTube Tab View: Failed to fetch channel details', response);
                    renderChannelList(); // Re-render to remove the temp entry
                    return; // Stop processing if fetching failed
                }
            } catch (error) {
                // Remove temp entry on error
                state.channels = state.channels.filter(ch => ch !== tempEntry);
                renderChannelList();

                alert('Error communicating with background script. Please try again.');
                console.error('FilterTube Tab View: Error fetching channel details via background script:', error);
                isAddingChannel = false;
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

            state.channels.unshift(channelEntry); // Add to beginning for newest-first order

            // Save settings first and wait for completion
            recomputeKeywords();
            await saveSettings();

            isAddingChannel = false; // End critical section

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
        clearKeywordsBtn.addEventListener('click', async () => {
            if (!state.userKeywords.length) return;
            if (!confirm('Delete all keywords? This cannot be undone.')) return;
            setUserKeywords([]);
            await saveSettings();
            renderKeywordList();
        });
    }

    if (clearChannelsBtn) {
        clearChannelsBtn.addEventListener('click', async () => {
            await ensureSettingsLoaded();
            if (!state.channels.length) return;
            if (!confirm('Delete all blocked channels? This cannot be undone.')) return;
            state.channels = [];
            recomputeKeywords();
            await saveSettings();
            renderChannelList();
            renderKeywordList();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderKeywordList);
    }

    if (searchChannels) {
        let debounceTimer;
        searchChannels.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(renderChannelList, 300);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sort = sortSelect.value;
            renderKeywordList();
        });
    }

    if (hideShortsToggle) {
        hideShortsToggle.addEventListener('change', async () => {
            await ensureSettingsLoaded();
            state.hideShorts = hideShortsToggle.checked;
            await saveSettings();
        });
    }
    // --- Toggle Logic ---
    if (hideCommentsToggle && filterCommentsToggle) {
        hideCommentsToggle.addEventListener('change', async () => {
            await ensureSettingsLoaded();
            state.hideComments = hideCommentsToggle.checked;

            // Instant Feedback: Disable filter toggle if hide all is on
            if (state.hideComments) {
                filterCommentsToggle.checked = false;
                filterCommentsToggle.disabled = true;
                state.filterComments = false; // Force state update
            } else {
                filterCommentsToggle.disabled = false;
            }

            await saveSettings();
        });

        filterCommentsToggle.addEventListener('change', async () => {
            await ensureSettingsLoaded();
            state.filterComments = filterCommentsToggle.checked;
            await saveSettings();
        });
    }

    // Listen for storage changes from popup or other sources
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local' || isSaving || isInitializing) return;

        const hasSettingsChange = sharedIsSettingsChange ? sharedIsSettingsChange(changes) : Object.keys(changes).some(key => ['uiKeywords', 'filterKeywords', 'filterChannels', 'hideAllShorts', 'hideAllComments', 'filterComments', 'stats', 'channelMap'].includes(key));
        const hasThemeChange = sharedIsThemeChange ? sharedIsThemeChange(changes) : changes.hasOwnProperty('ftThemePreference');

        if (hasThemeChange) {
            const newTheme = sharedGetThemeFromChange ? sharedGetThemeFromChange(changes) : (changes.ftThemePreference?.newValue || 'light');
            applyTheme(newTheme);
        }

        if (hasSettingsChange) {
            console.log('FilterTube Tab View: Detected settings change from popup/external source');

            // Prevent overwriting optimistic updates during channel addition
            if (isAddingChannel) {
                console.log('FilterTube Tab View: Skipping settings reload because channel addition is in progress');
                return;
            }

            // Reload settings from storage
            const data = await (sharedLoadSettings ? sharedLoadSettings() : Promise.resolve({}));
            if (!data) return;

            // Update state from loaded data
            applyLoadedSettings(data);
        }
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', async () => {
            await ensureSettingsLoaded();
            const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
            state.theme = nextTheme;
            applyTheme(nextTheme);
            if (sharedSetThemePreference) {
                await sharedSetThemePreference(nextTheme);
            } else {
                chrome.storage?.local.set({ [SettingsAPI.THEME_KEY || 'ftThemePreference']: nextTheme });
            }
        });
    }

    // Kick off initial state load so the tab view reflects saved settings immediately
    loadSettings();
});

