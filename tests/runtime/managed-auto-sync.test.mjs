import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../../js/managed_auto_sync.js', import.meta.url), 'utf8'), context);
const api = context.FilterTubeManagedAutoSync;
const clone = value => JSON.parse(JSON.stringify(value));

function snapshot() {
    return {
        sourceDeviceId: 'parent-device',
        profilesV4: {
            activeProfileId: 'parent',
            profiles: {
                default: { type: 'account' }, parent: { type: 'account', security: { profilePinVerifier: { hash: 'parent-pin' } } },
                otherParent: { type: 'account' }, child: { type: 'child', parentProfileId: 'parent', main: { channels: [] } },
                sibling: { type: 'child', parentProfileId: 'parent' }
            }
        },
        link: {
            linkId: 'saved-parent-child', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica',
            sourceDeviceId: 'parent-device', sourceProfileId: 'parent', localPolicyProfileId: 'child',
            remoteDeviceId: 'child-device', sourcePublicKeyId: 'parent-key', keyVersion: 1,
            sourcePublicKeyJwk: { kty: 'EC', x: 'public-x', y: 'public-y' },
            policy: {
                targetProfileBehavior: 'fixed_profile', targetProfileId: 'remote-child', targetProfileType: 'child',
                allowedScopes: ['kids', 'main'], autoApplyControlProposals: true, reconnectMode: 'fast',
                lockedChildMode: 'allow_trusted_updates', syncOnProfileOpen: true
            }
        }
    };
}

function grantFor(state) {
    const result = api.bindingFor(state.link, state);
    assert.equal(result.ok, true, result.reason);
    return { schema: api.SCHEMA, version: 1, enabled: true, binding: result.binding };
}

test('source enrollment binds explicit local child to the independently fixed remote child', () => {
    const state = snapshot(), grant = grantFor(state);
    const result = api.eligible(state, grant);
    assert.equal(result.ok, true);
    assert.deepEqual(clone(result.scopes), ['kids', 'main']);
    assert.equal(result.binding.localPolicyProfileId, 'child');
    assert.equal(result.binding.targetProfileId, 'remote-child');
});

test('enrollment is local opt-in and does not mutate receiver permissions or profiles', () => {
    const state = snapshot(), original = clone(state);
    const grant = grantFor(state);
    assert.equal(api.eligible(state, { ...grant, enabled: false }).ok, false);
    assert.equal(api.eligible(state, null).ok, false);
    assert.deepEqual(state, original);
});

test('receiver settings are not silently broadened when making a sender grant', () => {
    const state = snapshot();
    state.link.policy.autoApplyControlProposals = false;
    state.link.policy.reconnectMode = 'approval_needed';
    const grant = grantFor(state);
    assert.equal(api.eligible(state, grant).ok, true);
    assert.equal(state.link.policy.autoApplyControlProposals, false);
    assert.equal(state.link.policy.reconnectMode, 'approval_needed');
});

test('grant roundtrip survives restart and ordinary child rule saves', () => {
    const state = snapshot(), grant = clone(grantFor(state));
    state.profilesV4.profiles.child.main.channels.push({ id: 'new-channel' });
    assert.equal(api.eligible(clone(state), grant).ok, true);
    assert.equal(api.normalizeGrant(grant).binding.sourcePublicKeyId, 'parent-key');
});

const mutations = {
    'source parent switches': state => { state.profilesV4.activeProfileId = 'otherParent'; },
    'child becomes active': state => { state.profilesV4.activeProfileId = 'child'; },
    'source device changes': state => { state.sourceDeviceId = 'other-device'; },
    'link revoked': state => { state.link.revoked = true; },
    'policy revoked': state => { state.link.policy.revoked = true; },
    'key revoked': state => { state.link.keyRevoked = true; },
    'pairing stale': state => { state.link.policy.stalePairing = true; },
    'link quarantined': state => { state.link.quarantined = true; },
    'child owner changes': state => { state.profilesV4.profiles.child.parentProfileId = 'otherParent'; },
    'owner disappears': state => { delete state.profilesV4.profiles.parent; },
    'local target disappears': state => { delete state.profilesV4.profiles.child; },
    'local target becomes adult': state => { state.profilesV4.profiles.child.type = 'account'; },
    'parent becomes child': state => { state.profilesV4.profiles.parent.type = 'child'; },
    'parent PIN changes': state => { state.profilesV4.profiles.parent.security.profilePinVerifier.hash = 'changed'; },
    'child PIN changes': state => { state.profilesV4.profiles.child.security = { profilePinVerifier: { hash: 'new' } }; },
    'source key rotates': state => { state.link.keyVersion = 2; },
    'key material changes under same key id': state => { state.link.sourcePublicKeyJwk.x = 'different'; },
    'allowed scope reduced': state => { state.link.policy.allowedScopes = ['kids']; },
    'allowed scope expanded': state => { state.link.policy.allowedScopes.push('time_limits'); },
    'receiving profile changes': state => { state.link.policy.targetProfileId = 'sibling'; },
    'local child mapping changes': state => { state.link.localPolicyProfileId = 'sibling'; },
    'receiving device changes': state => { state.link.remoteDeviceId = 'other-child-device'; },
    'receiver permission changes': state => { state.link.policy.lockedChildMode = 'require_unlock'; },
    'receiver approval changes': state => { state.link.policy.autoApplyControlProposals = false; },
    'link identity changes': state => { state.link.linkId = 'new-link'; }
};
for (const [name, mutate] of Object.entries(mutations)) {
    test(`${name} invalidates pending enrollment`, () => {
        const state = snapshot(), grant = grantFor(state);
        mutate(state);
        assert.equal(api.eligible(state, grant).ok, false);
    });
}

