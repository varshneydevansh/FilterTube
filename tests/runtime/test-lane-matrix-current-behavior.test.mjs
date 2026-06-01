import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILE_LANE_RULES,
  LANES,
  auditProofRequirement,
  changedPathsFromGit,
  classifyPaths,
  laneNames,
  newChangedPaths,
  runtimeFixtureRequirement,
  validateLaneFiles
} from '../../scripts/run-test-lane.mjs';
import { collectProofDrift, laneOwnedProofFiles } from '../../scripts/audit-proof-drift.mjs';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const requiredLanes = [
  'release',
  'whitelist',
  'blocking',
  'json',
  'dom',
  'menu',
  'performance',
  'settings',
  'smoke'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function collectJsFiles(dir = 'js') {
  const root = path.join(repoRoot, dir);
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      out.push(...collectJsFiles(rel));
    } else if (entry.isFile() && rel.endsWith('.js')) {
      out.push(rel);
    }
  }
  return out.sort();
}

function collectTopLevelProductDocFiles() {
  return fs.readdirSync(path.join(repoRoot, 'docs'), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => `docs/${entry.name}`)
    .sort();
}

function collectTrackedFiles() {
  const result = spawnSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || 'git ls-files failed');
  return result.stdout.split(/\r?\n/).filter(Boolean).sort();
}

