// The Timetable page in the Study page's settings (Android StudyTimetableActivity b74369747, with
// DESIGN_PASS_2026-11-21 §4 decision 4: bfbe09df0, 9413ee20f, 6af91cdbf), in a small fake DOM: the
// status line, the week grid and the inspector, the day on the bar, More choices, and the period
// editor with its START/END handles.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Timetable = require('../../js/shared/study_timetable.js');

function load({ dir = 'ltr', width = 360 } = {}) {
    const make = tag => {
        const node = {
            tag, className: '', style: {}, children: [], attributes: {}, textContent: '', dataset: {}, handlers: {}, tabIndex: -1, disabled: false,
            classList: {
                add(name) { if (!node.className.split(' ').includes(name)) node.className = `${node.className} ${name}`.trim(); },
                remove(name) { node.className = node.className.split(' ').filter(item => item && item !== name).join(' '); },
                toggle(name, on) { if (on) this.add(name); else this.remove(name); }
            },
            setAttribute(key, value) { node.attributes[key] = String(value); }, getAttribute(key) { return node.attributes[key] ?? null; },
            appendChild(child) { node.children.push(child); return child; },
            append(...nodes) { nodes.forEach(child => node.appendChild(child)); },
            replaceChildren(...nodes) { node.children = []; nodes.forEach(child => node.appendChild(child)); },
            addEventListener(type, fn) { (node.handlers[type] ||= []).push(fn); },
            removeEventListener(type, fn) { node.handlers[type] = (node.handlers[type] || []).filter(item => item !== fn); },
            fire(type, event = {}) { return Promise.all((node.handlers[type] || []).map(fn => fn({ preventDefault() {}, stopPropagation() {}, button: 0, pointerId: 1, target: node, ...event }))); },
            querySelector(selector) {
                const name = selector.replace(/^\./, '');
                const walk = item => item.children.map(child => (child.className.split(' ').includes(name) || (name === 'output' && child.tag === 'output') ? child : walk(child))).find(Boolean) || null;
                return walk(node);
            },
            closest(selector) { return selector === '[dir]' ? { getAttribute: () => dir } : null; },
            getBoundingClientRect() { return { left: 0, right: width, width, top: 0, bottom: 544, height: 544 }; },
            setPointerCapture() {}, focus() {}, remove() {}
        };
        return node;
    };
    const timers = [];
    const context = {
        document: { createElement: make, createElementNS: (_ns, tag) => make(tag), readyState: 'complete', getElementById: () => null, activeElement: null,
            documentElement: { getAttribute: () => dir } },
        navigator: { language: 'en-IN' }, innerWidth: width,
        setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
        Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { cb?.({ ok: true }); } }, storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    for (const file of ['js/shared/study_timetable.js', 'js/shared/study_engine.js', 'js/study_ui.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
    return { Ui: context.FilterTubeStudyUi, make, timers };
}

const all = node => [node, ...(node.children || []).flatMap(all)];
const texts = node => all(node).map(item => item.textContent).filter(Boolean);
const byKey = (node, key) => all(node).find(item => item.dataset?.ftFocusKey === key) || null;
const byText = (node, value) => all(node).find(item => item.textContent === value) || null;

function week() {
    let t = Timetable.create({ zone: 'Asia/Kolkata' });
    const r = Timetable.withLane(t, ['in_upsc'], 'UPSC'); t = r.timetable;
    return Timetable.withPeriod(t, 'mon', 7 * 60, 8 * 60, r.laneId);
}
const freshUi = () => ({ day: 'mon', editing: null, start: 960, end: 1020, lane: [], query: '', copyOpen: false, copyTo: [], moreOpen: false, keyStart: null });

test('the Timetable row says what runs now, what is next, or nothing', () => {
    const { Ui } = load();
    const at = (day, hour, minute = 0) => Date.UTC(2026, 10, day, hour, minute) - 330 * 60 * 1000;
    assert.match(Ui.timetableStatus(week(), null, at(16, 7, 30)), /^Now: UPSC · until /);
    assert.match(Ui.timetableStatus(week(), null, at(16, 9)), /^Next: UPSC at /);
    assert.equal(Ui.timetableStatus(null, null), null);
});

test('the week grid and the inspector: seven columns, periods as blocks, an empty hour adds a period up to the next one', () => {
    const { Ui, make } = load({ width: 1000 });
    const ui = freshUi();
    let redraws = 0;
    const options = { study: { activePackIds: ['in_upsc'], timetable: week() }, catalog: null, ui, editable: true, redraw() { redraws += 1; }, onSave: async () => ({ ok: true }) };
    const host = make('div');
    Ui.renderTimetablePage(host, options);
    const grid = all(host).find(node => node.className.includes('ft-tt-week'));
    assert.ok(grid, 'the week grid');
    assert.equal(all(grid).filter(node => node.className.split(' ').includes('ft-tt-week__col')).length, 7);
    const block = byKey(host, 'tt-mon-420-grid');
    assert.ok(block && block.attributes['aria-label'].includes('UPSC'));
    // 6 am-11 pm over 544 px: 32 px an hour, so y = 96 is 9 am, empty on Monday: a 9-10 period opens.
    const monday = all(grid).filter(node => node.className.split(' ').includes('ft-tt-week__col'))[0];
    monday.fire('click', { clientY: 96, target: monday });
    assert.deepEqual([ui.editing, ui.start, ui.end], [-1, 9 * 60, 10 * 60]);
    // A period block opens it in the inspector.
    block.fire('click');
    assert.deepEqual([ui.editing, ui.start, ui.end], [420, 420, 480]);
    assert.ok(redraws >= 2);
});

test('the day on the bar, and Clips, Copy and the calendar behind More choices', async () => {
    const { Ui, make } = load();
    const ui = freshUi();
    const options = { study: { activePackIds: ['in_upsc'], timetable: week() }, catalog: null, ui, editable: true, redraw() {}, onSave: async () => ({ ok: true }) };
    let host = make('div');
    Ui.renderTimetablePage(host, options);
    let words = texts(host);
    for (const label of ['UPSC', 'Add a period', 'Between periods', 'Your plan', 'Nothing', 'More choices']) assert.ok(words.includes(label), label);
    for (const label of ['Hide Clips and comments during periods', 'Copy this day to…', 'Add to my calendar']) assert.ok(!words.includes(label), `${label} waits behind More choices`);
    assert.ok(!words.some(word => /Shorts/.test(word)));
    // The day bar's block opens the period; the day chips share one row.
    assert.ok(byKey(host, 'tt-mon-420-block'));
    const chips = all(host).find(node => node.className.includes('ft-tt__days')).children;
    assert.equal(chips.length, 7);
    // A chip that would clip falls back to the narrow weekday; the full name stays its label.
    assert.deepEqual([chips[2].dataset.ftShort, chips[2].dataset.ftNarrow, chips[2].attributes['aria-label']], ['Wed', 'W', 'Wednesday']);
    byKey(host, 'tt-more').fire('click');
    host = make('div');
    Ui.renderTimetablePage(host, options);
    words = texts(host);
    for (const label of ['Hide Clips and comments during periods', 'Copy this day to…', 'Add to my calendar']) assert.ok(words.includes(label), label);
});

test('the period editor: START/END handles with keys, Escape reverts, real minus and plus steppers, Remove', async () => {
    const { Ui, make } = load({ width: 360 });
    const ui = { ...freshUi(), editing: 420, start: 420, end: 480, lane: ['in_upsc'] };
    const saved = [];
    let redraws = 0;
    const options = { study: { activePackIds: ['in_upsc'], timetable: week() }, catalog: null, ui, editable: true,
        redraw() { redraws += 1; }, onSave: async change => { saved.push(change(week())); return { ok: true }; } };
    const host = make('div');
    Ui.renderTimetablePage(host, options);
    const start = byKey(host, 'tt-mon-420-start');
    const end = byKey(host, 'tt-mon-420-end');
    assert.ok(start && end && start.attributes.role === 'slider');
    end.fire('focus');
    end.fire('keydown', { key: 'ArrowRight' });
    assert.equal(ui.end, 495);
    end.fire('keydown', { key: 'ArrowRight', shiftKey: true });
    assert.equal(ui.end, 555);
    end.fire('keydown', { key: 'Escape' });
    assert.equal(ui.end, 480, 'Escape puts back what the keys moved');
    start.fire('focus');
    start.fire('keydown', { key: 'End' });
    assert.equal(ui.start, 465, 'Home/End go as far as a 15-minute period allows');
    // The steppers are the plan page's (icons, each saying its step).
    const less = all(host).find(node => node.attributes?.['aria-label'] === 'From: 15 minutes earlier');
    assert.ok(less && less.children.some(child => child.tag === 'svg' || child.className?.includes('icon')), 'a real minus icon');
    assert.ok(!texts(host).includes('−') && !texts(host).includes('-'));
    await byText(host, 'Remove this period').fire('click');
    assert.deepEqual(Timetable.periodsOf(saved[0], 'mon'), []);
});

test('a drag on the editor bar snaps, END wins a tie, a cancelled drag reverts, and right-to-left mirrors', () => {
    const { Ui, make } = load({ width: 360 });
    const ui = { ...freshUi(), editing: -1, start: 9 * 60, end: 9 * 60 + 15, lane: ['in_upsc'] };
    const options = { study: { timetable: week() }, catalog: null, ui, editable: true, redraw() {}, onSave: async () => ({ ok: true }) };
    const host = make('div');
    Ui.renderTimetablePage(host, options);
    const track = all(host).find(node => node.className === 'ft-dayplan__track');
    // With Monday's 7-8 period the hours are 5:00-11:00 (6 h over 360 px, a minute a pixel): 9:00 is
    // x = 240 and 9:15 x = 255; a press at 250 is nearer END.
    track.fire('pointerdown', { clientX: 250 });
    track.fire('pointermove', { clientX: 300 });
    assert.equal(ui.end, 10 * 60, 'END took the press on the tie');
    track.fire('pointercancel');
    assert.equal(ui.end, 9 * 60 + 15);
    const rtl = load({ dir: 'rtl', width: 360 });
    const mirrored = rtl.make('div');
    rtl.Ui.renderTimetablePage(mirrored, { ...options, ui: { ...ui } });
    const handle = byKey(mirrored, 'tt-mon-new-start');
    assert.equal(handle.style.left, '33.333%', '9:00 sits two thirds from the right');
    const endHandle = byKey(mirrored, 'tt-mon-new-end');
    assert.equal(endHandle.style.left, '29.167%', 'later is further left in right-to-left');
});

test('a child sees the timetable read-only', () => {
    const { Ui, make } = load();
    const host = make('div');
    Ui.renderTimetablePage(host, { study: { timetable: week() }, catalog: null, ui: freshUi(), editable: false, readOnlyLabel: 'Set by a parent', redraw() {}, onSave: async () => ({ ok: true }) });
    assert.ok(!texts(host).includes('Add a period'));
    assert.ok(texts(host).includes('Set by a parent'));
    assert.equal(byKey(host, 'tt-mon-420-block'), null, 'blocks don\'t open for a child');
});
