import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const adapterSource = fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8');
const tabSource = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function profiles() {
  return { schemaVersion: 4, activeProfileId: 'receiver-child', profiles: {
    'local-parent-b': { type: 'account', name: 'Local parent', main: { keywords: [] } },
    'receiver-child': { type: 'child', parentProfileId: 'local-parent-b', main: { keywords: [] }, settings: {} }
  } };
}
async function fixture() {
  let stored = profiles();
  let writes = 0;
  const sandbox = {
    crypto: webcrypto, TextEncoder, Uint8Array, atob, btoa,
    FilterTubeIO: {
      loadProfilesV4: async () => stored,
      saveProfilesV4: async next => { stored = next; writes += 1; },
      exportV3: async () => ({}), importV3: async () => ({ ok: true })
    }
  };
  vm.runInNewContext(adapterSource, sandbox);
  const adapter = sandbox.FilterTubeNanahAdapter;
  const keys = await adapter.createManagedNanahSigningKeyPair({ keyVersion: 1, sourcePublicKeyId: 'parent-key' });
  const trusted = {
    id: 'parent-child-link', type: 'managed_link', localRole: 'replica', remoteRole: 'source',
    sourceProfileId: 'remote-parent-a', sourceDeviceId: 'parent-device', targetProfileId: 'receiver-child',
    localParentProfileId: 'local-parent-b', allowedScopes: ['keywords'],
    sourcePublicKeyId: keys.sourcePublicKeyId, sourcePublicKeyJwk: keys.sourcePublicKeyJwk, keyVersion: 1
  };
  async function envelope(overrides = {}, signingKey = keys.privateKeyJwk) {
    const unsigned = {
      type: 'filtertube_managed_policy', linkId: 'parent-child-link', scope: 'keywords',
      targetProfileId: 'receiver-child', sourceProfileId: 'remote-parent-a', sourceDeviceId: 'parent-device',
      targetDeviceId: 'child-device', revision: 1, sourcePublicKeyId: keys.sourcePublicKeyId, keyVersion: 1,
      payload: { scope: 'keywords', surface: 'main', operations: [{ op: 'add_keyword', value: 'new-rule' }] },
      ...overrides
    };
    unsigned.policyHash = adapter.buildManagedPolicyPayloadHash(unsigned);
    return adapter.signManagedPolicyEnvelope(unsigned, signingKey);
  }
  async function context(message, link = trusted, profileSnapshot = stored) {
    const signature = await adapter.verifyManagedNanahPolicyIntegritySignature(message, link);
    return { trustedLink: link, profiles: clone(profileSnapshot.profiles), targetDeviceId: 'child-device', signatureVerified: signature.verified === true };
  }
  return { adapter, trusted, keys, envelope, context, get stored() { return stored; }, set stored(value) { stored = value; }, get writes() { return writes; } };
}

test('a cryptographically pinned remote parent updates a child owned by a differently named local parent', async () => {
  const f = await fixture();
  const message = await f.envelope();
  assert.equal(f.stored.profiles['remote-parent-a'], undefined);
  const result = await f.adapter.applyManagedPolicyEnvelope(message, await f.context(message));
  assert.equal(result.accepted, true);
  assert.equal(result.applied, true);
  assert.equal(f.writes, 1);
  assert.deepEqual(Array.from(f.stored.profiles['receiver-child'].main.keywords, item => item.word), ['new-rule']);
  assert.deepEqual(f.stored.profiles['local-parent-b'].main.keywords, []);
  assert.equal(f.stored.profiles['receiver-child'].parentProfileId, 'local-parent-b');
});

