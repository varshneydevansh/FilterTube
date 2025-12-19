// js/shared/identity.js
//
// Shared, pure channel identity + matching helpers.
//
// This file is intentionally framework/bundler-free so it can be loaded in all
// MV3 execution worlds:
// - Isolated World (content scripts) via `manifest*.json` content_scripts order
// - Main World (page context) via script injection (see `content_bridge.js`)
// - Background (service worker) via `importScripts('js/shared/identity.js')`
//
// Design goals:
// - Single source of truth for handle parsing and normalization.
// - UC ID is the canonical identity; @handle is treated as an alias.
// - Never throw on malformed input (return ''/false instead).
//
// API is exposed as global `FilterTubeIdentity` on `window` / `self`.

(function (root) {
    'use strict';

    const HANDLE_TERMINATOR_REGEX = /[\/\s?#"'<>\&\u2022\u00B7]/;
    const HANDLE_GLYPH_NORMALIZERS = [
        { pattern: /[\u2018\u2019\u201A\u201B\u2032\uFF07]/g, replacement: "'" },
        { pattern: /[\u201C\u201D\u2033\uFF02]/g, replacement: '"' },
        { pattern: /[\u2013\u2014]/g, replacement: '-' },
        { pattern: /\uFF0E/g, replacement: '.' },
        { pattern: /\uFF3F/g, replacement: '_' }
    ];
    const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
    const UC_ID_REGEX = /^UC[\w-]{22}$/i;

    function normalizeHandleGlyphs(value) {
        let normalized = value;
        for (const { pattern, replacement } of HANDLE_GLYPH_NORMALIZERS) {
            normalized = normalized.replace(pattern, replacement);
        }
        return normalized;
    }

    /**
     * Extract a display handle from any string containing `@...`.
     *
     * Returns the handle with its original casing (e.g. `@SomeHandle`).
     * Use `normalizeHandleValue()` when you need a canonical comparison key.
     */
    function extractRawHandle(value) {
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

        buffer = buffer.replace(ZERO_WIDTH_REGEX, '');
        buffer = normalizeHandleGlyphs(buffer);
        buffer = buffer.trim();
        if (!buffer) return '';

        return `@${buffer}`;
    }

    /**
     * Canonicalize a handle for comparison/storage.
     *
     * Returns a lowercase `@handle` (e.g. `@somehandle`).
     */
    function normalizeHandleValue(handle) {
        if (!handle || typeof handle !== 'string') return '';
        let normalized = handle.trim();
        if (!normalized) return '';

        const rawHandle = extractRawHandle(normalized);
        if (rawHandle) {
            normalized = rawHandle;
        }

        normalized = normalized.replace(/^@+/, '');
        normalized = normalized.split('/')[0];
        normalized = normalized.replace(/\s+/g, '');
        if (!normalized) return '';

        return `@${normalized.toLowerCase()}`;
    }

    function normalizeHandleForComparison(handle) {
        const normalized = normalizeHandleValue(handle);
        return normalized ? normalized.toLowerCase() : '';
    }

    function normalizeUcIdForComparison(value) {
        if (!value || typeof value !== 'string') return '';
        const trimmed = value.trim();
        if (!trimmed) return '';

        const directMatch = trimmed.match(/(UC[\w-]{22})/i);
        if (!directMatch) return '';

        return directMatch[1].toLowerCase();
    }

    /**
     * Returns true if `value` contains a valid YouTube UC channel id.
     */
    function isUcId(value) {
        if (!value || typeof value !== 'string') return false;
        const cleaned = value.trim();
        if (!cleaned) return false;

        const match = cleaned.match(/(UC[\w-]{22})/i);
        if (!match) return false;
        return UC_ID_REGEX.test(match[1]);
    }

    /**
     * Convert arbitrary user input (url, @handle, UC id, channel/UC...) into a
     * typed canonical form.
     */
    function canonicalizeChannelInput(input) {
        if (typeof input !== 'string') {
            return { type: 'unknown', value: '' };
        }

        let cleaned = input.trim();
        if (!cleaned) return { type: 'unknown', value: '' };

        try {
            cleaned = decodeURIComponent(cleaned);
        } catch (e) {
            // ignore
        }

        let pathCandidate = cleaned;
        if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
            try {
                const url = new URL(cleaned);
                pathCandidate = url.pathname || cleaned;
            } catch (e) {
                // ignore
            }
        } else if ((/^www\./i).test(cleaned) || cleaned.includes('youtube.com/') || cleaned.includes('youtu.be/')) {
            try {
                const url = new URL(`https://${cleaned.replace(/^https?:\/\//i, '')}`);
                pathCandidate = url.pathname || cleaned;
            } catch (e) {
                // ignore
            }
        }

        const ucMatch = (pathCandidate || cleaned).match(/(?:^|\/)(?:channel\/)?(UC[\w-]{22})/i);
        if (ucMatch && ucMatch[1]) {
            return { type: 'ucid', value: ucMatch[1] };
        }

        const rawHandle = extractRawHandle(pathCandidate) || extractRawHandle(cleaned);
        if (rawHandle) {
            return { type: 'handle', value: normalizeHandleValue(rawHandle) };
        }

        return { type: 'unknown', value: cleaned };
    }

    function collectHandleVariants(value) {
        const handles = [];
        const seen = new Set();
        const addHandle = (candidate) => {
            const normalized = normalizeHandleForComparison(candidate);
            if (!normalized) return;
            if (seen.has(normalized)) return;
            seen.add(normalized);
            handles.push(normalized);
        };

        addHandle(value?.handle);
        addHandle(value?.canonicalHandle);
        addHandle(value?.handleDisplay);

        return handles;
    }

    /**
     * Core matching primitive used by UI/menu checks and DOM fallback.
     * Supports legacy string filters and object filters.
     */
    function channelMatchesFilter(meta, filterChannel, channelMap = {}) {
        if (!filterChannel) return false;

        const metaId = normalizeUcIdForComparison(meta?.id);
        const metaName = typeof meta?.name === 'string' ? meta.name.toLowerCase().trim() : '';
        const metaHandles = collectHandleVariants(meta);

        // Helper to normalize customUrl for comparison (decode percent-encoding, lowercase)
        const normalizeCustomUrl = (url) => {
            if (!url || typeof url !== 'string') return '';
            try {
                return decodeURIComponent(url).toLowerCase().trim();
            } catch (e) {
                return url.toLowerCase().trim();
            }
        };

        const metaCustomUrl = normalizeCustomUrl(meta?.customUrl);

        const lookupChannelMap = (key) => {
            if (!channelMap || typeof channelMap !== 'object') return '';
            if (!key || typeof key !== 'string') return '';
            return channelMap[key.toLowerCase()] || '';
        };

        if (typeof filterChannel === 'object') {
            const filterId = normalizeUcIdForComparison(filterChannel.id || '');
            const filterName = typeof filterChannel.name === 'string' ? filterChannel.name.toLowerCase().trim() : '';
            const filterHandles = collectHandleVariants(filterChannel);
            const filterCustomUrl = normalizeCustomUrl(filterChannel.customUrl);

            if (!filterId && !filterName && filterHandles.length === 0 && !filterCustomUrl) return false;

            if (filterId && metaId && filterId === metaId) {
                return true;
            }

            if (filterHandles.length > 0 && metaHandles.length > 0) {
                for (const fh of filterHandles) {
                    for (const mh of metaHandles) {
                        if (fh === mh) return true;
                    }
                }
            }

            if (filterName && metaName && filterName === metaName) {
                return true;
            }

            if (filterName && metaHandles.length > 0) {
                for (const mh of metaHandles) {
                    const withoutAt = mh.replace(/^@/, '');
                    if (withoutAt && withoutAt === filterName) return true;
                }
            }

            if (metaName && filterHandles.length > 0) {
                for (const fh of filterHandles) {
                    const withoutAt = fh.replace(/^@/, '');
                    if (withoutAt && withoutAt === metaName) return true;
                }
            }

            if (filterId && metaHandles.length > 0) {
                const mappedHandle = lookupChannelMap(filterId);
                const normalizedMappedHandle = normalizeHandleForComparison(mappedHandle);
                if (normalizedMappedHandle) {
                    for (const mh of metaHandles) {
                        if (mh === normalizedMappedHandle) return true;
                    }
                }
            }

            if (metaId && filterHandles.length > 0) {
                for (const fh of filterHandles) {
                    const mappedId = lookupChannelMap(fh);
                    const normalizedMappedId = normalizeUcIdForComparison(mappedId);
                    if (normalizedMappedId && normalizedMappedId === metaId) {
                        return true;
                    }
                }
            }

            // Direct customUrl match (c/Name or user/Name)
            if (filterCustomUrl && metaCustomUrl && filterCustomUrl === metaCustomUrl) {
                return true;
            }

            // Cross-match: if filterChannel has customUrl, check if channelMap maps it to metaId
            if (filterCustomUrl && metaId) {
                const mappedId = lookupChannelMap(filterCustomUrl);
                const normalizedMappedId = normalizeUcIdForComparison(mappedId);
                if (normalizedMappedId && normalizedMappedId === metaId) {
                    return true;
                }
            }

            // Cross-match: if meta has customUrl, check if channelMap maps it to filterId
            if (metaCustomUrl && filterId) {
                const mappedId = lookupChannelMap(metaCustomUrl);
                const normalizedMappedId = normalizeUcIdForComparison(mappedId);
                if (normalizedMappedId && normalizedMappedId === filterId) {
                    return true;
                }
            }

            return false;
        }

        if (typeof filterChannel !== 'string') return false;
        const normalizedFilter = filterChannel.trim();
        if (!normalizedFilter) return false;

        if (normalizedFilter.startsWith('@')) {
            const filterHandle = normalizeHandleForComparison(normalizedFilter);
            if (filterHandle && metaHandles.length > 0) {
                for (const mh of metaHandles) {
                    if (mh === filterHandle) return true;
                }
            }

            const mappedId = lookupChannelMap(normalizedFilter);
            const normalizedMappedId = normalizeUcIdForComparison(mappedId);
            if (normalizedMappedId && metaId && normalizedMappedId === metaId) {
                return true;
            }

            // Back-compat: if we only have a channel name (common on watch playlist panels),
            // allow matching `@handle` filters against name == handle-without-@.
            const filterWithoutAt = filterHandle ? filterHandle.replace(/^@/, '') : '';
            if (filterWithoutAt && metaName && metaName === filterWithoutAt) {
                return true;
            }

            return false;
        }

        const filterId = normalizeUcIdForComparison(normalizedFilter);
        if (filterId && metaId && filterId === metaId) {
            return true;
        }

        if (filterId && metaHandles.length > 0) {
            const mappedHandle = lookupChannelMap(filterId);
            const normalizedMappedHandle = normalizeHandleForComparison(mappedHandle);
            if (normalizedMappedHandle) {
                for (const mh of metaHandles) {
                    if (mh === normalizedMappedHandle) return true;
                }
            }
        }

        if (metaId && filterId && metaHandles.length > 0) {
            for (const mh of metaHandles) {
                const mappedId = lookupChannelMap(mh);
                const normalizedMappedId = normalizeUcIdForComparison(mappedId);
                if (normalizedMappedId && normalizedMappedId === filterId) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * True if `channelInfo` matches any entry in `filterChannels`.
     */
    function isChannelBlocked(filterChannels, channelInfo, channelMap = {}) {
        if (!Array.isArray(filterChannels) || filterChannels.length === 0) return false;
        return filterChannels.some(filterChannel => channelMatchesFilter(channelInfo, filterChannel, channelMap));
    }

    const api = {
        extractRawHandle,
        normalizeHandleValue,
        normalizeHandleForComparison,
        isUcId,
        canonicalizeChannelInput,
        channelMatchesFilter,
        isChannelBlocked
    };

    const existing = root.FilterTubeIdentity && typeof root.FilterTubeIdentity === 'object'
        ? root.FilterTubeIdentity
        : {};

    root.FilterTubeIdentity = Object.assign(existing, api);
})(typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined'
        ? self
        : globalThis));
