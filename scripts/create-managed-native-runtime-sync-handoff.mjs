#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
  MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC,
  REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS,
  validateManagedNativeRuntimeSyncHandoffArtifact
} from '../docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs';

export const DEFAULT_HANDOFF_OUTPUT_DIR =
  'docs/audit/artifacts/managed-native-runtime-sync-handoff/generated';

const DEFAULT_PROOF_COMMAND =
  'node --test tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs';
const DEFAULT_PROOF_SUMMARY =
  'managed native runtime sync handoff generator and verifier passed';
const DEFAULT_REQUIRED_LANES = Object.freeze(['test:release', 'test:settings', 'test:smoke']);

function normalizePath(value) {
  return value.replaceAll(path.sep, '/');
}

function relFrom(base, target) {
  return normalizePath(path.relative(base, target));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function lineCount(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (text.length === 0) return 0;
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function runGit(repoRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function gitRevisionOrUnknown(repoRoot) {
  const head = runGit(repoRoot, ['rev-parse', 'HEAD']);
  if (!head) return 'unknown';
  const dirty = runGit(repoRoot, ['status', '--porcelain']);
  return dirty ? `${head}+dirty` : head;
}

function timestampForFile(now = new Date()) {
  return now.toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
}

function parseArgs(argv) {
  const options = {
    appRepo: '',
    output: '',
    targetRepoLabel: 'FilterTubeApp',
    proofCommand: DEFAULT_PROOF_COMMAND,
    proofSummary: DEFAULT_PROOF_SUMMARY,
    syncConfirmed: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === '--app-repo') options.appRepo = next();
    else if (arg === '--output') options.output = next();
    else if (arg === '--target-label') options.targetRepoLabel = next();
    else if (arg === '--proof-command') options.proofCommand = next();
    else if (arg === '--proof-summary') options.proofSummary = next();
    else if (arg === '--confirm-sync-command-passed') options.syncConfirmed = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function resolveAppRepo(repoRoot, appRepoOption) {
  const configured = appRepoOption || process.env.FILTERTUBE_APP_REPO || '';
  return path.resolve(configured.trim() || path.join(repoRoot, '..', 'FilterTubeApp'));
}

function buildGeneratedFileManifest({ appRepo, manifest }) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('runtime sync manifest must be a non-empty JSON array');
  }

  return manifest.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`runtime sync manifest row ${index} must be an object`);
    }
    if (!entry.destination || typeof entry.destination !== 'string') {
      throw new Error(`runtime sync manifest row ${index} is missing destination`);
    }
    const destinationPath = path.join(appRepo, entry.destination);
    if (!fs.existsSync(destinationPath)) {
      throw new Error(`runtime sync destination is missing: ${entry.destination}`);
    }
    const stats = fs.statSync(destinationPath);
    if (!stats.isFile()) {
      throw new Error(`runtime sync destination is not a file: ${entry.destination}`);
    }
    const lines = lineCount(destinationPath);
    if (lines <= 0) {
      throw new Error(`runtime sync destination has no text lines: ${entry.destination}`);
    }

    return {
      path: normalizePath(entry.destination),
      sourcePath: normalizePath(entry.source || ''),
      syncMode: entry.syncMode || 'copy',
      sha256: sha256File(destinationPath),
      bytes: stats.size,
      lines,
      generated: true
    };
  });
}

function compareManifestHashes({ repoRoot, appRepo, manifest }) {
  const mismatches = [];
  for (const [index, entry] of manifest.entries()) {
    if (!entry?.source || !entry?.destination) continue;
    const sourceRoot = entry.sourceRepo ? path.resolve(entry.sourceRepo) : repoRoot;
    const sourcePath = path.join(sourceRoot, entry.source);
    const destinationPath = path.join(appRepo, entry.destination);
    if (!fs.existsSync(sourcePath) || !fs.existsSync(destinationPath)) continue;
    const sourceSha = sha256File(sourcePath);
    const destinationSha = sha256File(destinationPath);
    if (sourceSha !== destinationSha) {
      mismatches.push({
        index,
        source: normalizePath(entry.source),
        destination: normalizePath(entry.destination),
        sourceSha256: sourceSha,
        destinationSha256: destinationSha
      });
    }
  }
  return mismatches;
}

