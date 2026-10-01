import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const batch = JSON.parse(read('data/ui_locales/batches/on-page-controls.json'));

function contentCopyInstaller() {
  const source = read('js/content/block_channel.js');
  const start = source.indexOf('(function installFilterTubeContentUiCopy(root) {');
  const marker = '\n})(window);';
  const end = source.indexOf(marker, start);
  assert.ok(start >= 0 && end > start, 'content UI copy installer is present');
  return source.slice(start, end + marker.length);
}

async function loadContentCopy({ locale, localeCatalog = {}, browserLanguage = 'en-US' }) {
  const requests = [];
  const window = {
    navigator: { language: browserLanguage },
    chrome: {
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: locale }); } } },
      runtime: { getURL: file => `chrome-extension://filtertube/${file}` }
    }
  };
  const context = {
    window,
    chrome: window.chrome,
    Intl,
    fetch: async url => {
      requests.push(url);
      assert.match(url, /^chrome-extension:\/\/filtertube\/data\/ui_locales\//);
      if (!url.endsWith(`/${locale === 'auto' ? 'ar' : locale}.json`)) return { ok: false };
      return { ok: true, json: async () => localeCatalog };
    }
  };
  vm.createContext(context);
  vm.runInContext(contentCopyInstaller(), context);
  const copy = window.__filterTubeContentUiCopy;
  assert.ok(copy, 'installer exposes a content-world text lookup');
  await copy.ready;
  return { copy, requests };
}

test('on-page English batch keys are referenced by the quick-block and content-menu surfaces', () => {
  assert.equal(typeof batch.english, 'object');
  const sources = `${read('js/content/block_channel.js')}\n${read('js/content_bridge.js')}`;
  for (const key of Object.keys(batch.english).filter(key => key.startsWith('content.'))) {
    assert.ok(sources.includes(key), `missing runtime lookup for ${key}`);
  }
  assert.equal(batch.english['content.quickBlock.ariaLabel'], 'Quick block all channels on this card');
  assert.equal(batch.english['content.menu.channelResolving'], '{name} (resolving…)');
});

test('content copy loads the selected packaged catalog locally and falls back per key', async () => {
  const { copy, requests } = await loadContentCopy({
    locale: 'fr',
    localeCatalog: {
      'content.menu.allCollaborators': 'Tous les {count} collaborateurs',
      'content.menu.filterTubeMenu': 'Menu FilterTube'
    }
  });

  assert.equal(copy.text('content.menu.allCollaborators', 'All {count} Collaborators', { count: 3 }), 'Tous les 3 collaborateurs');
  assert.equal(copy.text('content.menu.filterTubeMenu', 'FilterTube menu'), 'Menu FilterTube');
  assert.equal(copy.text('content.menu.fallbackHint', 'Fallback menu'), 'Fallback menu');
  assert.deepEqual(requests, ['chrome-extension://filtertube/data/ui_locales/fr.json']);
});

test('English preference uses the English fallback without requesting a catalog', async () => {
  const { copy, requests } = await loadContentCopy({ locale: 'en' });

  assert.equal(copy.text('content.menu.block', 'Block'), 'Block');
  assert.deepEqual(requests, []);
});

test('automatic browser language activates the supported content-menu catalog', async () => {
  const { copy, requests } = await loadContentCopy({
    locale: 'auto',
    browserLanguage: 'ar-EG',
    localeCatalog: { 'content.menu.block': 'حظر' }
  });

  assert.equal(copy.text('content.menu.block', 'Block'), 'حظر');
  assert.ok(requests.some(url => url.endsWith('/ar.json')));
});
