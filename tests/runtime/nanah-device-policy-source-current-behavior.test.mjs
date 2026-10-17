import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function between(startText, endText) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  assert.ok(start > 0 && end > start);
  return source.slice(start, end);
}
const helperSource = between('    function getNanahSourceManagedLinksForTargetProfile(', '    function getNanahSourceManagedLinkInventoryForTargetProfile(');
const targetSource = between('    function getNanahTrustedLinkTargetProfileId(', '    function getNanahTrustedLinkIdentityKey(');
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const normalizeString = value => typeof value === 'string' ? value.trim() : '';
function link(overrides = {}) {
  return {
    linkId: 'verified-link', remoteDeviceId: 'remote-tablet', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
    policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'remote-child', allowedScopes: ['main', 'kids', 'viewing_space'] },
    ...overrides
  };
}
function harness({ profiles = null, active = 'parent', managed = ['parent', 'local-child', 'remote-child'], choice = null, links = [] } = {}) {
  const root = {
    activeProfileId: active,
    profiles: profiles || { parent: { type: 'account', name: 'Parent rules' }, 'local-child': { type: 'child', name: 'Local child' } }
  };
  const prompts = [];
  const context = {
    safeObject, normalizeString, safeArray: value => Array.isArray(value) ? value : [],
    normalizeNanahTrustedLink: value => value,
    getNanahTargetProfileBehavior: (value, fallback) => ['fixed_profile', 'current_active'].includes(value) ? value : fallback,
    getConcreteManagedPolicyScopesForProfile: scope => scope === 'active' ? ['main', 'kids', 'viewing_space'] : [scope],
    getNanahManagedPolicyScopeList: value => Array.isArray(value) ? value : [value].filter(Boolean),
    nanahTrustedLinks: links,
    profilesV4Cache: root,
    window: { FilterTubeIO: { loadProfilesV4: async () => root } },
    getProfileType: (value, id) => value.profiles[id]?.type,
    canActiveProfileManageProfile: (_, id) => managed.includes(id),
    familyDeviceMapCopy: value => value,
    tabViewUiText: (_, fallback) => fallback,
    showChoiceModal: async options => { prompts.push(options); return choice; }
  };
  vm.runInNewContext(targetSource + helperSource, context);
  return { context, root, prompts };
}

test('a source chooser retains valid local mappings and asks when several unrelated profiles are available', async () => {
  const remembered = harness();
  const selected = await remembered.context.chooseNanahDevicePolicySource({ localPolicyProfileId: 'local-child' }, 'remote-child');
  assert.equal(selected.profileId, 'local-child');
  assert.equal(remembered.prompts.length, 0);
  const choose = harness({ choice: 'local-child' });
  assert.equal((await choose.context.chooseNanahDevicePolicySource({}, 'remote-child')).profileId, 'local-child');
  assert.deepEqual(Array.from(choose.prompts[0].choices, item => item.value).sort(), ['local-child', 'parent']);
});

test('source cancellation, child actors and unmanaged choices never supply a policy source', async () => {
  const cancelled = harness();
  assert.equal(await cancelled.context.chooseNanahDevicePolicySource({}, 'remote-child'), null);
  const child = harness({ active: 'local-child' });
  assert.equal(await child.context.chooseNanahDevicePolicySource({}, 'remote-child'), null);
  assert.equal(child.prompts.length, 0);
  const unmanaged = harness({ managed: ['parent'], choice: 'outsider', profiles: { parent: { type: 'account' }, outsider: { type: 'child' } } });
  assert.equal((await unmanaged.context.chooseNanahDevicePolicySource({ localPolicyProfileId: 'outsider' }, 'remote-child')).profileId, 'parent');
  const tamperedChoice = harness({ choice: 'outsider', profiles: { parent: { type: 'account' }, 'local-child': { type: 'child' }, outsider: { type: 'child' } } });
  assert.equal(await tamperedChoice.context.chooseNanahDevicePolicySource({}, 'remote-child'), null);
  assert.ok(!tamperedChoice.prompts[0].choices.some(item => item.value === 'outsider'));
});

