import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'collab.html';
const fixturePath = 'tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html';
const blankAvatarFixturePath = 'tests/runtime/fixtures/captures/main-collab-homepage-avatar-stack.html';
const docPath = 'docs/audit/FILTERTUBE_MAIN_COLLAB_RESOLVED_SEARCH_CARD_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md';

const futureAuthorityTokens = [
  'mainCollabResolvedSearchCardContract',
  'mainCollabResolvedDialogRosterReport',
  'mainCollabResolvedDomStateReport',
  'mainCollabResolvedMenuActionPolicy',
  'mainCollabResolvedWhitelistPolicy',
  'mainCollabResolvedPendingBlockStateReport',
  'mainCollabResolvedSourceEffectBudget',
  'mainCollabResolvedSiblingVisibilityFixture',
  'mainCollabResolvedJsonFirstGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function lineCount(text) {
  const newlines = text.match(/\r?\n/g);
  return newlines ? newlines.length : 0;
}

function countToken(source, token) {
  return source.split(token).length - 1;
}

function attr(html, name) {
  const pattern = new RegExp(`${name}=(["'])([\\s\\S]*?)\\1`);
  const match = html.match(pattern);
  return match ? match[2] : null;
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/collab_dialog.js',
    'js/content/dom_extractors.js',
    'js/injector.js'
  ].map(read).join('\n');
}

test('Main collab resolved search-card audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = read(fixturePath);
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /resolved roster form also exists/);
  assert.match(doc, /not direct JSON and not clean pre-extension page markup/);
  assert.match(fixture, /Reduced from ignored raw capture: collab\.html/);

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('main-collab-resolved-search-card-dialog-current-behavior.test.mjs'));
    assert.ok(ledger.includes('main-collab-resolved-search-card-dialog.html'));
  }
});

test('raw collab.html resolved collaboration evidence is pinned', () => {
  const raw = read(rawPath);

  assert.equal(lineCount(raw), 2065);
  assert.equal(Buffer.byteLength(raw), 204819);
  assert.equal(sha256(rawPath), '6e4813758c6d9f1f770b3989a03d4c9008cdaac5bda053b159d4368043bb2a26');
  assert.equal(countToken(raw, 'data-filtertube-collaborators'), 1);
  assert.equal(countToken(raw, 'data-filtertube-blocked-state'), 1);
  assert.equal(countToken(raw, 'data-filtertube-collab-state'), 1);
  assert.equal(countToken(raw, 'yt-avatar-stack-view-model'), 20);
  assert.equal(countToken(raw, 'Collaboration channels'), 3);
  assert.equal(countToken(raw, 'tp-yt-paper-dialog'), 3);
  assert.equal(countToken(raw, 'href="/channel/'), 4);
  assert.equal(countToken(raw, 'aria-label="Action menu"'), 1);
  assert.equal(countToken(raw, 'aria-label="More actions"'), 2);
  assert.match(raw, /4 collab card from search page/);
  assert.match(raw, /collab card of 4 channel Collab/);
});

test('reduced collab search card preserves resolved roster and pending block marker', () => {
  const fixture = read(fixturePath);
  const roster = JSON.parse(attr(fixture, 'data-filtertube-collaborators'));

  assert.equal(attr(fixture, 'data-filtertube-video-id'), 'd95J8yzvjbQ');
  assert.equal(attr(fixture, 'data-filtertube-blocked-channel-id'), 'UCP7jMXSY2xbc3KCAE0MHQ-A');
  assert.equal(attr(fixture, 'data-filtertube-blocked-channel-handle'), '@googledeepmind');
  assert.equal(attr(fixture, 'data-filtertube-blocked-channel-name'), 'Google DeepMind');
  assert.equal(attr(fixture, 'data-filtertube-blocked-state'), 'pending');
  assert.equal(attr(fixture, 'data-filtertube-expected-collaborators'), '4');
  assert.equal(attr(fixture, 'data-filtertube-collab-state'), 'resolved');
  assert.deepEqual(roster.map(entry => entry.name), [
    'Google DeepMind',
    'The Thinking Game Film',
    'ROCO Films',
    'Reel As Dirt'
  ]);
  assert.deepEqual(roster.map(entry => entry.id), [
    'UCP7jMXSY2xbc3KCAE0MHQ-A',
    'UC0SOuDkpL6qpIF1o4wRhqRQ',
    'UCDf32-QfUZUiQZSSb1av4lw',
    'UCfBq6V0LDqDp2V37R1xfKUA'
  ]);
  assert.deepEqual(roster.map(entry => entry.handle), [
    '@googledeepmind',
    '@thethinkinggamefilm',
    '@rocofilms',
    '@reelasdirtofficial'
  ]);
});

test('reduced collab fixture preserves dialog roster links, avatar stack, and action menu', () => {
  const fixture = read(fixturePath);

  assert.match(fixture, /<ytd-video-renderer\b/);
  assert.match(fixture, /yt-avatar-stack-view-model/);
  assert.match(fixture, /aria-label="Collaboration channels"/);
  assert.match(fixture, /Google DeepMind and 3 more/);
  assert.match(fixture, /aria-label="Action menu"/);
  assert.match(fixture, /<tp-yt-paper-dialog\b/);
  assert.match(fixture, /<span role="text">Collaborators<\/span>/);
  assert.equal(countToken(fixture, 'href="/channel/'), 4);
  for (const token of [
    '/channel/UCP7jMXSY2xbc3KCAE0MHQ-A',
    '/channel/UC0SOuDkpL6qpIF1o4wRhqRQ',
    '/channel/UCDf32-QfUZUiQZSSb1av4lw',
    '/channel/UCfBq6V0LDqDp2V37R1xfKUA',
    '@googledeepmind',
    '@TheThinkingGameFilm',
    '@ROCOFilms',
    '@reelasdirtofficial'
  ]) {
    assert.ok(fixture.includes(token), `missing dialog token ${token}`);
  }
});

test('resolved collab fixture contrasts with blank-ID avatar-stack fixture', () => {
  const resolved = read(fixturePath);
  const blank = read(blankAvatarFixturePath);
  const resolvedRoster = JSON.parse(attr(resolved, 'data-filtertube-collaborators'));
  const blankRoster = JSON.parse(attr(blank, 'data-filtertube-collaborators'));

  assert.equal(resolvedRoster.length, 4);
  assert.equal(blankRoster.length, 2);
  assert.equal(resolvedRoster.every(entry => entry.id.startsWith('UC')), true);
  assert.equal(blankRoster.every(entry => entry.id === ''), true);
  assert.match(resolved, /data-filtertube-blocked-state="pending"/);
  assert.doesNotMatch(blank, /data-filtertube-blocked-state=/);
  assert.match(blank, /Veritasium and fern/);
  assert.match(resolved, /Google DeepMind and 3 more/);
});

test('Main collab resolved search-card future authority contracts are absent today', () => {
  const productSource = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `doc should name missing future token ${token}`);
    assert.equal(productSource.includes(token), false, `${token} should not exist in runtime source`);
  }

  assert.match(productSource, /data-filtertube-collaborators/);
  assert.match(productSource, /data-filtertube-collab-state/);
  assert.match(productSource, /FilterTube_CollabDialogData/);
});
