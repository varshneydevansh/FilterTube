import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const queueApi = require('../../js/auto_sync_queue.js');
const controllerApi = require('../../js/device_auto_sync.js');
const personalApi = require('../../js/personal_sync.js');
require('../../js/managed_auto_sync.js');
const managedApi = globalThis.FilterTubeManagedAutoSync;
const clone = value => JSON.parse(JSON.stringify(value));
// Reuse actual first-pair handlers, independent real IO roots and Ed25519 keys.
// No transport result in these tests substitutes for receiver policy application.
let fixture = fs.readFileSync(new URL('./nanah-managed-shared-link-handshake-current-behavior.test.mjs', import.meta.url), 'utf8')
    .split("test('production first Apply+Save")[0];
fixture = fixture.replace("'./helpers/nanah-storage-lock-fixture.mjs'", JSON.stringify(new URL('./helpers/nanah-storage-lock-fixture.mjs', import.meta.url).href));
fixture = fixture.replace('new URL(`../../js/${name}.js`, import.meta.url)', `new URL(\`${new URL('../../js/', import.meta.url).href}\${name}.js\`)`);
const { setup } = await import(`data:text/javascript;base64,${Buffer.from(`${fixture}\nexport { setup };`).toString('base64')}`);
const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function section(start, end) {
    const a = tab.indexOf(start), b = tab.indexOf(end, a);
    assert.ok(a > 0 && b > a, start); return tab.slice(a, b);
}

