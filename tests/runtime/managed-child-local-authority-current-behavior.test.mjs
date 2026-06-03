import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/io_manager.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function profilesFixture(activeProfileId = 'default') {
  return {
    activeProfileId,
    profiles: {
      default: { id: 'default', type: 'default', name: 'Default' },
      parentA: { id: 'parentA', type: 'account', name: 'Parent A' },
      parentB: { id: 'parentB', type: 'account', name: 'Parent B' },
      childA: { id: 'childA', type: 'child', parentProfileId: 'parentA', name: 'Child A' },
      childB: { id: 'childB', type: 'child', parentProfileId: 'parentB', name: 'Child B' }
    }
  };
}

function profileType(profilesV4, profileId) {
  const profile = profilesV4.profiles?.[profileId] || {};
  if (profile.type === 'account' || profile.type === 'child') return profile.type;
  if (profile.parentProfileId) return 'child';
  return profileId === 'default' ? 'default' : 'account';
}

function parentProfileId(profilesV4, profileId) {
  return profilesV4.profiles?.[profileId]?.parentProfileId || '';
}

function canActiveProfileManageProfile(profilesV4, targetProfileId) {
  const targetId = String(targetProfileId || '');
  const currentActive = String(profilesV4?.activeProfileId || 'default');
  if (!targetId || profileType(profilesV4, currentActive) === 'child') return false;
  return currentActive === 'default'
    || currentActive === targetId
    || parentProfileId(profilesV4, targetId) === currentActive;
}

function isProfileLocked(profilesV4, profileId) {
  return profilesV4.profiles?.[profileId]?.pinVerifier ? true : false;
}

function ensureUnlockedDecision(profilesV4, profileId, unlockedProfiles = new Set()) {
  if (!isProfileLocked(profilesV4, profileId)) return { allowed: true, decision: 'not_locked' };
  if (unlockedProfiles.has(profileId)) return { allowed: true, decision: 'already_unlocked' };
  return { allowed: false, reason: 'parent_unlock_required' };
}

function startManagedChildEditDecision({ profilesV4, targetProfileId, unlockedProfiles = new Set() }) {
  if (profileType(profilesV4, targetProfileId) !== 'child') return { allowed: false, reason: 'target_not_child' };
  if (!canActiveProfileManageProfile(profilesV4, targetProfileId)) return { allowed: false, reason: 'not_parent_authority' };
  const activeId = profilesV4.activeProfileId || 'default';
  const unlock = ensureUnlockedDecision(profilesV4, activeId, unlockedProfiles);
  if (!unlock.allowed) return unlock;
  return { allowed: true, decision: 'start_virtual_child_edit' };
}

function saveManagedChildSurfaceDecision({ freshProfilesV4, managedChildEdit }) {
  const profileId = String(managedChildEdit?.profileId || '');
  if (!profileId) return { allowed: false, reason: 'no_managed_child_target' };
  if (!canActiveProfileManageProfile(freshProfilesV4, profileId)) {
    return { allowed: false, reason: 'fresh_authority_recheck_failed' };
  }
  if (!freshProfilesV4.profiles?.[profileId]) return { allowed: false, reason: 'target_missing' };
  return { allowed: true, decision: 'save_child_surface_only' };
}

function adminSessionDecision({ activeProfileId, sessionProfileId, now, expiresAt, sensitiveAction = false, reauthAt = 0 }) {
  if (activeProfileId !== sessionProfileId) return { allowed: false, reason: 'profile_switched' };
  if (Number.isFinite(expiresAt) && now >= expiresAt) return { allowed: false, reason: 'session_expired' };
  if (sensitiveAction && (!Number.isFinite(reauthAt) || reauthAt < now)) {
    return { allowed: false, reason: 'sensitive_reauth_required' };
  }
  return { allowed: true, decision: 'admin_session_valid' };
}

function failedUnlockAttemptDecision({ failedAttempts, windowLimit = 5 }) {
  const nextAttempts = failedAttempts + 1;
  return {
    allowed: nextAttempts < windowLimit,
    failedAttempts: nextAttempts,
    logResult: 'failed_auth',
    reason: nextAttempts >= windowLimit ? 'rate_limited' : 'incorrect_pin'
  };
}

test('managed child local authority contract is audit-only and source-backed', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const tabView = read('js/tab-view.js');
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Contract\/proof fixture only/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /Who is allowed to enter virtual child edit mode/);
  assert.match(doc, /Required Local Authority Decisions/);
  assert.match(doc, /Hardening Requirements Before Runtime Changes/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));

  assert.match(tabView, /function canActiveProfileManageProfile\(profilesV4, targetProfileId\)/);
  assert.match(tabView, /getProfileType\(profilesV4, currentActive\) === 'child'\) return false/);
  assert.match(tabView, /async function startManagedChildEdit\(profileId, surface\)/);
  assert.match(tabView, /getProfileType\(fresh, targetId\) !== 'child'/);
  assert.match(tabView, /const ok = await ensureProfileUnlocked\(fresh, currentActive\)/);
  assert.match(tabView, /async function saveManagedChildSurface\(surface, mutator\)/);
  assert.match(tabView, /if \(!canActiveProfileManageProfile\(fresh, profileId\)\)/);

  assert.doesNotMatch(source, /localManagedEditPolicyRevisionStore/);
  assert.doesNotMatch(source, /recordManagedChildLocalEditHistory/);
  assert.doesNotMatch(source, /managedChildFailedUnlockLogger/);
  assert.doesNotMatch(source, /managedChildAdminSessionTtl/);
});

