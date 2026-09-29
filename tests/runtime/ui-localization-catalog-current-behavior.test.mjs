import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const localesDir = path.join(root, 'data/ui_locales');
const readCatalog = locale => JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), 'utf8'));
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();

test('every dynamic UI key referenced by popup, dashboard, and rule renderer has English source copy', () => {
  const english = readCatalog('en');
  for (const file of ['js/popup.js', 'js/tab-view.js', 'js/render_engine.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const keys = [...source.matchAll(/["']((?:popup|dashboard|profileAccess|render)\.[\w.]+)["']/g)]
      .map(match => match[1]);
    for (const key of new Set(keys)) {
      assert.equal(typeof english[key], 'string', `${file}: missing English source for ${key}`);
      assert.ok(english[key].trim(), `${file}: empty English source for ${key}`);
    }
  }
});

test('staged Russian UI catalog has complete English key and placeholder parity', () => {
  const english = readCatalog('en');
  const russian = readCatalog('ru');
  assert.deepEqual(Object.keys(russian).sort(), Object.keys(english).sort());
  for (const [key, source] of Object.entries(english)) {
    assert.equal(typeof source, 'string', key);
    assert.ok(source.trim(), `${key} has empty English copy`);
    assert.equal(typeof russian[key], 'string', key);
    assert.ok(russian[key].trim(), `${key} has empty Russian copy`);
    assert.deepEqual(placeholders(russian[key]), placeholders(source), `${key} changes placeholders`);
    assert.doesNotMatch(russian[key], /<[^>]+>/, `${key} must not contain HTML`);
  }
});

test('completed dashboard static catalogs match the English source inventory', () => {
  const source = JSON.parse(fs.readFileSync(path.join(localesDir, 'en_static.json'), 'utf8'));
  const targets = JSON.parse(fs.readFileSync(path.join(localesDir, 'targets.json'), 'utf8'));
  for (const locale of targets.locales.map(target => target.code).filter(code => code !== 'en')) {
    const translated = JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}_static.json`), 'utf8'));
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(source).sort(), `${locale} source keys`);
    for (const [key, value] of Object.entries(translated)) {
      assert.ok(typeof value === 'string' && value.trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(value), placeholders(key), `${locale}: ${key} placeholders`);
    }
  }
});

test('Amharic dashboard copy has no accidental Cyrillic or Armenian script', () => {
  const translated = JSON.parse(fs.readFileSync(path.join(localesDir, 'am_static.json'), 'utf8'));
  for (const [source, value] of Object.entries(translated)) {
    assert.doesNotMatch(value, /[\u0400-\u052f\u0530-\u058f]/u, `am: ${source}`);
  }
});

test('each browser manifest resolves localized identity through the English fallback', () => {
  const messages = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));
  assert.equal(messages.extensionName.message, 'FilterTube');
  assert.equal(messages.extensionDescription.message, 'Restore peace of mind to your digital video experience.');
  for (const filename of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
    assert.equal(manifest.default_locale, 'en', filename);
    assert.equal(manifest.name, '__MSG_extensionName__', filename);
    assert.equal(manifest.description, '__MSG_extensionDescription__', filename);
  }
});

test('background What’s New banner uses local release copy without changing its canonical destination', async () => {
  const source = fs.readFileSync(path.join(root, 'js/background.js'), 'utf8');
  const start = source.indexOf('const localizedReleaseNotesCache = new Map();');
  const end = source.indexOf('function getBackgroundRuntimeLabel()', start);
  assert.ok(start >= 0 && end > start);
  const localized = JSON.parse(fs.readFileSync(path.join(localesDir, 'release_notes.ru.json'), 'utf8'));
  const requests = [];
  const context = {
    Map,
    browserAPI: { runtime: { getURL(file) { return `extension://filtertube/${file}`; } } },
    async storageGet() { return { ftUiLocalePreference: 'ru' }; },
    async loadReleaseNotesData() { return [{ version: '3.3.7', headline: 'English headline', bannerSummary: 'English summary', ctaLabel: 'Open What’s New' }]; },
    fetch(url) { requests.push(url); return Promise.resolve({ ok: true, json: () => Promise.resolve(localized) }); },
    RELEASE_NOTES_TEMPLATE: { headline: 'Fallback headline', body: 'Fallback body', ctaLabel: 'Fallback CTA' },
    WHATS_NEW_PAGE_URL: 'extension://filtertube/html/tab-view.html#whats-new',
    console
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  const payload = await vm.runInContext('buildReleaseNotesPayload("3.3.7")', context);
  assert.equal(payload.headline, localized['3.3.7'].headline);
  assert.equal(payload.body, localized['3.3.7'].bannerSummary);
  assert.equal(payload.ctaLabel, localized['3.3.7'].ctaLabel);
  assert.equal(payload.link, context.WHATS_NEW_PAGE_URL);
  assert.deepEqual(requests, ['extension://filtertube/data/ui_locales/release_notes.ru.json']);
});

test('staged keys still describe copy present on extension UI surfaces', () => {
  const english = readCatalog('en');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/content_controls_catalog.js'), 'utf8'), context);
  const groups = context.window.FilterTubeContentControlsCatalog.getCatalog();
  const controls = new Map(groups.flatMap(group => group.controls.map(control => [control.key, control])));
  const categories = new Map(context.window.FilterTubeContentControlsCatalog.getCategoryOptions()
    .map(option => [option.labelKey, option]));
  const surfaces = [
    'src/extension-shell/popup.jsx',
    'html/tab-view.html',
    'js/popup.js',
    'js/tab-view.js',
    'js/render_engine.js',
    'js/content/first_run_prompt.js',
    'js/content/block_channel.js',
    'js/content_bridge.js',
    'js/managed_parent_command_center.js',
    'js/content/admission_overlay.js',
    'js/content/external_youtube_guard.js'
  ].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  for (const [key, source] of Object.entries(english)) {
    if (key.startsWith('content.category.')) {
      assert.equal(categories.get(key)?.label, source, key);
      continue;
    }
    if (key.startsWith('controls.group.')) {
      assert.equal(groups.find(group => group.id === key.slice('controls.group.'.length))?.title, source, key);
      continue;
    }
    if (key.startsWith('controls.title.')) {
      assert.equal(controls.get(key.slice('controls.title.'.length))?.title, source, key);
      continue;
    }
    if (key.startsWith('controls.description.')) {
      assert.equal(controls.get(key.slice('controls.description.'.length))?.description?.replace(/\s+/g, ' '), source, key);
      continue;
    }
    if (key.startsWith('profileAccess.') || key.startsWith('dashboard.') || key.startsWith('popup.') || key.startsWith('render.') || key.startsWith('admission.') || key.startsWith('family.')) {
      assert.ok(surfaces.includes(key) || surfaces.includes(source), `${key} is wired to a runtime UI surface`);
      continue;
    }
    assert.ok(surfaces.includes(source), `${key} no longer matches current UI copy`);
  }
});

test('Russian draft covers the current What’s New release without altering release metadata', () => {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data/release_notes.json'), 'utf8'));
  const latest = source.find(entry => /^\d+\.\d+\.\d+$/.test(entry?.version || ''));
  const translated = JSON.parse(fs.readFileSync(path.join(localesDir, 'release_notes.ru.json'), 'utf8'));
  const draft = translated[latest.version];
  assert.ok(draft, `missing current release ${latest.version}`);
  for (const field of ['headline', 'summary', 'bannerSummary']) {
    assert.ok(typeof draft[field] === 'string' && draft[field].trim(), `missing ${field}`);
  }
  assert.equal(draft.highlights.length, latest.highlights.length);
  assert.ok(draft.highlights.every(value => typeof value === 'string' && value.trim()));
  assert.equal(draft.detailsUrl, undefined, 'the canonical release URL is not translated');
});
