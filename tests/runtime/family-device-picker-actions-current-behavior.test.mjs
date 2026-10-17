import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    if (ftNanahDeviceSelectionActionBtn) {\n        ftNanahDeviceSelectionActionBtn.addEventListener');
const end = source.indexOf('    if (ftNanahCopyMapEvidenceBtn) {', start);
assert.ok(start > 0 && end > start, 'device selection handler registration exists');
const handlerSource = source.slice(start, end);

function harness({ sourceType = 'trusted-link', link = {}, session = {}, child = false, live = false, home = true, later = true, homeHealth = true, laterHealth = true, confirmed = true, confirm = null } = {}) {
  const calls = { sends: [], reconnects: [], modal: [], clicks: [], focus: [], toasts: [], pairing: [], modes: [], persisted: [] };
  const action = { disabled: false, textContent: 'Send update', addEventListener: (_, callback) => { action.run = callback; } };
  const button = name => ({ click: () => calls.clicks.push(name), name });
  const selected = { dataset: { source: sourceType, familyDeviceId: 'device-1' } };
  const context = {
    nanahDeviceSelectionBusy: false,
    renderNanahDeliveryPathStrip: () => { action.disabled = context.nanahDeviceSelectionBusy; },
    console,
    isActiveChildNanahProfile: () => child,
    ftNanahDeviceSelectionActionBtn: action,
    ftNanahDeviceCompass: { querySelector: () => selected },
    ftNanahCompassLiveBtn: button('live'), ftNanahCompassHomeBtn: button('home'), ftNanahCompassLaterBtn: button('later'),
    ftNanahSendBtn: button('send'), ftNanahConfirmSasBtn: button('confirm-phrase'), ftNanahStatusCard: button('status'),
    ftNanahTrustedLinks: button('trusted-controls'), ftNanahPairCode: button('pair-code'),
    ftNanahJoinCode: button('parent-code'),
    ftNanahQuickSendUpdateBtn: button('quick-send'), ftNanahQuickCreateProtectedBtn: button('create-profile'),
    nanahFamilyDeviceSelectedIntent: { source: sourceType, linkId: 'link-1', profileId: 'child-1', deviceId: 'device-1', title: 'Child tablet' },
    nanahSessionState: { connected: false, sasConfirmed: false, ...session },
    nanahTrustedLinks: [{ linkId: 'link-1', remoteDeviceId: 'device-1', localRole: 'source', remoteRole: 'replica', linkType: 'managed_link', ...link }],
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNanahTrustedLink: value => value,
    safeObject: value => value && typeof value === 'object' ? value : {},
    familyDeviceMapCopy: value => value,
    familyDeviceMapText: (_, fallback, args = {}) => fallback.replace(/\{(\w+)\}/g, (all, name) => args[name] ?? all),
    tabViewUiText: (_, fallback, args = {}) => fallback.replace(/\{(\w+)\}/g, (all, name) => args[name] ?? all),
    openNanahPairingDetails: () => calls.clicks.push('open-details'),
    focusNanahElement: element => calls.focus.push(element?.name),
    UIComponents: { showToast: message => calls.toasts.push(message) },
    pairNanahNearbyCandidate: async id => calls.pairing.push(id),
    setNanahPersonalSyncOpen: value => calls.modes.push(['personal', value]),
    setNanahMode: value => calls.modes.push(['mode', value]),
    startNanahTrustedReconnect: async value => calls.reconnects.push(value),
    chooseNanahDevicePolicySource: async () => ({ profileId: 'child-1', profileName: 'Child rules' }),
    updateNanahTrustedLinkPolicy: async (id, updates) => {
      context.nanahTrustedLinks = context.nanahTrustedLinks.map(link => link.linkId === id ? { ...link, ...updates } : link);
      calls.persisted.push(JSON.parse(JSON.stringify(context.nanahTrustedLinks)));
      return true;
    },
    isNanahManagedLinkSavedUpdateEnabled: () => true,
    isNanahManagedLinkLiveConnected: () => live,
    hasNanahManagedLocalNetworkDeliveryWriter: () => home,
    hasNanahManagedMailboxUploadWriter: () => later,
    summarizeManagedLocalNetworkProviderConfig: () => ({ healthOk: homeHealth }),
    summarizeManagedMailboxServerConfig: () => ({ healthOk: laterHealth }),
    showConfirmModal: async options => { calls.modal.push(options); return confirm ? confirm(options) : confirmed; },
    sendManagedParentPolicyToVerifiedDevices: async (profiles, options) => calls.sends.push(JSON.parse(JSON.stringify({ profiles, options })))
  };
  vm.runInNewContext(handlerSource, context);
  return { action, calls, context };
}

test('verified managed device uses exactly one healthy route and its bound profile/link', async () => {
  const scenarios = [
    { live: true, expected: 'live' },
    { live: false, expected: 'home' },
    { homeHealth: false, expected: 'later' },
    { home: false, expected: 'later' }
  ];
  for (const { expected, ...options } of scenarios) {
    const f = harness(options);
    await f.action.run();
    assert.deepEqual(f.calls.sends, [{ profiles: ['child-1'], options: { scope: 'active', linkIds: ['link-1'], deliveryMode: expected } }]);
    assert.equal(f.calls.modal.length, 1);
    assert.match(f.calls.modal[0].message, /Child tablet/);
    assert.equal(f.calls.reconnects.length, 0);
    assert.equal(f.action.disabled, false);
  }
});

test('cancelled review sends nothing; no usable delivery reconnects without queuing', async () => {
  const cancelled = harness({ confirmed: false });
  await cancelled.action.run();
  assert.equal(cancelled.calls.sends.length, 0);
  const offline = harness({ homeHealth: false, laterHealth: false });
  await offline.action.run();
  assert.equal(offline.calls.sends.length, 0);
  assert.equal(offline.calls.modal.length, 0);
  assert.equal(offline.calls.reconnects.length, 1);
});

test('revoked keys, removed trust and stale pairing never send or reconnect from the picker', async () => {
  for (const property of ['revoked', 'keyRevoked', 'stalePairing']) {
    for (const flags of [{ [property]: true }, { policy: { [property]: true } }]) {
      const f = harness({ link: flags, live: true });
      await f.action.run();
      assert.equal(f.calls.sends.length, 0);
      assert.equal(f.calls.reconnects.length, 0);
      assert.equal(f.calls.modal.length, 0);
      assert.deepEqual(f.calls.focus, ['trusted-controls']);
    }
  }
});

test('personal peers focus explicit Send only for their matching verified live session or reconnect first', async () => {
  const peer = { linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer' };
  const connected = harness({ link: peer, session: { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'device-1' } } });
  await connected.action.run();
  assert.deepEqual(connected.calls.focus, ['send']);
  assert.deepEqual(connected.calls.clicks, ['open-details']);
  assert.deepEqual(connected.calls.modes, [['personal', true], ['mode', 'send_once']]);
  assert.equal(connected.calls.sends.length, 0);
  const wrongDevice = harness({ link: peer, session: { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'other' } } });
  await wrongDevice.action.run();
  assert.ok(!wrongDevice.calls.clicks.includes('send'));
  assert.equal(wrongDevice.calls.reconnects.length, 1);
  const disconnected = harness({ link: peer }); await disconnected.action.run();
  assert.deepEqual(disconnected.calls.reconnects.map(value => value.linkId), ['link-1']);
  assert.deepEqual(disconnected.calls.focus, ['pair-code']);
  assert.ok(!disconnected.calls.clicks.includes('send'));
});

