import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMMENTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'commentsDomCleanupBoundaryContract',
  'commentsDomCleanupDecisionReport',
  'commentsDomCleanupRestoreProof',
  'commentsDomCleanupSelectorPolicy',
  'commentsDomCleanupMarkerReport',
  'commentsDomCleanupRoutePolicy',
  'commentsDomCleanupMobileParityReport',
  'commentsDomCleanupWhitelistPolicy',
  'commentsDomCleanupStaleCleanupBudget',
  'commentsDomCleanupDisabledRestoreProof',
  'commentsDomCleanupMetricArtifact',
  'commentsDomCleanupJsonParityGate'
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
    commentsCssBlock: sliceBetween(source, '    if (settings.hideAllComments) {', '\n\n    const listMode'),
    collectMobileBlock: sliceBetween(source, 'function collectMobileCommentEntryCards()', '\n\nfunction handleHomeFeedFallback'),
    commentsFullBlock: sliceBetween(source, 'function handleCommentsFallback(settings) {', '\n\nfunction handleGuideSubscriptionsFallback'),
    commentsGlobalBlock: sliceBetween(source, 'function handleCommentsFallback(settings) {', '    // 2. Ensure containers are visible when not globally hidden'),
    commentsRestoreBlock: sliceBetween(source, '    // 2. Ensure containers are visible when not globally hidden', '    // 3. Per-thread filtering'),
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
    ),
    callsiteBlock: sliceBetween(
      source,
      '    handleCommentsFallback(effectiveSettings);',
      '\n\n    // 4b. Left guide'
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

function createTarget(name, options = {}) {
  const attributes = new Map();
  const classes = new Set(options.classes || []);
  const target = {
    name,
    textContent: options.text ?? '',
    tagName: options.tagName || 'DIV',
    href: options.href || '',
    attributes,
    closestCalls: [],
    querySelectorCalls: [],
    classList: {
      contains(className) {
        return classes.has(className);
      }
    },
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    removeAttribute(attribute) {
      attributes.delete(attribute);
    },
    closest(selector) {
      this.closestCalls.push(selector);
      return options.closestResult || this;
    },
    querySelector(selector) {
      this.querySelectorCalls.push(selector);
      return null;
    }
  };

  for (const [attribute, value] of Object.entries(options.attributes || {})) {
    target.setAttribute(attribute, value);
  }
  if (options.markedMobileCommentsCard) {
    target.setAttribute('data-filtertube-mobile-comments-card', 'true');
    target.setAttribute('data-filtertube-hidden', 'true');
  }
  return target;
}

function createDocument({ pathname, containers = [], threads = [], renderers = [], viewModels = [], mobileCandidates = [], composer = null }) {
  return {
    location: { pathname },
    selectors: [],
    singleSelectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      if (selector.includes('[data-filtertube-mobile-comments-card="true"]')) return mobileCandidates;
      if (selector.includes('#comments, ytd-comments')) return containers;
      if (selector === 'ytd-comment-thread-renderer, ytm-comment-thread-renderer') return threads;
      if (selector === 'ytd-comment-renderer, ytm-comment-renderer') return renderers;
      if (selector === 'ytd-comment-view-model, ytm-comment-view-model') return viewModels;
      return [];
    },
    querySelector(selector) {
      this.singleSelectors.push(selector);
      if (selector === '#simple-box, ytd-comment-simplebox-renderer') return composer;
      return null;
    }
  };
}

function runCollector({ pathname = '/watch', mobileCandidates = [] }) {
  const { collectMobileBlock } = sourceBlocks();
  const document = createDocument({ pathname, mobileCandidates });
  const sandbox = { document, Set };
  vm.createContext(sandbox);
  vm.runInContext(collectMobileBlock, sandbox);
  return {
    document,
    results: sandbox.collectMobileCommentEntryCards()
  };
}