async function network(t, { autoApply = true, reconnectMode = 'fast', scopes = ['kids'] } = {}) {
    const f = await setup(), { source, receiver } = f;
    const first = await f.prepareFirst();
    await receiver.box.handleNanahIncomingProposal(first.envelope);
    const linkId = source.storage.ftNanahTrustedLinks[0].linkId;
    for (const endpoint of [source, receiver]) {
        endpoint.box.clonePlain = (value, fallback) => clone(value === undefined ? fallback : value);
        endpoint.box.MANAGED_TIME_LIMIT_SCHEMA = 'filtertube_managed_time_limit';
        vm.runInContext(section('    function isValidManagedTimeLimitTimezone(', '    function buildLocalPolicyHash('), endpoint.box);
        vm.runInContext(section('    function getProfileSurface(', '    function setProfileSurface('), endpoint.box);
        vm.runInContext(section('    async function loadNanahTrustedLinks(', '    async function persistNanahTrustedLinks('), endpoint.box);
        await endpoint.box.updateNanahTrustedLinkPolicy(linkId, { policy: {
            allowedScopes: scopes, defaultScope: scopes[0], autoApplyControlProposals: autoApply, reconnectMode
        } });
        await endpoint.box.loadNanahTrustedLinks();
    }
    vm.runInContext(section('    async function sendNanahAutoSyncReadiness(', '    async function sendNanahHelloEnvelope('), receiver.box);
    const calls = { sent: [], receipts: [], transportErrors: [] }, hooks = { beforeDeliver: null };
    let time = 1000, online = false, unlocked = true, tail = Promise.resolve(), generation = 0;
    const controllers = [];
    const storageDeps = {
        get: async keys => Object.fromEntries(keys.filter(key => Object.hasOwn(source.storage, key)).map(key => [key, clone(source.storage[key])])),
        set: async value => new Promise((resolve, reject) => source.box.chrome.storage.local.set(value, () =>
            source.box.chrome.runtime.lastError ? reject(Error('Storage failed')) : resolve())),
        withLock: work => { const next = tail.then(work); tail = next.catch(() => {}); return next; },
        now: () => time
    };
    function helper(endpoint) {
        const box = endpoint.box;
        return box.FilterTubeNanahManagedLivePolicy.create({
            normalizeString: box.normalizeString, safeObject: box.safeObject, normalizeNonNegativeInteger: box.normalizeNonNegativeInteger,
            getProfilesRoot: () => box.profilesV4Cache, getLocalProfileContext: box.getNanahLocalProfileContext,
            getPolicySourceProfile: () => ({ profileId: endpoint.childId, profile: box.profilesV4Cache.profiles[endpoint.childId] }),
            getActiveManagedSurface: () => 'kids', getProfileSurface: box.getProfileSurface, getManagedTimeLimitPolicy: box.getManagedTimeLimitPolicy,
            normalizeTrustedLink: box.normalizeNanahTrustedLink, getTargetProfileBehavior: x => x, normalizeTargetProfileContext: x => x || {}, getRemoteTargetProfile: () => null,
            buildLocalPolicyHash: box.buildLocalPolicyHash, getAllowedScopeList: box.getNanahManagedPolicyScopeList, getScopeLabel: x => x,
            ensureSigningKeyPair: () => box.ensureNanahManagedSigningKeyPair({ required: true }), getStableDeviceId: () => box.nanahStableDeviceId,
            findTrustedLinkById: id => box.nanahTrustedLinks.find(link => link.linkId === id), updateTrustedLinkPolicy: box.updateNanahTrustedLinkPolicy,
            getAdapter: () => box.FilterTubeNanahAdapter, now: () => time
        });
    }
    const sourceLive = helper(source), receiverLive = helper(receiver);
    async function refresh(endpoint) {
        await endpoint.box.refreshFilterTubeUiAfterNanahImport(); await endpoint.box.loadNanahTrustedLinks();
    }
    async function context() {
        await refresh(source);
        return clone({ profilesV4: source.box.profilesV4Cache, links: source.box.nanahTrustedLinks,
            deviceId: source.box.nanahStableDeviceId, unlocked });
    }
    const session = () => ({ client: source.box.nanahClient, ready: online && source.box.nanahSessionState.sasConfirmed,
        remoteDeviceId: receiver.box.nanahStableDeviceId, remoteProfileId: receiver.box.nanahSessionState.remoteProfile?.profileId,
        role: 'source', remoteRole: 'replica', managedReady: [...(source.box.nanahSessionState.autoSyncManagedReady || [])] });
    receiver.box.sendNanahManagedLivePolicyAck = async (envelope, decision) => {
        calls.receipts.push(clone(decision)); receiver.calls.receipts.push(clone(decision));
        const payload = receiverLive.buildLiveAckPayload(envelope, decision);
        if (online) await sourceLive.recordLiveAckPayload(clone(payload));
    };
    function instance() {
        const queue = queueApi.create(storageDeps);
        const controller = controllerApi.create({ ...storageDeps, queue, crypto: webcrypto,
            managed: managedApi, personal: personalApi, randomId: () => `explicit-consent-${++generation}`,
            context, session, hasTimePolicy: p => !!source.box.getManagedTimeLimitPolicy(p),
            confirmManaged: async (_, binding) => source.box.ensureProfileUnlocked(await source.box.FilterTubeIO.loadProfilesV4(), binding.sourceProfileId, { sensitiveAction: true }),
            operation(grant, current) {
                const operation = sourceLive.createSendOperation({
                    source: { profileId: grant.binding.localPolicyProfileId, profile: current.profilesV4.profiles[grant.binding.localPolicyProfileId] },
                    actor: { profileId: grant.binding.sourceProfileId, profileType: 'account' }, surface: 'kids'
                });
                // The real wire and storage boundaries produce detached plain data.
                return { buildPayload: scope => clone(operation.buildPayload(scope)),
                    buildEnvelopeBatchForTrustedLinks: async (...args) => clone(await operation.buildEnvelopeBatchForTrustedLinks(...args)),
                    reserveEnvelope: (...args) => operation.reserveEnvelope(...args) };
            },
            async sendManaged(envelope, captured, authorize) {
                await sourceLive.sendLiveEnvelope(envelope, async outgoing => {
                    if (!await authorize() || !online || captured.client !== source.box.nanahClient) throw Error('Connection or parent access changed');
                    await captured.client.send(outgoing);
                });
            }
        });
        controllers.push(controller); return { controller, queue };
    }
    async function connect({ approved = true } = {}) {
        online = true;
        for (const [local, remote] of [[source, receiver], [receiver, source]]) {
            await refresh(local);
            Object.assign(local.box.nanahSessionState, { connected: true, sasConfirmed: true, autoSyncVersion: 1,
                autoSyncManagedReady: [], remoteProfile: clone(remote.box.getNanahLocalProfileContext()),
                trustedReconnectApproved: approved, trustedReconnectDeviceId: approved ? remote.box.nanahStableDeviceId : '' });
        }
        source.box.nanahClient = { send: async envelope => {
            if (!online) throw Error('Offline');
            const packet = clone(envelope); calls.sent.push(packet); await hooks.beforeDeliver?.(packet);
            try { await receiver.box.handleNanahIncomingManagedPolicyEnvelope(clone(packet)); }
            catch (error) { calls.transportErrors.push(error.message); throw error; }
        } };
        receiver.box.nanahClient = { send: async packet => {
            if (!online) throw Error('Offline');
            await source.box.handleNanahIncomingEnvelope(clone(packet));
        } };
        await receiver.box.sendNanahAutoSyncReadiness();
    }
    function disconnect() {
        online = false;
        for (const endpoint of [source, receiver]) Object.assign(endpoint.box.nanahSessionState, {
            connected: false, sasConfirmed: false, autoSyncManagedReady: [], trustedReconnectApproved: false
        });
    }
    async function edit(endpoint, work) {
        const root = await endpoint.box.FilterTubeIO.loadProfilesV4(); work(root);
        assert.equal((await endpoint.box.FilterTubeIO.saveProfilesV4(root)).ok, true); await refresh(endpoint); time += 1000;
    }
    async function changeLink(endpoint, work) {
        const row = clone(endpoint.storage.ftNanahTrustedLinks[0]); work(row);
        endpoint.storage.ftNanahTrustedLinks[0] = row; await refresh(endpoint);
    }
    async function manual() {
        await refresh(source);
        const messages = await sourceLive.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, source.box.nanahTrustedLinks);
        for (const envelope of messages) await sourceLive.sendLiveEnvelope(envelope, outgoing => source.box.nanahClient.send(outgoing));
        return clone(messages);
    }
    t.after(() => controllers.forEach(controller => controller.dispose()));
    disconnect();
    return { ...f, sourceLive, linkId, calls, hooks, instance, connect, disconnect, edit, changeLink, manual, refresh,
        setUnlocked: value => { unlocked = value; },
        words: () => receiver.storage.ftProfilesV4.profiles[receiver.childId].kids.blockedKeywords.map(row => row.word),
        advance: () => { time += 10000; } };
}
async function queued(instance) { return (await instance.queue.read()).enrollments.flatMap(row => row.channels); }
async function cycles(instance, count = 2) { for (let i = 0; i < count; i++) await instance.controller.run({ wake: true }); }
const replaceWords = (endpoint, words) => root => { root.profiles[endpoint.childId].kids.blockedKeywords = words.map(word => ({ word })); };

