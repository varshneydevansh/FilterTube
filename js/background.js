// background.js

/**
 * Background script for FilterTube extension
 *
 * This script runs in the background as a service worker in Chrome,
 * and as a background script in Firefox MV3.
 *
 * Currently minimal functionality is needed here, but it could be extended to:
 * - Handle messages from content script
 * - Manage extension state across browser tabs
 * - Implement storage change listeners
 * - Implement optional features in the future
 */

// Browser detection for compatibility
const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI = IS_FIREFOX ? browser : chrome;

// Log when the background script loads with browser info
console.log(`FilterTube background script loaded in ${IS_FIREFOX ? 'Firefox' : 'Chrome/Edge/Other'}`);

// Function to compile settings from storage
async function getCompiledSettings() {
    return new Promise((resolve) => {
        browserAPI.storage.local.get([
            'filterKeywords',
            'uiKeywords',
            'filterChannels',
            'channelMap',
            'hideAllComments',
            'filterComments',
            'useExactWordMatching',
            'hideAllShorts'
        ], (items) => {
            const compiledSettings = {};
            const storageUpdates = {};

            const storedCompiled = items.filterKeywords;
            const storedUiKeywords = Array.isArray(items.uiKeywords) ? items.uiKeywords : null;
            const storedUiChannels = Array.isArray(items.uiChannels) ? items.uiChannels : null;
            const useExact = items.useExactWordMatching || false;

            // Helper to validate compiled keyword entries
            const sanitizeCompiledList = (list = []) => list.filter(entry => {
                return entry && typeof entry.pattern === 'string' && typeof entry.flags === 'string';
            });

            if (Array.isArray(storedCompiled)) {
                compiledSettings.filterKeywords = sanitizeCompiledList(storedCompiled);

                // If we don't yet have uiKeywords, attempt to reconstruct them from the compiled list
                if (!storedUiKeywords && compiledSettings.filterKeywords.length) {
                    storageUpdates.uiKeywords = compiledSettings.filterKeywords.map(keyword => {
                        const isExact = keyword.pattern.startsWith('\\b') && keyword.pattern.endsWith('\\b');
                        const raw = keyword.pattern
                            .replace(/^\\b/, '')
                            .replace(/\\b$/, '')
                            .replace(/\\(.)/g, '$1');
                        return { word: raw, exact: isExact };
                    });
                }
            } else if (typeof storedCompiled === 'string') {
                // Legacy string storage fallback
                const keywordsString = storedCompiled;
                const parsedKeywords = keywordsString
                    .split(',')
                    .map(k => k.trim())
                    .filter(Boolean);

                compiledSettings.filterKeywords = parsedKeywords.map(keyword => {
                    try {
                        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        return {
                            pattern: useExact ? `\\b${escaped}\\b` : escaped,
                            flags: 'i'
                        };
                    } catch (error) {
                        console.error(`FilterTube: Invalid regex from legacy keyword: ${keyword}`, error);
                        return null;
                    }
                }).filter(Boolean);

                storageUpdates.filterKeywords = compiledSettings.filterKeywords;
                storageUpdates.uiKeywords = parsedKeywords.map(keyword => ({ word: keyword, exact: useExact }));
            } else {
                compiledSettings.filterKeywords = [];
            }

            // Persist any migrations we calculated
            if (Object.keys(storageUpdates).length > 0) {
                browserAPI.storage.local.set(storageUpdates);
            }

            // Compile channels - preserve objects with name, id, handle, filterAll
            const storedChannels = items.filterChannels;
            let compiledChannels = [];
            const additionalKeywordsFromChannels = [];

            if (Array.isArray(storedChannels)) {
                compiledChannels = storedChannels.map(ch => {
                    if (typeof ch === 'string') {
                        const trimmed = ch.trim();
                        // Legacy string format - convert to object format
                        return {
                            name: trimmed,
                            id: trimmed, // Preserve case for UC IDs
                            handle: null,
                            logo: null,
                            filterAll: false,
                            originalInput: trimmed
                        };
                    } else if (ch && typeof ch === 'object') {
                        // New object format - preserve the original case for IDs
                        const channelObj = {
                            name: ch.name,
                            id: ch.id || '', // Preserve case for UC IDs
                            handle: ch.handle ? ch.handle.toLowerCase() : null, // Lowercase handles for consistency
                            logo: ch.logo || null,
                            filterAll: !!ch.filterAll,
                            originalInput: ch.originalInput || ch.id || ch.handle || ch.name || null
                        };

                        // If filterAll is enabled, add the channel name to keywords
                        if (channelObj.filterAll && channelObj.name && channelObj.name !== channelObj.id) {
                            const escaped = channelObj.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            additionalKeywordsFromChannels.push({
                                pattern: escaped,
                                flags: 'i'
                            });
                        }

                        return channelObj;
                    }
                    return null;
                }).filter(Boolean);

                if (!storedUiChannels) {
                    storageUpdates.uiChannels = storedChannels
                        .map(ch => typeof ch === 'string' ? ch.trim() : ch)
                        .filter(Boolean);
                }
            } else if (typeof storedChannels === 'string') {
                // Legacy string format
                compiledChannels = storedChannels
                    .split(',')
                    .map(c => c.trim()) // Preserve case for UC IDs
                    .filter(Boolean)
                    .map(c => ({ name: c, id: c, handle: null, filterAll: false }));
                storageUpdates.filterChannels = compiledChannels;
                storageUpdates.uiChannels = compiledChannels.map(ch => ch.name);
            }

            compiledSettings.filterChannels = compiledChannels;

            // Merge channel-based keywords with existing keywords
            if (additionalKeywordsFromChannels.length > 0) {
                compiledSettings.filterKeywords = [
                    ...compiledSettings.filterKeywords,
                    ...additionalKeywordsFromChannels
                ];
            }

            // Pass through the channel map (UC ID <-> @handle mappings)
            compiledSettings.channelMap = items.channelMap || {};

            // Pass through boolean flags
            compiledSettings.hideAllComments = items.hideAllComments || false;
            compiledSettings.filterComments = items.filterComments || false;
            compiledSettings.useExactWordMatching = useExact;
            compiledSettings.hideAllShorts = items.hideAllShorts || false;

            console.log(`FilterTube Background: Compiled ${compiledChannels.length} channels, ${Object.keys(compiledSettings.channelMap).length / 2} mappings`);

            resolve(compiledSettings);
        });
    });
}

