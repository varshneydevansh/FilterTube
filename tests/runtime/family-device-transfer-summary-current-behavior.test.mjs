import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
function actual(name) {
  const match = new RegExp(`^    (?:async )?function ${name}\\(`, 'm').exec(source); assert.ok(match, name);
  return source.slice(match.index, source.indexOf('\n    }\n', match.index) + '\n    }'.length);
}
function node(tag = 'div', id = '') {
  const value = { tagName: tag.toUpperCase(), id, children: [], attributes: {}, dataset: {}, hidden: false,
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    querySelector(selector) { return this.children.find(child => selector.startsWith('.') ? child.className === selector.slice(1) : child.tagName === selector.toUpperCase()) || null; },
    getAttribute(name) { return this.attributes[name] ?? null; }, setAttribute(name, text) { this.attributes[name] = text; },
    remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); } };
  Object.defineProperty(value, 'innerHTML', { set(text) { assert.equal(text, ''); this.children = []; } }); return value;
}
function fixture() {
  const review = node('div', 'ftNanahDeviceSelectionPreview'); for (const tag of ['span', 'strong', 'small']) review.appendChild(node(tag));
  const reviewLine = review.appendChild(node('p', 'ftNanahDeviceTransferSummary'));
  const sendLine = node('p', 'ftNanahSendTransferSummary');
  const reviewAction = node('button'); const sendAction = node('button');
  reviewAction.setAttribute('aria-describedby', 'existing-review-help'); sendAction.setAttribute('aria-describedby', 'existing-send-help');
  const document = { activeElement: sendAction, createElement: tag => node(tag), getElementById: id => [reviewLine, sendLine].find(item => item.id === id) || null };
  const context = {
    window: {}, document,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}, safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    profilesV4Cache: { activeProfileId: 'parent-a', profiles: {
      default: { type: 'account', name: 'Master' }, 'parent-a': { type: 'account', name: 'Parent A' }, 'parent-b': { type: 'account', name: 'Parent B' },
      'child-a': { type: 'child', parentProfileId: 'parent-a', name: 'Local Mira' }, 'child-b': { type: 'child', parentProfileId: 'parent-b', name: 'Local Leo' }
    } }, activeProfileId: 'parent-a', managedChildEdit: { profileId: 'child-a' }, nanahManagedPolicySourceOverride: null,
    nanahSessionState: { connected: true, sasConfirmed: true, remoteRole: 'replica', remoteDevice: { deviceId: 'tablet', deviceLabel: 'Shared tablet' }, remoteProfile: { profileId: 'remote-default', profileName: 'Remote Default' } },
    nanahFamilyDeviceSelectedIntent: { source: 'live-session' }, nanahTrustedLinks: [], nanahDeviceSelectionBusy: false, nanahClient: {}, nanahLastSessionNotice: null,
    getNanahUiMode: () => 'parent_control', getNanahScope: () => 'active', getNanahRole: () => 'source',
    isActiveChildNanahProfile: () => false, isNanahChildReceiveOnly: () => false, isNanahChildReplicaOnly: () => false,
    getNanahLocalProfileContext: () => { const id = context.profilesV4Cache.activeProfileId; return { profileId: id, profileName: context.profilesV4Cache.profiles[id].name }; },
    getManagedChildProfile: () => context.profilesV4Cache.profiles[context.managedChildEdit?.profileId] || null,
    getNanahSelectedRemoteTargetProfile: () => ({ profileId: 'receiver-mira', profileName: 'Receiving Mira' }),
    getNanahSelectedManagedTargetLinks: () => [], getNanahRemoteLabel: () => 'Shared tablet', normalizeNanahTrustedLink: value => value,
    getProfileType: (root, id) => context.FilterTubeManagedAdminAuthority.getProfileType(root, id),
    canActiveProfileManageProfile: (root, id) => context.FilterTubeManagedAdminAuthority.canActorManageProfile(root, { actorProfileId: root.activeProfileId, targetProfileId: id }).allowed,
    tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')),
    familyDeviceMapCopy: value => value || '', familyDeviceMapText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')),
    getNanahCurrentTrustedLink: () => null,
    enforceChildSyncSurfaceRestrictions() {}, renderNanahFamilyDeviceIntent() {}, updateNanahPolicyControls() {}, refreshNanahAdvancedSummary() {}, updateNanahModeUi() {}, renderNanahDeliveryPathStrip() {}, renderNanahQr: async () => {}
  };
  const update = actual('updateNanahUi');
  for (const name of new Set(update.match(/\bftNanah\w+/g))) context[name] = null;
  Object.assign(context, { ftNanahDeviceSelectionPreview: review, ftNanahDeviceSelectionActionBtn: reviewAction, ftNanahDeviceCompass: { querySelector: () => null },
    ftNanahSendBtn: sendAction, ftNanahTargetHint: null });
  vm.runInNewContext(authoritySource, context);
  // The authority module binds its global API to window.
  vm.runInNewContext(['getNanahManagedPolicySourceProfile', 'buildNanahDeviceTransferSummary', 'renderNanahDeviceTransferSummary', 'renderNanahDeviceSelectionPreview', 'updateNanahUi'].map(actual).join('\n'), context);
  return { context, review, reviewAction, reviewLine, sendAction, sendLine, document,
    renderReview() { context.renderNanahDeviceSelectionPreview({ title: 'Receiving Mira', primaryAction: 'Review and send' }); return reviewLine.textContent; },
    renderSend() { context.updateNanahUi(); return sendLine.textContent; } };
}

