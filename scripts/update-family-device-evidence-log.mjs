#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PLAN = 'docs/audit/FILTERTUBE_XENDER_STYLE_FAMILY_DEVICE_MAP_PLAN_2026-07-07.md';

function usage() {
  console.error(`Usage:
node scripts/update-family-device-evidence-log.mjs \\
  --packet docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.json

Visual-only viewport rows:
node scripts/update-family-device-evidence-log.mjs \\
  --case viewport-mobile \\
  --visual docs/audit/evidence/family-devices-2026-07-08/viewport-mobile.chrome-macos.png \\
  --browser "Chrome / macOS" \\
  --os macOS

Optional:
  --plan docs/audit/FILTERTUBE_XENDER_STYLE_FAMILY_DEVICE_MAP_PLAN_2026-07-07.md
  --dry-run
  --force`);
  process.exit(2);
}

const VISUAL_ONLY_CASES = new Map([
  [
    'viewport-desktop-wide',
    'Family Devices remains readable and usable at a wide desktop viewport.'
  ],
  [
    'viewport-narrow-desktop',
    'Family Devices remains readable and usable at a narrow desktop viewport.'
  ],
  [
    'viewport-tablet',
    'Family Devices remains readable and usable at tablet width.'
  ],
  [
    'viewport-mobile',
    'Family Devices remains readable and usable at mobile or narrow width without clipped map actions.'
  ],
  [
    'viewport-large-text',
    'Family Devices remains readable and usable with larger text.'
  ]
]);

function parseArgs(argv) {
  const args = {
    plan: DEFAULT_PLAN,
    dryRun: false,
    force: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg === '--force') {
      args.force = true;
      continue;
    }
    if (!arg.startsWith('--')) usage();
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) usage();
    args[key] = value;
    index += 1;
  }
  if (!args.packet && !(args.case && args.visual)) usage();
  if (args.packet && (args.case || args.visual)) {
    throw new Error('Use either --packet or --case/--visual, not both.');
  }
  return args;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${error.message}`);
  }
}

function runValidator(packetPath) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const validator = path.join(scriptDir, 'validate-family-device-evidence.mjs');
  const result = spawnSync(process.execPath, [validator, '--require-artifacts', packetPath], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`Evidence packet validator failed with exit code ${result.status}`);
  }
}

function toRepoRelative(filePath) {
  const resolved = path.resolve(filePath);
  const relative = path.relative(process.cwd(), resolved);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative
    : filePath;
}

function normalizeCell(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function packetDate(packet) {
  const testedAt = String(packet.testedAt || '').trim();
  if (!testedAt) return '';
  const date = testedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : testedAt;
}

function formatBrowserOs(browser, osName) {
  const browserText = normalizeCell(browser);
  const osText = normalizeCell(osName);
  if (!browserText) return osText;
  if (!osText) return browserText;
  if (browserText.toLowerCase().includes(osText.toLowerCase())) return browserText;
  return `${browserText} / ${osText}`;
}

function buildRow(packet, packetPath) {
  const browserOs = formatBrowserOs(packet.browser, packet.os);
  const noteParts = [
    packet.actual,
    packet.notes ? `Notes: ${packet.notes}` : ''
  ].filter(Boolean);
  const snapshotParts = [
    packet.screenshotPath ? `visual: \`${normalizeCell(packet.screenshotPath)}\`` : '',
    `packet: \`${normalizeCell(toRepoRelative(packetPath))}\``,
    packet.expected ? `expected: ${packet.expected}` : ''
  ].filter(Boolean);
  return `| ${normalizeCell(packetDate(packet))} | ${browserOs} | \`${normalizeCell(packet.caseId)}\` | pass | ${normalizeCell(noteParts.join(' '))} | ${normalizeCell(snapshotParts.join('; '))} |`;
}

function assertVisualEvidence(args) {
  const caseId = String(args.case || '').trim();
  if (!VISUAL_ONLY_CASES.has(caseId)) {
    throw new Error(`Visual-only log updates are limited to viewport rows. Unsupported case: ${caseId}`);
  }
  if (!args.browser || !args.os) {
    throw new Error('Visual-only log updates require --browser and --os.');
  }
  const visualPath = path.resolve(args.visual);
  if (!fs.existsSync(visualPath)) {
    throw new Error(`Visual artifact is missing: ${args.visual}`);
  }
  if (!/\.(png|mp4)$/i.test(visualPath)) {
    throw new Error('Visual artifact must be a .png or .mp4 file.');
  }
  const base = path.basename(visualPath);
  if (!base.startsWith(`${caseId}.`)) {
    throw new Error(`Visual artifact filename must start with ${caseId}.`);
  }
  return {
    caseId,
    visualPath,
    expected: args.expected || VISUAL_ONLY_CASES.get(caseId),
    actual: args.actual || 'Reviewed visual evidence matched the expected viewport state.'
  };
}

function buildVisualRow(args, visualEvidence) {
  const date = normalizeCell(args.date || new Date().toISOString().slice(0, 10));
  const browserOs = formatBrowserOs(args.browser, args.os);
  const note = normalizeCell(args.actual || visualEvidence.actual);
  const snapshot = normalizeCell([
    `visual: \`${toRepoRelative(visualEvidence.visualPath)}\``,
    `expected: ${visualEvidence.expected}`
  ].join('; '));
  return `| ${date} | ${browserOs} | \`${normalizeCell(visualEvidence.caseId)}\` | pass | ${note} | ${snapshot} |`;
}

function findEvidenceRow(lines, caseId) {
  const target = `\`${caseId}\``;
  return lines.findIndex((line) => {
    if (!line.trim().startsWith('|')) return false;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    return cells[2] === target;
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(args.plan);

  let caseId = '';
  let replacement = '';

  if (args.packet) {
    const packetPath = path.resolve(args.packet);
    const packet = readJson(packetPath);

    runValidator(packetPath);

    if (String(packet.result || '').trim().toLowerCase() !== 'pass') {
      throw new Error('Refusing to update the Manual Evidence Log because packet.result is not pass.');
    }
    if (!packet.caseId || typeof packet.caseId !== 'string') {
      throw new Error('Evidence packet is missing caseId.');
    }
    caseId = packet.caseId;
    replacement = buildRow(packet, packetPath);
  } else {
    const visualEvidence = assertVisualEvidence(args);
    caseId = visualEvidence.caseId;
    replacement = buildVisualRow(args, visualEvidence);
  }

  const markdown = fs.readFileSync(planPath, 'utf8');
  const lines = markdown.split('\n');
  const rowIndex = findEvidenceRow(lines, caseId);
  if (rowIndex < 0) {
    throw new Error(`Could not find Manual Evidence Log row for ${caseId}`);
  }

  const existingCells = lines[rowIndex].split('|').slice(1, -1).map((cell) => cell.trim());
  const existingResult = String(existingCells[3] || '').replace(/^`|`$/g, '').toLowerCase();
  if (existingResult === 'pass' && !args.force) {
    throw new Error(`Manual Evidence Log row for ${caseId} is already pass. Use --force if replacement is intentional.`);
  }

  if (args.dryRun) {
    console.log('Dry run replacement row:');
    console.log(replacement);
    return;
  }

  lines[rowIndex] = replacement;
  fs.writeFileSync(planPath, lines.join('\n'));
  console.log(`Updated Manual Evidence Log row for ${caseId} in ${toRepoRelative(planPath)}`);
}

try {
  main();
} catch (error) {
  console.error(`Family Devices evidence log update failed: ${error.message}`);
  process.exit(1);
}
