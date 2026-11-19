// Study parity with the Android app (feature/android-3.6.2-study: StudyPackCatalogTest,
// StudyHomeFeedTest, StudyKidsSpaceTest):
// - a branch gets its own channels plus the pack channels no branch claims, and its own topics;
// - for packs with separate branches, a title that names only another branch's topics is hidden
//   (one title-only block row, so feeds, search and the Watch gate agree);
// - only Kids packs drive the Kids site during study; exam and class packs hold it, and its pages
//   show Kriti's study-time card with the countdown to the break.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Packs = require('../../js/shared/study_packs.js');
const Model = require('../../js/shared/study_model.js');
const { createStudyBackground } = require('../../js/study_background.js');
const { createStudyOverlay, OVERLAY_ID, KRITI_READING, countdown } = require('../../js/content/study_overlay.js');
const bundled = JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8'));
const catalog = Packs.parseCatalog(bundled);
const pack = id => Packs.packById(catalog, id);
const key = value => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
const handle = value => String(value || '').trim().replace(/^@/, '').toLowerCase();
const studying = { state: Engine.STUDY, breakMode: 'rest' };

function profile(activePackIds, packEdits = {}) {
    return {
        name: 'Aarav',
        main: { mode: 'blocklist', channels: [], keywords: [{ word: 'drama' }], whitelistChannels: [] },
        kids: { mode: 'blocklist', blockedKeywords: [{ word: 'scary' }], whitelistChannels: [] },
        study: Model.createStudy({ activePackIds, packEdits })
    };
}

/** The filter for these packs and edits, as studyEffectiveProfile builds it. */
function branchFilter(edits) {
    return Engine.studyBranchFilter(Object.keys(edits).map(pack), edits);
}

// ---- Catalog -------------------------------------------------------------------------------------

test('the catalog carries variantsShareTopics, the 2026-11-16 and 2026-11-20 packs and the Kids age packs', () => {
    assert.equal(bundled.draftGenerated, '2026-11-20');
    assert.equal(bundled.packs.find(item => item.id === 'in_jee').variantsShareTopics, true);
    assert.deepEqual(bundled.packs.filter(item => item.variantsShareTopics !== undefined).map(item => item.id), ['in_jee', 'interview_finance']);
    assert.equal(pack('in_jee').variantsShareTopics, true, 'the loader reads it');
    assert.equal(pack('in_gate').variantsShareTopics, false);
    for (const id of ['pk_ecat', 'bd_medical_admission', 'bd_engineering_admission', 'tr_lgs', 'cls_tr_lise_9_12', 'br_concursos', 'br_oab',
        'cls_br_ensino_medio_10_12', 'es_oposiciones', 'cls_es_eso_bachillerato_7_12', 'fr_brevet', 'cls_fr_lycee_10_12', 'mx_comipems',
        'jp_koukou_juken', 'cls_kr_godeung_10_12', 'cls_vn_thpt_10_12', 'cls_th_m4_6', 'cls_id_sma_10_12', 'cls_eg_secondary_10_12',
        'cls_sa_secondary_10_12', 'cls_ae_moe_9_12', 'cls_de_gymnasium_11_13', 'cls_gb_scotland_s4_s6', 'cls_lk_gce_ol_10_11', 'cls_np_neb_11_12']) {
        assert.ok(pack(id), id);
    }
    assert.deepEqual(Packs.kidsPacks(catalog).map(item => item.id),
        ['kids_age_2_4', 'kids_age_5_7', 'kids_age_8_12', 'classic_1980s', 'classic_1990s', 'classic_2000s']);
    assert.deepEqual(Packs.forTab(catalog, 'IN', 'kids').map(item => item.id), ['kids_age_2_4', 'kids_age_5_7', 'kids_age_8_12'],
        'the picker offers Kids learning by age; the classic decades are not study');
});

/*
 * Channels no branch claims stay for every branch, so a branch-specific one there leaks into the
 * others ("Jenny's Lectures CS IT" in GATE Civil). Each must be claimed by its branches, or be on
 * this list of channels that teach every branch alike (the same list as Android StudyPackCatalogTest).
 */
