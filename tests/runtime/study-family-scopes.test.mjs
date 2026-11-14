import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Family control scopes study, focus_lock and schedule. A parent sends them only to a child whose saved
// link advertises study.v1; older children get exactly the bundle they got before.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const parentStudy = {
  version: 1, packIds: ['in_upsc_cse'], focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 },
  edits: {}, plan: { days: [1, 2, 3, 4, 5], start: '16:00', end: '18:00' },
  lock: { ref: 'exam-week', mode: 'locked' }, breakMode: 'normal',
  progress: { 'parent-device-1': { '2026-11-15': 99 } }
};

function sender({ capabilities = [], allowedScopes = ['main', 'kids', 'viewing_space', 'time_limits'], study = parentStudy } = {}) {
  const box = { window: {} };
  vm.runInNewContext(read('shared/study_model'), box);
  box.window.FilterTubeStudyModel = box.FilterTubeStudyModel;
  vm.runInNewContext(read('nanah_managed_live_policy'), box);
  const profile = { settings: { allowMainViewing: true, allowKidsViewing: true }, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' },
    ...(study ? { study } : {}) };
  const link = (id, caps) => ({ linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', linkId: id, remoteDeviceId: `${id}-device`,
    sourceProfileId: 'parent-profile-1', capabilities: caps,
    policy: { allowedScopes, targetProfileBehavior: 'fixed_profile', targetProfileId: `${id}-child`, capabilities: caps } });
  const current = link('child', capabilities);
  const helper = box.window.FilterTubeNanahManagedLivePolicy.create({
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    safeObject,
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
    buildLocalPolicyHash: (prefix, seed) => `${prefix}-${String(seed).length}`,
    getCurrentTrustedLink: () => current,
    getAllowedScopeList: value => (Array.isArray(value) ? value : [value]).filter(item => ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'].includes(item)),
    getScopeLabel: scope => scope,
    ensureSigningKeyPair: async () => ({ managedPublicKeyId: 'key-1', managedKeyVersion: 1, privateKeyJwk: { d: 'private' } }),
    getStableDeviceId: () => 'parent-device-1',
    getAdapter: () => ({ async signManagedPolicyEnvelope(envelope) {
      return { ...envelope, integrity: { algorithm: 'ed25519', signature: 'sig', signedFields: { scope: envelope.scope } } };
    } }),
    now: () => 1779300000000
  });
  return { helper, current, link };
}

test('an active bundle adds study scopes only for a child that advertises study.v1', async () => {
  const older = sender();
  const olderScopes = (await older.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' })).map(e => e.scope).slice();
  assert.deepEqual(plain(olderScopes), ['main', 'kids', 'viewing_space'], 'an older child gets exactly what it got before');

  const newer = sender({ capabilities: ['sync.receive', 'control.apply', 'study.v1'] });
  const envelopes = await newer.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' });
  assert.deepEqual(plain(envelopes.map(e => e.scope)), ['main', 'kids', 'viewing_space', 'study', 'focus_lock', 'schedule']);
  const byScope = Object.fromEntries(envelopes.map(e => [e.scope, plain(e.payload)]));
  assert.deepEqual(byScope.study.packIds, ['in_upsc_cse']);
  assert.equal(byScope.study.breakMode, 'normal');
  assert.equal(Object.hasOwn(byScope.study, 'progress'), false, 'the parent never sends its own progress');
  assert.equal(byScope.focus_lock.lock.mode, 'locked');
  assert.deepEqual(byScope.schedule.plan.days, [1, 2, 3, 4, 5]);
});

test('without a time grant, or without a study object, no study scope is added', async () => {
  const noGrant = sender({ capabilities: ['study.v1'], allowedScopes: ['main', 'kids', 'viewing_space'] });
  assert.deepEqual(plain((await noGrant.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' })).map(e => e.scope)), ['main', 'kids', 'viewing_space']);
  const noStudy = sender({ capabilities: ['study.v1'], study: null });
  assert.deepEqual(plain((await noStudy.helper.buildEnvelopeBatchForLiveSend({ scope: 'active' })).map(e => e.scope)), ['main', 'kids', 'viewing_space']);
});

test('a direct study send to an older child is refused with the too-old message', async () => {
  const older = sender();
  await assert.rejects(older.helper.buildEnvelopeForLiveSend({ scope: 'schedule' }), /too old for Study plans/);
});

test('fanout gives study scopes per link', async () => {
  const s = sender({ capabilities: ['study.v1'] });
  const envelopes = await s.helper.buildEnvelopeBatchForTrustedLinks({ scope: 'full' }, [s.link('old', []), s.link('new', ['study.v1'])]);
  assert.deepEqual(plain(envelopes.filter(e => e.linkId === 'old').map(e => e.scope)), ['main', 'kids', 'viewing_space']);
  assert.deepEqual(plain(envelopes.filter(e => e.linkId === 'new').map(e => e.scope)).slice(-3), ['study', 'focus_lock', 'schedule']);
});

// Receiver: the adapter validates and applies the signed payload on the child.
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

function receiver(childStudy = null) {
  let profiles = { schemaVersion: 4, activeProfileId: 'child-profile-1', profiles: {
    'parent-profile-1': { type: 'account', parentProfileId: null, name: 'Parent', settings: {}, main: {}, kids: {} },
    'child-profile-1': { type: 'child', parentProfileId: 'parent-profile-1', name: 'Child', settings: {},
      main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' }, ...(childStudy ? { study: childStudy } : {}) }
  } };
  const box = { FilterTubeIO: { loadProfilesV4: async () => profiles, saveProfilesV4: async next => { profiles = next; return { ok: true }; },
    exportV3: async () => ({}), importV3: async () => ({ ok: true }) }, crypto: { randomUUID: () => 'uuid' }, navigator: { platform: 'Test' }, Date: { now: () => 1779300000000 }, Math };
  vm.runInNewContext(read('shared/study_model'), box);
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

test('the child advertises study.v1 in its device descriptor', () => {
  assert.ok(receiver().adapter.getDeviceDescriptor({}).capabilities.includes('study.v1'));
});

test('a signed study, schedule and focus lock apply to the child and keep its progress', async () => {
  const r = receiver({ version: 1, packIds: [], progress: { 'child-device-1': { '2026-11-15': 25 } }, savedListMode: 'blocklist' });
  let revision = 1;
  for (const [scope, payload] of [
    ['study', { scope: 'study', replace: true, packIds: ['in_upsc_cse'], edits: {}, focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 }, weekView: false, breakMode: 'normal' }],
    ['schedule', { scope: 'schedule', plan: { days: [1, 2, 3, 4, 5], start: '16:00', end: '18:00' } }],
    ['focus_lock', { scope: 'focus_lock', lock: { ref: 'exam-week', mode: 'locked' } }]
  ]) {
    const result = await r.adapter.applyManagedPolicyEnvelope(envelopeFor(scope, payload, revision++), context(r));
    assert.equal(result.accepted, true, `${scope}: ${result.reason || ''}`);
  }
  const study = r.study();
  assert.deepEqual(study.packIds, ['in_upsc_cse']);
  assert.equal(study.breakMode, 'normal');
  assert.equal(study.plan.setBy.profileId, 'parent-profile-1');
  assert.deepEqual(study.lock, { ref: 'exam-week', mode: 'locked', setBy: { kind: 'parent', profileId: 'parent-profile-1', deviceId: 'parent-device-1' } });
  assert.deepEqual(study.progress, { 'child-device-1': { '2026-11-15': 25 } });
  assert.equal(study.savedListMode, 'blocklist');
});

test('study scopes need the parent time grant on the child too', async () => {
  const r = receiver();
  const result = r.adapter.validateManagedPolicyEnvelope(
    envelopeFor('study', { scope: 'study', replace: true, packIds: ['in_ssc'] }), context(r, ['main', 'kids']));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'scope_not_allowed');
});

test('malformed study payloads are rejected before any write', () => {
  const r = receiver();
  for (const [scope, payload, reason] of [
    ['schedule', { scope: 'schedule', plan: { days: [], start: '16:00', end: '18:00' } }, 'invalid_schedule_payload'],
    ['focus_lock', { scope: 'focus_lock' }, 'invalid_focus_lock_payload'],
    ['study', { scope: 'study', packIds: 'in_ssc' }, 'invalid_study_payload']
  ]) {
    const result = r.adapter.validateManagedPolicyEnvelope(envelopeFor(scope, payload), context(r));
    assert.equal(result.reason, reason, scope);
  }
});

test('another parent cannot end a lock it did not set', async () => {
  const r = receiver({ version: 1, packIds: [], lock: { ref: 'exam-week', mode: 'locked', setBy: { kind: 'parent', profileId: 'parent-profile-1' } } });
  const result = await r.adapter.applyManagedPolicyEnvelope(
    envelopeFor('focus_lock', { scope: 'focus_lock', lock: null }, 1, 'other-parent'), context(r, ['time_limits'], 'other-parent'));
  assert.notEqual(r.study().lock, null, `the lock stays (${result.reason || result.accepted})`);
});
