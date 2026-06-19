import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_PAIRING_KEY_DESCRIPTOR_2026-06-04.md';
const signingDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runtimeSource() {
  return [
    'js/nanah_sync_adapter.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function loadNanahAdapter() {
  const context = {
    window: {
      navigator: {
        platform: 'Node test platform',
        userAgentData: { platform: 'Node test platform' }
      }
    }
  };
  vm.runInNewContext(read('js/nanah_sync_adapter.js'), context);
  return context.window.FilterTubeNanahAdapter;
}

test('managed pairing key descriptor audit is linked from plan and authority inventory', () => {
  const doc = read(docPath);
  const signingDoc = read(signingDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Status\*\*: Runtime descriptor persistence slice/);
  assert.match(doc, /Later same-day keypair,\s+signed-send, mailbox provider, Home Bridge provider, and key-rotation slices now\s+exist/);
  assert.match(doc, /ftNanahManagedSigningPublicKey/);
  assert.match(doc, /managedPublicKeyId/);
  assert.match(doc, /sourcePublicKeyJwk/);
  assert.match(doc, /If no public key descriptor exists, managed envelopes still fail closed/);
  assert.match(signingDoc, new RegExp(docPath));
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
  assert.match(inventory, /Pairing public-key descriptor, source keypair provisioning, eligible live signed send, profile-scoped trusted-link identity, and source-side key rotation present/);
});

test('Nanah device descriptor advertises managed public key aliases only when a complete descriptor exists', () => {
  const adapter = loadNanahAdapter();
  const publicJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'base64url-public-key'
  };

  const descriptor = adapter.getDeviceDescriptor({
    deviceId: 'parent-device-1',
    deviceLabel: 'Parent laptop',
    managedPublicKeyId: 'parent-key-3',
    managedPublicKeyJwk: publicJwk,
    managedKeyVersion: 3
  });

  assert.equal(descriptor.deviceId, 'parent-device-1');
  assert.equal(descriptor.managedPublicKeyId, 'parent-key-3');
  assert.deepEqual(descriptor.managedPublicKeyJwk, publicJwk);
  assert.equal(descriptor.managedKeyVersion, 3);
  assert.equal(descriptor.sourcePublicKeyId, 'parent-key-3');
  assert.deepEqual(descriptor.sourcePublicKeyJwk, publicJwk);
  assert.equal(descriptor.keyVersion, 3);

  const missingVersion = adapter.getDeviceDescriptor({
    deviceId: 'parent-device-1',
    managedPublicKeyId: 'parent-key-3',
    managedPublicKeyJwk: publicJwk,
    managedKeyVersion: 0
  });

  assert.equal(Object.hasOwn(missingVersion, 'managedPublicKeyId'), false);
  assert.equal(Object.hasOwn(missingVersion, 'sourcePublicKeyId'), false);
  assert.equal(Object.hasOwn(missingVersion, 'keyVersion'), false);
});

test('dashboard Nanah pairing preserves source key fields on managed trusted links', () => {
  const tabView = read('js/tab-view.js');

  assert.match(tabView, /const NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY = 'ftNanahManagedSigningPublicKey'/);
  assert.match(tabView, /let nanahManagedSigningKeyDescriptor = null/);
  assert.match(tabView, /async function loadNanahManagedSigningKeyDescriptor\(\)/);
  assert.match(tabView, /await loadNanahManagedSigningKeyDescriptor\(\)/);
  assert.match(tabView, /managedPublicKeyId: normalizeString\(managedKey\.managedPublicKeyId \|\| managedKey\.sourcePublicKeyId \|\| managedKey\.publicKeyId\)/);
  assert.match(tabView, /managedPublicKeyJwk: safeObject\(managedKey\.managedPublicKeyJwk \|\| managedKey\.sourcePublicKeyJwk \|\| managedKey\.publicKeyJwk\)/);
  assert.match(tabView, /managedKeyVersion: normalizeNonNegativeInteger\(managedKey\.managedKeyVersion \|\| managedKey\.keyVersion \|\| managedKey\.sourceKeyVersion\) \|\| 0/);

  assert.match(tabView, /sourceDeviceId: managedSourceDeviceId/);
  assert.match(tabView, /sourceProfileId: managedSourceProfileId/);
  assert.match(tabView, /sourcePublicKeyId: managedSourcePublicKeyId/);
  assert.match(tabView, /sourcePublicKeyJwk: Object\.keys\(managedSourcePublicKeyJwk\)\.length > 0 \? managedSourcePublicKeyJwk : \{\}/);
  assert.match(tabView, /keyVersion: managedSourceKeyVersion \|\| 0/);
  assert.match(tabView, /sourceDeviceId: remoteRole === 'source' \? remoteId : ''/);
  assert.match(tabView, /sourcePublicKeyId: remoteRole === 'source' \? remoteManagedPublicKeyId : ''/);
  assert.match(tabView, /sourceDeviceId: normalizeString\(nanahStableDeviceId\)/);
  assert.match(tabView, /sourcePublicKeyId: localManagedPublicKeyId/);
  assert.doesNotMatch(tabView, /keyVersion: [^\n]*undefined/);
  assert.doesNotMatch(tabView, /sourcePublicKeyJwk: [^\n]*undefined/);
});

test('managed pairing key descriptor slice stays a key-binding proof while later transports validate locally', () => {
  const source = runtimeSource();
  const doc = read(docPath);

  assert.match(source, /function verifyManagedNanahPolicyIntegritySignature\(envelope, trustedLink\)/);
  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /async function applyManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /createManagedNanahSigningKeyPair/);
  assert.match(source, /signManagedPolicyEnvelope/);
  assert.doesNotMatch(source, /managedPolicyOutbox/);
  assert.match(source, /FilterTubeManagedPolicyMailbox/);
  assert.match(doc, /This descriptor slice is not enough to enable automatic remote policy writes by\s+itself/);
  assert.match(doc, /hosted mailbox service/);
  assert.match(doc, /automatic LAN peer discovery authority/);
});
