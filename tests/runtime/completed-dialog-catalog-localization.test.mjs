import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const targets = JSON.parse(fs.readFileSync('data/ui_locales/targets.json', 'utf8')).locales;
const start = source.indexOf('function tabViewUiText(');
const end = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', start);
assert.ok(start >= 0 && end > start);

for (const name of ['delivery-strip', 'provider-modal', 'remaining-modal', 'generated-status', 'final-import-display', 'dashboard-help-bubbles']) {
  const batch = JSON.parse(fs.readFileSync(`data/ui_locales/batches/${name}-source.json`, 'utf8'));
  test(`${name}: every target renders merged copy with unchanged private placeholders`, () => {
    assert.equal(targets.length, 38);
    for (const { code } of targets) {
      const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${code}.json`, 'utf8'));
      const context = vm.createContext({ window: { FilterTubeUiLocalization: {
        text(key, values) {
          assert.ok(Object.hasOwn(catalog, key), `${code}: ${key}`);
          return catalog[key].replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => String(values[name]));
        }
      } } });
      vm.runInContext(`${source.slice(start, end)}\nthis.render = tabViewUiText;`, context);
      for (const [key, english] of Object.entries(batch.english)) {
        assert.equal(typeof catalog[key], 'string', `${code}: merged catalog must contain ${key}`);
        for (const count of [0, 1, 2, 5]) {
          const values = Object.fromEntries([...english.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
            .map(([, name]) => [name, name === 'count' ? count : `Private ${name} <🙂> @name/id`]));
          const snapshot = JSON.stringify(values);
          const actual = context.render(key, english, values);
          assert.equal(actual, catalog[key].replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => String(values[name])));
          assert.equal(JSON.stringify(values), snapshot);
          for (const value of Object.values(values)) assert.ok(actual.includes(String(value)), `${code}: preserved placeholder ${key}`);
          for (const token of batch.protectedLiterals?.[key] || []) assert.ok(actual.includes(token), `${code}: ${token}`);
        }
      }
    }
  });
}
