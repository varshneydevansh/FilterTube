import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const referenceRows = [
  ['docs/JSON_FIRST_FILTERING_PLAN.md', 580, 16595, '726394dc1c8108163228b82103e34c8f726ec96002aa87919b5a69101d47c1bb'],
  ['docs/json_paths_encyclopedia.md', 5003, 314988, '4e2cca8b1cac62d685d7597febfb151752158e1f3561de31854b81786c58ca05'],
  ['docs/watch_json_paths.md', 123, 7996, 'b56270d7a17987228e7b0e306d51374ddc64f834b25ab02b29df3ac52fc86f45'],
  ['docs/youtube_renderer_inventory.md', 780, 62792, '595b00612f4c8e9dd42259239ffdf942f09c654984d68decae5d8f2606a19dc7'],
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

function headingCounts(source) {
  return {
    h1: (source.match(/^# /gm) || []).length,
    h2: (source.match(/^## /gm) || []).length,
    h3: (source.match(/^### /gm) || []).length,
  };
}

function inlineCodeCount(source) {
  return (source.match(/`[^`]+`/g) || []).length;
}

function bracketIndexCount(source) {
  return (source.match(/\[[0-9]+\]/g) || []).length;
}

function dotIndexCount(source) {
  return (source.match(/\.[0-9]+(?=\.|$)/g) || []).length;
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', '.next'].includes(entry.name)) continue;
    const relative = path.join(dir, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      walkFiles(relative, files);
    } else if (entry.isFile() && /\.(js|jsx|mjs|json|html|css|md)$/.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
}

function productSources() {
  return [
    'build.js',
    'package.json',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    ...walkFiles('js'),
    ...walkFiles('scripts'),
    ...walkFiles('src'),
    ...walkFiles('html'),
    ...walkFiles('website').filter((file) => !file.includes('/node_modules/') && !file.includes('/.next/')),
  ].map(read).join('\n');
}

function escapeRegExp(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('JSON-first reference doc surface is audit-only and fingerprint pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /optimization and first-class JSON filter work/);
  assert.match(doc, /4 files, 6,486 newline\s+counts, and 402,371 bytes/);

  assert.equal(referenceRows.reduce((sum, [, lines]) => sum + lines, 0), 6486);
  assert.equal(referenceRows.reduce((sum, [, , bytes]) => sum + bytes, 0), 402371);

  for (const [file, lines, bytes, hash] of referenceRows) {
    assert.equal(newlineCount(file), lines, `${file} newline count drifted`);
    assert.equal(byteCount(file), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(escapeRegExp(file)));
    assert.match(doc, new RegExp(hash));
  }
});

test('JSON-first reference docs keep current heading token and path-syntax counts pinned', () => {
  const doc = read(docPath);
  const expected = {
    'docs/JSON_FIRST_FILTERING_PLAN.md': {
      h1: 1, h2: 15, h3: 23, inline: 167, jsonFirst: 3, renderer: 64, filterRules: 3, showSheet: 0, bracket: 0, dot: 0,
    },
    'docs/json_paths_encyclopedia.md': {
      h1: 12, h2: 0, h3: 22, inline: 637, jsonFirst: 0, renderer: 470, filterRules: 0, showSheet: 32, bracket: 264, dot: 54,
    },
    'docs/watch_json_paths.md': {
      h1: 1, h2: 5, h3: 4, inline: 89, jsonFirst: 0, renderer: 13, filterRules: 0, showSheet: 2, bracket: 14, dot: 0,
    },
    'docs/youtube_renderer_inventory.md': {
      h1: 1, h2: 15, h3: 45, inline: 566, jsonFirst: 0, renderer: 345, filterRules: 0, showSheet: 4, bracket: 1, dot: 29,
    },
  };

  for (const [file, counts] of Object.entries(expected)) {
    const source = read(file);
    assert.deepEqual(headingCounts(source), { h1: counts.h1, h2: counts.h2, h3: counts.h3 }, `${file} heading counts drifted`);
    assert.equal(inlineCodeCount(source), counts.inline, `${file} inline code count drifted`);
    assert.equal(count(source, 'JSON-first'), counts.jsonFirst, `${file} JSON-first count drifted`);
    assert.equal(count(source, 'renderer') + count(source, 'Renderer'), counts.renderer, `${file} renderer count drifted`);
    assert.equal(count(source, 'FILTER_RULES'), counts.filterRules, `${file} FILTER_RULES count drifted`);
    assert.equal(count(source, 'showSheetCommand'), counts.showSheet, `${file} showSheetCommand count drifted`);
    assert.equal(bracketIndexCount(source), counts.bracket, `${file} bracket-index count drifted`);
    assert.equal(dotIndexCount(source), counts.dot, `${file} dot-index count drifted`);
  }

  assert.match(doc, /264 bracket-index snippets, and 54 dot-index\s+snippets/);
  assert.match(doc, /1 \| 15 \| 23 \| 167 \| 3 \| 64 \| 3 \| 0 \| 0 \| 0/);
  assert.match(doc, /12 \| 0 \| 22 \| 637 \| 0 \| 470 \| 0 \| 32 \| 264 \| 54/);
});

test('JSON-first plan remains planning input and not runtime proof', () => {
  const plan = read('docs/JSON_FIRST_FILTERING_PLAN.md');
  const doc = read(docPath);
  const authorityPhrase = ['source', 'of', 'truth'].join(' ');

  assert.match(plan, /DOM filtering should remain as a safety net/);
  assert.match(plan, /Keep `FILTER_RULES`, but treat it as a path table feeding `buildCandidate\(\)`/);
  assert.match(plan, /active blocklist JSON-first pass/);
  assert.match(plan, /watch-page cost reduction pass/);
  assert.match(plan, /Android parity/);
  assert.ok(plan.includes(`Use \`docs/json_paths_encyclopedia.md\` as the ${authorityPhrase} for fields.`));

  assert.match(doc, /planning and rollout document/);
  assert.match(doc, /authority-style wording at line 205/);
  assert.match(doc, /Risk: a future patch can read this plan as approval/);
});

test('JSON path encyclopedia and watch paths remain evidence maps with syntax and identity warnings', () => {
  const encyclopedia = read('docs/json_paths_encyclopedia.md');
  const watchPaths = read('docs/watch_json_paths.md');
  const doc = read(docPath);

  assert.match(encyclopedia, /compactPlaylistRenderer/);
  assert.match(encyclopedia, /lockupViewModel/);
  assert.match(encyclopedia, /sharedPostRenderer/);
  assert.match(encyclopedia, /showSheetCommand/);
  assert.match(encyclopedia, /ytm-bottom-sheet-renderer/);
  assert.equal(bracketIndexCount(encyclopedia) > dotIndexCount(encyclopedia), true);

  assert.match(watchPaths, /videoSecondaryInfoRenderer/);
  assert.match(watchPaths, /compactVideoRenderer/);
  assert.match(watchPaths, /playlistPanelVideoRenderer/);
  assert.match(watchPaths, /showDialogCommand/);
  assert.match(watchPaths, /showSheetCommand/);
  assert.match(watchPaths, /do \*\*not\*\* mint a hard channel id from text/);

  assert.match(doc, /copying documented bracket-index paths into runtime dot-path rules can\s+silently fail/);
  assert.match(doc, /collaborator IDs can be missing in mix\/watch views/);
});

test('YouTube renderer inventory status wording is not direct runtime authority', () => {
  const inventory = read('docs/youtube_renderer_inventory.md');
  const doc = read(docPath);

  assert.equal(count(inventory, 'compactAutoplayRenderer'), 4);
  assert.equal(count(inventory, 'first-class'), 1);
  assert.match(inventory, /Covered/);
  assert.match(inventory, /IMPLEMENTED/);
  assert.match(inventory, /partial/i);
  assert.match(inventory, /missing/i);
  assert.match(inventory, /DOM-only/);
  assert.match(inventory, /Watch-Page Collaborator Recovery Matrix/);
  assert.match(inventory, /Subscribed-channels import renderers/);

  assert.match(doc, /historical status words such as covered, implemented, partial,\s+missing, verify, layout, and DOM-only/);
  assert.match(doc, /"covered" or "implemented" wording in this document can be mistaken for\s+direct `FILTER_RULES` support/);
});

test('JSON-first reference docs are not loaded by product runtime or build source', () => {
  const source = productSources();
  const doc = read(docPath);

  for (const file of [
    'docs/JSON_FIRST_FILTERING_PLAN.md',
    'docs/json_paths_encyclopedia.md',
    'docs/watch_json_paths.md',
    'docs/youtube_renderer_inventory.md',
  ]) {
    assert.equal(source.includes(file), false, `${file} should not be loaded by product source`);
  }

  assert.match(doc, /not loaded by product\s+runtime or build code/);
  assert.match(doc, /A documented JSON path is fixture source material/);
  assert.match(doc, /A renderer inventory status is a claim until current source and fixtures prove/);
});

test('JSON-first reference doc surface has no product authority symbols yet', () => {
  const doc = read(docPath);
  const source = productSources();

  for (const symbol of [
    'jsonReferenceDocSurfaceAuthority',
    'jsonReferenceDocRuntimeParityReport',
    'jsonReferenceDocFixtureProvenance',
    'jsonReferenceDocSyntaxClassifier',
    'jsonReferenceDocClaimGate',
    'jsonReferenceDocOptimizationGate',
    'jsonReferenceDocDeletionReadinessReport',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(source.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }

  assert.match(doc, /This register does not close tracked-doc obligations/);
  assert.match(doc, /dot-path generation or syntax conversion proof/);
  assert.match(doc, /metric artifacts before public performance claims are tightened/);
});
