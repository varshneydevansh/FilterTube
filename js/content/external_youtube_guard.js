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
    let playbackRequestedVideoId = '';
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

    function selectedGooglePlayerVideoId() {
        const url = safeUrl(root.location?.href || '');
        if (!url || !/(^|\.)google\.com$/i.test(url.hostname) || url.pathname !== '/search') return '';
        const fragment = new URLSearchParams(url.hash.slice(1));
        if (fragment.get('fpstate') !== 'ive') return '';
        return extractGooglePlayerVideoId(url.href);
    }

    function isGoogleSearch() {
        const url = safeUrl(root.location?.href || '');
        return Boolean(url && /(^|\.)google\.com$/i.test(url.hostname) && url.pathname === '/search');
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
            // A result preview must never inherit an arbitrary link elsewhere on
            // the search page (or inside the admission overlay).
            if (element === document.body || element === document.documentElement) break;
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
            playbackRequestedVideoId = '';
            clearOverlay();
            pendingStartedAt = Date.now();
            clearTimeout(pendingTimer);
            pendingTimer = 0;
        }
    }

    function currentCandidate(target = null) {
        const url = safeUrl(root.location?.href || '');
        const isEmbed = url && YOUTUBE_HOST_PATTERN.test(url.hostname) && url.pathname.startsWith('/embed/');
        if (isEmbed) {
            // Nearby thumbnails belong to recommendations, not this media.
            // ID-less embeds receive their selected identity from the MAIN bridge.
            return extractYouTubeCandidate(root.location?.href || '')
                || (currentVideoId ? canonicalCandidate(currentVideoId) : null);
        }
        if (isGoogleSearch()) {
            const selectedId = selectedGooglePlayerVideoId();
            if (!selectedId || !target) return null;
            const nearby = candidateFromElement(target);
            return nearby?.videoId === selectedId ? nearby : null;
        }
        if (target) {
            // A cached result or Google's route fragment does not establish
            // ownership of an unrelated video in the parent document.
            if (!isEmbed) return candidateFromElement(target);
        }
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
        const explicitlyBlocked = !!videoId && hasEntries(settings.blockedVideoIds) && settings.blockedVideoIds.includes(videoId);
        const explicitlyAllowed = !!videoId && hasEntries(settings.allowedVideoIds) && settings.allowedVideoIds.includes(videoId);
        // The selected video ID already verifies this rule. No lower-specificity
        // channel/keyword match can override it; an explicit allow can still tie.
        if (explicitlyBlocked && !explicitlyAllowed) return { state: 'blocked', kind: 'video', videoId };
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

    function ensureAdmissionOverlayVisuals(overlay, state, message) {
        if (root.FilterTubeAdmissionOverlay) root.FilterTubeAdmissionOverlay.render(overlay, state, message);
        else overlay.textContent = String(message || '');
    }

    function removeAdmissionOverlayBackground(overlay) {
        root.FilterTubeAdmissionOverlay?.clear(overlay);
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
        // Metadata may be prefetched while merely browsing results. Warm the
        // decision above, but never present a playback banner until play is attempted.
        if (playbackRequestedVideoId !== videoId) return;
        showOverlay(decision.state === 'blocked' ? 'blocked' : 'pending', decisionMessage(decision, metadata || {}));
        if (decision.state === 'pending' && !pendingTimer && Date.now() - pendingStartedAt < METADATA_TIMEOUT_MS) {
            pendingTimer = setTimeout(() => { pendingTimer = 0; applyDecision(videoId); }, Math.max(0, METADATA_TIMEOUT_MS - (Date.now() - pendingStartedAt)));
        }
    }

    function pauseForAdmission(media, candidate) {
        if (media?.getAttribute?.('data-filtertube-admission-background') === 'true') return false;
        if (!candidate || !hasActiveVideoAdmissionRules(currentSettings)) return false;
        const metadata = metadataByVideoId.get(candidate.videoId) || currentSettings?.videoMetaMap?.[candidate.videoId] || null;
        if (evaluateAdmission(currentSettings, metadata, candidate.videoId).state === 'allowed') return false;
        setCurrentCandidate(candidate);
        playbackRequestedVideoId = candidate.videoId;
        guardedMedia.add(media);
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
        if (isGoogleSearch() && !selectedGooglePlayerVideoId()) {
            // Google can leave a hover-preview video alive after the inline
            // viewer closes. Drop its stale admission without replaying it.
            clearTimeout(pendingTimer); pendingTimer = 0;
            clearOverlay(); guardedMedia.clear();
            playbackRequestedVideoId = ''; currentVideoId = '';
            return;
        }
        if (isGoogleSearch()) setCurrentCandidate(canonicalCandidate(selectedGooglePlayerVideoId()));
        const candidate = currentCandidate();
        if (candidate) setCurrentCandidate(candidate);
        for (const media of document.querySelectorAll?.('video') || []) {
            if (!media.paused) pauseForAdmission(media, currentCandidate(media));
        }
    }

    function handlePotentialYouTubeActivation(event) {
        if (!hasActiveVideoAdmissionRules(currentSettings)) return;
        const url = safeUrl(root.location?.href || '');
        if (url && YOUTUBE_HOST_PATTERN.test(url.hostname) && url.pathname.startsWith('/embed/')) return;
        const target = elementFromTarget(event?.target);
        const anchor = target?.closest?.('a[href]');
        const candidate = anchor ? extractYouTubeCandidate(anchor.getAttribute('href') || anchor.href || '') : null;
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
        if (isGoogleSearch() && selectedGooglePlayerVideoId() !== videoId) return true;
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
            if (isGoogleSearch() && selectedGooglePlayerVideoId() !== videoId) return;
            setCurrentCandidate(canonicalCandidate(videoId));
            playbackRequestedVideoId = videoId;
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
