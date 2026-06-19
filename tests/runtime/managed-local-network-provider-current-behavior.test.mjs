import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md';
const sourceAckDocPath = 'docs/audit/FILTERTUBE_MANAGED_SOURCE_DELIVERY_ACK_STATUS_2026-06-05.md';
const boundaryPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const tabViewPath = 'js/tab-view.js';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function managedLink(overrides = {}) {
  return {
    linkId: 'link-parent-child-1',
    remoteDeviceId: 'parent-device-1',
    linkType: 'managed_link',
    localRole: 'replica',
    remoteRole: 'source',
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    sourcePublicKeyId: 'parent-key-1',
    keyVersion: 2,
    policy: {
      allowedScopes: ['keywords', 'channels'],
      defaultScope: 'keywords',
      targetProfileBehavior: 'fixed_profile',
      targetProfileId: 'child-profile-1',
      lockedChildMode: 'allow_trusted_updates',
      syncOnProfileOpen: true,
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      sourcePublicKeyId: 'parent-key-1',
      keyVersion: 2
    },
    ...overrides
  };
}

function profilesV4() {
  return {
    activeProfileId: 'child-profile-1',
    profiles: {
      'child-profile-1': { id: 'child-profile-1', type: 'child', parentProfileId: 'parent-profile-1' }
    }
  };
}

function eligibleLinks(links, activeProfileId, profiles) {
  const profileMap = profiles.profiles || {};
  return links.filter((link) => {
    const policy = link.policy || {};
    const targetProfileId = policy.targetProfileBehavior === 'fixed_profile' ? policy.targetProfileId : activeProfileId;
    return link.linkType === 'managed_link'
      && link.localRole === 'replica'
      && link.remoteRole === 'source'
      && link.revoked !== true
      && policy.revoked !== true
      && link.keyRevoked !== true
      && policy.keyRevoked !== true
      && link.stalePairing !== true
      && policy.stalePairing !== true
      && policy.syncOnProfileOpen === true
      && policy.lockedChildMode === 'allow_trusted_updates'
      && targetProfileId === activeProfileId
      && !!profileMap[targetProfileId]
      && !!(link.sourceDeviceId || policy.sourceDeviceId || link.remoteDeviceId)
      && !!(link.sourceProfileId || policy.sourceProfileId)
      && !!(link.sourcePublicKeyId || policy.sourcePublicKeyId);
  });
}