test('connected live and compass preview actions reveal one explicit Send without dispatching or changing source and target', async () => {
  for (const selectedType of ['live-session', 'compass-live']) {
    const f = harness({ sourceType: 'live-session', session: { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'device-1' }, remoteProfile: { profileId: 'remote-child' } } });
    if (selectedType === 'compass-live') f.context.ftNanahDeviceCompass.querySelector = () => f.context.ftNanahCompassLiveBtn;
    const editor = Object.freeze({ profileId: 'local-child', surface: 'kids' });
    f.context.managedChildEdit = editor;
    const session = JSON.stringify(f.context.nanahSessionState);
    const intent = JSON.stringify(f.context.nanahFamilyDeviceSelectedIntent);
    const links = JSON.stringify(f.context.nanahTrustedLinks);
    await f.action.run();
    assert.deepEqual(f.calls.clicks, ['open-details'], selectedType);
    assert.deepEqual(f.calls.focus, ['send'], selectedType);
    assert.equal(f.calls.sends.length, 0); assert.equal(f.calls.modal.length, 0); assert.equal(f.calls.persisted.length, 0);
    assert.deepEqual(f.calls.modes, []); assert.equal(f.calls.reconnects.length, 0);
    assert.equal(f.context.managedChildEdit, editor);
    assert.equal(JSON.stringify(f.context.nanahSessionState), session);
    assert.equal(JSON.stringify(f.context.nanahFamilyDeviceSelectedIntent), intent);
    assert.equal(JSON.stringify(f.context.nanahTrustedLinks), links);
    assert.equal(f.context.nanahDeviceSelectionBusy, false); assert.equal(f.action.disabled, false);
  }
});

