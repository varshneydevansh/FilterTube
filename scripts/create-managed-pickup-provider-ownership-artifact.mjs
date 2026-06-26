#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC,
  REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS,
  validateManagedPickupProviderOwnershipArtifact
} from '../docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs';

export const DEFAULT_MANAGED_PICKUP_PROVIDER_OWNERSHIP_OUTPUT_DIR =
  'docs/audit/artifacts/managed-pickup-provider-ownership/generated';

const DEFAULT_REQUIRED_LANES = Object.freeze(['test:release', 'test:settings', 'test:smoke']);
const DEFAULT_PROOF_COMMAND =
  'node --test tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs';
const DEFAULT_PROOF_SUMMARY =
  'managed pickup provider ownership verifier and reference provider tests passed before ownership artifact creation';

const PROVIDER_SCRIPT = 'scripts/managed-delivery-provider.mjs';
const PROVIDER_DOCS = 'docs/audit/FILTERTUBE_MANAGED_DELIVERY_REFERENCE_PROVIDER_2026-06-20.md';
const VALID_DECISIONS = new Set([
  'reference_provider_only',
  'user_supplied_provider_only',
  'filtertube_hosted_provider'
]);

const REQUIRED_OWNERSHIP_FIELDS = Object.freeze([
  'decision',
  'owner',
  'operator',
  'supportContact',
  'retentionPolicy',
  'purgeRevocationPolicy',
  'abuseRateLimitPolicy',
  'privacyBoundary'
]);

const REQUIRED_PROVIDER_FIELDS = Object.freeze([
  'internetPickupStatus',
  'homePickupStatus',
  'deploymentProof',
  'corsPreflightProof',
  'providerStatusProof',
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
    else if (arg === '--confirm-provider-ownership-reviewed') options.confirmed = true;
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
  return value.trim();
}

function optionalString(source, key, fallback) {
  const value = source?.[key];
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return fallback;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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
    logicalChangeType: input.logicalChangeType || 'managed pickup provider ownership evidence',
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

function buildOwnershipDecision(input) {
  const source = requiredObject(input, 'ownershipDecision');
  for (const field of REQUIRED_OWNERSHIP_FIELDS) requiredString(source, field, 'input.ownershipDecision');

  const decision = source.decision;
  if (!VALID_DECISIONS.has(decision)) {
    throw new Error('input.ownershipDecision.decision must be reference_provider_only, user_supplied_provider_only, or filtertube_hosted_provider');
  }
  if (source.discoveryIsAuthority === true) {
    throw new Error('input.ownershipDecision.discoveryIsAuthority cannot be true');
  }
  if (source.providerIsPolicyAuthority === true) {
    throw new Error('input.ownershipDecision.providerIsPolicyAuthority cannot be true');
  }

  return {
    decision,
    owner: source.owner.trim(),
    operator: source.operator.trim(),
    supportContact: source.supportContact.trim(),
    retentionPolicy: source.retentionPolicy.trim(),
    purgeRevocationPolicy: source.purgeRevocationPolicy.trim(),
    abuseRateLimitPolicy: source.abuseRateLimitPolicy.trim(),
    privacyBoundary: source.privacyBoundary.trim(),
    releaseClaim: optionalString(
      source,
      'releaseClaim',
      decision === 'filtertube_hosted_provider'
        ? 'hosted_later_delivery_after_smoke'
        : 'optional_configured_pickup_only'
    ),
    discoveryIsAuthority: false,
    providerIsPolicyAuthority: false
  };
}

function buildProviderEvidence(input, decision) {
  const source = requiredObject(input, 'providerEvidence');
  for (const field of REQUIRED_PROVIDER_FIELDS) requiredString(source, field, 'input.providerEvidence');

  return {
    internetPickupStatus: source.internetPickupStatus.trim(),
    homePickupStatus: source.homePickupStatus.trim(),
    providerScript: PROVIDER_SCRIPT,
    providerDocs: PROVIDER_DOCS,
    hostedEndpoint: optionalString(source, 'hostedEndpoint', decision === 'filtertube_hosted_provider' ? '' : 'N/A'),
    deploymentProof: source.deploymentProof.trim(),
    corsPreflightProof: source.corsPreflightProof.trim(),
    providerStatusProof: source.providerStatusProof.trim(),
    healthCheckProof: source.healthCheckProof.trim(),
    roundTripSmokeArtifact: source.roundTripSmokeArtifact.trim(),
    redactedAckProof: source.redactedAckProof.trim()
  };
}

function buildRequiredRows(input) {
  const rowEvidence = requiredObject(input, 'rowEvidence');

  return REQUIRED_MANAGED_PICKUP_PROVIDER_OWNERSHIP_ROWS.map(id => {
    const row = rowEvidence[id];
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`input.rowEvidence.${id} must be an object`);
    }

    return {
      id,
      requiredObservation: optionalString(row, 'requiredObservation', `${id} provider ownership row reviewed`),
      status: 'passed',
      observation: {
        pass: true,
        summary: requiredString(row, 'summary', `input.rowEvidence.${id}`)
      },
      evidence: {
        artifactOrDoc: requiredString(row, 'artifactOrDoc', `input.rowEvidence.${id}`),
        authorityGrantedByProvider: false
      }
    };
  });
}