const crossBranchChannels = {
    in_gate: ['iit', 'mitocw', 'iesmaster01', 'ekeeda'],
    in_jee: ['physicswallah', 'pw-jeewallah', 'jeenexus', 'vedantumath', 'allenjee', 'jeeataakash', 'motionkotajee', 'esaral',
        'class12th-jee', 'mohitgoenka99', 'khanacademy', 'theorganicchemistrytutor', 'ncertofficial'],
    lk_gce_al: ['ethaksalawa-official', 'dpeducationalsubjects', 'dpeducationaltamil'],
    cls_in_cbse_11_12: ['ncertofficial'],
    cls_pk_fsc_11_12: ['youthacademy-11th'],
    cls_bd_hsc_11_12: ['hscictclass', 'easyictschool1858'],
    cls_eg_secondary_10_12: ['madrasetnasecondary', 'elkheta-senior11', 'elkheta-seniors', 'mr.mohamed_tarek'],
    // Every finance interview channel belongs to a track (Wall Street Prep to two).
    interview_finance: []
};

test('every channel of a pack with branches is claimed by a branch or teaches every branch', () => {
    const branched = catalog.packs.filter(item => item.variants.length > 1);
    assert.deepEqual(branched.map(item => item.id).sort(), Object.keys(crossBranchChannels).sort());
    for (const item of branched) {
        const claimed = new Set(item.variants.flatMap(variant => variant.channels).map(handle));
        const cross = crossBranchChannels[item.id];
        for (const channel of item.channels) {
            const keys = [channel.handle, channel.channelId].filter(Boolean).map(handle);
            assert.ok(keys.some(value => claimed.has(value) || cross.includes(value)), `${item.id}: ${channel.name} is in no branch and not cross-branch`);
        }
        // The list names only channels the pack still has, and none a branch claims.
        const present = new Set(item.channels.flatMap(channel => [channel.handle, channel.channelId]).filter(Boolean).map(handle));
        for (const value of cross) assert.ok(present.has(value) && !claimed.has(value), `${item.id}: ${value}`);
    }
});

test('a branch studies its own channels plus the unclaimed ones, and its own topics', () => {
    const gate = pack('in_gate');
    const handles = variant => new Set(Engine.packChannelsFor(gate, variant).map(channel => handle(channel.handle)));
    assert.ok(handles('cse').has('jennyslecturescsit'), "Jenny's Lectures CS IT belongs to GATE CSE");
    assert.equal(handles('civil').has('jennyslecturescsit'), false);
    for (const variant of ['cse', 'civil']) for (const shared of ['iit', 'mitocw']) assert.ok(handles(variant).has(shared), `${variant} keeps ${shared}`);
    const fsc = pack('cls_pk_fsc_11_12');
    const fscHandles = variant => new Set(Engine.packChannelsFor(fsc, variant).map(channel => handle(channel.handle)));
    assert.ok(fscHandles('ics').has('pgclectures-federalboard9519'));
    assert.equal(fscHandles('pre_medical').has('pgclectures-federalboard9519'), false);
    const plain = pack('in_upsc_cse');
    assert.deepEqual(Engine.packChannelsFor(plain, null), plain.channels, 'a pack without branches keeps every channel');
    // Topics a branch owns leave the other branches ("operating system" is CSE's, "geotechnical" Civil's).
    const topics = variant => new Set(Engine.packTopicsFor(gate, variant).map(key));
    assert.ok(topics('cse').has('operating system') && !topics('civil').has('operating system'));
    assert.ok(topics('civil').has('geotechnical') && !topics('cse').has('geotechnical'));
    for (const variant of ['cse', 'civil']) assert.ok(topics(variant).has('engineering mathematics') && topics(variant).has('previous year questions'));
    // The effective rules use them: GATE Civil allows no CSE channel and no CSE topic.
    const { profile: effective } = Engine.studyEffectiveProfile(profile(['in_gate'], { in_gate: { variant: 'civil' } }), { catalog, clock: studying });
    assert.equal(effective.main.whitelistChannels.some(row => handle(row.handle) === 'jennyslecturescsit'), false);
    assert.ok(effective.main.whitelistChannels.some(row => handle(row.handle) === 'madeeasyeducation'));
    assert.equal(effective.main.whitelistChannels.length, Engine.packChannelsFor(gate, 'civil').length);
    const allow = effective.main.whitelistKeywords.map(row => key(row.word));
    assert.equal(allow.includes('dbms') || allow.includes('operating system'), false);
    assert.ok(allow.includes('geotechnical'));
});

