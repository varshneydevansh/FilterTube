import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'watchPlaylistPanelDomCleanupBoundaryContract',
  'watchPlaylistPanelDomCleanupDecisionReport',
  'watchPlaylistPanelDomCleanupStyleSelectorPolicy',
  'watchPlaylistPanelDomCleanupTargetShapeReport',
  'watchPlaylistPanelDomCleanupRoutePolicy',
  'watchPlaylistPanelDomCleanupPanelSurfaceReport',
  'watchPlaylistPanelDomCleanupRestoreProof',
  'watchPlaylistPanelDomCleanupStaleCleanupBudget',
  'watchPlaylistPanelDomCleanupDisabledRestoreProof',
  'watchPlaylistPanelDomCleanupMetricArtifact',
  'watchPlaylistPanelDomCleanupJsonParityGate'
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

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
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
    watchPlaylistCssBlock: sliceBetween(
      source,
      '    if (settings.hideWatchPlaylistPanel) {',
      '\n\n    if (settings.hidePlaylistCards) {'
    ),
    activeBlock: sliceBetween(source, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility()'),
    noActiveCleanupBlock: sliceBetween(
      source,
      '    const hasActiveFallbackWork = hasActiveDOMFallbackWork(effectiveSettings);',
      '    try {\n        const state = window.__filtertubeDomFallbackPerfState'
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

function createFakeElement(tagName) {
  const attributes = new Map();
  return {
    tagName: tagName.toUpperCase(),
    id: '',
    textContent: '',
    attributes,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    }
  };
}

function createDocument({ pathname = '/watch' } = {}) {
  const elements = new Map();
  const documentElement = createFakeElement('html');
  const fakeHead = {
    appended: [],
    appendChild(element) {
      this.appended.push(element);
      if (element.id) elements.set(element.id, element);
      element.parentNode = this;
      return element;
    }
  };

  return {
    head: fakeHead,
    documentElement,
    location: { pathname },
    createElement: createFakeElement,
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll() {
      return [];
    },
    __elements: elements
  };
}

function runEnsure(settings, { document = createDocument(), supportsHasSelector = true } = {}) {
  const { ensureBlock } = sourceBlocks();
  const sandbox = {
    document,
    CSS: {
      supports(query) {
        sandbox.__supportsQueries.push(query);
        return supportsHasSelector;
      }
    },
    __openAppCalls: 0,
    __supportsQueries: [],
    hideYouTubeOpenAppButtons() {
      sandbox.__openAppCalls += 1;
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(ensureBlock, sandbox);
  sandbox.ensureContentControlStyles(settings);
  return sandbox;
}

function styleText(document) {
  const style = document.__elements.get('filtertube-content-controls-style');
  assert.ok(style, 'expected shared content-control style element');
  return style.textContent;
}

test('watch playlist panel DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /watch-playlist-panel DOM cleanup boundary source files: 1/);
  assert.match(doc, /watch-playlist-panel DOM cleanup source\/effect blocks: 6/);
  assert.match(doc, /runtime watch-playlist-panel DOM cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('watch playlist panel DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const {
    source,
    ensureBlock,
    watchPlaylistCssBlock,
    activeBlock,
    noActiveCleanupBlock,
    clearBlock,
    disabledCleanupBlock
  } = sourceBlocks();

  assert.equal(lineCount(ensureBlock), 345);
  assert.equal(Buffer.byteLength(ensureBlock), 12583);
  assert.equal(lineCount(watchPlaylistCssBlock), 9);
  assert.equal(Buffer.byteLength(watchPlaylistCssBlock), 264);
  assert.equal(lineCount(activeBlock), 68);
  assert.equal(Buffer.byteLength(activeBlock), 2333);
  assert.equal(lineCount(noActiveCleanupBlock), 14);
  assert.equal(Buffer.byteLength(noActiveCleanupBlock), 629);
  assert.equal(lineCount(clearBlock), 33);
  assert.equal(Buffer.byteLength(clearBlock), 1412);
  assert.equal(lineCount(disabledCleanupBlock), 21);
  assert.equal(Buffer.byteLength(disabledCleanupBlock), 959);

  assert.equal(countLiteral(watchPlaylistCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(watchPlaylistCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(watchPlaylistCssBlock, 'ytd-playlist-panel-renderer,'), 1);
  assert.equal(countLiteral(watchPlaylistCssBlock, 'ytm-playlist-panel-renderer,'), 1);
  assert.equal(countLiteral(watchPlaylistCssBlock, 'ytm-playlist-panel-renderer-v2'), 1);
  assert.equal(countLiteral(ensureBlock, 'hideWatchPlaylistPanel'), 1);
  assert.equal(countLiteral(ensureBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(ensureBlock, 'hideYouTubeOpenAppButtons()'), 1);
  assert.equal(countLiteral(activeBlock, "'hideWatchPlaylistPanel'"), 1);
  assert.equal(countLiteral(clearBlock, 'hideWatchPlaylistPanel'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'hideWatchPlaylistPanel'), 0);
  assert.equal(countLiteral(clearBlock, 'data-filtertube-hidden-by-hide-watch-playlist-panel'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-hidden-by-hide-watch-playlist-panel'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-hidden-by-hide-watch-playlist-panel'), 0);
  assert.equal(countLiteral(source, 'hideWatchPlaylistPanel'), 2);
  assert.equal(countLiteral(source, 'ytd-playlist-panel-renderer'), 2);
  assert.equal(countLiteral(source, 'ytm-playlist-panel-renderer'), 4);
  assert.equal(countLiteral(source, 'ytm-playlist-panel-renderer-v2'), 2);
  assert.equal(countLiteral(source, 'hidePlaylistCards'), 3);

  assert.match(doc, /watch-playlist-panel CSS block lines: 9/);
  assert.match(doc, /watch-playlist-panel CSS block bytes: 264/);
  assert.match(doc, /watch-playlist-panel CSS selector rows: 3/);
  assert.match(doc, /clear-stale cleanup watch-playlist-panel marker references: 0/);
  assert.match(doc, /disabled cleanup watch-playlist-panel marker references: 0/);
  assert.match(doc, /product runtime watch-playlist-panel marker references: 0/);
});

test('watch playlist panel CSS branch writes panel selectors route attributes and open-app cleanup coupling', () => {
  const document = createDocument({ pathname: '/watch' });
  const sandbox = runEnsure({ hideWatchPlaylistPanel: true }, { document });
  const css = styleText(document);

  assert.equal(document.documentElement.getAttribute('data-filtertube-route-home'), 'false');
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'true');
  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.match(css, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.match(css, /ytd-playlist-panel-renderer/);
  assert.match(css, /ytm-playlist-panel-renderer,/);
  assert.match(css, /ytm-playlist-panel-renderer-v2/);
  assert.doesNotMatch(css, /ytd-ad-slot-renderer/);
  assert.doesNotMatch(css, /ytd-playlist-renderer/);
  assert.equal(countLiteral(css, 'display: none !important'), 2);
});

test('watch playlist panel style restore is shared style regeneration without feature-local marker cleanup', () => {
  const document = createDocument({ pathname: '/watch' });
  runEnsure({ hideWatchPlaylistPanel: true }, { document });
  const initialStyle = document.__elements.get('filtertube-content-controls-style');

  assert.match(initialStyle.textContent, /ytd-playlist-panel-renderer/);
  assert.equal(document.head.appended.length, 1);

  const sandbox = runEnsure({ hideWatchPlaylistPanel: false }, { document });
  const rewrittenStyle = document.__elements.get('filtertube-content-controls-style');

  assert.equal(rewrittenStyle, initialStyle);
  assert.equal(document.head.appended.length, 1);
  assert.doesNotMatch(rewrittenStyle.textContent, /ytd-playlist-panel-renderer/);
  assert.doesNotMatch(rewrittenStyle.textContent, /ytm-playlist-panel-renderer-v2/);
  assert.match(rewrittenStyle.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.equal(sandbox.__openAppCalls, 1);
});

test('watch playlist panel CSS remains enabled in whitelist mode and without has selector support', () => {
  const whitelistDocument = createDocument({ pathname: '/watch' });
  runEnsure({ hideWatchPlaylistPanel: true, listMode: 'whitelist' }, { document: whitelistDocument });
  const whitelistCss = styleText(whitelistDocument);

  assert.match(whitelistCss, /ytd-playlist-panel-renderer/);
  assert.match(whitelistCss, /ytm-playlist-panel-renderer-v2/);

  const noHasDocument = createDocument({ pathname: '/watch' });
  const sandbox = runEnsure(
    { hideWatchPlaylistPanel: true, hidePlaylistCards: true },
    { document: noHasDocument, supportsHasSelector: false }
  );
  const noHasCss = styleText(noHasDocument);

  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.match(noHasCss, /ytd-playlist-panel-renderer/);
  assert.match(noHasCss, /ytm-playlist-panel-renderer-v2/);
  assert.match(noHasCss, /yt-lockup-view-model:has\(yt-collections-stack\)/);
});

test('watch playlist panel DOM cleanup boundary records marker omissions and missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const { source, clearBlock, disabledCleanupBlock } = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.equal(source.includes('data-filtertube-hidden-by-hide-watch-playlist-panel'), false);
  assert.equal(clearBlock.includes('data-filtertube-hidden-by-hide-watch-playlist-panel'), false);
  assert.equal(disabledCleanupBlock.includes('data-filtertube-hidden-by-hide-watch-playlist-panel'), false);
  assert.match(doc, /style-owned rather than a JSON watch-next panel decision or marker-owned DOM decision/);
  assert.match(doc, /Restore is a full style regeneration effect, not a per-node marker restore/);
  assert.match(doc, /Watch playlist panel style refresh also triggers unrelated mobile app-shell cleanup work/);
  assert.match(doc, /Whitelist behavior requires explicit policy/);
  assert.match(doc, /There is no feature-local stale cleanup budget/);
  assert.match(doc, /Turning the extension off relies on shared style blanking/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
