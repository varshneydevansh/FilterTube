import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/family_device_navigation.js', import.meta.url), 'utf8');

function fixture() {
  const document = {
    body: {}, documentElement: {},
    defaultView: { getComputedStyle: element => ({ display: element.display || 'block', visibility: element.visibility || 'visible' }) }
  };
  document.activeElement = document.body;
  const elements = [];
  const listeners = new Map();
  const container = {
    ownerDocument: document,
    contains: element => elements.includes(element),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name); },
    querySelectorAll: selector => elements.filter(element => element.matches(selector)),
    querySelector: selector => elements.find(element => element.matches(selector)) || null
  };
  function add({ x = 0, y = 0, width = 100, height = 44, tag = 'BUTTON', dataset = {}, ...props } = {}) {
    const element = {
      tagName: tag, dataset, tabIndex: 0, ownerDocument: document, ...props,
      getAttribute(name) { return this[name] ?? null; },
      matches(selector) {
        return selector.split(',').some(raw => {
          const part = raw.trim();
          if (part === ':disabled') return this.disabled === true;
          if (part.startsWith('#')) return this.id === part.slice(1);
          if (part === '[role="dialog"]') return this.role === 'dialog';
          if (part === '[aria-modal="true"]') return this['aria-modal'] === 'true';
          if (part === '[data-family-device-focus-fallback]') return this.dataset.familyDeviceFocusFallback !== undefined;
          if (part === '[data-family-device-focus-key]') return this.dataset.familyDeviceFocusKey !== undefined;
          if (part === '[data-family-device-id][data-source]') return this.dataset.familyDeviceId !== undefined && this.dataset.source !== undefined;
          if (part === 'button[data-family-device-id][data-source]') return tag === 'BUTTON' && this.dataset.familyDeviceId !== undefined && this.dataset.source !== undefined;
          return part.toUpperCase() === tag;
        });
      },
      closest(selector) {
        if (selector.includes('[hidden]') && (this.hidden || this.inert || this['aria-hidden'] === 'true')) return this;
        if (selector === '[contenteditable="true"]' && this.isContentEditable) return this;
        return this.matches(selector) ? this : this.parent?.closest(selector) || null;
      },
      getBoundingClientRect: () => ({ left: x, top: y, width, height }),
      getClientRects() { return this.hidden || this.display === 'none' ? [] : [this.getBoundingClientRect()]; },
      focus(options) { document.activeElement = this; this.focusOptions = options; },
      scrollIntoView(options) { this.scrollOptions = options; }
    };
    elements.push(element);
    return element;
  }
  function remove(element) {
    elements.splice(elements.indexOf(element), 1);
    if (document.activeElement === element) document.activeElement = document.body;
  }
  function press(key, props = {}) {
    const event = { key, preventDefault() { this.defaultPrevented = true; }, ...props };
    listeners.get('keydown')?.(event);
    return event;
  }
  function click(target, props = {}) {
    const event = { target, preventDefault() { this.defaultPrevented = true; }, ...props };
    target.onClick?.(event);
    listeners.get('click')?.(event);
    return event;
  }
  const window = {};
  vm.runInNewContext(source, { window });
  return { document, container, add, remove, press, click, api: window.FilterTubeFamilyDeviceNavigation };
}

test('D-pad follows rows and columns while native Enter, Tab and Escape remain untouched', () => {
  const f = fixture();
  const topLeft = f.add();
  const topRight = f.add({ x: 120 });
  const bottomLeft = f.add({ y: 70 });
  const bottomRight = f.add({ x: 120, y: 70 });
  f.api.install(f.container);
  topLeft.focus();
  assert.equal(f.press('ArrowRight').defaultPrevented, true);
  assert.equal(f.document.activeElement, topRight);
  f.press('ArrowDown');
  assert.equal(f.document.activeElement, bottomRight);
  f.press('ArrowLeft');
  assert.equal(f.document.activeElement, bottomLeft);
  f.press('ArrowUp');
  assert.equal(f.document.activeElement, topLeft);
  for (const key of ['Tab', 'Escape', 'Enter', ' ']) assert.equal(f.press(key).defaultPrevented, undefined);
  assert.deepEqual({ ...topRight.scrollOptions }, { block: 'nearest', inline: 'nearest', behavior: 'instant' });
});

