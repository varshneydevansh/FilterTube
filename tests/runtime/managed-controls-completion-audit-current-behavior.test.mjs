import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_CONTROLS_COMPLETION_AUDIT_2026-06-21.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const transportGatePath = 'docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md';
const appContractPath = 'docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md';
const remoteReadinessPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md';
const localProviderPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md';
const pickupProviderOwnershipPath = 'docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed controls completion audit keeps whole-goal status distinct from extension status', () => {
  const doc = read(docPath);

  assert.match(doc, /Whole-goal completion is not proven/);
  assert.match(doc, /whole goal complete: NO/);
  assert.match(doc, /extension local protected-profile controls: EXTENSION-PRESENT/);
  assert.match(doc, /extension live Nanah signed send: EXTENSION-PRESENT, MANUAL-SMOKE-PENDING/);
  assert.match(doc, /extension provider-gated Internet Pickup\/Home Pickup clients: PARTIAL-PROVIDER/);
  assert.match(doc, /hosted Internet Pickup service ownership\/deployment: NOT-CLAIMED/);
  assert.match(doc, /automatic same-network peer discovery: NOT-CLAIMED, DOWNSTREAM-PENDING/);
  assert.match(doc, /native Android\/iOS settings lock and time-limit parity: DOWNSTREAM-PENDING/);
  assert.match(doc, /installed two-device extension smoke: MANUAL-SMOKE-PENDING/);
});

test('managed controls completion audit covers the active goal requirements', () => {
  const doc = read(docPath);

  for (const requirement of [
    'Parent/account profiles can manage protected profiles locally.',
    'Protected-user PIN never becomes admin authority; siblings cannot mutate each other.',
    'Admin actions require parent/account PIN/session, TTL, sensitive re-auth, rate limiting, and failed-attempt logging.',
    'Trusted parent/caregiver devices can send protected-device policy through Nanah live P2P.',
    'Remote management can update keywords, channels, videos, viewing space, and time limits through the same validated rule paths as local controls.',
    'Protected devices keep the last valid parent/caregiver policy while offline.',
    'Optional encrypted Internet Pickup can deliver later updates without plaintext rules.',
    'Home Pickup can support explicitly configured same-network delivery without making LAN discovery authority.',
    'Local-network discovery is not authority; stale, replayed, revoked, mismatched, spoofed, or untrusted policies are rejected.',
    'Main YouTube and YouTube Kids access are enforced per protected profile.',
    'YouTube time limits are enforced per protected profile.',
    'Timeout surface is visible and protected user cannot bypass it through profile-owned settings.',
    'Parent/caregiver action history records accepted/rejected policy changes and is not policy authority.',
    'Extension and apps share one policy contract without forking authority.',
    'Family Device Updates UI uses one parent-facing model for Send Update, Home Pickup, Internet Pickup, and offline last-valid-policy state.',
    'No-policy/no-work performance remains intact.',
    'Public docs must not overclaim control outside extension/app-owned surfaces.'
  ]) {
    assert.ok(doc.includes(requirement), `missing completion-audit requirement: ${requirement}`);
  }
});

test('managed controls completion audit links to current proof families and remaining owners', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const transportGate = read(transportGatePath);
  const appContract = read(appContractPath);
  const remoteReadiness = read(remoteReadinessPath);
  const localProvider = read(localProviderPath);
  const pickupProviderOwnership = read(pickupProviderOwnershipPath);

  for (const proof of [
    'tests/runtime/managed-child-local-authority-current-behavior.test.mjs',
    'tests/runtime/managed-admin-authority-helper-current-behavior.test.mjs',
    'tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs',
    'tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs',
    'tests/runtime/managed-local-network-provider-current-behavior.test.mjs',
    'tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs',
    'tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs',
    'tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs',
    'tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs',
    'tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs',
    'tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs',
    'tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs',
    'tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs',
    'tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(proof), `missing linked proof ${proof}`);
  }

  assert.match(plan, /Automatic LAN peer discovery authority\. This remains app\/provider work/);
  assert.match(transportGate, /Complete remote management remains blocked until one transport has\s+installed two-device smoke and app parity proof/);
  assert.match(appContract, /installed iOS parity\s+remains pending/i);
  assert.match(remoteReadiness, /hosted service deployment and automatic same-network\s+discovery design work/);
  assert.match(localProvider, /runtime built-in same-network peer discovery: absent/);
  assert.match(doc, /docs\/audit\/artifacts\/managed-extension-installed-smoke\/template\.json/);
  assert.match(doc, /verify-managed-extension-smoke-artifact\.mjs/);
  assert.match(doc, /docs\/audit\/artifacts\/managed-pickup-provider-ownership\/template\.json/);
  assert.match(doc, /docs\/audit\/artifacts\/managed-native-runtime-sync-handoff\/template\.json/);
  assert.match(pickupProviderOwnership, /That service is only delivery\. It never decides policy/);
  assert.match(pickupProviderOwnership, /Guaranteed later parent-to-child delivery/);
});

test('managed controls completion audit blocks overclaim wording while preserving safe wording', () => {
  const doc = read(docPath);

  for (const safe of [
    'FilterTube extension has protected-profile management',
    'Internet Pickup and Home Pickup are optional delivery paths',
    'A protected device keeps the last accepted policy'
  ]) {
    assert.ok(doc.includes(safe), `missing safe release wording ${safe}`);
  }

  for (const blocked of [
    'Complete remote management across extension and mobile apps.',
    'Automatic Wi-Fi/LAN device discovery.',
    'Hosted FilterTube cloud pickup service.',
    'Native Android/iOS parity without installed smoke artifacts.',
    'Provider, mailbox, LAN, URL list, or discovery layer as policy authority.'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked release wording ${blocked}`);
  }
  assert.match(doc, /Guaranteed later delivery without a configured Internet Pickup\/Home Pickup\s+provider\./);
});

test('settings lane owns managed controls completion audit', () => {
  assert.ok(
    LANES.settings.tests.includes('tests/runtime/managed-controls-completion-audit-current-behavior.test.mjs'),
    'settings lane should run the managed-controls completion audit'
  );

  const classified = classifyPaths([
    docPath,
    'tests/runtime/managed-controls-completion-audit-current-behavior.test.mjs'
  ]);
  assert.deepEqual(classified.unmatched, []);
  assert.ok(classified.lanes.includes('settings'));
  assert.ok(classified.lanes.includes('smoke'));
});
