// Android StudyTimetableTest (a614cc44e, 7d655a511): the study timetable's periods, lanes, the clock
// and the runtime (docs/study/TIMETABLE_SPEC.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Timetable = require('../../js/shared/study_timetable.js');
const Model = require('../../js/shared/study_model.js');
const Engine = require('../../js/shared/study_engine.js');
const Packs = require('../../js/shared/study_packs.js');

// Wall times in Asia/Kolkata (UTC+05:30, no daylight saving). 2026-11-16 is a Monday.
const at = (day, hour, minute = 0) => Date.UTC(2026, 10, day, hour, minute) - 330 * 60 * 1000;

function week() {
    let t = Timetable.create({ zone: 'Asia/Kolkata' });
    let r = Timetable.withLane(t, ['cls_in_cbse_6_8']); t = r.timetable; const maths = r.laneId;
    r = Timetable.withLane(t, ['in_upsc'], 'UPSC'); t = r.timetable; const upsc = r.laneId;
    t = Timetable.withPeriod(t, 'mon', 6 * 60, 7 * 60, maths);
    t = Timetable.withPeriod(t, 'mon', 7 * 60, 8 * 60, upsc);
    return t;
}
const starts = (t, day) => Timetable.periodsOf(t, day).map(item => item.startMinute);

test('periods snap to 15 minutes, never overlap, and copy to other days', () => {
    let t = week();
    assert.deepEqual(starts(t, 'mon'), [360, 420]);
    // A period over 06:30-07:30 replaces the two it overlaps.
    t = Timetable.withPeriod(t, 'mon', 6 * 60 + 32, 7 * 60 + 28, 'l1');
    assert.deepEqual(Timetable.periodsOf(t, 'mon').map(item => [item.startMinute, item.endMinute]), [[390, 450]]);
    // Too short to keep.
    assert.equal(Timetable.withPeriod(t, 'tue', 600, 605, 'l1'), t);
    const copied = Timetable.copyDay(week(), 'mon', ['tue', 'wed', 'mon', 'xyz']);
    assert.deepEqual(copied.periods.tue, copied.periods.mon);
    assert.deepEqual(copied.periods.wed, copied.periods.mon);
    assert.equal('xyz' in copied.periods, false);
    // The same packs reuse their lane.
    assert.equal(Timetable.withLane(week(), ['cls_in_cbse_6_8']).laneId, 'l1');
    assert.deepEqual(Timetable.packIds(week()), ['cls_in_cbse_6_8', 'in_upsc']);
    // Removing a period.
    assert.deepEqual(starts(Timetable.withoutPeriod(week(), 'mon', 360), 'mon'), [420]);
});

test('the clock reads the lane now, its end and the next period in the timetable\'s zone', () => {
    const t = week();
    const now = Timetable.at(t, at(16, 6, 30), 'UTC');
    assert.equal(now.lane?.id, 'l1');
    assert.equal(now.endsAt, at(16, 7));
    assert.equal(now.next?.id, 'l2');
    assert.equal(now.nextAt, at(16, 7));
    const between = Timetable.at(t, at(16, 9), 'UTC');
    assert.equal(between.lane, null);
    // The next period is next Monday at 06:00.
    assert.equal(between.nextAt, at(23, 6));
    assert.equal(Timetable.nextBoundary(t, at(16, 6, 30)), at(16, 7));
    // A zone the timetable doesn't name reads in the device's zone.
    const local = Timetable.at({ ...t, zone: undefined }, Date.UTC(2026, 10, 16, 6, 30), 'UTC');
    assert.equal(local.lane?.id, 'l1');
});

test('the timetable round-trips through study JSON, unknown keys kept at every level', () => {
    const json = JSON.parse(JSON.stringify({ ...week(), examDates: { in_upsc: '2027-05-24' }, between: 'none',
        hideShortsAndComments: false, setByParentId: 'parent' }));
    json.futureKey = 'kept';
    json.lanes[0].colour = 'sage';
    json.periods.mon[0].note = 'mock test';
    const study = Model.createStudy({ activePackIds: ['in_upsc'], timetable: json });
    const back = Model.normalizeStudy(JSON.parse(JSON.stringify(study)));
    assert.deepEqual(back.timetable, study.timetable);
    assert.equal(back.timetable.futureKey, 'kept');
    assert.equal(back.timetable.lanes[0].colour, 'sage');
    assert.equal(back.timetable.periods.mon[0].note, 'mock test');
    assert.equal(back.timetable.examDates.in_upsc, '2027-05-24');
    assert.equal(back.timetable.between, 'none');
    assert.equal(back.timetable.hideShortsAndComments, false);
    assert.equal(back.timetable.setByParentId, 'parent');
    // A study state without a timetable writes none.
    assert.equal('timetable' in Model.createStudy({ activePackIds: ['in_upsc'] }), false);
    // Bad rows are dropped, overlaps keep the earlier period.
    const messy = Timetable.normalize({ lanes: [{ id: 'a', packIds: ['in_upsc'] }, { id: 'b', packIds: [] }],
        periods: { tue: [{ start: '09:00', end: '10:00', lane: 'a' }, { start: '09:30', end: '11:00', lane: 'a' },
            { start: '12:00', end: '11:00', lane: 'a' }, { start: '25:00', end: '26:00', lane: 'a' }] } });
    assert.deepEqual(messy.lanes.map(lane => lane.id), ['a']);
    assert.deepEqual(Timetable.periodsOf(messy, 'tue').map(item => [item.startMinute, item.endMinute]), [[540, 600]]);
    // A merge keeps a parent's timetable; otherwise the incoming one wins.
    const parents = Model.createStudy({ timetable: { ...week(), setByParentId: 'parent' } });
    const mine = Model.createStudy({ timetable: Timetable.copyDay(week(), 'mon', ['tue']) });
    assert.equal(Model.mergeStudy(parents, mine).timetable.setByParentId, 'parent');
    assert.deepEqual(Model.mergeStudy(Model.createStudy({}), mine).timetable, mine.timetable);
});

