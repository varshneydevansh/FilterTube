import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/delivery-strip-source.json', 'utf8'));
const start = source.indexOf('    function renderNanahDeliveryPathStrip() {');
const end = source.indexOf('    async function refreshNanahDeliveryFeedbackUi()', start);
assert.ok(start >= 0 && end > start);
const renderer = source.slice(start, end);
const interpolate = (text, values = {}) => text.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);

function render({ configured = false, verified = false, protectedProfile = verified, live = false, personal = false, nearbyOnly = false, localized = false } = {}) {
  const nodes = Object.fromEntries([...new Set(renderer.match(/\bftNanah\w+/g))].map(name => [name, {
    dataset: {}, textContent: '', title: '', hidden: false, disabled: false,
    setAttribute(key, value) { this[key] = value; }
  }]));
  nodes.ftNanahSyncShell.dataset.personalSyncOpen = String(personal);
  const mailbox = { configured, label: 'Internet Pickup', detail: 'Provider readiness details' };
  const local = { configured, pickupConfigured: configured, label: 'Home Pickup', detail: 'Local readiness details', nearbyDiscoveryOnly: nearbyOnly };
  const before = JSON.stringify({ mailbox, local });
  let captured;
  const used = new Set();
  const context = {
    ...nodes,
    normalizeString: value => String(value ?? '').trim(),
    nanahSessionState: { connected: live, sasConfirmed: live }, nanahClient: live ? {} : null,
    getNanahFamilyDeliveryReadinessSummary: () => ({ protectedProfileCount: protectedProfile ? 1 : 0, verifiedProfileCount: verified ? 1 : 0 }),
    summarizeManagedMailboxServerConfig: () => mailbox,
    summarizeManagedLocalNetworkProviderConfig: () => local,
    buildNanahFamilyDeviceMapViewModel: data => data,
    renderNanahFamilyDeviceMapViewModel: data => { captured = data; },
    familyDeviceMapCopy: text => localized ? `Mapped: ${text}` : text,
    tabViewUiText(key, fallback, values) {
      assert.equal(batch.english[key], fallback, `runtime source matches ${key}`);
      used.add(key);
      return interpolate(localized ? `Translated: ${fallback}` : fallback, values);
    },
    hasNanahManagedSavedUpdateReader: () => configured,
    hasNanahManagedSavedUpdateCheckTarget: () => verified,
    getNanahManagedSavedUpdateReaderLabel: () => 'Home Pickup',
    hasNanahManagedSourceAckSyncTarget: () => verified,
    hasNanahManagedSourceAckReader: () => configured
  };
  vm.runInNewContext(`${renderer}\nrenderNanahDeliveryPathStrip();`, context);
  assert.equal(JSON.stringify({ mailbox, local }), before, 'display localization cannot mutate providers');
  assert.equal(captured.mailbox, mailbox, 'policy view-model receives original mailbox');
  assert.equal(captured.local, local, 'policy view-model receives original local config');
  return { nodes, used };
}

test('delivery text and accessible names resolve through the same keyed source', () => {
  const used = new Set();
  for (const configured of [false, true]) for (const verified of [false, true]) {
    for (const live of [false, true]) for (const personal of [false, true]) for (const protectedProfile of [false, true]) for (const nearbyOnly of [false, true]) {
      if (verified && !protectedProfile) continue;
      const result = render({ configured, verified, protectedProfile, live, personal, nearbyOnly, localized: true });
      for (const key of result.used) used.add(key);
      assert.match(result.nodes.ftNanahCompassLiveBtn['aria-label'], /^Translated:/);
      assert.match(result.nodes.ftNanahCompassLaterBtn['aria-label'], /^Translated:/);
      assert.match(result.nodes.ftNanahCompassHomeBtn['aria-label'], /^Translated:/);
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(batch.english).sort(), 'all frozen copy branches are exercised');
});

test('language changes do not alter visibility, readiness, disabled state or provider models', () => {
  for (const configured of [false, true]) for (const verified of [false, true]) for (const personal of [false, true]) {
    const state = { configured, verified, personal };
    const english = render(state).nodes;
    const localized = render({ ...state, localized: true }).nodes;
    for (const name of Object.keys(english)) {
      for (const field of ['hidden', 'disabled', 'open']) assert.equal(localized[name][field], english[name][field], `${name}.${field}`);
      assert.deepEqual(localized[name].dataset, english[name].dataset, `${name}: state remains unchanged`);
    }
  }
});
