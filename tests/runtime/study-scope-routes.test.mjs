import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// A parent's signed Study scopes (study, focus_lock, schedule) reach a child by Internet Pickup
// (mailbox) and Home Pickup (local network) as well as live. They ride on the link's time_limits
// permission and never join allowedScopes. This runs the shipped dashboard route handlers against the
// shipped adapter with really signed envelopes (mirrors the app's
// tools/native-nanah-study-scope-routes.test.mjs). On the extension the adapter itself applies a
// study scope (applyManagedStudyPolicy: own fields only, parent ownership of lock/plan) and the profile
// write is direct, so both routes apply through the same guarded path as live.
const read = name => fs.readFileSync(new URL(`../../js/${name}`, import.meta.url), 'utf8');
const tabView = read('tab-view.js');

function tabViewFunction(name) {
  const start = tabView.search(new RegExp(`\\n    (async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const end = tabView.indexOf('\n    }\n', start);
  return tabView.slice(start, end + 7);
}

const ids = { linkId: 'study-link', parentDevice: 'parent-phone', childDevice: 'child-phone', remoteParent: 'mum',
  localParent: 'home', child: 'aarav', publicKeyId: 'managed-1', keyVersion: 1 };

function initialTree(study = {}) {
  return {
    schemaVersion: 4, activeProfileId: ids.child,
    profiles: {
      [ids.localParent]: { type: 'account', parentProfileId: null, name: 'Home', settings: {}, main: { mode: 'blocklist' }, kids: { mode: 'blocklist' } },
      [ids.child]: { type: 'child', name: 'Aarav', parentProfileId: ids.localParent, settings: {},
        main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' },
        study: { version: 1, activePackIds: [], packEdits: {}, plan: null, lock: null,
          progress: { 'child-phone': { '2027-01-11': 50 } }, ...study },
        managedPolicyState: {}, managedActionHistory: [] }
    }
  };
}

const payloads = {
  study: { scope: 'study', replace: true, activePackIds: ['in_upsc_cse'], packEdits: {}, focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 } },
  focus_lock: { scope: 'focus_lock', lock: { sessionId: 'plock-1', sessionKind: 'hard_whitelist', mode: 'gentle',
    startsAt: 1800000000000, endsAt: 1800003600000, setByParentId: 'someone-else' } },
  schedule: { scope: 'schedule', plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'someone-else' }, breakMode: 'normal' },
  main: { scope: 'main', replace: true, data: { mode: 'whitelist' } }
};

async function setup({ allowedScopes = ['main', 'kids', 'time_limits'], study = {} } = {}) {
  const context = vm.createContext({ console, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, Date, Math });
  context.window = context;
  let stored = initialTree(study);
  const writes = [];
  context.FilterTubeIO = {
    exportV3: async () => ({}), importV3: async () => ({ ok: true }),
    loadProfilesV4: async () => JSON.parse(JSON.stringify(stored)),
    saveProfilesV4: async next => { writes.push(next); stored = JSON.parse(JSON.stringify(next)); return { ok: true }; }
  };
  for (const file of ['shared/study_model.js', 'nanah_sync_adapter.js']) {
    vm.runInContext(read(file), context, { filename: file });
  }
  const keys = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
  const link = {
    type: 'managed_link', id: ids.linkId, linkId: ids.linkId, localRole: 'replica', remoteRole: 'source',
    sourceDeviceId: ids.parentDevice, sourceProfileId: ids.remoteParent, targetProfileId: ids.child,
    sourcePublicKeyId: ids.publicKeyId, keyVersion: ids.keyVersion,
    sourcePublicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: privateKeyJwk.x },
    localParentProfileId: ids.localParent, allowedScopes, policy: { allowedScopes }
  };
  const toasts = [];
  context.UIComponents = { showToast: (message, kind) => toasts.push([kind, message]) };
  context.tabViewUiText = (_key, fallback) => fallback;
  context.formatManagedNanahBlockedReason = reason => String(reason || '');
  context.recordManagedNanahPolicyValidationHistory = async () => {};
  context.refreshFilterTubeUiAfterNanahImport = async () => {};
  context.normalizeNonNegativeInteger = value => Number.isInteger(value) && value >= 0 ? value : 0;
  context.trustedLink = link;
  vm.runInContext([
    'let profilesV4Cache = null;',
    'function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }',
    'function normalizeString(value) { return typeof value === "string" ? value.trim() : ""; }',
    tabViewFunction('getManagedNanahPolicyAcceptedState'),
    'function buildManagedNanahPolicyValidationContext(envelope, profilesV4) {',
    '  const profiles = safeObject(safeObject(profilesV4).profiles);',
    `  return { profilesV4, profiles, trustedLink: JSON.parse(JSON.stringify(trustedLink)), targetDeviceId: '${ids.childDevice}',`,
    `    accepted: getManagedNanahPolicyAcceptedState(profiles['${ids.child}'], envelope.linkId, envelope.scope),`,
    `    duplicateDeviceIds: [], signatureVerification: null, historyTargetProfileId: '${ids.child}' };`,
    '}',
    tabViewFunction('handleNanahIncomingManagedMailboxItem'),
    tabViewFunction('handleNanahIncomingManagedLocalNetworkCandidate'),
    'window.routes = { mailbox: handleNanahIncomingManagedMailboxItem, local: handleNanahIncomingManagedLocalNetworkCandidate };'
  ].join('\n'), context);
  const adapter = context.FilterTubeNanahAdapter;
  let revision = 0;
  async function sign(scope, { at = ++revision } = {}) {
    const envelope = { type: 'filtertube_managed_policy', linkId: ids.linkId, scope, targetProfileId: ids.child,
      sourceProfileId: ids.remoteParent, sourceDeviceId: ids.parentDevice, targetDeviceId: ids.childDevice,
      revision: at, sourcePublicKeyId: ids.publicKeyId, keyVersion: ids.keyVersion, issuedAt: 1800000000000,
      payload: payloads[scope] };
    envelope.policyHash = adapter.buildManagedPolicyPayloadHash(envelope);
    return adapter.signManagedPolicyEnvelope({ ...envelope, privateKeyJwk });
  }
  const mailboxItem = envelope => ({
    schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: `mbx-${envelope.scope}-${envelope.revision}`,
    linkId: envelope.linkId, targetProfileId: envelope.targetProfileId, sourceDeviceId: envelope.sourceDeviceId,
    targetDeviceId: envelope.targetDeviceId, sourceProfileId: envelope.sourceProfileId, scope: envelope.scope,
    revision: envelope.revision, policyHash: envelope.policyHash, sourcePublicKeyId: envelope.sourcePublicKeyId,
    keyVersion: envelope.keyVersion, ciphertext: 'c', encryptedDek: 'd', nonce: 'n', decryptedEnvelope: envelope
  });
  const candidate = envelope => ({ peer: { deviceId: ids.parentDevice, source: 'local_network' }, source: 'local_network',
    networkReachable: true, envelope });
  const deliver = { mailbox: envelope => context.routes.mailbox(mailboxItem(envelope)), local: envelope => context.routes.local(candidate(envelope)) };
  return {
    writes, toasts, child: () => stored.profiles[ids.child], sign,
    mailbox: async (scope, options) => deliver.mailbox(await sign(scope, options)),
    local: async (scope, options) => deliver.local(await sign(scope, options)),
    deliver
  };
}

for (const route of ['mailbox', 'local']) {
  test(`${route}: a signed study, focus_lock and schedule apply on the time-limit carrier and keep the child's progress`, async () => {
    const child = await setup();
    for (const scope of ['study', 'focus_lock', 'schedule']) {
      const decision = await child[route](scope);
      assert.equal(decision.accepted, true, `${scope}: ${decision.reason}`);
      assert.equal(decision.applied, true, scope);
    }
    const study = child.child().study;
    assert.deepEqual(Array.from(study.activePackIds), ['in_upsc_cse']);
    assert.equal(study.lock.setByParentId, 'mum', 'the signer, not the payload, owns the lock');
    assert.equal(study.lock.mode, 'locked', 'a parent-set lock is always Locked');
    assert.equal(study.plan.setByParentId, 'mum');
    assert.equal(study.plan.start, '16:00');
    assert.equal(study.breakMode, 'normal');
    assert.deepEqual(JSON.parse(JSON.stringify(study.progress)), { 'child-phone': { '2027-01-11': 50 } });
    assert.equal(child.writes.length, 3);
  });

  test(`${route}: the same parent can change and then end its own lock and plan`, async () => {
    const child = await setup();
    assert.equal((await child[route]('focus_lock')).accepted, true);
    payloads.focus_lock = { scope: 'focus_lock', lock: null };
    payloads.schedule = { scope: 'schedule', plan: null };
    try {
      assert.equal((await child[route]('focus_lock')).accepted, true);
      assert.equal((await child[route]('schedule')).accepted, true);
    } finally {
      payloads.focus_lock = { scope: 'focus_lock', lock: { sessionId: 'plock-1', sessionKind: 'hard_whitelist', mode: 'gentle',
        startsAt: 1800000000000, endsAt: 1800003600000, setByParentId: 'someone-else' } };
      payloads.schedule = { scope: 'schedule', plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'someone-else' }, breakMode: 'normal' };
    }
    assert.equal(child.child().study.lock, null);
    assert.equal(child.child().study.plan, null);
  });

  test(`${route}: without the time-limit carrier a study scope is refused and nothing is saved`, async () => {
    for (const allowedScopes of [['main', 'kids'], ['main', 'study', 'focus_lock', 'schedule']]) {
      const child = await setup({ allowedScopes });
      const decision = await child[route]('schedule');
      assert.equal(decision.accepted, false, allowedScopes.join());
      assert.equal(decision.reason, 'scope_not_allowed');
      assert.equal(child.writes.length, 0);
      assert.equal(child.child().study.plan, null);
    }
  });

  test(`${route}: another parent's lock is never replaced and nothing is saved`, async () => {
    const lock = { sessionId: 'theirs', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'dad' };
    const child = await setup({ study: { lock } });
    let outcome;
    try { outcome = await child[route]('focus_lock'); } catch (error) { outcome = { accepted: false, error }; }
    assert.notEqual(outcome.accepted, true);
    assert.equal(child.writes.length, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(child.child().study.lock)), lock);
  });

  test(`${route}: a replay of an applied study scope does not write again, an older revision is stale`, async () => {
    const child = await setup();
    const envelope = await child.sign('focus_lock', { at: 5 });
    assert.equal((await child.deliver[route](envelope)).applied, true);
    const replay = await child.deliver[route](envelope);
    assert.equal(replay.accepted, true);
    assert.equal(replay.decision, 'idempotent_same_hash');
    const older = await child[route]('focus_lock', { at: 4 });
    assert.equal(older.accepted, false);
    assert.equal(child.writes.length, 1);
  });

  test(`${route}: a 3.6.1 scope keeps its ordinary apply`, async () => {
    const child = await setup();
    const decision = await child[route]('main');
    assert.equal(decision.accepted, true, decision.reason);
    assert.equal(child.child().main.mode, 'whitelist');
    assert.equal(child.child().study.lock, null);
  });
}

test('the mailbox scope check uses the same time-limit carrier rule as live delivery', () => {
  const adapter = read('nanah_sync_adapter.js');
  const start = adapter.indexOf('function validateManagedMailboxItem(');
  const body = adapter.slice(start, adapter.indexOf('\n    }\n', start));
  assert.match(body, /MANAGED_STUDY_SCOPES\.includes\(scope\)\s*\?\s*managedStudyScopeAllowed\(mailboxAllowedScopes\)/);
});
