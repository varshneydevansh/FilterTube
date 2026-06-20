import test from 'node:test';
import assert from 'node:assert/strict';

import { createManagedDeliveryProviderServer } from '../../scripts/managed-delivery-provider.mjs';

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
      allowedScopes: ['keywords']
    });
    assert.equal(pull.body.ok, true);
    assert.equal(pull.body.items.length, 1);
    assert.equal(pull.body.items[0].ciphertext, 'ciphertext');
    assert.equal(JSON.stringify(pull.body).includes('must-not-cross'), false);

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

test('reference provider stores signed Home Bridge candidates while rejecting private secrets', async () => {
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

test('reference provider stores and returns redacted Home Bridge delivery receipts', async () => {
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
