import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_HOME_FEED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const homeSearchFamilyDocs = [
  'docs/audit/FILTERTUBE_HOME_FEED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MAIN_SEARCH_COMPACT_CHANNEL_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_NAVIGATION_HEADER_SEARCH_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

const authoritySymbols = [
  'homeFeedDomCleanupBoundaryContract',
  'homeFeedDomCleanupDecisionReport',
  'homeFeedDomCleanupRestoreProof',
  'homeFeedDomCleanupSelectorPolicy',
  'homeFeedDomCleanupMarkerReport',
  'homeFeedDomCleanupRoutePolicy',
  'homeFeedDomCleanupMobileParityReport',
  'homeFeedDomCleanupStaleCleanupBudget',
  'homeFeedDomCleanupDisabledRestoreProof',
  'homeFeedDomCleanupMetricArtifact',
  'homeFeedDomCleanupJsonParityGate'
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
    homeCssBlock: sliceBetween(source, '    if (settings.hideHomeFeed) {', '\n\n    if (settings.hideSponsoredCards) {'),
    homeFallbackBlock: sliceBetween(source, 'function handleHomeFeedFallback(settings) {', '\n\nfunction handleCommentsFallback'),
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
      '    handleHomeFeedFallback(effectiveSettings);',
      '\n\n    // 3. Shorts Filtering'
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

function createTarget(name, { marked = false } = {}) {
  const attributes = new Map();
  const target = {
    name,
    attributes,
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    removeAttribute(attribute) {
      attributes.delete(attribute);
    }
  };
  if (marked) {
    target.setAttribute('data-filtertube-hidden-by-hide-home-feed', 'true');
    target.setAttribute('data-filtertube-hidden', 'true');
  }
  return target;
}

function runHomeFallback({ pathname, settings, elements }) {
  const { homeFallbackBlock } = sourceBlocks();
  const toggles = [];
  const document = {
    location: { pathname },
    selectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      return elements;
    }
  };
  const sandbox = {
    document,
    toggles,
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
  vm.runInContext(homeFallbackBlock, sandbox);
  sandbox.handleHomeFeedFallback(settings);
  return {
    document,
    toggles: sandbox.toggles
  };
}

test('home-feed DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+selector\s+patch, cleanup patch/);
  assert.match(doc, /home-feed DOM cleanup boundary source files: 1/);
  assert.match(doc, /home-feed DOM cleanup boundary source\/effect blocks: 8/);
  assert.match(doc, /runtime home-feed DOM cleanup fixtures: 8/);

  assert.match(methodGap, /repo-wide lexical callables: 5681/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5681/);

  assert.equal(homeSearchFamilyDocs.length, 6);
  for (const familyDocPath of homeSearchFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5681/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5681/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('home-feed DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 345, 12583],
    ['home-feed CSS block', blocks.homeCssBlock, 12, 622],
    ['home-feed fallback block', blocks.homeFallbackBlock, 23, 1286],
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 21, 959],
    ['home-feed fallback callsite block', blocks.callsiteBlock, 1, 46]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.homeCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(blocks.homeCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytd-browse[page-subtype="home"]'), 2);
  assert.equal(countLiteral(blocks.homeCssBlock, 'data-filtertube-route-home'), 4);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytm-browse'), 4);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytm-rich-grid-renderer'), 1);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytm-rich-section-renderer'), 1);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytm-item-section-renderer'), 1);
  assert.equal(countLiteral(blocks.homeCssBlock, 'ytm-section-list-renderer'), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, 'pathname'), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, 'isHomeRoute'), 2);
  assert.equal(countLiteral(blocks.homeFallbackBlock, 'querySelectorAll'), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, 'data-filtertube-hidden-by-hide-home-feed'), 4);
  assert.equal(countLiteral(blocks.homeFallbackBlock, "setAttribute('data-filtertube-hidden-by-hide-home-feed', 'true')"), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, "removeAttribute('data-filtertube-hidden-by-hide-home-feed')"), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, "toggleVisibility(element, true, 'Hide Home Feed', true)"), 1);
  assert.equal(countLiteral(blocks.homeFallbackBlock, "toggleVisibility(element, false, '', true)"), 1);
  assert.equal(countLiteral(blocks.activeBlock, "'hideHomeFeed'"), 1);
  assert.equal(countLiteral(blocks.noActiveCleanupBlock, 'clearStaleDOMFallbackVisibility()'), 1);
  assert.equal(countLiteral(blocks.noActiveCleanupBlock, '5000'), 1);
  assert.equal(countLiteral(blocks.clearBlock, 'data-filtertube-hidden-by-hide-home-feed'), 0);
  assert.equal(countLiteral(blocks.clearBlock, 'data-filtertube-hidden-by-hide-all-shorts'), 2);
  assert.equal(countLiteral(blocks.disabledCleanupBlock, 'data-filtertube-hidden-by-hide-home-feed'), 0);
  assert.equal(countLiteral(blocks.disabledCleanupBlock, '[data-filtertube-hidden]'), 1);
  assert.equal(countLiteral(blocks.callsiteBlock, 'handleHomeFeedFallback(effectiveSettings)'), 1);
  assert.equal(countLiteral(blocks.source, 'hideHomeFeed'), 3);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-route-home'), 9);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-hidden-by-hide-home-feed'), 4);
  assert.equal(countLiteral(blocks.source, 'toggleVisibility('), 55);

  for (const expected of [
    'home CSS `rules.push` callsites: 1',
    'home CSS display-none declarations: 1',
    'home CSS desktop browse selectors: 2',
    'home CSS route-home attribute selectors: 4',
    'home CSS mobile browse selectors: 4',
    'home fallback marker references: 4',
    'home fallback marker write callsites: 1',
    'home fallback marker removal callsites: 1',
    'clear-stale cleanup home-feed marker references: 0',
    'disabled cleanup home-feed marker references: 0',
    'home-feed fallback invocation callsites: 1',
    'product runtime home-feed marker references: 4'
  ]) {
    assert.ok(doc.includes(expected), expected);
  }
});

