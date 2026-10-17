import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const tabSource = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function section(start, end) {
  const first = tabSource.indexOf(start), last = tabSource.indexOf(end, first);
  assert.ok(first >= 0 && last > first, start);
  return tabSource.slice(first, last);
}
function fixture({ actor = 'parent-a', locked = true, session = 'valid', pins = [] } = {}) {
  let now = 1_000_000;
  let root = { schemaVersion: 4, activeProfileId: actor, profiles: {
    default: { type: 'account', settings: {}, main: { keywords: [] } },
    'parent-a': { type: 'account', security: locked ? { profilePinVerifier: { synthetic: true } } : {}, main: { keywords: [] } },
    'parent-b': { type: 'account', main: { keywords: [] } },
    child: { type: 'child', parentProfileId: 'parent-a', settings: { contentFilters: { hide: false } }, main: { keywords: [{ word: 'old', dateFilter: { after: '2026-01-01' } }] }, kids: { blockedKeywords: [] } }
  } };
  const calls = { writes: [], prompts: [], failures: 0, refreshes: 0, reports: [] };
  const context = vm.createContext({ Date: { now: () => now } });
  vm.runInContext(authoritySource, context);
  const authority = context.FilterTubeManagedAdminAuthority;
  const sessions = new Map([['parent-a', authority.createAdminUnlockSession(now)]]);
  if (session === 'expired') sessions.get('parent-a').expiresAt = now - 1;
  if (session === 'sensitive-expired') sessions.get('parent-a').reauthAt = now - 1;
  const unlocked = new Set(['parent-a']);
  Object.assign(context, {
    window: {}, managedChildEdit: { profileId: 'child', surface: 'main' }, activeProfileId: actor,
    profilesV4Cache: root, sessionMasterPin: '', ManagedAdminAuthority: authority,
    profileUnlockSessions: sessions, unlockedProfiles: unlocked,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getProfileType: authority.getProfileType,
    clearProfileUnlockSession: { run: id => { sessions.delete(id); unlocked.delete(id); } },
    markProfileUnlockSession: { run: id => { sessions.set(id, authority.createAdminUnlockSession(now)); unlocked.add(id); } },
    syncSessionUnlockStateFromBackground: async () => {},
    isManagedAdminUnlockRateLimited: () => false,
    getProfileAccessCopy: (_, id) => ({ title: id }),
    showPromptModal: async options => { calls.prompts.push(options.title); return pins.shift() ?? null; },
    verifyPin: async pin => pin === 'correct-parent-pin',
    recordManagedAdminUnlockFailure: async () => { calls.failures += 1; return { rateLimited: false }; },
    clearManagedAdminUnlockFailures: async () => {}, notifyBackgroundUnlocked: async () => {},
    UIComponents: { showToast() {} }, tabViewUiText: (_, fallback) => fallback,
    buildManagedChildLocalEditReport: report => { calls.reports.push(plain(report)); return report; },
    recordManagedChildLocalEditHistory: (profile, report) => ({ ...profile, testLastActor: report.actorProfileId }),
    StateManager: { loadSettings: async () => { calls.refreshes += 1; } }
  });
  context.window.FilterTubeIO = {
    // Deliberately return stored references: denied mutators must still be detached.
    loadProfilesV4: async () => root,
    saveProfilesV4: async next => { calls.writes.push(plain(next)); root = next; }
  };
  for (const name of ['renderProfilesManager', 'renderManagedChildEditorBanner', 'renderKeywords', 'renderChannels', 'renderKidsKeywords', 'renderKidsChannels', 'renderListModeControls', 'updateCheckboxes', 'updateStats']) context[name] = () => {};
  vm.runInContext([
    section('    const isProfileUnlockSessionValid = {', '    function safeObject('),
    section('    function extractMasterPinVerifier(', '    function getProfileName('),
    section('    function canActiveProfileManageProfile(', '    function normalizeProfileKeyword('),
    section('    function getProfileSurface(', '    function localManagedPolicyRevisionStore('),
    section('    async function ensureProfileUnlocked(', '    async function ensureAdminUnlocked('),
    section('    async function saveManagedChildSurface(', '    try {\n        window.__filtertubeIsManagedChildEditFor')
  ].join('\n'), context);
  return {
    context, calls, authority, sessions, get root() { return root; },
    advance: milliseconds => { now += milliseconds; },
    run: (mutator = async surface => { surface.keywords.push({ word: 'new' }); }, surface = 'main') => context.saveManagedChildSurface(surface, mutator)
  };
}

