// Applying Study: during STUDY the active packs (bundled catalog + packEdits) are the allow layer of Main
// (Kids packs are the allow layer of Kids; exam and class packs hold Kids, see study-branch-kids-parity),
// the block list plus the pack's blocked words still subtract (layered), and the user's own
// allowed channels stay. A "normal" break and NORMAL leave the profile untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const Packs = require('../../js/shared/study_packs.js');
const Model = require('../../js/shared/study_model.js');
const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));

const studying = { state: Engine.STUDY, breakMode: 'rest' };
const OWN = 'UC1111111111111111111111';

function profile(extra = {}) {
    return {
        name: 'Aarav',
        main: {
            mode: 'blocklist',
            channels: [{ id: 'UC2222222222222222222222', name: 'Blocked creator' }],
            keywords: [{ word: 'drama', exact: false }],
            whitelistChannels: [{ id: OWN, name: 'My own teacher' }, { id: 'UC3333333333333333333333', name: 'copied', modeBootstrapCopy: true }],
            whitelistKeywords: [{ word: 'minecraft' }],
            allowedVideoIds: ['AAAAAAAAAAA']
        },
        kids: { mode: 'blocklist', blockedKeywords: [{ word: 'scary' }], whitelistChannels: [] },
        study: Model.createStudy({ activePackIds: ['in_upsc_cse'] }),
        ...extra
    };
}

test('outside study and in a normal or skipped break, the profile is unchanged', () => {
    const base = profile();
    for (const clock of [{ state: Engine.NORMAL }, { state: Engine.BREAK, breakMode: 'normal' }, { state: Engine.BREAK, breakMode: 'rest', breakSkipped: true }]) {
        const result = Engine.studyEffectiveProfile(base, { catalog, clock });
        assert.equal(result.applied, false);
        assert.equal(result.profile, base);
    }
});

test('a rest break, the limit and a clock hold allow nothing, with the master switch forced on', () => {
    const base = profile();
    base.settings = { enabled: false, hideComments: false };
    for (const clock of [{ state: Engine.LIMIT }, { state: Engine.BREAK, breakMode: 'rest' }, { state: Engine.LIMIT, clockHold: true }]) {
        const result = Engine.studyEffectiveProfile(base, { catalog, clock });
        assert.equal(result.applied, true);
        assert.equal(result.phase, 'rest');
        assert.equal(result.profile.settings.enabled, true);
        assert.equal(result.profile.settings.hideComments, true);
        for (const surface of [result.profile.main, result.profile.kids]) {
            assert.equal(surface.mode, 'whitelist');
            assert.deepEqual(surface.whitelistChannels, []);
            assert.deepEqual(surface.whitelistKeywords, []);
        }
    }
});

test('fail closed: a study round with no known pack is own allowed channels, or rest; never normal rules', () => {
    const none = profile({ study: Model.createStudy({ activePackIds: ['not_a_pack'] }) });
    none.main = { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [] };
    none.kids = { mode: 'blocklist', blockedChannels: [], blockedKeywords: [], whitelistChannels: [] };
    const rest = Engine.studyEffectiveProfile(none, { catalog, clock: studying });
    assert.equal(rest.applied, true);
    assert.equal(rest.phase, 'rest');
    assert.equal(rest.failClosed, true);
    assert.deepEqual(rest.profile.main.whitelistChannels, []);
    const own = profile({ study: Model.createStudy({ activePackIds: [] }) });
    own.main = { mode: 'whitelist', channels: [], keywords: [], whitelistChannels: [{ id: 'UCownownownownownownown1', name: 'Mine' }] };
    const mine = Engine.studyEffectiveProfile(own, { catalog, clock: studying });
    assert.equal(mine.phase, 'study');
    assert.equal(mine.failClosed, true);
    assert.deepEqual(mine.profile.main.whitelistChannels.map(row => row.id), ['UCownownownownownownown1']);
    // Under a parent's plan, pack channels only: own channels sit out, so it is rest.
    const parent = Engine.studyEffectiveProfile(own, { catalog, clock: { ...studying, setByParentId: 'mum' } });
    assert.equal(parent.phase, 'rest');
    // A copy of the pack kept in study keeps it working when the catalog doesn't know it.
    const copied = profile({ study: Model.createStudy({ activePackIds: ['gone_pack'], packCopies: { gone_pack: {
        channels: [{ channelId: 'UCcopycopycopycopycopy01', name: 'Copy' }], topics: ['algebra'], blockedWords: ['reaction'] } } }) });
    const fromCopy = Engine.studyEffectiveProfile(copied, { catalog: { packs: [] }, clock: studying });
    assert.equal(fromCopy.phase, 'study');
    assert.deepEqual(fromCopy.packIds, ['gone_pack']);
    assert.ok(fromCopy.profile.main.whitelistChannels.some(row => row.id === 'UCcopycopycopycopycopy01'));
});

test('pack topics and blocked words are title-only rows; the chosen variant adds its topics', () => {
    const gate = profile({ study: Model.createStudy({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'ece' } } }) });
    const { profile: effective } = Engine.studyEffectiveProfile(gate, { catalog, clock: studying });
    const pack = Packs.packById(catalog, 'in_gate');
    const ece = pack.variants.find(variant => variant.id === 'ece');
    const words = effective.main.whitelistKeywords.map(row => row.word);
    for (const word of ece.keywords || []) assert.ok(words.includes(word), word);
    assert.ok(effective.main.whitelistKeywords.every(row => row.titleOnly === true && row.source === 'study_topic'));
    const blocked = effective.main.keywords.filter(row => row.source === 'study_pack');
    assert.ok(blocked.length > 0 && blocked.every(row => row.titleOnly === true));
    const cse = pack.variants.find(variant => variant.id === 'cse');
    const onlyCse = (cse.keywords || []).filter(word => !(ece.keywords || []).includes(word) && !pack.keywords.includes(word));
    if (onlyCse.length) assert.equal(words.includes(onlyCse[0]), false, 'another branch\'s topics stay out');
    const stamped = Engine.stampPackCopies(gate.study, catalog);
    assert.equal(stamped.packCopies.in_gate.channels.length, Engine.packChannelsFor(pack, 'ece').length, 'the copy keeps the branch\'s channels');
    assert.ok(stamped.packCopies.in_gate.channels.length < pack.channels.length);
    assert.equal(Engine.stampPackCopies(stamped, catalog), stamped, 'stable once stamped');
});

