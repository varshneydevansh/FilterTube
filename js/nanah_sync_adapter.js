(function (global) {
    'use strict';

    const APP_ID = 'filtertube';
    const PAYLOAD_VERSION = 'v3';
    const DEFAULT_DEVICE_CAPABILITIES = [
        'sync.send',
        'sync.receive',
        'control.propose'
    ];

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeScope(scope) {
        const raw = normalizeString(scope).toLowerCase();
        if (raw === 'main' || raw === 'kids' || raw === 'active' || raw === 'full') {
            return raw;
        }
        return 'active';
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

    function normalizeKeywordEntry(entry) {
        if (typeof entry === 'string') return entry;
        const item = safeObject(entry);
        const word = normalizeString(item.word);
        if (!word) return null;
        const packedSource = parsePackedChannelKeywordSource(item.source);
        const channelRef = normalizeString(item.channelRef) || packedSource?.channelRef || '';
        const source = (item.source === 'channel' || packedSource || channelRef) ? 'channel' : item.source;
        return {
            ...item,
            word,
            source: source === 'channel' ? 'channel' : (normalizeString(source) || 'user'),
            channelRef: source === 'channel' ? (channelRef || null) : null
        };
    }

    function normalizeKeywordList(list) {
        return safeArray(list)
            .map(normalizeKeywordEntry)
            .filter(Boolean);
    }

    function keywordKey(entry) {
        if (typeof entry === 'string') {
            return normalizeString(entry).toLowerCase();
        }
        const item = safeObject(entry);
        const word = normalizeString(item.word).toLowerCase();
        if (!word) return '';
        return [
            word,
            item.exact === true ? '1' : '0',
            item.comments === false ? '0' : '1',
            item.semantic === true ? '1' : '0'
        ].join('|');
    }

    function channelKey(entry) {
        const item = safeObject(entry);
        const id = normalizeString(item.id).toLowerCase();
        const handle = normalizeString(item.handle || item.canonicalHandle || item.handleDisplay).toLowerCase();
        const customUrl = normalizeString(item.customUrl).toLowerCase();
        const name = normalizeString(item.name).toLowerCase();
        return id || handle || customUrl || name;
    }

    function mergeKeywordLists(base, incoming) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const normalized = normalizeKeywordEntry(entry);
            const key = keywordKey(normalized);
            if (key) seen.set(key, normalized);
        });
        safeArray(incoming).forEach((entry) => {
            const normalized = normalizeKeywordEntry(entry);
            const key = keywordKey(normalized);
            if (key) seen.set(key, normalized);
        });
        return Array.from(seen.values());
    }

    function mergeChannelLists(base, incoming) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const item = safeObject(entry);
            const key = channelKey(item);
            if (key) seen.set(key, item);
        });
        safeArray(incoming).forEach((entry) => {
            const item = safeObject(entry);
            const key = channelKey(item);
            if (key) seen.set(key, item);
        });
        return Array.from(seen.values());
    }

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value));
    }

    async function buildScopedPortablePayload(io, scope) {
        if (typeof io.loadProfilesV4 !== 'function') {
            throw new Error('Profile-scoped Nanah sync requires loadProfilesV4');
        }

        const profilesV4 = safeObject(await io.loadProfilesV4());
        const activeId = normalizeString(profilesV4.activeProfileId) || 'default';
        const activeProfile = safeObject(safeObject(profilesV4.profiles)[activeId]);
        const profileName = normalizeString(activeProfile.name) || activeId;

        if (!activeProfile || Object.keys(activeProfile).length === 0) {
            throw new Error('Active profile is not available');
        }

        if (scope === 'main') {
            return {
                version: PAYLOAD_VERSION,
                meta: {
                    exportType: 'nanah-scope',
                    scope: 'main',
                    profileId: activeId,
                    profileName
                },
                section: 'main',
                profileId: activeId,
                profileName,
                data: cloneJson(safeObject(activeProfile.main))
            };
        }

        if (scope === 'kids') {
            return {
                version: PAYLOAD_VERSION,
                meta: {
                    exportType: 'nanah-scope',
                    scope: 'kids',
                    profileId: activeId,
                    profileName
                },
                section: 'kids',
                profileId: activeId,
                profileName,
                data: cloneJson(safeObject(activeProfile.kids))
            };
        }

        throw new Error(`Unsupported scoped payload: ${scope}`);
    }

    async function applyScopedPortablePayload(io, portable, { strategy = 'merge', targetProfileId = null } = {}) {
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            throw new Error('Profile-scoped Nanah sync requires load/saveProfilesV4');
        }

        const root = safeObject(portable);
        const scope = normalizeScope(root.section || safeObject(root.meta).scope);
        if (scope !== 'main' && scope !== 'kids') {
            throw new Error('Invalid profile-scoped Nanah payload');
        }

        const profilesV4 = safeObject(await io.loadProfilesV4());
        const activeId = normalizeString(profilesV4.activeProfileId) || 'default';
        const resolvedTargetProfileId = normalizeString(targetProfileId) || activeId;
        const profiles = {
            ...safeObject(profilesV4.profiles)
        };
        const activeProfile = safeObject(profiles[resolvedTargetProfileId]);
        if (!activeProfile || Object.keys(activeProfile).length === 0) {
            throw new Error('Target profile is not available');
        }

        const data = safeObject(root.data);
        const replace = strategy === 'replace';

        if (scope === 'main') {
            const currentMain = safeObject(activeProfile.main);
            const nextMain = {
                ...currentMain,
                ...data,
                mode: normalizeString(data.mode) === 'whitelist' ? 'whitelist' : (currentMain.mode === 'whitelist' ? 'whitelist' : 'blocklist'),
                channels: replace
                    ? safeArray(data.channels)
                    : mergeChannelLists(currentMain.channels, data.channels),
                keywords: replace
                    ? normalizeKeywordList(data.keywords)
                    : mergeKeywordLists(currentMain.keywords, data.keywords),
                whitelistChannels: replace
                    ? safeArray(data.whitelistChannels)
                    : mergeChannelLists(currentMain.whitelistChannels, data.whitelistChannels),
                whitelistKeywords: replace
                    ? normalizeKeywordList(data.whitelistKeywords)
                    : mergeKeywordLists(currentMain.whitelistKeywords, data.whitelistKeywords)
            };

            profiles[resolvedTargetProfileId] = {
                ...activeProfile,
                main: nextMain
            };
        } else {
            const currentKids = safeObject(activeProfile.kids);
            const nextKids = {
                ...currentKids,
                ...data,
                mode: normalizeString(data.mode) === 'whitelist' ? 'whitelist' : (currentKids.mode === 'whitelist' ? 'whitelist' : 'blocklist'),
                strictMode: Object.prototype.hasOwnProperty.call(data, 'strictMode')
                    ? data.strictMode !== false
                    : currentKids.strictMode !== false,
                blockedChannels: replace
                    ? safeArray(data.blockedChannels)
                    : mergeChannelLists(currentKids.blockedChannels, data.blockedChannels),
                blockedKeywords: replace
                    ? safeArray(data.blockedKeywords)
                    : mergeKeywordLists(currentKids.blockedKeywords, data.blockedKeywords),
                whitelistChannels: replace
                    ? safeArray(data.whitelistChannels)
                    : mergeChannelLists(currentKids.whitelistChannels, data.whitelistChannels),
                whitelistKeywords: replace
                    ? safeArray(data.whitelistKeywords)
                    : mergeKeywordLists(currentKids.whitelistKeywords, data.whitelistKeywords)
            };

            profiles[resolvedTargetProfileId] = {
                ...activeProfile,
                kids: nextKids
            };
        }

        await io.saveProfilesV4({
            ...profilesV4,
            profiles
        });

        return {
            ok: true,
            scope,
            profileId: resolvedTargetProfileId,
            strategy: replace ? 'replace' : 'merge'
        };
    }

    function generateId() {
        if (global.crypto && typeof global.crypto.randomUUID === 'function') {
            return global.crypto.randomUUID();
        }
        return `nanah-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function summarizePortablePayload(payload, scope) {
        const root = safeObject(payload);
        const meta = safeObject(root.meta);
        const exportType = normalizeString(meta.exportType).toLowerCase();
        const profileName = normalizeString(meta.profileName) || normalizeString(meta.profileId);

        if (scope === 'kids') return 'FilterTube YouTube Kids settings';
        if (scope === 'main') return 'FilterTube main YouTube settings';
        if (scope === 'full' || exportType === 'full') return 'Full FilterTube backup';
        if (scope === 'active' && profileName) return `FilterTube profile: ${profileName}`;
        return 'FilterTube settings';
    }

    async function getIO() {
        const io = global.FilterTubeIO || null;
        if (!io || typeof io.exportV3 !== 'function' || typeof io.importV3 !== 'function') {
            throw new Error('FilterTubeIO export/import is not available');
        }
        return io;
    }

    async function buildPortablePayload({ scope = 'active', auth = null } = {}) {
        const io = await getIO();
        const normalizedScope = normalizeScope(scope);
        const payload = (normalizedScope === 'main' || normalizedScope === 'kids')
            ? await buildScopedPortablePayload(io, normalizedScope)
            : await io.exportV3({ scope: normalizedScope, auth });
        return {
            app: APP_ID,
            scope: normalizedScope,
            payloadVersion: PAYLOAD_VERSION,
            summary: summarizePortablePayload(payload, normalizedScope),
            portable: payload
        };
    }

    async function buildSyncEnvelope({ scope = 'active', auth = null } = {}) {
        const built = await buildPortablePayload({ scope, auth });
        return {
            t: 'app_sync',
            id: generateId(),
            app: APP_ID,
            scope: built.scope,
            payloadVersion: built.payloadVersion,
            payload: JSON.stringify(built.portable)
        };
    }

    async function buildControlProposal({ scope = 'active', strategy = 'merge', auth = null } = {}) {
        const built = await buildPortablePayload({ scope, auth });
        return {
            t: 'control_proposal',
            id: generateId(),
            app: APP_ID,
            mode: 'proposal',
            action: 'filtertube.apply_sync_payload',
            scope: built.scope,
            payloadVersion: built.payloadVersion,
            summary: built.summary,
            payload: JSON.stringify({
                targetScope: built.scope,
                strategy: strategy === 'replace' ? 'replace' : (strategy === 'preview' ? 'preview' : 'merge'),
                portable: built.portable
            })
        };
    }

    function extractPortableFromEnvelope(envelope) {
        const root = safeObject(envelope);
        if (root.t === 'app_sync') {
            return {
                scope: normalizeScope(root.scope),
                portable: JSON.parse(root.payload)
            };
        }
        if (root.t === 'control_proposal') {
            const proposal = safeObject(JSON.parse(root.payload));
            return {
                scope: normalizeScope(proposal.targetScope || root.scope),
                portable: proposal.portable
            };
        }
        throw new Error('Unsupported Nanah envelope for FilterTube');
    }

    async function applyIncomingEnvelope(envelope, { strategy = 'merge', auth = null, scope = null, targetProfileId = null } = {}) {
        const io = await getIO();
        const extracted = extractPortableFromEnvelope(envelope);
        const effectiveScope = normalizeScope(scope || extracted.scope);
        const effectiveStrategy = strategy === 'replace' ? 'replace' : (strategy === 'preview' ? 'preview' : 'merge');
        if (effectiveStrategy === 'preview') {
            return {
                ok: true,
                preview: true,
                scope: effectiveScope,
                portable: extracted.portable,
                summary: summarizePortablePayload(extracted.portable, effectiveScope)
            };
        }
        if (effectiveScope === 'main' || effectiveScope === 'kids') {
            return applyScopedPortablePayload(io, extracted.portable, {
                strategy: effectiveStrategy,
                targetProfileId
            });
        }
        return io.importV3(extracted.portable, {
            strategy: effectiveStrategy,
            scope: effectiveScope,
            auth,
            targetProfileId
        });
    }

    function getDeviceDescriptor(overrides = {}) {
        const root = safeObject(overrides);
        const label = normalizeString(root.deviceLabel)
            || normalizeString(global.navigator?.userAgentData?.platform)
            || normalizeString(global.navigator?.platform)
            || 'Browser device';
        const platform = normalizeString(root.platform)
            || normalizeString(global.navigator?.userAgentData?.platform)
            || normalizeString(global.navigator?.platform)
            || 'browser';
        return {
            deviceId: normalizeString(root.deviceId) || generateId(),
            deviceLabel: label,
            app: APP_ID,
            appVersion: normalizeString(root.appVersion) || '',
            platform,
            capabilities: Array.isArray(root.capabilities) && root.capabilities.length > 0
                ? root.capabilities
                : DEFAULT_DEVICE_CAPABILITIES.slice()
        };
    }

    global.FilterTubeNanahAdapter = {
        appId: APP_ID,
        payloadVersion: PAYLOAD_VERSION,
        supportedScopes: ['main', 'kids', 'active', 'full'],
        getDeviceDescriptor,
        summarizePortablePayload,
        buildPortablePayload,
        buildSyncEnvelope,
        buildControlProposal,
        applyIncomingEnvelope,
        extractPortableFromEnvelope
    };
})(typeof window !== 'undefined' ? window : this);
