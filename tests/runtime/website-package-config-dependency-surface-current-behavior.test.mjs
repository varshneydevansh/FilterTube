import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const websiteBuildRouteFamilyDocs = [
  'docs/audit/FILTERTUBE_BUILD_WEBSITE_CALLABLE_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_WEBSITE_DYNAMIC_ROUTE_METHOD_SEMANTIC_REGISTER_2026-05-22.md',
  'docs/audit/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_WEBSITE_REMOTE_REQUEST_PRIVACY_PERFORMANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WEBSITE_ROUTE_ASSET_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_WEBSITE_ROUTE_BUILD_SMOKE_ARTIFACT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21.md'
];
const configRows = [
  ['website/.gitignore', 1, 8, '56537ebe03160a28fdb6e59ae18f408d6f8aba609df73c45917c9358fd3bad52'],
  ['website/.vercelignore', 4, 32, 'c75b041d4aebf02fc3d9c6d5476ea87c352b2d6ed6847dc78bdc3d68c6475c2f'],
  ['website/jsconfig.json', 10, 109, '4bb3b6b8c5a33e560cd100639fde580f7b098c805bb0caf908ac2ad6d45e8ef1'],
  ['website/next.config.mjs', 12, 250, 'ab2d3beb7a94f0264112c0cdb5372d724cdf36c683c0d44005352021b257b9f6'],
  ['website/package.json', 23, 477, '881918c3694fca755065dd9e29cb24613fa35af162c174dd8e68bf273ac62351'],
  ['website/package-lock.json', 1678, 55337, '468e8779d0c2826fb258a783ffe88a735b3269964c23ad510ae3118ac17b6b10'],
  ['website/postcss.config.mjs', 5, 70, '5b0bc4c78be977cd81f947fb5563aaa7cc6d451e6f1c53a3260b7656a7144d20'],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function byteCount(file) {
  return fs.statSync(filePath(file)).size;
}

function newlineCount(file) {
  return (read(file).match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(file))).digest('hex');
}

function git(args) {
  const out = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  return out ? out.split('\n') : [];
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function escapeRegExp(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function websiteAppComponentSource() {
  return git(['ls-files', 'website/app', 'website/components'])
    .filter((file) => file.endsWith('.js'))
    .map(read)
    .join('\n');
}

test('website package config dependency surface doc is audit-only and fingerprint pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);
  const tracked = git(['ls-files', ...configRows.map(([file]) => file)]);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /does not prove a fresh website build, public deployment, route screenshot/);
  assert.deepEqual(tracked.sort(), configRows.map(([file]) => file).sort());

  assert.equal(configRows.reduce((sum, [, lines]) => sum + lines, 0), 1733);
  assert.equal(configRows.reduce((sum, [, , bytes]) => sum + bytes, 0), 56283);
  assert.match(doc, /7 files/);
  assert.match(doc, /1,733 newline counts/);
  assert.match(doc, /56,283 bytes/);

  for (const [file, lines, bytes, hash] of configRows) {
    assert.equal(newlineCount(file), lines, `${file} newline count drifted`);
    assert.equal(byteCount(file), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(escapeRegExp(file)));
    assert.match(doc, new RegExp(formatNumber(bytes)));
    assert.match(doc, new RegExp(hash));
  }

  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);

  assert.equal(websiteBuildRouteFamilyDocs.length, 8);
  for (const familyDocPath of websiteBuildRouteFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5812/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5812/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('website package scripts engine and direct dependency intent are pinned', () => {
  const pkg = readJson('website/package.json');
  const lock = readJson('website/package-lock.json');
  const doc = read(docPath);

  assert.equal(pkg.name, 'filtertube-website');
  assert.equal(pkg.private, true);
  assert.equal(pkg.version, '1.0.0');
  assert.deepEqual(pkg.scripts, {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
  });
  assert.deepEqual(pkg.engines, { node: '22.x' });
  assert.equal(pkg.scripts.test, undefined);
  assert.equal(pkg.scripts.lint, undefined);
  assert.equal(pkg.scripts.typecheck, undefined);
  assert.equal(Object.hasOwn(pkg, 'packageManager'), false);

  assert.deepEqual(pkg.dependencies, {
    '@phosphor-icons/react': '^2.1.10',
    '@tailwindcss/postcss': '^4.2.1',
    '@vercel/analytics': '^2.0.1',
    next: '^16.1.6',
    postcss: '^8.5.8',
    react: '^19.2.4',
    'react-dom': '^19.2.4',
    tailwindcss: '^4.2.1',
  });
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].engines, { node: '22.x' });

  for (const [packagePath, version] of [
    ['node_modules/@phosphor-icons/react', '2.1.10'],
    ['node_modules/@tailwindcss/postcss', '4.2.1'],
    ['node_modules/@vercel/analytics', '2.0.1'],
    ['node_modules/next', '16.1.6'],
    ['node_modules/postcss', '8.5.8'],
    ['node_modules/react', '19.2.4'],
    ['node_modules/react-dom', '19.2.4'],
    ['node_modules/tailwindcss', '4.2.1'],
  ]) {
    assert.equal(lock.packages[packagePath].version, version, `${packagePath} locked version drifted`);
    assert.match(doc, new RegExp(escapeRegExp(version)));
  }

  assert.match(doc, /There is no website-specific `test`, `lint`, `typecheck`, `format`,\s+`audit:runtime`, screenshot, route-smoke, dependency-repro, or deploy-proof/);
  assert.match(doc, /next engine: >=20\.9\.0/);
  assert.match(doc, /@tailwindcss\/oxide engine: >= 20/);
  assert.match(doc, /sharp engine: \^18\.17\.0 \|\| \^20\.3\.0 \|\| >=21\.0\.0/);
});

