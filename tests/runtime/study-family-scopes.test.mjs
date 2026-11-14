import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Family control scopes study, focus_lock and schedule (Android StudyFamilyScopes.kt). A parent sends them
// only to a child that advertises filtertube.study.v1, on a link that allows time_limits, and only once
// this device's signer knows them. They never join the 3.6.1 permission list.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const normalizeString = value => typeof value === 'string' ? value.trim() : '';
const LEGACY = ['main', 'kids', 'viewing_space'];

const parentStudy = () => ({
  version: 1, activePackIds: ['in_upsc_cse'], packEdits: {}, focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 },
  plan: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '18:00', setByParentId: 'parent-profile-1' },
  lock: { sessionId: 'exam-week', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'parent-profile-1' },
  savedListMode: null, breakMode: 'normal', weekView: false,
  progress: { 'parent-device-1': { '2026-11-15': 99 } }
});

function sender({ live = [], saved = [], signer = true, allowedScopes = ['main', 'kids', 'viewing_space', 'time_limits'], study = parentStudy() } = {}) {
  const box = { window: {} };
  vm.runInNewContext(read('nanah_managed_live_policy'), box);
  const profile = { settings: { allowMainViewing: true, allowKidsViewing: true }, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' },
    ...(study ? { study } : {}) };
  const link = (id, caps) => ({ linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', linkId: id, remoteDeviceId: `${id}-device`,
    sourceProfileId: 'parent-profile-1', capabilities: caps,
    policy: { allowedScopes, targetProfileBehavior: 'fixed_profile', targetProfileId: `${id}-child` } });
  const current = link('child', saved);
  const helper = box.window.FilterTubeNanahManagedLivePolicy.create({
    normalizeString, safeObject,
    normalizeNonNegativeInteger: value => Number.isInteger(value) && value >= 0 ? value : null,
    getProfilesRoot: () => ({ profiles: { 'parent-profile-1': profile } }),
    getLocalProfileContext: () => ({ profileId: 'parent-profile-1', profileName: 'Mum' }),
    getPolicySourceProfile: () => ({ profileId: 'child-copy', profile, sourceKind: 'managed_child_edit' }),
    getActiveManagedSurface: () => 'main',
    getProfileSurface: (p, surface) => p[surface === 'kids' ? 'kids' : 'main'] || {},
    getManagedTimeLimitPolicy: () => null,
    normalizeTrustedLink: value => value,
    getTargetProfileBehavior: value => value === 'fixed_profile' ? 'fixed_profile' : 'current_active',
    normalizeTargetProfileContext: value => value || {},
    getRemoteTargetProfile: () => null,
    getRemoteCapabilities: () => live,
    buildLocalPolicyHash: (prefix, seed) => `${prefix}-${String(seed).length}`,
    getCurrentTrustedLink: () => current,
    getAllowedScopeList: value => (Array.isArray(value) ? value : [value]).filter(item => ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'].includes(item)),
    getScopeLabel: scope => scope,
    ensureSigningKeyPair: async () => ({ managedPublicKeyId: 'key-1', managedKeyVersion: 1, privateKeyJwk: { d: 'private' } }),
    getStableDeviceId: () => 'parent-device-1',
    getAdapter: () => ({
      ...(signer ? { supportsManagedPolicyScope: () => true } : {}),
      async signManagedPolicyEnvelope(envelope) {
        return { ...envelope, integrity: { algorithm: 'ed25519', signature: 'sig', signedFields: { scope: envelope.scope } } };
      }
    }),
    now: () => 1779300000000
  });
  return { helper, link };
}
const scopesOf = async (s, scope = 'active') => plain((await s.helper.buildEnvelopeBatchForLiveSend({ scope })).map(e => e.scope));

test('a 3.6.1 child (no capability) gets exactly the 3.6.1 bundle', async () => {
  assert.deepEqual(await scopesOf(sender()), LEGACY);
});

test('a child that advertises filtertube.study.v1 gets the study scopes after the 3.6.1 ones', async () => {
  const s = sender({ live: ['sync.receive', 'filtertube.study.v1'] });
  const envelopes = plain(await s.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' }));
  assert.deepEqual(envelopes.map(e => e.scope), [...LEGACY, 'study', 'focus_lock', 'schedule']);
  const byScope = Object.fromEntries(envelopes.map(e => [e.scope, e.payload]));
  assert.deepEqual(byScope.study, { scope: 'study', replace: true, activePackIds: ['in_upsc_cse'], packEdits: {},
    focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 }, weekView: false }, 'progress never goes from parent to child');
  assert.deepEqual(byScope.focus_lock.lock.sessionId, 'exam-week');
  assert.deepEqual(byScope.schedule, { scope: 'schedule', plan: parentStudy().plan, breakMode: 'normal' });
});

test('a lock or plan is sent only when a parent set it', async () => {
  const own = { ...parentStudy(), lock: { ...parentStudy().lock, setByParentId: null }, plan: null };
  assert.deepEqual(await scopesOf(sender({ live: ['filtertube.study.v1'], study: own })), [...LEGACY, 'study']);
});

test('no study scopes without a time-limit grant, a signer that knows them, or a study object', async () => {
  assert.deepEqual(await scopesOf(sender({ live: ['filtertube.study.v1'], allowedScopes: ['main', 'kids', 'viewing_space'] })), LEGACY);
  assert.deepEqual(await scopesOf(sender({ live: ['filtertube.study.v1'], signer: false })), LEGACY);
  assert.deepEqual(await scopesOf(sender({ live: ['filtertube.study.v1'], study: null })), LEGACY);
});

test('a direct study send to an older child is refused with the too-old message', async () => {
  await assert.rejects(sender().helper.buildEnvelopeForLiveSend({ scope: 'schedule' }), /too old for Study plans/);
});

test('fanout decides per link, from the capabilities saved on each link', async () => {
  const s = sender();
  const envelopes = plain(await s.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'full' },
    [s.link('old', ['sync.receive']), s.link('new', ['sync.receive', 'filtertube.study.v1'])]));
  assert.deepEqual(envelopes.filter(e => e.linkId === 'old').map(e => e.scope), LEGACY);
  assert.deepEqual(envelopes.filter(e => e.linkId === 'new').map(e => e.scope), [...LEGACY, 'study', 'focus_lock', 'schedule']);
});

