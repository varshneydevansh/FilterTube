import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const expectedNumstatRows = [
  ['README.md', 44, 26, 'public documentation claim surface'],
  ['docs/ARCHITECTURE.md', 36, 21, 'public/core documentation claim surface'],
  ['docs/CHANNEL_BLOCKING_SYSTEM.md', 83, 25, 'public/core documentation claim surface'],
  ['docs/CODEMAP.md', 2, 2, 'public/core documentation claim surface'],
  ['docs/CONTENT_HIDING_PLAYBOOK.md', 14, 11, 'public/core documentation claim surface'],
  ['docs/DEVELOPER_GUIDE.md', 7, 3, 'public/core documentation claim surface'],
  ['docs/FUNCTIONALITY.md', 5, 2, 'public/core documentation claim surface'],
  ['docs/NETWORK_REQUEST_PIPELINE.md', 27, 16, 'public/core documentation claim surface'],
  ['docs/PROACTIVE_CHANNEL_IDENTITY.md', 40, 33, 'public/core documentation claim surface'],
  ['docs/TECHNICAL.md', 38, 26, 'public/core documentation claim surface'],
  ['docs/THREE_DOT_MENU_IMPROVEMENTS.md', 20, 7, 'public/core documentation claim surface'],
  ['docs/WATCH_PLAYLIST_BREAKDOWN.md', 4, 4, 'public/core documentation claim surface'],
  ['docs/YOUTUBE_KIDS_INTEGRATION.md', 33, 13, 'public/core documentation claim surface'],
  ['docs/youtube_renderer_inventory.md', 6, 6, 'public/core documentation claim surface'],
  ['js/background.js', 65, 22, 'release lag/identity runtime source surface'],
  ['js/content/block_channel.js', 960, 147, 'release lag/quick-block runtime source surface'],
  ['js/content/bridge_settings.js', 44, 2, 'release settings bridge runtime source surface'],
  ['js/content/collab_dialog.js', 53, 4, 'release collaborator runtime source surface'],
  ['js/content/dom_fallback.js', 25, 2, 'release DOM fallback runtime source surface'],
  ['js/content_bridge.js', 765, 151, 'release lag/menu/whitelist runtime source surface'],
  ['js/injector.js', 59, 2, 'release injector runtime source surface'],
  ['js/io_manager.js', 41, 19, 'release storage runtime source surface'],
  ['js/nanah_sync_adapter.js', 26, 6, 'release sync runtime source surface'],
  ['js/seed.js', 156, 47, 'release JSON no-work runtime source surface'],
  ['js/settings_shared.js', 13, 5, 'release settings alias runtime source surface'],
  ['js/state_manager.js', 26, 4, 'release main-profile alias runtime source surface'],
  ['package.json', 1, 0, 'package metadata audit command']
];

const futureAuthoritySymbols = [
  'currentDirtyWorktreeAuditBoundaryContract',
  'currentDirtyWorktreeDiffClassificationReport',
  'currentDirtyWorktreeRuntimeEffectReport',
  'currentDirtyWorktreePackageScriptGate',
  'currentDirtyWorktreePublicDocClaimReview',
  'currentDirtyWorktreeOptimizationInputPolicy',
  'currentDirtyWorktreeImplementationChangeGate',
  'currentDirtyWorktreeFixtureProvenance',
  'currentDirtyWorktreeMetricArtifact',
  'currentDirtyWorktreeReleaseReadinessReport'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function gitRaw(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function gitLines(args) {
  return gitRaw(args).trim().split('\n').filter(Boolean);
}

function parseNumstat(lines) {
  return lines.map(line => {
    const [additions, deletions, file] = line.split('\t');
    return [file, Number(additions), Number(deletions)];
  });
}

function productRuntimeFiles() {
  return gitLines(['ls-files'])
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('dist/'))
    .filter(file => /\.(js|mjs|json|html|css)$/.test(file));
}

test('current dirty worktree boundary doc is audit-only and keeps implementation blocked', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof only/);
  assert.match(doc, /document is not a new implementation patch/);
  assert.match(doc, /Runtime behavior has changed in the wider 2026-05-26 release-lag fix batch/);
  assert.match(doc, /keeps them\s+separate from public-doc wording and package metadata/);
  assert.match(doc, /keeps the implementation\s+gate closed/);
  assert.match(doc, /audit files stay in `docs\/audit`/);
});

