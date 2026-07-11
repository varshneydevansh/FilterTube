#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_EVIDENCE_DIR = 'docs/audit/evidence/family-devices-2026-07-08';

const MINIMUM_CASES = [
  {
    id: 'map-no-protected-profile',
    title: 'No protected profile',
    profile: 'parent/master',
    visual: true,
    json: true,
    setup: 'Open Accounts & Sync with no protected child/user profile created.',
    expected: 'My Devices & Family offers personal profile sync without a PIN. Choosing Sync My Devices opens code/QR pairing from any location and the optional configured nearby-device picker; family control stays separate.'
  },
  {
    id: 'map-one-protected-profile',
    title: 'One protected profile',
    profile: 'parent/master',
    visual: true,
    json: true,
    setup: 'Create one protected profile and return to Accounts & Sync.',
    expected: 'Family Devices shows one protected profile and asks the parent to pair a protected device.'
  },
  {
    id: 'map-nearby-discovery-active',
    title: 'Nearby search is active',
    profile: 'parent/master',
    visual: true,
    json: true,
    setup: 'Run npm run managed:nearby on both computers (or configure Home Bridge), press Find nearby, and let the other device appear.',
    expected: 'Family Devices shows Looking nearby, Stop finding, and an unpaired row whose only next action is Pair nearby device.'
  },
  {
    id: 'map-nearby-pairing-gated',
    title: 'Nearby pairing stays gated',
    profile: 'parent/master + protected device',
    visual: true,
    json: true,
    setup: 'Select the unpaired nearby row and start pairing, but do not confirm the safety phrase yet.',
    expected: 'The short code reaches the protected device, both devices show a safety phrase, and no trust or settings are sent before phrase confirmation.'
  },
  {
    id: 'map-verified-live-session',
    title: 'Verified live session',
    profile: 'parent/master',
    visual: true,
    json: true,
    setup: 'Pair two devices and confirm the matching safety phrase, without saving trust yet.',
    expected: 'Family Devices shows a verified live pairing session only after the safety phrase is matched.'
  },
  {
    id: 'map-trusted-device-saved',
    title: 'Saved trusted device',
    profile: 'parent/master',
    visual: true,
    json: true,
    setup: 'Save parent trust for the protected device, then return to the Family Devices map.',
    expected: 'Family Devices shows a saved trusted device without treating it as a live connection.'
  },
  {
    id: 'protected-receive-only-surface',
    title: 'Protected receive-only surface',
    profile: 'protected child',
    visual: true,
    json: true,
    setup: 'Switch into the protected profile and open Accounts & Sync.',
    expected: 'Protected Accounts & Sync is receive-only and does not expose parent trust or send-update controls.'
  },
  {
    id: 'protected-child-pin-not-admin',
    title: 'Child PIN is not admin',
    profile: 'protected child',
    visual: true,
    json: true,
    setup: 'Unlock only with the child profile PIN, then try to access parent/admin controls.',
    expected: 'A child profile PIN can switch into the protected profile but cannot unlock parent/admin controls.'
  },
  {
    id: 'viewport-mobile',
    title: 'Mobile or narrow viewport',
    profile: 'parent/master',
    visual: true,
    json: false,
    setup: 'Resize the installed dashboard to a mobile/narrow viewport on Accounts & Sync.',
    expected: 'Family Devices remains readable and usable at mobile or narrow width without clipped map actions.'
  }
];

function usage() {
  console.error(`Usage:
node scripts/create-family-device-capture-checklist.mjs

Optional:
  --browser "Chrome / macOS"
  --os macOS
  --version 3.3.5
  --evidence-dir docs/audit/evidence/family-devices-2026-07-08
  --out docs/audit/evidence/family-devices-2026-07-08/capture-checklist.md`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {
    browser: 'Chrome / macOS',
    os: 'macOS',
    version: '3.3.5',
    evidenceDir: DEFAULT_EVIDENCE_DIR,
    out: ''
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) usage();
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) usage();
    args[key] = value;
    index += 1;
  }
  return args;
}