test('a stale remembered source falls back to a locally manageable matching remote profile', async () => {
  const f = harness({ profiles: { parent: { type: 'account' }, 'remote-child': { type: 'child', name: 'Child rules' } } });
  const selected = await f.context.chooseNanahDevicePolicySource({ localPolicyProfileId: 'deleted-child' }, 'remote-child');
  assert.equal(selected?.profileId, 'remote-child');
  assert.equal(f.prompts.length, 0);
});

test('an explicit source change can replace a remembered mapping and ignores other accounts', async () => {
  const f = harness({ choice: 'parent', profiles: {
    parent: { type: 'account', name: 'Parent' },
    'local-child': { type: 'child', name: 'Local child' },
    otherAccount: { type: 'account', name: 'Other account' }
  }, managed: ['parent', 'local-child', 'otherAccount'] });
  const selected = await f.context.chooseNanahDevicePolicySource({ localPolicyProfileId: 'local-child' }, 'remote-child', { forceChoice: true });
  assert.equal(selected.profileId, 'parent');
  assert.equal(f.prompts.length, 1);
  assert.ok(!f.prompts[0].choices.some(choice => choice.value === 'otherAccount'));
});

test('remembered source mapping makes local profile controls use the verified remote link', () => {
  const trusted = { ...link(), localPolicyProfileId: 'local-child' };
  const f = harness({ links: [trusted] });
  assert.equal(f.context.getNanahSourceManagedLinksForTargetProfile('local-child').length, 1);
  assert.equal(f.context.getNanahSourceManagedLinksForTargetProfile('parent').length, 0);
  assert.equal(trusted.policy.targetProfileId, 'remote-child', 'source mapping cannot change signed destination');
});

test('different local and remote profile IDs require explicit verified link selection', () => {
  const trusted = link();
  const f = harness({ links: [trusted] });
  assert.equal(f.context.getNanahSourceManagedLinksForTargetProfile('local-child').length, 0);
  assert.equal(f.context.getNanahSourceManagedLinksForTargetProfile('remote-child').length, 1);
  assert.equal(f.context.getNanahSourceManagedLinksByIds(['verified-link']).length, 1);
  assert.equal(f.context.getNanahSourceManagedLinksByIds([]).length, 0);
  assert.equal(f.context.getNanahSourceManagedLinksByIds(['other-link']).length, 0);
  assert.equal(trusted.policy.targetProfileId, 'remote-child');
});

test('explicit links still enforce revocation, role, scope and fixed receiver target guards', () => {
  const rejected = [
    link({ revoked: true }), link({ keyRevoked: true }), link({ stalePairing: true }),
    link({ policy: { ...link().policy, revoked: true } }),
    link({ policy: { ...link().policy, keyRevoked: true } }),
    link({ policy: { ...link().policy, stalePairing: true } }),
    link({ linkType: 'peer_link' }), link({ localRole: 'replica', remoteRole: 'source' }),
    link({ remoteRole: 'peer' }),
    link({ policy: { ...link().policy, allowedScopes: ['main'] } }),
    link({ policy: { ...link().policy, targetProfileBehavior: 'current_active' } }),
    link({ policy: { ...link().policy, targetProfileId: '' } })
  ];
  for (const trusted of rejected) {
    const f = harness({ links: [trusted] });
    assert.equal(f.context.getNanahSourceManagedLinksByIds(['verified-link']).length, 0, JSON.stringify(trusted));
  }
  const allowed = harness({ links: [link({ policy: { ...link().policy, allowedScopes: ['main'] } })] });
  assert.equal(allowed.context.getNanahSourceManagedLinksByIds(['verified-link'], 'main').length, 1);
});