test('branch topics name the branch; other-branch topics skip shared and ambiguous words', () => {
    const gate = pack('in_gate');
    assert.equal(Engine.hasSeparateBranches(gate), true);
    const civilOwn = new Set(Engine.branchTopics(gate, 'civil').map(key));
    assert.ok(!civilOwn.has('strength of materials') && civilOwn.has('solid mechanics') && civilOwn.has('gate civil'));
    for (const shared of ['engineering maths', 'aptitude', 'previous year questions']) assert.equal(civilOwn.has(shared), false, shared);
    const other = new Set(Engine.otherBranchTopics(gate, 'civil').map(key));
    for (const topic of ['gate cse', 'dbms', 'data structures', 'cse', 'ece', 'power electronics', 'gate ee', 'gate me']) assert.ok(other.has(topic), topic);
    // Short or ambiguous words never hide a video; topics Civil shares with ME stay Civil's.
    for (const topic of ['ee', 'me', 'toc', 'som', 'tom', 'networks', 'manufacturing', 'logic', 'fluid mechanics', 'engineering mechanics',
        'engineering maths', 'aptitude']) assert.equal(other.has(topic), false, topic);
    // JEE Main and Advanced are one syllabus; packs without branches have none.
    const jee = pack('in_jee');
    assert.ok(jee.variantsShareTopics && !Engine.hasSeparateBranches(jee));
    assert.deepEqual(Engine.otherBranchTopics(jee, 'main'), []);
    assert.deepEqual(Engine.otherBranchTopics(catalog.packs.find(item => item.variants.length === 0), null), []);
});

// ---- Other branches' uploads -------------------------------------------------------------------

test("GATE Civil drops another branch's lectures from a multi-branch channel and keeps its own and shared ones", () => {
    const civil = branchFilter({ in_gate: { variant: 'civil' } });
    assert.ok(civil);
    const drops = title => Engine.branchFilterDrops(civil, title);
    assert.ok(drops('GATE CSE DBMS lecture | MADE EASY'));
    assert.ok(drops('Data Structures in one shot | GATE 2027'));
    assert.ok(drops('ECE: Analog Circuits marathon'));
    assert.ok(drops('Power Electronics | GATE EE | ACE Academy'));
    assert.equal(drops('GATE Civil Strength of Materials | MADE EASY'), false);
    assert.equal(drops('Engineering Mathematics | GATE 2027 | MADE EASY'), false);
    assert.equal(drops('General Aptitude for GATE: previous year questions'), false);
    assert.equal(drops('Soil Mechanics vs Thermodynamics? GATE Civil doubts'), false);
    // "me" and "ee" alone are everyday words, not branches.
    assert.equal(drops('Let me explain surveying for GATE'), false);
    assert.equal(drops(''), false);
    const kept = ['GATE CSE DBMS lecture', 'GATE Civil Strength of Materials', 'Engineering Mathematics'].filter(title => !drops(title));
    assert.deepEqual(kept, ['GATE Civil Strength of Materials', 'Engineering Mathematics']);
});

test('GATE CSE keeps its own lectures, and a topic the user added stays', () => {
    const cse = branchFilter({ in_gate: { variant: 'cse' } });
    assert.equal(Engine.branchFilterDrops(cse, 'GATE CSE DBMS lecture | MADE EASY'), false);
    assert.equal(Engine.branchFilterDrops(cse, 'Computer Networks full course'), false);
    assert.ok(Engine.branchFilterDrops(cse, 'GATE Civil Strength of Materials'));
    const added = branchFilter({ in_gate: { variant: 'civil', topicsAdded: ['dbms'] } });
    assert.equal(Engine.branchFilterDrops(added, 'GATE CSE DBMS lecture'), false);
});

