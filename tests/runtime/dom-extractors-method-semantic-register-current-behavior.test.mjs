import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/dom_extractors.js';
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

function doc() {
  return read(docPath);
}

function source() {
  return read(sourcePath);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function broadCallableRows() {
  const rows = [];
  const src = source();
  let match;
  while ((match = broadCallableRe.exec(src))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function countBy(values) {
  const out = {};
  for (const value of values) out[value] = (out[value] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function topLevelFunctions(text) {
  const rows = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  });
  return rows;
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
    this.dataset = { ...(options.dataset || {}) };
    this.style = { ...(options.style || {}) };
    this.textContent = options.textContent || '';
    this.innerText = options.innerText || this.textContent || '';
    this.href = options.href || '';
    this.className = options.className || '';
    this.data = options.data;
    this.__data = options.__data;
    this.__dataHost = options.__dataHost;
    for (const [key, value] of Object.entries(options.attrs || {})) {
      this.setAttribute(key, value);
    }
    if (this.href && !this.hasAttribute('href')) this.setAttribute('href', this.href);
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
    const stringValue = String(value);
    this.attributes.set(String(name), stringValue);
    if (name === 'href') this.href = stringValue;
    if (name === 'class') this.className = stringValue;
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
    if (name === 'href') this.href = '';
    if (name === 'class') this.className = '';
  }

  getAttributeNames() {
    return [...this.attributes.keys()];
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child.contains?.(node));
  }

  matches(selector) {
    if (!selector) return false;
    return String(selector).split(',').some((part) => this.matchesOne(part.trim()));
  }

  matchesOne(selector) {
    if (!selector || selector === ':scope') return false;
    selector = selector.replace(/:not\([^)]*\)/g, '').replace(/^:scope\s*>\s*/, '').trim();
    if (selector.includes(' ')) {
      selector = selector.split(/\s+/).pop();
    }
    const tagMatch = selector.match(/^([a-z0-9-]+)/i);
    if (tagMatch && tagMatch[1].toLowerCase() !== this.tagName.toLowerCase()) return false;
    const idMatch = selector.match(/#([A-Za-z0-9_-]+)/);
    if (idMatch && this.getAttribute('id') !== idMatch[1]) return false;
    for (const classMatch of selector.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
      if (!this.classList.contains(classMatch[1])) return false;
    }
    for (const attrMatch of selector.matchAll(/\[([^\]=~*^$|\s]+)([*^$|~]?=)?(?:"([^"]*)"|'([^']*)'|([^\]]+))?\]/g)) {
      const attr = attrMatch[1];
      const operator = attrMatch[2] || '';
      const expected = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? '';
      const value = this.getAttribute(attr) || '';
      if (!this.hasAttribute(attr)) return false;
      if (operator === '*=' && !value.includes(expected)) return false;
      if (operator === '^=' && !value.startsWith(expected)) return false;
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

function createDomExtractorRuntime({ hostname = 'www.youtube.com', origin = 'https://www.youtube.com' } = {}) {
  const elementsById = new Map();
  const context = {
    console: {
      errors: [],
      error(...args) {
        this.errors.push(args);
      }
    },
    location: { hostname },
    document: {
      location: { origin },
      getElementById(id) {
        return elementsById.get(id) || null;
      }
    },
    window: {},
    URL,
    Element: FakeElement,
    Node: FakeNode,
    extractHandleFromString(value) {
      const match = String(value || '').match(/@([A-Za-z0-9._-]+)/);
      return match ? `@${match[1].toLowerCase()}` : '';
    },
    normalizeHandleValue(value) {
      const text = String(value || '').trim();
      if (!text) return '';
      const bare = text.startsWith('@') ? text.slice(1) : text;
      return bare ? `@${bare.toLowerCase()}` : '';
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source(), context);
  return {
    context,
    elementsById,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    }
  };
}

test('DOM extractors method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /does not change product\s+runtime behavior/);
  assert.match(text, /does not open the implementation gate/);
  assert.match(text, /Scope: `js\/content\/dom_extractors\.js`/);
  assert.match(text, /The complete audit remains open/);
});

test('DOM extractors register accounts for every current top-level function row', () => {
  const text = doc();
  const src = source();
  const rows = topLevelFunctions(src);
  const broadRows = broadCallableRows();
  const broadCounts = countBy(broadRows);

  assert.equal(src.split(/\r?\n/).length, 1103);
  assert.equal(src.endsWith('\n') ? src.split(/\r?\n/).length - 1 : src.split(/\r?\n/).length, 1102);
  assert.equal(readBuffer(sourcePath).byteLength, 45149);
  assert.equal(sha256(sourcePath), '3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237');
  assert.equal(rows.length, 18);
  assert.match(text, /1,103 source lines/);
  assert.match(text, /wc line count: 1102/);
  assert.match(text, /source bytes: 45149/);
  assert.match(text, /source sha256: 3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237/);
  assert.match(text, /repo-wide broad parser lexical callable matches: 114/);
  assert.match(text, /broad parser declaration\/inventory matches: 23/);
  assert.match(text, /assignment-expression function declarations outside broad parser: 0/);
  assert.match(text, /control-flow lexical artifacts: 91/);
  assert.match(text, /file-local executable proof probes: 7/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /18 top-level\s+function declarations/);
  assert.match(text, /0 async\s+function declarations/);
  assert.match(text, /5 local const arrow or\s+IIFE result declarations/);
  assert.match(text, /23\s+arrow token sites/);
  assert.match(text, /47 `VIDEO_CARD_SELECTORS`\s+entries/);
  assert.match(text, /5 semantic method\s+groups/);

  for (const row of rows) {
    assert.ok(text.includes(`| ${row.line} | \`${row.name}`), `missing method row for ${row.name}`);
  }

  assert.equal(broadRows.length, 114);
  assert.equal(broadCounts.if, 80);
  assert.equal(broadCounts.for, 11);
  assert.equal(broadRows.filter((name) => name !== 'if' && name !== 'for').length, 23);

  for (const token of [
    'broad parser total matches: 114',
    'accepted declaration/inventory rows: 23',
    'top-level function declarations accepted: 18',
    'local const arrow or IIFE inventory rows accepted: 5',
    'control-flow artifacts rejected: 91',
    'if artifacts rejected: 80',
    'for artifacts rejected: 11',
    'assignment-expression function declarations outside broad parser: 0'
  ]) {
    assert.ok(text.includes(token), `missing lexical reconciliation token ${token}`);
  }
});

test('DOM extractors register preserves local helper and manifest order facts', () => {
  const text = doc();
  const src = source();
  const localConstDeclarations = [
    [66, 'isKidsHost', 'local const IIFE result'],
    [736, 'addSource', 'local const arrow helper'],
    [952, 'isKidsHost', 'local const IIFE result'],
    [960, 'extractFromHref', 'local const arrow helper'],
    [1074, 'addSource', 'local const arrow helper']
  ];

  for (const [line, name, kind] of localConstDeclarations) {
    assert.ok(text.includes(`| ${line} | \`${name}\` | ${kind} |`), `missing local declaration ${name} at ${line}`);
  }

  assert.equal(count(src, /^\s*const\s+[A-Za-z_$][\w$]*\s*=\s*(?:\(\)\s*=>|[A-Za-z_$][\w$]*\s*=>|\([^)]*\)\s*=>)/gm), 5);
  assert.equal(count(src, /=>/g), 23);

  const manifest = read('manifest.json');
  const firefoxManifest = read('manifest.firefox.json');
  assert.match(text, /`manifest\.json`: `js\/content\/dom_helpers\.js`, then\s+`js\/content\/dom_extractors\.js`, then `js\/content\/handle_resolver\.js`, then\s+`js\/content_bridge\.js`/);
  assert.match(text, /`manifest\.firefox\.json`: `js\/content\/dom_helpers\.js`, then\s+`js\/content\/dom_extractors\.js`, then `js\/content\/handle_resolver\.js`, then\s+`js\/content_bridge\.js`/);
  assert.ok(manifest.indexOf('js/content/dom_helpers.js') < manifest.indexOf('js/content/dom_extractors.js'));
  assert.ok(manifest.indexOf('js/content/dom_extractors.js') < manifest.indexOf('js/content/handle_resolver.js'));
  assert.ok(manifest.indexOf('js/content/handle_resolver.js') < manifest.indexOf('js/content_bridge.js'));
  assert.ok(firefoxManifest.indexOf('js/content/dom_helpers.js') < firefoxManifest.indexOf('js/content/dom_extractors.js'));
  assert.ok(firefoxManifest.indexOf('js/content/dom_extractors.js') < firefoxManifest.indexOf('js/content/handle_resolver.js'));
  assert.ok(firefoxManifest.indexOf('js/content/handle_resolver.js') < firefoxManifest.indexOf('js/content_bridge.js'));
});

test('DOM extractors register pins selector DOM mutation and no-lifecycle counts', () => {
  const text = doc();
  const src = source();
  const selectorBlock = src.match(/const VIDEO_CARD_SELECTORS = \[([\s\S]*?)\]\.join/);
  assert.ok(selectorBlock, 'missing VIDEO_CARD_SELECTORS block');
  const selectorEntries = [...selectorBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);

  const expectedCounts = [
    ['document literal occurrences', count(src, /\bdocument\b/g)],
    ['window literal occurrences', count(src, /\bwindow\b/g)],
    ['location literal occurrences', count(src, /\blocation\b/g)],
    ['Element token occurrences', count(src, /\bElement\b/g)],
    ['Node token occurrences', count(src, /\bNode\b/g)],
    ['querySelector calls', count(src, /\.querySelector\s*\(/g)],
    ['querySelectorAll calls', count(src, /\.querySelectorAll\s*\(/g)],
    ['matches calls', count(src, /\.matches\s*\(/g)],
    ['closest calls', count(src, /\.closest(?:\?\.)?\s*\(/g)],
    ['getAttribute calls', count(src, /\.getAttribute(?:\?\.)?\s*\(/g)],
    ['setAttribute calls', count(src, /\.setAttribute(?:\?\.)?\s*\(/g)],
    ['removeAttribute calls', count(src, /\.removeAttribute(?:\?\.)?\s*\(/g)],
    ['hasAttribute calls', count(src, /\.hasAttribute\s*\(/g)],
    ['classList.remove calls', count(src, /\.classList\.remove\s*\(/g)],
    ['style.display references', count(src, /style\.display/g)],
    ['textContent references', count(src, /textContent/g)],
    ['innerText references', count(src, /innerText/g)],
    ['dataset references', count(src, /\.dataset\b/g)],
    ['data-filtertube-* token occurrences', count(src, /data-filtertube-/g)],
    ['new URL calls', count(src, /new URL\s*\(/g)],
    ['Array.isArray calls', count(src, /Array\.isArray/g)],
    ['new Set calls', count(src, /new Set\s*\(/g)],
    ['forEach calls', count(src, /\.forEach\s*\(/g)],
    ['map calls', count(src, /\.map\s*\(/g)],
    ['filter calls', count(src, /\.filter\s*\(/g)],
    ['some calls', count(src, /\.some\s*\(/g)],
    ['startsWith calls', count(src, /\.startsWith\s*\(/g)],
    ['console.error calls', count(src, /console\.error/g)],
    ['setTimeout calls', count(src, /setTimeout\s*\(/g)],
    ['setInterval calls', count(src, /setInterval\s*\(/g)],
    ['addEventListener calls', count(src, /addEventListener\s*\(/g)],
    ['MutationObserver references', count(src, /MutationObserver/g)],
    ['postMessage calls', count(src, /postMessage\s*\(/g)],
    ['fetch calls', count(src, /\bfetch\s*\(/g)]
  ];

  assert.equal(selectorEntries.length, 47);
  for (const token of ['ytd-watch-card-rhs-panel-video-renderer', 'ytm-shorts-lockup-view-model-v2', 'ytk-kids-slim-owner-renderer']) {
    assert.ok(selectorEntries.includes(token), `missing selector entry ${token}`);
    assert.match(text, new RegExp(token));
  }

  for (const [label, value] of expectedCounts) {
    assert.match(text, new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: ${value}`));
  }
  assert.match(text, /runtime sendMessage calls: 0/);
});

test('DOM extractors source still proves recycled node cleanup and channel metadata cache behavior', () => {
  const text = doc();
  const src = source();
  const ensureSlice = sliceBetween(src, 'function ensureVideoIdForCard', 'function getCardTitle');
  const channelSlice = sliceBetween(src, 'function extractChannelMetadataFromElement', 'function clearCachedChannelMetadata');

  assert.match(ensureSlice, /const canFastReturnStamp = !isKidsHost && cachedVideoId/);
  assert.match(ensureSlice, /clearCachedChannelMetadata\(card\)/);
  assert.match(ensureSlice, /data-filtertube-hidden-by-channel/);
  assert.match(ensureSlice, /data-filtertube-collaborators/);
  assert.match(ensureSlice, /data-filtertube-blocked-state/);
  assert.match(ensureSlice, /card\.style\.display = ''/);
  assert.match(text, /Recycled-node cleanup is already present but incomplete as proof/);

  assert.match(channelSlice, /const shouldTrustCachedHandle = Boolean/);
  assert.match(channelSlice, /const shouldTrustCachedId = Boolean/);
  assert.match(channelSlice, /removeAttribute\?\.\('data-filtertube-channel-handle'\)/);
  assert.match(channelSlice, /setAttribute\('data-filtertube-channel-handle', meta\.handle\)/);
  assert.match(channelSlice, /setAttribute\('data-filtertube-channel-id', meta\.id\)/);
  assert.match(channelSlice, /innerText/);
  assert.match(text, /Cached channel metadata remains a high-impact trust path/);
  assert.match(text, /Fallback identity scanning is intentionally broad/);
});

test('DOM extractors source still proves duration cache and video id extraction boundaries', () => {
  const text = doc();
  const src = source();
  const durationSlice = sliceBetween(src, 'function extractVideoDuration', 'function parseAriaLabelDuration');
  const videoIdSlice = sliceBetween(src, 'function extractVideoIdFromCard', '\n}');

  assert.match(durationSlice, /const cached = element\.getAttribute\('data-filtertube-duration'\)/);
  assert.match(durationSlice, /if \(cached === ''\)/);
  assert.match(durationSlice, /element\.removeAttribute\('data-filtertube-duration'\)/);
  assert.match(durationSlice, /element\.setAttribute\('data-filtertube-duration', ''\)/);
  assert.match(text, /Duration extraction uses a negative cache/);

  assert.match(videoIdSlice, /tag\.startsWith\('ytk-'\)/);
  assert.match(videoIdSlice, /a\[href\*="\/watch\?v="\], a\[href\^="\/watch\?v="\]/);
  assert.match(videoIdSlice, /const stamped = card\.getAttribute\?\.\('data-filtertube-video-id'\)/);
  assert.match(videoIdSlice, /card\.querySelectorAll\('a\[href\]'\)/);
  assert.match(videoIdSlice, /scanDataForVideoId\(source\)/);
  assert.match(videoIdSlice, /console\.error\('FilterTube: Error extracting video ID from card:'\, error\)/);
  assert.match(text, /Video id extraction is route-sensitive but not centrally reported/);
});

test('DOM extractors executable probes pin recycled stamps duration cache and identity precedence', () => {
  const text = doc();
  const runtime = createDomExtractorRuntime();
  const { context } = runtime;
  const newVideoId = 'NEWvideo123';
  const oldVideoId = 'OLDvideo123';
  const ucId = `UC${'A'.repeat(22)}`;
  const staleUcId = `UC${'B'.repeat(22)}`;

  const staleNoStampCard = new FakeElement('ytd-video-renderer', {
    attrs: {
      'data-filtertube-channel-id': staleUcId,
      'data-filtertube-channel-handle': '@stale',
      'data-filtertube-processed': 'true',
      'data-filtertube-hidden': 'true',
      'data-filtertube-collaborators': '[stale]',
      'data-filtertube-blocked-state': 'blocked'
    },
    className: 'filtertube-hidden',
    style: { display: 'none' }
  });
  staleNoStampCard.appendChild(new FakeElement('a', { attrs: { id: 'thumbnail', href: `/watch?v=${newVideoId}` } }));
  context.staleNoStampCard = staleNoStampCard;
  assert.equal(runtime.evaluate('ensureVideoIdForCard(staleNoStampCard)'), newVideoId);
  assert.equal(staleNoStampCard.getAttribute('data-filtertube-video-id'), newVideoId);
  assert.equal(staleNoStampCard.hasAttribute('data-filtertube-channel-id'), false);
  assert.equal(staleNoStampCard.hasAttribute('data-filtertube-hidden'), false);
  assert.equal(staleNoStampCard.classList.contains('filtertube-hidden'), false);
  assert.equal(staleNoStampCard.style.display, 'none');

  const cachedMismatchCard = new FakeElement('ytd-video-renderer', {
    attrs: {
      'data-filtertube-video-id': oldVideoId,
      'data-filtertube-channel-id': staleUcId,
      'data-filtertube-hidden': 'true'
    },
    className: 'filtertube-hidden',
    style: { display: 'none' }
  });
  cachedMismatchCard.appendChild(new FakeElement('a', { attrs: { id: 'thumbnail', href: `/watch?v=${newVideoId}` } }));
  context.cachedMismatchCard = cachedMismatchCard;
  assert.equal(runtime.evaluate('ensureVideoIdForCard(cachedMismatchCard)'), newVideoId);
  assert.equal(cachedMismatchCard.getAttribute('data-filtertube-video-id'), newVideoId);
  assert.equal(cachedMismatchCard.hasAttribute('data-filtertube-channel-id'), false);
  assert.equal(cachedMismatchCard.style.display, '');

  const durationCard = new FakeElement('ytd-video-renderer');
  context.durationCard = durationCard;
  assert.equal(runtime.evaluate('extractVideoDuration(durationCard)'), null);
  assert.equal(durationCard.getAttribute('data-filtertube-duration'), '');
  assert.equal(runtime.evaluate('extractVideoDuration(durationCard)'), null);
  durationCard.appendChild(new FakeElement('div', { className: 'yt-badge-shape__text', textContent: '3:54' }));
  assert.equal(runtime.evaluate('extractVideoDuration(durationCard)'), 234);
  assert.equal(durationCard.getAttribute('data-filtertube-duration'), '234');

  const cacheTarget = new FakeElement('a', {
    attrs: {
      href: '/@FreshName',
      'data-filtertube-channel-handle': '@stale',
      'data-filtertube-channel-id': staleUcId
    },
    innerText: 'Fresh channel'
  });
  context.cacheTarget = cacheTarget;
  const freshMeta = runtime.evaluate(`extractChannelMetadataFromElement(cacheTarget, '', '/channel/${ucId}', { cacheTarget })`);
  assert.equal(freshMeta.handle, '@freshname');
  assert.equal(freshMeta.id, ucId);
  assert.equal(cacheTarget.getAttribute('data-filtertube-channel-handle'), '@freshname');
  assert.equal(cacheTarget.getAttribute('data-filtertube-channel-id'), ucId);

  const relatedTitle = new FakeElement('span', { innerText: 'Video title mentioning @notchannel' });
  const channelAnchor = new FakeElement('a', {
    attrs: { href: '/@ActualChannel' },
    innerText: 'Actual Channel'
  });
  context.relatedTitle = relatedTitle;
  context.channelAnchor = channelAnchor;
  const handleMeta = runtime.evaluate(`extractChannelMetadataFromElement(channelAnchor, '', '/@ActualChannel', { cacheTarget: channelAnchor, relatedElements: [relatedTitle] })`);
  assert.equal(handleMeta.handle, '@actualchannel');
  assert.equal(channelAnchor.getAttribute('data-filtertube-channel-handle'), '@actualchannel');

  const kidsRuntime = createDomExtractorRuntime({ hostname: 'www.youtubekids.com' });
  const kidsCard = new FakeElement('ytk-video-renderer', {
    attrs: { 'data-filtertube-video-id': oldVideoId }
  });
  kidsCard.appendChild(new FakeElement('a', { attrs: { href: `/watch?v=${newVideoId}` } }));
  kidsRuntime.context.kidsCard = kidsCard;
  assert.equal(kidsRuntime.evaluate('extractVideoIdFromCard(kidsCard)'), newVideoId);

  assert.equal(runtime.evaluate(`scanDataForVideoId({ videos: [{ playlistVideoRenderer: { videoId: "${newVideoId}" } }] })`), newVideoId);
  const scannedIdentifiers = runtime.evaluate(`scanDataForChannelIdentifiers({ canonicalBaseUrl: "/@Scanned", browseId: "${ucId}" })`);
  assert.equal(scannedIdentifiers.handle, '@scanned');
  assert.equal(scannedIdentifiers.id, ucId);

  for (const token of [
    'File-Local Executable Behavior Proof',
    'recycled no-stamp cleanup proof: executable',
    'cached mismatch restore proof: executable',
    'duration negative-cache proof: executable',
    'channel cache trust proof: executable',
    'related-element handle-source proof: executable',
    'Kids href precedence proof: executable',
    'data-host scanner proof: executable'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }
});

test('DOM extractors register preserves future proof fields and missing authorities', () => {
  const text = doc();
  const runtime = source();

  for (const field of [
    'route',
    'surface',
    'rendererOrDomHost',
    'profileType',
    'listMode',
    'ruleState',
    'inputElementTag',
    'inputHref',
    'inputText',
    'cachedVideoId',
    'extractedVideoId',
    'cachedChannelHandle',
    'cachedChannelId',
    'freshChannelHref',
    'identityConfidenceClass',
    'identityProvenance',
    'videoStampMutation',
    'channelStampMutation',
    'removedStaleAttributes',
    'restoreDisplayProof',
    'durationCacheState',
    'innerTextFallbackUsed',
    'selectorFamily',
    'negativeSiblingVisibleProof',
    'noRuleBudget',
    'performanceBudget'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const token of [
    'domExtractorMethodAuthority',
    'domExtractorIdentityConfidenceReport',
    'domExtractorSelectorScopeContract',
    'domExtractorCacheFreshnessContract',
    'domExtractorVideoStampMutationReport',
    'domExtractorChannelMetadataReport',
    'domExtractorDurationCacheBudget',
    'domExtractorInnerTextBudget',
    'domExtractorRecycledNodeRestoreProof',
    'domExtractorFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `missing missing-authority token ${token}`);
    assert.doesNotMatch(runtime, new RegExp(token), `${token} should not exist in runtime source yet`);
  }
});
