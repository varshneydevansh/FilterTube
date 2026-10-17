import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function fixture({ action = 'rename', actor = 'parent', target = 'child', unlocked = true, confirm = true, afterPrompt, afterUnlock } = {}) {
  let root = { activeProfileId: actor, profiles: {
    default: { type: 'account', name: 'Default' },
    parent: { type: 'account', name: 'Parent' },
    other: { type: 'account', name: 'Other parent' },
    child: { type: 'child', name: 'Child', parentProfileId: 'parent', main: { keywords: ['keep'] } },
    sibling: { type: 'child', name: 'Sibling', parentProfileId: 'parent' }
  } };
  const writes = [], approvals = [], notices = [];
  let sessionValid = true;
  let handler;
  const button = { addEventListener: (_, callback) => { handler = callback; } };
  const context = {
    window: { FilterTubeIO: {
      loadProfilesV4: async () => clone(root),
      saveProfilesV4: async value => { writes.push(clone(value)); root = clone(value); }
    }, confirm: () => { afterPrompt?.(root, () => { sessionValid = false; }); return confirm; } },
    profileId: target, childAdminRestricted: actor === 'child',
    renameBtn: button, deleteBtn: button,
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ''),
    UIComponents: { showToast: (...args) => notices.push(args) },
    getProfileName: (value, id) => value.profiles[id]?.name || id,
    getProfileType: (value, id) => context.FilterTubeManagedAdminAuthority.getProfileType(value, id),
    canActiveProfileManageProfile: (value, id) => context.FilterTubeManagedAdminAuthority.canActorManageProfile(value, { targetProfileId: id }).allowed,
    ensureProfileUnlocked: async (_, id, options) => { approvals.push({ id, options }); afterUnlock?.(root); return unlocked; },
    isProfileLocked: () => true,
    isProfileUnlockSessionValid: { check: () => sessionValid },
    showPromptModal: async () => { afterPrompt?.(root, () => { sessionValid = false; }); return 'Renamed child'; },
    refreshProfilesUI: async () => {},
    clearProfileUnlockSession: { run: () => {} },
    StateManager: { loadSettings: async () => {} },
    applyLockGateIfNeeded: async () => {}
  };
  vm.createContext(context);
  vm.runInContext(authoritySource, context);
  const needle = `            ${action === 'rename' ? 'renameBtn' : 'deleteBtn'}.addEventListener('click', async () => {`;
  const helperStart = source.indexOf('    function captureProfileMutationAuthorization(');
  const helperEnd = source.indexOf('    async function loadAuthorizedProfileMutationRoot(', helperStart);
  context.extractMasterPinVerifier = value => value.profiles.default?.security?.masterPinVerifier || null;
  context.extractProfilePinVerifier = (value, id) => value.profiles[id]?.security?.profilePinVerifier || null;
  vm.runInContext(source.slice(helperStart, helperEnd), context);
  const start = source.indexOf(needle, source.indexOf('function renderProfilesManager('));
  assert.ok(start >= 0);
  const end = source.indexOf('\n            });', start) + '\n            });'.length;
  vm.runInContext(source.slice(start, end), context);
  return { run: () => handler(), writes, approvals, notices, root: () => root };
}

test('an owning parent renames its child without switching into the child or losing sibling data', async () => {
  const f = fixture({ afterPrompt: root => { root.profiles.sibling.name = 'Latest sibling name'; } });
  await f.run();
  assert.equal(f.writes.length, 1);
  assert.equal(f.root().profiles.child.name, 'Renamed child');
  assert.equal(f.root().profiles.child.main.keywords[0], 'keep');
  assert.equal(f.root().profiles.sibling.name, 'Latest sibling name');
  assert.equal(f.approvals[0].id, 'parent');
  assert.equal(f.approvals[0].options.sensitiveAction, true);
});

test('an owning parent can delete only its selected child; Default remains and sibling survives', async () => {
  const f = fixture({ action: 'delete' });
  await f.run();
  assert.equal(f.writes.length, 1);
  assert.equal(f.root().profiles.child, undefined);
  assert.ok(f.root().profiles.default);
  assert.ok(f.root().profiles.sibling);
  assert.equal(f.root().activeProfileId, 'parent');
  assert.equal(f.approvals[0].id, 'parent');
});

for (const action of ['rename', 'delete']) {
  for (const actor of ['child', 'other']) {
    test(`${actor} cannot ${action} another parent's child`, async () => {
      const f = fixture({ action, actor });
      await f.run();
      assert.equal(f.writes.length, 0);
      assert.equal(f.approvals.length, 0);
    });
  }
  test(`cancelled parent approval prevents ${action}`, async () => {
    const f = fixture({ action, unlocked: false });
    await f.run();
    assert.equal(f.writes.length, 0);
  });
  for (const [name, mutate] of [
    ['actor changed', root => { root.activeProfileId = 'other'; }],
    ['ownership changed', root => { root.profiles.child.parentProfileId = 'other'; }],
    ['target deleted', root => { delete root.profiles.child; }],
    ['approval expired', (_, expire) => expire()],
    ['parent PIN changed', root => { root.profiles.parent.security = { profilePinVerifier: { hash: 'changed' } }; }],
    ['target PIN changed', root => { root.profiles.child.security = { profilePinVerifier: { hash: 'changed' } }; }]
  ]) {
    test(`${action} rechecks ${name} after the prompt`, async () => {
      const f = fixture({ action, afterPrompt: mutate });
      await f.run();
      assert.equal(f.writes.length, 0);
    });
  }
}

test('account deletion preserves children with explicit and inferred child types', async () => {
  for (const inferred of [false, true]) {
    const f = fixture({ action: 'delete', actor: 'default', target: 'parent', afterUnlock: root => {
      if (inferred) delete root.profiles.child.type;
    } });
    await f.run();
    assert.equal(f.writes.length, 0);
    assert.ok(f.root().profiles.parent);
    assert.ok(f.notices.some(([message]) => message.includes('Child')));
  }
});

test('a child created while deleting an account cancels the write', async () => {
  const f = fixture({ action: 'delete', actor: 'default', target: 'other', afterPrompt: root => {
    root.profiles.newChild = { parentProfileId: 'other', name: 'New child' };
  } });
  await f.run();
  assert.equal(f.writes.length, 0);
  assert.ok(f.root().profiles.other);
});

test('Default cannot be deleted and cancelled confirmation has no writes', async () => {
  for (const options of [{ target: 'default', actor: 'default' }, { confirm: false }]) {
    const f = fixture({ action: 'delete', ...options });
    await f.run();
    assert.equal(f.writes.length, 0);
  }
});
