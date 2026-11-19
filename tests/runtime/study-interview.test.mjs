// Android StudyInterviewTest: the Interview plan type, its packs, the setup tile they live under, search
// topics and the study Home's order. Tests that read the real interview packs need the regenerated
// data/study/packs-v1.json (kind "interview"); the rest add a stand-in interview pack when the bundled
// catalog has none yet.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Packs = require('../../js/shared/study_packs.js');
const Setup = require('../../js/shared/study_setup.js');
const Engine = require('../../js/shared/study_engine.js');
const Model = require('../../js/shared/study_model.js');
const Search = require('../../js/shared/channel_search.js');
const Feed = require('../../js/shared/allowlist_feed.js');

const raw = JSON.parse(fs.readFileSync(new URL('../../data/study/packs-v1.json', import.meta.url), 'utf8'));
const catalog = Packs.parseCatalog(raw);

const ids = ['global_coding_interview', 'interview_system_design', 'interview_devops_cloud', 'interview_data_science',
    'interview_product', 'interview_consulting', 'interview_finance', 'interview_hr'];

/** A stand-in pack row (raw catalog shape) with five channels. */
function rawPack(id, kind, extra = {}) {
    return {
        id, kind, name: { en: id }, countries: [], languages: ['en'],
        channels: [1, 2, 3, 4, 5].map(n => ({ channelId: `UC${'x'.repeat(21)}${n}`, name: `Channel ${n}`, language: 'en' })),
        ...extra
    };
}

/** The bundled catalog, plus a stand-in interview_hr pack if it doesn't have one yet. */
const withInterview = Packs.parseCatalog({
    ...raw,
    packs: raw.packs.some(pack => pack.id === 'interview_hr') ? raw.packs
        : [...raw.packs, rawPack('interview_hr', 'interview', { keywords: ['hr interview', 'behavioral interview'], shortName: 'HR' })]
});
const parsed = (id, kind) => Packs.parseCatalog({ ...raw, packs: [rawPack(id, kind)] }).packs[0];

test('the catalog has the interview packs, each global with channels, chips, topics and a short name', () => {
    const interviews = Setup.StudyInterviews.of(catalog, 3);
    assert.deepEqual(new Set(interviews.map(pack => pack.id)), new Set(ids));
    for (const pack of interviews) {
        assert.equal(pack.kind, Setup.KIND_INTERVIEW, pack.id);
        assert.ok(Packs.isGlobal(pack) && pack.countries.length === 0, pack.id);
        assert.ok(pack.channels.length >= 4, pack.id);
        assert.ok(pack.chips.length >= 6 && pack.keywords.length >= 10, pack.id);
        assert.ok(pack.shortName, pack.id);
        // No pack field names the video site.
        const words = [...Object.values(pack.names), ...pack.chips, ...pack.keywords, ...pack.subjects, pack.shortName || ''].join(' ');
        assert.equal(/youtube/i.test(words), false, pack.id);
    }
    assert.deepEqual(Setup.StudyInterviews.examples(catalog, 3), interviews.map(pack => pack.shortName).filter(Boolean).slice(0, 3));
});

test('interview packs stay out of the exam list and the skill list', () => {
    const exams = Setup.StudyExamList.of(catalog, 'IN', '', 3);
    const listed = [...exams.own, ...exams.also].flatMap(section => section.packs).map(pack => pack.id);
    assert.ok(listed.every(id => !ids.includes(id)));
    assert.ok(Setup.StudySkills.of(catalog, 3).every(pack => !ids.includes(pack.id)));
    assert.ok(Setup.StudyExamList.of(catalog, null, 'interview', 3).elsewhere.every(pack => !ids.includes(pack.id)));
    // A stand-in interview pack is never an exam or a skill either.
    assert.ok(Setup.StudySkills.of(withInterview, 3).every(pack => pack.id !== 'interview_hr'));
    assert.ok(Setup.StudyExamList.of(withInterview, null, 'interview', 3).elsewhere.every(pack => pack.id !== 'interview_hr'));
});

