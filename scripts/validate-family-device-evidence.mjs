#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_KEYS = new Set([
  'parentPin',
  'childPin',
  'masterPin',
  'pin',
  'password',
  'privateKey',
  'secretKey',
  'rawRules',
  'keywords',
  'channels',
  'whitelist',
  'blacklist',
  'portableSettings',
  'managedPolicyPayload',
  'profileName',
  'profileId',
  'trustedLinkId',
  'linkId',
  'deviceId',
  'sourceDeviceId',
  'targetProfileId',
  'providerToken',
  'setupToken',
  'token'
]);

const ALLOWED_SNAPSHOT_KEYS = new Set([
  'schema',
  'version',
  'capturedAt',
  'mapState',
  'selectedSource',
  'selectedRoute',
  'hasSelectedTrustedDevice',
  'liveReady',
  'protectedCount',
  'verifiedCount',
  'readyCount',
  'pickupCheckCount',
  'trustedDeviceCount',
  'homeBridgeCandidateCount',
  'homeBridgePreviewChecked',
  'homeBridgePreviewHealthOk',
  'homeBridgePreviewReason',
  'sameNetworkReadyCount',
  'awayReadyCount',
  'paths',
  'devices'
]);

const ALLOWED_PATH_KEYS = new Set([
  'id',
  'state',
  'configured',
  'healthChecked',
  'healthOk',
  'source',
  'primaryAction',
  'blockedAction'
]);

const ALLOWED_DEVICE_KEYS = new Set([
  'source',
  'role',
  'trustState',
  'deliveryState',
  'route',
  'routeLabel',
  'profileBound',
  'canSend',
  'canReceive',
  'canCheckPickup',
  'primaryAction',
  'blockedAction'
]);

const ALLOWED_PACKET_KEYS = new Set([
  'testedAt',
  'extensionVersion',
  'browser',
  'os',
  'profileMode',
  'caseId',
  'screenshotPath',
  'copiedMapEvidence',
  'expected',
  'actual',
  'result',
  'notes'
]);

const REQUIRED_PACKET_STRING_KEYS = [
  'testedAt',
  'extensionVersion',
  'browser',
  'os',
  'profileMode',
  'caseId',
  'screenshotPath',
  'expected',
  'actual',
  'result'
];

const ALLOWED_RESULTS = new Set(['pending', 'pass', 'fail', 'blocked']);

const MAP_EVIDENCE_OPTIONAL_CASES = new Set([
  'viewport-desktop-wide',
  'viewport-narrow-desktop',
  'viewport-tablet',
  'viewport-mobile',
  'viewport-large-text',
  'release-copy-boundary',
  'commit-boundary-extension-ui-docs'
]);

const STATIC_CASES = new Set([
  'release-copy-boundary',
  'commit-boundary-extension-ui-docs'
]);