// Explicit consent and receiver readiness are separate from nearby/online status.
test('actual paired parent/child links are off by default and perform no automatic receiver writes', async t => {
    const f = await network(t), a = f.instance(), writes = f.receiver.calls.profileWrites;
    await f.connect(); await cycles(a);
    assert.equal((await a.controller.view()).managed[0].status, 'Off');
    assert.deepEqual(await queued(a), []); assert.equal(f.calls.sent.length, 0);
    assert.equal(f.receiver.calls.profileWrites, writes);
});

test('offline edits coalesce across controller restart and apply only to the fixed child through the actual signed receiver', async t => {
    const f = await network(t), first = f.instance(), before = clone(f.receiver.storage.ftProfilesV4.profiles);
    assert.equal(await first.controller.setManaged(f.linkId, true), true);
    await f.edit(f.source, replaceWords(f.source, ['offline first'])); await cycles(first);
    const old = (await queued(first))[0].payload.envelope;
    await f.edit(f.source, replaceWords(f.source, ['offline latest', 'हिन्दी 📝'])); await cycles(first);
    const pending = clone((await queued(first))[0]); assert.ok(pending.payload.envelope.revision > old.revision);
    assert.deepEqual(f.words(), ['first-selected-kids']);
    first.controller.dispose(); const restarted = f.instance();
    await f.edit(f.receiver, root => { root.activeProfileId = f.receiver.parentId; });
    await f.connect(); await cycles(restarted, 1);
    assert.equal(f.calls.sent.length, 1); assert.deepEqual(f.calls.sent[0], pending.payload.envelope);
    assert.equal(f.calls.sent[0].targetProfileId, f.receiver.childId);
    assert.deepEqual(f.words(), ['offline latest', 'हिन्दी 📝']);
    assert.equal((await queued(restarted))[0].status, 'waiting', 'transport completion alone does not produce Applied');
    await cycles(restarted, 1); assert.equal((await queued(restarted))[0].status, 'applied');
    assert.equal((await restarted.controller.view()).managed[0].status, 'Up to date');
    assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId], before[f.receiver.parentId]);
    assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles.sibling, before.sibling);
    const accepted = f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId].managedPolicyState.remoteManagedPolicies[f.linkId].kids;
    assert.equal(accepted.revision, pending.payload.envelope.revision);
    assert.equal(accepted.payloadSha256, pending.payload.envelope.integrity.signedFields.payloadSha256);
    await cycles(restarted); assert.equal(f.calls.sent.length, 1, 'unchanged state neither signs a new revision nor reapplies');
    await f.edit(f.source, replaceWords(f.source, ['manual after Auto-sync']));
    await restarted.controller.setManaged(f.linkId, false); await f.manual();
    assert.deepEqual(f.words(), ['manual after Auto-sync'], 'existing manual sync remains available after Auto-sync is disabled');
});

