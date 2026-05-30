import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const layoutPath = 'js/layout.js';
const buildPath = 'build.js';
const activeManifestPaths = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];
const distManifestPaths = [
  'dist/chrome/manifest.json',
  'dist/firefox/manifest.json',
  'dist/opera/manifest.json'
];
const distLayoutPaths = [
  'dist/chrome/js/layout.js',
  'dist/firefox/js/layout.js',
  'dist/opera/js/layout.js'
];
const extensionHtmlPaths = [
  'html/popup.html',
  'html/tab-view.html'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function manifestStats(paths) {
  const stats = {
    manifestFiles: paths.length,
    contentScriptEntries: 0,
    contentScriptJsRefs: 0,
    webAccessibleEntries: 0,
    webAccessibleResourceRefs: 0,
    layoutContentScriptRefs: 0,
    layoutWebAccessibleRefs: 0
  };

  for (const manifestPath of paths) {
    const manifest = JSON.parse(read(manifestPath));
    for (const entry of manifest.content_scripts || []) {
      stats.contentScriptEntries += 1;
      for (const script of entry.js || []) {
        stats.contentScriptJsRefs += 1;
        if (script === layoutPath) stats.layoutContentScriptRefs += 1;
      }
    }

    for (const entry of manifest.web_accessible_resources || []) {
      stats.webAccessibleEntries += 1;
      for (const resource of entry.resources || []) {
        stats.webAccessibleResourceRefs += 1;
        if (resource === layoutPath || resource === 'js/*' || resource === '**/*') {
          stats.layoutWebAccessibleRefs += 1;
        }
      }
    }
  }

  return stats;
}

function htmlScriptStats(paths) {
  const stats = {
    htmlFiles: paths.length,
    scriptTags: 0,
    layoutScriptRefs: 0
  };

  for (const htmlPath of paths) {
    const scripts = [...read(htmlPath).matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)]
      .map(match => match[1]);
    stats.scriptTags += scripts.length;
    stats.layoutScriptRefs += scripts.filter(script => script === '../js/layout.js' || script === 'js/layout.js').length;
  }

  return stats;
}

function walk(dir, out = []) {
  const absoluteDir = path.join(repoRoot, dir);
  if (!fs.existsSync(absoluteDir)) return out;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.isDirectory() && ['node_modules', '.next', 'dist', 'build', 'coverage'].includes(entry.name)) {
      continue;
    }
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(relative, out);
    } else {
      out.push(relative);
    }
  }

  return out;
}

function runtimeFilterTubeLayoutRefs() {
  const dirs = ['js', 'src', 'html', 'website', 'scripts', 'data', 'design'];
  const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.html', '.json', '.css', '.md']);
  const rows = [];

  for (const file of dirs.flatMap(dir => walk(dir))) {
    if (!extensions.has(path.extname(file))) continue;
    const hits = count(read(file), /filterTubeLayout/g);
    if (hits > 0) rows.push({ file, hits });
  }

  return rows;
}

test('legacy layout quarantine package boundary is audit-only and source scoped', () => {
  const text = doc();
  const source = read(layoutPath);

  assert.match(text, /Status: audit-only current-behavior package boundary/);
  assert.match(text, /Runtime, build, and\s+packaging behavior are unchanged/);
  assert.match(text, /This is not deletion readiness, reactivation readiness/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /js\/layout\.js/);
  assert.match(text, /window\.filterTubeLayout/);

  assert.equal(lineCount(source), 680);
  assert.equal(fs.statSync(path.join(repoRoot, layoutPath)).size, 30604);
  assert.match(text, /line count: 680/);
  assert.match(text, /source bytes: 30604/);
  assert.match(text, new RegExp(`source sha256: ${sha256(layoutPath)}`));
  assert.doesNotMatch(source, /legacyLayoutQuarantineBoundaryContract/);
});

test('legacy layout quarantine package boundary pins packaged but inactive manifest state', () => {
  const text = doc();
  const build = read(buildPath);
  const sourceHash = sha256(layoutPath);
  const activeStats = manifestStats(activeManifestPaths);
  const distStats = manifestStats(distManifestPaths);
  const htmlStats = htmlScriptStats(extensionHtmlPaths);

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.deepEqual(activeStats, {
    manifestFiles: 4,
    contentScriptEntries: 7,
    contentScriptJsRefs: 55,
    webAccessibleEntries: 4,
    webAccessibleResourceRefs: 19,
    layoutContentScriptRefs: 0,
    layoutWebAccessibleRefs: 0
  });
  assert.deepEqual(distStats, {
    manifestFiles: 3,
    contentScriptEntries: 5,
    contentScriptJsRefs: 41,
    webAccessibleEntries: 3,
    webAccessibleResourceRefs: 14,
    layoutContentScriptRefs: 0,
    layoutWebAccessibleRefs: 0
  });
  assert.deepEqual(htmlStats, {
    htmlFiles: 2,
    scriptTags: 21,
    layoutScriptRefs: 0
  });

  for (const distPath of distLayoutPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, distPath)), true, `${distPath} should exist`);
    assert.equal(sha256(distPath), sourceHash, `${distPath} should match ${layoutPath}`);
  }

  for (const token of [
    'active manifest files checked: 4',
    'active manifest content_script entries checked: 7',
    'active manifest content script JS refs checked: 55',
    'active manifest web_accessible_resources entries checked: 4',
    'active manifest web-accessible resource refs checked: 19',
    'active manifest js/layout.js content script refs: 0',
    'active manifest js/layout.js web-accessible refs: 0',
    'dist manifest files checked: 3',
    'dist manifest content_script entries checked: 5',
    'dist manifest content script JS refs checked: 41',
    'dist manifest web_accessible_resources entries checked: 3',
    'dist manifest web-accessible resource refs checked: 14',
    'dist manifest js/layout.js content script refs: 0',
    'dist manifest js/layout.js web-accessible refs: 0',
    'extension HTML files checked: 2',
    'extension HTML script tags checked: 21',
    'extension HTML js/layout.js script refs: 0',
    'packaged dist copies: 3',
    'dist copies hash-match source: yes'
  ]) {
    assert.ok(text.includes(token), `missing package/load token ${token}`);
  }
});

