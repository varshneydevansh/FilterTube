import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const navigation = fs.readFileSync(new URL('../../js/family_device_navigation.js', import.meta.url), 'utf8');
function actualFunction(name) {
  const match = new RegExp(`^    (?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(match, name);
  const end = source.indexOf('\n    }\n', match.index) + '\n    }'.length;
  return source.slice(match.index, end);
}

function fixture() {
  const document = { defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) } };
  function element(tag) {
    const listeners = new Map();
    const node = {
      tagName: tag.toUpperCase(), ownerDocument: document, dataset: {}, children: [], attributes: {}, tabIndex: tag === 'button' ? 0 : -1,
      appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
      append(...children) { children.forEach(child => this.appendChild(child)); },
      contains(other) { for (let current = other; current; current = current.parentElement) if (current === this) return true; return false; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener(name, callback) { const handlers = listeners.get(name) || []; handlers.push(callback); listeners.set(name, handlers); },
      removeEventListener(name, callback) { listeners.set(name, (listeners.get(name) || []).filter(handler => handler !== callback)); },
      matches(selector) {
        return selector.split(',').some(raw => {
          const part = raw.trim();
          if (part === ':disabled') return this.disabled === true;
          const tag = part.match(/^[a-z]+/i)?.[0];
          if (tag && tag.toUpperCase() !== this.tagName) return false;
          if (part.startsWith('#') && this.id !== part.slice(1)) return false;
          if (part.startsWith('.') && !(this.className || '').split(' ').includes(part.slice(1))) return false;
          for (const match of part.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)) {
            const key = match[1];
            const value = key.startsWith('data-') ? this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] : this[key] ?? this.attributes[key];
            if (value === undefined || value === false || (match[2] !== undefined && String(value) !== match[2])) return false;
          }
          return true;
        });
      },
      closest(selector) { for (let current = this; current; current = current.parentElement) if (current.matches(selector)) return current; return null; },
      querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 200, height: 44 }; },
      getClientRects() { return this.closest('[hidden]') || !document.body.contains(this) ? [] : [this.getBoundingClientRect()]; },
      focus() { document.activeElement = this; }, scrollIntoView() {},
      dispatch(type, props = {}) {
        const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...props };
        for (let current = this; current; current = current.parentElement) for (const callback of listenersFor(current, type)) callback(event);
        return event;
      },
      remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
    };
    function listenersFor(current, type) { return current._listeners?.get(type) || []; }
    node._listeners = listeners;
    Object.defineProperty(node, 'innerHTML', { set(value) {
      assert.equal(value, '');
      if (this.contains(document.activeElement)) document.activeElement = document.body;
      this.children.forEach(child => { child.parentElement = null; }); this.children = [];
    } });
    return node;
  }
  document.createElement = element; document.body = element('body'); document.documentElement = document.body; document.activeElement = document.body;
  const card = document.body.appendChild(element('section'));
  const compass = card.appendChild(element('div'));
  const strip = compass.appendChild(element('div'));
  const preview = compass.appendChild(element('div')); preview.id = 'ftNanahDeviceSelectionPreview';
  for (const tag of ['span', 'strong', 'small']) preview.appendChild(element(tag));
  const action = preview.appendChild(element('button')); action.id = 'ftNanahDeviceSelectionActionBtn';
  const window = {};
  const context = {
    window, document,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}, safeArray: value => Array.isArray(value) ? value : [],
    normalizeString: value => typeof value === 'string' ? value.trim() : '', normalizeNonNegativeInteger: value => Math.max(0, Number(value) || 0),
    familyDeviceMapCopy: value => value, familyDeviceMapText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')),
    familyDeviceMapCount: (count, _one, _many, one, many) => (count === 1 ? one : many).replace('{count}', count),
    familyDeviceMapDeliveryStatus: value => value,
    activeProfileId: 'default', profilesV4Cache: { activeProfileId: 'default', profiles: { default: { name: 'Parent', type: 'account' } } },
    nanahSessionState: {}, nanahFamilyDeviceSelectedIntent: null, nanahDeviceSelectionBusy: false, nanahStableDeviceId: 'parent-device',
    nanahHomeBridgePreviewState: {}, nanahNearbyDiscoveryState: {}, nanahNearbyDiscoverySession: {}, nanahNearbyVisibilityState: {},
    nanahTrustedLinks: ['mira', 'leo'].map(name => ({ linkId: `link-${name}`, remoteDeviceId: 'same-physical-tablet', deviceLabel: 'Shared tablet',
      linkType: 'managed_link', localRole: 'source', remoteRole: 'replica', policy: { targetProfileId: name, targetProfileName: name === 'mira' ? 'Mira' : 'Leo' } })),
    normalizeNanahTrustedLink: value => value, formatNanahManagedSourceAckSyncStatus: () => 'Ready', isNanahManagedLinkSavedUpdateEnabled: () => true,
    isNanahHomeBridgePreviewFresh: () => false, normalizeNanahNearbyCandidate: value => value,
    getNanahLocalDeviceLabel: () => 'Parent computer', isActiveChildNanahProfile: () => false,
    updateNanahFamilyDeviceMapSnapshot() {}, renderNanahHomeBridgePresenceRow() {}, setNanahCompassChoiceCopy() {}, renderNanahDeviceToolbar() {}, renderNanahFamilyDeviceIntent() {}
  };
  const mapFunction = actualFunction('renderNanahFamilyDeviceMapViewModel');
  for (const id of new Set(mapFunction.match(/\bftNanah\w+/g))) context[id] = null;
  Object.assign(context, { ftNanahDeviceCompass: compass, ftNanahTrustedDeviceStrip: strip, ftNanahDeviceSelectionPreview: preview,
    ftNanahDeviceSelectionActionBtn: action, ftNanahSyncShell: { dataset: {} } });
  vm.runInNewContext(navigation, context);
  vm.runInNewContext(['getNanahFamilyDeviceMapActionContract', 'attachNanahFamilyDeviceMapActionContract', 'buildNanahFamilyDeviceMapViewModel',
    'getNanahDevicePickerPrimaryAction', 'getNanahDevicePickerTileState', 'setNanahCompassSelectedButton', 'setNanahFamilyDeviceIntent',
    'selectNanahTrustedMapDevice', 'renderNanahTrustedDeviceStrip', 'renderNanahDeviceSelectionPreview', 'renderNanahFamilyDeviceMapViewModel'].map(actualFunction).join('\n'), context);
  window.FilterTubeFamilyDeviceNavigation.install(card);
  function render() {
    const model = context.buildNanahFamilyDeviceMapViewModel({ deliverySummary: { protectedProfileCount: 2, verifiedProfileCount: 2 }, mailbox: {}, local: {} });
    context.renderNanahFamilyDeviceMapViewModel(model); return model;
  }
  return { context, document, strip, preview, action, render };
}

test('production builder keeps two receiving profiles on one physical device distinct through review, Escape and polling', async () => {
  const f = fixture(); const model = f.render();
  const rows = model.devices.filter(row => row.source === 'trusted-link');
  assert.deepEqual(Array.from(rows, row => row.id), ['link-mira', 'link-leo'], 'production row identity uses the bound link, not physical device ID');
  const second = f.strip.children[1]; second.focus(); second.dispatch('click'); await Promise.resolve();
  assert.equal(f.document.activeElement, f.action);
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.linkId, 'link-leo');
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.profileId, 'leo');
  assert.equal(f.preview.querySelector('strong').textContent, 'Shared tablet - Leo');
  f.action.dispatch('keydown', { key: 'Escape' }); assert.equal(f.document.activeElement, second);
  f.render();
  const replacement = f.strip.children[1];
  assert.notEqual(replacement, second); assert.equal(f.document.activeElement, replacement);
  assert.deepEqual(f.strip.children.map(tile => tile.attributes['aria-pressed']), ['false', 'true']);
  assert.equal(f.preview.querySelector('strong').textContent, 'Shared tablet - Leo');
  replacement.dispatch('click'); await Promise.resolve(); assert.equal(f.document.activeElement, f.action);
  f.render(); assert.equal(f.document.activeElement, f.action, 'polling cannot steal review focus');
  f.action.dispatch('keydown', { key: 'Escape' });
  assert.equal(f.document.activeElement, f.strip.children[1]);
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.linkId, 'link-leo');
});
