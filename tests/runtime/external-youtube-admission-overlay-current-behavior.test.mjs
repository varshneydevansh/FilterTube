import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const guardSource = fs.readFileSync(path.join(root, 'js/content/external_youtube_guard.js'), 'utf8');

test('bundled locale catalogs are readable by YouTube and Google player frames', () => {
  for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
    const resources = manifest.web_accessible_resources || [];
    assert.ok(resources.some(entry => entry.resources.includes('data/ui_locales/*.json') &&
      entry.matches.some(match => match.includes('youtube.com'))), `${name}: YouTube catalog access`);
    assert.ok(resources.some(entry => entry.resources.includes('data/ui_locales/*.json') &&
      entry.matches.some(match => match.includes('google.com'))), `${name}: Google player catalog access`);
  }
});

test('admission copy loads the chosen local catalog without delaying the rule decision', async () => {
  const overlay = { style: {}, isConnected: true, textContent: '' };
  const requests = [];
  const context = {
    document: { documentElement: {}, createElement: undefined },
    chrome: {
      runtime: { getURL(file) { return `extension://filtertube/${file}`; } },
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: 'ru' }); } } }
    },
    fetch(url) {
      requests.push(url);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ 'admission.blockedChannel': 'Заблокированный канал' }) });
    },
    matchMedia() { return { matches: false }; }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/content/admission_overlay.js'), 'utf8'), context);
  context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel\nshakiraVEVO');
  assert.equal(overlay.textContent, 'Blocked channel\nshakiraVEVO');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(overlay.textContent, 'Заблокированный канал\nshakiraVEVO');
  assert.deepEqual(requests, ['extension://filtertube/data/ui_locales/ru.json']);
});

function activeSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterChannels: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q', name: 'shakiraVEVO' }],
    ...overrides
  };
}

function playerMetadata(overrides = {}) {
  return {
    videoId: 'fcnDmrtj6Sk',
    title: 'Shakira, Burna Boy - Dai Dai (Official Video)',
    shortDescription: 'Official video',
    keywords: ['Shakira', 'Dai Dai'],
    lengthSeconds: '240',
    channelId: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    channelName: 'shakiraVEVO',
    channelHandle: '',
    publishDate: '',
    uploadDate: '',
    category: '',
    languageCode: '',
    identityVerified: true,
    textVerified: true,
    ...overrides
  };
}

