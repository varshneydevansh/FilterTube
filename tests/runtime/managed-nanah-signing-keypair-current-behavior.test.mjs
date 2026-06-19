import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md';
const descriptorDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_PAIRING_KEY_DESCRIPTOR_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadNanahAdapter() {
  const context = {
    window: {
      navigator: {
        platform: 'Node test platform',
        userAgentData: { platform: 'Node test platform' }
      },
      TextEncoder,
      btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
      atob: (value) => Buffer.from(value, 'base64').toString('binary'),
      crypto: {
        randomUUID: () => 'uuid-key',
        subtle: {
          async generateKey(algorithm, extractable, usages) {
            assert.equal(algorithm.name, 'Ed25519');
            assert.equal(extractable, true);
            assert.deepEqual(Array.from(usages), ['sign', 'verify']);
            return {
              publicKey: { kind: 'public' },
              privateKey: { kind: 'private' }
            };
          },
          async exportKey(format, key) {
            assert.equal(format, 'jwk');
            if (key.kind === 'public') {
              return { kty: 'OKP', crv: 'Ed25519', x: 'public-x' };
            }
            return { kty: 'OKP', crv: 'Ed25519', x: 'public-x', d: 'private-d' };
          },
          async importKey(format, jwk, algorithm, extractable, usages) {
            assert.equal(format, 'jwk');
            assert.equal(algorithm.name, 'Ed25519');
            assert.equal(extractable, false);
            assert.deepEqual(Array.from(usages), ['sign']);
            return { jwk };
          },
          async sign(algorithm, key, data) {
            assert.equal(algorithm.name, 'Ed25519');
            assert.equal(key.jwk.d, 'private-d');
            assert.equal(ArrayBuffer.isView(data), true);
            return Uint8Array.from([1, 2, 3]).buffer;
          }
        }
      }
    }
  };
  vm.runInNewContext(read('js/nanah_sync_adapter.js'), context);
  return context.window.FilterTubeNanahAdapter;
}

test('managed signing keypair audit is linked without overclaiming broad remote delivery', () => {
  const doc = read(docPath);
  const descriptorDoc = read(descriptorDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Status\*\*: Runtime keypair provisioning, adapter signing helper, and eligible\s+live signed-send slice/);
  assert.match(doc, /ftNanahManagedSigningKeyPair/);
  assert.match(doc, /ftNanahManagedSigningPublicKey/);
  assert.match(doc, /privateKeyJwk/);
  assert.match(doc, /eligible fixed-target Main\/Kids, active\/full profile-policy bundles, keyword,\s+channel, video, viewing-space, and time-limit managed sends now use signed\s+managed-policy envelopes/);
  assert.match(doc, /does not claim hardware-backed, non-extractable, encrypted-at-rest, or\s+password-wrapped private key storage/);
  assert.match(doc, /active\/full sync conversion into signed managed-policy envelopes/);
  assert.match(plan, new RegExp(docPath));
  assert.match(plan, /Task 3\.5: Provision managed signing keypairs/);
  assert.match(inventory, new RegExp(docPath));
  assert.match(inventory, /source-side managed signing keypair provisioning/);
  assert.match(descriptorDoc, new RegExp(docPath));
});

test('Nanah adapter creates managed signing keypairs with public descriptor aliases', async () => {
  const adapter = loadNanahAdapter();
  const keyPair = await adapter.createManagedNanahSigningKeyPair({
    managedPublicKeyId: 'parent-key-1',
    managedKeyVersion: 2
  });

  assert.equal(keyPair.managedPublicKeyId, 'parent-key-1');
  assert.equal(keyPair.sourcePublicKeyId, 'parent-key-1');
  assert.equal(keyPair.managedKeyVersion, 2);
  assert.equal(keyPair.keyVersion, 2);
  assert.equal(keyPair.algorithm, 'ed25519');
  assert.deepEqual(keyPair.managedPublicKeyJwk, { kty: 'OKP', crv: 'Ed25519', x: 'public-x' });
  assert.deepEqual(keyPair.sourcePublicKeyJwk, { kty: 'OKP', crv: 'Ed25519', x: 'public-x' });
  assert.deepEqual(keyPair.privateKeyJwk, {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'public-x',
    d: 'private-d'
  });
  assert.equal(Number.isInteger(keyPair.createdAt), true);
});

