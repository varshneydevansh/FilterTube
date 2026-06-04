import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const appRoot = '/Users/devanshvarshney/FilterTubeApp';
const auditDocPath = 'docs/audit/FILTERTUBE_P0_NATIVE_RUNTIME_SYNC_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file, root = repoRoot) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file, root = repoRoot) {
  return JSON.parse(read(file, root));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listRelativeFiles(root, dir) {
  const start = path.join(root, dir);
  const out = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile()) {
        out.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
      }
    }
  };
  visit(start);
  return out.sort();
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

test('P0 native runtime sync audit documents blocked verdict and all named gates', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'P0 native runtime sync authority is not green',
    'native_runtime_sync_public_wrapper_delegates_to_app_sync_script',
    'native_runtime_sync_manifest_sources_exist_and_are_public_repo_owned',
    'native_runtime_sync_manifest_destinations_record_current_stale_rows_after_contract_sync',
    'native_runtime_sync_generated_main_assets_are_not_source_authority',
    'native_runtime_sync_ios_kids_runtime_documents_intentional_divergence',
    'native_runtime_sync_extension_source_mirror_drift_is_detected',
    'native_runtime_sync_android_has_prebuild_freshness_but_ios_needs_release_gate',
    'native_runtime_sync_raw_root_captures_never_become_app_runtime_inputs',
    'native_runtime_sync_future_authority_token_is_absent_from_product_source',
    'nativeRuntimeSyncAuthority.record'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('native_runtime_sync_public_wrapper_delegates_to_app_sync_script', () => {
  const source = read('scripts/sync-native-runtime.mjs');

  assert.match(source, /FILTERTUBE_APP_REPO/);
  assert.match(source, /defaultSiblingAppRepo = path\.resolve\(publicRepoRoot, "\.\.", "FilterTubeApp"\)/);
  assert.match(source, /tools", "sync-runtime-from-extension\.mjs"/);
  assert.match(source, /spawnSync\(process\.execPath, \[syncScript\]/);
});

test('native_runtime_sync_manifest_sources_exist_and_are_public_repo_owned', () => {
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);

  assert.equal(manifest.length, 32);
  assert.deepEqual([...new Set(manifest.map(entry => entry.sourceRepo))], [repoRoot]);

  for (const entry of manifest) {
    assert.ok(fs.existsSync(path.join(entry.sourceRepo, entry.source)), `${entry.source} should exist`);
    assert.ok(fs.existsSync(path.join(appRoot, entry.destination)), `${entry.destination} should exist`);
  }
});

test('native_runtime_sync_manifest_destinations_record_current_stale_rows_after_contract_sync', () => {
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);
  const diffs = [];

  for (const entry of manifest) {
    const sourcePath = path.join(entry.sourceRepo, entry.source);
    const destinationPath = path.join(appRoot, entry.destination);
    if (sha256(sourcePath) !== sha256(destinationPath)) {
      diffs.push(`${entry.source}->${entry.destination}`);
    }
  }

  assert.deepEqual(diffs, [
    'js/content_bridge.js->packages/runtime-bridge/src/upstream/content_bridge.js',
    'js/content/block_channel.js->packages/runtime-adapters/src/upstream/block_channel.js',
    'js/content/bridge_settings.js->packages/runtime-bridge/src/upstream/bridge_settings.js',
    'js/io_manager.js->packages/extension-ui/src/upstream/io_manager.js',
    'js/tab-view.js->packages/extension-ui/src/upstream/tab-view.js',
    'js/nanah_sync_adapter.js->apps/android/app/src/main/assets/filtertube_nanah/nanah_sync_adapter.js'
  ]);
});

test('native_runtime_sync_generated_main_assets_are_not_source_authority', () => {
  const androidPath = path.join(appRoot, 'apps/android/app/src/main/assets/filtertube_runtime_full.js');
  const iosPath = path.join(appRoot, 'apps/ios/FilterTube/Resources/filtertube_runtime_full.js');

  assert.ok(fs.statSync(androidPath).size > 1_000_000);
  assert.ok(fs.statSync(iosPath).size > 1_000_000);
  assert.notEqual(sha256(androidPath), sha256(path.join(repoRoot, 'js/filter_logic.js')));
  assert.notEqual(sha256(iosPath), sha256(path.join(repoRoot, 'js/filter_logic.js')));
  assert.match(read(auditDocPath), /generated outputs are hand-edited/);
});

test('native_runtime_sync_ios_kids_runtime_documents_intentional_divergence', () => {
  const androidKidsPath = path.join(appRoot, 'apps/android/app/src/main/assets/filtertube_kids_runtime.js');
  const iosKidsPath = path.join(appRoot, 'apps/ios/FilterTube/Resources/filtertube_kids_runtime.js');
  const androidKids = fs.readFileSync(androidKidsPath, 'utf8');
  const iosKids = fs.readFileSync(iosKidsPath, 'utf8');

  assert.notEqual(sha256(androidKidsPath), sha256(iosKidsPath));
  assert.doesNotMatch(androidKids, /ensureKidsPhoneFit/);
  assert.match(iosKids, /ensureKidsPhoneFit/);
  assert.match(iosKids, /Let YouTube Kids own the watch layout/);
  assert.match(read(auditDocPath), /iOS Kids runtime intentionally diverges/);
});

test('native_runtime_sync_extension_source_mirror_drift_is_detected', () => {
  const mirrorDiffs = [];

  for (const dir of ['js', 'html', 'css']) {
    for (const relative of listRelativeFiles(repoRoot, dir)) {
      const mirrorPath = path.join(appRoot, 'packages/extension-source/upstream', relative);
      if (!fs.existsSync(mirrorPath)) {
        mirrorDiffs.push(`${relative}:missing`);
        continue;
      }
      if (sha256(path.join(repoRoot, relative)) !== sha256(mirrorPath)) {
        mirrorDiffs.push(`${relative}:hash-diff`);
      }
    }
  }

  assert.deepEqual(mirrorDiffs.sort(), [
    'html/tab-view.html:hash-diff',
    'js/background.js:hash-diff',
    'js/content/block_channel.js:hash-diff',
    'js/content/bridge_settings.js:hash-diff',
    'js/content_bridge.js:hash-diff',
    'js/io_manager.js:hash-diff',
    'js/nanah_sync_adapter.js:hash-diff',
    'js/tab-view.js:hash-diff'
  ]);
});

test('native_runtime_sync_android_has_prebuild_freshness_but_ios_needs_release_gate', () => {
  const technicalRuntime = fs.readFileSync(
    path.join(appRoot, 'docs/app/TECHNICAL_RUNTIME.md'),
    'utf8'
  );

  assert.match(technicalRuntime, /Android `:app:preBuild` depends on `:app:syncFilterTubeRuntime`/);
  assert.match(technicalRuntime, /The iOS project does not have a Gradle preBuild hook/);
  assert.match(technicalRuntime, /before iOS release builds or after upstream runtime changes/);
});

test('native_runtime_sync_raw_root_captures_never_become_app_runtime_inputs', () => {
  const gitignore = read('.gitignore');
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);
  const manifestText = JSON.stringify(manifest);
  const appSyncSource = fs.readFileSync(path.join(appRoot, 'tools/sync-runtime-from-extension.mjs'), 'utf8');

  for (const capture of [
    'YT_MAIN.json',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_WATCH.html',
    'YT_KIDS.json',
    'YTM.json',
    'YTM-DOM.html',
    'comments.json',
    'playlist.json',
    'collab.json',
    'extracted_watch_paths.txt'
  ]) {
    assert.ok(gitignore.includes(capture), `${capture} should be ignored evidence`);
    assert.equal(manifestText.includes(capture), false, `${capture} should not be in runtime sync manifest`);
    assert.equal(appSyncSource.includes(capture), false, `${capture} should not be in app sync source`);
  }
});

test('native_runtime_sync_future_authority_token_is_absent_from_product_source', () => {
  const sourceFiles = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'));
  const combined = sourceFiles.map(file => read(file)).join('\n');

  assert.doesNotMatch(combined, /\bnativeRuntimeSyncAuthority\b/);
  assert.match(read(auditDocPath), /Future token: `nativeRuntimeSyncAuthority`/);
});
