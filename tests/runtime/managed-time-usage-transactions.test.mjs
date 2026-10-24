import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/background.js', 'utf8');
const ioSource = fs.readFileSync('js/io_manager.js', 'utf8');
const KEY = 'ftManagedTimeUsageV1';
const ROOT = 'ftProfilesV4';
const START = Date.parse('2026-10-25T12:00:00Z');
function section(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start); return text.slice(a, b);
}
function policy(overrides = {}) {
  return { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
    timezone: 'UTC', dailyBudgetSeconds: 60, policyRevision: 1, policyHash: 'first-policy', issuedAt: 0, ...overrides };
}
function fixture({ firefox = false, policyOverrides = {} } = {}) {
  let clock = START, hooks = {}, reads = 0, writes = 0;
  const context = vm.createContext({ URL, Intl, console, structuredClone, DEFAULT_PROFILE_ID: 'default',
    FT_PROFILES_V4_KEY: ROOT, MANAGED_TIME_USAGE_STORAGE_KEY: KEY,
    MANAGED_TIME_USAGE_SCHEMA: 'filtertube_managed_time_usage', IS_FIREFOX: firefox });
  // Persist the real import/persistence normalizer's profile shape, then execute
  // the real compiler's policy block. Compiled metadata must not break matching.
  vm.runInContext(ioSource.replace('global.FilterTubeIO = {', 'global.sanitizeTestProfiles = sanitizeProfilesV4; global.FilterTubeIO = {'), context);
  let store = JSON.parse(JSON.stringify(context.sanitizeTestProfiles({ schemaVersion: 4, activeProfileId: 'child-1', profiles: {
    default: { id: 'default', type: 'account', name: 'Parent', settings: {}, main: {}, kids: {} },
    'child-1': { id: 'child-1', type: 'child', parentProfileId: 'default', name: 'Child',
      settings: { timeLimitPolicy: policy(policyOverrides) }, main: {}, kids: {} },
    'child-2': { id: 'child-2', type: 'child', parentProfileId: 'default', name: 'Other child',
      settings: { timeLimitPolicy: policy({ ...policyOverrides, policyHash: 'second-policy' }) }, main: {}, kids: {} }
  } })));
  store = { [ROOT]: store };
  class ClockDate extends Date { constructor(value) { super(value === undefined ? clock : value); } static now() { return clock; } }
  context.Date = ClockDate;
  const runtime = { lastError: null };
  const get = async keys => {
    reads++; await hooks.beforeGet?.({ keys, reads, store });
    if (hooks.failGet) { hooks.failGet = false; throw new Error('read_failed'); }
    return structuredClone(Object.fromEntries(keys.filter(key => key in store).map(key => [key, store[key]])));
  };
  const set = async data => {
    writes++; await hooks.beforeSet?.({ data, writes, store });
    if (hooks.failSet) { hooks.failSet = false; throw new Error('write_failed'); }
    if (hooks.dropSet) { hooks.dropSet = false; return; }
    Object.assign(store, structuredClone(data));
    await hooks.afterSet?.({ data, writes, store });
  };
  const local = firefox ? {
    get(...args) { assert.equal(args.length, 1, 'Firefox storage.get rejects callback arguments'); return get(args[0]); },
    set(...args) { assert.equal(args.length, 1, 'Firefox storage.set rejects callback arguments'); return set(args[0]); }
  } : Object.fromEntries(Object.entries({ get, set }).map(([name, fn]) => [name, (value, callback) => {
    assert.equal(typeof callback, 'function', 'Chrome callback-only adapter');
    fn(value).then(result => callback(result), error => {
      runtime.lastError = { message: error.message }; callback(); runtime.lastError = null;
    });
    return undefined;
  }]));
  context.browserAPI = { runtime, storage: { local } };
  vm.runInContext([
    section(source, 'function safeObject(value)', 'function buildAutoBackupPayload('),
    section(source, 'const MANAGED_TIME_HEARTBEAT_STALE_MS', 'function getManagedActionHistoryRowTimeForBackground('),
    section(source, 'async function handleManagedTimeLimitHeartbeat(', 'async function getTimedOutManagedProfileContext('),
    `this.compileTestPolicy = function(root) { const activeProfileId = root.activeProfileId;
      const activeProfile = root.profiles[activeProfileId]; const activeSettings = activeProfile.settings; const compiledSettings = { activeProfileId };
      ${section(source, '            const timeLimitPolicy = normalizeManagedTimeLimitPolicy(activeSettings.timeLimitPolicy);', '            const rawWhitelistKeywords')}
      return compiledSettings; }; this.clearOwners = () => managedTimeActiveScopes.clear();
      this.restartAccounting = () => { managedTimeActiveScopes.clear(); managedTimeUnconfirmedScopes.clear(); managedTimeAccountingGeneration++; };`
  ].join('\n'), context);
  context.isTrustedUiSender = () => true;
  context.storageGet = keys => context.managedTimeStorage('get', keys);
  context.getCompiledSettings = async () => {
    const compiled = context.compileTestPolicy(structuredClone(store[ROOT]));
    await hooks.afterCompile?.({ compiled, store }); return compiled;
  };
  async function call(tabId = 1, overrides = {}) {
    const compiled = context.compileTestPolicy(structuredClone(store[ROOT]));
    let response;
    await context.handleManagedTimeLimitHeartbeat({ profileId: compiled.activeProfileId, policy: compiled.managedTimeLimitPolicy,
      visible: true, focused: true, playing: true, ...overrides },
      { url: 'https://www.youtube.com/watch?v=abcdefghijk', tab: { id: tabId } }, value => { response = value; });
    return response;
  }
  async function status() {
    let response; await context.handleManagedTimeLimitStateQuery({}, {}, value => { response = value; }); return response;
  }
  function notifyProfileChange(previous) {
    context.invalidateManagedTimeAccountingForProfileChange({ oldValue: previous, newValue: structuredClone(store[ROOT]) });
  }
  return { call, status, notifyProfileChange, context, store, hooks: value => { hooks = value; }, at: value => { clock = value; },
    tick: delta => { clock += delta; }, usage: (id = store[ROOT].activeProfileId) =>
      Object.values(store[KEY]?.rows || {}).find(row => row.profileId === id), writes: () => writes };
}

