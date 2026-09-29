import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const batch = JSON.parse(read('data/ui_locales/batches/content-menu-action-status.json'));
const translationDraft = JSON.parse(read('data/ui_locales/batches/content-menu-action-status-translations.json'));
const targetLocales = JSON.parse(read('data/ui_locales/targets.json')).locales
  .map(locale => locale.code)
  .filter(locale => locale !== 'en');
const source = read('js/content_bridge.js');

const expectedEnglish = {
  'content.menu.actionBlockChannel': 'Block Channel',
  'content.menu.actionFetching': 'Fetching...',
  'content.menu.actionBlockingSingular': 'Blocking {count} channel...',
  'content.menu.actionBlockingPlural': 'Blocking {count} channels...',
  'content.menu.actionBlockedCount': '✓ Blocked {count}',
  'content.menu.actionBlockedChannelSingular': '✓ Blocked {count} channel',
  'content.menu.actionBlockedChannels': '✓ Blocked {count} channels',
  'content.menu.actionBrokenHandle': '✗ Channel handle broken (404)',
  'content.menu.actionFailed': '✗ Failed to block',
  'content.menu.actionError': '✗ Error'
};

function loadContentMenuText(translations = {}) {
  const start = source.indexOf('function filterTubeContentMenuText(key, fallback, values = {}) {');
  const marker = '\n}\n';
  const end = source.indexOf(marker, start);
  assert.ok(start >= 0 && end > start, 'content menu text helper is present');
  const context = {
    window: {
      __filterTubeContentUiCopy: {
        text(key, fallback, values = {}) {
          const value = translations[key] || fallback;
          return String(value).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
        }
      }
    },
    Object,
    String
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end + marker.length)}\nglobalThis.lookup = filterTubeContentMenuText;`, context);
  return context.lookup;
}

test('action-status English source batch matches the keyed menu copy', () => {
  assert.deepEqual(batch.english, expectedEnglish);
  for (const key of Object.keys(expectedEnglish)) {
    assert.ok(source.includes(`'${key}'`), `missing runtime lookup for ${key}`);
  }

  assert.match(source, /selectedKeys\.length === 1\s*\? filterTubeContentMenuText\('content\.menu\.actionBlockingSingular'/);
  assert.match(source, /successCount === 1\s*\? filterTubeContentMenuText\('content\.menu\.actionBlockedChannelSingular'/);
  assert.doesNotMatch(source, /titleSpan\.textContent\s*=\s*['"](?:Fetching\.\.\.|✗ Channel handle broken \(404\)|✗ Failed to block|✗ Error)['"]/);
});

test('action-status copy interpolates count placeholders and falls back to English', () => {
  const localized = loadContentMenuText({
    'content.menu.actionBlockingPlural': 'Blokiranje {count} kanala...'
  });
  const english = loadContentMenuText();

  assert.equal(localized('content.menu.actionBlockingPlural', expectedEnglish['content.menu.actionBlockingPlural'], { count: 3 }), 'Blokiranje 3 kanala...');
  assert.equal(localized('content.menu.actionBlockedChannels', expectedEnglish['content.menu.actionBlockedChannels'], { count: 2 }), '✓ Blocked 2 channels');
  assert.equal(english('content.menu.actionBlockingSingular', expectedEnglish['content.menu.actionBlockingSingular'], { count: 1 }), 'Blocking 1 channel...');
});

test('action-status translation draft covers each target locale in key order with exact placeholders', () => {
  const keys = Object.keys(batch.english);
  assert.deepEqual(translationDraft.keys, keys);
  assert.deepEqual(Object.keys(translationDraft.translations), targetLocales);

  const placeholders = text => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort();
  for (const locale of targetLocales) {
    const values = translationDraft.translations[locale];
    assert.equal(values.length, keys.length, `${locale} translation count`);
    values.forEach((value, index) => {
      assert.equal(typeof value, 'string', `${locale} ${keys[index]} should be text`);
      assert.ok(value.trim(), `${locale} ${keys[index]} should not be empty`);
      assert.deepEqual(placeholders(value), placeholders(batch.english[keys[index]]), `${locale} ${keys[index]} placeholders`);
    });
  }
});
