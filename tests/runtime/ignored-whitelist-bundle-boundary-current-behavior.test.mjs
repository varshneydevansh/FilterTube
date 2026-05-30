import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IGNORED_WHITELIST_BUNDLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const expectedBundles = {
  'WHITELIST_background.js': {
    lines: 32472,
    bytes: 1700002,
    sha256: 'addf21588950e9fa73a121b08a4e0385f197abf77817f03345dbe3509111dada',
    tokens: {
      'chrome.storage.local.get': 34,
      'chrome.storage.local.set': 24,
      'chrome.runtime.sendMessage': 16,
      'chrome.runtime.onMessage.addListener': 1,
      'chrome.downloads': 9,
      'chrome.tabs': 51,
      MutationObserver: 0,
      querySelectorAll: 1,
      querySelector: 1,
      closest: 0,
      addEventListener: 9,
      removeEventListener: 2,
      setTimeout: 25,
      clearTimeout: 13,
      setInterval: 11,
      clearInterval: 8,
      'fetch(': 35,
      postMessage: 3,
      localStorage: 9,
      sessionStorage: 0,
      WhitelistVideo: 588,
      whitelist: 164,
      video: 122,
      channel: 497,
      'chrome.scripting': 1
    }
  },
  'WHITELIST_content.JS': {
    lines: 9302,
    bytes: 674344,
    sha256: '87b3e2aed160342f818539718af3bad32e16d1ae11e54143d26e9ef069b81ef1',
    tokens: {
      'chrome.storage.local.get': 21,
      'chrome.storage.local.set': 9,
      'chrome.runtime.sendMessage': 29,
      'chrome.runtime.onMessage.addListener': 4,
      'chrome.downloads': 0,
      'chrome.tabs': 3,
      MutationObserver: 21,
      querySelectorAll: 39,
      querySelector: 146,
      closest: 20,
      addEventListener: 64,
      removeEventListener: 7,
      setTimeout: 81,
      clearTimeout: 19,
      setInterval: 15,
      clearInterval: 22,
      'fetch(': 2,
      postMessage: 0,
      localStorage: 0,
      sessionStorage: 4,
      WhitelistVideo: 635,
      whitelist: 111,
      video: 730,
      channel: 598,
      'chrome.scripting': 0
    }
  }
};

const releaseSurfaceFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
  'build.js',
  'package.json',
  'README.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function trackedProductFiles() {
  return git(['ls-files'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('node_modules/'))
    .filter(file => !file.startsWith('dist/'))
    .filter(file => file !== '.gitignore')
    .filter(file => /\.(js|jsx|mjs|json|html|css|md)$/.test(file));
}

test('ignored whitelist bundle audit is audit-only and records the release boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /current-behavior proof only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime, build, packaging, native sync, website, and whitelist decision behavior/);
  assert.match(doc, /local ignored evidence/);
  assert.match(doc, /not active FilterTube release source/);
  assert.match(doc, /not active browser manifest input/);
  assert.match(doc, /not\s+a valid basis for optimizing the current JSON-first whitelist runtime without a\s+separate reduced fixture/);
});

test('local ignored whitelist bundles remain present and source-pinned', () => {
  const doc = read(docPath);

  for (const [file, expected] of Object.entries(expectedBundles)) {
    assert.equal(exists(file), true, `${file} should exist in the current local evidence corpus`);

    const text = read(file);
    assert.equal(text.split(/\r?\n/).length, expected.lines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(text), expected.bytes, `${file} byte count drift`);
    assert.equal(sha256(text), expected.sha256, `${file} hash drift`);
    assert.ok(doc.includes(`| \`${file}\` | ignored root evidence | ${expected.lines} | ${expected.bytes} | \`${expected.sha256}\` |`));
  }
});

