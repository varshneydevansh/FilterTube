/**
 * Popup script for FilterTube extension
 *
 * This script handles the settings popup UI for FilterTube
 */

/**
 * Initialize the tabbed interface for popup Filters section
 */
function initializePopupFiltersTabs() {
    const container = document.getElementById('popupFiltersTabsContainer');
    if (!container) return;

    // Create Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-group">
            <div class="add-keyword-row">
                <input type="text" id="newKeywordInput" class="text-input" placeholder="Add keyword..." />
                <button id="addKeywordBtn" class="btn btn-small btn-secondary">Add</button>
            </div>

            <div id="keywordList" class="keyword-list">
                <!-- Keywords will be injected here -->
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
                <button id="addChannelBtn" class="btn btn-small btn-secondary">Add</button>
            </div>

            <div id="channelList" class="keyword-list">
                <!-- Channels will be injected here -->
                <div class="empty-state">No channels blocked</div>
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
            console.log('Popup: Switched to tab:', tabId);
        }
    });

    container.appendChild(tabs.container);
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize tabs first
    initializePopupFiltersTabs();
    // UI Elements
    const newKeywordInput = document.getElementById('newKeywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordList = document.getElementById('keywordList');
    const clearKeywordsBtn = document.getElementById('clearKeywordsBtn');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelList');
    const hideAllShortsCheckbox = document.getElementById('hideAllShorts');
    const hideAllCommentsCheckbox = document.getElementById('hideAllComments');
    const filterCommentsCheckbox = document.getElementById('filterComments');
    const saveBtn = document.getElementById('saveBtn');
    const openInTabBtn = document.getElementById('openInTabBtn');

    // State
    let keywords = []; // Array of { word: string, exact: boolean }
    let channels = []; // Array of { name: string, id: string }

    function compileKeywords(list) {
        return list.map(k => {
            const escaped = k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                pattern: k.exact ? `\\b${escaped}\\b` : escaped,
                flags: 'i'
            };
        });
    }

    function buildCompiledSettings({ hideAllShorts, hideAllComments, filterComments }) {
        return {
            filterKeywords: compileKeywords(keywords),
            filterChannels: channels, // Send full channel objects to content script
            hideAllShorts,
            hideAllComments,
            filterComments
        };
    }

    function broadcastSettings(settings) {
        chrome.runtime.sendMessage({ action: 'FilterTube_ApplySettings', settings }, () => {
            const err = chrome.runtime.lastError;
            if (err && !/Receiving end does not exist/i.test(err.message)) {
                console.warn('FilterTube Popup: broadcast failed', err.message);
            }
        });
    }

    // Load saved settings
    chrome.storage.local.get([
        'filterKeywords',
        'uiKeywords',
        'filterChannels',
        'hideAllShorts',
        'hideAllComments',
        'filterComments',
        'ftThemePreference' // Added theme pref
    ], function (result) {
        function applyTheme(nextTheme) {
            // Assuming 'state' and 'themeToggle' are defined elsewhere or will be added.
            // For now, we'll just apply the theme to documentElement.
            // state.theme = nextTheme; // This line would cause an error if 'state' is not defined.
            document.documentElement.setAttribute('data-theme', nextTheme);
            // if (themeToggle) { // This line would cause an error if 'themeToggle' is not defined.
            // Update icon based on theme
            // themeToggle.innerHTML = nextTheme === 'dark' 
            //     ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
            //     : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            // }
        }
        // Apply Theme
        if (result.ftThemePreference) {
            applyTheme(result.ftThemePreference);
        }

        // Load Keywords
        if (result.uiKeywords && Array.isArray(result.uiKeywords)) {
            // Use the source of truth for UI
            keywords = result.uiKeywords;
        } else if (typeof result.filterKeywords === 'string') {
            // Migration from legacy string
            const legacyKeywords = result.filterKeywords.split(',').map(k => k.trim()).filter(k => k);
            keywords = legacyKeywords.map(k => ({ word: k, exact: false }));
        } else if (Array.isArray(result.filterKeywords)) {
            // Fallback if uiKeywords missing but filterKeywords exists as array (rare)
            // We can't easily reverse regex to exact/not-exact perfectly without metadata,
            // but we can try.
            keywords = result.filterKeywords.map(entry => {
                if (entry && entry.pattern) {
                    const isExact = entry.pattern.startsWith('\\b') && entry.pattern.endsWith('\\b');
                    const word = entry.pattern.replace(/\\b/g, '').replace(/\\/g, ''); // Rough cleanup
                    return { word: word, exact: isExact };
                }
                return null;
            }).filter(entry => entry !== null);
        }

        renderKeywords();

        // Load Channels
        if (result.filterChannels && Array.isArray(result.filterChannels)) {
            channels = result.filterChannels.map(ch => {
                if (typeof ch === 'string') {
                    return { name: ch, id: ch };
                }
                return ch;
            });
        }

        renderChannels();

        if (hideAllShortsCheckbox) hideAllShortsCheckbox.checked = result.hideAllShorts || false;
        if (hideAllCommentsCheckbox) {
            hideAllCommentsCheckbox.checked = result.hideAllComments || false;
            // Initialize filter comments state based on hide all comments
            if (filterCommentsCheckbox) {
                if (result.hideAllComments) {
                    filterCommentsCheckbox.checked = false;
                    filterCommentsCheckbox.disabled = true;
                } else {
                    filterCommentsCheckbox.checked = result.filterComments || false;
                    filterCommentsCheckbox.disabled = false;
                }
            }
        } else if (filterCommentsCheckbox) {
            filterCommentsCheckbox.checked = result.filterComments || false;
        }
    });

    // Render Keyword List
    function renderKeywords() {
        if (!keywordList) return;

        keywordList.innerHTML = '';

        if (keywords.length === 0) {
            keywordList.innerHTML = '<div class="empty-state">No keywords added</div>';
            return;
        }

        keywords.forEach((k, index) => {
            const item = document.createElement('div');
            item.className = 'keyword-item';

            const text = document.createElement('span');
            text.className = 'keyword-text';
            text.textContent = k.word;

            const controls = document.createElement('div');
            controls.className = 'keyword-controls';

            const exactToggle = document.createElement('div');
            exactToggle.className = `exact-toggle ${k.exact ? 'active' : ''}`;
            exactToggle.textContent = 'Exact';
            exactToggle.title = 'Toggle Exact Match';
            exactToggle.onclick = () => toggleExact(index);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.onclick = () => deleteKeyword(index);

            controls.appendChild(exactToggle);
            controls.appendChild(deleteBtn);

            item.appendChild(text);
            item.appendChild(controls);
            keywordList.appendChild(item);
        });
    }

    // Render Channel List
    function renderChannels() {
        if (!channelListEl) return;

        channelListEl.innerHTML = '';

        if (channels.length === 0) {
            channelListEl.innerHTML = '<div class="empty-state">No channels blocked</div>';
            return;
        }

        channels.forEach((ch, index) => {
            const item = document.createElement('div');
            item.className = 'keyword-item'; // Reuse same styling

            const text = document.createElement('span');
            text.className = 'keyword-text';
            text.textContent = ch.name || ch.id;

            const controls = document.createElement('div');
            controls.className = 'keyword-controls';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.onclick = () => deleteChannel(index);

            controls.appendChild(deleteBtn);

            item.appendChild(text);
            item.appendChild(controls);
            channelListEl.appendChild(item);
        });
    }

    // Actions
    function addKeyword() {
        const word = newKeywordInput.value.trim();
        if (word) {
            // Check for duplicates
            if (!keywords.some(k => k.word.toLowerCase() === word.toLowerCase())) {
                keywords.push({ word: word, exact: false });
                newKeywordInput.value = '';
                renderKeywords();

                // Flash success feedback (same as Save button)
                if (addKeywordBtn) {
                    const originalText = addKeywordBtn.textContent;
                    addKeywordBtn.textContent = 'Added!';
                    addKeywordBtn.classList.add('saved');

                    setTimeout(() => {
                        addKeywordBtn.textContent = originalText;
                        addKeywordBtn.classList.remove('saved');
                    }, 1200);
                }
            }
        }
    }

    function deleteKeyword(index) {
        keywords.splice(index, 1);
        renderKeywords();
    }

    function toggleExact(index) {
        keywords[index].exact = !keywords[index].exact;
        renderKeywords();
    }

    async function addChannel() {
        const val = channelInput.value.trim();
        if (!val) return;

        // Validate input format (similar to tab-view.js)
        if (!val.startsWith('@') && !val.toLowerCase().startsWith('uc') && !val.toLowerCase().startsWith('channel/uc')) {
            alert('Please enter a valid channel identifier:\n- @handle (e.g., @shakira)\n- UC ID (e.g., UCYLNGLIzMhRTi6ZOLjAPSmw)\n- channel/UC ID');
            return;
        }

        // Remove channel/ prefix but preserve case for UC IDs
        const channelIdOrHandle = val.replace(/^channel\//i, '');

        // Check for duplicates - (This part will need to be refined once globalChannelMap is available, for now basic check)
        // For simplicity in popup, we'll only check against currently stored IDs and names directly.
        if (channels.some(ch => ch.id === channelIdOrHandle || ch.handle === channelIdOrHandle || ch.name === channelIdOrHandle)) {
            alert('This channel is already in your filter list!');
            return;
        }

        // Show loading state
        const originalText = addChannelBtn.textContent;
        addChannelBtn.textContent = 'Fetching...';
        addChannelBtn.disabled = true;

        try {
            const response = await chrome.runtime.sendMessage({
                action: "fetchChannelDetails",
                channelIdOrHandle: channelIdOrHandle
            });

            if (response.success && response.id) {
                const channelEntry = {
                    name: response.name,
                    id: response.id,
                    handle: response.handle,
                    logo: response.logo,
                    filterAll: false // Default to false
                };
                channels.push(channelEntry);
                channelInput.value = '';
                renderChannels();
                // Since this is adding to the in-memory array, we need to explicitly save settings
                // The existing saveBtn click handler includes broadcasting, so we can reuse that logic
                const hideAllShorts = hideAllShortsCheckbox ? hideAllShortsCheckbox.checked : false;
                const hideAllComments = hideAllCommentsCheckbox ? hideAllCommentsCheckbox.checked : false;
                const filterComments = filterCommentsCheckbox ? filterCommentsCheckbox.checked : false;

                const computedFilterComments = hideAllComments ? false : filterComments;

                const compiledSettings = buildCompiledSettings({
                    hideAllShorts,
                    hideAllComments,
                    filterComments: computedFilterComments
                });

                chrome.storage.local.set({
                    uiKeywords: keywords, // Save source state
                    filterKeywords: compiledSettings.filterKeywords, // Save compiled state
                    filterChannels: compiledSettings.filterChannels,
                    hideAllShorts: hideAllShorts,
                    hideAllComments: hideAllComments,
                    filterComments: computedFilterComments
                }, () => {
                    broadcastSettings(compiledSettings);
                });


                // Flash success feedback
                if (addChannelBtn) {
                    addChannelBtn.textContent = 'Added!';
                    addChannelBtn.classList.add('saved');
                    setTimeout(() => {
                        addChannelBtn.textContent = originalText;
                        addChannelBtn.classList.remove('saved');
                    }, 1200);
                }
            } else {
                alert(`Failed to fetch channel details: ${response.error || 'Unknown error'}`);
                console.error('FilterTube Popup: Failed to fetch channel details', response);
            }
        } catch (error) {
            alert('Error communicating with background script. Please try again.');
            console.error('FilterTube Popup: Error fetching channel details via background script:', error);
        } finally {
            addChannelBtn.disabled = false;
            addChannelBtn.textContent = originalText;
        }
    }

    function deleteChannel(index) {
        channels.splice(index, 1);
        renderChannels();
    }

    // Event Listeners
    if (addKeywordBtn) addKeywordBtn.addEventListener('click', addKeyword);

    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addKeyword();
        });
    }

    if (addChannelBtn) addChannelBtn.addEventListener('click', addChannel);

    if (channelInput) {
        channelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addChannel();
        });
    }

    if (clearKeywordsBtn) {
        clearKeywordsBtn.addEventListener('click', () => {
            if (confirm('Clear all keywords?')) {
                keywords = [];
                renderKeywords();
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            const hideAllShorts = hideAllShortsCheckbox ? hideAllShortsCheckbox.checked : false;
            const hideAllComments = hideAllCommentsCheckbox ? hideAllCommentsCheckbox.checked : false;
            const filterComments = filterCommentsCheckbox ? filterCommentsCheckbox.checked : false;

            // Hide-all overrides filter-only
            const computedFilterComments = hideAllComments ? false : filterComments;

            const compiledSettings = buildCompiledSettings({
                hideAllShorts,
                hideAllComments,
                filterComments: computedFilterComments
            });

            chrome.storage.local.set({
                uiKeywords: keywords, // Save source state
                filterKeywords: compiledSettings.filterKeywords, // Save compiled state
                filterChannels: compiledSettings.filterChannels,
                hideAllShorts: hideAllShorts,
                hideAllComments: hideAllComments,
                filterComments: computedFilterComments
            }, function () {
                // Visual feedback
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                saveBtn.classList.add('saved');

                broadcastSettings(compiledSettings);

                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.classList.remove('saved');
                }, 1500);
            });
        });
    }

    if (openInTabBtn) {
        openInTabBtn.addEventListener('click', function () {
            chrome.tabs.create({ url: 'html/tab-view.html' });
        });
    }

    // Instant toggle interactions
    if (hideAllCommentsCheckbox && filterCommentsCheckbox) {
        hideAllCommentsCheckbox.addEventListener('change', function () {
            if (hideAllCommentsCheckbox.checked) {
                // When "Hide All Comments" is ON, turn off and disable "Filter Comments"
                filterCommentsCheckbox.checked = false;
                filterCommentsCheckbox.disabled = true;
            } else {
                // When "Hide All Comments" is OFF, enable "Filter Comments"
                filterCommentsCheckbox.disabled = false;
            }
        });
    }
});
