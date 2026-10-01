import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/generated-status-source.json', 'utf8'));

function harness(translations = {}) {
  const helperStart = source.indexOf('function tabViewUiText(');
  const helperEnd = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', helperStart);
  const start = source.indexOf('const SUBSCRIPTION_IMPORT_DISPLAY_COPY = Object.freeze(');
  const end = source.indexOf('\n    function formatImportedChannelEnrichmentWait', start);
  const status = { textContent: '', hidden: true };
  const actions = { innerHTML: '', hidden: true };
  const notice = { classList: { remove() {}, add() {}, toggle() {} }, setAttribute() {}, hidden: true };
  const context = vm.createContext({
    normalizeString: value => String(value || '').trim(),
    importSubscriptionsNotice: notice,
    importSubscriptionsStatus: status,
    importSubscriptionsActions: actions,
    subscriptionsImportState: {},
    window: { FilterTubeUiLocalization: { text(key, values = {}) {
      return translations[key]?.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => String(values[name]));
    } } }
  });
  vm.runInContext(`${source.slice(helperStart, helperEnd)}\n${source.slice(start, end)}\nthis.run = renderSubscriptionsImportState; this.dictionary = SUBSCRIPTION_IMPORT_DISPLAY_COPY;`, context);
  return { context, status, actions, notice };
}

test('generated-status source covers display lookups and visible status call sites', () => {
  const { context } = harness();
  assert.equal(Object.keys(batch.english).length, 40);
  for (const [key, value] of Object.entries(batch.english)) {
    assert.ok(source.includes(key), key);
    if (key.startsWith('dashboard.subscriptionStatus.')) assert.equal(context.dictionary[key], value);
    else assert.ok(source.includes(`'${value}'`));
  }
  assert.ok(source.includes('return tabViewCompileDisplayCopy(entries)'), 'Family Devices reuses the same compiler');
  assert.ok(source.includes('renderSubscriptionsImportState();\n        if (!profilesV4Cache) return;'), 'language changes re-render current import state');
});

test('actual subscription renderer localizes progress without mutating state or private tab text', () => {
  const translations = {
    'dashboard.subscriptionStatus.reading': 'Localized tab {tab}',
    'dashboard.subscriptionStatus.new': 'New: {count}',
    'dashboard.subscriptionStatus.pageReadOther': 'Pages read: {count}'
  };
  const { context, status, notice } = harness(translations);
  const state = { phase: 'fetching', tone: 'info', message: 'Reading subscribed channels from My private tab <🙂>…', meta: '2 new • 3 pages read', inProgress: true, canEnableWhitelist: false, requestId: 'secret-request-id', sourceTabId: 123 };
  const snapshot = JSON.stringify(state);
  context.subscriptionsImportState = state;
  context.run();
  assert.equal(status.textContent, 'Localized tab My private tab <🙂> New: 2 • Pages read: 3');
  assert.equal(notice.hidden, false);
  assert.equal(JSON.stringify(state), snapshot);
  translations['dashboard.subscriptionStatus.reading'] = 'Other language {tab}';
  context.run();
  assert.ok(status.textContent.startsWith('Other language My private tab <🙂>'));
  assert.equal(JSON.stringify(state), snapshot);
});

test('unknown runtime details pass through and singular/plural progress resolves separately', () => {
  const { context, status } = harness({
    'dashboard.subscriptionStatus.collectedOne': 'One channel: {count}',
    'dashboard.subscriptionStatus.collectedOther': 'Channel count: {count}'
  });
  for (const [count, noun, expected] of [[1, 'channel', 'One channel: 1'], [0, 'channels', 'Channel count: 0'], [2, 'channels', 'Channel count: 2'], [5, 'channels', 'Channel count: 5']]) {
    context.subscriptionsImportState = { phase: 'fetching', tone: 'info', inProgress: true, message: `Collected ${count} subscribed ${noun} so far.`, meta: '' };
    context.run();
    assert.equal(status.textContent, expected);
  }
  context.subscriptionsImportState = { phase: 'fetching', tone: 'info', inProgress: true, message: 'Raw provider detail: private value <🙂>', meta: 'Unknown metadata detail' };
  context.run();
  assert.equal(status.textContent, 'Raw provider detail: private value <🙂> Unknown metadata detail');
});
