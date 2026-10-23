import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const contract = require('../../js/shared/saved_video_notes.js');
const key = { profileId: 'Parent', videoId: 'abcdefghijk' };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
class Element {
    constructor(tag = 'div') { this.tagName = tag; this.value = ''; this.hidden = false; this.disabled = false;
        this.children = []; this.events = new Map(); this.attributes = new Map(); this.content = ''; }
    set textContent(value) { this.content = value; this.children = []; }
    get textContent() { return this.content + this.children.map(child => child.textContent).join(''); }
    set innerHTML(_value) { throw Error('Personal text must not be interpreted as HTML'); }
    append(...nodes) { this.children.push(...nodes); }
    appendChild(node) { this.append(node); }
    replaceChildren(...nodes) { this.content = ''; this.children = nodes; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    addEventListener(name, fn) { this.events.set(name, fn); }
    setRangeText(value, start, end) { this.value = this.value.slice(0, start) + value + this.value.slice(end); this.selectionStart = this.selectionEnd = start + value.length; }
    focus() { this.focused = true; }
    click() { return this.events.get('click')?.({ preventDefault() {} }); }
}
function fixture(initial = null, initialDraft = null) {
    const nodes = new Map(), requests = [], storageListeners = [];
    const ids = ['text', 'status', 'updates', 'versions', 'counter', 'save', 'delete', 'undo', 'preview', 'keep', 'form', 'review', 'close', 'confirm', 'stay', 'discard', 'insert-time', 'moments', 'moments-list'];
    for (const id of ids) nodes.set(id, new Element(id));
    for (const id of ['updates', 'versions', 'keep', 'undo', 'confirm']) nodes.get(id).hidden = true;
    let record = initial, draft = initialDraft, denied = false, deferredSave = false, resolveSave = null;
    const document = { getElementById: id => nodes.get(id), createElement: tag => new Element(tag),
        createTextNode: text => { const node = new Element('text'); node.textContent = text; return node; }, addEventListener() {} };
    const respondSave = (request, cb) => {
        if (JSON.stringify(request.base) !== JSON.stringify(record)) cb({ ok: true, saved: false, record });
        else {
            record = contract.edit(key, record, 'local', request.text === null || !request.text.trim() ? null : request.text.trimEnd());
            cb({ ok: true, saved: true, record });
        }
    };
    const api = { runtime: { sendMessage(request, cb) {
        requests.push(structuredClone(request));
        if (denied) { cb({ ok: false }); return; }
        const action = request.action.slice('FilterTube_Notes'.length);
        if (action === 'Read') cb({ ok: true, record, draft });
        else if (action === 'Position') cb({ ok: true, seconds: 90, duration: 180 });
        else if (action === 'Draft') { draft = structuredClone(request); cb({ ok: true }); }
        else if (action === 'Save') {
            if (deferredSave) resolveSave = () => respondSave(request, cb); else respondSave(request, cb);
        } else { if (action === 'DiscardDraft') draft = null; cb({ ok: true }); }
    } }, storage: { onChanged: { addListener: fn => storageListeners.push(fn) } } };
    vm.runInNewContext(fs.readFileSync('js/video_notes_editor.js', 'utf8'), {
        chrome: api, document, location: { hash: '#key=private-capability' }, URLSearchParams, setInterval() {}
    });
    const event = async (id, name = 'click') => { await nodes.get(id).events.get(name)?.({ preventDefault() {} }); await flush(); };
    const input = async value => { nodes.get('text').value = value; await event('text', 'input'); };
    return { nodes, requests, event, input,
        incoming: async next => { record = next; for (const fn of storageListeners) fn({ ftSavedVideoNotesV1: {} }, 'local'); await flush(); },
        defer: () => { deferredSave = true; }, finish: async () => { resolveSave(); await flush(); },
        deny: async () => { denied = true; for (const fn of storageListeners) fn({ ftSavedVideoNotesV1: {} }, 'local'); await flush(); } };
}
test('an untouched editor follows committed updates; a dirty draft survives without adopting an unseen base', async () => {
    const original = contract.edit(key, null, 'other', 'Original'); const f = fixture(original); await flush();
    const next = contract.edit(key, original, 'other', 'Changed'); await f.incoming(next);
    assert.equal(f.nodes.get('text').value, 'Changed');
    await f.input('My draft'); const latest = contract.edit(key, next, 'other', 'New saved text'); await f.incoming(latest);
    assert.equal(f.nodes.get('text').value, 'My draft'); assert.equal(f.nodes.get('updates').hidden, false);
    assert.equal(f.nodes.get('save').disabled, true);
    await f.event('review'); assert.equal(f.nodes.get('versions').textContent.includes('New saved text'), true);
    await f.event('keep'); await f.event('form', 'submit');
    const request = f.requests.filter(r => r.action.endsWith('Save')).at(-1);
    assert.deepEqual(request.base, latest); assert.equal(request.text, 'My draft');
});
test('a delayed save cannot clear newer typing or discard its replacement draft', async () => {
    const f = fixture(); await flush(); await f.input('First'); f.defer();
    const saving = f.event('form', 'submit'); await flush(); await f.input('Newer typing');
    await f.finish(); await saving;
    assert.equal(f.nodes.get('text').value, 'Newer typing'); assert.equal(f.nodes.get('save').disabled, false);
    assert.equal(f.requests.some(r => r.action.endsWith('DiscardDraft')), false);
    const draft = f.requests.filter(r => r.action.endsWith('Draft')).at(-1);
    assert.equal(draft.text, 'Newer typing'); assert.equal(draft.base.versions[0].text, 'First');
});
test('a conflict arriving during review must be reviewed again before any saved head is replaced', async () => {
    const original = contract.edit(key, null, 'a', 'Original'); const f = fixture(original); await flush(); await f.input('Mine');
    const first = contract.edit(key, original, 'a', 'First incoming'); await f.incoming(first); await f.event('review');
    const oldChoice = f.nodes.get('versions').children[0].children[2];
    await f.incoming(contract.edit(key, first, 'a', 'Unseen next incoming'));
    await oldChoice.click(); await flush(); assert.equal(f.nodes.get('updates').hidden, false);
    assert.equal(f.nodes.get('text').value, 'Mine'); assert.equal(f.requests.some(r => r.action.endsWith('Save')), false);
});
test('multi-head edit/delete recovery requires an explicit version choice and save', async () => {
    const a = contract.edit(key, null, 'a', 'A');
    const conflict = contract.merge(contract.edit(key, a, 'b', null), contract.edit(key, a, 'c', 'Recover me'));
    const f = fixture(conflict); await flush(); assert.equal(f.nodes.get('text').disabled, true);
    await f.event('review'); const articles = f.nodes.get('versions').children;
    const chosen = articles.find(article => article.children[1].textContent === 'Recover me');
    await chosen.children[2].click(); await flush(); await f.event('form', 'submit');
    const request = f.requests.filter(r => r.action.endsWith('Save')).at(-1);
    assert.deepEqual(request.base, conflict); assert.equal(request.text, 'Recover me');
});
test('personal markup stays literal and timestamp actions carry only a bounded time', async () => {
    const f = fixture(contract.edit(key, null, 'a', '<img onerror=bad()> 1:30 useful')); await flush();
    const preview = f.nodes.get('preview'); assert.equal(preview.textContent, '<img onerror=bad()> 1:30 useful');
    const timestamp = preview.children.find(node => node.tagName === 'button'); await timestamp.click(); await flush();
    assert.deepEqual(f.requests.at(-1), { action: 'FilterTube_NotesSeek', token: 'private-capability', seconds: 90 });
});
test('access revocation removes personal text and prevents Save in the editor', async () => {
    const f = fixture(contract.edit(key, null, 'a', 'Private')); await flush(); await f.deny();
    assert.equal(f.nodes.get('text').value, ''); assert.equal(f.nodes.get('preview').textContent, '');
    assert.equal(f.nodes.get('save').disabled, true); assert.equal(f.nodes.get('text').disabled, true);
});
test('recovering a temporary draft preserves its original baseline and opens review after an external edit', async () => {
    const old = contract.edit(key, null, 'a', 'Before'); const latest = contract.edit(key, old, 'a', 'After');
    const f = fixture(latest, { base: old, text: 'Recovered draft' }); await flush();
    assert.equal(f.nodes.get('text').value, 'Recovered draft'); assert.equal(f.nodes.get('updates').hidden, false);
    assert.deepEqual(f.requests.filter(r => r.action.endsWith('Draft')).at(-1).base, old);
});
test('oversized pasted text remains intact instead of being silently truncated or saved', async () => {
    const f = fixture(); await flush(); const pasted = 'x'.repeat(16001); await f.input(pasted);
    assert.equal(f.nodes.get('text').value, pasted); assert.equal(f.nodes.get('save').disabled, true);
    assert.equal(f.requests.some(r => r.action.endsWith('Draft') || r.action.endsWith('Save')), false);
    assert.match(f.nodes.get('status').textContent, /Shorten it/);
});

test('insert current time preserves selection and creates a draft without saving or seeking', async () => {
    const f = fixture(); await flush(); await f.input('My thought');
    f.nodes.get('text').selectionStart = f.nodes.get('text').selectionEnd = 10;
    await f.event('insert-time');
    assert.equal(f.nodes.get('text').value, 'My thought\n1:30 ');
    assert.equal(f.requests.some(request => /Notes(?:Save|Seek)$/.test(request.action)), false);
    assert.equal(f.requests.at(-1).action, 'FilterTube_NotesDraft');
});
test('draft timestamp list excludes links, deduplicates and sends only the selected time', async () => {
    const f = fixture(); await flush(); await f.input('2:00 then 1:30 and 2:00 https://example.com/3:00');
    await f.event('moments');
    const times = f.nodes.get('moments-list').children;
    assert.deepEqual(times.map(node => node.textContent), ['1:30', '2:00']);
    await times[0].click(); await flush();
    assert.deepEqual(f.requests.at(-1), { action: 'FilterTube_NotesSeek', token: 'private-capability', seconds: 90 });
});

test('timestamps match mobile minute/hour parsing while links and malformed clock values stay literal', async () => {
    const f = fixture(contract.edit(key, null, 'a', '120:00 1:02:03 1:99 https://example.com/2:00 word1:30')); await flush();
    const preview = f.nodes.get('preview');
    const buttons = preview.children.filter(node => node.tagName === 'button');
    assert.deepEqual(buttons.map(node => node.textContent), ['120:00', '1:02:03']);
    await buttons[0].click(); await flush(); assert.equal(f.requests.at(-1).seconds, 7200);
    assert.equal(f.nodes.get('text').focused, true);
});

test('large notes bound saved timestamp controls while retaining every character as literal text', async () => {
    const value = Array.from({ length: 150 }, (_, index) => '0:00 line ' + index).join('\n');
    const f = fixture(contract.edit(key, null, 'a', value)); await flush();
    assert.equal(f.nodes.get('preview').children.filter(node => node.tagName === 'button').length, 64);
    assert.equal(f.nodes.get('preview').textContent, value);
});