test('local managed child authority rejects child admin and sibling edits while allowing parent targets', () => {
  assert.equal(canActiveProfileManageProfile(profilesFixture('default'), 'childA'), true);
  assert.equal(canActiveProfileManageProfile(profilesFixture('parentA'), 'childA'), true);
  assert.equal(canActiveProfileManageProfile(profilesFixture('parentA'), 'childB'), false);
  assert.equal(canActiveProfileManageProfile(profilesFixture('childA'), 'childA'), false);
  assert.equal(canActiveProfileManageProfile(profilesFixture('childA'), 'childB'), false);
  assert.equal(canActiveProfileManageProfile(profilesFixture('parentA'), 'parentA'), true);

  assert.deepEqual(
    startManagedChildEditDecision({ profilesV4: profilesFixture('parentA'), targetProfileId: 'childA' }),
    { allowed: true, decision: 'start_virtual_child_edit' }
  );
  assert.deepEqual(
    startManagedChildEditDecision({ profilesV4: profilesFixture('parentA'), targetProfileId: 'parentA' }),
    { allowed: false, reason: 'target_not_child' }
  );
  assert.deepEqual(
    startManagedChildEditDecision({ profilesV4: profilesFixture('childA'), targetProfileId: 'childA' }),
    { allowed: false, reason: 'not_parent_authority' }
  );
});

test('local managed child edit requires parent unlock and save-time fresh authority recheck', () => {
  const lockedParent = profilesFixture('parentA');
  lockedParent.profiles.parentA.pinVerifier = { salt: 'salt', hash: 'hash' };

  assert.deepEqual(
    startManagedChildEditDecision({ profilesV4: lockedParent, targetProfileId: 'childA' }),
    { allowed: false, reason: 'parent_unlock_required' }
  );
  assert.deepEqual(
    startManagedChildEditDecision({
      profilesV4: lockedParent,
      targetProfileId: 'childA',
      unlockedProfiles: new Set(['parentA'])
    }),
    { allowed: true, decision: 'start_virtual_child_edit' }
  );

  assert.deepEqual(
    saveManagedChildSurfaceDecision({
      freshProfilesV4: profilesFixture('parentA'),
      managedChildEdit: { profileId: 'childA', surface: 'main' }
    }),
    { allowed: true, decision: 'save_child_surface_only' }
  );
  assert.deepEqual(
    saveManagedChildSurfaceDecision({
      freshProfilesV4: profilesFixture('parentB'),
      managedChildEdit: { profileId: 'childA', surface: 'main' }
    }),
    { allowed: false, reason: 'fresh_authority_recheck_failed' }
  );

  const ownershipChanged = profilesFixture('parentA');
  ownershipChanged.profiles.childA.parentProfileId = 'parentB';
  assert.deepEqual(
    saveManagedChildSurfaceDecision({
      freshProfilesV4: ownershipChanged,
      managedChildEdit: { profileId: 'childA', surface: 'kids' }
    }),
    { allowed: false, reason: 'fresh_authority_recheck_failed' }
  );
});

test('future local hardening requires session ttl reauth and failed attempt logging fixtures', () => {
  const doc = read(docPath);

  assert.deepEqual(
    adminSessionDecision({ activeProfileId: 'parentA', sessionProfileId: 'parentA', now: 10, expiresAt: 20 }),
    { allowed: true, decision: 'admin_session_valid' }
  );
  assert.deepEqual(
    adminSessionDecision({ activeProfileId: 'parentB', sessionProfileId: 'parentA', now: 10, expiresAt: 20 }),
    { allowed: false, reason: 'profile_switched' }
  );
  assert.deepEqual(
    adminSessionDecision({ activeProfileId: 'parentA', sessionProfileId: 'parentA', now: 21, expiresAt: 20 }),
    { allowed: false, reason: 'session_expired' }
  );
  assert.deepEqual(
    adminSessionDecision({ activeProfileId: 'parentA', sessionProfileId: 'parentA', now: 10, expiresAt: 20, sensitiveAction: true, reauthAt: 9 }),
    { allowed: false, reason: 'sensitive_reauth_required' }
  );
  assert.deepEqual(
    failedUnlockAttemptDecision({ failedAttempts: 4, windowLimit: 5 }),
    { allowed: false, failedAttempts: 5, logResult: 'failed_auth', reason: 'rate_limited' }
  );

  assert.match(doc, /Admin session authority has TTL and relocks on profile switch/);
  assert.match(doc, /Sensitive actions, including time-limit changes, viewing-space changes,\s+sync-policy changes, trust-link changes, and history clearing, can require\s+re-auth/);
  assert.match(doc, /A failed unlock records a protected action-history row/);
  assert.match(doc, /runtime local managed edit policy revision store: absent/);
  assert.match(doc, /runtime local managed edit action-history writer: absent/);
  assert.match(doc, /runtime local managed edit admin session TTL: absent/);
});
