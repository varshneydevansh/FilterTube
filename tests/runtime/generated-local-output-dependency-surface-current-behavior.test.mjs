import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function filePath(file) {
  return path.join(repoRoot, file);
}

function walk(dir) {
  const root = filePath(dir);
  if (!fs.existsSync(root)) return [];
  const out = [];
  const visit = (current) => {
    for (const name of fs.readdirSync(current)) {
      const child = path.join(current, name);
      const stat = fs.lstatSync(child);
      if (stat.isDirectory()) visit(child);
      else if (stat.isFile()) out.push(path.relative(repoRoot, child));
    }
  };
  visit(root);
  return out.sort();
}

function byteCount(file) {
  return fs.statSync(filePath(file)).size;
}

function totalBytes(files) {
  return files.reduce((sum, file) => sum + byteCount(file), 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(file))).digest('hex');
}

function git(args) {
  const output = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  return output ? output.split('\n') : [];
}

function checkIgnore(pathname) {
  return execFileSync('git', ['check-ignore', '-v', pathname], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}

function topLevelBreakdown(files, root) {
  const counts = {};
  for (const file of files) {
    const rel = path.relative(root, filePath(file));
    const top = rel.split(path.sep)[0];
    counts[top] = (counts[top] || 0) + 1;
  }
  return counts;
}

function packageJsonCount(dir) {
  return walk(dir).filter((file) => path.basename(file) === 'package.json').length;
}

test('generated local output dependency surface doc is audit-only and scoped to ignored output', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /first-class JSON\s+filter promotion/);
  assert.match(doc, /do not close product-runtime proof obligations/);

  for (const pathName of [
    'dist',
    'node_modules',
    'website/.next',
    'website/.vercel',
    'website/node_modules',
  ]) {
    assert.match(doc, new RegExp(pathName.replace(/[/.]/g, '\\$&')));
  }
});

