import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PLAYLIST_MIX_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const playlistFamilyDocs = [
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MAIN_COMPACT_RADIO_PLAYLIST_ID_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_MAIN_HOME_RICH_GRID_MIX_VIDEO_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_GET_WATCH_PLAYLIST_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_HTML_EMBEDDED_PLAYLIST_ENDSCREEN_JSON_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_TMP_PLAYLIST_COLLAB_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_PLAYLIST_JSON_PLAYER_METADATA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_PLAYLIST_MIX_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_PLAYLIST_PANEL_HEADER_MIX_CREATOR_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_PLAYLIST_PLAYER_ENDSCREEN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYLIST_PANEL_JSON_PARITY_CURRENT_BEHAVIOR_2026-05-23.md'
];

const authoritySymbols = [
  'playlistMixDomCleanupBoundaryContract',
  'playlistMixDomCleanupDecisionReport',
  'playlistMixDomCleanupRestoreProof',
  'playlistMixDomCleanupSelectorPolicy',
  'playlistMixDomCleanupTargetShapeReport',
  'playlistMixDomCleanupInteractionPolicy',
  'playlistMixDomCleanupStaleCleanupBudget',
  'playlistMixDomCleanupDisabledRestoreProof',
  'playlistMixDomCleanupMetricArtifact',
  'playlistMixDomCleanupJsonParityGate'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function sourceBlocks() {
  const source = read('js/content/dom_fallback.js');
  return {
    source,
    ensureBlock: sliceBetween(source, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons()'),
    playlistCssBlock: sliceBetween(source, '    if (settings.hidePlaylistCards) {', '\n\n    if (settings.hideMixPlaylists) {'),
    mixCssBlock: sliceBetween(source, '    if (settings.hideMixPlaylists) {', '\n\n    if (settings.hideMembersOnly) {'),
    directBlock: sliceBetween(
      source,
      '        if (effectiveSettings.hidePlaylistCards) {',
      '    } catch (e) {\n    }\n\n    if (effectiveSettings.enabled === false)'
    ),
    playlistDirectBlock: sliceBetween(
      source,
      '        if (effectiveSettings.hidePlaylistCards) {',
      '\n\n        if (effectiveSettings.hideMixPlaylists) {'
    ),
    mixChipDirectBlock: sliceBetween(
      source,
      '        if (effectiveSettings.hideMixPlaylists) {',
      '    } catch (e) {\n    }\n\n    if (effectiveSettings.enabled === false)'
    ),
    mixCardDecisionBlock: sliceBetween(
      source,
      '            if (effectiveSettings.hideMixPlaylists && isFilterTubeMixOrRadioElement(element)) {',
      '\n\n            const pendingMetaTtlMs = 8000;'
    ),
    explicitMarkerGuardBlock: sliceBetween(
      source,
      '                    const hasExplicitHiddenMarker = (() => {',
      '\n\n                    if (hasActiveListFilters'
    ),
    clearBlock: sliceBetween(source, 'function clearStaleDOMFallbackVisibility() {', '// DOM fallback function that processes already-rendered content'),
    disabledCleanupBlock: sliceBetween(
      source,
      '    if (effectiveSettings.enabled === false) {',
      '    // 1. Video/Content Filtering'
    )
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createTarget(name, { text = '', href = '' } = {}) {
  const attributes = new Map();
  const queryMap = new Map();
  const closestMap = new Map();
  const styleCalls = [];
  const removedProperties = [];
  const target = {
    name,
    textContent: text,
    attributes,
    queryMap,
    closestMap,
    styleCalls,
    removedProperties,
    style: {
      setProperty(property, value, priority) {
        styleCalls.push({ property, value, priority });
      },
      removeProperty(property) {
        removedProperties.push(property);
      }
    },
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      if (attribute === 'href' && href) return href;
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    removeAttribute(attribute) {
      attributes.delete(attribute);
    },
    querySelector(selector) {
      return queryMap.get(selector) || null;
    },
    closest(selector) {
      return closestMap.get(selector) || null;
    }
  };
  if (href) target.setAttribute('href', href);
  return target;
}

function createDocument(selectorMap) {
  return {
    selectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      return selectorMap.get(selector) || [];
    }
  };
}

function runDirectBlock(document, settings) {
  const { directBlock } = sourceBlocks();
  const sandbox = { document };
  vm.createContext(sandbox);
  vm.runInContext(`function runBlock(effectiveSettings) {\n${directBlock}\n}`, sandbox);
  sandbox.runBlock(settings);
}

function runMixCardDecision({ hideMixPlaylists, isMix }) {
  const { mixCardDecisionBlock } = sourceBlocks();
  const targetToHide = createTarget('mix-card-target');
  targetToHide.setAttribute('data-filtertube-hidden-by-mix-radio', 'old');
  const sandbox = {
    effectiveSettings: { hideMixPlaylists },
    element: createTarget('element'),
    targetToHide,
    title: 'Candidate Mix',
    shouldHide: false,
    hideReason: '',
    isFilterTubeMixOrRadioElement() {
      return isMix;
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(mixCardDecisionBlock, sandbox);
  return {
    shouldHide: sandbox.shouldHide,
    hideReason: sandbox.hideReason,
    marker: targetToHide.getAttribute('data-filtertube-hidden-by-mix-radio')
  };
}

function isHidden(target) {
  return target.styleCalls.some((call) => (
    call.property === 'display' &&
    call.value === 'none' &&
    call.priority === 'important'
  ));
}

test('playlist/Mix DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+selector\s+patch, cleanup patch/);
  assert.match(doc, /playlist\/Mix DOM cleanup boundary source files: 1/);
  assert.match(doc, /playlist\/Mix DOM cleanup boundary source\/effect blocks: 8/);
  assert.match(doc, /runtime playlist\/Mix DOM cleanup fixtures: 6/);

  assert.match(methodGap, /repo-wide lexical callables: 5830/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5830/);

  assert.equal(playlistFamilyDocs.length, 16);
  for (const familyDocPath of playlistFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5830/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5830/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('playlist/Mix DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 345, 12583],
    ['playlist-card CSS block', blocks.playlistCssBlock, 16, 998],
    ['Mix CSS block', blocks.mixCssBlock, 15, 588],
    ['playlist/Mix direct cleanup block', blocks.directBlock, 48, 2586],
    ['playlist-card direct block', blocks.playlistDirectBlock, 26, 1457],
    ['Mix chip direct block', blocks.mixChipDirectBlock, 21, 1127],
    ['Mix card decision block', blocks.mixCardDecisionBlock, 13, 564],
    ['explicit marker guard block', blocks.explicitMarkerGuardBlock, 18, 1301],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 21, 959]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.playlistCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(blocks.playlistCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(blocks.playlistCssBlock, 'start_radio=1'), 4);
  assert.equal(countLiteral(blocks.playlistCssBlock, 'yt-lockup-view-model'), 7);
  assert.equal(countLiteral(blocks.playlistCssBlock, 'ytd-shelf-renderer'), 1);
  assert.equal(countLiteral(blocks.playlistCssBlock, 'ytd-horizontal-list-renderer'), 1);
  assert.equal(countLiteral(blocks.mixCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(blocks.mixCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(blocks.mixCssBlock, 'start_radio=1'), 2);
  assert.equal(countLiteral(blocks.mixCssBlock, 'radio-renderer'), 6);
  assert.equal(countLiteral(blocks.mixCssBlock, 'yt-lockup-view-model'), 1);
  assert.equal(countLiteral(blocks.playlistDirectBlock, 'querySelectorAll'), 1);
  assert.equal(countLiteral(blocks.playlistDirectBlock, '.forEach'), 1);
  assert.equal(countLiteral(blocks.playlistDirectBlock, '.querySelector'), 4);
  assert.equal(countLiteral(blocks.playlistDirectBlock, 'start_radio=1'), 2);
  assert.equal(countLiteral(blocks.playlistDirectBlock, 'list='), 2);
  assert.equal(countLiteral(blocks.playlistDirectBlock, "style.setProperty('display', 'none', 'important')"), 3);
  assert.equal(countLiteral(blocks.playlistDirectBlock, "setAttribute('data-filtertube-hidden', 'true')"), 3);
  assert.equal(countLiteral(blocks.playlistDirectBlock, '.closest('), 2);
  assert.equal(countLiteral(blocks.playlistDirectBlock, 'removeProperty'), 0);
  assert.equal(countLiteral(blocks.playlistDirectBlock, 'removeAttribute'), 0);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, 'querySelectorAll'), 2);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, '.forEach'), 2);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, "style.setProperty('display', 'none', 'important')"), 1);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, "setAttribute('data-filtertube-hidden', 'true')"), 1);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, "style.removeProperty('display')"), 1);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, "removeAttribute('data-filtertube-hidden')"), 1);
  assert.equal(countLiteral(blocks.mixChipDirectBlock, "txt === 'mixes'"), 2);
  assert.equal(countLiteral(blocks.mixCardDecisionBlock, "setAttribute('data-filtertube-hidden-by-mix-radio', 'true')"), 1);
  assert.equal(countLiteral(blocks.mixCardDecisionBlock, "removeAttribute('data-filtertube-hidden-by-mix-radio')"), 1);
  assert.equal(countLiteral(blocks.explicitMarkerGuardBlock, 'data-filtertube-hidden-by-mix-radio'), 1);
  assert.equal(countLiteral(blocks.clearBlock, 'data-filtertube-hidden-by-mix-radio'), 0);
  assert.equal(countLiteral(blocks.disabledCleanupBlock, 'data-filtertube-hidden-by-mix-radio'), 0);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-hidden-by-mix-radio'), 3);

  assert.match(doc, /playlist CSS `start_radio=1` exclusions: 4/);
  assert.match(doc, /playlist direct restore callsites: 0/);
  assert.match(doc, /Mix card marker write callsites: 1/);
  assert.match(doc, /clear-stale cleanup Mix marker references: 0/);
  assert.match(doc, /disabled cleanup Mix marker references: 0/);
});

