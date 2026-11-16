// The clock guard (Android StudyClockGuard): a wall-clock jump or a zone change during a lock or a
// parent's plan holds the session at rest instead of ending it, and a parent's lock needs both clocks
// and its running time (or a network time) to end.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Guard = require('../../js/shared/study_clock_guard.js');
const Engine = require('../../js/shared/study_engine.js');
const Model = require('../../js/shared/study_model.js');
const Packs = require('../../js/shared/study_packs.js');
const { createStudyBackground } = require('../../js/study_background.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));

const MIN = 60 * 1000;
const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();

test('pure: same worker follows the monotonic clock; a jump is kept only while sensitive', () => {
    const first = Guard.read(null, { wall: 1_000_000, mono: 10, bootId: 'w1', zoneId: 'Asia/Kolkata', sensitive: true });
    assert.equal(first.reading.changed, false);
    const forward = Guard.read(first.anchor, { wall: 1_000_000 + 3 * 60 * MIN, mono: 10 + MIN, bootId: 'w1', zoneId: 'Asia/Kolkata', sensitive: true });
    assert.equal(forward.reading.jumped, true);
    assert.equal(forward.reading.forward, true);
    assert.equal(forward.reading.trusted, 1_000_000 + MIN);
    assert.equal(forward.reading.lockNow, 1_000_000 + MIN, 'has it ended: the earlier clock');
    const relaxed = Guard.read(first.anchor, { wall: 1_000_000 + 3 * 60 * MIN, mono: 10 + MIN, bootId: 'w1', zoneId: 'Asia/Kolkata', sensitive: false });
    assert.equal(relaxed.reading.changed, false, 'without a lock the new time is accepted');
    const backward = Guard.read(first.anchor, { wall: 1_000_000 - 60 * MIN, mono: 20, bootId: 'w2', zoneId: 'Asia/Kolkata', sensitive: true });
    assert.equal(backward.reading.backward, true, 'time never runs backwards across a worker restart');
    const zone = Guard.read(first.anchor, { wall: 1_000_000, mono: 11, bootId: 'w1', zoneId: 'America/New_York', sensitive: true });
    assert.equal(zone.reading.zoneChanged, true);
    const network = Guard.read(first.anchor, { wall: 1_000_000 + 60 * MIN, mono: 12, bootId: 'w3', zoneId: 'Asia/Kolkata', sensitive: true, networkTime: 1_000_000 + 60 * MIN });
    assert.equal(network.reading.changed, false, 'a network time confirms a wake from sleep');
});

test('pure: the meter counts monotonic time, and at most 2 minutes across a worker restart', () => {
    let meter = Guard.advanceMeter(null, { mono: 0, bootId: 'w1', wall: 0 });
    meter = Guard.advanceMeter(meter, { mono: 5 * MIN, bootId: 'w1', wall: 5 * MIN });
    assert.equal(meter.total, 5 * MIN);
    meter = Guard.advanceMeter(meter, { mono: 1, bootId: 'w2', wall: 5 * 60 * MIN });
    assert.equal(meter.total, 7 * MIN, 'a jump while no worker ran gives 2 minutes at most');
    const lock = { sessionId: 'L', setByParentId: 'mum', startsAt: 0, endsAt: 60 * MIN };
    const seen = Guard.firstSight(lock, { total: 0 }, 0);
    const look = Guard.wallOnly(2 * 60 * MIN, 'UTC');
    assert.equal(Guard.parentLockState(lock, look, { seen, meter }).active, true, 'the wall clock alone never ends a parent lock');
    assert.equal(Guard.parentLockState(lock, look, { seen, meter: { total: 60 * MIN } }).ended, true);
    assert.equal(Guard.parentLockState(lock, look, { seen, meter, networkTime: 61 * MIN }).ended, true, 'or a network time');
});

function harness({ study, now, zone = 'Asia/Kolkata', network = null }) {
    const store = { ftNanahDeviceId: 'laptop-1', ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: {
        name: 'Aarav', type: 'child', main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [] },
        kids: { mode: 'blocklist', blockedKeywords: [] }, study: Model.createStudy({ activePackIds: ['in_upsc_cse'], ...study }) } } } };
    const clock = { now, mono: 0, boot: 'w1', zone, network };
    const browserAPI = { storage: { local: {
        get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
        set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
    } }, alarms: { create() {}, clear() {} } };
    const controller = createStudyBackground({
        browserAPI, Engine, Model, Packs, Guard, now: () => clock.now,
        monotonic: () => ({ mono: clock.mono, bootId: clock.boot }), zoneId: () => clock.zone,
        networkTime: async () => clock.network,
        loadCatalog: async () => catalog, getSelfControlSession: async () => null,
        writeProfile: async (id, profile) => { store.ftProfilesV4.profiles[id] = structuredClone(profile); return { ok: true }; }
    });
    const tick = ms => { clock.now += ms; clock.mono += ms; };
    return { controller, store, clock, tick };
}

