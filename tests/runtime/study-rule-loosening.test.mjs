// Review P0 #2 (STUDY_EDGE_CASES E-20 to E-24): while study holds a profile, a change that loosens its rules
// is put back, as Android AppPreferences.saveProfilesV4 refuses it (StudyRuleLoosening.loosens,
// StudyLoosening.sheet, StudyLooseningSheet). Stricter changes go through. Self Gentle and Locked
// sessions and a parent's plan are covered; the parent who set the plan may change it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Model = require('../../js/shared/study_model.js');
const Packs = require('../../js/shared/study_packs.js');
const { createStudyBackground } = require('../../js/study_background.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));

const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();
const UC = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

function baseProfile(study = {}) {
    return {
        name: 'Aarav', type: 'account',
        settings: { enabled: true, hideShorts: true, hideComments: true },
        main: { mode: 'blocklist', channels: [{ id: UC, name: 'Loud' }], keywords: [{ word: 'drama' }], blockedVideoIds: ['abcdefghijk'],
            whitelistChannels: [], allowedVideoIds: [] },
        kids: { mode: 'blocklist', blockedChannels: [], blockedKeywords: ['scary'], whitelistChannels: [], videoIds: [] },
        study: Model.createStudy({ activePackIds: ['in_upsc_cse'], focus: { roundMinutes: 50, breakMinutes: 10 },
            plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: null }, ...study })
    };
}

function harness({ study = {}, now = at(16, 16, 10), extraProfiles = {}, activeProfileId = 'p1' } = {}) {
    const store = {
        ftNanahDeviceId: 'laptop-1',
        ftProfilesV4: { schemaVersion: 4, activeProfileId, profiles: { p1: baseProfile(study), ...extraProfiles } }
    };
    const clock = { now };
    const browserAPI = {
        storage: { local: {
            get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
            set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
        } },
        alarms: { create() {}, clear() {} }
    };
    const controller = createStudyBackground({
        browserAPI, Engine, Model, Packs, now: () => clock.now,
        loadCatalog: async () => catalog,
        getSelfControlSession: async () => null,
        startLockedSession: async () => ({ ok: true }),
        writeProfile: async (profileId, profile) => { store.ftProfilesV4.profiles[profileId] = structuredClone(profile); return { ok: true }; },
        onTransition: async () => {}
    });
    return { controller, store, clock, browserAPI };
}

const edit = (profile, change) => { const next = structuredClone(profile); change(next); return next; };

