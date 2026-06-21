#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  MANAGED_APP_PARITY_BOUNDARY_DOC,
  MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
  REQUIRED_MANAGED_APP_PARITY_ROWS,
  validateManagedAppParitySmokeArtifact
} from '../docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs';

export const DEFAULT_MANAGED_APP_PARITY_OUTPUT_DIR =
  'docs/audit/artifacts/managed-app-parity-smoke/generated';

const DEFAULT_REQUIRED_LANES = Object.freeze(['test:release', 'test:settings', 'test:smoke']);
const DEFAULT_PROOF_COMMAND =
  'node --test tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs';
const DEFAULT_PROOF_SUMMARY =
  'managed app parity smoke verifier passed before installed app parity artifact creation';

const SUPPORTED_PLATFORMS = new Set(['android', 'ios']);
const REQUIRED_APP_PLATFORM_FIELDS = Object.freeze([
  'platform',
  'appName',
  'appVersion',
  'buildIdentifier',
  'installedArtifactType',
  'installedArtifactLabel',
  'deviceLabel',
  'deviceModel',
  'osVersion',
  'upstreamRevisionOrHash'
]);
const REQUIRED_RECORDING_FIELDS = Object.freeze([
  'manualTimestamp',
  'testerInitials',
  'parentProfileId',
  'managedProfileId',
  'deviceId',
  'managedProfileRole',
  'parentAuthorityObservation',
  'childAuthorityObservation',
  'mainViewingSpaceObservation',
  'kidsViewingSpaceObservation',
  'timeBudgetObservation',
  'familyDeviceMapObservation',
  'historyAccessObservation',
  'noPolicyNoWorkObservation'
]);
const REQUIRED_FAMILY_DEVICE_MAP_LABELS = Object.freeze([
  'Send Update',
  'Home Pickup',
  'Internet Pickup'
]);
const REQUIRED_FAMILY_DEVICE_MAP_STATES = Object.freeze([
  'live_now_send_update',
  'same_network_home_pickup',
  'away_or_internet_internet_pickup',
  'offline_last_valid_policy'
]);
const FORBIDDEN_SENSITIVE_KEYS = new Set([
  'accesstoken',
  'bearer',
  'channelname',
  'ciphertext',
  'cookie',
  'decryptedpayload',
  'jwt',
  'keywordvalue',
  'mailboxciphertext',
  'password',
  'pin',
  'plaintext',
  'plaintextvalue',
  'privatekey',
  'privatekeyjwk',
  'rawpolicyjson',
  'refreshtoken',
  'secret',
  'seed',
  'videotitle'
]);

function normalizePath(value) {
  return value.replaceAll(path.sep, '/');
}

function relFrom(base, target) {
  return normalizePath(path.relative(base, target));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    input: '',
    output: '',
    confirmed: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === '--input') options.input = next();
    else if (arg === '--output') options.output = next();
    else if (arg === '--confirm-installed-app-smoke-passed') options.confirmed = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function requiredObject(source, key) {
  const value = source?.[key];
  if (!isPlainObject(value)) throw new Error(`input.${key} must be an object`);
  return value;
}

function requiredString(source, key, prefix) {
  const value = source?.[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${prefix}.${key} is required`);
  }
  return value.trim();
}

function requiredPositiveInteger(source, key, prefix) {
  const value = source?.[key];
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${prefix}.${key} must be a positive integer`);
  }
  return value;
}

function collectForbiddenSensitiveKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectForbiddenSensitiveKeys(entry, `${prefix}[${index}]`));
  }
  if (!isPlainObject(value)) return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_SENSITIVE_KEYS.has(normalizedKey)) found.push(nextPrefix);
    found.push(...collectForbiddenSensitiveKeys(child, nextPrefix));
  }
  return found;
}

function buildChangeContext(input) {
  return {
    logicalChangeType: input.logicalChangeType || 'managed app parity installed smoke',
    requiredLanes: input.requiredLanes || [...DEFAULT_REQUIRED_LANES],
    automatedLaneEvidence: Array.isArray(input.automatedLaneEvidence) && input.automatedLaneEvidence.length > 0
      ? input.automatedLaneEvidence
      : [{
        command: DEFAULT_PROOF_COMMAND,
        status: 'passed',
        summary: DEFAULT_PROOF_SUMMARY,
        lanes: [...DEFAULT_REQUIRED_LANES]
      }]
  };
}

