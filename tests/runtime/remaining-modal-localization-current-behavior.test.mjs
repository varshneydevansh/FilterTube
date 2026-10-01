import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/remaining-modal-source.json', 'utf8'));
function functionSource(name) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0);
  const start = source.lastIndexOf('\n', at) + 1;
  return source.slice(start, source.slice(at + 10).search(/\n    (?:async )?function /) + at + 10);
}

test('remaining modal messages are keyed and format examples retain parser tokens', () => {
  assert.equal(Object.keys(batch.english).length, 65);
  for (const [key, value] of Object.entries(batch.english)) {
    assert.ok(source.includes(key), key);
    assert.ok(source.includes(JSON.stringify(value)) || source.includes(`'${value}'`), `${key}: exact fallback`);
  }
  const formats = Object.values(batch.english).join('\n');
  for (const token of ['channel_id,keyword,notes', 'type,value,notes', 'channel: @SomeChannel', 'keyword: brainrot', 'channels and keywords', 'filterData']) assert.ok(formats.includes(token));
});

test('actual remote-target confirmation keeps protected rejection and account choice semantics', async () => {
  let modal;
  const local = { profileId: 'local-id', profileType: 'child', profileName: 'My private name' };
  const remote = { profileId: 'remote-id', profileType: 'account', profileName: 'Remote private name' };
  const calls = [];
  const context = vm.createContext({
    normalizeString: value => String(value || '').trim(),
    getNanahEffectivePolicySourceProfileContext: () => local,
    getNanahSelectedRemoteTargetProfile: () => null,
    normalizeNanahTargetProfileContext: value => value || {},
    nanahSessionState: { remoteProfile: remote },
    normalizeNanahProfileContext: value => value,
    formatNanahProfileContext: value => value.profileName,
    getNanahRemoteLabel: () => 'My remote device name',
    tabViewUiText: (key, fallback, values = {}) => { calls.push([key, values]); return `translated:${key}:${Object.values(values).join('|')}`; },
    showChoiceModal: async value => { modal = value; return 'continue'; }
  });
  vm.runInContext(`${functionSource('getNanahScopeLabel')}\n${functionSource('nanahModalScopeLabel')}\n${functionSource('confirmNanahRemoteTarget')}\nthis.run = confirmNanahRemoteTarget;`, context);
  assert.equal(await context.run('keywords'), false, 'protected profile cannot send anyway');
  assert.deepEqual(Array.from(modal.choices, value => value.value), ['ok']);
  assert.ok(modal.title.startsWith('translated:'));
  assert.ok(modal.details.every(value => value.startsWith('translated:')));
  const mismatch = calls.find(([key]) => key.endsWith('remoteTargetMismatch'))[1];
  assert.equal(mismatch.localProfile, 'My private name');
  assert.equal(mismatch.remoteProfile, 'Remote private name');
  assert.equal(mismatch.remoteDevice, 'My remote device name');
  assert.ok(mismatch.scope.includes('dashboard.sync.scope.keywords'));
  assert.equal(local.profileId, 'local-id');
  assert.equal(remote.profileId, 'remote-id');
  local.profileType = 'account';
  assert.equal(await context.run('keywords'), true);
  assert.deepEqual(Array.from(modal.choices, value => value.value), ['continue', 'cancel']);
  assert.equal(modal.choices[1].recommended, true);
  assert.equal(await context.run('full'), true, 'full-backup boundary is unchanged');
});

test('scope display uses existing keys without changing canonical scope helpers', () => {
  const context = vm.createContext({ normalizeString: value => String(value || '').trim(), tabViewUiText: key => key });
  vm.runInContext(`${functionSource('getNanahScopeLabel')}\n${functionSource('nanahModalScopeLabel')}\nthis.display = nanahModalScopeLabel; this.raw = getNanahScopeLabel;`, context);
  assert.equal(context.display('rules_bundle'), 'dashboard.sync.scope.ruleBundle');
  assert.equal(context.raw('rules_bundle'), 'Rule bundle');
  assert.equal(context.display('full'), 'dashboard.sync.scope.fullBackup');
  assert.equal(context.display('unknown'), 'dashboard.sync.scope.activeProfile');
});
