// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

const IS_FIREFOX_BRIDGE = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI_BRIDGE = IS_FIREFOX_BRIDGE ? browser : chrome;

// Debug counter for tracking
let debugSequence = 0;
let currentSettings = null;
function debugLog(message, ...args) {
    debugSequence++;
    // console.log(`[${debugSequence}] FilterTube (Bridge ${IS_FIREFOX_BRIDGE ? 'Fx' : 'Cr'}):`, message, ...args);
}

// ============================================================================
// DOM MANIPULATION HELPERS (SOFT HIDE)
// ============================================================================

// Ensure CSS style for hiding exists
function ensureStyles() {
    if (!document.getElementById('filtertube-style')) {
        const style = document.createElement('style');
        style.id = 'filtertube-style';
        style.textContent = `
            .filtertube-hidden { display: none !important; }
            .filtertube-hidden-shelf { display: none !important; }
            /* Debugging aid (optional, can be toggled) */
            /* .filtertube-hidden { display: block !important; opacity: 0.1 !important; border: 2px solid red !important; } */
        `;
        document.head.appendChild(style);
    }
}

/**
 * Toggles visibility of an element using CSS classes.
 * This allows for immediate restoration without page reload.
 */
function toggleVisibility(element, shouldHide, reason = '') {
    if (!element) return;

    if (shouldHide) {
        if (!element.classList.contains('filtertube-hidden')) {
            element.classList.add('filtertube-hidden');
            element.setAttribute('data-filtertube-hidden', 'true');
            // debugLog(`🚫 Hiding: ${reason}`);
        }
    } else {
        if (element.classList.contains('filtertube-hidden')) {
            element.classList.remove('filtertube-hidden');
            element.removeAttribute('data-filtertube-hidden');
            // debugLog(`✅ Restoring element`);
        }
    }
}

/**
 * Recursively checks if a container should be hidden because all its relevant children are hidden.
 */
function updateContainerVisibility(container, childSelector) {
    if (!container) return;

    const children = container.querySelectorAll(childSelector);
    if (children.length === 0) return; // Don't hide empty containers that might be loading

    // Check if all children are hidden
    const allHidden = Array.from(children).every(child =>
        child.classList.contains('filtertube-hidden') ||
        child.hasAttribute('data-filtertube-hidden')
    );

    if (allHidden) {
        container.classList.add('filtertube-hidden-shelf');
    } else {
        container.classList.remove('filtertube-hidden-shelf');
    }
}

// ============================================================================
// FALLBACK FILTERING LOGIC
// ============================================================================

function handleCommentsFallback(settings) {
    const commentSections = document.querySelectorAll('#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"], ytd-comment-thread-renderer');

    commentSections.forEach(section => {
        // 1. Global Hide
        if (settings.hideAllComments) {
            toggleVisibility(section, true, 'Hide All Comments');
            return;
        }

        // 2. Restore if global hide disabled
        if (!settings.filterComments && !settings.hideAllComments) {
            toggleVisibility(section, false);
        }

        // 3. Content Filtering
        if (settings.filterComments && settings.filterKeywords?.length > 0) {
            const comments = section.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer');
            let visibleCount = 0;

            comments.forEach(comment => {
                const commentText = comment.textContent || '';
                const channelName = comment.querySelector('#author-text, #channel-name, yt-formatted-string')?.textContent || '';

                const shouldHide = shouldHideContent(commentText, channelName, settings);
                toggleVisibility(comment, shouldHide, 'Comment Filter');

                if (!shouldHide) visibleCount++;
            });
        }
    });
}

