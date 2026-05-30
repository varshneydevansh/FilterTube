import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'YT_MAIN_WATCH.html';
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_HTML_ENDSCREEN_SHAPE_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md';

const playerDomTokens = [
  'ytp-endscreen-content',
  'ytp-ce-element',
  'ytp-fullscreen-grid-stills-container',
  'ytp-videowall-still',
  'ytp-ce-video',
  'ytp-ce-playlist',
  'ytp-ce-channel',
  'autonav-endscreen',
  'data-filtertube',
  'filtertube-'
];

const futureAuthorityTokens = [
  'mainWatchHtmlEndscreenShapeClassificationContract',
  'mainWatchRenderedEndscreenDomWallFixtureGate',
  'mainWatchPlayerOverlayJsonDomParityReport',
  'mainWatchEndscreenDomSiblingVisibleReport',
  'mainWatchEndscreenDomWhitelistModeReport',
  'mainWatchEndscreenDomNoPlaybackSideEffectReport',
  'mainWatchEndscreenDomOptimizationBudget'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function extractAssignedObjects(raw, name) {
  const needle = `var ${name} = `;
  const objects = [];
  let searchFrom = 0;

  while (true) {
    const assignmentIndex = raw.indexOf(needle, searchFrom);
    if (assignmentIndex === -1) break;

    let start = assignmentIndex + needle.length;
    while (/\s/.test(raw[start])) start += 1;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let index = start; index < raw.length; index += 1) {
      const char = raw[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    assert.notEqual(end, -1, `could not find object end for ${name}`);
    const text = raw.slice(start, end);
    objects.push({
      start,
      end,
      text,
      object: JSON.parse(text)
    });
    searchFrom = end;
  }

  return objects;
}

function keyPaths(value, key, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => keyPaths(entry, key, `${prefix}[${index}]`));
  }

  if (!value || typeof value !== 'object') return [];

  const paths = [];
  for (const [childKey, childValue] of Object.entries(value)) {
    const nextPath = prefix ? `${prefix}.${childKey}` : childKey;
    if (childKey === key) paths.push(nextPath);
    paths.push(...keyPaths(childValue, key, nextPath));
  }
  return paths;
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

function productRuntimeSource() {
  return [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/settings_shared.js'
  ].map(read).join('\n');
}

test('raw YT_MAIN_WATCH.html metadata and token counts are pinned', () => {
  const raw = read(rawPath);

  assert.equal(lineCount(raw), 69613);
  assert.equal(Buffer.byteLength(raw), 7873780);
  assert.equal(sha256(rawPath), '3d6de64dc55e211790c1b555d90420fb6bdb47104cb7c38cb903a3dbc966160c');
  assert.equal(countLiteral(raw, 'var ytInitialData = '), 2);
  assert.equal(countLiteral(raw, 'var ytInitialPlayerResponse = '), 2);
  assert.equal(countLiteral(raw, '"rootElementId": "movie_player"'), 2);
  assert.equal(countLiteral(raw, 'endScreenVideoRenderer'), 21);
  assert.equal(countLiteral(raw, 'watchNextEndScreenRenderer'), 4);
  assert.equal(countLiteral(raw, 'playerOverlayRenderer'), 4);
  assert.equal(countLiteral(raw, 'playlistPanelVideoRenderer'), 27);
  assert.equal(countLiteral(raw, 'compactAutoplayRenderer'), 0);
  assert.equal(countLiteral(raw, 'shortsLockupViewModel'), 2);

  for (const token of playerDomTokens) {
    assert.equal(countLiteral(raw, token), 0, `${token} should be absent from raw Main watch HTML`);
  }
});

test('embedded ytInitialData objects classify as JSON evidence rather than DOM wall proof', () => {
  const raw = read(rawPath);
  const initialData = extractAssignedObjects(raw, 'ytInitialData');
  const playerResponses = extractAssignedObjects(raw, 'ytInitialPlayerResponse');

  assert.equal(initialData.length, 2);
  assert.equal(playerResponses.length, 2);
  assert.deepEqual(initialData.map(({ start, end, text }) => ({ start, end, bytes: Buffer.byteLength(text) })), [
    { start: 920557, end: 3631119, bytes: 2714517 },
    { start: 4505651, end: 7857979, bytes: 3356005 }
  ]);

  const first = initialData[0].object;
  const second = initialData[1].object;

  assert.deepEqual(keyPaths(first, 'watchNextEndScreenRenderer'), [
    'playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer'
  ]);
  assert.equal(keyPaths(first, 'endScreenVideoRenderer').length, 7);
  assert.equal(keyPaths(first, 'endScreenPlaylistRenderer').length, 5);
  assert.equal(keyPaths(first, 'playlistPanelVideoRenderer').length, 0);
  assert.equal(keyPaths(first, 'compactAutoplayRenderer').length, 0);
  assert.equal(keyPaths(first, 'shortsLockupViewModel').length, 0);

  assert.deepEqual(keyPaths(second, 'watchNextEndScreenRenderer'), [
    'playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer'
  ]);
  assert.equal(keyPaths(second, 'endScreenVideoRenderer').length, 12);
  assert.equal(keyPaths(second, 'endScreenPlaylistRenderer').length, 0);
  assert.equal(keyPaths(second, 'playlistPanelVideoRenderer').length, 26);
  assert.equal(keyPaths(second, 'compactAutoplayRenderer').length, 0);
  assert.equal(keyPaths(second, 'shortsLockupViewModel').length, 1);

  for (const response of playerResponses) {
    assert.equal(keyPaths(response.object, 'endScreenVideoRenderer').length, 0);
    assert.equal(keyPaths(response.object, 'playlistPanelVideoRenderer').length, 0);
  }
});

test('product source still splits JSON end-screen rules from broad player DOM CSS', () => {
  const raw = read(rawPath);
  const filter = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const directRules = sliceBetween(filter, 'const FILTER_RULES = {', 'videoWithContextRenderer: {');
  const nestedKeys = sliceBetween(filter, 'const knownKeys = [', '];');
  const endscreenCss = sliceBetween(domFallback, 'if (settings.hideEndscreenVideowall) {', 'if (settings.hideTopHeader) {');

  assert.match(directRules, /endScreenVideoRenderer: BASE_VIDEO_RULES/);
  assert.doesNotMatch(directRules, /compactAutoplayRenderer/);
  assert.match(nestedKeys, /endScreenVideoRenderer/);
  assert.doesNotMatch(nestedKeys, /compactAutoplayRenderer/);
  assert.match(endscreenCss, /#movie_player \.ytp-endscreen-content/);
  assert.match(endscreenCss, /#movie_player \.ytp-fullscreen-grid-stills-container/);
  assert.match(endscreenCss, /#movie_player \.ytp-ce-element/);
  assert.match(endscreenCss, /\.autonav-endscreen/);

  for (const token of [
    'ytp-endscreen-content',
    'ytp-fullscreen-grid-stills-container',
    'ytp-ce-element',
    'autonav-endscreen'
  ]) {
    assert.equal(countLiteral(raw, token), 0, `${token} is product CSS but not raw capture DOM evidence`);
  }
});

test('classification doc and ledgers keep Main watch DOM wall incomplete', () => {
  const doc = read(docPath);
  const captureTraceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const stabilization = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');
  const objective = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const tracked = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  for (const phrase of [
    'embedded JSON shape evidence',
    'Main watch DOM wall fixture',
    'player DOM end-screen selector tokens: 0',
    'compactAutoplayRenderer tokens: 0',
    'does not close Main watch/player end-screen DOM coverage',
    'sibling-visible',
    'no synthetic click',
    'no playback transition'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }

  for (const ledger of [
    captureTraceability,
    rawIndex,
    runtimeResults,
    convergence,
    stabilization,
    objective,
    activeGoal,
    tracked
  ]) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('main-watch-html-endscreen-shape-classification-current-behavior.test.mjs'));
    assert.match(ledger, /embedded JSON/);
    assert.match(ledger, /DOM wall/);
  }
});

test('future Main watch DOM wall authority is absent from runtime source today', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