test('local ownership grants reject the wrong parent, a child parent, deleted owner and reparenting', async () => {
  for (const mutate of [
    f => { f.trusted.localParentProfileId = 'another-parent'; f.stored.profiles['another-parent'] = { type: 'account' }; },
    f => { f.stored.profiles['local-parent-b'].type = 'child'; },
    f => { f.stored.profiles['local-parent-b'] = { type: '', parentProfileId: 'different-parent' }; },
    f => { f.stored.profiles['local-parent-b'] = { type: 'unknown', parentProfileId: 'different-parent' }; },
    f => { delete f.stored.profiles['local-parent-b']; },
    f => { f.stored.profiles['receiver-child'].parentProfileId = 'another-parent'; }
  ]) {
    const f = await fixture(); mutate(f);
    const message = await f.envelope();
    assert.equal((await f.adapter.applyManagedPolicyEnvelope(message, await f.context(message))).accepted, false);
    assert.equal(f.writes, 0);
  }
});

test('fresh apply rechecks local ownership after a valid earlier validation snapshot', async () => {
  const f = await fixture();
  const message = await f.envelope();
  const context = await f.context(message);
  assert.equal(f.adapter.validateManagedPolicyEnvelope(message, context).accepted, true);
  f.stored.profiles['receiver-child'].parentProfileId = 'new-parent';
  f.stored.profiles['new-parent'] = { type: 'account' };
  const result = await f.adapter.applyManagedPolicyEnvelope(message, context);
  assert.equal(result.reason, 'source_not_bound_to_target');
  assert.equal(f.writes, 0);
});

test('the grant preserves remote identity, device, target, key, scope, role and revocation checks', async () => {
  const cases = [
    [{ sourceProfileId: 'different-remote-parent' }, null, 'wrong_source_profile'],
    [{ sourceDeviceId: 'different-device' }, null, 'wrong_source_device'],
    [{ targetDeviceId: 'different-receiver' }, null, 'wrong_target_device'],
    [{ targetProfileId: 'different-child' }, null, 'wrong_target_profile'],
    [{ sourcePublicKeyId: 'different-key' }, null, 'wrong_public_key'],
    [{ keyVersion: 2 }, null, 'wrong_key_version'],
    [{}, link => { link.allowedScopes = ['main']; }, 'scope_not_allowed'],
    [{}, link => { link.localRole = 'peer'; }, 'wrong_link_roles'],
    [{}, link => { link.revoked = true; }, 'link_revoked'],
    [{}, link => { link.keyRevoked = true; }, 'key_revoked'],
    [{}, link => { link.stalePairing = true; }, 'stale_pairing']
  ];
  for (const [overrides, mutate, reason] of cases) {
    const f = await fixture(); mutate?.(f.trusted);
    const message = await f.envelope(overrides);
    const result = await f.adapter.applyManagedPolicyEnvelope(message, await f.context(message));
    assert.equal(result.reason, reason);
    assert.equal(f.writes, 0);
  }
});

test('an unpinned signer cannot use a valid local grant', async () => {
  const f = await fixture();
  const stranger = await f.adapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'stranger-key' });
  const message = await f.envelope({}, stranger.privateKeyJwk);
  const context = await f.context(message);
  assert.equal(context.signatureVerified, false);
  context.verifyIntegritySignature = () => ({ verified: false, reason: 'signature_invalid' });
  assert.equal((await f.adapter.applyManagedPolicyEnvelope(message, context)).reason, 'signature_invalid');
  assert.equal(f.writes, 0);
});

test('legacy foreign-profile trust fails closed while original same-ID local authority remains valid', async () => {
  const f = await fixture(); delete f.trusted.localParentProfileId;
  const foreignMessage = await f.envelope();
  assert.equal((await f.adapter.applyManagedPolicyEnvelope(foreignMessage, await f.context(foreignMessage))).reason, 'source_not_parent_authority');
  assert.equal(f.writes, 0);
  f.trusted.sourceProfileId = 'local-parent-b';
  const oldStyle = await f.envelope({ sourceProfileId: 'local-parent-b' });
  assert.equal((await f.adapter.applyManagedPolicyEnvelope(oldStyle, await f.context(oldStyle))).accepted, true);
});

