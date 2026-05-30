import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_RAW_CORPUS_CENSUS_CURRENT_BEHAVIOR_2026-05-23.md';
const token = 'compactAutoplayRenderer';

const futureAuthorityTokens = [
  'compactAutoplayRawCorpusCensusContract',
  'compactAutoplayRawCorpusDecisionReport',
  'compactAutoplayFixtureAcquisitionGate',
  'compactAutoplayHistoricalTextBoundary',
  'compactAutoplayJsonHtmlCaptureGate',
  'compactAutoplayJsonFirstAuthorityGate',
  'compactAutoplayNoPlaybackSideEffectReport'
];

const watchRawSources = [
  'YT_MAIN_WATCH.html',
  'YT_MAIN.json',
  'YT_MAIN_NEXT.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
  'get_watch?prettyPrint=false.json',
  'watchpage.json',
  'extracted_watch_paths.txt'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function ignoredEvidenceEntries() {
  const lines = read('.gitignore')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('#'));

  return lines.filter(line =>
    /\.(?:json|html|txt|JS|js|md)$/i.test(line) &&
    /YT_|YTM|ytkids|watch|playlist|collab|comments|logs|tmp|stash|reset|WHITELIST|DOMs|guide|reel|import_channels|extracted_watch_paths|strange_ytInitialData|cher|text/i.test(line)
  );
}

function countToken(source) {
  return (source.match(new RegExp(token, 'g')) || []).length;
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js'
  ].map(read).join('\n');
}

test('compact autoplay raw corpus census doc records the no-JSON/HTML verdict', () => {
  const doc = read(docPath);

  for (const phrase of [
    'mentions only in historical text notes',
    'not in any raw JSON or HTML capture',
    'compactAutoplayRenderer mentions in raw JSON/HTML captures: 0',
    'committed compact autoplay fixtures: 0',
    'not renderer payload proof',
    'A real capture is still required'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('ignored raw evidence corpus has compact autoplay mentions only in historical text files', () => {
  const entries = ignoredEvidenceEntries();
  const uniqueEntries = [...new Set(entries)];
  const presentEntries = entries.filter(exists);
  const uniquePresentEntries = uniqueEntries.filter(exists);
  const counts = Object.fromEntries(
    uniquePresentEntries
      .map(file => [file, countToken(read(file))])
      .filter(([, count]) => count > 0)
  );
  const jsonHtmlCount = uniquePresentEntries
    .filter(file => /\.(?:json|html)$/i.test(file))
    .reduce((sum, file) => sum + countToken(read(file)), 0);

  assert.equal(entries.length, 46);
  assert.equal(uniqueEntries.length, 45);
  assert.equal(presentEntries.length, 45);
  assert.equal(uniquePresentEntries.length, 44);
  assert.deepEqual(counts, {
    'reset37.txt': 2,
    'text.txt': 2
  });
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 4);
  assert.equal(jsonHtmlCount, 0);
});

test('Main watch and next raw sources have zero literal compactAutoplayRenderer tokens', () => {
  const doc = read(docPath);

  for (const file of watchRawSources) {
    assert.equal(countToken(read(file)), 0, `${file} should not contain ${token}`);
    assert.ok(doc.includes(`${file}: 0`), `doc should pin zero-token watch source ${file}`);
  }
});

test('compact autoplay has no committed reduced fixture or runtime authority today', () => {
  const fixtureNames = fs.readdirSync(path.join(repoRoot, 'tests/runtime/fixtures/captures'));
  const runtime = productRuntimeSource();
  const compactAudit = read('docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.equal(fixtureNames.some(name => /compact-autoplay/i.test(name)), false);
  assert.doesNotMatch(runtime, /compactAutoplayRenderer/);
  assert.match(compactAudit, /has no committed extracted capture fixture/);

  for (const authorityToken of futureAuthorityTokens) {
    assert.doesNotMatch(runtime, new RegExp(authorityToken));
    assert.match(read(docPath), new RegExp(authorityToken));
  }
});

test('compact autoplay raw corpus census is linked from audit ledgers without closing the gate', () => {
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('compact-autoplay-raw-corpus-census-current-behavior.test.mjs'));
    assert.match(ledger, /not in any raw JSON or HTML capture|raw JSON\/HTML captures: 0/);
    assert.match(ledger, /real capture is still\s+required|A real capture is still\s+required|fixture remains required/);
  }
});
