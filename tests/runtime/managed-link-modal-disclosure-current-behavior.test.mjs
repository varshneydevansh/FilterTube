import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function actualFunction(name) {
  const match = new RegExp(`^    (?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(match, name);
  const end = source.indexOf('\n    }\n', match.index) + '\n    }'.length;
  return source.slice(match.index, end);
}
function descendants(node) { return [node, ...node.children.flatMap(descendants)]; }
function inside(node, ancestor) {
  for (let current = node; current; current = current.parentElement) if (current === ancestor) return true;
  return false;
}
function fixture({ advancingClock = false } = {}) {
  const all = []; const frames = [];
  let clock = 1700000000000;
  const document = { activeElement: null };
  function element(tag) {
    const listeners = new Map(); let checked = false;
    const node = {
      tagName: tag.toUpperCase(), ownerDocument: document, children: [], parentElement: null, dataset: {}, attributes: {}, className: '', open: false,
      tabIndex: ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(tag.toUpperCase()) ? 0 : -1,
      appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { listeners.set(name, callback); },
      remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; },
      focus() { document.activeElement = this; },
      dispatch(name, props = {}) {
        const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...props };
        listeners.get(name)?.(event); return event;
      },
      click() { if (!this.disabled) return this.dispatch('click'); },
      querySelectorAll(selector) {
        const tags = selector.split(',').map(value => value.trim().split('[')[0].toUpperCase());
        return descendants(this).slice(1).filter(child => tags.includes(child.tagName));
      },
      getClientRects() {
        if (this.hidden) return [];
        for (let parent = this.parentElement; parent; parent = parent.parentElement) {
          if (parent.hidden) return [];
          if (parent.tagName === 'DETAILS' && !parent.open && !inside(this, parent.children[0])) return [];
        }
        return this.isConnected ? [{}] : [];
      }
    };
    Object.defineProperty(node, 'isConnected', { get: () => inside(node, document.body) });
    Object.defineProperty(node, 'checked', { get: () => checked, set(value) {
      checked = value === true;
      if (checked && node.type === 'radio') for (const other of all) {
        if (other !== node && other.type === 'radio' && other.name === node.name) other.checked = false;
      }
    } });
    all.push(node); return node;
  }
  document.createElement = element; document.body = element('body');
  const previous = document.body.appendChild(element('button')); previous.focus();
  const context = {
    document, window: {}, requestAnimationFrame: callback => frames.push(callback),
    Date: class extends Date { static now() { return advancingClock ? clock++ : clock; } },
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')),
    getNanahLocalProfileContext: () => ({ profileId: 'child', profileName: 'Mira' })
  };
  vm.runInNewContext(['getNanahManagedSendScopeList', 'getNanahReconnectMode', 'getNanahLockedChildMode', 'getNanahChildProtectionLevel', 'getNanahTargetProfileBehavior',
    'getNanahScopeDescription', 'getNanahManagedModalScopeLabel', 'describeNanahManagedModalScopeList', 'showNanahManagedLinkModal'].map(actualFunction).join('\n'), context);
  const defaults = {
    title: 'Save Parent Control Link', message: 'Parent computer wants to update Mira.',
    intro: 'Apply once, or save this parent link for later matching updates.',
    initialPolicy: { allowedScopes: ['kids', 'time_limits'], defaultScope: 'kids', applyMode: 'merge', autoApplyControlProposals: true,
      reconnectMode: 'fast', syncOnProfileOpen: true, lockedChildMode: 'allow_trusted_updates', childProtectionLevel: 'standard', targetProfileBehavior: 'fixed_profile' },
    requiredScopes: ['kids'], allowApplyOnce: true, allowSave: true, showAutoApply: true, showReconnectMode: true,
    showTargetProfileMapping: true, showLockedChildMode: true, forceFixedTargetProfile: true
  };
  function current(promise) {
    frames.splice(0).forEach(callback => callback());
    const overlay = document.body.children.at(-1); const card = overlay.children[0];
    const options = descendants(card).find(node => node.tagName === 'DETAILS');
    const buttons = descendants(card).filter(node => node.tagName === 'BUTTON');
    const button = label => buttons.find(node => node.textContent === label);
    const inputs = descendants(card).filter(node => node.tagName === 'INPUT');
    const input = (type, value) => inputs.find(node => node.type === type && node.value === value);
    return { promise, overlay, card, options, buttons, button, inputs, input, previous, document,
      change(node, value) { assert.ok(node); assert.equal(node.disabled === true, false); node.checked = value; node.dispatch('change'); } };
  }
  function open(overrides = {}) {
    const promise = context.showNanahManagedLinkModal({ ...defaults, ...overrides });
    return current(promise);
  }
  return { open, context, current, document };
}
const expectedPolicy = {
  allowedScopes: ['kids', 'time_limits'], defaultScope: 'kids', applyMode: 'merge', autoApplyControlProposals: true,
  reconnectMode: 'fast', lockedChildMode: 'allow_trusted_updates', syncOnProfileOpen: true, childProtectionLevel: 'standard',
  targetProfileBehavior: 'fixed_profile', targetProfileId: 'child', targetProfileName: 'Mira'
};

test('first approval keeps who/target/future permission and action choices visible while retaining every existing control', async () => {
  const f = fixture().open();
  assert.ok(f.options); assert.equal(f.options.open, false);
  assert.equal(f.options.children[0].tagName, 'SUMMARY');
  assert.equal(f.options.children[0].textContent, 'Update and saved-link options');
  const visibleText = descendants(f.card).filter(node => node.getClientRects().length).map(node => node.textContent || '').join(' ');
  assert.match(visibleText, /Parent computer wants to update Mira/);
  assert.match(visibleText, /Saving the parent link also permits future matching updates to this profile/);
  assert.equal(f.inputs.length, 28, 'all eight allowed/default areas and all optional controls remain in the DOM');
  assert.ok(f.inputs.every(input => inside(input, f.options)));
  assert.ok(f.inputs.every(input => input.getClientRects().length === 0));
  assert.ok(f.buttons.every(button => !inside(button, f.options) && button.getClientRects().length > 0));
  f.options.open = true;
  assert.ok(f.inputs.every(input => input.getClientRects().length > 0), 'opening the native disclosure exposes all controls');
  f.button('Cancel').click(); assert.equal(await f.promise, null);
});

test('collapsed first-approval save returns the unchanged policy defaults and restores focus', async () => {
  const f = fixture().open(); f.button('Save managed link').click();
  assert.deepEqual(plain(await f.promise), { action: 'save', policy: expectedPolicy });
  assert.equal(f.document.activeElement, f.previous); assert.equal(f.overlay.isConnected, false);
});

test('default update areas remain one native radio group when the clock advances during rendering', async () => {
  const f = fixture({ advancingClock: true }).open(); f.options.open = true;
  const initial = f.input('radio', 'kids'); const chosen = f.input('radio', 'time_limits');
  assert.equal(initial.checked, true); assert.equal(chosen.checked, false);
  assert.equal(initial.name, chosen.name, 'render time cannot split the default-area radio group');
  f.change(chosen, true);
  assert.equal(initial.checked, false, 'native radio exclusivity clears the previous default');
  assert.equal(chosen.checked, true);
  assert.equal(f.inputs.filter(input => input.type === 'radio' && input.name === chosen.name && input.checked).length, 1);
  f.button('Save managed link').click();
  assert.deepEqual(plain(await f.promise), { action: 'save', policy: { ...expectedPolicy, defaultScope: 'time_limits' } });
});

test('save-only/edit variants retain their existing expanded fields and produce the same policy', async () => {
  const f = fixture().open({ allowApplyOnce: false });
  assert.equal(f.options, undefined);
  assert.equal(f.inputs.length, 28); assert.ok(f.inputs.every(input => input.getClientRects().length > 0));
  f.button('Save managed link').click(); assert.deepEqual(plain(await f.promise), { action: 'save', policy: expectedPolicy });
});

test('edits under the disclosure still govern Apply Once without changing policy return semantics', async () => {
  const f = fixture().open({ forceFixedTargetProfile: false }); f.options.open = true;
  f.change(f.input('checkbox', 'main'), true); f.change(f.input('checkbox', 'time_limits'), false);
  const mainDefault = f.input('radio', 'main'); assert.equal(mainDefault.disabled, false); f.change(mainDefault, true);
  f.change(f.input('radio', 'replace'), true);
  const autoApply = f.inputs.find(input => input.type === 'checkbox' && input.value === undefined);
  f.change(autoApply, false);
  f.change(f.input('radio', 'approval_needed'), true); f.change(f.input('radio', 'current_active'), true);
  f.change(f.input('radio', 'require_unlock'), true);
  f.button('Apply once').click();
  assert.deepEqual(plain(await f.promise), { action: 'apply_once', policy: {
    allowedScopes: ['main', 'kids'], defaultScope: 'main', applyMode: 'replace', autoApplyControlProposals: false,
    reconnectMode: 'approval_needed', lockedChildMode: 'require_unlock', syncOnProfileOpen: false, childProtectionLevel: 'standard',
    targetProfileBehavior: 'current_active', targetProfileId: '', targetProfileName: ''
  } });
});

test('required scopes, fixed targets and strict protection retain their existing guards', async () => {
  const f = fixture().open(); f.options.open = true;
  assert.equal(f.input('checkbox', 'kids').disabled, true);
  assert.equal(f.input('radio', 'current_active').disabled, true);
  f.change(f.input('radio', 'strict'), true); f.button('Save managed link').click();
  assert.deepEqual(plain(await f.promise), { action: 'save', policy: { ...expectedPolicy,
    autoApplyControlProposals: false, reconnectMode: 'approval_needed', lockedChildMode: 'require_unlock', syncOnProfileOpen: false, childProtectionLevel: 'strict'
  } });
});

test('closed disclosure summary participates in the actual modal Tab boundary instead of being skipped', async () => {
  const f = fixture().open(); const summary = f.options.children[0]; const save = f.button('Save managed link');
  assert.equal(f.document.activeElement, save);
  const forward = f.card.dispatch('keydown', { key: 'Tab' });
  assert.equal(forward.defaultPrevented, true); assert.equal(f.document.activeElement, summary);
  const backward = f.card.dispatch('keydown', { key: 'Tab', shiftKey: true });
  assert.equal(backward.defaultPrevented, true); assert.equal(f.document.activeElement, save);
  const escape = f.card.dispatch('keydown', { key: 'Escape' });
  assert.equal(escape.defaultPrevented, true); assert.equal(await f.promise, null);
});

test('cancelling after changing advanced fields returns null and never saves policy', async () => {
  const f = fixture().open(); f.options.open = true; f.change(f.input('radio', 'replace'), true);
  f.overlay.dispatch('click', { target: f.overlay });
  assert.equal(await f.promise, null); assert.equal(f.overlay.isConnected, false);
});

function incomingFixture({ active = 'default', target = '', targetType = 'account' } = {}) {
  const f = fixture(); const calls = { apply: [], decisions: [], saves: 0, parentApproval: 0, options: null };
  const profileName = active === 'default' ? 'Default' : 'Local child';
  const root = { activeProfileId: active, profiles: { default: { type: 'account', name: 'Default' }, child: { type: 'child', parentProfileId: 'default', name: 'Local child' } } };
  if (target && !root.profiles[target]) root.profiles[target] = { type: targetType, name: target };
  const details = { scope: 'kids', strategy: 'merge', allowedScopes: ['kids'], targetProfile: target ? { profileId: target, profileName: root.profiles[target]?.name, profileType: targetType } : null };
  const local = { profileId: active, profileName, profileType: active === 'child' ? 'child' : 'account' };
  Object.assign(f.context, {
    nanahSessionState: { remoteDevice: { deviceId: 'parent-phone' }, remoteRole: 'source', remoteProfile: { profileId: 'remote-parent' } },
    parseNanahEnvelopeDetails: () => details, getNanahRole: () => 'replica', findNanahTrustedLink: () => null,
    getNanahLocalProfileContext: () => local, isActiveChildNanahProfile: () => active === 'child', isNanahChildReceiveOnly: () => active === 'child',
    ensureChildNanahParentAuthorityUnlocked: async () => { calls.parentApproval += 1; return true; }, shouldAutoApplyNanahProposal: () => false,
    captureNanahManagedTrustSession: () => ({}), captureNanahReceiverTrustAuthorization: () => ({}),
    getNanahRemoteLabel: () => 'Parent phone', resolveNanahDisplayTargetProfile: () => details.targetProfile || local,
    formatNanahProfileContext: value => value.profileName,
    applyNanahEnvelope: async (...args) => calls.apply.push(args), sendNanahDecision: async (...args) => calls.decisions.push(args),
    saveNanahTrustedLink: async () => { calls.saves += 1; throw new Error('No trust may be saved by this fixture'); },
    UIComponents: { showToast() {} }, updateNanahUi() {}
  });
  f.context.window.FilterTubeIO = { loadProfilesV4: async () => root };
  const realModal = f.context.showNanahManagedLinkModal;
  f.context.showNanahManagedLinkModal = options => { calls.options = options; return realModal(options); };
  vm.runInNewContext(actualFunction('handleNanahIncomingProposal'), f.context);
  return { ...f, calls, async start() {
    const pending = f.context.handleNanahIncomingProposal({ id: 'first-update' });
    for (let turn = 0; turn < 8 && !calls.options; turn += 1) await Promise.resolve();
    assert.ok(calls.options, 'actual incoming handler must reach its actual modal');
    return { ...f.current(pending), pending };
  } };
}

test('adult first managed approval renders only Apply Once and Decline without saved-link permission claims', async () => {
  for (const target of ['', 'default', 'other-account']) {
    const f = incomingFixture({ target }); const modal = await f.start();
    assert.equal(f.calls.options.allowSave, false);
    assert.equal(modal.card.attributes['aria-label'], 'Apply This Update Once');
    assert.deepEqual(modal.buttons.map(button => button.textContent), ['Decline', 'Apply Once']);
    const visible = descendants(modal.card).filter(node => node.getClientRects().length).map(node => node.textContent || '').join(' ');
    assert.match(visible, /This does not save a parent link or permit future updates/);
    assert.match(visible, /Only this update is being approved/);
    assert.doesNotMatch(visible, /this saved parent link can change|Usual update area|Next connection|Automatic saved updates|Where parent updates land|Saving the parent link also permits/);
    assert.equal(modal.input('radio', 'replace').getClientRects().length > 0, true, 'one-time merge/replace capability remains');
    modal.change(modal.input('radio', 'replace'), true);
    modal.button('Apply Once').click(); await modal.pending;
    assert.equal(f.calls.apply.length, 1); assert.equal(f.calls.apply[0][1], 'replace');
    assert.equal(f.calls.decisions[0][1], true); assert.equal(f.calls.saves, 0);
  }
});

test('Decline remains available for the actual adult one-time approval and applies nothing', async () => {
  const f = incomingFixture(); const modal = await f.start(); modal.button('Decline').click(); await modal.pending;
  assert.equal(f.calls.apply.length, 0); assert.equal(f.calls.saves, 0);
  assert.deepEqual(f.calls.decisions[0], ['first-update', false, 'declined']);
});

test('actual child targets retain parent-link approval from either the active child or adult account', async () => {
  for (const active of ['child', 'default']) {
    const f = incomingFixture({ active, target: 'child', targetType: 'child' }); const modal = await f.start();
    assert.equal(f.calls.options.allowSave, true); assert.equal(f.calls.options.showAutoApply, true);
    assert.equal(f.calls.options.showTargetProfileMapping, true);
    assert.equal(f.calls.options.forceFixedTargetProfile, active === 'child');
    assert.equal(f.calls.parentApproval, active === 'child' ? 1 : 0);
    assert.equal(modal.card.attributes['aria-label'], 'Save Parent Control Link');
    assert.deepEqual(modal.buttons.map(button => button.textContent), ['Decline', 'Apply Once', 'Apply + Save Parent Link']);
    assert.ok(modal.options); assert.equal(modal.options.open, false);
    modal.button('Decline').click(); await modal.pending;
    assert.equal(f.calls.apply.length, 0); assert.equal(f.calls.saves, 0);
  }
});

test('hidden fixed target mapping retains the reviewed remote child instead of the current local profile', async () => {
  const f = fixture().open({ showTargetProfileMapping: false, forceFixedTargetProfile: false,
    initialPolicy: { ...expectedPolicy, targetProfileBehavior: 'fixed_profile', targetProfileId: 'remote-child', targetProfileName: 'Remote child' } });
  f.button('Save managed link').click();
  const result = await f.promise;
  assert.equal(result.policy.targetProfileBehavior, 'fixed_profile');
  assert.equal(result.policy.targetProfileId, 'remote-child');
  assert.equal(result.policy.targetProfileName, 'Remote child');
});
