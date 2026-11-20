// Android StudySetupGroupsTest (Ports Android 3bbad1d03 and b753aa71f): study setup's exam fields and
// grouping, school boards and classes, the steps, Review's channel and topic groups and the
// "Add a channel" input, against the bundled catalog (byte-identical to the app's packs-v1.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Packs = require('../../js/shared/study_packs.js');
const Setup = require('../../js/shared/study_setup.js');
const { StudyExamFields, StudyExamList, StudySchool, StudySkills, StudySetupPath, StudyReviewGroups, StudyChannelInput } = Setup;

const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync(new URL('../../data/study/packs-v1.json', import.meta.url), 'utf8')));
const pack = id => Packs.packById(catalog, id) || assert.fail(`no ${id}`);
const ids = list => list.map(item => item.id);

// ---- Exam fields --------------------------------------------------------------------------------

test('exam fields come from the id without its country prefix', () => {
    const expected = {
        in_gate: 'engineering', in_jee: 'engineering', np_ioe_entrance: 'engineering',
        in_neet_ug: 'medical', pk_mdcat: 'medical', us_mcat: 'medical', gb_plab: 'medical', au_ucat_anz: 'medical',
        in_upsc_cse: 'civil', in_state_psc: 'civil', np_lok_sewa: 'civil', pk_css: 'civil', kr_civil_service: 'civil',
        in_ssc: 'jobs', in_banking: 'jobs', in_rrb: 'jobs',
        in_nda_cds: 'defence', in_afcat: 'defence',
        in_clat: 'law', in_cat: 'law', global_gmat: 'law', us_bar: 'law',
        in_ca_icai: 'finance', global_cfa: 'finance', us_cpa: 'finance',
        in_ctet_tet: 'teaching', in_ugc_net: 'teaching',
        global_ielts: 'languages', cn_hsk: 'languages', global_gre: 'languages',
        us_sat: 'school', gb_a_level: 'school', global_ib: 'school', in_cbse_10_12: 'school', fr_africa_bac: 'school',
        global_coding_interview: 'skills'
    };
    for (const [id, field] of Object.entries(expected)) assert.equal(StudyExamFields.of(pack(id)), field, id);
});

test('a country code in the id never reads as a field', () => {
    assert.deepEqual(StudyExamFields.words('ca_provincial'), ['provincial']);
    assert.equal(StudyExamFields.of(pack('ca_provincial')), 'school');
    assert.deepEqual(StudyExamFields.words('in_ca_icai'), ['ca', 'icai']);
});

test('every bundled exam lands in a named field', () => {
    const other = catalog.packs.filter(item => StudyExamList.EXAM_KINDS.includes(item.kind) && StudyExamFields.of(item) === 'other');
    assert.deepEqual(ids(other), []);
});

test('a pack no id rule knows falls back to its name', () => {
    const med = { id: 'zz_newexam', kind: 'study', names: { en: 'Nursing licensure' }, countries: ['ZZ'], channels: [] };
    assert.equal(StudyExamFields.of(med), 'medical');
    assert.equal(StudyExamFields.of({ ...med, names: { en: 'Quiz night' } }), 'other');
});

// ---- Exam list ----------------------------------------------------------------------------------

test('India\'s exams are grouped by field in order, with neighbours and global exams folded', () => {
    const model = StudyExamList.of(catalog, 'IN', '', 3);
    const fields = model.own.map(section => section.field);
    assert.deepEqual(fields, [...fields].sort((a, b) => StudyExamFields.FIELDS.indexOf(a) - StudyExamFields.FIELDS.indexOf(b)));
    assert.equal(fields[0], 'engineering');
    assert.ok(model.own.find(section => section.field === 'engineering').packs.some(item => item.id === 'in_gate'));
    const own = new Set(model.own.flatMap(section => ids(section.packs)));
    const also = new Set(ids(model.alsoPacks));
    assert.ok(also.has('us_sat') && also.has('global_ielts') && also.has('global_ib'));
    assert.ok([...own].every(id => !also.has(id)));
    // Coding interviews are an interview, not an exam.
    assert.ok(!own.has('global_coding_interview') && !also.has('global_coding_interview'));
    assert.deepEqual(model.elsewhere, []);
});

