import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadClient(relativePath, windowProps = {}) {
  const window = { ...windowProps };
  vm.runInNewContext(read(relativePath), { window, URL });
  return window;
}

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return payload;
    }
  };
}

test('configured mailbox client posts sealed items only and refuses plaintext policy bodies', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return jsonResponse({ ok: true, uploadedMailboxItemIds: ['mbx-1'] });
  };
  const window = loadClient('js/nanah_managed_mailbox_client.js');
  const provider = window.FilterTubeManagedMailboxClient.createProvider({
    endpointUrl: 'https://mailbox.filtertube.example/api',
    authToken: 'token-redacted'
  }, { fetch: fetchImpl });

  assert.equal(provider.configured, true);
  assert.equal(provider.transport, 'encrypted_mailbox');
  assert.equal(provider.requiresSealedMailboxItems, true);

  const result = await provider.uploadManagedMailboxItems({
    schema: 'filtertube_managed_mailbox_upload_request',
    reason: 'manual_send',
    items: [{
      mailboxItemId: 'mbx-1',
      linkId: 'link-1',
      targetProfileId: 'child-1',
      sourceDeviceId: 'parent-device',
      sourceProfileId: 'parent-profile',
      scope: 'keywords',
      revision: 4,
      policyHash: 'sha256:policy',
      sourcePublicKeyId: 'key-1',
      keyVersion: 1,
      encryptedDek: 'dek',
      nonce: 'nonce',
      ciphertext: 'ciphertext',
      ciphertextHash: 'sha256:ciphertext',
      payload: { keywords: ['must-not-cross'] }
    }]
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://mailbox.filtertube.example/api/managed-mailbox/upload');
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.headers.authorization, 'Bearer token-redacted');
  assert.equal(calls[0].body.mailboxItemCount, 1);
  assert.equal(calls[0].body.items[0].mailboxItemId, 'mbx-1');
  assert.equal(JSON.stringify(calls[0].body).includes('must-not-cross'), false);
  assert.equal(Object.hasOwn(calls[0].body.items[0], 'payload'), false);

  const refused = await provider.uploadManagedMailboxItems({
    payload: { keywords: ['plaintext-top-level'] },
    items: []
  });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'mailbox_plaintext_refused');
  assert.equal(calls.length, 1);
});

test('configured mailbox client pulls storage rows then decrypts through adapter boundary', async () => {
  const calls = [];
  const adapterCalls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return jsonResponse({
      ok: true,
      items: [{
        schema: 'filtertube_managed_mailbox_item',
        mailboxItemId: 'mbx-pull-1',
        linkId: 'link-1',
        encryptedDek: 'dek',
        nonce: 'nonce',
        ciphertext: 'ciphertext',
        ciphertextHash: 'sha256:ciphertext'
      }]
    });
  };
  const adapter = {
    async openManagedMailboxStorageItem(item, options) {
      adapterCalls.push({ item, options });
      return {
        ...item,
        decryptedEnvelope: {
          type: 'filtertube_managed_policy',
          scope: 'keywords'
        }
      };
    }
  };
  const window = loadClient('js/nanah_managed_mailbox_client.js');
  const provider = window.FilterTubeManagedMailboxClient.createProvider({
    endpointUrl: 'https://mailbox.filtertube.example/root'
  }, { fetch: fetchImpl, adapter });

  const result = await provider.pullDecryptedMailboxItems({
    linkId: 'link-1',
    targetProfileId: 'child-1',
    trustedLink: {
      id: 'link-1',
      targetProfileId: 'child-1'
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].decryptedEnvelope.scope, 'keywords');
  assert.equal(calls[0].url, 'https://mailbox.filtertube.example/root/managed-mailbox/pull');
  assert.equal(Object.hasOwn(calls[0].body, 'trustedLink'), false);
  assert.equal(adapterCalls[0].item.mailboxItemId, 'mbx-pull-1');
  assert.equal(adapterCalls[0].options.trustedLink.id, 'link-1');
});

