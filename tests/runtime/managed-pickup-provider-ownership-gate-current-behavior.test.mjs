import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_TEMPLATE,
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_GENERATOR,
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_VERIFIER,
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_REQUIRED_ROWS
} from '../../scripts/test-lane-config.mjs';
import {
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC,
  REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS,
  validateManagedPickupProviderOwnershipArtifact
} from '../../docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs';

const repoRoot = process.cwd();
const docPath = MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC;
const templatePath = 'docs/audit/artifacts/managed-pickup-provider-ownership/template.json';
const verifierPath = 'docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs';
const referenceProviderTestPath = 'tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function validArtifact({ decision = 'reference_provider_only' } = {}) {
  const laneEvidence = {
    command: 'node --test tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs',
    status: 'passed',
    summary: 'provider ownership gate verifier passed',
    lanes: ['test:release', 'test:settings', 'test:smoke']
  };

  return {
    artifactType: 'filtertube-managed-pickup-provider-ownership',
    schemaVersion: 1,
    status: 'executed',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC,
    changeContext: {
      logicalChangeType: 'managed pickup provider ownership gate',
      requiredLanes: ['test:release', 'test:settings', 'test:smoke'],
      automatedLaneEvidence: [laneEvidence]
    },
    ownershipDecision: {
      decision,
      owner: decision === 'filtertube_hosted_provider' ? 'FilterTube' : 'Self-hosted operator',
      operator: decision === 'filtertube_hosted_provider' ? 'FilterTube release ops' : 'User/operator',
      supportContact: decision === 'filtertube_hosted_provider' ? 'support@filtertube.in' : 'operator-owned',
      retentionPolicy: 'pickup rows expire and are purged after accepted ack, revocation, or TTL',
      purgeRevocationPolicy: 'revoked links and rotated keys purge pending pickup rows before any apply',
      abuseRateLimitPolicy: 'rate limit by link/device/profile and reject oversized queues',
      privacyBoundary: 'provider stores delivery metadata only; protected device validates locally',
      releaseClaim: decision === 'filtertube_hosted_provider' ? 'hosted_later_delivery_after_smoke' : 'optional_configured_pickup_only',
      discoveryIsAuthority: false,
      providerIsPolicyAuthority: false
    },
    providerEvidence: {
      internetPickupStatus: decision === 'filtertube_hosted_provider' ? 'owned_deployed_smoked' : 'reference_or_user_supplied_only',
      homePickupStatus: 'explicit_provider_only_no_automatic_discovery',
      providerScript: 'scripts/managed-delivery-provider.mjs',
      providerDocs: 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md',
      hostedEndpoint: decision === 'filtertube_hosted_provider' ? 'https://pickup.filtertube.in' : 'N/A',
      deploymentProof: decision === 'filtertube_hosted_provider' ? 'docs/audit/artifacts/provider/deployment-proof.json' : 'N/A',
      corsPreflightProof: decision === 'filtertube_hosted_provider' ? 'docs/audit/artifacts/provider/cors-proof.json' : 'N/A',
      providerStatusProof: decision === 'filtertube_hosted_provider'
        ? 'docs/audit/artifacts/provider/status-proof.json'
        : 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md',
      healthCheckProof: decision === 'filtertube_hosted_provider' ? 'docs/audit/artifacts/provider/health-proof.json' : 'N/A',
      roundTripSmokeArtifact: decision === 'filtertube_hosted_provider'
        ? 'docs/audit/artifacts/managed-remote-delivery-smoke/provider-round-trip.json'
        : 'N/A',
      redactedAckProof: decision === 'filtertube_hosted_provider' ? 'docs/audit/artifacts/provider/ack-proof.json' : 'N/A'
    },
    requiredRows: REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS.map((id, index) => ({
      id,
      requiredObservation: `row ${index} observed`,
      status: 'passed',
      observation: {
        pass: true,
        summary: `${id} passed`
      },
      evidence: {
        artifactOrDoc: index === 0 ? MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC : templatePath,
        authorityGrantedByProvider: false
      }
    }))
  };
}

test('provider ownership gate is wired into release settings and smoke lanes', () => {
  const doc = read(docPath);

  assert.ok(LANES.release.tests.includes('tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs'));
  assert.ok(LANES.settings.tests.includes('tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs'));
  assert.ok(LANES.release.tests.includes(referenceProviderTestPath));
  assert.ok(LANES.settings.tests.includes(referenceProviderTestPath));
  assert.ok(LANES.smoke.tests.includes(referenceProviderTestPath));
  assert.equal(MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_TEMPLATE, templatePath);
  assert.equal(
    MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_GENERATOR,
    'npm run managed:provider-ownership -- --input <redacted-provider-ownership.json> --confirm-provider-ownership-reviewed'
  );
  assert.equal(
    MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_VERIFIER,
    'node docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs docs/audit/artifacts/managed-pickup-provider-ownership/<artifact>.json'
  );
  assert.deepEqual(MANAGED_PICKUP_PROVIDER_OWNERSHIP_REQUIRED_ROWS, REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS);
  assert.ok(doc.includes(templatePath));
  assert.ok(doc.includes(verifierPath));
});

