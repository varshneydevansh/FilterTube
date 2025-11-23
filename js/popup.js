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
    initializePopupFiltersTabs();

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

    const SettingsAPI = window.FilterTubeSettings || {};
    const {
        loadSettings: sharedLoadSettings,
        saveSettings: sharedSaveSettings,
        syncFilterAllKeywords: sharedSyncFilterAllKeywords,
        extractUserKeywords: sharedExtractUserKeywords,
        applyThemePreference: sharedApplyThemePreference,
        getThemePreference: sharedGetThemePreference,
        setThemePreference: sharedSetThemePreference,
        getChannelDerivedKey: sharedGetChannelDerivedKey,
        getChannelKeywordWord: sharedGetChannelKeywordWord,
        isSettingsChange: sharedIsSettingsChange,
        isThemeChange: sharedIsThemeChange,
        getThemeFromChange: sharedGetThemeFromChange
    } = SettingsAPI;

    const state = {
        userKeywords: [],
        keywords: [],
        channels: [],
        hideShorts: false,
        hideComments: false,
        filterComments: false,
        channelMap: {},
        theme: 'light'
    };

    let settingsReady = false;
    let loadPromise = null;
    let isSaving = false;

    const fallbackGetChannelDerivedKey = sharedGetChannelDerivedKey || function (channel) {
        return (channel?.id || channel?.handle || channel?.originalInput || channel?.name || '').toLowerCase();
    };

    const fallbackGetChannelKeywordWord = sharedGetChannelKeywordWord || function (channel) {
        if (!channel) return '';
        if (channel.name && channel.name !== channel.id) return channel.name;
        if (channel.handle) return channel.handle;
        return channel.id || channel.originalInput || '';
    };

    function sanitizeUserKeywords(keywords) {
        if (sharedExtractUserKeywords) {
            return sharedExtractUserKeywords(keywords);
        }

        return (keywords || [])
            .map(entry => {
                if (!entry || !entry.word) return null;
                return {
                    word: entry.word,
                    exact: !!entry.exact,
                    semantic: !!entry.semantic,
                    source: 'user',
                    channelRef: null
                };
            })
            .filter(Boolean);
    }

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

    function setUserKeywords(nextKeywords) {
        state.userKeywords = sanitizeUserKeywords(nextKeywords);
        recomputeKeywords();
    }

    function applyTheme(nextTheme) {
        const normalized = sharedApplyThemePreference ? sharedApplyThemePreference(nextTheme) : (nextTheme === 'dark' ? 'dark' : 'light');
        state.theme = normalized;
    }

    function renderKeywords() {
        if (!keywordList) return;

        keywordList.innerHTML = '';

        // Render ALL keywords (user + channel-derived)
        if (state.keywords.length === 0) {
            keywordList.innerHTML = '<div class="empty-state">No keywords added</div>';
            return;
        }

        state.keywords.forEach((entry) => {
            const isChannelDerived = entry.source === 'channel';

            const item = document.createElement('div');
            item.className = 'keyword-item';
            if (isChannelDerived) item.classList.add('channel-derived');

            const text = document.createElement('span');
            text.className = 'keyword-text';
            text.textContent = entry.word;

            const controls = document.createElement('div');
            controls.className = 'keyword-controls';

            if (isChannelDerived) {
                // Channel-derived keywords: show badge only, no controls
                const badge = document.createElement('span');
                badge.className = 'channel-derived-badge';
                badge.textContent = 'From Channel';
                badge.title = `Auto-added by "Filter All Content" - managed in Full Settings`;
                badge.style.fontSize = '9px';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '999px';
                badge.style.background = 'rgba(34, 197, 94, 0.2)';
                badge.style.color = '#166534';
                badge.style.fontWeight = '700';
                badge.style.textTransform = 'uppercase';
                controls.appendChild(badge);
            } else {
                // User keywords: show exact toggle and delete button
                const userIndex = state.userKeywords.findIndex(k => k.word === entry.word && k.source !== 'channel');

                const exactToggle = document.createElement('div');
                exactToggle.className = `exact-toggle ${entry.exact ? 'active' : ''}`;
                exactToggle.textContent = 'Exact';
                exactToggle.title = entry.exact
                    ? `Exact match: Only filters "${entry.word}" as a complete word`
                    : `Partial match: Filters "${entry.word}" anywhere in text`;
                exactToggle.addEventListener('click', async () => {
                    if (userIndex === -1) return;
                    await ensureSettingsLoaded();
                    state.userKeywords[userIndex].exact = !state.userKeywords[userIndex].exact;
                    recomputeKeywords();
                    renderKeywords();
                    await saveSettings();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                deleteBtn.addEventListener('click', async () => {
                    if (userIndex === -1) return;
                    await ensureSettingsLoaded();
                    state.userKeywords.splice(userIndex, 1);
                    recomputeKeywords();
                    renderKeywords();
                    await saveSettings();
                });

                controls.appendChild(exactToggle);
                controls.appendChild(deleteBtn);
            }

            item.appendChild(text);
            item.appendChild(controls);
            keywordList.appendChild(item);
        });
    }

    function renderChannels() {
        if (!channelListEl) return;

        channelListEl.innerHTML = '';

        if (state.channels.length === 0) {
            channelListEl.innerHTML = '<div class="empty-state">No channels blocked</div>';
            return;
        }

        state.channels.forEach((channel, index) => {
            const item = document.createElement('div');
            item.className = 'keyword-item';

            const text = document.createElement('span');
            text.className = 'keyword-text';
            const displayName = (channel.name && channel.name !== channel.id) ? channel.name : (channel.handle || channel.id);
            text.textContent = displayName;

            const controls = document.createElement('div');
            controls.className = 'keyword-controls';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.title = 'Remove channel';
            deleteBtn.addEventListener('click', async () => {
                await ensureSettingsLoaded();
                state.channels.splice(index, 1);
                recomputeKeywords();
                renderChannels();
                await saveSettings();
            });

            controls.appendChild(deleteBtn);

            item.appendChild(text);
            item.appendChild(controls);
            channelListEl.appendChild(item);
        });
    }

    function syncToggleStateFromInputs() {
        const hideShorts = hideAllShortsCheckbox ? hideAllShortsCheckbox.checked : false;
        const hideComments = hideAllCommentsCheckbox ? hideAllCommentsCheckbox.checked : false;
        let filterComments = filterCommentsCheckbox ? filterCommentsCheckbox.checked : false;

        if (hideComments) {
            filterComments = false;
            if (filterCommentsCheckbox) {
                filterCommentsCheckbox.checked = false;
                filterCommentsCheckbox.disabled = true;
            }
        } else if (filterCommentsCheckbox) {
            filterCommentsCheckbox.disabled = false;
        }

        state.hideShorts = hideShorts;
        state.hideComments = hideComments;
        state.filterComments = filterComments;
    }

    function applyLoadedSettings(data) {
        if (!data) return;

        console.log('FilterTube Popup: Applying loaded settings', {
            channels: data.channels?.length,
            userKeywords: data.userKeywords?.length,
            keywords: data.keywords?.length
        });

        state.channels = Array.isArray(data.channels) ? data.channels.map(channel => ({ ...channel })) : [];
        state.channelMap = data.channelMap ? { ...data.channelMap } : {};
        setUserKeywords(data.userKeywords || []);

        // Explicitly set keywords from loaded data to ensure channel-derived keywords are included
        if (Array.isArray(data.keywords)) {
            state.keywords = data.keywords.map(k => ({ ...k }));
            console.log('FilterTube Popup: Set keywords from loaded data', state.keywords);
        }

        state.hideShorts = !!data.hideShorts;
        state.hideComments = !!data.hideComments;
        state.filterComments = !!data.filterComments;
        state.theme = data.theme || state.theme;

        if (hideAllShortsCheckbox) hideAllShortsCheckbox.checked = state.hideShorts;
        if (hideAllCommentsCheckbox) hideAllCommentsCheckbox.checked = state.hideComments;
        if (filterCommentsCheckbox) {
            filterCommentsCheckbox.checked = state.hideComments ? false : state.filterComments;
            filterCommentsCheckbox.disabled = state.hideComments;
        }

        applyTheme(state.theme);
        renderKeywords();
        renderChannels();
    }

    async function loadSettings() {
        if (!sharedLoadSettings) {
            settingsReady = true;
            renderKeywords();
            renderChannels();
            return;
        }

        try {
            const data = await sharedLoadSettings();
            applyLoadedSettings(data);
            settingsReady = true;
        } catch (error) {
            console.error('FilterTube Popup: Failed to load settings', error);
        } finally {
            loadPromise = null;
        }
    }

    async function ensureSettingsLoaded() {
        if (settingsReady) return;
        if (!loadPromise) {
            loadPromise = loadSettings();
        }
        await loadPromise;
    }

    async function refreshSettingsFromStorage() {
        if (!sharedLoadSettings) return;
        try {
            const data = await sharedLoadSettings();
            applyLoadedSettings(data);
        } catch (error) {
            console.warn('FilterTube Popup: Failed to refresh settings', error);
        }
    }

    async function saveSettings({ broadcast = true } = {}) {
        if (!sharedSaveSettings) return;
        await ensureSettingsLoaded();
        if (isSaving) return;

        syncToggleStateFromInputs();
        recomputeKeywords();

        isSaving = true;
        const { compiledSettings, error } = await sharedSaveSettings({
            keywords: state.keywords,
            channels: state.channels,
            hideShorts: state.hideShorts,
            hideComments: state.hideComments,
            filterComments: state.filterComments
        });

        if (error) {
            console.error('FilterTube Popup: Failed to save settings', error);
        } else if (broadcast && compiledSettings) {
            broadcastSettings(compiledSettings);
        }

        isSaving = false;

        if (!error) {
            await refreshSettingsFromStorage();
        }

        return { compiledSettings, error };
    }

    function isDuplicateChannel(input) {
        if (!input) return false;
        const normalized = input.toLowerCase();

        if (state.channelMap && state.channelMap[normalized]) {
            return true;
        }

        return state.channels.some(channel => {
            const id = (channel.id || '').toLowerCase();
            const handle = (channel.handle || '').toLowerCase();
            if (id === normalized || handle === normalized) return true;

            const mapped = (state.channelMap && (state.channelMap[id] || state.channelMap[handle]));
            if (mapped && mapped.toLowerCase() === normalized) return true;

            const reverseMapped = state.channelMap ? state.channelMap[normalized] : null;
            if (reverseMapped && (reverseMapped.toLowerCase() === id || reverseMapped.toLowerCase() === handle)) return true;

            return false;
        });
    }

    async function persistChannelMap(channelId, channelHandle) {
        if (!channelId || !channelHandle) return;
        const nextMap = { ...(state.channelMap || {}) };
        nextMap[channelId.toLowerCase()] = channelHandle;
        nextMap[channelHandle.toLowerCase()] = channelId;
        state.channelMap = nextMap;

        await new Promise(resolve => {
            chrome.storage?.local.set({ channelMap: nextMap }, resolve);
        });
    }

    async function addKeyword() {
        await ensureSettingsLoaded();
        const word = (newKeywordInput?.value || '').trim();
        if (!word) return;

        const lowerWord = word.toLowerCase();
        if (state.userKeywords.some(entry => entry.word.toLowerCase() === lowerWord)) {
            return;
        }

        state.userKeywords.push({ word, exact: false, semantic: false, source: 'user', channelRef: null });
        if (newKeywordInput) newKeywordInput.value = '';

        recomputeKeywords();
        renderKeywords();
        await saveSettings();

        if (addKeywordBtn && typeof UIComponents?.flashButtonSuccess === 'function') {
            UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
        }
    }

    async function addChannel() {
        await ensureSettingsLoaded();
        const rawValue = (channelInput?.value || '').trim();
        if (!rawValue) return;

        if (!rawValue.startsWith('@') && !rawValue.toLowerCase().startsWith('uc') && !rawValue.toLowerCase().startsWith('channel/uc')) {
            alert('Please enter a valid channel identifier:\n- @handle (e.g., @shakira)\n- UC ID (e.g., UCYLNGLIzMhRTi6ZOLjAPSmw)\n- channel/UC ID');
            return;
        }

        const normalizedInput = rawValue.replace(/^channel\//i, '');
        if (isDuplicateChannel(normalizedInput)) {
            alert('This channel is already in your filter list!');
            return;
        }

        if (!addChannelBtn) return;

        const originalText = addChannelBtn.textContent;
        addChannelBtn.textContent = 'Fetching...';
        addChannelBtn.disabled = true;

        let channelEntry = {
            name: normalizedInput,
            id: normalizedInput,
            handle: null,
            logo: null,
            filterAll: false,
            originalInput: rawValue
        };

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchChannelDetails',
                channelIdOrHandle: normalizedInput
            });

            if (response?.success && response.id) {
                channelEntry = {
                    ...channelEntry,
                    name: response.name || channelEntry.name,
                    id: response.id,
                    handle: response.handle || channelEntry.handle,
                    logo: response.logo || channelEntry.logo
                };

                if (response.handle && response.id) {
                    await persistChannelMap(response.id, response.handle);
                }
            } else if (response?.error) {
                console.warn('FilterTube Popup: fetchChannelDetails returned error', response.error);
            }
        } catch (error) {
            console.warn('FilterTube Popup: Error fetching channel details', error);
        } finally {
            addChannelBtn.disabled = false;
            addChannelBtn.textContent = originalText;
        }

        state.channels.unshift(channelEntry); // Add to beginning for newest-first order
        if (channelInput) channelInput.value = '';

        renderChannels();
        recomputeKeywords();
        await saveSettings();

        if (addChannelBtn && typeof UIComponents?.flashButtonSuccess === 'function') {
            UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
        }
    }

    if (addKeywordBtn) addKeywordBtn.addEventListener('click', addKeyword);

    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') addKeyword();
        });
    }

    if (addChannelBtn) addChannelBtn.addEventListener('click', addChannel);

    if (channelInput) {
        channelInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') addChannel();
        });
    }

    if (clearKeywordsBtn) {
        clearKeywordsBtn.addEventListener('click', async () => {
            await ensureSettingsLoaded();
            if (!state.userKeywords.length) return;
            if (!confirm('Clear all keywords?')) return;
            setUserKeywords([]);
            renderKeywords();
            await saveSettings();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const { error } = await saveSettings({ broadcast: true });
            if (error) return;

            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.classList.add('saved');
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('saved');
            }, 1500);
        });
    }

    if (openInTabBtn) {
        openInTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'html/tab-view.html' });
        });
    }

    if (hideAllShortsCheckbox) {
        hideAllShortsCheckbox.addEventListener('change', () => {
            state.hideShorts = hideAllShortsCheckbox.checked;
        });
    }

    if (hideAllCommentsCheckbox && filterCommentsCheckbox) {
        hideAllCommentsCheckbox.addEventListener('change', () => {
            syncToggleStateFromInputs();
        });

        filterCommentsCheckbox.addEventListener('change', () => {
            state.filterComments = filterCommentsCheckbox.checked;
        });
    }

    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local' || isSaving) return;

        const hasSettingsChange = sharedIsSettingsChange ? sharedIsSettingsChange(changes) : Object.keys(changes).some(key =>
            ['uiKeywords', 'filterKeywords', 'filterChannels', 'hideAllShorts', 'hideAllComments', 'filterComments', 'stats', 'channelMap'].includes(key)
        );
        const hasThemeChange = sharedIsThemeChange ? sharedIsThemeChange(changes) : Object.prototype.hasOwnProperty.call(changes, SettingsAPI.THEME_KEY || 'ftThemePreference');

        if (hasThemeChange) {
            const newTheme = sharedGetThemeFromChange ? sharedGetThemeFromChange(changes) : (changes?.ftThemePreference?.newValue || 'light');
            applyTheme(newTheme);
        }

        if (hasSettingsChange && sharedLoadSettings) {
            console.log('FilterTube Popup: Storage change detected, reloading settings', Object.keys(changes));
            const data = await sharedLoadSettings();
            applyLoadedSettings(data);
        }
    });

    loadSettings();
});
