import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const managedActionHistorySchema = 'filtertube_managed_action_history';

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
  return { allowed: true, decision: 'save_child_surface_with_revision_history' };
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

function buildLocalPolicyHash(prefix, seed) {
  const source = JSON.stringify(seed);
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16)}`;
}

function surfaceSummary(scope, surface) {
  if (scope === 'kids') {
    return {
      redacted: true,
      label: 'Updated Kids rules',
      blockedKeywordCount: Array.isArray(surface.blockedKeywords) ? surface.blockedKeywords.length : 0,
      blockedChannelCount: Array.isArray(surface.blockedChannels) ? surface.blockedChannels.length : 0
    };
  }
  return {
    redacted: true,
    label: 'Updated Main rules',
    keywordCount: Array.isArray(surface.keywords) ? surface.keywords.length : 0,
    channelCount: Array.isArray(surface.channels) ? surface.channels.length : 0
  };
}

function buildManagedChildLocalEditReportFixture({ profile, actorProfileId, actorDeviceId = 'device-1', targetProfileId, scope, surface, now = 1780520400000 }) {
  const prior = profile.managedPolicyState?.localManagedEdits?.[scope] || {};
  const revision = (Number.isInteger(prior.policyRevision) ? prior.policyRevision : 0) + 1;
  const policyHash = buildLocalPolicyHash('local-managed-edit', {
    scope,
    targetProfileId,
    policyRevision: revision,
    surface
  });
  return {
    scope,
    policyState: {
      schema: 'filtertube_managed_local_edit_policy',
      version: 1,
      source: 'local_parent_managed_edit',
      scope,
      targetProfileId,
      actorProfileId,
      actorDeviceId,
      policyRevision: revision,
      policyHash,
      updatedAt: now
    },
    historyRow: {
      rowId: `local-managed-${scope}-${revision}-${now}`,
      schema: managedActionHistorySchema,
      version: 1,
      actorProfileId,
      actorDeviceId,
      targetProfileId,
      trustedLinkId: null,
      actionType: 'local_policy.update',
      scope,
      revision,
      policyHash,
      result: 'accepted',
      reason: null,
      receivedAt: now,
      issuedAt: now,
      orderKey: `${String(revision).padStart(6, '0')}:${now}`,
      summary: surfaceSummary(scope, surface),
      sensitive: true
    }
  };
}

function buildFailedUnlockHistoryRowFixture({ actorProfileId = 'parentA', actorDeviceId = 'device-1', targetProfileId = 'childA', reason = 'managed_child_edit_unlock_failed', now = 1780520500000 } = {}) {
  return {
    rowId: `managed-auth-failed-${targetProfileId}-${now}`,
    schema: managedActionHistorySchema,
    version: 1,
    actorProfileId,
    actorDeviceId,
    targetProfileId,
    trustedLinkId: null,
    actionType: 'admin_session.failed_unlock',
    scope: 'admin_session',
    revision: null,
    policyHash: null,
    result: 'failed_auth',
    reason,
    receivedAt: now,
    issuedAt: now,
    orderKey: `auth:${now}`,
    summary: {
      redacted: true,
      label: 'Parent unlock failed'
    },
    sensitive: true
  };
}

function recordManagedChildLocalEditHistoryFixture(profile, report, limit = 500) {
  const existingRows = Array.isArray(profile.managedActionHistory)
    ? profile.managedActionHistory.filter(row => row?.schema === managedActionHistorySchema)
    : [];
  return {
    ...profile,
    managedPolicyState: {
      ...(profile.managedPolicyState || {}),
      localManagedEdits: {
        ...(profile.managedPolicyState?.localManagedEdits || {}),
        [report.scope]: report.policyState
      }
    },
    managedActionHistory: [...existingRows, report.historyRow].slice(-limit)
  };
}

test('managed child local authority contract is source-backed with accepted-save revision history', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const tabView = read('js/tab-view.js');
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Runtime local managed-save and failed-unlock history hardening\s+partially present/);
  assert.match(doc, /Who is allowed to enter virtual child edit mode/);
  assert.match(doc, /Required Local Authority Decisions/);
  assert.match(doc, /Hardening Requirements/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));

  assert.match(tabView, /function canActiveProfileManageProfile\(profilesV4, targetProfileId\)/);
  assert.match(tabView, /getProfileType\(profilesV4, currentActive\) === 'child'\) return false/);
  assert.match(tabView, /async function startManagedChildEdit\(profileId, surface\)/);
  assert.match(tabView, /getProfileType\(fresh, targetId\) !== 'child'/);
  assert.match(tabView, /const ok = await ensureProfileUnlocked\(fresh, currentActive\)/);
  assert.match(tabView, /async function saveManagedChildSurface\(surface, mutator\)/);
  assert.match(tabView, /if \(!canActiveProfileManageProfile\(fresh, profileId\)\)/);
  assert.match(tabView, /function localManagedEditPolicyRevisionStore\(profile, scope\)/);
  assert.match(tabView, /function buildManagedChildLocalEditReport/);
  assert.match(tabView, /function recordManagedChildLocalEditHistory\(profile, report\)/);
  assert.match(tabView, /async function recordManagedAdminAuthFailureHistory\(profilesV4, targetProfileId, reason = 'unlock_failed'\)/);
  assert.match(tabView, /actionType: 'admin_session\.failed_unlock'/);
  assert.match(tabView, /result: 'failed_auth'/);
  assert.match(tabView, /managed_child_edit_unlock_failed/);
  assert.match(tabView, /history_view_unlock_failed/);
  assert.match(tabView, /history_clear_unlock_failed/);
  assert.match(tabView, /viewing_space_unlock_failed/);
  assert.match(tabView, /time_limit_unlock_failed/);
  assert.match(source, /filtertube_managed_action_history/);

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
    { allowed: true, decision: 'save_child_surface_with_revision_history' }
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

test('local managed child save report increments revision and stores redacted protected history', () => {
  const childProfile = {
    id: 'childA',
    type: 'child',
    parentProfileId: 'parentA',
    managedPolicyState: {
      localManagedEdits: {
        main: {
          schema: 'filtertube_managed_local_edit_policy',
          policyRevision: 2,
          policyHash: 'old-hash'
        }
      }
    },
    managedActionHistory: [
      { schema: managedActionHistorySchema, rowId: 'old-row', result: 'accepted' },
      { schema: 'other_debug_row', rowId: 'drop-me' }
    ]
  };
  const nextSurface = {
    mode: 'blocklist',
    keywords: [{ word: 'shakira' }],
    channels: [{ name: 'Example Channel' }],
    whitelistKeywords: [],
    whitelistChannels: []
  };

  const report = buildManagedChildLocalEditReportFixture({
    profile: childProfile,
    actorProfileId: 'parentA',
    targetProfileId: 'childA',
    scope: 'main',
    surface: nextSurface
  });
  const stored = recordManagedChildLocalEditHistoryFixture(childProfile, report);
  const latest = stored.managedActionHistory.at(-1);

  assert.equal(stored.managedPolicyState.localManagedEdits.main.policyRevision, 3);
  assert.equal(stored.managedPolicyState.localManagedEdits.main.policyHash, latest.policyHash);
  assert.equal(latest.actionType, 'local_policy.update');
  assert.equal(latest.result, 'accepted');
  assert.equal(latest.sensitive, true);
  assert.equal(latest.summary.redacted, true);
  assert.equal(latest.summary.keywordCount, 1);
  assert.equal(latest.summary.channelCount, 1);
  assert.equal(JSON.stringify(latest.summary).includes('shakira'), false);
  assert.equal(JSON.stringify(latest.summary).includes('Example Channel'), false);
  assert.equal(stored.managedActionHistory.length, 2);
});

test('remaining local hardening requires session ttl reauth and failed attempt logging fixtures', () => {
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
  assert.match(doc, /runtime local managed edit policy revision store: present/);
  assert.match(doc, /runtime local managed edit action-history writer: present/);
  assert.match(doc, /runtime local managed edit failed-unlock logger: present for managed child\/history\/viewing-space\/time-limit unlock gates/);
  assert.match(doc, /runtime local managed edit admin session TTL: absent/);
});

test('local managed failed unlock report stores protected redacted failed-auth history without policy authority', () => {
  const row = buildFailedUnlockHistoryRowFixture();

  assert.equal(row.schema, managedActionHistorySchema);
  assert.equal(row.actionType, 'admin_session.failed_unlock');
  assert.equal(row.scope, 'admin_session');
  assert.equal(row.result, 'failed_auth');
  assert.equal(row.reason, 'managed_child_edit_unlock_failed');
  assert.equal(row.revision, null);
  assert.equal(row.policyHash, null);
  assert.equal(row.sensitive, true);
  assert.equal(row.summary.redacted, true);
  assert.equal(JSON.stringify(row.summary).includes('parentA'), false);
  assert.equal(JSON.stringify(row.summary).includes('childA'), false);
});