test('actual review and explicit Send render the managed child source separately from the authorizing parent', () => {
  const f = fixture(); const before = JSON.stringify([f.context.profilesV4Cache, f.context.managedChildEdit, f.context.nanahSessionState]);
  assert.equal(f.renderReview(), 'Managed rules: Local Mira (by Parent A) → Receiving Mira on Shared tablet');
  assert.equal(f.renderSend(), f.reviewLine.textContent);
  assert.equal(f.document.activeElement, f.sendAction);
  assert.equal(JSON.stringify([f.context.profilesV4Cache, f.context.managedChildEdit, f.context.nanahSessionState]), before);
  assert.equal(f.reviewAction.attributes['aria-describedby'], 'existing-review-help ftNanahDeviceTransferSummary');
  assert.equal(f.review.attributes['aria-describedby'], 'ftNanahDeviceTransferSummary');
  assert.equal(f.sendAction.attributes['aria-describedby'], 'existing-send-help ftNanahSendTransferSummary');
  f.renderSend(); f.renderReview();
  assert.equal(f.sendAction.attributes['aria-describedby'], 'existing-send-help ftNanahSendTransferSummary', 'polling does not duplicate description tokens');
});

test('source override and every selected managed recipient follow the actual sender source helper', () => {
  const f = fixture();
  f.context.nanahManagedPolicySourceOverride = { profileId: 'child-b', profile: { name: 'Command source' } };
  f.context.getNanahSelectedManagedTargetLinks = () => [
    { sourceProfileId: 'parent-a', policy: { targetProfileName: 'Receiving Mira', targetProfileId: 'mira' } }, { sourceProfileId: 'parent-a', policy: { targetProfileName: 'Receiving Leo', targetProfileId: 'leo' } }
  ];
  assert.equal(f.renderSend(), 'Managed rules: Command source (by Parent A) → Receiving Mira, Receiving Leo on Shared tablet');
});

function selectSaved(f, sourceId = 'child-a') {
  f.context.nanahFamilyDeviceSelectedIntent = { source: 'trusted-link', linkId: 'saved-mira', profileId: 'receiver-mira' };
  f.context.nanahTrustedLinks = [{ linkId: 'saved-mira', linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', deviceLabel: 'Saved tablet', remoteDeviceId: 'saved-tablet', localPolicyProfileId: sourceId, sourceProfileId: 'parent-a',
    policy: { sourceProfileId: 'parent-a', targetProfileBehavior: 'fixed_profile', targetProfileId: 'receiver-mira', targetProfileName: 'Saved receiving Mira' } }];
}
test('saved-device review uses its local rules mapping and exact fixed receiver, independently of the live editor', () => {
  const f = fixture(); selectSaved(f);
  f.context.managedChildEdit = null;
  assert.equal(f.renderReview(), 'Managed rules: Local Mira (by Parent A) → Saved receiving Mira on Saved tablet');
  f.context.getNanahRole = () => 'replica';
  assert.equal(f.renderReview(), 'Managed rules: Local Mira (by Parent A) → Saved receiving Mira on Saved tablet', 'saved-link send has its own verified source role, independent of the open session');
  assert.match(f.renderSend(), /^Personal copy: Parent A →/, 'adult session controls retain their existing send capability');
  f.context.profilesV4Cache.activeProfileId = 'parent-b'; f.context.nanahTrustedLinks[0].localPolicyProfileId = 'child-b';
  f.context.nanahTrustedLinks[0].sourceProfileId = 'parent-b'; f.context.nanahTrustedLinks[0].policy.sourceProfileId = 'parent-b';
  assert.equal(f.renderReview(), 'Managed rules: Local Leo (by Parent B) → Saved receiving Mira on Saved tablet');
});

