// Applying Study: during STUDY the active packs (bundled catalog + packEdits) are the allow layer of Main
// and Kids, the block list plus the pack's blocked words still subtract (layered), and the user's own
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

test('outside study, in a normal break and without packs, the profile is unchanged', () => {
    const base = profile();
    for (const clock of [{ state: Engine.NORMAL }, { state: Engine.BREAK, breakMode: 'normal' }, { state: Engine.LIMIT }]) {
        const result = Engine.studyEffectiveProfile(base, { catalog, clock });
        assert.equal(result.applied, false);
        assert.equal(result.profile, base);
    }
    const none = profile({ study: Model.createStudy({ activePackIds: ['not_a_pack'] }) });
    assert.equal(Engine.studyEffectiveProfile(none, { catalog, clock: studying }).applied, false);
});

test('during study the pack is the allow layer, layered over the block list, on Main and Kids', () => {
    const base = profile();
    const before = JSON.stringify(base);
    const { profile: effective, applied, packIds } = Engine.studyEffectiveProfile(base, { catalog, clock: studying });
    assert.equal(applied, true);
    assert.deepEqual(packIds, ['in_upsc_cse']);
    assert.equal(JSON.stringify(base), before, 'the stored profile is not mutated');
    const upsc = Packs.packById(catalog, 'in_upsc_cse');
    for (const surface of [effective.main, effective.kids]) {
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
    assert.deepEqual(effective.kids.blockedKeywords.map(row => row.word), ['scary', 'reaction', 'result live']);
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
