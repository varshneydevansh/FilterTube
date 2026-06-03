import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/block_channel.js';
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

function broadCallableRows() {
  const source = read(sourcePath);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function groupForMethod(name) {
  if ([
    'blockChannelDebugLog',
    'isWhitelistModeActive',
    'cleanupInjectedMenuItems',
    'isQuickBlockEnabled',
    'hasActiveQuickBlockRuleContext',
    'hasList'
  ].includes(name)) {
    return 'blockChannelModuleStateAndModeGates';
  }
  if ([
    'isMobileYouTubeSurface',
    'isHoverCapableDesktopSurface',
    'isElementVisibleForQuickBlock',
    'isMobileSearchSurfaceOpen',
    'isYouTubeOverlaySurfaceOpen',
    'invalidateQuickBlockSurfaceStateCache',
    'invalidateQuickBlockOcclusionCache',
    'getQuickBlockSurfaceState',
    'syncQuickBlockSurfaceState',
    'untrackQuickBlockViewportHost',
    'pruneQuickBlockViewportHosts',
    'isMobileWatchNextQuickBlockHost'
  ].includes(name)) {
    return 'blockChannelSurfaceOverlayAndVisibility';
  }
  if ([
    'isPostLikeQuickBlockCard',
    'isShortsQuickBlockCard',
    'resolveQuickBlockHost',
    'resolveOutermostShortsQuickBlockHost',
    'resolveQuickBlockHideTarget',
    'isRenderableQuickBlockAnchor',
    'resolveQuickBlockAnchor',
    'getQuickBlockBoundsElement',
    'findQuickBlockCardFromTarget'
  ].includes(name)) {
    return 'blockChannelCardTargetAndAnchorResolution';
  }
  if ([
    'getQuickBlockTopOcclusionPx',
    'getQuickBlockSampledTopOcclusionPx',
    'getQuickBlockBottomOcclusionTopPx',
    'getQuickBlockSampledBottomOcclusionTopPx',
    'getQuickBlockViewportOcclusionBounds',
    'pointInsideQuickBlockElementRect',
    'pointInsideQuickBlockHost',
    'updateQuickBlockViewportStateForHost',
    'isQuickBlockHostNearViewport',
    'ensureQuickBlockHostVisibilityObserver',
    'trackQuickBlockViewportHost',
    'scheduleQuickBlockViewportRefresh',
    'setQuickBlockHoverStateForHost'
  ].includes(name)) {
    return 'blockChannelViewportHoverAndOcclusion';
  }
  if ([
    'createSyntheticQuickBlockMenuItem',
    'collectQuickBlockCollaborators',
    'skipAmpersandTopicNameOnlyRoster',
    'pushCollaboratorList',
    'buildQuickBlockContext',
    'isPostCard',
    'getQuickBlockActionInfo',
    'buildQuickBlockFallbackMetadata',
    'getQuickBlockInput'
  ].includes(name)) {
    return 'blockChannelQuickBlockIdentityAndActionBuild';
  }
  if ([
    'runQuickBlockFallback',
    'applyQuickBlockImmediateHide',
    'runQuickBlockAction'
  ].includes(name)) {
    return 'blockChannelQuickBlockMutationAndImmediateHide';
  }
  if ([
    'shouldEagerQuickBlockSweep',
    'ensureQuickBlockStyles',
    'removeQuickBlockButtons',
    'attachQuickBlockWrapHoverEvents',
    'activate',
    'release',
    'ensureQuickBlockButton',
    'sweepQuickBlockButtons',
    'scheduleQuickBlockSweep',
    'setupQuickBlockObserver',
    'boot',
    'shouldRefreshQuickBlockRuntimeState',
    'refreshQuickBlockRuntimeState',
    'refreshQuickBlockAvailability',
    'armQuickBlockPointerRecovery',
    'cancelQuickBlockHoverIntent',
    'scheduleQuickBlockHoverIntent',
    'clearLast',
    'stopPointerMoveRecovery',
    'schedulePointerMoveRecoveryStop',
    'pickHostFromTarget',
    'getHostFromCachedTarget',
    'pickHostFromPoint',
    'onPointerMove',
    'tick'
  ].includes(name)) {
    return 'blockChannelQuickBlockDomLifecycle';
  }
  if ([
    'setupMenuObserver',
    'ensureDropdownVisibilityObserver',
    'repairFilterTubeHiddenDropdownState',
    'isDropdownVisible',
    'scheduleDropdownInjection',
    'run',
    'handleCandidateDropdown',
    'scanExistingDropdowns',
    'closeFilterTubeInjectedDropdownsOnOutsidePointer',
    'stopDropdownDiscoveryObserver',
    'armDropdownDiscoveryObserver',
    'startObserver',
    'tryInjectIntoVisibleDropdown',
    'handleDropdownAppeared',
    'handleDropdownAppearedInternal'
  ].includes(name)) {
    return 'blockChannelDropdownInjectionLifecycle';
  }
  if ([
    'setupKidsPassiveBlockListener',
    'waitBody',
    'captureKidsMenuContext',
    'decoded',
    'handleKidsNativeBlock'
  ].includes(name)) {
    return 'blockChannelKidsNativeBlockSync';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const fn = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) {
      const name = fn[2];
      rows.push({
        line: index + 1,
        kind: fn[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
      return;
    }

    const constDecl = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=/);
    if (!constDecl) return;
    const name = constDecl[1];
    if (line.includes('= (() =>')) {
      rows.push({ line: index + 1, kind: 'const IIFE result', name, group: groupForMethod(name) });
      return;
    }
    if (/^\s*const\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(line)) {
      rows.push({ line: index + 1, kind: 'const arrow', name, group: groupForMethod(name) });
    }
  });
  return rows.sort((a, b) => a.line - b.line);
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

class FakeElement {
  constructor(tagName = 'div', options = {}) {
    this.tagName = String(tagName).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.style = {};
    this.events = [];
    this.isConnected = true;
    this.textContent = options.textContent || '';
    this.className = options.className || '';
    this.rect = options.rect || { left: 0, top: 0, right: 120, bottom: 80, width: 120, height: 80 };
    for (const [key, value] of Object.entries(options.attrs || {})) {
      this.setAttribute(key, value);
    }
    this.classList = {
      add: (...names) => {
        const classes = new Set(String(this.className || '').split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.className = Array.from(classes).join(' ');
      },
      remove: (...names) => {
        const removeSet = new Set(names);
        this.className = String(this.className || '')
          .split(/\s+/)
          .filter((name) => name && !removeSet.has(name))
          .join(' ');
      },
      contains: (name) => String(this.className || '').split(/\s+/).includes(name)
    };
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  appendChild(child) {
    child.parentElement = this;
    child.isConnected = true;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    }
    this.parentElement = null;
    this.isConnected = false;
  }

  setAttribute(name, value) {
    this.attributes.set(String(name), String(value));
    if (name === 'class') this.className = String(value);
  }

  getAttribute(name) {
    if (name === 'class') return this.className || null;
    return this.attributes.has(String(name)) ? this.attributes.get(String(name)) : null;
  }

  hasAttribute(name) {
    if (name === 'class') return Boolean(this.className);
    return this.attributes.has(String(name));
  }

  removeAttribute(name) {
    this.attributes.delete(String(name));
    if (name === 'class') this.className = '';
  }

  toggleAttribute(name, force) {
    const enabled = Boolean(force);
    if (enabled) this.setAttribute(name, '');
    else this.removeAttribute(name);
    return enabled;
  }

  addEventListener(type, handler, options) {
    this.events.push({ type, handler, options });
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child.contains?.(node));
  }

  getBoundingClientRect() {
    return this.rect;
  }

  matches(selector) {
    if (!selector) return false;
    return String(selector).split(',').some((part) => this.matchesOne(part.trim()));
  }

  matchesOne(selector) {
    if (!selector) return false;
    if (selector.includes(' ')) {
      return this.matchesOne(selector.split(/\s+/).pop());
    }
    const tagMatch = selector.match(/^([a-z0-9-]+)/i);
    if (tagMatch && tagMatch[1].toLowerCase() !== this.tagName.toLowerCase()) return false;
    const idMatch = selector.match(/#([A-Za-z0-9_-]+)/);
    if (idMatch && this.getAttribute('id') !== idMatch[1]) return false;
    for (const classMatch of selector.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
      if (!this.classList.contains(classMatch[1])) return false;
    }
    for (const attrMatch of selector.matchAll(/\[([^\]=~*^$|\s]+)(?:[*^$|~]?=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)) {
      const attr = attrMatch[1];
      const expected = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
      if (!this.hasAttribute(attr)) return false;
      if (expected && !String(this.getAttribute(attr) || '').includes(String(expected).replace(/ i$/, ''))) {
        return false;
      }
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

function createFakeDocument() {
  const documentElement = new FakeElement('html');
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  documentElement.appendChild(head);
  documentElement.appendChild(body);
  return {
    documentElement,
    head,
    body,
    activeElement: null,
    location: { pathname: '/', search: '' },
    events: [],
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelectorAll(selector) {
      return [
        ...documentElement.querySelectorAll(selector),
        ...(documentElement.matches(selector) ? [documentElement] : [])
      ];
    },
    querySelector(selector) {
      if (documentElement.matches(selector)) return documentElement;
      return documentElement.querySelector(selector);
    },
    addEventListener(type, handler, options) {
      this.events.push({ type, handler, options });
    },
    elementsFromPoint() {
      return [];
    }
  };
}

function createBlockChannelRuntime({
  hostname = 'www.youtube.com',
  pathname = '/',
  search = '',
  settings = {
    showQuickBlockButton: true,
    listMode: 'blocklist',
    filterChannels: ['UCAAAAAAAAAAAAAAAAAAAAAA'],
    filterKeywords: [],
    filterKeywordsComments: [],
    videoChannelMap: {}
  },
  addChannelDirectlyResult = { success: true },
  runtimeResponse = { success: true },
  includeAddChannelDirectly = true
} = {}) {
  const events = {
    timers: [],
    intervals: [],
    rafs: [],
    runtimeMessages: [],
    addChannelCalls: [],
    markCalls: [],
    consoleWarns: [],
    windowListeners: []
  };
  const document = createFakeDocument();
  document.location = { pathname, search };
  const location = { hostname, pathname, search };
  const context = {
    console: {
      log() {},
      warn: (...args) => events.consoleWarns.push(args),
      error: (...args) => events.consoleWarns.push(args)
    },
    currentSettings: { ...settings },
    location,
    document,
    Element: FakeElement,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.observed = [];
        this.disconnected = false;
      }
      observe(target, options) {
        this.observed.push({ target, options });
      }
      disconnect() {
        this.disconnected = true;
      }
    },
    URLSearchParams,
    Date,
    Math,
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(payload, callback) {
          events.runtimeMessages.push(payload);
          callback?.(runtimeResponse);
        }
      }
    },
    markElementAsBlocked(target, channelInfo, state) {
      events.markCalls.push({ target, channelInfo, state });
    },
    setTimeout(callback, delay) {
      const timer = { callback, delay };
      events.timers.push(timer);
      return events.timers.length;
    },
    clearTimeout(id) {
      events.timers[id - 1] = { cleared: true };
    },
    requestAnimationFrame(callback) {
      events.rafs.push(callback);
      return events.rafs.length;
    }
  };
  context.window = {
    __filtertubeDebug: false,
    innerWidth: 1280,
    innerHeight: 720,
    matchMedia: () => ({ matches: false }),
    getComputedStyle: (element) => ({
      display: element?.style?.display || 'block',
      visibility: element?.style?.visibility || 'visible',
      position: element?.style?.position || 'static'
    }),
    addEventListener(type, handler, options) {
      events.windowListeners.push({ type, handler, options });
    },
    setInterval(callback, delay) {
      const interval = { callback, delay };
      events.intervals.push(interval);
      return events.intervals.length;
    }
  };
  if (includeAddChannelDirectly) {
    context.addChannelDirectly = async (input, filterAll, otherChannels, groupId, metadata) => {
      events.addChannelCalls.push({ input, filterAll, otherChannels, groupId, metadata });
      return addChannelDirectlyResult;
    };
  }
  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);
  return {
    context,
    events,
    document,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    },
    async flush() {
      await Promise.resolve();
      await new Promise((resolve) => setImmediate(resolve));
    }
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

test('block channel method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior register with 2026-05-26 second-pass idle-detach addendum/);
  assert.match(text, /periodic quick-block sweep removed/);
  assert.match(text, /source file: js\/content\/block_channel\.js/);
  assert.match(text, /line count: 3189/);
  assert.equal(sourceLineCount(), 3189);
  assert.match(text, /source bytes: 127857/);
  assert.equal(readBuffer(sourcePath).byteLength, 127857);
  assert.match(text, /source sha256: c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba/);
  assert.equal(sha256(sourcePath), 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba');
  assert.match(text, /repo-wide broad parser lexical callable matches: 226/);
  assert.match(text, /broad parser declaration\/inventory matches: 96/);
  assert.match(text, /assignment-expression function declarations outside broad parser: 0/);
  assert.match(text, /control-flow lexical artifacts: 130/);
  assert.match(text, /file-local executable proof probes: 7/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named method\/helper\/callback declarations in scope: 96/);
  assert.match(text, /function declarations in scope: 59/);
  assert.match(text, /plain function declarations: 54/);
  assert.match(text, /async function declarations: 5/);
  assert.match(text, /const helper\/callback declarations: 37/);
  assert.match(text, /const arrow helper\/callback declarations: 35/);
  assert.match(text, /top-level const arrow helper declarations: 11/);
  assert.match(text, /local const arrow helper\/callback declarations: 24/);
  assert.match(text, /local const IIFE result declarations: 2/);
  assert.match(text, /semantic method groups: 9/);
  assert.match(text, /runtime behavior changed: yes; quick-block periodic full-document sweep removed/);
  assert.match(text, /quick-block lifecycle now keeps desktop first-rule creation hover-lazy without body-wide sweeps/);
  assert.match(text, /not completion proof for quick-block route ownership/);
});

test('block channel method register accounts for every current declaration row', () => {
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countBy(broadRows.map((name) => ({ name })), 'name');

  assert.equal(rows.length, 96);
  assert.equal(broadRows.length, 226);
  assert.equal(broadCounts.if, 104);
  assert.equal(broadCounts.for, 24);
  assert.equal(broadCounts.while, 2);
  assert.equal(broadRows.filter((name) => name !== 'if' && name !== 'for' && name !== 'while').length, 96);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 5,
    'const IIFE result': 2,
    'const arrow': 35,
    function: 54
  });
  assert.deepEqual(countBy(rows, 'group'), {
    blockChannelCardTargetAndAnchorResolution: 9,
    blockChannelDropdownInjectionLifecycle: 15,
    blockChannelKidsNativeBlockSync: 5,
    blockChannelModuleStateAndModeGates: 6,
    blockChannelQuickBlockDomLifecycle: 24,
    blockChannelQuickBlockIdentityAndActionBuild: 9,
    blockChannelQuickBlockMutationAndImmediateHide: 3,
    blockChannelSurfaceOverlayAndVisibility: 12,
    blockChannelViewportHoverAndOcclusion: 13
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }

  for (const token of [
    'broad parser total matches: 226',
    'accepted declaration/inventory rows: 96',
    'plain function declarations accepted: 54',
    'async function declarations accepted: 5',
    'const arrow declarations accepted: 35',
    'const IIFE result inventory rows accepted: 2',
    'control-flow artifacts rejected: 130',
    'if artifacts rejected: 104',
    'for artifacts rejected: 24',
    'while artifacts rejected: 2',
    'assignment-expression function declarations outside broad parser: 0'
  ]) {
    assert.ok(doc().includes(token), `missing lexical reconciliation token ${token}`);
  }
});

test('block channel method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing block channel method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('block channel register pins DOM lifecycle selector mutation and message counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal(countLiteral(source, 'document.'), 75);
  assert.equal(countLiteral(source, 'window.'), 35);
  assert.equal(countLiteral(source, 'location'), 19);
  assert.equal(countLiteral(source, 'document.querySelector'), 12);
  assert.equal(countLiteral(source, 'document.querySelectorAll'), 10);
  assert.equal(countLiteral(source, 'querySelector?.('), 12);
  assert.equal(countLiteral(source, 'querySelectorAll('), 13);
  assert.equal(countLiteral(source, 'closest?.('), 26);
  assert.equal(countLiteral(source, 'matches?.('), 8);
  assert.equal(countLiteral(source, 'document.createElement'), 5);
  assert.equal(countLiteral(source, 'addEventListener('), 37);
  assert.equal(countLiteral(source, 'removeEventListener('), 1);
  assert.equal(countLiteral(source, 'MutationObserver'), 6);
  assert.equal(countLiteral(source, '.observe('), 7);
  assert.equal(countLiteral(source, '.disconnect('), 2);
  assert.equal(countLiteral(source, 'setTimeout('), 16);
  assert.equal(countLiteral(source, 'clearTimeout('), 6);
  assert.equal(countLiteral(source, 'setInterval('), 0);
  assert.equal(countLiteral(source, 'clearInterval('), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame('), 4);
  assert.equal(countLiteral(source, 'cancelAnimationFrame('), 0);
  assert.equal(countLiteral(source, 'innerHTML'), 0);
  assert.equal(countLiteral(source, 'textContent'), 9);
  assert.equal(countLiteral(source, 'setAttribute('), 17);
  assert.equal(countLiteral(source, 'removeAttribute('), 12);
  assert.equal(countLiteral(source, 'toggleAttribute('), 4);
  assert.equal(countLiteral(source, 'style.display'), 12);
  assert.equal(countLiteral(source, 'appendChild('), 5);
  assert.equal(countLiteral(source, '.remove('), 4);
  assert.equal(countLiteral(source, 'chrome.runtime?.sendMessage'), 2);
  assert.equal(countLiteral(source, 'chrome.runtime'), 4);
  assert.equal(countLiteral(source, 'addChannelDirectly'), 2);
  assert.equal(countLiteral(source, 'applyDOMFallback'), 2);
  assert.equal(countLiteral(source, 'injectFilterTubeMenuItem'), 2);

  for (const token of [
    'document references: 75',
    'window references: 35',
    'location references: 19',
    'document.querySelector occurrences: 12',
    'document.querySelectorAll occurrences: 10',
    'querySelector?.( occurrences: 12',
    'querySelectorAll( occurrences: 13',
    'closest?.( occurrences: 26',
    'matches?.( occurrences: 8',
    'document.createElement occurrences: 5',
    'addEventListener calls: 37',
    'removeEventListener calls: 1',
    'MutationObserver references: 6',
    'observe calls: 7',
    'disconnect calls: 2',
    'setTimeout calls: 16',
    'clearTimeout calls: 6',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'requestAnimationFrame calls: 4',
    'cancelAnimationFrame calls: 0',
    'innerHTML references: 0',
    'textContent references: 9',
    'setAttribute calls: 17',
    'removeAttribute calls: 12',
    'toggleAttribute calls: 4',
    'style.display references: 12',
    'appendChild calls: 5',
    'remove calls: 4',
    'chrome.runtime?.sendMessage calls: 2',
    'chrome.runtime references: 4',
    'addChannelDirectly references: 2',
    'applyDOMFallback references: 2',
    'injectFilterTubeMenuItem references: 2',
    'pendingShortsFetches, pendingWatchFetches, pendingDropdownFetches, dropdownVisibilityObservers, injectedDropdowns, scheduledDropdownInjections, processingDropdowns'
  ]) {
    assert.ok(text.includes(token), `missing block channel count token ${token}`);
  }
});

test('block channel source still proves current lifecycle mutation and no-export boundaries', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.match(source, /const isKidsSite = typeof location !== 'undefined' && location\.hostname\.includes\('youtubekids\.com'\)/);
  assert.match(source, /currentSettings\.enabled === false[\s\S]*currentSettings\.showQuickBlockButton !== true[\s\S]*currentSettings\.listMode === 'whitelist'/);
  assert.match(source, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(source, /Keep desktop work hover-lazy instead of disabling the affordance when lists are empty/);
  assert.match(source, /function setupQuickBlockObserver\(\)/);
  assert.match(source, /ensureQuickBlockStyles\(\)/);
  assert.match(source, /document\.addEventListener\('focusin'/);
  assert.match(source, /const observer = new MutationObserver\(\(mutations\) => \{/);
  assert.match(source, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(source, /document\.addEventListener\('yt-navigate-finish', \(\) => \{/);
  assert.doesNotMatch(source, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(source, /function setupMenuObserver\(\)/);
  assert.match(source, /function ensureDropdownVisibilityObserver\(dropdown\)/);
  assert.match(source, /async function handleDropdownAppearedInternal\(dropdown\)/);
  assert.match(source, /await injectFilterTubeMenuItem\(dropdown, videoCard\)/);
  assert.match(source, /async function runQuickBlockFallback\(context, info, source = 'quickBlock'\)/);
  assert.match(source, /chrome\.runtime\?\.sendMessage\(\{\s*type: 'addFilteredChannel'/);
  assert.match(source, /function applyQuickBlockImmediateHide\(videoCard, channelInfo\)/);
  assert.match(source, /targetToHide\.style\.display = 'none'/);
  assert.match(source, /setTimeout\(\(\) => applyDOMFallback\(null, \{ preserveScroll: true \}\), 120\)/);
  assert.match(source, /function setupKidsPassiveBlockListener\(\)/);
  assert.match(source, /async function handleKidsNativeBlock\(blockType = 'video', options = \{\}\)/);
  assert.match(source, /action: 'FilterTube_KidsBlockChannel'/);
  assert.match(source, /setTimeout\(\(\) => \{\s*setupMenuObserver\(\);\s*setupQuickBlockObserver\(\);\s*\}, 1000\)/);
  assert.doesNotMatch(source, /module\.exports/);

  for (const token of [
    'delayed boot entrypoint: setTimeout then setupMenuObserver and lazy setupQuickBlockObserver after 1000ms',
    'browser/global export: none',
    'CommonJS export: none',
    "quick block enabled gate: currentSettings.enabled !== false, currentSettings.showQuickBlockButton === true, and currentSettings.listMode !== 'whitelist'",
    'whitelist menu gate: isWhitelistModeActive then cleanupInjectedMenuItems',
    "quick-block mutation path: handleBlockChannelClick if present, else addChannelDirectly, else chrome.runtime?.sendMessage({ type: 'addFilteredChannel' })",
    "Kids mutation path: chrome.runtime?.sendMessage({ action: 'FilterTube_KidsBlockChannel' })",
    "optimistic hide path: markElementAsBlocked then style.display = 'none' then filtertube-hidden class and data-filtertube-hidden",
    "DOM fallback rerun path: setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120)",
    'dropdown injection dependency: injectFilterTubeMenuItem(dropdown, videoCard)',
    'identity dependencies: extractChannelFromCard, FilterTubeIdentity, sanitizeCollaboratorList, normalizeCollaboratorChannelInfoForCard, learned videoChannelMap',
    'clearInterval path: none',
    'removeEventListener path: dynamic pointermove recovery listener only'
  ]) {
    assert.ok(text.includes(token), `missing block channel boundary token ${token}`);
  }
});

test('block channel executable probes pin quick-block gates mutations hide and Kids sync', async () => {
  const text = doc();
  const ucAlpha = `UC${'A'.repeat(22)}`;
  const ucHidden = `UC${'H'.repeat(22)}`;

  const runtime = createBlockChannelRuntime();
  assert.equal(runtime.events.timers[0]?.delay, 1000);
  assert.equal(runtime.evaluate('isWhitelistModeActive()'), false);
  assert.equal(runtime.evaluate('isQuickBlockEnabled()'), true);

  const emptyRuntime = createBlockChannelRuntime({
    settings: {
      showQuickBlockButton: true,
      listMode: 'blocklist',
      filterChannels: [],
      filterKeywords: [],
      filterKeywordsComments: [],
      contentFilters: {
        duration: { enabled: false },
        uploadDate: { enabled: false },
        uppercase: { enabled: false }
      },
      categoryFilters: { enabled: false, selected: [] },
      videoChannelMap: {}
    }
  });
  assert.equal(emptyRuntime.evaluate('isQuickBlockEnabled()'), true);

  const disabledRuntime = createBlockChannelRuntime({
    settings: {
      enabled: false,
      showQuickBlockButton: true,
      listMode: 'blocklist'
    }
  });
  assert.equal(disabledRuntime.evaluate('isQuickBlockEnabled()'), false);

  runtime.context.currentSettings.listMode = 'whitelist';
  assert.equal(runtime.evaluate('isWhitelistModeActive()'), true);
  assert.equal(runtime.evaluate('isQuickBlockEnabled()'), false);
  runtime.context.currentSettings.listMode = 'blocklist';
  runtime.context.currentSettings.showQuickBlockButton = false;
  assert.equal(runtime.evaluate('isQuickBlockEnabled()'), false);
  runtime.context.currentSettings.showQuickBlockButton = true;

  const dropdown = new FakeElement('div');
  const staleMenuItem = new FakeElement('div', { className: 'filtertube-block-channel-item' });
  dropdown.appendChild(staleMenuItem);
  runtime.context.dropdown = dropdown;
  assert.equal(runtime.evaluate('injectedDropdowns.set(dropdown, { videoCardId: "old", isComplete: true }); injectedDropdowns.has(dropdown)'), true);
  assert.equal(runtime.evaluate('cleanupInjectedMenuItems(dropdown); injectedDropdowns.has(dropdown)'), false);
  assert.equal(dropdown.querySelectorAll('.filtertube-block-channel-item').length, 0);

  const card = new FakeElement('ytd-video-renderer');
  runtime.context.card = card;
  runtime.evaluate('ensureQuickBlockButton(card)');
  assert.ok(card.classList.contains('filtertube-quick-block-host'));
  assert.ok(card.querySelector('.filtertube-quick-block-wrap'));

  const deepHomeShortsCard = new FakeElement('ytd-rich-item-renderer');
  let deepLeaf = deepHomeShortsCard;
  for (let i = 0; i < 14; i++) {
    const child = new FakeElement('div');
    deepLeaf.appendChild(child);
    deepLeaf = child;
  }
  runtime.context.deepHomeShortsCard = deepHomeShortsCard;
  runtime.context.deepLeaf = deepLeaf;
  assert.equal(
    runtime.evaluate('findQuickBlockCardFromTarget(deepLeaf)'),
    deepHomeShortsCard,
    'quick-block hover target resolution must survive deep Home/Shorts markup'
  );

  const homeShortsRich = new FakeElement('ytd-rich-item-renderer');
  const homeShortsGrid = new FakeElement('div', { className: 'ytGridShelfViewModelGridShelfItem' });
  const homeShortsInner = new FakeElement('div', { className: 'shortsLockupViewModelHost' });
  const homeShortsAnchor = new FakeElement('a', { attrs: { href: '/shorts/abcDEF12345' } });
  homeShortsRich.appendChild(homeShortsGrid);
  homeShortsGrid.appendChild(homeShortsInner);
  homeShortsInner.appendChild(homeShortsAnchor);
  runtime.context.homeShortsAnchor = homeShortsAnchor;
  runtime.context.homeShortsInner = homeShortsInner;
  runtime.context.homeShortsRich = homeShortsRich;
  assert.equal(
    runtime.evaluate('findQuickBlockCardFromTarget(homeShortsAnchor)'),
    homeShortsInner,
    'desktop hover still starts from the nearest nested Shorts host'
  );
  runtime.evaluate('ensureQuickBlockButton(homeShortsInner)');
  assert.ok(homeShortsRich.classList.contains('filtertube-quick-block-host'));
  assert.ok(homeShortsRich.querySelector('.filtertube-quick-block-wrap'));
  assert.equal(homeShortsInner.querySelector('.filtertube-quick-block-wrap'), null);

  runtime.context.currentSettings.listMode = 'whitelist';
  runtime.evaluate('ensureQuickBlockButton(card)');
  assert.equal(card.querySelector('.filtertube-quick-block-wrap'), null);

  runtime.context.currentSettings.listMode = 'blocklist';
  const contextObject = { base: { videoId: 'abcDEF12345' }, videoId: 'abcDEF12345' };
  const actionInfo = {
    channelInfo: {
      isBlockAllOption: true,
      collaborationGroupId: 'group-1',
      allCollaborators: [
        { id: ucAlpha, handle: '@Alpha', name: 'Alpha', videoId: 'abcDEF12345' },
        { handle: '@Beta', customUrl: 'c/Beta', name: 'Beta', videoId: 'abcDEF12345' }
      ]
    }
  };
  const directFallbackResult = await runtime.evaluate('runQuickBlockFallback')(contextObject, actionInfo, 'quickBlockTest');
  assert.equal(directFallbackResult.success, true);
  assert.equal(directFallbackResult.successCount, 2);
  assert.equal(runtime.events.addChannelCalls.length, 2);
  assert.equal(runtime.events.addChannelCalls[0].input, ucAlpha);
  assert.deepEqual(runtime.events.addChannelCalls[0].otherChannels, ['@Beta']);
  assert.equal(runtime.events.addChannelCalls[0].metadata.source, 'quickBlockTest');
  assert.equal(runtime.events.addChannelCalls[1].input, 'c/Beta');
  assert.deepEqual(runtime.events.addChannelCalls[1].otherChannels, ['@Alpha']);

  const backgroundRuntime = createBlockChannelRuntime({ includeAddChannelDirectly: false });
  const backgroundFallbackResult = await backgroundRuntime.evaluate('runQuickBlockFallback')(
    { base: { videoId: 'abcDEF12345' }, videoId: 'abcDEF12345' },
    { channelInfo: { handle: '@Gamma', name: 'Gamma', videoId: 'abcDEF12345' } },
    'quickBlock'
  );
  assert.equal(backgroundFallbackResult.success, true);
  assert.equal(backgroundFallbackResult.successCount, 1);
  assert.equal(backgroundRuntime.events.runtimeMessages[0].type, 'addFilteredChannel');
  assert.equal(backgroundRuntime.events.runtimeMessages[0].input, '@Gamma');
  assert.equal(backgroundRuntime.events.runtimeMessages[0].profile, 'main');

  const hiddenCard = new FakeElement('ytm-video-with-context-renderer');
  runtime.context.hiddenCard = hiddenCard;
  runtime.evaluate(`applyQuickBlockImmediateHide(hiddenCard, { id: "${ucHidden}" })`);
  assert.equal(hiddenCard.style.display, 'none');
  assert.ok(hiddenCard.classList.contains('filtertube-hidden'));
  assert.equal(hiddenCard.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(runtime.events.markCalls[0].state, 'pending');

  const kidsRuntime = createBlockChannelRuntime({
    hostname: 'www.youtubekids.com',
    pathname: '/watch',
    search: '?v=kidVID12345',
    includeAddChannelDirectly: false
  });
  kidsRuntime.evaluate('lastKidsMenuContext = { ts: Date.now(), videoId: "kidVID12345", channelName: "Kid Channel", channelId: "", channelHandle: "@kid", customUrl: "" }');
  await kidsRuntime.evaluate('handleKidsNativeBlock')('video', { source: 'toast' });
  await kidsRuntime.evaluate('handleKidsNativeBlock')('video', { source: 'late-toast' });
  assert.equal(kidsRuntime.events.runtimeMessages.length, 1);
  assert.equal(kidsRuntime.events.runtimeMessages[0].action, 'FilterTube_KidsBlockChannel');
  assert.equal(kidsRuntime.events.runtimeMessages[0].videoId, 'kidVID12345');
  assert.equal(kidsRuntime.events.runtimeMessages[0].channel.handle, '@kid');
  assert.equal(kidsRuntime.events.runtimeMessages[0].channel.originalInput, '@kid');
  assert.equal(kidsRuntime.events.runtimeMessages[0].channel.source, 'kidsNativeVideo');

  for (const token of [
    'File-Local Executable Behavior Proof',
    'quick-block enabled gate proof: executable',
    'whitelist cleanup proof: executable',
    'quick-block DOM lifecycle proof: executable',
    'direct mutation fallback proof: executable',
    'background mutation fallback proof: executable',
    'optimistic hide proof: executable',
    'Kids native sync proof: executable'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }
});

test('block channel register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'quickBlockEnabledState',
    'whitelistModeState',
    'hostSelector',
    'targetSelector',
    'dropdownSelector',
    'kidsSelector',
    'identityConfidence',
    'collaboratorSet',
    'senderClass',
    'mutationMessage',
    'optimisticHideEffect',
    'fallbackApplyEffect',
    'menuInjectionEffect',
    'kidsNativeEffect',
    'lifecyclePrimitive',
    'observerOwner',
    'listenerOwner',
    'timerOwner',
    'intervalOwner',
    'teardownPolicy',
    'disabledNoWorkBudget',
    'emptyRuleBudget',
    'overlayPausePolicy',
    'viewportBudget',
    'hoverBudget',
    'staleDropdownPolicy',
    'duplicateSuppressionPolicy',
    'positiveQuickBlockFixture',
    'positiveDropdownFixture',
    'positiveKidsNativeFixture',
    'negativeDisabledFixture',
    'negativeWhitelistFixture',
    'negativeOverlayFixture',
    'negativeSiblingVisibleFixture',
    'negativeMalformedIdentityFixture',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks block channel method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'blockChannelMethodAuthority',
    'blockChannelQuickBlockLifecycleContract',
    'blockChannelQuickBlockActionReport',
    'blockChannelAffordanceNoWorkBudget',
    'blockChannelSelectorTargetReport',
    'blockChannelOptimisticHideReport',
    'blockChannelDropdownObserverRegistry',
    'blockChannelKidsNativeSyncContract',
    'blockChannelMutationSenderContract',
    'blockChannelFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
