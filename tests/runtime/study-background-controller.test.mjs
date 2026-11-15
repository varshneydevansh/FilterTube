// The background Study controller: compile-time application, alarms at every transition, Gentle and
// Locked sessions, break skipping, and per-device study time that only counts during STUDY.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Model = require('../../js/shared/study_model.js');
const Packs = require('../../js/shared/study_packs.js');
const { createStudyBackground, RUNTIME_KEY } = require('../../js/study_background.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));

const at = (day, hour, minute = 0, second = 0) => new Date(2026, 10, day, hour, minute, second).getTime();

function harness({ study = {}, now = at(16, 12) } = {}) {
    const store = {
        ftNanahDeviceId: 'laptop-1',
        ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: {
            name: 'Aarav', type: 'account',
            main: { mode: 'blocklist', channels: [], keywords: [{ word: 'drama' }], whitelistChannels: [] },
            kids: { mode: 'blocklist', blockedKeywords: [] },
            study: Model.createStudy({ activePackIds: ['in_upsc_cse'], focus: { roundMinutes: 50, breakMinutes: 10 },
                plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: null }, ...study })
        } } }
    };
    const alarms = new Map();
    const transitions = [];
    let selfControl = null;
    const clock = { now };
    const browserAPI = {
        storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
            set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
        } },
        alarms: { create(name, info) { alarms.set(name, info.when); }, clear(name) { alarms.delete(name); } }
    };
    const controller = createStudyBackground({
        browserAPI, Engine, Model, Packs, now: () => clock.now,
        loadCatalog: async () => catalog,
        getSelfControlSession: async () => (selfControl && clock.now < selfControl.lockedUntil ? selfControl : null),
        startLockedSession: async ({ sessionId, lockedUntil, profileId }) => {
            selfControl = { sessionId, lockedUntil, sessionKind: 'hard_whitelist' };
            const profile = store.ftProfilesV4.profiles[profileId];
            profile.study = { ...profile.study, lock: { sessionId, sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null } };
            return { ok: true };
        },
        writeProfile: async (profileId, profile) => {
            if (selfControl && clock.now < selfControl.lockedUntil) return { ok: false, error: 'self_control_settings_locked' };
            store.ftProfilesV4.profiles[profileId] = structuredClone(profile);
            return { ok: true };
        },
        onTransition: async reason => { transitions.push(reason); }
    });
    return { controller, store, alarms, transitions, clock, profile: () => store.ftProfilesV4.profiles.p1 };
}

test('apply(): the compiler gets the pack allow layer during STUDY and the plain profile outside', async () => {
    const h = harness({ now: at(16, 16, 10) });
    const prepared = await h.controller.prepare();
    const during = h.controller.apply('p1', h.profile(), prepared);
    assert.equal(during.applied, true);
    assert.equal(during.profile.main.mode, 'whitelist');
    assert.equal(during.profile.main.layered, true);
    assert.equal(during.state.state, 'STUDY');
    assert.equal(during.state.round, 1);
    assert.equal(during.state.validUntil, at(16, 16, 50), 'a cached compile expires at the next transition');
    h.clock.now = at(16, 19);
    const after = h.controller.apply('p1', h.profile(), await h.controller.prepare());
    assert.equal(after.applied, false);
    assert.equal(after.profile.main.mode, 'blocklist');
    assert.equal(h.controller.apply('p1', { main: {} }, prepared).state, null, 'no study object, nothing to do');
});

test('schedule() sets one alarm at the next transition; onAlarm pushes the change to tabs', async () => {
    const h = harness({ now: at(16, 15, 0) });
    assert.equal(await h.controller.schedule(), at(16, 16, 0));
    assert.equal(h.alarms.get(h.controller.ALARM), at(16, 16, 0));
    h.clock.now = at(16, 16, 0);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.deepEqual(h.transitions, ['alarm']);
    assert.equal(h.alarms.get(h.controller.ALARM), at(16, 16, 50), 'round 1 ends at 16:50');
    assert.equal(await h.controller.onAlarm('someOtherAlarm'), false);
});

test('Gentle: a self-started session ends 30 seconds after End, unless cancelled', async () => {
    const h = harness({ study: { plan: null }, now: at(17, 10, 0) });
    const started = await h.controller.startSession({ minutes: 60, lock: 'gentle' });
    assert.equal(started.ok, true);
    assert.equal(h.profile().study.lock.mode, 'gentle');
    let state = await h.controller.getState();
    assert.equal(state.state, 'STUDY');
    assert.equal(state.sessionEnd, at(17, 11, 0));
    assert.equal(state.endPolicy.canEnd, true);
    assert.equal((await h.controller.startSession({ minutes: 30 })).error, 'already_studying');

    h.clock.now = at(17, 10, 0, 20);
    const end = await h.controller.requestEnd();
    assert.equal(end.endsAt, at(17, 10, 0, 50));
    assert.equal(h.alarms.get(h.controller.ALARM), at(17, 10, 0, 50), 'the pause is an alarm');
    await h.controller.cancelEnd();
    h.clock.now = at(17, 10, 0, 51);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.equal((await h.controller.getState()).state, 'STUDY', 'a cancelled end keeps studying');

    await h.controller.requestEnd();
    h.clock.now = at(17, 10, 1, 0);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.equal((await h.controller.getState()).state, 'STUDY', 'still inside the 30-second pause');
    h.clock.now = at(17, 10, 1, 22);
    await h.controller.onAlarm(h.controller.ALARM);
    state = await h.controller.getState();
    assert.equal(state.state, 'NORMAL');
    assert.equal(h.profile().study.lock, null, 'the lock reference is cleared');
});

