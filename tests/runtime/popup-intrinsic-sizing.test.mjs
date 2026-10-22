import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/extension-shell/shared/runtime.js', 'utf8');

function fixture(availableWidth, { bodyPresent = true, rootPresent = true, forbidScreen = false } = {}) {
  const root = { dataset: { theme: 'dark' }, style: { width: '100%', maxWidth: '100%' } };
  const body = { dataset: {}, style: { width: '100%', maxWidth: '100%' }, classList: { add() {} } };
  const mount = { style: {} };
  const window = {
    matchMedia: () => ({ matches: false }),
    get innerWidth() { throw new Error('initial popup viewport must not determine intrinsic width'); },
    get visualViewport() { throw new Error('initial popup viewport must not determine intrinsic width'); },
    get screen() {
      if (forbidScreen) throw new Error('non-popup surfaces must not read screen size');
      return availableWidth === undefined ? undefined : { availWidth: availableWidth };
    }
  };
  const context = vm.createContext({ window, document: {
    documentElement: rootPresent ? root : null,
    body: bodyPresent ? body : null,
    getElementById(id) { return id === 'popupRoot' ? mount : null; }
  } });
  vm.runInContext(source.replace(/^export /gm, ''), context, { filename: 'actual-extension-environment.js' });
  return { root, body, mount, apply: context.applyExtensionEnvironment };
}

test('popup establishes an explicit intrinsic width independently of its initial viewport', () => {
  const state = fixture(1440);
  state.apply('popup');
  assert.equal(state.root.style.width, '392px');
  assert.equal(state.root.style.maxWidth, '392px', 'a viewport cap must not shrink the initial intrinsic size');
  assert.equal(state.root.style.minWidth, '0');
  assert.equal(state.body.style.width, '392px');
  assert.equal(state.mount.style.width, '392px');
  assert.equal(state.body.style.maxWidth, '100%');
  assert.equal(state.mount.style.maxWidth, '100%');
  assert.equal(state.body.style.overflowX, 'hidden');
});

test('narrow real screens cap popup size in CSS pixels without bootstrap viewport measurements', () => {
  for (const width of [280, 320, 360, 375, 392, 414, 768, 1440]) {
    const state = fixture(width);
    state.apply('popup');
    const expected = `${Math.min(392, width)}px`;
    assert.equal(state.root.style.width, expected);
    assert.equal(state.root.style.maxWidth, expected);
    assert.equal(state.body.style.width, expected);
    assert.equal(state.mount.style.width, expected);
    assert.equal(state.body.style.minWidth, '0');
    assert.equal(state.mount.style.minWidth, '0');
  }
});

test('unavailable or invalid screen sizes keep the usable preferred width', () => {
  for (const width of [undefined, null, 0, -1, NaN, Infinity, -Infinity, '25', false]) {
    const state = fixture(width);
    state.apply('popup');
    assert.equal(state.root.style.width, '392px');
    assert.equal(state.root.style.maxWidth, '392px');
  }
});

test('tab-view environment retains its own sizing and does not query screen width', () => {
  const state = fixture(undefined, { forbidScreen: true });
  state.apply('tab-view');
  assert.equal(state.root.style.width, '100%');
  assert.equal(state.root.style.maxWidth, '100%');
  assert.equal(state.body.style.width, '100%');
  assert.equal(Object.keys(state.mount.style).length, 0);
  assert.equal(state.root.dataset.surface, 'tab-view');
  assert.equal(state.body.dataset.surface, 'tab-view');
  assert.equal(state.root.dataset.theme, 'dark');
  assert.equal(state.root.style.colorScheme, 'dark');
});

test('environment setup remains safe before the root or body exists', () => {
  const noRoot = fixture(undefined, { rootPresent: false, forbidScreen: true });
  assert.doesNotThrow(() => noRoot.apply('popup'));
  const noBody = fixture(undefined, { bodyPresent: false, forbidScreen: true });
  assert.doesNotThrow(() => noBody.apply('popup'));
});
