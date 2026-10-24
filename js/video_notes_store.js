/* Private saved notes. Only the background adapter may authorize an exact key. */
(function (root, factory) {
    const contract = typeof module === 'object' && module.exports
        ? require('./shared/saved_video_notes.js') : root.FilterTubeSavedVideoNotes;
    const api = factory(contract);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeVideoNotesStore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (contract) {
    'use strict';
    const DATA_KEY = 'ftSavedVideoNotesV1';
    const WRITER_KEY = 'ftSavedVideoNotesWriterV1';
    const blank = /^[\u0009-\u000d\u001c-\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]*$/;
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function create({ get, set, randomId, authorize, authorizeSync = async () => false }) {
        let queue = Promise.resolve();
        const serial = work => { const result = queue.then(work); queue = result.catch(() => {}); return result; };
        async function allowed(key, scope) {
            contract.edit(key, null, 'validation', null);
            if (await authorize(key, scope) !== true) throw Error('access_changed');
        }
        function unpack(raw) {
            if (raw === undefined) return [];
            // Private storage validation is separate from permission to read a key.
            // This is not an external import API or profile-mapping authority.
            if (typeof raw !== 'string' || raw.length > 16777216) throw Error('notes_storage_invalid');
            const value = JSON.parse(raw);
            const ids = Array.isArray(value?.entries) ? value.entries.map(row => row?.profileId) : [];
            return contract.decode(raw, ids);
        }
        function find(rows, key) { return rows.find(row => row.profileId === key.profileId && row.videoId === key.videoId) || null; }
        function read(key, scope) {
            return serial(async () => {
                await allowed(key, scope);
                const rows = unpack((await get([DATA_KEY]))[DATA_KEY]);
                await allowed(key, scope);
                return find(rows, key);
            });
        }
        function save(key, base, text, scope) {
            return serial(async () => {
                await allowed(key, scope);
                if (typeof text !== 'string' && text !== null) throw Error('text_invalid');
                const normalized = text === null || blank.test(text) ? null : text.replace(/[\s\u001c-\u001f]+$/u, '');
                if (base !== null) base = contract.record(base);
                if (base && (base.profileId !== key.profileId || base.videoId !== key.videoId)) throw Error('wrong_note_key');
                // Validate Unicode and text size even when a concurrent save exists.
                contract.edit(key, base, 'validation', normalized);
                const data = await get([DATA_KEY, WRITER_KEY]);
                const rows = unpack(data[DATA_KEY]);
                const current = find(rows, key);
                if (!equal(base, current)) { await allowed(key, scope); return { saved: false, conflict: true, record: current }; }
                if ((!current && normalized === null) || (current?.versions.length === 1 && current.versions[0].text === normalized)) {
                    await allowed(key, scope); return { saved: true, record: current };
                }
                let actor = data[WRITER_KEY];
                if (actor === undefined) {
                    actor = randomId();
                    contract.edit(key, null, actor, null);
                    await allowed(key, scope);
                    // Writer identity stays outside note envelopes and exports.
                    await set({ [WRITER_KEY]: actor });
                } else contract.edit(key, null, actor, null);
                const next = contract.edit(key, current, actor, normalized);
                const updated = rows.filter(row => row !== current).concat(next);
                const encoded = contract.encode(updated, updated.map(row => row.profileId));
                await allowed(key, scope);
                await set({ [DATA_KEY]: encoded });
                if ((await get([DATA_KEY]))[DATA_KEY] !== encoded) throw Error('notes_storage_not_verified');
                // Never return personal text to a now-revoked caller.
                await allowed(key, scope);
                return { saved: true, record: next };
            });
        }
        async function syncAllowed(profileId, scope) {
            // Validate an exact profile key independently of its authorization.
            contract.edit({ profileId, videoId: '___________' }, null, 'validation', null);
            if (await authorizeSync(profileId, scope) !== true) throw Error('access_changed');
        }
        function syncEnvelope(rows, profileId) {
            return JSON.parse(contract.encode(rows.filter(row => row.profileId === profileId), [profileId]));
        }
        function syncRead(profileId, scope) {
            return serial(async () => {
                await syncAllowed(profileId, scope);
                const data = await get([DATA_KEY]);
                await syncAllowed(profileId, scope);
                const result = syncEnvelope(unpack(data[DATA_KEY]), profileId);
                await syncAllowed(profileId, scope);
                return result;
            });
        }
        function syncMerge(profileId, envelope, scope) {
            return serial(async () => {
                await syncAllowed(profileId, scope);
                // Transport/profile mapping is the caller's responsibility. No
                // peer may name a second local target inside this envelope.
                const incoming = contract.decode(JSON.stringify(envelope), [profileId]);
                const data = await get([DATA_KEY]);
                await syncAllowed(profileId, scope);
                const rows = unpack(data[DATA_KEY]);
                const merged = new Map(rows.filter(row => row.profileId === profileId).map(row => [row.videoId, row]));
                for (const row of incoming) merged.set(row.videoId,
                    merged.has(row.videoId) ? contract.merge(merged.get(row.videoId), row) : row);
                const updated = rows.filter(row => row.profileId !== profileId).concat(Array.from(merged.values()));
                const encoded = contract.encode(updated, updated.map(row => row.profileId));
                await syncAllowed(profileId, scope);
                if (encoded !== data[DATA_KEY] && (incoming.length > 0 || data[DATA_KEY] !== undefined)) {
                    await set({ [DATA_KEY]: encoded });
                    await syncAllowed(profileId, scope);
                    const verified = await get([DATA_KEY]);
                    await syncAllowed(profileId, scope);
                    if (verified[DATA_KEY] !== encoded) throw Error('notes_storage_not_verified');
                }
                const result = syncEnvelope(updated, profileId);
                await syncAllowed(profileId, scope);
                return result;
            });
        }
        return Object.freeze({ read, save, syncRead, syncMerge });
    }
    return Object.freeze({ DATA_KEY, WRITER_KEY, create });
}));
