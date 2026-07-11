#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_EVIDENCE_DIR = 'docs/audit/evidence/family-devices-2026-07-08';
const DOWNLOAD_PATTERNS = [
  /^raw-map-.+\.json$/i,
  /^family-devices-map-evidence-.+\.json$/i
];

function usage() {
  console.error(`Usage:
node scripts/import-family-device-downloaded-evidence.mjs \\
  --browser "Chrome / macOS" \\
  --os "macOS" \\
  --version "3.3.5"

Optional:
  --source ~/Downloads/raw-map-no-protected-profile-2026-07-08T12-00-00-000Z.json
  --clipboard
  --case map-no-protected-profile
  --downloads-dir ~/Downloads
  --evidence-dir docs/audit/evidence/family-devices-2026-07-08
  --screenshot docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.png
  --result pending
  --notes "Installed extension capture"
  --force
  --no-validate`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {
    evidenceDir: DEFAULT_EVIDENCE_DIR,
    downloadsDir: path.join(os.homedir(), 'Downloads'),
    result: 'pending',
    validate: true,
    force: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--force') {
      args.force = true;
      continue;
    }
    if (arg === '--no-validate') {
      args.validate = false;
      continue;
    }
    if (arg === '--clipboard') {
      args.clipboard = true;
      continue;
    }
    if (!arg.startsWith('--')) usage();
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) usage();
    args[key] = value;
    index += 1;
  }
  return args;
}