test('single-column navigation does not jump to another row on Left or Right', () => {
  const f = fixture();
  const first = f.add();
  const second = f.add({ y: 70 });
  f.api.install(f.container);
  first.focus();
  assert.equal(f.press('ArrowRight').defaultPrevented, undefined);
  assert.equal(f.document.activeElement, first);
  f.press('ArrowDown');
  assert.equal(f.document.activeElement, second);
  assert.equal(f.press('ArrowDown').defaultPrevented, undefined);
});

test('disabled and hidden controls are skipped and native editors keep their arrows', () => {
  const f = fixture();
  const first = f.add();
  f.add({ y: 50, disabled: true });
  f.add({ y: 100, hidden: true });
  f.add({ y: 150, visibility: 'hidden' });
  const last = f.add({ y: 200 });
  f.api.install(f.container);
  first.focus();
  f.press('ArrowDown');
  assert.equal(f.document.activeElement, last);
  for (const tag of ['INPUT', 'SELECT', 'TEXTAREA']) {
    const editor = f.add({ tag });
    editor.focus();
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) assert.equal(f.press(key).defaultPrevented, undefined);
    assert.equal(f.document.activeElement, editor);
  }
  const editor = f.add({ isContentEditable: true });
  editor.focus();
  assert.equal(f.press('ArrowDown').defaultPrevented, undefined);
});

test('navigation respects modifiers, other listeners and cleanup', () => {
  const f = fixture();
  const first = f.add();
  f.add({ y: 70 });
  const cleanup = f.api.install(f.container);
  first.focus();
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
    assert.equal(f.press('ArrowDown', { [modifier]: true }).defaultPrevented, undefined);
    assert.equal(f.document.activeElement, first);
  }
  f.press('ArrowDown', { defaultPrevented: true });
  assert.equal(f.document.activeElement, first);
  cleanup();
  assert.equal(f.press('ArrowDown').defaultPrevented, undefined);
});

test('discovery rerenders restore the same device and source without confusing duplicate IDs', () => {
  const f = fixture();
  const old = f.add({ dataset: { familyDeviceId: 'abc', source: 'nearby-presence' } });
  old.focus();
  const snapshot = f.api.captureFocus(f.container);
  f.remove(old);
  f.add({ dataset: { familyDeviceId: 'abc', source: 'trusted-link' } });
  const replacement = f.add({ dataset: { familyDeviceId: 'abc', source: 'nearby-presence' } });
  assert.equal(f.api.restoreFocus(f.container, snapshot), true);
  assert.equal(f.document.activeElement, replacement);
});

test('a vanished device falls back to a visible toolbar action', () => {
  const f = fixture();
  const old = f.add({ dataset: { familyDeviceId: 'expired', source: 'nearby-presence' } });
  f.add({ hidden: true, dataset: { familyDeviceFocusFallback: '' } });
  const search = f.add({ dataset: { familyDeviceFocusFallback: '' } });
  old.focus();
  const snapshot = f.api.captureFocus(f.container);
  f.remove(old);
  assert.equal(f.api.restoreFocus(f.container, snapshot), true);
  assert.equal(f.document.activeElement, search);
});

test('dynamic presence actions use stable focus keys and unrelated focus is never stolen', () => {
  const f = fixture();
  const old = f.add({ dataset: { familyDeviceFocusKey: 'stop-finding' } });
  old.focus();
  const snapshot = f.api.captureFocus(f.container);
  f.remove(old);
  const replacement = f.add({ dataset: { familyDeviceFocusKey: 'stop-finding' } });
  assert.equal(f.api.restoreFocus(f.container, snapshot), true);
  assert.equal(f.document.activeElement, replacement);
  const outside = {};
  f.document.activeElement = outside;
  assert.equal(f.api.restoreFocus(f.container, snapshot), false);
  assert.equal(f.document.activeElement, outside);
  const ordinary = f.add();
  ordinary.focus();
  assert.equal(f.api.captureFocus(f.container), null);
  assert.equal(f.api.restoreFocus(f.container, null), false);
});

test('deliberate tile activation hands focus to the rendered review, while arrows and polling do not', async () => {
  const f = fixture();
  const tile = f.add({ dataset: { familyDeviceId: 'kid-tablet', source: 'trusted-link', selected: 'false' } });
  const icon = f.add({ tag: 'SPAN', parent: tile });
  const preview = f.add({ tag: 'DIV', id: 'ftNanahDeviceSelectionPreview' });
  const action = f.add({ id: 'ftNanahDeviceSelectionActionBtn', parent: preview, hidden: true });
  tile.onClick = () => { tile.dataset.selected = 'true'; action.hidden = false; };
  f.api.install(f.container);
  tile.focus();
  assert.equal(f.api.restoreFocus(f.container, f.api.captureFocus(f.container)), true);
  await Promise.resolve();
  assert.equal(f.document.activeElement, tile);
  f.click(tile, { target: icon });
  assert.equal(f.document.activeElement, tile, 'handoff waits until tile handlers complete');
  await Promise.resolve();
  assert.equal(f.document.activeElement, action);
  assert.equal(f.press('Enter').defaultPrevented, undefined, 'native action activation remains intact');
});