test("packs without branches, and JEE's levels, hide nothing", () => {
    assert.equal(branchFilter({ in_jee: { variant: 'advanced' } }), null);
    assert.equal(Engine.branchFilterDrops(null, 'JEE Main 2026 NTA mock test'), false);
    assert.equal(branchFilter({ in_upsc_cse: {} }), null);
    const jee = Engine.studyEffectiveProfile(profile(['in_jee'], { in_jee: { variant: 'advanced' } }), { catalog, clock: studying });
    assert.equal(jee.branchFilter, null);
    assert.equal(jee.profile.main.keywords.some(row => row.source === Engine.BRANCH_SOURCE), false);
    // GATE Civil with JEE: JEE's topics count as studied too.
    const both = branchFilter({ in_gate: { variant: 'civil' }, in_jee: {} });
    assert.equal(Engine.branchFilterDrops(both, 'Thermodynamics | GATE ME'), false);
    assert.ok(Engine.branchFilterDrops(both, 'GATE CSE DBMS lecture'));
});

test('the filter is one title-only block row that matches exactly the dropped titles', () => {
    const { profile: effective, branchFilter: filter } = Engine.studyEffectiveProfile(
        profile(['in_gate'], { in_gate: { variant: 'civil' } }), { catalog, clock: studying });
    const rows = effective.main.keywords.filter(row => row.source === Engine.BRANCH_SOURCE);
    assert.equal(rows.length, 1);
    const [row] = rows;
    assert.deepEqual({ matchMode: row.matchMode, regexFlags: row.regexFlags, titleOnly: row.titleOnly, comments: row.comments },
        { matchMode: 'regex', regexFlags: 'iu', titleOnly: true, comments: false });
    assert.ok(effective.main.keywords.some(item => item.word === 'drama'), 'the block list stays');
    const pattern = new RegExp(row.word, row.regexFlags);
    for (const title of ['GATE CSE DBMS lecture | MADE EASY', 'Data Structures in one shot | GATE 2027', 'ECE: Analog Circuits marathon',
        'GATE Civil Strength of Materials | MADE EASY', 'Engineering Mathematics | GATE 2027', 'Soil Mechanics vs Thermodynamics? GATE Civil doubts',
        'Let me explain surveying for GATE', 'gate cse\nsoil mechanics gate civil', '']) {
        assert.equal(pattern.test(title), Engine.branchFilterDrops(filter, title), title);
    }
    assert.equal(Engine.branchFilterRow(null), null);
    // The rest break and the limit need no row: nothing is allowed there.
    const rest = Engine.studyEffectiveProfile(profile(['in_gate'], { in_gate: { variant: 'civil' } }), { catalog, clock: { state: Engine.LIMIT } });
    assert.equal(rest.profile.main.keywords.some(item => item.source === Engine.BRANCH_SOURCE), false);
});

