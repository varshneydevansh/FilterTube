/* Disposable browser transport fixture; no extension APIs or user data are used. */
(function () {
    'use strict';
    const modules = { queueAPI: FilterTubeAutoSyncQueue, controllerAPI: FilterTubeDeviceAutoSync,
        protocol: FilterTubePersonalSync, notesAPI: FilterTubeVideoNotesStore,
        managedAPI: FilterTubeManagedAutoSync, runtimeAPI: FilterTubePersonalAutoSyncRuntime };
    const status = document.getElementById('status'), reportNode = document.getElementById('report');
    const checksNode = document.getElementById('checks'), button = document.getElementById('run');
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const require = (value, message) => { if (!value) throw Error(message); };
    let harness, peers = [], channels = {}, receiverTail = Promise.resolve(), errors = [], wire = [], report;
    function check(name) {
        const item = document.createElement('li'); item.textContent = 'PASS — ' + name; checksNode.append(item);
        report.checks.push(name); reportNode.textContent = JSON.stringify(report, null, 2);
    }
    async function until(predicate, label, milliseconds = 10000) {
        const deadline = performance.now() + milliseconds;
        while (performance.now() < deadline) {
            if (errors.length) throw errors[0];
            if (await predicate()) return;
            await delay(30);
        }
        throw Error('Timed out: ' + label);
    }
    function closeTransport() {
        for (const channel of Object.values(channels)) channel.close();
        for (const peer of peers) peer.close();
        peers = []; channels = {};
    }
    async function connect() {
        closeTransport();
        const a = new RTCPeerConnection({ iceServers: [] }), b = new RTCPeerConnection({ iceServers: [] });
        peers = [a, b];
        const pendingA = [], pendingB = [];
        const candidate = (target, pending, value) => {
            if (!value) return;
            if (!target.remoteDescription) pending.push(value);
            else target.addIceCandidate(value).catch(error => errors.push(error));
        };
        a.onicecandidate = event => candidate(b, pendingB, event.candidate);
        b.onicecandidate = event => candidate(a, pendingA, event.candidate);
        const receive = (channel, from) => {
            channel.onmessage = event => {
                receiverTail = receiverTail.then(() => harness.deliver(from, JSON.parse(event.data)))
                    .catch(error => { errors.push(error); });
            };
        };
        channels.A = a.createDataChannel('filtertube-isolated-sync'); receive(channels.A, 'B');
        b.ondatachannel = event => { channels.B = event.channel; receive(event.channel, 'A'); };
        await a.setLocalDescription(await a.createOffer());
        await b.setRemoteDescription(a.localDescription);
        for (const item of pendingB.splice(0)) await b.addIceCandidate(item);
        await b.setLocalDescription(await b.createAnswer());
        await a.setRemoteDescription(b.localDescription);
        for (const item of pendingA.splice(0)) await a.addIceCandidate(item);
        await until(() => channels.A?.readyState === 'open' && channels.B?.readyState === 'open', 'WebRTC channel opens');
        harness.setTransport(({ from, message }) => {
            const encoded = JSON.stringify(message);
            wire.push(encoded); channels[from].send(encoded);
            report.messages++; report.bytes += new TextEncoder().encode(encoded).length;
        });
        report.connections++;
    }
    async function drive(predicate, label) {
        for (let attempt = 0; attempt < 25; attempt++) {
            if (errors.length) throw errors[0];
            await harness.cycle({ rounds: 1, parallel: true });
            await delay(80); await receiverTail;
            if (await predicate()) return;
        }
        throw Error('Did not converge: ' + label);
    }
    const noteText = async endpoint => (await endpoint.readNote())?.versions.map(version => version.text);
    const isApplied = async endpoint => (await endpoint.queue.read()).enrollments.some(row => row.channels.some(channel => channel.status === 'applied'));
    button.addEventListener('click', async () => {
        button.disabled = true; checksNode.replaceChildren(); errors = []; wire = []; receiverTail = Promise.resolve();
        report = { date: '2026-10-24', evidence: 'same-browser synthetic endpoints over real WebRTC; not installed-device proof',
            checks: [], connections: 0, messages: 0, bytes: 0, result: 'running' };
        const prefix = 'filtertube-isolated-sync:' + crypto.randomUUID() + ':';
        try {
            status.textContent = 'Running encrypted transport and offline-recovery checks…';
            harness = await FilterTubeTwoEndpointHarness.create({ modules, crypto,
                storageFactory: name => ({
                    get: async keys => {
                        const data = JSON.parse(localStorage.getItem(prefix + name) || '{}');
                        return Object.fromEntries(keys.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
                    },
                    set: async values => localStorage.setItem(prefix + name,
                        JSON.stringify({ ...JSON.parse(localStorage.getItem(prefix + name) || '{}'), ...values }))
                }) });
            const beforeA = await harness.a.readRoot(), beforeB = await harness.b.readRoot();
            await connect(); check('Real WebRTC data channel connected without an external STUN/TURN server');
            await harness.enroll();
            await until(async () => (await harness.a.grants()).length === 1 && (await harness.b.grants()).length === 1, 'reciprocal profile consent');
            require(harness.a.confirmations.length === 1 && harness.b.confirmations.length === 1, 'Both consents must be requested');
            check('Both synthetic endpoints explicitly approved their exact profile and data areas');
            await harness.a.editProfile(profile => {
                profile.settings.hideShorts = true;
                profile.main.channels = [{ id: 'UC-browser-fixture', name: 'Synthetic channel' }];
                profile.main.keywords = [{ word: 'synthetic spoiler', exact: true }];
            });
            await harness.a.saveNote('Unicode note: हिन्दी 🎵\n1:30');
            await drive(async () => (await harness.b.profile()).settings.hideShorts === true
                && (await harness.b.profile()).main.keywords[0]?.word === 'synthetic spoiler'
                && (await noteText(harness.b))?.[0] === 'Unicode note: हिन्दी 🎵\n1:30'
                && await isApplied(harness.a), 'settings rules and notes');
            check('Settings, channel/keyword rules and Unicode notes persisted with a signed Applied receipt');
            await harness.b.saveNote('Edited on the second endpoint');
            await drive(async () => (await noteText(harness.a))?.[0] === 'Edited on the second endpoint', 'reverse Notes edit');
            check('A note edited on endpoint B returned to endpoint A');
            harness.disconnect(); closeTransport(); await receiverTail;
            await harness.a.editProfile(profile => { profile.settings.hideComments = true; profile.main.channels = [{ id: 'UC-offline-old' }]; });
            await harness.a.saveNote('Superseded offline note'); await harness.cycle();
            await harness.a.editProfile(profile => { profile.main.channels = [{ id: 'UC-offline-latest' }]; profile.main.keywords = []; });
            await harness.a.saveNote('Latest offline note'); await harness.cycle();
            require((await harness.b.profile()).settings.hideComments === false, 'Offline endpoint must not falsely receive settings');
            const pending = (await harness.a.queue.read()).enrollments.flatMap(row => row.channels);
            require(pending.some(channel => channel.status === 'waiting'), 'Offline work must be queued');
            await harness.a.restart(); await harness.b.restart();
            require(JSON.stringify((await harness.a.queue.read()).enrollments.flatMap(row => row.channels)) === JSON.stringify(pending), 'Persistent queue changed on reconstruction');
            check('Offline changes stayed queued through reconstruction from browser local storage');
            const resumedAt = wire.length;
            await connect(); harness.reconnect(); harness.advance();
            await drive(async () => (await harness.b.profile()).settings.hideComments === true
                && (await harness.b.profile()).main.channels[0]?.id === 'UC-offline-latest'
                && (await harness.b.profile()).main.keywords.length === 0
                && (await noteText(harness.b))?.[0] === 'Latest offline note'
                && await isApplied(harness.a), 'offline reconnect');
            require(!wire.slice(resumedAt).some(message => message.includes('Superseded offline note')), 'An obsolete offline snapshot was sent');
            check('A new WebRTC connection delivered only the latest offline settings, removals and note');
            await harness.a.saveNote(null);
            await drive(async () => (await noteText(harness.b))?.[0] === null, 'Notes deletion');
            check('Notes deletion propagated as a causal tombstone');
            const afterA = await harness.a.readRoot(), afterB = await harness.b.readRoot();
            require(JSON.stringify(beforeA.profiles['child-A']) === JSON.stringify(afterA.profiles['child-A'])
                && JSON.stringify(beforeB.profiles['child-B']) === JSON.stringify(afterB.profiles['child-B']), 'A child profile was changed by personal sync');
            require(afterA.profiles['profile-A'].security.pinVerifier === 'private-pin-A'
                && afterB.profiles['profile-B'].security.pinVerifier === 'private-pin-B', 'Local account security changed');
            require(!wire.some(message => ['"d":', 'private-pin-', 'child-pin-', 'local-token-'].some(secret => message.includes(secret))), 'Private authority data entered the transport');
            check('Child profiles and local security were unchanged; no signing secrets, PINs or private tokens were sent');
            report.result = 'pass'; status.textContent = 'All isolated WebRTC checks passed. Installed two-device testing is still separate.';
        } catch (error) {
            report.result = 'fail'; report.failure = String(error.message || error);
            status.textContent = 'FAILED: ' + report.failure;
        } finally {
            harness?.dispose(); closeTransport();
            localStorage.removeItem(prefix + 'A'); localStorage.removeItem(prefix + 'B');
            reportNode.textContent = JSON.stringify(report, null, 2); button.disabled = false;
        }
    });
})();