test('Gentle End also ends today\'s plan occurrence early, and tomorrow still runs', async () => {
    const h = harness({ study: { plan: { days: ['mon', 'tue'], start: '16:00', end: '18:00', setByParentId: null } }, now: at(16, 16, 5) });
    await h.controller.requestEnd();
    h.clock.now = at(16, 16, 6);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.equal((await h.controller.getState()).state, 'NORMAL');
    h.clock.now = at(17, 16, 5);
    assert.equal((await h.controller.getState()).state, 'STUDY');
});

test('Locked: goes through the Self-Control session, is capped at 4 hours and cannot be ended', async () => {
    const h = harness({ study: { plan: null }, now: at(17, 10, 0) });
    assert.equal((await h.controller.startSession({ minutes: 241, lock: 'locked' })).error, 'invalid_duration');
    const started = await h.controller.startSession({ minutes: 90, lock: 'locked' });
    assert.equal(started.ok, true);
    assert.equal(h.profile().study.lock.sessionKind, 'hard_whitelist');
    assert.equal(h.profile().study.lock.mode, 'locked');
    const state = await h.controller.getState();
    assert.equal(state.lock.lockedUntil, at(17, 11, 30));
    assert.equal(state.endPolicy.canEnd, false);
    assert.equal((await h.controller.requestEnd()).ok, false);
    assert.equal((await h.controller.update({ activePackIds: [] })).error, 'locked', 'the child can\'t loosen rules while locked');
    h.clock.now = at(17, 11, 31);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.equal(h.profile().study.lock, null, 'the expired lock reference is cleared');
});

