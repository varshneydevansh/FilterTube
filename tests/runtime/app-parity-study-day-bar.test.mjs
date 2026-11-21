// Android StudyDayPlannerView (3d92defa7): the plan page's day bar in a small fake DOM. It fits its
// width (no sideways scroll), its handles are 15-minute sliders with Shift/Page/Home/End/Escape keys,
// a cancelled drag reverts, it mirrors under dir="rtl", and a read-only bar draws no handles.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load({ dir = 'ltr', width = 360 } = {}) {
    const make = tag => {
        const node = {
            tag, className: '', style: {}, children: [], attributes: {}, textContent: '', dataset: {}, handlers: {}, tabIndex: -1, parent: null,
            classList: {
                add(name) { if (!node.className.split(' ').includes(name)) node.className = `${node.className} ${name}`.trim(); },
                remove(name) { node.className = node.className.split(' ').filter(item => item && item !== name).join(' '); },
                toggle(name, on) { if (on) this.add(name); else this.remove(name); }
            },
            setAttribute(key, value) { node.attributes[key] = String(value); }, getAttribute(key) { return node.attributes[key] ?? null; },
            appendChild(child) { child.parent = node; node.children.push(child); return child; },
            append(...nodes) { nodes.forEach(child => node.appendChild(child)); },
            replaceChildren(...nodes) { node.children = []; nodes.forEach(child => node.appendChild(child)); },
            addEventListener(type, fn) { (node.handlers[type] ||= []).push(fn); },
            removeEventListener(type, fn) { node.handlers[type] = (node.handlers[type] || []).filter(item => item !== fn); },
            fire(type, event = {}) { for (const fn of node.handlers[type] || []) fn({ preventDefault() {}, stopPropagation() {}, button: 0, pointerId: 1, ...event }); },
            querySelector(selector) {
                const name = selector.replace(/^\./, '');
                const walk = item => item.children.map(child => (child.className.split(' ').includes(name) ? child : walk(child))).find(Boolean) || null;
                return walk(node);
            },
            closest(selector) { return selector === '[dir]' ? { getAttribute: () => dir } : null; },
            getBoundingClientRect() { return { left: 0, right: width, width, top: 0, bottom: 40 }; },
            setPointerCapture() {}, focus() {}, remove() {}
        };
        return node;
    };
    const timers = [];
    const intervals = [];
    const context = {
        document: { createElement: make, createElementNS: (_ns, tag) => make(tag), readyState: 'complete', getElementById: () => null, activeElement: null,
            documentElement: { getAttribute: () => dir } },
        navigator: { language: 'en-IN' }, innerWidth: width,
        setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {},
        setInterval: (fn, ms) => { intervals.push({ fn, ms, on: true }); return intervals.length; }, clearInterval: id => { if (intervals[id - 1]) intervals[id - 1].on = false; },
        Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { cb?.({ ok: true }); } }, storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    for (const file of ['js/shared/study_plan_drag.js', 'js/shared/study_engine.js', 'js/study_ui.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
    return { Ui: context.FilterTubeStudyUi, timers, intervals, make };
}

const handlesOf = bar => bar.children[0].children.filter(child => child.className.includes('ft-dayplan__handle'));
const plan = { days: ['mon'], start: '16:00', end: '18:00', limit: '21:00' };
const focus = { roundMinutes: 25, breakMinutes: 5 };
const key = (handle, keyName, extra = {}) => handle.fire('keydown', { key: keyName, ...extra });

test('a read-only bar draws no handles; an editable one has three sliders with stable focus keys', () => {
    const { Ui } = load();
    assert.equal(handlesOf(Ui.planBar(plan, focus, 'rest', { editable: false })).length, 0);
    const handles = handlesOf(Ui.planBar(plan, focus, 'rest', { editable: true, onCommit() {} }));
    assert.deepEqual(handles.map(handle => handle.dataset.ftFocusKey), ['dayplan-start', 'dayplan-end', 'dayplan-limit']);
    assert.ok(handles.every(handle => handle.attributes.role === 'slider' && handle.tabIndex === 0));
});

test('a narrow bar fits the plan and remembers its hours for the next render', () => {
    const { Ui } = load({ width: 360 });
    const memory = {};
    const bar = Ui.planBar(plan, focus, 'rest', { editable: true, onCommit() {}, memory });
    assert.deepEqual({ ...memory.range }, { start: 14 * 60, end: 22 * 60 });
    // Start at 2 pm sits on the left edge, the limit at 9 pm an eighth from the right.
    const [start, , limit] = handlesOf(bar);
    assert.equal(start.style.left, '25.000%');
    assert.equal(limit.style.left, '87.500%');
    const wide = {};
    load({ width: 900 }).Ui.planBar(plan, focus, 'rest', { editable: true, onCommit() {}, memory: wide });
    assert.deepEqual({ ...wide.range }, { start: 6 * 60, end: 23 * 60 });
});

test('keys: arrows 15 min, Shift+arrow and Page keys an hour, Home/End to the ends, Escape reverts the keys', () => {
    const { Ui, timers } = load();
    const live = [];
    const commits = [];
    const memory = {};
    const bar = Ui.planBar(plan, focus, 'rest', { editable: true, memory, onLive: draft => live.push(draft), onCommit: (before, after) => commits.push(after) });
    const [start, end] = handlesOf(bar);
    start.fire('focus');
    key(start, 'ArrowRight');
    assert.equal(live.at(-1).start, 16 * 60 + 15);
    key(start, 'ArrowRight', { shiftKey: true });
    assert.equal(live.at(-1).start, 17 * 60 + 15);
    key(start, 'PageDown');
    assert.equal(live.at(-1).start, 16 * 60 + 15);
    key(start, 'Home');
    assert.equal(live.at(-1).start, 0);
    // The hours took in the moved handle.
    assert.equal(memory.range.start, 0);
    key(start, 'Escape');
    assert.equal(live.at(-1).start, 16 * 60);
    end.fire('focus');
    key(end, 'End');
    assert.equal(live.at(-1).end, 23 * 60 + 45);
    // A run of keys saves once, a moment after the last press.
    timers.filter(item => item.ms === 700).at(-1).fn();
    assert.equal(commits.at(-1).end, 23 * 60 + 45);
});

test('right-to-left mirrors the bar and the arrows', () => {
    const { Ui } = load({ dir: 'rtl' });
    const live = [];
    const bar = Ui.planBar(plan, focus, 'rest', { editable: true, onLive: draft => live.push(draft), onCommit() {} });
    const [start] = handlesOf(bar);
    assert.equal(start.style.left, '75.000%');
    key(start, 'ArrowLeft');
    assert.equal(live.at(-1).start, 16 * 60 + 15, 'the left arrow moves later in right-to-left');
});

test('a drag snaps to 15 minutes, END beats LIMIT on a tie, and a cancelled drag reverts', () => {
    const { Ui } = load({ width: 480 });
    const live = [];
    const commits = [];
    const tie = { ...plan, limit: '18:00' };
    const bar = Ui.planBar(tie, focus, 'rest', { editable: true, onLive: draft => live.push(draft), onCommit: (before, after) => commits.push(after) });
    const track = bar.children[0];
    // The bar fits 13:00-19:00 (six hours) over 480 px: 18:00 is x = 400, and 15 minutes are 20 px.
    track.fire('pointerdown', { clientX: 400 });
    track.fire('pointermove', { clientX: 440 });
    assert.equal(live.at(-1).end, 18 * 60 + 30);
    assert.equal(live.at(-1).limit, 18 * 60 + 30, 'END pushes the limit along');
    track.fire('pointercancel');
    assert.equal(live.at(-1).end, 18 * 60);
    assert.equal(commits.length, 0);
    track.fire('pointerdown', { clientX: 400 });
    track.fire('pointermove', { clientX: 421 });
    track.fire('pointerup');
    assert.equal(commits.at(-1).end, 18 * 60 + 15);
});

test('a handle held against an edge widens that edge an hour every 350 ms; mid-drag the bar holds still', () => {
    const { Ui, intervals } = load({ width: 480 });
    const memory = {};
    const live = [];
    const bar = Ui.planBar(plan, focus, 'rest', { editable: true, memory, onLive: draft => live.push(draft), onCommit() {} });
    const track = bar.children[0];
    // 14:00-22:00 over 480 px: the limit (21:00) is x = 420.
    track.fire('pointerdown', { clientX: 420 });
    track.fire('pointermove', { clientX: 478 });
    assert.deepEqual({ ...memory.range }, { start: 14 * 60, end: 22 * 60 }, 'the hours hold still under the pointer');
    const held = intervals.find(item => item.on);
    assert.equal(held.ms, 350);
    held.fn();
    assert.deepEqual({ ...memory.range }, { start: 14 * 60, end: 23 * 60 });
    assert.ok(live.at(-1).limit > 22 * 60, 'the handle follows the grown edge');
    track.fire('pointermove', { clientX: 240 });
    assert.ok(intervals.every(item => !item.on), 'leaving the edge stops it');
});

test('one editor (DESIGN_PASS_2026-11-21 §4 decision 3): no length slider; Home shows a read-only bar and Edit', () => {
    const { Ui } = load();
    assert.equal(Ui.mountLengthSlider, undefined);
    const ui = fs.readFileSync('js/study_ui.js', 'utf8');
    const home = fs.readFileSync('js/dashboard_home.js', 'utf8');
    assert.doesNotMatch(ui + home, /mountLengthSlider|ft-length/);
    assert.match(home, /planBar\?\.\(study\.plan, [^)]*\{ editable: false \}\)/);
    // Edit sits with the actions (the bar keeps the card's width) and opens the plan editor itself.
    assert.match(home, /t\('home\.study\.edit', 'Edit'\), 'btn-secondary ft-home-study__edit', \(\) => \{\s*openStudy\(\);\s*root\.FilterTubeStudyUi\?\.openPlanEditor\?\.\(\);/);
    assert.equal(typeof Ui.openPlanEditor, 'function');
    assert.equal(Ui.openPlanEditor(), false, 'no Study page mounted: nothing to open');
});

test('the plan page\'s steppers: START never pushes END, the limit steps from the end, each says its step', async () => {
    const { Ui, make } = load();
    const patches = [];
    const host = make('div');
    const study = { plan: { days: ['mon'], start: '16:00', end: '16:30' }, focus: { roundMinutes: 15, breakMinutes: 60 } };
    Ui.renderPlanPage(host, { study, editable: true, onPatch: async patch => { patches.push(patch); return { ok: true }; }, toastHost: make('div') });
    const all = [];
    const walk = node => { all.push(node); (node.children || []).forEach(walk); };
    walk(host);
    const byLabel = label => all.find(node => node.attributes?.['aria-label'] === label);
    assert.equal(byLabel('Start: 15 minutes later').disabled, true, 'START can\'t push END');
    assert.equal(byLabel('Study round 5 minutes shorter').disabled, true, 'rounds stop at 15 minutes');
    assert.equal(byLabel('Break 5 minutes longer').disabled, true, 'breaks stop at 60 minutes');
    assert.equal(byLabel('Study round 5 minutes longer').disabled, false);
    byLabel('Daily limit: 15 minutes later').fire('click');
    assert.equal(patches.at(-1).plan.limit, '16:30', '+ from no limit starts at the end of study');
    byLabel('End: 15 minutes later').fire('click');
    assert.equal(patches.at(-1).plan.end, '16:45');
    assert.equal(patches.at(-1).plan.start, '16:00');
});

test('the popup shows today\'s plan read-only, with Edit in dashboard (not for a child), and leaves it alone between changes', () => {
    const { Ui, make } = load({ width: 340 });
    const host = make('section');
    const all = node => [node, ...node.children.flatMap(all)];
    const study = { plan: { days: ['mon'], start: '16:00', end: '18:00', limit: '21:00' }, focus: { roundMinutes: 25, breakMinutes: 5 } };
    Ui.renderPopupPlan(host, { study });
    assert.equal(host.hidden, false);
    const nodes = all(host);
    assert.ok(nodes.some(node => node.className.includes('ft-dayplan')), 'the day bar');
    assert.equal(nodes.filter(node => node.className.includes('ft-dayplan__handle')).length, 0, 'read-only: no handles');
    assert.ok(nodes.some(node => node.dataset.ftFocusKey === 'popup-plan-edit'), 'Edit in dashboard');
    assert.equal(Ui.PLAN_EDITOR_PATH, 'html/tab-view.html?view=study&section=plan');
    const first = host.children[0];
    Ui.renderPopupPlan(host, { study });
    assert.equal(host.children[0], first, 'the same plan in the same minute is not redrawn');
    Ui.renderPopupPlan(host, { study, isChild: true });
    assert.ok(!all(host).some(node => node.dataset.ftFocusKey === 'popup-plan-edit'), 'a child gets no Edit');
    Ui.renderPopupPlan(host, { study: {} });
    assert.equal(host.hidden, true);
});
