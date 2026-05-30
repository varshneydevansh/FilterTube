import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const jsonReferenceDocs = [
  'docs/JSON_FIRST_FILTERING_PLAN.md',
  'docs/json_paths_encyclopedia.md',
  'docs/watch_json_paths.md',
  'docs/youtube_renderer_inventory.md',
];
const expectedRows = [
  ['docs/ANDROID_PUBLIC_DISTRIBUTION.md', 91, 4545, 'c4ae25ab8038caa3effe34b973eedd3832bb3543b4fa73113a25bb8938c2fce2'],
  ['docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md', 156, 5797, 'c4831186eb625020d557681392b52ba605132c07537a2561e296cbf082a880d1'],
  ['docs/ARCHITECTURE.md', 1714, 71575, 'd47fab9c67fbbcac58580cab13da0da2feb5c118a380cdfc237855c1a957e882'],
  ['docs/CHANNEL_BLOCKING_SYSTEM.md', 1106, 48770, 'ce42fcd17dc8f8bb35b484b7bb979028c4bac7f83aa152324c1c7027ea0b251a'],
  ['docs/CODEMAP.md', 265, 19634, '4ccca1a4629a19889e78760974ad5aeb5754dbc9e0fd47e1821da9b4394899a8'],
  ['docs/CONTENT_HIDING_PLAYBOOK.md', 658, 34262, 'b81e15f9d62c3e2e76b13c8b2fe5fa47a1586885208893dd9c3af0d109b597d3'],
  ['docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md', 621, 20500, 'bcc435a2d18ab9587b7e69e76851f9759dd972bcb12f6484d5ed6cb19f001fd8'],
  ['docs/DEVELOPER_GUIDE.md', 536, 15150, '9d8e05d19135625379b691b9aaddefb312fccb6e13d2d14c5ec4e4d63ce552c5'],
  ['docs/FUNCTIONALITY.md', 872, 45044, 'cf9cbe10dc8333ca5404fa950d2cef39a7906cecc0f8025c7be56eaddb95bf1e'],
  ['docs/LEGACY_CHANNELS.md', 40, 2056, '53d12f59900027c06e2cc5d599f6f488885ad284a046fb18059e21370ec029de'],
  ['docs/MOBILE_APP_HANDOFF_CONTEXT.md', 200, 5965, 'b9b9d182d76e113682c09574842ddddcc33712cb4650b15005d0358c9b6c0c73'],
  ['docs/NANAH_MANAGED_LINK_QA.md', 147, 4092, '3b83b2380c851da49852c1cc6a009aac0174866e12d445fdb86a96164cc90422'],
  ['docs/NANAH_P2P_PROJECT_PLAN.md', 456, 13431, 'bf1566eafbe7c68ab133d56a48e49ae404cd1d7f03da04ba3831d62b5db6b19f'],
  ['docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md', 169, 17134, '54ae9a8d973609ccc8ac0ea3611c9caffe1af9c6d262978b3da160d7a798e078'],
  ['docs/NANAH_USER_GUIDE.md', 208, 5493, '3f13761a36c502da128e53450334b855b881a0e5009d99607fa19b4d60dc1ed7'],
  ['docs/NETWORK_REQUEST_PIPELINE.md', 1052, 35212, 'a7643d9dd513e0865f2816e639dd481113e2b671fe35eac22268bd1f95d9a40b'],
  ['docs/PROACTIVE_CHANNEL_IDENTITY.md', 674, 24303, '8c99c2ad84817b9d47dde9156a476b6883091b3b828cdf5fac89aa4b6415ed96'],
  ['docs/PROFILES_PIN_MODEL.md', 613, 26872, '31c3645a3d2829ca61cc51a9ca341ab7b05b634141594a7cab81dc75466c8082'],
  ['docs/SUBSCRIBED_CHANNELS_IMPORT.md', 291, 10550, 'afe276f3964bc9ba9991ae71c21066219bc740f8ee478902f3d3cb3cb23d295c'],
  ['docs/TECHNICAL.md', 2163, 87928, '3518c7d72339d7162e681ce2277ea54dd76f601bba692a4b133b95f02aeb58f9'],
  ['docs/THREE_DOT_MENU_IMPROVEMENTS.md', 597, 24571, 'bc97c3fe73b678b649846fb7ce442c9e8cdd8d3141516f39b0ae248f18d46324'],
  ['docs/WATCH_PLAYLIST_BREAKDOWN.md', 549, 36711, 'd032dc823b5d9bdc0a142191eca17838ec11cfaf7b42203aae2d007838dd4698'],
  ['docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md', 125, 5319, '431164028d05d829d959ddd8676b03587660abadd23d3a4b60e2834dae9a02e3'],
  ['docs/YOUTUBE_KIDS_INTEGRATION.md', 774, 28403, 'c752ec50fd8afdb689ec04e54fcefa6ceb5500d472f20d669ed88c08637de057'],
  ['docs/collab_three_dot_ui_google_aistudio.md', 397, 28346, 'af45e120882611e93a04340fc7c004c984e2a571b65b1f3d3c79abf8bd53b94a'],
  ['docs/filtertube-scenic-media-prompt-brief.md', 316, 13328, 'c9d6cc852c3ba749e14ba09fad4fbad2b1fbe9e99c6d05ac28f75ce91ce38497'],
  ['docs/filtertube-serene-website-platform-expansion-plan.md', 500, 27547, 'ea957de2d3e171a7dd3caf8f7b7c9683cbd631d2f7a2c2adcc89ef5a6ed8fcd5'],
  ['docs/filtertube_mobile_runtime_adapter_plan.md', 366, 10943, 'f73a43c0836e0b7ee2a37860bd5009512b53fa5247279b0667e85c1a2390d18c'],
  ['docs/filtertube_mobile_tv_architecture_plan.md', 416, 20438, 'f86169e132f7ced02bdf8ac291b96531e3ab569ee0cb6fe2d5f1ca820901ee97'],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(filePath(file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function newlineCount(file) {
  return (read(file).match(/\n/g) || []).length;
}

function byteCount(file) {
  return fs.statSync(filePath(file)).size;
}

function count(source, needle) {
  return source.split(needle).length - 1;
}

function countRegex(source, pattern) {
  return (source.match(pattern) || []).length;
}

function trackedDocs() {
  return execSync("git ls-files 'docs/*.md' ':(exclude)docs/audit/**'", { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();
}

function publicDocs() {
  const excluded = new Set(jsonReferenceDocs);
  return trackedDocs().filter((file) => !excluded.has(file));
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(filePath(dir), { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', '.next', 'docs', 'tests'].includes(entry.name)) continue;
    const relative = path.join(dir, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      walkFiles(relative, files);
    } else if (entry.isFile() && /\.(js|jsx|mjs|json|html|css|md)$/.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
}

function productFiles() {
  return [
    'build.js',
    'package.json',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    ...walkFiles('js'),
    ...walkFiles('scripts'),
    ...walkFiles('html'),
    ...walkFiles('css'),
    ...walkFiles('website'),
  ].filter((file) => fs.existsSync(filePath(file)));
}

function productSource() {
  return productFiles().map((file) => read(file)).join('\n');
}

function formatNumber(value) {
  return value.toLocaleString('en-US');
}

test('tracked public doc claim surface is audit-only and fingerprint pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof\. Runtime behavior is unchanged\./);
  assert.equal(trackedDocs().length, 33);
  assert.deepEqual(publicDocs(), expectedRows.map(([file]) => file));
  assert.equal(jsonReferenceDocs.length, 4);

  let totalNewlines = 0;
  let totalBytes = 0;
  for (const [file, expectedNewlines, expectedBytes, expectedHash] of expectedRows) {
    assert.equal(newlineCount(file), expectedNewlines, file);
    assert.equal(byteCount(file), expectedBytes, file);
    assert.equal(sha256(file), expectedHash, file);
    assert.match(
      doc,
      new RegExp(`\\| \`${file.replaceAll('/', '\\/')}\` \\| ${expectedNewlines} \\| ${formatNumber(expectedBytes)} \\| \`${expectedHash}\` \\|`)
    );
    totalNewlines += expectedNewlines;
    totalBytes += expectedBytes;
  }

  assert.equal(totalNewlines, 16072);
  assert.equal(totalBytes, 693919);
  assert.match(doc, /29 tracked product\/public docs/);
  assert.match(doc, /16,072 newline counts/);
  assert.match(doc, /693,919 bytes/);
  assert.match(doc, /Excluded because they already have a focused JSON-reference audit/);
});

test('tracked public docs keep structure and claim-token counts pinned', () => {
  const doc = read(docPath);
  const sources = expectedRows.map(([file]) => read(file));
  const combined = sources.join('\n');
  const authorityPhrase = ['source', 'of', 'truth'].join(' ');
  const structure = sources.reduce(
    (acc, source) => {
      acc.h1 += countRegex(source, /^# /gm);
      acc.h2 += countRegex(source, /^## /gm);
      acc.h3 += countRegex(source, /^### /gm);
      acc.inline += countRegex(source, /`[^`]+`/g);
      acc.absolute += count(source, '/Users/devanshvarshney/FilterTube');
      acc.fileRefs += countRegex(source, /`?(?:js|scripts|html|css|manifest|data|website)\/[A-Za-z0-9_.\/-]+`?/g);
      return acc;
    },
    { h1: 0, h2: 0, h3: 0, inline: 0, absolute: 0, fileRefs: 0 }
  );

  assert.equal(structure.h1, 29);
  assert.equal(structure.h2, 376);
  assert.equal(structure.h3, 676);
  assert.equal(structure.inline, 3099);
  assert.equal(structure.absolute, 144);
  assert.equal(structure.fileRefs, 291);

  const tokenTotals = [
    ['s/t phrase', count(combined, authorityPhrase), 11],
    ['complete', count(combined, 'complete'), 41],
    ['implemented', count(combined, 'implemented'), 7],
    ['guarantee', count(combined, 'guarantee'), 14],
    ['always', count(combined, 'always'), 22],
    ['never', count(combined, 'never'), 37],
    ['zero', count(combined, 'zero'), 17],
    ['instant', count(combined, 'instant'), 25],
    ['performance', count(combined, 'performance'), 34],
    ['optimization', count(combined, 'optimization'), 13],
    ['runtime', count(combined, 'runtime'), 108],
    ['release', count(combined, 'release'), 93],
    ['native', count(combined, 'native'), 108],
    ['sync', count(combined, 'sync'), 183],
    ['JSON-first', count(combined, 'JSON-first'), 9],
    ['first-class', count(combined, 'first-class'), 4],
    ['authority', count(combined, 'authority'), 27],
    ['manifest', count(combined, 'manifest'), 4],
    ['fetch', count(combined, 'fetch'), 217],
    ['observer', count(combined, 'observer'), 12],
    ['listener', count(combined, 'listener'), 8],
    ['timer', count(combined, 'timer'), 4],
  ];

  for (const [label, actual, expected] of tokenTotals) {
    assert.equal(actual, expected, label);
    assert.match(doc, new RegExp(`\\| ${label} \\| ${expected} \\|`));
  }

  assert.match(doc, /H1 headings: 29/);
  assert.match(doc, /H2 headings: 376/);
  assert.match(doc, /H3 headings: 676/);
  assert.match(doc, /Inline-code spans: 3,099/);
  assert.match(doc, /Absolute local path strings: 144/);
  assert.match(doc, /File-reference tokens for product\/build\/site paths: 291/);
});

test('tracked public docs remain documentation claims rather than runtime or package authority', () => {
  const doc = read(docPath);
  const files = productFiles();
  const references = [];

  for (const file of files) {
    const source = read(file);
    for (const [trackedDoc] of expectedRows) {
      if (source.includes(trackedDoc) || source.includes(path.basename(trackedDoc))) {
        references.push([file, trackedDoc]);
      }
    }
  }

  assert.equal(files.length, 236);
  assert.deepEqual(references, [
    ['website/assets/videos/README.md', 'docs/filtertube-scenic-media-prompt-brief.md'],
  ]);
  assert.doesNotMatch(read('build.js'), /COMMON_DIRS[\s\S]*['"]docs['"]/);
  assert.match(doc, /website\/assets\/videos\/README\.md/);
  assert.match(doc, /docs\/filtertube-scenic-media-prompt-brief\.md/);
  assert.match(doc, /website asset note, not runtime behavior authority/);
  assert.match(doc, /build\.js` does not list `docs` in the package-copy directory set/);
});

test('ignored local docs remain outside the tracked public doc claim surface', () => {
  const doc = read(docPath);
  const ignore = read('.gitignore');
  const ignoredDocs = [
    'docs/MOBILE_APP_UI_SPEC.md',
    'docs/spa-collab-watchlist-handoff.md',
    'docs/subscribed-channels-whitelist-import-plan.md',
  ];

  for (const file of ignoredDocs) {
    assert.equal(trackedDocs().includes(file), false, file);
    assert.match(execSync(`git check-ignore ${file}`, { cwd: repoRoot, encoding: 'utf8' }), new RegExp(file));
    assert.match(doc, new RegExp(file.replaceAll('/', '\\/')));
  }

  assert.match(ignore, /Docs\/MOBILE_APP_UI_SPEC\.md/);
  assert.match(ignore, /docs\/spa-collab-watchlist-handoff\.md/);
  assert.match(ignore, /docs\/subscribed-channels-whitelist-import-plan\.md/);
  assert.match(doc, /outside the tracked-doc obligation surface/);
});

test('tracked public doc claim surface has no product authority symbols yet', () => {
  const source = productSource();
  const doc = read(docPath);
  const missingSymbols = [
    'trackedPublicDocClaimAuthority',
    'trackedPublicDocRuntimeParityReport',
    'trackedPublicDocReleaseParityReport',
    'trackedPublicDocNativeParityReport',
    'trackedPublicDocMetricAuthority',
    'trackedPublicDocLifecycleBudget',
    'trackedPublicDocIgnoredBoundaryReport',
    'trackedPublicDocDeletionReadinessReport',
    'trackedPublicDocJsonFirstPromotionGate',
  ];

  for (const symbol of missingSymbols) {
    assert.equal(source.includes(symbol), false, symbol);
    assert.equal(doc.includes(`\`${symbol}\``), true, symbol);
  }

  assert.match(doc, /claim-to-runtime traceability per claim family/);
  assert.match(doc, /route\/surface\/profile\/list-mode fixtures/);
  assert.match(doc, /release package artifact parity/);
  assert.match(doc, /native app revision and generated-runtime freshness proof/);
  assert.match(doc, /performance metric artifacts/);
  assert.match(doc, /network and lifecycle no-work budgets/);
  assert.match(doc, /ignored-doc and tracked-doc migration decisions/);
  assert.match(doc, /public docs deletion\/readiness reports/);
  assert.match(doc, /first-class JSON filter promotion gates/);
});
