// Android StudyDayPlannerView / StudyPlannerModel drag rules (SNAP_MINUTES 15, MIN_STUDY_MINUTES 30;
// START 0..end-30, END start+30..23:45 pushing the limit, LIMIT end..1440 where 1440 is "No limit";
// the nearest handle wins and LIMIT loses ties), and the day bar's range (Android 3d92defa7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Drag = require('../../js/shared/study_plan_drag.js');
const h = (hours, minutes = 0) => hours * 60 + minutes;

test('times snap to 15 minutes', () => {
    assert.equal(Drag.snap(h(16, 7)), h(16));
    assert.equal(Drag.snap(h(16, 8)), h(16, 15));
    assert.equal(Drag.snap(NaN), 0);
});

test('START stays at least 30 minutes before END and never before midnight', () => {
    const draft = { start: h(16), end: h(18), limit: null };
    assert.deepEqual(Drag.move(draft, 'start', h(17, 50)), { start: h(17, 30), end: h(18), limit: null });
    assert.equal(Drag.move(draft, 'start', -40).start, 0);
    assert.deepEqual(draft, { start: h(16), end: h(18), limit: null }, 'the draft is not mutated');
});

test('END stays 30 minutes after START, at most 23:45, and pushes the limit along', () => {
    const draft = { start: h(16), end: h(18), limit: h(19) };
    assert.equal(Drag.move(draft, 'end', h(16, 10)).end, h(16, 30));
    assert.equal(Drag.move(draft, 'end', h(24)).end, h(23, 45));
    assert.deepEqual(Drag.move(draft, 'end', h(20)), { start: h(16), end: h(20), limit: h(20) });
    assert.equal(Drag.move(draft, 'end', h(18, 30)).limit, h(19), 'a later limit stays');
    assert.equal(Drag.move({ ...draft, limit: null }, 'end', h(21)).limit, null, 'no limit stays no limit');
});

test('LIMIT sits between END and the end of the day; the end of the day means no limit', () => {
    const draft = { start: h(16), end: h(18), limit: h(20) };
    assert.equal(Drag.move(draft, 'limit', h(17)).limit, h(18));
    assert.equal(Drag.move(draft, 'limit', h(21, 20)).limit, h(21, 15));
    assert.equal(Drag.move(draft, 'limit', h(24)).limit, null);
    assert.equal(Drag.step({ ...draft, limit: null }, 'limit', -15).limit, h(23, 45));
});

test('keyboard steps move one handle 15 minutes at a time', () => {
    const draft = { start: h(16), end: h(18), limit: null };
    assert.equal(Drag.step(draft, 'start', 15).start, h(16, 15));
    assert.equal(Drag.step(draft, 'end', -15).end, h(17, 45));
    assert.equal(Drag.step(draft, 'end', 60).end, h(19));
});

test('the nearest handle within reach takes the press; LIMIT loses a tie with END', () => {
    const draft = { start: h(16), end: h(18), limit: h(18) };
    assert.equal(Drag.nearestHandle(draft, h(18), 30), 'end');
    assert.equal(Drag.nearestHandle(draft, h(16, 10), 30), 'start');
    assert.equal(Drag.nearestHandle(draft, h(12), 30), null);
    assert.equal(Drag.nearestHandle({ ...draft, limit: h(19) }, h(18, 50), 30), 'limit');
});

test('a pointer position maps onto the bar minutes', () => {
    assert.equal(Drag.minuteAt(100, 100, 900, h(7), h(22)), h(7));
    assert.equal(Drag.minuteAt(550, 100, 900, h(7), h(22)), h(14, 30));
    assert.equal(Drag.minuteAt(5000, 100, 900, h(7), h(22)), h(24));
});

