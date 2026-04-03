// js/injector.js - MAIN world script

(function () {
    'use strict';

    // Idempotency guard - prevent multiple executions
    if (window.filterTubeInjectorHasRun) {
        try {
            if (window.filterTubeInjectorBridgeReady === true || window.ftInitialized === true || window.FilterTubeEngine?.processData) {
                window.postMessage({
                    type: 'FilterTube_InjectorBridgeReady',
                    source: 'injector'
                }, '*');
                window.postMessage({
                    type: 'FilterTube_InjectorToBridge_Ready',
                    source: 'injector'
                }, '*');
            }
        } catch (e) {
        }
        console.warn('FilterTube (Injector): Already initialized, skipping');
        return; // Now legal because it's inside a function
    }
    window.filterTubeInjectorHasRun = true;

    // Debug logging with sequence numbers and bridge relay
    let injectorDebugSequence = 0;
    function postLog(level, ...args) {
        if (level === 'log' && !window.__filtertubeDebug) {
            return;
        }
        injectorDebugSequence++;
        console[level](`[${injectorDebugSequence}] FilterTube (Injector):`, ...args);

        // Relay to content_bridge for extension console visibility
        try {
            window.postMessage({
                type: 'FilterTube_InjectorToBridge_Log',
                payload: {
                    level: level,
                    message: args,
                    seq: injectorDebugSequence
                },
                source: 'injector'
            }, '*');
        } catch (e) {
            // Don't let relay failures break functionality
        }
    }

    postLog('log', 'Starting initialization in MAIN world');

    // Default settings with safe fallbacks
    var currentSettings = {
        filterKeywords: [],
        filterChannels: [],
        hideAllComments: false,
        filterComments: false,
        useExactWordMatching: false,
        hideAllShorts: false
    };

    var settingsReceived = false;
    var initialDataQueue = [];

    // Cache for collaboration data from filter_logic.js
    var collaboratorCache = new Map(); // videoId -> collaborators array

    const HANDLE_TERMINATOR_REGEX = /[\/\s?#"'<>\u2022\u00B7]/;
    function extractRawHandle(value) {
        const sharedExtractRawHandle = window.FilterTubeIdentity?.extractRawHandle;
        if (typeof sharedExtractRawHandle === 'function') {
            return sharedExtractRawHandle(value);
        }
        if (!value || typeof value !== 'string') return '';
        let working = value.trim();
        if (!working) return '';
        const atIndex = working.indexOf('@');
        if (atIndex === -1) return '';
        working = working.substring(atIndex + 1);
        if (!working) return '';

        let buffer = '';
        for (let i = 0; i < working.length; i++) {
            const char = working[i];
            if (char === '%' && i + 2 < working.length && /[0-9A-Fa-f]{2}/.test(working.substring(i + 1, i + 3))) {
                buffer += working.substring(i, i + 3);
                i += 2;
                continue;
            }
            if (HANDLE_TERMINATOR_REGEX.test(char)) {
                break;
            }
            buffer += char;
        }

        if (!buffer) return '';
        try {
            buffer = decodeURIComponent(buffer);
        } catch (err) {
            // ignore
        }
        buffer = buffer.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
        buffer = buffer.trim();
        if (!buffer) return '';
        return `@${buffer}`;
    }

    function getCollaboratorListQuality(list) {
        if (!Array.isArray(list) || list.length === 0) return 0;
        return list.reduce((score, collaborator) => {
            if (!collaborator) return score;
            let entryScore = 10;
            if (collaborator.name) entryScore += 1;
            if (collaborator.handle) entryScore += 3;
            if (collaborator.id) entryScore += 5;
            return score + entryScore;
        }, 0);
    }

    function normalizeLooseText(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function normalizeExpectedHandle(value) {
        const raw = extractRawHandle(value) || (typeof value === 'string' ? value.trim() : '');
        if (!raw) return '';
        const norm = raw.startsWith('@') ? raw : `@${raw.replace(/^@+/, '')}`;
        return norm.toLowerCase();
    }

    function safeStructuredClone(value) {
        if (value == null) return value;
        try {
            if (typeof structuredClone === 'function') {
                return structuredClone(value);
            }
        } catch (e) {
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return null;
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function getYtcfgValue(key) {
        if (!key || typeof key !== 'string') return null;
        try {
            if (window.ytcfg && typeof window.ytcfg.get === 'function') {
                const value = window.ytcfg.get(key);
                if (typeof value !== 'undefined') {
                    return value;
                }
            }
        } catch (e) {
        }
        try {
            if (window.ytcfg && window.ytcfg.data_ && typeof window.ytcfg.data_ === 'object') {
                const value = window.ytcfg.data_[key];
                if (typeof value !== 'undefined') {
                    return value;
                }
            }
        } catch (e) {
        }
        return null;
    }

    function extractTextFromRenderer(value) {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value.simpleText === 'string') return value.simpleText.trim();
        if (Array.isArray(value.runs)) {
            return value.runs
                .map((run) => (typeof run?.text === 'string' ? run.text : ''))
                .join('')
                .trim();
        }
        return '';
    }

    function normalizeThumbnailUrl(url) {
        if (!url || typeof url !== 'string') return '';
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        return url;
    }

    function buildSubscriptionImportHeaders(profile = {}) {
        const headers = {
            'content-type': 'application/json'
        };

        const headerClientName = String(profile.headerClientName || '').trim();
        const clientVersion = String(profile.headerClientVersion || '').trim();
        const visitorData = String(profile.visitorData || '').trim();
        const sessionIndex = String(profile.sessionIndex || '').trim();
        const delegatedSessionId = String(profile.delegatedSessionId || '').trim();

        if (headerClientName) headers['x-youtube-client-name'] = headerClientName;
        if (clientVersion) headers['x-youtube-client-version'] = clientVersion;
        if (visitorData) headers['x-goog-visitor-id'] = visitorData;
        if (sessionIndex) headers['x-goog-authuser'] = sessionIndex;
        if (delegatedSessionId) headers['x-goog-pageid'] = delegatedSessionId;
        if (location?.origin) headers['x-origin'] = location.origin;
        headers['x-youtube-bootstrap-logged-in'] = 'true';

        return headers;
    }

    function buildSubscriptionImportRequestProfiles() {
        const context = safeStructuredClone(getYtcfgValue('INNERTUBE_CONTEXT')) || {};
        const contextClient = context?.client && typeof context.client === 'object' ? context.client : {};
        const currentClientVersion = String(
            contextClient.clientVersion
            || getYtcfgValue('INNERTUBE_CLIENT_VERSION')
            || getYtcfgValue('INNERTUBE_CONTEXT_CLIENT_VERSION')
            || ''
        ).trim();
        const visitorData = String(
            contextClient.visitorData
            || getYtcfgValue('VISITOR_DATA')
            || ''
        ).trim();
        const sessionIndex = String(
            getYtcfgValue('SESSION_INDEX')
            || contextClient.sessionIndex
            || ''
        ).trim();
        const delegatedSessionId = String(
            getYtcfgValue('DELEGATED_SESSION_ID')
            || ''
        ).trim();
        const webClientHeaderName = String(
            getYtcfgValue('INNERTUBE_CONTEXT_CLIENT_NAME')
            || getYtcfgValue('INNERTUBE_CLIENT_NAME')
            || '1'
        ).trim();
        const mwebClientVersion = String(
            getYtcfgValue('MWEB_INNERTUBE_CLIENT_VERSION')
            || currentClientVersion
            || '2.20260318.01.00'
        ).trim();

        const baseContext = {
            ...context,
            client: {
                ...contextClient,
                originalUrl: contextClient.originalUrl || location.href
            }
        };

        const mwebClientContext = {
            ...contextClient,
            clientName: 'MWEB',
            clientVersion: mwebClientVersion,
            originalUrl: 'https://m.youtube.com/feed/channels',
            ...(visitorData ? { visitorData } : {})
        };
        delete mwebClientContext.clientScreen;
        delete mwebClientContext.platform;

        const profileMap = {
            mweb_fechannels: {
                source: 'mweb_fechannels',
                browseId: 'FEchannels',
                context: {
                    ...context,
                    client: mwebClientContext
                },
                headerClientName: '2',
                headerClientVersion: mwebClientVersion,
                visitorData,
                sessionIndex,
                delegatedSessionId
            },
            web_fechannels: {
                source: 'web_fechannels',
                browseId: 'FEchannels',
                context: baseContext,
                headerClientName: webClientHeaderName || '1',
                headerClientVersion: currentClientVersion,
                visitorData,
                sessionIndex,
                delegatedSessionId
            }
        };

        const isMobileHost = (() => {
            try {
                return String(location?.hostname || '').toLowerCase().startsWith('m.');
            } catch (e) {
                return false;
            }
        })();

        const profiles = (isMobileHost
            ? ['mweb_fechannels', 'web_fechannels']
            : ['web_fechannels', 'mweb_fechannels'])
            .map((key) => profileMap[key])
            .filter((profile) => profile?.context);

        return {
            apiKey: String(getYtcfgValue('INNERTUBE_API_KEY') || '').trim(),
            profiles
        };
    }

    function isYoutubeChannelsFeedPath() {
        try {
            return String(location?.pathname || '') === '/feed/channels';
        } catch (e) {
            return false;
        }
    }

    function detectLoggedOutBrowseResponse(data) {
        try {
            if (data?.responseContext?.mainAppWebResponseContext?.loggedOut === true) {
                return true;
            }
        } catch (e) {
        }

        try {
            const services = Array.isArray(data?.responseContext?.serviceTrackingParams)
                ? data.responseContext.serviceTrackingParams
                : [];
            for (let i = 0; i < services.length; i += 1) {
                const service = services[i];
                const params = Array.isArray(service?.params) ? service.params : [];
                for (let j = 0; j < params.length; j += 1) {
                    const param = params[j];
                    if (param?.key === 'logged_in' && String(param.value || '').trim() === '0') {
                        return true;
                    }
                }
            }
        } catch (e) {
        }

        return false;
    }

    function collectSubscriptionImportArtifacts(root) {
        const renderers = [];
        const tokens = [];
        const visited = new Set();

        const visit = (node) => {
            if (!node || typeof node !== 'object') return;
            if (visited.has(node)) return;
            visited.add(node);

            if (node.channelListItemRenderer && typeof node.channelListItemRenderer === 'object') {
                renderers.push(node.channelListItemRenderer);
            }

            if (node.channelRenderer && typeof node.channelRenderer === 'object') {
                renderers.push(node.channelRenderer);
            }

            const token = node?.continuationCommand?.token;
            if (typeof token === 'string' && token.trim()) {
                tokens.push(token.trim());
            }

            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i += 1) {
                    visit(node[i]);
                }
                return;
            }

            Object.keys(node).forEach((key) => {
                visit(node[key]);
            });
        };

        visit(root);

        return {
            renderers,
            tokens: Array.from(new Set(tokens))
        };
    }

    function collectSubscriptionImportDomSeed(maxChannels) {
        if (!isYoutubeChannelsFeedPath()) {
            return {
                channels: [],
                tokens: []
            };
        }

        const possibleSources = new Set();
        const addSource = (source) => {
            if (!source || typeof source !== 'object') return;
            if (source instanceof Element || source instanceof Node || source === window) return;
            possibleSources.add(source);
        };

        const elements = document.querySelectorAll('ytd-channel-renderer, ytm-channel-list-item-renderer');
        elements.forEach((element) => {
            addSource(element?.data);
            addSource(element?.data?.data);
            addSource(element?.data?.content);
            addSource(element?.data?.renderer);
            addSource(element?.__data);
            addSource(element?.__data?.data);
            addSource(element?.__data?.content);
            addSource(element?.__data?.renderer);
            addSource(element?.__dataHost);
            addSource(element?.__dataHost?.data);
        });

        const collected = new Map();
        const tokens = new Set();

        for (const source of possibleSources) {
            const { renderers, tokens: candidateTokens } = collectSubscriptionImportArtifacts(source);
            for (let i = 0; i < renderers.length; i += 1) {
                const normalized = normalizeSubscriptionImportEntry(renderers[i]);
                if (!normalized) continue;
                const key = getSubscriptionImportEntryKey(normalized);
                if (!key) continue;
                const existing = collected.get(key);
                collected.set(key, mergeSubscriptionImportEntries(existing, normalized));
                if (collected.size >= maxChannels) {
                    break;
                }
            }

            candidateTokens.forEach((token) => {
                if (token) tokens.add(token);
            });

            if (collected.size >= maxChannels) {
                break;
            }
        }

        return {
            channels: Array.from(collected.values()).slice(0, maxChannels),
            tokens: Array.from(tokens)
        };
    }

    function collectSubscriptionImportPageSeed(maxChannels) {
        if (!isYoutubeChannelsFeedPath()) {
            return {
                channels: [],
                tokens: []
            };
        }

        const seedCandidates = [
            window.ytInitialData,
            window.__INITIAL_DATA__,
            window.filterTube?.lastYtInitialData,
            window.filterTube?.rawYtInitialData,
            window.filterTube?.lastYtBrowseResponse
        ].filter((candidate, index, array) => candidate && array.indexOf(candidate) === index);

        const collected = new Map();
        const tokens = new Set();

        for (let i = 0; i < seedCandidates.length; i += 1) {
            const { renderers, tokens: candidateTokens } = collectSubscriptionImportArtifacts(seedCandidates[i]);
            for (let j = 0; j < renderers.length; j += 1) {
                const normalized = normalizeSubscriptionImportEntry(renderers[j]);
                if (!normalized) continue;
                const key = getSubscriptionImportEntryKey(normalized);
                if (!key) continue;
                const existing = collected.get(key);
                collected.set(key, mergeSubscriptionImportEntries(existing, normalized));
                if (collected.size >= maxChannels) {
                    break;
                }
            }
            candidateTokens.forEach((token) => {
                if (token) tokens.add(token);
            });
            if (collected.size >= maxChannels) {
                break;
            }
        }

        if (collected.size < maxChannels) {
            const domSeed = collectSubscriptionImportDomSeed(maxChannels);
            for (let i = 0; i < domSeed.channels.length; i += 1) {
                const normalized = domSeed.channels[i];
                const key = getSubscriptionImportEntryKey(normalized);
                if (!key) continue;
                const existing = collected.get(key);
                collected.set(key, mergeSubscriptionImportEntries(existing, normalized));
                if (collected.size >= maxChannels) {
                    break;
                }
            }
            domSeed.tokens.forEach((token) => {
                if (token) tokens.add(token);
            });
        }

        return {
            channels: Array.from(collected.values()).slice(0, maxChannels),
            tokens: Array.from(tokens)
        };
    }

    async function waitForSubscriptionImportSeed(maxChannels, timeoutMs = 5000) {
        const deadline = Date.now() + Math.max(250, timeoutMs);
        let bestSeed = collectSubscriptionImportPageSeed(maxChannels);

        while (Date.now() < deadline) {
            if ((bestSeed.channels && bestSeed.channels.length > 0) || (bestSeed.tokens && bestSeed.tokens.length > 0)) {
                return bestSeed;
            }
            await sleep(250);
            bestSeed = collectSubscriptionImportPageSeed(maxChannels);
        }

        return bestSeed;
    }

    function getSubscriptionImportEntryKey(entry) {
        const id = typeof entry?.id === 'string' ? entry.id.trim().toLowerCase() : '';
        if (id) return `id:${id}`;
        const handle = typeof entry?.handle === 'string' ? entry.handle.trim().toLowerCase() : '';
        if (handle) return `handle:${handle}`;
        const customUrl = typeof entry?.customUrl === 'string' ? entry.customUrl.trim().toLowerCase() : '';
        if (customUrl) return `custom:${customUrl}`;
        return '';
    }

    function normalizeSubscriptionImportEntry(renderer) {
        if (!renderer || typeof renderer !== 'object') return null;

        const endpoint = renderer.navigationEndpoint || {};
        const browseEndpoint = endpoint.browseEndpoint || {};
        const webMetadata = endpoint?.commandMetadata?.webCommandMetadata || {};
        const canonicalBaseUrl = String(
            browseEndpoint.canonicalBaseUrl
            || webMetadata.url
            || ''
        ).trim();

        const extractedHandle = extractRawHandle(canonicalBaseUrl);
        const extractedCustomUrl = typeof window.FilterTubeIdentity?.extractCustomUrlFromPath === 'function'
            ? window.FilterTubeIdentity.extractCustomUrlFromPath(canonicalBaseUrl)
            : '';
        const extractedIdFromPath = typeof window.FilterTubeIdentity?.extractChannelIdFromPath === 'function'
            ? window.FilterTubeIdentity.extractChannelIdFromPath(canonicalBaseUrl)
            : '';

        const rawChannelId = String(
            renderer.channelId
            || browseEndpoint.browseId
            || extractedIdFromPath
            || ''
        ).trim();

        const channelId = /^UC[\w-]{22}$/i.test(rawChannelId) ? rawChannelId : '';
        const handle = extractedHandle || '';
        const customUrl = extractedCustomUrl || '';
        const name = extractTextFromRenderer(renderer.title) || handle || channelId || customUrl || '';
        const thumbnails = Array.isArray(renderer?.thumbnail?.thumbnails) ? renderer.thumbnail.thumbnails : [];
        const bestThumb = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1] : null;
        const timestampRaw = parseInt(renderer.timestampMs, 10);

        if (!channelId && !handle && !customUrl) {
            return null;
        }

        return {
            id: channelId || '',
            handle: handle ? handle.toLowerCase() : null,
            handleDisplay: handle || null,
            canonicalHandle: handle || null,
            logo: normalizeThumbnailUrl(bestThumb?.url || '') || null,
            customUrl: customUrl || null,
            name,
            filterAll: false,
            filterAllComments: true,
            source: 'subscriptions_import',
            originalInput: channelId || handle || customUrl || name || null,
            addedAt: Number.isFinite(timestampRaw) ? timestampRaw : Date.now()
        };
    }

    function mergeSubscriptionImportEntries(existing, incoming) {
        if (!existing) return incoming;
        if (!incoming) return existing;

        const existingName = typeof existing.name === 'string' ? existing.name.trim() : '';
        const incomingName = typeof incoming.name === 'string' ? incoming.name.trim() : '';
        const existingLooksWeak = !existingName
            || existingName === existing.id
            || existingName === existing.handle
            || existingName === existing.customUrl;

        return {
            ...existing,
            id: existing.id || incoming.id || '',
            handle: existing.handle || incoming.handle || null,
            handleDisplay: existing.handleDisplay || incoming.handleDisplay || incoming.handle || null,
            canonicalHandle: existing.canonicalHandle || incoming.canonicalHandle || incoming.handle || null,
            logo: existing.logo || incoming.logo || null,
            customUrl: existing.customUrl || incoming.customUrl || null,
            name: (existingLooksWeak && incomingName) ? incomingName : (existingName || incomingName || ''),
            filterAll: existing.filterAll === true || incoming.filterAll === true,
            filterAllComments: typeof existing.filterAllComments === 'boolean'
                ? existing.filterAllComments
                : (typeof incoming.filterAllComments === 'boolean' ? incoming.filterAllComments : true),
            source: existing.source || incoming.source || 'subscriptions_import',
            originalInput: existing.originalInput || incoming.originalInput || incoming.id || incoming.handle || incoming.customUrl || incoming.name || null,
            addedAt: Math.min(
                Number.isFinite(existing.addedAt) ? existing.addedAt : Date.now(),
                Number.isFinite(incoming.addedAt) ? incoming.addedAt : Date.now()
            )
        };
    }

    async function fetchSubscribedChannelsFromYoutubei(requestId, options = {}) {
        const maxChannels = Math.max(1, Math.min(parseInt(options.maxChannels, 10) || 5000, 5000));
        const pageDelayMs = Math.max(50, Math.min(parseInt(options.pageDelayMs, 10) || 140, 500));
        const timeoutMs = Math.max(5000, Math.min(parseInt(options.timeoutMs, 10) || 60000, 120000));
        const startTs = Date.now();
        const requestContext = buildSubscriptionImportRequestProfiles();
        const collected = new Map();
        const seenTokens = new Set();
        const seed = await waitForSubscriptionImportSeed(maxChannels, Math.min(timeoutMs, 5000));
        let continuation = '';
        let pagesFetched = 0;
        let lastLoggedOut = false;
        let requestProfileIndex = 0;
        let activeSource = seed.channels.length > 0 ? 'page_seed' : '';
        let partialReason = '';

        const postProgress = (phase, extra = {}) => {
            window.postMessage({
                type: 'FilterTube_SubscriptionsImportProgress',
                payload: {
                    requestId,
                    phase,
                    pagesFetched,
                    foundCount: collected.size,
                    maxChannels,
                    ...extra
                },
                source: 'injector'
            }, '*');
        };

        if ((!Array.isArray(requestContext?.profiles) || requestContext.profiles.length === 0) && seed.channels.length === 0) {
            throw new Error('YouTube context unavailable');
        }

        postProgress('starting');

        if (seed.channels.length > 0) {
            for (let i = 0; i < seed.channels.length; i += 1) {
                const entry = seed.channels[i];
                const key = getSubscriptionImportEntryKey(entry);
                if (!key) continue;
                const existing = collected.get(key);
                collected.set(key, mergeSubscriptionImportEntries(existing, entry));
                if (collected.size >= maxChannels) {
                    break;
                }
            }

            pagesFetched = 1;
            continuation = seed.tokens.find((token) => token && !seenTokens.has(token)) || '';
            if (continuation) {
                seenTokens.add(continuation);
            }
            if (collected.size >= maxChannels) {
                continuation = '';
            }

            postProgress('page_seed', {
                pageRows: seed.channels.length,
                hasContinuation: !!continuation,
                source: activeSource
            });
        }

        while (continuation || collected.size === 0) {
            if ((Date.now() - startTs) > timeoutMs) {
                throw new Error('Subscription import timed out');
            }

            const requestProfile = requestContext.profiles[requestProfileIndex];
            if (!requestProfile?.context) {
                break;
            }

            const endpointUrl = requestContext.apiKey
                ? `/youtubei/v1/browse?prettyPrint=false&key=${encodeURIComponent(requestContext.apiKey)}`
                : '/youtubei/v1/browse?prettyPrint=false';
            const requestBody = continuation
                ? { context: requestProfile.context, continuation }
                : { context: requestProfile.context, browseId: requestProfile.browseId || 'FEchannels' };

            const remainingBudgetMs = Math.max(1500, timeoutMs - (Date.now() - startTs));
            const fetchTimeoutMs = Math.max(4000, Math.min(25000, remainingBudgetMs));
            const abortController = typeof AbortController === 'function' ? new AbortController() : null;
            const abortTimer = abortController
                ? setTimeout(() => {
                    try {
                        abortController.abort();
                    } catch (e) {
                    }
                }, fetchTimeoutMs)
                : null;

            let response = null;
            try {
                response = await fetch(endpointUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: buildSubscriptionImportHeaders(requestProfile),
                    body: JSON.stringify(requestBody),
                    ...(abortController ? { signal: abortController.signal } : {})
                });
            } catch (error) {
                if (abortTimer) {
                    clearTimeout(abortTimer);
                }

                const timeoutLikeError = error?.name === 'AbortError'
                    ? `Subscriptions request timed out (${fetchTimeoutMs}ms)`
                    : (error?.message || 'Subscriptions request failed');
                const canSwitchProfile = requestProfileIndex < (requestContext.profiles.length - 1);
                if (canSwitchProfile) {
                    requestProfileIndex += 1;
                    activeSource = requestContext.profiles[requestProfileIndex]?.source || activeSource;
                    postProgress('retrying_source', {
                        hasContinuation: !!continuation,
                        source: activeSource,
                        error: timeoutLikeError
                    });
                    continue;
                }

                if (collected.size > 0) {
                    partialReason = timeoutLikeError;
                    break;
                }

                throw new Error(timeoutLikeError);
            } finally {
                if (abortTimer) {
                    clearTimeout(abortTimer);
                }
            }

            let rawText = '';
            let data = null;
            try {
                rawText = await response.text();
            } catch (e) {
            }

            if (!response.ok) {
                try {
                    data = rawText ? JSON.parse(rawText) : null;
                } catch (e) {
                }

                const fallbackMessage = (typeof data?.error?.message === 'string' ? data.error.message.trim() : '')
                    || (typeof data?.message === 'string' ? data.message.trim() : '')
                    || `Subscriptions request failed (${response.status})`;
                const canSwitchProfile = requestProfileIndex < (requestContext.profiles.length - 1);
                const canRetryWithAlternateProfile = canSwitchProfile;
                if (canRetryWithAlternateProfile) {
                    requestProfileIndex += 1;
                    activeSource = requestContext.profiles[requestProfileIndex]?.source || activeSource;
                    postProgress('retrying_source', {
                        hasContinuation: !!continuation,
                        status: response.status,
                        source: activeSource
                    });
                    continue;
                }

                if (collected.size > 0) {
                    partialReason = fallbackMessage;
                    break;
                }

                throw new Error(fallbackMessage);
            }

            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch (e) {
                if (collected.size > 0) {
                    partialReason = 'Stopped after a partial subscriptions response.';
                    break;
                }
                throw new Error('Failed to parse subscriptions response');
            }

            const { renderers, tokens } = collectSubscriptionImportArtifacts(data);
            const responseLoggedOut = detectLoggedOutBrowseResponse(data);
            const shouldRetryLoggedOutProfile = responseLoggedOut
                && collected.size === 0
                && renderers.length === 0
                && tokens.length === 0
                && requestProfileIndex < (requestContext.profiles.length - 1);

            if (shouldRetryLoggedOutProfile) {
                requestProfileIndex += 1;
                activeSource = requestContext.profiles[requestProfileIndex]?.source || activeSource;
                postProgress('retrying_source', {
                    hasContinuation: !!continuation,
                    source: activeSource,
                    loggedOut: true
                });
                await sleep(Math.min(pageDelayMs, 120));
                continue;
            }

            lastLoggedOut = responseLoggedOut;
            pagesFetched += 1;
            activeSource = requestProfile.source || activeSource || 'subscriptions_import';

            for (let i = 0; i < renderers.length; i += 1) {
                const normalized = normalizeSubscriptionImportEntry(renderers[i]);
                if (!normalized) continue;
                const key = getSubscriptionImportEntryKey(normalized);
                if (!key) continue;
                const existing = collected.get(key);
                collected.set(key, mergeSubscriptionImportEntries(existing, normalized));
                if (collected.size >= maxChannels) {
                    break;
                }
            }

            const nextToken = tokens.find((token) => token && !seenTokens.has(token)) || '';
            if (nextToken) {
                seenTokens.add(nextToken);
            }

            postProgress('page', {
                pageRows: renderers.length,
                hasContinuation: !!nextToken,
                source: activeSource
            });

            if (collected.size >= maxChannels) {
                break;
            }

            if (!nextToken) {
                break;
            }

            continuation = nextToken;
            await sleep(pageDelayMs);
        }

        const channels = Array.from(collected.values()).slice(0, maxChannels);
        if (channels.length === 0 && lastLoggedOut) {
            return {
                success: false,
                error: 'Sign in to YouTube first',
                errorCode: 'signed_out',
                channels: [],
                stats: {
                    pagesFetched,
                    totalFound: 0,
                    source: 'mweb_fechannels'
                }
            };
        }

        return {
            success: true,
            channels,
            stats: {
                pagesFetched,
                totalFound: channels.length,
                truncated: collected.size > maxChannels,
                partial: !!partialReason,
                partialReason: partialReason || null,
                source: activeSource || 'subscriptions_import'
            }
        };
    }

    function tokenizeExpectedCollaboratorNames(values = []) {
        const normalizedTokens = new Set();
        const compactTokens = new Set();

        const pushToken = (value) => {
            const normalized = normalizeLooseText(value);
            if (!normalized) return;
            normalizedTokens.add(normalized);

            const compact = normalized.replace(/[^a-z0-9]/g, '');
            if (compact) {
                compactTokens.add(compact);
            }
        };

        values.forEach((value) => {
            if (typeof value !== 'string') return;
            const trimmed = value.trim();
            if (!trimmed) return;

            pushToken(trimmed);

            const withoutMore = trimmed
                .replace(/\band\s+\d+\s+more\b/ig, '')
                .replace(/\band\s+more\b/ig, '')
                .trim();

            if (!withoutMore) return;

            const splitTokens = withoutMore
                .split(/\s*(?:,|&|\band\b)\s*/i)
                .map((token) => token.trim())
                .filter(Boolean);

            splitTokens.forEach(pushToken);
        });

        return {
            normalized: normalizedTokens,
            compact: compactTokens
        };
    }

    function buildExpectedMatcher(payload) {
        const expectedNames = Array.isArray(payload?.expectedNames) ? payload.expectedNames : [];
        const expectedHandles = Array.isArray(payload?.expectedHandles) ? payload.expectedHandles : [];
        const expectedCollaboratorCount = parseInt(payload?.expectedCollaboratorCount || '0', 10) || 0;
        const allowRosterFallbackForCollabMarkup = Boolean(
            payload?.allowRosterFallbackForCollabMarkup ||
            expectedCollaboratorCount > 2 ||
            expectedNames.some((value) => /\band\s+(?:\d+\s+)?more\b/i.test(value || ''))
        );

        const tokenizedNames = tokenizeExpectedCollaboratorNames(expectedNames);
        const nameSet = tokenizedNames.normalized;
        const compactExpectedNames = Array.from(tokenizedNames.compact);
        const handleSet = new Set(expectedHandles.map(normalizeExpectedHandle).filter(Boolean));

        // If caller didn't send expectations, we must not reject results solely on that.
        const hasAny = nameSet.size > 0 || handleSet.size > 0;

        return {
            hasAny,
            allowRosterFallbackForCollabMarkup,
            expectedCollaboratorCount,
            handleCount: handleSet.size,
            matchesAny(collaborator) {
                if (!hasAny) return true;
                if (!collaborator || typeof collaborator !== 'object') return false;
                const name = normalizeLooseText(collaborator.name);
                const compactName = name.replace(/[^a-z0-9]/g, '');
                const handle = normalizeExpectedHandle(collaborator.handle);
                const fuzzyNameMatch = compactName
                    ? compactExpectedNames.some((expected) => {
                        if (!expected) return false;
                        const minLen = Math.min(expected.length, compactName.length);
                        if (minLen < 4) return false;
                        return compactName.startsWith(expected) || expected.startsWith(compactName);
                    })
                    : false;
                return (
                    (name && nameSet.has(name)) ||
                    fuzzyNameMatch ||
                    (handle && handleSet.has(handle))
                );
            }
        };
    }

    function isValidCollaboratorResponse(list, matcher) {
        if (!Array.isArray(list) || list.length < 2) return false;

        // Prevent obvious garbage: all entries empty/placeholder-ish.
        const hasAnyIdentity = list.some(c => {
            if (!c || typeof c !== 'object') return false;
            const id = typeof c.id === 'string' ? c.id.trim() : '';
            const handle = typeof c.handle === 'string' ? c.handle.trim() : '';
            const name = typeof c.name === 'string' ? c.name.trim() : '';
            const customUrl = typeof c.customUrl === 'string' ? c.customUrl.trim() : '';
            return Boolean(id || handle || customUrl || name);
        });
        if (!hasAnyIdentity) return false;

        // If expectations were provided, require at least one collaborator to match.
        if (matcher && matcher.hasAny) {
            if (list.some(c => matcher.matchesAny(c))) {
                return true;
            }

            if (matcher.allowRosterFallbackForCollabMarkup) {
                const strongIdentityCount = list.reduce((count, collaborator) => {
                    if (!collaborator || typeof collaborator !== 'object') return count;
                    const hasStrongIdentity = Boolean(
                        (typeof collaborator.id === 'string' && /^UC[\w-]{22}$/i.test(collaborator.id.trim())) ||
                        (typeof collaborator.handle === 'string' && collaborator.handle.trim()) ||
                        (typeof collaborator.customUrl === 'string' && collaborator.customUrl.trim())
                    );
                    return count + (hasStrongIdentity ? 1 : 0);
                }, 0);

                if (strongIdentityCount >= Math.min(2, list.length)) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    function scoreCollaboratorCandidate(list, matcher, depth = 0) {
        if (!Array.isArray(list) || list.length < 2) return -1;
        if (!isValidCollaboratorResponse(list, matcher)) return -1;

        const matchCount = matcher?.hasAny
            ? list.reduce((count, collaborator) => count + (matcher.matchesAny(collaborator) ? 1 : 0), 0)
            : list.length;
        const matchRatio = matcher?.hasAny ? matchCount / list.length : 1;

        const strongIdentityCount = list.reduce((count, collaborator) => {
            if (!collaborator || typeof collaborator !== 'object') return count;
            if (collaborator.id) return count + 1;
            if (collaborator.handle || collaborator.customUrl) return count + 0.5;
            return count;
        }, 0);

        const quality = getCollaboratorListQuality(list);
        const depthPenalty = Math.min(10, Math.max(0, depth));

        return (
            quality * 25 +
            list.length * 12 +
            strongIdentityCount * 8 +
            matchCount * 6 +
            matchRatio * 50 -
            depthPenalty
        );
    }

    function cacheCollaboratorsIfBetter(videoId, collaborators = []) {
        if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) {
            return collaboratorCache.get(videoId) || null;
        }
        const incomingScore = getCollaboratorListQuality(collaborators);
        const existing = collaboratorCache.get(videoId);
        const existingScore = getCollaboratorListQuality(existing);
        if (!existing || incomingScore >= existingScore) {
            collaboratorCache.set(videoId, collaborators);
            return collaborators;
        }
        return existing;
    }

    // Listen for settings and data requests from content_bridge
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data) return;

        const { type, payload, source } = event.data;

        // Ignore our own messages and only accept from content_bridge or filter_logic
        if (source === 'injector') return;

        if (type === 'FilterTube_SettingsToInjector' && source === 'content_bridge') {
            postLog('log', 'Received settings from content_bridge:', {
                keywords: payload.filterKeywords?.length || 0,
                channels: payload.filterChannels?.length || 0,
                hideAllComments: payload.hideAllComments,
                hideAllShorts: payload.hideAllShorts
            });

            // Update current settings
            currentSettings = { ...currentSettings, ...payload };
            settingsReceived = true;

            // Update seed.js via global filterTube object
            updateSeedSettings();

            // Process any queued data
            processInitialDataQueue();
        }

        // Handle collaboration data caching from filter_logic.js
        if (type === 'FilterTube_CacheCollaboratorInfo' && source === 'filter_logic') {
            const { videoId, collaborators } = payload;
            if (videoId && Array.isArray(collaborators) && collaborators.length > 0) {
                const cached = cacheCollaboratorsIfBetter(videoId, collaborators);
                if (cached === collaborators) {
                    postLog('log', `📥 Cached collaboration data for video: ${videoId}, collaborators: ${collaborators.length}`);
                } else {
                    postLog('log', `📥 Ignored poorer collaboration cache for video: ${videoId}`);
                }
            }
        }

        // Handle collaborator info request from content_bridge (Isolated World)
        if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge') {
            const { videoId, requestId } = payload;
            postLog('log', `Received collaborator info request for video: ${videoId}`);

            let collaboratorInfo = null;

            try {
                const matcher = buildExpectedMatcher(payload || {});

                // First check cache (for dynamically loaded videos)
                collaboratorInfo = collaboratorCache.get(videoId);
                let collaboratorScore = getCollaboratorListQuality(collaboratorInfo);

                // If not in cache, or ytInitialData has richer data, search ytInitialData
                const ytInitialDataCollaborators = searchYtInitialDataForCollaborators(videoId, matcher);
                const ytScore = getCollaboratorListQuality(ytInitialDataCollaborators);

                const cacheValid = isValidCollaboratorResponse(collaboratorInfo, matcher);
                const ytValid = isValidCollaboratorResponse(ytInitialDataCollaborators, matcher);

                if (ytValid && (!cacheValid || ytScore > collaboratorScore)) {
                    collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                    collaboratorScore = ytScore;
                } else if (!cacheValid && ytValid) {
                    collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                    collaboratorScore = ytScore;
                } else if (!cacheValid) {
                    // Do not return a single-channel or mismatched collaborator list; it can poison block actions.
                    collaboratorInfo = null;
                }
            } catch (error) {
                collaboratorInfo = null;
                postLog('error', `Collaborator lookup failed for ${videoId}: ${error?.message || error}`);
            }

            // Send response back to content_bridge
            window.postMessage({
                type: 'FilterTube_CollaboratorInfoResponse',
                payload: {
                    videoId,
                    requestId,
                    collaborators: collaboratorInfo || null
                },
                source: 'injector'
            }, '*');

            postLog('log', `Sent collaborator info response:`, collaboratorInfo?.length || 0, 'collaborators');
        }

        // Handle single-channel info request from content_bridge (for UC ID + handle lookup)
        if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge') {
            const { videoId, requestId, expectedHandle, expectedName } = payload || {};
            postLog('log', `Received channel info request for video: ${videoId}`);

            let channel = null;
            if (videoId) {
                channel = searchYtInitialDataForVideoChannel(videoId, {
                    expectedHandle: extractRawHandle(expectedHandle) || expectedHandle,
                    expectedName
                });
            }

            window.postMessage({
                type: 'FilterTube_ChannelInfoResponse',
                payload: {
                    videoId,
                    requestId,
                    channel
                },
                source: 'injector'
            }, '*');

            if (channel) {
                postLog('log', 'Sent channel info response:', channel);
            } else {
                postLog('log', 'No channel info found for video:', videoId);
            }
        }

        if (type === 'FilterTube_RequestSubscriptionImport' && source === 'content_bridge') {
            const { requestId } = payload || {};
            postLog('log', `Received subscriptions import request: ${requestId || 'n/a'}`);

            (async () => {
                let responsePayload = null;
                try {
                    responsePayload = await fetchSubscribedChannelsFromYoutubei(requestId, payload || {});
                } catch (error) {
                    responsePayload = {
                        success: false,
                        error: error?.message || 'Subscription import failed',
                        errorCode: 'fetch_failed',
                        channels: [],
                        stats: {
                            pagesFetched: 0,
                            totalFound: 0,
                            source: 'mweb_fechannels'
                        }
                    };
                    postLog('error', `Subscriptions import failed: ${responsePayload.error}`);
                }

                window.postMessage({
                    type: 'FilterTube_SubscriptionsImportResponse',
                    payload: {
                        requestId,
                        ...responsePayload
                    },
                    source: 'injector'
                }, '*');

                postLog('log', 'Sent subscriptions import response:', {
                    requestId,
                    success: !!responsePayload?.success,
                    count: Array.isArray(responsePayload?.channels) ? responsePayload.channels.length : 0
                });
            })();
        }
    });

    window.filterTubeInjectorBridgeReady = true;
    window.postMessage({
        type: 'FilterTube_InjectorBridgeReady',
        source: 'injector'
    }, '*');
    postLog('log', 'Injector bridge is ready for requests');

    /**
     * Extract collaborators from a raw renderer/data object
     * Works for both cached ytInitialData objects and live DOM component data
     * @param {Object} obj
     * @returns {Array|null}
     */
    function extractCollaboratorsFromDataObject(obj) {
        if (!obj || typeof obj !== 'object') return null;

        const extractFromAvatarStackViewModel = (stack) => {
            const avatars = stack?.avatars;
            if (!Array.isArray(avatars) || avatars.length === 0) return null;
            const collaborators = [];
            const seen = new Set();

            const parseBrowseIdFromUrl = (url) => {
                if (!url || typeof url !== 'string') return '';
                const match = url.match(/(?:channel\/)?(UC[\w-]{22})/i);
                return match?.[1] || '';
            };

            const pickEndpointUrl = (node) => {
                if (!node || typeof node !== 'object') return '';
                return (
                    node?.commandMetadata?.webCommandMetadata?.url ||
                    node?.webCommandMetadata?.url ||
                    node?.url ||
                    ''
                );
            };

            const resolveBrowseEndpoint = (node) => {
                if (!node || typeof node !== 'object') return null;
                return (
                    node?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                    node?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    node?.rendererContext?.commandContext?.onTap?.browseEndpoint ||
                    node?.onTap?.innertubeCommand?.browseEndpoint ||
                    node?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    node?.onTap?.browseEndpoint ||
                    node?.navigationEndpoint?.browseEndpoint ||
                    node?.browseEndpoint ||
                    null
                );
            };

            for (const entry of avatars) {
                const vm = entry?.avatarViewModel || entry?.avatar || entry;

                const endpoint = resolveBrowseEndpoint(vm) || resolveBrowseEndpoint(entry) || null;
                const browseId = endpoint?.browseId || '';
                const endpointUrl = pickEndpointUrl(endpoint) || pickEndpointUrl(vm) || pickEndpointUrl(entry) || '';
                const canonicalBaseUrl = endpoint?.canonicalBaseUrl || endpointUrl || '';

                const collab = { name: '', id: '', handle: '', customUrl: '' };
                const inferredId = (browseId && typeof browseId === 'string') ? browseId : '';
                const urlId = parseBrowseIdFromUrl(canonicalBaseUrl);
                const finalId = (inferredId && inferredId.toUpperCase().startsWith('UC')) ? inferredId : (urlId ? urlId : '');
                if (finalId) collab.id = finalId;

                if (canonicalBaseUrl && typeof canonicalBaseUrl === 'string') {
                    const extracted = extractRawHandle(canonicalBaseUrl);
                    if (extracted) collab.handle = extracted;
                    const custom = extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl);
                    if (custom) collab.customUrl = custom;
                }

                const label = entry?.a11yLabel || vm?.a11yLabel || vm?.accessibilityText || '';
                if (typeof label === 'string' && label.trim()) {
                    const cleaned = label.replace(/\bgo to channel\b/i, '').trim();
                    if (cleaned && !cleaned.startsWith('@')) {
                        collab.name = cleaned;
                    }
                }

                const key = (collab.id || collab.handle || collab.customUrl || collab.name || '').toLowerCase();
                if (!key || seen.has(key)) continue;
                seen.add(key);
                collaborators.push(collab);
            }

            return collaborators.length > 0 ? collaborators : null;
        };

        const extractFromSheetLikeCommand = (command) => {
            if (!command || typeof command !== 'object') return null;

            const normalizeUcId = (value) => {
                const raw = typeof value === 'string' ? value.trim() : '';
                return /^UC[\w-]{22}$/i.test(raw) ? raw : '';
            };

            const pickTextContent = (value) => {
                if (!value) return '';
                if (typeof value === 'string' && value.trim()) return value.trim();
                if (typeof value?.content === 'string' && value.content.trim()) return value.content.trim();
                if (typeof value?.simpleText === 'string' && value.simpleText.trim()) return value.simpleText.trim();
                if (Array.isArray(value?.runs)) {
                    const text = value.runs.map((run) => run?.text || '').join('').trim();
                    if (text) return text;
                }
                return '';
            };

            const pickTitleText = (viewModel) => {
                const title = viewModel?.title;
                return pickTextContent(title);
            };

            const pickSubtitleText = (viewModel) => {
                const subtitle = viewModel?.subtitle;
                return pickTextContent(subtitle);
            };

            const resolveCommandContext = (viewModel) => {
                const titleRunCommand = Array.isArray(viewModel?.title?.commandRuns)
                    ? (viewModel.title.commandRuns[0]?.onTap?.innertubeCommand || viewModel.title.commandRuns[0]?.onTap?.command || null)
                    : null;
                const contextCommand =
                    viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand ||
                    viewModel?.rendererContext?.commandContext?.onTap?.command ||
                    viewModel?.rendererContext?.commandContext?.onTap ||
                    null;
                const browseEndpoint =
                    titleRunCommand?.browseEndpoint ||
                    contextCommand?.browseEndpoint ||
                    viewModel?.navigationEndpoint?.browseEndpoint ||
                    null;
                const commandUrl =
                    titleRunCommand?.commandMetadata?.webCommandMetadata?.url ||
                    contextCommand?.commandMetadata?.webCommandMetadata?.url ||
                    browseEndpoint?.canonicalBaseUrl ||
                    '';
                return {
                    browseEndpoint,
                    commandUrl: typeof commandUrl === 'string' ? commandUrl : ''
                };
            };

            const candidateSources = [
                {
                    items: command?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                    header: pickTextContent(command?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'sheetViewModel'
                },
                {
                    items: command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                    header: pickTextContent(command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showSheetCommand sheetViewModel'
                },
                {
                    items: command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                    header: pickTextContent(command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showDialogCommand sheetViewModel'
                },
                {
                    items: command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                    header: pickTextContent(command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'dialogViewModel customContent'
                },
                {
                    items: command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                    header: pickTextContent(command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'dialogViewModel'
                },
                {
                    items: command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                    header: pickTextContent(command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showDialogCommand dialogViewModel customContent'
                },
                {
                    items: command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                    header: pickTextContent(command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showDialogCommand dialogViewModel'
                },
                {
                    items: command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                    header: pickTextContent(command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showSheetCommand dialogViewModel customContent'
                },
                {
                    items: command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                    header: pickTextContent(command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.header?.panelHeaderViewModel?.title),
                    label: 'nested showSheetCommand dialogViewModel'
                },
                {
                    items: command?.listViewModel?.listItems,
                    header: '',
                    label: 'direct listViewModel'
                },
                {
                    items: command?.content?.listViewModel?.listItems,
                    header: '',
                    label: 'direct content.listViewModel'
                },
                {
                    items: command?.customContent?.listViewModel?.listItems,
                    header: '',
                    label: 'direct customContent.listViewModel'
                }
            ];

            const extractCollaboratorsFromListItems = (listItems) => {
                if (!Array.isArray(listItems) || listItems.length === 0) return null;
                const collaborators = [];
                const seen = new Set();

                for (const item of listItems) {
                    const viewModel = item?.listItemViewModel || item?.compactLinkViewModel || item?.content?.listItemViewModel || null;
                    if (!viewModel || typeof viewModel !== 'object') continue;

                    const title = pickTitleText(viewModel);
                    const subtitle = pickSubtitleText(viewModel);
                    const { browseEndpoint, commandUrl } = resolveCommandContext(viewModel);

                    const collab = {
                        name: title || '',
                        id: normalizeUcId(browseEndpoint?.browseId || ''),
                        handle: '',
                        customUrl: ''
                    };

                    if (commandUrl) {
                        const extractedHandle = extractRawHandle(commandUrl);
                        if (extractedHandle) collab.handle = extractedHandle;
                        const extractedCustomUrl = extractCustomUrlFromCanonicalBaseUrl(commandUrl);
                        if (extractedCustomUrl) collab.customUrl = extractedCustomUrl;
                    }

                    if (!collab.handle && subtitle) {
                        const subtitleHandle = extractRawHandle(subtitle);
                        if (subtitleHandle) collab.handle = subtitleHandle;
                    }

                    const key = (collab.id || collab.handle || collab.customUrl || collab.name || '').toLowerCase();
                    if (!key || seen.has(key)) continue;
                    seen.add(key);
                    collaborators.push(collab);
                }

                return collaborators.length > 0 ? collaborators : null;
            };

            let bestCandidate = null;
            let bestScore = -1;

            for (const candidate of candidateSources) {
                if (!Array.isArray(candidate.items) || candidate.items.length === 0) continue;
                const collaborators = extractCollaboratorsFromListItems(candidate.items);
                if (!Array.isArray(collaborators) || collaborators.length === 0) continue;

                const strongIdentityCount = collaborators.reduce((count, collaborator) => {
                    const hasStrongIdentity = Boolean(collaborator?.id || collaborator?.handle || collaborator?.customUrl);
                    return count + (hasStrongIdentity ? 1 : 0);
                }, 0);
                const headerLooksCollaborative = /collaborators?/i.test(candidate.header || '');
                const score =
                    (headerLooksCollaborative ? 1000 : 0) +
                    strongIdentityCount * 100 +
                    collaborators.length * 10 +
                    getCollaboratorListQuality(collaborators);

                if (headerLooksCollaborative || strongIdentityCount >= Math.min(2, collaborators.length)) {
                    if (score > bestScore) {
                        bestCandidate = collaborators;
                        bestScore = score;
                    }
                }
            }

            return bestCandidate;
        };

        // Handle raw stack objects passed directly.
        if (Array.isArray(obj.avatars)) {
            const extracted = extractFromAvatarStackViewModel(obj);
            if (Array.isArray(extracted) && extracted.length > 1) return extracted;
        }
        if (obj.avatarStackViewModel && Array.isArray(obj.avatarStackViewModel.avatars)) {
            const extracted = extractFromAvatarStackViewModel(obj.avatarStackViewModel);
            if (Array.isArray(extracted) && extracted.length > 1) return extracted;
        }

        let renderer = obj;
        if (renderer.content?.videoRenderer) {
            renderer = renderer.content.videoRenderer;
        } else if (renderer.richItemRenderer?.content?.videoRenderer) {
            renderer = renderer.richItemRenderer.content.videoRenderer;
        } else if (renderer.richItemRenderer?.content?.lockupViewModel) {
            renderer = renderer.richItemRenderer.content.lockupViewModel;
        } else if (renderer.lockupViewModel) {
            renderer = renderer.lockupViewModel;
        } else if (renderer.gridVideoRenderer) {
            renderer = renderer.gridVideoRenderer;
        } else if (renderer.playlistVideoRenderer) {
            renderer = renderer.playlistVideoRenderer;
        } else if (renderer.videoRenderer) {
            renderer = renderer.videoRenderer;
        } else if (renderer.data?.content?.videoRenderer) {
            renderer = renderer.data.content.videoRenderer;
        } else if (renderer.data?.content?.lockupViewModel) {
            renderer = renderer.data.content.lockupViewModel;
        }

        if (!renderer || typeof renderer !== 'object') return null;

        const bylineText = renderer.shortBylineText || renderer.longBylineText;
        if (bylineText?.runs) {
            for (const run of bylineText.runs) {
                const command =
                    run.navigationEndpoint?.showDialogCommand ||
                    run.navigationEndpoint?.showSheetCommand ||
                    run.navigationEndpoint?.innertubeCommand?.showDialogCommand ||
                    run.navigationEndpoint?.innertubeCommand?.showSheetCommand ||
                    null;
                if (!command) continue;

                const collaborators = extractFromSheetLikeCommand(command);
                if (collaborators) return collaborators;
            }
        }

        // Some surfaces expose collaboration via avatarStackViewModel rather than showDialogCommand.
        // Handle both wrapper objects ({ avatarStackViewModel: {...} }) and a raw stack object ({ avatars: [...] }).
        try {
            const visited = new WeakSet();
            const scan = (node, depth = 0) => {
                if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
                visited.add(node);
                if (node.avatarStackViewModel) {
                    const extracted = extractFromAvatarStackViewModel(node.avatarStackViewModel);
                    if (Array.isArray(extracted) && extracted.length > 1) {
                        return extracted;
                    }
                }
                if (Array.isArray(node.avatars)) {
                    const extracted = extractFromAvatarStackViewModel(node);
                    if (Array.isArray(extracted) && extracted.length > 1) {
                        return extracted;
                    }
                }
                if (Array.isArray(node)) {
                    for (const child of node.slice(0, 25)) {
                        const found = scan(child, depth + 1);
                        if (found) return found;
                    }
                    return null;
                }
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    const found = scan(value, depth + 1);
                    if (found) return found;
                }
                return null;
            };
            const stacked = scan(renderer);
            if (Array.isArray(stacked) && stacked.length > 1) {
                return stacked;
            }
        } catch (e) {
        }

        // Home lockupViewModel often doesn't expose bylineText runs; fall back to a bounded deep scan
        // for showDialog/showSheet command payloads anywhere inside the renderer.
        const visited = new WeakSet();
        function deepScanForShowDialog(node, depth = 0) {
            if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
            visited.add(node);

            const command = node.showDialogCommand || node.showSheetCommand || null;
            if (command) {
                const collaborators = extractFromSheetLikeCommand(command);
                if (collaborators) return collaborators;
            }

            if (Array.isArray(node)) {
                for (const child of node.slice(0, 25)) {
                    const found = deepScanForShowDialog(child, depth + 1);
                    if (found) return found;
                }
                return null;
            }

            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                const value = node[key];
                if (!value || typeof value !== 'object') continue;
                const found = deepScanForShowDialog(value, depth + 1);
                if (found) return found;
            }

            return null;
        }

        const deepScanned = deepScanForShowDialog(renderer);
        if (deepScanned) return deepScanned;

        const ownerRuns = renderer.ownerText?.runs || bylineText?.runs;
        if (ownerRuns) {
            for (const run of ownerRuns) {
                const ownerCommand =
                    run.navigationEndpoint?.showDialogCommand ||
                    run.navigationEndpoint?.showSheetCommand ||
                    run.navigationEndpoint?.innertubeCommand?.showDialogCommand ||
                    run.navigationEndpoint?.innertubeCommand?.showSheetCommand ||
                    null;
                if (ownerCommand) {
                    const collaborators = extractFromSheetLikeCommand(ownerCommand);
                    if (collaborators) return collaborators;
                }
                const browseEndpoint = run.navigationEndpoint?.browseEndpoint;
                if (!browseEndpoint) continue;

                const fallback = {
                    id: browseEndpoint.browseId,
                    name: run.text
                };
                if (browseEndpoint.canonicalBaseUrl) {
                    const extracted = extractRawHandle(browseEndpoint.canonicalBaseUrl);
                    if (extracted) fallback.handle = extracted;
                }

                if (fallback.id || fallback.handle || fallback.name) {
                    return [fallback];
                }
            }
        }

        return null;
    }

    /**
     * Search ytInitialData (MAIN world) for channel info associated with a video ID
     * Returns { id, handle, name } when possible.
     * This lives in injector.js because content_bridge (Isolated World) cannot
     * read window.ytInitialData directly.
     * @param {string} videoId
     * @returns {Object|null}
     */
    function normalizeChannelName(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function extractCustomUrlFromCanonicalBaseUrl(value) {
        if (!value || typeof value !== 'string') return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        const decoded = (() => {
            try {
                return decodeURIComponent(trimmed);
            } catch (e) {
                return trimmed;
            }
        })();

        const path = decoded.startsWith('http') ? (() => {
            try {
                return new URL(decoded).pathname;
            } catch (e) {
                return decoded;
            }
        })() : decoded;

        if (path.startsWith('/c/')) {
            const slug = path.split('/')[2] || '';
            return slug ? `c/${slug}` : '';
        }
        if (path.startsWith('/user/')) {
            const slug = path.split('/')[2] || '';
            return slug ? `user/${slug}` : '';
        }
        return '';
    }

    function extractChannelLogoFromObject(obj) {
        if (!obj || typeof obj !== 'object') return '';

        const candidates = [
            obj?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.channelAvatar?.sources?.[0]?.url,
            obj?.thumbnail?.thumbnails?.[0]?.url,
            obj?.thumbnail?.thumbnails?.[1]?.url,
            obj?.thumbnails?.[0]?.url,
            obj?.thumbnails?.[1]?.url
        ];

        for (const cand of candidates) {
            if (typeof cand === 'string' && cand.trim()) return cand.trim();
        }
        return '';
    }

    function mergeChannelCandidates(...candidates) {
        const merged = { id: null, handle: null, name: null, logo: null, customUrl: null };
        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== 'object') continue;
            if (!merged.id && typeof candidate.id === 'string' && candidate.id.trim()) merged.id = candidate.id.trim();
            if (!merged.handle && typeof candidate.handle === 'string' && candidate.handle.trim()) merged.handle = candidate.handle.trim();
            if (!merged.name && typeof candidate.name === 'string' && candidate.name.trim()) merged.name = candidate.name.trim();
            if (!merged.logo && typeof candidate.logo === 'string' && candidate.logo.trim()) merged.logo = candidate.logo.trim();
            if (!merged.customUrl && typeof candidate.customUrl === 'string' && candidate.customUrl.trim()) merged.customUrl = candidate.customUrl.trim();
        }
        const hasAny = Boolean(merged.id || merged.handle || merged.name || merged.logo || merged.customUrl);
        return hasAny ? merged : null;
    }

    function searchYtInitialDataForVideoChannel(videoId, expectations = {}) {
        if (!videoId) {
            postLog('log', 'Channel search skipped - missing videoId');
            return null;
        }

        // IMPORTANT: Do not require ytInitialData to exist.
        // On many surfaces (especially YouTube Kids), the most reliable identity comes
        // from stashed network snapshots (lastYtBrowseResponse/lastYtNextResponse/lastYtPlayerResponse).
        // This function must continue as long as ANY snapshot root exists.
        postLog('log', `Searching snapshots for channel of video: ${videoId}`);

        let foundVideoObject = false;
        let matchedTargetVideo = false;
        const visited = new WeakSet();
        const options = (expectations && typeof expectations === 'object') ? expectations : {};
        const normalizedExpectedHandle = typeof options.expectedHandle === 'string'
            ? (extractRawHandle(options.expectedHandle) || options.expectedHandle).trim().toLowerCase()
            : '';
        const normalizedExpectedName = normalizeChannelName(options.expectedName);
        const hasExpectations = Boolean(normalizedExpectedHandle || normalizedExpectedName);
        let fallbackCandidate = null;

        const isWatchContext = (() => {
            try {
                return typeof document !== 'undefined' && (document.location?.pathname || '').startsWith('/watch');
            } catch (e) {
                return false;
            }
        })();
        const isCurrentWatchVideo = (() => {
            if (!isWatchContext) return false;
            try {
                const params = new URLSearchParams(document.location?.search || '');
                return params.get('v') === videoId;
            } catch (e) {
                return false;
            }
        })();

        const extractOwnerCandidate = (ownerRenderer) => {
            if (!ownerRenderer || typeof ownerRenderer !== 'object') return null;
            const endpoint =
                ownerRenderer?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                null;
            const browseId = endpoint?.browseId || '';
            const canonicalBaseUrl = endpoint?.canonicalBaseUrl || '';
            const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || null) : null;
            const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || null) : null;
            const name = ownerRenderer?.title?.runs?.[0]?.text || ownerRenderer?.title?.simpleText || ownerRenderer?.shortBylineText?.runs?.[0]?.text || '';
            const logo = extractChannelLogoFromObject(ownerRenderer) || '';
            const candidate = {
                id: (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) ? browseId : null,
                handle: handle || null,
                name: name || null,
                logo: logo || null,
                customUrl: customUrl || null
            };

            if (!candidate.id && !candidate.handle && !candidate.name && !candidate.logo && !candidate.customUrl) {
                return null;
            }
            if (!hasExpectations || matchesExpectations(candidate)) {
                return candidate;
            }
            if (!fallbackCandidate) {
                fallbackCandidate = candidate;
            }
            return null;
        };

        const extractThumbnailOwnerCandidate = (renderer) => {
            const ownerRenderer =
                renderer?.channelThumbnail?.channelThumbnailWithLinkRenderer ||
                renderer?.channelThumbnailWithLinkRenderer ||
                renderer?.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer ||
                renderer?.owner?.channelThumbnailWithLinkRenderer ||
                null;
            if (!ownerRenderer || typeof ownerRenderer !== 'object') return null;

            const endpoint =
                ownerRenderer?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.navigationEndpoint?.command?.browseEndpoint ||
                null;
            const browseId = typeof endpoint?.browseId === 'string' ? endpoint.browseId.trim() : '';
            const canonicalBaseUrl =
                endpoint?.canonicalBaseUrl ||
                ownerRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                ownerRenderer?.navigationEndpoint?.urlEndpoint?.url ||
                '';
            const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || null) : null;
            const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || null) : null;
            let name =
                ownerRenderer?.accessibility?.accessibilityData?.label ||
                ownerRenderer?.title?.simpleText ||
                ownerRenderer?.title?.runs?.[0]?.text ||
                '';
            if (typeof name === 'string') {
                name = name.replace(/^go to channel\s+/i, '').replace(/\.\s*go to channel\.?$/i, '').trim();
            }

            const candidate = {
                id: (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) ? browseId : null,
                handle: handle || null,
                name: name || null,
                customUrl: customUrl || null
            };
            return mergeChannelCandidates(candidate);
        };

        const extractFromPlayerResponse = (player) => {
            if (!player || typeof player !== 'object') return null;
            const details = player.videoDetails || null;
            const micro = player.microformat?.playerMicroformatRenderer || null;
            const playerVideoId = (typeof details?.videoId === 'string') ? details.videoId : '';
            if (!playerVideoId) return null;
            if (playerVideoId !== videoId) return null;
            matchedTargetVideo = true;
            const id = details?.channelId || null;
            const name = details?.author || micro?.ownerChannelName || null;
            const profileUrl = micro?.ownerProfileUrl || micro?.ownerProfileUrl?.url || null;
            const handle = profileUrl ? (extractRawHandle(profileUrl) || null) : null;
            const customUrl = profileUrl ? (extractCustomUrlFromCanonicalBaseUrl(profileUrl) || null) : null;
            const candidate = { id, handle, name, customUrl };
            return mergeChannelCandidates(candidate);
        };

        const watchOwnerCandidate = (() => {
            const initialDataRoot = window.ytInitialData || window.filterTube?.lastYtInitialData || window.filterTube?.rawYtInitialData || null;
            if (!isCurrentWatchVideo || !initialDataRoot) return null;
            const visitedOwner = new WeakSet();
            const scan = (node, depth = 0) => {
                if (!node || typeof node !== 'object' || visitedOwner.has(node) || depth > 10) return null;
                visitedOwner.add(node);
                if (node.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer) {
                    const cand = extractOwnerCandidate(node.videoSecondaryInfoRenderer.owner.videoOwnerRenderer);
                    if (cand) return cand;
                }
                if (node.videoOwnerRenderer) {
                    const cand = extractOwnerCandidate(node.videoOwnerRenderer);
                    if (cand) return cand;
                }
                if (Array.isArray(node)) {
                    for (const child of node.slice(0, 40)) {
                        const found = scan(child, depth + 1);
                        if (found) return found;
                    }
                    return null;
                }
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    const found = scan(value, depth + 1);
                    if (found) return found;
                }
                return null;
            };
            return scan(initialDataRoot);
        })();

        // Build the list of roots to search.
        // We include ytInitialData when present, but DO NOT depend on it.
        const searchTargets = [];
        if (window.ytInitialData) {
            searchTargets.push({ root: window.ytInitialData, label: 'ytInitialData' });
        }
        if (window.filterTube?.lastYtInitialData) {
            searchTargets.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
        }
        if (window.filterTube?.rawYtInitialData) {
            searchTargets.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
        }

        if (window.filterTube?.lastYtNextResponse) {
            searchTargets.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
        }
        if (window.filterTube?.lastYtBrowseResponse) {
            searchTargets.push({ root: window.filterTube.lastYtBrowseResponse, label: 'filterTube.lastYtBrowseResponse' });
        }

        const ftPlayer = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse;
        if (ftPlayer) {
            searchTargets.push({ root: ftPlayer, label: 'filterTube.lastYtInitialPlayerResponse' });
        } else if (window.ytInitialPlayerResponse) {
            searchTargets.push({ root: window.ytInitialPlayerResponse, label: 'ytInitialPlayerResponse' });
        }

        if (window.filterTube?.lastYtPlayerResponse) {
            searchTargets.push({ root: window.filterTube.lastYtPlayerResponse, label: 'filterTube.lastYtPlayerResponse' });
        }

        if (searchTargets.length === 0) {
            postLog('log', 'Channel search skipped - no snapshot roots available');
            return null;
        }

        function matchesExpectations(candidate) {
            if (!candidate) return false;
            if (!hasExpectations) return true;
            if (normalizedExpectedHandle) {
                const candidateHandle = candidate.handle ? candidate.handle.toLowerCase() : '';
                // Only enforce when candidate has a handle; some ytInitialData nodes provide UC ID only.
                if (candidateHandle && candidateHandle !== normalizedExpectedHandle) {
                    return false;
                }
            }
            if (normalizedExpectedName) {
                const candidateName = normalizeChannelName(candidate.name);
                // Only enforce when candidate has a name; some nodes omit byline text.
                if (candidateName && candidateName !== normalizedExpectedName) {
                    return false;
                }
            }
            return true;
        }

        const extractVideoIdFromNode = (node) => {
            if (!node || typeof node !== 'object') return '';
            const direct =
                node.videoId ||
                node.contentId ||
                node?.watchEndpoint?.videoId ||
                node?.navigationEndpoint?.watchEndpoint?.videoId ||
                node?.reelWatchEndpoint?.videoId ||
                node?.navigationEndpoint?.reelWatchEndpoint?.videoId ||
                '';
            if (direct && typeof direct === 'string') return direct;

            const urlCandidate =
                node?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.navigationEndpoint?.watchEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.commandMetadata?.webCommandMetadata?.url ||
                '';
            if (urlCandidate && typeof urlCandidate === 'string') {
                const match = urlCandidate.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (match && match[1]) return match[1];
                const watchMatch = urlCandidate.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (watchMatch && watchMatch[1]) return watchMatch[1];
            }
            return '';
        };

        const pickSingleChannelFromCollaborators = (collaborators) => {
            if (!Array.isArray(collaborators) || collaborators.length === 0) return null;

            const normalizedCandidates = [];
            const seen = new Set();
            for (const collaborator of collaborators) {
                if (!collaborator || typeof collaborator !== 'object') continue;
                const candidate = {
                    id: (typeof collaborator.id === 'string' && collaborator.id.trim()) ? collaborator.id.trim() : null,
                    handle: (typeof collaborator.handle === 'string' && collaborator.handle.trim()) ? collaborator.handle.trim() : null,
                    name: (typeof collaborator.name === 'string' && collaborator.name.trim()) ? collaborator.name.trim() : null,
                    logo: (typeof collaborator.logo === 'string' && collaborator.logo.trim()) ? collaborator.logo.trim() : null,
                    customUrl: (typeof collaborator.customUrl === 'string' && collaborator.customUrl.trim()) ? collaborator.customUrl.trim() : null
                };
                const key = (candidate.id || candidate.handle || candidate.customUrl || candidate.name || '').toLowerCase();
                if (!key || seen.has(key)) continue;
                seen.add(key);
                normalizedCandidates.push(candidate);
            }

            if (normalizedCandidates.length === 0) return null;

            if (hasExpectations) {
                const exactMatch = normalizedCandidates.find(matchesExpectations);
                if (exactMatch) {
                    return exactMatch;
                }
            }

            return normalizedCandidates.length === 1 ? normalizedCandidates[0] : null;
        };

        const extractSingleChannelFromSheetLikeData = (node) => {
            const collaborators = extractCollaboratorsFromDataObject(node);
            return pickSingleChannelFromCollaborators(collaborators);
        };

        function searchNode(node, visited) {
            if (!node || typeof node !== 'object' || visited.has(node)) return null;
            visited.add(node);

            let candidateNode = node;
            if (candidateNode.videoRenderer) {
                candidateNode = candidateNode.videoRenderer;
            } else if (candidateNode.gridVideoRenderer) {
                candidateNode = candidateNode.gridVideoRenderer;
            } else if (candidateNode.compactVideoRenderer) {
                candidateNode = candidateNode.compactVideoRenderer;
            } else if (candidateNode.videoWithContextRenderer) {
                candidateNode = candidateNode.videoWithContextRenderer;
            } else if (candidateNode.playlistPanelVideoRenderer) {
                candidateNode = candidateNode.playlistPanelVideoRenderer;
            } else if (candidateNode.playlistVideoRenderer) {
                candidateNode = candidateNode.playlistVideoRenderer;
            } else if (candidateNode.compactRadioRenderer) {
                candidateNode = candidateNode.compactRadioRenderer;
            } else if (candidateNode.reelItemRenderer) {
                candidateNode = candidateNode.reelItemRenderer;
            } else if (candidateNode.shortsLockupViewModel) {
                candidateNode = candidateNode.shortsLockupViewModel;
            } else if (candidateNode.shortsLockupViewModelV2) {
                candidateNode = candidateNode.shortsLockupViewModelV2;
            } else if (candidateNode.lockupViewModel) {
                candidateNode = candidateNode.lockupViewModel;
            } else if (candidateNode.richItemRenderer?.content?.videoRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.videoRenderer;
            } else if (candidateNode.richItemRenderer?.content?.videoWithContextRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.videoWithContextRenderer;
            } else if (candidateNode.richItemRenderer?.content?.playlistPanelVideoRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.playlistPanelVideoRenderer;
            } else if (candidateNode.richItemRenderer?.content?.playlistVideoRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.playlistVideoRenderer;
            } else if (candidateNode.richItemRenderer?.content?.compactVideoRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.compactVideoRenderer;
            } else if (candidateNode.richItemRenderer?.content?.compactRadioRenderer) {
                candidateNode = candidateNode.richItemRenderer.content.compactRadioRenderer;
            } else if (candidateNode.content?.videoRenderer) {
                candidateNode = candidateNode.content.videoRenderer;
            } else if (candidateNode.content?.videoWithContextRenderer) {
                candidateNode = candidateNode.content.videoWithContextRenderer;
            } else if (candidateNode.content?.playlistPanelVideoRenderer) {
                candidateNode = candidateNode.content.playlistPanelVideoRenderer;
            } else if (candidateNode.content?.playlistVideoRenderer) {
                candidateNode = candidateNode.content.playlistVideoRenderer;
            } else if (candidateNode.content?.compactVideoRenderer) {
                candidateNode = candidateNode.content.compactVideoRenderer;
            } else if (candidateNode.content?.compactRadioRenderer) {
                candidateNode = candidateNode.content.compactRadioRenderer;
            }

            // Direct hit: object with our videoId
            const nodeVideoId = extractVideoIdFromNode(node);
            const candidateVideoId = extractVideoIdFromNode(candidateNode);
            const effectiveVideoId = candidateVideoId || nodeVideoId;

            if (effectiveVideoId === videoId) {
                foundVideoObject = true;
                matchedTargetVideo = true;
                const sheetCandidate = extractSingleChannelFromSheetLikeData(candidateNode) || (
                    candidateNode !== node ? extractSingleChannelFromSheetLikeData(node) : null
                );
                const thumbnailOwnerCandidate = extractThumbnailOwnerCandidate(candidateNode) || (
                    candidateNode !== node ? extractThumbnailOwnerCandidate(node) : null
                );

                // Priority 1: navigationEndpoint.browseEndpoint on the video renderer
                const nav = candidateNode.navigationEndpoint && candidateNode.navigationEndpoint.browseEndpoint;
                if (nav) {
                    const browseId = nav.browseId;
                    const canonicalBaseUrl = nav.canonicalBaseUrl;
                    const name = (candidateNode.shortBylineText?.runs?.[0]?.text) || (candidateNode.longBylineText?.runs?.[0]?.text) || undefined;

                    if (canonicalBaseUrl) {
                        const handle = extractRawHandle(canonicalBaseUrl) || null;
                        if (handle && browseId && browseId.startsWith('UC')) {
                            return mergeChannelCandidates({ id: browseId, handle, name }, sheetCandidate);
                        }
                        if (handle) {
                            return mergeChannelCandidates({ handle, name }, sheetCandidate);
                        }
                    }

                    if (browseId && browseId.startsWith('UC')) {
                        return mergeChannelCandidates({ id: browseId, name }, sheetCandidate);
                    }
                }

                // Priority 2: byline runs
                const byline = candidateNode.shortBylineText || candidateNode.longBylineText || candidateNode.ownerText;
                if (byline?.runs && Array.isArray(byline.runs)) {
                    for (const run of byline.runs) {
                        const browse = run?.navigationEndpoint?.browseEndpoint;
                        if (!browse) continue;

                        const browseId = browse.browseId;
                        const canonicalBaseUrl = browse.canonicalBaseUrl;
                        const name = run.text;

                        if (canonicalBaseUrl) {
                            const handle = extractRawHandle(canonicalBaseUrl) || null;
                            if (handle) {
                                console.log('FilterTube: Found channel in ytInitialData (deep search):', { handle, id: browseId });
                                const candidate = mergeChannelCandidates({ handle, id: browseId, name }, sheetCandidate);
                                if (!hasExpectations || matchesExpectations(candidate)) {
                                    return candidate;
                                }
                                if (!fallbackCandidate) {
                                    fallbackCandidate = candidate;
                                }
                            } else if (browseId && browseId.startsWith('UC')) {
                                const candidate = mergeChannelCandidates({ id: browseId, name }, sheetCandidate);
                                if (!hasExpectations || matchesExpectations(candidate)) {
                                    return candidate;
                                }
                                if (!fallbackCandidate) {
                                    fallbackCandidate = candidate;
                                }
                            }
                        }
                    }
                }

                const ownerRenderer =
                    candidateNode?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer ||
                    candidateNode?.owner?.videoOwnerRenderer ||
                    candidateNode?.videoOwnerRenderer ||
                    null;
                if (ownerRenderer) {
                    const ownerCandidate = mergeChannelCandidates(extractOwnerCandidate(ownerRenderer), sheetCandidate);
                    if (ownerCandidate) return ownerCandidate;
                }

                const mergedThumbnailOwner = mergeChannelCandidates(thumbnailOwnerCandidate, sheetCandidate);
                if (mergedThumbnailOwner) {
                    if (!hasExpectations || matchesExpectations(mergedThumbnailOwner)) {
                        return mergedThumbnailOwner;
                    }
                    if (!fallbackCandidate) {
                        fallbackCandidate = mergedThumbnailOwner;
                    }
                }

                if (sheetCandidate) {
                    return sheetCandidate;
                }
            }

            // Recurse
            if (Array.isArray(node)) {
                for (const child of node) {
                    const found = searchNode(child, visited);
                    if (found) return found;
                }
            } else {
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    if (Array.isArray(value)) {
                        for (const child of value) {
                            const found = searchNode(child, visited);
                            if (found) return found;
                        }
                    } else {
                        const found = searchNode(value, visited);
                        if (found) return found;
                    }
                }
            }

            return null;
        }

        function searchRoot(root, label) {
            if (!root || typeof root !== 'object') return null;
            postLog('log', `Channel search: looking in ${label}`);
            const visited = new WeakSet();
            const result = searchNode(root, visited);
            if (!foundVideoObject) {
                postLog('log', `Channel search: video ID not found in ${label}: ${videoId}`);
            } else if (result) {
                postLog('log', `Channel search: found channel in ${label}`);
                return result;
            }
            return null;
        }

        let result = null;
        const playerCandidate = (() => {
            const ftPlayer = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse;
            const basePlayer = ftPlayer || window.ytInitialPlayerResponse;
            const extracted = extractFromPlayerResponse(basePlayer);
            if (extracted) {
                if (!hasExpectations || matchesExpectations(extracted)) {
                    return extracted;
                }
                if (!fallbackCandidate) fallbackCandidate = extracted;
            }
            return null;
        })();

        if (watchOwnerCandidate) {
            matchedTargetVideo = true;
            const mergedWatch = mergeChannelCandidates(watchOwnerCandidate, playerCandidate);
            if (mergedWatch) {
                if (!hasExpectations || matchesExpectations(mergedWatch)) {
                    return mergedWatch;
                }
                if (!fallbackCandidate) fallbackCandidate = mergedWatch;
            }
        }

        for (const target of searchTargets) {
            // Reset per-root flags while preserving global fallback
            const prevFoundFlag = foundVideoObject;
            result = searchRoot(target.root, target.label);
            if (result) break;
            if (!foundVideoObject) {
                // reset so other roots can log properly
                foundVideoObject = prevFoundFlag;
            }
        }

        if (!result && !fallbackCandidate) {
            postLog('log', `Channel search: no channel info extracted for ${videoId} across ${searchTargets.length} roots`);
        }
        if (result) return result;
        if (fallbackCandidate && matchedTargetVideo) return fallbackCandidate;
        if (fallbackCandidate && !matchedTargetVideo) {
            postLog('warn', `Channel search: ignoring unanchored fallback for ${videoId}`);
        }
        return null;
    }

    /**
     * Hybrid search for collaborator info (global cache + DOM hydration)
     * @param {string} videoId
     * @returns {Array|null}
     */
    function searchYtInitialDataForCollaborators(videoId, matcher = null) {
        if (!videoId) {
            postLog('log', 'Collaborator search skipped - missing videoId');
            return null;
        }

        postLog('log', `Searching collaborators for ${videoId}...`);

        let bestCandidate = null;

        const roots = [];
        if (window.ytInitialData) {
            roots.push({ root: window.ytInitialData, label: 'ytInitialData' });
        }
        if (window.filterTube?.lastYtInitialData) {
            roots.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
        }
        if (window.filterTube?.rawYtInitialData) {
            roots.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
        }

        if (window.filterTube?.lastYtNextResponse) {
            roots.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
        }
        if (window.filterTube?.lastYtBrowseResponse) {
            roots.push({ root: window.filterTube.lastYtBrowseResponse, label: 'filterTube.lastYtBrowseResponse' });
        }

        const extractVideoIdFromNode = (node) => {
            if (!node || typeof node !== 'object') return '';
            const direct =
                node.videoId ||
                node.contentId ||
                node?.watchEndpoint?.videoId ||
                node?.navigationEndpoint?.watchEndpoint?.videoId ||
                node?.reelWatchEndpoint?.videoId ||
                node?.navigationEndpoint?.reelWatchEndpoint?.videoId ||
                '';
            if (direct && typeof direct === 'string') return direct;

            const urlCandidate =
                node?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.navigationEndpoint?.watchEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.commandMetadata?.webCommandMetadata?.url ||
                '';
            if (urlCandidate && typeof urlCandidate === 'string') {
                const match = urlCandidate.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (match && match[1]) return match[1];
                const watchMatch = urlCandidate.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (watchMatch && watchMatch[1]) return watchMatch[1];
            }
            return '';
        };

        for (const target of roots) {
            const visited = new WeakSet();
            function searchObject(obj, depth = 0) {
                if (!obj || typeof obj !== 'object' || visited.has(obj) || depth > 12) return null;
                visited.add(obj);

                const nodeVideoId = extractVideoIdFromNode(obj);
                if (nodeVideoId === videoId) {
                    const extracted = extractCollaboratorsFromDataObject(obj);
                    if (Array.isArray(extracted) && extracted.length > 0) {
                        const score = scoreCollaboratorCandidate(extracted, matcher, depth);
                        if (score >= 0 && (!bestCandidate || score > bestCandidate.score)) {
                            bestCandidate = { list: extracted, score, source: target.label };
                        }
                    }
                }

                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                    const value = obj[key];
                    if (!value || typeof value !== 'object') continue;
                    if (Array.isArray(value)) {
                        for (let i = 0; i < value.length; i++) {
                            searchObject(value[i], depth + 1);
                        }
                    } else {
                        searchObject(value, depth + 1);
                    }
                }

                return null;
            }

            searchObject(target.root);
        }

        if (bestCandidate?.list) {
            postLog('log', `✅ Found collaborators via ${bestCandidate.source} (best-ranked candidate)`);
            return bestCandidate.list;
        }

        postLog('log', '⚠️ Global search failed. Attempting DOM hydration…');
        if (typeof document === 'undefined') {
            postLog('warn', 'DOM hydration unavailable - document not defined');
            return null;
        }

        let bestDomCandidate = null;
        let bestDomScore = -1;
        const candidates = [];
        const selector = `[data-filtertube-video-id="${videoId}"]`;
        const baseElement = document.querySelector(selector);
        if (baseElement) {
            candidates.push(baseElement);
            const wrapper = baseElement.closest(
                'ytd-rich-item-renderer, ' +
                'ytd-grid-video-renderer, ' +
                'ytd-compact-video-renderer, ' +
                'ytd-playlist-video-renderer, ' +
                'ytd-playlist-panel-video-renderer, ' +
                'ytd-playlist-panel-video-wrapper-renderer, ' +
                'ytm-playlist-panel-video-renderer, ' +
                'ytm-playlist-panel-video-wrapper-renderer, ' +
                'ytd-video-renderer'
            );
            if (wrapper && wrapper !== baseElement) {
                candidates.push(wrapper);
            }

            // Late-loaded lockup cards often keep the collaborator endpoints on nested avatar-stack elements.
            try {
                const avatarStack = baseElement.querySelector('yt-avatar-stack-view-model, .yt-avatar-stack-view-model');
                if (avatarStack) {
                    candidates.push(avatarStack);
                }
                const nestedAvatarStacks = baseElement.querySelectorAll?.('yt-avatar-stack-view-model, .yt-avatar-stack-view-model');
                if (nestedAvatarStacks && nestedAvatarStacks.length > 1) {
                    for (const node of Array.from(nestedAvatarStacks).slice(0, 3)) {
                        if (node && !candidates.includes(node)) {
                            candidates.push(node);
                        }
                    }
                }
            } catch (e) {
                // ignore
            }
        } else {
            postLog('warn', `❌ Could not find DOM element for ${videoId}`);
        }

        // Watch-page fallback: selected playlist row and owner metadata often keep the
        // collaborator command during SPA swaps even when the clicked row only has partial stamps.
        try {
            const currentVideoId = (() => {
                try {
                    const params = new URLSearchParams(window.location?.search || '');
                    return params.get('v') || '';
                } catch (err) {
                    return '';
                }
            })();
            if (currentVideoId && currentVideoId === videoId) {
                const watchCandidates = document.querySelectorAll(
                    'ytd-watch-metadata, ' +
                    'ytd-video-owner-renderer, ' +
                    'ytd-playlist-panel-video-renderer[selected], ' +
                    'ytd-playlist-panel-video-wrapper-renderer[selected] ytd-playlist-panel-video-renderer'
                );
                for (const node of Array.from(watchCandidates).slice(0, 8)) {
                    if (node && !candidates.includes(node)) {
                        candidates.push(node);
                    }
                }
            }
        } catch (e) {
            // ignore
        }

        const hydrateFromStampedAttributes = (element, label) => {
            if (!element || typeof element.getAttribute !== 'function') return null;
            const raw = element.getAttribute('data-filtertube-collaborators') || '';
            if (!raw) return null;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    postLog('log', `✅ Hydrated collaborators from ${label} data-filtertube-collaborators`);
                    return parsed;
                }
            } catch (e) {
                // ignore
            }
            return null;
        };

        const attemptExtraction = (element, label) => {
            if (!element) return null;

        let best = null;
        let bestScore = 0;

            const stamped = hydrateFromStampedAttributes(element, label);
            if (Array.isArray(stamped) && stamped.length > 0) {
                best = stamped;
                bestScore = getCollaboratorListQuality(stamped);
            }

            const dataCandidates = [
                element.data,
                element.data?.content,
                element.data?.content?.videoRenderer,
                element.data?.content?.lockupViewModel,
                element.__data?.data,
                element.__data?.data?.content,
                element.__data?.data?.content?.videoRenderer,
                element.__data?.data?.content?.lockupViewModel,
                element.__data?.item,
                element.__data
            ];
            for (const candidate of dataCandidates) {
                const extracted = extractCollaboratorsFromDataObject(candidate);
                if (Array.isArray(extracted) && extracted.length > 0) {
                    const score = getCollaboratorListQuality(extracted);
                    if (score > bestScore) {
                        best = extracted;
                        bestScore = score;
                    }
                }
            }

            // Some lockup view-models store collaborators on nested metadata elements.
            try {
                const nestedStampedNodes = element.querySelectorAll?.('[data-filtertube-collaborators]') || [];
                Array.from(nestedStampedNodes).slice(0, 4).forEach((nestedStamped, index) => {
                    const nested = hydrateFromStampedAttributes(nestedStamped, `${label} descendant ${index + 1}`);
                    if (Array.isArray(nested) && nested.length > 0) {
                        const score = getCollaboratorListQuality(nested);
                        if (score > bestScore) {
                            best = nested;
                            bestScore = score;
                        }
                    }
                });
            } catch (e) {
                // ignore
            }

            if (best) {
                postLog('log', `✅ Hydrated collaborators from ${label} (score=${bestScore})`);
            }
            return best;
        };

        for (let index = 0; index < candidates.length; index++) {
            const element = candidates[index];
            const label = element === baseElement ? 'element' : `candidate-${index + 1}`;
            const result = attemptExtraction(element, label);
            const score = scoreCollaboratorCandidate(result, matcher, index);
            if (score >= 0 && score > bestDomScore) {
                bestDomCandidate = result;
                bestDomScore = score;
            }
        }

        if (bestDomCandidate) {
            postLog('log', `✅ Hydrated collaborators from DOM (best-ranked candidate, score=${bestDomScore})`);
            return bestDomCandidate;
        }

        return null;
    }

    // Function to update seed.js settings
    function updateSeedSettings() {
        if (window.filterTube && typeof window.filterTube.updateSettings === 'function') {
            postLog('log', 'Updating seed.js with received settings');
            window.filterTube.updateSettings(currentSettings);
            postLog('log', 'Seed.js settings updated successfully');
        } else {
            postLog('warn', 'window.filterTube.updateSettings not available yet, will retry');

            // Retry after delay
            setTimeout(() => {
                if (window.filterTube && typeof window.filterTube.updateSettings === 'function') {
                    postLog('log', 'Retrying seed.js settings update');
                    window.filterTube.updateSettings(currentSettings);
                    postLog('log', 'Seed.js settings updated successfully on retry');
                } else {
                    postLog('error', 'Failed to update seed.js settings after retry');
                }
            }, 300);
        }
    }

    // Process data with FilterTubeEngine
    function processDataWithFilterLogic(data, dataName) {
        if (!window.FilterTubeEngine?.processData) {
            postLog('warn', `FilterTubeEngine not available for ${dataName}`);
            return data;
        }

        try {
            postLog('log', `Processing ${dataName} with FilterTubeEngine`);
            const result = window.FilterTubeEngine.processData(data, currentSettings, dataName);
            postLog('log', `${dataName} processed successfully`);
            return result;
        } catch (error) {
            postLog('error', `Error processing ${dataName}:`, error.message);
            return data;
        }
    }

    // Process queued data
    function processInitialDataQueue() {
        if (!settingsReceived || !window.FilterTubeEngine) {
            postLog('log', `Queue processing delayed - Settings: ${settingsReceived}, Engine: ${!!window.FilterTubeEngine}`);
            return;
        }

        if (initialDataQueue.length === 0) {
            postLog('log', 'No queued data to process');
            return;
        }

        postLog('log', `Processing ${initialDataQueue.length} queued data items`);

        while (initialDataQueue.length > 0) {
            const item = initialDataQueue.shift();
            postLog('log', `Processing queued ${item.name}`);

            if (typeof item.process === 'function') {
                item.process();
            }
        }

        postLog('log', 'Finished processing queued data');
    }

    // Connect to seed.js global object
    function connectToSeedGlobal() {
        if (!window.filterTube) {
            postLog('warn', 'window.filterTube not available yet');
            return false;
        }

        postLog('log', 'Connecting to seed.js global object');

        // Set up processing functions for seed.js
        window.filterTube.processFetchResponse = function (url, data) {
            postLog('log', `Processing fetch response from ${url.pathname}`);
            return processDataWithFilterLogic(data, `fetch:${url.pathname}`);
        };

        window.filterTube.processXhrResponse = function (url, data) {
            postLog('log', `Processing XHR response from ${url.pathname}`);
            return processDataWithFilterLogic(data, `xhr:${url.pathname}`);
        };

        // Update settings if already received
        if (settingsReceived) {
            window.filterTube.updateSettings(currentSettings);
            postLog('log', 'Updated seed.js with current settings');
        }

        return true;
    }

    // Try connecting to seed.js
    if (!connectToSeedGlobal()) {
        postLog('log', 'Will retry connecting to seed.js');
        setTimeout(() => {
            if (!connectToSeedGlobal()) {
                postLog('warn', 'Failed to connect to seed.js after retry');
            }
        }, 200);
    }

    // Set up additional data hooks if seed.js didn't handle them
    function setupAdditionalHooks() {
        // Hook ytInitialData if not already hooked
        const ytInitialDataDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialData');
        if (ytInitialDataDesc && ytInitialDataDesc.configurable === false) {
            postLog('warn', 'ytInitialData is non-configurable; skipping injector hook');
            return;
        }

        if (!ytInitialDataDesc?.get) {
            postLog('log', 'Setting up ytInitialData hook (seed.js backup)');

            let ytInitialDataValue = window.ytInitialData;

            if (ytInitialDataValue !== undefined) {
                postLog('log', 'ytInitialData exists, processing');

                if (settingsReceived && window.FilterTubeEngine) {
                    ytInitialDataValue = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                    window.ytInitialData = ytInitialDataValue;
                } else {
                    initialDataQueue.push({
                        name: 'ytInitialData',
                        process: () => {
                            const processed = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                            window.ytInitialData = processed;
                        }
                    });
                }
            }

            try {
                Object.defineProperty(window, 'ytInitialData', {
                    configurable: true,
                    get: () => ytInitialDataValue,
                    set: (newValue) => {
                        postLog('log', 'ytInitialData setter called (injector hook)');

                        if (settingsReceived && window.FilterTubeEngine) {
                            ytInitialDataValue = processDataWithFilterLogic(newValue, 'ytInitialData');
                        } else {
                            ytInitialDataValue = newValue;
                            initialDataQueue.push({
                                name: 'ytInitialData',
                                process: () => {
                                    ytInitialDataValue = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                                }
                            });
                        }
                    }
                });
            } catch (e) {
                postLog('warn', 'Failed to install ytInitialData injector hook', e);
            }
        } else {
            postLog('log', 'ytInitialData hook already exists (seed.js handled it)');
        }
    }

    // Set up hooks
    setupAdditionalHooks();

    // Wait for FilterTubeEngine and signal readiness
    const engineCheckInterval = setInterval(() => {
        if (window.FilterTubeEngine?.processData) {
            postLog('log', 'FilterTubeEngine is now available');
            clearInterval(engineCheckInterval);

            // Process any queued data
            if (settingsReceived) {
                processInitialDataQueue();
            }

            // Signal full initialization
            window.ftInitialized = true;
            window.dispatchEvent(new CustomEvent('filterTubeReady'));

            // Signal readiness to content_bridge
            window.postMessage({
                type: 'FilterTube_InjectorToBridge_Ready',
                source: 'injector'
            }, '*');
            postLog('log', 'FilterTube fully initialized and ready');
        }
    }, 100);

    // Timeout for engine check
    setTimeout(() => {
        clearInterval(engineCheckInterval);
        if (!window.FilterTubeEngine?.processData) {
            postLog('error', 'FilterTubeEngine failed to load within timeout');
        }
    }, 5000);

    postLog('log', 'Injector.js setup complete');

})(); // End of IIFE 
