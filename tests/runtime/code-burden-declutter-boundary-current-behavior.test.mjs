import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md';
const sourceLocusDocPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const jsonLocusDocPath = 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md';
const candidateRegisterDocPath = 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md';
const candidateSelectionDocPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';

const structuralRows = [
  'FT-BURDEN-00-settings-work-snapshot',
  'FT-BURDEN-01-audit-fixture-envelope',
  'FT-BURDEN-02-transport-policy',
  'FT-BURDEN-03-filter-engine-contract',
  'FT-BURDEN-04-dom-fallback-owner',
  'FT-BURDEN-05-action-affordance-owner',
  'FT-BURDEN-06-network-metadata-owner',
  'FT-BURDEN-07-storage-mutation-owner',
  'FT-BURDEN-08-hide-restore-owner',
  'FT-BURDEN-09-whitelist-policy-owner',
  'FT-BURDEN-10-diagnostic-measurement-owner',
  'FT-BURDEN-11-parity-package-owner'
];

const futureStructuralTokens = [
  'firstOptimizationStructuralBurdenQueue',
  'sourceLocusStructuralCleanupApproval',
  'jsonFirstStructuralOptimizationAuthority',
  'whitelistStructuralOptimizationAuthority',
  'runtimeStructuralOwnerMapApproval'
];

const largeProductOwnedSourceFiles = [
  'js/content_bridge.js',
  'js/tab-view.js',
  'js/background.js',
  'js/content/dom_fallback.js',
  'js/filter_logic.js',
  'js/injector.js',
  'js/content/block_channel.js',
  'js/state_manager.js',
  'js/io_manager.js',
  'js/popup.js',
  'js/render_engine.js',
  'js/nanah_sync_adapter.js',
  'js/settings_shared.js',
  'js/content/dom_extractors.js',
  'js/seed.js',
  'js/content/bridge_settings.js'
];

const nearThresholdProductOwnedSourceFiles = [
  'js/ui_components.js',
  'website/components/route-content.js'
];

const largeVendorBundleFiles = [
  'js/vendor/qrcode.bundle.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function lineCount(file) {
  const content = read(file);
  return content.split('\n').length - (content.endsWith('\n') ? 1 : 0);
}

function walkSource(dir) {
  const absolute = path.join(repoRoot, dir);
  if (!fs.existsSync(absolute)) return [];

  const out = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      out.push(...walkSource(relative));
    } else if (entry.isFile() && /\.(?:js|jsx|mjs)$/.test(entry.name)) {
      out.push(relative);
    }
  }
  return out;
}

function productOwnedSourceFiles() {
  return [
    ...walkSource('js'),
    ...walkSource('src'),
    ...walkSource('scripts'),
    ...walkSource('website/app'),
    ...walkSource('website/components')
  ]
    .filter(file => !file.startsWith('js/vendor/'))
    .filter(file => !file.startsWith('js/ui-shell/'))
    .sort();
}

function sourceFilesBetween(minLines, maxLines = Infinity) {
  return productOwnedSourceFiles()
    .filter(file => {
      const lines = lineCount(file);
      return lines >= minLines && lines <= maxLines;
    })
    .sort((a, b) => lineCount(b) - lineCount(a) || a.localeCompare(b));
}

function productSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');
}

function manifestCssFiles(file) {
  return (readJson(file).content_scripts || []).flatMap(script => script.css || []);
}

test('code-burden declutter boundary is audit-only and blocks cleanup without proof', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior audit only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /No file, generated output, vendor bundle, mirrored app asset, CSS file, runtime\s+observer, selector family, or duplicate mutation path is safe to remove/i);
  assert.match(doc, /positive behavior fixture/);
  assert.match(doc, /negative behavior fixture/);
  assert.match(doc, /First Optimization Source-Locus Structural Burden Addendum/);
  assert.match(doc, /Status: audit-only structural queue/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not\s+an implementation patch, optimization patch, JSON-first behavior patch/);
});

