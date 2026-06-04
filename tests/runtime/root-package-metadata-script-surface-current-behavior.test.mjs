import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const rootMetadataRows = [
  ['.gitignore', 153, 2197, 'c90a7834297cf0a7b65493f41a21947fd5d85d1e14740b902cb3a3664028e3ca'],
  ['CHANGELOG.md', 591, 40124, 'e22a87ce7eeb88d171587d4b0f4676881a2c3081a7fbf15978d7e8d8582cdfdd'],
  ['LICENSE', 21, 1073, 'd0739cbb6232b0fb9ea59347feaf412bab5042768aa02856b16af24bb35e9d9d'],
  ['README.md', 401, 22476, '4ccd9cd21959784f56d5474d209fbe660b69d2849167ff15c013247882fc8c05'],
  ['channel-identity-watch-mix-collab-recovery-plan.md', 262, 16023, '01f82169b06d3752e318b20b956c8a4284ae80166686e5c40aeee66c957d108a'],
  ['package.json', 61, 2405, '36053d322780ce787de403be574cc400936ef2a994b4c8eca62561154fe81aec'],
  ['package-lock.json', 1461, 49916, 'f52d6482693be9cd4edacdc1f1491b4d2cda796522bfd0e4dcf86e0c879ad974'],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(filePath(file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function newlineCount(file) {
  return (read(file).match(/\n/g) || []).length;
}

function byteCount(file) {
  return fs.statSync(filePath(file)).size;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function isIgnored(file) {
  try {
    execFileSync('git', ['check-ignore', file], {
      cwd: repoRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function count(source, needle) {
  return source.split(needle).length - 1;
}

function escapeRegExp(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('root package metadata script surface doc is audit-only and fingerprint pinned', () => {
  const doc = read(docPath);
  const trackedRootMetadata = git([
    'ls-files',
    '.gitignore',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'channel-identity-watch-mix-collab-recovery-plan.md',
    'package.json',
    'package-lock.json',
  ]);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /optimization, release, dependency, JSON-first, or cleanup implementation work/);
  assert.deepEqual(trackedRootMetadata.sort(), rootMetadataRows.map(([file]) => file).sort());

  assert.equal(rootMetadataRows.reduce((sum, [, lines]) => sum + lines, 0), 2950);
  assert.equal(rootMetadataRows.reduce((sum, [, , bytes]) => sum + bytes, 0), 134214);
  assert.match(doc, /7 files, 2,950 newline counts, and\s+134,214 bytes/);

  for (const [file, lines, bytes, hash] of rootMetadataRows) {
    assert.equal(newlineCount(file), lines, `${file} newline count drifted`);
    assert.equal(byteCount(file), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(escapeRegExp(file)));
    assert.match(doc, new RegExp(hash));
  }
});

test('package scripts and dependency metadata are pinned before release or optimization changes', () => {
  const pkg = readJson('package.json');
  const doc = read(docPath);

  assert.equal(pkg.name, 'filtertube');
  assert.equal(pkg.version, '3.3.2');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.repository.url, 'git+https://github.com/varshneydevansh/FilterTube.git');
  assert.equal(pkg.homepage, 'https://github.com/varshneydevansh/FilterTube');
  assert.deepEqual(Object.keys(pkg.scripts), [
    'build:nanah-vendor',
    'build:ui',
    'dev',
    'build',
    'build:chrome',
    'build:firefox',
    'build:opera',
    'sync:native-runtime',
    'test',
    'audit:runtime',
    'test:release',
    'test:whitelist',
    'test:blocking',
    'test:json',
    'test:dom',
    'test:menu',
    'test:performance',
    'test:settings',
    'test:smoke',
    'lanes:changed',
    'test:changed',
    'test:audit-drift',
    'smoke:youtube',
    'smoke:youtube:verify',
    'dev:chrome',
    'dev:firefox',
    'dev:opera',
  ]);
  assert.equal(Object.keys(pkg.scripts).length, 27);
  assert.equal(pkg.scripts.test, 'node scripts/run-test-lane.mjs smoke');
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');
  assert.equal(pkg.scripts['test:release'], 'node scripts/run-test-lane.mjs release');
  assert.equal(pkg.scripts['test:smoke'], 'node scripts/run-test-lane.mjs smoke');
  assert.equal(pkg.scripts['lanes:changed'], 'node scripts/run-test-lane.mjs --changed');
  assert.equal(pkg.scripts['test:changed'], 'node scripts/run-test-lane.mjs --run-changed');
  assert.equal(pkg.scripts['test:audit-drift'], 'node scripts/audit-proof-drift.mjs --lane-owned');
  assert.equal(pkg.scripts['smoke:youtube'], 'node docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs');
  assert.equal(pkg.scripts['smoke:youtube:verify'], 'node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs');
  assert.equal(Object.hasOwn(pkg, 'private'), false);
  assert.equal(Object.hasOwn(pkg, 'engines'), false);
  assert.equal(Object.hasOwn(pkg, 'packageManager'), false);
  assert.deepEqual(pkg.dependencies, {
    preact: '^10.29.0',
    qrcode: '^1.5.4',
  });
  assert.deepEqual(pkg.devDependencies, {
    archiver: '^5.3.1',
    esbuild: '^0.27.4',
    'fs-extra': '^11.1.1',
  });

  assert.match(doc, /27 scripts/);
  assert.match(doc, /test -> node scripts\/run-test-lane\.mjs smoke/);
  assert.match(doc, /test:release -> node scripts\/run-test-lane\.mjs release/);
  assert.match(doc, /test:smoke -> node scripts\/run-test-lane\.mjs smoke/);
  assert.match(doc, /lanes:changed -> node scripts\/run-test-lane\.mjs --changed/);
  assert.match(doc, /test:changed -> node scripts\/run-test-lane\.mjs --run-changed/);
  assert.match(doc, /test:audit-drift -> node scripts\/audit-proof-drift\.mjs --lane-owned/);
  assert.match(doc, /smoke:youtube -> node docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/run-live-smoke\.mjs/);
  assert.match(doc, /smoke:youtube:verify -> node docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/verify-live-smoke-artifact\.mjs/);
  assert.match(doc, /`test:changed`\s+runs those classified lanes sequentially/);
  assert.match(doc, /does not declare `private`, `engines`,\s+or `packageManager`/);
  assert.match(doc, /`npm test`\s+now runs the\s+smoke lane/);
  assert.match(doc, /browser dev shortcuts still mutate tracked\s+`manifest\.json`/);
  assert.match(doc, /`packageScriptExecutionGate`/);
});

test('package lock reproducibility surface records package count integrity license and deprecations', () => {
  const lock = readJson('package-lock.json');
  const doc = read(docPath);
  const nonRootPackages = Object.entries(lock.packages).filter(([name]) => name);
  const licenseCounts = {};
  const deprecated = [];

  for (const [name, metadata] of nonRootPackages) {
    assert.ok(metadata.integrity, `${name} is missing integrity`);
    licenseCounts[metadata.license || '(missing)'] = (licenseCounts[metadata.license || '(missing)'] || 0) + 1;
    if (metadata.deprecated) deprecated.push([name, metadata.deprecated]);
  }

  assert.equal(lock.name, 'filtertube');
  assert.equal(lock.version, '3.3.2');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(Object.keys(lock.packages).length, 112);
  assert.equal(nonRootPackages.length, 111);
  assert.deepEqual(lock.packages[''].dependencies, {
    preact: '^10.29.0',
    qrcode: '^1.5.4',
  });
  assert.deepEqual(lock.packages[''].devDependencies, {
    archiver: '^5.3.1',
    esbuild: '^0.27.4',
    'fs-extra': '^11.1.1',
  });
  assert.deepEqual(licenseCounts, {
    MIT: 92,
    ISC: 16,
    'Apache-2.0': 2,
    'BSD-3-Clause': 1,
  });
  assert.deepEqual(deprecated.map(([name]) => name).sort(), [
    'node_modules/glob',
    'node_modules/inflight',
  ]);

  assert.match(doc, /112 `packages` entries/);
  assert.match(doc, /All non-root package entries currently have an integrity value/);
  assert.match(doc, /node_modules\/glob/);
  assert.match(doc, /node_modules\/inflight/);
  assert.match(doc, /leaks memory/);
  assert.match(doc, /`packageLockReproducibilityReport`/);
});

test('root public docs expose release and JSON-first claims that still need parity proof', () => {
  const readme = read('README.md');
  const changelog = read('CHANGELOG.md');
  const license = read('LICENSE');
  const build = read('build.js');
  const doc = read(docPath);

  assert.match(readme, /version-3\.3\.2-blue\.svg/);
  assert.match(readme, /license-MIT-green\.svg/);
  assert.match(readme, /total%20lines-524\.1k-brightgreen\.svg/);
  assert.match(readme, /javascript-78\.7k%20lines-yellow\.svg/);
  assert.match(readme, /filtertube\.in\/downloads/);
  assert.match(readme, /Large Blocklist Matching \(v3\.3\.1\)/);
  assert.match(readme, /200\+ saved channels do not create renderer-by-renderer scan costs/);
  assert.match(readme, /JSON-backed surfaces can be filtered before paint/);
  assert.match(readme, /Current audit work is tightening no-rule, route, lifecycle, and resolver budgets/);
  assert.equal(changelog.startsWith('# Changelog\n\n## Version 3.3.2'), true);
  assert.match(license, /MIT License/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);

  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/);
  assert.doesNotMatch(build, /channel-identity-watch-mix-collab-recovery-plan\.md/);
  assert.doesNotMatch(build, /package-lock\.json/);

  assert.match(doc, /README\.md` is public release copy/);
  assert.match(doc, /`CHANGELOG\.md` currently starts with `## Version 3\.3\.2`/);
  assert.match(doc, /The historical planning file\s+`channel-identity-watch-mix-collab-recovery-plan\.md` is tracked/);
  assert.match(doc, /`rootDocClaimParityReport`/);
});

test('gitignore keeps local JSON captures out of tracked source while preserving package lock tracking', () => {
  const gitignore = read('.gitignore');
  const doc = read(docPath);
  const ignoredEvidenceFiles = [
    'logs.json',
    'comments.json',
    'YT_MAIN.json',
    'YTM.json',
    'YT_KIDS.json',
    'get_watch?prettyPrint=false.json',
    'docs/subscribed-channels-whitelist-import-plan.md',
    'watcher-collab-watchlist-spa-fix-plan.md',
    'stash.txt',
  ];

  for (const entry of [
    'build/',
    'dist/',
    'release-artifacts/',
    'mobile-artifacts/',
    '*.zip',
    '*.apk',
    '*.aab',
    'website/.next/',
  ]) {
    assert.match(gitignore, new RegExp(escapeRegExp(entry)));
  }

  assert.equal(count(gitignore, 'playlist.json'), 2);
  assert.match(gitignore, /# package-lock\.json/);
  assert.equal(isIgnored('package-lock.json'), false);
  assert.ok(git(['ls-files', 'package-lock.json']).includes('package-lock.json'));

  for (const file of ignoredEvidenceFiles) {
    assert.equal(isIgnored(file), true, `${file} should remain ignored local evidence`);
  }

  assert.match(doc, /many local\s+raw evidence captures/);
  assert.match(doc, /`package-lock\.json` remains tracked and is not ignored/);
  assert.match(doc, /`rootGitignoreEvidenceBoundary`/);
});

test('root metadata records JSON-first implementation boundary without opening runtime changes', () => {
  const readme = read('README.md');
  const plan = read('channel-identity-watch-mix-collab-recovery-plan.md');
  const readinessDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md');
  const noWorkDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md');
  const locusDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md');
  const doc = read(docPath);

  assert.match(readme, /JSON-First Channel Identity/);
  assert.match(readme, /Current audit work is tightening no-rule, route, lifecycle, and resolver budgets/);
  assert.match(plan, /Restore authoritative blocking to the older deterministic path: JSON engine filtering first/);
  assert.match(plan, /Pre-render filtering remains primary/);
  assert.match(readinessDoc, /first-class JSON filter behavior/);
  assert.match(noWorkDoc, /audit-discovered optimization candidates/);
  assert.match(locusDoc, /A first-class JSON filter contract must describe work allowed/);

  assert.match(doc, /active audit is intentionally finding optimization locations before\s+implementation/);
  assert.match(doc, /first-class JSON filter contract/);
  assert.match(doc, /captures\s+must become reduced fixtures before they can drive first-class filter changes/);
  assert.match(doc, /`rootJsonFirstClaimGate`/);
});

test('root package metadata script surface has no product authority symbols yet', () => {
  const doc = read(docPath);
  const productSource = [
    'package.json',
    'package-lock.json',
    '.gitignore',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'channel-identity-watch-mix-collab-recovery-plan.md',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs',
    'js/background.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
  ].map(read).join('\n');

  for (const symbol of [
    'rootPackageMetadataAuthority',
    'packageScriptExecutionGate',
    'packageLockReproducibilityReport',
    'rootDocClaimParityReport',
    'rootGitignoreEvidenceBoundary',
    'rootReleaseClaimGate',
    'rootJsonFirstClaimGate',
    'rootMetadataDeletionReadinessReport',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }

  assert.match(doc, /This register does not close root-project-metadata tracked-file obligations/);
  assert.match(doc, /explicit JSON-first promotion gates before runtime code changes/);
});