// Extension installed or updated handler
browserAPI.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        console.log('FilterTube extension installed');

        // Initialize with some default settings
        browserAPI.storage.local.set({
            filterKeywords: '',
            filterChannels: '',
            useExactWordMatching: false,
            hideAllComments: false,
            filterComments: false,
            hideAllShorts: false
        });
    } else if (details.reason === 'update') {
        console.log('FilterTube extension updated from version ' + details.previousVersion);

        // You could handle migration of settings between versions here if needed
    }
});

// Listen for messages sent from other parts of the extension (e.g., content scripts, popup).
browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getCompiledSettings") {
        console.log("FilterTube Background: Received getCompiledSettings message.");
        getCompiledSettings().then(compiledSettings => {
            // Check for runtime.lastError to catch any errors during storage access within getCompiledSettings
            if (browserAPI.runtime.lastError) {
                console.error("FilterTube Background: Error retrieving settings from storage:", browserAPI.runtime.lastError);
                sendResponse({ error: browserAPI.runtime.lastError.message });
            } else {
                sendResponse(compiledSettings);
            }
        }).catch(error => {
            // Catch any other errors from the promise chain
            console.error("FilterTube Background: Unhandled error in getCompiledSettings promise:", error);
            sendResponse({ error: error.message || "Unknown error occurred while compiling settings." });
        });
        return true; // Indicates that the response is sent asynchronously.
    } else if (request.action === "injectScripts") {
        // Handle script injection via Chrome scripting API
        console.log("FilterTube Background: Received injectScripts request for:", request.scripts);

        if (!browserAPI.scripting?.executeScript) {
            console.error("FilterTube Background: scripting API not available");
            sendResponse({ success: false, error: "Scripting API not available" });
            return false;
        }

        if (!sender.tab?.id) {
            console.error("FilterTube Background: No tab ID available from sender");
            sendResponse({ success: false, error: "No tab ID available" });
            return false;
        }

        // Inject scripts sequentially
        const injectSequentially = async () => {
            try {
                for (const scriptName of request.scripts) {
                    console.log(`FilterTube Background: Injecting ${scriptName}.js into tab ${sender.tab.id}`);

                    await browserAPI.scripting.executeScript({
                        target: { tabId: sender.tab.id },
                        files: [`js/${scriptName}.js`],
                        world: 'MAIN'
                    });

                    console.log(`FilterTube Background: Successfully injected ${scriptName}.js`);
                }

                sendResponse({ success: true });
            } catch (error) {
                console.error("FilterTube Background: Script injection failed:", error);
                sendResponse({ success: false, error: error.message });
            }
        };

        injectSequentially();
        return true; // Indicates that the response is sent asynchronously
    } else if (request.action === "processFetchData") {
        // Handle fetch/XHR data processing from content_bridge
        if (request.url && request.data) {
            console.log(`FilterTube Background: Received data to process from ${request.url}`);
            // You could implement centralized data processing here if needed
            // For now, we'll let content scripts handle filtering
        }
        return false; // No response needed
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        // Forward compiled settings to all relevant tabs for immediate application
        browserAPI.tabs.query({ url: ["*://*.youtube.com/*", "*://*.youtubekids.com/*"] }, tabs => {
            tabs.forEach(tab => {
                browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_ApplySettings', settings: request.settings }, () => {
                    if (browserAPI.runtime.lastError && !/Receiving end does not exist/i.test(browserAPI.runtime.lastError.message)) {
                        console.warn('FilterTube Background: sendMessage error', browserAPI.runtime.lastError.message);
                    }
                });
            });
        });
        sendResponse({ acknowledged: true });
        return false;
    } else if (request.action === "updateChannelMap") {
        // Handle learned ID/Handle mappings from filter_logic
        browserAPI.storage.local.get(['channelMap'], (result) => {
            const currentMap = result.channelMap || {};
            let hasChange = false;

            request.mappings.forEach(m => {
                // Keys are lowercase for case-insensitive lookup
                // Values preserve ORIGINAL case from YouTube
                const keyId = m.id.toLowerCase();
                const keyHandle = m.handle.toLowerCase();

                if (currentMap[keyId] !== m.handle) {
                    currentMap[keyId] = m.handle;    // UC... -> @BTS (original case)
                    currentMap[keyHandle] = m.id;    // @bts -> UCLkAepWjdylmXSltofFvsYQ (original case)
                    hasChange = true;
                }
            });

            if (hasChange) {
                browserAPI.storage.local.set({ channelMap: currentMap });
                console.log("FilterTube Background: Channel map updated in storage");
            }
        });
        return false; // No response needed
    }

    else if (request.action === "fetchChannelDetails") {
        console.log("FilterTube Background: Received fetchChannelDetails request for:", request.channelIdOrHandle);
        fetchChannelInfo(request.channelIdOrHandle).then(channelInfo => {
            sendResponse(channelInfo);
        }).catch(error => {
            console.error("FilterTube Background: Error fetching channel details:", error);
            sendResponse({ success: false, error: error.message || "Failed to fetch channel details." });
        });
        return true; // Indicates that the response is sent asynchronously.
    }

    // Handle any browser-specific actions if needed
    if (request.action === "getBrowserInfo") {
        sendResponse({
            isFirefox: IS_FIREFOX,
            browser: IS_FIREFOX ? "Firefox" : "Chrome/Edge/Other"
        });
        return false; // Synchronous response
    }
});

