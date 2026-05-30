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
const capturedAppDirtyPaths = [
  'apps/android/app/src/debug/java/com/filtertube/app/DebugNativeOwnedKidsActivity.kt',
  'apps/android/app/src/main/assets/filtertube_nanah/nanah_sync_adapter.js',
  'apps/android/app/src/main/assets/filtertube_runtime_full.js',
  'apps/android/app/src/main/java/com/filtertube/app/AppLaunchRouter.kt',
  'apps/android/app/src/main/java/com/filtertube/app/LauncherActivity.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ManagedWebViewActivity.kt',
  'apps/android/app/src/main/java/com/filtertube/app/NativeOwnedPreviewEntryPoint.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ProfileViewingAccess.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ViewingLaunchCoordinator.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ViewingSpaceChooserPolicy.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ViewingTargetAccessUiState.kt',
  'apps/android/app/src/main/java/com/filtertube/app/ViewingTargetLaunchPolicy.kt',
  'apps/android/app/src/test/java/com/filtertube/app/AppLaunchRouterTest.kt',
  'apps/android/app/src/test/java/com/filtertube/app/NativeOwnedPreviewEntryPointTest.kt',
  'apps/android/app/src/test/java/com/filtertube/app/ProfileViewingAccessTest.kt',
  'apps/android/app/src/test/java/com/filtertube/app/ViewingSpaceChooserPolicyTest.kt',
  'apps/android/app/src/test/java/com/filtertube/app/ViewingTargetAccessUiStateTest.kt',
  'apps/android/app/src/test/java/com/filtertube/app/ViewingTargetLaunchPolicyTest.kt',
  'apps/ios/FilterTube/Resources/filtertube_nanah/nanah_sync_adapter.js',
  'apps/ios/FilterTube/Resources/filtertube_runtime_full.js',
  'packages/extension-source/upstream/css/serene-shell.css',
  'packages/extension-source/upstream/html/tab-view.html',
  'packages/extension-source/upstream/js/background.js',
  'packages/extension-source/upstream/js/content/block_channel.js',
  'packages/extension-source/upstream/js/content/bridge_settings.js',
  'packages/extension-source/upstream/js/content/collab_dialog.js',
  'packages/extension-source/upstream/js/content/dom_fallback.js',
  'packages/extension-source/upstream/js/content_bridge.js',
  'packages/extension-source/upstream/js/injector.js',
  'packages/extension-source/upstream/js/io_manager.js',
  'packages/extension-source/upstream/js/nanah_sync_adapter.js',
  'packages/extension-source/upstream/js/seed.js',
  'packages/extension-source/upstream/js/settings_shared.js',
  'packages/extension-source/upstream/js/state_manager.js',
  'packages/extension-ui/src/upstream/io_manager.js',
  'packages/extension-ui/src/upstream/settings_shared.js',
  'packages/extension-ui/src/upstream/state_manager.js',
  'packages/runtime-adapters/src/upstream/block_channel.js',
  'packages/runtime-adapters/src/upstream/collab_dialog.js',
  'packages/runtime-adapters/src/upstream/dom_fallback.js',
  'packages/runtime-bridge/src/upstream/bridge_settings.js',
  'packages/runtime-bridge/src/upstream/content_bridge.js',
  'packages/runtime-bridge/src/upstream/injector.js',
  'packages/runtime-bridge/src/upstream/seed.js',
];

const sourceRows = [
  [wrapperPath, 34, 1070, '4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6'],
  [appSyncScriptPath, 1758, 76587, 'd48bdc271f707f0f960ac8a6b0d2712a602fb6c84a8c2bf2e0a138d112f9ba8e'],
  [appManifestPath, 198, 8178, 'e899e29d946270865750b8f6415c298a92da6b4e1917367b6a174afe2a0c6583'],
  [publicReleaseNotesPath, 316, 23047, 'c9c860f17dae9f9f9e8d1536d3c0de72dd3b6bd917fc8d7fc725047adc421862'],
  [androidReleaseNotesPath, 301, 21095, '911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737'],
  [iosReleaseNotesPath, 301, 21095, '911628cbd7f6354c58aa82064f3ef1f29cda3904a87e3ea263534600a0880737'],
];