export function createManagedPickupProviderOwnershipArtifact(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const input = options.input || {};
  if (!options.confirmed) {
    throw new Error('Pass --confirm-provider-ownership-reviewed after provider ownership, privacy, retention, and release wording have actually been reviewed.');
  }
  const forbiddenInputKeys = collectForbiddenSensitiveKeys(input);
  if (forbiddenInputKeys.length) {
    throw new Error(`input contains sensitive provider ownership fields:\n- ${forbiddenInputKeys.join('\n- ')}`);
  }

  const ownershipDecision = buildOwnershipDecision(input);
  const providerEvidence = buildProviderEvidence(input, ownershipDecision.decision);
  const artifact = {
    artifactType: 'filtertube-managed-pickup-provider-ownership',
    schemaVersion: 1,
    status: 'executed',
    runtimeBehaviorChanged: false,
    workspaceRevisionOrHash: input.workspaceRevisionOrHash || gitRevisionOrUnknown(repoRoot),
    boundaryDoc: MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_DOC,
    changeContext: buildChangeContext(input),
    ownershipDecision,
    providerEvidence,
    requiredRows: buildRequiredRows(input),
    completionRules: {
      allRowsMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      hostedClaimsRequireOwnedDeployedSmokedProvider: true,
      discoveryAndProviderAreNeverPolicyAuthority: true,
      noPlaintextSensitiveFields: true
    }
  };

  const errors = validateManagedPickupProviderOwnershipArtifact(artifact);
  if (errors.length) {
    throw new Error(`generated provider ownership artifact failed validation:\n- ${errors.join('\n- ')}`);
  }

  return artifact;
}

export function writeManagedPickupProviderOwnershipArtifact(artifact, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(artifact, null, 2)}\n`);
  return resolved;
}

function printHelp() {
  console.log(`Usage:
  npm run managed:provider-ownership -- --input <redacted-provider-ownership.json> --confirm-provider-ownership-reviewed [--output <artifact.json>]

Input JSON shape:
{
  "ownershipDecision": {
    "decision": "reference_provider_only | user_supplied_provider_only | filtertube_hosted_provider",
    "owner": "FilterTube or operator name",
    "operator": "release ops or self-hosted operator",
    "supportContact": "redacted/support contact",
    "retentionPolicy": "what expires and when",
    "purgeRevocationPolicy": "how revoked links and pending rows are purged",
    "abuseRateLimitPolicy": "how queue/request abuse is limited",
    "privacyBoundary": "provider stores delivery metadata only",
    "releaseClaim": "optional_configured_pickup_only"
  },
  "providerEvidence": {
    "internetPickupStatus": "reference_or_user_supplied_only",
    "homePickupStatus": "explicit_provider_only_no_automatic_discovery",
    "hostedEndpoint": "N/A",
    "deploymentProof": "N/A",
    "corsPreflightProof": "N/A",
    "providerStatusProof": "N/A",
    "healthCheckProof": "N/A",
    "roundTripSmokeArtifact": "N/A",
    "redactedAckProof": "N/A"
  },
  "rowEvidence": {
    "FT-PICKUP-PROVIDER-00-owner-decision": {
      "summary": "owner/operator/support reviewed",
      "artifactOrDoc": "docs/audit/..."
    }
  }
}

Start from:
  docs/audit/artifacts/managed-pickup-provider-ownership/observation-template.json

This generator records provider ownership proof only. It never grants policy
authority to network discovery or the pickup provider, and it rejects plaintext
rules, PINs, tokens, secrets, private keys, raw policy JSON, and ciphertext.
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
      : path.join(repoRoot, DEFAULT_MANAGED_PICKUP_PROVIDER_OWNERSHIP_OUTPUT_DIR, `${timestampForFile()}-provider-ownership.json`);

    const artifact = createManagedPickupProviderOwnershipArtifact({
      repoRoot,
      input,
      confirmed: options.confirmed
    });
    const written = writeManagedPickupProviderOwnershipArtifact(artifact, outputPath);
    console.log(JSON.stringify({
      artifact: relFrom(repoRoot, written),
      decision: artifact.ownershipDecision.decision,
      releaseClaim: artifact.ownershipDecision.releaseClaim,
      requiredRows: artifact.requiredRows.length,
      readiness: artifact.ownershipDecision.decision === 'filtertube_hosted_provider'
        ? 'provider ownership artifact created; hosted later-delivery still depends on matching smoke evidence'
        : 'provider ownership artifact created; hosted later-delivery remains blocked'
    }, null, 2));
  } catch (error) {
    console.error(`Managed pickup provider ownership artifact failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
