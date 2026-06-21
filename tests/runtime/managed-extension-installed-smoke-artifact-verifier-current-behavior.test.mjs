import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_GENERATOR,
  MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_TEMPLATE,
  MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_VERIFIER,
  MANAGED_EXTENSION_INSTALLED_SMOKE_REQUIRED_ROWS
} from '../../scripts/test-lane-config.mjs';
import {
  MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC,
  REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS,
  validateManagedExtensionInstalledSmokeArtifact
} from '../../docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs';

const repoRoot = process.cwd();
const verifierPath = 'docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs';
const templatePath = 'docs/audit/artifacts/managed-extension-installed-smoke/template.json';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function rowEvidence(rowId) {
  const needsPolicyEvidence = ![
    'FT-MANAGED-EXT-00-install-preflight',
    'FT-MANAGED-EXT-01-parent-admin-unlock',
    'FT-MANAGED-EXT-10-protected-user-cannot-admin',
    'FT-MANAGED-EXT-11-no-policy-no-work-spa',
    'FT-MANAGED-EXT-12-three-dot-and-quick-block-regression',
    'FT-MANAGED-EXT-13-pickup-provider-status-boundary'
  ].includes(rowId);

  return {
    parentProfileId: 'parent-profile-01',
    protectedProfileId: 'protected-profile-01',
    sourceDeviceId: 'parent-device-01',
    targetDeviceId: 'protected-device-01',
    trustedLinkId: 'trusted-link-01',
    ...(needsPolicyEvidence ? {
      revision: 11,
      policyHash: `sha256-${rowId}`
    } : {})
  };
}

function validArtifact() {
  const generatedAt = '2026-06-21T00:00:00.000Z';
  const laneEvidence = {
    command: 'node --test tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs',
    status: 'passed',
    summary: 'managed installed-extension smoke verifier passed before manual installed-extension smoke',
    lanes: ['test:release', 'test:settings', 'test:smoke']
  };

  return {
    artifactType: 'filtertube-managed-extension-installed-smoke',
    schemaVersion: 1,
    status: 'executed',
    extensionInstalledSmokeReadiness: 'GO-FOR-EXTENSION-INSTALLED-SMOKE',
    wholeGoalReleaseReadiness: 'NO-GO-PROVIDER-APP-MANUAL-REMAINS',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'managed extension installed smoke',
      requiredLanes: ['test:release', 'test:settings', 'test:smoke'],
      automatedLaneEvidence: [laneEvidence]
    },
    recordingFields: {
      manualTimestamp: generatedAt,
      testerInitials: 'dv',
      browserId: 'chrome',
      browserNameVersion: 'Chrome/136.0.0.0',
      extensionId: 'gkgjigdfdccckblmglboobikfcpeelio',
      extensionVersion: '3.3.2',
      workspaceRevisionOrHash: 'abc123',
      parentProfileId: 'parent-profile-01',
      protectedProfileId: 'protected-profile-01',
      trustedLinkId: 'trusted-link-01',
      sourceDeviceId: 'parent-device-01',
      targetDeviceId: 'protected-device-01',
      sourcePublicKeyId: 'source-key-01',
      keyVersion: '1',
      installedExtensionPath: repoRoot,
      dashboardUrl: 'chrome-extension://gkgjigdfdccckblmglboobikfcpeelio/html/tab-view.html#accounts',
      parentYouTubeUrl: 'https://www.youtube.com/',
      protectedYouTubeUrl: 'https://www.youtube.com/watch?v=abc12345678',
      observedHistorySummary: 'accepted and rejected managed rows visible to parent only with redacted scope/revision/hash',
      observedNoWorkState: 'empty/no-policy YouTube SPA navigation did not add managed provider polling or broad scans',
      observedRegressionSummary: 'blocking, whitelist, 3-dot menu, collaborator rows, and quick-block remained usable'
    },
    visibleEvidence: {
      parentDashboardArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/parent-dashboard.png',
      familyDeviceUpdatesArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/family-device-updates.png',
      protectedProfileArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/protected-profile.png',
      protectedYouTubeArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/protected-youtube.png',
      timeoutOverlayArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/timeout-overlay.png',
      managedHistoryArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/history-redacted.json',
      notes: 'Manual installed-extension smoke observed parent-managed protected profile flow without recording plaintext rules.'
    },
    assertions: {
      parentAdminUnlockObserved: true,
      protectedProfileCreated: true,
      protectedUserCannotConfigureDelivery: true,
      childPinIsNotAdmin: true,
      mainRouteGateObserved: true,
      kidsRouteGateObserved: true,
      timeLimitOverlayObserved: true,
      liveNanahSendObserved: true,
      signedPolicyRevisionObserved: true,
      historyRedactedObserved: true,
      noPolicyNoWorkObserved: true,
      youtubeSnappyAfterSpaObserved: true,
      blockingWhitelistingUnaffectedObserved: true,
      quickBlockAndThreeDotMenuObserved: true,
      pickupProviderAuthorityGranted: false,
      automaticLanDiscoveryObserved: false,
      hostedInternetPickupClaimed: false
    },
    requiredRows: REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS.map((id, index) => ({
      id,
      requiredObservation: `row ${index} observed`,
      status: 'passed',
      observation: {
        pass: true,
        summary: `${id} passed`
      },
      evidence: rowEvidence(id),
      durationMs: 350 + index
    })),
    completionRules: {
      allRecordingFieldsRequired: true,
      allVisibleEvidenceFieldsRequired: true,
      allRowsMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      assertionsMustMatchExpectedValues: true,
      noPlaintextSensitiveFields: true
    }
  };
}