test("the JSON filter hides another branch's lecture from an allowed multi-branch channel", () => {
    const { profile: effective } = Engine.studyEffectiveProfile(profile(['in_gate'], { in_gate: { variant: 'civil' } }), { catalog, clock: studying });
    const row = effective.main.keywords.find(item => item.source === Engine.BRANCH_SOURCE);
    const madeEasy = effective.main.whitelistChannels.find(item => handle(item.handle) === 'madeeasyeducation');
    // As the background compiles a regex row (compileKeywordEntries): the word is the pattern.
    const settings = {
        enabled: true, listMode: 'whitelist', listLayered: true, channelMap: {}, videoChannelMap: {},
        whitelistChannels: [{ id: madeEasy.id, name: madeEasy.name, handle: null }], whitelistKeywords: [],
        filterChannels: [], filterKeywords: [{ pattern: row.word, flags: row.regexFlags, titleOnly: true }],
        blockedVideoIds: [], allowedVideoIds: []
    };
    const card = (videoId, title, description = '') => {
        const run = { text: 'MADE EASY', navigationEndpoint: { browseEndpoint: { browseId: madeEasy.id, canonicalBaseUrl: '/@MADEEASYEducation' } } };
        return { videoRenderer: { videoId, title: { runs: [{ text: title }] }, ownerText: { runs: [run] }, shortBylineText: { runs: [run] },
            longBylineText: { runs: [run] }, descriptionSnippet: { runs: [{ text: description }] } } };
    };
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData({ contents: [
        card('AAAAAAAAAAA', 'GATE CSE DBMS lecture'),
        card('BBBBBBBBBBB', 'GATE Civil Strength of Materials'),
        card('CCCCCCCCCCC', 'Engineering Mathematics'),
        card('DDDDDDDDDDD', 'Surveying marathon', 'also see our GATE CSE DBMS playlist')
    ] }, settings, 'study-branch-filter');
    assert.deepEqual(JSON.parse(JSON.stringify(result.contents.map(item => item.videoRenderer.videoId))),
        ['BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD'], 'only the title decides');
});

// ---- Kids during study ---------------------------------------------------------------------------

test('Kids source decision: only Kids packs drive Kids; exam and class packs hold it', () => {
    const S = Engine.KIDS_SPACE;
    assert.equal(Engine.studyKidsSpace('study', ['in_gate'], catalog), S.STUDY_TIME);
    assert.equal(Engine.studyKidsSpace('study', ['cls_in_cbse_6_8'], catalog), S.STUDY_TIME);
    assert.equal(Engine.studyKidsSpace('study', ['kids_age_5_7'], catalog), S.LEARNING);
    assert.equal(Engine.studyKidsSpace('study', ['in_gate', 'classic_1990s'], catalog), S.LEARNING);
    assert.equal(Engine.studyKidsSpace('study', [], catalog), S.STUDY_TIME);
    // Unknown packs (or no catalog) are not Kids packs.
    assert.equal(Engine.studyKidsSpace('study', ['kids_age_5_7'], null), S.STUDY_TIME);
    assert.equal(Engine.studyKidsSpace('study', ['kids_age_99'], catalog), S.STUDY_TIME);
    // Outside a round Kids is untouched: the break, the limit and normal time have their own rules.
    for (const phase of ['normal', 'rest']) assert.equal(Engine.studyKidsSpace(phase, ['kids_age_5_7'], catalog), S.UNTOUCHED);
    assert.deepEqual(Engine.kidsPackIds(['in_gate', 'kids_age_8_12', 'in_jee', 'classic_1980s'], catalog), ['kids_age_8_12', 'classic_1980s']);
    assert.equal(Engine.kidsSetupNote([], catalog), null);
    assert.equal(Engine.kidsSetupNote(['in_gate'], catalog), 'kids_hold');
    assert.equal(Engine.kidsSetupNote(['in_gate', 'kids_age_2_4'], catalog), 'kids_learning');
});

