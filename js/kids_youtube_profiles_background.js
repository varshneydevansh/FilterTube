/* YouTube Kids profiles in the background: read the parent's kid profiles, switch who's watching, and keep
 * the active FilterTube profile's linked kid selected on youtubekids.com. Names, ids and tokens are never logged. */
(function (root) {
    'use strict';
    const KIDS_URL = /^https:\/\/([a-z0-9-]+\.)?youtubekids\.com\//i;
    const HOME = 'https://www.youtubekids.com/';
    const RECONCILE_GAP_MS = 20000;
    const MAX_AGE_LOOKUPS = 8;

    function install({ api, contract = root.FilterTubeKidsYouTubeProfiles, readProfilesV4, isTrustedSender,
        isProfileAuthorized, now = Date.now }) {
        const recent = new Map();
        const call = (target, method, ...args) => new Promise((resolve, reject) => {
            try {
                const maybe = target[method](...args, value => {
                    const error = api.runtime.lastError;
                    error ? reject(new Error(error.message || 'call_failed')) : resolve(value);
                });
                if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject);
            } catch (error) { reject(error); }
        });
        const isKidsTab = tab => !!tab && Number.isInteger(tab.id) && KIDS_URL.test(String(tab.url || ''));
        async function run(tabId, func, args) {
            const results = await call(api.scripting, 'executeScript', { target: { tabId }, world: 'MAIN', func, args });
            return results?.[0]?.result || { status: 'failed' };
        }
        async function kidsTabs() {
            return (await call(api.tabs, 'query', { url: ['*://*.youtubekids.com/*'] }) || []).filter(isKidsTab);
        }
        async function chooseTab(requestedTabId) {
            if (Number.isInteger(requestedTabId)) {
                const tab = await call(api.tabs, 'get', requestedTabId).catch(() => null);
                if (isKidsTab(tab)) return tab;
            }
            return (await kidsTabs())[0] || null;
        }
        function waitForLoad(tabId, timeoutMs = 20000) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => { api.tabs.onUpdated.removeListener(listener); reject(new Error('timeout')); }, timeoutMs);
                function listener(id, change, tab) {
                    if (id !== tabId || change.status !== 'complete' || !isKidsTab(tab)) return;
                    clearTimeout(timer); api.tabs.onUpdated.removeListener(listener); resolve(tab);
                }
                api.tabs.onUpdated.addListener(listener);
            });
        }
        async function openKidsTab(active) {
            const tab = await call(api.tabs, 'create', { url: HOME, active });
            return waitForLoad(tab.id);
        }

        async function roster(request) {
            let tab = await chooseTab(request.tabId), created = false;
            if (!tab) {
                if (request.openIfNeeded !== true) return { ok: true, status: 'no_tab', signedIn: false, profiles: [], hiddenForOnboarding: 0 };
                tab = await openKidsTab(false); created = true;
            }
            try {
                const result = await run(tab.id, contract.pageRoster, [MAX_AGE_LOOKUPS]);
                const classified = contract.classify(result.rows);
                return { ok: true, status: result.status, signedIn: result.signedIn === true,
                    profiles: classified.profiles, hiddenForOnboarding: classified.hiddenForOnboarding };
            } finally {
                if (created) await call(api.tabs, 'remove', tab.id).catch(() => {});
            }
        }
        async function switchTo(request) {
            const key = contract.personaKey(request.personaKey);
            if (!key) return { ok: false, error: 'invalid' };
            const profilesV4 = await readProfilesV4();
            const actorId = profilesV4?.activeProfileId || 'default';
            if (await isProfileAuthorized(profilesV4, actorId) !== true) return { ok: false, error: 'locked' };
            const decision = contract.switchDecision(profilesV4, profilesV4?.[contract.LINKS_KEY], actorId, key);
            if (decision !== 'allowed') return { ok: false, error: decision };
            const tab = await chooseTab(request.tabId) || await openKidsTab(true);
            recent.set(tab.id, { key, at: now() });
            const result = await run(tab.id, contract.pageActivate, [key]);
            return { ok: ['activation_started', 'already_selected'].includes(result.status), status: result.status };
        }

        /** Keeps the linked kid selected. Throttled per tab so a failed switch cannot loop reloads. */
        async function reconcile(tab, force = false) {
            if (!isKidsTab(tab)) return null;
            const profilesV4 = await readProfilesV4();
            const actorId = profilesV4?.activeProfileId || 'default';
            const link = contract.linkFor(profilesV4?.[contract.LINKS_KEY], actorId);
            if (!link) return null;
            const last = recent.get(tab.id);
            if (!force && last && last.key === link.personaKey && now() - last.at < RECONCILE_GAP_MS) return null;
            recent.set(tab.id, { key: link.personaKey, at: now() });
            return run(tab.id, contract.pageActivate, [link.personaKey]).catch(() => null);
        }
        async function reconcileAll() {
            for (const tab of await kidsTabs()) await reconcile(tab, true);
        }

        async function handle(request, sender) {
            if (!isTrustedSender(sender)) return { ok: false, error: 'untrusted_sender' };
            if (!api.scripting?.executeScript) return { ok: false, error: 'unavailable' };
            if (request.action === 'FilterTube_KidsProfilesRoster') return roster(request);
            if (request.action === 'FilterTube_KidsProfilesSwitch') return switchTo(request);
            return { ok: false, error: 'unknown_action' };
        }

        api.tabs?.onUpdated?.addListener((tabId, change, tab) => {
            if (change.status === 'complete') reconcile(tab).catch(() => {});
        });
        api.tabs?.onRemoved?.addListener(tabId => recent.delete(tabId));
        api.storage?.onChanged?.addListener((changes, area) => {
            const change = area === 'local' ? changes.ftProfilesV4 : null;
            if (!change) return;
            const before = change.oldValue || {}, after = change.newValue || {};
            const activeBefore = before.activeProfileId || 'default', activeAfter = after.activeProfileId || 'default';
            const linkBefore = contract.linkFor(before[contract.LINKS_KEY], activeBefore);
            const linkAfter = contract.linkFor(after[contract.LINKS_KEY], activeAfter);
            if (activeBefore !== activeAfter || linkBefore?.personaKey !== linkAfter?.personaKey) reconcileAll().catch(() => {});
        });
        return Object.freeze({ handle, reconcile, reconcileAll });
    }
    root.FilterTubeKidsYouTubeProfilesBackground = Object.freeze({ install });
})(typeof globalThis !== 'undefined' ? globalThis : this);
