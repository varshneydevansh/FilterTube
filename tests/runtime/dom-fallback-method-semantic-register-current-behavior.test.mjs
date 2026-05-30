import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourceFiles = [
  'js/content/dom_fallback.js',
  'js/content/dom_helpers.js'
];
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

const groupByName = new Map(Object.entries({
  getFilteringTracker: 'runStateAndTracking',
  getListSignatureForRun: 'runStateAndTracking',
  normalizeUcIdForComparison: 'identityNormalizationAndCompiledRules',
  normalizeChannelNameForComparison: 'identityNormalizationAndCompiledRules',
  normalizeCustomUrlForComparison: 'identityNormalizationAndCompiledRules',
  normalizeHandleForComparison: 'identityNormalizationAndCompiledRules',
  getCompiledKeywordRegexes: 'identityNormalizationAndCompiledRules',
  getChannelMapLookup: 'identityNormalizationAndCompiledRules',
  getCompiledChannelFilterIndex: 'identityNormalizationAndCompiledRules',
  channelMetaMatchesIndex: 'identityNormalizationAndCompiledRules',
  channelMatchesFilter: 'identityNormalizationAndCompiledRules',
  isFilterTubeMixOrRadioElement: 'playlistWatchAndRouteIdentity',
  isPlaylistPanelRowElement: 'playlistWatchAndRouteIdentity',
  getPlaylistPanelRow: 'playlistWatchAndRouteIdentity',
  getPlaylistPanelRows: 'playlistWatchAndRouteIdentity',
  getPlaylistPanelContainer: 'playlistWatchAndRouteIdentity',
  isSelectedPlaylistPanelRow: 'playlistWatchAndRouteIdentity',
  extractPlaylistPanelBylineChannelName: 'playlistWatchAndRouteIdentity',
  isCreatorChannelPagePath: 'playlistWatchAndRouteIdentity',
  getCurrentPageChannelMeta: 'playlistWatchAndRouteIdentity',
  getCurrentWatchVideoId: 'playlistWatchAndRouteIdentity',
  getCurrentWatchOwnerMeta: 'playlistWatchAndRouteIdentity',
  getPlaylistRowVideoId: 'playlistWatchAndRouteIdentity',
  getPlaylistRowChannelName: 'playlistWatchAndRouteIdentity',
  findNextAllowedWatchPlaylistLink: 'playlistWatchAndRouteIdentity',
  openWatchPlaylistPanelIfCollapsed: 'playlistWatchAndRouteIdentity',
  enforceCurrentWatchOwnerBlock: 'playlistWatchAndRouteIdentity',
  markedChannelIsStillBlocked: 'blockedMarkerAndStaleRestore',
  markElementAsBlocked: 'blockedMarkerAndStaleRestore',
  clearBlockedElementAttributes: 'blockedMarkerAndStaleRestore',
  isExplicitlyHiddenByFilterTube: 'blockedMarkerAndStaleRestore',
  hasExplicitHideReasonMarker: 'blockedMarkerAndStaleRestore',
  ensureContentControlStyles: 'styleAndStaticSurfaceControls',
  hideYouTubeOpenAppButtons: 'styleAndStaticSurfaceControls',
  normalizeTextForMatching: 'textAndKeywordMatching',
  extractPlainKeyword: 'textAndKeywordMatching',
  isAlphanumeric: 'textAndKeywordMatching',
  matchesKeyword: 'textAndKeywordMatching',
  collectMobileCommentEntryCards: 'fallbackSurfaceHandlers',
  handleHomeFeedFallback: 'fallbackSurfaceHandlers',
  handleCommentsFallback: 'fallbackSurfaceHandlers',
  handleGuideSubscriptionsFallback: 'fallbackSurfaceHandlers',
  hasActiveDOMFallbackWork: 'activeWorkAndCleanup',
  clearStaleDOMFallbackVisibility: 'activeWorkAndCleanup',
  installFilterTubeRoutineConsoleGate: 'activeWorkAndCleanup',
  applyDOMFallback: 'domFallbackMainPipeline',
  shouldHideContent: 'hideDecisionEngine',
  ensureStyles: 'helperVisualWriters',
  toggleVisibility: 'helperVisualWriters',
  updateContainerVisibility: 'helperVisualWriters'
}));

