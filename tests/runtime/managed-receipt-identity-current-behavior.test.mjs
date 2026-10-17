import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/nanah_managed_live_policy.js', import.meta.url), 'utf8');
const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const normalizeString = value => typeof value === 'string' ? value.trim() : '';
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const normalizeNonNegativeInteger = value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const schemas = ['filtertube_nanah_managed_live_ack', 'filtertube_nanah_managed_open_sync_ack', 'filtertube_managed_local_network_candidate_ack'];
function fixture({ legacyPolicyIdentity = false } = {}) {
  let now = 1000;
  const known = { sourceDeviceId: 'sender-device', sourceProfileId: 'sender-parent',
    targetDeviceId: 'receiver-device', targetProfileId: 'receiver-child' };
  const link = { linkId: 'link-child', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
    remoteDeviceId: known.targetDeviceId,
    ...(legacyPolicyIdentity ? {} : known),
    policy: { ...known, outgoingManagedPolicies: { kids: { revision: 2, policyHash: 'policy-2', sentAt: 100 } } } };
  const updates = [];
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const base = { normalizeString, safeObject, normalizeNonNegativeInteger,
    normalizeTrustedLink: value => value, getStableDeviceId: () => known.sourceDeviceId,
    getLocalProfileContext: () => ({ profileId: 'unrelated-active-parent' }),
    findTrustedLinkById: id => id === link.linkId ? link : null,
    updateTrustedLinkPolicy: async (_, patch) => {
      updates.push(clone(patch)); link.policy = { ...link.policy, ...clone(patch.policy) }; return true;
    }, now: () => now++ };
  const create = context.window.FilterTubeNanahManagedLivePolicy.create;
  const helper = create(base);
  const receiver = create({ ...base, getStableDeviceId: () => known.targetDeviceId });
  const envelope = { type: 'filtertube_managed_policy', linkId: link.linkId, ...known,
    scope: 'kids', revision: 2, policyHash: 'policy-2' };
  function ack(schema = schemas[0]) {
    const live = receiver.buildLiveAckPayload(envelope, { accepted: true, applied: true, decision: 'accept_newer_revision' });
    return { ...live, schema };
  }
  const record = value => value.schema === schemas[0]
    ? helper.recordLiveAckPayload(value) : helper.recordRemoteDeliveryAckPayload(value);
  return { helper, receiver, link, updates, known, envelope, ack, record, base, create };
}

for (const schema of schemas) {
  test(`${schema}: all paired identities accept a current receipt`, async () => {
    const f = fixture();
    const result = await f.record(f.ack(schema));
    assert.equal(result.ok, true);
    assert.equal(result.recordedCount, 1);
    assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, 'accepted');
    assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckTargetProfileId, 'receiver-child');
    assert.equal(f.updates.length, 1);
  });

  for (const field of ['sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId']) {
    for (const missing of [false, true]) {
      test(`${schema}: ${missing ? 'missing' : 'different'} ${field} never records Applied`, async () => {
        const f = fixture(), value = f.ack(schema);
        if (missing) delete value[field]; else value[field] = 'another-identity';
        const result = await f.record(value);
        assert.equal(result.ok, false);
        assert.equal(result.recordedCount, 0);
        assert.equal(f.updates.length, 0);
        assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, undefined);
      });
    }
  }
}

test('receiver-produced live ack uses receiver device identity instead of source helper identity', async () => {
  const f = fixture();
  assert.equal(f.ack().targetDeviceId, 'receiver-device');
  const incorrect = f.helper.buildLiveAckPayload(f.envelope, { accepted: true, applied: true });
  assert.equal(incorrect.targetDeviceId, 'sender-device');
  assert.equal((await f.record(incorrect)).reason, 'target_device_mismatch');
});

test('legacy normalized links may supply pinned identities in policy and receiver device as remoteDeviceId', async () => {
  const f = fixture({ legacyPolicyIdentity: true });
  delete f.link.policy.targetDeviceId;
  assert.equal((await f.record(f.ack())).ok, true);
});

test('missing saved source identity cannot be replaced by the currently active parent', async () => {
  const f = fixture(); delete f.link.sourceProfileId; delete f.link.policy.sourceProfileId;
  assert.equal((await f.record(f.ack())).reason, 'missing_trusted_source_profile');
  assert.equal(f.updates.length, 0);
});

test('record-level identities cannot contradict their aggregate receipt binding', async () => {
  for (const field of ['sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId']) {
    const f = fixture(), value = f.ack();
    value.records[0][field] = 'another-identity';
    assert.equal((await f.record(value)).ok, false, field);
    assert.equal(f.updates.length, 0);
  }
});