test('a parent-set plan cannot be ended, skipped or loosened here; it can be tightened', async () => {
    const h = harness({ study: { plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' } }, now: at(16, 16, 55) });
    const state = await h.controller.getState();
    assert.equal(state.state, 'BREAK');
    assert.equal(state.canSkipBreak, false);
    assert.equal((await h.controller.skipBreak()).error, 'set_by_parent');
    assert.equal((await h.controller.requestEnd()).error, 'set_by_parent');
    assert.equal((await h.controller.update({ breakMode: 'normal' })).error, 'set_by_parent');
    assert.equal((await h.controller.update({ plan: { days: ['mon'], start: '16:00', end: '17:00', setByParentId: 'mum' } })).error, 'set_by_parent');
    assert.equal((await h.controller.update({ plan: { days: ['mon', 'tue'], start: '16:00', end: '18:30', setByParentId: 'mum' } })).ok, true, 'stricter');
    assert.deepEqual(h.profile().study.plan.days, ['mon', 'tue']);
    assert.ok(h.profile().study.packCopies.in_upsc_cse.channels.length > 0, 'a copy of the active pack rides in study');
});

test('Skip break: self-started only, until the break ends', async () => {
    const h = harness({ now: at(16, 16, 55) });
    const skip = await h.controller.skipBreak();
    assert.equal(skip.until, at(16, 17, 0));
    const state = await h.controller.getState();
    assert.equal(state.breakSkipped, true);
    h.clock.now = at(16, 16, 10);
    assert.equal((await h.controller.skipBreak()).error, 'not_on_break');
});

test('time accounting: only STUDY counts, never twice for two tabs, per device and local date', async () => {
    const h = harness({ now: at(16, 16, 10) });
    assert.equal((await h.controller.tick({ seconds: 30 })).credited, 30);
    h.clock.now = at(16, 16, 10, 30);
    assert.equal((await h.controller.tick({ seconds: 30 })).credited, 30);
    assert.equal((await h.controller.tick({ seconds: 30 })).credited, 0, 'a second tab in the same moment adds nothing');
    h.clock.now = at(16, 16, 12);
    assert.equal((await h.controller.tick({ seconds: 600 })).credited, 60, 'a tick is at most 60 seconds');
    assert.equal(h.store[RUNTIME_KEY].seconds.p1['2026-11-16'], 120);
    h.clock.now = at(16, 16, 55);
    assert.equal((await h.controller.tick({ seconds: 30 })).error, 'not_studying', 'breaks do not count');
    assert.equal((await h.controller.getState()).todayMinutes, 2);
    h.clock.now = at(16, 18, 1);
    await h.controller.onAlarm(h.controller.ALARM);
    assert.deepEqual(h.profile().study.progress, { 'laptop-1': { '2026-11-16': 2 } }, 'folded into study.progress at the end');
    await h.controller.foldProgress();
    assert.deepEqual(h.profile().study.progress, { 'laptop-1': { '2026-11-16': 2 } }, 'folding again never adds twice');
});

test('message routing keeps UI-only actions away from web pages', async () => {
    const h = harness({ now: at(16, 16, 10) });
    assert.equal(h.controller.handleMessage({ action: 'getCompiledSettings' }, {}), null);
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyStartSession', minutes: 30 }, { youtubeContent: true })).error, 'untrusted_sender');
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyProgressTick', seconds: 5 }, { extensionPage: true })).error, 'untrusted_sender');
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyGetState' }, { youtubeContent: true })).state, 'STUDY');
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyGetState' }, {})).error, 'untrusted_sender');
    const updated = await h.controller.handleMessage({ action: 'FilterTube_StudyUpdate', patch: { breakMode: 'normal', lock: { sessionId: 'x' }, progress: { a: { '2026-01-01': 9 } } } }, { extensionPage: true });
    assert.equal(updated.ok, true);
    assert.equal(h.profile().study.breakMode, 'normal');
    assert.equal(h.profile().study.lock, null, 'update never writes the lock');
    assert.deepEqual(h.profile().study.progress, {}, 'or progress');
});

test('background.js wires the controller into the compiler, alarms and messages', () => {
    const source = fs.readFileSync('js/background.js', 'utf8');
    assert.match(source, /importScripts\([^)]*'shared\/study_engine\.js', 'shared\/study_clock_guard\.js', 'study_background\.js'/);
    assert.match(source, /studyBackground\.apply\(activeProfileId, activeProfile, studyPrepared\)/);
    assert.match(source, /const activeMain = safeObject\(studyRuleProfile\.main\);/);
    assert.match(source, /const activeKids = safeObject\(studyRuleProfile\.kids\);/);
    assert.match(source, /alarm\?\.name === studyBackground\.ALARM/);
    assert.match(source, /compiledSettingsStillFresh\(compiledSettingsCache\[targetProfile\]\)/);
    assert.match(source, /action: 'FilterTube_StudyState'/);
    const firefox = JSON.parse(fs.readFileSync('manifest.firefox.json', 'utf8'));
    const scripts = firefox.background.scripts;
    assert.ok(scripts.indexOf('js/study_background.js') < scripts.indexOf('js/background.js'));
    assert.ok(scripts.indexOf('js/shared/study_engine.js') < scripts.indexOf('js/study_background.js'));
    assert.ok(scripts.indexOf('js/shared/study_clock_guard.js') < scripts.indexOf('js/study_background.js'));
    assert.match(source, /const activeSettings = safeObject\(studyRuleProfile\.settings\);/, 'study forces the master switch on');
});

test('a parent sets a child\'s plan and lock from this device; the child can\'t, and only that parent ends the lock', async () => {
    const h = harness({ now: at(16, 12) });
    const profiles = h.store.ftProfilesV4;
    profiles.profiles.p1.type = 'account';
    profiles.profiles.kid = { name: 'Kid', type: 'child', parentProfileId: 'p1', main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist' } };
    const plan = { days: ['mon', 'tue'], start: '16:00', end: '18:00' };
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyUpdateChild', profileId: 'kid', patch: { activePackIds: ['in_upsc_cse'], plan } }, { extensionPage: true })).ok, true);
    assert.equal(h.store.ftProfilesV4.profiles.kid.study.plan.setByParentId, 'p1', 'the parent is stamped on the plan');
    const locked = await h.controller.startParentLock('kid', { minutes: 120 });
    assert.equal(locked.ok, true);
    assert.equal(h.store.ftProfilesV4.profiles.kid.study.lock.setByParentId, 'p1');
    assert.equal(h.store.ftProfilesV4.profiles.kid.study.lock.endsAt - h.store.ftProfilesV4.profiles.kid.study.lock.startsAt, 120 * 60 * 1000);
    assert.equal((await h.controller.startParentLock('kid', { minutes: 8 * 24 * 60 })).error, 'invalid_duration', '7 days at most');
    const child = await h.controller.getChildState('kid');
    assert.equal(child.lockedUntil, h.store.ftProfilesV4.profiles.kid.study.lock.endsAt);
    // From the child's own profile, the parent controls are refused.
    h.store.ftProfilesV4.activeProfileId = 'kid';
    assert.equal((await h.controller.endParentLock('kid')).error, 'not_parent');
    assert.equal((await h.controller.update({ breakMode: 'normal' })).error, 'set_by_parent');
    h.store.ftProfilesV4.activeProfileId = 'p1';
    assert.equal((await h.controller.endParentLock('kid')).ok, true);
    assert.equal(h.store.ftProfilesV4.profiles.kid.study.lock, null);
    assert.equal((await h.controller.handleMessage({ action: 'FilterTube_StudyUpdateChild', profileId: 'kid', patch: {} }, { youtubeContent: true })).error, 'untrusted_sender');
});

test('getState names the active packs for the UI', async () => {
    const h = harness({ study: { activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'ece' } } }, now: at(16, 16, 10) });
    const state = await h.controller.getState();
    assert.equal(state.packs[0].shortName, 'GATE');
    assert.equal(state.packs[0].variant.id, 'ece');
});
