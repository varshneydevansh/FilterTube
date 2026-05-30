import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'YTM-LOGS.txt';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-logs-playlist-bottom-sheet-stale-identity.html';
const docPath = 'docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md';

const futureAuthoritySymbols = [
  'ytmLogsPlaylistBottomSheetIdentityContract',
  'ytmLogsPlaylistBottomSheetIdentityReport',
  'ytmLogsBottomSheetTriggerCardKeyReport',
  'ytmLogsPlaylistMenuStaleIdentityPolicy',
  'ytmLogsPlaylistOwnerHandleAuthority',
  'ytmLogsPlaylistJsonDomParityGate',
  'ytmLogsMenuInjectionRaceBudget',
  'ytmLogsBottomSheetTeardownReport',
  'ytmLogsStaleMenuNegativeSiblingFixture',
  'ytmLogsPlaylistBlockActionAuthority'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

test('YTM logs playlist bottom-sheet stale identity doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = read(fixturePath);
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const text of [doc, traceability, rawIndex, runtimeResults, objectiveLedger]) {
    assert.ok(text.includes('YTM-LOGS.txt'));
    assert.ok(text.includes('ytm-logs-playlist-bottom-sheet-stale-identity.html'));
    assert.ok(text.includes('ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs'));
  }

  assert.ok(fixture.includes('data-filtertube-raw-source="YTM-LOGS.txt"'));
  assert.ok(doc.includes('Runtime behavior is unchanged'));
  assert.ok(doc.includes('not authority to change menu injection yet'));
});

test('raw YTM logs preserve stale playlist/menu identity evidence', () => {
  const raw = read(rawPath);

  assert.equal(raw.split(/\r?\n/).length, 8322);
  assert.equal(Buffer.byteLength(raw), 500222);
  assert.equal(sha256(raw), '6b7a29766c22cc167301fd63c2732e91bfebec2fc5fd19647960c432d0e7ac09');

  assert.equal(countLiteral(raw, 'KILL TONY'), 3);
  assert.equal(countLiteral(raw, '/@KillTony'), 6);
  assert.equal(countLiteral(raw, 'PLD8Xk89jYzqSAjDsjIfndRA1uZKzwIxm-'), 11);
  assert.equal(countLiteral(raw, 'UCWFKCr40YwOZQx8FHU_ZqqQ'), 2);
  assert.equal(countLiteral(raw, '@JerryRigEverything'), 2);
  assert.equal(countLiteral(raw, 'filtertube-block-channel-item'), 12);
  assert.equal(countLiteral(raw, 'data-filtertube-channel-id'), 18);
  assert.equal(countLiteral(raw, 'bottom-sheet-container'), 54);
  assert.equal(countLiteral(raw, 'yt-list-view-model'), 17);
  assert.equal(countLiteral(raw, 'bottom-sheet-media-menu-item'), 11);
  assert.equal(countLiteral(raw, 'schedulePostBlockEnrichment'), 5);
  assert.equal(countLiteral(raw, 'MutationObserver'), 5);
  assert.equal(countLiteral(raw, 'addEventListener'), 24);
  assert.equal(countLiteral(raw, 'setTimeout'), 21);
  assert.equal(countLiteral(raw, 'querySelector'), 184);
  assert.equal(countLiteral(raw, 'ytInitialData'), 33);
});

test('reduced YTM logs fixture preserves card owner, quick block, and observed bottom sheet', () => {
  const fixture = read(fixturePath);

  assert.equal(fixture.split(/\r?\n/).length, 125);
  assert.equal(Buffer.byteLength(fixture), 6093);
  assert.equal(sha256(fixture), 'e6c3cc399d41e4e255e59ff5dcfca064e1a52db82c207b7ed1712dcf239c92f4');

  assert.match(fixture, /<ytm-rich-item-renderer\b/);
  assert.match(fixture, /filtertube-quick-block-host/);
  assert.match(fixture, /data-filtertube-last-processed-mode="blocklist"/);
  assert.match(fixture, /PLD8Xk89jYzqSAjDsjIfndRA1uZKzwIxm-/);
  assert.match(fixture, />KILL TONY</);
  assert.match(fixture, /href="\/@KillTony"/);
  assert.match(fixture, /data-filtertube-channel-handle="@killtony"/);
  assert.match(fixture, /aria-label="More actions"/);
  assert.match(fixture, /<bottom-sheet-container\b[^>]*data-filtertube-observing="true"/);
  assert.match(fixture, /<yt-list-view-model\b[^>]*role="listbox"/);
  assert.match(fixture, /Not interested/);
  assert.match(fixture, /Share/);
});

test('reduced YTM logs fixture keeps injected menu identity separate from card identity', () => {
  const fixture = read(fixturePath);
  const cardStart = fixture.indexOf('<ytm-rich-item-renderer');
  const cardEnd = fixture.indexOf('</ytm-rich-item-renderer>');
  assert.notEqual(cardStart, -1);
  assert.notEqual(cardEnd, -1);
  const cardPart = fixture.slice(cardStart, cardEnd);
  const menuPart = fixture.slice(fixture.indexOf('<bottom-sheet-container'));

  assert.ok(cardPart.includes('data-filtertube-channel-handle="@killtony"'));
  assert.ok(cardPart.includes('/@KillTony'));
  assert.ok(cardPart.includes('KILL TONY'));
  assert.equal(cardPart.includes('UCWFKCr40YwOZQx8FHU_ZqqQ'), false);
  assert.equal(cardPart.includes('@JerryRigEverything'), false);

  assert.ok(menuPart.includes('data-filtertube-channel-id="UCWFKCr40YwOZQx8FHU_ZqqQ"'));
  assert.ok(menuPart.includes('data-filtertube-channel-handle=""'));
  assert.ok(menuPart.includes('Block * @JerryRigEverything'));
  assert.equal(menuPart.includes('/@KillTony'), false);
});

test('current source has YTM bottom-sheet/menu mechanics but no trigger-card identity authority', () => {
  const combined = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/dom_extractors.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  assert.match(combined, /bottom-sheet-container/);
  assert.match(combined, /filtertube-block-channel-item/);
  assert.match(combined, /filtertube-modern-bottom-sheet-item/);
  assert.match(combined, /schedulePostBlockEnrichment/);

  for (const symbol of futureAuthoritySymbols) {
    assert.doesNotMatch(combined, new RegExp(`\\b${symbol}\\b`));
  }
});

test('YTM logs stale identity future authority tokens remain audit-only', () => {
  const doc = read(docPath);
  const testSource = read('tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs');
  const productSource = [
    'js/content_bridge.js',
    'js/content/dom_extractors.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/injector.js'
  ].map(read).join('\n');

  for (const symbol of futureAuthoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing future symbol ${symbol}`);
    assert.ok(testSource.includes(symbol), `test should pin missing future symbol ${symbol}`);
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`), `${symbol} should not exist in runtime source yet`);
  }
});
