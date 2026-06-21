#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES, MANAGED_PICKUP_PROVIDER_OWNERSHIP_REQUIRED_ROWS } from '../../../../scripts/test-lane-config.mjs';

export const MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC =
  'docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md';

export const REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS =
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_REQUIRED_ROWS;

const VALID_DECISIONS = new Set([
  'reference_provider_only',
  'user_supplied_provider_only',
  'filtertube_hosted_provider'
]);

const KNOWN_TEST_LANES = new Set(Object.keys(LANES).map(lane => `test:${lane}`));

const REQUIRED_LANE_EVIDENCE_FIELDS = Object.freeze([
  'command',
  'status',
  'summary'
]);

const REQUIRED_OWNERSHIP_FIELDS = Object.freeze([
  'decision',
  'owner',
  'operator',
  'supportContact',
  'retentionPolicy',
  'purgeRevocationPolicy',
  'abuseRateLimitPolicy',
  'privacyBoundary',
  'releaseClaim'
]);

const REQUIRED_PROVIDER_FIELDS = Object.freeze([
  'internetPickupStatus',
  'homePickupStatus',
  'providerScript',
  'providerDocs',
  'hostedEndpoint',
  'deploymentProof',
  'corsPreflightProof',
  'healthCheckProof',
  'roundTripSmokeArtifact',
  'redactedAckProof'
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
  'plaintextrulevalue',
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

function validateOwnershipDecision(errors, ownershipDecision) {
  if (!isPlainObject(ownershipDecision)) {
    errors.push('ownershipDecision must be an object');
    return undefined;
  }

  addMissingFieldErrors(errors, ownershipDecision, REQUIRED_OWNERSHIP_FIELDS, 'ownershipDecision');
  if (!VALID_DECISIONS.has(ownershipDecision.decision)) {
    errors.push('ownershipDecision.decision must be reference_provider_only, user_supplied_provider_only, or filtertube_hosted_provider');
  }
  if (ownershipDecision.discoveryIsAuthority !== false) {
    errors.push('ownershipDecision.discoveryIsAuthority must be false');
  }
  if (ownershipDecision.providerIsPolicyAuthority !== false) {
    errors.push('ownershipDecision.providerIsPolicyAuthority must be false');
  }
  if (ownershipDecision.releaseClaim === 'guaranteed_later_delivery' && ownershipDecision.decision !== 'filtertube_hosted_provider') {
    errors.push('ownershipDecision.releaseClaim guaranteed_later_delivery requires filtertube_hosted_provider');
  }
  return ownershipDecision.decision;
}

function validateProviderEvidence(errors, providerEvidence, decision) {
  if (!isPlainObject(providerEvidence)) {
    errors.push('providerEvidence must be an object');
    return;
  }

  addMissingFieldErrors(errors, providerEvidence, REQUIRED_PROVIDER_FIELDS, 'providerEvidence');
  if (providerEvidence.providerScript !== 'scripts/managed-delivery-provider.mjs') {
    errors.push('providerEvidence.providerScript must be scripts/managed-delivery-provider.mjs');
  }
  if (providerEvidence.providerDocs !== 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md') {
    errors.push('providerEvidence.providerDocs must be docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md');
  }

  if (decision === 'filtertube_hosted_provider') {
    for (const field of [
      'hostedEndpoint',
      'deploymentProof',
      'corsPreflightProof',
      'healthCheckProof',
      'roundTripSmokeArtifact',
      'redactedAckProof'
    ]) {
      if (isBlank(providerEvidence[field]) || String(providerEvidence[field]).toUpperCase() === 'N/A') {
        errors.push(`providerEvidence.${field} is required for filtertube_hosted_provider`);
      }
    }
    if (providerEvidence.internetPickupStatus !== 'owned_deployed_smoked') {
      errors.push('providerEvidence.internetPickupStatus must be owned_deployed_smoked for filtertube_hosted_provider');
    }
  } else {
    if (providerEvidence.hostedEndpoint !== 'N/A') {
      errors.push('providerEvidence.hostedEndpoint must be N/A unless filtertube_hosted_provider is selected');
    }
    if (providerEvidence.internetPickupStatus === 'owned_deployed_smoked') {
      errors.push('providerEvidence.internetPickupStatus cannot be owned_deployed_smoked without filtertube_hosted_provider');
    }
  }
}

function validateRows(errors, rows) {
  if (!sameItems(rows.map(row => row?.id), REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS)) {
    errors.push('requiredRows must exactly match the required managed pickup provider ownership rows');
  }
  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (isBlank(row?.observation?.summary)) errors.push(`${rowId}.observation.summary is required`);
    if (isBlank(row?.evidence?.artifactOrDoc)) errors.push(`${rowId}.evidence.artifactOrDoc is required`);
    if (row?.evidence?.authorityGrantedByProvider !== false) {
      errors.push(`${rowId}.evidence.authorityGrantedByProvider must be false`);
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

export function validateManagedPickupProviderOwnershipArtifact(artifact) {
  const errors = [];
  if (!isPlainObject(artifact)) return ['artifact must be a JSON object'];

  if (artifact.artifactType !== 'filtertube-managed-pickup-provider-ownership') {
    errors.push('artifactType must be filtertube-managed-pickup-provider-ownership');
  }
  if (artifact.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.boundaryDoc !== MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC) {
    errors.push(`boundaryDoc must be ${MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC}`);
  }

  validateChangeContext(errors, artifact.changeContext);
  const decision = validateOwnershipDecision(errors, artifact.ownershipDecision);
  validateProviderEvidence(errors, artifact.providerEvidence, decision);

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  validateRows(errors, rows);

  const forbiddenKeys = collectForbiddenSensitiveKeys(artifact);
  for (const keyPath of forbiddenKeys) {
    errors.push(`${keyPath} must not be present in managed pickup provider ownership artifacts`);
  }

  return errors;
}

export function readManagedPickupProviderOwnershipArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readManagedPickupProviderOwnershipArtifact(resolved);
  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
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
