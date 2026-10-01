import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    function createCompactCondition(', source.indexOf('function initializeFiltersTabs()'));
const end = source.indexOf('\n    const container =', start);
assert.ok(start >= 0 && end > start);

function runCondition(options) {
  const element = tag => ({ tag, style: {}, children: [], appendChild(node) { this.children.push(node); } });
  const context = {
    document: { createElement: element },
    setTabViewLocalizedCopy(node, property, key, fallback) {
      node[property] = `translated:${key}`;
      node.fallback = fallback;
    }
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)}\nthis.buildCondition = createCompactCondition;`, context);
  return context.buildCondition(options);
}

test('dashboard startup creates localized compact conditions without an undeclared labelKey', () => {
  const row = runCondition({ name: 'duration', value: 'longer', labelText: 'Block longer than',
    labelKey: 'tabView.videoFilters.blockLongerThan', fields: [
      { type: 'number', id: 'minutes', min: 1 },
      { type: 'text', text: 'min', textKey: 'tabView.videoFilters.minuteAbbreviation' }
    ] });
  assert.equal(row.children[0].children[1].textContent, 'translated:tabView.videoFilters.blockLongerThan');
  assert.equal(row.children[0].children[1].htmlFor, 'duration_longer');
  assert.equal(row.children[1].children[0].min, 1);
  assert.equal(row.children[1].children[1].textContent, 'translated:tabView.videoFilters.minuteAbbreviation');
});

test('compact conditions without a translation key retain their fallback label', () => {
  const row = runCondition({ name: 'duration', value: 'shorter', labelText: 'Block shorter than', fields: [] });
  assert.equal(row.children[0].children[1].textContent, 'Block shorter than');
});

test('Main and Kids channel localization bindings stay inside their owning initializer', () => {
  const main = source.slice(source.indexOf('function initializeFiltersTabs()'), source.indexOf('function initializeKidsTabs()'));
  const kids = source.slice(source.indexOf('function initializeKidsTabs()'), source.indexOf('window.initializeKidsTabs'));
  assert.ok(main.includes('bindTabViewLocalizedMarkup(channelsContent);'));
  assert.ok(!kids.includes('bindTabViewLocalizedMarkup(channelsContent);'));
  assert.ok(kids.includes('bindTabViewLocalizedMarkup(kidsChannelsContent);'));
});