test('only receiver-stored trust can grant local ownership; envelope metadata cannot grant itself', async () => {
  const granted = await fixture();
  delete granted.trusted.localParentProfileId;
  granted.trusted.policy = { localParentProfileId: 'local-parent-b' };
  const valid = await granted.envelope();
  assert.equal((await granted.adapter.applyManagedPolicyEnvelope(valid, await granted.context(valid))).accepted, true);
  const remoteClaim = await fixture();
  delete remoteClaim.trusted.localParentProfileId;
  const claimed = await remoteClaim.envelope({ localParentProfileId: 'local-parent-b' });
  assert.equal((await remoteClaim.adapter.applyManagedPolicyEnvelope(claimed, await remoteClaim.context(claimed))).reason, 'source_not_parent_authority');
  assert.equal(remoteClaim.writes, 0);
});

function approvalFixture({ actor = 'receiver-child', unlock = true } = {}) {
  let stored = profiles(); stored.activeProfileId = actor;
  stored.profiles.default = { type: 'account' };
  const attempts = [];
  const context = {
    window: { FilterTubeIO: { loadProfilesV4: async () => stored } },
    safeObject: value => value && typeof value === 'object' ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getProfileType: (root, id) => root.profiles[id]?.type,
    canActiveProfileManageProfile: (root, id) => root.activeProfileId === 'default' || root.activeProfileId === root.profiles[id]?.parentProfileId,
    ensureProfileUnlocked: async (_, id, options) => { attempts.push({ id, options }); return unlock; }
  };
  const start = tabSource.indexOf('    async function authorizeNanahManagedReceiverParentBinding(');
  const end = tabSource.indexOf('    async function ensureNanahManagedChildLinkPermission(', start);
  assert.ok(start > 0 && end > start);
  vm.runInNewContext(tabSource.slice(start, end), context);
  return { context, stored, attempts, run: () => context.authorizeNanahManagedReceiverParentBinding({ targetProfileBehavior: 'fixed_profile', targetProfileId: 'receiver-child' }) };
}