test('tracked dirty numstat matches the audited current worktree boundary', () => {
  const doc = read(docPath);
  const rows = parseNumstat(gitLines(['diff', '--numstat', '--', ...expectedNumstatRows.map(([file]) => file)]));

  assert.deepEqual(rows, expectedNumstatRows.map(([file, additions, deletions]) => [file, additions, deletions]));
  assert.equal(rows.length, 27);
  assert.equal(rows.reduce((sum, [, additions]) => sum + additions, 0), 2593);
  assert.equal(rows.reduce((sum, [, , deletions]) => sum + deletions, 0), 606);

  assert.match(doc, /27 modified tracked\s+files, 2593 additions, and 606 deletions/);
  for (const [file, additions, deletions, classification] of expectedNumstatRows) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(doc, new RegExp(`\\| \`${escaped}\` \\| ${additions} \\| ${deletions} \\| ${classification} \\|`));
  }
});

test('state manager tracked diff includes main profile alias normalization boundary', () => {
  const doc = read(docPath);
  const stateManager = read('js/state_manager.js');
  const diff = gitRaw(['diff', '--unified=0', '--', 'js/state_manager.js']);
  const changedLines = diff.split('\n').filter(line => /^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line));
  const addedLines = changedLines.filter(line => line.startsWith('+'));
  const removedLines = changedLines.filter(line => line.startsWith('-'));

  assert.ok(addedLines.includes('+ * Shared UI-facing coordinator for popup/tab-view; background compile, caches,'));
  assert.ok(addedLines.includes('+ * imports/Nanah, stats, content maps, and runtime refresh have separate owners.'));
  assert.ok(addedLines.includes('+    function normalizeMainProfileAliasFields(main) {'));
  assert.ok(addedLines.includes('+            out.blockedKeywords = out.keywords;'));
  assert.ok(addedLines.includes('+        return out;'));
  assert.ok(addedLines.includes('+                    main: normalizeMainProfileAliasFields({'));
  assert.equal(removedLines.length, 4);
  assert.match(diff, /@@ -5,2 \+5,2 @@/);
  assert.match(diff, /@@ -1076,0 \+1077,22 @@/);
  assert.match(diff, /@@ -1127 \+1149 @@/);
  assert.match(diff, /@@ -1131 \+1153 @@/);
  assert.match(stateManager.split('\n').slice(0, 10).join('\n'), /Shared UI-facing coordinator for popup\/tab-view/);
  assert.match(stateManager.split('\n').slice(0, 10).join('\n'), /runtime refresh have separate owners/);
  assert.match(stateManager, /function normalizeMainProfileAliasFields\(main\)/);
  assert.match(stateManager, /out\.blockedKeywords = out\.keywords/);
  assert.match(stateManager, /const StateManager = \(\(\) => \{/);

  assert.match(doc, /modified tracked JavaScript runtime files are release lag and list-mode fix\s+surfaces/);
  assert.match(doc, /main-profile alias normalization/);
  assert.match(doc, /Executable StateManager behavior now normalizes `main\.keywords`/);
});

test('package script diff only adds the runtime audit command', () => {
  const doc = read(docPath);
  const pkg = readJson('package.json');
  const diff = gitRaw(['diff', '--unified=0', '--', 'package.json']);
  const changedLines = diff.split('\n').filter(line => /^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line));
  const addedLines = changedLines.filter(line => line.startsWith('+'));
  const removedLines = changedLines.filter(line => line.startsWith('-'));

  assert.deepEqual(addedLines, ['+    "audit:runtime": "node --test tests/runtime/*.test.mjs",']);
  assert.deepEqual(removedLines, []);
  assert.equal(pkg.scripts['audit:runtime'], 'node --test tests/runtime/*.test.mjs');
  assert.equal(pkg.version, '3.3.1');
  assert.equal(pkg.license, 'MIT');
  assert.deepEqual(pkg.dependencies, {
    preact: '^10.29.0',
    qrcode: '^1.5.4'
  });
  assert.deepEqual(pkg.devDependencies, {
    archiver: '^5.3.1',
    esbuild: '^0.27.4',
    'fs-extra': '^11.1.1'
  });

  assert.match(doc, /`git diff --numstat -- package\.json` is `1 addition \/ 0 deletions`/);
  assert.match(doc, /Existing build\/dev\/browser\/native-sync scripts are unchanged/);
  assert.match(doc, /not release artifact\s+proof/);
});

test('new audit artifacts stay under audit and runtime test directories', () => {
  const doc = read(docPath);

  assert.equal(fs.existsSync(path.join(repoRoot, docPath)), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'tests/runtime/current-dirty-worktree-audit-boundary-current-behavior.test.mjs')), true);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/current-dirty-worktree-audit-boundary-current-behavior\.test\.mjs/);
});

test('future dirty-worktree authority symbols remain absent from product runtime source', () => {
  const productSource = productRuntimeFiles().map(read).join('\n');
  const doc = read(docPath);

  for (const symbol of futureAuthoritySymbols) {
    assert.match(doc, new RegExp(`- \`${symbol}\``));
    assert.equal(productSource.includes(symbol), false, `${symbol} leaked into product runtime source`);
  }
});
