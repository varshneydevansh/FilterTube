// js/content/handle_resolver.js - Isolated World
//
// Handle <-> UC ID resolver + channelMap persistence extracted from
// `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.
//
// Provides:
// - `fetchIdForHandle()` + `resolvedHandleCache` (best-effort @handle -> UC...)
// - `persistChannelMappings()` (sync learned mappings to background + in-memory settings)
// - Handle parsing helpers: `extractRawHandle`, `normalizeHandleValue`, `extractHandleFromString`
//
// Depends on globals provided by earlier content scripts:
// - `browserAPI_BRIDGE`, `currentSettings` (bridge_injection.js)
// - `applyDOMFallback` (dom_fallback.js)

const HANDLE_TERMINATOR_REGEX = /[\/\s?#"'<>\&]/;
const HANDLE_GLYPH_NORMALIZERS = [
    { pattern: /[\u2018\u2019\u201A\u201B\u2032\uFF07]/g, replacement: '\'' },
    { pattern: /[\u201C\u201D\u2033\uFF02]/g, replacement: '"' },
    { pattern: /[\u2013\u2014]/g, replacement: '-' },
    { pattern: /\uFF0E/g, replacement: '.' },
    { pattern: /\uFF3F/g, replacement: '_' }
];

function persistChannelMappings(mappings = []) {
    if (!Array.isArray(mappings) || mappings.length === 0) return;
    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "updateChannelMap",
            mappings
        });
    } catch (error) {
        console.warn('FilterTube: Failed to persist channel mapping', error);
    }

    if (!currentSettings || typeof currentSettings !== 'object') return;
    if (!currentSettings.channelMap || typeof currentSettings.channelMap !== 'object') {
        currentSettings.channelMap = {};
    }
    const map = currentSettings.channelMap;
    mappings.forEach(mapping => {
        if (!mapping || !mapping.id || !mapping.handle) return;
        const idKey = mapping.id.toLowerCase();
        const handleKey = mapping.handle.toLowerCase();
        map[idKey] = mapping.handle;
        map[handleKey] = mapping.id;
    });
}

function normalizeHandleGlyphs(value) {
    let normalized = value;
    HANDLE_GLYPH_NORMALIZERS.forEach(({ pattern, replacement }) => {
        normalized = normalized.replace(pattern, replacement);
    });
    return normalized;
}

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
        // Ignore decode failures; fall back to raw string
    }

    buffer = normalizeHandleGlyphs(buffer);
    if (!buffer) return '';
    return `@${buffer}`;
}

function normalizeHandleValue(handle) {
    const sharedNormalizeHandleValue = window.FilterTubeIdentity?.normalizeHandleValue;
    if (typeof sharedNormalizeHandleValue === 'function') {
        return sharedNormalizeHandleValue(handle);
    }
    if (!handle) return '';
    let normalized = handle.trim();
    if (!normalized) return '';

    // Always operate on the raw decoded handle to avoid mismatched cases/encodings
    const rawHandle = extractRawHandle(normalized);
    if (rawHandle) {
        normalized = rawHandle;
    } else if (!normalized.startsWith('@')) {
        return '';
    }

    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.split('/')[0];
    normalized = normalized.replace(/\s+/g, '');
    if (!normalized) return '';
    if (/^UC[\w-]{22}$/i.test(normalized)) return '';
    return `@${normalized.toLowerCase()}`;
}

function extractHandleFromString(value) {
    const raw = extractRawHandle(value);
    return raw ? normalizeHandleValue(raw) : '';
}

// ==========================================
// ACTIVE RESOLVER - Fetches UC ID for @handles
// ==========================================
const resolvedHandleCache = new Map();

let pendingDomFallbackRerunTimer = 0;
function scheduleDomFallbackRerun() {
    if (pendingDomFallbackRerunTimer) return;
    pendingDomFallbackRerunTimer = setTimeout(() => {
        pendingDomFallbackRerunTimer = 0;
        try {
            if (typeof applyDOMFallback === 'function') {
                applyDOMFallback(currentSettings, { forceReprocess: true });
            }
        } catch (e) {
        }
    }, 250);
}

async function fetchIdForHandle(handle, options = {}) {
    const { skipNetwork = false } = options;
    const normalizedHandle = normalizeHandleValue(handle);
    const cleanHandle = normalizedHandle ? normalizedHandle.replace(/^@/, '') : '';
    if (!cleanHandle) return null;

    // If we already have a result, return it.
    // Never leak the internal 'PENDING' sentinel to callers – treat it as
    // "not yet resolved" so callers see a simple "no ID yet" (null).
    if (resolvedHandleCache.has(cleanHandle)) {
        const cached = resolvedHandleCache.get(cleanHandle);
        if (cached !== 'PENDING') {
            return cached;
        }
    }

    // Try resolving from persisted channelMap first to avoid hitting broken /about pages
    try {
        const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap']);
        const channelMap = storage.channelMap || {};
        const keyHandle = (`@${cleanHandle}`).toLowerCase();
        const mappedId = channelMap[keyHandle];

        if (mappedId && mappedId.toUpperCase().startsWith('UC')) {
            resolvedHandleCache.set(cleanHandle, mappedId);
            console.log(`FilterTube: Resolved @${cleanHandle} from channelMap -> ${mappedId}`);
            return mappedId;
        }
    } catch (e) {
        console.warn('FilterTube: Failed to read channelMap while resolving handle', e);
    }

    if (resolvedHandleCache.has(cleanHandle) && resolvedHandleCache.get(cleanHandle) === 'PENDING') {
        return null;
    }

    if (skipNetwork) {
        // Remove the pending marker so future non-skip calls can attempt network fetch
        resolvedHandleCache.delete(cleanHandle);
        return null;
    }

    // Mark as pending to prevent Loop
    resolvedHandleCache.set(cleanHandle, 'PENDING');

    try {
        const rawCandidate = extractRawHandle(handle);
        const networkHandleCore = rawCandidate
            ? rawCandidate.replace(/^@+/, '').split(/[/?#]/)[0].trim()
            : cleanHandle;
        const encodedHandle = encodeURIComponent(networkHandleCore);
        let response = await fetch(`https://www.youtube.com/@${encodedHandle}/about`);

        if (!response.ok) {
            response = await fetch(`https://www.youtube.com/@${encodedHandle}`);
        }

        if (!response.ok) {
            resolvedHandleCache.delete(cleanHandle);
            return null;
        }

        const text = await response.text();

        const match = text.match(/channel\/(UC[\w-]{22})/);
        if (match && match[1]) {
            const id = match[1];

            resolvedHandleCache.set(cleanHandle, id);

            window.postMessage({
                type: 'FilterTube_UpdateChannelMap',
                payload: [{ id: id, handle: `@${cleanHandle}` }],
                source: 'content_bridge'
            }, '*');

            if (window.__filtertubeDebug) {
                console.log(`FilterTube: ✅ Resolved @${cleanHandle} -> ${id}`);
            }

            scheduleDomFallbackRerun();
            return id;
        }
        resolvedHandleCache.delete(cleanHandle);
    } catch (e) {
        console.warn(`FilterTube: Failed to resolve @${cleanHandle}`, e);
        resolvedHandleCache.delete(cleanHandle);
    }
    return null;
}