test('Nanah adapter signs canonical managed-policy fields and strips private key material', async () => {
  const adapter = loadNanahAdapter();
  const envelope = {
    type: 'filtertube_managed_policy',
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    targetProfileId: 'child-profile-1',
    sourceProfileId: 'parent-profile-1',
    sourceDeviceId: 'parent-device-1',
    revision: 4,
    sourcePublicKeyId: 'parent-key-1',
    keyVersion: 2,
    payload: {
      scope: 'keywords',
      operations: [
        { op: 'add_keyword', word: 'math' }
      ]
    },
    privateKeyJwk: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: 'public-x',
      d: 'private-d'
    }
  };
  envelope.policyHash = adapter.buildManagedPolicyPayloadHash(envelope);

  const signed = await adapter.signManagedPolicyEnvelope(envelope);

  assert.equal(signed.privateKeyJwk, undefined);
  assert.equal(signed.integrity.algorithm, 'ed25519');
  assert.deepEqual(JSON.parse(JSON.stringify(signed.integrity.signedFields)), {
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    targetProfileId: 'child-profile-1',
    sourceDeviceId: 'parent-device-1',
    revision: 4,
    policyHash: envelope.policyHash,
    payloadScope: 'keywords'
  });
  assert.equal(signed.integrity.signature, 'AQID');

  const decision = adapter.validateManagedPolicyEnvelope(signed, {
    trustedLink: {
      id: 'link-parent-child-1',
      type: 'managed_link',
      localRole: 'replica',
      remoteRole: 'source',
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      sourcePublicKeyId: 'parent-key-1',
      keyVersion: 2,
      targetProfileId: 'child-profile-1',
      allowedScopes: ['keywords']
    },
    profiles: {
      'parent-profile-1': { type: 'account' },
      'child-profile-1': { type: 'child', parentProfileId: 'parent-profile-1' }
    },
    signatureVerified: true
  });

  assert.equal(decision.accepted, true);
  assert.equal(decision.decision, 'accept_newer_revision');
});

test('dashboard provisions source keypairs and keeps private material out of public descriptors', () => {
  const tabView = read('js/tab-view.js');

  assert.match(tabView, /const NANAH_MANAGED_SIGNING_KEYPAIR_KEY = 'ftNanahManagedSigningKeyPair'/);
  assert.match(tabView, /const NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY = 'ftNanahManagedSigningPublicKey'/);
  assert.match(tabView, /function normalizeNanahManagedSigningKeyPair\(value\)/);
  assert.match(tabView, /async function persistNanahManagedSigningKeyPair\(keyPair\)/);
  assert.match(tabView, /writeNanahStorage\(NANAH_MANAGED_SIGNING_KEYPAIR_KEY, privateStored\)/);
  assert.match(tabView, /writeNanahStorage\(NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY, publicDescriptor\)/);
  assert.match(tabView, /async function loadNanahManagedSigningKeyDescriptor\(\)/);
  assert.match(tabView, /adapter\.createManagedNanahSigningKeyPair/);
  assert.match(tabView, /if \(getNanahRole\(\) === 'source'\) \{\s+try \{\s+await ensureNanahManagedSigningKeyPair\(\)/);
  assert.match(tabView, /if \(linkType === 'managed_link' && localRole === 'source'\) \{/);
  assert.match(tabView, /ensureNanahManagedSigningKeyPair\(\{ required: true \}\)/);
  assert.match(tabView, /if \(policy\.linkType === 'managed_link' && getNanahRole\(\) === 'source'\) \{/);

  const descriptorBlock = tabView.slice(
    tabView.indexOf('function buildNanahDeviceDescriptor()'),
    tabView.indexOf('async function resetNanahSession')
  );
  assert.match(descriptorBlock, /managedPublicKeyJwk/);
  assert.doesNotMatch(descriptorBlock, /privateKeyJwk/);
});

test('managed signing slice keeps provider delivery below local validation authority', () => {
  const source = [
    'js/nanah_sync_adapter.js',
    'js/nanah_managed_live_policy.js',
    'js/tab-view.js'
  ].map(read).join('\n');
  const doc = read(docPath);

  assert.match(source, /createManagedNanahSigningKeyPair/);
  assert.match(source, /signManagedPolicyEnvelope/);
  assert.doesNotMatch(source, /managedPolicyOutbox/);
  assert.match(source, /FilterTubeManagedPolicyMailbox/);
  assert.match(source, /uploadMailboxPolicyBatch/);
  assert.match(source, /FilterTubeManagedPolicyLocalNetwork/);
  assert.match(source, /buildEnvelopeForLiveSend/);
  assert.match(doc, /eligible fixed-target Main\/Kids, active\/full profile-policy bundles, keyword,\s+channel, video, viewing-space, and time-limit managed sends now use signed\s+managed-policy envelopes/);
  assert.match(doc, /Provider reachability is still transport only/);
  assert.match(doc, /FilterTube-hosted mailbox service/);
  assert.match(doc, /automatic LAN peer discovery authority/);
});
