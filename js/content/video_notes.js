/* ISOLATED watch-details affordance. Personal text stays in an extension frame. */
(function (root) {
    'use strict';
    if (root.FilterTubeVideoNotes) return;
    const api = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;
    const bytes = new Uint8Array(18); crypto.getRandomValues(bytes);
    const instance = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    let host = null, panel = null, shadow = null, dialog = null, dismiss = null, button = null, frame = null, status = null, token = '', scope = '', opening = false, renewing = false, generation = 0;
    let closeUnavailable = false;
    function send(payload) {
        return new Promise(resolve => api.runtime.sendMessage(payload,
            value => resolve(api.runtime.lastError ? { ok: false } : value || { ok: false })));
    }
    function admitted() {
        const settings = root.currentSettings;
        const id = new URLSearchParams(location.search).get('v') || '';
        if (!['www.youtube.com', 'm.youtube.com'].includes(location.hostname) || location.pathname !== '/watch'
            || !/^[A-Za-z0-9_-]{11}$/.test(id) || !settings || settings.profileType !== 'main' || document.visibilityState === 'hidden'
            || typeof settings.activeProfileId !== 'string' || !settings.activeProfileId
            || !['account', 'child'].includes(settings.activeProfileKind)
            || (typeof isFilterTubeNativeOverlayQuietMode === 'function' && isFilterTubeNativeOverlayQuietMode())
            || document.documentElement?.hasAttribute('data-filtertube-native-overlay-covered') === true
            || document.documentElement?.hasAttribute('data-filtertube-native-fullscreen') === true
            || root.__filterTubeNativeOverlayCovered === true || root.__filterTubeNativeFullscreenActive === true
            || settings.managedViewingRouteGate?.allowMainViewing === false
            || root.__filtertubeManagedViewingRouteDenied === true || root.__filtertubeManagedTimeLimitTimedOut === true) return null;
        if (settings.enabled !== false) {
            if (settings.hideVideoInfo || settings.hideVideoButtonsBar) return null;
            const direct = root.__filtertubeDirectAccessState;
            if (!direct || direct.latestSettings !== settings || direct.videoId !== id || direct.decision !== 'allowed'
                || direct.pausedByGuard === true || direct.routeTransitionPending !== false || direct.pendingStartedAt > 0) return null;
            const category = root.__filtertubeCurrentWatchCategoryState;
            if (category?.pausedByGuard) return null;
            if (settings.categoryFilters?.enabled === true || settings.languageFilters?.enabled === true) {
                const meta = settings.videoMetaMap?.[id] || {};
                if (typeof getCategoryPolicyDecision !== 'function' || typeof getLanguagePolicyDecision !== 'function'
                    || !['allowed', 'inactive'].includes(getCategoryPolicyDecision(settings, meta.category))
                    || !['allowed', 'inactive'].includes(getLanguagePolicyDecision(settings, meta.languageCode))) return null;
            }
        }
        if (settings.managedTimeLimitPolicy && settings.managedTimeLimitPolicy.enabled !== false) {
            const permit = root.FilterTubeManagedPlaybackPermit?.read({ settings, videoId: id, href: location.href });
            if (permit?.decision !== 'allowed' || permit.profileId !== settings.activeProfileId || !Number.isFinite(permit.expiresAt) || permit.expiresAt <= Date.now()) return null;
        }
        return { profileId: settings.activeProfileId, videoId: id };
    }
    const sameScope = key => key && JSON.stringify(key) === scope;
    function close() {
        generation++; opening = false; renewing = false;
        const old = token; token = '';
        frame?.remove(); frame = null;
        if (dialog?.open) dialog.close();
        button?.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
        if (old) void send({ action: 'FilterTube_NotesRevoke', token: old, instance });
    }
    function remove() { close(); host?.remove(); panel?.remove(); host = null; panel = null; shadow = null; dialog = null; dismiss = null; button = null; scope = ''; }
    async function requestClose() {
        if (!frame) { close(); button?.focus(); return; }
        const attempt = generation, captured = token;
        const result = await send({ action: 'FilterTube_NotesRequestClose', token, instance });
        if (attempt !== generation || captured !== token) return;
        if (result.closeUnopened) { close(); button?.focus(); return; }
        if (!result.ok) {
            closeUnavailable = true; dismiss.hidden = false; dismiss.textContent = 'Close without saving';
            status.textContent = 'The editor is not responding. Try Close inside Notes, or close without saving. Unsaved changes may be lost; saved notes are kept.';
        }
    }
    async function open() {
        if (frame || opening || !sameScope(admitted())) return;
        const key = admitted(), attempt = ++generation;
        opening = true; panel.hidden = false; status.textContent = 'Opening personal notes…';
        closeUnavailable = false; dismiss.textContent = 'Close notes';
        dismiss.hidden = false; dialog.showModal(); button.setAttribute('aria-expanded', 'true');
        const result = await send({ action: 'FilterTube_NotesGrant', ...key, instance });
        if (attempt !== generation || !sameScope(admitted())) {
            if (result.token) void send({ action: 'FilterTube_NotesRevoke', token: result.token, instance });
            return;
        }
        opening = false;
        if (!result.ok) {
            status.textContent = result.error === 'profile_locked'
                ? 'Unlock your current profile in FilterTube, then open Notes again.'
                : result.error === 'access_changed'
                    ? 'Video or profile access changed. Try Notes again on an allowed video.'
                    : 'Could not connect to Notes. Reload this YouTube page after reloading FilterTube, then try again.';
            return;
        }
        token = result.token;
        frame = document.createElement('iframe');
        frame.title = 'FilterTube personal notes';
        frame.referrerPolicy = 'no-referrer';
        frame.src = api.runtime.getURL('html/video-notes.html') + '#key=' + encodeURIComponent(token);
        dialog.appendChild(frame); dismiss.hidden = true;
        status.textContent = ''; button.setAttribute('aria-expanded', 'true');
        frame.focus();
    }
    async function refresh() {
        const key = admitted();
        if (!key) { if (host) remove(); return; }
        const pane = document.querySelector('ytd-watch-metadata, ytm-slim-video-metadata-renderer, ytm-watch-metadata');
        const actions = pane?.querySelector('#actions .top-level-buttons, .slim-video-action-bar-actions');
        if (!pane || !actions) { if (host) remove(); return; }
        if (host && (!sameScope(key) || !panel.isConnected)) remove();
        if (!host) {
            scope = JSON.stringify(key);
            host = document.createElement('span');
            host.className = 'filtertube-notes-affordance';
            host.style.cssText = 'display:inline-flex;flex:none;margin-inline-start:8px;align-items:center';
            button = document.createElement('button'); button.type = 'button'; button.textContent = '✎ Notes';
            button.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 16px;border:0;border-radius:18px;font:500 14px Roboto,Arial,sans-serif;white-space:nowrap;cursor:pointer;color:var(--yt-spec-text-primary,inherit);background:var(--yt-spec-badge-chip-background,rgba(128,128,128,.16))';
            button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Open FilterTube personal notes');
            button.setAttribute('aria-haspopup', 'dialog');
            button.addEventListener('click', () => { if (!frame) void open(); else frame.focus(); });
            host.appendChild(button);
            // Only this public action is in YouTube's row. Personal text and the
            // editor capability stay inside the separate, closed extension dialog.
            panel = document.createElement('div'); panel.className = 'filtertube-notes-panel'; panel.hidden = true;
            shadow = panel.attachShadow({ mode: 'closed' });
            const style = document.createElement('style');
            style.textContent = ':host{color-scheme:light dark}:host([hidden]){display:none}dialog{position:fixed;inset:0;margin:auto;width:min(680px,calc(100vw - 24px));max-width:none;max-height:calc(100dvh - 32px);padding:0;border:1px solid light-dark(#d8c5bd,#79685f);border-radius:22px;background:light-dark(#fffaf7,#282320);color:light-dark(#302924,#f6ede7);box-shadow:0 18px 70px #0006;overflow:auto}dialog::backdrop{background:#0008}p{font:14px/1.5 system-ui;margin:0;padding:20px}p:empty{display:none}button{font:500 14px system-ui;color:inherit;background:transparent;border:1px solid #bda8a4;border-radius:22px;min-height:44px;padding:8px 18px;margin:0 20px 20px;cursor:pointer}button:focus-visible{outline:3px solid #b8574a;outline-offset:3px}[hidden]{display:none!important}iframe{display:block;width:100%;height:min(680px,calc(100dvh - 48px));min-height:280px;border:0;box-sizing:border-box}';
            dialog = document.createElement('dialog'); dialog.setAttribute('aria-label', 'FilterTube personal notes');
            dialog.addEventListener('cancel', event => { event.preventDefault(); void requestClose(); });
            status = document.createElement('p'); status.setAttribute('role', 'status');
            dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = 'Close notes';
            dismiss.addEventListener('click', () => { if (closeUnavailable) { close(); button?.focus(); } else void requestClose(); });
            dialog.append(status, dismiss); shadow.append(style, dialog);
        }
        // YouTube replaces the action container on navigation and layout changes.
        // Reattach the existing button without recreating or losing an open draft.
        if (host.parentNode !== actions) actions.appendChild(host);
        if (panel.parentNode !== document.documentElement) document.documentElement.appendChild(panel);
        if (token && frame && !renewing) {
            const captured = token, attempt = generation;
            renewing = true;
            const result = await send({ action: 'FilterTube_NotesGrant', ...key, instance, token: captured });
            if (attempt === generation) renewing = false;
            if (attempt === generation && token === captured && !result.ok) close();
        }
    }
    async function media(seconds) {
        const key = admitted();
        const attempt = generation, expectedScope = scope, capturedToken = token;
        const video = document.querySelector('#movie_player video.html5-main-video, ytm-watch video');
        const originalSource = video?.currentSrc || video?.src || '';
        if (!sameScope(key) || !capturedToken || !video || (seconds !== undefined && (!Number.isFinite(seconds) || seconds < 0))
            || !Number.isFinite(video.duration) || seconds > video.duration || video.ended) return false;
        const bytes = new Uint8Array(18); crypto.getRandomValues(bytes);
        const requestId = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        const state = await new Promise(resolve => {
            const finish = value => { clearTimeout(timer); root.removeEventListener('message', receive); resolve(value); };
            const receive = event => {
                const payload = event.data?.payload;
                if (event.source === root && event.origin === location.origin && event.data?.source === 'injector'
                    && event.data?.type === 'FilterTube_NativeContentState'
                    && payload?.requestId === requestId && payload.videoId === key.videoId) finish(payload);
            };
            const timer = setTimeout(() => finish(null), 1200);
            root.addEventListener('message', receive);
            root.postMessage({ type: 'FilterTube_ReadNativeContentState', source: 'content_bridge',
                payload: { requestId, videoId: key.videoId } }, location.origin);
        });
        if (attempt !== generation || expectedScope !== scope || !sameScope(admitted()) || state?.videoIdMatched !== true
            || state.preferences?.nativeVideoId !== key.videoId || state.preferences?.nativeAdInactive !== true
            || document.querySelector('#movie_player video.html5-main-video, ytm-watch video') !== video
            || !Number.isFinite(video.duration) || seconds > video.duration
            || document.querySelector('.html5-video-player.ad-showing, .html5-video-player.ad-interrupting')) return false;
        const permission = await send({ action: 'FilterTube_NotesGrant', ...key, instance, token: capturedToken });
        if (!permission.ok || permission.token !== capturedToken || attempt !== generation || expectedScope !== scope
            || !sameScope(admitted()) || document.querySelector('#movie_player video.html5-main-video, ytm-watch video') !== video
            || (video.currentSrc || video.src || '') !== originalSource || video.readyState < 2 || video.ended
            || !Number.isFinite(video.duration) || seconds > video.duration
            || document.querySelector('.html5-video-player.ad-showing, .html5-video-player.ad-interrupting')) return false;
        if (seconds === undefined) return Number.isFinite(video.currentTime) && video.currentTime >= 0 && video.currentTime <= video.duration
            ? { seconds: Math.floor(video.currentTime), duration: video.duration } : false;
        video.currentTime = seconds;
        return true;
    }
    const seek = seconds => media(seconds);
    api.runtime.onMessage.addListener((request, _sender, respond) => {
        if (!['FilterTube_NotesCheck', 'FilterTube_NotesSeek', 'FilterTube_NotesPosition', 'FilterTube_NotesClose'].includes(request?.action)) return false;
        if (request.instance !== instance) return false;
        if ((!opening && request.token !== token) || !sameScope(admitted())) {
            respond({ allowed: false }); return false;
        }
        const key = admitted();
        if (request.action === 'FilterTube_NotesPosition') {
            media().then(value => respond(value ? { ok: true, ...value } : { ok: false })).catch(() => respond({ ok: false }));
            return true;
        }
        if (request.action === 'FilterTube_NotesSeek') {
            seek(request.seconds).then(ok => respond({ ok })).catch(() => respond({ ok: false }));
            return true;
        }
        if (request.action === 'FilterTube_NotesClose') { close(); button?.focus(); respond({ ok: true }); return false; }
        respond({ allowed: true, ...key }); return false;
    });
    document.addEventListener('yt-navigate-start', remove, true);
    document.addEventListener('yt-navigate-finish', () => { void refresh(); }, true);
    root.addEventListener('pagehide', remove);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') remove(); else void refresh(); });
    setInterval(() => { void refresh(); }, 750);
    root.FilterTubeVideoNotes = Object.freeze({ refresh });
})(typeof window !== 'undefined' ? window : globalThis);