test('git ignore rules exclude the local whitelist bundles from release source', () => {
  const status = git(['status', '--short', '--ignored', 'WHITELIST_background.js', 'WHITELIST_content.JS']);
  assert.match(status, /!! WHITELIST_background\.js/);
  assert.match(status, /!! WHITELIST_content\.JS/);

  const ignoreBackground = git(['check-ignore', '-v', 'WHITELIST_background.js']);
  const ignoreContent = git(['check-ignore', '-v', 'WHITELIST_content.JS']);

  assert.match(ignoreBackground, /\.gitignore:53:WHITELIST_background\.js\s+WHITELIST_background\.js/);
  assert.match(ignoreContent, /\.gitignore:54:WHITELIST_content\.js\s+WHITELIST_content\.JS/);
});

test('selected token counts keep ignored bundle lifecycle and storage burden explicit', () => {
  const doc = read(docPath);

  for (const [file, expected] of Object.entries(expectedBundles)) {
    const text = read(file);
    for (const [token, count] of Object.entries(expected.tokens)) {
      assert.equal(countLiteral(text, token), count, `${file} token drift: ${token}`);
    }
  }

  assert.match(doc, /\| `MutationObserver` \| 0 \| 21 \|/);
  assert.match(doc, /\| `querySelector` \| 1 \| 146 \|/);
  assert.match(doc, /\| `addEventListener` \| 9 \| 64 \|/);
  assert.match(doc, /\| `setTimeout` \| 25 \| 81 \|/);
  assert.match(doc, /\| `fetch\(` \| 35 \| 2 \|/);
  assert.match(doc, /\| `WhitelistVideo` \| 588 \| 635 \|/);
});

test('active release surfaces do not reference ignored whitelist bundle names or marker', () => {
  const doc = read(docPath);

  for (const file of releaseSurfaceFiles) {
    const text = read(file);
    assert.equal(countLiteral(text, 'WHITELIST_background'), 0, `${file} references WHITELIST_background`);
    assert.equal(countLiteral(text, 'WHITELIST_content'), 0, `${file} references WHITELIST_content`);
    assert.equal(countLiteral(text, 'WhitelistVideo'), 0, `${file} references WhitelistVideo`);
    assert.match(doc, new RegExp(`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0`));
  }
});

test('tracked product source and current dist tree do not ship the ignored whitelist bundles', () => {
  const tracked = trackedProductFiles();

  assert.equal(tracked.includes('WHITELIST_background.js'), false);
  assert.equal(tracked.includes('WHITELIST_content.JS'), false);
  assert.equal(tracked.includes('WHITELIST_content.js'), false);

  const combined = tracked.map(read).join('\n');
  assert.doesNotMatch(combined, /WHITELIST_background\.js/);
  assert.doesNotMatch(combined, /WHITELIST_content\.JS/);
  assert.doesNotMatch(combined, /WHITELIST_content\.js/);
  assert.doesNotMatch(combined, /WhitelistVideo/);

  const distMatches = execFileSync('find', [
    'dist',
    '-maxdepth',
    '3',
    '(',
    '-name',
    'WHITELIST_background.js',
    '-o',
    '-name',
    'WHITELIST_content.JS',
    '-o',
    '-name',
    'WHITELIST_content.js',
    ')',
    '-print'
  ], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(distMatches, '');
});

test('product runtime still lacks ignored whitelist bundle authority symbols', () => {
  const tracked = trackedProductFiles()
    .filter(file => /\.(js|jsx|mjs|json)$/.test(file))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');

  for (const symbol of [
    'ignoredWhitelistBundleBoundaryContract',
    'ignoredWhitelistBundleReleaseExclusionReport',
    'ignoredWhitelistBundleExtractionDecision',
    'ignoredWhitelistBundleLifecycleBudget',
    'ignoredWhitelistBundleMessageStorageReport',
    'ignoredWhitelistBundleFixtureProvenance',
    'ignoredWhitelistBundleCurrentRuntimeParityReport',
    'ignoredWhitelistBundleOptimizationInputPolicy',
    'ignoredWhitelistBundleDeletionReadinessArtifact',
    'ignoredWhitelistBundleMetricArtifact'
  ]) {
    assert.doesNotMatch(tracked, new RegExp(`\\b${symbol}\\b`), `${symbol} should not exist in product runtime yet`);
  }
});
