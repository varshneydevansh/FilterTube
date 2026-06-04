import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const helperPath = 'js/managed_admin_authority.js';
const authorityDocPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadAuthority() {
  const context = {};
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read(helperPath), context, { filename: helperPath });
  return context.FilterTubeManagedAdminAuthority;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function profilesFixture(activeProfileId = 'default') {
  return {
    activeProfileId,
    profiles: {
      default: { id: 'default', type: 'account', name: 'Default' },
      parentA: { id: 'parentA', type: 'account', name: 'Parent A' },
      parentB: { id: 'parentB', type: 'account', name: 'Parent B' },
      childA: { id: 'childA', type: 'child', parentProfileId: 'parentA', name: 'Child A' },
      childB: { id: 'childB', type: 'child', parentProfileId: 'parentB', name: 'Child B' }
    }
  };
}

test('managed admin authority helper is loaded before the dashboard runtime and documented', () => {
  const html = read('html/tab-view.html');
  const tabView = read('js/tab-view.js');
  const doc = read(authorityDocPath);
  const laneConfig = read('scripts/test-lane-config.mjs');

  assert.ok(html.indexOf('../js/managed_admin_authority.js') < html.indexOf('../js/tab-view.js'));
  assert.match(tabView, /const ManagedAdminAuthority = window\.FilterTubeManagedAdminAuthority \|\| null/);
  assert.match(tabView, /ManagedAdminAuthority\.canActorManageProfile/);
  assert.match(tabView, /ManagedAdminAuthority\.checkAdminUnlockSession/);
  assert.match(tabView, /ManagedAdminAuthority\.normalizeFailedUnlockState/);
  assert.match(doc, /js\/managed_admin_authority\.js/);
  assert.match(doc, /shared managed-admin authority helper/);
  assert.match(laneConfig, /managed-admin-authority-runtime/);
});

test('managed admin authority allows master and parent edits but rejects child and sibling authority', () => {
  const Authority = loadAuthority();

  assert.equal(Authority.canActorManageProfile(profilesFixture('default'), { targetProfileId: 'childB' }).allowed, true);
  assert.deepEqual(
    plain(Authority.canActorManageProfile(profilesFixture('parentA'), { targetProfileId: 'childA' })),
    { allowed: true, decision: 'parent_profile_admin', actorProfileId: 'parentA', targetProfileId: 'childA' }
  );
  assert.deepEqual(
    plain(Authority.canActorManageProfile(profilesFixture('parentA'), { targetProfileId: 'childB' })),
    { allowed: false, reason: 'actor_not_target_parent', actorProfileId: 'parentA', targetProfileId: 'childB' }
  );
  assert.deepEqual(
    plain(Authority.canActorManageProfile(profilesFixture('childA'), { targetProfileId: 'childA' })),
    { allowed: false, reason: 'child_actor_not_admin', actorProfileId: 'childA', targetProfileId: 'childA' }
  );
  assert.deepEqual(
    plain(Authority.canActorManageProfile(profilesFixture('parentA'), { targetProfileId: 'parentA' })),
    { allowed: true, decision: 'self_account_admin', actorProfileId: 'parentA', targetProfileId: 'parentA' }
  );
});

test('managed admin session helper enforces TTL and sensitive-action reauth', () => {
  const Authority = loadAuthority();
  const now = 1780610000000;
  const session = Authority.createAdminUnlockSession(now);

  assert.equal(session.schema, 'filtertube_managed_admin_authority');
  assert.equal(session.expiresAt, now + Authority.constants.SESSION_TTL_MS);
  assert.equal(session.reauthAt, now + Authority.constants.SENSITIVE_REAUTH_TTL_MS);

  assert.deepEqual(
    plain(Authority.checkAdminUnlockSession(session, {
      profileId: 'parentA',
      hasUnlockedProfile: true,
      now: now + 1000
    })),
    { valid: true, decision: 'admin_session_valid' }
  );
  assert.deepEqual(
    plain(Authority.checkAdminUnlockSession(session, {
      profileId: 'parentA',
      hasUnlockedProfile: true,
      now: session.expiresAt
    })),
    { valid: false, reason: 'session_expired' }
  );
  assert.deepEqual(
    plain(Authority.checkAdminUnlockSession(session, {
      profileId: 'parentA',
      hasUnlockedProfile: true,
      sensitiveAction: true,
      now: session.reauthAt
    })),
    { valid: false, reason: 'sensitive_reauth_required' }
  );
});

test('managed admin failed unlock helper normalizes windows and marks rate limits', () => {
  const Authority = loadAuthority();
  const now = 1780611000000;

  assert.deepEqual(
    plain(Authority.normalizeFailedUnlockState(null, now)),
    {
      schema: 'filtertube_managed_admin_failed_unlock_rate_limit',
      version: 1,
      failedAttempts: 0,
      resetAt: now + Authority.constants.FAILED_UNLOCK_WINDOW_MS,
      updatedAt: now
    }
  );

  const existing = {
    schema: 'filtertube_managed_admin_failed_unlock_rate_limit',
    version: 1,
    failedAttempts: 4,
    resetAt: now + 5000,
    updatedAt: now - 1000
  };
  assert.deepEqual(
    plain(Authority.nextFailedUnlockState(existing, now)),
    {
      schema: 'filtertube_managed_admin_failed_unlock_rate_limit',
      version: 1,
      failedAttempts: 5,
      resetAt: now + 5000,
      updatedAt: now,
      rateLimited: true
    }
  );
});