// Listen for storage changes to re-compile settings
browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        const relevantKeys = ['filterKeywords', 'filterChannels', 'hideAllComments', 'filterComments', 'useExactWordMatching', 'hideAllShorts'];
        let settingsChanged = false;
        for (const key of relevantKeys) {
            if (changes[key]) {
                settingsChanged = true;
                console.log(`FilterTube Background: Setting changed - ${key}:`, changes[key]);
                break;
            }
        }

        if (settingsChanged) {
            console.log('FilterTube Background: Settings changed, re-compiling.');
            getCompiledSettings().then(compiledSettings => {
                console.log('FilterTube Background: New compiled settings ready');
                // The content_bridge.js will request these updated settings on its own
                // via storage.onChanged listener and chrome.runtime.sendMessage
            });
        }
    }
});

// Listen for storage changes to re-compile settings
browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        const relevantKeys = ['filterKeywords', 'filterChannels', 'hideAllComments', 'filterComments', 'useExactWordMatching', 'hideAllShorts'];
        let settingsChanged = false;
        for (const key of relevantKeys) {
            if (changes[key]) {
                settingsChanged = true;
                console.log(`FilterTube Background: Setting changed - ${key}:`, changes[key]);
                break;
            }
        }

        if (settingsChanged) {
            console.log('FilterTube Background: Settings changed, re-compiling.');
            getCompiledSettings().then(compiledSettings => {
                console.log('FilterTube Background: New compiled settings ready');
                // The content_bridge.js will request these updated settings on its own
                // via storage.onChanged listener and chrome.runtime.sendMessage
            });
        }
    }
});