const LOOSENING = {
    'removing a blocked keyword': p => { p.main.keywords = []; },
    'removing a blocked channel': p => { p.main.channels = []; },
    'removing a blocked video': p => { p.main.blockedVideoIds = []; },
    'adding an allowed channel': p => { p.main.whitelistChannels = [{ id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Fun' }]; },
    'adding an allowed video': p => { p.main.allowedVideoIds = ['zzzzzzzzzzz']; },
    'turning Hide Shorts off': p => { p.settings.hideShorts = false; },
    'turning Hide comments off': p => { p.settings.hideComments = false; },
    'turning FilterTube off': p => { p.settings.enabled = false; },
    'removing a Kids blocked word': p => { p.kids.blockedKeywords = []; },
    'adding a Kids allowed channel': p => { p.kids.whitelistChannels = [{ id: 'UCbbbbbbbbbbbbbbbbbbbbbb' }]; },
    'switching an allow list back to the block list': p => { p.main.mode = 'blocklist'; }
};

test('ruleLoosens: the app\'s list of loosening changes, and stricter ones never count', () => {
    const before = baseProfile();
    before.main.mode = 'whitelist';
    for (const [name, change] of Object.entries(LOOSENING)) {
        assert.equal(Model.ruleLoosens(before, edit(before, change)), true, name);
    }
    const stricter = edit(before, p => {
        p.main.keywords.push({ word: 'gossip' });
        p.main.channels.push({ handle: '@noisy' });
        p.kids.blockedKeywords.push('loud');
        p.settings.hideMembersOnly = true;
    });
    assert.equal(Model.ruleLoosens(before, stricter), false, 'more blocks');
    assert.equal(Model.ruleLoosens(before, edit(before, p => { p.main.keywords = [{ word: '  DRAMA ' }]; })), false, 'same word, other case');
    assert.equal(Model.ruleLoosens(before, edit(before, p => { p.main.channels[0] = { channelId: UC, name: 'Renamed' }; })), false, 'same channel id');
    const paused = edit(before, p => { p.main.channels[0].managedListPaused = true; });
    assert.equal(Model.ruleLoosens(paused, edit(paused, p => { p.main.channels = []; })), false, 'a paused row never held anything');
});

test('looseningSheetKind follows StudyLoosening.sheet', () => {
    assert.equal(Model.looseningSheetKind({ parentHolds: true, activeIsSetter: false }), 'parent');
    assert.equal(Model.looseningSheetKind({ parentHolds: true, activeIsSetter: true, lockMode: 'locked' }), null);
    assert.equal(Model.looseningSheetKind({ lockMode: 'locked' }), 'locked');
    assert.equal(Model.looseningSheetKind({ lockMode: 'gentle', running: true }), 'gentle');
    assert.equal(Model.looseningSheetKind({ lockMode: 'gentle', running: false }), null);
    assert.equal(Model.looseningSheetKind({}), null);
});

async function gentleSession() {
    const h = harness({ now: at(16, 12) });
    assert.equal((await h.controller.startSession({ minutes: 60, lock: 'gentle' })).ok, true);
    return h;
}

test('during a Gentle session every loosening change gets the Gentle sheet; a blocked word added does not', async () => {
    const h = await gentleSession();
    const current = structuredClone(h.store.ftProfilesV4);
    for (const [name, change] of Object.entries(LOOSENING)) {
        const next = structuredClone(current);
        if (name.startsWith('switching')) current.profiles.p1.main.mode = 'whitelist';
        next.profiles.p1 = edit(current.profiles.p1, change);
        const notice = await h.controller.looseningNotice(current, next);
        assert.equal(notice?.sheet, 'gentle', name);
        assert.equal(notice.profileId, 'p1');
        assert.ok(notice.endsAt > h.clock.now, 'says until when');
        current.profiles.p1.main.mode = 'blocklist';
    }
    const added = structuredClone(current);
    added.profiles.p1.main.keywords.push({ word: 'gossip' });
    assert.equal(await h.controller.looseningNotice(current, added), null, 'adding to the block list is always fine');
    // After the session nothing holds.
    h.clock.now = at(16, 13, 30);
    const loose = structuredClone(current);
    loose.profiles.p1.main.keywords = [];
    assert.equal(await h.controller.looseningNotice(current, loose), null);
});

test('under a parent\'s plan the child gets the Parent sheet with the parent\'s name; the parent may change it', async () => {
    const mum = { name: 'Mum', type: 'account', settings: {}, main: { mode: 'blocklist' }, kids: { mode: 'blocklist' } };
    const h = harness({ now: at(16, 16, 10), study: { plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' } },
        extraProfiles: { mum } });
    const current = structuredClone(h.store.ftProfilesV4);
    const next = structuredClone(current);
    next.profiles.p1.settings.hideShorts = false;
    const notice = await h.controller.looseningNotice(current, next);
    assert.equal(notice?.sheet, 'parent');
    assert.equal(notice.parentName, 'Mum');
    assert.equal(notice.parentId, 'mum');
    const asParent = { ...structuredClone(current), activeProfileId: 'mum' };
    assert.equal(await h.controller.looseningNotice(asParent, { ...next, activeProfileId: 'mum' }), null, 'the setter may loosen it');
    // Outside the plan's window nothing holds.
    h.clock.now = at(16, 19);
    assert.equal(await h.controller.looseningNotice(current, next), null);
});

test('a self plan with no session does not hold the rules (Android: no lock kind)', async () => {
    const h = harness({ now: at(16, 16, 10) });
    const current = structuredClone(h.store.ftProfilesV4);
    const next = structuredClone(current);
    next.profiles.p1.main.keywords = [];
    assert.equal(await h.controller.looseningNotice(current, next), null);
});

test('the compile keeps the held rules while study holds them, so a loose write never compiles', async () => {
    const h = await gentleSession();
    const prepared = await h.controller.prepare();
    const held = h.controller.apply('p1', h.store.ftProfilesV4.profiles.p1, prepared);
    assert.equal(held.state.phase, 'study');
    const loose = edit(h.store.ftProfilesV4.profiles.p1, p => {
        p.main.keywords = [];
        p.main.whitelistChannels = [{ id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Fun' }];
        p.settings.hideShorts = false;
    });
    const compiled = h.controller.apply('p1', loose, prepared);
    assert.ok(compiled.profile.main.keywords.some(row => row.word === 'drama'), 'the blocked word is still there');
    assert.ok(!compiled.profile.main.whitelistChannels.some(row => row.id === 'UCaaaaaaaaaaaaaaaaaaaaaa'), 'the added channel does not open');
    assert.equal(compiled.profile.settings.hideShorts, true);
    const stricter = edit(h.store.ftProfilesV4.profiles.p1, p => { p.main.keywords.push({ word: 'gossip' }); });
    const tightened = h.controller.apply('p1', stricter, prepared);
    assert.ok(tightened.profile.main.keywords.some(row => row.word === 'gossip'), 'a stricter change compiles at once');
});

test('activeHold: the mode switch and allow-list imports are refused while a session runs', async () => {
    const h = await gentleSession();
    const hold = await h.controller.activeHold();
    assert.equal(hold.sheet, 'gentle');
    assert.equal(hold.profileId, 'p1');
    const free = harness({ now: at(16, 12) });
    assert.equal(await free.controller.activeHold(), null);
});

test('startSession refuses a child and a profile under a parent\'s plan (Android startGentle parent_plan)', async () => {
    const child = harness({ now: at(16, 12) });
    child.store.ftProfilesV4.profiles.p1.type = 'child';
    assert.equal((await child.controller.startSession({ minutes: 30 })).error, 'set_by_parent');
    const planned = harness({ now: at(16, 12), study: { plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' } } });
    assert.equal((await planned.controller.startSession({ minutes: 30 })).error, 'set_by_parent');
});

// background.js: the storage change handler puts the held rules back and tells the open pages.
function loadEnforcer(h) {
    const source = fs.readFileSync('js/background.js', 'utf8');
    const match = source.match(/async function enforceStudyRuleLoosening\(change\) \{[\s\S]*?\n\}\n/);
    assert.ok(match, 'enforceStudyRuleLoosening exists');
    const sent = [];
    const context = {
        FT_PROFILES_V4_KEY: 'ftProfilesV4',
        studyBackground: h.controller,
        isValidProfilesV4: value => !!value && typeof value === 'object' && !!value.profiles,
        safeObject: value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
        cloneJsonValue: value => JSON.parse(JSON.stringify(value)),
        storageGet: keys => new Promise(resolve => h.browserAPI.storage.local.get(keys, resolve)),
        browserAPI: { storage: h.browserAPI.storage, runtime: { sendMessage(message, cb) { sent.push(message); cb?.(); }, lastError: null } },
        globalThis: { FilterTubeStudyModel: Model },
        console: { warn() {} }
    };
    vm.createContext(context);
    vm.runInContext(`${match[0]}; this.enforce = enforceStudyRuleLoosening;`, context);
    return { enforce: context.enforce, sent };
}

test('background.js puts a loosening write back and keeps a stricter one', async () => {
    const h = await gentleSession();
    const { enforce, sent } = loadEnforcer(h);
    const oldValue = structuredClone(h.store.ftProfilesV4);
    const newValue = structuredClone(oldValue);
    newValue.profiles.p1.main.keywords = [];
    newValue.profiles.p1.settings.hideShorts = false;
    newValue.profiles.p1.name = 'Aarav R';
    h.store.ftProfilesV4 = structuredClone(newValue);
    assert.equal(await enforce({ oldValue, newValue }), true);
    const back = h.store.ftProfilesV4.profiles.p1;
    assert.deepEqual(back.main.keywords, [{ word: 'drama' }]);
    assert.equal(back.settings.hideShorts, true);
    assert.equal(back.name, 'Aarav R', 'the rest of the change stays');
    assert.equal(sent[0]?.action, 'FilterTube_StudyLooseningRefused');
    assert.equal(sent[0].notice.sheet, 'gentle');
    const tighter = structuredClone(h.store.ftProfilesV4);
    tighter.profiles.p1.main.keywords.push({ word: 'gossip' });
    const prior = structuredClone(h.store.ftProfilesV4);
    h.store.ftProfilesV4 = structuredClone(tighter);
    assert.equal(await enforce({ oldValue: prior, newValue: tighter }), false);
    assert.equal(h.store.ftProfilesV4.profiles.p1.main.keywords.length, 2);
});

test('the pages show the sheet: the mode switch and the Kids and import handlers answer study_loosening', () => {
    const background = fs.readFileSync('js/background.js', 'utf8');
    assert.match(background, /enforceStudyRuleLoosening\(changes\[FT_PROFILES_V4_KEY\]\)/);
    assert.ok((background.match(/await studyLooseningRefusal\(\)|studyLooseningRefusal\(\)\.then/g) || []).length >= 4);
    const ui = fs.readFileSync('js/study_ui.js', 'utf8');
    assert.match(ui, /FilterTube_StudyLooseningRefused/);
    for (const file of ['js/popup.js', 'js/tab-view.js']) {
        assert.match(fs.readFileSync(file, 'utf8'), /resp\?\.error === 'study_loosening'/, file);
    }
});