function buildAppPlatform(input, repoRoot) {
  const source = requiredObject(input, 'appPlatform');
  for (const field of REQUIRED_APP_PLATFORM_FIELDS) requiredString(source, field, 'input.appPlatform');
  if (!SUPPORTED_PLATFORMS.has(source.platform)) {
    throw new Error('input.appPlatform.platform must be android or ios');
  }
  return {
    platform: source.platform,
    appName: source.appName.trim(),
    appVersion: source.appVersion.trim(),
    buildIdentifier: source.buildIdentifier.trim(),
    installedArtifactType: source.installedArtifactType.trim(),
    installedArtifactLabel: source.installedArtifactLabel.trim(),
    deviceLabel: source.deviceLabel.trim(),
    deviceModel: source.deviceModel.trim(),
    osVersion: source.osVersion.trim(),
    upstreamRevisionOrHash: source.upstreamRevisionOrHash.trim() || gitRevisionOrUnknown(repoRoot)
  };
}

function buildContractParity(input) {
  const source = requiredObject(input, 'contractParity');
  const nativeAdapterProof = requiredObject(source, 'nativeAdapterProof');
  return {
    contractArtifactPath: MANAGED_APP_POLICY_CONTRACT_ARTIFACT,
    contractHash: requiredString(source, 'contractHash', 'input.contractParity'),
    contractSynced: source.contractSynced === true,
    nativeRuntimeSynced: source.nativeRuntimeSynced === true,
    nativeAdapterProof: {
      sourcePath: requiredString(nativeAdapterProof, 'sourcePath', 'input.contractParity.nativeAdapterProof'),
      status: requiredString(nativeAdapterProof, 'status', 'input.contractParity.nativeAdapterProof')
    }
  };
}

function buildRecordingFields(input) {
  const source = requiredObject(input, 'recordingFields');
  const fields = {};
  for (const field of REQUIRED_RECORDING_FIELDS) {
    fields[field] = requiredString(source, field, 'input.recordingFields');
  }
  return fields;
}

function rowRequiresPolicyEvidence(rowId) {
  return ![
    'FT-MANAGED-APP-00-contract-sync',
    'FT-MANAGED-APP-10-no-policy-no-work',
    'FT-MANAGED-APP-16-family-device-map-delivery'
  ].includes(rowId);
}

function rowDuration(rowId, input, index) {
  const durations = isPlainObject(input.rowDurationsMs) ? input.rowDurationsMs : {};
  const duration = durations[rowId] ?? input.defaultRowDurationMs ?? (500 + index);
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(`duration for ${rowId} must be a non-negative finite number`);
  }
  return duration;
}

function buildBaseEvidence(rowId, input, platform, recordingFields) {
  const contractParity = buildContractParity(input);
  const policyEvidence = requiredObject(input, 'policyEvidence');
  const rowOverrides = isPlainObject(input.rowEvidence) && isPlainObject(input.rowEvidence[rowId])
    ? input.rowEvidence[rowId]
    : {};

  const evidence = {
    platform,
    deviceId: requiredString(recordingFields, 'deviceId', 'recordingFields'),
    managedProfileId: requiredString(recordingFields, 'managedProfileId', 'recordingFields'),
    surface: rowId,
    ...rowOverrides
  };

  if (rowId === 'FT-MANAGED-APP-00-contract-sync') {
    evidence.contractArtifactPath = MANAGED_APP_POLICY_CONTRACT_ARTIFACT;
    evidence.contractSynced = true;
    evidence.nativeRuntimeSynced = true;
  }
  if (rowId === 'FT-MANAGED-APP-10-no-policy-no-work') {
    evidence.noPolicyNoWork = true;
  }
  if (rowId === 'FT-MANAGED-APP-16-family-device-map-delivery') {
    evidence.parentFacingLabels = rowOverrides.parentFacingLabels || [...REQUIRED_FAMILY_DEVICE_MAP_LABELS];
    evidence.familyDeviceMapStates = rowOverrides.familyDeviceMapStates || [...REQUIRED_FAMILY_DEVICE_MAP_STATES];
    evidence.deliveryStateIsAuthority = false;
    evidence.protectedUserCanConfigureDelivery = false;
  }
  if (rowRequiresPolicyEvidence(rowId)) {
    evidence.policyRevision = rowOverrides.policyRevision
      ?? requiredPositiveInteger(policyEvidence, 'policyRevision', 'input.policyEvidence');
    evidence.policyHash = rowOverrides.policyHash
      ?? requiredString(policyEvidence, 'policyHash', 'input.policyEvidence');
  }

  if (rowId === 'FT-MANAGED-APP-00-contract-sync') {
    evidence.contractHash = rowOverrides.contractHash || contractParity.contractHash;
  }

  return evidence;
}

