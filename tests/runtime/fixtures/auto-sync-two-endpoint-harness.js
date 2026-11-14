/* Synthetic two-device fixture. Production modules own signing, queues, merging and receipts.
 * Storage and transport are injectable so the same fixture can run in Node or a browser.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FilterTubeTwoEndpointHarness = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    function memoryStorage() {
        let serialized = '{}';
        return {
            get: async keys => {
                const data = JSON.parse(serialized), result = {};
                for (const key of keys) if (Object.hasOwn(data, key)) result[key] = clone(data[key]);
                return result;
            },
            set: async values => { serialized = JSON.stringify({ ...JSON.parse(serialized), ...clone(values) }); },
            snapshot: () => serialized
        };
    }
    async function create({ modules, crypto, storageFactory = memoryStorage, transport = null } = {}) {
        const { queueAPI, controllerAPI, protocol, notesAPI, managedAPI, runtimeAPI } = modules;
        let clock = 10000, deliverTransport = transport;
        const endpoints = {};
        for (const name of ['A', 'B']) {
            const other = name === 'A' ? 'B' : 'A';
            const state = { name, deviceId: `device-${name}`, profileId: `profile-${name}`,
                storage: await storageFactory(name), unlocked: true, confirm: true,
                sent: [], confirmations: [], applies: [],
                session: { client: {}, ready: true, role: 'peer', remoteRole: 'peer', autoSyncVersion: 1,
                    remoteDeviceId: `device-${other}`, remoteProfileId: `profile-${other}`, remoteProfileType: 'account' } };
            let tail = Promise.resolve(), receiveTail = Promise.resolve();
            state.withLock = work => { const result = tail.then(work); tail = result.catch(() => {}); return result; };
            state.withReceiveLock = (_grantId, work) => {
                const result = receiveTail.then(work); receiveTail = result.catch(() => {}); return result;
            };
            const get = keys => state.storage.get(keys), set = values => state.storage.set(values);
            const initial = await get(['ftProfilesV4']);
            if (!initial.ftProfilesV4) await set({
                ftProfilesV4: { schemaVersion: 4, activeProfileId: state.profileId, profiles: {
                    [state.profileId]: { name: `My ${name} profile`, type: 'account', parentProfileId: null,
                        security: { pinVerifier: `private-pin-${name}` }, privateToken: `local-token-${name}`,
                        settings: { enabled: true, hideShorts: false, hideComments: false, disableAutoplay: false,
                            contentOnlyPlayback: true, alwaysUseOriginalAudio: true,
                            contentFilters: { views: { enabled: false, minViews: 0 }, duration: { enabled: false, minMinutes: 0 } } },
                        main: { mode: 'blocklist', channels: [], keywords: [], videoIds: [] },
                        kids: { mode: 'blocklist', strictMode: false, blockedChannels: [], blockedKeywords: [], videoIds: [] } },
                    [`child-${name}`]: { name: `Child ${name}`, type: 'child', parentProfileId: state.profileId,
                        security: { pinVerifier: `child-pin-${name}` }, settings: { hideShorts: true }, main: {}, kids: {} }
                } },
                ftNanahDeviceId: state.deviceId,
                ftNanahTrustedLinks: [{ linkId: `peer-${name}-${other}`, createdAt: '2026-10-24T00:00:00.000Z',
                    linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer', remoteDeviceId: `device-${other}`, deviceLabel: `Device ${other}` }]
            });
            state.readRoot = async () => (await get(['ftProfilesV4'])).ftProfilesV4;
            state.profile = async () => (await state.readRoot()).profiles[state.profileId];
            state.editProfile = fn => state.withLock(async () => {
                const root = await state.readRoot(); await fn(root.profiles[state.profileId], root);
                await set({ ftProfilesV4: root });
            });
            state.grants = async () => (await get([controllerAPI.KEY]))[controllerAPI.KEY]?.personal || [];
            const authorizeSync = async (profileId, scope) => {
                const stored = await get(['ftProfilesV4', controllerAPI.KEY, 'ftNanahDeviceId', 'ftNanahTrustedLinks']);
                const row = stored[controllerAPI.KEY]?.personal?.find(value => value.grant?.localGrantId === scope?.grantId);
                try {
                    const grant = protocol.normalizeGrant(row?.grant);
                    return state.unlocked && row.confirmed === true && row.invalidated !== true && grant.enabled
                        && grant.localDeviceId === stored.ftNanahDeviceId && grant.localProfileId === profileId
                        && grant.areas.includes('notes')
                        && row.peerBinding === protocol.peerBinding(stored.ftNanahTrustedLinks, grant.remoteDeviceId)
                        && row.securityFingerprint === controllerAPI.security(stored.ftProfilesV4, profileId);
                } catch (_) { return false; }
            };
            state.restart = async () => {
                state.controller?.dispose();
                state.queue = queueAPI.create({ get, set, withLock: state.withLock, now: () => clock, retryMs: 100 });
                state.notes = notesAPI.create({ get, set, randomId: () => `writer-${name.toLowerCase()}`,
                    authorize: async (key, scope) => {
                        const root = await state.readRoot();
                        return state.unlocked && scope === 'editor' && key.profileId === state.profileId && root.activeProfileId === state.profileId;
                    }, authorizeSync });
                state.controller = controllerAPI.create({ get, set, withLock: state.withLock, queue: state.queue,
                    withReceiveLock: state.withReceiveLock,
                    managed: managedAPI, personal: protocol, personalRuntime: runtimeAPI, crypto,
                    context: async () => {
                        const stored = await get(['ftProfilesV4', 'ftNanahTrustedLinks']);
                        return { profilesV4: stored.ftProfilesV4, links: stored.ftNanahTrustedLinks,
                            deviceId: state.deviceId, unlocked: state.unlocked };
                    }, session: () => ({ ...state.session }),
                    confirmPersonal: async proposal => {
                        state.confirmations.push(clone(proposal)); await state.confirmHook?.(proposal); return state.confirm;
                    },
                    sendPersonal: async (message, captured) => {
                        const peer = endpoints[other];
                        if (!state.session.ready || !peer.session.ready || captured.client !== state.session.client) throw Error('Device offline');
                        const wire = clone(message); state.sent.push(wire);
                        const item = { from: name, to: other, message: clone(wire), deliver: () => deliver(name, wire) };
                        if (deliverTransport) return deliverTransport(item);
                        return item.deliver();
                    },
                    notesRead: (profileId, grantId) => state.notes.syncRead(profileId, { grantId }),
                    notesMerge: (profileId, envelope, grantId) => state.notes.syncMerge(profileId, envelope, { grantId }),
                    applySettings: async (profileId, snapshot, beforeCheck, expectedLocalSnapshot) => {
                        await state.applyHook?.();
                        return state.withLock(async () => {
                            if (!await beforeCheck()) throw Error('Profile sync access changed');
                            const root = await state.readRoot(); controllerAPI.security(root, profileId);
                            const observed = protocol.snapshotSettings(root.profiles[profileId]);
                            if (!expectedLocalSnapshot || JSON.stringify(observed) !== JSON.stringify(expectedLocalSnapshot)) throw Error('Settings changed locally');
                            if (!await beforeCheck()) throw Error('Profile sync access changed');
                            root.profiles[profileId] = protocol.applySettings(root.profiles[profileId], snapshot);
                            await set({ ftProfilesV4: root }); state.applies.push(clone(snapshot));
                        });
                    },
                    applyStudy: async (profileId, remoteStudy, beforeCheck, grant) => state.withLock(async () => {
                        if (!await beforeCheck()) throw Error('Profile sync access changed');
                        const root = await state.readRoot();
                        root.profiles[profileId] = protocol.applyStudy(root.profiles[profileId], remoteStudy, grant);
                        await set({ ftProfilesV4: root });
                    })
                });
            };
            state.readNote = (videoId = 'abcdefghijk') => state.notes.read({ profileId: state.profileId, videoId }, 'editor');
            state.saveNote = async (text, videoId = 'abcdefghijk') => state.notes.save({ profileId: state.profileId, videoId }, await state.readNote(videoId), text, 'editor');
            endpoints[name] = state;
        }
        async function deliver(from, message) {
            const target = endpoints[from === 'A' ? 'B' : 'A'];
            if (!target.session.ready) throw Error('Receiving device offline');
            try { return await target.controller.receive(clone(message)); }
            finally { target.controller.dispose(); } // Tests explicitly drive cycles; do not leave debounce timers running.
        }
        await endpoints.A.restart(); await endpoints.B.restart();
        return {
            a: endpoints.A, b: endpoints.B, deliver,
            setTransport: fn => { deliverTransport = fn; },
            enroll: (selection = { settings: true, notes: true }) => endpoints.A.controller.requestPersonal(selection),
            disconnect: () => { for (const state of Object.values(endpoints)) state.session.ready = false; },
            reconnect: () => { for (const state of Object.values(endpoints)) { state.session.client = {}; state.session.ready = true; } },
            advance: (milliseconds = 1000000) => { clock += milliseconds; },
            cycle: async ({ rounds = 1, parallel = false } = {}) => {
                for (let count = 0; count < rounds; count++) {
                    const run = async state => { await state.controller.run({ wake: true }); state.controller.dispose(); };
                    if (parallel) await Promise.all([run(endpoints.A), run(endpoints.B)]);
                    else { await run(endpoints.A); await run(endpoints.B); }
                }
            },
            dispose: () => { endpoints.A.controller.dispose(); endpoints.B.controller.dispose(); }
        };
    }
    return Object.freeze({ create, memoryStorage });
});
