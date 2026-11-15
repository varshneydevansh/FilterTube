import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildCatalog, renderCatalog, MIN_CHANNELS } from '../../scripts/build-study-packs.mjs';

const require = createRequire(import.meta.url);
const Packs = require('../../js/shared/study_packs.js');
const raw = fs.readFileSync(new URL('../../data/study/packs-v1.json', import.meta.url), 'utf8');
const bundled = JSON.parse(raw);
const catalog = Packs.parseCatalog(bundled);

const draft = () => ({
  version: 1, generated: '2026-11-14', status: 'draft',
  packs: [
    { id: 'in_upsc_cse', kind: 'study', name: { en: 'UPSC', hi: 'यूपीएससी' }, countries: ['in'], nearby: ['NP'], keywords: ['upsc'], coverage: 'good', notes: 'x',
      channels: [
        { name: 'A', handle: 'a', url: 'u', subscribers: '1M', confidence: 'high', why: 'x', sources: ['s'] },
        { name: 'B', handle: '@b', channelId: 'UCbbbbbbbbbbbbbbbbbbbbbb', confidence: 'medium', why: 'y' },
        { name: 'B again', handle: '@B', confidence: 'high' },
        { name: 'C', handle: '@c', confidence: 'High', why: 'z' },
        { name: 'D', handle: '@d', confidence: 'low', why: 'maybe' },
        { name: 'E', handle: '', confidence: 'unverified', why: 'name only' }
      ] },
    { id: 'cn_gaokao', kind: 'study', name: { en: 'Gaokao' }, countries: ['CN'], keywords: ['gaokao'],
      channels: [{ name: 'A', handle: '@a', confidence: 'high' }, { name: 'B', handle: '@b', confidence: 'high' }, { name: 'C', handle: '@c', confidence: 'low' }] }
  ],
  kidsPacks: [{ id: 'classic_1990s', kind: 'kids_classic', name: { en: '1990s' }, officialOnly: true, decade: '1990s',
    channels: [1, 2, 3].map(n => ({ name: `K${n}`, handle: `@k${n}`, confidence: 'high', why: 'w' })) }]
});

test('the generator keeps high and medium channels, strips curation fields and hides thin packs', () => {
  const { catalog: built, hidden } = buildCatalog(draft());
  assert.equal(built.schema, 'filtertube_study_packs');
  assert.equal(built.version, 1);
  assert.deepEqual(built.packs.map(pack => pack.id), ['in_upsc_cse', 'classic_1990s']);
  assert.deepEqual(hidden, ['cn_gaokao'], 'fewer than 3 approved channels');
  const upsc = built.packs[0];
  assert.deepEqual(upsc.channels.map(channel => channel.name), ['A', 'B', 'C'], 'the same handle twice is one channel');
  assert.equal(upsc.channels[0].handle, '@a');
  assert.deepEqual(upsc.countries, ['IN']);
  assert.equal(built.packs[1].kind, 'kids_classic');
  for (const field of ['why', 'confidence', 'sources', 'url', 'subscribers', 'coverage', 'notes', 'status']) {
    assert.equal(JSON.stringify(built).includes(`"${field}"`), false, field);
  }
});

test('the bundled catalog has at least 3 approved channels per pack and fits the study:<packId> tag', () => {
  assert.equal(bundled.schema, 'filtertube_study_packs');
  assert.equal(bundled.version, 1);
  for (const pack of bundled.packs) {
    assert.ok(pack.channels.length >= MIN_CHANNELS, pack.id);
    assert.ok(pack.channels.every(channel => channel.name && (channel.handle || channel.channelId)), pack.id);
    assert.ok(/^[A-Za-z0-9_.-]{1,64}$/.test(pack.id), pack.id);
  }
  const ids = bundled.packs.map(pack => pack.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const hidden of ['cn_gaokao', 'cn_kaoyan', 'tz_necta', 'my_stpm', 'cm_gce_bac']) assert.equal(ids.includes(hidden), false, hidden);
  // us_praxis was thin until 2026-11-16, when it got five verified channels (app StudyPackCatalogTest).
  assert.ok(bundled.packs.find(pack => pack.id === 'us_praxis').channels.length >= 3);
  assert.deepEqual([...new Set(bundled.packs.map(pack => pack.kind))].sort(), ['class', 'kids_age', 'kids_classic', 'study']);
  assert.equal(catalog.packs.length, bundled.packs.length, 'the loader reads every bundled pack');
});

