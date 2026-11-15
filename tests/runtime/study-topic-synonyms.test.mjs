// Study topic synonyms (Android StudySuggestions.kt + StudyTopicSynonyms + StudyEffectiveRules.layer):
// each pack branch gets the same curated topic phrases as the app. Multi-word synonyms of a kept
// topic ("concrete technology" under "building materials") allow a title like the topic does;
// single everyday words ("cement") only route a search and never allow on their own.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Packs = require('../../js/shared/study_packs.js');
const Model = require('../../js/shared/study_model.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));
const studying = { state: Engine.STUDY, breakMode: 'rest' };
const words = rows => rows.map(row => row.word);

function profile(study) {
    return {
        name: 'Riya',
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
        kids: { mode: 'blocklist', blockedKeywords: [], whitelistChannels: [] },
        study
    };
}

test('the suggestion lists are the app\'s: GATE Civil gains building materials and its lesson phrases', () => {
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.PACK_TOPICS, 'in_gate:civil'),
        ['building materials', 'construction materials', 'civil engineering']);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.PACK_TOPICS, 'in_gate:cse'), []);
    const building = Engine.suggest(Engine.SUGGESTION_KINDS.TOPIC_SYNONYMS, 'Building  Materials');
    for (const word of ['cement', 'concrete', 'bricks', 'mortar', 'fly ash', 'concrete technology']) assert.ok(building.includes(word), word);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.SEARCH_EXAMPLES, 'in_gate:civil'), ['cement', 'beam deflection']);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.SEARCH_EXAMPLES, 'in_gate:unknown'), ['previous year questions', 'engineering mathematics'],
        'an unknown branch falls back to the pack');
    assert.deepEqual(Engine.suggest('nope', 'in_gate'), []);
    assert.deepEqual(Engine.suggest(Engine.SUGGESTION_KINDS.TOPIC_SYNONYMS, 'toString'), [], 'no prototype keys');
});

test('allow phrases: the branch extras and multi-word synonyms only, never single words', () => {
    const phrases = Engine.studyAllowPhrases('in_gate', 'civil', ['concrete structures', 'structural analysis']);
    for (const phrase of ['building materials', 'construction materials', 'civil engineering', 'concrete technology',
        'reinforced concrete', 'beam deflection', 'fly ash']) {
        assert.ok(phrases.includes(phrase), phrase);
    }
    for (const word of ['cement', 'concrete', 'beam', 'rcc', 'slab']) assert.equal(phrases.includes(word), false, word);
    assert.equal(new Set(phrases).size, phrases.length, 'no duplicates');
});

test('during a GATE Civil round the allow layer carries the synonyms after the pack topics', () => {
    const study = Model.createStudy({ activePackIds: ['in_gate'] });
    study.packEdits = { in_gate: { variant: 'civil', channelsAdded: [], channelsRemoved: [], topicsAdded: [], topicsRemoved: [] } };
    const result = Engine.studyEffectiveProfile(profile(study), { catalog, clock: studying });
    assert.equal(result.phase, 'study');
    const allow = words(result.profile.main.whitelistKeywords);
    assert.ok(allow.includes('concrete structures'), 'the pack topic stays');
    assert.ok(allow.includes('building materials'));
    assert.ok(allow.includes('concrete technology'));
    assert.equal(allow.includes('cement'), false, 'a single everyday word never allows');
    assert.ok(allow.indexOf('concrete structures') < allow.indexOf('concrete technology'), 'topics come first');
    const keys = allow.map(word => word.toLowerCase());
    assert.equal(new Set(keys).size, keys.length, 'a phrase that is also a topic appears once');
    for (const row of result.profile.main.whitelistKeywords) {
        assert.equal(row.titleOnly, true);
        assert.equal(row.exact, true);
        assert.equal(row.source, Engine.TOPIC_SOURCE);
        assert.equal(row.managedListId, 'study:in_gate');
    }
    assert.deepEqual(words(result.profile.kids.whitelistKeywords), allow, 'Kids gets the same layer');
});

