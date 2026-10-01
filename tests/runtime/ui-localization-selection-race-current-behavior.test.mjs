import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const runtimeSource = fs.readFileSync('js/ui_localization.js', 'utf8');
const bootSource = fs.readFileSync('js/ui_localization_boot.js', 'utf8');

function createHarness({ deferFrenchFetch = false, deferFirstPreferenceWrite = false } = {}) {
  const listeners = {};
  const announcements = [];
  const fetched = [];
  const writes = [];
  const label = {
    textContent: 'Original copy',
    getAttribute(name) { return name === 'data-ft-i18n' ? 'navigation.settings' : null; }
  };
  const selector = {
    value: 'auto',
    options: [{ value: 'auto' }, { value: 'en' }],
    appendChild(option) { this.options.push(option); },
    addEventListener(name, listener) { listeners[name] = listener; }
  };
  const document = {
    readyState: 'complete',
    documentElement: { lang: 'en', dir: 'ltr' },
    getElementById(id) { return id === 'ftInterfaceLanguage' ? selector : null; },
    createElement() { return { value: '', textContent: '', dataset: {} }; },
    querySelectorAll(name) { return name === '[data-ft-i18n]' ? [label] : []; }
  };

  let storedPreference = 'en';
  let releaseFrenchFetch;
  let frenchFetchStarted = false;
  let releaseFirstWrite;
  let firstWriteStarted = false;
  const catalogs = {
    en: { 'navigation.settings': 'Settings', 'settings.previewLanguage': '{language} (preview)' },
    fr: { 'navigation.settings': 'Paramètres', 'settings.previewLanguage': '{language} (aperçu)' },
    hi: { 'navigation.settings': 'सेटिंग्स', 'settings.previewLanguage': '{language} (पूर्वावलोकन)' }
  };
  const context = {
    document,
    navigator: { language: 'en' },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init.detail; }
    },
    dispatchEvent(event) { announcements.push(event.detail.locale); },
    browser: {
      runtime: { getURL(file) { return `extension://filtertube/${file}`; } },
      storage: { local: {
        async get() { return { ftUiLocalePreference: storedPreference }; },
        async set(value) {
          const locale = value.ftUiLocalePreference;
          if (deferFirstPreferenceWrite && !firstWriteStarted) {
            firstWriteStarted = true;
            await new Promise(resolve => { releaseFirstWrite = resolve; });
          }
          storedPreference = locale;
          writes.push(locale);
        }
      } }
    },
    fetch(url) {
      fetched.push(url);
      const filename = url.split('/').pop();
      if (filename === 'targets.json' || filename.endsWith('_static.json')) {
        return Promise.resolve({ ok: false });
      }
      const locale = filename.slice(0, -5);
      if (locale === 'fr' && deferFrenchFetch) {
        frenchFetchStarted = true;
        return new Promise(resolve => {
          releaseFrenchFetch = () => resolve({ ok: true, async json() { return catalogs.fr; } });
        });
      }
      assert.ok(catalogs[locale], `unexpected locale request: ${url}`);
      return Promise.resolve({ ok: true, async json() { return catalogs[locale]; } });
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(runtimeSource, context);
  vm.runInNewContext(bootSource, context);

  return {
    announcements, document, fetched, label, listeners, selector, writes,
    get storedPreference() { return storedPreference; },
    get frenchFetchStarted() { return frenchFetchStarted; },
    releaseFrenchFetch() { releaseFrenchFetch?.(); },
    get firstWriteStarted() { return firstWriteStarted; },
    releaseFirstWrite() { releaseFirstWrite?.(); },
    get locale() { return context.FilterTubeUiLocalization.locale; },
    async changeTo(locale) {
      selector.value = locale;
      return listeners.change();
    }
  };
}

async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.fail(message);
}

test('latest locale intent wins when catalog fetches finish out of order', async () => {
  const harness = createHarness({ deferFrenchFetch: true });
  await waitFor(() => harness.announcements.includes('en'), 'initial English selection did not finish');

  const olderFrenchChange = harness.changeTo('fr');
  await waitFor(() => harness.frenchFetchStarted, 'French catalog fetch did not start');
  const newerHindiChange = harness.changeTo('hi');
  await newerHindiChange;

  assert.equal(harness.locale, 'hi');
  assert.equal(harness.label.textContent, 'सेटिंग्स');
  assert.equal(harness.document.documentElement.lang, 'hi');
  assert.ok(harness.selector.options.filter(option => option.dataset?.languageName).every(option => option.textContent === option.dataset.languageName), 'supported language names have no preview suffix');
  assert.deepEqual(harness.announcements, ['en', 'hi']);

  harness.releaseFrenchFetch();
  await olderFrenchChange;
  assert.equal(harness.locale, 'hi');
  assert.equal(harness.label.textContent, 'सेटिंग्स');
  assert.equal(harness.document.documentElement.lang, 'hi');
  assert.deepEqual(harness.announcements, ['en', 'hi'], 'stale activation must not apply or announce');
  assert.equal(harness.storedPreference, 'hi');
  assert.ok(harness.selector.options.filter(option => option.dataset?.languageName).every(option => option.textContent === option.dataset.languageName), 'stale activation cannot change supported language names');
});

test('queued preference writes preserve the latest choice if an earlier write is delayed', async () => {
  const harness = createHarness({ deferFirstPreferenceWrite: true });
  await waitFor(() => harness.announcements.includes('en'), 'initial English selection did not finish');

  const olderFrenchChange = harness.changeTo('fr');
  await waitFor(() => harness.firstWriteStarted, 'first preference write did not start');
  const newerHindiChange = harness.changeTo('hi');
  harness.releaseFirstWrite();
  await Promise.all([olderFrenchChange, newerHindiChange]);

  assert.deepEqual(harness.writes, ['fr', 'hi']);
  assert.equal(harness.storedPreference, 'hi');
  assert.equal(harness.locale, 'hi');
  assert.equal(harness.document.documentElement.lang, 'hi');
  assert.equal(harness.fetched.some(url => url.endsWith('/fr.json')), false,
    'superseded preference should not start a catalog request after its delayed write');
  assert.deepEqual(harness.announcements, ['en', 'hi']);
});
