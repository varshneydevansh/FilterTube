#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES } from '../../../../scripts/test-lane-config.mjs';

export const MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC =
  'docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md';

export const MANAGED_APP_POLICY_CONTRACT_ARTIFACT =
  'docs/audit/artifacts/managed-app-policy-contract-v1.json';

export const REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS = Object.freeze([
  'FT-NATIVE-SYNC-00-contract-hash',
  'FT-NATIVE-SYNC-01-sync-command',
  'FT-NATIVE-SYNC-02-generated-manifest',
  'FT-NATIVE-SYNC-03-no-native-claim',
  'FT-NATIVE-SYNC-04-app-smoke-pending'
]);

const KNOWN_TEST_LANES = new Set(Object.keys(LANES).map(lane => `test:${lane}`));
const REQUIRED_HANDOFF_LANES = Object.freeze(['test:release', 'test:settings', 'test:smoke']);

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

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sameItems(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function validateLaneList(errors, lanes, prefix) {
  const valid = [];
  if (!Array.isArray(lanes) || lanes.length === 0) {
    errors.push(`${prefix} must list covered test lanes`);
    return valid;
  }

  lanes.forEach((lane, index) => {
    if (isBlank(lane)) {
      errors.push(`${prefix}[${index}] is required`);
    } else if (!KNOWN_TEST_LANES.has(lane)) {
      errors.push(`${prefix}[${index}] must be a known test lane`);
    } else {
      valid.push(lane);
    }
  });
  return valid;
}

function validateChangeContext(errors, changeContext) {
  if (!isPlainObject(changeContext)) {
    errors.push('changeContext must be an object');
    return;
  }
  if (isBlank(changeContext.logicalChangeType)) errors.push('changeContext.logicalChangeType is required');

  const validRequired = validateLaneList(errors, changeContext.requiredLanes, 'changeContext.requiredLanes');
  for (const lane of REQUIRED_HANDOFF_LANES) {
    if (!validRequired.includes(lane)) errors.push(`changeContext.requiredLanes must include ${lane}`);
  }

  const evidenceRows = changeContext.automatedLaneEvidence;
  if (!Array.isArray(evidenceRows) || evidenceRows.length === 0) {
    errors.push('changeContext.automatedLaneEvidence must contain at least one passed lane command');
    return;
  }

  evidenceRows.forEach((evidence, index) => {
    if (!isPlainObject(evidence)) {
      errors.push(`changeContext.automatedLaneEvidence[${index}] must be an object`);
      return;
    }
    if (isBlank(evidence.command)) errors.push(`changeContext.automatedLaneEvidence[${index}].command is required`);
    if (evidence.status !== 'passed') errors.push(`changeContext.automatedLaneEvidence[${index}].status must be passed`);
    if (isBlank(evidence.summary)) errors.push(`changeContext.automatedLaneEvidence[${index}].summary is required`);
    validateLaneList(errors, evidence.lanes, `changeContext.automatedLaneEvidence[${index}].lanes`);
  });

  const covered = new Set(evidenceRows.flatMap(evidence => (
    Array.isArray(evidence?.lanes) ? evidence.lanes.filter(lane => KNOWN_TEST_LANES.has(lane)) : []
  )));
  for (const lane of validRequired) {
    if (!covered.has(lane)) errors.push(`changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: ${lane}`);
  }
}

function validateGeneratedManifest(errors, manifest) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    errors.push('syncHandoff.generatedFileManifest must contain at least one generated file row');
    return;
  }

  manifest.forEach((row, index) => {
    const prefix = `syncHandoff.generatedFileManifest[${index}]`;
    if (!isPlainObject(row)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (isBlank(row.path)) errors.push(`${prefix}.path is required`);
    if (isBlank(row.sha256)) errors.push(`${prefix}.sha256 is required`);
    if (!Number.isInteger(row.bytes) || row.bytes <= 0) errors.push(`${prefix}.bytes must be a positive integer`);
    if (!Number.isInteger(row.lines) || row.lines <= 0) errors.push(`${prefix}.lines must be a positive integer`);
    if (row.generated !== true) errors.push(`${prefix}.generated must be true`);
  });
}

