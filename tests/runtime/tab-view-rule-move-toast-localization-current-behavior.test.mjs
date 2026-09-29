import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const sourceBatch = JSON.parse(fs.readFileSync(
  path.join(root, 'data/ui_locales/batches/rule-editor-move-toasts-source.json'),
  'utf8'
));
const translationDraft = JSON.parse(fs.readFileSync(
  path.join(root, 'data/ui_locales/batches/rule-editor-move-toasts-translations.json'),
  'utf8'
));
const targetLocales = JSON.parse(fs.readFileSync(
  path.join(root, 'data/ui_locales/targets.json'),
  'utf8'
)).locales.map(locale => locale.code);
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const english = sourceBatch.english;
const keys = Object.keys(english);
const expected = {
  'dashboard.ruleEditor.move.keywordToBlocked': 'Keyword moved to Blocked rules',
  'dashboard.ruleEditor.move.keywordToAllowed': 'Keyword moved to Allowed rules',
  'dashboard.ruleEditor.move.channelToBlocked': 'Channel moved to Blocked rules',
  'dashboard.ruleEditor.move.channelToAllowed': 'Channel moved to Allowed rules',
  'dashboard.ruleEditor.move.kidsKeywordToBlocked': 'Kids keyword moved to Blocked rules',
  'dashboard.ruleEditor.move.kidsKeywordToAllowed': 'Kids keyword moved to Allowed rules',
  'dashboard.ruleEditor.move.kidsChannelToBlocked': 'Kids channel moved to Blocked rules',
  'dashboard.ruleEditor.move.kidsChannelToAllowed': 'Kids channel moved to Allowed rules'
};

test('rule-move English batch has stable, runtime-used source keys', () => {
  assert.deepEqual(english, expected);
  for (const key of Object.keys(expected)) assert.ok(tabView.includes(key), `runtime references ${key}`);
  assert.equal((tabView.match(/ruleMoveSuccessToastText\('/g) || []).length, 4,
    'Main and Kids keyword/channel list move callbacks use localized status copy');
});

test('rule-move translation draft covers each non-English locale in source order', () => {
  assert.deepEqual(translationDraft.keys, keys);
  assert.deepEqual(
    Object.keys(translationDraft.translations),
    targetLocales.filter(locale => locale !== 'en')
  );
  const placeholderNames = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map(match => match[1]).sort();
  for (const [locale, values] of Object.entries(translationDraft.translations)) {
    assert.equal(values.length, keys.length, `${locale}: translation count`);
    values.forEach((value, index) => {
      assert.ok(typeof value === 'string' && value.trim(), `${locale}: ${keys[index]}`);
      assert.deepEqual(
        placeholderNames(value),
        placeholderNames(english[keys[index]]),
        `${locale}: ${keys[index]} placeholders`
      );
    });
  }
});

test('rule-move toast helper selects the correct localized destination copy', () => {
  const start = tabView.indexOf('function ruleMoveSuccessToastText(kind, targetList) {');
  const end = tabView.indexOf('\n    function isAdvancedRuleListActive(', start);
  assert.ok(start >= 0 && end > start, 'rule move toast helper is available');
  const calls = [];
  const context = {
    tabViewUiText(key, fallback) {
      calls.push([key, fallback]);
      return `localized:${key}`;
    }
  };
  vm.createContext(context);
  const getText = vm.runInContext(
    `(() => { ${tabView.slice(start, end)}; return ruleMoveSuccessToastText; })()`,
    context
  );
  const cases = [
    ['keyword', 'allow', 'dashboard.ruleEditor.move.keywordToBlocked'],
    ['keyword', 'block', 'dashboard.ruleEditor.move.keywordToAllowed'],
    ['channel', 'allow', 'dashboard.ruleEditor.move.channelToBlocked'],
    ['channel', 'block', 'dashboard.ruleEditor.move.channelToAllowed'],
    ['kidsKeyword', 'allow', 'dashboard.ruleEditor.move.kidsKeywordToBlocked'],
    ['kidsKeyword', 'block', 'dashboard.ruleEditor.move.kidsKeywordToAllowed'],
    ['kidsChannel', 'allow', 'dashboard.ruleEditor.move.kidsChannelToBlocked'],
    ['kidsChannel', 'block', 'dashboard.ruleEditor.move.kidsChannelToAllowed']
  ];
  for (const [kind, currentList, key] of cases) {
    assert.equal(getText(kind, currentList), `localized:${key}`);
    assert.deepEqual(calls.at(-1), [key, expected[key]]);
  }
  assert.equal(getText('unknown', 'block'), '');
});
