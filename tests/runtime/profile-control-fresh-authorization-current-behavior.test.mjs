import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}

function fixture({ kind = 'time', actor = 'parent', locked = true, expired = false,
  pins = [], duringWait, minutes = 30, references = false } = {}) {
  let now = 1_000_000;
  let root = { schemaVersion: 4, activeProfileId: actor, profiles: {
    default: { type: 'account', security: { masterPinVerifier: { synthetic: 'master' } } },
    parent: { type: 'account', security: locked ? { profilePinVerifier: { synthetic: 'parent' } } : {} },
    other: { type: 'account', name: 'Other parent' },
    child: { type: 'child', parentProfileId: 'parent', security: { profilePinVerifier: { synthetic: 'child' } },
      main: { keywords: ['keep'] }, settings: { allowMainViewing: true, allowKidsViewing: true } },
    sibling: { type: 'child', parentProfileId: 'parent', name: 'Sibling' }
  } };
  const calls = { writes: [], pins: [], pushes: [], failedUnlocks: 0, prompts: 0 };
  const context = vm.createContext({ Date: { now: () => now } });
  vm.runInContext(authoritySource, context);
  const authority = context.FilterTubeManagedAdminAuthority;
  const sessions = new Map([['parent', authority.createAdminUnlockSession(now)]]);
  if (expired) sessions.get('parent').expiresAt = now - 1;
  const unlocked = new Set(['parent']);
  const alter = () => duringWait?.(root, { expire: () => { now += 16 * 60 * 1000; }, context });
  Object.assign(context, {
    window: {}, activeProfileId: actor, profilesV4Cache: root,
    ManagedAdminAuthority: authority, profileUnlockSessions: sessions, unlockedProfiles: unlocked,
    sessionMasterPin: '', MANAGED_TIME_LIMIT_SCHEMA: 'filtertube_managed_time_limit',
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null,
    getProfileType: authority.getProfileType,
    clearProfileUnlockSession: { run: id => { sessions.delete(id); unlocked.delete(id); } },
    markProfileUnlockSession: { run: id => { sessions.set(id, authority.createAdminUnlockSession(now)); unlocked.add(id); } },
    syncSessionUnlockStateFromBackground: async () => { if (kind === 'access') alter(); },
    isManagedAdminUnlockRateLimited: () => false,
    getProfileAccessCopy: (_, id) => ({ title: id }),
    showPromptModal: async options => { calls.pins.push(options.title); return pins.shift() ?? null; },
    verifyPin: async (pin, verifier) => pin === 'correct-parent-pin' && verifier.synthetic === 'parent',
    recordManagedAdminUnlockFailure: async () => { calls.failedUnlocks += 1; return { rateLimited: false }; },
    clearManagedAdminUnlockFailures: async () => {}, notifyBackgroundUnlocked: async () => {},
    recordManagedAdminAuthFailureHistory: async () => {},
    UIComponents: { showToast() {} }, tabViewUiText: (_, fallback) => fallback,
    promptManagedDailyTimeLimitMinutes: async () => { calls.prompts += 1; alter(); return minutes; },
    buildManagedTimeLimitLocalEditReport: value => value,
    buildManagedViewingSpaceLocalEditReport: value => value,
    recordManagedChildLocalEditHistory: (profile, report) => ({ ...profile, testActor: report.actorProfileId }),
    refreshProfilesUI: async () => {},
    offerManagedTimeLimitPushForChangedProfiles: async ids => { calls.pushes.push(copy(ids)); },
    offerManagedPolicyPushForChangedProfiles: async ids => { calls.pushes.push(copy(ids)); }
  });
  context.window.FilterTubeIO = {
    loadProfilesV4: async () => references ? root : copy(root),
    saveProfilesV4: async value => { calls.writes.push(copy(value)); root = copy(value); }
  };
  vm.runInContext([
    section('    const isProfileUnlockSessionValid = {', '    function safeObject('),
    section('    function extractMasterPinVerifier(', '    function getProfileName('),
    section('    function getProfileViewingAccess(', '    function managedTimeLimitLabel('),
    section('    function canActiveProfileManageProfile(', '    function clonePlain('),
    section('    async function ensureProfileUnlocked(', '    async function ensureAdminUnlocked('),
    section('    function captureProfileMutationAuthorization(', '    async function updateMultipleProfileViewingAccess('),
    section('    async function updateProfileTimeLimitPolicy(', '    async function updateMultipleProfileTimeLimitPolicies(')
  ].join('\n'), context);
  root.profiles.child.settings.timeLimitPolicy = copy(context.buildManagedTimeLimitPolicy(null, { enabled: true, dailyBudgetSeconds: 7200 }));
  return { calls, context, get root() { return root; },
    run: (action = 'set', patch = { main: false }) => kind === 'time'
      ? context.updateProfileTimeLimitPolicy('child', action)
      : context.updateProfileViewingAccess('child', patch) };
}

