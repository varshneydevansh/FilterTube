import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const ui = require('../../js/device_auto_sync_ui.js');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
class Element {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName; this.ownerDocument = ownerDocument; this.children = []; this.parentNode = null;
        this.attributes = {}; this.listeners = {}; this._text = ''; this._disabled = false; this.value = ''; this.checked = false;
    }
    set textContent(value) { this._text = String(value); for (const child of this.children) child.parentNode = null; this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set disabled(value) { this._disabled = value; if (value && this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null; }
    get disabled() { return this._disabled; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    appendChild(child) { child.remove(); child.parentNode = this; this.children.push(child); return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; } }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    focus() { if (!this.disabled) this.ownerDocument.activeElement = this; }
    addEventListener(event, fn) { (this.listeners[event] ||= []).push(fn); }
    async emit(event) { if (event === 'click' && this.disabled) return; await Promise.all((this.listeners[event] || []).map(fn => fn({ target: this }))); }
}
const walk = node => [node, ...node.children.flatMap(walk)];
const by = (root, predicate) => walk(root).find(predicate);
const classNode = (root, name) => by(root, node => (node.className || '').split(' ').includes(name));
function visible(node) {
    for (let current = node; current; current = current.parentNode) {
        if (current.hidden) return false;
        const parent = current.parentNode;
        if (parent?.tagName === 'details' && parent.open !== true && current.tagName !== 'summary') return false;
    }
    return true;
}
const visibleText = root => walk(root).filter(visible).map(node => node._text).join(' ');
function fixture(initial = {}) {
    const document = { activeElement: null, createElement: name => new Element(name, document) };
    const root = document.createElement('main'), calls = [];
    let model = { managed: [{ id: 'parent-child', label: 'Child on TV', detail: 'Parent → child on Living room TV', enabled: false, status: 'Off' }],
        personal: [], canPairPersonal: true, notice: '', ...initial }, subscriber, unsubscribed = false;
    const controller = {
        view: async () => structuredClone(model),
        setManaged: async (id, enabled) => { calls.push(['managed', id, enabled]); model.managed.find(row => row.id === id).enabled = enabled; },
        disablePersonal: async id => { calls.push(['stop', id]); model.personal = model.personal.filter(row => row.id !== id); },
        requestPersonal: async areas => { calls.push(['personal', areas]); return { ok: true }; },
        resolvePersonal: async (id, choice) => { calls.push(['resolve', id, choice]); model.personal.find(row => row.id === id).needsReview = false; return true; },
        run: async () => { calls.push(['run']); },
        subscribe: callback => { subscriber = callback; return () => { unsubscribed = true; }; }
    };
    const context = {}, installed = ui.install({ root, controller, context });
    return { document, root, calls, controller, context, installed, update: next => { model = { ...model, ...next }; },
        publish: () => subscriber(), unsubscribed: () => unsubscribed, model: () => model };
}
const button = (root, phrase) => by(root, node => node.tagName === 'button' && node.textContent.includes(phrase));
const inputs = root => walk(root).filter(node => node.tagName === 'input');

test('personal areas start off, device-only copy is truthful, and controls have native semantics', async () => {
    const f = fixture(); await f.installed.ready;
    assert.match(f.root.textContent, /Peer-to-peer sync/);
    assert.match(f.root.textContent, /Keep Accounts & Sync open/);
    assert.match(visibleText(f.root), /both Accounts & Sync pages are open and connected/);
    assert.match(f.root.textContent, /Optional pickup services/);
    assert.deepEqual(inputs(f.root).map(input => input.checked), [false, false]);
    assert.equal(button(f.root, 'Link this profile').disabled, true);
    assert.equal(by(f.root, node => node.tagName === 'select').disabled, false);
    assert.equal(walk(f.root).filter(node => node.tagName === 'button').every(node => node.type === 'button'), true);
});
test('turn-on applies only to the chosen exact connection', async () => {
    const f = fixture({ managed: [
        { id: 'child-A', label: 'First child', enabled: false }, { id: 'child-B', label: 'Second child', enabled: false }
    ] }); await f.installed.ready;
    const select = by(f.root, node => node.tagName === 'select');
    assert.equal(select.value, ''); assert.equal(button(f.root, 'Turn on').disabled, true);
    select.value = 'child-B'; await select.emit('change'); await button(f.root, 'Turn on').emit('click');
    assert.deepEqual(f.calls, [['managed', 'child-B', true]]);
    assert.match(button(f.root, 'Turn off').getAttribute('aria-label'), /Second child/);
});
test('polling preserves focused controls, option identity and explicit route choice', async () => {
    const f = fixture(); await f.installed.ready;
    const toggle = button(f.root, 'Turn on'), select = by(f.root, node => node.tagName === 'select');
    const option = select.children[1]; toggle.focus();
    f.update({ managed: [{ ...f.model().managed[0], status: 'Waiting for device' }] });
    await f.installed.refresh(); await f.installed.refresh();
    assert.equal(f.document.activeElement, toggle); assert.equal(button(f.root, 'Turn on'), toggle);
    assert.equal(select.children[1], option); assert.equal(select.value, 'parent-child');
    assert.equal(classNode(f.root, 'ft-auto-sync__status').textContent, 'Waiting for device');
});
test('asynchronous save retains focus and blocks duplicate actions without disabling its focused button', async () => {
    const f = fixture(); await f.installed.ready;
    const response = deferred(); f.controller.setManaged = async () => response.promise;
    const toggle = button(f.root, 'Turn on'); toggle.focus();
    const action = toggle.emit('click');
    assert.equal(toggle.disabled, false); assert.equal(toggle.getAttribute('aria-disabled'), 'true');
    assert.equal(f.document.activeElement, toggle);
    await toggle.emit('click'); response.resolve(true); await action;
    assert.equal(f.document.activeElement, toggle); assert.equal(toggle.getAttribute('aria-disabled'), 'false');
});
test('personal linking sends only the selected areas and clears transient choices after request', async () => {
    const f = fixture(); await f.installed.ready;
    const [settings, notes] = inputs(f.root); notes.checked = true; await notes.emit('change');
    const link = button(f.root, 'Link this profile'); assert.equal(link.disabled, false); link.focus();
    await link.emit('click');
    assert.deepEqual(f.calls, [['personal', { settings: false, notes: true }]]);
    assert.equal(settings.checked, false); assert.equal(notes.checked, false);
    assert.equal(link.disabled, true);
    assert.match(classNode(f.root, 'ft-auto-sync__action-status').textContent, /other device must approve/);
    assert.equal(f.document.activeElement.tagName, 'h5');
});
test('unverified connection cannot request personal auto-sync', async () => {
    const f = fixture({ canPairPersonal: false }); await f.installed.ready;
    for (const input of inputs(f.root)) assert.equal(input.disabled, true);
    const notes = inputs(f.root)[1]; notes.checked = true; await notes.emit('change');
    assert.equal(button(f.root, 'Link this profile').disabled, true);
    await button(f.root, 'Link this profile').emit('click'); assert.deepEqual(f.calls, []);
});
test('personal rows retain focus while updated and hand it off when the selected grant disappears', async () => {
    const f = fixture({ personal: [{ id: 'own-phone', label: 'My phone', detail: 'My profile', status: 'Up to date' }] });
    await f.installed.ready;
    const stop = button(f.root, 'Stop syncing'); stop.focus();
    f.update({ personal: [{ ...f.model().personal[0], status: 'Waiting for device' }] }); await f.installed.refresh();
    assert.equal(button(f.root, 'Stop syncing'), stop); assert.equal(f.document.activeElement, stop);
    await stop.emit('click'); assert.deepEqual(f.calls, [['stop', 'own-phone']]);
    assert.equal(f.document.activeElement.tagName, 'h5');
});
test('peer-provided display text is never interpreted as markup', async () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const f = fixture({ notice: malicious, managed: [{ id: 'x', label: malicious, detail: malicious, status: malicious }],
        personal: [{ id: 'p', label: malicious, detail: malicious, status: malicious }] }); await f.installed.ready;
    assert.match(f.root.textContent, /<img src=x/);
    assert.equal(walk(f.root).some(node => ['img', 'script'].includes(node.tagName)), false);
    assert.equal(walk(f.root).some(node => Object.hasOwn(node, 'innerHTML')), false);
});
test('late view responses cannot replace newer state or steal focus', async () => {
    const f = fixture(); await f.installed.ready;
    const older = deferred(), newer = deferred(); let reads = 0;
    f.controller.view = () => ++reads === 1 ? older.promise : newer.promise;
    const first = f.installed.refresh(), second = f.installed.refresh();
    newer.resolve({ ...f.model(), notice: 'Newest' }); await second;
    older.resolve({ ...f.model(), notice: 'Stale' }); await first;
    assert.equal(classNode(f.root, 'ft-auto-sync__notice').textContent, 'Newest');
});
test('failed mutations preserve the shown preference and do not claim success', async () => {
    const f = fixture(); await f.installed.ready;
    f.controller.setManaged = async () => false;
    await button(f.root, 'Turn on').emit('click');
    assert.ok(button(f.root, 'Turn on')); assert.match(classNode(f.root, 'ft-auto-sync__action-status').textContent, /Could not confirm/);
    assert.equal(f.model().managed[0].enabled, false);
});
test('failed refresh after mutation cannot overwrite unavailable status with a success claim', async () => {
    const f = fixture(); await f.installed.ready;
    f.controller.view = async () => { throw Error('storage failed'); };
    await button(f.root, 'Turn on').emit('click');
    assert.match(classNode(f.root, 'ft-auto-sync__action-status').textContent, /status is unavailable/);
});
test('changing selected device context updates the route without sending anything', async () => {
    const f = fixture({ managed: [{ id: 'A', label: 'A', enabled: false }, { id: 'B', label: 'B', enabled: false }] });
    await f.installed.ready; f.context.selectedLinkId = 'B'; await f.installed.refresh();
    assert.equal(by(f.root, node => node.tagName === 'select').value, 'B'); assert.deepEqual(f.calls, []);
});
test('unavailable routes cannot enable Auto-sync but an existing invalid enrollment can still be stopped', async () => {
    const f = fixture({ managed: [{ id: 'ineligible', label: 'Needs re-pairing', available: false, enabled: false }] });
    await f.installed.ready;
    assert.equal(button(f.root, 'Turn on').disabled, true);
    assert.match(classNode(f.root, 'ft-auto-sync__detail').textContent, /Review this verified profile connection/);
    f.update({ managed: [{ id: 'ineligible', label: 'Needs re-pairing', available: false, enabled: true }] });
    await f.installed.refresh(); assert.equal(button(f.root, 'Turn off').disabled, false);
});
test('settings conflict review offers exact local/remote choices without exposing conflict payloads', async () => {
    const f = fixture({ personal: [{ id: 'own-phone', label: 'My phone', status: 'Needs review', needsReview: true,
        conflict: { text: 'private note content', fields: ['not rendered'] } }] }); await f.installed.ready;
    const disclosure = classNode(f.root, 'ft-auto-sync__conflict');
    assert.equal(disclosure.hidden, false); assert.equal(disclosure.open, undefined);
    assert.match(disclosure.textContent, /Review settings conflict/);
    assert.doesNotMatch(disclosure.textContent, /private note content|not rendered/);
    disclosure.open = true; const useRemote = button(f.root, 'Use other device'); useRemote.focus();
    await f.installed.refresh(); assert.equal(classNode(f.root, 'ft-auto-sync__conflict'), disclosure);
    assert.equal(disclosure.open, true); assert.equal(f.document.activeElement, useRemote);
    await useRemote.emit('click'); assert.deepEqual(f.calls, [['resolve', 'own-phone', 'remote']]);
    assert.equal(disclosure.hidden, true); assert.equal(f.document.activeElement, button(f.root, 'Stop syncing'));
});
test('keep-this-device review calls local decision and ordinary rows keep the disclosure hidden', async () => {
    const f = fixture({ personal: [{ id: 'own-phone', label: 'My phone', status: 'Up to date' }] }); await f.installed.ready;
    assert.equal(classNode(f.root, 'ft-auto-sync__conflict').hidden, true);
    f.update({ personal: [{ id: 'own-phone', label: 'My phone', status: 'Needs review', needsReview: true }] });
    await f.installed.refresh(); await button(f.root, 'Keep this device').emit('click');
    assert.deepEqual(f.calls, [['resolve', 'own-phone', 'local']]);
});
test('dispose unsubscribes and ignores outstanding refreshes', async () => {
    const f = fixture(); await f.installed.ready;
    const response = deferred(); f.controller.view = () => response.promise;
    const refresh = f.installed.refresh(); f.installed.dispose(); response.resolve(f.model()); await refresh;
    assert.equal(f.root.children.length, 0); assert.equal(f.unsubscribed(), true);
});
test('empty device state shows one short next step instead of disabled controls or technical sections', async () => {
    const f = fixture({ managed: [], personal: [], canPairPersonal: false, notice: 'Technical provider details' });
    await f.installed.ready;
    assert.match(visibleText(f.root), /Peer-to-peer sync/);
    assert.match(visibleText(f.root), /Add a device, verify it, then choose what to sync\./);
    assert.doesNotMatch(visibleText(f.root), /Parent updates|Your synced profiles|Settings and filter rules|Link this profile|pickup|Technical provider/);
    assert.equal(walk(f.root).filter(node => ['button', 'input', 'select', 'summary'].includes(node.tagName) && visible(node)).length, 0);
});
test('managed-only view shows its exact route and action without personal setup controls', async () => {
    const f = fixture({ personal: [], canPairPersonal: false }); await f.installed.ready;
    assert.equal(visible(classNode(f.root, 'ft-auto-sync__selected-route')), true);
    assert.equal(classNode(f.root, 'ft-auto-sync__selected-route').textContent, 'Child on TV');
    assert.equal(visible(button(f.root, 'Turn on')), true);
    assert.equal(visible(by(f.root, node => node.tagName === 'select')), false);
    assert.doesNotMatch(visibleText(f.root), /Sync this profile|Saved video notes|Link this profile|Optional pickup/);
    assert.match(visibleText(f.root), /Direct between your devices while both Accounts & Sync pages are open and connected\. Offline changes wait here\./);
});
test('verified personal connection presents choices directly; saved profiles put additional setup behind one expander', async () => {
    const f = fixture({ managed: [], personal: [], canPairPersonal: true }); await f.installed.ready;
    assert.equal(inputs(f.root).every(visible), true);
    assert.equal(visible(button(f.root, 'Link another profile')), false);
    f.update({ personal: [{ id: 'own-phone', label: 'My profile on Phone', status: 'Up to date' }] });
    await f.installed.refresh();
    assert.equal(inputs(f.root).some(visible), false);
    assert.equal(visible(button(f.root, 'Stop syncing')), true);
    const expander = button(f.root, 'Link another profile');
    assert.equal(visible(expander), true); assert.equal(expander.getAttribute('aria-expanded'), 'false');
    expander.focus(); await expander.emit('click');
    assert.equal(expander.getAttribute('aria-expanded'), 'true'); assert.equal(inputs(f.root).every(visible), true);
    assert.equal(f.document.activeElement, expander); await f.installed.refresh();
    assert.equal(inputs(f.root).every(visible), true); assert.equal(f.document.activeElement, expander);
});
test('saved profiles without a live verified connection expose only a connect hint when setup is expanded', async () => {
    const f = fixture({ managed: [], canPairPersonal: false, personal: [{ id: 'saved', label: 'My phone', status: 'Waiting for device' }] });
    await f.installed.ready; await button(f.root, 'Link another profile').emit('click');
    assert.match(visibleText(f.root), /Connect and verify your other device/);
    assert.equal(inputs(f.root).some(visible), false); assert.equal(visible(button(f.root, 'Link this profile')), false);
});
test('technical requirements stay in a closed explanation while its current notice remains available', async () => {
    const f = fixture({ notice: 'Configured pickup is optional.' }); await f.installed.ready;
    const how = classNode(f.root, 'ft-auto-sync__how'); assert.equal(how.open, false);
    assert.doesNotMatch(visibleText(f.root), /Keep Accounts & Sync open|Configured pickup/);
    how.open = true;
    assert.match(visibleText(f.root), /Keep Accounts & Sync open/); assert.match(visibleText(f.root), /Configured pickup is optional/);
});
test('a focused area that disappears hands focus to the visible sync heading', async () => {
    const f = fixture({ managed: [], canPairPersonal: true }); await f.installed.ready;
    const notes = inputs(f.root)[1]; notes.focus();
    f.update({ canPairPersonal: false }); await f.installed.refresh();
    const heading = classNode(f.root, 'ft-auto-sync__title');
    assert.equal(f.document.activeElement, heading); assert.equal(visible(heading), true);
    f.update({ managed: [{ id: 'child', label: 'Exact child on TV', enabled: true }] }); await f.installed.refresh();
    button(f.root, 'Turn off').focus(); f.update({ managed: [] }); await f.installed.refresh();
    assert.equal(f.document.activeElement, heading); assert.equal(visible(heading), true);
});
test('a failed status read remains visible even when no connection controls can be shown', async () => {
    const f = fixture({ managed: [], personal: [], canPairPersonal: false }); await f.installed.ready;
    f.controller.view = async () => { throw Error('storage unavailable'); };
    await f.installed.refresh();
    assert.match(visibleText(f.root), /Auto-sync status is unavailable/);
    assert.equal(walk(f.root).filter(node => ['button', 'input', 'select'].includes(node.tagName) && visible(node)).length, 0);
});
