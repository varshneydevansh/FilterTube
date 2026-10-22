import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/content/content_playback_admission.js', 'utf8');
const videoId = 'abcdefghijk';
function fixture() {
  let at = 10000;
  let snapshot;
  const events = [];
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  const settings = { enabled: true, hideSponsoredCards: true, activeProfileId: 'parent-a',
    activeProfileKind: 'account', profileType: 'main' };
  snapshot = { videoId, routeEpoch: 1, settingsEpoch: 1, settings, managedDenied: false, nativeCovered: false,
    directState: { videoId, decision: 'allowed', latestSettings: settings, routeTransitionPending: false },
    categoryState: null, managedTimeState: null };
  const gate = context.window.FilterTubeContentPlaybackAdmission.create({
    readSnapshot: () => snapshot, now: () => at, onInvalidate: reason => events.push(reason)
  });
  return { gate, settings, events, get snapshot() { return snapshot; }, set snapshot(value) { snapshot = value; },
    tick: (ms = 250) => { at += ms; } };
}

function timePolicy(state) {
  state.settings.managedTimeLimitPolicy = { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
    profileId: 'parent-a', policyRevision: 3, policyHash: 'known-policy', validFrom: 9000, validUntil: 20000 };
  state.snapshot.managedTimeState = { decision: 'allowed', profileId: 'parent-a', policyRevision: 3,
    policyHash: 'known-policy', expiresAt: 15000 };
}

test('only the current closure token validates and a second issue supersedes it', () => {
  const state = fixture();
  const first = state.gate.issue();
  assert.ok(Object.isFrozen(first));
  assert.equal(first.expiresAt, 11000);
  assert.equal(state.gate.validate({ expiresAt: first.expiresAt }), false);
  assert.equal(state.gate.validate(first), true);
  const second = state.gate.issue();
  assert.equal(state.gate.validate(first), false);
  assert.equal(state.gate.validate(second), true);
});

test('renew reads fresh authority and extends only an unexpired current token', () => {
  const state = fixture();
  const lease = state.gate.issue();
  state.tick(750);
  assert.equal(state.gate.renew(lease), true);
  assert.equal(lease.expiresAt, 11750);
  state.tick(1000);
  assert.equal(state.gate.renew(lease), false);
  assert.equal(state.gate.validate(lease), false);
  assert.deepEqual(state.events, ['lease_expired']);
});

test('invalidate synchronously stops preparation and old asynchronous stages cannot renew', () => {
  const state = fixture();
  const lease = state.gate.issue();
  assert.equal(state.gate.invalidate('navigation'), false);
  assert.deepEqual(state.events, ['navigation']);
  assert.equal(state.gate.renew(lease), false);
  const replacement = state.gate.issue();
  assert.equal(state.gate.validate(lease), false);
  assert.equal(state.gate.validate(replacement), true);
});

for (const [name, mutate] of [
  ['missing settings', state => { state.snapshot.settings = null; }],
  ['Disabled', state => { state.settings.enabled = false; }],
  ['unknown enabled state', state => { delete state.settings.enabled; }],
  ['advert feature off', state => { state.settings.hideSponsoredCards = false; }],
  ['missing profile', state => { delete state.settings.activeProfileId; }],
  ['unknown profile kind', state => { state.settings.activeProfileKind = ''; }],
  ['wrong route', state => { state.snapshot.videoId = 'different01'; }],
  ['route transition', state => { state.snapshot.directState.routeTransitionPending = true; }],
  ['pending', state => { state.snapshot.directState.decision = 'pending'; }],
  ['blocked', state => { state.snapshot.directState.decision = 'blocked'; }],
  ['still paused by direct guard', state => { state.snapshot.directState.pausedByGuard = true; }],
  ['pending direct metadata', state => { state.snapshot.directState.pendingStartedAt = 10000; }],
  ['unbound allow', state => { state.snapshot.directState.videoId = ''; }],
  ['old evaluator settings', state => { state.snapshot.directState.latestSettings = {}; }],
  ['managed route denied', state => { state.snapshot.managedDenied = true; }],
  ['unknown managed route', state => { delete state.snapshot.managedDenied; }],
  ['native covered', state => { state.snapshot.nativeCovered = true; }],
  ['unknown native ownership', state => { delete state.snapshot.nativeCovered; }],
  ['changed route epoch', state => { state.snapshot.routeEpoch++; }],
  ['changed settings epoch', state => { state.snapshot.settingsEpoch++; }],
  ['changed profile', state => { state.settings.activeProfileId = 'parent-b'; }],
  ['changed Main/Kids surface', state => { state.settings.profileType = 'kids'; }],
  ['new settings object', state => {
    state.snapshot.settings = { ...state.settings }; state.snapshot.directState.latestSettings = state.snapshot.settings;
  }]
]) {
  test(`an existing lease fails closed after ${name}`, () => {
    const state = fixture(); const lease = state.gate.issue(); assert.ok(lease);
    mutate(state);
    assert.equal(state.gate.renew(lease), false);
    assert.equal(state.gate.validate(lease), false);
    assert.equal(state.events.length, 1, 'the controller is stopped synchronously');
  });
}