test('master may enroll an explicitly owned child but loss of owner still blocks dispatch', () => {
    const state = snapshot();
    state.profilesV4.activeProfileId = 'default'; state.link.sourceProfileId = 'default';
    const grant = grantFor(state);
    assert.equal(api.eligible(state, grant).ok, true);
    delete state.profilesV4.profiles.parent;
    assert.equal(api.eligible(state, grant).reason, 'owner_missing');
});

test('no fallback to active child, remote target or an arbitrary source parent', () => {
    for (const key of ['sourceProfileId', 'localPolicyProfileId']) {
        const state = snapshot(); delete state.link[key];
        assert.equal(api.bindingFor(state.link, state).ok, false);
    }
    const state = snapshot(); delete state.link.policy.targetProfileId;
    assert.equal(api.bindingFor(state.link, state).ok, false);
});

test('current-active and adult remote targets cannot be enrolled as managed child updates', () => {
    const state = snapshot(); state.link.policy.targetProfileBehavior = 'current_active';
    assert.equal(api.bindingFor(state.link, state).reason, 'fixed_target_required');
    state.link.policy.targetProfileBehavior = 'fixed_profile'; state.link.policy.targetProfileType = 'account';
    assert.equal(api.bindingFor(state.link, state).reason, 'child_target_required');
});

test('conflicting duplicate identity fields and key versions fail closed', () => {
    for (const name of ['sourceDeviceId', 'sourceProfileId', 'sourcePublicKeyId', 'targetProfileId']) {
        const state = snapshot();
        if (name === 'targetProfileId') state.link.targetProfileId = state.link.policy.targetProfileId;
        state.link.policy[name] = `wrong-${name}`;
        assert.equal(api.bindingFor(state.link, state).ok, false, name);
    }
    const state = snapshot(); state.link.policy.keyVersion = 2;
    assert.equal(api.bindingFor(state.link, state).reason, 'invalid_key_version');
});

test('target device alias never conceals a conflicting or malformed explicit target', () => {
    for (const target of ['', ' child-device ', 'other-device']) {
        const state = snapshot(); state.link.policy.targetDeviceId = target;
        assert.equal(api.bindingFor(state.link, state).ok, false);
    }
});

test('scopes match existing managed bundles and never admit notes or full-account payloads', () => {
    assert.deepEqual(clone(api.normalizeScopes(['rules_bundle'])), ['channels', 'keywords', 'videos']);
    assert.deepEqual(clone(api.normalizeScopes(['active'])), ['kids', 'main', 'time_limits', 'viewing_space']);
    assert.deepEqual(clone(api.normalizeScopes(['notes'])), []);
    assert.deepEqual(clone(api.normalizeScopes(['kids', 'notes'])), []);
    const state = snapshot(); state.link.policy.allowedScopes = ['notes'];
    assert.equal(api.bindingFor(state.link, state).reason, 'scope_not_allowed');
});

test('unknown or malformed grants never authorize dispatch', () => {
    const state = snapshot(), grant = grantFor(state);
    for (const value of [null, {}, { ...grant, version: 2 }, { ...grant, schema: 'peer_grant' },
        { ...grant, binding: { ...grant.binding, keyVersion: '1' } },
        { ...grant, binding: { ...grant.binding, securityFingerprint: '' } }]) {
        assert.equal(api.eligible(state, value).ok, false);
    }
});