test('ignored generated output and dependency cache footprints are pinned', () => {
  const doc = read(docPath);
  const expected = {
    dist: { files: 180, bytes: 61493319, ignore: /\.gitignore:6:dist\// },
    node_modules: { files: 956, bytes: 26325623, ignore: /\.gitignore:2:node_modules\// },
    'website/.next': { files: 2468, bytes: 388755617, ignore: /\.gitignore:12:website\/\.next\// },
    'website/.vercel': { files: 291, bytes: 29815128, ignore: /website\/\.gitignore:1:\.vercel/ },
    'website/node_modules': { files: 18619, bytes: 325539259, ignore: /\.gitignore:2:node_modules\// },
  };

  for (const [dir, info] of Object.entries(expected)) {
    const files = walk(dir);
    assert.equal(git(['ls-files', dir]).length, 0, `${dir} should not be tracked`);
    assert.match(checkIgnore(dir), info.ignore, `${dir} ignore owner drifted`);
    assert.equal(files.length, info.files, `${dir} file count drifted`);
    assert.equal(totalBytes(files), info.bytes, `${dir} byte footprint drifted`);
    assert.match(doc, new RegExp(`${info.files.toLocaleString('en-US')}`.replace(/,/g, ',')));
    assert.match(doc, new RegExp(`${info.bytes.toLocaleString('en-US')}`.replace(/,/g, ',')));
  }

  assert.match(doc, /All five paths are absent from `git ls-files` today/);
});

test('dist package trees and zip artifacts are current local output not package authority', () => {
  const doc = read(docPath);
  const expectedBreakdown = {
    'CHANGELOG.md': 1,
    LICENSE: 1,
    'README.md': 1,
    assets: 3,
    css: 8,
    data: 1,
    html: 3,
    icons: 7,
    js: 33,
    'manifest.json': 1,
  };
  const expectedBrowsers = {
    chrome: {
      bytes: 11808978,
      manifestHash: '282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734',
    },
    firefox: {
      bytes: 11809068,
      manifestHash: 'a1773c9e0acc1c2029cb6aef4757a282aa0ec8d89759be65ea975ff237d00bb0',
    },
    opera: {
      bytes: 11808983,
      manifestHash: '0f0b77df312bf8b45a40e652bd7fc4ee4af270945b4e38e9353ebfdc1caf1e2b',
    },
  };

  for (const [browser, info] of Object.entries(expectedBrowsers)) {
    const dir = `dist/${browser}`;
    const files = walk(dir);
    assert.equal(files.length, 59);
    assert.equal(totalBytes(files), info.bytes);
    assert.deepEqual(topLevelBreakdown(files, filePath(dir)), expectedBreakdown);
    assert.equal(sha256(`${dir}/manifest.json`), info.manifestHash);
    assert.match(doc, new RegExp(`dist/${browser}`));
    assert.match(doc, new RegExp(info.manifestHash));
  }

  for (const [zip, bytes, hash] of [
    ['dist/filtertube-chrome-v3.3.2.zip', 8728281, 'a14599fc1726507dbdfa049b9640f218c8538f367b6120b065c35fb7287628fb'],
    ['dist/filtertube-firefox-v3.3.2.zip', 8728340, '4e64521b8ed5b4385a41896864794d1dae0d31f73b27f8d30973add7cbe00cc4'],
    ['dist/filtertube-opera-v3.3.2.zip', 8728283, '475ae17a9b4c9f2c71a4b80b6e120f612d511a473bb888feeedbedb4459752db'],
  ]) {
    assert.equal(byteCount(zip), bytes, `${zip} size drifted`);
    assert.equal(sha256(zip), hash, `${zip} hash drifted`);
    assert.match(doc, new RegExp(zip.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(hash));
  }

  const build = read('build.js');
  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\];/);
  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/);
  assert.match(build, /archive\.glob\('\*\*\/\*'/);
  assert.doesNotMatch(build, /distPackageFreshnessReport/);
  assert.match(doc, /Quarantined CSS, empty HTML, generated shells, vendor bundles, and static\s+media remain visible in `dist`/);
});

test('website next and vercel generated artifacts are ignored local build evidence only', () => {
  const doc = read(docPath);

  for (const [file, bytes, hash] of [
    ['website/.next/BUILD_ID', 21, '4c389801947d6972b7054c5a9255350fd52d2a6d698328a05d2f8765c0006389'],
    ['website/.next/routes-manifest.json', 2587, 'b23a2794a00d1493a1680bf76d595212116c761ee0c6b7b265d279730c5da9d0'],
    ['website/.next/prerender-manifest.json', 12680, '96a18ed5ddc1c7cdd0ee51f240e277875a0c9a6d07e956d9a7e5946874f1b309'],
    ['website/.vercel/project.json', 369, '056ce6a7ea8449fb9e28d91b2164152ad5e91912a91adbfb97a8a5639d91eb5f'],
    ['website/.vercel/output/config.json', 6050, 'ac5af2611c3ae7d01e654208ffa5f184ee3cb90f40899a093932b8b510d918c6'],
  ]) {
    assert.equal(byteCount(file), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(hash));
  }

  assert.deepEqual(read('website/.vercelignore').trim().split(/\r?\n/), [
    '.git',
    '.vercel',
    '.next',
    'node_modules',
  ]);
  assert.match(doc, /`.next` and `\.vercel` outputs need command, revision, route, screenshot, and\s+deploy evidence/);
});

test('root and website node_modules are local install caches, not dependency proof', () => {
  const doc = read(docPath);

  assert.equal(packageJsonCount('node_modules'), 92);
  assert.equal(packageJsonCount('website/node_modules'), 295);
  assert.equal(byteCount('node_modules/.package-lock.json'), 50306);
  assert.equal(sha256('node_modules/.package-lock.json'), 'bfa5cbafaa82b0d6f33ec3eaa223c1afc5e28628e691569a1af04700ddad6c94');
  assert.equal(byteCount('website/node_modules/.package-lock.json'), 23958);
  assert.equal(sha256('website/node_modules/.package-lock.json'), '3201e68ac25498574baf387d4d0260bfdef61bd74043ad587f71026f86d703e0');

  assert.match(doc, /956 files and 92 package manifests/);
  assert.match(doc, /18,619 files and 295 package\s+manifests/);
  assert.match(doc, /The tracked authority for dependency intent remains `package-lock\.json` and\s+`website\/package-lock\.json`/);
});

test('generated local output dependency surface has no product authority symbols yet', () => {
  const doc = read(docPath);
  const productSource = git(['ls-files'])
    .filter((file) => !file.startsWith('docs/audit/'))
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => /\.(js|mjs|jsx|json|md|css|html|gitignore|vercelignore)$/.test(file) || ['LICENSE', '.gitignore'].includes(file))
    .map(read)
    .join('\n');

  for (const symbol of [
    'generatedLocalOutputBoundaryAuthority',
    'localDependencyCacheAuthority',
    'distPackageFreshnessReport',
    'distZipChecksumManifest',
    'nextBuildArtifactFreshnessReport',
    'vercelOutputReleaseAuthority',
    'nodeModulesDependencyProof',
    'generatedOutputCleanupDecision',
    'firstClassJsonFilterPackageGate',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }
});
