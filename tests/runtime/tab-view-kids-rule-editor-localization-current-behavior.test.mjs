import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const localeDir = path.join(root, 'data/ui_locales');
const source = JSON.parse(fs.readFileSync(path.join(localeDir, 'batches/kids-rule-editor-source.json'), 'utf8'));
const batch = JSON.parse(fs.readFileSync(path.join(localeDir, 'batches/kids-rule-editor-source-translations.json'), 'utf8'));
const targetLocales = JSON.parse(fs.readFileSync(path.join(localeDir, 'targets.json'), 'utf8'))
  .locales.map(entry => entry.code);
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const keys = Object.keys(source.english);

const placeholderNames = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();

test('Kids editor and source-filter drafts cover every locale with matching placeholders', () => {
  assert.deepEqual(batch.keys, keys);
  assert.equal(targetLocales.length, 38);
  assert.deepEqual(Object.keys(batch.translations).sort(), targetLocales.filter(locale => locale !== 'en').sort());

  for (const locale of targetLocales.filter(locale => locale !== 'en')) {
    const values = batch.translations[locale];
    assert.equal(values.length, keys.length, `${locale}: translation count`);
    values.forEach((value, index) => {
      assert.ok(typeof value === 'string' && value.trim(), `${locale}: ${keys[index]}`);
      assert.deepEqual(placeholderNames(value), placeholderNames(source.english[keys[index]]), `${locale}: ${keys[index]} placeholders`);
    });
  }

  for (const key of keys) assert.ok(tabView.includes(key), `runtime references ${key}`);
  assert.ok(tabView.includes('bindTabViewLocalizedMarkup(kidsKeywordsContent);'));
  assert.ok(tabView.includes('bindTabViewLocalizedMarkup(kidsChannelsContent);'));
});

function runSourceFilterOptions(locale) {
  const localeValues = locale === 'en' ? source.english : Object.fromEntries(
    batch.keys.map((key, index) => [key, batch.translations[locale][index]])
  );
  const start = tabView.indexOf('function truncateChannelSourceFilterLabel(');
  const end = tabView.indexOf('function renderChannels()', start);
  assert.ok(start >= 0 && end > start, 'source-filter helpers are available');
  const helperSource = tabView.slice(start, end);
  const select = {
    options: [],
    currentValue: 'manual',
    set innerHTML(_value) { this.options = []; },
    get value() { return this.currentValue; },
    set value(value) { this.currentValue = value; },
    appendChild(option) { this.options.push(option); }
  };
  const context = {
    normalizeString(value) { return String(value ?? '').trim(); },
    collectChannelSourceFilterOptions() { return [{ id: 'list-1', name: 'Ciencia', count: 2 }]; },
    tabViewUiText(key, fallback, values = {}) {
      const template = localeValues[key] ?? fallback;
      return String(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
        Object.hasOwn(values, name) ? String(values[name]) : match);
    },
    document: {
      createElement(tag) {
        assert.equal(tag, 'option');
        return { value: '', textContent: '', title: '' };
      }
    }
  };
  context.setTabViewLocalizedCopy = (element, property, key, fallback, values = {}) => {
    assert.equal(property, 'textContent');
    const resolveValues = () => typeof values === 'function' ? values() : values;
    element.__localizedCopy = { key, fallback, resolveValues };
    element.textContent = context.tabViewUiText(key, fallback, resolveValues());
  };
  vm.createContext(context);
  const updateOptions = vm.runInContext(`(() => { ${helperSource}; return updateChannelSourceFilterOptions; })()`, context);
  assert.equal(updateOptions(select, 'main', 'manual'), 'manual');
  return select.options.map(option => option.textContent);
}

test('source-filter options use localized labels, counts, and named-list copy', () => {
  const spanish = runSourceFilterOptions('es');
  assert.deepEqual(spanish, [
    'Todas las fuentes',
    'Manual',
    'Listas importadas (2)',
    'Lista: Ciencia (2)'
  ]);

  const english = runSourceFilterOptions('en');
  assert.deepEqual(english, [
    'All sources',
    'Manual',
    'Imported lists (2)',
    'List: Ciencia (2)'
  ]);
});
