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
        const recent = new Map(), pendingParent = new Map();
        const PARENT_SWITCH_TIMEOUT_MS = 5 * 60 * 1000;
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

        /** The current parent for display: name, e-mail (shown, never stored), avatar and app-scoped key. */
        function parentOf(result) {
            const parent = result?.parent;
            const parentKey = contract.personaKey(parent?.parentKey);
            const displayName = typeof parent?.displayName === 'string' ? parent.displayName.trim().slice(0, 120) : '';
            if (!parentKey || !displayName) return null;
            return { parentKey, displayName, email: contract.normalizedEmail(parent.email) || '',
                avatarUrl: /^https:\/\//.test(String(parent.avatarUrl || '')) ? parent.avatarUrl : null };
        }
        async function rosterOf(tabId) {
            const result = await run(tabId, contract.pageRoster, [0]).catch(() => null);
            return { signedIn: result?.signedIn === true && result?.status === 'ok', parent: parentOf(result) };
        }
        const announce = message => {
            try {
                const maybe = api.runtime.sendMessage({ action: 'FilterTube_KidsParentSwitchResult', ...message }, () => void api.runtime.lastError);
                if (maybe && typeof maybe.catch === 'function') maybe.catch(() => {});
            } catch (_) { /* No extension page is listening. */ }
        };

        /**
         * Changes YouTube Kids' parent the way youtubekids.com does: its own Google sign-in with the account
         * chooser, in the youtubekids.com tab. Never signs anyone out. 'change' is the parent's switcher;
         * 'apply_link' only goes to the active profile's linked parent, and the result is checked.
         */
        async function parentSwitch(request) {
            const profilesV4 = await readProfilesV4();
            const actorId = profilesV4?.activeProfileId || 'default';
            const links = profilesV4?.[contract.LINKS_KEY];
            let targetKey = null, targetName = '';
            if (request.mode === 'apply_link') {
                const link = contract.linkFor(links, actorId);
                if (!link?.parentKey) return { ok: false, error: 'no_parent_in_link' };
                // Inside a child Google may offer other accounts, so the parent's unlock is required.
                const authorityId = contract.profileType(profilesV4, actorId) === 'child'
                    ? (profilesV4?.profiles?.[actorId]?.parentProfileId || 'default') : actorId;
                if (await isProfileAuthorized(profilesV4, authorityId) !== true) return { ok: false, error: 'locked' };
                targetKey = link.parentKey; targetName = link.parentName;
            } else {
                if (contract.parentChangeDecision(profilesV4, actorId) !== 'allowed') return { ok: false, error: 'child' };
                if (await isProfileAuthorized(profilesV4, actorId) !== true) return { ok: false, error: 'locked' };
            }
            const tab = await chooseTab(request.tabId) || await openKidsTab(true);
            const before = await rosterOf(tab.id);
            if (targetKey && before.parent?.parentKey === targetKey) return { ok: true, status: 'already_current' };
            const prepared = await run(tab.id, contract.pagePrepareParentSignIn, []);
            const url = prepared?.status === 'ready' ? contract.oauthUrl({ ...prepared, loginHint: request.loginHint || null }) : null;
            if (!url) return { ok: false, error: prepared?.status || 'failed' };
            pendingParent.set(tab.id, { state: prepared.state, targetKey, targetName, beforeKey: before.parent?.parentKey || null,
                phase: 'google', startedAt: now() });
            await call(api.tabs, 'update', tab.id, { url, active: true });
            return { ok: true, status: 'started' };
        }
        async function finishParentSwitch(tabId, outcome, parent) {
            pendingParent.delete(tabId);
            announce({ outcome, parentName: parent?.displayName || '' });
        }
        async function continueParentSwitch(tabId, tab) {
            const pending = pendingParent.get(tabId);
            if (!pending) return false;
            if (now() - pending.startedAt > PARENT_SWITCH_TIMEOUT_MS) { await finishParentSwitch(tabId, 'TIMED_OUT', null); return true; }
            const url = String(tab?.url || '');
            if (contract.isSignInRejected(url)) { await finishParentSwitch(tabId, 'REJECTED', null); return true; }
            if (pending.phase === 'google' && contract.isSignInReturn(url)) {
                pending.phase = 'returned';
                // Let the return page check its state and keep Google's version_info, then reload YouTube Kids.
                for (let i = 0; i < 10; i++) {
                    const status = await run(tabId, contract.pageParentReturnStatus, [pending.state]).catch(() => 'unknown');
                    if (status !== 'pending') break;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                pending.phase = 'reloading';
                await call(api.tabs, 'update', tabId, { url: HOME }).catch(() => {});
                return true;
            }
            if (pending.phase === 'reloading' && KIDS_URL.test(url) && !contract.isSignInReturn(url)) {
                const after = await rosterOf(tabId);
                const outcome = contract.parentSwitchOutcome({ targetKey: pending.targetKey, beforeKey: pending.beforeKey,
                    afterSignedIn: after.signedIn, afterKey: after.parent?.parentKey || null });
                if (after.parent?.parentKey && after.parent.parentKey !== pending.beforeKey) {
                    // The stored kid belonged to the old parent.
                    await run(tabId, contract.pageClearSelection, []).catch(() => {});
                    recent.delete(tabId);
                    const reconciled = await reconcile({ id: tabId, url }, true);
                    if (!reconciled || reconciled.status !== 'activation_started') await call(api.tabs, 'reload', tabId).catch(() => {});
                }
                await finishParentSwitch(tabId, outcome, after.parent);
                return true;
            }
            return true;
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
                return { ok: true, status: result.status, signedIn: result.signedIn === true, parent: parentOf(result),
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
            if (request.action === 'FilterTube_KidsParentSwitch') return parentSwitch(request);
            return { ok: false, error: 'unknown_action' };
        }

        api.tabs?.onUpdated?.addListener((tabId, change, tab) => {
            if (change.status !== 'complete') return;
            if (pendingParent.has(tabId)) { continueParentSwitch(tabId, tab).catch(() => {}); return; }
            reconcile(tab).catch(() => {});
        });
        api.tabs?.onRemoved?.addListener(tabId => {
            recent.delete(tabId);
            if (pendingParent.has(tabId)) finishParentSwitch(tabId, 'CANCELLED', null).catch(() => {});
        });
        api.storage?.onChanged?.addListener((changes, area) => {
            const change = area === 'local' ? changes.ftProfilesV4 : null;
            if (!change) return;
            const before = change.oldValue || {}, after = change.newValue || {};
            const activeBefore = before.activeProfileId || 'default', activeAfter = after.activeProfileId || 'default';
            const linkBefore = contract.linkFor(before[contract.LINKS_KEY], activeBefore);
            const linkAfter = contract.linkFor(after[contract.LINKS_KEY], activeAfter);
            if (activeBefore !== activeAfter || linkBefore?.personaKey !== linkAfter?.personaKey) reconcileAll().catch(() => {});
        });
        return Object.freeze({ handle, reconcile, reconcileAll, continueParentSwitch });
    }
    root.FilterTubeKidsYouTubeProfilesBackground = Object.freeze({ install });
})(typeof globalThis !== 'undefined' ? globalThis : this);
