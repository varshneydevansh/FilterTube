import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// A child's Study plan (interview, exam and class packs, chosen variants, added and removed channels and
// topics) through the v3 backup (plain and encrypted) and through parent -> child managed sync (study,
// focus_lock, schedule). Android StudyPlanRoundTripTest and iOS StudyPlanRoundTripTests pin the same answers.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const normalizeString = value => typeof value === 'string' ? value.trim() : '';
const catalog = JSON.parse(fs.readFileSync(new URL('../../data/study/packs-v1.json', import.meta.url), 'utf8'));

const PARENT = 'parent-profile-1';
const CHILD = 'child-aarav';
const UC = c => `UC${c.repeat(22)}`;

const plan = () => ({
  version: 1,
  activePackIds: ['global_coding_interview', 'interview_finance', 'in_gate', 'cls_in_cbse_11_12'],
  packEdits: {
    interview_finance: { channelsAdded: [{ channelId: UC('a'), handle: '@financeprep', name: 'Finance Prep' }],
      channelsRemoved: ['@noisyfinance'], topicsAdded: ['dcf model'], topicsRemoved: ['crypto'],
      variant: 'investment_banking', futureEditKey: 'kept' },
    in_gate: { channelsAdded: [{ handle: '@gateacademy', name: 'GATE Academy' }], channelsRemoved: [UC('b')],
      topicsAdded: [], topicsRemoved: ['aptitude'], variant: 'cse' },
    cls_in_cbse_11_12: { channelsAdded: [], channelsRemoved: [], topicsAdded: ['organic chemistry'], topicsRemoved: [], variant: 'pcm' },
    global_coding_interview: { channelsAdded: [], channelsRemoved: ['@leetcodeshorts'], topicsAdded: ['dynamic programming'], topicsRemoved: [] }
  },
  focus: { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 180, futureFocus: 1 },
  plan: { days: ['mon', 'wed', 'fri'], start: '16:00', end: '18:30', setByParentId: PARENT, limit: '20:00', music: false,
    zone: 'Asia/Kolkata', skipBreaks: true, setByName: 'Mum' },
  lock: { sessionId: 'exam-week', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: PARENT,
    startsAt: 1779300000000, endsAt: 1779303600000, scope: 'plan' },
  savedListMode: 'blocklist',
  breakMode: 'normal',
  progress: { 'aarav-phone': { '2026-11-19': 45, '2026-11-20': 20 } },
  weekView: false,
  packCopies: { interview_finance: { channels: [{ channelId: UC('c'), name: 'Copy Channel' }], topics: ['valuation'], blockedWords: ['gambling'] } },
  packChannelsOnly: false,
  futureStudyKey: { nested: [1, 2] }
});

// The interview packs ship on feature/ext-study-interview; until both branches meet, this one check waits.
const interviewPacksShipped = catalog.packs.some(pack => pack.id === 'interview_finance');
test('the fixture is a real interview, exam and class plan with variants', { skip: !interviewPacksShipped && 'interview packs not in this catalog yet' }, () => {
  const byId = Object.fromEntries(catalog.packs.map(pack => [pack.id, pack]));
  assert.deepEqual(plan().activePackIds.map(id => byId[id].kind), ['interview', 'interview', 'study', 'class']);
  for (const [id, edits] of Object.entries(plan().packEdits)) {
    if (edits.variant) assert.ok(byId[id].variants.some(variant => variant.id === edits.variant), `${id} has ${edits.variant}`);
  }
});

// ---- Backup -------------------------------------------------------------------------------------------

function tree(childStudy) {
  return { schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: { type: 'account', name: 'Mum', parentProfileId: null, settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: {} },
    ...(childStudy !== undefined ? { [CHILD]: { type: 'child', name: 'Aarav', parentProfileId: 'default', settings: {},
      main: { mode: 'blocklist', channels: [], keywords: [] }, kids: {}, ...(childStudy ? { study: childStudy } : {}) } } : {})
  } };
}

async function device(root) {
  const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device' };
  const box = { console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box; box.globalThis = box; vm.createContext(box); installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box);
  vm.runInContext(read('security_manager'), box);
  vm.runInContext(read('shared/study_model'), box);
  vm.runInContext(read('io_manager'), box);
  vm.runInContext(read('nanah_sync_adapter'), box);
  await box.FilterTubeSettings.loadSettings();
  return { io: box.FilterTubeIO, study: () => clone(storage.ftProfilesV4.profiles[CHILD]?.study ?? null) };
}

test('a full backup, plain and encrypted, carries the study plan unchanged', async () => {
  const mum = await device(tree(plan()));
  const backup = await mum.io.exportV3({ scope: 'full' });
  assert.deepEqual(clone(backup.profilesV4.profiles[CHILD].study), plan());
  const sealed = await mum.io.exportV3Encrypted({ scope: 'full', password: 'correct horse' });
  assert.equal(JSON.stringify(sealed).includes('interview_finance'), false, 'the plan is inside the ciphertext');
  const opened = await (await device(tree(undefined))).io.importV3Encrypted(clone(sealed), { password: 'correct horse', strategy: 'replace', scope: 'full' });
  assert.equal(opened.ok, true);
});

