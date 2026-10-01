import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const arabicCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/ar.json'), 'utf8'));

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

function loadAdmissionRuntime(locale = 'ar', browserLocale = 'en-US') {
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
    chrome: {
      runtime: { getURL: resource => `extension://filtertube/${resource}` },
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: locale }); } } }
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

function loadDirectOverlaySetters(runtime, watchHost, shortHost) {
  const source = fs.readFileSync(path.join(root, 'js/content/dom_fallback.js'), 'utf8');
  const helper = sliceBetween(
    source,
    'function setLocalizedAdmissionOverlayMessage(',
    'function setCurrentShortAdmissionOverlay('
  );
  const shortSetter = sliceBetween(
    source,
    'function setCurrentShortAdmissionOverlay(',
    'function clearCurrentShortAdmissionOverlay('
  );
  const watchSetter = sliceBetween(
    source,
    'function setDirectAccessOverlay(',
    'function clearDirectAccessOverlay('
  );
  runtime.context.getCurrentShortPlayerHost = () => shortHost;
  runtime.context.getCurrentDirectAccessPlayerHost = () => watchHost;
  vm.runInContext(`${helper}\n${shortSetter}\n${watchSetter}\nthis.setShortOverlay = setCurrentShortAdmissionOverlay;\nthis.setWatchOverlay = setDirectAccessOverlay;`, runtime.context);
}

async function flushLocaleLoad() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

test('Google player admission overlay owns RTL direction, mirrored accent, and localized accessible name', async () => {
  const runtime = loadAdmissionRuntime();
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);

  runtime.context.FilterTubeAdmissionOverlay.render(
    overlay,
    'blocked',
    'Blocked channel\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds'
  );

  assert.equal(overlay.getAttribute('dir'), 'ltr', 'the pending locale load must not delay overlay presentation');
  assert.equal(overlay.getAttribute('aria-label'), 'Blocked channel\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds');
  await flushLocaleLoad();

  assert.equal(overlay.getAttribute('dir'), 'rtl', 'the extension overlay must not inherit Google page direction');
  assert.equal(overlay.getAttribute('lang'), 'ar', 'assistive technology must use the overlay language, not Google language');
  assert.equal(runtime.document.documentElement.getAttribute('lang'), null, 'never change the host page language');
  assert.equal(overlay.getAttribute('aria-label'), `${arabicCatalog['admission.blockedChannel']}\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds`);
  assert.equal(overlay.__filtertubeAdmissionReason.textContent, `${arabicCatalog['admission.blockedChannel']}\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds`);
  assert.equal(overlay.__filtertubeAdmissionReason.style.borderLeft, 'none');
  assert.equal(overlay.__filtertubeAdmissionReason.style.borderRight, '3px solid #ab4438');
  assert.equal(overlay.__filtertubeAdmissionStatus.textContent, arabicCatalog['admission.blockedStatus']);
  assert.equal(overlay.__filtertubeAdmissionTitle.textContent, arabicCatalog['admission.blockedTitle']);
  assert.deepEqual(runtime.requested, ['extension://filtertube/data/ui_locales/ar.json']);
});

test('automatic admission locale loads the supported browser language without delaying overlay presentation', async () => {
  const runtime = loadAdmissionRuntime('auto', 'ar-EG');
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);

  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel');

  assert.equal(overlay.getAttribute('dir'), 'ltr', 'auto resolution must not delay the initial overlay');
  assert.equal(overlay.getAttribute('aria-label'), 'Blocked channel');
  await flushLocaleLoad();

  assert.equal(overlay.getAttribute('dir'), 'rtl');
  assert.equal(overlay.getAttribute('lang'), 'ar');
  assert.equal(overlay.getAttribute('aria-label'), arabicCatalog['admission.blockedChannel']);
  assert.deepEqual(runtime.requested, ['extension://filtertube/data/ui_locales/ar.json']);
});

