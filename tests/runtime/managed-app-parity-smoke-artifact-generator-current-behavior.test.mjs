import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  createManagedAppParitySmokeArtifact,
  writeManagedAppParitySmokeArtifact
} from '../../scripts/create-managed-app-parity-smoke-artifact.mjs';
import {
  REQUIRED_MANAGED_APP_PARITY_ROWS,
  validateManagedAppParitySmokeArtifact
} from '../../docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs';

const repoRoot = process.cwd();
const generatorPath = 'scripts/create-managed-app-parity-smoke-artifact.mjs';
const observationTemplatePath = 'docs/audit/artifacts/managed-app-parity-smoke/observation-template.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
}

function validInput({ platform = 'android' } = {}) {
  return {
    logicalChangeType: 'managed app parity smoke generator fixture',
    automatedLaneEvidence: [{
      command: 'node --test tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs',
      status: 'passed',
      summary: 'managed app parity smoke generator fixture passed',
      lanes: ['test:release', 'test:settings', 'test:smoke']
    }],
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
      upstreamRevisionOrHash: 'extension-sync-revision-redacted'
    },
    contractParity: {
      contractHash: 'sha256-contract-v1-redacted',
      contractSynced: true,
      nativeRuntimeSynced: true,
      nativeAdapterProof: {
        sourcePath: platform === 'android'
          ? 'apps/android/app/src/main/java/com/filtertube/app/model/ManagedPolicyState.kt'
          : 'apps/ios/FilterTube/ManagedPolicyAdapter.swift',
        status: 'passed'
      }
    },
    recordingFields: {
      manualTimestamp: '2026-06-22T00:00:00.000Z',
      testerInitials: 'dv',
      parentProfileId: 'parent-profile-redacted',
      managedProfileId: 'managed-profile-redacted',
      deviceId: 'managed-device-redacted',
      managedProfileRole: 'protected-child',
      parentAuthorityObservation: 'parent/account authority could edit policy after re-auth',
      childAuthorityObservation: 'protected profile could not open admin settings, sync, logs, or policy mutation paths',
      mainViewingSpaceObservation: 'Main surface followed managed access before content opened',
      kidsViewingSpaceObservation: 'Kids surface followed managed access before content opened',
      timeBudgetObservation: 'startup, resume, heartbeat, pause, reduced-budget, and timeout behavior matched policy',
      familyDeviceMapObservation: 'family device map showed Send Update, Home Pickup, Internet Pickup, and offline last-policy states',
      historyAccessObservation: 'managed history was admin-only and redacted',
      noPolicyNoWorkObservation: 'no managed policy did not add route timers or sync polling'
    },
    policyEvidence: {
      policyRevision: 12,
      policyHash: 'sha256-policy-redacted'
    },
    rowEvidence: {
      'FT-MANAGED-APP-16-family-device-map-delivery': {
        parentFacingLabels: ['Send Update', 'Home Pickup', 'Internet Pickup'],
        familyDeviceMapStates: [
          'live_now_send_update',
          'same_network_home_pickup',
          'away_or_internet_internet_pickup',
          'offline_last_valid_policy'
        ],
        deliveryStateIsAuthority: false,
        protectedUserCanConfigureDelivery: false
      }
    }
  };
}

test('managed app parity smoke generator is exposed as release settings smoke script surface', () => {
  const packageJson = readJson('package.json');
  const result = classifyPaths([generatorPath]);

  assert.equal(packageJson.scripts['managed:app-parity-smoke'], `node ${generatorPath}`);
  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-app-parity-smoke-artifact-surface');
});

test('managed app parity smoke observation template covers required rows without pretending execution', () => {
  const template = readJson(observationTemplatePath);
  const result = classifyPaths([observationTemplatePath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-app-parity-smoke-artifact-surface');
  assert.deepEqual(Object.keys(template.observationSummaries), REQUIRED_MANAGED_APP_PARITY_ROWS);
  assert.equal(template.contractParity.contractSynced, false);
  assert.equal(template.contractParity.nativeRuntimeSynced, false);
  assert.equal(template.policyEvidence.policyRevision, 0);
  assert.equal(template.rowEvidence['FT-MANAGED-APP-16-family-device-map-delivery'].deliveryStateIsAuthority, false);
  assert.equal(template.rowEvidence['FT-MANAGED-APP-16-family-device-map-delivery'].protectedUserCanConfigureDelivery, false);
  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input: template, confirmed: true }),
    /is required|must be android or ios|must be a positive integer/
  );
});

test('managed app parity smoke generator creates verifier-compatible android and ios artifacts', () => {
  for (const platform of ['android', 'ios']) {
    const artifact = createManagedAppParitySmokeArtifact({
      repoRoot,
      input: validInput({ platform }),
      confirmed: true
    });

    assert.deepEqual(validateManagedAppParitySmokeArtifact(artifact), []);
    assert.equal(artifact.appPlatform.platform, platform);
    assert.equal(artifact.appParityReadiness, 'GO-FOR-THIS-APP-SMOKE');
    assert.equal(artifact.requiredRows.length, 17);
    assert.equal(artifact.requiredRows.find(row => row.id === 'FT-MANAGED-APP-12-keyword-rule-apply').evidence.policyRevision, 12);
    assert.equal(artifact.requiredRows.find(row => row.id === 'FT-MANAGED-APP-16-family-device-map-delivery').evidence.deliveryStateIsAuthority, false);
  }
});

test('managed app parity smoke generator writes verifier-compatible artifact file', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-managed-app-parity-output-'));
  const outputPath = path.join(outputDir, 'android-app-parity.json');
  const artifact = createManagedAppParitySmokeArtifact({
    repoRoot,
    input: validInput(),
    confirmed: true
  });
  const written = writeManagedAppParitySmokeArtifact(artifact, outputPath);
  const roundTrip = JSON.parse(fs.readFileSync(written, 'utf8'));

  assert.equal(written, outputPath);
  assert.deepEqual(validateManagedAppParitySmokeArtifact(roundTrip), []);
});

test('managed app parity smoke generator refuses unconfirmed installed app smoke', () => {
  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input: validInput() }),
    /confirm-installed-app-smoke-passed/
  );
});

test('managed app parity smoke generator refuses unsupported platform and unsynced contract', () => {
  const input = validInput();
  input.appPlatform.platform = 'desktop';

  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input, confirmed: true }),
    /input\.appPlatform\.platform must be android or ios/
  );

  const unsynced = validInput();
  unsynced.contractParity.nativeRuntimeSynced = false;
  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input: unsynced, confirmed: true }),
    /contractParity\.nativeRuntimeSynced must be true/
  );
});

test('managed app parity smoke generator refuses missing policy hash evidence', () => {
  const input = validInput();
  delete input.policyEvidence.policyHash;

  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input, confirmed: true }),
    /input\.policyEvidence\.policyHash is required/
  );
});

test('managed app parity smoke generator refuses sensitive input keys', () => {
  const input = validInput();
  input.rowEvidence['FT-MANAGED-APP-12-keyword-rule-apply'] = {
    keywordValue: 'do-not-record'
  };

  assert.throws(
    () => createManagedAppParitySmokeArtifact({ repoRoot, input, confirmed: true }),
    /input contains sensitive managed app parity fields/
  );
});