for (const active of ['source-policy-child', 'sibling', 'default']) {
    test(`source profile switch to ${active} pauses delivery until the owning parent returns`, async t => {
        const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
        await f.edit(f.source, replaceWords(f.source, ['queued parent rule'])); await cycles(a);
        await f.edit(f.source, root => { root.activeProfileId = active; }); await f.connect(); await cycles(a);
        assert.equal(f.calls.sent.length, 0); assert.deepEqual(f.words(), ['first-selected-kids']);
        assert.equal((await queued(a))[0].status, 'waiting');
        await f.edit(f.source, root => { root.activeProfileId = f.source.parentId; });
        f.setUnlocked(false); await cycles(a); assert.equal(f.calls.sent.length, 0);
        f.setUnlocked(true); await f.connect(); await cycles(a); assert.deepEqual(f.words(), ['queued parent rule']);
    });
}

test('source parent must own the local child before opting in', async t => {
    const f = await network(t), a = f.instance();
    await f.edit(f.source, root => { root.profiles[f.source.childId].parentProfileId = 'default'; });
    await assert.rejects(a.controller.setManaged(f.linkId, true), /Review this parent\/device link/);
    assert.deepEqual(await queued(a), []); assert.equal(f.calls.sent.length, 0);
});

for (const [name, change] of [
    ['key revocation', row => { row.policy.keyRevoked = true; }],
    ['scope removal', row => { row.policy.allowedScopes = ['main']; }],
    ['key rotation', row => { row.keyVersion += 1; row.policy.keyVersion = row.keyVersion; }]
]) test(`permanent source ${name} purges queued policy and requires fresh enrollment`, async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    await f.changeLink(f.source, change); await f.connect(); await cycles(a);
    assert.equal((await a.controller.read()).managed[0].invalidated, true);
    assert.deepEqual(await queued(a), []); assert.equal(f.calls.sent.length, 0);
    assert.deepEqual(f.words(), ['first-selected-kids']);
});

test('receiver readiness is withheld until its reconnect approval and does not broaden receiver consent', async t => {
    const f = await network(t, { reconnectMode: 'approval_needed' }), a = f.instance();
    await a.controller.setManaged(f.linkId, true); await f.connect({ approved: false }); await cycles(a);
    assert.equal(f.calls.sent.length, 0); assert.equal((await queued(a))[0].reason, 'receiver_review_required');
    await f.connect({ approved: true }); await cycles(a); assert.equal((await queued(a))[0].status, 'applied');
    const g = await network(t, { autoApply: false }), b = g.instance();
    await b.controller.setManaged(g.linkId, true); await g.connect(); await cycles(b);
    assert.equal(g.calls.sent.length, 0); assert.equal((await queued(b))[0].reason, 'receiver_review_required');
    assert.equal(g.receiver.storage.ftNanahTrustedLinks[0].policy.autoApplyControlProposals, false);
});

for (const [name, mutate] of [
    ['wrong receiving child', packet => { packet.targetProfileId = 'sibling'; }],
    ['wrong source parent', packet => { packet.sourceProfileId = 'default'; }],
    ['changed signed content', packet => { packet.payload.data.blockedKeywords = [{ word: 'tampered' }]; }]
]) test(`actual signature/receiver validation rejects ${name} without applying or confirming`, async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    await f.edit(f.source, replaceWords(f.source, ['should not apply'])); await cycles(a);
    f.hooks.beforeDeliver = packet => mutate(packet); await f.connect(); await cycles(a);
    assert.deepEqual(f.words(), ['first-selected-kids']);
    assert.ok(f.calls.receipts.some(row => row.accepted === false));
    assert.notEqual((await queued(a))[0].status, 'applied');
});

