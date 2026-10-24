import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/content/bridge_settings.js', 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a); return source.slice(a, b);
}
function policy(overrides = {}) {
  return { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
    profileId: 'child-1', timezone: 'UTC', dailyBudgetSeconds: 60,
    countingMode: 'active_youtube_tab', activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
    resetPolicy: 'policy_timezone_midnight', policyRevision: 4, policyHash: 'policy-four', ...overrides };
}
function fixture({ at = Date.parse('2026-10-22T12:00:00Z'), policyOverrides = {} } = {}) {
  let clock = at;
  const listeners = new Map(), timers = new Map(), calls = [], invalidations = [], queries = [];
  let timerId = 0, refreshes = 0, exhausted = false;
  const settings = { activeProfileId: 'child-1', activeProfileKind: 'child', profileType: 'main',
    managedTimeLimitPolicy: policy(policyOverrides) };
  const location = { href: 'https://www.youtube.com/watch?v=C-dvTjK_07c' };
  const window = {
    addEventListener(name, fn) { const list = listeners.get(name) || []; list.push(fn); listeners.set(name, list); },
    removeEventListener(name, fn) { listeners.set(name, (listeners.get(name) || []).filter(value => value !== fn)); },
    FilterTubeContentPlayback: { invalidate(reason) { invalidations.push(reason); }, refresh() { refreshes++; } }, postMessage() {}
  };
  class ClockDate extends Date { constructor(value) { super(value === undefined ? clock : value); } static now() { return clock; } }
  const browserAPI_BRIDGE = { runtime: { lastError: null,
    sendMessage(request, callback) { calls.push({ request, callback }); } } };
  const context = vm.createContext({ window, location, currentSettings: settings, latestSettings: settings,
    browserAPI_BRIDGE, URL, Intl, Date: ClockDate, queueMicrotask,
    document: { visibilityState: 'visible', hasFocus: () => true,
      querySelectorAll(selector) { queries.push(selector); return context.videos || []; } },
    setInterval(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay, kind: 'interval' }); return id; },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay, kind: 'timeout' }); return id; },
    clearTimeout(id) { timers.delete(id); },
    clearInterval(id) { timers.delete(id); },
    removeManagedTimeLimitStatus() {}, removeManagedTimeoutOverlay() { exhausted = false; },
    showManagedTimeoutOverlay() { exhausted = true; }, showManagedTimeLimitStatus() {},
    mainWorldSettingsDispatchRevision: 0, retainVerifiedVideoMetadata() {}, applyManagedViewingRouteGate: () => false,
    tryApplySettingsToSeed: () => true, refreshRuntimeObserversAfterSettingsUpdate() {}, scheduleSettingsRefreshFromStorage() {}
  });
  vm.runInContext([
    section('const MANAGED_VIEWING_ROUTE_GATE_OVERLAY_ID', 'function classifyManagedViewingRoute(rawUrl)'),
    section('function classifyManagedViewingRoute(rawUrl)', 'function getManagedViewingRouteGatePolicy(settings)'),
    section('function normalizeManagedTimeLimitInteger(value)', 'function removeManagedTimeoutOverlay()'),
    section('function isManagedTimeLimitTabActive()', 'function requestSettingsFromBackground(options = {})'),
    section('function sendSettingsToMainWorld(settings)', 'let pendingStorageRefreshTimer'),
    section('const FILTERTUBE_METADATA_ONLY_CHANNEL_FIELDS', '\ntry {\n    browserAPI_BRIDGE.storage.onChanged'),
    'this.controls = { sendManagedTimeLimitHeartbeat, releaseManagedTimeLimitRuntime, applyManagedTimeLimitRuntime, sendSettingsToMainWorld, handleStorageChanges };'
  ].join('\n'), context);
  const read = (overrides = {}) => window.FilterTubeManagedPlaybackPermit.read({
    settings: context.currentSettings, videoId: 'C-dvTjK_07c', href: location.href, ...overrides });
  const dateKey = (stamp, zone) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(stamp));
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  };
  function reply(overrides = {}, call = calls.at(-1)) {
    const p = call.request.policy;
    call.callback({ ok: true, enforced: true, timedOut: false, remainingSeconds: 60,
      profileId: p.profileId, policyRevision: p.policyRevision, policyHash: p.policyHash,
      surface: 'main', policySource: 'compiled_active_profile', requestPolicyMatched: true,
      dateKey: dateKey(clock, p.timezone), ...overrides });
  }
  function emit(name) { for (const fn of [...(listeners.get(name) || [])]) fn({ type: name }); }
  return { context, settings, location, calls, window, invalidations, timers, queries, read, reply, emit,
    send: () => context.controls.sendManagedTimeLimitHeartbeat(), setTime: value => { clock = value; },
    time: () => clock, refreshes: () => refreshes, exhausted: () => exhausted, start: at, api: browserAPI_BRIDGE };
}

