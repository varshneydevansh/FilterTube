import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/batches/toasts-b.json'), 'utf8'));

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

const managedLists = sliceBetween(tabView, 'function formatManagedRuleListCount(', 'function isSelfControlSessionActive(');

test('managed list localization source batch is flat English source with referenced keys and placeholders', () => {
  assert.ok(batch.english && typeof batch.english === 'object');
  assert.equal(batch.translations, undefined, 'translation drafts are added in a later localization pass');
  assert.ok(Object.keys(batch.english).length > 100, 'the managed-list source batch should cover the bounded feature slice');

  for (const [key, fallback] of Object.entries(batch.english)) {
    assert.ok(key.startsWith('dashboard.managedLists.'), `unexpected source key ${key}`);
    assert.equal(typeof fallback, 'string');
    assert.ok(fallback.trim(), `empty English fallback for ${key}`);
    const reference = key.startsWith('dashboard.managedLists.toast.')
      ? key.slice('dashboard.managedLists.toast.'.length)
      : key;
    assert.ok(managedLists.includes(reference), `${key} is not wired into the managed-list slice`);
    assert.doesNotMatch(fallback, /<[^>]+>/, `${key} must not put markup in locale copy`);
  }

  assert.equal(batch.english['dashboard.managedLists.importIntro'],
    'Import a channel/keyword list, review what FilterTube understood, then apply it to {target}. Lists become ordinary profile rules first; they never change profiles, PINs, trusted devices, viewing access, or time limits.');
  assert.equal(batch.english['dashboard.managedLists.updatedManagedRules'],
    '{count} {profileNoun} updated with managed {ruleType}');
  assert.equal(batch.english['dashboard.managedLists.toast.noProfilesNeededListState'],
    'No selected profiles needed that list {state}');
  assert.deepEqual([...new Set([...batch.english['dashboard.managedLists.updatedManagedRules'].matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]))].sort(),
    ['count', 'profileNoun', 'ruleType']);
});

test('managed rule-list toast paths no longer pass literal English directly to the toast UI', () => {
  assert.doesNotMatch(managedLists, /UIComponents\.showToast\(\s*['"`]/);
  assert.match(managedLists, /function showManagedRuleListToast\(key, fallback, type = 'info', values = \{\}\)/);
  assert.match(managedLists, /tabViewUiText\(`dashboard\.managedLists\.toast\.\$\{key\}`, fallback, values\)/);
});