function domFallbackMethodRows() {
  const rows = [];

  for (const file of sourceFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const match = line.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (!match) return;
      const name = match[2];
      rows.push({
        file,
        line: index + 1,
        name,
        kind: match[1] ? 'async function' : 'function',
        group: groupByName.get(name) || 'UNCLASSIFIED'
      });
    });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countByName(values) {
  const out = {};
  for (const value of values) out[value] = (out[value] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sourceStats(file) {
  const text = read(file);
  return {
    bytes: readBuffer(file).length,
    sha256: sha256(file),
    splitLines: text.split(/\r?\n/).length
  };
}

function broadCallableRows(file) {
  const rows = [];
  const src = read(file);
  let match;
  while ((match = broadCallableRe.exec(src))) {
    rows.push({
      file,
      name: match.slice(1).find(Boolean)
    });
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function localCallableRows(file) {
  const rows = [];
  const lines = read(file).split(/\r?\n/);
  lines.forEach((line, index) => {
    const arrow = line.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (arrow) {
      rows.push({ file, line: index + 1, name: arrow[1], kind: 'local arrow' });
      return;
    }
    const nested = line.match(/^\s+function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (nested) {
      rows.push({ file, line: index + 1, name: nested[1], kind: 'nested function' });
    }
  });
  return rows;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createStyle(initial = {}) {
  const props = new Map(Object.entries(initial));
  const style = {
    setProperty(name, value) {
      props.set(String(name), String(value));
    },
    removeProperty(name) {
      props.delete(String(name));
    },
    getPropertyValue(name) {
      return props.get(String(name)) || '';
    }
  };
  Object.defineProperty(style, 'display', {
    get() {
      return props.get('display') || '';
    },
    set(value) {
      if (value) props.set('display', String(value));
      else props.delete('display');
    },
    enumerable: true
  });
  return style;
}

class FakeNode {}

class FakeElement extends FakeNode {
  constructor(tagName = 'div', options = {}) {
    super();
    this.tagName = String(tagName).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.style = createStyle(options.style || {});
    this.textContent = options.textContent || '';
    this.innerText = options.innerText || this.textContent || '';
    this.href = options.href || '';
    this.id = options.id || '';
    this.className = options.className || '';
    this.liveVideoId = options.liveVideoId || '';
    for (const [key, value] of Object.entries(options.attrs || {})) {
      this.setAttribute(key, value);
    }
    if (this.href && !this.hasAttribute('href')) this.setAttribute('href', this.href);
    if (this.id && !this.hasAttribute('id')) this.setAttribute('id', this.id);
    this.classList = {
      add: (...names) => {
        const classes = new Set(String(this.className || '').split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.className = Array.from(classes).join(' ');
      },
      remove: (...names) => {
        const remove = new Set(names);
        this.className = String(this.className || '').split(/\s+/).filter((name) => name && !remove.has(name)).join(' ');
      },
      contains: (name) => String(this.className || '').split(/\s+/).includes(name)
    };
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    const stringName = String(name);
    const stringValue = String(value);
    this.attributes.set(stringName, stringValue);
    if (stringName === 'href') this.href = stringValue;
    if (stringName === 'id') this.id = stringValue;
    if (stringName === 'class') this.className = stringValue;
  }

  getAttribute(name) {
    const stringName = String(name);
    if (stringName === 'class') return this.className || null;
    if (stringName === 'id') return this.id || null;
    return this.attributes.has(stringName) ? this.attributes.get(stringName) : null;
  }

  hasAttribute(name) {
    const stringName = String(name);
    if (stringName === 'class') return Boolean(this.className);
    if (stringName === 'id') return Boolean(this.id) || this.attributes.has(stringName);
    return this.attributes.has(stringName);
  }

  removeAttribute(name) {
    const stringName = String(name);
    this.attributes.delete(stringName);
    if (stringName === 'href') this.href = '';
    if (stringName === 'id') this.id = '';
    if (stringName === 'class') this.className = '';
  }

  matches(selector) {
    return String(selector || '').split(',').some((part) => this.matchesOne(part.trim()));
  }

  matchesOne(selector) {
    if (!selector) return false;
    if (selector === '*') return true;
    selector = selector
      .replace(/:not\([^)]*\)/g, '')
      .replace(/^:scope\s*>\s*/, '')
      .trim();
    if (selector.includes(' ')) selector = selector.split(/\s+/).pop();
    if (!selector || selector === '*') return true;

    const tagMatch = selector.match(/^([a-z0-9-]+)/i);
    if (tagMatch && tagMatch[1].toLowerCase() !== this.tagName.toLowerCase()) return false;

    const idMatch = selector.match(/#([A-Za-z0-9_-]+)/);
    if (idMatch && this.getAttribute('id') !== idMatch[1]) return false;

    for (const classMatch of selector.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
      if (!this.classList.contains(classMatch[1])) return false;
    }

    for (const attrMatch of selector.matchAll(/\[([^\]=~*^$|\s]+)([*^$|~]?=)?(?:"([^"]*)"|'([^']*)'|([^\]\s]+))?(?:\s+i)?\]/g)) {
      const attr = attrMatch[1];
      const operator = attrMatch[2] || '';
      const expected = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? '';
      const value = this.getAttribute(attr) || '';
      if (!this.hasAttribute(attr)) return false;
      if (operator === '*=' && !value.includes(expected)) return false;
      if (operator === '^=' && !value.startsWith(expected)) return false;
      if (operator === '$=' && !value.endsWith(expected)) return false;
      if ((operator === '=' || operator === '~=' || operator === '|=') && value !== expected) return false;
    }

    if (!tagMatch && !idMatch && !selector.includes('.') && !selector.includes('[')) {
      return selector.toLowerCase() === this.tagName.toLowerCase();
    }
    return true;
  }

  closest(selector) {
    let cursor = this;
    while (cursor) {
      if (cursor.matches?.(selector)) return cursor;
      cursor = cursor.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const hits = [];
    const visit = (node) => {
      for (const child of node.children || []) {
        if (child.matches?.(selector)) hits.push(child);
        visit(child);
      }
    };
    visit(this);
    return hits;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createFakeDocument({ pathname = '/', search = '', hostname = 'www.youtube.com' } = {}) {
  const documentElement = new FakeElement('html');
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  documentElement.appendChild(head);
  documentElement.appendChild(body);

  const traverse = (root, fn) => {
    if (fn(root)) return root;
    for (const child of root.children || []) {
      const hit = traverse(child, fn);
      if (hit) return hit;
    }
    return null;
  };

  return {
    location: { pathname, search, hostname },
    documentElement,
    scrollingElement: documentElement,
    head,
    body,
    createElement(tag) {
      return new FakeElement(tag);
    },
    getElementById(id) {
      return traverse(documentElement, (node) => node.id === id || node.getAttribute?.('id') === id);
    },
    querySelectorAll(selector) {
      const hits = [];
      if (documentElement.matches(selector)) hits.push(documentElement);
      if (head.matches(selector)) hits.push(head);
      if (body.matches(selector)) hits.push(body);
      return hits.concat(documentElement.querySelectorAll(selector));
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    addEventListener() {}
  };
}

function createDomFallbackRuntime(options = {}) {
  const calls = {
    hiddenStats: 0,
    restoredStats: 0,
    media: [],
    trackerHide: [],
    trackerRestore: 0,
    fetches: []
  };
  const document = createFakeDocument(options);
  const filteringTracker = {
    reset() {},
    logSummary() {},
    recordHide(element, reason) {
      calls.trackerHide.push({ element, reason });
    },
    recordRestore() {
      calls.trackerRestore += 1;
    }
  };
  const context = {
    console,
    document,
    window: {},
    Element: FakeElement,
    Node: FakeNode,
    CSS: { supports: () => false },
    URLSearchParams,
    Date,
    setTimeout,
    clearTimeout,
    currentSettings: null,
    VIDEO_CARD_SELECTORS: 'ytd-video-renderer',
    filteringTracker,
    extractVideoDuration() {
      return 0;
    },
    incrementHiddenStats() {
      calls.hiddenStats += 1;
    },
    decrementHiddenStats() {
      calls.restoredStats += 1;
    },
    handleMediaPlayback(element, hidden) {
      calls.media.push({ element, hidden });
    },
    buildChannelMetadata(name = '', href = '') {
      const text = String(name || '').trim();
      const rawHref = String(href || '').trim();
      const id = (rawHref.match(/\/channel\/(UC[\w-]{22})/i) || text.match(/(UC[\w-]{22})/i) || [])[1] || '';
      const handle = (rawHref.match(/\/(@[^/?#]+)/) || text.match(/@([A-Za-z0-9._-]+)/) || [])[1] || '';
      const normalizedHandle = handle ? (handle.startsWith('@') ? handle : `@${handle}`).toLowerCase() : '';
      return {
        name: text,
        id,
        handle: normalizedHandle,
        customUrl: rawHref.includes('/c/') || rawHref.includes('/user/') ? rawHref : ''
      };
    },
    extractChannelMetadataFromElement(_root, name, href) {
      return context.buildChannelMetadata(name, href);
    },
    extractVideoIdFromCard(element) {
      return element?.liveVideoId || element?.getAttribute?.('data-live-video-id') || '';
    },
    fetchIdForHandle(handle, options) {
      calls.fetches.push({ handle, options });
    }
  };
  context.window = context;
  context.window.filteringTracker = filteringTracker;
  context.window.FilterTubeIdentity = {
    normalizeHandleForComparison(value) {
      const text = String(value || '').trim();
      if (!text) return '';
      const raw = text.startsWith('@') ? text : (text.includes('@') ? text.slice(text.indexOf('@')) : '');
      if (!raw) return '';
      return `@${raw.replace(/^@+/, '').split(/[\s/?#]/)[0].toLowerCase()}`;
    },
    channelMatchesFilter() {
      return false;
    }
  };

  vm.createContext(context);
  vm.runInContext(read('js/content/dom_helpers.js'), context);
  vm.runInContext(read('js/content/dom_fallback.js'), context);

  return {
    context,
    document,
    calls,
    FakeElement,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    }
  };
}

test('DOM fallback method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source files: js\/content\/dom_fallback\.js; js\/content\/dom_helpers\.js/);
  assert.match(text, /runtime owner: isolated-world DOM fallback and visual helper runtime/);
  assert.match(text, /js\/content\/dom_fallback\.js split source lines: 4839/);
  assert.match(text, /js\/content\/dom_fallback\.js wc line count: 4838/);
  assert.match(text, /js\/content\/dom_fallback\.js source bytes: 228332/);
  assert.match(text, /js\/content\/dom_fallback\.js source sha256: 2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef/);
  assert.match(text, /js\/content\/dom_helpers\.js split source lines: 207/);
  assert.match(text, /js\/content\/dom_helpers\.js wc line count: 206/);
  assert.match(text, /js\/content\/dom_helpers\.js source bytes: 8292/);
  assert.match(text, /js\/content\/dom_helpers\.js source sha256: a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242/);
  assert.match(text, /combined source bytes: 236587/);
  assert.match(text, /top-level function declarations: 50/);
  assert.match(text, /js\/content\/dom_fallback\.js top-level function declarations: 47/);
  assert.match(text, /js\/content\/dom_helpers\.js top-level function declarations: 3/);
  assert.match(text, /semantic method groups: 11/);
  assert.match(text, /repo-wide broad parser lexical callable matches: 439/);
  assert.match(text, /broad parser declaration\/inventory matches: 85/);
  assert.match(text, /semantic method rows promoted: 50/);
  assert.match(text, /local callable tokens held below method authority: 35/);
  assert.match(text, /control-flow lexical artifacts: 354/);
  assert.match(text, /file-local executable proof probes: 8/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /not completion proof for every inline loop callback/);
  assert.match(text, /negative sibling-visible fixture/);

  assert.deepEqual(sourceStats('js/content/dom_fallback.js'), {
    bytes: 228332,
    sha256: '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef',
    splitLines: 4839
  });
  assert.deepEqual(sourceStats('js/content/dom_helpers.js'), {
    bytes: 8292,
    sha256: 'a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242',
    splitLines: 207
  });
});

test('DOM fallback method semantic register accounts for every current top-level method row in scope', () => {
  const rows = domFallbackMethodRows();

  assert.equal(rows.length, 50);
  assert.deepEqual(countBy(rows, 'file'), {
    'js/content/dom_fallback.js': 47,
    'js/content/dom_helpers.js': 3
  });
  assert.deepEqual(countBy(rows, 'group'), {
    activeWorkAndCleanup: 3,
    blockedMarkerAndStaleRestore: 5,
    domFallbackMainPipeline: 1,
    fallbackSurfaceHandlers: 4,
    helperVisualWriters: 3,
    hideDecisionEngine: 1,
    identityNormalizationAndCompiledRules: 9,
    playlistWatchAndRouteIdentity: 16,
    runStateAndTracking: 2,
    styleAndStaticSurfaceControls: 2,
    textAndKeywordMatching: 4
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.file}:${row.name}:${row.line} should be classified`);
  }
});

test('DOM fallback method semantic register preserves every source row and future proof field', () => {
  const text = doc();
  const rows = domFallbackMethodRows();

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.file} | ${row.line} | \`${row.name}\` | ${row.kind} | \`${row.group}\` |`),
      `missing DOM fallback method row for ${row.file}:${row.name}:${row.line}`
    );
  }

  for (const field of [
    'methodReference',
    'sourceFile',
    'sourceLine',
    'semanticGroup',
    'ownerRuntime',
    'callerClass',
    'triggerPath',
    'routeOrSurface',
    'settingsModeInput',
    'profileInput',
    'listModeInput',
    'selectorOrTargetClass',
    'identitySourceTier',
    'identityConfidence',
    'observableSideEffects',
    'directDisplayWrites',
    'statsMediaPolicy',
    'lifecyclePrimitive',
    'disabledBehavior',
    'noRuleBehavior',
    'emptyListBehavior',
    'whitelistBehavior',
    'teardownOrRestoreOwner',
    'positiveFixture',
    'negativeIdentityFixture',
    'negativeSiblingVisibleFixture',
    'restoreFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('DOM fallback broad lexical reconciliation separates semantic rows from artifacts', () => {
  const text = doc();
  const rows = sourceFiles.flatMap(file => broadCallableRows(file));
  const localRows = sourceFiles.flatMap(file => localCallableRows(file));
  const semanticRows = domFallbackMethodRows();
  const acceptedNames = new Set([
    ...semanticRows.map(row => row.name),
    ...localRows.map(row => row.name)
  ]);
  const artifacts = rows.filter(row => !acceptedNames.has(row.name));

  assert.equal(rows.length, 439);
  assert.deepEqual(countBy(rows, 'file'), {
    'js/content/dom_fallback.js': 418,
    'js/content/dom_helpers.js': 21
  });
  assert.equal(semanticRows.length, 50);
  assert.equal(localRows.length, 35);
  assert.deepEqual(countBy(localRows, 'kind'), {
    'local arrow': 34,
    'nested function': 1
  });
  assert.equal(semanticRows.length + localRows.length, 85);
  assert.equal(artifacts.length, 354);
  assert.deepEqual(countByName(artifacts.map(row => row.name)), {
    for: 25,
    if: 325,
    logSummary: 1,
    recordHide: 1,
    recordRestore: 1,
    reset: 1
  });

  for (const token of [
    '## Lexical Callable Reconciliation',
    'js/content/dom_fallback.js broad callable matches: 418',
    'js/content/dom_helpers.js broad callable matches: 21',
    'accepted top-level semantic method rows: 50',
    'accepted local arrow callable tokens: 34',
    'accepted nested local helper tokens: 1',
    'rejected if artifacts: 325',
    'rejected for artifacts: 25',
    'rejected fallback tracker object-method artifacts: 4',
    'runtime behavior changed: no'
  ]) {
    assert.ok(text.includes(token), `missing lexical reconciliation token ${token}`);
  }
});

test('DOM fallback source backs active-work cleanup lifecycle and visual side-effect boundaries', () => {
  const text = doc();
  const fallback = read('js/content/dom_fallback.js');
  const helpers = read('js/content/dom_helpers.js');

  assert.match(fallback, /if \(settings\.enabled === false\) return false/);
  assert.match(fallback, /if \(listMode === 'whitelist'\) return true/);
  assert.match(fallback, /categoryFilters\?\.enabled === true/);
  assert.match(fallback, /window\.__filtertubeDomFallbackRunState/);
  assert.match(fallback, /window\.__filtertubeDomFallbackActiveRun/);
  assert.match(fallback, /new Promise\(resolve => setTimeout\(resolve, 0\)\)/);
  assert.match(fallback, /window\.addEventListener\('scroll'/);
  assert.match(fallback, /document\.addEventListener\('click'/);
  assert.match(fallback, /document\.addEventListener\('ended'/);
  assert.match(fallback, /setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\)/);
  assert.match(fallback, /delete window\.__filtertubeDomFallbackActiveRun/);
  assert.match(fallback, /style\.textContent = rules\.join\('\\n'\)/);
  assert.match(fallback, /target\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(fallback, /host\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(fallback, /clearStaleDOMFallbackVisibility/);

  assert.match(helpers, /element\.classList\.add\('filtertube-hidden'\)/);
  assert.match(helpers, /element\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(helpers, /filteringTracker\.recordHide\(element, reason\)/);
  assert.match(helpers, /incrementHiddenStats\(element\)/);
  assert.match(helpers, /decrementHiddenStats\(element\)/);
  assert.match(helpers, /handleMediaPlayback\(element, true\)/);
  assert.match(helpers, /container\.classList\.add\('filtertube-hidden-shelf'\)/);

  for (const token of [
    '`applyDOMFallback()` serializes concurrent runs',
    'installs one scroll listener',
    'playlist click and ended guards',
    'shared teardown owner',
    'direct style display writes',
    '`toggleVisibility()` couples visual hide/restore'
  ]) {
    assert.ok(text.includes(token), `missing source-backed boundary token ${token}`);
  }
});

test('DOM fallback source backs whitelist fail-closed resolver and current-watch side effects', () => {
  const text = doc();
  const fallback = read('js/content/dom_fallback.js');

  assert.match(fallback, /if \(!hasChannelRules && !hasKeywordRules\) return true/);
  assert.match(fallback, /logWhitelistDecision\('block:unresolved_identity'\)/);
  assert.match(fallback, /fetchIdForHandle\(`@\$\{safeKey\}`, \{ skipNetwork: true, backgroundOnly: true \}\)/);
  assert.match(fallback, /video\.pause\(\)/);
  assert.match(fallback, /targetLink\.click\(\)/);
  assert.match(fallback, /nextButton\.click\(\)/);
  assert.match(fallback, /openWatchPlaylistPanelIfCollapsed\(\)/);
  assert.match(fallback, /toggleVisibility\(shell, true, `Current watch blocked: \$\{ownerName\}`, true\)/);
  assert.match(fallback, /markedChannelIsStillBlocked/);
  assert.match(fallback, /isExplicitlyHiddenByFilterTube/);
  assert.match(fallback, /clearBlockedElementAttributes\(element\)/);

  for (const token of [
    '`shouldHideContent()` is the DOM fallback decision helper',
    'whitelist mode can fail closed',
    '`backgroundOnly: true`',
    '`enforceCurrentWatchOwnerBlock()` can pause the current video',
    'click the player Next button',
    'hide the whole watch shell'
  ]) {
    assert.ok(text.includes(token), `missing whitelist/watch boundary token ${token}`);
  }
});

test('DOM fallback executable probes pin active work style visual cleanup and decisions', () => {
  const text = doc();
  const runtime = createDomFallbackRuntime({ pathname: '/watch', search: '?v=abcdefghijk' });
  const { context, document, calls } = runtime;

  assert.equal(context.hasActiveDOMFallbackWork(null), false);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: false, filterKeywords: ['x'] }), false);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true }), false);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, listMode: 'whitelist' }), true);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, filterKeywords: ['x'] }), true);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, hideHomeFeed: true }), true);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, contentFilters: { duration: { enabled: true } } }), true);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, categoryFilters: { enabled: true } }), false);
  assert.equal(context.hasActiveDOMFallbackWork({ enabled: true, categoryFilters: { enabled: true, selected: ['music'] } }), true);

  const directId = 'UCabcdefghijklmnopqrstuv';
  const mappedId = 'UCzyxwvutsrqponmlkjihgfe';
  const indexedSettings = {
    enabled: true,
    filterChannels: [
      '@LooseHandle',
      { id: directId, handle: '@MappedHandle', name: 'Mapped Display' },
      'Name Only'
    ],
    channelMap: {
      '@mappedhandle': mappedId
    }
  };
  const index = context.getCompiledChannelFilterIndex(indexedSettings);
  assert.ok(index.ids.has(directId.toLowerCase()));
  assert.ok(index.ids.has(mappedId.toLowerCase()));
  assert.ok(index.handles.has('@loosehandle'));
  assert.ok(index.handles.has('@mappedhandle'));
  assert.ok(index.nameOnlyNames.has('name only'));
  assert.ok(index.stableNames.has('mapped display'));
  assert.deepEqual(Array.from(index.unresolvedHandleKeys), ['loosehandle']);
  assert.equal(context.markedChannelIsStillBlocked(indexedSettings, mappedId, '', ''), true);
  assert.equal(context.markedChannelIsStillBlocked(indexedSettings, '', '@LooseHandle', ''), true);

  const staleHidden = new FakeElement('ytd-video-renderer', {
    className: 'filtertube-hidden',
    liveVideoId: 'newvideo001',
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-processed': 'true',
      'data-filtertube-last-processed-id': 'oldvideo001'
    },
    style: { display: 'none' }
  });
  assert.equal(context.isExplicitlyHiddenByFilterTube(staleHidden), false);
  assert.equal(staleHidden.classList.contains('filtertube-hidden'), false);
  assert.equal(staleHidden.hasAttribute('data-filtertube-hidden'), false);
  assert.equal(staleHidden.hasAttribute('data-filtertube-hidden-by-channel'), false);
  assert.equal(staleHidden.hasAttribute('data-filtertube-blocked-channel-id'), false);
  assert.equal(staleHidden.style.getPropertyValue('display'), '');

  const explicitMarkerHidden = new FakeElement('ytd-video-renderer', {
    className: 'filtertube-hidden',
    liveVideoId: 'newvideo002',
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-hidden-by-channel': 'true',
      'data-filtertube-processed': 'true',
      'data-filtertube-last-processed-id': 'oldvideo002'
    },
    style: { display: 'none' }
  });
  assert.equal(context.isExplicitlyHiddenByFilterTube(explicitMarkerHidden), true);
  assert.equal(explicitMarkerHidden.hasAttribute('data-filtertube-hidden-by-channel'), true);
  assert.equal(explicitMarkerHidden.style.getPropertyValue('display'), 'none');

  const stableHidden = new FakeElement('ytd-video-renderer', {
    className: 'filtertube-hidden',
    liveVideoId: 'samevideo01',
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-processed': 'true',
      'data-filtertube-last-processed-id': 'samevideo01'
    }
  });
  assert.equal(context.isExplicitlyHiddenByFilterTube(stableHidden), true);

  const openAppButton = new FakeElement('ytm-button-renderer');
  const openAppAnchor = new FakeElement('a', {
    textContent: 'Open app',
    attrs: { href: 'intent://youtube/open_app', 'aria-label': 'Open app' }
  });
  openAppButton.appendChild(openAppAnchor);
  document.body.appendChild(openAppButton);
  context.ensureContentControlStyles({ enabled: true, hideHomeFeed: true });
  const contentStyle = document.getElementById('filtertube-content-controls-style');
  assert.ok(contentStyle.textContent.includes('html[data-filtertube-route-home="true"] ytm-browse ytm-rich-grid-renderer'));
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'true');
  assert.equal(openAppButton.getAttribute('data-filtertube-hidden-open-app'), 'true');
  assert.equal(openAppButton.style.getPropertyValue('display'), 'none');

  const visual = new FakeElement('ytd-video-renderer');
  context.toggleVisibility(visual, true, 'keyword proof', false);
  assert.equal(visual.classList.contains('filtertube-hidden'), true);
  assert.equal(visual.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(visual.style.getPropertyValue('display'), 'none');
  assert.equal(calls.hiddenStats, 1);
  assert.equal(calls.trackerHide.length, 1);
  assert.equal(calls.media.at(-1).hidden, true);
  context.toggleVisibility(visual, false, '', false);
  assert.equal(visual.classList.contains('filtertube-hidden'), false);
  assert.equal(visual.hasAttribute('data-filtertube-hidden'), false);
  assert.equal(visual.style.getPropertyValue('display'), '');
  assert.equal(calls.restoredStats, 1);
  assert.equal(calls.trackerRestore, 1);
  assert.equal(calls.media.at(-1).hidden, false);

  const container = new FakeElement('ytd-rich-section-renderer');
  const hiddenChild = new FakeElement('ytd-rich-item-renderer', { className: 'filtertube-hidden' });
  const attrHiddenChild = new FakeElement('ytd-rich-item-renderer', {
    attrs: { 'data-filtertube-hidden': 'true' }
  });
  container.appendChild(hiddenChild);
  container.appendChild(attrHiddenChild);
  context.updateContainerVisibility(container, 'ytd-rich-item-renderer');
  assert.equal(container.classList.contains('filtertube-hidden-shelf'), true);
  attrHiddenChild.removeAttribute('data-filtertube-hidden');
  context.updateContainerVisibility(container, 'ytd-rich-item-renderer');
  assert.equal(container.classList.contains('filtertube-hidden-shelf'), false);

  const pending = new FakeElement('ytd-video-renderer', {
    className: 'filtertube-hidden filtertube-hidden-shelf',
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-whitelist-pending': 'true',
      'data-filtertube-pending-category': 'true',
      'data-filtertube-pending-upload-date': 'true',
      'data-filtertube-pending-category-ts': '123',
      'data-filtertube-pending-upload-date-ts': '456',
      'data-filtertube-hidden-by-hide-all-shorts': 'true'
    },
    style: { display: 'none' }
  });
  document.body.appendChild(pending);
  contentStyle.textContent = 'stale css';
  context.clearStaleDOMFallbackVisibility();
  assert.equal(pending.classList.contains('filtertube-hidden'), false);
  assert.equal(pending.classList.contains('filtertube-hidden-shelf'), false);
  assert.equal(pending.hasAttribute('data-filtertube-whitelist-pending'), false);
  assert.equal(pending.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(pending.hasAttribute('data-filtertube-pending-upload-date'), false);
  assert.equal(pending.hasAttribute('data-filtertube-hidden-by-hide-all-shorts'), false);
  assert.equal(contentStyle.textContent, '');

  assert.equal(context.shouldHideContent('Any title', '', { enabled: true, listMode: 'whitelist' }), true);
  assert.equal(context.shouldHideContent('Allowed title', '', {
    enabled: true,
    listMode: 'whitelist',
    whitelistKeywords: ['Allowed']
  }), false);
  assert.equal(context.shouldHideContent('', '@AllowedChannel', {
    enabled: true,
    listMode: 'whitelist',
    whitelistChannels: ['@AllowedChannel']
  }, {
    channelMeta: { handle: '@allowedchannel', name: 'Wrong Visible Name' }
  }), false);
  assert.equal(context.shouldHideContent('', '', {
    enabled: true,
    listMode: 'whitelist',
    whitelistChannels: ['@AllowedChannel']
  }, {
    contentTag: 'ytk-video-renderer'
  }), true);
  assert.equal(context.shouldHideContent('bad keyword title', '', {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: ['bad keyword']
  }), true);

  const unresolvedId = 'UCbbbbbbbbbbbbbbbbbbbbbb';
  assert.equal(context.shouldHideContent('', '', {
    enabled: true,
    listMode: 'blocklist',
    filterChannels: ['@NeedsLookup']
  }, {
    channelMeta: { id: unresolvedId },
    contentTag: 'ytd-video-renderer'
  }), false);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.fetches)), [{
    handle: '@needslookup',
    options: { skipNetwork: true, backgroundOnly: true }
  }]);

  for (const token of [
    '## File-Local Executable Behavior Proof',
    'active-work gate proof: executable',
    'channel index/cache proof: executable',
    'hidden marker stale cleanup proof: executable',
    'content-control style proof: executable',
    'visual writer proof: executable',
    'container collapse proof: executable',
    'stale cleanup proof: executable',
    'hide decision proof: executable',
    'runtime source'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }

  for (const token of [
    '## DOM Helpers Visual Writer Flow - 2026-05-27',
    'toggleVisibility(element, shouldHide, reason, skipStats)',
    '```mermaid\nflowchart TD',
    'dom helper visual writer proof rows: 8',
    'stats/media coupling approved for behavior change: NO-GO',
    'container restore authority approved: NO-GO',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing visual writer addendum token ${token}`);
  }

  for (const row of [
    'dom_helper_style_injection',
    'dom_helper_whitelist_pending_conversion',
    'dom_helper_new_hide_side_effects',
    'dom_helper_skipstats_media_coupling',
    'dom_helper_restore_side_effects',
    'dom_helper_container_collapse',
    'dom_helper_container_restore_gap',
    'dom_helper_external_globals'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing visual writer row ${row}`);
  }

  const helpers = read('js/content/dom_helpers.js');
  const hideBody = helpers.slice(
    helpers.indexOf("function toggleVisibility(element, shouldHide, reason = '', skipStats = false) {"),
    helpers.indexOf('function updateContainerVisibility(container, childSelector) {')
  );
  assert.match(hideBody, /const wasWhitelistPending = element\.getAttribute\('data-filtertube-whitelist-pending'\) === 'true';/);
  assert.match(hideBody, /if \(wasAlreadyHidden && wasWhitelistPending && !skipStats\) \{/);
  assert.match(hideBody, /filteringTracker\.recordHide\(element, reason\);/);
  assert.match(hideBody, /incrementHiddenStats\(element\);/);
  assert.match(hideBody, /if \(!skipStats\) \{\s+const duration = extractVideoDuration\(element\);/);
  assert.match(hideBody, /element\.classList\.add\('filtertube-hidden'\);/);
  assert.match(hideBody, /element\.style\.setProperty\('display', 'none', 'important'\);/);
  assert.match(hideBody, /handleMediaPlayback\(element, true\);/);
  assert.match(hideBody, /handleMediaPlayback\(element, false\);/);
  assert.match(hideBody, /filteringTracker\.recordRestore\(element\);/);
  assert.match(hideBody, /decrementHiddenStats\(element\);/);

  const containerBody = helpers.slice(helpers.indexOf('function updateContainerVisibility(container, childSelector) {'));
  assert.match(containerBody, /if \(container\.hasAttribute\('data-filtertube-hidden-by-shelf-title'\)\) return;/);
  assert.match(containerBody, /if \(container\.hasAttribute\('data-filtertube-hidden-by-hide-all-shorts'\)\) return;/);
  assert.match(containerBody, /const children = container\.querySelectorAll\(childSelector\);/);
  assert.match(containerBody, /container\.classList\.add\('filtertube-hidden-shelf'\);/);
  assert.match(containerBody, /container\.classList\.remove\('filtertube-hidden-shelf'\);/);
  assert.doesNotMatch(containerBody, /style\.removeProperty\('display'\)/);
});

test('DOM fallback method semantic register names missing runtime authorities without implementing them', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  for (const authority of [
    'domFallbackMethodAuthority',
    'domFallbackEffectReport',
    'domFallbackNoWorkBudget',
    'domFallbackLifecycleOwner',
    'domFallbackHideDecisionReport',
    'domFallbackSelectorTargetReport',
    'domFallbackGlobalDependencyContract',
    'domHelperVisualWriterReport'
  ]) {
    assert.ok(text.includes(authority), `doc should name future authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(authority), `${authority} should not exist in runtime source yet`);
  }
});
