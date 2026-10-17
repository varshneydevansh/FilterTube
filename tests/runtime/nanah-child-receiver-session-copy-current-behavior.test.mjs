import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    function updateNanahUi() {');
const end = source.indexOf('    function buildNanahDeviceDescriptor(', start);
assert.ok(start > 0 && end > start);
const updateUi = source.slice(start, end);
function fixture({ child = false, locked = false, verified = true, phrase = '', trusted = null, managed = true, translations = {} } = {}) {
  const context = {
    document: { getElementById: () => null },
    nanahClient: {}, nanahLastSessionNotice: null,
    nanahSessionState: { connected: true, sasConfirmed: verified, sasPhrase: phrase, remoteRole: managed ? 'source' : 'peer', remoteDevice: { deviceId: 'other-device' } },
    normalizeString: value => typeof value === 'string' ? value.trim() : '', safeObject: value => value && typeof value === 'object' ? value : {},
    isNanahChildReceiveOnly: () => child, isNanahChildReplicaOnly: () => child && locked,
    getNanahCurrentTrustedLink: () => trusted, getNanahRole: () => child ? 'replica' : (managed ? 'source' : 'peer'),
    classifyNanahTrustedLink: () => managed ? 'managed_link' : 'peer_link',
    tabViewUiText: (key, fallback) => translations[key] ?? fallback,
    setTabViewLocalizedCopy: (node, property, key, fallback) => { node[property] = translations[key] ?? fallback; },
    enforceChildSyncSurfaceRestrictions() {}, renderNanahFamilyDeviceIntent() {}, updateNanahPolicyControls() {}, refreshNanahAdvancedSummary() {}, updateNanahModeUi() {}, renderNanahDeliveryPathStrip() {}, renderNanahQr: async () => {}
  };
  for (const name of new Set(updateUi.match(/\bftNanah[A-Za-z0-9]+\b/g))) context[name] = null;
  context.ftNanahStatusHint = { textContent: '' };
  context.ftNanahSendBtn = { disabled: false };
  context.ftNanahTrustBtn = { disabled: false };
  vm.runInNewContext(updateUi, context);
  return { context, run: () => context.updateNanahUi() };
}
const receiverVerified = 'Verified for this session as a protected receiver. This profile can receive approved parent updates, but it cannot save parent policy from here.';
const receiverTrusted = 'Protected profile connected as a receiver. Saved parent links can keep this device aligned without turning the protected profile into a sender.';

for (const locked of [false, true]) {
  test(`verified child receives status guidance when switching-PIN locked=${locked}`, () => {
    const f = fixture({ child: true, locked });
    f.run();
    assert.equal(f.context.ftNanahStatusHint.textContent, receiverVerified);
    assert.equal(f.context.ftNanahSendBtn.disabled, true);
    assert.equal(f.context.ftNanahTrustBtn.disabled, true);
  });
  test(`saved parent link uses protected receiver copy when locked=${locked}`, () => {
    const f = fixture({ child: true, locked, trusted: { policy: { linkType: 'managed_link' } } });
    f.run();
    assert.equal(f.context.ftNanahStatusHint.textContent, receiverTrusted);
  });
}

test('locked-specific pre-verification status remains intact', () => {
  const f = fixture({ child: true, locked: true, verified: false });
  f.run();
  assert.equal(f.context.ftNanahStatusHint.textContent, 'Locked protected profile connected. This device stays receive-only until the local protected profile is unlocked.');
});

test('unlocked child is prompted to match the phrase without being described as locked', () => {
  const f = fixture({ child: true, verified: false });
  f.run();
  assert.equal(f.context.ftNanahStatusHint.textContent, 'Compare the safety phrase on both devices and confirm only if they match exactly.');
});

test('a pending safety phrase keeps priority over verified-session guidance', () => {
  const f = fixture({ child: true, locked: false, verified: false, phrase: 'synthetic matching phrase' });
  f.run();
  assert.equal(f.context.ftNanahStatusHint.textContent, 'Compare the safety phrase on both devices and confirm only if they match exactly.');
});

for (const managed of [false, true]) {
  test(`adult session keeps existing managed=${managed} sending guidance`, () => {
    const f = fixture({ managed });
    f.run();
    assert.equal(f.context.ftNanahStatusHint.textContent, managed
      ? 'Verified for this session. Send the reviewed update now, or save parent trust only if this protected device should keep receiving approved updates.'
      : 'Verified for this session. You can send settings now or save this device as trusted.');
    assert.equal(f.context.ftNanahSendBtn.disabled, false);
    assert.equal(f.context.ftNanahTrustBtn.disabled, false);
  });
}

test('the existing receiver localization key is reused for PIN-free child profiles', () => {
  const f = fixture({ child: true, translations: { 'dashboard.sync.hint.protectedReceiverSessionVerified': 'Translated protected receiver' } });
  f.run();
  assert.equal(f.context.ftNanahStatusHint.textContent, 'Translated protected receiver');
});
