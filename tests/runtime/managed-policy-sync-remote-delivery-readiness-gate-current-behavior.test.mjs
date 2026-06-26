import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md';
const providerDocPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md';
const openSyncDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md';
const mailboxDocPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md';
const boundaryDocPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md';
const inventoryDocPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const manifests = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function manifestHostPermissions() {
  return manifests.flatMap((file) => {
    const manifest = readJson(file);
    return (Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [])
      .map((permission) => ({ file, permission }));
  });
}

function manifestOptionalHostPermissions() {
  return manifests.flatMap((file) => {
    const manifest = readJson(file);
    return (Array.isArray(manifest.optional_host_permissions) ? manifest.optional_host_permissions : [])
      .map((permission) => ({ file, permission }));
  });
}

test('managed remote delivery readiness gate is docs-backed and linked to current proof family', () => {
  const doc = read(docPath);
  const providerDoc = read(providerDocPath);
  const openSyncDoc = read(openSyncDocPath);
  const mailboxDoc = read(mailboxDocPath);
  const boundaryDoc = read(boundaryDocPath);
  const inventory = read(inventoryDocPath);

  assert.match(doc, /Remote policy authority, validation, local apply, action history,\s+source-side Internet Pickup seal\/open encryption helpers, source-side server-safe\s+pickup storage preparation, source-side pickup upload\/purge provider handoffs,\s+explicitly configured browser HTTPS Internet Pickup upload\/pull\/purge client,\s+provider-gated Internet Pickup intake, and provider-gated Home Pickup candidate\s+intake are present/);
  assert.match(doc, /Complete remote delivery is still blocked on server deployment,\s+Home Pickup transport proof, native parity, and installed two-device smoke/);
  assert.match(doc, new RegExp(providerDocPath));
  assert.match(doc, new RegExp(openSyncDocPath));
  assert.match(doc, new RegExp(mailboxDocPath));
  assert.match(doc, new RegExp(boundaryDocPath));
  assert.match(doc, new RegExp(inventoryDocPath));
  assert.match(doc, /release claim for complete remote management: NO-GO/);
  assert.match(doc, /built-in same-network peer discovery: NO-GO/);
  assert.match(doc, /Internet Pickup encryption client: READY local helper and configured HTTPS upload/);
  assert.match(doc, /source-side Internet Pickup upload-provider handoff: PARTIAL/);
  assert.match(doc, /source-side Internet Pickup purge-provider handoff: PARTIAL/);
  assert.match(doc, /built-in browser HTTPS Internet Pickup upload client: READY explicit config only/);
  assert.match(doc, /built-in browser HTTPS Internet Pickup purge client: READY explicit config only/);
  assert.match(doc, /built-in browser HTTPS Internet Pickup pull client: READY explicit config only/);
  assert.match(doc, /Internet Pickup decryption client: READY local helper and configured HTTPS pull/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /node --test tests\/runtime\/managed-policy-sync-remote-delivery-readiness-gate-current-behavior\.test\.mjs/);

  assert.match(providerDoc, /runtime built-in same-network peer discovery: absent/);
  assert.match(providerDoc, /runtime built-in same-network delivery: absent/);
  assert.match(openSyncDoc, /runtime browser HTTPS (?:mailbox|Internet Pickup) pull\/decrypt client: present behind explicit config/);
  assert.match(openSyncDoc, /runtime (?:mailbox server|Internet Pickup service) authority: absent/);
  assert.match(mailboxDoc, /runtime mailbox seal\/open encryption helper: present/);
  assert.match(mailboxDoc, /runtime source-side server-safe mailbox storage item builder: present/);
  assert.match(mailboxDoc, /runtime (?:mailbox|Internet Pickup) encryption client: present for local seal helper and configured HTTPS (?:mailbox|Internet Pickup) upload/);
  assert.match(mailboxDoc, /runtime source-side mailbox upload-provider handoff: present/);
  assert.match(mailboxDoc, /runtime source-side mailbox purge-provider handoff: present/);
  assert.match(mailboxDoc, /runtime browser HTTPS (?:mailbox|Internet Pickup) upload client: present behind explicit config/);
  assert.match(mailboxDoc, /runtime browser HTTPS (?:mailbox|Internet Pickup) purge client: present behind explicit config/);
  assert.match(mailboxDoc, /runtime browser HTTPS (?:mailbox|Internet Pickup) pull client: present behind explicit config/);
  assert.match(mailboxDoc, /runtime (?:mailbox|Internet Pickup) decryption client: present for local open helper and configured HTTPS (?:mailbox|Internet Pickup) pull/);
  assert.match(boundaryDoc, /runtime built-in (?:local-network|same-network) peer discovery: absent/);
  assert.match(inventory, /built-in local-network peer discovery\/LAN delivery runtime/);
});

