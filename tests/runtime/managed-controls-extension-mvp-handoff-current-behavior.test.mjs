import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const handoffPath = 'docs/audit/FILTERTUBE_MANAGED_CONTROLS_EXTENSION_MVP_HANDOFF_2026-06-21.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const transportGatePath = 'docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md';
const referenceProviderPath = 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md';
const providerOwnershipPath = 'docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed controls extension MVP handoff is linked from the main plan', () => {
  const handoff = read(handoffPath);
  const plan = read(planPath);
  const transportGate = read(transportGatePath);
  const referenceProvider = read(referenceProviderPath);
  const providerOwnership = read(providerOwnershipPath);

  assert.match(handoff, /FilterTube Managed Controls Extension MVP Handoff/);
  assert.match(plan, new RegExp(handoffPath));
  assert.match(transportGate, /Extension policy authority and provider-gated intake hooks are\s+present/);
  assert.match(referenceProvider, /transport proof, not policy authority/i);
  assert.match(referenceProvider, /No automatic LAN peer discovery/);
  assert.match(providerOwnership, /Provider ownership and release-claim gate/);
});

test('managed controls handoff keeps implemented extension scope separate from release blockers', () => {
  const handoff = read(handoffPath);

  for (const implemented of [
    'extension policy authority: implemented',
    'parent/caregiver Family Controls UI: implemented',
    'live Nanah Send Update: implemented for eligible connected verified devices',
    'Internet Pickup/Home Pickup hooks: implemented behind explicit provider setup',
    'Home Pickup visible readiness Check: required by release smoke artifact',
    'reference provider: implemented as self-hosted proof only'
  ]) {
    assert.ok(handoff.includes(implemented), `missing implemented status ${implemented}`);
  }

  for (const remaining of [
    'automatic LAN peer discovery: not implemented',
    'hosted Internet Pickup service: not owned/deployed in this repo',
    'native Android/iOS parity: downstream lane',
    'manual installed-extension smoke: still required before release claim'
  ]) {
    assert.ok(handoff.includes(remaining), `missing remaining status ${remaining}`);
  }
});

test('managed controls handoff does not overclaim transport or app authority', () => {
  const handoff = read(handoffPath);

  for (const forbiddenClaim of [
    'Automatic LAN device discovery',
    'Wi-Fi presence as authority',
    'Hosted FilterTube Internet Pickup service availability',
    'Guaranteed later delivery when no provider is configured',
    'Complete Android/iOS parity',
    'Release-ready cross-device managed controls without installed two-device smoke'
  ]) {
    assert.ok(handoff.includes(forbiddenClaim), `missing non-claim boundary ${forbiddenClaim}`);
  }

  assert.match(handoff, /Delivery paths are never policy authority/);
  assert.match(handoff, /local trusted-link, target-profile,\s+scope, revision, hash, device binding, and signature checks decide apply\/reject/);
  assert.match(handoff, /Treat the extension repo as ready for a final installed-extension smoke pass, not\s+as fully complete cross-platform remote management/);
});

test('managed controls handoff names the required final smoke and downstream lanes', () => {
  const handoff = read(handoffPath);

  for (const row of [
    'Create protected profile.',
    'Set Main/Kids access.',
    'Set a daily YouTube time limit.',
    'Import a small rule list and apply to Main, Kids, and both in separate passes.',
    'Pair a second verified device/profile.',
    'Send keyword/channel/video/viewing-space/time-limit updates over live Nanah.',
    'If Home Pickup is configured, click the visible Check action and record the',
    'Confirm accepted/rejected protected history rows.',
    'Confirm denied Main/Kids surface shows the route gate.',
    'Confirm exhausted time shows the timeout overlay and records a request.',
    'Confirm empty/no-policy YouTube remains snappy after SPA navigation.'
  ]) {
    assert.ok(handoff.includes(row), `missing release smoke row ${row}`);
  }

  assert.match(handoff, /Internet Pickup service\s+-> HTTPS endpoint\s+-> durable encrypted item queue/s);
  assert.match(handoff, /Home Pickup service\s+-> explicit same-network endpoint\s+-> visible parent Check action and redacted health result/s);
  assert.match(handoff, /Provider ownership gate\s+-> docs\/audit\/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21\.md/s);
  assert.match(handoff, /Android\s+-> settings locks\s+-> Main\/Kids route gate/s);
  assert.match(handoff, /iOS\s+-> same parity set as Android/s);
});

test('settings and smoke lanes own managed controls handoff proof', () => {
  const testPath = 'tests/runtime/managed-controls-extension-mvp-handoff-current-behavior.test.mjs';
  assert.ok(LANES.settings.tests.includes(testPath), 'settings lane should include the handoff proof');
  assert.ok(LANES.smoke.tests.includes(testPath), 'smoke lane should include the handoff proof');

  const classified = classifyPaths([handoffPath, testPath]);
  assert.deepEqual(classified.unmatched, []);
  assert.ok(classified.lanes.includes('settings'));
  assert.ok(classified.lanes.includes('smoke'));
});
