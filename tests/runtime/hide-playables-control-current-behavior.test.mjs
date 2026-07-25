import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function loadCatalog() {
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/content_controls_catalog.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.FilterTubeContentControlsCatalog.getCatalog()));
}

function loadSettingsApi() {
  const sandbox = {
    window: {},
    console,
    chrome: {
      storage: {
        local: {
          get(_keys, callback) { callback({}); },
          set(_payload, callback) { callback?.(); }
        }
      }
    }
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/settings_shared.js'), sandbox);
  return sandbox.window.FilterTubeSettings;
}

function renderControlStyles(settings) {
  const source = read('js/content/dom_fallback.js');
  const functionSource = sliceBetween(
    source,
    'function ensureContentControlStyles(settings) {',
    '\n\nfunction hideYouTubeOpenAppButtons()'
  );
  const styles = new Map();
  const documentElement = { setAttribute() {} };
  const document = {
    location: { pathname: '/' },
    documentElement,
    head: {
      appendChild(style) {
        styles.set(style.id, style);
      }
    },
    getElementById(id) {
      return styles.get(id) || null;
    },
    createElement(tagName) {
      assert.equal(tagName, 'style');
      return { id: '', textContent: '' };
    }
  };
  const sandbox = {
    CSS: { supports: () => true },
    document,
    hideYouTubeOpenAppButtons() {},
    settings
  };
  vm.createContext(sandbox);
  vm.runInContext(`${functionSource}\nensureContentControlStyles(settings);`, sandbox);
  return styles.get('filtertube-content-controls-style')?.textContent || '';
}

test('catalog exposes Hide YouTube Playables in the Feeds group', () => {
  const catalog = loadCatalog();
  const feeds = catalog.find((group) => group.id === 'feed');
  const control = feeds?.controls.find((candidate) => candidate.key === 'hidePlayables');

  assert.deepEqual(control, {
    key: 'hidePlayables',
    title: 'Hide YouTube Playables',
    description: 'Hide Playables shelves, game cards, and navigation entries'
  });
});

test('hidePlayables emits route-based desktop and mobile selectors only when enabled', () => {
  const disabledCss = renderControlStyles({ hidePlayables: false });
  const enabledCss = renderControlStyles({ hidePlayables: true });

  assert.doesNotMatch(disabledCss, /\/playables|mini-game-card-view-model/);
  assert.match(enabledCss, /ytm-rich-section-renderer:has\(a\[href\^="\/playables"\]\)/);
  assert.match(enabledCss, /ytm-rich-shelf-renderer:has\(a\[href\^="\/playables"\]\)/);
  assert.match(enabledCss, /ytd-rich-section-renderer:has\(a\[href\^="\/playables"\]\)/);
  assert.match(enabledCss, /mini-game-card-view-model/);
  assert.doesNotMatch(enabledCss, /YouTube Playables/);
});

test('hidePlayables participates in settings persistence and refresh owners', () => {
  const compiled = loadSettingsApi().buildCompiledSettings({
    keywords: [],
    channels: [],
    enabled: true,
    hidePlayables: true,
    contentFilters: {},
    categoryFilters: {}
  });
  assert.equal(compiled.hidePlayables, true);

  for (const file of [
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/background.js',
    'js/io_manager.js',
    'js/content/bridge_settings.js',
    'js/content/block_channel.js'
  ]) {
    assert.match(read(file), /hidePlayables/, `${file} must carry hidePlayables`);
  }
});