test('receiver revocation after readiness is rechecked from actual persisted trust before applying', async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true); await f.connect();
    f.hooks.beforeDeliver = async () => f.changeLink(f.receiver, row => { row.policy.revoked = true; });
    await cycles(a); assert.deepEqual(f.words(), ['first-selected-kids']);
    assert.ok(f.calls.receipts.some(row => row.accepted === false)); assert.notEqual((await queued(a))[0].status, 'applied');
});

for (const failure of ['quota', 'silent-drop']) test(`actual receiver IO ${failure} cannot become an Applied ACK; a restored manual update succeeds`, async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    await f.edit(f.source, replaceWords(f.source, ['must persist before ACK'])); await cycles(a); await f.connect();
    const originalSet = f.receiver.box.chrome.storage.local.set;
    f.receiver.box.chrome.storage.local.set = (payload, done) => {
        if (!payload.ftProfilesV4) return originalSet(payload, done);
        if (failure === 'quota') f.receiver.box.chrome.runtime.lastError = { message: 'QUOTA_BYTES quota exceeded' };
        done?.(); f.receiver.box.chrome.runtime.lastError = null;
    };
    await cycles(a); assert.deepEqual(f.words(), ['first-selected-kids']);
    assert.equal(f.calls.receipts.filter(row => row.accepted === true).length, 0);
    assert.ok(f.calls.transportErrors.some(message => /could not be (saved|verified)/.test(message)));
    assert.notEqual((await queued(a))[0].status, 'applied');
    f.receiver.box.chrome.storage.local.set = originalSet;
    await a.controller.setManaged(f.linkId, false); await f.manual();
    assert.deepEqual(f.words(), ['must persist before ACK']);
    assert.ok(f.calls.receipts.some(row => row.accepted === true));
});

test('a local unsupported signing key pauses enrollment without sending an unverifiable update', async t => {
    const f = await network(t), a = f.instance();
    f.source.box.ensureNanahManagedSigningKeyPair = async () => ({ ...f.keys, privateKeyJwk: { kty: 'RSA', d: 'unsupported' } });
    assert.equal(await a.controller.setManaged(f.linkId, true), true);
    assert.equal((await a.controller.read()).managed[0].invalidated, true);
    assert.deepEqual(await queued(a), []); await f.connect(); await cycles(a);
    assert.equal(f.calls.sent.length, 0); assert.deepEqual(f.words(), ['first-selected-kids']);
});

test('an unsupported signing algorithm in a received packet cannot produce Applied', async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    f.hooks.beforeDeliver = packet => { packet.integrity.algorithm = 'rsa'; };
    await f.connect(); await cycles(a);
    assert.deepEqual(f.words(), ['first-selected-kids']);
    assert.ok(f.calls.receipts.some(row => row.accepted === false)); assert.notEqual((await queued(a))[0].status, 'applied');
});

test('reparenting the source child invalidates queued authority even while a different profile is active', async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    await f.edit(f.source, root => { root.profiles[f.source.childId].parentProfileId = 'default'; root.activeProfileId = 'sibling'; });
    await f.connect(); await cycles(a);
    assert.equal((await a.controller.read()).managed[0].invalidated, true);
    assert.deepEqual(await queued(a), []); assert.equal(f.calls.sent.length, 0);
    assert.deepEqual(f.words(), ['first-selected-kids']);
});

test('receiver ownership changing during real cryptographic verification rejects the old parent grant', async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    await f.edit(f.source, replaceWords(f.source, ['old grant must fail'])); await cycles(a); await f.connect();
    const adapter = f.receiver.box.FilterTubeNanahAdapter, verify = adapter.verifyManagedNanahPolicyIntegritySignature;
    adapter.verifyManagedNanahPolicyIntegritySignature = async (...args) => {
        const verification = await verify(...args); assert.equal(verification.verified, true);
        await f.edit(f.receiver, root => { root.profiles[f.receiver.childId].parentProfileId = 'default'; });
        return verification;
    };
    await cycles(a);
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId].parentProfileId, 'default');
    assert.deepEqual(f.words(), ['first-selected-kids']);
    assert.ok(f.calls.receipts.some(row => row.accepted === false)); assert.notEqual((await queued(a))[0].status, 'applied');
});

