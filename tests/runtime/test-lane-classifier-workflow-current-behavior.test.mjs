import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditProofRequirement,
  changedPathContentSnapshot,
  changedPathsFromGit,
  changedPathsWithSnapshotDrift,
  classifyPaths,
  gitLines,
  newChangedPaths,
  runtimeFixtureRequirement
} from '../../scripts/run-test-lane.mjs';
import { collectProofDrift, laneOwnedProofFiles } from '../../scripts/audit-proof-drift.mjs';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('changed-lane runner is wired to the classifier and sequential lane execution', () => {
  const runner = read('scripts/run-test-lane.mjs');
  const config = read('scripts/test-lane-config.mjs');
  const matrix = read(matrixPath);

  assert.match(config, /id: 'lane-workflow-surface'/);
  assert.match(config, /run-test-lane\|test-lane-config\|audit-proof-drift/);
  assert.match(runner, /gitLineReader\(\['diff', '--name-only', 'HEAD', '--'\]\)/);
  assert.match(runner, /gitLineReader\(\['ls-files', '--others', '--exclude-standard'\]\)/);
  assert.match(runner, /throw new Error\(`git \$\{args\.join\(' '\)\} failed/);
  assert.match(runner, /console\.error\(error instanceof Error \? error\.message : String\(error\)\)/);
  assert.match(runner, /process\.exit\(8\)/);
  assert.doesNotMatch(runner, /if \(result\.status !== 0\) return \[\]/);
  assert.doesNotMatch(runner, /--diff-filter=ACMRTUXB/);
  assert.match(runner, /if \(result\.signal\) return 1/);
  assert.match(runner, /lane === '--run-changed' \|\| lane === 'run-changed'/);
  assert.match(runner, /const initialChangedPaths = changedPathsFromGit\(\)/);
  assert.match(runner, /const initialChangedSnapshot = changedPathContentSnapshot\(initialChangedPaths\)/);
  assert.match(runner, /const result = classifyPaths\(initialChangedPaths\)/);
  assert.match(runner, /const modifiedInitialPaths = changedPathsWithSnapshotDrift\(initialChangedSnapshot\)/);
  assert.match(runner, /test:changed modified initially changed paths/);
  assert.match(runner, /process\.exit\(7\)/);
  assert.match(runner, /const extraDirtyPaths = newChangedPaths\(initialChangedPaths, changedPathsFromGit\(\)\)/);
  assert.match(runner, /test:changed left additional dirty paths/);
  assert.match(runner, /process\.exit\(5\)/);
  assert.match(runner, /if \(result\.unmatched\.length\) process\.exit\(2\)/);
  assert.match(runner, /MANUAL_YOUTUBE_SMOKE_LANE_REASONS/);
  assert.match(runner, /Manual YouTube smoke required when user-facing/);
  assert.match(runner, /LIVE_SMOKE_ARTIFACT_TEMPLATE/);
  assert.match(runner, /LIVE_SMOKE_RUNNER_COMMAND/);
  assert.match(runner, /LIVE_SMOKE_VERIFY_COMMAND/);
  assert.match(runner, /LIVE_SMOKE_ARTIFACT_VERIFIER/);
  assert.match(runner, /LIVE_SMOKE_REQUIRED_ROWS/);
  assert.match(runner, /Live smoke artifact handoff/);
  assert.match(runner, /RUNTIME_FIXTURE_LANE_REASONS/);
  assert.match(runner, /function runtimeFixtureRequirement\(result\)/);
  assert.match(runner, /Runtime fixture\/test proof files in this change/);
  assert.match(runner, /Runtime fixture\/test proof relevance mismatch/);
  assert.match(runner, /sharedRuntimeProofLanes/);
  assert.match(runner, /Runtime fixture proof expected when behavior changes/);
  assert.match(runner, /AUDIT_PROOF_PATH_PATTERN/);
  assert.match(runner, /function auditProofRequirement\(result\)/);
  assert.match(runner, /Audit proof update expected before commit/);
  assert.match(runner, /Audit proof files in this change/);
  assert.match(runner, /Audit proof relevance mismatch/);
  assert.match(runner, /sharedProofLanes/);
  assert.match(runner, /function formatLaneList\(lanes\)/);
  assert.match(runner, /if \(auditProof\.missing\) process\.exit\(3\)/);
  assert.match(runner, /if \(auditProof\.irrelevant\) process\.exit\(4\)/);
  assert.match(runner, /const runtimeFixture = runtimeFixtureRequirement\(result\)/);
  assert.match(runner, /if \(runtimeFixture\.irrelevant\) process\.exit\(6\)/);
  assert.match(runner, /function runAuditDrift\(\)/);
  assert.match(runner, /runNode\(\['scripts\/audit-proof-drift\.mjs', '--lane-owned'\]\)/);
  assert.match(runner, /console\.log\('\\n==> Running test:audit-drift'\)/);
  assert.match(runner, /const driftStatus = runAuditDrift\(\)/);
  assert.match(runner, /for \(const changedLane of result\.lanes\)/);
  assert.match(runner, /runLane\(changedLane\)/);
  assert.match(runner, /process\.exit\(runLane\(lane\)\)/);
  assert.match(matrix, /fails on any unclassified\s+changed path/);
  assert.match(matrix, /runs the\s+lane-owned audit\s+proof drift guard/);
  assert.match(matrix, /runs\s+the required lanes sequentially in\s+matrix order/);
  assert.match(matrix, /Changed-path discovery is fail-closed/);
  assert.match(matrix, /instead of treating the workspace as\s+clean/);
  assert.match(matrix, /fails if focused lane execution leaves additional\s+tracked or unignored dirty paths/);
  assert.match(matrix, /lane execution mutates any initially changed file after classification/);
  assert.match(matrix, /build\/test helpers that rewrite the same\s+files being committed/);
  assert.match(matrix, /prints a manual YouTube\s+smoke advisory/);
  assert.match(
    matrix,
    /includes the npm runner command, npm verifier command, structured\s+live-smoke template, lower-level verifier command, and required SPA row ids/
  );
  assert.match(matrix, /reports whether a changed\s+`docs\/audit\/` proof file is present/);
  assert.match(matrix, /fails\s+when source, release, asset, or product-doc paths changed without a matching\s+`docs\/audit\/` proof file/);
  assert.match(matrix, /fails when changed\s+`docs\/audit\/` proof does not share\s+at least one non-smoke lane/);
  assert.match(matrix, /prints a fixture-proof reminder\s+for the affected runtime lanes/);
  assert.match(matrix, /reports whether changed runtime fixture\/test files share\s+at least one touched runtime lane/);
  assert.match(matrix, /Missing fixture edits are not a hard\s+`test:changed` failure/);
  assert.match(matrix, /if a runtime fixture\/test file is\s+changed and it does not share any touched runtime lane, `npm run test:changed`\s+fails before running lanes/);
});

test('changed-lane path collection includes untracked nonignored files', () => {
  const calls = [];
  const changedPaths = changedPathsFromGit(args => {
    calls.push(args);
    if (args[0] === 'diff') return ['js/seed.js'];
    if (args[0] === 'ls-files') {
      return ['docs/audit/FILTERTUBE_LANE_CHANGED_PROBE_2026-06-01.md'];
    }
    return [];
  });
  const result = classifyPaths(changedPaths);

  assert.deepEqual(calls, [
    ['diff', '--name-only', 'HEAD', '--'],
    ['ls-files', '--others', '--exclude-standard']
  ]);
  assert.deepEqual(changedPaths, [
    'js/seed.js',
    'docs/audit/FILTERTUBE_LANE_CHANGED_PROBE_2026-06-01.md'
  ]);
  assert.deepEqual(result.lanes, ['json', 'performance', 'smoke']);
  assert.deepEqual(result.unmatched, []);
});

test('changed-lane path collection fails closed on git discovery errors', () => {
  assert.throws(
    () => gitLines(['diff', '--name-only', 'HEAD', '--'], () => ({
      status: 128,
      stderr: 'fatal: not a git repository\n',
      stdout: ''
    })),
    /git diff --name-only HEAD -- failed: fatal: not a git repository/
  );
});

test('changed-lane dirty path guard reports only additional tracked or unignored paths', () => {
  const extra = newChangedPaths(
    ['js/seed.js', './docs/audit/TEST_LANE_MATRIX.md', ''],
    [
      'docs/audit/TEST_LANE_MATRIX.md',
      'js/seed.js',
      './tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      ' docs/audit/FILTERTUBE_EXTRA_PROOF_2026-06-01.md '
    ]
  );

  assert.deepEqual(extra, [
    'docs/audit/FILTERTUBE_EXTRA_PROOF_2026-06-01.md',
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
  ]);
});

test('changed-lane dirty path guard reports initially changed path mutation', () => {
  const snapshot = changedPathContentSnapshot(
    ['js/seed.js', './docs/audit/TEST_LANE_MATRIX.md', '', 'js/seed.js'],
    file => `before:${file}`
  );

  const drifted = changedPathsWithSnapshotDrift(snapshot, file => (
    file === 'docs/audit/TEST_LANE_MATRIX.md'
      ? `after:${file}`
      : `before:${file}`
  ));

  assert.deepEqual([...snapshot.keys()], ['js/seed.js', 'docs/audit/TEST_LANE_MATRIX.md']);
  assert.deepEqual(drifted, ['docs/audit/TEST_LANE_MATRIX.md']);
});

test('classifier output surfaces manual YouTube smoke for user-facing runtime and release lanes', () => {
  const runtime = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'js/seed.js'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(runtime.status, 0, runtime.stderr);
  assert.match(runtime.stdout, /Required lane commands:/);
  assert.match(runtime.stdout, /npm run test:json/);
  assert.match(runtime.stdout, /npm run test:performance/);
  assert.match(runtime.stdout, /Manual YouTube smoke required when user-facing:/);
  assert.match(runtime.stdout, /test:json: JSON-first filtering/);
  assert.match(runtime.stdout, /test:performance: empty-rule\/no-work/);
  assert.match(runtime.stdout, /Live smoke artifact handoff:/);
  assert.match(runtime.stdout, /runner: npm run smoke:youtube/);
  assert.match(
    runtime.stdout,
    /verify: npm run smoke:youtube:verify -- docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/<artifact>\.json/
  );
  assert.match(runtime.stdout, /template: docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json/);
  assert.match(runtime.stdout, /verifier: node docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/verify-live-smoke-artifact\.mjs docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/<artifact>\.json/);
  assert.match(runtime.stdout, /changeContext env: FILTERTUBE_LOGICAL_CHANGE_TYPE, FILTERTUBE_REQUIRED_LANES, FILTERTUBE_AUTOMATED_PROOF_COMMAND, FILTERTUBE_AUTOMATED_PROOF_STATUS=passed, FILTERTUBE_AUTOMATED_PROOF_SUMMARY, FILTERTUBE_AUTOMATED_PROOF_LANES/);
  assert.match(runtime.stdout, /FT-LIVE-SPA-00-home-to-search/);
  assert.match(runtime.stdout, /FT-LIVE-SPA-05-cache-repeat-navigation/);
  assert.match(runtime.stdout, /Audit proof update expected before commit:/);
  assert.match(runtime.stdout, /Add or update a relevant docs\/audit\/ proof file for:/);
  assert.match(runtime.stdout, /- js\/seed\.js/);
  assert.match(runtime.stdout, /Runtime fixture proof expected when behavior changes:/);
  assert.match(runtime.stdout, /test:json: JSON renderer, endpoint, response, or no-work fixtures/);
  assert.match(runtime.stdout, /test:performance: empty-rule\/no-work, SPA, timer, observer, or cache fixtures/);
  assert.match(runtime.stdout, /No runtime fixture\/test proof file changed/);

  const releaseOnly = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'README.md'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(releaseOnly.status, 0, releaseOnly.stderr);
  assert.match(releaseOnly.stdout, /Manual YouTube smoke required when user-facing:/);
  assert.match(releaseOnly.stdout, /test:release: release packaging, public claims, installed-extension parity, and artifact handoff behavior/);
  assert.match(releaseOnly.stdout, /Live smoke artifact handoff:/);
  assert.match(releaseOnly.stdout, /runner: npm run smoke:youtube/);
  assert.match(releaseOnly.stdout, /verify: npm run smoke:youtube:verify/);
  assert.doesNotMatch(releaseOnly.stdout, /Runtime fixture proof expected when behavior changes:/);
});

test('classifier output surfaces runtime fixture proof lane relevance', () => {
  const matchingProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(matchingProof.status, 0, matchingProof.stderr);
  assert.match(matchingProof.stdout, /Runtime fixture\/test proof files in this change:/);
  assert.match(matchingProof.stdout, /tests\/runtime\/seed-network-current-behavior\.test\.mjs/);
  assert.match(matchingProof.stdout, /Shared runtime proof lane\(s\): test:json/);
  assert.doesNotMatch(matchingProof.stdout, /Runtime fixture\/test proof relevance mismatch:/);

  const mismatchedProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(mismatchedProof.status, 0, mismatchedProof.stderr);
  assert.match(mismatchedProof.stdout, /Runtime fixture\/test proof relevance mismatch:/);
  assert.match(mismatchedProof.stdout, /touched runtime lane\(s\): test:json, test:performance/);
  assert.match(mismatchedProof.stdout, /proof runtime lane\(s\): test:blocking/);
  assert.match(mismatchedProof.stdout, /test:changed will fail until runtime proof shares a touched runtime lane/);
});

test('classifier output recognizes changed audit proof files', () => {
  const proof = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'docs/audit/TEST_LANE_MATRIX.md'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(proof.status, 0, proof.stderr);
  assert.match(proof.stdout, /Audit proof files in this change:/);
  assert.match(proof.stdout, /docs\/audit\/TEST_LANE_MATRIX\.md/);
  assert.doesNotMatch(proof.stdout, /Audit proof update expected before commit:/);
  assert.doesNotMatch(proof.stdout, /Runtime fixture proof expected when behavior changes:/);

  const mismatchedProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(mismatchedProof.status, 0, mismatchedProof.stderr);
  assert.match(mismatchedProof.stdout, /Audit proof relevance mismatch:/);
  assert.match(mismatchedProof.stdout, /touched lane\(s\): test:json, test:performance/);
  assert.match(mismatchedProof.stdout, /proof lane\(s\): test:blocking/);
  assert.match(mismatchedProof.stdout, /test:changed will fail until docs\/audit proof shares a non-smoke lane/);
});

test('changed-lane audit proof gate distinguishes proof-only and product changes', () => {
  const sourceOnly = auditProofRequirement(classifyPaths(['js/seed.js']));
  assert.deepEqual(sourceOnly.auditProofFiles, []);
  assert.deepEqual(sourceOnly.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceOnly.auditProofLanes, []);
  assert.deepEqual(sourceOnly.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceOnly.sharedProofLanes, []);
  assert.equal(sourceOnly.missing, true);
  assert.equal(sourceOnly.irrelevant, false);

  const sourceWithProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_JSON_TEST_LANE_PROOF_GATE_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_JSON_TEST_LANE_PROOF_GATE_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithProof.auditProofLanes, ['json']);
  assert.deepEqual(sourceWithProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithProof.sharedProofLanes, ['json']);
  assert.equal(sourceWithProof.missing, false);
  assert.equal(sourceWithProof.irrelevant, false);

  const sourceWithIrrelevantProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithIrrelevantProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithIrrelevantProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithIrrelevantProof.auditProofLanes, ['blocking']);
  assert.deepEqual(sourceWithIrrelevantProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithIrrelevantProof.sharedProofLanes, []);
  assert.equal(sourceWithIrrelevantProof.missing, false);
  assert.equal(sourceWithIrrelevantProof.irrelevant, true);

  const sourceWithGenericProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_GENERAL_NOTE_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithGenericProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_GENERAL_NOTE_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithGenericProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithGenericProof.auditProofLanes, []);
  assert.deepEqual(sourceWithGenericProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithGenericProof.sharedProofLanes, []);
  assert.equal(sourceWithGenericProof.missing, false);
  assert.equal(sourceWithGenericProof.irrelevant, true);

  const testOnly = auditProofRequirement(classifyPaths([
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
  ]));
  assert.deepEqual(testOnly.auditProofFiles, []);
  assert.deepEqual(testOnly.proofRelevantFiles, []);
  assert.deepEqual(testOnly.auditProofLanes, []);
  assert.deepEqual(testOnly.proofRelevantLanes, []);
  assert.deepEqual(testOnly.sharedProofLanes, []);
  assert.equal(testOnly.missing, false);
  assert.equal(testOnly.irrelevant, false);
});

test('runtime fixture proof gate distinguishes missing matching and unrelated proof', () => {
  const sourceOnly = runtimeFixtureRequirement(classifyPaths(['js/seed.js']));
  assert.deepEqual(sourceOnly.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceOnly.runtimeProofFiles, []);
  assert.deepEqual(sourceOnly.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceOnly.runtimeProofLanes, []);
  assert.deepEqual(sourceOnly.sharedRuntimeProofLanes, []);
  assert.equal(sourceOnly.missing, true);
  assert.equal(sourceOnly.irrelevant, false);

  const sourceWithProof = runtimeFixtureRequirement(classifyPaths([
    'js/seed.js',
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ]));
  assert.deepEqual(sourceWithProof.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithProof.runtimeProofFiles, [
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ]);
  assert.deepEqual(sourceWithProof.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithProof.runtimeProofLanes, ['json']);
  assert.deepEqual(sourceWithProof.sharedRuntimeProofLanes, ['json']);
  assert.equal(sourceWithProof.missing, false);
  assert.equal(sourceWithProof.irrelevant, false);

  const sourceWithUnrelatedProof = runtimeFixtureRequirement(classifyPaths([
    'js/seed.js',
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ]));
  assert.deepEqual(sourceWithUnrelatedProof.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeProofFiles, [
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ]);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeProofLanes, ['blocking']);
  assert.deepEqual(sourceWithUnrelatedProof.sharedRuntimeProofLanes, []);
  assert.equal(sourceWithUnrelatedProof.missing, false);
  assert.equal(sourceWithUnrelatedProof.irrelevant, true);

  const releaseOnly = runtimeFixtureRequirement(classifyPaths(['README.md']));
  assert.deepEqual(releaseOnly.runtimeRelevantFiles, []);
  assert.deepEqual(releaseOnly.runtimeProofFiles, []);
  assert.deepEqual(releaseOnly.runtimeRelevantLanes, []);
  assert.deepEqual(releaseOnly.runtimeProofLanes, []);
  assert.deepEqual(releaseOnly.sharedRuntimeProofLanes, []);
  assert.equal(releaseOnly.missing, false);
  assert.equal(releaseOnly.irrelevant, false);
});

test('lane-owned audit proof fingerprints do not silently drift', () => {
  const matrix = read(matrixPath);
  const files = laneOwnedProofFiles();
  const drift = collectProofDrift({ scope: 'lane-owned' });

  assert.ok(files.includes('tests/runtime/test-lane-matrix-current-behavior.test.mjs'));
  assert.ok(files.includes('tests/runtime/test-lane-classifier-workflow-current-behavior.test.mjs'));
  assert.ok(files.includes('scripts/audit-proof-drift.mjs'));
  assert.ok(files.includes('scripts/test-lane-config.mjs'));
  assert.deepEqual(drift, []);
  assert.match(matrix, /full audit proof drift inventory/);
  assert.match(matrix, /4731` tests ran, `4610` passed, and `121` failed/);
  assert.match(matrix, /all-scope source fingerprint drift inventory is clean/);
  assert.match(matrix, /audit:runtime` stays the inventory to retire or refresh/);
});
