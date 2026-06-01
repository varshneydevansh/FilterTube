import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const self = 'tests/runtime/test-lane-workflow-large-file-release-current-behavior.test.mjs';
const workflowLineLimit = 1000;
const workflowFiles = Object.freeze([
  'scripts/run-test-lane.mjs',
  'scripts/test-lane-config.mjs',
  'scripts/audit-proof-drift.mjs',
  'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
  self
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(file) {
  const text = read(file);
  if (!text) return 0;
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

test('lane workflow files split before crossing the 1000-line boundary', () => {
  for (const file of workflowFiles) {
    assert.ok(
      lineCount(file) < workflowLineLimit,
      `${file} has reached ${lineCount(file)} lines; split it before adding more workflow behavior`
    );
  }
});

test('lane workflow large-file guard runs in release, performance, and smoke lanes', () => {
  assert.ok(LANES.release.tests.includes(self));
  assert.ok(LANES.performance.tests.includes(self));
  assert.ok(LANES.smoke.tests.includes(self));

  const classification = classifyPaths([self]);

  assert.deepEqual(classification.unmatched, []);
  assert.ok(classification.lanes.includes('release'));
  assert.ok(classification.lanes.includes('performance'));
  assert.ok(classification.lanes.includes('smoke'));
  assert.ok(
    classification.classifications[0].matched.some(match => match.id === 'runtime-code-burden-test')
  );
});

test('test lane matrix documents the workflow file-size boundary', () => {
  const matrix = read(matrixPath);

  assert.match(matrix, /lane workflow file-size guard/);
  assert.match(matrix, /workflow-owned lane files below 1000 lines/);
  assert.match(matrix, /split the matrix or runner proof before adding more assertions/);
});
