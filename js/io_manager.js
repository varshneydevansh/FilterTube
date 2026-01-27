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
    const FT_PROFILES_V4_KEY = 'ftProfilesV4';
    const DEFAULT_PROFILE_ID = 'default';

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

    function normalizeListMode(value, fallback = 'blocklist') {
        const raw = normalizeString(value).toLowerCase();
        if (raw === 'whitelist') return 'whitelist';
        if (raw === 'blocklist') return 'blocklist';
        return fallback === 'whitelist' ? 'whitelist' : 'blocklist';
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

    function resolveProfileScope(scope, activeProfileId) {
        const requested = (typeof scope === 'string' && scope.trim()) ? scope.trim() : 'auto';
        const activeId = normalizeString(activeProfileId) || DEFAULT_PROFILE_ID;
        if (requested === 'active') return 'active';
        if (requested === 'full') return activeId === DEFAULT_PROFILE_ID ? 'full' : 'active';
        return activeId === DEFAULT_PROFILE_ID ? 'full' : 'active';
    }

    function extractMasterPinVerifier(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const master = safeObject(profiles[DEFAULT_PROFILE_ID]);
        const security = safeObject(master.security);
        const verifier = security.masterPinVerifier || security.masterPin || null;
        return verifier && typeof verifier === 'object' ? verifier : null;
    }

    async function verifyPinAgainstVerifier(pin, verifier) {
        const Security = global.FilterTubeSecurity || null;
        if (!Security || typeof Security.verifyPin !== 'function') {
            throw new Error('Security manager unavailable');
        }
        return Security.verifyPin(pin, verifier);
    }

    async function requirePinOrThrow(pin, verifier, message) {
        const ok = await verifyPinAgainstVerifier(pin, verifier);
        if (!ok) {
            throw new Error(message || 'PIN required');
        }
    }

    function deriveProfilesV3FromV4(profilesV4, profileId, { source = 'export' } = {}) {
        const root = (profilesV4 && typeof profilesV4 === 'object' && !Array.isArray(profilesV4)) ? profilesV4 : null;
        const profiles = safeObject(root?.profiles);
        const id = normalizeString(profileId) || DEFAULT_PROFILE_ID;
        const activeProfile = safeObject(profiles[id]);
        const main = safeObject(activeProfile.main);
        const kids = safeObject(activeProfile.kids);
        const settings = safeObject(activeProfile.settings);

        const sanitizeChannels = (list) => safeArray(list)
            .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || source }))
            .filter(Boolean);
        const sanitizeKeywords = (list) => safeArray(list)
            .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || source }))
            .filter(Boolean);

        return {
            main: {
                mode: normalizeListMode(main.mode, 'blocklist'),
                applyKidsRulesOnMain: !!settings.syncKidsToMain,
                whitelistedChannels: sanitizeChannels(main.whitelistChannels || main.whitelistedChannels),
                whitelistedKeywords: sanitizeKeywords(main.whitelistKeywords || main.whitelistedKeywords),
                videoIds: mergeStringList([], safeArray(main.videoIds)),
                subscriptions: safeArray(main.subscriptions)
            },
            kids: {
                mode: normalizeListMode(kids.mode, 'blocklist'),
                strictMode: kids.strictMode !== false,
                blockedChannels: sanitizeChannels(kids.blockedChannels),
                blockedKeywords: sanitizeKeywords(kids.blockedKeywords),
                whitelistedChannels: sanitizeChannels(kids.whitelistChannels || kids.whitelistedChannels),
                whitelistedKeywords: sanitizeKeywords(kids.whitelistKeywords || kids.whitelistedKeywords),
                videoIds: mergeStringList([], safeArray(kids.videoIds)),
                subscriptions: safeArray(kids.subscriptions)
            }
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

        if (typeof incoming.filterAllComments !== 'boolean' && typeof existing.filterAllComments === 'boolean') {
            merged.filterAllComments = existing.filterAllComments;
        }

        const existingGroupId = typeof existing.collaborationGroupId === 'string' ? existing.collaborationGroupId : '';
        const incomingGroupId = typeof incoming.collaborationGroupId === 'string' ? incoming.collaborationGroupId : '';
        if (!incomingGroupId && existingGroupId) {
            merged.collaborationGroupId = existing.collaborationGroupId;
        }

        if (incomingGroupId) {
            if (Array.isArray(incoming.collaborationWith) && incoming.collaborationWith.length > 0) {
                merged.collaborationWith = incoming.collaborationWith;
            } else if (Array.isArray(existing.collaborationWith) && existing.collaborationWith.length > 0) {
                merged.collaborationWith = existing.collaborationWith;
            }

            if (Array.isArray(incoming.allCollaborators) && incoming.allCollaborators.length > 0) {
                merged.allCollaborators = incoming.allCollaborators;
            } else if (Array.isArray(existing.allCollaborators) && existing.allCollaborators.length > 0) {
                merged.allCollaborators = existing.allCollaborators;
            }
        } else {
            if (!Array.isArray(incoming.collaborationWith) && Array.isArray(existing.collaborationWith)) {
                merged.collaborationWith = existing.collaborationWith;
            }
            if (!Array.isArray(incoming.allCollaborators) && Array.isArray(existing.allCollaborators)) {
                merged.allCollaborators = existing.allCollaborators;
            }
        }

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
                filterAllComments: true,
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

        const filterAllCommentsCandidate = Object.prototype.hasOwnProperty.call(overrides, 'filterAllComments')
            ? overrides.filterAllComments
            : entry.filterAllComments;
        const filterAllComments = (typeof filterAllCommentsCandidate === 'boolean') ? filterAllCommentsCandidate : true;

        const collaborationGroupId = (typeof entry.collaborationGroupId === 'string' && entry.collaborationGroupId.trim())
            ? entry.collaborationGroupId.trim()
            : undefined;

        const collaborationWith = Array.isArray(entry.collaborationWith)
            ? entry.collaborationWith
                .map(v => typeof v === 'string' ? v.trim() : '')
                .filter(Boolean)
            : undefined;

        const allCollaborators = Array.isArray(entry.allCollaborators)
            ? entry.allCollaborators
                .map(collab => {
                    if (!collab || typeof collab !== 'object') return null;
                    const collabHandle = typeof collab.handle === 'string' ? collab.handle.trim() : '';
                    const collabId = typeof collab.id === 'string' ? collab.id.trim() : '';
                    const collabName = normalizeString(collab.name) || collabHandle || collabId || '';
                    if (!collabHandle && !collabId && !collabName) return null;
                    return {
                        handle: collabHandle || null,
                        name: collabName || null,
                        id: collabId || null
                    };
                })
                .filter(Boolean)
            : undefined;

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
            filterAllComments,
            source,
            originalInput,
            addedAt,
            ...(collaborationGroupId ? { collaborationGroupId } : {}),
            ...(Array.isArray(collaborationWith) ? { collaborationWith } : {}),
            ...(Array.isArray(allCollaborators) ? { allCollaborators } : {})
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
                mode: normalizeListMode(main.mode, 'blocklist'),
                applyKidsRulesOnMain: normalizeBool(main.applyKidsRulesOnMain, false),
                whitelistedChannels: safeArray(main.whitelistedChannels),
                whitelistedKeywords: safeArray(main.whitelistedKeywords),
                videoIds: safeArray(main.videoIds),
                subscriptions: safeArray(main.subscriptions || subscriptions.main)
            },
            kids: {
                mode: normalizeListMode(kids.mode, 'blocklist'),
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

    function isValidProfilesV4(value) {
        return !!(
            value
            && typeof value === 'object'
            && !Array.isArray(value)
            && typeof value.activeProfileId === 'string'
            && value.activeProfileId.trim()
            && value.profiles
            && typeof value.profiles === 'object'
            && !Array.isArray(value.profiles)
        );
    }

    function buildDefaultProfilesV4FromLegacyStorage(storage) {
        const now = nowTs();
        const legacyChannelsRaw = storage?.filterChannels;
        const legacyKeywordsRaw = storage?.uiKeywords;
        const profilesV3Raw = safeObject(storage?.[FT_PROFILES_V3_KEY]);

        const v3Main = safeObject(profilesV3Raw.main);
        const v3Kids = safeObject(profilesV3Raw.kids);

        const legacyChannels = Array.isArray(legacyChannelsRaw)
            ? legacyChannelsRaw
            : (typeof legacyChannelsRaw === 'string'
                ? legacyChannelsRaw
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                : []);

        const legacyKeywords = Array.isArray(legacyKeywordsRaw)
            ? legacyKeywordsRaw
            : [];

        const mainChannels = legacyChannels
            .map(entry => sanitizeChannelEntry(entry, { source: 'user', addedAt: entry?.addedAt || now }))
            .filter(Boolean);

        const mainKeywords = legacyKeywords
            .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || 'user', addedAt: entry?.addedAt || now }))
            .filter(Boolean);

        const kidsChannels = safeArray(v3Kids.blockedChannels)
            .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || 'user', addedAt: entry?.addedAt || now }))
            .filter(Boolean);

        const kidsKeywords = safeArray(v3Kids.blockedKeywords)
            .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || 'user', addedAt: entry?.addedAt || now }))
            .filter(Boolean);

        return {
            schemaVersion: 4,
            activeProfileId: DEFAULT_PROFILE_ID,
            profiles: {
                [DEFAULT_PROFILE_ID]: {
                    type: 'account',
                    parentProfileId: null,
                    name: 'Default',
                    settings: {
                        syncKidsToMain: !!v3Main.applyKidsRulesOnMain
                    },
                    main: {
                        mode: 'blocklist',
                        channels: mainChannels,
                        keywords: mainKeywords,
                        whitelistChannels: [],
                        whitelistKeywords: []
                    },
                    kids: {
                        mode: 'blocklist',
                        strictMode: v3Kids.strictMode !== false,
                        blockedChannels: kidsChannels,
                        blockedKeywords: kidsKeywords,
                        whitelistChannels: [],
                        whitelistKeywords: []
                    }
                }
            }
        };
    }

    async function loadProfilesV4() {
        const data = await readStorage([FT_PROFILES_V4_KEY, 'filterChannels', 'uiKeywords', FT_PROFILES_V3_KEY]);
        const existing = data?.[FT_PROFILES_V4_KEY];
        if (isValidProfilesV4(existing)) {
            let needsWrite = false;
            try {
                const profiles = safeObject(existing.profiles);
                for (const [profileId, rawProfile] of Object.entries(profiles)) {
                    const profile = safeObject(rawProfile);
                    const rawType = normalizeString(profile.type).toLowerCase();
                    if (profileId === DEFAULT_PROFILE_ID) {
                        if (rawType !== 'account') {
                            needsWrite = true;
                            break;
                        }
                        if (profile.parentProfileId != null) {
                            needsWrite = true;
                            break;
                        }
                        continue;
                    }
                    if (rawType !== 'account' && rawType !== 'child') {
                        needsWrite = true;
                        break;
                    }
                    if (rawType === 'account') {
                        if (profile.parentProfileId != null) {
                            needsWrite = true;
                            break;
                        }
                    }
                    if (rawType === 'child') {
                        const parent = normalizeString(profile.parentProfileId);
                        if (!parent) {
                            needsWrite = true;
                            break;
                        }
                    }
                }
            } catch (e) {
                needsWrite = true;
            }

            if (needsWrite) {
                const sanitized = sanitizeProfilesV4(existing, { source: 'local' });
                if (sanitized) {
                    await writeStorage({ [FT_PROFILES_V4_KEY]: sanitized });
                    return sanitized;
                }
            }

            return existing;
        }

        const migrated = buildDefaultProfilesV4FromLegacyStorage(data);
        await writeStorage({ [FT_PROFILES_V4_KEY]: migrated });
        return migrated;
    }

    async function saveProfilesV4(nextProfiles) {
        if (!isValidProfilesV4(nextProfiles)) {
            return writeStorage({});
        }
        return writeStorage({ [FT_PROFILES_V4_KEY]: nextProfiles });
    }

    function sanitizeProfilesV4(profilesV4, { source = 'export' } = {}) {
        if (!isValidProfilesV4(profilesV4)) return null;
        const profiles = safeObject(profilesV4.profiles);
        const outProfiles = {};

        for (const [profileId, rawProfile] of Object.entries(profiles)) {
            if (!profileId) continue;
            const profile = safeObject(rawProfile);
            const main = safeObject(profile.main);
            const kids = safeObject(profile.kids);
            const settings = safeObject(profile.settings);

            const rawType = normalizeString(profile.type).toLowerCase();
            const isDefault = profileId === DEFAULT_PROFILE_ID;
            const resolvedType = (rawType === 'account' || rawType === 'child')
                ? rawType
                : (isDefault ? 'account' : 'child');

            let resolvedParentProfileId = null;
            if (resolvedType === 'child') {
                const rawParent = normalizeString(profile.parentProfileId);
                if (rawParent && Object.prototype.hasOwnProperty.call(profiles, rawParent)) {
                    resolvedParentProfileId = rawParent;
                } else {
                    resolvedParentProfileId = DEFAULT_PROFILE_ID;
                }
            }

            outProfiles[profileId] = {
                ...profile,
                type: isDefault ? 'account' : resolvedType,
                parentProfileId: isDefault ? null : resolvedParentProfileId,
                name: normalizeString(profile.name) || 'Profile',
                settings: {
                    ...settings,
                    syncKidsToMain: !!settings.syncKidsToMain
                },
                main: {
                    ...main,
                    mode: main.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                    channels: safeArray(main.channels)
                        .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    keywords: safeArray(main.keywords)
                        .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    whitelistChannels: safeArray(main.whitelistChannels)
                        .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    whitelistKeywords: safeArray(main.whitelistKeywords)
                        .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean)
                },
                kids: {
                    ...kids,
                    mode: kids.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                    strictMode: kids.strictMode !== false,
                    blockedChannels: safeArray(kids.blockedChannels)
                        .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    blockedKeywords: safeArray(kids.blockedKeywords)
                        .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    whitelistChannels: safeArray(kids.whitelistChannels)
                        .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean),
                    whitelistKeywords: safeArray(kids.whitelistKeywords)
                        .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || source }))
                        .filter(Boolean)
                }
            };
        }

        const activeProfileId = normalizeString(profilesV4.activeProfileId) || DEFAULT_PROFILE_ID;
        const resolvedActiveId = outProfiles[activeProfileId] ? activeProfileId : (outProfiles[DEFAULT_PROFILE_ID] ? DEFAULT_PROFILE_ID : Object.keys(outProfiles)[0] || DEFAULT_PROFILE_ID);

        return {
            ...profilesV4,
            schemaVersion: 4,
            activeProfileId: resolvedActiveId,
            profiles: outProfiles
        };
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
                    mode: 'blocklist',
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
    function buildV3Export({ mainSettings, mainKeywords, mainChannels, channelMap, profilesV3, exportType = 'full', profileId = null, profileName = null }) {
        let profilesV4 = null;
        try {
            profilesV4 = sanitizeProfilesV4(mainSettings?.[FT_PROFILES_V4_KEY] || null, { source: 'export' });
        } catch (e) {
            profilesV4 = null;
        }
        return {
            meta: {
                version: 3,
                timestamp: nowTs(),
                application: 'FilterTube',
                exportType,
                ...((exportType === 'profile' && typeof profileId === 'string' && profileId.trim()) ? { profileId: profileId.trim() } : {}),
                ...((exportType === 'profile' && typeof profileName === 'string' && profileName.trim()) ? { profileName: profileName.trim() } : {})
            },
            ...(profilesV4 ? { profilesV4 } : {}),
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
                    mode: profilesV3?.kids?.mode || 'blocklist',
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

        let profilesV4 = null;
        try {
            const v4Candidate = root?.profilesV4 || root?.[FT_PROFILES_V4_KEY] || null;
            profilesV4 = sanitizeProfilesV4(v4Candidate, { source: 'import' });
        } catch (e) {
            profilesV4 = null;
        }

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
        const kidsMode = normalizeString(settings?.kids?.mode) || normalizeString(kids.mode) || 'blocklist';

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
            profilesV4,
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

    async function exportV3({ scope = 'auto', auth = null } = {}) {
        const SettingsAPI = global.FilterTubeSettings || {};
        if (typeof SettingsAPI.loadSettings !== 'function') {
            throw new Error('FilterTubeSettings.loadSettings not available');
        }

        const mainSettings = await SettingsAPI.loadSettings();
        const profilesV3 = await loadProfilesV3();

        let profilesV4 = null;
        try {
            profilesV4 = await loadProfilesV4();
        } catch (e) {
            profilesV4 = null;
        }

        const activeId = normalizeString(profilesV4?.activeProfileId) || DEFAULT_PROFILE_ID;
        const effectiveScope = resolveProfileScope(scope, activeId);

        const masterVerifier = extractMasterPinVerifier(profilesV4);
        if (activeId === DEFAULT_PROFILE_ID && masterVerifier) {
            await requirePinOrThrow(
                normalizeString(auth?.localMasterPin),
                masterVerifier,
                'Master PIN required'
            );
        }

        let profilesV4ForExport = profilesV4;
        let profilesV3ForExport = profilesV3;
        let mainChannels = safeArray(mainSettings.channels);
        let mainKeywords = safeArray(mainSettings.keywords);
        let exportType = 'full';
        let exportProfileId = null;
        let exportProfileName = null;

        if (effectiveScope === 'active') {
            exportType = 'profile';
            exportProfileId = activeId;
            exportProfileName = normalizeString(safeObject(safeObject(profilesV4?.profiles)[activeId]).name) || activeId;

            if (profilesV4 && profilesV4.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles)) {
                const activeProfile = safeObject(profilesV4.profiles[activeId]);
                profilesV4ForExport = {
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles: {
                        [activeId]: activeProfile
                    }
                };
                try {
                    profilesV4ForExport = sanitizeProfilesV4(profilesV4ForExport, { source: 'export' }) || profilesV4ForExport;
                } catch (e) {
                }

                const activeMain = safeObject(activeProfile.main);
                const activeKids = safeObject(activeProfile.kids);
                mainChannels = safeArray(activeMain.channels)
                    .map(entry => sanitizeChannelEntry(entry, { source: entry?.source || 'export' }))
                    .filter(Boolean);
                mainKeywords = safeArray(activeMain.keywords)
                    .map(entry => sanitizeKeywordEntry(entry, { source: entry?.source || 'export' }))
                    .filter(Boolean);

                profilesV3ForExport = deriveProfilesV3FromV4(profilesV4, activeId, { source: 'export' });

                if (Object.prototype.hasOwnProperty.call(activeKids, 'blockedChannels') || Object.prototype.hasOwnProperty.call(activeKids, 'blockedKeywords')) {
                    profilesV3ForExport = {
                        ...profilesV3ForExport,
                        kids: {
                            ...profilesV3ForExport.kids,
                            strictMode: activeKids.strictMode !== false
                        }
                    };
                }
            }
        }

        const exportSettings = {
            ...(mainSettings || {}),
            ...(profilesV4ForExport ? { [FT_PROFILES_V4_KEY]: profilesV4ForExport } : {})
        };

        return buildV3Export({
            mainSettings: exportSettings,
            mainKeywords,
            mainChannels,
            channelMap: mainSettings.channelMap || {},
            profilesV3: profilesV3ForExport,
            exportType,
            profileId: exportProfileId,
            profileName: exportProfileName
        });
    }

    async function importV3(json, { strategy = 'merge', scope = 'auto', auth = null } = {}) {
        const parsed = normalizeIncomingV3(json);
        if (!parsed.ok) {
            throw new Error(parsed.error || 'Invalid file');
        }

        const SettingsAPI = global.FilterTubeSettings || {};
        if (typeof SettingsAPI.loadSettings !== 'function' || typeof SettingsAPI.saveSettings !== 'function') {
            throw new Error('FilterTubeSettings load/save not available');
        }

        const current = await SettingsAPI.loadSettings();

        let localProfilesV4 = null;
        try {
            localProfilesV4 = await loadProfilesV4();
        } catch (e) {
            localProfilesV4 = null;
        }
        const localActiveId = normalizeString(localProfilesV4?.activeProfileId) || DEFAULT_PROFILE_ID;
        const effectiveScope = resolveProfileScope(scope, localActiveId);
        const canTouchLegacyV3 = localActiveId === DEFAULT_PROFILE_ID;

        const localMasterVerifier = extractMasterPinVerifier(localProfilesV4);
        if (localActiveId === DEFAULT_PROFILE_ID && localMasterVerifier) {
            await requirePinOrThrow(
                normalizeString(auth?.localMasterPin),
                localMasterVerifier,
                'Master PIN required'
            );
        }

        const incomingMasterVerifier = extractMasterPinVerifier(parsed.profilesV4);
        if (localActiveId === DEFAULT_PROFILE_ID && incomingMasterVerifier) {
            await requirePinOrThrow(
                normalizeString(auth?.incomingMasterPin),
                incomingMasterVerifier,
                'Backup Master PIN required'
            );
        }

        const rawRoot = safeObject(json);
        const rawMeta = safeObject(rawRoot.meta);
        const incomingExportType = normalizeString(rawMeta.exportType);
        const incomingExportProfileId = normalizeString(rawMeta.profileId);

        const incomingV4 = parsed.profilesV4;
        const incomingProfiles = safeObject(incomingV4?.profiles);
        const incomingActiveId = normalizeString(incomingV4?.activeProfileId) || incomingExportProfileId || DEFAULT_PROFILE_ID;
        const importingProfileId = incomingExportType === 'profile'
            ? (incomingExportProfileId || incomingActiveId)
            : '';
        const shouldImportIntoSeparateProfile = Boolean(
            incomingExportType === 'profile'
            && localActiveId === DEFAULT_PROFILE_ID
            && importingProfileId
            && importingProfileId !== DEFAULT_PROFILE_ID
        );
        const shouldTouchLegacyV3 = canTouchLegacyV3 && !shouldImportIntoSeparateProfile;

        let incomingProfileForImport = null;
        if (incomingV4) {
            if (effectiveScope === 'active' && localActiveId !== DEFAULT_PROFILE_ID) {
                const exactMatch = safeObject(incomingProfiles[localActiveId]);
                if (Object.keys(exactMatch).length > 0) {
                    incomingProfileForImport = exactMatch;
                } else if (incomingExportType === 'profile') {
                    const fallbackId = normalizeString(incomingV4.activeProfileId) || incomingExportProfileId;
                    incomingProfileForImport = safeObject(incomingProfiles[fallbackId]);
                } else {
                    throw new Error('Full backups can only be imported from the Default (Master) profile');
                }
            } else {
                const incomingActiveId = normalizeString(incomingV4.activeProfileId) || DEFAULT_PROFILE_ID;
                incomingProfileForImport = safeObject(incomingProfiles[incomingActiveId]);
            }
        }

        const incomingV4Settings = incomingProfileForImport ? safeObject(incomingProfileForImport.settings) : null;

        const v4MainChannels = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.main).channels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : null;
        const v4MainKeywords = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.main).keywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
            : null;

        const v4MainMode = incomingProfileForImport
            ? normalizeListMode(safeObject(incomingProfileForImport.main).mode, 'blocklist')
            : normalizeListMode(parsed.profilesV3?.main?.mode, 'blocklist');

        const v4MainWhitelistChannels = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.main).whitelistChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : safeArray(parsed.profilesV3?.main?.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);

        const v4MainWhitelistKeywords = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.main).whitelistKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
            : safeArray(parsed.profilesV3?.main?.whitelistedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean);

        const v4KidsBlockedChannels = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.kids).blockedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : null;
        const v4KidsBlockedKeywords = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.kids).blockedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
            : null;

        const v4KidsMode = incomingProfileForImport
            ? normalizeListMode(safeObject(incomingProfileForImport.kids).mode, 'blocklist')
            : normalizeListMode(parsed.profilesV3?.kids?.mode, 'blocklist');

        const v4KidsWhitelistChannels = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.kids).whitelistChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : safeArray(parsed.profilesV3?.kids?.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);

        const v4KidsWhitelistKeywords = incomingProfileForImport
            ? safeArray(safeObject(incomingProfileForImport.kids).whitelistKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
            : safeArray(parsed.profilesV3?.kids?.whitelistedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean);

        const parsedMainChannels = Array.isArray(v4MainChannels) ? v4MainChannels : parsed.mainChannels;
        const parsedMainKeywords = Array.isArray(v4MainKeywords) ? v4MainKeywords : parsed.mainKeywords;

        const nextChannels = strategy === 'replace'
            ? parsedMainChannels
            : mergeChannelLists(current.channels, parsedMainChannels);

        const nextKeywords = strategy === 'replace'
            ? parsedMainKeywords
            : mergeKeywordLists(current.keywords, parsedMainKeywords);

        const nextChannelMap = { ...safeObject(current.channelMap), ...safeObject(parsed.channelMap) };

        const mainSettingsOverrides = shouldTouchLegacyV3 ? safeObject(parsed.mainSettings) : {};

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

        const result = shouldImportIntoSeparateProfile
            ? { compiledSettings: null, error: null, skipped: true }
            : await SettingsAPI.saveSettings(payload);

        const incomingApplyKidsRulesOnMain = incomingV4Settings
            ? !!incomingV4Settings.syncKidsToMain
            : parsed.profilesV3.main.applyKidsRulesOnMain;

        const incomingKidsBlockedChannels = Array.isArray(v4KidsBlockedChannels)
            ? v4KidsBlockedChannels
            : parsed.profilesV3.kids.blockedChannels;

        const incomingKidsBlockedKeywords = Array.isArray(v4KidsBlockedKeywords)
            ? v4KidsBlockedKeywords
            : parsed.profilesV3.kids.blockedKeywords;

        let nextKidsBlockedChannelsForV4 = null;
        let nextKidsBlockedKeywordsForV4 = null;
        let nextKidsStrictModeForV4 = null;

        if (shouldTouchLegacyV3) {
            const storedProfiles = await loadProfilesV3();

            const nextProfiles = {
                main: {
                    mode: parsed.profilesV3.main.mode,
                    applyKidsRulesOnMain: incomingApplyKidsRulesOnMain,
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
                        ? incomingKidsBlockedChannels
                        : mergeChannelLists(storedProfiles.kids.blockedChannels, incomingKidsBlockedChannels),
                    blockedKeywords: strategy === 'replace'
                        ? incomingKidsBlockedKeywords
                        : mergeKeywordLists(storedProfiles.kids.blockedKeywords, incomingKidsBlockedKeywords),
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

            nextKidsBlockedChannelsForV4 = safeArray(nextProfiles.kids.blockedChannels);
            nextKidsBlockedKeywordsForV4 = safeArray(nextProfiles.kids.blockedKeywords);
            nextKidsStrictModeForV4 = nextProfiles.kids.strictMode !== false;
        }

        try {
            let profilesV4 = localProfilesV4 || await loadProfilesV4();
            let nextV4 = profilesV4;

            const incomingProfilesV4 = incomingV4;
            if (incomingProfilesV4 && effectiveScope === 'full' && localActiveId === DEFAULT_PROFILE_ID) {
                const sanitizedIncoming = sanitizeProfilesV4(incomingProfilesV4, { source: 'import' });
                if (sanitizedIncoming) {
                    if (strategy === 'replace') {
                        nextV4 = sanitizedIncoming;
                    } else {
                        const baseProfiles = safeObject(nextV4?.profiles);
                        const incomingProfiles = safeObject(sanitizedIncoming.profiles);
                        const mergedProfiles = { ...baseProfiles };

                        for (const [profileId, incProfileRaw] of Object.entries(incomingProfiles)) {
                            const incProfile = safeObject(incProfileRaw);
                            const existingProfile = safeObject(mergedProfiles[profileId]);
                            if (!existingProfile || Object.keys(existingProfile).length === 0) {
                                mergedProfiles[profileId] = incProfile;
                                continue;
                            }
                            const existingMain = safeObject(existingProfile.main);
                            const existingKids = safeObject(existingProfile.kids);
                            const incMain = safeObject(incProfile.main);
                            const incKids = safeObject(incProfile.kids);
                            mergedProfiles[profileId] = {
                                ...existingProfile,
                                ...incProfile,
                                settings: {
                                    ...safeObject(existingProfile.settings),
                                    ...safeObject(incProfile.settings)
                                },
                                main: {
                                    ...existingMain,
                                    ...incMain,
                                    channels: mergeChannelLists(existingMain.channels, incMain.channels),
                                    keywords: mergeKeywordLists(existingMain.keywords, incMain.keywords),
                                    mode: normalizeListMode(incMain.mode, normalizeListMode(existingMain.mode, 'blocklist')),
                                    whitelistChannels: mergeChannelLists(existingMain.whitelistChannels, incMain.whitelistChannels),
                                    whitelistKeywords: mergeKeywordLists(existingMain.whitelistKeywords, incMain.whitelistKeywords)
                                },
                                kids: {
                                    ...existingKids,
                                    ...incKids,
                                    mode: normalizeListMode(incKids.mode, normalizeListMode(existingKids.mode, 'blocklist')),
                                    strictMode: incKids.strictMode !== false,
                                    blockedChannels: mergeChannelLists(existingKids.blockedChannels, incKids.blockedChannels),
                                    blockedKeywords: mergeKeywordLists(existingKids.blockedKeywords, incKids.blockedKeywords),
                                    whitelistChannels: mergeChannelLists(existingKids.whitelistChannels, incKids.whitelistChannels),
                                    whitelistKeywords: mergeKeywordLists(existingKids.whitelistKeywords, incKids.whitelistKeywords)
                                }
                            };
                        }

                        nextV4 = {
                            ...nextV4,
                            schemaVersion: 4,
                            profiles: mergedProfiles
                        };
                    }
                }
            }

            const desiredActiveId = (effectiveScope === 'active')
                ? localActiveId
                : ((strategy === 'replace' && nextV4 && typeof nextV4.activeProfileId === 'string')
                    ? nextV4.activeProfileId
                    : (typeof profilesV4?.activeProfileId === 'string' ? profilesV4.activeProfileId : DEFAULT_PROFILE_ID));

            const profiles = safeObject(nextV4?.profiles);
            const activeId = normalizeString(desiredActiveId) || DEFAULT_PROFILE_ID;
            const writeActiveId = activeId;

            const targetProfileId = shouldImportIntoSeparateProfile
                ? importingProfileId
                : activeId;

            const targetProfile = (profiles[targetProfileId] && typeof profiles[targetProfileId] === 'object')
                ? profiles[targetProfileId]
                : {};
            const targetSettings = safeObject(targetProfile.settings);
            const targetMain = safeObject(targetProfile.main);
            const targetKids = safeObject(targetProfile.kids);

            const incomingStrict = (incomingProfileForImport && typeof safeObject(incomingProfileForImport.kids).strictMode === 'boolean')
                ? safeObject(incomingProfileForImport.kids).strictMode
                : parsed.profilesV3.kids.strictMode;
            const desiredKidsStrict = incomingStrict !== false;

            const targetNextChannels = shouldImportIntoSeparateProfile
                ? (strategy === 'replace'
                    ? parsedMainChannels
                    : mergeChannelLists(safeArray(targetMain.channels), parsedMainChannels))
                : nextChannels;
            const targetNextKeywords = shouldImportIntoSeparateProfile
                ? (strategy === 'replace'
                    ? parsedMainKeywords
                    : mergeKeywordLists(safeArray(targetMain.keywords), parsedMainKeywords))
                : nextKeywords;

            const desiredKidsBlockedChannels = strategy === 'replace'
                ? incomingKidsBlockedChannels
                : mergeChannelLists(safeArray(targetKids.blockedChannels), incomingKidsBlockedChannels);
            const desiredKidsBlockedKeywords = strategy === 'replace'
                ? incomingKidsBlockedKeywords
                : mergeKeywordLists(safeArray(targetKids.blockedKeywords), incomingKidsBlockedKeywords);

            const desiredMainWhitelistChannels = strategy === 'replace'
                ? v4MainWhitelistChannels
                : mergeChannelLists(safeArray(targetMain.whitelistChannels), v4MainWhitelistChannels);

            const desiredMainWhitelistKeywords = strategy === 'replace'
                ? v4MainWhitelistKeywords
                : mergeKeywordLists(safeArray(targetMain.whitelistKeywords), v4MainWhitelistKeywords);

            const desiredKidsWhitelistChannels = strategy === 'replace'
                ? v4KidsWhitelistChannels
                : mergeChannelLists(safeArray(targetKids.whitelistChannels), v4KidsWhitelistChannels);

            const desiredKidsWhitelistKeywords = strategy === 'replace'
                ? v4KidsWhitelistKeywords
                : mergeKeywordLists(safeArray(targetKids.whitelistKeywords), v4KidsWhitelistKeywords);

            profiles[targetProfileId] = {
                ...targetProfile,
                type: typeof targetProfile.type === 'string'
                    ? targetProfile.type
                    : (targetProfileId === DEFAULT_PROFILE_ID ? 'account' : 'child'),
                parentProfileId: (targetProfileId === DEFAULT_PROFILE_ID)
                    ? null
                    : (targetProfile.parentProfileId != null ? targetProfile.parentProfileId : DEFAULT_PROFILE_ID),
                name: typeof targetProfile.name === 'string'
                    ? targetProfile.name
                    : (targetProfileId === DEFAULT_PROFILE_ID ? 'Default' : 'Profile'),
                settings: {
                    ...targetSettings,
                    syncKidsToMain: !!incomingApplyKidsRulesOnMain
                },
                main: {
                    ...targetMain,
                    mode: normalizeListMode(targetMain.mode, v4MainMode),
                    channels: targetNextChannels,
                    keywords: targetNextKeywords,
                    whitelistChannels: safeArray(desiredMainWhitelistChannels),
                    whitelistKeywords: safeArray(desiredMainWhitelistKeywords)
                },
                kids: {
                    ...targetKids,
                    mode: normalizeListMode(targetKids.mode, v4KidsMode),
                    strictMode: desiredKidsStrict,
                    blockedChannels: safeArray(desiredKidsBlockedChannels),
                    blockedKeywords: safeArray(desiredKidsBlockedKeywords),
                    whitelistChannels: safeArray(desiredKidsWhitelistChannels),
                    whitelistKeywords: safeArray(desiredKidsWhitelistKeywords)
                }
            };

            await saveProfilesV4({
                ...nextV4,
                schemaVersion: 4,
                activeProfileId: writeActiveId,
                profiles
            });
        } catch (e) {
            console.warn('FilterTube: importV3 failed to sync ftProfilesV4', e);
        }

        if (shouldTouchLegacyV3 && parsed.theme && SettingsAPI.setThemePreference) {
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

    async function exportV3Encrypted({ scope = 'auto', password = '', auth = null } = {}) {
        const Security = global.FilterTubeSecurity || null;
        if (!Security || typeof Security.encryptJson !== 'function') {
            throw new Error('Security manager unavailable');
        }
        const payload = await exportV3({ scope, auth });
        const encrypted = await Security.encryptJson(payload, password);
        return {
            meta: {
                ...safeObject(payload?.meta),
                encrypted: true
            },
            encrypted
        };
    }

    async function importV3Encrypted(container, { password = '', strategy = 'merge', scope = 'auto', auth = null } = {}) {
        const Security = global.FilterTubeSecurity || null;
        if (!Security || typeof Security.decryptJson !== 'function') {
            throw new Error('Security manager unavailable');
        }
        const root = safeObject(container);
        const meta = safeObject(root.meta);
        if (meta.encrypted !== true || !root.encrypted) {
            throw new Error('Invalid encrypted backup');
        }
        const decrypted = await Security.decryptJson(root.encrypted, password);
        return importV3(decrypted, { strategy, scope, auth });
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
            if (!settings || settings.autoBackupEnabled !== true) {
                return { ok: true, skipped: true, reason: 'disabled' };
            }
            const profilesV3 = await loadProfilesV3();

            let profilesV4 = null;
            try {
                profilesV4 = await loadProfilesV4();
            } catch (e) {
                profilesV4 = null;
            }

            const activeId = normalizeString(profilesV4?.activeProfileId) || DEFAULT_PROFILE_ID;
            const effectiveScope = resolveProfileScope('auto', activeId);
            const profilesV4ForExport = (effectiveScope === 'active' && profilesV4 && profilesV4.profiles && typeof profilesV4.profiles === 'object' && !Array.isArray(profilesV4.profiles))
                ? {
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles: {
                        [activeId]: safeObject(profilesV4.profiles[activeId])
                    }
                }
                : profilesV4;
            const profilesV3ForExport = (effectiveScope === 'active' && profilesV4)
                ? deriveProfilesV3FromV4(profilesV4, activeId, { source: 'export' })
                : profilesV3;

            // Build backup data (same as export but without transient data)
            const backupData = buildV3Export({
                mainSettings: {
                    ...(settings || {}),
                    ...(profilesV4ForExport ? { [FT_PROFILES_V4_KEY]: profilesV4ForExport } : {})
                },
                mainKeywords: settings.keywords || [],
                mainChannels: settings.channels || [],
                channelMap: settings.channelMap || {},
                profilesV3: profilesV3ForExport,
                exportType: effectiveScope === 'active' ? 'profile' : 'full',
                profileId: effectiveScope === 'active' ? activeId : null,
                profileName: effectiveScope === 'active' ? (normalizeString(safeObject(safeObject(profilesV4?.profiles)[activeId]).name) || activeId) : null
            });

            // Mark as backup with metadata
            backupData.meta.backupType = 'auto';
            backupData.meta.trigger = triggerType;
            backupData.meta.backupLocation = await getBackupDirectory();

            // Generate filename with timestamp
            const safePart = (value) => {
                const raw = normalizeString(value);
                if (!raw) return '';
                return raw
                    .replace(/\s+/g, '-')
                    .replace(/[^a-zA-Z0-9._-]/g, '')
                    .replace(/-+/g, '-')
                    .replace(/^[-_.]+|[-_.]+$/g, '')
                    .slice(0, 48);
            };

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const profileName = normalizeString(safeObject(safeObject(profilesV4?.profiles)[activeId]).name) || activeId;
            const label = safePart(profileName) || safePart(activeId) || 'Default';
            const filename = `FilterTube-Backup-${label}-${timestamp}.json`;

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
        exportV3Encrypted,
        importV3,
        importV3Encrypted,
        loadProfilesV3,
        saveProfilesV3,
        loadProfilesV4,
        saveProfilesV4,
        // Auto-backup functions
        createAutoBackup,
        scheduleAutoBackup,
        rotateBackups
    };
})(typeof window !== 'undefined' ? window : this);