test('actual heartbeat reply alone publishes a frozen isolated-world permit', () => {
  const f = fixture(); assert.equal(f.read(), null); f.send(); assert.equal(f.read(), null);
  f.reply(); const receipt = f.read(); assert.ok(receipt); assert.equal(receipt.decision, 'allowed');
  assert.equal(receipt.expiresAt, f.start + 7000); assert.ok(Object.isFrozen(receipt));
  assert.deepEqual(Object.keys(f.window.FilterTubeManagedPlaybackPermit), ['read']);
  assert.ok(Object.isFrozen(f.window.FilterTubeManagedPlaybackPermit));
  f.setTime(f.start + 500); assert.equal(f.read(), receipt, 'reading does not extend allowance');
});

for (const [name, response] of [
  ['not ok', { ok: false }], ['not enforced', { enforced: false }], ['no timeout verdict', { timedOut: undefined }],
  ['timeout', { timedOut: true }], ['wrong profile', { profileId: 'child-2' }], ['wrong surface', { surface: 'kids' }],
  ['wrong revision', { policyRevision: 5 }], ['wrong hash', { policyHash: 'other' }],
  ['unmatched request policy', { requestPolicyMatched: false }], ['unknown policy source', { policySource: 'page' }],
  ['no remaining time', { remainingSeconds: 0 }], ['string remaining time', { remainingSeconds: '60' }],
  ['infinite budget', { remainingSeconds: Infinity }], ['wrong date', { dateKey: '2026-10-21' }]
]) {
  test(`heartbeat ${name} cannot authorize or retain owned playback`, () => {
    const f = fixture(); f.send(); f.reply(); assert.ok(f.read()); f.send(); f.reply(response);
    assert.equal(f.read(), null); assert.equal(f.invalidations.at(-1), 'managed_time_authority_changed');
  });
}

test('slow callback cannot create a new seven-second window from response time', () => {
  const f = fixture(); f.send(); f.setTime(f.start + 6500); f.reply();
  assert.equal(f.read().expiresAt, f.start + 7000); f.setTime(f.start + 7000); assert.equal(f.read(), null);
  const expired = fixture(); expired.send(); expired.setTime(expired.start + 7001); expired.reply(); assert.equal(expired.read(), null);
});

test('short remaining budget and policy expiry cap the permit from request start', () => {
  const remaining = fixture(); remaining.send(); remaining.reply({ remainingSeconds: 2 });
  assert.equal(remaining.read().expiresAt, remaining.start + 2000);
  const validUntil = Date.parse('2026-10-22T12:00:00Z') + 900;
  const deadline = fixture({ policyOverrides: { validUntil } }); deadline.send(); deadline.reply();
  assert.equal(deadline.read().expiresAt, validUntil);
  const grant = fixture({ policyOverrides: { parentGrant: { enabled: true, expiresAt: validUntil + 100 } } });
  grant.send(); grant.reply(); assert.equal(grant.read().expiresAt, validUntil + 100);
});

for (const [zone, start, end] of [
  ['UTC', '2026-10-22T23:59:56Z', '2026-10-23T00:00:00Z'],
  ['Asia/Kolkata', '2026-10-22T18:29:56Z', '2026-10-22T18:30:00Z']
]) {
  test(`permit ends at ${zone} policy midnight rather than carrying yesterday's budget`, () => {
    const f = fixture({ at: Date.parse(start), policyOverrides: { timezone: zone } }); f.send(); f.reply();
    assert.equal(f.read().expiresAt, Date.parse(end)); f.setTime(Date.parse(end)); assert.equal(f.read(), null);
  });
}

test('future and expired policy windows fail closed', () => {
  for (const overrides of [{ validFrom: Date.parse('2026-10-22T12:00:01Z') }, { validUntil: Date.parse('2026-10-22T11:59:59Z') }]) {
    const f = fixture({ policyOverrides: overrides }); f.send(); f.reply(); assert.equal(f.read(), null);
  }
});

