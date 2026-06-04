import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const appRoot = path.resolve(repoRoot, '..', 'FilterTubeApp');
const docPath = 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const wrapperPath = 'scripts/sync-native-runtime.mjs';
const packagePath = 'package.json';
const buildPath = 'build.js';
const publicReleaseNotesPath = 'data/release_notes.json';
const appSyncScriptPath = path.join(appRoot, 'tools', 'sync-runtime-from-extension.mjs');
const appManifestPath = path.join(appRoot, 'tools', 'runtime-sync-manifest.json');
const androidReleaseNotesPath = path.join(appRoot, 'apps/android/app/src/main/assets/extension_shell/data/release_notes.json');
const iosReleaseNotesPath = path.join(appRoot, 'apps/ios/FilterTube/Resources/release_notes.json');
const sourceRows = [
  [wrapperPath, 34, 1070, '4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6'],
  [appSyncScriptPath, 2284, 109397, 'ce0e231f9f0384eb538e76a553ef41453673c3231b8c5ab62d94ff7d38b90ae9'],
  [appManifestPath, 226, 9654, 'f08e48f7e329fd7ac22b9c3b990f3c53771f356d6f8cbe2ebe5fe51226b5b540'],
  [publicReleaseNotesPath, 317, 23020, 'a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b'],
  [androidReleaseNotesPath, 301, 21095, '911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737'],
  [iosReleaseNotesPath, 301, 21095, '911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737'],
];

const runtimeRows = [
  ['apps/android/app/src/main/assets/filtertube_runtime_full.js', 36663, 1612973, '8657e8db5b57630fb5eca8d912a19c146e0a074f8c3b9bda0ce98705f140bca8'],
  ['apps/android/app/src/main/assets/filtertube_kids_runtime.js', 370, 13153, '05b47e2310222a68ba5356cbf6dca24b507aa225bfbe6e971c2a4819d647b711'],
  ['apps/ios/FilterTube/Resources/filtertube_runtime_full.js', 36631, 1609476, '326a26190fdbf67b782a74982a13b951a10c947918dd7e71a71c5af97cdf8003'],
  ['apps/ios/FilterTube/Resources/filtertube_kids_runtime.js', 575, 20835, '3f279f275bf93cca6385df6c8d0422a51c533c26cbd29ddd5d9ea5655efc7340'],
  ['apps/android/app/src/main/assets/filtertube_nanah_engine.html', 875, 34907, 'e63d29f43a5c94790a665bfda985071b26b530dd7b532cdb66f0cd3d27a1a93e'],
  ['apps/ios/FilterTube/Resources/filtertube_nanah_engine.html', 875, 34899, '84df57dacdaaf394e47864cc7a70ed5185e7547b693afbe69a363811f787112d'],
];