test('search reaches the fold and other countries', () => {
    const model = StudyExamList.of(catalog, 'IN', 'abitur', 3);
    assert.ok(!model.own.length && !model.also.length);
    assert.ok(ids(model.elsewhere).includes('de_abitur'));
    assert.deepEqual(ids(StudyExamList.of(catalog, 'IN', 'ielts', 3).alsoPacks), ['global_ielts']);
});

test('with no country the list holds only exams taken anywhere', () => {
    const model = StudyExamList.of(catalog, null, '', 3);
    assert.ok(model.own.flatMap(section => section.packs).every(Setup.isGlobal));
    assert.deepEqual(model.also, []);
});

test('chip labels are short', () => {
    assert.equal(StudyExamList.chipLabel(pack('in_gate'), 'en'), 'GATE');
    assert.equal(StudyExamList.chipLabel(pack('in_jee'), 'en'), 'JEE');
    assert.equal(StudyExamList.chipLabel(pack('in_cat'), 'en'), 'CAT');
    assert.equal(StudyExamList.chipLabel(pack('in_ca_icai'), 'en'), 'Chartered Accountancy');
});

// ---- School -------------------------------------------------------------------------------------

test('India\'s boards are its own, never Bangladesh\'s, and CBSE runs from class 1 to 12', () => {
    const boards = StudySchool.boards(catalog, 'IN', 3);
    const packIds = boards.flatMap(board => board.packIds);
    assert.ok(packIds.every(id => !id.startsWith('cls_bd_')));
    assert.ok(packIds.every(id => !Setup.isGlobal(pack(id))));
    const cbse = boards.find(board => board.key === 'CBSE');
    assert.equal(cbse.label, 'CBSE');
    assert.deepEqual(cbse.grades.map(grade => grade.number), Array.from({ length: 12 }, (_, i) => String(i + 1)));
    assert.equal(cbse.grades.find(grade => grade.number === '11').packId, 'cls_in_cbse_11_12');
    assert.equal(boards.find(board => board.key === 'CISCE').label, 'ICSE / ISC');
    assert.equal(boards.find(board => board.key === 'MSBSHSE').label, 'Maharashtra State Board');
});

test('Kenya\'s forms keep their names and a country without boards has none', () => {
    const forms = StudySchool.boards(catalog, 'KE', 3).flatMap(board => board.grades).filter(grade => grade.form);
    assert.deepEqual(forms.map(grade => grade.number), ['1', '2', '3', '4']);
    assert.ok(StudySchool.boards(catalog, 'BH', 3).every(board => board.packIds.every(id => pack(id).countries.includes('BH'))));
    assert.deepEqual(StudySchool.boards(catalog, 'ZZ', 3), []);
    assert.deepEqual(StudySchool.boards(catalog, null, 3), []);
});

test('the school stem drops grades and brackets', () => {
    assert.equal(StudySchool.stem('CBSE / NCERT Classes 6-8'), 'CBSE / NCERT');
    assert.equal(StudySchool.stem('Maharashtra State Board (SSC 9-10, HSC 11-12)'), 'Maharashtra State Board');
    assert.equal(StudySchool.stem('Middle school grades 6-8'), 'Middle school');
    assert.equal(StudySchool.stem('Key Stage 3'), 'Key Stage 3');
});

test('skills are the global lessons, and coding interviews moved to Interview', () => {
    const skillIds = ids(StudySkills.of(catalog, 3));
    assert.ok(skillIds.includes('global_cls_khan_academy') && !skillIds.includes('global_coding_interview'));
    assert.ok(!skillIds.includes('global_ielts'));
});

