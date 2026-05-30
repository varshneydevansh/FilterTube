import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ignoredEvidenceEntries() {
  const lines = read('.gitignore')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('#'));

  return lines.filter(line =>
    /\.(?:json|html|txt|JS|js|md)$/i.test(line) &&
    /YT_|YTM|ytkids|watch|playlist|collab|comments|logs|tmp|stash|reset|WHITELIST|DOMs|guide|reel|import_channels|extracted_watch_paths|strange_ytInitialData|cher|text/i.test(line)
  );
}

function trackedRuntimeAndReleaseSource() {
  return git(['ls-files'])
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('node_modules/'))
    .filter(file => !file.startsWith('dist/'))
    .filter(file => !file.startsWith('website/.next/'))
    .filter(file =>
      file === 'build.js' ||
      file === 'package.json' ||
      file.startsWith('scripts/') ||
      file.startsWith('manifest') ||
      file.startsWith('website/') ||
      file.startsWith('data/') ||
      file.startsWith('js/') ||
      file.startsWith('html/') ||
      file.startsWith('css/')
    )
    .filter(file => /\.(?:js|mjs|jsx|json|html|css|md)$/.test(file));
}

test('ignored root evidence corpus doc records current counts and evidence role', () => {
  const doc = read(docPath);

  for (const phrase of [
    'current-behavior proof slice',
    '46 ignored evidence entries',
    '45 present locally',
    '44 root-level entries',
    '2 nested ignored documentation entries',
    'JSON: 24',
    'HTML: 8',
    'TXT: 7',
    'JS/JS: 3',
    'MD: 4',
    'docs/json_paths_encyclopedia.md',
    'docs/youtube_renderer_inventory.md',
    'Runtime behavior remains unchanged'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('ignored evidence corpus counts match current gitignore patterns', () => {
  const entries = ignoredEvidenceEntries();
  const uniqueEntries = new Set(entries);
  const present = entries.filter(exists);
  const rootEntries = entries.filter(entry => !entry.includes('/'));
  const nestedEntries = entries.filter(entry => entry.includes('/'));

  assert.equal(entries.length, 46);
  assert.equal(uniqueEntries.size, 45);
  assert.equal(present.length, 45);
  assert.equal(rootEntries.length, 44);
  assert.equal(nestedEntries.length, 2);

  const byExt = entries.reduce((acc, entry) => {
    const ext = path.extname(entry).toLowerCase() || '(none)';
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(byExt, {
    '.json': 24,
    '.txt': 7,
    '.html': 8,
    '.js': 3,
    '.md': 4
  });
});

test('ignored evidence entries remain ignored and untracked when present', () => {
  const tracked = new Set(git(['ls-files']));

  for (const entry of ignoredEvidenceEntries()) {
    assert.equal(tracked.has(entry), false, `${entry} must not be tracked source`);
    assert.equal(gitOk(['check-ignore', entry]), true, `${entry} must be ignored evidence`);
  }
});

test('runtime and release source do not reference ignored evidence filenames', () => {
  const entries = [...new Set(ignoredEvidenceEntries())];
  const productFiles = trackedRuntimeAndReleaseSource()
    .filter(file => file !== '.gitignore');

  for (const file of productFiles) {
    const text = read(file);
    for (const entry of entries) {
      const basename = path.basename(entry);
      assert.doesNotMatch(
        text,
        new RegExp(`(^|[^\\w./-])${escapeRegExp(entry)}([^\\w./-]|$)`),
        `${file} should not reference ignored evidence path ${entry}`
      );
      assert.doesNotMatch(
        text,
        new RegExp(`(^|[^\\w.-])${escapeRegExp(basename)}([^\\w.-]|$)`),
        `${file} should not reference ignored evidence basename ${basename}`
      );
    }
  }
});

test('committed extracted capture fixtures are intentionally reduced and differently named', () => {
  const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');
  const fixtureNames = fs.readdirSync(fixtureDir).filter(name => !name.startsWith('.'));
  const ignoredBasenames = new Set(ignoredEvidenceEntries().map(entry => path.basename(entry)));

  assert.ok(fixtureNames.length >= 9, 'expected reduced extracted capture fixtures');
  for (const name of fixtureNames) {
    assert.equal(ignoredBasenames.has(name), false, `${name} must not be a raw ignored capture copy`);
    const stat = fs.statSync(path.join(fixtureDir, name));
    assert.ok(stat.size > 0, `${name} should not be empty`);
    assert.ok(stat.size < 100_000, `${name} should stay reduced enough for executable fixtures`);
  }
});

test('ignored evidence corpus is listed as a supplemental source-boundary proof artifact', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const stabilization = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const doc of [runtimeResults, convergence, stabilization, ledger]) {
    assert.ok(doc.includes('FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md'));
  }
});