test('a chosen pack reopens setup on its own tile', () => {
    assert.equal(Setup.MODES.INTERVIEW, 'interview');
    assert.equal(Setup.modeOf(parsed('interview_hr', 'interview')), Setup.MODES.INTERVIEW);
    assert.equal(Setup.modeOf(Packs.packById(catalog, 'global_coding_interview')), Setup.MODES.INTERVIEW);
    assert.equal(Setup.modeOf(Packs.packById(catalog, 'in_gate')), Setup.MODES.EXAM);
    assert.equal(Setup.modeOf(Packs.packById(catalog, 'cls_in_cbse_9_10')), Setup.MODES.SCHOOL);
    assert.equal(Setup.modeOf(Packs.packById(catalog, 'global_cls_khan_academy')), Setup.MODES.SKILL);
    assert.equal(Setup.modeOf(parsed('kids_age_5_7', 'kids_age')), Setup.MODES.SKILL);
    assert.deepEqual(Setup.reopenAt(['interview_hr'], withInterview, 'IN'), { step: 'list', mode: 'interview', country: 'IN' });
});

test('interview packs are study kinds, so the plan model and family scopes keep them', () => {
    assert.ok(Packs.STUDY_KINDS.includes('interview'));
    assert.ok(Packs.forCountry(withInterview, 'BR').some(pack => pack.id === 'interview_hr'));
    assert.ok(Packs.forCountry(catalog, 'BR').some(pack => pack.id === 'interview_finance'));
    assert.deepEqual(Model.createStudy({ activePackIds: ids }).activePackIds, ids);
});

test('interview search routes interview words to the plan\'s interview channels', () => {
    assert.ok(Engine.isInterviewPackId('interview_finance'));
    assert.ok(Engine.isInterviewPackId('global_coding_interview'));
    assert.equal(Engine.isInterviewPackId('in_gate'), false);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.PACK_TOPICS, 'interview_hr'), [...Engine.INTERVIEW_TOPICS]);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.PACK_TOPICS, 'in_gate:cse'), [], 'an exam gains no interview words');
    const topics = Engine.studyTopics('interview_hr', null, ['hr interview']);
    assert.ok(topics.includes('mock interview'));
    const group = (packId, channel, words) => ({ packId, channels: [channel], terms: Engine.planSearchTerms(words) });
    const gate = group('in_gate', 'UCgate', Engine.studyTopics('in_gate', 'cse', ['dbms']));
    const hr = group('interview_hr', 'UChr', topics);
    assert.deepEqual(Search.plan('mock interview', [gate, hr], 1), ['UChr']);
    // A system design search reaches the system design pack through its everyday words.
    const design = group('interview_system_design', 'UCsd', Engine.studyTopics('interview_system_design', null, ['system design']));
    assert.deepEqual(Search.plan('rate limiter', [gate, design], 1), ['UCsd']);
    assert.deepEqual(Engine.exampleSearches([{ packId: 'interview_hr' }]), ['tell me about yourself', 'star method']);
});

function planWords(packId, packs) {
    const profile = {
        name: 'Riya',
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
        kids: { mode: 'blocklist', blockedKeywords: [], whitelistChannels: [] },
        study: Model.createStudy({ activePackIds: [packId] })
    };
    const result = Engine.studyEffectiveProfile(profile, { catalog: packs, clock: { state: Engine.STUDY, breakMode: 'rest' } });
    assert.equal(result.phase, 'study');
    return result.profile.main.whitelistKeywords.map(row => row.word);
}

test('an interview plan\'s Home ranks interview walk-throughs first', () => {
    const topics = planWords('interview_hr', withInterview);
    assert.ok(topics.includes('mock interview'), 'the shared interview words are the plan\'s topics');
    const items = [
        { videoId: 'a', title: 'Weekend vlog', publishedAt: 2 },
        { videoId: 'b', title: 'HR mock interview for freshers', publishedAt: 1 }
    ];
    assert.equal(Feed.rank(items, topics)[0].title, 'HR mock interview for freshers');
    // An exam plan is unchanged: "interview" is not one of GATE's topics.
    const gate = planWords('in_gate', withInterview);
    assert.equal(gate.some(word => /interview/i.test(word)), false);
    assert.equal(Feed.rank([{ videoId: 'c', title: 'Mock interview tips', publishedAt: 1 }, { videoId: 'd', title: 'Weekend vlog', publishedAt: 2 }], gate)[0].title,
        'Weekend vlog', 'newest first when no title names a topic');
});