test('managed installed-extension smoke verifier is wired into release settings and smoke lanes', () => {
  const boundaryDoc = read(MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC);

  assert.ok(LANES.release.tests.includes('tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.settings.tests.includes('tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.equal(MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_TEMPLATE, templatePath);
  assert.equal(
    MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_GENERATOR,
    'npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed'
  );
  assert.equal(
    MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_VERIFIER,
    'node docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs docs/audit/artifacts/managed-extension-installed-smoke/<artifact>.json'
  );
  assert.deepEqual(MANAGED_EXTENSION_INSTALLED_SMOKE_REQUIRED_ROWS, REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS);
  assert.ok(boundaryDoc.includes('installed two-device extension smoke: MANUAL-SMOKE-PENDING'));
});

test('classifier treats managed installed smoke artifact files as release settings and smoke proof', () => {
  const result = classifyPaths([verifierPath, templatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-extension-installed-smoke-artifact-surface');
});

test('verifier rejects the non-executed template and missing installed extension observations', () => {
  const template = readJson(templatePath);
  const errors = validateManagedExtensionInstalledSmokeArtifact(template);

  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('extensionInstalledSmokeReadiness must be GO-FOR-EXTENSION-INSTALLED-SMOKE'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('recordingFields.browserId must be one of chrome, firefox, brave, edge'));
  assert.ok(errors.includes('visibleEvidence.timeoutOverlayArtifact is required'));
  assert.ok(errors.includes('assertions.parentAdminUnlockObserved must be true'));
  assert.equal(template.assertions.pickupProviderAuthorityGranted, false);
  assert.equal(template.assertions.automaticLanDiscoveryObserved, false);
  assert.equal(template.assertions.hostedInternetPickupClaimed, false);
  assert.ok(errors.includes('FT-MANAGED-EXT-00-install-preflight.status must be passed'));
});

test('verifier accepts a complete executed installed extension artifact', () => {
  assert.deepEqual(validateManagedExtensionInstalledSmokeArtifact(validArtifact()), []);
});

test('verifier rejects row order mismatches and missing policy evidence', () => {
  const artifact = validArtifact();
  artifact.requiredRows = [...artifact.requiredRows].reverse();
  const routeRow = artifact.requiredRows.find(row => row.id === 'FT-MANAGED-EXT-08-main-kids-route-gate');
  delete routeRow.evidence.revision;
  delete routeRow.evidence.policyHash;

  const errors = validateManagedExtensionInstalledSmokeArtifact(artifact);
  assert.ok(errors.includes('requiredRows must exactly match the required managed extension installed rows'));
  assert.ok(errors.includes('FT-MANAGED-EXT-08-main-kids-route-gate.evidence.revision must be a positive integer'));
  assert.ok(errors.includes('FT-MANAGED-EXT-08-main-kids-route-gate.evidence.policyHash is required'));
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

  const unknownErrors = validateManagedExtensionInstalledSmokeArtifact(unknown);
  const uncoveredErrors = validateManagedExtensionInstalledSmokeArtifact(uncovered);

  assert.ok(unknownErrors.includes('changeContext.requiredLanes[0] must be a known test lane'));
  assert.ok(uncoveredErrors.includes('changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: test:smoke'));
});

test('verifier rejects sensitive plaintext and authority overclaims', () => {
  const artifact = validArtifact();
  artifact.assertions.automaticLanDiscoveryObserved = true;
  artifact.requiredRows[5].evidence.keywordValue = 'private exact keyword';
  artifact.visibleEvidence.pin = '1234';

  const errors = validateManagedExtensionInstalledSmokeArtifact(artifact);
  assert.ok(errors.includes('assertions.automaticLanDiscoveryObserved must be false'));
  assert.ok(errors.includes('requiredRows[5].evidence.keywordValue must not be present in managed extension installed smoke artifacts'));
  assert.ok(errors.includes('visibleEvidence.pin must not be present in managed extension installed smoke artifacts'));
});

test('verifier CLI exits nonzero for template and zero for a complete artifact', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-managed-extension-smoke-'));
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
