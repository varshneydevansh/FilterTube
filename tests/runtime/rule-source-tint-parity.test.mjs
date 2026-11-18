// The popup and the dashboard tint Keywords/Channels rows by where the rule
// came from. Both must get the same source classes for the same entries, and
// both pages must load the one stylesheet that paints them.
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');

class FakeNode {}

class FakeElement extends FakeNode {
  constructor(tagName) {
    super();
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.textContent = '';
    const element = this;
    this.classList = {
      values: () => String(element.className).split(/\s+/).filter(Boolean),
      add(...names) { element.className = [...new Set([...this.values(), ...names.filter(Boolean)])].join(' '); },
      remove(...names) { element.className = this.values().filter((n) => !names.includes(n)).join(' '); },
      contains(name) { return this.values().includes(name); },
      toggle(name, force) { (force ?? !this.contains(name)) ? this.add(name) : this.remove(name); }
    };
  }
  appendChild(child) { this.children.push(child); return child; }
  append(...nodes) { nodes.forEach((n) => this.appendChild(n)); }
  insertBefore(child) { this.children.unshift(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  removeEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

const SOURCE_TINT_CLASS = /\.(?:source-(?:kids|comments|collab)|channel-derived|collaboration-(?:member|entry|partial))(?![-\w])/;

const SOURCE_CLASSES = [
  'ft-rule-row', 'ft-rule-tinted', 'channel-derived', 'source-comments',
  'source-kids', 'source-collab', 'collaboration-member', 'collaboration-partial'
];

const channels = [
  { id: 'UCPLAIN', name: 'Plain Channel', filterAll: true },
  { id: 'UCCOMMENT', name: 'Comment Channel', source: 'comments', filterAll: true },
  { id: 'UCCOLLAB', name: 'Collab Channel', collaborationGroupId: 'g1', filterAll: true },
  { id: 'UCCOLLAB2', name: 'Collab Partner', collaborationGroupId: 'g1', source: 'comments' },
  { id: 'UCKIDS', name: 'Kids Channel', __ftFromKids: true },
  { id: 'UCKIDSCOLLAB', name: 'Kids Collab', __ftFromKids: true, collaborationGroupId: 'g2' }
];

function loadRenderEngine() {
  const context = {
    console: { log() {}, warn() {}, error() {} },
    Node: FakeNode,
    document: { createElement: (tag) => new FakeElement(tag), createDocumentFragment: () => new FakeElement('fragment') },
    setTimeout: () => 0,
    clearTimeout() {},
    addEventListener() {},
    removeEventListener() {},
    StateManager: {
      getState: () => ({ mode: 'blocklist', keywords: [], channels, kids: { blockedChannels: [] } })
    },
    FilterTubeSettings: {
      getChannelDerivedKey: (channel) => String(channel?.id || '').toLowerCase()
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('js/render_engine.js'), context);
  return context.RenderEngine;
}

function sourceClasses(row) {
  return row.classList.values().filter((name) => SOURCE_CLASSES.includes(name)).sort();
}

const keywordEntries = [
  { label: 'user keyword', entry: { word: 'plain', exact: false, comments: true }, expected: ['ft-rule-row'] },
  { label: 'kids keyword', entry: { word: 'kidword', __ftFromKids: true }, expected: ['ft-rule-row', 'ft-rule-tinted', 'source-kids'] },
  { label: 'channel-derived', entry: { word: 'Plain Channel', source: 'channel', channelRef: 'ucplain' }, expected: ['channel-derived', 'ft-rule-row', 'ft-rule-tinted'] },
  { label: 'derived from comments', entry: { word: 'Comment Channel', source: 'channel', channelRef: 'uccomment' }, expected: ['channel-derived', 'ft-rule-row', 'ft-rule-tinted', 'source-comments'] },
  { label: 'derived from collab', entry: { word: 'Collab Channel', source: 'channel', channelRef: 'uccollab' }, expected: ['channel-derived', 'ft-rule-row', 'ft-rule-tinted', 'source-collab'] },
  { label: 'derived, synced from kids', entry: { word: 'Kids Channel', source: 'channel', channelRef: 'uckids', __ftFromKids: true }, expected: ['channel-derived', 'ft-rule-row', 'ft-rule-tinted', 'source-kids'] }
];

test('popup and dashboard keyword rows carry the same source classes', () => {
  const RenderEngine = loadRenderEngine();
  for (const { label, entry, expected } of keywordEntries) {
    const popupRow = RenderEngine.createKeywordListItem(entry, { minimal: true, profile: 'main' });
    const tabRow = RenderEngine.createKeywordListItem(entry, { minimal: false, profile: 'main' });
    assert.ok(popupRow.classList.contains('keyword-item'), label);
    assert.ok(tabRow.classList.contains('list-item'), label);
    assert.deepEqual(sourceClasses(tabRow), sourceClasses(popupRow), label);
    assert.deepEqual(sourceClasses(popupRow), expected, label);
  }
});

test('popup and dashboard channel rows carry the same source classes', () => {
  const RenderEngine = loadRenderEngine();
  const groupMeta = { isPartial: false, tooltip: '' };
  const partialMeta = { isPartial: true, tooltip: '' };
  const cases = [
    { channel: channels[0], meta: null, expected: ['ft-rule-row'] },
    { channel: channels[1], meta: null, expected: ['ft-rule-row', 'ft-rule-tinted', 'source-comments'] },
    { channel: channels[2], meta: groupMeta, expected: ['collaboration-member', 'ft-rule-row', 'ft-rule-tinted'] },
    { channel: channels[3], meta: partialMeta, expected: ['collaboration-member', 'collaboration-partial', 'ft-rule-row', 'ft-rule-tinted', 'source-comments'] },
    { channel: channels[4], meta: null, expected: ['ft-rule-row', 'ft-rule-tinted', 'source-kids'] },
    // The Kids list passes no collaboration meta; the group id alone still marks it.
    { channel: channels[5], meta: null, expected: ['collaboration-member', 'ft-rule-row', 'ft-rule-tinted', 'source-kids'] }
  ];
  cases.forEach(({ channel, meta, expected }, index) => {
    const popupRow = RenderEngine.createChannelListItem(channel, index, { minimal: true, collaborationMeta: meta });
    const tabRow = RenderEngine.createChannelListItem(channel, index, { minimal: false, collaborationMeta: meta });
    assert.ok(popupRow.classList.contains('keyword-item'), channel.name);
    assert.ok(tabRow.classList.contains('channel-item'), channel.name);
    assert.deepEqual(sourceClasses(tabRow), sourceClasses(popupRow), channel.name);
    assert.deepEqual(sourceClasses(popupRow), expected, channel.name);
  });
});

test('both pages load the one source-tint stylesheet after the page tones', () => {
  for (const page of ['html/popup.html', 'html/tab-view.html']) {
    const html = read(page);
    const tones = html.indexOf('../css/page-tones.css');
    const tints = html.indexOf('../css/rule-source-tints.css');
    assert.ok(tones > 0 && tints > tones, `${page} loads rule-source-tints.css after page-tones.css`);
  }
  // No page keeps its own copy of the tints: page CSS may lay out a source
  // row, but only rule-source-tints.css colours it.
  for (const file of ['css/popup.css', 'css/tab-view.css', 'css/components.css']) {
    for (const [, selectorList, body] of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const rowSelectors = selectorList.split(',').filter((selector) => {
        const target = selector.trim().split(/\s+/).pop();
        return SOURCE_TINT_CLASS.test(target);
      });
      if (rowSelectors.length === 0) continue;
      assert.doesNotMatch(body, /background|border(?:-inline-start)?(?:-color)?\s*:/, `${file}: ${rowSelectors.join(',').trim()}`);
    }
  }
  // Page tones flatten plain rows only, never tinted ones.
  const tones = read('css/page-tones.css');
  assert.doesNotMatch(tones, /\.list-item(?::hover)?\s*[,{]/);
  assert.match(tones, /\.list-item:not\(\.ft-rule-tinted\),/);
  const tints = read('css/rule-source-tints.css');
  for (const name of ['channel-derived', 'source-comments', 'source-kids', 'source-collab', 'collaboration-member']) {
    assert.match(tints, new RegExp(`\\.ft-rule-row\\.${name}\\s*\\{`), name);
    assert.match(tints, new RegExp(`:root\\[data-theme="dark"\\] \\.ft-rule-row\\.${name}\\s*\\{`), `${name} dark`);
  }
});
