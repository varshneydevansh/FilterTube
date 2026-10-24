/* Own-profile enrollment and direct-session delivery. No backup import or remote profile authority. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubePersonalAutoSyncRuntime = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    const OFFER = 'filtertube.personal-sync-offer', ACCEPT = 'filtertube.personal-sync-accept';
    const ACK = 'filtertube.personal-sync-ack';
    const empty = () => ({ settings: {}, main: {}, kids: {} });
    const copy = value => JSON.parse(JSON.stringify(value));
    const fail = message => { throw Error(message); };
    const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function create(deps) {
        const protocol = deps.protocol || root.FilterTubePersonalSync, crypto = deps.crypto || root.crypto;
        const codec = protocol.create({ crypto }), pending = new Map(), initiating = new Map(), receiving = new Set();
        const uuid = deps.randomId || (() => crypto.randomUUID());
        const now = deps.now || Date.now;
        const changed = () => deps.changed?.();
        const queueId = id => 'personal:' + id;
        const rows = () => deps.read();
        const rowFor = async id => (await rows()).find(row => row.grant?.localGrantId === id);
        const grantOf = row => protocol.normalizeGrant(row.grant);
        const peerBinding = (context, remoteId) => protocol.peerBinding(context.links || [], remoteId);
        const tuple = (deviceId, profileId) => JSON.stringify([deviceId, profileId]);
        const friendly = (value, fallback) => typeof value === 'string' && value.trim() ? value.slice(0, 160) : fallback;
        const profileLabel = (context, id) => friendly(context.profilesV4?.profiles?.[id]?.name, id);
        const peerLabel = (session, id) => friendly(session.remoteProfileName, id);
        const connectionLabel = (session, id) => peerLabel(session, id)
            + (session.remoteDeviceLabel ? ' · ' + friendly(session.remoteDeviceLabel, '') : '');
        const pair = (context, deviceId, profileId) => JSON.stringify([context.deviceId, context.profileId, deviceId, profileId]);
        const pendingFor = (context, deviceId, profileId) => [...pending].filter(([, value]) =>
            value.offer.sourceDeviceId === context.deviceId && value.offer.sourceProfileId === context.profileId
            && value.offer.targetDeviceId === deviceId && value.offer.targetProfileId === profileId);
        function savedPeer(context, remoteId) {
            return (context.links || []).filter(link => link.linkType === 'peer_link' && link.remoteDeviceId === remoteId
                && link.localRole === 'peer' && link.remoteRole === 'peer'
                && !['revoked', 'keyRevoked', 'stalePairing', 'quarantined'].some(key => link[key] === true || link.policy?.[key] === true)).length === 1;
        }
        function live(session, grant) {
            return session?.ready === true && session.role === 'peer' && session.remoteRole === 'peer'
                && session.autoSyncVersion === 1 && session.remoteProfileType === 'account'
                && (!grant || session.remoteDeviceId === grant.remoteDeviceId && session.remoteProfileId === grant.remoteProfileId);
        }
        function sameSession(a, b) {
            return live(b) && a.client === b.client && a.remoteDeviceId === b.remoteDeviceId
                && a.remoteProfileId === b.remoteProfileId;
        }
        async function accountContext(session = null, expected = null) {
            const context = await deps.context(), id = context.profilesV4?.activeProfileId;
            const profile = context.profilesV4?.profiles?.[id];
            if (!context.unlocked || !profile || profile.parentProfileId
                || (id !== 'default' && profile.type !== 'account')) fail('Open and unlock your own account profile to sync.');
            const security = deps.security(context.profilesV4, id);
            if (session && (!sameSession(session, deps.session()) || !savedPeer(context, session.remoteDeviceId))) fail('The verified device connection changed.');
            if (expected && (context.deviceId !== expected.deviceId || id !== expected.profileId || security !== expected.security)) fail('The profile or its access changed.');
            return { ...context, profileId: id, profile, security };
        }
        async function authorized(row) {
            try {
                const grant = grantOf(row), context = await deps.context();
                return grant.enabled && typeof row.peerBinding === 'string'
                    && peerBinding(context, grant.remoteDeviceId) === row.peerBinding && await deps.authorize(row) === true;
            } catch (_) { return false; }
        }
        async function current(row) {
            const latest = await rowFor(row.grant.localGrantId);
            return latest && exact(latest.grant, row.grant) && latest.securityFingerprint === row.securityFingerprint
                && await authorized(latest) ? latest : null;
        }
        async function update(row, fn) {
            if (!await current(row)) fail('Auto-sync permission changed.');
            await deps.mutate(values => {
                const index = values.findIndex(value => value.grant?.localGrantId === row.grant.localGrantId);
                if (index < 0 || !exact(values[index].grant, row.grant)
                    || values[index].securityFingerprint !== row.securityFingerprint) fail('Auto-sync permission changed.');
                return values.map((value, i) => i === index ? fn(value) : value);
            }); changed();
        }
        function fields(value, names) {
            if (!value || typeof value !== 'object' || Array.isArray(value)
                || Object.keys(value).some(key => !names.includes(key)) || names.some(key => !Object.hasOwn(value, key))) fail('Invalid Auto-sync message.');
        }
        function areas(value) {
            const list = Array.isArray(value) ? value : Object.keys(value || {}).filter(key => value[key] === true);
            if (!list.length || list.length > 2 || new Set(list).size !== list.length
                || list.some(area => !['settings', 'notes'].includes(area))) fail('Choose settings, notes, or both.');
            return list.slice().sort();
        }
        async function keys() {
            const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
            return { publicKeyJwk: await crypto.subtle.exportKey('jwk', pair.publicKey),
                privateKeyJwk: await crypto.subtle.exportKey('jwk', pair.privateKey) };
        }
        function makeRow(grant, key, context, label, offerId, baseline = empty(), confirmed = false) {
            return { grant: grantOf({ grant }), privateKeyJwk: key, securityFingerprint: context.security,
                peerBinding: peerBinding(context, grant.remoteDeviceId), confirmed,
                sequence: 0, lastSequence: 0, lastRemoteSettings: baseline, received: [], label, offerId };
        }
        async function saveNew(row, context, session) {
            await accountContext(session, { deviceId: context.deviceId, profileId: context.profileId, security: context.security });
            if (typeof row.peerBinding !== 'string') fail('The verified device link changed.');
            let replaced = [], inserted = false;
            await deps.mutate(values => {
                const matches = value => value.grant?.enabled && value.grant.localProfileId === row.grant.localProfileId
                    && value.grant.remoteDeviceId === row.grant.remoteDeviceId && value.grant.remoteProfileId === row.grant.remoteProfileId;
                const existing = values.find(value => matches(value) && value.confirmed === true);
                if (existing) {
                    if (existing.offerId === row.offerId && exact(existing.grant, row.grant)
                        && existing.securityFingerprint === row.securityFingerprint && existing.peerBinding === row.peerBinding) return values;
                    fail('These profiles already have Auto-sync enabled.');
                }
                replaced = values.filter(matches);
                const retained = values.filter(value => !matches(value));
                if (retained.length >= 64) fail('Too many Auto-sync profiles.');
                inserted = true; return retained.concat(row);
            }); changed();
            try {
                const fresh = await accountContext(session, { deviceId: context.deviceId, profileId: context.profileId, security: context.security });
                if (peerBinding(fresh, row.grant.remoteDeviceId) !== row.peerBinding) fail('The verified device link changed.');
            } catch (error) {
                if (inserted) {
                    await deps.mutate(values => values.filter(value => value.grant?.localGrantId !== row.grant.localGrantId
                        || !exact(value.grant, row.grant)));
                    await deps.queue.remove(queueId(row.grant.localGrantId), await codec.digest(row.grant));
                }
                throw error;
            }
            for (const previous of replaced) await deps.queue.remove(queueId(previous.grant.localGrantId), await codec.digest(previous.grant));
        }
        async function request(selection) {
            const selected = areas(selection), session = deps.session();
            if (!live(session)) fail('Open and verify your other account profile first.');
            const context = await accountContext(session);
            for (const [id, value] of pending) if (value.expiresAt <= now()) pending.delete(id);
            const target = pair(context, session.remoteDeviceId, session.remoteProfileId);
            if (initiating.has(target)) fail('Finish or retry the existing device connection.');
            const previous = pendingFor(context, session.remoteDeviceId, session.remoteProfileId);
            if (previous.length) {
                const [offerId, proposal] = previous[0];
                if (!exact(proposal.offer.areas, selected)) fail('Finish the existing invitation before changing what to sync.');
                await accountContext(proposal.session, { deviceId: proposal.context.deviceId,
                    profileId: proposal.context.profileId, security: proposal.context.security });
                if (pending.get(offerId) !== proposal || proposal.expiresAt <= now()) return false;
                // Explicit retry retransmits the original approved identity and key.
                // Never rotate a nonce while its acceptance might be in flight.
                await deps.send(copy(proposal.offer), proposal.session);
                return true;
            }
            if (pending.size + initiating.size >= 8) fail('Finish or retry the existing device connection.');
            const intent = { cancelled: false }; initiating.set(target, intent);
            try {
                if (!await deps.confirm({ title: 'Keep these profiles in sync?', message: 'Automatically share only the selected data with this verified device.',
                    details: [profileLabel(context, context.profileId) + ' ↔ ' + connectionLabel(session, session.remoteProfileId), selected.join(' and '), 'Direct device-to-device. Child rules and account security stay separate.'] })) return false;
                if (intent.cancelled) return false;
                await accountContext(session, { deviceId: context.deviceId, profileId: context.profileId, security: context.security });
                const key = await keys();
                const fresh = await accountContext(session, { deviceId: context.deviceId, profileId: context.profileId, security: context.security });
                if (intent.cancelled) return false;
                const offer = { schema: OFFER, version: 1, offerId: uuid(), sourceDeviceId: fresh.deviceId,
                    sourceProfileId: fresh.profileId, targetDeviceId: session.remoteDeviceId, targetProfileId: session.remoteProfileId,
                    sourceGrantId: uuid(), sourceGeneration: 1, areas: selected, publicKeyJwk: key.publicKeyJwk,
                    initialSettings: selected.includes('settings') ? protocol.snapshotSettings(fresh.profile) : null };
                pending.set(offer.offerId, { offer, key, context: fresh, session, expiresAt: now() + 600000 });
                try { await deps.send(offer, session); } catch (error) { pending.delete(offer.offerId); throw error; }
                return true;
            } finally { if (initiating.get(target) === intent) initiating.delete(target); }
        }
        async function offer(message, session) {
            fields(message, ['schema', 'version', 'offerId', 'sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId',
                'sourceGrantId', 'sourceGeneration', 'areas', 'publicKeyJwk', 'initialSettings']);
            if (!live(session) || message.version !== 1 || message.sourceDeviceId !== session.remoteDeviceId
                || message.sourceProfileId !== session.remoteProfileId) fail('The offered profile does not match the verified device.');
            const context = await accountContext(session);
            if (message.targetDeviceId !== context.deviceId || message.targetProfileId !== context.profileId) fail('This invitation is for another profile.');
            const selected = areas(message.areas);
            const initialSettings = selected.includes('settings') ? protocol.snapshotSettings(context.profile) : null;
            if (selected.includes('settings')) protocol.validateSettings(message.initialSettings);
            else if (message.initialSettings !== null) fail('Unexpected settings in a Notes-only invitation.');
            const offerDigest = await codec.digest(message);
            const existing = (await rows()).find(value => value.offerId === message.offerId
                && value.grant?.localDeviceId === context.deviceId && value.grant.localProfileId === context.profileId
                && value.grant.remoteDeviceId === message.sourceDeviceId && value.grant.remoteProfileId === message.sourceProfileId);
            if (existing) {
                if (existing.offerDigest !== offerDigest || !await current(existing)) fail('The invitation no longer matches the approved setup.');
                await sendAcceptance(existing, session); return true;
            }
            const key = await keys();
            const grant = protocol.normalizeGrant({ enabled: true, localDeviceId: context.deviceId, localProfileId: context.profileId,
                remoteDeviceId: message.sourceDeviceId, remoteProfileId: message.sourceProfileId,
                localGrantId: uuid(), remoteGrantId: message.sourceGrantId, localGeneration: 1, remoteGeneration: message.sourceGeneration,
                localPublicKeyJwk: key.publicKeyJwk, remotePublicKeyJwk: message.publicKeyJwk, areas: selected });
            const remoteTuple = tuple(message.sourceDeviceId, message.sourceProfileId);
            for (const [id, value] of pending) if (value.expiresAt <= now()) pending.delete(id);
            const outbound = pendingFor(context, message.sourceDeviceId, message.sourceProfileId);
            const intent = initiating.get(pair(context, message.sourceDeviceId, message.sourceProfileId));
            if (intent || outbound.length) {
                // Both ends may press Link at once. The exact lower endpoint tuple
                // keeps its invitation; the other becomes its consenting receiver.
                if (tuple(context.deviceId, context.profileId) < remoteTuple) return true;
                if (intent) intent.cancelled = true;
                for (const [id] of outbound) pending.delete(id);
            }
            if (!await deps.confirm({ title: 'Allow Auto-sync with this device?',
                message: 'This verified device may automatically exchange the selected data with this account profile.',
                details: [profileLabel(context, grant.localProfileId) + ' ↔ ' + connectionLabel(session, grant.remoteProfileId), selected.join(' and '), 'Settings conflicts need review. Child controls and security are excluded.'] })) return true;
            const baseline = initialSettings && exact(initialSettings, message.initialSettings) ? initialSettings : empty();
            const row = { ...makeRow(grant, key.privateKeyJwk, context, connectionLabel(session, grant.remoteProfileId), message.offerId, baseline),
                offerDigest, initialLocalSettings: initialSettings };
            await codec.digest(acceptance(row)); // Reject overlarge setup before saving consent.
            await saveNew(row, context, session);
            await sendAcceptance(row, session);
            return true;
        }
        function acceptance(row) {
            const grant = grantOf(row);
            const initialSettings = grant.areas.includes('settings') ? protocol.validateSettings(row.initialLocalSettings) : null;
            if (!grant.areas.includes('settings') && row.initialLocalSettings !== null) fail('Unexpected settings in a Notes-only approval.');
            return { schema: ACCEPT, version: 1, offerId: row.offerId, sourceDeviceId: grant.localDeviceId,
                sourceProfileId: grant.localProfileId, targetDeviceId: grant.remoteDeviceId, targetProfileId: grant.remoteProfileId,
                sourceGrantId: grant.localGrantId, targetGrantId: grant.remoteGrantId,
                sourceGeneration: grant.localGeneration, targetGeneration: grant.remoteGeneration,
                publicKeyJwk: grant.localPublicKeyJwk, areas: grant.areas, initialSettings };
        }
        async function sendAcceptance(row, session) {
            const message = acceptance(row);
            await codec.digest(message);
            await accountContext(session, { deviceId: row.grant.localDeviceId, profileId: row.grant.localProfileId, security: row.securityFingerprint });
            if (!await current(row)) fail('Auto-sync permission changed.');
            await deps.send(message, session);
        }
        async function accept(message, session) {
            fields(message, ['schema', 'version', 'offerId', 'sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId',
                'sourceGrantId', 'targetGrantId', 'sourceGeneration', 'targetGeneration', 'publicKeyJwk', 'areas', 'initialSettings']);
            const proposal = pending.get(message.offerId);
            if (!proposal || proposal.expiresAt <= now()) return true;
            const initial = proposal.offer;
            if (!sameSession(proposal.session, session) || message.version !== 1
                || message.sourceDeviceId !== initial.targetDeviceId || message.sourceProfileId !== initial.targetProfileId
                || message.targetDeviceId !== initial.sourceDeviceId || message.targetProfileId !== initial.sourceProfileId
                || message.targetGrantId !== initial.sourceGrantId || message.targetGeneration !== initial.sourceGeneration
                || !exact(areas(message.areas), initial.areas)) fail('The Auto-sync approval does not match the invitation.');
            const grant = protocol.normalizeGrant({ enabled: true, localDeviceId: initial.sourceDeviceId, localProfileId: initial.sourceProfileId,
                remoteDeviceId: initial.targetDeviceId, remoteProfileId: initial.targetProfileId,
                localGrantId: initial.sourceGrantId, remoteGrantId: message.sourceGrantId,
                localGeneration: initial.sourceGeneration, remoteGeneration: message.sourceGeneration,
                localPublicKeyJwk: initial.publicKeyJwk, remotePublicKeyJwk: message.publicKeyJwk, areas: initial.areas });
            if (grant.areas.includes('settings')) protocol.validateSettings(message.initialSettings);
            else if (message.initialSettings !== null) fail('Unexpected settings in a Notes-only approval.');
            const baseline = initial.initialSettings && exact(initial.initialSettings, message.initialSettings) ? initial.initialSettings : empty();
            const row = makeRow(grant, proposal.key.privateKeyJwk, proposal.context, connectionLabel(session, grant.remoteProfileId), initial.offerId, baseline, true);
            await saveNew(row, proposal.context, proposal.session); pending.delete(message.offerId); return true;
        }
        const stable = value => JSON.stringify(value && typeof value === 'object'
            ? Array.isArray(value) ? value.map(item => JSON.parse(stable(item)))
                : Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(stable(value[key]))])) : value);
        const signatureBytes = value => new TextEncoder().encode(stable(value));
        function encode(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
        function decode(value) {
            if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(value)) fail('Invalid Auto-sync confirmation.');
            const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
            if (bytes.length !== 64 || encode(bytes) !== value) fail('Invalid Auto-sync confirmation.'); return bytes;
        }
        async function acknowledge(row, message, status, session) {
            if (!await current(row) || !live(session, row.grant)) return;
            const grant = row.grant, body = { schema: ACK, version: 1, sourceDeviceId: grant.localDeviceId,
                sourceProfileId: grant.localProfileId, targetDeviceId: grant.remoteDeviceId, targetProfileId: grant.remoteProfileId,
                sourceGrantId: grant.localGrantId, targetGrantId: grant.remoteGrantId,
                sourceGeneration: grant.localGeneration, targetGeneration: grant.remoteGeneration,
                sequence: message.sequence, messageId: message.messageId, digest: message.digest, status };
            const key = await crypto.subtle.importKey('jwk', row.privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
            const signature = encode(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, key, signatureBytes(body))));
            if (await current(row)) await deps.send({ ...body, signature }, session);
        }
        async function receipt(message, row, session) {
            fields(message, ['schema', 'version', 'sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId',
                'sourceGrantId', 'targetGrantId', 'sourceGeneration', 'targetGeneration', 'sequence', 'messageId', 'digest', 'status', 'signature']);
            const grant = row.grant;
            if (message.version !== 1 || message.sourceDeviceId !== grant.remoteDeviceId || message.sourceProfileId !== grant.remoteProfileId
                || message.targetDeviceId !== grant.localDeviceId || message.targetProfileId !== grant.localProfileId
                || message.sourceGrantId !== grant.remoteGrantId || message.targetGrantId !== grant.localGrantId
                || message.sourceGeneration !== grant.remoteGeneration || message.targetGeneration !== grant.localGeneration
                || !['applied', 'needs_review', 'rejected'].includes(message.status)) fail('Invalid Auto-sync confirmation.');
            const { signature, ...body } = message;
            const key = await crypto.subtle.importKey('jwk', grant.remotePublicKeyJwk, { name: 'Ed25519' }, false, ['verify']);
            if (!await crypto.subtle.verify({ name: 'Ed25519' }, key, decode(signature), signatureBytes(body))) fail('Invalid Auto-sync confirmation.');
            if (!await current(row) || !live(session, grant)) return true;
            if (row.confirmed !== true) await update(row, value => ({ ...value, confirmed: true }));
            const entry = (await deps.queue.read()).enrollments.find(value => value.enrollmentId === queueId(grant.localGrantId));
            const item = entry?.channels.find(value => value.channel === 'profile' && value.payload?.envelope.sequence === message.sequence
                && value.payload.envelope.messageId === message.messageId && value.payload.envelope.digest === message.digest);
            if (item && entry.binding === await codec.digest(grant)) await deps.queue.acknowledge({ enrollmentId: entry.enrollmentId,
                binding: entry.binding, epoch: entry.epoch, channel: item.channel, fingerprint: item.fingerprint, sequence: item.sequence },
            { status: message.status === 'needs_review' ? 'waiting' : message.status === 'applied' ? 'applied' : 'rejected',
                reason: message.status === 'needs_review' ? 'needs_review' : message.status === 'rejected' ? 'peer_kept_local' : '' });
            changed(); return true;
        }
        async function apply(row, message, session, resolution = null, expectedRevision = null) {
            const verified = await codec.verify(row.grant, message, { lastSequence: 0 });
            row = await current(row);
            if (!row) fail('Auto-sync permission changed.');
            if (expectedRevision !== null && receiveRevision(row) !== expectedRevision) fail('This update changed while you reviewed it. Review the latest settings.');
            if (row.confirmed !== true) {
                await update(row, value => ({ ...value, confirmed: true }));
                row = await rowFor(row.grant.localGrantId);
                if (!row || !await current(row)) fail('Auto-sync permission changed.');
            }
            const prior = (row.received || []).find(value => value.sequence === verified.sequence && value.messageId === verified.messageId && value.digest === verified.digest);
            if (prior) { await acknowledge(row, message, prior.status, session); return true; }
            if (verified.sequence <= row.lastSequence) fail('This Auto-sync update is stale.');
            // The grant can remain identical while another dashboard applies a
            // newer update. Authorization alone must not revive an older merge.
            const revision = receiveRevision(row);
            const unchanged = async () => {
                const latest = await current(row);
                return !!latest && receiveRevision(latest) === revision;
            };
            const checkRevision = value => {
                if (receiveRevision(value) !== revision) fail('A newer Auto-sync update needs review.');
            };
            let merged;
            if (verified.payload.settings) {
                const context = await accountContext();
                if (!await unchanged()) fail('A newer Auto-sync update needs review.');
                const expectedLocalSnapshot = protocol.snapshotSettings(context.profile);
                merged = protocol.mergeSettings(row.lastRemoteSettings || empty(), expectedLocalSnapshot, verified.payload.settings);
                if (!merged.ok && !resolution) {
                    await update(row, value => { checkRevision(value); return { ...value, conflict: { message, fields: merged.conflicts } }; });
                    await acknowledge(row, message, 'needs_review', session); return true;
                }
                if (resolution === 'remote') merged = { ok: true, snapshot: verified.payload.settings };
                if (resolution !== 'local') await deps.applySettings(row.grant.localProfileId, merged.snapshot,
                    unchanged, expectedLocalSnapshot);
            }
            if (verified.payload.notes) {
                if (!await unchanged()) fail('Auto-sync permission or update changed.');
                const local = await deps.notesRead(row.grant.localProfileId, row.grant.localGrantId);
                const entries = protocol.mergeNotes(local.entries, verified.payload.notes, row.grant);
                if (!await unchanged()) fail('Auto-sync permission or update changed.');
                await deps.notesMerge(row.grant.localProfileId,
                    { format: 'filtertube.saved-video-notes', version: 1, entries }, row.grant.localGrantId);
            }
            const status = resolution === 'local' ? 'rejected' : 'applied';
            await update(row, value => { checkRevision(value); return { ...value, lastSequence: verified.sequence,
                lastRemoteSettings: verified.payload.settings || value.lastRemoteSettings,
                received: [...(value.received || []), { sequence: verified.sequence, messageId: verified.messageId, digest: verified.digest, status }].slice(-32), conflict: null }; });
            await acknowledge(row, message, status, session); return true;
        }
        function receiveRevision(row) {
            return JSON.stringify([row.lastSequence, row.received || [], row.conflict || null]);
        }
        async function receiveTransaction(row, message, session, resolution = null, expectedRevision = null) {
            if (typeof deps.withReceiveLock !== 'function') fail('Secure Auto-sync receive locking is unavailable.');
            return deps.withReceiveLock(row.grant.localGrantId, async () => {
                const latest = await current(row);
                if (!latest || !sameSession(session, deps.session()) || !live(deps.session(), latest.grant)) fail('The Auto-sync connection or permission changed.');
                return apply(latest, message, session, resolution, expectedRevision);
            });
        }
        async function receive(message) {
            if (![OFFER, ACCEPT, ACK, protocol.MESSAGE_SCHEMA].includes(message?.schema)) return false;
            await codec.digest(message); // Reject excessive size, prototypes, accessors and malformed JSON before use.
            const session = deps.session();
            if (!live(session)) fail('A verified personal-device connection is required.');
            if (message.schema === OFFER) {
                if (receiving.has(message.offerId)) return true;
                receiving.add(message.offerId); try { return await offer(message, session); } finally { receiving.delete(message.offerId); }
            }
            if (message.schema === ACCEPT) return accept(message, session);
            const row = await rowFor(message.targetGrantId);
            if (!row || !await current(row) || !live(session, row.grant)) fail('Auto-sync permission changed.');
            if (message.schema === ACK) return receipt(message, row, session);
            const token = row.grant.localGrantId;
            if (receiving.has(token)) fail('An Auto-sync update is already being checked.');
            receiving.add(token); try { return await receiveTransaction(row, message, session); } finally { receiving.delete(token); }
        }
        async function outgoing(row) {
            const context = await accountContext(), payload = {};
            if (context.profileId !== row.grant.localProfileId || context.deviceId !== row.grant.localDeviceId) fail('The account profile changed.');
            if (row.grant.areas.includes('settings')) payload.settings = protocol.snapshotSettings(context.profile);
            if (row.grant.areas.includes('notes')) payload.notes = await deps.notesRead(row.grant.localProfileId, row.grant.localGrantId);
            return payload;
        }
        async function run() {
            for (const initial of await rows()) {
                try {
                    const context = await deps.context();
                    const currentBinding = peerBinding(context, initial.grant.remoteDeviceId);
                    if (typeof initial.peerBinding !== 'string' || currentBinding !== initial.peerBinding) {
                        await deps.mutate(values => values.filter(value => value.grant?.localGrantId !== initial.grant.localGrantId
                            || !exact(value.grant, initial.grant)));
                        await deps.queue.remove(queueId(initial.grant.localGrantId), await codec.digest(initial.grant));
                        continue;
                    }
                    if (!await current(initial) || initial.confirmed !== true || initial.conflict) continue;
                    const grant = grantOf(initial), enrollmentId = queueId(grant.localGrantId), binding = await codec.digest(grant);
                    await deps.queue.enroll({ enrollmentId, binding, enabled: true });
                    const data = await outgoing(initial), fingerprint = await codec.digest(data);
                    const old = (await deps.queue.read()).enrollments.find(value => value.enrollmentId === enrollmentId)?.channels.find(value => value.channel === 'profile');
                    if (old?.fingerprint === fingerprint) {
                        if (initial.scanIssue) await update(initial, value => ({ ...value, scanIssue: false }));
                        continue;
                    }
                    let sequence;
                    await update(initial, value => {
                        sequence = (value.sequence || 0) + 1;
                        if (!Number.isSafeInteger(sequence)) fail('Auto-sync revision exhausted.');
                        return { ...value, sequence };
                    });
                    const key = await crypto.subtle.importKey('jwk', initial.privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
                    const envelope = await codec.sign(grant, data, { privateKey: key, sequence, messageId: uuid() });
                    if (await current(initial)) {
                        await deps.queue.enqueue(enrollmentId, 'profile', fingerprint, { envelope });
                        if (initial.scanIssue) await update(initial, value => ({ ...value, scanIssue: false }));
                    }
                } catch (_) {
                    // A failed new snapshot must not let an older queued snapshot
                    // masquerade as the user's latest settings or private notes.
                    if (await current(initial)) await update(initial, value => ({ ...value, scanIssue: true }));
                }
            }
            const result = await deps.queue.run({ filter: item => item.enrollmentId.startsWith('personal:'),
                authorize: async item => { const row = await rowFor(item.enrollmentId.slice(9));
                    if (!row || row.confirmed !== true || row.scanIssue || row.conflict
                        || await codec.digest(grantOf(row)) !== item.binding || !await current(row)) return false;
                    try { return await codec.digest(await outgoing(row)) === item.fingerprint; }
                    catch (_) {
                        if (await current(row)) await update(row, value => ({ ...value, scanIssue: true }));
                        return false;
                    }
                },
                send: async item => {
                    const row = await rowFor(item.enrollmentId.slice(9)), session = deps.session();
                    if (!row || !live(session, row.grant)) return { status: 'waiting', reason: 'waiting_for_device' };
                    await deps.send(item.payload.envelope, session);
                    const confirmed = (await deps.queue.read()).enrollments.find(value => value.enrollmentId === item.enrollmentId)?.channels
                        .find(value => value.channel === item.channel && value.fingerprint === item.fingerprint && value.sequence === item.sequence);
                    if (confirmed?.reason === 'needs_review') return { status: 'waiting', reason: 'needs_review' };
                    return { status: 'waiting', reason: 'waiting_for_receipt' };
                } });
            changed(); return result;
        }
        async function disable(id) {
            const row = await rowFor(id);
            if (!row) fail('This Auto-sync link is unavailable.');
            await accountContext(null, { deviceId: row.grant.localDeviceId, profileId: row.grant.localProfileId, security: row.securityFingerprint });
            await deps.mutate(values => values.filter(value => value.grant?.localGrantId !== id || !exact(value.grant, row.grant)));
            await deps.queue.remove(queueId(id), await codec.digest(row.grant)); changed();
        }
        async function resolve(id, choice) {
            if (!['local', 'remote'].includes(choice)) fail('Choose which settings to keep.');
            const row = await rowFor(id), session = deps.session();
            if (!row?.conflict || !await current(row) || !live(session, row.grant)) fail('Reconnect the verified device to resolve this update.');
            if (!await deps.confirm({ title: 'Resolve these settings?', message: choice === 'remote' ? 'Use the other device’s settings for these changes.' : 'Keep this device’s settings and decline the conflicting changes.',
                details: row.conflict.fields })) return false;
            const latest = await current(row);
            if (!latest || receiveRevision(latest) !== receiveRevision(row)
                || !sameSession(session, deps.session()) || !live(deps.session(), row.grant)) fail('This update changed while you reviewed it. Review the latest settings.');
            const token = row.grant.localGrantId;
            if (receiving.has(token)) fail('An Auto-sync update is already being checked.');
            receiving.add(token);
            try { return await receiveTransaction(latest, latest.conflict.message, session, choice, receiveRevision(latest)); }
            finally { receiving.delete(token); }
        }
        async function view() {
            const state = await deps.queue.read(), result = [];
            const context = await deps.context();
            for (const row of await rows()) {
                let status = 'Paused — review account access';
                try {
                    const allowed = await current(row), item = state.enrollments.find(value => value.enrollmentId === queueId(row.grant.localGrantId))?.channels.find(value => value.channel === 'profile');
                    if (row.scanIssue) status = 'Needs review';
                    else if (row.confirmed !== true) status = 'Waiting for other device approval';
                    else if (row.conflict || item?.status === 'rejected') status = 'Needs review';
                    else if (allowed) {
                        const fingerprint = await codec.digest(await outgoing(row));
                        status = item?.status === 'applied' && item.fingerprint === fingerprint ? 'Up to date'
                            : item?.reason === 'needs_review' ? 'Needs review'
                                : item?.reason === 'waiting_for_receipt' ? 'Waiting for confirmation' : 'Waiting for device';
                    }
                } catch (_) { /* Keep private errors and note contents out of status copy. */ }
                result.push({ id: row.grant.localGrantId, label: profileLabel(context, row.grant.localProfileId) + ' ↔ ' + (row.label || row.grant.remoteProfileId),
                    detail: row.grant.areas.join(' and ') + ' · Direct device-to-device', enabled: row.grant.enabled,
                    status, needsReview: !!row.conflict });
            }
            return result;
        }
        return Object.freeze({ run, receive, request, disable, view, resolve });
    }
    return Object.freeze({ create, OFFER, ACCEPT, ACK });
}));
