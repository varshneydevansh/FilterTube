import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const tab = read('tab-view');
const clone = x => JSON.parse(JSON.stringify(x));
function section(start, end) {
  const a = tab.indexOf(start), b = tab.indexOf(end, a);
  assert.ok(a > 0 && b > a, start);
  return tab.slice(a, b);
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
const account = marker => ({ type: 'account', parentProfileId: null, settings: {}, main: { mode: 'blocklist', keywords: [{ word: marker }], channels: [] }, kids: { blockedKeywords: [] } });
async function fixture() {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'local-parent-a', profiles: {
    default: account('master-private'),
    'local-parent-a': account('parent-a-private'), 'local-parent-b': account('parent-b-private'),
    'local-child-a': { ...account('child-a-existing'), type: 'child', parentProfileId: 'local-parent-a', security: { localOnly: 'child-a-security' } },
    'local-child-b': { ...account('child-b-existing'), type: 'child', parentProfileId: 'local-parent-b', security: { localOnly: 'child-b-security' } }
  } }, ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [] };
  const profileWrites = [], receipts = [], history = [];
  const box = { crypto: webcrypto, Date, JSON, Math, TextEncoder, TextDecoder, Uint8Array, atob, btoa, setTimeout, clearTimeout,
    console: { log() {}, warn() {}, error() {} },
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys == null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { if (payload.ftProfilesV4) profileWrites.push(clone(payload.ftProfilesV4)); Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box;
  vm.createContext(box);
  installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box);
  await box.FilterTubeSettings.loadSettings();
  vm.runInContext(read('io_manager'), box);
  vm.runInContext(read('nanah_sync_adapter'), box);
  Object.assign(box, {
    runtimeAPI: box.chrome,
    safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, safeArray: x => Array.isArray(x) ? x : [], normalizeString: x => typeof x === 'string' ? x.trim() : '',
    normalizeNonNegativeInteger: x => Number.isInteger(Number(x)) && Number(x) >= 0 ? Number(x) : 0,
    profilesV4Cache: await box.FilterTubeIO.loadProfilesV4(), nanahTrustedLinks: [], NANAH_TRUSTED_LINKS_KEY: 'ftNanahTrustedLinks', nanahStableDeviceId: 'receiver-device',
    renderNanahTrustedLinks() {},
    recordManagedNanahPolicyValidationHistory: async (_, decision) => { history.push(clone(decision)); },
    sendNanahManagedLivePolicyAck: async (envelope, decision) => { receipts.push({ id: envelope.id, ...clone(decision) }); },
    refreshFilterTubeUiAfterNanahImport: async () => { box.profilesV4Cache = await box.FilterTubeIO.loadProfilesV4(); },
    UIComponents: { showToast() {} }, tabViewUiText: (_, fallback) => fallback, formatManagedNanahBlockedReason: x => x,
    findNanahTrustedLink: () => null
  });
  vm.runInContext([
    section('    function getNanahScopeList(', '    function getNanahTrustedLinkTypePill('),
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function getManagedNanahPolicyAcceptedState(', '    function summarizeManagedNanahPolicyEnvelope('),
    section('    async function readNanahStorage(', '    function normalizeNanahManagedSigningPublicDescriptor('),
    section('    async function persistNanahTrustedLinks(', '    function buildManagedTrustRevocationHistoryRow('),
    section('    async function saveNanahTrustedLink(', '    async function removeNanahTrustedLink('),
    section('    async function handleNanahIncomingManagedPolicyEnvelope(', '    async function handleNanahIncomingManagedMailboxItem(')
  ].join('\n'), box);
  const adapter = box.FilterTubeNanahAdapter;
  const keys = {}, links = {};
  for (const family of ['a', 'b']) {
    keys[family] = await adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: `remote-${family}-key`, keyVersion: 1 });
    await box.saveNanahTrustedLink({
      linkId: `saved-link-${family}`, linkType: 'managed_link', remoteDeviceId: `remote-device-${family}`, localRole: 'replica', remoteRole: 'source',
      sourceDeviceId: `remote-device-${family}`, sourceProfileId: `remote-parent-${family}`, sourcePublicKeyId: keys[family].sourcePublicKeyId,
      sourcePublicKeyJwk: keys[family].sourcePublicKeyJwk, keyVersion: 1, localParentProfileId: `local-parent-${family}`,
      policy: { targetProfileId: `local-child-${family}`, targetProfileBehavior: 'fixed_profile', allowedScopes: ['keywords'], autoApplyControlProposals: true, lockedChildMode: 'allow_trusted_updates' }
    });
    links[family] = box.nanahTrustedLinks.find(link => link.linkId === `saved-link-${family}`);
  }
  // Recreate in-memory trust from actual persisted bytes, rather than allowing
  // the same objects to stand in for both storage and the current dashboard.
  box.nanahTrustedLinks = (await box.readNanahStorage('ftNanahTrustedLinks')).map(box.normalizeNanahTrustedLink);
  profileWrites.length = 0;
  async function envelope(family, revision, value = `family-${family}-revision-${revision}`, overrides = {}, signerFamily = family) {
    const unsigned = {
      id: `synthetic-${family}-${revision}-${value}`, type: 'filtertube_managed_policy', linkId: `saved-link-${family}`, scope: 'keywords',
      targetProfileId: `local-child-${family}`, sourceProfileId: `remote-parent-${family}`, sourceDeviceId: `remote-device-${family}`, targetDeviceId: 'receiver-device',
      revision, sourcePublicKeyId: keys[family].sourcePublicKeyId, keyVersion: 1,
      payload: { scope: 'keywords', surface: 'main', operations: [{ op: 'add_keyword', value }] }, ...overrides
    };
    unsigned.policyHash = adapter.buildManagedPolicyPayloadHash(unsigned);
    return adapter.signManagedPolicyEnvelope(unsigned, keys[signerFamily].privateKeyJwk);
  }
  async function apply(message) {
    await box.handleNanahIncomingManagedPolicyEnvelope(message);
    return receipts.at(-1);
  }
  async function switchTo(profileId) {
    const root = await box.FilterTubeIO.loadProfilesV4();
    await box.FilterTubeIO.saveProfilesV4({ ...root, activeProfileId: profileId });
    box.profilesV4Cache = await box.FilterTubeIO.loadProfilesV4();
  }
  async function duringVerification(message, mutate) {
    const start = deferred(), gate = deferred();
    const verify = adapter.verifyManagedNanahPolicyIntegritySignature;
    adapter.verifyManagedNanahPolicyIntegritySignature = async (...args) => {
      const result = await verify(...args);
      assert.equal(result.verified, true, 'the paused message must first pass real Ed25519 verification');
      start.resolve();
      await gate.promise;
      return result;
    };
    try {
      const pending = apply(message);
      await start.promise;
      await mutate();
      const baseline = profileWrites.length;
      gate.resolve();
      const decision = await pending;
      assert.equal(profileWrites.length, baseline, 'pending rejected message must not write any profiles');
      return decision;
    } finally { gate.resolve(); adapter.verifyManagedNanahPolicyIntegritySignature = verify; }
  }
  return { box, storage, adapter, envelope, apply, switchTo, duringVerification, profileWrites, receipts, history, links };
}
const words = (f, family) => f.storage.ftProfilesV4.profiles[`local-child-${family}`].main.keywords.map(item => item.word);