function slugForRuntime(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'runtime';
}

function buildRuntimeSlug(browser, osName) {
  const browserSlug = slugForRuntime(browser);
  const osSlug = slugForRuntime(osName);
  if (!osSlug || browserSlug.endsWith(osSlug)) return browserSlug;
  return `${browserSlug}-${osSlug}`;
}

function shellQuote(value) {
  const text = String(value || '');
  if (/^[A-Za-z0-9_./:@=-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function resolveUserPath(inputPath) {
  if (!inputPath) return '';
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return path.resolve(inputPath);
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).sort();
  } catch (_) {
    return [];
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function hasValidPassPacket(caseId, evidenceDir, files) {
  return files
    .filter((file) => file.startsWith(`${caseId}.`) && file.endsWith('.json'))
    .some((file) => {
      const payload = readJson(path.join(evidenceDir, file));
      return payload?.caseId === caseId
        && payload?.result === 'pass'
        && payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence';
    });
}

function artifactState(testCase, evidenceDir, files) {
  const visualExists = files.some((file) => (
    file.startsWith(`${testCase.id}.`) && /\.(png|mp4)$/i.test(file)
  ));
  const jsonExists = files.some((file) => (
    file.startsWith(`${testCase.id}.`) && /\.json$/i.test(file)
  ));
  const validPassJson = hasValidPassPacket(testCase.id, evidenceDir, files);
  const missing = [];
  if (testCase.visual && !visualExists) missing.push('visual');
  if (testCase.json && !jsonExists) missing.push('json');
  if (testCase.json && jsonExists && !validPassJson) missing.push('valid pass json');
  return {
    visualExists,
    jsonExists,
    validPassJson,
    missing
  };
}

function buildChecklist(args) {
  const evidenceDir = resolveUserPath(args.evidenceDir);
  const runtime = buildRuntimeSlug(args.browser, args.os);
  const files = listFiles(evidenceDir);
  const caseStates = MINIMUM_CASES.map((testCase) => ({
    testCase,
    state: artifactState(testCase, evidenceDir, files)
  }));
  const missingCases = caseStates.filter(({ state }) => state.missing.length);
  const lines = [];
  lines.push('# Family Devices Minimum Evidence Capture Checklist');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Evidence folder: \`${args.evidenceDir}\``);
  lines.push(`Runtime label: \`${runtime}\``);
  lines.push('');
  lines.push('Use this list for the minimum release evidence set. Do not mark a row pass until the visual artifact and copied evidence agree.');
  lines.push('');
  lines.push('## Fast Path');
  lines.push('');
  lines.push('Capture in this order. Stop and fix the UI before continuing if a screenshot shows clipped text, tiny tap targets, confusing authority copy, or a protected profile seeing parent-only controls.');
  lines.push('');
  lines.push('| Order | Case | Need | Why it matters |');
  lines.push('| --- | --- | --- | --- |');
  caseStates.forEach(({ testCase, state }, index) => {
    const need = state.missing.length ? state.missing.join(', ') : 'done';
    lines.push(`| ${index + 1} | \`${testCase.id}\` | ${need} | ${testCase.expected} |`);
  });
  lines.push('');
  if (missingCases.length) {
    lines.push(`Current minimum evidence status: ${MINIMUM_CASES.length - missingCases.length}/${MINIMUM_CASES.length} cases complete.`);
    lines.push('');
    lines.push('Next missing case:');
    lines.push('');
    lines.push(`- \`${missingCases[0].testCase.id}\`: ${missingCases[0].state.missing.join(', ')}`);
    lines.push('');
  } else {
    lines.push('Current minimum evidence status: all minimum cases have the required artifacts.');
    lines.push('');
  }
  lines.push('Capture both the configured Home Bridge picker and the opt-in localhost companion picker when those claims are part of the release. The extension must probe localhost only after an explicit nearby action and must never scan subnets. Zero-install native mDNS discovery, hosted FilterTube Pickup, and native app parity remain future or downstream slices.');
  lines.push('');
  lines.push('## Before Capture');
  lines.push('');
  lines.push('```bash');
  lines.push(`mkdir -p ${shellQuote(args.evidenceDir)}`);
  lines.push('npm run audit:family-devices:phase11');
  lines.push('```');
  lines.push('');

  caseStates.forEach(({ testCase, state }, index) => {
    const visualPath = path.join(args.evidenceDir, `${testCase.id}.${runtime}.png`);
    const rawPath = path.join(args.evidenceDir, `raw-${testCase.id}.${runtime}.json`);
    const packetPath = path.join(args.evidenceDir, `${testCase.id}.${runtime}.json`);
    lines.push(`## ${index + 1}. ${testCase.title}`);
    lines.push('');
    lines.push(`- Case ID: \`${testCase.id}\``);
    lines.push(`- Profile: ${testCase.profile}`);
    lines.push(`- Setup: ${testCase.setup}`);
    lines.push(`- Expected: ${testCase.expected}`);
    lines.push(`- Current artifacts: visual=${state.visualExists ? 'yes' : 'no'}, json=${state.jsonExists ? 'yes' : 'no'}, valid pass json=${state.validPassJson ? 'yes' : 'no'}`);
    lines.push(`- Missing: ${state.missing.length ? state.missing.join(', ') : 'none'}`);
    lines.push('');
    lines.push('Capture target files:');
    lines.push('');
    lines.push('```text');
    if (testCase.visual) lines.push(visualPath);
    if (testCase.json) {
      lines.push(rawPath);
      lines.push(packetPath);
    }
    lines.push('```');
    lines.push('');
    if (testCase.json) {
      lines.push('After clicking Copy evidence in the installed dashboard:');
      lines.push('');
      lines.push(`If \`${path.basename(visualPath)}\` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass \`--screenshot\` explicitly.`);
      lines.push('');
      lines.push('```bash');
      lines.push('npm run audit:family-devices:import -- \\');
      lines.push('  --clipboard \\');
      lines.push(`  --browser ${shellQuote(args.browser)} \\`);
      lines.push(`  --os ${shellQuote(args.os)} \\`);
      lines.push(`  --version ${shellQuote(args.version)}`);
      lines.push('```');
      lines.push('');
      lines.push('After clicking Download evidence instead:');
      lines.push('');
      lines.push('```bash');
      lines.push('npm run audit:family-devices:import -- \\');
      lines.push(`  --browser ${shellQuote(args.browser)} \\`);
      lines.push(`  --os ${shellQuote(args.os)} \\`);
      lines.push(`  --version ${shellQuote(args.version)}`);
      lines.push('```');
      lines.push('');
    } else {
      lines.push('Viewport-only case: copied JSON is optional. Save the screenshot, review it, then preview the Manual Evidence Log update:');
      lines.push('');
      lines.push('```bash');
      lines.push('npm run audit:family-devices:log -- \\');
      lines.push(`  --case ${testCase.id} \\`);
      lines.push(`  --visual ${shellQuote(visualPath)} \\`);
      lines.push(`  --browser ${shellQuote(args.browser)} \\`);
      lines.push(`  --os ${shellQuote(args.os)} \\`);
      lines.push('  --dry-run');
      lines.push('```');
      lines.push('');
      lines.push('If the preview row is correct, run the same command without `--dry-run`.');
      lines.push('');
    }
  });

  lines.push('## Final Gate');
  lines.push('');
  lines.push('```bash');
  lines.push('npm run audit:family-devices:release');
  lines.push('```');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checklist = buildChecklist(args);
  if (args.out) {
    const outPath = resolveUserPath(args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, checklist);
    console.log(`Wrote Family Devices capture checklist: ${args.out}`);
    return;
  }
  process.stdout.write(checklist);
}

main();
