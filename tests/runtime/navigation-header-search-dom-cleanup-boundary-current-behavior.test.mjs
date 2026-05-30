import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NAVIGATION_HEADER_SEARCH_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const navigationKeys = [
  'hideTopHeader',
  'hideNotificationBell',
  'hideExploreTrending',
  'hideMoreFromYouTube',
  'hideSubscriptions',
  'hideSearchShelves'
];

const navigationMarkers = [
  'data-filtertube-hidden-by-hide-top-header',
  'data-filtertube-hidden-by-hide-notification-bell',
  'data-filtertube-hidden-by-hide-explore-trending',
  'data-filtertube-hidden-by-hide-more-from-youtube',
  'data-filtertube-hidden-by-hide-subscriptions',
  'data-filtertube-hidden-by-hide-search-shelves'
];

const authoritySymbols = [
  'navigationHeaderSearchDomCleanupBoundaryContract',
  'navigationHeaderSearchDomCleanupDecisionReport',
  'navigationHeaderSearchDomCleanupStyleSelectorPolicy',
  'navigationHeaderSearchDomCleanupTargetShapeReport',
  'navigationHeaderSearchDomCleanupRoutePolicy',
  'navigationHeaderSearchDomCleanupSurfaceReport',
  'navigationHeaderSearchDomCleanupHasSelectorPolicy',
  'navigationHeaderSearchDomCleanupGuidePositionPolicy',
  'navigationHeaderSearchDomCleanupRestoreProof',
  'navigationHeaderSearchDomCleanupStaleCleanupBudget',
  'navigationHeaderSearchDomCleanupDisabledRestoreProof',
  'navigationHeaderSearchDomCleanupMetricArtifact',
  'navigationHeaderSearchDomCleanupJsonParityGate'
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
    navigationGroupBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideTopHeader) {',
      "\n\n    style.textContent = rules.join"
    ),
    topHeaderCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideTopHeader) {',
      '\n\n    if (settings.hideNotificationBell) {'
    ),
    notificationBellCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideNotificationBell) {',
      '\n\n    if (settings.hideExploreTrending) {'
    ),
    exploreTrendingCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideExploreTrending) {',
      '\n\n    if (settings.hideMoreFromYouTube) {'
    ),
    moreFromYouTubeCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideMoreFromYouTube) {',
      '\n\n    if (settings.hideSubscriptions) {'
    ),
    subscriptionsCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideSubscriptions) {',
      '\n\n    if (settings.hideSearchShelves) {'
    ),
    searchShelvesCssBlock: sliceBetween(
      ensureBlock,
      '    if (settings.hideSearchShelves) {',
      "\n\n    style.textContent = rules.join"
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

function createDocument({ pathname = '/results' } = {}) {
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

function assertFixedNavigationSelectors(css, { present }) {
  const matcher = present ? assert.match : assert.doesNotMatch;
  matcher(css, /#masthead-container/);
  matcher(css, /ytd-notification-topbar-button-renderer/);
  matcher(css, /ytd-notification-topbar-button-shape-renderer/);
  matcher(css, /\.yt-simple-endpoint\[href\^="\/feed\/explore"\]/);
  matcher(css, /\.yt-simple-endpoint\[href\^="\/feed\/trending"\]/);
  matcher(css, /ytd-browse\[page-subtype="trending"\]/);
  matcher(css, /#sections > ytd-guide-section-renderer:nth-last-child\(2\)/);
  matcher(css, /\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]/);
  matcher(css, /ytd-browse\[page-subtype="subscriptions"\]/);
  matcher(css, /#primary > \.ytd-two-column-search-results-renderer ytd-shelf-renderer/);
  matcher(css, /#primary > \.ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer/);
}

test('navigation/header/search DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /navigation\/header\/search DOM cleanup boundary source files: 1/);
  assert.match(doc, /navigation\/header\/search DOM cleanup source\/effect blocks: 11/);
  assert.match(doc, /runtime navigation\/header\/search DOM cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('navigation/header/search DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 345, 12583],
    ['navigation/header/search CSS group block', blocks.navigationGroupBlock, 53, 1673],
    ['top header CSS block', blocks.topHeaderCssBlock, 7, 162],
    ['notification bell CSS block', blocks.notificationBellCssBlock, 8, 248],
    ['explore trending CSS block', blocks.exploreTrendingCssBlock, 9, 297],
    ['more from YouTube CSS block', blocks.moreFromYouTubeCssBlock, 7, 205],
    ['subscriptions CSS block', blocks.subscriptionsCssBlock, 9, 437],
    ['search shelves CSS block', blocks.searchShelvesCssBlock, 8, 314],
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 21, 959]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
  }

  assert.equal(countLiteral(blocks.navigationGroupBlock, 'rules.push'), 6);
  assert.equal(countLiteral(blocks.navigationGroupBlock, 'display: none !important'), 6);
  assert.equal(countLiteral(blocks.navigationGroupBlock, ':has('), 3);
  assert.equal(countLiteral(blocks.navigationGroupBlock, ':not(:has('), 1);
  assert.equal(countLiteral(blocks.navigationGroupBlock, 'supportsHasSelector'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'hideYouTubeOpenAppButtons()'), 1);

  for (const key of navigationKeys) {
    assert.equal(countLiteral(blocks.ensureBlock, key), 1);
    assert.equal(countLiteral(blocks.activeBlock, `'${key}'`), 1);
    assert.equal(countLiteral(blocks.clearBlock, key), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, key), 0);
    assert.equal(countLiteral(blocks.source, key), 2);
  }
  for (const marker of navigationMarkers) {
    assert.equal(countLiteral(blocks.source, marker), 0);
    assert.equal(countLiteral(blocks.clearBlock, marker), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, marker), 0);
  }

  assert.match(doc, /navigation\/header\/search CSS group block lines: 53/);
  assert.match(doc, /navigation\/header\/search CSS group block bytes: 1673/);
  assert.match(doc, /navigation\/header\/search CSS group selector rows with :has support: 12/);
  assert.match(doc, /navigation\/header\/search CSS group :has tokens: 3/);
  assert.match(doc, /navigation\/header\/search CSS group :not\(:has\(\.\.\.\)\) tokens: 1/);
  assert.match(doc, /active DOM fallback navigation\/header\/search flag references: 6/);
  assert.match(doc, /clear-stale cleanup navigation\/header\/search flag references: 0/);
  assert.match(doc, /disabled cleanup navigation\/header\/search flag references: 0/);
  assert.match(doc, /product runtime navigation\/header\/search feature marker references: 0/);
});

test('all navigation/header/search controls emit current CSS selectors with has support', () => {
  const document = createDocument({ pathname: '/results' });
  const sandbox = runEnsure(Object.fromEntries(navigationKeys.map(key => [key, true])), { document });
  const css = styleText(document);

  assert.equal(document.documentElement.getAttribute('data-filtertube-route-home'), 'false');
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'false');
  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.match(css, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assertFixedNavigationSelectors(css, { present: true });
  assert.match(css, /#sections > ytd-guide-section-renderer:has\(ytd-guide-collapsible-section-entry-renderer\):has\(a\[href\^="\/@"\]\):not\(:has\(a\[href="\/feed\/history"\]\)\),/);
  assert.equal(countLiteral(css, 'display: none !important'), 7);
});

test('subscriptions dynamic guide-section selector depends on has support only', () => {
  const document = createDocument({ pathname: '/feed/subscriptions' });
  const sandbox = runEnsure({ hideSubscriptions: true }, { document, supportsHasSelector: false });
  const css = styleText(document);

  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.match(css, /\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]/);
  assert.match(css, /ytd-browse\[page-subtype="subscriptions"\]/);
  assert.doesNotMatch(css, /ytd-guide-collapsible-section-entry-renderer/);
  assert.doesNotMatch(css, /:not\(:has\(a\[href="\/feed\/history"\]\)\)/);
  assert.equal(countLiteral(css, 'display: none !important'), 2);
});

test('navigation/header/search restore is shared style regeneration and all six flags are active work', () => {
  const document = createDocument({ pathname: '/feed/explore' });
  runEnsure(Object.fromEntries(navigationKeys.map(key => [key, true])), { document });
  const initialStyle = document.__elements.get('filtertube-content-controls-style');
  assertFixedNavigationSelectors(initialStyle.textContent, { present: true });

  const sandbox = runEnsure({}, { document });
  const rewrittenStyle = document.__elements.get('filtertube-content-controls-style');

  assert.equal(rewrittenStyle, initialStyle);
  assert.equal(document.head.appended.length, 1);
  assertFixedNavigationSelectors(rewrittenStyle.textContent, { present: false });
  assert.doesNotMatch(rewrittenStyle.textContent, /ytd-guide-collapsible-section-entry-renderer/);
  assert.match(rewrittenStyle.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.equal(countLiteral(rewrittenStyle.textContent, 'display: none !important'), 1);
  assert.equal(sandbox.__openAppCalls, 1);

  for (const key of navigationKeys) {
    assert.equal(runActiveWork({ [key]: true }), true, `${key} should remain active DOM fallback work`);
  }
  assert.equal(runActiveWork({ enabled: false, hideTopHeader: true }), false);
});

test('navigation/header/search DOM cleanup boundary records marker omissions and missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const { clearBlock, disabledCleanupBlock } = sourceBlocks();
  const runtime = productRuntimeSource();

  for (const marker of navigationMarkers) {
    assert.equal(runtime.includes(marker), false);
    assert.equal(clearBlock.includes(marker), false);
    assert.equal(disabledCleanupBlock.includes(marker), false);
  }

  assert.match(doc, /Positional guide-section hiding can drift when YouTube guide sections change/);
  assert.match(doc, /Browser `:has\(\)` support changes which guide-section selector is emitted/);
  assert.match(doc, /Search shelf hiding is DOM CSS-only and separate from JSON shelf renderer traversal/);
  assert.match(doc, /Restore is full shared style regeneration or stale-style blanking/);
  assert.match(doc, /There is no feature-local stale cleanup budget/);
  assert.match(doc, /Turning the extension off relies on shared style blanking/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
