import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  createManagedPickupProviderOwnershipArtifact,
  writeManagedPickupProviderOwnershipArtifact
} from '../../scripts/create-managed-pickup-provider-ownership-artifact.mjs';
import {
  REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS,
  validateManagedPickupProviderOwnershipArtifact
} from '../../docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs';

const repoRoot = process.cwd();
const generatorPath = 'scripts/create-managed-pickup-provider-ownership-artifact.mjs';
const observationTemplatePath = 'docs/audit/artifacts/managed-pickup-provider-ownership/observation-template.json';
const gateDoc = 'docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md';

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
}

function rowEvidence() {
  return Object.fromEntries(REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS.map(id => [
    id,
    {
      summary: `${id} reviewed with redacted proof`,
      artifactOrDoc: id === 'FT-PICKUP-PROVIDER-00-owner-decision'
        ? gateDoc
        : 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md'
    }
  ]));
}

function validInput({ decision = 'reference_provider_only' } = {}) {
  const hosted = decision === 'filtertube_hosted_provider';

  return {
    logicalChangeType: 'managed pickup provider ownership generator fixture',
    automatedLaneEvidence: [{
      command: 'node --test tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs',
      status: 'passed',
      summary: 'provider ownership generator fixture passed',
      lanes: ['test:release', 'test:settings', 'test:smoke']
    }],
    ownershipDecision: {
      decision,
      owner: hosted ? 'FilterTube' : 'Self-hosted operator',
      operator: hosted ? 'FilterTube release ops' : 'User/operator',
      supportContact: hosted ? 'support@filtertube.in' : 'operator-owned',
      retentionPolicy: 'pickup rows expire and are purged after accepted ack, revocation, or TTL',
      purgeRevocationPolicy: 'revoked links and rotated keys purge pending pickup rows before any apply',
      abuseRateLimitPolicy: 'rate limit by link/device/profile and reject oversized queues',
      privacyBoundary: 'provider stores delivery metadata only; protected device validates locally',
      releaseClaim: hosted ? 'hosted_later_delivery_after_smoke' : 'optional_configured_pickup_only'
    },
    providerEvidence: {
      internetPickupStatus: hosted ? 'owned_deployed_smoked' : 'reference_or_user_supplied_only',
      homePickupStatus: 'explicit_provider_only_no_automatic_discovery',
      hostedEndpoint: hosted ? 'https://pickup.filtertube.in' : 'N/A',
      deploymentProof: hosted ? 'docs/audit/artifacts/provider/deployment-proof.json' : 'N/A',
      corsPreflightProof: hosted ? 'docs/audit/artifacts/provider/cors-proof.json' : 'N/A',
      providerStatusProof: hosted
        ? 'docs/audit/artifacts/provider/status-proof.json'
        : 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md',
      healthCheckProof: hosted ? 'docs/audit/artifacts/provider/health-proof.json' : 'N/A',
      roundTripSmokeArtifact: hosted
        ? 'docs/audit/artifacts/managed-remote-delivery-smoke/provider-round-trip.json'
        : 'N/A',
      redactedAckProof: hosted ? 'docs/audit/artifacts/provider/ack-proof.json' : 'N/A'
    },
    rowEvidence: rowEvidence()
  };
}

test('managed pickup provider ownership generator is exposed as release settings smoke script surface', () => {
  const packageJson = readJson('package.json');
  const result = classifyPaths([generatorPath]);

  assert.equal(packageJson.scripts['managed:provider-ownership'], `node ${generatorPath}`);
  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-pickup-provider-ownership-surface');
});

test('managed pickup provider ownership observation template covers required rows without pretending execution', () => {
  const template = readJson(observationTemplatePath);
  const result = classifyPaths([observationTemplatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-pickup-provider-ownership-surface');
  assert.deepEqual(Object.keys(template.rowEvidence), REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS);
  assert.equal(template.ownershipDecision.discoveryIsAuthority, false);
  assert.equal(template.ownershipDecision.providerIsPolicyAuthority, false);
  assert.equal(template.providerEvidence.hostedEndpoint, 'N/A');
  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input: template, confirmed: true }),
    /is required|must be reference_provider_only/
  );
});

test('managed pickup provider ownership generator creates verifier-compatible reference-only artifact', () => {
  const artifact = createManagedPickupProviderOwnershipArtifact({
    repoRoot,
    input: validInput(),
    confirmed: true
  });

  assert.deepEqual(validateManagedPickupProviderOwnershipArtifact(artifact), []);
  assert.equal(artifact.ownershipDecision.decision, 'reference_provider_only');
  assert.equal(artifact.ownershipDecision.discoveryIsAuthority, false);
  assert.equal(artifact.ownershipDecision.providerIsPolicyAuthority, false);
  assert.equal(artifact.providerEvidence.hostedEndpoint, 'N/A');
  assert.match(artifact.providerEvidence.providerStatusProof, /REFERENCE_PROVIDER/);
  assert.equal(artifact.requiredRows.length, 6);
});

test('managed pickup provider ownership generator creates verifier-compatible hosted artifact when proof exists', () => {
  const artifact = createManagedPickupProviderOwnershipArtifact({
    repoRoot,
    input: validInput({ decision: 'filtertube_hosted_provider' }),
    confirmed: true
  });

  assert.deepEqual(validateManagedPickupProviderOwnershipArtifact(artifact), []);
  assert.equal(artifact.ownershipDecision.decision, 'filtertube_hosted_provider');
  assert.equal(artifact.providerEvidence.internetPickupStatus, 'owned_deployed_smoked');
  assert.equal(artifact.providerEvidence.hostedEndpoint, 'https://pickup.filtertube.in');
});

test('managed pickup provider ownership generator writes verifier-compatible artifact file', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-provider-ownership-output-'));
  const outputPath = path.join(outputDir, 'provider-ownership.json');
  const artifact = createManagedPickupProviderOwnershipArtifact({
    repoRoot,
    input: validInput(),
    confirmed: true
  });
  const written = writeManagedPickupProviderOwnershipArtifact(artifact, outputPath);
  const roundTrip = JSON.parse(fs.readFileSync(written, 'utf8'));

  assert.equal(written, outputPath);
  assert.deepEqual(validateManagedPickupProviderOwnershipArtifact(roundTrip), []);
});

test('managed pickup provider ownership generator refuses unconfirmed evidence', () => {
  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input: validInput() }),
    /confirm-provider-ownership-reviewed/
  );
});

test('managed pickup provider ownership generator refuses missing row evidence', () => {
  const input = validInput();
  delete input.rowEvidence['FT-PICKUP-PROVIDER-04-authority-boundary'];

  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input, confirmed: true }),
    /input\.rowEvidence\.FT-PICKUP-PROVIDER-04-authority-boundary must be an object/
  );
});

test('managed pickup provider ownership generator refuses provider authority overclaims', () => {
  const input = validInput();
  input.ownershipDecision.providerIsPolicyAuthority = true;

  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input, confirmed: true }),
    /providerIsPolicyAuthority cannot be true/
  );
});

test('managed pickup provider ownership generator refuses placeholder provider status proof', () => {
  const input = validInput();
  input.providerEvidence.providerStatusProof = 'N/A';

  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input, confirmed: true }),
    /providerStatusProof must identify the safe provider status proof/
  );
});

test('managed pickup provider ownership generator refuses sensitive input keys', () => {
  const input = validInput();
  input.providerEvidence.rawPolicyJson = '{}';

  assert.throws(
    () => createManagedPickupProviderOwnershipArtifact({ repoRoot, input, confirmed: true }),
    /input contains sensitive provider ownership fields/
  );
});