test('the effective rules: an exam round empties Kids, a Kids pack fills Kids with its own channels only', () => {
    const exam = Engine.studyEffectiveProfile(profile(['in_gate'], { in_gate: { variant: 'civil' } }), { catalog, clock: studying });
    assert.equal(exam.kidsSpace, 'study_time');
    assert.equal(exam.profile.kids.mode, 'whitelist');
    assert.deepEqual(exam.profile.kids.whitelistChannels, []);
    assert.deepEqual(exam.profile.kids.whitelistKeywords, []);
    assert.deepEqual(exam.profile.kids.blockedKeywords.map(row => row.word), ['scary']);
    assert.ok(exam.profile.main.whitelistChannels.length > 0, 'Main still studies');

    const mixed = Engine.studyEffectiveProfile(profile(['in_gate', 'kids_age_5_7'], { in_gate: { variant: 'civil' } }), { catalog, clock: studying });
    assert.equal(mixed.kidsSpace, 'learning');
    assert.deepEqual(mixed.packIds, ['in_gate', 'kids_age_5_7']);
    const kidsPack = pack('kids_age_5_7');
    assert.equal(mixed.profile.kids.whitelistChannels.length, kidsPack.channels.length);
    assert.ok(mixed.profile.kids.whitelistChannels.every(row => row.managedListId === 'study:kids_age_5_7'), 'GATE never reaches Kids');
    assert.ok(mixed.profile.kids.whitelistKeywords.every(row => row.managedListId === 'study:kids_age_5_7'));
    assert.equal(mixed.profile.kids.blockedKeywords.some(row => row.source === Engine.BRANCH_SOURCE), false);
    assert.ok(mixed.profile.main.whitelistChannels.some(row => row.managedListId === 'study:in_gate'));
    assert.ok(mixed.profile.main.keywords.some(row => row.source === Engine.BRANCH_SOURCE), 'Main keeps the branch filter');

    for (const clock of [{ state: Engine.NORMAL }, { state: Engine.BREAK, breakMode: 'rest' }, { state: Engine.BREAK, breakMode: 'normal' }, { state: Engine.LIMIT }]) {
        assert.equal(Engine.studyEffectiveProfile(profile(['in_gate']), { catalog, clock }).kidsSpace, 'untouched', clock.state);
    }
    // A round with no known pack and only the person's own allowed channels: Kids holds.
    const own = profile(['gone_pack']);
    own.main.whitelistChannels = [{ id: 'UC1111111111111111111111', name: 'Mine' }];
    own.main.mode = 'whitelist';
    const failClosed = Engine.studyEffectiveProfile(own, { catalog, clock: studying });
    assert.equal(failClosed.failClosed, true);
    assert.equal(failClosed.kidsSpace, 'study_time');
    assert.deepEqual(failClosed.profile.kids.whitelistChannels, []);
});

test('Kids opens again at the next break, or at the end of the last round', () => {
    assert.deepEqual(Engine.kidsOpensAt({ state: Engine.STUDY, until: 1000, sessionEnd: 9000, next: { state: Engine.BREAK, at: 1000 } }), { at: 1000, atBreak: true });
    assert.deepEqual(Engine.kidsOpensAt({ state: Engine.STUDY, until: 9000, sessionEnd: 9000, next: { state: Engine.NORMAL, at: 9000 } }), { at: 9000, atBreak: false });
    assert.equal(Engine.kidsOpensAt({ state: Engine.BREAK, until: 1000 }), null);
    assert.equal(Engine.kidsOpensAt({ state: Engine.NORMAL }), null);
});

const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute, 0).getTime();

function background(activePackIds, now) {
    const store = {
        ftNanahDeviceId: 'laptop-1',
        ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: {
            ...profile(activePackIds), type: 'account',
            study: Model.createStudy({ activePackIds, focus: { roundMinutes: 50, breakMinutes: 10 },
                plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: null } })
        } } }
    };
    const browserAPI = { storage: { local: {
        get(keys, cb) { const out = {}; for (const name of [].concat(keys)) if (name in store) out[name] = structuredClone(store[name]); cb(out); },
        set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
    } }, alarms: { create() {}, clear() {} } };
    const controller = createStudyBackground({ browserAPI, Engine, Model, Packs, now: () => now, loadCatalog: async () => catalog,
        getSelfControlSession: async () => null, writeProfile: async () => ({ ok: true }), onTransition: async () => {} });
    return { controller, profile: store.ftProfilesV4.profiles.p1 };
}

