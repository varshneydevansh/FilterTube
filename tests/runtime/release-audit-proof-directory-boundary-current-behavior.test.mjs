import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_AUDIT_PROOF_DIRECTORY_BOUNDARY_CURRENT_BEHAVIOR_2026-06-01.md';
const testPath = 'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs';
const proofStyleNamePattern = /(?:^FILTERTUBE_|_CURRENT_BEHAVIOR_|_(?:AUTHORITY|BOUNDARY|REGISTER|LEDGER|GAP|MATRIX|INVENTORY)_)/;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function trackedMarkdownFiles() {
  return git(['ls-files'])
    .filter(file => file.endsWith('.md'))
    .sort();
}

test('release audit proof directory boundary is documented and lane-owned', () => {
  const doc = read(docPath);
  const matrix = read('docs/audit/TEST_LANE_MATRIX.md');

  for (const phrase of [
    'Audit proof belongs under `docs/audit/`',
    'tracked proof-style Markdown files must live under `docs/audit/`',
    '`tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs`',
    'This sentinel is owned by `test:release` and `test:smoke`',
    'Do not weaken the rule by silently allowing proof-style docs outside'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }

  assert.ok(matrix.includes('audit proof directory boundary'));
  assert.ok(LANES.release.tests.includes(testPath));
  assert.ok(LANES.smoke.tests.includes(testPath));
  assert.deepEqual(classifyPaths([docPath]).lanes, ['release', 'smoke']);
  assert.deepEqual(classifyPaths([testPath]).lanes, ['release', 'smoke']);
});

test('tracked proof-style markdown files stay inside docs/audit', () => {
  const misplacedProofDocs = trackedMarkdownFiles()
    .filter(file => !file.startsWith('docs/audit/'))
    .filter(file => proofStyleNamePattern.test(path.basename(file)));

  assert.deepEqual(misplacedProofDocs, []);
});

test('top-level product docs can reference audit proof without becoming proof artifacts', () => {
  const productDocs = trackedMarkdownFiles()
    .filter(file => file.startsWith('docs/'))
    .filter(file => !file.startsWith('docs/audit/'));

  assert.ok(productDocs.length > 0, 'expected tracked product docs outside docs/audit');
  assert.ok(productDocs.includes('docs/ARCHITECTURE.md'));
  assert.ok(productDocs.includes('docs/CONTENT_HIDING_PLAYBOOK.md'));
  assert.equal(productDocs.some(file => path.basename(file).startsWith('FILTERTUBE_')), false);
  assert.equal(productDocs.some(file => /_CURRENT_BEHAVIOR_/.test(path.basename(file))), false);
});