// Updated on purpose (Android/iOS parity): a backup restore brings the lock back on Replace and into a
// profile this device doesn't have; only a sync (no restoreStudyLock) drops it.
test('restore (replace or merge, plain or encrypted) keeps every study key, the lock included', async () => {
  const backup = await (await device(tree(plan()))).io.exportV3({ scope: 'full' });
  const expected = plan();
  for (const strategy of ['replace', 'merge']) {
    const phone = await device(tree(undefined));
    assert.equal((await phone.io.importV3(clone(backup), { scope: 'full', strategy, restoreStudyLock: true })).ok, true, strategy);
    assert.deepEqual(phone.study(), expected, strategy);
    const synced = await device(tree(undefined));
    await synced.io.importV3(clone(backup), { scope: 'full', strategy });
    assert.deepEqual(synced.study(), { ...plan(), lock: null }, `${strategy} as a sync`);
  }
  const sealed = await (await device(tree(plan()))).io.exportV3Encrypted({ scope: 'full', password: 'correct horse' });
  const phone = await device(tree(undefined));
  await phone.io.importV3Encrypted(clone(sealed), { password: 'correct horse', strategy: 'replace', scope: 'full' });
  assert.deepEqual(phone.study(), expected, 'encrypted');
  // Export -> import -> export: the restored plan exports the same bytes.
  const again = await phone.io.exportV3({ scope: 'full' });
  assert.deepEqual(clone(again.profilesV4.profiles[CHILD].study), expected);
});

// ---- Managed sync -------------------------------------------------------------------------------------

