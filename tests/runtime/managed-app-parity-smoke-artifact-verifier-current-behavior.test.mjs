import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  MANAGED_APP_PARITY_SMOKE_ARTIFACT_TEMPLATE,
  MANAGED_APP_PARITY_SMOKE_ARTIFACT_VERIFIER,
  MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS
} from '../../scripts/test-lane-config.mjs';
import {
  MANAGED_APP_PARITY_BOUNDARY_DOC,
  MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
  REQUIRED_MANAGED_APP_PARITY_ROWS,
  validateManagedAppParitySmokeArtifact
} from '../../docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs';

const repoRoot = process.cwd();
const verifierPath = 'docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs';
const templatePath = 'docs/audit/artifacts/managed-app-parity-smoke/template.json';
const boundaryDocPath = MANAGED_APP_PARITY_BOUNDARY_DOC;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function baseEvidence(rowId, platform) {
  const policyRow = ![
    'FT-MANAGED-APP-00-contract-sync',
    'FT-MANAGED-APP-10-no-policy-no-work'
  ].includes(rowId);

  return {
    platform,
    deviceId: `${platform}-device-01`,
    managedProfileId: 'child-profile-01',
    surface: rowId,
    ...(policyRow ? {
      policyRevision: 9,
      policyHash: `sha256-${rowId}`
    } : {}),
    ...(rowId === 'FT-MANAGED-APP-00-contract-sync' ? {
      contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
      contractSynced: true,
      nativeRuntimeSynced: true
    } : {}),
    ...(rowId === 'FT-MANAGED-APP-10-no-policy-no-work' ? {
      noPolicyNoWork: true
    } : {})
  };
}

function validArtifact({ platform = 'android' } = {}) {
  const generatedAt = '2026-06-05T00:00:00.000Z';
  const laneEvidence = {
    command: 'npm run test:changed',
    status: 'passed',
    summary: 'release, settings, and smoke lanes passed before managed app parity smoke',
    lanes: ['test:release', 'test:settings', 'test:smoke']
  };

  return {
    artifactType: 'filtertube-managed-app-parity-smoke',
    schemaVersion: 1,
    status: 'executed',
    appParityReadiness: 'GO-FOR-THIS-APP-SMOKE',
    crossPlatformReleaseReadiness: 'GO-FOR-THIS-APP-SMOKE',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_APP_PARITY_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'managed app parity smoke',
      requiredLanes: ['test:release', 'test:settings', 'test:smoke'],
      automatedLaneEvidence: [laneEvidence]
    },
    appPlatform: {
      platform,
      appName: 'FilterTube mobile/tablet',
      appVersion: '3.3.2',
      buildIdentifier: platform === 'android' ? 'code30312' : 'build-30312',
      installedArtifactType: platform === 'android' ? 'debug-apk' : 'testflight',
      installedArtifactLabel: platform === 'android'
        ? 'FilterTube-mobile-tablet-v3.3.2-code30312-debug.apk'
        : 'FilterTube iOS TestFlight build 30312',
      deviceLabel: `${platform} smoke device`,
      deviceModel: platform === 'android' ? 'Pixel smoke emulator' : 'iPhone smoke simulator',
      osVersion: platform === 'android' ? 'Android 15' : 'iOS 18',
      upstreamRevisionOrHash: 'abc123'
    },
    contractParity: {
      contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
      contractHash: 'sha256-contract-v1',
      contractSynced: true,
      nativeRuntimeSynced: true,
      nativeAdapterProof: {
        sourcePath: platform === 'android'
          ? 'apps/android/app/src/main/java/com/filtertube/app/model/FilterTubeProfile.kt'
          : 'apps/ios/FilterTube/ManagedPolicyAdapter.swift',
        status: 'passed'
      }
    },
    recordingFields: {
      manualTimestamp: generatedAt,
      testerInitials: 'dv',
      parentProfileId: 'parent-profile-01',
      managedProfileId: 'child-profile-01',
      managedProfileRole: 'protected-child',
      parentAuthorityObservation: 'parent/account authority could edit policy after re-auth',
      childAuthorityObservation: 'protected profile could not open admin settings, sync, or history mutation paths',
      mainViewingSpaceObservation: 'Main surface followed allowMainViewing before content opened',
      kidsViewingSpaceObservation: 'Kids surface followed allowKidsViewing before content opened',
      timeBudgetObservation: 'startup, resume, heartbeat, pause, reduced-budget, and timeout behavior matched policy',
      historyAccessObservation: 'history was admin-only and redacted',
      noPolicyNoWorkObservation: 'no managed policy did not add route timers or sync polling'
    },
    requiredRows: REQUIRED_MANAGED_APP_PARITY_ROWS.map((id, index) => ({
      id,
      requiredObservation: `row ${index} observed`,
      status: 'passed',
      observation: {
        pass: true,
        summary: `${id} passed on ${platform}`
      },
      evidence: baseEvidence(id, platform),
      durationMs: 400 + index
    })),
    completionRules: {
      allRecordingFieldsRequired: true,
      contractParityMustPass: true,
      allRowsMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      noPlaintextSensitiveFields: true,
      platformSpecificAdapterProofRequired: true
    }
  };
}

