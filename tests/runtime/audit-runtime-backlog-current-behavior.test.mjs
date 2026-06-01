import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const backlogPath = 'docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md';
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const testPath = 'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('audit runtime backlog remains explicit and outside release-lane completion claims', () => {
  const doc = read(backlogPath);
  const matrix = read(matrixPath);

  assert.match(doc, /Status: broad audit backlog, not a release-lane gate/);
  assert.match(doc, /node --test --test-reporter=tap tests\/runtime\/\*\.test\.mjs > \/tmp\/filtertube-runtime\.tap 2>&1/);
  assert.match(doc, /tests: 4727/);
  assert.match(doc, /pass: 4591/);
  assert.match(doc, /fail: 136/);
  assert.match(doc, /duration_ms: 40287\.160708/);
  assert.match(doc, /node scripts\/audit-proof-drift\.mjs --all --report-only/);
  assert.match(doc, /no stale source fingerprint proof rows/);
  assert.match(doc, /The focused release lanes are the per-change proof system/);
  assert.match(doc, /not clean enough to be treated as a release blocker today/);

  assert.match(matrix, new RegExp(backlogPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(matrix, /full historical runtime audit/);
  assert.match(matrix, /broad backlog suite, not the default per-change release lane/);
  assert.match(matrix, /audit:runtime` stays the inventory to retire or refresh/);
});

test('audit runtime backlog names the broad failure clusters that still require smaller proof batches', () => {
  const doc = read(backlogPath);
  const requiredClusters = [
    'Callable, source-locus, and index drift',
    'Audit goal and completion ledgers',
    'Docs/audit boundary, packaging, and generated artifacts',
    'Settings and content-control registers',
    'DOM selector, hide, and lifecycle registers',
    'JSON comment continuation and provenance registers',
    'JSON content-control hide boundary registers',
    'JSON-first renderer, reference, metric, and video-meta registers',
    'YTM and YouTube Music parity slices'
  ];
  const requiredLanes = [
    'test:release',
    'test:whitelist',
    'test:blocking',
    'test:json',
    'test:dom',
    'test:menu',
    'test:performance',
    'test:settings',
    'test:smoke',
    'test:audit-drift'
  ];

  for (const cluster of requiredClusters) {
    assert.ok(doc.includes(cluster), `missing broad audit failure cluster: ${cluster}`);
  }

  for (const lane of requiredLanes) {
    assert.ok(doc.includes(lane), `missing focused lane decision: ${lane}`);
  }

  assert.match(doc, /compiled-settings-field-register` has been refreshed and promoted into `test:settings`/);
  assert.match(doc, /content-control-active-work-matrix` has been refreshed and promoted into `test:performance`/);
  assert.match(doc, /content-control alias mutation still needs refreshed source\/effect rows/);
});

test('smoke lane keeps the broad audit backlog boundary visible', () => {
  assert.ok(
    LANES.smoke.tests.includes(testPath),
    `${testPath} must stay in test:smoke while audit:runtime remains a backlog gate`
  );
});