test('the bundled catalog is the generator output for the v2 draft, and the same bytes the apps bundle', t => {
  // The app checkout: FILTERTUBE_APP_DIR when set (a branch worktree), else the study-3.6.2 worktree.
  const app = process.env.FILTERTUBE_APP_DIR
    ? new URL(`file://${process.env.FILTERTUBE_APP_DIR.replace(/\/?$/, '/')}`)
    : new URL('../../../study-3.6.2/', import.meta.url);
  const draftPath = new URL('docs/app/study-mode/study-packs-draft-v2.json', app);
  if (!fs.existsSync(draftPath)) { t.skip('the draft lives in the app repository'); return; }
  assert.equal(renderCatalog(JSON.parse(fs.readFileSync(draftPath, 'utf8'))), raw);
  const androidAsset = new URL('apps/android/app/src/main/assets/study/packs-v1.json', app);
  if (!fs.existsSync(androidAsset)) return;
  assert.equal(fs.readFileSync(androidAsset, 'utf8'), raw, 'the extension bundles the same bytes as Android');
});

test('v2: class packs carry grade, board, subjects and grade keywords; the picker has Exams and School tabs', () => {
  assert.equal(bundled.draftGenerated, '2026-11-16');
  assert.ok(bundled.packs.length >= 130, 'v2 has 145 packs before thin ones are hidden');
  const cbse = Packs.packById(catalog, 'cls_in_cbse_6_8');
  assert.equal(cbse.kind, 'class');
  assert.equal(cbse.grade, '6-8');
  assert.equal(cbse.board, 'CBSE (NCERT)');
  assert.ok(cbse.subjects.includes('Mathematics'));
  assert.deepEqual(Object.keys(cbse.gradeKeywords), ['6', '7', '8']);
  assert.ok(cbse.gradeKeywords['6'].includes('class 6 maths'));
  const rawCbse = bundled.packs.find(pack => pack.id === 'cls_in_cbse_6_8');
  assert.deepEqual(Object.keys(rawCbse), ['id', 'kind', 'name', 'shortName', 'grade', 'board', 'countries', 'taughtIn', 'languages', 'subjects', 'keywords', 'gradeKeywords', 'chips', 'channels'],
    'field order is part of the byte-identical contract with the apps');
  const school = Packs.forTab(catalog, 'IN', 'school');
  assert.ok(school.length > 0 && school.every(pack => pack.kind === 'class'));
  assert.equal(school[0].countries.includes('IN'), true, 'own country first');
  assert.equal(school.some(pack => pack.id.startsWith('cls_bd_')), false, 'school packs never come from another country via nearby');
  assert.ok(school.some(pack => pack.id === 'global_cls_khan_academy'), 'global school packs show for every country');
  assert.equal(rawCbse.taughtIn.AE, 'Indian curriculum');
  const exams = Packs.forTab(catalog, 'IN', 'exams');
  assert.ok(exams.some(pack => pack.id === 'in_upsc_cse') && exams.every(pack => pack.kind === 'study'));
  const upsc = Packs.packById(catalog, 'in_upsc_cse');
  assert.equal(upsc.grade, null);
  assert.deepEqual(upsc.gradeKeywords, {});
  assert.equal(Packs.kidsPacks(catalog).length, 6);
});

