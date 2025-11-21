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
                        placeholder="Add channel @handle or ID...">
                    <button id="addChannelBtn" class="btn-primary">Add</button>
                </div>

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
                .map(entry => (entry && entry.word ? { word: entry.word.trim(), exact: !!entry.exact } : null))
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
                    return raw ? { word: raw, exact: isExact } : null;
                })
                .filter(Boolean);
        }

        if (typeof compiledKeywords === 'string') {
            return compiledKeywords
                .split(',')
                .map(k => k.trim())
                .filter(Boolean)
                .map(word => ({ word, exact: false }));
        }

        return [];
    }

    function normalizeChannels(rawChannels) {
        if (Array.isArray(rawChannels)) {
            return rawChannels
                .map(ch => typeof ch === 'string' ? { name: ch.trim(), id: ch.trim() } : ch) // Assume ch is already an object if not string
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(ch => ({ name: ch.trim(), id: ch.trim() }))
                .filter(ch => ch.name);
        }

        return [];
    }

    function compileKeywords(keywords) {
        return keywords.map(k => {
            const escaped = k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                pattern: k.exact ? `\\b${escaped}\\b` : escaped,
                flags: 'i'
            };
        });
    }

    function buildCompiledSettings({ hideShorts, hideComments, filterCommentsOverride }) {
        return {
            filterKeywords: compileKeywords(state.keywords),
            filterChannels: state.channels.map(ch => ch.id), // Send only IDs to content script
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
        chrome.storage.local.get([
            'uiKeywords',
            'filterKeywords',
            'filterChannels',
            'hideAllShorts',
            'hideAllComments',
            'filterComments',
            'stats' // Load stats object
        ], result => {
            state.keywords = normalizeKeywords(result.uiKeywords, result.filterKeywords);
            state.channels = normalizeChannels(result.filterChannels);
            state.stats = result.stats || { hiddenCount: 0, savedMinutes: 0 }; // Default stats

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

            renderKeywordList();
            renderChannelList();
            updateStats();
        });
    }

    function saveSettings() {
        const hideShorts = hideShortsToggle ? hideShortsToggle.checked : false;
        const hideComments = hideCommentsToggle ? hideCommentsToggle.checked : false;
        const filterComments = hideComments ? false : (filterCommentsToggle ? filterCommentsToggle.checked : false);
        const compiledSettings = buildCompiledSettings({
            hideShorts,
            hideComments,
            filterCommentsOverride: filterComments
        });

        chrome.storage.local.set({
            uiKeywords: state.keywords,
            filterKeywords: compiledSettings.filterKeywords,
            filterChannels: compiledSettings.filterChannels,
            hideAllShorts: hideShorts,
            hideAllComments: hideComments,
            filterComments: filterComments
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('FilterTube Tab View: Failed to save settings', chrome.runtime.lastError);
                return;
            }
            broadcastSettings(compiledSettings);
            updateStats();
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

            const item = document.createElement('div');
            item.className = 'list-item';

            const left = document.createElement('div');
            left.className = 'item-left';

            const word = document.createElement('span');
            word.className = 'item-word';
            word.textContent = entry.word;
            left.appendChild(word);

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
            if (state.keywords.some(k => k.word.toLowerCase() === word.toLowerCase())) return;

            state.keywords.push({ word, exact: false });
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

        // Filter Channels by search term
        const searchTerm = (searchChannels?.value || '').trim().toLowerCase();
        let displayChannels = [...state.channels];

        if (searchTerm) {
            displayChannels = displayChannels.filter(ch => {
                const name = (ch.name || ch.id || '').toLowerCase();
                return name.includes(searchTerm);
            });
        }

        // Sort Channels
        const sortMode = channelSort ? channelSort.value : 'newest';

        if (sortMode === 'az') {
            displayChannels.sort((a, b) => a.name.localeCompare(b.name));
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
            item.className = 'list-item';

            const left = document.createElement('div');
            left.className = 'item-word';
            left.textContent = channel.name || channel.id;

            const controls = document.createElement('div');
            controls.className = 'item-controls';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn'; // Use shared class
            deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.addEventListener('click', () => {
                state.channels.splice(originalIndex, 1);
                saveSettings();
                renderChannelList();
            });

            controls.appendChild(deleteBtn);
            item.appendChild(left);
            item.appendChild(controls);
            channelListEl.appendChild(item);
        });
    }

    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', () => {
            const val = (channelInput?.value || '').trim();
            if (val && !state.channels.some(ch => ch.id === val)) {
                state.channels.push({ name: val, id: val }); // Store as object
                if (channelInput) channelInput.value = '';
                saveSettings();
                renderChannelList();

                // Flash success feedback
                UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
            }
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
        clearChannelsBtn.addEventListener('click', () => {
            if (!state.channels.length) return;
            if (!confirm('Delete all blocked channels? This cannot be undone.')) return;
            state.channels = [];
            saveSettings();
            renderChannelList();
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
        hideCommentsToggle.addEventListener('change', () => {
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

        filterCommentsToggle.addEventListener('change', () => {
            state.filterComments = filterCommentsToggle.checked;
            saveSettings();
        });
    }

    // --- Sorting Logic ---
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderKeywordList();
        });
    }

    if (channelSort) {
        channelSort.addEventListener('change', () => {
            renderChannelList();
        });
    }

    quickAddKeywordBtn?.addEventListener('click', () => {
        navItems.find(nav => nav.getAttribute('data-tab') === 'filters')?.click();
        keywordInput?.focus();
    });

    quickKidsModeBtn?.addEventListener('click', () => {
        navItems.find(nav => nav.getAttribute('data-tab') === 'kids')?.click();
    });

    themeToggle?.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        chrome.storage?.local.set({ ftThemePreference: nextTheme });
    });

    loadSettings();
});
