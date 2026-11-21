// The Timetable page in the Study page's settings (Android StudyTimetableActivity, b74369747), in a small
// fake DOM: the status line, the day, its periods, the choices, and the period editor.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Timetable = require('../../js/shared/study_timetable.js');

function load() {
    const make = tag => ({
        tag, className: '', style: {}, children: [], attributes: {}, textContent: '', hidden: false, dataset: {}, handlers: {}, disabled: false,
        classList: { toggle() {}, add() {}, remove() {} },
        setAttribute(key, value) { this.attributes[key] = value; }, getAttribute(key) { return this.attributes[key]; },
        appendChild(child) { this.children.push(child); return child; },
        append(...nodes) { nodes.forEach(node => this.children.push(node)); },
        replaceChildren(...nodes) { this.children = nodes; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; }, remove() {}
    });
    const context = {
        document: { createElement: make, createElementNS: (_ns, tag) => make(tag), readyState: 'complete', getElementById: () => null },
        navigator: { language: 'en-IN' }, setTimeout: () => 0, clearTimeout: () => {}, Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { cb?.({ ok: true }); } }, storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    for (const file of ['js/shared/study_timetable.js', 'js/shared/study_engine.js', 'js/study_ui.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
    return { Ui: context.FilterTubeStudyUi, make };
}

const texts = node => [node.textContent, ...(node.children || []).flatMap(texts)].filter(Boolean);
const find = (node, predicate) => predicate(node) ? node : (node.children || []).map(child => find(child, predicate)).find(Boolean) || null;

function week() {
    let t = Timetable.create({ zone: 'Asia/Kolkata' });
    const r = Timetable.withLane(t, ['in_upsc'], 'UPSC'); t = r.timetable;
    return Timetable.withPeriod(t, 'mon', 7 * 60, 8 * 60, r.laneId);
}

test('the Timetable row says what runs now, what is next, or nothing', () => {
    const { Ui } = load();
    const at = (day, hour, minute = 0) => Date.UTC(2026, 10, day, hour, minute) - 330 * 60 * 1000;
    assert.match(Ui.timetableStatus(week(), null, at(16, 7, 30)), /^Now: UPSC · until /);
    assert.match(Ui.timetableStatus(week(), null, at(16, 9)), /^Next: UPSC at /);
    assert.equal(Ui.timetableStatus(null, null), null);
});

test('the day shows its periods and the choices; a period opens in place with From, To, Save and Remove', async () => {
    const { Ui, make } = load();
    const ui = { day: 'mon', editing: null, start: 960, end: 1020, lane: [], query: '', copyOpen: false, copyTo: [] };
    const saved = [];
    const options = { study: { activePackIds: ['in_upsc'], timetable: week() }, catalog: null, ui, editable: true,
        redraw() {}, onSave: async change => { saved.push(change(week())); return { ok: true }; } };
    const host = make('div');
    Ui.renderTimetablePage(host, options);
    const words = texts(host);
    for (const label of ['UPSC', 'Add a period', 'Between periods', 'Your plan', 'Nothing', 'Hide Clips and comments during periods',
        'Copy this day to…', 'Add to my calendar']) assert.ok(words.includes(label), label);
    // Open the period and remove it.
    find(host, node => node.className === 'ft-link-row' && typeof node.handlers.click === 'function').handlers.click();
    assert.equal(ui.editing, 420);
    const editor = make('div');
    Ui.renderTimetablePage(editor, options);
    const editorWords = texts(editor);
    for (const label of ['What to study', 'From', 'To', 'Save', 'Remove this period']) assert.ok(editorWords.includes(label), label);
    await find(editor, node => node.textContent === 'Remove this period').handlers.click();
    assert.deepEqual(Timetable.periodsOf(saved[0], 'mon'), []);
    // A child sees it read-only: no Add.
    const readOnly = make('div');
    Ui.renderTimetablePage(readOnly, { ...options, ui: { ...ui, editing: null }, editable: false, readOnlyLabel: 'Set by a parent' });
    assert.ok(!texts(readOnly).includes('Add a period'));
    assert.ok(texts(readOnly).includes('Set by a parent'));
});
