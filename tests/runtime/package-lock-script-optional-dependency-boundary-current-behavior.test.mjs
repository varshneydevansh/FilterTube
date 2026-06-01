import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PACKAGE_LOCK_SCRIPT_OPTIONAL_DEPENDENCY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const selectedProductFiles = [
  'package.json',
  'package-lock.json',
  'website/package.json',
  'website/package-lock.json',
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs',
  'website/next.config.mjs',
];

const futureSymbols = [
  'packageLockScriptOptionalDependencyBoundaryContract',
  'packageLockLifecycleScriptReport',
  'packageLockOptionalPlatformPackageReport',
  'packageLockBinEntryReport',
  'packageLockIntegrityExceptionReport',
  'packageLockReproducibleInstallGate',
  'packageLockLicensePolicyReport',
  'packageLockFirstClassJsonConfigGate',
  'packageLockDependencyBurdenBudget',
  'packageLockReleaseArtifactDependencyReport',
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function lineCount(source) {
  return source.endsWith('\n') ? source.split(/\r?\n/).length - 1 : source.split(/\r?\n/).length;
}

function fileMetrics(file) {
  const source = read(file);
  return {
    lines: lineCount(source),
    bytes: Buffer.byteLength(source),
    sha256: sha256(source),
  };
}

function summarizeLock(file) {
  const lock = readJson(file);
  const entries = Object.entries(lock.packages || {});
  const nonRoot = entries.filter(([packagePath]) => packagePath);
  const pathsWhere = (predicate) => nonRoot.filter(([, value]) => predicate(value)).map(([packagePath]) => packagePath);
  const licenseCounts = {};
  const resolvedHosts = {};

  for (const [, value] of nonRoot) {
    licenseCounts[value.license || '(missing)'] = (licenseCounts[value.license || '(missing)'] || 0) + 1;
    if (value.resolved) {
      const host = new URL(value.resolved).host;
      resolvedHosts[host] = (resolvedHosts[host] || 0) + 1;
    }
  }

  return {
    lockfileVersion: lock.lockfileVersion,
    packages: entries.length,
    nonRoot: nonRoot.length,
    root: lock.packages[''],
    hasInstallScript: pathsWhere((value) => value.hasInstallScript === true),
    bin: pathsWhere((value) => value.bin),
    optional: pathsWhere((value) => value.optional === true),
    dev: pathsWhere((value) => value.dev === true),
    peerDependencies: pathsWhere((value) => value.peerDependencies),
    optionalDependencies: pathsWhere((value) => value.optionalDependencies),
    noIntegrity: pathsWhere((value) => !value.integrity),
    noResolved: pathsWhere((value) => !value.resolved),
    missingLicense: pathsWhere((value) => !value.license),
    bundledMarkers: pathsWhere((value) => value.bundled === true || value.inBundle === true || value.bundleDependencies || value.bundledDependencies),
    engines: pathsWhere((value) => value.engines),
    licenseCounts,
    resolvedHosts,
  };
}

function doc() {
  return read(docPath);
}

test('package lock script optional dependency boundary doc is audit-only', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /package upgrade, dependency cleanup, install-policy/);
  assert.match(source, /These files are JSON configuration and release\/build inputs/);
  assert.match(source, /not\s+YouTube response JSON/);
  assert.match(source, /first-class schema, install, package,\s+license, dependency-health, and reproducibility proof/);
  assert.match(source, /Implementation changes remain blocked/);
});

test('package JSON and lockfile fingerprints remain pinned', () => {
  const expected = {
    'package.json': {
      lines: 61,
      bytes: 2405,
      sha256: '36053d322780ce787de403be574cc400936ef2a994b4c8eca62561154fe81aec',
    },
    'package-lock.json': {
      lines: 1461,
      bytes: 49916,
      sha256: 'f52d6482693be9cd4edacdc1f1491b4d2cda796522bfd0e4dcf86e0c879ad974',
    },
    'website/package.json': {
      lines: 23,
      bytes: 477,
      sha256: '881918c3694fca755065dd9e29cb24613fa35af162c174dd8e68bf273ac62351',
    },
    'website/package-lock.json': {
      lines: 1678,
      bytes: 55337,
      sha256: '468e8779d0c2826fb258a783ffe88a735b3269964c23ad510ae3118ac17b6b10',
    },
  };

  for (const [file, metrics] of Object.entries(expected)) {
    assert.deepEqual(fileMetrics(file), metrics);
  }

  const source = doc();
  assert.match(source, /`package\.json` \| 61 \| 2,405/);
  assert.match(source, /`package-lock\.json` \| 1,461 \| 49,916/);
  assert.match(source, /`website\/package\.json` \| 23 \| 477/);
  assert.match(source, /`website\/package-lock\.json` \| 1,678 \| 55,337/);
});