test('real saved-link signing and IO storage preserve two families through repeat update, idempotency and active profile switches', async () => {
  const f = await fixture();
  const initial = clone(f.storage.ftProfilesV4);
  assert.equal(f.storage.ftProfilesV4.profiles['remote-parent-a'], undefined);
  assert.equal(f.storage.ftProfilesV4.profiles['remote-parent-b'], undefined);
  const a1 = await f.envelope('a', 1);
  assert.equal((await f.apply(a1)).accepted, true);
  assert.equal(f.profileWrites.length, 1);
  const savedA = clone(f.storage.ftProfilesV4.profiles['local-child-a']);
  const duplicate = await f.apply(a1);
  assert.equal(duplicate.decision, 'idempotent_same_hash');
  assert.equal(f.profileWrites.length, 1);
  assert.deepEqual(f.storage.ftProfilesV4.profiles['local-child-a'], savedA);
  await f.switchTo('local-parent-b');
  const b1 = await f.envelope('b', 1);
  assert.equal((await f.apply(b1)).accepted, true);
  const savedB = clone(f.storage.ftProfilesV4.profiles['local-child-b']);
  // A saved parent's update remains bound to child A even while another local
  // parent or that parent's child is the active viewing profile.
  await f.switchTo('local-child-b');
  assert.equal((await f.apply(await f.envelope('a', 2))).accepted, true);
  assert.deepEqual(words(f, 'a'), ['child-a-existing', 'family-a-revision-1', 'family-a-revision-2']);
  assert.deepEqual(f.storage.ftProfilesV4.profiles['local-child-b'], savedB);
  assert.equal(f.storage.ftProfilesV4.activeProfileId, 'local-child-b');
  const writesBeforeReplay = f.profileWrites.length;
  assert.equal((await f.apply(a1)).reason, 'stale_revision');
  assert.equal((await f.apply(await f.envelope('a', 2, 'conflicting-same-revision'))).reason, 'equal_revision_hash_conflict');
  assert.equal(f.profileWrites.length, writesBeforeReplay);
  for (const id of ['default', 'local-parent-a', 'local-parent-b']) assert.deepEqual(f.storage.ftProfilesV4.profiles[id], initial.profiles[id]);
  for (const family of ['a', 'b']) {
    const child = f.storage.ftProfilesV4.profiles[`local-child-${family}`];
    assert.equal(child.parentProfileId, `local-parent-${family}`);
    assert.equal(child.security.localOnly, `child-${family}-security`);
  }
});