test('website lockfile reproducibility surface records package counts integrity exceptions and licenses', () => {
  const lock = readJson('website/package-lock.json');
  const doc = read(docPath);
  const nonRoot = Object.entries(lock.packages).filter(([name]) => name);
  const licenseCounts = {};
  const deprecated = [];
  const missingIntegrity = [];
  const optional = [];
  const dev = [];

  for (const [name, metadata] of nonRoot) {
    licenseCounts[metadata.license || '(missing)'] = (licenseCounts[metadata.license || '(missing)'] || 0) + 1;
    if (metadata.deprecated) deprecated.push([name, metadata.deprecated]);
    if (!metadata.integrity && !metadata.link) missingIntegrity.push(name);
    if (metadata.optional) optional.push(name);
    if (metadata.dev) dev.push(name);
  }

  assert.equal(lock.name, 'filtertube-website');
  assert.equal(lock.version, '1.0.0');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(Object.keys(lock.packages).length, 101);
  assert.equal(nonRoot.length, 100);
  assert.equal(optional.length, 65);
  assert.equal(dev.length, 0);
  assert.deepEqual(deprecated, []);
  assert.deepEqual(licenseCounts, {
    MIT: 53,
    'Apache-2.0': 14,
    'MPL-2.0': 12,
    'LGPL-3.0-or-later': 10,
    ISC: 3,
    'Apache-2.0 AND LGPL-3.0-or-later': 3,
    '0BSD': 2,
    'Apache-2.0 AND LGPL-3.0-or-later AND MIT': 1,
    'BSD-3-Clause': 1,
    'CC-BY-4.0': 1,
  });
  assert.deepEqual(missingIntegrity, [
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/core',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/runtime',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/wasi-threads',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@napi-rs/wasm-runtime',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@tybys/wasm-util',
    'node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib',
  ]);

  for (const name of missingIntegrity) {
    assert.equal(lock.packages[name].inBundle, true, `${name} should remain bundled`);
    assert.equal(lock.packages[name].optional, true, `${name} should remain optional`);
    assert.match(doc, new RegExp(escapeRegExp(name)));
  }

  assert.match(doc, /packages entries: 101/);
  assert.match(doc, /non-root package entries: 100/);
  assert.match(doc, /optional package entries: 65/);
  assert.match(doc, /dev package entries: 0/);
  assert.match(doc, /deprecated package entries: 0/);
  assert.match(doc, /Six non-root package entries lack a top-level integrity value/);
});

