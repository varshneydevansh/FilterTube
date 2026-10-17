import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `Missing runtime function: ${startMarker}`);
  return source.slice(start, end);
}

const runtime = [
  between('    function normalizeNanahNearbyCandidate(', '    async function ensureNanahLocalDiscoveryCompanion('),
  between('    async function pairNanahNearbyCandidate(', '    async function sendNanahHelloEnvelope(')
].join('\n');

function plain(value) { return JSON.parse(JSON.stringify(value)); }

function fixture({ personal = false, childCount = 0, expired = false, host } = {}) {
  const calls = { modes: [], hosts: [], invitations: [], toasts: [], stops: [], focuses: [], createClicks: 0, opened: 0 };
  const now = Date.now();
  const context = {
    Date: { now: () => now },
    crypto: { randomUUID: () => 'invitation-id' },
    console: { warn() {} },
    safeArray: value => Array.isArray(value) ? value : [],
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Math.max(0, Math.floor(Number(value) || 0)),
    nanahNearbyDiscoveryState: { candidates: [{
      candidateId: 'tablet-1', label: 'Study tablet', role: 'personal',
      expiresAtMs: now + (expired ? -1000 : 60000)
    }] },
    nanahNearbyActionPromise: null,
    ftNanahSyncShell: { dataset: { personalSyncOpen: String(personal) } },
    ftNanahQuickCreateProtectedBtn: { click() { calls.createClicks += 1; } },
    ftNanahStatusCard: { id: 'status' },
    ftNanahPairCode: { id: 'code' },
    UIComponents: { showToast(message, tone) { calls.toasts.push({ message, tone }); } },
    tabViewUiText: (_key, fallback) => fallback,
    getNanahFamilyDeliveryReadinessSummary: () => ({ protectedProfileCount: childCount }),
    stopNanahNearbyDiscoverySession: options => calls.stops.push(plain(options)),
    setNanahMode(mode, options) { calls.modes.push({ mode, ...plain(options) }); },
    openNanahPairingDetails() { calls.opened += 1; },
    async hostNanahSession(options) {
      calls.hosts.push(plain(options));
      return host ? host(options) : 'ABCD';
    },
    getNanahManagedLocalNetworkProvider: () => ({
      async inviteNearbyDevice(invitation) { calls.invitations.push(plain(invitation)); return { ok: true }; }
    }),
    getNanahLocalDeviceLabel: () => 'My laptop',
    focusNanahElement: element => calls.focuses.push(element.id)
  };
  vm.runInNewContext(runtime, context, { filename: 'js/tab-view.js:nearby-pairing' });
  return { calls, pair: context.pairNanahNearbyCandidate, context };
}

test('personal Nearby pairing works without protected profiles and uses an unpersisted one-time send', async () => {
  const f = fixture({ personal: true });
  await f.pair('tablet-1');
  assert.deepEqual(f.calls.modes, [{ mode: 'send_once', persist: false, applyPreset: true }]);
  assert.equal(f.calls.createClicks, 0);
  assert.equal(f.calls.hosts.length, 1);
  assert.equal(f.calls.hosts[0].source, 'nearby-presence');
  assert.equal(f.calls.hosts[0].intentTitle, 'Study tablet');
  assert.equal(f.calls.invitations.length, 1);
  assert.equal(f.calls.invitations[0].candidateId, 'tablet-1');
  assert.equal(f.calls.invitations[0].pairingCode, 'ABCD');
  assert.equal(f.calls.invitations[0].inviterLabel, 'My laptop');
  assert.equal(f.calls.invitations[0].expiresAtMs - f.calls.invitations[0].createdAtMs, 120000);
  assert.deepEqual(f.calls.focuses, ['status']);
  assert.equal(f.context.nanahNearbyActionPromise, null);
});

test('parent Nearby pairing without a protected profile opens creation before hosting or inviting', async () => {
  const f = fixture();
  await f.pair('tablet-1');
  assert.equal(f.calls.createClicks, 1);
  assert.equal(f.calls.toasts[0].tone, 'warning');
  assert.equal(f.calls.modes.length, 0);
  assert.equal(f.calls.hosts.length, 0);
  assert.equal(f.calls.invitations.length, 0);
  assert.equal(f.calls.stops.length, 0);
});

test('parent Nearby pairing with a protected profile hosts parent control and sends the invitation', async () => {
  const f = fixture({ childCount: 1 });
  await f.pair('tablet-1');
  assert.deepEqual(f.calls.modes, [{ mode: 'parent_control', persist: true, applyPreset: true }]);
  assert.equal(f.calls.createClicks, 0);
  assert.equal(f.calls.hosts.length, 1);
  assert.equal(f.calls.invitations[0].pairingCode, 'ABCD');
});

test('expired Nearby candidates cannot host sessions or send invitations', async () => {
  const f = fixture({ personal: true, expired: true });
  await f.pair('tablet-1');
  assert.equal(f.calls.toasts[0].tone, 'warning');
  assert.equal(f.calls.modes.length, 0);
  assert.equal(f.calls.hosts.length, 0);
  assert.equal(f.calls.invitations.length, 0);
});

test('duplicate Nearby pairing clicks share hosting and send only one invitation', async () => {
  let releaseHost;
  const f = fixture({ personal: true, host: () => new Promise(resolve => { releaseHost = resolve; }) });
  const first = f.pair('tablet-1');
  const second = f.pair('tablet-1');
  assert.equal(f.calls.hosts.length, 1);
  assert.equal(f.calls.modes.length, 1);
  assert.equal(f.calls.invitations.length, 0);
  releaseHost('ABCD');
  await Promise.all([first, second]);
  assert.equal(f.calls.invitations.length, 1);
  assert.equal(f.calls.opened, 1);
  assert.equal(f.context.nanahNearbyActionPromise, null);
});

test('cancelled hosting sends no invitation and releases the pairing action for retry', async () => {
  const f = fixture({ personal: true, host: () => '' });
  await f.pair('tablet-1');
  assert.equal(f.calls.invitations.length, 0);
  assert.equal(f.context.nanahNearbyActionPromise, null);
  await f.pair('tablet-1');
  assert.equal(f.calls.hosts.length, 2);
  assert.equal(f.calls.invitations.length, 0);
});
