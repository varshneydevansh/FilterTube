import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PLAYER_ENDSCREEN_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const playerKeys = [
  'hideEndscreenVideowall',
  'hideEndscreenCards',
  'disableAutoplay',
  'disableAnnotations'
];

const activePlayerKeys = [
  'hideEndscreenVideowall',
  'hideEndscreenCards'
];

const inactivePlayerKeys = [
  'disableAutoplay',
  'disableAnnotations'
];

const playerMarkers = [
  'data-filtertube-hidden-by-hide-endscreen-videowall',
  'data-filtertube-hidden-by-hide-endscreen-cards',
  'data-filtertube-hidden-by-disable-autoplay',
  'data-filtertube-hidden-by-disable-annotations'
];

const authoritySymbols = [
  'playerEndscreenDomCleanupBoundaryContract',
  'playerEndscreenDomCleanupDecisionReport',
  'playerEndscreenDomCleanupStyleSelectorPolicy',
  'playerEndscreenDomCleanupTargetShapeReport',
  'playerEndscreenDomCleanupActiveWorkPolicy',
  'playerEndscreenDomCleanupAutoplayPolicy',
  'playerEndscreenDomCleanupAnnotationPolicy',
  'playerEndscreenDomCleanupRestoreProof',
  'playerEndscreenDomCleanupStaleCleanupBudget',
  'playerEndscreenDomCleanupDisabledRestoreProof',
  'playerEndscreenDomCleanupMetricArtifact',
  'playerEndscreenDomCleanupJsonParityGate'
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
  const ensureBlock = sliceBetween(source, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons()');
  return {
    source,
    ensureBlock,
    playerGroupBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideEndscreenVideowall) {',
      '\n\n    if (settings.hideTopHeader) {'
    ),
    endscreenVideowallCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideEndscreenVideowall) {',
      '\n\n    if (settings.hideEndscreenCards) {'
    ),
    endscreenCardsCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideEndscreenCards) {',
      '\n\n    if (settings.disableAutoplay) {'
    ),
    disableAutoplayCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.disableAutoplay) {',
      '\n\n    if (settings.disableAnnotations) {'
    ),
    disableAnnotationsCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.disableAnnotations) {',
      '\n\n    if (settings.hideTopHeader) {'
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

function runActiveWork(settings) {
  const { activeBlock } = sourceBlocks();
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(activeBlock, sandbox);
  return sandbox.hasActiveDOMFallbackWork(settings);
}

function styleText(document) {
  const style = document.__elements.get('filtertube-content-controls-style');
  assert.ok(style, 'expected shared content-control style element');
  return style.textContent;
}

function assertPlayerSelectors(css, { present }) {
  const matcher = present ? assert.match : assert.doesNotMatch;
  matcher(css, /#movie_player \.ytp-endscreen-content/);
  matcher(css, /#movie_player \.ytp-fullscreen-grid-stills-container/);
  matcher(css, /#movie_player \.ytp-ce-element/);
  matcher(css, /button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]/);
  matcher(css, /\.autonav-endscreen/);
  matcher(css, /\.annotation/);
  matcher(css, /\.iv-branding/);
}

test('player/end-screen DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /player\/end-screen DOM cleanup boundary source files: 1/);
  assert.match(doc, /player\/end-screen DOM cleanup source\/effect blocks: 9/);
  assert.match(doc, /runtime player\/end-screen DOM cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('player/end-screen DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 345, 12583],
    ['player/end-screen CSS group block', blocks.playerGroupBlock, 34, 856],
    ['endscreen videowall CSS block', blocks.endscreenVideowallCssBlock, 8, 253],
    ['endscreen cards CSS block', blocks.endscreenCardsCssBlock, 7, 177],
    ['disable autoplay CSS block', blocks.disableAutoplayCssBlock, 8, 235],
    ['disable annotations CSS block', blocks.disableAnnotationsCssBlock, 8, 185],
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 21, 959]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
  }

  assert.equal(countLiteral(blocks.playerGroupBlock, 'rules.push'), 4);
  assert.equal(countLiteral(blocks.playerGroupBlock, 'display: none !important'), 4);
  assert.equal(countLiteral(blocks.playerGroupBlock, '#movie_player .ytp-endscreen-content'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, '#movie_player .ytp-fullscreen-grid-stills-container'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, '#movie_player .ytp-ce-element'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, 'button[data-tooltip-target-id="ytp-autonav-toggle-button"]'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, '.autonav-endscreen'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, '.annotation'), 1);
  assert.equal(countLiteral(blocks.playerGroupBlock, '.iv-branding'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'hideYouTubeOpenAppButtons()'), 1);

  for (const key of activePlayerKeys) {
    assert.equal(countLiteral(blocks.activeBlock, `'${key}'`), 1);
    assert.equal(countLiteral(blocks.clearBlock, key), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, key), 0);
    assert.equal(countLiteral(blocks.source, key), 2);
  }
  for (const key of inactivePlayerKeys) {
    assert.equal(countLiteral(blocks.activeBlock, `'${key}'`), 0);
    assert.equal(countLiteral(blocks.clearBlock, key), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, key), 0);
    assert.equal(countLiteral(blocks.source, key), 1);
  }
  for (const marker of playerMarkers) {
    assert.equal(countLiteral(blocks.source, marker), 0);
    assert.equal(countLiteral(blocks.clearBlock, marker), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, marker), 0);
  }

  assert.match(doc, /player\/end-screen CSS group block lines: 34/);
  assert.match(doc, /player\/end-screen CSS group block bytes: 856/);
  assert.match(doc, /player\/end-screen CSS group selector rows: 7/);
  assert.match(doc, /active DOM fallback hideEndscreenVideowall references: 1/);
  assert.match(doc, /active DOM fallback hideEndscreenCards references: 1/);
  assert.match(doc, /active DOM fallback disableAutoplay references: 0/);
  assert.match(doc, /active DOM fallback disableAnnotations references: 0/);
  assert.match(doc, /clear-stale cleanup player\/end-screen flag references: 0/);
  assert.match(doc, /disabled cleanup player\/end-screen flag references: 0/);
  assert.match(doc, /product runtime player\/end-screen feature marker references: 0/);
});

