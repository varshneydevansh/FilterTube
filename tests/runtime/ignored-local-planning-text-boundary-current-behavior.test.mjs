import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IGNORED_LOCAL_PLANNING_TEXT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const expectedArtifacts = {
  'docs/MOBILE_APP_UI_SPEC.md': {
    family: 'ignored local planning doc',
    lines: 348,
    bytes: 13660,
    sha256: '013f7dcd12a0c005d4e7ff8477437f2faa18112adb8c3be5cb8218a029c552e8',
    checkIgnoreLine: 48,
    checkIgnorePattern: 'Docs/MOBILE_APP_UI_SPEC.md',
    tokens: {
      '{': 0,
      '[': 0,
      ytInitialData: 0,
      videoRenderer: 0,
      channelId: 0,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 0,
      whitelist: 3,
      JSON: 0,
      json: 1
    }
  },
  'docs/spa-collab-watchlist-handoff.md': {
    family: 'ignored local handoff doc',
    lines: 86,
    bytes: 4832,
    sha256: '8629963b76e9d49fbdba5be531f0a78adc9e698dd527dca8e4f4b11825c96bb4',
    checkIgnoreLine: 76,
    checkIgnorePattern: 'docs/spa-collab-watchlist-handoff.md',
    tokens: {
      '{': 2,
      '[': 5,
      ytInitialData: 1,
      videoRenderer: 0,
      channelId: 0,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 0,
      whitelist: 0,
      JSON: 2,
      json: 0
    }
  },
  'docs/subscribed-channels-whitelist-import-plan.md': {
    family: 'ignored local whitelist import plan',
    lines: 457,
    bytes: 22353,
    sha256: '4989f77746272949ad6506d135d3f15a0d1fc754e9f41983cebb7b45ffc4f173',
    checkIgnoreLine: 78,
    checkIgnorePattern: 'docs/subscribed-channels-whitelist-import-plan.md',
    tokens: {
      '{': 1,
      '[': 0,
      ytInitialData: 0,
      videoRenderer: 0,
      channelId: 2,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 2,
      whitelist: 37,
      JSON: 0,
      json: 8
    }
  },
  'cher.md': {
    family: 'ignored root planning note',
    lines: 67,
    bytes: 5081,
    sha256: 'b319e0bdcfe59c0671a88f8285e31c501b500512ef96a0b4a0ddc42ba0d8033c',
    checkIgnoreLine: 47,
    checkIgnorePattern: 'cher.md',
    tokens: {
      '{': 2,
      '[': 44,
      ytInitialData: 0,
      videoRenderer: 0,
      channelId: 0,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 0,
      whitelist: 0,
      JSON: 0,
      json: 0
    }
  },
  'import_channels.txt': {
    family: 'ignored root channel list text',
    lines: 8043,
    bytes: 120066,
    sha256: 'ef88b54af41208c941a6871486d6c90a750dd9dc19b753e318ab96e3298484d9',
    checkIgnoreLine: 71,
    checkIgnorePattern: 'import_channels.txt',
    tokens: {
      '{': 0,
      '[': 0,
      ytInitialData: 0,
      videoRenderer: 0,
      channelId: 0,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 0,
      whitelist: 2,
      JSON: 0,
      json: 0
    }
  },
  'extracted_watch_paths.txt': {
    family: 'ignored root watch-path extraction text',
    lines: 677,
    bytes: 191278,
    sha256: 'be92bbf6041b99088c9057ef77b1a190e30e2cec5ddb59dea4f127d5c8258613',
    checkIgnoreLine: 74,
    checkIgnorePattern: 'extracted_watch_paths.txt',
    tokens: {
      '{': 0,
      '[': 1664,
      ytInitialData: 0,
      videoRenderer: 0,
      channelId: 12,
      MutationObserver: 0,
      addEventListener: 0,
      setTimeout: 0,
      querySelector: 0,
      youtubei: 26,
      whitelist: 0,
      JSON: 0,
      json: 0
    }
  },
  'YTM-LOGS.txt': {
    family: 'ignored root YouTube Music log text',
    lines: 8322,
    bytes: 500222,
    sha256: '6b7a29766c22cc167301fd63c2732e91bfebec2fc5fd19647960c432d0e7ac09',
    checkIgnoreLine: 66,
    checkIgnorePattern: 'YTM-LOGS.txt',
    tokens: {
      '{': 1810,
      '[': 613,
      ytInitialData: 33,
      videoRenderer: 6,
      channelId: 19,
      MutationObserver: 5,
      addEventListener: 24,
      setTimeout: 21,
      querySelector: 184,
      youtubei: 42,
      whitelist: 26,
      JSON: 22,
      json: 26
    }
  }
};

const activeReleaseSurfaceFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
  'build.js',
  'package.json',
  'README.md'
];

const activeReleaseSurfaceDirs = [
  'js',
  'html',
  'scripts',
  'website',
  'css',
  'data',
  'assets'
];

const futureAuthoritySymbols = [
  'ignoredLocalPlanningTextBoundaryContract',
  'ignoredLocalPlanningTextReleaseExclusionReport',
  'ignoredLocalPlanningTextExtractionDecision',
  'ignoredLocalPlanningTextFixtureProvenance',
  'ignoredLocalPlanningTextOptimizationInputPolicy',
  'ignoredLocalPlanningTextDocClaimGate',
  'ignoredLocalPlanningTextPackageBoundaryReport',
  'ignoredLocalPlanningTextMetricArtifact',
  'ignoredLocalPlanningTextDeletionReadinessReport',
  'ignoredLocalPlanningTextCurrentRuntimeParityReport'
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

function gitRaw(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function gitLines(args) {
  return gitRaw(args).trim().split('\n').filter(Boolean);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listTextFilesUnder(target) {
  const absolute = path.join(repoRoot, target);
  if (!fs.existsSync(absolute)) return [];

  const results = [];
  const stack = [absolute];
  const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.txt', '.yaml', '.yml']);

  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        stack.push(path.join(current, entry.name));
      }
      continue;
    }

    if (stat.isFile() && textExtensions.has(path.extname(current))) {
      results.push(path.relative(repoRoot, current).replaceAll(path.sep, '/'));
    }
  }

  return results.sort();
}

function activeReleaseSurfaceText() {
  const files = [
    ...activeReleaseSurfaceFiles,
    ...activeReleaseSurfaceDirs.flatMap(listTextFilesUnder)
  ].filter((file, index, list) => list.indexOf(file) === index);

  return files.map(file => `${file}\n${read(file)}`).join('\n');
}

function trackedProductRuntimeFiles() {
  return gitLines(['ls-files'])
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('dist/'))
    .filter(file => /\.(js|mjs|json|html|css)$/.test(file));
}

test('ignored local planning text audit is audit-only and keeps optimization blocked', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle/);
  assert.match(doc, /local ignored evidence\/planning inputs/);
  assert.match(doc, /not a\s+valid basis for current first-class JSON filtering or whitelist optimization/);
  assert.match(doc, /without reduced, reviewed fixtures/);
});

test('local planning and capture-text artifacts remain ignored, untracked, and fingerprinted', () => {
  const doc = read(docPath);
  const trackedFiles = new Set(gitLines(['ls-files']));
  const status = gitRaw(['status', '--short', '--ignored', ...Object.keys(expectedArtifacts)]);

  for (const [file, expected] of Object.entries(expectedArtifacts)) {
    assert.equal(exists(file), true, `${file} should exist in the current local evidence corpus`);
    assert.equal(trackedFiles.has(file), false, `${file} must not be tracked release source`);
    assert.match(status, new RegExp(`!! ${escapeRegex(file)}`), `${file} should be ignored by git status`);

    const text = read(file);
    assert.equal(text.split(/\r?\n/).length, expected.lines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(text), expected.bytes, `${file} byte count drift`);
    assert.equal(sha256(text), expected.sha256, `${file} hash drift`);

    assert.ok(doc.includes(`| \`${file}\` | ${expected.family} | ignored local evidence | ${expected.lines} | ${expected.bytes} | \`${expected.sha256}\` |`));
  }
});

