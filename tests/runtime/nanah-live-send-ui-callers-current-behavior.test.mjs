import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('        if (ftNanahSendBtn) {\n            ftNanahSendBtn.addEventListener');
const end = source.indexOf('        if (ftNanahTrustBtn) {', start);
assert.ok(start >= 0 && end > start);
const handler = source.slice(start, end);
const plain = value => JSON.parse(JSON.stringify(value));
const envelopes = ['keywords', 'channels'].map((scope, index) => Object.freeze({
  scope, linkId: 'saved-link', targetProfileId: 'remote-child', targetProfileName: 'Mira',
  sourceProfileId: 'parent', sourceDeviceId: 'parent-device', issuedAt: 1700000000 + index
}));

function fixture({ route = 'selected', child = false, connected = true, confirmed = true, personal = false, buildHook = null, wrapperHook = null } = {}) {
  const calls = { build: [], wrapper: [], sent: [], replacementSent: [], toasts: [], auth: [], proposals: 0 };
  const originalClient = { async send(envelope) { assert.equal(this, originalClient); calls.sent.push(envelope); } };
  const replacementClient = { async send(envelope) { calls.replacementSent.push(envelope); } };
  const links = [{ linkId: 'saved-link' }];
  const selected = route === 'selected' ? links : [];
  const policy = { linkType: personal ? 'peer_link' : 'managed_link', authorityMode: personal ? 'peer' : 'managed', scope: 'active', strategy: 'merge' };
  const target = { profileId: 'remote-child', profileName: 'Mira' };
  const proposal = { schema: 'personal-proposal' };
  let run;
  const context = {
    window: { FilterTubeNanahAdapter: { buildControlProposal: async () => { calls.proposals += 1; return proposal; } } },
    console: { error() {} },
    ftNanahSendBtn: { addEventListener: (_, listener) => { run = listener; } }, ftNanahManagedTargetsField: { hidden: route !== 'selected' },
    isNanahChildReceiveOnly: () => child,
    nanahClient: originalClient, nanahSessionState: { connected, sasConfirmed: confirmed, remoteDevice: { deviceId: 'remote-device' }, remoteRole: 'replica', remoteProfile: target },
    managedChildEdit: null,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}, normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getNanahScope: () => 'active', getNanahStrategy: () => 'merge', getNanahRole: () => personal ? 'peer' : 'source',
    buildNanahOutgoingProposalPolicy: () => policy,
    getNanahSelectedRemoteTargetProfile: () => target, confirmNanahRemoteTarget: async () => true,
    ensureNanahOutgoingAuth: async (scope, options) => { calls.auth.push([scope, options]); return {}; },
    ensureNanahManagedSigningKeyPair: async () => {}, getNanahSelectedManagedTargetLinks: () => selected,
    getNanahScopeLabel: value => value, getNanahRemoteLabel: () => 'Shared tablet', attachNanahProposalPolicy: envelope => envelope,
    UIComponents: { showToast: (message, tone) => calls.toasts.push({ message, tone }) },
    tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
  };
  async function build(name, passedPolicy, passedLinks) {
    calls.build.push({ name, policy: passedPolicy, links: passedLinks });
    await buildHook?.({ context, replacementClient, calls });
    return route === 'single' ? envelopes[0] : envelopes;
  }
  const helper = {
    async sendLiveEnvelope(envelope, dispatch, metadata) {
      calls.wrapper.push({ envelope, metadata });
      // A transport spy only: production trust/signature race checks are covered
      // by the managed-live helper suite. Forward a distinct object to prove
      // the UI really dispatches the wrapper callback's envelope argument.
      const forwarded = { ...envelope, fromWrapper: true };
      await wrapperHook?.({ context, replacementClient, calls, envelope });
      await dispatch(forwarded);
    }
  };
  if (route === 'selected') helper.buildEnvelopeBatchForTrustedLinks = (value, selectedLinks) => build('selected', value, selectedLinks);
  if (route === 'live') helper.buildEnvelopeBatchForLiveSend = value => build('live', value);
  if (route === 'single') helper.buildEnvelopeForLiveSend = value => build('single', value);
  context.nanahManagedLivePolicy = helper;
  vm.runInNewContext(handler, context);
  return { context, calls, originalClient, replacementClient, links, policy, proposal, run: () => run() };
}