// DOM fallback function that processes already-rendered content
function applyDOMFallback(settings, options = {}) {
    const effectiveSettings = settings || currentSettings;
    if (!effectiveSettings || typeof effectiveSettings !== 'object') return;

    currentSettings = effectiveSettings;

    const { forceReprocess = false } = options;
    ensureStyles();

    // 1. Video/Content Filtering
    const VIDEO_SELECTORS = [
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-compact-video-renderer',
        'ytd-reel-item-renderer',
        'ytd-playlist-renderer',
        'ytd-radio-renderer',
        'ytd-shelf-renderer',
        'yt-lockup-view-model',
        'yt-lockup-metadata-view-model',
        'ytd-channel-renderer',
        'ytd-rich-grid-media'
    ].join(', ');

    const elements = document.querySelectorAll(VIDEO_SELECTORS);

    elements.forEach(element => {
        // Optimization: Skip if already processed and not forced
        if (!forceReprocess && element.hasAttribute('data-filtertube-processed')) {
            // But if we are in a "restore" scenario (settings changed), we might need to re-check
            // For robustness, we'll re-check visibility logic but maybe skip heavy text extraction if possible
            // For now, let's just re-run to be safe.
        }

        // Extract Metadata
        const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset');
        const channelElement = element.querySelector('#channel-name a, .ytd-channel-name a, #text, .ytd-video-owner-renderer a, .yt-lockup-metadata-view-model-wiz__metadata, .yt-content-metadata-view-model__metadata-text');

        const title = titleElement?.textContent?.trim() || element.innerText || '';
        const channel = channelElement?.textContent?.trim() || '';

        // Determine Visibility
        const shouldHide = shouldHideContent(title, channel, effectiveSettings);

        // Handle Container Logic (e.g., rich-grid-media inside rich-item)
        let targetToHide = element;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'ytd-rich-grid-media') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        } else if (tagName === 'yt-lockup-view-model' || tagName === 'yt-lockup-metadata-view-model') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        }

        toggleVisibility(targetToHide, shouldHide, `Content: ${title}`);
        element.setAttribute('data-filtertube-processed', 'true');
    });

    // 2. Chip Filtering (Home/Search chip bars)
    document.querySelectorAll('yt-chip-cloud-chip-renderer').forEach(chip => {
        const label = chip.textContent?.trim() || '';
        const hideChip = shouldHideContent(label, '', effectiveSettings);
        toggleVisibility(chip, hideChip, `Chip: ${label}`);
    });

    // Hide any rich items that ended up empty after filtering to avoid blank cards
    document.querySelectorAll('ytd-rich-item-renderer').forEach(item => {
        const contentEl = item.querySelector('#content');
        if (!contentEl) return;
        const hasVisibleChild = Array.from(contentEl.children).some(child => child.offsetParent !== null);
        if (!hasVisibleChild && !item.hasAttribute('data-filtertube-hidden')) {
            toggleVisibility(item, true, 'Empty Rich Item');
        }
    });

    // 3. Shorts Filtering
    const shortsSelectors = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-rich-shelf-renderer[is-shorts]';
    document.querySelectorAll(shortsSelectors).forEach(element => {
        let target = element;
        const parent = element.closest('ytd-rich-item-renderer');
        if (parent) target = parent;

        if (effectiveSettings.hideAllShorts) {
            toggleVisibility(target, true, 'Hide All Shorts');
        } else {
            // Only restore if not hidden by specific keyword
            if (!target.hasAttribute('data-filtertube-hidden-by-keyword')) {
                toggleVisibility(target, false);
            }
        }
    });

    // 4. Comments Filtering
    handleCommentsFallback(effectiveSettings);

    // 5. Container Cleanup (Shelves, Grids)
    // Hide shelves if all their items are hidden
    const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-item-section-renderer, grid-shelf-view-model');
    shelves.forEach(shelf => {
        updateContainerVisibility(shelf, 'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model');
    });
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings) {
    if (!title && !channel) return false;

    // Check keywords
    if (settings.filterKeywords && settings.filterKeywords.length > 0) {
        for (const keywordData of settings.filterKeywords) {
            let regex;
            try {
                if (keywordData instanceof RegExp) {
                    regex = keywordData;
                } else if (keywordData.pattern) {
                    regex = new RegExp(keywordData.pattern, keywordData.flags);
                } else {
                    regex = new RegExp(keywordData.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                }
            } catch (e) {
                continue;
            }

            if (regex.test(title) || regex.test(channel)) {
                return true;
            }
        }
    }

    // Check channels
    if (settings.filterChannels && settings.filterChannels.length > 0) {
        const channelLower = channel.toLowerCase();
        for (const filterChannel of settings.filterChannels) {
            if (channelLower.includes(filterChannel)) {
                return true;
            }
        }
    }

    return false;
}

// ============================================================================
// COMMUNICATION & INIT
// ============================================================================

browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request) return;

    if (request.action === 'FilterTube_RefreshNow') {
        debugLog('🔄 Refresh requested via runtime messaging');
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
        sendResponse?.({ acknowledged: true });
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        debugLog('⚡ Applying settings pushed from UI');
        sendSettingsToMainWorld(request.settings);
        applyDOMFallback(request.settings, { forceReprocess: true });
        sendResponse?.({ acknowledged: true });
    }
});

let scriptsInjected = false;
let injectionInProgress = false;
let pendingSeedSettings = null;
let seedListenerAttached = false;

async function injectMainWorldScripts() {
    if (scriptsInjected || injectionInProgress) return;
    injectionInProgress = true;

    const scriptsToInject = ['filter_logic'];
    if (IS_FIREFOX_BRIDGE) scriptsToInject.push('seed');
    scriptsToInject.push('injector');

    try {
        if (!IS_FIREFOX_BRIDGE && browserAPI_BRIDGE.scripting?.executeScript) {
            await injectViaScriptingAPI(scriptsToInject);
        } else {
            await injectViaFallback(scriptsToInject);
        }
        scriptsInjected = true;
        setTimeout(() => requestSettingsFromBackground(), 100);
    } catch (error) {
        debugLog("❌ Script injection failed:", error);
        injectionInProgress = false;
    }
    injectionInProgress = false;
}