test('failed preview catalog loads label the English overlay as English without affecting the host', async () => {
  const runtime = loadAdmissionRuntime('ar');
  runtime.context.fetch = () => Promise.reject(new Error('catalog unavailable'));
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel');
  await flushLocaleLoad();
  assert.equal(overlay.getAttribute('lang'), 'en');
  assert.equal(overlay.getAttribute('dir'), 'ltr');
  assert.equal(overlay.getAttribute('aria-label'), 'Blocked channel');
  assert.equal(runtime.document.documentElement.getAttribute('lang'), null);
});

test('all 38 explicit and automatic languages render their real admission copy with local language and direction metadata', async () => {
  const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8')).locales;
  for (const preference of ['explicit', 'auto']) for (const { code } of targets) {
    const runtime = loadAdmissionRuntime(preference === 'auto' ? 'auto' : code, code);
    const overlay = runtime.document.createElement('div');
    runtime.document.body.appendChild(overlay);
    runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel\n@privateOwner');
    await flushLocaleLoad();
    const catalog = JSON.parse(fs.readFileSync(path.join(root, `data/ui_locales/${code}.json`), 'utf8'));
    assert.equal(overlay.getAttribute('lang'), code, code);
    assert.equal(overlay.getAttribute('dir'), /^(ar|arz|apc|apd|fa|ur|pa-Arab)$/.test(code) ? 'rtl' : 'ltr', code);
    assert.equal(overlay.__filtertubeAdmissionReason.textContent, `${catalog['admission.blockedChannel']}\n@privateOwner`, code);
    assert.equal(overlay.__filtertubeAdmissionTitle.textContent, catalog['admission.blockedTitle'], code);
    assert.equal(runtime.document.documentElement.getAttribute('lang'), null, `${code}: host untouched`);
  }
});

test('direct Watch and Shorts overlays localize only keyed reason lines and keep newest state', async () => {
  const runtime = loadAdmissionRuntime();
  const watchHost = runtime.document.createElement('div');
  const shortHost = runtime.document.createElement('div');
  runtime.document.body.appendChild(watchHost);
  runtime.document.body.appendChild(shortHost);
  loadDirectOverlaySetters(runtime, watchHost, shortHost);

  runtime.context.setWatchOverlay('blocked', 'Blocked channel\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds');
  runtime.context.setShortOverlay('blocked', 'Blocked video\nVideo ID: oldVideoId');
  runtime.context.setShortOverlay('pending', 'Checking FilterTube rules…\nVideo ID: currentVideoId');
  const watchOverlay = runtime.document.getElementById('filtertube-direct-access-overlay');
  const shortOverlay = runtime.document.getElementById('filtertube-current-short-admission-overlay');

  assert.equal(watchOverlay.__filtertubeAdmissionReason.textContent, 'Blocked channel\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds');
  assert.equal(shortOverlay.__filtertubeAdmissionReason.textContent, 'Checking FilterTube rules…\nVideo ID: currentVideoId');
  assert.equal(watchOverlay.style.position, 'absolute');
  assert.equal(watchOverlay.style.width, '100%');
  await flushLocaleLoad();

  assert.equal(watchOverlay.getAttribute('dir'), 'rtl');
  assert.equal(watchOverlay.__filtertubeAdmissionReason.textContent, `${arabicCatalog['admission.blockedChannel']}\nUCGnjeahCJW1AF34HBmQTJ-Q\nDuration: 240 seconds`);
  assert.equal(shortOverlay.getAttribute('dir'), 'rtl');
  assert.equal(shortOverlay.__filtertubeAdmissionReason.textContent, `${arabicCatalog['admission.checkingRules']}\nVideo ID: currentVideoId`);
  assert.equal(shortOverlay.getAttribute('data-state'), 'pending');
  assert.deepEqual(runtime.requested, ['extension://filtertube/data/ui_locales/ar.json']);
});
