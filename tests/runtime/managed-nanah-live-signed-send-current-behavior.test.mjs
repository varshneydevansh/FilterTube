import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const tabViewPath = 'js/tab-view.js';
const managedLivePolicyPath = 'js/nanah_managed_live_policy.js';
const docPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_LIVE_SIGNED_SEND_2026-06-04.md';
const signingDocPath = 'docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const laneConfigPath = 'scripts/test-lane-config.mjs';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('managed live signed-send audit is linked without claiming mailbox runtime', () => {
  const doc = read(docPath);
  const signingDoc = read(signingDocPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Eligible live-session source send runtime slice/);
  assert.match(doc, /fixed-target Main\/Kids managed live sends/);
  assert.match(doc, /All other live sends continue through the existing proposal path/);
  assert.match(doc, /not a mailbox runtime, local-network discovery\s+runtime, key-rotation system, or offline later-delivery mechanism/);
  assert.match(signingDoc, new RegExp(docPath));
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, /fixed-target Main\/Kids managed live sends build signed `filtertube_managed_policy` envelopes/);
});

test('dashboard builds signed managed envelopes only after source link scope target and key gates', () => {
  const source = read(managedLivePolicyPath);

  assert.match(source, /global\.FilterTubeNanahManagedLivePolicy = \{ create \}/);
  assert.match(source, /function normalizeScope\(scope\)/);
  assert.match(source, /return normalized === 'main' \|\| normalized === 'kids' \? normalized : ''/);
  assert.match(source, /function resolveTargetProfile\(trustedLink\)/);
  assert.match(source, /async function buildEnvelopeForLiveSend\(policy\)/);
  assert.match(source, /if \(!trustedLink \|\| trustedLink\.linkType !== 'managed_link'\)/);
  assert.match(source, /if \(trustedLink\.localRole !== 'source' \|\| trustedLink\.remoteRole !== 'replica'\)/);
  assert.match(source, /if \(!allowedScopes\.includes\(scope\)\)/);
  assert.match(source, /if \(!normalizeString\(targetProfile\?\.profileId\)\)/);
  assert.match(source, /deps\.ensureSigningKeyPair\(\{ required: true \}\)/);
  assert.match(source, /privateKeyJwk: keyPair\.privateKeyJwk/);
  assert.match(source, /adapter\.signManagedPolicyEnvelope/);
});

test('managed source send uses signed envelope before proposal fallback and records outbound revision state', () => {
  const source = read(tabViewPath);
  const listenerStart = source.indexOf("ftNanahSendBtn.addEventListener('click'");
  assert.notEqual(listenerStart, -1);
  const listenerEnd = source.indexOf('if (ftNanahTrustBtn) {', listenerStart);
  assert.notEqual(listenerEnd, -1);
  const sendButtonBlock = source.slice(listenerStart, listenerEnd);
  assert.match(sendButtonBlock, /policy\.linkType === 'managed_link' && policy\.authorityMode === 'managed' && getNanahRole\(\) === 'source'/);
  assert.match(sendButtonBlock, /const signedEnvelope = await nanahManagedLivePolicy\.buildEnvelopeForLiveSend\(policy\)/);
  assert.match(sendButtonBlock, /await nanahClient\.send\(signedEnvelope\)/);
  assert.match(sendButtonBlock, /await nanahManagedLivePolicy\.markSent\(/);
  assert.match(sendButtonBlock, /return;\s+\}\s+let envelope = await adapter\.buildControlProposal/);
  assert.match(source, /window\.FilterTubeNanahManagedLivePolicy\?\.create/);
  assert.match(read(managedLivePolicyPath), /outgoingManagedPolicies/);
});

test('settings lane includes managed live signed-send regression proof', () => {
  const laneConfig = read(laneConfigPath);
  assert.match(laneConfig, /tests\/runtime\/managed-nanah-live-signed-send-current-behavior\.test\.mjs/);
});