function loadGuard(settings, { reducedMotion = false } = {}) {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const createdTags = [];

  class FakeElement {
    constructor(tagName) {
      this.nodeType = 1;
      this.tagName = String(tagName || 'div').toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.attributes = new Map();
      this.dataset = {};
      this.style = {};
      this.textContent = '';
      this.paused = this.tagName === 'VIDEO';
      this.playCount = 0;
      this.pauseCount = 0;
    }

    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    insertBefore(child, reference) {
      if (child.parentNode) child.parentNode.removeChild(child);
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

    remove() {
      this.parentNode?.removeChild(this);
    }

    setAttribute(name, value) {
      const normalized = String(name);
      const stringValue = String(value);
      this.attributes.set(normalized, stringValue);
      if (normalized === 'id') this.id = stringValue;
      if (normalized.startsWith('data-')) {
        const key = normalized.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        this.dataset[key] = stringValue;
      }
    }

    getAttribute(name) {
      return this.attributes.get(String(name)) ?? null;
    }

    querySelectorAll(selector) {
      const matches = [];
      const visit = node => {
        for (const child of node.children) {
          const isAdmissionVideo = child.tagName === 'VIDEO' && child.getAttribute('data-filtertube-admission-background') === 'true';
          const match = selector === 'video'
            ? child.tagName === 'VIDEO'
            : selector === 'video[data-filtertube-admission-background]'
              ? isAdmissionVideo
              : selector === '[data-filtertube-admission-background]'
                ? isAdmissionVideo
                : selector === '[data-filtertube-admission-reason]'
                  ? child.getAttribute('data-filtertube-admission-reason') === 'true'
                : false;
          if (match) matches.push(child);
          visit(child);
        }
      };
      visit(this);
      return matches;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    pause() {
      this.pauseCount += 1;
      this.paused = true;
    }

    play() {
      this.playCount += 1;
      this.paused = false;
      return Promise.resolve();
    }
  }

  const body = new FakeElement('body');
  const documentElement = new FakeElement('html');
  const document = {
    body,
    documentElement,
    createElement(tagName) {
      createdTags.push(String(tagName).toLowerCase());
      return new FakeElement(tagName);
    },
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    querySelectorAll(selector) { return body.querySelectorAll(selector); },
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

  const context = {
    URL, Promise, Date, Map, Set, WeakSet, RegExp,
    setTimeout, clearTimeout, document,
    location: { href: 'https://www.youtube.com/embed/fcnDmrtj6Sk' },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    matchMedia(query) { return { matches: reducedMotion && query === '(prefers-reduced-motion: reduce)' }; },
    postMessage() {},
    chrome: {
      runtime: {
        getURL(resource) { return `moz-extension://filtertube/${resource}`; },
        sendMessage(_message, callback) { callback(settings); },
        onMessage: { addListener() {} }
      },
      storage: { onChanged: { addListener() {} } }
    },
    FilterTubeIdentity: {
      isChannelBlocked(entries, meta) {
        return entries.some(entry => entry.id === meta.id || entry.name?.toLowerCase() === meta.name?.toLowerCase());
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/content/admission_overlay.js'), 'utf8'), context);
  vm.runInContext(guardSource, context);
  return { context, guard: context.FilterTubeExternalYouTubeGuard, document, documentListeners, createdTags };
}

function triggerBlockedPlayback(loaded) {
  const media = {
    nodeType: 1,
    tagName: 'VIDEO',
    paused: false,
    parentElement: null,
    pause() { this.paused = true; },
    play() { this.paused = false; return Promise.resolve(); },
    getAttribute() { return null; },
    querySelectorAll() { return []; }
  };
  loaded.documentListeners.get('play')({ target: media });
  loaded.guard.acceptExternalMetadata(playerMetadata());
  return media;
}

test('blocked admission covers the embed, preserves the exact reason, and reuses its muted hero video', async () => {
  const loaded = loadGuard(activeSettings());
  await new Promise(resolve => setTimeout(resolve, 0));
  triggerBlockedPlayback(loaded);

  const overlay = loaded.document.getElementById('filtertube-external-youtube-admission');
  assert.ok(overlay);
  assert.equal(overlay.dataset.state, 'blocked');
  assert.equal(overlay.style.inset, '0');
  assert.equal(overlay.style.pointerEvents, 'auto');
  assert.equal(overlay.querySelector('[data-filtertube-admission-reason]').textContent, 'Blocked channel\nshakiraVEVO');

  const background = overlay.querySelector('video[data-filtertube-admission-background]');
  assert.ok(background);
  assert.equal(background.getAttribute('data-filtertube-admission-background'), 'true');
  assert.equal(background.muted, true);
  assert.equal(background.autoplay, true);
  assert.equal(background.loop, true);
  assert.equal(background.playsInline, true);
  assert.match(background.src, /assets\/images\/homepage_hero_day\.mp4$/);
  assert.equal(loaded.createdTags.filter(tag => tag === 'video').length, 1);

  loaded.guard.acceptExternalMetadata(playerMetadata());
  assert.strictEqual(overlay.querySelector('video[data-filtertube-admission-background]'), background);
  assert.equal(loaded.createdTags.filter(tag => tag === 'video').length, 1);
});

test('pending admission stays neutral and reduced motion does not create moving background media', async () => {
  const pending = loadGuard(activeSettings({ filterChannels: [], categoryFilters: { enabled: true, mode: 'block', selected: ['Music'] } }));
  await new Promise(resolve => setTimeout(resolve, 0));
  triggerBlockedPlayback(pending);
  const pendingOverlay = pending.document.getElementById('filtertube-external-youtube-admission');
  assert.equal(pendingOverlay.dataset.state, 'pending');
  assert.equal(pendingOverlay.style.background, '#f6f2eb');
  assert.equal(pendingOverlay.querySelector('video'), null);
  pending.guard.acceptExternalMetadata(playerMetadata({ category: 'Music' }));

  const reduced = loadGuard(activeSettings(), { reducedMotion: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  triggerBlockedPlayback(reduced);
  const reducedOverlay = reduced.document.getElementById('filtertube-external-youtube-admission');
  assert.equal(reducedOverlay.dataset.state, 'blocked');
  assert.equal(reducedOverlay.querySelector('video'), null);
  assert.equal(reduced.createdTags.filter(tag => tag === 'video').length, 0);
});
