// Android StudySessionModelsTest and StudyRuntimeTest (Ports Android 6c3f9f0d5: Skip break with Undo).
// Skip break says what it costs ("+10 min to round 2"); after it the screen keeps "Break skipped. Round 2
// is now 70 min." with Undo for 5 seconds, and Undo puts that break back.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Model = require('../../js/shared/study_model.js');
const Packs = require('../../js/shared/study_packs.js');
const { createStudyBackground } = require('../../js/study_background.js');
const { createStudyOverlay, OVERLAY_ID } = require('../../js/content/study_overlay.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));

const at = (day, hour, minute = 0, second = 0) => new Date(2026, 10, day, hour, minute, second).getTime();
const m = 60_000;

function harness({ study = {}, now = at(16, 12), deps = {} } = {}) {
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
        onTransition: async reason => { transitions.push(reason); },
        ...deps
    });
    return { controller, store, alarms, transitions, clock, profile: () => store.ftProfilesV4.profiles.p1 };
}


// GATE CSE in the app's test: 4 rounds of 40, 3 breaks of 5 = 175 min.
const plan = [
    { kind: 'STUDY', start: 0, end: 40 * m, round: 1 }, { kind: 'BREAK', start: 40 * m, end: 45 * m, round: 1 },
    { kind: 'STUDY', start: 45 * m, end: 85 * m, round: 2 }, { kind: 'BREAK', start: 85 * m, end: 90 * m, round: 2 },
    { kind: 'STUDY', start: 90 * m, end: 130 * m, round: 3 }, { kind: 'BREAK', start: 130 * m, end: 135 * m, round: 3 },
    { kind: 'STUDY', start: 135 * m, end: 175 * m, round: 4 }
];

test('the preview: the break joins the round after it; the last break joins the round before', () => {
    assert.deepEqual({ ...Engine.breakSkipPreview(plan, 85 * m) }, { breakStart: 85 * m, breakEnd: 90 * m, addedMinutes: 5, round: 3, roundMinutes: 45 });
    const tail = [{ kind: 'STUDY', start: 0, end: 40 * m, round: 1 }, { kind: 'BREAK', start: 40 * m, end: 50 * m, round: 1 }];
    assert.deepEqual({ ...Engine.breakSkipPreview(tail, 40 * m) }, { breakStart: 40 * m, breakEnd: 50 * m, addedMinutes: 10, round: 1, roundMinutes: 50 });
    assert.equal(Engine.breakSkipPreview(tail, 99), null);
    assert.equal(Engine.SKIP_UNDO_MS, 5000);
});

