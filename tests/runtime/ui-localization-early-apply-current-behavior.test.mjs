import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/ui_localization.js'), 'utf8');

test('applying before English loads is a no-op and later locale application translates keyed copy', async () => {
  const label = {
    textContent: 'Original unlocalized copy',
    getAttribute(name) { return name === 'data-ft-i18n' ? 'navigation.settings' : null; }
  };
  const document = {
    documentElement: { lang: 'en', dir: 'ltr' },
    querySelectorAll(selector) { return selector === '[data-ft-i18n]' ? [label] : []; }
  };
  const fetched = [];
  const context = {
    document,
    browser: { runtime: { getURL(file) { return `extension://filtertube/${file}`; } } },
    async fetch(url) {
      fetched.push(url);
      if (url.endsWith('/en.json')) {
        return { ok: true, async json() { return { 'navigation.settings': 'Settings' }; } };
      }
      throw new Error(`unexpected resource: ${url}`);
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context);

  const ui = context.FilterTubeUiLocalization;
  assert.doesNotThrow(() => ui.apply(document));
  assert.equal(label.textContent, 'Original unlocalized copy');
  assert.deepEqual(fetched, [], 'early application must not start I/O');

  await ui.select('en');
  ui.apply(document);
  assert.equal(label.textContent, 'Settings');
  assert.equal(document.documentElement.lang, 'en');
  assert.ok(fetched.some(url => url.endsWith('/en.json')));
  assert.equal(fetched.length, 1, 'English selection loads only the English catalog');
});
