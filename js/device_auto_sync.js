/* Opt-in orchestration. Presence is not trust; queue dispatch is not application. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeDeviceAutoSync = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    const KEY = 'ftDeviceAutoSyncV1';
    const copy = value => JSON.parse(JSON.stringify(value));
    function security(profiles, id) {
        const profile = profiles?.profiles?.[id];
        if (!profile || profiles.activeProfileId !== id || (id !== 'default' && profile.type !== 'account')
            || profile.parentProfileId) throw Error('Open your own parent/account profile to sync.');
        return JSON.stringify([id, profile.type || 'account', profile.parentProfileId || null,
            profile.security || null, profile.pinVerifier || null, profiles.security || null]);
    }
    function create(deps) {
        const managed = deps.managed || root.FilterTubeManagedAutoSync;
        const protocol = deps.personal || root.FilterTubePersonalSync;
        const digest = protocol.create({ crypto: deps.crypto || root.crypto }).digest;
        const listeners = new Set();
        let running = null, rerun = false;
        const changed = () => listeners.forEach(fn => fn());
        const mutate = fn => deps.withLock(async () => {
            const state = await read();
            const result = validate(await fn(state));
            if (JSON.stringify(result) !== JSON.stringify(state)) {
                await deps.set({ [KEY]: result });
                if (JSON.stringify((await deps.get([KEY]))[KEY]) !== JSON.stringify(result)) throw Error('Sync preferences could not be saved.');
            }
            changed(); return result;
        });
        async function read() {
            const state = (await deps.get([KEY]))[KEY];
            if (state === undefined) return { version: 1, managed: [], personal: [] };
            return validate(state);
        }
        function validate(state) {
            if (!state || state.version !== 1 || !Array.isArray(state.managed) || !Array.isArray(state.personal)
                || state.managed.length + state.personal.length > 64 || JSON.stringify(state).length > 4 * 1024 * 1024) throw Error('Sync preferences need review.');
            const generations = new Set(), links = new Set();
            for (const grant of state.managed) {
                if (!managed.normalizeGrant(grant) || typeof grant.generation !== 'string' || !grant.generation.length
                    || grant.generation.length > 128 || generations.has(grant.generation) || links.has(grant.binding.linkId)
                    || (grant.invalidated !== undefined && typeof grant.invalidated !== 'boolean')
                    || (grant.invalidReason !== undefined && (typeof grant.invalidReason !== 'string' || grant.invalidReason.length > 128))) {
                    throw Error('Sync preferences need review.');
                }
                generations.add(grant.generation); links.add(grant.binding.linkId);
            }
            return copy(state);
        }
        const queueBinding = grant => digest({ binding: grant.binding, generation: grant.generation });
        async function invalidateManaged(grant, reason) {
            const expected = await queueBinding(grant);
            await mutate(state => {
                let modified = false;
                const rows = state.managed.map(current => {
                    if (current.binding.linkId !== grant.binding.linkId || current.generation !== grant.generation
                        || JSON.stringify(current.binding) !== JSON.stringify(grant.binding) || current.invalidated === true) return current;
                    modified = true;
                    return { ...current, invalidated: true, invalidReason: reason };
                });
                return modified ? { ...state, managed: rows } : state;
            });
            await deps.queue.remove('managed:' + grant.binding.linkId, expected);
        }
        async function managedContext(grant) {
            const context = await deps.context();
            const link = context.links.find(row => row.linkId === grant.binding.linkId);
            if (grant.invalidated === true) {
                await deps.queue.remove('managed:' + grant.binding.linkId, await queueBinding(grant));
                return { context, link, decision: { ok: false, reason: 'auto_sync_needs_enrollment' } };
            }
            // A different active profile pauses dispatch; it must not mask a
            // permanent key, scope, owner or trust change beneath that pause.
            const pinnedRoot = { ...context.profilesV4, activeProfileId: grant.binding.sourceProfileId };
            const invariant = managed.eligible({ profilesV4: pinnedRoot, sourceDeviceId: context.deviceId, link }, grant);
            if (!invariant.ok) {
                await invalidateManaged(grant, invariant.reason);
                return { context, link, decision: { ok: false, reason: invariant.reason } };
            }
            return { context, link, decision: managed.eligible({ profilesV4: context.profilesV4,
                sourceDeviceId: context.deviceId, link }, grant) };
        }
        async function authorize(item) {
            if (!item.enrollmentId.startsWith('managed:')) return false;
            const grant = (await read()).managed.find(row => 'managed:' + row.binding.linkId === item.enrollmentId);
            if (!grant || grant.invalidated === true || await queueBinding(grant) !== item.binding) return false;
            const { context, decision } = await managedContext(grant);
            return context.unlocked === true && decision.ok === true;
        }
        async function setManaged(id, enabled) {
            if (!enabled) {
                const grant = (await read()).managed.find(row => row.binding.linkId === id);
                if (!grant) return false;
                const current = await deps.context();
                security(current.profilesV4, grant.binding.sourceProfileId);
                if (!current.unlocked) throw Error('Unlock the parent account before changing Auto-sync.');
                let removed = false;
                await mutate(state => {
                    const rows = state.managed.filter(row => row.binding.linkId !== id || row.generation !== grant.generation);
                    removed = rows.length !== state.managed.length;
                    return removed ? { ...state, managed: rows } : state;
                });
                await deps.queue.remove('managed:' + id, await queueBinding(grant)); changed(); return removed;
            }
            const context = await deps.context();
            const link = context.links.find(row => row.linkId === id);
            const first = managed.bindingFor(link, { profilesV4: context.profilesV4, sourceDeviceId: context.deviceId });
            if (!first.ok) throw Error('Review this parent/device link before enabling Auto-sync.');
            if (!await deps.confirmManaged(link, first.binding)) return false;
            const fresh = await deps.context();
            const current = fresh.links.find(row => row.linkId === id);
            const checked = managed.bindingFor(current, { profilesV4: fresh.profilesV4, sourceDeviceId: fresh.deviceId });
            if (!fresh.unlocked || !checked.ok || JSON.stringify(first.binding) !== JSON.stringify(checked.binding)) throw Error('The profile or device permission changed. Review it again.');
            const generation = (deps.randomId || (() => (deps.crypto || root.crypto).randomUUID()))();
            if (typeof generation !== 'string' || !generation.length || generation.length > 128) throw Error('Auto-sync enrollment could not be created.');
            const grant = { schema: managed.SCHEMA, version: 1, enabled: true, generation, binding: checked.binding };
            await mutate(state => ({ ...state, managed: state.managed.filter(row => row.binding.linkId !== id).concat(grant) }));
            await deps.queue.enroll({ enrollmentId: 'managed:' + id, binding: await queueBinding(grant), enabled: true });
            await run();
            return true;
        }
        async function scanManaged() {
            for (const grant of (await read()).managed) {
                try {
                const { context, link, decision } = await managedContext(grant);
                if (!decision.ok || !context.unlocked) continue;
                const enrollmentId = 'managed:' + grant.binding.linkId;
                const binding = await queueBinding(grant);
                await deps.queue.enroll({ enrollmentId, binding, enabled: true });
                const operation = deps.operation(grant, context);
                for (const scope of decision.scopes) {
                    if (scope === 'time_limits' && !deps.hasTimePolicy(context.profilesV4.profiles[grant.binding.localPolicyProfileId])) {
                        const previous = (await deps.queue.read()).enrollments.find(row => row.enrollmentId === enrollmentId)?.channels;
                        if (previous?.some(row => row.channel === scope)) throw Error('The saved time policy needs review.');
                        continue;
                    }
                    const fingerprint = await digest(operation.buildPayload(scope));
                    const old = (await deps.queue.read()).enrollments.find(row => row.enrollmentId === enrollmentId)?.channels.find(row => row.channel === scope);
                    if (old?.fingerprint === fingerprint) continue;
                    const [envelope] = await operation.buildEnvelopeBatchForTrustedLinks({ scope }, [link]);
                    const item = { enrollmentId, binding };
                    if (!await authorize(item)) continue;
                    // Reserve revision BEFORE durable queueing. A worker crash must never
                    // reuse the same revision for a different signed policy.
                    await operation.reserveEnvelope(envelope);
                    if (!await authorize(item)) continue;
                    await deps.queue.enqueue(enrollmentId, scope, fingerprint, { envelope });
                }
                } catch (_) {
                    // Malformed/oversized policies and failed allocation writes
                    // pause only this enrollment. Do not leak policy text or keep
                    // signing/reserving the same failing update on every wake.
                    await invalidateManaged(grant, 'update_needs_review');
                }
            }
        }
        async function dispatch(item) {
            const state = await read();
            const grant = state.managed.find(row => 'managed:' + row.binding.linkId === item.enrollmentId);
            if (!grant) return { status: 'rejected', reason: 'permission_removed' };
            if (grant.invalidated === true || await queueBinding(grant) !== item.binding) return { status: 'rejected', reason: 'permission_changed' };
            const { context, link, decision } = await managedContext(grant);
            if (!decision.ok || !context.unlocked) return { status: 'waiting', reason: 'unlock_parent' };
            const envelope = item.payload.envelope;
            const outgoing = link.policy?.outgoingManagedPolicies?.[envelope.scope];
            if (outgoing?.revision === envelope.revision && outgoing.policyHash === envelope.policyHash) {
                if ((outgoing.lastAckState === 'delivered' && outgoing.lastAckResult === 'accepted')
                    || outgoing.lastAckState === 'applied' || outgoing.lastAckResult === 'applied') return { status: 'applied' };
                if (['rejected', 'revoked', 'conflict', 'expired'].includes(outgoing.lastAckState)) return { status: 'rejected', reason: 'needs_review' };
            }
            if (link.policy?.autoApplyControlProposals !== true) return { status: 'waiting', reason: 'receiver_review_required' };
            const session = deps.session();
            if (session.ready && session.remoteDeviceId === grant.binding.targetDeviceId
                && session.role === 'source' && session.remoteRole === 'replica') {
                if (!Array.isArray(session.managedReady) || !session.managedReady.includes(grant.binding.linkId)) {
                    return { status: 'waiting', reason: 'receiver_review_required' };
                }
                await deps.sendManaged(envelope, session, () => authorize(item));
                return { status: 'waiting', reason: 'waiting_for_receipt' };
            }
            // Optional pickup is explicitly enrolled, never inferred from provider availability.
            if (grant.pickup === true && deps.sendPickup) {
                await deps.sendPickup(envelope, context, () => authorize(item));
                return { status: 'waiting', reason: 'waiting_for_receipt' };
            }
            return { status: 'waiting', reason: 'waiting_for_device' };
        }
        const personalRuntime = (deps.personalRuntime || root.FilterTubePersonalAutoSyncRuntime)?.create({
            crypto: deps.crypto || root.crypto, protocol,
            context: deps.context, session: deps.session, queue: deps.queue,
            security, read: async () => (await read()).personal,
            mutate: fn => mutate(state => ({ ...state, personal: fn(copy(state.personal)) })),
            authorize: async row => {
                try {
                    const current = (await read()).personal.find(item => item.grant.localGrantId === row.grant.localGrantId);
                    const context = await deps.context();
                    return !!current && current.grant.enabled === true && context.unlocked === true
                        && JSON.stringify(current.grant) === JSON.stringify(row.grant)
                        && current.securityFingerprint === security(context.profilesV4, current.grant.localProfileId)
                        && context.deviceId === current.grant.localDeviceId;
                } catch (_) { return false; }
            },
            send: deps.sendPersonal, confirm: deps.confirmPersonal,
            notesRead: deps.notesRead, notesMerge: deps.notesMerge, applySettings: deps.applySettings,
            changed
        });
        async function run({ wake = false } = {}) {
            if (running) { rerun = true; return running; }
            running = (async () => {
                if (wake) await deps.queue.wake();
                await deps.checkIncoming?.();
                await scanManaged();
                await deps.queue.run({ filter: row => row.enrollmentId.startsWith('managed:'), authorize, send: dispatch });
                await personalRuntime?.run();
            })().finally(() => { running = null; changed(); if (rerun) { rerun = false; schedule(); } });
            return running;
        }
        let timer;
        function schedule() {
            clearTimeout(timer);
            timer = setTimeout(() => run().catch(() => { changed(); }), 500);
        }
        async function view() {
            const context = await deps.context(), state = await read(), queue = await deps.queue.read();
            const profiles = context.profilesV4.profiles || {};
            const managedRows = context.links.filter(link => link.localRole === 'source' && link.remoteRole === 'replica' && link.linkType === 'managed_link').map(link => {
                const grant = state.managed.find(row => row.binding.linkId === link.linkId);
                const decision = grant ? managed.eligible({ link, profilesV4: context.profilesV4, sourceDeviceId: context.deviceId }, grant)
                    : managed.bindingFor(link, { profilesV4: context.profilesV4, sourceDeviceId: context.deviceId });
                const rows = queue.enrollments.find(row => row.enrollmentId === 'managed:' + link.linkId)?.channels || [];
                const status = !grant ? 'Off' : grant.invalidated === true ? 'Needs review — turn Auto-sync off and on again'
                    : !decision.ok || !context.unlocked ? 'Paused — review parent access'
                    : rows.some(row => row.status === 'rejected') ? 'Needs review'
                    : rows.length && rows.every(row => row.status === 'applied') ? 'Up to date'
                    : rows.some(row => row.reason === 'receiver_review_required') ? 'Waiting for receiving parent approval'
                    : rows.some(row => row.reason === 'waiting_for_receipt') ? 'Waiting for confirmation' : 'Waiting for device';
                return { id: link.linkId, label: (profiles[link.localPolicyProfileId]?.name || link.localPolicyProfileId || 'Choose a rules profile')
                    + ' → ' + (link.policy?.targetProfileName || link.policy?.targetProfileId || 'Child') + ' · ' + (link.deviceLabel || link.remoteDeviceId),
                detail: 'Parent-controlled updates · Direct device-to-device', enabled: !!grant, available: decision.ok, status };
            });
            const personalView = await personalRuntime?.view();
            let canPairPersonal = false;
            try {
                security(context.profilesV4, context.profilesV4.activeProfileId);
                const peer = deps.session();
                canPairPersonal = context.unlocked && peer.ready && peer.role === 'peer' && peer.remoteRole === 'peer'
                    && peer.remoteProfileType === 'account' && !!peer.remoteProfileId && peer.autoSyncVersion === 1
                    && protocol.peerBinding(context.links, peer.remoteDeviceId) !== null;
            } catch (_) { /* A locked or child profile has no personal-link setup action. */ }
            return { managed: managedRows, personal: Array.isArray(personalView) ? personalView : personalView?.personal || [],
                canPairPersonal,
                notice: 'Updates wait safely offline. Keep FilterTube open on both devices for direct sync. Optional pickup services have separate delivery settings.' };
        }
        return Object.freeze({ read, run, schedule, view, setManaged,
            subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
            requestPersonal: areas => personalRuntime.request(areas),
            disablePersonal: id => personalRuntime.disable(id),
            resolvePersonal: (id, choice) => personalRuntime.resolve(id, choice),
            receive: async message => { const result = await personalRuntime?.receive(message); if (result) { changed(); schedule(); } return result; },
            dispose: () => clearTimeout(timer) });
    }
    return Object.freeze({ KEY, security, create });
}));