test('configured mailbox client pulls redacted delivery receipts for source status', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return jsonResponse({
      ok: true,
      acks: [{
        schema: 'filtertube_nanah_managed_open_sync_ack',
        linkId: 'bad-link',
        scope: 'keywords',
        revision: 7,
        policyHash: 'sha256:policy',
        payload: { keywords: ['must-not-cross'] }
      }, {
        schema: 'filtertube_nanah_managed_open_sync_ack',
        linkId: 'link-1',
        mailboxItemId: 'mbx-1',
        targetProfileId: 'child-1',
        sourceDeviceId: 'parent-device',
        sourceProfileId: 'parent-profile',
        scope: 'keywords',
        revision: 7,
        policyHash: 'sha256:policy',
        ackState: 'delivered',
        accepted: true
      }]
    });
  };
  const window = loadClient('js/nanah_managed_mailbox_client.js');
  const provider = window.FilterTubeManagedMailboxClient.createProvider({
    endpointUrl: 'https://mailbox.filtertube.example/root'
  }, { fetch: fetchImpl });

  const result = await provider.pullManagedDeliveryAcks({
    linkId: 'link-1',
    sourceDeviceId: 'parent-device',
    sourceProfileId: 'parent-profile',
    targetProfileId: 'child-1',
    allowedScopes: ['keywords'],
    sentPolicies: [{ scope: 'keywords', revision: 7, policyHash: 'sha256:policy' }],
    trustedLink: { privateKey: 'must-not-cross' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.acks.length, 1);
  assert.equal(result.acks[0].schema, 'filtertube_nanah_managed_open_sync_ack');
  assert.equal(result.acks[0].mailboxItemId, 'mbx-1');
  assert.equal(calls[0].url, 'https://mailbox.filtertube.example/root/managed-mailbox/ack/pull');
  assert.equal(Object.hasOwn(calls[0].body, 'trustedLink'), false);
  assert.equal(JSON.stringify(calls[0].body).includes('must-not-cross'), false);
  assert.equal(JSON.stringify(result.acks[0]).includes('must-not-cross'), false);
});

test('mailbox client refuses unsafe endpoints before any fetch', async () => {
  const fetchImpl = async () => {
    throw new Error('fetch should not run');
  };
  const window = loadClient('js/nanah_managed_mailbox_client.js');
  for (const endpointUrl of [
    'http://mailbox.filtertube.example/api',
    'https://localhost/api',
    'https://127.0.0.1/api',
    'https://router.local/api',
    'https://192.168.1.2/api'
  ]) {
    const provider = window.FilterTubeManagedMailboxClient.createProvider({ endpointUrl }, { fetch: fetchImpl });
    assert.equal(provider.configured, false, endpointUrl);
    const result = await provider.uploadManagedMailboxItems({ items: [] });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'mailbox_endpoint_unconfigured');
  }
});

test('configured local-network client allows explicit private bridge and sanitizes returned candidates', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    if (url.endsWith('/managed-local-network/health')) {
      return jsonResponse({ ok: true, service: 'filtertube-home-bridge' });
    }
    return jsonResponse({
      ok: true,
      candidates: [{
        schema: 'filtertube_managed_local_network_candidate',
        candidateId: 'cand-1',
        privateKey: 'server-must-not-smuggle',
        peer: {
          deviceId: 'parent-device',
          publicKeyId: 'key-1',
          privateKey: 'peer-secret'
        },
        policy: {
          type: 'filtertube_managed_policy',
          privateKeyJwk: { k: 'secret' }
        },
        envelope: {
          type: 'filtertube_managed_policy',
          linkId: 'link-1',
          scope: 'keywords',
          revision: 2,
          payload: { operations: [] }
        }
      }]
    });
  };
  const window = loadClient('js/nanah_managed_local_network_client.js');
  const provider = window.FilterTubeManagedLocalNetworkClient.createProvider({
    endpointUrl: 'http://192.168.1.10:8787/filtertube',
    authToken: 'bridge-token'
  }, { fetch: fetchImpl });

  assert.equal(provider.configured, true);
  assert.equal(provider.transport, 'local_network');
  assert.equal(typeof provider.checkManagedLocalNetworkBridge, 'function');

  const result = await provider.discoverManagedPolicyCandidates({
    linkId: 'link-1',
    targetProfileId: 'child-1',
    sourceDeviceId: 'parent-device',
    sourceProfileId: 'parent-profile',
    privateKey: 'request-secret-ignored-by-discovery-sanitizer'
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidates.length, 1);
  assert.equal(calls[0].url, 'http://192.168.1.10:8787/filtertube/managed-local-network/discover');
  assert.equal(calls[0].body.linkId, 'link-1');
  assert.equal(Object.hasOwn(calls[0].body, 'privateKey'), false);
  const candidateJson = JSON.stringify(result.candidates[0]);
  assert.equal(candidateJson.includes('server-must-not-smuggle'), false);
  assert.equal(candidateJson.includes('peer-secret'), false);
  assert.equal(candidateJson.includes('privateKeyJwk'), false);
  assert.equal(Object.hasOwn(result.candidates[0], 'policy'), false);
  assert.equal(result.candidates[0].envelope.scope, 'keywords');
  assert.equal(result.candidates[0].peer.deviceId, 'parent-device');

  const health = await provider.checkManagedLocalNetworkBridge({
    reason: 'configure',
    privateKey: 'must-not-cross'
  });
  assert.equal(health.ok, true);
  assert.equal(health.bridgeReachable, true);
  assert.equal(calls[1].url, 'http://192.168.1.10:8787/filtertube/managed-local-network/health');
  assert.equal(calls[1].body.reason, 'configure');
  assert.equal(Object.hasOwn(calls[1].body, 'privateKey'), false);
});