function validateSyncHandoff(errors, syncHandoff) {
  if (!isPlainObject(syncHandoff)) {
    errors.push('syncHandoff must be an object');
    return;
  }

  if (isBlank(syncHandoff.extensionRepoRevisionOrHash)) {
    errors.push('syncHandoff.extensionRepoRevisionOrHash is required');
  }
  if (syncHandoff.syncCommand !== 'npm run sync:native-runtime') {
    errors.push('syncHandoff.syncCommand must be npm run sync:native-runtime');
  }
  if (syncHandoff.syncCommandStatus !== 'passed') {
    errors.push('syncHandoff.syncCommandStatus must be passed');
  }
  if (syncHandoff.contractArtifactPath !== MANAGED_APP_POLICY_CONTRACT_ARTIFACT) {
    errors.push(`syncHandoff.contractArtifactPath must be ${MANAGED_APP_POLICY_CONTRACT_ARTIFACT}`);
  }
  if (isBlank(syncHandoff.contractHash)) errors.push('syncHandoff.contractHash is required');
  if (isBlank(syncHandoff.targetRepoLabel)) errors.push('syncHandoff.targetRepoLabel is required');
  if (syncHandoff.nativeRuntimeSynced !== true) errors.push('syncHandoff.nativeRuntimeSynced must be true');
  if (syncHandoff.nativeEnforcementExecuted !== false) {
    errors.push('syncHandoff.nativeEnforcementExecuted must be false unless a separate app smoke artifact is recorded');
  }
  if (syncHandoff.downstreamAppParityClaim !== false) {
    errors.push('syncHandoff.downstreamAppParityClaim must be false until managed app parity smoke passes');
  }
  if (!isBlank(syncHandoff.appSmokeArtifactPath)) {
    errors.push('syncHandoff.appSmokeArtifactPath must stay blank for handoff-only artifacts');
  }

  validateGeneratedManifest(errors, syncHandoff.generatedFileManifest);
}

function validateRows(errors, rows) {
  if (!sameItems(rows.map(row => row?.id), REQUIRED_MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ROWS)) {
    errors.push('requiredRows must exactly match the required managed native runtime sync handoff rows');
  }

  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (isBlank(row?.observation?.summary)) errors.push(`${rowId}.observation.summary is required`);
    if (!isPlainObject(row?.evidence)) {
      errors.push(`${rowId}.evidence must be an object`);
      continue;
    }

    if (rowId === 'FT-NATIVE-SYNC-00-contract-hash' && isBlank(row.evidence.contractHash)) {
      errors.push(`${rowId}.evidence.contractHash is required`);
    }
    if (rowId === 'FT-NATIVE-SYNC-01-sync-command' && row.evidence.syncCommand !== 'npm run sync:native-runtime') {
      errors.push(`${rowId}.evidence.syncCommand must be npm run sync:native-runtime`);
    }
    if (rowId === 'FT-NATIVE-SYNC-02-generated-manifest' && !Number.isInteger(row.evidence.generatedFileCount)) {
      errors.push(`${rowId}.evidence.generatedFileCount must be an integer`);
    }
    if (rowId === 'FT-NATIVE-SYNC-03-no-native-claim') {
      if (row.evidence.nativeEnforcementExecuted !== false) {
        errors.push(`${rowId}.evidence.nativeEnforcementExecuted must be false`);
      }
      if (row.evidence.downstreamAppParityClaim !== false) {
        errors.push(`${rowId}.evidence.downstreamAppParityClaim must be false`);
      }
    }
    if (rowId === 'FT-NATIVE-SYNC-04-app-smoke-pending' && row.evidence.appSmokePending !== true) {
      errors.push(`${rowId}.evidence.appSmokePending must be true`);
    }
  }
}

function collectForbiddenSensitiveKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectForbiddenSensitiveKeys(entry, `${prefix}[${index}]`));
  }
  if (!isPlainObject(value)) return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_SENSITIVE_KEYS.has(key.toLowerCase())) found.push(nextPrefix);
    found.push(...collectForbiddenSensitiveKeys(child, nextPrefix));
  }
  return found;
}

export function validateManagedNativeRuntimeSyncHandoffArtifact(artifact) {
  const errors = [];
  if (!isPlainObject(artifact)) return ['artifact must be a JSON object'];

  if (artifact.artifactType !== 'filtertube-managed-native-runtime-sync-handoff') {
    errors.push('artifactType must be filtertube-managed-native-runtime-sync-handoff');
  }
  if (artifact.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.runtimeBehaviorChanged !== false) errors.push('runtimeBehaviorChanged must be false');
  if (artifact.boundaryDoc !== MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC) {
    errors.push(`boundaryDoc must be ${MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_BOUNDARY_DOC}`);
  }

  validateChangeContext(errors, artifact.changeContext);
  validateSyncHandoff(errors, artifact.syncHandoff);

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  validateRows(errors, rows);

  for (const keyPath of collectForbiddenSensitiveKeys(artifact)) {
    errors.push(`${keyPath} must not be present in managed native runtime sync handoff artifacts`);
  }

  return errors;
}

export function readManagedNativeRuntimeSyncHandoffArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readManagedNativeRuntimeSyncHandoffArtifact(resolved);
  const errors = validateManagedNativeRuntimeSyncHandoffArtifact(artifact);
  const summary = {
    artifact: path.relative(process.cwd(), resolved).replaceAll(path.sep, '/'),
    valid: errors.length === 0,
    errors
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(errors.length === 0 ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
