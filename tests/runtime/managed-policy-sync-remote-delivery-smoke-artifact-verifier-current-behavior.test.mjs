import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_TEMPLATE,
  MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_VERIFIER,
  MANAGED_REMOTE_DELIVERY_SMOKE_REQUIRED_ROWS
} from '../../scripts/test-lane-config.mjs';
import {
  MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC,
  REQUIRED_MANAGED_REMOTE_DELIVERY_ROWS,
  validateManagedRemoteDeliverySmokeArtifact
} from '../../docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs';

const repoRoot = process.cwd();
const verifierPath = 'docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs';
const templatePath = 'docs/audit/artifacts/managed-remote-delivery-smoke/template.json';
const boundaryDocPath = MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function baseEvidence(rowId, transportMode) {
  const policyLikeRow = rowId.includes('policy') || rowId.includes('gate');
  return {
    sourceDeviceId: 'parent-device-01',
    targetProfileId: 'child-profile-01',
    trustedLinkId: 'trusted-link-01',
    targetDeviceId: 'child-device-01',
    transportMode,
    scope: rowId,
    ...(policyLikeRow ? {
      revision: 7,
      policyHash: `sha256-${rowId}`
    } : {})
  };
}

function validArtifact({ transportMode = 'live_nanah' } = {}) {
  const generatedAt = '2026-06-05T00:00:00.000Z';
  const laneEvidence = {
    command: 'npm run test:changed',
    status: 'passed',
    summary: 'release, settings, and smoke lanes passed before managed remote smoke',
    lanes: ['test:release', 'test:settings', 'test:smoke']
  };

  return {
    artifactType: 'filtertube-managed-remote-delivery-smoke',
    schemaVersion: 1,
    status: 'executed',
    transportSliceReadiness: 'GO-FOR-THIS-TRANSPORT-SMOKE',
    remoteManagementReleaseReadiness: 'GO-FOR-THIS-TRANSPORT-SMOKE',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'managed remote delivery smoke',
      requiredLanes: ['test:release', 'test:settings', 'test:smoke'],
      automatedLaneEvidence: [laneEvidence]
    },
    transport: {
      mode: transportMode,
      providerName: `${transportMode}-provider`,
      networkContext: `${transportMode}-controlled-test-context`,
      providerProof: providerProofForTransport(transportMode),
      parentDeviceLabel: 'Parent Chrome profile',
      childDeviceLabel: 'Child Chrome profile'
    },
    recordingFields: {
      manualTimestamp: generatedAt,
      testerInitials: 'dv',
      parentBrowserNameVersion: 'Chrome/136.0.0.0',
      childBrowserNameVersion: 'Chrome/136.0.0.0',
      parentExtensionId: 'parent-extension-id',
      childExtensionId: 'child-extension-id',
      parentProfileId: 'parent-profile-01',
      childProfileId: 'child-profile-01',
      trustedLinkId: 'trusted-link-01',
      sourceDeviceId: 'parent-device-01',
      targetDeviceId: 'child-device-01',
      sourcePublicKeyId: 'source-key-01',
      keyVersion: '1',
      transportMode,
      observedAckHistory: 'accepted keyword/channel/video/viewing/time rows and rejected replay row were visible without plaintext values',
      observedNoWorkState: 'no provider/no pending policy left YouTube idle path without added observer or LAN fetch loops'
    },
    installedExtensionParity: {
      parent: {
        workspaceRevisionOrHash: 'abc123',
        extensionPath: repoRoot,
        manifestVersion: '3.3.2',
        serviceWorkerVersion: 'js/background.js',
        extensionReloadTimestamp: generatedAt,
        dashboardUrl: 'chrome-extension://parent-extension-id/html/tab-view.html',
        sourceHashes: {
          'manifest.json': 'hash-parent-manifest',
          'js/nanah_sync_adapter.js': 'hash-parent-adapter'
        },
        missingFields: [],
        verdict: 'GO'
      },
      child: {
        workspaceRevisionOrHash: 'abc123',
        extensionPath: repoRoot,
        manifestVersion: '3.3.2',
        serviceWorkerVersion: 'js/background.js',
        extensionReloadTimestamp: generatedAt,
        dashboardUrl: 'chrome-extension://child-extension-id/html/tab-view.html',
        activeYouTubeUrl: 'https://www.youtube.com/watch?v=abc12345678',
        sourceHashes: {
          'manifest.json': 'hash-child-manifest',
          'js/content_bridge.js': 'hash-child-content-bridge'
        },
        missingFields: [],
        verdict: 'GO'
      }
    },
    manualInstalledEvidence: {
      parentDashboardArtifact: 'docs/audit/artifacts/managed-remote-delivery-smoke/manual/parent-dashboard-proof.png',
      childYouTubeArtifact: 'docs/audit/artifacts/managed-remote-delivery-smoke/manual/child-youtube-proof.png',
      managedActionHistoryArtifact: 'docs/audit/artifacts/managed-remote-delivery-smoke/manual/action-history-proof.json',
      notes: 'Manual installed-extension smoke observed parent dashboard send, child YouTube behavior, and redacted managed action history.'
    },
    requiredRows: REQUIRED_MANAGED_REMOTE_DELIVERY_ROWS.map((id, index) => ({
      id,
      requiredObservation: `row ${index} observed`,
      status: 'passed',
      observation: {
        pass: true,
        summary: `${id} passed`
      },
      evidence: baseEvidence(id, transportMode),
      durationMs: 500 + index
    })),
    completionRules: {
      allRecordingFieldsRequired: true,
      installedExtensionParityMustPassForParentAndChild: true,
      allRowsMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      noPlaintextSensitiveFields: true
    }
  };
}