test('category and language gates require explicit clear state when enabled', () => {
  for (const key of ['categoryFilters', 'languageFilters']) {
    const state = fixture(); state.settings[key] = { enabled: true, selected: ['known'] };
    assert.equal(state.gate.issue(), null);
    state.snapshot.categoryState = { videoId, decision: 'allowed', pausedByGuard: false };
    assert.ok(state.gate.issue());
    for (const override of [{ decision: 'pending' }, { decision: 'blocked' }, { decision: 'unavailable' }, { decision: 'inactive' },
      { videoId: 'different01' }, { pausedByGuard: true }, { pendingStartedAt: 10000 }]) {
      state.snapshot.categoryState = { videoId, decision: 'allowed', ...override };
      assert.equal(state.gate.issue(), null);
    }
  }
});

test('a child requires explicit known inactive time state even when no time policy is present', () => {
  const state = fixture(); state.settings.activeProfileKind = 'child';
  assert.equal(state.gate.issue(), null);
  state.snapshot.managedTimeState = { decision: 'inactive', profileId: 'parent-a' };
  assert.ok(state.gate.issue());
  state.snapshot.managedTimeState.profileId = 'other';
  assert.equal(state.gate.issue(), null);
});

test('a live time policy requires explicit fresh allowance and caps the lease lifetime', () => {
  const state = fixture(); timePolicy(state);
  state.snapshot.managedTimeState = null;
  assert.equal(state.gate.issue(), null, 'overlay absence is not an allowance');
  timePolicy(state); state.snapshot.managedTimeState.expiresAt = 10500;
  const lease = state.gate.issue(); assert.ok(lease);
  assert.equal(lease.expiresAt, 10500);
  state.tick(250); assert.equal(state.gate.renew(lease), true);
  assert.equal(lease.expiresAt, 10500, 'renew cannot extend the background allowance');
  state.tick(250); assert.equal(state.gate.validate(lease), false);
});

for (const [name, mutate] of [
  ['denied', state => { state.snapshot.managedTimeState.decision = 'denied'; }],
  ['unknown', state => { state.snapshot.managedTimeState.decision = 'pending'; }],
  ['wrong profile', state => { state.snapshot.managedTimeState.profileId = 'other'; }],
  ['old revision', state => { state.snapshot.managedTimeState.policyRevision--; }],
  ['wrong hash', state => { state.snapshot.managedTimeState.policyHash = 'old'; }],
  ['expired allowance', state => { state.snapshot.managedTimeState.expiresAt = 10000; }],
  ['missing allowance deadline', state => { delete state.snapshot.managedTimeState.expiresAt; }],
  ['future policy', state => { state.settings.managedTimeLimitPolicy.validFrom = 11000; }],
  ['expired policy', state => { state.settings.managedTimeLimitPolicy.validUntil = 10000; }],
  ['malformed inactive policy', state => { state.settings.managedTimeLimitPolicy = { enabled: false }; }]
]) {
  test(`time authority fails closed: ${name}`, () => {
    const state = fixture(); timePolicy(state); mutate(state);
    assert.equal(state.gate.issue(), null);
  });
}

test('matching a new policy in place cannot renew a lease from the old policy', () => {
  const state = fixture(); timePolicy(state); const lease = state.gate.issue();
  state.settings.managedTimeLimitPolicy.policyRevision++;
  state.snapshot.managedTimeState.policyRevision++;
  assert.equal(state.gate.renew(lease), false);
});

