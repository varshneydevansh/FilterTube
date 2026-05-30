import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const coverageDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_TRACKED_FILE_AUDIT_COVERAGE_2026-05-18.md'),
  'utf8'
);
const sourceInventory = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md'),
  'utf8'
);

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function classifyTrackedFile(file) {
  if ([
    '.gitignore',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'package-lock.json',
    'package.json',
    'channel-identity-watch-mix-collab-recovery-plan.md'
  ].includes(file)) return 'root-project-metadata';

  if (/^manifest(\.|$)/.test(file)) return 'browser-manifests';
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-scripts';
  if (file.startsWith('html/')) return 'extension-html';
  if (file.startsWith('icons/')) return 'extension-icons';
  if (file.startsWith('assets/')) return 'extension-assets';
  if (file.startsWith('data/') || file.startsWith('design/')) return 'data-design-inputs';
  if (file.startsWith('docs/')) return 'tracked-docs';
  if (file.startsWith('src/')) return 'generated-ui-source';
  if (file.startsWith('js/vendor/')) return 'vendor-bundles';
  if (file.startsWith('js/ui-shell/')) return 'generated-ui-output';
  if (file === 'js/layout.js') return 'quarantined-legacy-js';
  if (/^css\/(filter|content|layout)\.css$/.test(file)) return 'quarantined-content-css';
  if (file.startsWith('css/')) return 'extension-ui-css';
  if (
    /^js\/content\//.test(file) ||
    [
      'js/content_bridge.js',
      'js/injector.js',
      'js/seed.js',
      'js/filter_logic.js',
      'js/shared/identity.js'
    ].includes(file)
  ) return 'content-runtime-js';
  if (file.startsWith('js/')) return 'extension-ui-background-js';
  if (file.startsWith('website/app/')) return 'website-app-routes';
  if (file.startsWith('website/components/')) return 'website-components';
  if (file.startsWith('website/public/') || file.startsWith('website/assets/')) return 'website-assets';
  if (file.startsWith('website/')) return 'website-config';

  return 'UNCLASSIFIED';
}

function countsByFamily(files) {
  const counts = new Map();
  for (const file of files) {
    const family = classifyTrackedFile(file);
    counts.set(family, (counts.get(family) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

test('tracked-file audit coverage documents the current git ls-files source universe', () => {
  assert.match(coverageDoc, /Authoritative source command:/);
  assert.match(coverageDoc, /git ls-files/);
  assert.match(coverageDoc, /Current tracked source count:/);
  assert.match(coverageDoc, /149/);
  assert.match(coverageDoc, /Ignored root captures, generated package output, dependency caches/);
});

test('every current tracked file is assigned exactly one audit family by the coverage classifier', () => {
  const files = git(['ls-files']);
  assert.equal(files.length, 149);

  const unclassified = files.filter(file => classifyTrackedFile(file) === 'UNCLASSIFIED');
  assert.deepEqual(unclassified, []);

  const expectedCounts = {
    'browser-manifests': 4,
    'build-release-sync-scripts': 5,
    'content-runtime-js': 16,
    'data-design-inputs': 2,
    'extension-assets': 3,
    'extension-html': 3,
    'extension-icons': 7,
    'extension-ui-background-js': 11,
    'extension-ui-css': 5,
    'generated-ui-output': 2,
    'generated-ui-source': 3,
    'quarantined-content-css': 3,
    'quarantined-legacy-js': 1,
    'root-project-metadata': 7,
    'tracked-docs': 33,
    'vendor-bundles': 2,
    'website-app-routes': 11,
    'website-assets': 11,
    'website-components': 13,
    'website-config': 7
  };

  assert.deepEqual(countsByFamily(files), expectedCounts);

  for (const [family, count] of Object.entries(expectedCounts)) {
    assert.match(coverageDoc, new RegExp(`\\\`${family}\\\` \\\\| ${count} \\\\|`));
  }
});

test('tracked docs are classified as claims and evidence maps rather than runtime proof', () => {
  assert.match(coverageDoc, /tracked-docs/);
  assert.match(coverageDoc, /These are claims\/evidence maps, not runtime proof by themselves/);
  assert.match(coverageDoc, /docs\/json_paths_encyclopedia\.md/);
  assert.match(coverageDoc, /docs\/youtube_renderer_inventory\.md/);
  assert.match(coverageDoc, /do not prove runtime coverage/);
});

test('quarantined legacy assets remain distinguished from active runtime coverage', () => {
  assert.match(coverageDoc, /quarantined-content-css/);
  assert.match(coverageDoc, /quarantined-legacy-js/);
  assert.match(coverageDoc, /js\/layout\.js/);
  assert.match(coverageDoc, /active\s+manifests do not load it/);
  assert.match(sourceInventory, /No YouTube content-page stylesheet may be manifest-loaded/);
});

test('ignored raw capture corpus remains outside the tracked-file audit universe', () => {
  const ignoredCandidates = [
    'YTM.json',
    'YT_KIDS.json',
    'comments.json',
    'WHITELIST_content.JS'
  ];
  const tracked = new Set(git(['ls-files']));
  for (const file of ignoredCandidates) {
    assert.equal(tracked.has(file), false, `${file} must not be tracked source`);
  }

  assert.match(coverageDoc, /Raw root captures should stay ignored/);
  assert.match(coverageDoc, /minimal extracted fixtures with source-family\s+metadata/);
});

test('untracked audit artifacts are documented as draft proof not tracked source coverage', () => {
  const untracked = git(['status', '--porcelain', '--untracked-files=all'])
    .map(line => line.startsWith('?? ') ? line.slice(3) : null)
    .filter(Boolean);
  const draftAuditDocs = untracked.filter(file => /^docs\/audit\/FILTERTUBE_.*\.md$/.test(file));
  const draftAuditTests = untracked.filter(file => /^tests\/runtime\/.*\.test\.mjs$/.test(file));

  assert.ok(draftAuditDocs.length > 0, 'current audit worktree should expose draft docs');
  assert.ok(draftAuditTests.length > 0, 'current audit worktree should expose draft tests');
  assert.match(coverageDoc, /Worktree Draft Artifact Boundary/);
  assert.match(coverageDoc, /draft proof artifacts until they are intentionally staged and\s+classified/);
  assert.match(coverageDoc, /do not change the meaning of the tracked-file source universe/);
  assert.match(coverageDoc, /git status --porcelain --untracked-files=all/);
  assert.match(coverageDoc, /must be updated in the same change/);
});