test('managed app parity smoke verifier is wired into release settings and smoke lanes', () => {
  const boundaryDoc = read(boundaryDocPath);

  assert.ok(LANES.release.tests.includes('tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.settings.tests.includes('tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.equal(MANAGED_APP_PARITY_SMOKE_ARTIFACT_TEMPLATE, templatePath);
  assert.equal(
    MANAGED_APP_PARITY_SMOKE_ARTIFACT_VERIFIER,
    'node docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs docs/audit/artifacts/managed-app-parity-smoke/<artifact>.json'
  );
  assert.deepEqual(MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS, REQUIRED_MANAGED_APP_PARITY_ROWS);
  assert.ok(boundaryDoc.includes(templatePath));
  assert.ok(boundaryDoc.includes(verifierPath));
  assert.ok(boundaryDoc.includes('managed keyword/channel/video rule proof'));
  assert.ok(MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS.includes('FT-MANAGED-APP-12-keyword-rule-apply'));
  assert.ok(MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS.includes('FT-MANAGED-APP-13-channel-rule-apply'));
  assert.ok(MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS.includes('FT-MANAGED-APP-14-video-rule-apply'));
  assert.ok(MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS.includes('FT-MANAGED-APP-15-managed-list-policy-apply'));
  assert.match(boundaryDoc, /Issue 62 style\s+channel-list subscriptions\/imports/);
  assert.match(boundaryDoc, /A valid managed app parity artifact proves one\s+installed app platform smoke/);
});

test('classifier treats managed app parity smoke artifact files as release settings and smoke proof', () => {
  const result = classifyPaths([verifierPath, templatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-app-parity-smoke-artifact-surface');
});

test('verifier rejects the non-executed template and missing contract parity', () => {
  const template = readJson(templatePath);
  const errors = validateManagedAppParitySmokeArtifact(template);

  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('appParityReadiness must be GO-FOR-THIS-APP-SMOKE'));
  assert.ok(errors.includes('crossPlatformReleaseReadiness must be GO-FOR-THIS-APP-SMOKE'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('changeContext.requiredLanes must list required test lanes'));
  assert.ok(errors.includes('changeContext.automatedLaneEvidence must contain at least one passed lane command'));
  assert.ok(errors.includes('appPlatform.platform must be android or ios'));
  assert.ok(errors.includes('contractParity.contractHash is required'));
  assert.ok(errors.includes('contractParity.contractSynced must be true'));
  assert.ok(errors.includes('contractParity.nativeRuntimeSynced must be true'));
  assert.ok(errors.includes('contractParity.nativeAdapterProof.status must be passed'));
  assert.ok(errors.includes('FT-MANAGED-APP-00-contract-sync.status must be passed'));
});

test('verifier accepts a complete executed artifact for each app platform', () => {
  for (const platform of ['android', 'ios']) {
    assert.deepEqual(validateManagedAppParitySmokeArtifact(validArtifact({ platform })), []);
  }
});

test('verifier rejects row order mismatch and incomplete contract parity', () => {
  const artifact = validArtifact();
  artifact.requiredRows = [...artifact.requiredRows].reverse();
  artifact.contractParity.nativeRuntimeSynced = false;
  artifact.contractParity.nativeAdapterProof.sourcePath = '';

  const errors = validateManagedAppParitySmokeArtifact(artifact);
  assert.ok(errors.includes('requiredRows must exactly match the required managed app parity rows'));
  assert.ok(errors.includes('contractParity.nativeRuntimeSynced must be true'));
  assert.ok(errors.includes('contractParity.nativeAdapterProof.sourcePath is required'));
});

test('verifier rejects failed observations and missing managed policy evidence', () => {
  const artifact = validArtifact();
  const routeRow = artifact.requiredRows.find(row => row.id === 'FT-MANAGED-APP-03-main-route-gate');
  routeRow.status = 'failed';
  routeRow.observation.pass = false;
  delete routeRow.evidence.policyRevision;
  delete routeRow.evidence.policyHash;

  const errors = validateManagedAppParitySmokeArtifact(artifact);
  assert.ok(errors.includes('FT-MANAGED-APP-03-main-route-gate.status must be passed'));
  assert.ok(errors.includes('FT-MANAGED-APP-03-main-route-gate.observation.pass must be true'));
  assert.ok(errors.includes('FT-MANAGED-APP-03-main-route-gate.evidence.policyRevision must be a positive integer'));
  assert.ok(errors.includes('FT-MANAGED-APP-03-main-route-gate.evidence.policyHash is required'));
});

test('verifier rejects unknown lanes and uncovered required lanes', () => {
  const unknown = validArtifact();
  unknown.changeContext.requiredLanes = ['settings'];

  const uncovered = validArtifact();
  uncovered.changeContext.requiredLanes = ['test:release', 'test:settings', 'test:smoke'];
  uncovered.changeContext.automatedLaneEvidence = [{
    command: 'npm run test:settings',
    status: 'passed',
    summary: 'settings only',
    lanes: ['test:settings']
  }];

  const unknownErrors = validateManagedAppParitySmokeArtifact(unknown);
  const uncoveredErrors = validateManagedAppParitySmokeArtifact(uncovered);

  assert.ok(unknownErrors.includes('changeContext.requiredLanes[0] must be a known test lane'));
  assert.ok(uncoveredErrors.includes('changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: test:release'));
  assert.ok(uncoveredErrors.includes('changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: test:smoke'));
});

test('verifier rejects sensitive plaintext and secret keys anywhere in the artifact', () => {
  const artifact = validArtifact();
  artifact.contractParity.privateKey = 'do-not-record';
  artifact.requiredRows[1].evidence.keywordValue = 'shakira';

  const errors = validateManagedAppParitySmokeArtifact(artifact);
  assert.ok(errors.includes('contractParity.privateKey must not be present in managed app parity smoke artifacts'));
  assert.ok(errors.includes('requiredRows[1].evidence.keywordValue must not be present in managed app parity smoke artifacts'));
});

test('verifier CLI exits nonzero for template and zero for a complete artifact', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-managed-app-smoke-'));
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