test('snapshot failures and backwards clock revoke instead of retaining playback', () => {
  const state = fixture(); const lease = state.gate.issue();
  state.tick(-1); assert.equal(state.gate.validate(lease), false);
  const context = vm.createContext({ window: {} }); vm.runInContext(source, context);
  for (const options of [{ readSnapshot() { throw new Error('unavailable'); } },
    { readSnapshot: () => ({ get settings() { throw new Error('snapshot field unavailable'); } }) },
    { readSnapshot: () => state.snapshot, now() { throw new Error('clock'); } }]) {
    assert.equal(context.window.FilterTubeContentPlaybackAdmission.create(options).issue(), null);
  }
});

const domSource = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const bridgeSource = fs.readFileSync('js/content/bridge_settings.js', 'utf8');
function productionFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1);
  const end = text.indexOf('\n}', start);
  assert.notEqual(end, -1);
  return text.slice(start, end + 2);
}
for (const [name, text, args] of [
  ['beginCurrentVideoRouteTransition', domSource, [{}]],
  ['pauseCurrentWatchForDirectAccess', domSource, [videoId, 'blocked']],
  ['pauseCurrentWatchForCategory', domSource, [videoId]],
  ['sendSettingsToMainWorld', bridgeSource, [{}]],
  ['showManagedTimeoutOverlay', bridgeSource, [{}]],
  ['showManagedViewingBlockedOverlay', bridgeSource, [{ surface: 'main' }]]
]) {
  test(`actual ${name} invalidates before native enforcement without depending on the new controller`, () => {
    for (const mode of ['present', 'absent', 'throws']) {
      const events = [];
      const video = { paused: false, ended: false, pause: () => events.push('native') };
      const window = {};
      if (mode !== 'absent') window.FilterTubeContentPlayback = { invalidate(reason) {
        assert.equal(typeof reason, 'string'); events.push('hook');
        if (mode === 'throws') throw new Error('controller unavailable');
      } };
      const context = vm.createContext({ window, currentSettings: {}, mainWorldSettingsDispatchRevision: 0,
        latestSettings: null, pendingSeedSettings: null, pendingSeedSettingsRevision: 0,
        isFilterTubeFilteringEnabled: () => false,
        releaseDisabledDirectAccessState: () => events.push('native'),
        getDirectAccessState: () => ({ videoId }), installDirectAccessPlayGuard() {},
        retainVerifiedVideoMetadata: () => events.push('native'),
        applyManagedViewingRouteGate: () => true, releaseManagedTimeLimitRuntime() {},
        ensureManagedTimeoutPlayGuard: () => events.push('native'),
        removeManagedTimeLimitStatus() {}, pauseManagedTimeoutVideos() {},
        document: { body: null, documentElement: name === 'showManagedViewingBlockedOverlay'
          ? { setAttribute: () => events.push('native') } : null,
          querySelector: () => video, getElementById: () => null,
          createElement() { throw new Error('stop after the existing native denial flag'); } }
      });
      vm.runInContext(productionFunction(text, name), context);
      context[name](...args);
      assert.deepEqual(events, mode === 'absent' ? ['native'] : ['hook', 'native']);
    }
  });
}

