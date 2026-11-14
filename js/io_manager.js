(function (global) {
    'use strict';

    /**
     * IO Manager (import/export + profile persistence helpers)
     *
     * Centralizes serialization/deserialization helpers used by the dashboard’s
     * Import / Export panel. Functions here deliberately avoid UI dependencies
     * so they can be reused by the popup, background, and future automation.
     */

    const IS_FIREFOX_IO_MANAGER = typeof browser !== 'undefined' && !!browser.runtime;
    const runtimeAPI = IS_FIREFOX_IO_MANAGER ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    const STORAGE_NAMESPACE = runtimeAPI?.storage?.local;

    const FT_PROFILES_V3_KEY = 'ftProfilesV3';
    const FT_PROFILES_V4_KEY = 'ftProfilesV4';
    const NANAH_TRUSTED_LINKS_KEY = 'ftNanahTrustedLinks';
    const NANAH_DEVICE_ID_KEY = 'ftNanahDeviceId';
    const DEFAULT_PROFILE_ID = 'default';
    const SAVED_NOTES_KEY = 'ftSavedVideoNotesV1';
    const LOCAL_PLAYLISTS_KEY = 'ftLocalPlaylistsV1';
    const KIDS_PERSONA_LINKS_KEY = 'kidsPersonaLinks';

    /** Returns a timestamp in ms (kept inline so tests can stub). */
    function nowTs() {
        return Date.now();
    }

    /** Coerces unknown values into arrays so downstream logic can assume [] */
    /** Study mode model (js/shared/study_model.js); absent in contexts that don't load it. */
    function studyModel() {
        const model = global.FilterTubeStudyModel;
        return model && typeof model.mergeStudy === 'function' ? model : null;
    }

    /**
     * Profile fields for an incoming study object (Android StudyMerge rules): packs and edits merge like
     * keywords, progress takes the larger value per device and day, and this device keeps its own running
     * lock and parent-set plan unless carryLock (Move account). The stored objects are merged; a study
     * rebuilt from study:<packId> tags is a read-time view and isn't written here.
     */
    function mergedStudyFields(localProfile, incomingProfile, strategy, carryLock = false) {
        const model = studyModel();
        const localStudy = safeObject(localProfile).study;
        const incomingStudy = safeObject(incomingProfile).study;
        if (!model) {
            const kept = incomingStudy || localStudy;
            return kept ? { study: kept } : {};
        }
        const merged = model.mergeStudy(localStudy, incomingStudy, { strategy, carryLock });
        return merged ? { study: merged } : {};
    }

    function withoutStudyField(profile) {
        const { study: _study, ...rest } = safeObject(profile);
        return rest;
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function parsePackedChannelKeywordSource(sourceValue) {
        const raw = normalizeString(sourceValue);
        if (!raw.toLowerCase().startsWith('channel:')) return null;
        const ref = raw.slice(raw.indexOf(':') + 1).split('|')[0].trim().toLowerCase();
        return ref ? { source: 'channel', channelRef: ref } : null;
    }

    /** Filters out primitives, nulls, and arrays so we only pass plain objects. */
    function safeObject(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
            } catch (e) {
            }
        }
        return {};
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeNonNegativeInteger(value) {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isInteger(num)) return null;
        return num >= 0 ? num : null;
    }

    function isValidManagedTimeLimitTimezone(timezone) {
        const value = normalizeString(timezone);
        if (!value) return false;
        try {
            if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
                return value === 'UTC' || value === 'Etc/UTC';
            }
            new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
            return true;
        } catch (e) {
            return false;
        }
    }

    function normalizeManagedTimeLimitPolicy(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const raw = safeObject(value);
        if (normalizeString(raw.schema) !== 'filtertube_managed_time_limit') return null;
        if (raw.version !== 1) return null;
        if (typeof raw.enabled !== 'boolean') return null;

        const timezone = normalizeString(raw.timezone);
        const dailyBudgetSeconds = normalizeNonNegativeInteger(raw.dailyBudgetSeconds);
        const policyRevision = normalizeNonNegativeInteger(raw.policyRevision);
        const policyHash = normalizeString(raw.policyHash);
        const issuedAt = normalizeNonNegativeInteger(raw.issuedAt);
        if (!isValidManagedTimeLimitTimezone(timezone) || dailyBudgetSeconds == null || !policyRevision || !policyHash || issuedAt == null) return null;

        const out = {
            schema: 'filtertube_managed_time_limit',
            version: 1,
            enabled: raw.enabled,
            timezone,
            dailyBudgetSeconds,
            countingMode: normalizeString(raw.countingMode) || 'active_youtube_tab',
            activeDeviceBudgetPolicy: normalizeString(raw.activeDeviceBudgetPolicy) || 'single_active_tab_no_double_count',
            resetPolicy: normalizeString(raw.resetPolicy) || 'policy_timezone_midnight',
            graceSeconds: normalizeNonNegativeInteger(raw.graceSeconds) || 0,
            parentGrant: {
                enabled: safeObject(raw.parentGrant).enabled === true,
                extraSeconds: normalizeNonNegativeInteger(safeObject(raw.parentGrant).extraSeconds) || 0,
                expiresAt: safeObject(raw.parentGrant).expiresAt == null ? null : normalizeNonNegativeInteger(safeObject(raw.parentGrant).expiresAt),
                reason: normalizeString(safeObject(raw.parentGrant).reason)
            },
            policyRevision,
            policyHash,
            issuedAt,
            validFrom: raw.validFrom == null ? issuedAt : normalizeNonNegativeInteger(raw.validFrom),
            validUntil: raw.validUntil == null ? null : normalizeNonNegativeInteger(raw.validUntil)
        };

        if (out.countingMode !== 'active_youtube_tab'
            || out.activeDeviceBudgetPolicy !== 'single_active_tab_no_double_count'
            || out.resetPolicy !== 'policy_timezone_midnight') {
            return null;
        }
        if (out.parentGrant.enabled && out.parentGrant.expiresAt == null) return null;
        if (out.validFrom == null || (raw.validUntil != null && out.validUntil == null)) return null;

        const surfaceBudgets = safeObject(raw.surfaceBudgets);
        const hasSurfaceBudget = Object.prototype.hasOwnProperty.call(surfaceBudgets, 'main')
            || Object.prototype.hasOwnProperty.call(surfaceBudgets, 'kids');
        if (hasSurfaceBudget) {
            const main = normalizeNonNegativeInteger(surfaceBudgets.main);
            const kids = normalizeNonNegativeInteger(surfaceBudgets.kids);
            if (main == null || kids == null) return null;
            out.surfaceBudgets = { main, kids };
        }

        return out;
    }

    function revokeDownloadBlobUrlLater(blobUrl, delayMs = 60000) {
        if (!blobUrl || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
        setTimeout(() => {
            try {
                URL.revokeObjectURL(blobUrl);
            } catch (e) {
            }
        }, delayMs);
    }

    function downloadWithRuntimeApi(downloadOptions) {
        return new Promise(resolve => {
            if (!runtimeAPI?.downloads || typeof runtimeAPI.downloads.download !== 'function') {
                resolve({ ok: false, reason: 'Downloads API unavailable' });
                return;
            }

            let settled = false;
            const finish = (result) => {
                if (settled) return;
                settled = true;
                resolve(result);
            };

            try {
                if (IS_FIREFOX_IO_MANAGER) {
                    const promise = runtimeAPI.downloads.download(downloadOptions);
                    if (promise && typeof promise.then === 'function') {
                        promise
                            .then(downloadId => finish({ ok: true, downloadId }))
                            .catch(error => finish({ ok: false, reason: error?.message || 'Download failed' }));
                    } else {
                        finish({ ok: true, downloadId: promise });
                    }
                    return;
                }

                const maybePromise = runtimeAPI.downloads.download(downloadOptions, (downloadId) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        finish({ ok: false, reason: err.message || 'Download failed' });
                        return;
                    }
                    finish({ ok: true, downloadId });
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise
                        .then(downloadId => finish({ ok: true, downloadId }))
                        .catch(error => finish({ ok: false, reason: error?.message || 'Download failed' }));
                }
            } catch (error) {
                finish({ ok: false, reason: error?.message || 'Download failed' });
            }
        });
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
        const matchMode = entry?.matchMode === 'regex' ? 'regex' : 'literal';
        const regexFlags = matchMode === 'regex' ? normalizeString(entry?.regexFlags) : '';
        return `${word}|${exact}|${comments}|${semantic}|${matchMode}|${regexFlags}`;
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

        const comments = (typeof commentsCandidate === 'boolean') ? commentsCandidate : false;

        const sourceCandidate = Object.prototype.hasOwnProperty.call(overrides, 'source')
            ? overrides.source
            : entry?.source;
        const packedSource = parsePackedChannelKeywordSource(sourceCandidate) || parsePackedChannelKeywordSource(entry?.source);

        const source = packedSource
            ? 'channel'
            : (sourceCandidate === 'channel' || sourceCandidate === 'user' || sourceCandidate === 'import')
            ? sourceCandidate
            : ((entry?.source === 'channel' || normalizeString(entry?.channelRef)) ? 'channel' : 'user');

        const channelRefCandidate = Object.prototype.hasOwnProperty.call(overrides, 'channelRef')
            ? overrides.channelRef
            : entry?.channelRef;

        const channelRef = normalizeString(channelRefCandidate) || packedSource?.channelRef || null;

        return {
            word,
            exact: !!entry?.exact,
            semantic: !!entry?.semantic,
            source,
            channelRef,
            comments,
            matchMode: entry?.matchMode === 'regex' ? 'regex' : 'literal',
            regexFlags: entry?.matchMode === 'regex' && /^[gimsuy]*$/.test(normalizeString(entry?.regexFlags))
                ? normalizeString(entry.regexFlags)
                : '',
            scope: ['title', 'channel_name', 'comment'].includes(entry?.scope) ? entry.scope : null,
            ...(entry?.modeBootstrapCopy === true ? { modeBootstrapCopy: true } : {}),
            // Rows a list or study pack added keep their tag (managedListId "study:<packId>").
            ...(normalizeString(entry?.managedListId) ? { managedListId: normalizeString(entry.managedListId) } : {}),
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

    function normalizeChannelIdentityValue(value) {
        const raw = normalizeString(value);
        if (!raw) return '';

        const decode = (candidate) => {
            try {
                return decodeURIComponent(candidate);
            } catch (e) {
                return candidate;
            }
        };
        const normalized = raw.replace(/^\/+/, '');
        const idMatch = normalized.match(/^(?:channel\/)?(UC[\w-]{22})$/i);
        if (idMatch) return `id:${idMatch[1].toLowerCase()}`;

        const handleMatch = normalized.match(/^(@[A-Za-z0-9._-]{2,})$/);
        if (handleMatch) return `handle:${handleMatch[1].toLowerCase()}`;

        const customMatch = normalized.match(/^(c|user)\/([^\s/?#]+)$/i);
        if (customMatch) return `custom:${customMatch[1].toLowerCase()}/${decode(customMatch[2]).toLowerCase()}`;

        const looksLikeUrl = /^https?:\/\//i.test(raw)
            || /^(?:www\.)?(?:m\.|music\.)?youtube\.com\//i.test(raw);
        if (!looksLikeUrl || typeof URL !== 'function') return '';
        try {
            const candidate = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
            const host = normalizeString(candidate.hostname).replace(/^www\./i, '').toLowerCase();
            if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return '';
            const parts = candidate.pathname.split('/').filter(Boolean).map(decode);
            if (parts[0]?.toLowerCase() === 'channel' && /^UC[\w-]{22}$/i.test(parts[1] || '')) {
                return `id:${parts[1].toLowerCase()}`;
            }
            if (parts[0] && /^@[A-Za-z0-9._-]{2,}$/.test(parts[0])) {
                return `handle:${parts[0].toLowerCase()}`;
            }
            if (parts[0] && /^(c|user)$/i.test(parts[0]) && parts[1]) {
                return `custom:${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
            }
        } catch (e) {
        }
        return '';
    }

    function channelIdentityKeys(entry) {
        const values = [
            entry?.id,
            ...(Array.isArray(entry?.alternateIds) ? entry.alternateIds : []),
            entry?.handle,
            entry?.handleDisplay,
            entry?.canonicalHandle,
            entry?.customUrl,
            entry?.originalInput
        ];
        const keys = [...new Set(values.map(normalizeChannelIdentityValue).filter(Boolean))];
        if (keys.length) return keys;
        const name = normalizeString(entry?.name).toLowerCase();
        return name ? [`name:${name}`] : [];
    }

    function uniqueChannelEntries(entries) {
        const seen = new Set();
        const unique = [];
        for (const entry of safeArray(entries)) {
            const keys = channelIdentityKeys(entry);
            if (!keys.length) continue;
            if (keys.some(key => seen.has(key))) {
                // Retain aliases discovered on a duplicate row as part of the
                // same identity cluster (for example UC-A + alternate UC-B),
                // so a later UC-B row is also recognized as a duplicate.
                keys.forEach(key => seen.add(key));
                continue;
            }
            keys.forEach(key => seen.add(key));
            unique.push(entry);
        }
        return unique;
    }

    /**
     * Returns the best identifier for a channel. Identity aliases are kept
     * separately so a later import can merge a UC ID with its alternate ID,
     * handle, or custom URL. A name-only rule remains name-scoped because a
     * display name is not a unique channel identity.
     */
    function channelKey(entry) {
        return channelIdentityKeys(entry)[0] || '';
    }

    function isPlaceholderChannelName(entry, value) {
        const name = normalizeString(value).toLowerCase();
        if (!name) return true;
        const identityValues = [
            entry?.id,
            ...(Array.isArray(entry?.alternateIds) ? entry.alternateIds : []),
            entry?.handle,
            entry?.handleDisplay,
            entry?.canonicalHandle,
            entry?.customUrl,
            entry?.originalInput
        ].map(normalizeString).filter(Boolean).map(item => item.toLowerCase());
        return identityValues.includes(name)
            || name.startsWith('@')
            || name.startsWith('c/')
            || name.startsWith('user/')
            || name.includes('youtube.com/')
            || name.includes('youtu.be/');
    }

    function mergeChannelEntries(existing, incoming) {
        if (!existing) return incoming;
        if (!incoming) return existing;
        const merged = { ...existing, ...incoming };

        // Import rows often start as a bare UC ID. Do not let that placeholder
        // erase metadata already learned from YouTube on a previous import or
        // a user-added rule.
        const existingHasMetadata = Boolean(
            normalizeString(existing.handle)
            || normalizeString(existing.handleDisplay)
            || normalizeString(existing.canonicalHandle)
            || normalizeString(existing.customUrl)
            || normalizeString(existing.logo)
        );
        const incomingHasMetadata = Boolean(
            normalizeString(incoming.handle)
            || normalizeString(incoming.handleDisplay)
            || normalizeString(incoming.canonicalHandle)
            || normalizeString(incoming.customUrl)
            || normalizeString(incoming.logo)
        );
        if ((!incomingHasMetadata && existingHasMetadata)
            || (isPlaceholderChannelName(incoming, incoming.name)
                && !isPlaceholderChannelName(existing, existing.name))) {
            merged.name = existing.name;
        }
        const existingId = normalizeString(existing.id);
        const incomingId = normalizeString(incoming.id);
        if (/^UC[\w-]{22}$/i.test(existingId)) {
            merged.id = existingId;
        } else if (incomingId) {
            merged.id = incomingId;
        }
        for (const field of ['handle', 'handleDisplay', 'canonicalHandle', 'logo', 'customUrl']) {
            if (!normalizeString(incoming[field]) && normalizeString(existing[field])) {
                merged[field] = existing[field];
            }
        }
        if (!normalizeString(incoming.originalInput) && normalizeString(existing.originalInput)) {
            merged.originalInput = existing.originalInput;
        }
        if (existing.filterAll === true && incoming.filterAll !== true) {
            merged.filterAll = true;
        }

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

        const mergedPrimaryId = normalizeString(merged.id).toLowerCase();
        merged.alternateIds = Array.from(new Set([
            ...(Array.isArray(existing.alternateIds) ? existing.alternateIds : []),
            ...(Array.isArray(incoming.alternateIds) ? incoming.alternateIds : []),
            existingId,
            incomingId
        ].filter(value => typeof value === 'string' && /^UC[\w-]{22}$/i.test(value.trim()))
            .filter(value => value.trim().toLowerCase() !== mergedPrimaryId)));

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
        const alternateIds = Array.from(new Set(
            (Array.isArray(entry.alternateIds) ? entry.alternateIds : [])
                .map(value => normalizeString(value))
                .filter(value => /^UC[\w-]{22}$/i.test(value))
                .filter(value => value.toLowerCase() !== String(id || '').toLowerCase())
        ));
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
                    const collabCustomUrl = normalizeString(collab.customUrl);
                    const collabLogo = normalizeString(collab.logo);
                    const collabAlternateIds = Array.from(new Set(
                        (Array.isArray(collab.alternateIds) ? collab.alternateIds : [])
                            .map(value => normalizeString(value))
                            .filter(value => /^UC[\w-]{22}$/i.test(value))
                            .filter(value => value.toLowerCase() !== collabId.toLowerCase())
                    ));
                    if (!collabHandle && !collabId && !collabName) return null;
                    return {
                        handle: collabHandle || null,
                        name: collabName || null,
                        id: collabId || null,
                        customUrl: collabCustomUrl,
                        logo: collabLogo,
                        ...(collabAlternateIds.length > 0 ? { alternateIds: collabAlternateIds } : {})
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
            ...(alternateIds.length > 0 ? { alternateIds } : {}),
            filterAll: !!entry.filterAll,
            filterAllComments,
            source,
            originalInput,
            addedAt,
            ...(normalizeString(entry.managedListId) ? { managedListId: normalizeString(entry.managedListId) } : {}),
            ...(normalizeString(entry.managedListName) ? { managedListName: normalizeString(entry.managedListName) } : {}),
            ...(normalizeString(entry.managedListSourceLabel) ? { managedListSourceLabel: normalizeString(entry.managedListSourceLabel) } : {}),
            ...(normalizeString(entry.managedListSourceUrl) ? { managedListSourceUrl: normalizeString(entry.managedListSourceUrl) } : {}),
            ...(normalizeString(entry.managedListSourceFormat) ? { managedListSourceFormat: normalizeString(entry.managedListSourceFormat) } : {}),
            ...(typeof entry.managedListImportedAt === 'number' && Number.isFinite(entry.managedListImportedAt) ? { managedListImportedAt: entry.managedListImportedAt } : {}),
            ...(typeof entry.managedListLastCheckedAt === 'number' && Number.isFinite(entry.managedListLastCheckedAt) ? { managedListLastCheckedAt: entry.managedListLastCheckedAt } : {}),
            ...(normalizeString(entry.managedListContentHash) ? { managedListContentHash: normalizeString(entry.managedListContentHash) } : {}),
            ...(entry.managedListPaused === true ? { managedListPaused: true } : {}),
            ...(entry.modeBootstrapCopy === true ? { modeBootstrapCopy: true } : {}),
            ...(collaborationGroupId ? { collaborationGroupId } : {}),
            ...(Array.isArray(collaborationWith) ? { collaborationWith } : {}),
            ...(Array.isArray(allCollaborators) ? { allCollaborators } : {})
        };
    }

    /** Thin promise wrapper around chrome.storage.local.get */
    async function readStorage(keys, { required = false } = {}) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const succeeded = items => {
                if (settled) return;
                settled = true;
                resolve(items || {});
            };
            const failed = error => {
                if (settled) return;
                settled = true;
                if (required) reject(error instanceof Error ? error : new Error(normalizeString(error?.message) || 'Extension storage could not be read. Try again.'));
                else resolve({});
            };
            if (!STORAGE_NAMESPACE || typeof STORAGE_NAMESPACE.get !== 'function') {
                failed(new Error('Extension storage read is unavailable.'));
                return;
            }
            try {
                const pending = STORAGE_NAMESPACE.get(keys, items => {
                    const error = runtimeAPI?.runtime?.lastError;
                    if (error) failed(error);
                    else succeeded(items);
                });
                if (pending && typeof pending.then === 'function') pending.then(succeeded, failed);
            } catch (error) { failed(error); }
        });
    }

    /** Thin promise wrapper around chrome.storage.local.set */
    async function writeStorage(payload) {
        return new Promise((resolve) => {
            if (!STORAGE_NAMESPACE) return resolve({ ok: false });
            try {
                STORAGE_NAMESPACE.set(payload, () => {
                    const err = runtimeAPI?.runtime?.lastError || null;
                    resolve({ ok: !err, error: err });
                });
            } catch (e) {
                resolve({ ok: false, error: e });
            }
        });
    }

    async function removeStorage(keys) {
        const normalizedKeys = safeArray(keys).filter(key => typeof key === 'string' && key);
        if (!normalizedKeys.length) return { ok: true };
        return new Promise((resolve) => {
            if (!STORAGE_NAMESPACE || typeof STORAGE_NAMESPACE.remove !== 'function') {
                return resolve({ ok: false, error: new Error('Extension storage remove is unavailable') });
            }
            try {
                STORAGE_NAMESPACE.remove(normalizedKeys, () => {
                    const err = runtimeAPI?.runtime?.lastError || null;
                    resolve({ ok: !err, error: err });
                });
            } catch (e) {
                resolve({ ok: false, error: e });
            }
        });
    }

    function storageErrorMessage(result, label = 'Storage write') {
        const message = normalizeString(result?.error?.message)
            || normalizeString(result?.error)
            || 'the browser rejected the update';
        return `${label} failed: ${message}`;
    }

    function requireStorageSuccess(result, label) {
        if (!result || result.ok !== true) {
            throw new Error(storageErrorMessage(result, label));
        }
        return result;
    }

    async function getStorageBytesInUse() {
        if (!STORAGE_NAMESPACE || typeof STORAGE_NAMESPACE.getBytesInUse !== 'function') return null;
        return new Promise((resolve) => {
            try {
                const maybePromise = STORAGE_NAMESPACE.getBytesInUse(null, (bytes) => {
                    const err = runtimeAPI?.runtime?.lastError || null;
                    resolve(err ? null : (Number.isFinite(Number(bytes)) ? Number(bytes) : null));
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise
                        .then(bytes => resolve(Number.isFinite(Number(bytes)) ? Number(bytes) : null))
                        .catch(() => resolve(null));
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    function jsonByteLength(value) {
        const serialized = JSON.stringify(value == null ? null : value);
        if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(serialized).length;
        }
        try {
            return unescape(encodeURIComponent(serialized)).length;
        } catch (e) {
            return serialized.length;
        }
    }

    function hasUnlimitedStoragePermission() {
        try {
            const permissions = safeArray(runtimeAPI?.runtime?.getManifest?.()?.permissions);
            return permissions.includes('unlimitedStorage');
        } catch (e) {
            return false;
        }
    }

    async function buildImportStoragePreflight(json, parsed) {
        const storageBytesBefore = await getStorageBytesInUse();
        const normalizedRuleBytes = jsonByteLength({
            channels: parsed.mainChannels,
            keywords: parsed.mainKeywords,
            videoIds: parsed.profilesV3?.main?.videoIds,
            kids: parsed.profilesV3?.kids
        });
        const sourceBytes = jsonByteLength(json);
        // The current runtime keeps canonical profile data plus compatibility
        // and compiled indexes. Use a conservative estimate before mutating so
        // browsers with the default quota fail clearly instead of half-importing.
        const estimatedAdditionalBytes = Math.max(sourceBytes, normalizedRuleBytes * 4) + (256 * 1024);
        const quotaBytes = Number(STORAGE_NAMESPACE?.QUOTA_BYTES) || null;
        const unlimitedStorage = hasUnlimitedStoragePermission();

        if (
            !unlimitedStorage
            && quotaBytes
            && storageBytesBefore != null
            && storageBytesBefore + estimatedAdditionalBytes > quotaBytes
        ) {
            throw new Error(
                `Import needs about ${Math.ceil(estimatedAdditionalBytes / 1024)} KB of working storage, `
                + `but only ${Math.max(0, Math.floor((quotaBytes - storageBytesBefore) / 1024))} KB remains`
            );
        }

        return {
            sourceBytes,
            normalizedRuleBytes,
            estimatedAdditionalBytes,
            storageBytesBefore,
            quotaBytes,
            unlimitedStorage
        };
    }

    async function restoreStorageSnapshot(snapshot) {
        // Profile import does not own private notes, installation writers or Auto-sync
        // grants/queues. Rollback must not revive revoked consent or old deliveries.
        const privateNotesKeys = new Set([SAVED_NOTES_KEY, 'ftSavedVideoNotesWriterV1', LOCAL_PLAYLISTS_KEY, 'ftDeviceAutoSyncV1', 'ftAutoSyncQueueV1']);
        const safeSnapshot = Object.fromEntries(Object.entries(safeObject(snapshot)).filter(([key]) => !privateNotesKeys.has(key)));
        const current = await readStorage(null, { required: true });
        const extraKeys = Object.keys(safeObject(current)).filter(
            key => !privateNotesKeys.has(key) && !Object.prototype.hasOwnProperty.call(safeSnapshot, key)
        );
        if (extraKeys.length) {
            requireStorageSuccess(await removeStorage(extraKeys), 'Import rollback cleanup');
        }
        requireStorageSuccess(await writeStorage(safeSnapshot), 'Import rollback restore');
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
                        allowMainViewing: true,
                        allowKidsViewing: true,
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
            const hasLegacyFilterComments = Object.prototype.hasOwnProperty.call(settings, 'filterComments');
            const legacyKeywordCommentsEnabled = hasLegacyFilterComments && settings.hideComments !== true && settings.filterComments === true;
            const sanitizeMainKeywords = (list) => safeArray(list)
                .map(entry => sanitizeKeywordEntry(entry, {
                    source: entry?.source || source,
                    comments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : entry?.comments
                }))
                .filter(Boolean);
            const sanitizeMainChannels = (list) => safeArray(list)
                .map(entry => sanitizeChannelEntry(entry, {
                    source: entry?.source || source,
                    filterAllComments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : entry?.filterAllComments
                }))
                .filter(Boolean);
            const sanitizedSettings = { ...settings };
            const timeLimitPolicy = normalizeManagedTimeLimitPolicy(settings.timeLimitPolicy);
            delete sanitizedSettings.filterComments;
            delete sanitizedSettings.timeLimitPolicy;

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
                    ...sanitizedSettings,
                    allowMainViewing: settings.allowMainViewing !== false,
                    allowKidsViewing: settings.allowKidsViewing !== false,
                    syncKidsToMain: !!settings.syncKidsToMain,
                    ...(timeLimitPolicy ? { timeLimitPolicy } : {})
                },
                main: normalizeMainProfileAliasFields({
                    ...main,
                    mode: main.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                    channels: sanitizeMainChannels(Object.prototype.hasOwnProperty.call(main, 'channels') ? main.channels : main.blockedChannels),
                    keywords: sanitizeMainKeywords(Object.prototype.hasOwnProperty.call(main, 'keywords') ? main.keywords : main.blockedKeywords),
                    whitelistChannels: sanitizeMainChannels(main.whitelistChannels),
                    whitelistKeywords: sanitizeMainKeywords(main.whitelistKeywords)
                }),
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

        const model = studyModel();
        if (model) {
            // A stored study object is written with every key; a profile without one stays without it.
            for (const profileId of Object.keys(outProfiles)) {
                const profile = outProfiles[profileId];
                if (!Object.prototype.hasOwnProperty.call(profile, 'study')) continue;
                const study = model.normalizeStudy(profile.study);
                outProfiles[profileId] = study ? { ...profile, study } : withoutStudyField(profile);
            }
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
        const identityIndex = new Map();

        const add = (entry, source) => {
            const sanitized = sanitizeChannelEntry(entry, { source: entry?.source || source });
            if (!sanitized) return;

            const aliases = channelIdentityKeys(sanitized);
            if (!aliases.length) return;
            const matchingMapKeys = [...new Set(
                aliases
                    .map(alias => identityIndex.get(alias))
                    .filter(mapKey => mapKey && map.has(mapKey))
            )];

            let mapKey = matchingMapKeys[0] || channelKey(sanitized);
            let merged = matchingMapKeys.reduce(
                (current, matchingKey) => mergeChannelEntries(current, map.get(matchingKey)),
                null
            );
            merged = mergeChannelEntries(merged, sanitized);
            if (!mapKey || !merged) return;

            matchingMapKeys.slice(1).forEach(matchingKey => map.delete(matchingKey));
            map.set(mapKey, merged);
            channelIdentityKeys(merged).forEach(alias => identityIndex.set(alias, mapKey));
        };

        for (const entry of safeArray(existing)) {
            add(entry, 'user');
        }

        for (const entry of safeArray(incoming)) {
            add(entry, 'import');
        }

        return Array.from(map.values());
    }

    function normalizeMainProfileAliasFields(main) {
        const out = { ...safeObject(main) };
        const mode = normalizeListMode(out.mode, 'blocklist');
        out.mode = mode;
        out.channels = safeArray(out.channels);
        out.keywords = safeArray(out.keywords);
        out.whitelistChannels = safeArray(out.whitelistChannels);
        out.whitelistKeywords = safeArray(out.whitelistKeywords);
        // Block rules remain active exclusions in allow-only mode and allow
        // rules remain active exceptions in block mode. Aliases therefore
        // always describe the same preserved block arrays.
        out.blockedChannels = out.channels;
        out.blockedKeywords = out.keywords;
        return out;
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
        const root = safeObject(data);
        if (!root || typeof root !== 'object') return 'unknown';
        if (safeObject(root.meta).application === 'FilterTube' && normalizeNumber(safeObject(root.meta).version, 0) === 3) {
            return 'filtertube-v3';
        }
        let candidate = root;
        if (!(candidate.filterData && typeof candidate.filterData === 'object')) {
            for (const key of ['storageData', 'data', 'payload', 'backup']) {
                const nested = safeObject(root[key]);
                if (nested.filterData && typeof nested.filterData === 'object') {
                    candidate = nested;
                    break;
                }
            }
        }
        if (candidate.filterData && typeof candidate.filterData === 'object') {
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
        const root = safeObject(data);
        let blockTubeData = root;
        if (!(blockTubeData.filterData && typeof blockTubeData.filterData === 'object')) {
            for (const key of ['storageData', 'data', 'payload', 'backup']) {
                const nested = safeObject(root[key]);
                if (nested.filterData && typeof nested.filterData === 'object') {
                    blockTubeData = nested;
                    break;
                }
            }
        }
        const filterData = safeObject(blockTubeData.filterData);
        const options = safeObject(blockTubeData.options);
        const now = nowTs();
        const migrationReport = {
            format: 'blocktube',
            recognized: [],
            translated: [],
            inactive: [],
            unsupported: [],
            invalid: [],
            unknown: []
        };

        const knownFilterFields = new Set([
            'title', 'channelName', 'channelId', 'videoId', 'comment',
            'vidLength', 'javascript', 'percentWatchedHide'
        ]);
        const knownOptionFields = new Set([
            'trending', 'mixes', 'shorts', 'movies', 'suggestions_only',
            'autoplay', 'enable_javascript', 'block_message', 'block_feedback',
            'disable_db_normalize', 'disable_you_there', 'disable_on_history',
            'vidLength_type', 'percent_watched_hide'
        ]);
        Object.keys(filterData).forEach(key => {
            if (!knownFilterFields.has(key)) migrationReport.unknown.push(`filterData.${key}`);
        });
        Object.keys(options).forEach(key => {
            if (!knownOptionFields.has(key)) migrationReport.unknown.push(`options.${key}`);
        });
        Object.keys(blockTubeData).forEach(key => {
            if (!['filterData', 'options', 'uiTheme', 'uiPass'].includes(key)) {
                migrationReport.unknown.push(key);
            }
        });

        const parseRegexRow = (raw, field) => {
            const value = normalizeString(raw);
            const match = value.match(/^\/((?:\\.|[^/])+)\/([gimsuy]*)$/);
            if (!match) return null;
            const pattern = match[1];
            const flags = match[2] || 'i';
            if (pattern.length > 512 || /(\([^)]*[+*][^)]*\))[+*{]/.test(pattern)) {
                migrationReport.invalid.push({ field, value, reason: 'regex_too_complex' });
                return { invalid: true };
            }
            try {
                new RegExp(pattern, flags);
            } catch (e) {
                migrationReport.invalid.push({ field, value, reason: 'invalid_regex' });
                return { invalid: true };
            }
            return { pattern, flags };
        };

        // BlockTube normally exports the editable text arrays, but a few
        // storage/debug tools expose its compiled [pattern, flags] tuples
        // instead. Keep both forms readable without treating a compiled
        // channel-id regex as a literal FilterTube channel name.
        const getCompiledBlockTubeRule = (raw) => {
            if (Array.isArray(raw) && typeof raw[0] === 'string') {
                return {
                    pattern: raw[0].trim(),
                    flags: typeof raw[1] === 'string' ? raw[1].trim() : ''
                };
            }
            if (raw && typeof raw === 'object') {
                const pattern = typeof raw.pattern === 'string'
                    ? raw.pattern
                    : (typeof raw.source === 'string' ? raw.source : '');
                if (pattern) {
                    return {
                        pattern: pattern.trim(),
                        flags: typeof raw.flags === 'string' ? raw.flags.trim() : ''
                    };
                }
            }
            return null;
        };

        const normalizeBlockTubeRuleValue = (raw) => {
            if (typeof raw === 'string') return raw.trim();
            const compiled = getCompiledBlockTubeRule(raw);
            if (!compiled || !compiled.pattern) return '';
            return `/${compiled.pattern}/${compiled.flags}`;
        };

        const normalizeBlockTubeExactValue = (raw) => {
            if (typeof raw === 'string') return raw.trim();
            const compiled = getCompiledBlockTubeRule(raw);
            if (!compiled || !compiled.pattern) return '';
            const exact = compiled.pattern.match(/^\^([\s\S]+)\$$/);
            return exact ? exact[1].trim() : `/${compiled.pattern}/${compiled.flags}`;
        };

        const BLOCKTUBE_CONTEXT_COMMENT_PREFIX = '// Blocked by context menu (';
        const parseBlockTubeContextComment = (raw) => {
            const value = normalizeBlockTubeRuleValue(raw);
            if (!value.startsWith(BLOCKTUBE_CONTEXT_COMMENT_PREFIX)) return null;

            let body = value.slice(BLOCKTUBE_CONTEXT_COMMENT_PREFIX.length);

            // Newer BlockTube exports append a local timestamp after the
            // channel label. Remove it before stripping the comment's final
            // parenthesis; otherwise the timestamp's closing parenthesis is
            // removed first and the channel label keeps a trailing `)`.
            body = body.replace(/\s+\(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\)$/, '');
            const complete = body.endsWith(')');
            if (complete) body = body.slice(0, -1);
            return {
                raw: value,
                name: body.trim(),
                complete
            };
        };

        const isBlockTubeChannelId = value => /^UC[\w-]{22}$/i.test(normalizeString(value));

        const buildBlockTubeKeyword = (raw, scope, comments) => {
            const value = normalizeBlockTubeRuleValue(raw);
            if (!value || value.startsWith('//')) return null;
            const parsedRegex = parseRegexRow(value, `filterData.${scope === 'comment' ? 'comment' : 'title'}`);
            if (parsedRegex?.invalid) return null;
            if (parsedRegex) {
                migrationReport.translated.push({ field: `filterData.${scope === 'comment' ? 'comment' : 'title'}`, treatment: 'validated_regex' });
                return {
                    word: parsedRegex.pattern,
                    exact: false,
                    comments,
                    semantic: false,
                    matchMode: 'regex',
                    regexFlags: parsedRegex.flags,
                    scope,
                    source: 'import',
                    addedAt: now
                };
            }
            // BlockTube wraps plain lines in an ASCII whitespace/punctuation
            // boundary, which whole-word (exact) is the closest match for.
            // Exact rules with Han/Hangul/Kana compile as substrings, so CJK
            // keywords still match inside sentences (#79).
            return {
                word: value,
                exact: true,
                comments,
                semantic: false,
                matchMode: 'literal',
                regexFlags: '',
                scope,
                source: 'import',
                addedAt: now
            };
        };

        const channels = [];
        let pendingContextComment = null;
        const channelIdValues = Array.isArray(filterData.channelId)
            ? filterData.channelId
            : (filterData.channelId == null ? [] : [filterData.channelId]);
        const channelNameValues = Array.isArray(filterData.channelName)
            ? filterData.channelName
            : (filterData.channelName == null ? [] : [filterData.channelName]);
        const titleValues = Array.isArray(filterData.title)
            ? filterData.title
            : (filterData.title == null ? [] : [filterData.title]);
        const commentValues = Array.isArray(filterData.comment)
            ? filterData.comment
            : (filterData.comment == null ? [] : [filterData.comment]);
        const videoIdValues = Array.isArray(filterData.videoId)
            ? filterData.videoId
            : (filterData.videoId == null ? [] : [filterData.videoId]);
        const durationValues = Array.isArray(filterData.vidLength)
            ? filterData.vidLength
            : (filterData.vidLength == null ? [] : [filterData.vidLength]);

        for (let index = 0; index < channelIdValues.length; index += 1) {
            const raw = channelIdValues[index];
            const entry = normalizeBlockTubeExactValue(raw);
            if (!entry) continue;

            const contextComment = parseBlockTubeContextComment(entry);
            if (contextComment) {
                pendingContextComment = contextComment;
                continue;
            }

            // A damaged export in the supplied backup split one comment's
            // closing `...)` into a later array cell. Join that exact
            // continuation back to the pending comment instead of importing
            // it as a channel ID.
            if (pendingContextComment && /^\.\.\.\)$/.test(entry)) {
                const repairedComment = parseBlockTubeContextComment(`${pendingContextComment.raw}${entry}`);
                if (repairedComment) {
                    pendingContextComment = repairedComment;
                    migrationReport.translated.push({
                        field: `filterData.channelId[${index}]`,
                        treatment: 'rejoined_split_context_comment'
                    });
                    continue;
                }
            }

            if (isBlockTubeChannelId(entry)) {
                const contextName = pendingContextComment?.name || '';
                channels.push({
                    id: entry,
                    name: contextName || entry,
                    handle: null,
                    customUrl: null,
                    filterAll: false,
                    // A BlockTube channel ID is intentionally marked separately
                    // from a generic file import so StateManager can enrich the
                    // bare UC ID with the channel's handle/logo later.
                    source: 'blocktube',
                    originalInput: entry,
                    addedAt: now
                });
                pendingContextComment = null;
                continue;
            }

            // BlockTube's channelId field is an exact UC ID list. Ignore
            // empty placeholders above, but surface any other value so the
            // import receipt explains why it was not converted into a rule.
            migrationReport.invalid.push({
                field: `filterData.channelId[${index}]`,
                value: entry,
                reason: 'invalid_channel_id'
            });
        }

        for (const raw of channelNameValues) {
            const name = normalizeBlockTubeRuleValue(raw);
            if (!name || name.startsWith('//')) continue;
            const parsedRegex = parseRegexRow(name, 'filterData.channelName');
            if (parsedRegex) {
                if (!parsedRegex.invalid) {
                    migrationReport.translated.push({ field: 'filterData.channelName', value: name, treatment: 'preserved_channel_name_regex_rule' });
                }
            } else {
                migrationReport.translated.push({ field: 'filterData.channelName', value: name, treatment: 'preserved_channel_name_boundary_rule' });
            }

            if (parsedRegex?.invalid) continue;

            // BlockTube evaluates channelName against the channel-name field,
            // not against titles/descriptions. Keep this as a channel row with
            // provenance so FilterTube can reproduce that scope at runtime.
            channels.push({
                id: '',
                name,
                handle: null,
                customUrl: null,
                filterAll: false,
                source: 'blocktube-channel-name',
                originalInput: name,
                addedAt: now
            });
        }

        const keywords = [];
        for (const raw of titleValues) {
            const entry = buildBlockTubeKeyword(raw, 'title', false);
            if (entry) keywords.push(entry);
        }
        for (const raw of commentValues) {
            const entry = buildBlockTubeKeyword(raw, 'comment', true);
            if (entry) keywords.push(entry);
        }

        const videoIds = [];
        for (const raw of videoIdValues) {
            const vid = normalizeBlockTubeExactValue(raw);
            if (!vid || vid.startsWith('//')) continue;
            videoIds.push(vid);
        }

        const parseBlockTubeSeconds = (raw, index) => {
            if (raw === null || raw === undefined || raw === '') return null;
            const value = Number(raw);
            if (!Number.isFinite(value) || value < 0) {
                migrationReport.invalid.push({ field: `filterData.vidLength[${index}]`, value: raw, reason: 'invalid_non_negative_seconds' });
                return null;
            }
            return value;
        };
        const minSeconds = parseBlockTubeSeconds(durationValues[0], 0);
        const maxSeconds = parseBlockTubeSeconds(durationValues[1], 1);
        const durationType = options.vidLength_type === 'block' ? 'block' : 'allow';
        let durationFilter = null;
        if (minSeconds !== null || maxSeconds !== null) {
            if (minSeconds !== null && maxSeconds !== null && minSeconds <= maxSeconds && maxSeconds > 0) {
                durationFilter = {
                    enabled: true,
                    condition: 'between',
                    minMinutes: minSeconds / 60,
                    maxMinutes: maxSeconds / 60,
                    value: '',
                    // FilterTube's default "between" condition means
                    // "allow only inside". BlockTube's block mode means the
                    // inverse: hide videos inside the range.
                    mode: durationType === 'block' ? 'block' : 'allow'
                };
                migrationReport.translated.push({
                    field: 'filterData.vidLength',
                    treatment: durationType === 'block'
                        ? 'seconds_to_minutes_block_inside_range'
                        : 'seconds_to_minutes_allow_inside_range'
                });
            } else if (durationType === 'allow' && minSeconds !== null && maxSeconds === null && minSeconds > 0) {
                durationFilter = {
                    enabled: true,
                    condition: 'shorter',
                    minMinutes: minSeconds / 60,
                    maxMinutes: 0,
                    value: String(minSeconds / 60),
                    mode: 'block'
                };
                migrationReport.translated.push({ field: 'filterData.vidLength', treatment: 'allow_min_seconds_to_block_shorter_than' });
            } else if (durationType === 'allow' && minSeconds === null && maxSeconds !== null && maxSeconds > 0) {
                durationFilter = {
                    enabled: true,
                    condition: 'longer',
                    minMinutes: maxSeconds / 60,
                    maxMinutes: 0,
                    value: String(maxSeconds / 60),
                    mode: 'block'
                };
                migrationReport.translated.push({ field: 'filterData.vidLength', treatment: 'allow_max_seconds_to_block_longer_than' });
            } else {
                migrationReport.unsupported.push({
                    field: 'filterData.vidLength',
                    reason: durationType === 'block'
                        ? 'blocktube_block_mode_requires_two_valid_bounds'
                        : 'allow_range_is_empty_or_zero_bound'
                });
            }
        }

        const directOptionMappings = [
            ['trending', 'hideExploreTrending'],
            ['mixes', 'hideMixPlaylists'],
            ['shorts', 'hideShorts']
        ];
        const mainSettings = {};
        for (const [sourceKey, targetKey] of directOptionMappings) {
            if (Object.prototype.hasOwnProperty.call(options, sourceKey)) {
                mainSettings[targetKey] = options[sourceKey] === true;
                migrationReport.recognized.push({ field: `options.${sourceKey}`, destination: targetKey });
            }
        }
        if (durationFilter) {
            mainSettings.contentFilters = { duration: durationFilter };
        }

        for (const key of ['movies', 'suggestions_only', 'autoplay', 'block_feedback', 'disable_db_normalize', 'disable_you_there', 'disable_on_history', 'percent_watched_hide']) {
            if (Object.prototype.hasOwnProperty.call(options, key)) {
                migrationReport.unsupported.push({ field: `options.${key}`, reason: 'no_safe_exact_equivalent' });
            }
        }
        if (Object.prototype.hasOwnProperty.call(filterData, 'percentWatchedHide')) {
            migrationReport.unsupported.push({ field: 'filterData.percentWatchedHide', reason: 'no_watched_percentage_filter' });
        }
        const importedJavascript = Array.isArray(filterData.javascript)
            ? filterData.javascript.map(value => normalizeString(value)).filter(Boolean).join('\n')
            : normalizeString(filterData.javascript);
        if (importedJavascript || options.enable_javascript === true) {
            migrationReport.inactive.push({ field: 'filterData.javascript', reason: 'arbitrary_javascript_quarantined_and_never_executed' });
        }
        if (Object.prototype.hasOwnProperty.call(blockTubeData, 'uiPass')) {
            migrationReport.inactive.push({ field: 'uiPass', reason: 'never_imported_as_filtertube_pin' });
        }
        if (Object.prototype.hasOwnProperty.call(blockTubeData, 'uiTheme')) {
            migrationReport.inactive.push({ field: 'uiTheme', reason: 'optional_preference_not_applied_by_rule_import' });
        }
        if (Object.prototype.hasOwnProperty.call(options, 'block_message')) {
            migrationReport.inactive.push({ field: 'options.block_message', reason: 'custom_overlay_copy_not_enabled' });
        }

        const mergedChannels = mergeChannelLists([], channels);
        const rawChannelNameRules = channelNameValues
            .map(normalizeBlockTubeRuleValue)
            .filter(value => value && !value.startsWith('//'));
        migrationReport.summary = {
            rawChannelIdRules: channels.filter(entry => entry?.source === 'blocktube').length,
            rawChannelNameRules: rawChannelNameRules.length,
            effectiveChannelIdRules: mergedChannels.filter(entry => entry?.source === 'blocktube').length,
            effectiveChannelNameRules: mergedChannels.filter(entry => entry?.source === 'blocktube-channel-name').length
        };

        return {
            ok: true,
            version: 0,
            // BlockTube theme migration is review-only. Do not overwrite the
            // user's current FilterTube theme as a side effect of importing rules.
            theme: null,
            mainSettings,
            mainChannels: mergedChannels,
            mainKeywords: mergeKeywordLists([], keywords),
            migrationReport,
            channelMap: {},
            profilesV3: {
                main: {
                    mode: 'blocklist',
                    applyKidsRulesOnMain: false,
                    whitelistedChannels: [],
                    whitelistedKeywords: [],
                    videoIds: mergeStringList([], videoIds),
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

    function previewBlockTubeMigration(data) {
        if (detectFormat(data) !== 'blocktube') {
            return { ok: false, error: 'Not a BlockTube backup' };
        }
        const parsed = parseBlockTube(data);
        return {
            ok: parsed.ok === true,
            counts: {
                channels: safeArray(parsed.mainChannels).length,
                channelIds: safeArray(parsed.mainChannels).filter(entry => entry?.source === 'blocktube').length,
                channelNameRules: safeArray(parsed.mainChannels).filter(entry => entry?.source === 'blocktube-channel-name').length,
                keywords: safeArray(parsed.mainKeywords).filter(entry => entry?.scope !== 'comment').length,
                comments: safeArray(parsed.mainKeywords).filter(entry => entry?.scope === 'comment').length,
                regex: safeArray(parsed.mainKeywords).filter(entry => entry?.matchMode === 'regex').length,
                videoIds: safeArray(parsed.profilesV3?.main?.videoIds).length,
                mappedOptions: Object.keys(safeObject(parsed.mainSettings)).filter(key => key !== 'contentFilters').length,
                durationFilters: parsed.mainSettings?.contentFilters?.duration?.enabled === true ? 1 : 0
            },
            durationFilter: parsed.mainSettings?.contentFilters?.duration
                ? { ...parsed.mainSettings.contentFilters.duration }
                : null,
            channelEntries: safeArray(parsed.mainChannels).map((entry, index) => ({
                id: normalizeString(entry?.id),
                name: normalizeString(entry?.name),
                handle: normalizeString(entry?.handle),
                customUrl: normalizeString(entry?.customUrl),
                originalInput: normalizeString(entry?.originalInput || entry?.id || entry?.name),
                sourceRow: index + 1,
                nameOnly: entry?.source === 'blocktube-channel-name'
            })),
            report: parsed.migrationReport
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
                    hideHomeFeed: !!mainSettings?.hideHomeFeed,
                    hideSponsoredCards: !!mainSettings?.hideSponsoredCards,
                    contentOnlyPlayback: mainSettings?.contentOnlyPlayback !== false,
                    hidePlayables: !!mainSettings?.hidePlayables,
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
                    skipBlockedAutoplay: !!mainSettings?.skipBlockedAutoplay,
                    alwaysUseOriginalAudio: !!mainSettings?.alwaysUseOriginalAudio,
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

    function normalizeNanahBackupState(value) {
        const root = safeObject(value);
        const deviceId = normalizeString(root.deviceId);
        const trustedLinks = safeArray(root.trustedLinks)
            .map((entry) => safeObject(entry))
            .filter((entry) => normalizeString(entry.remoteDeviceId));
        if (!deviceId && trustedLinks.length === 0) {
            return null;
        }
        return {
            deviceId,
            trustedLinks
        };
    }

    function mergeNanahTrustedBackupLinks(existingLinks, incomingLinks, strategy) {
        const describe = value => {
            const raw = safeObject(value), policy = safeObject(raw.policy);
            const role = value => ['source', 'replica', 'peer'].includes(normalizeString(value).toLowerCase())
                ? normalizeString(value).toLowerCase() : 'peer';
            const localRole = role(raw.localRole), remoteRole = role(raw.remoteRole || raw.role);
            const requestedType = normalizeString(raw.linkType || policy.linkType);
            const managedRoles = (localRole === 'source' && remoteRole === 'replica')
                || (localRole === 'replica' && remoteRole === 'source');
            const linkType = ['managed_link', 'peer_link'].includes(requestedType)
                ? requestedType : (managedRoles ? 'managed_link' : 'peer_link');
            const sourceDeviceId = normalizeString(raw.sourceDeviceId || policy.sourceDeviceId);
            const targetDeviceId = normalizeString(raw.targetDeviceId || policy.targetDeviceId);
            const sourceProfileId = normalizeString(raw.sourceProfileId || policy.sourceProfileId);
            const targetProfileBehavior = normalizeString(policy.targetProfileBehavior || raw.targetProfileBehavior).toLowerCase() === 'fixed_profile'
                ? 'fixed_profile' : 'current_active';
            const targetProfileId = normalizeString(policy.targetProfileId || raw.targetProfileId);
            return {
                id: normalizeString(raw.linkId),
                binding: JSON.stringify([normalizeString(raw.remoteDeviceId), localRole, remoteRole, linkType,
                    sourceDeviceId, targetDeviceId, sourceProfileId, targetProfileBehavior, targetProfileId]),
                hasLegacyBinding: !!(normalizeString(raw.localRole) || normalizeString(raw.remoteRole || raw.role)
                    || sourceDeviceId || targetDeviceId || sourceProfileId || targetProfileId)
            };
        };
        const explicitIds = new Map();
        const validate = row => {
            const identity = describe(row);
            if (identity.id) {
                if (explicitIds.has(identity.id) && explicitIds.get(identity.id) !== identity.binding) {
                    throw new Error('Trusted-device recovery contains a link ID bound to another device, parent, or receiving profile. Review the backup before restoring.');
                }
                explicitIds.set(identity.id, identity.binding);
            }
            return identity;
        };
        // Validate the whole approved restore before any settings/profile writes,
        // including collisions in a replace backup and against existing IDs.
        safeArray(existingLinks).forEach(validate);
        safeArray(incomingLinks).forEach(validate);
        const merged = new Map();
        let unknownLegacy = 0;
        const add = row => {
            const identity = describe(row);
            const key = identity.id ? `id:${identity.id}`
                : (identity.hasLegacyBinding ? `legacy:${identity.binding}` : `unknown:${unknownLegacy++}`);
            merged.set(key, row);
        };
        if (strategy !== 'replace') safeArray(existingLinks).forEach(add);
        safeArray(incomingLinks).forEach(add);
        return Array.from(merged.values());
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

        const mainSettings = safeObject(settings.main);
        const hasLegacyFilterComments = Object.prototype.hasOwnProperty.call(mainSettings, 'filterComments');
        const legacyKeywordCommentsEnabled = hasLegacyFilterComments && mainSettings.hideComments !== true && mainSettings.filterComments === true;
        const mainChannels = safeArray(main.channels).map(ch => sanitizeChannelEntry(ch, {
            source: 'import',
            filterAllComments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : ch?.filterAllComments
        })).filter(Boolean);
        const mainKeywords = safeArray(main.keywords).map(kw => sanitizeKeywordEntry(kw, {
            source: kw?.source || 'import',
            comments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : kw?.comments
        })).filter(Boolean);

        const mainVideoIds = mergeStringList([], safeArray(main.videoIds));

        const mainWhitelistedChannels = safeArray(main.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, {
            source: 'import',
            filterAllComments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : ch?.filterAllComments
        })).filter(Boolean);
        const mainWhitelistedKeywords = safeArray(main.whitelistedKeywords).map(kw => sanitizeKeywordEntry(kw, {
            source: 'import',
            comments: hasLegacyFilterComments ? legacyKeywordCommentsEnabled : kw?.comments
        })).filter(Boolean);

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

    // BlockTube is a separate, single-profile rule format. Never add these
    // compatibility fields to a complete FilterTube backup.
    function buildBlockTubeExport(profile, { profileId, surface }) {
        const selected = safeObject(profile[surface]);
        const settings = safeObject(profile.settings);
        const unsupported = [];
        const omit = (field, reason, index = null, value = null) => unsupported.push({
            field, reason, ...(index == null ? {} : { index }),
            ...(typeof value === 'string' ? { value } : {})
        });
        const filterData = { title: [], channelName: [], channelId: [], videoId: [], comment: [], vidLength: [null, null], javascript: '' };
        const options = { enable_javascript: false };
        const seen = new Map(['title', 'channelName', 'channelId', 'videoId', 'comment'].map(field => [field, new Set()]));
        const add = (field, value) => {
            if (seen.get(field).has(value)) return;
            seen.get(field).add(value);
            filterData[field].push(value);
        };
        const regexRow = (word, entry, field, index, defaultFlags = 'i') => {
            const flags = entry.matchMode === 'regex' ? (entry.regexFlags || defaultFlags) : (entry.exact ? 'iu' : 'i');
            if (typeof flags !== 'string' || !/^[imsu]*$/.test(flags)) {
                omit(field, 'unsupported_regex_flags', index, word); return null;
            }
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Mirrors the compilers: exact rules containing Han/Hangul/Kana
            // match as substrings, since those scripts lack word spacing (#79).
            const wholeWord = entry.exact
                && !/[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(word);
            const pattern = entry.matchMode === 'regex' ? word
                : (wholeWord ? `(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])` : escaped);
            try {
                // .source escapes slashes and line breaks for BlockTube's
                // one-rule-per-line /pattern/flags syntax without ASCII loss.
                return `/${new RegExp(pattern, flags).source}/${flags}`;
            } catch (error) {
                omit(field, 'invalid_regex', index, word); return null;
            }
        };
        const keyword = (entry, field, index) => {
            const row = typeof entry === 'string' ? { word: entry } : safeObject(entry);
            const word = typeof row.word === 'string' ? row.word.trim() : '';
            if (!word.trim()) { omit(field, 'empty_or_invalid_keyword', index); return; }
            if (row.managedListPaused === true) { omit(field, 'paused_rule_not_exported', index, word); return; }
            if (row.semantic === true) { omit(field, 'semantic_matching_not_supported', index, word); return; }
            if (safeObject(row.dateFilter).enabled === true) { omit(field, 'date_constraint_not_supported', index, word); return; }
            if (row.scope && !['title', 'comment', 'channel_name'].includes(row.scope)) {
                omit(field, 'unknown_keyword_scope', index, word); return;
            }
            const value = regexRow(word, row, field, index);
            if (!value) return;
            if (row.scope === 'channel_name') add('channelName', value);
            else if (row.scope !== 'comment') add('title', value);
            if (row.scope === 'comment' || row.comments === true) add('comment', value);
        };
        // BlockTube's channelName list is tested against the label a renderer
        // shows for the channel (display name on most cards, @handle on
        // comments and Shorts). Without a verified UC ID, keep the channel as
        // an anchored, case-insensitive, whole-label regex so that a name such
        // as "뉴스" cannot hide "뉴스 하이라이트" or titles. A known @handle is
        // added as a second alternative; it only matches where YouTube shows
        // the handle as the channel label, which the review reports.
        const matchedByName = [];
        const exactChannelNameRule = (row) => {
            const clean = value => {
                let text = normalizeString(value);
                if (/%[0-9A-Fa-f]{2}/.test(text)) {
                    try { text = decodeURIComponent(text); } catch (error) { /* keep the stored text */ }
                }
                return text.normalize('NFC').replace(/\s+/g, ' ').trim();
            };
            const looksLikeIdentifier = value => !value || /[\r\n]/.test(value) || /^UC[\w-]{22}$/.test(value)
                || /:\/\/|(^|\.)youtube\.com\/|^\/?(channel|c|user)\//i.test(value);
            const name = clean(row.name);
            const handleSource = clean(row.handle) || (/^@[^\s/]+$/.test(clean(row.originalInput)) ? clean(row.originalInput) : '');
            const handle = handleSource && !/[\s/]/.test(handleSource)
                ? (handleSource.startsWith('@') ? handleSource : `@${handleSource}`) : '';
            const labels = [...new Set([name, handle].filter(value => !looksLikeIdentifier(value)))];
            if (!labels.length) return null;
            const escapeLabel = label => label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/ /g, '\\s+');
            const pattern = `^\\s*(?:${labels.map(escapeLabel).join('|')})\\s*$`;
            try {
                return { value: `/${new RegExp(pattern, 'iu').source}/iu`, labels, handleOnly: !labels.includes(name) };
            } catch (error) {
                return null;
            }
        };
        // Inverse of parseBlockTube's vidLength mapping. FilterTube compares
        // fractional minutes; BlockTube compares whole seconds, so lower bounds
        // round up and upper bounds round down (identical for whole-second
        // video lengths). Shapes BlockTube cannot express are reported.
        const exportDurationFilter = (rule) => {
            const finite = value => { const number = Number(value); return Number.isFinite(number) ? number : 0; };
            let min = finite(rule.minMinutes ?? rule.minutes ?? rule.valueMinutes ?? rule.minutesMin ?? rule.value ?? 0);
            let max = finite(rule.maxMinutes ?? rule.minutesMax ?? rule.valueMinutesMax ?? 0);
            if ((min <= 0 || max <= 0) && typeof rule.value === 'string') {
                const range = rule.value.trim().match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
                if (range) {
                    if (min <= 0) min = parseFloat(range[1]);
                    if (max <= 0) max = parseFloat(range[2]);
                }
            }
            if (max > 0 && min > max) [min, max] = [max, min];
            const seconds = minutes => Math.round(minutes * 60 * 1e6) / 1e6;
            const condition = rule.condition || 'between';
            if (condition === 'between') {
                if (!(max > 0)) return null;
                const low = Math.max(0, Math.ceil(seconds(min))), high = Math.floor(seconds(max));
                if (high <= 0 || low > high) return null;
                return { vidLength: [low, high], type: rule.mode === 'block' ? 'block' : 'allow' };
            }
            // Longer/shorter default to block; their allow form has no
            // BlockTube equivalent that round-trips.
            if (rule.mode === 'allow' || !(min > 0)) return null;
            if (condition === 'shorter') {
                const low = Math.ceil(seconds(min));
                return low > 0 ? { vidLength: [low, null], type: 'allow' } : null;
            }
            if (condition === 'longer') {
                const high = Math.floor(seconds(min));
                return high > 0 ? { vidLength: [null, high], type: 'allow' } : null;
            }
            return null;
        };
        const channelsKey = surface === 'kids' ? 'blockedChannels' : 'channels';
        const keywordsKey = surface === 'kids' ? 'blockedKeywords' : 'keywords';
        for (const field of [channelsKey, keywordsKey, 'videoIds']) {
            if (selected[field] != null && !Array.isArray(selected[field])) omit(`${surface}.${field}`, 'invalid_rule_list');
        }
        const channels = safeArray(selected[channelsKey] || selected.blockedChannels);
        const keywords = safeArray(selected[keywordsKey] || selected.blockedKeywords);
        channels.forEach((raw, index) => {
            const row = typeof raw === 'string' ? { id: raw } : safeObject(raw);
            const field = `${surface}.${channelsKey}`;
            if (row.managedListPaused === true) { omit(field, 'paused_rule_not_exported', index); return; }
            if (row.source === 'blocktube-channel-name') {
                const name = normalizeString(row.originalInput || row.name);
                const parsed = /^\/(.*)\/([a-z]*)$/s.exec(name);
                if (parsed) {
                    const value = regexRow(parsed[1], { matchMode: 'regex', regexFlags: parsed[2] }, field, index, '');
                    if (value) add('channelName', value);
                } else if (name && !name.startsWith('//') && !/[\r\n]/.test(name)) add('channelName', name);
                else omit(field, 'invalid_channel_name_rule', index, name);
            } else {
                const ids = [row.id, ...safeArray(row.alternateIds)].filter(value => typeof value === 'string' && /^UC[\w-]{22}$/.test(value));
                if (!ids.length) {
                    const nameRule = exactChannelNameRule(row);
                    if (nameRule) {
                        add('channelName', nameRule.value);
                        matchedByName.push({ field, index, labels: nameRule.labels, handleOnly: nameRule.handleOnly, value: nameRule.value });
                    } else {
                        omit(field, 'unresolved_channel_id', index, normalizeString(row.handle || row.customUrl || row.name || row.originalInput));
                    }
                }
                ids.forEach(value => add('channelId', value));
                if (row.collaborationGroupId || safeArray(row.collaborationWith).length || safeArray(row.allCollaborators).length) {
                    omit(field, 'collaboration_metadata_not_supported', index);
                }
            }
            if (row.filterAll === true) {
                const word = row.name && row.name !== row.id ? row.name : (row.handle || row.id || row.originalInput || '');
                keyword({ word, exact: true, comments: row.filterAllComments !== false }, `${field}.filterAll`, index);
            }
        });
        keywords.forEach((row, index) => {
            // Channel-derived keywords are regenerated above from current
            // channel rows, so paused or deleted channels cannot reappear.
            if (row?.source === 'channel' || parsePackedChannelKeywordSource(row?.source)) return;
            keyword(row, `${surface}.${keywordsKey}`, index);
        });
        safeArray(selected.videoIds || selected.blockedVideoIds).forEach((value, index) => {
            if (typeof value === 'string' && /^[\w-]{11}$/.test(value)) add('videoId', value);
            else omit(`${surface}.videoIds`, 'invalid_video_id', index, typeof value === 'string' ? value : null);
        });
        for (const field of ['whitelistChannels', 'whitelistedChannels', 'whitelistKeywords', 'whitelistedKeywords', 'allowedVideoIds']) {
            if (safeArray(selected[field]).length) omit(`${surface}.${field}`, 'allow_rules_not_supported');
        }
        if (safeArray(selected.subscriptions).length) omit(`${surface}.subscriptions`, 'subscription_metadata_not_supported');
        if (selected.mode === 'whitelist') omit(`${surface}.mode`, 'whitelist_mode_not_supported');
        if (selected.mode && !['blocklist', 'whitelist'].includes(selected.mode)) omit(`${surface}.mode`, 'unknown_list_mode');
        let duration = null;
        const durationPrefix = surface === 'kids' ? `${surface}.contentFilters` : 'settings.contentFilters';
        const durationRule = safeObject(safeObject(surface === 'kids' ? selected.contentFilters : settings.contentFilters).duration);
        if (durationRule.enabled === true) {
            duration = exportDurationFilter(durationRule);
            if (duration) {
                filterData.vidLength = duration.vidLength;
                options.vidLength_type = duration.type;
            }
        }
        const reportFilterSettings = (filters, prefix) => {
            for (const [name, rule] of Object.entries(safeObject(filters))) {
                if (!(rule === true || safeObject(rule).enabled === true)) continue;
                if (prefix === durationPrefix && name === 'duration') {
                    if (!duration) omit(`${prefix}.${name}`, 'duration_condition_not_supported');
                    continue;
                }
                omit(`${prefix}.${name}`, 'setting_not_supported');
            }
        };
        for (const field of ['contentFilters', 'categoryFilters', 'languageFilters']) {
            reportFilterSettings(selected[field], `${surface}.${field}`);
        }
        const mappedSettings = new Set(['hideShorts', 'hideMixPlaylists', 'hideExploreTrending']);
        if (surface === 'main') {
            for (const [source, destination] of [['hideShorts', 'shorts'], ['hideMixPlaylists', 'mixes'], ['hideExploreTrending', 'trending']]) {
                options[destination] = settings[source] === true;
            }
        }
        for (const [field, value] of Object.entries(settings)) {
            if ((surface === 'main' && mappedSettings.has(field)) || value == null || value === false || value === '' || value === 0) continue;
            if (field === 'contentFilters' || field === 'categoryFilters' || field === 'languageFilters') {
                reportFilterSettings(value, `settings.${field}`);
            } else if (typeof value === 'boolean' && value === true && !['allowMainViewing', 'allowKidsViewing'].includes(field)) {
                omit(`settings.${field}`, 'setting_not_supported');
            } else if (field === 'timeLimitPolicy' && safeObject(value).enabled === true) omit(`settings.${field}`, 'parental_time_policy_not_supported');
        }
        if (settings.enabled === false) omit('settings.enabled', 'disabled_filtering_not_transferred');
        for (const field of ['allowMainViewing', 'allowKidsViewing']) {
            if (settings[field] === false) omit(`settings.${field}`, 'profile_access_restriction_not_supported');
        }
        const counts = Object.fromEntries(['title', 'channelName', 'channelId', 'videoId', 'comment'].map(field => [field, filterData[field].length]));
        const ruleCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const warnings = [
            'BlockTube import replaces its current rules and settings, including its options-page password. Back up BlockTube first and configure its password again after import.',
            'This file contains one profile and one selected rule space. Keep a complete FilterTube backup for profiles, PINs, devices and settings.',
            'BlockTube applies these rules to supported YouTube fields, including playlist names and chat; FilterTube description matching and renderer coverage may differ.'
        ];
        if (surface === 'kids') warnings.push('These are the selected YouTube Kids rules, but BlockTube does not provide a separate YouTube Kids profile or protection context.');
        if (settings.syncKidsToMain === true && surface === 'main') omit('settings.syncKidsToMain', 'kids_rules_not_merged_into_main_export');
        if (matchedByName.some(row => row.handleOnly)) {
            warnings.push('Channels known only by @handle are matched by that handle, which BlockTube sees only where YouTube shows the handle as the channel name (for example comments and Shorts).');
        }
        // Allow-only profiles still have blocked rules, which FilterTube keeps
        // enforcing; export those and report the mode itself as omitted. An
        // allow-only profile with no blocked rules stays non-exportable:
        // BlockTube import replaces its rules, so an empty file would only
        // erase the receiving BlockTube setup.
        const allowOnlyMode = selected.mode === 'whitelist';
        const hasContent = ruleCount > 0 || duration !== null || Object.values(options).some(value => value === true);
        return {
            payload: { filterData, options, uiPass: '' },
            report: {
                format: 'blocktube', compatibilityVersion: '0.4.8', profileId,
                profileName: normalizeString(profile.name) || profileId, surface, counts, unsupported, warnings,
                matchedByName: matchedByName.map(({ field, index, labels, handleOnly }) => ({ field, index, labels, handleOnly })),
                duration: duration ? { vidLength: duration.vidLength.slice(), vidLength_type: duration.type } : null,
                allowOnlyMode,
                canExport: (!selected.mode || selected.mode === 'blocklist' || allowOnlyMode) && hasContent
            }
        };
    }

    function getBlockTubeExportAuthority(root, profileId) {
        const profiles = safeObject(root.profiles), actorId = normalizeString(root.activeProfileId);
        const actor = safeObject(profiles[actorId]), target = safeObject(profiles[profileId]);
        const type = (profile, id) => id === DEFAULT_PROFILE_ID ? 'account'
            : (['child', 'account'].includes(normalizeString(profile.type).toLowerCase()) ? normalizeString(profile.type).toLowerCase()
                : (normalizeString(profile.parentProfileId) ? 'child' : 'account'));
        if (!actorId || !profiles[actorId] || !profiles[profileId] || type(actor, actorId) === 'child'
            || (actorId !== DEFAULT_PROFILE_ID && actorId !== profileId
                && !(type(target, profileId) === 'child' && normalizeString(target.parentProfileId) === actorId))) {
            throw new Error('Open the parent/account profile that manages the selected export profile.');
        }
        const security = safeObject(actor.security);
        const verifier = actorId === DEFAULT_PROFILE_ID ? extractMasterPinVerifier(root)
            : (security.profilePinVerifier || security.pinVerifier || null);
        return { actorId, verifier, binding: JSON.stringify([actorId, type(actor, actorId), actor.parentProfileId || null,
            profileId, type(target, profileId), target.parentProfileId || null, verifier]) };
    }

    async function prepareBlockTubeExport({ profileId, surface, auth = null } = {}) {
        const id = normalizeString(profileId);
        if (!id || !['main', 'kids'].includes(surface)) throw new Error('Choose one profile and Main YouTube or YouTube Kids.');
        const load = async () => {
            const data = await readStorage([FT_PROFILES_V4_KEY], { required: true });
            if (!isValidProfilesV4(data[FT_PROFILES_V4_KEY])) throw new Error('Open Account & sync to initialize profiles before exporting.');
            return JSON.parse(JSON.stringify(data[FT_PROFILES_V4_KEY]));
        };
        const first = await load(), authority = getBlockTubeExportAuthority(first, id);
        if (authority.verifier) await requirePinOrThrow(
            normalizeString(authority.actorId === DEFAULT_PROFILE_ID ? auth?.localMasterPin : auth?.localProfilePin),
            authority.verifier, 'Parent/account PIN required for this export'
        );
        const root = await load();
        if (getBlockTubeExportAuthority(root, id).binding !== authority.binding) throw new Error('Profile authority changed. Review the export again.');
        const snapshot = JSON.stringify(root.profiles[id]);
        const result = buildBlockTubeExport(root.profiles[id], { profileId: id, surface });
        if (!global.crypto?.subtle || typeof TextEncoder === 'undefined') throw new Error('Secure export review is unavailable in this browser.');
        const reviewed = JSON.stringify([authority.binding, result]);
        const digest = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(reviewed));
        result.report.reviewToken = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        const latest = await load();
        if (getBlockTubeExportAuthority(latest, id).binding !== authority.binding || JSON.stringify(latest.profiles[id]) !== snapshot) {
            throw new Error('Profile or rules changed. Review the export again.');
        }
        return result;
    }

    async function previewBlockTubeExport(options = {}) {
        return (await prepareBlockTubeExport(options)).report;
    }

    async function exportBlockTube({ reviewToken = '', acceptUnsupported = false, ...options } = {}) {
        const result = await prepareBlockTubeExport(options);
        if (!reviewToken || result.report.reviewToken !== reviewToken) throw new Error('Review the current BlockTube export before downloading.');
        if (!result.report.canExport) throw new Error('The selected rules cannot be safely exported to BlockTube. Keep a complete FilterTube backup.');
        if (result.report.unsupported.length && acceptUnsupported !== true) throw new Error('Review and explicitly accept the omitted BlockTube items before downloading.');
        return result;
    }

    async function exportV3({ scope = 'auto', auth = null, includeKidsPersonaLinks = false } = {}) {
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

        const payload = buildV3Export({
            mainSettings: exportSettings,
            mainKeywords,
            mainChannels,
            channelMap: mainSettings.channelMap || {},
            profilesV3: profilesV3ForExport,
            exportType,
            profileId: exportProfileId,
            profileName: exportProfileName
        });
        if (payload.profilesV4) {
            const exportedIds = Object.keys(safeObject(payload.profilesV4.profiles));
            payload.profilesV4[KIDS_PERSONA_LINKS_KEY] = includeKidsPersonaLinks
                ? kidsLinksFor(profilesV4?.[KIDS_PERSONA_LINKS_KEY], exportedIds)
                : { schemaVersion: 1, links: [] };
        }
        return attachBackupPrivateData(payload, Object.keys(safeObject(payload.profilesV4?.profiles)));
    }

    /**
     * The FilterTube apps export notes-bearing backups as a raw v4 profile tree. Convert it to
     * the same v3 envelope the apps use for their plain backups (Android BackupExportEnvelope).
     */
    function convertAppProfileBackup(data) {
        const root = safeObject(data);
        const meta = safeObject(root.meta);
        if (Object.prototype.hasOwnProperty.call(meta, 'version') || root.schemaVersion !== 4) return data;
        const profileTree = safeObject(root.profiles);
        const profileId = normalizeString(root.activeProfileId);
        if (!profileId || !Object.prototype.hasOwnProperty.call(profileTree, profileId)) return data;
        const activeOnly = normalizeString(meta.exportType) === 'profile';
        const snapshot = { ...root };
        delete snapshot.savedVideoNotes;
        delete snapshot.localPlaylists;
        delete snapshot.meta;
        const profile = safeObject(profileTree[profileId]);
        const main = safeObject(profile.main);
        const kids = safeObject(profile.kids);
        const profileSettings = safeObject(profile.settings);
        const list = (surface, key) => safeArray(surface[key]);
        const converted = {
            meta: {
                version: 3,
                timestamp: nowTs(),
                application: 'FilterTube',
                exportType: activeOnly ? 'profile' : 'full',
                ...(activeOnly ? { profileId, profileName: normalizeString(profile.name) || profileId } : {})
            },
            profilesV4: snapshot,
            settings: {
                theme: normalizeString(root.appThemeMode) || 'system',
                main: {
                    ...profileSettings,
                    mode: normalizeString(main.mode) || 'blocklist',
                    applyKidsRulesOnMain: profileSettings.syncKidsToMain === true
                },
                kids: { mode: normalizeString(kids.mode) || 'blocklist', strictMode: kids.strictMode !== false }
            },
            profiles: {
                main: {
                    channels: list(main, 'channels'), keywords: list(main, 'keywords'), videoIds: list(main, 'videoIds'),
                    whitelistedChannels: list(main, 'whitelistChannels'), whitelistedKeywords: list(main, 'whitelistKeywords'),
                    subscriptions: list(main, 'subscriptions')
                },
                kids: {
                    blockedChannels: list(kids, 'blockedChannels'), blockedKeywords: list(kids, 'blockedKeywords'),
                    whitelistedChannels: list(kids, 'whitelistChannels'), whitelistedKeywords: list(kids, 'whitelistKeywords'),
                    videoIds: list(kids, 'videoIds'), subscriptions: list(kids, 'subscriptions')
                }
            },
            maps: { channelMap: safeObject(profileSettings.channelMap) }
        };
        if (Object.prototype.hasOwnProperty.call(root, 'savedVideoNotes')) converted.savedVideoNotes = root.savedVideoNotes;
        if (Object.prototype.hasOwnProperty.call(root, 'localPlaylists')) converted.localPlaylists = root.localPlaylists;
        return converted;
    }

    /** Validates backup notes and playlists before anything is written. */
    function readBackupPrivateData(root) {
        const result = { notes: null, playlists: null };
        if (Object.prototype.hasOwnProperty.call(root, 'savedVideoNotes')) {
            const contract = global.FilterTubeSavedVideoNotes;
            if (!contract) throw new Error('This backup includes saved video notes, but notes support is unavailable here. Reload this page and try again. Nothing was imported.');
            try {
                const envelope = safeObject(root.savedVideoNotes);
                const ids = safeArray(envelope.entries).map(entry => entry?.profileId);
                result.notes = contract.decode(JSON.stringify(root.savedVideoNotes), ids);
            } catch (e) {
                throw new Error('The saved video notes in this backup are not valid. Keep the original file; nothing was imported.');
            }
        }
        if (Object.prototype.hasOwnProperty.call(root, 'localPlaylists')) {
            const contract = global.FilterTubeLocalPlaylists;
            if (!contract) throw new Error('This backup includes FilterTube playlists, but playlist support is unavailable here. Reload this page and try again. Nothing was imported.');
            try {
                result.playlists = contract.decode(root.localPlaylists);
            } catch (e) {
                throw new Error('The FilterTube playlists in this backup are not valid. Keep the original file; nothing was imported.');
            }
        }
        return result;
    }

    /**
     * Merges backup notes and playlists into this device after the profile write, with the same
     * incoming-to-local profile mapping the import used. Unmapped profiles are dropped.
     */
    async function mergeBackupPrivateData(backup, mapping) {
        const counts = { savedVideoNotes: 0, localPlaylists: 0 };
        if (!backup.notes && !backup.playlists) return counts;
        const stored = await readStorage([SAVED_NOTES_KEY, LOCAL_PLAYLISTS_KEY], { required: true });
        const update = {};
        if (backup.notes) {
            const contract = global.FilterTubeSavedVideoNotes;
            const raw = stored[SAVED_NOTES_KEY];
            const existing = typeof raw === 'string'
                ? contract.decode(raw, safeArray(safeObject(JSON.parse(raw)).entries).map(entry => entry?.profileId))
                : [];
            const rows = new Map(existing.map(row => [JSON.stringify([row.profileId, row.videoId]), row]));
            for (const row of backup.notes) {
                if (!Object.prototype.hasOwnProperty.call(mapping, row.profileId)) continue;
                const mapped = contract.record({ ...row, profileId: mapping[row.profileId] });
                const key = JSON.stringify([mapped.profileId, mapped.videoId]);
                rows.set(key, rows.has(key) ? contract.merge(rows.get(key), mapped) : mapped);
                counts.savedVideoNotes++;
            }
            const all = Array.from(rows.values());
            const encoded = contract.encode(all, all.map(row => row.profileId));
            if (counts.savedVideoNotes && encoded !== raw) update[SAVED_NOTES_KEY] = encoded;
        }
        if (backup.playlists) {
            const contract = global.FilterTubeLocalPlaylists;
            const raw = stored[LOCAL_PLAYLISTS_KEY];
            const incoming = contract.mapProfiles(backup.playlists, mapping);
            counts.localPlaylists = incoming.length;
            if (incoming.length) {
                const merged = contract.mergeAll(typeof raw === 'string' ? contract.decode(raw) : [], incoming);
                const encoded = contract.encode(merged);
                if (encoded !== raw) update[LOCAL_PLAYLISTS_KEY] = encoded;
            }
        }
        if (Object.keys(update).length) requireStorageSuccess(await writeStorage(update), 'Saved notes and playlists write');
        return counts;
    }

    /**
     * YouTube Kids profile links live in profilesV4.kidsPersonaLinks. Like the Android app, they travel in
     * Nanah device sync but not in manual backups: backups carry an empty list so strict readers still parse.
     */
    function kidsLinksFor(value, profileIds) {
        const contract = global.FilterTubeKidsYouTubeProfiles;
        if (contract) return contract.retaining(value, profileIds);
        const ids = new Set(profileIds);
        return { schemaVersion: 1, links: safeArray(safeObject(value).links).filter(link => ids.has(normalizeString(link?.profileId))) };
    }

    /** Adds the exported profiles' notes and playlists to a backup, when there are any. */
    async function attachBackupPrivateData(payload, profileIds) {
        if (!profileIds.length) return payload;
        const stored = await readStorage([SAVED_NOTES_KEY, LOCAL_PLAYLISTS_KEY]);
        const notesContract = global.FilterTubeSavedVideoNotes;
        const notesRaw = stored?.[SAVED_NOTES_KEY];
        if (notesContract && typeof notesRaw === 'string') {
            const rows = notesContract.decode(notesRaw, safeArray(safeObject(JSON.parse(notesRaw)).entries).map(entry => entry?.profileId))
                .filter(row => profileIds.includes(row.profileId));
            if (rows.length) payload.savedVideoNotes = JSON.parse(notesContract.encode(rows, profileIds));
        }
        const playlistsContract = global.FilterTubeLocalPlaylists;
        const playlistsRaw = stored?.[LOCAL_PLAYLISTS_KEY];
        if (playlistsContract && typeof playlistsRaw === 'string') {
            const lists = playlistsContract.decode(playlistsRaw).filter(list => profileIds.includes(list.profileId));
            if (lists.length) payload.localPlaylists = playlistsContract.envelope(lists);
        }
        return payload;
    }

    async function importV3(json, options = {}) {
        const coordinator = global.FilterTubeNanahStorageLock;
        if (typeof coordinator?.run !== 'function') {
            throw new Error('Secure device storage locking is unavailable. Reload this page before importing settings.');
        }
        return coordinator.run(() => importV3Unlocked(json, options), options.nanahStorageLockToken ?? null);
    }

    async function importV3Unlocked(json, { strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null, beforeProfileWrite = null, adoptKidsPersonaLinks = false, carryStudyLock = false } = {}) {
        json = convertAppProfileBackup(json);
        const parsed = normalizeIncomingV3(json);
        if (!parsed.ok) {
            throw new Error(parsed.error || 'Invalid file');
        }
        const backupPrivateData = readBackupPrivateData(safeObject(json));

        // Snapshot before any settings/profile loader can initialize storage.
        const storageSnapshot = JSON.parse(JSON.stringify(await readStorage(null, { required: true })));
        const rawRoot = safeObject(json);
        const incomingNanahState = normalizeNanahBackupState(rawRoot.nanahState);
        let trustedNanahRestorePayload = null;
        let trustedRestoreActiveId = null;
        if (incomingNanahState && auth?.restoreTrustedNanahState === true) {
            const stored = await readStorage([FT_PROFILES_V4_KEY, NANAH_TRUSTED_LINKS_KEY, NANAH_DEVICE_ID_KEY], { required: true });
            trustedRestoreActiveId = normalizeString(safeObject(stored[FT_PROFILES_V4_KEY]).activeProfileId) || DEFAULT_PROFILE_ID;
            if (resolveProfileScope(scope, trustedRestoreActiveId) === 'full' && trustedRestoreActiveId === DEFAULT_PROFILE_ID) {
                trustedNanahRestorePayload = {
                    [NANAH_TRUSTED_LINKS_KEY]: mergeNanahTrustedBackupLinks(
                        stored[NANAH_TRUSTED_LINKS_KEY], incomingNanahState.trustedLinks, strategy)
                };
                if (incomingNanahState.deviceId) trustedNanahRestorePayload[NANAH_DEVICE_ID_KEY] = incomingNanahState.deviceId;
            }
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
        const localProfilesV4BeforeImport = JSON.parse(JSON.stringify(localProfilesV4 || {}));
        const localActiveId = normalizeString(localProfilesV4?.activeProfileId) || DEFAULT_PROFILE_ID;
        const effectiveScope = resolveProfileScope(scope, localActiveId);
        const requestedTargetProfileId = normalizeString(targetProfileId);
        const explicitTargetProfileId = effectiveScope === 'full' ? '' : requestedTargetProfileId;
        const explicitTargetProfileExists = explicitTargetProfileId
            ? Boolean(safeObject(localProfilesV4?.profiles)[explicitTargetProfileId])
            : false;
        if (explicitTargetProfileId && !explicitTargetProfileExists) {
            throw new Error('The selected target profile is no longer available on this device');
        }
        const effectiveLocalTargetId = explicitTargetProfileId || localActiveId;
        const canTouchLegacyV3 = effectiveLocalTargetId === DEFAULT_PROFILE_ID;

        const localMasterVerifier = extractMasterPinVerifier(localProfilesV4);
        if (effectiveLocalTargetId === DEFAULT_PROFILE_ID && localMasterVerifier) {
            await requirePinOrThrow(
                normalizeString(auth?.localMasterPin),
                localMasterVerifier,
                'Master PIN required'
            );
        }

        const incomingMasterVerifier = extractMasterPinVerifier(parsed.profilesV4);
        if (effectiveLocalTargetId === DEFAULT_PROFILE_ID && incomingMasterVerifier) {
            await requirePinOrThrow(
                normalizeString(auth?.incomingMasterPin),
                incomingMasterVerifier,
                'Backup Master PIN required'
            );
        }

        const rawMeta = safeObject(rawRoot.meta);
        if (trustedRestoreActiveId !== null && trustedRestoreActiveId !== localActiveId) {
            throw new Error('The active profile changed before trusted-device recovery. Review the backup again.');
        }
        const incomingExportType = normalizeString(rawMeta.exportType);
        const incomingExportProfileId = normalizeString(rawMeta.profileId);

        const incomingV4 = parsed.profilesV4;
        const incomingProfiles = safeObject(incomingV4?.profiles);
        const incomingActiveId = normalizeString(incomingV4?.activeProfileId) || incomingExportProfileId || DEFAULT_PROFILE_ID;
        const importingProfileId = incomingExportType === 'profile'
            ? (incomingExportProfileId || incomingActiveId)
            : '';
        const shouldImportIntoSeparateProfile = Boolean(
            !explicitTargetProfileId
            && incomingExportType === 'profile'
            && localActiveId === DEFAULT_PROFILE_ID
            && importingProfileId
            && importingProfileId !== DEFAULT_PROFILE_ID
        );
        const shouldTouchLegacyV3 = canTouchLegacyV3 && !shouldImportIntoSeparateProfile;

        let incomingProfileForImport = null;
        let incomingSourceProfileId = null;
        let fullImportProfileIds = null;
        if (incomingV4) {
            if (effectiveScope === 'active' && !shouldImportIntoSeparateProfile) {
                const incomingSourceId = normalizeString(incomingV4.activeProfileId) || incomingExportProfileId || DEFAULT_PROFILE_ID;
                const activeSnapshot = safeObject(incomingProfiles[incomingSourceId]);
                if (Object.keys(activeSnapshot).length > 0) {
                    incomingProfileForImport = activeSnapshot;
                    incomingSourceProfileId = incomingSourceId;
                } else if (!explicitTargetProfileId && localActiveId !== DEFAULT_PROFILE_ID) {
                    const exactMatch = safeObject(incomingProfiles[localActiveId]);
                    if (Object.keys(exactMatch).length > 0) {
                        incomingProfileForImport = exactMatch;
                        incomingSourceProfileId = localActiveId;
                    } else if (incomingExportType === 'profile') {
                        incomingProfileForImport = safeObject(incomingProfiles[incomingSourceId]);
                        incomingSourceProfileId = incomingSourceId;
                    } else {
                        throw new Error('Full backups can only be imported from the Default (Master) profile');
                    }
                } else if (incomingExportType === 'profile') {
                    incomingProfileForImport = safeObject(incomingProfiles[incomingSourceId]);
                    incomingSourceProfileId = incomingSourceId;
                } else {
                    throw new Error('Incoming active profile snapshot is unavailable');
                }
            } else {
                const incomingActiveId = normalizeString(incomingV4.activeProfileId) || DEFAULT_PROFILE_ID;
                incomingProfileForImport = safeObject(incomingProfiles[incomingActiveId]);
                incomingSourceProfileId = incomingActiveId;
            }
        }

        const incomingV4Settings = incomingProfileForImport ? safeObject(incomingProfileForImport.settings) : null;
        const incomingMainForImport = incomingProfileForImport ? safeObject(incomingProfileForImport.main) : null;

        const v4MainChannels = incomingMainForImport
            ? safeArray(Object.prototype.hasOwnProperty.call(incomingMainForImport, 'channels') ? incomingMainForImport.channels : incomingMainForImport.blockedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : null;
        const v4MainKeywords = incomingMainForImport
            ? safeArray(Object.prototype.hasOwnProperty.call(incomingMainForImport, 'keywords') ? incomingMainForImport.keywords : incomingMainForImport.blockedKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
            : null;

        const v4MainMode = incomingMainForImport
            ? normalizeListMode(incomingMainForImport.mode, 'blocklist')
            : normalizeListMode(parsed.profilesV3?.main?.mode, 'blocklist');

        const v4MainWhitelistChannels = incomingMainForImport
            ? safeArray(incomingMainForImport.whitelistChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean)
            : safeArray(parsed.profilesV3?.main?.whitelistedChannels).map(ch => sanitizeChannelEntry(ch, { source: 'import' })).filter(Boolean);

        const v4MainWhitelistKeywords = incomingMainForImport
            ? safeArray(incomingMainForImport.whitelistKeywords).map(kw => sanitizeKeywordEntry(kw, { source: kw?.source || 'import' })).filter(Boolean)
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
            hideHomeFeed: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideHomeFeed') ? !!mainSettingsOverrides.hideHomeFeed : current.hideHomeFeed,
            hideSponsoredCards: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSponsoredCards') ? !!mainSettingsOverrides.hideSponsoredCards : current.hideSponsoredCards,
            contentOnlyPlayback: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'contentOnlyPlayback') ? mainSettingsOverrides.contentOnlyPlayback !== false : current.contentOnlyPlayback !== false,
            hidePlayables: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hidePlayables') ? !!mainSettingsOverrides.hidePlayables : current.hidePlayables,
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
            skipBlockedAutoplay: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'skipBlockedAutoplay') ? !!mainSettingsOverrides.skipBlockedAutoplay : current.skipBlockedAutoplay,
            alwaysUseOriginalAudio: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'alwaysUseOriginalAudio') ? !!mainSettingsOverrides.alwaysUseOriginalAudio : current.alwaysUseOriginalAudio,
            disableAnnotations: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'disableAnnotations') ? !!mainSettingsOverrides.disableAnnotations : current.disableAnnotations,
            hideTopHeader: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideTopHeader') ? !!mainSettingsOverrides.hideTopHeader : current.hideTopHeader,
            hideNotificationBell: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideNotificationBell') ? !!mainSettingsOverrides.hideNotificationBell : current.hideNotificationBell,
            hideExploreTrending: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideExploreTrending') ? !!mainSettingsOverrides.hideExploreTrending : current.hideExploreTrending,
            hideMoreFromYouTube: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideMoreFromYouTube') ? !!mainSettingsOverrides.hideMoreFromYouTube : current.hideMoreFromYouTube,
            hideSubscriptions: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSubscriptions') ? !!mainSettingsOverrides.hideSubscriptions : current.hideSubscriptions,
            hideSearchShelves: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'hideSearchShelves') ? !!mainSettingsOverrides.hideSearchShelves : current.hideSearchShelves,
            contentFilters: Object.prototype.hasOwnProperty.call(mainSettingsOverrides, 'contentFilters')
                ? {
                    ...safeObject(current.contentFilters),
                    ...safeObject(mainSettingsOverrides.contentFilters)
                }
                : current.contentFilters
        };

        const storagePreflight = await buildImportStoragePreflight(json, parsed);
        let importMutationStarted = false;
        let importedTargetProfileId = effectiveLocalTargetId;
        let result = null;
        let restoredNanahState = false;
        if (typeof beforeProfileWrite === 'function') await beforeProfileWrite(effectiveLocalTargetId);

        try {
            importMutationStarted = shouldTouchLegacyV3;
            result = shouldTouchLegacyV3
                ? await SettingsAPI.saveSettings(payload)
                : { compiledSettings: null, error: null, skipped: true };
            if (result?.error) {
                throw new Error(storageErrorMessage({ ok: false, error: result.error }, 'Compiled settings write'));
            }

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

            requireStorageSuccess(await saveProfilesV3(nextProfiles), 'Legacy profile compatibility write');

            nextKidsBlockedChannelsForV4 = safeArray(nextProfiles.kids.blockedChannels);
            nextKidsBlockedKeywordsForV4 = safeArray(nextProfiles.kids.blockedKeywords);
            nextKidsStrictModeForV4 = nextProfiles.kids.strictMode !== false;
        }

        {
            let profilesV4 = localProfilesV4 || await loadProfilesV4();
            let nextV4 = profilesV4;

            const incomingProfilesV4 = incomingV4;
            if (incomingProfilesV4 && effectiveScope === 'full' && localActiveId === DEFAULT_PROFILE_ID) {
                const sanitizedIncoming = sanitizeProfilesV4(incomingProfilesV4, { source: 'import' });
                if (sanitizedIncoming) {
                    fullImportProfileIds = Object.keys(safeObject(sanitizedIncoming.profiles));
                    if (strategy === 'replace') {
                        const localProfiles = safeObject(nextV4?.profiles);
                        const replacedProfiles = {};
                        for (const [profileId, incProfile] of Object.entries(safeObject(sanitizedIncoming.profiles))) {
                            // Replacing rules never ends a lock running here or drops this device's progress.
                            replacedProfiles[profileId] = {
                                ...withoutStudyField(incProfile),
                                ...mergedStudyFields(localProfiles[profileId], incProfile, 'replace', carryStudyLock === true)
                            };
                        }
                        nextV4 = { ...sanitizedIncoming, profiles: replacedProfiles };
                    } else {
                        const baseProfiles = safeObject(nextV4?.profiles);
                        const incomingProfiles = safeObject(sanitizedIncoming.profiles);
                        const mergedProfiles = { ...baseProfiles };

                        for (const [profileId, incProfileRaw] of Object.entries(incomingProfiles)) {
                            const incProfile = safeObject(incProfileRaw);
                            const existingProfile = safeObject(mergedProfiles[profileId]);
                            if (!existingProfile || Object.keys(existingProfile).length === 0) {
                                mergedProfiles[profileId] = {
                                    ...withoutStudyField(incProfile),
                                    ...mergedStudyFields(null, incProfile, 'merge', carryStudyLock === true),
                                    main: normalizeMainProfileAliasFields(safeObject(incProfile.main))
                                };
                                continue;
                            }
                            const existingMain = safeObject(existingProfile.main);
                            const existingKids = safeObject(existingProfile.kids);
                            const incMain = safeObject(incProfile.main);
                            const incKids = safeObject(incProfile.kids);
                            mergedProfiles[profileId] = {
                                ...withoutStudyField(existingProfile),
                                ...withoutStudyField(incProfile),
                                ...mergedStudyFields(existingProfile, incProfile, 'merge', carryStudyLock === true),
                                settings: {
                                    ...safeObject(existingProfile.settings),
                                    ...safeObject(incProfile.settings)
                                },
                                main: normalizeMainProfileAliasFields({
                                    ...existingMain,
                                    ...incMain,
                                    channels: mergeChannelLists(existingMain.channels, incMain.channels),
                                    keywords: mergeKeywordLists(existingMain.keywords, incMain.keywords),
                                    mode: normalizeListMode(incMain.mode, normalizeListMode(existingMain.mode, 'blocklist')),
                                    whitelistChannels: mergeChannelLists(existingMain.whitelistChannels, incMain.whitelistChannels),
                                    whitelistKeywords: mergeKeywordLists(existingMain.whitelistKeywords, incMain.whitelistKeywords)
                                }),
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

            const targetProfileId = explicitTargetProfileId
                || (shouldImportIntoSeparateProfile
                ? importingProfileId
                : activeId);
            importedTargetProfileId = targetProfileId;

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

            const incomingMainVideoIds = safeArray(parsed.profilesV3?.main?.videoIds);
            const desiredMainVideoIds = strategy === 'replace'
                ? mergeStringList([], incomingMainVideoIds)
                : mergeStringList(safeArray(targetMain.videoIds || targetMain.blockedVideoIds), incomingMainVideoIds);

            const desiredKidsWhitelistChannels = strategy === 'replace'
                ? v4KidsWhitelistChannels
                : mergeChannelLists(safeArray(targetKids.whitelistChannels), v4KidsWhitelistChannels);

            const desiredKidsWhitelistKeywords = strategy === 'replace'
                ? v4KidsWhitelistKeywords
                : mergeKeywordLists(safeArray(targetKids.whitelistKeywords), v4KidsWhitelistKeywords);

            // Only a v4 profile snapshot carries a study object; a legacy file leaves this profile's alone.
            const targetStudyFields = incomingProfileForImport
                ? mergedStudyFields(targetProfile, incomingProfileForImport, strategy === 'replace' ? 'replace' : 'merge',
                    carryStudyLock === true && effectiveScope === 'full')
                : (safeObject(targetProfile).study ? { study: targetProfile.study } : {});
            profiles[targetProfileId] = {
                ...withoutStudyField(targetProfile),
                ...targetStudyFields,
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
                    ...(strategy === 'replace' ? {} : targetSettings),
                    ...safeObject(incomingV4Settings),
                    // Legacy backups keep playback preferences in settings.main.
                    // Preserve that explicit choice when the final profile write
                    // follows the compiled-settings save above.
                    ...(!incomingProfileForImport ? {
                        contentOnlyPlayback: Object.prototype.hasOwnProperty.call(safeObject(parsed.mainSettings), 'contentOnlyPlayback')
                            ? parsed.mainSettings.contentOnlyPlayback !== false
                            : (strategy === 'merge' ? targetSettings.contentOnlyPlayback !== false : true)
                    } : {}),
                    syncKidsToMain: !!incomingApplyKidsRulesOnMain
                },
                main: normalizeMainProfileAliasFields({
                    ...targetMain,
                    mode: normalizeListMode(v4MainMode, normalizeListMode(targetMain.mode, 'blocklist')),
                    channels: targetNextChannels,
                    keywords: targetNextKeywords,
                    whitelistChannels: safeArray(desiredMainWhitelistChannels),
                    whitelistKeywords: safeArray(desiredMainWhitelistKeywords),
                    videoIds: desiredMainVideoIds,
                    blockedVideoIds: desiredMainVideoIds,
                    allowedVideoIds: safeArray(targetMain.allowedVideoIds)
                }),
                kids: {
                    ...targetKids,
                    mode: normalizeListMode(v4KidsMode, normalizeListMode(targetKids.mode, 'blocklist')),
                    strictMode: desiredKidsStrict,
                    blockedChannels: safeArray(desiredKidsBlockedChannels),
                    blockedKeywords: safeArray(desiredKidsBlockedKeywords),
                    whitelistChannels: safeArray(desiredKidsWhitelistChannels),
                    whitelistKeywords: safeArray(desiredKidsWhitelistKeywords),
                    videoIds: strategy === 'replace'
                        ? mergeStringList([], safeArray(parsed.profilesV3?.kids?.videoIds))
                        : mergeStringList(safeArray(targetKids.videoIds), safeArray(parsed.profilesV3?.kids?.videoIds))
                }
            };

            if (typeof beforeProfileWrite === 'function') await beforeProfileWrite(targetProfileId);
            importMutationStarted = true;
            const nextProfilesV4 = {
                ...nextV4,
                schemaVersion: 4,
                activeProfileId: writeActiveId,
                profiles
            };
            // A backup never brings YouTube Kids links; this device keeps its own for the remaining profiles.
            delete nextProfilesV4[KIDS_PERSONA_LINKS_KEY];
            if (localProfilesV4BeforeImport && Object.prototype.hasOwnProperty.call(localProfilesV4BeforeImport, KIDS_PERSONA_LINKS_KEY)) {
                nextProfilesV4[KIDS_PERSONA_LINKS_KEY] = kidsLinksFor(localProfilesV4BeforeImport[KIDS_PERSONA_LINKS_KEY], Object.keys(profiles));
            }
            requireStorageSuccess(await saveProfilesV4(nextProfilesV4), 'Active profile write');
        }

        if (shouldTouchLegacyV3 && parsed.theme && SettingsAPI.setThemePreference) {
            try {
                await SettingsAPI.setThemePreference(parsed.theme);
            } catch (e) {
            }
        }

        if (Object.keys(nextChannelMap).length > 0) {
            requireStorageSuccess(await writeStorage({ channelMap: nextChannelMap }), 'Channel identity map write');
        }

        if (trustedNanahRestorePayload && effectiveScope === 'full' && effectiveLocalTargetId === DEFAULT_PROFILE_ID) {
            requireStorageSuccess(await writeStorage(trustedNanahRestorePayload), 'Trusted-device recovery write');
            restoredNanahState = true;
        }

        const persistedProfilesV4 = await loadProfilesV4();
        const persistedTarget = safeObject(safeObject(persistedProfilesV4?.profiles)[importedTargetProfileId]);
        const persistedMain = safeObject(persistedTarget.main);
        const persistedChannelKeys = new Set(safeArray(persistedMain.channels).flatMap(channelIdentityKeys));
        const persistedKeywordKeys = new Set(safeArray(persistedMain.keywords).map(keywordKey));
        const persistedVideoIds = new Set(safeArray(persistedMain.videoIds || persistedMain.blockedVideoIds).map(normalizeString));
        const missingChannels = safeArray(parsedMainChannels).filter(entry => {
            const keys = channelIdentityKeys(entry);
            return !keys.some(key => persistedChannelKeys.has(key));
        });
        const missingKeywords = safeArray(parsedMainKeywords).filter(entry => !persistedKeywordKeys.has(keywordKey(entry)));
        const missingVideoIds = safeArray(parsed.profilesV3?.main?.videoIds)
            .map(normalizeString)
            .filter(videoId => videoId && !persistedVideoIds.has(videoId));

        if (missingChannels.length || missingKeywords.length || missingVideoIds.length) {
            throw new Error(
                `Import verification failed: ${missingChannels.length} channels, `
                + `${missingKeywords.length} keywords, and ${missingVideoIds.length} video IDs were not persisted`
            );
        }

        const beforeTarget = safeObject(safeObject(localProfilesV4BeforeImport?.profiles)[importedTargetProfileId]);
        const beforeMain = safeObject(beforeTarget.main);
        const beforeChannelKeys = new Set(safeArray(beforeMain.channels).flatMap(channelIdentityKeys));
        const beforeKeywordKeys = new Set(safeArray(beforeMain.keywords).map(keywordKey));
        const beforeVideoIds = new Set(safeArray(beforeMain.videoIds || beforeMain.blockedVideoIds).map(normalizeString));
        const incomingUniqueChannels = uniqueChannelEntries(parsedMainChannels);
        const incomingUniqueChannelKeys = new Set(incomingUniqueChannels.map(channelKey).filter(Boolean));
        const incomingUniqueKeywordKeys = new Set(safeArray(parsedMainKeywords).map(keywordKey));
        const incomingUniqueVideoIds = new Set(safeArray(parsed.profilesV3?.main?.videoIds).map(normalizeString).filter(Boolean));
        const addedChannels = incomingUniqueChannels.filter(entry => {
            const keys = channelIdentityKeys(entry);
            return keys.length > 0 && !keys.some(key => beforeChannelKeys.has(key));
        }).length;
        const addedKeywords = Array.from(incomingUniqueKeywordKeys).filter(key => !beforeKeywordKeys.has(key)).length;
        const addedVideoIds = Array.from(incomingUniqueVideoIds).filter(videoId => !beforeVideoIds.has(videoId)).length;
        // Notes and playlists follow the profiles they belong to: a full import keeps profile IDs,
        // a single-profile import moves the backup's profile onto the imported target.
        const privateDataMapping = {};
        const persistedProfileIds = new Set(Object.keys(safeObject(persistedProfilesV4?.profiles)));
        if (fullImportProfileIds) {
            for (const id of fullImportProfileIds) if (persistedProfileIds.has(id)) privateDataMapping[id] = id;
        }
        if (incomingSourceProfileId && persistedProfileIds.has(importedTargetProfileId)
            && !Object.prototype.hasOwnProperty.call(privateDataMapping, incomingSourceProfileId)) {
            privateDataMapping[incomingSourceProfileId] = importedTargetProfileId;
        }
        const privateDataCounts = await mergeBackupPrivateData(backupPrivateData, privateDataMapping);
        const incomingKidsLinks = safeObject(parsed.profilesV4)[KIDS_PERSONA_LINKS_KEY];
        if (adoptKidsPersonaLinks === true && incomingKidsLinks && global.FilterTubeKidsYouTubeProfiles) {
            // Nanah device sync carries links through the same profile mapping; the newer link wins per profile.
            const current = await loadProfilesV4();
            const adopted = global.FilterTubeKidsYouTubeProfiles.adopt(current?.[KIDS_PERSONA_LINKS_KEY], incomingKidsLinks,
                privateDataMapping, Object.keys(safeObject(current?.profiles)));
            if (JSON.stringify(adopted) !== JSON.stringify(current?.[KIDS_PERSONA_LINKS_KEY])) {
                requireStorageSuccess(await saveProfilesV4({ ...current, [KIDS_PERSONA_LINKS_KEY]: adopted }), 'YouTube Kids links write');
            }
        }

        const migrationReport = safeObject(parsed.migrationReport);
        const skippedRows = safeArray(migrationReport.invalid).length
            + safeArray(migrationReport.unsupported).length
            + safeArray(migrationReport.unknown).length;
        const storageBytesAfter = await getStorageBytesInUse();
        const receipt = {
            targetProfileId: importedTargetProfileId,
            channels: incomingUniqueChannels.length,
            channelIds: incomingUniqueChannels.filter(entry => entry?.source === 'blocktube').length,
            channelNameRules: incomingUniqueChannels.filter(entry => entry?.source === 'blocktube-channel-name').length,
            keywords: safeArray(parsedMainKeywords).filter(entry => entry?.scope !== 'comment').length,
            comments: safeArray(parsedMainKeywords).filter(entry => entry?.scope === 'comment').length,
            regex: safeArray(parsedMainKeywords).filter(entry => entry?.matchMode === 'regex').length,
            videoIds: safeArray(parsed.profilesV3?.main?.videoIds).length,
            addedChannels,
            addedKeywords,
            addedVideoIds,
            duplicateChannels: Math.max(0, safeArray(parsedMainChannels).length - incomingUniqueChannels.length)
                + Math.max(0, incomingUniqueChannels.length - addedChannels),
            duplicateKeywords: Math.max(0, incomingUniqueKeywordKeys.size - addedKeywords),
            duplicateVideoIds: Math.max(0, incomingUniqueVideoIds.size - addedVideoIds),
            skippedRows,
            storageBytesBefore: storagePreflight.storageBytesBefore,
            storageBytesAfter,
            sourceBytes: storagePreflight.sourceBytes,
            savedVideoNotes: privateDataCounts.savedVideoNotes,
            localPlaylists: privateDataCounts.localPlaylists,
            verified: true
        };

        return {
            ok: true,
            result,
            restoredNanahState,
            migrationReport: parsed.migrationReport || null,
            receipt
        };
        } catch (error) {
            if (importMutationStarted) {
                try {
                    await restoreStorageSnapshot(storageSnapshot);
                } catch (rollbackError) {
                    const rollbackMessage = normalizeString(rollbackError?.message) || 'unknown rollback failure';
                    throw new Error(`${normalizeString(error?.message) || 'Import failed'}; rollback also failed: ${rollbackMessage}`);
                }
            }
            throw error;
        }
    }

    async function exportV3Encrypted({ scope = 'auto', password = '', auth = null, includeTrustedNanahState = false } = {}) {
        const Security = global.FilterTubeSecurity || null;
        if (!Security || typeof Security.encryptJson !== 'function') {
            throw new Error('Security manager unavailable');
        }
        const payload = await exportV3({ scope, auth });
        const exportType = normalizeString(safeObject(payload?.meta).exportType);
        if (includeTrustedNanahState === true && exportType === 'full') {
            const storedNanah = await readStorage([NANAH_TRUSTED_LINKS_KEY, NANAH_DEVICE_ID_KEY]);
            const trustedLinks = safeArray(storedNanah?.[NANAH_TRUSTED_LINKS_KEY]);
            const deviceId = normalizeString(storedNanah?.[NANAH_DEVICE_ID_KEY]);
            const normalizedNanahState = normalizeNanahBackupState({
                deviceId,
                trustedLinks
            });
            if (normalizedNanahState) {
                payload.nanahState = normalizedNanahState;
            }
        }
        const encrypted = await Security.encryptJson(payload, password);
        return {
            meta: {
                ...safeObject(payload?.meta),
                encrypted: true,
                containsNanahTrustedState: safeObject(payload.nanahState).trustedLinks ? true : false
            },
            encrypted
        };
    }

    async function importV3Encrypted(container, { password = '', strategy = 'merge', scope = 'auto', auth = null, nanahStorageLockToken = null } = {}) {
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
        return importV3(decrypted, { strategy, scope, auth, nanahStorageLockToken });
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
                    downloadWithRuntimeApi({
                        url: blobUrl,
                        filename: testPath,
                        saveAs: false
                    }).then((result) => {
                        revokeDownloadBlobUrlLater(blobUrl);
                        if (!result?.ok) {
                            reject(new Error(result?.reason || 'Download failed'));
                        } else {
                            // Clean up test file
                            try {
                                if (Number.isFinite(Number(result.downloadId))) {
                                    runtimeAPI.downloads.erase({ id: result.downloadId });
                                }
                            } catch (e) {
                            }
                            resolve(result.downloadId);
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

            downloadWithRuntimeApi({
                url: blobUrl,
                filename: fullPath,
                saveAs: false // Silent save
            }).then((result) => {
                revokeDownloadBlobUrlLater(blobUrl);
                if (!result?.ok) {
                    resolve({ ok: false, reason: result?.reason || 'Download failed', downloadId: null });
                } else {
                    console.log(`FilterTube: Auto-backup created: ${fullPath}`);
                    resolve({ ok: true, filename: fullPath, downloadId: result.downloadId });
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
        previewBlockTubeExport,
        exportBlockTube,
        exportV3,
        exportV3Encrypted,
        importV3,
        importV3Encrypted,
        convertAppProfileBackup,
        previewBlockTubeMigration,
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
