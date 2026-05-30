import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const functionCoverage = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md'),
  'utf8'
);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(rel));
    } else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

function assertDocCites(file) {
  assert.match(
    functionCoverage,
    new RegExp(`\\\`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\``),
    `${file} must be cited in function coverage scope or backlog`
  );
}

const mappedHotRuntimeFiles = [
  'js/seed.js',
  'js/injector.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/bridge_settings.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/filter_logic.js'
];

test('function coverage artifact is explicit that lexical function coverage is not complete yet', () => {
  assert.match(functionCoverage, /not complete codebase function\s+coverage yet/);
  assert.match(functionCoverage, /Files Not Yet Lexically Mapped/);
  assert.match(functionCoverage, /next callable-surface backlog/);
});

test('every product-owned JS and MJS file is either mapped or listed as callable backlog', () => {
  const productJsFiles = [
    ...walk('js'),
    ...walk('src'),
    ...walk('scripts'),
    ...walk('website/app'),
    ...walk('website/components')
  ].sort();

  assert.ok(productJsFiles.length > mappedHotRuntimeFiles.length, 'source tree should include callable files outside the first hot-runtime map');

  for (const file of productJsFiles) {
    assertDocCites(file);
  }
});

test('current lexical function map covers the first hot runtime stack but excludes UI, website, vendor, and build families', () => {
  for (const file of mappedHotRuntimeFiles) {
    assertDocCites(file);
  }

  for (const family of [
    'Content runtime helpers',
    'Extension UI and settings runtime',
    'Generated or quarantined UI files',
    'Vendor bundles',
    'Build and sync scripts',
    'Website app routes',
    'Website components'
  ]) {
    assert.match(functionCoverage, new RegExp(`\\| ${family} \\|`));
  }
});