test('the generator writes class fields and pack blocked words only when they have values', () => {
  const { catalog: built } = buildCatalog({ generated: 'g', packs: [], kidsPacks: [], classPacks: [
    { id: 'cls_x', kind: 'class', grade: ' 9-10 ', board: 'Board', name: { en: 'X' }, subjects: ['Maths', 'Maths'],
      gradeKeywords: { 9: [' class 9 ', 'class 9'], 10: [], '': ['x'] }, blockedWords: ['reaction', ' vlog '],
      channels: [1, 2, 3].map(n => ({ name: `C${n}`, handle: `c${n}`, confidence: 'medium' })) }
  ] });
  assert.deepEqual(built.packs[0], { id: 'cls_x', kind: 'class', name: { en: 'X' }, grade: '9-10', board: 'Board', subjects: ['Maths'],
    gradeKeywords: { 9: ['class 9'] }, blockedWords: ['reaction', 'vlog'],
    channels: [{ handle: '@c1', name: 'C1' }, { handle: '@c2', name: 'C2' }, { handle: '@c3', name: 'C3' }] });
});

test('shortName, chips and variants pass through like the Android generator', () => {
  const channels = [1, 2, 3].map(n => ({ name: `C${n}`, handle: `@c${n}`, confidence: 'high' }));
  const { catalog: built } = buildCatalog({ generated: 'g', packs: [
    { id: 'gate', kind: 'study', name: { en: 'GATE' }, shortName: ' GATE ', chips: ['DBMS', 'DBMS', ' OS '], channels,
      variants: [
        { id: 'CSE', name: { en: 'CSE' }, default: true, chips: ['DBMS'], keywords: ['gate cse'], channels: ['@c1', '@C2', '@unknown'] },
        { id: 'cse', name: { en: 'dupe' } },
        { id: 'bad id!', name: { en: 'x' } },
        { id: 'ece', name: { en: 'ECE', hi: '' }, default: 'yes' }
      ] }
  ] });
  assert.deepEqual(built.packs[0], { id: 'gate', kind: 'study', name: { en: 'GATE' }, shortName: 'GATE', chips: ['DBMS', 'OS'],
    variants: [
      { id: 'cse', name: { en: 'CSE' }, default: true, chips: ['DBMS'], keywords: ['gate cse'], channels: ['@c1', '@C2'] },
      { id: 'ece', name: { en: 'ECE' } }
    ],
    channels: channels.map(({ name, handle }) => ({ handle, name })) });
  const labelled = buildCatalog({ generated: 'g', packs: [
    { id: 'cbse', kind: 'class', name: { en: 'CBSE' }, countries: ['IN', 'AE'], taughtIn: { ae: ' Indian curriculum ', xx1: 'bad', QA: '' },
      variantLabel: { EN: 'Stream' }, channels, variants: [{ id: 'pcm', name: { en: 'PCM' } }] },
    { id: 'plain', kind: 'study', name: { en: 'Plain' }, variantLabel: { en: 'Stream' }, channels }
  ] }).catalog.packs;
  assert.deepEqual(Object.keys(labelled[0]), ['id', 'kind', 'name', 'countries', 'taughtIn', 'variantLabel', 'variants', 'channels']);
  assert.deepEqual(labelled[0].taughtIn, { AE: 'Indian curriculum' });
  assert.deepEqual(labelled[0].variantLabel, { en: 'Stream' });
  assert.equal('variantLabel' in labelled[1], false, 'no heading without variants');
  const gate = Packs.packById(catalog, 'in_gate');
  assert.equal(gate.shortName, 'GATE');
  assert.deepEqual(gate.variants.map(variant => variant.id), ['cse', 'ece', 'ee', 'me', 'civil']);
  assert.equal(Packs.packVariant(gate, null).id, 'cse', 'the default branch');
  assert.equal(Packs.packVariant(gate, 'me').id, 'me');
  assert.equal(Packs.packVariant(gate, 'nope').id, 'cse');
  assert.equal(Packs.packVariant(Packs.packById(catalog, 'us_sat'), 'x'), null);
  assert.ok(gate.blockedWords.length > 0, 'pack blocked words are bundled');
  assert.ok(Packs.packById(catalog, 'in_jee').chips.length > 0);
});

