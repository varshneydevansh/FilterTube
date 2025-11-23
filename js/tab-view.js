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
                        return { name: ch.trim(), id: ch.trim(), handle: null, logo: null, filterAll: false };
                    } else if (ch && typeof ch === 'object') {
                        // Already an object - ensure it has all fields including filterAll and logo
                        return {
                            name: ch.name || ch.id,
                            id: ch.id,
                            handle: ch.handle || null,
                            logo: ch.logo || null,
                            filterAll: !!ch.filterAll // Preserve filterAll property
                        };
                    }
                    return null;
                })
                .filter(Boolean);
        }

        if (typeof rawChannels === 'string') {
            return rawChannels
                .split(',')
                .map(ch => ({ name: ch.trim(), id: ch.trim(), handle: null, logo: null, filterAll: false }))
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
            deleteBtn.addEventListener('click', () => {
                state.channels.splice(originalIndex, 1);
                saveSettings();
                renderChannelList();
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
            const rawId = channel.id.toLowerCase();
            let partnerValue = null;

            // Try to find mapping in globalChannelMap
            if (globalChannelMap[rawId]) {
                partnerValue = globalChannelMap[rawId];
            } else if (rawId.startsWith('@')) {
                // Try without @
                partnerValue = globalChannelMap[rawId.replace('@', '')];
            }

            // SOURCE (What user entered - NO BOX, just plain text)
            const sourceText = document.createElement('span');
            sourceText.className = 'node-source-text';
            sourceText.textContent = channel.id;

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
            pillBtn.addEventListener('click', () => {
                state.channels[originalIndex].filterAll = !state.channels[originalIndex].filterAll;
                saveSettings();
                renderChannelList(); // Re-render to update style
            });

            bodyRow.appendChild(pillBtn);
            item.appendChild(bodyRow);

            channelListEl.appendChild(item);
        });
    }

    /**
     * Fetch channel name and handle from YouTube by scraping the channel page
     * More reliable than API calls which can be blocked
     */
    async function fetchChannelInfo(channelId) {
        try {
            // Normalize the channel ID
            const cleanId = channelId.replace(/^channel\//i, '');

            console.log('FilterTube: Fetching channel info for:', cleanId);

            // Fetch the channel page HTML
            const channelUrl = `https://www.youtube.com/channel/${cleanId}`;
            const response = await fetch(channelUrl);

            if (!response.ok) {
                console.error('FilterTube: Failed to fetch channel page:', response.status);
                return null;
            }

            const html = await response.text();

            // Extract ytInitialData from the page
            const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
            if (!ytInitialDataMatch) {
                console.error('FilterTube: Could not find ytInitialData in page');
                return null;
            }

            const data = JSON.parse(ytInitialDataMatch[1]);

            let channelName = null;
            let channelHandle = null;
            let channelLogo = null;

            // --- BLOCK 1: Metadata Renderer (Standard & Most Reliable) ---
            const metadata = data?.metadata?.channelMetadataRenderer;
            if (metadata) {
                console.log('FilterTube: Found metadata:', metadata);

                // Name
                channelName = metadata.title;

                // Handle from vanityChannelUrl
                if (metadata.vanityChannelUrl) {
                    const match = metadata.vanityChannelUrl.match(/@([^/]+)/);
                    if (match) channelHandle = '@' + match[1];
                }

                // Logo (Avatar)
                if (metadata.avatar?.thumbnails?.length > 0) {
                    channelLogo = metadata.avatar.thumbnails[metadata.avatar.thumbnails.length - 1].url;
                }
            }

            // --- BLOCK 2: Page Header ViewModel (New YouTube Structure) ---
            if (!channelName || !channelLogo) {
                const pageHeader = data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

                if (pageHeader) {
                    console.log('FilterTube: Found pageHeaderViewModel:', pageHeader);

                    // Name from ViewModel
                    if (!channelName && pageHeader.title?.dynamicTextViewModel?.text?.content) {
                        channelName = pageHeader.title.dynamicTextViewModel.text.content;
                    }

                    // Handle from metadata rows
                    if (!channelHandle) {
                        const metadataRows = pageHeader.metadata?.contentMetadataViewModel?.metadataRows;
                        if (metadataRows && metadataRows.length > 0) {
                            const handlePart = metadataRows[0]?.metadataParts?.[0]?.text?.content;
                            if (handlePart && handlePart.startsWith('@')) {
                                channelHandle = handlePart;
                            }
                        }
                    }

                    // Logo from decoratedAvatarViewModel
                    if (!channelLogo) {
                        const sources = pageHeader.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
                        if (sources && sources.length > 0) {
                            channelLogo = sources[sources.length - 1].url;
                        }
                    }
                }
            }

            // --- BLOCK 3: Legacy Headers (c4TabbedHeaderRenderer / pageHeaderRenderer) ---
            if (!channelName || !channelLogo) {
                const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
                if (header) {
                    console.log('FilterTube: Trying legacy header:', header);

                    // Name
                    if (!channelName) {
                        channelName = header.title || header.channelTitle?.simpleText || header.pageTitle;
                    }

                    // Handle
                    if (!channelHandle) {
                        if (header.channelHandleText?.runs?.[0]?.text) {
                            channelHandle = header.channelHandleText.runs[0].text;
                        } else if (header.handle?.simpleText) {
                            channelHandle = header.handle.simpleText;
                        }
                    }

                    // Logo
                    if (!channelLogo && header.avatar?.thumbnails?.length > 0) {
                        channelLogo = header.avatar.thumbnails[header.avatar.thumbnails.length - 1].url;
                    }
                }
            }

            // --- BLOCK 4: Microformat (Backup) ---
            if (!channelName || !channelHandle) {
                const microformat = data?.microformat?.microformatDataRenderer;
                if (microformat) {
                    console.log('FilterTube: Trying microformat:', microformat);

                    if (!channelName) {
                        channelName = microformat.title;
                    }

                    if (!channelHandle && microformat.vanityChannelUrl) {
                        const match = microformat.vanityChannelUrl.match(/@([^/]+)/);
                        if (match) channelHandle = '@' + match[1];
                    }

                    if (!channelLogo && microformat.thumbnail?.thumbnails?.length > 0) {
                        channelLogo = microformat.thumbnail.thumbnails[microformat.thumbnail.thumbnails.length - 1].url;
                    }
                }
            }

            console.log('FilterTube: Extracted -', { name: channelName, handle: channelHandle, logo: channelLogo });

            return {
                name: channelName || cleanId, // Fallback to ID if name fails
                handle: channelHandle,
                logo: channelLogo
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
            let channelLogo = null;
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
                    channelLogo = channelInfo.logo;
                    console.log('FilterTube: Successfully fetched - Name:', channelName, 'Handle:', channelHandle, 'Logo:', channelLogo);
                } else {
                    console.warn('FilterTube: Could not fetch channel name, using ID as name');
                }
            } else if (isHandle) {
                // For handles, we need to resolve to UC ID and then fetch full channel info
                channelHandle = val;
                channelId = val.toLowerCase(); // Temporarily use handle as ID

                // Try to proactively fetch the UC ID to populate channelMap
                try {
                    const handleWithoutAt = val.replace('@', '');
                    const aboutUrl = `https://www.youtube.com/@${handleWithoutAt}/about`;
                    const response = await fetch(aboutUrl);
                    const text = await response.text();
                    const match = text.match(/channel\/(UC[\w-]{22})/);
                    if (match && match[1]) {
                        const resolvedId = match[1];
                        console.log(`FilterTube: ✅ Resolved ${val} -> ${resolvedId}`);

                        // Now fetch the full channel info using the UC ID
                        const channelInfo = await fetchChannelInfo(resolvedId);
                        if (channelInfo && channelInfo.name) {
                            channelName = channelInfo.name;
                            channelLogo = channelInfo.logo;
                            console.log('FilterTube: Fetched channel info - Name:', channelName, 'Logo:', channelLogo);
                        } else {
                            channelName = val; // Fallback to handle
                        }

                        // Store the mapping in channelMap
                        chrome.storage.local.get(['channelMap'], (result) => {
                            const currentMap = result.channelMap || {};
                            const normHandle = val.startsWith('@') ? val.toLowerCase() : `@${val.toLowerCase()}`;
                            const normId = resolvedId.toLowerCase();
                            currentMap[normId] = normHandle;     // UC... -> @handle
                            currentMap[normHandle] = normId;     // @handle -> UC...
                            chrome.storage.local.set({ channelMap: currentMap });
                            console.log('FilterTube: Updated channelMap with new mapping:', normId, '<->', normHandle);
                        });
                    } else {
                        channelName = val; // Fallback to handle
                    }
                } catch (err) {
                    console.warn('FilterTube: Could not resolve handle to UC ID:', err);
                    channelName = val; // Fallback to handle
                }
            }

            console.log('FilterTube: Final channel entry:', { name: channelName, id: channelId, handle: channelHandle, logo: channelLogo });

            // Store with name, id, handle, logo, and filterAll
            const channelEntry = {
                name: channelName,
                id: channelId,
                handle: channelHandle,
                logo: channelLogo,
                filterAll: false // Default to false
            };

            state.channels.push(channelEntry);
            if (channelInput) channelInput.value = '';

            // Re-enable button
            addChannelBtn.disabled = false;
            addChannelBtn.textContent = originalText;

            // Save settings first
            saveSettings();

            // Reload the channelMap from storage to get the latest mappings
            chrome.storage.local.get(['channelMap'], (result) => {
                globalChannelMap = result.channelMap || {};
                console.log('FilterTube: Reloaded channelMap:', globalChannelMap);

                // Now render the list with updated mapping
                renderChannelList();
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

    // Listen for storage changes from popup or other sources
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local') {
            // If channels or channelMap changed, process and re-render
            if (changes.filterChannels) {
                console.log('FilterTube Tab View: Detected channel change from popup/external source');

                // Load the new channels from storage
                const newChannels = normalizeChannels(changes.filterChannels.newValue);

                // Check if any new channels need info fetching
                for (let i = 0; i < newChannels.length; i++) {
                    const channel = newChannels[i];

                    // If channel doesn't have a proper name (name == id) and looks like it needs fetching
                    if (channel.name === channel.id && !channel.logo) {
                        const isUCId = channel.id.toLowerCase().startsWith('uc');
                        const isHandle = channel.id.startsWith('@');

                        if (isUCId) {
                            // Fetch info for UC ID
                            console.log('FilterTube: Fetching info for UC ID from popup add:', channel.id);
                            const channelInfo = await fetchChannelInfo(channel.id);
                            if (channelInfo && channelInfo.name) {
                                newChannels[i].name = channelInfo.name;
                                newChannels[i].handle = channelInfo.handle;
                                newChannels[i].logo = channelInfo.logo;
                            }
                        } else if (isHandle) {
                            // Resolve handle to UC ID and fetch info
                            console.log('FilterTube: Resolving handle from popup add:', channel.id);
                            try {
                                const handleWithoutAt = channel.id.replace('@', '');
                                const aboutUrl = `https://www.youtube.com/@${handleWithoutAt}/about`;
                                const response = await fetch(aboutUrl);
                                const text = await response.text();
                                const match = text.match(/channel\/(UC[\w-]{22})/);

                                if (match && match[1]) {
                                    const resolvedId = match[1];
                                    console.log(`FilterTube: ✅ Resolved ${channel.id} -> ${resolvedId}`);

                                    const channelInfo = await fetchChannelInfo(resolvedId);
                                    if (channelInfo && channelInfo.name) {
                                        newChannels[i].name = channelInfo.name;
                                        newChannels[i].logo = channelInfo.logo;
                                    }

                                    // Update channelMap
                                    chrome.storage.local.get(['channelMap'], (result) => {
                                        const currentMap = result.channelMap || {};
                                        const normHandle = channel.id.toLowerCase();
                                        const normId = resolvedId.toLowerCase();
                                        currentMap[normId] = normHandle;
                                        currentMap[normHandle] = normId;
                                        chrome.storage.local.set({ channelMap: currentMap });
                                    });
                                }
                            } catch (err) {
                                console.warn('FilterTube: Could not resolve handle:', err);
                            }
                        }
                    }
                }

                // Update state and save back to storage with enriched data
                state.channels = newChannels;
                chrome.storage.local.set({ filterChannels: newChannels });

                // Reload channelMap and re-render
                chrome.storage.local.get(['channelMap'], (result) => {
                    globalChannelMap = result.channelMap || {};
                    renderChannelList();
                });
            } else if (changes.channelMap) {
                // Just reload the map and re-render
                console.log('FilterTube Tab View: Detected channelMap change');
                globalChannelMap = changes.channelMap.newValue || {};
                renderChannelList();
            }
        }
    });
});
