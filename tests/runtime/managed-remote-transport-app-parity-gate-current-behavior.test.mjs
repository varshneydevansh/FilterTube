import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md';
const readinessDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md';
const localNetworkDocPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md';
const openSyncDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md';
const appParityDocPath = 'docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md';
const discoveryBoundaryDocPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed transport app parity gate is linked to current remote delivery proof family', () => {
  const doc = read(docPath);
  const readiness = read(readinessDocPath);
  const localNetwork = read(localNetworkDocPath);
  const openSync = read(openSyncDocPath);
  const appParity = read(appParityDocPath);
  const discoveryBoundary = read(discoveryBoundaryDocPath);

  assert.match(doc, /Extension policy authority and provider-gated intake hooks are\s+present/);
  assert.match(doc, /Complete remote management remains blocked until one transport has\s+installed two-device smoke and app parity proof/);
  assert.match(doc, new RegExp(readinessDocPath));
  assert.match(doc, new RegExp(localNetworkDocPath));
  assert.match(doc, new RegExp(openSyncDocPath));
  assert.match(doc, new RegExp(appParityDocPath));
  assert.match(doc, new RegExp(discoveryBoundaryDocPath));
  assert.match(readiness, new RegExp(docPath));
  assert.match(readiness, /companion transport\/app parity gate/);
  assert.match(localNetwork, /runtime built-in LAN peer discovery: absent/);
  assert.match(openSync, /runtime server mailbox pull client: absent/);
  assert.match(appParity, /iOS parity remains pending/);
  assert.match(discoveryBoundary, /Local-network discovery is convenience only/);
  assert.match(discoveryBoundary, /provider handoff is not authority/);
});

test('transport app parity gate keeps allowed and blocked remote-management wording separate', () => {
  const doc = read(docPath);

  for (const allowed of [
    'Managed local child/protected-profile edits are supported',
    'Signed managed-policy validation is revision and integrity gated',
    'Live Nanah sends are available only for eligible connected sessions',
    'Provider-gated pull-on-open and local-network intake hooks exist',
    'Protected devices keep the last accepted policy when delivery is unavailable',
    'Local-network discovery is not authority'
  ]) {
    assert.ok(doc.includes(allowed), `missing allowed wording ${allowed}`);
  }

  for (const blocked of [
    'Complete remote local-network management',
    'Guaranteed later delivery after the parent device goes offline',
    'Always-on parent-to-child sync',
    'Server mailbox delivery',
    'Automatic LAN peer discovery',
    'Cross-platform remote management without installed smoke on extension and'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked wording ${blocked}`);
  }
});

test('transport app parity matrix preserves extension app ownership split', () => {
  const doc = read(docPath);

  for (const area of [
    'Live Nanah',
    'Pull-on-open mailbox',
    'Local network',
    'Policy apply',
    'Main/Kids access',
    'Time limits',
    'Action history'
  ]) {
    assert.ok(doc.includes(area), `missing matrix area ${area}`);
  }

  for (const proof of [
    'transport selected: required',
    'permission boundary proof: required',
    'identity and signature binding: required',
    'replay/revocation fixtures: required',
    'parent-facing accepted/rejected ack history: required',
    'no-policy/no-provider no-work proof: required',
    'installed two-device smoke: required',
    'Android installed smoke: required',
    'iOS parity proof: required',
    'public release wording review: required'
  ]) {
    assert.ok(doc.includes(proof), `missing required proof ${proof}`);
  }

  assert.match(doc, /App or trusted provider must own mailbox pull and decryption/);
  assert.match(doc, /Native app\/provider may own LAN discovery, but discovery must never grant authority/);
  assert.match(doc, /App shell must gate Main and Kids before opening web\/native content/);
  assert.match(doc, /App shell must enforce startup, resume, heartbeat, pause, and reduced-budget behavior/);
});

test('settings lane owns managed transport app parity gate', () => {
  assert.ok(
    LANES.settings.tests.includes('tests/runtime/managed-remote-transport-app-parity-gate-current-behavior.test.mjs'),
    'settings lane should run the transport/app parity gate'
  );

  const classified = classifyPaths([
    docPath,
    'tests/runtime/managed-remote-transport-app-parity-gate-current-behavior.test.mjs'
  ]);
  assert.deepEqual(classified.unmatched, []);
  assert.ok(classified.lanes.includes('settings'));
  assert.ok(classified.lanes.includes('smoke'));
});