test('legacy layout quarantine package boundary pins source side effects and runtime caller absence', () => {
  const text = doc();
  const source = read(layoutPath);
  const refs = runtimeFilterTubeLayoutRefs();
  const inventory = read('docs/youtube_renderer_inventory.md');

  assert.deepEqual(refs, [{ file: layoutPath, hits: 1 }]);
  assert.equal(count(inventory, /js\/layout\.js/g), 3);
  assert.equal(count(inventory, /Targeted \(Layout Fix\)/g), 3);

  for (const [label, value] of [
    ['exported method declarations', 5],
    ['selector API sites', 63],
    ['unique static selector literals', 52],
    ['direct style property writes', count(source, /\.style\.[A-Za-z_$][\w$]*\s*=/g)],
    ['style.display writes', count(source, /\.style\.display\s*=/g)],
    ['filter-tube-visible token occurrences', count(source, /filter-tube-visible/g)],
    ['addEventListener calls', count(source, /\.addEventListener\s*\(/g)],
    ['setTimeout calls', count(source, /\bsetTimeout\s*\(/g)],
    ['setInterval calls', count(source, /\bsetInterval\s*\(/g)],
    ['requestAnimationFrame calls', count(source, /\brequestAnimationFrame\s*\(/g)],
    ['MutationObserver references', count(source, /\bMutationObserver\b/g)],
    ['fetch calls', count(source, /\bfetch\s*\(/g)]
  ]) {
    assert.match(text, new RegExp(`${label}: ${value}`), `missing source count ${label}: ${value}`);
  }

  for (const token of [
    'runtime source directories checked for filterTubeLayout callers: js, src, html, website, scripts, data, design',
    'runtime source files with filterTubeLayout tokens: js/layout.js only',
    'non-doc runtime callers of window.filterTubeLayout: 0',
    'docs/youtube_renderer_inventory.md js/layout.js references: 3',
    'watch-card inventory rows depending on layout-fix wording: 3',
    'inventory rows citing js/layout.js: ytd-watch-card-hero-video-renderer, ytd-vertical-watch-card-list-renderer, ytd-watch-card-section-sequence-renderer',
    'website/app/layout.js references in docs are website route references, not extension legacy layout callers',
    'active filtering coverage proven by layout-fix inventory rows: no'
  ]) {
    assert.ok(text.includes(token), `missing caller/inventory token ${token}`);
  }
});

test('legacy layout quarantine package boundary preserves current risk gates and missing authorities', () => {
  const text = doc();
  const currentSurfaces = [
    layoutPath,
    buildPath,
    ...activeManifestPaths,
    ...distManifestPaths,
    ...extensionHtmlPaths
  ].map(read).join('\n');

  for (const token of [
    'js/layout.js remains package burden because it is copied into all current dist browser js directories',
    'js/layout.js remains manifest-inactive because no active or dist content_scripts entry names it',
    'js/layout.js is not web-accessible under the current manifest resource lists',
    'popup and dashboard HTML do not load the legacy layout script',
    'no current non-doc runtime caller reaches window.filterTubeLayout outside js/layout.js itself',
    'renderer inventory still contains three js/layout.js layout-fix claims',
    'packaged but inactive code can be accidentally reactivated by future manifest, loader, native wrapper, or HTML changes',
    'deleting packaged inactive code still needs inventory, package, native/runtime, and fixture proof',
    'the old visible-marker layout model remains a false-hide risk if reactivated'
  ]) {
    assert.ok(text.includes(token), `missing risk boundary token ${token}`);
  }

  for (const field of [
    'legacyLayoutQuarantineReference',
    'sourceFile',
    'sourceHash',
    'packageTarget',
    'packageCopyRule',
    'manifestFile',
    'manifestContentScriptState',
    'manifestWebAccessibleState',
    'htmlScriptLoadState',
    'distCopyHash',
    'globalExportName',
    'runtimeCaller',
    'inventoryDependency',
    'rendererCoverageClaim',
    'visibleMarkerPolicy',
    'hideDecisionAuthority',
    'nativeRuntimeParity',
    'reactivationFixture',
    'deletionReadinessProof',
    'packageCleanupProof'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const missingAuthority of [
    'legacyLayoutQuarantineBoundaryContract',
    'legacyLayoutPackageInclusionReport',
    'legacyLayoutActiveLoadReport',
    'legacyLayoutDistCopyParityReport',
    'legacyLayoutRuntimeCallerReport',
    'legacyLayoutInventoryDependencyReport',
    'legacyLayoutWebAccessiblePolicy',
    'legacyLayoutNativeSyncParityReport',
    'legacyLayoutReactivationFixtureProvenance',
    'legacyLayoutDeletionReadinessArtifact'
  ]) {
    assert.ok(text.includes(missingAuthority), `doc should name missing authority ${missingAuthority}`);
    assert.doesNotMatch(currentSurfaces, new RegExp(missingAuthority));
  }
});
