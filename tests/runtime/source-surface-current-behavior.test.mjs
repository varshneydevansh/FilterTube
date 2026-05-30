import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const inventory = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md'),
  'utf8'
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
}

function manifestScriptFiles(manifest) {
  const files = new Set();
  for (const script of manifest.content_scripts || []) {
    for (const file of script.js || []) files.add(file);
    for (const file of script.css || []) files.add(file);
  }
  const background = manifest.background || {};
  if (background.service_worker) files.add(background.service_worker);
  for (const file of background.scripts || []) files.add(file);
  return [...files].sort();
}

function webAccessibleFiles(manifest) {
  return [...new Set((manifest.web_accessible_resources || [])
    .flatMap(entry => entry.resources || []))]
    .sort();
}

function htmlLocalRefs(file) {
  const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  return [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1].replace(/^\.\.\//, ''))
    .filter(ref => /^(js|css|data|assets|icons)\//.test(ref))
    .sort();
}

function assertInventoryCites(file, message = `${file} must be classified`) {
  assert.match(
    inventory,
    new RegExp(`\\\`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\``),
    message
  );
}

test('all manifest-loaded scripts are classified in the source surface inventory', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = readJson(manifestFile);
    for (const file of manifestScriptFiles(manifest)) {
      assertInventoryCites(file, `${manifestFile} script ${file} must be classified`);
    }
  }
});

test('manifest web-accessible runtime files are classified in the source surface inventory', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = readJson(manifestFile);
    for (const file of webAccessibleFiles(manifest)) {
      assertInventoryCites(file, `${manifestFile} web-accessible ${file} must be classified`);
    }
  }
});

test('extension page script and stylesheet dependencies are classified in the source surface inventory', () => {
  for (const htmlFile of ['html/popup.html', 'html/tab-view.html', 'html/troubleshoot.html']) {
    for (const ref of htmlLocalRefs(htmlFile)) {
      if (!/\.(js|css)$/.test(ref)) continue;
      assertInventoryCites(ref, `${htmlFile} dependency ${ref} must be classified`);
    }
  }
});

