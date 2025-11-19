/**
 * Popup script for FilterTube extension
 * 
 * This script handles the settings popup UI for FilterTube
 */

document.addEventListener('DOMContentLoaded', function () {
    // UI Elements
    const newKeywordInput = document.getElementById('newKeywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordList = document.getElementById('keywordList');
    const clearKeywordsBtn = document.getElementById('clearKeywordsBtn');

    const channelsInput = document.getElementById('channels');
    const hideAllShortsCheckbox = document.getElementById('hideAllShorts');
    const hideAllCommentsCheckbox = document.getElementById('hideAllComments');
    const filterCommentsCheckbox = document.getElementById('filterComments');
    const saveBtn = document.getElementById('saveBtn');
    const openInTabBtn = document.getElementById('openInTabBtn');

    // State
    let keywords = []; // Array of { word: string, exact: boolean }
    let uiChannels = [];

    function normalizeChannelsInput(value) {
        if (!value) return [];
        return value
            .split(/[\n,]/)
            .map(entry => entry.trim())
            .filter(Boolean);
    }

    function compileKeywords(list) {
        return list.map(k => {
            const escaped = k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                pattern: k.exact ? `\\b${escaped}\\b` : escaped,
                flags: 'i'
            };
        });
    }

    function buildCompiledSettings({ hideAllShorts, hideAllComments, filterComments, channels }) {
        const channelList = channels.map(ch => ch.toLowerCase());
        return {
            filterKeywords: compileKeywords(keywords),
            filterChannels: channelList,
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
        'filterComments'
    ], function (result) {
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
            keywords = result.filterKeywords.map(k => {
                if (k.pattern) {
                    const isExact = k.pattern.startsWith('\\b') && k.pattern.endsWith('\\b');
                    const word = k.pattern.replace(/\\b/g, '').replace(/\\/g, ''); // Rough cleanup
                    return { word: word, exact: isExact };
                }
                return null;
            }).filter(k => k);
        }

        renderKeywords();

        if (result.uiChannels && Array.isArray(result.uiChannels)) {
            uiChannels = result.uiChannels.map(ch => ch.trim()).filter(Boolean);
        } else if (result.filterChannels) {
            const normalized = Array.isArray(result.filterChannels)
                ? result.filterChannels
                : normalizeChannelsInput(result.filterChannels)
                    .map(ch => ch.toLowerCase());
            uiChannels = normalized;
        }

        if (channelsInput) {
            channelsInput.value = uiChannels.join('\n');
        }

        if (hideAllShortsCheckbox) hideAllShortsCheckbox.checked = result.hideAllShorts || false;
        if (hideAllCommentsCheckbox) hideAllCommentsCheckbox.checked = result.hideAllComments || false;
        if (filterCommentsCheckbox) filterCommentsCheckbox.checked = result.filterComments || false;
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

    // Actions
    function addKeyword() {
        const word = newKeywordInput.value.trim();
        if (word) {
            // Check for duplicates
            if (!keywords.some(k => k.word.toLowerCase() === word.toLowerCase())) {
                keywords.push({ word: word, exact: false });
                newKeywordInput.value = '';
                renderKeywords();
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

    // Event Listeners
    if (addKeywordBtn) addKeywordBtn.addEventListener('click', addKeyword);

    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addKeyword();
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
            uiChannels = normalizeChannelsInput(channelsInput ? channelsInput.value : '');
            const hideAllShorts = hideAllShortsCheckbox ? hideAllShortsCheckbox.checked : false;
            const hideAllComments = hideAllCommentsCheckbox ? hideAllCommentsCheckbox.checked : false;
            const filterComments = filterCommentsCheckbox ? filterCommentsCheckbox.checked : false;

            // Hide-all overrides filter-only
            const computedFilterComments = hideAllComments ? false : filterComments;

            const compiledSettings = buildCompiledSettings({
                hideAllShorts,
                hideAllComments,
                filterComments: computedFilterComments,
                channels: uiChannels
            });

            chrome.storage.local.set({
                uiKeywords: keywords, // Save source state
                filterKeywords: compiledSettings.filterKeywords, // Save compiled state
                uiChannels,
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
});
