import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

let orderCounter = 1;

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = String(tagName).toUpperCase();
    this.parentElement = null;
    this.children = [];
    this.nativeAttrs = new Map();
    this.isConnected = false;
    this.order = orderCounter++;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    markConnected(child, this.isConnected);
    return child;
  }

  setAttribute(name, value) {
    this.nativeAttrs.set(String(name).toLowerCase(), String(value));
  }

  getAttribute(name) {
    const value = this.nativeAttrs.get(String(name).toLowerCase());
    return value === undefined ? null : value;
  }

  hasAttribute(name) {
    return this.nativeAttrs.has(String(name).toLowerCase());
  }

  removeAttribute(name) {
    this.nativeAttrs.delete(String(name).toLowerCase());
  }

  matches(selector) {
    const raw = String(selector || '').trim();
    if (!raw || raw === '*') return true;
    if (raw.includes('[')) return false;
    const id = this.getAttribute('id') || '';
    const classes = (this.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    const simple = raw.split(/\s+/).pop();
    const tagId = simple.match(/^([a-z0-9-]+)?#([A-Za-z0-9_-]+)$/i);
    if (tagId) {
      const tagOk = !tagId[1] || this.tagName.toLowerCase() === tagId[1].toLowerCase();
      return tagOk && id === tagId[2];
    }
    const tagClass = simple.match(/^([a-z0-9-]+)?\.([A-Za-z0-9_-]+)$/i);
    if (tagClass) {
      const tagOk = !tagClass[1] || this.tagName.toLowerCase() === tagClass[1].toLowerCase();
      return tagOk && classes.includes(tagClass[2]);
    }
    if (simple.startsWith('#')) return id === simple.slice(1);
    if (simple.startsWith('.')) return classes.includes(simple.slice(1));
    return this.tagName.toLowerCase() === simple.toLowerCase();
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    walk(this, element => {
      if (element !== this && element.matches(selector)) results.push(element);
    });
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  contains(candidate) {
    let current = candidate;
    while (current) {
      if (current === this) return true;
      current = current.parentElement;
    }
    return false;
  }

  compareDocumentPosition(other) {
    return this.order > other.order ? 2 : 4;
  }
}

class FakeDocument {
  constructor() {
    this.children = [];
    this.isConnected = true;
  }

  appendChild(child) {
    child.parentElement = null;
    this.children.push(child);
    markConnected(child, true);
    return child;
  }

  querySelectorAll(selector) {
    const results = [];
    this.children.forEach(child => {
      walk(child, element => {
        if (element.matches(selector)) results.push(element);
      });
    });
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  contains(candidate) {
    return this.children.some(child => child === candidate || child.contains(candidate));
  }
}

class FakeDocumentFragment extends FakeElement {}

function walk(root, visit) {
  visit(root);
  root.children.forEach(child => walk(child, visit));
}

function markConnected(root, connected) {
  root.isConnected = connected;
  root.children.forEach(child => markConnected(child, connected));
}

function loadRuntime() {
  orderCounter = 1;
  const document = new FakeDocument();
  const context = {
    console,
    document,
    window: null,
    Element: FakeElement,
    Document: FakeDocument,
    DocumentFragment: FakeDocumentFragment,
    Node: {
      DOCUMENT_POSITION_PRECEDING: 2
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('js/content/dom_state.js'), context, { filename: 'js/content/dom_state.js' });
  return { context, document };
}

test('sensitive FilterTube state attributes are virtualized off the public DOM', () => {
  const { document } = loadRuntime();
  const card = document.appendChild(new FakeElement('ytd-rich-item-renderer'));

  card.setAttribute('data-filtertube-video-id', 'abc12345678');
  card.setAttribute('data-filtertube-processed', 'true');
  card.setAttribute('data-filtertube-hidden', 'true');

  assert.equal(card.getAttribute('data-filtertube-video-id'), 'abc12345678');
  assert.equal(card.getAttribute('data-filtertube-processed'), 'true');
  assert.equal(card.nativeAttrs.has('data-filtertube-video-id'), false);
  assert.equal(card.nativeAttrs.has('data-filtertube-processed'), false);
  assert.equal(card.nativeAttrs.get('data-filtertube-hidden'), 'true');
  assert.equal(document.querySelector('[data-filtertube-video-id="abc12345678"]'), card);

  card.removeAttribute('data-filtertube-video-id');

  assert.equal(card.getAttribute('data-filtertube-video-id'), null);
  assert.equal(document.querySelectorAll('[data-filtertube-video-id="abc12345678"]').length, 0);
});

test('virtual selectors preserve channel lookup and collaborator closest flows', () => {
  const { document } = loadRuntime();
  const card = document.appendChild(new FakeElement('ytd-rich-item-renderer'));
  const thumbnail = card.appendChild(new FakeElement('a'));
  const button = card.appendChild(new FakeElement('button'));

  thumbnail.setAttribute('id', 'thumbnail');
  thumbnail.setAttribute('data-filtertube-channel-handle', '@calmchannel');
  card.setAttribute('data-filtertube-collab-awaiting-dialog', 'true');

  assert.equal(card.querySelector('a#thumbnail[data-filtertube-channel-handle]'), thumbnail);
  assert.equal(card.querySelector('[data-filtertube-channel-handle]'), thumbnail);
  assert.equal(button.closest('[data-filtertube-collab-awaiting-dialog="true"]'), card);
  assert.equal(thumbnail.nativeAttrs.has('data-filtertube-channel-handle'), false);
  assert.equal(card.nativeAttrs.has('data-filtertube-collab-awaiting-dialog'), false);
});

test('extension manifests load dom_state before DOM readers and content bridge', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = JSON.parse(read(manifestFile));
    const scripts = manifest.content_scripts.find(entry => entry.js?.includes('js/content_bridge.js')).js;

    assert.ok(scripts.includes('js/content/dom_state.js'), `${manifestFile} missing dom_state content script`);
    assert.ok(
      scripts.indexOf('js/content/dom_state.js') < scripts.indexOf('js/content/dom_helpers.js'),
      `${manifestFile} must load dom_state before DOM helpers`
    );
    assert.ok(
      scripts.indexOf('js/content/dom_state.js') < scripts.indexOf('js/content_bridge.js'),
      `${manifestFile} must load dom_state before content_bridge`
    );
  }
});
