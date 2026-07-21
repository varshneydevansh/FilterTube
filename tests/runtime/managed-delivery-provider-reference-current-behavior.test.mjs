import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createManagedDeliveryProviderServer,
  getManagedDeliveryProviderHomePickupUrls
} from '../../scripts/managed-delivery-provider.mjs';

async function withProvider(options, run) {
  const server = createManagedDeliveryProviderServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/filtertube`;
  try {
    await run({ server, baseUrl });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function postJson(url, payload, token = '') {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  return { response, body };
}

function mailboxItem(overrides = {}) {
  return {
    schema: 'filtertube_managed_mailbox_item',
    version: 1,
    mailboxItemId: 'mbx-1',
    linkId: 'link-1',
    targetProfileId: 'child-1',
    targetDeviceId: 'child-device-1',
    sourceDeviceId: 'parent-device',
    sourceProfileId: 'parent-profile',
    scope: 'keywords',
    revision: 3,
    policyHash: 'sha256:policy-3',
    sourcePublicKeyId: 'key-1',
    keyVersion: 1,
    encryptedDek: 'encrypted-dek',
    nonce: 'nonce',
    ciphertext: 'ciphertext',
    ciphertextHash: 'sha256:ciphertext',
    ...overrides
  };
}

function signedCandidate(overrides = {}) {
  return {
    schema: 'filtertube_managed_local_network_candidate',
    version: 1,
    candidateId: 'cand-1',
    linkId: 'link-1',
    targetProfileId: 'child-1',
    sourceDeviceId: 'parent-device',
    sourceProfileId: 'parent-profile',
    scope: 'channels',
    revision: 9,
    policyHash: 'sha256:policy-9',
    sourcePublicKeyId: 'key-1',
    keyVersion: 2,
    envelope: {
      type: 'filtertube_managed_policy',
      linkId: 'link-1',
      targetProfileId: 'child-1',
      sourceDeviceId: 'parent-device',
      sourceProfileId: 'parent-profile',
      scope: 'channels',
      revision: 9,
      policyHash: 'sha256:policy-9',
      signature: 'signed-by-parent',
      payload: {
        scope: 'channels',
        operations: [{ type: 'replace', count: 2 }]
      }
    },
    ...overrides
  };
}

test('reference provider requires bearer token when configured', async () => {
  await withProvider({ authToken: 'provider-token' }, async ({ baseUrl }) => {
    const status = await fetch(baseUrl);
    const statusBody = await status.json();
    assert.equal(status.status, 200);
    assert.equal(statusBody.ok, true);
    assert.equal(statusBody.service, 'filtertube-managed-delivery-provider');
    assert.equal(statusBody.protocol, 'http');
    assert.equal(statusBody.authRequired, true);
    assert.equal(statusBody.authority, 'transport_only_signed_parent_policy_validation_required');
    assert.ok(statusBody.supportedPaths.includes('managed-mailbox/upload'));
    assert.ok(statusBody.supportedPaths.includes('managed-local-network/discover'));
    assert.ok(statusBody.supportedPaths.includes('managed-local-network/presence/discover'));
    assert.equal('keywords' in statusBody, false);
    assert.equal('channels' in statusBody, false);
    assert.equal('pin' in statusBody, false);

    const preflight = await fetch(`${baseUrl}/managed-local-network/health`, {
      method: 'OPTIONS',
      headers: {
        origin: 'chrome-extension://filtertube',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type, authorization'
      }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
    assert.match(preflight.headers.get('access-control-allow-headers') || '', /authorization/);

    const missing = await postJson(`${baseUrl}/managed-local-network/health`, {});
    assert.equal(missing.response.status, 401);
    assert.equal(missing.body.ok, false);
    assert.equal(missing.body.reason, 'unauthorized');

    const authorized = await postJson(`${baseUrl}/managed-local-network/health`, {}, 'provider-token');
    assert.equal(authorized.response.status, 200);
    assert.equal(authorized.body.ok, true);
    assert.equal(authorized.body.bridgeReachable, true);
    assert.equal(authorized.body.service, 'filtertube-managed-delivery-provider');
  });
});

test('reference provider serves a browser-safe status page without exposing rule data', async () => {
  await withProvider({ authToken: 'provider-token' }, async ({ baseUrl }) => {
    const status = await fetch(baseUrl, { headers: { accept: 'text/html' } });
    const body = await status.text();

    assert.equal(status.status, 200);
    assert.match(status.headers.get('content-type') || '', /text\/html/);
    assert.match(body, /FilterTube Pickup Provider/);
    assert.match(body, /Home Pickup/);
    assert.match(body, /Internet Pickup/);
    assert.match(body, /Transport only/);
    assert.doesNotMatch(body, /must-not-cross/);
    assert.doesNotMatch(body, /<script/i);
  });
});

test('reference provider exposes parent-usable Home Pickup URL hints without granting authority', () => {
  assert.deepEqual(
    getManagedDeliveryProviderHomePickupUrls({ host: '192.168.1.44', port: 8787, protocol: 'http' }),
    ['http://192.168.1.44:8787/filtertube']
  );
  assert.deepEqual(
    getManagedDeliveryProviderHomePickupUrls({ host: 'pickup.local', port: 9443, protocol: 'https' }),
    ['https://pickup.local:9443/filtertube']
  );

  const wildcardHints = getManagedDeliveryProviderHomePickupUrls({ host: '0.0.0.0', port: 8787, protocol: 'http' });
  assert.ok(wildcardHints.length >= 1);
  assert.ok(wildcardHints.every(url => url.endsWith(':8787/filtertube')));
  assert.ok(wildcardHints.every(url => !url.includes('0.0.0.0')));
});

test('reference provider stores, pulls, and purges ciphertext-only Internet Pickup items', async () => {
  await withProvider({}, async ({ server, baseUrl }) => {
    const refused = await postJson(`${baseUrl}/managed-mailbox/upload`, {
      items: [mailboxItem({ payload: { keywords: ['must-not-cross'] } })]
    });
    assert.equal(refused.response.status, 400);
    assert.equal(refused.body.reason, 'plaintext_or_secret_refused');
    assert.equal(server.getProviderState().mailboxItemCount, 0);

    const upload = await postJson(`${baseUrl}/managed-mailbox/upload`, { items: [mailboxItem()] });
    assert.equal(upload.body.ok, true);
    assert.deepEqual(upload.body.uploadedMailboxItemIds, ['mbx-1']);
    assert.equal(server.getProviderState().mailboxItemCount, 1);

    const pull = await postJson(`${baseUrl}/managed-mailbox/pull`, {
      linkId: 'link-1',
      targetProfileId: 'child-1',
      targetDeviceId: 'child-device-1',
      allowedScopes: ['keywords']
    });
    assert.equal(pull.body.ok, true);
    assert.equal(pull.body.items.length, 1);
    assert.equal(pull.body.items[0].targetDeviceId, 'child-device-1');
    assert.equal(pull.body.items[0].ciphertext, 'ciphertext');
    assert.equal(JSON.stringify(pull.body).includes('must-not-cross'), false);

    const wrongDevicePull = await postJson(`${baseUrl}/managed-mailbox/pull`, {
      linkId: 'link-1',
      targetProfileId: 'child-1',
      targetDeviceId: 'sibling-device-1',
      allowedScopes: ['keywords']
    });
    assert.equal(wrongDevicePull.body.ok, true);
    assert.equal(wrongDevicePull.body.items.length, 0);

    const purge = await postJson(`${baseUrl}/managed-mailbox/purge`, {
      mailboxItemIds: ['mbx-1']
    });
    assert.equal(purge.body.ok, true);
    assert.equal(purge.body.purgedMailboxItemCount, 1);
    assert.equal(server.getProviderState().mailboxItemCount, 0);
  });
});

test('reference provider stores and returns redacted Internet Pickup delivery receipts', async () => {
  await withProvider({}, async ({ baseUrl }) => {
    const ack = await postJson(`${baseUrl}/managed-mailbox/ack`, {
      records: [{
        mailboxItemId: 'mbx-1',
        linkId: 'link-1',
        targetProfileId: 'child-1',
        sourceDeviceId: 'parent-device',
        sourceProfileId: 'parent-profile',
        scope: 'keywords',
        revision: 3,
        policyHash: 'sha256:policy-3',
        ackState: 'accepted',
        accepted: true,
        applied: true
      }]
    });
    assert.equal(ack.body.ok, true);
    assert.deepEqual(ack.body.ackedMailboxItemIds, ['mbx-1']);

    const pulled = await postJson(`${baseUrl}/managed-mailbox/ack/pull`, {
      linkId: 'link-1',
      targetProfileId: 'child-1',
      sourceDeviceId: 'parent-device',
      sourceProfileId: 'parent-profile',
      allowedScopes: ['keywords'],
      sentPolicies: [{ scope: 'keywords', revision: 3, policyHash: 'sha256:policy-3' }]
    });
    assert.equal(pulled.body.ok, true);
    assert.equal(pulled.body.acks.length, 1);
    assert.equal(pulled.body.acks[0].mailboxItemId, 'mbx-1');
    assert.equal(Object.hasOwn(pulled.body.acks[0], 'payload'), false);
    assert.equal(Object.hasOwn(pulled.body.acks[0], 'keywords'), false);
  });
});

test('reference provider stores signed Home Pickup candidates while rejecting private secrets', async () => {
  await withProvider({}, async ({ server, baseUrl }) => {
    const refused = await postJson(`${baseUrl}/managed-local-network/publish`, {
      candidates: [signedCandidate({
        peer: { deviceId: 'parent-device', privateKey: 'must-not-cross' }
      })]
    });
    assert.equal(refused.response.status, 400);
    assert.equal(refused.body.reason, 'secret_refused');
    assert.equal(server.getProviderState().localCandidateCount, 0);

    const publish = await postJson(`${baseUrl}/managed-local-network/publish`, {
      candidates: [signedCandidate()]
    });
    assert.equal(publish.body.ok, true);
    assert.deepEqual(publish.body.candidateIds, ['cand-1']);
    assert.equal(server.getProviderState().localCandidateCount, 1);

    const discover = await postJson(`${baseUrl}/managed-local-network/discover`, {
      linkId: 'link-1',
      targetProfileId: 'child-1',
      allowedScopes: ['channels']
    });
    assert.equal(discover.body.ok, true);
    assert.equal(discover.body.candidates.length, 1);
    assert.equal(discover.body.candidates[0].candidateId, 'cand-1');
    assert.equal(discover.body.candidates[0].envelope.payload.operations.length, 1);
    assert.equal(JSON.stringify(discover.body).includes('must-not-cross'), false);
  });
});

test('reference provider supports short-lived nearby pairing without exposing the receive token', async () => {
  await withProvider({}, async ({ server, baseUrl }) => {
    const announce = await postJson(`${baseUrl}/managed-local-network/presence/announce`, {
      candidateId: 'nearby-child-1',
      receiveToken: 'ephemeral-receive-token',
      label: 'Study laptop',
      platform: 'extension',
      role: 'protected'
    });
    assert.equal(announce.body.ok, true);
    assert.equal(server.getProviderState().nearbyPresenceCount, 1);
    assert.equal(Object.hasOwn(announce.body.candidate, 'receiveToken'), false);
    assert.equal(Object.hasOwn(announce.body.candidate, 'receiveTokenHash'), false);

    const discovered = await postJson(`${baseUrl}/managed-local-network/presence/discover`, {});
    assert.equal(discovered.body.ok, true);
    assert.equal(discovered.body.candidates.length, 1);
    assert.equal(discovered.body.candidates[0].candidateId, 'nearby-child-1');
    assert.equal(discovered.body.candidates[0].state, 'nearby-unpaired');
    assert.equal(Object.hasOwn(discovered.body.candidates[0], 'receiveToken'), false);

    await postJson(`${baseUrl}/managed-local-network/presence/invite`, {
      candidateId: 'nearby-child-1',
      invitationId: 'invite-old',
      pairingCode: 'ABCD',
      inviterLabel: 'Parent laptop'
    });
    const latestInvite = await postJson(`${baseUrl}/managed-local-network/presence/invite`, {
      candidateId: 'nearby-child-1',
      invitationId: 'invite-latest',
      pairingCode: 'WXYZ',
      inviterLabel: 'Parent laptop'
    });
    assert.equal(latestInvite.body.ok, true);
    assert.equal(server.getProviderState().nearbyInvitationCount, 1);

    const refused = await postJson(`${baseUrl}/managed-local-network/presence/invitations/pull`, {
      candidateId: 'nearby-child-1',
      receiveToken: 'wrong-token'
    });
    assert.equal(refused.response.status, 403);
    assert.equal(refused.body.reason, 'nearby_receive_token_mismatch');

    const pulled = await postJson(`${baseUrl}/managed-local-network/presence/invitations/pull`, {
      candidateId: 'nearby-child-1',
      receiveToken: 'ephemeral-receive-token'
    });
    assert.equal(pulled.body.ok, true);
    assert.equal(pulled.body.invitations.length, 1);
    assert.equal(pulled.body.invitations[0].pairingCode, 'WXYZ');
    assert.equal(server.getProviderState().nearbyInvitationCount, 0);

    const withdraw = await postJson(`${baseUrl}/managed-local-network/presence/withdraw`, {
      candidateId: 'nearby-child-1',
      receiveToken: 'ephemeral-receive-token'
    });
    assert.equal(withdraw.body.ok, true);
    assert.equal(server.getProviderState().nearbyPresenceCount, 0);
  });
});

test('reference provider stores and returns redacted Home Pickup delivery receipts', async () => {
  await withProvider({}, async ({ baseUrl }) => {
    const ack = await postJson(`${baseUrl}/managed-local-network/ack`, {
      records: [{
        candidateId: 'cand-1',
        linkId: 'link-1',
        targetProfileId: 'child-1',
        sourceDeviceId: 'parent-device',
        sourceProfileId: 'parent-profile',
        scope: 'channels',
        revision: 9,
        policyHash: 'sha256:policy-9',
        ackState: 'accepted',
        accepted: true,
        applied: true
      }]
    });
    assert.equal(ack.body.ok, true);
    assert.deepEqual(ack.body.ackedCandidateIds, ['cand-1']);

    const pulled = await postJson(`${baseUrl}/managed-local-network/ack/pull`, {
      linkId: 'link-1',
      targetProfileId: 'child-1',
      sourceDeviceId: 'parent-device',
      sourceProfileId: 'parent-profile',
      allowedScopes: ['channels'],
      sentPolicies: [{ scope: 'channels', revision: 9, policyHash: 'sha256:policy-9' }]
    });
    assert.equal(pulled.body.ok, true);
    assert.equal(pulled.body.acks.length, 1);
    assert.equal(pulled.body.acks[0].candidateId, 'cand-1');
    assert.equal(Object.hasOwn(pulled.body.acks[0], 'payload'), false);
    assert.equal(Object.hasOwn(pulled.body.acks[0], 'channels'), false);
  });
});