function resolveUserPath(inputPath) {
  if (!inputPath) return '';
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return path.resolve(inputPath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${error.message}`);
  }
}

function readClipboardJson() {
  const result = spawnSync('pbpaste', [], {
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Could not read clipboard with pbpaste: ${result.stderr || 'unknown error'}`);
  }
  const text = String(result.stdout || '').trim();
  if (!text) {
    throw new Error('Clipboard is empty. Click Copy evidence in the dashboard first.');
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Clipboard does not contain valid JSON evidence: ${error.message}`);
  }
}

function normalizeEvidence(payload) {
  if (payload?.schema === 'filtertube_family_devices_manual_evidence') return payload;
  if (payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence') {
    return payload.copiedMapEvidence;
  }
  throw new Error('Downloaded evidence must use schema filtertube_family_devices_manual_evidence');
}

function inferCaseId(payload, normalized, explicitCase) {
  const caseId = explicitCase || payload?.caseId || normalized?.suggestedCaseId;
  if (!caseId || typeof caseId !== 'string') {
    throw new Error('Missing --case and downloaded evidence has no suggestedCaseId');
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(caseId)) {
    throw new Error(`Unsafe case id: ${caseId}`);
  }
  return caseId;
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

function findExistingVisualArtifact(evidenceDir, caseId, runtime) {
  const extensions = ['png', 'mp4'];
  for (const extension of extensions) {
    const candidate = path.join(evidenceDir, `${caseId}.${runtime}.${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return '';
}

function findLatestDownloadedEvidence(downloadsDir) {
  let entries = [];
  try {
    entries = fs.readdirSync(downloadsDir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Could not read downloads directory ${downloadsDir}: ${error.message}`);
  }
  const candidates = entries
    .filter((entry) => entry.isFile() && DOWNLOAD_PATTERNS.some((pattern) => pattern.test(entry.name)))
    .map((entry) => {
      const filePath = path.join(downloadsDir, entry.name);
      const stat = fs.statSync(filePath);
      return { filePath, mtimeMs: stat.mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!candidates.length) {
    throw new Error(`No downloaded Family Devices evidence JSON found in ${downloadsDir}`);
  }
  return candidates[0].filePath;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyEvidence(sourcePath, targetPath, options) {
  const sourceResolved = path.resolve(sourcePath);
  const targetResolved = path.resolve(targetPath);
  if (sourceResolved === targetResolved) {
    return false;
  }
  if (fs.existsSync(targetResolved) && !options.force) {
    throw new Error(`Refusing to overwrite existing raw evidence: ${targetPath}. Use --force if intentional.`);
  }
  ensureParentDir(targetResolved);
  fs.copyFileSync(sourceResolved, targetResolved);
  return true;
}

function writeClipboardEvidence(payload, targetPath, options) {
  const targetResolved = path.resolve(targetPath);
  if (fs.existsSync(targetResolved) && !options.force) {
    throw new Error(`Refusing to overwrite existing raw evidence: ${targetPath}. Use --force if intentional.`);
  }
  ensureParentDir(targetResolved);
  fs.writeFileSync(targetResolved, `${JSON.stringify(payload, null, 2)}\n`);
  return true;
}

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${path.basename(scriptPath)} failed with exit code ${result.status}`);
  }
}

function shellQuote(value) {
  const text = String(value || '');
  if (/^[A-Za-z0-9_./:@=-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function printReviewNextSteps(packetTarget, result) {
  const isPass = String(result || '').trim().toLowerCase() === 'pass';
  console.log('');
  console.log('Review next steps:');
  if (isPass) {
    console.log('- Packet was created as pass. Review the screenshot/video and redacted JSON one more time.');
    console.log('- Preview the Manual Evidence Log update:');
    console.log('npm run audit:family-devices:log -- \\');
    console.log(`  --packet ${shellQuote(packetTarget)} \\`);
    console.log('  --dry-run');
    console.log('- If the preview is correct, update the row:');
    console.log('npm run audit:family-devices:log -- \\');
    console.log(`  --packet ${shellQuote(packetTarget)}`);
    return;
  }
  console.log('- Packet was created as pending. Review the screenshot/video and redacted JSON first.');
  console.log('- After review, intentionally change the packet result to pass, then run:');
  console.log('npm run audit:family-devices:log -- \\');
  console.log(`  --packet ${shellQuote(packetTarget)} \\`);
  console.log('  --dry-run');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const missing = ['browser', 'os', 'version'].filter((key) => !args[key]);
  if (missing.length) {
    console.error(`Missing required arguments: ${missing.join(', ')}`);
    usage();
  }

  const downloadsDir = resolveUserPath(args.downloadsDir);
  const evidenceDir = resolveUserPath(args.evidenceDir);
  if (args.clipboard && args.source) {
    throw new Error('Use either --clipboard or --source, not both.');
  }
  const sourcePath = args.clipboard
    ? ''
    : (resolveUserPath(args.source) || findLatestDownloadedEvidence(downloadsDir));
  const payload = args.clipboard ? readClipboardJson() : readJson(sourcePath);
  const normalized = normalizeEvidence(payload);
  const caseId = inferCaseId(payload, normalized, args.case);
  const runtime = buildRuntimeSlug(args.browser, args.os);
  const rawTarget = path.join(evidenceDir, `raw-${caseId}.${runtime}.json`);
  const packetTarget = path.join(evidenceDir, `${caseId}.${runtime}.json`);
  const visualArtifact = args.screenshot
    ? resolveUserPath(args.screenshot)
    : findExistingVisualArtifact(evidenceDir, caseId, runtime);

  if (fs.existsSync(packetTarget) && !args.force) {
    throw new Error(`Refusing to overwrite existing evidence packet: ${packetTarget}. Use --force if intentional.`);
  }

  const copied = args.clipboard
    ? writeClipboardEvidence(payload, rawTarget, args)
    : copyEvidence(sourcePath, rawTarget, args);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const createScript = path.join(scriptDir, 'create-family-device-evidence-packet.mjs');
  const validateScript = path.join(scriptDir, 'validate-family-device-evidence.mjs');

  const createArgs = [
    '--evidence', rawTarget,
    '--evidence-dir', evidenceDir,
    '--browser', args.browser,
    '--os', args.os,
    '--version', args.version,
    '--result', args.result
  ];
  if (visualArtifact) createArgs.push('--screenshot', visualArtifact);
  if (args.profile) createArgs.push('--profile', args.profile);
  if (args.expected) createArgs.push('--expected', args.expected);
  if (args.actual) createArgs.push('--actual', args.actual);
  if (args.notes) createArgs.push('--notes', args.notes);

  runNodeScript(createScript, createArgs);

  if (args.validate) {
    runNodeScript(validateScript, ['--require-artifacts', packetTarget]);
  }

  console.log('');
  console.log('Imported Family Devices evidence:');
  console.log(`- Source: ${args.clipboard ? 'clipboard' : sourcePath}`);
  console.log(`- Raw evidence: ${rawTarget}${copied ? '' : ' (already in place)'}`);
  console.log(`- Visual artifact: ${visualArtifact || 'not found; save the matching screenshot/video before strict validation can pass'}`);
  console.log(`- Packet: ${packetTarget}`);
  console.log('');
  console.log('Status command:');
  console.log('node scripts/report-family-device-phase11-status.mjs --next');
  printReviewNextSteps(packetTarget, args.result);
  console.log('');
  console.log('Manual row reminder: only mark the audit row pass after the screenshot/video and packet are both reviewed.');
}

try {
  main();
} catch (error) {
  console.error(`Family Devices evidence import failed: ${error.message}`);
  process.exit(1);
}
