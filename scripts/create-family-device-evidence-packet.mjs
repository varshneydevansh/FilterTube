#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_EVIDENCE_DIR = 'docs/audit/evidence/family-devices-2026-07-08';

const CASE_DETAILS = {
  'map-no-protected-profile': {
    profile: 'parent/master',
    expected: 'My Devices & Family offers personal profile sync without a PIN. Choosing Sync My Devices opens code/QR pairing from any location and the optional configured nearby-device picker; family control stays separate.',
    actual: 'Installed dashboard matched the no-protected-profile state.'
  },
  'map-one-protected-profile': {
    profile: 'parent/master',
    expected: 'Family Devices shows one protected profile and asks the parent to pair a protected device.',
    actual: 'Installed dashboard matched the one-protected-profile state.'
  },
  'map-nearby-discovery-active': {
    profile: 'parent/master',
    expected: 'Family Devices shows Looking nearby, Stop finding, and an unpaired row whose only next action is Pair nearby device.',
    actual: 'Installed dashboard matched the active nearby-discovery state.'
  },
  'map-nearby-pairing-gated': {
    profile: 'parent/master + protected device',
    expected: 'The short code reaches the protected device, both devices show a safety phrase, and no trust or settings are sent before phrase confirmation.',
    actual: 'Installed devices kept nearby pairing gated behind matching phrase confirmation.'
  },
  'map-verified-live-session': {
    profile: 'parent/master',
    expected: 'Family Devices shows a verified live pairing session only after the safety phrase is matched.',
    actual: 'Installed dashboard matched the verified live-session state.'
  },
  'map-trusted-device-saved': {
    profile: 'parent/master',
    expected: 'Family Devices shows a saved trusted device without treating it as a live connection.',
    actual: 'Installed dashboard matched the trusted-device-saved state.'
  },
  'protected-receive-only-surface': {
    profile: 'protected child',
    expected: 'Protected Accounts & Sync is receive-only and does not expose parent trust or send-update controls.',
    actual: 'Installed dashboard matched the protected receive-only state.'
  },
  'protected-child-pin-not-admin': {
    profile: 'protected child',
    expected: 'A child profile PIN can switch into the protected profile but cannot unlock parent/admin controls.',
    actual: 'Installed dashboard kept parent/admin controls locked from the child PIN.'
  },
  'viewport-mobile': {
    profile: 'parent/master',
    expected: 'Family Devices remains readable and usable at mobile or narrow width without clipped map actions.',
    actual: 'Installed dashboard matched the mobile/narrow viewport layout expectation.'
  }
};

function usage() {
  console.error(`Usage:
node scripts/create-family-device-evidence-packet.mjs \\
  --case map-no-protected-profile \\
  --evidence downloaded-family-device-evidence.json \\
  --screenshot docs/audit/evidence/family-devices-YYYY-MM-DD/map-no-protected-profile.chrome-macos.png \\
  --out docs/audit/evidence/family-devices-YYYY-MM-DD/map-no-protected-profile.chrome-macos.json \\
  --browser "Chrome 126" \\
  --os "macOS" \\
  --version "3.3.5" \\
  --profile "parent/master" \\
  --expected "Expected behavior..." \\
  --actual "Actual behavior..." \\
  --result pending

Shortcut form when downloaded evidence includes suggestedCaseId:
node scripts/create-family-device-evidence-packet.mjs \\
  --evidence ~/Downloads/raw-map-no-protected-profile-2026-07-08T12-00-00-000Z.json \\
  --browser "Chrome / macOS" \\
  --os "macOS" \\
  --version "3.3.5"`);
  process.exit(2);
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) usage();
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) usage();
    result[key] = value;
    index += 1;
  }
  return result;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${error.message}`);
  }
}

function ensureParentDir(filePath) {
  const dir = path.dirname(path.resolve(filePath));
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeEvidence(payload) {
  if (payload?.schema === 'filtertube_family_devices_manual_evidence') return payload;
  if (payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence') {
    return payload.copiedMapEvidence;
  }
  throw new Error('Evidence JSON must use schema filtertube_family_devices_manual_evidence');
}

function slugForRuntime(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'runtime';
}

function buildRuntimeSlug(browser, os) {
  const browserSlug = slugForRuntime(browser);
  const osSlug = slugForRuntime(os);
  if (!osSlug || browserSlug.endsWith(osSlug)) {
    return browserSlug;
  }
  return `${browserSlug}-${osSlug}`;
}

const args = parseArgs(process.argv.slice(2));
if (!args.evidence || !args.browser || !args.os || !args.version) {
  const missing = ['evidence', 'browser', 'os', 'version'].filter((key) => !args[key]);
  console.error(`Missing required arguments: ${missing.join(', ')}`);
  usage();
}

try {
  const copiedMapEvidence = normalizeEvidence(readJson(args.evidence));
  const caseId = args.case || copiedMapEvidence.suggestedCaseId;
  if (!caseId) {
    throw new Error('Missing --case and downloaded evidence has no suggestedCaseId');
  }
  const detail = CASE_DETAILS[caseId] || {};
  const evidenceDir = args.evidenceDir || args['evidence-dir'] || DEFAULT_EVIDENCE_DIR;
  const runtime = buildRuntimeSlug(args.browser, args.os);
  const screenshotPath = args.screenshot || path.join(evidenceDir, `${caseId}.${runtime}.png`);
  const outPath = args.out || path.join(evidenceDir, `${caseId}.${runtime}.json`);
  const packet = {
    testedAt: args.testedAt || new Date().toISOString(),
    extensionVersion: args.version || '',
    browser: args.browser || '',
    os: args.os || '',
    profileMode: args.profile || detail.profile || '',
    caseId,
    screenshotPath,
    copiedMapEvidence,
    expected: args.expected || detail.expected || '',
    actual: args.actual || detail.actual || '',
    result: args.result || 'pending',
    notes: args.notes || ''
  };
  const missingPacketFields = ['profileMode', 'expected', 'actual'].filter((key) => !packet[key]);
  if (missingPacketFields.length) {
    throw new Error(`Missing packet metadata: ${missingPacketFields.join(', ')}. Pass explicit --profile, --expected, and --actual.`);
  }

  ensureParentDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(packet, null, 2)}\n`);
  console.log(`Wrote Family Devices evidence packet: ${outPath}`);
  console.log('Validate it with:');
  console.log(`node scripts/validate-family-device-evidence.mjs ${outPath}`);
} catch (error) {
  console.error(`Family Devices evidence packet failed: ${error.message}`);
  process.exit(1);
}