function runCommentsFallback({
  pathname = '/watch',
  settings,
  containers = [],
  threads = [],
  renderers = [],
  viewModels = [],
  mobileCandidates = [],
  composer = null
}) {
  const { collectMobileBlock, commentsFullBlock } = sourceBlocks();
  const toggles = [];
  const document = createDocument({ pathname, containers, threads, renderers, viewModels, mobileCandidates, composer });
  const sandbox = {
    document,
    toggles,
    Date,
    Number,
    Array,
    Element: function Element() {},
    buildChannelMetadata(channelName, channelHref) {
      return { name: channelName, href: channelHref };
    },
    markedChannelIsStillBlocked() {
      return false;
    },
    markElementAsBlocked() {},
    clearBlockedElementAttributes() {},
    shouldHideContent() {
      return false;
    },
    toggleVisibility(element, hidden, reason, force) {
      toggles.push({ element: element.name, hidden, reason, force });
      if (hidden) {
        element.setAttribute('data-filtertube-hidden', 'true');
      } else {
        element.removeAttribute('data-filtertube-hidden');
      }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${collectMobileBlock}\n\n${commentsFullBlock}`, sandbox);
  sandbox.handleCommentsFallback(settings);
  return {
    document,
    toggles: sandbox.toggles
  };
}

test('comments DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /comments DOM cleanup boundary source files: 1/);
  assert.match(doc, /comments DOM cleanup boundary source\/effect blocks: 10/);
  assert.match(doc, /runtime comments DOM cleanup fixtures: 9/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('comments DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 459, 16337],
    ['comments CSS block', blocks.commentsCssBlock, 16, 671],
    ['collectMobileCommentEntryCards block', blocks.collectMobileBlock, 30, 1386],
    ['comments global hide block', blocks.commentsGlobalBlock, 42, 1934],
    ['comments restore/input block', blocks.commentsRestoreBlock, 17, 781],
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 18, 791],
    ['comments fallback callsite block', blocks.callsiteBlock, 1, 46]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.commentsCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(blocks.commentsCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(blocks.commentsCssBlock, 'data-filtertube-mobile-comments-card'), 1);
  assert.equal(countLiteral(blocks.commentsCssBlock, 'ytm-comments'), 4);
  assert.equal(countLiteral(blocks.collectMobileBlock, 'querySelectorAll'), 1);
  assert.equal(countLiteral(blocks.collectMobileBlock, 'data-filtertube-mobile-comments-card'), 1);
  assert.equal(countLiteral(blocks.collectMobileBlock, "path !== '/watch'"), 1);
  assert.equal(countLiteral(blocks.collectMobileBlock, 'comments?'), 1);
  assert.equal(countLiteral(blocks.collectMobileBlock, '.closest?.'), 1);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, 'querySelectorAll'), 4);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, 'collectMobileCommentEntryCards()'), 1);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, "toggleVisibility(container, true, 'Hide All Comments')"), 1);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, "toggleVisibility(thread, true, 'Hide All Comments')"), 1);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, "setAttribute('data-filtertube-mobile-comments-card', 'true')"), 1);
  assert.equal(countLiteral(blocks.commentsGlobalBlock, "toggleVisibility(card, true, 'Hide All Comments', true)"), 1);
  assert.equal(countLiteral(blocks.commentsRestoreBlock, 'data-filtertube-mobile-comments-card'), 2);
  assert.equal(countLiteral(blocks.commentsRestoreBlock, "removeAttribute('data-filtertube-mobile-comments-card')"), 1);
  assert.equal(countLiteral(blocks.commentsRestoreBlock, "toggleVisibility(card, false, '', true)"), 1);
  assert.equal(countLiteral(blocks.activeBlock, "'hideAllComments'"), 1);
  assert.equal(countLiteral(blocks.activeBlock, "'hideComments'"), 1);
  assert.equal(countLiteral(blocks.activeBlock, "'filterComments'"), 1);
  assert.equal(countLiteral(blocks.noActiveCleanupBlock, 'clearStaleDOMFallbackVisibility()'), 1);
  assert.equal(countLiteral(blocks.clearBlock, 'data-filtertube-mobile-comments-card'), 0);
  assert.equal(countLiteral(blocks.disabledCleanupBlock, 'data-filtertube-mobile-comments-card'), 0);
  assert.equal(countLiteral(blocks.callsiteBlock, 'handleCommentsFallback(effectiveSettings)'), 1);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-mobile-comments-card'), 5);
  assert.equal(countLiteral(blocks.source, 'hideAllComments'), 3);
  assert.equal(countLiteral(blocks.source, 'toggleVisibility('), 55);

  for (const expected of [
    'comments CSS rules.push callsites: 1',
    'comments CSS display-none declarations: 1',
    'comments CSS mobile-card marker references: 1',
    'comments CSS mobile ytm selector tokens: 4',
    'mobile collector querySelectorAll callsites: 1',
    'mobile collector marker references: 1',
    'mobile collector watch-route guard callsites: 1',
    'comments global querySelectorAll callsites: 4',
    'comments global mobile marker write callsites: 1',
    'comments restore marker removal callsites: 1',
    'clear-stale cleanup comments mobile marker references: 0',
    'disabled cleanup comments mobile marker references: 0',
    'comments fallback invocation callsites: 1',
    'product runtime comments mobile marker references: 5'
  ]) {
    assert.ok(doc.includes(expected), expected);
  }
});

test('mobile comments collector is watch-route and comment-text gated', () => {
  const promoted = createTarget('mobile-comments-container');
  const commentCandidate = createTarget('comment-entry', {
    text: 'Comments 12',
    closestResult: promoted
  });
  const safeCandidate = createTarget('safe-entry', {
    text: 'Open app',
    closestResult: createTarget('safe-container')
  });

  const watchResult = runCollector({
    pathname: '/watch',
    mobileCandidates: [commentCandidate, safeCandidate]
  });
  assert.deepEqual([...watchResult.results].map((item) => item.name), ['mobile-comments-container']);
  assert.equal(commentCandidate.closestCalls.length, 1);
  assert.equal(safeCandidate.closestCalls.length, 0);
  assert.equal(watchResult.document.selectors.length, 1);
  assert.match(watchResult.document.selectors[0], /ytm-comments-entry-point-renderer/);
  assert.match(watchResult.document.selectors[0], /\[data-filtertube-mobile-comments-card="true"\]/);

  const offRouteResult = runCollector({
    pathname: '/results',
    mobileCandidates: [commentCandidate]
  });
  assert.equal(offRouteResult.results.length, 0);
  assert.deepEqual(offRouteResult.document.selectors, []);
});

test('hideAllComments hides containers threads and collected mobile cards with marker writes', () => {
  const container = createTarget('comments-container');
  const thread = createTarget('comment-thread');
  const mobileCard = createTarget('mobile-card', { text: 'Comments' });

  const result = runCommentsFallback({
    settings: { hideAllComments: true },
    containers: [container],
    threads: [thread],
    mobileCandidates: [mobileCard]
  });

  assert.equal(mobileCard.getAttribute('data-filtertube-mobile-comments-card'), 'true');
  assert.equal(mobileCard.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(result.toggles, [
    { element: 'comments-container', hidden: true, reason: 'Hide All Comments', force: undefined },
    { element: 'comment-thread', hidden: true, reason: 'Hide All Comments', force: undefined },
    { element: 'mobile-card', hidden: true, reason: 'Hide All Comments', force: true }
  ]);
});

test('global comments hide returns before reply renderers and view-model renderers are toggled', () => {
  const replyRenderer = createTarget('reply-renderer');
  const viewModel = createTarget('comment-view-model');

  const result = runCommentsFallback({
    settings: { hideAllComments: true },
    renderers: [replyRenderer],
    viewModels: [viewModel]
  });

  assert.equal(replyRenderer.getAttribute('data-filtertube-hidden'), null);
  assert.equal(viewModel.getAttribute('data-filtertube-hidden'), null);
  assert.deepEqual(result.toggles, []);
  assert.ok(result.document.selectors.includes('ytd-comment-renderer, ytm-comment-renderer'));
  assert.ok(result.document.selectors.includes('ytd-comment-view-model, ytm-comment-view-model'));
});

test('toggle-off restores only marked mobile cards that still classify as comments', () => {
  const container = createTarget('comments-container');
  const markedCommentCard = createTarget('marked-comment-card', {
    text: 'Comments',
    markedMobileCommentsCard: true
  });
  const markedSilentCard = createTarget('marked-silent-card', {
    text: 'Watch next',
    markedMobileCommentsCard: true
  });

  const result = runCommentsFallback({
    settings: { hideAllComments: false },
    containers: [container],
    mobileCandidates: [markedCommentCard, markedSilentCard]
  });

  assert.equal(markedCommentCard.getAttribute('data-filtertube-mobile-comments-card'), null);
  assert.equal(markedCommentCard.getAttribute('data-filtertube-hidden'), null);
  assert.equal(markedSilentCard.getAttribute('data-filtertube-mobile-comments-card'), 'true');
  assert.equal(markedSilentCard.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(result.toggles, [
    { element: 'comments-container', hidden: false, reason: '', force: true },
    { element: 'marked-comment-card', hidden: false, reason: '', force: true }
  ]);
});

test('whitelist mode locally restores comment containers and composer before normal processing continues', () => {
  const container = createTarget('comments-container');
  const composer = createTarget('comment-composer');

  const result = runCommentsFallback({
    settings: { listMode: 'whitelist', hideAllComments: false },
    containers: [container],
    composer
  });

  assert.deepEqual(result.toggles, [
    { element: 'comments-container', hidden: false, reason: '', force: true },
    { element: 'comment-composer', hidden: false, reason: '', force: true },
    { element: 'comments-container', hidden: false, reason: '', force: true }
  ]);
  assert.deepEqual(result.document.singleSelectors, ['#simple-box, ytd-comment-simplebox-renderer']);
});

test('comments mobile marker is omitted by stale and disabled cleanup branches', () => {
  const { source, commentsRestoreBlock, clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(countLiteral(commentsRestoreBlock, 'data-filtertube-mobile-comments-card'), 2);
  assert.equal(countLiteral(clearBlock, 'data-filtertube-mobile-comments-card'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-mobile-comments-card'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-mobile-comments-card'), 5);
});

test('comments DOM cleanup boundary records missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /The mobile comments collector runs only on `\/watch`/);
  assert.match(doc, /A previously marked mobile card with changed or missing comment text is not collected for local restore/);
  assert.match(doc, /Global hide can rely on broad container\/thread\/card hides/);
  assert.match(doc, /Marker restore depends on the mobile collector still classifying the card as comments/);
  assert.match(doc, /Disabled restore does not directly remove the mobile comments marker/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
