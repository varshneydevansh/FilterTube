#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES, MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS } from '../../../../scripts/test-lane-config.mjs';

export const MANAGED_APP_PARITY_BOUNDARY_DOC =
  'docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md';

export const MANAGED_APP_POLICY_CONTRACT_ARTIFACT =
  'docs/audit/artifacts/managed-app-policy-contract-v1.json';

export const REQUIRED_MANAGED_APP_PARITY_ROWS = MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS;

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
  'managedProfileRole',
  'parentAuthorityObservation',
  'childAuthorityObservation',
  'mainViewingSpaceObservation',
  'kidsViewingSpaceObservation',
  'timeBudgetObservation',
  'historyAccessObservation',
  'noPolicyNoWorkObservation'
]);

const REQUIRED_LANE_EVIDENCE_FIELDS = Object.freeze([
  'command',
  'status',
  'summary'
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

const KNOWN_TEST_LANES = new Set(Object.keys(LANES).map(lane => `test:${lane}`));

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function addMissingFieldErrors(errors, source, fields, prefix) {
  for (const field of fields) {
    if (isBlank(source?.[field])) errors.push(`${prefix}.${field} is required`);
  }
}

function sameItems(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function validateLaneList(errors, lanes, prefix) {
  const validLanes = [];
  if (!Array.isArray(lanes) || lanes.length === 0) {
    errors.push(`${prefix} must list covered test lanes`);
    return validLanes;
  }

  lanes.forEach((lane, index) => {
    if (isBlank(lane)) {
      errors.push(`${prefix}[${index}] is required`);
    } else if (!KNOWN_TEST_LANES.has(lane)) {
      errors.push(`${prefix}[${index}] must be a known test lane`);
    } else {
      validLanes.push(lane);
    }
  });
  return validLanes;
}

function validateChangeContext(errors, changeContext) {
  if (!isPlainObject(changeContext)) {
    errors.push('changeContext must be an object');
    return;
  }

  if (isBlank(changeContext.logicalChangeType)) errors.push('changeContext.logicalChangeType is required');
  let validRequiredLanes = [];
  if (!Array.isArray(changeContext.requiredLanes) || changeContext.requiredLanes.length === 0) {
    errors.push('changeContext.requiredLanes must list required test lanes');
  } else {
    validRequiredLanes = validateLaneList(errors, changeContext.requiredLanes, 'changeContext.requiredLanes');
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
    addMissingFieldErrors(errors, evidence, REQUIRED_LANE_EVIDENCE_FIELDS, `changeContext.automatedLaneEvidence[${index}]`);
    if (evidence.status !== 'passed') {
      errors.push(`changeContext.automatedLaneEvidence[${index}].status must be passed`);
    }
    validateLaneList(errors, evidence.lanes, `changeContext.automatedLaneEvidence[${index}].lanes`);
  });

  const coveredLanes = new Set(evidenceRows.flatMap(evidence => (
    Array.isArray(evidence?.lanes) ? evidence.lanes.filter(lane => KNOWN_TEST_LANES.has(lane)) : []
  )));
  for (const lane of validRequiredLanes) {
    if (!coveredLanes.has(lane)) {
      errors.push(`changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: ${lane}`);
    }
  }
}

function validateAppPlatform(errors, appPlatform) {
  if (!isPlainObject(appPlatform)) {
    errors.push('appPlatform must be an object');
    return undefined;
  }

  addMissingFieldErrors(errors, appPlatform, REQUIRED_APP_PLATFORM_FIELDS, 'appPlatform');
  if (!SUPPORTED_PLATFORMS.has(appPlatform.platform)) {
    errors.push('appPlatform.platform must be android or ios');
  }
  return appPlatform.platform;
}

function validateContractParity(errors, contractParity) {
  if (!isPlainObject(contractParity)) {
    errors.push('contractParity must be an object');
    return;
  }

  if (contractParity.contractArtifactPath !== MANAGED_APP_POLICY_CONTRACT_ARTIFACT) {
    errors.push(`contractParity.contractArtifactPath must be ${MANAGED_APP_POLICY_CONTRACT_ARTIFACT}`);
  }
  if (isBlank(contractParity.contractHash)) errors.push('contractParity.contractHash is required');
  if (contractParity.contractSynced !== true) errors.push('contractParity.contractSynced must be true');
  if (contractParity.nativeRuntimeSynced !== true) errors.push('contractParity.nativeRuntimeSynced must be true');

  if (!isPlainObject(contractParity.nativeAdapterProof)) {
    errors.push('contractParity.nativeAdapterProof must be an object');
  } else {
    if (isBlank(contractParity.nativeAdapterProof.sourcePath)) {
      errors.push('contractParity.nativeAdapterProof.sourcePath is required');
    }
    if (contractParity.nativeAdapterProof.status !== 'passed') {
      errors.push('contractParity.nativeAdapterProof.status must be passed');
    }
  }
}

function validateRecordingFields(errors, recordingFields) {
  if (!isPlainObject(recordingFields)) {
    errors.push('recordingFields must be an object');
    return;
  }
  addMissingFieldErrors(errors, recordingFields, REQUIRED_RECORDING_FIELDS, 'recordingFields');
}

function rowRequiresPolicyEvidence(rowId) {
  return ![
    'FT-MANAGED-APP-00-contract-sync',
    'FT-MANAGED-APP-10-no-policy-no-work'
  ].includes(rowId);
}

function validateRows(errors, rows, platform) {
  if (!sameItems(rows.map(row => row?.id), REQUIRED_MANAGED_APP_PARITY_ROWS)) {
    errors.push('requiredRows must exactly match the required managed app parity rows');
  }

  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (!Number.isFinite(row?.durationMs) || row.durationMs < 0) {
      errors.push(`${rowId}.durationMs must be a non-negative finite number`);
    }

    if (!isPlainObject(row?.evidence)) {
      errors.push(`${rowId}.evidence must be an object`);
      continue;
    }

    if (row.evidence.platform !== platform) {
      errors.push(`${rowId}.evidence.platform must match appPlatform.platform`);
    }
    if (isBlank(row.evidence.deviceId)) errors.push(`${rowId}.evidence.deviceId is required`);
    if (isBlank(row.evidence.managedProfileId)) errors.push(`${rowId}.evidence.managedProfileId is required`);

    if (rowId === 'FT-MANAGED-APP-00-contract-sync') {
      if (row.evidence.contractArtifactPath !== MANAGED_APP_POLICY_CONTRACT_ARTIFACT) {
        errors.push(`${rowId}.evidence.contractArtifactPath must be ${MANAGED_APP_POLICY_CONTRACT_ARTIFACT}`);
      }
      if (row.evidence.contractSynced !== true) errors.push(`${rowId}.evidence.contractSynced must be true`);
      if (row.evidence.nativeRuntimeSynced !== true) errors.push(`${rowId}.evidence.nativeRuntimeSynced must be true`);
    }

    if (rowId === 'FT-MANAGED-APP-10-no-policy-no-work' && row.evidence.noPolicyNoWork !== true) {
      errors.push(`${rowId}.evidence.noPolicyNoWork must be true`);
    }

    if (rowRequiresPolicyEvidence(rowId)) {
      if (!Number.isInteger(row.evidence.policyRevision) || row.evidence.policyRevision <= 0) {
        errors.push(`${rowId}.evidence.policyRevision must be a positive integer`);
      }
      if (isBlank(row.evidence.policyHash)) errors.push(`${rowId}.evidence.policyHash is required`);
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

export function validateManagedAppParitySmokeArtifact(artifact) {
  const errors = [];
  if (!isPlainObject(artifact)) return ['artifact must be a JSON object'];

  if (artifact.artifactType !== 'filtertube-managed-app-parity-smoke') {
    errors.push('artifactType must be filtertube-managed-app-parity-smoke');
  }
  if (artifact.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.appParityReadiness !== 'GO-FOR-THIS-APP-SMOKE') {
    errors.push('appParityReadiness must be GO-FOR-THIS-APP-SMOKE');
  }
  if (artifact.crossPlatformReleaseReadiness !== 'GO-FOR-THIS-APP-SMOKE') {
    errors.push('crossPlatformReleaseReadiness must be GO-FOR-THIS-APP-SMOKE');
  }
  if (artifact.boundaryDoc !== MANAGED_APP_PARITY_BOUNDARY_DOC) {
    errors.push(`boundaryDoc must be ${MANAGED_APP_PARITY_BOUNDARY_DOC}`);
  }

  validateChangeContext(errors, artifact.changeContext);
  const platform = validateAppPlatform(errors, artifact.appPlatform);
  validateContractParity(errors, artifact.contractParity);
  validateRecordingFields(errors, artifact.recordingFields);

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  validateRows(errors, rows, platform);

  const forbiddenKeys = collectForbiddenSensitiveKeys(artifact);
  for (const keyPath of forbiddenKeys) {
    errors.push(`${keyPath} must not be present in managed app parity smoke artifacts`);
  }

  return errors;
}

export function readManagedAppParitySmokeArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readManagedAppParitySmokeArtifact(resolved);
  const errors = validateManagedAppParitySmokeArtifact(artifact);
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