test('a removed topic takes its own synonyms with it, and a removed phrase stays out', () => {
    const study = Model.createStudy({ activePackIds: ['in_gate'] });
    study.packEdits = { in_gate: { variant: 'civil', channelsAdded: [], channelsRemoved: [], topicsAdded: [],
        topicsRemoved: ['structural analysis', 'building materials'] } };
    const allow = words(Engine.studyEffectiveProfile(profile(study), { catalog, clock: studying }).profile.main.whitelistKeywords);
    assert.equal(allow.includes('building materials'), false);
    assert.equal(allow.includes('slope deflection'), false, 'only structural analysis covers it');
});

test('another branch gets its own topics: GATE CSE has no building materials', () => {
    const study = Model.createStudy({ activePackIds: ['in_gate'] });
    study.packEdits = { in_gate: { variant: 'cse', channelsAdded: [], channelsRemoved: [], topicsAdded: [], topicsRemoved: [] } };
    const allow = words(Engine.studyEffectiveProfile(profile(study), { catalog, clock: studying }).profile.main.whitelistKeywords);
    assert.equal(allow.includes('building materials'), false);
    assert.ok(allow.includes('linked list'), 'data structures covers linked list');
    assert.ok(allow.includes('virtual memory'), 'operating systems covers virtual memory');
});

test('search routing: a query names the topics whose terms it contains, or that contain it', () => {
    const topics = ['building materials', 'structural analysis', 'fluid mechanics'];
    assert.deepEqual(Engine.topicsForQuery('cement test', topics), ['building materials']);
    assert.deepEqual(Engine.topicsForQuery('beam', topics), ['structural analysis'], '"beam" is inside "beam deflection"');
    assert.deepEqual(Engine.topicsForQuery('Bernoulli  theorem', topics), ['fluid mechanics']);
    assert.deepEqual(Engine.topicsForQuery('x', topics), []);
    assert.deepEqual(Engine.topicsForQuery('cementing', topics), [], 'whole words only');
    assert.deepEqual(Engine.exampleSearches([{ packId: 'in_jee', variantId: 'advanced' }]), ['rotational motion', 'irodov']);
    assert.deepEqual(Engine.exampleSearches([]), []);
});

test('the filter engine allows a lesson phrase by title and still hides a single-word title', () => {
    const study = Model.createStudy({ activePackIds: ['in_gate'] });
    study.packEdits = { in_gate: { variant: 'civil', channelsAdded: [], channelsRemoved: [], topicsAdded: [], topicsRemoved: [] } };
    const effective = Engine.studyEffectiveProfile(profile(study), { catalog, clock: studying }).profile.main;
    const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const whitelistKeywords = effective.whitelistKeywords.map(row => ({
        pattern: `\\b${row.word.split(' ').map(escape).join('\\s+')}\\b`, flags: 'i', titleOnly: true
    }));
    const other = 'UC0000000000000000000001';
    const card = (videoId, title) => {
        const run = { text: 'Someone', navigationEndpoint: { browseEndpoint: { browseId: other, canonicalBaseUrl: '/@someone' } } };
        return { videoRenderer: { videoId, title: { runs: [{ text: title }] }, ownerText: { runs: [run] }, shortBylineText: { runs: [run] } } };
    };
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData({ contents: [
        card('AAAAAAAAAAA', 'Building Materials - Cement | GATE lecture'),
        card('BBBBBBBBBBB', 'Concrete Technology one shot'),
        card('CCCCCCCCCCC', 'Cement price list today')
    ] }, {
        enabled: true, listMode: 'whitelist', listLayered: true, channelMap: {}, videoChannelMap: {},
        whitelistChannels: [], whitelistKeywords, filterChannels: [], filterKeywords: [], blockedVideoIds: [], allowedVideoIds: []
    }, 'study-synonyms');
    assert.deepEqual(JSON.parse(JSON.stringify(result.contents.map(item => item.videoRenderer.videoId))), ['AAAAAAAAAAA', 'BBBBBBBBBBB']);
});
