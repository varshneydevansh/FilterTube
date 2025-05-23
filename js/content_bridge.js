// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

const IS_FIREFOX_BRIDGE = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI_BRIDGE = IS_FIREFOX_BRIDGE ? browser : chrome;

// Debug counter for tracking
let debugSequence = 0;
function debugLog(message, ...args) {
    debugSequence++;
    console.log(`[${debugSequence}] FilterTube (Bridge ${IS_FIREFOX_BRIDGE ? 'Fx' : 'Cr'}):`, message, ...args);
}

// Injection state tracking
let scriptsInjected = false;
let injectionInProgress = false;

/**
 * Main script injection function - handles both Chrome and Firefox
 */
async function injectMainWorldScripts() {
    if (scriptsInjected || injectionInProgress) {
        debugLog("⏭️ Scripts already injected or injection in progress");
        return;
    }
    
    injectionInProgress = true;
    debugLog("🚀 Starting MAIN world script injection sequence");
    
    // Define scripts to inject (order matters!)
    const scriptsToInject = ['filter_logic']; // Always inject filter_logic first
    
    // Add seed.js for Firefox only (Chrome loads it via manifest)
    if (IS_FIREFOX_BRIDGE) {
        scriptsToInject.push('seed');
    }
    
    // Always add injector.js last
    scriptsToInject.push('injector');
    
    debugLog(`📋 Will inject: ${scriptsToInject.join(', ')}`);
    
    try {
        // Debug Chrome API detection
        debugLog("🔍 Chrome API Detection:", {
            isFirefox: IS_FIREFOX_BRIDGE,
            browserAPI: typeof browserAPI_BRIDGE,
            scripting: typeof browserAPI_BRIDGE.scripting,
            executeScript: typeof browserAPI_BRIDGE.scripting?.executeScript
        });
        
        // Try Chrome's modern scripting API first
        if (!IS_FIREFOX_BRIDGE && browserAPI_BRIDGE.scripting?.executeScript) {
            debugLog("🎯 Attempting Chrome scripting API injection");
            await injectViaScriptingAPI(scriptsToInject);
            debugLog("✅ Chrome scripting API injection successful");
        } else {
            debugLog(`🔄 Using fallback injection (Firefox: ${IS_FIREFOX_BRIDGE})`);
            if (!IS_FIREFOX_BRIDGE) {
                debugLog("⚠️ Chrome scripting API not available - this may indicate a permission issue");
            }
            await injectViaFallback(scriptsToInject);
            debugLog("✅ Fallback injection successful");
        }
        
        scriptsInjected = true;
        debugLog("🎉 All MAIN world scripts successfully injected");
        
        // Request settings after successful injection
        setTimeout(() => requestSettingsFromBackground(), 100);
        
    } catch (error) {
        debugLog("❌ Script injection failed:", error);
        
        // Reset flags to allow retry
        injectionInProgress = false;
        scriptsInjected = false;
        
        // Try fallback if Chrome API failed
        if (!IS_FIREFOX_BRIDGE) {
            debugLog("🔄 Retrying with fallback injection");
            setTimeout(() => injectMainWorldScripts(), 500);
        }
    }
    
    injectionInProgress = false;
}

/**
 * Chrome scripting API injection
 */
async function injectViaScriptingAPI(scripts) {
    debugLog("🔧 Attempting to use Chrome scripting API via background script");
    
    return new Promise((resolve, reject) => {
        // Ask background script to inject via scripting API
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "injectScripts",
            scripts: scripts
        }, (response) => {
            if (browserAPI_BRIDGE.runtime.lastError) {
                debugLog("❌ Background injection failed:", browserAPI_BRIDGE.runtime.lastError.message);
                reject(new Error(browserAPI_BRIDGE.runtime.lastError.message));
                return;
            }
            
            if (response?.success) {
                debugLog("✅ Background script injection successful");
                resolve();
            } else {
                debugLog("❌ Background script injection failed:", response?.error);
                reject(new Error(response?.error || "Unknown injection error"));
            }
        });
    });
}

/**
 * Fallback injection using script tags
 */