test('packs for a country: own first, then nearby, then global; kids packs are separate', () => {
  const nepal = Packs.forCountry(catalog, 'np').map(pack => pack.id);
  const at = id => nepal.indexOf(id);
  assert.ok(at('np_lok_sewa') >= 0 && at('np_lok_sewa') < at('in_upsc_cse'), 'Nepal\'s own packs come first');
  assert.ok(at('in_upsc_cse') < at('global_ielts'), 'India UPSC lists Nepal as nearby');
  assert.equal(new Set(nepal).size, nepal.length, 'no pack repeats');
  assert.equal(nepal.includes('us_bar'), false, 'unrelated countries are not listed');
  assert.ok(nepal.every(id => !id.startsWith('kids_') && !id.startsWith('classic_')));
  assert.deepEqual(Packs.forCountry(catalog, '').map(pack => pack.id), catalog.packs.filter(Packs.isGlobal).filter(p => p.kind === 'study' || p.kind === 'class').map(p => p.id));
  assert.deepEqual(Packs.kidsPacks(catalog).map(pack => pack.kind).filter((kind, i, all) => all.indexOf(kind) === i).sort(), ['kids_age', 'kids_classic']);
});

test('channel matching: the channel id first, then the handle', () => {
  const upsc = Packs.packById(catalog, 'in_upsc_cse');
  assert.equal(Packs.matchChannel(upsc, 'UCV1lbzgZNcYFAT3VHKOb7Cg', null)?.handle, '@UnacademyUPSC101');
  assert.equal(Packs.matchChannel(upsc, null, 'studyiqeducationltd')?.name, 'StudyIQ IAS');
  assert.equal(Packs.matchChannel(upsc, 'UCxxxxxxxxxxxxxxxxxxxxxx', '@UnacademyUPSC101'), null, 'a different id is a different channel');
  assert.ok(Packs.packsForChannel(catalog, null, '@NCERTOFFICIAL').some(pack => pack.id === 'in_upsc_cse'));
});

test('loader helpers', async () => {
  assert.equal(Packs.countryFromLocale('en-IN'), 'IN');
  assert.equal(Packs.countryFromLocale('hi_IN'), 'IN');
  assert.equal(Packs.countryFromLocale('zh-Hant-TW'), 'TW');
  assert.equal(Packs.countryFromLocale('en'), '');
  assert.equal(Packs.packName(Packs.packById(catalog, 'in_upsc_cse'), 'hi-IN'), 'संघ लोक सेवा आयोग सिविल सेवा परीक्षा');
  assert.equal(Packs.packName(Packs.packById(catalog, 'kids_age_2_4'), 'fr'), 'Ages 2-4');
  Packs.resetCache();
  const requested = [];
  const loaded = await Packs.load({ getURL: path => `chrome-extension://id/${path}`,
    fetch: async url => { requested.push(url); return { ok: true, json: async () => bundled }; } });
  assert.equal(loaded.packs.length, bundled.packs.length);
  assert.deepEqual(requested, ['chrome-extension://id/data/study/packs-v1.json']);
  await Packs.load({ fetch: async () => { throw new Error('a cached load must not fetch'); } });
  Packs.resetCache();
  await assert.rejects(Packs.load({ fetch: async () => ({ ok: true, json: async () => ({ schema: 'filtertube_study_packs', version: 2, packs: [] }) }) }), /Unsupported/);
  await assert.rejects(Packs.load({ fetch: async () => ({ ok: true, json: async () => ({ version: 1, packs: [] }) }) }), /Not a study pack catalog/);
  Packs.resetCache();
});