function commandCenterFixture(options = {}) {
  const f = fixture(options); const { context, calls } = f;
  const root = { activeProfileId: 'parent', profiles: { parent: { type: 'account' }, child: { type: 'child', parentProfileId: 'parent' } } };
  calls.history = [];
  Object.assign(context, {
    activeProfileId: 'parent', nanahManagedPolicySourceOverride: null,
    safeArray: value => Array.isArray(value) ? value : [], normalizeNonNegativeInteger: value => Math.max(0, Number(value) || 0),
    getProfileType: (value, id) => value.profiles[id]?.type,
    ensureProfileUnlocked: async () => true, canActiveProfileManageProfile: () => true,
    getNanahManagedMailboxProvider: () => null, getNanahManagedLocalNetworkProvider: () => null,
    hasNanahManagedMailboxUploadWriter: () => false, hasNanahManagedLocalNetworkDeliveryWriter: () => false,
    getNanahSourceManagedLinksByIds: () => f.links,
    isNanahManagedLinkLiveConnected: () => true, isNanahManagedLinkSavedUpdateEnabled: () => false,
    recordManagedParentPolicyPushHistory: async (id, entry) => calls.history.push({ id, ...plain(entry) }),
    loadNanahTrustedLinks: async () => {}, refreshProfilesUI: async () => {}
  });
  context.window.FilterTubeIO = { loadProfilesV4: async () => root };
  context.nanahManagedLivePolicy.createSendOperation = () => ({ buildEnvelopeBatchForTrustedLinks: context.nanahManagedLivePolicy.buildEnvelopeBatchForTrustedLinks });
  // Spec §4.1 (updated on purpose): a Send uses each link's bound source profile, so the saved link
  // is bound to the child whose rules are sent, and the real resolver runs.
  for (const link of f.links) link.localPolicyProfileId = 'child';
  const resolverStart = source.indexOf('    function resolveNanahSavedUpdateSource(');
  vm.runInNewContext(source.slice(resolverStart, source.indexOf('\n    }\n', resolverStart) + '\n    }'.length), context);
  const functionStart = source.indexOf('    async function sendManagedParentPolicyToVerifiedDevices(');
  const functionEnd = source.indexOf('\n    }\n', functionStart) + '\n    }'.length;
  vm.runInNewContext(source.slice(functionStart, functionEnd), context);
  return { ...f, run: () => context.sendManagedParentPolicyToVerifiedDevices(['child'], { linkIds: ['saved-link'], deliveryMode: 'live' }) };
}

for (const route of ['selected', 'live', 'single']) {
  test(`source Send uses the live wrapper once per envelope through the ${route} builder path`, async () => {
    const f = fixture({ route }); await f.run();
    const expected = route === 'single' ? envelopes.slice(0, 1) : envelopes;
    assert.equal(f.calls.build.length, 1); assert.equal(f.calls.build[0].name, route);
    assert.equal(f.calls.build[0].policy, f.policy);
    if (route === 'selected') assert.equal(f.calls.build[0].links, f.links);
    assert.equal(f.calls.wrapper.length, expected.length); assert.equal(f.calls.sent.length, expected.length);
    for (const [index, envelope] of expected.entries()) {
      assert.equal(f.calls.wrapper[index].envelope, envelope);
      assert.deepEqual(plain(f.calls.wrapper[index].metadata), {
        targetProfileId: envelope.targetProfileId, targetProfileName: envelope.targetProfileName,
        sourceProfileId: envelope.sourceProfileId, sourceDeviceId: envelope.sourceDeviceId, issuedAt: envelope.issuedAt
      });
      assert.deepEqual(f.calls.sent[index], { ...envelope, fromWrapper: true });
    }
    assert.equal(f.calls.replacementSent.length, 0); assert.equal(f.calls.proposals, 0);
    assert.deepEqual(plain(f.calls.auth), [['active', { sensitiveAction: true }]]);
    assert.equal(f.calls.toasts.at(-1).tone, 'success');
  });
}