test('an expired unlock cannot save or run the mutator when parent reauthentication is cancelled', async () => {
  const f = fixture({ session: 'expired' });
  let mutations = 0;
  assert.equal(await f.run(async () => { mutations += 1; }), false);
  assert.equal(mutations, 0);
  assert.deepEqual(f.calls.prompts, ['parent-a']);
  assert.equal(f.calls.writes.length, 0);
});

test('expired and sensitive-expired sessions renew through parent authentication before saving', async () => {
  for (const session of ['expired', 'sensitive-expired']) {
    const f = fixture({ session, pins: ['correct-parent-pin'] });
    assert.equal(await f.run(), true);
    assert.deepEqual(f.calls.prompts, ['parent-a']);
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.root.profiles.child.testLastActor, 'parent-a');
    assert.deepEqual(Array.from(f.root.profiles.child.main.keywords, row => row.word), ['old', 'new']);
  }
});

test('wrong parent PIN refuses the save with zero profile writes', async () => {
  const f = fixture({ session: 'expired', pins: ['wrong-pin'] });
  assert.equal(await f.run(), false);
  assert.equal(f.calls.failures, 1);
  assert.equal(f.calls.writes.length, 0);
});

test('expiry during an awaited mutator requires fresh approval and cannot leak nested edits on denial', async () => {
  const f = fixture();
  assert.equal(await f.run(async (surface, profile) => {
    surface.keywords[0].dateFilter.after = '2026-10-17';
    profile.settings.contentFilters.hide = true;
    await Promise.resolve();
    f.advance(16 * 60 * 1000);
  }), false);
  assert.deepEqual(f.calls.prompts, ['parent-a']);
  assert.equal(f.calls.writes.length, 0);
  assert.equal(f.root.profiles.child.main.keywords[0].dateFilter.after, '2026-01-01');
  assert.equal(f.root.profiles.child.settings.contentFilters.hide, false);
});

test('expiry during a mutator can be reauthorized without changing the saved actor or target', async () => {
  const f = fixture({ pins: ['correct-parent-pin'] });
  assert.equal(await f.run(async surface => {
    surface.keywords.push({ word: 'approved' });
    f.advance(16 * 60 * 1000);
  }), true);
  assert.equal(f.calls.writes.length, 1);
  assert.equal(f.root.profiles.child.testLastActor, 'parent-a');
});

for (const actor of ['child', 'parent-b', 'default']) {
  test(`switching to ${actor} while mutation awaits cancels the pending save`, async () => {
    const f = fixture();
    assert.equal(await f.run(async surface => {
      surface.keywords.push({ word: 'discarded' });
      await Promise.resolve();
      f.root.activeProfileId = actor;
    }), false);
    assert.equal(f.calls.writes.length, 0);
    assert.equal(f.root.activeProfileId, actor);
  });
}

for (const change of [
  f => { f.root.profiles.child.parentProfileId = 'parent-b'; },
  f => { delete f.root.profiles.child; },
  f => { f.root.profiles.child.type = 'account'; },
  f => { f.context.managedChildEdit = null; },
  f => { f.context.managedChildEdit = { profileId: 'child', surface: 'main' }; }
]) {
  test('ownership, target type/existence, or edit-scope changes invalidate pending mutation', async () => {
    const f = fixture();
    assert.equal(await f.run(async () => { await Promise.resolve(); change(f); }), false);
    assert.equal(f.calls.writes.length, 0);
  });
}

test('parent authorization cannot be reused if the actor switches during the PIN prompt', async () => {
  const f = fixture({ session: 'expired' });
  f.context.showPromptModal = async () => { f.root.activeProfileId = 'parent-b'; return 'correct-parent-pin'; };
  assert.equal(await f.run(), false);
  assert.equal(f.calls.writes.length, 0);
});