test('git ignore rules classify each local planning text artifact explicitly', () => {
  const doc = read(docPath);

  for (const [file, expected] of Object.entries(expectedArtifacts)) {
    const output = gitRaw(['check-ignore', '-v', file]);
    assert.match(
      output,
      new RegExp(`\\.gitignore:${expected.checkIgnoreLine}:${escapeRegex(expected.checkIgnorePattern)}\\s+${escapeRegex(file)}`),
      `${file} should map to the expected .gitignore line`
    );
  }

  assert.match(doc, /\.gitignore:48/);
  assert.match(doc, /\.gitignore:76/);
  assert.match(doc, /\.gitignore:78/);
  assert.match(doc, /\.gitignore:47/);
  assert.match(doc, /\.gitignore:71/);
  assert.match(doc, /\.gitignore:74/);
  assert.match(doc, /\.gitignore:66/);
});

test('selected token density stays explicit without granting runtime authority', () => {
  const doc = read(docPath);

  for (const [file, expected] of Object.entries(expectedArtifacts)) {
    const text = read(file);
    for (const [token, count] of Object.entries(expected.tokens)) {
      assert.equal(countLiteral(text, token), count, `${file} token drift: ${token}`);
    }
  }

  assert.match(doc, /\| `ytInitialData` \| 0 \| 1 \| 0 \| 0 \| 0 \| 0 \| 33 \|/);
  assert.match(doc, /\| `querySelector` \| 0 \| 0 \| 0 \| 0 \| 0 \| 0 \| 184 \|/);
  assert.match(doc, /\| `youtubei` \| 0 \| 0 \| 2 \| 0 \| 0 \| 26 \| 42 \|/);
  assert.match(doc, /\| `whitelist` \| 3 \| 0 \| 37 \| 0 \| 2 \| 0 \| 26 \|/);
  assert.match(doc, /does not prove current\s+runtime behavior/);
});

test('active release surfaces do not reference ignored local planning text paths', () => {
  const doc = read(docPath);
  const surface = activeReleaseSurfaceText();

  for (const file of Object.keys(expectedArtifacts)) {
    const base = path.basename(file);
    assert.equal(countLiteral(surface, file), 0, `active release surface references ${file}`);
    assert.equal(countLiteral(surface, base), 0, `active release surface references ${base}`);
  }

  for (const releaseFile of activeReleaseSurfaceFiles) {
    assert.match(doc, new RegExp(`${escapeRegex(releaseFile)}: 0`));
  }
  for (const releaseDir of activeReleaseSurfaceDirs) {
    assert.match(doc, new RegExp(`${escapeRegex(releaseDir)}\\/: 0`));
  }
});

test('build package surface and current dist output exclude ignored local planning text artifacts', () => {
  const doc = read(docPath);
  const buildScript = read('build.js');

  assert.match(buildScript, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\];/);
  assert.match(buildScript, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/);

  for (const file of Object.keys(expectedArtifacts)) {
    assert.equal(countLiteral(buildScript, file), 0, `build.js references ${file}`);
    assert.equal(countLiteral(buildScript, path.basename(file)), 0, `build.js references ${path.basename(file)}`);
  }

  const findArgs = [
    'dist',
    '-maxdepth',
    '5',
    '(',
    ...Object.keys(expectedArtifacts).flatMap((file, index) => {
      const args = ['-name', path.basename(file)];
      return index === 0 ? args : ['-o', ...args];
    }),
    ')',
    '-print'
  ];
  const distMatches = execFileSync('find', findArgs, { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(distMatches, '');

  assert.match(doc, /The current `dist` tree also has no copies named after these seven/);
});

test('product runtime still lacks ignored local planning text authority symbols', () => {
  const productSource = trackedProductRuntimeFiles().map(read).join('\n');
  const doc = read(docPath);

  for (const symbol of futureAuthoritySymbols) {
    assert.match(doc, new RegExp(`- \`${symbol}\``));
    assert.equal(productSource.includes(symbol), false, `${symbol} leaked into product runtime source`);
  }
});
