#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  AUDIT_PROOF_PATH_PATTERN,
  FILE_LANE_RULES,
  LANES,
  LIVE_SMOKE_ARTIFACT_TEMPLATE,
  LIVE_SMOKE_ARTIFACT_VERIFIER,
  LIVE_SMOKE_CHANGE_CONTEXT_ENV,
  LIVE_SMOKE_RUNNER_COMMAND,
  LIVE_SMOKE_REQUIRED_ROWS,
  LIVE_SMOKE_VERIFY_COMMAND,
  MANUAL_YOUTUBE_SMOKE_LANE_REASONS,
  NON_PROOF_LANE,
  RUNTIME_FIXTURE_LANE_REASONS,
  RUNTIME_FIXTURE_PROOF_PATH_PATTERN,
  RUNTIME_TEST_PROOF_PATH_PATTERN
} from './test-lane-config.mjs';

export { FILE_LANE_RULES, LANES } from './test-lane-config.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function laneNames() {
  return Object.keys(LANES);
}

function normalizePath(file) {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

function orderedLanes(values) {
  const known = laneNames();
  return [...new Set(values)].sort((a, b) => known.indexOf(a) - known.indexOf(b));
}

function laneOwnershipForFile(file) {
  const owners = [];
  for (const [lane, config] of Object.entries(LANES)) {
    if ([...(config.checks || []), ...(config.tests || [])].includes(file)) {
      owners.push(lane);
    }
  }
  return owners;
}

export function classifyPaths(paths) {
  const lanes = new Set();
  const classifications = [];
  const unmatched = [];

  for (const rawPath of paths) {
    const file = normalizePath(String(rawPath || '').trim());
    if (!file) continue;

    const matched = [];
    const laneOwned = laneOwnershipForFile(file);
    if (laneOwned.length) {
      for (const lane of laneOwned) lanes.add(lane);
      matched.push({
        id: 'lane-owned-test-or-check',
        lanes: orderedLanes(laneOwned)
      });
    }

    for (const rule of FILE_LANE_RULES) {
      if (rule.patterns.some(pattern => pattern.test(file))) {
        for (const lane of rule.lanes) lanes.add(lane);
        matched.push({
          id: rule.id,
          lanes: orderedLanes(rule.lanes)
        });
      }
    }

    if (matched.length) {
      classifications.push({ file, matched });
    } else {
      unmatched.push(file);
    }
  }

  return {
    lanes: orderedLanes(lanes),
    classifications,
    unmatched
  };
}

export function validateLaneFiles() {
  const missing = [];
  for (const [lane, config] of Object.entries(LANES)) {
    for (const file of [...(config.checks || []), ...(config.tests || [])]) {
      if (!fs.existsSync(path.join(repoRoot, file))) {
        missing.push(`${lane}:${file}`);
      }
    }
  }
  return missing;
}

export function auditProofRequirement(result) {
  const auditProofFiles = [];
  const proofRelevantFiles = [];
  const auditProofLanes = new Set();
  const proofRelevantLanes = new Set();

  for (const entry of result.classifications) {
    const entryLanes = entry.matched
      .flatMap(rule => rule.lanes)
      .filter(lane => lane !== NON_PROOF_LANE);

    if (AUDIT_PROOF_PATH_PATTERN.test(entry.file)) {
      auditProofFiles.push(entry.file);
      for (const lane of entryLanes) auditProofLanes.add(lane);
    } else if (!RUNTIME_TEST_PROOF_PATH_PATTERN.test(entry.file)) {
      proofRelevantFiles.push(entry.file);
      for (const lane of entryLanes) proofRelevantLanes.add(lane);
    }
  }

  const sharedProofLanes = orderedLanes(
    [...proofRelevantLanes].filter(lane => auditProofLanes.has(lane))
  );

  return {
    auditProofFiles,
    proofRelevantFiles,
    auditProofLanes: orderedLanes(auditProofLanes),
    proofRelevantLanes: orderedLanes(proofRelevantLanes),
    sharedProofLanes,
    missing: proofRelevantFiles.length > 0 && auditProofFiles.length === 0,
    irrelevant:
      proofRelevantFiles.length > 0 &&
      auditProofFiles.length > 0 &&
      proofRelevantLanes.size > 0 &&
      sharedProofLanes.length === 0
  };
}

export function runtimeFixtureRequirement(result) {
  const runtimeRelevantFiles = [];
  const runtimeProofFiles = [];
  const runtimeRelevantLanes = new Set();
  const runtimeProofLanes = new Set();

  for (const entry of result.classifications) {
    const entryLanes = entry.matched
      .flatMap(rule => rule.lanes)
      .filter(lane => Object.hasOwn(RUNTIME_FIXTURE_LANE_REASONS, lane));

    if (!entryLanes.length) continue;

    if (RUNTIME_FIXTURE_PROOF_PATH_PATTERN.test(entry.file)) {
      runtimeProofFiles.push(entry.file);
      for (const lane of entryLanes) runtimeProofLanes.add(lane);
    } else if (!AUDIT_PROOF_PATH_PATTERN.test(entry.file)) {
      runtimeRelevantFiles.push(entry.file);
      for (const lane of entryLanes) runtimeRelevantLanes.add(lane);
    }
  }

  const sharedRuntimeProofLanes = orderedLanes(
    [...runtimeRelevantLanes].filter(lane => runtimeProofLanes.has(lane))
  );

  return {
    runtimeRelevantFiles,
    runtimeProofFiles,
    runtimeRelevantLanes: orderedLanes(runtimeRelevantLanes),
    runtimeProofLanes: orderedLanes(runtimeProofLanes),
    sharedRuntimeProofLanes,
    missing: runtimeRelevantFiles.length > 0 && runtimeProofFiles.length === 0,
    irrelevant:
      runtimeRelevantFiles.length > 0 &&
      runtimeProofFiles.length > 0 &&
      runtimeRelevantLanes.size > 0 &&
      sharedRuntimeProofLanes.length === 0
  };
}

export function gitLines(args, spawn = spawnSync) {
  const result = spawn('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    const detail = String(result.stderr || result.error?.message || '').trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

export function changedPathsFromGit(gitLineReader = gitLines) {
  return [
    ...gitLineReader(['diff', '--name-only', 'HEAD', '--']),
    ...gitLineReader(['ls-files', '--others', '--exclude-standard'])
  ];
}

export function newChangedPaths(initialPaths, currentPaths) {
  const initial = new Set(
    initialPaths.map(pathName => normalizePath(String(pathName || '').trim())).filter(Boolean)
  );
  return [
    ...new Set(currentPaths.map(pathName => normalizePath(String(pathName || '').trim())).filter(Boolean))
  ].filter(pathName => !initial.has(pathName)).sort();
}

function snapshotFileContent(file) {
  const fullPath = path.join(repoRoot, file);
  if (!fs.existsSync(fullPath)) return 'missing';
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) return `non-file:${stat.mode}:${stat.size}`;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

export function changedPathContentSnapshot(paths, snapshotReader = snapshotFileContent) {
  const snapshot = new Map();
  for (const pathName of paths) {
    const file = normalizePath(String(pathName || '').trim());
    if (file) snapshot.set(file, snapshotReader(file));
  }
  return snapshot;
}

export function changedPathsWithSnapshotDrift(snapshot, snapshotReader = snapshotFileContent) {
  const drifted = [];
  for (const [file, before] of snapshot.entries()) {
    if (snapshotReader(file) !== before) drifted.push(file);
  }
  return drifted.sort();
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (typeof result.status === 'number') return result.status;
  if (result.signal) return 1;
  return 1;
}

function formatLaneList(lanes) {
  return lanes.length ? lanes.map(lane => `test:${lane}`).join(', ') : 'none';
}

function runLane(lane) {
  const config = LANES[lane];
  if (!config) {
    console.error(`Unknown test lane "${lane}".`);
    console.error(`Known lanes: ${laneNames().join(', ')}`);
    return 1;
  }

  const missing = validateLaneFiles().filter(item => item.startsWith(`${lane}:`));
  if (missing.length) {
    console.error(`Missing files for ${lane}:`);
    for (const item of missing) console.error(`- ${item.slice(lane.length + 1)}`);
    return 1;
  }

  for (const file of config.checks || []) {
    const status = runNode(['--check', file]);
    if (status !== 0) return status;
  }

  return runNode(['--test', ...config.tests]);
}

function runAuditDrift() {
  return runNode(['scripts/audit-proof-drift.mjs', '--lane-owned']);
}

function printClassification(result) {
  if (!result.classifications.length && !result.unmatched.length) {
    console.log('No changed paths to classify.');
    return;
  }

  if (result.lanes.length) {
    console.log('Required lane commands:');
    for (const lane of result.lanes) console.log(`  npm run test:${lane}`);
  } else {
    console.log('Required lane commands: none');
  }

  const manualSmokeReasons = [];
  for (const lane of result.lanes) {
    if (Object.hasOwn(MANUAL_YOUTUBE_SMOKE_LANE_REASONS, lane)) {
      manualSmokeReasons.push([lane, MANUAL_YOUTUBE_SMOKE_LANE_REASONS[lane]]);
    }
  }

  if (manualSmokeReasons.length) {
    console.log('\nManual YouTube smoke required when user-facing:');
    for (const [lane, reason] of manualSmokeReasons) {
      console.log(`  test:${lane}: ${reason}`);
    }
    console.log('  Live smoke artifact handoff:');
    console.log(`    runner: ${LIVE_SMOKE_RUNNER_COMMAND}`);
    console.log(`    verify: ${LIVE_SMOKE_VERIFY_COMMAND}`);
    console.log(`    template: ${LIVE_SMOKE_ARTIFACT_TEMPLATE}`);
    console.log(`    verifier: ${LIVE_SMOKE_ARTIFACT_VERIFIER}`);
    console.log(`    changeContext env: ${LIVE_SMOKE_CHANGE_CONTEXT_ENV.join(', ')}`);
    console.log(`    required rows: ${LIVE_SMOKE_REQUIRED_ROWS.join(', ')}`);
  }

  const {
    auditProofFiles,
    proofRelevantFiles,
    proofRelevantLanes,
    auditProofLanes,
    sharedProofLanes,
    missing,
    irrelevant
  } = auditProofRequirement(result);

  if (auditProofFiles.length) {
    console.log('\nAudit proof files in this change:');
    for (const file of auditProofFiles) console.log(`  ${file}`);
    if (proofRelevantFiles.length) {
      if (sharedProofLanes.length) {
        console.log(`  Shared proof lane(s): ${formatLaneList(sharedProofLanes)}`);
      } else if (irrelevant) {
        console.log('  Audit proof relevance mismatch:');
        console.log(`    touched lane(s): ${formatLaneList(proofRelevantLanes)}`);
        console.log(`    proof lane(s): ${formatLaneList(auditProofLanes)}`);
        console.log('    test:changed will fail until docs/audit proof shares a non-smoke lane with the touched files.');
      }
    }
  } else if (proofRelevantFiles.length) {
    console.log('\nAudit proof update expected before commit:');
    console.log('  Add or update a relevant docs/audit/ proof file for:');
    for (const file of proofRelevantFiles) console.log(`  - ${file}`);
    if (missing) {
      console.log('  test:changed will fail until this logical change includes docs/audit proof.');
    }
  }

  const runtimeFixture = runtimeFixtureRequirement(result);
  const runtimeFixtureReasons = [];
  for (const lane of runtimeFixture.runtimeRelevantLanes) {
    runtimeFixtureReasons.push([lane, RUNTIME_FIXTURE_LANE_REASONS[lane]]);
  }

  if (runtimeFixture.runtimeProofFiles.length) {
    console.log('\nRuntime fixture/test proof files in this change:');
    for (const file of runtimeFixture.runtimeProofFiles) console.log(`  ${file}`);
    if (runtimeFixture.runtimeRelevantFiles.length) {
      if (runtimeFixture.sharedRuntimeProofLanes.length) {
        console.log(`  Shared runtime proof lane(s): ${formatLaneList(runtimeFixture.sharedRuntimeProofLanes)}`);
      } else if (runtimeFixture.irrelevant) {
        console.log('  Runtime fixture/test proof relevance mismatch:');
        console.log(`    touched runtime lane(s): ${formatLaneList(runtimeFixture.runtimeRelevantLanes)}`);
        console.log(`    proof runtime lane(s): ${formatLaneList(runtimeFixture.runtimeProofLanes)}`);
        console.log('    test:changed will fail until runtime proof shares a touched runtime lane.');
      }
    }
  }

  if (runtimeFixtureReasons.length) {
    console.log('\nRuntime fixture proof expected when behavior changes:');
    for (const [lane, reason] of runtimeFixtureReasons) {
      console.log(`  test:${lane}: ${reason}`);
    }
    if (runtimeFixture.missing) {
      console.log('  No runtime fixture/test proof file changed; refactor-only changes must be covered by the passing lane.');
    }
  }

  if (result.classifications.length) {
    console.log('\nMatched paths:');
    for (const entry of result.classifications) {
      const ruleText = entry.matched
        .map(rule => `${rule.id} -> ${rule.lanes.map(lane => `test:${lane}`).join(', ')}`)
        .join('; ');
      console.log(`  ${entry.file}: ${ruleText}`);
    }
  }

  if (result.unmatched.length) {
    console.log('\nUnmatched paths requiring explicit lane classification:');
    for (const file of result.unmatched) console.log(`  ${file}`);
  }
}

function printList() {
  for (const [name, config] of Object.entries(LANES)) {
    console.log(`${name}: ${config.description}`);
    if (config.checks?.length) console.log(`  checks: ${config.checks.join(', ')}`);
    console.log(`  tests: ${config.tests.length}`);
  }
}

function main() {
  const lane = process.argv[2];

  if (lane === '--classify' || lane === 'classify') {
    const result = classifyPaths(process.argv.slice(3));
    printClassification(result);
    process.exit(result.unmatched.length ? 2 : 0);
  }

  if (lane === '--changed' || lane === 'changed') {
    const result = classifyPaths(changedPathsFromGit());
    printClassification(result);
    process.exit(result.unmatched.length ? 2 : 0);
  }

  if (lane === '--run-changed' || lane === 'run-changed') {
    const initialChangedPaths = changedPathsFromGit();
    const initialChangedSnapshot = changedPathContentSnapshot(initialChangedPaths);
    const result = classifyPaths(initialChangedPaths);
    printClassification(result);
    if (result.unmatched.length) process.exit(2);
    const auditProof = auditProofRequirement(result);
    if (auditProof.missing) process.exit(3);
    if (auditProof.irrelevant) process.exit(4);
    const runtimeFixture = runtimeFixtureRequirement(result);
    if (runtimeFixture.irrelevant) process.exit(6);
    if (!result.lanes.length) {
      console.log('\nNo changed lanes to run.');
      process.exit(0);
    }

    console.log('\n==> Running test:audit-drift');
    const driftStatus = runAuditDrift();
    if (driftStatus !== 0) process.exit(driftStatus);

    for (const changedLane of result.lanes) {
      console.log(`\n==> Running test:${changedLane}`);
      const status = runLane(changedLane);
      if (status !== 0) process.exit(status);
    }

    const modifiedInitialPaths = changedPathsWithSnapshotDrift(initialChangedSnapshot);
    if (modifiedInitialPaths.length) {
      console.error('\ntest:changed modified initially changed paths:');
      for (const file of modifiedInitialPaths) console.error(`- ${file}`);
      process.exit(7);
    }

    const extraDirtyPaths = newChangedPaths(initialChangedPaths, changedPathsFromGit());
    if (extraDirtyPaths.length) {
      console.error('\ntest:changed left additional dirty paths:');
      for (const file of extraDirtyPaths) console.error(`- ${file}`);
      process.exit(5);
    }

    process.exit(0);
  }

  if (!lane || lane === '--list' || lane === 'list') {
    printList();
    process.exit(lane ? 0 : 1);
  }

  process.exit(runLane(lane));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(8);
  }
}
