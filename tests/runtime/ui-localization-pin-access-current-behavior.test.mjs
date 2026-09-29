import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const localesDir = path.join(root, 'data/ui_locales');
const catalog = locale => JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), 'utf8'));
const placeholderNames = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();
const accessKeys = [
  'profileAccess.enterMasterPinTitle',
  'profileAccess.masterPinMessage',
  'profileAccess.masterPinPlaceholder',
  'profileAccess.unlockProfileTitle',
  'profileAccess.lockedAccountMessage',
  'profileAccess.lockedProfileMessage',
  'profileAccess.profilePinPlaceholder',
  'profileAccess.unlockProfileGateMessage'
];

const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const accessStart = tabView.indexOf('function getProfileAccessCopy(');
const accessEnd = tabView.indexOf('function getAccountPolicy(', accessStart);
assert.ok(accessStart >= 0 && accessEnd > accessStart, 'profile access copy function is available');
const accessFunctionSource = tabView.slice(accessStart, accessEnd);

function resolveProfileAccessCopy(locale, { type = 'profile', profileId = 'family', name = 'Mira $& <Kids>', localized = true } = {}) {
  const translations = catalog(locale);
  const english = catalog('en');
  const window = localized ? {
    FilterTubeUiLocalization: {
      text(key, values = {}) {
        const template = translations[key] ?? english[key];
        return String(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, keyName) =>
          Object.prototype.hasOwnProperty.call(values, keyName) ? String(values[keyName]) : match);
      }
    }
  } : {};
  const context = {
    window,
    getProfileName(_profiles, requestedId) { return requestedId === 'default' ? 'Default' : name; },
    getProfileType() { return type; }
  };
  vm.createContext(context);
  return vm.runInContext(`(() => { ${accessFunctionSource}; return getProfileAccessCopy; })()`, context)({}, profileId);
}

test('PIN access translations have exact key and placeholder parity in all 38 catalogs', () => {
  const english = catalog('en');
  const targetLocales = JSON.parse(fs.readFileSync(path.join(localesDir, 'targets.json'), 'utf8'))
    .locales.map(entry => entry.code);
  assert.equal(targetLocales.length, 38);

  for (const locale of targetLocales) {
    const translated = catalog(locale);
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(english).sort(), `${locale} catalog keys`);
    for (const key of accessKeys) {
      assert.ok(typeof translated[key] === 'string' && translated[key].trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholderNames(translated[key]), placeholderNames(english[key]), `${locale}: ${key} placeholders`);
    }
  }
});

test('popup list-mode labels stay distinct from allowed and blocked status labels', () => {
  const targetLocales = JSON.parse(fs.readFileSync(path.join(localesDir, 'targets.json'), 'utf8'))
    .locales.map(entry => entry.code);
  for (const locale of targetLocales) {
    const translated = catalog(locale);
    for (const key of ['popup.blocklist', 'popup.whitelist']) {
      assert.ok(typeof translated[key] === 'string' && translated[key].trim(), `${locale}: ${key}`);
    }
    assert.notEqual(translated['popup.blocklist'], translated['popup.blocked'], `${locale}: blocklist is a list, not a blocked state`);
    assert.notEqual(translated['popup.whitelist'], translated['popup.allowed'], `${locale}: whitelist is a list, not an allowed state`);
  }
});

test('master PIN modal uses localized title, explanation, and placeholder', () => {
  const copy = resolveProfileAccessCopy('es', { profileId: 'default' });
  const spanish = catalog('es');
  assert.equal(copy.title, spanish['profileAccess.enterMasterPinTitle']);
  assert.equal(copy.message, spanish['profileAccess.masterPinMessage']);
  assert.equal(copy.placeholder, spanish['profileAccess.masterPinPlaceholder']);
});

test('independent account unlock localizes copy and preserves profile name verbatim', () => {
  const name = 'Mira $& <Kids>';
  const copy = resolveProfileAccessCopy('es', { type: 'account', name });
  const spanish = catalog('es');
  assert.equal(copy.title, `Desbloquear ${name}`);
  assert.equal(copy.message, `${name} es una cuenta independiente bloqueada. Introduce el PIN de su perfil para continuar.`);
  assert.equal(copy.placeholder, spanish['profileAccess.profilePinPlaceholder']);
  assert.equal(copy.gateMessage, `Desbloquea ${name} para ver los controles de administración.`);
});

test('protected profile uses its distinct localized explanation and safe English fallback', () => {
  const name = 'Family $& <School>';
  const copy = resolveProfileAccessCopy('hi', { name });
  const hindi = catalog('hi');
  assert.equal(copy.title, hindi['profileAccess.unlockProfileTitle'].replace('{name}', () => name));
  assert.equal(copy.message, hindi['profileAccess.lockedProfileMessage'].replace('{name}', () => name));
  assert.equal(copy.gateMessage, hindi['profileAccess.unlockProfileGateMessage'].replace('{name}', () => name));

  const fallback = resolveProfileAccessCopy('en', { name, localized: false });
  assert.equal(fallback.title, `Unlock ${name}`);
  assert.equal(fallback.message, `${name} is a locked protected profile. Enter its profile PIN to continue.`);
  assert.equal(fallback.gateMessage, `Unlock ${name} to view management controls.`);
});