test('the path skips the stream step unless an exam has streams', () => {
    assert.deepEqual(StudySetupPath.of(false), ['kind', 'list', 'review', 'ready']);
    assert.equal(StudySetupPath.needsStream([pack('in_gate')]), true);
    assert.equal(StudySetupPath.needsStream([pack('cls_in_cbse_11_12')]), false);
    assert.equal(StudySetupPath.back('review', true), 'stream');
    assert.equal(StudySetupPath.back('review', false), 'list');
    assert.equal(StudySetupPath.back('kind', true), null);
    assert.equal(StudySetupPath.next('list', true), 'stream');
});

// ---- More countries (2026-11-16) ----------------------------------------------------------------

test('the new countries\' exams land in named fields', () => {
    const expected = {
        pk_ecat: 'engineering', bd_engineering_admission: 'engineering', bd_medical_admission: 'medical',
        br_concursos: 'civil', es_oposiciones: 'civil', br_oab: 'law', us_praxis: 'teaching',
        tr_lgs: 'school', fr_brevet: 'school', mx_comipems: 'school', jp_koukou_juken: 'school'
    };
    for (const [id, field] of Object.entries(expected)) assert.equal(StudyExamFields.of(pack(id)), field, id);
});

test('each new exam is its country\'s own, and Also taken from still folds the rest', () => {
    const cases = { PK: 'pk_ecat', BD: 'bd_medical_admission', TR: 'tr_lgs', BR: 'br_oab', ES: 'es_oposiciones',
        FR: 'fr_brevet', MX: 'mx_comipems', JP: 'jp_koukou_juken', US: 'us_praxis' };
    for (const [country, id] of Object.entries(cases)) {
        const model = StudyExamList.of(catalog, country, '', 3);
        const own = model.own.flatMap(section => ids(section.packs));
        const also = ids(model.alsoPacks);
        assert.ok(own.includes(id), `${id} in ${country}`);
        assert.ok(also.includes('global_ielts') || own.includes('global_ielts'), `${country} folds global exams`);
        assert.ok(own.every(item => !also.includes(item)));
    }
    assert.deepEqual(ids(StudyExamList.of(catalog, 'IN', 'oposiciones', 3).elsewhere), ['es_oposiciones']);
});

test('new school boards are each country\'s own, with their classes in order', () => {
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const expected = { ID: [7, 12], VN: [10, 12], TH: [10, 12], JP: [10, 12], KR: [10, 12], TR: [9, 12], EG: [10, 12], SA: [10, 12],
        AE: [9, 12], BR: [10, 12], MX: [10, 12], ES: [7, 12], FR: [10, 12], DE: [11, 13], LK: [10, 11] };
    for (const [country, [from, to]] of Object.entries(expected)) {
        const boards = StudySchool.boards(catalog, country, 3);
        assert.ok(boards.length, `${country} has a board`);
        for (const id of boards.flatMap(board => board.packIds)) assert.ok(pack(id).countries.includes(country) && !Setup.isGlobal(pack(id)), `${id}`);
        const grades = boards.flatMap(board => board.grades.map(grade => Number(grade.number)));
        assert.ok(range(from, to).every(n => grades.includes(n)), `${country} covers ${from}-${to}: ${grades}`);
    }
    const indonesia = StudySchool.boards(catalog, 'ID', 3);
    assert.equal(indonesia.length, 1);
    assert.deepEqual(indonesia[0].grades.map(grade => grade.number), range(1, 12).map(String));
    const neb = StudySchool.boards(catalog, 'NP', 3).find(board => board.key === 'NEB');
    assert.deepEqual(neb.grades.map(grade => grade.number), range(8, 12).map(String));
    assert.ok(StudySchool.boards(catalog, 'GB', 3).some(board => board.key === 'SQA'));
    assert.equal(pack('cls_eg_secondary_10_12').variants.length, 2);
});

