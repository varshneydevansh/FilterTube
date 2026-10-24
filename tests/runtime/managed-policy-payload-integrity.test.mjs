import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const clone = value => JSON.parse(JSON.stringify(value));
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(',')}]`
    : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
        : JSON.stringify(value);

async function fixture() {
    let stored = { schemaVersion: 4, activeProfileId: 'parent', profiles: {
        parent: { type: 'account', main: { mode: 'blocklist', keywords: [{ word: 'parent-only' }] } },
        child: { type: 'child', parentProfileId: 'parent', main: { mode: 'blocklist', keywords: [] } },
        sibling: { type: 'child', parentProfileId: 'parent', main: { mode: 'blocklist', keywords: [{ word: 'sibling-only' }] } }
    } };
    const box = { crypto: crypto.webcrypto, TextEncoder, TextDecoder, atob, btoa,
        FilterTubeIO: { exportV3: async () => ({}), importV3: async () => ({}),
            loadProfilesV4: async () => clone(stored), saveProfilesV4: async value => { stored = clone(value); return { ok: true }; } } };
    box.window = box;
    vm.createContext(box);
    for (const file of ['nanah_sync_adapter', 'nanah_managed_live_policy']) {
        vm.runInContext(fs.readFileSync(new URL(`../../js/${file}.js`, import.meta.url), 'utf8'), box);
    }
    const adapter = box.FilterTubeNanahAdapter;
    const keys = await adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'review-key', keyVersion: 1 });
    const target = { id: 'link', linkId: 'link', type: 'managed_link', localRole: 'replica', remoteRole: 'source',
        sourceDeviceId: 'source-device', sourceProfileId: 'parent', targetProfileId: 'child', sourcePublicKeyId: 'review-key',
        keyVersion: 1, allowedScopes: ['main'], sourcePublicKeyJwk: keys.sourcePublicKeyJwk };
    const source = { linkId: 'link', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
        sourceDeviceId: 'source-device', sourceProfileId: 'parent', localPolicyProfileId: 'local-child',
        remoteDeviceId: 'target-device', sourcePublicKeyId: 'review-key', sourcePublicKeyJwk: keys.sourcePublicKeyJwk,
        keyVersion: 1, policy: { allowedScopes: ['main'], targetProfileBehavior: 'fixed_profile', targetProfileId: 'child' } };
    const profile = { main: { mode: 'blocklist', keywords: [{ word: 'Aa' }] } };
    const helper = box.FilterTubeNanahManagedLivePolicy.create({
        normalizeString: value => typeof value === 'string' ? value.trim() : '',
        safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
        normalizeNonNegativeInteger: value => Number.isSafeInteger(value) && value >= 0 ? value : null,
        getPolicySourceProfile: () => ({ profileId: 'local-child', profile }),
        getLocalProfileContext: () => ({ profileId: 'parent', profileType: 'account' }),
        getActiveManagedSurface: () => 'main', getProfilesRoot: () => ({}),
        getProfileSurface: (value, surface) => value[surface] || {}, getManagedTimeLimitPolicy: () => null,
        normalizeTrustedLink: value => value || null, getTargetProfileBehavior: value => value,
        normalizeTargetProfileContext: value => value || {}, getRemoteTargetProfile: () => null,
        getAllowedScopeList: value => value || [], getScopeLabel: value => value,
        buildLocalPolicyHash: (prefix, seed) => {
            const encoded = JSON.stringify(seed); let hash = 0;
            for (let i = 0; i < encoded.length; i++) hash = ((hash << 5) - hash + encoded.charCodeAt(i)) | 0;
            return `${prefix}-${Math.abs(hash).toString(16)}`;
        },
        ensureSigningKeyPair: async () => keys, getStableDeviceId: () => 'source-device',
        getCurrentTrustedLink: () => source, findTrustedLinkById: id => id === source.linkId ? source : null,
        updateTrustedLinkPolicy: async (_, updates) => {
            const patch = clone(updates.policy);
            if (patch.autoSyncReservedPolicies) patch.autoSyncReservedPolicies = { ...source.policy.autoSyncReservedPolicies, ...patch.autoSyncReservedPolicies };
            source.policy = { ...source.policy, ...patch }; return true;
        }, getAdapter: () => adapter, now: () => 1000,
        ensureManagedProviderDeliveryAuthorized: async () => ({ ok: true })
    });
    async function sign(word = 'Aa', revision = 1) {
        const draft = { type: 'filtertube_managed_policy', linkId: 'link', scope: 'main', sourceDeviceId: 'source-device',
            targetDeviceId: 'target-device', sourceProfileId: 'parent', targetProfileId: 'child', sourcePublicKeyId: 'review-key',
            keyVersion: 1, revision, payload: { scope: 'main', replace: true, data: { mode: 'blocklist', keywords: [{ word }] } } };
        draft.policyHash = adapter.buildManagedPolicyPayloadHash(draft);
        return adapter.signManagedPolicyEnvelope(draft, keys.privateKeyJwk);
    }
    async function legacy(value) {
        const envelope = clone(value); delete envelope.integrity.signedFields.payloadSha256;
        const key = await crypto.webcrypto.subtle.importKey('jwk', keys.privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
        const bytes = await crypto.webcrypto.subtle.sign('Ed25519', key, new TextEncoder().encode(stable(envelope.integrity.signedFields)));
        envelope.integrity.signature = Buffer.from(bytes).toString('base64url');
        return envelope;
    }
    async function context(envelope) {
        const verification = await adapter.verifyManagedNanahPolicyIntegritySignature(envelope, target);
        return { trustedLink: target, profilesV4: clone(stored), targetDeviceId: 'target-device',
            accepted: clone(stored.profiles.child.managedPolicyState?.remoteManagedPolicies?.link?.main || {}),
            signatureVerified: verification.verified === true, verifyIntegritySignature: () => verification };
    }
    return { adapter, keys, source, target, helper, profile, sign, legacy, context,
        stored: () => clone(stored), accepted: () => clone(stored.profiles.child.managedPolicyState?.remoteManagedPolicies?.link?.main || {}),
        apply: async envelope => adapter.applyManagedPolicyEnvelope(envelope, await context(envelope)) };
}

test('new Ed25519 signatures bind canonical complete payload bytes with SHA-256', async () => {
    const f = await fixture(), envelope = await f.sign('अध्ययन 📝');
    const expected = 'sha256:' + crypto.createHash('sha256').update(stable(envelope.payload)).digest('base64url');
    assert.equal(envelope.integrity.signedFields.payloadSha256, expected);
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(envelope, f.target)).verified, true);
    assert.equal(f.adapter.validateManagedPolicyEnvelope(envelope, await f.context(envelope)).accepted, true);
});

test('real legacy Aa/BB policyHash collision cannot substitute payload beneath a new signature', async () => {
    const f = await fixture(), signed = await f.sign('Aa');
    const changed = clone(signed); changed.payload.data.keywords[0].word = 'BB';
    assert.equal(f.adapter.buildManagedPolicyPayloadHash(changed), signed.policyHash, 'exercise an actual polynomial hash collision');
    assert.equal(changed.integrity.signature, signed.integrity.signature);
    const verification = await f.adapter.verifyManagedNanahPolicyIntegritySignature(changed, f.target);
    assert.equal(verification.verified, false); assert.equal(verification.reason, 'payload_digest_mismatch');
    assert.equal((await f.apply(changed)).accepted, false);
    assert.deepEqual(f.stored().profiles.child.main.keywords, []);
});

test('legacy signature verification remains compatible and its weak payload-binding boundary is explicit', async () => {
    const f = await fixture(), old = await f.legacy(await f.sign('Aa'));
    assert.equal(Object.hasOwn(old.integrity.signedFields, 'payloadSha256'), false);
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(old, f.target)).verified, true);
    assert.equal((await f.apply(old)).accepted, true);
    assert.equal(Object.hasOwn(f.accepted(), 'payloadSha256'), false, 'never fabricate proof for a legacy signature');
    const collidingLegacy = clone(old); collidingLegacy.payload.data.keywords[0].word = 'BB';
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(collidingLegacy, f.target)).verified, true,
        'legacy compatibility cannot retroactively authenticate content omitted by old signatures');
});

test('stripping or modifying the signed digest cannot downgrade a new envelope to legacy verification', async () => {
    const f = await fixture(), signed = await f.sign();
    const stripped = clone(signed); delete stripped.integrity.signedFields.payloadSha256;
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(stripped, f.target)).verified, false);
    const changed = clone(signed); changed.payload.data.keywords[0].word = 'BB';
    changed.integrity.signedFields.payloadSha256 = await f.adapter.digestManagedPolicyPayload(changed.payload);
    const verification = await f.adapter.verifyManagedNanahPolicyIntegritySignature(changed, f.target);
    assert.equal(verification.verified, false); assert.equal(verification.reason, 'signature_invalid');
});

test('null, empty, invalid and wrong-shape optional digests are failures rather than legacy fallbacks', async () => {
    const f = await fixture(), signed = await f.sign();
    for (const value of [null, '', {}, 'sha256:short', 12]) {
        const changed = clone(signed); changed.integrity.signedFields.payloadSha256 = value;
        assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(changed, f.target)).verified, false);
    }
});

test('canonical payload digest survives object-key reordering without changing semantic contents', async () => {
    const f = await fixture(), signed = await f.sign();
    const reorder = value => Array.isArray(value) ? value.map(reorder) : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).reverse().map(key => [key, reorder(value[key])])) : value;
    const changed = reorder(clone(signed));
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(changed, f.target)).verified, true);
});

test('existing signed-fields Ed25519 wire algorithm can authenticate the additional optional field', async () => {
    const f = await fixture(), signed = await f.sign();
    const key = await crypto.webcrypto.subtle.importKey('jwk', f.keys.sourcePublicKeyJwk, { name: 'Ed25519' }, false, ['verify']);
    assert.equal(await crypto.webcrypto.subtle.verify('Ed25519', key, Buffer.from(signed.integrity.signature, 'base64url'),
        new TextEncoder().encode(stable(signed.integrity.signedFields))), true);
});

test('real collision advances reserved revision, survives retry and applies only the newer fixed child policy', async () => {
    const f = await fixture();
    const first = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    await f.helper.reserveEnvelope(first);
    assert.equal((await f.apply(first)).applied, true);
    await f.helper.sendLiveEnvelope(first, async () => {});
    assert.equal(f.source.policy.outgoingManagedPolicies.main.payloadSha256, first.integrity.signedFields.payloadSha256);
    f.profile.main.keywords[0].word = 'BB';
    const changed = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(changed.policyHash, first.policyHash);
    assert.notEqual(changed.integrity.signedFields.payloadSha256, first.integrity.signedFields.payloadSha256);
    assert.equal(changed.revision, first.revision + 1);
    await f.helper.reserveEnvelope(changed);
    const retry = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(retry.revision, changed.revision);
    assert.equal((await f.apply(changed)).applied, true);
    assert.equal((await f.apply(changed)).decision, 'idempotent_same_hash');
    assert.equal(f.stored().profiles.child.main.keywords[0].word, 'BB');
    assert.equal(f.stored().profiles.parent.main.keywords[0].word, 'parent-only');
    assert.equal(f.stored().profiles.sibling.main.keywords[0].word, 'sibling-only');
    assert.equal(f.accepted().payloadSha256, changed.integrity.signedFields.payloadSha256);
});

test('first upgraded send conservatively advances a legacy stored revision even for an unchanged legacy hash', async () => {
    const f = await fixture(), current = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    f.source.policy.outgoingManagedPolicies = { main: { revision: 4, policyHash: current.policyHash } };
    const upgrade = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    assert.equal(upgrade.revision, 5);
    await f.helper.reserveEnvelope(upgrade);
    assert.equal((await f.helper.buildEnvelopeForLiveSend({ scope: 'main' })).revision, 5);
});

test('manual Home and encrypted-mailbox upload bookkeeping retain the new signed payload digest', async () => {
    const f = await fixture(), envelope = await f.helper.buildEnvelopeForLiveSend({ scope: 'main' });
    const candidate = f.helper.buildLocalNetworkCandidateFromEnvelope(envelope);
    const home = await f.helper.deliverLocalNetworkCandidates([candidate], {
        publishManagedPolicyCandidates: async () => ({ ok: true })
    });
    assert.equal(home.markedSentCount, 1);
    assert.equal(f.source.policy.outgoingManagedPolicies.main.payloadSha256, envelope.integrity.signedFields.payloadSha256);
    const item = f.adapter.buildManagedMailboxStorageItem(envelope, {
        cipherSuite: 'aes-kw+a256gcm', keyAgreementId: 'fixture', encryptedDek: 'fixture', nonce: 'fixture',
        ciphertext: 'fixture', ciphertextHash: 'fixture'
    });
    assert.equal(item.payloadSha256, envelope.integrity.signedFields.payloadSha256);
    const mailbox = await f.helper.uploadMailboxItems([item], { uploadManagedMailboxItems: async () => ({ ok: true }) });
    assert.equal(mailbox.markedSentCount, 1);
    assert.equal(f.source.policy.outgoingManagedPolicies.main.payloadSha256, envelope.integrity.signedFields.payloadSha256);
    assert.equal((await f.helper.buildEnvelopeForLiveSend({ scope: 'main' })).revision, envelope.revision);
});

test('receiver rejects equal-revision same-legacy-hash payload digest conflict and leaves child contents unchanged', async () => {
    const f = await fixture(), first = await f.sign('Aa', 1), conflicting = await f.sign('BB', 1);
    assert.equal((await f.apply(first)).applied, true);
    assert.equal(first.policyHash, conflicting.policyHash);
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(conflicting, f.target)).verified, true);
    const rejected = await f.apply(conflicting);
    assert.equal(rejected.accepted, false); assert.equal(rejected.reason, 'equal_revision_hash_conflict');
    assert.equal(f.stored().profiles.child.main.keywords[0].word, 'Aa');
});

test('strong accepted state cannot treat a legacy same-revision replay as matching cryptographic contents', async () => {
    const f = await fixture(), strong = await f.sign();
    await f.apply(strong);
    const legacy = await f.legacy(strong);
    assert.equal((await f.adapter.verifyManagedNanahPolicyIntegritySignature(legacy, f.target)).verified, true);
    const rejected = await f.apply(legacy);
    assert.equal(rejected.accepted, false); assert.equal(rejected.reason, 'equal_revision_hash_conflict');
});