test('configured local-network client pulls redacted delivery receipts for source status', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return jsonResponse({
      ok: true,
      acks: [{
        schema: 'filtertube_managed_local_network_candidate_ack',
        linkId: 'bad-link',
        candidateId: 'bad-cand',
        scope: 'channels',
        revision: 9,
        policyHash: 'sha256:policy',
        privateKey: 'must-not-cross',
        payload: { channels: ['UCmustNotCross'] }
      }, {
        schema: 'filtertube_managed_local_network_candidate_ack',
        linkId: 'link-1',
        candidateId: 'cand-1',
        targetProfileId: 'child-1',
        sourceDeviceId: 'parent-device',
        sourceProfileId: 'parent-profile',
        scope: 'channels',
        revision: 9,
        policyHash: 'sha256:policy',
        ackState: 'delivered',
        accepted: true
      }]
    });
  };
  const window = loadClient('js/nanah_managed_local_network_client.js');
  const provider = window.FilterTubeManagedLocalNetworkClient.createProvider({
    endpointUrl: 'http://192.168.1.10:8787/filtertube'
  }, { fetch: fetchImpl });

  const result = await provider.pullManagedDeliveryAcks({
    linkId: 'link-1',
    sourceDeviceId: 'parent-device',
    sourceProfileId: 'parent-profile',
    targetProfileId: 'child-1',
    allowedScopes: ['channels'],
    sentPolicies: [{ scope: 'channels', revision: 9, policyHash: 'sha256:policy' }],
    privateKey: 'must-not-cross'
  });

  assert.equal(result.ok, true);
  assert.equal(result.acks.length, 1);
  assert.equal(result.acks[0].schema, 'filtertube_managed_local_network_candidate_ack');
  assert.equal(result.acks[0].candidateId, 'cand-1');
  assert.equal(calls[0].url, 'http://192.168.1.10:8787/filtertube/managed-local-network/ack/pull');
  assert.equal(Object.hasOwn(calls[0].body, 'privateKey'), false);
  assert.equal(JSON.stringify(result.acks[0]).includes('must-not-cross'), false);
});

test('local-network client refuses private outbound secrets and public http endpoints', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return jsonResponse({ ok: true, candidateIds: ['cand-1'] });
  };
  const window = loadClient('js/nanah_managed_local_network_client.js');
  const provider = window.FilterTubeManagedLocalNetworkClient.createProvider({
    endpointUrl: 'http://192.168.1.10:8787/filtertube'
  }, { fetch: fetchImpl });

  const refused = await provider.publishManagedPolicyCandidates({
    candidates: [{ candidateId: 'cand-1', privateKey: 'must-not-send' }]
  });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'local_network_private_secret_refused');
  assert.equal(calls.length, 0);

  const publicHttp = window.FilterTubeManagedLocalNetworkClient.createProvider({
    endpointUrl: 'http://bridge.filtertube.example/filtertube'
  }, { fetch: fetchImpl });
  assert.equal(publicHttp.configured, false);
  const unavailable = await publicHttp.discoverManagedPolicyCandidates({ linkId: 'link-1' });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.reason, 'local_network_endpoint_unconfigured');
  assert.equal(unavailable.candidates.length, 0);
});
