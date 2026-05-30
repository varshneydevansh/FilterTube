import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'playlist.html';
const fixturePath = 'tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html';
const docPath = 'docs/audit/FILTERTUBE_PLAYLIST_PLAYER_ENDSCREEN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md';

const desktopWatchSources = [
  'YT_MAIN_WATCH.html',
  'YT_MAIN.json',
  'YT_MAIN_NEXT.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
  'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
  'get_watch?prettyPrint=false.json',
  'watchpage.json'
];

const playerDomSelectorTokens = [
  'ytp-endscreen-content',
  'ytp-ce-element',
  'ytp-fullscreen-grid-stills-container',
  'ytp-videowall-still',
  'ytp-ce-video',
  'ytp-ce-playlist',
  'ytp-ce-channel',
  'autonav-endscreen'
];

const futureAuthorityTokens = [
  'playlistPlayerEndscreenDomClassificationContract',
  'playlistPlayerEndscreenDomDecisionReport',
  'playlistPlayerEndscreenCleanCaptureGate',
  'playlistPlayerEndscreenSiblingVisibleReport',
  'playlistPlayerEndscreenWhitelistModeReport',
  'playlistPlayerEndscreenNoPlaybackSideEffectReport',
  'mainWatchRenderedDomWallCoverageGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function tokenCounts(text, tokens) {
  return Object.fromEntries(tokens.map(token => [token, countLiteral(text, token)]));
}

function sourceContainsAnyPlayerDomToken(file) {
  const source = read(file);
  return playerDomSelectorTokens.some(token => countLiteral(source, token) > 0);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('raw playlist.html player end-screen DOM metadata and selector counts are pinned', () => {
  const raw = read(rawPath);

  assert.equal(lineCount(raw), 24055);
  assert.equal(Buffer.byteLength(raw), 2905258);
  assert.equal(sha256(rawPath), '62d5819d489a417c49c0dfe1384a8efb5a2ab85146a00207dd135a87b93e877d');

  assert.deepEqual(tokenCounts(raw, [
    'movie_player',
    'ytp-endscreen-content',
    'ytp-ce-element',
    'ytp-fullscreen-grid-stills-container',
    'ytp-modern-videowall-still',
    'ytp-videowall-still',
    'ytp-ce-video',
    'ytp-ce-playlist',
    'ytp-ce-channel',
    'autonav-endscreen',
    'filtertube-hidden',
    'data-filtertube-hidden',
    'aria-selected="true"',
    'compactAutoplayRenderer'
  ]), {
    movie_player: 1,
    'ytp-endscreen-content': 1,
    'ytp-ce-element': 6,
    'ytp-fullscreen-grid-stills-container': 1,
    'ytp-modern-videowall-still': 216,
    'ytp-videowall-still': 0,
    'ytp-ce-video': 3,
    'ytp-ce-playlist': 5,
    'ytp-ce-channel': 5,
    'autonav-endscreen': 20,
    'filtertube-hidden': 106,
    'data-filtertube-hidden': 53,
    'aria-selected="true"': 2,
    compactAutoplayRenderer: 0
  });
});

test('desktop Main watch corpus still has no rendered player end-screen DOM wall capture', () => {
  const playlistRaw = read(rawPath);

  for (const source of desktopWatchSources) {
    assert.equal(sourceContainsAnyPlayerDomToken(source), false, `${source} should not be classified as rendered player end-screen DOM proof`);
  }

  assert.equal(sourceContainsAnyPlayerDomToken(rawPath), true);
  assert.match(playlistRaw, /ytd-playlist-panel-renderer/);
  assert.match(playlistRaw, /filtertube-hidden/);
  assert.match(playlistRaw, /data-filtertube-hidden/);
  assert.match(playlistRaw, /aria-selected="true"/);
});

test('reduced playlist player fixture preserves rendered end-screen DOM selectors without carrying mutation markers', () => {
  const fixture = read(fixturePath);

  assert.equal(lineCount(fixture), 58);
  assert.equal(Buffer.byteLength(fixture), 3170);
  assert.equal(sha256(fixturePath), '1d17cdbe9577fe99842bc202572da9c544f0362438804b6e0d0ab24a427ab357');

  for (const phrase of [
    'provenance: source=playlist.html',
    'classification: rendered player end-screen DOM evidence, not clean Main watch DOM wall proof',
    'id="movie_player"',
    'ytp-autonav-endscreen-countdown-overlay',
    'ytp-endscreen-content',
    'ytp-ce-channel',
    'ytp-ce-playlist',
    'ytp-ce-video',
    'ytp-fullscreen-grid-stills-container',
    'ytp-modern-videowall-still',
    'keshaVEVO',
    'Winter Feels',
    'Ke$ha - Your Love Is My Drug',
    'Tron Legacy - Daft Punk - The Suite 18 minutes'
  ]) {
    assert.ok(fixture.includes(phrase), `missing fixture phrase ${phrase}`);
  }

  assert.doesNotMatch(fixture, /filtertube-hidden|data-filtertube-hidden|aria-selected="true"|compactAutoplayRenderer/);
});

test('classification doc and ledgers separate playlist player DOM from Main watch DOM wall completion', () => {
  const doc = read(docPath);
  const ledgers = [
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
    'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
  ].map(read);

  for (const phrase of [
    'rendered desktop player end-screen DOM exists in `playlist.html`',
    'not clean Main watch DOM wall proof',
    'already-mutated playlist capture',
    '106 `filtertube-hidden` tokens',
    '53 `data-filtertube-hidden` tokens',
    '2 `aria-selected=true` tokens',
    '0 `compactAutoplayRenderer` tokens',
    'sibling-visible',
    'no playback side-effect'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('playlist-player-endscreen-dom-classification-current-behavior.test.mjs'));
    assert.ok(ledger.includes('playlist-player-endscreen-dom.html'));
    assert.match(ledger, /not clean Main watch DOM wall proof|not Main watch DOM wall proof/);
  }
});

test('future playlist player end-screen DOM authority tokens are absent from runtime source today', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
