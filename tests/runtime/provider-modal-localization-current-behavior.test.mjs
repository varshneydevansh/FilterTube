import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/provider-modal-source.json', 'utf8'));
function functionSource(name) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0);
  const start = source.lastIndexOf('\n', at) + 1;
  const end = source.slice(at + 10).search(/\n    (?:async )?function /) + at + 10;
  return source.slice(start, end);
}

test('provider setup copy has exact keyed fallbacks and retains protocol inputs', () => {
  assert.equal(Object.keys(batch.english).length, 44);
  for (const [key, value] of Object.entries(batch.english)) {
    assert.ok(source.includes(`tabViewUiText(${JSON.stringify(key)}, ${JSON.stringify(value)})`), key);
  }
  for (const name of ['configureNanahManagedMailboxServer', 'configureNanahManagedLocalNetworkProvider']) {
    const body = functionSource(name);
    for (const value of ['sensitiveAction: true', "action === 'disable'", "rawToken === '-'", 'nextConfig.authToken = rawToken', "inputType: 'password'", 'writeNanahManaged']) {
      assert.ok(body.includes(value), `${name}: ${value}`);
    }
  }
  assert.ok(functionSource('configureNanahManagedMailboxServer').includes("placeholder: 'https://your-filtertube-pickup-service'"));
  assert.ok(functionSource('configureNanahManagedLocalNetworkProvider').includes("placeholder: 'http://192.168.1.10:8787/filtertube'"));
});

test('actual provider choice builder localizes defaults without changing action values or caller data', async () => {
  let captured;
  const context = vm.createContext({
    tabViewUiText: (key) => `translated:${key}`,
    safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => String(value || '').trim(),
    showChoiceModal: async value => { captured = value; return 'configure'; }
  });
  vm.runInContext(`${functionSource('promptManagedProviderSetupAction')}\nthis.run = promptManagedProviderSetupAction;`, context);
  assert.equal(await context.run({ configured: true }), 'configure');
  assert.ok(captured.title.startsWith('translated:'));
  assert.ok(captured.message.startsWith('translated:'));
  assert.ok(captured.details.every(value => value.startsWith('translated:')));
  assert.deepEqual(Array.from(captured.choices, choice => choice.value), ['configure', 'disable']);
  assert.ok(captured.choices.every(choice => choice.label.startsWith('translated:')));
  const details = ['My private provider instructions'];
  await context.run({ title: 'My endpoint', message: 'My message', details, configureLabel: 'My button', extraChoices: [{ value: 'user_action', label: 'My action' }] });
  assert.equal(captured.title, 'My endpoint');
  assert.equal(captured.message, 'My message');
  assert.equal(captured.details, details);
  assert.equal(captured.choices[0].label, 'My button');
  assert.equal(captured.choices[1].value, 'user_action');
  assert.equal(captured.choices[1].label, 'My action');
});

test('actual nearby helper dialog localizes copy while keeping code and helper actions', async () => {
  let captured;
  let copied = 0;
  const context = vm.createContext({
    tabViewUiText: key => `translated:${key}`,
    showChoiceModal: async value => { captured = value; return 'copy_helper'; },
    copyNanahNearbyHelperCommand: async () => { copied++; },
    ftNanahCompassLiveBtn: { click() { throw new Error('code action was not selected'); } }
  });
  vm.runInContext(`${functionSource('showNanahNearbyHelperChoice')}\nthis.run = showNanahNearbyHelperChoice;`, context);
  assert.equal(await context.run(), 'copy_helper');
  assert.equal(copied, 1);
  assert.ok(captured.title.startsWith('translated:'));
  assert.ok(captured.message.startsWith('translated:'));
  assert.ok(captured.details.every(value => value.startsWith('translated:')));
  assert.deepEqual(Array.from(captured.choices, choice => choice.value), ['use_code', 'copy_helper']);
  assert.ok(captured.choices.every(choice => choice.label.startsWith('translated:')));
});
