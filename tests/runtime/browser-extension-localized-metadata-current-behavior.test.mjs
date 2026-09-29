import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const localesRoot = path.join(root, '_locales');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const englishMessages = readJson('_locales/en/messages.json');
const targets = readJson('data/ui_locales/targets.json').locales.map(locale => locale.code);

// Exact Chrome Web Store locale identifiers are used here. The source UI catalog
// has generic Portuguese and Simplified Chinese, so these map only to the
// corresponding supported region-specific browser IDs.
const browserLocaleDirectoriesByTarget = {
  am: ['am'],
  ar: ['ar'],
  bn: ['bn'],
  de: ['de'],
  es: ['es'],
  fa: ['fa'],
  fil: ['fil'],
  fr: ['fr'],
  gu: ['gu'],
  hi: ['hi'],
  id: ['id'],
  it: ['it'],
  ja: ['ja'],
  kn: ['kn'],
  ko: ['ko'],
  mr: ['mr'],
  pt: ['pt_BR', 'pt_PT'],
  ru: ['ru'],
  sw: ['sw'],
  ta: ['ta'],
  te: ['te'],
  th: ['th'],
  tr: ['tr'],
  vi: ['vi'],
  'zh-Hans': ['zh_CN']
};

const unsupportedTargetLocales = [
  'apc', 'apd', 'arz', 'bho', 'ha', 'jv', 'pa-Arab', 'pcm', 'ur',
  'wuu-Hans', 'yue-Hant', 'yo'
];

test('browser metadata translations cover only supported target locale IDs', () => {
  assert.equal(englishMessages.extensionName.message, 'FilterTube');
  assert.equal(englishMessages.extensionDescription.message, 'Restore peace of mind to your digital video experience.');
  assert.deepEqual(
    [...Object.keys(browserLocaleDirectoriesByTarget), ...unsupportedTargetLocales].sort(),
    targets.filter(locale => locale !== 'en').sort()
  );

  const expectedDirectories = Object.values(browserLocaleDirectoriesByTarget).flat().sort();
  const actualDirectories = fs.readdirSync(localesRoot).filter(locale => locale !== 'en').sort();
  assert.deepEqual(actualDirectories, expectedDirectories, 'unsupported locale folders must retain English fallback');

  for (const directory of expectedDirectories) {
    const messages = readJson(`_locales/${directory}/messages.json`);
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(englishMessages).sort(), directory);
    assert.equal(messages.extensionName.message, 'FilterTube', `${directory} preserves the product name`);
    assert.ok(messages.extensionDescription.message.trim(), `${directory} has a description`);
    assert.notEqual(messages.extensionDescription.message, englishMessages.extensionDescription.message, `${directory} is localized`);
    assert.equal(messages.extensionDescription.message.includes('\n'), false, `${directory} description is one sentence`);
  }
});

test('all manifests retain English fallback and resolve browser-provided metadata', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = readJson(file);
    assert.equal(manifest.default_locale, 'en', file);
    assert.equal(manifest.name, '__MSG_extensionName__', file);
    assert.equal(manifest.description, '__MSG_extensionDescription__', file);
  }
});

test('release packaging includes every browser metadata locale', () => {
  const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
  assert.match(build, /const COMMON_DIRS = \[[^\]]*'_locales'/);
  assert.match(build, /const ALL_BROWSER_TARGETS = \['chrome', 'firefox', 'opera'\]/);
});