// ---- Review groups ------------------------------------------------------------------------------

test('GATE ECE splits into its own channels, the shared ones and your own', () => {
    const gate = pack('in_gate');
    const groups = StudyReviewGroups.channels(gate, { variant: 'ece' });
    assert.deepEqual(groups.map(group => group.kind), ['stream', 'shared', 'own']);
    const handle = value => String(value).replace(/^@/, '').toLowerCase();
    const ece = new Set(Setup.variant(gate, 'ece').channels.map(handle));
    const keys = row => [row.handle, row.channelId].filter(Boolean).map(handle);
    assert.ok(groups[0].rows.length);
    assert.ok(groups[0].rows.every(row => keys(row).some(key => ece.has(key))));
    const claimed = new Set(gate.variants.flatMap(item => item.channels).map(handle));
    assert.ok(groups[1].rows.every(row => keys(row).every(key => !claimed.has(key))));
    assert.equal(groups[0].rows.length + groups[1].rows.length, Setup.channelsFor(gate, 'ece').length);
    assert.deepEqual(groups[2].rows, []);
});

test('a pack without streams has one shared group plus your own', () => {
    const clat = pack('in_clat');
    const groups = StudyReviewGroups.channels(clat, null);
    assert.deepEqual(groups.map(group => group.kind), ['shared', 'own']);
    assert.equal(groups[0].onCount, clat.channels.length);
});

test('switching a channel off and on edits channelsRemoved, and counts follow', () => {
    const clat = pack('in_clat');
    const row = StudyReviewGroups.channels(clat, null)[0].rows[0];
    const off = StudyReviewGroups.setChannel(null, row, false);
    assert.equal(off.channelsRemoved.length, 1);
    assert.equal(StudyReviewGroups.channels(clat, off)[0].rows[0].on, false);
    assert.equal(StudyReviewGroups.counts([clat], { [clat.id]: off })[0], clat.channels.length - 1);
    assert.deepEqual(StudyReviewGroups.setChannel(off, row, true).channelsRemoved, []);
});

test('adding a channel lands in your own once, and a pack channel is switched back on instead', () => {
    const clat = pack('in_clat');
    const ref = { channelId: 'UCabcdefghijklmnopqrstuv', handle: 'someone', name: 'Someone' };
    const added = StudyReviewGroups.add(null, ref, clat);
    assert.deepEqual(added.channelsAdded, [ref]);
    assert.deepEqual(StudyReviewGroups.add(added, { ...ref, name: 'Again' }, clat), added);
    const own = StudyReviewGroups.channels(clat, added).at(-1);
    assert.equal(own.kind, 'own');
    assert.equal(own.onCount, 1);
    assert.equal(StudyReviewGroups.isOn(clat, added, ref), true);

    const first = clat.channels[0];
    const row = StudyReviewGroups.channels(clat, null)[0].rows[0];
    const off = StudyReviewGroups.setChannel(null, row, false);
    const back = StudyReviewGroups.add(off, { channelId: first.channelId, handle: first.handle, name: first.name }, clat);
    assert.deepEqual(back.channelsRemoved, []);
    assert.deepEqual(back.channelsAdded, []);

    // Switching an added channel off drops it from channelsAdded; the screen keeps it to undo.
    const dropped = StudyReviewGroups.setChannel(added, own.rows[0], false);
    assert.deepEqual(dropped.channelsAdded, []);
    const kept = StudyReviewGroups.channels(clat, dropped, [ref]).at(-1).rows;
    assert.equal(kept.length, 1);
    assert.equal(kept[0].on, false);
});

