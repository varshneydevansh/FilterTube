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
            <div class="search-row">
                <input type="text" id="searchKeywordsPopup" class="text-input search-input" placeholder="Search keywords..." />
            </div>

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
            <div class="search-row">
                <input type="text" id="searchChannelsPopup" class="text-input search-input" placeholder="Search channels..." />
            </div>

            <div class="add-keyword-row">
                <input type="text" id="channelInput" class="text-input" placeholder="Add @handle, Channel ID.. or c/ChannelName" />
                <button id="addChannelBtn" class="btn btn-small btn-primary">Add</button>
            </div>

            <div id="channelList" class="keyword-list">
                <div class="empty-state">No channels blocked</div>
            </div>
        </div>
    `;

    // Create Content tab content
    const contentTab = document.createElement('div');

    const contentSearchRow = document.createElement('div');
    contentSearchRow.className = 'search-row';

    const contentControlsSearch = document.createElement('input');
    contentControlsSearch.type = 'text';
    contentControlsSearch.id = 'searchContentControlsPopup';
    contentControlsSearch.className = 'text-input search-input';
    contentControlsSearch.placeholder = 'Search content controls...';

    contentSearchRow.appendChild(contentControlsSearch);
    contentTab.appendChild(contentSearchRow);

    const catalog = window.FilterTubeContentControlsCatalog?.getCatalog?.() || [];

    function hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return '';
        const sanitized = hex.replace('#', '');
        const bigint = parseInt(sanitized.length === 3
            ? sanitized.split('').map(ch => ch + ch).join('')
            : sanitized, 16);
        if (Number.isNaN(bigint)) return '';
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyControlGroupTheme(groupEl, accentColor) {
        if (!groupEl || !accentColor) return;
        groupEl.style.setProperty('--ft-control-accent', accentColor);
        groupEl.style.setProperty('--ft-control-accent-border', hexToRgba(accentColor, 0.35));
        groupEl.style.setProperty('--ft-control-accent-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-border', hexToRgba(accentColor, 0.28));
        groupEl.style.setProperty('--ft-control-accent-row-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-hover-bg', hexToRgba(accentColor, 0.14));
    }

    catalog.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.setAttribute('data-ft-control-group', 'true');
        groupEl.setAttribute('data-ft-group-title', group?.title || '');
        groupEl.className = 'content-control-group';
        applyControlGroupTheme(groupEl, group?.accentColor);

        const headerEl = document.createElement('div');
        headerEl.className = 'content-control-group__header';

        const titleEl = document.createElement('div');
        titleEl.className = 'content-control-group__title';
        titleEl.textContent = group?.title || '';

        headerEl.appendChild(titleEl);
        groupEl.appendChild(headerEl);

        const rowsContainer = document.createElement('div');
        rowsContainer.className = 'content-control-group__rows';

        (group.controls || []).forEach(control => {
            const row = document.createElement('div');
            row.className = 'toggle-row';
            row.setAttribute('data-ft-control-row', 'true');
            row.setAttribute('data-ft-search', `${control.title || ''} ${control.description || ''}`.toLowerCase());

            const label = document.createElement('label');
            const checkboxId = `popupSetting_${control.key}`;
            label.setAttribute('for', checkboxId);
            label.className = 'toggle-label';
            label.innerHTML = `
                <span class="toggle-title">${control.title || ''}</span>
            `;

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = checkboxId;
            input.setAttribute('data-ft-setting', control.key);

            const slider = document.createElement('span');
            slider.className = 'slider round';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);

            row.appendChild(label);
            row.appendChild(switchLabel);
            rowsContainer.appendChild(row);
        });

        groupEl.appendChild(rowsContainer);
        contentTab.appendChild(groupEl);
    });

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
    const searchKeywordsPopup = document.getElementById('searchKeywordsPopup');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelList');
    const searchChannelsPopup = document.getElementById('searchChannelsPopup');

    const contentControlsContainer = document.getElementById('popupFiltersTabsContainer');
    const contentControlCheckboxes = contentControlsContainer
        ? contentControlsContainer.querySelectorAll('input[type="checkbox"][data-ft-setting]')
        : [];

    const openInTabBtn = document.getElementById('openInTabBtn');
    const toggleEnabledBtn = document.getElementById('toggleEnabledBtn');

    let keywordSearchValue = '';
    let channelSearchValue = '';

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
            showSearch: true,
            showSort: false,
            searchValue: keywordSearchValue,
            sortValue: 'newest'
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        RenderEngine.renderChannelList(channelListEl, {
            minimal: true,
            showSearch: true,
            showSort: false,
            showNodeMapping: false,
            searchValue: channelSearchValue,
            sortValue: 'newest'
        });
    }

    function filterContentControlsPopup() {
        const input = document.getElementById('searchContentControlsPopup');
        const q = (input?.value || '').trim().toLowerCase();
        const groups = contentControlsContainer?.querySelectorAll('[data-ft-control-group]') || [];

        groups.forEach(groupEl => {
            const groupTitle = (groupEl.getAttribute('data-ft-group-title') || '').toLowerCase();
            const groupMatches = q ? groupTitle.includes(q) : false;
            const rows = groupEl.querySelectorAll('[data-ft-control-row]');

            let anyVisible = false;
            rows.forEach(row => {
                const text = row.getAttribute('data-ft-search') || '';
                const show = !q || groupMatches || text.includes(q);
                row.style.display = show ? '' : 'none';
                if (show) anyVisible = true;
            });

            groupEl.style.display = (!q || anyVisible) ? '' : 'none';
        });
    }

    function updateCheckboxes() {
        const state = StateManager.getState();

        contentControlCheckboxes.forEach(el => {
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            el.checked = !!state[key];
        });

        const filterCommentsEl = contentControlsContainer?.querySelector('input[data-ft-setting="filterComments"]') || null;
        if (filterCommentsEl) {
            filterCommentsEl.checked = state.hideComments ? false : !!state.filterComments;
            filterCommentsEl.disabled = !!state.hideComments;
        }

        if (toggleEnabledBtn) {
            const enabled = state.enabled !== false;
            const indicator = toggleEnabledBtn.querySelector('.status-indicator');
            const textEl = toggleEnabledBtn.querySelector('.status-text');

            toggleEnabledBtn.classList.toggle('is-disabled', !enabled);
            toggleEnabledBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');

            if (indicator) {
                indicator.classList.toggle('active', enabled);
            }
            if (textEl) {
                textEl.textContent = enabled ? 'Filtering Active' : 'Filtering Paused';
            }
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();
    filterContentControlsPopup();

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    if (searchKeywordsPopup) {
        searchKeywordsPopup.addEventListener('input', () => {
            keywordSearchValue = searchKeywordsPopup.value || '';
            renderKeywords();
        });
    }

    if (searchChannelsPopup) {
        searchChannelsPopup.addEventListener('input', () => {
            channelSearchValue = searchChannelsPopup.value || '';
            renderChannels();
        });
    }

    const searchContentControlsPopup = document.getElementById('searchContentControlsPopup');
    if (searchContentControlsPopup) {
        searchContentControlsPopup.addEventListener('input', () => {
            filterContentControlsPopup();
        });
    }

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
    contentControlCheckboxes.forEach(el => {
        el.addEventListener('change', async () => {
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            await StateManager.updateSetting(key, el.checked);
        });
    });

    // Open in tab
    if (openInTabBtn) {
        openInTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('html/tab-view.html') });
        });
    }

    if (toggleEnabledBtn) {
        toggleEnabledBtn.addEventListener('click', async () => {
            const state = StateManager.getState();
            const enabled = state.enabled !== false;
            await StateManager.updateSetting('enabled', !enabled);
            updateCheckboxes();
        });
    }
});
