/* FilterTube admission guard for Google-owned YouTube playback. */
(function installFilterTubeExternalYouTubeGuard(root) {
    'use strict';
    if (!root || root.__filtertubeExternalYouTubeGuardInstalled) return;
    root.__filtertubeExternalYouTubeGuardInstalled = true;

    const runtimeAPI = globalThis.browser || globalThis.chrome;
    const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
    const YOUTUBE_HOST_PATTERN = /(^|\.)(youtube\.com|youtube-nocookie\.com)$/i;
    const YOUTUBE_THUMBNAIL_HOST_PATTERN = /(^|\.)(ytimg\.com|ggpht\.com)$/i;
    const METADATA_TIMEOUT_MS = 6000;
    let currentSettings = null;
    let currentVideoId = '';
    let settingsRefreshTimer = 0;
    let pendingStartedAt = 0;
    let pendingTimer = 0;
    const metadataByVideoId = new Map();
    const guardedMedia = new Set();
    const resumeAuthority = new WeakSet();
    let lastPolicySignature = '';
    function policySignature() {
        return JSON.stringify(['enabled', 'listMode', 'blockedVideoIds', 'allowedVideoIds',
            'filterChannels', 'whitelistChannels', 'filterKeywords', 'whitelistKeywords',
            'contentFilters', 'categoryFilters', 'languageFilters', 'channelMap']
            .map(key => currentSettings?.[key] ?? null));
    }

    function publishControlState(active) {
        const revision = policySignature();
        if (revision === lastPolicySignature) return;
        lastPolicySignature = revision;
        try {
            root.postMessage({
                type: 'FilterTube_ExternalYouTubeAdmissionControl',
                source: 'filtertube-external-guard',
                active: active === true,
                revision
            }, '*');
        } catch (e) {}
    }

    function publishDecision(videoId, decision) {
        if (!VIDEO_ID_PATTERN.test(String(videoId || ''))) return;
        try {
            root.postMessage({
                type: 'FilterTube_ExternalYouTubeAdmissionDecision',
                source: 'filtertube-external-guard',
                videoId,
                decision
            }, '*');
        } catch (e) {}
    }

    function safeUrl(raw, base = root.location?.href || 'https://www.google.com/') {
        try { return new URL(String(raw || ''), base); } catch (e) { return null; }
    }

    function canonicalCandidate(videoId, kind = 'watch', sourceUrl = null) {
        if (!VIDEO_ID_PATTERN.test(String(videoId || ''))) return null;
        const source = sourceUrl instanceof URL ? sourceUrl : null;
        const destination = new URL(kind === 'shorts'
            ? `https://www.youtube.com/shorts/${videoId}`
            : `https://www.youtube.com/watch?v=${videoId}`);
        if (source) {
            for (const key of ['list', 't', 'start']) {
                const value = source.searchParams.get(key);
                if (value && value.length <= 160) destination.searchParams.set(key, value);
            }
        }
        return { videoId, canonicalUrl: destination.href };
    }

    function extractGooglePlayerVideoId(rawUrl) {
        const url = safeUrl(rawUrl);
        if (!url) return '';
        let hash = url.hash || '';
        try { hash = decodeURIComponent(hash); } catch (e) {}
        return hash.match(/(?:^|[,:;&])vid[:=]([A-Za-z0-9_-]{11})(?=$|[,:;&])/i)?.[1] || '';
    }

    function extractYouTubeCandidate(rawUrl, depth = 0) {
        if (depth > 3) return null;
        const googleVideoId = extractGooglePlayerVideoId(rawUrl);
        if (googleVideoId) return canonicalCandidate(googleVideoId);
        const url = safeUrl(rawUrl);
        if (!url) return null;
        const host = String(url.hostname || '').toLowerCase();
        if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
            return canonicalCandidate(url.pathname.split('/').filter(Boolean)[0] || '', 'watch', url);
        }
        if (YOUTUBE_HOST_PATTERN.test(host)) {
            if (url.pathname === '/watch' || url.pathname.startsWith('/watch/')) {
                return canonicalCandidate(url.searchParams.get('v') || '', 'watch', url);
            }
            const shorts = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (shorts) return canonicalCandidate(shorts[1], 'shorts', url);
            const embed = url.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (embed) return canonicalCandidate(embed[1], 'watch', url);
        }
        if (YOUTUBE_THUMBNAIL_HOST_PATTERN.test(host)) {
            const thumbnail = url.pathname.match(/\/(?:vi|vi_webp)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (thumbnail) return canonicalCandidate(thumbnail[1]);
        }
        for (const key of ['q', 'url', 'imgurl', 'mediaurl']) {
            const nested = url.searchParams.get(key);
            if (!nested || nested === rawUrl) continue;
            const candidate = extractYouTubeCandidate(nested, depth + 1);
            if (candidate) return candidate;
        }
        return null;
    }

    const hasEntries = value => Array.isArray(value) && value.length > 0;

    function hasActiveVideoAdmissionRules(settings) {
        if (!settings || typeof settings !== 'object' || settings.enabled === false) return false;
        const content = settings.contentFilters && typeof settings.contentFilters === 'object' ? settings.contentFilters : {};
        return Boolean(
            settings.listMode === 'whitelist' ||
            hasEntries(settings.blockedVideoIds) || hasEntries(settings.allowedVideoIds) ||
            hasEntries(settings.filterChannels) || hasEntries(settings.whitelistChannels) ||
            hasEntries(settings.filterKeywords) || hasEntries(settings.whitelistKeywords) ||
            content.duration?.enabled === true || content.uploadDate?.enabled === true || content.uppercase?.enabled === true ||
            (settings.categoryFilters?.enabled === true && hasEntries(settings.categoryFilters.selected)) ||
            (settings.languageFilters?.enabled === true && hasEntries(settings.languageFilters.selected))
        );
    }

    function sendRuntimeMessage(message) {
        return new Promise(resolve => {
            let settled = false;
            const finish = value => { if (!settled) { settled = true; resolve(value || null); } };
            try {
                if (globalThis.browser?.runtime?.sendMessage) {
                    const result = globalThis.browser.runtime.sendMessage(message);
                    result?.then ? result.then(finish).catch(() => finish(null)) : finish(result);
                } else if (globalThis.chrome?.runtime?.sendMessage) globalThis.chrome.runtime.sendMessage(message, finish);
                else finish(null);
            } catch (e) { finish(null); }
        });
    }

    async function refreshSettings() {
        const response = await sendRuntimeMessage({ action: 'getCompiledSettings', profileType: 'main' });
        const settings = response?.settings && typeof response.settings === 'object' ? response.settings : response;
        if (settings && typeof settings === 'object' && !settings.error) currentSettings = settings;
        reconcileGuardState();
        return currentSettings;
    }

    function scheduleSettingsRefresh() {
        if (settingsRefreshTimer) clearTimeout(settingsRefreshTimer);
        settingsRefreshTimer = setTimeout(() => { settingsRefreshTimer = 0; refreshSettings(); }, 100);
    }

    function elementFromTarget(target) {
        return target?.nodeType === 1 ? target : target?.parentElement || null;
    }

    function candidateFromElement(target) {
        let element = elementFromTarget(target);
        for (let depth = 0; element && depth < 8; depth += 1, element = element.parentElement) {
            for (const value of [
                element.getAttribute?.('href') || element.href || '',
                element.getAttribute?.('poster') || element.poster || '',
                element.getAttribute?.('src') || element.src || ''
            ]) {
                const candidate = extractYouTubeCandidate(String(value || ''));
                if (candidate) return candidate;
            }
            try {
                for (const nested of element.querySelectorAll?.('a[href], video[poster], img[src]') || []) {
                    const candidate = extractYouTubeCandidate(nested.getAttribute('href') || nested.getAttribute('poster') || nested.getAttribute('src') || '');
                    if (candidate) return candidate;
                }
            } catch (e) {}
        }
        return null;
    }

    function setCurrentCandidate(candidate) {
        if (!candidate?.videoId) return;
        if (currentVideoId !== candidate.videoId) {
            currentVideoId = candidate.videoId;
            pendingStartedAt = Date.now();
            clearTimeout(pendingTimer);
            pendingTimer = 0;
        }
    }

    function currentCandidate(target = null) {
        return candidateFromElement(target)
            || extractYouTubeCandidate(root.location?.href || '')
            || (currentVideoId ? canonicalCandidate(currentVideoId) : null);
    }

    function compileKeywords(entries) {
        const compiled = [];
        for (const entry of Array.isArray(entries) ? entries : []) {
            try {
                if (entry instanceof RegExp) compiled.push({ regex: entry, entry });
                else if (entry?.pattern) compiled.push({ regex: new RegExp(entry.pattern, entry.flags || 'i'), entry });
                else if (typeof entry === 'string' && entry.trim()) {
                    const escaped = entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    compiled.push({ regex: new RegExp(escaped, 'i'), entry });
                }
            } catch (e) {}
        }
        return compiled;
    }

    function dateFilterAllows(entry, metadata) {
        const filter = entry?.dateFilter || entry?.__filtertubeDateFilter;
        if (filter?.enabled !== true) return true;
        const published = new Date(metadata.publishDate || metadata.uploadDate || '').getTime();
        if (!Number.isFinite(published)) return null;
        const from = filter.fromDate ? new Date(filter.fromDate).getTime() : NaN;
        const to = filter.toDate ? new Date(`${filter.toDate}T23:59:59.999`).getTime() : NaN;
        if (filter.condition === 'before') return Number.isFinite(to) && published <= to;
        if (filter.condition === 'between') return (!Number.isFinite(from) || published >= from) && (!Number.isFinite(to) || published <= to);
        return Number.isFinite(from) && published >= from;
    }

    function keywordMatch(entries, textFields, metadata, includeOwner = false) {
        const fields = includeOwner
            ? [...textFields, { label: 'channel identity', text: metadata.channelName || metadata.channelHandle || metadata.channelId || '' }]
            : textFields;
        for (const { regex, entry } of compileKeywords(entries)) {
            const dateAllowed = dateFilterAllows(entry, metadata);
            if (dateAllowed === null) return { pending: true };
            if (!dateAllowed) continue;
            for (const field of fields) {
                regex.lastIndex = 0;
                if (field.text && regex.test(field.text)) return { matched: true, pattern: regex.source, source: field.label };
            }
        }
        return { matched: false };
    }

    function channelMatch(entries, metadata, settings) {
        if (!hasEntries(entries)) return false;
        const channelMeta = { id: metadata.channelId || '', name: metadata.channelName || '', handle: metadata.channelHandle || '', customUrl: '' };
        try {
            return root.FilterTubeIdentity?.isChannelBlocked?.(entries, channelMeta, settings?.channelMap || {}) === true;
        } catch (e) {
            const actual = [channelMeta.id, channelMeta.name, channelMeta.handle].map(value => String(value || '').toLowerCase());
            return entries.some(entry => [entry?.id, entry?.name, entry?.handle, typeof entry === 'string' ? entry : '']
                .map(value => String(value || '').toLowerCase()).filter(Boolean).some(value => actual.includes(value)));
        }
    }

    function evaluateContentRules(settings, metadata) {
        const filters = settings.contentFilters || {};
        if (filters.duration?.enabled === true) {
            const seconds = Number(metadata.lengthSeconds);
            if (!Number.isFinite(seconds) || seconds <= 0) return { state: 'pending', missing: 'duration' };
            const minutes = seconds / 60;
            const rule = filters.duration;
            const condition = rule.condition || 'between';
            let min = Number(rule.minMinutes ?? rule.minutes ?? rule.valueMinutes ?? rule.minutesMin ?? rule.value ?? 0);
            let max = Number(rule.maxMinutes ?? rule.minutesMax ?? rule.valueMinutesMax ?? 0);
            if (!Number.isFinite(min)) min = 0;
            if (!Number.isFinite(max)) max = 0;
            if ((min <= 0 || max <= 0) && typeof rule.value === 'string') {
                const match = rule.value.trim().match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
                if (match) {
                    if (min <= 0) min = Number(match[1]);
                    if (max <= 0) max = Number(match[2]);
                }
            }
            if (max > 0 && min > max) [min, max] = [max, min];
            const mode = rule.mode === 'allow' || rule.mode === 'block' ? rule.mode : 'block';
            let blocked = false;
            if (condition === 'longer') blocked = mode === 'allow' ? !(minutes > min) : minutes > min;
            else if (condition === 'shorter') blocked = mode === 'allow' ? !(minutes < min) : minutes < min;
            else if (max > 0) { const inside = minutes >= min && minutes <= max; blocked = mode === 'block' ? inside : !inside; }
            if (blocked) return { state: 'blocked', kind: 'duration', durationSeconds: seconds };
        }
        if (filters.uploadDate?.enabled === true) {
            const rawDate = metadata.publishDate || metadata.uploadDate || '';
            const published = new Date(rawDate).getTime();
            if (!Number.isFinite(published)) return { state: 'pending', missing: 'upload-date' };
            const rule = filters.uploadDate;
            let from = rule.fromDate ? new Date(rule.fromDate).getTime() : NaN;
            let to = rule.toDate ? new Date(rule.toDate).getTime() : NaN;
            let blocked = false;
            if (rule.condition === 'newer') blocked = Number.isFinite(from) && published < from;
            else if (rule.condition === 'older') blocked = Number.isFinite(to) && published < to;
            else if (rule.condition === 'between') {
                if (Number.isFinite(from) && Number.isFinite(to) && from > to) [from, to] = [to, from];
                blocked = (Number.isFinite(from) && published < from) || (Number.isFinite(to) && published > to);
            }
            if (blocked) return { state: 'blocked', kind: 'upload-date', publishDate: rawDate };
        }
        if (filters.uppercase?.enabled === true) {
            if (metadata.textVerified !== true) return { state: 'pending', missing: 'title' };
            const title = String(metadata.title || '');
            const rule = filters.uppercase;
            const minLength = Number(rule.minWordLength) || 2;
            const lettersOnly = title.replace(/[^a-zA-Z]/g, '');
            const allCaps = lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase();
            const word = title.replace(/[^\w\s]/g, ' ').split(/\s+/).some(value => {
                const letters = value.replace(/[^a-zA-Z]/g, '');
                return letters.length >= minLength && letters.length === value.length && letters === letters.toUpperCase();
            });
            if ((rule.mode === 'all_caps' && allCaps) || (rule.mode === 'single_word' && word) || (rule.mode === 'both' && (allCaps || word))) {
                return { state: 'blocked', kind: 'uppercase' };
            }
        }
        for (const [key, value, kind] of [
            ['categoryFilters', metadata.category, 'category'],
            ['languageFilters', String(metadata.languageCode || '').split('-')[0], 'language']
        ]) {
            const rule = settings[key];
            if (rule?.enabled !== true || !hasEntries(rule.selected)) continue;
            const normalized = String(value || '').trim().toLowerCase();
            if (!normalized || normalized === 'und') return { state: 'pending', missing: kind };
            const selected = rule.selected.map(item => String(item || '').trim().toLowerCase().split('-')[0]).includes(normalized);
            if (rule.mode === 'allow' ? !selected : selected) return { state: 'blocked', kind, [kind === 'language' ? 'languageCode' : 'category']: value };
        }
        return { state: 'allowed', kind: 'none' };
    }

    function evaluateAdmission(settings, metadata, videoId) {
        if (!hasActiveVideoAdmissionRules(settings)) return { state: 'inactive' };
        if (!metadata || metadata.videoId !== videoId) return { state: 'pending', missing: 'player metadata' };
        const needsIdentity = hasEntries(settings.filterChannels) || hasEntries(settings.whitelistChannels) || settings.listMode === 'whitelist';
        const needsText = hasEntries(settings.filterKeywords) || hasEntries(settings.whitelistKeywords) || settings.contentFilters?.uppercase?.enabled === true;
        if (needsIdentity && !metadata.channelId && !metadata.channelHandle && !metadata.channelName) return { state: 'pending', missing: 'channel identity' };
        if (needsText && metadata.textVerified !== true) return { state: 'pending', missing: 'video text' };
        const fields = [
            { label: 'title', text: metadata.title || '' },
            { label: 'player description', text: metadata.shortDescription || '' },
            { label: 'YouTube metadata keywords', text: Array.isArray(metadata.keywords) ? metadata.keywords.join(' ') : '' }
        ];
        const blockedKeyword = keywordMatch(settings.filterKeywords, fields, metadata);
        const allowedKeyword = keywordMatch(settings.whitelistKeywords, fields, metadata);
        if (blockedKeyword.pending || allowedKeyword.pending) return { state: 'pending', missing: 'upload date' };
        const explicitlyBlocked = hasEntries(settings.blockedVideoIds) && settings.blockedVideoIds.includes(videoId);
        const explicitlyAllowed = hasEntries(settings.allowedVideoIds) && settings.allowedVideoIds.includes(videoId);
        const blockedChannel = channelMatch(settings.filterChannels, metadata, settings);
        const allowedChannel = channelMatch(settings.whitelistChannels, metadata, settings);
        const blockSpecificity = explicitlyBlocked ? 3 : (blockedChannel ? 2 : (blockedKeyword.matched ? 1 : 0));
        const allowSpecificity = explicitlyAllowed ? 3 : (allowedChannel ? 2 : (allowedKeyword.matched ? 1 : 0));
        if (blockSpecificity > 0 || allowSpecificity > 0) {
            if (allowSpecificity < blockSpecificity) {
                if (explicitlyBlocked) return { state: 'blocked', kind: 'video', videoId };
                if (blockedChannel) return { state: 'blocked', kind: 'channel', ownerName: metadata.channelName || metadata.channelId };
                return { state: 'blocked', kind: 'keyword', ...blockedKeyword };
            }
        } else if (settings.listMode === 'whitelist') {
            return { state: 'blocked', kind: 'allow-only', videoId, ownerName: metadata.channelName || metadata.channelId };
        } else {
            const ownerKeyword = keywordMatch(settings.filterKeywords, fields, metadata, true);
            if (ownerKeyword.pending) return { state: 'pending', missing: 'upload date' };
            if (ownerKeyword.matched) return { state: 'blocked', kind: 'keyword', ...ownerKeyword };
        }
        return evaluateContentRules(settings, metadata);
    }

    function decisionMessage(decision, metadata = {}) {
        if (decision.state === 'pending') return Date.now() - pendingStartedAt >= METADATA_TIMEOUT_MS
            ? 'Unable to verify required metadata\nPlayback remains paused' : 'Checking FilterTube rules…';
        if (decision.kind === 'video') return `Blocked video\nVideo ID: ${decision.videoId}`;
        if (decision.kind === 'channel') return `Blocked channel\n${metadata.channelName || metadata.channelId || ''}`.trim();
        if (decision.kind === 'keyword') return `Blocked keyword\nMatched: ${decision.pattern || 'matched rule'}\nSource: ${decision.source || 'video metadata'}`;
        if (decision.kind === 'allow-only') return `Not in Allow only selected\n${metadata.channelName || decision.videoId || ''}`.trim();
        if (decision.kind === 'duration') return `Blocked by Duration Filter\nDuration: ${Math.round(Number(decision.durationSeconds) || 0)} seconds`;
        if (decision.kind === 'upload-date') return `Blocked by Upload Date Filter\nPublished: ${decision.publishDate}`;
        if (decision.kind === 'uppercase') return 'Blocked by Uppercase Title Filter';
        if (decision.kind === 'category') return `Blocked by Category Filter\nCategory: ${decision.category}`;
        if (decision.kind === 'language') return `Blocked by Language Filter\nLanguage: ${decision.languageCode}`;
        return 'Blocked by an active FilterTube rule';
    }

    function admissionOverlayPrefersReducedMotion() {
        try { return root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch (e) { return false; }
    }

    function admissionOverlayUsesDarkTheme() {
        try {
            const rootElement = document.documentElement;
            const theme = rootElement?.getAttribute?.('data-theme') || rootElement?.dataset?.theme || '';
            return theme === 'dark' || (theme !== 'light' && root.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true);
        } catch (e) { return false; }
    }

    function admissionOverlayHeroUrl() {
        try {
            const getURL = runtimeAPI?.runtime?.getURL;
            return typeof getURL === 'function' ? getURL.call(runtimeAPI.runtime, 'assets/images/homepage_hero_day.mp4') : '';
        } catch (e) { return ''; }
    }

    function admissionOverlayStyle(element, styles) {
        try { if (element?.style) Object.assign(element.style, styles); } catch (e) {}
    }

    function removeAdmissionOverlayBackground(overlay) {
        const background = overlay?.__filtertubeAdmissionBackground || null;
        if (!background) return;
        try { background.pause?.(); } catch (e) {}
        try { background.remove?.(); } catch (e) {}
        try { overlay.__filtertubeAdmissionBackground = null; } catch (e) {}
    }

    function ensureAdmissionOverlayVisuals(overlay, state, message) {
        const blocked = state === 'blocked';
        const reducedMotion = admissionOverlayPrefersReducedMotion();
        const darkTheme = admissionOverlayUsesDarkTheme();
        const canCompose = typeof overlay?.appendChild === 'function' && typeof document.createElement === 'function';
        const blockedBackground = darkTheme ? '#172329' : '#304c4e';
        const pendingBackground = darkTheme ? '#0b1016' : '#f6f2eb';
        const blockedText = darkTheme ? '#fffaf4' : '#fffaf4';
        const pendingText = darkTheme ? '#f3f6fa' : '#1b1a18';

        admissionOverlayStyle(overlay, {
            position: 'fixed', inset: '0', zIndex: '2147483647', width: '100vw', height: '100vh',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 56px)', overflow: 'hidden', isolation: 'isolate',
            pointerEvents: 'auto', userSelect: 'text', whiteSpace: 'normal',
            background: blocked ? blockedBackground : pendingBackground,
            color: blocked ? blockedText : pendingText,
            font: '400 15px/1.55 "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        });

        if (!canCompose) {
            // The small test/runtime DOMs may expose only textContent. Keep the
            // exact admission reason observable there without requiring child nodes.
            try { overlay.textContent = String(message || ''); } catch (e) {}
            return;
        }

        let panel = overlay.__filtertubeAdmissionPanel || null;
        let brand = overlay.__filtertubeAdmissionBrand || null;
        let brandMark = overlay.__filtertubeAdmissionBrandMark || null;
        let brandName = overlay.__filtertubeAdmissionBrandName || null;
        let status = overlay.__filtertubeAdmissionStatus || null;
        let title = overlay.__filtertubeAdmissionTitle || null;
        let reason = overlay.__filtertubeAdmissionReason || null;
        let scrim = overlay.__filtertubeAdmissionScrim || null;

        if (!panel) {
            panel = document.createElement('section');
            panel.setAttribute('aria-live', 'polite');
            panel.setAttribute('data-filtertube-admission-panel', 'true');
            admissionOverlayStyle(panel, {
                position: 'relative', zIndex: '2', display: 'flex', flexDirection: 'column', gap: '18px',
                width: 'min(540px, 100%)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', boxSizing: 'border-box',
                padding: 'clamp(24px, 5vw, 44px)', border: '1px solid rgba(255,255,255,.28)', borderRadius: '28px',
                boxShadow: '0 28px 90px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)'
            });

            brand = document.createElement('div');
            brand.setAttribute('data-filtertube-admission-brand', 'true');
            admissionOverlayStyle(brand, { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '36px' });
            brandMark = document.createElement('span');
            brandMark.setAttribute('aria-hidden', 'true');
            admissionOverlayStyle(brandMark, {
                display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '12px',
                background: darkTheme ? '#c35a4b' : '#ab4438', color: '#fffaf4', font: '800 16px/1 "Outfit", sans-serif',
                boxShadow: '0 8px 20px rgba(60,42,33,.22)'
            });
            brandMark.textContent = 'F';
            brandName = document.createElement('span');
            admissionOverlayStyle(brandName, { color: darkTheme ? '#f3f6fa' : '#1b1a18', font: '750 16px/1 "Outfit", sans-serif', letterSpacing: '.01em' });
            brandName.textContent = 'FilterTube';
            brand.appendChild(brandMark);
            brand.appendChild(brandName);

            status = document.createElement('p');
            status.setAttribute('data-filtertube-admission-status', 'true');
            admissionOverlayStyle(status, {
                margin: '12px 0 0', color: blocked ? '#cfe2d2' : (darkTheme ? '#9aa6b4' : '#827b73'),
                font: '700 12px/1.35 "Plus Jakarta Sans", sans-serif', letterSpacing: '.08em', textTransform: 'uppercase'
            });

            title = document.createElement('h1');
            title.setAttribute('data-filtertube-admission-title', 'true');
            admissionOverlayStyle(title, {
                margin: '0', color: blocked ? '#fffaf4' : pendingText,
                font: '700 clamp(24px, 4vw, 38px)/1.12 "Outfit", "Plus Jakarta Sans", sans-serif', letterSpacing: '-.02em'
            });

            reason = document.createElement('p');
            reason.setAttribute('data-filtertube-admission-reason', 'true');
            admissionOverlayStyle(reason, {
                margin: '0', padding: '15px 16px', borderLeft: `3px solid ${darkTheme ? '#c35a4b' : '#ab4438'}`,
                borderRadius: '4px 14px 14px 4px', background: blocked ? 'rgba(255,255,255,.1)' : (darkTheme ? 'rgba(255,255,255,.06)' : 'rgba(171,68,56,.07)'),
                color: blocked ? '#fffaf4' : pendingText, font: '650 14px/1.55 "Plus Jakarta Sans", sans-serif',
                whiteSpace: 'pre-line', overflowWrap: 'anywhere'
            });

            panel.appendChild(brand);
            panel.appendChild(status);
            panel.appendChild(title);
            panel.appendChild(reason);
            overlay.appendChild(panel);
            overlay.__filtertubeAdmissionPanel = panel;
            overlay.__filtertubeAdmissionBrand = brand;
            overlay.__filtertubeAdmissionBrandMark = brandMark;
            overlay.__filtertubeAdmissionBrandName = brandName;
            overlay.__filtertubeAdmissionStatus = status;
            overlay.__filtertubeAdmissionTitle = title;
            overlay.__filtertubeAdmissionReason = reason;
        }

        if (!scrim) {
            scrim = document.createElement('div');
            scrim.setAttribute('aria-hidden', 'true');
            scrim.setAttribute('data-filtertube-admission-scrim', 'true');
            admissionOverlayStyle(scrim, { position: 'absolute', inset: '0', zIndex: '1', pointerEvents: 'none' });
            overlay.insertBefore?.(scrim, panel);
            if (!scrim.parentNode) overlay.appendChild(scrim);
            overlay.__filtertubeAdmissionScrim = scrim;
        }

        let background = overlay.__filtertubeAdmissionBackground || null;
        if (blocked && !reducedMotion && !background && admissionOverlayHeroUrl()) {
            background = document.createElement('video');
            background.setAttribute('aria-hidden', 'true');
            background.setAttribute('data-filtertube-admission-background', 'true');
            background.setAttribute('muted', '');
            background.setAttribute('autoplay', '');
            background.setAttribute('loop', '');
            background.setAttribute('playsinline', '');
            background.muted = true;
            background.defaultMuted = true;
            background.autoplay = true;
            background.loop = true;
            background.playsInline = true;
            background.preload = 'metadata';
            background.src = admissionOverlayHeroUrl();
            admissionOverlayStyle(background, {
                position: 'absolute', inset: '0', zIndex: '0', width: '100%', height: '100%', objectFit: 'cover',
                opacity: '.58', filter: 'saturate(.82) brightness(.8)', pointerEvents: 'none'
            });
            overlay.appendChild(background);
            overlay.__filtertubeAdmissionBackground = background;
        } else if (!blocked || reducedMotion) {
            removeAdmissionOverlayBackground(overlay);
            background = null;
        }

        admissionOverlayStyle(scrim, {
            display: blocked ? 'block' : 'none',
            background: blocked
                ? 'linear-gradient(135deg, rgba(8,13,18,.78), rgba(15,23,42,.62) 45%, rgba(27,38,48,.72))'
                : 'transparent'
        });
        admissionOverlayStyle(panel, {
            background: blocked ? 'rgba(12,18,25,.82)' : (darkTheme ? 'rgba(18,24,33,.96)' : 'rgba(255,255,255,.84)'),
            color: blocked ? blockedText : pendingText
        });
        admissionOverlayStyle(brandMark, { background: darkTheme ? '#c35a4b' : '#ab4438' });
        admissionOverlayStyle(brandName, { color: darkTheme ? '#f3f6fa' : '#1b1a18' });
        admissionOverlayStyle(status, { color: blocked ? '#cfe2d2' : (darkTheme ? '#9aa6b4' : '#827b73') });
        admissionOverlayStyle(title, { color: blocked ? '#fffaf4' : pendingText });
        admissionOverlayStyle(reason, {
            borderLeftColor: darkTheme ? '#c35a4b' : '#ab4438',
            background: blocked ? 'rgba(255,255,255,.1)' : (darkTheme ? 'rgba(255,255,255,.06)' : 'rgba(171,68,56,.07)'),
            color: blocked ? '#fffaf4' : pendingText
        });
        status.textContent = blocked ? 'Playback blocked' : 'Checking playback';
        title.textContent = blocked ? 'This video is blocked' : 'Checking before playback';
        reason.textContent = String(message || '');
        if (blocked && background?.play && background.paused !== false) {
            try { background.play()?.catch?.(() => {}); } catch (e) {}
        }
    }

    function showOverlay(state, message) {
        try {
            let overlay = document.getElementById('filtertube-external-youtube-admission');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'filtertube-external-youtube-admission';
                overlay.setAttribute('role', 'status');
                overlay.setAttribute('aria-label', String(message || ''));
                (document.body || document.documentElement)?.appendChild(overlay);
            }
            if (overlay.dataset) overlay.dataset.state = state;
            else overlay.setAttribute?.('data-state', state);
            overlay.setAttribute?.('aria-label', String(message || ''));
            ensureAdmissionOverlayVisuals(overlay, state, message);
        } catch (e) {}
    }

    function clearOverlay() {
        try {
            const overlay = document.getElementById('filtertube-external-youtube-admission');
            if (!overlay) return;
            removeAdmissionOverlayBackground(overlay);
            overlay.remove?.();
        } catch (e) {}
    }

    function resumeGuardedMedia() {
        for (const media of guardedMedia) {
            guardedMedia.delete(media);
            try { resumeAuthority.add(media); media.play?.()?.catch?.(() => {}); } catch (e) {}
        }
    }

    function applyDecision(videoId) {
        if (!videoId || videoId !== currentVideoId || !hasActiveVideoAdmissionRules(currentSettings)) return;
        const metadata = metadataByVideoId.get(videoId) || currentSettings?.videoMetaMap?.[videoId] || null;
        const decision = evaluateAdmission(currentSettings, metadata, videoId);
        if (decision.state === 'allowed') {
            publishDecision(videoId, 'allowed');
            clearOverlay(); clearTimeout(pendingTimer); pendingTimer = 0; resumeGuardedMedia(); return;
        }
        publishDecision(videoId, decision.state === 'blocked' ? 'blocked' : 'pending');
        if (decision.state === 'blocked') {
            clearTimeout(pendingTimer);
            pendingTimer = 0;
        }
        showOverlay(decision.state === 'blocked' ? 'blocked' : 'pending', decisionMessage(decision, metadata || {}));
        if (decision.state === 'pending' && !pendingTimer && Date.now() - pendingStartedAt < METADATA_TIMEOUT_MS) {
            pendingTimer = setTimeout(() => { pendingTimer = 0; applyDecision(videoId); }, Math.max(0, METADATA_TIMEOUT_MS - (Date.now() - pendingStartedAt)));
        }
    }

    function pauseForAdmission(media, candidate) {
        if (media?.getAttribute?.('data-filtertube-admission-background') === 'true') return false;
        if (!candidate || !hasActiveVideoAdmissionRules(currentSettings)) return false;
        const metadata = metadataByVideoId.get(candidate.videoId);
        if (evaluateAdmission(currentSettings, metadata, candidate.videoId).state === 'allowed') return false;
        setCurrentCandidate(candidate); guardedMedia.add(media);
        try { media?.pause?.(); } catch (e) {}
        applyDecision(candidate.videoId);
        return true;
    }

    function reconcileGuardState() {
        const active = hasActiveVideoAdmissionRules(currentSettings);
        publishControlState(active);
        if (!active) {
            clearTimeout(pendingTimer); pendingTimer = 0; clearOverlay(); resumeGuardedMedia(); return;
        }
        const candidate = currentCandidate();
        if (candidate) setCurrentCandidate(candidate);
        for (const media of document.querySelectorAll?.('video') || []) {
            if (!media.paused) pauseForAdmission(media, candidate || currentCandidate(media));
        }
    }

    function handlePotentialYouTubeActivation(event) {
        if (!hasActiveVideoAdmissionRules(currentSettings)) return;
        const target = elementFromTarget(event?.target);
        const anchor = target?.closest?.('a[href]');
        const candidate = anchor ? extractYouTubeCandidate(anchor.getAttribute('href') || anchor.href || '') : candidateFromElement(target);
        if (!candidate) return;
        setCurrentCandidate(candidate);
    }

    function handleExternalMediaPlayback(event) {
        const media = elementFromTarget(event?.composedPath?.()?.[0] || event?.target);
        if (String(media?.tagName || '').toLowerCase() !== 'video') return;
        if (resumeAuthority.has(media)) { resumeAuthority.delete(media); return; }
        pauseForAdmission(media, currentCandidate(media));
    }

    function acceptExternalMetadata(metadata) {
        const videoId = String(metadata?.videoId || '');
        if (!VIDEO_ID_PATTERN.test(videoId)) return false;
        if (metadata.identityVerified === true || metadata.textVerified === true) metadataByVideoId.set(videoId, metadata);
        setCurrentCandidate(canonicalCandidate(videoId));
        if (hasActiveVideoAdmissionRules(currentSettings)) applyDecision(videoId);
        return true;
    }

    root.addEventListener('message', event => {
        if (event.source !== root || event.data?.source !== 'filtertube-external-network') return;
        if (event.data?.type === 'FilterTube_ExternalYouTubeMetadata') {
            acceptExternalMetadata(event.data.payload);
            return;
        }
        if (event.data?.type === 'FilterTube_ExternalYouTubePlaybackAttempt') {
            const videoId = String(event.data?.payload?.videoId || '');
            if (!VIDEO_ID_PATTERN.test(videoId) || !hasActiveVideoAdmissionRules(currentSettings)) return;
            setCurrentCandidate(canonicalCandidate(videoId));
            applyDecision(videoId);
        }
    });
    root.addEventListener('hashchange', reconcileGuardState, true);
    document.addEventListener('click', handlePotentialYouTubeActivation, true);
    document.addEventListener('play', handleExternalMediaPlayback, true);
    document.addEventListener('playing', handleExternalMediaPlayback, true);

    try {
        runtimeAPI?.runtime?.onMessage?.addListener?.(message => {
            if (message?.action === 'FilterTube_ApplySettings' && message.settings && typeof message.settings === 'object') {
                currentSettings = message.settings; reconcileGuardState();
            } else if (message?.action === 'FilterTube_RefreshNow') scheduleSettingsRefresh();
        });
        runtimeAPI?.storage?.onChanged?.addListener?.(() => scheduleSettingsRefresh());
    } catch (e) {}

    refreshSettings();
    root.FilterTubeExternalYouTubeGuard = {
        extractYouTubeCandidate, extractGooglePlayerVideoId, hasActiveVideoAdmissionRules,
        candidateFromElement, evaluateAdmission, acceptExternalMetadata, refreshSettings
    };
})(typeof window !== 'undefined' ? window : globalThis);