test('a mismatched row does not prevent an independently valid scope receipt being recorded', async () => {
  const f = fixture(), value = f.ack();
  value.records.push({ ...value.records[0], targetProfileId: 'other-child' });
  const result = await f.record(value);
  assert.equal(result.recordedCount, 1);
  assert.equal(f.link.policy.inboundManagedAckHistory.length, 1);
  assert.equal(f.link.policy.inboundManagedAckHistory[0].targetProfileId, 'receiver-child');
});

test('stale revision/hash and wrong fixed child cannot claim the newest recipient update', async () => {
  for (const change of [value => { value.records[0].revision = 1; },
    value => { value.records[0].policyHash = 'old-policy'; },
    value => { value.targetProfileId = 'receiver-sibling'; }]) {
    const f = fixture(), value = f.ack(); change(value);
    assert.equal((await f.record(value)).ok, false);
    assert.equal(f.updates.length, 0);
  }
});

test('recording mixed validated receipts retains distinct applied/rejected/pending state', async () => {
  const f = fixture(), value = f.ack();
  f.link.policy.outgoingManagedPolicies.main = { revision: 1, policyHash: 'main-policy', sentAt: 100 };
  f.link.policy.outgoingManagedPolicies.keywords = { revision: 1, policyHash: 'keyword-policy', sentAt: 100 };
  value.records.push({ scope: 'main', revision: 1, policyHash: 'main-policy', ackState: 'rejected', reason: 'scope_not_allowed' });
  const result = await f.record(value);
  assert.equal(result.recordedCount, 2);
  const between = (start, end) => tab.slice(tab.indexOf(start), tab.indexOf(end, tab.indexOf(start) + start.length));
  const context = { normalizeString, safeObject, normalizeNonNegativeInteger,
    safeArray: value => Array.isArray(value) ? value : [], Date: { now: () => 2000 },
    NANAH_MANAGED_SOURCE_ACK_FRESH_MS: 1000,
    nanahManagedSourceAckSyncState: { reasonCode: 'delivery_ack_provider_unavailable' } };
  vm.runInNewContext(between('    function getNanahOutgoingManagedPolicyStateByScope(', '    function getNanahManagedSourceAckEligibleLinks(')
    + between('    function formatNanahManagedSourceAckSyncStatus(', '    async function handleNanahIncomingManagedRemoteDeliveryAck('), context);
  assert.equal(context.formatNanahManagedSourceAckSyncStatus(f.link), '1/3 updates applied | 1 rejected | 1 waiting for receipt');
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('a receipt arriving inside transport send waits for successful send bookkeeping', async () => {
  const f = fixture(); f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  const result = await f.helper.sendLiveEnvelope(f.envelope, async outbound => {
    assert.notEqual(outbound, f.envelope, 'transport receives a detached envelope');
    const receipt = await f.record(f.ack());
    assert.equal(receipt.ok, false);
    assert.equal(receipt.reason, 'live_send_bookkeeping_pending');
    assert.equal(receipt.queuedCount, 1);
    assert.equal(f.updates.length, 0);
    assert.equal(f.link.policy.outgoingManagedPolicies.kids.revision, 2);
  });
  assert.equal(result.recordedAckCount, 1);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.revision, 3);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, 'accepted');
  assert.equal(f.updates.length, 2, 'mark then accepted receipt are separate successful writes');
});

test('a receipt arriving while markSent is awaiting persistence is retained', async () => {
  const f = fixture(), entered = deferred(), release = deferred();
  f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  const write = f.base.updateTrustedLinkPolicy;
  f.base.updateTrustedLinkPolicy = async (id, patch) => {
    if (patch.policy.outboundManagedPolicyHistory) { entered.resolve(); await release.promise; }
    return write(id, patch);
  };
  const sending = f.helper.sendLiveEnvelope(f.envelope, async () => {});
  await entered.promise;
  assert.equal((await f.record(f.ack())).reason, 'live_send_bookkeeping_pending');
  assert.equal(f.updates.length, 0);
  release.resolve();
  assert.equal((await sending).recordedAckCount, 1);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, 'accepted');
});

test('same-revision retransmit queues its receipt before markSent can reset earlier matching state', async () => {
  const f = fixture();
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.revision, f.envelope.revision);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.policyHash, f.envelope.policyHash);
  const result = await f.helper.sendLiveEnvelope(f.envelope, async () => {
    assert.equal((await f.record(f.ack())).reason, 'live_send_bookkeeping_pending');
    assert.equal(f.updates.length, 0, 'matching old outgoing state must not bypass the pending send');
  });
  assert.equal(result.recordedAckCount, 1);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, 'accepted');
  assert.equal(f.link.policy.inboundManagedAckHistory.length, 1);
});

