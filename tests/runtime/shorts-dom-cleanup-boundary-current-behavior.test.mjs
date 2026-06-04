import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SHORTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const shortsFamilyDocs = [
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE2_CLAIM_PREFACED_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_INITIAL_LOCKUP_SHORTS_JSON_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_INITIAL_SHORTS_OWNER_ABSENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_SHORTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SHORTS_REEL_OVERLAY_OWNER_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
];

const authoritySymbols = [
  'shortsDomCleanupBoundaryContract',
  'shortsDomCleanupDecisionReport',
  'shortsDomCleanupRestoreProof',
  'shortsDomCleanupSelectorPolicy',
  'shortsDomCleanupTargetShapeReport',
  'shortsDomCleanupRoutePolicy',
  'shortsDomCleanupMobileNavReport',
  'shortsDomCleanupDisguisedPolicy',
  'shortsDomCleanupVideoIdJoinDecision',
  'shortsDomCleanupShelfDecisionReport',
  'shortsDomCleanupStaleCleanupBudget',
  'shortsDomCleanupDisabledRestoreProof',
  'shortsDomCleanupMetricArtifact',
  'shortsDomCleanupJsonParityGate'
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
  const shortsStart = source.indexOf('    // 3. Shorts Filtering');
  const containerCleanupStart = source.indexOf('    // 5. Container Cleanup (Shelves, Grids)', shortsStart);
  const homeShelfStart = source.indexOf("                if (path === '/' && shelfTag === 'ytd-rich-shelf-renderer')", containerCleanupStart);
  const searchShelfStart = source.indexOf("                if (path === '/results' && shelfTag === 'grid-shelf-view-model')", homeShelfStart);
  assert.notEqual(shortsStart, -1);
  assert.notEqual(containerCleanupStart, -1);
  assert.notEqual(homeShelfStart, -1);
  assert.notEqual(searchShelfStart, -1);

  return {
    source,
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
    shortsCollectionBlock: sliceBetween(source, '    // 3. Shorts Filtering', '    if (effectiveSettings.hideAllShorts) {', shortsStart),
    shortsContainerToggleBlock: sliceBetween(source, '    if (effectiveSettings.hideAllShorts) {', '    // Detect Shorts that are rendered as normal video cards', shortsStart),
    disguisedDetectionBlock: sliceBetween(source, '    // Detect Shorts that are rendered as normal video cards', '    const shortsSelectors = [', shortsStart),
    shortsSelectorExtractBlock: sliceBetween(source, '    const shortsSelectors = [', '    try {\n        const shortsCards = document.querySelectorAll(shortsSelectors);', shortsStart),
    shortsCardDecisionBlock: sliceBetween(source, '    try {\n        const shortsCards = document.querySelectorAll(shortsSelectors);', '\n\n    // 4. Comments Filtering', shortsStart),
    containerCleanupBlock: sliceBetween(
      source,
      '    // 5. Container Cleanup (Shelves, Grids)',
      "    try {\n        const path = document.location?.pathname || '';\n        if (path === '/' && listMode === 'whitelist')",
      containerCleanupStart
    ),
    homeShortsShelfCleanupBlock: sliceBetween(
      source,
      "                if (path === '/' && shelfTag === 'ytd-rich-shelf-renderer')",
      "\n\n                if (path === '/results' && shelfTag === 'grid-shelf-view-model')",
      homeShelfStart
    ),
    searchShortsShelfCleanupBlock: sliceBetween(
      source,
      "                if (path === '/results' && shelfTag === 'grid-shelf-view-model')",
      '            } catch (e) {',
      searchShelfStart
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
  const queryMap = new Map(options.queryMap || []);
  const closestMap = new Map(options.closestMap || []);
  const target = {
    name,
    textContent: options.text ?? '',
    tagName: options.tagName || 'DIV',
    href: options.href || '',
    attributes,
    queryMap,
    closestMap,
    removedClasses: [],
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      if (attribute === 'href' && options.href) return options.href;
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    hasAttribute(attribute) {
      return attributes.has(attribute);
    },
    removeAttribute(attribute) {
      attributes.delete(attribute);
    },
    getAttributeNames() {
      return [...attributes.keys()];
    },
    querySelector(selector) {
      return queryMap.get(selector) || null;
    },
    querySelectorAll(selector) {
      return queryMap.get(selector) || [];
    },
    closest(selector) {
      return closestMap.get(selector) || null;
    },
    classList: {
      contains(className) {
        return classes.has(className);
      },
      remove(className) {
        classes.delete(className);
        target.removedClasses.push(className);
      }
    }
  };
  if (options.href) target.setAttribute('href', options.href);
  for (const [attribute, value] of Object.entries(options.attributes || {})) {
    target.setAttribute(attribute, value);
  }
  return target;
}

function createDocument(selectorMap, pathname = '/') {
  return {
    location: { pathname },
    selectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      return selectorMap.get(selector) || [];
    }
  };
}

function runShortsContainerToggle({ settings, selectorMap, pathname = '/' }) {
  const { shortsCollectionBlock, shortsContainerToggleBlock } = sourceBlocks();
  const toggles = [];
  const document = createDocument(selectorMap, pathname);
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
  vm.runInContext(`function runBlock(effectiveSettings) {\n${shortsCollectionBlock}\n${shortsContainerToggleBlock}\n}`, sandbox);
  sandbox.runBlock(settings);
  return { document, toggles };
}

async function runDisguisedDetection(cards) {
  const { disguisedDetectionBlock } = sourceBlocks();
  const document = createDocument(new Map([
    ['ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-watch-card-compact-video-renderer', cards]
  ]));
  const sandbox = {
    document,
    yieldToMain: async () => {}
  };
  vm.createContext(sandbox);
  vm.runInContext(`async function runBlock(effectiveSettings) {\n${disguisedDetectionBlock}\n}`, sandbox);
  await sandbox.runBlock({});
  return document;
}

function loadShortsExtractor() {
  const { shortsSelectorExtractBlock } = sourceBlocks();
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${shortsSelectorExtractBlock}\nthis.extractShortsVideoId = extractShortsVideoId;`, sandbox);
  return sandbox.extractShortsVideoId;
}

async function runShortsCardDecision({ settings, cards, shouldHideContent }) {
  const { shortsSelectorExtractBlock, shortsCardDecisionBlock } = sourceBlocks();
  const toggles = [];
  const channelMetaSeen = [];
  const document = createDocument(new Map([
    ['ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-video-renderer[data-filtertube-short], ytd-grid-video-renderer[data-filtertube-short], ytd-compact-video-renderer[data-filtertube-short], ytd-watch-card-compact-video-renderer[data-filtertube-short]', cards]
  ]));
  const sandbox = {
    document,
    Date,
    Number,
    effectiveSettings: settings,
    yieldToMain: async () => {},
    markedChannelIsStillBlocked() {
      return false;
    },
    markElementAsBlocked() {},
    clearBlockedElementAttributes() {},
    extractChannelMetadataFromElement() {
      return {};
    },
    shouldHideContent(title, channelText, effectiveSettings, options) {
      channelMetaSeen.push(options.channelMeta);
      return shouldHideContent ? shouldHideContent(title, channelText, effectiveSettings, options) : false;
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
  vm.runInContext(`${shortsSelectorExtractBlock}\nasync function runBlock() {\n${shortsCardDecisionBlock}\n}`, sandbox);
  await sandbox.runBlock();
  return { document, toggles, channelMetaSeen };
}

test('Shorts DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /Shorts DOM cleanup boundary source files: 1/);
  assert.match(doc, /Shorts DOM cleanup boundary source\/effect blocks: 12/);
  assert.match(doc, /runtime Shorts DOM cleanup fixtures: 9/);

  assert.match(methodGap, /repo-wide lexical callables: 5836/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5836/);

  assert.equal(shortsFamilyDocs.length, 7);
  for (const familyDocPath of shortsFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5836/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5836/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('Shorts DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 18, 791],
    ['Shorts collection block', blocks.shortsCollectionBlock, 29, 1651],
    ['Shorts container toggle block', blocks.shortsContainerToggleBlock, 22, 1165],
    ['disguised Shorts detection block', blocks.disguisedDetectionBlock, 29, 1409],
    ['Shorts selector/extract block', blocks.shortsSelectorExtractBlock, 54, 2084],
    ['Shorts card decision block', blocks.shortsCardDecisionBlock, 141, 7008],
    ['container cleanup block', blocks.containerCleanupBlock, 91, 5464],
    ['home Shorts shelf cleanup block', blocks.homeShortsShelfCleanupBlock, 24, 1638],
    ['search Shorts shelf cleanup block', blocks.searchShortsShelfCleanupBlock, 18, 1234]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.shortsCollectionBlock, 'querySelectorAll'), 3);
  assert.equal(countLiteral(blocks.shortsCollectionBlock, 'ytm-pivot-bar'), 6);
  assert.equal(countLiteral(blocks.shortsCollectionBlock, '.closest'), 2);
  assert.equal(countLiteral(blocks.shortsContainerToggleBlock, 'data-filtertube-hidden-by-hide-all-shorts'), 3);
  assert.equal(countLiteral(blocks.shortsContainerToggleBlock, "setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true')"), 1);
  assert.equal(countLiteral(blocks.shortsContainerToggleBlock, "removeAttribute('data-filtertube-hidden-by-hide-all-shorts')"), 1);
  assert.equal(countLiteral(blocks.shortsContainerToggleBlock, "setAttribute('data-filtertube-ignore-empty-hide', 'true')"), 1);
  assert.equal(countLiteral(blocks.shortsContainerToggleBlock, 'data-filtertube-hidden-by-shelf-title'), 1);
  assert.equal(countLiteral(blocks.disguisedDetectionBlock, 'data-filtertube-short'), 2);
  assert.equal(countLiteral(blocks.disguisedDetectionBlock, '/shorts/'), 3);
  assert.equal(countLiteral(blocks.disguisedDetectionBlock, 'play short'), 1);
  assert.equal(countLiteral(blocks.disguisedDetectionBlock, 'SHORTS'), 1);
  assert.equal(countLiteral(blocks.shortsSelectorExtractBlock, 'data-filtertube-short'), 4);
  assert.equal(countLiteral(blocks.shortsSelectorExtractBlock, 'directAttrs'), 2);
  assert.equal(countLiteral(blocks.shortsSelectorExtractBlock, '/\\/shorts\\/([a-zA-Z0-9_-]{11})/'), 3);
  assert.equal(countLiteral(blocks.shortsSelectorExtractBlock, 'getAttributeNames'), 2);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, "closest('ytd-rich-item-renderer')"), 1);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, "closest('.ytGridShelfViewModelGridShelfItem')"), 1);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, 'hideAllShorts'), 3);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, "setAttribute('data-filtertube-hidden-by-keyword', 'true')"), 1);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, "removeAttribute('data-filtertube-hidden-by-keyword')"), 1);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, 'toggleVisibility(target, shouldHideShort, reason)'), 1);
  assert.equal(countLiteral(blocks.shortsCardDecisionBlock, 'videoChannelMap'), 5);
  assert.equal(countLiteral(blocks.homeShortsShelfCleanupBlock, 'data-filtertube-hidden-by-hide-all-shorts'), 1);
  assert.equal(countLiteral(blocks.homeShortsShelfCleanupBlock, 'Empty Shorts shelf'), 1);
  assert.equal(countLiteral(blocks.searchShortsShelfCleanupBlock, 'Empty Shorts shelf'), 1);
  assert.equal(countLiteral(blocks.clearBlock, 'data-filtertube-hidden-by-hide-all-shorts'), 2);
  assert.equal(countLiteral(blocks.disabledCleanupBlock, 'data-filtertube-hidden-by-hide-all-shorts'), 0);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-hidden-by-hide-all-shorts'), 15);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-short'), 8);
  assert.equal(countLiteral(blocks.source, 'data-filtertube-hidden-by-shelf-title'), 4);
  assert.equal(countLiteral(blocks.source, 'hideAllShorts'), 8);
  assert.equal(countLiteral(blocks.source, 'hideShorts'), 1);
  assert.equal(countLiteral(blocks.source, 'toggleVisibility('), 55);

  for (const expected of [
    'Shorts collection querySelectorAll callsites: 3',
    'Shorts collection mobile nav selector tokens: 6',
    'Shorts container marker write callsites: 1',
    'Shorts container marker removal callsites: 1',
    'disguised detection data-short marker references: 2',
    'Shorts extractor href-regex callsites: 3',
    'Shorts card videoChannelMap references: 5',
    'home Shorts shelf Empty Shorts shelf decisions: 1',
    'search Shorts shelf Empty Shorts shelf decisions: 1',
    'clear-stale cleanup hide-all-Shorts marker references: 2',
    'disabled cleanup hide-all-Shorts marker references: 0',
    'product runtime hide-all-Shorts marker references: 15'
  ]) {
    assert.ok(doc.includes(expected), expected);
  }
});

test('Shorts container collection hides shelves guide entries and mobile nav entries while preserving safe nav', () => {
  const shelf = createTarget('shorts-shelf');
  const guideRenderer = createTarget('guide-shorts-entry');
  const guideAnchor = createTarget('guide-anchor', {
    closestMap: [['ytd-guide-entry-renderer', guideRenderer]]
  });
  const mobileNav = createTarget('mobile-shorts-nav', {
    text: 'Shorts',
    attributes: { href: '/shorts' },
    closestMap: [['ytm-pivot-bar-item-renderer, [role="tab"], a', createTarget('mobile-shorts-item')]]
  });
  const safeNav = createTarget('mobile-home-nav', { text: 'Home' });
  const selectorMap = new Map([
    ['grid-shelf-view-model, ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer', [shelf]],
    ['ytd-guide-entry-renderer a[title="Shorts"]', [guideAnchor]],
    ['ytm-pivot-bar-renderer a[href*="/shorts"],ytm-pivot-bar-item-renderer a[href*="/shorts"],ytm-pivot-bar-item-renderer,ytm-pivot-bar-renderer [role="tab"],ytm-pivot-bar-renderer [aria-label*="Shorts"]', [mobileNav, safeNav]]
  ]);

  const result = runShortsContainerToggle({
    settings: { hideAllShorts: true },
    selectorMap
  });

  assert.deepEqual(result.toggles.map((entry) => entry.element), ['shorts-shelf', 'guide-shorts-entry', 'mobile-shorts-item']);
  for (const target of [shelf, guideRenderer, mobileNav.closestMap.get('ytm-pivot-bar-item-renderer, [role="tab"], a')]) {
    assert.equal(target.getAttribute('data-filtertube-hidden-by-hide-all-shorts'), 'true');
    assert.equal(target.getAttribute('data-filtertube-hidden'), 'true');
  }
  assert.equal(safeNav.getAttribute('data-filtertube-hidden-by-hide-all-shorts'), null);
  assert.equal(result.document.selectors.length, 3);
});

test('Shorts container restore removes marker and respects shelf-title guard', () => {
  const restoreTarget = createTarget('restore-target', {
    attributes: {
      'data-filtertube-hidden-by-hide-all-shorts': 'true',
      'data-filtertube-hidden': 'true'
    },
    classes: ['filtertube-hidden-shelf']
  });
  const guardedTarget = createTarget('shelf-title-guarded', {
    attributes: {
      'data-filtertube-hidden-by-hide-all-shorts': 'true',
      'data-filtertube-hidden-by-shelf-title': 'true',
      'data-filtertube-hidden': 'true'
    },
    classes: ['filtertube-hidden-shelf']
  });
  const selectorMap = new Map([
    ['grid-shelf-view-model, ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer', [restoreTarget, guardedTarget]],
    ['ytd-guide-entry-renderer a[title="Shorts"]', []],
    ['ytm-pivot-bar-renderer a[href*="/shorts"],ytm-pivot-bar-item-renderer a[href*="/shorts"],ytm-pivot-bar-item-renderer,ytm-pivot-bar-renderer [role="tab"],ytm-pivot-bar-renderer [aria-label*="Shorts"]', []]
  ]);

  const result = runShortsContainerToggle({
    settings: { hideAllShorts: false },
    selectorMap
  });

  assert.equal(restoreTarget.getAttribute('data-filtertube-hidden-by-hide-all-shorts'), null);
  assert.equal(restoreTarget.getAttribute('data-filtertube-ignore-empty-hide'), 'true');
  assert.equal(restoreTarget.getAttribute('data-filtertube-hidden'), null);
  assert.equal(guardedTarget.getAttribute('data-filtertube-hidden-by-hide-all-shorts'), null);
  assert.equal(guardedTarget.getAttribute('data-filtertube-hidden-by-shelf-title'), 'true');
  assert.equal(guardedTarget.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(result.toggles, [{ element: 'restore-target', hidden: false, reason: '', force: true }]);
  assert.deepEqual(restoreTarget.removedClasses, ['filtertube-hidden-shelf']);
  assert.deepEqual(guardedTarget.removedClasses, ['filtertube-hidden-shelf']);
});

test('disguised Shorts detection stamps normal cards by href aria and overlay evidence', async () => {
  const hrefLink = createTarget('href-link', { href: '/shorts/SHORTS00001' });
  const hrefCard = createTarget('href-card');
  hrefCard.queryMap.set('a#thumbnail[href*="/shorts/"], a#video-title[href*="/shorts/"], a.yt-simple-endpoint[href*="/shorts/"]', hrefLink);

  const titleNode = createTarget('title-node', { attributes: { 'aria-label': 'Play short from creator' } });
  const ariaCard = createTarget('aria-card');
  ariaCard.queryMap.set('#video-title', titleNode);

  const overlayNode = createTarget('overlay-node', { attributes: { 'overlay-style': 'SHORTS' } });
  const overlayCard = createTarget('overlay-card');
  overlayCard.queryMap.set('ytd-thumbnail-overlay-time-status-renderer', overlayNode);

  const safeCard = createTarget('safe-card');

  await runDisguisedDetection([hrefCard, ariaCard, overlayCard, safeCard]);

  assert.equal(hrefCard.getAttribute('data-filtertube-short'), 'true');
  assert.equal(ariaCard.getAttribute('data-filtertube-short'), 'true');
  assert.equal(overlayCard.getAttribute('data-filtertube-short'), 'true');
  assert.equal(safeCard.getAttribute('data-filtertube-short'), null);
});

test('extractShortsVideoId accepts direct attributes hrefs generic attributes and fallback anchors', () => {
  const extractShortsVideoId = loadShortsExtractor();

  const direct = createTarget('direct', { attributes: { 'data-video-id': 'SHORTS00001' } });
  const hrefNode = createTarget('href-node', { href: '/shorts/SHORTS00002?feature=share' });
  const hrefCard = createTarget('href-card');
  hrefCard.queryMap.set('a[href*="/shorts/"]', hrefNode);
  const attrCard = createTarget('attr-card', { attributes: { endpoint: '/shorts/SHORTS00003' } });
  const fallbackNode = createTarget('fallback-node', { href: '/shorts/SHORTS00004' });
  const fallbackCard = createTarget('fallback-card');
  fallbackCard.queryMap.set('a[href]', fallbackNode);

  assert.equal(extractShortsVideoId(direct), 'SHORTS00001');
  assert.equal(extractShortsVideoId(hrefCard), 'SHORTS00002');
  assert.equal(extractShortsVideoId(attrCard), 'SHORTS00003');
  assert.equal(extractShortsVideoId(fallbackCard), 'SHORTS00004');
  assert.equal(extractShortsVideoId(createTarget('none')), null);
});

test('Shorts card decision promotes target to rich item parent under global hide', async () => {
  const richParent = createTarget('rich-parent');
  const titleNode = createTarget('title-node', { text: 'Short title' });
  const card = createTarget('short-card', {
    closestMap: [['ytd-rich-item-renderer', richParent]],
    queryMap: [['#video-title', titleNode]]
  });

  const result = await runShortsCardDecision({
    settings: { hideAllShorts: true, videoChannelMap: {} },
    cards: [card]
  });

  assert.deepEqual(result.toggles, [{ element: 'rich-parent', hidden: true, reason: 'Hide All Shorts', force: undefined }]);
  assert.equal(richParent.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
});

test('Shorts card decision removes keyword marker when global hide and keyword match are inactive while preserving video map evidence', async () => {
  const gridParent = createTarget('grid-parent', {
    attributes: { 'data-filtertube-hidden-by-keyword': 'true' }
  });
  const titleNode = createTarget('title-node', { text: 'Short title' });
  const shortLink = createTarget('short-link', { href: '/shorts/SHORTS00005' });
  const card = createTarget('short-card', {
    closestMap: [['.ytGridShelfViewModelGridShelfItem', gridParent]],
    queryMap: [
      ['#video-title', titleNode],
      ['a[href*="/shorts/"]', shortLink]
    ]
  });

  const result = await runShortsCardDecision({
    settings: { hideAllShorts: false, videoChannelMap: { SHORTS00005: 'UC_JOINED_FROM_MAP' } },
    cards: [card]
  });

  assert.equal(gridParent.getAttribute('data-filtertube-hidden-by-keyword'), null);
  assert.deepEqual(result.toggles, [{ element: 'grid-parent', hidden: false, reason: 'Short: Short title', force: undefined }]);
  assert.equal(result.channelMetaSeen.length, 1);
  assert.equal(result.channelMetaSeen[0].id, 'UC_JOINED_FROM_MAP');
});

test('Shorts DOM cleanup boundary records shelf cleanup and missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.homeShortsShelfCleanupBlock, /path === '\/'/);
  assert.match(blocks.homeShortsShelfCleanupBlock, /ytd-rich-shelf-renderer/);
  assert.match(blocks.homeShortsShelfCleanupBlock, /Empty Shorts shelf/);
  assert.match(blocks.searchShortsShelfCleanupBlock, /path === '\/results'/);
  assert.match(blocks.searchShortsShelfCleanupBlock, /grid-shelf-view-model/);
  assert.match(blocks.searchShortsShelfCleanupBlock, /Empty Shorts shelf/);
  assert.match(blocks.clearBlock, /data-filtertube-hidden-by-hide-all-shorts/);
  assert.doesNotMatch(blocks.disabledCleanupBlock, /data-filtertube-hidden-by-hide-all-shorts/);
  assert.match(doc, /Restore is conditional on the current collection still finding the element/);
  assert.match(doc, /Display evidence turns ordinary card selectors into Shorts selectors/);
  assert.match(doc, /Video-id joins are behaviorally different from visible DOM author evidence/);
  assert.match(doc, /Shelf cleanup can hide a container after per-card filtering/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
