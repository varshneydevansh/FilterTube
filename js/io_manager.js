(function (global) {
    'use strict';

    /**
     * IO Manager (import/export + profile persistence helpers)
     *
     * Centralizes serialization/deserialization helpers used by the dashboard’s
     * Import / Export panel. Functions here deliberately avoid UI dependencies
     * so they can be reused by the popup, background, and future automation.
     */

    const runtimeAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    const STORAGE_NAMESPACE = runtimeAPI?.storage?.local;

    const FT_PROFILES_V3_KEY = 'ftProfilesV3';

    /** Returns a timestamp in ms (kept inline so tests can stub). */
    function nowTs() {
        return Date.now();
    }

    /** Coerces unknown values into arrays so downstream logic can assume [] */
    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    /** Filters out primitives, nulls, and arrays so we only pass plain objects. */
    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeBool(value, fallback = false) {
        return typeof value === 'boolean' ? value : fallback;
    }

    function normalizeNumber(value, fallback = 0) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }

    /**
     * Builds a dedupe key for keywords (combines word + switches to avoid
     * storing the same word multiple times with identical flags).
     */
    function keywordKey(entry) {
        const word = normalizeString(entry?.word).toLowerCase();
        const exact = entry?.exact === true ? '1' : '0';
        const comments = entry?.comments === false ? '0' : '1';
        const semantic = entry?.semantic === true ? '1' : '0';
        return `${word}|${exact}|${comments}|${semantic}`;
    }

    /**
     * Normalizes a keyword entry from any source (UI / import). Drops invalid
     * rows and enforces defaults for metadata fields.
     */
    function sanitizeKeywordEntry(entry, overrides = {}) {
        const word = normalizeString(entry?.word);
        if (!word) return null;

        const addedAtCandidate = Object.prototype.hasOwnProperty.call(overrides, 'addedAt')
            ? overrides.addedAt
            : entry?.addedAt;

        const addedAt = (typeof addedAtCandidate === 'number' && Number.isFinite(addedAtCandidate))
            ? addedAtCandidate
            : nowTs();

        const commentsCandidate = Object.prototype.hasOwnProperty.call(overrides, 'comments')
            ? overrides.comments
            : entry?.comments;

        const comments = (typeof commentsCandidate === 'boolean') ? commentsCandidate : true;

        const sourceCandidate = Object.prototype.hasOwnProperty.call(overrides, 'source')
            ? overrides.source
            : entry?.source;

        const source = (sourceCandidate === 'channel' || sourceCandidate === 'user' || sourceCandidate === 'import')
            ? sourceCandidate
            : (entry?.source === 'channel' ? 'channel' : 'user');

        const channelRefCandidate = Object.prototype.hasOwnProperty.call(overrides, 'channelRef')
            ? overrides.channelRef
            : entry?.channelRef;

        const channelRef = normalizeString(channelRefCandidate) || null;

        return {
            word,
            exact: !!entry?.exact,
            semantic: !!entry?.semantic,
            source,
            channelRef,
            comments,
            addedAt
        };
    }

    /**
     * Returns the best identifier for a channel. Preference order mirrors how
     * we normally resolve handles/IDs/custom URLs in content scripts.
     */
    function channelKey(entry) {
        const id = normalizeString(entry?.id).toLowerCase();
        const handle = normalizeString(entry?.handle).toLowerCase();
        const customUrl = normalizeString(entry?.customUrl).toLowerCase();
        if (id) return `id:${id}`;
        if (handle) return `handle:${handle}`;
        if (customUrl) return `custom:${customUrl}`;
        const name = normalizeString(entry?.name).toLowerCase();
        return name ? `name:${name}` : '';
    }

    function mergeChannelEntries(existing, incoming) {
        if (!existing) return incoming;
        if (!incoming) return existing;
        const merged = { ...existing, ...incoming };

        const existingAdded = normalizeNumber(existing.addedAt, 0);
        const incomingAdded = normalizeNumber(incoming.addedAt, 0);
        if (existingAdded && incomingAdded) {
            merged.addedAt = Math.min(existingAdded, incomingAdded);
        } else {
            merged.addedAt = existingAdded || incomingAdded || nowTs();
        }

        if (existing.source && !incoming.source) merged.source = existing.source;
        if (incoming.source && !existing.source) merged.source = incoming.source;

        return merged;
    }

    /**
     * Normalizes imported channel entries. Accepts both raw strings and rich
     * objects, and ensures timestamps/source metadata are populated.
     */
    function sanitizeChannelEntry(entry, overrides = {}) {
        if (typeof entry === 'string') {
            const trimmed = entry.trim();
            if (!trimmed) return null;
            return {
                name: trimmed,
                id: trimmed,
                handle: null,
                handleDisplay: null,
                canonicalHandle: null,
                logo: null,
                customUrl: null,
                filterAll: false,
                source: overrides.source || 'import',
                originalInput: trimmed,
                addedAt: overrides.addedAt || nowTs()
            };
        }

        if (!entry || typeof entry !== 'object') return null;

        const id = normalizeString(entry.id);
        const handle = normalizeString(entry.handle);
        const customUrl = normalizeString(entry.customUrl);
        const name = normalizeString(entry.name);
        const originalInput = normalizeString(entry.originalInput) || id || handle || customUrl || name || null;
        const source = overrides.source || (typeof entry.source === 'string' ? entry.source : 'import');

        const addedAtCandidate = Object.prototype.hasOwnProperty.call(overrides, 'addedAt')
            ? overrides.addedAt
            : entry.addedAt;
        const addedAt = (typeof addedAtCandidate === 'number' && Number.isFinite(addedAtCandidate))
            ? addedAtCandidate
            : nowTs();

        return {
            name: name || (handle || id || customUrl || ''),
            id: id || '',
            handle: handle ? handle.toLowerCase() : null,
            handleDisplay: normalizeString(entry.handleDisplay) || (handle || null),
            canonicalHandle: normalizeString(entry.canonicalHandle) || (handle || null),
            logo: normalizeString(entry.logo) || null,
            customUrl: customUrl || null,
            filterAll: !!entry.filterAll,
            source,
            originalInput,
            addedAt
        };
    }

    /** Thin promise wrapper around chrome.storage.local.get */
    async function readStorage(keys) {
        return new Promise((resolve) => {
            if (!STORAGE_NAMESPACE) return resolve({});
            try {
                STORAGE_NAMESPACE.get(keys, (items) => resolve(items || {}));
            } catch (e) {
                resolve({});
            }
        });
    }

    /** Thin promise wrapper around chrome.storage.local.set */
    async function writeStorage(payload) {
        return new Promise((resolve) => {
            if (!STORAGE_NAMESPACE) return resolve({ ok: false });
            try {
                STORAGE_NAMESPACE.set(payload, () => {
                    const err = chrome?.runtime?.lastError || null;
                    resolve({ ok: !err, error: err });
                });
            } catch (e) {
                resolve({ ok: false, error: e });
            }
        });
    }

    /**
     * Reads the serialized profile object (main/kids/subscriptions) and applies
     * defensive defaults so export consumers always get predictable shapes.
     */
    async function loadProfilesV3() {
        const data = await readStorage([FT_PROFILES_V3_KEY]);
        const profiles = safeObject(data?.[FT_PROFILES_V3_KEY]);

        const main = safeObject(profiles.main);
        const kids = safeObject(profiles.kids);
        const subscriptions = safeObject(profiles.subscriptions);

        return {
            main: {
                mode: normalizeString(main.mode) || 'blocklist',
                applyKidsRulesOnMain: normalizeBool(main.applyKidsRulesOnMain, false),
                whitelistedChannels: safeArray(main.whitelistedChannels),
                whitelistedKeywords: safeArray(main.whitelistedKeywords),
                videoIds: safeArray(main.videoIds),
                subscriptions: safeArray(main.subscriptions || subscriptions.main)
            },
            kids: {
                mode: normalizeString(kids.mode) || 'whitelist',
                strictMode: normalizeBool(kids.strictMode, true),
                blockedChannels: safeArray(kids.blockedChannels),
                blockedKeywords: safeArray(kids.blockedKeywords),
                whitelistedChannels: safeArray(kids.whitelistedChannels),
                whitelistedKeywords: safeArray(kids.whitelistedKeywords),
                videoIds: safeArray(kids.videoIds),
                subscriptions: safeArray(kids.subscriptions || subscriptions.kids)
            }
        };
    }

    /** Persists the full profile blob back to storage (single atomic write). */
    async function saveProfilesV3(nextProfiles) {
        const payload = {
            [FT_PROFILES_V3_KEY]: nextProfiles
        };
        return writeStorage(payload);
    }

    /**
     * Deduplicates keywords across user + import sources while preserving the
     * earliest addedAt stamp and giving preference to incoming metadata when
     * present.
     */
    function mergeKeywordLists(existing, incoming) {
        const mergedMap = new Map();

        for (const entry of safeArray(existing)) {
            const sanitized = sanitizeKeywordEntry(entry, { source: entry?.source || 'user' });
            if (!sanitized) continue;
            mergedMap.set(keywordKey(sanitized), sanitized);
        }

        for (const entry of safeArray(incoming)) {
            const sanitized = sanitizeKeywordEntry(entry, { source: entry?.source || 'import' });
            if (!sanitized) continue;
            const key = keywordKey(sanitized);
            const existingEntry = mergedMap.get(key);
            if (!existingEntry) {
                mergedMap.set(key, sanitized);
                continue;
            }
            const merged = { ...existingEntry, ...sanitized };
            const existingAdded = normalizeNumber(existingEntry.addedAt, 0);
            const incomingAdded = normalizeNumber(sanitized.addedAt, 0);
            if (existingAdded && incomingAdded) merged.addedAt = Math.min(existingAdded, incomingAdded);
            mergedMap.set(key, merged);
        }

        return Array.from(mergedMap.values());
    }

    /**
     * Same as mergeKeywordLists but for channels, relying on channelKey +
     * mergeChannelEntries so we keep canonical IDs/handles whenever present.
     */
    function mergeChannelLists(existing, incoming) {
        const map = new Map();

        for (const entry of safeArray(existing)) {
            const sanitized = sanitizeChannelEntry(entry, { source: entry?.source || 'user' });
            if (!sanitized) continue;
            const key = channelKey(sanitized);
            if (!key) continue;
            map.set(key, sanitized);
        }

        for (const entry of safeArray(incoming)) {
            const sanitized = sanitizeChannelEntry(entry, { source: entry?.source || 'import' });
            if (!sanitized) continue;
            const key = channelKey(sanitized);
            if (!key) continue;
            const existingEntry = map.get(key);
            map.set(key, mergeChannelEntries(existingEntry, sanitized));
        }

        return Array.from(map.values());
    }

    /** Simple case-insensitive merge helper for plain string lists. */
    function mergeStringList(existing, incoming) {
        const out = [];
        const seen = new Set();
        for (const v of [...safeArray(existing), ...safeArray(incoming)]) {
            const s = normalizeString(v);
            if (!s) continue;
            const k = s.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(s);
        }
        return out;
    }

    /**
     * Determines which importer should handle a blob. Currently supports native
     * FilterTube v3 exports plus legacy BlockTube exports.
     */
    function detectFormat(data) {
        if (!data || typeof data !== 'object') return 'unknown';
        if (safeObject(data.meta).application === 'FilterTube' && normalizeNumber(safeObject(data.meta).version, 0) === 3) {
            return 'filtertube-v3';
        }
        if (data.filterData && typeof data.filterData === 'object') {
            return 'blocktube';
        }
        return 'unknown';
    }

    /**
     * Translates a BlockTube export into the shape expected by the FilterTube
     * importer. Their format stores channel IDs/names across multiple arrays,
     * so we normalize those entries and fabricate reasonable defaults.
     */
    function parseBlockTube(data) {
        const filterData = safeObject(data.filterData);
        const now = nowTs();

        const channels = [];
        let pendingName = null;
        for (const raw of safeArray(filterData.channelId)) {
            const entry = normalizeString(raw);
            if (!entry) continue;
            if (entry.startsWith('//')) {
                const nameMatch = entry.match(/\(([^)]+)\)/);
                if (nameMatch && nameMatch[1]) {
                    pendingName = nameMatch[1].trim();
                }
                continue;
            }
            channels.push({
                id: entry,
                name: pendingName || entry,
                handle: null,
                customUrl: null,
                filterAll: false,
                source: 'import',
                addedAt: now
            });
            pendingName = null;
        }

        for (const raw of safeArray(filterData.channelName)) {
            const name = normalizeString(raw);
            if (!name || name.startsWith('//')) continue;
            channels.push({
                id: '',
                name,
                handle: null,
                customUrl: null,
                filterAll: false,
                source: 'import',
                addedAt: now
            });
        }

        const keywords = [];
        for (const raw of safeArray(filterData.title)) {
            const word = normalizeString(raw);
            if (!word || word.startsWith('//')) continue;
            keywords.push({
                word,
                exact: false,
                comments: true,
                semantic: false,
                source: 'import',
                addedAt: now
            });
        }

        const videoIds = [];
        for (const raw of safeArray(filterData.videoId)) {
            const vid = normalizeString(raw);
            if (!vid || vid.startsWith('//')) continue;
            videoIds.push(vid);
        }

        return {
            ok: true,
            version: 0,
            theme: 'light',
            mainSettings: {},
            mainChannels: channels,
            mainKeywords: keywords,
            channelMap: {},
            profilesV3: {
                main: {
                    mode: 'blocklist',
                    applyKidsRulesOnMain: false,
                    whitelistedChannels: [],
                    whitelistedKeywords: [],
                    videoIds,
                    subscriptions: []
                },
                kids: {
                    mode: 'whitelist',
                    strictMode: true,
                    blockedChannels: [],
                    blockedKeywords: [],
                    whitelistedChannels: [],
                    whitelistedKeywords: [],
                    videoIds: [],
                    subscriptions: []
                }
            }
        };
    }

    /**
     * Serializes the current state into the FilterTube v3 JSON structure that
     * both the UI and CLI tooling share. Keeps feature flags grouped by topic.
     */
    function buildV3Export({ mainSettings, mainKeywords, mainChannels, channelMap, profilesV3 }) {
        return {
            meta: {
                version: 3,
                timestamp: nowTs(),
                application: 'FilterTube',
                exportType: 'full'
            },
            settings: {
                theme: mainSettings?.theme === 'dark' ? 'dark' : 'light',
                sync: {
                    enabled: false,
                    deviceName: null
                },
                main: {
                    mode: profilesV3?.main?.mode || 'blocklist',
                    hideShorts: !!mainSettings?.hideShorts,
                    hideComments: !!mainSettings?.hideComments,
                    filterComments: !!mainSettings?.filterComments,
                    hideHomeFeed: !!mainSettings?.hideHomeFeed,
                    hideSponsoredCards: !!mainSettings?.hideSponsoredCards,
                    hideWatchPlaylistPanel: !!mainSettings?.hideWatchPlaylistPanel,
                    hidePlaylistCards: !!mainSettings?.hidePlaylistCards,
                    hideMembersOnly: !!mainSettings?.hideMembersOnly,
                    hideMixPlaylists: !!mainSettings?.hideMixPlaylists,
                    hideVideoSidebar: !!mainSettings?.hideVideoSidebar,
                    hideRecommended: !!mainSettings?.hideRecommended,
                    hideLiveChat: !!mainSettings?.hideLiveChat,
                    hideVideoInfo: !!mainSettings?.hideVideoInfo,
                    hideVideoButtonsBar: !!mainSettings?.hideVideoButtonsBar,
                    hideAskButton: !!mainSettings?.hideAskButton,
                    hideVideoChannelRow: !!mainSettings?.hideVideoChannelRow,
                    hideVideoDescription: !!mainSettings?.hideVideoDescription,
                    hideMerchTicketsOffers: !!mainSettings?.hideMerchTicketsOffers,
                    hideEndscreenVideowall: !!mainSettings?.hideEndscreenVideowall,
                    hideEndscreenCards: !!mainSettings?.hideEndscreenCards,
                    disableAutoplay: !!mainSettings?.disableAutoplay,
                    disableAnnotations: !!mainSettings?.disableAnnotations,
                    hideTopHeader: !!mainSettings?.hideTopHeader,
                    hideNotificationBell: !!mainSettings?.hideNotificationBell,
                    hideExploreTrending: !!mainSettings?.hideExploreTrending,
                    hideMoreFromYouTube: !!mainSettings?.hideMoreFromYouTube,
                    hideSubscriptions: !!mainSettings?.hideSubscriptions,
                    hideSearchShelves: !!mainSettings?.hideSearchShelves,
                    applyKidsRulesOnMain: !!profilesV3?.main?.applyKidsRulesOnMain
                },
                kids: {
                    mode: profilesV3?.kids?.mode || 'whitelist',
                    strictMode: profilesV3?.kids?.strictMode !== false,
                    enableSearch: true
                }
            },
            profiles: {
                main: {
                    channels: safeArray(mainChannels),
                    keywords: safeArray(mainKeywords),
                    videoIds: safeArray(profilesV3?.main?.videoIds),
                    whitelistedChannels: safeArray(profilesV3?.main?.whitelistedChannels),
                    whitelistedKeywords: safeArray(profilesV3?.main?.whitelistedKeywords),
                    subscriptions: safeArray(profilesV3?.main?.subscriptions)
                },
                kids: {
                    blockedChannels: safeArray(profilesV3?.kids?.blockedChannels),
                    blockedKeywords: safeArray(profilesV3?.kids?.blockedKeywords),
                    whitelistedChannels: safeArray(profilesV3?.kids?.whitelistedChannels),
                    whitelistedKeywords: safeArray(profilesV3?.kids?.whitelistedKeywords),
                    videoIds: safeArray(profilesV3?.kids?.videoIds),
                    subscriptions: safeArray(profilesV3?.kids?.subscriptions)
                }
            },
            intelligence: {
                thumbnail: {
                    blurNsfw: false,
                    blurClickbait: false
                },
                semantic: {
                    enabled: false,
                    rules: []
                }
            },
            maps: {
                channelMap: safeObject(channelMap)
            }
        };
    }

    /**
     * Entry point for imports: auto-detect format and convert to canonical v3
     * structure so downstream merging logic doesn’t care about origin.
     */
    function normalizeIncomingV3(data) {
        const format = detectFormat(data);
        if (format === 'blocktube') {
            return parseBlockTube(data);
        }

        const root = safeObject(data);
        const meta = safeObject(root.meta);
        const version = normalizeNumber(meta.version, 0);
        if (version !== 3) {
            return { ok: false, error: `Unsupported version: ${version || 'unknown'}` };
        }

        const settings = safeObject(root.settings);
        const profiles = safeObject(root.profiles);
        const main = safeObject(profiles.main);
        const kids = safeObject(profiles.kids);

        const maps = safeObject(root.maps);
        const channelMap = safeObject(maps.channelMap);

        const mainChannels = safeArray(main.channels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);
        const mainKeywords = safeArray(main.keywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean);

        const mainVideoIds = mergeStringList([], safeArray(main.videoIds));

        const mainWhitelistedChannels = safeArray(main.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);
        const mainWhitelistedKeywords = safeArray(main.whitelistedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: 'import' })).filter(Boolean);

        const kidsBlockedChannels = safeArray(kids.blockedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);
        const kidsBlockedKeywords = safeArray(kids.blockedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: 'import' })).filter(Boolean);
        const kidsWhitelistedChannels = safeArray(kids.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);
        const kidsWhitelistedKeywords = safeArray(kids.whitelistedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: 'import' })).filter(Boolean);
        const kidsVideoIds = mergeStringList([], safeArray(kids.videoIds));

        const mainSubs = safeArray(main.subscriptions);
        const kidsSubs = safeArray(kids.subscriptions);

        const mainMode = normalizeString(settings?.main?.mode) || normalizeString(main.mode) || 'blocklist';
        const kidsMode = normalizeString(settings?.kids?.mode) || normalizeString(kids.mode) || 'whitelist';

        const applyKidsRulesOnMain = normalizeBool(settings?.main?.applyKidsRulesOnMain, false);
        const kidsStrictMode = normalizeBool(settings?.kids?.strictMode, true);

        const theme = settings.theme === 'dark' ? 'dark' : 'light';

        const mainSettings = safeObject(settings.main);

        return {
            ok: true,
            version,
            theme,
            mainSettings,
            mainChannels,
            mainKeywords,
            channelMap,
            profilesV3: {
                main: {
                    mode: mainMode,
                    applyKidsRulesOnMain,
                    whitelistedChannels: mainWhitelistedChannels,
                    whitelistedKeywords: mainWhitelistedKeywords,
                    videoIds: mainVideoIds,
                    subscriptions: safeArray(mainSubs)
                },
                kids: {
                    mode: kidsMode,
                    strictMode: kidsStrictMode,
                    blockedChannels: kidsBlockedChannels,
                    blockedKeywords: kidsBlockedKeywords,
                    whitelistedChannels: kidsWhitelistedChannels,
                    whitelistedKeywords: kidsWhitelistedKeywords,
                    videoIds: kidsVideoIds,
                    subscriptions: safeArray(kidsSubs)
                }
            }
        };
    }

    async function exportV3() {
        const SettingsAPI = global.FilterTubeSettings || {};
        if (typeof SettingsAPI.loadSettings !== 'function') {
            throw new Error('FilterTubeSettings.loadSettings not available');
        }

        const mainSettings = await SettingsAPI.loadSettings();
        const profilesV3 = await loadProfilesV3();

        const mainChannels = safeArray(mainSettings.channels);
        const mainKeywords = safeArray(mainSettings.keywords);

        return buildV3Export({
            mainSettings,
            mainKeywords,
            mainChannels,
            channelMap: mainSettings.channelMap || {},
            profilesV3
        });
    }

    async function importV3(json, { strategy = 'merge' } = {}) {
        const parsed = normalizeIncomingV3(json);
        if (!parsed.ok) {
            throw new Error(parsed.error || 'Invalid file');
        }

        const SettingsAPI = global.FilterTubeSettings || {};
        if (typeof SettingsAPI.loadSettings !== 'function' || typeof SettingsAPI.saveSettings !== 'function') {
            throw new Error('FilterTubeSettings load/save not available');
        }

        const current = await SettingsAPI.loadSettings();

        const nextChannels = strategy === 'replace'
            ? parsed.mainChannels
            : mergeChannelLists(current.channels, parsed.mainChannels);

        const nextKeywords = strategy === 'replace'
            ? parsed.mainKeywords
            : mergeKeywordLists(current.keywords, parsed.mainKeywords);

        const nextChannelMap = { ...safeObject(current.channelMap), ...safeObject(parsed.channelMap) };

        const mainSettingsOverrides = safeObject(parsed.mainSettings);

        const payload = {
            keywords: nextKeywords,
            channels: nextChannels,
            enabled: current.enabled,
            hideShorts: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideShorts') ? !!mainSettingsOverrides.hideShorts : current.hideShorts,
            hideComments: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideComments') ? !!mainSettingsOverrides.hideComments : current.hideComments,
            filterComments: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'filterComments') ? !!mainSettingsOverrides.filterComments : current.filterComments,
            hideHomeFeed: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideHomeFeed') ? !!mainSettingsOverrides.hideHomeFeed : current.hideHomeFeed,
            hideSponsoredCards: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSponsoredCards') ? !!mainSettingsOverrides.hideSponsoredCards : current.hideSponsoredCards,
            hideWatchPlaylistPanel: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideWatchPlaylistPanel') ? !!mainSettingsOverrides.hideWatchPlaylistPanel : current.hideWatchPlaylistPanel,
            hidePlaylistCards: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hidePlaylistCards') ? !!mainSettingsOverrides.hidePlaylistCards : current.hidePlaylistCards,
            hideMembersOnly: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideMembersOnly') ? !!mainSettingsOverrides.hideMembersOnly : current.hideMembersOnly,
            hideMixPlaylists: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideMixPlaylists') ? !!mainSettingsOverrides.hideMixPlaylists : current.hideMixPlaylists,
            hideVideoSidebar: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideVideoSidebar') ? !!mainSettingsOverrides.hideVideoSidebar : current.hideVideoSidebar,
            hideRecommended: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideRecommended') ? !!mainSettingsOverrides.hideRecommended : current.hideRecommended,
            hideLiveChat: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideLiveChat') ? !!mainSettingsOverrides.hideLiveChat : current.hideLiveChat,
            hideVideoInfo: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideVideoInfo') ? !!mainSettingsOverrides.hideVideoInfo : current.hideVideoInfo,
            hideVideoButtonsBar: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideVideoButtonsBar') ? !!mainSettingsOverrides.hideVideoButtonsBar : current.hideVideoButtonsBar,
            hideAskButton: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideAskButton') ? !!mainSettingsOverrides.hideAskButton : current.hideAskButton,
            hideVideoChannelRow: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideVideoChannelRow') ? !!mainSettingsOverrides.hideVideoChannelRow : current.hideVideoChannelRow,
            hideVideoDescription: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideVideoDescription') ? !!mainSettingsOverrides.hideVideoDescription : current.hideVideoDescription,
            hideMerchTicketsOffers: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideMerchTicketsOffers') ? !!mainSettingsOverrides.hideMerchTicketsOffers : current.hideMerchTicketsOffers,
            hideEndscreenVideowall: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideEndscreenVideowall') ? !!mainSettingsOverrides.hideEndscreenVideowall : current.hideEndscreenVideowall,
            hideEndscreenCards: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideEndscreenCards') ? !!mainSettingsOverrides.hideEndscreenCards : current.hideEndscreenCards,
            disableAutoplay: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'disableAutoplay') ? !!mainSettingsOverrides.disableAutoplay : current.disableAutoplay,
            disableAnnotations: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'disableAnnotations') ? !!mainSettingsOverrides.disableAnnotations : current.disableAnnotations,
            hideTopHeader: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideTopHeader') ? !!mainSettingsOverrides.hideTopHeader : current.hideTopHeader,
            hideNotificationBell: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideNotificationBell') ? !!mainSettingsOverrides.hideNotificationBell : current.hideNotificationBell,
            hideExploreTrending: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideExploreTrending') ? !!mainSettingsOverrides.hideExploreTrending : current.hideExploreTrending,
            hideMoreFromYouTube: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideMoreFromYouTube') ? !!mainSettingsOverrides.hideMoreFromYouTube : current.hideMoreFromYouTube,
            hideSubscriptions: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSubscriptions') ? !!mainSettingsOverrides.hideSubscriptions : current.hideSubscriptions,
            hideSearchShelves: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSearchShelves') ? !!mainSettingsOverrides.hideSearchShelves : current.hideSearchShelves
        };

        const result = await SettingsAPI.saveSettings(payload);

        const storedProfiles = await loadProfilesV3();
        const nextProfiles = {
            main: {
                mode: parsed.profilesV3.main.mode,
                applyKidsRulesOnMain: parsed.profilesV3.main.applyKidsRulesOnMain,
                whitelistedChannels: strategy === 'replace'
                    ? parsed.profilesV3.main.whitelistedChannels
                    : mergeChannelLists(storedProfiles.main.whitelistedChannels, parsed.profilesV3.main.whitelistedChannels),
                whitelistedKeywords: strategy === 'replace'
                    ? parsed.profilesV3.main.whitelistedKeywords
                    : mergeKeywordLists(storedProfiles.main.whitelistedKeywords, parsed.profilesV3.main.whitelistedKeywords),
                videoIds: strategy === 'replace'
                    ? parsed.profilesV3.main.videoIds
                    : mergeStringList(storedProfiles.main.videoIds, parsed.profilesV3.main.videoIds),
                subscriptions: strategy === 'replace'
                    ? safeArray(parsed.profilesV3.main.subscriptions)
                    : mergeStringList(storedProfiles.main.subscriptions, parsed.profilesV3.main.subscriptions)
            },
            kids: {
                mode: parsed.profilesV3.kids.mode,
                strictMode: parsed.profilesV3.kids.strictMode,
                blockedChannels: strategy === 'replace'
                    ? parsed.profilesV3.kids.blockedChannels
                    : mergeChannelLists(storedProfiles.kids.blockedChannels, parsed.profilesV3.kids.blockedChannels),
                blockedKeywords: strategy === 'replace'
                    ? parsed.profilesV3.kids.blockedKeywords
                    : mergeKeywordLists(storedProfiles.kids.blockedKeywords, parsed.profilesV3.kids.blockedKeywords),
                whitelistedChannels: strategy === 'replace'
                    ? parsed.profilesV3.kids.whitelistedChannels
                    : mergeChannelLists(storedProfiles.kids.whitelistedChannels, parsed.profilesV3.kids.whitelistedChannels),
                whitelistedKeywords: strategy === 'replace'
                    ? parsed.profilesV3.kids.whitelistedKeywords
                    : mergeKeywordLists(storedProfiles.kids.whitelistedKeywords, parsed.profilesV3.kids.whitelistedKeywords),
                videoIds: strategy === 'replace'
                    ? parsed.profilesV3.kids.videoIds
                    : mergeStringList(storedProfiles.kids.videoIds, parsed.profilesV3.kids.videoIds),
                subscriptions: strategy === 'replace'
                    ? safeArray(parsed.profilesV3.kids.subscriptions)
                    : mergeStringList(storedProfiles.kids.subscriptions, parsed.profilesV3.kids.subscriptions)
            },
            subscriptions: {
                main: strategy === 'replace'
                    ? safeArray(parsed.profilesV3.main.subscriptions)
                    : mergeStringList(storedProfiles.main.subscriptions, parsed.profilesV3.main.subscriptions),
                kids: strategy === 'replace'
                    ? safeArray(parsed.profilesV3.kids.subscriptions)
                    : mergeStringList(storedProfiles.kids.subscriptions, parsed.profilesV3.kids.subscriptions)
            }
        };

        await saveProfilesV3(nextProfiles);

        if (parsed.theme && SettingsAPI.setThemePreference) {
            try {
                await SettingsAPI.setThemePreference(parsed.theme);
            } catch (e) {
            }
        }

        if (Object.keys(nextChannelMap).length > 0) {
            await writeStorage({ channelMap: nextChannelMap });
        }

        return { ok: true, result };
    }

    // ============================================================================
    // AUTO-BACKUP SYSTEM
    // ============================================================================

    /**
     * Creates an automatic backup of current FilterTube settings
     * @param {string} triggerType - What triggered this backup ('channel_added', 'keyword_added', etc.)
     * @param {Object} options - Additional backup options
     */
    async function createAutoBackup(triggerType, options = {}) {
        try {
            // Only create backups if user has enabled them (default: enabled)
            const SettingsAPI = window.FilterTubeSettings || {};
            if (typeof SettingsAPI.loadSettings !== 'function') {
                return { ok: false, reason: 'SettingsAPI unavailable' };
            }

            const settings = await SettingsAPI.loadSettings();
            const profilesV3 = await loadProfilesV3();

            // Build backup data (same as export but without transient data)
            const backupData = buildV3Export({
                mainSettings: settings,
                mainKeywords: settings.keywords || [],
                mainChannels: settings.channels || [],
                channelMap: settings.channelMap || {},
                profilesV3
            });

            // Mark as backup with metadata
            backupData.meta.backupType = 'auto';
            backupData.meta.trigger = triggerType;
            backupData.meta.backupLocation = await getBackupDirectory();

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `FilterTube-Backup-${timestamp}.json`;

            // Create backup file
            const result = await saveBackupFile(backupData, filename, options);

            // Rotate old backups (keep last 10)
            if (result.ok && !options.skipRotation) {
                await rotateBackups(10);
            }

            return result;
        } catch (error) {
            console.warn('FilterTube: Auto-backup failed', error);
            return { ok: false, reason: error.message };
        }
    }

    /**
     * Determines the best backup directory location
     * @returns {Promise<string>} Directory path
     */
    async function getBackupDirectory() {
        // Chrome downloads API can only save to Downloads folder
        // We'll use Downloads/FilterTube Backup/ as our backup location
        try {
            if (runtimeAPI?.downloads) {
                // Test if we can write to Downloads/FilterTube Backup
                const testPath = 'FilterTube Backup/.test';
                await new Promise((resolve, reject) => {
                    const blobUrl = URL.createObjectURL(new Blob(['test'], { type: 'text/plain' }));
                    runtimeAPI.downloads.download({
                        url: blobUrl,
                        filename: testPath,
                        saveAs: false
                    }, (downloadId) => {
                        try {
                            URL.revokeObjectURL(blobUrl);
                        } catch (e) {
                            // ignore
                        }
                        if (runtimeAPI.runtime?.lastError) {
                            reject(new Error(runtimeAPI.runtime.lastError.message));
                        } else {
                            // Clean up test file
                            runtimeAPI.downloads.erase({ id: downloadId });
                            resolve(downloadId);
                        }
                    });
                });
                console.log('FilterTube: Using Downloads/FilterTube Backup/ for backups');
                return 'FilterTube Backup';
            }
        } catch (e) {
            console.warn('FilterTube: Cannot create FilterTube Backup folder, using Downloads root');
        }

        // Fallback to Downloads root
        return '.';
    }

    /**
     * Saves backup file using Chrome downloads API
     * @param {Object} data - Backup data
     * @param {string} filename - Filename
     * @param {Object} options - Save options
     * @returns {Promise<Object>} Result
     */
    async function saveBackupFile(data, filename, options = {}) {
        return new Promise(async (resolve) => {
            if (!runtimeAPI?.downloads) {
                resolve({ ok: false, reason: 'Downloads API unavailable' });
                return;
            }

            const jsonData = JSON.stringify(data, null, 2);
            const blobUrl = URL.createObjectURL(new Blob([jsonData], { type: 'application/json' }));

            // Get backup directory and construct full path
            const backupDir = await getBackupDirectory();
            const fullPath = backupDir === '.' ? filename : `${backupDir}/${filename}`;

            runtimeAPI.downloads.download({
                url: blobUrl,
                filename: fullPath,
                saveAs: false // Silent save
            }, (downloadId) => {
                const error = runtimeAPI.runtime?.lastError;
                try {
                    URL.revokeObjectURL(blobUrl);
                } catch (e) {
                    // ignore
                }
                if (error) {
                    resolve({ ok: false, reason: error.message, downloadId: null });
                } else {
                    console.log(`FilterTube: Auto-backup created: ${fullPath}`);
                    resolve({ ok: true, filename: fullPath, downloadId });
                }
            });
        });
    }

    /**
     * Rotates backup files, keeping only the most recent ones
     * @param {number} keepCount - Number of backups to keep
     */
    async function rotateBackups(keepCount = 10) {
        try {
            if (!runtimeAPI?.downloads) return;

            // Get all FilterTube backup files
            const downloads = await new Promise((resolve) => {
                runtimeAPI.downloads.search({
                    query: 'FilterTube-Backup-',
                    limit: 100 // Get recent files
                }, resolve);
            });

            // Filter for backup files and sort by date (newest first)
            const backupFiles = downloads
                .filter(item => item.filename && item.filename.includes('FilterTube-Backup-'))
                .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

            // Delete old backups beyond keepCount
            const toDelete = backupFiles.slice(keepCount);
            for (const file of toDelete) {
                try {
                    await new Promise((resolve) => {
                        runtimeAPI.downloads.erase({ id: file.id }, resolve);
                    });
                    console.log(`FilterTube: Deleted old backup: ${file.filename}`);
                } catch (e) {
                    console.warn(`FilterTube: Failed to delete backup ${file.filename}:`, e);
                }
            }
        } catch (error) {
            console.warn('FilterTube: Backup rotation failed:', error);
        }
    }

    /**
     * Schedules a backup with debouncing to avoid too frequent saves
     */
    let backupScheduleTimer = null;
    let pendingBackupTrigger = null;

    function scheduleAutoBackup(triggerType, delay = 1000) {
        pendingBackupTrigger = triggerType;
        
        if (backupScheduleTimer) {
            clearTimeout(backupScheduleTimer);
        }

        backupScheduleTimer = setTimeout(async () => {
            if (pendingBackupTrigger) {
                await createAutoBackup(pendingBackupTrigger);
                pendingBackupTrigger = null;
                backupScheduleTimer = null;
            }
        }, delay);
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    global.FilterTubeIO = {
        exportV3,
        importV3,
        loadProfilesV3,
        saveProfilesV3,
        // Auto-backup functions
        createAutoBackup,
        scheduleAutoBackup,
        rotateBackups
    };
})(typeof window !== 'undefined' ? window : this);