test('failed transport discards early receipts without creating sent/applied state or blocking retry', async () => {
  const f = fixture(); f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  await assert.rejects(f.helper.sendLiveEnvelope(f.envelope, async () => {
    await f.record(f.ack()); throw new Error('transport failed');
  }), /transport failed/);
  assert.equal(f.updates.length, 0);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.revision, 2);
  const retry = await f.helper.sendLiveEnvelope(f.envelope, async () => {});
  assert.equal(retry.recordedAckCount, 0);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, undefined);
});

test('failed markSent discards early receipts and clears pending registry for retry', async () => {
  const f = fixture(); f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  const write = f.base.updateTrustedLinkPolicy;
  f.base.updateTrustedLinkPolicy = async () => false;
  await assert.rejects(f.helper.sendLiveEnvelope(f.envelope, async () => { await f.record(f.ack()); }), /could not be recorded/);
  assert.equal(f.updates.length, 0);
  f.base.updateTrustedLinkPolicy = write;
  assert.equal((await f.helper.sendLiveEnvelope(f.envelope, async () => {})).recordedAckCount, 0);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, undefined);
});

test('concurrent sends for the same link/scope cannot overwrite pending receipt ownership', async () => {
  const f = fixture(), release = deferred();
  const first = f.helper.sendLiveEnvelope(f.envelope, async () => { await release.promise; });
  let extraSends = 0;
  await assert.rejects(f.helper.sendLiveEnvelope(f.envelope, async () => { extraSends += 1; }), /already being sent/);
  assert.equal(extraSends, 0);
  release.resolve(); await first;
});

test('unknown future receipts and wrong-device receipts are never queued for a pending send', async () => {
  const f = fixture(); f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  const result = await f.helper.sendLiveEnvelope(f.envelope, async () => {
    const future = f.ack(); future.records[0].revision = 4; future.records[0].policyHash = 'policy-4';
    assert.equal((await f.record(future)).reason, 'no_matching_ack_records');
    const wrong = f.ack(); wrong.targetDeviceId = 'another-device';
    assert.equal((await f.record(wrong)).reason, 'target_device_mismatch');
  });
  assert.equal(result.recordedAckCount, 0);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, undefined);
});

test('revocation during sending discards queued receipts and prevents bookkeeping', async () => {
  const f = fixture(); f.envelope.revision = 3; f.envelope.policyHash = 'policy-3';
  await assert.rejects(f.helper.sendLiveEnvelope(f.envelope, async () => {
    await f.record(f.ack()); f.link.revoked = true;
    assert.equal((await f.record(f.ack())).reason, 'link_revoked');
  }), /link_revoked/);
  assert.equal(f.updates.length, 0);
  f.link.revoked = false;
  assert.equal((await f.helper.sendLiveEnvelope(f.envelope, async () => {})).recordedAckCount, 0);
});

test('revocation while bookkeeping waits prevents queued Applied feedback', async () => {
  const f = fixture(), write = f.base.updateTrustedLinkPolicy;
  f.base.updateTrustedLinkPolicy = async (id, patch) => {
    f.link.revoked = true; return write(id, patch);
  };
  await assert.rejects(f.helper.sendLiveEnvelope(f.envelope, async () => { await f.record(f.ack()); }), /link_revoked/);
  assert.equal(f.link.policy.outgoingManagedPolicies.kids.lastAckResult, undefined);
  assert.equal(f.link.policy.inboundManagedAckHistory, undefined);
});

test('a source-operation helper shares the root pending registry', async () => {
  const f = fixture();
  f.base.getPolicySourceProfile = () => ({ profileId: 'selected-child', profile: { settings: {} } });
  const operation = f.helper.createSendOperation();
  const result = await f.helper.sendLiveEnvelope(f.envelope, async () => {
    assert.equal((await operation.recordLiveAckPayload(f.ack())).reason, 'live_send_bookkeeping_pending');
  });
  assert.equal(result.recordedAckCount, 1);
});

test('duplicate early receipt states stay bounded and do not repeat history entries', async () => {
  const f = fixture();
  const result = await f.helper.sendLiveEnvelope(f.envelope, async () => {
    for (let index = 0; index < 20; index += 1) await f.record(f.ack());
  });
  assert.equal(result.recordedAckCount, 1);
  assert.equal(f.link.policy.inboundManagedAckHistory.length, 1);
});

test('ordinary receipt arriving after wrapper completion still records directly', async () => {
  const f = fixture();
  assert.equal((await f.helper.sendLiveEnvelope(f.envelope, async () => {})).recordedAckCount, 0);
  assert.equal((await f.record(f.ack())).recordedCount, 1);
});
