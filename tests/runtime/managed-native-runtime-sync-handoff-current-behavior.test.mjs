import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_GENERATOR,
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_TEMPLATE,
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_VERIFIER,
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_REQUIRED_ROWS
} from '../../scripts/test-lane-config.mjs';
import {
  MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC,
  REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS,
  validateManagedNativeRuntimeSyncHandoffArtifact
} from '../../docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs';

const repoRoot = process.cwd();
const templatePath = 'docs/audit/artifacts/managed-native-runtime-sync-handoff/template.json';
const verifierPath = 'docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs';
const boundaryDocPath = MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function validArtifact() {
  const rows = REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS.map((id) => ({
    id,
    requiredObservation: `${id} observed`,
    status: 'passed',
    observation: {
      pass: true,
      summary: `${id} passed`
    },
    evidence: {
      ...(id === 'FT-NATIVE-SYNC-00-contract-hash' ? {
        contractHash: 'sha256-contract-v1',
        contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-01-sync-command' ? {
        syncCommand: 'npm run sync:native-runtime',
        syncCommandStatus: 'passed'
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-02-generated-manifest' ? {
        generatedFileCount: 4,
        manifestPath: 'FilterTubeApp/tools/runtime-sync-manifest.json'
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-03-no-native-claim' ? {
        nativeEnforcementExecuted: false,
        downstreamAppParityClaim: false
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-04-app-smoke-pending' ? {
        appSmokePending: true,
        requiredArtifact: 'docs/audit/artifacts/managed-app-parity-smoke/template.json'
      } : {})
    }
  }));

  return {
    artifactType: 'filtertube-managed-native-runtime-sync-handoff',
    schemaVersion: 1,
    status: 'executed',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'managed native runtime sync handoff',
      requiredLanes: ['test:release', 'test:settings', 'test:smoke'],
      automatedLaneEvidence: [{
        command: 'node --test tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs',
        status: 'passed',
        summary: 'handoff verifier passed',
        lanes: ['test:release', 'test:settings', 'test:smoke']
      }]
    },
    syncHandoff: {
      extensionRepoRevisionOrHash: 'abc123',
      syncCommand: 'npm run sync:native-runtime',
      syncCommandStatus: 'passed',
      contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
      contractHash: 'sha256-contract-v1',
      targetRepoLabel: 'FilterTubeApp',
      targetRepoPath: '/Users/devanshvarshney/FilterTubeApp',
      generatedFileManifest: [
        {
          path: 'apps/android/app/src/main/assets/filtertube_runtime_full.js',
          sha256: 'sha256-android-runtime',
          bytes: 1200,
          lines: 40,
          generated: true
        },
        {
          path: 'apps/ios/FilterTube/Resources/filtertube_runtime_full.js',
          sha256: 'sha256-ios-runtime',
          bytes: 1100,
          lines: 38,
          generated: true
        }
      ],
      nativeRuntimeSynced: true,
      nativeEnforcementExecuted: false,
      downstreamAppParityClaim: false,
      appSmokeArtifactPath: ''
    },
    requiredRows: rows,
    completionRules: {
      syncCommandMustPass: true,
      contractHashRequired: true,
      generatedManifestRequired: true,
      nativeRuntimeSyncedMustBeTrue: true,
      nativeEnforcementMustNotBeClaimedWithoutAppSmoke: true,
      downstreamAppParityClaimMustBeFalseUntilAppSmoke: true,
      noPlaintextSensitiveFields: true
    }
  };
}

test('managed native runtime sync handoff is wired into release settings and smoke lanes', () => {
  const boundaryDoc = read(boundaryDocPath);

  assert.ok(LANES.release.tests.includes('tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs'));
  assert.ok(LANES.settings.tests.includes('tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs'));
  assert.equal(MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_TEMPLATE, templatePath);
  assert.equal(
    MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_GENERATOR,
    'npm run managed:native-handoff -- --confirm-sync-command-passed'
  );
  assert.equal(
    MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_VERIFIER,
    'node docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs docs/audit/artifacts/managed-native-runtime-sync-handoff/<artifact>.json'
  );
  assert.deepEqual(MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_REQUIRED_ROWS, REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS);
  assert.ok(boundaryDoc.includes(templatePath));
  assert.ok(boundaryDoc.includes(verifierPath));
  assert.match(boundaryDoc, /native runtime sync handoff/i);
});

test('classifier treats native runtime sync handoff files as release settings and smoke proof', () => {
  const result = classifyPaths([templatePath, verifierPath]);

  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-native-runtime-sync-handoff-surface');
});

test('verifier rejects the template and missing handoff evidence', () => {
  const template = readJson(templatePath);
  const errors = validateManagedNativeRuntimeSyncHandoffArtifact(template);

  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('syncHandoff.syncCommandStatus must be passed'));
  assert.ok(errors.includes('syncHandoff.contractHash is required'));
  assert.ok(errors.includes('syncHandoff.nativeRuntimeSynced must be true'));
  assert.ok(errors.includes('syncHandoff.generatedFileManifest must contain at least one generated file row'));
  assert.ok(errors.includes('FT-NATIVE-SYNC-00-contract-hash.status must be passed'));
});

test('verifier accepts a handoff-only sync artifact', () => {
  assert.deepEqual(validateManagedNativeRuntimeSyncHandoffArtifact(validArtifact()), []);
});

test('verifier rejects native app parity overclaims in a handoff-only artifact', () => {
  const artifact = validArtifact();
  artifact.syncHandoff.nativeEnforcementExecuted = true;
  artifact.syncHandoff.downstreamAppParityClaim = true;
  artifact.syncHandoff.appSmokeArtifactPath = 'docs/audit/artifacts/managed-app-parity-smoke/android.json';
  const noNativeClaimRow = artifact.requiredRows.find(row => row.id === 'FT-NATIVE-SYNC-03-no-native-claim');
  noNativeClaimRow.evidence.nativeEnforcementExecuted = true;
  noNativeClaimRow.evidence.downstreamAppParityClaim = true;

  const errors = validateManagedNativeRuntimeSyncHandoffArtifact(artifact);
  assert.ok(errors.includes('syncHandoff.nativeEnforcementExecuted must be false unless a separate app smoke artifact is recorded'));
  assert.ok(errors.includes('syncHandoff.downstreamAppParityClaim must be false until managed app parity smoke passes'));
  assert.ok(errors.includes('syncHandoff.appSmokeArtifactPath must stay blank for handoff-only artifacts'));
  assert.ok(errors.includes('FT-NATIVE-SYNC-03-no-native-claim.evidence.nativeEnforcementExecuted must be false'));
  assert.ok(errors.includes('FT-NATIVE-SYNC-03-no-native-claim.evidence.downstreamAppParityClaim must be false'));
});

test('verifier rejects sensitive policy material in the sync handoff artifact', () => {
  const artifact = validArtifact();
  artifact.syncHandoff.generatedFileManifest[0].plaintext = 'blocked keyword';

  const errors = validateManagedNativeRuntimeSyncHandoffArtifact(artifact);
  assert.ok(errors.includes('syncHandoff.generatedFileManifest[0].plaintext must not be present in managed native runtime sync handoff artifacts'));
});
