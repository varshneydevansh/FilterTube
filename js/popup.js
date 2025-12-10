/**
 * Popup script for FilterTube extension (REFACTORED)
 * 
 * This script uses centralized StateManager and RenderEngine
 * to eliminate code duplication and improve maintainability.
 */

// Initialize tabs for the popup
function initializePopupFiltersTabs() {
    const container = document.getElementById('popupFiltersTabsContainer');
    if (!container) return;

    // Create Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-group">
            <div class="add-keyword-row">
                <input type="text" id="newKeywordInput" class="text-input" placeholder="Add keyword..." />
                <button id="addKeywordBtn" class="btn btn-small btn-primary">Add</button>
            </div>

            <div id="keywordList" class="keyword-list">
                <div class="empty-state">No keywords added</div>
            </div>
        </div>
    `;

    // Create Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="input-group">
            <div class="add-keyword-row">
                <input type="text" id="channelInput" class="text-input" placeholder="Add @handle or channel ID..." />
                <button id="addChannelBtn" class="btn btn-small btn-primary">Add</button>
            </div>

            <div id="channelList" class="keyword-list">
                <div class="empty-state">No channels blocked</div>
            </div>
        </div>
    `;

    // Create Content tab content
    const contentTab = document.createElement('div');
    contentTab.innerHTML = `
        <div class="toggle-group">
            <div class="toggle-row">
                <label for="hideAllShorts" class="toggle-label">
                    <span class="toggle-title">Hide Shorts</span>
                    <span class="toggle-desc">Remove all Shorts from feed</span>
                </label>
                <label class="switch">
                    <input type="checkbox" id="hideAllShorts">
                    <span class="slider round"></span>
                </label>
            </div>

            <div class="toggle-row">
                <label for="hideAllComments" class="toggle-label">
                    <span class="toggle-title">Hide All Comments</span>
                    <span class="toggle-desc">Remove comment sections entirely</span>
                </label>
                <label class="switch">
                    <input type="checkbox" id="hideAllComments">
                    <span class="slider round"></span>
                </label>
            </div>

            <div class="toggle-row">
                <label for="filterComments" class="toggle-label">
                    <span class="toggle-title">Filter Comments</span>
                    <span class="toggle-desc">Hide only comments with keywords</span>
                </label>
                <label class="switch">
                    <input type="checkbox" id="filterComments">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
    `;

    // Create tabs using UIComponents
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keywords', content: keywordsContent },
            { id: 'channels', label: 'Channels', content: channelsContent },
            {
                id: 'content',
                label: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
                content: contentTab
            }
        ],
        defaultTab: 'keywords'
    });

    container.appendChild(tabs.container);
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize tabs first
    initializePopupFiltersTabs();

    // Get DOM elements
    const newKeywordInput = document.getElementById('newKeywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordList = document.getElementById('keywordList');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelList');

    const hideAllShortsCheckbox = document.getElementById('hideAllShorts');
    const hideAllCommentsCheckbox = document.getElementById('hideAllComments');
    const filterCommentsCheckbox = document.getElementById('filterComments');

    const openInTabBtn = document.getElementById('openInTabBtn');

    // ============================================================================
    // STATE MANAGEMENT (using StateManager)
    // ============================================================================

    // Load initial settings
    await StateManager.loadSettings();

    // Apply theme immediately after loading
    const state = StateManager.getState();
    if (state.theme) {
        const SettingsAPI = window.FilterTubeSettings || {};
        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(state.theme);
        }
    }

    // Subscribe to state changes for automatic UI updates
    StateManager.subscribe((eventType, data) => {
        console.log('Popup: State changed', eventType, data);

        // Re-render when state changes
        if (['keywordAdded', 'keywordRemoved', 'keywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKeywords();
        }

        if (['channelAdded', 'channelRemoved', 'channelUpdated', 'load', 'save'].includes(eventType)) {
            renderChannels();
        }

        if (eventType === 'settingUpdated') {
            updateCheckboxes();
        }

        if (eventType === 'themeChanged') {
            // Theme is already applied by StateManager
        }
    });

    // ============================================================================
    // RENDERING (using RenderEngine)
    // ============================================================================

    function renderKeywords() {
        if (!keywordList) return;
        RenderEngine.renderKeywordList(keywordList, {
            minimal: true,
            showSearch: false,
            showSort: false
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        RenderEngine.renderChannelList(channelListEl, {
            minimal: true,
            showSearch: false,
            showSort: false,
            showNodeMapping: false
        });
    }

    function updateCheckboxes() {
        const state = StateManager.getState();

        if (hideAllShortsCheckbox) {
            hideAllShortsCheckbox.checked = state.hideShorts;
        }

        if (hideAllCommentsCheckbox) {
            hideAllCommentsCheckbox.checked = state.hideComments;
        }

        if (filterCommentsCheckbox) {
            filterCommentsCheckbox.checked = state.hideComments ? false : state.filterComments;
            filterCommentsCheckbox.disabled = state.hideComments;
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    // Add keyword
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            const word = (newKeywordInput?.value || '').trim();
            if (!word) return;

            const success = await StateManager.addKeyword(word);
            if (success) {
                if (newKeywordInput) newKeywordInput.value = '';
                UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
            }
        });
    }

    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && addKeywordBtn) {
                addKeywordBtn.click();
            }
        });
    }

    // Add channel
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
                    // Reset button text BEFORE flashing success message
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
                } else {
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    alert(result.error || 'Failed to add channel');
                }
            } catch (error) {
                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;
                alert('Failed to add channel: ' + error.message);
            }
        });
    }

    if (channelInput) {
        channelInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && addChannelBtn) {
                addChannelBtn.click();
            }
        });
    }

    // Checkbox handlers
    if (hideAllShortsCheckbox) {
        hideAllShortsCheckbox.addEventListener('change', async () => {
            await StateManager.updateSetting('hideShorts', hideAllShortsCheckbox.checked);
        });
    }

    if (hideAllCommentsCheckbox) {
        hideAllCommentsCheckbox.addEventListener('change', async () => {
            await StateManager.updateSetting('hideComments', hideAllCommentsCheckbox.checked);
        });
    }

    if (filterCommentsCheckbox) {
        filterCommentsCheckbox.addEventListener('change', async () => {
            await StateManager.updateSetting('filterComments', filterCommentsCheckbox.checked);
        });
    }

    // Open in tab
    if (openInTabBtn) {
        openInTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('html/tab-view.html') });
        });
    }
});