for (const firefox of [false, true]) {
  test(`actual ${firefox ? 'Promise-only Firefox' : 'callback-only Chrome'} transaction serializes competing tabs without losing usage`, async () => {
    const f = fixture({ firefox }); assert.equal((await f.call()).ok, true); f.tick(5000);
    const [owner, competitor] = await Promise.all([f.call(1), f.call(2)]);
    assert.equal(owner.countedSeconds, 5); assert.equal(competitor.countedSeconds, 0);
    assert.equal(competitor.consumedSeconds, 5); assert.equal(f.usage().consumedSeconds, 5);
  });
  test(`actual ${firefox ? 'Firefox rejection' : 'Chrome lastError'} leaves the counting anchor intact and queue recoverable`, async () => {
    const f = fixture({ firefox }); await f.call(); f.tick(5000);
    f.hooks({ failSet: true }); assert.equal((await f.call()).error, 'write_failed');
    assert.equal(f.usage().consumedSeconds, 0); f.tick(500);
    assert.equal((await f.call()).countedSeconds, 5); assert.equal(f.usage().consumedSeconds, 5);
    f.hooks({ failGet: true }); f.tick(1000); assert.equal((await f.call()).error, 'read_failed');
    assert.equal((await f.call()).countedSeconds, 1);
  });
}

test('real normalized persisted child policy matches compiled policy with profile metadata', async () => {
  const f = fixture({ policyOverrides: { timezone: ' Asia/Kolkata ', dailyBudgetSeconds: '60', parentGrant: { enabled: false } } });
  const raw = f.store[ROOT].profiles['child-1'].settings.timeLimitPolicy;
  assert.equal(raw.timezone, 'Asia/Kolkata'); assert.equal(raw.dailyBudgetSeconds, 60);
  const compiled = f.context.compileTestPolicy(f.store[ROOT]).managedTimeLimitPolicy;
  assert.equal(compiled.profileId, 'child-1'); assert.equal(compiled.profileName, 'Child'); assert.equal(compiled.policySource, 'local_profile_settings');
  assert.equal((await f.call()).ok, true);
});

test('subsecond heartbeats accumulate elapsed seconds instead of erasing fractions', async () => {
  const f = fixture(); await f.call();
  for (let i = 0; i < 10; i++) { f.tick(500); await f.call(); }
  assert.equal(f.usage().consumedSeconds, 5);
});

test('successfully acknowledged but dropped writes neither permit playback nor advance the anchor', async () => {
  const f = fixture(); await f.call(); f.tick(5000); f.hooks({ dropSet: true });
  const failed = await f.call(); assert.equal(failed.ok, false); assert.equal(failed.error, 'managed_time_usage_not_persisted');
  assert.equal(f.usage().consumedSeconds, 0); f.tick(500);
  const retry = await f.call(); assert.equal(retry.countedSeconds, 5); assert.equal(retry.consumedSeconds, 5);
});

