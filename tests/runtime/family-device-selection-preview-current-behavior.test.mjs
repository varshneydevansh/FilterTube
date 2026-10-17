import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    function renderNanahDeviceSelectionPreview(');
const end = source.indexOf('    function setNanahSessionNotice(', start);
assert.ok(start > 0 && end > start);
function descendants(node) { return [node, ...node.children.flatMap(descendants)]; }
function element(tag) {
  const node = {
    tagName: tag.toUpperCase(), dataset: {}, children: [], attributes: {}, hidden: false,
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector(selector) {
      return descendants(this).slice(1).find(child => selector.startsWith('.')
        ? child.className?.split(' ').includes(selector.slice(1)) : child.tagName === selector.toUpperCase()) || null;
    },
    remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
  };
  Object.defineProperty(node, 'innerHTML', { set(value) { assert.equal(value, ''); this.children = []; } });
  return node;
}
function fixture() {
  const preview = element('div');
  for (const tag of ['span', 'strong', 'small']) preview.appendChild(element(tag));
  const action = preview.appendChild(element('button'));
  const legacy = { id: 'ftNanahCompassLiveBtn', dataset: { selected: 'true', primaryAction: 'Pair with code or QR' } };
  const devices = [];
  const context = {
    document: { createElement: element }, ftNanahDeviceSelectionPreview: preview, ftNanahDeviceSelectionActionBtn: action,
    ftNanahDeviceCompass: { querySelector: selector => selector.includes('[data-family-device-id]')
      ? devices.find(device => device.dataset.selected === 'true' && device.dataset.familyDeviceId && device.dataset.source) || null
      : [legacy, ...devices].find(device => device.dataset.selected === 'true' && (device.dataset.primaryAction || device.dataset.blockedAction)) || null },
    nanahFamilyDeviceSelectedIntent: null, nanahSessionState: { connected: false }, nanahDeviceSelectionBusy: false,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    familyDeviceMapCopy: value => value || '',
    familyDeviceMapText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
  };
  vm.runInNewContext(source.slice(start, end), context);
  return { context, preview, action, legacy, devices, render: options => context.renderNanahDeviceSelectionPreview(options) };
}

test('initial personal copy does not display a second review from the default selected legacy path', () => {
  const f = fixture();
  for (let poll = 0; poll < 3; poll++) {
    f.render({ eyebrow: 'Copy this profile', title: 'Open FilterTube on your other device', detail: 'Pair with code or QR' });
    assert.equal(f.preview.hidden, true, 'polling a fallback path is not deliberate selection');
  }
  assert.equal(f.legacy.dataset.selected, 'true', 'the capability remains available in connection help');
});

test('an explicit pairing, code entry or advanced path intent displays its review without a device tile', () => {
  for (const source of ['live-map-choice', 'join-button', 'host-button', 'home-map-choice', 'away-map-choice']) {
    const f = fixture(); f.context.nanahFamilyDeviceSelectedIntent = { source };
    f.render({ title: 'Selected path', primaryAction: 'Continue pairing' });
    assert.equal(f.preview.hidden, false, source);
    assert.equal(f.action.hidden, false);
    assert.equal(f.action.textContent, 'Continue pairing');
  }
});

test('actual selected live, saved and nearby device tiles display review independently of fallback ordering', () => {
  for (const source of ['live-session', 'trusted-link', 'home-bridge-preview', 'nearby-presence']) {
    const f = fixture();
    f.devices.push({ dataset: { selected: 'true', familyDeviceId: 'tablet', source, primaryAction: 'Review device' } });
    f.render({ title: 'Child tablet', titleIsUserData: true, primaryAction: 'Review device' });
    assert.equal(f.preview.hidden, false, source);
    assert.equal(f.preview.querySelector('strong').textContent, 'Child tablet');
    assert.equal(f.action.textContent, 'Review device');
  }
});

test('unselected or nondevice path controls cannot reveal the contextual review', () => {
  for (const dataset of [
    { selected: 'false', familyDeviceId: 'tablet', source: 'trusted-link' },
    { selected: 'true', familyDeviceId: '', source: 'nearby-presence' },
    { selected: 'true', familyDeviceId: 'helper', source: 'toolbar-status' }
  ]) {
    const f = fixture(); f.devices.push({ dataset }); f.render({ primaryAction: 'Pair with code or QR' });
    assert.equal(f.preview.hidden, true);
  }
});

test('connected pairing and verified status stay visible, including busy action disabling', () => {
  for (const [confirmed, primaryAction] of [[false, 'Match safety phrase'], [true, 'Review and send']]) {
    const f = fixture(); f.context.nanahSessionState = { connected: true, sasConfirmed: confirmed };
    f.render({ primaryAction });
    assert.equal(f.preview.hidden, false);
    assert.equal(f.action.hidden, false);
    assert.equal(f.action.textContent, primaryAction);
    f.context.nanahDeviceSelectionBusy = true; f.render({ primaryAction });
    assert.equal(f.action.disabled, true);
  }
});

test('cleared selection hides a disconnected fallback again while a receive-code intent remains actionable', () => {
  const f = fixture(); f.context.nanahFamilyDeviceSelectedIntent = { source: 'live-session' };
  f.render({ primaryAction: 'Review and send' }); assert.equal(f.preview.hidden, false);
  f.context.nanahFamilyDeviceSelectedIntent = null; f.render(); assert.equal(f.preview.hidden, true);
  f.context.nanahFamilyDeviceSelectedIntent = { source: 'join-button' };
  f.render({ title: 'Receive a parent update', primaryAction: 'Receive parent update' });
  assert.equal(f.preview.hidden, false); assert.equal(f.action.hidden, false);
  assert.equal(f.action.textContent, 'Receive parent update');
});