test('topics follow the same groups and switch through topicsRemoved', () => {
    const gate = pack('in_gate');
    const edit = { variant: 'cse' };
    const groups = StudyReviewGroups.topics(gate, edit);
    assert.equal(groups[0].kind, 'stream');
    const all = groups.flatMap(group => group.topics.map(item => Setup.topicKey(item.topic)));
    assert.deepEqual(new Set(all), new Set(Setup.topicsFor(gate, 'cse').map(Setup.topicKey)));
    const topic = groups[0].topics[0].topic;
    const off = StudyReviewGroups.setTopic(edit, topic, false);
    assert.equal(StudyReviewGroups.topics(gate, off)[0].topics.find(item => item.topic === topic).on, false);
    assert.equal(StudyReviewGroups.topics(gate, { ...edit, topicsAdded: ['Dynamic programming'] }).at(-1).kind, 'own');
});

// ---- Add a channel input ------------------------------------------------------------------------

test('pasted links, handles and ids resolve to what the resolver needs', () => {
    const id = 'UCabcdefghijklmnopqrstuv';
    const parse = StudyChannelInput.parse;
    assert.deepEqual(parse(id), { type: 'id', value: id });
    assert.deepEqual(parse(`https://www.youtube.com/channel/${id}`), { type: 'id', value: id });
    assert.deepEqual(parse(`youtube.com/channel/${id}/videos?view=0`), { type: 'id', value: id });
    assert.deepEqual(parse('@nesoacademy'), { type: 'handle', value: 'nesoacademy' });
    assert.deepEqual(parse('https://m.youtube.com/@nesoacademy/featured'), { type: 'handle', value: 'nesoacademy' });
    assert.deepEqual(parse('  https://youtube.com/@GateSmashers?si=x '), { type: 'handle', value: 'GateSmashers' });
    assert.equal(StudyChannelInput.lookup(parse('@nesoacademy')), '@nesoacademy');
    assert.equal(parse('https://www.youtube.com/c/NesoAcademy').type, 'link');
    assert.deepEqual(parse(' Neso Academy '), { type: 'name', value: 'Neso Academy' });
    assert.equal(parse('   ').type, 'empty');
    assert.equal(StudyChannelInput.lookup(parse('Neso Academy')), null);
});

test('a one-word name may be a handle, and names search the packs\' channels', () => {
    assert.equal(StudyChannelInput.handleGuess('nesoacademy'), 'nesoacademy');
    assert.equal(StudyChannelInput.handleGuess('Neso Academy'), null);
    assert.equal(StudyChannelInput.handleGuess('ab'), null);
    const first = pack('in_gate').channels[0];
    const hits = StudyChannelInput.searchCatalog(catalog, first.name);
    assert.equal(hits[0].name, first.name);
    assert.equal(new Set(hits.map(hit => hit.channelId || hit.handle)).size, hits.length);
    assert.deepEqual(StudyChannelInput.searchCatalog(catalog, 'z'), []);
});

// ---- What setup saves (Android StudySetupActivity.save, reopen) ---------------------------------

test('save keeps the branch Review showed, and a changed plan reopens on its own list', () => {
    const saved = Setup.savedEdits(['in_gate', 'in_clat'], { in_ssc: { topicsAdded: ['x'] } }, catalog);
    assert.equal(saved.in_gate.variant, Setup.variant(pack('in_gate'), null).id);
    assert.equal('in_clat' in saved, false);
    assert.equal('in_ssc' in saved, false);
    assert.deepEqual(Setup.reopenAt(['cls_in_cbse_11_12'], catalog, 'IN'), { step: 'list', mode: 'school', country: 'IN' });
    assert.deepEqual(Setup.reopenAt(['global_cls_khan_academy'], catalog, 'IN'), { step: 'list', mode: 'skill', country: 'IN' });
    assert.deepEqual(Setup.reopenAt([], catalog, 'in'), { step: 'kind', mode: 'exam', country: 'IN' });
    assert.equal(Setup.planLabel([pack('in_gate')], { in_gate: { variant: 'cse' } }, 'en'), `GATE ${Setup.variantName(Setup.variant(pack('in_gate'), 'cse'), 'en')}`);
});
