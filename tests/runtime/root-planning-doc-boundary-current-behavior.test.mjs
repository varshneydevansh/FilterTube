import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim().split('\n').filter(Boolean);
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

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

const trackedFiles = new Set(git(['ls-files']));
const trackedRootMarkdown = git(['ls-files', '*.md']).filter(file => !file.includes('/')).sort();
const buildScript = read('build.js');
const boundaryDoc = read('docs/audit/FILTERTUBE_ROOT_PLANNING_DOC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md');
const trackedCoverageDoc = read('docs/audit/FILTERTUBE_TRACKED_FILE_AUDIT_COVERAGE_2026-05-18.md');
const historicalPlan = read('channel-identity-watch-mix-collab-recovery-plan.md');

test('root markdown files are explicitly split between public metadata and historical planning', () => {
  assert.deepEqual(trackedRootMarkdown, [
    'CHANGELOG.md',
    'README.md',
    'channel-identity-watch-mix-collab-recovery-plan.md'
  ]);

  assert.match(boundaryDoc, /README\.md/);
  assert.match(boundaryDoc, /CHANGELOG\.md/);
  assert.match(boundaryDoc, /channel-identity-watch-mix-collab-recovery-plan\.md/);
  assert.match(boundaryDoc, /public\/release metadata/);
  assert.match(boundaryDoc, /tracked historical engineering plan/);
});

test('ignored root planning and raw evidence files remain untracked local evidence', () => {
  for (const file of [
    'watcher-collab-watchlist-spa-fix-plan.md',
    'cher.md',
    'stash.txt'
  ]) {
    if (!exists(file)) continue;
    assert.equal(trackedFiles.has(file), false, `${file} must not be tracked source`);
    assert.equal(gitOk(['check-ignore', file]), true, `${file} must remain ignored evidence/planning input`);
  }

  assert.match(boundaryDoc, /ignored local root planning\/evidence notes/);
  assert.match(boundaryDoc, /must not become release source/);
});

test('historical planning notes may cite ignored evidence without becoming runtime authority', () => {
  assert.match(historicalPlan, /stash\.txt/);
  assert.match(boundaryDoc, /stash\.txt/);
  assert.match(boundaryDoc, /allowed only as an audit clue/);
  assert.match(boundaryDoc, /current-behavior runtime test/);
  assert.match(trackedCoverageDoc, /root-project-metadata/);
  assert.match(trackedCoverageDoc, /historical channel-identity plan/);
});

test('browser release common files include public docs but not historical planning docs', () => {
  assert.match(
    buildScript,
    /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/
  );
  assert.doesNotMatch(buildScript, /channel-identity-watch-mix-collab-recovery-plan\.md/);
  assert.doesNotMatch(buildScript, /watcher-collab-watchlist-spa-fix-plan\.md/);
});

test('active manifests do not reference root planning docs', () => {
  for (const manifest of git(['ls-files', 'manifest*.json'])) {
    const text = read(manifest);
    assert.doesNotMatch(text, /channel-identity-watch-mix-collab-recovery-plan\.md/);
    assert.doesNotMatch(text, /watcher-collab-watchlist-spa-fix-plan\.md/);
    assert.doesNotMatch(text, /stash\.txt/);
  }
});

test('root planning boundary is documented as evidence classification, not a behavior fix', () => {
  assert.match(boundaryDoc, /current-behavior audit artifact only/);
  assert.match(boundaryDoc, /does not change extension, website, or native-app behavior/);
  assert.match(boundaryDoc, /Root planning docs are useful/);
  assert.match(boundaryDoc, /they are not behavior proof/);
});
