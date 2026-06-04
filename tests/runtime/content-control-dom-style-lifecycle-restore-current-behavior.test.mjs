import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_LIFECYCLE_RESTORE_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const domSelectorFamilyDocs = [
  'docs/audit/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_LIFECYCLE_RESTORE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_SELECTOR_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_DOM_BROAD_HIDE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_DOM_HIDE_SIDE_EFFECT_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_DOM_ROUTE_SCOPE_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_DOM_SELECTOR_INSTANCE_REGISTER_2026-05-18.md',
  'docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_LIVE_CHAT_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MEMBERS_ONLY_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_RECOMMENDED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md',
  'docs/audit/FILTERTUBE_SPONSORED_CARDS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_VIDEO_INFO_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_VIDEO_SIDEBAR_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

const authoritySymbols = [
  'contentControlStyleLifecycleRestoreMatrix',
  'contentControlStyleNodeLifecycleReport',
  'contentControlStyleRestoreProof',
  'contentControlStyleRouteAttributeReport',
  'contentControlStyleNoActiveCleanupBudget',
  'contentControlStyleDisabledCleanupBudget',
  'contentControlStyleOpenAppCleanupPolicy',
  'contentControlStyleRegenDecisionReport',
  'contentControlStyleNoWorkMetricArtifact',
  'contentControlStyleJsonFirstParityGate'
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
    activeBlock: sliceBetween(source, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility()'),
    clearBlock: sliceBetween(source, 'function clearStaleDOMFallbackVisibility() {', '// DOM fallback function that processes already-rendered content'),
    noActiveCleanupBlock: sliceBetween(
      source,
      '    const hasActiveFallbackWork = hasActiveDOMFallbackWork(effectiveSettings);',
      '    try {\n        const state = window.__filtertubeDomFallbackPerfState'
    ),
    ensureCallsiteBlock: sliceBetween(
      source,
      '    const scrollingElement = document.scrollingElement || document.documentElement || document.body;',
      "    try {\n        const path = document.location?.pathname || '';"
    ),
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
    style: {
      properties: new Map(),
      setProperty(name, value) {
        this.properties.set(name, value);
      },
      removeProperty(name) {
        this.properties.delete(name);
      }
    },
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

function createDocument({ pathname = '/', head = true, hiddenNodes = [] } = {}) {
  const elements = new Map();
  const documentElement = createFakeElement('html');
  const fakeHead = head ? {
    appended: [],
    appendChild(element) {
      this.appended.push(element);
      if (element.id) elements.set(element.id, element);
      element.parentNode = this;
      return element;
    }
  } : null;

  return {
    head: fakeHead,
    documentElement,
    location: { pathname },
    createElement: createFakeElement,
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll(selector) {
      if (selector.includes('data-filtertube-hidden') || selector.includes('filtertube-hidden')) {
        return hiddenNodes;
      }
      return [];
    },
    __elements: elements
  };
}

function runEnsureWithDocument(document, supportsHasSelector = true) {
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
  return sandbox;
}

test('content-control DOM style lifecycle audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+style cleanup patch, selector patch/);
  assert.match(doc, /content-control DOM style lifecycle source files: 1/);
  assert.match(doc, /content-control DOM style lifecycle source\/effect blocks: 6/);
  assert.match(doc, /runtime content-control DOM style lifecycle fixtures: 6/);

  assert.match(methodGap, /repo-wide lexical callables: 5836/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5836/);

  assert.equal(domSelectorFamilyDocs.length, 17);
  for (const familyDocPath of domSelectorFamilyDocs) {
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

test('style lifecycle source blocks and primitive counts remain pinned', () => {
  const doc = read(docPath);
  const {
    ensureBlock,
    activeBlock,
    clearBlock,
    noActiveCleanupBlock,
    ensureCallsiteBlock,
    disabledCleanupBlock
  } = sourceBlocks();

  assert.equal(lineCount(ensureBlock), 345);
  assert.equal(Buffer.byteLength(ensureBlock), 12583);
  assert.equal(lineCount(activeBlock), 68);
  assert.equal(Buffer.byteLength(activeBlock), 2333);
  assert.equal(lineCount(clearBlock), 33);
  assert.equal(Buffer.byteLength(clearBlock), 1412);
  assert.equal(lineCount(noActiveCleanupBlock), 14);
  assert.equal(Buffer.byteLength(noActiveCleanupBlock), 629);
  assert.equal(lineCount(ensureCallsiteBlock), 6);
  assert.equal(Buffer.byteLength(ensureCallsiteBlock), 371);
  assert.equal(lineCount(disabledCleanupBlock), 21);
  assert.equal(Buffer.byteLength(disabledCleanupBlock), 959);

  assert.equal(countLiteral(ensureBlock, 'document.getElementById(styleId)'), 1);
  assert.equal(countLiteral(ensureBlock, "document.createElement('style')"), 1);
  assert.equal(countLiteral(ensureBlock, 'document.head.appendChild(style)'), 1);
  assert.equal(countLiteral(ensureBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(ensureBlock, 'rules.push'), 26);
  assert.equal(countLiteral(ensureBlock, 'rules.length'), 0);
  assert.equal(countLiteral(clearBlock, "contentControlStyle.textContent = ''"), 1);
  assert.equal(countLiteral(clearBlock, '.remove()'), 0);
  assert.equal(countLiteral(clearBlock, '.removeChild'), 0);
  assert.equal(countLiteral(noActiveCleanupBlock, 'clearStaleDOMFallbackVisibility()'), 1);
  assert.equal(countLiteral(noActiveCleanupBlock, 'ensureContentControlStyles'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, "contentControlStyle.textContent = ''"), 1);

  assert.match(doc, /ensureContentControlStyles block lines: 345/);
  assert.match(doc, /hasActiveDOMFallbackWork block lines: 68/);
  assert.match(doc, /clearStaleDOMFallbackVisibility block lines: 33/);
  assert.match(doc, /no-active cleanup branch lines: 14/);
  assert.match(doc, /style writer has no `rules.length` empty-state gate/);
});

test('style writer creates one reusable style node and always keeps open-app cleanup CSS on active calls', () => {
  const document = createDocument({ pathname: '/' });
  const sandbox = runEnsureWithDocument(document, true);

  sandbox.ensureContentControlStyles({});
  const style = document.getElementById('filtertube-content-controls-style');
  assert.ok(style, 'style node should be created');
  assert.equal(document.head.appended.length, 1);
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-home'), 'true');
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'false');
  assert.match(style.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.doesNotMatch(style.textContent, /html\[data-filtertube-route-home="true"\] ytm-browse ytm-rich-grid-renderer/);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);

  sandbox.ensureContentControlStyles({ hideHomeFeed: true });
  assert.equal(document.head.appended.length, 1, 'existing style node should be reused');
  assert.strictEqual(document.getElementById('filtertube-content-controls-style'), style);
  assert.match(style.textContent, /html\[data-filtertube-route-home="true"\] ytm-browse ytm-rich-grid-renderer/);
  assert.equal(sandbox.__openAppCalls, 2);

  sandbox.ensureContentControlStyles({ hideHomeFeed: false });
  assert.equal(document.head.appended.length, 1, 'toggle-off rewrite should not append another node');
  assert.match(style.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.doesNotMatch(style.textContent, /html\[data-filtertube-route-home="true"\] ytm-browse ytm-rich-grid-renderer/);
  assert.equal(sandbox.__openAppCalls, 3);
});

test('style writer returns before route attributes or style node work when settings or head are unavailable', () => {
  const noHeadDocument = createDocument({ pathname: '/watch', head: false });
  const noHeadSandbox = runEnsureWithDocument(noHeadDocument, true);

  noHeadSandbox.ensureContentControlStyles({ hideHomeFeed: true });
  assert.equal(noHeadDocument.getElementById('filtertube-content-controls-style'), null);
  assert.equal(noHeadDocument.documentElement.getAttribute('data-filtertube-route-home'), null);
  assert.equal(noHeadDocument.documentElement.getAttribute('data-filtertube-route-watch'), null);
  assert.equal(noHeadSandbox.__openAppCalls, 0);
  assert.deepEqual(noHeadSandbox.__supportsQueries, []);

  const document = createDocument({ pathname: '/watch' });
  const sandbox = runEnsureWithDocument(document, true);
  sandbox.ensureContentControlStyles(null);
  assert.equal(document.getElementById('filtertube-content-controls-style'), null);
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), null);
});

test('active gate and source ordering leave some style cleanup behind no-active cleanup gates', () => {
  const { source, activeBlock, noActiveCleanupBlock } = sourceBlocks();
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(activeBlock, sandbox);

  assert.equal(sandbox.hasActiveDOMFallbackWork({ enabled: false, hideHomeFeed: true }), false);
  assert.equal(sandbox.hasActiveDOMFallbackWork({ disableAutoplay: true }), false);
  assert.equal(sandbox.hasActiveDOMFallbackWork({ disableAnnotations: true }), false);
  assert.equal(sandbox.hasActiveDOMFallbackWork({ hideHomeFeed: true }), true);
  assert.equal(sandbox.hasActiveDOMFallbackWork({ listMode: 'whitelist' }), true);

  const noActiveIndex = source.indexOf('if (!hasActiveFallbackWork && !onlyWhitelistPending) {');
  const ensureIndex = source.indexOf('ensureContentControlStyles(effectiveSettings);');
  const disabledIndex = source.indexOf('if (effectiveSettings.enabled === false) {', ensureIndex);
  assert.ok(noActiveIndex > 0);
  assert.ok(noActiveIndex < ensureIndex);
  assert.ok(ensureIndex < disabledIndex);
  assert.match(noActiveCleanupBlock, /const cleanupDue = state\.hadActiveWork \|\| forceReprocess \|\| \(Date\.now\(\) - \(state\.lastCleanupTs \|\| 0\) > 5000\)/);
  assert.match(noActiveCleanupBlock, /return;/);
});

test('clear-stale cleanup blanks the style node without removing it and records missing authorities', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const hiddenNode = createFakeElement('div');
  const document = createDocument({ hiddenNodes: [hiddenNode] });
  const style = createFakeElement('style');
  style.id = 'filtertube-content-controls-style';
  style.textContent = 'old css';
  document.__elements.set(style.id, style);

  const sandbox = {
    document,
    __toggleCalls: [],
    toggleVisibility(element, shouldHide, reason, skipStats) {
      sandbox.__toggleCalls.push({ element, shouldHide, reason, skipStats });
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(sourceBlocks().clearBlock, sandbox);
  sandbox.clearStaleDOMFallbackVisibility();

  assert.strictEqual(document.getElementById('filtertube-content-controls-style'), style);
  assert.equal(style.textContent, '');
  assert.deepEqual(sandbox.__toggleCalls, [{ element: hiddenNode, shouldHide: false, reason: '', skipStats: true }]);

  assert.match(doc, /Clearing stale DOM fallback visibility empties the shared style node instead of removing it/);
  assert.match(doc, /The ordinary no-active branch can return before `ensureContentControlStyles\(\)` runs/);
  assert.match(doc, /player-only `disableAutoplay` and `disableAnnotations` settings are not active DOM fallback work by themselves/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc missing missing-authority symbol ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(symbol));
  }
});