function providerProofForTransport(transportMode) {
  if (transportMode === 'live_nanah') {
    return {
      providerKind: 'none',
      endpointClass: 'none',
      referenceProviderScript: '',
      referenceProviderAuditDoc: '',
      explicitEndpointConfigured: false,
      providerHealthOrRoundTrip: '',
      corsPreflightVerified: false,
      automaticDiscoveryObserved: false,
      hostedServiceClaimed: false,
      notes: 'Live Nanah same-session send; no provider endpoint used.'
    };
  }
  const endpointClass = transportMode === 'encrypted_mailbox' ? 'public_https' : 'private_or_local_http';
  return {
    providerKind: 'reference_provider',
    endpointClass,
    referenceProviderScript: 'scripts/managed-delivery-provider.mjs',
    referenceProviderAuditDoc: 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md',
    explicitEndpointConfigured: true,
    providerHealthOrRoundTrip: transportMode === 'encrypted_mailbox'
      ? 'upload/pull/purge and redacted ack round trip verified through configured endpoint'
      : 'health, publish/discover, and redacted ack round trip verified through configured endpoint',
    corsPreflightVerified: transportMode === 'encrypted_mailbox',
    automaticDiscoveryObserved: false,
    hostedServiceClaimed: false,
    notes: 'Reference provider proves endpoint shape only; local runtime validation remains authority.'
  };
}