// Receiver: the shared adapter validates and applies the signed payload on the child, with no study model.
function stablePolicyJson(value) {
  if (Array.isArray(value)) return `[${value.map(stablePolicyJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stablePolicyJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function policyHash(envelope) {
  const source = JSON.stringify(stablePolicyJson({ linkId: envelope.linkId, scope: envelope.scope, targetProfileId: envelope.targetProfileId,
    sourceProfileId: envelope.sourceProfileId, sourceDeviceId: envelope.sourceDeviceId, targetDeviceId: envelope.targetDeviceId, payload: envelope.payload }));
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  return `remote-managed-policy-${Math.abs(hash).toString(16)}`;
}

function receiver(childStudy = null, { withModel = false } = {}) {
  let profiles = { schemaVersion: 4, activeProfileId: 'child-profile-1', profiles: {
    'parent-profile-1': { type: 'account', parentProfileId: null, name: 'Parent', settings: {}, main: {}, kids: {} },
    'child-profile-1': { type: 'child', parentProfileId: 'parent-profile-1', name: 'Child', settings: {},
      main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' }, ...(childStudy ? { study: childStudy } : {}) }
  } };
  const box = { FilterTubeIO: { loadProfilesV4: async () => profiles, saveProfilesV4: async next => { profiles = next; return { ok: true }; },
    exportV3: async () => ({}), importV3: async () => ({ ok: true }) }, crypto: { randomUUID: () => 'uuid' }, navigator: { platform: 'Test' }, Date: { now: () => 1779300000000 }, Math };
  if (withModel) vm.runInNewContext(read('shared/study_model'), box);
  vm.runInNewContext(read('nanah_sync_adapter'), box);
  return { adapter: box.FilterTubeNanahAdapter, study: () => plain(profiles.profiles['child-profile-1'].study ?? null), profiles: () => profiles };
}

function envelopeFor(scope, payload, revision = 1, sourceProfileId = 'parent-profile-1') {
  const envelope = { type: 'filtertube_managed_policy', linkId: 'link-1', scope, targetProfileId: 'child-profile-1', sourceProfileId,
    sourceDeviceId: 'parent-device-1', targetDeviceId: 'child-device-1', revision, sourcePublicKeyId: 'key-1', keyVersion: 1, payload };
  envelope.policyHash = policyHash(envelope);
  envelope.integrity = { algorithm: 'ed25519', signature: 'sig', signedFields: { linkId: envelope.linkId, scope, targetProfileId: envelope.targetProfileId,
    sourceDeviceId: envelope.sourceDeviceId, targetDeviceId: envelope.targetDeviceId, revision, policyHash: envelope.policyHash, payloadScope: scope } };
  return envelope;
}

function context(r, allowedScopes = ['main', 'kids', 'time_limits'], sourceProfileId = 'parent-profile-1') {
  return { targetDeviceId: 'child-device-1', profiles: r.profiles().profiles, accepted: null, duplicateDeviceIds: [],
    verifyIntegritySignature: () => ({ verified: true }),
    trustedLink: { id: 'link-1', type: 'managed_link', localRole: 'replica', remoteRole: 'source', sourceDeviceId: 'parent-device-1',
      sourceProfileId, targetProfileId: 'child-profile-1', allowedScopes, sourcePublicKeyId: 'key-1', keyVersion: 1 } };
}

const payloads = () => [
  ['study', { scope: 'study', replace: true, activePackIds: ['in_upsc_cse'], packEdits: {}, focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 }, weekView: false }],
  ['schedule', { scope: 'schedule', plan: { days: ['mon', 'fri'], start: '16:00', end: '18:00', setByParentId: 'someone-else' }, breakMode: 'normal' }],
  ['focus_lock', { scope: 'focus_lock', lock: { sessionId: 'exam-week', sessionKind: 'hard_whitelist', mode: 'gentle', setByParentId: null } }]
];

test('the shared signer advertises and knows the study scopes', () => {
  const { adapter } = receiver();
  assert.ok(adapter.getDeviceDescriptor({}).capabilities.includes('filtertube.study.v1'));
  for (const scope of ['study', 'focus_lock', 'schedule', 'time_limits']) assert.equal(adapter.supportsManagedPolicyScope(scope), true, scope);
  assert.equal(adapter.supportsManagedPolicyScope('unknown'), false);
});

for (const withModel of [false, true]) {
  test(`signed study, schedule and focus lock apply to the child and keep its progress (study model ${withModel ? 'loaded' : 'absent'})`, async () => {
    const r = receiver({ version: 1, activePackIds: [], progress: { 'child-device-1': { '2026-11-15': 25 } }, savedListMode: 'blocklist' }, { withModel });
    let revision = 1;
    for (const [scope, payload] of payloads()) {
      const result = await r.adapter.applyManagedPolicyEnvelope(envelopeFor(scope, payload, revision++), context(r));
      assert.equal(result.accepted, true, `${scope}: ${result.reason || ''}`);
    }
    const study = r.study();
    assert.deepEqual(study.activePackIds, ['in_upsc_cse']);
    assert.equal(study.weekView, false);
    assert.equal(study.breakMode, 'normal');
    assert.equal(study.plan.setByParentId, 'parent-profile-1', 'the signer, not the payload, says who set the plan');
    assert.deepEqual(study.lock, { sessionId: 'exam-week', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'parent-profile-1' });
    assert.deepEqual(study.progress, { 'child-device-1': { '2026-11-15': 25 } });
    assert.equal(study.savedListMode, 'blocklist');
    for (const key of ['version', 'activePackIds', 'packEdits', 'focus', 'plan', 'lock', 'savedListMode', 'breakMode', 'progress', 'weekView']) {
      assert.ok(Object.hasOwn(study, key), key);
    }
  });
}

test('study scopes ride on the child link\'s time grant', () => {
  const r = receiver();
  const result = r.adapter.validateManagedPolicyEnvelope(
    envelopeFor('study', { scope: 'study', replace: true, activePackIds: ['in_ssc'] }), context(r, ['main', 'kids']));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'scope_not_allowed');
});

test('malformed study payloads are rejected before any write', () => {
  const r = receiver();
  for (const [scope, payload, reason] of [
    ['schedule', { scope: 'schedule', plan: { days: [], start: '16:00', end: '25:00' } }, 'invalid_schedule_payload'],
    ['schedule', { scope: 'schedule', plan: null, breakMode: 'party' }, 'invalid_schedule_payload'],
    ['focus_lock', { scope: 'focus_lock' }, 'invalid_focus_lock_payload'],
    ['study', { scope: 'study', activePackIds: 'in_ssc' }, 'invalid_study_payload']
  ]) {
    assert.equal(r.adapter.validateManagedPolicyEnvelope(envelopeFor(scope, payload), context(r)).reason, reason, scope);
  }
});

test('another parent cannot end or replace a lock it did not set', async () => {
  const lock = { sessionId: 'exam-week', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'parent-profile-1' };
  const r = receiver({ version: 1, activePackIds: [], lock });
  await r.adapter.applyManagedPolicyEnvelope(envelopeFor('focus_lock', { scope: 'focus_lock', lock: null }, 1, 'other-parent'),
    context(r, ['time_limits'], 'other-parent'));
  assert.deepEqual(r.study().lock, lock);
  const result = await r.adapter.applyManagedPolicyEnvelope(envelopeFor('focus_lock', { scope: 'focus_lock', lock: null }, 1), context(r, ['time_limits']));
  assert.equal(result.accepted, true);
  assert.equal(r.study().lock, null, 'the parent that set it can end it early');
});
