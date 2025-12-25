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

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="keywordDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="keywordDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="keywordDateTo" class="select-input date-input" />
                <button id="keywordDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
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

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="channelDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="channelDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="channelDateTo" class="select-input date-input" />
                <button id="channelDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="channelListEl" class="advanced-list"></div>
    `;

    // Content tab with checkboxes
    const contentTab = document.createElement('div');

    const contentSearchRow = document.createElement('div');
    contentSearchRow.className = 'search-row';

    const contentControlsSearch = document.createElement('input');
    contentControlsSearch.type = 'text';
    contentControlsSearch.id = 'searchContentControls';
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
        groupEl.style.setProperty('--ft-control-accent-bg-dark', hexToRgba(accentColor, 0.10));
        groupEl.style.setProperty('--ft-control-accent-row-border', hexToRgba(accentColor, 0.28));
        groupEl.style.setProperty('--ft-control-accent-row-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-hover-bg', hexToRgba(accentColor, 0.14));
        groupEl.style.setProperty('--ft-control-accent-row-hover-dark', hexToRgba(accentColor, 0.12));
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
            if (control.description) {
                row.setAttribute('title', control.description);
            }

            const info = document.createElement('div');
            info.className = 'toggle-info';

            const t = document.createElement('div');
            t.className = 'toggle-title';
            t.textContent = control.title || '';

            if (control.description) {
                const infoWrapper = document.createElement('div');
                infoWrapper.className = 'toggle-info-text';
                infoWrapper.appendChild(t);
                info.appendChild(infoWrapper);
            } else {
                info.appendChild(t);
            }

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `setting_${control.key}`;
            input.setAttribute('data-ft-setting', control.key);

            const slider = document.createElement('span');
            slider.className = 'slider round';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);

            row.appendChild(info);
            row.appendChild(switchLabel);
            rowsContainer.appendChild(row);
        });

        groupEl.appendChild(rowsContainer);
        contentTab.appendChild(groupEl);
    });

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

    // Responsive nav toggle for mobile
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebarNav');
    const overlay = document.getElementById('sidebarOverlay');

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('visible');
    }

    function closeOnWide() {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    }

    navToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('visible');
    });

    overlay?.addEventListener('click', () => {
        closeSidebar();
    });

    window.addEventListener('resize', closeOnWide);
    closeOnWide();

    // Close sidebar on tab switch (for mobile)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            closeSidebar();
        });
    });
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

    const keywordDatePreset = document.getElementById('keywordDatePreset');
    const keywordDateFrom = document.getElementById('keywordDateFrom');
    const keywordDateTo = document.getElementById('keywordDateTo');
    const keywordDateClear = document.getElementById('keywordDateClear');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelListEl');
    const searchChannels = document.getElementById('searchChannels');
    const channelSort = document.getElementById('channelSort');

    const channelDatePreset = document.getElementById('channelDatePreset');
    const channelDateFrom = document.getElementById('channelDateFrom');
    const channelDateTo = document.getElementById('channelDateTo');
    const channelDateClear = document.getElementById('channelDateClear');

    const contentControlsContainer = document.getElementById('filtersTabsContainer');
    const contentControlCheckboxes = contentControlsContainer
        ? contentControlsContainer.querySelectorAll('input[type="checkbox"][data-ft-setting]')
        : [];

    const themeToggle = document.getElementById('themeToggle');

    // State for search/sort
    let keywordSearchValue = '';
    let keywordSortValue = 'newest';
    let channelSearchValue = '';
    let channelSortValue = 'newest';

    let keywordDateFromTs = null;
    let keywordDateToTs = null;
    let channelDateFromTs = null;
    let channelDateToTs = null;

    const searchContentControls = document.getElementById('searchContentControls');

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

    function toDateInputValue(dateObj) {
        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
        const y = String(dateObj.getFullYear());
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function parseDateInput(dateStr, endOfDay = false) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const parts = dateStr.split('-').map(n => Number(n));
        if (parts.length !== 3) return null;
        const [year, month, day] = parts;
        if (!year || !month || !day) return null;
        const date = endOfDay
            ? new Date(year, month - 1, day, 23, 59, 59, 999)
            : new Date(year, month - 1, day, 0, 0, 0, 0);
        const ts = date.getTime();
        return Number.isFinite(ts) ? ts : null;
    }

    function applyPresetToDateControls(preset, fromEl, toEl) {
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (preset === 'today') {
            fromEl.value = toDateInputValue(startToday);
            toEl.value = toDateInputValue(endToday);
            return;
        }

        if (preset === '7d' || preset === '30d') {
            const days = preset === '7d' ? 7 : 30;
            const from = new Date(startToday);
            from.setDate(from.getDate() - (days - 1));
            fromEl.value = toDateInputValue(from);
            toEl.value = toDateInputValue(endToday);
            return;
        }

        if (preset === 'all') {
            fromEl.value = '';
            toEl.value = '';
        }
    }

    function renderKeywords() {
        if (!keywordListEl) return;
        RenderEngine.renderKeywordList(keywordListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            searchValue: keywordSearchValue,
            sortValue: keywordSortValue,
            dateFrom: keywordDateFromTs,
            dateTo: keywordDateToTs
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
            sortValue: channelSortValue,
            dateFrom: channelDateFromTs,
            dateTo: channelDateToTs
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
    }

    function filterContentControls() {
        const q = (searchContentControls?.value || '').trim().toLowerCase();
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
            const totalSeconds = state.stats?.savedSeconds || 0;

            if (totalSeconds < 60) {
                // Less than 1 minute: show seconds
                statSavedTime.textContent = `${totalSeconds}s`;
            } else if (totalSeconds < 3600) {
                // Less than 1 hour: show minutes and seconds
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                statSavedTime.textContent = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
            } else {
                // 1 hour or more: show hours, minutes, and optionally seconds
                const hours = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;

                if (secs > 0) {
                    statSavedTime.textContent = `${hours}h ${mins}m ${secs}s`;
                } else if (mins > 0) {
                    statSavedTime.textContent = `${hours}h ${mins}m`;
                } else {
                    statSavedTime.textContent = `${hours}h`;
                }
            }
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();
    filterContentControls();
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

    function updateKeywordDateFilterFromInputs() {
        keywordDateFromTs = parseDateInput(keywordDateFrom?.value || '', false);
        keywordDateToTs = parseDateInput(keywordDateTo?.value || '', true);
        renderKeywords();
    }

    if (keywordDatePreset) {
        keywordDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, keywordDateFrom, keywordDateTo);
                keywordDateFromTs = parseDateInput(keywordDateFrom?.value || '', false);
                keywordDateToTs = parseDateInput(keywordDateTo?.value || '', true);
                renderKeywords();
            }
        });
    }

    if (keywordDateFrom) {
        keywordDateFrom.addEventListener('change', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'custom';
            updateKeywordDateFilterFromInputs();
        });
    }

    if (keywordDateTo) {
        keywordDateTo.addEventListener('change', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'custom';
            updateKeywordDateFilterFromInputs();
        });
    }

    if (keywordDateClear) {
        keywordDateClear.addEventListener('click', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'all';
            if (keywordDateFrom) keywordDateFrom.value = '';
            if (keywordDateTo) keywordDateTo.value = '';
            keywordDateFromTs = null;
            keywordDateToTs = null;
            renderKeywords();
        });
    }

    if (searchContentControls) {
        searchContentControls.addEventListener('input', () => {
            filterContentControls();
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
                    // Reset button text BEFORE flashing success message
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
                } else {
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.showToast(result.error || 'Failed to add channel', 'error');
                }
            } catch (error) {
                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;
                UIComponents.showToast('Failed to add channel: ' + error.message, 'error');
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

    function updateChannelDateFilterFromInputs() {
        channelDateFromTs = parseDateInput(channelDateFrom?.value || '', false);
        channelDateToTs = parseDateInput(channelDateTo?.value || '', true);
        renderChannels();
    }

    if (channelDatePreset) {
        channelDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, channelDateFrom, channelDateTo);
                channelDateFromTs = parseDateInput(channelDateFrom?.value || '', false);
                channelDateToTs = parseDateInput(channelDateTo?.value || '', true);
                renderChannels();
            }
        });
    }

    if (channelDateFrom) {
        channelDateFrom.addEventListener('change', () => {
            if (channelDatePreset) channelDatePreset.value = 'custom';
            updateChannelDateFilterFromInputs();
        });
    }

    if (channelDateTo) {
        channelDateTo.addEventListener('change', () => {
            if (channelDatePreset) channelDatePreset.value = 'custom';
            updateChannelDateFilterFromInputs();
        });
    }

    if (channelDateClear) {
        channelDateClear.addEventListener('click', () => {
            if (channelDatePreset) channelDatePreset.value = 'all';
            if (channelDateFrom) channelDateFrom.value = '';
            if (channelDateTo) channelDateTo.value = '';
            channelDateFromTs = null;
            channelDateToTs = null;
            renderChannels();
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Settings
    // ============================================================================

    contentControlCheckboxes.forEach(el => {
        el.addEventListener('change', async () => {
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            await StateManager.updateSetting(key, el.checked);
        });
    });

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
    const quickContentControlsBtn = document.getElementById('quickContentControlsBtn');

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
            const channelsTab = tabs?.querySelector('[data-tab-id="channels"]');
            channelsTab?.click();
            setTimeout(() => document.getElementById('channelInput')?.focus(), 50);
        });
    }

    if (quickContentControlsBtn) {
        quickContentControlsBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const contentTabBtn = tabs?.querySelector('[data-tab-id="content"]');
            contentTabBtn?.click();
            // slight delay to ensure tab render, then focus search
            setTimeout(() => document.getElementById('searchContentControls')?.focus(), 50);
        });
    }
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
            'settings': 'Settings',
            'help': 'Help'
        };
        if (pageTitle && titles[viewId]) {
            pageTitle.textContent = titles[viewId];
        }
    }

    // Make switchView globally accessible for quick actions
    window.switchView = switchView;
}
