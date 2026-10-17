import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Reuse the real two-peer/Ed25519/IO fixture without registering its tests.
const fixtureUrl = new URL('./nanah-managed-shared-link-handshake-current-behavior.test.mjs', import.meta.url);
let fixture = fs.readFileSync(fixtureUrl, 'utf8').split("test('production first Apply+Save")[0];
fixture = fixture.replace("'./helpers/nanah-storage-lock-fixture.mjs'", JSON.stringify(new URL('./helpers/nanah-storage-lock-fixture.mjs', import.meta.url).href));
fixture = fixture.replace('new URL(`../../js/${name}.js`, import.meta.url)', `new URL(\`${new URL('../../js/', import.meta.url).href}\${name}.js\`)`);
// Distinct receive times make overlapping same-policy ACK writes reproducible.
fixture = fixture.replace('now: () => Date.now()', 'now: () => ++receiptClock');
fixture += '\nlet receiptClock = 1800000000000;';
const { setup } = await import(`data:text/javascript;base64,${Buffer.from(`${fixture}\nexport { setup };`).toString('base64')}`);
const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
function section(a, b) { const i = tab.indexOf(a), j = tab.indexOf(b, i); assert.ok(i > 0 && j > i); return tab.slice(i, j); }

async function paired() {
  const f = await setup();
  const { envelope } = await f.prepareFirst();
  await f.receiver.box.handleNanahIncomingProposal(envelope);
  return f;
}
async function receiverAcks(f, envelopes) {
  const box = f.receiver.box;
  const producer = box.FilterTubeNanahManagedLivePolicy.create({ normalizeString: box.normalizeString,
    safeObject: box.safeObject, normalizeNonNegativeInteger: box.normalizeNonNegativeInteger,
    getStableDeviceId: () => box.nanahStableDeviceId, now: () => Date.now() });
  const receipts = [];
  box.sendNanahManagedLivePolicyAck = async (envelope, decision) => {
    receipts.push(producer.buildLiveAckPayload(envelope, decision));
  };
  for (const envelope of envelopes) await box.handleNanahIncomingManagedPolicyEnvelope(envelope);
  assert.ok(receipts.every(receipt => receipt.records.every(row => row.accepted)), JSON.stringify(receipts));
  return receipts;
}

test('actual persisted multi-area receiver receipts can arrive concurrently and repeat without losing Applied', async () => {
  const f = await paired();
  const envelopes = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, f.source.box.nanahTrustedLinks);
  for (const envelope of envelopes) await f.helpers.markSent(envelope.linkId, envelope.scope, envelope.revision, envelope.policyHash);
  const sentStates = clone(f.source.storage.ftNanahTrustedLinks[0].policy.outgoingManagedPolicies);
  const acks = await receiverAcks(f, envelopes);
  const recorded = await Promise.all(acks.flatMap(ack => [f.helpers.recordLiveAckPayload(ack), f.helpers.recordLiveAckPayload(ack)]));
  assert.ok(recorded.every(result => result.ok), JSON.stringify(recorded));
  assert.ok(f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId].kids.blockedKeywords.some(row => row.word === 'first-selected-kids'));
  const stored = f.source.storage.ftNanahTrustedLinks[0].policy;
  for (const envelope of envelopes) {
    const state = stored.outgoingManagedPolicies[envelope.scope];
    assert.equal(state.revision, envelope.revision);
    assert.equal(state.policyHash, envelope.policyHash);
    assert.equal(state.lastAckResult, 'accepted');
    assert.equal(state.lastAckState, 'delivered');
    assert.equal(state.sentAt, sentStates[envelope.scope].sentAt);
    const newestReceipt = Math.max(...recorded.filter(result => result.latest.scope === envelope.scope).map(result => result.latest.receivedAt));
    assert.equal(state.lastAckAt, newestReceipt);
  }
});

test('actual incoming source handler accepts repeated applied receipts without its transport error path', async () => {
  const f = await paired();
  f.source.box.nanahManagedLivePolicy = f.helpers;
  vm.runInContext(section('    async function handleNanahIncomingManagedLiveAck(', '    async function handleNanahIncomingProposal('), f.source.box);
  const envelopes = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, f.source.box.nanahTrustedLinks);
  for (const envelope of envelopes) await f.helpers.markSent(envelope.linkId, envelope.scope, envelope.revision, envelope.policyHash);
  const acks = await receiverAcks(f, envelopes);
  await Promise.all(acks.flatMap(ack => [f.source.box.handleNanahIncomingManagedLiveAck(ack), f.source.box.handleNanahIncomingManagedLiveAck(ack)]));
  assert.equal(f.source.storage.ftNanahTrustedLinks[0].policy.inboundManagedAckHistory.length, acks.length * 2);
  assert.ok(f.source.calls.toasts.filter(row => row[1] === 'success').length >= acks.length);
});

test('concurrent receipts for an older revision or foreign target cannot confirm the latest sent policy', async () => {
  const f = await paired();
  const [sent] = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, f.source.box.nanahTrustedLinks);
  await f.helpers.markSent(sent.linkId, sent.scope, sent.revision, sent.policyHash);
  const [oldAck] = await receiverAcks(f, [sent]);
  await f.helpers.markSent(sent.linkId, sent.scope, sent.revision + 1, 'newer-policy-hash');
  const before = clone(f.source.storage.ftNanahTrustedLinks);
  const results = await Promise.all([f.helpers.recordLiveAckPayload(oldAck), f.helpers.recordLiveAckPayload(oldAck),
    f.helpers.recordLiveAckPayload({ ...oldAck, targetProfileId: 'another-receiving-child' })]);
  assert.ok(results.every(result => !result.ok && result.recordedCount === 0));
  assert.deepEqual(f.source.storage.ftNanahTrustedLinks, before);
});
