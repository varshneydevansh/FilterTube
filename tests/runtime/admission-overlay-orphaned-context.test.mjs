// Owner report (3.6.3 hotfix): after reloading the extension, a description-blocked Mix video turned
// the whole tab flat teal-grey (#304c4e) with no masthead, player or card. The tab's old content
// script copy (invalidated runtime) threw on runtime.getURL mid-render, after the window-sized
// blocked background was set and before the card was added or the player containment applied.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

function loadAdmissionRuntime({ orphaned = false, locale = 'ar', browserLocale = 'en-US' } = {}) {
  let document;

  class FakeElement {
    constructor(tagName) {
      this.tagName = String(tagName || 'div').toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.attributes = new Map();
      this.dataset = {};
      this.style = {};
      this.textContent = '';
      this.paused = this.tagName === 'VIDEO';
    }

    get parentElement() { return this.parentNode; }
    get isConnected() {
      let current = this;
      while (current) {
        if (current === document?.body) return true;
        current = current.parentNode;
      }
      return false;
    }

    appendChild(child) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    insertBefore(child, reference) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      const index = this.children.indexOf(reference);
      if (index < 0) this.children.push(child);
      else this.children.splice(index, 0, child);
      return child;
    }

    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      child.parentNode = null;
      return child;
    }

    remove() { this.parentNode?.removeChild(this); }
    setAttribute(name, value) {
      const key = String(name);
      const stringValue = String(value);
      this.attributes.set(key, stringValue);
      if (key === 'id') this.id = stringValue;
      if (key.startsWith('data-')) {
        const dataKey = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        this.dataset[dataKey] = stringValue;
      }
    }
    getAttribute(name) { return this.attributes.get(String(name)) ?? null; }
    pause() { this.paused = true; }
    play() { this.paused = false; return Promise.resolve(); }
  }

  const body = new FakeElement('body');
  const documentElement = new FakeElement('html');
  document = {
    body,
    documentElement,
    createElement(tagName) { return new FakeElement(tagName); },
    getElementById(id) {
      const visit = node => {
        for (const child of node.children) {
          if (child.id === id) return child;
          const nested = visit(child);
          if (nested) return nested;
        }
        return null;
      };
      return visit(body);
    }
  };

  const requested = [];
  const context = {
    document,
    navigator: { language: browserLocale },
    chrome: orphaned
      // After the extension reloads, the tab's old script copy sees an invalidated runtime.
      ? {
        runtime: { getURL() { throw new Error('Extension context invalidated.'); } },
        storage: { local: { get() { throw new Error('Extension context invalidated.'); } } }
      }
      : {
        runtime: { getURL: resource => `extension://filtertube/${resource}` },
        storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: locale, ftCompanionMode: 'quiet' }); } } }
      },
    fetch(url) {
      requested.push(url);
      const code = url.match(/\/([^/]+)\.json$/)?.[1];
      const catalog = JSON.parse(fs.readFileSync(path.join(root, `data/ui_locales/${code}.json`), 'utf8'));
      return Promise.resolve({ ok: true, json: () => Promise.resolve(catalog) });
    },
    matchMedia() { return { matches: false }; }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/content/admission_overlay.js'), 'utf8'), context);
  return { context, document, FakeElement, requested };
}


function loadWatchSetter(runtime, watchHost) {
  const source = fs.readFileSync(path.join(root, 'js/content/dom_fallback.js'), 'utf8');
  const helper = sliceBetween(source, 'function setLocalizedAdmissionOverlayMessage(', 'function setCurrentShortAdmissionOverlay(');
  const watchSetter = sliceBetween(source, 'function setDirectAccessOverlay(', 'function clearDirectAccessOverlay(');
  runtime.context.getCurrentDirectAccessPlayerHost = () => watchHost;
  runtime.context.isQuietBlockingEnabled = () => false;
  vm.runInContext(`${helper}\n${watchSetter}\nthis.setWatchOverlay = setDirectAccessOverlay;`, runtime.context);
}

const flush = async () => {
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
};

test('an orphaned script copy still draws the blocked card inside the player, never a blank window cover', async () => {
  const runtime = loadAdmissionRuntime({ orphaned: true });
  const player = runtime.document.createElement('div');
  runtime.document.body.appendChild(player);
  loadWatchSetter(runtime, player);

  assert.doesNotThrow(() => runtime.context.setWatchOverlay('blocked', 'Blocked keyword\nMatched: "guidance of experts"\nFound in: the video description'));
  const overlay = runtime.document.getElementById('filtertube-direct-access-overlay');
  assert.ok(overlay, 'overlay mounted in the player');
  assert.equal(overlay.parentNode, player);
  assert.equal(overlay.style.position, 'absolute');
  assert.equal(overlay.style.width, '100%');
  assert.equal(overlay.style.height, '100%');
  assert.ok(overlay.__filtertubeAdmissionPanel, 'the card exists');
  assert.ok(overlay.children.includes(overlay.__filtertubeAdmissionPanel), 'the card is on the cover');
  assert.equal(overlay.__filtertubeAdmissionTitle.textContent, 'This video is blocked');
  assert.equal(overlay.__filtertubeAdmissionBrandMark.src, undefined, 'no broken image');
  await flush();
  assert.equal(overlay.style.position, 'absolute');
});

test('late redraws (locale and Companion loads) keep a player overlay inside the player', async () => {
  const runtime = loadAdmissionRuntime({ locale: 'ar' });
  const player = runtime.document.createElement('div');
  runtime.document.body.appendChild(player);
  loadWatchSetter(runtime, player);
  runtime.context.setWatchOverlay('blocked', 'Blocked keyword');
  const overlay = runtime.document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.getAttribute('data-filtertube-admission-contained'), 'true');
  // Redraws that bypass dom_fallback, as the locale and Companion loads do.
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked keyword');
  await flush();
  assert.equal(overlay.getAttribute('dir'), 'rtl', 'the locale redraw ran');
  assert.equal(overlay.style.position, 'absolute');
  assert.equal(overlay.style.width, '100%');
  assert.equal(overlay.style.height, '100%');
  // Quiet blocking draws the same way.
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked keyword', { quiet: true });
  assert.equal(overlay.style.position, 'absolute');
});

test('covers that are meant to fill the window (embeds, channel pages) still do', () => {
  const runtime = loadAdmissionRuntime({ orphaned: true });
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);
  assert.doesNotThrow(() => runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel'));
  assert.equal(overlay.style.position, 'fixed');
  assert.equal(overlay.style.width, '100vw');
  assert.ok(overlay.children.includes(overlay.__filtertubeAdmissionPanel));
});