test('managed remote delivery smoke verifier is wired into release settings and smoke lanes', () => {
  const boundaryDoc = read(boundaryDocPath);

  assert.ok(LANES.release.tests.includes('tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.settings.tests.includes('tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.equal(MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_TEMPLATE, templatePath);
  assert.equal(
    MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_VERIFIER,
    'node docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs docs/audit/artifacts/managed-remote-delivery-smoke/<artifact>.json'
  );
  assert.deepEqual(MANAGED_REMOTE_DELIVERY_SMOKE_REQUIRED_ROWS, REQUIRED_MANAGED_REMOTE_DELIVERY_ROWS);
  assert.ok(boundaryDoc.includes(templatePath));
  assert.ok(boundaryDoc.includes(verifierPath));
  assert.ok(boundaryDoc.includes('FT-MANAGED-REMOTE-10-key-rotation-repair-status'));
  assert.ok(boundaryDoc.includes('FT-MANAGED-REMOTE-12-encrypted-history-summary-boundary'));
  assert.ok(boundaryDoc.includes('FT-MANAGED-REMOTE-13-command-center-delivery-path-detail'));
  assert.ok(boundaryDoc.includes('FT-MANAGED-REMOTE-14-managed-list-policy-apply'));
  assert.match(boundaryDoc, /Issue 62 style\s+managed channel filter lists/);
  assert.match(boundaryDoc, /Delivery detail separates live P2P, LAN provider/);
  assert.match(
    boundaryDoc,
    /valid artifact proves one\s+transport slice, not complete remote-management\s+release readiness/
  );
  assert.match(boundaryDoc, /manual installed-extension evidence/);
});

test('classifier treats managed remote smoke artifact files as release settings and smoke proof', () => {
  const result = classifyPaths([verifierPath, templatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-remote-delivery-smoke-artifact-surface');
});

test('verifier rejects the non-executed template and missing installed parity', () => {
  const template = readJson(templatePath);
  const errors = validateManagedRemoteDeliverySmokeArtifact(template);

  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('transportSliceReadiness must be GO-FOR-THIS-TRANSPORT-SMOKE'));
  assert.ok(errors.includes('remoteManagementReleaseReadiness must be GO-FOR-THIS-TRANSPORT-SMOKE'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('changeContext.requiredLanes must list required test lanes'));
  assert.ok(errors.includes('changeContext.automatedLaneEvidence must contain at least one passed lane command'));
  assert.ok(errors.includes('transport.mode must be one of live_nanah, local_network_provider, encrypted_mailbox'));
  assert.ok(errors.includes('transport.providerProof.providerKind must be one of none, reference_provider, external_provider'));
  assert.ok(errors.includes('transport.providerProof.endpointClass must match the selected transport mode'));
  assert.ok(errors.includes('recordingFields.transportMode is required'));
  assert.ok(errors.includes('installedExtensionParity.parent.verdict must be GO'));
  assert.ok(errors.includes('installedExtensionParity.child.verdict must be GO'));
  assert.ok(errors.includes('manualInstalledEvidence.parentDashboardArtifact is required'));
  assert.ok(errors.includes('manualInstalledEvidence.childYouTubeArtifact is required'));
  assert.ok(errors.includes('manualInstalledEvidence.managedActionHistoryArtifact is required'));
  assert.ok(errors.includes('manualInstalledEvidence.notes is required'));
  assert.ok(errors.includes('FT-MANAGED-REMOTE-00-trust-link-preflight.status must be passed'));
});

test('verifier rejects provider transport artifacts that imply discovery or hosted authority', () => {
  const artifact = validArtifact({ transportMode: 'local_network_provider' });
  artifact.transport.providerProof.automaticDiscoveryObserved = true;
  artifact.transport.providerProof.hostedServiceClaimed = true;
  artifact.transport.providerProof.explicitEndpointConfigured = false;
  artifact.transport.providerProof.referenceProviderScript = 'scripts/other-provider.mjs';
  artifact.transport.providerProof.referenceProviderAuditDoc = 'docs/audit/OTHER.md';

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('transport.providerProof.automaticDiscoveryObserved must be false'));
  assert.ok(errors.includes('transport.providerProof.hostedServiceClaimed must be false'));
  assert.ok(errors.includes('transport.providerProof.explicitEndpointConfigured must be true for provider transports'));
  assert.ok(errors.includes('transport.providerProof.referenceProviderScript must be scripts/managed-delivery-provider.mjs'));
  assert.ok(errors.includes('transport.providerProof.referenceProviderAuditDoc must be docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md'));
});

test('verifier rejects mailbox provider smoke without public HTTPS and CORS preflight proof', () => {
  const artifact = validArtifact({ transportMode: 'encrypted_mailbox' });
  artifact.transport.providerProof.endpointClass = 'private_or_local_http';
  artifact.transport.providerProof.corsPreflightVerified = false;

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('transport.providerProof.endpointClass must match encrypted_mailbox'));
  assert.ok(errors.includes('transport.providerProof.corsPreflightVerified must be true for encrypted_mailbox'));
});

test('verifier accepts a complete executed artifact for each supported transport slice', () => {
  for (const transportMode of ['live_nanah', 'local_network_provider', 'encrypted_mailbox']) {
    assert.deepEqual(validateManagedRemoteDeliverySmokeArtifact(validArtifact({ transportMode })), []);
  }
});

test('verifier rejects row order mismatches and incomplete installed extension parity', () => {
  const artifact = validArtifact();
  artifact.requiredRows = [...artifact.requiredRows].reverse();
  artifact.installedExtensionParity.parent.sourceHashes = {};
  artifact.installedExtensionParity.child.missingFields = ['activeYouTubeUrl'];

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('requiredRows must exactly match the required managed remote delivery rows'));
  assert.ok(errors.includes('installedExtensionParity.parent.sourceHashes must not be empty'));
  assert.ok(errors.includes('installedExtensionParity.child.missingFields must be empty'));
});

test('verifier rejects missing manual installed-extension evidence', () => {
  const artifact = validArtifact();
  artifact.manualInstalledEvidence.childYouTubeArtifact = '';
  artifact.manualInstalledEvidence.managedActionHistoryArtifact = [];

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('manualInstalledEvidence.childYouTubeArtifact is required'));
  assert.ok(errors.includes('manualInstalledEvidence.managedActionHistoryArtifact is required'));
});