test('test lane matrix defines every required lane and npm script', () => {
  const pkg = readJson('package.json');
  const matrix = read(matrixPath);
  const driftScript = read('scripts/audit-proof-drift.mjs');
  const runner = read('scripts/run-test-lane.mjs');
  const config = read('scripts/test-lane-config.mjs');
  const resumedGoalTerms = [
    'FilterTube Change-Safety Audit and Test Lanes',
    'Keep audit proof files inside `docs/audit/`',
    'Turn confirmed risks into focused fixtures/tests',
    'Create `docs/audit/TEST_LANE_MATRIX.md`',
    'Define required lanes by touched area',
    'Commit only with passing lane'
  ];

  assert.deepEqual(laneNames().sort(), requiredLanes.toSorted());
  assert.equal(validateLaneFiles().length, 0);

  for (const lane of requiredLanes) {
    assert.equal(pkg.scripts[`test:${lane}`], `node scripts/run-test-lane.mjs ${lane}`);
    assert.match(matrix, new RegExp(`npm run test:${lane}`));
    assert.ok(LANES[lane].description);
    assert.ok(Array.isArray(LANES[lane].tests));
    assert.ok(LANES[lane].tests.length >= 8, `${lane} lane should have focused test coverage`);
  }

  assert.equal(pkg.scripts['test:audit-drift'], 'node scripts/audit-proof-drift.mjs --lane-owned');
  assert.equal(pkg.scripts['lanes:changed'], 'node scripts/run-test-lane.mjs --changed');
  assert.equal(pkg.scripts['test:changed'], 'node scripts/run-test-lane.mjs --run-changed');
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');
  assert.match(runner, /from '\.\/test-lane-config\.mjs'/);
  assert.match(driftScript, /from '\.\/test-lane-config\.mjs'/);
  assert.match(config, /export const LANES = Object\.freeze/);
  assert.match(config, /export const FILE_LANE_RULES = Object\.freeze/);
  assert.match(matrix, /npm run test:audit-drift/);
  assert.match(matrix, /npm run lanes:changed/);
  assert.match(matrix, /npm run test:changed/);
  assert.match(matrix, /npm run audit:runtime/);
  assert.match(matrix, /scripts\/test-lane-config\.mjs/);
  assert.match(matrix, /execution stays separate from the declarative matrix/);
  assert.match(matrix, /Manual YouTube Smoke Handoff/);
  assert.match(matrix, /docs\/audit\/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(matrix, /docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json/);
  assert.match(matrix, /docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/run-live-smoke\.mjs/);
  assert.match(matrix, /docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/verify-live-smoke-artifact\.mjs/);
  assert.match(driftScript, /args\.has\('--lane-owned'\) && args\.has\('--all'\)/);

  for (const term of resumedGoalTerms) {
    assert.ok(matrix.includes(term), `resumed goal coverage missing ${term}`);
  }
});

test('test lane matrix maps high-risk source files to expected lanes', () => {
  const matrix = read(matrixPath);

  const requiredMappings = [
    { files: ['js/seed.js'], lanes: ['test:json', 'test:performance'] },
    { files: ['js/injector.js'], lanes: ['test:json', 'test:whitelist', 'test:performance'] },
    { files: ['js/filter_logic.js'], lanes: ['test:json', 'test:blocking', 'test:whitelist', 'test:performance'] },
    { files: ['js/content/dom_fallback.js'], lanes: ['test:whitelist', 'test:dom', 'test:blocking', 'test:performance'] },
    { files: ['js/content/block_channel.js'], lanes: ['test:menu', 'test:blocking', 'test:performance'] },
    { files: ['js/content/bridge_injection.js'], lanes: ['test:release', 'test:json', 'test:performance', 'test:settings'] },
    { files: ['js/content/collab_dialog.js'], lanes: ['test:whitelist', 'test:blocking', 'test:menu', 'test:performance'] },
    { files: ['js/content/dom_helpers.js', 'js/content/dom_state.js'], lanes: ['test:whitelist', 'test:blocking', 'test:dom', 'test:performance'] },
    { files: ['js/content/first_run_prompt.js', 'js/content/release_notes_prompt.js'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['js/content_bridge.js'], lanes: ['test:whitelist', 'test:blocking', 'test:json', 'test:dom', 'test:menu', 'test:performance', 'test:settings'] },
    { files: ['js/content/bridge_settings.js'], lanes: ['test:json', 'test:performance', 'test:settings'] },
    { files: ['js/background.js'], lanes: ['test:release', 'test:whitelist', 'test:blocking', 'test:json', 'test:performance', 'test:settings'] },
    { files: ['js/settings_shared.js'], lanes: ['test:whitelist', 'test:blocking', 'test:settings'] },
    { files: ['js/state_manager.js', 'js/io_manager.js'], lanes: ['test:settings'] },
    { files: ['js/content_controls_catalog.js'], lanes: ['test:whitelist', 'test:blocking', 'test:json', 'test:dom', 'test:menu', 'test:performance', 'test:settings'] },
    { files: ['js/popup.js', 'js/tab-view.js', 'js/render_engine.js', 'js/ui_components.js'], lanes: ['test:release', 'test:whitelist', 'test:blocking', 'test:menu', 'test:settings', 'test:smoke'] },
    { files: ['js/nanah_sync_adapter.js', 'js/security_manager.js'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['js/layout.js'], lanes: ['test:release', 'test:dom', 'test:smoke'] },
    { files: ['js/shared/identity.js', 'js/content/dom_extractors.js', 'js/content/handle_resolver.js'], lanes: ['test:whitelist', 'test:blocking', 'test:menu'] },
    { files: ['js/vendor/*.bundle.js'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['scripts/build-extension-ui.mjs', 'scripts/build-nanah-vendor.mjs'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['manifest*.json'], lanes: ['test:release'] },
    { files: ['README.md', 'CHANGELOG.md', 'data/release_notes.json'], lanes: ['test:release', 'test:smoke'] },
    { files: ['LICENSE', 'root `*.md`'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/*.md'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/audit/artifacts/release-live-youtube-spa-smoke/*.{json,mjs}'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/audit/artifacts/empty-install-idle-probe.mjs'], lanes: ['test:performance', 'test:smoke'] },
    { files: ['html/popup.html', 'css/popup.css', 'js/ui-shell/popup-shell.js', 'src/extension-shell/popup.jsx'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['html/tab-view.html'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['css/content.css', 'css/filter.css', 'css/layout.css'], lanes: ['test:release', 'test:dom', 'test:smoke'] },
    { files: ['assets/images/*', 'icons/*', 'design/design_tokens.json'], lanes: ['test:release', 'test:smoke'] },
    { files: ['scripts/compress-video.swift', 'scripts/sync-native-runtime.mjs'], lanes: ['test:release', 'test:smoke'] },
    { files: ['tests/runtime/harness/load-filter-engine.mjs'], lanes: ['test:whitelist', 'test:blocking', 'test:json', 'test:dom', 'test:menu', 'test:performance', 'test:settings', 'test:smoke'] },
    { files: ['tests/runtime/harness/load-seed-runtime.mjs'], lanes: ['test:whitelist', 'test:json', 'test:performance', 'test:smoke'] },
    { files: ['tests/runtime/fixtures/**/*.json'], lanes: ['test:json', 'test:smoke'] },
    { files: ['tests/runtime/fixtures/**/*.html'], lanes: ['test:dom', 'test:smoke'] },
    { files: ['fixture names containing `collab`, `dialog`, or `show-sheet`'], lanes: ['test:whitelist', 'test:blocking', 'test:menu'] },
    { files: ['fixture names containing `comment`, `channel`, or `keyword`'], lanes: ['test:blocking'] },
    { files: ['fixture names containing `kids`, `shorts`, `watch`, `upnext`, `endscreen`, `autoplay`, `playlist`, or `ytm`'], lanes: ['test:whitelist'] }
  ];

  for (const { files, lanes } of requiredMappings) {
    const row = matrix.split('\n').find(line => line.startsWith('|') && files.every(file => line.includes(file)));
    assert.ok(row, `${files.join(', ')} mapping missing`);
    for (const lane of lanes) {
      assert.match(row, new RegExp(lane.replace(':', ':')));
    }
  }
});

test('executable classifier maps high-risk paths to required lanes', () => {
  assert.ok(FILE_LANE_RULES.length >= 40);

  const seed = classifyPaths(['js/seed.js']);
  assert.deepEqual(seed.lanes, ['json', 'performance']);
  assert.deepEqual(seed.unmatched, []);

  const bridge = classifyPaths(['js/content_bridge.js']);
  assert.deepEqual(bridge.lanes, ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings']);
  assert.deepEqual(bridge.unmatched, []);

  const release = classifyPaths(['README.md', 'manifest.chrome.json', 'docs/audit/TEST_LANE_MATRIX.md']);
  assert.deepEqual(release.lanes, ['release', 'smoke']);
  assert.deepEqual(release.unmatched, []);

  const auditDoc = classifyPaths(['docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md']);
  assert.deepEqual(auditDoc.lanes, ['json', 'smoke']);
  assert.deepEqual(auditDoc.unmatched, []);

  const packageSurface = classifyPaths(['package.json', 'website/components/footer-signal-art.js']);
  assert.deepEqual(packageSurface.lanes, ['release', 'smoke']);
  assert.deepEqual(packageSurface.unmatched, []);

  const releaseCopy = classifyPaths(['build.js', 'CHANGELOG.md', 'data/release_notes.json']);
  assert.deepEqual(releaseCopy.lanes, ['release', 'smoke']);
  assert.deepEqual(releaseCopy.unmatched, []);

  const popupShell = classifyPaths([
    'html/popup.html',
    'css/popup.css',
    'js/ui-shell/popup-shell.js',
    'src/extension-shell/popup.jsx'
  ]);
  assert.deepEqual(popupShell.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(popupShell.unmatched, []);
  for (const classification of popupShell.classifications) {
    assert.ok(
      classification.matched.some(match => match.id === 'extension-popup-shell-surface'),
      `${classification.file} should be classified as popup settings shell`
    );
  }

  const tabViewShell = classifyPaths(['html/tab-view.html']);
  assert.deepEqual(tabViewShell.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(tabViewShell.unmatched, []);
  assert.equal(
    tabViewShell.classifications[0].matched.some(match => match.id === 'extension-tab-view-settings-shell-surface'),
    true
  );

  const decorativeShell = classifyPaths([
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js'
  ]);
  assert.deepEqual(decorativeShell.lanes, ['release', 'smoke']);
  assert.deepEqual(decorativeShell.unmatched, []);

  const liveSmokeArtifact = classifyPaths(['docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs']);
  assert.deepEqual(liveSmokeArtifact.lanes, ['release', 'smoke']);
  assert.deepEqual(liveSmokeArtifact.unmatched, []);
  assert.equal(liveSmokeArtifact.classifications[0].matched[0].id, 'live-smoke-artifact-surface');

  const productDoc = classifyPaths(['docs/ARCHITECTURE.md']);
  assert.deepEqual(productDoc.lanes, ['release', 'smoke']);
  assert.deepEqual(productDoc.unmatched, []);
  assert.equal(productDoc.classifications[0].matched[0].id, 'product-doc-surface');

  const license = classifyPaths(['LICENSE']);
  assert.deepEqual(license.lanes, ['release', 'smoke']);
  assert.deepEqual(license.unmatched, []);
  assert.equal(license.classifications[0].matched[0].id, 'root-legal-doc-surface');

  const rootDoc = classifyPaths(['channel-identity-watch-mix-collab-recovery-plan.md']);
  assert.deepEqual(rootDoc.lanes, ['release', 'smoke']);
  assert.deepEqual(rootDoc.unmatched, []);
  assert.equal(rootDoc.classifications[0].matched[0].id, 'root-product-doc-surface');

  assert.deepEqual(classifyPaths(['js/content/bridge_injection.js']).lanes, ['release', 'json', 'performance', 'settings']);
  assert.deepEqual(classifyPaths(['js/content/block_channel.js']).lanes, ['blocking', 'menu', 'performance']);
  assert.deepEqual(classifyPaths(['js/content/collab_dialog.js']).lanes, ['whitelist', 'blocking', 'menu', 'performance']);
  assert.deepEqual(classifyPaths(['js/content/dom_fallback.js']).lanes, ['whitelist', 'blocking', 'dom', 'performance']);
  assert.deepEqual(classifyPaths(['js/content/dom_state.js']).lanes, ['whitelist', 'blocking', 'dom', 'performance']);
  assert.deepEqual(classifyPaths(['js/content/first_run_prompt.js']).lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths(['js/filter_logic.js']).lanes, ['whitelist', 'blocking', 'json', 'performance']);
  assert.deepEqual(classifyPaths(['js/content/bridge_settings.js']).lanes, ['json', 'performance', 'settings']);
  assert.deepEqual(classifyPaths(['js/background.js']).lanes, ['release', 'whitelist', 'blocking', 'json', 'performance', 'settings']);
  assert.deepEqual(classifyPaths(['js/settings_shared.js']).lanes, ['whitelist', 'blocking', 'settings']);
  assert.deepEqual(classifyPaths(['js/state_manager.js', 'js/io_manager.js']).lanes, ['settings']);
  assert.deepEqual(classifyPaths(['js/content_controls_catalog.js']).lanes, ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings']);
  assert.deepEqual(classifyPaths(['js/tab-view.js']).lanes, ['release', 'whitelist', 'blocking', 'menu', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths(['js/layout.js']).lanes, ['release', 'dom', 'smoke']);
  assert.deepEqual(classifyPaths(['css/content.css', 'css/filter.css', 'css/layout.css']).lanes, ['release', 'dom', 'smoke']);
  assert.deepEqual(classifyPaths(['js/vendor/nanah.bundle.js']).lanes, ['release', 'settings', 'smoke']);

  const uiBuildHelper = classifyPaths(['scripts/build-extension-ui.mjs']);
  assert.deepEqual(uiBuildHelper.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(uiBuildHelper.unmatched, []);
  assert.equal(
    uiBuildHelper.classifications[0].matched.some(match => match.id === 'extension-ui-build-helper-surface'),
    true
  );

  const vendorBuildHelper = classifyPaths(['scripts/build-nanah-vendor.mjs']);
  assert.deepEqual(vendorBuildHelper.lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(vendorBuildHelper.unmatched, []);
  assert.equal(
    vendorBuildHelper.classifications[0].matched.some(match => match.id === 'vendor-sync-build-helper-surface'),
    true
  );

  assert.deepEqual(classifyPaths(['assets/images/homepage_hero_day.mp4']).lanes, ['release', 'smoke']);
  assert.deepEqual(classifyPaths(['icons/icon-128.png']).lanes, ['release', 'smoke']);
  assert.deepEqual(classifyPaths(['design/design_tokens.json']).lanes, ['release', 'smoke']);
  assert.deepEqual(classifyPaths(['scripts/sync-native-runtime.mjs']).lanes, ['release', 'smoke']);
  assert.deepEqual(classifyPaths(['docs/audit/artifacts/empty-install-idle-probe.mjs']).lanes, ['performance', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/harness/load-filter-engine.mjs']).lanes, ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/harness/load-seed-runtime.mjs']).lanes, ['whitelist', 'json', 'performance', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/fixtures/captures/main-watch-initial-lockup-shorts-json.json']).lanes, ['whitelist', 'json', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html']).lanes, ['whitelist', 'blocking', 'dom', 'menu', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/fixtures/captures/main-comment-thread-renderer.json']).lanes, ['blocking', 'json', 'smoke']);
  assert.deepEqual(classifyPaths(['tests/runtime/fixtures/captures/ytm-dom-video-card-with-menu.html']).lanes, ['whitelist', 'dom', 'menu', 'smoke']);
});

test('executable classifier inherits lanes from lane-owned tests and rejects unknown paths', () => {
  const owned = classifyPaths(['tests/runtime/native-dropdown-close-state-current-behavior.test.mjs']);
  assert.deepEqual(owned.lanes, ['menu', 'smoke']);
  assert.deepEqual(owned.unmatched, []);
  assert.equal(owned.classifications[0].matched[0].id, 'lane-owned-test-or-check');

  const unknown = classifyPaths(['tools/new-unclassified-helper.js']);
  assert.deepEqual(unknown.lanes, []);
  assert.deepEqual(unknown.unmatched, ['tools/new-unclassified-helper.js']);
});

test('executable classifier covers every current JavaScript source file', () => {
  const jsFiles = collectJsFiles();
  const result = classifyPaths(jsFiles);

  assert.ok(jsFiles.length >= 30);
  assert.deepEqual(result.unmatched, []);
});

test('executable classifier covers every top-level product documentation file', () => {
  const productDocs = collectTopLevelProductDocFiles();
  const result = classifyPaths(productDocs);

  assert.ok(productDocs.length >= 30);
  assert.deepEqual(result.lanes, ['release', 'smoke']);
  assert.deepEqual(result.unmatched, []);
});

test('executable classifier covers every tracked repository file', () => {
  const trackedFiles = collectTrackedFiles();
  const result = classifyPaths(trackedFiles);

  assert.ok(trackedFiles.length >= 1200);
  assert.deepEqual(result.unmatched, []);
});

test('changed-lane runner is wired to the classifier and sequential lane execution', () => {
  const runner = read('scripts/run-test-lane.mjs');
  const config = read('scripts/test-lane-config.mjs');
  const matrix = read(matrixPath);

  assert.match(config, /id: 'lane-workflow-surface'/);
  assert.match(config, /run-test-lane\|test-lane-config\|audit-proof-drift/);
  assert.match(runner, /gitLineReader\(\['diff', '--name-only', 'HEAD', '--'\]\)/);
  assert.match(runner, /gitLineReader\(\['ls-files', '--others', '--exclude-standard'\]\)/);
  assert.doesNotMatch(runner, /--diff-filter=ACMRTUXB/);
  assert.match(runner, /if \(result\.signal\) return 1/);
  assert.match(runner, /lane === '--run-changed' \|\| lane === 'run-changed'/);
  assert.match(runner, /const initialChangedPaths = changedPathsFromGit\(\)/);
  assert.match(runner, /const result = classifyPaths\(initialChangedPaths\)/);
  assert.match(runner, /const extraDirtyPaths = newChangedPaths\(initialChangedPaths, changedPathsFromGit\(\)\)/);
  assert.match(runner, /test:changed left additional dirty paths/);
  assert.match(runner, /process\.exit\(5\)/);
  assert.match(runner, /if \(result\.unmatched\.length\) process\.exit\(2\)/);
  assert.match(runner, /MANUAL_YOUTUBE_SMOKE_LANE_REASONS/);
  assert.match(runner, /Manual YouTube smoke required when user-facing/);
  assert.match(runner, /LIVE_SMOKE_ARTIFACT_TEMPLATE/);
  assert.match(runner, /LIVE_SMOKE_ARTIFACT_VERIFIER/);
  assert.match(runner, /LIVE_SMOKE_REQUIRED_ROWS/);
  assert.match(runner, /Live smoke artifact handoff/);
  assert.match(runner, /RUNTIME_FIXTURE_LANE_REASONS/);
  assert.match(runner, /function runtimeFixtureRequirement\(result\)/);
  assert.match(runner, /Runtime fixture\/test proof files in this change/);
  assert.match(runner, /Runtime fixture\/test proof relevance mismatch/);
  assert.match(runner, /sharedRuntimeProofLanes/);
  assert.match(runner, /Runtime fixture proof expected when behavior changes/);
  assert.match(runner, /AUDIT_PROOF_PATH_PATTERN/);
  assert.match(runner, /function auditProofRequirement\(result\)/);
  assert.match(runner, /Audit proof update expected before commit/);
  assert.match(runner, /Audit proof files in this change/);
  assert.match(runner, /Audit proof relevance mismatch/);
  assert.match(runner, /sharedProofLanes/);
  assert.match(runner, /function formatLaneList\(lanes\)/);
  assert.match(runner, /if \(auditProof\.missing\) process\.exit\(3\)/);
  assert.match(runner, /if \(auditProof\.irrelevant\) process\.exit\(4\)/);
  assert.match(runner, /function runAuditDrift\(\)/);
  assert.match(runner, /runNode\(\['scripts\/audit-proof-drift\.mjs', '--lane-owned'\]\)/);
  assert.match(runner, /console\.log\('\\n==> Running test:audit-drift'\)/);
  assert.match(runner, /const driftStatus = runAuditDrift\(\)/);
  assert.match(runner, /for \(const changedLane of result\.lanes\)/);
  assert.match(runner, /runLane\(changedLane\)/);
  assert.match(runner, /process\.exit\(runLane\(lane\)\)/);
  assert.match(matrix, /fails on any unclassified\s+changed path/);
  assert.match(matrix, /runs the\s+lane-owned audit\s+proof drift guard/);
  assert.match(matrix, /runs\s+the required lanes sequentially in\s+matrix order/);
  assert.match(matrix, /fails if focused lane execution leaves additional\s+tracked or unignored dirty paths/);
  assert.match(matrix, /prints a manual YouTube\s+smoke advisory/);
  assert.match(matrix, /includes the structured live-smoke template, verifier command,\s+and required SPA row ids/);
  assert.match(matrix, /reports whether a changed\s+`docs\/audit\/` proof file is present/);
  assert.match(matrix, /fails\s+when source, release, asset, or product-doc paths changed without a matching\s+`docs\/audit\/` proof file/);
  assert.match(matrix, /fails when changed\s+`docs\/audit\/` proof does not share\s+at least one non-smoke lane/);
  assert.match(matrix, /prints a fixture-proof reminder\s+for the affected runtime lanes/);
  assert.match(matrix, /reports whether changed runtime fixture\/test files share\s+at least one touched runtime lane/);
});

test('changed-lane path collection includes untracked nonignored files', () => {
  const calls = [];
  const changedPaths = changedPathsFromGit(args => {
    calls.push(args);
    if (args[0] === 'diff') return ['js/seed.js'];
    if (args[0] === 'ls-files') {
      return ['docs/audit/FILTERTUBE_LANE_CHANGED_PROBE_2026-06-01.md'];
    }
    return [];
  });
  const result = classifyPaths(changedPaths);

  assert.deepEqual(calls, [
    ['diff', '--name-only', 'HEAD', '--'],
    ['ls-files', '--others', '--exclude-standard']
  ]);
  assert.deepEqual(changedPaths, [
    'js/seed.js',
    'docs/audit/FILTERTUBE_LANE_CHANGED_PROBE_2026-06-01.md'
  ]);
  assert.deepEqual(result.lanes, ['json', 'performance', 'smoke']);
  assert.deepEqual(result.unmatched, []);
});

test('changed-lane dirty path guard reports only additional tracked or unignored paths', () => {
  const extra = newChangedPaths(
    ['js/seed.js', './docs/audit/TEST_LANE_MATRIX.md', ''],
    [
      'docs/audit/TEST_LANE_MATRIX.md',
      'js/seed.js',
      './tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      ' docs/audit/FILTERTUBE_EXTRA_PROOF_2026-06-01.md '
    ]
  );

  assert.deepEqual(extra, [
    'docs/audit/FILTERTUBE_EXTRA_PROOF_2026-06-01.md',
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
  ]);
});

test('classifier output surfaces manual YouTube smoke for user-facing runtime and release lanes', () => {
  const runtime = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'js/seed.js'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(runtime.status, 0, runtime.stderr);
  assert.match(runtime.stdout, /Required lane commands:/);
  assert.match(runtime.stdout, /npm run test:json/);
  assert.match(runtime.stdout, /npm run test:performance/);
  assert.match(runtime.stdout, /Manual YouTube smoke required when user-facing:/);
  assert.match(runtime.stdout, /test:json: JSON-first filtering/);
  assert.match(runtime.stdout, /test:performance: empty-rule\/no-work/);
  assert.match(runtime.stdout, /Live smoke artifact handoff:/);
  assert.match(runtime.stdout, /template: docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json/);
  assert.match(runtime.stdout, /verifier: node docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/verify-live-smoke-artifact\.mjs docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/<artifact>\.json/);
  assert.match(runtime.stdout, /FT-LIVE-SPA-00-home-to-search/);
  assert.match(runtime.stdout, /FT-LIVE-SPA-05-cache-repeat-navigation/);
  assert.match(runtime.stdout, /Audit proof update expected before commit:/);
  assert.match(runtime.stdout, /Add or update a relevant docs\/audit\/ proof file for:/);
  assert.match(runtime.stdout, /- js\/seed\.js/);
  assert.match(runtime.stdout, /Runtime fixture proof expected when behavior changes:/);
  assert.match(runtime.stdout, /test:json: JSON renderer, endpoint, response, or no-work fixtures/);
  assert.match(runtime.stdout, /test:performance: empty-rule\/no-work, SPA, timer, observer, or cache fixtures/);
  assert.match(runtime.stdout, /No runtime fixture\/test proof file changed/);

  const releaseOnly = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'README.md'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(releaseOnly.status, 0, releaseOnly.stderr);
  assert.match(releaseOnly.stdout, /Manual YouTube smoke required when user-facing:/);
  assert.match(releaseOnly.stdout, /test:release: release packaging, public claims, installed-extension parity, and artifact handoff behavior/);
  assert.match(releaseOnly.stdout, /Live smoke artifact handoff:/);
  assert.doesNotMatch(releaseOnly.stdout, /Runtime fixture proof expected when behavior changes:/);
});

test('classifier output surfaces runtime fixture proof lane relevance', () => {
  const matchingProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(matchingProof.status, 0, matchingProof.stderr);
  assert.match(matchingProof.stdout, /Runtime fixture\/test proof files in this change:/);
  assert.match(matchingProof.stdout, /tests\/runtime\/seed-network-current-behavior\.test\.mjs/);
  assert.match(matchingProof.stdout, /Shared runtime proof lane\(s\): test:json/);
  assert.doesNotMatch(matchingProof.stdout, /Runtime fixture\/test proof relevance mismatch:/);

  const mismatchedProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(mismatchedProof.status, 0, mismatchedProof.stderr);
  assert.match(mismatchedProof.stdout, /Runtime fixture\/test proof relevance mismatch:/);
  assert.match(mismatchedProof.stdout, /touched runtime lane\(s\): test:json, test:performance/);
  assert.match(mismatchedProof.stdout, /proof runtime lane\(s\): test:blocking/);
  assert.match(mismatchedProof.stdout, /behavior changes should update a fixture\/test that shares a touched runtime lane/);
});

test('classifier output recognizes changed audit proof files', () => {
  const proof = spawnSync(process.execPath, ['scripts/run-test-lane.mjs', '--classify', 'docs/audit/TEST_LANE_MATRIX.md'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(proof.status, 0, proof.stderr);
  assert.match(proof.stdout, /Audit proof files in this change:/);
  assert.match(proof.stdout, /docs\/audit\/TEST_LANE_MATRIX\.md/);
  assert.doesNotMatch(proof.stdout, /Audit proof update expected before commit:/);
  assert.doesNotMatch(proof.stdout, /Runtime fixture proof expected when behavior changes:/);

  const mismatchedProof = spawnSync(process.execPath, [
    'scripts/run-test-lane.mjs',
    '--classify',
    'js/seed.js',
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(mismatchedProof.status, 0, mismatchedProof.stderr);
  assert.match(mismatchedProof.stdout, /Audit proof relevance mismatch:/);
  assert.match(mismatchedProof.stdout, /touched lane\(s\): test:json, test:performance/);
  assert.match(mismatchedProof.stdout, /proof lane\(s\): test:blocking/);
  assert.match(mismatchedProof.stdout, /test:changed will fail until docs\/audit proof shares a non-smoke lane/);
});

test('changed-lane audit proof gate distinguishes proof-only and product changes', () => {
  const sourceOnly = auditProofRequirement(classifyPaths(['js/seed.js']));
  assert.deepEqual(sourceOnly.auditProofFiles, []);
  assert.deepEqual(sourceOnly.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceOnly.auditProofLanes, []);
  assert.deepEqual(sourceOnly.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceOnly.sharedProofLanes, []);
  assert.equal(sourceOnly.missing, true);
  assert.equal(sourceOnly.irrelevant, false);

  const sourceWithProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_JSON_TEST_LANE_PROOF_GATE_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_JSON_TEST_LANE_PROOF_GATE_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithProof.auditProofLanes, ['json']);
  assert.deepEqual(sourceWithProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithProof.sharedProofLanes, ['json']);
  assert.equal(sourceWithProof.missing, false);
  assert.equal(sourceWithProof.irrelevant, false);

  const sourceWithIrrelevantProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithIrrelevantProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_KEYWORD_BLOCKING_BOUNDARY_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithIrrelevantProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithIrrelevantProof.auditProofLanes, ['blocking']);
  assert.deepEqual(sourceWithIrrelevantProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithIrrelevantProof.sharedProofLanes, []);
  assert.equal(sourceWithIrrelevantProof.missing, false);
  assert.equal(sourceWithIrrelevantProof.irrelevant, true);

  const sourceWithGenericProof = auditProofRequirement(classifyPaths([
    'js/seed.js',
    'docs/audit/FILTERTUBE_GENERAL_NOTE_2026-06-01.md'
  ]));
  assert.deepEqual(sourceWithGenericProof.auditProofFiles, [
    'docs/audit/FILTERTUBE_GENERAL_NOTE_2026-06-01.md'
  ]);
  assert.deepEqual(sourceWithGenericProof.proofRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithGenericProof.auditProofLanes, []);
  assert.deepEqual(sourceWithGenericProof.proofRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithGenericProof.sharedProofLanes, []);
  assert.equal(sourceWithGenericProof.missing, false);
  assert.equal(sourceWithGenericProof.irrelevant, true);

  const testOnly = auditProofRequirement(classifyPaths([
    'tests/runtime/test-lane-matrix-current-behavior.test.mjs'
  ]));
  assert.deepEqual(testOnly.auditProofFiles, []);
  assert.deepEqual(testOnly.proofRelevantFiles, []);
  assert.deepEqual(testOnly.auditProofLanes, []);
  assert.deepEqual(testOnly.proofRelevantLanes, []);
  assert.deepEqual(testOnly.sharedProofLanes, []);
  assert.equal(testOnly.missing, false);
  assert.equal(testOnly.irrelevant, false);
});

test('runtime fixture proof gate distinguishes missing matching and unrelated proof', () => {
  const sourceOnly = runtimeFixtureRequirement(classifyPaths(['js/seed.js']));
  assert.deepEqual(sourceOnly.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceOnly.runtimeProofFiles, []);
  assert.deepEqual(sourceOnly.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceOnly.runtimeProofLanes, []);
  assert.deepEqual(sourceOnly.sharedRuntimeProofLanes, []);
  assert.equal(sourceOnly.missing, true);
  assert.equal(sourceOnly.irrelevant, false);

  const sourceWithProof = runtimeFixtureRequirement(classifyPaths([
    'js/seed.js',
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ]));
  assert.deepEqual(sourceWithProof.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithProof.runtimeProofFiles, [
    'tests/runtime/seed-network-current-behavior.test.mjs'
  ]);
  assert.deepEqual(sourceWithProof.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithProof.runtimeProofLanes, ['json']);
  assert.deepEqual(sourceWithProof.sharedRuntimeProofLanes, ['json']);
  assert.equal(sourceWithProof.missing, false);
  assert.equal(sourceWithProof.irrelevant, false);

  const sourceWithUnrelatedProof = runtimeFixtureRequirement(classifyPaths([
    'js/seed.js',
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ]));
  assert.deepEqual(sourceWithUnrelatedProof.runtimeRelevantFiles, ['js/seed.js']);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeProofFiles, [
    'tests/runtime/filter-engine-current-behavior.test.mjs'
  ]);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeRelevantLanes, ['json', 'performance']);
  assert.deepEqual(sourceWithUnrelatedProof.runtimeProofLanes, ['blocking']);
  assert.deepEqual(sourceWithUnrelatedProof.sharedRuntimeProofLanes, []);
  assert.equal(sourceWithUnrelatedProof.missing, false);
  assert.equal(sourceWithUnrelatedProof.irrelevant, true);

  const releaseOnly = runtimeFixtureRequirement(classifyPaths(['README.md']));
  assert.deepEqual(releaseOnly.runtimeRelevantFiles, []);
  assert.deepEqual(releaseOnly.runtimeProofFiles, []);
  assert.deepEqual(releaseOnly.runtimeRelevantLanes, []);
  assert.deepEqual(releaseOnly.runtimeProofLanes, []);
  assert.deepEqual(releaseOnly.sharedRuntimeProofLanes, []);
  assert.equal(releaseOnly.missing, false);
  assert.equal(releaseOnly.irrelevant, false);
});

test('smoke lane keeps release confidence broad but bounded', () => {
  const smoke = LANES.smoke.tests.join('\n');

  assert.match(smoke, /active-rule-authority-current-behavior/);
  assert.match(smoke, /filter-engine-current-behavior/);
  assert.match(smoke, /main-profile-blocklist-keyword-alias-current-behavior/);
  assert.match(smoke, /json-first-whitelist-decision-identity-boundary-current-behavior/);
  assert.match(smoke, /content-bridge-whitelist-pending-refresh-boundary-current-behavior/);
  assert.match(smoke, /main-watch-autoplay-video-endpoint-current-behavior/);
  assert.match(smoke, /storage-refresh-force-reprocess-coalescing-current-behavior/);
  assert.match(smoke, /native-dropdown-close-state-current-behavior/);
  assert.match(smoke, /quick-block-block-menu-affordance-boundary-current-behavior/);
  assert.match(smoke, /dom-state-virtual-attributes-current-behavior/);
  assert.match(smoke, /empty-install-performance-current-behavior/);
  assert.match(smoke, /runtime-diagnostic-logging-policy-matrix-current-behavior/);
  assert.match(smoke, /public-release-surface-current-behavior/);
  assert.match(smoke, /release-live-youtube-spa-smoke-boundary-current-behavior/);
  assert.ok(LANES.smoke.checks.includes('build.js'));
});

test('whitelist lane explicitly owns end-screen boundary proof', () => {
  const whitelist = LANES.whitelist.tests.join('\n');
  const matrix = read(matrixPath);

  assert.match(whitelist, /main-watch-initial-lockup-shorts-json-current-behavior/);
  assert.match(whitelist, /main-watch-initial-shorts-owner-absent-boundary-current-behavior/);
  assert.match(whitelist, /json-first-hide-all-shorts-boundary-current-behavior/);
  assert.match(whitelist, /shorts-dom-cleanup-boundary-current-behavior/);
  assert.match(whitelist, /main-watch-autoplay-video-endpoint-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-videowall-boundary-current-behavior/);
  assert.match(whitelist, /json-first-hide-endscreen-cards-boundary-current-behavior/);
  assert.match(whitelist, /json-first-disable-autoplay-annotations-boundary-current-behavior/);
  assert.match(whitelist, /player-endscreen-dom-cleanup-boundary-current-behavior/);
  assert.match(matrix, /Whitelist-only leaks, pending hides, Shorts\/watch\/end-screen\/Kids\/YTM allow behavior/);
  assert.match(matrix, /The whitelist lane explicitly owns end-screen videowall, card, autoplay, and player DOM boundary tests/);
});

test('goal safety surfaces stay bound to focused lane proof tests', () => {
  const matrix = read(matrixPath);
  const surfaceCoverage = [
    {
      surface: 'blocklist behavior',
      lane: 'blocking',
      tests: [/filter-engine-current-behavior/, /main-profile-blocklist-keyword-alias-current-behavior/]
    },
    {
      surface: 'whitelist behavior',
      lane: 'whitelist',
      tests: [/json-first-whitelist-decision-identity-boundary/, /content-bridge-whitelist-pending-refresh-boundary/]
    },
    {
      surface: 'keyword/channel blocking',
      lane: 'blocking',
      tests: [/json-first-keyword-match-boundary/, /json-first-channel-match-boundary/]
    },
    {
      surface: 'Shorts behavior',
      lane: 'whitelist',
      tests: [
        /main-watch-initial-lockup-shorts-json-current-behavior/,
        /main-watch-initial-shorts-owner-absent-boundary-current-behavior/,
        /json-first-hide-all-shorts-boundary-current-behavior/,
        /shorts-dom-cleanup-boundary-current-behavior/
      ]
    },
    {
      surface: 'end screens',
      lane: 'whitelist',
      tests: [/json-first-hide-endscreen-videowall-boundary/, /json-first-hide-endscreen-cards-boundary/, /main-watch-autoplay-video-endpoint/, /player-endscreen-dom-cleanup-boundary/]
    },
    {
      surface: 'quick-block and 3-dot menus',
      lane: 'menu',
      tests: [
        /quick-block-block-menu-affordance-boundary/,
        /native-dropdown-close-state/,
        /content-bridge-collaborator-identity-promotion-handoff/
      ]
    },
    {
      surface: 'JSON-first filtering',
      lane: 'json',
      tests: [/seed-network-current-behavior/, /json-first-response-mutation-contract/]
    },
    {
      surface: 'DOM fallback',
      lane: 'dom',
      tests: [/dom-fallback-selector-semantic-register/, /css-style-hide-authority/, /quarantined-content-css-package-boundary/, /dom-state-virtual-attributes/]
    },
    {
      surface: 'no-rule performance',
      lane: 'performance',
      tests: [
        /empty-install-performance-current-behavior/,
        /runtime-diagnostic-logging-policy-matrix-current-behavior/,
        /p0-no-work-current-behavior/
      ]
    },
    {
      surface: 'SPA navigation',
      lane: 'performance',
      tests: [/whitelist-cache-spa-metric-packet-gate/, /content-filter-route-surface-no-work-budget/]
    },
    {
      surface: 'settings',
      lane: 'settings',
      tests: [/settings-mode-coverage-matrix/, /compiled-settings-profile-list-mode-assembly/]
    },
    {
      surface: 'release packaging',
      lane: 'release',
      tests: [/p0-release-package-current-behavior/, /release-package-parity-current-behavior/, /quarantined-content-css-package-boundary/]
    }
  ];

  assert.match(matrix, /Named Safety Surface Coverage/);

  for (const { surface, lane, tests } of surfaceCoverage) {
    assert.ok(matrix.includes(surface), `matrix missing safety surface ${surface}`);
    assert.ok(matrix.includes(`test:${lane}`), `matrix missing lane ${lane} for ${surface}`);

    for (const pattern of tests) {
      assert.ok(
        LANES[lane].tests.some((testPath) => pattern.test(testPath)),
        `${surface} is not bound to ${lane} proof ${pattern}`
      );
    }
  }
});

test('user-reported regression anchors stay bound to proof lanes', () => {
  const matrix = read(matrixPath);

  const issue55 = [
    'Issue #55: whitelist leaks after SPA/cache reuse',
    'json-first-whitelist-decision-identity-boundary',
    'content-bridge-whitelist-pending-refresh-boundary',
    'right-rail-whitelist-observer',
    'whitelist-cache-spa-metric-packet-gate'
  ];
  const issue56 = [
    'Issue #56: Shorts hidden on whitelisted channels while Hide Shorts is disabled',
    'main-watch-initial-lockup-shorts-json-current-behavior',
    'main-watch-initial-shorts-owner-absent-boundary-current-behavior',
    'json-first-hide-all-shorts-boundary-current-behavior',
    'shorts-dom-cleanup-boundary-current-behavior'
  ];
  const issue57 = [
    'Issue #57: end-screen videowall/cards/autoplay panel leak in whitelist mode',
    'json-first-hide-endscreen-videowall',
    'json-first-hide-endscreen-cards',
    'json-first-disable-autoplay-annotations',
    'player-endscreen-dom-cleanup'
  ];
  const issue59 = [
    'Issue #59: public `data-filtertube-*` DOM fingerprint risk',
    'dom-state-virtual-attributes-current-behavior',
    'stale marker cleanup'
  ];

  assert.match(matrix, /User-Reported Regression Anchors/);

  for (const term of [...issue55, ...issue56, ...issue57, ...issue59]) {
    assert.ok(matrix.includes(term), `regression anchor missing ${term}`);
  }

  assert.ok(
    LANES.whitelist.tests.some(testPath => /main-watch-initial-shorts-owner-absent-boundary/.test(testPath)),
    'issue #56 owner-absent Shorts proof must stay in whitelist lane'
  );
  assert.ok(
    LANES.whitelist.tests.some(testPath => /json-first-hide-all-shorts-boundary/.test(testPath)),
    'issue #56 Hide Shorts proof must stay in whitelist lane'
  );
  assert.ok(
    LANES.dom.tests.some(testPath => /dom-state-virtual-attributes/.test(testPath)),
    'issue #59 DOM fingerprint proof must stay in DOM lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /json-first-whitelist-decision-identity-boundary/.test(testPath)),
    'issue #55/#56 whitelist identity sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /content-bridge-whitelist-pending-refresh-boundary/.test(testPath)),
    'issue #55 pending refresh sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /main-watch-autoplay-video-endpoint/.test(testPath)),
    'issue #57 autoplay endpoint sentinel must stay in smoke lane'
  );
  assert.ok(
    LANES.smoke.tests.some(testPath => /dom-state-virtual-attributes/.test(testPath)),
    'issue #59 virtual attribute sentinel must stay in smoke lane'
  );
});

test('menu lane owns collaborator identity promotion handoff proof', () => {
  const matrix = read(matrixPath);
  const menu = LANES.menu.tests.join('\n');

  assert.match(menu, /content-bridge-collaborator-identity-promotion-handoff-current-behavior/);
  assert.match(menu, /quick-block-block-menu-affordance-boundary-current-behavior/);
  assert.match(menu, /native-dropdown-close-state-current-behavior/);
  assert.match(matrix, /content-bridge-collaborator-identity-promotion-handoff/);
  assert.match(matrix, /ampersand Topic guard/);
  assert.match(matrix, /collaborator identity promotion handoff proof/);
});

test('manual YouTube smoke handoff covers visible release-critical behavior', () => {
  const matrix = read(matrixPath);
  const requiredTerms = [
    'blocklist',
    'whitelist',
    'keyword/channel blocking',
    'no-rule/no-work performance',
    'blocklist keyword/channel hiding',
    'whitelist-only mode',
    'Shorts behavior',
    'end-screen behavior',
    'quick-block and 3-dot menus',
    'JSON-first and DOM fallback',
    'settings/profile/storage',
    'release packaging',
    'verify-live-smoke-artifact.mjs',
    'installedByteParity.verdict=GO',
    'That test does not claim the manual smoke has passed'
  ];
  const requiredRows = [
    'FT-LIVE-SPA-00-home-to-search',
    'FT-LIVE-SPA-01-search-to-channel',
    'FT-LIVE-SPA-02-channel-to-watch',
    'FT-LIVE-SPA-03-watch-to-home',
    'FT-LIVE-SPA-04-watch-rail-scroll',
    'FT-LIVE-SPA-05-cache-repeat-navigation'
  ];

  for (const term of requiredTerms) {
    assert.ok(matrix.includes(term), `manual smoke handoff missing ${term}`);
  }

  for (const row of requiredRows) {
    assert.ok(matrix.includes(row), `manual smoke handoff missing ${row}`);
  }
});

test('lane-owned audit proof fingerprints do not silently drift', () => {
  const matrix = read(matrixPath);
  const files = laneOwnedProofFiles();
  const drift = collectProofDrift({ scope: 'lane-owned' });

  assert.ok(files.includes('tests/runtime/test-lane-matrix-current-behavior.test.mjs'));
  assert.ok(files.includes('scripts/audit-proof-drift.mjs'));
  assert.ok(files.includes('scripts/test-lane-config.mjs'));
  assert.deepEqual(drift, []);
  assert.match(matrix, /full audit proof drift inventory/);
  assert.match(matrix, /4719` tests ran, `4571` passed, and `148` failed/);
  assert.match(matrix, /audit:runtime` is the\s+inventory to retire or refresh/);
});