async function runProviderModel({
  provider,
  links = [managedLink()],
  applyCandidate = async () => ({ accepted: true }),
  ackCandidates = null,
  recordAckHistory = null
} = {}) {
  const activeProfileId = 'child-profile-1';
  const candidates = eligibleLinks(links, activeProfileId, profilesV4());
  const state = {
    providerAvailable: !!provider,
    eligibleLinkCount: candidates.length,
    candidateCount: 0,
    acceptedCandidateCount: 0,
    rejectedCandidateCount: 0,
    ackAttemptedCount: 0,
    ackedCandidateCount: 0,
    ackFailedCount: 0,
    ackHistoryRecordedCount: 0,
    linkResults: []
  };
  if (!provider || candidates.length === 0) return state;
  for (const link of candidates) {
    let result;
    try {
      result = await provider({
        schema: 'filtertube_managed_local_network_discovery_request',
        linkId: link.linkId,
        targetProfileId: activeProfileId,
        allowedScopes: link.policy.allowedScopes,
        sourcePublicKeyId: link.sourcePublicKeyId
      });
    } catch (error) {
      result = { ok: false, reason: error.message, candidates: [] };
    }
    const items = result?.ok === false ? [] : (Array.isArray(result) ? result : (result.candidates || result.items || []));
    const row = {
      linkId: link.linkId,
      ok: result?.ok !== false,
      candidateCount: items.length,
      acceptedCandidateCount: 0,
      rejectedCandidateCount: 0,
      ackAttemptedCount: 0,
      ackedCandidateCount: 0,
      ackFailedCount: 0,
      ackHistoryRecordedCount: 0
    };
    state.candidateCount += items.length;
    const ackRecords = [];
    if (row.ok) {
      for (const [index, item] of items.entries()) {
        const decision = await applyCandidate(item, index);
        if (decision?.accepted === true || decision?.applied === true) {
          row.acceptedCandidateCount += 1;
          state.acceptedCandidateCount += 1;
        } else {
          row.rejectedCandidateCount += 1;
          state.rejectedCandidateCount += 1;
        }
        ackRecords.push({
          linkId: link.linkId,
          localNetworkCandidateId: item.candidateId || `candidate-${index}`,
          sourceDeviceId: link.sourceDeviceId,
          sourceProfileId: link.sourceProfileId,
          targetProfileId: activeProfileId,
          scope: item.envelope?.scope || 'keywords',
          revision: item.envelope?.revision || 5 + index,
          policyHash: item.envelope?.policyHash || `sha256:policy-${index}`,
          ackState: decision?.accepted === true || decision?.applied === true ? 'accepted' : 'rejected',
          accepted: decision?.accepted === true || decision?.applied === true,
          applied: decision?.applied !== false && (decision?.accepted === true || decision?.applied === true),
          reason: decision?.accepted === true || decision?.applied === true ? null : (decision?.reason || 'local_network_candidate_rejected')
        });
      }
    }
    if (ackRecords.length > 0) {
      const ackPayload = {
        schema: 'filtertube_managed_local_network_candidate_ack',
        linkId: link.linkId,
        sourceDeviceId: link.sourceDeviceId,
        sourceProfileId: link.sourceProfileId,
        targetProfileId: activeProfileId,
        records: ackRecords
      };
      const ackResult = ackCandidates
        ? await ackCandidates(ackPayload)
        : { ok: false, reason: 'ack_provider_unavailable', ackedCandidateCount: 0, failedAckCount: ackRecords.length };
      row.ackAttemptedCount = ackRecords.length;
      row.ackedCandidateCount = ackResult.ackedCandidateCount || 0;
      row.ackFailedCount = ackResult.failedAckCount || 0;
      state.ackAttemptedCount += row.ackAttemptedCount;
      state.ackedCandidateCount += row.ackedCandidateCount;
      state.ackFailedCount += row.ackFailedCount;
      if (recordAckHistory) {
        const history = await recordAckHistory({ request: ackPayload, records: ackRecords, ackResult, transport: 'local_network' });
        row.ackHistoryRecordedCount = history.recordedCount || 0;
        state.ackHistoryRecordedCount += row.ackHistoryRecordedCount;
      }
    }
    state.linkResults.push(row);
  }
  return state;
}

test('local-network provider hook is docs-backed and linked from managed parent plan', () => {
  const doc = read(docPath);
  const sourceAckDoc = read(sourceAckDocPath);
  const boundary = read(boundaryPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Dashboard\/profile-open provider hook and redacted provider ack\s+handoff are present/);
  assert.match(doc, /Built-in LAN\s+peer discovery and LAN transport remain absent/);
  assert.match(doc, /Browser HTTPS mailbox\s+pull\/decrypt is handled by the separate configured mailbox client and does not\s+grant local-network authority/);
  assert.match(doc, /window\.FilterTubeManagedPolicyLocalNetwork/);
  assert.match(doc, /discoverManagedPolicyCandidates/);
  assert.match(doc, /ackManagedPolicyCandidates/);
  assert.match(doc, /checkManagedLocalNetworkBridge/);
  assert.match(doc, /managed-local-network\/health/);
  assert.match(doc, /A successful health response means only that the bridge endpoint\s+answered/);
  assert.match(doc, /filtertube_managed_local_network_candidate_ack/);
  assert.match(doc, /runtime provider-gated local-network discovery hook: present/);
  assert.match(doc, /runtime local-network provider ack handoff: present/);
  assert.match(doc, /runtime protected local-network ack-handoff history writer: present/);
  assert.match(doc, /runtime local-network provider readiness check: present and non-authoritative/);
  assert.match(doc, /runtime built-in LAN peer discovery: absent/);
  assert.match(doc, /runtime YouTube page hot-path work from this slice: absent/);
  assert.match(doc, /No matching parent link \(age\)/);
  assert.match(doc, /Waiting for Home Bridge \(age\)/);
  assert.match(doc, /N accepted, M rejected, K ack failed \(age\)/);
  assert.match(doc, /last provider-check timestamp/);
  assert.match(doc, new RegExp(sourceAckDocPath));
  assert.match(sourceAckDoc, /Source-side mailbox\/local-network delivery ack intake and dashboard\s+status are present/);
  assert.match(sourceAckDoc, /filtertube_managed_source_delivery_ack_request/);
  assert.match(sourceAckDoc, /runtime source-side provider-gated ack pull: present/);
  assert.match(sourceAckDoc, /runtime built-in configured-provider delivery ack pull: present/);
  assert.match(sourceAckDoc, /runtime YouTube page hot-path work from this slice: absent/);
  assert.match(boundary, /provider-gated local-network candidate discovery hook/);
  assert.match(boundary, /redacted\s+provider ack handoff/);
  assert.match(plan, new RegExp(docPath));
  assert.match(plan, new RegExp(sourceAckDocPath));
  assert.match(inventory, new RegExp(docPath));
  assert.match(inventory, /provider-fed mailbox\/local-network delivery acks can now be recorded/);
});

