/* FilterTube local playlists data contract (filtertube.local-playlists v1). No storage, transport or filtering.
 * Mirrors the Android model, codec and merge in FilterTubeApp NativeLocalPlaylists.kt and
 * docs/app/LOCAL_PLAYLISTS_FORMAT.md, so both sides produce identical merges. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FilterTubeLocalPlaylists = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const FORMAT = 'filtertube.local-playlists';
    const VERSION = 1;
    const WATCH_LATER_ID = 'watch_later';
    const SYSTEM_WATCH_LATER = 'watchLater';
    const LIMITS = Object.freeze({
        MAX_PLAYLISTS_PER_SCOPE: 200, MAX_ENTRIES: 5000, MAX_NAME: 150,
        MAX_TEXT: 1024, MAX_URI: 2048, MAX_BYTES: 16 * 1024 * 1024
    });
    const KINDS = ['video', 'short', 'musicTrack', 'offlineFile'];
    const SURFACES = ['main', 'kids'];
    const ROOT_FIELDS = ['format', 'version', 'playlists'];
    const PLAYLIST_FIELDS = ['profileId', 'surface', 'id', 'system', 'name', 'nameUpdatedAt',
        'createdAt', 'orderUpdatedAt', 'deletedAt', 'items'];
    const ITEM_FIELDS = ['kind', 'videoId', 'uri', 'title', 'channelId', 'channelName',
        'durationSeconds', 'thumbnailUrl', 'addedAt', 'removedAt'];
    const ID = /^[A-Za-z0-9_-]{1,64}$/;
    const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
    const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

    function requireValue(ok, reason) { if (!ok) throw new Error('Invalid local playlists: ' + reason); }
    function unicode(text) {
        for (let i = 0; i < text.length; i++) {
            const unit = text.charCodeAt(i);
            if (unit >= 0xd800 && unit <= 0xdbff) {
                const next = text.charCodeAt(++i);
                if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
            } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
        }
        return true;
    }
    function byteLength(text) {
        let length = 0;
        for (const symbol of text) { const point = symbol.codePointAt(0); length += point < 128 ? 1 : point < 2048 ? 2 : point < 65536 ? 3 : 4; }
        return length;
    }
    function fields(value, allowed, where) {
        requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), where + ' must be an object');
        const proto = Object.getPrototypeOf(value);
        requireValue(proto === Object.prototype || proto === null, where + ' must be a plain object');
        requireValue(Object.keys(value).every(key => allowed.includes(key)), 'unknown ' + where + ' field');
    }
    function string(value, key) {
        requireValue(typeof value === 'string' && unicode(value), key + ' must be text');
        return value;
    }
    function text(json, key) {
        requireValue(own(json, key), 'missing ' + key);
        const value = string(json[key], key);
        requireValue(value.trim().length > 0, 'missing ' + key);
        return value;
    }
    function optText(json, key) {
        if (!own(json, key) || json[key] === null) return null;
        const value = string(json[key], key);
        return value.length ? value : null;
    }
    function time(json, key) {
        const value = json[key];
        requireValue(Number.isSafeInteger(value) && value >= 0, 'invalid ' + key);
        return value;
    }
    function compare(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

    function itemKey(item) { return item.kind === 'offlineFile' ? 'file:' + item.uri : 'yt:' + item.videoId; }
    function isPresent(item) { return item.addedAt > item.removedAt; }
    function isWatchLater(playlist) { return playlist.system === SYSTEM_WATCH_LATER; }
    function entries(playlist) { return playlist.items.filter(isPresent); }
    function contentUpdatedAt(playlist) {
        let newest = Math.max(playlist.nameUpdatedAt, playlist.orderUpdatedAt, playlist.createdAt);
        for (const item of playlist.items) newest = Math.max(newest, item.addedAt, item.removedAt);
        return newest;
    }
    /** A deletion wins unless something was added, renamed or reordered after it. */
    function isDeleted(playlist) {
        return playlist.deletedAt > 0 && playlist.deletedAt >= contentUpdatedAt(playlist) && !isWatchLater(playlist);
    }

    function checkItem(item) {
        requireValue(item.addedAt >= 0 && item.removedAt >= 0, 'invalid item time');
        requireValue(item.videoId === null || VIDEO_ID.test(item.videoId), 'invalid video id');
        if (item.kind === 'offlineFile') {
            requireValue(item.uri !== null && item.uri.trim().length > 0 && item.uri.length <= LIMITS.MAX_URI, 'offline item needs a media reference');
        } else requireValue(item.videoId !== null && item.uri === null, 'online item needs a video id');
        requireValue(item.title.length <= LIMITS.MAX_TEXT && (item.channelName || '').length <= LIMITS.MAX_TEXT
            && (item.channelId || '').length <= 256 && (item.thumbnailUrl || '').length <= LIMITS.MAX_URI, 'item text too long');
        requireValue(item.durationSeconds === null || item.durationSeconds >= 0, 'invalid duration');
        return item;
    }
    function checkPlaylist(playlist) {
        requireValue(playlist.profileId.trim().length > 0 && playlist.profileId.length <= 1024, 'invalid playlist profile');
        requireValue(SURFACES.includes(playlist.surface), 'unknown surface');
        requireValue(ID.test(playlist.id), 'invalid playlist id');
        requireValue(playlist.system === null || (playlist.system === SYSTEM_WATCH_LATER && playlist.id === WATCH_LATER_ID), 'invalid system playlist');
        requireValue(playlist.id !== WATCH_LATER_ID || playlist.system === SYSTEM_WATCH_LATER, 'invalid Watch later');
        requireValue(playlist.name.trim().length > 0 && playlist.name.length <= LIMITS.MAX_NAME, 'invalid playlist name');
        requireValue([playlist.nameUpdatedAt, playlist.createdAt, playlist.orderUpdatedAt, playlist.deletedAt]
            .every(value => Number.isSafeInteger(value) && value >= 0), 'invalid playlist time');
        requireValue(playlist.items.length <= LIMITS.MAX_ENTRIES, 'playlist is full');
        requireValue(new Set(playlist.items.map(itemKey)).size === playlist.items.length, 'duplicate playlist item');
        return playlist;
    }

    function decodeItem(json) {
        fields(json, ITEM_FIELDS, 'item');
        const kind = text(json, 'kind');
        requireValue(KINDS.includes(kind), 'unknown media kind');
        requireValue(own(json, 'title'), 'missing title');
        let durationSeconds = null;
        if (own(json, 'durationSeconds')) {
            durationSeconds = json.durationSeconds;
            requireValue(Number.isSafeInteger(durationSeconds) && durationSeconds >= 0 && durationSeconds <= 2147483647, 'invalid duration');
        }
        return checkItem({
            kind, videoId: optText(json, 'videoId'), uri: optText(json, 'uri'), title: string(json.title, 'title'),
            channelId: optText(json, 'channelId'), channelName: optText(json, 'channelName'), durationSeconds,
            thumbnailUrl: optText(json, 'thumbnailUrl'), addedAt: time(json, 'addedAt'),
            removedAt: own(json, 'removedAt') ? time(json, 'removedAt') : 0
        });
    }
    function decodePlaylist(json) {
        fields(json, PLAYLIST_FIELDS, 'playlist');
        requireValue(Array.isArray(json.items), 'missing items');
        requireValue(json.items.length <= LIMITS.MAX_ENTRIES, 'playlist is full');
        const items = json.items.map(decodeItem);
        return checkPlaylist({
            profileId: text(json, 'profileId'), surface: text(json, 'surface'), id: text(json, 'id'),
            system: own(json, 'system') ? text(json, 'system') : null, name: text(json, 'name'),
            nameUpdatedAt: time(json, 'nameUpdatedAt'), createdAt: time(json, 'createdAt'),
            orderUpdatedAt: time(json, 'orderUpdatedAt'), deletedAt: own(json, 'deletedAt') ? time(json, 'deletedAt') : 0,
            items: items.filter(isPresent).concat(items.filter(item => !isPresent(item)))
        });
    }

    /** Wire JSON, in the same key order as Android's codec. */
    function itemJson(item) {
        const result = { kind: item.kind };
        if (item.videoId !== null) result.videoId = item.videoId;
        if (item.uri !== null) result.uri = item.uri;
        result.title = item.title;
        if (item.channelId !== null) result.channelId = item.channelId;
        if (item.channelName !== null) result.channelName = item.channelName;
        if (item.durationSeconds !== null) result.durationSeconds = item.durationSeconds;
        if (item.thumbnailUrl !== null) result.thumbnailUrl = item.thumbnailUrl;
        result.addedAt = item.addedAt;
        if (item.removedAt > 0) result.removedAt = item.removedAt;
        return result;
    }
    function playlistJson(playlist) {
        const result = { profileId: playlist.profileId, surface: playlist.surface, id: playlist.id };
        if (playlist.system !== null) result.system = playlist.system;
        result.name = playlist.name;
        result.nameUpdatedAt = playlist.nameUpdatedAt;
        result.createdAt = playlist.createdAt;
        result.orderUpdatedAt = playlist.orderUpdatedAt;
        if (playlist.deletedAt > 0) result.deletedAt = playlist.deletedAt;
        result.items = playlist.items.map(itemJson);
        return result;
    }
    // Android compares org.json output, which escapes every "/" as "\/".
    function tieString(item) { return JSON.stringify(itemJson(item)).replace(/\//g, '\\/'); }

    function canonicalOrder(playlists) {
        return playlists.slice().sort((a, b) => compare(a.profileId, b.profileId)
            || SURFACES.indexOf(a.surface) - SURFACES.indexOf(b.surface)
            || (isWatchLater(a) ? 0 : 1) - (isWatchLater(b) ? 0 : 1)
            || a.createdAt - b.createdAt || compare(a.id, b.id));
    }
    function validateList(playlists, allowedProfileIds) {
        const ids = playlists.map(p => JSON.stringify([p.profileId, p.surface, p.id]));
        requireValue(new Set(ids).size === ids.length, 'duplicate playlist');
        requireValue(!allowedProfileIds || playlists.every(p => allowedProfileIds.includes(p.profileId)), 'playlist profile outside the authorized scope');
        const perScope = new Map();
        for (const p of playlists) {
            const scope = JSON.stringify([p.profileId, p.surface]);
            perScope.set(scope, (perScope.get(scope) || 0) + 1);
        }
        requireValue([...perScope.values()].every(count => count <= LIMITS.MAX_PLAYLISTS_PER_SCOPE + 1), 'too many playlists');
    }

    function decode(raw, allowedProfileIds = null) {
        // Objects are re-read as JSON so getters, other realms and prototypes never reach the model.
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw === undefined ? null : raw);
        requireValue(typeof text === 'string' && text.length <= LIMITS.MAX_BYTES && unicode(text) && byteLength(text) <= LIMITS.MAX_BYTES, 'size limit');
        const value = JSON.parse(text);
        fields(value, ROOT_FIELDS, 'envelope');
        requireValue(value.format === FORMAT, 'not a FilterTube playlists file');
        requireValue(value.version === VERSION, 'unsupported playlists version');
        requireValue(Array.isArray(value.playlists), 'missing playlists');
        const playlists = value.playlists.map(decodePlaylist);
        validateList(playlists, allowedProfileIds);
        return canonicalOrder(playlists);
    }
    function envelope(playlists) {
        return { format: FORMAT, version: VERSION, playlists: canonicalOrder(playlists).map(playlistJson) };
    }
    function encode(playlists, allowedProfileIds = null) {
        playlists.forEach(p => { checkPlaylist(p); p.items.forEach(checkItem); });
        validateList(playlists, allowedProfileIds);
        const raw = JSON.stringify(envelope(playlists));
        requireValue(byteLength(raw) <= LIMITS.MAX_BYTES, 'size limit');
        return raw;
    }

    function mergeItem(a, b) {
        // Metadata comes from the newest add; a full canonical tie-break keeps it commutative.
        const newer = a.addedAt !== b.addedAt ? (a.addedAt > b.addedAt ? a : b)
            : (tieString(a) >= tieString(b) ? a : b);
        return { ...newer, addedAt: Math.max(a.addedAt, b.addedAt), removedAt: Math.max(a.removedAt, b.removedAt) };
    }
    function orderSignature(playlist) { return entries(playlist).map(itemKey).join('\n'); }
    /** Deterministic join of two replicas of one list. */
    function merge(a, b) {
        requireValue(a.profileId === b.profileId && a.surface === b.surface && a.id === b.id, 'different playlists');
        if (JSON.stringify(playlistJson(a)) === JSON.stringify(playlistJson(b))) return a;
        const nameWinner = (a.nameUpdatedAt - b.nameUpdatedAt || compare(a.name, b.name)) >= 0 ? a : b;
        const orderWinner = (a.orderUpdatedAt - b.orderUpdatedAt || compare(orderSignature(a), orderSignature(b))) >= 0 ? a : b;
        const byKey = new Map();
        for (const item of a.items.concat(b.items)) {
            const key = itemKey(item);
            byKey.set(key, byKey.has(key) ? mergeItem(byKey.get(key), item) : item);
        }
        // The newest explicit reorder ranks the items it knew about; anything added after it
        // (or unknown to it) follows in the order it was added.
        const orderTime = orderWinner.orderUpdatedAt;
        const rank = new Map(entries(orderWinner).map((item, index) => [itemKey(item), index]));
        const ranked = item => rank.has(itemKey(item)) && item.addedAt <= orderTime ? rank.get(itemKey(item)) : null;
        const values = [...byKey.values()];
        const present = values.filter(isPresent).sort((x, y) => {
            const rx = ranked(x), ry = ranked(y);
            return (rx === null ? 1 : 0) - (ry === null ? 1 : 0) || (rx ?? 0) - (ry ?? 0)
                || x.addedAt - y.addedAt || compare(itemKey(x), itemKey(y));
        });
        const tombstones = values.filter(item => !isPresent(item)).sort((x, y) => compare(itemKey(x), itemKey(y)));
        const all = present.concat(tombstones);
        const items = all.length <= LIMITS.MAX_ENTRIES ? all
            : present.slice(0, LIMITS.MAX_ENTRIES).concat(tombstones.slice().sort((x, y) => y.removedAt - x.removedAt)
                .slice(0, Math.max(0, LIMITS.MAX_ENTRIES - present.length)));
        return checkPlaylist({
            profileId: a.profileId, surface: a.surface, id: a.id, system: a.system ?? b.system,
            name: nameWinner.name, nameUpdatedAt: nameWinner.nameUpdatedAt,
            createdAt: Math.min(a.createdAt, b.createdAt), orderUpdatedAt: Math.max(a.orderUpdatedAt, b.orderUpdatedAt),
            deletedAt: Math.max(a.deletedAt, b.deletedAt), items
        });
    }
    /** Joins two full replicas. A list missing from either side is never a deletion. */
    function mergeAll(existing, incoming) {
        const combined = new Map();
        for (const playlist of existing.concat(incoming)) {
            const key = JSON.stringify([playlist.profileId, playlist.surface, playlist.id]);
            combined.set(key, combined.has(key) ? merge(combined.get(key), playlist) : playlist);
        }
        return canonicalOrder([...combined.values()]);
    }
    /** Re-homes lists onto local profiles. Unmapped profiles are dropped, never guessed. */
    function mapProfiles(playlists, mapping) {
        const mapped = [];
        for (const playlist of playlists) {
            if (!own(mapping, playlist.profileId)) continue;
            mapped.push({ ...playlist, profileId: mapping[playlist.profileId] });
        }
        return mergeAll([], mapped);
    }

    return Object.freeze({ FORMAT, VERSION, WATCH_LATER_ID, SYSTEM_WATCH_LATER, LIMITS,
        decode, encode, envelope, merge, mergeAll, mapProfiles, canonicalOrder,
        itemKey, isPresent, isDeleted, isWatchLater, entries });
}));