test('unmapped, removed, unauthorized and revoked saved mappings never fall back to active parent rules', () => {
  for (const sourceId of ['', 'deleted', 'child-b']) {
    const f = fixture(); selectSaved(f, sourceId);
    assert.equal(f.renderReview(), 'Choose rules profile → Saved receiving Mira on Saved tablet');
  }
  const revoked = fixture(); selectSaved(revoked); revoked.context.nanahTrustedLinks[0].revoked = true;
  assert.equal(revoked.renderReview(), 'Choose rules profile → Saved receiving Mira on Saved tablet');
});

test('Master managing a child cannot be described as the parent identity pinned to another parent’s link', () => {
  const f = fixture(); selectSaved(f); f.context.profilesV4Cache.activeProfileId = 'default';
  assert.equal(f.context.canActiveProfileManageProfile(f.context.profilesV4Cache, 'child-a'), true);
  const before = JSON.stringify(f.context.profilesV4Cache);
  assert.equal(f.renderReview(), 'Switch to Parent A to send updates to Saved receiving Mira on Saved tablet.');
  assert.doesNotMatch(f.reviewLine.textContent, /by Master|→/);
  assert.equal(JSON.stringify(f.context.profilesV4Cache), before, 'the prompt cannot switch profiles');
  f.context.profilesV4Cache.activeProfileId = 'parent-a';
  assert.equal(f.renderReview(), 'Managed rules: Local Mira (by Parent A) → Saved receiving Mira on Saved tablet');
});

test('saved summary honors a policy-level parent pin and asks for link review when no usable parent identity exists', () => {
  const f = fixture(); selectSaved(f); delete f.context.nanahTrustedLinks[0].sourceProfileId;
  assert.equal(f.renderReview(), 'Managed rules: Local Mira (by Parent A) → Saved receiving Mira on Saved tablet');
  for (const pinned of ['', 'deleted-parent', 'child-a']) {
    f.context.nanahTrustedLinks[0].policy.sourceProfileId = pinned;
    assert.equal(f.renderReview(), 'Review this saved parent link before sending to Saved receiving Mira on Saved tablet.');
    assert.doesNotMatch(f.reviewLine.textContent, /by Parent A|→/);
  }
});

test('live batch summaries cannot imply the active parent can send through other or missing parent identities', () => {
  const f = fixture();
  const targets = [
    { sourceProfileId: 'parent-a', policy: { targetProfileName: 'Receiving Mira', targetProfileId: 'mira' } },
    { sourceProfileId: 'parent-a', policy: { targetProfileName: 'Receiving Leo', targetProfileId: 'leo' } }
  ];
  f.context.getNanahSelectedManagedTargetLinks = () => targets;
  f.context.profilesV4Cache.activeProfileId = 'default';
  assert.equal(f.renderSend(), 'Switch to Parent A to send updates to Receiving Mira, Receiving Leo on Shared tablet.');
  targets[1].sourceProfileId = 'parent-b';
  assert.equal(f.renderSend(), 'Review the saved parent links before sending to Receiving Mira, Receiving Leo on Shared tablet.');
  targets[1].sourceProfileId = '';
  assert.doesNotMatch(f.renderSend(), /by Master|→/);
});

test('personal copying uses the active own profile even when a managed child editor remains open', () => {
  const f = fixture(); f.context.getNanahUiMode = () => 'send_once'; f.context.getNanahRole = () => 'peer';
  assert.equal(f.renderReview(), 'Personal copy: Parent A → Receiving Mira on Shared tablet');
  assert.equal(f.renderSend(), f.reviewLine.textContent);
});

