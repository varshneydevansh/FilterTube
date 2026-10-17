import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const authoritySource = fs.readFileSync(new URL('../../js/managed_admin_authority.js', import.meta.url), 'utf8');
const securitySource = fs.readFileSync(new URL('../../js/security_manager.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function section(a, b) { const i = tab.indexOf(a), j = tab.indexOf(b, i); assert.ok(i > 0 && j > i, a); return tab.slice(i, j); }
function handler(name) {
  const start = tab.indexOf(`                ${name}.addEventListener('click', async () => {`);
  const end = tab.indexOf('\n                });', start);
  assert.ok(start > 0 && end > start);
  return tab.slice(start, end + '\n                });'.length);
}
const cryptoBox = { crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa };
cryptoBox.window = cryptoBox;
vm.runInNewContext(securitySource, cryptoBox);
const security = cryptoBox.FilterTubeSecurity;
const actorPin = 'synthetic-parent-pin';
const oldChildPin = '1111';
const newChildPin = '2222';
const parentVerifier = await security.createPinVerifier(actorPin);
const childVerifier = await security.createPinVerifier(oldChildPin);

function fixture({ actor = 'parent-a', target = 'child', locked = true, session = 'valid', capturedChildRestriction = false, answers = [newChildPin, newChildPin] } = {}) {
  let now = 1_000_000;
  let root = { schemaVersion: 4, activeProfileId: actor, profiles: {
    default: { type: 'account', security: locked ? { masterPinVerifier: clone(parentVerifier) } : {}, main: { keywords: [] } },
    'parent-a': { type: 'account', security: locked ? { profilePinVerifier: clone(parentVerifier) } : {}, main: { keywords: [] } },
    'parent-b': { type: 'account', security: {}, main: { keywords: [] } },
    child: { type: 'child', parentProfileId: 'parent-a', security: { profilePinVerifier: clone(childVerifier), pinVerifier: clone(childVerifier), preservedFlag: true }, settings: { hideShorts: true }, main: { keywords: [{ word: 'keep-rule' }] } }
  } };
  const calls = { writes: [], auth: [], prompts: [], confirmations: 0, hashes: 0, clears: [], locks: [], refreshes: 0, failedPins: 0 };
  let onHash = null, onConfirm = null, onPrompt = null, onFinalRead = null;
  const context = vm.createContext({ Date: { now: () => now } });
  vm.runInContext(authoritySource, context);
  const authority = context.FilterTubeManagedAdminAuthority;
  const sessions = new Map([[actor, authority.createAdminUnlockSession(now)]]), unlocked = new Set([actor]);
  if (session === 'expired') sessions.get(actor).expiresAt = now - 1;
  if (session === 'sensitive-expired') sessions.get(actor).reauthAt = now - 1;
  let reads = 0;
  Object.assign(context, {
    window: {}, profileId: target, childAdminRestricted: capturedChildRestriction, activeProfileId: actor,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getProfileType: authority.getProfileType, ManagedAdminAuthority: authority,
    profileUnlockSessions: sessions, unlockedProfiles: unlocked, sessionMasterPin: '',
    clearProfileUnlockSession: { run: id => { calls.clears.push(id); sessions.delete(id); unlocked.delete(id); } },
    markProfileUnlockSession: { run: id => { sessions.set(id, authority.createAdminUnlockSession(now)); unlocked.add(id); } },
    syncSessionUnlockStateFromBackground: async () => {}, isManagedAdminUnlockRateLimited: () => false,
    getProfileAccessCopy: (_, id) => ({ title: `Unlock ${id}` }),
    showPromptModal: async options => { calls.prompts.push(options.title); await onPrompt?.(options); return answers.shift() ?? null; },
    verifyPin: security.verifyPin,
    recordManagedAdminUnlockFailure: async () => { calls.failedPins += 1; return { rateLimited: false }; },
    clearManagedAdminUnlockFailures: async () => {}, notifyBackgroundUnlocked: async () => {},
    notifyBackgroundLocked: async id => { calls.locks.push(id); },
    refreshProfilesUI: async () => { calls.refreshes += 1; },
    tabViewUiText: (_, fallback) => fallback, UIComponents: { showToast() {} },
    pinBtn: { addEventListener: (_, listener) => { context.setPin = listener; } },
    clearPinBtn: { addEventListener: (_, listener) => { context.clearPin = listener; } }
  });
  context.window.FilterTubeIO = {
    loadProfilesV4: async () => { reads += 1; if (reads === 2) await onFinalRead?.(); return root; },
    saveProfilesV4: async next => { calls.writes.push(clone(next)); root = next; }
  };
  context.window.FilterTubeSecurity = { createPinVerifier: async pin => { calls.hashes += 1; await onHash?.(); return security.createPinVerifier(pin); } };
  context.window.confirm = () => { calls.confirmations += 1; return onConfirm ? onConfirm() : true; };
  vm.runInContext([
    section('    const isProfileUnlockSessionValid = {', '    function safeObject('),
    section('    function extractMasterPinVerifier(', '    function getProfileName('),
    section('    function canActiveProfileManageProfile(', '    function clonePlain('),
    section('    function captureProfileMutationAuthorization(', '    async function updateProfileViewingAccess('),
    section('    async function ensureProfileUnlocked(', '    async function ensureAdminUnlocked('),
    handler('pinBtn'), handler('clearPinBtn')
  ].join('\n'), context);
  const unlock = context.ensureProfileUnlocked;
  context.ensureProfileUnlocked = async (fresh, id, options) => { calls.auth.push({ id, sensitive: options?.sensitiveAction === true }); return unlock(fresh, id, options); };
  return { context, calls, get root() { return root; }, advance: ms => { now += ms; },
    onHash: callback => { onHash = callback; }, onConfirm: callback => { onConfirm = callback; }, onPrompt: callback => { onPrompt = callback; }, onFinalRead: callback => { onFinalRead = callback; },
    run: action => context[action === 'clear' ? 'clearPin' : 'setPin']() };
}

for (const action of ['set', 'clear']) {
  test(`${action}: a fresh child self-actor cannot reuse a parent-rendered row handler`, async () => {
    const f = fixture({ actor: 'child', capturedChildRestriction: false });
    await f.run(action);
    assert.equal(f.calls.writes.length, 0);
    assert.equal(f.calls.auth.length, 0);
    assert.equal(f.calls.prompts.length, 0);
  });
  test(`${action}: an unrelated parent cannot change another parents child PIN`, async () => {
    const f = fixture({ actor: 'parent-b' });
    await f.run(action);
    assert.equal(f.calls.writes.length, 0);
    assert.equal(f.calls.auth.length, 0);
  });
  test(`${action}: the owning parent uses sensitive approval and preserves rules/settings/security metadata`, async () => {
    const f = fixture();
    await f.run(action);
    assert.equal(f.calls.writes.length, 1);
    assert.deepEqual(f.calls.auth, [{ id: 'parent-a', sensitive: true }]);
    assert.equal(f.root.profiles.child.settings.hideShorts, true);
    assert.equal(f.root.profiles.child.main.keywords[0].word, 'keep-rule');
    assert.equal(f.root.profiles.child.security.preservedFlag, true);
    if (action === 'set') assert.equal(await security.verifyPin(newChildPin, f.root.profiles.child.security.profilePinVerifier), true);
    else {
      assert.equal(f.root.profiles.child.security.profilePinVerifier, undefined);
      assert.equal(f.root.profiles.child.security.pinVerifier, undefined);
      assert.deepEqual(f.calls.locks, ['child']);
      assert.equal(f.calls.confirmations, 1);
    }
  });
  test(`${action}: Master and adult self-account retain their existing PIN management authority`, async () => {
    for (const options of [{ actor: 'default' }, { actor: 'parent-a', target: 'parent-a' }]) {
      const f = fixture(options);
      await f.run(action);
      assert.equal(f.calls.writes.length, 1);
      assert.equal(f.calls.auth[0].id, options.actor);
      assert.equal(f.calls.auth[0].sensitive, true);
    }
  });
  test(`${action}: PIN-free parent behavior remains available without mandatory setup`, async () => {
    const f = fixture({ locked: false, session: 'expired' });
    await f.run(action);
    assert.equal(f.calls.writes.length, 1);
    assert.ok(!f.calls.prompts.some(title => title.startsWith('Unlock')));
  });
  test(`${action}: cancelled or incorrect parent approval produces no write`, async () => {
    for (const answer of [null, 'incorrect-parent-pin']) {
      const f = fixture({ session: 'expired', answers: [answer] });
      await f.run(action);
      assert.equal(f.calls.writes.length, 0);
      assert.equal(f.calls.prompts[0], 'Unlock parent-a');
    }
  });
  test(`${action}: final reread rejects actor/owner/type/deletion/verifier changes and expired approval`, async () => {
    for (const change of [
      f => { f.root.activeProfileId = 'child'; },
      f => { f.root.activeProfileId = 'default'; },
      f => { f.root.profiles.child.parentProfileId = 'parent-b'; },
      f => { f.root.profiles.child.type = 'account'; },
      f => { delete f.root.profiles.child; },
      f => { f.root.profiles.child.security.profilePinVerifier.hash = 'changed-target-verifier'; },
      f => { f.root.profiles['parent-a'].security.profilePinVerifier.hash = 'changed-actor-verifier'; },
      f => { f.advance(16 * 60 * 1000); }
    ]) {
      const f = fixture();
      f.onFinalRead(() => change(f));
      await f.run(action);
      assert.equal(f.calls.writes.length, 0);
      assert.equal(f.calls.refreshes, 0);
    }
  });
  test(`${action}: unrelated concurrent profile edits survive the PIN write`, async () => {
    const f = fixture();
    f.onFinalRead(() => { f.root.profiles['parent-b'].name = 'Updated independently'; f.root.profiles.child.settings.unrelatedOption = true; });
    await f.run(action);
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.root.profiles['parent-b'].name, 'Updated independently');
    assert.equal(f.root.profiles.child.settings.unrelatedOption, true);
  });
}

test('Set PIN rejects an actor switch during asynchronous verifier creation', async () => {
  const f = fixture();
  f.onHash(async () => { await Promise.resolve(); f.root.activeProfileId = 'child'; });
  await f.run('set');
  assert.equal(f.calls.hashes, 1);
  assert.equal(f.calls.writes.length, 0);
});

test('Remove PIN preserves its explicit confirmation and rejects a switch during confirmation', async () => {
  const cancelled = fixture();
  cancelled.onConfirm(() => false);
  await cancelled.run('clear');
  assert.equal(cancelled.calls.confirmations, 1);
  assert.equal(cancelled.calls.writes.length, 0);
  const switched = fixture();
  switched.onConfirm(() => { switched.root.activeProfileId = 'child'; return true; });
  await switched.run('clear');
  assert.equal(switched.calls.confirmations, 1);
  assert.equal(switched.calls.writes.length, 0);
});

test('Set PIN cancellation/mismatch never hashes or writes', async () => {
  for (const answers of [[null], [newChildPin, null], [newChildPin, 'different']]) {
    const f = fixture({ answers });
    await f.run('set');
    assert.equal(f.calls.hashes, 0);
    assert.equal(f.calls.writes.length, 0);
  }
});

test('changing accounts during actor PIN approval cannot authorize the old row action', async () => {
  const f = fixture({ session: 'expired', answers: [actorPin, newChildPin, newChildPin] });
  f.onPrompt(async options => { if (options.title === 'Unlock parent-a') f.root.activeProfileId = 'child'; });
  await f.run('set');
  assert.equal(f.calls.writes.length, 0);
});

for (const action of ['set', 'clear']) {
  test(`${action}: expired sensitive approval reauthenticates the adult account`, async () => {
    const f = fixture({ session: 'sensitive-expired', answers: action === 'set' ? [actorPin, newChildPin, newChildPin] : [actorPin] });
    await f.run(action);
    assert.equal(f.calls.writes.length, 1);
    assert.equal(f.calls.prompts[0], 'Unlock parent-a');
    assert.equal(f.calls.auth[0].sensitive, true);
  });
  test(`${action}: sensitive approval expiring during dialogs cancels even while the general session remains valid`, async () => {
    const f = fixture();
    f.onFinalRead(() => f.advance(6 * 60 * 1000));
    await f.run(action);
    assert.equal(f.calls.writes.length, 0);
  });
}
