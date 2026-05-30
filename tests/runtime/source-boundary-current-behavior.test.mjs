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
const untrackedNonIgnoredFiles = git(['ls-files', '--others', '--exclude-standard']);
const boundaryDoc = read('docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md');

test('source boundary audit documents tracked source, raw evidence, generated output, and audit artifacts', () => {
  for (const marker of [
    'git ls-files',
    'Ignored Raw Evidence Authority',
    'Ignored Generated Output Authority',
    'Current Untracked Audit Artifacts',
    'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json',
    'docs/json_paths_encyclopedia.md',
    'docs/youtube_renderer_inventory.md',
    'tests/runtime/source-boundary-current-behavior.test.mjs'
  ]) {
    assert.match(boundaryDoc, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('root raw capture evidence is ignored and untracked even when present locally', () => {
  for (const file of [
    'DOMs.html',
    'YT_MAIN.json',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_WATCH.html',
    'YT_MAIN_NEXT_RESPONSE_COMMENT.json',
    'YTM.json',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'ytkids_browse?alt=json.json',
    'comments.json',
    'collab.json',
    'playlist.json',
    'playlist.html',
    'reel_item_watch?prettyPrint=False.JSON',
    'WHITELIST_background.js',
    'WHITELIST_content.JS'
  ]) {
    if (!exists(file)) continue;
    assert.equal(trackedFiles.has(file), false, `${file} must not be tracked source`);
    assert.equal(gitOk(['check-ignore', file]), true, `${file} must be ignored raw evidence`);
  }
});

test('generated build output and dependency caches are ignored and untracked', () => {
  for (const file of [
    'dist/filtertube-chrome-v3.3.1.zip',
    'dist/chrome/manifest.json',
    'dist/chrome/js/filter_logic.js',
    'node_modules/.package-lock.json',
    'website/.next/BUILD_ID',
    'website/node_modules/next/package.json'
  ]) {
    if (!exists(file)) continue;
    assert.equal(trackedFiles.has(file), false, `${file} must not be tracked source`);
    assert.equal(gitOk(['check-ignore', file]), true, `${file} must be ignored generated/dependency output`);
  }
});

test('current nonignored untracked files are audit artifacts only', () => {
  for (const file of untrackedNonIgnoredFiles) {
    assert.match(
      file,
      /^(docs\/audit\/FILTERTUBE_[A-Z0-9_]+_\d{4}-\d{2}-\d{2}\.md|docs\/audit\/artifacts\/empty-install-idle-probe\.mjs|docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/(?:template\.json|run-live-smoke\.mjs)|tests\/runtime\/)/,
      `${file} should be an audit doc or runtime audit fixture`
    );
  }
});