async function injectViaFallback(scripts) {
    debugLog("🔄 Using fallback script tag injection");
    
    return new Promise((resolve, reject) => {
        let currentIndex = 0;
        
        function injectNext() {
            if (currentIndex >= scripts.length) {
                debugLog("✅ All fallback scripts injected");
                resolve();
                return;
            }
            
            const scriptName = scripts[currentIndex];
            const script = document.createElement('script');
            
            // Set up script element
            script.src = browserAPI_BRIDGE.runtime.getURL(`js/${scriptName}.js`);
            script.type = 'text/javascript';
            
            script.onload = () => {
                debugLog(`✅ ${scriptName}.js loaded via fallback`);
                currentIndex++;
                setTimeout(injectNext, 50); // Small delay between scripts
            };
            
            script.onerror = (error) => {
                debugLog(`❌ ${scriptName}.js failed to load:`, error);
                reject(new Error(`Failed to load ${scriptName}.js`));
            };
            
            // Inject into page
            const target = document.head || document.documentElement;
            target.appendChild(script);
            
            debugLog(`📤 Injecting ${scriptName}.js via fallback (${currentIndex + 1}/${scripts.length})`);
        }
        
        injectNext();
    });
}

/**
 * Request settings from background script
 */
function requestSettingsFromBackground() {
    debugLog("📞 Requesting compiled settings from background script");
    
    try {
        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings" }, (response) => {
            if (browserAPI_BRIDGE.runtime.lastError) {
                debugLog("❌ Error receiving settings:", browserAPI_BRIDGE.runtime.lastError.message);
                sendSettingsToMainWorld({});
                return;
            }
            
            if (response?.error) {
                debugLog("❌ Background script error:", response.error);
                sendSettingsToMainWorld({});
                return;
            }
            
            if (response) {
                debugLog("✅ Received settings:", {
                    keywords: response.filterKeywords?.length || 0,
                    channels: response.filterChannels?.length || 0,
                    hideAllComments: response.hideAllComments,
                    hideAllShorts: response.hideAllShorts
                });
                sendSettingsToMainWorld(response);
            } else {
                debugLog("⚠️ No settings received, sending empty");
                sendSettingsToMainWorld({});
            }
        });
    } catch (error) {
        debugLog("❌ Exception requesting settings:", error);
        sendSettingsToMainWorld({});
    }
}

/**
 * Send settings to MAIN world scripts
 */
function sendSettingsToMainWorld(settings) {
    const settingsToSend = settings && typeof settings === 'object' ? settings : {};
    
    debugLog("📤 Sending settings to MAIN world:", {
        keywords: settingsToSend.filterKeywords?.length || 0,
        channels: settingsToSend.filterChannels?.length || 0,
        hideAllComments: settingsToSend.hideAllComments,
        hideAllShorts: settingsToSend.hideAllShorts
    });
    
    try {
        // Send to injector.js
        window.postMessage({
            type: 'FilterTube_SettingsToInjector',
            payload: settingsToSend,
            source: 'content_bridge'
        }, '*');
        
        debugLog("✅ Settings sent to injector.js");
        
        // Also try direct update to seed.js if available
        setTimeout(() => {
            if (window.filterTube?.updateSettings) {
                debugLog("📤 Updating seed.js directly");
                window.filterTube.updateSettings(settingsToSend);
                debugLog("✅ Seed.js updated directly");
            } else {
                debugLog("ℹ️ Direct seed.js update not available (normal if injector handles it)");
            }
        }, 100);
        
    } catch (error) {
        debugLog("❌ Error sending settings:", error);
    }
}

/**
 * Handle messages from MAIN world scripts
 */
function handleMainWorldMessages(event) {
    if (event.source !== window || !event.data?.type?.startsWith('FilterTube_')) {
        return;
    }
    
    const { type, payload } = event.data;
    
    // Ignore our own messages
    if (event.data.source === 'content_bridge') {
        return;
    }
    
    switch (type) {
        case 'FilterTube_InjectorToBridge_Ready':
            debugLog("✅ Injector.js ready signal received");
            requestSettingsFromBackground();
            break;
            
        case 'FilterTube_SeedToBridge_Log':
            if (payload?.message) {
                console.log('FilterTube (MAIN-Seed):', ...payload.message);
            }
            break;
            
        case 'FilterTube_InjectorToBridge_Log':
            if (payload?.message) {
                console.log('FilterTube (MAIN-Injector):', ...payload.message);
            }
            break;
            
        default:
            debugLog(`📨 Received MAIN world message: ${type}`);
            break;
    }
}

/**
 * Handle storage changes
 */
function handleStorageChanges(changes, area) {
    if (area !== 'local') return;
    
    const relevantKeys = ['filterKeywords', 'filterChannels', 'hideAllComments', 'filterComments', 'useExactWordMatching', 'hideAllShorts'];
    const changedKeys = Object.keys(changes).filter(key => relevantKeys.includes(key));
    
    if (changedKeys.length > 0) {
        debugLog("🔄 Storage changed, updating settings:", changedKeys);
        requestSettingsFromBackground();
    }
}