for (const failure of ['quota', 'silent-drop']) test(`manual portable scoped copy also rejects actual IO ${failure} without a false successful result`, async t => {
    const f = await network(t);
    await f.edit(f.source, root => { root.profiles[f.source.parentId].kids.blockedKeywords = [{ word: 'manual scoped rule' }]; });
    const packet = await f.source.box.FilterTubeNanahAdapter.buildSyncEnvelope({ scope: 'kids' });
    const before = clone(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId]);
    const original = f.receiver.box.chrome.storage.local.set;
    f.receiver.box.chrome.storage.local.set = (payload, done) => {
        if (!payload.ftProfilesV4) return original(payload, done);
        if (failure === 'quota') f.receiver.box.chrome.runtime.lastError = { message: 'Quota exceeded' };
        done?.(); f.receiver.box.chrome.runtime.lastError = null;
    };
    await assert.rejects(f.receiver.box.FilterTubeNanahAdapter.applyIncomingEnvelope(clone(packet), {
        strategy: 'replace', targetProfileId: f.receiver.parentId
    }), /could not be (saved|verified)/);
    assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId], before);
    f.receiver.box.chrome.storage.local.set = original;
    assert.equal((await f.receiver.box.FilterTubeNanahAdapter.applyIncomingEnvelope(clone(packet), {
        strategy: 'replace', targetProfileId: f.receiver.parentId
    })).ok, true);
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId].kids.blockedKeywords[0].word, 'manual scoped rule');
});

test('protected managed decision history never reports a successful save when actual IO fails', async t => {
    const f = await network(t), a = f.instance(); await a.controller.setManaged(f.linkId, true);
    const envelope = (await queued(a))[0].payload.envelope;
    const before = clone(f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId]);
    const original = f.receiver.box.chrome.storage.local.set;
    f.receiver.box.chrome.storage.local.set = (payload, done) => {
        if (!payload.ftProfilesV4) return original(payload, done);
        f.receiver.box.chrome.runtime.lastError = { message: 'Quota exceeded' }; done?.(); f.receiver.box.chrome.runtime.lastError = null;
    };
    const context = { recordHistory: true, trustedLink: f.receiver.box.nanahTrustedLinks[0], historyReceivedAt: 12345 };
    const result = await f.receiver.box.FilterTubeNanahAdapter.recordManagedPolicyDecisionHistory(envelope, {
        accepted: false, reason: 'revoked_link', applied: false
    }, context);
    assert.equal(result, false); assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId], before);
    f.receiver.box.chrome.storage.local.set = original;
    assert.equal(await f.receiver.box.FilterTubeNanahAdapter.recordManagedPolicyDecisionHistory(envelope, {
        accepted: false, reason: 'revoked_link', applied: false
    }, context), true);
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId].managedActionHistory.at(-1).reason, 'revoked_link');
});

for (const surface of ['main', 'kids']) test(`actual managed ${surface} replacement follows blocklist → whitelist → blocklist mode changes`, async t => {
    const f = await network(t, { scopes: [surface] }), a = f.instance();
    const target = () => f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId][surface];
    await f.edit(f.source, root => {
        Object.assign(root.profiles[f.source.childId][surface], { mode: 'whitelist', whitelistKeywords: [{ word: 'allowed example' }] });
    });
    await a.controller.setManaged(f.linkId, true); await f.connect(); await cycles(a);
    assert.equal(target().mode, 'whitelist');
    assert.equal(target().whitelistKeywords[0].word, 'allowed example');
    await f.edit(f.source, root => {
        Object.assign(root.profiles[f.source.childId][surface], { mode: 'blocklist',
            [surface === 'main' ? 'keywords' : 'blockedKeywords']: [{ word: 'blocked example' }], whitelistKeywords: [] });
    });
    await cycles(a); assert.equal((await queued(a))[0].status, 'applied');
    assert.equal(target().mode, 'blocklist', 'the actual stored mode must follow an explicit signed replacement');
    assert.equal(target()[surface === 'main' ? 'keywords' : 'blockedKeywords'][0].word, 'blocked example');
    assert.deepEqual(target().whitelistKeywords, []);
});

