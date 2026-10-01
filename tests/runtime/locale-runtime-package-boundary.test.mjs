import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

test('packages include runtime locales but omit build-time translation drafts', () => {
  const source = fs.readFileSync('build.js', 'utf8');
  const start = source.indexOf('const filterFunc =');
  const end = source.indexOf('\nmain().catch', start);
  const context = vm.createContext({ path, __dirname: process.cwd() });
  vm.runInContext(`${source.slice(start, end)}\nthis.include = filterFunc;`, context);
  for (const file of ['data/ui_locales/batches', 'data/ui_locales/batches/remaining-modal-source.json', path.resolve('data/ui_locales/batches/provider-modal-translations-a.json')]) assert.equal(context.include(file), false, file);
  for (const file of ['data/ui_locales', 'data/ui_locales/ru.json', 'data/ui_locales/ar_static.json', 'data/ui_locales/release_notes.ta.json', 'data/ui_locales/targets.json', 'js/ui_localization.js']) assert.equal(context.include(file), true, file);
  assert.equal(context.include('data/ui_locales/batches-other'), true, 'only the exact draft directory is excluded');
  assert.equal(context.include('data/.DS_Store'), false, 'existing package hygiene remains');
});
