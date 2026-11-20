import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture } from './helpers/managed-sync-fixtures.mjs';

const require = createRequire(import.meta.url);
const Receiver = require('../../js/managed_update_receiver.js');

const childKeywords = store => store.ftProfilesV4.profiles.Child.main.keywords.map(entry => entry.word);

test('a signed update for a child profile that is not active applies in the worker, with a notice', async () => {
    const f = await familyFixture({ activeProfileId: 'Parent' });
    const result = await f.receiver.receiveSealedItem(await f.sealedItem(), { selfControlActive: async () => false });
    assert.equal(result.accepted, true, result.reason);
    assert.equal(result.applied, true);
    assert.equal(result.ackState, 'delivered');
    assert.deepEqual(childKeywords(f.store), ['scary clown']);
    assert.equal(f.store.ftManagedUpdateNotice.schema, 'filtertube_managed_update_notice');
    assert.ok(f.store.ftManagedUpdateNotice.expiresAt > f.store.ftManagedUpdateNotice.createdAt);
    assert.equal(f.store.ftManagedUpdateNotice.activeChanged, false);
    assert.equal(f.store.ftManagedUpdateNotice.profileName, 'Child');
    assert.equal(result.envelope, undefined, 'the decrypted policy never leaves the receiver');
    // The same item again is idempotent and writes no second notice.
    const noticeId = f.store.ftManagedUpdateNotice.id;
    const again = await f.receiver.receiveSealedItem(await f.sealedItem(), { selfControlActive: async () => false });
    assert.equal(again.ackState, 'delivered');
    assert.equal(again.applied, false);
    assert.equal(f.store.ftManagedUpdateNotice.id, noticeId);
});

test('a changed payload, a stranger key, a revoked or closed link, and an expired item never apply', async () => {
    const tampered = await familyFixture();
    const bad = await tampered.receiver.receiveSealedItem(await tampered.sealedItem({ mutate: signed => {
        signed.payload.operations[0].value = 'something else';
    } }), { selfControlActive: async () => false });
    assert.equal(bad.accepted, false);
    assert.deepEqual(childKeywords(tampered.store), []);

    const stranger = await familyFixture();
    const other = await stranger.adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'parent-key-1', keyVersion: 1 });
    stranger.store.ftNanahTrustedLinks[0].sourcePublicKeyJwk = other.sourcePublicKeyJwk;
    const forged = await stranger.receiver.receiveSealedItem(await stranger.sealedItem(), { selfControlActive: async () => false });
    assert.equal(forged.reason, 'signature_invalid');
    assert.deepEqual(childKeywords(stranger.store), []);

    const revoked = await familyFixture({ linkOverrides: { revoked: true } });
    const gone = await revoked.receiver.receiveSealedItem(await revoked.sealedItem(), { selfControlActive: async () => false });
    assert.equal(gone.ackState, 'revoked');

    const closed = await familyFixture({ policyOverrides: { lockedChildMode: 'require_unlock' } });
    const held = await closed.receiver.receiveSealedItem(await closed.sealedItem(), { selfControlActive: async () => false });
    assert.equal(held.reason, 'locked_trusted_updates_not_allowed');
    assert.deepEqual(childKeywords(closed.store), []);

    const late = await familyFixture();
    const expired = await late.receiver.receiveSealedItem(await late.sealedItem({ expiresAtMs: Date.now() - 1 }),
        { selfControlActive: async () => false });
    assert.equal(expired.ackState, 'expired');
});

test('a Self-Control session defers the update without acknowledging it', async () => {
    const f = await familyFixture();
    const result = await f.receiver.receiveSealedItem(await f.sealedItem(), { selfControlActive: async () => true });
    assert.equal(result.ackState, 'pending');
    assert.deepEqual(childKeywords(f.store), []);
    assert.equal(f.store.ftManagedUpdateNotice, undefined);
});

test('a link removed between verification and the write stops the apply', async () => {
    const f = await familyFixture();
    const item = await f.sealedItem();
    const result = await f.receiver.receiveSealedItem(item, { selfControlActive: async () => {
        f.store.ftNanahTrustedLinks = [];
        return false;
    } });
    assert.equal(result.accepted, false);
    assert.equal(result.ackState, 'rejected');
    assert.deepEqual(childKeywords(f.store), []);
});

test('a trigger during a check queues one more check instead of being dropped', async () => {
    let runs = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const run = Receiver.createCoalescingRunner(async () => { runs += 1; if (runs === 1) await gate; return runs; });
    const first = run('a');
    run('b'); run('c');
    release();
    await first;
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(runs, 2);
});

test('the projection matches the dashboard rule for legacy link ids and current-active targets', () => {
    const legacy = Receiver.projectTrustedLink({ linkId: 'nanah-dev', remoteDeviceId: 'dev', localRole: 'replica', remoteRole: 'source',
        policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'Kid 1' } });
    assert.equal(legacy.linkId, 'nanah-dev-target-Kid-1');
    assert.equal(legacy.type, 'managed_link');
    assert.equal(legacy.sourceDeviceId, 'dev');
    const active = Receiver.projectTrustedLink({ linkId: 'x', remoteDeviceId: 'dev', localRole: 'replica', remoteRole: 'source', policy: {} });
    assert.equal(active.policy.targetProfileId, '');
    assert.equal(Receiver.explainIneligible(active, { activeProfileId: 'A', profiles: { A: { type: 'child' } } }), 'open_sync_disabled');
});

test('a courier pickup applies through runOpenSync and acks every item, including ones it cannot use', async () => {
    const f = await familyFixture({ activeProfileId: 'Child' });
    const good = await f.sealedItem({ revision: 2, word: 'jump scare' });
    const foreign = { ...(await f.sealedItem({ revision: 3 })), linkId: 'someone-else', mailboxItemId: 'mbx-foreign' };
    const broken = { ...(await f.sealedItem({ revision: 4 })), ciphertext: 'AAAA', mailboxItemId: 'mbx-broken' };
    const result = await f.receiver.runPickup({ courierItems: [good, foreign, broken], selfControlActive: async () => false });
    assert.deepEqual(result.appliedProfileIds, ['Child']);
    assert.deepEqual(childKeywords(f.store), ['jump scare']);
    const byId = Object.fromEntries(result.acks.map(row => [row.mailboxItemId, row]));
    assert.equal(byId[good.mailboxItemId].ackState, 'delivered');
    assert.equal(byId[good.mailboxItemId].applied, true);
    assert.equal(byId['mbx-foreign'].reason, 'no_eligible_link');
    assert.equal(byId['mbx-broken'].reason, 'courier_open_failed');
    for (const row of result.acks) {
        assert.equal(row.schema, 'filtertube_nanah_managed_open_sync_ack');
        assert.equal(JSON.stringify(row).includes('jump scare'), false, 'acks never carry filter data');
    }
    assert.equal(f.store.ftManagedUpdateNotice.activeChanged, true);
});

test('a courier item deferred by Self-Control gets no ack, so it stays queued on the parent', async () => {
    const f = await familyFixture();
    const item = await f.sealedItem();
    const result = await f.receiver.runPickup({ courierItems: [item], selfControlActive: async () => true });
    assert.deepEqual(result.acks, []);
    assert.deepEqual(result.appliedProfileIds, []);
});