test('a permit requires exact settings, route, profile and video identity', () => {
  const f = fixture(); f.send(); f.reply(); assert.ok(f.read());
  assert.equal(f.read({ settings: { ...f.settings } }), null);
  assert.equal(f.read({ href: 'https://www.youtube.com/watch?v=8OO1pOqRJkA' }), null);
  assert.equal(f.read({ videoId: '8OO1pOqRJkA' }), null);
  f.settings.managedTimeLimitPolicy.policyHash = 'changed'; assert.equal(f.read(), null);
});

for (const [field, value] of [['activeProfileId', 'child-2'], ['activeProfileKind', 'account'], ['profileType', 'kids']]) {
  test(`in-place ${field} changes revoke a previously read permit`, () => {
    const f = fixture(); f.send(); f.reply(); assert.ok(f.read()); f.settings[field] = value; assert.equal(f.read(), null);
  });
}

test('a callback cannot authorize a replacement settings object even when its fields match', () => {
  const f = fixture(); f.send(); f.context.currentSettings = { ...f.settings }; f.reply(); assert.equal(f.read(), null);
});

for (const name of ['yt-navigate-start', 'popstate', 'hashchange', 'pagehide']) {
  test(`${name} revokes synchronously and old callbacks cannot revive a same-URL session`, () => {
    const f = fixture(); f.send(); f.reply(); f.send(); const old = f.calls.at(-1);
    f.emit(name); assert.equal(f.read(), null); assert.equal(f.invalidations.at(-1), 'managed_time_navigation');
    f.reply({}, old); assert.equal(f.read(), null);
  });
}

test('new settings clear old authority before a fresh asynchronous heartbeat', () => {
  const f = fixture(); f.send(); f.reply(); assert.ok(f.read());
  const next = { ...f.settings }; f.context.controls.sendSettingsToMainWorld(next);
  assert.equal(f.read(), null); assert.ok(f.invalidations.includes('managed_time_settings_changed'));
  f.reply(); assert.ok(f.read());
});

test('profile storage changes revoke before the queued settings refresh and reject old callbacks', () => {
  const f = fixture(); f.send(); f.reply(); f.send(); const old = f.calls.at(-1);
  f.context.controls.handleStorageChanges({ ftProfilesV4: { oldValue: { activeProfileId: 'a' }, newValue: { activeProfileId: 'b' } } }, 'local');
  assert.equal(f.read(), null); assert.ok(f.invalidations.includes('managed_time_storage_changed'));
  f.reply({}, old); assert.equal(f.read(), null);
});

test('pure metadata enrichment leaves the already bound time receipt intact', () => {
  const f = fixture(); f.send(); f.reply(); const receipt = f.read();
  f.context.controls.handleStorageChanges({ videoMetaMap: { newValue: {} } }, 'local');
  assert.equal(f.read(), receipt);
});

test('runtime errors, no-work callbacks and release clear existing permits', () => {
  const error = fixture(); error.send(); error.reply(); error.api.runtime.lastError = { message: 'offline' };
  error.send(); error.reply(); assert.equal(error.read(), null); assert.equal(error.invalidations.at(-1), 'managed_time_heartbeat_error');
  const release = fixture(); release.send(); release.reply(); release.context.controls.releaseManagedTimeLimitRuntime();
  assert.equal(release.read(), null); assert.equal(release.invalidations.at(-1), 'managed_time_runtime_released');
  const thrown = fixture(); thrown.send(); thrown.reply(); thrown.api.runtime.sendMessage = () => { throw new Error('closed'); };
  thrown.send(); assert.equal(thrown.read(), null);
});

test('backwards clocks cannot retain a permit', () => {
  const f = fixture(); f.send(); f.reply(); f.setTime(f.start - 1); assert.equal(f.read(), null);
});

test('new periodic heartbeat refreshes authority while reads never extend its lifetime', () => {
  const f = fixture(); f.send(); f.reply(); const first = f.read();
  f.setTime(f.start + 5000); f.send(); f.reply(); const second = f.read();
  assert.notEqual(second, first); assert.equal(second.expiresAt, f.start + 12000);
  f.setTime(f.start + 11999); assert.equal(f.read().expiresAt, second.expiresAt);
  f.setTime(f.start + 12000); assert.equal(f.read(), null);
});

test('no configured policy preserves the no-work path without extra heartbeat requests', () => {
  const f = fixture(); delete f.settings.managedTimeLimitPolicy; f.send(); assert.equal(f.calls.length, 0); assert.equal(f.read(), null);
});

test('existing heartbeat counts owned and native video playback once per tab', () => {
  const f = fixture(); f.context.videos = [{ paused: false, ended: false, readyState: 4 }, { paused: false, ended: false, readyState: 4 }];
  f.send(); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].request.playing, true);
  assert.equal(f.queries[0], 'video:not([data-filtertube-managed-overlay-background="true"])');
});


