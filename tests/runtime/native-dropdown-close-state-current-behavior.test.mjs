import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attrs = new Map();
    this.style = {};
    this.events = [];
    this.removed = false;
    this.closed = false;
    this.parent = null;
    this.children = [];
    this.className = '';
    this.isConnected = true;
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  matches(selector) {
    const tag = this.tagName.toLowerCase();
    return selector.split(',').some(rawPart => {
      const part = rawPart.trim();
      if (part === tag) return true;
      if (part.startsWith('.')) {
        return this.className.split(/\s+/).includes(part.slice(1));
      }
      if (part.startsWith('button[aria-label*=')) {
        const match = part.match(/button\[aria-label\*="([^"]+)"\]/);
        return tag === 'button' && match && (this.getAttribute('aria-label') || '').includes(match[1]);
      }
      if (part === '.filtertube-playlist-menu-fallback-popover') {
        return this.className.split(/\s+/).includes('filtertube-playlist-menu-fallback-popover');
      }
      return false;
    });
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (selector === 'tp-yt-iron-dropdown') {
        if (node.tagName.toLowerCase() === 'tp-yt-iron-dropdown') return node;
      } else if (node.matches(selector)) {
        return node;
      }
      node = node.parent;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = node => {
      node.children.forEach(child => {
        if (child.matches(selector)) matches.push(child);
        visit(child);
      });
    };
    visit(this);
    return matches;
  }

  dispatchEvent(event) {
    this.events.push(event);
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some(child => child.contains(node));
  }

  close() {
    this.closed = true;
  }

  remove() {
    this.removed = true;
  }
}

function makeInjectedDropdown(tagName = 'tp-yt-iron-dropdown') {
  const dropdown = new FakeElement(tagName);
  const injectedItem = new FakeElement('div');
  injectedItem.className = 'filtertube-block-channel-item';
  dropdown.appendChild(injectedItem);
  return dropdown;
}

function loadForceCloseRuntime() {
  const bridge = read('js/content_bridge.js');
  const block = sliceBetween(
    bridge,
    'function getReusableNativeDropdownRoot(dropdown) {',
    'function clearFilterTubeMenuItems(dropdown) {'
  );
  const cleaned = [];
  const app = new FakeElement('ytd-app');
  const context = {
    app,
    document: {
      activeElement: null,
      querySelector(selector) {
        if (selector === 'ytd-app') return app;
        return null;
      }
    },
    KeyboardEvent: function KeyboardEvent(type, init) {
      this.type = type;
      Object.assign(this, init);
    },
    MouseEvent: function MouseEvent(type, init) {
      this.type = type;
      Object.assign(this, init);
    },
    window: {},
    setTimeout(fn) {
      fn();
    },
    console,
    cleanupDropdownState(dropdown) {
      cleaned.push(dropdown);
    }
  };
  vm.runInNewContext(`${block}\nglobalThis.__api = { forceCloseDropdown };`, context);
  return { ...context.__api, app, cleaned };
}

