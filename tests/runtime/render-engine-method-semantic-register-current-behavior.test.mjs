import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/render_engine.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function sourceStats() {
  const buffer = readBuffer(sourcePath);
  const source = buffer.toString('utf8');
  return {
    bytes: buffer.length,
    sha256: sha256(sourcePath),
    splitLines: source.split(/\r?\n/).length,
    wcLines: (source.match(/\n/g) || []).length
  };
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

function groupForMethod(name) {
  if (['getStateManager', 'getUIComponents', 'getSettings', 'scheduleIdle', 'cancelIdle', 'safeTimestamp'].includes(name)) return 'dependencyAndSchedulingHelpers';
  if (['createPillBadge', 'applySourceClasses', 'createSourceBadge', 'createKidsSyncBadge', 'createCollaborationBadge'].includes(name)) return 'badgeAndSourceDecoration';
  if ([
    'normalizeChannelHandle',
    'decodeChannelDisplayValue',
    'normalizeChannelCustomPath',
    'getChannelPageUrl',
    'getChannelDisplayName',
    'createChannelNameNode',
    'isTopicChannel',
    'getTopicChannelTooltip',
    'deriveChannelMapping'
  ].includes(name)) return 'channelDisplayIdentityHelpers';
  if (['renderKeywordList', 'createKeywordListItem', 'findChannelByRef', 'createFallbackExactToggle', 'createFallbackDeleteButton'].includes(name)) return 'keywordRenderingAndRowActions';
  if ([
    'renderChannelList',
    'createChannelListItem',
    'createMinimalChannelItem',
    'createFullChannelItem',
    'createNodeMapping',
    'createFilterAllToggle',
    'createFallbackFilterAllToggle'
  ].includes(name)) return 'channelRenderingAndRowActions';
  if (['groupChannelsByCollaboration', 'buildCollaborationMeta', 'matchesCollaborator'].includes(name)) return 'collaborationGrouping';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    let match = line.match(/^\s{4}(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
      return;
    }

    match = line.match(/^\s{4}const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
    if (match) {
      const name = match[1];
      rows.push({
        line: index + 1,
        kind: /async/.test(line) ? 'async const arrow' : 'const arrow',
        name,
        group: groupForMethod(name)
      });
    }
  });
  return rows;
}

function broadCallableRows() {
  const source = read(sourcePath);
  const re = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  const rows = [];
  let match;
  while ((match = re.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  return rows;
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}return\s+\{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    const match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*),?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countNames(rows) {
  const out = {};
  for (const name of rows) out[name] = (out[name] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function stateManagerCalls() {
  const source = read(sourcePath);
  const calls = [];
  for (const match of source.matchAll(/StateManager\?\.([A-Za-z_$][\w$]*)(?:\?\.)?\(/g)) {
    calls.push(match[1]);
  }
  return calls;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

class MiniNode {}

class MiniClassList {
  constructor(element) {
    this.element = element;
  }

  values() {
    return String(this.element.className || '').split(/\s+/).filter(Boolean);
  }

  write(values) {
    this.element.className = [...values].join(' ');
  }

  add(...tokens) {
    const values = new Set(this.values());
    for (const token of tokens) {
      if (token) values.add(token);
    }
    this.write(values);
  }

  remove(...tokens) {
    const values = new Set(this.values());
    for (const token of tokens) values.delete(token);
    this.write(values);
  }

  contains(token) {
    return this.values().includes(token);
  }
}

class MiniElement extends MiniNode {
  constructor(tagName) {
    super();
    this.tagName = String(tagName).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.eventListeners = new Map();
    this.className = '';
    this._innerHTML = '';
    this._textContent = '';
    this.classList = new MiniClassList(this);
  }

  appendChild(node) {
    if (node instanceof MiniDocumentFragment) {
      for (const child of [...node.children]) this.appendChild(child);
      node.children = [];
      return node;
    }
    if (!(node instanceof MiniNode)) return node;
    node.parentNode = this;
    this.children.push(node);
    this._innerHTML = '';
    return node;
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
    this.children = [];
    this._innerHTML = '';
  }

  get textContent() {
    if (this.children.length > 0) return this.children.map((child) => child.textContent || '').join('');
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = String(value ?? '');
    this._textContent = '';
    this.children = [];
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map((child) => child.innerHTML || child.textContent || '').join('');
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name === 'class') this.className = stringValue;
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = stringValue;
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, listener) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }
}

class MiniDocumentFragment extends MiniNode {
  constructor() {
    super();
    this.children = [];
    this.parentNode = null;
  }

  appendChild(node) {
    if (!(node instanceof MiniNode)) return node;
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  get textContent() {
    return this.children.map((child) => child.textContent || '').join('');
  }
}

class MiniDocument {
  createElement(tagName) {
    return new MiniElement(tagName);
  }

  createDocumentFragment() {
    return new MiniDocumentFragment();
  }
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseRenderState(overrides = {}) {
  return {
    mode: 'blocklist',
    syncKidsToMain: false,
    keywords: [],
    whitelistKeywords: [],
    channels: [],
    whitelistChannels: [],
    channelMap: {},
    kids: {
      mode: 'blocklist',
      blockedKeywords: [],
      blockedChannels: [],
      whitelistKeywords: [],
      whitelistChannels: []
    },
    ...overrides
  };
}

function loadRenderEngineRuntime(options = {}) {
  const calls = [];
  const timers = [];
  const canceledTimerIds = [];
  const state = plain(options.state || baseRenderState());

  const context = {
    console: { log() {}, warn() {}, error() {} },
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    Set,
    Map,
    Node: MiniNode,
    document: new MiniDocument(),
    setTimeout(fn, delayMs) {
      const id = timers.length + 1;
      timers.push({ id, fn, delayMs });
      return id;
    },
    clearTimeout(id) {
      canceledTimerIds.push(id);
    },
    StateManager: {
      getState() {
        calls.push(['getState']);
        return state;
      },
      async toggleKeywordComments(word) {
        calls.push(['toggleKeywordComments', word]);
      },
      async toggleKeywordExact(word) {
        calls.push(['toggleKeywordExact', word]);
      },
      async toggleKidsKeywordExact(word) {
        calls.push(['toggleKidsKeywordExact', word]);
      },
      async removeKeyword(word) {
        calls.push(['removeKeyword', word]);
      },
      async removeKidsKeyword(word) {
        calls.push(['removeKidsKeyword', word]);
      },
      async toggleChannelFilterAllCommentsByRef(ref) {
        calls.push(['toggleChannelFilterAllCommentsByRef', ref]);
      },
      async toggleChannelFilterAll(index) {
        calls.push(['toggleChannelFilterAll', index]);
      },
      async toggleKidsChannelFilterAll(index) {
        calls.push(['toggleKidsChannelFilterAll', index]);
      },
      async removeChannel(index) {
        calls.push(['removeChannel', index]);
      },
      async removeKidsChannel(index) {
        calls.push(['removeKidsChannel', index]);
      }
    },
    FilterTubeSettings: {
      getChannelDerivedKey(channel) {
        return String(channel?.id || channel?.handle || channel?.customUrl || channel?.name || '').toLowerCase();
      },
      syncFilterAllKeywords(keywords, channels) {
        const base = Array.isArray(keywords) ? keywords.map(plain) : [];
        const derived = (Array.isArray(channels) ? channels : [])
          .filter((channel) => channel?.filterAll === true)
          .map((channel) => ({
            word: channel.name || channel.handle || channel.id || '',
            exact: true,
            comments: channel.filterAllComments !== false,
            source: 'channel',
            channelRef: String(channel?.id || channel?.handle || channel?.customUrl || channel?.name || '').toLowerCase(),
            addedAt: channel.addedAt || 0
          }));
        return [...base, ...derived];
      }
    }
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);

  return {
    RenderEngine: context.RenderEngine,
    document: context.document,
    calls,
    timers,
    canceledTimerIds
  };
}

function walk(node, visit) {
  if (!(node instanceof MiniNode)) return;
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

function allByClass(node, className) {
  const matches = [];
  walk(node, (current) => {
    if (current.classList?.contains(className)) matches.push(current);
  });
  return matches;
}

function firstByClass(node, className) {
  const match = allByClass(node, className)[0];
  assert.ok(match, `expected node with class ${className}`);
  return match;
}

function firstByTag(node, tagName) {
  let match = null;
  walk(node, (current) => {
    if (!match && current.tagName === tagName.toUpperCase()) match = current;
  });
  assert.ok(match, `expected ${tagName} node`);
  return match;
}

function rowContaining(container, text) {
  const match = container.children.find((child) => child.textContent.includes(text));
  assert.ok(match, `expected row containing ${text}`);
  return match;
}

async function fire(element, type, eventInit = {}) {
  const listeners = element.eventListeners.get(type) || [];
  const event = {
    ...eventInit,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    }
  };
  for (const listener of listeners) await listener(event);
  return event;
}

test('render engine method semantic register is scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior register/);
  assert.match(text, /Runtime behavior now includes channel source\s+filtering and managed-list source badges/);
  assert.match(text, /source file: js\/render_engine\.js/);
  assert.match(text, /IIFE-scoped declarations: 35/);
  assert.match(text, /plain function declarations: 30/);
  assert.match(text, /const arrow helper declarations: 5/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /public API entries: 4/);
  assert.match(text, /semantic method groups: 6/);
  assert.match(text, /row-action listener sites: 7/);
  assert.match(text, /direct StateManager optional calls: 26/);
  assert.match(text, /unique StateManager methods reached: 11/);
  assert.match(text, /querySelector calls: 0/);
  assert.match(text, /not completion proof for every UI control/);
});

test('render engine register pins source fingerprint and broad callable reconciliation', () => {
  const stats = sourceStats();
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countNames(broadRows);
  const controlArtifacts = (broadCounts.if || 0) + (broadCounts.while || 0);
  const heldOutsideRegister = broadRows.length - rows.length - controlArtifacts;
  const text = doc();

  assert.deepEqual(stats, {
    bytes: 60425,
    sha256: 'b649683b280482864cabc5d5ee1099aa660d6e864a1606307409a22c95e75800',
    splitLines: 1413,
    wcLines: 1412
  });
  assert.equal(broadRows.length, 127);
  assert.equal(controlArtifacts, 86);
  assert.equal(heldOutsideRegister, 6);
  assert.deepEqual({
    if: broadCounts.if,
    while: broadCounts.while
  }, {
    if: 85,
    while: 1
  });

  for (const expected of [
    'source split lines: 1413',
    'source wc -l: 1412',
    'source bytes: 60425',
    'source sha256: b649683b280482864cabc5d5ee1099aa660d6e864a1606307409a22c95e75800',
    'broad lexical callable matches: 127',
    'accepted IIFE-scoped declaration rows: 35',
    'semantic method rows promoted: 35',
    'control-flow lexical artifacts: 86 (`if`: 85, `while`: 1)',
    'local/render callback declarations held outside this IIFE method register: 6',
    'executable current-behavior probes: 7'
  ]) {
    assert.ok(text.includes(expected), `missing source reconciliation line ${expected}`);
  }
});

test('render engine register accounts for every current IIFE-scoped declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 35);
  assert.deepEqual(countBy(rows, 'kind'), {
    'const arrow': 5,
    function: 30
  });
  assert.deepEqual(countBy(rows, 'group'), {
    badgeAndSourceDecoration: 5,
    channelDisplayIdentityHelpers: 9,
    channelRenderingAndRowActions: 7,
    collaborationGrouping: 3,
    dependencyAndSchedulingHelpers: 6,
    keywordRenderingAndRowActions: 5
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('render engine register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing RenderEngine method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  const publicRows = publicApiRows();
  assert.deepEqual(publicRows.map((row) => row.name), [
    'renderKeywordList',
    'renderChannelList',
    'createKeywordListItem',
    'createChannelListItem'
  ]);
  for (const name of publicRows.map((row) => row.name)) {
    assert.ok(text.includes(name), `missing public API entry ${name}`);
  }
});

test('render engine register pins current row-action DOM and scheduler surface', () => {
  const source = read(sourcePath);
  const text = doc();
  const calls = stateManagerCalls();

  assert.equal(calls.length, 26);
  assert.deepEqual([...new Set(calls)].sort(), [
    'getState',
    'removeChannel',
    'removeKeyword',
    'removeKidsChannel',
    'removeKidsKeyword',
    'toggleChannelFilterAll',
    'toggleChannelFilterAllCommentsByRef',
    'toggleKeywordComments',
    'toggleKeywordExact',
    'toggleKidsChannelFilterAll',
    'toggleKidsKeywordExact'
  ]);

  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 7);
  assert.equal((source.match(/document\.createElement\(/g) || []).length, 30);
  assert.equal((source.match(/document\.createDocumentFragment\(/g) || []).length, 1);
  assert.equal((source.match(/\.innerHTML\s*=/g) || []).length, 10);
  assert.equal((source.match(/\.setAttribute\(/g) || []).length, 12);
  assert.equal((source.match(/querySelector(All)?\(/g) || []).length, 0);

  for (const token of [
    'row-action listener sites: 7',
    'document.createElement calls: 30',
    'document.createDocumentFragment calls: 1',
    'innerHTML writes: 10',
    'setAttribute calls: 12',
    'querySelector calls: 0'
  ]) {
    assert.ok(text.includes(token), `missing current DOM surface token ${token}`);
  }
});

test('render engine source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /const state = stateOverride \|\| StateManager\?\.getState\(\)/);
  assert.match(source, /const mainMode = state\?\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(source, /const kidsMode = state\?\.kids\?\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(source, /if \(profile !== 'kids' && state\.syncKidsToMain && kidsMode === mainMode\)/);
  assert.match(source, /displayKeywords = \[\.\.\.displayKeywords, \.\.\.kidsOnly\]/);
  assert.match(source, /container\.innerHTML = ''/);
  assert.match(source, /createKeywordListItem\(entry, \{ minimal, profile: effectiveProfile/);

  assert.match(source, /await StateManager\?\.toggleChannelFilterAllCommentsByRef\?\.\(entry\.channelRef\)/);
  assert.match(source, /await StateManager\?\.toggleKeywordComments\(entry\.word\)/);
  assert.match(source, /await StateManager\?\.toggleKidsKeywordExact\?\.\(entry\.word\)/);
  assert.match(source, /await StateManager\?\.removeKidsKeyword\?\.\(entry\.word\)/);
  assert.match(source, /await StateManager\?\.removeKeyword\(entry\.word\)/);

  assert.match(source, /cancelIdle\(container\.__ftChannelRenderTaskId\)/);
  assert.match(source, /container\.__ftChannelRenderGen = \(container\.__ftChannelRenderGen \|\| 0\) \+ 1/);
  assert.match(source, /if \(container\.__ftChannelRenderGen !== renderGen\) return/);
  assert.match(source, /container\.__ftChannelRenderTaskId = scheduleIdle\(processBatch\)/);
  assert.match(source, /const batchSize = minimal \? 80 : 60/);

  assert.match(source, /if \(effectiveMode === 'whitelist'\) \{[\s\S]*spacer\.style\.visibility = 'hidden'/);
  assert.match(source, /await StateManager\?\.toggleKidsChannelFilterAll\?\.\(index\)/);
  assert.match(source, /await StateManager\?\.toggleChannelFilterAll\(index\)/);
  assert.match(source, /await StateManager\?\.removeKidsChannel\?\.\(index\)/);
  assert.match(source, /await StateManager\?\.removeChannel\(index\)/);

  assert.match(source, /link\.rel = 'noopener noreferrer'/);
  assert.match(source, /return 'Topic channels do not have @handles or custom URLs/);
  assert.match(source, /return \{ source, target, isResolved \}/);
});

test('render engine executable probes keyword row source selection and fallback row actions', async () => {
  const mainChannel = { id: 'UCMAIN', name: 'Main Channel', source: 'comments', filterAll: true, filterAllComments: false, addedAt: 110 };
  const runtime = loadRenderEngineRuntime({
    state: baseRenderState({
      syncKidsToMain: true,
      keywords: [
        { word: 'alpha', exact: false, comments: true, addedAt: 100 },
        { word: 'bravo', exact: true, comments: false, addedAt: 80 },
        { word: 'Main Channel', exact: true, comments: false, source: 'channel', channelRef: 'ucmain', addedAt: 110 }
      ],
      channels: [mainChannel],
      kids: {
        mode: 'blocklist',
        blockedKeywords: [
          { word: 'alpha', exact: false, comments: true, addedAt: 120 },
          { word: 'kidonly', exact: false, comments: true, addedAt: 90 }
        ],
        blockedChannels: [
          { id: 'UCKID', name: 'Kid Channel', filterAll: true, filterAllComments: true, addedAt: 95 }
        ],
        whitelistKeywords: [],
        whitelistChannels: []
      }
    })
  });

  const container = runtime.document.createElement('div');
  runtime.RenderEngine.renderKeywordList(container, {
    profile: 'main',
    showSort: true,
    sortValue: 'newest',
    includeToggles: true
  });

  assert.equal(container.children.length, 5);
  assert.deepEqual(container.children.map((row) => row.textContent.includes('alpha')).filter(Boolean), [true]);
  assert.ok(rowContaining(container, 'Main Channel').classList.contains('channel-derived'));
  assert.ok(rowContaining(container, 'Kid Channel').classList.contains('channel-derived'));
  assert.ok(rowContaining(container, 'kidonly').classList.contains('source-kids'));

  const alphaRow = rowContaining(container, 'alpha');
  await fire(firstByClass(alphaRow, 'toggle-variant-blue'), 'click');
  const alphaExactToggle = allByClass(alphaRow, 'exact-toggle').find((node) => node.textContent === 'Exact');
  assert.ok(alphaExactToggle, 'expected user keyword exact toggle');
  const keyEvent = await fire(alphaExactToggle, 'keydown', { key: ' ' });
  assert.equal(keyEvent.defaultPrevented, true);
  await fire(firstByClass(alphaRow, 'delete-btn'), 'click');

  const derivedRow = rowContaining(container, 'Main Channel');
  await fire(firstByClass(derivedRow, 'toggle-variant-blue'), 'click');

  assert.deepEqual(runtime.calls.filter(([name]) => name !== 'getState'), [
    ['toggleKeywordComments', 'alpha'],
    ['toggleKeywordExact', 'alpha'],
    ['removeKeyword', 'alpha'],
    ['toggleChannelFilterAllCommentsByRef', 'ucmain']
  ]);
  assert.match(doc(), /Main keyword rendering merges synced Kids-only entries,\s+de-duplicates a Kids\s+duplicate by lowercase word/);
});

test('render engine executable probes channel row actions, outbound link safety, and whitelist spacer', async () => {
  const channel = {
    id: 'UCMAIN',
    name: 'Main Channel',
    handle: '@main',
    originalInput: '@main',
    filterAll: false,
    addedAt: 1
  };
  const runtime = loadRenderEngineRuntime({
    state: baseRenderState({ channels: [channel] })
  });
  const overrideCalls = [];

  const row = runtime.RenderEngine.createChannelListItem(channel, 3, {
    profile: 'main',
    showNodeMapping: true,
    onToggleFilterAll: async () => overrideCalls.push('override')
  });
  const link = firstByTag(row, 'a');
  assert.equal(link.href, 'https://www.youtube.com/@main');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');

  await fire(firstByClass(row, 'toggle-variant-red'), 'click');
  await fire(firstByClass(row, 'delete-btn'), 'click');
  assert.deepEqual(overrideCalls, []);
  assert.deepEqual(runtime.calls.filter(([name]) => name !== 'getState'), [
    ['toggleChannelFilterAll', 3],
    ['removeChannel', 3]
  ]);

  const kidsRuntime = loadRenderEngineRuntime({
    state: baseRenderState({
      kids: {
        mode: 'blocklist',
        blockedKeywords: [],
        blockedChannels: [channel],
        whitelistKeywords: [],
        whitelistChannels: []
      }
    })
  });
  const kidsRow = kidsRuntime.RenderEngine.createChannelListItem(channel, 1, { profile: 'kids' });
  await fire(firstByClass(kidsRow, 'toggle-variant-red'), 'click');
  await fire(firstByClass(kidsRow, 'delete-btn'), 'click');
  assert.deepEqual(kidsRuntime.calls.filter(([name]) => name !== 'getState'), [
    ['toggleKidsChannelFilterAll', 1],
    ['removeKidsChannel', 1]
  ]);

  const whitelistRuntime = loadRenderEngineRuntime({
    state: baseRenderState({
      mode: 'whitelist',
      whitelistChannels: [channel]
    })
  });
  const whitelistRow = whitelistRuntime.RenderEngine.createChannelListItem(channel, 0, { profile: 'main' });
  const spacer = firstByClass(whitelistRow, 'filter-all-toggle');
  assert.ok(spacer.classList.contains('disabled'));
  assert.equal(spacer.style.visibility, 'hidden');
  assert.equal((spacer.eventListeners.get('click') || []).length, 0);
  assert.match(doc(), /Fallback Filter All currently bypasses `onToggleFilterAll` and dispatches to\s+`StateManager`/);
});

test('render engine executable probes channel source filter and managed list badge', () => {
  const manual = {
    id: 'UCmanual0000000000000000',
    name: 'Manual Channel',
    addedAt: 3
  };
  const listA = {
    id: 'UClista00000000000000000',
    name: 'List A Channel',
    managedListId: 'family-list',
    managedListName: 'Family List',
    addedAt: 2
  };
  const listB = {
    id: 'UClistb00000000000000000',
    name: 'List B Channel',
    managedListId: 'study-list',
    managedListName: 'Study List',
    addedAt: 1
  };
  const runtime = loadRenderEngineRuntime({
    state: baseRenderState({ channels: [manual, listA, listB] })
  });
  const container = runtime.document.createElement('div');

  runtime.RenderEngine.renderChannelList(container, {
    profile: 'main',
    sourceFilter: 'lists'
  });
  assert.equal(container.children.length, 2);
  assert.ok(container.textContent.includes('List A Channel'));
  assert.ok(container.textContent.includes('List B Channel'));
  assert.ok(!container.textContent.includes('Manual Channel'));
  assert.ok(container.textContent.includes('List: Family List'));

  runtime.RenderEngine.renderChannelList(container, {
    profile: 'main',
    sourceFilter: 'list:study-list'
  });
  assert.equal(container.children.length, 1);
  assert.ok(container.textContent.includes('List B Channel'));
  assert.ok(!container.textContent.includes('List A Channel'));

  runtime.RenderEngine.renderChannelList(container, {
    profile: 'main',
    sourceFilter: 'manual'
  });
  assert.equal(container.children.length, 1);
  assert.ok(container.textContent.includes('Manual Channel'));
  assert.ok(!container.textContent.includes('List:'));
});

test('render engine executable probes channel idle batching and stale task cancellation', () => {
  const channels = Array.from({ length: 65 }, (_, index) => ({
    id: `UC${String(index).padStart(22, '0')}`,
    name: `Channel ${index}`,
    filterAll: false,
    addedAt: index
  }));
  const runtime = loadRenderEngineRuntime({
    state: baseRenderState({ channels })
  });
  const container = runtime.document.createElement('div');
  container.__ftChannelRenderTaskId = 77;

  runtime.RenderEngine.renderChannelList(container, {
    profile: 'main',
    showSort: true,
    sortValue: 'oldest'
  });

  assert.deepEqual(runtime.canceledTimerIds, [77]);
  assert.equal(container.children.length, 60);
  assert.equal(runtime.timers.length, 1);
  assert.equal(container.__ftChannelRenderTaskId, 1);

  runtime.timers[0].fn({ didTimeout: true, timeRemaining: () => 0 });

  assert.equal(container.children.length, 65);
  assert.equal(container.__ftChannelRenderTaskId, 0);
  assert.match(doc(), /Channel rendering cancels a previous container task,\s+appends the first 60\s+full rows immediately/);
});

test('render engine register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerUi',
    'profileType',
    'profileId',
    'listModeInput',
    'stateSource',
    'stateOverridePolicy',
    'visibleRows',
    'syncedKidsRows',
    'sortFilterPolicy',
    'domWriteEffect',
    'listenerEffect',
    'keyboardEffect',
    'stateManagerMutationEffect',
    'uiComponentFallbackPolicy',
    'idleRenderBudget',
    'renderCancellationBoundary',
    'emptyStateBehavior',
    'whitelistSpacerBehavior',
    'identityDisplayPolicy',
    'channelMappingPolicy',
    'collaborationDisplayPolicy',
    'accessibilityFixture',
    'positiveFixture',
    'negativeModeFixture',
    'negativeCallbackFixture',
    'negativeSiblingFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks render engine method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'renderEngineMethodAuthority',
    'renderEngineRowActionContract',
    'renderEngineDomEffectReport',
    'renderEngineIdleRenderBudget',
    'renderEngineVisibleRowParityReport',
    'renderEngineAccessibilityContract',
    'renderEngineIdentityDisplayPolicy'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
