import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/ui_localization.js'), 'utf8');
const dashboardCss = fs.readFileSync(path.join(root, 'css/tab-view.css'), 'utf8');

function loadRuntime() {
  const fetched = [];
  const documentElement = { lang: 'en' };
  const document = { documentElement, querySelectorAll() { return []; } };
  const context = {
    document,
    browser: { runtime: { getURL(file) { return `extension://filtertube/${file}`; } } },
    fetch: async url => {
      fetched.push(url);
      if (url.endsWith('_static.json')) return { ok: false };
      const locale = url.match(/\/data\/ui_locales\/([a-z]{2,3}(?:-[A-Za-z0-9]+)*)\.json$/)?.[1];
      assert.ok(locale, `unexpected remote catalog request: ${url}`);
      assert.ok(fs.existsSync(path.join(root, `data/ui_locales/${locale}.json`)), `missing local catalog: ${locale}`);
      return { ok: true, async json() {
        return JSON.parse(fs.readFileSync(path.join(root, `data/ui_locales/${locale}.json`), 'utf8'));
      } };
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return { api: context.FilterTubeUiLocalization, fetched, document };
}

test('only completed interface locales are released and all catalogs stay bundled', async () => {
  const { api, fetched } = loadRuntime();
  assert.equal(JSON.stringify(api.releasedLocales), '["en"]');
  assert.equal(await api.select('ru-RU'), 'en', 'staged Russian must not silently become a released locale');
  assert.equal(api.text('navigation.settings'), 'Settings');
  assert.equal(await api.select('ru-RU', { allowStaged: true }), 'ru');
  assert.equal(api.text('navigation.settings'), 'Настройки');
  await assert.rejects(api.loadCatalog('xx'), /not released/);
  assert.equal(fetched.filter(url => !url.endsWith('_static.json')).length, 2,
    'the local English and Russian keyed catalogs are fetched once each');
  assert.ok(fetched.every(url => url.startsWith('extension://filtertube/data/ui_locales/')));
});

test('script-aware browser locales resolve to an exact released catalog', async () => {
  const withChinese = source.replace("Object.freeze(['en'])", "Object.freeze(['en', 'zh-Hans'])");
  const fetched = [];
  const context = {
    browser: { runtime: { getURL(file) { return `extension://filtertube/${file}`; } } },
    async fetch(url) {
      fetched.push(url);
      return { ok: true, async json() { return { 'navigation.settings': 'Settings' }; } };
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(withChinese, context);
  assert.equal(await context.FilterTubeUiLocalization.select('zh-CN'), 'zh-Hans');
  assert.ok(fetched.some(url => url.endsWith('/zh-Hans.json')));
  assert.equal(await context.FilterTubeUiLocalization.select('zh-TW'), 'en', 'Traditional Chinese must not silently use Simplified');
});

test('Tamil and Gujarati drafts can be previewed without being released', async () => {
  const { api } = loadRuntime();
  assert.equal(await api.select('ta-IN'), 'en');
  assert.equal(await api.select('ta-IN', { allowStaged: true }), 'ta');
  assert.equal(api.text('navigation.settings'), 'அமைப்புகள்');
  assert.equal(await api.select('gu-IN', { allowStaged: true }), 'gu');
  assert.equal(api.text('navigation.settings'), 'સેટિંગ્સ');
});

test('localization writes text, never HTML, and leaves user data outside keyed elements', async () => {
  const { api, document } = loadRuntime();
  await api.select('ru', { allowStaged: true });
  const label = { textContent: 'Settings', getAttribute() { return 'navigation.settings'; } };
  const userRule = { textContent: '<user keyword>', getAttribute() { return null; } };
  const button = {
    attributes: {},
    getAttribute(name) { return name === 'data-ft-i18n-aria-label' ? 'popup.openFullSettings' : null; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  document.querySelectorAll = selector => selector === '[data-ft-i18n]' ? [label] :
    selector === '[data-ft-i18n-aria-label]' ? [button] : [];
  api.apply(document);
  assert.equal(label.textContent, 'Настройки');
  assert.equal(button.attributes['aria-label'], 'Открыть все настройки');
  assert.equal(userRule.textContent, '<user keyword>');
  assert.equal(document.documentElement.lang, 'ru');
  assert.equal(document.documentElement.dir, 'ltr');
});

test('dashboard static-copy capture never translates text inserted or changed by controllers', async () => {
  const staticNode = { nodeValue: ' Dashboard ', isConnected: true,
    parentElement: { closest() { return false; } } };
  const changedNode = { nodeValue: ' Settings ', isConnected: true,
    parentElement: { closest() { return false; } } };
  const keyedNode = { nodeValue: 'Settings', isConnected: true,
    parentElement: { closest() { return true; } } };
  const titled = { isConnected: true, attributes: { title: 'Settings' },
    closest() { return false; }, hasAttribute() { return false; },
    getAttribute(name) { return this.attributes[name] || null; },
    setAttribute(name, value) { this.attributes[name] = value; } };
  const body = { querySelectorAll() { return [titled]; } };
  const document = {
    body, documentElement: {}, querySelectorAll() { return []; },
    createTreeWalker() {
      const nodes = [staticNode, changedNode, keyedNode];
      return { nextNode() { return nodes.shift() || null; } };
    }
  };
  const context = {
    document,
    browser: { runtime: { getURL(file) { return `extension://filtertube/${file}`; } } },
    async fetch(url) {
      if (url.endsWith('ru_static.json')) return { ok: true, async json() {
        return { Dashboard: 'Панель управления', Settings: 'Настройки' };
      } };
      const locale = url.match(/\/([a-z]{2})\.json$/)?.[1];
      return { ok: true, async json() {
        return JSON.parse(fs.readFileSync(path.join(root, `data/ui_locales/${locale}.json`), 'utf8'));
      } };
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const api = context.FilterTubeUiLocalization;
  api.captureStatic(body);
  changedNode.nodeValue = 'User-supplied setting';
  const addedLater = { nodeValue: 'Dashboard' };
  await api.select('ru', { allowStaged: true });
  api.apply(document);
  assert.equal(staticNode.nodeValue, ' Панель управления ');
  assert.equal(titled.attributes.title, 'Настройки');
  assert.equal(changedNode.nodeValue, 'User-supplied setting');
  assert.equal(keyedNode.nodeValue, 'Settings');
  assert.equal(addedLater.nodeValue, 'Dashboard');
  await api.select('en');
  api.apply(document);
  assert.equal(staticNode.nodeValue, ' Dashboard ');
  assert.equal(titled.attributes.title, 'Settings');
});

test('all staged catalogs load from bundled URLs and right-to-left previews set direction', async () => {
  const { api, fetched, document } = loadRuntime();
  for (const locale of api.stagedLocales) {
    assert.equal(await api.select(locale, { allowStaged: true }), locale);
    assert.ok(api.text('navigation.settings'));
  }
  assert.equal(fetched.filter(url => !url.endsWith('_static.json')).length, 38);
  assert.ok(fetched.every(url => url.startsWith('extension://filtertube/data/ui_locales/')));
  for (const locale of ['ar', 'arz', 'apc', 'apd', 'fa', 'ur', 'pa-Arab']) {
    await api.select(locale, { allowStaged: true });
    api.apply(document);
    assert.equal(document.documentElement.dir, 'rtl', locale);
  }
  await api.select('hi', { allowStaged: true });
  api.apply(document);
  assert.equal(document.documentElement.dir, 'ltr');
});

test('popup and dashboard load local catalogs after their shells and before applying keyed copy', () => {
  const english = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/en.json'), 'utf8'));
  for (const file of ['html/popup.html', 'html/tab-view.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const runtimeAt = html.indexOf('src="../js/ui_localization.js"');
    const shellAt = html.indexOf('src="../js/ui-shell/');
    const bootAt = html.indexOf('src="../js/ui_localization_boot.js"');
    assert.ok(runtimeAt >= 0 && runtimeAt < shellAt && shellAt < bootAt, `${file} localization load order`);
    for (const [, key] of html.matchAll(/data-ft-i18n(?:-(?:title|placeholder|aria-label))?="([^"]+)"/g)) {
      assert.ok(english[key], `${file} refers to unknown key ${key}`);
    }
  }
  const dashboard = fs.readFileSync(path.join(root, 'html/tab-view.html'), 'utf8');
  assert.ok(dashboard.indexOf('src="../js/ui_localization.js"') <
    dashboard.indexOf('src="../js/ui_static_copy_capture.js"'));
  assert.ok(dashboard.indexOf('src="../js/ui_static_copy_capture.js"') <
    dashboard.indexOf('src="../js/tab-view.js"'), 'static copy must be captured before controller mutations');
  const shell = fs.readFileSync(path.join(root, 'src/extension-shell/popup.jsx'), 'utf8');
  for (const [, key] of shell.matchAll(/data-ft-i18n(?:-(?:title|placeholder|aria-label))?="([^"]+)"/g)) {
    assert.ok(english[key], `popup shell refers to unknown key ${key}`);
  }
});

test('the 38-language target set is explicit and drafts are previewable without being called complete', () => {
  const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8'));
  assert.equal(targets.locales.length, 38);
  const codes = targets.locales.map(entry => entry.code);
  assert.equal(new Set(codes).size, 38);
  assert.ok(codes.includes('ta') && codes.includes('gu'));
  for (const code of codes) assert.equal(Intl.getCanonicalLocales(code)[0], code);
  const { api } = loadRuntime();
  for (const locale of api.releasedLocales) assert.ok(codes.includes(locale));
  assert.equal(api.stagedLocales.length, 37);
  assert.deepEqual(new Set([...api.releasedLocales, ...api.stagedLocales]), new Set(codes));
  assert.ok(!api.releasedLocales.includes('ru'), 'partial Russian copy must not be presented as complete');
  assert.ok(!api.releasedLocales.includes('ta') && !api.releasedLocales.includes('gu'), 'partial Tamil and Gujarati copy must not be presented as complete');
  const html = fs.readFileSync(path.join(root, 'html/tab-view.html'), 'utf8');
  const settings = html.slice(html.indexOf('id="settingsView"'), html.indexOf('id="syncView"'));
  assert.match(settings, /id="ftInterfaceLanguage"/);
  assert.doesNotMatch(settings, /id="ftInterfaceLanguageField"[^>]*hidden/, 'language selector must not depend on metadata loading to appear');
  assert.match(settings, /data-ft-i18n="settings.interfaceLanguageHint"/);
  assert.doesNotMatch(settings, /<option value="ru"/, 'target options are populated from the local manifest');
  const css = fs.readFileSync(path.join(root, 'css/tab-view.css'), 'utf8');
  assert.match(css, /\.ft-interface-language-field\[hidden\]\s*\{\s*display:\s*none/);
});

test('Settings offers draft-language previews while keeping the completion notice', async () => {
  const boot = fs.readFileSync(path.join(root, 'js/ui_localization_boot.js'), 'utf8');
  const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8')).locales;
  const options = [{ value: 'auto' }, { value: 'en' }];
  const selected = [];
  const writes = [];
  const listeners = {};
  const selector = {
    value: 'auto', options,
    appendChild(option) { options.push(option); },
    addEventListener(event, listener) { listeners[event] = listener; }
  };
  const field = { hidden: false };
  const document = {
    getElementById(id) { return id === 'ftInterfaceLanguage' ? selector : id === 'ftInterfaceLanguageField' ? field : { hidden: false }; },
    createElement() { return { value: '', textContent: '' }; }
  };
  const context = {
    document, navigator: { language: 'ru-RU' },
    FilterTubeUiLocalization: {
      releasedLocales: ['en'],
      stagedLocales: targets.map(entry => entry.code).filter(code => code !== 'en'),
      async select(value, options) { selected.push([value, options?.allowStaged]); return value; },
      apply() {}
    },
    browser: {
      runtime: { getURL(file) { return `extension://filtertube/${file}`; } },
      storage: { local: {
        async get() { return { ftUiLocalePreference: 'ru' }; },
        async set(value) { writes.push(value); }
      } }
    },
    async fetch(url) {
      assert.equal(url, 'extension://filtertube/data/ui_locales/targets.json');
      return { ok: true, async json() {
        return JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8'));
      } };
    }
  };
  context.window = context;
  vm.runInNewContext(boot, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(selector.value, 'ru');
  assert.equal(field.hidden, false, 'draft languages must be visible as previews');
  assert.equal(options.length, 39, 'browser-language choice plus all 38 targets');
  assert.deepEqual(new Set(options.map(option => option.value)), new Set(['auto', ...targets.map(entry => entry.code)]));
  assert.equal(JSON.stringify(selected), '[["ru",true]]');
  selector.value = 'en';
  await listeners.change();
  assert.equal(JSON.stringify(writes), '[{"ftUiLocalePreference":"en"}]');
  assert.equal(JSON.stringify(selected), '[["ru",true],["en",true]]');
});

test('automatic browser language does not silently activate an incomplete preview', async () => {
  const boot = fs.readFileSync(path.join(root, 'js/ui_localization_boot.js'), 'utf8');
  const selected = [];
  const context = {
    document: { getElementById() { return null; } },
    navigator: { language: 'ta-IN' },
    FilterTubeUiLocalization: {
      releasedLocales: ['en'], stagedLocales: ['ta'],
      async select(value, options) { selected.push([value, options?.allowStaged]); return 'en'; },
      apply() {}
    },
    browser: { storage: { local: { async get() { return { ftUiLocalePreference: 'auto' }; } } } }
  };
  context.window = context;
  vm.runInNewContext(boot, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.stringify(selected), '[["ta-IN",false]]');
});

test('Settings still offers preview locales if target-name metadata is unavailable', async () => {
  const boot = fs.readFileSync(path.join(root, 'js/ui_localization_boot.js'), 'utf8');
  const options = [{ value: 'auto' }, { value: 'en' }];
  const selector = {
    value: 'auto', options,
    appendChild(option) { options.push(option); },
    addEventListener() {}
  };
  const context = {
    document: {
      getElementById(id) { return id === 'ftInterfaceLanguage' ? selector : { hidden: false }; },
      createElement() { return { value: '', textContent: '' }; }
    },
    navigator: { language: 'en' },
    FilterTubeUiLocalization: {
      releasedLocales: ['en'], stagedLocales: ['ru', 'ta', 'gu'],
      async select() {}, apply() {}
    },
    browser: {
      runtime: { getURL(file) { return `extension://filtertube/${file}`; } },
      storage: { local: { async get() { return {}; } } }
    },
    async fetch() { throw new Error('metadata unavailable'); }
  };
  context.window = context;
  vm.runInNewContext(boot, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(options.map(option => option.value), ['auto', 'en', 'ru', 'ta', 'gu']);
  assert.ok(options.slice(2).every(option => option.textContent.includes('(preview)')));
});

test('popup copy is reapplied after dynamically created controls exist', async () => {
  const boot = fs.readFileSync(path.join(root, 'js/ui_localization_boot.js'), 'utf8');
  const listeners = {};
  let dynamicControlsExist = false;
  const applied = [];
  const document = {
    readyState: 'loading',
    getElementById() { return null; },
    addEventListener(event, listener) { listeners[event] = listener; }
  };
  const context = {
    document,
    navigator: { language: 'en' },
    FilterTubeUiLocalization: {
      releasedLocales: ['en'],
      async select() { return 'en'; },
      apply() { applied.push(dynamicControlsExist); }
    }
  };
  context.window = context;
  vm.runInNewContext(boot, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(applied, [false]);
  dynamicControlsExist = true;
  listeners.DOMContentLoaded();
  assert.deepEqual(applied, [false, true]);
});

test('dashboard directional controls mirror in right-to-left previews', () => {
  assert.match(dashboardCss, /:root\[dir="rtl"\] \.nav-toggle\s*\{[^}]*right:\s*1rem/s);
  assert.match(dashboardCss, /:root\[dir="rtl"\] \.ft-success-toast\s*\{[^}]*left:\s*20px/s);
  assert.match(dashboardCss, /:root\[dir="rtl"\] \.help-flow article:not\(:last-child\)::after\s*\{[^}]*content:\s*"←"/s);
});
