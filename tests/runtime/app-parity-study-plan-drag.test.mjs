// Android StudyDayPlannerView / StudyPlannerModel drag rules (SNAP_MINUTES 15, MIN_STUDY_MINUTES 30;
// START 0..end-30, END start+30..23:45 pushing the limit, LIMIT end..1440 where 1440 is "No limit";
// the nearest handle wins and LIMIT loses ties), plus the Study length slider built on them.
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

test('the Study length slider moves the end and keeps the start', () => {
    const draft = { start: h(16), end: h(18), limit: h(19) };
    assert.equal(Drag.lengthOf(draft), 120);
    assert.deepEqual(Drag.withLength(draft, 150), { start: h(16), end: h(18, 30), limit: h(19) });
    assert.deepEqual(Drag.withLength(draft, 200), { start: h(16), end: h(19, 15), limit: h(19, 15) });
    assert.equal(Drag.withLength(draft, 5).end, h(16, 30), 'at least 30 minutes');
    assert.equal(Drag.withLength(draft, 900).end, h(23, 45), 'never past 23:45');
    assert.equal(Drag.maxLength(draft), h(23, 45) - h(16));
});
