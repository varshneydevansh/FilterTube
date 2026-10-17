import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const link = {
    linkId: 'parent-child', remoteDeviceId: 'parent-device', linkType: 'managed_link',
    localRole: 'replica', remoteRole: 'source', sourceDeviceId: 'parent-device',
    sourceProfileId: 'remote-parent', sourcePublicKeyId: 'parent-key', keyVersion: 1,
    sourcePublicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'pinned-key' },
    localParentProfileId: 'local-parent',
    policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'child', allowedScopes: ['keywords'], autoApplyControlProposals: true }
  };
  let stored = [clone(link)];
  const context = {
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0,
    nanahTrustedLinks: [clone(link)], nanahStableDeviceId: 'child-device', NANAH_TRUSTED_LINKS_KEY: 'trusted',
    profilesV4Cache: { profiles: { 'local-parent': { type: 'account' }, child: { type: 'child', parentProfileId: 'local-parent' } } },
    readNanahStorage: async () => clone(stored), findNanahTrustedLink: () => null
  };
  function section(startText, endText) {
    const start = source.indexOf(startText); const end = source.indexOf(endText, start);
    assert.ok(start > 0 && end > start);
    return source.slice(start, end);
  }
  vm.runInNewContext([
    section('    function getNanahScopeList(', '    function getNanahTrustedLinkTypePill('),
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function getManagedNanahPolicyAcceptedState(', '    function summarizeManagedNanahPolicyEnvelope(')
  ].join('\n'), context);
  const envelope = { linkId: 'parent-child', sourceDeviceId: 'parent-device', targetProfileId: 'child', scope: 'keywords' };
  return { context, envelope, get stored() { return stored; }, set stored(value) { stored = value; },
    build: () => context.buildManagedNanahPolicyValidationContext(envelope) };
}

test('production validation context detaches initial verified key and policy from mutable trust', () => {
  const f = fixture(); const initial = f.build();
  f.context.nanahTrustedLinks[0].sourcePublicKeyJwk.x = 'changed';
  f.context.nanahTrustedLinks[0].policy.allowedScopes.push('channels');
  assert.equal(initial.trustedLink.sourcePublicKeyJwk.x, 'pinned-key');
  assert.deepEqual(Array.from(initial.trustedLink.policy.allowedScopes), ['keywords']);
});

test('fresh context requires persisted and in-memory trust without restoring a removed link', async () => {
  for (const location of ['persisted', 'memory', 'during-storage-read']) {
    const f = fixture(); const initial = f.build();
    if (location === 'persisted') f.stored = [];
    if (location === 'memory') f.context.nanahTrustedLinks = [];
    if (location === 'during-storage-read') f.context.readNanahStorage = async () => {
      const old = clone(f.stored); f.context.nanahTrustedLinks = []; return old;
    };
    const fresh = await initial.loadFreshManagedValidationContext(f.envelope);
    assert.equal(Object.keys(fresh.trustedLink).length, 0, location);
    if (location !== 'persisted') assert.equal(f.context.nanahTrustedLinks.length, 0, 'storage cannot resurrect in-memory removal');
  }
});

test('fresh authority rejects one-store changes to pins, scope, ownership, roles and revocation', async () => {
  for (const mutate of [
    link => { link.sourcePublicKeyJwk.x = 'replacement'; },
    link => { link.policy.allowedScopes = ['channels']; },
    link => { link.localParentProfileId = 'other-parent'; },
    link => { link.localRole = 'source'; },
    link => { link.sourceDeviceId = 'other-device'; },
    link => { link.sourceProfileId = 'other-parent'; },
    link => { link.policy.targetProfileId = 'other-child'; },
    link => { link.revoked = true; },
    link => { link.keyRevoked = true; },
    link => { link.stalePairing = true; },
    link => { link.policy.autoApplyControlProposals = false; }
  ]) {
    const f = fixture(); const initial = f.build(); mutate(f.stored[0]);
    const fresh = await initial.loadFreshManagedValidationContext(f.envelope);
    assert.equal(Object.keys(fresh.trustedLink).length, 0);
  }
});

test('final synchronous projection observes removal or narrowing during the last profiles read', async () => {
  const f = fixture(); const fresh = await f.build().loadFreshManagedValidationContext(f.envelope);
  assert.equal(fresh.trustedLink.sourceProfileId, 'remote-parent');
  f.context.nanahTrustedLinks[0].policy.allowedScopes = ['channels'];
  assert.equal(Object.keys(fresh.getCurrentManagedValidationContext(f.envelope).trustedLink).length, 0);
  f.context.nanahTrustedLinks = [];
  assert.equal(Object.keys(fresh.getCurrentManagedValidationContext(f.envelope).trustedLink).length, 0);
});

test('receipt metadata and JWK property order do not invalidate unchanged authority', async () => {
  const f = fixture();
  f.stored[0].lastUsedAt = 'later';
  f.stored[0].deviceLabel = 'Renamed tablet';
  f.stored[0].sourcePublicKeyJwk = { x: 'pinned-key', crv: 'Ed25519', kty: 'OKP' };
  const fresh = await f.build().loadFreshManagedValidationContext(f.envelope);
  assert.equal(fresh.trustedLink.linkId, 'parent-child');
  assert.equal(fresh.trustedLink.localParentProfileId, 'local-parent');
  assert.deepEqual(Array.from(fresh.trustedLink.allowedScopes), ['keywords']);
});

test('duplicate signer destinations in either store remain blocking and unavailable storage fails closed', async () => {
  for (const location of ['persisted', 'memory']) {
    const f = fixture();
    const duplicate = { ...clone(f.stored[0]), linkId: 'duplicate-link' };
    if (location === 'persisted') f.stored.push(duplicate); else f.context.nanahTrustedLinks.push(duplicate);
    const fresh = await f.build().loadFreshManagedValidationContext(f.envelope);
    assert.deepEqual(Array.from(fresh.duplicateDeviceIds), ['parent-device']);
  }
  const f = fixture(); f.context.readNanahStorage = async () => null;
  assert.equal(await f.build().loadFreshManagedValidationContext(f.envelope), null);
});
