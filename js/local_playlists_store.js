/* FilterTube local playlists storage. Only the background adapter may authorize a profile. */
(function (root, factory) {
    const contract = typeof module === 'object' && module.exports
        ? require('./shared/local_playlists.js') : root.FilterTubeLocalPlaylists;
    const api = factory(contract);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeLocalPlaylistsStore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (contract) {
    'use strict';
    const DATA_KEY = 'ftLocalPlaylistsV1';
    function unpack(raw) {
        if (raw === undefined) return [];
        if (typeof raw !== 'string') throw Error('playlists_storage_invalid');
        return contract.decode(raw);
    }
    function create({ get, set, authorizeSync = async () => false }) {
        let queue = Promise.resolve();
        const serial = work => { const result = queue.then(work); queue = result.catch(() => {}); return result; };
        async function allowed(profileId, scope) {
            if (typeof profileId !== 'string' || !profileId.trim() || profileId.length > 1024) throw Error('access_changed');
            if (await authorizeSync(profileId, scope) !== true) throw Error('access_changed');
        }
        function envelopeFor(playlists, profileId) {
            return JSON.parse(contract.encode(playlists.filter(p => p.profileId === profileId), [profileId]));
        }
        function syncRead(profileId, scope) {
            return serial(async () => {
                await allowed(profileId, scope);
                const data = await get([DATA_KEY]);
                await allowed(profileId, scope);
                const result = envelopeFor(unpack(data[DATA_KEY]), profileId);
                await allowed(profileId, scope);
                return result;
            });
        }
        function syncMerge(profileId, envelope, scope) {
            return serial(async () => {
                await allowed(profileId, scope);
                // The caller maps the peer's lists onto this exact local profile first.
                const incoming = contract.decode(JSON.stringify(envelope), [profileId]);
                const data = await get([DATA_KEY]);
                await allowed(profileId, scope);
                const merged = contract.mergeAll(unpack(data[DATA_KEY]), incoming);
                const encoded = contract.encode(merged);
                await allowed(profileId, scope);
                if (encoded !== data[DATA_KEY] && (incoming.length > 0 || data[DATA_KEY] !== undefined)) {
                    await set({ [DATA_KEY]: encoded });
                    await allowed(profileId, scope);
                    if ((await get([DATA_KEY]))[DATA_KEY] !== encoded) throw Error('playlists_storage_not_verified');
                }
                const result = envelopeFor(merged, profileId);
                await allowed(profileId, scope);
                return result;
            });
        }
        return Object.freeze({ syncRead, syncMerge });
    }
    return Object.freeze({ DATA_KEY, create });
}));
