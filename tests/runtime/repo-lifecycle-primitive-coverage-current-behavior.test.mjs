import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const coverageDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_REPO_LIFECYCLE_PRIMITIVE_COVERAGE_2026-05-18.md'),
  'utf8'
);

const PATTERNS = {
  addEventListener: /\.addEventListener\s*\(/g,
  removeEventListener: /\.removeEventListener\s*\(/g,
  mutationObserver: /new\s+MutationObserver\s*\(/g,
  intersectionObserver: /new\s+IntersectionObserver\s*\(/g,
  setInterval: /\bsetInterval\s*\(/g,
  clearInterval: /\bclearInterval\s*\(/g,
  setTimeout: /\bsetTimeout\s*\(/g,
  clearTimeout: /\bclearTimeout\s*\(/g,
  requestAnimationFrame: /\brequestAnimationFrame\s*\(/g,
  cancelAnimationFrame: /\bcancelAnimationFrame\s*\(/g,
  fetch: /\bfetch\s*\(/g,
  xmlHttpRequest: /\bXMLHttpRequest\b/g,
  postMessage: /\.postMessage\s*\(/g,
  sendMessage: /\.sendMessage\s*\(/g,
  dispatchEvent: /\.dispatchEvent\s*\(/g,
  clickCall: /\.click\s*\(/g,
  styleDisplay: /\.style\.display\s*=/g,
  classListMutation: /\.classList\.(?:add|remove|toggle)\s*\(/g
};
const PAGE_RESIDENT_TOKEN_PATTERNS = {
  addEventListener: /addEventListener/g,
  removeEventListener: /removeEventListener/g,
  mutationObserver: /new\s+MutationObserver/g,
  disconnect: /\.disconnect\s*\(/g,
  setInterval: /setInterval/g,
  clearInterval: /clearInterval/g,
  setTimeout: /setTimeout/g,
  clearTimeout: /clearTimeout/g,
  requestAnimationFrame: /requestAnimationFrame/g,
  cancelAnimationFrame: /cancelAnimationFrame/g
};
const pageResidentLifecycleFiles = [
  'js/content_bridge.js',
  'js/content/block_channel.js',
  'js/content/dom_fallback.js',
  'js/injector.js',
  'js/content/bridge_settings.js',
  'js/content/collab_dialog.js',
  'js/content/bridge_injection.js',
  'js/content/handle_resolver.js',
  'js/seed.js'
];

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function classify(file) {
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-scripts';
  if (file.startsWith('src/')) return 'generated-ui-source';
  if (file.startsWith('js/vendor/')) return 'vendor-bundles';
  if (file.startsWith('js/ui-shell/')) return 'generated-ui-output';
  if (file === 'js/layout.js') return 'quarantined-legacy-js';
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
  if (file.startsWith('website/')) return 'website-config';
  return 'UNCLASSIFIED';
}

function fileStats(file) {
  const text = source(file);
  const stats = {};
  for (const [name, pattern] of Object.entries(PATTERNS)) {
    stats[name] = count(text, pattern);
  }
  stats.total = Object.values(stats).reduce((sum, value) => sum + value, 0);
  return stats;
}

function primitiveFootprint(stats) {
  return {
    listeners: stats.addEventListener + stats.removeEventListener,
    observers: stats.mutationObserver + stats.intersectionObserver,
    timersFrames:
      stats.setInterval +
      stats.clearInterval +
      stats.setTimeout +
      stats.clearTimeout +
      stats.requestAnimationFrame +
      stats.cancelAnimationFrame,
    networkMessages: stats.fetch + stats.xmlHttpRequest + stats.postMessage + stats.sendMessage,
    domSideEffects:
      stats.dispatchEvent +
      stats.clickCall +
      stats.styleDisplay +
      stats.classListMutation,
    total: stats.total
  };
}

function pageResidentLifecycleStats(file) {
  const text = source(file);
  const stats = {};
  for (const [name, pattern] of Object.entries(PAGE_RESIDENT_TOKEN_PATTERNS)) {
    stats[name] = count(text, pattern);
  }
  stats.total = Object.values(stats).reduce((sum, value) => sum + value, 0);
  return stats;
}

function aggregate() {
  const files = git([
    'ls-files',
    '*.js',
    '*.jsx',
    '*.mjs',
    ':(exclude)docs/**',
    ':(exclude)tests/**'
  ]);
  const totals = Object.fromEntries(Object.keys(PATTERNS).map(name => [name, 0]));
  const families = {};
  const perFile = {};

  for (const file of files) {
    const family = classify(file);
    assert.notEqual(family, 'UNCLASSIFIED', `${file} must be lifecycle-classified`);

    const stats = fileStats(file);
    perFile[file] = stats;
    families[family] ||= { files: 0, total: 0 };
    families[family].files += 1;
    families[family].total += stats.total;

    for (const name of Object.keys(PATTERNS)) {
      totals[name] += stats[name];
      families[family][name] = (families[family][name] || 0) + stats[name];
    }
  }

  return { files, totals, families, perFile };
}

test('repo lifecycle primitive coverage documents the tracked JS source boundary', () => {
  assert.match(coverageDoc, /git ls-files '\*\.js' '\*\.jsx' '\*\.mjs'/);
  assert.match(coverageDoc, /Current tracked JS\/JSX\/MJS count:/);
  assert.match(coverageDoc, /71/);
  assert.match(coverageDoc, /Ignored root captures and generated package output are excluded/);
});

test('every tracked JS JSX and MJS file is lifecycle-classified', () => {
  const { files, families, perFile } = aggregate();
  assert.equal(files.length, 71);
  assert.deepEqual(
    Object.fromEntries(Object.entries(families).map(([family, stats]) => [family, stats.files]).sort()),
    {
      'build-release-sync-scripts': 7,
      'content-runtime-js': 17,
      'extension-ui-background-js': 13,
      'generated-ui-output': 2,
      'generated-ui-source': 3,
      'quarantined-legacy-js': 1,
      'vendor-bundles': 2,
      'website-app-routes': 9,
      'website-components': 15,
      'website-config': 2
    }
  );

  assert.match(coverageDoc, /Per-file primitive footprint rows: 71/);
  const documentedRows = [
    ...coverageDoc.matchAll(/^\| `([^`]+)` \| `([^`]+)` \| \d+ \| \d+ \| \d+ \| \d+ \| \d+ \| \d+ \|$/gm)
  ];
  assert.equal(documentedRows.length, files.length);

  for (const file of files) {
    const family = classify(file);
    const grouped = primitiveFootprint(perFile[file]);
    const expectedRow =
      `| \`${file}\` | \`${family}\` | ${grouped.listeners} | ${grouped.observers} | ` +
      `${grouped.timersFrames} | ${grouped.networkMessages} | ${grouped.domSideEffects} | ${grouped.total} |`;
    assert.ok(coverageDoc.includes(expectedRow), `missing lifecycle primitive footprint row for ${file}`);
  }
});

test('repo-wide lifecycle primitive totals match current tracked source', () => {
  const { totals } = aggregate();
  assert.deepEqual(totals, {
    addEventListener: 301,
    removeEventListener: 18,
    mutationObserver: 16,
    intersectionObserver: 4,
    setInterval: 4,
    clearInterval: 5,
    setTimeout: 124,
    clearTimeout: 34,
    requestAnimationFrame: 31,
    cancelAnimationFrame: 4,
    fetch: 14,
    xmlHttpRequest: 2,
    postMessage: 26,
    sendMessage: 35,
    dispatchEvent: 33,
    clickCall: 33,
    styleDisplay: 96,
    classListMutation: 110
  });
  assert.equal(Object.values(totals).reduce((sum, value) => sum + value, 0), 890);
  assert.match(coverageDoc, /\*\*Total\*\* \| \*\*890\*\*/);
});

test('lifecycle primitive family totals pin page runtime UI website vendor and quarantine burden', () => {
  const { families } = aggregate();
  const familyTotals = Object.fromEntries(
    Object.entries(families).map(([family, stats]) => [family, stats.total]).sort()
  );
  assert.deepEqual(familyTotals, {
    'build-release-sync-scripts': 0,
    'content-runtime-js': 389,
    'extension-ui-background-js': 421,
    'generated-ui-output': 8,
    'generated-ui-source': 2,
    'quarantined-legacy-js': 37,
    'vendor-bundles': 8,
    'website-app-routes': 1,
    'website-components': 24,
    'website-config': 0
  });

  assert.ok(
    families['extension-ui-background-js'].total > families['content-runtime-js'].total,
    'UI/background lifecycle and side-effect surface is currently larger than page runtime by lexical primitive count'
  );
});

test('hot lifecycle files and teardown imbalance are documented as current audit findings', () => {
  const { perFile, totals } = aggregate();
  assert.equal(perFile['js/tab-view.js'].total, 274);
  assert.equal(perFile['js/content_bridge.js'].total, 165);
  assert.equal(perFile['js/content/block_channel.js'].total, 81);
  assert.equal(perFile['js/layout.js'].total, 37);

  assert.ok(totals.addEventListener > totals.removeEventListener * 16);
  assert.ok(totals.setTimeout > totals.clearTimeout * 3);
  assert.ok(totals.styleDisplay + totals.classListMutation > 200);

  assert.match(coverageDoc, /Listener teardown is much smaller than listener install surface/);
  assert.match(coverageDoc, /Delayed work teardown is smaller than delayed work setup/);
  assert.match(coverageDoc, /Quarantined code still carries side-effect density/);
});

test('page-resident lifecycle token imbalance is pinned as a cleanup no-go', () => {
  const perFileTotals = {};
  const totals = Object.fromEntries(Object.keys(PAGE_RESIDENT_TOKEN_PATTERNS).map(name => [name, 0]));

  for (const file of pageResidentLifecycleFiles) {
    const stats = pageResidentLifecycleStats(file);
    perFileTotals[file] = stats.total;
    for (const name of Object.keys(PAGE_RESIDENT_TOKEN_PATTERNS)) {
      totals[name] += stats[name];
    }
  }

  assert.deepEqual(perFileTotals, {
    'js/content_bridge.js': 97,
    'js/content/block_channel.js': 74,
    'js/content/dom_fallback.js': 14,
    'js/injector.js': 12,
    'js/content/bridge_settings.js': 22,
    'js/content/collab_dialog.js': 10,
    'js/content/bridge_injection.js': 2,
    'js/content/handle_resolver.js': 1,
    'js/seed.js': 5
  });
  assert.deepEqual(totals, {
    addEventListener: 79,
    removeEventListener: 11,
    mutationObserver: 14,
    disconnect: 8,
    setInterval: 3,
    clearInterval: 4,
    setTimeout: 81,
    clearTimeout: 22,
    requestAnimationFrame: 15,
    cancelAnimationFrame: 0
  });
  assert.equal(Object.values(totals).reduce((sum, value) => sum + value, 0), 237);

  for (const token of [
    '2026-05-30 Page-Resident Teardown Imbalance Addendum',
    '237 selected page-resident lifecycle tokens',
    '79 `addEventListener`',
    '11 `removeEventListener`',
    '14 `new MutationObserver`',
    '8 `.disconnect()`',
    '3 `setInterval`',
    '4 `clearInterval`',
    '81 `setTimeout`',
    '22 `clearTimeout`',
    '15 `requestAnimationFrame`',
    '0 `cancelAnimationFrame`',
    'page-resident lifecycle teardown completeness: NO-GO',
    'observer/listener/timer cleanup optimization approval: NO-GO',
    'JSON-first runtime promotion from lifecycle token scan: NO-GO',
    'runtime behavior changed: no'
  ]) {
    assert.ok(coverageDoc.includes(token), `missing page-resident lifecycle addendum token ${token}`);
  }
});