test('during study the pack is the allow layer, layered over the block list, on Main; an exam pack holds Kids', () => {
    const base = profile();
    const before = JSON.stringify(base);
    const { profile: effective, applied, packIds } = Engine.studyEffectiveProfile(base, { catalog, clock: studying });
    assert.equal(applied, true);
    assert.deepEqual(packIds, ['in_upsc_cse']);
    assert.equal(JSON.stringify(base), before, 'the stored profile is not mutated');
    const upsc = Packs.packById(catalog, 'in_upsc_cse');
    // Kids: allow mode with nothing allowed. An exam pack never puts its channels there.
    assert.equal(effective.kids.mode, 'whitelist');
    assert.deepEqual(effective.kids.whitelistChannels, []);
    assert.deepEqual(effective.kids.whitelistKeywords, []);
    for (const surface of [effective.main]) {
        assert.equal(surface.mode, 'whitelist');
        assert.equal(surface.layered, true);
        const tagged = surface.whitelistChannels.filter(row => row.managedListId === 'study:in_upsc_cse');
        assert.equal(tagged.length, upsc.channels.length);
        assert.ok(surface.whitelistKeywords.some(row => row.word === 'upsc' && row.exact === true));
        assert.deepEqual(surface.allowedVideoIds, []);
    }
    assert.ok(effective.main.whitelistChannels.some(row => row.id === OWN), 'the user\'s own allowed channels stay');
    assert.equal(effective.main.whitelistChannels.some(row => row.modeBootstrapCopy), false, 'mode-switch copies of a blocklist user do not');
    assert.equal(effective.main.whitelistKeywords.some(row => row.word === 'minecraft'), false, 'own allow keywords sit out the session');
    assert.deepEqual(effective.main.channels, base.main.channels, 'the block list stays');
    assert.ok(effective.main.keywords.some(row => row.word === 'drama'));
    assert.ok(effective.kids.blockedKeywords.some(row => row.word === 'scary'));
    assert.equal(effective.study, base.study);
});

test('a rest break keeps the study rules (the feed is hidden anyway)', () => {
    assert.equal(Engine.studyEffectiveProfile(profile(), { catalog, clock: { state: Engine.BREAK, breakMode: 'rest' } }).applied, true);
});

test('packEdits add and remove channels and topics; pack blocked words join the block list', () => {
    const upsc = Packs.packById(catalog, 'in_upsc_cse');
    const removed = upsc.channels[0];
    const edits = { in_upsc_cse: {
        channelsAdded: [{ channelId: 'UC4444444444444444444444', handle: '@extra', name: 'Extra teacher' }],
        channelsRemoved: [removed.handle],
        topicsAdded: ['answer writing practice'],
        topicsRemoved: ['upsc']
    } };
    const withBlocked = { ...catalog, packs: catalog.packs.map(pack => pack.id === 'in_upsc_cse' ? { ...pack, blockedWords: ['reaction', 'result live'] } : pack) };
    const { profile: effective } = Engine.studyEffectiveProfile(profile({ study: Model.createStudy({ activePackIds: ['in_upsc_cse'], packEdits: edits }) }),
        { catalog: withBlocked, clock: studying });
    const allow = effective.main.whitelistChannels;
    assert.equal(allow.some(row => row.handle === removed.handle || (removed.channelId && row.id === removed.channelId)), false);
    assert.ok(allow.some(row => row.id === 'UC4444444444444444444444' && row.handle === '@extra'));
    assert.equal(effective.main.whitelistKeywords.some(row => row.word === 'upsc'), false);
    assert.ok(effective.main.whitelistKeywords.some(row => row.word === 'answer writing practice'));
    assert.deepEqual(effective.main.keywords.map(row => row.word), ['drama', 'reaction', 'result live']);
    assert.deepEqual(effective.kids.blockedKeywords.map(row => row.word), ['scary'], 'Kids holds; its own block list stays');
});

test('class packs bring every grade\'s topic words; two packs merge without repeating a channel', () => {
    const { profile: effective, packIds } = Engine.studyEffectiveProfile(
        profile({ study: Model.createStudy({ activePackIds: ['cls_in_cbse_6_8', 'in_upsc_cse'] }) }), { catalog, clock: studying });
    assert.deepEqual(packIds, ['cls_in_cbse_6_8', 'in_upsc_cse']);
    assert.ok(effective.main.whitelistKeywords.some(row => row.word === 'class 6 maths'));
    const keys = effective.main.whitelistChannels.map(row => row.id || row.handle.toLowerCase());
    assert.equal(new Set(keys).size, keys.length, 'NCERT is in both packs but listed once');
});

test('a user already in layered allow mode keeps their allowed channels and their block list', () => {
    const base = profile();
    base.main = { ...base.main, mode: 'whitelist', layered: true, whitelistChannels: [{ id: OWN, name: 'mine', modeBootstrapCopy: true }] };
    const { profile: effective } = Engine.studyEffectiveProfile(base, { catalog, clock: studying });
    assert.ok(effective.main.whitelistChannels.some(row => row.id === OWN), 'a whitelist user\'s rows are real allow rows');
});