/**
 * Fetch channel name and handle from YouTube by scraping the channel page
 * More reliable than API calls which can be blocked
 */
async function fetchChannelInfo(channelIdOrHandle) {
    try {
        // Determine if it's a handle or a UC ID
        const isHandle = channelIdOrHandle.startsWith('@');
        let cleanId = channelIdOrHandle.replace(/^channel\//i, ''); // cleanId is input without "channel/"
        let channelUrl = '';
        let resolvedChannelId = null; // Initialize early

        // If the input itself is a UC ID, use it directly as the resolved ID and construct canonical URL
        if (cleanId.toUpperCase().startsWith('UC') && cleanId.length === 24) { // UC + 22 chars
            resolvedChannelId = cleanId;
            channelUrl = `https://www.youtube.com/channel/${resolvedChannelId}`;
        } else if (isHandle) {
            // For handles, construct URL for the /about page to resolve to UC ID
            const handleWithoutAt = cleanId.substring(1);
            channelUrl = `https://www.youtube.com/@${handleWithoutAt}/about`;
        } else {
            // If it's not a handle and not a direct UC ID, assume it's a malformed URL or invalid ID initially
            // We'll still try to fetch, but resolvedChannelId will remain null unless found in page data
            channelUrl = `https://www.youtube.com/channel/${cleanId}`; // Best guess for URL
        }

        console.log('FilterTube Background: Fetching channel info for:', cleanId);

        // Fetch the channel page HTML
        const response = await fetch(channelUrl);

        if (!response.ok) {
            console.error('FilterTube Background: Failed to fetch channel page:', response.status, response.statusText);
            return { success: false, error: `Failed to fetch channel page: ${response.status}` };
        }

        const html = await response.text();

        // Extract ytInitialData from the page using a more robust method
        let data = null;

        // Helper function to extract JSON with balanced braces
        function extractJSON(text, startPattern) {
            const startIndex = text.search(startPattern);
            if (startIndex === -1) return null;

            const jsonStart = text.indexOf('{', startIndex);
            if (jsonStart === -1) return null;

            let depth = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = jsonStart; i < text.length; i++) {
                const char = text[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                    }

                if (!inString) {
                    if (char === '{') depth++;
                    else if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            return text.substring(jsonStart, i + 1);
                        }
                    }
                }
            }

            return null;
        }

        // Try different patterns
        const patterns = [
            /var ytInitialData\s*=/,
            /window\["ytInitialData"\]\s*=/,
            /ytInitialData"\s*:/
        ];

        for (const pattern of patterns) {
            const jsonStr = extractJSON(html, pattern);
            if (jsonStr) {
                try {
                    data = JSON.parse(jsonStr);
                    console.log('FilterTube Background: Successfully extracted ytInitialData using pattern:', pattern);
                    break;
                } catch (e) {
                    console.warn('FilterTube Background: Failed to parse JSON for pattern:', pattern, e.message);
                }
            }
        }

        if (!data) {
            console.error('FilterTube Background: Could not extract ytInitialData from page');
            return { success: false, error: 'Could not extract channel data' };
        }

        let channelName = null;
        let channelHandle = null;
        let channelLogo = null;

        // --- BLOCK 1: Metadata Renderer (Standard & Most Reliable) ---
        const metadata = data?.metadata?.channelMetadataRenderer;
        if (metadata) {
            console.log('FilterTube Background: Found metadata:', metadata);

            // Name
            if (metadata.title) {
                channelName = metadata.title;
                console.log('FilterTube Background: Got name from metadata:', channelName);
            }

            // Handle from vanityChannelUrl
            if (metadata.vanityChannelUrl) {
                const match = metadata.vanityChannelUrl.match(/@([^/]+)/);
                if (match) {
                    channelHandle = '@' + match[1];
                    console.log('FilterTube Background: Got handle from metadata:', channelHandle);
                }
            }

            // Resolved Channel ID (from the canonical link)
            if (metadata.canonicalUrl) {
                const match = metadata.canonicalUrl.match(/channel\/(UC[\w-]{22})/);
                if (match) {
                    resolvedChannelId = match[1];
                    console.log('FilterTube Background: Got resolvedChannelId from metadata:', resolvedChannelId);
                }
            }

            // Logo (Avatar)
            if (metadata.avatar?.thumbnails?.length > 0) {
                channelLogo = metadata.avatar.thumbnails[metadata.avatar.thumbnails.length - 1].url;
                console.log('FilterTube Background: Got logo from metadata:', channelLogo);
            }
        } else {
            console.log('FilterTube Background: No metadata block found');
        }

        // --- BLOCK 2: Page Header ViewModel (New YouTube Structure) ---
        if (!channelName || !channelLogo || !resolvedChannelId) {
            const pageHeader = data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

            if (pageHeader) {
                console.log('FilterTube Background: Found pageHeaderViewModel:', pageHeader);

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

                // Resolved Channel ID from ViewModel
                if (!resolvedChannelId) {
                    const canonicalUrl = pageHeader.actions?.channelHeaderMenuViewModel?.primaryNavigationButtons?.[0]?.buttonViewModel?.command?.urlEndpoint?.url;
                    if (canonicalUrl) {
                        const match = canonicalUrl.match(/channel\/(UC[\w-]{22})/);
                        if (match) {
                            resolvedChannelId = match[1];
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
        if (!channelName || !channelLogo || !resolvedChannelId) {
            const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
            if (header) {
                console.log('FilterTube Background: Trying legacy header:', header);

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

                // Resolved Channel ID
                if (!resolvedChannelId && header.channelId) { // c4TabbedHeaderRenderer has channelId directly
                    resolvedChannelId = header.channelId;
                } else if (!resolvedChannelId && header.url) { // pageHeaderRenderer might have it in URL
                    const match = header.url.match(/channel\/(UC[\w-]{22})/);
                    if (match) {
                        resolvedChannelId = match[1];
                    }
                }

                // Logo
                if (!channelLogo && header.avatar?.thumbnails?.length > 0) {
                    channelLogo = header.avatar.thumbnails[header.avatar.thumbnails.length - 1].url;
                }
            }
        }

        // --- BLOCK 4: Microformat (Backup) ---
        if (!channelName || !channelHandle || !resolvedChannelId) {
            const microformat = data?.microformat?.microformatDataRenderer;
            if (microformat) {
                console.log('FilterTube Background: Trying microformat:', microformat);

                if (!channelName) {
                    channelName = microformat.title;
                }

                if (!channelHandle && microformat.vanityChannelUrl) {
                    const match = microformat.vanityChannelUrl.match(/@([^/]+)/);
                    if (match) channelHandle = '@' + match[1];
                }

                if (!resolvedChannelId && microformat.url) {
                    const match = microformat.url.match(/channel\/(UC[\w-]{22})/);
                    if (match) {
                        resolvedChannelId = match[1];
                    }
                }

                if (!channelLogo && microformat.thumbnail?.thumbnails?.length > 0) {
                    channelLogo = microformat.thumbnail.thumbnails[microformat.thumbnail.thumbnails.length - 1].url;
                }
            }
        }

        // --- Try to find UC ID directly in HTML if not found yet (especially for handles) ---
        if (!resolvedChannelId) {
            const match = html.match(/\/channel\/(UC[\w-]{22})/);
            if (match && match[1]) {
                resolvedChannelId = match[1];
                console.log('FilterTube Background: Got resolvedChannelId from direct HTML match:', resolvedChannelId);
            }
        }

        // Fallback to original cleanId if it looks like a UC ID and resolvedChannelId is still missing
        // This is now less critical as direct UC ID is handled at the start
        if (!resolvedChannelId && cleanId.toUpperCase().startsWith('UC') && cleanId.length === 24) {
             resolvedChannelId = cleanId;
             console.log('FilterTube Background: Falling back to cleanId as resolvedChannelId:', resolvedChannelId);
        }


        console.log('FilterTube Background: Extracted -', { name: channelName, handle: channelHandle, logo: channelLogo, resolvedChannelId: resolvedChannelId });

        if (!resolvedChannelId) {
            console.error('FilterTube Background: Could not resolve actual Channel ID from page data.');
            return { success: false, error: 'Could not resolve actual Channel ID.' };
        }

        return {
            success: true,
            name: channelName || resolvedChannelId, // Fallback to ID if name fails
            id: resolvedChannelId,
            handle: channelHandle,
            logo: channelLogo
        };
    } catch (error) {
        console.error('FilterTube Background: Failed to fetch channel info:', error);
        return { success: false, error: error.message || 'Unknown error during channel info fetch.' };
    }
}


console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} loaded and ready to serve filtered content.`);

