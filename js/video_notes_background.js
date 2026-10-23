/* Notes capabilities never carry text through the page or MAIN-world bridge. */
(function (root) {
    'use strict';
    function install({ api, getSettings, profileAuthorized, storeFactory, now = Date.now, randomId = () => crypto.randomUUID() }) {
        const grants = new Map(), drafts = new Map();
        const prefix = 'FilterTube_Notes';
        const editorUrl = api.runtime.getURL('html/video-notes.html');
        function call(target, method, ...args) {
            return new Promise((resolve, reject) => {
                target[method](...args, value => api.runtime.lastError ? reject(Error('notes_unavailable')) : resolve(value));
            });
        }
        async function parentMessage(grant, action, extra = {}, target = { frameId: 0 }) {
            let timer;
            try {
                return await Promise.race([
                    call(api.tabs, 'sendMessage', grant.tabId, { action, token: grant.token, instance: grant.instance, ...extra }, target),
                    new Promise((_, reject) => { timer = setTimeout(() => reject(Error('access_changed')), [prefix + 'Seek', prefix + 'Position'].includes(action) ? 4000 : 1200); })
                ]);
            } finally { clearTimeout(timer); }
        }
        function currentRoute(raw, id) {
            try { const url = new URL(raw); return url.protocol === 'https:' && ['www.youtube.com', 'm.youtube.com'].includes(url.hostname)
                && url.pathname === '/watch' && url.searchParams.get('v') === id; } catch (_) { return false; }
        }
        function trustedParent(raw) {
            try { const url = new URL(raw); return url.protocol === 'https:' && ['www.youtube.com', 'm.youtube.com'].includes(url.hostname); }
            catch (_) { return false; }
        }
        async function authorize(key, scope) {
            const grant = grants.get(scope?.token);
            if (!grant || grant.expiresAt <= now() || grant.tabId !== scope.tabId
                || key.profileId !== grant.key.profileId || key.videoId !== grant.key.videoId) return false;
            const tab = await call(api.tabs, 'get', grant.tabId);
            if (!currentRoute(tab?.url, key.videoId)) return false;
            const settings = await getSettings({ tab, url: tab.url });
            if (settings?.activeProfileId !== key.profileId || settings.profileType !== 'main'
                || (settings.enabled !== false && (settings.hideVideoInfo === true || settings.hideVideoButtonsBar === true))
                || settings.managedViewingRouteGate?.allowMainViewing === false
                || await profileAuthorized(key.profileId) !== true) return false;
            const receipt = await parentMessage(grant, prefix + 'Check');
            return grants.get(scope.token) === grant && grant.expiresAt > now()
                && receipt?.allowed === true && receipt.profileId === key.profileId && receipt.videoId === key.videoId;
        }
        const store = storeFactory({
            get: keys => call(api.storage.local, 'get', keys),
            set: values => call(api.storage.local, 'set', values),
            authorize, randomId: () => 'writer-' + randomId()
        });
        const draftKey = grant => JSON.stringify([grant.tabId, grant.key.profileId, grant.key.videoId]);
        async function handle(request, sender) {
            const action = request.action;
            const tabId = sender?.tab?.id;
            if (!Number.isInteger(tabId)) throw Error('access_changed');
            if (action === prefix + 'Grant') {
                // MessageSender.url can retain the initial document URL across
                // YouTube SPA navigation. Bind the live route below via tabs.get
                // and the isolated parent's current admission receipt instead.
                if (sender.frameId !== 0 || !trustedParent(sender.url)
                    || typeof request.profileId !== 'string' || typeof request.instance !== 'string'
                    || !/^[a-f0-9]{36}$/.test(request.instance)) throw Error('access_changed');
                const settings = await getSettings(sender);
                if (settings?.activeProfileId !== request.profileId || settings.profileType !== 'main') throw Error('access_changed');
                if (await profileAuthorized(request.profileId) !== true) throw Error('profile_locked');
                const existing = grants.get(request.token);
                if (request.token && (!existing || existing.expiresAt <= now())) throw Error('access_changed');
                if (existing && (existing.tabId !== tabId || existing.instance !== request.instance
                    || existing.key.profileId !== request.profileId || existing.key.videoId !== request.videoId)) throw Error('access_changed');
                for (const [oldToken, oldGrant] of grants) if (oldGrant.expiresAt <= now()) grants.delete(oldToken);
                const token = existing?.token || randomId();
                const grant = existing || { token, tabId, instance: request.instance,
                    key: { profileId: request.profileId, videoId: request.videoId } };
                grant.expiresAt = now() + 4000;
                grants.set(token, grant);
                // Initial issue also requires the isolated parent's current receipt.
                if (!await authorize(grant.key, { token, tabId })) { grants.delete(token); throw Error('access_changed'); }
                if (!existing) for (const [oldToken, oldGrant] of grants) if (oldToken !== token && oldGrant.tabId === tabId) grants.delete(oldToken);
                return { ok: true, token };
            }
            const grant = grants.get(request.token);
            if (!grant || grant.tabId !== tabId) throw Error('access_changed');
            const scope = { token: grant.token, tabId };
            if (action === prefix + 'Revoke') {
                if (sender.frameId !== 0 || grant.instance !== request.instance) throw Error('access_changed');
                grants.delete(grant.token); return { ok: true };
            }
            if (action === prefix + 'RequestClose') {
                if (sender.frameId !== 0 || grant.instance !== request.instance || !await authorize(grant.key, scope)) throw Error('access_changed');
                if (!Number.isInteger(grant.editorFrameId)) return { ok: true, closeUnopened: true };
                return await parentMessage(grant, prefix + 'ConfirmClose', {},
                    grant.editorDocumentId ? { documentId: grant.editorDocumentId } : { frameId: grant.editorFrameId });
            }
            if (String(sender.url || '').split(/[?#]/)[0] !== editorUrl || sender.frameId === 0) throw Error('access_changed');
            const editorIdentity = sender.documentId || 'frame-' + sender.frameId;
            if (grant.editorIdentity && grant.editorIdentity !== editorIdentity) throw Error('access_changed');
            grant.editorIdentity = editorIdentity;
            grant.editorFrameId = sender.frameId;
            grant.editorDocumentId = sender.documentId || null;
            if (!await authorize(grant.key, scope)) throw Error('access_changed');
            const name = draftKey(grant);
            if (action === prefix + 'Read') return { ok: true, record: await store.read(grant.key, scope), draft: drafts.get(name) || null };
            if (action === prefix + 'Draft') {
                if (!Number.isSafeInteger(request.sequence) || request.sequence < 0 || typeof request.text !== 'string') throw Error('draft_invalid');
                root.FilterTubeSavedVideoNotes.edit(grant.key, request.base, 'validation', request.text);
                if (!drafts.has(name) && drafts.size >= 256) throw Error('draft_capacity');
                if (request.sequence <= (grant.savedThrough ?? -1)) return { ok: true };
                const old = drafts.get(name);
                if (!old || old.editor !== grant.token || request.sequence > old.sequence) drafts.set(name,
                    { base: request.base === null ? null : root.FilterTubeSavedVideoNotes.record(request.base), text: request.text, sequence: request.sequence, editor: grant.token });
                return { ok: true };
            }
            if (action === prefix + 'Save') {
                if (!Number.isSafeInteger(request.sequence) || request.sequence < 0) throw Error('draft_invalid');
                const result = await store.save(grant.key, request.base, request.text, scope);
                const draft = drafts.get(name);
                if (result.saved) grant.savedThrough = Math.max(grant.savedThrough ?? -1, request.sequence);
                if (result.saved && draft?.editor === grant.token && draft.sequence === request.sequence) drafts.delete(name);
                return { ok: true, ...result };
            }
            if (action === prefix + 'DiscardDraft') { drafts.delete(name); return { ok: true }; }
            if (action === prefix + 'Position') return await parentMessage(grant, prefix + 'Position');
            if (action === prefix + 'Seek') {
                if (!Number.isFinite(request.seconds) || request.seconds < 0 || request.seconds > 86400) throw Error('seek_invalid');
                return await parentMessage(grant, prefix + 'Seek', { seconds: request.seconds });
            }
            if (action === prefix + 'Close') return await parentMessage(grant, prefix + 'Close');
            throw Error('notes_unavailable');
        }
        api.runtime.onMessage.addListener((request, sender, respond) => {
            if (typeof request?.action !== 'string' || !request.action.startsWith(prefix)
                || [prefix + 'Check'].includes(request.action)) return false;
            handle(request, sender).then(respond).catch(error => respond({ ok: false, error: ['profile_locked', 'access_changed'].includes(error?.message) ? error.message : 'notes_unavailable' }));
            return true;
        });
        api.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.ftProfilesV4) {
                grants.clear();
                const profiles = changes.ftProfilesV4.newValue?.profiles || {};
                for (const key of drafts.keys()) if (!Object.prototype.hasOwnProperty.call(profiles, JSON.parse(key)[1])) drafts.delete(key);
            }
        });
        api.tabs.onRemoved.addListener(tabId => {
            for (const [token, grant] of grants) if (grant.tabId === tabId) grants.delete(token);
            for (const key of drafts.keys()) if (JSON.parse(key)[0] === tabId) drafts.delete(key);
        });
        return Object.freeze({ handle });
    }
    root.FilterTubeVideoNotesBackground = Object.freeze({ install });
})(typeof globalThis !== 'undefined' ? globalThis : this);
