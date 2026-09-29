import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const popupSource = fs.readFileSync(path.join(root, 'js/popup.js'), 'utf8');
const batchPath = path.join(root, 'data/ui_locales/batches/popup-language-choice-source.json');
const sourceBatch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const helperSource = popupSource.match(
  /^function popupUiText\(key, fallback, values = \{\}\) \{[\s\S]*?^\}/m
)?.[0];
const labelHelperSource = popupSource.match(
  /^function popupLanguageChoiceLabel\(languageName, languageCode, selected\) \{[\s\S]*?^\}/m
)?.[0];

function localizedText(catalog) {
  return (key, values = {}) => {
    const template = catalog[key];
    if (typeof template !== 'string') return undefined;
    return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
      (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  };
}

test('popup language-choice accessibility copy has a stable English source and placeholders', () => {
  assert.ok(helperSource, 'popupUiText helper is present');
  assert.ok(labelHelperSource, 'popup language-choice label helper is present');
  assert.deepEqual(Object.keys(sourceBatch.english), ['popup.languageChoiceLabel']);
  assert.equal(sourceBatch.english['popup.languageChoiceLabel'], '{language} ({code}), {selectionState}');
  assert.deepEqual(
    [...sourceBatch.english['popup.languageChoiceLabel'].matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
      .map(match => match[1]).sort(),
    ['code', 'language', 'selectionState']
  );
});

test('language filter buttons announce translated selection state with an English format fallback', () => {
  const localizedContext = {
    window: {
      FilterTubeUiLocalization: {
        text: localizedText({
          'popup.selected': 'selected-es',
          'popup.notSelected': 'not-selected-es',
          'popup.languageChoiceLabel': '{language} ({code}) — {selectionState}'
        })
      }
    }
  };
  vm.runInNewContext(`${helperSource}\n${labelHelperSource}`, localizedContext);
  assert.equal(localizedContext.popupLanguageChoiceLabel('English', 'en', true), 'English (EN) — selected-es');
  assert.equal(localizedContext.popupLanguageChoiceLabel('Español', 'es', false), 'Español (ES) — not-selected-es');

  const fallbackContext = {
    window: {
      FilterTubeUiLocalization: {
        text: localizedText({ 'popup.selected': 'selected-es', 'popup.notSelected': 'not-selected-es' })
      }
    }
  };
  vm.runInNewContext(`${helperSource}\n${labelHelperSource}`, fallbackContext);
  assert.equal(fallbackContext.popupLanguageChoiceLabel('English', 'en', true), 'English (EN), selected-es');
  assert.equal(fallbackContext.popupLanguageChoiceLabel('Español', 'es', false), 'Español (ES), not-selected-es');

  assert.match(popupSource, /pill\.setAttribute\('aria-label', popupLanguageChoiceLabel\(displayLabel, option\.code, active\)\)/);
  assert.match(popupSource, /filtertube-ui-locale-changed', \(\) => \{\s*renderPopupCategoryList\(\);\s*updatePopupCategorySummary\(\);\s*renderPopupLanguageList\(\)/);
});
