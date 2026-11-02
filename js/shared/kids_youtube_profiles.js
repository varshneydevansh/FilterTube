/* YouTube Kids profiles: the parent's kid profiles on youtubekids.com and FilterTube's links to them.
 * Same rules and stored shape as the Android app (FilterTubeApp docs/app/KIDS_YT_PROFILES_PICKER.md).
 * Raw profile ids and tokens never leave the youtubekids.com page: the page functions below run there
 * and return only an app-scoped key, sha256("filtertube-kids-persona-v1:" + id). */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FilterTubeKidsYouTubeProfiles = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const LINKS_KEY = 'kidsPersonaLinks';
    const SELECTION_STORAGE_KEY = 'yt.identity.kids::childprofile';
    const KEY_PATTERN = /^sha256:[0-9a-f]{64}$/;
    const DELEGATION_NONE = 'GAIA_DELEGATION_TYPE_NONE';
    const DELEGATION_EARLY = 'GAIA_DELEGATION_TYPE_EARLY';
    const SERVICE_PERSONA = 'REGISTERED_GAIA_SERVICES_IS_YOUTUBE_PERSONA';
    const SERVICE_SUPERVISED_CHILD = 'REGISTERED_GAIA_SERVICES_IS_UNICORN_CHILD_ACCOUNT';
    const MAX_PROFILES = 16;
    const MAX_AGE_YEARS = 25;
    const MAX_NAME = 120;
    const PARENT_PREFIX = 'filtertube-kids-parent-v1:';
    const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    const REDIRECT_URI = 'https://www.youtubekids.com/signin?gaia_popup_redirect=1';
    const own = (value, key) => !!value && Object.prototype.hasOwnProperty.call(value, key);
    const text = value => typeof value === 'string' ? value.trim() : '';

    function personaKey(value) {
        const key = text(value).toLowerCase();
        return KEY_PATTERN.test(key) ? key : null;
    }

    // ---- Links: profilesV4.kidsPersonaLinks = { schemaVersion: 1, links: [...] } ----

    function emptyLinks() { return { schemaVersion: 1, links: [] }; }
    /** Valid, de-duplicated links. Only the key, the kid's name and the link time are kept. */
    function normalizeLinks(value) {
        const rows = Array.isArray(value?.links) ? value.links : [];
        const seen = new Set(), links = [];
        for (const row of rows) {
            const profileId = text(row?.profileId);
            const key = personaKey(row?.personaKey);
            const displayName = text(row?.displayName).slice(0, MAX_NAME);
            if (!profileId || profileId.length > 1024 || !key || !displayName || seen.has(profileId)) continue;
            const linkedAtMillis = Number.isSafeInteger(row?.linkedAtMillis) && row.linkedAtMillis >= 0 ? row.linkedAtMillis : 0;
            seen.add(profileId);
            const link = { profileId, personaKey: key, displayName, linkedAtMillis };
            // The parent Google account is remembered as a key and a display name, never an e-mail.
            const parentKey = personaKey(row?.parentKey);
            const parentName = text(row?.parentName).slice(0, MAX_NAME);
            if (parentKey && parentName) { link.parentKey = parentKey; link.parentName = parentName; }
            links.push(link);
        }
        return { schemaVersion: 1, links };
    }
    function linkFor(links, profileId) {
        return normalizeLinks(links).links.find(link => link.profileId === profileId) || null;
    }
    function withLink(links, { profileId, personaKey: key, displayName, linkedAtMillis = Date.now(), parentKey = null, parentName = null }) {
        const next = normalizeLinks(links).links.filter(link => link.profileId !== profileId);
        next.push({ profileId, personaKey: key, displayName, linkedAtMillis, ...(parentKey && parentName ? { parentKey, parentName } : {}) });
        const result = normalizeLinks({ links: next });
        if (!result.links.some(link => link.profileId === profileId)) throw new Error('Invalid YouTube Kids profile link');
        return result;
    }
    function unlink(links, profileId) {
        return { schemaVersion: 1, links: normalizeLinks(links).links.filter(link => link.profileId !== profileId) };
    }
    function retaining(links, profileIds) {
        const ids = new Set(profileIds);
        return { schemaVersion: 1, links: normalizeLinks(links).links.filter(link => ids.has(link.profileId)) };
    }
    /** Device sync: incoming links re-homed through the import mapping; the newer link wins per profile. */
    function adopt(local, incoming, mapping, profileIds) {
        const result = new Map(retaining(local, profileIds).links.map(link => [link.profileId, link]));
        const ids = new Set(profileIds);
        for (const link of normalizeLinks(incoming).links) {
            if (!own(mapping, link.profileId)) continue;
            const profileId = mapping[link.profileId];
            if (!ids.has(profileId)) continue;
            const current = result.get(profileId);
            if (!current || link.linkedAtMillis > current.linkedAtMillis) result.set(profileId, { ...link, profileId });
        }
        return normalizeLinks({ links: [...result.values()] });
    }

    // ---- Who may change what (same as Android's KidsYouTubeProfileLinkGate) ----

    function profileType(profilesV4, profileId) {
        const profile = profilesV4?.profiles?.[profileId];
        if (!profile) return null;
        if (profileId === 'default') return 'account';
        return profile.type === 'child' || (profile.type !== 'account' && profile.parentProfileId) ? 'child' : 'account';
    }
    function canManage(profilesV4, actorId, targetId) {
        if (!profilesV4?.profiles?.[actorId] || !profilesV4?.profiles?.[targetId]) return false;
        if (profileType(profilesV4, actorId) === 'child') return false;
        return actorId === 'default' || actorId === targetId || text(profilesV4.profiles[targetId].parentProfileId) === actorId;
    }
    /** 'allowed', 'child' (refused inside a child, even with a PIN) or 'not_managed'. */
    function linkDecision(profilesV4, actorId, targetId) {
        if (profileType(profilesV4, actorId) === 'child') return 'child';
        return canManage(profilesV4, actorId, targetId) ? 'allowed' : 'not_managed';
    }
    /** Choosing who's watching from FilterTube: never away from a link, and never from inside a child. */
    function switchDecision(profilesV4, links, actorId, targetKey) {
        const link = linkFor(links, actorId);
        if (link) return link.personaKey === targetKey ? 'allowed' : 'linked';
        return profileType(profilesV4, actorId) === 'child' ? 'child' : 'allowed';
    }

    // ---- Parent accounts (Google accounts only; same rules as Android §8) ----

    function normalizedEmail(value) {
        const email = text(value).toLowerCase();
        return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
    }
    /** Changing the parent is a parent action; inside a child the row is managed by a parent. */
    function parentChangeDecision(profilesV4, actorId) {
        return profileType(profilesV4, actorId) === 'child' ? 'child' : 'allowed';
    }
    /** Whether the active profile's link names a parent other than the current one. */
    function linkedParentDecision(links, actorId, currentParentKey) {
        const link = linkFor(links, actorId);
        if (!link?.parentKey) return 'no_parent_in_link';
        return link.parentKey === currentParentKey ? 'current' : 'switch_needed';
    }
    /** YouTube Kids' own parent sign-in request, plus login_hint when the account is known. */
    function oauthUrl({ clientId, scope, state, loginHint = null }) {
        const id = text(clientId);
        const scopes = text(scope).split(/\s+/).filter(Boolean);
        if (!/^[A-Za-z0-9._-]{8,256}$/.test(id) || !scopes.length || scopes.length > 16
            || scopes.some(item => !/^[A-Za-z0-9._:\/-]{1,256}$/.test(item)) || !/^[0-9a-f]{32}$/.test(text(state))) return null;
        const hint = normalizedEmail(loginHint);
        const params = [['client_id', id], ['response_type', 'none gsession'], ['access_type', 'offline'],
            ['scope', scopes.join(' ')], ['redirect_uri', REDIRECT_URI], ['state', text(state)],
            hint ? ['login_hint', hint] : ['prompt', 'select_account'], ['pageId', 'none']];
        return AUTH_URL + '?' + params.map(([name, value]) => name + '=' + encodeURIComponent(value)).join('&');
    }
    /** SWITCHED, UNCHANGED, OTHER_ACCOUNT or SIGNED_OUT, checked against the roster after the sign-in. */
    function parentSwitchOutcome({ targetKey = null, beforeKey = null, afterSignedIn, afterKey = null }) {
        if (!afterSignedIn || !afterKey) return 'SIGNED_OUT';
        if (targetKey && afterKey === targetKey) return 'SWITCHED';
        if (beforeKey && afterKey === beforeKey) return 'UNCHANGED';
        return targetKey ? 'OTHER_ACCOUNT' : 'SWITCHED';
    }
    function isSignInReturn(url) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' && ['www.youtubekids.com', 'youtubekids.com'].includes(parsed.hostname)
                && parsed.pathname === '/signin' && parsed.searchParams.has('gaia_popup_redirect');
        } catch (_) { return false; }
    }
    function isSignInRejected(url) {
        try { const parsed = new URL(url); return /(^|\.)youtubekids\.com$/.test(parsed.hostname) && parsed.pathname === '/signin/rejected'; }
        catch (_) { return false; }
    }

    // ---- Roster: token-free rows from the page, classified with YouTube Kids' own rules ----

    function typeOf(row) {
        if (row.delegationType === DELEGATION_NONE || !row.delegationType) return null;
        if (row.services.includes(SERVICE_PERSONA)) return 0;
        if (row.services.includes(SERVICE_SUPERVISED_CHILD) && row.delegationType === DELEGATION_EARLY) return 1;
        return null;
    }
    function classify(rawRows) {
        const rows = (Array.isArray(rawRows) ? rawRows : []).slice(0, 64).map(row => ({
            personaKey: personaKey(row?.personaKey),
            displayName: text(row?.displayName).slice(0, MAX_NAME),
            avatarUrl: text(row?.avatarUrl).startsWith('https://') ? text(row.avatarUrl) : null,
            delegationType: text(row?.delegationType),
            services: Array.isArray(row?.services) ? row.services.slice(0, 32).map(text).filter(Boolean) : [],
            supervisedAccessAllowed: typeof row?.supervisedAccessAllowed === 'boolean' ? row.supervisedAccessAllowed : null,
            selected: row?.selected === true,
            ageYears: Number.isInteger(row?.ageYears) ? row.ageYears : null
        })).filter(row => row.displayName);
        let hiddenForOnboarding = 0, hasParent = false;
        const seen = new Set(), profiles = [];
        for (const row of rows) {
            if (row.delegationType === DELEGATION_NONE) { hasParent = true; continue; }
            const type = typeOf(row);
            if (type === null || !row.personaKey) continue;
            if (row.supervisedAccessAllowed === false) { hiddenForOnboarding++; continue; }
            if (profiles.length >= MAX_PROFILES || seen.has(row.personaKey)) continue;
            seen.add(row.personaKey);
            profiles.push({
                personaKey: row.personaKey, displayName: row.displayName, avatarUrl: row.avatarUrl, profileType: type,
                // A second selected row would be a provider inconsistency: keep the first.
                selected: row.selected && !profiles.some(profile => profile.selected),
                ageYears: type === 0 && row.ageYears !== null && row.ageYears >= 0 && row.ageYears <= MAX_AGE_YEARS ? row.ageYears : null
            });
        }
        return { hasParent, profiles, hiddenForOnboarding };
    }

    // ---- Page functions (injected into youtubekids.com; each must stay self-contained) ----

    /** Reads the parent's account items and returns token-free rows. The parent token stays in the page. */
    async function pageRoster(maxAgeLookups) {
        const STORAGE_KEY = 'yt.identity.kids::childprofile';
        const config = key => { try { const c = window.ytcfg; return c && typeof c.get === 'function' ? c.get(key) : (c && (c.data_ || c.data) || {})[key]; } catch (_) { return undefined; } };
        const digest = async id => { const bytes = new TextEncoder().encode('filtertube-kids-persona-v1:' + id); const hash = await crypto.subtle.digest('SHA-256', bytes); return 'sha256:' + Array.from(new Uint8Array(hash)).map(v => v.toString(16).padStart(2, '0')).join(''); };
        const label = value => Array.isArray(value?.runs) ? value.runs.map(run => String(run?.text || '')).join('').trim() : String(value?.simpleText || '').trim();
        const tokensOf = item => { const tokens = item?.serviceEndpoint?.selectActiveIdentityEndpoint?.supportedTokens; return Array.isArray(tokens) ? tokens : []; };
        const rawIdOf = item => { let state = null, persona = null; tokensOf(item).forEach(t => { if (t?.accountStateToken && !state) state = t.accountStateToken; if (t?.personaIdToken && !persona) persona = t.personaIdToken; }); return String(state?.obfuscatedGaiaId || persona?.personaId || '').trim(); };
        const walk = (value, visit) => { if (!value || typeof value !== 'object') return; if (value.accountItem) visit(value.accountItem); Object.keys(value).forEach(key => walk(value[key], visit)); };
        const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
        if (!config('LOGGED_IN')) return { status: 'signed_out', signedIn: false, rows: [] };
        let token = '';
        try {
            const tokenResponse = await fetch('/get_access_token', { method: 'GET', credentials: 'include' });
            if (!tokenResponse.ok) return { status: 'token_unavailable', signedIn: true, rows: [] };
            token = String(JSON.parse((await tokenResponse.text()).replace(/^\)\]\}'\s*/, '').trim())?.accessToken || '').trim();
            if (!token) return { status: 'token_unavailable', signedIn: true, rows: [] };
            const response = await fetch('/youtubei/v1/account/accounts_list?alt=json', { method: 'POST', credentials: 'include',
                headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
                body: JSON.stringify({ context: config('INNERTUBE_CONTEXT') || {} }) });
            if (!response.ok) return { status: 'accounts_unavailable', signedIn: true, rows: [] };
            const data = await response.json();
            let stored = {};
            try { stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { stored = {}; }
            const selectedId = String(stored.profileId || config('PROFILE_ID') || '').trim();
            const items = []; walk(data, item => items.push(item));
            const rows = [];
            let lookups = 0, parent = null;
            for (const item of items.slice(0, 64)) {
                const identity = item.identity || {};
                const rawId = rawIdOf(item);
                const services = Array.isArray(identity.registeredGaiaServices) ? identity.registeredGaiaServices.map(String) : [];
                const delegationType = String(identity.gaiaDelegationType || '');
                const thumbs = item.accountPhoto?.thumbnails;
                if (!parent && delegationType === 'GAIA_DELEGATION_TYPE_NONE') {
                    const email = label(item.accountByline).toLowerCase();
                    const parentBytes = new TextEncoder().encode('filtertube-kids-parent-v1:' + email);
                    const parentHash = await crypto.subtle.digest('SHA-256', parentBytes);
                    // The e-mail is returned for display only; FilterTube stores the key and the name.
                    parent = { displayName: label(item.accountName), email: /@/.test(email) ? email : '',
                        avatarUrl: Array.isArray(item.accountPhoto?.thumbnails) && item.accountPhoto.thumbnails.length ? String(item.accountPhoto.thumbnails[item.accountPhoto.thumbnails.length - 1].url || '') : '',
                        parentKey: /@/.test(email) ? 'sha256:' + Array.from(new Uint8Array(parentHash)).map(v => v.toString(16).padStart(2, '0')).join('') : '' };
                }
                const row = { displayName: label(item.accountName), delegationType, services,
                    avatarUrl: Array.isArray(thumbs) && thumbs.length ? String(thumbs[thumbs.length - 1].url || '') : '',
                    selected: !!rawId && rawId === selectedId,
                    personaKey: rawId ? await digest(rawId) : '' };
                if (typeof item.kidsSupervisedAccountAccessAllowed === 'boolean') row.supervisedAccessAllowed = item.kidsSupervisedAccountAccessAllowed;
                const persona = delegationType && delegationType !== 'GAIA_DELEGATION_TYPE_NONE' && services.includes('REGISTERED_GAIA_SERVICES_IS_YOUTUBE_PERSONA');
                if (persona && rawId && lookups < maxAgeLookups) {
                    lookups++;
                    try {
                        const ageResponse = await withTimeout(fetch('/youtubei/v1/account/get_persona?alt=json', { method: 'POST', credentials: 'include',
                            headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
                            body: JSON.stringify({ context: config('INNERTUBE_CONTEXT') || {}, obfuscatedPersonaId: rawId }) }), 4000);
                        const age = ageResponse.ok ? (await ageResponse.json())?.persona?.approximateAge?.age : undefined;
                        if (Number.isInteger(age)) row.ageYears = age;
                    } catch (_) { /* The age is optional. */ }
                }
                rows.push(row);
            }
            return { status: 'ok', signedIn: true, rows, parent };
        } catch (_) {
            return { status: 'failed', signedIn: true, rows: [] };
        } finally {
            token = '';
        }
    }

    /** Selects the kid whose key matches, the way youtubekids.com does: its stored selection plus a reload. */
    async function pageActivate(targetKey) {
        const STORAGE_KEY = 'yt.identity.kids::childprofile';
        const config = key => { try { const c = window.ytcfg; return c && typeof c.get === 'function' ? c.get(key) : (c && (c.data_ || c.data) || {})[key]; } catch (_) { return undefined; } };
        const digest = async id => { const bytes = new TextEncoder().encode('filtertube-kids-persona-v1:' + id); const hash = await crypto.subtle.digest('SHA-256', bytes); return 'sha256:' + Array.from(new Uint8Array(hash)).map(v => v.toString(16).padStart(2, '0')).join(''); };
        const tokensOf = item => { const tokens = item?.serviceEndpoint?.selectActiveIdentityEndpoint?.supportedTokens; return Array.isArray(tokens) ? tokens : []; };
        const rawIdOf = item => { let state = null, persona = null; tokensOf(item).forEach(t => { if (t?.accountStateToken && !state) state = t.accountStateToken; if (t?.personaIdToken && !persona) persona = t.personaIdToken; }); return String(state?.obfuscatedGaiaId || persona?.personaId || '').trim(); };
        const walk = (value, visit) => { if (!value || typeof value !== 'object') return; if (value.accountItem) visit(value.accountItem); Object.keys(value).forEach(key => walk(value[key], visit)); };
        if (!config('LOGGED_IN')) return { status: 'signed_out' };
        let stored = {};
        try { stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { stored = {}; }
        const current = String(stored.profileId || '').trim();
        if (current && await digest(current) === targetKey) return { status: 'already_selected' };
        let token = '';
        try {
            const tokenResponse = await fetch('/get_access_token', { method: 'GET', credentials: 'include' });
            if (!tokenResponse.ok) return { status: 'token_unavailable' };
            token = String(JSON.parse((await tokenResponse.text()).replace(/^\)\]\}'\s*/, '').trim())?.accessToken || '').trim();
            if (!token) return { status: 'token_unavailable' };
            const response = await fetch('/youtubei/v1/account/accounts_list?alt=json', { method: 'POST', credentials: 'include',
                headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
                body: JSON.stringify({ context: config('INNERTUBE_CONTEXT') || {} }) });
            if (!response.ok) return { status: 'accounts_unavailable' };
            const items = []; walk(await response.json(), item => items.push(item));
            for (const item of items) {
                const rawId = rawIdOf(item);
                if (!rawId || await digest(rawId) !== targetKey) continue;
                const identity = item.identity || {};
                const services = Array.isArray(identity.registeredGaiaServices) ? identity.registeredGaiaServices.map(String) : [];
                const delegation = String(identity.gaiaDelegationType || '');
                if (item.kidsSupervisedAccountAccessAllowed === false) return { status: 'persona_unavailable' };
                const profileType = services.includes('REGISTERED_GAIA_SERVICES_IS_YOUTUBE_PERSONA') ? 0
                    : (services.includes('REGISTERED_GAIA_SERVICES_IS_UNICORN_CHILD_ACCOUNT') && delegation === 'GAIA_DELEGATION_TYPE_EARLY') ? 1 : null;
                if (profileType === null) return { status: 'persona_unavailable' };
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profileId: rawId, profileType }));
                setTimeout(() => window.location.assign('/'), 0);
                return { status: 'activation_started' };
            }
            return { status: 'persona_unavailable' };
        } catch (_) {
            return { status: 'failed' };
        } finally {
            token = '';
        }
    }

    /** Before the parent sign-in: reads the page's OAuth settings and adds a fresh state to its own expiring list. */
    function pagePrepareParentSignIn() {
        const XSRF_KEY = 'yt.identity.kids::popup-xsrf';
        try {
            if (window.location.hostname !== 'www.youtubekids.com') return { status: 'untrusted_origin' };
            const config = key => { try { const c = window.ytcfg; return c && typeof c.get === 'function' ? c.get(key) : (c && (c.data_ || c.data) || {})[key]; } catch (_) { return undefined; } };
            const clientId = String(config('OAUTH_CLIENT_ID') || '').trim();
            const scope = String(config('OAUTH_CLIENT_SCOPE') || '').trim();
            if (!clientId || !scope) return { status: 'config_unavailable' };
            const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
            const state = Array.from(bytes).map(v => v.toString(16).padStart(2, '0')).join('');
            let list = [];
            try {
                const wrapper = JSON.parse(window.localStorage.getItem(XSRF_KEY) || 'null');
                const data = wrapper && wrapper.data;
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (Array.isArray(parsed) && !(wrapper.expiration && wrapper.expiration < Date.now())) list = parsed.map(String);
            } catch (_) { list = []; }
            if (list.length > 5) list.shift();
            list.push(state);
            const now = Date.now();
            window.localStorage.setItem(XSRF_KEY, JSON.stringify({ data: JSON.stringify(list), expiration: now + 864E5, creation: now }));
            return { status: 'ready', clientId, scope, state };
        } catch (_) {
            return { status: 'failed' };
        }
    }
    /** On the return page: 'pending' until the page has checked the state, then 'consumed_version' or 'consumed'. */
    function pageParentReturnStatus(state) {
        try {
            const wrapper = JSON.parse(window.localStorage.getItem('yt.identity.kids::popup-xsrf') || 'null');
            const data = wrapper && wrapper.data;
            const list = typeof data === 'string' ? JSON.parse(data) : data;
            if (Array.isArray(list) && list.indexOf(state) >= 0) return 'pending';
            return window.localStorage.getItem('yt.identity.kids::versioninfo') ? 'consumed_version' : 'consumed';
        } catch (_) { return 'unknown'; }
    }
    /** After a parent change: the stored kid belonged to the old parent. Only the selection key is removed. */
    function pageClearSelection() {
        try { window.localStorage.removeItem('yt.identity.kids::childprofile'); return 'cleared'; } catch (_) { return 'failed'; }
    }

    return Object.freeze({ LINKS_KEY, SELECTION_STORAGE_KEY, MAX_PROFILES, REDIRECT_URI,
        normalizedEmail, parentChangeDecision, linkedParentDecision, oauthUrl, parentSwitchOutcome, isSignInReturn, isSignInRejected,
        pagePrepareParentSignIn, pageParentReturnStatus, pageClearSelection,
        personaKey, emptyLinks, normalizeLinks, linkFor, withLink, unlink, retaining, adopt,
        profileType, canManage, linkDecision, switchDecision, classify, pageRoster, pageActivate });
}));
