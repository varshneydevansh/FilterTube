/**
 * Tab-View script for FilterTube extension (REFACTORED)
 * 
 * This script uses centralized StateManager and RenderEngine
 * Full UI with advanced features: search, sort, node mapping, filter-all toggles
 */

// ============================================================================
// FILTERS TAB INITIALIZATION
// ============================================================================

function initializeFiltersTabs() {
    const container = document.getElementById('filtersTabsContainer');
    if (!container) return;

    // Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="keywordInput" class="text-input" placeholder="Enter keyword to filter..." />
            <button id="addKeywordBtn" class="btn-primary">Add Keyword</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="searchKeywords" class="search-input" placeholder="Search keywords..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="keywordSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div id="keywordListEl" class="advanced-list"></div>
    `;

    // Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="channelInput" class="text-input" placeholder="@handle or Channel ID..." />
            <button id="addChannelBtn" class="btn-primary">Add Channel</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="searchChannels" class="search-input" placeholder="Search channels..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="channelSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div id="channelListEl" class="advanced-list"></div>
    `;

    // Content tab with checkboxes
    const contentTab = document.createElement('div');
    contentTab.innerHTML = `
        <div class="toggle-row">
            <div class="toggle-info">
                <div class="toggle-title">Hide Shorts</div>
                <div class="toggle-desc">Remove all YouTube Shorts from your feed</div>
            </div>
            <label class="switch">
                <input type="checkbox" id="settingHideShorts">
                <span class="slider round"></span>
            </label>
        </div>

        <div class="toggle-row">
            <div class="toggle-info">
                <div class="toggle-title">Hide All Comments</div>
                <div class="toggle-desc">Remove comment sections entirely</div>
            </div>
            <label class="switch">
                <input type="checkbox" id="settingHideComments">
                <span class="slider round"></span>
            </label>
        </div>

        <div class="toggle-row">
            <div class="toggle-info">
                <div class="toggle-title">Filter Comments</div>
                <div class="toggle-desc">Hide only comments containing your keywords</div>
            </div>
            <label class="switch">
                <input type="checkbox" id="settingFilterComments">
                <span class="slider round"></span>
            </label>
        </div>
    `;

    // Create tabs
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keyword Management', content: keywordsContent },
            { id: 'channels', label: 'Channel Management', content: channelsContent },
            { id: 'content', label: 'Content Controls', content: contentTab }
        ],
        defaultTab: 'keywords'
    });

    container.appendChild(tabs.container);
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI
    initializeFiltersTabs();
    setupNavigation();

    // Get DOM elements
    const keywordInput = document.getElementById('keywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordListEl = document.getElementById('keywordListEl');
    const searchKeywords = document.getElementById('searchKeywords');
    const keywordSort = document.getElementById('keywordSort');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelListEl');
    const searchChannels = document.getElementById('searchChannels');
    const channelSort = document.getElementById('channelSort');

    const settingHideShorts = document.getElementById('settingHideShorts');
    const settingHideComments = document.getElementById('settingHideComments');
    const settingFilterComments = document.getElementById('settingFilterComments');

    const themeToggle = document.getElementById('themeToggle');

    // State for search/sort
    let keywordSearchValue = '';
    let keywordSortValue = 'newest';
    let channelSearchValue = '';
    let channelSortValue = 'newest';

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    // Load initial settings
    await StateManager.loadSettings();

    // Apply theme immediately
    const state = StateManager.getState();
    if (state.theme) {
        const SettingsAPI = window.FilterTubeSettings || {};
        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(state.theme);
        }
    }

    // Subscribe to state changes
    StateManager.subscribe((eventType, data) => {
        console.log('Tab-View: State changed', eventType, data);

        if (['keywordAdded', 'keywordRemoved', 'keywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKeywords();
            updateStats();
        }

        if (['channelAdded', 'channelRemoved', 'channelUpdated', 'load', 'save'].includes(eventType)) {
            renderChannels();
            renderKeywords(); // Re-render keywords in case channel-derived keywords changed
            updateStats();
        }

        if (eventType === 'settingUpdated') {
            updateCheckboxes();
        }

        if (eventType === 'themeChanged') {
            // Theme already applied by StateManager
        }
    });

    // ============================================================================
    // RENDERING
    // ============================================================================

    function renderKeywords() {
        if (!keywordListEl) return;
        RenderEngine.renderKeywordList(keywordListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            searchValue: keywordSearchValue,
            sortValue: keywordSortValue
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        RenderEngine.renderChannelList(channelListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            showNodeMapping: true,
            searchValue: channelSearchValue,
            sortValue: channelSortValue
        });
    }

    function updateCheckboxes() {
        const state = StateManager.getState();

        if (settingHideShorts) {
            settingHideShorts.checked = state.hideShorts;
        }

        if (settingHideComments) {
            settingHideComments.checked = state.hideComments;
        }

        if (settingFilterComments) {
            settingFilterComments.checked = state.hideComments ? false : state.filterComments;
            settingFilterComments.disabled = state.hideComments;
        }
    }

    function updateStats() {
        const state = StateManager.getState();

        // Update stat cards
        const statActiveKeywords = document.getElementById('statActiveKeywords');
        const statFilteredChannels = document.getElementById('statFilteredChannels');
        const statHiddenToday = document.getElementById('statHiddenToday');
        const statSavedTime = document.getElementById('statSavedTime');

        if (statActiveKeywords) {
            statActiveKeywords.textContent = state.userKeywords?.length || 0;
        }

        if (statFilteredChannels) {
            statFilteredChannels.textContent = state.channels?.length || 0;
        }

        if (statHiddenToday) {
            statHiddenToday.textContent = state.stats?.hiddenCount || 0;
        }

        if (statSavedTime) {
            const minutes = state.stats?.savedMinutes || 0;
            if (minutes < 60) {
                statSavedTime.textContent = `${minutes}m`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                statSavedTime.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();
    updateStats();

    // ============================================================================
    // EVENT HANDLERS - Keywords
    // ============================================================================

    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            const word = (keywordInput?.value || '').trim();
            if (!word) return;

            const success = await StateManager.addKeyword(word);
            if (success) {
                if (keywordInput) keywordInput.value = '';
                UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
            }
        });
    }

    if (keywordInput) {
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addKeywordBtn) {
                addKeywordBtn.click();
            }
        });
    }

    if (searchKeywords) {
        searchKeywords.addEventListener('input', (e) => {
            keywordSearchValue = e.target.value;
            renderKeywords();
        });
    }

    if (keywordSort) {
        keywordSort.addEventListener('change', (e) => {
            keywordSortValue = e.target.value;
            renderKeywords();
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Channels
    // ============================================================================

    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', async () => {
            const input = (channelInput?.value || '').trim();
            if (!input) return;

            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            try {
                const result = await StateManager.addChannel(input);

                if (result.success) {
                    if (channelInput) channelInput.value = '';
                    UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
                } else {
                    UIComponents.showToast(result.error || 'Failed to add channel', 'error');
                }
            } finally {
                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;
            }
        });
    }

    if (channelInput) {
        channelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addChannelBtn) {
                addChannelBtn.click();
            }
        });
    }

    if (searchChannels) {
        searchChannels.addEventListener('input', (e) => {
            channelSearchValue = e.target.value;
            renderChannels();
        });
    }

    if (channelSort) {
        channelSort.addEventListener('change', (e) => {
            channelSortValue = e.target.value;
            renderChannels();
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Settings
    // ============================================================================

    if (settingHideShorts) {
        settingHideShorts.addEventListener('change', async () => {
            await StateManager.updateSetting('hideShorts', settingHideShorts.checked);
        });
    }

    if (settingHideComments) {
        settingHideComments.addEventListener('change', async () => {
            await StateManager.updateSetting('hideComments', settingHideComments.checked);
        });
    }

    if (settingFilterComments) {
        settingFilterComments.addEventListener('change', async () => {
            await StateManager.updateSetting('filterComments', settingFilterComments.checked);
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Theme
    // ============================================================================

    if (themeToggle) {
        themeToggle.addEventListener('click', async () => {
            await StateManager.toggleTheme();
        });
    }

    // ============================================================================
    // QUICK ACTIONS (Dashboard)
    // ============================================================================

    const quickAddKeywordBtn = document.getElementById('quickAddKeywordBtn');
    const quickAddChannelBtn = document.getElementById('quickAddChannelBtn');

    if (quickAddKeywordBtn) {
        quickAddKeywordBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const keywordTab = tabs?.querySelector('[data-tab-id="keywords"]');
            if (keywordTab) keywordTab.click();
            setTimeout(() => keywordInput?.focus(), 100);
        });
    }

    if (quickAddChannelBtn) {
        quickAddChannelBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const channelTab = tabs?.querySelector('[data-tab-id="channels"]');
            if (channelTab) channelTab.click();
            setTimeout(() => channelInput?.focus(), 100);
        });
    }

    // ============================================================================
    // STORAGE CHANGE LISTENER
    // ============================================================================

    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local') return;

        const SettingsAPI = window.FilterTubeSettings || {};
        const hasSettingsChange = SettingsAPI.isSettingsChange ?
            SettingsAPI.isSettingsChange(changes) :
            Object.keys(changes).some(key =>
                ['uiKeywords', 'filterKeywords', 'filterChannels', 'hideAllShorts', 'hideAllComments', 'filterComments', 'stats'].includes(key)
            );

        const hasThemeChange = SettingsAPI.isThemeChange ?
            SettingsAPI.isThemeChange(changes) :
            Object.prototype.hasOwnProperty.call(changes, 'ftThemePreference');

        if (hasThemeChange) {
            const newTheme = SettingsAPI.getThemeFromChange ?
                SettingsAPI.getThemeFromChange(changes) :
                (changes?.ftThemePreference?.newValue || 'light');
            await StateManager.setTheme(newTheme);
        }

        if (hasSettingsChange) {
            console.log('Tab-View: Storage change detected, reloading settings');
            await StateManager.loadSettings();
        }
    });
});

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-tab');
            switchView(targetView);
        });
    });

    function switchView(viewId) {
        // Update nav items
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === viewId);
        });

        // Update view sections
        viewSections.forEach(section => {
            section.classList.toggle('active', section.id === `${viewId}View`);
        });

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'filters': 'Filters',
            'semantic': 'Semantic ML',
            'kids': 'Kids Mode',
            'settings': 'Settings'
        };
        if (pageTitle && titles[viewId]) {
            pageTitle.textContent = titles[viewId];
        }
    }

    // Make switchView globally accessible for quick actions
    window.switchView = switchView;
}
