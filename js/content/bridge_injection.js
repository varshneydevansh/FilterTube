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
        injectionInProgress: false
    });

    const isFirefox = typeof browser !== 'undefined' && !!browser.runtime;
    const api = isFirefox ? browser : chrome;

    globalThis.IS_FIREFOX_BRIDGE = isFirefox;
    globalThis.browserAPI_BRIDGE = api;

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
        return new Promise((resolve) => {
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
                (document.head || document.documentElement).appendChild(script);
            }
            injectNext();
        });
    }

    globalThis.injectMainWorldScripts = async function injectMainWorldScripts() {
        if (bridgeState.scriptsInjected || bridgeState.injectionInProgress) return;
        bridgeState.injectionInProgress = true;

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
            try {
                globalThis.debugLog("❌ Script injection failed:", error);
            } catch (e) {
            }
        } finally {
            bridgeState.injectionInProgress = false;
        }
    };
})();

var IS_FIREFOX_BRIDGE = globalThis.IS_FIREFOX_BRIDGE;
var browserAPI_BRIDGE = globalThis.browserAPI_BRIDGE;
var debugLog = globalThis.debugLog;
var currentSettings = globalThis.currentSettings;
var injectMainWorldScripts = globalThis.injectMainWorldScripts;