function fail(message) {
  console.error(`Family Devices evidence validation failed: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${filePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function parseArgs(argv) {
  const args = {
    requireArtifacts: false,
    paths: []
  };
  argv.forEach((arg) => {
    if (arg === '--require-artifacts') {
      args.requireArtifacts = true;
      return;
    }
    args.paths.push(arg);
  });
  return args;
}

function collectEvidenceFiles(inputPaths) {
  const files = [];
  inputPaths.forEach((inputPath) => {
    const resolved = path.resolve(inputPath);
    let stat = null;
    try {
      stat = fs.statSync(resolved);
    } catch (error) {
      fail(`${inputPath} does not exist: ${error.message}`);
      return;
    }
    if (stat.isDirectory()) {
      const dirFiles = fs.readdirSync(resolved)
        .filter((name) => name.endsWith('.json'))
        .map((name) => path.join(resolved, name))
        .sort();
      files.push(...dirFiles);
      return;
    }
    files.push(resolved);
  });
  return files;
}

function walk(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, pathParts.concat(String(index))));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child, pathParts.concat(key));
    walk(child, visitor, pathParts.concat(key));
  });
}

function assertNoForbiddenKeys(payload) {
  const hits = [];
  walk(payload, (key, _value, keyPath) => {
    if (FORBIDDEN_KEYS.has(key)) hits.push(keyPath.join('.'));
  });
  if (hits.length) {
    fail(`forbidden private fields found: ${hits.join(', ')}`);
  }
}

function assertAllowedKeys(object, allowedKeys, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) {
    fail(`${label} must be an object`);
    return;
  }
  const unknown = Object.keys(object).filter(key => !allowedKeys.has(key));
  if (unknown.length) {
    fail(`${label} has unexpected keys: ${unknown.join(', ')}`);
  }
}

function getEvidencePayload(payload) {
  if (payload?.schema === 'filtertube_family_devices_manual_evidence') return payload;
  if (payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence') {
    return payload.copiedMapEvidence;
  }
  fail('expected schema filtertube_family_devices_manual_evidence');
  return null;
}

function isPacket(payload) {
  return !!payload?.copiedMapEvidence || !!payload?.caseId;
}

function hasCopiedMapEvidence(payload) {
  return payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence';
}

function assertPacketFileMatchesCase(payload, filePath) {
  if (!isPacket(payload) || typeof payload.caseId !== 'string' || !payload.caseId.trim()) return;
  const base = path.basename(filePath);
  if (!base.startsWith(`${payload.caseId}.`)) {
    fail(`${filePath} filename must start with packet.caseId (${payload.caseId}.)`);
  }
}

function validatePacketMetadata(payload, filePath) {
  if (payload?.schema === 'filtertube_family_devices_manual_evidence') return;
  if (!isPacket(payload)) return;

  assertAllowedKeys(payload, ALLOWED_PACKET_KEYS, `${filePath} packet`);

  REQUIRED_PACKET_STRING_KEYS.forEach((key) => {
    if (typeof payload[key] !== 'string' || !payload[key].trim()) {
      fail(`${filePath} packet.${key} must be a non-empty string`);
    }
  });

  if (!ALLOWED_RESULTS.has(String(payload.result).trim())) {
    fail(`${filePath} packet.result must be one of: ${Array.from(ALLOWED_RESULTS).join(', ')}`);
  }

  const isStaticCase = STATIC_CASES.has(payload.caseId);
  if (!isStaticCase && !payload.screenshotPath.endsWith('.png') && !payload.screenshotPath.endsWith('.mp4')) {
    fail(`${filePath} packet.screenshotPath must point to a .png or .mp4 artifact`);
  }
  if (isStaticCase && payload.screenshotPath !== 'N/A' && !payload.screenshotPath.endsWith('.png') && !payload.screenshotPath.endsWith('.mp4')) {
    fail(`${filePath} packet.screenshotPath must be N/A or point to a .png/.mp4 artifact`);
  }

  if (!isStaticCase && !path.basename(payload.screenshotPath).startsWith(`${payload.caseId}.`)) {
    fail(`${filePath} packet.screenshotPath filename must start with packet.caseId (${payload.caseId}.)`);
  }

  assertPacketFileMatchesCase(payload, filePath);
}

function validateReferencedArtifacts(payload, filePath, options) {
  if (!options.requireArtifacts || !isPacket(payload)) return;
  const isStaticCase = STATIC_CASES.has(payload.caseId);
  if (isStaticCase && payload.screenshotPath === 'N/A') return;
  if (typeof payload.screenshotPath !== 'string' || !payload.screenshotPath.trim()) return;
  const resolved = path.isAbsolute(payload.screenshotPath)
    ? payload.screenshotPath
    : path.resolve(payload.screenshotPath);
  if (!fs.existsSync(resolved)) {
    fail(`${filePath} referenced screenshot artifact is missing: ${payload.screenshotPath}`);
  }
}

function validateEvidence(payload, filePath, options = {}) {
  assertNoForbiddenKeys(payload);
  validatePacketMetadata(payload, filePath);
  validateReferencedArtifacts(payload, filePath, options);

  if (isPacket(payload) && MAP_EVIDENCE_OPTIONAL_CASES.has(payload.caseId) && !hasCopiedMapEvidence(payload)) {
    return;
  }

  const evidence = getEvidencePayload(payload);
  if (!evidence) return;

  if (evidence.page !== 'accounts-sync') {
    fail(`${filePath} page must be accounts-sync`);
  }
  if (!evidence.dom || typeof evidence.dom !== 'object' || Array.isArray(evidence.dom)) {
    fail(`${filePath} missing dom object`);
  }

  const snapshot = evidence.snapshot;
  if (!snapshot || snapshot.schema !== 'filtertube_nanah_family_device_map_snapshot') {
    fail(`${filePath} missing filtertube_nanah_family_device_map_snapshot snapshot`);
    return;
  }

  assertAllowedKeys(snapshot, ALLOWED_SNAPSHOT_KEYS, `${filePath} snapshot`);

  if (!Array.isArray(snapshot.paths)) {
    fail(`${filePath} snapshot.paths must be an array`);
  } else {
    snapshot.paths.forEach((row, index) => {
      assertAllowedKeys(row, ALLOWED_PATH_KEYS, `${filePath} snapshot.paths[${index}]`);
    });
  }

  if (!Array.isArray(snapshot.devices)) {
    fail(`${filePath} snapshot.devices must be an array`);
  } else {
    snapshot.devices.forEach((row, index) => {
      assertAllowedKeys(row, ALLOWED_DEVICE_KEYS, `${filePath} snapshot.devices[${index}]`);
    });
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.paths.length === 0) {
  console.error('Usage: node scripts/validate-family-device-evidence.mjs [--require-artifacts] <evidence.json|evidence-dir> [...]');
  process.exit(2);
}

const files = collectEvidenceFiles(args.paths);
if (files.length === 0) {
  console.error('No Family Devices JSON evidence files found.');
  process.exit(2);
}

for (const file of files) {
  const payload = readJson(file);
  if (payload) validateEvidence(payload, file, args);
}

if (!process.exitCode) {
  console.log(`Validated ${files.length} Family Devices evidence file${files.length === 1 ? '' : 's'}.`);
}