test('the study state tells pages what Kids does, and when Kids opens again', async () => {
    // Monday 16 November 2026, 16:10: round 1 of 2 (16:00-16:50, break to 17:00, 17:00-18:00).
    const first = background(['in_upsc_cse'], at(16, 16, 10));
    const round1 = first.controller.apply('p1', first.profile, await first.controller.prepare()).state;
    assert.equal(round1.state, 'STUDY');
    assert.equal(round1.kidsSpace, 'study_time');
    assert.equal(round1.kidsOpensAt, at(16, 16, 50));
    assert.equal(round1.kidsOpensAtBreak, true);
    const last = background(['in_upsc_cse'], at(16, 17, 30));
    const round2 = last.controller.apply('p1', last.profile, await last.controller.prepare()).state;
    assert.equal(round2.kidsSpace, 'study_time');
    assert.equal(round2.kidsOpensAt, at(16, 18));
    assert.equal(round2.kidsOpensAtBreak, false);
    const rest = background(['in_upsc_cse'], at(16, 16, 55));
    const onBreak = rest.controller.apply('p1', rest.profile, await rest.controller.prepare()).state;
    assert.equal(onBreak.kidsSpace, 'untouched');
    assert.equal(onBreak.kidsOpensAt, null);
    const kids = background(['kids_age_5_7'], at(16, 16, 10));
    const learning = kids.controller.apply('p1', kids.profile, await kids.controller.prepare()).state;
    assert.equal(learning.kidsSpace, 'learning');
    assert.equal(learning.kidsOpensAt, null);
    const state = await kids.controller.getState();
    assert.equal(state.kidsSpace, 'learning');
});

// ---- Kriti's study-time card on Kids pages ------------------------------------------------------

function overlayHarness({ hostname = 'www.youtubekids.com', companion = 'quiet', start = 1_000_000 } = {}) {
    const nodes = new Map();
    const make = tag => ({
        tag, id: '', style: {}, dataset: {}, children: [], attributes: {}, textContent: '', src: '', alt: '',
        setAttribute(name, value) { this.attributes[name] = value; },
        appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); return child; },
        addEventListener() {},
        remove() { nodes.delete(this.id); }
    });
    const video = { paused: false, ended: false, readyState: 4, pause() { this.paused = true; } };
    const doc = { body: make('body'), visibilityState: 'visible', createElement: make, getElementById: id => nodes.get(id) || null,
        querySelectorAll: selector => (selector === 'video' ? [video] : []), querySelector: () => null, addEventListener() {} };
    const clock = { now: start };
    const repeats = [];
    const overlay = createStudyOverlay({
        window: { addEventListener() {}, location: { hostname, pathname: '/' } },
        document: doc,
        runtime: { sendMessage: async () => ({ ok: true, state: 'NORMAL' }), onMessage: { addListener() {} },
            getURL: path => `chrome-extension://filtertube/${path}` },
        storage: { get: async () => ({ ftCompanionMode: companion }) },
        now: () => clock.now,
        setTimeout: () => 0, clearTimeout: () => {},
        setInterval: (fn, ms) => { repeats.push({ fn, ms, on: true }); return repeats.length; },
        clearInterval: id => { if (repeats[id - 1]) repeats[id - 1].on = false; }
    });
    const flat = node => [node, ...(node?.children || []).flatMap(flat)];
    const shown = () => nodes.get(OVERLAY_ID) || null;
    return { overlay, clock, repeats, video, shown, parts: () => flat(shown()), texts: () => flat(shown()).map(node => node.textContent).filter(Boolean) };
}

const kidsHold = (extra = {}) => ({ ok: true, state: 'STUDY', phase: 'study', breakMode: 'rest', until: 1_252_000, packIds: ['in_gate'],
    kidsSpace: 'study_time', kidsOpensAt: 1_252_000, kidsOpensAtBreak: true, ...extra });

test('Kids pages show the study-time card with Kriti and the countdown to the break', () => {
    const h = overlayHarness();
    h.overlay.setState(kidsHold());
    const box = h.shown();
    assert.ok(box, 'the card covers the Kids page');
    assert.equal(box.dataset.kind, 'kids');
    assert.equal(h.video.paused, true, 'nothing plays in Kids during the round');
    const kriti = h.parts().find(node => node.tag === 'img');
    assert.equal(kriti.src, `chrome-extension://filtertube/${KRITI_READING}`);
    assert.equal(kriti.attributes['aria-hidden'], 'true');
    assert.ok(h.texts().includes('Study time'));
    assert.ok(h.texts().includes('Kids videos wait while you study. They come back at your break.'));
    const back = h.parts().find(node => node.dataset.role === 'kids-back');
    assert.match(back.textContent, /^Break in 4:12, at .+/);
    // The countdown ticks every second.
    const tick = h.repeats.find(item => item.ms === 1000 && item.on);
    h.clock.now += 2000;
    tick.fn();
    assert.match(back.textContent, /^Break in 4:10, at /);
    // The last round counts down to the end of study.
    h.overlay.setState(kidsHold({ kidsOpensAtBreak: false }));
    assert.match(h.parts().find(node => node.dataset.role === 'kids-back').textContent, /^Study ends in 4:10, at /);
    // The break (or the end) clears it; the rest break has its own screen.
    h.overlay.setState({ ok: true, state: 'NORMAL', phase: 'normal', kidsSpace: 'untouched' });
    assert.equal(h.shown(), null);
    assert.equal(h.repeats.some(item => item.ms === 1000 && item.on), false, 'the countdown stops');
});

