#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES, MANAGED_EXTENSION_INSTALLED_SMOKE_REQUIRED_ROWS } from '../../../../scripts/test-lane-config.mjs';

export const MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC =
  'docs/audit/FILTERTUBE_MANAGED_CONTROLS_COMPLETION_AUDIT_2026-06-21.md';

export const REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS = MANAGED_EXTENSION_INSTALLED_SMOKE_REQUIRED_ROWS;

const SUPPORTED_BROWSERS = new Set(['chrome', 'firefox', 'brave', 'edge']);
const KNOWN_TEST_LANES = new Set(Object.keys(LANES).map(lane => `test:${lane}`));

const REQUIRED_RECORDING_FIELDS = Object.freeze([
  'manualTimestamp',
  'testerInitials',
  'browserNameVersion',
  'extensionId',
  'extensionVersion',
  'workspaceRevisionOrHash',
  'parentProfileId',
  'protectedProfileId',
  'trustedLinkId',
  'sourceDeviceId',
  'targetDeviceId',
  'sourcePublicKeyId',
  'keyVersion',
  'installedExtensionPath',
  'dashboardUrl',
  'parentYouTubeUrl',
  'protectedYouTubeUrl',
  'observedHistorySummary',
  'observedNoWorkState',
  'observedRegressionSummary'
]);

const REQUIRED_LANE_EVIDENCE_FIELDS = Object.freeze([
  'command',
  'status',
  'summary'
]);

const REQUIRED_VISIBLE_EVIDENCE_FIELDS = Object.freeze([
  'parentDashboardArtifact',
  'familyDeviceUpdatesArtifact',
  'protectedProfileArtifact',
  'protectedYouTubeArtifact',
  'timeoutOverlayArtifact',
  'managedHistoryArtifact',
  'notes'
]);

const REQUIRED_ASSERTIONS = Object.freeze({
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
  'plaintextrulevalue',
  'plaintextrulevalues',
  'plaintextvalue',
  'privatekey',
  'privatekeyjwk',
  'rawpolicyjson',
  'refreshtoken',
  'secret',
  'seed',
  'videotitle',
  'watchedtitle'
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

function validateRecordingFields(errors, recordingFields) {
  if (!isPlainObject(recordingFields)) {
    errors.push('recordingFields must be an object');
    return;
  }
  addMissingFieldErrors(errors, recordingFields, REQUIRED_RECORDING_FIELDS, 'recordingFields');
  if (!SUPPORTED_BROWSERS.has(recordingFields.browserId)) {
    errors.push('recordingFields.browserId must be one of chrome, firefox, brave, edge');
  }
}

function validateVisibleEvidence(errors, visibleEvidence) {
  if (!isPlainObject(visibleEvidence)) {
    errors.push('visibleEvidence must be an object');
    return;
  }
  addMissingFieldErrors(errors, visibleEvidence, REQUIRED_VISIBLE_EVIDENCE_FIELDS, 'visibleEvidence');
}

function validateAssertions(errors, assertions) {
  if (!isPlainObject(assertions)) {
    errors.push('assertions must be an object');
    return;
  }

  for (const [field, expected] of Object.entries(REQUIRED_ASSERTIONS)) {
    if (assertions[field] !== expected) {
      errors.push(`assertions.${field} must be ${expected}`);
    }
  }
}

function rowRequiresPolicyEvidence(rowId) {
  return ![
    'FT-MANAGED-EXT-00-install-preflight',
    'FT-MANAGED-EXT-01-parent-admin-unlock',
    'FT-MANAGED-EXT-10-protected-user-cannot-admin',
    'FT-MANAGED-EXT-11-no-policy-no-work-spa',
    'FT-MANAGED-EXT-12-three-dot-and-quick-block-regression',
    'FT-MANAGED-EXT-13-pickup-provider-status-boundary'
  ].includes(rowId);
}

function validateRows(errors, rows) {
  if (!sameItems(rows.map(row => row?.id), REQUIRED_MANAGED_EXTENSION_INSTALLED_ROWS)) {
    errors.push('requiredRows must exactly match the required managed extension installed rows');
  }

  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (isBlank(row?.observation?.summary)) errors.push(`${rowId}.observation.summary is required`);
    if (!Number.isFinite(row?.durationMs) || row.durationMs < 0) {
      errors.push(`${rowId}.durationMs must be a non-negative finite number`);
    }
    if (isBlank(row?.evidence?.parentProfileId)) errors.push(`${rowId}.evidence.parentProfileId is required`);
    if (isBlank(row?.evidence?.protectedProfileId)) errors.push(`${rowId}.evidence.protectedProfileId is required`);
    if (isBlank(row?.evidence?.sourceDeviceId)) errors.push(`${rowId}.evidence.sourceDeviceId is required`);
    if (isBlank(row?.evidence?.targetDeviceId)) errors.push(`${rowId}.evidence.targetDeviceId is required`);
    if (isBlank(row?.evidence?.trustedLinkId)) errors.push(`${rowId}.evidence.trustedLinkId is required`);
    if (rowRequiresPolicyEvidence(rowId)) {
      if (!Number.isInteger(row?.evidence?.revision) || row.evidence.revision <= 0) {
        errors.push(`${rowId}.evidence.revision must be a positive integer`);
      }
      if (isBlank(row?.evidence?.policyHash)) errors.push(`${rowId}.evidence.policyHash is required`);
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
    const normalizedKey = key.toLowerCase();
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_SENSITIVE_KEYS.has(normalizedKey)) found.push(nextPrefix);
    found.push(...collectForbiddenSensitiveKeys(child, nextPrefix));
  }
  return found;
}

export function validateManagedExtensionInstalledSmokeArtifact(artifact) {
  const errors = [];
  if (!isPlainObject(artifact)) return ['artifact must be a JSON object'];

  if (artifact.artifactType !== 'filtertube-managed-extension-installed-smoke') {
    errors.push('artifactType must be filtertube-managed-extension-installed-smoke');
  }
  if (artifact.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.extensionInstalledSmokeReadiness !== 'GO-FOR-EXTENSION-INSTALLED-SMOKE') {
    errors.push('extensionInstalledSmokeReadiness must be GO-FOR-EXTENSION-INSTALLED-SMOKE');
  }
  if (artifact.wholeGoalReleaseReadiness !== 'NO-GO-PROVIDER-APP-MANUAL-REMAINS') {
    errors.push('wholeGoalReleaseReadiness must be NO-GO-PROVIDER-APP-MANUAL-REMAINS');
  }
  if (artifact.boundaryDoc !== MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC) {
    errors.push(`boundaryDoc must be ${MANAGED_EXTENSION_INSTALLED_SMOKE_BOUNDARY_DOC}`);
  }

  validateChangeContext(errors, artifact.changeContext);
  validateRecordingFields(errors, artifact.recordingFields);
  validateVisibleEvidence(errors, artifact.visibleEvidence);
  validateAssertions(errors, artifact.assertions);

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  validateRows(errors, rows);

  const forbiddenKeys = collectForbiddenSensitiveKeys(artifact);
  for (const keyPath of forbiddenKeys) {
    errors.push(`${keyPath} must not be present in managed extension installed smoke artifacts`);
  }

  return errors;
}

export function readManagedExtensionInstalledSmokeArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readManagedExtensionInstalledSmokeArtifact(resolved);
  const errors = validateManagedExtensionInstalledSmokeArtifact(artifact);
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
