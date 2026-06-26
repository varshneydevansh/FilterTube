import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  createManagedExtensionInstalledSmokeArtifact,
  writeManagedExtensionInstalledSmokeArtifact
} from '../../scripts/create-managed-extension-installed-smoke-artifact.mjs';
import {
  REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS,
  validateManagedExtensionInstalledSmokeArtifact
} from '../../docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs';

const repoRoot = process.cwd();
const generatorPath = 'scripts/create-managed-extension-installed-smoke-artifact.mjs';
const observationTemplatePath = 'docs/audit/artifacts/managed-extension-installed-smoke/observation-template.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
}

function validInput() {
  return {
    recordingFields: {
      manualTimestamp: '2026-06-22T00:00:00.000Z',
      testerInitials: 'dv',
      browserId: 'chrome',
      browserNameVersion: 'Chrome/136.0.0.0',
      extensionId: 'gkgjigdfdccckblmglboobikfcpeelio',
      extensionVersion: '3.3.2',
      parentProfileId: 'parent-profile-redacted',
      protectedProfileId: 'protected-profile-redacted',
      trustedLinkId: 'trusted-link-redacted',
      sourceDeviceId: 'source-device-redacted',
      targetDeviceId: 'target-device-redacted',
      sourcePublicKeyId: 'source-public-key-redacted',
      keyVersion: '1',
      installedExtensionPath: '/Users/devanshvarshney/FilterTube',
      dashboardUrl: 'chrome-extension://gkgjigdfdccckblmglboobikfcpeelio/html/tab-view.html#accounts',
      parentYouTubeUrl: 'https://www.youtube.com/',
      protectedYouTubeUrl: 'https://www.youtube.com/watch?v=redacted01',
      observedHistorySummary: 'accepted and rejected rows were visible to parent only with redacted scope revision and hash',
      observedNoWorkState: 'empty no-policy navigation remained snappy with no provider polling',
      observedRegressionSummary: 'blocklist whitelist quick-block collaborator menu and outside-click close stayed usable'
    },
    visibleEvidence: {
      parentDashboardArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/parent-dashboard.png',
      familyDeviceUpdatesArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/family-device-updates.png',
      protectedProfileArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/protected-profile.png',
      protectedYouTubeArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/protected-youtube.png',
      timeoutOverlayArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/timeout-overlay.png',
      managedHistoryArtifact: 'docs/audit/artifacts/managed-extension-installed-smoke/manual/history-redacted.json',
      notes: 'Manual smoke recorded redacted identifiers only.'
    },
    policyEvidence: {
      revision: 12,
      policyHash: 'sha256-redacted-policy-hash'
    },
    automatedLaneEvidence: [{
      command: 'node --test tests/runtime/managed-extension-installed-smoke-artifact-generator-current-behavior.test.mjs',
      status: 'passed',
      summary: 'generator fixture passed',
      lanes: ['test:release', 'test:settings', 'test:smoke']
    }]
  };
}

test('managed installed-extension smoke generator is exposed as release settings smoke script surface', () => {
  const packageJson = readJson('package.json');
  const result = classifyPaths([generatorPath]);

  assert.equal(packageJson.scripts['managed:extension-smoke'], `node ${generatorPath}`);
  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-extension-installed-smoke-artifact-surface');
});

test('managed installed-extension smoke observation template covers required rows without pretending execution', () => {
  const template = readJson(observationTemplatePath);
  const result = classifyPaths([observationTemplatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-extension-installed-smoke-artifact-surface');
  assert.deepEqual(Object.keys(template.rowEvidence), REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS);
  assert.deepEqual(Object.keys(template.observationSummaries), REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS);
  assert.equal(template.policyEvidence.revision, 0);
  assert.equal(template.assertions.parentAdminUnlockObserved, false);
  assert.equal(template.assertions.pickupProviderAuthorityGranted, false);
  assert.equal(template.assertions.automaticLanDiscoveryObserved, false);
  assert.equal(template.assertions.hostedInternetPickupClaimed, false);
  assert.throws(
    () => createManagedExtensionInstalledSmokeArtifact({ repoRoot, input: template, confirmed: true }),
    /is required|must be a positive integer/
  );
});

test('managed installed-extension smoke generator creates a verifier-compatible artifact', () => {
  const artifact = createManagedExtensionInstalledSmokeArtifact({
    repoRoot,
    input: validInput(),
    confirmed: true
  });

  assert.deepEqual(validateManagedExtensionInstalledSmokeArtifact(artifact), []);
  assert.equal(artifact.extensionInstalledSmokeReadiness, 'GO-FOR-EXTENSION-INSTALLED-SMOKE');
  assert.equal(artifact.wholeGoalReleaseReadiness, 'NO-GO-PROVIDER-APP-MANUAL-REMAINS');
  assert.equal(artifact.assertions.pickupProviderAuthorityGranted, false);
  assert.equal(artifact.assertions.automaticLanDiscoveryObserved, false);
  assert.equal(artifact.assertions.hostedInternetPickupClaimed, false);
  assert.equal(artifact.requiredRows.length, 14);
  assert.equal(artifact.requiredRows.find(row => row.id === 'FT-MANAGED-EXT-06-send-update-live-nanah').evidence.revision, 12);
});

test('managed installed-extension smoke generator writes a verifier-compatible artifact file', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-managed-extension-smoke-output-'));
  const outputPath = path.join(outputDir, 'installed-smoke.json');
  const artifact = createManagedExtensionInstalledSmokeArtifact({
    repoRoot,
    input: validInput(),
    confirmed: true
  });
  const written = writeManagedExtensionInstalledSmokeArtifact(artifact, outputPath);
  const roundTrip = JSON.parse(fs.readFileSync(written, 'utf8'));

  assert.equal(written, outputPath);
  assert.deepEqual(validateManagedExtensionInstalledSmokeArtifact(roundTrip), []);
});

test('managed installed-extension smoke generator refuses unconfirmed manual smoke', () => {
  assert.throws(
    () => createManagedExtensionInstalledSmokeArtifact({ repoRoot, input: validInput() }),
    /confirm-manual-smoke-passed/
  );
});

test('managed installed-extension smoke generator refuses missing policy hash evidence', () => {
  const input = validInput();
  delete input.policyEvidence.policyHash;

  assert.throws(
    () => createManagedExtensionInstalledSmokeArtifact({ repoRoot, input, confirmed: true }),
    /input\.policyEvidence\.policyHash is required/
  );
});

test('managed installed-extension smoke generator refuses authority overclaims and sensitive keys', () => {
  const input = validInput();
  input.assertions = { automaticLanDiscoveryObserved: true };
  input.visibleEvidence.pin = '1234';

  assert.throws(
    () => createManagedExtensionInstalledSmokeArtifact({ repoRoot, input, confirmed: true }),
    /automaticLanDiscoveryObserved must be false/
  );
});
