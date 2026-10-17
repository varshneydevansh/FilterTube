import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `Missing runtime function ${startMarker}`);
  return source.slice(start, end);
}
const runtime = [
  between('    function getNanahOutgoingManagedPolicyStateByScope(', '    function getNanahManagedSourceAckEligibleLinks('),
  between('    function formatNanahManagedSourceAckSyncStatus(', '    async function handleNanahIncomingManagedRemoteDeliveryAck(')
].join('\n');

function formatter(providerState = { reasonCode: 'delivery_ack_provider_unavailable' }) {
  const context = {
    Date: { now: () => 10000 },
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: value => Array.isArray(value) ? value : [],
    NANAH_MANAGED_SOURCE_ACK_FRESH_MS: 1000,
    nanahManagedSourceAckSyncState: providerState
  };
  vm.runInNewContext(runtime, context);
  return context.formatNanahManagedSourceAckSyncStatus;
}

function sent(overrides = {}) {
  return { revision: 2, policyHash: 'current-policy', sentAt: 100, ...overrides };
}
function applied(overrides = {}) {
  return sent({ lastAckAt: 110, lastAckState: 'delivered', lastAckResult: 'accepted', ...overrides });
}
function link(states = {}, overrides = {}) {
  return {
    linkId: 'link-1', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
    policy: { outgoingManagedPolicies: states }, ...overrides
  };
}

test('a validated live receipt shows Applied without requiring any pickup receipt service', () => {
  const format = formatter();
  assert.equal(format(link({ keywords: applied() })), 'Applied');
  assert.equal(format(link({ keywords: applied(), channels: applied() })), 'Applied');
});

test('validated terminal rejection states remain visible without a pickup receipt service', () => {
  const format = formatter();
  for (const [state, label] of [['rejected', 'Rejected'], ['conflict', 'Conflict'], ['expired', 'Expired'], ['revoked', 'Revoked']]) {
    assert.equal(format(link({ keywords: sent({ lastAckAt: 110, lastAckState: state, lastAckResult: state }) })), label);
  }
});

test('mixed batches show applied, rejected, and pending scopes without claiming the whole update applied', () => {
  const format = formatter();
  assert.equal(format(link({ keywords: applied(), channels: sent() })), '1/2 updates applied | 1 waiting for receipt');
  assert.equal(format(link({
    keywords: applied(), channels: sent({ lastAckAt: 110, lastAckState: 'rejected', lastAckResult: 'rejected' }), videos: sent()
  })), '1/3 updates applied | 1 rejected | 1 waiting for receipt');
});

test('sending alone and old acknowledgment timestamps cannot produce Applied', () => {
  const format = formatter();
  assert.equal(format(link({ keywords: sent() })), 'Waiting for send receipt');
  assert.equal(format(link({ keywords: applied({ sentAt: 200 }) })), 'Waiting for send receipt');
  assert.equal(format(link({ keywords: applied({ lastAckAt: null }) })), 'Waiting for send receipt');
  assert.equal(format(link({ keywords: applied({ lastAckResult: 'rejected' }) })), 'Waiting for send receipt');
});

test('old aggregate pickup counters cannot confirm a newer sent policy', () => {
  const format = formatter({ checkedAt: 10000, linkResults: [{ linkId: 'link-1', recordedAckCount: 1, ackPayloadCount: 1, ok: true }] });
  assert.equal(format(link({ keywords: sent({ revision: 3, policyHash: 'newer-policy' }) })), 'Waiting for send receipt');
});

test('current validated receipts take priority over failed or stale provider checks', () => {
  for (const providerState of [
    { checkedAt: 1, linkResults: [{ linkId: 'link-1', ok: false }] },
    { checkedAt: 10000, linkResults: [{ linkId: 'link-1', ok: false }] }
  ]) assert.equal(formatter(providerState)(link({ keywords: applied() })), 'Applied');
});

test('invalid pickup receipt records are distinct from actual update rejection', () => {
  const format = formatter({ checkedAt: 10000, linkResults: [{ linkId: 'link-1', rejectedAckCount: 2, ackPayloadCount: 2, ok: true }] });
  assert.equal(format(link({ keywords: sent() })), '2 receipts ignored');
});

test('empty and unrelated links retain their existing feedback boundaries', () => {
  const format = formatter({});
  assert.equal(format(link()), 'No sent policy');
  assert.equal(format(link({ keywords: sent() })), 'Waiting for send receipt');
  assert.equal(format(link({ keywords: applied() }, { localRole: 'replica', remoteRole: 'source' })), '');
  assert.equal(format(link({ keywords: applied() }, { linkType: 'peer_link' })), '');
});
