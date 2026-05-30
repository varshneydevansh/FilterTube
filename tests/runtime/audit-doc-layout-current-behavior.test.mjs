import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocsDir = path.join(repoRoot, 'docs', 'audit');
const auditDocPath = path.join(auditDocsDir, 'FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md');
const runtimeResultsPath = path.join(auditDocsDir, 'FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
const scanRoots = [
  'README.md',
  'package.json',
  'build.js',
  'docs',
  'js',
  'scripts',
  'tests',
  'website'
];
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml'
]);
const skippedDirs = new Set([
  '.git',
  '.next',
  'dist',
  'node_modules'
]);

function listDir(dir) {
  return fs.readdirSync(dir, { withFileTypes: true });
}

function isFilterTubeAuditDoc(file) {
  return /^FILTERTUBE_.*\.md$/.test(file);
}

function* walkTextFiles(target) {
  const absolute = path.join(repoRoot, target);
  if (!fs.existsSync(absolute)) return;

  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    if (textExtensions.has(path.extname(absolute))) yield absolute;
    return;
  }

  for (const entry of listDir(absolute)) {
    if (entry.isDirectory() && skippedDirs.has(entry.name)) continue;

    const childRelative = path.join(target, entry.name);
    const childAbsolute = path.join(repoRoot, childRelative);
    if (entry.isDirectory()) {
      yield* walkTextFiles(childRelative);
    } else if (entry.isFile() && textExtensions.has(path.extname(childAbsolute))) {
      yield childAbsolute;
    }
  }
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

test('FilterTube audit markdown artifacts live under docs/audit', () => {
  assert.equal(fs.existsSync(auditDocsDir), true, 'docs/audit must exist');
  assert.equal(fs.existsSync(auditDocPath), true, 'audit doc layout proof must exist');

  const rootAuditDocs = listDir(path.join(repoRoot, 'docs'))
    .filter(entry => entry.isFile() && isFilterTubeAuditDoc(entry.name))
    .map(entry => entry.name);
  const nestedAuditDocs = listDir(auditDocsDir)
    .filter(entry => entry.isFile() && isFilterTubeAuditDoc(entry.name))
    .map(entry => entry.name)
    .sort();

  assert.deepEqual(rootAuditDocs, []);
  assert.ok(nestedAuditDocs.length >= 170, 'the current audit corpus must stay grouped under docs/audit');

  for (const file of nestedAuditDocs) {
    assert.match(file, /^FILTERTUBE_[A-Z0-9_]+_\d{4}-\d{2}-\d{2}\.md$/);
  }

  const layoutDoc = fs.readFileSync(auditDocPath, 'utf8');
  assert.match(layoutDoc, /Status: audit-only current-behavior layout proof/);
  assert.ok(layoutDoc.includes(`current root FilterTube audit docs: ${rootAuditDocs.length}`));
  assert.ok(layoutDoc.includes(`current docs/audit FilterTube audit docs: ${nestedAuditDocs.length}`));
  assert.match(layoutDoc, /root-level FilterTube audit doc placement: NO-GO/);
  assert.match(layoutDoc, /new audit artifact placement: docs\/audit/);
  assert.match(layoutDoc, /create new FilterTube audit markdown under docs\/audit: GO/);
  assert.match(layoutDoc, /rewrite core product docs for audit bookkeeping: NO-GO/);
  assert.match(layoutDoc, /keep runtime tests under tests\/runtime: GO/);

  const runtimeResults = fs.readFileSync(runtimeResultsPath, 'utf8');
  assert.ok(runtimeResults.includes('`tests/runtime/audit-doc-layout-current-behavior.test.mjs`'));
  assert.ok(runtimeResults.includes('`docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md`'));
  assert.ok(runtimeResults.includes(`0 root-level \`FILTERTUBE_*.md\` files under plain \`docs/\``));
  assert.ok(runtimeResults.includes(`${nestedAuditDocs.length} \`docs/audit/FILTERTUBE_*.md\` files`));
});

test('FilterTube audit references use the docs/audit path', () => {
  const staleLiteral = 'docs/' + 'FILTERTUBE_';
  const staleRegexLiteral = 'docs\\/' + 'FILTERTUBE_';
  const staleStringRegexLiteral = 'docs\\\\/' + 'FILTERTUBE_';
  const stalePathJoinArg = /['"]docs['"]\s*,\s*['"]FILTERTUBE_/;
  const staleReferences = [];

  for (const root of scanRoots) {
    for (const file of walkTextFiles(root)) {
      const source = fs.readFileSync(file, 'utf8');
      if (
        source.includes(staleLiteral) ||
        source.includes(staleRegexLiteral) ||
        source.includes(staleStringRegexLiteral) ||
        stalePathJoinArg.test(source)
      ) {
        staleReferences.push(relative(file));
      }
    }
  }

  assert.deepEqual(staleReferences, []);
});