test('generated extension shell source inputs are classified in the source surface inventory', () => {
  const buildScript = fs.readFileSync(path.join(repoRoot, 'scripts/build-extension-ui.mjs'), 'utf8');
  const sourceInputs = [...buildScript.matchAll(/src\/extension-shell\/[^'"]+/g)]
    .map(match => match[0])
    .sort();

  assert.deepEqual(sourceInputs, [
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx'
  ]);

  for (const file of [
    ...sourceInputs,
    'src/extension-shell/shared/runtime.js'
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist as generated shell source`);
    assertInventoryCites(file, `${file} must be classified as generated shell source`);
  }

  assert.match(inventory, /`src\/\.DS_Store`/);
  assert.match(inventory, /local-junk-excluded/);
});

test('extension page static image dependencies are covered by static asset families', () => {
  const refs = ['html/popup.html', 'html/tab-view.html', 'html/troubleshoot.html']
    .flatMap(file => htmlLocalRefs(file))
    .filter(ref => /^(assets|icons)\//.test(ref));

  assert.ok(refs.includes('icons/icon-128.png'), 'tab-view should reference the packaged app icon');
  assert.ok(refs.includes('assets/images/Android_icon.png'), 'tab-view should reference Android app card art');
  assert.ok(refs.includes('assets/images/iOS_icon.png'), 'tab-view should reference iOS app card art');
  assert.match(inventory, /`icons\/icon-\*\.png`, `icons\/icon-128\.svg`, `icons\/file\.svg`/);
  assert.match(inventory, /`assets\/images\/\*`, `assets\/images\/homepage_hero_day\.mp4`/);
});

test('content manifests currently do not load CSS content scripts', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = readJson(manifestFile);
    const contentCss = (manifest.content_scripts || []).flatMap(script => script.css || []);
    assert.deepEqual(contentCss, [], `${manifestFile} should not manifest-load content CSS`);
  }
});

test('legacy YouTube default-hide CSS is quarantined in the source surface inventory', () => {
  for (const file of ['css/filter.css', 'css/content.css', 'css/layout.css']) {
    assert.match(inventory, new RegExp(`\\\`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\``));
  }
  assert.match(inventory, /quarantined legacy\/default-hide CSS/);
  assert.match(inventory, /No YouTube content-page stylesheet may be manifest-loaded/);
});

test('build and sync scripts are classified in the source surface inventory', () => {
  for (const file of [
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs',
    'scripts/compress-video.swift'
  ]) {
    assertInventoryCites(file);
  }
});

test('extension build packages the same source families and excludes local filesystem junk', () => {
  const buildSource = fs.readFileSync(path.join(repoRoot, 'build.js'), 'utf8');

  assert.match(buildSource, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(buildSource, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\]/);
  assert.match(buildSource, /basename !== '\.DS_Store'/);
  assert.match(buildSource, /basename !== 'Thumbs\.db'/);
  assert.match(buildSource, /!basename\.startsWith\('\._'\)/);
  assert.match(buildSource, /'\*\*\/\.DS_Store'/);
  assert.match(buildSource, /'\*\*\/__MACOSX'/);
  assert.match(buildSource, /'\*\*\/\._\*'/);
});

test('public website source files are classified without treating build caches as product source', () => {
  const websiteSourceFiles = [
    'website/app/[slug]/page.js',
    'website/app/downloads/page.js',
    'website/app/globals.css',
    'website/app/icon.png',
    'website/app/layout.js',
    'website/app/not-found.js',
    'website/app/page.js',
    'website/app/privacy/page.js',
    'website/app/robots.js',
    'website/app/sitemap.js',
    'website/app/terms/page.js',
    'website/components/browser-logo-rail.js',
    'website/components/marketing-ui.js',
    'website/components/reveal.js',
    'website/components/route-content.js',
    'website/components/scene-controller.js',
    'website/components/scenic-detail-page.js',
    'website/components/scenic-illustration.js',
    'website/components/scenic-tones.js',
    'website/components/site-data.js',
    'website/components/site-footer.js',
    'website/components/site-header.js',
    'website/components/site-shell-data.js',
    'website/components/theme-toggle.js',
    'website/public/brand/logo.png',
    'website/public/videos/homepage/day/homepage_hero_day.mp4',
    'website/public/videos/homepage/homepage_hero_day.mp4',
    'website/public/videos/ios/ios_hero_slow_540.mp4',
    'website/package.json',
    'website/package-lock.json',
    'website/next.config.mjs',
    'website/postcss.config.mjs',
    'website/jsconfig.json',
    'website/.vercelignore',
    'website/.gitignore'
  ];

  for (const file of websiteSourceFiles) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist in the current website source surface`);
    assertInventoryCites(file, `${file} must be classified in the website source surface`);
  }

  assert.match(inventory, /website-audited/);
});

test('local website build output and dependency caches are classified as excluded audit noise', () => {
  for (const ignoredPath of [
    'website/.next/BUILD_ID',
    'website/node_modules/react/package.json',
    'website/.vercel/project.json',
    'website/.DS_Store',
    'website/assets/.DS_Store',
    'assets/.DS_Store',
    'js/.DS_Store',
    'icons/.DS_Store'
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, ignoredPath)), `${ignoredPath} is present locally and must be excluded from product-source accounting`);
  }

  assert.match(inventory, /`website\/\.next\/\*\*`/);
  assert.match(inventory, /`website\/node_modules\/\*\*`/);
  assert.match(inventory, /`website\/\.vercel\/\*\*`/);
  assert.match(inventory, /local-generated-excluded/);
  assert.match(inventory, /dependency-cache-excluded/);
  assert.match(inventory, /local-deployment-metadata-excluded/);
});