test('quarantined YouTube CSS is packaged today but not manifest-loaded', () => {
  const doc = read(docPath);
  const build = read('build.js');

  assert.match(build, /COMMON_DIRS\s*=\s*\['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /fs\.copySync\(dir,\s*path\.join\(targetDir,\s*dir\),\s*\{\s*filter:\s*filterFunc\s*\}\)/);

  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(manifestCssFiles(manifest), [], `${manifest} should not manifest-load CSS today`);
  }

  assert.match(read('css/filter.css'), /display:\s*none\s*!important/);
  assert.match(read('css/content.css'), /display:\s*none\s*!important/);
  assert.match(read('css/layout.css'), /filter-tube-visible/);
  assert.match(doc, /packaged-but-unloaded legacy YouTube CSS/);
  assert.match(doc, /Do not load, inject, or broaden these CSS files/);
});

test('zero-byte troubleshoot page is packaged through html directory and not a proven support surface', () => {
  const doc = read(docPath);
  const build = read('build.js');

  assert.match(build, /COMMON_DIRS\s*=\s*\['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.equal(fs.statSync(path.join(repoRoot, 'html/troubleshoot.html')).size, 0);
  assert.match(doc, /zero-byte troubleshoot page/);
  assert.match(doc, /Do not claim a working support\/troubleshoot page/);
});

test('generated UI shells have source and output but no committed freshness manifest', () => {
  const doc = read(docPath);
  const buildUi = read('scripts/build-extension-ui.mjs');

  for (const token of [
    'src/extension-shell/popup.jsx',
    'js/ui-shell/popup-shell.js',
    'src/extension-shell/tab-view-decor.jsx',
    'js/ui-shell/tab-view-decor.js'
  ]) {
    assert.ok(buildUi.includes(token), `build UI script should mention ${token}`);
  }

  for (const file of [
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js'
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist today`);
  }

  for (const absent of [
    'js/ui-shell/generated-manifest.json',
    'releasePackageParity.json',
    'generated-artifacts.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absent)), false, `${absent} should be absent today`);
  }

  assert.match(doc, /Generated output needs freshness proof/);
});

test('vendor bundles are global API surfaces that need provenance proof before declutter', () => {
  const doc = read(docPath);

  assert.match(read('js/vendor/nanah.bundle.js'), /window\.FilterTubeNanah/);
  assert.match(read('js/vendor/qrcode.bundle.js'), /FilterTubeQrCode/);
  assert.match(doc, /Vendor bundles need provenance proof/);
  assert.match(doc, /Do not line-edit or inline vendor bundles/);
});

test('raw captures and native runtime copies remain separate from cleanup candidates', () => {
  const doc = read(docPath);
  const gitignore = read('.gitignore');
  const syncWrapper = read('scripts/sync-native-runtime.mjs');

  for (const rawCapture of [
    'YT_MAIN.json',
    'YT_MAIN_WATCH.html',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'comments.json',
    'playlist.html',
    'collab.json'
  ]) {
    assert.ok(gitignore.includes(rawCapture), `${rawCapture} should remain ignored evidence`);
  }

  assert.match(syncWrapper, /tools.*sync-runtime-from-extension\.mjs/s);
  assert.match(doc, /Do not copy raw captures into extension ZIPs, website downloads, native app assets, or generated runtime bundles/);
  assert.match(doc, /Do not hand-edit generated Android\/iOS runtime assets/);
});

test('runtime duplicate-looking paths are explicitly blocked from deletion until authorities exist', () => {
  const doc = read(docPath);
  const sourceLocus = read(sourceLocusDocPath);
  const jsonLocus = read(jsonLocusDocPath);
  const candidateRegister = read(candidateRegisterDocPath);
  const candidateSelection = read(candidateSelectionDocPath);
  const source = productSource();

  for (const blocked of [
    'declutter_remove_fallback_menu_without_action_authority: blocked',
    'declutter_remove_quick_block_without_lifecycle_authority: blocked',
    'declutter_remove_dom_fallback_without_json_renderer_parity: blocked',
    'declutter_merge_state_manager_background_mutations_without_revision: blocked',
    'declutter_remove_native_runtime_copy_without_sync_authority: blocked'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked declutter gate ${blocked}`);
  }

  assert.match(read('docs/audit/FILTERTUBE_FALLBACK_MENU_ACTION_GATE_CURRENT_BEHAVIOR_2026-05-19.md'), /fallback scanner/i);
  assert.match(read('docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md'), /quick-block/i);
  assert.match(read('docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md'), /StateManager\.saveSettings\(\)/);

  for (const linkedDoc of [
    sourceLocusDocPath,
    jsonLocusDocPath,
    candidateRegisterDocPath,
    candidateSelectionDocPath
  ]) {
    assert.ok(doc.includes(linkedDoc), `missing linked structural input ${linkedDoc}`);
  }

  assert.match(sourceLocus, /source-locus callable boundary rows: 12/);
  assert.match(sourceLocus, /line anchors covered: 38/);
  assert.match(sourceLocus, /implementation-ready source-locus callable rows: 0/);
  assert.match(jsonLocus, /The codebase has identifiable JSON-first optimization loci/);
  assert.match(candidateRegister, /optimization priority candidates: 12/);
  assert.match(candidateRegister, /implementation-ready candidates: 0/);
  assert.match(candidateSelection, /Selected audit work packet: FT-BIND-00-metric-artifact-foundation/);

  const rows = [...doc.matchAll(/^\| `(FT-BURDEN-[^`]+)` \|/gm)].map((row) => row[1]);
  assert.deepEqual(rows, structuralRows);
  assert.match(doc, /structural burden queue rows: 12/);
  assert.match(doc, /large runtime source files over 1000 lines covered: 5/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /optimization priority candidates covered: 12/);
  assert.match(doc, /implementation-ready structural cleanup rows: 0/);
  assert.match(doc, /JSON-first structural optimization approvals: 0/);
  assert.match(doc, /runtime behavior changed: no/);
  assert.match(doc, /runtime structural cleanup: NO-GO/);
  assert.match(doc, /JSON-first structural optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const [file, minLines] of [
    ['js/content_bridge.js', 1000],
    ['js/content/dom_fallback.js', 1000],
    ['js/filter_logic.js', 1000],
    ['js/content/block_channel.js', 1000],
    ['js/seed.js', 1000]
  ]) {
    assert.ok(lineCount(file) > minLines, `${file} should remain a >1000-line structural pressure source`);
  }

  for (const token of futureStructuralTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing future token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('large product-owned source files are guarded before new spaghetti growth', () => {
  const doc = read(docPath);

  assert.deepEqual(sourceFilesBetween(1000), largeProductOwnedSourceFiles);
  assert.deepEqual(sourceFilesBetween(900, 999), nearThresholdProductOwnedSourceFiles);
  assert.deepEqual(
    walkSource('js/vendor').filter(file => lineCount(file) >= 1000).sort(),
    largeVendorBundleFiles
  );

  assert.match(doc, /Large-File Growth Guard Addendum - 2026-06-01/);
  assert.match(doc, /large product-owned JS\/JSX\/MJS files at or above 1000 lines guarded: 16/);
  assert.match(doc, /near-threshold product-owned JS\/JSX\/MJS files from 900 to 999 lines guarded: 2/);
  assert.match(doc, /large vendor bundle files recorded separately: 1/);
  assert.match(doc, /new product-owned file crossing 1000 lines without proof: NO-GO/);
  assert.match(doc, /existing large-file growth without owner or decomposition proof: NO-GO/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const file of largeProductOwnedSourceFiles) {
    assert.ok(doc.includes(`| \`${file}\` | ${lineCount(file)} |`), file);
  }

  for (const file of nearThresholdProductOwnedSourceFiles) {
    assert.ok(doc.includes(`| \`${file}\` | ${lineCount(file)} |`), file);
  }

  for (const file of largeVendorBundleFiles) {
    assert.ok(doc.includes(`| \`${file}\` | ${lineCount(file)} |`), file);
  }
});