test('root package lock JSON paths and lifecycle markers remain pinned', () => {
  const pkg = readJson('package.json');
  const summary = summarizeLock('package-lock.json');

  assert.equal(pkg.name, 'filtertube');
  assert.equal(pkg.version, '3.3.2');
  assert.equal(Object.keys(pkg.scripts).length, 27);
  assert.deepEqual(Object.keys(pkg.dependencies), ['preact', 'qrcode']);
  assert.deepEqual(Object.keys(pkg.devDependencies), ['archiver', 'esbuild', 'fs-extra']);
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.engines, undefined);
  assert.equal(pkg.packageManager, undefined);
  assert.equal(pkg.scripts.test, 'node scripts/run-test-lane.mjs smoke');
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');

  assert.equal(summary.lockfileVersion, 3);
  assert.equal(summary.packages, 112);
  assert.equal(summary.nonRoot, 111);
  assert.equal(summary.root.name, 'filtertube');
  assert.equal(summary.root.version, '3.3.2');
  assert.deepEqual(summary.root.dependencies, pkg.dependencies);
  assert.deepEqual(summary.root.devDependencies, pkg.devDependencies);
  assert.deepEqual(summary.hasInstallScript, ['node_modules/esbuild']);
  assert.deepEqual(summary.bin, ['node_modules/crc-32', 'node_modules/esbuild', 'node_modules/qrcode']);
  assert.equal(summary.optional.length, 26);
  assert.ok(summary.optional.every((packagePath) => packagePath.startsWith('node_modules/@esbuild/')));
  assert.equal(summary.dev.length, 81);
  assert.equal(summary.peerDependencies.length, 0);
  assert.deepEqual(summary.optionalDependencies, ['node_modules/esbuild', 'node_modules/jsonfile']);
  assert.equal(summary.noIntegrity.length, 0);
  assert.equal(summary.noResolved.length, 0);
  assert.equal(summary.missingLicense.length, 0);
  assert.equal(summary.bundledMarkers.length, 0);
  assert.equal(summary.engines.length, 66);
  assert.deepEqual(summary.licenseCounts, {
    MIT: 92,
    ISC: 16,
    'Apache-2.0': 2,
    'BSD-3-Clause': 1,
  });
  assert.deepEqual(summary.resolvedHosts, {
    'registry.npmjs.org': 111,
  });

  const source = doc();
  assert.match(source, /`hasInstallScript` entries: 1 \(`node_modules\/esbuild`\)/);
  assert.match(source, /`bin` entries: 3 \(`node_modules\/crc-32`, `node_modules\/esbuild`, `node_modules\/qrcode`\)/);
  assert.match(source, /optional package entries: 26, all in the `@esbuild\/\*` platform package family/);
  assert.match(source, /non-root package entries with missing `integrity`: 0/);
  assert.match(source, /resolved hosts: `registry\.npmjs\.org` for all 111 non-root entries/);
});