test('full-account and receive-only surfaces never imply sending a single child profile', () => {
  const f = fixture(); f.context.getNanahScope = () => 'full';
  assert.equal(f.renderSend(), 'Full account → Shared tablet');
  f.context.isActiveChildNanahProfile = () => true;
  assert.equal(f.renderReview(), 'Receiving updates here. Review the receiving profile before applying.');
  f.context.isNanahChildReceiveOnly = () => true;
  assert.equal(f.renderSend(), f.reviewLine.textContent); assert.doesNotMatch(f.sendLine.textContent, /→/);
});

test('fixed saved targets and multiple local profiles are not replaced with the remote active adult profile', () => {
  const f = fixture(); f.context.getNanahSelectedRemoteTargetProfile = () => null;
  f.context.nanahSessionState.remoteTargetProfile = { behavior: 'fixed_profile', profileName: 'Fixed child' };
  assert.match(f.renderSend(), /→ Fixed child on Shared tablet$/);
  selectSaved(f); f.context.nanahTrustedLinks[0].localPolicyProfileId = '';
  assert.match(f.renderReview(), /^Choose rules profile → Saved receiving Mira/);
});

test('actual managed edit entry, sync navigation and Done editing refresh both summaries before pairing without moving focus', async () => {
  const f = fixture(); const c = f.context; const views = []; const actions = [];
  c.managedChildEdit = null;
  c.nanahClient = null; c.nanahSessionState = { connected: false, sasConfirmed: false, remoteRole: 'peer' };
  c.nanahFamilyDeviceSelectedIntent = null;
  c.getNanahSelectedRemoteTargetProfile = () => null; c.getNanahRemoteLabel = () => 'Unknown device';
  f.document.activeElement = f.reviewAction;
  f.renderReview(); f.renderSend();
  assert.match(f.sendLine.textContent, /^Managed rules: Parent A \(by Parent A\)/);
  Object.assign(c, {
    ensureProfileUnlocked: async () => true, recordManagedAdminAuthFailureHistory: async () => {},
    renderManagedChildGlobalBanner() {}, renderManagedChildSyncBoundary() {},
    renderKeywords() {}, renderChannels() {}, renderKidsKeywords() {}, renderKidsChannels() {}, renderListModeControls() {}, updateCheckboxes() {},
    updateAdminPolicyControls() {}, updateChildProfileCapabilityControls() {},
    buildManagedChildState: () => ({}), StateManager: { getState: () => ({}) },
    FILTERTUBE_SEMANTIC_ML_ENABLED: false, navItems: [], viewSections: [], pageTitle: null,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  });
  c.window.FilterTubeIO = { loadProfilesV4: async () => c.profilesV4Cache };
  c.document.body = { dataset: {} }; c.document.documentElement = { dataset: {} };
  c.document.dispatchEvent = event => views.push(event.detail.viewId);
  c.window.location = { pathname: '/tab-view.html', search: '', hash: '#sync' };
  c.window.history = { replaceState() {} };
  // Both editor entry/exit and the real navigation function use the existing
  // banner hook. Its summary refresh must remain read-only and synchronous.
  vm.runInNewContext(['refreshNanahDeviceTransferSummaries', 'renderManagedChildEditorBanner', 'getProfileViewingAccess',
    'startManagedChildEdit', 'endManagedChildEdit', 'switchView'].map(actual).join('\n'), c);
  c.window.__filtertubeRenderManagedChildEditorBanner = c.renderManagedChildEditorBanner;
  c.window.switchView = c.switchView;
  c.ftNanahSendBtn.click = () => actions.push('send');
  const focus = f.document.activeElement;
  await c.startManagedChildEdit('child-a', 'kids');
  assert.deepEqual(views, ['kids']);
  assert.equal(f.sendLine.textContent, 'Managed rules: Local Mira (by Parent A) → the profile open there on Unknown device');
  assert.equal(f.reviewLine.textContent, f.sendLine.textContent);
  c.window.switchView('sync');
  assert.deepEqual(views, ['kids', 'sync']);
  assert.equal(f.sendLine.textContent, f.reviewLine.textContent);
  assert.match(f.sendLine.textContent, /^Managed rules: Local Mira/);
  c.endManagedChildEdit();
  assert.equal(c.managedChildEdit, null); assert.deepEqual(views, ['kids', 'sync', 'sync']);
  assert.match(f.sendLine.textContent, /^Managed rules: Parent A \(by Parent A\)/);
  assert.equal(f.reviewLine.textContent, f.sendLine.textContent);
  assert.equal(f.document.activeElement, focus); assert.deepEqual(actions, []);
});
