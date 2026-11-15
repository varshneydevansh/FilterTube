import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
const commandCenterSource = fs.readFileSync(new URL('../../js/managed_parent_command_center.js', import.meta.url), 'utf8');
function productionFunction(name) {
  const start = source.search(new RegExp(`^    (?:async )?function ${name}\\(`, 'm'));
  assert.ok(start > 0, `${name} exists`);
  const next = source.slice(start + 1).search(/\n    (?:async )?function /);
  assert.ok(next > 0, `${name} has a bounded extraction`);
  return source.slice(start, start + 1 + next);
}
function nodes(element) { return [element, ...element.children.flatMap(nodes)]; }
function element(tag) {
  const listeners = new Map();
  const node = {
    tagName: tag.toUpperCase(), children: [], dataset: {}, className: '', parentElement: null,
    style: { setProperty() {} }, disabled: false, open: false,
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
    append(...children) { children.forEach(child => this.appendChild(child)); },
    prepend(...children) { children.forEach(child => { child.parentElement = this; }); this.children.unshift(...children); },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, listener) { listeners.set(name, listener); },
    click() { if (!this.disabled) return listeners.get('click')?.({ preventDefault() {} }); },
    querySelectorAll(selector) {
      assert.equal(selector, 'details[data-profile-options-id][open]', 'fixture only implements the production query');
      return nodes(this).slice(1).filter(child => child.tagName === 'DETAILS' && child.dataset.profileOptionsId !== undefined && child.open);
    },
    querySelector(selector) {
      assert.equal(selector, 'details[data-family-profile-tools]', 'fixture only implements the production query');
      return nodes(this).slice(1).find(child => child.tagName === 'DETAILS' && child.dataset.familyProfileTools !== undefined) || null;
    }
  };
  node.classList = { toggle(name, force) {
    const classes = new Set(node.className.split(' ').filter(Boolean));
    if (force) classes.add(name); else classes.delete(name);
    node.className = [...classes].join(' ');
  } };
  Object.defineProperty(node, 'textContent', { get() { return this.ownText || ''; }, set(value) { this.ownText = value; } });
  Object.defineProperty(node, 'innerHTML', { set(value) {
    assert.equal(value, '', 'render clears existing tree');
    this.children.forEach(child => { child.parentElement = null; }); this.children = [];
  } });
  return node;
}
function fixture(actor = 'parent-a', { withFamilyTools = false } = {}) {
  const pin = { kdf: 'PBKDF2', hash: 'fixture' };
  const profilesV4 = { schemaVersion: 4, activeProfileId: actor, profiles: {
    default: { type: 'account', name: 'Master' },
    'default-child': { type: 'child', parentProfileId: 'default', name: 'Default child', settings: {} },
    'parent-b': { type: 'account', name: 'Parent B', settings: {} },
    'child-b': { type: 'child', parentProfileId: 'parent-b', name: 'B child', settings: {} },
    'parent-a': { type: 'account', name: 'Parent A', settings: {} },
    'child-a2': { type: 'child', parentProfileId: 'parent-a', name: 'A second', settings: {} },
    'child-a1': { type: 'child', parentProfileId: 'parent-a', name: 'A first', security: { profilePinVerifier: pin }, settings: {
      allowMainViewing: false, allowKidsViewing: true, timeLimitPolicy: { enabled: true }
    } }
  } };
  const calls = []; const renderedPanels = [];
  const container = element('div');
  const context = {
    document: { createElement: element }, window: {}, ftProfilesManager: container, activeProfileId: actor, ftProfileSelector: null,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')),
    getProfileColors: () => ({}),
    isChildProfileAdminSurface: () => context.getProfileType(profilesV4, actor) === 'child',
    viewingAccessLabel: () => 'Main and Kids', managedTimeLimitLabel: profile => profile.settings?.timeLimitPolicy?.enabled ? '1h/day' : 'Off',
    getManagedTimeLimitPolicy: profile => profile.settings?.timeLimitPolicy || null,
    buildManagedProfileStatusText: () => '',
    summarizeManagedPolicyStateForProfile: () => ({ localLabels: [], remoteScopeCount: 0, historyRowCount: 0, protectedRowCount: 0 }),
    getManagedSyncTargetSummary: () => ({ targetCount: 0, readyCount: 0, totalCount: 0, openCheckCount: 0, revokedCount: 0, staleCount: 0 }),
    summarizeManagedMailboxServerConfig: () => ({ configured: false }),
    summarizeManagedLocalNetworkProviderConfig: () => ({ configured: false }),
    switchToProfile: async id => { calls.push(['switch', id]); },
    startManagedChildEdit: async id => { calls.push(['edit', id]); },
    showManagedActionHistory: async id => { calls.push(['history', id]); },
    updateProfileViewingAccess: async (id, access) => { calls.push(['access', id, { ...access }]); },
    updateProfileTimeLimitPolicy: async (id, action) => { calls.push(['limit', id, action]); },
    updateMultipleProfileTimeLimitPolicies: async (ids, action) => { calls.push(['bulk-limit', Array.from(ids), action]); }
  };
  vm.runInNewContext(authoritySource, context);
  context.ManagedAdminAuthority = context.FilterTubeManagedAdminAuthority;
  if (withFamilyTools) {
    vm.runInNewContext(commandCenterSource, context);
    context.window.FilterTubeManagedParentCommandCenter = { render(...args) {
      const panel = context.FilterTubeManagedParentCommandCenter.render(...args);
      renderedPanels.push(panel);
      return panel;
    } };
  }
  vm.runInNewContext([
    'extractMasterPinVerifier', 'extractProfilePinVerifier', 'isProfileLocked', 'getProfileName', 'getProfileType', 'getParentAccountId',
    'getSortedIdsByName', 'getAccountIds', 'getChildrenForAccount', 'buildProfileLabel', 'buildProfileSubtitle', 'getProfileInitial',
    'renderTabProfileAvatar', 'getProfileViewingAccess', 'canActiveProfileManageProfile', 'renderProfilesManager', 'renderProfilesEmptyState'
  ].map(productionFunction).join('\n'), context);
  const render = () => context.renderProfilesManager(profilesV4);
  const options = id => nodes(container).find(node => node.tagName === 'DETAILS' && node.dataset.profileOptionsId === id);
  const row = id => options(id)?.parentElement?.parentElement;
  const button = (id, label) => nodes(row(id)).find(node => node.tagName === 'BUTTON' && node.textContent === label);
  const familyTools = () => container.querySelector('details[data-family-profile-tools]');
  return { profilesV4, calls, container, render, options, row, button, familyTools, renderedPanels };
}
function under(node, ancestor) {
  for (let current = node; current; current = current.parentElement) if (current === ancestor) return true;
  return false;
}

