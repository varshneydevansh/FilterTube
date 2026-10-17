import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function actualFunction(name) {
  const match = new RegExp(`^    (?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(match, name);
  const end = source.indexOf('\n    }', match.index) + '\n    }'.length;
  return source.slice(match.index, end);
}
function section(startText, endText, from = 0) {
  const start = source.indexOf(startText, from); const end = source.indexOf(endText, start);
  assert.ok(start > from && end > start);
  return source.slice(start, end);
}
function control(dataset = {}) {
  const listeners = new Map();
  return { dataset, attributes: {}, value: '', disabled: false,
    addEventListener(name, callback) { listeners.set(name, callback); },
    setAttribute(name, value) { this.attributes[name] = value; },
    dispatchEvent() {},
    click() { if (!this.disabled) return listeners.get('click')?.(); },
    dispatchClick() { return listeners.get('click')?.(); }
  };
}
function fixture() {
  const persist = []; const previews = []; const updates = [];
  const tile = control({ selected: 'true', familyDeviceId: 'saved-device', source: 'trusted-link' });
  const state = {
    stage: 'idle', code: '', remoteDevice: null, connected: false, sasConfirmed: false
  };
  const managedChildEdit = Object.freeze({ profileId: 'local-child', surface: 'kids' });
  const trusted = Object.freeze({ linkId: 'saved-link', localPolicyProfileId: 'local-child', policy: Object.freeze({ targetProfileId: 'remote-child' }) });
  const context = {
    nanahClient: null, nanahSessionState: state, nanahUiMode: 'send_once', managedChildEdit, nanahTrustedLinks: [trusted],
    isApplyingNanahModePreset: false, ftNanahSyncShell: { dataset: { personalSyncOpen: 'true' } },
    ftNanahModeSendOnce: control({ mode: 'send_once' }), ftNanahModeParent: control({ mode: 'parent_control' }), ftNanahModeFull: control({ mode: 'full_account' }),
    ftNanahCompassLiveBtn: control({ selected: 'false' }), ftNanahCompassHomeBtn: control({ selected: 'false' }), ftNanahCompassLaterBtn: control({ selected: 'false' }),
    ftNanahDeviceCompass: { dataset: {}, querySelectorAll: () => [tile] },
    ftNanahRole: control(), ftNanahScope: control(), ftNanahStrategy: control(), ftNanahRemoteTarget: control(),
    ftNanahAddDeviceBtn: control(), ftNanahPairingDetails: { open: false }, ftNanahHostBtn: control(), ftNanahStatusCard: null, ftNanahDeliveryLiveCard: null,
    nanahFamilyDeviceSelectedIntent: null,
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    isChildProfileAdminSurface: () => false, isActiveChildNanahProfile: () => false,
    isNanahChildReceiveOnly: () => false, isNanahChildReplicaOnly: () => false, getActiveProfileType: () => 'account',
    persistNanahUiModePreference: async mode => { persist.push(mode); },
    getNanahFamilyDeliveryReadinessSummary: () => ({ protectedProfileCount: 1 }),
    renderNanahFamilyDeviceIntent() {}, focusNanahElement() {},
    renderNanahDeviceSelectionPreview: args => { previews.push(args); },
    updateNanahUi: () => { updates.push({ mode: context.nanahUiMode, personal: context.ftNanahSyncShell.dataset.personalSyncOpen }); },
    UIComponents: { showToast() {} }, Event: class Event {}, getNanahUiMode: () => context.nanahUiMode
  };
  const modeRegistration = section('    [\n        ftNanahModeSendOnce,', '\n    if (ftNanahDeviceLabel)', source.indexOf('    if (ftNanahManagedTargets) {', source.indexOf('nanahUiMode = await loadNanahUiModePreference')));
  vm.runInNewContext([
    ...['normalizeNanahUiMode', 'setNanahModeButtons', 'setNanahMode', 'setNanahPersonalSyncOpen', 'setNanahCompassSelectedButton', 'setNanahFamilyDeviceIntent', 'openNanahPairingDetails', 'prepareNanahDevicePickerContext'].map(actualFunction),
    section('    if (ftNanahAddDeviceBtn) {', '    if (ftNanahQuickCreateProtectedBtn) {', source.indexOf('    function prepareNanahDevicePickerContext(')), modeRegistration
  ].join('\n'), context);
  return { context, tile, state, managedChildEdit, trusted, persist, previews, updates };
}
function assertProtectedStateUnchanged(f, expectedSession = { stage: 'idle', code: '', remoteDevice: null, connected: false, sasConfirmed: false }) {
  assert.equal(f.context.managedChildEdit, f.managedChildEdit);
  assert.equal(f.context.nanahTrustedLinks[0], f.trusted);
  assert.equal(f.context.nanahTrustedLinks[0].localPolicyProfileId, 'local-child');
  assert.equal(f.context.nanahTrustedLinks[0].policy.targetProfileId, 'remote-child');
  assert.equal(f.context.nanahSessionState, f.state);
  assert.deepEqual(f.state, expectedSession);
}
function assertSelectionCleared(f) {
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent, null);
  assert.equal(f.tile.dataset.selected, 'false');
  for (const name of ['ftNanahCompassLiveBtn', 'ftNanahCompassHomeBtn', 'ftNanahCompassLaterBtn']) assert.equal(f.context[name].dataset.selected, 'false');
  assert.equal(f.context.ftNanahDeviceCompass.dataset.selectedRoute, undefined);
}

test('Add personal → explicit Family → explicit Personal → Full aligns display mode and clears only obsolete UI selection', () => {
  const f = fixture(); const c = f.context;
  c.ftNanahAddDeviceBtn.click();
  assert.equal(c.nanahUiMode, 'send_once'); assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'true');
  assert.equal(c.nanahFamilyDeviceSelectedIntent.title, 'Copy this profile now');
  assert.equal(c.ftNanahCompassLiveBtn.dataset.selected, 'true');
  assert.equal(f.previews.at(-1).title, 'Copy this profile now');
  assertProtectedStateUnchanged(f);
  c.ftNanahModeParent.click();
  assert.equal(c.nanahUiMode, 'parent_control'); assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'false');
  assert.equal(c.ftNanahRole.value, 'source'); assert.equal(c.ftNanahScope.value, 'active');
  assert.equal(c.ftNanahModeParent.attributes['aria-pressed'], 'true'); assertSelectionCleared(f); assertProtectedStateUnchanged(f);
  c.ftNanahModeSendOnce.click();
  assert.equal(c.nanahUiMode, 'send_once'); assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'true');
  assert.equal(c.ftNanahRole.value, 'peer'); assert.equal(c.ftNanahScope.value, 'active');
  assertSelectionCleared(f); assertProtectedStateUnchanged(f);
  // A newly chosen personal path must not survive the later explicit Full mode.
  c.ftNanahAddDeviceBtn.click(); assert.ok(c.nanahFamilyDeviceSelectedIntent);
  c.ftNanahModeFull.click();
  assert.equal(c.nanahUiMode, 'full_account'); assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'false');
  assert.equal(c.ftNanahRole.value, 'peer'); assert.equal(c.ftNanahScope.value, 'full');
  assert.equal(c.ftNanahModeFull.attributes['aria-pressed'], 'true'); assertSelectionCleared(f); assertProtectedStateUnchanged(f);
  assert.deepEqual(f.persist, ['parent_control', 'send_once', 'full_account']);
});

test('a disabled explicit mode button cannot change an in-flight session, flags or selection even if its listener is invoked', () => {
  const f = fixture(); const c = f.context; c.ftNanahAddDeviceBtn.click();
  const intent = c.nanahFamilyDeviceSelectedIntent; const selectedRoute = c.ftNanahDeviceCompass.dataset.selectedRoute;
  Object.assign(f.state, { stage: 'awaiting_sas', code: 'UKUH', remoteDevice: { deviceId: 'connected-peer' } });
  const sessionBefore = JSON.parse(JSON.stringify(f.state));
  const client = {}; c.nanahClient = client; c.setNanahModeButtons('send_once');
  assert.equal(c.ftNanahModeParent.disabled, true);
  c.ftNanahModeParent.dispatchClick();
  assert.equal(c.nanahClient, client); assert.equal(c.nanahUiMode, 'send_once');
  assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'true'); assert.equal(c.nanahFamilyDeviceSelectedIntent, intent);
  assert.equal(c.ftNanahDeviceCompass.dataset.selectedRoute, selectedRoute); assert.equal(c.ftNanahCompassLiveBtn.dataset.selected, 'true');
  assert.deepEqual(f.persist, []); assertProtectedStateUnchanged(f, sessionBefore);
});

test('internal mode changes retain their existing flag and intent behavior', () => {
  const f = fixture(); const c = f.context; c.ftNanahAddDeviceBtn.click();
  const intent = c.nanahFamilyDeviceSelectedIntent;
  c.setNanahMode('parent_control', { persist: false, applyPreset: true });
  assert.equal(c.nanahUiMode, 'parent_control'); assert.equal(c.ftNanahRole.value, 'source');
  assert.equal(c.ftNanahSyncShell.dataset.personalSyncOpen, 'true'); assert.equal(c.nanahFamilyDeviceSelectedIntent, intent);
  assertProtectedStateUnchanged(f);
});
