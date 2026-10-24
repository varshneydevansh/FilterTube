import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const ui = require('../../js/nanah_pairing_ui.js');
const html = fs.readFileSync(new URL('../../html/tab-view.html', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');

// The same small dependency-free DOM boundary used by the adjacent UI tests.
// Actual source HTML rendering is checked separately in the browser preview.
class Element {
    constructor(id, tagName, document) {
        this.id = id; this.tagName = tagName.toUpperCase(); this.ownerDocument = document;
        this.dataset = {}; this.hidden = false; this.disabled = false; this.textContent = '';
        this.children = []; this.parentElement = null; this.open = false;
    }
    append(node) { node.parentElement = this; this.children.push(node); }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelector(selector) {
        const id = selector.slice(1);
        const find = node => node.id === id ? node : node.children.map(find).find(Boolean);
        return find(this);
    }
    focus() { if (!this.disabled && !hidden(this)) this.ownerDocument.activeElement = this; }
}
function hidden(node) {
    for (let current = node; current; current = current.parentElement) if (current.hidden) return true;
    return false;
}
function fixture() {
    const document = { activeElement: null };
    const root = new Element('ftNanahPairingDetails', 'details', document); root.open = true;
    const tags = {
        ftNanahPurposeChooser: 'div', ftNanahPurposeDetails: 'details', ftNanahReceiverInstruction: 'p',
        ftNanahDeviceNameDetails: 'details', ftNanahFamilyShortcuts: 'details', ftNanahAdvancedDetails: 'details',
        ftNanahHostBtn: 'button', ftNanahJoinControls: 'div', ftNanahSendBtn: 'button', ftNanahTrustBtn: 'button',
        ftNanahEndSessionBtn: 'button', ftNanahRemoteTargetField: 'label', ftNanahManagedTargetsField: 'fieldset', ftNanahSendTransferSummary: 'p',
        ftNanahRemoteEndpointRow: 'div', ftNanahPhraseRow: 'div', ftNanahConfirmSasBtn: 'button',
        ftNanahPairCodeRow: 'div', ftNanahPairCode: 'strong', ftNanahPairUriRow: 'details',
        ftNanahQrWrap: 'div', ftNanahSavedLinksDetails: 'details', ftNanahQrReader: 'div',
        ftNanahQrStopBtn: 'button', ftNanahJoinCode: 'input', ftNanahStage: 'strong', ftNanahStatusHint: 'div',
        ftNanahModeParent: 'button', ftNanahModeSendOnce: 'button', ftNanahModeFull: 'button'
    };
    const nodes = Object.fromEntries(Object.entries(tags).map(([id, tag]) => [id, new Element(id, tag, document)]));
    const parents = {
        ftNanahJoinCode: 'ftNanahJoinControls', ftNanahQrStopBtn: 'ftNanahQrReader', ftNanahPairCode: 'ftNanahPairCodeRow',
        ftNanahModeParent: 'ftNanahPurposeChooser', ftNanahModeSendOnce: 'ftNanahPurposeChooser', ftNanahModeFull: 'ftNanahPurposeChooser'
    };
    for (const [id, node] of Object.entries(nodes)) (nodes[parents[id]] || root).append(node);
    nodes.ftNanahSendTransferSummary.textContent = 'Child rules → Mira on Living room TV';
    nodes.ftNanahQrReader.hidden = true;
    const base = { active: false, connected: false, phraseConfirmed: false, phrase: '', pairUri: '', code: '',
        canHost: true, canSend: false, canTrust: false, hasQrRenderer: true, savedLinkCount: 0, mode: 'send_once', targetVisible: true };
    const render = changes => ui.render({ root, state: { ...base, ...changes } });
    return { root, document, nodes, render, base };
}
const waiting = { active: true, code: 'ABCD', pairUri: 'nanah://pair/ABCD', canHost: false };
const verify = { ...waiting, connected: true, phrase: 'bright river green lantern' };
const ready = { ...verify, phraseConfirmed: true, canSend: true, canTrust: true };

test('phase progression requires an active session and phrase confirmation, never just connectivity', () => {
    assert.equal(ui.phase({}), 'connect');
    assert.equal(ui.phase({ ...ready, active: false }), 'connect');
    assert.equal(ui.phase({ active: true, connected: true }), 'waiting');
    assert.equal(ui.phase(waiting), 'waiting');
    assert.equal(ui.phase(verify), 'verify');
    assert.equal(ui.phase({ ...verify, connected: false }), 'verify');
    assert.equal(ui.phase(ready), 'share');
});

test('idle shows pre-handshake purpose and create/join choices, without placeholders or disabled future actions', () => {
    const f = fixture(); f.render();
    for (const id of ['ftNanahPurposeChooser', 'ftNanahHostBtn', 'ftNanahJoinControls']) assert.equal(hidden(f.nodes[id]), false, id);
    for (const id of ['ftNanahSendBtn', 'ftNanahTrustBtn', 'ftNanahEndSessionBtn', 'ftNanahRemoteTargetField', 'ftNanahConfirmSasBtn',
        'ftNanahPhraseRow', 'ftNanahQrWrap', 'ftNanahPairUriRow', 'ftNanahPairCodeRow', 'ftNanahSavedLinksDetails']) assert.equal(hidden(f.nodes[id]), true, id);
    assert.equal(f.nodes.ftNanahAdvancedDetails.open, false);
});

test('family mode explains the intended receiving profile before handshake, and all existing purpose controls remain intact', () => {
    const f = fixture(); f.render({ mode: 'parent_control' });
    assert.equal(hidden(f.nodes.ftNanahReceiverInstruction), false);
    for (const id of ['ftNanahModeParent', 'ftNanahModeSendOnce', 'ftNanahModeFull']) assert.equal(hidden(f.nodes[id]), false);
    f.render({ mode: 'full_account' });
    assert.equal(hidden(f.nodes.ftNanahReceiverInstruction), true);
});

test('receive-only children get code/QR connection without purpose, outgoing send or parent-trust actions', () => {
    const f = fixture();
    f.render({ childReceiveOnly: true, canHost: false, mode: 'parent_control' });
    assert.equal(hidden(f.nodes.ftNanahPurposeChooser), true);
    assert.equal(hidden(f.nodes.ftNanahFamilyShortcuts), true);
    assert.equal(hidden(f.nodes.ftNanahHostBtn), true);
    assert.equal(hidden(f.nodes.ftNanahJoinControls), false);
    f.render({ ...ready, canSend: false, canTrust: false, childReceiveOnly: true });
    assert.equal(hidden(f.nodes.ftNanahSendBtn), true);
    assert.equal(hidden(f.nodes.ftNanahTrustBtn), true);
    assert.equal(hidden(f.nodes.ftNanahRemoteTargetField), true);
    assert.equal(hidden(f.nodes.ftNanahEndSessionBtn), false);
});

test('waiting shows only real code/QR and cancellation; a missing QR renderer keeps the code fallback', () => {
    const f = fixture(); f.render(waiting);
    assert.equal(hidden(f.nodes.ftNanahPurposeChooser), true);
    assert.equal(hidden(f.nodes.ftNanahJoinControls), true);
    assert.equal(hidden(f.nodes.ftNanahPairCodeRow), false);
    assert.equal(hidden(f.nodes.ftNanahQrWrap), false);
    assert.equal(hidden(f.nodes.ftNanahPairUriRow), false);
    assert.equal(hidden(f.nodes.ftNanahEndSessionBtn), false);
    f.render({ ...waiting, hasQrRenderer: false });
    assert.equal(hidden(f.nodes.ftNanahQrWrap), true);
    assert.equal(hidden(f.nodes.ftNanahPairCodeRow), false);
});

test('phrase comparison precedes every outgoing action and ready keeps the exact reviewed recipient', () => {
    const f = fixture(); f.render(verify);
    assert.equal(hidden(f.nodes.ftNanahPhraseRow), false);
    assert.equal(hidden(f.nodes.ftNanahConfirmSasBtn), false);
    assert.equal(hidden(f.nodes.ftNanahSendBtn), true);
    assert.equal(hidden(f.nodes.ftNanahTrustBtn), true);
    f.render(ready);
    assert.equal(hidden(f.nodes.ftNanahConfirmSasBtn), true);
    assert.equal(hidden(f.nodes.ftNanahRemoteEndpointRow), false);
    assert.equal(hidden(f.nodes.ftNanahRemoteTargetField), false);
    assert.equal(hidden(f.nodes.ftNanahSendTransferSummary), false);
    assert.equal(f.nodes.ftNanahSendTransferSummary.textContent, 'Child rules → Mira on Living room TV');
    assert.equal(hidden(f.nodes.ftNanahSendBtn), false);
    assert.equal(hidden(f.nodes.ftNanahTrustBtn), false);
    assert.equal(hidden(f.nodes.ftNanahQrWrap), true);
    assert.equal(hidden(f.nodes.ftNanahPairCodeRow), true);
});

test('connected sessions retain their real code in state but show only the safety phrase', () => {
    const f = fixture();
    for (const state of [verify, ready]) {
        assert.equal(state.code, 'ABCD');
        f.render(state);
        assert.equal(hidden(f.nodes.ftNanahPairCodeRow), true);
        assert.equal(hidden(f.nodes.ftNanahPhraseRow), false);
    }
    f.render(waiting);
    assert.equal(hidden(f.nodes.ftNanahPairCodeRow), false);
    assert.equal(hidden(f.nodes.ftNanahPhraseRow), true);
    f.render({ ...waiting, code: '' });
    assert.equal(hidden(f.nodes.ftNanahPairCodeRow), true);
});

test('presentation preserves controller disabled flags, target restrictions and event/node identity', () => {
    const f = fixture(); const button = f.nodes.ftNanahSendBtn;
    button.disabled = true; button.listener = () => 'existing handler';
    f.render({ ...ready, canSend: false, targetVisible: false });
    assert.equal(hidden(button), true);
    assert.equal(button.disabled, true);
    assert.equal(hidden(f.nodes.ftNanahRemoteTargetField), true);
    assert.equal(f.root.querySelector('#ftNanahSendBtn'), button);
    assert.equal(button.listener(), 'existing handler');
});

test('multiple managed recipients remain available in the primary share review without changing selections', () => {
    const f = fixture(); const field = f.nodes.ftNanahManagedTargetsField;
    const mira = new Element('mira', 'input', f.document), ravi = new Element('ravi', 'input', f.document);
    mira.checked = true; ravi.checked = true; field.append(mira); field.append(ravi);
    f.render({ ...verify, managedTargetsVisible: true });
    assert.equal(hidden(field), true, 'verify phrase before choosing any outgoing recipients');
    f.render({ ...ready, managedTargetsVisible: true });
    assert.equal(hidden(field), false);
    assert.equal(mira.checked, true); assert.equal(ravi.checked, true);
    assert.equal(f.nodes.ftNanahAdvancedDetails.open, false);
    assert.equal(hidden(f.nodes.ftNanahAdvancedDetails), false, 'original advanced controls remain reachable during a session');
    f.render({ ...ready, managedTargetsVisible: false });
    assert.equal(hidden(field), true, 'presenter cannot invent eligible targets');
    f.render({ ...ready, managedTargetsVisible: true, childReceiveOnly: true });
    assert.equal(hidden(field), true);
    assert.equal(mira.checked, true); assert.equal(ravi.checked, true);
});

test('connected waiting with a retained code returns focus to visible status instead of its hidden code', () => {
    const f = fixture(); f.render(); const host = f.nodes.ftNanahHostBtn; host.focus();
    host.disabled = true; f.document.activeElement = null;
    ui.render({ root: f.root, state: { ...f.base, ...waiting, connected: true }, previouslyFocused: host });
    assert.equal(hidden(f.nodes.ftNanahPairCode), true);
    assert.equal(f.document.activeElement, f.nodes.ftNanahStage);
});

test('an open scanner remains visible with focus through a transport-state update', () => {
    const f = fixture(); f.render();
    f.nodes.ftNanahQrReader.hidden = false; f.nodes.ftNanahQrStopBtn.focus();
    f.render(waiting);
    assert.equal(hidden(f.nodes.ftNanahJoinControls), true);
    assert.equal(hidden(f.nodes.ftNanahQrReader), false);
    assert.equal(f.document.activeElement, f.nodes.ftNanahQrStopBtn);
});

test('a disappearing connect action hands focus to the actual code and then the mandatory phrase action', () => {
    const f = fixture(); f.render(); f.nodes.ftNanahHostBtn.focus();
    f.render(waiting);
    assert.equal(f.document.activeElement, f.nodes.ftNanahPairCode);
    f.render(); f.nodes.ftNanahJoinCode.focus(); f.render(verify);
    assert.equal(f.document.activeElement, f.nodes.ftNanahConfirmSasBtn);
    f.render(ready);
    assert.equal(f.document.activeElement, f.nodes.ftNanahSendBtn);
});

test('focus captured before native disabling is restored after that action blurs', () => {
    const f = fixture(); f.render(); const host = f.nodes.ftNanahHostBtn; host.focus();
    host.disabled = true; f.document.activeElement = null;
    ui.render({ root: f.root, state: { ...f.base, ...verify }, previouslyFocused: host });
    assert.equal(f.document.activeElement, f.nodes.ftNanahConfirmSasBtn);
    assert.equal(host.disabled, true);
});

test('cancel/retry returns focus to connection and retains the real error/status message', () => {
    const f = fixture(); f.render(waiting); f.nodes.ftNanahEndSessionBtn.focus();
    f.nodes.ftNanahStatusHint.textContent = 'Connection ended. Retry when your other device is ready.';
    f.render({ notice: true });
    assert.equal(f.document.activeElement, f.nodes.ftNanahHostBtn);
    assert.equal(f.nodes.ftNanahStatusHint.textContent, 'Connection ended. Retry when your other device is ready.');
    assert.equal(f.root.dataset.pairingPhase, 'connect');
    assert.equal(hidden(f.nodes.ftNanahQrWrap), true);
});

test('rendering never claims or changes trust, permission, copy or disclosure state', () => {
    const f = fixture(); f.nodes.ftNanahPurposeDetails.open = true;
    f.render(); f.nodes.ftNanahJoinCode.focus();
    for (let count = 0; count < 3; count++) f.render({ savedLinkCount: 2 });
    assert.equal(f.document.activeElement, f.nodes.ftNanahJoinCode);
    assert.equal(f.nodes.ftNanahPurposeDetails.open, true);
    assert.equal(hidden(f.nodes.ftNanahSavedLinksDetails), false);
    assert.equal(f.nodes.ftNanahJoinCode.disabled, false);
    assert.equal(ui.render({ root: null, state: ready }), undefined);
});

test('actual HTML keeps controls unique, scanner outside JoinControls, and production presenter is optional', () => {
    const f = fixture();
    for (const id of Object.keys(f.nodes)) assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, id);
    const scanner = html.indexOf('<div id="ftNanahQrReader"');
    const join = html.indexOf('<div id="ftNanahJoinControls">');
    const intervening = html.slice(join, scanner);
    const tags = intervening.match(/<\/?div\b[^>]*>/g);
    assert.equal(tags.reduce((depth, tag) => depth + (tag.startsWith('</') ? -1 : 1), 0), 0, 'scanner must not descend from hidden join controls');
    // Parse source ancestors: the real multi-recipient field must not live inside a closed advanced disclosure.
    const fieldPosition = html.indexOf('id="ftNanahManagedTargetsField"');
    const fieldTag = html.lastIndexOf('<fieldset', fieldPosition);
    const stack = [], voidTags = new Set(['input', 'img', 'link', 'meta', 'br', 'hr', 'source']);
    for (const match of html.slice(0, fieldTag).matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
        const [, close, name, attrs] = match; const tag = name.toLowerCase();
        if (voidTags.has(tag)) continue;
        if (close) stack.pop(); else stack.push({ tag, attrs });
    }
    assert.equal(stack.some(parent => /id="ftNanahAdvancedDetails"/.test(parent.attrs)), false);
    assert.ok(stack.some(parent => /class="nanah-sync-form nanah-sync-form--primary"/.test(parent.attrs)));
    assert.match(source, /managedTargetsVisible: ftNanahManagedTargetsField\?\.hidden === false/);
    assert.match(source, /window\.FilterTubeNanahPairingUI\?\.render\?\.\(/);
    assert.ok(html.indexOf('js/nanah_pairing_ui.js') < html.indexOf('js/tab-view.js'));
    assert.match(html, /Keep Accounts &amp; Sync open on both devices while connecting and sending\./);
});
