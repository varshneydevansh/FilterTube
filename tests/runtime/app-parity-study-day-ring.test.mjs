// Android StudyHomeModelsTest Day Ring cases (Ports Android 789f3fbf5 and 678188f11: StudyRingModel.of,
// boundaries and currentBreak, StudyDayRingView's break drain): rounds become arcs in session fractions,
// a running round splits into done and live, gaps sit at every edge but not inside the live round.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const min = 60 * 1000;
const t0 = 1_800_000_000_000;
// 4 rounds of 40 with 5-minute breaks: 175 minutes, like the GATE mockup.
const segments = Engine.splitRounds(t0, t0 + 175 * min, { roundMinutes: 40, breakMinutes: 5 });
const near = (expected, actual) => assert.ok(Math.abs(expected - actual) < 0.0005, `${expected} ~ ${actual}`);

test('segments become arcs and beads in session fractions', () => {
    const ring = Engine.dayRing(segments, null);
    assert.equal(ring.arcs.length, 4);
    assert.ok(ring.arcs.every(arc => arc.kind === 'TODO'));
    near(0, ring.arcs[0].start);
    near(40 / 175, ring.arcs[0].end);
    near(45 / 175, ring.arcs[1].start);
    assert.equal(ring.beads.length, 3);
    near(42.5 / 175, ring.beads[0]);
    assert.equal(ring.tick, null);
    assert.equal(ring.plannedMinutes, 160);
    assert.equal(ring.studiedMinutes, 0);
    assert.equal(ring.rounds, 4);
});

test('halfway through round 2 the round splits into done and live', () => {
    const ring = Engine.dayRing(segments, t0 + 65 * min);
    assert.deepEqual(ring.arcs.map(arc => arc.kind), ['DONE', 'DONE', 'LIVE', 'TODO', 'TODO']);
    near(65 / 175, ring.arcs[1].end);
    near(65 / 175, ring.arcs[2].start);
    near(65 / 175, ring.tick);
    assert.equal(ring.studiedMinutes, 60);
});

test('gaps go at every segment edge but not inside the live round', () => {
    const ring = Engine.dayRing(segments, t0 + 65 * min);
    const edges = Engine.ringBoundaries(ring);
    assert.equal(edges.length, 7);
    near(0, edges[0]);
    assert.ok(edges.every(edge => Math.abs(edge - 65 / 175) > 0.001));
    assert.ok(edges.some(edge => Math.abs(edge - 40 / 175) < 0.001));
    assert.ok(edges.some(edge => Math.abs(edge - 45 / 175) < 0.001));
    assert.equal(ring.breaks.length, 3);
    near(40 / 175, ring.breaks[0][0]);
    near(45 / 175, ring.breaks[0][1]);
});

test('on a break the current break is known, so it draws in full and drains', () => {
    assert.equal(Engine.currentBreak(Engine.dayRing(segments, t0 + 42 * min)), 0);
    assert.equal(Engine.currentBreak(Engine.dayRing(segments, t0 + 20 * min)), null);
    assert.equal(Engine.currentBreak(Engine.dayRing(segments, t0 + 133 * min)), 2);
});