test('Escape returns to the same source and device after discovery replaces tiles without dismissing review', async () => {
  const f = fixture();
  const tile = f.add({ dataset: { familyDeviceId: 'same-id', source: 'trusted-link', selected: 'true' } });
  const preview = f.add({ tag: 'DIV', id: 'ftNanahDeviceSelectionPreview' });
  const action = f.add({ id: 'ftNanahDeviceSelectionActionBtn', parent: preview });
  f.api.install(f.container);
  tile.focus();
  const snapshot = f.api.captureFocus(f.container);
  f.click(tile);
  await Promise.resolve();
  f.remove(tile);
  f.add({ dataset: { familyDeviceId: 'same-id', source: 'nearby-presence' } });
  const replacement = f.add({ dataset: { familyDeviceId: 'same-id', source: 'trusted-link', selected: 'true' } });
  assert.equal(f.api.restoreFocus(f.container, snapshot), false, 'polling does not steal review focus');
  assert.equal(f.document.activeElement, action);
  assert.equal(f.press('Escape').defaultPrevented, true);
  assert.equal(f.document.activeElement, replacement);
  assert.equal(preview.hidden, undefined, 'review stays visible');
});

test('queued tile handoff preserves synchronous or queued modal focus and other deliberate focus', async () => {
  for (const timing of ['synchronous', 'queued', 'after-click']) {
    const f = fixture();
    const tile = f.add({ dataset: { familyDeviceId: 'kid', source: 'trusted-link', selected: 'true' } });
    f.add({ id: 'ftNanahDeviceSelectionActionBtn' });
    const modalAction = { focus() { f.document.activeElement = this; } };
    tile.onClick = () => {
      if (timing === 'synchronous') modalAction.focus();
      if (timing === 'queued') Promise.resolve().then(() => modalAction.focus());
    };
    f.api.install(f.container);
    tile.focus();
    f.click(tile);
    if (timing === 'after-click') modalAction.focus();
    await Promise.resolve();
    assert.equal(f.document.activeElement, modalAction, timing);
  }
});

test('Escape uses a visible toolbar fallback when the selected device disappears and leaves editors and dialogs alone', async () => {
  const f = fixture();
  const tile = f.add({ dataset: { familyDeviceId: 'gone', source: 'live-session', selected: 'true' } });
  const preview = f.add({ tag: 'DIV', id: 'ftNanahDeviceSelectionPreview' });
  const action = f.add({ id: 'ftNanahDeviceSelectionActionBtn', parent: preview });
  const input = f.add({ tag: 'INPUT', parent: preview });
  const dialog = f.add({ tag: 'DIV', role: 'dialog', parent: preview });
  const dialogAction = f.add({ parent: dialog });
  f.add({ hidden: true, dataset: { familyDeviceFocusFallback: '' } });
  const fallback = f.add({ dataset: { familyDeviceFocusFallback: '' } });
  f.api.install(f.container);
  tile.focus();
  f.click(tile);
  await Promise.resolve();
  f.remove(tile);
  for (const control of [input, dialogAction]) {
    control.focus();
    assert.equal(f.press('Escape').defaultPrevented, undefined);
    assert.equal(f.document.activeElement, control);
  }
  action.focus();
  assert.equal(f.press('Escape').defaultPrevented, true);
  assert.equal(f.document.activeElement, fallback);
});

test('unselected tiles, unavailable review actions and cleanup never schedule an unwanted handoff', async () => {
  for (const state of ['unselected', 'hidden', 'disabled', 'cleanup']) {
    const f = fixture();
    const tile = f.add({ dataset: { familyDeviceId: 'kid', source: 'trusted-link', selected: state === 'unselected' ? 'false' : 'true' } });
    f.add({ id: 'ftNanahDeviceSelectionActionBtn', hidden: state === 'hidden', disabled: state === 'disabled' });
    const cleanup = f.api.install(f.container);
    tile.focus();
    f.click(tile);
    if (state === 'cleanup') cleanup();
    await Promise.resolve();
    assert.equal(f.document.activeElement, tile, state);
  }
});
