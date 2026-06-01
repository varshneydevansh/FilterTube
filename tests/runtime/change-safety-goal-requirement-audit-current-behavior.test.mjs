import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CHANGE_SAFETY_GOAL_REQUIREMENT_AUDIT_2026-06-01.md';
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function tableRowContaining(source, text) {
  const row = source.split('\n').find(line => line.startsWith('|') && line.includes(text));

  assert.ok(row, `missing table row containing ${text}`);
  return row;
}

test('change-safety requirement audit stays scoped to workflow proof', () => {
  const doc = read(docPath);
  const matrix = read(matrixPath);

  assert.match(doc, /Status: workflow proof, not broad runtime-audit completion/);
  assert.match(doc, /It does not claim that every historical runtime audit row is green/);
  assert.match(
    doc,
    /future behavior change is release-ready, or that a live installed YouTube smoke\s+pass has already been performed/
  );
  assert.match(doc, /## Requirement Verdicts/);
  assert.match(doc, /## Boundary/);
  assert.match(matrix, /## Current Boundary/);
  assert.match(matrix, /does not\s+claim full audit completion, full performance proof, or complete browser\/live\s+YouTube parity/);
  assert.match(doc, /FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01\.md/);
});

test('change-safety requirement audit covers every active goal deliverable', () => {
  const doc = read(docPath);
  const requiredRows = [
    'Keep audit proof files inside `docs/audit/`',
    'Turn confirmed risks into focused fixtures/tests',
    'Create `docs/audit/TEST_LANE_MATRIX.md`',
    'Define required test lanes by touched area',
    'Preserve blocklist, whitelist, keyword/channel blocking, Shorts, end screens, quick-block, 3-dot menus, JSON-first filtering, DOM fallback, no-rule performance, SPA navigation, settings, and release packaging',
    'Use the requested change flow',
    'Expose the requested lane commands',
    'Keep matrix examples executable',
    'Preserve the Done Means contract',
    'Keep manual YouTube smoke explicit without pretending automated fixtures prove live browser behavior'
  ];

  for (const rowLabel of requiredRows) {
    const row = tableRowContaining(doc, rowLabel);
    assert.match(row, /`GO_WORKFLOW/);
  }
});

test('change-safety requirement audit points at executable proof owners', () => {
  const doc = read(docPath);
  const proofOwners = [
    'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs',
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
    'tests/runtime/test-lane-visible-safety-current-behavior.test.mjs',
    'scripts/test-lane-config.mjs',
    'scripts/run-test-lane.mjs',
    'npm run smoke:youtube',
    'npm run smoke:youtube:verify'
  ];

  for (const owner of proofOwners) {
    assert.ok(doc.includes(owner), `requirement audit missing proof owner ${owner}`);
  }
});

test('package lane commands required by the active goal remain exposed', () => {
  const pkg = readJson('package.json');
  const requiredScripts = [
    'test:release',
    'test:whitelist',
    'test:blocking',
    'test:json',
    'test:dom',
    'test:menu',
    'test:performance',
    'test:settings',
    'test:smoke',
    'test:changed'
  ];

  for (const script of requiredScripts) {
    assert.ok(pkg.scripts[script], `package.json missing ${script}`);
  }
});

test('goal requirement audit stays in smoke lane and docs/audit boundary', () => {
  const classification = classifyPaths([docPath]);

  assert.deepEqual(classification.unmatched, []);
  assert.deepEqual(classification.lanes, ['smoke']);
  assert.ok(
    LANES.smoke.tests.includes('tests/runtime/change-safety-goal-requirement-audit-current-behavior.test.mjs'),
    'change-safety requirement audit test must stay in smoke lane'
  );
});
