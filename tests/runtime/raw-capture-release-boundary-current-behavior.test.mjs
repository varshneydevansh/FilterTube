import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const appRoot = '/Users/devanshvarshney/FilterTubeApp';
const auditDocPath = 'docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md';

const rawCaptureNames = [
  'logs.json',
  'text.txt',
  'comments.json',
  'tmp.json',
  'playlist.json',
  'watchpage.json',
  'collab.json',
  'collab.html',
  'DOMs.html',
  'playlist.js',
  'playlist.html',
  'post_opt1_logs.txt',
  'collab_on_homepage.html',
  'collab_in_playlist_mix.html',
  'cher.md',
  'Docs/MOBILE_APP_UI_SPEC.md',
  'reset37.txt',
  'reel_item_watch?prettyPrint=False.JSON',
  'stash.txt',
  'strange_ytInitialData.json',
  'WHITELIST_background.js',
  'WHITELIST_content.js',
  'yt_kids_latest.json',
  'YT_KIDS.json',
  'YT_MAIN_NEXT_RESPONSE_COMMENT.json',
  'YT_MAIN_next?prettyPrint.json',
  'YT_MAIN_NEXT.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
  'YT_MAIN_WATCH.html',
  'YT_MAIN.json',
  'YTM-DOM.html',
  'YTM-LOGS.txt',
  'YTM-WATCH PLAYER.html',
  'YTM-XHR.json',
  'YTM.json',
  'guide?prettyPrint=false.json',
  'import_channels.txt',
  'ytkids_browse?alt=json.json',
  'ytm_browse?prettyPrint=false.json',
  'extracted_watch_paths.txt',
  'get_watch?prettyPrint=false.json',
  'docs/spa-collab-watchlist-handoff.md',
  'watcher-collab-watchlist-spa-fix-plan.md',
  'docs/subscribed-channels-whitelist-import-plan.md'
];

function read(file, root = repoRoot) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file, root = repoRoot) {
  return JSON.parse(read(file, root));
}

function exists(file, root = repoRoot) {
  return fs.existsSync(path.join(root, file));
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

function trackedNonAuditSourceFiles() {
  return git(['ls-files'])
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('node_modules/'))
    .filter(file => !file.startsWith('dist/'));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('raw capture release boundary audit documents evidence-only status and blocked verdict', () => {
  const doc = read(auditDocPath);

  for (const token of [
    'current-behavior proof only',
    'implementation gate remains closed',
    'ignored root captures',
    'raw evidence only',
    'COMMON_DIRS = js, css, html, icons, data, assets',
    'Future token: `rawCaptureReleaseBoundary`',
    'browser ZIPs, website source, native sync manifests'
  ]) {
    assert.ok(doc.includes(token), `missing audit token: ${token}`);
  }
  assert.match(doc, /Runtime, build, website, and native sync\s+behavior are unchanged/);
});

test('root raw captures are ignored and untracked when present locally', () => {
  const tracked = new Set(git(['ls-files']));

  for (const capture of rawCaptureNames) {
    assert.equal(tracked.has(capture), false, `${capture} must not be tracked product source`);
    assert.equal(gitOk(['check-ignore', capture]), true, `${capture} must remain ignored raw evidence`);
  }
});

test('browser package script stages explicit roots and does not zip the repository root', () => {
  const build = read('build.js');
  const commonDirsMatch = build.match(/const COMMON_DIRS = \[([^\]]+)\]/);
  const commonFilesMatch = build.match(/const COMMON_FILES = \[([^\]]+)\]/);

  assert.ok(commonDirsMatch, 'COMMON_DIRS declaration should exist');
  assert.ok(commonFilesMatch, 'COMMON_FILES declaration should exist');
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);
  assert.match(build, /fs\.copySync\(file, path\.join\(targetDir, file\), \{ filter: filterFunc \}\)/);
  assert.match(build, /archive\.glob\('\*\*\/\*', \{\s*cwd: sourceDir,/);

  for (const capture of rawCaptureNames) {
    assert.doesNotMatch(commonDirsMatch[0], new RegExp(escapeRegExp(capture)));
    assert.doesNotMatch(commonFilesMatch[0], new RegExp(escapeRegExp(capture)));
  }
});

test('active release and public source surfaces do not reference raw capture filenames', () => {
  const releaseSourceFiles = trackedNonAuditSourceFiles().filter(file => {
    return (
      file === 'build.js' ||
      file === 'package.json' ||
      file.startsWith('scripts/') ||
      file.startsWith('manifest') ||
      file.startsWith('website/') ||
      file.startsWith('data/') ||
      file.startsWith('js/') ||
      file.startsWith('html/')
    );
  });

  for (const file of releaseSourceFiles) {
    const text = read(file);
    for (const capture of rawCaptureNames) {
      assert.doesNotMatch(
        text,
        new RegExp(`(^|[^\\w./-])${escapeRegExp(capture)}([^\\w./-]|$)`),
        `${file} should not reference raw capture ${capture}`
      );
    }
  }
});

test('native sync manifest sources and destinations exclude raw captures', () => {
  const manifestPath = path.join(appRoot, 'tools/runtime-sync-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    assert.ok(true, 'native app repo is not present in this workspace');
    return;
  }

  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);
  const sourceSet = new Set(manifest.map(entry => entry.source));
  const destinationText = manifest.map(entry => entry.destination).join('\n');

  for (const capture of rawCaptureNames) {
    assert.equal(sourceSet.has(capture), false, `${capture} must not be a native sync source`);
    assert.doesNotMatch(destinationText, new RegExp(escapeRegExp(capture)), `${capture} must not be a native sync destination`);
  }
});

test('committed extracted capture fixtures are reduced fragments not raw corpus copies', () => {
  const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');
  const fixtureFiles = fs.readdirSync(fixtureDir).filter(name => !name.startsWith('.')).sort();
  const rawBasenames = new Set(rawCaptureNames.map(name => path.basename(name)));

  assert.ok(fixtureFiles.length > 0, 'expected committed extracted capture fixtures');

  for (const fixture of fixtureFiles) {
    const fixturePath = path.join(fixtureDir, fixture);
    const stat = fs.statSync(fixturePath);
    assert.equal(rawBasenames.has(fixture), false, `${fixture} should not be a direct raw-capture filename`);
    assert.ok(stat.size > 0, `${fixture} should not be empty`);
    assert.ok(stat.size < 100_000, `${fixture} should remain a reduced fixture fragment`);
  }
});

test('product source has no rawCaptureReleaseBoundary implementation yet', () => {
  const combined = trackedNonAuditSourceFiles()
    .filter(file => /\.(js|jsx|mjs|json)$/.test(file))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(file => read(file))
    .join('\n');

  assert.doesNotMatch(combined, /\brawCaptureReleaseBoundary\b/);
});