for (const route of ['selected', 'live', 'single']) {
  test(`replacement session during async ${route} envelope building never receives a send`, async () => {
    const f = fixture({ route, buildHook: async ({ context, replacementClient }) => { await Promise.resolve(); context.nanahClient = replacementClient; } });
    await f.run();
    assert.equal(f.calls.build.length, 1); assert.equal(f.calls.wrapper.length, 0);
    assert.equal(f.calls.sent.length, 0); assert.equal(f.calls.replacementSent.length, 0); assert.equal(f.calls.proposals, 0);
    assert.match(f.calls.toasts.at(-1).message, /paired device changed/); assert.equal(f.calls.toasts.at(-1).tone, 'error');
  });
}

test('the dispatch callback retains the captured client and a changed session stops the next envelope', async () => {
  const f = fixture({ wrapperHook: async ({ context, replacementClient }) => { context.nanahClient = replacementClient; } });
  await f.run();
  assert.equal(f.calls.wrapper.length, 1); assert.equal(f.calls.sent.length, 1);
  assert.equal(f.calls.replacementSent.length, 0, 'late-bound nanahClient must never replace the captured recipient');
  assert.match(f.calls.toasts.at(-1).message, /paired device changed/);
  assert.equal(f.calls.toasts.some(toast => toast.tone === 'success'), false);
});

test('wrapper failure never falls through to unsigned proposal sending or success feedback', async () => {
  const f = fixture({ wrapperHook: async () => { throw new Error('Trust changed before dispatch'); } }); await f.run();
  assert.equal(f.calls.wrapper.length, 1); assert.equal(f.calls.sent.length, 0); assert.equal(f.calls.proposals, 0);
  assert.deepEqual(f.calls.toasts, [{ message: 'Trust changed before dispatch', tone: 'error' }]);
});

test('personal sending preserves its ordinary proposal path without entering the signed wrapper', async () => {
  const f = fixture({ personal: true }); await f.run();
  assert.equal(f.calls.proposals, 1); assert.equal(f.calls.build.length, 0); assert.equal(f.calls.wrapper.length, 0);
  assert.equal(f.calls.sent[0], f.proposal); assert.equal(f.calls.toasts.at(-1).tone, 'success');
});

test('protected profiles and incomplete pairing remain blocked before building or dispatching', async () => {
  for (const options of [{ child: true }, { connected: false }, { confirmed: false }]) {
    const f = fixture(options); await f.run();
    assert.equal(f.calls.build.length, 0); assert.equal(f.calls.wrapper.length, 0); assert.equal(f.calls.sent.length, 0);
    assert.equal(f.calls.toasts.at(-1).tone, 'error');
  }
});

test('command-center live dispatch uses the same wrapper exactly once for each built envelope', async () => {
  const f = commandCenterFixture(); const result = await f.run();
  assert.equal(f.calls.build.length, 1); assert.equal(f.calls.wrapper.length, envelopes.length);
  assert.equal(f.calls.sent.length, envelopes.length); assert.equal(f.calls.replacementSent.length, 0);
  for (const [index, envelope] of envelopes.entries()) {
    assert.equal(f.calls.wrapper[index].envelope, envelope);
    assert.equal(f.calls.wrapper[index].metadata.delivery, 'command_center_live_session');
    assert.equal(f.calls.wrapper[index].metadata.targetProfileId, envelope.targetProfileId);
    assert.deepEqual(f.calls.sent[index], { ...envelope, fromWrapper: true });
  }
  assert.equal(result.liveSentCount, 2); assert.equal(result.deliveredCount, 2); assert.equal(result.failedCount, 0);
  assert.equal(f.context.nanahManagedPolicySourceOverride, null);
  assert.equal(f.calls.toasts.at(-1).tone, 'success');
});

test('command-center async building cannot redirect envelopes to a replacement session', async () => {
  const f = commandCenterFixture({ buildHook: async ({ context, replacementClient }) => { await Promise.resolve(); context.nanahClient = replacementClient; } });
  const result = await f.run();
  assert.equal(f.calls.build.length, 1); assert.equal(f.calls.wrapper.length, 0); assert.equal(f.calls.sent.length, 0); assert.equal(f.calls.replacementSent.length, 0);
  assert.equal(result.liveSentCount, 0); assert.equal(result.deliveredCount, 0); assert.equal(result.failedCount, 1);
  assert.match(f.calls.history[0].reason, /paired device changed/);
  assert.equal(f.context.nanahManagedPolicySourceOverride, null); assert.equal(f.calls.toasts.at(-1).tone, 'error');
});