function abs(file) {
  return path.isAbsolute(file) ? file : path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(abs(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(abs(file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function runtimeBundleOrder() {
  const source = read(appSyncScriptPath);
  const match = source.match(/const runtimeBundleOrder = \[([\s\S]*?)\];/);
  assert.ok(match, 'app sync script should define runtimeBundleOrder');
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function sourceMirrorDirs() {
  const source = read(appSyncScriptPath);
  const match = source.match(/const sourceMirrorDirs = \[([^\]]+)\]/);
  assert.ok(match, 'app sync script should define sourceMirrorDirs');
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function walkFiles(root) {
  const out = [];
  function visit(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name === '.DS_Store') continue;
      const file = path.join(dir, name);
      const stat = fs.statSync(file);
      if (stat.isDirectory()) visit(file);
      else out.push(file);
    }
  }
  visit(root);
  return out;
}

function sourceMirrorRows() {
  const rows = [];
  for (const dir of sourceMirrorDirs()) {
    for (const sourcePath of walkFiles(path.join(repoRoot, dir))) {
      const rel = path.relative(path.join(repoRoot, dir), sourcePath);
      const destinationPath = path.join(appRoot, 'packages/extension-source/upstream', dir, rel);
      rows.push({
        rel: path.join(dir, rel),
        sourcePath,
        destinationPath,
        destinationExists: fs.existsSync(destinationPath),
        equal: fs.existsSync(destinationPath) && sha256(sourcePath) === sha256(destinationPath)
      });
    }
  }
  return rows;
}

function manifestCopyRows() {
  return readJson(appManifestPath).map((entry) => {
    const sourcePath = path.join(entry.sourceRepo, entry.source);
    const destinationPath = path.join(appRoot, entry.destination);
    return {
      ...entry,
      sourcePath,
      destinationPath,
      sourceExists: fs.existsSync(sourcePath),
      destinationExists: fs.existsSync(destinationPath),
      equal: fs.existsSync(sourcePath) && fs.existsSync(destinationPath) && sha256(sourcePath) === sha256(destinationPath)
    };
  });
}

test('native runtime sync manifest freshness doc is audit-only and fingerprint pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime, build, package, and website\s+behavior are unchanged/);
  assert.match(text, /native app sync manifest has one managed-policy\s+contract copy addition plus two managed helper source copy additions/);
  assert.match(text, /codebase inspection/);
  assert.match(text, /first-class JSON filter blockers/);
  assert.match(text, /runtime behavior changed: no/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(fs.statSync(abs(file)).size, expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('native runtime sync manifest direct copies and broad mirror record current drift', () => {
  const text = doc();
  const manifest = readJson(appManifestPath);
  const copyRows = manifestCopyRows();
  const mirrorRows = sourceMirrorRows();

  assert.equal(manifest.length, 32);
  assert.deepEqual([...new Set(manifest.map((entry) => entry.sourceRepo))], [repoRoot]);
  assert.deepEqual([...new Set(manifest.map((entry) => entry.syncMode))], ['copy']);
  assert.equal(manifest.filter((entry) => Object.hasOwn(entry, 'destinationKind')).length, 0);
  assert.equal(manifest.filter((entry) => !Object.hasOwn(entry, 'destinationKind')).length, 32);
  assert.equal(manifest.some((entry) => entry.source === 'js/layout.js'), true);
  assert.equal(manifest.some((entry) => entry.source === 'data/release_notes.json'), false);

  assert.equal(copyRows.filter((row) => row.sourceExists).length, 32);
  assert.equal(copyRows.filter((row) => row.destinationExists).length, 32);
  assert.equal(copyRows.filter((row) => row.equal).length, 26);
  assert.equal(copyRows.filter((row) => !row.equal).length, 6);

  assert.deepEqual(sourceMirrorDirs(), ['js', 'html', 'css']);
  assert.equal(mirrorRows.length, 46);
  assert.equal(mirrorRows.filter((row) => row.destinationExists).length, 46);
  assert.equal(mirrorRows.filter((row) => row.equal).length, 38);
  assert.equal(mirrorRows.filter((row) => !row.destinationExists).length, 0);
  assert.equal(mirrorRows.filter((row) => row.destinationExists && !row.equal).length, 8);

  for (const [label, value] of [
    ['runtime sync manifest entries', 32],
    ['manifest destinationKind fields present', 0],
    ['manifest entries missing destinationKind', 32],
    ['direct manifest copy sources present', 32],
    ['direct manifest copy destinations present', 32],
    ['direct manifest source/destination hash matches', 26],
    ['direct manifest source/destination hash mismatches', 6],
    ['extension-source mirror files compared', 46],
    ['extension-source mirror files present', 46],
    ['extension-source mirror hash matches', 38],
    ['extension-source mirror missing files', 0],
    ['extension-source mirror hash mismatches', 8],
  ]) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }
});

test('native runtime sync manifest records generated artifact hashes and release-note drift', () => {
  const text = doc();
  const order = runtimeBundleOrder();

  assert.equal(order.length, 16);
  assert.equal(order.includes('js/layout.js'), true);
  assert.match(text, /runtimeBundleOrder entries: 16/);
  assert.match(text, /runtimeBundleOrder includes js\/layout\.js: yes/);

  for (const [rel, expectedLines, expectedBytes, expectedHash] of runtimeRows) {
    const file = path.join(appRoot, rel);
    assert.equal(lineCount(read(file)), expectedLines, `${rel} line count drifted`);
    assert.equal(fs.statSync(file).size, expectedBytes, `${rel} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${rel} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(rel)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }

  assert.notEqual(sha256(publicReleaseNotesPath), sha256(androidReleaseNotesPath));
  assert.equal(sha256(androidReleaseNotesPath), sha256(iosReleaseNotesPath));
  assert.match(text, /Release notes also remain outside the direct runtime sync manifest/);
  assert.match(text, /public\s+`data\/release_notes\.json` file has 317 lines/);
  assert.match(text, /current Android\/iOS native release-note resources have 301 lines/);
});

test('native runtime sync manifest freshness boundary pins app dirty state and wrapper delegation limits', () => {
  const text = doc();
  const wrapper = read(wrapperPath);
  const pkg = readJson(packagePath);
  const build = read(buildPath);
  const syncScript = read(appSyncScriptPath);
  const currentAppHead = git(appRoot, ['rev-parse', 'HEAD']);

  const currentPublicHead = git(repoRoot, ['rev-parse', 'HEAD']);
  assert.match(currentPublicHead, /^[0-9a-f]{40}$/);
  assert.match(currentAppHead, /^[0-9a-f]{40}$/);

  assert.match(text, /public repo HEAD: [0-9a-f]{40}/);
  assert.match(text, /app repo HEAD: [0-9a-f]{40}/);
  assert.match(text, /app dirty state authority: not pinned by this contract-copy slice/);
  assert.match(text, /out-of-scope native app changes may exist/);

  assert.equal(pkg.scripts['sync:native-runtime'], 'node scripts/sync-native-runtime.mjs');
  assert.doesNotMatch(build, /sync-native-runtime/);
  assert.match(wrapper, /spawnSync\(process\.execPath, \[syncScript\]/);
  assert.match(wrapper, /stdio: "inherit"/);
  assert.match(syncScript, /await mirrorExtensionSource\(sourceRepo\)/);
  assert.match(syncScript, /await rebuildNativeRuntimeAssets\(manifestBySource\)/);
  assert.match(syncScript, /applyIOSKidsRuntimePatches/);
  assert.match(text, /direct-copy equality\s+check can pass while the app worktree remains dirty/);
});

test('native runtime sync manifest freshness keeps future authority gates absent', () => {
  const text = doc();
  const boundarySource = [
    read(wrapperPath),
    read(packagePath),
    read(buildPath),
    read(appSyncScriptPath),
    read(appManifestPath)
  ].join('\n');

  for (const token of [
    'nativeRuntimeSyncManifestFreshnessContract',
    'nativeRuntimeSyncDirectCopyHashReport',
    'nativeRuntimeSyncGeneratedRuntimeHashReport',
    'nativeRuntimeSyncAppDirtyStateReport',
    'nativeRuntimeSyncReleaseNotesParityReport',
    'nativeRuntimeSyncDestinationKindManifest',
    'nativeRuntimeSyncSourceMirrorReport',
    'nativeRuntimeSyncRuntimeBundleOrderGate',
    'nativeRuntimeSyncLayoutQuarantineGate',
    'nativeRuntimeSyncFirstClassJsonParityGate'
  ]) {
    assert.match(text, new RegExp(token));
    assert.doesNotMatch(boundarySource, new RegExp(token));
  }

  assert.equal(countLiteral(boundarySource, 'sourceRevision'), 0);
  assert.equal(countLiteral(boundarySource, 'dirtyState'), 0);
  assert.equal(countLiteral(boundarySource, 'postSyncHash'), 0);
  assert.equal(countLiteral(boundarySource, 'syncReport'), 0);
  assert.match(text, /first-class JSON filtering, DOM fallback parity,\s+quick-block\/menu behavior, learned identity, Nanah sync, and app release\s+public claims/);
});