function sender(study) {
  const box = { window: {} };
  vm.runInNewContext(read('nanah_managed_live_policy'), box);
  const profile = { settings: { allowMainViewing: true, allowKidsViewing: true }, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' }, study };
  const link = { linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', linkId: 'link-1', remoteDeviceId: 'child-device-1',
    sourceProfileId: PARENT, capabilities: ['sync.receive', 'filtertube.study.v1'],
    policy: { allowedScopes: ['main', 'kids', 'viewing_space', 'time_limits'], targetProfileBehavior: 'fixed_profile', targetProfileId: CHILD } };
  return box.window.FilterTubeNanahManagedLivePolicy.create({
    normalizeString, safeObject,
    normalizeNonNegativeInteger: value => Number.isInteger(value) && value >= 0 ? value : null,
    getProfilesRoot: () => ({ profiles: { [PARENT]: profile } }),
    getLocalProfileContext: () => ({ profileId: PARENT, profileName: 'Mum' }),
    getPolicySourceProfile: () => ({ profileId: CHILD, profile, sourceKind: 'managed_child_edit' }),
    getActiveManagedSurface: () => 'main',
    getProfileSurface: (p, surface) => p[surface === 'kids' ? 'kids' : 'main'] || {},
    getManagedTimeLimitPolicy: () => null,
    normalizeTrustedLink: value => value,
    getTargetProfileBehavior: value => value === 'fixed_profile' ? 'fixed_profile' : 'current_active',
    normalizeTargetProfileContext: value => value || {},
    getRemoteTargetProfile: () => null,
    getRemoteCapabilities: () => ['sync.receive', 'filtertube.study.v1'],
    buildLocalPolicyHash: (prefix, seed) => `${prefix}-${String(seed).length}`,
    getCurrentTrustedLink: () => link,
    getAllowedScopeList: value => (Array.isArray(value) ? value : [value]).filter(item => ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'].includes(item)),
    getScopeLabel: scope => scope,
    ensureSigningKeyPair: async () => ({ managedPublicKeyId: 'key-1', managedKeyVersion: 1, privateKeyJwk: { d: 'private' } }),
    getStableDeviceId: () => 'parent-device-1',
    getAdapter: () => ({ supportsManagedPolicyScope: () => true,
      async signManagedPolicyEnvelope(envelope) { return { ...envelope, integrity: { algorithm: 'ed25519', signature: 'sig', signedFields: { scope: envelope.scope } } }; } }),
    now: () => 1779300000000
  });
}

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

/** The child's receiver signs nothing; it validates and applies what the parent signed. */
function signedFor(scope, payload, revision) {
  const envelope = { type: 'filtertube_managed_policy', linkId: 'link-1', scope, targetProfileId: CHILD, sourceProfileId: PARENT,
    sourceDeviceId: 'parent-device-1', targetDeviceId: 'child-device-1', revision, sourcePublicKeyId: 'key-1', keyVersion: 1, payload };
  envelope.policyHash = policyHash(envelope);
  envelope.integrity = { algorithm: 'ed25519', signature: 'sig', signedFields: { linkId: envelope.linkId, scope, targetProfileId: CHILD,
    sourceDeviceId: envelope.sourceDeviceId, targetDeviceId: envelope.targetDeviceId, revision, policyHash: envelope.policyHash, payloadScope: scope } };
  return envelope;
}

function receiver(childStudy) {
  let profiles = { schemaVersion: 4, activeProfileId: CHILD, profiles: {
    [PARENT]: { type: 'account', parentProfileId: null, name: 'Mum', settings: {}, main: {}, kids: {} },
    [CHILD]: { type: 'child', parentProfileId: PARENT, name: 'Aarav', settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' },
      ...(childStudy ? { study: childStudy } : {}) }
  } };
  const box = { FilterTubeIO: { loadProfilesV4: async () => profiles, saveProfilesV4: async next => { profiles = next; return { ok: true }; },
    exportV3: async () => ({}), importV3: async () => ({ ok: true }) }, crypto: { randomUUID: () => 'uuid' }, navigator: { platform: 'Test' }, Date: { now: () => 1779300000000 }, Math };
  vm.runInNewContext(read('shared/study_model'), box);
  vm.runInNewContext(read('nanah_sync_adapter'), box);
  const context = () => ({ targetDeviceId: 'child-device-1', profiles: profiles.profiles, accepted: null, duplicateDeviceIds: [],
    verifyIntegritySignature: () => ({ verified: true }),
    trustedLink: { id: 'link-1', type: 'managed_link', localRole: 'replica', remoteRole: 'source', sourceDeviceId: 'parent-device-1',
      sourceProfileId: PARENT, targetProfileId: CHILD, allowedScopes: ['main', 'kids', 'time_limits'], sourcePublicKeyId: 'key-1', keyVersion: 1 } });
  return { adapter: box.FilterTubeNanahAdapter, context, study: () => clone(profiles.profiles[CHILD].study ?? null) };
}

async function sync(parentStudy, childStudy) {
  const envelopes = clone(await sender(parentStudy).buildEnvelopeBatchForLiveSend({ scope: 'active' }));
  const study = envelopes.filter(envelope => ['study', 'focus_lock', 'schedule'].includes(envelope.scope));
  const child = receiver(childStudy);
  let revision = 1;
  for (const envelope of study) {
    // Over the wire as text, then the child's receiver checks and applies it.
    const wire = JSON.parse(JSON.stringify(envelope.payload));
    const result = await child.adapter.applyManagedPolicyEnvelope(signedFor(envelope.scope, wire, revision++), child.context());
    assert.equal(result.accepted, true, `${envelope.scope}: ${result.reason || ''}`);
  }
  return { payloads: Object.fromEntries(study.map(envelope => [envelope.scope, envelope.payload])), received: child.study() };
}

test('managed sync carries packs, variants, edits, focus, plan and lock to the child', async () => {
  const childOwn = { version: 1, activePackIds: [], savedListMode: 'whitelist', progress: { 'aarav-tablet': { '2026-11-20': 5 } } };
  const { payloads, received } = await sync(plan(), childOwn);
  assert.deepEqual(Object.keys(payloads), ['study', 'focus_lock', 'schedule']);
  assert.deepEqual(received.activePackIds, plan().activePackIds);
  assert.deepEqual(received.packEdits, plan().packEdits, 'variants, added/removed channels and topics, unknown edit keys');
  assert.deepEqual(received.focus, plan().focus);
  assert.equal(received.weekView, plan().weekView);
  assert.deepEqual(received.plan, plan().plan, 'limit, music, zone, skipBreaks and setByName ride in the plan');
  assert.deepEqual(received.lock, plan().lock);
  assert.equal(received.breakMode, plan().breakMode);
  assert.deepEqual(received.progress, childOwn.progress, 'progress never goes from parent to child');
  assert.equal(received.savedListMode, 'whitelist', 'the list mode to return to stays the child\'s');
});

// Updated on purpose for SEAMLESS_SYNC_SPEC.md §9: these now travel.
test('managed sync carries pack copies, an explicit Pack channels only and unknown study keys', async () => {
  const { payloads, received } = await sync(plan(), null);
  assert.deepEqual(Object.keys(payloads.study).sort(),
    ['activePackIds', 'extra', 'focus', 'packChannelsOnly', 'packCopies', 'packEdits', 'replace', 'scope', 'weekView']);
  assert.deepEqual(Object.keys(payloads.schedule).sort(), ['breakMode', 'plan', 'scope', 'timetable']);
  assert.deepEqual(Object.keys(payloads.focus_lock).sort(), ['lock', 'scope']);
  assert.deepEqual(received.packCopies, plan().packCopies);
  assert.equal(received.packChannelsOnly, false);
  assert.deepEqual(received.futureStudyKey, plan().futureStudyKey);
});
