#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES, MANAGED_REMOTE_DELIVERY_SMOKE_REQUIRED_ROWS } from '../../../../scripts/test-lane-config.mjs';

export const MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC =
  'docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md';

export const REQUIRED_MANAGED_REMOTE_DELIVERY_ROWS = MANAGED_REMOTE_DELIVERY_SMOKE_REQUIRED_ROWS;

const REQUIRED_TRANSPORT_MODES = new Set([
  'live_nanah',
  'local_network_provider',
  'encrypted_mailbox'
]);

const REQUIRED_RECORDING_FIELDS = Object.freeze([
  'manualTimestamp',
  'testerInitials',
  'parentBrowserNameVersion',
  'childBrowserNameVersion',
  'parentExtensionId',
  'childExtensionId',
  'parentProfileId',
  'childProfileId',
  'trustedLinkId',
  'sourceDeviceId',
  'targetDeviceId',
  'sourcePublicKeyId',
  'keyVersion',
  'transportMode',
  'observedAckHistory',
  'observedNoWorkState'
]);

const REQUIRED_PARITY_FIELDS = Object.freeze([
  'workspaceRevisionOrHash',
  'extensionPath',
  'manifestVersion',
  'serviceWorkerVersion',
  'extensionReloadTimestamp',
  'dashboardUrl'
]);

const REQUIRED_LANE_EVIDENCE_FIELDS = Object.freeze([
  'command',
  'status',
  'summary'
]);

const REQUIRED_MANUAL_INSTALLED_EVIDENCE_FIELDS = Object.freeze([
  'parentDashboardArtifact',
  'childYouTubeArtifact',
  'managedActionHistoryArtifact',
  'notes'
]);

const FORBIDDEN_SENSITIVE_KEYS = new Set([
  'plaintextRuleValue',
  'plaintextRuleValues',
  'keywordValue',
  'channelName',
  'videoTitle',
  'pin',
  'password',
  'privateKey',
  'privateKeyJwk',
  'decryptedPayload',
  'mailboxCiphertext',
  'ciphertext',
  'rawPolicyJson'
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

function validateInstalledParity(errors, parity, role) {
  if (!isPlainObject(parity)) {
    errors.push(`installedExtensionParity.${role} must be an object`);
    return;
  }

  addMissingFieldErrors(errors, parity, REQUIRED_PARITY_FIELDS, `installedExtensionParity.${role}`);
  if (role === 'child' && isBlank(parity.activeYouTubeUrl)) {
    errors.push('installedExtensionParity.child.activeYouTubeUrl is required');
  }
  if (parity.verdict !== 'GO') errors.push(`installedExtensionParity.${role}.verdict must be GO`);
  if (!Array.isArray(parity.missingFields)) {
    errors.push(`installedExtensionParity.${role}.missingFields must be an array`);
  } else if (parity.missingFields.length > 0) {
    errors.push(`installedExtensionParity.${role}.missingFields must be empty`);
  }
  if (!isPlainObject(parity.sourceHashes) || Object.keys(parity.sourceHashes).length === 0) {
    errors.push(`installedExtensionParity.${role}.sourceHashes must not be empty`);
  }
}

function validateManualInstalledEvidence(errors, evidence) {
  if (!isPlainObject(evidence)) {
    errors.push('manualInstalledEvidence must be an object');
    return;
  }
  addMissingFieldErrors(
    errors,
    evidence,
    REQUIRED_MANUAL_INSTALLED_EVIDENCE_FIELDS,
    'manualInstalledEvidence'
  );
}

function collectForbiddenSensitiveKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectForbiddenSensitiveKeys(entry, `${prefix}[${index}]`));
  }
  if (!isPlainObject(value)) return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_SENSITIVE_KEYS.has(key)) found.push(nextPrefix);
    found.push(...collectForbiddenSensitiveKeys(child, nextPrefix));
  }
  return found;
}