test('serialization preserves unrelated profile rows while the active profile changes', async () => {
  const f = fixture(); await f.call(); f.tick(5000);
  let switchOnce = true;
  f.hooks({ afterSet({ store }) { if (switchOnce) { switchOnce = false; store[ROOT].activeProfileId = 'child-2'; } } });
  const old = await f.call(); assert.equal(old.ok, false); assert.equal(old.reason, 'active_profile_policy_changed');
  const next = await f.call(2); assert.equal(next.ok, true);
  assert.equal(f.usage('child-1').consumedSeconds, 5); assert.equal(f.usage('child-2').consumedSeconds, 0);
});

for (const point of ['afterCompile', 'beforeSet']) {
  test(`policy/profile changes at ${point} cannot produce a stale successful allowance`, async () => {
    const f = fixture(); let once = true;
    f.hooks({ [point]({ store }) { if (once) { once = false; store[ROOT].activeProfileId = 'child-2'; } } });
    assert.equal((await f.call()).ok, false);
    assert.equal((await f.call(2)).ok, true);
  });
}

test('a policy disabled during the fresh read cannot be enforced from cached compilation', async () => {
  const f = fixture(); f.hooks({ afterCompile({ store }) { store[ROOT].profiles['child-1'].settings.timeLimitPolicy.enabled = false; } });
  assert.equal((await f.call()).ok, false); assert.equal(f.writes(), 0);
  assert.equal((await f.call()).enforced, false);
});

test('stale requested policy cannot spend another active profile budget', async () => {
  const f = fixture(); const request = f.context.compileTestPolicy(f.store[ROOT]); f.store[ROOT].activeProfileId = 'child-2';
  const reply = await f.call(2, { profileId: request.activeProfileId, policy: request.managedTimeLimitPolicy });
  assert.equal(reply.ok, false); assert.equal(f.writes(), 0);
});

test('sleep remains bounded, restart preserves consumption and timezone midnight starts a new row', async () => {
  const f = fixture({ policyOverrides: { timezone: 'Asia/Kolkata' } }); await f.call(); f.tick(60000);
  assert.equal((await f.call()).countedSeconds, 10); f.context.clearOwners(); f.tick(5000);
  assert.equal((await f.call()).consumedSeconds, 10); assert.equal((await f.call()).countedSeconds, 0);
  f.at(Date.parse('2026-10-25T18:30:00Z')); const next = await f.call();
  assert.equal(next.dateKey, '2026-10-26'); assert.equal(next.consumedSeconds, 0);
  assert.equal(Object.keys(f.store[KEY].rows).length, 2);
});

test('parent grant expiry across a storage await cannot issue the old larger allowance', async () => {
  const f = fixture({ policyOverrides: { parentGrant: { enabled: true, extraSeconds: 30, expiresAt: START + 1000 } } });
  f.hooks({ beforeSet() { f.tick(1001); } }); const reply = await f.call();
  assert.equal(reply.ok, false); assert.equal(reply.enforced, false);
  f.hooks({}); assert.equal((await f.call()).totalBudgetSeconds, 60);
});

test('authoritative policy changes start a fresh anchor while keeping recorded consumption', async () => {
  const f = fixture(); await f.call(); f.tick(5000); await f.call(); f.tick(60000);
  const p = f.store[ROOT].profiles['child-1'].settings.timeLimitPolicy;
  p.policyRevision++; p.policyHash = 'parent-revised-policy';
  const changed = await f.call(); assert.equal(changed.countedSeconds, 0); assert.equal(changed.consumedSeconds, 5);
  f.tick(1000); assert.equal((await f.call()).countedSeconds, 1);
});

test('an authoritative disabled policy ends the counting session without losing prior consumption', async () => {
  const f = fixture(); await f.call(); f.tick(5000); await f.call();
  const lastRequest = f.context.compileTestPolicy(f.store[ROOT]).managedTimeLimitPolicy;
  const p = f.store[ROOT].profiles['child-1'].settings.timeLimitPolicy; p.enabled = false;
  assert.equal((await f.call(1, { policy: lastRequest })).enforced, false); f.tick(60000); p.enabled = true;
  const resumed = await f.call(); assert.equal(resumed.countedSeconds, 0); assert.equal(resumed.consumedSeconds, 5);
});