for (const inMemory of [false, true]) {
  test(`saved-link revocation during real signature verification after a profile switch blocks storage writes (${inMemory ? 'memory and storage' : 'persisted storage with stale memory'})`, async () => {
    const f = await fixture();
    assert.equal((await f.apply(await f.envelope('a', 1))).accepted, true);
    await f.switchTo('local-parent-b');
    const pending = await f.envelope('a', 2, 'revoked-pending-rule');
    let afterRevoke;
    const decision = await f.duringVerification(pending, async () => {
      const storedLinks = await f.box.readNanahStorage('ftNanahTrustedLinks');
      storedLinks.find(link => link.linkId === 'saved-link-a').revoked = true;
      await f.box.writeNanahStorage('ftNanahTrustedLinks', storedLinks);
      if (inMemory) f.box.nanahTrustedLinks.find(link => link.linkId === 'saved-link-a').revoked = true;
      afterRevoke = clone(f.storage.ftProfilesV4);
    });
    assert.equal(decision.accepted, false);
    assert.deepEqual(f.storage.ftProfilesV4, afterRevoke);
    assert.ok(!words(f, 'a').includes('revoked-pending-rule'));
    assert.equal((await f.apply(await f.envelope('b', 1))).accepted, true, 'revoking A does not revoke the independently pinned B link');
    assert.ok(words(f, 'b').includes('family-b-revision-1'));
    assert.equal(f.storage.ftProfilesV4.activeProfileId, 'local-parent-b');
  });
}

test('a valid second-family signer cannot borrow first-family saved trust or change its fixed child target', async () => {
  const f = await fixture();
  await f.switchTo('local-parent-b');
  const before = clone(f.storage.ftProfilesV4), writesBefore = f.profileWrites.length;
  const wrongSigner = await f.envelope('a', 1, 'b-signing-as-a', {}, 'b');
  assert.equal((await f.apply(wrongSigner)).accepted, false);
  const wrongTarget = await f.envelope('b', 1, 'b-targeting-a', { targetProfileId: 'local-child-a' });
  assert.equal((await f.apply(wrongTarget)).reason, 'wrong_target_profile');
  assert.deepEqual(f.storage.ftProfilesV4, before);
  assert.equal(f.profileWrites.length, writesBefore);
});