test('the background offers the preview, skips, and Undo puts that break back once', async () => {
    const h = harness({ now: at(16, 16, 55) });
    const before = await h.controller.getState();
    assert.equal(before.state, 'BREAK');
    assert.deepEqual({ ...before.skipPreview }, { breakStart: at(16, 16, 50), breakEnd: at(16, 17, 0), addedMinutes: 10, round: 2, roundMinutes: 70 });
    assert.equal((await h.controller.skipBreak()).ok, true);
    const skipped = await h.controller.getState();
    assert.equal(skipped.breakSkipped, true);
    assert.equal(skipped.skipPreview, null, 'nothing more to skip');
    assert.equal((await h.controller.undoSkipBreak({ until: at(16, 17, 5) })).error, 'not_skipped', 'another break');
    assert.equal((await h.controller.undoSkipBreak({ until: at(16, 17, 0) })).ok, true);
    const back = await h.controller.getState();
    assert.equal(back.breakSkipped, false);
    assert.equal(back.state, 'BREAK');
    assert.equal((await h.controller.undoSkipBreak({ until: at(16, 17, 0) })).error, 'not_skipped', 'nothing left to undo');
    assert.ok(h.transitions.includes('undo_skip_break'));
    // Over: a break whose time has passed can't come back.
    await h.controller.skipBreak();
    h.clock.now = at(16, 17, 0, 1);
    assert.equal((await h.controller.undoSkipBreak({ until: at(16, 17, 0) })).error, 'not_skipped');
    // A parent's plan offers no preview.
    const parent = harness({ study: { plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' } }, now: at(16, 16, 55) });
    assert.equal((await parent.controller.getState()).skipPreview, null);
    const message = await h.controller.handleMessage({ action: 'FilterTube_StudyUndoSkipBreak', until: 1 }, { url: 'https://example.org/' });
    assert.equal(message.error, 'untrusted_sender');
});

function overlayHarness(start) {
    const nodes = new Map();
    const make = tag => ({
        tag, id: '', style: {}, dataset: {}, children: [], attributes: {}, textContent: '', type: '', handlers: {}, src: '',
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); return child; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        remove() { nodes.delete(this.id); }
    });
    const video = { paused: true, ended: false, readyState: 4, pause() { this.paused = true; } };
    const doc = { body: make('body'), visibilityState: 'visible', createElement: make, getElementById: id => nodes.get(id) || null,
        querySelectorAll: selector => (selector === 'video' ? [video] : []), addEventListener() {} };
    const timers = [];
    const sent = [];
    const clock = { now: start };
    let response = null;
    const overlay = createStudyOverlay({
        window: { addEventListener() {} }, document: doc,
        runtime: { getURL: path => `ext://${path}`, sendMessage: async message => { sent.push(message); return message.action === 'FilterTube_StudyGetState' ? response : { ok: true }; }, onMessage: { addListener() {} } },
        now: () => clock.now, setTimeout: (fn, ms) => { timers.push({ fn, at: clock.now + ms }); return timers.length; }, clearTimeout: () => {}, setInterval: () => 0
    });
    const text = node => JSON.stringify(node, (key, value) => (key === 'handlers' ? undefined : value));
    const fire = until => { for (const timer of timers.splice(0)) { if (timer.at <= until) timer.fn(); else timers.push(timer); } };
    return { overlay, nodes, sent, clock, timers, text, fire, setResponse: next => { response = next; } };
}

const restState = (extra = {}) => ({ ok: true, state: 'BREAK', breakMode: 'rest', until: 1_600_000, canSkipBreak: true, breakSkipped: false,
    skipPreview: { breakStart: 1_000_000, breakEnd: 1_600_000, addedMinutes: 10, round: 2, roundMinutes: 70 }, ...extra });

test('the break screen: the cost under Skip break, then 5 seconds of "Break skipped" with Undo', async () => {
    const h = overlayHarness(1_000_000);
    h.overlay.setState(restState());
    const box = h.nodes.get(OVERLAY_ID);
    const cost = box.children.find(child => child.dataset.role === 'skip-cost');
    assert.equal(cost.textContent, '+10 min to round 2');
    box.children.find(child => child.dataset.action === 'skip-break').handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(h.sent.some(message => message.action === 'FilterTube_StudySkipBreak'));
    const shown = h.nodes.get(OVERLAY_ID);
    assert.ok(shown, 'the screen stays for Undo');
    const toast = shown.children.find(child => child.dataset.role === 'skip-undo');
    assert.ok(h.text(toast).includes('Break skipped. Round 2 is now 70 min.'));
    // A state push in the meantime doesn't close it early.
    h.overlay.setState(restState({ breakSkipped: true, skipPreview: null }));
    assert.ok(h.nodes.get(OVERLAY_ID));
    h.clock.now += 5000;
    h.fire(h.clock.now);
    assert.equal(h.nodes.get(OVERLAY_ID), undefined, 'closed after 5 s');
});

test('Undo sends the break back and the break screen returns', async () => {
    const h = overlayHarness(1_000_000);
    h.overlay.setState(restState());
    h.nodes.get(OVERLAY_ID).children.find(child => child.dataset.action === 'skip-break').handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    h.setResponse(restState());
    const toast = h.nodes.get(OVERLAY_ID).children.find(child => child.dataset.role === 'skip-undo');
    toast.children.find(child => child.dataset.action === 'undo-skip-break').handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(h.sent.some(message => message.action === 'FilterTube_StudyUndoSkipBreak' && message.until === 1_600_000));
    const again = h.nodes.get(OVERLAY_ID);
    assert.ok(again.children.some(child => child.dataset.action === 'skip-break'), 'the break is back with Skip break');
    h.clock.now += 5000;
    h.fire(h.clock.now);
    assert.ok(h.nodes.get(OVERLAY_ID), 'the old timer no longer closes it');
});

test('the two new lines are in every catalog with both placeholders', () => {
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${name}`, 'utf8'));
        for (const key of ['study.overlay.skipCost', 'study.overlay.breakSkipped']) {
            assert.match(catalog[key] || '', /\{minutes\}/, `${name} ${key}`);
            assert.match(catalog[key] || '', /\{round\}/, `${name} ${key}`);
        }
    }
});

// Review P0 #1 (STUDY_EDGE_CASES E-10): a skipped break is study time, as Android StudyClock.withSkips
// folds it. The allow list stays on, the minutes are credited, and Undo brings the break back.
test('a skipped rest break keeps the study rules on and credits the time', async () => {
    const h = harness({ now: at(16, 16, 55) });
    const prepared = async () => h.controller.prepare();
    const onBreak = h.controller.apply('p1', h.profile(), await prepared());
    assert.equal(onBreak.state.phase, 'rest', 'a rest break hides everything');
    assert.equal((await h.controller.skipBreak()).ok, true);
    const skipped = await h.controller.getState();
    assert.equal(skipped.state, 'STUDY', 'the round runs through the skipped break');
    assert.equal(skipped.round, 2);
    assert.equal(skipped.until, at(16, 18, 0), 'round 2 runs to its own end');
    assert.equal(skipped.phase, 'study');
    assert.deepEqual({ ...skipped.skippedBreak }, { start: at(16, 16, 50), end: at(16, 17, 0) });
    const applied = h.controller.apply('p1', h.profile(), await prepared());
    assert.equal(applied.applied, true);
    assert.equal(applied.state.phase, 'study', 'never the normal rules');
    assert.equal(applied.profile.main.mode, 'whitelist');
    assert.ok(applied.profile.main.whitelistChannels.length > 0, 'the pack channels stay allowed');
    h.clock.now = at(16, 16, 56);
    const credit = await h.controller.tick({ seconds: 60 });
    assert.equal(credit.ok, true);
    assert.ok(credit.credited > 0, 'the skipped break counts as study');
    assert.equal((await h.controller.undoSkipBreak({ until: at(16, 17, 0) })).ok, true);
    const back = h.controller.apply('p1', h.profile(), await prepared());
    assert.equal(back.state.phase, 'rest', 'Undo: the break is a break again');
});

test('the skipped break start is kept per profile and an old runtime field is read as that break', async () => {
    const h = harness({ now: at(16, 16, 55) });
    await h.controller.skipBreak();
    const local = h.store.ftStudyRuntimeV1.profiles.p1;
    assert.deepEqual(local.skippedBreaks, [at(16, 16, 50)]);
    assert.equal(local.breakSkippedUntil, null);
    // An older runtime kept only the end of the skipped break.
    local.skippedBreaks = [];
    local.breakSkippedUntil = at(16, 17, 0);
    assert.equal((await h.controller.getState()).state, 'STUDY');
});

test('only the clock folds a skip: a BREAK state is rest whatever flag it carries', () => {
    assert.equal(Engine.studyPhase({ state: 'BREAK', breakMode: 'rest', breakSkipped: true }), 'rest');
    const clock = Engine.studyClock({ plan: { days: ['mon'], start: '16:00', end: '18:00' }, focus: { roundMinutes: 50, breakMinutes: 10 },
        now: at(16, 16, 55), skippedBreaks: [at(16, 16, 50)] });
    assert.equal(clock.state, 'STUDY');
    assert.equal(clock.breakSkipped, true);
    assert.equal(Engine.studyPhase(clock), 'study');
});