test('verifier rejects failed observations and missing policy evidence', () => {
  const artifact = validArtifact();
  const keywordRow = artifact.requiredRows.find(row => row.id === 'FT-MANAGED-REMOTE-01-keyword-policy-apply');
  keywordRow.status = 'failed';
  keywordRow.observation.pass = false;
  delete keywordRow.evidence.revision;
  delete keywordRow.evidence.policyHash;

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('FT-MANAGED-REMOTE-01-keyword-policy-apply.status must be passed'));
  assert.ok(errors.includes('FT-MANAGED-REMOTE-01-keyword-policy-apply.observation.pass must be true'));
  assert.ok(errors.includes('FT-MANAGED-REMOTE-01-keyword-policy-apply.evidence.revision must be a positive integer'));
  assert.ok(errors.includes('FT-MANAGED-REMOTE-01-keyword-policy-apply.evidence.policyHash is required'));
});

test('verifier rejects unknown lanes and uncovered required lanes', () => {
  const unknown = validArtifact();
  unknown.changeContext.requiredLanes = ['settings'];

  const uncovered = validArtifact();
  uncovered.changeContext.requiredLanes = ['test:settings', 'test:smoke'];
  uncovered.changeContext.automatedLaneEvidence = [{
    command: 'npm run test:settings',
    status: 'passed',
    summary: 'settings only',
    lanes: ['test:settings']
  }];

  const unknownErrors = validateManagedRemoteDeliverySmokeArtifact(unknown);
  const uncoveredErrors = validateManagedRemoteDeliverySmokeArtifact(uncovered);

  assert.ok(unknownErrors.includes('changeContext.requiredLanes[0] must be a known test lane'));
  assert.ok(uncoveredErrors.includes('changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: test:smoke'));
});

test('verifier rejects sensitive plaintext and secret keys anywhere in the artifact', () => {
  const artifact = validArtifact();
  artifact.transport.privateKey = 'do-not-record';
  artifact.requiredRows[1].evidence.keywordValue = 'shakira';

  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
  assert.ok(errors.includes('transport.privateKey must not be present in managed remote delivery smoke artifacts'));
  assert.ok(errors.includes('requiredRows[1].evidence.keywordValue must not be present in managed remote delivery smoke artifacts'));
});

test('verifier CLI exits nonzero for template and zero for a complete artifact', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-managed-smoke-'));
  const artifactPath = path.join(tempDir, 'executed.json');
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