for (const kind of ['access', 'time']) {
  test(`${kind}: owning parent saves only requested control and retains rules/sibling`, async () => {
    const f = fixture({ kind });
    await f.run();
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.root.activeProfileId, 'parent');
    assert.equal(f.root.profiles.child.parentProfileId, 'parent');
    assert.equal(f.root.profiles.child.testActor, 'parent');
    assert.deepEqual(f.root.profiles.child.main.keywords, ['keep']);
    assert.ok(f.root.profiles.sibling);
    assert.equal(f.calls.pushes.length, 1);
    if (kind === 'time') assert.equal(f.root.profiles.child.settings.timeLimitPolicy.dailyBudgetSeconds, 1800);
    else assert.equal(f.root.profiles.child.settings.allowMainViewing, false);
  });

  for (const actor of ['child', 'other']) {
    test(`${kind}: ${actor} cannot use the parent's controls`, async () => {
      const f = fixture({ kind, actor });
      await f.run();
      assert.equal(f.calls.writes.length, 0);
      assert.equal(f.calls.pins.length, 0);
    });
  }

  for (const pin of [null, 'wrong-pin']) {
    test(`${kind}: cancelled/wrong parent PIN makes zero control writes`, async () => {
      const f = fixture({ kind, expired: true, pins: [pin] });
      await f.run();
      assert.equal(f.calls.writes.length, 0);
      assert.deepEqual(f.calls.pins, ['parent']);
      assert.equal(f.calls.pushes.length, 0);
    });
  }

  for (const [name, mutate] of [
    ['actor switch', root => { root.activeProfileId = 'child'; }],
    ['reparenting', root => { root.profiles.child.parentProfileId = 'other'; }],
    ['target deletion', root => { delete root.profiles.child; }],
    ['target type change', root => { root.profiles.child.type = 'account'; }],
    ['owner deletion', root => { delete root.profiles.parent; }],
    ['actor PIN change', root => { root.profiles.parent.security.profilePinVerifier = { synthetic: 'replacement' }; }],
    ['target PIN change', root => { root.profiles.child.security.profilePinVerifier = { synthetic: 'replacement' }; }],
    ['sensitive approval expiry', (_, helpers) => { helpers.expire(); }]
  ]) {
    test(`${kind}: ${name} during asynchronous interaction cancels the write`, async () => {
      const f = fixture({ kind, duringWait: mutate });
      await f.run();
      assert.equal(f.calls.writes.length, 0);
      assert.equal(f.calls.pushes.length, 0);
    });
  }

  test(`${kind}: PIN-free parent behavior is preserved`, async () => {
    const f = fixture({ kind, locked: false, expired: true });
    await f.run();
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.calls.pins.length, 0);
  });

  test(`${kind}: latest unrelated profile and target settings survive the save`, async () => {
    const f = fixture({ kind, duringWait: root => {
      root.profiles.sibling.name = 'Changed elsewhere';
      root.profiles.child.settings.concurrentSetting = true;
      root.latestRootMarker = 'keep';
    } });
    await f.run();
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.root.profiles.sibling.name, 'Changed elsewhere');
    assert.equal(f.root.profiles.child.settings.concurrentSetting, true);
    assert.equal(f.root.latestRootMarker, 'keep');
  });

  test(`${kind}: authorization remains pinned when storage returns mutable references`, async () => {
    const f = fixture({ kind, references: true, duringWait: root => { root.profiles.child.parentProfileId = 'other'; } });
    await f.run();
    assert.equal(f.calls.writes.length, 0);
    assert.equal(f.root.profiles.child.parentProfileId, 'other');
  });
}

test('cancelling the time-limit prompt makes zero writes', async () => {
  const f = fixture({ minutes: null });
  await f.run();
  assert.equal(f.calls.writes.length, 0);
});

test('disable preserves latest budget and advances latest policy revision', async () => {
  const f = fixture({ kind: 'access', duringWait: root => {
    root.profiles.child.settings.timeLimitPolicy.dailyBudgetSeconds = 3600;
    root.profiles.child.settings.timeLimitPolicy.policyRevision = 8;
  } });
  await f.context.updateProfileTimeLimitPolicy('child', 'disable');
  assert.equal(f.calls.writes.length, 1);
  const policy = f.root.profiles.child.settings.timeLimitPolicy;
  assert.equal(policy.enabled, false);
  assert.equal(policy.dailyBudgetSeconds, 3600);
  assert.equal(policy.policyRevision, 9);
});

test('latest access state cannot be changed to deny both viewing spaces', async () => {
  const f = fixture({ kind: 'access', duringWait: root => { root.profiles.child.settings.allowKidsViewing = false; } });
  await f.run('set', { main: false });
  assert.equal(f.calls.writes.length, 0);
});
