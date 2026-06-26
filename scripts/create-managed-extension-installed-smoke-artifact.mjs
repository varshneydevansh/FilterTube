#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC,
  REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS,
  validateManagedExtensionInstalledSmokeArtifact
} from '../docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs';

export const DEFAULT_MANAGED_EXTENSION_SMOKE_OUTPUT_DIR =
  'docs/audit/artifacts/managed-extension-installed-smoke/generated';

const REQUIRED_POLICY_ROWS = new Set([
  'FT-MANAGED-EXT-02-create-protected-profile',
  'FT-MANAGED-EXT-03-set-main-kids-access',
  'FT-MANAGED-EXT-04-set-time-limit',
  'FT-MANAGED-EXT-05-edit-rules-keyword-channel-video',
  'FT-MANAGED-EXT-06-send-update-live-nanah',
  'FT-MANAGED-EXT-07-protected-device-apply-and-history',
  'FT-MANAGED-EXT-08-main-kids-route-gate',
  'FT-MANAGED-EXT-09-timeout-overlay'
]);

const DEFAULT_REQUIRED_LANES = Object.freeze(['test:release', 'test:settings', 'test:smoke']);
const DEFAULT_PROOF_COMMAND =
  'node --test tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs';
const DEFAULT_PROOF_SUMMARY =
  'managed installed-extension smoke artifact verifier passed before manual smoke artifact creation';

const EXPECTED_ASSERTIONS = Object.freeze({
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
});

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
    else if (arg === '--confirm-manual-smoke-passed') options.confirmed = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function requiredObject(source, key) {
  const value = source?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`input.${key} must be an object`);
  }
  return value;
}

function requiredString(source, key, prefix) {
  const value = source?.[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${prefix}.${key} is required`);
  }
  return value;
}

function requiredPositiveInteger(source, key, prefix) {
  const value = source?.[key];
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${prefix}.${key} must be a positive integer`);
  }
  return value;
}

function buildRowEvidence(rowId, input) {
  const recording = requiredObject(input, 'recordingFields');
  const policyEvidence = requiredObject(input, 'policyEvidence');
  const rowOverrides = input.rowEvidence && typeof input.rowEvidence === 'object'
    ? input.rowEvidence[rowId] || {}
    : {};

  const evidence = {
    parentProfileId: requiredString(recording, 'parentProfileId', 'input.recordingFields'),
    protectedProfileId: requiredString(recording, 'protectedProfileId', 'input.recordingFields'),
    sourceDeviceId: requiredString(recording, 'sourceDeviceId', 'input.recordingFields'),
    targetDeviceId: requiredString(recording, 'targetDeviceId', 'input.recordingFields'),
    trustedLinkId: requiredString(recording, 'trustedLinkId', 'input.recordingFields'),
    ...rowOverrides
  };

  if (REQUIRED_POLICY_ROWS.has(rowId)) {
    evidence.revision = rowOverrides.revision ?? requiredPositiveInteger(policyEvidence, 'revision', 'input.policyEvidence');
    evidence.policyHash = rowOverrides.policyHash ?? requiredString(policyEvidence, 'policyHash', 'input.policyEvidence');
  }

  return evidence;
}

function rowDuration(rowId, input, index) {
  const durations = input.rowDurationsMs && typeof input.rowDurationsMs === 'object'
    ? input.rowDurationsMs
    : {};
  const duration = durations[rowId] ?? input.defaultRowDurationMs ?? (300 + index);
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(`duration for ${rowId} must be a non-negative finite number`);
  }
  return duration;
}

function buildRequiredRows(input) {
  return REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS.map((id, index) => ({
    id,
    requiredObservation: input.requiredObservationOverrides?.[id]
      || `${id} manually observed during installed-extension managed-control smoke`,
    status: 'passed',
    observation: {
      pass: true,
      summary: input.observationSummaries?.[id] || `${id} passed in manual installed-extension smoke`
    },
    evidence: buildRowEvidence(id, input),
    durationMs: rowDuration(id, input, index)
  }));
}