test('home-feed fallback hides queried targets only on the root route', () => {
  const target = createTarget('home-grid');
  const result = runHomeFallback({
    pathname: '/',
    settings: { hideHomeFeed: true },
    elements: [target]
  });

  assert.equal(target.getAttribute('data-filtertube-hidden-by-hide-home-feed'), 'true');
  assert.equal(target.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(result.toggles, [{
    element: 'home-grid',
    hidden: true,
    reason: 'Hide Home Feed',
    force: true
  }]);
  assert.equal(result.document.selectors.length, 1);
  assert.match(result.document.selectors[0], /ytd-browse\[page-subtype="home"\] ytd-rich-grid-renderer/);
  assert.match(result.document.selectors[0], /html\[data-filtertube-route-home="true"\] ytm-browse ytm-section-list-renderer/);
  assert.match(result.document.selectors[0], /\[data-filtertube-hidden-by-hide-home-feed="true"\]/);
});

test('home-feed fallback leaves unmarked off-route targets alone when the setting remains true', () => {
  const target = createTarget('watch-grid');
  const result = runHomeFallback({
    pathname: '/watch',
    settings: { hideHomeFeed: true },
    elements: [target]
  });

  assert.equal(target.getAttribute('data-filtertube-hidden-by-hide-home-feed'), null);
  assert.equal(target.getAttribute('data-filtertube-hidden'), null);
  assert.deepEqual(result.toggles, []);
});

test('home-feed fallback restores previously marked targets off the root route', () => {
  const target = createTarget('stale-home-grid', { marked: true });
  const result = runHomeFallback({
    pathname: '/watch',
    settings: { hideHomeFeed: true },
    elements: [target]
  });

  assert.equal(target.getAttribute('data-filtertube-hidden-by-hide-home-feed'), null);
  assert.equal(target.getAttribute('data-filtertube-hidden'), null);
  assert.deepEqual(result.toggles, [{
    element: 'stale-home-grid',
    hidden: false,
    reason: '',
    force: true
  }]);
});

test('home-feed cleanup gate and invocation order remain source-local', () => {
  const { source, activeBlock, noActiveCleanupBlock, callsiteBlock } = sourceBlocks();

  assert.match(activeBlock, /'hideHomeFeed'/);
  assert.match(noActiveCleanupBlock, /const cleanupDue = state\.hadActiveWork \|\| forceReprocess \|\| \(Date\.now\(\) - \(state\.lastCleanupTs \|\| 0\) > 5000\)/);
  assert.match(noActiveCleanupBlock, /clearStaleDOMFallbackVisibility\(\)/);
  assert.match(noActiveCleanupBlock, /return;/);
  assert.equal(callsiteBlock.trim(), 'handleHomeFeedFallback(effectiveSettings);');

  const noActiveIndex = source.indexOf('if (!hasActiveFallbackWork && !onlyWhitelistPending) {');
  const ensureIndex = source.indexOf('ensureContentControlStyles(effectiveSettings);');
  const homeCallIndex = source.indexOf('handleHomeFeedFallback(effectiveSettings);');
  const shortsIndex = source.indexOf('// 3. Shorts Filtering');
  assert.ok(noActiveIndex < ensureIndex);
  assert.ok(ensureIndex < homeCallIndex);
  assert.ok(homeCallIndex < shortsIndex);
});

test('home-feed specialized marker is omitted by stale and disabled cleanup branches', () => {
  const doc = read(docPath);
  const { clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(countLiteral(clearBlock, 'data-filtertube-hidden-by-hide-home-feed'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-hidden-by-hide-home-feed'), 0);
  assert.match(clearBlock, /data-filtertube-hidden-by-hide-all-shorts/);
  assert.match(disabledCleanupBlock, /\[data-filtertube-hidden\]/);
  assert.match(doc, /Stale cleanup and disabled cleanup currently omit the specialized\s+home-feed marker/);
});

test('home-feed DOM cleanup boundary records missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing authority ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `runtime should not implement ${symbol}`);
  }

  assert.match(doc, /Home-feed DOM cleanup still needs a DOM cleanup contract/);
  assert.match(doc, /JSON\/DOM parity gate/);
  assert.match(doc, /explicit DOM-only policy/);
});
