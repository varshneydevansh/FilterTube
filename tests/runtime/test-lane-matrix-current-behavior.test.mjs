import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILE_LANE_RULES,
  LANES,
  classifyPaths,
  laneNames,
  validateLaneFiles
} from '../../scripts/run-test-lane.mjs';

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

function assertClassifiedLanesInclude(files, expectedLanes) {
  const result = classifyPaths(files);

  assert.deepEqual(result.unmatched, [], `${files.join(', ')} should be classified`);
  for (const lane of expectedLanes) {
    assert.ok(
      result.lanes.includes(lane),
      `${files.join(', ')} should include test:${lane}; got ${result.lanes.map(item => `test:${item}`).join(', ')}`
    );
  }
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
  assert.equal(pkg.scripts.test, 'node scripts/run-test-lane.mjs smoke');
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');
  assert.equal(
    pkg.scripts['smoke:youtube'],
    'node docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs'
  );
  assert.equal(
    pkg.scripts['smoke:youtube:verify'],
    'node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs'
  );
  assert.match(runner, /from '\.\/test-lane-config\.mjs'/);
  assert.match(driftScript, /from '\.\/test-lane-config\.mjs'/);
  assert.match(config, /export const LANES = Object\.freeze/);
  assert.match(config, /export const FILE_LANE_RULES = Object\.freeze/);
  assert.match(matrix, /npm run test:audit-drift/);
  assert.match(matrix, /npm run lanes:changed/);
  assert.match(matrix, /npm run test:changed/);
  assert.match(matrix, /npm run smoke:youtube/);
  assert.match(matrix, /FILTERTUBE_LOGICAL_CHANGE_TYPE="runtime hot-path change"/);
  assert.match(matrix, /FILTERTUBE_REQUIRED_LANES="test:json,test:performance"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_COMMAND="npm run test:changed"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_STATUS="passed"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_SUMMARY="test:changed passed for the classified lanes"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_LANES="test:json,test:performance"/);
  assert.match(
    matrix,
    /npm run smoke:youtube:verify -- docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/<artifact>\.json/
  );
  assert.match(matrix, /Plain `npm test` runs the same bounded smoke lane as `npm run test:smoke`/);
  assert.match(matrix, /logical changes should still use `npm run test:changed`/);
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
    { files: ['js/popup.js', 'js/tab-view.js', 'js/render_engine.js', 'js/ui_components.js', 'js/managed_parent_command_center.js'], lanes: ['test:release', 'test:whitelist', 'test:blocking', 'test:menu', 'test:settings', 'test:smoke'] },
    { files: ['js/nanah_sync_adapter.js', 'js/nanah_managed_open_sync.js', 'js/security_manager.js'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['js/layout.js'], lanes: ['test:release', 'test:dom', 'test:smoke'] },
    { files: ['js/shared/identity.js', 'js/content/dom_extractors.js', 'js/content/handle_resolver.js'], lanes: ['test:whitelist', 'test:blocking', 'test:menu'] },
    { files: ['release-notes JSON version-gate audit docs under `docs/audit/`'], lanes: ['test:release', 'test:smoke'] },
    { files: ['identity, resolver, handle, or waterfall audit docs under `docs/audit/`'], lanes: ['test:whitelist', 'test:blocking', 'test:menu', 'test:smoke'] },
    { files: ['alias, list-mode, settings source/effect, claim-register, or row-list-mode audit docs under `docs/audit/`'], lanes: ['test:whitelist', 'test:blocking', 'test:settings', 'test:smoke'] },
    { files: ['backup or Nanah audit docs under `docs/audit/`'], lanes: ['test:settings', 'test:smoke'] },
    { files: ['renderer, watch, search, Shorts, end-screen, autoplay, playlist, or Kids browse audit docs under `docs/audit/`'], lanes: ['test:whitelist', 'test:blocking', 'test:json', 'test:dom', 'test:smoke'] },
    { files: ['menu, quick-block, collaborator, or dropdown audit docs under `docs/audit/`'], lanes: ['test:menu', 'test:smoke'] },
    { files: ['filter-logic method, direct renderer, rule-field, or rule-path audit docs under `docs/audit/`'], lanes: ['test:whitelist', 'test:blocking', 'test:json', 'test:dom', 'test:performance', 'test:smoke'] },
    { files: ['network, fetch, XHR, or credential audit docs under `docs/audit/`'], lanes: ['test:json', 'test:performance', 'test:smoke'] },
    { files: ['main-world message, injection, trust, or startup-injection audit docs under `docs/audit/`'], lanes: ['test:release', 'test:json', 'test:settings', 'test:smoke'] },
    { files: ['generic message action, sender, side-effect, transport, or mutation audit docs under `docs/audit/`'], lanes: ['test:settings', 'test:smoke'] },
    { files: ['page-runtime lifecycle, observer, teardown, or selector lifecycle audit docs under `docs/audit/`'], lanes: ['test:dom', 'test:performance', 'test:smoke'] },
    { files: ['visual hide, hide-restore, direct-hide, broad-hide, CSS hide, or visibility-cleanup audit docs/tests under `docs/audit/` or `tests/runtime/`'], lanes: ['test:dom', 'test:smoke'] },
    { files: ['document-start or seed page-global patch audit docs under `docs/audit/`'], lanes: ['test:json', 'test:performance', 'test:smoke'] },
    { files: ['js/vendor/*.bundle.js'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['scripts/build-extension-ui.mjs', 'scripts/build-nanah-vendor.mjs'], lanes: ['test:release', 'test:settings', 'test:smoke'] },
    { files: ['manifest*.json'], lanes: ['test:release'] },
    { files: ['README.md', 'CHANGELOG.md', 'data/release_notes.json'], lanes: ['test:release', 'test:smoke'] },
    { files: ['LICENSE', 'root `*.md`'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/*.md'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/audit/artifacts/release-live-youtube-spa-smoke/*.{json,mjs}'], lanes: ['test:release', 'test:smoke'] },
    { files: ['docs/audit/artifacts/empty-install-idle-probe.mjs'], lanes: ['test:performance', 'test:smoke'] },
    { files: ['diagnostic, logging, console, no-work, cache, SPA, lag, active-work, active-rule, disabled-runtime, master-switch, or performance audit docs under `docs/audit/`'], lanes: ['test:performance', 'test:smoke'] },
    { files: ['code-burden, declutter, structural-burden, large-file, or large-source audit docs/tests under `docs/audit/` or `tests/runtime/`'], lanes: ['test:performance', 'test:smoke'] },
    { files: ['source-locus audit docs/tests under `docs/audit/` or `tests/runtime/`'], lanes: ['test:performance', 'test:smoke'] },
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

  const releaseNotesJsonAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]);
  assert.deepEqual(releaseNotesJsonAuditDoc.lanes, ['release', 'smoke']);
  assert.deepEqual(releaseNotesJsonAuditDoc.unmatched, []);
  assert.equal(
    releaseNotesJsonAuditDoc.classifications[0].matched.some(match => match.id === 'audit-json-proof-doc'),
    false,
    'release-notes JSON data proof must not require the runtime JSON-first filtering lane'
  );

  const diagnosticAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
  ]);
  assert.deepEqual(diagnosticAuditDoc.lanes, ['performance', 'smoke']);
  assert.deepEqual(diagnosticAuditDoc.unmatched, []);
  assert.equal(
    diagnosticAuditDoc.classifications[0].matched.some(match => match.id === 'audit-performance-proof-doc'),
    true
  );

  const activeRuleAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]);
  assert.deepEqual(activeRuleAuditDoc.lanes, ['performance', 'smoke']);
  assert.deepEqual(activeRuleAuditDoc.unmatched, []);
  for (const classification of activeRuleAuditDoc.classifications) {
    assert.equal(
      classification.matched.some(match => match.id === 'audit-performance-proof-doc'),
      true,
      `${classification.file} should be classified as performance proof`
    );
  }

  const codeBurdenProof = classifyPaths([
    'docs/audit/FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/code-burden-declutter-boundary-current-behavior.test.mjs'
  ]);
  assert.deepEqual(codeBurdenProof.lanes, ['performance', 'smoke']);
  assert.deepEqual(codeBurdenProof.unmatched, []);
  assert.equal(
    codeBurdenProof.classifications[0].matched.some(match => match.id === 'audit-code-burden-proof-doc'),
    true
  );
  assert.equal(
    codeBurdenProof.classifications[1].matched.some(match => match.id === 'runtime-code-burden-test'),
    true
  );

  const sourceLocusProof = classifyPaths([
    'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
    'tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs'
  ]);
  assert.deepEqual(sourceLocusProof.lanes, ['performance', 'smoke']);
  assert.deepEqual(sourceLocusProof.unmatched, []);
  assert.equal(
    sourceLocusProof.classifications[0].matched.some(match => match.id === 'audit-source-locus-proof-doc'),
    true
  );
  assert.equal(
    sourceLocusProof.classifications[1].matched.some(match => match.id === 'runtime-source-locus-test'),
    true
  );

  const identityAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
  ]);
  assert.deepEqual(identityAuditDoc.lanes, ['whitelist', 'blocking', 'json', 'menu', 'performance', 'smoke']);
  assert.deepEqual(identityAuditDoc.unmatched, []);
  for (const classification of identityAuditDoc.classifications) {
    assert.equal(
      classification.matched.some(match => match.id === 'audit-identity-proof-doc'),
      true,
      `${classification.file} should be classified as identity proof`
    );
  }

  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_PAGE_RUNTIME_LIFECYCLE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md'
  ]).lanes, ['dom', 'performance', 'smoke']);
  const visualHideProof = classifyPaths([
    'docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md',
    'tests/runtime/direct-hide-writer-register-current-behavior.test.mjs'
  ]);
  assert.deepEqual(visualHideProof.lanes, ['dom', 'smoke']);
  assert.deepEqual(visualHideProof.unmatched, []);
  assert.equal(visualHideProof.classifications[0].matched.some(match => match.id === 'audit-visual-hide-proof-doc'), true);
  assert.equal(visualHideProof.classifications[1].matched.some(match => match.id === 'runtime-visual-hide-test'), true);
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21.md',
    'docs/audit/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
  ]).lanes, ['json', 'performance', 'smoke']);
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_NETWORK_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
    'docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md'
  ]).lanes, ['json', 'performance', 'smoke']);
  const messageDispatchDoc = classifyPaths([
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
  ]);
  assert.deepEqual(messageDispatchDoc.lanes, ['release', 'json', 'settings', 'smoke']);
  assert.equal(
    messageDispatchDoc.classifications[0].matched.some(match => match.id === 'audit-performance-proof-doc'),
    false,
    'DISPATCH must not be classified as SPA performance proof by substring match'
  );
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_STARTUP_INJECTION_READINESS_CURRENT_BEHAVIOR_2026-05-19.md'
  ]).lanes, ['release', 'json', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md'
  ]).lanes, ['settings', 'smoke']);
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_STALE_ALIAS_FALSE_HIDE_CHAIN_2026-05-20.md',
    'docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]).lanes, ['whitelist', 'blocking', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]).lanes, ['settings', 'smoke']);
  const claimRegisterAuditDoc = classifyPaths([
    ['docs/audit/FILTERTUBE_SOURCE', 'OF', 'TRUTH_CLAIM_REGISTER_2026-05-20.md'].join('_'),
    ['tests/runtime/source', 'of', 'truth-claim-register-current-behavior.test.mjs'].join('-')
  ]);
  assert.deepEqual(claimRegisterAuditDoc.lanes, ['settings', 'smoke']);
  assert.deepEqual(claimRegisterAuditDoc.unmatched, []);
  assert.equal(
    claimRegisterAuditDoc.classifications[0].matched.some(match => match.id === 'audit-source-truth-claim-proof-doc'),
    true
  );
  assert.equal(
    claimRegisterAuditDoc.classifications[1].matched.some(match => match.id === 'runtime-source-truth-claim-test'),
    true
  );
  assert.deepEqual(classifyPaths([
    'docs/audit/FILTERTUBE_MAIN_WATCH_AUTOPLAY_VIDEO_ENDPOINT_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_MAIN_WATCH_INITIAL_SHORTS_OWNER_ABSENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
    'docs/audit/FILTERTUBE_RENDERER_AUTHORITY_GAP_AUDIT_2026-05-18.md'
  ]).lanes, ['whitelist', 'blocking', 'json', 'dom', 'smoke']);
  const menuAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md'
  ]);
  assert.deepEqual(menuAuditDoc.lanes, ['menu', 'smoke']);
  assert.deepEqual(menuAuditDoc.unmatched, []);
  for (const classification of menuAuditDoc.classifications) {
    assert.equal(
      classification.matched.some(match => match.id === 'audit-menu-proof-doc'),
      true,
      `${classification.file} should be classified as menu proof`
    );
  }
  const collaboratorIdentityMenuAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23.md'
  ]);
  assert.deepEqual(collaboratorIdentityMenuAuditDoc.lanes, ['whitelist', 'blocking', 'menu', 'smoke']);
  assert.deepEqual(collaboratorIdentityMenuAuditDoc.unmatched, []);
  assert.equal(
    collaboratorIdentityMenuAuditDoc.classifications[0].matched.some(match => match.id === 'audit-menu-proof-doc'),
    true
  );
  assert.equal(
    collaboratorIdentityMenuAuditDoc.classifications[0].matched.some(match => match.id === 'audit-identity-proof-doc'),
    true
  );
  const filterLogicAuditDoc = classifyPaths([
    'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md'
  ]);
  assert.deepEqual(filterLogicAuditDoc.lanes, ['whitelist', 'blocking', 'json', 'dom', 'performance', 'smoke']);
  assert.deepEqual(filterLogicAuditDoc.unmatched, []);
  for (const classification of filterLogicAuditDoc.classifications) {
    assert.equal(
      classification.matched.some(match => match.id === 'audit-filter-logic-rule-proof-doc'),
      true,
      `${classification.file} should be classified as filter-logic rule proof`
    );
  }

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
  assert.deepEqual(classifyPaths(['js/managed_parent_command_center.js']).lanes, ['release', 'whitelist', 'blocking', 'menu', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths(['js/layout.js']).lanes, ['release', 'dom', 'smoke']);
  assert.deepEqual(classifyPaths(['css/content.css', 'css/filter.css', 'css/layout.css']).lanes, ['release', 'dom', 'smoke']);
  assert.deepEqual(classifyPaths(['js/vendor/nanah.bundle.js']).lanes, ['release', 'settings', 'smoke']);
  assert.deepEqual(classifyPaths(['js/nanah_managed_open_sync.js']).lanes, ['release', 'settings', 'smoke']);

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

test('resumed goal matrix examples stay executable', () => {
  const matrix = read(matrixPath);
  const examples = [
    {
      label: '`js/seed.js`',
      files: ['js/seed.js'],
      lanes: ['json', 'performance'],
      rule: 'seed-json-runtime'
    },
    {
      label: '`js/injector.js`',
      files: ['js/injector.js'],
      lanes: ['json', 'whitelist'],
      rule: 'injector-main-world-json'
    },
    {
      label: '`js/content/dom_fallback.js`',
      files: ['js/content/dom_fallback.js'],
      lanes: ['dom', 'blocking'],
      rule: 'dom-fallback-runtime'
    },
    {
      label: '`js/content_bridge.js`',
      files: ['js/content_bridge.js'],
      lanes: ['menu', 'settings', 'whitelist', 'blocking', 'json', 'dom', 'performance'],
      rule: 'content-bridge-runtime'
    },
    {
      label: '`js/background.js`',
      files: ['js/background.js'],
      lanes: ['settings', 'blocking'],
      rule: 'background-runtime'
    },
    {
      label: '`manifest*.json`, `build.js`',
      files: ['manifest.chrome.json', 'build.js'],
      lanes: ['release'],
      rule: 'release-build-surface'
    },
    {
      label: '`README.md`, `data/release_notes.json`',
      files: ['README.md', 'data/release_notes.json'],
      lanes: ['release'],
      rule: 'public-release-copy'
    }
  ];

  assert.match(matrix, /Objective Matrix Examples/);
  assert.match(matrix, /concrete examples from the active goal/);
  assert.match(matrix, /it must include at least these lanes/);
  assert.match(matrix, /affected runtime lane/);

  for (const example of examples) {
    assert.ok(matrix.includes(example.label), `matrix missing objective example ${example.label}`);
    assert.ok(matrix.includes(example.rule), `matrix missing classifier rule ${example.rule}`);
    assertClassifiedLanesInclude(example.files, example.lanes);
  }
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