test('real profile rendering preserves every account and its children in separate sorted groups', () => {
  const f = fixture(); assert.doesNotThrow(f.render);
  const groups = [];
  for (const child of f.container.children) {
    if (child.className.includes('ft-profile-group-header')) groups.push({ title: child.children[0].textContent, ids: [] });
    if (child.className.split(' ').includes('ft-profile-row')) groups.at(-1).ids.push(nodes(child).find(node => node.tagName === 'DETAILS').dataset.profileOptionsId);
  }
  assert.deepEqual(groups, [
    { title: 'Account: Master', ids: ['default', 'default-child'] },
    { title: 'Account: Parent A', ids: ['parent-a', 'child-a1', 'child-a2'] },
    { title: 'Account: Parent B', ids: ['parent-b', 'child-b'] }
  ]);
});

test('profile options retain rename, deletion, access, limits, history and PIN capabilities in the DOM', () => {
  const f = fixture(); f.render();
  const detail = f.options('child-a1');
  assert.equal(detail.open, false);
  assert.equal(detail.children[0].tagName, 'SUMMARY');
  assert.equal(detail.children[0].textContent, 'Profile options');
  const controls = nodes(detail).filter(node => node.tagName === 'BUTTON');
  assert.deepEqual(controls.map(node => node.textContent), [
    'Rename', 'Avatar', 'Delete', 'Main blocked', 'Kids allowed', 'Change limit', 'Disable limit', 'History', 'Change PIN', 'Remove PIN'
  ]);
  assert.ok(controls.every(node => !node.hidden), 'details disclosure retains controls rather than removing capabilities');
  assert.ok(f.button('child-a2', 'Set limit'));
  assert.ok(f.button('child-a2', 'Set PIN'));
  assert.equal(f.button('child-a2', 'Remove PIN').disabled, true);
});

test('Switch and Edit Rules stay outside options and dispatch the selected profile', async () => {
  const f = fixture(); f.render();
  const detail = f.options('child-a1');
  const switchButton = f.button('child-a1', 'Switch'); const edit = f.button('child-a1', 'Edit Rules');
  assert.equal(under(switchButton, detail), false);
  assert.equal(under(edit, detail), false);
  await switchButton.click(); await edit.click();
  assert.deepEqual(f.calls, [['switch', 'child-a1'], ['edit', 'child-a1']]);
  assert.equal(f.button('parent-a', 'Active').disabled, true);
});

test('real authority disables another parent’s rename/delete while retaining owner and Master management', () => {
  const parent = fixture(); parent.render();
  for (const id of ['parent-b', 'child-b', 'default', 'default-child']) {
    assert.equal(parent.button(id, 'Rename').disabled, true, `${id} rename`);
    assert.equal(parent.button(id, 'Delete').disabled, true, `${id} delete`);
  }
  assert.equal(parent.button('child-a1', 'Rename').disabled, false);
  assert.equal(parent.button('child-a1', 'Delete').disabled, false);
  assert.equal(parent.button('child-b', 'Edit Rules'), undefined);
  const master = fixture('default'); master.render();
  assert.equal(master.button('child-b', 'Rename').disabled, false);
  assert.equal(master.button('child-b', 'Delete').disabled, false);
  assert.equal(master.button('default', 'Delete').disabled, true);
});