// Wait for both scripts to load and then apply DOM fallback
async function initializeDOMFallback() {
    // Wait a bit to ensure injector and filter logic are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Request current settings
    const response = await requestSettingsFromBackground();
    if (!response || !response.success) {
        debugLog('⚠️ Could not get settings for DOM fallback');
        return;
    }
    
    const settings = response.settings;
    debugLog('🔄 Applying DOM fallback with settings:', {
        keywords: settings.filterKeywords?.length || 0,
        channels: settings.filterChannels?.length || 0,
        hideAllComments: settings.hideAllComments,
        hideAllShorts: settings.hideAllShorts
    });
    
    // Apply DOM-based filtering to existing content
    applyDOMFallback(settings);
}

// DOM fallback function that processes already-rendered content
function applyDOMFallback(settings) {
    const startTime = performance.now();
    let processedCount = 0;
    let hiddenCount = 0;
    
    // Video content selectors (based on the old content.js)
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
        'ytd-channel-renderer'
    ].join(', ');
    
    // Process video elements
    document.querySelectorAll(VIDEO_SELECTORS).forEach(element => {
        if (element.hasAttribute('data-filtertube-processed')) return;
        
        processedCount++;
        
        // Extract title and channel info
        const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title');
        const channelElement = element.querySelector('#channel-name a, .ytd-channel-name a, #text, .ytd-video-owner-renderer a');
        
        const title = titleElement?.textContent?.trim() || '';
        const channel = channelElement?.textContent?.trim() || '';
        
        // Check if should be hidden
        if (shouldHideContent(title, channel, settings)) {
            element.style.display = 'none';
            element.setAttribute('data-filtertube-hidden', 'true');
            hiddenCount++;
            debugLog(`🚫 DOM fallback hid: "${title}" by "${channel}"`);
        }
        
        element.setAttribute('data-filtertube-processed', 'true');
    });
    
    // Handle comments if needed
    if (settings.hideAllComments) {
        const commentSections = document.querySelectorAll('#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"]');
        commentSections.forEach(section => {
            section.style.display = 'none';
            hiddenCount++;
        });
        debugLog('🚫 DOM fallback hid comment sections');
    }
    
    // Handle shorts if needed
    if (settings.hideAllShorts) {
        const shortsElements = document.querySelectorAll('ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2');
        shortsElements.forEach(element => {
            element.style.display = 'none';
            element.setAttribute('data-filtertube-hidden', 'true');
            hiddenCount++;
        });
        debugLog('🚫 DOM fallback hid shorts elements');
    }
    
    const duration = Math.round(performance.now() - startTime);
    debugLog(`✅ DOM fallback complete: processed ${processedCount}, hidden ${hiddenCount} in ${duration}ms`);
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings) {
    if (!title && !channel) return false;
    
    // Check keywords (these come as compiled regex objects with pattern and flags)
    if (settings.filterKeywords && settings.filterKeywords.length > 0) {
        for (const keywordData of settings.filterKeywords) {
            // Reconstruct the regex from the compiled data
            let regex;
            try {
                regex = new RegExp(keywordData.pattern, keywordData.flags);
            } catch (e) {
                console.error('FilterTube DOM fallback: Invalid regex:', keywordData, e);
                continue;
            }
            
            if (regex.test(title) || regex.test(channel)) {
                return true;
            }
        }
    }
    
    // Check channels (these come as lowercase strings)
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

// Main initialization - add DOM fallback after script injection
async function initialize() {
    debugLog('🚀 Initializing content bridge...');
    
    try {
        await injectMainWorldScripts();
        debugLog('✅ Scripts injected successfully');
        
        // Start settings flow
        requestSettingsFromBackground();
        
        // Initialize DOM fallback for existing content
        initializeDOMFallback();
        
    } catch (error) {
        debugLog('❌ Error during initialization:', error);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

debugLog("🔍 Initializing FilterTube bridge");

// Set up event listeners
window.addEventListener('message', handleMainWorldMessages, false);

try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
    debugLog("✅ Storage change listener registered");
} catch (error) {
    debugLog("❌ Failed to register storage listener:", error);
}

// Use the proper initialize function which includes DOM fallback
setTimeout(() => initialize(), 50);

// Listen for seed ready event if it comes from manifest injection
window.addEventListener('filterTubeSeedReady', () => {
    debugLog("✅ Seed ready event received");
    if (!scriptsInjected) {
        setTimeout(() => initialize(), 100);
    }
}, { once: true });

debugLog("🏁 Bridge initialization complete");

 