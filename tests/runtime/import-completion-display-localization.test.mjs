import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/final-import-display-source.json', 'utf8'));
const helperStart = source.indexOf('function tabViewUiText(');
const helperEnd = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', helperStart);
const start = source.indexOf('    const IMPORT_COMPLETION_DISPLAY_COPY =');
const end = source.indexOf('    async function showRuleListImportCompletion', start);

test('import completion localizes exact generated copy without rewriting private or technical text', () => {
  const catalog = {
    ...JSON.parse(fs.readFileSync('data/ui_locales/en.json', 'utf8')),
    ...batch.english
  };
  const context = vm.createContext({
    normalizeString: value => String(value || '').trim(),
    window: { FilterTubeUiLocalization: { text(key, values) {
      assert.ok(catalog[key], key);
      return `Localized: ${catalog[key].replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => String(values[name]))}`;
    } } }
  });
  vm.runInContext(`${source.slice(helperStart, helperEnd)}\n${source.slice(start, end)}\nthis.render = importCompletionDisplayCopy;`, context);
  for (const count of [0, 1, 2, 5]) {
    const text = `Imported ${count} ${count === 1 ? 'rule' : 'rules'} into Private surface <🙂>.`;
    assert.equal(context.render(text), `Localized: ${text}`);
    assert.ok(context.render(`${count} imported channel ${count === 1 ? 'row needs' : 'rows need'} manual verification; see Import Reports for the exact YouTube reason.`).startsWith('Localized:'));
    for (const pacing of ['at', 'with']) {
      const pending = `Channel details continue in the background (${count} pending), one row at a time ${pacing} a randomized 7–15 second interval while the worker is awake; large lists can take time. Closing this dashboard does not stop the queue. Permanent not-found or terminated rows stop retrying and remain in Import Reports for manual verification.`;
      assert.ok(context.render(pending).includes(`(${count} pending)`));
      assert.ok(context.render(pending).startsWith('Localized:'));
    }
  }
  for (const raw of ['My private report title', 'runtime_error_43: https://private.example', 'UCprivateChannelID']) assert.equal(context.render(raw), raw);
  assert.ok(source.includes('details = safeArray(details).map(importCompletionDisplayCopy);'));
  assert.ok(source.includes('].map(importCompletionDisplayCopy),'), 'BlockTube details share the same display boundary');
});

test('language selector availability copy is accurate and preview labels wait for catalog activation', () => {
  const html = fs.readFileSync('html/tab-view.html', 'utf8');
  const boot = fs.readFileSync('js/ui_localization_boot.js', 'utf8');
  assert.ok(html.includes('data-ft-i18n="settings.translationAvailability"'));
  assert.ok(html.includes(batch.english['settings.translationAvailability']));
  assert.ok(!html.includes('English is the only complete interface language today.'));
  const population = boot.slice(boot.indexOf('async function populateSelector'), boot.indexOf('async function activate'));
  assert.ok(!population.includes("ui.text('settings.previewLanguage'"), 'catalogs are not ready before activate');
  assert.ok(boot.slice(boot.indexOf('function announceLocale')).includes("ui.text('settings.previewLanguage'"));
});
