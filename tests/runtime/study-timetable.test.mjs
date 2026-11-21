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

// ---- Add to my calendar (Android b74369747) -----------------------------------------------------

test('the calendar file repeats each period weekly in the timetable\'s zone', () => {
    const ics = Timetable.ics(Timetable.copyDay(week(), 'mon', ['wed']), { year: 2026, month: 11, day: 18 }, '20261118T000000Z',
        lane => lane.label || 'CBSE, class 6-8; maths');
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.trimEnd().endsWith('END:VCALENDAR'));
    assert.equal(ics.match(/BEGIN:VEVENT/g).length, 4);
    // Wednesday 18 Nov is today; Monday's periods start next Monday (23 Nov).
    assert.ok(ics.includes('DTSTART;TZID=Asia/Kolkata:20261118T060000'));
    assert.ok(ics.includes('DTSTART;TZID=Asia/Kolkata:20261123T070000'));
    assert.ok(ics.includes('RRULE:FREQ=WEEKLY;BYDAY=MO') && ics.includes('RRULE:FREQ=WEEKLY;BYDAY=WE'));
    assert.ok(ics.includes('SUMMARY:CBSE\\, class 6-8\\; maths'));
    assert.ok(ics.includes('SUMMARY:UPSC'));
    assert.ok(ics.split('\r\n').every(line => Buffer.byteLength(line, 'utf8') <= 75));
    assert.equal(Timetable.escape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
    // A long name folds onto continuation lines that start with a space.
    const long = Timetable.ics(week(), { year: 2026, month: 11, day: 18 }, '20261118T000000Z', () => 'गणित '.repeat(30));
    assert.ok(long.split('\r\n').some(line => line.startsWith(' ')));
    assert.ok(long.split('\r\n').every(line => Buffer.byteLength(line, 'utf8') <= 75));
    // A period to midnight ends on the next day at 00:00.
    const late = Timetable.withPeriod(week(), 'tue', 23 * 60, 24 * 60, 'l1');
    assert.ok(Timetable.ics(late, { year: 2026, month: 11, day: 17 }, 'x', () => 'x').includes('DTEND;TZID=Asia/Kolkata:20261118T000000'));
    assert.equal(Timetable.utcStamp(Date.UTC(2026, 10, 18, 4, 5, 6)), '20261118T040506Z');
});

test('saving a timetable: the person\'s own is never a parent\'s, and a child can\'t edit one', async () => {
    const { createStudyBackground } = require('../../js/study_background.js');
    const make = type => {
        const store = { ftNanahDeviceId: 'laptop-1', ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: {
            name: 'Riya', type, main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [] }, kids: { mode: 'blocklist', blockedKeywords: [] },
            study: Model.createStudy({ activePackIds: ['in_upsc'] })
        } } } };
        const controller = createStudyBackground({
            browserAPI: { storage: { local: {
                get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
                set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
            } }, alarms: { create() {}, clear() {} } },
            Engine, Model, Packs, now: () => at(16, 12), zoneId: () => 'UTC', loadCatalog: async () => catalog,
            writeProfile: async (id, profile) => { store.ftProfilesV4.profiles[id] = structuredClone(profile); return { ok: true }; }
        });
        return { controller, study: () => store.ftProfilesV4.profiles.p1.study };
    };
    const own = make('account');
    assert.deepEqual(await own.controller.update({ timetable: { ...week(), setByParentId: 'someone' } }), { ok: true });
    assert.equal(own.study().timetable.setByParentId, undefined);
    assert.deepEqual(Timetable.packIds(own.study().timetable), ['cls_in_cbse_6_8', 'in_upsc']);
    // The lane's pack gets a copy.
    assert.ok(own.study().packCopies.cls_in_cbse_6_8);
    assert.deepEqual(await own.controller.update({ timetable: null }), { ok: true });
    assert.equal('timetable' in own.study(), false);
    const child = make('child');
    assert.deepEqual(await child.controller.update({ timetable: week() }), { ok: false, error: 'set_by_parent' });
});

// ---- DESIGN_PASS_2026-11-21 §4 decision 4 (Android bfbe09df0, 9413ee20f, 6af91cdbf) -----------------

const P = (start, end, laneId = 'l1') => ({ startMinute: start, endMinute: end, laneId });

test('the timetable bar fits the day\'s periods, and a dragged edge snaps and keeps 15 minutes', () => {
    const day = [P(16 * 60, 17 * 60), P(19 * 60, 20 * 60 + 30, 'l2')];
    assert.deepEqual(Timetable.barRange(day), { start: 15 * 60, end: 22 * 60 });
    assert.deepEqual(Timetable.barRange([]), { start: 15 * 60, end: 21 * 60 });
    // A short day still shows six hours; a period being edited is taken in.
    const short = Timetable.barRange([P(9 * 60, 10 * 60)]);
    assert.equal(short.end - short.start, 6 * 60);
    assert.deepEqual(Timetable.barRange(day, null, true), { start: 6 * 60, end: 23 * 60 });
    assert.equal(Timetable.barRange(day, P(5 * 60 + 30, 6 * 60, 'x'), true).start, 5 * 60);
    const p = P(16 * 60, 17 * 60);
    assert.equal(Timetable.moveEdge(p, true, 15 * 60 + 52).startMinute, 15 * 60 + 45);
    assert.equal(Timetable.moveEdge(p, true, 23 * 60).startMinute, 16 * 60 + 45);
    assert.equal(Timetable.moveEdge(p, false, 0).endMinute, 16 * 60 + 15);
    assert.equal(Timetable.moveEdge(p, false, 2000).endMinute, Timetable.DAY_MINUTES);
});

test('the week grid shows 6 am to 11 pm grown to every period, and an empty hour offers a period up to the next one', () => {
    const t = Timetable.withPeriod(week(), 'tue', 5 * 60, 6 * 60, 'l1');
    assert.deepEqual(Timetable.weekRange(t), { start: 5 * 60, end: 23 * 60 });
    // Monday has 6-7 and 7-8: 5:30 offers 5-6; 6:30 is taken; 8:10 offers 8-9.
    assert.deepEqual(Timetable.slot(t, 'mon', 5 * 60 + 30), { startMinute: 5 * 60, endMinute: 6 * 60 });
    assert.equal(Timetable.slot(t, 'mon', 6 * 60 + 30), null);
    assert.deepEqual(Timetable.slot(t, 'mon', 8 * 60 + 10), { startMinute: 8 * 60, endMinute: 9 * 60 });
    // Trimmed to where the next period starts.
    const tight = Timetable.withPeriod(t, 'wed', 9 * 60 + 30, 10 * 60, 'l1');
    assert.deepEqual(Timetable.slot(tight, 'wed', 9 * 60), { startMinute: 9 * 60, endMinute: 9 * 60 + 30 });
});

test('a block too narrow for its lane\'s name shows initials, never a cut-off name', () => {
    const fits = width => text => text.length <= width;
    assert.equal(Timetable.blockLabel('Khan Academy', fits(20)), 'Khan Academy');
    assert.equal(Timetable.blockLabel('Khan Academy', fits(5)), 'KA');
    assert.equal(Timetable.blockLabel('CBSE, class 6-8 + maths', fits(4)), 'CC6');
    assert.equal(Timetable.blockLabel('GMAT', fits(3)), 'GMA');
    assert.equal(Timetable.blockLabel('Khan Academy', fits(1)), null);
    // A bracketed note is left out of the initials, never "KA(".
    assert.equal(Timetable.blockLabel('Khan Academy (any curriculum)', fits(5)), 'KA');
});
