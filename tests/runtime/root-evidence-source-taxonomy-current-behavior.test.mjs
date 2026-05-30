import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ROOT_EVIDENCE_SOURCE_TAXONOMY_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function gitOk(args) {
  try {
    execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}

function rootJsonHtmlTxtFiles() {
  return fs.readdirSync(repoRoot)
    .filter(name => fs.statSync(path.join(repoRoot, name)).isFile())
    .filter(name => /\.(?:json|html|txt|JSON)$/i.test(name))
    .sort();
}

function ignoredCaptureBlockEntries() {
  const lines = read('.gitignore').split(/\r?\n/);
  const start = lines.indexOf('logs.json');
  const end = lines.indexOf('# Logs');
  assert.notEqual(start, -1, 'missing capture block start');
  assert.notEqual(end, -1, 'missing capture block end');
  return lines.slice(start, end).filter(Boolean);
}

test('root evidence source taxonomy doc records the mixed root-file boundary', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: audit-only proof',
    'Runtime behavior is unchanged',
    '43 root JSON/HTML/TXT-like files are present locally',
    '37 are ignored raw evidence files',
    '6 are tracked source/package files',
    'These counts should not be collapsed into one number',
    'rootEvidenceSourceTaxonomy'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
});

test('root JSON HTML TXT filesystem view currently mixes ignored evidence and tracked source', () => {
  const rootFiles = rootJsonHtmlTxtFiles();
  const tracked = new Set(git(['ls-files']));
  const ignored = rootFiles.filter(file => gitOk(['check-ignore', file]));
  const trackedRootSource = rootFiles.filter(file => tracked.has(file));

  assert.equal(rootFiles.length, 43);
  assert.equal(ignored.length, 37);
  assert.deepEqual(trackedRootSource, [
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.json',
    'manifest.opera.json',
    'package-lock.json',
    'package.json'
  ]);
});

test('tracked root manifest and package JSON files are not ignored evidence', () => {
  for (const file of [
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.json',
    'manifest.opera.json',
    'package-lock.json',
    'package.json'
  ]) {
    assert.equal(git(['ls-files', file])[0], file, `${file} should be tracked`);
    assert.equal(gitOk(['check-ignore', file]), false, `${file} must not be ignored evidence`);
  }
});

test('capture block count and ignored evidence corpus count are intentionally different views', () => {
  const blockEntries = ignoredCaptureBlockEntries();
  const uniqueBlockEntries = [...new Set(blockEntries)];
  const presentUniqueBlockEntries = uniqueBlockEntries.filter(file => fs.existsSync(path.join(repoRoot, file)));
  const ignoredRootEvidenceDoc = read('docs/audit/FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md');
  const traceabilityDoc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');

  assert.equal(blockEntries.length, 47);
  assert.equal(uniqueBlockEntries.length, 46);
  assert.equal(presentUniqueBlockEntries.length, 45);
  assert.ok(blockEntries.includes('post_opt1_logs.txt'));
  assert.equal(fs.existsSync(path.join(repoRoot, 'post_opt1_logs.txt')), false);

  assert.match(traceabilityDoc, /47 entries/);
  assert.match(traceabilityDoc, /46 unique paths/);
  assert.match(traceabilityDoc, /1 missing historical path: post_opt1_logs\.txt/);
  assert.match(ignoredRootEvidenceDoc, /46 ignored evidence entries/);
  assert.match(ignoredRootEvidenceDoc, /45 unique ignored evidence paths/);
});

test('reduced capture fixtures remain separate from root raw captures and tracked root source', () => {
  const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');
  const fixtureFiles = fs.readdirSync(fixtureDir).sort();
  const rootFiles = new Set(rootJsonHtmlTxtFiles());

  assert.equal(fixtureFiles.length, 44);
  for (const fixture of fixtureFiles) {
    assert.equal(rootFiles.has(fixture), false, `${fixture} should not be a root raw/source file`);
    assert.ok(fs.statSync(path.join(fixtureDir, fixture)).size > 0, `${fixture} should be non-empty`);
  }
});

test('runtime source has no root evidence taxonomy authority implementation yet', () => {
  const combined = [
    'build.js',
    'package.json',
    'js/background.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');

  assert.doesNotMatch(combined, /\brootEvidenceSourceTaxonomy\b/);
  assert.doesNotMatch(combined, /\bcategory:\s*tracked-source\b/);
  assert.doesNotMatch(combined, /\bignored-evidence\b/);
});
