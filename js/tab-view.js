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
                .map(ch => {
                    if (typeof ch === 'string') {
                        // Legacy string format - convert to object
                        return { name: ch.trim(), id: ch.trim(), handle: null };
                    } else if (ch && typeof ch === 'object') {
                        // Already an object - ensure it has all fields
                        return {
                            name: ch.name || ch.id,
                            id: ch.id,
                            handle: ch.handle || null
                        };
                    }
                    return null;
                })
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(ch => ({ name: ch.trim(), id: ch.trim(), handle: null }))
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

        // Filter Channels by search term (search both name and ID)
        const searchTerm = (searchChannels?.value || '').trim().toLowerCase();
        let displayChannels = [...state.channels];

        if (searchTerm) {
            displayChannels = displayChannels.filter(ch => {
                const name = (ch.name || '').toLowerCase();
                const id = (ch.id || '').toLowerCase();
                return name.includes(searchTerm) || id.includes(searchTerm);
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

            // Display format based on whether we have a fetched name
            const channelId = channel.id || '';
            const channelName = channel.name || '';
            const channelHandle = channel.handle || '';

            // If name is different from ID and looks like a UC ID, show "Name (@handle) [UCxxx]"
            const isUCId = channelId.toLowerCase().startsWith('uc');
            const hasDistinctName = channelName !== channelId;

            if (isUCId && hasDistinctName) {
                // Show as "Channel Name (@handle) [UCxxx]" or "Channel Name [UCxxx]" if no handle
                const nameSpan = document.createElement('span');
                nameSpan.textContent = channelName;
                nameSpan.style.fontWeight = '500';

                left.appendChild(nameSpan);

                // Add handle if available
                if (channelHandle) {
                    const handleSpan = document.createElement('span');
                    handleSpan.textContent = ` ${channelHandle}`;
                    handleSpan.style.opacity = '0.75';
                    handleSpan.style.fontSize = '0.9em';
                    handleSpan.style.color = 'var(--ft-color-brand-primary, #0066cc)';
                    handleSpan.style.fontWeight = '400';
                    left.appendChild(handleSpan);
                }

                // Add UC ID
                const idSpan = document.createElement('span');
                idSpan.textContent = ` [${channelId}]`;
                idSpan.style.opacity = '0.5';
                idSpan.style.fontSize = '0.85em';
                idSpan.style.fontWeight = '400';

                left.appendChild(idSpan);
            } else {
                // Show as-is for @handles or plain text
                left.textContent = channelName || channelId;
            }

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

    /**
     * Fetch channel name and handle from YouTube using channel ID
     * Uses YouTube's internal API for reliable data extraction
     */
    async function fetchChannelInfo(channelId) {
        try {
            // Normalize the channel ID
            const cleanId = channelId.replace(/^channel\//i, '');

            console.log('FilterTube: Fetching channel info for:', cleanId);

            // Use YouTube's internal browse API
            const apiUrl = 'https://www.youtube.com/youtubei/v1/browse';
            const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Public YouTube API key used by web client

            const requestBody = {
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: '2.20231212.01.00'
                    }
                },
                browseId: cleanId
            };

            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error('FilterTube: API request failed:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('FilterTube: Full API response:', data);

            // First try to get data from metadata (most reliable)
            const metadata = data?.metadata?.channelMetadataRenderer;

            let channelName = null;
            let channelHandle = null;

            if (metadata) {
                console.log('FilterTube: Found metadata:', metadata);
                // Get channel name from metadata
                channelName = metadata.title;

                // Get handle from vanityChannelUrl or ownerUrls
                if (metadata.vanityChannelUrl) {
                    const match = metadata.vanityChannelUrl.match(/@([^/]+)/);
                    if (match) {
                        channelHandle = '@' + match[1];
                    }
                } else if (metadata.ownerUrls && metadata.ownerUrls.length > 0) {
                    const match = metadata.ownerUrls[0].match(/@([^/]+)/);
                    if (match) {
                        channelHandle = '@' + match[1];
                    }
                }
            }

            // Fallback to header data if metadata didn't work
            if (!channelName || !channelHandle) {
                const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
                console.log('FilterTube: Trying header data:', header);

                if (header) {
                    // Try different paths for channel name
                    if (!channelName) {
                        channelName = header.title ||
                            header.channelTitle?.simpleText ||
                            header.pageTitle;
                    }

                    // Try to find the handle from various locations
                    if (!channelHandle) {
                        if (header.channelHandleText?.runs?.[0]?.text) {
                            channelHandle = header.channelHandleText.runs[0].text;
                        } else if (header.handle?.simpleText) {
                            channelHandle = header.handle.simpleText;
                        }
                    }
                }
            }

            console.log('FilterTube: Extracted -', 'Name:', channelName, 'Handle:', channelHandle);

            return {
                name: channelName,
                handle: channelHandle
            };
        } catch (error) {
            console.error('FilterTube: Failed to fetch channel info:', error);
            return null;
        }
    }

    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', async () => {
            const val = (channelInput?.value || '').trim();
            if (!val) return;

            // Normalize the ID first (remove channel/ prefix if present)
            const normalizedId = val.toLowerCase().replace(/^channel\//i, '');

            // Check for duplicates (check both raw input and normalized ID)
            if (state.channels.some(ch => ch.id === normalizedId || ch.id === val.toLowerCase() || ch.handle === val)) {
                alert('This channel is already in your filter list!');
                return;
            }

            // Show loading state
            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            let channelName = val;
            let channelHandle = null;
            let channelId = normalizedId;

            const isUCId = normalizedId.startsWith('uc');
            const isHandle = val.startsWith('@');

            // Fetch channel info from YouTube API
            if (isUCId) {
                console.log('FilterTube: Fetching info for UC ID:', normalizedId);
                const channelInfo = await fetchChannelInfo(normalizedId);
                console.log('FilterTube: API Response:', channelInfo);

                if (channelInfo && channelInfo.name) {
                    channelName = channelInfo.name;
                    channelHandle = channelInfo.handle;
                    console.log('FilterTube: Successfully fetched - Name:', channelName, 'Handle:', channelHandle);
                } else {
                    console.warn('FilterTube: Could not fetch channel name, using ID as name');
                }
            } else if (isHandle) {
                // For handles, we'll store as-is and use it as both name and handle
                channelName = val;
                channelHandle = val;
                channelId = val.toLowerCase(); // Keep handle as ID for filtering (normalized)

                // Try to proactively fetch the UC ID to populate channelMap
                // This is non-blocking - if it fails, we still save the handle
                try {
                    const handleWithoutAt = val.replace('@', '');
                    const aboutUrl = `https://www.youtube.com/@${handleWithoutAt}/about`;
                    const response = await fetch(aboutUrl);
                    const text = await response.text();
                    const match = text.match(/channel\/(UC[\w-]{22})/);
                    if (match && match[1]) {
                        const resolvedId = match[1];
                        console.log(`FilterTube: ✅ Resolved ${val} -> ${resolvedId}`);
                        // We found the UC ID! Store it in channelMap for future use
                        chrome.storage.local.get(['channelMap'], (result) => {
                            const currentMap = result.channelMap || {};
                            const normHandle = val.startsWith('@') ? val.toLowerCase() : `@${val.toLowerCase()}`;  // Keep the @ in the key!
                            const normId = resolvedId.toLowerCase();
                            currentMap[normId] = normHandle;     // UC... -> @handle
                            currentMap[normHandle] = normId;     // @handle -> UC...
                            chrome.storage.local.set({ channelMap: currentMap });
                            console.log('FilterTube: Updated channelMap with new mapping:', normId, '<->', normHandle);
                        });
                    }
                } catch (err) {
                    console.warn('FilterTube: Could not resolve handle to UC ID:', err);
                    // No problem - we'll still save the handle and resolve it later if needed
                }
            }

            console.log('FilterTube: Final channel entry:', { name: channelName, id: channelId, handle: channelHandle });

            // Store with name, id, and handle
            const channelEntry = {
                name: channelName,
                id: channelId,
                handle: channelHandle
            };

            state.channels.push(channelEntry);
            if (channelInput) channelInput.value = '';

            // Re-enable button
            addChannelBtn.disabled = false;
            addChannelBtn.textContent = originalText;

            saveSettings();
            renderChannelList();

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