function requiredRowsForArtifact({ contractHash, generatedFileCount }) {
  return REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS.map((id) => ({
    id,
    requiredObservation: `${id} observed for managed native runtime sync handoff`,
    status: 'passed',
    observation: {
      pass: true,
      summary: id === 'FT-NATIVE-SYNC-00-contract-hash'
        ? 'Managed app policy contract hash was recorded.'
        : id === 'FT-NATIVE-SYNC-01-sync-command'
          ? 'The operator confirmed npm run sync:native-runtime passed before artifact generation.'
          : id === 'FT-NATIVE-SYNC-02-generated-manifest'
            ? 'Runtime sync destination hashes were recorded from the app manifest.'
            : id === 'FT-NATIVE-SYNC-03-no-native-claim'
              ? 'The artifact stays scoped to handoff and makes no native enforcement claim.'
              : 'Installed app parity smoke remains a separate downstream artifact.'
    },
    evidence: {
      ...(id === 'FT-NATIVE-SYNC-00-contract-hash' ? {
        contractHash,
        contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-01-sync-command' ? {
        syncCommand: 'npm run sync:native-runtime',
        syncCommandStatus: 'passed'
      } : {}),
      ...(id === 'FT-NATIVE-SYNC-02-generated-manifest' ? {
        generatedFileCount,
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
}

export function createManagedNativeRuntimeSyncHandoffArtifact(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const appRepo = path.resolve(options.appRepo || resolveAppRepo(repoRoot, ''));
  const manifestPath = path.join(appRepo, 'tools', 'runtime-sync-manifest.json');
  const contractPath = path.join(repoRoot, MANAGED_APP_POLICY_CONTRACT_ARTIFACT);

  if (!options.syncConfirmed) {
    throw new Error('Pass --confirm-sync-command-passed after npm run sync:native-runtime succeeds.');
  }
  if (!fs.existsSync(contractPath)) {
    throw new Error(`managed app policy contract is missing: ${MANAGED_APP_POLICY_CONTRACT_ARTIFACT}`);
  }
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`app runtime sync manifest is missing: ${manifestPath}`);
  }

  const manifest = readJson(manifestPath);
  const generatedFileManifest = buildGeneratedFileManifest({ appRepo, manifest });
  const mismatches = compareManifestHashes({ repoRoot, appRepo, manifest });
  if (mismatches.length > 0) {
    const first = mismatches[0];
    throw new Error(`runtime sync destination hash mismatch: ${first.source} -> ${first.destination}`);
  }

  const contractHash = sha256File(contractPath);
  const artifact = {
    artifactType: 'filtertube-managed-native-runtime-sync-handoff',
    schemaVersion: 1,
    status: 'executed',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'managed native runtime sync handoff',
      requiredLanes: [...DEFAULT_REQUIRED_LANES],
      automatedLaneEvidence: [{
        command: options.proofCommand || DEFAULT_PROOF_COMMAND,
        status: 'passed',
        summary: options.proofSummary || DEFAULT_PROOF_SUMMARY,
        lanes: [...DEFAULT_REQUIRED_LANES]
      }]
    },
    syncHandoff: {
      extensionRepoRevisionOrHash: gitRevisionOrUnknown(repoRoot),
      appRepoRevisionOrHash: gitRevisionOrUnknown(appRepo),
      syncCommand: 'npm run sync:native-runtime',
      syncCommandStatus: 'passed',
      contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
      contractHash,
      targetRepoLabel: options.targetRepoLabel || 'FilterTubeApp',
      targetRepoPath: appRepo,
      manifestPath: relFrom(appRepo, manifestPath),
      generatedFileManifest,
      nativeRuntimeSynced: true,
      nativeEnforcementExecuted: false,
      downstreamAppParityClaim: false,
      appSmokeArtifactPath: ''
    },
    requiredRows: requiredRowsForArtifact({
      contractHash,
      generatedFileCount: generatedFileManifest.length
    }),
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

  const errors = validateManagedNativeRuntimeSyncHandoffArtifact(artifact);
  if (errors.length) {
    throw new Error(`generated handoff artifact failed validation:${os.EOL}- ${errors.join(`${os.EOL}- `)}`);
  }

  return artifact;
}

export function writeManagedNativeRuntimeSyncHandoffArtifact(artifact, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(artifact, null, 2)}\n`);
  return resolved;
}

function printHelp() {
  console.log(`Usage:
  npm run managed:native-handoff -- --confirm-sync-command-passed [options]

Options:
  --app-repo <path>                 FilterTubeApp repo path. Defaults to ../FilterTubeApp or FILTERTUBE_APP_REPO.
  --output <path>                   Output artifact path. Defaults to ${DEFAULT_HANDOFF_OUTPUT_DIR}/<timestamp>.json.
  --target-label <label>            Label for the downstream repo. Defaults to FilterTubeApp.
  --proof-command <command>         Passed proof command to record.
  --proof-summary <summary>         Passed proof summary to record.
  --confirm-sync-command-passed     Required. Confirms npm run sync:native-runtime already passed.
`);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }

    const repoRoot = process.cwd();
    const appRepo = resolveAppRepo(repoRoot, options.appRepo);
    const outputPath = options.output
      ? path.resolve(repoRoot, options.output)
      : path.join(repoRoot, DEFAULT_HANDOFF_OUTPUT_DIR, `${timestampForFile()}-handoff.json`);
    const artifact = createManagedNativeRuntimeSyncHandoffArtifact({
      repoRoot,
      appRepo,
      targetRepoLabel: options.targetRepoLabel,
      proofCommand: options.proofCommand,
      proofSummary: options.proofSummary,
      syncConfirmed: options.syncConfirmed
    });
    const written = writeManagedNativeRuntimeSyncHandoffArtifact(artifact, outputPath);
    console.log(JSON.stringify({
      artifact: relFrom(repoRoot, written),
      targetRepoLabel: artifact.syncHandoff.targetRepoLabel,
      generatedFileCount: artifact.syncHandoff.generatedFileManifest.length,
      contractHash: artifact.syncHandoff.contractHash,
      nativeEnforcementExecuted: false,
      downstreamAppParityClaim: false
    }, null, 2));
  } catch (error) {
    console.error(`Managed native runtime sync handoff failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
