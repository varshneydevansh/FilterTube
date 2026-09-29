import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');

test('dashboard category and language filter modes use existing localized keys', () => {
  const helperSource = tabView.match(
    /function tabViewUiText\(key, fallback, values = \{\}\) \{[\s\S]*?function localizeFilterModeOptions\(select\) \{[\s\S]*?^\}/m
  )?.[0];
  assert.ok(helperSource, 'dashboard localization helpers are present');

  const translations = {
    'popup.blockSelected': 'Bloquear seleccionados',
    'popup.allowOnlySelected': 'Permitir solo seleccionados',
    'popup.allowed': 'Permitidos',
    'popup.blocked': 'Bloqueados',
    'popup.noCategories': 'No hay categorías seleccionadas — el filtro está inactivo',
    'popup.noLanguages': 'No hay idiomas seleccionados — el filtro está inactivo'
  };
  const context = {
    FilterTubeUiLocalization: {
      text(key) { return translations[key]; },
      apply(select) {
        for (const option of select.options) {
          const key = option.attributes['data-ft-i18n'];
          if (key) option.textContent = translations[key];
        }
      }
    }
  };
  context.window = context;
  vm.runInNewContext(helperSource, context);

  const options = ['block', 'allow'].map(value => ({
    value,
    textContent: value === 'block' ? 'Block selected' : 'Allow only selected',
    attributes: {},
    setAttribute(name, content) { this.attributes[name] = content; }
  }));
  const select = { options };
  context.localizeFilterModeOptions(select);

  assert.deepEqual(options.map(option => option.attributes['data-ft-i18n']), [
    'popup.blockSelected', 'popup.allowOnlySelected'
  ]);
  assert.deepEqual(options.map(option => option.textContent), [
    translations['popup.blockSelected'], translations['popup.allowOnlySelected']
  ]);
  assert.equal(context.tabViewUiText('popup.allowed', 'Allowed'), translations['popup.allowed']);
  assert.equal(context.tabViewUiText('missing.key', 'fallback'), 'fallback');

  for (const call of [
    'localizeFilterModeOptions(categoryMainMode)',
    'localizeFilterModeOptions(languageModeMain)',
    'localizeFilterModeOptions(kidsCategoryMode)'
  ]) assert.ok(tabView.includes(call), `${call} wires a dynamic dashboard select`);

  for (const key of ['popup.allowed', 'popup.blocked', 'popup.noCategories', 'popup.noLanguages']) {
    assert.ok(tabView.includes(key), `${key} localizes a dynamic selection summary`);
  }
  assert.match(tabView, /filtertube-ui-locale-changed', updateCategorySelectionSummary/);
  assert.match(tabView, /filtertube-ui-locale-changed', updateLanguageSelectionSummary/);
  assert.match(tabView, /filtertube-ui-locale-changed', updateKidsCategorySelectionSummary/);
});

test('all bundled UI catalogs include the dynamic filter-mode and summary keys', () => {
  const localesDir = path.join(root, 'data/ui_locales');
  const targets = JSON.parse(fs.readFileSync(path.join(localesDir, 'targets.json'), 'utf8'));
  const keys = [
    'popup.blockSelected', 'popup.allowOnlySelected', 'popup.allowed',
    'popup.blocked', 'popup.noCategories', 'popup.noLanguages'
  ];

  for (const { code } of targets.locales) {
    const catalog = JSON.parse(fs.readFileSync(path.join(localesDir, `${code}.json`), 'utf8'));
    for (const key of keys) {
      assert.equal(typeof catalog[key], 'string', `${code}: ${key}`);
      assert.ok(catalog[key].trim(), `${code}: ${key} is not empty`);
    }
  }
});
