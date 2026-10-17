import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const english = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
function actualFunction(name) {
  const match = new RegExp(`^([ ]*)(?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(match, name);
  const end = source.indexOf(`\n${match[1]}}`, match.index) + match[1].length + 2;
  return source.slice(match.index, end);
}
function element(tag) {
  const events = new Map();
  const node = { tagName: tag.toUpperCase(), children: [], dataset: {}, attributes: {},
    appendChild(child) { this.children.push(child); return child; },
    append(...children) { this.children.push(...children); },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, callback) { events.set(name, callback); },
    click() { events.get('click')?.(); }
  };
  Object.defineProperty(node, 'innerHTML', { set(value) { assert.equal(value, ''); this.children = []; } });
  return node;
}
function fixture() {
  const catalog = { ...english }; const selections = []; const previews = []; const requestedKeys = [];
  const context = {
    window: {}, document: { createElement: element },
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: value => Array.isArray(value) ? value : [], normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0,
    tabViewUiText: (key, fallback, values = {}) => {
      requestedKeys.push(key);
      return (catalog[key] || fallback).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
    },
    nanahFamilyDeviceSelectedIntent: null, nanahTrustedLinks: [], nanahSessionState: { connected: false, sasConfirmed: false, remoteDevice: { deviceId: 'live-id' } },
    isActiveChildNanahProfile: () => false,
    selectNanahLiveMapDevice: row => { selections.push(['live', row.id]); },
    selectNanahTrustedMapDevice: row => { selections.push(['saved', row.id]); },
    updateNanahFamilyDeviceMapSnapshot() {}, renderNanahHomeBridgePresenceRow() {}, renderNanahDeviceToolbar() {},
    setNanahCompassChoiceCopy() {}, getNanahLocalDeviceLabel: () => 'This computer',
    setNanahFamilyDeviceIntent(intent) { context.nanahFamilyDeviceSelectedIntent = intent; },
    profilesV4Cache: { activeProfileId: 'default', profiles: { default: { name: 'Default' } } },
    renderNanahDeviceSelectionPreview: preview => { previews.push(preview); }
  };
  const mapFunction = actualFunction('renderNanahFamilyDeviceMapViewModel');
  for (const id of new Set(mapFunction.match(/\bftNanah\w+/g))) context[id] = null;
  context.ftNanahTrustedDeviceStrip = element('div');
  context.ftNanahDeviceCompassRule = element('div');
  const constantsStart = source.indexOf('    const FAMILY_DEVICE_MAP_COPY =');
  const constantsEnd = source.indexOf('    function familyDeviceMapText(', constantsStart);
  vm.runInNewContext([
    actualFunction('tabViewCompileDisplayCopy'), actualFunction('tabViewDisplayCopy'), source.slice(constantsStart, constantsEnd),
    ...['familyDeviceMapText', 'familyDeviceMapCount', 'familyDeviceMapCopy', 'familyDeviceMapDeliveryStatus',
      'getNanahDevicePickerPrimaryAction', 'getNanahDevicePickerTileState', 'renderNanahTrustedDeviceStrip'].map(actualFunction), mapFunction
  ].join('\n'), context);
  return { context, catalog, selections, previews, requestedKeys, strip: context.ftNanahTrustedDeviceStrip,
    render: devices => context.renderNanahTrustedDeviceStrip({ devices }) };
}
function live(confirmed) { return {
  id: 'live-id', label: 'Other computer', profileName: 'Default', source: 'live-session',
  trustState: confirmed ? 'verified-live' : 'pairing', deliveryState: confirmed ? 'ready-live' : 'seen',
  primaryAction: confirmed ? 'Review and send' : 'Match safety phrase'
}; }

for (const confirmed of [false, true]) {
  test(`a live session with local confirmation=${confirmed} is never presented as saved trust`, () => {
    const f = fixture(); const row = live(confirmed); const original = clone(row);
    f.context.nanahSessionState.sasConfirmed = confirmed;
    f.render([row]);
    assert.equal(f.context.nanahTrustedLinks.length, 0);
    const tile = f.strip.children[0];
    assert.match(tile.attributes['aria-label'], /^Session device Other computer\./);
    assert.match(tile.title, /^Open session\./);
    assert.doesNotMatch([tile.attributes['aria-label'], tile.title, tile.dataset.filtertubeHelp].join(' '), /Saved device|Verified device|Choose this saved device/i);
    assert.match(tile.dataset.filtertubeHelp, /Saving device trust is a separate choice/);
    assert.equal(tile.dataset.primaryAction, row.primaryAction);
    assert.equal(tile.dataset.trustState, row.trustState);
    assert.deepEqual(row, original, 'display rendering leaves the source state untouched');
    tile.click(); assert.deepEqual(f.selections, [['live', 'live-id']]);
    if (!confirmed) assert.match(tile.children[1].children[1].textContent, /Match safety phrase/);
  });
}

test('saved and Home Bridge device labels and click behavior retain their established meaning', () => {
  const f = fixture();
  f.render([
    { id: 'saved-id', linkId: 'saved-link', source: 'trusted-link', label: 'Saved tablet', profileName: 'Child', trustState: 'verified', primaryAction: 'Send update' },
    { id: 'home-id', linkId: 'home-link', source: 'home-bridge-preview', label: 'Home tablet', trustState: 'verified', primaryAction: 'Send update' }
  ]);
  const saved = f.strip.children.find(tile => tile.dataset.source === 'trusted-link');
  const home = f.strip.children.find(tile => tile.dataset.source === 'home-bridge-preview');
  assert.match(saved.attributes['aria-label'], /^Saved device Saved tablet\./);
  assert.match(saved.title, /Verified device/);
  assert.match(saved.dataset.filtertubeHelp, /Choose this saved device/);
  assert.match(home.attributes['aria-label'], /^Home Bridge candidate Home tablet\./);
  assert.match(home.dataset.filtertubeHelp, /verified saved device surfaced by Home Bridge preview/);
  saved.click(); home.click();
  assert.deepEqual(f.selections, [['saved', 'saved-id'], ['saved', 'home-id']]);
});

test('locally confirmed personal and family map copy does not claim remote confirmation', () => {
  for (const personalSyncOpen of [false, true]) {
    const f = fixture();
    f.context.nanahSessionState.connected = true; f.context.nanahSessionState.sasConfirmed = true;
    f.context.renderNanahFamilyDeviceMapViewModel({ personalSyncOpen, liveReady: true, protectedCount: personalSyncOpen ? 0 : 1, devices: [live(true)] });
    const detail = f.previews.at(-1).detail;
    assert.equal(detail, 'Phrase confirmed here. Confirm it on the other device before sending.');
    assert.match(f.context.ftNanahDeviceCompassRule.textContent, /^Phrase confirmed here\. Confirm it on the other device/);
    assert.doesNotMatch(detail + f.context.ftNanahDeviceCompassRule.textContent, /Both devices are.*verified/);
    assert.equal(f.context.nanahSessionState.sasConfirmed, true);
  }
});

test('new live-session labels use the English catalog and the actual dynamic copy lookup', () => {
  const f = fixture();
  f.catalog['dashboard.sync.picker.liveSession'] = 'Localized open session';
  f.catalog['dashboard.sync.picker.liveSessionHelp'] = 'Localized session help';
  f.catalog['dashboard.sync.familyDeviceMap.trusted.sessionDevice'] = 'Localized session device {label}';
  f.render([live(false)]);
  assert.match(f.strip.children[0].title, /^Localized open session\./);
  assert.equal(f.strip.children[0].dataset.filtertubeHelp, 'Localized session help');
  assert.match(f.strip.children[0].attributes['aria-label'], /^Localized session device Other computer\./);
  for (const key of ['receiveLocalHelp', 'receiveEmpty', 'receiveSession']) assert.ok(english[`dashboard.sync.picker.${key}`]);
});

test('legacy translated claims about both devices cannot override new local confirmation keys', () => {
  const f = fixture();
  const oldKeys = ['selection.bothVerifiedDetail', 'map.bothDevicesOpenVerified', 'map.compassRuleLive']
    .map(key => `dashboard.sync.familyDeviceMap.${key}`);
  for (const key of oldKeys) f.catalog[key] = 'LEGACY: both devices verified';
  // Simulate a catalog that has the old translations but has not translated
  // the new local-only messages yet. It must use their accurate fallback.
  for (const key of ['selection.localPhraseConfirmedDetail', 'map.localPhraseConfirmedDetail', 'map.compassRuleLocalConfirmed']) {
    delete f.catalog[`dashboard.sync.familyDeviceMap.${key}`];
  }
  f.context.nanahSessionState.connected = true; f.context.nanahSessionState.sasConfirmed = true;
  f.context.renderNanahFamilyDeviceMapViewModel({ personalSyncOpen: false, liveReady: true, protectedCount: 1, devices: [live(true)] });
  assert.equal(f.previews.at(-1).detail, 'Phrase confirmed here. Confirm it on the other device before sending.');
  assert.equal(f.context.ftNanahDeviceCompassRule.textContent, 'Phrase confirmed here. Confirm it on the other device, then review and send the update.');
  assert.ok(f.requestedKeys.includes('dashboard.sync.familyDeviceMap.selection.localPhraseConfirmedDetail'));
  assert.ok(f.requestedKeys.includes('dashboard.sync.familyDeviceMap.map.compassRuleLocalConfirmed'));
  assert.ok(oldKeys.every(key => !f.requestedKeys.includes(key)));
  assert.ok(oldKeys.every(key => f.catalog[key] === 'LEGACY: both devices verified'), 'old translations are preserved but unused');
  f.catalog['dashboard.sync.familyDeviceMap.selection.localPhraseConfirmedDetail'] = 'LOCAL: phrase confirmed here';
  assert.equal(f.context.familyDeviceMapCopy('Phrase confirmed here. Confirm it on the other device before sending.'), 'LOCAL: phrase confirmed here');
});