test('website package lock JSON paths optional packages and integrity exceptions remain pinned', () => {
  const pkg = readJson('website/package.json');
  const summary = summarizeLock('website/package-lock.json');
  const bundledNested = [
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/core',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/runtime',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/wasi-threads',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@napi-rs/wasm-runtime',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@tybys/wasm-util',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib',
  ];

  assert.equal(pkg.name, 'filtertube-website');
  assert.equal(pkg.private, true);
  assert.equal(pkg.version, '1.0.0');
  assert.deepEqual(Object.keys(pkg.scripts), ['dev', 'build', 'start']);
  assert.deepEqual(pkg.engines, { node: '22.x' });
  assert.deepEqual(Object.keys(pkg.dependencies), [
    '@phosphor-icons/react',
    '@tailwindcss/postcss',
    '@vercel/analytics',
    'next',
    'postcss',
    'react',
    'react-dom',
    'tailwindcss',
  ]);
  assert.equal(pkg.devDependencies, undefined);
  for (const script of ['test', 'lint', 'audit:runtime', 'screenshot', 'route-smoke', 'dependency-repro', 'deploy-proof']) {
    assert.equal(pkg.scripts[script], undefined);
  }

  assert.equal(summary.lockfileVersion, 3);
  assert.equal(summary.packages, 101);
  assert.equal(summary.nonRoot, 100);
  assert.equal(summary.root.name, 'filtertube-website');
  assert.equal(summary.root.version, '1.0.0');
  assert.deepEqual(summary.root.dependencies, pkg.dependencies);
  assert.deepEqual(summary.root.engines, pkg.engines);
  assert.deepEqual(summary.hasInstallScript, ['node_modules/sharp']);
  assert.deepEqual(summary.bin, [
    'node_modules/baseline-browser-mapping',
    'node_modules/jiti',
    'node_modules/nanoid',
    'node_modules/next',
    'node_modules/semver',
  ]);
  assert.equal(summary.optional.length, 65);
  assert.equal(summary.dev.length, 0);
  assert.deepEqual(summary.peerDependencies, [
    'node_modules/@phosphor-icons/react',
    'node_modules/@vercel/analytics',
    'node_modules/next',
    'node_modules/react-dom',
    'node_modules/styled-jsx',
  ]);
  assert.equal(summary.optionalDependencies.length, 14);
  assert.deepEqual(summary.noIntegrity, bundledNested);
  assert.deepEqual(summary.noResolved, bundledNested);
  assert.equal(summary.missingLicense.length, 0);
  assert.equal(summary.bundledMarkers.length, 7);
  assert.ok(summary.bundledMarkers.every((packagePath) => packagePath.startsWith('node_modules/@tailwindcss/oxide-wasm32-wasi')));
  assert.equal(summary.engines.length, 64);
  assert.deepEqual(summary.resolvedHosts, {
    'registry.npmjs.org': 94,
  });
  assert.deepEqual(summary.licenseCounts, {
    MIT: 53,
    'Apache-2.0': 14,
    'LGPL-3.0-or-later': 10,
    'Apache-2.0 AND LGPL-3.0-or-later AND MIT': 1,
    'Apache-2.0 AND LGPL-3.0-or-later': 3,
    '0BSD': 2,
    'CC-BY-4.0': 1,
    ISC: 3,
    'MPL-2.0': 12,
    'BSD-3-Clause': 1,
  });

  const source = doc();
  assert.match(source, /`hasInstallScript` entries: 1 \(`node_modules\/sharp`\)/);
  assert.match(source, /`bin` entries: 5 \(`node_modules\/baseline-browser-mapping`, `node_modules\/jiti`,\s+`node_modules\/nanoid`, `node_modules\/next`, `node_modules\/semver`\)/);
  assert.match(source, /optional package entries: 65/);
  assert.match(source, /non-root package entries with missing `integrity`: 6/);
  assert.match(source, /non-root package entries with missing `resolved`: 6/);
  assert.match(source, /bundled marker entries: 7/);
  assert.match(source, /`MPL-2\.0`: 12/);
});

test('package lock boundary preserves non-completion and future authority gates', () => {
  const source = doc();

  assert.match(source, /This slice does not prove dependency health/);
  assert.match(source, /clean-install reproducibility/);
  assert.match(source, /license compliance/);
  assert.match(source, /package artifact contents/);
  assert.match(source, /vulnerability status/);
  assert.match(source, /generated bundle freshness/);
  assert.match(source, /permission to upgrade\/delete packages/);

  for (const symbol of futureSymbols) {
    assert.match(source, new RegExp(symbol));
  }
});

test('package lock boundary authority symbols are absent from selected product source', () => {
  const productSource = selectedProductFiles.map(read).join('\n');

  for (const symbol of futureSymbols) {
    assert.doesNotMatch(productSource, new RegExp(symbol));
  }
});