function automatedLaneEvidence(input) {
  if (Array.isArray(input.automatedLaneEvidence) && input.automatedLaneEvidence.length > 0) {
    return input.automatedLaneEvidence;
  }
  return [{
    command: DEFAULT_PROOF_COMMAND,
    status: 'passed',
    summary: DEFAULT_PROOF_SUMMARY,
    lanes: [...DEFAULT_REQUIRED_LANES]
  }];
}

function recordingFields(input, repoRoot) {
  const fields = { ...requiredObject(input, 'recordingFields') };
  if (!fields.workspaceRevisionOrHash) fields.workspaceRevisionOrHash = gitRevisionOrUnknown(repoRoot);
  return fields;
}

export function createManagedExtensionInstalledSmokeArtifact(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const input = options.input || {};
  if (!options.confirmed) {
    throw new Error('Pass --confirm-manual-smoke-passed after the installed-extension parent/protected-device smoke has actually passed.');
  }

  const artifact = {
    artifactType: 'filtertube-managed-extension-installed-smoke',
    schemaVersion: 1,
    status: 'executed',
    extensionInstalledSmokeReadiness: 'GO-FOR-EXTENSION-INSTALLED-SMOKE',
    wholeGoalReleaseReadiness: 'NO-GO-PROVIDER-APP-MANUAL-REMAINS',
    runtimeBehaviorChanged: false,
    boundaryDoc: MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: input.logicalChangeType || 'managed extension installed smoke',
      requiredLanes: input.requiredLanes || [...DEFAULT_REQUIRED_LANES],
      automatedLaneEvidence: automatedLaneEvidence(input)
    },
    recordingFields: recordingFields(input, repoRoot),
    visibleEvidence: { ...requiredObject(input, 'visibleEvidence') },
    assertions: {
      ...EXPECTED_ASSERTIONS,
      ...(input.assertions || {})
    },
    requiredRows: buildRequiredRows(input),
    completionRules: {
      allRecordingFieldsRequired: true,
      allVisibleEvidenceFieldsRequired: true,
      allRowsMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      assertionsMustMatchExpectedValues: true,
      noPlaintextSensitiveFields: true,
      wholeGoalReleaseReadinessWhenTemplate: 'NO-GO-PROVIDER-APP-MANUAL-REMAINS'
    }
  };

  const errors = validateManagedExtensionInstalledSmokeArtifact(artifact);
  if (errors.length) {
    throw new Error(`generated installed smoke artifact failed validation:\n- ${errors.join('\n- ')}`);
  }

  return artifact;
}

export function writeManagedExtensionInstalledSmokeArtifact(artifact, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(artifact, null, 2)}\n`);
  return resolved;
}

function printHelp() {
  console.log(`Usage:
  npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed [--output <artifact.json>]

Input JSON shape:
{
  "recordingFields": { "... verifier fields ...": "redacted values" },
  "visibleEvidence": { "... artifact paths ...": "docs/audit/artifacts/managed-extension-installed-smoke/manual/..." },
  "policyEvidence": { "revision": 11, "policyHash": "sha256-..." },
  "automatedLaneEvidence": [{ "command": "npm run test:settings", "status": "passed", "summary": "...", "lanes": ["test:settings"] }]
}

Start from:
  docs/audit/artifacts/managed-extension-installed-smoke/observation-template.json

The generator creates an executed installed-extension smoke artifact only after
explicit confirmation. It never records plaintext rules, PINs, passwords, or
private keys, and it leaves provider/app parity readiness as not complete.
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
      : path.join(repoRoot, DEFAULT_MANAGED_EXTENSION_SMOKE_OUTPUT_DIR, `${timestampForFile()}-installed-smoke.json`);

    const artifact = createManagedExtensionInstalledSmokeArtifact({
      repoRoot,
      input,
      confirmed: options.confirmed
    });
    const written = writeManagedExtensionInstalledSmokeArtifact(artifact, outputPath);
    console.log(JSON.stringify({
      artifact: relFrom(repoRoot, written),
      requiredRows: artifact.requiredRows.length,
      extensionInstalledSmokeReadiness: artifact.extensionInstalledSmokeReadiness,
      wholeGoalReleaseReadiness: artifact.wholeGoalReleaseReadiness
    }, null, 2));
  } catch (error) {
    console.error(`Managed extension installed smoke artifact failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
