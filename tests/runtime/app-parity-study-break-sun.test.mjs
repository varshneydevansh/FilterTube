// Android StudySessionModelsTest "the sun counts down" and StudyRestActivity's "Up next after the break"
// (Ports Android 6c3f9f0d5: StudySessionModels.kt StudyBreakClock, StudyBreakSunView, StudyRestActivity.kt
// lastSubject, StudyWatchOverlay.kt lastSubjectKey, StudyPageRules.kt subjectOf, StudyHomeFeed.kt chips).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Overlay = require('../../js/content/study_overlay.js');
const Engine = require('../../js/shared/study_engine.js');

test('the sun counts down in minutes and seconds, rounded up', () => {
    assert.equal(Overlay.countdown(252_000), '4:12');
    assert.equal(Overlay.countdown(1), '0:01');
    assert.equal(Overlay.countdown(-5), '0:00');
    assert.equal(Overlay.countdown(600_000), '10:00');
});

test('a lecture title names its subject from the plan\'s chips, whole words only', () => {
    const catalog = { packs: [{ id: 'in_gate', shortName: 'GATE', chips: ['Maths', 'Aptitude'],
        variants: [{ id: 'cse', chips: ['DBMS', 'Operating systems'], channels: [], keywords: [] }] }] };
    const subjects = Engine.studySubjects({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'cse' } } }, catalog);
    assert.deepEqual(subjects.map(item => item.label), ['DBMS', 'Operating systems']);
    assert.equal(Engine.subjectOf('Normalization in DBMS | Lecture 12', subjects), 'DBMS');
    assert.equal(Engine.subjectOf('operating   systems: paging', subjects), 'Operating systems');
    assert.equal(Engine.subjectOf('DBMSX tricks', subjects), null);
    assert.equal(Engine.subjectOf('', subjects), null);
});

function overlayHarness(start) {
    const nodes = new Map();
    const make = tag => ({
        tag, id: '', style: {}, dataset: {}, children: [], attributes: {}, textContent: '', type: '', handlers: {}, src: '', isConnected: true,
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); return child; },
        append(...list) { list.forEach(child => this.appendChild(child)); },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        remove() { nodes.delete(this.id); }
    });
    const doc = { body: make('body'), visibilityState: 'visible', createElement: make, createElementNS: (ns, tag) => make(tag),
        getElementById: id => nodes.get(id) || null, querySelectorAll: () => [], addEventListener() {} };
    const clock = { now: start };
    const intervals = [];
    const overlay = createOverlay();
    function createOverlay() {
        return Overlay.createStudyOverlay({
            window: { addEventListener() {} }, document: doc,
            runtime: { getURL: path => `ext://${path}`, sendMessage: async () => ({ ok: true }), onMessage: { addListener() {} } },
            now: () => clock.now, setTimeout: () => 0, clearTimeout: () => {},
            setInterval: fn => { intervals.push(fn); return intervals.length; }, clearInterval: () => {}
        });
    }
    return { overlay, nodes, clock, intervals };
}

const find = (node, role) => node.children.find(child => child.dataset?.role === role);

test('the break screen: a sun that drains with m:ss, and Up next when the last lecture\'s subject is known', () => {
    const h = overlayHarness(1_000_000);
    h.overlay.setState({ ok: true, state: 'BREAK', breakMode: 'rest', segmentStart: 1_000_000 - 48_000, until: 1_000_000 + 252_000, upNext: 'DBMS' });
    const box = h.nodes.get(Overlay.OVERLAY_ID);
    const sun = find(box, 'break-sun');
    const digits = find(sun, 'sun-countdown');
    assert.equal(digits.textContent, '4:12');
    assert.equal(sun.attributes['aria-label'], '5 min left in your break');
    assert.equal(find(box, 'up-next').textContent, 'Up next after the break: DBMS');
    h.clock.now += 2_000;
    h.intervals.at(-1)();
    assert.equal(digits.textContent, '4:10');
    // Without a known subject there's no Up next line.
    h.overlay.setState({ ok: true, state: 'BREAK', breakMode: 'rest', segmentStart: 900_000, until: 1_300_000, upNext: null });
    assert.equal(find(h.nodes.get(Overlay.OVERLAY_ID), 'up-next'), undefined);
});