test('expiry during the final fresh read is rejected before writing', async () => {
  const f = fixture();
  const load = f.context.window.FilterTubeIO.loadProfilesV4;
  let reads = 0;
  f.context.window.FilterTubeIO.loadProfilesV4 = async () => {
    reads += 1;
    if (reads === 4) f.advance(16 * 60 * 1000);
    return load();
  };
  assert.equal(await f.run(), false);
  assert.equal(f.calls.writes.length, 0);
});

test('a PIN-free parent account retains its current save behavior', async () => {
  const f = fixture({ locked: false, session: 'expired' });
  assert.equal(await f.run(), true);
  assert.equal(f.calls.prompts.length, 0);
  assert.equal(f.calls.writes.length, 1);
});

test('fresh unrelated profile changes survive a managed child save', async () => {
  const f = fixture();
  assert.equal(await f.run(async surface => {
    surface.keywords.push({ word: 'new' });
    f.root.profiles['parent-b'].name = 'Updated elsewhere';
  }), true);
  assert.equal(f.root.profiles['parent-b'].name, 'Updated elsewhere');
});

test('concurrent target edits are preserved rather than overwritten by stale pending changes', async () => {
  const f = fixture();
  assert.equal(await f.run(async surface => {
    surface.keywords.push({ word: 'stale-local' });
    f.root.profiles.child.main.keywords.push({ word: 'other-writer' });
  }), false);
  assert.equal(f.calls.writes.length, 0);
  assert.deepEqual(f.root.profiles.child.main.keywords.map(row => row.word), ['old', 'other-writer']);
});

test('mutator cancellation does not mutate cached profile settings or nested rule objects', async () => {
  const f = fixture();
  assert.equal(await f.run(async (surface, profile) => {
    surface.keywords[0].dateFilter.after = 'discarded';
    profile.settings.contentFilters.hide = true;
    return false;
  }), false);
  assert.equal(f.calls.writes.length, 0);
  assert.equal(f.root.profiles.child.main.keywords[0].dateFilter.after, '2026-01-01');
  assert.equal(f.root.profiles.child.settings.contentFilters.hide, false);
});

test('a child actor with its own switching session is not a parent administrator', async () => {
  const f = fixture({ actor: 'child' });
  f.sessions.set('child', f.authority.createAdminUnlockSession(1_000_000));
  f.context.unlockedProfiles.add('child');
  assert.equal(await f.run(), false);
  assert.equal(f.calls.prompts.length, 0);
  assert.equal(f.calls.writes.length, 0);
});

test('Main profile settings and Kids rules still save through the same scoped contract', async () => {
  const main = fixture();
  assert.equal(await main.run(async (_, profile) => { profile.settings.contentFilters.hide = true; }), true);
  assert.equal(main.root.profiles.child.settings.contentFilters.hide, true);
  const kids = fixture();
  kids.context.managedChildEdit.surface = 'kids';
  assert.equal(await kids.run(async surface => { surface.blockedKeywords.push({ word: 'kids-rule' }); }, 'kids'), true);
  assert.equal(kids.root.profiles.child.kids.blockedKeywords[0].word, 'kids-rule');
  assert.equal(kids.root.profiles.child.main.keywords[0].word, 'old');
});

for (const change of [
  f => { delete f.root.profiles['parent-a']; },
  f => { f.root.profiles['parent-a'].type = 'child'; f.root.profiles['parent-a'].parentProfileId = 'default'; }
]) {
  test('even Master cancels if the target owner disappears or ceases to be an adult account', async () => {
    const f = fixture({ actor: 'default', locked: false });
    assert.equal(await f.run(async () => { change(f); }), false);
    assert.equal(f.calls.writes.length, 0);
  });
}

test('a scoped rule mutator cannot change protected-profile ownership or type', async () => {
  for (const mutate of [
    profile => { profile.parentProfileId = 'parent-b'; },
    profile => { profile.type = 'account'; }
  ]) {
    const f = fixture();
    assert.equal(await f.run(async (_, profile) => { mutate(profile); }), false);
    assert.equal(f.calls.writes.length, 0);
    assert.equal(f.root.profiles.child.parentProfileId, 'parent-a');
    assert.equal(f.root.profiles.child.type, 'child');
  }
});
