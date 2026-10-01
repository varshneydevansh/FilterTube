import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/content/first_run_prompt.js', 'utf8');
const start = source.indexOf('async function localizePrompt(container)');
const end = source.indexOf('function getPalette()', start);
assert.ok(start >= 0 && end > start);
const localizeSource = source.slice(start, end);

function promptElement(key, attribute = 'text') {
  return {
    dataset: attribute === 'text'
      ? { ftFirstRunI18n: key }
      : { ftFirstRunI18nAria: key },
    textContent: '',
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
}

test('first-run refresh prompt uses bundled text without altering the refresh action', async () => {
  const title = promptElement('firstRun.activeTitle');
  const close = promptElement('firstRun.dismiss', 'aria');
  const container = {
    isConnected: true,
    style: {},
    querySelectorAll() { return [title]; },
    querySelector() { return close; }
  };
  const catalog = {
    'firstRun.activeTitle': 'FilterTube активен',
    'firstRun.dismiss': 'Закрыть'
  };
  const context = {
    api: {
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: 'ru' }); } } },
      runtime: { getURL(path) { return `extension://filtertube/${path}`; } }
    },
    fetch(url) {
      assert.equal(url, 'extension://filtertube/data/ui_locales/ru.json');
      return Promise.resolve({ ok: true, json: () => Promise.resolve(catalog) });
    }
  };
  vm.createContext(context);
  const localizePrompt = vm.runInContext(`(() => { ${localizeSource}; return localizePrompt; })()`, context);
  await localizePrompt(container);
  assert.equal(title.textContent, catalog['firstRun.activeTitle']);
  assert.equal(close.attributes['aria-label'], catalog['firstRun.dismiss']);
  assert.equal(container.dir, undefined);
  assert.match(source, /refreshBtn\.onclick = \(\) => \{\s*markComplete\(\);\s*window\.location\.reload\(\)/);
});

test('first-run copy stays safe when a catalog is unavailable and mirrors RTL previews', async () => {
  const title = promptElement('firstRun.activeTitle');
  title.textContent = 'FilterTube is active';
  const container = {
    isConnected: true,
    style: {},
    querySelectorAll() { return [title]; },
    querySelector() { return null; }
  };
  const context = {
    api: {
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: 'ar' }); } } },
      runtime: { getURL(path) { return `extension://filtertube/${path}`; } }
    },
    fetch() { return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); }
  };
  vm.createContext(context);
  const localizePrompt = vm.runInContext(`(() => { ${localizeSource}; return localizePrompt; })()`, context);
  await localizePrompt(container);
  assert.equal(title.textContent, 'FilterTube is active');
  assert.equal(container.dir, 'rtl');
});

test('first-run auto locale ignores staged browser languages and keeps bundled English copy', async () => {
  const title = promptElement('firstRun.activeTitle');
  title.textContent = 'FilterTube is active';
  const container = {
    isConnected: true,
    style: {},
    querySelectorAll() { return [title]; },
    querySelector() { return null; }
  };
  let fetchCount = 0;
  const context = {
    navigator: { language: 'ar-EG' },
    api: {
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: 'auto' }); } } },
      runtime: { getURL(path) { return `extension://filtertube/${path}`; } }
    },
    fetch() { fetchCount += 1; return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); }
  };
  context.window = context;
  vm.createContext(context);
  const localizePrompt = vm.runInContext(`(() => { ${localizeSource}; return localizePrompt; })()`, context);
  await localizePrompt(container);

  assert.equal(title.textContent, 'FilterTube is active');
  assert.equal(container.dir, 'rtl', 'supported Arabic browser language uses RTL');
  assert.equal(fetchCount, 1, 'auto loads the locally bundled Arabic catalog');
});
