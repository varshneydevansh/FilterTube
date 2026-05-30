import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const buildScriptPath = 'scripts/build-nanah-vendor.mjs';
const vendorFiles = [
  'js/vendor/nanah.bundle.js',
  'js/vendor/qrcode.bundle.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function sha256Absolute(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function nanahRoot() {
  return path.resolve(repoRoot, '..', 'nanah');
}

function nanahGit(args) {
  return execFileSync('git', ['-C', nanahRoot(), ...args], {
    encoding: 'utf8'
  }).trim();
}

function nanahRelative(file) {
  return path.join(nanahRoot(), file);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function groupForName(name) {
  if (name === 'ensureDir') return 'vendorDirectoryPreparation';
  if (name === 'buildQrcodeBundle') return 'qrcodeVendorBundleBuild';
  if (name === 'buildNanahBundle') return 'nanahVendorBundleBuild';
  if (name === 'main') return 'vendorBuildOrchestration';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(buildScriptPath).split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const match = line.match(/^async function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({
        file: buildScriptPath,
        line: lineNumber,
        kind: 'asyncFunction',
        name: match[1],
        group: groupForName(match[1])
      });
    }
  });
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function scriptRefs(file) {
  return [...read(file).matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
}

function assertVendorFreshnessFlowAndProvenance() {
  const text = doc();
  const packageJson = readJson('package.json');
  const qrcodeLock = readJson('package-lock.json').packages['node_modules/qrcode'];
  const statusRows = nanahGit(['status', '--short']).split('\n').filter(Boolean);

  assert.match(text, /## Vendor Freshness Flow - 2026-05-27/);
  assert.match(text, /npm run build:nanah-vendor/);
  assert.match(text, /node scripts\/build-nanah-vendor\.mjs/);
  assert.match(text, /node_modules\/qrcode\/lib\/browser\.js/);
  assert.match(text, /\.\.\/nanah\/packages\/core\/src\/index\.ts/);
  assert.match(text, /\.\.\/nanah\/packages\/client\/src\/index\.ts/);
  assert.match(text, /no vendor freshness manifest is written/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /release package proof remains NO-GO/);
  assert.match(text, /runtime behavior changed: no/);

  for (const file of [
    'scripts/build-nanah-vendor.mjs',
    'js/vendor/nanah.bundle.js',
    'js/vendor/qrcode.bundle.js',
    'package.json',
    'package-lock.json',
    'html/tab-view.html',
    'js/nanah_sync_adapter.js',
    'js/tab-view.js'
  ]) {
    assert.ok(text.includes(`| \`${file}\` |`), `missing artifact row for ${file}`);
    assert.ok(text.includes(`\`${sha256(file)}\``), `missing current sha256 for ${file}`);
  }

  assert.equal(packageJson.dependencies.qrcode, '^1.5.4');
  assert.equal(qrcodeLock.version, '1.5.4');
  assert.equal(qrcodeLock.resolved, 'https://registry.npmjs.org/qrcode/-/qrcode-1.5.4.tgz');
  assert.equal(
    qrcodeLock.integrity,
    'sha512-1ca71Zgiu6ORjHqFBDpnSMTR2ReToX4l1Au1VFLyVeBTFavzQnv5JxMFr3ukHVKpSrSA2MCk0lNJSykjUfz7Zg=='
  );

  assert.ok(text.includes(`nanah repo path: ${nanahRoot()}`));
  assert.ok(text.includes(`nanah branch: ${nanahGit(['rev-parse', '--abbrev-ref', 'HEAD'])}`));
  assert.ok(text.includes(`nanah HEAD: ${nanahGit(['rev-parse', 'HEAD'])}`));
  assert.ok(text.includes(`nanah dirty status rows: ${statusRows.length}`));
  for (const row of statusRows) {
    const dirtyFile = row.replace(/^[ MADRCU?!]{1,2}\s+/, '');
    assert.ok(text.includes(`nanah dirty file: ${dirtyFile}`), `missing dirty file ${dirtyFile}`);
  }

  for (const [label, file] of [
    ['nanah core entry hash', 'packages/core/src/index.ts'],
    ['nanah client entry hash', 'packages/client/src/index.ts'],
    ['nanah dirty core codes hash', 'packages/core/src/codes.ts'],
    ['nanah dirty signaling worker hash', 'packages/signaling-cloudflare/src/index.ts']
  ]) {
    assert.ok(
      text.includes(`${label}: ${sha256Absolute(nanahRelative(file))}`),
      `missing Nanah source hash ${label}`
    );
  }

  for (const token of [
    'none of those sibling Nanah facts are',
    'embedded in `js/vendor/nanah.bundle.js` as a first-class release manifest',
    'tracked output alone does not prove the sibling repo commit, dirty state',
    'vendor freshness manifest: absent',
    'vendor source revision manifest: absent',
    'vendor build failure rollback: absent',
    'stale vendor bundle deletion on failure: absent',
    'normal package build vendor rebuild: absent',
    'sibling dirty-state release gate: absent'
  ]) {
    assert.ok(text.includes(token), `missing vendor freshness token ${token}`);
  }
}

test('Nanah vendor build register is audit-only and source scoped', () => {
  const text = doc();
  const buildScript = read(buildScriptPath);
  const vendorText = vendorFiles.map(read).join('\n');

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime and build behavior are unchanged/);
  assert.match(text, /scripts\/build-nanah-vendor\.mjs/);
  assert.match(text, /js\/vendor\/nanah\.bundle\.js/);
  assert.match(text, /js\/vendor\/qrcode\.bundle\.js/);
  assert.match(text, /html\/tab-view\.html/);
  assert.match(text, /js\/tab-view\.js/);
  assert.match(text, /js\/nanah_sync_adapter\.js/);
  assert.equal(sourceLineCount(buildScript), 65);
  assert.equal(vendorFiles.reduce((sum, file) => sum + sourceLineCount(read(file)), 0), 2961);
  assert.match(text, /build script line count: 65/);
  assert.match(text, /vendor output line count: 2961/);
  assert.match(text, /build script bytes: 1818/);
  assert.match(text, /vendor output bytes: 94657/);
  assert.match(text, /runtime behavior changed: no/);
  assert.doesNotMatch(buildScript, /nanahVendorBuildMethodAuthority/);
  assert.doesNotMatch(vendorText, /nanahVendorBuildMethodAuthority/);
});

test('Nanah vendor build register accounts for every current build script method row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 4);
  assert.deepEqual(countBy(rows, 'kind'), {
    asyncFunction: 4
  });
  assert.deepEqual(countBy(rows, 'group'), {
    nanahVendorBundleBuild: 1,
    qrcodeVendorBundleBuild: 1,
    vendorBuildOrchestration: 1,
    vendorDirectoryPreparation: 1
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.file}:${row.name} should be classified`);
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing Nanah vendor method row ${row.file}:${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('Nanah vendor build register pins script counts hashes and generated output sizes', () => {
  const text = doc();
  const buildScript = read(buildScriptPath);
  const countPairs = [
    ['named method/helper declarations in build script', methodRows().length],
    ['plain function declarations', count(buildScript, /(^|\n)function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['async function declarations', count(buildScript, /(^|\n)async function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['arrow token sites in build script', count(buildScript, /=>/g)],
    ['path.resolve occurrences in build script', count(buildScript, /path\.resolve/g)],
    ['esbuild.build occurrences in build script', count(buildScript, /esbuild\.build/g)],
    ['await expressions in build script', count(buildScript, /\bawait\b/g)],
    ['fs.mkdir occurrences in build script', count(buildScript, /fs\.mkdir/g)],
    ['window literal occurrences in build script', countLiteral(buildScript, 'window')],
    ['document literal occurrences in build script', countLiteral(buildScript, 'document')],
    ['addEventListener occurrences in build script', count(buildScript, /addEventListener/g)],
    ['setTimeout occurrences in build script', count(buildScript, /setTimeout/g)],
    ['MutationObserver occurrences in build script', count(buildScript, /MutationObserver/g)],
    ['fetch occurrences in build script', count(buildScript, /\bfetch\b/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }

  for (const [file, expected] of Object.entries({
    'scripts/build-nanah-vendor.mjs': [65, 1818],
    'js/vendor/nanah.bundle.js': [876, 27692],
    'js/vendor/qrcode.bundle.js': [2085, 66965],
    'package.json': [46, 1376],
    'package-lock.json': [1461, 49916],
    'html/tab-view.html': [1577, 133585]
  })) {
    const [lines, bytes] = expected;
    assert.equal(sourceLineCount(read(file)), lines);
    assert.equal(fs.statSync(path.join(repoRoot, file)).size, bytes);
    assert.match(text, new RegExp(`${escapeRegExp(file)}: ${lines} lines, ${bytes} bytes`));
  }

  assert.match(text, new RegExp(`script sha256: ${sha256(buildScriptPath)}`));
  assert.match(text, new RegExp(`Nanah output sha256: ${sha256('js/vendor/nanah.bundle.js')}`));
  assert.match(text, new RegExp(`QR output sha256: ${sha256('js/vendor/qrcode.bundle.js')}`));
});

test('Nanah vendor build register preserves package authority load order and global consumers', () => {
  const text = doc();
  const buildScript = read(buildScriptPath);
  const packageJson = readJson('package.json');
  const lockPackage = readJson('package-lock.json').packages['node_modules/qrcode'];
  const tabScripts = scriptRefs('html/tab-view.html');
  const tabView = read('js/tab-view.js');
  const adapter = read('js/nanah_sync_adapter.js');
  const nanahOutput = read('js/vendor/nanah.bundle.js');
  const qrOutput = read('js/vendor/qrcode.bundle.js');

  assertVendorFreshnessFlowAndProvenance();

  assert.equal(packageJson.scripts['build:nanah-vendor'], 'node scripts/build-nanah-vendor.mjs');
  assert.equal(packageJson.dependencies.qrcode, '^1.5.4');
  assert.equal(lockPackage.version, '1.5.4');
  assert.equal(lockPackage.resolved, 'https://registry.npmjs.org/qrcode/-/qrcode-1.5.4.tgz');
  assert.match(lockPackage.integrity, /^sha512-/);
  assert.doesNotMatch(read('build.js'), /build-nanah-vendor/);

  for (const token of [
    "path.resolve(rootDir, '..', 'nanah')",
    "path.resolve(rootDir, 'js', 'vendor')",
    "path.resolve(rootDir, 'node_modules', 'qrcode', 'lib', 'browser.js')",
    "globalName: 'FilterTubeQrCode'",
    "outfile: path.resolve(vendorDir, 'qrcode.bundle.js')",
    "path.resolve(nanahDir, 'packages', 'core', 'src', 'index.ts')",
    "path.resolve(nanahDir, 'packages', 'client', 'src', 'index.ts')",
    'window.FilterTubeNanah = {',
    "sourcefile: 'nanah-entry.js'",
    "outfile: path.resolve(vendorDir, 'nanah.bundle.js')",
    "console.error('Failed to build Nanah vendor bundles')",
    'process.exitCode = 1'
  ]) {
    assert.ok(buildScript.includes(token), `build script missing ${token}`);
  }

  assert.ok(tabScripts.indexOf('../js/vendor/qrcode.bundle.js') < tabScripts.indexOf('../js/vendor/nanah.bundle.js'));
  assert.ok(tabScripts.indexOf('../js/vendor/nanah.bundle.js') < tabScripts.indexOf('../js/nanah_sync_adapter.js'));
  assert.ok(tabScripts.indexOf('../js/nanah_sync_adapter.js') < tabScripts.indexOf('../js/tab-view.js'));

  assert.match(nanahOutput, /window\.FilterTubeNanah/);
  assert.match(nanahOutput, /NanahClient/);
  assert.match(nanahOutput, /WebRtcDataChannelTransport/);
  assert.match(qrOutput, /var FilterTubeQrCode\s*=/);
  assert.match(qrOutput, /node_modules\/qrcode\/lib\/browser\.js/);
  assert.match(qrOutput, /toCanvas/);
  assert.match(tabView, /window\.FilterTubeQrCode\?\.toCanvas/);
  assert.match(tabView, /window\.FilterTubeNanah && window\.FilterTubeNanahAdapter/);
  assert.match(tabView, /new NanahApi\.NanahClient/);
  assert.match(tabView, /new NanahApi\.WebRtcDataChannelTransport/);
  assert.match(tabView, /NanahApi\.DEFAULT_NANAH_SIGNALING_URL/);
  assert.match(adapter, /global\.FilterTubeNanahAdapter/);

  for (const token of [
    'normal package build: build.js does not invoke scripts/build-nanah-vendor.mjs',
    'QR lockfile version: qrcode 1.5.4',
    'Nanah sibling root: ../nanah',
    'dashboard load order: qrcode.bundle.js -> nanah.bundle.js -> nanah_sync_adapter.js -> tab-view.js',
    'dashboard QR consumer: window.FilterTubeQrCode?.toCanvas',
    'dashboard Nanah consumer: window.FilterTubeNanah and window.FilterTubeNanahAdapter',
    'vendor outputs are tracked source, not regenerated on import or extension startup',
    'normal npm run build packages the current tracked vendor files without rebuilding them',
    'Nanah bundling depends on a sibling ../nanah checkout that is outside this repo',
    'the committed Nanah output does not record the sibling Nanah commit, branch, or source hash',
    'build failure sets process.exitCode but does not delete stale vendor output files'
  ]) {
    assert.ok(text.includes(token), `missing Nanah vendor boundary token ${token}`);
  }
});

test('Nanah vendor build register preserves future proof fields and missing authority boundary', () => {
  const text = doc();
  const currentSurfaces = [
    buildScriptPath,
    ...vendorFiles,
    'html/tab-view.html',
    'js/tab-view.js',
    'js/nanah_sync_adapter.js',
    'package.json',
    'package-lock.json',
    'build.js'
  ].map(read).join('\n');

  for (const field of [
    'nanahVendorBuildMethodReference',
    'sourceInputPath',
    'generatedOutputPath',
    'sourceHash',
    'generatedOutputHash',
    'esbuildVersion',
    'qrcodePackageVersion',
    'qrcodePackageIntegrity',
    'nanahRepoPath',
    'nanahRepoCommit',
    'nanahSourceHash',
    'htmlLoadOrderProof',
    'globalApiSurface',
    'sourceOutputFreshness',
    'missingGlobalBehavior',
    'buildFailureBehavior',
    'staleOutputPolicy',
    'releasePackageProof',
    'nativeSyncFreshnessProof'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingAuthority of [
    'nanahVendorBuildMethodAuthority',
    'nanahVendorSourceRevisionManifest',
    'nanahVendorOutputHashManifest',
    'nanahVendorPackageVersionManifest',
    'nanahVendorSiblingRepoContract',
    'nanahVendorQrCodePackageContract',
    'nanahVendorGlobalApiContract',
    'nanahVendorBuildFreshnessReport',
    'nanahVendorPackageParityReport',
    'nanahVendorSiblingDirtyStateReport',
    'nanahVendorStaleOutputFailureReport',
    'nanahVendorFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(missingAuthority));
    assert.doesNotMatch(currentSurfaces, new RegExp(missingAuthority));
  }
});