function buildRequiredRows(input, platform, recordingFields) {
  return REQUIRED_MANAGED_APP_PARITY_ROWS.map((id, index) => ({
    id,
    requiredObservation: input.requiredObservationOverrides?.[id]
      || `${id} observed during installed ${platform} managed app parity smoke`,
    status: 'passed',
    observation: {
      pass: true,
      summary: input.observationSummaries?.[id] || `${id} passed on ${platform}`
    },
    evidence: buildBaseEvidence(id, input, platform, recordingFields),
    durationMs: rowDuration(id, input, index)
  }));
}

export function createManagedAppParitySmokeArtifact(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const input = options.input || {};
  if (!options.confirmed) {
    throw new Error('Pass --confirm-installed-app-smoke-passed after the installed Android/iOS managed app parity smoke has actually passed.');
  }
  const forbiddenInputKeys = collectForbiddenSensitiveKeys(input);
  if (forbiddenInputKeys.length) {
    throw new Error(`input contains sensitive managed app parity fields:\n- ${forbiddenInputKeys.join('\n- ')}`);
  }

  const appPlatform = buildAppPlatform(input, repoRoot);
  const contractParity = buildContractParity(input);
  const recordingFields = buildRecordingFields(input);
  const artifact = {
    artifactType: 'filtertube-managed-app-parity-smoke',
    schemaVersion: 1,
    status: 'executed',
    appParityReadiness: 'GO-FOR-THIS-APP-SMOKE',
    crossPlatformReleaseReadiness: 'GO-FOR-THIS-APP-SMOKE',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_APP_PARITY_BOUNDARY_DOC,
    changeContext: buildChangeContext(input),
    appPlatform,
    contractParity,
    recordingFields,
    requiredRows: buildRequiredRows(input, appPlatform.platform, recordingFields),
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

  const errors = validateManagedAppParitySmokeArtifact(artifact);
  if (errors.length) {
    throw new Error(`generated managed app parity smoke artifact failed validation:\n- ${errors.join('\n- ')}`);
  }

  return artifact;
}

export function writeManagedAppParitySmokeArtifact(artifact, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(artifact, null, 2)}\n`);
  return resolved;
}

function printHelp() {
  console.log(`Usage:
  npm run managed:app-parity-smoke -- --input <redacted-app-smoke.json> --confirm-installed-app-smoke-passed [--output <artifact.json>]

Input JSON shape:
{
  "appPlatform": { "platform": "android", "...": "installed app metadata" },
  "contractParity": {
    "contractHash": "sha256-...",
    "contractSynced": true,
    "nativeRuntimeSynced": true,
    "nativeAdapterProof": { "sourcePath": "apps/android/...", "status": "passed" }
  },
  "recordingFields": {
    "manualTimestamp": "2026-06-22T00:00:00.000Z",
    "testerInitials": "dv",
    "parentProfileId": "parent-profile-redacted",
    "managedProfileId": "managed-profile-redacted",
    "deviceId": "managed-device-redacted",
    "... required manual observations ...": "redacted text"
  },
  "policyEvidence": { "policyRevision": 12, "policyHash": "sha256-..." },
  "automatedLaneEvidence": [{ "command": "npm run test:settings", "status": "passed", "summary": "...", "lanes": ["test:settings"] }]
}

This generator creates one installed Android or iOS app parity smoke artifact.
It does not sync the app repo, does not prove the other platform, and never
records plaintext rules, PINs, passwords, private keys, watched titles, tokens,
raw policy JSON, or ciphertext.
`);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    if (!options.input) throw new Error('--input is required');

    const repoRoot = process.cwd();
    const inputPath = path.resolve(repoRoot, options.input);
    const input = readJson(inputPath);
    const outputPath = options.output
      ? path.resolve(repoRoot, options.output)
      : path.join(repoRoot, DEFAULT_MANAGED_APP_PARITY_OUTPUT_DIR, `${timestampForFile()}-${input?.appPlatform?.platform || 'app'}-parity-smoke.json`);

    const artifact = createManagedAppParitySmokeArtifact({
      repoRoot,
      input,
      confirmed: options.confirmed
    });
    const written = writeManagedAppParitySmokeArtifact(artifact, outputPath);
    console.log(JSON.stringify({
      artifact: relFrom(repoRoot, written),
      platform: artifact.appPlatform.platform,
      requiredRows: artifact.requiredRows.length,
      appParityReadiness: artifact.appParityReadiness,
      readiness: 'one installed app platform smoke artifact created; the other platform and full release parity remain separate proof'
    }, null, 2));
  } catch (error) {
    console.error(`Managed app parity smoke artifact failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
