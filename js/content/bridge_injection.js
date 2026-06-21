// js/content/bridge_injection.js - Isolated World
//
// Bridge primitives extracted from `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.
//
// Responsibilities:
// - Define `browserAPI_BRIDGE` (Chrome vs Firefox) and `IS_FIREFOX_BRIDGE`.
// - Provide `debugLog` and shared `currentSettings` container.
// - Inject MAIN-world scripts (identity/filter_logic/injector/seed).

(() => {
    const bridgeState = globalThis.__filtertubeBridgeState || (globalThis.__filtertubeBridgeState = {
        debugSequence: 0,
        scriptsInjected: false,
        injectionInProgress: false,
        injectionPromise: null
    });

    const isFirefox = typeof browser !== 'undefined' && !!browser.runtime;
    const api = isFirefox ? browser : chrome;

    globalThis.IS_FIREFOX_BRIDGE = isFirefox;
    globalThis.browserAPI_BRIDGE = api;

    function isFilterTubeContentDebugEnabled() {
        try {
            return globalThis.__filtertubeDebug === true
                || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
        } catch (e) {
            return globalThis.__filtertubeDebug === true;
        }
    }

    function installFilterTubeContentConsoleGate() {
        try {
            if (globalThis.__filterTubeContentConsoleGateInstalled) return;
            const originalLog = typeof console?.log === 'function' ? console.log.bind(console) : null;
            const originalInfo = typeof console?.info === 'function' ? console.info.bind(console) : null;
            const originalDebug = typeof console?.debug === 'function' ? console.debug.bind(console) : null;
            if (originalLog) console.log = (...args) => { if (isFilterTubeContentDebugEnabled()) originalLog(...args); };
            if (originalInfo) console.info = (...args) => { if (isFilterTubeContentDebugEnabled()) originalInfo(...args); };
            if (originalDebug) console.debug = (...args) => { if (isFilterTubeContentDebugEnabled()) originalDebug(...args); };
            globalThis.__filterTubeContentConsoleGateInstalled = true;
        } catch (e) {
        }
    }

    installFilterTubeContentConsoleGate();

    if (typeof globalThis.currentSettings === 'undefined') {
        globalThis.currentSettings = null;
    }

    if (typeof globalThis.debugLog !== 'function') {
        globalThis.debugLog = function debugLog(message, ...args) {
            bridgeState.debugSequence++;
            // console.log(`[${bridgeState.debugSequence}] FilterTube (Bridge ${isFirefox ? 'Fx' : 'Cr'}):`, message, ...args);
        };
    }

    async function injectViaScriptingAPI(scripts) {
        return new Promise((resolve, reject) => {
            api.runtime.sendMessage({
                action: "injectScripts",
                scripts: scripts
            }, (response) => {
                if (api.runtime.lastError || !response?.success) {
                    reject(new Error(api.runtime.lastError?.message || response?.error));
                } else {
                    resolve();
                }
            });
        });
    }

    async function injectViaFallback(scripts) {
        return new Promise((resolve, reject) => {
            let currentIndex = 0;
            function injectNext() {
                if (currentIndex >= scripts.length) {
                    resolve();
                    return;
                }
                const scriptName = scripts[currentIndex];
                const script = document.createElement('script');
                script.src = api.runtime.getURL(`js/${scriptName}.js`);
                script.onload = () => {
                    currentIndex++;
                    setTimeout(injectNext, 50);
                };
                script.onerror = () => {
                    reject(new Error(`Failed to inject ${scriptName}`));
                };
                (document.head || document.documentElement).appendChild(script);
            }
            injectNext();
        });
    }

    globalThis.injectMainWorldScripts = async function injectMainWorldScripts() {
        if (bridgeState.scriptsInjected) {
            return bridgeState.injectionPromise || Promise.resolve();
        }
        if (bridgeState.injectionPromise) {
            return bridgeState.injectionPromise;
        }

        bridgeState.injectionInProgress = true;
        bridgeState.injectionPromise = (async () => {
            const scriptsToInject = ['shared/identity', 'filter_logic'];
            if (isFirefox) scriptsToInject.push('seed');
            scriptsToInject.push('injector');

            try {
                if (!isFirefox && api.scripting?.executeScript) {
                    await injectViaScriptingAPI(scriptsToInject);
                } else {
                    await injectViaFallback(scriptsToInject);
                }
                bridgeState.scriptsInjected = true;
                setTimeout(() => {
                    try {
                        if (typeof requestSettingsFromBackground === 'function') {
                            requestSettingsFromBackground();
                        }
                    } catch (e) {
                    }
                }, 100);
            } catch (error) {
                bridgeState.scriptsInjected = false;
                try {
                    globalThis.debugLog("❌ Script injection failed:", error);
                } catch (e) {
                }
                throw error;
            } finally {
                bridgeState.injectionInProgress = false;
                if (!bridgeState.scriptsInjected) {
                    bridgeState.injectionPromise = null;
                }
            }
        })();

        return bridgeState.injectionPromise;
    };
})();

var IS_FIREFOX_BRIDGE = globalThis.IS_FIREFOX_BRIDGE;
var browserAPI_BRIDGE = globalThis.browserAPI_BRIDGE;
var debugLog = globalThis.debugLog;
var currentSettings = globalThis.currentSettings;
var injectMainWorldScripts = globalThis.injectMainWorldScripts;
