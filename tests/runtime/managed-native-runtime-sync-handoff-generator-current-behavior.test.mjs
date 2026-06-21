import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  createManagedNativeRuntimeSyncHandoffArtifact,
  writeManagedNativeRuntimeSyncHandoffArtifact
} from '../../scripts/create-managed-native-runtime-sync-handoff.mjs';
import {
  MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
  validateManagedNativeRuntimeSyncHandoffArtifact
} from '../../docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs';

const repoRoot = process.cwd();
const generatorPath = 'scripts/create-managed-native-runtime-sync-handoff.mjs';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function makeTempAppRepo() {
  const appRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-native-handoff-'));
  const destination = 'packages/runtime-core/src/upstream/managed-app-policy-contract-v1.json';
  const destinationPath = path.join(appRepo, destination);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.mkdirSync(path.join(appRepo, 'tools'), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, MANAGED_APP_POLICY_CONTRACT_ARTIFACT), destinationPath);
  fs.writeFileSync(path.join(appRepo, 'tools', 'runtime-sync-manifest.json'), `${JSON.stringify([{
    sourceRepo: repoRoot,
    source: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
    destination,
    syncMode: 'copy',
    notes: 'Managed app policy contract copy for handoff generator current behavior.'
  }], null, 2)}\n`);
  return appRepo;
}

test('managed native handoff generator is exposed as release settings smoke script surface', () => {
  const packageJson = readJson('package.json');
  const result = classifyPaths([generatorPath]);

  assert.equal(packageJson.scripts['managed:native-handoff'], `node ${generatorPath}`);
  assert.deepEqual(result.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'managed-native-runtime-sync-handoff-surface');
});

test('managed native handoff generator creates a valid no-native-claim artifact from a synced manifest', () => {
  const appRepo = makeTempAppRepo();
  const artifact = createManagedNativeRuntimeSyncHandoffArtifact({
    repoRoot,
    appRepo,
    targetRepoLabel: 'TempFilterTubeApp',
    proofCommand: 'node --test tests/runtime/managed-native-runtime-sync-handoff-generator-current-behavior.test.mjs',
    proofSummary: 'generator unit fixture passed',
    syncConfirmed: true
  });

  assert.deepEqual(validateManagedNativeRuntimeSyncHandoffArtifact(artifact), []);
  assert.equal(artifact.syncHandoff.targetRepoLabel, 'TempFilterTubeApp');
  assert.equal(artifact.syncHandoff.nativeRuntimeSynced, true);
  assert.equal(artifact.syncHandoff.nativeEnforcementExecuted, false);
  assert.equal(artifact.syncHandoff.downstreamAppParityClaim, false);
  assert.equal(artifact.syncHandoff.generatedFileManifest.length, 1);
  assert.equal(
    artifact.syncHandoff.generatedFileManifest[0].path,
    'packages/runtime-core/src/upstream/managed-app-policy-contract-v1.json'
  );
  assert.equal(artifact.requiredRows.find(row => row.id === 'FT-NATIVE-SYNC-02-generated-manifest').evidence.generatedFileCount, 1);
});

test('managed native handoff generator writes a verifier-compatible artifact file', () => {
  const appRepo = makeTempAppRepo();
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-native-handoff-output-'));
  const outputPath = path.join(outputDir, 'handoff.json');
  const artifact = createManagedNativeRuntimeSyncHandoffArtifact({
    repoRoot,
    appRepo,
    syncConfirmed: true
  });
  const written = writeManagedNativeRuntimeSyncHandoffArtifact(artifact, outputPath);
  const roundTrip = JSON.parse(fs.readFileSync(written, 'utf8'));

  assert.equal(written, outputPath);
  assert.deepEqual(validateManagedNativeRuntimeSyncHandoffArtifact(roundTrip), []);
});

test('managed native handoff generator refuses unconfirmed sync command state', () => {
  const appRepo = makeTempAppRepo();

  assert.throws(
    () => createManagedNativeRuntimeSyncHandoffArtifact({ repoRoot, appRepo }),
    /confirm-sync-command-passed/
  );
});

test('managed native handoff generator rejects stale app mirror hashes', () => {
  const appRepo = makeTempAppRepo();
  const manifest = JSON.parse(fs.readFileSync(path.join(appRepo, 'tools', 'runtime-sync-manifest.json'), 'utf8'));
  fs.writeFileSync(path.join(appRepo, manifest[0].destination), '{"drifted":true}\n');

  assert.throws(
    () => createManagedNativeRuntimeSyncHandoffArtifact({ repoRoot, appRepo, syncConfirmed: true }),
    /runtime sync destination hash mismatch/
  );
});