function loadMenuObserverRuntime(dropdowns) {
  const blockChannel = read('js/content/block_channel.js');
  const menuObserver = sliceBetween(
    blockChannel,
    'function setupMenuObserver() {',
    '// Initialize menu observer after a delay'
  );
  const listeners = new Map();
  const forcedClosed = [];
  const handledDropdowns = [];
  const context = {
    Element: FakeElement,
    isKidsSite: false,
    FT_DROPDOWN_SELECTORS: 'tp-yt-iron-dropdown, ytm-menu-popup-renderer, bottom-sheet-container, div.menu-content[role="dialog"]',
    dropdownVisibilityObservers: new WeakMap(),
    scheduledDropdownInjections: new WeakSet(),
    processingDropdowns: new WeakSet(),
    injectedDropdowns: new WeakMap(),
    document: {
      body: new FakeElement('body'),
      addEventListener(type, handler) {
        listeners.set(type, handler);
      },
      querySelectorAll(selector) {
        if (selector === context.FT_DROPDOWN_SELECTORS) return dropdowns;
        return [];
      }
    },
    window: {
      addEventListener() {},
      getComputedStyle(element) {
        return {
          display: element.style.display || '',
          visibility: element.style.visibility || 'visible'
        };
      }
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    PointerEvent: function PointerEvent() {},
    KeyboardEvent: function KeyboardEvent(type, init) {
      this.type = type;
      Object.assign(this, init);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    forceCloseDropdown(dropdown) {
      forcedClosed.push(dropdown);
    },
    handleDropdownAppeared(dropdown) {
      handledDropdowns.push(dropdown);
      return Promise.resolve();
    },
    setupKidsPassiveBlockListener() {},
    tryInjectIntoVisibleDropdown() {},
    blockChannelDebugLog() {},
    console
  };
  vm.runInNewContext(`${menuObserver}\nsetupMenuObserver();`, context);
  return { listeners, forcedClosed, handledDropdowns };
}

test('forceCloseDropdown closes reusable desktop native dropdowns without poisoning inline display state', () => {
  const runtime = loadForceCloseRuntime();
  const root = new FakeElement('tp-yt-iron-dropdown');
  const popup = new FakeElement('ytd-menu-popup-renderer');
  popup.parent = root;

  runtime.forceCloseDropdown(popup);

  assert.equal(root.closed, true);
  assert.notEqual(popup.style.display, 'none');
  assert.notEqual(root.style.display, 'none');
  assert.equal(popup.getAttribute('aria-hidden'), null);
  assert.equal(root.getAttribute('aria-hidden'), null);
  assert.deepEqual(runtime.cleaned, [popup, root]);
  assert.equal(runtime.app.events.length, 1, 'click-away still runs to release YouTube focus traps');
});

test('forceCloseDropdown still directly hides mobile/dialog and removes FilterTube-owned popovers', () => {
  const runtime = loadForceCloseRuntime();
  const mobile = new FakeElement('ytm-menu-popup-renderer');
  runtime.forceCloseDropdown(mobile);

  assert.equal(mobile.style.display, 'none');
  assert.equal(mobile.getAttribute('aria-hidden'), 'true');
  assert.equal(mobile.hasAttribute('hidden'), true);
  assert.equal(mobile.getAttribute('data-filtertube-force-hidden'), 'true');

  const owned = new FakeElement('div');
  owned.className = 'filtertube-playlist-menu-fallback-popover';
  runtime.forceCloseDropdown(owned);
  assert.equal(owned.removed, true);
});

test('menu observer repairs only FilterTube-forced hidden state and preserves native outside-click closes', () => {
  const blockChannel = read('js/content/block_channel.js');
  const menuObserver = sliceBetween(
    blockChannel,
    'function setupMenuObserver() {',
    '// Initialize menu observer after a delay'
  );

  assert.match(menuObserver, /repairFilterTubeHiddenDropdownState/);
  assert.match(menuObserver, /const forceHidden = el\.getAttribute\('data-filtertube-force-hidden'\) === 'true'/);
  assert.match(menuObserver, /if \(!forceHidden\) return/);
  assert.match(menuObserver, /el\.removeAttribute\('data-filtertube-force-hidden'\)/);
  assert.match(
    menuObserver,
    /const scanExistingDropdowns = \(\) => \{\s*try \{\s*document\.querySelectorAll\(FT_DROPDOWN_SELECTORS\)\.forEach\(dropdown => \{\s*repairFilterTubeHiddenDropdownState\(dropdown\);/
  );
  assert.match(menuObserver, /const closeFilterTubeInjectedDropdownsOnOutsidePointer = \(event\) => \{/);
  assert.match(menuObserver, /target\?\.closest\?\.\(menuButtonSelector\)/);
  assert.match(menuObserver, /dropdown\.querySelector\?\.\('\.filtertube-block-channel-item'\)/);
  assert.match(menuObserver, /if \(target && \(dropdown\.contains\(target\) \|\| eventPath\.includes\(dropdown\)\)\) return;/);
  assert.match(menuObserver, /forceCloseDropdown\(dropdown\)/);
  assert.match(
    menuObserver,
    /document\.addEventListener\(\s*typeof PointerEvent === 'function' \? 'pointerdown' : 'mousedown',\s*closeFilterTubeInjectedDropdownsOnOutsidePointer,\s*true\s*\);/
  );
  assert.doesNotMatch(
    menuObserver,
    /const obs = new MutationObserver\(\(\) => \{\s*try \{\s*repairFilterTubeHiddenDropdownState\(dropdown\);/
  );
  assert.doesNotMatch(
    menuObserver,
    /const isDropdownVisible = \(dropdown\) => \{\s*try \{\s*repairFilterTubeHiddenDropdownState\(dropdown\);/
  );
  assert.doesNotMatch(menuObserver, /staleDesktopMenu|staleDesktopRoot/);
  assert.match(menuObserver, /typeof forceCloseDropdown === 'function'/);
  assert.doesNotMatch(
    menuObserver,
    /blockChannelDebugLog\('FilterTube: Video card removed, closing dropdown'\);\s*dropdown\.style\.display = 'none';\s*dropdown\.setAttribute\('aria-hidden', 'true'\);/
  );

  const injected = makeInjectedDropdown();
  const nativeOnly = new FakeElement('tp-yt-iron-dropdown');
  const hiddenInjected = makeInjectedDropdown();
  hiddenInjected.setAttribute('aria-hidden', 'true');
  let runtime = loadMenuObserverRuntime([injected, nativeOnly, hiddenInjected]);
  const pointerHandler = runtime.listeners.get('pointerdown') || runtime.listeners.get('mousedown');
  assert.equal(typeof pointerHandler, 'function');
  pointerHandler({ target: new FakeElement('main'), composedPath: () => [] });
  assert.deepEqual(runtime.forcedClosed, [injected], 'outside pointer closes only visible FilterTube-enriched dropdowns');

  const insideInjected = makeInjectedDropdown();
  const insideTarget = new FakeElement('span');
  insideInjected.appendChild(insideTarget);
  runtime = loadMenuObserverRuntime([insideInjected]);
  const insidePointerHandler = runtime.listeners.get('pointerdown') || runtime.listeners.get('mousedown');
  insidePointerHandler({ target: insideTarget, composedPath: () => [insideTarget, insideInjected] });
  assert.deepEqual(runtime.forcedClosed, [], 'inside dropdown pointer does not close the menu');

  const menuButtonInjected = makeInjectedDropdown();
  const menuButton = new FakeElement('button');
  menuButton.setAttribute('aria-label', 'More actions');
  runtime = loadMenuObserverRuntime([menuButtonInjected]);
  const menuButtonPointerHandler = runtime.listeners.get('pointerdown') || runtime.listeners.get('mousedown');
  menuButtonPointerHandler({ target: menuButton, composedPath: () => [menuButton] });
  assert.deepEqual(runtime.forcedClosed, [], '3-dot menu button pointer is left for YouTube to own');
});