test('playlist direct cleanup hides non-radio collection lockups and containers only', () => {
  const valid = createTarget('valid-lockup');
  const shelf = createTarget('shelf');
  const horizontal = createTarget('horizontal');
  const radio = createTarget('radio-lockup');
  const missingStack = createTarget('missing-stack');
  const missingList = createTarget('missing-list');

  valid.queryMap.set('a[href*="start_radio=1"]', null);
  valid.queryMap.set('yt-collections-stack, yt-collection-thumbnail-view-model', createTarget('stack'));
  valid.queryMap.set('a[href*="list="]', createTarget('list-anchor', { href: '/watch?v=abc&list=PL123' }));
  valid.closestMap.set('ytd-shelf-renderer', shelf);
  valid.closestMap.set('ytd-horizontal-list-renderer', horizontal);
  radio.queryMap.set('a[href*="start_radio=1"]', createTarget('radio-anchor', { href: '/watch?v=abc&start_radio=1' }));
  missingStack.queryMap.set('a[href*="start_radio=1"]', null);
  missingStack.queryMap.set('yt-collections-stack, yt-collection-thumbnail-view-model', null);
  missingList.queryMap.set('a[href*="start_radio=1"]', null);
  missingList.queryMap.set('yt-collections-stack, yt-collection-thumbnail-view-model', createTarget('stack'));
  missingList.queryMap.set('a[href*="list="]', null);

  const document = createDocument(new Map([
    ['yt-lockup-view-model.yt-lockup-view-model--collection-stack-2', [valid, radio, missingStack, missingList]],
    ['yt-chip-cloud-chip-renderer[data-filtertube-hidden]', []]
  ]));

  runDirectBlock(document, { hidePlaylistCards: true, hideMixPlaylists: false });

  assert.equal(isHidden(valid), true);
  assert.equal(isHidden(shelf), true);
  assert.equal(isHidden(horizontal), true);
  assert.equal(valid.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(shelf.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(horizontal.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(isHidden(radio), false);
  assert.equal(isHidden(missingStack), false);
  assert.equal(isHidden(missingList), false);
});

test('Mix chip direct cleanup hides and restores only normalized Mixes chips', () => {
  const mixChip = createTarget('mix-chip', { text: '  Mixes  ' });
  const safeChip = createTarget('safe-chip', { text: 'Music' });
  const hideDocument = createDocument(new Map([
    ['yt-lockup-view-model.yt-lockup-view-model--collection-stack-2', []],
    ['yt-chip-cloud-chip-renderer', [mixChip, safeChip]]
  ]));

  runDirectBlock(hideDocument, { hidePlaylistCards: true, hideMixPlaylists: true });

  assert.equal(isHidden(mixChip), true);
  assert.equal(mixChip.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(isHidden(safeChip), false);

  const restoredMixChip = createTarget('restored-mix-chip', { text: 'Mixes' });
  const restoredSafeChip = createTarget('restored-safe-chip', { text: 'Music' });
  restoredMixChip.setAttribute('data-filtertube-hidden', 'true');
  restoredSafeChip.setAttribute('data-filtertube-hidden', 'true');
  const restoreDocument = createDocument(new Map([
    ['yt-lockup-view-model.yt-lockup-view-model--collection-stack-2', []],
    ['yt-chip-cloud-chip-renderer[data-filtertube-hidden]', [restoredMixChip, restoredSafeChip]]
  ]));

  runDirectBlock(restoreDocument, { hidePlaylistCards: true, hideMixPlaylists: false });

  assert.deepEqual(restoredMixChip.removedProperties, ['display']);
  assert.equal(restoredMixChip.getAttribute('data-filtertube-hidden'), null);
  assert.deepEqual(restoredSafeChip.removedProperties, []);
  assert.equal(restoredSafeChip.getAttribute('data-filtertube-hidden'), 'true');
});

test('Mix card marker is set and removed only in the per-card decision path', () => {
  const hidden = runMixCardDecision({ hideMixPlaylists: true, isMix: true });
  assert.equal(hidden.shouldHide, true);
  assert.equal(hidden.hideReason, 'Mix/radio hidden: Candidate Mix');
  assert.equal(hidden.marker, 'true');

  const restored = runMixCardDecision({ hideMixPlaylists: false, isMix: true });
  assert.equal(restored.shouldHide, false);
  assert.equal(restored.hideReason, '');
  assert.equal(restored.marker, null);
});

test('playlist/Mix specialized marker is omitted by stale and disabled cleanup branches', () => {
  const doc = read(docPath);
  const { explicitMarkerGuardBlock, clearBlock, disabledCleanupBlock, source } = sourceBlocks();

  assert.equal(countLiteral(explicitMarkerGuardBlock, 'data-filtertube-hidden-by-mix-radio'), 1);
  assert.equal(countLiteral(clearBlock, 'data-filtertube-hidden-by-mix-radio'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-hidden-by-mix-radio'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-hidden-by-mix-radio'), 3);
  assert.match(clearBlock, /\[data-filtertube-hidden\]/);
  assert.match(disabledCleanupBlock, /\[data-filtertube-hidden\]/);
  assert.match(doc, /Generic stale cleanup does not clear `data-filtertube-hidden-by-mix-radio`/);
  assert.match(doc, /Disabled mode does not prove specialized Mix marker cleanup/);
});

test('playlist/Mix DOM cleanup boundary records missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(`\\b${symbol}\\b`), `doc missing ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${symbol}\\b`), `runtime should not define ${symbol}`);
  }
});
