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
  ['docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md', 173, 6691, '15dfa4c585061c21a34df271c1f3390cca7776a0b9435661858f025c2d2834d0'],
  ['docs/ARCHITECTURE.md', 1738, 72837, '63da6f0edae079a1730f7b6790ba3183cdd8ba8511633d4eba5b7e5d29e6b448'],
  ['docs/CHANNEL_BLOCKING_SYSTEM.md', 1113, 49350, '61b5ef34d05dd9e722468629151499167f491adf67dea4a39561dc413456c845'],
  ['docs/CODEMAP.md', 277, 21006, '6c4fc1586083d62c5a2d91bfe51048a193050422e6fa82c0cdc1901fdb969dfc'],
  ['docs/CONTENT_HIDING_PLAYBOOK.md', 680, 35315, 'a57b703ae626f58911fb37f898cd166c880899359c80734a29f11763d31ed3e9'],
  ['docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md', 621, 20500, 'bcc435a2d18ab9587b7e69e76851f9759dd972bcb12f6484d5ed6cb19f001fd8'],
  ['docs/DEVELOPER_GUIDE.md', 546, 15805, 'f790737e4e8f6b8d0544c072b5caa0448f4f3ac194c519033f05f7e348af9dbb'],
  ['docs/FUNCTIONALITY.md', 881, 45960, '8b4608a0874c4b925b11f1d425692fb9ecc031b14bb4474cbeb3ea6da74b0f60'],
  ['docs/LEGACY_CHANNELS.md', 40, 2056, '53d12f59900027c06e2cc5d599f6f488885ad284a046fb18059e21370ec029de'],
  ['docs/MOBILE_APP_HANDOFF_CONTEXT.md', 221, 6991, 'da2659310107397e03f3d30f604302304b344cd711dc3a809c1ea24bb9e832b5'],
  ['docs/NANAH_MANAGED_LINK_QA.md', 147, 4092, '3b83b2380c851da49852c1cc6a009aac0174866e12d445fdb86a96164cc90422'],
  ['docs/NANAH_P2P_PROJECT_PLAN.md', 456, 13431, 'bf1566eafbe7c68ab133d56a48e49ae404cd1d7f03da04ba3831d62b5db6b19f'],
  ['docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md', 169, 17134, '54ae9a8d973609ccc8ac0ea3611c9caffe1af9c6d262978b3da160d7a798e078'],
  ['docs/NANAH_USER_GUIDE.md', 208, 5493, '3f13761a36c502da128e53450334b855b881a0e5009d99607fa19b4d60dc1ed7'],
  ['docs/NETWORK_REQUEST_PIPELINE.md', 1067, 36009, '1868caad4f29a05f17d784eed352d1b231ae358e576d02c19a4d3987f97ca5a5'],
  ['docs/PROACTIVE_CHANNEL_IDENTITY.md', 684, 25024, '88e2d2ac6935b8fe623dcc776ac9ac25e94a758196b0c527adceb6c6aa7d0d41'],
  ['docs/PROFILES_PIN_MODEL.md', 613, 26872, '31c3645a3d2829ca61cc51a9ca341ab7b05b634141594a7cab81dc75466c8082'],
  ['docs/SUBSCRIBED_CHANNELS_IMPORT.md', 291, 10550, 'afe276f3964bc9ba9991ae71c21066219bc740f8ee478902f3d3cb3cb23d295c'],
  ['docs/TECHNICAL.md', 2173, 89075, '9060a8d98bce4ffb4e682aaaef886482e028b0aeea25f86bc48f8e14839371c9'],
  ['docs/THREE_DOT_MENU_IMPROVEMENTS.md', 605, 25117, 'cfce8072c7b827f96ceaa8812c7196efd364b295481ead3b055ed1cab5b785c6'],
  ['docs/WATCH_PLAYLIST_BREAKDOWN.md', 550, 36988, '5f849eb9fc7bda3f54dc350d6aafe958fedccd43c9dafd1dc1eb2ffb18cfa804'],
  ['docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md', 156, 6939, '216eb966bfebc8a6024f39d8ca30e0a5a8898e37c7dff4c5e1646cf6fb5b46d9'],
  ['docs/YOUTUBE_KIDS_INTEGRATION.md', 781, 28964, '25e1326cb069e5728b81a74177005139e57659152dcf66f0a559976fa0f77476'],
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

  assert.equal(totalNewlines, 16276);
  assert.equal(totalBytes, 707346);
  assert.match(doc, /29 tracked product\/public docs/);
  assert.match(doc, /16,276 newline counts/);
  assert.match(doc, /707,346 bytes/);
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
  assert.equal(structure.h2, 388);
  assert.equal(structure.h3, 681);
  assert.equal(structure.inline, 3136);
  assert.equal(structure.absolute, 146);
  assert.equal(structure.fileRefs, 306);

  const tokenTotals = [
    ['s/t phrase', count(combined, authorityPhrase), 12],
    ['complete', count(combined, 'complete'), 42],
    ['implemented', count(combined, 'implemented'), 7],
    ['guarantee', count(combined, 'guarantee'), 14],
    ['always', count(combined, 'always'), 22],
    ['never', count(combined, 'never'), 37],
    ['zero', count(combined, 'zero'), 17],
    ['instant', count(combined, 'instant'), 25],
    ['performance', count(combined, 'performance'), 34],
    ['optimization', count(combined, 'optimization'), 13],
    ['runtime', count(combined, 'runtime'), 129],
    ['release', count(combined, 'release'), 146],
    ['native', count(combined, 'native'), 118],
    ['sync', count(combined, 'sync'), 201],
    ['JSON-first', count(combined, 'JSON-first'), 12],
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
  assert.match(doc, /H2 headings: 388/);
  assert.match(doc, /H3 headings: 681/);
  assert.match(doc, /Inline-code spans: 3,136/);
  assert.match(doc, /Absolute local path strings: 146/);
  assert.match(doc, /File-reference tokens for product\/build\/site paths: 306/);
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

  assert.equal(files.length, 237);
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
