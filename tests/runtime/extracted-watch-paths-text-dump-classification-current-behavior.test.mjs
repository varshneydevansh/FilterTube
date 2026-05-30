import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'extracted_watch_paths.txt';
const docPath = 'docs/audit/FILTERTUBE_EXTRACTED_WATCH_PATHS_TEXT_DUMP_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'extractedWatchPathsTextDumpClassifier',
  'watchPathDumpFixturePromotionGate',
  'watchPathDumpJsonDomParityReport',
  'watchPathDumpMetadataOnlyPolicy',
  'watchPathDumpNoPlaybackSideEffectReport',
  'watchPathDumpMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sections(text) {
  const matches = [...text.matchAll(/^--- (.+?) ---$/gm)];
  return matches.map((match, index) => {
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const body = text.slice(match.index, end);
    return {
      name: match[1],
      body,
      nonblankLines: body.split(/\r?\n/).filter(Boolean).length,
      pathRows: countLiteral(body, ' -> ')
    };
  });
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

test('extracted watch paths text dump audit doc and raw metadata are pinned', () => {
  const source = read(rawPath);
  const doc = read(docPath);

  assert.equal(lineCount(source), 677);
  assert.equal(countLiteral(source, '\n'), 676);
  assert.equal(Buffer.byteLength(source), 191278);
  assert.equal(sha256(rawPath), 'be92bbf6041b99088c9057ef77b1a190e30e2cec5ddb59dea4f127d5c8258613');

  for (const phrase of [
    'derived path dump',
    'not rendered DOM',
    'not a reduced fixture',
    '191278 bytes',
    'be92bbf6041b99088c9057ef77b1a190e30e2cec5ddb59dea4f127d5c8258613'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
  assert.match(doc, /not a raw JSON\s+response/);
  assert.match(doc, /not an implementation\s+authority/);
});

test('extracted watch paths text dump is path inventory, not parseable JSON or HTML DOM', () => {
  const source = read(rawPath);

  assert.throws(() => JSON.parse(source), SyntaxError);
  assert.deepEqual(sections(source).map((section) => section.name), [
    'videoSecondaryInfoRenderer',
    'playlistPanelVideoRenderer'
  ]);
  assert.equal(countLiteral(source, ' -> '), 674);
  assert.equal(countLiteral(source, 'var ytInitialData'), 0);
  assert.equal(countLiteral(source, '<html'), 0);
  assert.equal(countLiteral(source, 'ytp-endscreen'), 0);
  assert.equal(countLiteral(source, 'watchNextEndScreenRenderer'), 0);
  assert.equal(countLiteral(source, 'endScreenVideoRenderer'), 0);
  assert.equal(countLiteral(source, 'compactAutoplayRenderer'), 0);
});

test('section metrics pin metadata and playlist path inventory without behavior proof', () => {
  const byName = new Map(sections(read(rawPath)).map((section) => [section.name, section]));
  const secondary = byName.get('videoSecondaryInfoRenderer');
  const playlist = byName.get('playlistPanelVideoRenderer');

  assert.equal(secondary.nonblankLines, 522);
  assert.equal(secondary.pathRows, 521);
  assert.equal(countLiteral(secondary.body, 'videoOwnerRenderer'), 255);
  assert.equal(countLiteral(secondary.body, 'showDialogCommand'), 452);
  assert.equal(countLiteral(secondary.body, 'listItemViewModel'), 488);
  assert.equal(countLiteral(secondary.body, 'browseEndpoint.browseId'), 8);
  assert.equal(countLiteral(secondary.body, 'canonicalBaseUrl'), 8);
  assert.equal(countLiteral(secondary.body, 'actionButtons[0]'), 0);
  assert.equal(countLiteral(secondary.body, 'menu.menuRenderer'), 0);

  assert.equal(playlist.nonblankLines, 154);
  assert.equal(playlist.pathRows, 153);
  assert.equal(countLiteral(playlist.body, 'videoOwnerRenderer'), 0);
  assert.equal(countLiteral(playlist.body, 'showDialogCommand'), 78);
  assert.equal(countLiteral(playlist.body, 'listItemViewModel'), 74);
  assert.equal(countLiteral(playlist.body, 'browseEndpoint.browseId'), 4);
  assert.equal(countLiteral(playlist.body, 'canonicalBaseUrl'), 2);
  assert.equal(countLiteral(playlist.body, 'actionButtons[0]'), 25);
  assert.equal(countLiteral(playlist.body, 'menu.menuRenderer'), 12);
  assert.equal(countLiteral(playlist.body, 'likeEndpoint.target.videoId'), 2);
});

test('ledgers classify extracted watch paths as text-only evidence while keeping gates open', () => {
  const doc = read(docPath);
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const p0Traceability = read('docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const objective = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const tracked = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(rawIndex, /`extracted_watch_paths\.txt` \| `main-watch-next` \| yes \| classification-only:/);
  assert.match(rawIndex, /derived text path dump/);
  assert.match(rawIndex, /classified-unextracted/);
  assert.match(p0Traceability, /`extracted_watch_paths\.txt` is now classified as a derived watch path dump/);

  for (const ledger of [objective, activeGoal, tracked, runtimeResults]) {
    assert.ok(ledger.includes('FILTERTUBE_EXTRACTED_WATCH_PATHS_TEXT_DUMP_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md'));
    assert.ok(ledger.includes('extracted-watch-paths-text-dump-classification-current-behavior.test.mjs'));
  }

  for (const phrase of [
    'does not close',
    'watch_player_no_rule_metadata_only_without_recommendation_mutation',
    'rendered Main watch DOM wall'
  ]) {
    assert.ok(doc.includes(phrase), `missing open-gate phrase: ${phrase}`);
  }
});

test('path dump future authorities are absent from product runtime source', () => {
  const runtime = productRuntimeSource();

  assert.doesNotMatch(runtime, /extracted_watch_paths\.txt/);
  for (const token of futureAuthorityTokens) {
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
