#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANES } from './test-lane-config.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCE_PROOF_FILES = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content_bridge.js',
  'js/background.js',
  'js/settings_shared.js',
  'js/content/bridge_settings.js',
  'js/state_manager.js'
];

const DEFAULT_SCAN_ROOTS = [
  'docs/audit',
  'tests/runtime'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function walkFiles(dir) {
  const absDir = path.join(repoRoot, dir);
  if (!fs.existsSync(absDir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const full = path.join(absDir, entry.name);
    const rel = path.relative(repoRoot, full);
    if (entry.isDirectory()) {
      out.push(...walkFiles(rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

export function currentSourceProofs() {
  return Object.fromEntries(
    SOURCE_PROOF_FILES
      .filter(file => fs.existsSync(path.join(repoRoot, file)))
      .map(file => {
        const text = read(file);
        return [file, {
          lines: lineCount(text),
          bytes: Buffer.byteLength(text),
          hash: sha256(file)
        }];
      })
  );
}

export function laneOwnedProofFiles() {
  const files = new Set([
    'package.json',
    'scripts/run-test-lane.mjs',
    'scripts/test-lane-config.mjs',
    'scripts/audit-proof-drift.mjs',
    'docs/audit/TEST_LANE_MATRIX.md',
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
  ]);

  for (const lane of Object.values(LANES)) {
    for (const file of [...(lane.checks || []), ...(lane.tests || [])]) {
      files.add(file);
    }
  }

  return [...files].filter(file => fs.existsSync(path.join(repoRoot, file)));
}

export function defaultAuditProofFiles() {
  return DEFAULT_SCAN_ROOTS.flatMap(walkFiles)
    .filter(file => /\.(md|mjs|js|json)$/.test(file));
}

function isSourceProofLine(line, sourceFile) {
  const escaped = sourceFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tableSourceRow = new RegExp(`^\\|\\s*\`${escaped}\`\\s*\\|`).test(line);
  const arraySourceRow = new RegExp(`\\[\\s*['"]${escaped}['"]\\s*,`).test(line);
  const objectSourceRow = new RegExp(`['"]${escaped}['"]\\s*:\\s*\\[`).test(line);

  return (
    tableSourceRow ||
    arraySourceRow ||
    objectSourceRow
  );
}

function hashTokens(line) {
  return line.match(/\b[a-f0-9]{64}\b/g) || [];
}

export function collectProofDrift(options = {}) {
  const scope = options.scope || 'lane-owned';
  const files = options.files || (scope === 'all' ? defaultAuditProofFiles() : laneOwnedProofFiles());
  const proofs = currentSourceProofs();
  const drift = [];

  for (const file of files) {
    const absFile = path.join(repoRoot, file);
    if (!fs.existsSync(absFile) || fs.statSync(absFile).isDirectory()) continue;
    const lines = read(file).split(/\r?\n/);

    for (const [sourceFile, proof] of Object.entries(proofs)) {
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (!line.includes(sourceFile)) continue;
        if (!isSourceProofLine(line, sourceFile)) continue;

        const hashes = hashTokens(line);
        if (hashes.length !== 1) continue;
        for (const hash of hashes) {
          if (hash !== proof.hash) {
            drift.push({
              file,
              line: index + 1,
              sourceFile,
              foundHash: hash,
              expectedHash: proof.hash
            });
          }
        }
      }
    }
  }

  return drift;
}

function printDrift(drift) {
  if (!drift.length) {
    console.log('No stale source fingerprint proof rows found.');
    return;
  }

  console.log(`Found ${drift.length} stale source fingerprint proof row(s):`);
  for (const item of drift) {
    console.log(`${item.file}:${item.line} ${item.sourceFile}`);
    console.log(`  found:    ${item.foundHash}`);
    console.log(`  expected: ${item.expectedHash}`);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const scope = args.has('--all') ? 'all' : 'lane-owned';
  const reportOnly = args.has('--report-only');

  if (args.has('--lane-owned') && args.has('--all')) {
    console.error('Choose only one audit proof drift scope: --lane-owned or --all.');
    process.exit(2);
  }

  const drift = collectProofDrift({ scope });

  printDrift(drift);

  if (drift.length && !reportOnly) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