test('website build config and ignored output boundaries remain explicit', () => {
  const jsconfig = readJson('website/jsconfig.json');
  const nextConfig = read('website/next.config.mjs');
  const postcss = read('website/postcss.config.mjs');
  const vercelIgnore = read('website/.vercelignore');
  const websiteGitignore = read('website/.gitignore');
  const rootGitignore = read('.gitignore');
  const doc = read(docPath);

  assert.deepEqual(jsconfig, {
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./*'],
      },
    },
  });
  assert.match(nextConfig, /import \{ fileURLToPath \} from "node:url"/);
  assert.match(nextConfig, /optimizePackageImports: \["@phosphor-icons\/react"\]/);
  assert.match(nextConfig, /root: fileURLToPath\(new URL\("\.\/", import\.meta\.url\)\)/);
  assert.match(postcss, /"@tailwindcss\/postcss": \{\}/);
  assert.deepEqual(vercelIgnore.trim().split(/\r?\n/), ['.git', '.vercel', '.next', 'node_modules']);
  assert.equal(websiteGitignore.trim(), '.vercel');
  assert.match(rootGitignore, /node_modules\//);
  assert.match(rootGitignore, /website\/\.next\//);

  for (const ignoredPath of [
    'website/.next/BUILD_ID',
    'website/node_modules/.package-lock.json',
    'website/.vercel/project.json',
  ]) {
    const output = execFileSync('git', ['check-ignore', '-v', ignoredPath], { cwd: repoRoot, encoding: 'utf8' });
    assert.ok(output.includes(ignoredPath), `${ignoredPath} should be ignored`);
  }

  assert.match(doc, /Next, PostCSS, jsconfig, gitignore, and Vercel ignore files are pinned/);
  assert.match(doc, /no artifact ties them to the current `\.next`, `\.vercel`, public route output/);
});

test('website analytics and runtime scope stay website-only in tracked source', () => {
  const layout = read('website/app/layout.js');
  const themeToggle = read('website/components/theme-toggle.js');
  const sceneController = read('website/components/scene-controller.js');
  const source = websiteAppComponentSource();
  const doc = read(docPath);

  assert.match(layout, /import \{ Analytics \} from "@vercel\/analytics\/next"/);
  assert.match(layout, /import Script from "next\/script"/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /window\.localStorage\.getItem\('filtertube-theme'\)/);

  assert.equal((themeToggle.match(/localStorage/g) || []).length, 2);
  assert.equal((themeToggle.match(/addEventListener/g) || []).length, 2);
  assert.equal((themeToggle.match(/dispatchEvent/g) || []).length, 1);
  assert.equal((sceneController.match(/addEventListener/g) || []).length, 1);
  assert.equal((sceneController.match(/setTimeout/g) || []).length, 1);
  assert.equal((sceneController.match(/clearTimeout/g) || []).length, 2);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /MutationObserver/);

  assert.match(doc, /website-only and do not prove or change browser extension/);
  assert.match(doc, /website\/app\/components source contains no fetch\(\) calls/);
  assert.match(doc, /website\/app\/components source contains no MutationObserver usage/);
});

test('website package config dependency surface has no authority symbols yet', () => {
  const doc = read(docPath);
  const productSource = [
    'website/.gitignore',
    'website/.vercelignore',
    'website/jsconfig.json',
    'website/next.config.mjs',
    'website/package.json',
    'website/package-lock.json',
    'website/postcss.config.mjs',
    'website/app/layout.js',
    'website/app/page.js',
    'website/app/downloads/page.js',
    'website/components/route-content.js',
    'website/components/theme-toggle.js',
    'website/components/scene-controller.js',
  ].map(read).join('\n');

  for (const symbol of [
    'websitePackageConfigAuthority',
    'websiteDependencyReproducibilityReport',
    'websiteLockfileIntegrityReport',
    'websiteNodeEngineContract',
    'websiteBuildScriptProof',
    'websiteRouteSmokeProof',
    'websiteAnalyticsScopeAuthority',
    'websiteDeployArtifactGate',
    'websiteFirstClassJsonClaimGate',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }
});