const runtimeRows = [
  ['apps/android/app/src/main/assets/filtertube_runtime_full.js', 35711, 1573129, '3ec4dab1e748a4294cc73f5ae21ce01513aa8e74483239ae29c0c63d8ca82c07'],
  ['apps/android/app/src/main/assets/filtertube_kids_runtime.js', 370, 13153, '05b47e2310222a68ba5356cbf6dca24b507aa225bfbe6e971c2a4819d647b711'],
  ['apps/ios/FilterTube/Resources/filtertube_runtime_full.js', 35710, 1571466, '53f9aa6ee4ad8dd527c0bfbcf333f6e2b02afaaa344325de229c07d98fd96311'],
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

function gitLines(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

function appStatusPaths() {
  return gitLines(appRoot, ['status', '--short'])
    .map((line) => line.replace(/^.. /, '').trim())
    .filter(Boolean)
    .sort();
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
  assert.match(text, /Runtime, build, package, website,\s+and native app sync behavior are unchanged/);
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

test('native runtime sync manifest direct copies and broad mirror currently match checkout bytes', () => {
  const text = doc();
  const manifest = readJson(appManifestPath);
  const copyRows = manifestCopyRows();
  const mirrorRows = sourceMirrorRows();

  assert.equal(manifest.length, 28);
  assert.deepEqual([...new Set(manifest.map((entry) => entry.sourceRepo))], [repoRoot]);
  assert.deepEqual([...new Set(manifest.map((entry) => entry.syncMode))], ['copy']);
  assert.equal(manifest.filter((entry) => Object.hasOwn(entry, 'destinationKind')).length, 0);
  assert.equal(manifest.filter((entry) => !Object.hasOwn(entry, 'destinationKind')).length, 28);
  assert.equal(manifest.some((entry) => entry.source === 'js/layout.js'), true);
  assert.equal(manifest.some((entry) => entry.source === 'data/release_notes.json'), false);

  assert.equal(copyRows.filter((row) => row.sourceExists).length, 28);
  assert.equal(copyRows.filter((row) => row.destinationExists).length, 28);
  assert.equal(copyRows.filter((row) => row.equal).length, 28);
  assert.equal(copyRows.filter((row) => !row.equal).length, 0);

  assert.deepEqual(sourceMirrorDirs(), ['js', 'html', 'css']);
  assert.equal(mirrorRows.length, 43);
  assert.equal(mirrorRows.filter((row) => row.equal).length, 43);
  assert.equal(mirrorRows.filter((row) => !row.equal).length, 0);

  for (const [label, value] of [
    ['runtime sync manifest entries', 28],
    ['manifest destinationKind fields present', 0],
    ['manifest entries missing destinationKind', 28],
    ['direct manifest copy sources present', 28],
    ['direct manifest copy destinations present', 28],
    ['direct manifest source/destination hash matches', 28],
    ['direct manifest source/destination hash mismatches', 0],
    ['extension-source mirror files compared', 43],
    ['extension-source mirror hash matches', 43],
    ['extension-source mirror hash mismatches', 0],
  ]) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }
});

test('native runtime sync manifest records generated artifact hashes and release-note drift', () => {
  const text = doc();
  const order = runtimeBundleOrder();

  assert.equal(order.length, 15);
  assert.equal(order.includes('js/layout.js'), true);
  assert.match(text, /runtimeBundleOrder entries: 15/);
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
  assert.match(text, /public\s+`data\/release_notes\.json` file has 316 lines/);
  assert.match(text, /current Android\/iOS native release-note resources have 301 lines/);
});

test('native runtime sync manifest freshness boundary pins app dirty state and wrapper delegation limits', () => {
  const text = doc();
  const wrapper = read(wrapperPath);
  const pkg = readJson(packagePath);
  const build = read(buildPath);
  const syncScript = read(appSyncScriptPath);
  const currentAppHead = git(appRoot, ['rev-parse', 'HEAD']);

  assert.equal(git(repoRoot, ['rev-parse', 'HEAD']), '3696c340630a05a81e8eae209589399d4e838553');
  assert.match(currentAppHead, /^[0-9a-f]{40}$/);

  assert.match(text, /public repo HEAD: 3696c340630a05a81e8eae209589399d4e838553/);
  assert.match(text, /app repo HEAD: b33e98d5b0c52cb728fb3720d34a01ba987ef649/);
  assert.match(text, /app dirty tracked paths: 44/);
  for (const dirtyPath of capturedAppDirtyPaths) assert.match(text, new RegExp(escapeRegExp(dirtyPath)));

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