test('matching connected peer preview preserves saved source mapping and target while revealing Send', async () => {
  const f = harness({ link: { linkType: 'peer_link', localPolicyProfileId: 'local-copy-source' }, session: { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'device-1' } } });
  const beforeLinks = JSON.stringify(f.context.nanahTrustedLinks);
  const beforeIntent = JSON.stringify(f.context.nanahFamilyDeviceSelectedIntent);
  const beforeSession = JSON.stringify(f.context.nanahSessionState);
  await f.action.run();
  assert.deepEqual(f.calls.clicks, ['open-details']); assert.deepEqual(f.calls.focus, ['send']);
  assert.equal(f.calls.sends.length, 0); assert.equal(f.calls.modal.length, 0); assert.equal(f.calls.persisted.length, 0);
  assert.equal(JSON.stringify(f.context.nanahTrustedLinks), beforeLinks);
  assert.equal(JSON.stringify(f.context.nanahFamilyDeviceSelectedIntent), beforeIntent);
  assert.equal(JSON.stringify(f.context.nanahSessionState), beforeSession);
});

test('unconfirmed compass preview keeps its existing pairing path and cannot focus or click Send', async () => {
  for (const session of [{}, { connected: true, sasConfirmed: false }]) {
    const f = harness({ session }); f.context.ftNanahDeviceCompass.querySelector = () => f.context.ftNanahCompassLiveBtn;
    await f.action.run();
    assert.deepEqual(f.calls.clicks, ['live']); assert.deepEqual(f.calls.focus, []);
    assert.equal(f.calls.sends.length, 0); assert.equal(f.calls.reconnects.length, 0);
  }
});

test('unverified live device leads to phrase confirmation and nearby selection only starts pairing', async () => {
  const unverified = harness({ sourceType: 'live-session', session: { connected: true } });
  await unverified.action.run();
  assert.deepEqual(unverified.calls.focus, ['confirm-phrase']);
  assert.ok(!unverified.calls.clicks.includes('send'));
  const nearby = harness({ sourceType: 'nearby-presence' });
  await nearby.action.run();
  assert.deepEqual(nearby.calls.pairing, ['device-1']);
  assert.equal(nearby.calls.sends.length, 0);
});

test('a verified live session on the child device opens receive status without a send', async () => {
  const f = harness({ sourceType: 'live-session', child: true, session: { connected: true, sasConfirmed: true } });
  await f.action.run();
  assert.deepEqual(f.calls.focus, ['status']);
  assert.ok(!f.calls.clicks.includes('send'));
  assert.equal(f.calls.sends.length, 0);
});

test('child picker actions only enter a parent code, match the phrase, or show receive status', async () => {
  for (const sourceType of ['trusted-link', 'nearby-presence', 'live-session', 'compass-live']) {
    for (const session of [{}, { connected: true }, { connected: true, sasConfirmed: true }]) {
      const f = harness({ child: true, sourceType, session, link: { linkType: 'peer_link' } });
      if (sourceType === 'compass-live') f.context.ftNanahDeviceCompass.querySelector = () => f.context.ftNanahCompassLiveBtn;
      await f.action.run();
      assert.deepEqual(f.calls.focus, [session.connected ? (session.sasConfirmed ? 'status' : 'confirm-phrase') : 'parent-code']);
      assert.equal(f.calls.sends.length, 0);
      assert.equal(f.calls.pairing.length, 0);
      assert.equal(f.calls.reconnects.length, 0);
      assert.equal(f.calls.modal.length, 0);
      assert.equal(f.calls.persisted.length, 0);
      assert.deepEqual(f.calls.modes, []);
    }
  }
});

test('receiver links and missing destination profiles open controls without sending', async () => {
  const receiver = harness({ link: { localRole: 'replica', remoteRole: 'source' } });
  await receiver.action.run();
  assert.deepEqual(receiver.calls.focus, ['trusted-controls']);
  assert.equal(receiver.calls.sends.length, 0);
  const missingProfile = harness();
  missingProfile.context.nanahFamilyDeviceSelectedIntent.profileId = '';
  await missingProfile.action.run();
  assert.equal(missingProfile.calls.sends.length, 0);
  assert.equal(missingProfile.calls.modal.length, 0);
});

