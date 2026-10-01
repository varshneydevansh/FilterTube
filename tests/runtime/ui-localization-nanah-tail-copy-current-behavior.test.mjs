import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const tailStart = source.indexOf('async function configureNanahManagedMailboxServer(');
assert.ok(tailStart > 0, 'Nanah tail begins at its stable provider-setup boundary');
const tailSource = source.slice(tailStart);
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/batches/toasts-c.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/en.json'), 'utf8'));

function buildTextHelper(translations = {}) {
  const start = source.indexOf('function tabViewUiText(');
  const end = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', start);
  assert.ok(start >= 0 && end > start, 'tab-view localization helper exists');
  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          const template = translations[key];
          if (typeof template !== 'string') return null;
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
        }
      }
    }
  };
  return vm.runInNewContext(`${source.slice(start, end)}\ntabViewUiText`, context);
}

test('Nanah tail localization keys are present in the merged English catalog', () => {
  const referenced = new Set([...tailSource.matchAll(/['"](dashboard\.sync\.[^'"]+)['"]/g)].map(match => match[1]));
  assert.equal(Object.keys(batch).length, 1, 'source batch contains no translations or catalog metadata');
  assert.ok(batch.english && typeof batch.english === 'object' && !Array.isArray(batch.english));
  assert.ok(referenced.size >= 150, 'bounded Nanah pass includes the expected set of stable keys');
  for (const key of referenced) {
    assert.equal(typeof english[key], 'string', `Merged English source exists for ${key}`);
    assert.ok(english[key].trim(), `Merged English source is nonempty for ${key}`);
  }
});
test('Nanah English fallbacks and translations interpolate values without rewriting user data', () => {
  const translate = buildTextHelper({
    'dashboard.sync.toast.receiveSessionCodeReady': 'Localized session {code}',
    'dashboard.sync.hint.sessionTargetsNamedProfile': 'Targets {profile} on {device}'
  });
  assert.equal(
    translate('dashboard.sync.toast.receiveSessionCodeReady', 'Session code {code} is ready.', { code: 'A1B2' }),
    'Localized session A1B2'
  );
  assert.equal(
    translate('dashboard.sync.hint.sessionTargetsNamedProfile', 'This session targets {profile} on {device}.', {
      profile: '<Kids & Family>',
      device: 'Mira’s tablet'
    }),
    'Targets <Kids & Family> on Mira’s tablet'
  );
  assert.equal(
    translate('dashboard.sync.toast.sentManyManagedUpdates', 'Sent {count} verified policy queues', { count: 3 }),
    'Sent 3 verified policy queues'
  );
});