test('actual managed sender selector limits child settings; personal settings use their separately approved protocol', async t => {
    const f = await network(t);
    const profile = { type: 'child', parentProfileId: f.source.parentId, settings: {
        hideShorts: true, disableAutoplay: true, contentFilters: { views: { enabled: true, minViews: 5000 } },
        allowMainViewing: true, allowKidsViewing: false, defaultLaunchTarget: 'main',
        timeLimitPolicy: { schema: 'filtertube_managed_time_limit', version: 1, policyRevision: 1, issuedAt: 1000, policyHash: 'saved-child-time-policy', enabled: true, dailyBudgetSeconds: 900, timezone: 'Asia/Kolkata' }
    }, main: { mode: 'blocklist', keywords: [{ word: 'main rule' }], channels: [],
        contentFilters: { views: { enabled: true, minViews: 6000 } }, categoryFilters: { enabled: true } },
        kids: { mode: 'whitelist', strictMode: false, whitelistKeywords: [{ word: 'kids rule' }],
            contentFilters: { views: { enabled: true, minViews: 7000 } }, categoryFilters: { enabled: true }, languageFilters: { enabled: true, selected: ['hi'] } },
        videoNotes: [{ text: 'private notes use personal notes sync, never child policy' }] };
    const operation = f.sourceLive.createSendOperation({ source: { profileId: f.source.childId, profile },
        actor: { profileId: f.source.parentId, profileType: 'account' }, surface: 'main' });
    const main = clone(operation.buildPayload('main')), kids = clone(operation.buildPayload('kids'));
    assert.deepEqual(main.data.keywords, [{ word: 'main rule' }]);
    assert.equal(Object.hasOwn(main.data, 'contentFilters'), false);
    assert.equal(Object.hasOwn(main.data, 'categoryFilters'), false);
    assert.deepEqual(kids.data.contentFilters, profile.kids.contentFilters);
    assert.deepEqual(kids.data.categoryFilters, profile.kids.categoryFilters);
    assert.deepEqual(kids.data.languageFilters, profile.kids.languageFilters); assert.equal(kids.data.strictMode, false);
    assert.deepEqual(clone(operation.buildPayload('viewing_space')), { scope: 'viewing_space', allowMain: true, allowKids: false, defaultLaunchTarget: 'main' });
    assert.equal(operation.buildPayload('time_limits').dailyBudgetSeconds, 900);
    for (const value of [main, kids, operation.buildPayload('viewing_space'), operation.buildPayload('time_limits')]) {
        const wire = JSON.stringify(value); assert.equal(wire.includes('hideShorts'), false); assert.equal(wire.includes('disableAutoplay'), false);
        assert.equal(wire.includes('5000'), false); assert.equal(wire.includes('private notes'), false);
    }
    const changed = clone(profile); changed.settings.hideShorts = false; changed.settings.disableAutoplay = false;
    changed.settings.contentFilters.views.minViews = 100; changed.videoNotes[0].text = 'changed private note';
    const next = f.sourceLive.createSendOperation({ source: { profileId: f.source.childId, profile: changed },
        actor: { profileId: f.source.parentId, profileType: 'account' }, surface: 'main' });
    for (const scope of ['main', 'kids', 'viewing_space', 'time_limits']) {
        assert.deepEqual(clone(next.buildPayload(scope)), clone(operation.buildPayload(scope)), 'unsupported child toggles cannot be represented by these grants');
    }
    const personal = personalApi.snapshotSettings(profile);
    assert.equal(personal.settings.hideShorts, true); assert.equal(personal.settings.disableAutoplay, true);
    assert.deepEqual(personal.settings.contentFilters, profile.settings.contentFilters);
    assert.equal(Object.hasOwn(personal.settings, 'allowMainViewing'), false, 'personal settings do not substitute for parent viewing-space authority');
});