test('authoritative permit publication schedules a fresh automatic admission check', async () => {
  const f = fixture(); f.send(); f.reply();
  assert.equal(f.refreshes(), 0, 'publication finishes before automatic coordinator rechecks');
  await Promise.resolve(); assert.equal(f.refreshes(), 1); assert.ok(f.read());
  f.send(); f.reply({ ok: false }); await Promise.resolve();
  assert.equal(f.refreshes(), 1, 'failed heartbeats cannot wake source discovery'); assert.equal(f.read(), null);
});

for (const [name, deliver] of [
  ['runtime IPC failure', f => { f.api.runtime.lastError = { message: 'worker unavailable' }; f.reply(); }],
  ['missing callback data', f => f.calls.at(-1).callback(undefined)],
  ['no-work response from a competing or hidden tab', f => f.reply({ enforced: false })],
  ['stale successful-looking policy', f => f.reply({ policyRevision: 3 })],
  ['different profile successful-looking policy', f => f.reply({ profileId: 'child-2' })],
  ['same profile invalid date', f => f.reply({ dateKey: '2026-10-21' })],
  ['inconsistent timeout verdict', f => f.reply({ timedOut: false, remainingSeconds: 0 })]
]) {
  test(`exhausted lock survives ${name} until fresh authority explicitly recovers it`, () => {
    const f = fixture(); f.send(); f.reply({ timedOut: true, remainingSeconds: 0 });
    assert.equal(f.exhausted(), true); f.context.document.visibilityState = 'hidden'; f.context.document.hasFocus = () => false;
    f.send(); deliver(f); assert.equal(f.exhausted(), true); assert.equal(f.read(), null);
    f.api.runtime.lastError = null; f.send(); f.reply({ remainingSeconds: 30 });
    assert.equal(f.exhausted(), false, 'fresh matching allowance can recover the lock'); assert.ok(f.read());
  });
}

test('timeout keeps exhaustion locked, drains pending work and ignores the old callback', () => {
  const f = fixture(); f.send(); f.reply({ timedOut: true, remainingSeconds: 0 });
  f.send(); const old = f.calls.at(-1); f.send();
  const timeout = [...f.timers.values()].find(timer => timer.kind === 'timeout'); assert.ok(timeout);
  f.setTime(f.start + 7000); timeout.fn();
  assert.equal(f.exhausted(), true); assert.equal(f.calls.length, 3, 'one queued request begins after timeout');
  f.reply({ remainingSeconds: 60 }, old); assert.equal(f.exhausted(), true); assert.equal(f.read(), null);
  f.reply({ remainingSeconds: 30 }); assert.equal(f.exhausted(), false); assert.ok(f.read());
});

test('an expired matching policy denial locks without needing a daily ledger row', () => {
  const f = fixture({ policyOverrides: { validUntil: Date.parse('2026-10-22T11:59:59Z') } });
  f.send(); f.reply({ timedOut: true, remainingSeconds: 0, dateKey: undefined, reason: 'expired_policy_requires_parent_revalidation' });
  assert.equal(f.exhausted(), true); assert.equal(f.read(), null);
});

test('a callback stale across authoritative settings cannot unlock exhaustion or strand a pending request', () => {
  const f = fixture(); f.send(); f.reply({ timedOut: true, remainingSeconds: 0 });
  f.send(); const old = f.calls.at(-1); f.context.currentSettings = { ...f.settings }; f.send();
  f.reply({}, old); assert.equal(f.exhausted(), true); assert.equal(f.read(), null);
  assert.equal(f.calls.length, 3); f.reply(); assert.equal(f.exhausted(), false); assert.ok(f.read());
});

test('fresh authoritative disabled settings remove an exhausted lock and make old callbacks inert', () => {
  const f = fixture(); f.send(); f.reply({ timedOut: true, remainingSeconds: 0 }); f.send(); const old = f.calls.at(-1);
  const next = { ...f.settings, managedTimeLimitPolicy: { ...f.settings.managedTimeLimitPolicy, enabled: false } };
  f.context.controls.sendSettingsToMainWorld(next);
  assert.equal(f.exhausted(), false); assert.equal(f.read(), null); assert.equal(f.calls.length, 2);
  f.reply({}, old); assert.equal(f.exhausted(), false); assert.equal(f.read(), null);
  assert.equal([...f.timers.values()].some(timer => timer.kind === 'timeout'), false);
});
