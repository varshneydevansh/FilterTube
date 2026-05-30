import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';
const indexPath = 'docs/audit/FILTERTUBE_P0_OBLIGATION_INDEX_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function parseP0Groups(text) {
  const block = text.match(/## Minimum Gate Before First Behavior Patch[\s\S]*?## Source Status/)?.[0] || '';
  const groups = [];
  let current = null;

  for (const line of block.split('\n')) {
    const groupMatch = line.match(/^P0 (.+):$/);
    if (groupMatch) {
      current = { name: groupMatch[1], items: [] };
      groups.push(current);
      continue;
    }

    const itemMatch = line.match(/^  ([a-z0-9_]+)$/);
    if (itemMatch && current) {
      current.items.push(itemMatch[1]);
    }
  }

  return groups;
}

function parseIndexRows(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\| \d+ \| /.test(line))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      return {
        ordinal: Number(cells[0]),
        family: cells[1],
        obligation: cells[2].replace(/^`|`$/g, ''),
        doc: cells[3].replace(/^`|`$/g, ''),
        proofTest: cells[4].replace(/^`|`$/g, ''),
        status: cells[5],
        futureGate: cells[6]
      };
    });
}

test('P0 obligation index is audit-only and expands the readiness gate into per-obligation rows', () => {
  const index = read(indexPath);

  assert.match(index, /Status: audit-only generated index/);
  assert.match(index, /This is not an implementation patch/);
  assert.match(index, /Runtime behavior is unchanged/);
  assert.match(index, /source of truth is the `Minimum Gate Before First Behavior Patch` section/);
  assert.match(index, /A row here means the obligation is known and current-behavior family proof exists/);
  assert.match(index, /It does not mean the obligation is fixed, future-proof, or implementation-ready/);
});

test('P0 obligation index has exactly the same obligations as the readiness gate', () => {
  const groups = parseP0Groups(read(readinessPath));
  const rows = parseIndexRows(read(indexPath));
  const expected = groups.flatMap((group) => group.items.map((item) => ({ family: group.name, obligation: item })));

  assert.equal(groups.length, 23);
  assert.equal(expected.length, 217);
  assert.equal(rows.length, expected.length);

  rows.forEach((row, index) => {
    assert.equal(row.ordinal, index + 1);
    assert.equal(row.family, expected[index].family);
    assert.equal(row.obligation, expected[index].obligation);
  });
});

test('P0 obligation index keeps every obligation blocked with explicit future proof requirements', () => {
  const rows = parseIndexRows(read(indexPath));

  for (const row of rows) {
    assert.equal(row.status, 'future-proof-missing', `${row.obligation} should remain blocked`);
    assert.match(row.futureGate, /positive\/negative\/route\/mode\/source-confidence\/side-effect\/teardown\/provenance fixtures/);
    assert.ok(fs.existsSync(path.join(repoRoot, row.doc)), `missing current proof doc for ${row.obligation}: ${row.doc}`);
    assert.ok(fs.existsSync(path.join(repoRoot, row.proofTest)), `missing current proof test for ${row.obligation}: ${row.proofTest}`);
  }
});

test('P0 obligation index exposes aggregate status and has no runtime authority implementation', () => {
  const index = read(indexPath);
  const runtimeSource = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');

  assert.match(index, /P0 families: 23/);
  assert.match(index, /P0 obligations: 217/);
  assert.match(index, /Obligations with current family proof: 217/);
  assert.match(index, /Obligations with future behavior proof: 0/);
  assert.match(index, /Implementation-ready obligations: 0/);

  for (const authority of [
    'p0ObligationIndexAuthority',
    'futureProofedP0ObligationRegistry',
    'implementationReadyP0Obligation'
  ]) {
    assert.match(index, new RegExp(authority));
    assert.doesNotMatch(runtimeSource, new RegExp(authority));
  }
});
