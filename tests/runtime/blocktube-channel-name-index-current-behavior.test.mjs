import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

function loadIdentity() {
  const window = {};
  vm.runInNewContext(fs.readFileSync('js/shared/identity.js', 'utf8'), {
    window,
    console
  }, { filename: 'js/shared/identity.js' });
  return window.FilterTubeIdentity;
}

function blockTubeNameRule(value) {
  return {
    id: '',
    name: value,
    originalInput: value,
    source: 'blocktube-channel-name'
  };
}

test('BlockTube channel-name rules use channel-only boundary and regex semantics', () => {
  const identity = loadIdentity();
  const literal = blockTubeNameRule('Creator Name');
  const regex = blockTubeNameRule('/^CaseSensitive Channel$/');
  const rules = [literal, regex];

  assert.equal(identity.isChannelBlocked(rules, { name: 'Creator Name' }), true);
  assert.equal(identity.isChannelBlocked(rules, { name: 'A Creator Name - Clips' }), true);
  assert.equal(identity.isChannelBlocked(rules, { name: 'NotCreator Name' }), false);
  assert.equal(identity.isChannelBlocked(rules, { name: 'Creator Nameplate' }), false);
  assert.equal(identity.isChannelBlocked(rules, { name: 'Other Channel', title: 'Creator Name' }), false);
  assert.equal(identity.isChannelBlocked(rules, { name: 'CaseSensitive Channel' }), true);
  assert.equal(identity.isChannelBlocked(rules, { name: 'casesensitive channel' }), false);
});
