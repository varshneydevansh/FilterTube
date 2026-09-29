import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = file => fs.readFileSync(file, 'utf8');
const english = JSON.parse(read('data/ui_locales/en.json'));
const core = JSON.parse(read('data/ui_locales/batches/family-control.json'));
const deferred = JSON.parse(read('data/ui_locales/batches/family-control-deferred.json'));
const source = `${read('js/managed_parent_command_center.js')}\n${read('js/tab-view.js')}`;

test('every generated family-control lookup has one English source key', () => {
  const references = new Set([...source.matchAll(/'(family\.[^']+)'/g)].map(match => match[1]));
  assert.equal(references.size, 324);
  for (const key of references) {
    assert.equal(typeof english[key], 'string', `${key} has English source copy`);
    assert.ok(english[key].trim(), `${key} is nonempty`);
    assert.ok(Object.hasOwn(core, key) || Object.hasOwn(deferred, key), `${key} belongs to one translation batch`);
  }
  assert.equal(Object.keys(core).length + Object.keys(deferred).length, references.size);
});

test('family-control batches retain their distinct core and deferred scopes', () => {
  for (const [key, value] of Object.entries({ ...core, ...deferred })) {
    assert.equal(english[key], value, `${key} English fallback has not drifted`);
  }
  assert.equal(Object.keys(core).length, 167);
  assert.equal(Object.keys(deferred).length, 157);
});