test('a child retains profile navigation and visible options but cannot administer profiles', () => {
  const f = fixture('child-a1'); f.render();
  for (const id of Object.keys(f.profilesV4.profiles)) {
    assert.equal(f.button(id, 'Rename').disabled, true);
    assert.equal(f.button(id, 'Delete').disabled, true);
    assert.equal(f.button(id, 'Edit Rules'), undefined);
  }
  assert.equal(f.button('parent-a', 'Switch').disabled, false);
  assert.equal(f.button('child-a1', 'Active').disabled, true);
  for (const label of ['Main blocked', 'Kids allowed', 'Change limit', 'Disable limit', 'Change PIN', 'Remove PIN']) {
    assert.equal(f.button('child-a1', label).disabled, true, label);
  }
});

test('each profile keeps its own open options state across rerenders and new profiles start collapsed', () => {
  const f = fixture(); f.render();
  f.options('child-a1').open = true; f.options('parent-b').open = true;
  f.profilesV4.profiles['child-a3'] = { type: 'child', parentProfileId: 'parent-a', name: 'A third', settings: {} };
  f.render();
  for (const id of Object.keys(f.profilesV4.profiles)) assert.equal(f.options(id).open, ['child-a1', 'parent-b'].includes(id), id);
  f.options('child-a1').open = false; f.render();
  assert.equal(f.options('child-a1').open, false);
  assert.equal(f.options('parent-b').open, true);
});

test('disclosed secondary controls retain their target and existing action behavior', async () => {
  const f = fixture(); f.render(); f.options('child-a1').open = true;
  for (const label of ['History', 'Main blocked', 'Kids allowed', 'Change limit', 'Disable limit']) await f.button('child-a1', label).click();
  assert.deepEqual(f.calls, [
    ['history', 'child-a1'], ['access', 'child-a1', { main: true }], ['access', 'child-a1', { kids: false }],
    ['limit', 'child-a1', 'set'], ['limit', 'child-a1', 'disable']
  ]);
});

test('family tools start collapsed after the profile rows and retain the actual command center tree', () => {
  const f = fixture('parent-a', { withFamilyTools: true }); f.render();
  const tools = f.familyTools();
  assert.ok(tools);
  assert.equal(tools.open, false);
  assert.equal(tools.children[0].tagName, 'SUMMARY');
  assert.equal(tools.children[0].textContent, 'Family tools and bulk actions');
  assert.equal(f.container.children.at(-1), tools, 'the initial profile choices precede family tools');
  assert.equal(tools.children[1], f.renderedPanels[0], 'wrapper retains the production renderer’s returned node');
  assert.ok(nodes(tools).some(node => node.dataset.filtertubeManagedAction === 'edit_rules'));
  assert.ok(nodes(tools).some(node => node.dataset.filtertubeBulkAction === 'bulk_set_time_limit'));
  assert.equal(nodes(tools).filter(node => node.className.split(' ').includes('ft-managed-command-center__row')).length, 2,
    'the named parent still manages both of their children');
});

test('real command center profile and bulk actions still dispatch through the disclosure', async () => {
  const f = fixture('parent-a', { withFamilyTools: true }); f.render(); f.familyTools().open = true;
  const controls = nodes(f.familyTools());
  const edit = controls.find(node => node.dataset.filtertubeManagedAction === 'edit_rules' && node.dataset.filtertubeProfileId === 'child-a1');
  await edit.click();
  const selectAll = controls.find(node => node.tagName === 'BUTTON' && node.textContent === 'Select all');
  const bulkTime = controls.find(node => node.dataset.filtertubeBulkAction === 'bulk_set_time_limit');
  assert.equal(bulkTime.disabled, true);
  await selectAll.click();
  assert.equal(bulkTime.disabled, false);
  await bulkTime.click();
  assert.deepEqual(f.calls, [['edit', 'child-a1'], ['bulk-limit', ['child-a1', 'child-a2'], 'set']]);
});

test('family tools and each profile’s options preserve independent open states across rerenders', () => {
  const f = fixture('parent-a', { withFamilyTools: true }); f.render();
  f.familyTools().open = true; f.options('child-a1').open = true;
  f.render();
  assert.equal(f.familyTools().open, true); assert.equal(f.options('child-a1').open, true);
  assert.equal(f.options('child-a2').open, false);
  assert.equal(f.familyTools().children[1], f.renderedPanels.at(-1), 'rerender retains the newly returned command center');
  f.options('child-a1').open = false; f.render();
  assert.equal(f.familyTools().open, true); assert.equal(f.options('child-a1').open, false);
  f.familyTools().open = false; f.options('child-a2').open = true; f.render();
  assert.equal(f.familyTools().open, false); assert.equal(f.options('child-a2').open, true);
});

test('the real command center returns null for a child and no empty family tools wrapper is rendered', () => {
  const f = fixture('child-a1', { withFamilyTools: true }); f.render();
  assert.deepEqual(f.renderedPanels, [null]);
  assert.equal(f.familyTools(), null);
  assert.equal(nodes(f.container).filter(node => node.className.split(' ').includes('ft-profile-row')).length, 7);
  assert.equal(f.button('parent-a', 'Switch').disabled, false);
});
