import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    function updateNanahModeCardCopy(');
const end = source.indexOf('    function updateNanahPolicyControls()', start);
const runtime = source.slice(start, end);
const english = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
const key = 'dashboard.sync.setup.familyReceiverProfile';
function steps(mode, translated = null) {
  const list = { children: [], appendChild(node) { this.children.push(node); }, set innerHTML(value) { assert.equal(value, ''); this.children = []; } };
  const context = {
    document: { createElement: () => ({ textContent: '' }) }, getNanahUiMode: () => mode,
    isNanahChildReceiveOnly: () => false, isNanahChildReplicaOnly: () => false,
    getNanahRole: () => 'source', nanahSessionState: {}, normalizeString: value => typeof value === 'string' ? value : '',
    getNanahSelectedRemoteTargetProfile: () => null, getNanahScope: () => 'active', getActiveProfileType: () => 'account',
    tabViewUiText: (requested, fallback) => requested === key ? translated || english[key] || fallback : english[requested] || fallback,
    refreshNanahAdvancedSummary() {}, setNanahModeButtons() {}
  };
  for (const id of new Set(runtime.match(/\bftNanah\w+/g))) context[id] = null;
  context.ftNanahModeSteps = list;
  vm.runInNewContext(runtime, context); context.updateNanahModeUi();
  return list.children.map(node => node.textContent);
}

test('actual family guide explains the receiving protected profile before pairing and retains phrase verification', () => {
  const guide = steps('parent_control');
  assert.match(guide[1], /receiving device, create or switch to the intended protected profile before entering the code or scanning QR/);
  assert.match(guide[2], /Match the safety phrase/);
  const html = fs.readFileSync(new URL('../../html/tab-view.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`<li>${english[key]}</li>`), 'initial HTML and runtime family instructions agree');
});

test('family instruction uses its own localization key without reusing stale pairing-only copy', () => {
  assert.equal(steps('parent_control', 'Translated receiving profile setup')[1], 'Translated receiving profile setup');
});

test('ordinary personal copy and full-account setup retain their separate existing instructions', () => {
  const personal = steps('send_once');
  assert.deepEqual(personal, ['Use this for your own second device.', 'Pair with the short code or QR and match the phrase.', 'Send once; the other device reviews before applying.']);
  assert.equal(steps('full_account').some(step => step.includes('intended protected profile')), false);
});