test('a repeated click during review cannot open another review or dispatch another update', async () => {
  let resolveReview;
  const f = harness({ confirm: () => new Promise(resolve => { resolveReview = resolve; }) });
  const first = f.action.run();
  assert.equal(f.action.disabled, true);
  await f.action.run();
  assert.equal(f.calls.modal.length, 1);
  assert.equal(f.calls.sends.length, 0);
  resolveReview(true);
  await first;
  assert.equal(f.calls.sends.length, 1);
  assert.equal(f.context.nanahDeviceSelectionBusy, false);
  assert.equal(f.action.disabled, false);
});

test('a verified device with a different remote profile ID sends only the selected local source', async () => {
  const f = harness();
  f.context.nanahFamilyDeviceSelectedIntent.profileId = 'remote-child';
  f.context.chooseNanahDevicePolicySource = async () => ({ profileId: 'local-child', profileName: 'Local child rules' });
  await f.action.run();
  assert.deepEqual(f.calls.sends, [{ profiles: ['local-child'], options: { scope: 'active', linkIds: ['link-1'], deliveryMode: 'home' } }]);
  assert.match(f.calls.modal[0].message, /Local child rules/);
  assert.match(f.calls.modal[0].message, /Child tablet/);
  assert.equal(f.calls.persisted[0][0].localPolicyProfileId, 'local-child');
});

test('two receiving profiles on the same device keep independent links and local rules selections', async () => {
  const f = harness();
  f.context.nanahTrustedLinks.push({
    ...f.context.nanahTrustedLinks[0], linkId: 'link-2', localPolicyProfileId: 'local-sibling',
    policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: 'remote-sibling' }
  });
  f.context.chooseNanahDevicePolicySource = async () => ({ profileId: 'local-child', profileName: 'Child rules' });
  await f.action.run();
  assert.deepEqual(f.calls.sends[0], { profiles: ['local-child'], options: { scope: 'active', linkIds: ['link-1'], deliveryMode: 'home' } });
  assert.equal(f.context.nanahTrustedLinks[1].localPolicyProfileId, 'local-sibling');
  assert.equal(f.context.nanahTrustedLinks[1].policy.targetProfileId, 'remote-sibling');

  f.context.nanahFamilyDeviceSelectedIntent = { source: 'trusted-link', linkId: 'link-2', deviceId: 'device-1', profileId: 'remote-sibling', title: 'Same tablet — sibling' };
  f.context.chooseNanahDevicePolicySource = async () => ({ profileId: 'local-sibling', profileName: 'Sibling rules' });
  await f.action.run();
  assert.deepEqual(f.calls.sends[1], { profiles: ['local-sibling'], options: { scope: 'active', linkIds: ['link-2'], deliveryMode: 'home' } });
  assert.equal(f.context.nanahTrustedLinks[0].localPolicyProfileId, 'local-child');
});

test('source selection and review cancellation never persist a device source mapping', async () => {
  const cancelledChoice = harness();
  cancelledChoice.context.chooseNanahDevicePolicySource = async () => null;
  await cancelledChoice.action.run();
  assert.equal(cancelledChoice.calls.persisted.length, 0);
  assert.equal(cancelledChoice.calls.sends.length, 0);
  const cancelledReview = harness({ confirmed: false });
  await cancelledReview.action.run();
  assert.equal(cancelledReview.calls.persisted.length, 0);
});

test('busy protection lasts through delivery and is released after delivery failure', async () => {
  const f = harness();
  let rejectSend;
  let notifyStarted;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  f.context.console = { warn() {} };
  f.context.sendManagedParentPolicyToVerifiedDevices = async (profiles, options) => {
    f.calls.sends.push({ profiles, options });
    notifyStarted();
    await new Promise((_, reject) => { rejectSend = reject; });
  };
  const pending = f.action.run();
  await started;
  await f.action.run();
  assert.equal(f.calls.sends.length, 1);
  assert.equal(f.calls.modal.length, 1);
  assert.equal(f.context.nanahDeviceSelectionBusy, true);
  rejectSend(new Error('transport failed'));
  await pending;
  assert.equal(f.context.nanahDeviceSelectionBusy, false);
  assert.equal(f.action.disabled, false);
  assert.equal(f.calls.toasts.length, 1);
});