test('approved managed viewing spaces and saved time budgets persist on the fixed child while PIN and ownership stay local', async t => {
    const f = await network(t, { scopes: ['viewing_space', 'time_limits'] }), a = f.instance();
    const localSecurity = { profilePinVerifier: { hash: 'local-child-private-verifier' } };
    await f.edit(f.receiver, root => {
        Object.assign(root.profiles[f.receiver.childId], { security: clone(localSecurity) });
        Object.assign(root.profiles[f.receiver.childId].settings, { hideShorts: false, disableAutoplay: false,
            contentFilters: { views: { enabled: true, minViews: 123 } } });
    });
    const before = clone(f.receiver.storage.ftProfilesV4.profiles);
    await f.edit(f.source, root => {
        Object.assign(root.profiles[f.source.childId].settings, { allowMainViewing: false, allowKidsViewing: true,
            defaultLaunchTarget: 'kids', hideShorts: true, disableAutoplay: true,
            contentFilters: { views: { enabled: true, minViews: 99999 } },
            timeLimitPolicy: { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
                policyRevision: 3, issuedAt: 1000, policyHash: 'locally-authorized-budget', timezone: 'Asia/Kolkata',
                dailyBudgetSeconds: 1800, surfaceBudgets: { main: 0, kids: 1800 }, graceSeconds: 30,
                countingMode: 'active_youtube_tab', activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
                resetPolicy: 'policy_timezone_midnight', parentGrant: { enabled: true, extraSeconds: 120, expiresAt: null, reason: 'parent-approved test grant' },
                validFrom: 1000, validUntil: null }
        });
    });
    assert.equal(f.source.box.getManagedTimeLimitPolicy(f.source.storage.ftProfilesV4.profiles[f.source.childId]).dailyBudgetSeconds, 1800);
    await a.controller.setManaged(f.linkId, true); await f.connect(); await cycles(a);
    assert.ok((await queued(a)).every(row => row.status === 'applied'));
    const child = f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId];
    assert.equal(child.settings.allowMainViewing, false); assert.equal(child.settings.allowKidsViewing, true);
    assert.equal(child.settings.defaultLaunchTarget, 'kids');
    assert.equal(child.settings.timeLimitPolicy.dailyBudgetSeconds, 1800); assert.equal(child.settings.timeLimitPolicy.enabled, true);
    assert.equal(child.settings.timeLimitPolicy.timezone, 'Asia/Kolkata');
    assert.deepEqual(child.settings.timeLimitPolicy.surfaceBudgets, { main: 0, kids: 1800 });
    assert.equal(child.settings.timeLimitPolicy.parentGrant.extraSeconds, 120);
    assert.deepEqual(child.security, localSecurity); assert.equal(child.parentProfileId, f.receiver.parentId);
    assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId], before[f.receiver.parentId]);
    assert.deepEqual(f.receiver.storage.ftProfilesV4.profiles.sibling, before.sibling);
    assert.equal(child.settings.hideShorts, false); assert.equal(child.settings.disableAutoplay, false);
    assert.deepEqual(child.settings.contentFilters, before[f.receiver.childId].settings.contentFilters, 'general parent toggles are outside these approved scopes');
    await f.edit(f.source, root => {
        const settings = root.profiles[f.source.childId].settings;
        Object.assign(settings, { allowMainViewing: true, allowKidsViewing: false, defaultLaunchTarget: 'main' });
        settings.timeLimitPolicy.enabled = false; settings.timeLimitPolicy.policyRevision += 1;
    });
    await cycles(a);
    const later = f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId];
    assert.equal(later.settings.allowMainViewing, true); assert.equal(later.settings.allowKidsViewing, false);
    assert.equal(later.settings.defaultLaunchTarget, 'main'); assert.equal(later.settings.timeLimitPolicy.enabled, false);
    assert.deepEqual(later.security, localSecurity); assert.equal(later.parentProfileId, f.receiver.parentId);
});

for (const surface of ['main', 'kids']) test(`legacy portable ${surface} merge and unspecified replacement mode retain whitelist protection`, async t => {
    const f = await network(t);
    await f.edit(f.receiver, root => { root.profiles[f.receiver.parentId][surface].mode = 'whitelist'; });
    const packet = { t: 'app_sync', app: 'filtertube', scope: surface, payload: JSON.stringify({ section: surface, data: { mode: 'blocklist' } }) };
    await f.receiver.box.FilterTubeNanahAdapter.applyIncomingEnvelope(packet, { strategy: 'merge', targetProfileId: f.receiver.parentId });
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId][surface].mode, 'whitelist');
    packet.payload = JSON.stringify({ section: surface, data: {} });
    await f.receiver.box.FilterTubeNanahAdapter.applyIncomingEnvelope(packet, { strategy: 'replace', targetProfileId: f.receiver.parentId });
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId][surface].mode, 'whitelist');
    packet.payload = JSON.stringify({ section: surface, data: { mode: 'blocklist' } });
    await f.receiver.box.FilterTubeNanahAdapter.applyIncomingEnvelope(packet, { strategy: 'replace', targetProfileId: f.receiver.parentId });
    assert.equal(f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId][surface].mode, 'blocklist');
});