function productionLinkPipeline() {
  function section(startText, endText) {
    const start = tabSource.indexOf(startText);
    const end = tabSource.indexOf(endText, start);
    assert.ok(start > 0 && end > start);
    return tabSource.slice(start, end);
  }
  let stored;
  const context = {
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0,
    nanahTrustedLinks: [], NANAH_TRUSTED_LINKS_KEY: 'trusted-links',
    readNanahStorage: async () => stored || [],
    writeNanahStorage: async (_, value) => { stored = clone(value); return true; },
    renderNanahTrustedLinks() {}
  };
  context.window = context;
  installNanahStorageLock(context);
  vm.runInNewContext([
    section('    function getNanahScopeList(', '    function getNanahTrustedLinkTypePill('),
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function buildNanahManagedValidationTrustedLink(', '    function getNanahManagedDuplicateDeviceIds('),
    section('    async function persistNanahTrustedLinks(', '    function buildManagedTrustRevocationHistoryRow('),
    section('    async function saveNanahTrustedLink(', '    async function removeNanahTrustedLink('),
    section('    function sanitizeNanahRemoteManagedLinkPolicy(', '    async function handleNanahIncomingEnvelope(')
  ].join('\n'), context);
  return { context, get stored() { return stored; } };
}

test('local approval survives production normalized storage and rebuilt signed validation context', async () => {
  for (const policyOnly of [false, true]) {
    const approval = approvalFixture({ actor: 'local-parent-b' });
    const localParentProfileId = await approval.run();
    const f = await fixture();
    const pipeline = productionLinkPipeline();
    const entry = {
      ...f.trusted, linkId: f.trusted.id, linkType: 'managed_link', remoteDeviceId: 'parent-device',
      policy: { allowedScopes: ['keywords'], targetProfileBehavior: 'fixed_profile', targetProfileId: 'receiver-child', localParentProfileId }
    };
    if (policyOnly) delete entry.localParentProfileId;
    await pipeline.context.saveNanahTrustedLink(entry);
    const reloaded = pipeline.context.normalizeNanahTrustedLink(clone(pipeline.stored[0]));
    assert.equal(reloaded.policy.localParentProfileId, 'local-parent-b');
    const message = await f.envelope();
    const rebuilt = pipeline.context.buildNanahManagedValidationTrustedLink(message, reloaded);
    assert.equal(rebuilt.sourceProfileId, 'remote-parent-a');
    assert.equal(rebuilt.targetProfileId, 'receiver-child');
    const validation = await f.context(message, rebuilt);
    assert.equal((await f.adapter.applyManagedPolicyEnvelope(message, validation)).accepted, true);
    const later = await f.envelope({ revision: 2 });
    const snapshot = await f.context(later, rebuilt);
    f.stored.profiles['receiver-child'].parentProfileId = 'reassigned-parent';
    assert.equal((await f.adapter.applyManagedPolicyEnvelope(later, snapshot)).reason, 'source_not_bound_to_target');
    assert.equal(f.writes, 1);
  }
});

test('remote saved-link metadata cannot create a local parent grant through production normalization', async () => {
  const f = await fixture();
  const pipeline = productionLinkPipeline();
  const sanitized = pipeline.context.sanitizeNanahRemoteManagedLinkPolicy({
    linkType: 'managed_link', allowedScopes: ['keywords'], targetProfileBehavior: 'fixed_profile', targetProfileId: 'receiver-child',
    localParentProfileId: 'local-parent-b', policy: { localParentProfileId: 'local-parent-b' }
  });
  assert.equal(sanitized.localParentProfileId, undefined);
  assert.equal(sanitized.policy, undefined);
  const { localParentProfileId: _discard, ...remoteIdentity } = f.trusted;
  await pipeline.context.saveNanahTrustedLink({ ...remoteIdentity, linkId: f.trusted.id, linkType: 'managed_link', remoteDeviceId: 'parent-device', policy: sanitized });
  const rebuilt = pipeline.context.buildNanahManagedValidationTrustedLink({}, pipeline.stored[0]);
  assert.equal(rebuilt.localParentProfileId, undefined);
  assert.equal(rebuilt.policy.localParentProfileId, undefined);
  const message = await f.envelope();
  assert.equal((await f.adapter.applyManagedPolicyEnvelope(message, await f.context(message, rebuilt))).reason, 'source_not_parent_authority');
  assert.equal(f.writes, 0);
  const approved = await approvalFixture({ actor: 'local-parent-b' }).run();
  await pipeline.context.saveNanahTrustedLink({ ...remoteIdentity, linkId: f.trusted.id, linkType: 'managed_link', remoteDeviceId: 'parent-device', localParentProfileId: approved, policy: sanitized });
  await pipeline.context.saveNanahTrustedLink({ ...remoteIdentity, linkId: f.trusted.id, linkType: 'managed_link', remoteDeviceId: 'parent-device', policy: sanitized });
  assert.equal(pipeline.stored[0].localParentProfileId, 'local-parent-b');
  assert.equal(pipeline.stored[0].policy.localParentProfileId, undefined);
});

test('receiver trust grants require the local owner or Master approval, never the child PIN', async () => {
  for (const actor of ['receiver-child', 'local-parent-b', 'default']) {
    const f = approvalFixture({ actor });
    assert.equal(await f.run(), 'local-parent-b');
    assert.equal(f.attempts[0].id, actor === 'default' ? 'default' : 'local-parent-b');
    assert.equal(f.attempts[0].options.sensitiveAction, true);
  }
  const declined = approvalFixture({ unlock: false });
  assert.equal(await declined.run(), '');
  const sibling = approvalFixture({ actor: 'sibling' });
  sibling.stored.profiles.sibling = { type: 'child', parentProfileId: 'local-parent-b' };
  assert.equal(await sibling.run(), '');
  assert.equal(sibling.attempts.length, 0);
});

test('receiver approval refuses ownership or actor changes during the local PIN prompt', async () => {
  for (const mutate of [
    f => { f.stored.profiles['receiver-child'].parentProfileId = 'different-parent'; },
    f => { f.stored.activeProfileId = 'default'; },
    f => { delete f.stored.profiles['local-parent-b']; }
  ]) {
    const f = approvalFixture();
    f.context.ensureProfileUnlocked = async () => { mutate(f); return true; };
    assert.equal(await f.run(), '');
  }
});