export function validateManagedRemoteDeliverySmokeArtifact(artifact) {
  const errors = [];
  if (!isPlainObject(artifact)) return ['artifact must be a JSON object'];

  if (artifact.artifactType !== 'filtertube-managed-remote-delivery-smoke') {
    errors.push('artifactType must be filtertube-managed-remote-delivery-smoke');
  }
  if (artifact.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.transportSliceReadiness !== 'GO-FOR-THIS-TRANSPORT-SMOKE') {
    errors.push('transportSliceReadiness must be GO-FOR-THIS-TRANSPORT-SMOKE');
  }
  if (artifact.remoteManagementReleaseReadiness !== 'GO-FOR-THIS-TRANSPORT-SMOKE') {
    errors.push('remoteManagementReleaseReadiness must be GO-FOR-THIS-TRANSPORT-SMOKE');
  }
  if (artifact.boundaryDoc !== MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC) {
    errors.push(`boundaryDoc must be ${MANAGED_REMOTE_DELIVERY_BOUNDARY_DOC}`);
  }

  validateChangeContext(errors, artifact.changeContext);

  const transport = artifact.transport;
  if (!isPlainObject(transport)) {
    errors.push('transport must be an object');
  } else {
    if (!REQUIRED_TRANSPORT_MODES.has(transport.mode)) {
      errors.push('transport.mode must be one of live_nanah, local_network_provider, encrypted_mailbox');
    }
    addMissingFieldErrors(errors, transport, ['providerName', 'networkContext', 'parentDeviceLabel', 'childDeviceLabel'], 'transport');
  }

  const recording = artifact.recordingFields;
  if (!isPlainObject(recording)) {
    errors.push('recordingFields must be an object');
  } else {
    addMissingFieldErrors(errors, recording, REQUIRED_RECORDING_FIELDS, 'recordingFields');
    if (transport?.mode && recording.transportMode !== transport.mode) {
      errors.push('recordingFields.transportMode must match transport.mode');
    }
  }

  const parity = artifact.installedExtensionParity;
  if (!isPlainObject(parity)) {
    errors.push('installedExtensionParity must be an object');
  } else {
    validateInstalledParity(errors, parity.parent, 'parent');
    validateInstalledParity(errors, parity.child, 'child');
  }

  validateManualInstalledEvidence(errors, artifact.manualInstalledEvidence);

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  if (!sameItems(rows.map(row => row?.id), REQUIRED_MANAGED_REMOTE_DELIVERY_ROWS)) {
    errors.push('requiredRows must exactly match the required managed remote delivery rows');
  }
  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (!Number.isFinite(row?.durationMs) || row.durationMs < 0) {
      errors.push(`${rowId}.durationMs must be a non-negative finite number`);
    }
    if (isBlank(row?.evidence?.sourceDeviceId)) errors.push(`${rowId}.evidence.sourceDeviceId is required`);
    if (isBlank(row?.evidence?.targetProfileId)) errors.push(`${rowId}.evidence.targetProfileId is required`);
    if (isBlank(row?.evidence?.trustedLinkId)) errors.push(`${rowId}.evidence.trustedLinkId is required`);
    if (rowId.includes('policy') || rowId.includes('gate')) {
      if (!Number.isInteger(row?.evidence?.revision) || row.evidence.revision <= 0) {
        errors.push(`${rowId}.evidence.revision must be a positive integer`);
      }
      if (isBlank(row?.evidence?.policyHash)) errors.push(`${rowId}.evidence.policyHash is required`);
    }
  }

  const forbiddenKeys = collectForbiddenSensitiveKeys(artifact);
  for (const keyPath of forbiddenKeys) {
    errors.push(`${keyPath} must not be present in managed remote delivery smoke artifacts`);
  }

  return errors;
}

export function readManagedRemoteDeliverySmokeArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readManagedRemoteDeliverySmokeArtifact(resolved);
  const errors = validateManagedRemoteDeliverySmokeArtifact(artifact);
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