test('a plan reads into a draft and writes back', () => {
    assert.deepEqual(Drag.draftOf({ start: '16:00', end: '18:30' }), { start: h(16), end: h(18, 30), limit: null });
    assert.deepEqual(Drag.draftOf({ start: '16:00', end: '18:00', limit: '17:00' }), { start: h(16), end: h(18), limit: h(18) });
    assert.deepEqual(Drag.draftOf({}), { start: h(16), end: h(18), limit: null });
    const plan = { days: ['mon'], start: '16:00', end: '18:00', limit: '21:00', music: true };
    assert.deepEqual(Drag.applyToPlan(plan, { start: h(9), end: h(11, 15), limit: null }),
        { days: ['mon'], start: '09:00', end: '11:15', music: true });
    assert.equal(Drag.applyToPlan(plan, { start: h(9), end: h(11), limit: h(22) }).limit, '22:00');
});

test('the plan is edited on the day bar only: the Study length slider is gone (DESIGN_PASS_2026-11-21 §4 decision 3)', () => {
    assert.equal(Drag.lengthOf({ start: h(16), end: h(18), limit: null }), 120);
    assert.equal(Drag.withLength, undefined);
    assert.equal(Drag.maxLength, undefined);
});

// ---- Android 3d92defa7: the bar fits its width (DESIGN_PASS_2026-11-21 §4.0-4.2) -------------------

test('the bar fits the plan when narrow, shows 6 am to 11 pm when wide, and never leaves the day', () => {
    const plan = { start: h(16), end: h(18), limit: h(21) };
    // Narrow: two hours before study to an hour after the limit.
    assert.deepEqual(Drag.range(plan, false), { start: h(14), end: h(22) });
    // A short plan still shows six hours.
    const short = Drag.range({ start: h(16), end: h(17), limit: null }, false);
    assert.equal(short.end - short.start, h(6));
    assert.ok(short.start <= h(14) && short.end >= h(18));
    // Early morning: clamped at midnight, grown later instead.
    assert.deepEqual(Drag.range({ start: 30, end: 90, limit: null }, false), { start: 0, end: h(6) });
    // Wide: 6 am to 11 pm, grown to show a plan outside it.
    assert.deepEqual(Drag.range(plan, true), { start: h(6), end: h(23) });
    assert.deepEqual(Drag.range({ start: h(5, 45), end: h(7), limit: null }, true), { start: h(5), end: h(23) });
    // A held edge gives an hour, never past the day.
    assert.deepEqual(Drag.widen({ start: h(14), end: h(22) }, true), { start: h(13), end: h(22) });
    assert.deepEqual(Drag.widen({ start: 0, end: h(24) }, false), { start: 0, end: h(24) });
    assert.deepEqual(Drag.widen({ start: 0, end: h(22) }, true), { start: 0, end: h(22) });
    // A handle moved outside the range pulls it out, with half an hour to spare.
    assert.deepEqual(Drag.including({ start: h(14), end: h(22) }, { ...plan, limit: h(23) }), { start: h(14), end: h(24) });
    assert.ok(Drag.sameRange({ start: 1, end: 2 }, { start: 1, end: 2 }));
    assert.equal(Drag.WIDE_MIN_PX, 600);
});

test('Home and End take a handle as far as its rules allow', () => {
    const plan = { start: h(16), end: h(18), limit: h(21) };
    assert.equal(Drag.extreme(plan, 'start', false).start, 0);
    assert.equal(Drag.extreme(plan, 'start', true).start, h(18) - Drag.MIN_STUDY_MINUTES);
    assert.equal(Drag.extreme(plan, 'end', true).end, h(24) - 15);
    // The limit at End is "no limit"; at Home it sits on the end of study.
    assert.equal(Drag.extreme(plan, 'limit', true).limit, null);
    assert.equal(Drag.extreme(plan, 'limit', false).limit, h(18));
});

test('on a tie END takes the press, not LIMIT', () => {
    const plan = { start: h(16), end: h(18), limit: h(18) };
    assert.equal(Drag.nearestHandle(plan, h(18), 20), 'end');
    assert.equal(Drag.nearestHandle(plan, h(18, 10), 20), 'end');
});