function storageFixture(mode = 'present') {
  const events = [];
  const window = {};
  if (mode !== 'absent') window.FilterTubeContentPlayback = { invalidate(reason) {
    events.push(['invalidate', reason]);
    if (mode === 'throws') throw new Error('unavailable controller');
  } };
  const context = vm.createContext({ window,
    scheduleSettingsRefreshFromStorage: options => events.push(['refresh', options.forceReprocess]) });
  const start = bridgeSource.indexOf('const FILTERTUBE_METADATA_ONLY_CHANNEL_FIELDS');
  const end = bridgeSource.indexOf('\ntry {\n    browserAPI_BRIDGE.storage.onChanged', start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(bridgeSource.slice(start, end), context);
  return { events, change: (changes, area = 'local') => context.handleStorageChanges(changes, area) };
}

test('actual storage profile and rule changes revoke before the queued refresh', () => {
  for (const changes of [
    { ftProfilesV4: { oldValue: { activeProfileId: 'a' }, newValue: { activeProfileId: 'b' } } },
    { uiKeywords: { oldValue: [], newValue: [{ word: 'blocked' }] } },
    { hideSponsoredCards: { oldValue: true, newValue: false } }
  ]) {
    const state = storageFixture(); state.change(changes);
    assert.deepEqual(state.events, [['invalidate', 'storage_settings_changed'], ['refresh', true]]);
  }
});

test('actual metadata-map refreshes and enrichment-only writes preserve their existing fast paths', () => {
  for (const key of ['videoChannelMap', 'videoMetaMap']) {
    const state = storageFixture(); state.change({ [key]: { newValue: {} } });
    assert.deepEqual(state.events, [['refresh', false]]);
  }
  const mixed = storageFixture();
  mixed.change({ videoMetaMap: { newValue: {} }, videoChannelMap: { newValue: {} } });
  assert.deepEqual(mixed.events, [['refresh', true]], 'existing mixed-map reprocess behavior remains');
  const channel = { id: `UC${'a'.repeat(22)}`, name: 'Old', logo: 'old', filterAll: false };
  for (const changes of [
    { channelMap: { newValue: {} } },
    { filterChannels: { oldValue: [channel], newValue: [{ ...channel, name: 'Resolved', logo: 'new' }] } },
    { ftProfilesV4: { oldValue: { activeProfileId: 'a' }, newValue: { activeProfileId: 'a' } },
      ftImportedChannelMetadataRevision: { oldValue: 1, newValue: 2 } }
  ]) {
    const state = storageFixture(); state.change(changes);
    assert.deepEqual(state.events, []);
  }
});

test('storage hooks never suppress original refresh when the controller is absent or throws', () => {
  for (const mode of ['absent', 'throws']) {
    const state = storageFixture(mode); state.change({ enabled: { newValue: false } });
    assert.deepEqual(state.events, mode === 'absent' ? [['refresh', true]]
      : [['invalidate', 'storage_settings_changed'], ['refresh', true]]);
  }
  const remote = storageFixture(); remote.change({ enabled: { newValue: false } }, 'sync');
  assert.deepEqual(remote.events, []);
});

test('an enrichment marker cannot hide a simultaneous profile, rule or parent-control change', () => {
  const before = { activeProfileId: 'parent-a', profiles: { 'parent-a': {
    settings: { allowMainViewing: true }, main: { keywords: [] }
  } } };
  for (const after of [
    { ...before, activeProfileId: 'child-a' },
    { ...before, profiles: { 'parent-a': { settings: { allowMainViewing: true }, main: { keywords: ['blocked'] } } } },
    { ...before, profiles: { 'parent-a': { settings: { allowMainViewing: false }, main: { keywords: [] } } } }
  ]) {
    const state = storageFixture();
    state.change({ ftProfilesV4: { oldValue: before, newValue: after },
      ftImportedChannelMetadataRevision: { oldValue: 1, newValue: 2 } });
    assert.deepEqual(state.events, [['invalidate', 'storage_settings_changed'], ['refresh', true]]);
  }
  const missing = storageFixture();
  missing.change({ ftProfilesV4: { newValue: before }, ftImportedChannelMetadataRevision: { newValue: 1 } });
  assert.deepEqual(missing.events, [['invalidate', 'storage_settings_changed'], ['refresh', true]]);
});

test('a revision-marked pure channel enrichment still skips invalidation and refresh', () => {
  const channel = { id: `UC${'b'.repeat(22)}`, name: 'Old', logo: 'old', filterAll: false };
  const profile = channels => ({ activeProfileId: 'parent-a', profiles: { 'parent-a': {
    settings: { allowMainViewing: true }, main: { channels, keywords: [] }
  } } });
  const state = storageFixture();
  state.change({ ftProfilesV4: { oldValue: profile([channel]),
    newValue: profile([{ ...channel, name: 'Resolved', logo: 'new', handle: '@resolved' }]) },
    ftImportedChannelMetadataRevision: { oldValue: 1, newValue: 2 },
    ftBlockTubeEnrichmentJobV1: { oldValue: { running: true }, newValue: { running: false } } });
  assert.deepEqual(state.events, []);
});
