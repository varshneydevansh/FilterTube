import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const historyPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function purgeRemoteManagedPolicyStateForTrustedLinkFixture(profilesV4, linkId, { now = 1780600000000 } = {}) {
  const profiles = { ...safeObject(profilesV4.profiles) };
  let profilesTouched = 0;
  let scopesRemoved = 0;

  Object.entries(profiles).forEach(([profileId, profile]) => {
    const managedState = safeObject(profile.managedPolicyState);
    const remotePolicies = safeObject(managedState.remoteManagedPolicies);
    if (!Object.prototype.hasOwnProperty.call(remotePolicies, linkId)) return;

    const removedScopes = Object.keys(safeObject(remotePolicies[linkId]))
      .filter(scope => Object.keys(safeObject(remotePolicies[linkId][scope])).length > 0);
    const nextRemotePolicies = { ...remotePolicies };
    delete nextRemotePolicies[linkId];
    const nextManagedState = { ...managedState };
    if (Object.keys(nextRemotePolicies).length > 0) {
      nextManagedState.remoteManagedPolicies = nextRemotePolicies;
    } else {
      delete nextManagedState.remoteManagedPolicies;
    }

    const historyRows = Array.isArray(profile.managedActionHistory)
      ? profile.managedActionHistory.filter(row => row?.schema === 'filtertube_managed_action_history')
      : [];
    profiles[profileId] = {
      ...profile,
      managedPolicyState: nextManagedState,
      managedActionHistory: [
        ...historyRows,
        {
          rowId: `managed-trust-revoke-${profileId}-${linkId}-${now}`,
          schema: 'filtertube_managed_action_history',
          version: 1,
          actorProfileId: 'parent-profile-1',
          actorDeviceId: 'child-device-1',
          targetProfileId: profileId,
          trustedLinkId: linkId,
          actionType: 'trust_link.revoke',
          scope: 'trust_link',
          revision: null,
          policyHash: null,
          result: 'accepted',
          reason: null,
          receivedAt: now,
          issuedAt: now,
          orderKey: `revoke:${now}:${linkId}`,
          summary: {
            redacted: true,
            label: 'Trusted parent link removed',
            reason: 'trusted_link_removed',
            removedScopeCount: removedScopes.length,
            removedScopes
          },
          sensitive: true
        }
      ]
    };
    profilesTouched += 1;
    scopesRemoved += removedScopes.length;
  });

  return {
    schemaVersion: 4,
    ...profilesV4,
    profiles,
    purgeResult: { profilesTouched, scopesRemoved }
  };
}

test('managed trust revocation cleanup is runtime-backed and documented as local cleanup only', () => {
  const tabView = read('js/tab-view.js');
  const inventory = read(inventoryPath);
  const plan = read(planPath);
  const history = read(historyPath);

  assert.match(tabView, /async function purgeNanahManagedPolicyStateForTrustedLink\(linkId, \{ reason = 'trusted_link_removed' \} = \{\}\)/);
  assert.match(tabView, /delete nextRemotePolicies\[normalized\]/);
  assert.match(tabView, /actionType: 'trust_link\.revoke'/);
  assert.match(tabView, /removedScopeCount: removedScopes\.length/);
  assert.match(tabView, /async function purgeNanahManagedOpenSyncStateForTrustedLink\(linkId\)/);
  assert.match(tabView, /reasonCode: 'trusted_link_removed'/);
  assert.match(tabView, /await purgeNanahManagedPolicyStateForTrustedLink\(normalized\)/);
  assert.match(tabView, /await purgeNanahManagedOpenSyncStateForTrustedLink\(normalized\)/);
  assert.match(tabView, /removeBtn\.disabled = childManagedReplicaLink/);

  assert.match(inventory, /trusted-link removal now purges target-local\s+accepted managed-policy revision state/i);
  assert.match(inventory, /server mailbox queue purge remains pending/i);
  assert.match(plan, /trusted-link removal cleanup: present/i);
  assert.match(history, /trusted-link removal history writer\s+now records protected `trust_link\.revoke` rows/i);
});

test('managed trust revocation fixture removes only the revoked link state and keeps protected evidence', () => {
  const profilesV4 = {
    schemaVersion: 4,
    activeProfileId: 'parent-profile-1',
    profiles: {
      'child-profile-1': {
        type: 'child',
        parentProfileId: 'parent-profile-1',
        managedPolicyState: {
          remoteManagedPolicies: {
            'link-parent-child-1': {
              keywords: { revision: 3, policyHash: 'hash-keyword-3', plaintextValue: 'spiders' },
              channels: { revision: 2, policyHash: 'hash-channel-2', channelName: 'Blocked Channel' }
            },
            'link-coparent-child-1': {
              time_limits: { revision: 1, policyHash: 'hash-time-1' }
            }
          }
        },
        managedActionHistory: [
          {
            schema: 'filtertube_managed_action_history',
            actionType: 'remote_policy.accept',
            result: 'accepted',
            scope: 'keywords'
          }
        ]
      },
      'child-profile-2': {
        type: 'child',
        parentProfileId: 'parent-profile-1',
        managedPolicyState: {
          remoteManagedPolicies: {
            'link-parent-child-1': {
              videos: { revision: 1, policyHash: 'hash-video-1', videoId: 'private-video' }
            }
          }
        }
      }
    }
  };

  const next = purgeRemoteManagedPolicyStateForTrustedLinkFixture(profilesV4, 'link-parent-child-1');
  const childOne = next.profiles['child-profile-1'];
  const childTwo = next.profiles['child-profile-2'];

  assert.deepEqual(next.purgeResult, { profilesTouched: 2, scopesRemoved: 3 });
  assert.equal(Object.hasOwn(childOne.managedPolicyState.remoteManagedPolicies, 'link-parent-child-1'), false);
  assert.equal(Object.hasOwn(childOne.managedPolicyState.remoteManagedPolicies, 'link-coparent-child-1'), true);
  assert.equal(Object.hasOwn(childTwo.managedPolicyState, 'remoteManagedPolicies'), false);

  const revokeRows = childOne.managedActionHistory.filter(row => row.actionType === 'trust_link.revoke');
  assert.equal(revokeRows.length, 1);
  assert.equal(revokeRows[0].scope, 'trust_link');
  assert.equal(revokeRows[0].sensitive, true);
  assert.equal(revokeRows[0].summary.redacted, true);
  assert.deepEqual(revokeRows[0].summary.removedScopes, ['keywords', 'channels']);
  assert.equal(revokeRows[0].summary.removedScopeCount, 2);
  assert.doesNotMatch(JSON.stringify(revokeRows[0]), /spiders|Blocked Channel|private-video/);
});