async function injectViaScriptingAPI(scripts) {
    return new Promise((resolve, reject) => {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "injectScripts",
            scripts: scripts
        }, (response) => {
            if (browserAPI_BRIDGE.runtime.lastError || !response?.success) {
                reject(new Error(browserAPI_BRIDGE.runtime.lastError?.message || response?.error));
            } else {
                resolve();
            }
        });
    });
}

async function injectViaFallback(scripts) {
    return new Promise((resolve) => {
        let currentIndex = 0;
        function injectNext() {
            if (currentIndex >= scripts.length) {
                resolve();
                return;
            }
            const scriptName = scripts[currentIndex];
            const script = document.createElement('script');
            script.src = browserAPI_BRIDGE.runtime.getURL(`js/${scriptName}.js`);
            script.onload = () => {
                currentIndex++;
                setTimeout(injectNext, 50);
            };
            (document.head || document.documentElement).appendChild(script);
        }
        injectNext();
    });
}

function requestSettingsFromBackground() {
    return new Promise((resolve) => {
        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings" }, (response) => {
            if (response && !response.error) {
                sendSettingsToMainWorld(response);
                resolve({ success: true, settings: response });
            } else {
                resolve({ success: false });
            }
        });
    });
}

function tryApplySettingsToSeed(settings) {
    if (window.filterTube?.updateSettings) {
        try {
            window.filterTube.updateSettings(settings);
            pendingSeedSettings = null;
            return true;
        } catch (error) {
            debugLog('❌ Failed to forward settings to seed.js:', error);
        }
    }
    return false;
}

function ensureSeedReadyListener() {
    if (seedListenerAttached) return;
    seedListenerAttached = true;
    window.addEventListener('filterTubeSeedReady', () => {
        if (pendingSeedSettings) {
            tryApplySettingsToSeed(pendingSeedSettings);
        }
    });
}

function scheduleSeedRetry() {
    setTimeout(() => {
        if (pendingSeedSettings) {
            if (!tryApplySettingsToSeed(pendingSeedSettings)) {
                scheduleSeedRetry();
            }
        }
    }, 250);
}

function sendSettingsToMainWorld(settings) {
    latestSettings = settings;
    currentSettings = settings;
    window.postMessage({
        type: 'FilterTube_SettingsToInjector',
        payload: settings,
        source: 'content_bridge'
    }, '*');

    if (!tryApplySettingsToSeed(settings)) {
        pendingSeedSettings = settings;
        ensureSeedReadyListener();
        scheduleSeedRetry();
    }
}

function handleMainWorldMessages(event) {
    if (event.source !== window || !event.data?.type?.startsWith('FilterTube_')) return;
    if (event.data.source === 'content_bridge') return;

    const { type } = event.data;
    if (type === 'FilterTube_InjectorToBridge_Ready') {
        requestSettingsFromBackground();
    } else if (type === 'FilterTube_Refresh') {
        requestSettingsFromBackground().then(result => {
            if (result?.success) applyDOMFallback(result.settings, { forceReprocess: true });
        });
    }
}

function handleStorageChanges(changes, area) {
    if (area !== 'local') return;
    const relevantKeys = ['filterKeywords', 'filterChannels', 'uiChannels', 'hideAllComments', 'filterComments', 'hideAllShorts'];
    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {
        requestSettingsFromBackground().then(result => {
            if (result?.success) applyDOMFallback(result.settings, { forceReprocess: true });
        });
    }
}

async function initialize() {
    try {
        await injectMainWorldScripts();
        const response = await requestSettingsFromBackground();
        if (response?.success) {
            initializeDOMFallback(response.settings);
        }
    } catch (error) {
        debugLog('❌ Error during initialization:', error);
    }
}

async function initializeDOMFallback(settings) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!settings) {
        const response = await requestSettingsFromBackground();
        settings = response?.settings;
    }
    if (settings) {
        applyDOMFallback(settings);

        // Set up a mutation observer to handle dynamic loading
        // We use a debounced version of the fallback to prevent performance issues
        const debouncedFallback = debounce(() => {
            applyDOMFallback(null);
        }, 200);

        const observer = new MutationObserver(debouncedFallback);
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Debounce helper
function debounce(func, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };
}

window.addEventListener('message', handleMainWorldMessages, false);
try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }

setTimeout(() => initialize(), 50);