// ---- Runtime ----------------------------------------------------------------------------------

const channels = prefix => [1, 2, 3, 4].map(n => ({ channelId: `UC${prefix.repeat(21)}${n}`, name: `${prefix} ${n}`, language: 'en' }));
const catalog = Packs.parseCatalog({ schema: 'filtertube_study_packs', version: 1, packs: [
    { id: 'cls_in_cbse_6_8', kind: 'class', name: { en: 'CBSE 6-8' }, countries: ['IN'], keywords: ['fractions'], channels: channels('m') },
    { id: 'in_upsc', kind: 'study', name: { en: 'UPSC' }, countries: ['IN'], keywords: ['polity'], channels: channels('u') }
] });

function applied(time, between = 'default') {
    const study = Model.createStudy({ activePackIds: ['in_upsc'], timetable: { ...week(), between } });
    const clock = Engine.studyClock({ plan: study.plan, focus: study.focus, breakMode: study.breakMode, now: time, timetable: study.timetable, zone: 'UTC' });
    const profile = { name: 'Student', main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
        kids: { mode: 'blocklist', blockedKeywords: [], whitelistChannels: [] }, study };
    return { clock, result: Engine.studyEffectiveProfile(profile, { catalog, clock, study }) };
}

test('during a period the lane\'s packs apply, between periods the default or nothing', () => {
    const maths = applied(at(16, 6, 15));
    assert.equal(maths.clock.state, Engine.STUDY);
    assert.equal(maths.clock.source, 'timetable');
    assert.deepEqual(maths.result.packIds, ['cls_in_cbse_6_8']);
    assert.equal(maths.result.phase, 'study');
    assert.deepEqual(applied(at(16, 7, 15)).result.packIds, ['in_upsc']);
    // The rules change at the boundary: the clock's next transition is the period's end.
    const before = applied(at(16, 6, 59)).clock;
    assert.equal(before.until, at(16, 7));
    assert.equal(before.next.at, at(16, 7));
    assert.equal(before.next.state, Engine.STUDY);
    // After the last period the next transition is next Monday's first.
    assert.equal(applied(at(16, 7, 30)).clock.next.at, at(16, 8));
    // Between periods with no plan window: the normal rules (no study applied).
    assert.equal(applied(at(16, 10)).result.applied, false);
    assert.equal(applied(at(16, 10), 'none').result.applied, false);
    assert.equal(applied(at(16, 10)).clock.next.at, at(23, 6));
});

test('between "none" ends the plan\'s round outside the periods; breaks keep their rules', () => {
    // A plan every day 09:00-12:00 (Kolkata), 25-minute rounds and 5-minute breaks.
    const zone = process.env.TZ;
    process.env.TZ = 'Asia/Kolkata';
    try {
        const plan = { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], start: '09:00', end: '12:00', setByParentId: null };
        const clockAt = (time, between) => Engine.studyClock({ plan, focus: { roundMinutes: 25, breakMinutes: 5 }, now: time,
            timetable: { ...week(), between }, zone: 'UTC' });
        assert.equal(clockAt(at(16, 9, 10), 'default').state, Engine.STUDY);
        assert.equal(clockAt(at(16, 9, 10), 'none').state, Engine.NORMAL);
        assert.equal(clockAt(at(16, 9, 27), 'none').state, Engine.BREAK);
    } finally {
        if (zone === undefined) delete process.env.TZ; else process.env.TZ = zone;
    }
});

test('the timetable\'s lanes get pack copies like the active packs', () => {
    const stamped = Engine.stampPackCopies(Model.createStudy({ activePackIds: ['in_upsc'], timetable: week() }), catalog);
    assert.deepEqual(new Set(Object.keys(stamped.packCopies)), new Set(['in_upsc', 'cls_in_cbse_6_8']));
});

test('the Study state follows the timetable: a period is a round of its lane, and an alarm waits at its end', async () => {
    const { createStudyBackground } = require('../../js/study_background.js');
    const store = { ftNanahDeviceId: 'laptop-1', ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: {
        name: 'Riya', type: 'account',
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [] }, kids: { mode: 'blocklist', blockedKeywords: [] },
        study: Model.createStudy({ activePackIds: ['in_upsc'], timetable: week() })
    } } } };
    const alarms = new Map();
    const clock = { now: at(16, 6, 30) };
    const controller = createStudyBackground({
        browserAPI: {
            storage: { local: {
                get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
                set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
            } },
            alarms: { create(name, info) { alarms.set(name, info.when); }, clear(name) { alarms.delete(name); } }
        },
        Engine, Model, Packs, now: () => clock.now, zoneId: () => 'UTC', loadCatalog: async () => catalog,
        writeProfile: async (id, profile) => { store.ftProfilesV4.profiles[id] = structuredClone(profile); return { ok: true }; }
    });
    const during = controller.apply('p1', store.ftProfilesV4.profiles.p1, await controller.prepare());
    assert.equal(during.applied, true);
    assert.equal(during.state.state, 'STUDY');
    assert.deepEqual(during.state.packIds, ['cls_in_cbse_6_8']);
    assert.equal(during.state.timetableLane.id, 'l1');
    assert.equal(during.state.until, at(16, 7));
    assert.equal(await controller.schedule(), at(16, 7));
    clock.now = at(16, 9);
    const after = controller.apply('p1', store.ftProfilesV4.profiles.p1, await controller.prepare());
    assert.equal(after.applied, false);
    assert.equal(await controller.schedule(), at(23, 6));
});
