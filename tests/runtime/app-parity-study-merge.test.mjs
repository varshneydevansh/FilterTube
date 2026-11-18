// Android StudyMergeTest (Ports Android e64d74490 and the merge half of ce156df15): a merge keeps
// "Pack channels only", a parent's choice stays the parent's under their plan, and a sync can't change
// the round and break lengths of a parent's plan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Model = require('../../js/shared/study_model.js');

const local = {
    activePackIds: ['in_upsc_cse'],
    packEdits: { in_upsc_cse: { channelsAdded: [{ handle: '@Mine' }], topicsAdded: ['Polity'] } },
    savedListMode: 'blocklist',
    progress: { phone: { '2026-11-14': 30, '2026-11-15': 10 } }
};
const remote = {
    activePackIds: ['in_upsc_cse', 'in_ssc'],
    packEdits: { in_ssc: { topicsAdded: ['reasoning'] } },
    focus: { roundMinutes: 50 },
    progress: { phone: { '2026-11-15': 5 }, tablet: { '2026-11-15': 40 } }
};
const merge = (a, b) => Model.mergeStudy(a, b, { strategy: 'merge', now: Date.parse('2026-11-16T09:00:00Z') });

test('pack channels only survives a merge and stays the parent\'s under a parent plan', () => {
    const parentPlan = { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' };
    const mine = { ...local, plan: parentPlan, packChannelsOnly: true };
    assert.equal(merge(mine, { ...remote, packChannelsOnly: false }).packChannelsOnly, true);
    assert.equal(merge({ ...local, packChannelsOnly: true }, { ...remote }).packChannelsOnly, true);
    assert.equal(merge({ ...local, packChannelsOnly: true }, { ...remote, packChannelsOnly: false }).packChannelsOnly, false);
    // Unset on both sides stays unset.
    assert.equal('packChannelsOnly' in merge(local, remote), false);
    // A tighter incoming value is still the parent's call under their plan (the tighten-only gate alone
    // would have let it through).
    const parentMine = { ...local, plan: parentPlan, packChannelsOnly: false };
    assert.equal(merge(parentMine, { ...parentMine, packChannelsOnly: true }).packChannelsOnly, false);
});

test('a sync can\'t change the round and break lengths of a parent\'s plan', () => {
    const plan = { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' };
    const mine = { activePackIds: ['in_gate'], plan, focus: { roundMinutes: 25, breakMinutes: 5 } };
    const theirs = { ...mine, focus: { roundMinutes: 15, breakMinutes: 30 } };
    const held = merge(mine, theirs).focus;
    assert.equal(held.roundMinutes, 25);
    assert.equal(held.breakMinutes, 5);
    // Longer rounds and shorter breaks are tighter, and still the parent's plan's to set.
    const tighter = merge(mine, { ...mine, focus: { roundMinutes: 50, breakMinutes: 3 } }).focus;
    assert.equal(tighter.roundMinutes, 25);
    assert.equal(tighter.breakMinutes, 5);
    const own = { ...mine, plan: { ...plan, setByParentId: null } };
    const followed = merge(own, { ...theirs, plan: own.plan }).focus;
    assert.equal(followed.roundMinutes, 15);
    assert.equal(followed.breakMinutes, 30);
});

test('Move account (carryLock) still brings the other device\'s choices', () => {
    const plan = { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' };
    const mine = { activePackIds: ['in_gate'], plan, focus: { roundMinutes: 25, breakMinutes: 5 }, packChannelsOnly: true };
    const theirs = { activePackIds: ['in_gate'], focus: { roundMinutes: 40, breakMinutes: 10 }, packChannelsOnly: false };
    const moved = Model.mergeStudy(mine, theirs, { strategy: 'merge', carryLock: true });
    assert.equal(moved.focus.roundMinutes, 40);
    assert.equal(moved.packChannelsOnly, false);
});