const parentPlan = { focus: { roundMinutes: 50, breakMinutes: 10 }, plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' } };

test('moving the clock out of a parent plan window holds at rest instead of normal rules', async () => {
    const h = harness({ study: parentPlan, now: at(16, 16, 10) });
    assert.equal((await h.controller.getState()).state, 'STUDY');
    h.tick(MIN);
    h.clock.now = at(16, 19, 0); // the child sets the clock past the window
    const held = await h.controller.getState();
    assert.equal(held.state, 'LIMIT');
    assert.equal(held.clockHold, true);
    assert.equal(held.phase, 'rest');
    assert.equal(held.clockNotes.length, 1, 'noted for the parent');
    const compiled = h.controller.apply('p1', h.store.ftProfilesV4.profiles.p1, await h.controller.prepare());
    assert.equal(compiled.applied, true);
    assert.deepEqual(compiled.profile.main.whitelistChannels, [], 'rest: nothing plays');
    h.clock.now = at(16, 16, 12); // put back
    h.tick(MIN);
    const back = await h.controller.getState();
    assert.equal(back.clockHold, false);
    assert.equal(back.state, 'STUDY');
});

test('a zone change during a parent plan window holds; a network time clears a wake from sleep', async () => {
    const h = harness({ study: parentPlan, now: at(16, 16, 10) });
    await h.controller.getState();
    h.tick(MIN);
    h.clock.zone = 'Pacific/Honolulu';
    assert.equal((await h.controller.getState()).clockHold, true);
    const sleep = harness({ study: parentPlan, now: at(16, 16, 10) });
    await sleep.controller.getState();
    sleep.clock.now += 20 * MIN; // the laptop slept: the monotonic clock stood still
    sleep.clock.network = sleep.clock.now;
    const woke = await sleep.controller.getState();
    assert.equal(woke.clockHold, false);
    assert.equal(woke.state, 'STUDY');
});

test('a parent session lock: Locked until its end, not ended by moving the clock forward', async () => {
    const start = at(16, 10, 0);
    const lock = { sessionId: 'mum-lock-1', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'mum', startsAt: start, endsAt: start + 60 * MIN, scope: 'session' };
    const h = harness({ study: { lock }, now: start + 5 * MIN });
    const during = await h.controller.getState();
    assert.equal(during.state, 'STUDY');
    assert.equal(during.setByParentId, 'mum');
    assert.equal(during.lockedUntil, start + 60 * MIN);
    assert.equal(during.endPolicy.canEnd, false);
    h.tick(MIN);
    h.clock.boot = 'w2'; // a new worker, and the clock moved forward by 3 hours
    h.clock.mono = 0;
    h.clock.now += 3 * 60 * MIN;
    const after = await h.controller.getState();
    assert.notEqual(after.state, 'NORMAL', 'still held by the lock');
    await h.controller.onAlarm(h.controller.ALARM);
    assert.equal(h.store.ftProfilesV4.profiles.p1.study.lock?.sessionId, 'mum-lock-1', 'a parent lock is never cleared on wall-clock expiry');
});

// Ports Android 2280f4ee3 (StudyEnforcementP0Test "Self-Control reads the guarded clock"): moving the
// clock two days ahead can't end a Self-Control session, because its expiry reads lockClockNow.
test('Self-Control reads the guarded clock, so a forward clock can\'t end a Locked session', async () => {
    const h = harness({ study: { ...parentPlan, lock: { sessionId: 'lock-exam-6', setByParentId: 'mum', scope: 'session',
        startsAt: at(16, 16, 10), endsAt: at(16, 16, 10) + 120 * MIN } }, now: at(16, 16, 10) });
    await h.controller.getState();
    h.tick(MIN);
    h.clock.now += 2 * 24 * 60 * MIN;
    const guarded = await h.controller.lockClockNow();
    assert.equal(guarded, at(16, 16, 11));
    const session = { startedAt: at(16, 16, 10), lockedUntil: at(16, 16, 35) };
    assert.ok(guarded < session.lockedUntil, 'still active on the guarded clock');
    assert.ok(h.clock.now >= session.lockedUntil, 'over on the wall clock');
});