test('the card stays off the main site and off Kids while a Kids learning pack is studied', () => {
    const main = overlayHarness({ hostname: 'www.youtube.com' });
    main.overlay.setState(kidsHold());
    assert.equal(main.shown(), null, 'the main site keeps its study feed');
    const learning = overlayHarness();
    learning.overlay.setState(kidsHold({ kidsSpace: 'learning', kidsOpensAt: null, packIds: ['kids_age_5_7'] }));
    assert.equal(learning.shown(), null, 'Kids learning keeps Kids open');
    assert.equal(learning.video.paused, false);
});

test('with the Companion setting Off the card shows without Kriti', async () => {
    const h = overlayHarness({ companion: 'off' });
    h.overlay.start();
    await new Promise(resolve => setTimeout(resolve, 0));
    h.overlay.setState(kidsHold());
    assert.ok(h.shown());
    assert.equal(h.parts().some(node => node.tag === 'img'), false);
    assert.ok(h.texts().includes('Study time'));
});

test('the countdown reads minutes and seconds, rounded up', () => {
    assert.equal(countdown(252_000), '4:12');
    assert.equal(countdown(1), '0:01');
    assert.equal(countdown(0), '0:00');
    assert.equal(countdown(-5), '0:00');
    assert.equal(countdown(3_600_000), '60:00');
});

// ---- Copy and packaging -------------------------------------------------------------------------

const NEW_KEYS = ['study.overlay.kidsTitle', 'study.overlay.kidsBody', 'study.overlay.kidsBackAtBreak', 'study.overlay.kidsBackAtEnd',
    'study.packs.kids', 'study.packs.kidsLearning', 'study.packs.kidsHold'];

test('the new lines are in every interface language, keep their placeholders and name no site or other character', () => {
    const directory = 'data/ui_locales';
    const names = fs.readdirSync(directory).filter(name => /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*\.json$/.test(name));
    assert.equal(names.length, 38);
    const english = JSON.parse(fs.readFileSync(`${directory}/en.json`, 'utf8'));
    const placeholders = value => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort().join(',');
    for (const name of names) {
        const strings = JSON.parse(fs.readFileSync(`${directory}/${name}`, 'utf8'));
        for (const id of NEW_KEYS) {
            assert.ok(typeof strings[id] === 'string' && strings[id].trim(), `${name}: ${id}`);
            assert.equal(placeholders(strings[id]), placeholders(english[id]), `${name}: ${id}`);
            assert.doesNotMatch(strings[id], /youtube|kagaz|mohar|phoolu|bindu|rekha/i, `${name}: ${id}`);
        }
        if (name !== 'en.json') assert.notEqual(strings['study.overlay.kidsBody'], english['study.overlay.kidsBody'], `${name} is translated`);
    }
    assert.equal(placeholders(english['study.overlay.kidsBackAtBreak']), 'left,time');
});

test("Kriti's reading pose is packaged for the pages that show the card", () => {
    assert.ok(fs.existsSync(KRITI_READING));
    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        const entry = manifest.web_accessible_resources.find(item => item.resources.includes(KRITI_READING)
            || item.resources.includes('assets/images/mascots/*.webp'));
        assert.ok(entry, file);
        assert.ok(entry.matches.some(match => match.includes('youtubekids.com')), file);
    }
});