test('extension manifests keep broad pickup endpoint access optional', () => {
  const hosts = manifestHostPermissions();
  const hostValues = hosts.map(row => row.permission);
  const optionalHosts = manifestOptionalHostPermissions();
  const optionalValues = optionalHosts.map(row => row.permission);

  assert.ok(hostValues.length > 0, 'manifest host permissions should be explicit');
  assert.deepEqual(
    [...new Set(hostValues)].toSorted(),
    [
      '*://*.youtube-nocookie.com/*',
      '*://*.youtube.com/*',
      '*://*.youtubekids.com/*'
    ]
  );
  assert.deepEqual([...new Set(optionalValues)].toSorted(), ['http://*/*', 'https://*/*']);

  for (const { file, permission } of hosts) {
    assert.doesNotMatch(permission, /<all_urls>/, `${file} should not request all urls`);
    assert.doesNotMatch(permission, /^https?:\/\/\*\/\*$/, `${file} should not request broad http/https host access`);
    assert.doesNotMatch(permission, /^https?:\/\/localhost\//, `${file} should not request localhost host access`);
    assert.doesNotMatch(permission, /^https?:\/\/127\.0\.0\.1\//, `${file} should not request loopback host access`);
    assert.doesNotMatch(permission, /^https?:\/\/\*\.local\//, `${file} should not request .local host access`);
    assert.doesNotMatch(permission, /^https?:\/\/(?:10|172|192)\./, `${file} should not request private LAN host access`);
  }
  for (const { file, permission } of optionalHosts) {
    assert.ok(['http://*/*', 'https://*/*'].includes(permission), `${file} optional pickup host pattern drifted`);
  }
});

test('remote delivery runtime remains provider-gated without adding hot-path network primitives', () => {
  const tabView = read('js/tab-view.js');
  const openSync = read('js/nanah_managed_open_sync.js');
  const adapter = read('js/nanah_sync_adapter.js');

  assert.match(tabView, /window\.FilterTubeManagedPolicyLocalNetwork/);
  assert.match(tabView, /discoverManagedPolicyCandidates/);
  assert.match(tabView, /handleNanahIncomingManagedLocalNetworkCandidate\(candidate\)/);
  assert.match(openSync, /global\.FilterTubeManagedPolicyOpenSync/);
  assert.match(openSync, /pullDecryptedMailboxItems/);
  const mailboxClient = read('js/nanah_managed_mailbox_client.js');
  assert.match(mailboxClient, /requiresSealedMailboxItems: true/);
  assert.match(mailboxClient, /credentials: 'omit'/);
  assert.match(mailboxClient, /openManagedMailboxStorageItem/);
  assert.match(adapter, /function validateManagedLocalNetworkCandidate\(candidate, context = \{\}\)/);
  assert.match(adapter, /function validateManagedMailboxItem\(item, context = \{\}\)/);

  const localNetworkSlice = tabView.slice(
    tabView.indexOf('function getNanahManagedLocalNetworkProvider()'),
    tabView.indexOf('async function configureNanahTrustedLink(link)')
  );
  assert.doesNotMatch(localNetworkSlice, /\bfetch\s*\(/);
  assert.doesNotMatch(localNetworkSlice, /XMLHttpRequest/);
  assert.doesNotMatch(localNetworkSlice, /WebSocket/);
  assert.doesNotMatch(localNetworkSlice, /setInterval/);
  assert.doesNotMatch(localNetworkSlice, /MutationObserver/);
  assert.doesNotMatch(localNetworkSlice, /chrome\.tabs/);
});

test('readiness gate keeps allowed and blocked product claims separate', () => {
  const doc = read(docPath);

  for (const allowed of [
    'local parent-managed child/protected-profile edits are supported',
    'managed policy validation and apply are signature/revision gated',
    'live Nanah managed-policy sends are available only for eligible connected',
    'provider-gated Home Pickup candidate intake exists',
    'provider-gated pull-on-open intake exists for already-decrypted pickup',
    'same-network discovery is not authority'
  ]) {
    assert.ok(doc.includes(allowed), `missing allowed claim ${allowed}`);
  }

  for (const blocked of [
    'complete same-network remote management',
    'always-on parent-to-child sync',
    'Internet Pickup delivery without explicit endpoint configuration',
    'automatic same-network peer discovery',
    'guaranteed later delivery after the parent device goes offline',
    'remote management across desktop and apps without installed two-device smoke',
    'managed list subscriptions/imports without parent approval'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked claim ${blocked}`);
  }

  for (const gate of [
    'Transport capability',
    'Permission boundary',
    'Identity binding',
    'Authority reuse',
    'Replay/revocation',
    'Ack/history',
    'No-work performance',
    'Installed smoke',
    'App parity'
  ]) {
    assert.ok(doc.includes(gate), `missing green criterion ${gate}`);
  }
});

test('settings lane owns the remote delivery readiness proof', () => {
  assert.ok(
    LANES.settings.tests.includes('tests/runtime/managed-policy-sync-remote-delivery-readiness-gate-current-behavior.test.mjs'),
    'settings lane should run the remote delivery readiness gate'
  );
  const classified = classifyPaths([
    docPath,
    'tests/runtime/managed-policy-sync-remote-delivery-readiness-gate-current-behavior.test.mjs'
  ]);

  assert.deepEqual(classified.unmatched, []);
  assert.ok(classified.lanes.includes('settings'));
  assert.ok(classified.lanes.includes('smoke'));
});