test('provider ownership doc keeps parent wording simple and blocks authority overclaims', () => {
  const doc = read(docPath);

  assert.match(doc, /open both devices -> pair -> verify -> Send Update/);
  assert.match(doc, /That service is only delivery\. It never decides policy/);
  assert.match(doc, /FilterTube-hosted Internet Pickup service/);
  assert.match(doc, /Guaranteed later parent-to-child delivery/);
  assert.match(doc, /Network presence or provider reachability as authority/);
  assert.match(doc, /provider URL selects a protected profile/);
});

test('classifier treats provider ownership gate files as release settings and smoke proof', () => {
  const result = classifyPaths([docPath, verifierPath, templatePath, referenceProviderTestPath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-pickup-provider-ownership-surface');
});

test('verifier rejects unexecuted template while template keeps authority defaults false', () => {
  const template = readJson(templatePath);
  const errors = validateManagedPickupProviderOwnershipArtifact(template);

  assert.equal(template.ownershipDecision.discoveryIsAuthority, false);
  assert.equal(template.ownershipDecision.providerIsPolicyAuthority, false);
  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('ownershipDecision.decision must be reference_provider_only, user_supplied_provider_only, or filtertube_hosted_provider'));
  assert.ok(!errors.includes('ownershipDecision.discoveryIsAuthority must be false'));
  assert.ok(!errors.includes('ownershipDecision.providerIsPolicyAuthority must be false'));
  assert.ok(errors.includes('FT-PICKUP-PROVIDER-00-owner-decision.status must be passed'));
});

test('verifier accepts reference-only and hosted-provider decisions when evidence matches', () => {
  assert.deepEqual(validateManagedPickupProviderOwnershipArtifact(validArtifact()), []);
  assert.deepEqual(
    validateManagedPickupProviderOwnershipArtifact(validArtifact({ decision: 'filtertube_hosted_provider' })),
    []
  );
});

test('verifier rejects guaranteed later-delivery claims without hosted proof', () => {
  const artifact = validArtifact();
  artifact.ownershipDecision.releaseClaim = 'guaranteed_later_delivery';
  artifact.providerEvidence.hostedEndpoint = 'https://pickup.filtertube.in';
  artifact.providerEvidence.internetPickupStatus = 'owned_deployed_smoked';

  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
  assert.ok(errors.includes('ownershipDecision.releaseClaim guaranteed_later_delivery requires filtertube_hosted_provider'));
  assert.ok(errors.includes('providerEvidence.hostedEndpoint must be N/A unless filtertube_hosted_provider is selected'));
  assert.ok(errors.includes('providerEvidence.internetPickupStatus cannot be owned_deployed_smoked without filtertube_hosted_provider'));
});

test('verifier rejects placeholder provider status proof for non-hosted pickup', () => {
  const artifact = validArtifact();
  artifact.providerEvidence.providerStatusProof = 'N/A';

  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
  assert.ok(errors.includes('providerEvidence.providerStatusProof must identify the safe provider status proof'));
});

test('verifier rejects hosted-provider artifacts missing deployment proof', () => {
  const artifact = validArtifact({ decision: 'filtertube_hosted_provider' });
  artifact.providerEvidence.deploymentProof = 'N/A';
  artifact.providerEvidence.corsPreflightProof = '';
  artifact.providerEvidence.providerStatusProof = '';
  artifact.providerEvidence.redactedAckProof = '';

  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
  assert.ok(errors.includes('providerEvidence.deploymentProof is required for filtertube_hosted_provider'));
  assert.ok(errors.includes('providerEvidence.corsPreflightProof is required for filtertube_hosted_provider'));
  assert.ok(errors.includes('providerEvidence.providerStatusProof must identify the safe provider status proof'));
  assert.ok(errors.includes('providerEvidence.providerStatusProof is required'));
  assert.ok(errors.includes('providerEvidence.redactedAckProof is required for filtertube_hosted_provider'));
});

test('verifier rejects provider authority and sensitive plaintext', () => {
  const artifact = validArtifact();
  artifact.requiredRows[4].evidence.authorityGrantedByProvider = true;
  artifact.ownershipDecision.pin = '1234';
  artifact.providerEvidence.rawPolicyJson = '{}';

  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
  assert.ok(errors.includes('FT-PICKUP-PROVIDER-04-authority-boundary.evidence.authorityGrantedByProvider must be false'));
  assert.ok(errors.includes('ownershipDecision.pin must not be present in managed pickup provider ownership artifacts'));
  assert.ok(errors.includes('providerEvidence.rawPolicyJson must not be present in managed pickup provider ownership artifacts'));
});

test('verifier CLI exits nonzero for template and zero for a complete artifact', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-provider-gate-'));
  const artifactPath = path.join(tempDir, 'provider-decision.json');
  fs.writeFileSync(artifactPath, `${JSON.stringify(validArtifact(), null, 2)}\n`);

  const templateRun = spawnSync(process.execPath, [verifierPath, templatePath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const validRun = spawnSync(process.execPath, [verifierPath, artifactPath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(templateRun.status, 1);
  assert.match(templateRun.stdout, /"valid": false/);
  assert.equal(validRun.status, 0);
  assert.match(validRun.stdout, /"valid": true/);
});