test('switching away and back does not charge the old profile for time in another profile', async () => {
  const f = fixture(); await f.call(); f.tick(5000); await f.call();
  f.store[ROOT].activeProfileId = 'child-2'; await f.call(); f.tick(60000);
  f.store[ROOT].activeProfileId = 'child-1'; const resumed = await f.call();
  assert.equal(resumed.countedSeconds, 0); assert.equal(resumed.consumedSeconds, 5);
});

test('overlapping heartbeats across an active-profile transition preserve both saved rows', async () => {
  const f = fixture(); await f.call(); f.tick(5000);
  let release, entered; const held = new Promise(resolve => { release = resolve; });
  const waiting = new Promise(resolve => { entered = resolve; }); let once = true;
  f.hooks({ async beforeGet() { if (once) { once = false; entered(); await held; } } });
  const old = f.call(); await waiting; f.store[ROOT].activeProfileId = 'child-2'; const next = f.call(2); await new Promise(setImmediate);
  assert.equal(f.writes(), 1, 'the second profile cannot write while the first shared transaction is held'); release();
  const replies = await Promise.all([old, next]); assert.equal(replies[0].ok, false); assert.equal(replies[1].ok, true);
  assert.equal(f.usage('child-1').consumedSeconds, 0); assert.equal(f.usage('child-2').consumedSeconds, 0);
});

test('a persisted write whose verification read fails is reconciled without double charging on retry', async () => {
  const f = fixture(); await f.call(); f.tick(5000);
  let failVerification = false;
  f.hooks({ afterSet() { failVerification = true; }, beforeGet() {
    if (failVerification) { failVerification = false; throw new Error('verification_read_failed'); }
  } });
  assert.equal((await f.call()).error, 'verification_read_failed'); assert.equal(f.usage().consumedSeconds, 5);
  f.hooks({}); f.tick(1000); const retry = await f.call();
  assert.equal(retry.countedSeconds, 1); assert.equal(retry.consumedSeconds, 6);
});

for (const dropped of [false, true]) {
  test(`${dropped ? 'dropped' : 'persisted'} write plus failed verification survives read-only queries without lost or duplicate time`, async () => {
    const f = fixture(); await f.call(); f.tick(5000); let verificationPending = false;
    f.hooks({ dropSet: dropped, beforeSet() { verificationPending = true; }, beforeGet() {
      if (verificationPending) { verificationPending = false; throw new Error('verification_failed'); }
    } });
    assert.equal((await f.call()).ok, false); f.hooks({});
    const writesBeforeQuery = f.writes(); const state = await f.status();
    assert.equal(state.consumedSeconds, dropped ? 0 : 5); assert.equal(f.writes(), writesBeforeQuery);
    f.tick(1000); const retried = await f.call();
    assert.equal(retried.countedSeconds, dropped ? 6 : 1); assert.equal(retried.consumedSeconds, 6);
    f.context.restartAccounting(); const afterRestart = await f.status(); assert.equal(afterRestart.consumedSeconds, 6);
    assert.equal((await f.call()).countedSeconds, 0, 'worker restart does not reconstruct an untrusted elapsed anchor');
  });
}

test('an unconfirmed saved anchor cannot reappear after a profile switch away and back', async () => {
  const f = fixture(); await f.call(); f.tick(5000); let pending = false;
  f.hooks({ afterSet() { pending = true; }, beforeGet() { if (pending) { pending = false; throw new Error('verify_failed'); } } });
  assert.equal((await f.call()).ok, false); f.hooks({});
  let old = structuredClone(f.store[ROOT]); f.store[ROOT].activeProfileId = 'child-2'; f.notifyProfileChange(old);
  old = structuredClone(f.store[ROOT]); f.store[ROOT].activeProfileId = 'child-1'; f.notifyProfileChange(old);
  f.tick(1000); const resumed = await f.call(); assert.equal(resumed.countedSeconds, 0); assert.equal(resumed.consumedSeconds, 5);
});

test('an authority change during write verification cannot republish the old counting session', async () => {
  const f = fixture(); await f.call(); f.tick(5000); let once = true;
  f.hooks({ afterSet() { if (once) {
    once = false; const old = structuredClone(f.store[ROOT]);
    f.store[ROOT].profiles['child-1'].settings.timeLimitPolicy.policyHash = 'new-parent-policy'; f.notifyProfileChange(old);
  } } });
  assert.equal((await f.call()).ok, false); f.hooks({}); f.tick(1000);
  const next = await f.call(); assert.equal(next.countedSeconds, 0); assert.equal(next.consumedSeconds, 5);
});