test('dashboard source wires provider-gated local-network discovery without YouTube hot-path primitives', () => {
  const source = read(tabViewPath);

  assert.match(source, /const NANAH_MANAGED_LOCAL_NETWORK_SYNC_STATE_KEY = 'ftNanahManagedLocalNetworkSyncState'/);
  assert.match(source, /function getNanahManagedLocalNetworkProvider\(\)/);
  assert.match(source, /window\.FilterTubeManagedPolicyLocalNetwork/);
  assert.match(source, /function buildNanahManagedLocalNetworkDiscoveryRequest\(link, activeId, reason\)/);
  assert.match(source, /schema: 'filtertube_managed_local_network_discovery_request'/);
  assert.match(source, /function getNanahManagedLocalNetworkEligibleLinks\(activeId, localProfilesV4\)/);
  assert.match(source, /async function pullNanahManagedLocalNetworkCandidates\(provider, request\)/);
  assert.match(source, /discoverManagedPolicyCandidates/);
  assert.match(source, /discoverLocalNetworkCandidates/);
  assert.match(source, /checkManagedLocalNetworkBridge/);
  assert.match(source, /Home Bridge saved and reachable/);
  assert.match(source, /Home Bridge saved, but it did not answer the readiness check/);
  assert.match(source, /filtertube_managed_local_network_candidate_ack/);
  assert.match(source, /ackManagedPolicyCandidates/);
  assert.match(source, /ackLocalNetworkCandidates/);
  assert.match(source, /remote_policy\.local_network\.ack/);
  assert.match(source, /Home Bridge receipt recorded/);
  assert.match(source, /async function runNanahManagedLocalNetworkSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(source, /appendLocalNetworkCheckedAge/);
  assert.match(source, /No matching parent link/);
  assert.match(source, /Waiting for Home Bridge/);
  assert.match(source, /\$\{accepted\} accepted, \$\{rejected\} rejected, \$\{ackFailed\} ack failed/);
  assert.match(source, /Home Bridge rejected/);
  assert.match(source, /No updates/);
  assert.match(source, /handleNanahIncomingManagedLocalNetworkCandidate\(candidate\)/);
  assert.match(source, /recordManagedOpenSyncAckHistory\(\{\s*request,\s*records: ackRecords,\s*ackResult,\s*transport: 'local_network'/s);
  assert.match(source, /function runNanahManagedBackgroundSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(source, /await runNanahManagedLocalNetworkSync\(\{ reason: normalizedReason \}\)/);
  assert.match(source, /void runNanahManagedBackgroundSync\(\{ reason: 'dashboard_open' \}\)/);
  assert.match(source, /void runNanahManagedBackgroundSync\(\{ reason: 'profile_switch' \}\)/);
  assert.doesNotMatch(source, /await runNanahManagedLocalNetworkSync\(\{ reason: 'profile_switch' \}\)/);
  assert.match(source, /Home Bridge/);
});

test('dashboard source wires provider-gated parent delivery ack status without YouTube hot-path primitives', () => {
  const source = read(tabViewPath);

  assert.match(source, /const NANAH_MANAGED_SOURCE_ACK_SYNC_STATE_KEY = 'ftNanahManagedSourceAckSyncState'/);
  assert.match(source, /function getNanahManagedSourceAckProvider\(\)/);
  assert.match(source, /window\.FilterTubeManagedPolicyDeliveryAcks/);
  assert.match(source, /window\.FilterTubeManagedPolicyMailbox/);
  assert.match(source, /window\.FilterTubeManagedPolicyLocalNetwork/);
  assert.match(source, /filtertube_managed_delivery_ack_aggregate_provider/);
  assert.match(source, /function buildNanahManagedSourceAckRequest\(link, reason\)/);
  assert.match(source, /schema: 'filtertube_managed_source_delivery_ack_request'/);
  assert.match(source, /function getNanahManagedSourceAckEligibleLinks\(\)/);
  assert.match(source, /async function pullNanahManagedSourceDeliveryAcks\(provider, request\)/);
  assert.match(source, /pullManagedDeliveryAcks/);
  assert.match(source, /pullRemoteDeliveryAcks/);
  assert.match(source, /getManagedDeliveryAcks/);
  assert.match(source, /async function runNanahManagedSourceAckSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(source, /handleNanahIncomingManagedRemoteDeliveryAck\(ackPayload, \{ silent: true \}\)/);
  assert.match(source, /function runNanahManagedBackgroundSync\(\{ reason = 'dashboard_open' \} = \{\}\)/);
  assert.match(source, /await runNanahManagedSourceAckSync\(\{ reason: normalizedReason \}\)/);
  assert.match(source, /void runNanahManagedBackgroundSync\(\{ reason: 'dashboard_open' \}\)/);
  assert.match(source, /void runNanahManagedBackgroundSync\(\{ reason: 'profile_switch' \}\)/);
  assert.doesNotMatch(source, /await runNanahManagedSourceAckSync\(\{ reason: 'profile_switch' \}\)/);
  assert.match(source, /Delivery receipts/);

  const sliceStart = source.indexOf('function getNanahManagedSourceAckProvider()');
  const sliceEnd = source.indexOf('async function configureNanahTrustedLink(link)', sliceStart);
  assert.notEqual(sliceStart, -1);
  assert.notEqual(sliceEnd, -1);
  const slice = source.slice(sliceStart, sliceEnd);
  assert.doesNotMatch(slice, /MutationObserver/);
  assert.doesNotMatch(slice, /addEventListener/);
  assert.doesNotMatch(slice, /setInterval/);
  assert.doesNotMatch(slice, /\bfetch\s*\(/);
  assert.doesNotMatch(slice, /XMLHttpRequest/);
  assert.doesNotMatch(slice, /chrome\.tabs/);
  assert.doesNotMatch(slice, /browser\.tabs/);
});

test('local-network provider eligibility keeps discovery scoped to opted-in replica child links', () => {
  const active = 'child-profile-1';
  const profiles = profilesV4();
  const links = [
    managedLink(),
    managedLink({ linkId: 'sync-off', policy: { ...managedLink().policy, syncOnProfileOpen: false } }),
    managedLink({ linkId: 'wrong-role', localRole: 'source', remoteRole: 'replica' }),
    managedLink({ linkId: 'wrong-target', policy: { ...managedLink().policy, targetProfileId: 'sibling-profile-1' } }),
    managedLink({ linkId: 'revoked', revoked: true })
  ];

  const result = eligibleLinks(links, active, profiles);
  assert.equal(result.length, 1);
  assert.equal(result[0].linkId, 'link-parent-child-1');
});

test('local-network provider failure fails closed without applying returned candidates', async () => {
  let applied = 0;
  const state = await runProviderModel({
    provider: async () => ({
      ok: false,
      reason: 'lan_parent_unreachable',
      candidates: [{ schema: 'filtertube_managed_local_network_candidate' }]
    }),
    applyCandidate: async () => {
      applied += 1;
      return { accepted: true };
    }
  });

  assert.equal(applied, 0);
  assert.equal(state.candidateCount, 0);
  assert.equal(state.acceptedCandidateCount, 0);
  assert.equal(state.rejectedCandidateCount, 0);
  assert.equal(state.linkResults[0].ok, false);
});

test('local-network provider applies only validated candidates and keeps request/records redacted', async () => {
  const requests = [];
  const ackPayloads = [];
  const historyPayloads = [];
  const state = await runProviderModel({
    provider: async (request) => {
      requests.push(request);
      return {
        ok: true,
        candidates: [
          { schema: 'filtertube_managed_local_network_candidate', candidateId: 'candidate-a', envelope: { linkId: 'link-parent-child-1', scope: 'keywords', revision: 5, policyHash: 'sha256:policy-a' } },
          { schema: 'filtertube_managed_local_network_candidate', candidateId: 'candidate-b', envelope: { linkId: 'link-parent-child-1', scope: 'channels', revision: 6, policyHash: 'sha256:policy-b' } }
        ]
      };
    },
    applyCandidate: async (_candidate, index = 0) => ({ accepted: index === 0, reason: index === 0 ? '' : 'wrong_key' }),
    ackCandidates: async (ack) => {
      ackPayloads.push(ack);
      return { ok: true, ackedCandidateCount: ack.records.length, failedAckCount: 0 };
    },
    recordAckHistory: async (details) => {
      historyPayloads.push(details);
      return { ok: true, recordedCount: details.records.length, failedCount: 0 };
    }
  });

  assert.equal(state.candidateCount, 2);
  assert.equal(state.acceptedCandidateCount, 1);
  assert.equal(state.rejectedCandidateCount, 1);
  assert.equal(state.ackAttemptedCount, 2);
  assert.equal(state.ackedCandidateCount, 2);
  assert.equal(state.ackFailedCount, 0);
  assert.equal(state.ackHistoryRecordedCount, 2);
  assert.equal(requests[0].schema, 'filtertube_managed_local_network_discovery_request');
  assert.equal(requests[0].targetProfileId, 'child-profile-1');
  assert.deepEqual(requests[0].allowedScopes, ['keywords', 'channels']);
  assert.equal(ackPayloads[0].schema, 'filtertube_managed_local_network_candidate_ack');
  assert.deepEqual(ackPayloads[0].records.map(record => [record.localNetworkCandidateId, record.scope, record.revision, record.policyHash, record.ackState]), [
    ['candidate-a', 'keywords', 5, 'sha256:policy-a', 'accepted'],
    ['candidate-b', 'channels', 6, 'sha256:policy-b', 'rejected']
  ]);
  assert.equal(historyPayloads[0].transport, 'local_network');
  assert.doesNotMatch(JSON.stringify(requests), /spiders|keywordValue|channelName|videoTitle|plaintext|pin/i);
  assert.doesNotMatch(JSON.stringify(ackPayloads), /spiders|keywordValue|channelName|videoTitle|plaintext|pin/i);
  assert.doesNotMatch(JSON.stringify(historyPayloads), /spiders|keywordValue|channelName|videoTitle|plaintext|pin/i);
});

test('local-network provider hook does not add direct page/network runtime primitives', () => {
  const source = read(tabViewPath);
  const sliceStart = source.indexOf('function getNanahManagedLocalNetworkProvider()');
  const sliceEnd = source.indexOf('async function configureNanahTrustedLink(link)', sliceStart);
  assert.notEqual(sliceStart, -1);
  assert.notEqual(sliceEnd, -1);
  const slice = source.slice(sliceStart, sliceEnd);

  assert.doesNotMatch(slice, /MutationObserver/);
  assert.doesNotMatch(slice, /addEventListener/);
  assert.doesNotMatch(slice, /setInterval/);
  assert.doesNotMatch(slice, /\bfetch\s*\(/);
  assert.doesNotMatch(slice, /XMLHttpRequest/);
  assert.doesNotMatch(slice, /chrome\.tabs/);
  assert.doesNotMatch(slice, /browser\.tabs/);
});