test('all player/end-screen controls emit current CSS selectors when the style writer runs', () => {
  const document = createDocument({ pathname: '/watch' });
  const sandbox = runEnsure({
    hideEndscreenVideowall: true,
    hideEndscreenCards: true,
    disableAutoplay: true,
    disableAnnotations: true
  }, { document });
  const css = styleText(document);

  assert.equal(document.documentElement.getAttribute('data-filtertube-route-home'), 'false');
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'true');
  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.match(css, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assertPlayerSelectors(css, { present: true });
  assert.equal(countLiteral(css, 'display: none !important'), 5);
});

test('disable autoplay and annotations can write CSS directly but are not blocklist active-work keys', () => {
  const document = createDocument({ pathname: '/watch' });
  runEnsure({
    disableAutoplay: true,
    disableAnnotations: true
  }, { document });
  const css = styleText(document);

  assert.match(css, /button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]/);
  assert.match(css, /\.autonav-endscreen/);
  assert.match(css, /\.annotation/);
  assert.match(css, /\.iv-branding/);
  assert.equal(countLiteral(css, 'display: none !important'), 3);

  assert.equal(runActiveWork({ disableAutoplay: true }), false);
  assert.equal(runActiveWork({ disableAnnotations: true }), false);
  assert.equal(runActiveWork({ disableAutoplay: true, disableAnnotations: true }), false);
  assert.equal(runActiveWork({ hideEndscreenVideowall: true }), true);
  assert.equal(runActiveWork({ hideEndscreenCards: true }), true);
  assert.equal(runActiveWork({ listMode: 'whitelist', disableAutoplay: true }), true);
  assert.equal(runActiveWork({ enabled: false, hideEndscreenCards: true }), false);
});

test('player/end-screen selector restore is shared style regeneration', () => {
  const document = createDocument({ pathname: '/watch' });
  runEnsure({
    hideEndscreenVideowall: true,
    hideEndscreenCards: true,
    disableAutoplay: true,
    disableAnnotations: true
  }, { document });
  const initialStyle = document.__elements.get('filtertube-content-controls-style');
  assertPlayerSelectors(initialStyle.textContent, { present: true });

  const sandbox = runEnsure({}, { document });
  const rewrittenStyle = document.__elements.get('filtertube-content-controls-style');

  assert.equal(rewrittenStyle, initialStyle);
  assert.equal(document.head.appended.length, 1);
  assertPlayerSelectors(rewrittenStyle.textContent, { present: false });
  assert.match(rewrittenStyle.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.equal(countLiteral(rewrittenStyle.textContent, 'display: none !important'), 1);
  assert.equal(sandbox.__openAppCalls, 1);
});

test('player/end-screen DOM cleanup boundary records marker omissions and missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const { clearBlock, disabledCleanupBlock } = sourceBlocks();
  const runtime = productRuntimeSource();

  for (const marker of playerMarkers) {
    assert.equal(runtime.includes(marker), false);
    assert.equal(clearBlock.includes(marker), false);
    assert.equal(disabledCleanupBlock.includes(marker), false);
  }

  assert.match(doc, /Only the two `hideEndscreen\*` flags keep DOM fallback active in blocklist mode/);
  assert.match(doc, /Autoplay CSS can be skipped by ordinary blocklist no-active short-circuit/);
  assert.match(doc, /Annotation CSS has the same no-active short-circuit risk as autoplay CSS/);
  assert.match(doc, /Restore is full shared style regeneration or stale-style blanking/);
  assert.match(doc, /There is no feature-local stale cleanup budget/);
  assert.match(doc, /Turning the extension off relies on shared style blanking/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
