import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
function actualFunction(name) {
  const start = source.search(new RegExp(`^    (?:async )?function ${name}\\(`, 'm'));
  const end = source.indexOf('\n    }', start) + '\n    }'.length;
  assert.ok(start > 0 && end > start);
  return source.slice(start, end);
}
function fixture({ access, actor = 'parent', unlocked = true } = {}) {
  const calls = []; const auth = []; const toasts = [];
  const root = { schemaVersion: 4, activeProfileId: actor, profiles: {
    default: { type: 'account' }, parent: { type: 'account' }, other: { type: 'account' },
    child: { type: 'child', parentProfileId: 'parent', settings: access || {} }
  } };
  const context = {
    activeProfileId: actor, managedChildEdit: null, profilesV4Cache: null,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    tabViewUiText: (_, fallback) => fallback,
    getProfileType: (profiles, id) => id === 'default' ? 'account' : profiles.profiles[id]?.type || 'account',
    ensureProfileUnlocked: async (profiles, id, options) => { auth.push({ profiles, id, sensitiveAction: options.sensitiveAction }); return unlocked; },
    recordManagedAdminAuthFailureHistory: async (_, id, reason) => { calls.push(['auth-failure', id, reason]); },
    UIComponents: { showToast: (message, type) => { toasts.push({ message, type }); } },
    buildManagedChildState: surface => { calls.push(['build-controls', surface]); return {
      contentFilters: { main: true }, categoryFilters: { main: true }, languageFilters: { main: true },
      kids: { contentFilters: { kids: true }, categoryFilters: { kids: true } }
    }; },
    window: { FilterTubeIO: { loadProfilesV4: async () => root },
      switchView: view => { calls.push(['view', view]); },
      __filtertubeApplyMainContentControls: (...args) => { calls.push(['apply-main', ...args.map(value => ({ ...value }))]); },
      __filtertubeApplyKidsContentControls: (...args) => { calls.push(['apply-kids', ...args.map(value => ({ ...value }))]); }
    }
  };
  for (const name of ['renderManagedChildEditorBanner', 'renderKeywords', 'renderChannels', 'renderKidsKeywords', 'renderKidsChannels', 'renderListModeControls', 'updateCheckboxes']) {
    context[name] = () => { calls.push([name]); };
  }
  vm.runInNewContext(authoritySource, context);
  context.ManagedAdminAuthority = context.FilterTubeManagedAdminAuthority;
  vm.runInNewContext(['getProfileViewingAccess', 'canActiveProfileManageProfile', 'startManagedChildEdit'].map(actualFunction).join('\n'), context);
  return { root, context, calls, auth, toasts, start: surface => context.startManagedChildEdit('child', surface) };
}

for (const [description, settings, surface, expectedView] of [
  ['implicit Kids-only', { allowMainViewing: false, allowKidsViewing: true }, undefined, 'kids'],
  ['implicit Main-only', { allowMainViewing: true, allowKidsViewing: false }, undefined, 'filters'],
  ['implicit both enabled', { allowMainViewing: true, allowKidsViewing: true }, undefined, 'filters'],
  ['implicit default viewing access', {}, undefined, 'filters'],
  ['explicit Main on Kids-only child', { allowMainViewing: false, allowKidsViewing: true }, 'main', 'filters'],
  ['explicit Kids on Main-only child', { allowMainViewing: true, allowKidsViewing: false }, 'kids', 'kids'],
  ['explicit Main with default access', {}, 'main', 'filters'],
  ['explicit Kids with default access', {}, 'kids', 'kids'],
  ['implicit both viewing spaces denied', { allowMainViewing: false, allowKidsViewing: false }, undefined, 'filters']
]) {
  test(`${description} opens ${expectedView} without changing edit scope or control initialization`, async () => {
    const f = fixture({ access: settings }); await f.start(surface);
    assert.deepEqual(f.calls.at(-1), ['view', expectedView]);
    assert.deepEqual({ ...f.context.managedChildEdit }, surface ? { profileId: 'child', surface } : { profileId: 'child' });
    assert.equal(f.context.profilesV4Cache, f.root);
    assert.equal(f.root.activeProfileId, 'parent');
    assert.equal(f.auth.length, 1); assert.equal(f.auth[0].id, 'parent'); assert.equal(f.auth[0].sensitiveAction, true);
    assert.deepEqual(f.calls.find(call => call[0] === 'build-controls'), ['build-controls', surface || '']);
    assert.ok(f.calls.some(call => call[0] === (surface === 'kids' ? 'apply-kids' : 'apply-main')));
    assert.deepEqual(f.calls.slice(0, 7).map(call => call[0]), [
      'renderManagedChildEditorBanner', 'renderKeywords', 'renderChannels', 'renderKidsKeywords', 'renderKidsChannels', 'renderListModeControls', 'updateCheckboxes'
    ]);
    assert.equal(f.toasts.length, 0);
  });
}

test('denied parent unlock leaves editing and navigation untouched and records the existing failure', async () => {
  const f = fixture({ access: { allowMainViewing: false, allowKidsViewing: true }, unlocked: false });
  await f.start();
  assert.equal(f.context.managedChildEdit, null); assert.equal(f.context.profilesV4Cache, null);
  assert.deepEqual(f.calls, [['auth-failure', 'child', 'managed_child_edit_unlock_failed']]);
});

test('another parent or the child cannot navigate into managed editing', async () => {
  for (const actor of ['other', 'child']) {
    const f = fixture({ actor }); await f.start('kids');
    assert.equal(f.auth.length, 0); assert.deepEqual(f.calls, []);
    assert.equal(f.context.managedChildEdit, null); assert.equal(f.toasts[0].type, 'error');
  }
});

test('Master can open a managed child’s filters but the Default target itself stays invalid', async () => {
  const f = fixture({ actor: 'default' }); await f.start();
  assert.deepEqual(f.calls.at(-1), ['view', 'filters']); assert.equal(f.auth[0].id, 'default');
  const denied = fixture(); await denied.context.startManagedChildEdit('default');
  assert.equal(denied.auth.length, 0); assert.deepEqual(denied.calls, []);
  assert.equal(denied.context.managedChildEdit, null); assert.equal(denied.toasts[0].type, 'error');
});
