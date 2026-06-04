import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const appRoot = '/Users/devanshvarshney/FilterTubeApp';
const auditDocPath = 'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const nativeSyncFamilyDocs = [
  'docs/audit/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_P0_NATIVE_RUNTIME_SYNC_CURRENT_BEHAVIOR_2026-05-19.md'
];

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

test('native runtime sync audit documents sync model and future gate', () => {
  const doc = read(auditDocPath);
  const methodGap = read(methodGapPath);

  for (const phrase of [
    'Current Sync Model',
    'Current Generated Runtime Outputs',
    'Mirror Snapshot Drift',
    'Raw Capture Evidence Boundary',
    'Native Release Handoff Snapshot - 2026-05-27',
    'native release handoff approval: NO-GO',
    'native generated runtime source authority: NO-GO',
    'iOS release sync gate approval: NO-GO',
    'runtime behavior changed by this addendum: no',
    'Future token: `nativeRuntimeSyncAuthority`',
    'native_runtime_sync_public_wrapper_delegates_to_app_sync_script',
    'native_runtime_sync_raw_root_captures_never_become_app_runtime_inputs'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }

  assert.match(doc, /extension runtime source change\s+\|\s+\+--> npm run sync:native-runtime/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /\| Public wrapper script \| `scripts\/sync-native-runtime\.mjs:5-34` \|/);
  assert.match(doc, /\| Package entrypoint \| `package\.json:6-15` \|/);
  assert.match(doc, /\| App sync script \| `\/Users\/devanshvarshney\/FilterTubeApp\/tools\/sync-runtime-from-extension\.mjs:100-199`, `226` \|/);
  assert.match(doc, /\| Direct manifest copies \| `\/Users\/devanshvarshney\/FilterTubeApp\/tools\/runtime-sync-manifest\.json` \|/);
  assert.match(doc, /\| Android\/iOS build boundary \| `\/Users\/devanshvarshney\/FilterTubeApp\/docs\/app\/TECHNICAL_RUNTIME\.md` \|/);

  assert.match(methodGap, /repo-wide lexical callables: 5797/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5797/);

  assert.equal(nativeSyncFamilyDocs.length, 5);
  for (const familyDocPath of nativeSyncFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5797/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5797/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('public wrapper delegates to the sibling or env-selected app sync script', () => {
  const source = read('scripts/sync-native-runtime.mjs');

  assert.match(source, /FILTERTUBE_APP_REPO/);
  assert.match(source, /defaultSiblingAppRepo = path\.resolve\(publicRepoRoot, "\.\.", "FilterTubeApp"\)/);
  assert.match(source, /tools", "sync-runtime-from-extension\.mjs"/);
  assert.match(source, /spawnSync\(process\.execPath, \[syncScript\]/);
});

test('app sync manifest sources exist and are owned by the public repo path', () => {
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);

  assert.equal(manifest.length, 28);
  assert.deepEqual([...new Set(manifest.map(entry => entry.sourceRepo))], [repoRoot]);

  const missing = manifest.filter(entry => !fs.existsSync(path.join(entry.sourceRepo, entry.source)));
  assert.deepEqual(missing, []);

  for (const required of [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/injector.js',
    'js/settings_shared.js',
    'js/tab-view.js',
    'js/nanah_sync_adapter.js',
    'js/vendor/nanah.bundle.js'
  ]) {
    assert.ok(manifest.some(entry => entry.source === required), `missing manifest source ${required}`);
  }
});

test('manifest copy destinations are currently byte-identical to source files', () => {
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);
  const diffs = [];

  for (const entry of manifest) {
    const sourcePath = path.join(entry.sourceRepo, entry.source);
    const destinationPath = path.join(appRoot, entry.destination);
    if (!fs.existsSync(destinationPath)) {
      diffs.push(`${entry.source}:missing-destination`);
      continue;
    }
    if (sha256(sourcePath) !== sha256(destinationPath)) {
      diffs.push(`${entry.source}:hash-diff`);
    }
  }

  assert.deepEqual(diffs, []);
});

test('generated main runtime assets are large app outputs and not byte-identical source files', () => {
  const androidPath = path.join(appRoot, 'apps/android/app/src/main/assets/filtertube_runtime_full.js');
  const iosPath = path.join(appRoot, 'apps/ios/FilterTube/Resources/filtertube_runtime_full.js');

  assert.equal(fs.statSync(androidPath).size, 1574364);
  assert.equal(fs.statSync(iosPath).size, 1572701);
  assert.equal(sha256(androidPath), 'df82c9ddfc77bbed1025741222d0468e55c760e3376a2cedc5fc45bc651787c6');
  assert.equal(sha256(iosPath), 'f146e2284af6429c8a30c87406ae30dce6e69003f64e9082aa459194df81fae2');
  assert.notEqual(sha256(androidPath), sha256(iosPath));
  assert.match(read(auditDocPath), /Generated app runtime assets are not source authority/);
});

test('iOS Kids runtime documents intentional divergence from Android Kids runtime', () => {
  const androidKidsPath = path.join(appRoot, 'apps/android/app/src/main/assets/filtertube_kids_runtime.js');
  const iosKidsPath = path.join(appRoot, 'apps/ios/FilterTube/Resources/filtertube_kids_runtime.js');
  const androidKids = fs.readFileSync(androidKidsPath, 'utf8');
  const iosKids = fs.readFileSync(iosKidsPath, 'utf8');

  assert.equal(fs.statSync(androidKidsPath).size, 13153);
  assert.equal(fs.statSync(iosKidsPath).size, 20835);
  assert.equal(sha256(androidKidsPath), '05b47e2310222a68ba5356cbf6dca24b507aa225bfbe6e971c2a4819d647b711');
  assert.equal(sha256(iosKidsPath), '3f279f275bf93cca6385df6c8d0422a51c533c26cbd29ddd5d9ea5655efc7340');
  assert.doesNotMatch(androidKids, /ensureKidsPhoneFit/);
  assert.match(iosKids, /ensureKidsPhoneFit/);
  assert.match(iosKids, /Let YouTube Kids own the watch layout/);
});

test('broad extension source mirror drift is detected separately from manifest copy freshness', () => {
  const mirrorDiffs = [];
  for (const dir of ['js', 'html', 'css']) {
    for (const relative of listRelativeFiles(repoRoot, dir)) {
      const sourcePath = path.join(repoRoot, relative);
      const mirrorPath = path.join(appRoot, 'packages/extension-source/upstream', relative);
      assert.ok(fs.existsSync(mirrorPath), `${relative} should exist in source mirror`);
      if (sha256(sourcePath) !== sha256(mirrorPath)) {
        mirrorDiffs.push(relative);
      }
    }
  }

  assert.deepEqual(mirrorDiffs.sort(), []);
  assert.match(read(auditDocPath), /Current mirror check:/);
});

test('app docs state Android prebuild freshness and iOS manual sync boundary', () => {
  const technicalRuntime = fs.readFileSync(
    path.join(appRoot, 'docs/app/TECHNICAL_RUNTIME.md'),
    'utf8'
  );
  const sharedPlan = fs.readFileSync(
    path.join(appRoot, 'docs/SHARED_RUNTIME_SYNC_PLAN.md'),
    'utf8'
  );

  assert.match(technicalRuntime, /Android `:app:preBuild` depends on `:app:syncFilterTubeRuntime`/);
  assert.match(technicalRuntime, /The iOS project does not have a Gradle preBuild hook/);
  assert.match(technicalRuntime, /Android and iOS consume this through `tools\/sync-runtime-from-extension\.mjs`; app code should not fork these rules/);
  assert.match(sharedPlan, /generated\s+`apps\/android\/app\/src\/main\/assets\/filtertube_runtime_full\.js` must not be\s+hand-patched/);
});

test('raw root captures are ignored evidence and not native sync inputs', () => {
  const gitignore = read('.gitignore');
  const manifest = readJson('tools/runtime-sync-manifest.json', appRoot);
  const manifestSources = new Set(manifest.map(entry => entry.source));
  const manifestDestinations = manifest.map(entry => entry.destination).join('\n');

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
    assert.equal(manifestSources.has(capture), false, `${capture} should not be a sync source`);
    assert.equal(manifestDestinations.includes(capture), false, `${capture} should not be a sync destination`);
  }
});

test('native runtime sync future authority token is absent from product source', () => {
  const sourceFiles = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'));
  const combined = sourceFiles.map(file => read(file)).join('\n');

  assert.doesNotMatch(combined, /\bnativeRuntimeSyncAuthority\b/);
  assert.match(read(auditDocPath), /Future token: `nativeRuntimeSyncAuthority`/);
});
